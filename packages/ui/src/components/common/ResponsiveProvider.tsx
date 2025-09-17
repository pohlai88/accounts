// Complete Mobile Optimization
// DoD: Complete mobile optimization
// SSOT: Use existing design system tokens
// Tech Stack: React + responsive design

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
    DevicePhoneMobileIcon,
    DeviceTabletIcon,
    ComputerDesktopIcon,
    TvIcon,
} from "@heroicons/react/24/outline";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ResponsiveBreakpoint {
    name: string;
    minWidth: number;
    maxWidth?: number;
    icon: React.ComponentType<any>;
    description: string;
}

export interface ResponsiveContextType {
    breakpoint: ResponsiveBreakpoint;
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    isLargeDesktop: boolean;
    orientation: "portrait" | "landscape";
    deviceType: "mobile" | "tablet" | "desktop" | "tv";
    screenSize: {
        width: number;
        height: number;
    };
    touchEnabled: boolean;
    highDPI: boolean;
    updateBreakpoint: (breakpoint: ResponsiveBreakpoint) => void;
}

export interface ResponsiveProviderProps {
    children: ReactNode;
    customBreakpoints?: ResponsiveBreakpoint[];
    enableOrientationDetection?: boolean;
    enableTouchDetection?: boolean;
    enableDPIDetection?: boolean;
    className?: string;
}

// ============================================================================
// DEFAULT BREAKPOINTS
// ============================================================================

const defaultBreakpoints: ResponsiveBreakpoint[] = [
    {
        name: "mobile",
        minWidth: 0,
        maxWidth: 767,
        icon: DevicePhoneMobileIcon,
        description: "Mobile devices (0-767px)",
    },
    {
        name: "tablet",
        minWidth: 768,
        maxWidth: 1023,
        icon: DeviceTabletIcon,
        description: "Tablet devices (768-1023px)",
    },
    {
        name: "desktop",
        minWidth: 1024,
        maxWidth: 1439,
        icon: ComputerDesktopIcon,
        description: "Desktop devices (1024-1439px)",
    },
    {
        name: "large-desktop",
        minWidth: 1440,
        icon: TvIcon,
        description: "Large desktop devices (1440px+)",
    },
];

// ============================================================================
// RESPONSIVE CONTEXT
// ============================================================================

const ResponsiveContext = createContext<ResponsiveContextType | undefined>(undefined);

// ============================================================================
// RESPONSIVE PROVIDER COMPONENT
// ============================================================================

export function ResponsiveProvider({
    children,
    customBreakpoints = [],
    enableOrientationDetection = true,
    enableTouchDetection = true,
    enableDPIDetection = true,
    className,
}: ResponsiveProviderProps) {
    const breakpoints = customBreakpoints.length > 0 ? customBreakpoints : defaultBreakpoints;

    const [breakpoint, setBreakpoint] = useState<ResponsiveBreakpoint>(breakpoints[0] as ResponsiveBreakpoint || "mobile");
    const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
    const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });
    const [touchEnabled, setTouchEnabled] = useState(false);
    const [highDPI, setHighDPI] = useState(false);

    // Update breakpoint based on screen width
    const updateBreakpoint = (width: number) => {
        const currentBreakpoint = breakpoints.find(bp =>
            width >= bp.minWidth && (bp.maxWidth === undefined || width <= bp.maxWidth)
        ) || breakpoints[breakpoints.length - 1];

        setBreakpoint((currentBreakpoint as ResponsiveBreakpoint) || "mobile");
    };

    // Update screen size and breakpoint
    const updateScreenSize = () => {
        const width = window.innerWidth;
        const height = window.innerHeight;

        setScreenSize({ width, height });
        updateBreakpoint(width);

        // Update orientation
        if (enableOrientationDetection) {
            setOrientation(width > height ? "landscape" : "portrait");
        }
    };

    // Detect touch capability
    const detectTouch = () => {
        if (enableTouchDetection) {
            setTouchEnabled(
                "ontouchstart" in window ||
                navigator.maxTouchPoints > 0 ||
                (navigator as any).msMaxTouchPoints > 0
            );
        }
    };

    // Detect high DPI
    const detectDPI = () => {
        if (enableDPIDetection) {
            setHighDPI(window.devicePixelRatio > 1);
        }
    };

    // Set up event listeners
    useEffect(() => {
        // Initial setup
        updateScreenSize();
        detectTouch();
        detectDPI();

        // Add event listeners
        window.addEventListener("resize", updateScreenSize);
        window.addEventListener("orientationchange", updateScreenSize);

        // Cleanup
        return () => {
            window.removeEventListener("resize", updateScreenSize);
            window.removeEventListener("orientationchange", updateScreenSize);
        };
    }, [enableOrientationDetection, enableTouchDetection, enableDPIDetection]);

    // Determine device type
    const deviceType = breakpoint.name === "mobile" ? "mobile" :
        breakpoint.name === "tablet" ? "tablet" :
            breakpoint.name === "large-desktop" ? "tv" : "desktop";

    // Determine responsive states
    const isMobile = breakpoint.name === "mobile";
    const isTablet = breakpoint.name === "tablet";
    const isDesktop = breakpoint.name === "desktop";
    const isLargeDesktop = breakpoint.name === "large-desktop";

    const contextValue: ResponsiveContextType = {
        breakpoint,
        isMobile,
        isTablet,
        isDesktop,
        isLargeDesktop,
        orientation,
        deviceType,
        screenSize,
        touchEnabled,
        highDPI,
        updateBreakpoint: (bp) => setBreakpoint(bp),
    };

    return (
        <ResponsiveContext.Provider value={contextValue}>
            <div
                className={className}
                data-breakpoint={breakpoint.name}
                data-orientation={orientation}
                data-device-type={deviceType}
                data-touch-enabled={touchEnabled}
                data-high-dpi={highDPI}
            >
                {children}
            </div>
        </ResponsiveContext.Provider>
    );
}

// ============================================================================
// HOOKS
// ============================================================================

export function useResponsive(): ResponsiveContextType {
    const context = useContext(ResponsiveContext);
    if (!context) {
        throw new Error("useResponsive must be used within a ResponsiveProvider");
    }
    return context;
}

export function useBreakpoint(): ResponsiveBreakpoint {
    const { breakpoint } = useResponsive();
    return breakpoint;
}

export function useDeviceType(): "mobile" | "tablet" | "desktop" | "tv" {
    const { deviceType } = useResponsive();
    return deviceType;
}

export function useOrientation(): "portrait" | "landscape" {
    const { orientation } = useResponsive();
    return orientation;
}

export function useScreenSize(): { width: number; height: number } {
    const { screenSize } = useResponsive();
    return screenSize;
}

export function useTouchEnabled(): boolean {
    const { touchEnabled } = useResponsive();
    return touchEnabled;
}

// ============================================================================
// RESPONSIVE UTILITIES
// ============================================================================

export class ResponsiveUtils {
    static getResponsiveClasses(classes: {
        mobile?: string;
        tablet?: string;
        desktop?: string;
        largeDesktop?: string;
    }): string {
        const { breakpoint } = useResponsive();

        switch (breakpoint.name) {
            case "mobile":
                return classes.mobile || "";
            case "tablet":
                return classes.tablet || "";
            case "desktop":
                return classes.desktop || "";
            case "large-desktop":
                return classes.largeDesktop || "";
            default:
                return "";
        }
    }

    static getResponsiveValue<T>(values: {
        mobile?: T;
        tablet?: T;
        desktop?: T;
        largeDesktop?: T;
    }): T | undefined {
        const { breakpoint } = useResponsive();

        switch (breakpoint.name) {
            case "mobile":
                return values.mobile;
            case "tablet":
                return values.tablet;
            case "desktop":
                return values.desktop;
            case "large-desktop":
                return values.largeDesktop;
            default:
                return undefined;
        }
    }

    static isBreakpoint(breakpointName: string): boolean {
        const { breakpoint } = useResponsive();
        return breakpoint.name === breakpointName;
    }

    static isAboveBreakpoint(breakpointName: string): boolean {
        const { breakpoint } = useResponsive();
        const targetBreakpoint = defaultBreakpoints.find(bp => bp.name === breakpointName);

        if (!targetBreakpoint) return false;

        return breakpoint.minWidth > targetBreakpoint.minWidth;
    }

    static isBelowBreakpoint(breakpointName: string): boolean {
        const { breakpoint } = useResponsive();
        const targetBreakpoint = defaultBreakpoints.find(bp => bp.name === breakpointName);

        if (!targetBreakpoint) return false;

        return breakpoint.minWidth < targetBreakpoint.minWidth;
    }
}

// ============================================================================
// RESPONSIVE COMPONENTS
// ============================================================================

export interface ResponsiveComponentProps {
    children: ReactNode;
    mobile?: ReactNode;
    tablet?: ReactNode;
    desktop?: ReactNode;
    largeDesktop?: ReactNode;
    fallback?: ReactNode;
}

export function ResponsiveComponent({
    children,
    mobile,
    tablet,
    desktop,
    largeDesktop,
    fallback,
}: ResponsiveComponentProps) {
    const { breakpoint } = useResponsive();

    const getContent = () => {
        switch (breakpoint.name) {
            case "mobile":
                return mobile || children || fallback;
            case "tablet":
                return tablet || children || fallback;
            case "desktop":
                return desktop || children || fallback;
            case "large-desktop":
                return largeDesktop || children || fallback;
            default:
                return children || fallback;
        }
    };

    return <>{getContent()}</>;
}

export interface ResponsiveHideProps {
    children: ReactNode;
    mobile?: boolean;
    tablet?: boolean;
    desktop?: boolean;
    largeDesktop?: boolean;
}

export function ResponsiveHide({
    children,
    mobile = false,
    tablet = false,
    desktop = false,
    largeDesktop = false,
}: ResponsiveHideProps) {
    const { breakpoint } = useResponsive();

    const shouldHide = () => {
        switch (breakpoint.name) {
            case "mobile":
                return mobile;
            case "tablet":
                return tablet;
            case "desktop":
                return desktop;
            case "large-desktop":
                return largeDesktop;
            default:
                return false;
        }
    };

    if (shouldHide()) {
        return null;
    }

    return <>{children}</>;
}

export interface ResponsiveShowProps {
    children: ReactNode;
    mobile?: boolean;
    tablet?: boolean;
    desktop?: boolean;
    largeDesktop?: boolean;
}

export function ResponsiveShow({
    children,
    mobile = false,
    tablet = false,
    desktop = false,
    largeDesktop = false,
}: ResponsiveShowProps) {
    const { breakpoint } = useResponsive();

    const shouldShow = () => {
        switch (breakpoint.name) {
            case "mobile":
                return mobile;
            case "tablet":
                return tablet;
            case "desktop":
                return desktop;
            case "large-desktop":
                return largeDesktop;
            default:
                return false;
        }
    };

    if (!shouldShow()) {
        return null;
    }

    return <>{children}</>;
}

// ============================================================================
// RESPONSIVE GRID COMPONENT
// ============================================================================

export interface ResponsiveGridProps {
    children: ReactNode;
    mobileColumns?: number;
    tabletColumns?: number;
    desktopColumns?: number;
    largeDesktopColumns?: number;
    gap?: number;
    className?: string;
}

export function ResponsiveGrid({
    children,
    mobileColumns = 1,
    tabletColumns = 2,
    desktopColumns = 3,
    largeDesktopColumns = 4,
    gap = 4,
    className,
}: ResponsiveGridProps) {
    const { breakpoint } = useResponsive();

    const getColumns = () => {
        switch (breakpoint.name) {
            case "mobile":
                return mobileColumns;
            case "tablet":
                return tabletColumns;
            case "desktop":
                return desktopColumns;
            case "large-desktop":
                return largeDesktopColumns;
            default:
                return desktopColumns;
        }
    };

    const columns = getColumns();

    return (
        <div
            className={`grid gap-${gap} ${className || ""}`}
            style={{
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            }}
        >
            {children}
        </div>
    );
}

// ============================================================================
// RESPONSIVE DEBUG COMPONENT
// ============================================================================

export interface ResponsiveDebugProps {
    showBreakpoint?: boolean;
    showScreenSize?: boolean;
    showOrientation?: boolean;
    showDeviceType?: boolean;
    showTouchEnabled?: boolean;
    showHighDPI?: boolean;
    className?: string;
}

export function ResponsiveDebug({
    showBreakpoint = true,
    showScreenSize = true,
    showOrientation = true,
    showDeviceType = true,
    showTouchEnabled = true,
    showHighDPI = true,
    className,
}: ResponsiveDebugProps) {
    const {
        breakpoint,
        screenSize,
        orientation,
        deviceType,
        touchEnabled,
        highDPI,
    } = useResponsive();

    if (process.env.NODE_ENV === "production") {
        return null;
    }

    return (
        <div className={`fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-3 rounded-lg text-xs font-mono z-50 ${className || ""}`}>
            <div className="space-y-1">
                {showBreakpoint && (
                    <div>Breakpoint: {breakpoint.name}</div>
                )}
                {showScreenSize && (
                    <div>Screen: {screenSize.width}×{screenSize.height}</div>
                )}
                {showOrientation && (
                    <div>Orientation: {orientation}</div>
                )}
                {showDeviceType && (
                    <div>Device: {deviceType}</div>
                )}
                {showTouchEnabled && (
                    <div>Touch: {touchEnabled ? "Yes" : "No"}</div>
                )}
                {showHighDPI && (
                    <div>High DPI: {highDPI ? "Yes" : "No"}</div>
                )}
            </div>
        </div>
    );
}

export default ResponsiveProvider;
