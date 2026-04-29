import { queueServices } from "../../../apps/worker/src/queue/queue.service.ts";
import prisma from "../../config/src/db.config.ts";
import { deleteFile } from "../../utils/src/file.util.ts";
import {
	cleanupImageSideEffects,
	deleteImagesWithLogging,
} from "./images.model.ts";

const createNewAlbum = async (data) => {
	return await prisma.albums.create({
		data: {
			...data,
			settings: {
				create: {}, // Initialize with default settings
			},
		},
		include: {
			settings: true,
			storage_config: true,
		},
	});
};

const updateExistingAlbum = async (album_id, created_by, userData) => {
	const { settings, ...albumData } = userData;
	return await prisma.albums.update({
		where: {
			album_id,
			created_by,
		},
		data: {
			...albumData,
			settings: settings
				? {
						upsert: {
							create: settings,
							update: settings,
						},
					}
				: undefined,
		},
		include: {
			settings: true,
			storage_config: true,
			cover_image: true,
		},
	});
};

const fetchAlbum = async (where) => {
	const album = await prisma.albums.findUnique({
		where: {
			...where,
			deleted_at: null,
		},
		include: {
			settings: true,
			storage_config: true,
			album_members: {
				include: {
					user: {
						select: {
							user_id: true,
							email: true,
						},
					},
				},
			},
			cover_image: {
				where: { deleted_at: null },
			},
		},
	});

	if (album && album.cover_image_id && !album.cover_image) {
		await prisma.albums.update({
			where: { album_id: album.album_id },
			data: { cover_image_id: null },
		});
		album.cover_image_id = null;
	}

	return album;
};

const fetchAlbumsByIds = async (albumIds) => {
	return await prisma.albums.findMany({
		where: {
			album_id: {
				in: albumIds,
			},
			deleted_at: null,
		},
		include: {
			settings: true,
			storage_config: true,
			cover_image: true,
		},
	});
};

const fetchAlbumsByUserids = async (userIds) => {
	return await prisma.albums.findMany({
		where: {
			OR: [
				{ created_by: { in: userIds } },
				{ album_members: { some: { user_id: { in: userIds } } } },
			],
			deleted_at: null,
		},
		include: {
			album_members: true,
			settings: true,
			storage_config: true,
			cover_image: true,
			_count: {
				select: { album_images: true },
			},
			album_images: {
				take: 4,
				include: {
					images: true,
				},
				where: {
					images: {
						deleted_at: null,
					},
				},
				orderBy: {
					images: {
						upload_date: "desc",
					},
				},
			},
		},
		orderBy: {
			creation_date: "desc",
		},
	});
};

const fetchAllAlbums = async () => {
	return await prisma.albums.findMany({
		where: { deleted_at: null },
	});
};

const softDeleteAlbumById = async (albumId: string, userId: string) => {
	return await prisma.albums.update({
		where: {
			album_id: albumId,
			created_by: userId,
		},
		data: {
			deleted_at: new Date(),
		},
	});
};

const restoreAlbumById = async (albumId: string, userId: string) => {
	return await prisma.albums.update({
		where: {
			album_id: albumId,
			created_by: userId,
		},
		data: {
			deleted_at: null,
		},
	});
};

const deleteAlbumById = async (albumId, userId) => {
	// Find all images linked to this album first
	const albumLinks = await prisma.album_images.findMany({
		where: { album_id: albumId },
	});

	const imageIds = albumLinks
		.map((link) => link.image_id)
		.filter((id) => id !== null) as string[];

	let images = [] as any[];
	let albumStorageConfig = null;

	if (imageIds.length > 0) {
		images = await prisma.images.findMany({
			where: { image_id: { in: imageIds } },
		});

		// Grab the storage config for the album in case it's a BYOS bucket
		const album = await prisma.albums.findUnique({
			where: { album_id: albumId },
			include: { storage_config: true },
		});
		if (album?.storage_config) {
			albumStorageConfig = album.storage_config;
		}
	}

	const transaction = await prisma.$transaction(async (tx) => {
		if (imageIds.length > 0) {
			// Delete faces
			await tx.faces.deleteMany({
				where: { image_id: { in: imageIds } },
			});

			// Delete album links
			await tx.album_images.deleteMany({
				where: { album_id: albumId },
			});

			// Delete images
			await tx.images.deleteMany({
				where: { image_id: { in: imageIds } },
			});
		}

		// Finally delete the album
		const existingAlbum = await tx.albums.findUnique({
			where: { album_id: albumId },
		});
		if (!existingAlbum) {
			return null;
		}
		return await tx.albums.delete({
			where: {
				album_id: albumId,
				created_by: userId,
			},
		});
	});

	// Handle side effects outside the transaction
	if (images.length > 0) {
		await cleanupImageSideEffects(images);

		// Queue background deletion of physical files (local and cloud)
		await queueServices.fileDeletionQueueLib.addJob(
			"fileDeletion",
			{
				images,
				albumStorageConfig,
				worker: "fileDeletion",
			},
			{ removeOnComplete: { count: 100 }, removeOnFail: { count: 100 } },
		);
	}

	return transaction;
};
const deleteAlbumsByIds = async (albumIds) => {
	const transaction = await prisma.$transaction(async (prisma) => {
		await prisma.albums.deleteMany({
			where: {
				album_id: {
					in: albumIds,
				},
			},
		});
	});

	return transaction;
};

const deleteAlbumsByUserId = async (userId) => {
	// Find all albums created by the user
	const albumsToDelete = await prisma.albums.findMany({
		where: {
			created_by: userId,
		},
	});

	const albumIdsToDelete = albumsToDelete.map((album) => album.album_id);

	// Find all album_images associated with the albums
	const albumImagesToDelete = await prisma.album_images.findMany({
		where: {
			album_id: { in: albumIdsToDelete },
		},
	});

	// Extract image IDs from the album_images to delete
	const imageIdsToDelete = albumImagesToDelete
		.map((albumImage) => albumImage.image_id)
		.filter((imageId) => imageId !== null) as string[];

	let images = [] as any[];
	const albumStorageConfigs = new Map();

	if (imageIdsToDelete.length > 0) {
		images = await prisma.images.findMany({
			where: { image_id: { in: imageIdsToDelete } },
		});

		// Grab storage configs for all albums being deleted
		const albumsWithConfigs = await prisma.albums.findMany({
			where: { album_id: { in: albumIdsToDelete } },
			include: { storage_config: true },
		});

		for (const album of albumsWithConfigs) {
			if (album.storage_config) {
				albumStorageConfigs.set(album.album_id, album.storage_config);
			}
		}
	}

	const transaction = await prisma.$transaction(async (tx) => {
		if (imageIdsToDelete.length > 0) {
			await tx.faces.deleteMany({
				where: {
					image_id: {
						in: imageIdsToDelete,
					},
				},
			});

			await tx.album_images.deleteMany({
				where: {
					image_id: {
						in: imageIdsToDelete,
					},
				},
			});

			await tx.images.deleteMany({
				where: {
					image_id: {
						in: imageIdsToDelete,
					},
				},
			});
		}

		await tx.albums.deleteMany({
			where: {
				album_id: {
					in: albumIdsToDelete,
				},
			},
		});
	});

	// Handle side effects outside the transaction
	if (images.length > 0) {
		await cleanupImageSideEffects(images);

		// Group images by their album to queue deletion properly with correct credentials
		const imagesByAlbum = images.reduce((acc, img) => {
			// Find which album this image belonged to from albumImagesToDelete
			const link = albumImagesToDelete.find(
				(ai) => ai.image_id === img.image_id,
			);
			const albumId = link ? link.album_id : "unknown";
			if (!acc[albumId]) acc[albumId] = [];
			acc[albumId].push(img);
			return acc;
		}, {});

		for (const [albumId, albumImgs] of Object.entries(imagesByAlbum)) {
			await queueServices.fileDeletionQueueLib.addJob(
				"fileDeletion",
				{
					images: albumImgs,
					albumStorageConfig: albumStorageConfigs.get(albumId) || null,
					worker: "fileDeletion",
				},
				{ removeOnComplete: { count: 100 }, removeOnFail: { count: 100 } },
			);
		}
	}

	return transaction;
};

const deleteAllAlbums = async () => {
	const transaction = await prisma.$transaction(async (prisma) => {
		await prisma.albums.deleteMany({});
	});

	return transaction;
};

export {
	createNewAlbum,
	updateExistingAlbum,
	fetchAlbum,
	fetchAlbumsByIds,
	fetchAlbumsByUserids,
	fetchAllAlbums,
	softDeleteAlbumById,
	restoreAlbumById,
	deleteAlbumById,
	deleteAlbumsByIds,
	deleteAlbumsByUserId,
	deleteAllAlbums,
};
