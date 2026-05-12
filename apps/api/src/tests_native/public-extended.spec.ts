import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { Users } from "../../../../packages/models/src/index.model.ts";
import { HTTP_STATUS_CODES } from "../../../../packages/utils/src/constants.util.ts";
import { getApp, parseRes, req, setupAuth } from "./test-utils";

describe("Public Extended Routes (Native)", () => {
	let app: any;
	let owner: any;
	let testAlbumId: string;
	let testShareToken: string;

	beforeAll(async () => {
		app = await getApp();
		owner = await setupAuth(app);

		const albumRes = await app.handle(
			req.post(
				"/api/v1/albums",
				{ albumName: "Public Extended Test" },
				{ Cookie: owner.cookie },
			),
		);
		const albumBody = await parseRes(albumRes);
		testAlbumId = albumBody.data.id;
		testShareToken = albumBody.data.shareToken;

		await app.handle(
			req.put(
				`/api/v1/albums/${testAlbumId}`,
				{
					settings: { is_event: true, allow_guest_uploads: true },
				},
				{ Cookie: owner.cookie },
			),
		);
	});

	afterAll(async () => {
		if (owner.userId) {
			await Users.deleteUserById(owner.userId);
		}
	});

	describe("GET /api/v1/public/plans", () => {
		it("should fetch subscription plans", async () => {
			const res = await app.handle(req.get("/api/v1/public/plans"));
			const body = await parseRes(res);

			expect(res.status).toBe(HTTP_STATUS_CODES.OK);
		});
	});

	describe("GET /api/v1/public/invite/:token", () => {
		let inviteToken: string;

		beforeAll(async () => {
			const inviteRes = await app.handle(
				req.post(
					`/api/v1/albums/${testAlbumId}/invites`,
					{
						role: "VIEWER",
					},
					{ Cookie: owner.cookie },
				),
			);
			const inviteBody = await parseRes(inviteRes);
			inviteToken = inviteBody.data.inviteToken;
		});

		it("should retrieve invite details", async () => {
			const res = await app.handle(
				req.get(`/api/v1/public/invite/${inviteToken}`),
			);
			const body = await parseRes(res);

			expect(res.status).toBe(HTTP_STATUS_CODES.OK);
			expect(body.data.albumId).toBe(testAlbumId);
		});

		it("should return 404 for invalid token", async () => {
			const res = await app.handle(
				req.get("/api/v1/public/invite/invalid-token"),
			);
			expect(res.status).toBe(HTTP_STATUS_CODES.NOTFOUND);
		});
	});
});
