import redisClient from "./redisClient.util.ts";

const PREFIX = "cache:";

export type CacheTtlSeconds = number;

export const CACHE_TTL = {
	SHORT: 30,
	MEDIUM: 5 * 60,
	LONG: 60 * 60,
	DAY: 24 * 60 * 60,
} as const;

// In-memory counters for cache observability. Keyed by the first key segment
// after the cache: prefix so each surface (plans, public-album, album, ...)
// gets its own row. Counters are process-local and reset on restart; surface
// to logs/metrics by calling getCacheMetrics().
type MetricRow = { hits: number; misses: number; errors: number };
const metrics = new Map<string, MetricRow>();

const namespaceOf = (key: string): string => {
	const trimmed = key.startsWith(PREFIX) ? key.slice(PREFIX.length) : key;
	const i = trimmed.indexOf(":");
	return i === -1 ? trimmed || "_" : trimmed.slice(0, i);
};

const bump = (key: string, field: keyof MetricRow): void => {
	const ns = namespaceOf(key);
	const row = metrics.get(ns) ?? { hits: 0, misses: 0, errors: 0 };
	row[field] += 1;
	metrics.set(ns, row);
};

export const getCacheMetrics = (): Record<string, MetricRow> => {
	const out: Record<string, MetricRow> = {};
	for (const [ns, row] of metrics.entries()) out[ns] = { ...row };
	return out;
};

export const resetCacheMetrics = (): void => {
	metrics.clear();
};

const isMeaningfulKeyPart = (p: unknown): p is string | number =>
	p !== undefined && p !== null && p !== "";

export const buildCacheKey = (
	...parts: Array<string | number | undefined | null>
): string => `${PREFIX}${parts.filter(isMeaningfulKeyPart).join(":")}`;

export async function cacheGet<T>(key: string): Promise<T | null> {
	try {
		const raw = await redisClient.get(key);
		if (raw === null) {
			bump(key, "misses");
			return null;
		}
		const parsed = JSON.parse(raw) as T;
		bump(key, "hits");
		return parsed;
	} catch {
		// Fail open: cache must never break callers
		bump(key, "errors");
		return null;
	}
}

export async function cacheSet(
	key: string,
	value: unknown,
	ttlSeconds: CacheTtlSeconds,
): Promise<void> {
	try {
		await redisClient.set(key, JSON.stringify(value), "EX", ttlSeconds);
	} catch {
		// Fail open
		bump(key, "errors");
	}
}

export async function cacheDel(...keys: string[]): Promise<void> {
	if (keys.length === 0) return;
	try {
		await redisClient.del(...keys);
	} catch {
		// Fail open
		for (const k of keys) bump(k, "errors");
	}
}

export async function cacheDelPattern(pattern: string): Promise<number> {
	if (!pattern || pattern === PREFIX) return 0;
	let deleted = 0;
	try {
		const stream = redisClient.scanStream({ match: pattern, count: 100 });
		for await (const chunk of stream) {
			const keys = chunk as string[];
			if (keys.length > 0) {
				await redisClient.del(...keys);
				deleted += keys.length;
			}
		}
	} catch {
		// Fail open
		bump(pattern, "errors");
	}
	return deleted;
}

export async function cacheGetOrSet<T>(
	key: string,
	ttlSeconds: CacheTtlSeconds,
	fetcher: () => Promise<T>,
): Promise<T> {
	const hit = await cacheGet<T>(key);
	if (hit !== null) return hit;
	const value = await fetcher();
	if (value !== undefined && value !== null) {
		await cacheSet(key, value, ttlSeconds);
	}
	return value;
}

// Namespaced key builders for known surfaces. Keep callers consistent so
// invalidation patterns stay correct.
export const cacheKeys = {
	plans: () => buildCacheKey("plans"),

	publicAlbum: (token: string, filterHash?: string) =>
		buildCacheKey("public-album", token, filterHash),
	publicAlbumPattern: (token?: string) =>
		token ? `${PREFIX}public-album:${token}:*` : `${PREFIX}public-album:*`,

	album: (albumId: string, scope?: string) =>
		buildCacheKey("album", albumId, scope),
	albumPattern: (albumId?: string) =>
		albumId ? `${PREFIX}album:${albumId}:*` : `${PREFIX}album:*`,

	userAlbums: (userId: string) => buildCacheKey("user-albums", userId),
	userAlbumsPattern: (userId?: string) =>
		userId ? `${PREFIX}user-albums:${userId}` : `${PREFIX}user-albums:*`,
};

// Stable hash for filter objects used as part of a cache key. Deterministic
// order of keys; small filter sets only — not a security primitive.
export const hashCacheParams = (obj: Record<string, unknown>): string => {
	const keys = Object.keys(obj)
		.filter((k) => obj[k] !== undefined && obj[k] !== null && obj[k] !== "")
		.sort();
	if (keys.length === 0) return "default";
	const pairs = keys.map((k) => `${k}=${String(obj[k])}`).join("&");
	// Short, URL-safe-ish; collision risk is negligible for our cache scopes.
	let h = 0;
	for (let i = 0; i < pairs.length; i++) {
		h = (h * 31 + pairs.charCodeAt(i)) | 0;
	}
	return `f${(h >>> 0).toString(36)}`;
};
