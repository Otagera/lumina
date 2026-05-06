import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import prisma from "../../../../packages/config/src/db.config.ts";
import { Users } from "../../../../packages/models/src/index.model.ts";
import { HTTP_STATUS_CODES } from "../../../../packages/utils/src/constants.util.ts";
import { getApp, parseRes, req, setupAuth } from "./test-utils";

describe("People Routes (Native)", () => {
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

	describe("POST /api/v1/people", () => {
		it("should successfully create a new person", async () => {
			const name = "Test Person";
			const res = await app.handle(
				req.post("/api/v1/people", { name }, { Cookie: user.cookie }),
			);

			const body = await parseRes(res);

			expect(res.status).toBe(HTTP_STATUS_CODES.OK);
			expect(body.status).toBe("completed");
			expect(body.data.name).toBe(name);
			expect(body.data.personId).toBeDefined();
		});

		it("should fail to create a person without a name", async () => {
			const res = await app.handle(
				req.post("/api/v1/people", {}, { Cookie: user.cookie }),
			);

			expect(res.status).toBe(422);
		});
	});

	describe("GET /api/v1/people", () => {
		it("should successfully list people for the user", async () => {
			const res = await app.handle(
				req.get("/api/v1/people", { Cookie: user.cookie }),
			);

			const body = await parseRes(res);

			expect(res.status).toBe(HTTP_STATUS_CODES.OK);
			expect(body.status).toBe("completed");
			expect(Array.isArray(body.data)).toBe(true);
		});
	});

	describe("Person Lifecycle", () => {
		let testPersonId: string;

		beforeAll(async () => {
			const res = await app.handle(
				req.post(
					"/api/v1/people",
					{ name: "Lifecycle Person" },
					{ Cookie: user.cookie },
				),
			);
			const body = await parseRes(res);
			testPersonId = body.data.personId;
		});

		it("should update a person", async () => {
			const newName = "Updated Person Name";
			const res = await app.handle(
				req.put(
					`/api/v1/people/${testPersonId}`,
					{ name: newName },
					{ Cookie: user.cookie },
				),
			);

			const body = await parseRes(res);

			expect(res.status).toBe(HTTP_STATUS_CODES.OK);
			expect(body.status).toBe("completed");

			// Verify name was updated in DB
			const person = await prisma.people.findUnique({
				where: { person_id: testPersonId },
			});
			expect(person?.name).toBe(newName);
		});

		it("should delete a person", async () => {
			const res = await app.handle(
				req.delete(`/api/v1/people/${testPersonId}`, { Cookie: user.cookie }),
			);

			const body = await parseRes(res);

			expect(res.status).toBe(HTTP_STATUS_CODES.OK);
			expect(body.status).toBe("completed");

			// Verify person is gone from DB
			const person = await prisma.people.findUnique({
				where: { person_id: testPersonId },
			});
			expect(person).toBeNull();
		});
	});
});
