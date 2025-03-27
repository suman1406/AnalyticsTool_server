import { defineConfig } from "eslint/config";
import globals from "globals";
import js from "@eslint/js";


export default defineConfig([
  { files: ["**/*.{js,mjs,cjs}"] },
  { files: ["**/*.js"], languageOptions: { sourceType: "commonjs" } },
  { files: ["**/*.{js,mjs,cjs}"], languageOptions: { globals: globals.browser } },
  { files: ["**/*.{js,mjs,cjs}"], plugins: { js }, extends: ["js/recommended"] },
]);

// .eslintrc.js
module.exports = {
  env: {
    node: true,
    es2022: true
  },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "commonjs"
  },
  extends: "eslint:recommended",
  rules: {
    "semi": ["error", "always"],
    "quotes": ["error", "double"],
    "no-unused-vars": "warn",
    "no-console": "off",
    "indent": ["error", 2]
  }
};