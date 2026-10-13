import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

/**
 * Shared Vitest configuration. The test projects (unit / dom / samples) are
 * declared in vitest.workspace.ts and extend this file.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    coverage: {
      provider: "v8",
      include: ["apps/lab/src/**/*.{ts,tsx}"],
      exclude: [
        "apps/lab/src/main.tsx",
        "apps/lab/src/vite-env.d.ts",
        // Vite-only `?worker&url` import, mocked in tests.
        "apps/lab/src/audio/sampleCaptureWorkletUrl.ts",
      ],
      reporter: ["text-summary", "text", "html", "lcov"],
      // Enforced on `npm run coverage` (unit + dom projects). Set just below
      // the measured values; raise them when coverage improves. The global
      // figures include the components and App.tsx (UI, partly untested);
      // the per-area ones guard the DSP, audio and hook layers.
      thresholds: {
        lines: 86,
        statements: 86,
        functions: 93,
        branches: 92,
        "apps/lab/src/analysis/*.ts": { lines: 99, functions: 100, branches: 97 },
        "apps/lab/src/analysis/engine/**": { lines: 99, functions: 100, branches: 96 },
        "apps/lab/src/analysis/offline/**": { lines: 99, functions: 100, branches: 93 },
        "apps/lab/src/audio/**": { lines: 99, functions: 100, branches: 92 },
        "apps/lab/src/hooks/**": { lines: 99, functions: 100, branches: 98 },
      },
    },
  },
});
