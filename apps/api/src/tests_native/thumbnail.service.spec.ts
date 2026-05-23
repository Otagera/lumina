import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import prisma from "../../../../packages/config/src/db.config.ts";
import { thumbnailService } from "../services/pictures/thumbnail.service.ts";

const fixturePath = path.resolve(__dirname, "fixtures/test.jpg");

const originals = {
	imagesFindUnique: prisma.images.findUnique,
	facesFindUnique: prisma.faces.findUnique,
};

describe("thumbnailService", () => {
	beforeAll(() => {
		(prisma.images as any).findUnique = async () => ({
			image_id: "11111111-1111-1111-1111-111111111111",
			image_path: fixturePath,
			optimized_path: null,
			storage_provider: "local",
			storage_key: null,
			original_width: 64,
			original_height: 64,
		});
		(prisma.faces as any).findUnique = async () => ({
			bounding_box: { top: 0.2, left: 0.2, right: 0.8, bottom: 0.8 },
		});
	});

	afterAll(() => {
		(prisma.images as any).findUnique = originals.imagesFindUnique;
		(prisma.faces as any).findUnique = originals.facesFindUnique;
	});

	it("generates thumbnail via sharp pipeline", async () => {
		const result = await thumbnailService({
			imageId: "11111111-1111-1111-1111-111111111111",
			faceId: "123",
		});

		expect(result.contentType).toBe("image/webp");
		expect(result.imageBuffer).toBeInstanceOf(Buffer);
		expect((result.imageBuffer as Buffer).length).toBeGreaterThan(0);
	});
});
