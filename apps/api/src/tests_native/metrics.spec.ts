import { beforeAll, beforeEach, describe, expect, it } from "bun:test";
import {
	cacheDel,
	cacheGet,
	cacheSet,
	resetCacheMetrics,
} from "../../../../packages/utils/src/cache.util.ts";
import { HTTP_STATUS_CODES } from "../../../../packages/utils/src/constants.util.ts";
import { getApp, parseRes, req } from "./test-utils";

const METRICS_TOKEN = "test-metrics-token";

// Use unique namespaces per process so stale Redis state from previous runs
// (or concurrent test files sharing the same Redis) does not turn an expected
// miss into a hit.
const ns = `metricstest-${crypto.randomUUID().slice(0, 8)}`;
const primary = `cache:${ns}-a:k1`;
const secondary = `cache:${ns}-b:k1`;

describe("Metrics Routes (Native)", () => {
	let app: any;

	beforeAll(async () => {
		app = await getApp();
	});

	beforeEach(async () => {
		// Clear any prior state for the unique namespace and counter snapshot.
		await cacheDel(primary, secondary);
		resetCacheMetrics();
	});

	describe("GET /api/metrics/cache", () => {
		it("rejects requests without a token", async () => {
			const res = await app.handle(req.get("/api/metrics/cache"));
			const body = await parseRes(res);
			expect(res.status).toBe(HTTP_STATUS_CODES.UNAUTHORIZED);
			expect(body.status).toBe("error");
		});

		it("rejects requests with an invalid token", async () => {
			const res = await app.handle(
				req.get("/api/metrics/cache", { "x-metrics-token": "wrong" }),
			);
			expect(res.status).toBe(HTTP_STATUS_CODES.UNAUTHORIZED);
		});

		it("returns metrics snapshot with hits, misses and ratios", async () => {
			const nsPrimary = `${ns}-a`;
			const nsSecondary = `${ns}-b`;

			await cacheGet(primary); // miss
			await cacheSet(primary, { x: 1 }, 60);
			await cacheGet(primary); // hit
			await cacheGet(primary); // hit
			await cacheGet(secondary); // miss

			const res = await app.handle(
				req.get("/api/metrics/cache", { "x-metrics-token": METRICS_TOKEN }),
			);
			const body = await parseRes(res);

			expect(res.status).toBe(HTTP_STATUS_CODES.OK);
			expect(body.status).toBe("completed");
			expect(body.data.generated_at).toBeTruthy();
			expect(body.data.reset_after_read).toBe(false);
			expect(Array.isArray(body.data.namespaces)).toBe(true);

			const row = body.data.namespaces.find(
				(n: any) => n.namespace === nsPrimary,
			);
			expect(row).toBeDefined();
			expect(row.hits).toBe(2);
			expect(row.misses).toBe(1);
			expect(row.hit_ratio).toBeGreaterThan(0);
			expect(row.hit_ratio).toBeLessThanOrEqual(1);

			const secondaryRow = body.data.namespaces.find(
				(n: any) => n.namespace === nsSecondary,
			);
			expect(secondaryRow?.misses).toBe(1);

			expect(body.data.totals.hits).toBeGreaterThanOrEqual(row.hits);
			expect(body.data.totals.misses).toBeGreaterThanOrEqual(row.misses);
		});

		it("resets counters when ?reset=true", async () => {
			await cacheGet(primary); // miss

			const res1 = await app.handle(
				req.get("/api/metrics/cache?reset=true", {
					"x-metrics-token": METRICS_TOKEN,
				}),
			);
			const body1 = await parseRes(res1);
			expect(res1.status).toBe(HTTP_STATUS_CODES.OK);
			expect(body1.data.reset_after_read).toBe(true);
			expect(body1.data.totals.misses).toBeGreaterThanOrEqual(1);

			// Second read should show counters cleared (no traffic since reset)
			const res2 = await app.handle(
				req.get("/api/metrics/cache", { "x-metrics-token": METRICS_TOKEN }),
			);
			const body2 = await parseRes(res2);
			expect(res2.status).toBe(HTTP_STATUS_CODES.OK);
			expect(body2.data.totals.hits).toBe(0);
			expect(body2.data.totals.misses).toBe(0);
			expect(body2.data.namespaces).toEqual([]);
		});
	});
});
