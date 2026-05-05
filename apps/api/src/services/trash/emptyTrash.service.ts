import prisma from "../../../../../packages/config/src/db.config.ts";
import { cleanupImageSideEffects } from "../../../../../packages/models/src/images.model.ts";
import Joi from "joi";
import { aliaserSpec, validateSpec } from "../../../../../packages/utils/src/specValidator.util.ts";

const spec = Joi.object({
	userId: Joi.string().uuid().required(),
});

const aliasSpec = {
	request: { userId: "user_id" },
	response: { deletedAlbums: "deletedAlbums", deletedImages: "deletedImages" },
};

const service = async (data: any) => {
	const aliasReq = aliaserSpec(aliasSpec.request, data);
	const params = validateSpec(spec, aliasReq);

	// Get all soft-deleted albums for user
	const deletedAlbums = await prisma.albums.findMany({
		where: {
			created_by: params.user_id,
			deleted_at: { not: null },
		},
	});

	const albumIds = deletedAlbums.map((a) => a.album_id);

	// Get all images in these albums
	let imageIds: string[] = [];
	if (albumIds.length > 0) {
		const albumImages = await prisma.album_images.findMany({
			where: { album_id: { in: albumIds } },
			select: { image_id: true },
		});
		imageIds = albumImages
			.map((ai) => ai.image_id)
			.filter((id) => id !== null) as string[];
	}

	// Also get soft-deleted standalone images
	const standaloneImages = await prisma.images.findMany({
		where: {
			uploaded_by: params.user_id,
			deleted_at: { not: null },
		},
		select: { image_id: true },
	});
	const standaloneImageIds = standaloneImages.map((img) => img.image_id);
	imageIds = [...imageIds, ...standaloneImageIds];

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

	// Permanently delete all
	if (albumIds.length > 0) {
		await prisma.albums.deleteMany({
			where: { album_id: { in: albumIds } },
		});
	}

	if (imageIds.length > 0) {
		await prisma.images.deleteMany({
			where: { image_id: { in: imageIds } },
		});
	}

	return {
		deletedAlbums: deletedAlbums.length,
		deletedImages: images.length,
	};
};

export const emptyTrashService = service;
