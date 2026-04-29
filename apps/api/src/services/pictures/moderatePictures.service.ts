import Joi from "joi";
import prisma from "../../../../../packages/config/src/db.config.ts";
import { moderateImagesQuery } from "../../../../../packages/models/src/images.model.ts";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";
import { queueServices } from "../../../../worker/src/queue/queue.service.ts";

const spec = Joi.object({
	imageIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
	status: Joi.string().valid("APPROVED", "REJECTED").required(),
});

const aliasSpec = {
	request: {
		imageIds: "imageIds",
		status: "status",
	},
	response: {
		count: "count",
	},
};

const service = async (data: any) => {
	const aliasReq = aliaserSpec(aliasSpec.request, data);
	const params = validateSpec(spec, aliasReq);

	const result = await moderateImagesQuery(params.imageIds, params.status);

	// Trigger notifications for approvals
	if (params.status === "APPROVED") {
		try {
			// Find images with associated user email and album name
			const imagesWithContext = await prisma.images.findMany({
				where: { image_id: { in: params.imageIds } },
				include: {
					users: { select: { email: true } },
					album_images: {
						include: { albums: { select: { album_name: true } } },
						take: 1,
					},
				},
			});

			for (const img of imagesWithContext) {
				if (img.users?.email) {
					const albumName =
						img.album_images[0]?.albums?.album_name || "a shared album";

					await queueServices.emailQueueLib.addJob("email", {
						worker: "email",
						type: "photo_approved",
						data: {
							email: img.users.email,
							albumName,
						},
					});

					// Add in-app notification
					await prisma.notifications.create({
						data: {
							user_id: img.uploaded_by!,
							type: "PHOTO_APPROVED",
							metadata: {
								imageId: img.image_id,
								albumName,
							},
						},
					});
				}
			}
		} catch (error) {
			console.error("Failed to enqueue photo approval emails:", error);
		}
	}

	return aliaserSpec(aliasSpec.response, {
		count: result.count,
	});
};

export const moderatePicturesService = service;
