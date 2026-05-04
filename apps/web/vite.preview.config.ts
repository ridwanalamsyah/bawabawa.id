// Temporary Vite config for Devin preview sessions.
// Adds a dev-server proxy so the web app can reach the API without CORS or
// double basic-auth when the ports are exposed behind tunnels.
import base from "./vite.config";
import { defineConfig, mergeConfig } from "vite";

export default mergeConfig(
  base,
  defineConfig({
    server: {
      host: "0.0.0.0",
      port: 5173,
      strictPort: true,
      allowedHosts: true,
      proxy: {
        "/api": {
          target: "http://127.0.0.1:3000",
          changeOrigin: true
        },
        "/sitemap.xml": {
          target: "http://127.0.0.1:3000",
          changeOrigin: true
        },
        "/robots.txt": {
          target: "http://127.0.0.1:3000",
          changeOrigin: true
        }
      }
    }
  })
);
