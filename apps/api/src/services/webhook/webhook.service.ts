import crypto from "node:crypto";
import prisma from "../../../../../packages/config/src/db.config.ts";
import config from "../../../../../packages/config/src/index.config.ts";

const envConfig = config[config.env || "development"];

/**
 * Triggers a webhook for a given album if a webhook URL is configured.
 * It queues the webhook in the webhook_events table, and attempts to send it.
 */
export const dispatchWebhook = async (
	albumId: string,
	eventType: string,
	payload: any,
) => {
	try {
		const albumSettings = await prisma.album_settings.findUnique({
			where: { album_id: albumId },
		});

		if (!albumSettings || !albumSettings.webhook_url) {
			return; // No webhook configured
		}

		const event = await prisma.webhook_events.create({
			data: {
				album_id: albumId,
				event_type: eventType,
				payload: payload,
				status: "PENDING",
				attempts: 0,
			},
		});

		// In a production system, this would be queued in BullMQ.
		// For now, we will attempt synchronous delivery, and mark it.
		await sendWebhook(event.id, albumSettings.webhook_url, eventType, payload);
	} catch (error) {
		console.error("Failed to dispatch webhook:", error);
	}
};

const sendWebhook = async (
	eventId: string,
	url: string,
	eventType: string,
	payload: any,
) => {
	try {
		const body = JSON.stringify(payload);

		// Generate HMAC signature (assuming an env var WEBHOOK_SECRET exists, or using albumId as a salt)
		const secret = envConfig.webhook_secret;
		const signature = crypto
			.createHmac("sha256", secret)
			.update(body)
			.digest("hex");

		const response = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-Lumina-Signature": signature,
				"X-Lumina-Event": eventType,
			},
			body,
		});

		if (response.ok) {
			await prisma.webhook_events.update({
				where: { id: eventId },
				data: { status: "SUCCESS", attempts: { increment: 1 } },
			});
		} else {
			await prisma.webhook_events.update({
				where: { id: eventId },
				data: { status: "FAILED", attempts: { increment: 1 } },
			});
		}
	} catch (error) {
		console.error("Webhook delivery failed:", error);
		await prisma.webhook_events.update({
			where: { id: eventId },
			data: { status: "FAILED", attempts: { increment: 1 } },
		});
	}
};
