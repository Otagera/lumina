import crypto from "node:crypto";
import { Elysia, t } from "elysia";
import config from "../../../../packages/config/src/index.config.ts";
import { HTTP_STATUS_CODES } from "../../../../packages/utils/src/constants.util.ts";
import { getCacheMetricsService } from "../services/admin/getCacheMetrics.service.ts";

const tokensMatch = (provided: string, expected: string): boolean => {
	const a = Buffer.from(provided);
	const b = Buffer.from(expected);
	if (a.length !== b.length) return false;
	return crypto.timingSafeEqual(a, b);
};

const metricsRoutes = new Elysia({ prefix: "/metrics" }).get(
	"/cache",
	async ({ headers, query, set }) => {
		const env = config.env || "development";
		const expected = config[env]?.metrics_token;

		if (!expected) {
			set.status = HTTP_STATUS_CODES.SERVICE_UNAVAILABLE;
			return {
				status: "error",
				message:
					"Metrics endpoint is not configured. Set METRICS_TOKEN to enable.",
				data: null,
			};
		}

		const provided = headers["x-metrics-token"];
		if (!provided || !tokensMatch(provided, expected)) {
			set.status = HTTP_STATUS_CODES.UNAUTHORIZED;
			return {
				status: "error",
				message: "Invalid or missing metrics token.",
				data: null,
			};
		}

		try {
			const data = await getCacheMetricsService({
				reset: query.reset === "true",
			});

			set.status = HTTP_STATUS_CODES.OK;
			return {
				status: "completed",
				message: "Cache metrics retrieved.",
				data,
			};
		} catch (error: any) {
			set.status = error?.statusCode ?? HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
			return {
				status: "error",
				message: error?.message || "Internal server error",
				data: null,
			};
		}
	},
	{
		query: t.Object({
			reset: t.Optional(t.String()),
		}),
	},
);

export default metricsRoutes;
