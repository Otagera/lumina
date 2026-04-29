import Joi from "joi";
import prisma from "../../../../../packages/config/src/db.config.ts";
import { validateSpec } from "../../../../../packages/utils/src/specValidator.util.ts";

const spec = Joi.object({
	userId: Joi.string().uuid().required(),
	notificationIds: Joi.array().items(Joi.string().uuid()).optional(),
	markAll: Joi.boolean().default(false),
});

const service = async (data: any) => {
	const params = validateSpec(spec, data);

	const where: any = { user_id: params.userId };

	if (!params.markAll && params.notificationIds) {
		where.id = { in: params.notificationIds };
	}

	const result = await prisma.notifications.updateMany({
		where,
		data: { is_read: true },
	});

	return { count: result.count };
};

export const markReadService = service;
