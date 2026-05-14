import redisClient from "../../utils/src/redisClient.util.ts";

const DEBOUNCE_DELAY_MS = 5 * 60 * 1000;
const DEBOUNCE_KEY = "newPhotos:pending";
const TIMEOUT_KEY_PREFIX = "newPhotos:timeout:";
const IMMEDIATE_THRESHOLD = 20;

interface PendingUpload {
	email: string;
	albumName: string;
	albumId: string;
	photoCount: number;
	lastUpdated: number;
}

const getKey = (albumId: string) => `${DEBOUNCE_KEY}:${albumId}`;
const getTimeoutKey = (albumId: string) => `${TIMEOUT_KEY_PREFIX}${albumId}`;

export const incrementPendingUpload = async (
	albumId: string,
	email: string,
	albumName: string,
	photoCount: number,
): Promise<{ shouldSendImmediately: boolean; totalCount: number }> => {
	const key = getKey(albumId);
	const existing = await redisClient.get(key);

	if (existing) {
		const data = JSON.parse(existing) as PendingUpload;
		data.photoCount += photoCount;
		data.lastUpdated = Date.now();
		await redisClient.setex(key, Math.ceil(DEBOUNCE_DELAY_MS / 1000), JSON.stringify(data));

		if (data.photoCount >= IMMEDIATE_THRESHOLD) {
			await sendNewPhotosEmailDebounced(albumId);
			return { shouldSendImmediately: true, totalCount: data.photoCount };
		}

		await redisClient.set(getTimeoutKey(albumId), "1", "EX", Math.ceil(DEBOUNCE_DELAY_MS / 1000));

		return { shouldSendImmediately: false, totalCount: data.photoCount };
	}

	const newData: PendingUpload = {
		email,
		albumName,
		albumId,
		photoCount,
		lastUpdated: Date.now(),
	};
	await redisClient.setex(key, Math.ceil(DEBOUNCE_DELAY_MS / 1000), JSON.stringify(newData));
	await redisClient.set(getTimeoutKey(albumId), "1", "EX", Math.ceil(DEBOUNCE_DELAY_MS / 1000));

	return { shouldSendImmediately: false, totalCount: photoCount };
};

export const sendNewPhotosEmailDebounced = async (albumId: string): Promise<void> => {
	const timeoutKey = getTimeoutKey(albumId);
	const timeoutExists = await redisClient.get(timeoutKey);
	if (!timeoutExists) return;

	await redisClient.del(timeoutKey);

	const key = getKey(albumId);
	const data = await redisClient.get(key);

	if (!data) return;

	const pending = JSON.parse(data) as PendingUpload;
	await redisClient.del(key);

	if (pending.photoCount > 0) {
		await queueEmailJob(pending);
	}
};

const queueEmailJob = async (data: PendingUpload) => {
	const { queueServices } = await import("../../../apps/worker/src/queue/queue.service.ts");
	await queueServices.emailQueueLib.addJob("email", {
		worker: "email",
		type: "new_photos",
		data: {
			email: data.email,
			albumName: data.albumName,
			albumId: data.albumId,
			photoCount: data.photoCount,
		},
	});
};

export const clearPendingUploads = async (albumId: string): Promise<void> => {
	const key = getKey(albumId);
	await redisClient.del(key);
};

export const getPendingUpload = async (
	albumId: string,
): Promise<PendingUpload | null> => {
	const key = getKey(albumId);
	const data = await redisClient.get(key);
	return data ? JSON.parse(data) : null;
};