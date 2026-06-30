import Joi from "joi";
import { deleteUserById } from "../../../../../packages/models/src/users.model.ts";
import {
	ForbiddenError,
	NotFoundError,
} from "../../../../../packages/utils/src/error.util.ts";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";
import prisma from "../../../../../packages/config/src/db.config.ts";

const spec = Joi.object({
	target_user_id: Joi.string().uuid().required(),
});

const aliasSpec = {
	request: { targetUserId: "target_user_id" },
	response: {},
};

export const deleteUserService = async (
	adminUser: { user_id: string; role: string },
	targetUserId: string,
) => {
	const params = validateSpec(spec, aliaserSpec(aliasSpec.request, { targetUserId }));

	if (params.target_user_id === adminUser.user_id) {
		throw new ForbiddenError("You cannot delete your own account via admin");
	}

	const target = await prisma.users.findUnique({
		where: { user_id: params.target_user_id },
		select: { role: true },
	});

	if (!target) throw new NotFoundError("User not found");

	if (target.role === "SUPER_ADMIN" && adminUser.role !== "SUPER_ADMIN") {
		throw new ForbiddenError("Only a super admin can delete super admin accounts");
	}

	await deleteUserById(params.target_user_id);

	return aliaserSpec(aliasSpec.response, { deleted: true });
};
