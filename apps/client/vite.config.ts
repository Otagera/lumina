import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import tsconfigPaths from "vite-tsconfig-paths";

const target = process.env.API_TARGET || "http://localhost:3005";

export default defineConfig({
	define: {
		"import.meta.env.VITE_API_URL": JSON.stringify(
			process.env.VITE_API_URL || ""
		),
		"import.meta.env.VITE_CLIENT_URL": JSON.stringify(
			process.env.VITE_CLIENT_URL || ""
		),
		"import.meta.env.VITE_SENTRY_DSN": JSON.stringify(
			process.env.VITE_SENTRY_DSN || ""
		),
	},
	plugins: [
		react(),
		tsconfigPaths(),
		VitePWA({
			registerType: "autoUpdate",
			includeAssets: ["icons/icon-192.svg", "icons/icon-512.svg"],
			manifest: false,
			workbox: {
				globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
				runtimeCaching: [
					{
						urlPattern: /\/api\/v1\/public\/albums\/.*/,
						handler: "NetworkFirst",
						options: {
							cacheName: "album-api-cache",
							networkTimeoutSeconds: 3,
							expiration: {
								maxEntries: 40,
								maxAgeSeconds: 60 * 60,
							},
							cacheableResponse: {
								statuses: [0, 200],
							},
						},
					},
				],
			},
		}),
	],
	test: {
		globals: true,
		environment: "jsdom",
		setupFiles: ["./app/test/setup.ts"],
		include: ["app/**/*.{test,spec}.{ts,tsx}"],
	},
	server: {
		host: true,
		port: 5173,
		proxy: {
			"/api": { target, changeOrigin: true, secure: false },
		},
		allowedHosts: true,
	},
	preview: {
		host: true,
		port: 4173,
		proxy: {
			"/api": { target, changeOrigin: true, secure: false },
		},
	},
});
