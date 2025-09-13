/**
 * @aibos/web Tailwind Configuration
 * 
 * Uses @aibos/tokens preset for consistent design system.
 * No custom colors or values - everything comes from tokens.
 */

module.exports = {
  presets: [require("@aibos/tokens/tailwind.preset.cjs")],
  content: [
    "../../packages/ui/src/**/*.{ts,tsx}",
    "../../packages/tokens/src/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  // No additional theme extensions - everything comes from tokens preset
  // This ensures zero drift and single source of truth
};
