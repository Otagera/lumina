import Joi from "joi";
import prisma from "../../../../../packages/config/src/db.config.ts";
import { NotFoundError } from "../../../../../packages/utils/src/error.util.ts";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";

const spec = Joi.object({
	share_token: Joi.string().required(),
	pin: Joi.string().required(),
});

const aliasSpec = {
	request: { token: "share_token", pin: "pin" },
	response: {},
};

const service = async (data: any) => {
	const params = validateSpec(spec, aliaserSpec(aliasSpec.request, data));

	const album = await prisma.albums.findUnique({
		where: { share_token: params.share_token },
		include: { album_settings: { select: { display_pin: true } } },
	});

	if (!album) throw new NotFoundError("Album not found.");

	const pin = album.album_settings?.display_pin;
	const valid = !!pin && pin === params.pin;

	return { valid };
};

export const verifyDisplayPinService = service;
