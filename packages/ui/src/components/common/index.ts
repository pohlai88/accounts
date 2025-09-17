/**
 * Common Components Index
 *
 * Shared components for error handling, accessibility, and responsive design
 */

export { ErrorBoundary, ErrorBoundaryProvider, DefaultErrorFallback, MinimalErrorFallback, useErrorHandler } from "./ErrorBoundary.js";
export { AccessibilityProvider, AccessibilityToolbar, useAccessibility, useAccessibilityPreferences, useAccessibilityAnnouncements } from "./AccessibilityProvider.js";
export { ResponsiveProvider, ResponsiveComponent, ResponsiveHide, ResponsiveShow, ResponsiveGrid, ResponsiveDebug, useResponsive, useBreakpoint, useDeviceType, useOrientation, useScreenSize, useTouchEnabled, ResponsiveUtils } from "./ResponsiveProvider.js";

export type {
    CustomErrorInfo,
    ErrorReport,
    ErrorBoundaryProps,
    ErrorBoundaryState,
    ErrorFallbackProps
} from "./ErrorBoundary.js";

export type {
    AccessibilityPreferences,
    AccessibilityContextType,
    AccessibilityViolation,
    AccessibilityProviderProps,
    AccessibilityToolbarProps
} from "./AccessibilityProvider.js";

export type {
    ResponsiveBreakpoint,
    ResponsiveContextType,
    ResponsiveProviderProps,
    ResponsiveComponentProps,
    ResponsiveHideProps,
    ResponsiveShowProps,
    ResponsiveGridProps,
    ResponsiveDebugProps
} from "./ResponsiveProvider.js";
