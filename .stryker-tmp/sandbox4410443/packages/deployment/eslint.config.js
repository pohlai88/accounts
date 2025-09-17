/**
 * @aibos/deployment ESLint Configuration
 *
 * Handles TypeScript files and ignores JavaScript deployment scripts
 */
// @ts-nocheck


const base = require("@aibos/eslint-config");

module.exports = [
  ...base.default || base,
  {
    ignores: ["scripts/**/*.js"],
  },
];
