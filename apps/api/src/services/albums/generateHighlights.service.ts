import Joi from "joi";
import prisma from "../../../../../packages/config/src/db.config.ts";
import {
	BadRequestError,
	ForbiddenError,
	NotFoundError,
} from "../../../../../packages/utils/src/error.util.ts";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";
import { queueServices } from "../../../../worker/src/queue/queue.service.ts";

const spec = Joi.object({
	album_id: Joi.string().uuid().required(),
	user_id: Joi.string().uuid().required(),
});

const aliasSpec = {
	request: { albumId: "album_id", userId: "user_id" },
	response: {},
};

const MIN_IMAGES = 20;

const service = async (data: any) => {
	const params = validateSpec(spec, aliaserSpec(aliasSpec.request, data));

	const album = await prisma.albums.findUnique({
		where: { album_id: params.album_id },
		include: {
			_count: { select: { album_images: true } },
		},
	});

	if (!album) throw new NotFoundError("Album not found.");
	if (album.created_by !== params.user_id) {
		throw new ForbiddenError("Not authorized.");
	}
	if (album._count.album_images < MIN_IMAGES) {
		throw new BadRequestError(`Album needs at least ${MIN_IMAGES} photos to generate highlights.`);
	}

	await queueServices.defaultQueueLib.addJob(
		"highlightsGeneration",
		{ albumId: params.album_id, worker: "highlightsGeneration" },
		{ removeOnComplete: { count: 50 }, removeOnFail: { count: 50 } },
	);

	return { jobQueued: true };
};

export const generateHighlightsService = service;
