import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./utils.js";
import { useAccessibility, type DesignMode } from "./AccessibilityProvider.js";

// ============================================================================
// BUTTON VARIANTS - Dual Mode Support
// ============================================================================

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // Aesthetic Mode - Beautiful, subtle design
        primary:
          "bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-pressed)] focus-visible:ring-[var(--brand-primary)]",
        secondary:
          "border border-[var(--sys-border-hairline)] text-[var(--sys-text-primary)] hover:bg-[var(--sys-bg-subtle)] focus-visible:ring-[var(--sys-accent)]",
        ghost:
          "text-[var(--sys-text-primary)] hover:bg-[var(--sys-bg-subtle)] focus-visible:ring-[var(--sys-accent)]",
        destructive:
          "bg-[var(--sys-status-error)] text-white hover:bg-[var(--sys-status-error)]/90 focus-visible:ring-[var(--sys-status-error)]",

        // Legacy variants for backward compatibility
        solid:
          "bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-pressed)] focus-visible:ring-[var(--brand-primary)]",
        outline:
          "border border-[var(--sys-border-hairline)] text-[var(--sys-text-primary)] hover:bg-[var(--sys-bg-subtle)] focus-visible:ring-[var(--sys-accent)]",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-10 px-4",
        lg: "h-11 px-5",
        icon: "h-10 w-10",
      },
      mode: {
        aesthetic: "",
        accessibility: "border-2 border-[var(--sys-border-hairline)] font-semibold",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      mode: "aesthetic",
    },
  },
);

// ============================================================================
// BUTTON PROPS
// ============================================================================

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  mode?: DesignMode;
}

// ============================================================================
// BUTTON COMPONENT
// ============================================================================

export function Button({ className, variant, size, mode, asChild: _asChild = false, ...props }: ButtonProps) {
  const { mode: currentMode } = useAccessibility();
  const effectiveMode = mode || currentMode;

  return (
    <button
      className={cn(buttonVariants({ variant, size, mode: effectiveMode, className }))}
      {...props}
    />
  );
}

// ============================================================================
// MODE-SPECIFIC BUTTON COMPONENTS
// ============================================================================

/**
 * Button that always renders in aesthetic mode
 */
export function AestheticButton(props: Omit<ButtonProps, "mode">) {
  return <Button {...props} mode="aesthetic" />;
}

/**
 * Button that always renders in accessibility mode (WCAG 2.2 AAA)
 */
export function AccessibilityButton(props: Omit<ButtonProps, "mode">) {
  return <Button {...props} mode="accessibility" />;
}

// ============================================================================
// BUTTON VARIANTS FOR DIFFERENT MODES
// ============================================================================

/**
 * Primary button with mode-specific styling
 */
export function PrimaryButton(props: ButtonProps) {
  return <Button {...props} variant="primary" />;
}

/**
 * Secondary button with mode-specific styling
 */
export function SecondaryButton(props: ButtonProps) {
  return <Button {...props} variant="secondary" />;
}

/**
 * Ghost button with mode-specific styling
 */
export function GhostButton(props: ButtonProps) {
  return <Button {...props} variant="ghost" />;
}

/**
 * Destructive button with mode-specific styling
 */
export function DestructiveButton(props: ButtonProps) {
  return <Button {...props} variant="destructive" />;
}
