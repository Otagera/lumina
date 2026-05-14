import prisma from "../../config/src/db.config.ts";
import config from "../../config/src/index.config.ts";

const SYSTEM_USER_EMAIL = "system@lumina.otagera.xyz";

const getSystemUserId = async (): Promise<string | null> => {
	const envConfig = config[config.env || "development"];
	const configSystemId = envConfig.system_user_id;

	if (configSystemId && configSystemId.length === 36) {
		return configSystemId;
	}

	const systemUser = await prisma.users
		.findUnique({
			where: { email: SYSTEM_USER_EMAIL },
			select: { user_id: true },
		})
		.catch(() => null);

	return systemUser?.user_id || null;
};

const resolveUserId = async (userId: string | null | undefined): Promise<string | null> => {
	if (!userId) {
		return getSystemUserId();
	}

	const userExists = await prisma.users
		.findUnique({
			where: { user_id: userId },
			select: { user_id: true },
		})
		.catch(() => null);

	if (!userExists) {
		console.warn(`[USAGE-LOG] User ${userId} not found, using system user`);
		return getSystemUserId();
	}

	return userId;
};

export const logUsage = async (
	userId: string | null | undefined,
	resource: string,
	operation: string,
	quantity: number = 1,
	albumId?: string,
	metadata?: Record<string, any>,
) => {
	const actualUserId = await resolveUserId(userId);

	if (!actualUserId) {
		console.error("[USAGE-LOG] No system user found, cannot log usage");
		return;
	}

	return await prisma.usage_logs.create({
		data: {
			user_id: actualUserId,
			album_id: albumId || null,
			resource,
			operation,
			quantity,
			metadata: metadata || {},
		},
	});
};

export const logStorageUsage = async (
	userId: string | null | undefined,
	operation: string,
	quantity: number,
	albumId?: string,
	metadata?: Record<string, any>,
) => {
	const actualUserId = await resolveUserId(userId);

	if (!actualUserId) {
		console.error("[USAGE-LOG] No system user found, cannot log storage usage");
		return;
	}

	return await prisma.usage_logs.create({
		data: {
			user_id: actualUserId,
			album_id: albumId || null,
			resource: "storage",
			operation,
			quantity,
			metadata: metadata || {},
		},
	});
};

export const getUserUsage = async (
	userId: string,
	resource: string,
	startDate?: Date,
) => {
	const where: any = {
		user_id: userId,
		resource,
	};

	if (startDate) {
		where.timestamp = {
			gte: startDate,
		};
	}

	const logs = await prisma.usage_logs.findMany({
		where,
	});

	return logs.reduce((acc, log) => acc + log.quantity, 0);
};

export const getUserPlanLimits = async (userId: string) => {
	const user = await prisma.users.findUnique({
		where: { user_id: userId },
		select: {
			plan_id: true,
			plan: true,
		},
	});

	if (user?.plan) {
		return {
			plan: user.plan.name,
			storageLimitMB: user.plan.storage_mb,
			computeLimit: user.plan.compute_units_per_month,
		};
	}

	// Fallback to free plan defaults if no plan assigned
	return {
		plan: "free",
		storageLimitMB: 5 * 1024,
		computeLimit: 100,
	};
};

export const getUserUsageStats = async (userId: string) => {
	try {
		// Get user plan and limits from DB
		const { plan, storageLimitMB, computeLimit } =
			await getUserPlanLimits(userId);

		// Get start of current month
		const startOfMonth = new Date();
		startOfMonth.setDate(1);
		startOfMonth.setHours(0, 0, 0, 0);

		// Get compute units used this month
		const computeLogs = await prisma.usage_logs.findMany({
			where: {
				user_id: userId,
				resource: "compute",
				timestamp: { gte: startOfMonth },
			},
		});

		const computeUnitsUsed = computeLogs.reduce(
			(acc, log) => acc + log.quantity,
			0,
		);

		// Get total storage used by scanning the images table (more accurate current state)
		const userImages = await prisma.images.findMany({
			where: { uploaded_by: userId },
			select: {
				size: true,
				optimized_size: true,
			},
		});

		const storageUsedBytes = userImages.reduce(
			(acc, img) => acc + (img.size || 0) + (img.optimized_size || 0),
			0,
		);

		const storageUsedMB = Math.max(
			0,
			Math.round(storageUsedBytes / (1024 * 1024)),
		);

		return {
			computeUnitsUsed,
			computeUnitsLimit: computeLimit,
			storageUsedMB,
			storageLimitMB,
			plan,
		};
	} catch (error) {
		console.error("Error getting user usage stats:", error);
		return {
			computeUnitsUsed: 0,
			computeUnitsLimit: 100,
			storageUsedMB: 0,
			storageLimitMB: 5 * 1024,
			plan: "free" as const,
		};
	}
};

/**
 * Checks if a user has exceeded their compute limit or hit a soft limit threshold.
 * Returns { allowed: boolean, notification?: string }
 */
export const checkComputeLimit = async (userId: string) => {
	const stats = await getUserUsageStats(userId);
	const ratio = stats.computeUnitsUsed / stats.computeUnitsLimit;

	if (ratio >= 1.0) {
		return {
			allowed: true, // Soft limit allowed for demo
			notification: "CRITICAL: You have reached 100% of your compute limit.",
			status: "EXCEEDED" as const,
		};
	}

	if (ratio >= 0.8) {
		return {
			allowed: true,
			notification: "WARNING: You have reached 80% of your compute limit.",
			status: "WARNING" as const,
		};
	}

	return { allowed: true, status: "OK" as const };
};
