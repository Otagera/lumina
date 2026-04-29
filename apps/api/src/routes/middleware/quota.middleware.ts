import {
	getUserPlanLimits,
	getUserUsage,
} from "../../../../../packages/models/src/usage.model.ts";
import { HTTP_STATUS_CODES } from "../../../../../packages/utils/src/constants.util.ts";

export const checkQuota = async ({
	userId,
	set,
}: {
	userId?: string;
	set: any;
}) => {
	if (!userId) return;

	const startOfMonth = new Date();
	startOfMonth.setDate(1);
	startOfMonth.setHours(0, 0, 0, 0);

	const { computeLimit } = await getUserPlanLimits(userId);

	// -1 means unlimited
	if (computeLimit === -1) return;

	const usage = await getUserUsage(userId, "compute", startOfMonth);

	if (usage >= computeLimit) {
		set.status = 402; // Payment Required
		return {
			status: "error",
			message: `Monthly compute limit reached (${computeLimit} images). Please upgrade your plan.`,
			data: null,
		};
	}
};
