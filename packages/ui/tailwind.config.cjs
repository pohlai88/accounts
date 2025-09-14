/**
 * @aibos/ui Tailwind Configuration
 *
 * Uses @aibos/tailwind-preset for consistent design system.
 * Includes additional accessibility utilities for UI components.
 */

const preset = require("../../packages/config/tailwind-preset");

module.exports = {
  presets: [preset],
  content: ["./src/**/*.{ts,tsx}", "../../packages/tokens/src/**/*.{ts,tsx}"],

  // Additional UI-specific theme extensions
  theme: {
    extend: {
      // Accessibility mode specific utilities
      spacing: {
        "aaa-xs": "0.125rem", // 2px - AAA mode minimal spacing
        "aaa-sm": "0.25rem", // 4px - AAA mode small spacing
        "aaa-md": "0.5rem", // 8px - AAA mode medium spacing
        "aaa-lg": "1rem", // 16px - AAA mode large spacing
        "aaa-xl": "1.5rem", // 24px - AAA mode extra large spacing
      },

      // Accessibility mode specific border radius
      borderRadius: {
        "aaa-sm": "0.125rem", // 2px - AAA mode subtle rounding
        "aaa-md": "0.25rem", // 4px - AAA mode standard rounding
        "aaa-lg": "0.375rem", // 6px - AAA mode prominent rounding
      },

      // Accessibility mode specific font weights
      fontWeight: {
        "aaa-normal": "500", // AAA mode normal weight (slightly bolder)
        "aaa-medium": "600", // AAA mode medium weight
        "aaa-semibold": "700", // AAA mode semibold weight
        "aaa-bold": "800", // AAA mode bold weight
      },

      // Accessibility mode specific font sizes
      fontSize: {
        "aaa-xs": ["0.75rem", { lineHeight: "1.5" }], // 12px
        "aaa-sm": ["0.875rem", { lineHeight: "1.5" }], // 14px
        "aaa-base": ["1rem", { lineHeight: "1.5" }], // 16px
        "aaa-lg": ["1.125rem", { lineHeight: "1.4" }], // 18px
        "aaa-xl": ["1.25rem", { lineHeight: "1.4" }], // 20px
        "aaa-2xl": ["1.5rem", { lineHeight: "1.3" }], // 24px
        "aaa-3xl": ["1.875rem", { lineHeight: "1.2" }], // 30px
        "aaa-4xl": ["2.25rem", { lineHeight: "1.1" }], // 36px
      },
    },
  },

  // Additional UI-specific utilities
  plugins: [
    function ({ addUtilities }) {
      const newUtilities = {
        // Additional accessibility mode utilities
        ".aaa-high-contrast": {
          filter: "contrast(150%)",
        },

        // Solid background utilities for AAA mode
        ".aaa-solid-bg": {
          "background-color": "var(--sys-bg-base)",
          "backdrop-filter": "none",
          "background-image": "none",
        },

        // Enhanced focus utilities for AAA mode
        ".aaa-focus": {
          outline: "3px solid var(--sys-accent)",
          "outline-offset": "2px",
        },

        // Enhanced border utilities for AAA mode
        ".aaa-border": {
          "border-width": "2px",
          "border-color": "var(--sys-border-hairline)",
        },
      };

      addUtilities(newUtilities);
    },
  ],
};
