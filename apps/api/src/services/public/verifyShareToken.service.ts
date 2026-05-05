import Joi from "joi";
import prisma from "../../../../../packages/config/src/db.config.ts";
import { NotFoundError } from "../../../../../packages/utils/src/error.util.ts";
import { aliaserSpec, validateSpec } from "../../../../../packages/utils/src/specValidator.util.ts";

const spec = Joi.object({
	token: Joi.string().required(),
});

const aliasSpec = {
	request: { token: "share_token" },
	response: { created_by: "userId" },
};

const service = async (data: any) => {
	const params = validateSpec(spec, aliaserSpec(aliasSpec.request, data));

	const album = await prisma.albums.findUnique({
		where: { share_token: params.share_token },
		select: { created_by: true },
	});

	if (!album) throw new NotFoundError("Album not found.");

	return aliaserSpec(aliasSpec.response, { created_by: album.created_by });
};

export const verifyShareTokenService = service;
