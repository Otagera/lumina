import { removeRefreshToken } from "../models/src/refreshTokens.lib.ts";

export const logoutService = async (token?: string) => {
	if (token) {
		try {
			await removeRefreshToken({ token });
		} catch (e) {
			// ignore if it's already deleted or not found
			console.error("Logout Error: failed to remove refresh token", e);
		}
	}
	return true;
};
