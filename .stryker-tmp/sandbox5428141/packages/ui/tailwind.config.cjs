/**
 * Tailwind Configuration
 *
 * Uses @aibos/tailwind-preset for consistent design system.
 * All utilities and theme extensions are centralized in the preset.
 */
// @ts-nocheck


const preset = require("@aibos/tailwind-preset");

module.exports = {
  presets: [preset],
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/tokens/src/**/*.{ts,tsx}"
  ],
  // No additional theme extensions or plugins - everything comes from SSOT preset
  // This ensures zero drift and single source of truth
};
