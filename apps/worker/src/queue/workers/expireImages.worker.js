import prisma from "../../../../../packages/config/src/db.config.ts";
import { queueServices } from "../queue.service.ts";

const STALE_PENDING_DAYS = 30;

const run = async (_jobData) => {
	const now = new Date();
	const staleThreshold = new Date(now.getTime() - STALE_PENDING_DAYS * 24 * 60 * 60 * 1000);

	console.log(`[EXPIRE IMAGES] Scanning for expired images as of ${now.toISOString()}`);

	// 1. TTL-expired images (free tier, expires_at set)
	const expired = await prisma.images.findMany({
		where: {
			expires_at: { lte: now },
			deleted_at: null,
		},
		select: {
			image_id: true,
			image_path: true,
			storage_key: true,
			storage_provider: true,
			optimized_path: true,
		},
	});

	// 2. Stale PENDING images with no expiry — auto-reject after 30 days
	const stalePendingCount = await prisma.images.updateMany({
		where: {
			status: "PENDING",
			expires_at: null,
			deleted_at: null,
			upload_date: { lte: staleThreshold },
		},
		data: { status: "REJECTED" },
	});

	if (stalePendingCount.count > 0) {
		console.log(`[EXPIRE IMAGES] Auto-rejected ${stalePendingCount.count} stale PENDING images (no expiry, older than ${STALE_PENDING_DAYS}d).`);
	}

	if (expired.length === 0) {
		console.log("[EXPIRE IMAGES] No TTL-expired images found.");
		return { expired: 0, stalePendingRejected: stalePendingCount.count };
	}

	console.log(`[EXPIRE IMAGES] Found ${expired.length} TTL-expired images to expire.`);

	// Soft-delete so trashCleanup handles final storage deletion after 30d
	await prisma.images.updateMany({
		where: { image_id: { in: expired.map((img) => img.image_id) } },
		data: { deleted_at: now },
	});

	// Enqueue immediate file deletion for each expired image
	for (const image of expired) {
		await queueServices.fileDeletionQueueLib.addJob("fileDeletion", {
			worker: "fileDeletion",
			image,
		});
	}

	console.log(`[EXPIRE IMAGES] Soft-deleted ${expired.length} images and queued file deletions.`);

	return { expired: expired.length, stalePendingRejected: stalePendingCount.count };
};

export default run;
