import { describe, expect, it, mock } from "bun:test";

const prismaStub = new Proxy({}, { get: () => ({}) });

mock.module("../../config/src/db.config.ts", () => ({ default: prismaStub }));
mock.module("../../config/src/index.config.ts", () => ({
	default: { env: "test", test: { base_api_url: "http://localhost" } },
}));
mock.module("../../../apps/worker/src/queue/queue.service.ts", () => ({
	queueServices: { fileDeletionQueueLib: { addJob: mock() } },
}));

const modelModules = [
	"../src/albumImages.model.ts",
	"../src/albums.model.ts",
	"../src/faces.model.ts",
	"../src/images.model.ts",
	"../src/passwordResets.model.ts",
	"../src/people.model.ts",
	"../src/reactions.model.ts",
	"../src/refreshTokens.model.ts",
	"../src/usage.model.ts",
	"../src/users.model.ts",
];

describe("model export contracts", () => {
	for (const modulePath of modelModules) {
		it(`${modulePath} exports callable model functions`, async () => {
			const loaded = await import(modulePath);
			const entries = Object.entries(loaded).filter(
				([name]) => name !== "default",
			);
			expect(entries.length).toBeGreaterThan(0);
			for (const [, exportedValue] of entries) {
				expect(typeof exportedValue).toBe("function");
			}
		});
	}
});
