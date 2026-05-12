import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const target = process.env.API_TARGET || "http://localhost:3005";

export default defineConfig({
  plugins: [react(), tailwindcss(), tsconfigPaths()],
  server: {
    host: true,
    port: 5174,
    proxy: {
      "/api": {
        target: target,
        changeOrigin: true,
        secure: false,
      },
    },
    allowedHosts: true,
  },
});
