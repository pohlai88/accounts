// Accessibility Compliance Provider
// DoD: WCAG 2.2 AAA compliance
// SSOT: Use existing design system tokens
// Tech Stack: React + accessibility testing

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
    SpeakerWaveIcon,
    SpeakerXMarkIcon,
    SunIcon,
    MoonIcon,
    AdjustmentsHorizontalIcon,
    EyeIcon,
    EyeSlashIcon,
} from "@heroicons/react/24/outline";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface AccessibilityPreferences {
    // Visual preferences
    fontSize: "small" | "medium" | "large" | "extra-large";
    contrast: "normal" | "high" | "extra-high";
    colorScheme: "light" | "dark" | "auto";
    reduceMotion: boolean;
    reduceTransparency: boolean;

    // Audio preferences
    screenReader: boolean;
    audioDescriptions: boolean;
    volume: number; // 0-100

    // Interaction preferences
    keyboardNavigation: boolean;
    focusVisible: boolean;
    hoverEffects: boolean;
    clickTargetSize: "small" | "medium" | "large";

    // Cognitive preferences
    simplifiedLayout: boolean;
    readingMode: boolean;
    autoComplete: boolean;
    errorPrevention: boolean;
}

export interface AccessibilityContextType {
    preferences: AccessibilityPreferences;
    updatePreference: <K extends keyof AccessibilityPreferences>(
        key: K,
        value: AccessibilityPreferences[K]
    ) => void;
    resetPreferences: () => void;
    isCompliant: boolean;
    complianceScore: number;
    violations: AccessibilityViolation[];
    announce: (message: string, priority?: "polite" | "assertive") => void;
    setFocus: (elementId: string) => void;
    skipToContent: () => void;
    toggleScreenReader: () => void;
    toggleHighContrast: () => void;
    toggleReducedMotion: () => void;
}

export interface AccessibilityViolation {
    id: string;
    type: "error" | "warning" | "info";
    rule: string;
    element: string;
    message: string;
    impact: "minor" | "moderate" | "serious" | "critical";
    help: string;
}

// ============================================================================
// DEFAULT PREFERENCES
// ============================================================================

const defaultPreferences: AccessibilityPreferences = {
    fontSize: "medium",
    contrast: "normal",
    colorScheme: "auto",
    reduceMotion: false,
    reduceTransparency: false,
    screenReader: false,
    audioDescriptions: false,
    volume: 50,
    keyboardNavigation: true,
    focusVisible: true,
    hoverEffects: true,
    clickTargetSize: "medium",
    simplifiedLayout: false,
    readingMode: false,
    autoComplete: true,
    errorPrevention: true,
};

// ============================================================================
// ACCESSIBILITY CONTEXT
// ============================================================================

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

// ============================================================================
// ACCESSIBILITY AUDITOR
// ============================================================================

class AccessibilityAuditor {
    private violations: AccessibilityViolation[] = [];

    audit(): AccessibilityViolation[] {
        this.violations = [];

        // Check for missing alt text
        this.checkAltText();

        // Check for proper heading structure
        this.checkHeadingStructure();

        // Check for proper form labels
        this.checkFormLabels();

        // Check for proper ARIA attributes
        this.checkARIA();

        // Check for color contrast
        this.checkColorContrast();

        // Check for keyboard navigation
        this.checkKeyboardNavigation();

        // Check for focus management
        this.checkFocusManagement();

        return this.violations;
    }

    private checkAltText(): void {
        const images = document.querySelectorAll("img");
        images.forEach((img, index) => {
            if (!img.alt && !img.getAttribute("aria-label")) {
                this.violations.push({
                    id: `alt-text-${index}`,
                    type: "error",
                    rule: "WCAG 2.2.1.1",
                    element: img.tagName,
                    message: "Image missing alt text",
                    impact: "serious",
                    help: "Add alt text to describe the image content",
                });
            }
        });
    }

    private checkHeadingStructure(): void {
        const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
        let previousLevel = 0;

        headings.forEach((heading, index) => {
            const level = parseInt(heading.tagName.charAt(1));

            if (level > previousLevel + 1) {
                this.violations.push({
                    id: `heading-structure-${index}`,
                    type: "warning",
                    rule: "WCAG 2.2.1.3",
                    element: heading.tagName,
                    message: "Heading level skipped",
                    impact: "moderate",
                    help: "Ensure heading levels are not skipped",
                });
            }

            previousLevel = level;
        });
    }

    private checkFormLabels(): void {
        const inputs = document.querySelectorAll("input, textarea, select");
        inputs.forEach((input, index) => {
            const id = input.getAttribute("id");
            const ariaLabel = input.getAttribute("aria-label");
            const ariaLabelledBy = input.getAttribute("aria-labelledby");

            if (!id && !ariaLabel && !ariaLabelledBy) {
                this.violations.push({
                    id: `form-label-${index}`,
                    type: "error",
                    rule: "WCAG 2.2.1.1",
                    element: input.tagName,
                    message: "Form control missing label",
                    impact: "serious",
                    help: "Add a label or aria-label to the form control",
                });
            }
        });
    }

    private checkARIA(): void {
        const elementsWithAria = document.querySelectorAll("[aria-expanded], [aria-selected], [aria-checked]");
        elementsWithAria.forEach((element, index) => {
            const role = element.getAttribute("role");
            const ariaExpanded = element.getAttribute("aria-expanded");
            const ariaSelected = element.getAttribute("aria-selected");
            const ariaChecked = element.getAttribute("aria-checked");

            if (ariaExpanded && !role) {
                this.violations.push({
                    id: `aria-role-${index}`,
                    type: "warning",
                    rule: "WCAG 2.2.4.3",
                    element: element.tagName,
                    message: "Element with aria-expanded missing role",
                    impact: "moderate",
                    help: "Add appropriate role attribute",
                });
            }
        });
    }

    private checkColorContrast(): void {
        // This would require more sophisticated color analysis
        // For now, we'll check for common contrast issues
        const elements = document.querySelectorAll("*");
        elements.forEach((element, index) => {
            const style = window.getComputedStyle(element);
            const color = style.color;
            const backgroundColor = style.backgroundColor;

            // Basic check for transparent backgrounds with text
            if (backgroundColor === "rgba(0, 0, 0, 0)" && color !== "rgba(0, 0, 0, 0)") {
                this.violations.push({
                    id: `color-contrast-${index}`,
                    type: "warning",
                    rule: "WCAG 2.2.1.4",
                    element: element.tagName,
                    message: "Potential color contrast issue",
                    impact: "moderate",
                    help: "Ensure sufficient color contrast between text and background",
                });
            }
        });
    }

    private checkKeyboardNavigation(): void {
        const interactiveElements = document.querySelectorAll("button, a, input, textarea, select, [tabindex]");
        interactiveElements.forEach((element, index) => {
            const tabIndex = element.getAttribute("tabindex");

            if (tabIndex === "-1" && element.getAttribute("aria-hidden") !== "true") {
                this.violations.push({
                    id: `keyboard-nav-${index}`,
                    type: "warning",
                    rule: "WCAG 2.2.2.1",
                    element: element.tagName,
                    message: "Element not keyboard accessible",
                    impact: "moderate",
                    help: "Ensure element is keyboard accessible",
                });
            }
        });
    }

    private checkFocusManagement(): void {
        const focusableElements = document.querySelectorAll("button, a, input, textarea, select, [tabindex]:not([tabindex='-1'])");

        if (focusableElements.length === 0) {
            this.violations.push({
                id: "focus-management-1",
                type: "error",
                rule: "WCAG 2.2.2.1",
                element: "document",
                message: "No keyboard accessible elements found",
                impact: "critical",
                help: "Ensure page has keyboard accessible elements",
            });
        }
    }
}

// ============================================================================
// ACCESSIBILITY PROVIDER COMPONENT
// ============================================================================

export interface AccessibilityProviderProps {
    children: ReactNode;
    initialPreferences?: Partial<AccessibilityPreferences>;
    enableAuditing?: boolean;
    enableAnnouncements?: boolean;
    className?: string;
}

export function AccessibilityProvider({
    children,
    initialPreferences = {},
    enableAuditing = true,
    enableAnnouncements = true,
    className,
}: AccessibilityProviderProps) {
    const [preferences, setPreferences] = useState<AccessibilityPreferences>({
        ...defaultPreferences,
        ...initialPreferences,
    });

    const [violations, setViolations] = useState<AccessibilityViolation[]>([]);
    const [complianceScore, setComplianceScore] = useState(100);
    const [announcementQueue, setAnnouncementQueue] = useState<string[]>([]);

    // Load preferences from localStorage
    useEffect(() => {
        const savedPreferences = localStorage.getItem("accessibility-preferences");
        if (savedPreferences) {
            try {
                const parsed = JSON.parse(savedPreferences);
                setPreferences(prev => ({ ...prev, ...parsed }));
            } catch (error) {
                console.error("Failed to load accessibility preferences:", error);
            }
        }
    }, []);

    // Save preferences to localStorage
    useEffect(() => {
        localStorage.setItem("accessibility-preferences", JSON.stringify(preferences));
    }, [preferences]);

    // Apply accessibility preferences
    useEffect(() => {
        applyAccessibilityPreferences(preferences);
    }, [preferences]);

    // Run accessibility audit
    useEffect(() => {
        if (enableAuditing) {
            const auditor = new AccessibilityAuditor();
            const newViolations = auditor.audit();
            setViolations(newViolations);

            // Calculate compliance score
            const totalChecks = 10; // Approximate number of checks
            const violationCount = newViolations.length;
            const score = Math.max(0, Math.round(((totalChecks - violationCount) / totalChecks) * 100));
            setComplianceScore(score);
        }
    }, [enableAuditing]);

    // Handle announcements
    useEffect(() => {
        if (enableAnnouncements && announcementQueue.length > 0) {
            const message = announcementQueue[0];
            announceToScreenReader(message || "");
            setAnnouncementQueue(prev => prev.slice(1));
        }
    }, [announcementQueue, enableAnnouncements]);

    const updatePreference = <K extends keyof AccessibilityPreferences>(
        key: K,
        value: AccessibilityPreferences[K]
    ): void => {
        setPreferences(prev => ({ ...prev, [key]: value }));
    };

    const resetPreferences = (): void => {
        setPreferences(defaultPreferences);
    };

    const announce = (message: string, priority: "polite" | "assertive" = "polite"): void => {
        if (enableAnnouncements) {
            setAnnouncementQueue(prev => [...prev, message]);
        }
    };

    const setFocus = (elementId: string): void => {
        const element = document.getElementById(elementId);
        if (element) {
            element.focus();
        }
    };

    const skipToContent = (): void => {
        const mainContent = document.querySelector("main") || document.querySelector("[role='main']");
        if (mainContent) {
            (mainContent as HTMLElement).focus();
            announce("Skipped to main content");
        }
    };

    const toggleScreenReader = (): void => {
        updatePreference("screenReader", !preferences.screenReader);
        announce(preferences.screenReader ? "Screen reader disabled" : "Screen reader enabled");
    };

    const toggleHighContrast = (): void => {
        const newContrast = preferences.contrast === "normal" ? "high" : "normal";
        updatePreference("contrast", newContrast);
        announce(`Contrast set to ${newContrast}`);
    };

    const toggleReducedMotion = (): void => {
        updatePreference("reduceMotion", !preferences.reduceMotion);
        announce(preferences.reduceMotion ? "Motion effects enabled" : "Motion effects reduced");
    };

    const isCompliant = complianceScore >= 90;

    const contextValue: AccessibilityContextType = {
        preferences,
        updatePreference,
        resetPreferences,
        isCompliant,
        complianceScore,
        violations,
        announce,
        setFocus,
        skipToContent,
        toggleScreenReader,
        toggleHighContrast,
        toggleReducedMotion,
    };

    return (
        <AccessibilityContext.Provider value={contextValue}>
            <div className={className}>
                {children}
                {enableAnnouncements && (
                    <div
                        id="accessibility-announcements"
                        aria-live="polite"
                        aria-atomic="true"
                        className="sr-only"
                    />
                )}
            </div>
        </AccessibilityContext.Provider>
    );
}

// ============================================================================
// ACCESSIBILITY UTILITIES
// ============================================================================

function applyAccessibilityPreferences(preferences: AccessibilityPreferences): void {
    const root = document.documentElement;

    // Font size
    root.style.setProperty("--font-size-scale", getFontSizeScale(preferences.fontSize));

    // Contrast
    root.style.setProperty("--contrast-level", getContrastLevel(preferences.contrast));

    // Color scheme
    if (preferences.colorScheme === "dark") {
        root.classList.add("dark");
    } else if (preferences.colorScheme === "light") {
        root.classList.remove("dark");
    } else {
        // Auto - use system preference
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        if (prefersDark) {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }
    }

    // Reduced motion
    if (preferences.reduceMotion) {
        root.classList.add("reduce-motion");
    } else {
        root.classList.remove("reduce-motion");
    }

    // Reduced transparency
    if (preferences.reduceTransparency) {
        root.classList.add("reduce-transparency");
    } else {
        root.classList.remove("reduce-transparency");
    }

    // High contrast
    if (preferences.contrast === "high" || preferences.contrast === "extra-high") {
        root.classList.add("high-contrast");
    } else {
        root.classList.remove("high-contrast");
    }

    // Focus visible
    if (preferences.focusVisible) {
        root.classList.add("focus-visible");
    } else {
        root.classList.remove("focus-visible");
    }

    // Hover effects
    if (!preferences.hoverEffects) {
        root.classList.add("no-hover-effects");
    } else {
        root.classList.remove("no-hover-effects");
    }

    // Click target size
    root.style.setProperty("--click-target-size", getClickTargetSize(preferences.clickTargetSize));
}

function getFontSizeScale(fontSize: string): string {
    switch (fontSize) {
        case "small": return "0.875";
        case "medium": return "1";
        case "large": return "1.125";
        case "extra-large": return "1.25";
        default: return "1";
    }
}

function getContrastLevel(contrast: string): string {
    switch (contrast) {
        case "normal": return "1";
        case "high": return "1.5";
        case "extra-high": return "2";
        default: return "1";
    }
}

function getClickTargetSize(size: string): string {
    switch (size) {
        case "small": return "32px";
        case "medium": return "44px";
        case "large": return "48px";
        default: return "44px";
    }
}

function announceToScreenReader(message: string): void {
    const announcement = document.getElementById("accessibility-announcements");
    if (announcement) {
        announcement.textContent = message;
    }
}

// ============================================================================
// HOOKS
// ============================================================================

export function useAccessibility(): AccessibilityContextType {
    const context = useContext(AccessibilityContext);
    if (!context) {
        throw new Error("useAccessibility must be used within an AccessibilityProvider");
    }
    return context;
}

export function useAccessibilityPreferences(): AccessibilityPreferences {
    const { preferences } = useAccessibility();
    return preferences;
}

export function useAccessibilityAnnouncements(): {
    announce: (message: string, priority?: "polite" | "assertive") => void;
} {
    const { announce } = useAccessibility();
    return { announce };
}

// ============================================================================
// ACCESSIBILITY TOOLBAR COMPONENT
// ============================================================================

export interface AccessibilityToolbarProps {
    className?: string;
}

export function AccessibilityToolbar({ className }: AccessibilityToolbarProps) {
    const {
        preferences,
        updatePreference,
        toggleScreenReader,
        toggleHighContrast,
        toggleReducedMotion,
        complianceScore,
        violations,
    } = useAccessibility();

    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={`accessibility-toolbar ${className || ""}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="accessibility-toolbar-toggle"
                aria-label="Open accessibility toolbar"
                aria-expanded={isOpen}
            >
                <AdjustmentsHorizontalIcon className="w-5 h-5" />
            </button>

            {isOpen && (
                <div className="accessibility-toolbar-panel">
                    <div className="accessibility-toolbar-header">
                        <h3>Accessibility Settings</h3>
                        <button
                            onClick={() => setIsOpen(false)}
                            aria-label="Close accessibility toolbar"
                        >
                            ×
                        </button>
                    </div>

                    <div className="accessibility-toolbar-content">
                        {/* Font Size */}
                        <div className="accessibility-setting">
                            <label>Font Size</label>
                            <select
                                value={preferences.fontSize}
                                onChange={(e) => updatePreference("fontSize", e.target.value as any)}
                            >
                                <option value="small">Small</option>
                                <option value="medium">Medium</option>
                                <option value="large">Large</option>
                                <option value="extra-large">Extra Large</option>
                            </select>
                        </div>

                        {/* Contrast */}
                        <div className="accessibility-setting">
                            <label>Contrast</label>
                            <button onClick={toggleHighContrast}>
                                {preferences.contrast === "normal" ? "High Contrast" : "Normal Contrast"}
                            </button>
                        </div>

                        {/* Motion */}
                        <div className="accessibility-setting">
                            <label>Motion</label>
                            <button onClick={toggleReducedMotion}>
                                {preferences.reduceMotion ? "Enable Motion" : "Reduce Motion"}
                            </button>
                        </div>

                        {/* Screen Reader */}
                        <div className="accessibility-setting">
                            <label>Screen Reader</label>
                            <button onClick={toggleScreenReader}>
                                {preferences.screenReader ? "Disable" : "Enable"}
                            </button>
                        </div>

                        {/* Compliance Score */}
                        <div className="accessibility-compliance">
                            <div className="compliance-score">
                                <span>Accessibility Score: {complianceScore}%</span>
                                <div className="compliance-bar">
                                    <div
                                        className="compliance-fill"
                                        style={{ width: `${complianceScore}%` }}
                                    />
                                </div>
                            </div>

                            {violations.length > 0 && (
                                <div className="violations">
                                    <h4>Issues Found ({violations.length})</h4>
                                    <ul>
                                        {violations.slice(0, 3).map(violation => (
                                            <li key={violation.id}>
                                                <strong>{violation.impact}:</strong> {violation.message}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AccessibilityProvider;
