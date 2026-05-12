import { createElysiaApp } from "../elysia";

export const getApp = async () => {
	const app = await createElysiaApp();
	return app;
};

export const setupAuth = async (app: any) => {
	const prefix = `test-${crypto.randomUUID()}`;
	const email = `${prefix}@example.com`;
	const password = "ValidPassword123!";

	// Signup
	const signupRes = await app.handle(
		req.post("/api/v1/auth/signup", { email, password }),
	);

	const cookieHeader = signupRes.headers.get("set-cookie") || "";
	const cookie = cookieHeader;

	// Extract token for Authorization header
	const tokenMatch = cookieHeader.match(/accessToken=([^;]+)/);
	const token = tokenMatch ? tokenMatch[1] : "";

	// Parse body to get ID if needed
	const body = await parseRes(signupRes);

	return {
		email,
		password,
		cookie,
		token,
		authHeader: { Authorization: `Bearer ${token}` },
		userId: body.data?.id,
	};
};

export const req = {
	get: (path: string, headers: Record<string, string> = {}) =>
		new Request(`http://localhost${path}`, {
			method: "GET",
			headers,
		}),
	post: (path: string, body: any, headers: Record<string, string> = {}) =>
		new Request(`http://localhost${path}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...headers,
			},
			body: JSON.stringify(body),
		}),
	put: (path: string, body: any, headers: Record<string, string> = {}) =>
		new Request(`http://localhost${path}`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
				...headers,
			},
			body: JSON.stringify(body),
		}),
	patch: (path: string, body: any, headers: Record<string, string> = {}) =>
		new Request(`http://localhost${path}`, {
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
				...headers,
			},
			body: JSON.stringify(body),
		}),
	delete: (
		path: string,
		bodyOrHeaders: any = {},
		headers: Record<string, string> = {},
	) => {
		const isBody =
			typeof bodyOrHeaders === "object" &&
			!bodyOrHeaders.Authorization &&
			!bodyOrHeaders.Cookie &&
			Object.keys(bodyOrHeaders).length > 0;

		const finalHeaders = isBody ? headers : bodyOrHeaders;
		const finalBody = isBody ? JSON.stringify(bodyOrHeaders) : undefined;

		return new Request(`http://localhost${path}`, {
			method: "DELETE",
			headers: {
				...(isBody ? { "Content-Type": "application/json" } : {}),
				...finalHeaders,
			},
			body: finalBody,
		});
	},
};

export const parseRes = async (res: Response) => {
	const contentType = res.headers.get("content-type");
	// console.log(`[parseRes] Content-Type: ${contentType}`);
	const text = await res.text();
	try {
		const json = JSON.parse(text);
		if (typeof json === "string") {
			return JSON.parse(json);
		}
		return json;
	} catch (e) {
		return text;
	}
};
