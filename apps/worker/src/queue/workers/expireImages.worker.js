import prisma from "../../../../../packages/config/src/db.config.ts";
import { queueServices } from "../queue.service.ts";

const run = async (_jobData) => {
	const now = new Date();

	console.log(`[EXPIRE IMAGES] Scanning for expired images as of ${now.toISOString()}`);

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

	if (expired.length === 0) {
		console.log("[EXPIRE IMAGES] No expired images found.");
		return { expired: 0 };
	}

	console.log(`[EXPIRE IMAGES] Found ${expired.length} images to expire.`);

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

	return { expired: expired.length };
};

export default run;
