import Joi from "joi";
import prisma from "../../../../../packages/config/src/db.config.ts";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";

const spec = Joi.object({
	user_id: Joi.string().uuid().required(),
	notificationIds: Joi.array().items(Joi.string().uuid()).optional(),
	markAll: Joi.boolean().default(false),
});

const aliasSpec = {
	request: { userId: "user_id" },
	response: { count: "count" },
};

const service = async (data: any) => {
	const params = validateSpec(spec, aliaserSpec(aliasSpec.request, data));

	const where: any = { user_id: params.user_id };

	if (!params.markAll && params.notificationIds) {
		where.id = { in: params.notificationIds };
	}

	const result = await prisma.notifications.updateMany({
		where,
		data: { is_read: true },
	});

	return aliaserSpec(aliasSpec.response, { count: result.count });
};

export const markReadService = service;
