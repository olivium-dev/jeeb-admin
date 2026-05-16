import tsEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default [
  {
    ignores: ["dist/**", "node_modules/**", "coverage/**"],
  },
  {
    files: ["src/**/*.{ts,tsx}", "vite.config.ts", "vitest.setup.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      "@typescript-eslint": tsEslint,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...tsEslint.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message:
            "T-qa-012 §6 — dangerouslySetInnerHTML is forbidden in jeeb-admin. Render escaped text or sanitise with DOMPurify in a reviewed helper.",
        },
        {
          selector:
            "JSXAttribute[name.name='href'] > Literal[value=/^\\s*javascript:/i]",
          message:
            "T-qa-012 §6 — javascript: URLs are forbidden. Use a button or a sanitised handler.",
        },
        {
          selector:
            "JSXAttribute[name.name='src'] > Literal[value=/^\\s*javascript:/i]",
          message:
            "T-qa-012 §6 — javascript: URLs are forbidden in src.",
        },
      ],
    },
  },
];
