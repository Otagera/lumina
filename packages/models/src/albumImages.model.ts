import prisma from "../../config/src/db.config.ts";

const createAlbumImageLink = async (data) => {
	return await prisma.album_images.create({ data });
};
const createAlbumImageLinks = async (data) => {
	return await prisma.album_images.createManyAndReturn({ data });
};

const fetchAlbumImage = async (where) => {
	return await prisma.album_images.findFirst({
		where,
		include: {
			images: {
				include: {
					faces: true,
				},
			},
		},
	});
};

const fetchAlbumImages = async (where, options = {}) => {
	const { take, skip, cursor, orderBy } = options;
	return await prisma.album_images.findMany({
		where: {
			...where,
			images: {
				...where.images,
				deleted_at: null,
			},
		},
		include: {
			images: {
				include: {
					faces: true,
					users: {
						select: {
							user_id: true,
							email: true,
						},
					},
				},
			},
		},
		take: take ? Number(take) : undefined,
		skip: skip ? Number(skip) : undefined,
		cursor,
		orderBy,
	});
};

const deleteLinksByAlbumId = async (albumId) => {
	if (!albumId) {
		throw new Error("Album ID is required");
	}
	const albumLinks = await fetchAlbumImages({ album_id: albumId });
	if (!albumLinks) {
		throw new Error("No album links found for the given album ID");
	}

	return await prisma.album_images.deleteMany({
		where: {
			album_id: albumId,
		},
	});
};

const deleteLinksByUserId = async (userId) => {
	if (!userId) {
		throw new Error("User ID is required");
	}

	return await prisma.album_images.deleteMany({
		where: {
			images: {
				uploaded_by: userId,
			},
		},
	});
};

const deleteLinksByAlbumIdAndImageIds = async (albumId, imageIds) => {
	if (!albumId) {
		throw new Error("Album ID is required");
	}
	if (!imageIds && imageIds.length === 0) {
		throw new Error("Image IDs are required");
	}
	const albumLinks = await prisma.album_images.findMany({
		where: { album_id: albumId, image_id: { in: imageIds } },
		include: {
			images: true,
		},
	});
	if (!albumLinks) {
		throw new Error("No album links found for the given IDs");
	}

	return await prisma.album_images.deleteMany({
		where: {
			album_id: albumId,
			image_id: { in: imageIds },
		},
	});
};

export {
	createAlbumImageLink,
	createAlbumImageLinks,
	fetchAlbumImage,
	fetchAlbumImages,
	deleteLinksByAlbumId,
	deleteLinksByUserId,
	deleteLinksByAlbumIdAndImageIds,
};
