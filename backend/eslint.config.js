const globals = require("globals");
const tseslint = require("typescript-eslint");

module.exports = tseslint.config({
  files: ["**/*.ts"],
  ignores: ["node_modules", "dist", "coverage", "prisma"],
  languageOptions: {
    parser: tseslint.parser,
    globals: {
      ...globals.node,
      ...globals.jest,
    },
  },
  plugins: {
    "@typescript-eslint": tseslint.plugin,
  },
  rules: {
    "@typescript-eslint/no-unused-vars": ["warn"],
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
  },
});
