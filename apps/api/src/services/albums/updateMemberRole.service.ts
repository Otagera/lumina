import joi from "joi";
import prisma from "../../../../../packages/config/src/db.config.ts";
import { NotFoundError } from "../../../../../packages/utils/src/error.util.ts";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";

const spec = joi.object({
	album_id: joi.string().required(),
	member_id: joi.string().required(),
	role: joi.string().valid("VIEWER", "CONTRIBUTOR", "ADMIN").required(),
});

const aliasSpec = {
	request: {
		albumId: "album_id",
		memberId: "member_id",
		role: "role",
	},
	response: {
		memberId: "memberId",
		role: "role",
	},
};

const service = async (data: unknown) => {
	const aliasReq = aliaserSpec(aliasSpec.request, data);
	const params = validateSpec(spec, aliasReq);

	const member = await prisma.album_members.findUnique({
		where: { id: params.member_id },
	});

	if (!member || member.album_id !== params.album_id) {
		throw new NotFoundError("Member not found");
	}

	const updatedMember = await prisma.album_members.update({
		where: { id: params.member_id },
		data: {
			role: params.role,
		},
	});

	return aliaserSpec(aliasSpec.response, {
		memberId: updatedMember.id,
		role: updatedMember.role,
	});
};

export const updateMemberRoleService = service;
