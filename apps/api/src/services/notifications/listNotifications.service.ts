import Joi from "joi";
import prisma from "../../../../../packages/config/src/db.config.ts";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";

const spec = Joi.object({
	user_id: Joi.string().uuid().required(),
	limit: Joi.number().default(20),
	offset: Joi.number().default(0),
});

const aliasSpec = {
	request: { userId: "user_id" },
	response: {
		notifications: "notifications",
		pagination: "pagination",
	},
};

const service = async (data: any) => {
	const aliasReq = aliaserSpec(aliasSpec.request, data);
	const params = validateSpec(spec, aliasReq);

	const [notifications, total] = await Promise.all([
		prisma.notifications.findMany({
			where: { user_id: params.user_id },
			orderBy: { created_at: "desc" },
			take: params.limit,
			skip: params.offset,
		}),
		prisma.notifications.count({
			where: { user_id: params.user_id },
		}),
	]);

	return aliaserSpec(aliasSpec.response, {
		notifications,
		pagination: {
			total,
			limit: params.limit,
			offset: params.offset,
		},
	});
};

export const listNotificationsService = service;
