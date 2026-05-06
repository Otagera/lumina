import { afterAll, beforeAll, describe, expect, it, beforeEach } from "bun:test";
import fs from "node:fs/promises";
import path from "node:path";
import prisma from "../../../../packages/config/src/db.config.ts";
import { Users } from "../../../../packages/models/src/index.model.ts";
import { HTTP_STATUS_CODES } from "../../../../packages/utils/src/constants.util.ts";
import { getApp, parseRes, req, setupAuth } from "./test-utils";

describe("Faces Routes (Native)", () => {
	let app: any;
	let user: any;
	let testAlbumId: string;
	let testImageId: string;
	let testFaceId: number;
	let testPersonId: string;

	beforeAll(async () => {
		app = await getApp();
		user = await setupAuth(app);

		const albumRes = await app.handle(
			req.post("/api/v1/albums", { albumName: "Faces Test Album" }, user.authHeader)
		);
		const albumBody = await parseRes(albumRes);
		testAlbumId = albumBody.data.id;

		const uploadsDir = path.resolve(process.cwd(), "src/uploads");
		await fs.mkdir(uploadsDir, { recursive: true });
		const fixturePath = path.resolve(__dirname, "fixtures/test.jpg");
		await fs.copyFile(fixturePath, path.join(uploadsDir, "face-test-image.jpg"));

		const imageRes = await app.handle(
			req.post("/api/v1/images", { 
				uploadedImages: [{ existingKey: "face-test-image.jpg" }],
				albumId: testAlbumId 
			}, user.authHeader)
		);
		const imageBody = await parseRes(imageRes);
		testImageId = imageBody.data.images[0].imageId;

		const personRes = await app.handle(
			req.post("/api/v1/people", { name: "Test Person" }, user.authHeader)
		);
		const personBody = await parseRes(personRes);
		testPersonId = personBody.data.id || personBody.data.personId;

		const face = await prisma.faces.create({
			data: {
				image_id: testImageId,
				embedding: Array(512).fill(0).map(() => Math.random()),
				bounding_box: { x: 10, y: 10, w: 50, h: 50 } as any,
			}
		});
		testFaceId = face.face_id;
	});

	afterAll(async () => {
		if (user.userId) {
			await Users.deleteUserById(user.userId);
		}
		try {
			await fs.unlink(path.resolve(process.cwd(), "src/uploads/face-test-image.jpg"));
		} catch (e) {}
	});

	describe("GET /api/v1/faces/:faceId", () => {
		it("should fetch face details", async () => {
			const res = await app.handle(
				req.get(`/api/v1/faces/${testFaceId}`, user.authHeader)
			);
			const body = await parseRes(res);

			expect(res.status).toBe(HTTP_STATUS_CODES.OK);
			expect(body.status).toBe("completed");
		});

		it("should return 404 for non-existent face", async () => {
			const res = await app.handle(
				req.get("/api/v1/faces/999999", user.authHeader)
			);
			expect(res.status).toBe(HTTP_STATUS_CODES.NOTFOUND);
		});
	});

	describe("PATCH /api/v1/faces/:faceId", () => {
		it("should tag a face with a person", async () => {
			const res = await app.handle(
				req.patch(
					`/api/v1/faces/${testFaceId}`,
					{ personId: testPersonId },
					{ Cookie: user.cookie },
				),
			);
			const body = await parseRes(res);

			expect(res.status).toBe(HTTP_STATUS_CODES.OK);
			expect(body.status).toBe("completed");
		});

		it("should untag a person from a face", async () => {
			const res = await app.handle(
				req.patch(
					`/api/v1/faces/${testFaceId}`,
					{ personId: null },
					{ Cookie: user.cookie },
				),
			);
			const body = await parseRes(res);

			expect(res.status).toBe(HTTP_STATUS_CODES.OK);
			expect(body.status).toBe("completed");
		});
	});

	describe("POST /api/v1/faces/search", () => {
		it("should search for similar faces by faceId", async () => {
			const res = await app.handle(
				req.post("/api/v1/faces/search", { faceId: testFaceId, albumId: testAlbumId }, user.authHeader)
			);
			const body = await parseRes(res);

			expect(res.status).toBe(HTTP_STATUS_CODES.OK);
			expect(body.status).toBe("completed");
		});
	});
});