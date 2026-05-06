import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { Users } from "../../../../packages/models/src/index.model.ts";
import { HTTP_STATUS_CODES } from "../../../../packages/utils/src/constants.util.ts";
import { getApp, parseRes, req, setupAuth } from "./test-utils";

describe("Other Routes (Native)", () => {
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

	describe("GET /api/v1/usage", () => {
		it("should successfully retrieve usage statistics", async () => {
			const res = await app.handle(
				req.get("/api/v1/usage", { Cookie: user.cookie }),
			);

			const body = await parseRes(res);

			expect(res.status).toBe(HTTP_STATUS_CODES.OK);
			expect(body.status).toBe("completed");
			expect(body.data.storageLimitMB).toBeDefined();
		});
	});

	describe("GET /api/v1/notifications", () => {
		it("should successfully retrieve notifications", async () => {
			const res = await app.handle(
				req.get("/api/v1/notifications", { Cookie: user.cookie }),
			);

			const body = await parseRes(res);

			expect(res.status).toBe(HTTP_STATUS_CODES.OK);
			expect(body.status).toBe("completed");
			expect(Array.isArray(body.data.notifications)).toBe(true);
		});
	});
});
