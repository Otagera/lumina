import { beforeAll, describe, expect, it, mock } from "bun:test";

const mockOutput = new Uint8Array([1, 2, 3, 4]);
const tracker = {
	extractCalled: false,
	resizeArgs: null as null | [number, number, { fit: string; kernel: string }],
	toFormatArgs: null as null | [string, { quality: number }],
};

mock.module("sharp", () => ({
	default: () => ({
		metadata: async () => ({ width: 64, height: 64 }),
		extract: () => {
			tracker.extractCalled = true;
			return {
				resize: (w: number, h: number, opts: { fit: string; kernel: string }) => {
					tracker.resizeArgs = [w, h, opts];
					return {
						sharpen: () => ({
							toFormat: (format: string, opts: { quality: number }) => {
								tracker.toFormatArgs = [format, opts];
								return { toBuffer: async () => mockOutput };
							},
						}),
					};
				},
			};
		},
		resize: (w: number, h: number, opts: { fit: string; kernel: string }) => {
			tracker.resizeArgs = [w, h, opts];
			return {
				sharpen: () => ({
					toFormat: (format: string, opts2: { quality: number }) => {
						tracker.toFormatArgs = [format, opts2];
						return { toBuffer: async () => mockOutput };
					},
				}),
			};
		},
	}),
}));

mock.module("../../../../../packages/config/src/db.config.ts", () => ({
	default: {
		images: {
			findUnique: async () => ({
				image_id: "11111111-1111-1111-1111-111111111111",
				image_path: "/tmp/ignored.png",
				optimized_path: null,
				storage_provider: "r2",
				storage_key: "images/test.png",
				original_width: 64,
				original_height: 64,
			}),
		},
		faces: {
			findUnique: async () => ({
				bounding_box: { top: 0.2, left: 0.2, right: 0.8, bottom: 0.8 },
			}),
		},
	},
}));

mock.module("../../../../../packages/config/src/index.config.ts", () => ({
	default: { env: "development", development: { r2: {} } },
}));

mock.module("../../../../../packages/utils/src/storage.util.ts", () => ({
	storage: {
		getProvider: () => ({ getObject: async () => new Uint8Array([10, 20, 30]) }),
	},
}));

describe("thumbnailService", () => {
	let thumbnailService: typeof import("../services/pictures/thumbnail.service").thumbnailService;

	beforeAll(async () => {
		({ thumbnailService } = await import("../services/pictures/thumbnail.service"));
	});

	it("generates thumbnail via sharp pipeline", async () => {
		const result = await thumbnailService({
			imageId: "11111111-1111-1111-1111-111111111111",
			faceId: "123",
		});

		expect(result.contentType).toBe("image/webp");
		expect(result.imageBuffer).toEqual(mockOutput);
		expect(tracker.extractCalled).toBe(true);
		expect(tracker.resizeArgs).toEqual([250, 250, { fit: "cover", kernel: "lanczos3" }]);
		expect(tracker.toFormatArgs).toEqual(["webp", { quality: 85 }]);
	});
});
