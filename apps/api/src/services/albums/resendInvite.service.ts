import crypto from "node:crypto";
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
	expires_in_days: joi.number().default(7),
});

const aliasSpec = {
	request: {
		albumId: "album_id",
		memberId: "member_id",
		expiresInDays: "expires_in_days",
	},
	response: {
		inviteToken: "inviteToken",
		role: "role",
		expiresAt: "expires_at",
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
		throw new BadRequestError("Cannot resend invite - user has already joined");
	}

	// Generate new token
	const inviteToken = crypto.randomBytes(32).toString("hex");

	// Calculate new expiry
	const expiresAt = new Date();
	expiresAt.setDate(expiresAt.getDate() + params.expires_in_days);

	const updatedMember = await prisma.album_members.update({
		where: { id: params.member_id },
		data: {
			invite_token: inviteToken,
			expires_at: expiresAt,
		},
	});

	return aliaserSpec(aliasSpec.response, {
		inviteToken,
		role: updatedMember.role,
		expiresAt: expiresAt.toISOString(),
	});
};

export const resendInviteService = service;
