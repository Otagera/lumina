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
	album_id: joi.string().required(),
	member_id: joi.string().required(),
});

const aliasSpec = {
	request: {
		albumId: "album_id",
		memberId: "member_id",
	},
};

const service = async (data: unknown) => {
	const aliasReq = aliaserSpec(aliasSpec.request, data);
	const params = validateSpec(spec, aliasReq);

	const member = await prisma.album_members.findUnique({
		where: { id: params.member_id },
	});

	if (!member || member.album_id !== params.album_id) {
		throw new NotFoundError("Invite not found");
	}

	if (member.user_id) {
		throw new BadRequestError(
			"Cannot delete invite - user has already joined. Remove member instead.",
		);
	}

	await prisma.album_members.delete({
		where: { id: params.member_id },
	});

	return { success: true, memberId: params.member_id };
};

export const deleteInviteService = service;
