import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { Users } from "../../../../packages/models/src/index.model.ts";
import { HTTP_STATUS_CODES } from "../../../../packages/utils/src/constants.util.ts";
import { getApp, parseRes, req, setupAuth } from "./test-utils";

describe("People Extended Routes (Native)", () => {
	let app: any;
	let user: any;
	let personId1: string;
	let personId2: string;

	beforeAll(async () => {
		app = await getApp();
		user = await setupAuth(app);

		const p1Res = await app.handle(
			req.post("/api/v1/people", { name: "Person One" }, { Cookie: user.cookie }),
		);
		const p1Body = await parseRes(p1Res);
		personId1 = p1Body.data.personId;

		const p2Res = await app.handle(
			req.post("/api/v1/people", { name: "Person Two" }, { Cookie: user.cookie }),
		);
		const p2Body = await parseRes(p2Res);
		personId2 = p2Body.data.personId;
	});

	afterAll(async () => {
		if (user.userId) {
			await Users.deleteUserById(user.userId);
		}
	});

	describe("POST /api/v1/people/merge", () => {
		it("should merge two people together", async () => {
			const res = await app.handle(
				req.post("/api/v1/people/merge", {
					sourcePersonId: personId1,
					targetPersonId: personId2,
				}, { Cookie: user.cookie }),
			);
			const body = await parseRes(res);

			expect(res.status).toBe(HTTP_STATUS_CODES.OK);
			expect(body.status).toBe("completed");
		});

		it("should fail with same person IDs", async () => {
			const res = await app.handle(
				req.post("/api/v1/people/merge", {
					sourcePersonId: personId1,
					targetPersonId: personId1,
				}, { Cookie: user.cookie }),
			);
			const body = await parseRes(res);

			expect(res.status).toBeGreaterThanOrEqual(400);
			expect(body.status).toBe("error");
		});

		it("should fail without required fields", async () => {
			const res = await app.handle(
				req.post("/api/v1/people/merge", {}, { Cookie: user.cookie }),
			);
			expect(res.status).toBeGreaterThanOrEqual(400);
		});

		it("should fail without authentication", async () => {
			const res = await app.handle(
				req.post("/api/v1/people/merge", {
					sourcePersonId: personId1,
					targetPersonId: personId2,
				}),
			);
			expect(res.status).toBe(HTTP_STATUS_CODES.UNAUTHORIZED);
		});
	});
});