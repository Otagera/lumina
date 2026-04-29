import { Elysia, t } from "elysia";
import { HTTP_STATUS_CODES } from "../../../../packages/utils/src/constants.util.ts";
import { checkAlbumPermissions } from "../../../../packages/utils/src/permissions.util.ts";
import { addImagesToAlbumService } from "../services/albums/addImagesToAlbum.service.ts";
import { getAlbumForUser } from "../services/albums/albums.lib";
import { alterAlbumService } from "../services/albums/alterAlbum.service.ts";
import { createAlbumService } from "../services/albums/createAlbum.service.ts";
import { deleteInviteService } from "../services/albums/deleteInvite.service.ts";
import { fetchAlbumService } from "../services/albums/fetchAlbum.service.ts";
import { fetchAlbumsService } from "../services/albums/fetchAlbums.service.ts";
import { fetchImagesInAlbumService } from "../services/albums/fetchImagesInAlbum.service.ts";
import { generateInviteService } from "../services/albums/generateInvite.service.ts";
import { joinAlbumService } from "../services/albums/joinAlbum.service.ts";
import { moderateImagesService } from "../services/albums/moderateImages.service.ts";
import { removeAlbumService } from "../services/albums/removeAlbum.service.ts";
import { removeAlbumsService } from "../services/albums/removeAlbums.service.ts";
import { removeImagesInAlbumService } from "../services/albums/removeImagesInAlbum.service.ts";
import { removeMemberService } from "../services/albums/removeMember.service.ts";
import { resendInviteService } from "../services/albums/resendInvite.service.ts";
import { updateMemberRoleService } from "../services/albums/updateMemberRole.service.ts";
import { findDuplicatesService } from "../services/pictures/findDuplicates.service.ts";

import { authDerivation } from "./middleware/auth.plugin.ts";

const albumsRoutes = new Elysia({ prefix: "/albums" })
	.derive(authDerivation)
	.post(
		"/",
		async ({ body, set, userId }) => {
			try {
				const data = await createAlbumService({
					albumName: body.albumName,
					userId: userId,
				});

				set.status = HTTP_STATUS_CODES.CREATED;
				return {
					status: "completed",
					message: `Album created successfully.`,
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
	.get("/", async ({ set, userId }) => {
		try {
			const data = await fetchAlbumsService({ userId });

			set.status = HTTP_STATUS_CODES.OK;
			return {
				status: "completed",
				message: `Albums retrieved successfully.`,
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
		"/join",
		async ({ body, set, userId }) => {
			try {
				const data = await joinAlbumService({
					userId,
					inviteToken: body.inviteToken,
				});

				set.status = HTTP_STATUS_CODES.OK;
				return {
					status: "completed",
					message: `Successfully joined album.`,
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

				const album = await getAlbumForUser(albumId, userId);

				const data = {
					id: album.album_id,
					albumName: album.album_name,
					userId: album.created_by,
					creationDate: album.creation_date,
					sharedLink: album.shared_link,
					shareToken: album.share_token,
					settings: album.settings,
					members: album.album_members,
				};

				set.status = HTTP_STATUS_CODES.OK;
				return {
					status: "completed",
					message: `Album: ${albumId} retrieved successfully.`,
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
				albumId: t.String(), // Assuming albumId is a string/UUID
			}),
		},
	)
	.put(
		"/:albumId",
		async ({ params, body, set, userId }) => {
			try {
				const albumId = params.albumId;
				await checkAlbumPermissions(albumId, userId, ["ADMIN"]);

				const data = await alterAlbumService({ ...body, userId, albumId });

				set.status = HTTP_STATUS_CODES.OK;
				return {
					status: "completed",
					message: `Album: ${albumId} updated successfully.`,
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
				albumId: t.String(), // Assuming albumId is a string/UUID
			}),
			body: t.Object({
				albumName: t.Optional(t.String()),
				shareToken: t.Optional(t.Nullable(t.String())),
				settings: t.Optional(
					t.Object({
						is_event: t.Optional(t.Boolean()),
						requires_approval: t.Optional(t.Boolean()),
						tagging_policy: t.Optional(t.String()),
						expires_at: t.Optional(t.Nullable(t.String())),
						allow_guest_uploads: t.Optional(t.Boolean()),
					}),
				),
				storageConfigId: t.Optional(t.Nullable(t.String())),
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
					albumId,
					role: body.role,
				});

				set.status = HTTP_STATUS_CODES.CREATED;
				return {
					status: "completed",
					message: `Invite generated successfully.`,
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
			}),
		},
	)
	.delete(
		"/:albumId/invites/:memberId",
		async ({ params, set, userId }) => {
			try {
				const { albumId, memberId } = params;
				await checkAlbumPermissions(albumId, userId, ["ADMIN"]);

				const data = await deleteInviteService({
					albumId,
					memberId,
				});

				set.status = HTTP_STATUS_CODES.OK;
				return {
					status: "completed",
					message: "Invite deleted.",
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
			params: t.Object({ albumId: t.String(), memberId: t.String() }),
		},
	)
	.post(
		"/:albumId/invites/:memberId/resend",
		async ({ params, set, userId }) => {
			try {
				const { albumId, memberId } = params;
				await checkAlbumPermissions(albumId, userId, ["ADMIN"]);

				const data = await resendInviteService({
					albumId,
					memberId,
				});

				set.status = HTTP_STATUS_CODES.OK;
				return {
					status: "completed",
					message: "Invite resent.",
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
			params: t.Object({ albumId: t.String(), memberId: t.String() }),
		},
	)
	.patch(
		"/:albumId/members/:memberId",
		async ({ params, body, set, userId }) => {
			try {
				const { albumId, memberId } = params;
				await checkAlbumPermissions(albumId, userId, ["ADMIN"]);

				const data = await updateMemberRoleService({
					albumId,
					memberId,
					role: body.role,
				});

				set.status = HTTP_STATUS_CODES.OK;
				return {
					status: "completed",
					message: "Member role updated.",
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
			params: t.Object({ albumId: t.String(), memberId: t.String() }),
			body: t.Object({
				role: t.String(),
			}),
		},
	)
	.delete(
		"/:albumId/members/:memberId",
		async ({ params, set, userId }) => {
			try {
				const { albumId, memberId } = params;
				await checkAlbumPermissions(albumId, userId, ["ADMIN"]);

				const data = await removeMemberService({
					albumId,
					memberId,
				});

				set.status = HTTP_STATUS_CODES.OK;
				return {
					status: "completed",
					message: "Member removed.",
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
			params: t.Object({ albumId: t.String(), memberId: t.String() }),
		},
	)
	.post(
		"/:albumId/moderate",
		async ({ params, body, set, userId }) => {
			try {
				const albumId = params.albumId;
				await checkAlbumPermissions(albumId, userId, ["ADMIN"]);

				const data = await moderateImagesService({
					albumId,
					...body,
				});

				set.status = HTTP_STATUS_CODES.OK;
				return {
					status: "completed",
					message: `Successfully moderated ${data.count} images.`,
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
				albumId: t.String(), // Assuming albumId is a string/UUID
			}),
		},
	)
	.get(
		"/:albumId/images",
		async ({ params, query, set, userId }) => {
			try {
				const albumId = params.albumId;

				const data = await fetchImagesInAlbumService({
					...query, // Assuming query params for filtering/pagination
					userId,
					albumId,
				});

				set.status = HTTP_STATUS_CODES.OK;
				return {
					status: "completed",
					message: `Album images retrieved successfully.`,
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
				albumId: t.String(), // Assuming albumId is a string/UUID
			}),
			query: t.Object({
				limit: t.Optional(t.String()),
				nextCursor: t.Optional(t.String()),
				paginationType: t.Optional(t.String()),
				status: t.Optional(t.String()),
				uploaderId: t.Optional(t.String()),
				startDate: t.Optional(t.String()),
				endDate: t.Optional(t.String()),
			}),
		},
	)
	.post(
		"/:albumId/images",
		async ({ params, body, set, userId }) => {
			try {
				const albumId = params.albumId;

				const data = await addImagesToAlbumService({
					...body,
					userId,
					albumId,
				});

				if (data.idempotent) {
					set.status = HTTP_STATUS_CODES.OK;
					return {
						status: "completed",
						message: `Image already exists in the album.`,
						data: data.album_image,
					};
				}
				set.status = HTTP_STATUS_CODES.CREATED;
				return {
					status: "completed",
					message: `Image added to album successfully.`,
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
				albumId: t.String(), // Assuming albumId is a string/UUID
			}),
			body: t.Object({
				imageIds: t.Array(t.String()), // Assuming imageIds is an array of strings/UUIDs
			}),
		},
	)
	.post(
		"/:albumId/images/delete-batch",
		async ({ params, body, set, userId }) => {
			try {
				const albumId = params.albumId;

				const data = await removeImagesInAlbumService({
					...body,
					userId,
					albumId,
				});

				set.status = HTTP_STATUS_CODES.OK;
				return {
					status: "completed",
					message: `Image(s) removed from album successfully.`,
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
				albumId: t.String(), // Assuming albumId is a string/UUID
			}),
			body: t.Object({
				imageIds: t.Array(t.String()), // Assuming imageIds is an array of strings/UUIDs
			}),
		},
	)
	.post(
		"/:albumId/cluster",
		async ({ params, set, userId }) => {
			try {
				const albumId = params.albumId;
				console.log(
					`[CLUSTER] Triggered for album ${albumId} by user ${userId}`,
				);

				// Dynamic import to ensure queueServices is ready and avoid circular deps
				const { queueServices: localQueueServices } = await import(
					"../../../worker/src/queue/queue.service.ts"
				);

				if (!localQueueServices) {
					throw new Error("Queue services not initialized");
				}

				await getAlbumForUser(albumId, userId);

				await localQueueServices.faceClusteringQueueLib.addJob(
					"faceClustering",
					{
						albumId,
						worker: "faceClustering",
					},
					{ removeOnComplete: { count: 100 }, removeOnFail: { count: 100 } },
				);

				set.status = HTTP_STATUS_CODES.OK;
				return {
					status: "completed",
					message: `Face clustering initiated for album: ${albumId}`,
					data: null,
				};
			} catch (error: any) {
				console.error("[CLUSTER] Route Error:", error.message);
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
	.delete("/", async ({ set, userId }) => {
		try {
			const data = await removeAlbumsService({ userId });

			set.status = HTTP_STATUS_CODES.OK;
			return {
				status: "completed",
				message: `Albums deleted successfully.`,
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
	.get(
		"/:albumId/duplicates",
		async ({ params, query, userId, set }) => {
			try {
				const data = await findDuplicatesService({
					albumId: params.albumId,
					userId,
					threshold: query.threshold ? Number.parseInt(query.threshold) : 5,
				});

				set.status = HTTP_STATUS_CODES.OK;
				return {
					status: "completed",
					message: "Duplicates identified successfully.",
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
				threshold: t.Optional(t.String()),
			}),
		},
	);

export default albumsRoutes;
