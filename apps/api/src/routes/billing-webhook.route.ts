import { Elysia, t } from "elysia";
import config from "../../../../packages/config/src/index.config.ts";
import { HTTP_STATUS_CODES } from "../../../../packages/utils/src/constants.util.ts";
import { billingWebhookService } from "../services/billing/billingWebhook.service.ts";
import { strictPublicRateLimit } from "./middleware/rate-limit.plugin.ts";

const envConfig = config[config.env || "development"];

const billingWebhookRoutes = new Elysia({ prefix: "/webhooks" }).post(
	"/billing",
	async ({ body, set, headers }) => {
		try {
			// Validate webhook secret
			const secret = envConfig.billing_webhook_secret;
			if (secret && headers["x-billing-secret"] !== secret) {
				set.status = HTTP_STATUS_CODES.UNAUTHORIZED;
				return { status: "error", message: "Unauthorized" };
			}

			const data = await billingWebhookService(body);

			set.status = HTTP_STATUS_CODES.OK;
			return { status: "completed", message: "Webhook processed" };
		} catch (error: any) {
			console.error("[Billing Webhook] Error:", error.message);
			set.status = HTTP_STATUS_CODES.INTERNAL_ERROR;
			return { status: "error", message: "Webhook processing failed" };
		}
	},
	{
		body: t.Object({
			event: t.String(),
			user_id: t.String(),
			plan: t.Optional(t.String()),
			compute_units_used: t.Optional(t.Number()),
			storage_mb_used: t.Optional(t.Number()),
			timestamp: t.Optional(t.String()),
		}),
		detail: {
			summary: "Billing Webhook",
			description: "Receive billing events from external payment provider",
		},
	},
);

export default billingWebhookRoutes;
