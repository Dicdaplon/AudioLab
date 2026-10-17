import { defineConfig } from "tsup";

import { buildInfoDefine } from "../../scripts/buildInfo";

/**
 * One ESM bundle with declarations, plus the two stylesheets.
 *
 * - Every module in this package is a client module; bundling drops the
 *   per-file directives, so the banner puts `"use client"` back at the top of
 *   the output (what Next.js App Router reads).
 * - `styles.css` is the Loupe tokens and component styles, bundled from the
 *   partials in src/styles. `fonts.css` keeps its `@fontsource` imports
 *   external: the consumer's bundler resolves them from the optional peer
 *   dependencies.
 * - react, react-dom and @audiolab/core stay external (peer/dependencies).
 */
export default defineConfig([
  {
    entry: { index: "src/index.ts" },
    format: ["esm"],
    target: "es2022",
    dts: true,
    sourcemap: true,
    clean: true,
    // No rollup `treeshake` pass here: it strips the directive again.
    banner: { js: '"use client";' },
    external: ["react/jsx-runtime"],
    define: buildInfoDefine("package.json"),
  },
  {
    entry: { styles: "src/styles/index.css", fonts: "src/styles/fonts.css" },
    format: ["esm"],
    external: [/^@fontsource\//],
  },
]);
