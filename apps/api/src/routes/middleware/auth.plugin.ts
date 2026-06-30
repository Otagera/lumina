import { Elysia } from "elysia";
import { verify } from "jsonwebtoken";
import config from "../../../../../packages/config/src/index.config.ts";
import { getUser } from "../../../../../packages/models/src/users.lib.ts";
import { HTTP_STATUS_CODES } from "../../../../../packages/utils/src/constants.util.ts";
import { AuthError } from "../../../../../packages/utils/src/error.util.ts";

export const authDerivation = async ({
	headers,
	cookie: { accessToken },
	set,
}) => {
	let token = headers.authorization;

	if (token && token.startsWith("Bearer ")) {
		token = token.split(" ")[1];
	} else if (accessToken && accessToken.value) {
		token = accessToken.value;
	}

	if (!token) {
		set.status = HTTP_STATUS_CODES.UNAUTHORIZED;
		throw new AuthError("Unauthorized request, please login");
	}

	try {
		const env = config.env || "development";
		const secret = config[env].secret;
		const decoded = verify(token, secret) as any;

		const userId = decoded.userId;
		if (!userId) {
			throw new AuthError("Unauthorized: Invalid token payload");
		}

		const validUser = await getUser({ user_id: userId });

		if (!validUser) {
			throw new AuthError("Invalid User");
		}

		if (validUser.suspended_at) {
			throw new AuthError("Account has been suspended");
		}

		return {
			user: validUser,
			userId: userId,
		};
	} catch (error: any) {
		if (error instanceof AuthError) {
			throw error;
		}

		if (
			error.name === "JsonWebTokenError" ||
			error.name === "TokenExpiredError"
		) {
			throw new AuthError("Unauthorized: Invalid or expired token");
		}

		throw new AuthError("Unauthorized request, please provide a valid token.");
	}
};

export const authPlugin = new Elysia({ name: "auth-plugin" })
	.error({
		AUTH_ERROR: AuthError,
	})
	.onError(({ code, error, set }) => {
		if (code === "AUTH_ERROR") {
			set.status = HTTP_STATUS_CODES.UNAUTHORIZED;
			return {
				status: "error",
				message: error.message,
				data: null,
			};
		}
	})
	.derive(authDerivation);
