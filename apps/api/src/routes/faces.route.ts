import { Elysia, t } from "elysia";
import { HTTP_STATUS_CODES } from "../../../../packages/utils/src/constants.util.ts";
import fetchFaceService from "../services/pictures/fetchFace.service.ts";
import searchFacesService from "../services/pictures/searchFaces.service.ts";
import updateFaceService from "../services/pictures/updateFace.service.ts";
import { authDerivation } from "./middleware/auth.plugin.ts";
import { guestPlugin } from "./middleware/guest.plugin.ts";
import { checkTaggingPolicy } from "./middleware/policy.middleware.ts";

const facesRoutes = new Elysia({ prefix: "/faces" })
	.use(guestPlugin)
	.derive(authDerivation)
	.get(
		"/:faceId",
		async ({ params, set }) => {
			try {
				const faceId = parseInt(params.faceId, 10);
				if (Number.isNaN(faceId)) {
					set.status = HTTP_STATUS_CODES.BAD_REQUEST;
					return {
						status: "error",
						message: "Invalid face ID format.",
						data: null,
					};
				}

				const data = await fetchFaceService({ faceId });

				set.status = HTTP_STATUS_CODES.OK;
				return {
					status: "completed",
					message: "Face retrieved successfully.",
					data,
				};
			} catch (error: unknown) {
				const err = error as { statusCode?: number; message?: string };
				if (err?.message === "Face not found.") {
					set.status = HTTP_STATUS_CODES.NOTFOUND;
				} else {
					set.status = err?.statusCode || HTTP_STATUS_CODES.BAD_REQUEST;
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
				faceId: t.String(),
			}),
		},
	)
	.patch(
		"/:faceId",
		async ({ params, body, set, userId, guestSessionId }) => {
			try {
				const faceId = parseInt(params.faceId, 10);
				if (Number.isNaN(faceId)) {
					set.status = HTTP_STATUS_CODES.BAD_REQUEST;
					return {
						status: "error",
						message: "Invalid face ID format.",
						data: null,
					};
				}

				// Enforce policy
				await checkTaggingPolicy({ faceId, userId, guestSessionId });

				const data = await updateFaceService({
					...body,
					faceId,
					userId: userId || crypto.randomUUID(),
				});

				set.status = HTTP_STATUS_CODES.OK;
				return {
					status: "completed",
					message: "Face updated successfully.",
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
				faceId: t.String(),
			}),
			body: t.Object({
				personId: t.Optional(t.Union([t.String(), t.Null()])),
			}),
		},
	)
	.post(
		"/search",
		async ({ body, set }) => {
			try {
				const data = await searchFacesService(body);

				set.status = HTTP_STATUS_CODES.OK;
				return {
					status: "completed",
					message: "Search completed successfully.",
					data,
				};
			} catch (error: unknown) {
				const err = error as { statusCode?: number; message?: string };
				set.status = err?.statusCode || HTTP_STATUS_CODES.BAD_REQUEST;
				return {
					status: "error",
					message: err?.message || "Internal server error",
					data: null,
				};
			}
		},
		{
			body: t.Object({
				faceId: t.Optional(t.Number()),
				personId: t.Optional(t.String()),
				albumId: t.Optional(t.String()),
				threshold: t.Optional(t.Number()),
				limit: t.Optional(t.Number()),
			}),
		},
	)
	.post(
		"/:faceId/ignore",
		async ({ params, body, set, userId, guestSessionId }) => {
			try {
				const faceId = parseInt(params.faceId, 10);
				if (Number.isNaN(faceId)) {
					set.status = HTTP_STATUS_CODES.BAD_REQUEST;
					return { status: "error", message: "Invalid face ID format." };
				}

				// Enforce policy
				await checkTaggingPolicy({ faceId, userId, guestSessionId });

				const { personId } = body;

				const { ignoreFace } = await import(
					"../../../../packages/models/src/faces.model.ts"
				);
				await ignoreFace(personId, faceId, userId || crypto.randomUUID());

				set.status = HTTP_STATUS_CODES.OK;
				return { status: "completed", message: "Face ignored successfully." };
			} catch (error: any) {
				set.status = error?.statusCode || HTTP_STATUS_CODES.BAD_REQUEST;
				return { status: "error", message: error?.message || "Internal error" };
			}
		},
		{
			params: t.Object({ faceId: t.String() }),
			body: t.Object({ personId: t.String() }),
		},
	)
	.post(
		"/:faceId/unignore",
		async ({ params, body, set, userId, guestSessionId }) => {
			try {
				const faceId = parseInt(params.faceId, 10);
				if (Number.isNaN(faceId)) {
					set.status = HTTP_STATUS_CODES.BAD_REQUEST;
					return { status: "error", message: "Invalid face ID format." };
				}

				// Enforce policy
				await checkTaggingPolicy({ faceId, userId, guestSessionId });

				const { personId } = body;
				const { unignoreFace } = await import(
					"../../../../packages/models/src/faces.model.ts"
				);
				await unignoreFace(personId, faceId, userId || crypto.randomUUID());

				set.status = HTTP_STATUS_CODES.OK;
				return {
					status: "completed",
					message: "Face un-ignored successfully.",
				};
			} catch (error: any) {
				set.status = error?.statusCode || HTTP_STATUS_CODES.BAD_REQUEST;
				return { status: "error", message: error?.message || "Internal error" };
			}
		},
		{
			params: t.Object({ faceId: t.String() }),
			body: t.Object({ personId: t.String() }),
		},
	);

export default facesRoutes;
