import Joi from "joi";
import prisma from "../../../../../packages/config/src/db.config.ts";
import {
	ForbiddenError,
	NotFoundError,
} from "../../../../../packages/utils/src/error.util.ts";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";

const listSpec = Joi.object({});
const createSpec = Joi.object({
	name: Joi.string().required(),
	description: Joi.string().optional(),
	storage_mb: Joi.number().integer().required(),
	compute_units_per_month: Joi.number().integer().required(),
	price_usd: Joi.string().required(),
	price_ngn: Joi.string().required(),
	is_highlighted: Joi.boolean().default(false),
	order: Joi.number().integer().default(0),
	features: Joi.array().items(Joi.string()).default([]),
});
const updateSpec = Joi.object({
	plan_id: Joi.string().uuid().required(),
	name: Joi.string().optional(),
	description: Joi.string().optional(),
	storage_mb: Joi.number().integer().optional(),
	compute_units_per_month: Joi.number().integer().optional(),
	price_usd: Joi.string().optional(),
	price_ngn: Joi.string().optional(),
	is_highlighted: Joi.boolean().optional(),
	order: Joi.number().integer().optional(),
	features: Joi.array().items(Joi.string()).optional(),
});
const deleteSpec = Joi.object({
	plan_id: Joi.string().uuid().required(),
});

const aliasSpec = {
	request: { planId: "plan_id" },
	response: {},
};

export const listPlansService = async () => {
	validateSpec(listSpec, aliaserSpec(aliasSpec.request, {}));
	const plans = await prisma.plans.findMany({
		include: { _count: { select: { users: true } } },
		orderBy: { order: "asc" },
	});
	return aliaserSpec(aliasSpec.response, plans);
};

export const createPlanService = async (data: Record<string, unknown>) => {
	const params = validateSpec(createSpec, aliaserSpec(aliasSpec.request, data));
	const plan = await prisma.plans.create({ data: params });
	return aliaserSpec(aliasSpec.response, plan);
};

export const updatePlanService = async (
	planId: string,
	data: Record<string, unknown>,
) => {
	const params = validateSpec(updateSpec, aliaserSpec(aliasSpec.request, { planId, ...data }));
	const { plan_id, ...updates } = params;

	const plan = await prisma.plans.findUnique({ where: { id: plan_id } });
	if (!plan) throw new NotFoundError("Plan not found");

	return aliaserSpec(aliasSpec.response, await prisma.plans.update({
		where: { id: plan_id },
		data: updates,
	}));
};

export const deletePlanService = async (planId: string) => {
	const params = validateSpec(deleteSpec, aliaserSpec(aliasSpec.request, { planId }));

	const plan = await prisma.plans.findUnique({
		where: { id: params.plan_id },
		include: { _count: { select: { users: true } } },
	});

	if (!plan) throw new NotFoundError("Plan not found");

	if ((plan._count as any).users > 0) {
		throw new ForbiddenError(
			`Cannot delete plan "${plan.name}" — ${(plan._count as any).users} user(s) are on this plan`,
		);
	}

	await prisma.plans.delete({ where: { id: params.plan_id } });
	return aliaserSpec(aliasSpec.response, { deleted: true });
};
