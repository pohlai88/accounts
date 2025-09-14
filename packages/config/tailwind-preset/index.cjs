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
 *
 * Usage:
 * const preset = require("@aibos/tailwind-preset");
 * module.exports = { presets: [preset] };
 */

// Import the auto-generated token preset
const tokenPreset = require("@aibos/tokens/tailwind.preset.cjs");

module.exports = {
  // Extend the token preset (this ensures auto-generation from tokens)
  ...tokenPreset,

  // Override content paths to be more flexible
  content: ["./**/*.{ts,tsx,js,jsx,mdx}"],

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
