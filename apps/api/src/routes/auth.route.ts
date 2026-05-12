import { Elysia, t } from "elysia";
import {
	forgotPasswordService,
	loginService,
	logoutService,
	refreshService,
	signupService,
} from "../../../../packages/auth/index.ts";
import config from "../../../../packages/config/src/index.config.ts";
import { HTTP_STATUS_CODES } from "../../../../packages/utils/src/constants.util.ts";
import { getMeService } from "../services/auth/getMe.service.ts";
import { unsubscribeService } from "../services/auth/unsubscribe.service.ts";
import { strictPublicRateLimit } from "./middleware/rate-limit.plugin.ts";

const unsubscribeRoutes = new Elysia({ prefix: "/unsubscribe" }).post(
	"/",
	async ({ body, set }) => {
		try {
			const data = await unsubscribeService(body);
			return data;
		} catch (error: any) {
			set.status = HTTP_STATUS_CODES.BAD_REQUEST;
			return {
				status: "error",
				message: error.message || "Failed to unsubscribe",
			};
		}
	},
	{
		body: t.Object({
			email: t.String(),
			type: t.Optional(t.String()),
		}),
	},
);

const authRoutes = new Elysia({ prefix: "/auth" })
	.group("", (app) =>
		app
			.use(strictPublicRateLimit)
			.post(
				"/signup",
				async ({ body, set, cookie: { accessToken, refreshToken } }) => {
					try {
						const data = await signupService({
							...body,
						});

						accessToken.set({
							value: data.accessToken,
							httpOnly: true,
							secure: config.env === "production",
							sameSite: "lax",
							path: "/",
							maxAge: 24 * 60 * 60, // 24 hours
						});

						refreshToken.set({
							value: data.refreshToken,
							httpOnly: true,
							secure: config.env === "production",
							sameSite: "lax",
							path: "/",
							maxAge: 30 * 24 * 60 * 60, // 30 days
						});

						set.status = HTTP_STATUS_CODES.CREATED;
						return {
							status: "completed",
							message: "User signed up successfully.",
							data: {
								id: data.id,
								email: data.email,
							},
						};
					} catch (error) {
						set.status = error?.statusCode || HTTP_STATUS_CODES.BAD_REQUEST;
						return {
							status: "error",
							message: error?.message || "Internal server error",
							data: null,
						};
					}
				},
				{
					body: t.Object({
						email: t.String(),
						password: t.String(),
					}),
				},
			)
			.post(
				"/login",
				async ({ body, set, cookie: { accessToken, refreshToken } }) => {
					try {
						const data = await loginService(body);

						accessToken.set({
							value: data.accessToken,
							httpOnly: true,
							secure: config.env === "production",
							sameSite: "lax",
							path: "/",
							maxAge: 24 * 60 * 60,
						});

						refreshToken.set({
							value: data.refreshToken,
							httpOnly: true,
							secure: config.env === "production",
							sameSite: "lax",
							path: "/",
							maxAge: 30 * 24 * 60 * 60,
						});

						set.status = HTTP_STATUS_CODES.OK;
						return {
							status: "completed",
							message: "User logged in successfully.",
							data: {
								id: data.id,
								email: data.email,
							},
						};
					} catch (error) {
						set.status = error?.statusCode || HTTP_STATUS_CODES.UNAUTHORIZED;
						return {
							status: "error",
							message: error?.message || "Internal server error",
							data: null,
						};
					}
				},
				{
					body: t.Object({
						email: t.String(),
						password: t.String(),
					}),
				},
			)
			.post(
				"/forgot-password",
				async ({ body: { email }, set }) => {
					try {
						await forgotPasswordService(email);
						return {
							status: "completed",
							message: "If an account exists, a reset link has been sent.",
						};
					} catch (error: any) {
						set.status = HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
						return {
							status: "error",
							message: "Failed to process request",
						};
					}
				},
				{
					body: t.Object({
						email: t.String(),
					}),
				},
			)
			.post(
				"/reset-password",
				async ({ body, set }) => {
					try {
						await resetPasswordService(body);
						return {
							status: "completed",
							message: "Password reset successfully",
						};
					} catch (error: any) {
						set.status = error?.statusCode || HTTP_STATUS_CODES.BAD_REQUEST;
						return {
							status: "error",
							message: error?.message || "Failed to reset password",
						};
					}
				},
				{
					body: t.Object({
						token: t.String(),
						password: t.String(),
					}),
				},
			),
	)
	.post("/logout", async ({ cookie: { accessToken, refreshToken } }) => {
		await logoutService(refreshToken.value);
		accessToken.remove();
		refreshToken.remove();
		return {
			status: "completed",
			message: "Logged out successfully",
		};
	})
	.post("/refresh", async ({ set, cookie: { accessToken, refreshToken } }) => {
		try {
			if (!refreshToken.value) {
				set.status = HTTP_STATUS_CODES.UNAUTHORIZED;
				return { status: "error", message: "Refresh token missing" };
			}

			const data = await refreshService(refreshToken.value);

			accessToken.set({
				value: data.accessToken,
				httpOnly: true,
				secure: config.env === "production",
				sameSite: "lax",
				path: "/",
				maxAge: 24 * 60 * 60,
			});

			refreshToken.set({
				value: data.refreshToken,
				httpOnly: true,
				secure: config.env === "production",
				sameSite: "lax",
				path: "/",
				maxAge: 30 * 24 * 60 * 60,
			});

			return {
				status: "completed",
				message: "Token refreshed successfully",
			};
		} catch (error: any) {
			set.status = error?.statusCode || HTTP_STATUS_CODES.UNAUTHORIZED;
			return {
				status: "error",
				message: error?.message || "Invalid refresh token",
			};
		}
	})
	.get(
		"/me",
		async ({ cookie: { accessToken }, set }) => {
			if (!accessToken.value) {
				set.status = HTTP_STATUS_CODES.UNAUTHORIZED;
				return { status: "error", message: "Not authenticated" };
			}

			try {
				const data = await getMeService(accessToken.value);

				set.status = HTTP_STATUS_CODES.OK;
				return {
					status: "completed",
					message: "User fetched successfully.",
					data,
				};
			} catch (error: any) {
				set.status = error?.statusCode || HTTP_STATUS_CODES.UNAUTHORIZED;
				return {
					status: "error",
					message: error?.message || "Invalid token",
				};
			}
		},
		{
			detail: {
				summary: "Get current user",
				description: "Returns the authenticated user's details",
			},
		},
	);

export { authRoutes, unsubscribeRoutes };
export default authRoutes;
