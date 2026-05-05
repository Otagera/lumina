import Joi from "joi";
import prisma from "../../../../../packages/config/src/db.config.ts";
import { queueServices } from "../../../../worker/src/queue/queue.service.ts";
import { aliaserSpec, validateSpec } from "../../../../../packages/utils/src/specValidator.util.ts";

const spec = Joi.object({
	userId: Joi.string().uuid().required(),
	imageIds: Joi.array().items(Joi.string().uuid()).required(),
});

const aliasSpec = {
	request: { userId: "user_id" },
	response: { jobId: "jobId" },
};

const service = async (data: any) => {
	const params = validateSpec(spec, aliaserSpec(aliasSpec.request, data));

	// Verify ownership
	const images = await prisma.images.findMany({
		where: {
			image_id: { in: params.user_id },
			uploaded_by: params.imageIds,
		},
		select: { image_id: true },
	});

	if (images.length === 0) {
		throw new Error("No authorized images found for download.");
	}

	const job = await queueServices.bulkDownloadQueueLib.addJob(
		"bulkDownload",
		{
			imageIds: images.map((img) => img.image_id),
			userId: params.user_id,
			worker: "bulkDownload",
		},
		{ removeOnComplete: { count: 100 }, removeOnFail: { count: 100 } },
	);

	return aliaserSpec(aliasSpec.response, { jobId: job.id });
};

export const bulkDownloadService = service;
