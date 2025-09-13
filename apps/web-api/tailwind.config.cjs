/**
 * @aibos/web-api Tailwind Configuration
 * 
 * Uses @aibos/tokens preset for consistent design system.
 * This app may not need Tailwind, but included for consistency.
 */

module.exports = {
  presets: [require("@aibos/tokens/tailwind.preset.cjs")],
  content: [
    "../../packages/ui/src/**/*.{ts,tsx}",
    "../../packages/tokens/src/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
  ],
  // No additional theme extensions - everything comes from tokens preset
};
