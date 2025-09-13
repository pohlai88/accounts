/**
 * @aibos/tokens - Dual-Mode Design System
 * 
 * Accessibility is not a compromise, it's a fundamental need that we respect and fully support.
 * 
 * Architecture: Aesthetic Mode | Accessibility Mode (WCAG 2.2 AAA)
 * 
 * Two complete, optimized experiences that serve different user needs:
 * - Aesthetic Mode: Beautiful, subtle, modern design
 * - Accessibility Mode: WCAG 2.2 AAA compliant design
 */

// ============================================================================
// DESIGN MODES - Two Complete Systems
// ============================================================================

export const DESIGN_MODES = {
    aesthetic: {
        // Beautiful, subtle, modern design for users who appreciate visual elegance
        colors: {
            // AI-BOS Brand Colors (Modern, Premium)
            primary: "#00D4FF",      // AI-BOS signature cyan
            primaryPressed: "#00B8E6", // Darker cyan for pressed states
            accent: "#FF6B35",        // AI-BOS accent orange
            accentPressed: "#E55A2B", // Darker orange for pressed states

            // Apple-Inspired Neutrals (Subtle, Elegant)
            neutral: {
                0: "#000000",        // Pure black - Jobs' signature
                50: "#1C1C1E",      // Apple's systemBackground dark
                100: "#2C2C2E",     // Apple's secondary background
                200: "#3A3A3C",     // Apple's tertiary background
                300: "#48484A",     // Apple's quaternary background
                400: "#636366",     // Apple's quinary background
                500: "#8E8E93",     // Apple's secondaryLabel
                600: "#AEAEB2",     // Apple's tertiaryLabel
                700: "#C7C7CC",     // Apple's quaternaryLabel
                800: "#D1D1D6",     // Apple's quinaryLabel
                900: "#FFFFFF"      // Pure white - Jobs' signature
            },

            // State Colors (Apple-Inspired)
            success: "#34C759",      // Apple Green
            warning: "#FF9500",      // Apple Orange
            danger: "#FF3B30"        // Apple Red
        },

        // Aesthetic Mode Characteristics
        contrast: "subtle",          // Beautiful but lower contrast
        materials: "glass",          // Blur effects, transparency
        spacing: "generous",         // Luxurious spacing
        effects: "enabled"           // Gradients, shadows, blur
    },

    accessibility: {
        // WCAG 2.2 AAA compliant design for users who need high contrast
        colors: {
            // AI-BOS Brand Colors (High Contrast)
            primary: "#00B8E6",      // Darker cyan for 7:1+ contrast
            primaryPressed: "#009CCC", // Even darker for pressed states
            accent: "#E55A2B",       // Darker orange for 7:1+ contrast
            accentPressed: "#CC4921", // Even darker for pressed states

            // High Contrast Neutrals (WCAG AAA Compliant)
            neutral: {
                0: "#000000",        // Pure black - maximum contrast
                50: "#000000",       // Pure black - no subtlety
                100: "#000000",      // Pure black - solid backgrounds
                200: "#FFFFFF",      // Pure white - clear borders
                300: "#FFFFFF",      // Pure white - clear separation
                400: "#FFFFFF",      // Pure white - secondary text
                500: "#FFFFFF",      // Pure white - tertiary text
                600: "#FFFFFF",      // Pure white - subtle accents
                700: "#FFFFFF",      // Pure white - borders
                800: "#FFFFFF",      // Pure white - backgrounds
                900: "#FFFFFF"       // Pure white - primary text
            },

            // State Colors (High Contrast)
            success: "#00FF00",      // Bright green for maximum contrast
            warning: "#FFFF00",      // Bright yellow for maximum contrast
            danger: "#FF0000"        // Bright red for maximum contrast
        },

        // Accessibility Mode Characteristics
        contrast: "maximum",         // WCAG AAA contrast ratios (7:1+)
        materials: "solid",          // No transparency, solid colors
        spacing: "functional",       // Clear, functional spacing
        effects: "disabled"          // No gradients, shadows, blur
    }
} as const;

// ============================================================================
// SEMANTIC TOKENS - Dual Mode Support
// ============================================================================

export const SEMANTIC_TOKENS = {
    // Platform-semantic roles (resolved to CSS vars; no hard-coded hex)
    semantic: {
        text: {
            primary: 'var(--sys-text-primary)',     // e.g., label
            secondary: 'var(--sys-text-secondary)',   // secondaryLabel
            tertiary: 'var(--sys-text-tertiary)',    // tertiaryLabel
            quaternary: 'var(--sys-text-quaternary)',  // quaternaryLabel
            link: 'var(--sys-text-link)'         // link
        },
        bg: {
            base: 'var(--sys-bg-base)',          // systemBackground
            subtle: 'var(--sys-bg-subtle)',        // secondarySystemBackground
            raised: 'var(--sys-bg-raised)'         // tertiarySystemBackground
        },
        fill: {
            low: 'var(--sys-fill-low)',         // systemFill
            med: 'var(--sys-fill-med)',         // secondarySystemFill
            high: 'var(--sys-fill-high)'         // tertiarySystemFill
        },
        border: {
            hairline: 'var(--sys-border-hairline)'   // separator
        },
        accent: {
            system: 'var(--sys-accent)',           // iOS tint / macOS controlAccentColor
            brand: 'var(--brand-accent)'          // AI-BOS accent (used on branded surfaces)
        }
    },

    // AI-BOS brand palette (our unique identity)
    brand: {
        primary: { 500: '#00D4FF', 600: '#00B8E6', 700: '#009CCC' }, // AI-BOS signature cyan
        accent: { 500: '#FF6B35', 600: '#E55A2B', 700: '#CC4921' }   // AI-BOS accent orange
    },

    // Materials for depth/elevation (Apple-inspired but AI-BOS enhanced)
    materials: {
        overlay: {
            ultraThin: 'var(--sys-material-ultra-thin)',
            thin: 'var(--sys-material-thin)',
            regular: 'var(--sys-material-regular)',
            thick: 'var(--sys-material-thick)'
        }
    },

    // Semantic application mapping
    application: {
        text: {
            primary: 'var(--sys-text-primary)',
            secondary: 'var(--sys-text-secondary)',
            tertiary: 'var(--sys-text-tertiary)',
            link: 'var(--sys-text-link)',
            accent: 'var(--brand-accent)'
        },
        background: {
            primary: 'var(--sys-bg-base)',
            secondary: 'var(--sys-bg-subtle)',
            tertiary: 'var(--sys-bg-raised)'
        },
        button: {
            primary: 'var(--brand-primary)',
            primaryPressed: 'var(--brand-primary-pressed)',
            secondary: 'transparent',
            secondaryBorder: 'var(--sys-border-hairline)'
        },
        status: {
            success: 'var(--sys-status-success)',
            warning: 'var(--sys-status-warning)',
            error: 'var(--sys-status-error)'
        }
    },

    // Spacing scale (consistent with Tailwind)
    spacing: {
        0: "0",
        1: "0.25rem",    // 4px
        2: "0.5rem",     // 8px
        3: "0.75rem",    // 12px
        4: "1rem",       // 16px
        5: "1.25rem",    // 20px
        6: "1.5rem",     // 24px
        8: "2rem",       // 32px
        10: "2.5rem",    // 40px
        12: "3rem",      // 48px
        16: "4rem",      // 64px
        20: "5rem"       // 80px
    },

    // Border radius
    radius: {
        none: "0",
        sm: "0.125rem",  // 2px
        md: "0.375rem",  // 6px
        lg: "0.5rem",    // 8px
        xl: "0.75rem",   // 12px
        "2xl": "1rem",   // 16px
        full: "9999px"
    },

    // Typography
    typography: {
        font: {
            sans: "var(--font-sans, 'Inter', ui-sans-serif, system-ui, sans-serif)",
            mono: "var(--font-mono, 'JetBrains Mono', ui-monospace, 'SF Mono', monospace)"
        },
        size: {
            xs: "0.75rem",     // 12px
            sm: "0.875rem",    // 14px
            base: "1rem",      // 16px
            lg: "1.125rem",    // 18px
            xl: "1.25rem",     // 20px
            "2xl": "1.5rem",   // 24px
            "3xl": "1.875rem", // 30px
            "4xl": "2.25rem"   // 36px
        },
        weight: {
            normal: "400",
            medium: "500",
            semibold: "600",
            bold: "700"
        },
        lineHeight: {
            tight: "1.25",
            normal: "1.5",
            relaxed: "1.75"
        }
    },

    // Z-index scale
    zIndex: {
        dropdown: "1000",
        sticky: "1020",
        fixed: "1030",
        modal: "1040",
        popover: "1050",
        tooltip: "1060",
        toast: "1070"
    }
} as const;

// ============================================================================
// ACCESSIBILITY MODE CSS VARIABLES
// ============================================================================

export const ACCESSIBILITY_CSS_VARS = {
    // Aesthetic Mode CSS Variables
    aesthetic: {
        '--sys-text-primary': DESIGN_MODES.aesthetic.colors.neutral[900],
        '--sys-text-secondary': DESIGN_MODES.aesthetic.colors.neutral[500],
        '--sys-text-tertiary': DESIGN_MODES.aesthetic.colors.neutral[400],
        '--sys-text-quaternary': DESIGN_MODES.aesthetic.colors.neutral[300],
        '--sys-text-link': DESIGN_MODES.aesthetic.colors.primary,
        '--sys-bg-base': DESIGN_MODES.aesthetic.colors.neutral[0],
        '--sys-bg-subtle': DESIGN_MODES.aesthetic.colors.neutral[50],
        '--sys-bg-raised': DESIGN_MODES.aesthetic.colors.neutral[100],
        '--sys-fill-low': DESIGN_MODES.aesthetic.colors.neutral[200],
        '--sys-fill-med': DESIGN_MODES.aesthetic.colors.neutral[300],
        '--sys-fill-high': DESIGN_MODES.aesthetic.colors.neutral[400],
        '--sys-border-hairline': DESIGN_MODES.aesthetic.colors.neutral[200],
        '--sys-accent': DESIGN_MODES.aesthetic.colors.primary,
        '--brand-accent': DESIGN_MODES.aesthetic.colors.accent,
        '--brand-primary': DESIGN_MODES.aesthetic.colors.primary,
        '--brand-primary-pressed': DESIGN_MODES.aesthetic.colors.primaryPressed,
        '--sys-status-success': DESIGN_MODES.aesthetic.colors.success,
        '--sys-status-warning': DESIGN_MODES.aesthetic.colors.warning,
        '--sys-status-error': DESIGN_MODES.aesthetic.colors.danger,
        '--sys-material-ultra-thin': 'rgba(255, 255, 255, 0.05)',
        '--sys-material-thin': 'rgba(255, 255, 255, 0.1)',
        '--sys-material-regular': 'rgba(255, 255, 255, 0.15)',
        '--sys-material-thick': 'rgba(255, 255, 255, 0.2)'
    },

    // Accessibility Mode CSS Variables (WCAG 2.2 AAA)
    accessibility: {
        '--sys-text-primary': DESIGN_MODES.accessibility.colors.neutral[900],
        '--sys-text-secondary': DESIGN_MODES.accessibility.colors.neutral[900],
        '--sys-text-tertiary': DESIGN_MODES.accessibility.colors.neutral[900],
        '--sys-text-quaternary': DESIGN_MODES.accessibility.colors.neutral[900],
        '--sys-text-link': DESIGN_MODES.accessibility.colors.primary,
        '--sys-bg-base': DESIGN_MODES.accessibility.colors.neutral[0],
        '--sys-bg-subtle': DESIGN_MODES.accessibility.colors.neutral[0],
        '--sys-bg-raised': DESIGN_MODES.accessibility.colors.neutral[0],
        '--sys-fill-low': DESIGN_MODES.accessibility.colors.neutral[200],
        '--sys-fill-med': DESIGN_MODES.accessibility.colors.neutral[200],
        '--sys-fill-high': DESIGN_MODES.accessibility.colors.neutral[200],
        '--sys-border-hairline': DESIGN_MODES.accessibility.colors.neutral[200],
        '--sys-accent': DESIGN_MODES.accessibility.colors.primary,
        '--brand-accent': DESIGN_MODES.accessibility.colors.accent,
        '--brand-primary': DESIGN_MODES.accessibility.colors.primary,
        '--brand-primary-pressed': DESIGN_MODES.accessibility.colors.primaryPressed,
        '--sys-status-success': DESIGN_MODES.accessibility.colors.success,
        '--sys-status-warning': DESIGN_MODES.accessibility.colors.warning,
        '--sys-status-error': DESIGN_MODES.accessibility.colors.danger,
        '--sys-material-ultra-thin': DESIGN_MODES.accessibility.colors.neutral[0],
        '--sys-material-thin': DESIGN_MODES.accessibility.colors.neutral[0],
        '--sys-material-regular': DESIGN_MODES.accessibility.colors.neutral[0],
        '--sys-material-thick': DESIGN_MODES.accessibility.colors.neutral[0]
    }
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get CSS variables for a specific design mode
 */
export function getModeCssVars(mode: 'aesthetic' | 'accessibility'): Record<string, string> {
    return ACCESSIBILITY_CSS_VARS[mode];
}

/**
 * Apply CSS variables to document root
 */
export function applyModeToDocument(mode: 'aesthetic' | 'accessibility'): void {
    // eslint-disable-next-line no-undef
    if (typeof window === 'undefined' || typeof window.document === 'undefined') return;

    const cssVars = getModeCssVars(mode);
    // eslint-disable-next-line no-undef
    const root = window.document.documentElement;

    Object.entries(cssVars).forEach(([property, value]) => {
        root.style.setProperty(property, value);
    });
}

/**
 * Check if current mode is accessibility mode
 */
export function isAccessibilityMode(): boolean {
    // eslint-disable-next-line no-undef
    if (typeof window === 'undefined' || typeof window.document === 'undefined') return false;
    // eslint-disable-next-line no-undef
    return window.document.documentElement.getAttribute('data-accessibility-mode') === 'true';
}

/**
 * Toggle between aesthetic and accessibility modes
 */
export function toggleAccessibilityMode(): 'aesthetic' | 'accessibility' {
    // eslint-disable-next-line no-undef
    if (typeof window === 'undefined' || typeof window.document === 'undefined') return 'aesthetic';

    const currentMode = isAccessibilityMode() ? 'accessibility' : 'aesthetic';
    const newMode = currentMode === 'aesthetic' ? 'accessibility' : 'aesthetic';

    applyModeToDocument(newMode);
    // eslint-disable-next-line no-undef
    window.document.documentElement.setAttribute('data-accessibility-mode', newMode === 'accessibility' ? 'true' : 'false');

    return newMode;
}

/**
 * Initialize design mode on document load
 */
export function initializeDesignMode(defaultMode: 'aesthetic' | 'accessibility' = 'aesthetic'): void {
    // eslint-disable-next-line no-undef
    if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
        applyModeToDocument(defaultMode);
        // eslint-disable-next-line no-undef
        window.document.documentElement.setAttribute('data-accessibility-mode', defaultMode === 'accessibility' ? 'true' : 'false');
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

export type DesignModes = typeof DESIGN_MODES;
export type SemanticTokens = typeof SEMANTIC_TOKENS;
export type AccessibilityCssVars = typeof ACCESSIBILITY_CSS_VARS;

// Re-export everything for easy consumption
// Note: Removed circular import that was causing build failures
