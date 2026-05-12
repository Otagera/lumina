import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import prisma from "../../../../packages/config/src/db.config.ts";
import { Users } from "../../../../packages/models/src/index.model.ts";
import { HTTP_STATUS_CODES } from "../../../../packages/utils/src/constants.util.ts";
import { getApp, parseRes, req, setupAuth } from "./test-utils";

describe("Notifications Extended Routes (Native)", () => {
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

	describe("POST /api/v1/notifications/mark-read", () => {
		it("should mark all notifications as read", async () => {
			const res = await app.handle(
				req.post(
					"/api/v1/notifications/mark-read",
					{},
					{ Cookie: user.cookie },
				),
			);
			const body = await parseRes(res);

			expect(res.status).toBe(HTTP_STATUS_CODES.OK);
			expect(body.status).toBe("completed");
		});

		it("should fail without authentication", async () => {
			const res = await app.handle(
				req.post("/api/v1/notifications/mark-read", {}),
			);
			expect(res.status).toBe(HTTP_STATUS_CODES.UNAUTHORIZED);
		});
	});
});
