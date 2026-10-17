import { defineConfig } from "tsup";

import { buildInfoDefine } from "../../scripts/buildInfo";

/**
 * Three ESM entries with declarations:
 *
 * - `index`   the browser-safe API (DSP, engines, Web Audio adapters);
 * - `games`   the pure game engines (`@audiolab/core/games`);
 * - `offline` the Node-only file pipeline (`@audiolab/core/offline`), kept
 *             apart so a browser bundle never pulls `node:fs` or `audio-decode`.
 *
 * Dependencies and peer dependencies are left external by tsup. `define`
 * stamps the version and commit into `BUILD_INFO`.
 */
export default defineConfig({
  entry: {
    index: "src/index.ts",
    "games/index": "src/games/index.ts",
    "offline/index": "src/offline/index.ts",
  },
  format: ["esm"],
  target: "es2022",
  dts: true,
  sourcemap: true,
  splitting: true,
  treeshake: true,
  clean: true,
  define: buildInfoDefine("package.json"),
});
