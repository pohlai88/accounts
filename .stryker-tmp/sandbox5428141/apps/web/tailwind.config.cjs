/**
 * Tailwind Configuration
 *
 * Simplified config for web app - avoiding preset dependency issues
 */
// @ts-nocheck


module.exports = {
  content: [
    "../../packages/ui/src/**/*.{ts,tsx}",
    "../../packages/tokens/src/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#00D4FF",
        accent: "#FF6B35",
      },
    },
  },
  plugins: [],
};
