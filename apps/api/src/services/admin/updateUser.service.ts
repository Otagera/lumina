import Joi from "joi";
import prisma from "../../../../../packages/config/src/db.config.ts";
import {
	ForbiddenError,
	NotFoundError,
} from "../../../../../packages/utils/src/error.util.ts";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";

const spec = Joi.object({
	target_user_id: Joi.string().uuid().required(),
	role: Joi.string().valid("USER", "ADMIN", "SUPER_ADMIN").optional(),
	plan_id: Joi.string().uuid().optional(),
	suspend: Joi.boolean().optional(),
});

const aliasSpec = {
	request: { targetUserId: "target_user_id", planId: "plan_id" },
	response: {},
};

export const updateUserService = async (
	adminUser: { user_id: string; role: string },
	targetUserId: string,
	updates: { role?: string; planId?: string; suspend?: boolean },
) => {
	const params = validateSpec(
		spec,
		aliaserSpec(aliasSpec.request, { targetUserId, ...updates }),
	);

	if (params.target_user_id === adminUser.user_id) {
		throw new ForbiddenError("You cannot modify your own account via admin");
	}

	const target = await prisma.users.findUnique({
		where: { user_id: params.target_user_id },
		select: { user_id: true, role: true, suspended_at: true },
	});

	if (!target) throw new NotFoundError("User not found");

	if (
		(target.role === "SUPER_ADMIN" || params.role === "SUPER_ADMIN") &&
		adminUser.role !== "SUPER_ADMIN"
	) {
		throw new ForbiddenError("Only a super admin can modify super admin accounts");
	}

	const data: Record<string, unknown> = {};

	if (params.role !== undefined) data.role = params.role;

	if (params.plan_id !== undefined) {
		const plan = await prisma.plans.findUnique({ where: { id: params.plan_id } });
		if (!plan) throw new NotFoundError("Plan not found");
		data.plan_id = params.plan_id;
		data.plan_name = plan.name;
	}

	if (params.suspend !== undefined) {
		data.suspended_at = params.suspend ? new Date() : null;
	}

	return aliaserSpec(aliasSpec.response, await prisma.users.update({
		where: { user_id: params.target_user_id },
		data,
		select: {
			user_id: true,
			email: true,
			role: true,
			plan_name: true,
			suspended_at: true,
		},
	}));
};
