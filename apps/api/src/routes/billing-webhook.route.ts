import { Elysia, t } from "elysia";
import prisma from "../../../../packages/config/src/db.config.ts";
import config from "../../../../packages/config/src/index.config.ts";
import { HTTP_STATUS_CODES } from "../../../../packages/utils/src/constants.util.ts";

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

			const {
				event,
				user_id,
				plan,
				compute_units_used,
				storage_mb_used,
				timestamp,
			} = body as any;

			// Validate webhook signature (in production, verify HMAC)
			// For now, we'll accept webhooks with a valid user_id

			if (!user_id) {
				set.status = HTTP_STATUS_CODES.BAD_REQUEST;
				return { status: "error", message: "Missing user_id" };
			}

			switch (event) {
				case "plan_changed":
					if (plan) {
						// Fetch target plan from DB
						const targetPlan = await prisma.plans.findUnique({
							where: { name: plan.toLowerCase() },
						});

						if (!targetPlan) {
							set.status = HTTP_STATUS_CODES.BAD_REQUEST;
							return { status: "error", message: `Plan ${plan} not found` };
						}

						// Update user's plan
						await prisma.users.update({
							where: { user_id },
							data: {
								plan_id: targetPlan.id,
								plan_name: targetPlan.name,
							},
						});
						console.log(
							`[Billing Webhook] User ${user_id} plan changed to ${plan}`,
						);
					}
					break;

				case "usage_threshold_warning":
					// Log warning - could trigger notification
					console.log(
						`[Billing Webhook] Usage warning for user ${user_id}: compute=${compute_units_used}, storage=${storage_mb_used}MB`,
					);
					break;

				case "usage_limit_exceeded":
					// Log critical event - could suspend service
					console.log(
						`[Billing Webhook] Usage exceeded for user ${user_id}: compute=${compute_units_used}, storage=${storage_mb_used}MB`,
					);
					break;

				case "metering_report":
					// Record metering data for billing
					await prisma.usage_logs.create({
						data: {
							user_id,
							resource: "metering",
							operation: "billing_report",
							quantity: 1,
							metadata: {
								compute: compute_units_used,
								storage: storage_mb_used,
								report_timestamp: timestamp,
							},
						},
					});
					console.log(`[Billing Webhook] Metering report for user ${user_id}`);
					break;

				default:
					console.log(`[Billing Webhook] Unknown event: ${event}`);
			}

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
