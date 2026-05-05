import Joi from "joi";
import prisma from "../../../../../packages/config/src/db.config.ts";
import { aliaserSpec, validateSpec } from "../../../../../packages/utils/src/specValidator.util.ts";

const spec = Joi.object({});

const aliasSpec = {
	request: {},
	response: { plans: "plans" },
};

const service = async () => {
	const params = validateSpec(spec, aliaserSpec(aliasSpec.request, {}));

	const plans = await prisma.plans.findMany({
		orderBy: { order: "asc" },
	});

	return aliaserSpec(aliasSpec.response, {
		plans: plans.map((p) => ({
			...p,
			features: typeof p.features === "string" ? JSON.parse(p.features) : p.features,
		})),
	});
};

export const getPlansService = service;
