import * as React from "react";
import { cn } from "./utils";

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> { }

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(
                    "flex h-10 w-full rounded-md border border-[var(--sys-border-hairline)] bg-[var(--sys-bg-primary)] px-3 py-2 text-sm text-[var(--sys-text-primary)] ring-offset-[var(--sys-bg-primary)] file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[var(--sys-text-tertiary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sys-accent)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    className
                )}
                ref={ref}
                {...props}
            />
        );
    }
);
Input.displayName = "Input";

export { Input };
