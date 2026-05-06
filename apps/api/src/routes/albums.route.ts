import { Elysia, t } from "elysia";
import { HTTP_STATUS_CODES } from "../../../../packages/utils/src/constants.util.ts";
import { alterAlbumService } from "../services/albums/alterAlbum.service.ts";
import { createAlbumService } from "../services/albums/createAlbum.service.ts";
import { fetchAlbumService } from "../services/albums/fetchAlbum.service.ts";
import { fetchAlbumsService } from "../services/albums/fetchAlbums.service.ts";
import { fetchImagesInAlbumService } from "../services/albums/fetchImagesInAlbum.service.ts";
import { generateInviteService } from "../services/albums/generateInvite.service.ts";
import { joinAlbumService } from "../services/albums/joinAlbum.service.ts";
import { removeAlbumService } from "../services/albums/removeAlbum.service.ts";
import { removeImagesInAlbumService } from "../services/albums/removeImagesInAlbum.service.ts";
import { resendInviteService } from "../services/albums/resendInvite.service.ts";
import { updateMemberRoleService } from "../services/albums/updateMemberRole.service.ts";
import { authDerivation } from "./middleware/auth.plugin.ts";
import { checkAlbumPermissions } from "./middleware/permissions.plugin.ts";

const albumsRoutes = new Elysia({ prefix: "/albums" })
	.derive(authDerivation)
	.get("/", async ({ userId, set }) => {
		try {
			const data = await fetchAlbumsService({ userId });

			set.status = HTTP_STATUS_CODES.OK;
			return {
				status: "completed",
				message: "Albums fetched successfully.",
				data,
			};
		} catch (error: any) {
			set.status = error?.statusCode || HTTP_STATUS_CODES.BAD_REQUEST;
			return {
				status: "error",
				message: error?.message || "Internal server error",
				data: null,
			};
		}
	})
	.post(
		"/",
		async ({ body, set, userId }) => {
			try {
				const data = await createAlbumService({
					...body,
					userId,
				});

				set.status = HTTP_STATUS_CODES.CREATED;
				return {
					status: "completed",
					message: "Album created successfully.",
					data,
				};
			} catch (error: any) {
				set.status = error?.statusCode || HTTP_STATUS_CODES.BAD_REQUEST;
				return {
					status: "error",
					message: error?.message || "Internal server error",
					data: null,
				};
			}
		},
		{
			body: t.Object({
				albumName: t.String(),
			}),
		},
	)
	.post(
		"/join",
		async ({ body, set, userId }) => {
			try {
				const data = await joinAlbumService({
					...body,
					userId,
				});

				set.status = HTTP_STATUS_CODES.OK;
				return {
					status: "completed",
					message: "Album joined successfully.",
					data,
				};
			} catch (error: any) {
				set.status = error?.statusCode || HTTP_STATUS_CODES.BAD_REQUEST;
				return {
					status: "error",
					message: error?.message || "Internal server error",
					data: null,
				};
			}
		},
		{
			body: t.Object({
				inviteToken: t.String(),
			}),
		},
	)
	.get(
		"/:albumId",
		async ({ params, set, userId }) => {
			try {
				const albumId = params.albumId;
				await checkAlbumPermissions(albumId, userId, ["VIEWER", "ADMIN"]);

				const data = await fetchAlbumService({ albumId, userId });

				set.status = HTTP_STATUS_CODES.OK;
				return {
					status: "completed",
					message: "Album fetched successfully.",
					data,
				};
			} catch (error: any) {
				set.status = error?.statusCode || HTTP_STATUS_CODES.BAD_REQUEST;
				return {
					status: "error",
					message: error?.message || "Internal server error",
					data: null,
				};
			}
		},
		{
			params: t.Object({
				albumId: t.String(),
			}),
		},
	)
	.get(
		"/:albumId/images",
		async ({ params, query, set, userId }) => {
			try {
				const albumId = params.albumId;
				await checkAlbumPermissions(albumId, userId, ["VIEWER", "CONTRIBUTOR", "ADMIN"]);

				const data = await fetchImagesInAlbumService({
					albumId,
					userId,
					...query,
				});

				set.status = HTTP_STATUS_CODES.OK;
				return {
					status: "completed",
					message: "Images fetched successfully.",
					data,
				};
			} catch (error: any) {
				set.status = error?.statusCode || HTTP_STATUS_CODES.BAD_REQUEST;
				return {
					status: "error",
					message: error?.message || "Internal server error",
					data: null,
				};
			}
		},
		{
			params: t.Object({
				albumId: t.String(),
			}),
			query: t.Object({
				paginationType: t.Optional(t.String()),
				limit: t.Optional(t.Numeric()),
				nextCursor: t.Optional(t.String()),
				prevCursor: t.Optional(t.String()),
				status: t.Optional(t.String()),
				sortBy: t.Optional(t.String()),
				startDate: t.Optional(t.String()),
				endDate: t.Optional(t.String()),
				uploaderId: t.Optional(t.String()),
			}),
		},
	)
	.put(
		"/:albumId",
		async ({ params, body, set, userId }) => {
			try {
				const albumId = params.albumId;
				await checkAlbumPermissions(albumId, userId, ["ADMIN"]);

				const data = await alterAlbumService({
					...body,
					albumId,
					userId,
				});

				set.status = HTTP_STATUS_CODES.OK;
				return {
					status: "completed",
					message: "Album updated successfully.",
					data,
				};
			} catch (error: any) {
				set.status = error?.statusCode || HTTP_STATUS_CODES.BAD_REQUEST;
				return {
					status: "error",
					message: error?.message || "Internal server error",
					data: null,
				};
			}
		},
		{
			params: t.Object({
				albumId: t.String(),
			}),
			body: t.Any(),
		},
	)
	.post(
		"/:albumId/images/bulk-status",
		async ({ params, body, set, userId }) => {
			try {
				const albumId = params.albumId;
				await checkAlbumPermissions(albumId, userId, ["ADMIN"]);

				const data = await removeImagesInAlbumService({
					...body,
					albumId,
					userId,
				});

				set.status = HTTP_STATUS_CODES.OK;
				return {
					status: "completed",
					message: "Images status updated successfully.",
					data,
				};
			} catch (error: any) {
				set.status = error?.statusCode || HTTP_STATUS_CODES.BAD_REQUEST;
				return {
					status: "error",
					message: error?.message || "Internal server error",
					data: null,
				};
			}
		},
		{
			params: t.Object({ albumId: t.String() }),
			body: t.Object({
				imageIds: t.Array(t.String()),
				status: t.String(),
				reason: t.Optional(t.String()),
			}),
		},
	)
	.delete(
		"/:albumId",
		async ({ params, set, userId }) => {
			try {
				const albumId = params.albumId;
				await checkAlbumPermissions(albumId, userId, ["ADMIN"]);

				const data = await removeAlbumService({ userId, albumId });

				set.status = HTTP_STATUS_CODES.OK;
				return {
					status: "completed",
					message: `Album: ${albumId} deleted successfully.`,
					data,
				};
			} catch (error: any) {
				set.status = error?.statusCode || HTTP_STATUS_CODES.BAD_REQUEST;
				return {
					status: "error",
					message: error?.message || "Internal server error",
					data: null,
				};
			}
		},
		{
			params: t.Object({
				albumId: t.String(),
			}),
		},
	)
	.post(
		"/:albumId/invites",
		async ({ params, body, set, userId }) => {
			try {
				const albumId = params.albumId;
				await checkAlbumPermissions(albumId, userId, ["ADMIN"]);

				const data = await generateInviteService({
					...body,
					albumId,
					userId,
				});

				set.status = HTTP_STATUS_CODES.CREATED;
				return {
					status: "completed",
					message: "Invite generated successfully.",
					data,
				};
			} catch (error: any) {
				set.status = error?.statusCode || HTTP_STATUS_CODES.BAD_REQUEST;
				return {
					status: "error",
					message: error?.message || "Internal server error",
					data: null,
				};
			}
		},
		{
			params: t.Object({ albumId: t.String() }),
			body: t.Object({
				role: t.Optional(t.String()),
				passcode: t.Optional(t.String()),
				expiresInDays: t.Optional(t.Numeric()),
			}),
		},
	)
	.post(
		"/:albumId/invites/:inviteId/resend",
		async ({ params, set, userId }) => {
			try {
				const albumId = params.albumId;
				await checkAlbumPermissions(albumId, userId, ["ADMIN"]);

				const data = await resendInviteService({
					inviteId: params.inviteId,
					albumId,
					userId,
				});

				set.status = HTTP_STATUS_CODES.OK;
				return {
					status: "completed",
					message: "Invite resent successfully.",
					data,
				};
			} catch (error: any) {
				set.status = error?.statusCode || HTTP_STATUS_CODES.BAD_REQUEST;
				return {
					status: "error",
					message: error?.message || "Internal server error",
					data: null,
				};
			}
		},
		{
			params: t.Object({
				albumId: t.String(),
				inviteId: t.String(),
			}),
		},
	)
	.patch(
		"/:albumId/invites/:inviteId",
		async ({ params, body, set, userId }) => {
			try {
				const albumId = params.albumId;
				await checkAlbumPermissions(albumId, userId, ["ADMIN"]);

				const data = await updateMemberRoleService({
					inviteId: params.inviteId,
					albumId,
					userId,
					role: body.role,
				});

				set.status = HTTP_STATUS_CODES.OK;
				return {
					status: "completed",
					message: "Invite updated successfully.",
					data,
				};
			} catch (error: any) {
				set.status = error?.statusCode || HTTP_STATUS_CODES.BAD_REQUEST;
				return {
					status: "error",
					message: error?.message || "Internal server error",
					data: null,
				};
			}
		},
		{
			params: t.Object({
				albumId: t.String(),
				inviteId: t.String(),
			}),
			body: t.Object({
				role: t.String(),
			}),
		},
	);

export default albumsRoutes;
