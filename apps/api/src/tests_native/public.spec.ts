import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import prisma from "../../../../packages/config/src/db.config.ts";
import { Users } from "../../../../packages/models/src/index.model.ts";
import { HTTP_STATUS_CODES } from "../../../../packages/utils/src/constants.util.ts";
import { getApp, parseRes, req, setupAuth } from "./test-utils";

describe("Public Access Routes (Native)", () => {
	let app: any;
	let owner: any;
	let testAlbumId: string;
	let testShareToken: string;
	let testImageId: string;

	beforeAll(async () => {
		app = await getApp();
		owner = await setupAuth(app);

		// Create mock image for testing
		const uploadsDir = path.resolve(process.cwd(), "src/uploads");
		await fs.mkdir(uploadsDir, { recursive: true });
		const fixturePath = path.resolve(__dirname, "fixtures/test.jpg");
		await fs.copyFile(
			fixturePath,
			path.join(uploadsDir, "public-test-image.jpg"),
		);

		// Create an album
		const albumRes = await app.handle(
			req.post(
				"/api/v1/albums",
				{ albumName: "Public Test Album" },
				owner.authHeader,
			),
		);
		const albumBody = await parseRes(albumRes);
		testAlbumId = albumBody.data.id;
		testShareToken = albumBody.data.shareToken;

		// Update settings to allow guest uploads
		await app.handle(
			req.put(
				`/api/v1/albums/${testAlbumId}`,
				{
					settings: {
						is_event: true,
						allow_guest_uploads: true,
					},
				},
				owner.authHeader,
			),
		);

		// Upload an image as owner
		const imageRes = await app.handle(
			req.post(
				"/api/v1/images",
				{
					uploadedImages: [{ existingKey: "public-test-image.jpg" }],
					albumId: testAlbumId,
				},
				owner.authHeader,
			),
		);
		const imageBody = await parseRes(imageRes);
		testImageId = imageBody.data.images[0].imageId;
	});

	afterAll(async () => {
		if (owner.userId) {
			await Users.deleteUserById(owner.userId);
		}
		// Cleanup mock image
		try {
			await fs.unlink(
				path.resolve(process.cwd(), "src/uploads/public-test-image.jpg"),
			);
		} catch (e) {}
	});

	describe("GET /api/v1/public/albums/:token", () => {
		it("should allow guest to fetch shared album details", async () => {
			const res = await app.handle(
				req.get(`/api/v1/public/albums/${testShareToken}`),
			);
			const body = await parseRes(res);

			expect(res.status).toBe(HTTP_STATUS_CODES.OK);
			expect(body.status).toBe("completed");
			expect(body.data.id).toBe(testAlbumId);
		});

		it("should fail for invalid token", async () => {
			const res = await app.handle(
				req.get("/api/v1/public/albums/invalid-token"),
			);
			expect(res.status).toBe(HTTP_STATUS_CODES.NOTFOUND);
		});
	});

	describe("GET /api/v1/public/images/:token/:imageId", () => {
		it("should allow guest to fetch shared image details", async () => {
			const res = await app.handle(
				req.get(`/api/v1/public/images/${testShareToken}/${testImageId}`),
			);
			const body = await parseRes(res);

			expect(res.status).toBe(HTTP_STATUS_CODES.OK);
			expect(body.status).toBe("completed");
			expect(body.data.imageId).toBe(testImageId);
		});
	});

	describe("POST /api/v1/public/albums/:token/upload", () => {
		it("should allow guest to upload to shared album", async () => {
			// Prepare another mock file
			const uploadsDir = path.resolve(process.cwd(), "src/uploads");
			await fs.copyFile(
				path.resolve(__dirname, "fixtures/test.jpg"),
				path.join(uploadsDir, "guest-upload.jpg"),
			);

			const res = await app.handle(
				req.post(`/api/v1/public/albums/${testShareToken}/upload`, {
					key: "guest-upload.jpg",
				}),
			);
			const body = await parseRes(res);
			if (res.status !== HTTP_STATUS_CODES.CREATED) {
				console.log("Public upload failed:", JSON.stringify(body));
			}

			expect(res.status).toBe(HTTP_STATUS_CODES.CREATED);
			expect(body.status).toBe("completed");
			expect(body.data.images).toBeDefined();
			expect(body.data.images.length).toBe(1);

			// Cleanup
			try {
				await fs.unlink(path.join(uploadsDir, "guest-upload.jpg"));
			} catch (e) {}
		});

		it("should block guest uploads when per-session threshold is exceeded", async () => {
			const uploadsDir = path.resolve(process.cwd(), "src/uploads");
			const guestSessionId = crypto.randomUUID();
			const createdFiles: string[] = [];

			for (let i = 0; i < 20; i++) {
				const fileName = `guest-session-${i}.jpg`;
				createdFiles.push(fileName);
				await fs.copyFile(
					path.resolve(__dirname, "fixtures/test.jpg"),
					path.join(uploadsDir, fileName),
				);
				const okRes = await app.handle(
					req.post(`/api/v1/public/albums/${testShareToken}/upload`, {
						key: fileName,
						guestSessionId,
					}),
				);
				expect(okRes.status).toBe(HTTP_STATUS_CODES.CREATED);
			}

			const blockedFile = "guest-session-threshold.jpg";
			createdFiles.push(blockedFile);
			await fs.copyFile(
				path.resolve(__dirname, "fixtures/test.jpg"),
				path.join(uploadsDir, blockedFile),
			);
			const blockedRes = await app.handle(
				req.post(`/api/v1/public/albums/${testShareToken}/upload`, {
					key: blockedFile,
					guestSessionId,
				}),
			);
			const blockedBody = await parseRes(blockedRes);
			expect(blockedRes.status).toBe(HTTP_STATUS_CODES.BADREQUEST);
			expect(String(blockedBody.message || "")).toContain(
				"session limit exceeded",
			);

			for (const fileName of createdFiles) {
				await fs.unlink(path.join(uploadsDir, fileName)).catch(() => undefined);
			}
		});

		it("should still allow host upload when guest anti-abuse gate is hit", async () => {
			const res = await app.handle(
				req.post(
					"/api/v1/images",
					{
						uploadedImages: [{ existingKey: "public-test-image.jpg" }],
						albumId: testAlbumId,
					},
					owner.authHeader,
				),
			);
			const body = await parseRes(res);
			expect(res.status).toBe(HTTP_STATUS_CODES.CREATED);
			expect(body.data.images.length).toBeGreaterThan(0);
		});
	});
});
