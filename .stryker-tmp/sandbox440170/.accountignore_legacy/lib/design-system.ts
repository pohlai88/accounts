/**
 * Modern Accounting SaaS - Design System
 * Comprehensive design tokens, themes, and styling utilities
 *
 * Features:
 * - Unified color system with semantic tokens
 * - Typography scale with modern font stack
 * - Component styling utilities
 * - Animation and transition presets
 * - Responsive design breakpoints
 */
// @ts-nocheck


// ============================================================================
// COLOR SYSTEM
// ============================================================================

export const colors = {
  // Brand Colors
  primary: {
    50: "#f0f9ff",
    100: "#e0f2fe",
    200: "#bae6fd",
    300: "#7dd3fc",
    400: "#38bdf8",
    500: "#0ea5e9", // Primary brand color
    600: "#0284c7",
    700: "#0369a1",
    800: "#075985",
    900: "#0c4a6e",
  },

  // Semantic Colors
  success: {
    50: "#f0fdf4",
    100: "#dcfce7",
    200: "#bbf7d0",
    300: "#86efac",
    400: "#4ade80",
    500: "#22c55e",
    600: "#16a34a",
    700: "#15803d",
    800: "#166534",
    900: "#14532d",
  },

  warning: {
    50: "#fffbeb",
    100: "#fef3c7",
    200: "#fde68a",
    300: "#fcd34d",
    400: "#fbbf24",
    500: "#f59e0b",
    600: "#d97706",
    700: "#b45309",
    800: "#92400e",
    900: "#78350f",
  },

  error: {
    50: "#fef2f2",
    100: "#fee2e2",
    200: "#fecaca",
    300: "#fca5a5",
    400: "#f87171",
    500: "#ef4444",
    600: "#dc2626",
    700: "#b91c1c",
    800: "#991b1b",
    900: "#7f1d1d",
  },

  // Neutral Colors
  gray: {
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
    600: "#4b5563",
    700: "#374151",
    800: "#1f2937",
    900: "#111827",
  },

  // Financial Colors
  financial: {
    revenue: "#10b981", // Green
    expense: "#ef4444", // Red
    asset: "#3b82f6", // Blue
    liability: "#f59e0b", // Orange
    equity: "#8b5cf6", // Purple
    profit: "#059669", // Emerald
    loss: "#dc2626", // Red
    neutral: "#6b7280", // Gray
  },

  // Status Colors
  status: {
    draft: "#6b7280",
    pending: "#f59e0b",
    approved: "#10b981",
    rejected: "#ef4444",
    cancelled: "#6b7280",
    completed: "#10b981",
    overdue: "#dc2626",
  },
} as const;

// ============================================================================
// TYPOGRAPHY SYSTEM
// ============================================================================

export const typography = {
  fontFamily: {
    sans: ["Inter", "system-ui", "sans-serif"],
    mono: ["JetBrains Mono", "Consolas", "monospace"],
  },

  fontSize: {
    xs: ["0.75rem", { lineHeight: "1rem" }],
    sm: ["0.875rem", { lineHeight: "1.25rem" }],
    base: ["1rem", { lineHeight: "1.5rem" }],
    lg: ["1.125rem", { lineHeight: "1.75rem" }],
    xl: ["1.25rem", { lineHeight: "1.75rem" }],
    "2xl": ["1.5rem", { lineHeight: "2rem" }],
    "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
    "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
    "5xl": ["3rem", { lineHeight: "1" }],
    "6xl": ["3.75rem", { lineHeight: "1" }],
  },

  fontWeight: {
    light: "300",
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    extrabold: "800",
  },
} as const;

// ============================================================================
// SPACING SYSTEM
// ============================================================================

export const spacing = {
  px: "1px",
  0: "0px",
  0.5: "0.125rem",
  1: "0.25rem",
  1.5: "0.375rem",
  2: "0.5rem",
  2.5: "0.625rem",
  3: "0.75rem",
  3.5: "0.875rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  7: "1.75rem",
  8: "2rem",
  9: "2.25rem",
  10: "2.5rem",
  11: "2.75rem",
  12: "3rem",
  14: "3.5rem",
  16: "4rem",
  20: "5rem",
  24: "6rem",
  28: "7rem",
  32: "8rem",
  36: "9rem",
  40: "10rem",
  44: "11rem",
  48: "12rem",
  52: "13rem",
  56: "14rem",
  60: "15rem",
  64: "16rem",
  72: "18rem",
  80: "20rem",
  96: "24rem",
} as const;

// ============================================================================
// BREAKPOINTS
// ============================================================================

export const breakpoints = {
  xs: "475px",
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;

// ============================================================================
// SHADOWS
// ============================================================================

export const shadows = {
  none: "none",
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  base: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
  "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
  inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
} as const;

// ============================================================================
// ANIMATIONS
// ============================================================================

export const animations = {
  // Duration
  duration: {
    75: "75ms",
    100: "100ms",
    150: "150ms",
    200: "200ms",
    300: "300ms",
    500: "500ms",
    700: "700ms",
    1000: "1000ms",
  },

  // Easing
  easing: {
    linear: "linear",
    in: "cubic-bezier(0.4, 0, 1, 1)",
    out: "cubic-bezier(0, 0, 0.2, 1)",
    "in-out": "cubic-bezier(0.4, 0, 0.2, 1)",
  },

  // Presets
  presets: {
    fadeIn: "fadeIn 200ms ease-out",
    fadeOut: "fadeOut 150ms ease-in",
    slideIn: "slideIn 300ms ease-out",
    slideOut: "slideOut 200ms ease-in",
    scaleIn: "scaleIn 150ms ease-out",
    scaleOut: "scaleOut 100ms ease-in",
  },
} as const;

// ============================================================================
// COMPONENT STYLES
// ============================================================================

export const components = {
  card: {
    base: "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm",
    elevated:
      "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-md",
    interactive:
      "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200",
  },

  button: {
    primary: "bg-primary-600 hover:bg-primary-700 focus:ring-primary-500 text-white",
    secondary: "bg-gray-100 hover:bg-gray-200 focus:ring-gray-500 text-gray-900",
    success: "bg-success-600 hover:bg-success-700 focus:ring-success-500 text-white",
    warning: "bg-warning-600 hover:bg-warning-700 focus:ring-warning-500 text-white",
    error: "bg-error-600 hover:bg-error-700 focus:ring-error-500 text-white",
  },

  badge: {
    primary: "bg-primary-50 text-primary-700 border-primary-200",
    success: "bg-success-50 text-success-700 border-success-200",
    warning: "bg-warning-50 text-warning-700 border-warning-200",
    error: "bg-error-50 text-error-700 border-error-200",
    gray: "bg-gray-50 text-gray-700 border-gray-200",
  },

  input: {
    base: "border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
    error: "border-error-300 focus:ring-error-500 focus:border-error-500",
    success: "border-success-300 focus:ring-success-500 focus:border-success-500",
  },
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const utils = {
  // Format currency with proper styling
  formatCurrency: (amount: number, currency = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  },

  // Format percentage with proper styling
  formatPercentage: (value: number, decimals = 1) => {
    return `${value.toFixed(decimals)}%`;
  },

  // Get color class for financial values
  getFinancialColor: (
    value: number,
    type: "revenue" | "expense" | "profit" | "loss" | "balance" = "balance",
  ) => {
    if (type === "revenue" || type === "profit") {
      return value >= 0 ? "text-success-600" : "text-error-600";
    }
    if (type === "expense" || type === "loss") {
      return value > 0 ? "text-error-600" : "text-success-600";
    }
    return value >= 0 ? "text-success-600" : "text-error-600";
  },

  // Get status color
  getStatusColor: (status: keyof typeof colors.status) => {
    return colors.status[status] || colors.gray[500];
  },

  // Conditional classes utility
  cn: (...classes: (string | undefined | null | boolean)[]) => {
    return classes.filter(Boolean).join(" ");
  },
} as const;

// ============================================================================
// LAYOUT CONSTANTS
// ============================================================================

export const layout = {
  sidebar: {
    width: "280px",
    collapsedWidth: "80px",
  },

  header: {
    height: "64px",
  },

  content: {
    maxWidth: "1400px",
    padding: "24px",
  },

  card: {
    padding: "24px",
    borderRadius: "12px",
  },
} as const;

// ============================================================================
// BUSINESS CONTEXT STYLES
// ============================================================================

export const businessContext = {
  // Account type colors
  accountTypes: {
    asset: colors.financial.asset,
    liability: colors.financial.liability,
    equity: colors.financial.equity,
    income: colors.financial.revenue,
    expense: colors.financial.expense,
  },

  // Document status colors
  documentStatus: {
    draft: colors.status.draft,
    submitted: colors.status.pending,
    approved: colors.status.approved,
    cancelled: colors.status.cancelled,
    overdue: colors.status.overdue,
  },

  // Priority levels
  priority: {
    low: colors.success[500],
    medium: colors.warning[500],
    high: colors.error[500],
    critical: colors.error[700],
  },

  // Risk levels
  risk: {
    low: colors.success[500],
    medium: colors.warning[500],
    high: colors.error[500],
    critical: colors.error[700],
  },
} as const;
