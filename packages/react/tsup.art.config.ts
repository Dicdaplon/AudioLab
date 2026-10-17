import { defineConfig } from "tsup";

/**
 * `@audiolab/react/art`: pure data, built after the main config (which
 * cleans dist/) and without its "use client" banner, so a server component
 * can import the paths as plain values.
 */
export default defineConfig({
  entry: { art: "src/art.ts" },
  format: ["esm"],
  target: "es2022",
  dts: true,
  sourcemap: true,
  clean: false,
});
