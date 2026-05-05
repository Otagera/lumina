import Joi from "joi";
import prisma from "../../../../../packages/config/src/db.config.ts";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";

const spec = Joi.object({
	user_id: Joi.string().uuid().required(),
	welcome: Joi.boolean().optional(),
	photoApproved: Joi.boolean().optional(),
	clustering: Joi.boolean().optional(),
	marketing: Joi.boolean().optional(),
});

const aliasSpec = {
	request: { userId: "user_id" },
	response: { preferences: "preferences" },
};

const service = async (data: any) => {
	const params = validateSpec(spec, aliaserSpec(aliasSpec.request, data));

	const user = await prisma.users.findUnique({
		where: { user_id: params.user_id },
		select: { email_preferences: true },
	});

	const current = (user?.email_preferences as any) || {
		welcome: true,
		photoApproved: true,
		clustering: true,
		marketing: false,
	};

	const updated = { ...current, ...params };
	delete updated.user_id;

	await prisma.users.update({
		where: { user_id: params.user_id },
		data: { email_preferences: updated as any },
	});

	return aliaserSpec(aliasSpec.response, { preferences: updated });
};

export const updateEmailPreferencesService = service;
