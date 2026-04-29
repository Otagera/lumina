import joi from "joi";
import { getUserUsageStats } from "../../../../../packages/models/src/usage.model.ts";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";

const spec = joi.object({
	userId: joi.string().required(),
});

const aliasSpec = {
	request: {
		userId: "userId",
	},
	response: {
		computeUnitsUsed: "imagesUsed",
		computeUnitsLimit: "imagesLimit",
		storageUsedMB: "storageUsedMB",
		storageLimitMB: "storageLimitMB",
		resetDate: "resetDate",
	},
};

const service = async (data: any) => {
	const params = validateSpec(spec, data);

	const stats = await getUserUsageStats(params.userId);

	const startOfMonth = new Date();
	startOfMonth.setDate(1);
	startOfMonth.setHours(0, 0, 0, 0);

	// Calculate reset date (1st of next month)
	const resetDate = new Date(startOfMonth);
	resetDate.setMonth(resetDate.getMonth() + 1);

	// Return directly mapped fields for UsageIndicator
	return {
		computeUnitsUsed: stats.computeUnitsUsed,
		computeUnitsLimit: stats.computeUnitsLimit,
		storageUsedMB: stats.storageUsedMB,
		storageLimitMB: stats.storageLimitMB,
		resetDate: resetDate.toISOString(),
	};
};

export const fetchUsageService = service;
