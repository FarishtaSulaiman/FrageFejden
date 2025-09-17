// vite.config.ts
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react()],
    server: {
      proxy: {
        "/api": {
          target: env.VITE_API_BASE || "http://localhost:5000",
          changeOrigin: true,
          secure: false,
        },
        // WebSocket **only** on a narrow path:
        "/duel-ws": {
          target: "ws://localhost:3001",
          ws: true,
          changeOrigin: true,
        },
      },
    },
  };
});
