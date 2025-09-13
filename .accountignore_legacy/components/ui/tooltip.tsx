import * as React from "react";

type Props = { content: React.ReactNode; children: React.ReactNode; side?: "top"|"right"|"bottom"|"left" };

export function Tooltip({ content, children, side="top" }: Props) {
  const [open, setOpen] = React.useState(false);
  return (
    <span className="relative inline-flex"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}>
      {children}
      {open && (
        <span role="tooltip"
              className={`absolute whitespace-nowrap px-2 py-1 text-xs rounded bg-black text-white shadow z-50
                          ${side==="top" ? "bottom-full mb-1 left-1/2 -translate-x-1/2"
                          : side==="bottom" ? "top-full mt-1 left-1/2 -translate-x-1/2"
                          : side==="right" ? "left-full ml-1 top-1/2 -translate-y-1/2"
                          : "right-full mr-1 top-1/2 -translate-y-1/2"}`}>
          {content}
        </span>
      )}
    </span>
  );
}

// Re-export common patterns for compatibility
export const TooltipProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const TooltipTrigger = ({ children, ...props }: { children: React.ReactNode }) => <div {...props}>{children}</div>;
export const TooltipContent = ({ children, ...props }: { children: React.ReactNode }) => <div {...props}>{children}</div>;
