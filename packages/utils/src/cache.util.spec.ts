import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";

// In-memory fake redis backing store, swapped in via mock.module before
// importing cache.util.
const store = new Map<string, string>();
const ttls = new Map<string, number>();
let throwOnNext: string | null = null;

const fakeRedis = {
	get: async (key: string) => {
		if (throwOnNext === "get") {
			throwOnNext = null;
			throw new Error("redis down");
		}
		return store.has(key) ? (store.get(key) as string) : null;
	},
	set: async (key: string, value: string, _exFlag: string, ttl: number) => {
		if (throwOnNext === "set") {
			throwOnNext = null;
			throw new Error("redis down");
		}
		store.set(key, value);
		ttls.set(key, ttl);
		return "OK";
	},
	del: async (...keys: string[]) => {
		let n = 0;
		for (const k of keys) {
			if (store.delete(k)) n += 1;
		}
		return n;
	},
	scanStream: ({ match }: { match: string; count?: number }) => {
		const regex = new RegExp(`^${match.replace(/\*/g, ".*")}$`);
		const matched = Array.from(store.keys()).filter((k) => regex.test(k));
		return (async function* () {
			if (matched.length > 0) yield matched;
		})();
	},
};

mock.module("./redisClient.util.ts", () => ({ default: fakeRedis }));

const {
	CACHE_TTL,
	buildCacheKey,
	cacheDel,
	cacheDelPattern,
	cacheGet,
	cacheGetOrSet,
	cacheKeys,
	cacheSet,
	getCacheMetrics,
	hashCacheParams,
	resetCacheMetrics,
} = await import("./cache.util.ts");

beforeEach(() => {
	store.clear();
	ttls.clear();
	throwOnNext = null;
	resetCacheMetrics();
});

afterEach(() => {
	throwOnNext = null;
});

describe("buildCacheKey", () => {
	it("prefixes with cache: and joins truthy parts", () => {
		expect(buildCacheKey("a", "b", 1)).toBe("cache:a:b:1");
	});
	it("filters empty/null/undefined parts", () => {
		expect(buildCacheKey("a", undefined, null, "", "b")).toBe("cache:a:b");
	});
});

describe("cacheGet / cacheSet", () => {
	it("round-trips a JSON-serializable value with TTL", async () => {
		await cacheSet("cache:x", { foo: 1, bar: [1, 2] }, CACHE_TTL.SHORT);
		expect(ttls.get("cache:x")).toBe(CACHE_TTL.SHORT);
		expect(await cacheGet("cache:x")).toEqual({ foo: 1, bar: [1, 2] });
	});

	it("returns null on cache miss", async () => {
		expect(await cacheGet("cache:missing")).toBeNull();
	});

	it("fails open when redis throws on get", async () => {
		store.set("cache:x", JSON.stringify({ ok: true }));
		throwOnNext = "get";
		expect(await cacheGet("cache:x")).toBeNull();
	});

	it("fails open when redis throws on set", async () => {
		throwOnNext = "set";
		await cacheSet("cache:x", { v: 1 }, CACHE_TTL.SHORT);
		expect(store.has("cache:x")).toBe(false);
	});

	it("returns null when stored value is invalid JSON", async () => {
		store.set("cache:bad", "not-json");
		expect(await cacheGet("cache:bad")).toBeNull();
	});
});

describe("cacheDel", () => {
	it("deletes a single key", async () => {
		store.set("cache:a", "1");
		await cacheDel("cache:a");
		expect(store.has("cache:a")).toBe(false);
	});
	it("is a no-op when no keys passed", async () => {
		await cacheDel();
		expect(store.size).toBe(0);
	});
});

describe("cacheDelPattern", () => {
	it("deletes all keys matching a pattern via scan", async () => {
		store.set("cache:public-album:tokenA:f1", "x");
		store.set("cache:public-album:tokenA:f2", "x");
		store.set("cache:public-album:tokenB:f1", "x");
		const removed = await cacheDelPattern("cache:public-album:tokenA:*");
		expect(removed).toBe(2);
		expect(store.has("cache:public-album:tokenB:f1")).toBe(true);
	});
});

describe("cacheGetOrSet", () => {
	it("invokes fetcher on miss and stores result", async () => {
		const fetcher = mock(async () => ({ value: 42 }));
		const result = await cacheGetOrSet("cache:gos", CACHE_TTL.SHORT, fetcher);
		expect(result).toEqual({ value: 42 });
		expect(fetcher).toHaveBeenCalledTimes(1);
		expect(await cacheGet("cache:gos")).toEqual({ value: 42 });
	});
	it("skips fetcher on hit", async () => {
		await cacheSet("cache:gos", { value: 7 }, CACHE_TTL.SHORT);
		const fetcher = mock(async () => ({ value: 99 }));
		const result = await cacheGetOrSet("cache:gos", CACHE_TTL.SHORT, fetcher);
		expect(result).toEqual({ value: 7 });
		expect(fetcher).not.toHaveBeenCalled();
	});
});

describe("cacheKeys + hashCacheParams", () => {
	it("builds public album keys", () => {
		expect(cacheKeys.publicAlbum("tok123", "fabc")).toBe(
			"cache:public-album:tok123:fabc",
		);
		expect(cacheKeys.publicAlbumPattern("tok123")).toBe(
			"cache:public-album:tok123:*",
		);
	});
	it("builds user-albums keys", () => {
		expect(cacheKeys.userAlbums("u1")).toBe("cache:user-albums:u1");
		expect(cacheKeys.userAlbumsPattern("u1")).toBe("cache:user-albums:u1");
		expect(cacheKeys.userAlbumsPattern()).toBe("cache:user-albums:*");
	});
	it("hashCacheParams is stable across key order", () => {
		expect(hashCacheParams({ a: 1, b: 2 })).toBe(hashCacheParams({ b: 2, a: 1 }));
	});
	it("hashCacheParams returns 'default' for empty filters", () => {
		expect(hashCacheParams({})).toBe("default");
		expect(hashCacheParams({ a: undefined, b: null, c: "" })).toBe("default");
	});
});

describe("cache metrics", () => {
	it("counts hits and misses per namespace", async () => {
		await cacheGet("cache:plans"); // miss
		await cacheSet("cache:plans", { x: 1 }, CACHE_TTL.SHORT);
		await cacheGet("cache:plans"); // hit
		await cacheGet("cache:plans"); // hit
		await cacheGet("cache:album:abc:u1"); // miss

		const m = getCacheMetrics();
		expect(m.plans).toEqual({ hits: 2, misses: 1, errors: 0 });
		expect(m.album).toEqual({ hits: 0, misses: 1, errors: 0 });
	});

	it("counts errors when redis throws on get", async () => {
		throwOnNext = "get";
		await cacheGet("cache:plans");
		const m = getCacheMetrics();
		expect(m.plans.errors).toBe(1);
	});

	it("resetCacheMetrics clears counters", async () => {
		await cacheGet("cache:plans");
		resetCacheMetrics();
		expect(getCacheMetrics()).toEqual({});
	});
});
