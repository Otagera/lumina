import prisma from "../../../../../packages/config/src/db.config.ts";
import {
	createAlbumImageLink,
	createAlbumImageLinks,
	deleteLinksByAlbumIdAndImageIds,
	fetchAlbumImage,
	fetchAlbumImages,
} from "../../../../../packages/models/src/albumImages.model.ts";
import {
	createNewAlbum,
	deleteAlbumById,
	deleteAlbumsByUserId,
	fetchAlbum,
	fetchAlbumsByUserids,
	restoreAlbumById,
	softDeleteAlbumById,
	updateExistingAlbum,
} from "../../../../../packages/models/src/albums.model.ts";
import {
	fetchImage,
	fetchImagesByIds,
} from "../../../../../packages/models/src/images.model.ts";
import { NotFoundError } from "../../../../../packages/utils/src/error.util.ts";

const albumLinkValidation = async (
	albumLinkData,
	options = { check_image_id: true, check_image_ids: true },
) => {
	const { check_image_id, check_image_ids } = options;
	if (!albumLinkData.album_id) {
		throw new Error("Album Id: album_id is required");
	}
	if (check_image_id && !albumLinkData.image_id) {
		throw new Error("Image Id: image_id is required");
	}
	if (
		check_image_ids &&
		(!albumLinkData.image_ids || albumLinkData.image_ids.length === 0)
	) {
		throw new Error("Image Ids: image_ids is required");
	}
	if (!albumLinkData.user_id) {
		throw new Error("Creator: user_id is required");
	}
	const { image_id, image_ids, album_id, user_id } = albumLinkData;

	if (check_image_id) {
		const image = await fetchImage({ image_id, uploaded_by: user_id });
		if (!image) {
			throw new NotFoundError("Image not found.");
		}
	}
	if (check_image_ids) {
		const images = await fetchImagesByIds(image_ids);
		if (!images || images.length === 0) {
			throw new NotFoundError("Images not found.");
		}
	}

	const album = await getAlbumForUser(album_id, user_id);
	if (!album) {
		throw new NotFoundError("Album not found.");
	}
};

export const createAlbum = async (albumData) => {
	if (!albumData.album_name) {
		throw new Error("Album name: album_name is required");
	}
	if (!albumData.created_by) {
		throw new Error("Creator: created_by is required");
	}
	return await createNewAlbum(albumData);
};

export const createAlbumLink = async (albumLinkData) => {
	await albumLinkValidation(albumLinkData, { check_image_id: false });
	const { image_id, album_id } = albumLinkData;

	return await createAlbumImageLink({ image_id, album_id });
};

export const createAlbumLinks = async (albumLinkData) => {
	await albumLinkValidation(albumLinkData, { check_image_id: false });
	const { image_ids, album_id } = albumLinkData;
	const data = image_ids.map((image_id) => ({
		image_id,
		album_id,
	}));
	return await createAlbumImageLinks(data);
};

export const updateAlbum = async (album_id, created_by, albumData) => {
	if (!album_id) {
		throw new Error("Album id: album_id is required");
	}
	if (!created_by) {
		throw new Error("Creator: created_by is required");
	}
	if (!albumData) {
		throw new Error("Album data: albumData is required");
	}
	return await updateExistingAlbum(album_id, created_by, albumData);
};

export const getAlbums = async (albumIds) => {
	if (!albumIds) {
		throw new Error("Album ids: albumIds is required");
	}
	if (!Array.isArray(albumIds)) {
		return fetchAlbumsByUserids([albumIds]);
	}
	return fetchAlbumsByUserids(albumIds);
};

export const getAlbumsForUser = async (userId) => {
	if (!userId) {
		throw new Error("User id: userId is required");
	}

	const ownedAlbums = await fetchAlbumsByUserids([userId]);

	const memberAlbums = await prisma.album_members.findMany({
		where: { user_id: userId },
		select: { album_id: true },
	});

	const memberAlbumIds = memberAlbums.map((m) => m.album_id);

	let invitedAlbums = [];
	if (memberAlbumIds.length > 0) {
		invitedAlbums = await prisma.albums.findMany({
			where: { album_id: { in: memberAlbumIds } },
			include: {
				settings: true,
				storage_config: true,
				album_members: {
					include: {
						user: {
							select: { user_id: true, email: true },
						},
					},
				},
				cover_image: true,
				album_images: {
					take: 4,
					include: { images: true },
				},
			},
		});

		invitedAlbums = invitedAlbums.filter((a) => !a.deleted_at);
	}

	const allAlbums = [...ownedAlbums, ...invitedAlbums];
	const uniqueAlbums = allAlbums.filter(
		(album, index, self) =>
			index === self.findIndex((a) => a.album_id === album.album_id),
	);

	return uniqueAlbums;
};

export const getAlbum = async (where) => {
	if (!where) {
		throw new Error("No where clause provided");
	}
	if (!where.created_by && !where.album_id) {
		throw new Error("No created_by or album_id provided");
	}

	try {
		const album = await fetchAlbum(where);
		if (!album) {
			throw new NotFoundError("Album not found.");
		}
		return album;
	} catch (error: any) {
		if (error.message === "Album not found." || error.statusCode === 404) {
			throw new NotFoundError("Album not found.");
		}
		throw error;
	}
};

export const getAlbumForUser = async (albumId: string, userId: string) => {
	if (!albumId) {
		throw new Error("Album id: albumId is required");
	}
	if (!userId) {
		throw new Error("User id: userId is required");
	}

	const album = await prisma.albums.findFirst({
		where: { album_id: albumId, deleted_at: null },
		include: {
			settings: true,
			storage_config: true,
			album_members: {
				include: {
					user: {
						select: { user_id: true, email: true },
					},
				},
			},
			cover_image: true,
			album_images: {
				take: 4,
				include: { images: true },
			},
		},
	});

	if (!album) {
		throw new NotFoundError("Album not found.");
	}

	const isOwner = album.created_by === userId;
	const isMember = album.album_members?.some((m) => m.user_id === userId);

	if (!isOwner && !isMember) {
		throw new NotFoundError("Album not found.");
	}

	return album;
};

export const getAlbumLinkNoError = async (where) => {
	await albumLinkValidation(where);

	const { image_id, album_id } = where;
	const album = fetchAlbumImage({ album_id, image_id });

	return album;
};

export const getAlbumLink = async (where) => {
	albumLinkValidation(where);

	const { image_id, album_id } = where;
	const album = fetchAlbumImage({ album_id, image_id });

	if (!album) {
		throw new NotFoundError("Album Image not found.");
	}
	return album;
};

export const getAlbumLinksNoError = async (where) => {
	await albumLinkValidation(where, {
		check_image_id: false,
		check_image_ids: true,
	});

	const { image_ids, album_id } = where;
	const album = fetchAlbumImages({
		album_id,
		image_id: {
			in: image_ids,
		},
	});

	return album;
};

export const getAlbumLinks = async (where, options = {}) => {
	await albumLinkValidation(where, { check_image_id: false });

	const {
		image_id,
		album_id,
		status,
		startDate,
		endDate,
		uploaderId,
		minFaces,
	} = where;

	const filter: any = { album_id, image_id };

	// Complex image filters
	const imageFilter: any = { deleted_at: null };

	if (status) imageFilter.status = status;
	if (uploaderId) imageFilter.uploaded_by = uploaderId;

	if (startDate || endDate) {
		imageFilter.upload_date = {};
		if (startDate) imageFilter.upload_date.gte = new Date(startDate);
		if (endDate) imageFilter.upload_date.lte = new Date(endDate);
	}

	if (minFaces !== undefined) {
		imageFilter.faces = {
			_count: {
				gte: Number.parseInt(String(minFaces), 10),
			},
		};
	}

	filter.images = imageFilter;

	const album = await fetchAlbumImages(filter, options);

	if (!album || !album.length) {
		return [];
	}
	return album;
};

export const getAlbumLinksForDelete = async (where) => {
	// image_ids, album_id, user_id
	await albumLinkValidation(where, {
		check_image_id: false,
		check_image_ids: true,
	});

	const { image_ids, album_id } = where;
	const album = await fetchAlbumImages({
		album_id,
		image_id: { in: image_ids },
	});

	if (!album || !album.length) {
		return [];
	}
	return album;
};

export const deleteAlbum = async (album_id, created_by) => {
	if (!album_id) {
		throw new Error(`Album id: ${album_id} is required`);
	}
	if (!created_by) {
		throw new Error(`User id: ${created_by} is required`);
	}
	return await softDeleteAlbumById(album_id, created_by);
};

export const restoreAlbum = async (album_id, created_by) => {
	return await restoreAlbumById(album_id, created_by);
};

export const deleteAlbums = async (created_by) => {
	if (!created_by) {
		throw new Error(`User id: ${created_by} is required`);
	}
	await deleteAlbumsByUserId(created_by);
};
export const deleteAlbumImages = async (albumId, imageIds) => {
	return await deleteLinksByAlbumIdAndImageIds(albumId, imageIds);
};
