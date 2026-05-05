import fs from "node:fs";
import path from "node:path";

const fileContent = (serviceName: string) => `
import { joi } from "@lumina/utils";
import { aliaserSpec, validateSpec } from "@lumina/utils";
import { ${serviceName} } from "./${serviceName}.lib.ts";

const spec = joi.object({
  // TODO: Define validation schema
  user_id: joi.string().required(),
});

const aliasSpec = {
  request: {
    // TODO: Map client keys to internal keys
    // userId: "user_id",
  },
  response: {
    // TODO: Map internal keys to client keys
    // user_id: "userId",
  },
};

const service = async (data: any, dependencies?: any) => {
  const aliasReq = aliaserSpec(aliasSpec.request, data);
  const params = validateSpec(spec, aliasReq);

  const result = await ${serviceName}(params, dependencies);

  const aliasRes = aliaserSpec(aliasSpec.response, result);
  return aliasRes;
};

export default service;
`;

const libContent = (serviceName: string) => `
/**
 * Business logic for ${serviceName}
 */
export const ${serviceName} = async (params: any, dependencies?: any) => {
  // TODO: Implement business logic
  // Call models or other services
  return params;
};
`;

const createService = (serviceName: string, options: any) => {
  if (!serviceName) {
    console.error("Please provide a service name.");
    process.exit(1);
  }

  const outputFileName = `${serviceName}.service.ts`;
  const libFileName = `${serviceName}.lib.ts`;

  const dirPath = path.join(".", "src", "services");
  let filePath = "";
  let libPath = "";

  if (options?.dir) {
    const targetDir = path.join(dirPath, options.dir);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
      console.log(\`Folder "\${targetDir}" created successfully.\`);
    }
    filePath = path.join(targetDir, outputFileName);
    libPath = path.join(targetDir, libFileName);
  } else {
    filePath = path.join(dirPath, outputFileName);
    libPath = path.join(dirPath, libFileName);
  }

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, fileContent(serviceName));
    console.log(\`Service file "\${outputFileName}" created with boilerplate.\`);
  } else {
    console.log(\`Service "\${outputFileName}" already exists.\`);
  }

  if (!fs.existsSync(libPath)) {
    fs.writeFileSync(libPath, libContent(serviceName));
    console.log(\`Lib file "\${libFileName}" created.\`);
  }

  console.log("\\nNext steps:");
  console.log("1. Define the Joi schema in the service file");
  console.log("2. Set up request/response aliases");
  console.log("3. Implement business logic in the lib file");
};

export { createService };
