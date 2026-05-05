import Joi from "joi";
import prisma from "../../../../../packages/config/src/db.config.ts";
import { deleteImagesWithLogging } from "../../../../../packages/models/src/images.model.ts";
import { aliaserSpec, validateSpec } from "../../../../../packages/utils/src/specValidator.util.ts";

const spec = Joi.object({
	userId: Joi.string().uuid().required(),
	imageIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
});

const aliasSpec = {
	request: { userId: "user_id" },
	response: { deletedCount: "deletedCount" },
};

const service = async (data: any) => {
	const aliasReq = aliaserSpec(aliasSpec.request, data);
	const params = validateSpec(spec, aliasReq);

	// Verify ownership of images
	const images = await prisma.images.findMany({
		where: {
			image_id: { in: params.imageIds },
			uploaded_by: params.user_id,
			deleted_at: { not: null },
		},
	});

	if (images.length === 0) {
		throw new Error("No images found to permanently delete");
	}

	// Permanently delete images and credit usage
	await deleteImagesWithLogging(images.map((img) => img.image_id));

	return { deletedCount: images.length };
};

export const permanentDeleteImagesService = service;
