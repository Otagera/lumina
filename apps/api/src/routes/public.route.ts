import { Elysia, t } from "elysia";
import { HTTP_STATUS_CODES } from "../../../../packages/utils/src/constants.util.ts";
import { getInviteDetailsService } from "../services/albums/getInviteDetails.service.ts";
import { getHighlightsService } from "../services/pictures/getHighlights.service.ts";
import { getPresignedUrlService } from "../services/pictures/getPresignedUrl.service.ts";
import { getPlansService } from "../services/public/getPlans.service.ts";
import { getSharedAlbumService } from "../services/public/getSharedAlbum.service.ts";
import { getSharedImageService } from "../services/public/getSharedImage.service.ts";
import { searchFacesPublicService } from "../services/public/searchFacesPublic.service.ts";
import { selfieSearchService } from "../services/public/selfieSearch.service.ts";
import { uploadPublicService } from "../services/public/uploadPublic.service.ts";
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
				set.status = error?.statusCode || HTTP_STATUS_CODES.BAD_REQUEST;
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
				set.status = error?.statusCode || HTTP_STATUS_CODES.BAD_REQUEST;
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
	.get(
		"/albums/:token/highlights",
		async ({ params, query, set }) => {
			try {
				const data = await getHighlightsService({
					token: params.token,
					limit: query.limit ? Number.parseInt(String(query.limit), 10) : 10,
				});

				set.status = HTTP_STATUS_CODES.OK;
				return {
					status: "completed",
					message: "Highlights retrieved successfully.",
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
						set.status = error?.statusCode || HTTP_STATUS_CODES.BAD_REQUEST;
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
						set.status = error?.statusCode || HTTP_STATUS_CODES.BAD_REQUEST;
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
				"/albums/:token/upload",
				async ({ params, body, set, guestSessionId }) => {
					try {
						const data = await uploadPublicService({
							token: params.token,
							files: body.uploadedImages,
							existingKey: body.key,
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
						set.status = error?.statusCode || HTTP_STATUS_CODES.BAD_REQUEST;
						return {
							status: "error",
							message: error?.message || "Internal server error",
							data: null,
						};
					}
				},
				{
					params: t.Object({ token: t.String() }),
					body: t.Any(),
					bodyLimit: 500 * 1024 * 1024,
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
				set.status = error?.statusCode || HTTP_STATUS_CODES.BAD_REQUEST;
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

export default publicRoutes;
