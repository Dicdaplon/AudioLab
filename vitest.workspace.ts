import { defineWorkspace } from "vitest/config";

/**
 * Three test projects sharing vite.config.ts:
 *
 * - unit:    pure TypeScript tests (`*.test.ts`) in Node. Files that need a
 *            DOM opt in with a `// @vitest-environment jsdom` docblock.
 * - dom:     React / jsdom tests (`*.test.tsx`).
 * - samples: decodes the real audio fixtures in tests/Sample (slow, ~10 s).
 *
 * `npm test` runs unit + dom; `npm run test:samples` runs the fixtures.
 */
export default defineWorkspace([
  {
    extends: "./vite.config.ts",
    test: {
      name: "unit",
      environment: "node",
      include: ["tests/**/*.test.ts"],
      exclude: ["tests/samples/**"],
    },
  },
  {
    extends: "./vite.config.ts",
    test: {
      name: "dom",
      environment: "jsdom",
      include: ["tests/**/*.test.tsx"],
      setupFiles: ["tests/setup/dom.ts"],
    },
  },
  {
    extends: "./vite.config.ts",
    test: {
      name: "samples",
      environment: "node",
      include: ["tests/samples/**/*.test.ts"],
      testTimeout: 60_000,
      hookTimeout: 60_000,
    },
  },
]);
