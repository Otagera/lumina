import { edenTreaty } from "@elysiajs/eden";
import type { App } from "../../../api/src/elysia";

const API_BASE_URL = import.meta.env.VITE_API_URL || window.location.origin;

// Create the type-safe Eden client
export const eden = edenTreaty<App>(API_BASE_URL);

// Helper for type-safe API calls with common configuration
export const api = eden.api.v1;
