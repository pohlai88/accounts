/**
 * @aibos/tokens Tailwind Preset - Dual-Mode Design System
 * 
 * Accessibility is not a compromise, it's a fundamental need that we respect and fully support.
 * 
 * Auto-generated from tokens.ts - DO NOT EDIT MANUALLY
 * This preset provides CSS variables for dual-mode design system:
 * - Aesthetic Mode: Beautiful, subtle, modern design
 * - Accessibility Mode: WCAG 2.2 AAA compliant design
 * STRICT MODE: No inline fallbacks. Build fails if tokens are missing or invalid.
 */
// @ts-nocheck


const plugin = require("tailwindcss/plugin");

const designModes = {
  "aesthetic": {
    "colors": {
      "primary": "#00D4FF",
      "primaryPressed": "#00B8E6",
      "accent": "#FF6B35",
      "accentPressed": "#E55A2B",
      "neutral": {
        "0": "#000000",
        "50": "#1C1C1E",
        "100": "#2C2C2E",
        "200": "#3A3A3C",
        "300": "#48484A",
        "400": "#636366",
        "500": "#8E8E93",
        "600": "#AEAEB2",
        "700": "#C7C7CC",
        "800": "#D1D1D6",
        "900": "#FFFFFF"
      },
      "success": "#34C759",
      "warning": "#FF9500",
      "danger": "#FF3B30"
    },
    "contrast": "subtle",
    "materials": "glass",
    "spacing": "generous",
    "effects": "enabled"
  },
  "accessibility": {
    "colors": {
      "primary": "#00B8E6",
      "primaryPressed": "#009CCC",
      "accent": "#E55A2B",
      "accentPressed": "#CC4921",
      "neutral": {
        "0": "#000000",
        "50": "#000000",
        "100": "#000000",
        "200": "#FFFFFF",
        "300": "#FFFFFF",
        "400": "#FFFFFF",
        "500": "#FFFFFF",
        "600": "#FFFFFF",
        "700": "#FFFFFF",
        "800": "#FFFFFF",
        "900": "#FFFFFF"
      },
      "success": "#00FF00",
      "warning": "#FFFF00",
      "danger": "#FF0000"
    },
    "contrast": "maximum",
    "materials": "solid",
    "spacing": "functional",
    "effects": "disabled"
  }
};
const semanticTokens = {
  "semantic": {
    "text": {
      "primary": "var(--sys-text-primary)",
      "secondary": "var(--sys-text-secondary)",
      "tertiary": "var(--sys-text-tertiary)",
      "quaternary": "var(--sys-text-quaternary)",
      "link": "var(--sys-text-link)"
    },
    "bg": {
      "base": "var(--sys-bg-base)",
      "subtle": "var(--sys-bg-subtle)",
      "raised": "var(--sys-bg-raised)"
    },
    "fill": {
      "low": "var(--sys-fill-low)",
      "med": "var(--sys-fill-med)",
      "high": "var(--sys-fill-high)"
    },
    "border": {
      "hairline": "var(--sys-border-hairline)"
    },
    "accent": {
      "system": "var(--sys-accent)",
      "brand": "var(--brand-accent)"
    }
  },
  "brand": {
    "primary": {
      "500": "#00D4FF",
      "600": "#00B8E6",
      "700": "#009CCC"
    },
    "accent": {
      "500": "#FF6B35",
      "600": "#E55A2B",
      "700": "#CC4921"
    }
  },
  "materials": {
    "overlay": {
      "ultraThin": "var(--sys-material-ultra-thin)",
      "thin": "var(--sys-material-thin)",
      "regular": "var(--sys-material-regular)",
      "thick": "var(--sys-material-thick)"
    }
  },
  "application": {
    "text": {
      "primary": "var(--sys-text-primary)",
      "secondary": "var(--sys-text-secondary)",
      "tertiary": "var(--sys-text-tertiary)",
      "link": "var(--sys-text-link)",
      "accent": "var(--brand-accent)"
    },
    "background": {
      "primary": "var(--sys-bg-base)",
      "secondary": "var(--sys-bg-subtle)",
      "tertiary": "var(--sys-bg-raised)"
    },
    "button": {
      "primary": "var(--brand-primary)",
      "primaryPressed": "var(--brand-primary-pressed)",
      "secondary": "transparent",
      "secondaryBorder": "var(--sys-border-hairline)"
    },
    "status": {
      "success": "var(--sys-status-success)",
      "warning": "var(--sys-status-warning)",
      "error": "var(--sys-status-error)"
    }
  },
  "spacing": {
    "0": "0",
    "1": "0.25rem",
    "2": "0.5rem",
    "3": "0.75rem",
    "4": "1rem",
    "5": "1.25rem",
    "6": "1.5rem",
    "8": "2rem",
    "10": "2.5rem",
    "12": "3rem",
    "16": "4rem",
    "20": "5rem"
  },
  "radius": {
    "none": "0",
    "sm": "0.125rem",
    "md": "0.375rem",
    "lg": "0.5rem",
    "xl": "0.75rem",
    "2xl": "1rem",
    "full": "9999px"
  },
  "typography": {
    "font": {
      "sans": "var(--font-sans, 'Inter', ui-sans-serif, system-ui, sans-serif)",
      "mono": "var(--font-mono, 'JetBrains Mono', ui-monospace, 'SF Mono', monospace)"
    },
    "size": {
      "xs": "0.75rem",
      "sm": "0.875rem",
      "base": "1rem",
      "lg": "1.125rem",
      "xl": "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
      "4xl": "2.25rem"
    },
    "weight": {
      "normal": "400",
      "medium": "500",
      "semibold": "600",
      "bold": "700"
    },
    "lineHeight": {
      "tight": "1.25",
      "normal": "1.5",
      "relaxed": "1.75"
    }
  },
  "zIndex": {
    "dropdown": "1000",
    "sticky": "1020",
    "fixed": "1030",
    "modal": "1040",
    "popover": "1050",
    "tooltip": "1060",
    "toast": "1070"
  }
};

// Generate CSS variables for both modes
const aestheticVars = {
  // System colors (semantic roles)
  '--sys-text-primary': designModes.aesthetic.colors.neutral[900],
  '--sys-text-secondary': designModes.aesthetic.colors.neutral[500],
  '--sys-text-tertiary': designModes.aesthetic.colors.neutral[400],
  '--sys-text-quaternary': designModes.aesthetic.colors.neutral[300],
  '--sys-text-link': designModes.aesthetic.colors.primary,
  '--sys-bg-base': designModes.aesthetic.colors.neutral[0],
  '--sys-bg-subtle': designModes.aesthetic.colors.neutral[50],
  '--sys-bg-raised': designModes.aesthetic.colors.neutral[100],
  '--sys-fill-low': designModes.aesthetic.colors.neutral[200],
  '--sys-fill-med': designModes.aesthetic.colors.neutral[300],
  '--sys-fill-high': designModes.aesthetic.colors.neutral[400],
  '--sys-border-hairline': designModes.aesthetic.colors.neutral[200],
  '--sys-accent': designModes.aesthetic.colors.primary,
  '--brand-accent': designModes.aesthetic.colors.accent,
  '--brand-primary': designModes.aesthetic.colors.primary,
  '--brand-primary-pressed': designModes.aesthetic.colors.primaryPressed,
  '--sys-status-success': designModes.aesthetic.colors.success,
  '--sys-status-warning': designModes.aesthetic.colors.warning,
  '--sys-status-error': designModes.aesthetic.colors.danger,
  '--sys-material-ultra-thin': 'rgba(255, 255, 255, 0.05)',
  '--sys-material-thin': 'rgba(255, 255, 255, 0.1)',
  '--sys-material-regular': 'rgba(255, 255, 255, 0.15)',
  '--sys-material-thick': 'rgba(255, 255, 255, 0.2)'
};

const accessibilityVars = {
  // System colors (semantic roles) - WCAG 2.2 AAA compliant
  '--sys-text-primary': designModes.accessibility.colors.neutral[900],
  '--sys-text-secondary': designModes.accessibility.colors.neutral[900],
  '--sys-text-tertiary': designModes.accessibility.colors.neutral[900],
  '--sys-text-quaternary': designModes.accessibility.colors.neutral[900],
  '--sys-text-link': designModes.accessibility.colors.primary,
  '--sys-bg-base': designModes.accessibility.colors.neutral[0],
  '--sys-bg-subtle': designModes.accessibility.colors.neutral[0],
  '--sys-bg-raised': designModes.accessibility.colors.neutral[0],
  '--sys-fill-low': designModes.accessibility.colors.neutral[200],
  '--sys-fill-med': designModes.accessibility.colors.neutral[200],
  '--sys-fill-high': designModes.accessibility.colors.neutral[200],
  '--sys-border-hairline': designModes.accessibility.colors.neutral[200],
  '--sys-accent': designModes.accessibility.colors.primary,
  '--brand-accent': designModes.accessibility.colors.accent,
  '--brand-primary': designModes.accessibility.colors.primary,
  '--brand-primary-pressed': designModes.accessibility.colors.primaryPressed,
  '--sys-status-success': designModes.accessibility.colors.success,
  '--sys-status-warning': designModes.accessibility.colors.warning,
  '--sys-status-error': designModes.accessibility.colors.danger,
  '--sys-material-ultra-thin': designModes.accessibility.colors.neutral[0],
  '--sys-material-thin': designModes.accessibility.colors.neutral[0],
  '--sys-material-regular': designModes.accessibility.colors.neutral[0],
  '--sys-material-thick': designModes.accessibility.colors.neutral[0]
};

// Common design tokens
const commonVars = {
  // Spacing
  '--space-0': semanticTokens.spacing[0],
  '--space-1': semanticTokens.spacing[1],
  '--space-2': semanticTokens.spacing[2],
  '--space-3': semanticTokens.spacing[3],
  '--space-4': semanticTokens.spacing[4],
  '--space-5': semanticTokens.spacing[5],
  '--space-6': semanticTokens.spacing[6],
  '--space-8': semanticTokens.spacing[8],
  '--space-10': semanticTokens.spacing[10],
  '--space-12': semanticTokens.spacing[12],
  '--space-16': semanticTokens.spacing[16],
  '--space-20': semanticTokens.spacing[20],
  
  // Border radius
  '--radius-none': semanticTokens.radius.none,
  '--radius-sm': semanticTokens.radius.sm,
  '--radius-md': semanticTokens.radius.md,
  '--radius-lg': semanticTokens.radius.lg,
  '--radius-xl': semanticTokens.radius.xl,
  '--radius-2xl': semanticTokens.radius['2xl'],
  '--radius-full': semanticTokens.radius.full,
  
  // Typography
  '--font-sans': semanticTokens.typography.font.sans,
  '--font-mono': semanticTokens.typography.font.mono,
  '--font-size-xs': semanticTokens.typography.size.xs,
  '--font-size-sm': semanticTokens.typography.size.sm,
  '--font-size-base': semanticTokens.typography.size.base,
  '--font-size-lg': semanticTokens.typography.size.lg,
  '--font-size-xl': semanticTokens.typography.size.xl,
  '--font-size-2xl': semanticTokens.typography.size['2xl'],
  '--font-size-3xl': semanticTokens.typography.size['3xl'],
  '--font-size-4xl': semanticTokens.typography.size['4xl'],
  '--font-weight-normal': semanticTokens.typography.weight.normal,
  '--font-weight-medium': semanticTokens.typography.weight.medium,
  '--font-weight-semibold': semanticTokens.typography.weight.semibold,
  '--font-weight-bold': semanticTokens.typography.weight.bold,
  '--line-height-tight': semanticTokens.typography.lineHeight.tight,
  '--line-height-normal': semanticTokens.typography.lineHeight.normal,
  '--line-height-relaxed': semanticTokens.typography.lineHeight.relaxed,
  
  // Z-index
  '--z-dropdown': semanticTokens.zIndex.dropdown,
  '--z-sticky': semanticTokens.zIndex.sticky,
  '--z-fixed': semanticTokens.zIndex.fixed,
  '--z-modal': semanticTokens.zIndex.modal,
  '--z-popover': semanticTokens.zIndex.popover,
  '--z-tooltip': semanticTokens.zIndex.tooltip,
  '--z-toast': semanticTokens.zIndex.toast
};

module.exports = {
  // Tailwind supports either 'media' | 'class' OR ['class', '<one selector>'].
  // Accessibility mode is handled via CSS vars below, not darkMode.
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
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
        
        // Legacy support
        "bg-base": "var(--sys-bg-base)",
        "bg-elevated": "var(--sys-bg-raised)",
        "bg-muted": "var(--sys-bg-subtle)",
        "fg-default": "var(--sys-text-primary)",
        "fg-muted": "var(--sys-text-secondary)",
        "fg-subtle": "var(--sys-text-tertiary)",
        "fg-inverted": "var(--sys-text-primary)",
        "border-subtle": "var(--sys-border-hairline)",
        "border-strong": "var(--sys-border-hairline)",
        "border-focus": "var(--sys-accent)",
        brand: {
          DEFAULT: "var(--brand-primary)",
          solid: "var(--brand-primary)",
          muted: "var(--brand-primary)",
          subtle: "var(--brand-primary)",
        },
        success: "var(--sys-status-success)",
        warning: "var(--sys-status-warning)",
        danger: "var(--sys-status-error)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        DEFAULT: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        full: "var(--radius-full)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      fontSize: {
        xs: ["var(--font-size-xs)", { lineHeight: "var(--line-height-tight)" }],
        sm: ["var(--font-size-sm)", { lineHeight: "var(--line-height-normal)" }],
        base: ["var(--font-size-base)", { lineHeight: "var(--line-height-normal)" }],
        lg: ["var(--font-size-lg)", { lineHeight: "var(--line-height-normal)" }],
        xl: ["var(--font-size-xl)", { lineHeight: "var(--line-height-normal)" }],
        "2xl": ["var(--font-size-2xl)", { lineHeight: "var(--line-height-tight)" }],
        "3xl": ["var(--font-size-3xl)", { lineHeight: "var(--line-height-tight)" }],
        "4xl": ["var(--font-size-4xl)", { lineHeight: "var(--line-height-tight)" }],
      },
      fontWeight: {
        normal: "var(--font-weight-normal)",
        medium: "var(--font-weight-medium)",
        semibold: "var(--font-weight-semibold)",
        bold: "var(--font-weight-bold)",
      },
      spacing: {
        0: "var(--space-0)",
        1: "var(--space-1)",
        2: "var(--space-2)",
        3: "var(--space-3)",
        4: "var(--space-4)",
        5: "var(--space-5)",
        6: "var(--space-6)",
        8: "var(--space-8)",
        10: "var(--space-10)",
        12: "var(--space-12)",
        16: "var(--space-16)",
        20: "var(--space-20)",
      },
      zIndex: {
        dropdown: "var(--z-dropdown)",
        sticky: "var(--z-sticky)",
        fixed: "var(--z-fixed)",
        modal: "var(--z-modal)",
        popover: "var(--z-popover)",
        tooltip: "var(--z-tooltip)",
        toast: "var(--z-toast)",
      },
    },
  },
  plugins: [
    plugin(({ addBase }) => {
      addBase({
        ":root": {
          ...commonVars,
          ...aestheticVars
        },
      });
      addBase({
        "[data-accessibility-mode='true']": {
          ...commonVars,
          ...accessibilityVars
        },
      });
    }),
  ],
};
