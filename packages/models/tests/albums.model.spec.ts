import { beforeEach, describe, expect, it, mock } from "bun:test";

const prismaMock = {
	albums: { findMany: mock(), deleteMany: mock() },
	album_images: { findMany: mock() },
	images: { findMany: mock() },
	faces: { deleteMany: mock() },
	$transaction: mock(),
};

const queueAddJobMock = mock();
const cleanupImageSideEffectsMock = mock();

mock.module("../../config/src/db.config.ts", () => ({ default: prismaMock }));
mock.module("../../../apps/worker/src/queue/queue.service.ts", () => ({
	queueServices: {
		fileDeletionQueueLib: {
			addJob: queueAddJobMock,
		},
	},
}));
mock.module("../src/images.model.ts", () => ({
	cleanupImageSideEffects: cleanupImageSideEffectsMock,
	deleteImagesWithLogging: mock(),
}));
mock.module("../../config/src/index.config.ts", () => ({
	default: { env: "test", test: { base_api_url: "http://localhost" } },
}));

const { deleteAlbumsByUserId } = await import("../src/albums.model.ts");

describe("deleteAlbumsByUserId", () => {
	beforeEach(() => {
		for (const fn of [
			prismaMock.albums.findMany,
			prismaMock.albums.deleteMany,
			prismaMock.album_images.findMany,
			prismaMock.images.findMany,
			prismaMock.faces.deleteMany,
			prismaMock.$transaction,
			queueAddJobMock,
			cleanupImageSideEffectsMock,
		]) {
			fn.mockReset();
		}
	});

	it("is atomic: when tx.images.deleteMany fails, album deletion and side effects are not executed", async () => {
		prismaMock.albums.findMany.mockResolvedValue([{ album_id: "album-1" }]);
		prismaMock.album_images.findMany.mockResolvedValue([
			{ album_id: "album-1", image_id: "img-1" },
		]);
		prismaMock.images.findMany.mockResolvedValue([{ image_id: "img-1" }]);
		prismaMock.albums.findMany
			.mockResolvedValueOnce([{ album_id: "album-1" }])
			.mockResolvedValueOnce([{ album_id: "album-1", storage_config: null }]);

		const tx = {
			faces: { deleteMany: mock().mockResolvedValue({ count: 1 }) },
			album_images: { deleteMany: mock().mockResolvedValue({ count: 1 }) },
			images: { deleteMany: mock().mockRejectedValue(new Error("boom")) },
			albums: { deleteMany: mock().mockResolvedValue({ count: 1 }) },
		};
		prismaMock.$transaction.mockImplementation(async (cb: any) => cb(tx));

		await expect(deleteAlbumsByUserId("user-1")).rejects.toThrow("boom");
		expect(tx.faces.deleteMany).toHaveBeenCalledTimes(1);
		expect(tx.album_images.deleteMany).toHaveBeenCalledTimes(1);
		expect(tx.images.deleteMany).toHaveBeenCalledTimes(1);
		expect(tx.albums.deleteMany).not.toHaveBeenCalled();
		expect(cleanupImageSideEffectsMock).not.toHaveBeenCalled();
		expect(queueAddJobMock).not.toHaveBeenCalled();
	});
});
