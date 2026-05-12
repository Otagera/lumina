import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(process.cwd(), "src");
const errors: string[] = [];

const walk = (dir: string) => {
	for (const entry of readdirSync(dir)) {
		const fullPath = join(dir, entry);
		const stats = statSync(fullPath);

		if (stats.isDirectory()) {
			walk(fullPath);
			continue;
		}

		if (!fullPath.endsWith(".ts") || fullPath.endsWith("enforce-status-conventions.ts")) continue;
		const content = readFileSync(fullPath, "utf8");

		if (content.includes("HTTP_STATUS_CODES.INTERNAL_ERROR")) {
			errors.push(`${fullPath}: use HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR only.`);
		}

		if (content.includes("statusCode?: number;")) {
			errors.push(`${fullPath}: avoid optional statusCode declarations; provide a safe default.`);
		}
	}
};

walk(ROOT);

if (errors.length > 0) {
	console.error("Status convention check failed:\n");
	for (const error of errors) console.error(`- ${error}`);
	process.exit(1);
}

console.log("Status convention check passed.");
