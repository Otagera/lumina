import joi from "joi";
import { createStorageConfig } from "../../../../../packages/models/src/users.model.ts";
import { encrypt } from "../../../../../packages/utils/src/encryption.util.ts";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";

const spec = joi.object({
	user_id: joi.string().required(),
	provider: joi.string().valid("r2", "s3").required(),
	name: joi.string().required(),
	access_key_id: joi.string().required(),
	secret_access_key: joi.string().required(),
	bucket: joi.string().required(),
	endpoint: joi.string().required(),
	region: joi.string().optional(),
	is_active: joi.boolean().optional(),
});

const aliasSpec = {
	request: {
		userId: "user_id",
		provider: "provider",
		name: "name",
		accessKeyId: "access_key_id",
		secretAccessKey: "secret_access_key",
		bucket: "bucket",
		endpoint: "endpoint",
		region: "region",
		isActive: "is_active",
	},
	response: {
		id: "id",
		name: "name",
		provider: "provider",
		bucket: "bucket",
	},
};

const service = async (data: any) => {
	const params = validateSpec(spec, aliaserSpec(aliasSpec.request, data));

	// Encrypt sensitive keys
	params.access_key_id = encrypt(params.access_key_id);
	params.secret_access_key = encrypt(params.secret_access_key);

	const result = await createStorageConfig(params.user_id, params);

	return aliaserSpec(aliasSpec.response, result);
};

export const createStorageConfigService = service;
