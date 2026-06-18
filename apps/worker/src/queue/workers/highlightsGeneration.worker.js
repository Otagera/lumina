import prisma from "../../../../../packages/config/src/db.config.ts";
import { emitHighlightsReady } from "../../../../../packages/utils/src/events.util.ts";
import { normalizeImagePath } from "../../../../../packages/utils/src/image.util.ts";

const run = async (jobData) => {
	const { albumId } = jobData;

	try {
		console.log(`[highlightsGeneration] Starting for album: ${albumId}`);

		const albumImages = await prisma.album_images.findMany({
			where: { album_id: albumId },
			include: {
				images: {
					select: {
						image_id: true,
						image_path: true,
						storage_provider: true,
						storage_key: true,
						status: true,
						upload_date: true,
						_count: { select: { reactions: true } },
					},
				},
			},
		});

		const approved = albumImages
			.map((ai) => ai.images)
			.filter((img) => img !== null && img.status === "APPROVED");

		if (approved.length === 0) {
			console.log(`[highlightsGeneration] No approved images for album: ${albumId}`);
			return { status: "skipped", reason: "no approved images" };
		}

		// Sort by reaction count desc, pick up to 20
		const sorted = [...approved].sort(
			(a, b) => (b._count?.reactions ?? 0) - (a._count?.reactions ?? 0),
		);
		const selected = sorted.slice(0, 20);

		// Sort final selection chronologically
		selected.sort(
			(a, b) =>
				new Date(a.upload_date ?? 0).getTime() -
				new Date(b.upload_date ?? 0).getTime(),
		);

		const imageIds = selected.map((img) => img.image_id);

		await prisma.album_highlights.upsert({
			where: { album_id: albumId },
			create: { album_id: albumId, image_ids: imageIds, status: "ready" },
			update: { image_ids: imageIds, status: "ready", updated_at: new Date() },
		});

		await emitHighlightsReady(albumId);

		console.log(`[highlightsGeneration] Done for album: ${albumId}, selected: ${imageIds.length}`);
		return { status: "completed", count: imageIds.length };
	} catch (error) {
		console.error(`[highlightsGeneration] Error for album: ${albumId}`, error);
		throw error;
	}
};

export default run;
