#!/usr/bin/env bun
/**
 * Service Generator
 * Generates a new service following the standardized pattern
 *
 * Usage: bun run service-generator.ts --name createUser --category auth
 */

import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const args = process.argv.slice(2);
const nameIndex = args.indexOf("--name");
const categoryIndex = args.indexOf("--category");

if (nameIndex === -1 || categoryIndex === -1) {
	console.error(
		"Usage: bun run service-generator.ts --name <serviceName> --category <category>",
	);
	process.exit(1);
}

const serviceName = args[nameIndex + 1];
const category = args[categoryIndex + 1];

const serviceDir = join(__dirname, "..", "..", "src", "services", category);
const serviceFileName = `${serviceName}.service.ts`;
const libFileName = `${category}.lib.ts`;

// Ensure directory exists
if (!existsSync(serviceDir)) {
	mkdirSync(serviceDir, { recursive: true });
}

const serviceContent = `import { joi } from "@lumina/utils";
import { aliaserSpec, validateSpec } from "@lumina/utils";
import { ${serviceName} } from "./${libFileName.replace(".ts", "")}";

const spec = joi.object({
  // TODO: Define input schema
  user_id: joi.string().required(),
});

const aliasSpec = {
  request: {
    // TODO: Map client keys to internal keys (camelCase → snake_case)
    // userId: "user_id",
  },
  response: {
    // TODO: Map internal keys to client keys (snake_case → camelCase)
    // user_id: "userId",
  },
};

export const service = async (data: any, dependencies?: any) => {
  const aliasReq = aliaserSpec(aliasSpec.request, data);
  const params = validateSpec(spec, aliasReq);

  // Call business logic
  const result = await ${serviceName}(params, dependencies);

  const aliasRes = aliaserSpec(aliasSpec.response, result);
  return aliasRes;
};

export default service;
`;

const libContent = `/**
 * ${category} library - business logic
 */

export const ${serviceName} = async (params: any, dependencies?: any) => {
  // TODO: Implement business logic
  // Call models or other services here
  return params;
};
`;

// Write service file
writeFileSync(join(serviceDir, serviceFileName), serviceContent);
console.log(`Created: ${join(serviceDir, serviceFileName)}`);

// Create lib file if it doesn't exist
const libPath = join(serviceDir, libFileName);
if (!existsSync(libPath)) {
	writeFileSync(libPath, libContent);
	console.log(`Created: ${libPath}`);
}

console.log("\\nService generated successfully!");
console.log("Next steps:");
console.log("1. Define the Joi schema in the service file");
console.log("2. Set up request/response aliases");
console.log("3. Implement business logic in the lib file");
console.log("4. Import and use in your route");
