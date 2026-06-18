import Joi from "joi";
import { v4 as uuidv4 } from "uuid";
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
});

const aliasSpec = {
	request: { albumId: "album_id", userId: "user_id" },
	response: {},
};

const service = async (data: any) => {
	const params = validateSpec(spec, aliaserSpec(aliasSpec.request, data));

	const album = await prisma.albums.findUnique({
		where: { album_id: params.album_id },
		include: { delivered_albums: { select: { album_id: true } } },
	});

	if (!album) throw new NotFoundError("Album not found.");
	if (album.created_by !== params.user_id) throw new ForbiddenError("Not authorized.");
	if (album.delivered_albums.length > 0) throw new BadRequestError("A delivered gallery already exists for this album.");

	const shareToken = uuidv4().replace(/-/g, "").slice(0, 16);

	const delivered = await prisma.albums.create({
		data: {
			album_name: `${album.album_name ?? "Album"} — Official Gallery`,
			created_by: params.user_id,
			share_token: shareToken,
			source_album_id: params.album_id,
			settings: {
				create: {
					delivered: true,
					allow_downloads: true,
					allow_guest_uploads: false,
					is_event: false,
				},
			},
		},
		include: { settings: true },
	});

	return {
		albumId: delivered.album_id,
		albumName: delivered.album_name,
		shareToken: delivered.share_token,
	};
};

export const createDeliveredGalleryService = service;
