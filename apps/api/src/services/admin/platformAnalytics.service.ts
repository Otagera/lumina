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

const R2_STORAGE_LIMIT_MB = 10 * 1024; // 10 GB
const R2_CLASS_A_LIMIT = 1_000_000;
const R2_CLASS_A_OPS_PER_UPLOAD = 4; // original + optimized + thumbnail + face crop

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
		storageStats,
		uploadsThisMonth,
		activeUserRows,
	] = await Promise.all([
		prisma.users.count(),
		prisma.albums.count({ where: { deleted_at: null } }),
		prisma.images.count({ where: { deleted_at: null } }),
		prisma.usage_logs.aggregate({
			where: { resource: "compute", timestamp: { gte: startOfMonth } },
			_sum: { quantity: true },
		}),
		prisma.album_settings.count({ where: { is_event: true } }),
		prisma.images.aggregate({
			where: { deleted_at: null },
			_sum: { size: true, optimized_size: true },
		}),
		prisma.images.count({
			where: { upload_date: { gte: startOfMonth }, deleted_at: null },
		}),
		// Count distinct uploaders with active (non-deleted) images
		prisma.$queryRaw<{ count: string }[]>`
			SELECT count(DISTINCT uploaded_by)::text as count
			FROM images
			WHERE deleted_at IS NULL AND uploaded_by IS NOT NULL
		`.catch(() => [{ count: "0" }]),
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

	const totalStorageBytes = (storageStats._sum.size ?? 0) + (storageStats._sum.optimized_size ?? 0);
	const totalStorageMB = Math.round(totalStorageBytes / 1024 / 1024);
	const activeUsersWithImages = parseInt((activeUserRows[0]?.count ?? "0"), 10);
	const avgStoragePerActiveUserMB = activeUsersWithImages > 0
		? Math.round(totalStorageMB / activeUsersWithImages)
		: 0;
	const estimatedMaxConcurrentUsers = avgStoragePerActiveUserMB > 0
		? Math.floor(R2_STORAGE_LIMIT_MB / avgStoragePerActiveUserMB)
		: null;
	const estimatedClassAOpsThisMonth = uploadsThisMonth * R2_CLASS_A_OPS_PER_UPLOAD;
	const storageHeadroomMB = Math.max(0, R2_STORAGE_LIMIT_MB - totalStorageMB);

	return aliaserSpec(aliasSpec.response, {
		userCount,
		albumCount,
		imageCount,
		computeThisMonth: computeThisMonth._sum.quantity ?? 0,
		activeEventCount,
		signupsByDay,
		capacity: {
			totalStorageMB,
			storageLimitMB: R2_STORAGE_LIMIT_MB,
			storageUsedPct: Math.min(100, Math.round((totalStorageMB / R2_STORAGE_LIMIT_MB) * 100)),
			storageHeadroomMB,
			activeUsersWithImages,
			avgStoragePerActiveUserMB,
			estimatedMaxConcurrentUsers,
			estimatedClassAOpsThisMonth,
			classAOpsLimit: R2_CLASS_A_LIMIT,
			classAOpsPct: Math.min(100, Math.round((estimatedClassAOpsThisMonth / R2_CLASS_A_LIMIT) * 100)),
		},
	});
};
