import Joi from "joi";
import prisma from "../../../../../packages/config/src/db.config.ts";
import { NotFoundError } from "../../../../../packages/utils/src/error.util.ts";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";

const spec = Joi.object({
	user_id: Joi.string().uuid().required(),
});

const aliasSpec = {
	request: { userId: "user_id" },
	response: {},
};

export const getUserDetailService = async (userId: string) => {
	const params = validateSpec(spec, aliaserSpec(aliasSpec.request, { userId }));

	const startOfMonth = new Date();
	startOfMonth.setDate(1);
	startOfMonth.setHours(0, 0, 0, 0);

	const [user, albumCount, imageCount, computeThisMonth] = await Promise.all([
		prisma.users.findUnique({
			where: { user_id: params.user_id },
			select: {
				user_id: true,
				email: true,
				plan_name: true,
				role: true,
				suspended_at: true,
				plan: {
					select: {
						name: true,
						storage_mb: true,
						compute_units_per_month: true,
						price_usd: true,
					},
				},
				albums: {
					where: { deleted_at: null },
					select: {
						album_id: true,
						album_name: true,
						creation_date: true,
						_count: { select: { album_images: true } },
					},
					orderBy: { creation_date: "desc" },
					take: 10,
				},
			},
		}),
		prisma.albums.count({ where: { created_by: params.user_id, deleted_at: null } }),
		prisma.images.count({ where: { uploaded_by: params.user_id, deleted_at: null } }),
		prisma.usage_logs.aggregate({
			where: {
				user_id: params.user_id,
				resource: "compute",
				timestamp: { gte: startOfMonth },
			},
			_sum: { quantity: true },
		}),
	]);

	if (!user) throw new NotFoundError("User not found");

	return aliaserSpec(aliasSpec.response, {
		...user,
		albumCount,
		imageCount,
		computeThisMonth: computeThisMonth._sum.quantity ?? 0,
	});
};
