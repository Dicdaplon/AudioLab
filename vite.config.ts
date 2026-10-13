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
      // the measured values; raise them when coverage improves. The global
      // figures include src/components and App.tsx (UI, partly untested);
      // the per-area ones guard the DSP, audio and hook layers.
      thresholds: {
        lines: 86,
        statements: 86,
        functions: 93,
        branches: 92,
        "src/analysis/*.ts": { lines: 99, functions: 100, branches: 97 },
        "src/analysis/engine/**": { lines: 99, functions: 100, branches: 96 },
        "src/analysis/offline/**": { lines: 99, functions: 100, branches: 93 },
        "src/audio/**": { lines: 99, functions: 100, branches: 92 },
        "src/hooks/**": { lines: 99, functions: 100, branches: 98 },
      },
    },
  },
});
