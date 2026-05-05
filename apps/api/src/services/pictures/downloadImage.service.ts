import Joi from "joi";
import prisma from "../../../../../packages/config/src/db.config.ts";
import { NotFoundError } from "../../../../../packages/utils/src/error.util.ts";
import { storage } from "../../../../../packages/utils/src/storage.util.ts";
import { aliaserSpec, validateSpec } from "../../../../../packages/utils/src/specValidator.util.ts";

const spec = Joi.object({
	imageId: Joi.string().uuid().required(),
	userId: Joi.string().uuid().required(),
});

const aliasSpec = {
	request: { imageId: "image_id", userId: "user_id" },
	response: { downloadUrl: "downloadUrl" },
};

const service = async (data: any) => {
	const params = validateSpec(spec, aliaserSpec(aliasSpec.request, data));

	// Verify ownership
	const image = await prisma.images.findFirst({
		where: { image_id: params.image_id, uploaded_by: params.user_id },
	});

	if (!image) {
		throw new NotFoundError("Image not found or unauthorized.");
	}

	// Generate presigned URL
	const downloadUrl = await storage.getSignedUrl(
		image.storage_key || image.image_path,
		3600,
	);

	// Track download for analytics
	try {
		await prisma.usage_logs.create({
			data: {
				user_id: params.user_id,
				resource: "download",
				operation: "single_image_download",
				quantity: 1,
			},
		});
	} catch (e) {
		// Ignore logging errors
	}

	return aliaserSpec(aliasSpec.response, { downloadUrl });
};

export const downloadImageService = service;
