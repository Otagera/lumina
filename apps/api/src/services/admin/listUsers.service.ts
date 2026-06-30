import Joi from "joi";
import prisma from "../../../../../packages/config/src/db.config.ts";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";

const spec = Joi.object({
	page: Joi.number().integer().min(1).default(1),
	limit: Joi.number().integer().min(1).max(100).default(20),
	search: Joi.string().allow("").default(""),
});

const aliasSpec = {
	request: {},
	response: {},
};

export const listUsersService = async (data: {
	page?: number;
	limit?: number;
	search?: string;
}) => {
	const params = validateSpec(spec, aliaserSpec(aliasSpec.request, data));
	const skip = (params.page - 1) * params.limit;

	const where = params.search
		? { email: { contains: params.search, mode: "insensitive" as const } }
		: {};

	const [users, total] = await Promise.all([
		prisma.users.findMany({
			where,
			select: {
				user_id: true,
				email: true,
				plan_name: true,
				role: true,
				suspended_at: true,
				plan: { select: { name: true, storage_mb: true } },
				_count: { select: { albums: true, images: true } },
			},
			orderBy: { email: "asc" },
			skip,
			take: params.limit,
		}),
		prisma.users.count({ where }),
	]);

	return aliaserSpec(aliasSpec.response, {
		users,
		total,
		page: params.page,
		limit: params.limit,
		pages: Math.ceil(total / params.limit),
	});
};
