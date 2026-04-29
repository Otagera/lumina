import prisma from "../../config/src/db.config.ts";

export const logUsage = async (
	userId: string,
	resource: string,
	operation: string,
	quantity: number = 1,
	albumId?: string,
	metadata?: Record<string, any>,
) => {
	return await prisma.usage_logs.create({
		data: {
			user_id: userId,
			album_id: albumId || null,
			resource,
			operation,
			quantity,
			metadata: metadata || {},
		},
	});
};

export const logStorageUsage = async (
	userId: string,
	operation: string,
	quantity: number,
	albumId?: string,
	metadata?: Record<string, any>,
) => {
	// For storage, we track delta changes (positive for add, negative for delete)
	return await prisma.usage_logs.create({
		data: {
			user_id: userId,
			album_id: albumId || null,
			resource: "storage",
			operation,
			quantity, // bytes
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
