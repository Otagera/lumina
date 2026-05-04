import path from "node:path";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ElysiaAdapter } from "@bull-board/elysia";
import { cors } from "@elysiajs/cors";
import { staticPlugin } from "@elysiajs/static";
import { swagger } from "@elysiajs/swagger";
import * as Sentry from "@sentry/bun";
import { Elysia, sse } from "elysia";
import config from "../../../packages/config/src/index.config.ts";
import { AuthError } from "../../../packages/utils/src/error.util.ts";
import {
	EVENTS,
	eventEmitter,
} from "../../../packages/utils/src/events.util.ts";
import { createServiceLogger } from "../../../packages/utils/src/logger.util.ts";
import { queueServices } from "../../worker/src/queue/queue.service.ts";
import { csrfPlugin } from "./routes/middleware/csrf.plugin.ts";

const envConfig = config[config.env || "development"];

Sentry.init({
	dsn: envConfig.sentry_dsn,
	environment: config.env,
	serverName: "api",
});

const logger = createServiceLogger("api");

export const createElysiaApp = async () => {
	const { default: albumsRoutes } = await import("./routes/albums.route");
	const { default: authRoutes, unsubscribeRoutes } = await import(
		"./routes/auth.route"
	);
	const { picturesRoutes, publicPicturesRoutes } = await import(
		"./routes/pictures.route"
	);
	const { default: facesRoutes } = await import("./routes/faces.route");
	const { default: publicRoutes } = await import("./routes/public.route");
	const { default: peopleRoutes } = await import("./routes/people.route");
	const { default: settingsRoutes } = await import("./routes/settings.route");
	const { default: trashRoutes } = await import("./routes/trash.route");
	const { default: notificationsRoutes } = await import(
		"./routes/notifications.route"
	);
	const { default: usageRoutes } = await import("./routes/usage.route");
	const { thumbnailRoutes } = await import("./routes/thumbnail.route");
	const { default: billingWebhookRoutes } = await import(
		"./routes/billing-webhook.route"
	);

	let bullBoardPlugin: any = null;
	if (config.env !== "test") {
		const serverAdapter: any = new ElysiaAdapter("/worker/admin");

		createBullBoard({
			queues: [
				new BullMQAdapter(queueServices.defaultQueueLib.getQueue()),
				new BullMQAdapter(queueServices.imageOptimizationQueueLib.getQueue()),
				new BullMQAdapter(queueServices.faceRecognitionQueueLib.getQueue()),
				new BullMQAdapter(queueServices.faceSearchQueueLib.getQueue()),
				new BullMQAdapter(queueServices.faceClusteringQueueLib.getQueue()),
				new BullMQAdapter(queueServices.bulkDownloadQueueLib.getQueue()),
				new BullMQAdapter(queueServices.fileDeletionQueueLib.getQueue()),
			],
			serverAdapter: serverAdapter,
		});

		bullBoardPlugin = await serverAdapter.registerPlugin();
	}

	eventEmitter.setMaxListeners(100);

	const app = new Elysia({
		bodyParser: {
			limit: "10mb",
		},
	})
		.use(csrfPlugin)
		.onBeforeHandle(({ request, body }) => {
			console.log(
				`[${new Date().toISOString()}] ${request.method} ${request.url}`,
			);
			if (body && request.url.includes("/auth/signup")) {
				const debugBody = { ...(body as any) };
				if (debugBody.password) debugBody.password = "***";
			}
		})
		.onAfterHandle(({ request, set }) => {
			const status = set.status as number;
			if (status && status >= 400) {
				const safeUrl = request.url.replace(
					/(\/albums\/|\/images\/)[^/?]+/,
					"$1***",
				);
				console.log(`[${set.status}] ${request.method} ${safeUrl}`);
			}
		})
		.use(
			cors({
				origin:
					config.env === "development"
						? true
						: envConfig.cors_origin
							? envConfig.cors_origin.split(",")
							: false,
			}),
		)
		.get("/api/health", () => ({
			status: "ok",
			timestamp: new Date().toISOString(),
		}))
		.get("/api/uploads/:key", async ({ params: { key }, set }) => {
			const normalizedKey = path.basename(key);
			if (normalizedKey !== key) {
				set.status = 400;
				return { error: "Invalid file path" };
			}

			const { storage } = await import(
				"../../../packages/utils/src/storage.util.ts"
			);
			const fs = await import("node:fs/promises");

			const localPath = path.resolve(
				process.cwd(),
				"src/uploads",
				normalizedKey,
			);

			try {
				await fs.access(localPath);
				return Bun.file(localPath);
			} catch (_e) {
				try {
					const buffer = await storage.getObject(normalizedKey);

					const ext = normalizedKey.split(".").pop()?.toLowerCase();
					const contentTypes: Record<string, string> = {
						jpg: "image/jpeg",
						jpeg: "image/jpeg",
						png: "image/png",
						webp: "image/webp",
						gif: "image/gif",
					};
					if (ext && contentTypes[ext]) {
						set.headers["content-type"] = contentTypes[ext];
					}

					return buffer;
				} catch (err) {
					console.error(`[UPLOADS] Failed to fetch ${key} from storage:`, err);
					set.status = 404;
					return { error: "File not found" };
				}
			}
		})
		.use(staticPlugin({ assets: "src/uploads", prefix: "/api/uploads" }))
		.get("/", () => "Face Search Backend is running with Elysia!")
		.get(
			"/api/v1/events",
			({ request, set }) => {
				set.headers["Content-Type"] = "text/event-stream";
				set.headers["Cache-Control"] = "no-cache";
				set.headers.Connection = "keep-alive";
				const abortSignal = request.signal;

				return sse(
					new ReadableStream({
						start(controller) {
							const handler = (data: any) => {
								try {
									const sseData = `data: ${JSON.stringify(data)}\n\n`;
									controller.enqueue(new TextEncoder().encode(sseData));
								} catch (_e) {
									console.error("Error sending SSE:", _e);
								}
							};

							eventEmitter.on(EVENTS.IMAGE_PROCESSED, handler);
							eventEmitter.on(EVENTS.FACE_DETECTED, handler);
							eventEmitter.on(EVENTS.FACE_CLUSTERED, handler);
							eventEmitter.on(EVENTS.BULK_DOWNLOAD_COMPLETED, handler);

							const cleanup = () => {
								eventEmitter.off(EVENTS.IMAGE_PROCESSED, handler);
								eventEmitter.off(EVENTS.FACE_DETECTED, handler);
								eventEmitter.off(EVENTS.FACE_CLUSTERED, handler);
								eventEmitter.off(EVENTS.BULK_DOWNLOAD_COMPLETED, handler);
								try {
									controller.close();
								} catch (_e) {}
								console.log("SSE connection cleaned up.");
							};

							if (abortSignal.aborted) {
								cleanup();
							} else {
								abortSignal.addEventListener("abort", cleanup, { once: true });
							}
						},
					}),
				);
			},
			{
				detail: {
					summary: "SSE Events Stream",
					description: "Server-Sent Events stream for real-time updates",
				},
			},
		)
		.group("/api/v1/public", (app) => app.use(publicPicturesRoutes))
		.group("/api/v1", (app) =>
			app
				.use(billingWebhookRoutes)
				.use(thumbnailRoutes)
				.use(unsubscribeRoutes)
				.use(authRoutes)
				.use(albumsRoutes)
				.use(picturesRoutes)
				.use(facesRoutes)
				.use(publicRoutes)
				.use(peopleRoutes)
				.use(settingsRoutes)
				.use(trashRoutes)
				.use(notificationsRoutes)
				.use(usageRoutes),
		);

	if (bullBoardPlugin) {
		app.use(bullBoardPlugin);
	}

	app.use(swagger());

	return app;
};

const start = async () => {
	try {
		logger.info("Initializing Elysia server...");
		const app = await createElysiaApp();
		const port = (config as any).development?.elysia_port || 3005;
		app.listen(port);

		logger.info(
			`Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
		);
		return app;
	} catch (error: any) {
		console.log("Failed to start Elysia server:", error);
		logger.error("Failed to start Elysia server", {
			error: error.message,
			stack: error.stack,
		});
		process.exit(1);
	}
};

// Only start if this file is run directly (though Bun makes this tricky with imports)
// For now, we'll keep the side effect but export the creator
if (import.meta.main) {
	await start();
}

export default start;
