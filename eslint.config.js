import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["**/node_modules/**", "**/dist/**", "**/.next/**", "**/src/generated/**", "**/next-env.d.ts"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      /* Text must never become markup: the packages build DOM with textContent only. */
      "no-restricted-properties": [
        "error",
        { property: "innerHTML", message: "Use textContent. Event data must never become markup." },
        { property: "outerHTML", message: "Use textContent. Event data must never become markup." },
        { property: "insertAdjacentHTML", message: "Use textContent. Event data must never become markup." },
      ],
    },
  },
);
