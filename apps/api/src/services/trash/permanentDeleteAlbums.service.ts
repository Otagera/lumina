import Joi from "joi";
import prisma from "../../../../../packages/config/src/db.config.ts";
import { cleanupImageSideEffects } from "../../../../../packages/models/src/images.model.ts";
import { aliaserSpec, validateSpec } from "../../../../../packages/utils/src/specValidator.util.ts";

const spec = Joi.object({
	userId: Joi.string().uuid().required(),
	albumIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
});

const aliasSpec = {
	request: { userId: "user_id" },
	response: { deletedAlbums: "deletedAlbums", deletedImages: "deletedImages" },
};

const service = async (data: any) => {
	const aliasReq = aliaserSpec(aliasSpec.request, data);
	const params = validateSpec(spec, aliasReq);

	// Fetch albums to be permanently deleted
	const albumsToDelete = await prisma.albums.findMany({
		where: {
			album_id: { in: params.albumIds },
			created_by: params.user_id,
			deleted_at: { not: null },
		},
	});

	if (albumsToDelete.length === 0) {
		throw new Error("No albums found to permanently delete");
	}

	// Get all images in these albums
	const albumImages = await prisma.album_images.findMany({
		where: { album_id: { in: params.albumIds } },
		select: { image_id: true },
	});

	const imageIds = albumImages
		.map((ai) => ai.image_id)
		.filter((id) => id !== null) as string[];

	// Get full image data for usage logging
	let images: any[] = [];
	if (imageIds.length > 0) {
		images = await prisma.images.findMany({
			where: { image_id: { in: imageIds } },
		});
	}

	// Credit usage for images before deleting
	if (images.length > 0) {
		await cleanupImageSideEffects(images);
	}

	// Permanently delete the albums (cascade will handle album_images)
	await prisma.albums.deleteMany({
		where: { album_id: { in: params.albumIds } },
	});

	return {
		deletedAlbums: albumsToDelete.length,
		deletedImages: images.length,
	};
};

export const permanentDeleteAlbumsService = service;
