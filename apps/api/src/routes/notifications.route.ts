import { Elysia, t } from "elysia";
import { HTTP_STATUS_CODES } from "../../../../packages/utils/src/constants.util.ts";
import { listNotificationsService } from "../services/notifications/listNotifications.service.ts";
import { markReadService } from "../services/notifications/markRead.service.ts";
import { authDerivation } from "./middleware/auth.plugin.ts";

const notificationsRoutes = new Elysia({ prefix: "/notifications" })
	.derive(authDerivation)
	.get(
		"/",
		async ({ userId, query, set }) => {
			try {
				const data = await listNotificationsService({
					userId,
					limit: query.limit ? Number.parseInt(query.limit) : 20,
					offset: query.offset ? Number.parseInt(query.offset) : 0,
				});

				set.status = HTTP_STATUS_CODES.OK;
				return {
					status: "completed",
					message: "Notifications retrieved successfully.",
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
			query: t.Object({
				limit: t.Optional(t.String()),
				offset: t.Optional(t.String()),
			}),
		},
	)
	.post(
		"/mark-read",
		async ({ userId, body, set }) => {
			try {
				const data = await markReadService({
					userId,
					...body,
				});

				set.status = HTTP_STATUS_CODES.OK;
				return {
					status: "completed",
					message: "Notifications marked as read.",
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
				notificationIds: t.Optional(t.Array(t.String())),
				markAll: t.Optional(t.Boolean()),
			}),
		},
	);

export default notificationsRoutes;
