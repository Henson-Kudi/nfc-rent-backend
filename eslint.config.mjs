import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import prettier from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";
import node from "eslint-plugin-node";

/** @type {import('eslint').Linter.Config[]} */
export default [
  // Extending base ESLint configurations for JS files
  pluginJs.configs.recommended,

  {
    files: ["**/*.{js,mjs,cjs,ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: "module",
      },
      globals: globals.node,
    },
    plugins: {
      "@typescript-eslint": tseslint,
      prettier: prettier,
      node: node,
    },
    rules: {
      "no-unused-vars": "off", // Disable base rule
      "no-undef": "off", // Disable base rule
      
      // TypeScript-specific rules
      ...tseslint.configs["recommended"].rules,
      "@typescript-eslint/no-unused-vars": [
        "error",
        { 
           "args": "after-used",
          "argsIgnorePattern": "^_",
          "varsIgnorePattern": "^_",
          "caughtErrorsIgnorePattern": "^_",
          "ignoreRestSiblings": true,
          "destructuredArrayIgnorePattern": "^_",
          "varsIgnorePattern": "^_",
          // "args": "none"
         }, // Ignore unused function args that start with _
      ],

      "@typescript-eslint/explicit-module-boundary-types": "off", // Disable explicit return types on function signatures

      // Prettier configuration to avoid conflicts with ESLint
      "prettier/prettier": "error",

      // Console usage restrictions
      "no-console": ["error", { allow: ["warn", "error"] }],

      // Node.js-specific rules
      "node/no-unsupported-features/es-syntax": "off", // Disable temporarily to check

      // General best practices
      // "no-unused-vars": "warn", // Warn about unused variables
      "no-debugger": "error", // Disallow the use of debugger
      "no-trailing-spaces": "error", // Disallow trailing spaces
      "eqeqeq": "error", // Enforce strict equality (===)
      "curly": "error", // Enforce curly braces for control structures

      // Enforce consistent return behavior
      "consistent-return": "warn",

      // Formatting and readability
      "semi": ["error", "always"], // Enforce semicolons
      "quotes": ["error", "single"], // Enforce single quotes for strings
      "indent": ["error", 2], // Enforce 2-space indentation

      // Allow async/await usage
      "no-return-await": "error",
      "require-await": "warn", // Warn about async functions that do not contain await

      // TypeScript-specific linting for type safety
      "@typescript-eslint/no-explicit-any": "warn", // Warn about explicit 'any' types
    }
  },

  // Prettier configuration to ensure there are no conflicts with ESLint rules
  prettierConfig,
];
