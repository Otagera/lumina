import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { Users } from "../../../../packages/models/src/index.model.ts";
import { HTTP_STATUS_CODES } from "../../../../packages/utils/src/constants.util.ts";
import { getApp, parseRes, req, setupAuth } from "./test-utils";

describe("Settings Routes (Native)", () => {
	let app: any;
	let user: any;
	let testConfigId: string;

	beforeAll(async () => {
		app = await getApp();
		user = await setupAuth(app);
	});

	afterAll(async () => {
		if (user.userId) {
			await Users.deleteUserById(user.userId);
		}
	});

	describe("Profile Settings", () => {
		it("should fetch user settings", async () => {
			const res = await app.handle(
				req.get("/api/v1/settings", user.authHeader),
			);
			const body = await parseRes(res);

			expect(res.status).toBe(HTTP_STATUS_CODES.OK);
			expect(body.status).toBe("completed");
			expect(body.data.email).toBe(user.email);
		});
	});

	describe("Email Preferences", () => {
		it("should fetch email preferences", async () => {
			const res = await app.handle(
				req.get("/api/v1/settings/email-preferences", user.authHeader),
			);
			const body = await parseRes(res);

			expect(res.status).toBe(HTTP_STATUS_CODES.OK);
			expect(body.status).toBe("completed");
			expect(body.data.welcome).toBeDefined();
		});

		it("should update email preferences", async () => {
			const res = await app.handle(
				req.put(
					"/api/v1/settings/email-preferences",
					{
						marketing: true,
						clustering: false,
					},
					user.authHeader,
				),
			);
			const body = await parseRes(res);

			expect(res.status).toBe(HTTP_STATUS_CODES.OK);
			expect(body.status).toBe("completed");

			// Verify update
			const checkRes = await app.handle(
				req.get("/api/v1/settings/email-preferences", user.authHeader),
			);
			const checkBody = await parseRes(checkRes);
			expect(checkBody.data.marketing).toBe(true);
			expect(checkBody.data.clustering).toBe(false);
		});
	});

	describe("Storage Configurations (BYOS)", () => {
		it("should create a new storage config", async () => {
			const res = await app.handle(
				req.post(
					"/api/v1/settings/storage",
					{
						provider: "r2",
						name: "Test R2",
						accessKeyId: "test-key",
						secretAccessKey: "test-secret",
						bucket: "test-bucket",
						endpoint: "https://test.r2.cloudflarestorage.com",
						region: "auto",
					},
					user.authHeader,
				),
			);
			const body = await parseRes(res);
			if (res.status !== HTTP_STATUS_CODES.CREATED) {
				console.log("Create storage failed:", JSON.stringify(body));
			}

			expect(res.status).toBe(HTTP_STATUS_CODES.CREATED);
			expect(body.status).toBe("completed");
			expect(body.data.id).toBeDefined();
			testConfigId = body.data.id;
		});

		it("should update storage config", async () => {
			const res = await app.handle(
				req.put(
					`/api/v1/settings/storage/${testConfigId}`,
					{
						name: "Updated R2 Name",
					},
					user.authHeader,
				),
			);
			const body = await parseRes(res);

			expect(res.status).toBe(HTTP_STATUS_CODES.OK);
			expect(body.status).toBe("completed");
		});

		it("should delete storage config", async () => {
			const res = await app.handle(
				req.delete(`/api/v1/settings/storage/${testConfigId}`, user.authHeader),
			);
			expect(res.status).toBe(HTTP_STATUS_CODES.OK);
		});
	});
});
