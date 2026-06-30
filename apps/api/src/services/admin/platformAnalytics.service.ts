import Joi from "joi";
import prisma from "../../../../../packages/config/src/db.config.ts";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";

const spec = Joi.object({});

const aliasSpec = {
	request: {},
	response: {},
};

export const platformAnalyticsService = async () => {
	validateSpec(spec, aliaserSpec(aliasSpec.request, {}));

	const now = new Date();
	const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

	const [
		userCount,
		albumCount,
		imageCount,
		computeThisMonth,
		activeEventCount,
	] = await Promise.all([
		prisma.users.count(),
		prisma.albums.count({ where: { deleted_at: null } }),
		prisma.images.count({ where: { deleted_at: null } }),
		prisma.usage_logs.aggregate({
			where: { resource: "compute", timestamp: { gte: startOfMonth } },
			_sum: { quantity: true },
		}),
		prisma.album_settings.count({ where: { is_event: true } }),
	]);

	// Daily signups for last 30 days via raw query (groupBy doesn't support date_trunc)
	const signupRows = await prisma.$queryRaw<{ day: string; count: string }[]>`
		SELECT
			to_char(date_trunc('day', created_at), 'YYYY-MM-DD') as day,
			count(*)::text as count
		FROM users
		WHERE created_at >= NOW() - INTERVAL '30 days'
		GROUP BY day
		ORDER BY day ASC
	`.catch(() => [] as { day: string; count: string }[]);

	const signupMap = new Map(signupRows.map((r) => [r.day, parseInt(r.count, 10)]));
	const signupsByDay: { date: string; count: number }[] = [];
	for (let i = 29; i >= 0; i--) {
		const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
		const key = d.toISOString().slice(0, 10);
		signupsByDay.push({ date: key, count: signupMap.get(key) ?? 0 });
	}

	return aliaserSpec(aliasSpec.response, {
		userCount,
		albumCount,
		imageCount,
		computeThisMonth: computeThisMonth._sum.quantity ?? 0,
		activeEventCount,
		signupsByDay,
	});
};
