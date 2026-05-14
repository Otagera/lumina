import { Elysia, t } from "elysia";
import {
	BULL_QUEUE_NAMES,
	HTTP_STATUS_CODES,
} from "../../../../packages/utils/src/constants.util.ts";
import { queueServices } from "../../../worker/src/queue/queue.service";
import { abortMultipartUploadService } from "../services/pictures/abortMultipartUpload.service.ts";
import { bulkDownloadService } from "../services/pictures/bulkDownload.service.ts";
import { completeMultipartUploadService } from "../services/pictures/completeMultipartUpload.service.ts";
import deletePictureService from "../services/pictures/deletePicture.service.ts";
import { downloadImageService } from "../services/pictures/downloadImage.service.ts";
import fetchFacesService from "../services/pictures/fetchFaces.service.ts";
import fetchPictureService from "../services/pictures/fetchPicture.service.ts";
import fetchPicturesService from "../services/pictures/fetchPictures.service.ts";
import { getPresignedUrlService } from "../services/pictures/getPresignedUrl.service.ts";
import { moderatePicturesService } from "../services/pictures/moderatePictures.service.ts";
import { reprocessPictureService } from "../services/pictures/reprocessPicture.service.ts";
import { uploadDirectLocalService } from "../services/pictures/uploadDirectLocal.service.ts";
import { uploadPicturesService } from "../services/pictures/uploadPictures.service.ts";
import { verifyShareTokenService } from "../services/pictures/verifyShareToken.service.ts";
import { authDerivation } from "./middleware/auth.plugin.ts";
import { guestPlugin } from "./middleware/guest.plugin.ts";
import { checkQuota } from "./middleware/quota.middleware.ts";

const picturesRoutes = new Elysia({ prefix: "/images" })
	.use(guestPlugin)
	.derive(authDerivation)
	.post(
		"/bulk-download",
		async ({ body, set, userId }) => {
			try {
				const data = await bulkDownloadService({
					...body,
					userId,
				});

				set.status = HTTP_STATUS_CODES.OK;
				return {
					status: "completed",
					message: "Bulk download job initiated.",
					data: { jobId: data.jobId },
				};
			} catch (error: any) {
				set.status = HTTP_STATUS_CODES.BAD_REQUEST;
				return {
					status: "error",
					message: error.message || "Failed to initiate bulk download.",
					data: null,
				};
			}
		},
		{
			body: t.Object({
				imageIds: t.Array(t.String()),
			}),
		},
	)
	.get(
		"/bulk-download/:jobId",
		async ({ params, set, userId }) => {
			try {
				const { jobId } = params;
				const queue = queueServices.bulkDownloadQueueLib.getQueue();
				const job = await queue.getJob(jobId);

				if (!job) {
					set.status = HTTP_STATUS_CODES.NOTFOUND;
					return {
						status: "error",
						message: "Job not found.",
						data: null,
					};
				}

				// Check if job belongs to this user
				if (job.data.userId !== userId) {
					set.status = HTTP_STATUS_CODES.UNAUTHORIZED;
					return {
						status: "error",
						message: "Unauthorized access to job.",
						data: null,
					};
				}

				const state = await job.getState();
				const result = job.returnvalue;

				if (state === "completed" && result?.storageKey) {
					// Generate signed URL for download
					const downloadUrl = await storage.getSignedUrl(
						result.storageKey,
						3600,
					);

					return {
						status: "completed",
						message: "Job completed.",
						data: {
							state,
							progress: 100,
							downloadUrl,
						},
					};
				}

				return {
					status: "completed",
					message: "Job status retrieved.",
					data: {
						state,
						progress: job.progress,
					},
				};
			} catch (error: any) {
				set.status = HTTP_STATUS_CODES.BAD_REQUEST;
				return {
					status: "error",
					message: error.message || "Failed to retrieve job status.",
					data: null,
				};
			}
		},
		{
			params: t.Object({
				jobId: t.String(),
			}),
		},
	)
	.post(
		"/",
		async ({ body, set, userId, guestSessionId, request }) => {
			try {
				let payload: any = {};

				// 1. Extract data from body (handle both plain object and FormData)
				if (body && typeof body === "object") {
					if (typeof (body as any).get === "function") {
						// It's a FormData-like object
						payload.albumId = (body as any).get("albumId");
						payload.key = (body as any).get("key");
						payload.status = (body as any).get("status");
						payload.uploadedImages =
							(body as any).getAll?.("uploadedImages") ||
							(body as any).get("uploadedImages");
					} else {
						// It's a plain object
						payload = body;
					}
				}

				// 2. Fallback: If still missing albumId, try manual parsing
				if (
					!payload.albumId &&
					request.headers.get("content-type")?.includes("multipart")
				) {
					try {
						const formData = await request.formData();
						payload.albumId = formData.get("albumId");
						payload.key = formData.get("key");
						payload.status = formData.get("status");
						payload.uploadedImages = formData.getAll("uploadedImages");
					} catch (e: any) {
						console.error("[PICTURES] Manual fallback failed:", e.message);
					}
				}

				if (!payload.albumId) {
					set.status = HTTP_STATUS_CODES.BAD_REQUEST;
					return {
						status: "error",
						message: "Invalid or missing request body. albumId is required.",
					};
				}

				// Normalize files: can be raw files or objects with existingKey
				const files = payload.uploadedImages
					? Array.isArray(payload.uploadedImages)
						? payload.uploadedImages
						: [payload.uploadedImages]
					: payload.key
						? [{ existingKey: payload.key }]
						: [];

				const data = await uploadPicturesService({
					albumId: payload.albumId,
					userId: userId,
					guestSessionId,
					files,
					status: payload.status,
				});

				set.status = HTTP_STATUS_CODES.CREATED;
				return {
					status: "completed",
					message: "Image uploaded and face processing initiated.",
					data,
				};
			} catch (error: unknown) {
				const err = error as { statusCode: number; message: string };
				set.status = err?.statusCode ?? HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
				return {
					status: "error",
					message: err?.message || "Internal server error",
					data: null,
				};
			}
		},
		{
			beforeHandle: [checkQuota as any],
			bodyLimit: 500 * 1024 * 1024,
			error({ error }) {
				console.error("[PICTURES ROUTE ERROR]", error);
			},
		},
	)
	.post(
		"/presigned-url",
		async ({ body, set, userId }) => {
			try {
				const data = await getPresignedUrlService({
					...body,
					userId,
				});

				set.status = HTTP_STATUS_CODES.OK;
				return {
					status: "completed",
					message: "Presigned URL generated successfully.",
					data,
				};
			} catch (error: any) {
				set.status =
					error?.statusCode ?? HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
				return {
					status: "error",
					message: error?.message || "Internal server error",
					data: null,
				};
			}
		},
		{
			beforeHandle: [checkQuota as any],
			body: t.Object({
				albumId: t.Optional(t.String()),
				fileName: t.String(),
				contentType: t.String(),
				isMultipart: t.Optional(t.Boolean()),
				uploadId: t.Optional(t.String()),
				partNumber: t.Optional(t.Numeric()),
				key: t.Optional(t.String()),
			}),
		},
	)
	.post(
		"/complete-multipart",
		async ({ body, set, userId }) => {
			try {
				const data = await completeMultipartUploadService({
					...body,
					userId,
				});

				set.status = HTTP_STATUS_CODES.OK;
				return {
					status: "completed",
					message: "Multipart upload completed successfully.",
					data,
				};
			} catch (error: any) {
				set.status =
					error?.statusCode ?? HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
				return {
					status: "error",
					message: error?.message || "Internal server error",
					data: null,
				};
			}
		},
		{
			body: t.Object({
				albumId: t.Optional(t.String()),
				key: t.String(),
				uploadId: t.String(),
				parts: t.Array(
					t.Object({
						ETag: t.String(),
						PartNumber: t.Numeric(),
					}),
				),
			}),
		},
	)
	.post(
		"/abort-multipart",
		async ({ body, set, userId }) => {
			try {
				const data = await abortMultipartUploadService({
					...body,
					userId,
				});

				set.status = HTTP_STATUS_CODES.OK;
				return {
					status: "completed",
					message: "Multipart upload aborted successfully.",
					data,
				};
			} catch (error: any) {
				set.status =
					error?.statusCode ?? HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
				return {
					status: "error",
					message: error?.message || "Internal server error",
					data: null,
				};
			}
		},
		{
			body: t.Object({
				albumId: t.Optional(t.String()),
				key: t.String(),
				uploadId: t.String(),
			}),
		},
	)
	.get(
		"/",
		async ({ query, set, userId }) => {
			try {
				const data = await fetchPicturesService({
					...query,
					userId,
				});

				set.status = HTTP_STATUS_CODES.OK;
				return {
					status: "completed",
					message: "Images retrieved successfully.",
					data,
				};
			} catch (error: unknown) {
				const err = error as { statusCode: number; message: string };
				set.status = err?.statusCode ?? HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
				return {
					status: "error",
					message: err?.message || "Internal server error",
					data: null,
				};
			}
		},
		{
			query: t.Object({
				paginationType: t.Optional(t.String()),
				limit: t.Optional(t.Numeric()),
				nextCursor: t.Optional(t.String()),
				prevCursor: t.Optional(t.String()),
				albumId: t.Optional(t.String()),
				from: t.Optional(t.String()),
				to: t.Optional(t.String()),
			}),
		},
	)
	.get(
		"/:imageId",
		async ({ params, set, userId }) => {
			try {
				const imageId = params.imageId;
				const data = await fetchPictureService({
					userId,
					imageId,
				});

				set.status = HTTP_STATUS_CODES.OK;
				return {
					status: "completed",
					message: `Image: ${imageId} retrieved successfully.`,
					data,
				};
			} catch (error: unknown) {
				const err = error as { statusCode: number; message: string };
				if (err?.message === "Image not found.") {
					set.status = HTTP_STATUS_CODES.NOTFOUND;
				} else {
					set.status =
						err?.statusCode ?? HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
				}
				return {
					status: "error",
					message: err?.message || "Internal server error",
					data: null,
				};
			}
		},
		{
			params: t.Object({
				imageId: t.String(),
			}),
		},
	)
	.delete(
		"/:imageId",
		async ({ params, set, userId }) => {
			try {
				const imageId = params.imageId;
				const data = await deletePictureService({
					userId,
					imageId,
				});

				set.status = HTTP_STATUS_CODES.OK;
				return {
					status: "completed",
					message: `Image: ${imageId} deleted successfully.`,
					data,
				};
			} catch (error: unknown) {
				const err = error as { statusCode: number; message: string };
				if (err?.message === "Image not found.") {
					set.status = HTTP_STATUS_CODES.NOTFOUND;
				} else {
					set.status =
						err?.statusCode ?? HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
				}
				return {
					status: "error",
					message: err?.message || "Internal server error",
					data: null,
				};
			}
		},
		{
			params: t.Object({
				imageId: t.String(),
			}),
		},
	)
	.get(
		"/:imageId/faces",
		async ({ params, set, userId }) => {
			try {
				const imageId = params.imageId;
				const data = await fetchFacesService({
					userId,
					imageId,
				});

				set.status = HTTP_STATUS_CODES.OK;
				return {
					status: "completed",
					message: "Faces retrieved successfully.",
					data,
				};
			} catch (error: unknown) {
				const err = error as { statusCode: number; message: string };
				if (err?.message === "Image not found.") {
					set.status = HTTP_STATUS_CODES.NOTFOUND;
				} else {
					set.status =
						err?.statusCode ?? HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
				}
				return {
					status: "error",
					message: err?.message || "Internal server error",
					data: null,
				};
			}
		},
		{
			params: t.Object({
				imageId: t.String(),
			}),
		},
	)
	.post(
		"/:imageId/reprocess",
		async ({ params, set, userId }) => {
			try {
				const imageId = params.imageId;
				const success = await reprocessPictureService({
					userId,
					imageId,
				});

				set.status = HTTP_STATUS_CODES.OK;
				return {
					status: "completed",
					message: "Image queued for re-processing.",
					data: { success },
				};
			} catch (error: unknown) {
				const err = error as { statusCode: number; message: string };
				if (err?.message === "Image not found.") {
					set.status = HTTP_STATUS_CODES.NOTFOUND;
				} else {
					set.status =
						err?.statusCode ?? HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
				}
				return {
					status: "error",
					message: err?.message || "Internal server error",
					data: null,
				};
			}
		},
		{
			params: t.Object({
				imageId: t.String(),
			}),
		},
	)
	.post(
		"/:imageId/download",
		async ({ params, set, userId }) => {
			try {
				const data = await downloadImageService({
					imageId: params.imageId,
					userId,
				});

				set.status = HTTP_STATUS_CODES.OK;
				return {
					status: "completed",
					message: "Download URL generated.",
					data,
				};
			} catch (error: any) {
				set.status =
					error?.statusCode ?? HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
				return {
					status: "error",
					message: error?.message || "Failed to generate download URL.",
					data: null,
				};
			}
		},
		{
			params: t.Object({
				imageId: t.String(),
			}),
		},
	)
	.patch(
		"/moderate",
		async ({ body, set, userId }) => {
			try {
				const data = await moderatePicturesService({
					...body,
					userId,
				});

				set.status = HTTP_STATUS_CODES.OK;
				return {
					status: "completed",
					message: "Images moderated successfully.",
					data,
				};
			} catch (error: any) {
				set.status =
					error?.statusCode ?? HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
				return {
					status: "error",
					message: error?.message || "Internal server error",
					data: null,
				};
			}
		},
		{
			body: t.Object({
				imageIds: t.Array(t.String()),
				status: t.String(),
			}),
		},
	);

const publicPicturesRoutes = new Elysia({ prefix: "/images" })
	.put(
		"/upload-direct-local",
		async ({ query, set, headers, request }) => {
			try {
				const data = await uploadDirectLocalService({
					key: query.key,
					shareToken: query.shareToken,
					authToken: query.authToken,
					authHeader: headers.authorization,
					request,
				});

				set.status = HTTP_STATUS_CODES.OK;
				return {
					status: "completed",
					message: "File uploaded successfully via direct local upload.",
					data,
				};
			} catch (error: any) {
				set.status =
					error?.statusCode ?? HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
				return {
					status: "error",
					message: error?.message || "Internal server error",
					data: null,
				};
			}
		},
		{
			query: t.Object({
				key: t.String(),
				shareToken: t.Optional(t.String()),
				authToken: t.Optional(t.String()),
			}),
		},
	)
	.post(
		"/complete-multipart",
		async ({ body, set }) => {
			try {
				// Verify share token
				await verifyShareTokenService({ shareToken: body.shareToken, key: "" });

				const data = await completeMultipartUploadService({
					...body,
				});

				set.status = HTTP_STATUS_CODES.OK;
				return {
					status: "completed",
					message: "Multipart upload completed successfully.",
					data,
				};
			} catch (error: any) {
				set.status =
					error?.statusCode ?? HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
				return {
					status: "error",
					message: error?.message || "Internal server error",
					data: null,
				};
			}
		},
		{
			body: t.Object({
				shareToken: t.String(),
				key: t.String(),
				uploadId: t.String(),
				parts: t.Array(
					t.Object({
						ETag: t.String(),
						PartNumber: t.Number(),
					}),
				),
			}),
		},
	)
	.post(
		"/abort-multipart",
		async ({ body, set }) => {
			try {
				// Verify share token
				await verifyShareTokenService({ shareToken: body.shareToken, key: "" });

				const data = await abortMultipartUploadService({
					...body,
				});

				set.status = HTTP_STATUS_CODES.OK;
				return {
					status: "completed",
					message: "Multipart upload aborted successfully.",
					data,
				};
			} catch (error: any) {
				set.status =
					error?.statusCode ?? HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
				return {
					status: "error",
					message: error?.message || "Internal server error",
					data: null,
				};
			}
		},
		{
			body: t.Object({
				shareToken: t.String(),
				key: t.String(),
				uploadId: t.String(),
			}),
		},
	);

export { picturesRoutes, publicPicturesRoutes };
export default picturesRoutes;
