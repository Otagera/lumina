import jwt from "jsonwebtoken";
import config from "../config/src/index.config.ts";
import {
	createRefreshToken,
	getRefreshToken,
	removeRefreshToken,
} from "../models/src/refreshTokens.lib.ts";
import { createUserAuthToken } from "../utils/src/auth.util.ts";
import { AuthError } from "../utils/src/error.util.ts";

export const refreshService = async (token: string) => {
	if (!token) {
		throw new AuthError("Refresh token required");
	}

	const existingToken = await getRefreshToken({ token });
	if (!existingToken) {
		throw new AuthError("Invalid refresh token");
	}

	if (new Date() > new Date(existingToken.expires_at)) {
		await removeRefreshToken({ token });
		throw new AuthError("Refresh token expired");
	}

	try {
		const decoded = jwt.verify(token, config[config.env].secret) as any;
		if (
			decoded.type !== "refresh" ||
			decoded.userId !== existingToken.user_id
		) {
			throw new AuthError("Invalid refresh token payload");
		}
	} catch (e) {
		await removeRefreshToken({ token });
		throw new AuthError("Invalid refresh token signature");
	}

	// Token is valid. Rotate it.
	await removeRefreshToken({ token });

	const { accessToken, refreshToken } = await createUserAuthToken(
		existingToken.user_id,
	);

	await createRefreshToken({
		token: refreshToken,
		user_id: existingToken.user_id,
		expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
	});

	return { accessToken, refreshToken };
};
