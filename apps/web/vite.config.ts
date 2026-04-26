import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("@tiptap") || id.includes("prosemirror")) return "vendor-tiptap";
          if (id.includes("framer-motion")) return "vendor-motion";
          if (id.includes("react-router")) return "vendor-router";
          if (id.includes("@reduxjs/toolkit") || id.includes("react-redux")) return "vendor-redux";
          if (id.includes("react-hook-form")) return "vendor-forms";
          if (id.includes("react-helmet-async")) return "vendor-helmet";
          if (id.includes("axios")) return "vendor-axios";
          if (id.includes("sonner")) return "vendor-sonner";
          if (id.includes("react-dom") || id.includes("/react/") || id.endsWith("/react")) return "vendor-react";
          return "vendor";
        }
      }
    }
  }
});
