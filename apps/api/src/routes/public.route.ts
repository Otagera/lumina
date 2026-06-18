import { Elysia, t } from "elysia";
import { HTTP_STATUS_CODES } from "../../../../packages/utils/src/constants.util.ts";
import { getInviteDetailsService } from "../services/albums/getInviteDetails.service.ts";
import { getHighlightsService } from "../services/pictures/getHighlights.service.ts";
import { getPresignedUrlService } from "../services/pictures/getPresignedUrl.service.ts";
import { fetchGuestSuggestionsService } from "../services/public/fetchGuestSuggestions.service.ts";
import { getPlansService } from "../services/public/getPlans.service.ts";
import { getSharedAlbumService } from "../services/public/getSharedAlbum.service.ts";
import { getSharedImageService } from "../services/public/getSharedImage.service.ts";
import { searchFacesPublicService } from "../services/public/searchFacesPublic.service.ts";
import { selfieSearchService } from "../services/public/selfieSearch.service.ts";
import { uploadPublicService } from "../services/public/uploadPublic.service.ts";
import { deleteSelfieDataService } from "../services/public/deleteSelfieData.service.ts";
import { guestDownloadService } from "../services/public/guestDownload.service.ts";
import { verifyDisplayPinService } from "../services/public/verifyDisplayPin.service.ts";
import { addPublicReactionService } from "../services/reactions/addPublicReaction.service.ts";
import { guestPlugin } from "./middleware/guest.plugin.ts";
import { checkQuota } from "./middleware/quota.middleware";
import {
	publicRateLimit,
	strictPublicRateLimit,
} from "./middleware/rate-limit.plugin.ts";

const publicRoutes = new Elysia({ prefix: "/public" })
	.use(guestPlugin)
	.use(publicRateLimit)
	.get("/plans", async ({ set }) => {
		try {
			const data = await getPlansService();

			set.status = HTTP_STATUS_CODES.OK;
			return {
				status: "completed",
				message: "Plans fetched successfully",
				data: data.plans,
			};
		} catch (error: any) {
			set.status = HTTP_STATUS_CODES.BAD_REQUEST;
			return {
				status: "error",
				message: error?.message || "Internal server error",
				data: null,
			};
		}
	})
	.get(
		"/albums/:token",
		async ({ params, query, set, guestSessionId }) => {
			try {
				const data = await getSharedAlbumService({
					token: params.token,
					...query,
					guestSessionId,
				});

				set.status = HTTP_STATUS_CODES.OK;
				return {
					status: "completed",
					message: "Shared album retrieved successfully.",
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
			params: t.Object({ token: t.String() }),
			query: t.Object({
				status: t.Optional(t.String()),
				startDate: t.Optional(t.String()),
				endDate: t.Optional(t.String()),
				uploaderId: t.Optional(t.String()),
				minFaces: t.Optional(t.Numeric()),
			}),
		},
	)
	.get(
		"/images/:token/:imageId",
		async ({ params, set }) => {
			try {
				const data = await getSharedImageService({
					token: params.token,
					imageId: params.imageId,
				});

				set.status = HTTP_STATUS_CODES.OK;
				return {
					status: "completed",
					message: "Image retrieved successfully.",
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
			params: t.Object({
				token: t.String(),
				imageId: t.String(),
			}),
		},
	)
	.get(
		"/albums/:token/highlights",
		async ({ params, query, set }) => {
			try {
				const data = await getHighlightsService({
					token: params.token,
					limit: query.limit || 10,
				});

				set.status = HTTP_STATUS_CODES.OK;
				return {
					status: "completed",
					message: "Highlights fetched successfully.",
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
			params: t.Object({ token: t.String() }),
			query: t.Object({
				limit: t.Optional(t.Numeric()),
			}),
		},
	)
	.group("", (app) =>
		app
			.use(strictPublicRateLimit)
			.post(
				"/faces/search",
				async ({ body, set }) => {
					try {
						const data = await searchFacesPublicService(body);

						set.status = HTTP_STATUS_CODES.OK;
						return {
							status: "completed",
							message: "Scoped search completed successfully.",
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
						faceId: t.Numeric(),
						threshold: t.Optional(t.Numeric()),
						limit: t.Optional(t.Numeric()),
					}),
				},
			)
			.post(
				"/albums/:token/search-by-image",
				async ({ params, body, set }) => {
					try {
						const data = await selfieSearchService({
							token: params.token,
							selfie: body.selfie,
						});

						set.status = HTTP_STATUS_CODES.OK;
						return {
							status: "completed",
							message: "Selfie search completed successfully.",
							data,
						};
					} catch (error: any) {
						console.error("[SELFIE SEARCH] Error:", error.message);
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
					params: t.Object({ token: t.String() }),
					body: t.Object({ selfie: t.File() }),
				},
			)
			.post(
				"/albums/:token/suggestions",
				async ({ params, body, set }) => {
					try {
						const data = await fetchGuestSuggestionsService({
							...body,
							shareToken: params.token,
						});

						set.status = HTTP_STATUS_CODES.OK;
						return {
							status: "completed",
							message: "Suggestions retrieved successfully.",
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
					params: t.Object({ token: t.String() }),
					body: t.Object({
						embedding: t.Array(t.Number()),
						limit: t.Optional(t.Number()),
					}),
				},
			)
			.post(
				"/albums/:token/presigned-url",
				async ({ params, body, set }) => {
					try {
						const data = await getPresignedUrlService({
							...body,
							shareToken: params.token,
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
					params: t.Object({ token: t.String() }),
					body: t.Object({
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
				"/albums/:token/images/:imageId/react",
				async ({ params, body, set, guestSessionId }) => {
					try {
						const data = await addPublicReactionService({
							shareToken: params.token,
							imageId: params.imageId,
							type: body.type,
							guestSessionId: guestSessionId as string | undefined,
						});

						set.status = HTTP_STATUS_CODES.CREATED;
						return {
							status: "completed",
							message: "Reaction added.",
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
					params: t.Object({ token: t.String(), imageId: t.String() }),
					body: t.Object({ type: t.Optional(t.String()) }),
				},
			)
			.post(
				"/albums/:token/upload",
				async ({ params, body, set, guestSessionId, request }) => {
					try {
						let payload: any = {};

						// 1. Extract data from body (handle both plain object and FormData)
						if (body && typeof body === "object") {
							if (typeof (body as any).get === "function") {
								// It's a FormData-like object
								payload.key = (body as any).get("key");
								payload.uploadedImages =
									(body as any).getAll?.("uploadedImages") ||
									(body as any).get("uploadedImages");
							} else {
								// It's a plain object
								payload = body;
							}
						}

						// 2. Fallback: If body is missing, try manual parsing
						if (
							!payload.uploadedImages &&
							!payload.key &&
							request.headers.get("content-type")?.includes("multipart")
						) {
							try {
								const formData = await request.formData();
								payload.key = formData.get("key");
								payload.uploadedImages = formData.getAll("uploadedImages");
							} catch (e: any) {
								console.error(
									"[PUBLIC UPLOAD] Manual fallback failed:",
									e.message,
								);
							}
						}

						if (!payload) {
							set.status = HTTP_STATUS_CODES.BAD_REQUEST;
							return {
								status: "error",
								message: "Invalid or missing request body.",
							};
						}

						// Handle key-only uploads for guests
						const files = payload.uploadedImages
							? Array.isArray(payload.uploadedImages)
								? payload.uploadedImages
								: [payload.uploadedImages]
							: payload.key
								? [{ existingKey: payload.key }]
								: [];

						const data = await uploadPublicService({
							token: params.token,
							files,
							existingKey: payload.key,
							guestSessionId,
						});

						set.status = HTTP_STATUS_CODES.CREATED;
						return {
							status: "completed",
							message:
								data.images?.[0]?.status === "PENDING"
									? "Images uploaded and pending approval."
									: "Images uploaded successfully.",
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
					params: t.Object({ token: t.String() }),
					body: t.Optional(t.Any()),
					bodyLimit: 500 * 1024 * 1024,
				},
			)
			.post(
				"/albums/:token/download",
				async ({ params, body, set }) => {
					try {
						const data = await guestDownloadService({
							token: params.token,
							imageIds: body.imageIds,
						});

						set.status = HTTP_STATUS_CODES.OK;
						return {
							status: "completed",
							message: "Download URLs generated.",
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
					params: t.Object({ token: t.String() }),
					body: t.Object({ imageIds: t.Array(t.String()) }),
				},
			)
			.delete(
				"/albums/:token/selfie-data",
				async ({ params, set, guestSessionId }) => {
					try {
						const data = await deleteSelfieDataService({
							shareToken: params.token,
							guestSessionId: guestSessionId as string,
						});

						set.status = HTTP_STATUS_CODES.OK;
						return {
							status: "completed",
							message: "Search data deleted.",
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
					params: t.Object({ token: t.String() }),
				},
			)
			.post(
				"/albums/:token/display/verify",
				async ({ params, body, set }) => {
					try {
						const data = await verifyDisplayPinService({
							token: params.token,
							pin: body.pin,
						});

						set.status = HTTP_STATUS_CODES.OK;
						return {
							status: "completed",
							message: "PIN verified.",
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
					params: t.Object({ token: t.String() }),
					body: t.Object({ pin: t.String() }),
				},
			),
	)
	.get(
		"/invite/:token",
		async ({ params, set }) => {
			try {
				const data = await getInviteDetailsService({
					inviteToken: params.token,
				});

				set.status = HTTP_STATUS_CODES.OK;
				return {
					status: "completed",
					message: "Invite details fetched.",
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
			params: t.Object({ token: t.String() }),
		},
	);

const legacyGuestRedirect = new Elysia()
	.get("/e/:token", ({ params, set }) => {
		set.status = 301;
		set.headers["Location"] = `/share/${params.token}`;
		return null;
	});

export { legacyGuestRedirect };
export default publicRoutes;
