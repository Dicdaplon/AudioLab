/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Relative asset URLs so the build works from any sub-path (e.g. GitHub Pages).
  base: "./",
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    open: true,
  },
  // Test projects (unit / dom / samples) are declared in vitest.workspace.ts.
  test: {
    coverage: {
      reporter: ["text", "html"],
    },
  },
});
