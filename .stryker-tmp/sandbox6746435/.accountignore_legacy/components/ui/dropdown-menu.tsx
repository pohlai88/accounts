// @ts-nocheck
import * as React from "react";

type Item = { label: string; onSelect?: () => void; disabled?: boolean };
type Props = { trigger: React.ReactNode; items: Item[]; align?: "start" | "center" | "end" };

export function DropdownMenu({ trigger, items, align = "start" }: Props) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="outline-none"
      >
        {trigger}
      </button>
      {open && (
        <div
          role="menu"
          className={`absolute z-50 mt-2 min-w-40 rounded-xl border bg-white/95 shadow-xl backdrop-blur p-1
                         ${align === "end" ? "right-0" : align === "center" ? "left-1/2 -translate-x-1/2" : "left-0"}`}
        >
          {items.map((it, i) => (
            <button
              key={i}
              role="menuitem"
              disabled={it.disabled}
              onClick={() => {
                it.onSelect?.();
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-black/5 disabled:opacity-50"
            >
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Re-export common patterns for compatibility
export const DropdownMenuContent = ({ children, ...props }: { children: React.ReactNode }) => (
  <div {...props}>{children}</div>
);
export const DropdownMenuTrigger = ({ children, ...props }: { children: React.ReactNode }) => (
  <div {...props}>{children}</div>
);
export const DropdownMenuItem = ({ children, ...props }: { children: React.ReactNode }) => (
  <div {...props}>{children}</div>
);
export const DropdownMenuLabel = ({ children, ...props }: { children: React.ReactNode }) => (
  <div {...props}>{children}</div>
);
export const DropdownMenuSeparator = (props: any) => (
  <hr {...props} className="my-1 border-gray-200" />
);
