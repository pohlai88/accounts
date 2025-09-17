/**
 * ThemeProvider Component - Steve Jobs Inspired
 *
 * "Design is not just what it looks like and feels like. Design is how it works."
 * Provides theme context and mode switching for aesthetic/accessibility modes
 */
// @ts-nocheck


import React, { createContext, useContext, useEffect, useState } from "react";
import { applyModeToDocument, isAccessibilityMode } from "@aibos/tokens";

type ThemeMode = "aesthetic" | "accessibility";

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export interface ThemeProviderProps {
  children: React.ReactNode;
  defaultMode?: ThemeMode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultMode = "aesthetic",
}) => {
  const [mode, setModeState] = useState<ThemeMode>(defaultMode);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    applyModeToDocument(newMode);
    localStorage.setItem("theme-mode", newMode);
  };

  const toggleMode = () => {
    const newMode = mode === "aesthetic" ? "accessibility" : "aesthetic";
    setMode(newMode);
  };

  // Initialize theme on mount
  useEffect(() => {
    const savedMode = localStorage.getItem("theme-mode") as ThemeMode;
    const currentMode = isAccessibilityMode() ? "accessibility" : "aesthetic";
    const initialMode = savedMode || currentMode || defaultMode;

    setMode(initialMode);
  }, [defaultMode]);

  return (
    <ThemeContext.Provider value={{ mode, setMode, toggleMode }}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export default ThemeProvider;
