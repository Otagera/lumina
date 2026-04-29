import { Elysia, t } from "elysia";
import prisma from "../../../../packages/config/src/db.config.ts";
import { deleteAlbumsByUserId } from "../../../../packages/models/src/albums.model.ts";
import {
	cleanupImageSideEffects,
	deleteImagesWithLogging,
} from "../../../../packages/models/src/images.model.ts";
import { HTTP_STATUS_CODES } from "../../../../packages/utils/src/constants.util.ts";
import { normalizeImagePath } from "../../../../packages/utils/src/image.util.ts";
import { restoreAlbumService } from "../services/albums/restoreAlbum.service.ts";
import restorePictureService from "../services/pictures/restorePicture.service.ts";
import { authDerivation } from "./middleware/auth.plugin.ts";

const trashRoutes = new Elysia({ prefix: "/trash" })
	.derive(authDerivation)
	.get("/", async ({ userId, set }) => {
		try {
			// Fetch soft-deleted albums
			const deletedAlbums = await prisma.albums.findMany({
				where: {
					created_by: userId,
					deleted_at: { not: null },
				},
				orderBy: { deleted_at: "desc" },
			});

			// Fetch soft-deleted images
			const deletedImages = await prisma.images.findMany({
				where: {
					uploaded_by: userId,
					deleted_at: { not: null },
				},
				orderBy: { deleted_at: "desc" },
			});

			return {
				status: "completed",
				data: {
					albums: deletedAlbums.map((a) => ({
						id: a.album_id,
						name: a.album_name,
						deletedAt: a.deleted_at,
					})),
					images: deletedImages.map((img) => ({
						id: img.image_id,
						path: normalizeImagePath(img.image_path),
						deletedAt: img.deleted_at,
					})),
				},
			};
		} catch (error: any) {
			set.status = HTTP_STATUS_CODES.BAD_REQUEST;
			return { status: "error", message: error.message };
		}
	})
	.post(
		"/images/restore",
		async ({ body, userId, set }) => {
			try {
				const data = await restorePictureService({
					...body,
					userId,
				});
				return {
					status: "completed",
					message: "Images restored successfully",
					data,
				};
			} catch (error: any) {
				set.status = HTTP_STATUS_CODES.BAD_REQUEST;
				return { status: "error", message: error.message };
			}
		},
		{
			body: t.Object({
				imageIds: t.Array(t.String()),
			}),
		},
	)
	.delete(
		"/images",
		async ({ body, userId, set }) => {
			try {
				const { imageIds } = body;

				// Verify ownership of images
				const images = await prisma.images.findMany({
					where: {
						image_id: { in: imageIds },
						uploaded_by: userId,
						deleted_at: { not: null },
					},
				});

				if (images.length === 0) {
					set.status = HTTP_STATUS_CODES.NOTFOUND;
					return {
						status: "error",
						message: "No images found to permanently delete",
						data: null,
					};
				}

				// Permanently delete images and credit usage
				await deleteImagesWithLogging(images.map((img) => img.image_id));

				return {
					status: "completed",
					message: `${images.length} image(s) permanently deleted. Quota credited.`,
					data: { deletedCount: images.length },
				};
			} catch (error: any) {
				set.status = HTTP_STATUS_CODES.BAD_REQUEST;
				return { status: "error", message: error.message };
			}
		},
		{
			body: t.Object({
				imageIds: t.Array(t.String()),
			}),
		},
	)
	.delete(
		"/albums",
		async ({ body, userId, set }) => {
			try {
				const { albumIds } = body;

				// Fetch albums to be permanently deleted
				const albumsToDelete = await prisma.albums.findMany({
					where: {
						album_id: { in: albumIds },
						created_by: userId,
						deleted_at: { not: null },
					},
				});

				if (albumsToDelete.length === 0) {
					set.status = HTTP_STATUS_CODES.NOTFOUND;
					return {
						status: "error",
						message: "No albums found to permanently delete",
						data: null,
					};
				}

				// Get all images in these albums
				const albumImages = await prisma.album_images.findMany({
					where: { album_id: { in: albumIds } },
					select: { image_id: true },
				});

				const imageIds = albumImages
					.map((ai) => ai.image_id)
					.filter((id) => id !== null) as string[];

				// Get full image data for usage logging
				let images: any[] = [];
				if (imageIds.length > 0) {
					images = await prisma.images.findMany({
						where: { image_id: { in: imageIds } },
					});
				}

				// Credit usage for images before deleting
				if (images.length > 0) {
					await cleanupImageSideEffects(images);
				}

				// Permanently delete the albums (cascade will handle album_images)
				await prisma.albums.deleteMany({
					where: { album_id: { in: albumIds } },
				});

				return {
					status: "completed",
					message: `${albumsToDelete.length} album(s) permanently deleted. ${images.length} image(s) quota credited.`,
					data: {
						deletedAlbums: albumsToDelete.length,
						deletedImages: images.length,
					},
				};
			} catch (error: any) {
				set.status = HTTP_STATUS_CODES.BAD_REQUEST;
				return { status: "error", message: error.message };
			}
		},
		{
			body: t.Object({
				albumIds: t.Array(t.String()),
			}),
		},
	)
	.delete("/", async ({ userId, set }) => {
		try {
			// Get all soft-deleted albums for user
			const deletedAlbums = await prisma.albums.findMany({
				where: {
					created_by: userId,
					deleted_at: { not: null },
				},
			});

			const albumIds = deletedAlbums.map((a) => a.album_id);

			// Get all images in these albums
			let imageIds: string[] = [];
			if (albumIds.length > 0) {
				const albumImages = await prisma.album_images.findMany({
					where: { album_id: { in: albumIds } },
					select: { image_id: true },
				});
				imageIds = albumImages
					.map((ai) => ai.image_id)
					.filter((id) => id !== null) as string[];
			}

			// Also get soft-deleted standalone images
			const standaloneImages = await prisma.images.findMany({
				where: {
					uploaded_by: userId,
					deleted_at: { not: null },
				},
				select: { image_id: true },
			});
			const standaloneImageIds = standaloneImages.map((img) => img.image_id);
			imageIds = [...imageIds, ...standaloneImageIds];

			// Get full image data for usage logging
			let images: any[] = [];
			if (imageIds.length > 0) {
				images = await prisma.images.findMany({
					where: { image_id: { in: imageIds } },
				});
			}

			// Credit usage for images before deleting
			if (images.length > 0) {
				await cleanupImageSideEffects(images);
			}

			// Permanently delete all
			if (albumIds.length > 0) {
				await prisma.albums.deleteMany({
					where: { album_id: { in: albumIds } },
				});
			}

			if (imageIds.length > 0) {
				await prisma.images.deleteMany({
					where: { image_id: { in: imageIds } },
				});
			}

			return {
				status: "completed",
				message: `Trash emptied. ${deletedAlbums.length} album(s), ${images.length} image(s) permanently deleted. Quota credited.`,
				data: {
					deletedAlbums: deletedAlbums.length,
					deletedImages: images.length,
				},
			};
		} catch (error: any) {
			set.status = HTTP_STATUS_CODES.BAD_REQUEST;
			return { status: "error", message: error.message };
		}
	})
	.post(
		"/albums/:albumId/restore",
		async ({ params, userId, set }) => {
			try {
				const data = await restoreAlbumService({
					albumId: params.albumId,
					userId,
				});
				return {
					status: "completed",
					message: "Album restored successfully",
					data,
				};
			} catch (error: any) {
				set.status = HTTP_STATUS_CODES.BAD_REQUEST;
				return { status: "error", message: error.message };
			}
		},
		{
			params: t.Object({
				albumId: t.String(),
			}),
		},
	);

export default trashRoutes;
