import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

/**
 * Shared Vitest configuration. The test projects (unit / dom / samples) are
 * declared in vitest.workspace.ts and extend this file.
 *
 * Workspace packages resolve to their TypeScript sources through the
 * `audiolab-source` export condition, so tests never need a package build.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    conditions: ["audiolab-source"],
  },
  test: {
    coverage: {
      provider: "v8",
      include: ["packages/*/src/**/*.{ts,tsx}", "apps/lab/src/**/*.{ts,tsx}"],
      exclude: [
        "apps/lab/src/main.tsx",
        "apps/lab/src/vite-env.d.ts",
        // Re-export barrels and the generated worklet string.
        "packages/*/src/index.ts",
        "packages/core/src/offline/index.ts",
        "packages/core/src/games/index.ts",
        "packages/core/src/audio/sampleCaptureWorklet.source.ts",
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
        "packages/core/src/analysis/*.ts": { lines: 99, functions: 100, branches: 97 },
        "packages/core/src/analysis/engine/**": { lines: 99, functions: 100, branches: 96 },
        "packages/core/src/offline/**": { lines: 99, functions: 100, branches: 93 },
        "packages/core/src/audio/**": { lines: 99, functions: 100, branches: 92 },
        "packages/react/src/hooks/**": { lines: 99, functions: 100, branches: 98 },
      },
    },
  },
});
