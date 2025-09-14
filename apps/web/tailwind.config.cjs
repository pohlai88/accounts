/**
 * @aibos/web Tailwind Configuration
 *
 * Uses @aibos/tailwind-preset for consistent design system.
 * No custom colors or values - everything comes from SSOT preset.
 */

const preset = require("../../packages/config/tailwind-preset");

module.exports = {
  presets: [preset],
  content: [
    "../../packages/ui/src/**/*.{ts,tsx}",
    "../../packages/tokens/src/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  // No additional theme extensions - everything comes from SSOT preset
  // This ensures zero drift and single source of truth
};
