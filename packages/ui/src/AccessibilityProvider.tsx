"use client";

/**
 * @aibos/ui - Accessibility Provider
 *
 * Accessibility is not a compromise, it's a fundamental need that we respect and fully support.
 *
 * This provider manages the dual-mode design system:
 * - Aesthetic Mode: Beautiful, subtle, modern design
 * - Accessibility Mode: WCAG 2.2 AAA compliant design
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  initializeDesignMode,
  toggleAccessibilityMode,
  isAccessibilityMode,
  applyModeToDocument,
} from "@aibos/tokens";

// ============================================================================
// TYPES
// ============================================================================

export type DesignMode = "aesthetic" | "accessibility";

export interface AccessibilityContextType {
  mode: DesignMode;
  isAAA: boolean;
  toggleMode: () => void;
  setMode: (mode: DesignMode) => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

export interface AccessibilityProviderProps {
  children: ReactNode;
  defaultMode?: DesignMode;
  persistMode?: boolean;
}

export function AccessibilityProvider({
  children,
  defaultMode = "aesthetic",
  persistMode = true,
}: AccessibilityProviderProps) {
  const [mode, setModeState] = useState<DesignMode>(defaultMode);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize design mode on mount
  useEffect(() => {
    if (!isInitialized) {
      // Check for persisted mode
      if (persistMode && typeof window !== "undefined") {
        const persistedMode = localStorage.getItem("aibos-design-mode") as DesignMode;
        if (persistedMode && (persistedMode === "aesthetic" || persistedMode === "accessibility")) {
          setModeState(persistedMode);
          applyModeToDocument(persistedMode);
        } else {
          initializeDesignMode(defaultMode);
        }
      } else {
        initializeDesignMode(defaultMode);
      }
      setIsInitialized(true);
    }
  }, [defaultMode, persistMode, isInitialized]);

  // Update mode state when document mode changes
  useEffect(() => {
    if (isInitialized && typeof document !== "undefined") {
      const currentMode = isAccessibilityMode() ? "accessibility" : "aesthetic";
      if (currentMode !== mode) {
        setModeState(currentMode);
      }
    }
  }, [mode, isInitialized]);

  // Persist mode changes
  useEffect(() => {
    if (isInitialized && persistMode && typeof window !== "undefined") {
      localStorage.setItem("aibos-design-mode", mode);
    }
  }, [mode, persistMode, isInitialized]);

  const toggleMode = () => {
    const newMode = toggleAccessibilityMode();
    setModeState(newMode);
  };

  const setMode = (newMode: DesignMode) => {
    applyModeToDocument(newMode);
    setModeState(newMode);
  };

  const value: AccessibilityContextType = {
    mode,
    isAAA: mode === "accessibility",
    toggleMode,
    setMode,
  };

  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>;
}

// ============================================================================
// HOOK
// ============================================================================

export function useAccessibility(): AccessibilityContextType {
  const context = useContext(AccessibilityContext);

  if (context === undefined) {
    throw new Error("useAccessibility must be used within an AccessibilityProvider");
  }

  return context;
}

// ============================================================================
// HOOK ALIASES
// ============================================================================

/**
 * Alias for useAccessibility for backward compatibility
 */
export const useDesignMode = useAccessibility;

/**
 * Hook to get current design mode
 */
export function useDesignModeValue(): DesignMode {
  const { mode } = useAccessibility();
  return mode;
}

/**
 * Hook to check if accessibility mode is active
 */
export function useIsAccessibilityMode(): boolean {
  const { isAAA } = useAccessibility();
  return isAAA;
}

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

/**
 * Component that renders different content based on design mode
 */
export interface ModeRendererProps {
  aesthetic?: ReactNode;
  accessibility?: ReactNode;
  children?: ReactNode;
}

export function ModeRenderer({ aesthetic, accessibility, children }: ModeRendererProps) {
  const { mode } = useAccessibility();

  if (mode === "accessibility" && accessibility !== undefined) {
    return <>{accessibility}</>;
  }

  if (mode === "aesthetic" && aesthetic !== undefined) {
    return <>{aesthetic}</>;
  }

  return <>{children}</>;
}

/**
 * Component that conditionally renders based on design mode
 */
export interface ConditionalRenderProps {
  mode: DesignMode;
  children: ReactNode;
}

export function ConditionalRender({ mode, children }: ConditionalRenderProps) {
  const { mode: currentMode } = useAccessibility();

  if (currentMode === mode) {
    return <>{children}</>;
  }

  return null;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default AccessibilityProvider;
