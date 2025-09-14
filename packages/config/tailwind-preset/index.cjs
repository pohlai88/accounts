/**
 * @aibos/tailwind-preset - SSOT Tailwind Configuration
 *
 * Single Source of Truth for all Tailwind configurations across the monorepo.
 *
 * This preset:
 * 1. Extends the auto-generated token preset (@aibos/tokens/tailwind.preset.cjs)
 * 2. Adds centralized plugins and utilities
 * 3. Ensures zero drift across all applications
 * 4. Maintains sustainability through token auto-generation
 * 5. Includes all accessibility utilities and theme extensions
 *
 * Usage:
 * const preset = require("@aibos/tailwind-preset");
 * module.exports = { presets: [preset] };
 */

// Import the auto-generated token preset
const tokenPreset = require("../../tokens/tailwind.preset.cjs");

module.exports = {
  // Extend the token preset (this ensures auto-generation from tokens)
  ...tokenPreset,

  // Centralized content paths - packages should override if needed
  content: [
    "./src/**/*.{ts,tsx,js,jsx}",
    "./app/**/*.{ts,tsx,js,jsx}",
    "./components/**/*.{ts,tsx,js,jsx}",
    "./pages/**/*.{ts,tsx,js,jsx}",
    "../../packages/ui/src/**/*.{ts,tsx,js,jsx}",
    "../../packages/tokens/src/**/*.{ts,tsx,js,jsx}",
  ],

  // Add centralized plugins and utilities
  plugins: [
    // Include all plugins from token preset
    ...tokenPreset.plugins,

    // Add additional centralized plugins
    require("@tailwindcss/typography"),
    require("@tailwindcss/forms"),

    // Add centralized accessibility utilities
    require("tailwindcss/plugin")(({ addUtilities }) => {
      const newUtilities = {
        // Enhanced accessibility utilities
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

        // Additional UI utilities
        ".glass-effect": {
          "backdrop-filter": "blur(10px)",
          "background-color": "rgba(255, 255, 255, 0.1)",
        },

        ".glass-effect-dark": {
          "backdrop-filter": "blur(10px)",
          "background-color": "rgba(0, 0, 0, 0.1)",
        },
      };

      addUtilities(newUtilities);
    }),
  ],

  // Add any additional theme extensions that should be centralized
  theme: {
    extend: {
      // Extend the token preset theme
      ...tokenPreset.theme?.extend,

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

      // Add any additional centralized theme extensions
      animation: {
        "fade-in": "fadeIn 0.2s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "bounce-subtle": "bounceSubtle 0.6s ease-in-out",
      },

      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        bounceSubtle: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
      },
    },
  },
};
