import joi from "joi";
import prisma from "../../../../../packages/config/src/db.config.ts";
import {
	NotFoundError,
} from "../../../../../packages/utils/src/error.util.ts";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";
import { addReactionService } from "./addReaction.service.ts";

const spec = joi.object({
	share_token: joi.string().required(),
	image_id: joi.string().uuid().required(),
	type: joi.string().optional(),
	guest_session_id: joi.string().uuid().optional(),
});

const aliasSpec = {
	request: {
		shareToken: "share_token",
		imageId: "image_id",
		guestSessionId: "guest_session_id",
	},
};

const service = async (data: {
	shareToken: string;
	imageId: string;
	type?: string;
	guestSessionId?: string;
}) => {
	const aliasReq = aliaserSpec(aliasSpec.request, data);
	const params = validateSpec(spec, aliasReq);

	const album = await prisma.albums.findUnique({
		where: { share_token: params.share_token },
		include: {
			album_images: {
				where: { image_id: params.image_id },
				select: { image_id: true },
			},
		},
	});

	if (!album) throw new NotFoundError("Album not found.");
	if (album.album_images.length === 0) throw new NotFoundError("Image not found in this album.");

	return addReactionService({
		imageId: params.image_id,
		albumId: album.album_id,
		type: data.type,
		guestSessionId: params.guest_session_id,
	});
};

export const addPublicReactionService = service;
