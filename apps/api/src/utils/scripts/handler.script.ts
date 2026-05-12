import fs from "node:fs";
import path from "node:path";

const fileContent = (handlerName, _options) => `
const ${handlerName}Service = require("@services/${handlerName}.service");
const models = require("@models/index.model");
const { HTTP_STATUS_CODES } = require("@utils/constants.util");

const handler = {
  method: "",
  handler: async (req, res) => {
    try {
      const data = await ${handlerName}Service(req.body, { models });
      return res.status(HTTP_STATUS_CODES.OK).send({
        status: "completed",
        message: "",
        data,
      });
    } catch (error) {
      return res
        .status(error?.statusCode ?? HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR)
        .send({
          status: "error",
          message: error?.message || "Internal server error",
          data: null,
        });
    }
  },
  path: "/",
  middlewares: [],
};

export default handler;

`;
const createHandler = (handlerName, options) => {
	if (!handlerName) {
		console.error("Please provide a handler name.");
		process.exit(1);
	}
	const outputFileName = `${handlerName}.handler.js`;

	const dirPath = `.${path.sep}src${path.sep}routes${path.sep}handlers`;
	let filePath = "";

	if (options?.dir) {
		if (!fs.existsSync(`${dirPath}${path.sep}${options?.dir}`)) {
			fs.promises
				.mkdir(`${dirPath}${path.sep}${options?.dir}`, { recursive: true })
				.then(() => {
					console.log(
						`Folder "${`${dirPath}${path.sep}${options?.dir}`}" created successfully.`,
					);
					filePath = `${dirPath}${path.sep}${options?.dir}${path.sep}${outputFileName}`;
				})
				.catch((error) => {
					console.error(`Error creating folder: ${error.message}`);
				});
		}
		filePath = `${dirPath}${path.sep}${options?.dir}${path.sep}${outputFileName}`;
	} else {
		filePath = `${dirPath}${path.sep}${outputFileName}`;
	}

	if (!fs.existsSync(filePath)) {
		// Write content to the file
		fs.writeFileSync(
			`${filePath}`,
			fileContent(handlerName, { dir: !!options?.dir }),
		);
		console.log(`File "${outputFileName}" created with a boilerplate.`);
	} else {
		console.log(`Handler "${outputFileName}" already exists.`);
	}
};
export { createHandler };
