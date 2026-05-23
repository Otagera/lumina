import Joi from "joi";
import {
	getCacheMetrics,
	resetCacheMetrics,
} from "../../../../../packages/utils/src/cache.util.ts";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";

const spec = Joi.object({
	reset: Joi.boolean().default(false),
});

const aliasSpec = {
	request: {
		reset: "reset",
	},
	response: {},
};

type Row = { hits: number; misses: number; errors: number };

const ratio = (hits: number, misses: number): number => {
	const total = hits + misses;
	if (total === 0) return 0;
	return Number((hits / total).toFixed(4));
};

const service = async (data: { reset?: boolean } = {}) => {
	const aliasReq = aliaserSpec(aliasSpec.request, data);
	const { reset } = validateSpec(spec, aliasReq);

	const snapshot = getCacheMetrics();

	const namespaces: Array<{
		namespace: string;
		hits: number;
		misses: number;
		errors: number;
		hit_ratio: number;
	}> = [];
	const totals: Row = { hits: 0, misses: 0, errors: 0 };

	for (const [namespace, row] of Object.entries(snapshot)) {
		namespaces.push({
			namespace,
			hits: row.hits,
			misses: row.misses,
			errors: row.errors,
			hit_ratio: ratio(row.hits, row.misses),
		});
		totals.hits += row.hits;
		totals.misses += row.misses;
		totals.errors += row.errors;
	}

	namespaces.sort((a, b) => a.namespace.localeCompare(b.namespace));

	if (reset) resetCacheMetrics();

	return aliaserSpec(aliasSpec.response, {
		generated_at: new Date().toISOString(),
		reset_after_read: reset,
		totals: {
			...totals,
			hit_ratio: ratio(totals.hits, totals.misses),
		},
		namespaces,
	});
};

export const getCacheMetricsService = service;
export default service;
