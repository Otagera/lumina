import fs from "node:fs/promises";
import { queueServices } from "../../../apps/worker/src/queue/queue.service.ts";
import prisma from "../../config/src/db.config.ts";
import { deleteFile } from "../../utils/src/file.util.ts";
import { logUsage } from "./usage.model.ts";

const uploadImage = async (imageData) => {
	return await prisma.images.create({
		data: imageData,
	});
};

const uploadImages = async (imagesData) => {
	return await prisma.images.createManyAndReturn({
		data: imagesData,
	});
};

const fetchFaces = async ({ image_id, uploaded_by }) => {
	return await prisma.faces.findMany({
		where: {
			image_id,
			images: { uploaded_by },
		},
	});
};

const fetchImage = async (where) => {
	return await prisma.images.findFirst({
		where: {
			...where,
			deleted_at: null,
		},
		include: {
			faces: true,
		},
	});
};

const fetchImagesByIds = async (imageIds) => {
	const images = await prisma.images.findMany({
		where: {
			image_id: {
				in: imageIds,
			},
			deleted_at: null,
		},
		include: {
			faces: true,
		},
	});

	return images.map((image) => ({
		...image,
		original_size: {
			width: image.original_width,
			height: image.original_height,
		},
	}));
};

const fetchImages = async (where) => {
	const images = await prisma.images.findMany({
		where: {
			...where,
			deleted_at: null,
		},
		include: {
			faces: true,
		},
	});

	return images.map((image) => ({
		...image,
		original_size: {
			width: image.original_width,
			height: image.original_height,
		},
	}));
};

const fetchAllImages = async () => {
	const images = await prisma.images.findMany({
		where: { deleted_at: null },
		include: {
			faces: true,
		},
	});

	return images.map((image) => ({
		image_id: image.image_id,
		faces:
			image.faces.length > 0
				? image.faces.map((face) => ({
						face_id: face.face_id,
						bounding_box: face.bounding_box,
					}))
				: [],
		image_path: image.image_path,
		upload_time: image.upload_date,
		original_size: {
			width: image.original_width,
			height: image.original_height,
		},
	}));
};

const softDeleteImagesByIds = async (imageIds: string[]) => {
	return await prisma.images.updateMany({
		where: {
			image_id: { in: imageIds },
		},
		data: {
			deleted_at: new Date(),
		},
	});
};

const restoreImagesByIds = async (imageIds: string[]) => {
	return await prisma.images.updateMany({
		where: {
			image_id: { in: imageIds },
		},
		data: {
			deleted_at: null,
		},
	});
};

const deleteImage = async (where) => {
	const image = await prisma.images.findFirst({ where });
	if (!image) return;

	const transaction = await prisma.$transaction(async (prisma) => {
		await prisma.faces.deleteMany({
			where: {
				image_id: where.image_id,
			},
		});

		await prisma.album_images.deleteMany({
			where: {
				image_id: where.image_id,
			},
		});

		await prisma.images.delete({
			where,
		});

		if (image.uploaded_by && image.size) {
			await logUsage(image.uploaded_by, "storage", "delete", -image.size);
		}

		if (image.uploaded_by && image.optimized_path) {
			try {
				const stats = await fs.stat(image.optimized_path);
				await logUsage(
					image.uploaded_by,
					"storage",
					"delete_optimized",
					-stats.size,
				);
			} catch (_e) {}
		}

		if (image.uploaded_by) {
			await logUsage(image.uploaded_by, "compute", "delete", -1);
		}
	});

	await queueServices.fileDeletionQueueLib.addJob(
		"fileDeletion",
		{
			images: [image],
			albumStorageConfig: null,
			worker: "fileDeletion",
		},
		{ removeOnComplete: { count: 100 }, removeOnFail: { count: 100 } },
	);

	return transaction;
};

const deleteImageById = async (image_id) => {
	const image = await prisma.images.findUnique({ where: { image_id } });
	if (!image) return;

	const transaction = await prisma.$transaction(async (prisma) => {
		await prisma.faces.deleteMany({
			where: {
				image_id,
			},
		});

		await prisma.album_images.deleteMany({
			where: {
				image_id,
			},
		});

		await prisma.images.deleteMany({
			where: {
				image_id,
			},
		});

		if (image.uploaded_by && image.size) {
			await logUsage(image.uploaded_by, "storage", "delete", -image.size);
		}

		if (image.uploaded_by && image.optimized_path) {
			try {
				const stats = await fs.stat(image.optimized_path);
				await logUsage(
					image.uploaded_by,
					"storage",
					"delete_optimized",
					-stats.size,
				);
			} catch (_e) {}
		}

		if (image.uploaded_by) {
			await logUsage(image.uploaded_by, "compute", "delete", -1);
		}
	});

	await queueServices.fileDeletionQueueLib.addJob(
		"fileDeletion",
		{
			images: [image],
			albumStorageConfig: null,
			worker: "fileDeletion",
		},
		{ removeOnComplete: { count: 100 }, removeOnFail: { count: 100 } },
	);

	return transaction;
};

const deleteImagesByIds = async (imageIds) => {
	const images = await prisma.images.findMany({
		where: { image_id: { in: imageIds } },
	});

	const transaction = await prisma.$transaction(async (prisma) => {
		await prisma.faces.deleteMany({
			where: {
				image_id: {
					in: imageIds,
				},
			},
		});

		await prisma.album_images.deleteMany({
			where: {
				image_id: {
					in: imageIds,
				},
			},
		});

		await prisma.images.deleteMany({
			where: {
				image_id: {
					in: imageIds,
				},
			},
		});

		for (const image of images) {
			if (image.uploaded_by && image.size) {
				await logUsage(image.uploaded_by, "storage", "delete", -image.size);
			}

			if (image.uploaded_by && image.optimized_path) {
				try {
					const stats = await fs.stat(image.optimized_path);
					await logUsage(
						image.uploaded_by,
						"storage",
						"delete_optimized",
						-stats.size,
					);
				} catch (_e) {}
			}

			if (image.uploaded_by) {
				await logUsage(image.uploaded_by, "compute", "delete", -1);
			}
		}
	});

	if (images.length > 0) {
		await queueServices.fileDeletionQueueLib.addJob(
			"fileDeletion",
			{
				images,
				albumStorageConfig: null,
				worker: "fileDeletion",
			},
			{ removeOnComplete: { count: 100 }, removeOnFail: { count: 100 } },
		);
	}

	return transaction;
};

const deleteImagesByUserId = async (uploaded_by) => {
	let imagesToDelete = [];
	const transaction = await prisma.$transaction(async (prisma) => {
		imagesToDelete = await prisma.images.findMany({
			where: {
				uploaded_by,
			},
		});

		const imageIdsToDelete = imagesToDelete.map((image) => image.image_id);
		await prisma.faces.deleteMany({
			where: {
				image_id: {
					in: imageIdsToDelete,
				},
			},
		});

		await prisma.images.deleteMany({
			where: {
				image_id: {
					in: imageIdsToDelete,
				},
			},
		});

		for (const image of imagesToDelete) {
			if (image.uploaded_by && image.size) {
				await logUsage(image.uploaded_by, "storage", "delete", -image.size);
			}

			if (image.uploaded_by && image.optimized_path) {
				try {
					const stats = await fs.stat(image.optimized_path);
					await logUsage(
						image.uploaded_by,
						"storage",
						"delete_optimized",
						-stats.size,
					);
				} catch (_e) {}
			}

			if (image.uploaded_by) {
				await logUsage(image.uploaded_by, "compute", "delete", -1);
			}
		}
	});

	if (imagesToDelete.length > 0) {
		await queueServices.fileDeletionQueueLib.addJob(
			"fileDeletion",
			{
				images: imagesToDelete,
				albumStorageConfig: null,
				worker: "fileDeletion",
			},
			{ removeOnComplete: { count: 100 }, removeOnFail: { count: 100 } },
		);
	}

	return transaction;
};

const deleteAllImages = async () => {
	let allImages = [];
	const transaction = await prisma.$transaction(async (prisma) => {
		allImages = await prisma.images.findMany();

		await prisma.faces.deleteMany({});

		await prisma.images.deleteMany({});

		for (const image of allImages) {
			if (image.uploaded_by && image.size) {
				await logUsage(image.uploaded_by, "storage", "delete", -image.size);
			}

			if (image.uploaded_by && image.optimized_path) {
				try {
					const stats = await fs.stat(image.optimized_path);
					await logUsage(
						image.uploaded_by,
						"storage",
						"delete_optimized",
						-stats.size,
					);
				} catch (_e) {}
			}

			if (image.uploaded_by) {
				await logUsage(image.uploaded_by, "compute", "delete", -1);
			}
		}
	});

	if (allImages.length > 0) {
		await queueServices.fileDeletionQueueLib.addJob(
			"fileDeletion",
			{
				images: allImages,
				albumStorageConfig: null,
				worker: "fileDeletion",
			},
			{ removeOnComplete: { count: 100 }, removeOnFail: { count: 100 } },
		);
	}

	return transaction;
};

// Query functions
const fetchImagesByIdsQuery = async (imageIds) => {
	return prisma.$queryRaw`
        SELECT 
            images.image_id,
            COALESCE(
                JSON_AGG(
                    CASE 
                        WHEN faces.face_id IS NOT NULL THEN 
                            JSON_BUILD_OBJECT(
                                'face_id', faces.face_id,
                                'bounding_box', faces.bounding_box::JSONB
                            )
                        ELSE NULL
                    END
                ) FILTER (WHERE faces.face_id IS NOT NULL), 
                '[]'::JSON -- Ensure empty array if no faces exist
            ) AS faces,
            images.image_path,
            images.upload_time,
            images.original_size::JSONB AS original_size
        FROM images
        LEFT JOIN faces ON faces.image_id = images.image_id
        WHERE images.image_id = ANY(${imageIds}) AND images.deleted_at IS NULL
        GROUP BY 
            images.image_id, 
            images.image_path, 
            images.upload_time, 
            images.original_size::JSONB;
  `;
};

const fetchAllImagesQuery = async () => {
	return prisma.$queryRaw`
        SELECT 
            images.image_id,
            COALESCE(
                JSON_AGG(
                    CASE 
                        WHEN faces.face_id IS NOT NULL THEN 
                            JSON_BUILD_OBJECT(
                                'face_id', faces.face_id,
                                'bounding_box', faces.bounding_box::JSONB
                            )
                        ELSE NULL
                    END
                ) FILTER (WHERE faces.face_id IS NOT NULL), 
                '[]'::JSON -- Ensure empty array if no faces exist
            ) AS faces,
            images.image_path,
            images.upload_time,
            images.original_size::JSONB AS original_size
        FROM images
        LEFT JOIN faces ON faces.image_id = images.image_id
        WHERE images.deleted_at IS NULL
        GROUP BY 
            images.image_id, 
            images.image_path, 
            images.upload_time, 
            images.original_size::JSONB;
  `;
};

const deleteImagesByIdsQuery = async (imageIds) => {
	try {
		return await prisma.$transaction([
			prisma.$queryRaw`DELETE FROM "faces" WHERE image_id = ANY(${imageIds}) RETURNING *;`,
			prisma.$queryRaw`DELETE FROM "images" WHERE image_id = ANY(${imageIds}) RETURNING *;`,
		]);
	} finally {
	}
};

const deleteAllImagesQuery = async (userId: string) => {
	try {
		// Only delete images belonging to the user
		const images = await prisma.images.findMany({
			where: { uploaded_by: userId },
		});
		const imageIds = images.map((i) => i.image_id);

		return await prisma.$transaction([
			prisma.faces.deleteMany({ where: { image_id: { in: imageIds } } }),
			prisma.images.deleteMany({ where: { image_id: { in: imageIds } } }),
		]);
	} finally {
	}
};

const moderateImagesQuery = async (
	imageIds: string[],
	status: string,
	reason?: string,
) => {
	const data: any = { status };
	if (reason) data.rejection_reason = reason;

	return await prisma.images.updateMany({
		where: {
			image_id: {
				in: imageIds,
			},
		},
		data,
	});
};

export {
	uploadImage,
	uploadImages,
	fetchFaces,
	fetchImage,
	fetchImagesByIds,
	fetchImages,
	fetchAllImages,
	softDeleteImagesByIds,
	restoreImagesByIds,
	deleteImage,
	deleteImageById,
	deleteImagesByIds,
	deleteImagesByUserId,
	deleteAllImages,
	fetchImagesByIdsQuery,
	fetchAllImagesQuery,
	deleteImagesByIdsQuery,
	deleteAllImagesQuery,
	moderateImagesQuery,
};

export const cleanupImageSideEffects = async (images: any[]) => {
	for (const image of images) {
		if (image.uploaded_by && image.size) {
			await logUsage(image.uploaded_by, "storage", "delete", -image.size);
		}
		if (image.uploaded_by && image.optimized_path) {
			try {
				const stats = await fs.stat(image.optimized_path);
				await logUsage(
					image.uploaded_by,
					"storage",
					"delete_optimized",
					-stats.size,
				);
			} catch (_e) {}
		}
		if (image.uploaded_by) {
			await logUsage(image.uploaded_by, "compute", "delete", -1);
		}
	}
};

export const deleteImagesWithLogging = async (imageIds: string[]) => {
	const images = await prisma.images.findMany({
		where: { image_id: { in: imageIds } },
	});

	if (images.length === 0) return;

	await prisma.images.deleteMany({
		where: { image_id: { in: imageIds } },
	});

	await cleanupImageSideEffects(images);
};
