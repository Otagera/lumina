import joi from "joi";
import { getUserUsageStats } from "../../../../../packages/models/src/usage.model.ts";
import { fetchUserById } from "../../../../../packages/models/src/users.model.ts";
import { decrypt } from "../../../../../packages/utils/src/encryption.util.ts";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";

const spec = joi.object({
	user_id: joi.string().required(),
});

const aliasSpec = {
	request: {
		userId: "user_id",
	},
	response: {
		user_id: "id",
		email: "email",
		preferences: "preferences",
		storage_configs: "storageConfigs",
		usage: "usage",
	},
	storageConfig: {
		id: "id",
		provider: "provider",
		name: "name",
		bucket: "bucket",
		endpoint: "endpoint",
		region: "region",
		is_active: "isActive",
		created_at: "createdAt",
	},
};

const service = async (data: any) => {
	const aliasReq = aliaserSpec(aliasSpec.request, data);
	const params = validateSpec(spec, aliasReq);

	const user = await fetchUserById(params.user_id);

	if (!user) throw new Error("User not found");

	const formattedConfigs = user.storage_configs.map((config) =>
		aliaserSpec(aliasSpec.storageConfig, config),
	);

	const usage = await getUserUsageStats(params.user_id);

	return aliaserSpec(aliasSpec.response, {
		...user,
		storage_configs: formattedConfigs,
		usage,
	});
};

export const fetchSettingsService = service;
