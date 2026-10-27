import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

/** Imports @audiolab/core never makes (React, Node built-ins). */
const CORE_PATTERNS = [
  { group: ["react", "react-dom", "react/*", "react-dom/*"], message: "core is React-free" },
  { group: ["node:*"], message: "Node built-ins belong to the offline subpath" },
];

export default tseslint.config(
  { ignores: ["**/dist", "**/coverage", "node_modules", ".claude"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    files: [
      "**/scripts/**/*.ts",
      "**/bench/**/*.ts",
      "**/poc/**/*.ts",
      "**/tests/**/*.ts",
      "**/*.config.ts",
      "vitest.workspace.ts",
    ],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    // @audiolab/core is framework-free: no React, and no Node built-ins
    // outside the `offline` subpath (browser bundles must stay clean). The
    // main entry never imports the `rhythm` subpath (rhythm may use pure
    // core modules, not the other way round).
    files: ["packages/core/src/**/*.ts"],
    ignores: ["packages/core/src/offline/**", "packages/core/src/rhythm/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            ...CORE_PATTERNS,
            {
              group: ["**/rhythm", "**/rhythm/*", "./rhythm", "./rhythm/*"],
              message: "the main entry must not import the rhythm subpath",
            },
          ],
        },
      ],
    },
  },
  {
    // The analysis layer is the bottom of core: pure DSP and engines, no Web
    // Audio adapters, no game or rhythm logic. It may read the shared
    // defaults of config/ (TonalityEngine's defaults come from there).
    files: ["packages/core/src/analysis/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            ...CORE_PATTERNS,
            {
              group: ["**/audio", "**/audio/*", "**/games", "**/games/*"],
              message: "analysis/ must not import the Web Audio adapters or the games",
            },
            {
              group: ["**/rhythm", "**/rhythm/*"],
              message: "analysis/ must not import the rhythm subpath",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["packages/core/src/rhythm/**/*.ts"],
    rules: { "no-restricted-imports": ["error", { patterns: CORE_PATTERNS }] },
  },
  prettier,
);
