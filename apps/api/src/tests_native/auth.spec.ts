import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { Users } from "../../../../packages/models/src/index.model.ts";
import { HTTP_STATUS_CODES } from "../../../../packages/utils/src/constants.util.ts";
import { getApp, parseRes, req } from "./test-utils";

describe("Auth Routes (Native)", () => {
	const prefix = `native-auth-${Date.now()}`;
	const testEmail = `${prefix}@example.com`;
	const testPassword = "ValidPassword123!";
	let app: any;

	beforeAll(async () => {
		app = await getApp();
	});

	afterAll(async () => {
		const user = await Users.fetchUserByEmail(testEmail);
		if (user) {
			await Users.deleteUserById(user.user_id);
		}
	});

	describe("POST /api/v1/auth/signup", () => {
		it("should successfully sign up a new user", async () => {
			const res = await app.handle(
				req.post("/api/v1/auth/signup", {
					email: testEmail,
					password: testPassword,
				}),
			);

			const body = await parseRes(res);

			expect(res.status).toBe(HTTP_STATUS_CODES.CREATED);
			expect(body.status).toBe("completed");
			expect(body.data.email).toBe(testEmail);
			expect(res.headers.get("set-cookie")).toContain("accessToken");
		});

		it("should fail to sign up with an existing email", async () => {
			const res = await app.handle(
				req.post("/api/v1/auth/signup", {
					email: testEmail,
					password: testPassword,
				}),
			);

			const body = await parseRes(res);
			expect(res.status).toBeGreaterThanOrEqual(400);
			expect(body.status).toBe("error");
		});
	});

	describe("POST /api/v1/auth/login", () => {
		it("should successfully log in an existing user", async () => {
			const res = await app.handle(
				req.post("/api/v1/auth/login", {
					email: testEmail,
					password: testPassword,
				}),
			);

			const body = await parseRes(res);

			expect(res.status).toBe(HTTP_STATUS_CODES.OK);
			expect(body.status).toBe("completed");
			expect(res.headers.get("set-cookie")).toContain("accessToken");
		});

		it("should fail to log in with the wrong password", async () => {
			const res = await app.handle(
				req.post("/api/v1/auth/login", {
					email: testEmail,
					password: "WrongPassword1!",
				}),
			);

			const body = await parseRes(res);
			expect(res.status).toBe(HTTP_STATUS_CODES.UNAUTHORIZED);
			expect(body.status).toBe("error");
		});
	});

	describe("GET /api/v1/auth/me", () => {
		it("should return current user when authenticated", async () => {
			// First login to get cookie
			const loginRes = await app.handle(
				req.post("/api/v1/auth/login", {
					email: testEmail,
					password: testPassword,
				}),
			);

			const cookie = loginRes.headers.get("set-cookie");

			const res = await app.handle(
				req.get("/api/v1/auth/me", {
					Cookie: cookie || "",
				}),
			);

			const body = await parseRes(res);

			expect(res.status).toBe(HTTP_STATUS_CODES.OK);
			expect(body.status).toBe("completed");
			expect(body.data.email).toBe(testEmail);
			expect(body.data.id).toBeDefined();
		});

		it("should fail when not authenticated", async () => {
			const res = await app.handle(req.get("/api/v1/auth/me"));
			expect(res.status).toBe(HTTP_STATUS_CODES.UNAUTHORIZED);
		});
	});
});
