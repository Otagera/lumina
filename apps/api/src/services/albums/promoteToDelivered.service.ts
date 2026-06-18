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

const spec = Joi.object({
	album_id: Joi.string().uuid().required(),
	user_id: Joi.string().uuid().required(),
	image_ids: Joi.array().items(Joi.string().uuid()).min(1).required(),
	positions: Joi.object().pattern(Joi.string(), Joi.number()).optional(),
});

const aliasSpec = {
	request: { albumId: "album_id", userId: "user_id", imageIds: "image_ids", positions: "positions" },
	response: {},
};

const service = async (data: any) => {
	const params = validateSpec(spec, aliaserSpec(aliasSpec.request, data));

	// Verify this is a delivered gallery
	const deliveredAlbum = await prisma.albums.findUnique({
		where: { album_id: params.album_id },
		include: { settings: true },
	});

	if (!deliveredAlbum) throw new NotFoundError("Album not found.");
	if (deliveredAlbum.created_by !== params.user_id) throw new ForbiddenError("Not authorized.");
	if (!deliveredAlbum.source_album_id) throw new BadRequestError("This is not a delivered gallery.");

	// Verify images belong to the source album
	const sourceImages = await prisma.album_images.findMany({
		where: {
			album_id: deliveredAlbum.source_album_id,
			image_id: { in: params.image_ids },
		},
		select: { image_id: true },
	});
	const validIds = new Set(sourceImages.map((si) => si.image_id));

	const toAdd = params.image_ids.filter((id: string) => validIds.has(id));
	if (toAdd.length === 0) throw new BadRequestError("No valid images to promote.");

	// Upsert album_images (skip existing)
	await Promise.all(
		toAdd.map((imageId: string) =>
			prisma.album_images.upsert({
				where: { album_id_image_id: { album_id: params.album_id, image_id: imageId } },
				create: {
					album_id: params.album_id,
					image_id: imageId,
					position: params.positions?.[imageId] ?? null,
				},
				update: {
					position: params.positions?.[imageId] ?? undefined,
				},
			}),
		),
	);

	return { promoted: toAdd.length };
};

export const promoteToDeliveredService = service;
