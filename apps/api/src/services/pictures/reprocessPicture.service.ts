import Joi from "joi";
import { deleteFacesByImageId } from "../../../../../packages/models/src/faces.model.ts";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";
import { getImage } from "./pictures.lib.ts";

const spec = Joi.object({
	user_id: Joi.string().uuid().required(),
	image_id: Joi.string().uuid().required(),
});

const aliasSpec = {
	request: { userId: "user_id", imageId: "image_id" },
	response: { success: "success" },
};

export const reprocessPictureService = async (data: any) => {
	const params = validateSpec(spec, aliaserSpec(aliasSpec.request, data));

	// 1. Verify user owns the image and get the raw database record
	// The `getImage` lib handles the verification and throws NotFoundError if it fails.
	const image = await getImage({
		image_id: params.image_id,
		uploaded_by: params.user_id,
	});

	// 2. Delete existing faces for this image
	await deleteFacesByImageId(params.image_id);

	// 3. Queue the face recognition job again
	// Dynamic import to avoid circular dependency
	const { queueServices } = await import(
		"../../../../worker/src/queue/queue.service.ts"
	);

	// We use the raw `image.image_path` because the worker needs the absolute file path, not the normalized URL
	await queueServices.faceRecognitionQueueLib.addJob(
		"faceRecognition",
		{
			imageId: params.image_id,
			imagePath: image.image_path,
			worker: "faceRecognition",
		},
		{ removeOnComplete: { count: 100 }, removeOnFail: { count: 100 } },
	);

	return aliaserSpec(aliasSpec.response, { success: true });
};
