import { defineWorkspace } from "vitest/config";

/**
 * Three test projects sharing vitest.config.ts:
 *
 * - unit:    pure TypeScript tests (`*.test.ts`) in Node. Files that need a
 *            DOM opt in with a `// @vitest-environment jsdom` docblock.
 * - dom:     React / jsdom tests (`*.test.tsx`).
 * - samples: decodes the real audio fixtures in packages/core/tests/Sample
 *            (slow, ~10 s).
 *
 * `npm test` runs unit + dom; `npm run test:samples` runs the fixtures.
 */
const TESTS = ["packages/*/tests", "apps/*/tests"];

export default defineWorkspace([
  {
    extends: "./vitest.config.ts",
    test: {
      name: "unit",
      environment: "node",
      include: TESTS.map((dir) => `${dir}/**/*.test.ts`),
      exclude: ["**/node_modules/**", "packages/core/tests/samples/**"],
    },
  },
  {
    extends: "./vitest.config.ts",
    test: {
      name: "dom",
      environment: "jsdom",
      include: TESTS.map((dir) => `${dir}/**/*.test.tsx`),
      setupFiles: ["apps/lab/tests/setup/dom.ts"],
    },
  },
  {
    extends: "./vitest.config.ts",
    test: {
      name: "samples",
      environment: "node",
      include: ["packages/core/tests/samples/**/*.test.ts"],
      testTimeout: 60_000,
      hookTimeout: 60_000,
    },
  },
]);
