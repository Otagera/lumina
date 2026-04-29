import { Elysia, t } from "elysia";
import prisma from "../../../../packages/config/src/db.config.ts";
import { HTTP_STATUS_CODES } from "../../../../packages/utils/src/constants.util.ts";
import { createStorageConfigService } from "../services/settings/createStorageConfig.service.ts";
import { deleteStorageConfigService } from "../services/settings/deleteStorageConfig.service.ts";
import { fetchSettingsService } from "../services/settings/fetchSettings.service.ts";
import { fetchUsageService } from "../services/settings/fetchUsage.service.ts";
import { updateStorageConfigService } from "../services/settings/updateStorageConfig.service.ts";
import { authDerivation } from "./middleware/auth.plugin.ts";
import { strictPublicRateLimit } from "./middleware/rate-limit.plugin.ts";

const settingsRoutes = new Elysia({ prefix: "/settings" })
	.derive(authDerivation)
	.get("/", async ({ set, userId }) => {
		try {
			const data = await fetchSettingsService({ userId });

			set.status = HTTP_STATUS_CODES.OK;
			return {
				status: "completed",
				message: "Settings retrieved successfully.",
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
		"/storage",
		async ({ body, set, userId }) => {
			try {
				const data = await createStorageConfigService({ ...body, userId });

				set.status = HTTP_STATUS_CODES.CREATED;
				return {
					status: "completed",
					message: "Storage configuration created successfully.",
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
				provider: t.String(),
				name: t.String(),
				accessKeyId: t.String(),
				secretAccessKey: t.String(),
				bucket: t.String(),
				endpoint: t.String(),
				region: t.Optional(t.String()),
				isActive: t.Optional(t.Boolean()),
			}),
		},
	)
	.put(
		"/storage/:configId",
		async ({ params, body, set, userId }) => {
			try {
				const data = await updateStorageConfigService({
					...body,
					configId: params.configId,
					userId,
				});

				set.status = HTTP_STATUS_CODES.OK;
				return {
					status: "completed",
					message: "Storage configuration updated successfully.",
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
				configId: t.String(),
			}),
			body: t.Object({
				provider: t.Optional(t.String()),
				name: t.Optional(t.String()),
				accessKeyId: t.Optional(t.String()),
				secretAccessKey: t.Optional(t.String()),
				bucket: t.Optional(t.String()),
				endpoint: t.Optional(t.String()),
				region: t.Optional(t.String()),
				isActive: t.Optional(t.Boolean()),
			}),
		},
	)
	.delete(
		"/storage/:configId",
		async ({ params, set, userId }) => {
			try {
				const data = await deleteStorageConfigService({
					configId: params.configId,
					userId,
				});

				set.status = HTTP_STATUS_CODES.OK;
				return {
					status: "completed",
					message: "Storage configuration deleted successfully.",
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
				configId: t.String(),
			}),
		},
	)
	.get("/email-preferences", async ({ set }) => {
		set.status = HTTP_STATUS_CODES.OK;
		return {
			status: "completed",
			data: {
				welcome: true,
				photoApproved: true,
				clustering: true,
				marketing: false,
			},
		};
	})
	.put("/email-preferences", async ({ body, set, userId }) => {
		try {
			const prefs = body as {
				welcome?: boolean;
				photoApproved?: boolean;
				clustering?: boolean;
				marketing?: boolean;
			};

			const user = await prisma.users.findUnique({
				where: { user_id: userId },
				select: { email_preferences: true },
			});

			const current = (user?.email_preferences as any) || {
				welcome: true,
				photoApproved: true,
				clustering: true,
				marketing: false,
			};

			const updated = { ...current, ...prefs };

			await prisma.users.update({
				where: { user_id: userId },
				data: { email_preferences: updated as any },
			});

			set.status = HTTP_STATUS_CODES.OK;
			return {
				status: "completed",
				message: "Email preferences updated.",
				data: updated,
			};
		} catch (error: any) {
			set.status = HTTP_STATUS_CODES.BAD_REQUEST;
			return {
				status: "error",
				message: error?.message || "Failed to update preferences",
				data: null,
			};
		}
	});

export default settingsRoutes;
