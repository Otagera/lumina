import { EventEmitter } from "node:events";
import config from "../../config/src/index.config.ts";
import redisClient from "./redisClient.util";

const envConfig = config[config.env || "development"];

export const eventEmitter = new EventEmitter();

export const EVENTS = {
	IMAGE_PROCESSED: "IMAGE_PROCESSED",
	FACE_DETECTED: "FACE_DETECTED",
	FACE_CLUSTERED: "FACE_CLUSTERED",
	BULK_DOWNLOAD_COMPLETED: "BULK_DOWNLOAD_COMPLETED",
};

const REDIS_CHANNEL = "facematch_events";

// Bridge Redis Pub/Sub to local EventEmitter for the API process
if (envConfig.is_api) {
	const subClient = redisClient.duplicate();
	subClient.subscribe(REDIS_CHANNEL);
	subClient.on("message", (channel, message) => {
		if (channel === REDIS_CHANNEL) {
			try {
				const data = JSON.parse(message);
				eventEmitter.emit(data.type, data.payload);
			} catch (err) {
				console.error("Failed to parse Redis message:", err);
			}
		}
	});
}

export const emitImageProcessed = async (imageId: string, albumId?: string) => {
	const message = JSON.stringify({
		type: EVENTS.IMAGE_PROCESSED,
		payload: { imageId, albumId },
	});

	// Emit locally (for same-process consistency)
	eventEmitter.emit(EVENTS.IMAGE_PROCESSED, { imageId, albumId });

	// Publish to Redis (for cross-process communication)
	await redisClient.publish(REDIS_CHANNEL, message);
};

export const emitFaceDetected = async (imageId: string, albumId?: string) => {
	const message = JSON.stringify({
		type: EVENTS.FACE_DETECTED,
		payload: { imageId, albumId },
	});

	eventEmitter.emit(EVENTS.FACE_DETECTED, { imageId, albumId });
	await redisClient.publish(REDIS_CHANNEL, message);
};

export const emitFaceClustered = async (
	albumId: string,
	clustersCreated: number,
) => {
	const message = JSON.stringify({
		type: EVENTS.FACE_CLUSTERED,
		payload: { albumId, clustersCreated },
	});

	eventEmitter.emit(EVENTS.FACE_CLUSTERED, { albumId, clustersCreated });
	await redisClient.publish(REDIS_CHANNEL, message);
};

export const emitBulkDownloadCompleted = async (
	albumId: string,
	downloadUrl: string,
) => {
	const message = JSON.stringify({
		type: EVENTS.BULK_DOWNLOAD_COMPLETED,
		payload: { albumId, downloadUrl },
	});

	eventEmitter.emit(EVENTS.BULK_DOWNLOAD_COMPLETED, { albumId, downloadUrl });
	await redisClient.publish(REDIS_CHANNEL, message);
};
