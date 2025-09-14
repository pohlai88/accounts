/**
 * Typography Component - Steve Jobs Inspired
 *
 * "Typography is the art and technique of arranging type"
 * Uses semantic tokens for consistent, accessible typography
 */

import React from "react";
import { cn } from "@aibos/ui/utils";

export interface TypographyProps {
  children: React.ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span" | "div" | "a";
}

export const Typography: React.FC<TypographyProps> = ({
  children,
  className,
  as: Component = "p",
}) => {
  return (
    <Component className={cn("text-sys-text-primary font-sans", className)}>{children}</Component>
  );
};

// Heading Components
export const H1: React.FC<Omit<TypographyProps, "as">> = ({ children, className }) => (
  <Typography as="h1" className={cn("text-4xl font-bold leading-tight", className)}>
    {children}
  </Typography>
);

export const H2: React.FC<Omit<TypographyProps, "as">> = ({ children, className }) => (
  <Typography as="h2" className={cn("text-3xl font-semibold leading-tight", className)}>
    {children}
  </Typography>
);

export const H3: React.FC<Omit<TypographyProps, "as">> = ({ children, className }) => (
  <Typography as="h3" className={cn("text-2xl font-semibold leading-tight", className)}>
    {children}
  </Typography>
);

export const H4: React.FC<Omit<TypographyProps, "as">> = ({ children, className }) => (
  <Typography as="h4" className={cn("text-xl font-medium leading-tight", className)}>
    {children}
  </Typography>
);

export const H5: React.FC<Omit<TypographyProps, "as">> = ({ children, className }) => (
  <Typography as="h5" className={cn("text-lg font-medium leading-tight", className)}>
    {children}
  </Typography>
);

export const H6: React.FC<Omit<TypographyProps, "as">> = ({ children, className }) => (
  <Typography as="h6" className={cn("text-base font-medium leading-tight", className)}>
    {children}
  </Typography>
);

// Body Text Components
export const Body: React.FC<Omit<TypographyProps, "as">> = ({ children, className }) => (
  <Typography as="p" className={cn("text-base leading-normal", className)}>
    {children}
  </Typography>
);

export const BodySmall: React.FC<Omit<TypographyProps, "as">> = ({ children, className }) => (
  <Typography as="p" className={cn("text-sm leading-normal", className)}>
    {children}
  </Typography>
);

export const Caption: React.FC<Omit<TypographyProps, "as">> = ({ children, className }) => (
  <Typography as="span" className={cn("text-xs leading-normal text-sys-text-secondary", className)}>
    {children}
  </Typography>
);

// Link Component
export const Link: React.FC<
  Omit<TypographyProps, "as"> & { href?: string; onClick?: () => void }
> = ({ children, className, href, onClick }) => (
  <a
    href={href}
    onClick={onClick}
    className={cn(
      "text-sys-text-link hover:text-brand-primary transition-colors cursor-pointer",
      className,
    )}
  >
    {children}
  </a>
);

export default Typography;
