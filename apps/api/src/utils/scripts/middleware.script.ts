import fs from "node:fs";
import path from "node:path";

const fileContent = () => `
async function middleware(req, res, next) {
  try {
    
  } catch (error) {
    return res
      .status(error?.statusCode ?? HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR)
      .send({
        status: "error",
        message: error?.message || "Internal server error",
        data: null,
      });
  }
  next();
}

export default middleware

`;
const createMiddleware = (middlewarename) => {
	if (!middlewarename) {
		console.error("Please provide a middleware name.");
		process.exit(1);
	}
	const outputFileName = `${middlewarename}.middleware.js`;

	const filePath = `.${path.sep}src${path.sep}routes${path.sep}middlewares${path.sep}${outputFileName}`;
	if (!fs.existsSync(filePath)) {
		// Write content to the file
		fs.writeFileSync(`${filePath}`, fileContent(middlewarename));
		console.log(`File "${outputFileName}" created with a boilerplate.`);
	} else {
		console.log(`Middleware "${outputFileName}" already exists.`);
	}
};
export { createMiddleware };
