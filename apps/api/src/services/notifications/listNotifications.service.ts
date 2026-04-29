import Joi from "joi";
import prisma from "../../../../../packages/config/src/db.config.ts";
import { validateSpec } from "../../../../../packages/utils/src/specValidator.util.ts";

const spec = Joi.object({
	userId: Joi.string().uuid().required(),
	limit: Joi.number().default(20),
	offset: Joi.number().default(0),
});

const service = async (data: any) => {
	const params = validateSpec(spec, data);

	const [notifications, total] = await Promise.all([
		prisma.notifications.findMany({
			where: { user_id: params.userId },
			orderBy: { created_at: "desc" },
			take: params.limit,
			skip: params.offset,
		}),
		prisma.notifications.count({
			where: { user_id: params.userId },
		}),
	]);

	return {
		notifications,
		pagination: {
			total,
			limit: params.limit,
			offset: params.offset,
		},
	};
};

export const listNotificationsService = service;
