/**
 * CommandPalette Component - Steve Jobs Inspired
 *
 * Universal search and actions - the most powerful tool
 * Cmd/Ctrl + K to search for transactions, contacts, reports, and actions
 */
// @ts-nocheck


import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  FileText,
  Receipt,
  CreditCard,
  User,
  BarChart3,
  Settings,
  Lock,
  ArrowRight,
  Clock,
  DollarSign,
} from "lucide-react";
import { cn } from "@aibos/ui/utils";

export interface CommandPaletteProps {
  className?: string;
  onCommand?: (command: Command) => void;
  onSearch?: (query: string) => void;
}

export interface Command {
  id: string;
  label: string;
  description?: string;
  icon: React.ComponentType<any>;
  category: string;
  shortcut?: string;
  keywords?: string[];
  action?: () => void;
}

const commands: Command[] = [
  // Actions
  {
    id: "create-invoice",
    label: "Create Invoice",
    description: "Create a new invoice for a customer",
    icon: FileText,
    category: "Actions",
    shortcut: "Cmd+N",
    keywords: ["invoice", "create", "customer", "bill"],
  },
  {
    id: "create-bill",
    label: "Create Bill",
    description: "Create a new bill from a vendor",
    icon: Receipt,
    category: "Actions",
    keywords: ["bill", "create", "vendor", "expense"],
  },
  {
    id: "reconcile-bank",
    label: "Reconcile Bank",
    description: "Reconcile bank transactions",
    icon: CreditCard,
    category: "Actions",
    keywords: ["reconcile", "bank", "transactions", "match"],
  },
  {
    id: "add-customer",
    label: "Add Customer",
    description: "Add a new customer",
    icon: User,
    category: "Actions",
    keywords: ["customer", "add", "contact", "client"],
  },
  {
    id: "add-vendor",
    label: "Add Vendor",
    description: "Add a new vendor",
    icon: User,
    category: "Actions",
    keywords: ["vendor", "add", "supplier", "contact"],
  },

  // Navigation
  {
    id: "view-reports",
    label: "View Reports",
    description: "Open the reports section",
    icon: BarChart3,
    category: "Navigation",
    shortcut: "g r",
    keywords: ["reports", "view", "analytics", "dashboard"],
  },
  {
    id: "view-invoices",
    label: "View Invoices",
    description: "Go to invoices list",
    icon: FileText,
    category: "Navigation",
    shortcut: "g s",
    keywords: ["invoices", "view", "list", "sell"],
  },
  {
    id: "view-bills",
    label: "View Bills",
    description: "Go to bills list",
    icon: Receipt,
    category: "Navigation",
    shortcut: "g b",
    keywords: ["bills", "view", "list", "buy"],
  },
  {
    id: "view-cash",
    label: "View Cash",
    description: "Go to cash management",
    icon: CreditCard,
    category: "Navigation",
    shortcut: "g c",
    keywords: ["cash", "bank", "transactions", "money"],
  },
  {
    id: "view-close",
    label: "View Close",
    description: "Go to period close",
    icon: Lock,
    category: "Navigation",
    shortcut: "g l",
    keywords: ["close", "period", "month-end", "lock"],
  },
  {
    id: "view-settings",
    label: "View Settings",
    description: "Open application settings",
    icon: Settings,
    category: "Navigation",
    shortcut: "g t",
    keywords: ["settings", "preferences", "config", "setup"],
  },

  // Quick Actions
  {
    id: "quick-payment",
    label: "Record Payment",
    description: "Record a payment received",
    icon: DollarSign,
    category: "Quick Actions",
    keywords: ["payment", "received", "cash", "money"],
  },
  {
    id: "quick-expense",
    label: "Record Expense",
    description: "Record a business expense",
    icon: Receipt,
    category: "Quick Actions",
    keywords: ["expense", "cost", "spend", "outgoing"],
  },
  {
    id: "quick-deposit",
    label: "Record Deposit",
    description: "Record a bank deposit",
    icon: CreditCard,
    category: "Quick Actions",
    keywords: ["deposit", "bank", "income", "incoming"],
  },
];

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  className,
  onCommand,
  onSearch,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }

      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const filteredCommands = commands.filter(command => {
    if (!query) return true;

    const searchTerm = query.toLowerCase();
    return (
      command.label.toLowerCase().includes(searchTerm) ||
      command.description?.toLowerCase().includes(searchTerm) ||
      command.keywords?.some(keyword => keyword.toLowerCase().includes(searchTerm)) ||
      command.category.toLowerCase().includes(searchTerm)
    );
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex(prev => (prev < filteredCommands.length - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : filteredCommands.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          handleCommand(filteredCommands[selectedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  };

  const handleCommand = (command: Command) => {
    onCommand?.(command);
    command.action?.();
    setIsOpen(false);
    setQuery("");
  };

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    onSearch?.(newQuery);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20"
      role="dialog"
      aria-modal="true"
      aria-labelledby="command-palette-title"
      aria-describedby="command-palette-description"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Command Palette */}
      <div
        className={cn(
          "relative w-full max-w-2xl mx-4 bg-sys-bg-raised rounded-lg border border-sys-border-hairline shadow-lg",
          className,
        )}
      >
        {/* Search Input */}
        <div className="flex items-center space-x-3 p-4 border-b border-sys-border-hairline">
          <Search className="h-5 w-5 text-sys-text-tertiary" aria-hidden="true" />
          <label htmlFor="command-search" className="sr-only">
            Search commands
          </label>
          <input
            ref={inputRef}
            id="command-search"
            type="search"
            placeholder="Search for anything..."
            value={query}
            onChange={handleQueryChange}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-sys-text-primary placeholder-sys-text-tertiary focus:outline-none"
            autoFocus
            aria-label="Search commands"
            aria-describedby="command-help"
          />
          <kbd
            className="px-2 py-1 text-xs bg-sys-fill-low text-sys-text-tertiary rounded"
            aria-label="Escape key"
          >
            ESC
          </kbd>
        </div>

        {/* Command List */}
        <div className="max-h-96 overflow-y-auto" role="listbox" aria-label="Available commands">
          {filteredCommands.length === 0 ? (
            <div
              className="p-4 text-center text-sys-text-tertiary"
              role="status"
              aria-live="polite"
            >
              No commands found
            </div>
          ) : (
            <div className="p-2">
              {filteredCommands.map((command, index) => {
                const Icon = command.icon;
                const isSelected = index === selectedIndex;

                return (
                  <button
                    key={command.id}
                    className={cn(
                      "w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left transition-colors focus:outline-none focus:ring-2 focus:ring-sys-accent focus:ring-offset-2",
                      isSelected ? "bg-sys-fill-low" : "hover:bg-sys-fill-low",
                    )}
                    onClick={() => handleCommand(command)}
                    role="option"
                    aria-selected={isSelected}
                    tabIndex={-1}
                  >
                    <Icon className="h-5 w-5 text-sys-text-tertiary" aria-hidden="true" />
                    <div className="flex-1">
                      <div className="text-sys-text-primary font-medium">{command.label}</div>
                      <div className="text-xs text-sys-text-tertiary">
                        {command.description || command.category}
                      </div>
                    </div>
                    {command.shortcut && (
                      <kbd
                        className="px-2 py-1 text-xs bg-sys-fill-low text-sys-text-tertiary rounded border border-sys-border-hairline"
                        aria-label={`Shortcut: ${command.shortcut}`}
                      >
                        {command.shortcut}
                      </kbd>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-sys-border-hairline text-xs text-sys-text-tertiary">
          <div className="flex items-center justify-between">
            <span id="command-help">Press Enter to execute</span>
            <span>Cmd+K to open</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
