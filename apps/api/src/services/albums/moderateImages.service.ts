import Joi from "joi";
import prisma from "../../../../../packages/config/src/db.config.ts";
import { moderateImagesQuery } from "../../../../../packages/models/src/images.model.ts";
import { NotFoundError } from "../../../../../packages/utils/src/error.util.ts";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";
import { dispatchWebhook } from "../webhook/webhook.service.ts";

const spec = Joi.object({
	albumId: Joi.string().uuid().required(),
	imageIds: Joi.array().items(Joi.string().uuid()).required(),
	status: Joi.string().valid("APPROVED", "REJECTED").required(),
	reason: Joi.string().optional(),
});

const service = async (data: any) => {
	const params = validateSpec(spec, data);

	// Verify images belong to the album
	const albumImages = await prisma.album_images.findMany({
		where: {
			album_id: params.albumId,
			image_id: { in: params.imageIds },
		},
	});

	const validImageIds = albumImages.map((ai) => ai.image_id);

	if (validImageIds.length === 0) {
		throw new NotFoundError(
			"No valid images found in this album for moderation.",
		);
	}

	const result = await moderateImagesQuery(
		validImageIds,
		params.status,
		params.reason,
	);

	// Dispatch webhooks for each moderated image
	for (const imageId of validImageIds) {
		await dispatchWebhook(params.albumId, `IMAGE_${params.status}`, {
			imageId,
			status: params.status,
			albumId: params.albumId,
			reason: params.reason,
		});
	}

	return {
		count: result.count,
		status: params.status,
	};
};

export const moderateImagesService = service;
