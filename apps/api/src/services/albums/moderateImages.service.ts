import Joi from "joi";
import prisma from "../../../../../packages/config/src/db.config.ts";
import { moderateImagesQuery } from "../../../../../packages/models/src/images.model.ts";
import {
	cacheDelPattern,
	cacheKeys,
} from "../../../../../packages/utils/src/cache.util.ts";
import { NotFoundError } from "../../../../../packages/utils/src/error.util.ts";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";
import { dispatchWebhook } from "../webhook/webhook.service.ts";

const spec = Joi.object({
	album_id: Joi.string().uuid().required(),
	image_ids: Joi.array().items(Joi.string().uuid()).required(),
	status: Joi.string().valid("APPROVED", "REJECTED").required(),
	reason: Joi.string().optional(),
});

const aliasSpec = {
	request: { albumId: "album_id", imageIds: "image_ids" },
	response: { count: "count", status: "status" },
};

const service = async (data: any) => {
	const params = validateSpec(spec, aliaserSpec(aliasSpec.request, data));

	// Verify images belong to the album
	const albumImages = await prisma.album_images.findMany({
		where: {
			album_id: params.album_id,
			image_id: { in: params.image_ids },
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
		await dispatchWebhook(params.album_id, `IMAGE_${params.status}`, {
			imageId,
			status: params.status,
			albumId: params.album_id,
			reason: params.reason,
		});
	}

	prisma.albums
		.findUnique({ where: { album_id: params.album_id }, select: { share_token: true } })
		.then((a) => { if (a?.share_token) cacheDelPattern(cacheKeys.publicAlbumPattern(a.share_token)); })
		.catch(() => {});

	return aliaserSpec(aliasSpec.response, {
		count: result.count,
		status: params.status,
	});
};

export const moderateImagesService = service;
