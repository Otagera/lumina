import { beforeAll, describe, expect, it, mock } from "bun:test";

mock.module("joi", () => ({
	default: {
		object: () => ({}),
		array: () => ({ items: () => ({ min: () => ({ required: () => ({}) }) }) }),
		string: () => ({
			uuid: () => ({ required: () => ({}) }),
			valid: () => ({ required: () => ({}) }),
		}),
	},
}));

const tracker = {
	addJobCount: 0,
	createManyCount: 0,
	createCount: 0,
};

mock.module("../../../../../packages/config/src/db.config.ts", () => ({
	default: {
		images: {
			findMany: async () => [
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
			],
		},
		notifications: {
			createMany: async () => {
				tracker.createManyCount += 1;
				return { count: 2 };
			},
			create: async () => {
				tracker.createCount += 1;
				return {};
			},
		},
	},
}));

mock.module("../../../../worker/src/queue/queue.service.ts", () => ({
	queueServices: {
		emailQueueLib: {
			addJob: async () => {
				tracker.addJobCount += 1;
			},
		},
	},
}));

mock.module("../../../../../packages/models/src/images.model.ts", () => ({
	moderateImagesQuery: async () => ({ count: 2 }),
}));

mock.module("../../../../../packages/utils/src/specValidator.util.ts", () => ({
	aliaserSpec: (_: any, data: any) => data,
	validateSpec: (_: any, data: any) => data,
}));

describe("moderatePicturesService performance fixture", () => {
	let moderatePicturesService: typeof import("../services/pictures/moderatePictures.service").moderatePicturesService;

	beforeAll(async () => {
		({ moderatePicturesService } = await import(
			"../services/pictures/moderatePictures.service"
		));
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
