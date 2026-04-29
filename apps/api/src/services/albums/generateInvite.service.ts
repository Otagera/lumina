import crypto from "node:crypto";
import joi from "joi";
import prisma from "../../../../../packages/config/src/db.config.ts";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";

const spec = joi.object({
	album_id: joi.string().required(),
	role: joi.string().valid("VIEWER", "CONTRIBUTOR", "ADMIN").default("VIEWER"),
	expires_in_days: joi.number().default(7),
});

const aliasSpec = {
	request: {
		albumId: "album_id",
		role: "role",
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

	// Generate a random secure token
	const inviteToken = crypto.randomBytes(32).toString("hex");

	// Calculate expiry date
	const expiresAt = new Date();
	expiresAt.setDate(expiresAt.getDate() + params.expires_in_days);

	// We save the token as a "pending" member by leaving user_id null
	await prisma.album_members.create({
		data: {
			album_id: params.album_id,
			role: params.role,
			invite_token: inviteToken,
			expires_at: expiresAt,
		},
	});

	return aliaserSpec(aliasSpec.response, {
		inviteToken,
		role: params.role,
		expiresAt: expiresAt.toISOString(),
	});
};

export const generateInviteService = service;
