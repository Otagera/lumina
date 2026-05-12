import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
} from "bun:test";
import fs from "node:fs/promises";
import path from "node:path";
import prisma from "../../../../packages/config/src/db.config.ts";
import { Users } from "../../../../packages/models/src/index.model.ts";
import { HTTP_STATUS_CODES } from "../../../../packages/utils/src/constants.util.ts";
import { getApp, parseRes, req, setupAuth } from "./test-utils";

describe("Trash Routes (Native)", () => {
	let app: any;
	let user: any;
	let testAlbumId: string;
	let testImageId: string;

	beforeAll(async () => {
		app = await getApp();
		user = await setupAuth(app);

		// Create mock image for testing
		const uploadsDir = path.resolve(process.cwd(), "src/uploads");
		await fs.mkdir(uploadsDir, { recursive: true });
		const fixturePath = path.resolve(__dirname, "fixtures/test.jpg");
		await fs.copyFile(fixturePath, path.join(uploadsDir, "test-image.jpg"));

		// Create an album to delete
		const albumRes = await app.handle(
			req.post(
				"/api/v1/albums",
				{ albumName: "Trash Test Album" },
				{ Cookie: user.cookie },
			),
		);
		const albumBody = await parseRes(albumRes);
		testAlbumId = albumBody.data.id;

		// Create an image to delete (using the existingKey trick)
		const imageRes = await app.handle(
			req.post(
				"/api/v1/images",
				{
					uploadedImages: [{ existingKey: "test-image.jpg" }],
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
		// Cleanup mock image
		try {
			await fs.unlink(
				path.resolve(process.cwd(), "src/uploads/test-image.jpg"),
			);
		} catch (e) {}
	});

	describe("Soft Deletion", () => {
		it("should soft delete an image", async () => {
			const res = await app.handle(
				req.delete(`/api/v1/images/${testImageId}`, user.authHeader),
			);
			expect(res.status).toBe(HTTP_STATUS_CODES.OK);
		});

		it("should soft delete an album", async () => {
			const res = await app.handle(
				req.delete(`/api/v1/albums/${testAlbumId}`, user.authHeader),
			);
			expect(res.status).toBe(HTTP_STATUS_CODES.OK);
		});
	});

	describe("GET /api/v1/trash", () => {
		it("should list soft-deleted items", async () => {
			const res = await app.handle(req.get("/api/v1/trash", user.authHeader));
			const body = await parseRes(res);

			expect(res.status).toBe(HTTP_STATUS_CODES.OK);
			expect(body.status).toBe("completed");
			expect(body.data.albums).toBeDefined();
			expect(body.data.images).toBeDefined();

			// Verify our items are in the trash
			const albumInTrash = body.data.albums.find(
				(a: any) => a.id === testAlbumId,
			);
			const imageInTrash = body.data.images.find(
				(i: any) => i.id === testImageId,
			);

			expect(albumInTrash).toBeDefined();
			expect(imageInTrash).toBeDefined();
		});
	});

	describe("Restoration", () => {
		it("should restore an album", async () => {
			const res = await app.handle(
				req.post(
					`/api/v1/trash/albums/${testAlbumId}/restore`,
					{},
					user.authHeader,
				),
			);
			expect(res.status).toBe(HTTP_STATUS_CODES.OK);

			// Verify it's no longer in trash
			const checkRes = await app.handle(
				req.get("/api/v1/trash", user.authHeader),
			);
			const checkBody = await parseRes(checkRes);
			const albumInTrash = checkBody.data.albums.find(
				(a: any) => a.id === testAlbumId,
			);
			expect(albumInTrash).toBeUndefined();
		});

		it("should restore images", async () => {
			console.log(`Restoring imageId: ${testImageId}`);
			const res = await app.handle(
				req.post(
					"/api/v1/trash/images/restore",
					{ imageIds: [testImageId] },
					user.authHeader,
				),
			);
			const body = await parseRes(res);
			if (res.status !== 200)
				console.log("Restore images failed:", JSON.stringify(body));

			expect(res.status).toBe(HTTP_STATUS_CODES.OK);

			// Verify it's no longer in trash
			const checkRes = await app.handle(
				req.get("/api/v1/trash", user.authHeader),
			);
			const checkBody = await parseRes(checkRes);
			const imageInTrash = checkBody.data.images.find(
				(i: any) => i.id === testImageId,
			);
			expect(imageInTrash).toBeUndefined();
		});
	});

	describe("Permanent Deletion", () => {
		beforeEach(async () => {
			// Delete them again so they are in trash
			await app.handle(
				req.delete(`/api/v1/images/${testImageId}`, user.authHeader),
			);
			await app.handle(
				req.delete(`/api/v1/albums/${testAlbumId}`, user.authHeader),
			);
		});

		it("should permanently delete specific images", async () => {
			const res = await app.handle(
				req.delete(
					"/api/v1/trash/images",
					{ imageIds: [testImageId] },
					user.authHeader,
				),
			);
			expect(res.status).toBe(HTTP_STATUS_CODES.OK);

			// Verify it's gone from DB
			const image = await prisma.images.findUnique({
				where: { image_id: testImageId },
			});
			expect(image).toBeNull();
		});

		it("should empty the trash", async () => {
			const res = await app.handle(
				req.delete("/api/v1/trash", user.authHeader),
			);
			expect(res.status).toBe(HTTP_STATUS_CODES.OK);

			// Verify trash is empty
			const checkRes = await app.handle(
				req.get("/api/v1/trash", user.authHeader),
			);
			const checkBody = await parseRes(checkRes);
			expect(checkBody.data.albums.length).toBe(0);
			expect(checkBody.data.images.length).toBe(0);
		});
	});
});
