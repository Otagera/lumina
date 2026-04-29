import crypto from "node:crypto";
import { Elysia } from "elysia";

export const guestPlugin = new Elysia({ name: "guest-plugin" }).derive(
	{ as: "global" },
	({ cookie: { guestSessionId } }) => {
		if (!guestSessionId.value) {
			const newId = crypto.randomUUID();
			guestSessionId.set({
				value: newId,
				httpOnly: true,
				secure: true,
				sameSite: "lax",
				path: "/",
				maxAge: 365 * 24 * 60 * 60, // 1 year
			});
		}

		return {
			guestSessionId: guestSessionId.value,
		};
	},
);
