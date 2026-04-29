import { rateLimit } from "elysia-rate-limit";
import redisClient from "../../../../../packages/utils/src/redisClient.util.ts";

// Increased limits for development/initial launch
export const publicRateLimit = rateLimit({
	duration: 60000, // 1 minute
	max: 500, // 500 requests per minute
	responseCode: 429,
	responseMessage: "Too many requests, please try again later.",
	generator: (request, server) => {
		return (
			request.headers.get("x-forwarded-for") ||
			request.headers.get("x-real-ip") ||
			server?.requestIP(request)?.address ||
			"unknown"
		);
	},
	storage: "redis",
	redis: redisClient,
	// Add scoping to prevent collision
	name: "public-limiter",
});

export const strictPublicRateLimit = rateLimit({
	duration: 60000, // 1 minute
	max: 100, // 100 requests per minute (increased from 10)
	responseCode: 429,
	responseMessage: "Too many requests. Please slow down.",
	generator: (request, server) => {
		return (
			request.headers.get("x-forwarded-for") ||
			request.headers.get("x-real-ip") ||
			server?.requestIP(request)?.address ||
			"unknown"
		);
	},
	storage: "redis",
	redis: redisClient,
	name: "strict-limiter",
});
