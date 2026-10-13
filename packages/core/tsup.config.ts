import { defineConfig } from "tsup";

/**
 * Two ESM entries with declarations:
 *
 * - `index`   the browser-safe API (DSP, engines, Web Audio adapters);
 * - `offline` the Node-only file pipeline (`@audiolab/core/offline`), kept
 *             apart so a browser bundle never pulls `node:fs` or `audio-decode`.
 *
 * Dependencies and peer dependencies are left external by tsup.
 */
export default defineConfig({
  entry: { index: "src/index.ts", "offline/index": "src/offline/index.ts" },
  format: ["esm"],
  target: "es2022",
  dts: true,
  sourcemap: true,
  splitting: true,
  treeshake: true,
  clean: true,
});
