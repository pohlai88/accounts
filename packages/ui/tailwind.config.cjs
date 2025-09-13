/**
 * @aibos/ui Tailwind Configuration
 * 
 * Dual-Mode Design System Support
 * 
 * Accessibility is not a compromise, it's a fundamental need that we respect and fully support.
 * 
 * This configuration supports:
 * - Aesthetic Mode: Beautiful, subtle, modern design
 * - Accessibility Mode: WCAG 2.2 AAA compliant design
 */

module.exports = {
  presets: [require("@aibos/tokens/tailwind.preset.cjs")],
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/tokens/src/**/*.{ts,tsx}",
  ],

  // Dual-mode theme extensions
  theme: {
    extend: {
      // CSS Variables for dual-mode support
      colors: {
        // System colors (semantic roles)
        'sys-text-primary': 'var(--sys-text-primary)',
        'sys-text-secondary': 'var(--sys-text-secondary)',
        'sys-text-tertiary': 'var(--sys-text-tertiary)',
        'sys-text-quaternary': 'var(--sys-text-quaternary)',
        'sys-text-link': 'var(--sys-text-link)',

        'sys-bg-base': 'var(--sys-bg-base)',
        'sys-bg-subtle': 'var(--sys-bg-subtle)',
        'sys-bg-raised': 'var(--sys-bg-raised)',

        'sys-fill-low': 'var(--sys-fill-low)',
        'sys-fill-med': 'var(--sys-fill-med)',
        'sys-fill-high': 'var(--sys-fill-high)',

        'sys-border-hairline': 'var(--sys-border-hairline)',
        'sys-accent': 'var(--sys-accent)',

        // Brand colors
        'brand-primary': 'var(--brand-primary)',
        'brand-primary-pressed': 'var(--brand-primary-pressed)',
        'brand-accent': 'var(--brand-accent)',

        // Status colors
        'sys-status-success': 'var(--sys-status-success)',
        'sys-status-warning': 'var(--sys-status-warning)',
        'sys-status-error': 'var(--sys-status-error)',

        // Material colors
        'sys-material-ultra-thin': 'var(--sys-material-ultra-thin)',
        'sys-material-thin': 'var(--sys-material-thin)',
        'sys-material-regular': 'var(--sys-material-regular)',
        'sys-material-thick': 'var(--sys-material-thick)',
      },

      // Accessibility mode specific utilities
      spacing: {
        'aaa-xs': '0.125rem',  // 2px - AAA mode minimal spacing
        'aaa-sm': '0.25rem',   // 4px - AAA mode small spacing
        'aaa-md': '0.5rem',    // 8px - AAA mode medium spacing
        'aaa-lg': '1rem',      // 16px - AAA mode large spacing
        'aaa-xl': '1.5rem',    // 24px - AAA mode extra large spacing
      },

      // Accessibility mode specific border radius
      borderRadius: {
        'aaa-sm': '0.125rem',  // 2px - AAA mode subtle rounding
        'aaa-md': '0.25rem',   // 4px - AAA mode standard rounding
        'aaa-lg': '0.375rem',  // 6px - AAA mode prominent rounding
      },

      // Accessibility mode specific font weights
      fontWeight: {
        'aaa-normal': '500',   // AAA mode normal weight (slightly bolder)
        'aaa-medium': '600',   // AAA mode medium weight
        'aaa-semibold': '700', // AAA mode semibold weight
        'aaa-bold': '800',     // AAA mode bold weight
      },

      // Accessibility mode specific font sizes
      fontSize: {
        'aaa-xs': ['0.75rem', { lineHeight: '1.5' }],     // 12px
        'aaa-sm': ['0.875rem', { lineHeight: '1.5' }],    // 14px
        'aaa-base': ['1rem', { lineHeight: '1.5' }],      // 16px
        'aaa-lg': ['1.125rem', { lineHeight: '1.4' }],    // 18px
        'aaa-xl': ['1.25rem', { lineHeight: '1.4' }],     // 20px
        'aaa-2xl': ['1.5rem', { lineHeight: '1.3' }],     // 24px
        'aaa-3xl': ['1.875rem', { lineHeight: '1.2' }],  // 30px
        'aaa-4xl': ['2.25rem', { lineHeight: '1.1' }],   // 36px
      },
    },
  },

  // Accessibility mode specific utilities
  plugins: [
    function ({ addUtilities }) {
      const newUtilities = {
        // Accessibility mode utilities
        '.aaa-mode': {
          '--tw-bg-opacity': '1',
          '--tw-text-opacity': '1',
          '--tw-border-opacity': '1',
        },

        // High contrast utilities for AAA mode
        '.aaa-high-contrast': {
          'filter': 'contrast(150%)',
        },

        // Solid background utilities for AAA mode
        '.aaa-solid-bg': {
          'background-color': 'var(--sys-bg-base)',
          'backdrop-filter': 'none',
          'background-image': 'none',
        },

        // Enhanced focus utilities for AAA mode
        '.aaa-focus': {
          'outline': '3px solid var(--sys-accent)',
          'outline-offset': '2px',
        },

        // Enhanced border utilities for AAA mode
        '.aaa-border': {
          'border-width': '2px',
          'border-color': 'var(--sys-border-hairline)',
        },
      };

      addUtilities(newUtilities);
    },
  ],
};
