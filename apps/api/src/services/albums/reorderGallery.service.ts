import Joi from "joi";
import prisma from "../../../../../packages/config/src/db.config.ts";
import {
	ForbiddenError,
	NotFoundError,
} from "../../../../../packages/utils/src/error.util.ts";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";

const spec = Joi.object({
	album_id: Joi.string().uuid().required(),
	user_id: Joi.string().uuid().required(),
	order: Joi.array()
		.items(
			Joi.object({
				imageId: Joi.string().uuid().required(),
				position: Joi.number().integer().required(),
			}),
		)
		.min(1)
		.required(),
});

const aliasSpec = {
	request: { albumId: "album_id", userId: "user_id", order: "order" },
	response: {},
};

const service = async (data: any) => {
	const params = validateSpec(spec, aliaserSpec(aliasSpec.request, data));

	const album = await prisma.albums.findUnique({
		where: { album_id: params.album_id },
	});

	if (!album) throw new NotFoundError("Album not found.");
	if (album.created_by !== params.user_id) throw new ForbiddenError("Not authorized.");

	await Promise.all(
		params.order.map(({ imageId, position }: { imageId: string; position: number }) =>
			prisma.album_images.updateMany({
				where: { album_id: params.album_id, image_id: imageId },
				data: { position },
			}),
		),
	);

	return { reordered: params.order.length };
};

export const reorderGalleryService = service;
