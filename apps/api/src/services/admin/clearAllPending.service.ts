import Joi from "joi";
import prisma from "../../../../../packages/config/src/db.config.ts";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";

const spec = Joi.object({
	status: Joi.string().valid("REJECTED").default("REJECTED"),
});

const aliasSpec = {
	request: {},
	response: { count: "count", status: "status" },
};

export const clearAllPendingService = async () => {
	validateSpec(spec, aliaserSpec(aliasSpec.request, { status: "REJECTED" }));

	const result = await prisma.images.updateMany({
		where: { status: "PENDING", deleted_at: null },
		data: { status: "REJECTED" },
	});

	return aliaserSpec(aliasSpec.response, { count: result.count, status: "REJECTED" });
};
