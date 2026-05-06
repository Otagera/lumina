import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { Users } from "../../../../packages/models/src/index.model.ts";
import { HTTP_STATUS_CODES } from "../../../../packages/utils/src/constants.util.ts";
import { getApp, parseRes, req, setupAuth } from "./test-utils";

describe("Auth Extended Routes (Native)", () => {
	const prefix = `auth-ext-${Date.now()}`;
	const testEmail = `${prefix}@example.com`;
	const testPassword = "ValidPassword123!";
	let app: any;
	let user: any;

	beforeAll(async () => {
		app = await getApp();

		await app.handle(
			req.post("/api/v1/auth/signup", {
				email: testEmail,
				password: testPassword,
			}),
		);

		const loginRes = await app.handle(
			req.post("/api/v1/auth/login", {
				email: testEmail,
				password: testPassword,
			}),
		);
		const cookieHeader = loginRes.headers.get("set-cookie") || "";
		const tokenMatch = cookieHeader.match(/accessToken=([^;]+)/);
		const token = tokenMatch ? tokenMatch[1] : "";

		user = {
			email: testEmail,
			password: testPassword,
			cookie: cookieHeader,
			token,
			authHeader: { Authorization: `Bearer ${token}`, Cookie: cookieHeader },
		};
	});

	afterAll(async () => {
		const userRecord = await Users.fetchUserByEmail(testEmail);
		if (userRecord) {
			await Users.deleteUserById(userRecord.user_id);
		}
	});

	describe("POST /api/v1/auth/forgot-password", () => {
		it("should request password reset for existing user", async () => {
			const res = await app.handle(
				req.post("/api/v1/auth/forgot-password", { email: testEmail }),
			);
			const body = await parseRes(res);

			expect(res.status).toBe(HTTP_STATUS_CODES.OK);
			expect(body.status).toBe("completed");
			expect(body.message).toContain("reset");
		});

		it("should return same response for non-existent user (security)", async () => {
			const res = await app.handle(
				req.post("/api/v1/auth/forgot-password", { email: "nonexistent@example.com" }),
			);
			const body = await parseRes(res);

			expect(res.status).toBe(HTTP_STATUS_CODES.OK);
			expect(body.status).toBe("completed");
		});
	});

	describe("POST /api/v1/auth/reset-password", () => {
		it("should fail with invalid token", async () => {
			const res = await app.handle(
				req.post("/api/v1/auth/reset-password", {
					token: "invalid-token",
					password: "NewPassword123!",
				}),
			);
			const body = await parseRes(res);

			expect(res.status).toBe(HTTP_STATUS_CODES.BAD_REQUEST);
			expect(body.status).toBe("error");
		});

		it("should fail with weak password", async () => {
			const res = await app.handle(
				req.post("/api/v1/auth/reset-password", {
					token: "valid-token",
					password: "short",
				}),
			);
			const body = await parseRes(res);

			expect(res.status).toBe(HTTP_STATUS_CODES.BAD_REQUEST);
			expect(body.status).toBe("error");
		});
	});

	describe("POST /api/v1/auth/logout", () => {
		it("should successfully log out user", async () => {
			const res = await app.handle(
				req.post("/api/v1/auth/logout", {}, user.authHeader),
			);
			const body = await parseRes(res);

			expect(res.status).toBe(HTTP_STATUS_CODES.OK);
			expect(body.status).toBe("completed");
		});

		it("should clear authentication cookies", async () => {
			const loginRes = await app.handle(
				req.post("/api/v1/auth/login", {
					email: testEmail,
					password: testPassword,
				}),
			);
			const cookieHeader = loginRes.headers.get("set-cookie") || "";

			const logoutRes = await app.handle(
				req.post("/api/v1/auth/logout", {}, { Cookie: cookieHeader }),
			);

			expect(logoutRes.headers.get("set-cookie")).toContain("Max-Age=0");
		});
	});

	describe.skip("POST /api/v1/auth/refresh", () => {
		// Skipped - needs proper refresh token handling
	});
});