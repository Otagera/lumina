import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import fs from "node:fs/promises";
import path from "node:path";
import { Users } from "../../../../packages/models/src/index.model.ts";
import { HTTP_STATUS_CODES } from "../../../../packages/utils/src/constants.util.ts";
import { storage } from "../../../../packages/utils/src/storage.util.ts";
import { getApp, parseRes, req, setupAuth } from "./test-utils";

describe("Images Extended Routes (Native)", () => {
	let app: any;
	let user: any;
	let testImageId: string;
	let testAlbumId: string;

	beforeAll(async () => {
		app = await getApp();
		user = await setupAuth(app);

		const fixturePath = path.resolve(__dirname, "fixtures/test.jpg");
		const fileBuffer = await fs.readFile(fixturePath);

		await storage.upload(fileBuffer, {
			key: "test-extended-image.jpg",
			contentType: "image/jpeg",
		});

		const albumRes = await app.handle(
			req.post(
				"/api/v1/albums",
				{ albumName: "Images Extended Test" },
				{ Cookie: user.cookie },
			),
		);
		const albumBody = await parseRes(albumRes);
		testAlbumId = albumBody.data.id;

		const imageRes = await app.handle(
			req.post(
				"/api/v1/images",
				{
					uploadedImages: [{ existingKey: "test-extended-image.jpg" }],
					albumId: testAlbumId,
				},
				{ Cookie: user.cookie },
			),
		);
		const imageBody = await parseRes(imageRes);
		testImageId = imageBody.data.images[0].imageId;
	});

	afterAll(async () => {
		if (user.userId) {
			await Users.deleteUserById(user.userId);
		}
		await storage.delete("test-extended-image.jpg");
	});

	describe("POST /api/v1/images/presigned-url", () => {
		it("should generate presigned URL for upload", async () => {
			const res = await app.handle(
				req.post(
					"/api/v1/images/presigned-url",
					{
						albumId: testAlbumId,
						fileName: "new-image.jpg",
						contentType: "image/jpeg",
					},
					{ Cookie: user.cookie },
				),
			);
			const body = await parseRes(res);

			expect(res.status).toBe(HTTP_STATUS_CODES.OK);
			expect(body.status).toBe("completed");
			expect(body.data.uploadUrl).toBeDefined();
			expect(body.data.key).toBeDefined();
		});
	});

	describe("GET /api/v1/images/:imageId/faces", () => {
		it("should fetch faces for an image", async () => {
			const res = await app.handle(
				req.get(`/api/v1/images/${testImageId}/faces`, { Cookie: user.cookie }),
			);
			const body = await parseRes(res);

			expect(res.status).toBe(HTTP_STATUS_CODES.OK);
			expect(body.status).toBe("completed");
			expect(body.data.faces).toBeDefined();
		});
	});

	describe("POST /api/v1/images/:imageId/download", () => {
		it("should generate download URL", async () => {
			const res = await app.handle(
				req.post(
					`/api/v1/images/${testImageId}/download`,
					{},
					{ Cookie: user.cookie },
				),
			);
			const body = await parseRes(res);

			expect(res.status).toBe(HTTP_STATUS_CODES.OK);
			expect(body.status).toBe("completed");
			expect(body.data.downloadUrl).toBeDefined();
		});
	});

	describe("POST /api/v1/images/bulk-download", () => {
		it("should initiate bulk download job", async () => {
			const res = await app.handle(
				req.post(
					"/api/v1/images/bulk-download",
					{
						imageIds: [testImageId],
					},
					{ Cookie: user.cookie },
				),
			);
			const body = await parseRes(res);

			expect(res.status).toBe(HTTP_STATUS_CODES.OK);
			expect(body.status).toBe("completed");
			expect(body.data.jobId).toBeDefined();
		});
	});
});
