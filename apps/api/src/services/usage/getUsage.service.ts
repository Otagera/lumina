import Joi from "joi";
import prisma from "../../../../../packages/config/src/db.config.ts";
import { getUserPlanLimits } from "../../../../../packages/models/src/usage.model.ts";
import { validateSpec } from "../../../../../packages/utils/src/specValidator.util.ts";

const spec = Joi.object({
	userId: Joi.string().uuid().required(),
});

const service = async (data: any) => {
	const params = validateSpec(spec, data);

	// Get user plan and limits
	const { plan, storageLimitMB, computeLimit } = await getUserPlanLimits(
		params.userId,
	);

	// Get start of current month
	const now = new Date();
	const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

	// === STORAGE USAGE (calculated from images table) ===
	// Count all images (including soft-deleted in trash) - storage is freed when permanently deleted
	const userImages = await prisma.images.findMany({
		where: { uploaded_by: params.userId },
		select: {
			size: true,
			optimized_size: true,
			image_id: true,
			album_images: {
				select: { album_id: true },
			},
		},
	});

	// Calculate total storage used (sum of size and optimized_size)
	let totalStorageBytes = 0;
	const storageByAlbumMap = new Map<string, number>();

	for (const img of userImages) {
		const imgSize = (img.size || 0) + (img.optimized_size || 0);
		totalStorageBytes += imgSize;

		// Group by album
		if (img.album_images && img.album_images.length > 0) {
			for (const ai of img.album_images) {
				const current = storageByAlbumMap.get(ai.album_id) || 0;
				storageByAlbumMap.set(ai.album_id, current + imgSize);
			}
		}
	}

	const storageUsedMB = Math.max(
		0,
		Math.round(totalStorageBytes / (1024 * 1024)),
	);

	// Storage by album
	const albumIdsWithStorage = Array.from(storageByAlbumMap.keys());
	const albumsWithStorage = await prisma.albums.findMany({
		where: { album_id: { in: albumIdsWithStorage } },
		select: { album_id: true, album_name: true },
	});

	const storageByAlbum = Array.from(storageByAlbumMap.entries())
		.map(([albumId, bytes]) => {
			const album = albumsWithStorage.find((a) => a.album_id === albumId);
			return {
				albumId,
				albumName: album?.album_name || "Unknown Album",
				storageMB: Math.max(0, Math.round(bytes / (1024 * 1024))),
			};
		})
		.sort((a, b) => b.storageMB - a.storageMB);

	// === COMPUTE USAGE (current month) ===
	const computeLogs = await prisma.usage_logs.findMany({
		where: {
			user_id: params.userId,
			resource: "compute",
			timestamp: { gte: startOfMonth },
		},
	});

	const computeUnitsUsed = computeLogs.reduce(
		(acc, log) => acc + log.quantity,
		0,
	);

	// Compute by operation
	const computeByOperationRaw = await prisma.usage_logs.groupBy({
		by: ["operation"],
		where: {
			user_id: params.userId,
			resource: "compute",
			timestamp: { gte: startOfMonth },
		},
		_sum: {
			quantity: true,
		},
	});

	const operationLabels: Record<string, string> = {
		image_optimization: "Image Optimization",
		face_detection: "Face Detection",
		face_search: "Face Search",
		face_clustering: "Face Clustering",
		bulk_download: "Bulk Download",
		file_deletion: "File Deletion",
	};

	const computeByOperation = computeByOperationRaw.map((r) => ({
		operation: r.operation,
		operationLabel: operationLabels[r.operation] || r.operation,
		units: r._sum.quantity || 0,
	}));

	// === HISTORICAL DATA (last 30 days) ===
	const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

	const historyRaw = await prisma.usage_logs.findMany({
		where: {
			user_id: params.userId,
			timestamp: { gte: thirtyDaysAgo },
		},
		select: {
			resource: true,
			operation: true,
			quantity: true,
			timestamp: true,
		},
		orderBy: { timestamp: "asc" },
	});

	// Group by day
	const historyByDay: Record<string, { storage: number; compute: number }> = {};

	historyRaw.forEach((log) => {
		const dateKey = log.timestamp.toISOString().split("T")[0];
		if (!historyByDay[dateKey]) {
			historyByDay[dateKey] = { storage: 0, compute: 0 };
		}
		if (log.resource === "storage") {
			historyByDay[dateKey].storage += log.quantity;
		} else if (log.resource === "compute") {
			historyByDay[dateKey].compute += log.quantity;
		}
	});

	// Convert to array and calculate running totals
	const history = Object.entries(historyByDay)
		.map(([date, values]) => ({
			date,
			storageMB: Math.max(0, Math.round(values.storage / (1024 * 1024))),
			computeUnits: values.compute,
		}))
		.sort((a, b) => a.date.localeCompare(b.date));

	// Calculate running totals for trend chart
	let runningStorage = 0;
	let runningCompute = 0;
	history.forEach((day) => {
		runningStorage += day.storageMB;
		runningCompute += day.computeUnits;
		day.storageTotalMB = runningStorage;
		day.computeTotalUnits = runningCompute;
	});

	// === RECENT LOGS ===
	const recentLogs = await prisma.usage_logs.findMany({
		where: { user_id: params.userId },
		orderBy: { timestamp: "desc" },
		take: 20,
		select: {
			id: true,
			resource: true,
			operation: true,
			quantity: true,
			album_id: true,
			timestamp: true,
		},
	});

	return {
		// Current usage
		storageUsedMB,
		storageLimitMB,
		computeUnitsUsed,
		computeUnitsLimit: computeLimit,
		plan,

		// Breakdown
		storageByAlbum,
		computeByOperation,

		// History
		history,

		// Recent activity
		recentLogs,
	};
};

export const getUsageService = service;
