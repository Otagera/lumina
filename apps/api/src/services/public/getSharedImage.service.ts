import Joi from "joi";
import prisma from "../../../../../packages/config/src/db.config.ts";
import { NotFoundError } from "../../../../../packages/utils/src/error.util.ts";
import { normalizeImagePath } from "../../../../../packages/utils/src/image.util.ts";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";

const spec = Joi.object({
	share_token: Joi.string().required(),
	image_id: Joi.string().uuid().required(),
});

const aliasSpec = {
	request: { token: "share_token", imageId: "image_id" },
	response: {
		image_id: "imageId",
		image_path: "imagePath",
		storage_provider: "storageProvider",
		storage_key: "storageKey",
		original_width: "original_width",
		original_height: "original_height",
		faces: "faces",
	},
};

const service = async (data: any) => {
	const params = validateSpec(spec, aliaserSpec(aliasSpec.request, data));

	// Verify the image belongs to the shared album
	const album = await prisma.albums.findUnique({
		where: { share_token: params.share_token },
		include: { album_images: { where: { image_id: params.image_id } } },
	});

	if (!album || album.album_images.length === 0) {
		throw new NotFoundError("Image not found in this shared album.");
	}

	const image = await prisma.images.findUnique({
		where: { image_id: params.image_id },
		include: { faces: true },
	});

	if (!image) {
		throw new NotFoundError("Image not found.");
	}

	return aliaserSpec(aliasSpec.response, {
		...image,
		imagePath: normalizeImagePath(
			image.image_path,
			image.storage_provider,
			image.storage_key,
		),
		originalSize: {
			width: image.original_width,
			height: image.original_height,
		},
	});
};

export const getSharedImageService = service;
