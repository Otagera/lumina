import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import fs from "node:fs/promises";
import path from "node:path";
import prisma from "../../../../packages/config/src/db.config.ts";
import { Users } from "../../../../packages/models/src/index.model.ts";
import { HTTP_STATUS_CODES } from "../../../../packages/utils/src/constants.util.ts";
import { storage } from "../../../../packages/utils/src/storage.util.ts";
import { getApp, parseRes, req, setupAuth } from "./test-utils";

describe("Pictures Routes (Native)", () => {
	let app: any;
	let user: any;
	let testImageId: string;

	beforeAll(async () => {
		app = await getApp();
		user = await setupAuth(app);

		const fixturePath = path.resolve(__dirname, "fixtures/test.jpg");
		const fileBuffer = await fs.readFile(fixturePath);
		await storage.upload(fileBuffer, {
			key: "test-image.jpg",
			contentType: "image/jpeg",
		});
	});

	afterAll(async () => {
		if (user.userId) {
			await Users.deleteUserById(user.userId);
		}
		await storage.delete("test-image.jpg");
	});

	describe("POST /api/v1/images", () => {
		it("should successfully upload an image using an existing key", async () => {
			const res = await app.handle(
				req.post(
					"/api/v1/images",
					{ uploadedImages: [{ existingKey: "test-image.jpg" }] },
					{ Cookie: user.cookie },
				),
			);

			const body = await parseRes(res);
			expect(res.status).toBe(HTTP_STATUS_CODES.CREATED);
			expect(body.status).toBe("completed");
			expect(body.data.images).toBeDefined();
			expect(body.data.images.length).toBeGreaterThan(0);

			testImageId = body.data.images[0].imageId;
		});
	});

	describe("GET /api/v1/images", () => {
		it("should successfully list images for the user", async () => {
			const res = await app.handle(
				req.get("/api/v1/images", { Cookie: user.cookie }),
			);

			const body = await parseRes(res);

			expect(res.status).toBe(HTTP_STATUS_CODES.OK);
			expect(body.status).toBe("completed");
			expect(Array.isArray(body.data.images)).toBe(true);
		});
	});

	describe("Image Lifecycle", () => {
		it("should fetch single image details", async () => {
			const res = await app.handle(
				req.get(`/api/v1/images/${testImageId}`, { Cookie: user.cookie }),
			);

			const body = await parseRes(res);

			expect(res.status).toBe(HTTP_STATUS_CODES.OK);
			expect(body.status).toBe("completed");
			expect(body.data.imageId).toBe(testImageId);
		});

		it("should reprocess an image", async () => {
			const res = await app.handle(
				req.post(
					`/api/v1/images/${testImageId}/reprocess`,
					{},
					{ Cookie: user.cookie },
				),
			);

			const body = await parseRes(res);

			expect(res.status).toBe(HTTP_STATUS_CODES.OK);
			expect(body.status).toBe("completed");
		});

		it("should delete an image", async () => {
			const res = await app.handle(
				req.delete(`/api/v1/images/${testImageId}`, { Cookie: user.cookie }),
			);

			const body = await parseRes(res);

			expect(res.status).toBe(HTTP_STATUS_CODES.OK);
			expect(body.status).toBe("completed");

			// Verify image is soft-deleted (status changed or not found depending on implementation)
			const image = await prisma.images.findUnique({
				where: { image_id: testImageId },
			});
			expect(image?.deleted_at).not.toBeNull();
		});
	});
});
