import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { Users } from "../../../../packages/models/src/index.model.ts";
import { HTTP_STATUS_CODES } from "../../../../packages/utils/src/constants.util.ts";
import { getApp, parseRes, req, setupAuth } from "./test-utils";

describe("Album Routes (Native)", () => {
	let app: any;
	let user: any;

	beforeAll(async () => {
		app = await getApp();
		user = await setupAuth(app);
	});

	afterAll(async () => {
		if (user.userId) {
			await Users.deleteUserById(user.userId);
		}
	});

	describe("POST /api/v1/albums", () => {
		it("should successfully create a new album", async () => {
			const albumName = "My Test Album";
			const res = await app.handle(
				req.post("/api/v1/albums", { albumName }, { Cookie: user.cookie }),
			);

			const body = await parseRes(res);

			expect(res.status).toBe(HTTP_STATUS_CODES.CREATED);
			expect(body.status).toBe("completed");
			expect(body.data.albumName).toBe(albumName);
			expect(body.data.id).toBeDefined();
		});

		it("should fail to create an album without a name", async () => {
			const res = await app.handle(
				req.post("/api/v1/albums", {}, { Cookie: user.cookie }),
			);

			expect(res.status).toBe(422); // Elysia validation error
		});
	});

	describe("GET /api/v1/albums", () => {
		it("should successfully list albums for the user", async () => {
			const res = await app.handle(
				req.get("/api/v1/albums", { Cookie: user.cookie }),
			);

			const body = await parseRes(res);

			expect(res.status).toBe(HTTP_STATUS_CODES.OK);
			expect(body.status).toBe("completed");
			expect(Array.isArray(body.data.albums)).toBe(true);
		});
	});

	describe("Album Lifecycle", () => {
		let testAlbumId: string;

		beforeAll(async () => {
			const res = await app.handle(
				req.post(
					"/api/v1/albums",
					{ albumName: "Lifecycle Test" },
					{ Cookie: user.cookie },
				),
			);
			const body = await parseRes(res);
			testAlbumId = body.data.id;
		});

		it("should fetch a specific album", async () => {
			const res = await app.handle(
				req.get(`/api/v1/albums/${testAlbumId}`, { Cookie: user.cookie }),
			);

			const body = await parseRes(res);

			expect(res.status).toBe(HTTP_STATUS_CODES.OK);
			expect(body.status).toBe("completed");
			expect(body.data.id).toBe(testAlbumId);
		});

		it("should update an album", async () => {
			const newName = "Updated Name";
			const res = await app.handle(
				req.put(
					`/api/v1/albums/${testAlbumId}`,
					{ albumName: newName },
					{ Cookie: user.cookie },
				),
			);

			const body = await parseRes(res);

			expect(res.status).toBe(HTTP_STATUS_CODES.OK);
			expect(body.status).toBe("completed");

			// Verify name was updated
			const checkRes = await app.handle(
				req.get(`/api/v1/albums/${testAlbumId}`, { Cookie: user.cookie }),
			);
			const checkBody = await parseRes(checkRes);
			expect(checkBody.data.albumName).toBe(newName);
		});

		it("should delete an album", async () => {
			const res = await app.handle(
				req.delete(`/api/v1/albums/${testAlbumId}`, { Cookie: user.cookie }),
			);

			const body = await parseRes(res);

			expect(res.status).toBe(HTTP_STATUS_CODES.OK);
			expect(body.status).toBe("completed");

			// Verify album is gone (or 404/403)
			const checkRes = await app.handle(
				req.get(`/api/v1/albums/${testAlbumId}`, { Cookie: user.cookie }),
			);
			expect(checkRes.status).toBeGreaterThanOrEqual(400);
		});
	});
});
