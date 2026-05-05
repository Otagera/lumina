import joi from "joi";
import {
	deleteStorageConfig,
	fetchStorageConfigs,
} from "../../../../../packages/models/src/users.model.ts";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";

const spec = joi.object({
	userId: joi.string().required(),
	configId: joi.string().required(),
});

const aliasSpec = {
	request: { userId: "user_id" },
	response: { success: "success" },
};

const service = async (data: any) => {
	const params = validateSpec(spec, aliaserSpec(aliasSpec.request, data));

	// Verify ownership
	const configs = await fetchStorageConfigs(params.user_id);
	const hasConfig = configs.some((c) => c.id === params.configId);

	if (!hasConfig) {
		throw new Error("Storage configuration not found or unauthorized");
	}

	await deleteStorageConfig(params.configId);

	return aliaserSpec(aliasSpec.response, { success: true });
};

export const deleteStorageConfigService = service;
