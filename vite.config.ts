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
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/main.tsx",
        "src/vite-env.d.ts",
        // Vite-only `?worker&url` import, mocked in tests.
        "src/audio/sampleCaptureWorkletUrl.ts",
      ],
      reporter: ["text-summary", "text", "html", "lcov"],
      // Enforced on `npm run coverage` (unit + dom projects). Set just below
      // the measured values; raise them when coverage improves.
      thresholds: {
        lines: 83,
        statements: 83,
        functions: 92,
        branches: 91,
        "src/analysis/*.ts": { lines: 98, functions: 100, branches: 96 },
        "src/analysis/engine/**": { lines: 98, functions: 95, branches: 95 },
        "src/audio/**": { lines: 98, functions: 100, branches: 90 },
        "src/hooks/**": { lines: 97, functions: 100, branches: 94 },
      },
    },
  },
});
