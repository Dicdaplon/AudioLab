import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  // Relative asset URLs so the build works from any sub-path (e.g. GitHub Pages).
  base: "./",
  plugins: [react()],
  resolve: {
    // In development the SDK packages resolve to their TypeScript sources
    // (no package build needed); the production build consumes their dist,
    // exactly like an external consumer.
    conditions: mode === "production" ? [] : ["audiolab-source"],
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
    open: true,
  },
}));
