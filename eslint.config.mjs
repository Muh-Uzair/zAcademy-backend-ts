import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
    languageOptions: {
      globals: { ...globals.browser, process: "readonly" },
    },
    rules: {
      "no-unused-vars": [
        "error",
        {
          varsIgnorePattern: "^req$|^res$|^next$|^err$",
        },
      ],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-undef": "error",
    },
  },
  {
    files: ["**/*.js"],
    languageOptions: {
      sourceType: "commonjs",
    },
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
];
