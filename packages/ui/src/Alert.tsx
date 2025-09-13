import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./utils";

const alertVariants = cva(
    "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
    {
        variants: {
            variant: {
                default: "bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] border-[var(--sys-border-hairline)]",
                destructive:
                    "border-[var(--sys-status-error)]/50 text-[var(--sys-status-error)] dark:border-[var(--sys-status-error)] [&>svg]:text-[var(--sys-status-error)]",
                success:
                    "border-[var(--sys-status-success)]/50 text-[var(--sys-status-success)] dark:border-[var(--sys-status-success)] [&>svg]:text-[var(--sys-status-success)]",
                warning:
                    "border-[var(--sys-status-warning)]/50 text-[var(--sys-status-warning)] dark:border-[var(--sys-status-warning)] [&>svg]:text-[var(--sys-status-warning)]",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

const Alert = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
    <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
    />
));
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
    <h5
        ref={ref}
        className={cn("mb-1 font-medium leading-none tracking-tight", className)}
        {...props}
    />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("text-sm [&_p]:leading-relaxed", className)}
        {...props}
    />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };