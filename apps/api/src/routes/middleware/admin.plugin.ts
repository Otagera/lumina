import { Elysia } from "elysia";
import { authDerivation } from "./auth.plugin.ts";
import { ForbiddenError } from "../../../../../packages/utils/src/error.util.ts";
import { HTTP_STATUS_CODES } from "../../../../../packages/utils/src/constants.util.ts";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

export const adminPlugin = new Elysia({ name: "admin-plugin" })
	.error({ FORBIDDEN_ERROR: ForbiddenError })
	.onError(({ code, error, set }) => {
		if (code === "FORBIDDEN_ERROR") {
			set.status = HTTP_STATUS_CODES.FORBIDDEN;
			return { status: "error", message: error.message, data: null };
		}
	})
	.derive(authDerivation)
	.derive(({ user }) => {
		if (!user || !ADMIN_ROLES.includes(user.role)) {
			throw new ForbiddenError("Admin access required");
		}
		return { adminUser: user };
	});
