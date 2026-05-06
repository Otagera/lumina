import { edenTreaty } from "@elysiajs/eden";

// Use relative path to go through Vite proxy
// Vite proxy maps /api -> http://localhost:3005
const API_BASE_URL = "";

export const eden = edenTreaty(API_BASE_URL, {
  fetch: (url, options) => {
    return fetch(url, {
      ...options,
      credentials: "include",
    });
  },
});

export const api = eden.api.v1;