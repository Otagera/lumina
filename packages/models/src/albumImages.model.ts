import prisma from "../../config/src/db.config.ts";
import {
	cacheDel,
	cacheDelPattern,
	cacheKeys,
} from "../../utils/src/cache.util.ts";

// Best-effort invalidation for album_images mutations. Looks up the affected
// album(s) once and clears their album/public-album caches plus the owner +
// member user-album list entries. Failures are swallowed.
const invalidateAlbumCachesByAlbumIds = async (albumIds: string[]) => {
	const unique = Array.from(new Set(albumIds.filter(Boolean)));
	if (unique.length === 0) return;
	try {
		const albums = await prisma.albums.findMany({
			where: { album_id: { in: unique } },
			select: {
				album_id: true,
				share_token: true,
				created_by: true,
				album_members: { select: { user_id: true } },
			},
		});
		const tasks: Promise<unknown>[] = [];
		for (const a of albums) {
			tasks.push(cacheDelPattern(cacheKeys.albumPattern(a.album_id)));
			if (a.share_token)
				tasks.push(cacheDelPattern(cacheKeys.publicAlbumPattern(a.share_token)));
			if (a.created_by)
				tasks.push(cacheDel(cacheKeys.userAlbums(a.created_by)));
			for (const m of a.album_members ?? []) {
				if (m.user_id) tasks.push(cacheDel(cacheKeys.userAlbums(m.user_id)));
			}
		}
		if (tasks.length > 0) await Promise.all(tasks);
	} catch {
		// Swallow — cache invalidation must not break mutations.
	}
};

const createAlbumImageLink = async (data) => {
	const result = await prisma.album_images.create({ data });
	if (data?.album_id) await invalidateAlbumCachesByAlbumIds([data.album_id]);
	return result;
};
const createAlbumImageLinks = async (data) => {
	const result = await prisma.album_images.createManyAndReturn({ data });
	const albumIds = Array.isArray(data)
		? (data.map((d: any) => d?.album_id).filter(Boolean) as string[])
		: [];
	await invalidateAlbumCachesByAlbumIds(albumIds);
	return result;
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

	const result = await prisma.album_images.deleteMany({
		where: {
			album_id: albumId,
		},
	});
	await invalidateAlbumCachesByAlbumIds([albumId]);
	return result;
};

const deleteLinksByUserId = async (userId) => {
	if (!userId) {
		throw new Error("User ID is required");
	}

	// Capture affected album ids BEFORE deletion so we can invalidate caches.
	const affectedLinks = await prisma.album_images.findMany({
		where: { images: { uploaded_by: userId } },
		select: { album_id: true },
	});
	const affectedAlbumIds = affectedLinks
		.map((l) => l.album_id)
		.filter((id): id is string => Boolean(id));

	const result = await prisma.album_images.deleteMany({
		where: {
			images: {
				uploaded_by: userId,
			},
		},
	});
	await invalidateAlbumCachesByAlbumIds(affectedAlbumIds);
	return result;
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

	const result = await prisma.album_images.deleteMany({
		where: {
			album_id: albumId,
			image_id: { in: imageIds },
		},
	});
	await invalidateAlbumCachesByAlbumIds([albumId]);
	return result;
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
