/**
 * @aibos/realtime ESLint Configuration
 *
 * Handles TypeScript files and ignores JavaScript files
 */

const base = require("@aibos/eslint-config");

module.exports = [
  ...base.default || base,
  {
    ignores: ["src/**/*.js"],
  },
];
