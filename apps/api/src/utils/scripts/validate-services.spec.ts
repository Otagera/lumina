import { afterEach, describe, expect, it } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

import { validateRoute } from "./validate-services";

const tempDirs: string[] = [];

function createRouteFile(content: string, filename = "sample.route.ts") {
	const dir = mkdtempSync(join(tmpdir(), "validate-route-"));
	tempDirs.push(dir);
	const filePath = join(dir, filename);
	writeFileSync(filePath, content, "utf-8");
	return filePath;
}

afterEach(() => {
	for (const dir of tempDirs.splice(0)) {
		rmSync(dir, { recursive: true, force: true });
	}
});

describe("validateRoute", () => {
	it("keeps routes with only line-count warning as valid", () => {
		const longRoute = Array.from(
			{ length: 101 },
			(_, idx) => `// line ${idx + 1}`,
		).join("\n");
		const filePath = createRouteFile(longRoute);

		const result = validateRoute(filePath);

		expect(result.valid).toBe(true);
		expect(result.errors).toEqual([
			expect.stringContaining(
				"Route has 101 lines - consider moving logic to services",
			),
		]);
	});

	it("marks routes with direct prisma usage as invalid", () => {
		const filePath = createRouteFile("const x = prisma.users.findMany();");

		const result = validateRoute(filePath);

		expect(result.valid).toBe(false);
		expect(result.errors).toContain(
			"Direct Prisma usage detected - should use services",
		);
	});
});
