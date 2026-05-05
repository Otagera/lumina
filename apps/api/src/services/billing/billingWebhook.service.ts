import Joi from "joi";
import prisma from "../../../../../packages/config/src/db.config.ts";
import { aliaserSpec, validateSpec } from "../../../../../packages/utils/src/specValidator.util.ts";

const spec = Joi.object({
	event: Joi.string().required(),
	user_id: Joi.string().uuid().required(),
	plan: Joi.string().optional(),
	compute_units_used: Joi.number().optional(),
	storage_mb_used: Joi.number().optional(),
	timestamp: Joi.string().optional(),
});

const aliasSpec = {
	request: { userId: "user_id" },
	response: { success: "success" },
};

const service = async (data: any) => {
	const params = validateSpec(spec, aliaserSpec(aliasSpec.request, data));

	switch (params.event) {
		case "plan_changed":
			if (params.plan) {
				const targetPlan = await prisma.plans.findUnique({
					where: { name: params.plan.toLowerCase() },
				});

				if (!targetPlan) {
					throw new Error(`Plan ${params.plan} not found`);
				}

				await prisma.users.update({
					where: { user_id: params.user_id },
					data: {
						plan_id: targetPlan.id,
						plan_name: targetPlan.name,
					},
				});
				console.log(
					`[Billing Webhook] User ${params.user_id} plan changed to ${params.plan}`,
				);
			}
			break;

		case "usage_threshold_warning":
			console.log(
				`[Billing Webhook] Usage warning for user ${params.user_id}: compute=${params.compute_units_used}, storage=${params.storage_mb_used}MB`,
			);
			break;

		case "usage_limit_exceeded":
			console.log(
				`[Billing Webhook] Usage exceeded for user ${params.user_id}: compute=${params.compute_units_used}, storage=${params.storage_mb_used}MB`,
			);
			break;

		case "metering_report":
			await prisma.usage_logs.create({
				data: {
					user_id: params.user_id,
					resource: "metering",
					operation: "billing_report",
					quantity: 1,
					metadata: {
						compute: params.compute_units_used,
						storage: params.storage_mb_used,
						report_timestamp: params.timestamp,
					},
				},
			});
			console.log(`[Billing Webhook] Metering report for user ${params.user_id}`);
			break;

		default:
			console.log(`[Billing Webhook] Unknown event: ${params.event}`);
	}

	return aliaserSpec(aliasSpec.response, { success: true });
};

export const billingWebhookService = service;
