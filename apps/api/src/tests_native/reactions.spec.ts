import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import fs from "node:fs/promises";
import path from "node:path";
import { Users } from "../../../../packages/models/src/index.model.ts";
import { HTTP_STATUS_CODES } from "../../../../packages/utils/src/constants.util.ts";
import { storage } from "../../../../packages/utils/src/storage.util.ts";
import { getApp, parseRes, req, setupAuth } from "./test-utils";

describe("Reactions Routes (Native)", () => {
	let app: any;
	let user: any;
	let testImageId: string;
	let testAlbumId: string;
	const testImageKey = `test-reaction-${crypto.randomUUID()}.jpg`;

	beforeAll(async () => {
		app = await getApp();
		user = await setupAuth(app);

		const fixturePath = path.resolve(__dirname, "fixtures/test.jpg");
		const fileBuffer = await fs.readFile(fixturePath);
		await storage.upload(fileBuffer, {
			key: testImageKey,
			contentType: "image/jpeg",
		});

		const albumRes = await app.handle(
			req.post(
				"/api/v1/albums",
				{ albumName: "Reactions Test Album" },
				{ Cookie: user.cookie },
			),
		);
		const albumBody = await parseRes(albumRes);
		testAlbumId = albumBody.data.id;

		const uploadRes = await app.handle(
			req.post(
				"/api/v1/images",
				{
					uploadedImages: [{ existingKey: testImageKey }],
					albumId: testAlbumId,
				},
				{ Cookie: user.cookie },
			),
		);
		const uploadBody = await parseRes(uploadRes);
		expect(uploadRes.status).toBe(HTTP_STATUS_CODES.CREATED);
		testImageId = uploadBody.data.images[0].imageId;
	});

	afterAll(async () => {
		if (user.userId) {
			await Users.deleteUserById(user.userId);
		}
		await storage.delete(testImageKey);
	});

	it("returns reaction payload shape with reactionId", async () => {
		const res = await app.handle(
			req.post(
				"/api/v1/reactions",
				{ imageId: testImageId, type: "HEART" },
				{ Cookie: user.cookie },
			),
		);

		const body = await parseRes(res);

		expect(res.status).toBe(HTTP_STATUS_CODES.CREATED);
		expect(body.status).toBe("completed");
		expect(body.data.reactionId).toBeDefined();
		expect(body.data.imageId).toBe(testImageId);
		expect(body.data.type).toBe("HEART");
		expect(body.data.userId).toBe(user.userId);
		expect(typeof body.data.count).toBe("number");
	});
});
