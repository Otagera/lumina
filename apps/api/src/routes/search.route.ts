import { Elysia, t } from "elysia";
import { HTTP_STATUS_CODES } from "../../../../packages/utils/src/constants.util.ts";
import { semanticSearchService } from "../services/pictures/semanticSearch.service.ts";
import { authPlugin } from "./middleware/auth.plugin.ts";
import { guestPlugin } from "./middleware/guest.plugin.ts";
import { strictPublicRateLimit } from "./middleware/rate-limit.plugin.ts";

const searchRoutes = new Elysia({ prefix: "/search" })
	.use(guestPlugin)
	.use(strictPublicRateLimit)
	// Public semantic search (via share token)
	.post(
		"/semantic/public",
		async ({ body, set }) => {
			try {
				const data = await semanticSearchService({
					query: body.query,
					shareToken: body.shareToken,
					limit: body.limit,
				});

				set.status = HTTP_STATUS_CODES.OK;
				return {
					status: "completed",
					message: "Semantic search completed.",
					data,
				};
			} catch (error: any) {
				set.status =
					error?.statusCode ?? HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
				return {
					status: "error",
					message: error?.message || "Internal server error",
				};
			}
		},
		{
			body: t.Object({
				query: t.String(),
				shareToken: t.String(),
				limit: t.Optional(t.Numeric()),
			}),
		},
	)
	// Private semantic search (Authenticated)
	.use(authPlugin)
	.post(
		"/semantic",
		async ({ body, set, userId }) => {
			try {
				const data = await semanticSearchService({
					query: body.query,
					albumId: body.albumId,
					limit: body.limit,
					userId, // Could be used for filtering by user if needed
				});

				set.status = HTTP_STATUS_CODES.OK;
				return {
					status: "completed",
					message: "Semantic search completed.",
					data,
				};
			} catch (error: any) {
				set.status =
					error?.statusCode ?? HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
				return {
					status: "error",
					message: error?.message || "Internal server error",
				};
			}
		},
		{
			body: t.Object({
				query: t.String(),
				albumId: t.Optional(t.String()),
				limit: t.Optional(t.Numeric()),
			}),
		},
	);

export default searchRoutes;
