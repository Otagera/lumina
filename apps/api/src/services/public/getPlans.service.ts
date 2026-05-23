import Joi from "joi";
import {
	CACHE_TTL,
	cacheGetOrSet,
	cacheKeys,
} from "../../../../../packages/utils/src/cache.util.ts";
import prisma from "../../../../../packages/config/src/db.config.ts";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";

const spec = Joi.object({});

const aliasSpec = {
	request: {},
	response: { plans: "plans" },
};

const service = async () => {
	validateSpec(spec, aliaserSpec(aliasSpec.request, {}));

	const plans = await cacheGetOrSet(cacheKeys.plans(), CACHE_TTL.LONG, async () => {
		const rows = await prisma.plans.findMany({ orderBy: { order: "asc" } });
		return rows.map((p) => ({
			...p,
			features:
				typeof p.features === "string" ? JSON.parse(p.features) : p.features,
		}));
	});

	return aliaserSpec(aliasSpec.response, { plans });
};

export const getPlansService = service;
