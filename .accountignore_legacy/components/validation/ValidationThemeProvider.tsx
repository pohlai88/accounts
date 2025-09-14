/**
 * Enhanced Theme and Customization Support for Validation Components
 * Provides theming context for consistent styling and customization
 */

import React, { createContext, useContext, useMemo } from "react";

export interface ValidationTheme {
  colors: {
    error: {
      primary: string;
      secondary: string;
      background: string;
      border: string;
      text: string;
      textSecondary: string;
    };
    warning: {
      primary: string;
      secondary: string;
      background: string;
      border: string;
      text: string;
      textSecondary: string;
    };
    info: {
      primary: string;
      secondary: string;
      background: string;
      border: string;
      text: string;
      textSecondary: string;
    };
    success: {
      primary: string;
      secondary: string;
      background: string;
      border: string;
      text: string;
      textSecondary: string;
    };
    suggestion: {
      primary: string;
      secondary: string;
      background: string;
      border: string;
      text: string;
      textSecondary: string;
    };
  };
  spacing: {
    card: string;
    item: string;
    compact: string;
    comfortable: string;
  };
  borderRadius: {
    small: string;
    medium: string;
    large: string;
  };
  shadows: {
    small: string;
    medium: string;
    large: string;
  };
  animation: {
    duration: string;
    easing: string;
  };
  typography: {
    title: string;
    body: string;
    caption: string;
    code: string;
  };
}

const defaultTheme: ValidationTheme = {
  colors: {
    error: {
      primary: "red-500",
      secondary: "red-100",
      background: "red-50",
      border: "red-200",
      text: "red-800",
      textSecondary: "red-600",
    },
    warning: {
      primary: "yellow-500",
      secondary: "yellow-100",
      background: "yellow-50",
      border: "yellow-200",
      text: "yellow-800",
      textSecondary: "yellow-600",
    },
    info: {
      primary: "blue-500",
      secondary: "blue-100",
      background: "blue-50",
      border: "blue-200",
      text: "blue-800",
      textSecondary: "blue-600",
    },
    success: {
      primary: "green-500",
      secondary: "green-100",
      background: "green-50",
      border: "green-200",
      text: "green-800",
      textSecondary: "green-600",
    },
    suggestion: {
      primary: "green-500",
      secondary: "green-100",
      background: "green-50",
      border: "green-200",
      text: "green-800",
      textSecondary: "green-600",
    },
  },
  spacing: {
    card: "p-4",
    item: "p-3",
    compact: "p-2",
    comfortable: "p-6",
  },
  borderRadius: {
    small: "rounded",
    medium: "rounded-lg",
    large: "rounded-xl",
  },
  shadows: {
    small: "shadow-sm",
    medium: "shadow-md",
    large: "shadow-lg",
  },
  animation: {
    duration: "duration-200",
    easing: "ease-in-out",
  },
  typography: {
    title: "text-sm font-medium",
    body: "text-sm",
    caption: "text-xs",
    code: "text-xs font-mono",
  },
};

// Dark theme variant
export const darkTheme: Partial<ValidationTheme> = {
  colors: {
    error: {
      primary: "red-400",
      secondary: "red-900",
      background: "red-950",
      border: "red-800",
      text: "red-200",
      textSecondary: "red-300",
    },
    warning: {
      primary: "yellow-400",
      secondary: "yellow-900",
      background: "yellow-950",
      border: "yellow-800",
      text: "yellow-200",
      textSecondary: "yellow-300",
    },
    info: {
      primary: "blue-400",
      secondary: "blue-900",
      background: "blue-950",
      border: "blue-800",
      text: "blue-200",
      textSecondary: "blue-300",
    },
    success: {
      primary: "green-400",
      secondary: "green-900",
      background: "green-950",
      border: "green-800",
      text: "green-200",
      textSecondary: "green-300",
    },
    suggestion: {
      primary: "green-400",
      secondary: "green-900",
      background: "green-950",
      border: "green-800",
      text: "green-200",
      textSecondary: "green-300",
    },
  },
};

// Compact theme variant
export const compactTheme: Partial<ValidationTheme> = {
  spacing: {
    card: "p-2",
    item: "p-2",
    compact: "p-1",
    comfortable: "p-3",
  },
  borderRadius: {
    small: "rounded-sm",
    medium: "rounded",
    large: "rounded-lg",
  },
  typography: {
    title: "text-xs font-medium",
    body: "text-xs",
    caption: "text-xs",
    code: "text-xs font-mono",
  },
};

// Comfortable theme variant
export const comfortableTheme: Partial<ValidationTheme> = {
  spacing: {
    card: "p-6",
    item: "p-4",
    compact: "p-3",
    comfortable: "p-8",
  },
  borderRadius: {
    small: "rounded-lg",
    medium: "rounded-xl",
    large: "rounded-2xl",
  },
  typography: {
    title: "text-base font-medium",
    body: "text-sm",
    caption: "text-sm",
    code: "text-sm font-mono",
  },
};

const ValidationThemeContext = createContext<ValidationTheme>(defaultTheme);

export const ValidationThemeProvider: React.FC<{
  theme?: Partial<ValidationTheme>;
  variant?: "default" | "dark" | "compact" | "comfortable";
  children: React.ReactNode;
}> = ({ theme, variant = "default", children }) => {
  const mergedTheme = useMemo(() => {
    let baseTheme = defaultTheme;

    // Apply variant
    switch (variant) {
      case "dark":
        baseTheme = { ...defaultTheme, ...darkTheme };
        break;
      case "compact":
        baseTheme = { ...defaultTheme, ...compactTheme };
        break;
      case "comfortable":
        baseTheme = { ...defaultTheme, ...comfortableTheme };
        break;
    }

    // Apply custom theme overrides
    if (theme) {
      return {
        ...baseTheme,
        colors: { ...baseTheme.colors, ...theme.colors },
        spacing: { ...baseTheme.spacing, ...theme.spacing },
        borderRadius: { ...baseTheme.borderRadius, ...theme.borderRadius },
        shadows: { ...baseTheme.shadows, ...theme.shadows },
        animation: { ...baseTheme.animation, ...theme.animation },
        typography: { ...baseTheme.typography, ...theme.typography },
      };
    }

    return baseTheme;
  }, [theme, variant]);

  return (
    <ValidationThemeContext.Provider value={mergedTheme}>
      {children}
    </ValidationThemeContext.Provider>
  );
};

export const useValidationTheme = () => {
  const context = useContext(ValidationThemeContext);
  if (!context) {
    throw new Error("useValidationTheme must be used within a ValidationThemeProvider");
  }
  return context;
};

// Utility hook for generating theme-based classes
export const useValidationClasses = (type: keyof ValidationTheme["colors"]) => {
  const theme = useValidationTheme();

  return useMemo(() => {
    const colors = theme.colors[type];

    return {
      // Card classes
      card: `border-${colors.border} bg-${colors.background} dark:border-${colors.border} dark:bg-${colors.background} ${theme.spacing.card} ${theme.borderRadius.medium}`,

      // Title classes
      title: `text-${colors.text} dark:text-${colors.text} ${theme.typography.title}`,

      // Item classes
      item: `bg-white dark:bg-gray-800 border border-${colors.border} dark:border-${colors.border} ${theme.spacing.item} ${theme.borderRadius.medium}`,

      // Text classes
      text: `text-${colors.text} dark:text-${colors.text} ${theme.typography.body}`,
      textSecondary: `text-${colors.textSecondary} dark:text-${colors.textSecondary} ${theme.typography.caption}`,

      // Badge classes
      badge: `bg-${colors.secondary} text-${colors.text} dark:bg-${colors.secondary} dark:text-${colors.text} ${theme.typography.caption}`,

      // Icon classes
      icon: `text-${colors.primary}`,

      // Button classes
      button: `bg-${colors.secondary} hover:bg-${colors.border} text-${colors.text} dark:bg-${colors.secondary} dark:hover:bg-${colors.border} dark:text-${colors.text}`,

      // Progress classes
      progress: `bg-${colors.primary}`,
      progressBackground: `bg-${colors.secondary}`,

      // Animation classes
      transition: `transition-all ${theme.animation.duration} ${theme.animation.easing}`,
    };
  }, [theme, type]);
};

// Utility hook for responsive spacing
export const useValidationSpacing = (size: keyof ValidationTheme["spacing"] = "item") => {
  const theme = useValidationTheme();
  return theme.spacing[size];
};

// Utility hook for responsive border radius
export const useValidationBorderRadius = (
  size: keyof ValidationTheme["borderRadius"] = "medium",
) => {
  const theme = useValidationTheme();
  return theme.borderRadius[size];
};

// Utility hook for typography
export const useValidationTypography = (variant: keyof ValidationTheme["typography"] = "body") => {
  const theme = useValidationTheme();
  return theme.typography[variant];
};

export default ValidationThemeProvider;
