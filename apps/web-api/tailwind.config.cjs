/**
 * @aibos/web-api Tailwind Configuration
 *
 * Uses @aibos/tailwind-preset for consistent design system.
 * This app may not need Tailwind, but included for consistency.
 */

const preset = require("../../packages/config/tailwind-preset");

module.exports = {
  presets: [preset],
  content: [
    "../../packages/ui/src/**/*.{ts,tsx}",
    "../../packages/tokens/src/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
  ],
  // No additional theme extensions - everything comes from SSOT preset
};
