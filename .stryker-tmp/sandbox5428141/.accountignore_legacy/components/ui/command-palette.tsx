/**
 * AI Command Palette - ⌘K Shortcuts
 * Smart command palette with AI suggestions and quick actions
 */
// @ts-nocheck


"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  FileText,
  DollarSign,
  Users,
  Calculator,
  TrendingUp,
  Settings,
  Zap,
  Sparkles,
  ArrowRight,
  Clock,
  Plus,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";

interface Command {
  id: string;
  title: string;
  description: string;
  category: "create" | "navigate" | "search" | "ai" | "quick";
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  shortcut?: string;
  keywords: string[];
  priority: number;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filteredCommands, setFilteredCommands] = useState<Command[]>([]);

  // Define all available commands
  const commands: Command[] = [
    // Create Commands
    {
      id: "create-invoice",
      title: "Create Invoice",
      description: "Create a new sales invoice with MFRS template",
      category: "create",
      icon: FileText,
      action: () => navigate("/invoices/new"),
      shortcut: "⌘I",
      keywords: ["invoice", "bill", "sales", "create", "new"],
      priority: 10,
    },
    {
      id: "create-journal",
      title: "Create Journal Entry",
      description: "Post a new journal entry with double-entry validation",
      category: "create",
      icon: Calculator,
      action: () => navigate("/journal/new"),
      shortcut: "⌘J",
      keywords: ["journal", "entry", "post", "create", "accounting"],
      priority: 9,
    },
    {
      id: "create-customer",
      title: "Add Customer",
      description: "Add a new customer to your database",
      category: "create",
      icon: Users,
      action: () => navigate("/customers/new"),
      keywords: ["customer", "client", "add", "new", "contact"],
      priority: 8,
    },
    {
      id: "record-payment",
      title: "Record Payment",
      description: "Record a payment received from customer",
      category: "create",
      icon: DollarSign,
      action: () => navigate("/payments/new"),
      shortcut: "⌘P",
      keywords: ["payment", "receive", "money", "cash", "record"],
      priority: 9,
    },

    // Navigate Commands
    {
      id: "nav-dashboard",
      title: "Dashboard",
      description: "Go to main dashboard",
      category: "navigate",
      icon: TrendingUp,
      action: () => navigate("/dashboard"),
      keywords: ["dashboard", "home", "main", "overview"],
      priority: 7,
    },
    {
      id: "nav-accounts",
      title: "Chart of Accounts",
      description: "View and manage your chart of accounts",
      category: "navigate",
      icon: Calculator,
      action: () => navigate("/accounts"),
      keywords: ["accounts", "chart", "coa", "ledger"],
      priority: 6,
    },
    {
      id: "nav-reports",
      title: "Financial Reports",
      description: "View trial balance, P&L, and other reports",
      category: "navigate",
      icon: TrendingUp,
      action: () => navigate("/reports"),
      keywords: ["reports", "financial", "trial", "balance", "profit", "loss"],
      priority: 6,
    },
    {
      id: "nav-reconcile",
      title: "Bank Reconciliation",
      description: "Reconcile your bank transactions",
      category: "navigate",
      icon: DollarSign,
      action: () => navigate("/banking/reconcile"),
      keywords: ["reconcile", "bank", "match", "transactions"],
      priority: 7,
    },

    // AI Commands
    {
      id: "ai-categorize",
      title: "AI Categorize Expense",
      description: "Describe an expense and we'll categorize it automatically",
      category: "ai",
      icon: Sparkles,
      action: () => openAIDialog("categorize"),
      keywords: ["ai", "categorize", "expense", "smart", "auto"],
      priority: 8,
    },
    {
      id: "ai-explain",
      title: "Explain This Error",
      description: "Get AI help understanding error messages",
      category: "ai",
      icon: Sparkles,
      action: () => openAIDialog("explain"),
      keywords: ["ai", "explain", "error", "help", "understand"],
      priority: 5,
    },
    {
      id: "ai-suggest",
      title: "Smart Suggestions",
      description: "Get AI suggestions for your current context",
      category: "ai",
      icon: Zap,
      action: () => openAIDialog("suggest"),
      keywords: ["ai", "suggest", "smart", "help", "tips"],
      priority: 6,
    },

    // Quick Actions
    {
      id: "quick-trial-balance",
      title: "Trial Balance",
      description: "View current trial balance",
      category: "quick",
      icon: Calculator,
      action: () => navigate("/reports/trial-balance"),
      keywords: ["trial", "balance", "quick", "report"],
      priority: 7,
    },
    {
      id: "quick-settings",
      title: "Settings",
      description: "Open application settings",
      category: "quick",
      icon: Settings,
      action: () => navigate("/settings"),
      keywords: ["settings", "preferences", "config"],
      priority: 4,
    },
  ];

  // Navigation helper
  const navigate = (url: string) => {
    window.location.href = url;
    onClose();
  };

  // AI dialog helper
  const openAIDialog = (type: string) => {
    // This would open an AI dialog
    console.log("Opening AI dialog:", type);
    onClose();
  };

  // Filter commands based on query
  const filterCommands = useCallback(
    (searchQuery: string) => {
      if (!searchQuery.trim()) {
        // Show top priority commands when no query
        return commands.sort((a, b) => b.priority - a.priority).slice(0, 8);
      }

      const query = searchQuery.toLowerCase();

      return commands
        .filter(command => {
          // Check title, description, and keywords
          const titleMatch = command.title.toLowerCase().includes(query);
          const descMatch = command.description.toLowerCase().includes(query);
          const keywordMatch = command.keywords.some(keyword =>
            keyword.toLowerCase().includes(query),
          );

          return titleMatch || descMatch || keywordMatch;
        })
        .sort((a, b) => {
          // Prioritize exact title matches
          const aExact = a.title.toLowerCase().startsWith(query) ? 10 : 0;
          const bExact = b.title.toLowerCase().startsWith(query) ? 10 : 0;

          return bExact + b.priority - (aExact + a.priority);
        })
        .slice(0, 10);
    },
    [commands],
  );

  // Update filtered commands when query changes
  useEffect(() => {
    const filtered = filterCommands(query);
    setFilteredCommands(filtered);
    setSelectedIndex(0);
  }, [query, filterCommands]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
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
            filteredCommands[selectedIndex].action();
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getCategoryIcon = (category: Command["category"]) => {
    switch (category) {
      case "create":
        return Plus;
      case "navigate":
        return ArrowRight;
      case "search":
        return Search;
      case "ai":
        return Sparkles;
      case "quick":
        return Zap;
      default:
        return Search;
    }
  };

  const getCategoryColor = (category: Command["category"]) => {
    switch (category) {
      case "create":
        return "text-green-600 bg-green-50 dark:bg-green-900/20";
      case "navigate":
        return "text-blue-600 bg-blue-50 dark:bg-blue-900/20";
      case "search":
        return "text-purple-600 bg-purple-50 dark:bg-purple-900/20";
      case "ai":
        return "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20";
      case "quick":
        return "text-orange-600 bg-orange-50 dark:bg-orange-900/20";
      default:
        return "text-gray-600 bg-gray-50 dark:bg-gray-900/20";
    }
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" onClick={onClose} />

      {/* Command Palette */}
      <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl mx-auto px-4">
        <Card className="shadow-2xl border-2 border-primary/20">
          <CardContent className="p-0">
            {/* Search Input */}
            <div className="flex items-center p-4 border-b">
              <Search className="h-5 w-5 text-muted-foreground mr-3" />
              <Input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Type a command or search..."
                className="border-0 focus-visible:ring-0 text-lg"
                autoFocus
              />
              <Badge variant="outline" className="ml-2 text-xs">
                ⌘K
              </Badge>
            </div>

            {/* Commands List */}
            <div className="max-h-96 overflow-y-auto">
              {filteredCommands.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No commands found</p>
                  <p className="text-sm">Try searching for "invoice", "payment", or "report"</p>
                </div>
              ) : (
                <div className="py-2">
                  {filteredCommands.map((command, index) => {
                    const CommandIcon = command.icon;
                    const CategoryIcon = getCategoryIcon(command.category);
                    const isSelected = index === selectedIndex;

                    return (
                      <div
                        key={command.id}
                        className={`flex items-center px-4 py-3 cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-primary/10 border-r-2 border-primary"
                            : "hover:bg-muted/50"
                        }`}
                        onClick={() => command.action()}
                      >
                        <div className="flex items-center space-x-3 flex-1">
                          <div className={`p-2 rounded-lg ${getCategoryColor(command.category)}`}>
                            <CommandIcon className="h-4 w-4" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-medium truncate">{command.title}</h3>
                              {command.shortcut && (
                                <Badge variant="outline" className="text-xs">
                                  {command.shortcut}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {command.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs capitalize">
                            {command.category}
                          </Badge>
                          {isSelected && <ArrowRight className="h-4 w-4 text-primary" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-3 border-t bg-muted/30 text-xs text-muted-foreground">
              <div className="flex items-center space-x-4">
                <span className="flex items-center space-x-1">
                  <kbd className="px-1.5 py-0.5 bg-background border rounded">↑↓</kbd>
                  <span>Navigate</span>
                </span>
                <span className="flex items-center space-x-1">
                  <kbd className="px-1.5 py-0.5 bg-background border rounded">Enter</kbd>
                  <span>Select</span>
                </span>
                <span className="flex items-center space-x-1">
                  <kbd className="px-1.5 py-0.5 bg-background border rounded">Esc</kbd>
                  <span>Close</span>
                </span>
              </div>

              <div className="flex items-center space-x-1">
                <Sparkles className="h-3 w-3" />
                <span>AI-Powered</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

// Hook to manage command palette
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘K or Ctrl+K to open
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const openPalette = () => setIsOpen(true);
  const closePalette = () => setIsOpen(false);

  return {
    isOpen,
    openPalette,
    closePalette,
  };
}
