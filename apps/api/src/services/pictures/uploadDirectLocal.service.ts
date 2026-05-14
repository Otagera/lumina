import fs from "node:fs";
import path from "node:path";
import Joi from "joi";
import jwt from "jsonwebtoken";
import config from "../../../../../packages/config/src/index.config.ts";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";
import { verifyShareTokenService } from "./verifyShareToken.service.ts";

const spec = Joi.object({
	key: Joi.string().required(),
	share_token: Joi.string().optional(),
	auth_token: Joi.string().optional(),
	auth_header: Joi.string().optional(),
	request: Joi.any().required(),
});

const aliasSpec = {
	request: {
		shareToken: "share_token",
		authToken: "auth_token",
		authHeader: "auth_header",
	},
	response: {
		key: "key",
	},
};

export const uploadDirectLocalService = async (data: any) => {
	const aliasReq = aliaserSpec(aliasSpec.request, data);
	const params = validateSpec(spec, aliasReq);

	let isAuthorized = false;

	if (params.auth_token) {
		try {
			const decoded = jwt.verify(
				params.auth_token,
				config[config.env || "development"].secret || "default_secret",
			) as any;
			if (decoded.key === params.key) isAuthorized = true;
		} catch {
			// Invalid or expired token.
		}
	} else if (params.auth_header) {
		isAuthorized = true;
	} else if (params.share_token) {
		const result = await verifyShareTokenService({
			shareToken: params.share_token,
			key: params.key,
		});
		isAuthorized = result.authorized;
	}

	if (!isAuthorized) {
		const error = new Error("Unauthorized upload attempt") as Error & {
			statusCode: number;
		};
		error.statusCode = 401;
		throw error;
	}

	const uploadsDir = path.resolve(process.cwd(), "src/uploads");
	const filePath = path.resolve(uploadsDir, params.key);

	if (!filePath.startsWith(uploadsDir + path.sep)) {
		throw new Error("Invalid key");
	}

	await fs.promises.mkdir(uploadsDir, { recursive: true });
	const arrayBuffer = await params.request.arrayBuffer();
	const buffer = Buffer.from(arrayBuffer);
	await Bun.write(filePath, buffer);

	return aliaserSpec(aliasSpec.response, { key: params.key });
};
