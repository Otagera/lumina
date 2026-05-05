import joi from "joi";
import {
	fetchStorageConfigs,
	updateStorageConfig,
} from "../../../../../packages/models/src/users.model.ts";
import { encrypt } from "../../../../../packages/utils/src/encryption.util.ts";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";

const spec = joi.object({
	user_id: joi.string().required(),
	config_id: joi.string().required(),
	provider: joi.string().valid("r2", "s3"),
	name: joi.string(),
	access_key_id: joi.string(),
	secret_access_key: joi.string(),
	bucket: joi.string(),
	endpoint: joi.string(),
	region: joi.string().optional(),
	is_active: joi.boolean().optional(),
});

const aliasSpec = {
	request: {
		userId: "user_id",
		configId: "config_id",
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

	// Verify ownership
	const configs = await fetchStorageConfigs(params.user_id);
	const hasConfig = configs.some((c) => c.id === params.config_id);

	if (!hasConfig) {
		throw new Error("Storage configuration not found or unauthorized");
	}

	const updateData: any = { ...params };
	delete updateData.user_id;
	delete updateData.config_id;

	if (updateData.access_key_id)
		updateData.access_key_id = encrypt(updateData.access_key_id);
	if (updateData.secret_access_key)
		updateData.secret_access_key = encrypt(updateData.secret_access_key);

	const result = await updateStorageConfig(params.config_id, updateData);

	return aliaserSpec(aliasSpec.response, result);
};

export const updateStorageConfigService = service;
