/**
 * Universal Inbox Component - Steve Jobs Inspired
 *
 * Centralized hub for approvals, exceptions, failed syncs, and "needs coding" items
 * Filters by verb, company, period with clear action items
 */

import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  AlertCircle,
  Clock,
  FileText,
  CreditCard,
  Receipt,
  Filter,
  X,
  RefreshCw,
} from "lucide-react";
import { cn } from "@aibos/ui/utils";

export interface UniversalInboxProps {
  className?: string;
  onItemAction?: (itemId: string, action: string) => void;
  onFilterChange?: (filters: InboxFilters) => void;
}

export interface InboxItem {
  id: string;
  type: "approval" | "exception" | "failed_sync" | "needs_coding";
  verb: "sell" | "buy" | "cash" | "close";
  title: string;
  description: string;
  entityType: "invoice" | "bill" | "payment" | "transaction" | "journal_entry";
  entityId: string;
  priority: "high" | "medium" | "low";
  createdAt: string;
  dueDate?: string;
  assignee?: string;
  status: "pending" | "in_progress" | "completed";
}

export interface InboxFilters {
  verb?: string;
  type?: string;
  priority?: string;
  status?: string;
}

// Mock data for development
const mockInboxItems: InboxItem[] = [
  {
    id: "item_001",
    type: "approval",
    verb: "buy",
    title: "Bill Approval Required",
    description: "Office supplies invoice from Staples for $245.67",
    entityType: "bill",
    entityId: "bill_001",
    priority: "medium",
    createdAt: "2024-01-15T10:30:00Z",
    dueDate: "2024-01-20T17:00:00Z",
    assignee: "John Doe",
    status: "pending",
  },
  {
    id: "item_002",
    type: "exception",
    verb: "cash",
    title: "Unmatched Transaction",
    description: 'Bank transaction $1,250.00 from "OFFICE RENT - JANUARY"',
    entityType: "transaction",
    entityId: "txn_001",
    priority: "high",
    createdAt: "2024-01-15T09:15:00Z",
    status: "pending",
  },
  {
    id: "item_003",
    type: "failed_sync",
    verb: "sell",
    title: "Invoice Sync Failed",
    description: "Failed to sync invoice INV-2024-001 to QuickBooks",
    entityType: "invoice",
    entityId: "inv_001",
    priority: "high",
    createdAt: "2024-01-15T08:45:00Z",
    status: "in_progress",
  },
  {
    id: "item_004",
    type: "needs_coding",
    verb: "cash",
    title: "Transaction Needs Coding",
    description: 'Bank transaction $89.50 from "AMAZON WEB SERVICES" needs expense category',
    entityType: "transaction",
    entityId: "txn_002",
    priority: "medium",
    createdAt: "2024-01-15T07:20:00Z",
    status: "pending",
  },
];

const typeIcons = {
  approval: CheckCircle,
  exception: AlertCircle,
  failed_sync: RefreshCw,
  needs_coding: FileText,
};

const typeColors = {
  approval: "text-sys-status-info",
  exception: "text-sys-status-warning",
  failed_sync: "text-sys-status-error",
  needs_coding: "text-sys-status-success",
};

const priorityColors = {
  high: "bg-sys-status-error",
  medium: "bg-sys-status-warning",
  low: "bg-sys-status-info",
};

export const UniversalInbox: React.FC<UniversalInboxProps> = ({
  className,
  onItemAction,
  onFilterChange,
}) => {
  const [items, setItems] = useState<InboxItem[]>(mockInboxItems);
  const [filters, setFilters] = useState<InboxFilters>({});
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Filter items based on current filters
  const filteredItems = items.filter(item => {
    if (filters.verb && item.verb !== filters.verb) return false;
    if (filters.type && item.type !== filters.type) return false;
    if (filters.priority && item.priority !== filters.priority) return false;
    if (filters.status && item.status !== filters.status) return false;
    return true;
  });

  const handleFilterChange = (newFilters: Partial<InboxFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilterChange?.(updatedFilters);
  };

  const handleItemAction = (itemId: string, action: string) => {
    onItemAction?.(itemId, action);

    // Update local state for demo
    if (action === "complete") {
      setItems(prev =>
        prev.map(item => (item.id === itemId ? { ...item, status: "completed" as const } : item)),
      );
    }
  };

  const handleSelectItem = (itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map(item => item.id)));
    }
  };

  return (
    <div className={cn("bg-sys-bg-base border border-sys-border-hairline rounded-lg", className)}>
      {/* Header */}
      <div className="p-4 border-b border-sys-border-hairline">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-sys-text-primary">Universal Inbox</h2>
            <p className="text-sm text-sys-text-secondary">
              {filteredItems.length} items •{" "}
              {items.filter(item => item.status === "pending").length} pending
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              className="btn btn-secondary text-sm"
              onClick={() => setSelectedItems(new Set())}
              aria-label="Clear selection"
            >
              Clear Selection
            </button>
            <button
              className="btn btn-primary text-sm"
              onClick={() => {
                selectedItems.forEach(itemId => handleItemAction(itemId, "complete"));
                setSelectedItems(new Set());
              }}
              disabled={selectedItems.size === 0}
              aria-label={`Complete ${selectedItems.size} selected items`}
            >
              Complete Selected ({selectedItems.size})
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-sys-border-hairline bg-sys-bg-subtle">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-sys-text-tertiary" aria-hidden="true" />
            <span className="text-sm font-medium text-sys-text-primary">Filters:</span>
          </div>

          <select
            value={filters.verb || ""}
            onChange={e => handleFilterChange({ verb: e.target.value || undefined })}
            className="input text-sm"
            aria-label="Filter by verb"
          >
            <option value="">All Verbs</option>
            <option value="sell">Sell</option>
            <option value="buy">Buy</option>
            <option value="cash">Cash</option>
            <option value="close">Close</option>
          </select>

          <select
            value={filters.type || ""}
            onChange={e => handleFilterChange({ type: e.target.value || undefined })}
            className="input text-sm"
            aria-label="Filter by type"
          >
            <option value="">All Types</option>
            <option value="approval">Approvals</option>
            <option value="exception">Exceptions</option>
            <option value="failed_sync">Failed Syncs</option>
            <option value="needs_coding">Needs Coding</option>
          </select>

          <select
            value={filters.priority || ""}
            onChange={e => handleFilterChange({ priority: e.target.value || undefined })}
            className="input text-sm"
            aria-label="Filter by priority"
          >
            <option value="">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {Object.values(filters).some(Boolean) && (
            <button
              onClick={() => {
                setFilters({});
                onFilterChange?.({});
              }}
              className="btn btn-secondary text-sm"
              aria-label="Clear all filters"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Items List */}
      <div className="divide-y divide-sys-border-hairline">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-sys-text-tertiary">
              <CheckCircle className="h-12 w-12 mx-auto mb-4" aria-hidden="true" />
              <p className="text-lg font-medium">All caught up!</p>
              <p className="text-sm">No items match your current filters.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Select All */}
            <div className="p-3 bg-sys-bg-subtle border-b border-sys-border-hairline">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedItems.size === filteredItems.length && filteredItems.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-sys-border-hairline focus:ring-sys-accent"
                  aria-label="Select all items"
                />
                <span className="text-sm font-medium text-sys-text-primary">
                  Select All ({filteredItems.length} items)
                </span>
              </label>
            </div>

            {filteredItems.map(item => {
              const Icon = typeIcons[item.type];
              const isSelected = selectedItems.has(item.id);

              return (
                <div
                  key={item.id}
                  className={cn(
                    "p-4 hover:bg-sys-fill-low transition-colors",
                    isSelected && "bg-sys-fill-low",
                  )}
                >
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelectItem(item.id)}
                      className="mt-1 rounded border-sys-border-hairline focus:ring-sys-accent"
                      aria-label={`Select ${item.title}`}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <Icon className={cn("h-5 w-5", typeColors[item.type])} aria-hidden="true" />
                        <span className="text-sm font-medium text-sys-text-primary">
                          {item.title}
                        </span>
                        <div
                          className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium text-white",
                            priorityColors[item.priority],
                          )}
                        >
                          {item.priority}
                        </div>
                        <div className="text-xs text-sys-text-tertiary">
                          {item.verb.toUpperCase()}
                        </div>
                      </div>

                      <p className="text-sm text-sys-text-secondary mb-2">{item.description}</p>

                      <div className="flex items-center justify-between text-xs text-sys-text-tertiary">
                        <div className="flex items-center space-x-4">
                          <span>Created: {new Date(item.createdAt).toLocaleDateString()}</span>
                          {item.dueDate && (
                            <span>Due: {new Date(item.dueDate).toLocaleDateString()}</span>
                          )}
                          {item.assignee && <span>Assignee: {item.assignee}</span>}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span
                            className={cn(
                              "px-2 py-1 rounded-full text-xs font-medium",
                              item.status === "pending" && "bg-sys-status-warning text-white",
                              item.status === "in_progress" && "bg-sys-status-info text-white",
                              item.status === "completed" && "bg-sys-status-success text-white",
                            )}
                          >
                            {item.status.replace("_", " ")}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {item.status === "pending" && (
                        <button
                          onClick={() => handleItemAction(item.id, "complete")}
                          className="btn btn-primary text-sm"
                          aria-label={`Complete ${item.title}`}
                        >
                          Complete
                        </button>
                      )}
                      <button
                        onClick={() => handleItemAction(item.id, "view")}
                        className="btn btn-secondary text-sm"
                        aria-label={`View ${item.title}`}
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};

export default UniversalInbox;
