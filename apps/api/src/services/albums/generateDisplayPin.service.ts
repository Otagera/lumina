import Joi from "joi";
import prisma from "../../../../../packages/config/src/db.config.ts";
import { NotFoundError } from "../../../../../packages/utils/src/error.util.ts";
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
		where: { album_id: params.album_id, created_by: params.user_id },
	});

	if (!album) throw new NotFoundError("Album not found.");

	const pin = String(Math.floor(1000 + Math.random() * 9000));

	await prisma.album_settings.update({
		where: { album_id: params.album_id },
		data: { display_pin: pin },
	});

	return { pin };
};

export const generateDisplayPinService = service;
