/**
 * @aibos/tokens - Main export file
 *
 * This package provides the single source of truth for all design decisions
 * in the AI-BOS monorepo. All apps and components should consume these tokens.
 */
// @ts-nocheck


export {
  DESIGN_MODES,
  SEMANTIC_TOKENS,
  ACCESSIBILITY_CSS_VARS,
  getModeCssVars,
  applyModeToDocument,
  isAccessibilityMode,
  toggleAccessibilityMode,
  initializeDesignMode,
  type DesignModes,
  type SemanticTokens,
  type AccessibilityCssVars,
} from "./tokens.js";

// Export Tailwind preset for easy consumption
// Note: The preset is generated during build and available as tailwind.preset.cjs
