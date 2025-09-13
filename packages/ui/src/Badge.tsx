import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./utils";

const badgeVariants = cva(
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)] focus:ring-offset-2",
    {
        variants: {
            variant: {
                default:
                    "border-transparent bg-[var(--sys-accent)] text-white hover:bg-[var(--sys-accent)]/80",
                secondary:
                    "border-transparent bg-[var(--sys-bg-subtle)] text-[var(--sys-text-primary)] hover:bg-[var(--sys-bg-subtle)]/80",
                destructive:
                    "border-transparent bg-[var(--sys-status-error)] text-white hover:bg-[var(--sys-status-error)]/80",
                outline: "text-[var(--sys-text-primary)] border-[var(--sys-border-hairline)]",
                success:
                    "border-transparent bg-[var(--sys-status-success)] text-white hover:bg-[var(--sys-status-success)]/80",
                warning:
                    "border-transparent bg-[var(--sys-status-warning)] text-white hover:bg-[var(--sys-status-warning)]/80",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    );
}

export { Badge, badgeVariants };
