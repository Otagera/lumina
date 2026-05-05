import { Elysia, t } from "elysia";
import { HTTP_STATUS_CODES } from "../../../../packages/utils/src/constants.util.ts";
import { listTrashService } from "../services/trash/listTrash.service.ts";
import { permanentDeleteImagesService } from "../services/trash/permanentDeleteImages.service.ts";
import { permanentDeleteAlbumsService } from "../services/trash/permanentDeleteAlbums.service.ts";
import { emptyTrashService } from "../services/trash/emptyTrash.service.ts";
import { restoreAlbumService } from "../services/albums/restoreAlbum.service.ts";
import restorePictureService from "../services/pictures/restorePicture.service.ts";
import { authDerivation } from "./middleware/auth.plugin.ts";

const trashRoutes = new Elysia({ prefix: "/trash" })
	.derive(authDerivation)
	.get("/", async ({ userId, set }) => {
		try {
			const data = await listTrashService({ userId });
			set.status = HTTP_STATUS_CODES.OK;
			return {
				status: "completed",
				data,
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
				const data = await permanentDeleteImagesService({
					imageIds: body.imageIds,
					userId,
				});

				return {
					status: "completed",
					message: `${data.deletedCount} image(s) permanently deleted. Quota credited.`,
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
		"/albums",
		async ({ body, userId, set }) => {
			try {
				const data = await permanentDeleteAlbumsService({
					albumIds: body.albumIds,
					userId,
				});

				return {
					status: "completed",
					message: `${data.deletedAlbums} album(s) permanently deleted. ${data.deletedImages} image(s) quota credited.`,
					data,
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
			const data = await emptyTrashService({ userId });

			return {
				status: "completed",
				message: `Trash emptied. ${data.deletedAlbums} album(s), ${data.deletedImages} image(s) permanently deleted. Quota credited.`,
				data,
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
