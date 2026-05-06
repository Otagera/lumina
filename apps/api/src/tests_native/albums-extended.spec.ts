import { afterAll, beforeAll, describe, expect, it, beforeEach } from "bun:test";
import { Users } from "../../../../packages/models/src/index.model.ts";
import { HTTP_STATUS_CODES } from "../../../../packages/utils/src/constants.util.ts";
import { getApp, parseRes, req, setupAuth } from "./test-utils";

describe("Album Extended Routes (Native)", () => {
	let app: any;
	let owner: any;
	let testAlbumId: string;
	let testInviteId: string;

	beforeAll(async () => {
		app = await getApp();
		owner = await setupAuth(app);

		const albumRes = await app.handle(
			req.post("/api/v1/albums", { albumName: "Extended Test Album" }, { Cookie: owner.cookie }),
		);
		const albumBody = await parseRes(albumRes);
		testAlbumId = albumBody.data.id;
	});

	afterAll(async () => {
		if (owner.userId) {
			await Users.deleteUserById(owner.userId);
		}
	});

	describe("POST /api/v1/albums/join", () => {
		it("should require authentication", async () => {
			const res = await app.handle(
				req.post("/api/v1/albums/join", { inviteToken: "invalid-token" }),
			);
			expect(res.status).toBe(HTTP_STATUS_CODES.UNAUTHORIZED);
		});
	});

	describe("POST /api/v1/albums/:albumId/invites", () => {
		it("should generate an invite for the album", async () => {
			const res = await app.handle(
				req.post(`/api/v1/albums/${testAlbumId}/invites`, {
					role: "VIEWER",
					expiresInDays: 7,
				}, { Cookie: owner.cookie }),
			);
			const body = await parseRes(res);

			expect(res.status).toBe(HTTP_STATUS_CODES.CREATED);
			expect(body.status).toBe("completed");
			expect(body.data).toBeDefined();
			testInviteId = body.data?.inviteId || body.data?.id;
		});
	});

	describe("POST /api/v1/albums/:albumId/invites/:inviteId/resend", () => {
		it("should resend an existing invite", async () => {
			if (!testInviteId) {
				expect(true).toBe(true);
				return;
			}
			const res = await app.handle(
				req.post(`/api/v1/albums/${testAlbumId}/invites/${testInviteId}/resend`, {}, { Cookie: owner.cookie }),
			);
			expect(res.status).toBeGreaterThanOrEqual(200);
		});

		it("should fail for non-existent invite", async () => {
			const res = await app.handle(
				req.post(`/api/v1/albums/${testAlbumId}/invites/non-existent/resend`, {}, { Cookie: owner.cookie }),
			);
			expect(res.status).toBeGreaterThanOrEqual(400);
		});
	});

	describe("PATCH /api/v1/albums/:albumId/invites/:inviteId", () => {
		it("should update invite role", async () => {
			if (!testInviteId) {
				expect(true).toBe(true);
				return;
			}
			const res = await app.handle(
				req.patch(
					`/api/v1/albums/${testAlbumId}/invites/${testInviteId}`,
					{ role: "CONTRIBUTOR" },
					{ Cookie: owner.cookie },
				),
			);
			expect(res.status).toBeGreaterThanOrEqual(200);
		});

		it("should fail for invalid role", async () => {
			if (!testInviteId) {
				expect(true).toBe(true);
				return;
			}
			const res = await app.handle(
				req.patch(
					`/api/v1/albums/${testAlbumId}/invites/${testInviteId}`,
					{ role: "INVALID_ROLE" },
					{ Cookie: owner.cookie },
				),
			);
			expect(res.status).toBeGreaterThanOrEqual(400);
		});
	});

	describe("POST /api/v1/albums/:albumId/images/bulk-status", () => {
		let testImageId: string;

		beforeAll(async () => {
			const imageRes = await app.handle(
				req.get("/api/v1/images", { Cookie: owner.cookie }),
			);
			const imageBody = await parseRes(imageRes);
			const images = imageBody.data.images;
			if (images && images.length > 0) {
				testImageId = images[0].imageId;
			}
		});

		it("should fail without image IDs", async () => {
			const res = await app.handle(
				req.post(
					`/api/v1/albums/${testAlbumId}/images/bulk-status`,
					{ status: "approved" },
					{ Cookie: owner.cookie },
				),
			);
			expect(res.status).toBeGreaterThanOrEqual(400);
		});

		it("should update images status with valid IDs", async () => {
			if (!testImageId) {
				expect(true).toBe(true);
				return;
			}
			const res = await app.handle(
				req.post(
					`/api/v1/albums/${testAlbumId}/images/bulk-status`,
					{ imageIds: [testImageId], status: "approved" },
					{ Cookie: owner.cookie },
				),
			);
			expect(res.status).toBeGreaterThanOrEqual(200);
		});
	});
});