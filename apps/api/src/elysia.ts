import path from "node:path";
import { logger as elysiaLogger } from "@bogeychan/elysia-logger";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ElysiaAdapter } from "@bull-board/elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import * as Sentry from "@sentry/bun";
import { Elysia } from "elysia";
import config from "../../../packages/config/src/index.config.ts";
import {
	EVENTS,
	eventEmitter,
} from "../../../packages/utils/src/events.util.ts";
import { createServiceLogger } from "../../../packages/utils/src/logger.util.ts";
import { queueServices } from "../../worker/src/queue/queue.service.ts";
import adminRoutes from "./routes/admin.route";
import albumsRoutes from "./routes/albums.route";
import authRoutes from "./routes/auth.route";
import billingWebhookRoutes from "./routes/billing-webhook.route";
import facesRoutes from "./routes/faces.route";
import metricsRoutes from "./routes/metrics.route";
import notificationsRoutes from "./routes/notifications.route";
import peopleRoutes from "./routes/people.route";
import picturesRoutes from "./routes/pictures.route";
import publicRoutes, { legacyGuestRedirect } from "./routes/public.route";
import reactionsRoutes from "./routes/reactions.route";
import searchRoutes from "./routes/search.route";
import settingsRoutes from "./routes/settings.route";
import { thumbnailRoutes } from "./routes/thumbnail.route";
import trashRoutes from "./routes/trash.route";
import usageRoutes from "./routes/usage.route";

const env = config.env || "development";

// Initialize Sentry for Backend Error Tracking
Sentry.init({
	dsn: process.env.SENTRY_DSN,
	environment: env,
	tracesSampleRate: env === "production" ? 1.0 : 0.0,
});

const logger = createServiceLogger("api");

export const createElysiaApp = async () => {
	try {
		const app = new Elysia()
			.use(
				elysiaLogger({
					level: env === "development" ? "error" : "info",
					autoLogging: {
						ignore(request) {
							const url = new URL(request.url);
							// Always ignore noisy static uploads
							if (url.pathname.startsWith("/api/uploads/")) return true;
							// Always ignore the SSE heartbeat endpoint
							if (url.pathname.startsWith("/api/v1/events")) return true;
							// In development, ignore successful GET requests to keep console clean
							if (env === "development" && request.method === "GET")
								return true;

							return false;
						},
					},
					transport:
						env === "development"
							? {
								target: "pino-pretty",
								options: {
									colorize: true,
									singleLine: true,
									ignore: "pid,hostname",
									translateTime: "HH:MM:ss.l",
								},
							}
							: undefined,
				}),
			)
			.use(
				cors({
					origin: (request) => {
						const origin = request.headers.get("origin");
						if (!origin) return true;

						// Allow all localhost origins in development to fix Vite proxy issues
						if (config.env === "development" && origin.includes("localhost")) {
							return true;
						}

						const allowedOrigins = (config[env]?.cors_origin || "").split(",");
						if (allowedOrigins.includes(origin)) {
							return true;
						}

						return false;
					},
					credentials: true,
					allowedHeaders: [
						"Content-Type",
						"Authorization",
						"Cookie",
						"X-Requested-With",
					],
					methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
				}),
			)
			.get("/api/uploads/*", async ({ params, set }) => {
				try {
					const filename = decodeURIComponent(params["*"]);
					// Use import.meta.dir to get the directory of elysia.ts (apps/api/src)
					const uploadsDir = path.resolve(import.meta.dir, "uploads");
					const filePath = path.join(uploadsDir, filename);

					const file = Bun.file(filePath);

					if (!(await file.exists())) {
						console.error(`[UPLOADS] File not found: ${filePath}`);
						set.status = 404;
						return "NOT_FOUND";
					}

					return file;
				} catch (error: any) {
					console.error(`[UPLOADS] Error serving file: ${error.message}`);
					set.status = 404;
					return "NOT_FOUND";
				}
			})
			.get("/api/health", () => ({ status: "ok" }))
			.group("/api", (app) => app.use(metricsRoutes))
			.get(
				"/api/v1/events",
				({ set }) => {
					set.headers["Content-Type"] = "text/event-stream";
					set.headers["Cache-Control"] = "no-cache";
					set.headers["Connection"] = "keep-alive";

					return new ReadableStream({
						start(controller) {
							const handler = (payload: any) => {
								try {
									const data = `data: ${JSON.stringify(payload)}\n\n`;
									controller.enqueue(data);
								} catch (e) {
									cleanup();
								}
							};

							// Heartbeat to keep connection alive
							const heartbeat = setInterval(() => {
								try {
									controller.enqueue(": heartbeat\n\n");
								} catch (e) {
									cleanup();
								}
							}, 30000);

							eventEmitter.on(EVENTS.IMAGE_PROCESSED, handler);
							eventEmitter.on(EVENTS.FACE_DETECTED, handler);
							eventEmitter.on(EVENTS.FACE_CLUSTERED, handler);
							eventEmitter.on(EVENTS.BULK_DOWNLOAD_COMPLETED, handler);
							eventEmitter.on(EVENTS.REACTION_ADDED, handler);
							eventEmitter.on(EVENTS.HIGHLIGHTS_READY, handler);

							const cleanup = () => {
								clearInterval(heartbeat);
								eventEmitter.off(EVENTS.IMAGE_PROCESSED, handler);
								eventEmitter.off(EVENTS.FACE_DETECTED, handler);
								eventEmitter.off(EVENTS.FACE_CLUSTERED, handler);
								eventEmitter.off(EVENTS.BULK_DOWNLOAD_COMPLETED, handler);
								eventEmitter.off(EVENTS.REACTION_ADDED, handler);
								eventEmitter.off(EVENTS.HIGHLIGHTS_READY, handler);
								try {
									controller.close();
								} catch (_e) { }
							};

							// Note: Bun's ReadableStream cancel() is triggered when client closes
						},
						cancel() {
							console.log("SSE connection cancelled by client.");
						},
					});
				},
				{
					detail: {
						summary: "SSE Events Stream",
						description: "Server-Sent Events stream for real-time updates",
					},
				},
			)
			.use(legacyGuestRedirect)
			.group("/api/v1", (app) =>
				app
					.use(authRoutes)
					.use(albumsRoutes)
					.use(facesRoutes)
					.use(peopleRoutes)
					.use(picturesRoutes)
					.use(searchRoutes)
					.use(publicRoutes)
					.use(thumbnailRoutes)
					.use(trashRoutes)
					.use(settingsRoutes)
					.use(notificationsRoutes)
					.use(usageRoutes)
					.use(reactionsRoutes)
					.use(billingWebhookRoutes)
					.use(adminRoutes),
			)

			.use(swagger());

		if (config.env !== "test") {
			const serverAdapter: any = new ElysiaAdapter("/worker/admin");

			createBullBoard({
				queues: [
					new BullMQAdapter(queueServices.imageOptimizationQueueLib.getQueue()),
					new BullMQAdapter(queueServices.faceRecognitionQueueLib.getQueue()),
					new BullMQAdapter(queueServices.faceSearchQueueLib.getQueue()),
					new BullMQAdapter(queueServices.faceClusteringQueueLib.getQueue()),
					new BullMQAdapter(queueServices.bulkDownloadQueueLib.getQueue()),
					new BullMQAdapter(queueServices.fileDeletionQueueLib.getQueue()),
					new BullMQAdapter(queueServices.emailQueueLib.getQueue()),
					new BullMQAdapter(queueServices.trashCleanupQueueLib.getQueue()),
					new BullMQAdapter(queueServices.semanticEmbeddingQueueLib.getQueue()),
				],
				serverAdapter,
			});

			const bullBoardPlugin = serverAdapter.registerPlugin();
			app.use(bullBoardPlugin);
		}

		eventEmitter.setMaxListeners(100);

		// Schedule daily image expiration sweep (3am UTC, skip in test env)
		if (config.env !== "test") {
			queueServices.defaultQueueLib
				.getQueue()
				.add(
					"expireImages",
					{ worker: "expireImages" },
					{ repeat: { pattern: "0 3 * * *" }, jobId: "expire-images-cron" },
				)
				.catch((err) => logger.error("Failed to schedule expireImages cron", { error: err.message }));
		}

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

export type App = Awaited<ReturnType<typeof createElysiaApp>>;

// Start the server if this file is run directly
if (import.meta.main || process.env.NODE_ENV === "production") {
	const port = config[config.env || "development"]?.elysia_port || 3005;
	const app = await createElysiaApp();
	app.listen(port, () => {
		console.log(`🦊 Elysia is running at http://localhost:${port}`);
	});
}
