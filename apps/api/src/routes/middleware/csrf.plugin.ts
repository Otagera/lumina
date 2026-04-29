import crypto from "node:crypto";
import { Elysia } from "elysia";

const CSRF_HEADER_NAME = "x-csrf-token";

const SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];

const CSRF_PROTECTED_PATHS = [
	"/api/v1/auth/login",
	"/api/v1/auth/signup",
	"/api/v1/auth/forgot-password",
	"/api/v1/albums",
	"/api/v1/images",
	"/api/v1/settings",
	"/api/v1/trash",
];

export const csrfPlugin = new Elysia({ name: "csrf-plugin" }).onBeforeHandle(
	({ request, path, set, cookie }) => {
		const method = request.method.toUpperCase();

		if (SAFE_METHODS.includes(method)) {
			return;
		}

		const isProtectedPath = CSRF_PROTECTED_PATHS.some((p) => path.includes(p));
		if (!isProtectedPath) {
			return;
		}

		if (!cookie.csrfToken?.value) {
			cookie.csrfToken.set({
				value: crypto.randomBytes(32).toString("hex"),
				httpOnly: true,
				secure: true,
				sameSite: "strict",
				path: "/",
				maxAge: 24 * 60 * 60,
			});
		}

		const requestToken = request.headers.get(CSRF_HEADER_NAME);
		const cookieToken = cookie.csrfToken.value;

		if (!requestToken || requestToken !== cookieToken) {
			set.status = 403;
			return {
				status: "error",
				message: "Invalid CSRF token",
			};
		}
	},
);
