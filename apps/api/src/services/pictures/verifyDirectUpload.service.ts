import Joi from "joi";
import prisma from "../../../../../packages/config/src/db.config.ts";
import { NotFoundError } from "../../../../../packages/utils/src/error.util.ts";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";

const spec = Joi.object({
	share_token: Joi.string().optional(),
	key: Joi.string().required(),
});

const aliasSpec = {
	request: { shareToken: "share_token" },
	response: { authorized: "isAuthorized" },
};

const service = async (data: any) => {
	const params = validateSpec(spec, aliaserSpec(aliasSpec.request, data));

	let isAuthorized = false;

	if (params.share_token) {
		const album = await prisma.albums.findUnique({
			where: { share_token: params.share_token },
		});

		if (album) isAuthorized = true;
	}

	return aliaserSpec(aliasSpec.response, { authorized: isAuthorized });
};

export const verifyDirectUploadService = service;
