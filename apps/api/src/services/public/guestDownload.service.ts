import Joi from "joi";
import prisma from "../../../../../packages/config/src/db.config.ts";
import {
	ForbiddenError,
	NotFoundError,
} from "../../../../../packages/utils/src/error.util.ts";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";
import { storage } from "../../../../../packages/utils/src/storage.util.ts";
import { normalizeImagePath } from "../../../../../packages/utils/src/image.util.ts";

const spec = Joi.object({
	token: Joi.string().required(),
	imageIds: Joi.array().items(Joi.string().uuid()).min(1).max(100).required(),
});

const aliasSpec = {
	request: {},
	response: {},
};

const service = async (data: any) => {
	const params = validateSpec(spec, aliaserSpec(aliasSpec.request, data));

	const album = await prisma.albums.findUnique({
		where: { share_token: params.token },
		include: { settings: true },
	});

	if (!album) throw new NotFoundError("Album not found.");

	const settings = album.settings;
	if (!settings?.allow_downloads) {
		throw new ForbiddenError("Downloads are not enabled for this album.");
	}

	// Verify all imageIds belong to this album
	const albumImages = await prisma.album_images.findMany({
		where: {
			album_id: album.album_id,
			image_id: { in: params.imageIds },
		},
		include: {
			images: {
				select: {
					image_id: true,
					image_path: true,
					optimized_path: true,
					storage_provider: true,
					storage_key: true,
					status: true,
				},
			},
		},
	});

	const approvedImages = albumImages
		.map((ai) => ai.images)
		.filter((img) => img && img.status === "APPROVED") as any[];

	if (approvedImages.length === 0) {
		throw new NotFoundError("No downloadable images found.");
	}

	const urls = await Promise.all(
		approvedImages.map(async (img) => {
			// Prefer signed URL from storage provider; fall back to normalized path
			let url: string;
			if (img.storage_key) {
				try {
					url = await storage.getSignedUrl(img.storage_key, 3600);
				} catch {
					url = normalizeImagePath(img.image_path, img.storage_provider, img.storage_key);
				}
			} else {
				url = normalizeImagePath(img.image_path, img.storage_provider, img.storage_key);
			}
			return { imageId: img.image_id, url };
		}),
	);

	return { urls };
};

export const guestDownloadService = service;
