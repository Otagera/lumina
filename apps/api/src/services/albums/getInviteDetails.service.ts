import joi from "joi";
import prisma from "../../../../../packages/config/src/db.config.ts";
import {
	BadRequestError,
	NotFoundError,
} from "../../../../../packages/utils/src/error.util.ts";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";

const spec = joi.object({
	invite_token: joi.string().required(),
});

const aliasSpec = {
	request: {
		inviteToken: "invite_token",
	},
};

const service = async (data: unknown) => {
	const aliasReq = aliaserSpec(aliasSpec.request, data);
	const params = validateSpec(spec, aliasReq);

	const member = await prisma.album_members.findUnique({
		where: { invite_token: params.invite_token },
		include: {
			album: {
				select: {
					album_id: true,
					album_name: true,
				},
			},
		},
	});

	if (!member) {
		throw new NotFoundError("Invalid or expired invite token");
	}

	if (member.expires_at && new Date() > member.expires_at) {
		throw new BadRequestError("This invite has expired");
	}

	if (member.user_id) {
		throw new BadRequestError("This invite has already been used");
	}

	return {
		albumId: member.album_id,
		albumName: member.album.album_name,
		role: member.role,
		expiresAt: member.expires_at,
	};
};

export const getInviteDetailsService = service;
