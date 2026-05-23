import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import prisma from "../../../../packages/config/src/db.config.ts";
import { queueServices } from "../../../worker/src/queue/queue.service.ts";

const tracker = {
	addJobCount: 0,
	createManyCount: 0,
	createCount: 0,
	updateManyCount: 0,
};

const mockedImages = [
	{
		image_id: "11111111-1111-1111-1111-111111111111",
		uploaded_by: "22222222-2222-2222-2222-222222222222",
		users: { email: "one@test.dev" },
		album_images: [{ albums: { album_name: "Family" } }],
	},
	{
		image_id: "33333333-3333-3333-3333-333333333333",
		uploaded_by: "44444444-4444-4444-4444-444444444444",
		users: { email: "two@test.dev" },
		album_images: [{ albums: { album_name: "Trips" } }],
	},
];

const originals = {
	findMany: prisma.images.findMany,
	updateMany: prisma.images.updateMany,
	createMany: prisma.notifications.createMany,
	create: prisma.notifications.create,
	addJob: queueServices.emailQueueLib?.addJob,
};

describe("moderatePicturesService performance fixture", () => {
	let moderatePicturesService: typeof import("../services/pictures/moderatePictures.service").moderatePicturesService;

	beforeAll(async () => {
		(prisma.images as any).findMany = async () => mockedImages;
		(prisma.images as any).updateMany = async () => {
			tracker.updateManyCount += 1;
			return { count: 2 };
		};
		(prisma.notifications as any).createMany = async () => {
			tracker.createManyCount += 1;
			return { count: 2 };
		};
		(prisma.notifications as any).create = async () => {
			tracker.createCount += 1;
			return {};
		};
		if (queueServices.emailQueueLib) {
			(queueServices.emailQueueLib as any).addJob = async () => {
				tracker.addJobCount += 1;
			};
		} else {
			(queueServices as any).emailQueueLib = {
				addJob: async () => {
					tracker.addJobCount += 1;
				},
			};
		}
		({ moderatePicturesService } = await import(
			"../services/pictures/moderatePictures.service"
		));
	});

	afterAll(() => {
		(prisma.images as any).findMany = originals.findMany;
		(prisma.images as any).updateMany = originals.updateMany;
		(prisma.notifications as any).createMany = originals.createMany;
		(prisma.notifications as any).create = originals.create;
		if (originals.addJob && queueServices.emailQueueLib) {
			(queueServices.emailQueueLib as any).addJob = originals.addJob;
		}
	});

	it("batches notifications and email queue work for approved images", async () => {
		const response = await moderatePicturesService({
			imageIds: [
				"11111111-1111-1111-1111-111111111111",
				"33333333-3333-3333-3333-333333333333",
			],
			status: "APPROVED",
		});

		expect(response.count).toBe(2);
		expect(tracker.addJobCount).toBe(1);
		expect(tracker.createManyCount).toBe(1);
		expect(tracker.createCount).toBe(0);
	});
});
