import prisma from "../../../../../packages/config/src/db.config.ts";
import { cleanupImageSideEffects } from "../../../../../packages/models/src/images.model.ts";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const run = async (jobData) => {
	const cutoffDate = new Date(Date.now() - THIRTY_DAYS_MS);

	console.log(
		`[TRASH CLEANUP] Starting cleanup for items deleted before ${cutoffDate.toISOString()}`,
	);

	let totalImagesDeleted = 0;
	let totalAlbumsDeleted = 0;

	try {
		// Find all soft-deleted images older than 30 days
		const oldImages = await prisma.images.findMany({
			where: {
				deleted_at: { not: null, lt: cutoffDate },
			},
		});

		if (oldImages.length > 0) {
			console.log(
				`[TRASH CLEANUP] Found ${oldImages.length} images to permanently delete`,
			);

			// Credit usage before deletion
			await cleanupImageSideEffects(oldImages);

			// Get image IDs for deletion
			const imageIds = oldImages.map((img) => img.image_id);

			// Delete faces first
			await prisma.faces.deleteMany({
				where: { image_id: { in: imageIds } },
			});

			// Delete album_image links
			await prisma.album_images.deleteMany({
				where: { image_id: { in: imageIds } },
			});

			// Delete the images
			await prisma.images.deleteMany({
				where: { image_id: { in: imageIds } },
			});

			totalImagesDeleted = oldImages.length;
		}

		// Find all soft-deleted albums older than 30 days
		const oldAlbums = await prisma.albums.findMany({
			where: {
				deleted_at: { not: null, lt: cutoffDate },
			},
		});

		if (oldAlbums.length > 0) {
			console.log(
				`[TRASH CLEANUP] Found ${oldAlbums.length} albums to permanently delete`,
			);

			const albumIds = oldAlbums.map((album) => album.album_id);

			// Get all images in these albums
			const albumImages = await prisma.album_images.findMany({
				where: { album_id: { in: albumIds } },
			});

			const imageIds = albumImages
				.map((ai) => ai.image_id)
				.filter((id) => id !== null);

			// Get full image data for usage logging
			let images = [];
			if (imageIds.length > 0) {
				images = await prisma.images.findMany({
					where: { image_id: { in: imageIds } },
				});

				// Credit usage for images
				if (images.length > 0) {
					await cleanupImageSideEffects(images);
				}
			}

			// Delete album members
			await prisma.album_members.deleteMany({
				where: { album_id: { in: albumIds } },
			});

			// Delete album settings
			await prisma.album_settings.deleteMany({
				where: { album_id: { in: albumIds } },
			});

			// Delete album images
			await prisma.album_images.deleteMany({
				where: { album_id: { in: albumIds } },
			});

			// Delete the albums
			await prisma.albums.deleteMany({
				where: { album_id: { in: albumIds } },
			});

			totalAlbumsDeleted = oldAlbums.length;
		}

		console.log(
			`[TRASH CLEANUP] Completed. Deleted ${totalImagesDeleted} images, ${totalAlbumsDeleted} albums`,
		);

		return {
			status: "success",
			imagesDeleted: totalImagesDeleted,
			albumsDeleted: totalAlbumsDeleted,
		};
	} catch (error) {
		console.error("[TRASH CLEANUP] Error during cleanup:", error);
		throw error;
	}
};

export default run;
