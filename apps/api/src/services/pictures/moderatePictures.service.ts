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

			const approvalsPayload = imagesWithContext
				.filter((img) => Boolean(img.users?.email && img.uploaded_by))
				.map((img) => {
					const albumName =
						img.album_images[0]?.albums?.album_name || "a shared album";

					return {
						email: img.users!.email,
						userId: img.uploaded_by!,
						imageId: img.image_id,
						albumName,
					};
				});

			if (approvalsPayload.length > 0) {
				const queueResult = await queueServices.emailQueueLib
					.addJob("email", {
						worker: "email",
						type: "photo_approved_bulk",
						data: {
							recipients: approvalsPayload.map((item) => ({
								email: item.email,
								albumName: item.albumName,
								imageId: item.imageId,
							})),
						},
					})
					.then(() => ({ ok: true as const }))
					.catch((error) => ({ ok: false as const, error }));

				if (!queueResult.ok) {
					console.error(
						"Failed to enqueue bulk photo approval emails:",
						queueResult.error,
					);
				}

				const notificationResult = await prisma.notifications
					.createMany({
						data: approvalsPayload.map((item) => ({
							user_id: item.userId,
							type: "PHOTO_APPROVED",
							metadata: {
								imageId: item.imageId,
								albumName: item.albumName,
							},
						})),
						skipDuplicates: true,
					})
					.then(() => ({ ok: true as const }))
					.catch((error) => ({ ok: false as const, error }));

				if (!notificationResult.ok) {
					console.error(
						"Failed to create photo approval notifications:",
						notificationResult.error,
					);
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
