import { edenTreaty } from "@elysiajs/eden";

// Use relative path to go through Vite proxy
const API_BASE_URL = "";

export const eden = edenTreaty<any>(API_BASE_URL, {
	$fetch: {
		credentials: "include",
	},
});

export const api = (eden as any).api.v1;
