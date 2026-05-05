import Joi from "joi";
import prisma from "../../../../../packages/config/src/db.config.ts";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";

const spec = Joi.object({
	email: Joi.string().email().required(),
	type: Joi.string()
		.valid("welcome", "photoApproved", "clustering", "marketing")
		.optional(),
});

const aliasSpec = {
	request: {},
	response: { status: "status", message: "message" },
};

const service = async (data: any) => {
	const params = validateSpec(spec, data);

	if (!params.email) {
		throw new Error("Email is required");
	}

	const user = await prisma.users.findUnique({
		where: { email: params.email },
		select: { email_preferences: true },
	});

	if (!user) {
		return {
			status: "completed",
			message: "If this email exists, unsubscribed successfully.",
		};
	}

	const current = (user.email_preferences as any) || {};
	const allTypes = ["welcome", "photoApproved", "clustering", "marketing"];

	if (params.type && allTypes.includes(params.type)) {
		current[params.type] = false;
	} else {
		allTypes.forEach((t) => (current[t] = false));
	}

	await prisma.users.update({
		where: { email: params.email },
		data: { email_preferences: current as any },
	});

	return { status: "completed", message: "Unsubscribed successfully." };
};

export const unsubscribeService = service;
