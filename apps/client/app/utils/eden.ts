import { edenTreaty } from "@elysiajs/eden";

const API_BASE_URL = import.meta.env.DEV ? "" : import.meta.env.VITE_API_URL || "";

export const eden = edenTreaty<any>(API_BASE_URL, {
	$fetch: {
		credentials: "include",
	},
});

export const api = (eden as any).api.v1;
