/**
 * Timeline Drawer Component - Steve Jobs Inspired
 *
 * Entity + global audit feed showing activity timeline
 * Shows changes, approvals, comments, and system events
 */
// @ts-nocheck


import React, { useState, useEffect } from "react";
import {
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  FileText,
  CreditCard,
  Receipt,
  Lock,
  MessageSquare,
  ArrowRight,
  Filter,
  Calendar,
} from "lucide-react";
import { cn } from "@aibos/ui/utils";

export interface TimelineDrawerProps {
  className?: string;
  entityId?: string;
  entityType?: string;
  onItemClick?: (item: TimelineItem) => void;
  onFilterChange?: (filters: TimelineFilters) => void;
}

export interface TimelineItem {
  id: string;
  type: "created" | "updated" | "approved" | "rejected" | "commented" | "system";
  verb: "sell" | "buy" | "cash" | "close";
  title: string;
  description: string;
  entityType: "invoice" | "bill" | "payment" | "transaction" | "journal_entry" | "user" | "system";
  entityId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  timestamp: string;
  changes?: Record<string, { from: any; to: any }>;
  metadata?: Record<string, any>;
}

export interface TimelineFilters {
  verb?: string;
  type?: string;
  userId?: string;
  dateRange?: { start: string; end: string };
}

// Mock data for development
const mockTimelineItems: TimelineItem[] = [
  {
    id: "timeline_001",
    type: "created",
    verb: "sell",
    title: "Invoice Created",
    description: "Invoice INV-2024-001 created for Acme Corp",
    entityType: "invoice",
    entityId: "inv_001",
    userId: "user_001",
    userName: "John Doe",
    timestamp: "2024-01-15T10:30:00Z",
    changes: {
      status: { from: null, to: "draft" },
      amount: { from: null, to: 2500.0 },
    },
  },
  {
    id: "timeline_002",
    type: "approved",
    verb: "buy",
    title: "Bill Approved",
    description: "Office supplies bill approved for payment",
    entityType: "bill",
    entityId: "bill_001",
    userId: "user_002",
    userName: "Jane Smith",
    timestamp: "2024-01-15T09:45:00Z",
    changes: {
      status: { from: "pending", to: "approved" },
    },
  },
  {
    id: "timeline_003",
    type: "commented",
    verb: "cash",
    title: "Reconciliation Comment",
    description: 'Added note: "Matched with rent payment from landlord"',
    entityType: "transaction",
    entityId: "txn_001",
    userId: "user_001",
    userName: "John Doe",
    timestamp: "2024-01-15T09:15:00Z",
    metadata: {
      comment: "Matched with rent payment from landlord",
    },
  },
  {
    id: "timeline_004",
    type: "system",
    verb: "cash",
    title: "Bank Sync Completed",
    description: "25 transactions imported from Business Checking",
    entityType: "system",
    entityId: "sync_001",
    userId: "system",
    userName: "System",
    timestamp: "2024-01-15T08:30:00Z",
    metadata: {
      importedCount: 25,
      accountName: "Business Checking",
    },
  },
  {
    id: "timeline_005",
    type: "updated",
    verb: "close",
    title: "Period Locked",
    description: "December 2023 period locked for closing",
    entityType: "journal_entry",
    entityId: "period_001",
    userId: "user_003",
    userName: "Mike Johnson",
    timestamp: "2024-01-15T08:00:00Z",
    changes: {
      status: { from: "open", to: "locked" },
    },
  },
];

const typeIcons = {
  created: FileText,
  updated: ArrowRight,
  approved: CheckCircle,
  rejected: AlertCircle,
  commented: MessageSquare,
  system: Clock,
};

const typeColors = {
  created: "text-sys-status-success",
  updated: "text-sys-status-info",
  approved: "text-sys-status-success",
  rejected: "text-sys-status-error",
  commented: "text-sys-status-warning",
  system: "text-sys-text-tertiary",
};

const verbIcons = {
  sell: FileText,
  buy: Receipt,
  cash: CreditCard,
  close: Lock,
};

export const TimelineDrawer: React.FC<TimelineDrawerProps> = ({
  className,
  entityId,
  entityType,
  onItemClick,
  onFilterChange,
}) => {
  const [items, setItems] = useState<TimelineItem[]>(mockTimelineItems);
  const [filters, setFilters] = useState<TimelineFilters>({});
  const [isExpanded, setIsExpanded] = useState(false);

  // Filter items based on current filters and entity context
  const filteredItems = items.filter(item => {
    if (entityId && item.entityId !== entityId) return false;
    if (entityType && item.entityType !== entityType) return false;
    if (filters.verb && item.verb !== filters.verb) return false;
    if (filters.type && item.type !== filters.type) return false;
    if (filters.userId && item.userId !== filters.userId) return false;
    if (filters.dateRange) {
      const itemDate = new Date(item.timestamp);
      const startDate = new Date(filters.dateRange.start);
      const endDate = new Date(filters.dateRange.end);
      if (itemDate < startDate || itemDate > endDate) return false;
    }
    return true;
  });

  const handleFilterChange = (newFilters: Partial<TimelineFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilterChange?.(updatedFilters);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={cn("bg-sys-bg-base border border-sys-border-hairline rounded-lg", className)}>
      {/* Header */}
      <div className="p-4 border-b border-sys-border-hairline">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-sys-text-primary">Timeline</h2>
            <p className="text-sm text-sys-text-secondary">
              {entityId ? `Activity for ${entityType}` : "Global activity feed"}
            </p>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="btn btn-secondary text-sm"
            aria-label={isExpanded ? "Collapse timeline" : "Expand timeline"}
          >
            {isExpanded ? "Collapse" : "Expand"}
          </button>
        </div>
      </div>

      {/* Filters */}
      {isExpanded && (
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
              <option value="created">Created</option>
              <option value="updated">Updated</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="commented">Commented</option>
              <option value="system">System</option>
            </select>

            <input
              type="date"
              value={filters.dateRange?.start || ""}
              onChange={e =>
                handleFilterChange({
                  dateRange: {
                    start: e.target.value,
                    end: filters.dateRange?.end || "",
                  },
                })
              }
              className="input text-sm"
              aria-label="Filter by start date"
            />

            <input
              type="date"
              value={filters.dateRange?.end || ""}
              onChange={e =>
                handleFilterChange({
                  dateRange: {
                    start: filters.dateRange?.start || "",
                    end: e.target.value,
                  },
                })
              }
              className="input text-sm"
              aria-label="Filter by end date"
            />
          </div>
        </div>
      )}

      {/* Timeline Items */}
      <div className="max-h-96 overflow-y-auto">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-sys-text-tertiary">
              <Clock className="h-12 w-12 mx-auto mb-4" aria-hidden="true" />
              <p className="text-lg font-medium">No activity</p>
              <p className="text-sm">No timeline items match your current filters.</p>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {filteredItems.map((item, index) => {
              const TypeIcon = typeIcons[item.type];
              const VerbIcon = verbIcons[item.verb];

              return (
                <div
                  key={item.id}
                  className="flex items-start space-x-3 p-3 rounded-lg hover:bg-sys-fill-low transition-colors cursor-pointer"
                  onClick={() => onItemClick?.(item)}
                >
                  {/* Timeline Line */}
                  {index < filteredItems.length - 1 && (
                    <div className="absolute left-8 top-12 w-0.5 h-16 bg-sys-border-hairline" />
                  )}

                  {/* Icon */}
                  <div className="relative">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full bg-sys-bg-raised border-2 border-sys-border-hairline flex items-center justify-center",
                        typeColors[item.type],
                      )}
                    >
                      <TypeIcon className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-sys-bg-base border border-sys-border-hairline flex items-center justify-center">
                      <VerbIcon className="h-2 w-2 text-sys-text-tertiary" aria-hidden="true" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-sys-text-primary">
                        {item.title}
                      </span>
                      <span className="text-xs text-sys-text-tertiary">
                        {formatTimestamp(item.timestamp)}
                      </span>
                    </div>

                    <p className="text-sm text-sys-text-secondary mb-2">{item.description}</p>

                    <div className="flex items-center space-x-4 text-xs text-sys-text-tertiary">
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" aria-hidden="true" />
                        <span>{item.userName}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" aria-hidden="true" />
                        <span>{new Date(item.timestamp).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Changes */}
                    {item.changes && Object.keys(item.changes).length > 0 && (
                      <div className="mt-2 p-2 bg-sys-bg-subtle rounded text-xs">
                        <div className="font-medium text-sys-text-primary mb-1">Changes:</div>
                        {Object.entries(item.changes).map(([field, change]) => (
                          <div key={field} className="text-sys-text-secondary">
                            <span className="font-medium">{field}:</span> {change.from} →{" "}
                            {change.to}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Metadata */}
                    {item.metadata && (
                      <div className="mt-2 p-2 bg-sys-bg-subtle rounded text-xs">
                        {Object.entries(item.metadata).map(([key, value]) => (
                          <div key={key} className="text-sys-text-secondary">
                            <span className="font-medium">{key}:</span> {String(value)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelineDrawer;
