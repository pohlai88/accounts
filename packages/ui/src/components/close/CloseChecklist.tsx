import * as React from "react";
import { cn } from "@aibos/ui/utils";
import {
  CheckCircle,
  Circle,
  AlertTriangle,
  Clock,
  User,
  Calendar,
  FileText,
  Lock,
} from "lucide-react";

// SSOT Compliant Close Checklist Component
// Comprehensive checklist with task owners and dependencies

export interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  category: "reconciliation" | "adjustments" | "reports" | "compliance" | "review" | "final";
  priority: "low" | "medium" | "high" | "critical";
  status: "pending" | "in_progress" | "completed" | "skipped";
  owner: string;
  ownerName?: string;
  dueDate: string;
  completedAt?: string;
  dependencies: string[];
  estimatedHours: number;
  actualHours?: number;
  notes?: string;
  required: boolean;
  autoComplete?: boolean;
  validationRules?: string[];
}

export interface CloseChecklistProps {
  items: ChecklistItem[];
  onItemUpdate?: (itemId: string, updates: Partial<ChecklistItem>) => Promise<void>;
  onBulkUpdate?: (updates: Partial<ChecklistItem>, itemIds: string[]) => Promise<void>;
  onAddItem?: (item: Omit<ChecklistItem, "id">) => Promise<void>;
  onRemoveItem?: (itemId: string) => Promise<void>;
  className?: string;
}

export const CloseChecklist: React.FC<CloseChecklistProps> = ({
  items,
  onItemUpdate,
  onBulkUpdate,
  onAddItem,
  onRemoveItem,
  className,
}) => {
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");
  const [selectedOwner, setSelectedOwner] = React.useState<string>("all");
  const [selectedStatus, setSelectedStatus] = React.useState<string>("all");
  const [showCompleted, setShowCompleted] = React.useState(true);
  const [selectedItems, setSelectedItems] = React.useState<Set<string>>(new Set());

  // Get unique owners and categories
  const owners = React.useMemo(() => {
    const ownerSet = new Set(items.map(item => item.owner));
    return Array.from(ownerSet).sort();
  }, [items]);

  const categories = React.useMemo(() => {
    const categorySet = new Set(items.map(item => item.category));
    return Array.from(categorySet).sort();
  }, [items]);

  // Filter items based on selected filters
  const filteredItems = React.useMemo(() => {
    return items.filter(item => {
      const categoryMatch = selectedCategory === "all" || item.category === selectedCategory;
      const ownerMatch = selectedOwner === "all" || item.owner === selectedOwner;
      const statusMatch = selectedStatus === "all" || item.status === selectedStatus;
      const completedMatch = showCompleted || item.status !== "completed";

      return categoryMatch && ownerMatch && statusMatch && completedMatch;
    });
  }, [items, selectedCategory, selectedOwner, selectedStatus, showCompleted]);

  // Calculate progress metrics
  const progressMetrics = React.useMemo(() => {
    const total = items.length;
    const completed = items.filter(item => item.status === "completed").length;
    const inProgress = items.filter(item => item.status === "in_progress").length;
    const overdue = items.filter(
      item => item.status !== "completed" && new Date(item.dueDate) < new Date(),
    ).length;
    const required = items.filter(item => item.required).length;
    const requiredCompleted = items.filter(
      item => item.required && item.status === "completed",
    ).length;

    return { total, completed, inProgress, overdue, required, requiredCompleted };
  }, [items]);

  const getStatusIcon = (status: ChecklistItem["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-[var(--sys-status-success)]" />;
      case "in_progress":
        return <Clock className="h-5 w-5 text-[var(--sys-status-warning)]" />;
      case "skipped":
        return <AlertTriangle className="h-5 w-5 text-[var(--sys-text-tertiary)]" />;
      default:
        return <Circle className="h-5 w-5 text-[var(--sys-text-tertiary)]" />;
    }
  };

  const getPriorityColor = (priority: ChecklistItem["priority"]) => {
    switch (priority) {
      case "critical":
        return "bg-[var(--sys-status-error)] text-white";
      case "high":
        return "bg-[var(--sys-status-warning)] text-white";
      case "medium":
        return "bg-[var(--sys-accent)] text-white";
      default:
        return "bg-[var(--sys-bg-subtle)] text-[var(--sys-text-secondary)]";
    }
  };

  const getCategoryIcon = (category: ChecklistItem["category"]) => {
    switch (category) {
      case "reconciliation":
        return <FileText className="h-4 w-4" />;
      case "adjustments":
        return <AlertTriangle className="h-4 w-4" />;
      case "reports":
        return <FileText className="h-4 w-4" />;
      case "compliance":
        return <Lock className="h-4 w-4" />;
      case "review":
        return <User className="h-4 w-4" />;
      case "final":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const handleItemStatusChange = async (itemId: string, newStatus: ChecklistItem["status"]) => {
    if (onItemUpdate) {
      await onItemUpdate(itemId, {
        status: newStatus,
        completedAt: newStatus === "completed" ? new Date().toISOString() : undefined,
      });
    }
  };

  const handleItemToggle = async (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const newStatus = item.status === "completed" ? "pending" : "completed";
    await handleItemStatusChange(itemId, newStatus);
  };

  const handleSelectItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map(item => item.id)));
    }
  };

  const handleBulkStatusChange = async (newStatus: ChecklistItem["status"]) => {
    if (onBulkUpdate && selectedItems.size > 0) {
      await onBulkUpdate({ status: newStatus }, Array.from(selectedItems));
      setSelectedItems(new Set());
    }
  };

  const isOverdue = (dueDate: string, itemId: string) => {
    return (
      new Date(dueDate) < new Date() && items.find(i => i.id === itemId)?.status !== "completed"
    );
  };

  return (
    <div
      className={cn(
        "bg-[var(--sys-bg-primary)] border border-[var(--sys-border-hairline)] rounded-lg",
        className,
      )}
    >
      {/* Header */}
      <div className="p-6 border-b border-[var(--sys-border-hairline)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-[var(--sys-text-primary)]">
              Close Checklist
            </h2>
            <p className="text-[var(--sys-text-secondary)] mt-1">
              Comprehensive month-end close checklist with task owners
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={e => setShowCompleted(e.target.checked)}
              className="h-4 w-4 text-[var(--sys-accent)] border-[var(--sys-border-hairline)] rounded focus:ring-[var(--sys-accent)]"
              aria-label="Show completed items"
            />
            <label className="text-sm text-[var(--sys-text-secondary)]">Show completed</label>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="bg-[var(--sys-bg-subtle)] p-4 rounded-lg">
            <div className="text-2xl font-bold text-[var(--sys-text-primary)]">
              {progressMetrics.completed}/{progressMetrics.total}
            </div>
            <div className="text-sm text-[var(--sys-text-secondary)]">Total</div>
          </div>

          <div className="bg-[var(--sys-bg-subtle)] p-4 rounded-lg">
            <div className="text-2xl font-bold text-[var(--sys-status-success)]">
              {progressMetrics.requiredCompleted}/{progressMetrics.required}
            </div>
            <div className="text-sm text-[var(--sys-text-secondary)]">Required</div>
          </div>

          <div className="bg-[var(--sys-bg-subtle)] p-4 rounded-lg">
            <div className="text-2xl font-bold text-[var(--sys-status-warning)]">
              {progressMetrics.inProgress}
            </div>
            <div className="text-sm text-[var(--sys-text-secondary)]">In Progress</div>
          </div>

          <div className="bg-[var(--sys-bg-subtle)] p-4 rounded-lg">
            <div className="text-2xl font-bold text-[var(--sys-status-error)]">
              {progressMetrics.overdue}
            </div>
            <div className="text-sm text-[var(--sys-text-secondary)]">Overdue</div>
          </div>

          <div className="bg-[var(--sys-bg-subtle)] p-4 rounded-lg">
            <div className="text-2xl font-bold text-[var(--sys-text-primary)]">
              {Math.round((progressMetrics.completed / progressMetrics.total) * 100)}%
            </div>
            <div className="text-sm text-[var(--sys-text-secondary)]">Complete</div>
          </div>

          <div className="bg-[var(--sys-bg-subtle)] p-4 rounded-lg">
            <div className="text-2xl font-bold text-[var(--sys-text-primary)]">
              {Math.round((progressMetrics.requiredCompleted / progressMetrics.required) * 100)}%
            </div>
            <div className="text-sm text-[var(--sys-text-secondary)]">Required</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-[var(--sys-border-hairline)] bg-[var(--sys-bg-subtle)]">
        <div className="flex flex-wrap gap-4">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-[var(--sys-border-hairline)] rounded-md bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
            aria-label="Filter by category"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>

          <select
            value={selectedOwner}
            onChange={e => setSelectedOwner(e.target.value)}
            className="px-3 py-2 border border-[var(--sys-border-hairline)] rounded-md bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
            aria-label="Filter by owner"
          >
            <option value="all">All Owners</option>
            {owners.map(owner => (
              <option key={owner} value={owner}>
                {owner}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-[var(--sys-border-hairline)] rounded-md bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
            aria-label="Filter by status"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="skipped">Skipped</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedItems.size > 0 && (
        <div className="p-4 border-b border-[var(--sys-border-hairline)] bg-[var(--sys-accent)]/10">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--sys-text-primary)]">
              {selectedItems.size} items selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkStatusChange("completed")}
                className="px-3 py-1 text-sm bg-[var(--sys-status-success)] text-white rounded hover:bg-[var(--sys-status-success)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--sys-status-success)]"
              >
                Mark Complete
              </button>
              <button
                onClick={() => handleBulkStatusChange("in_progress")}
                className="px-3 py-1 text-sm bg-[var(--sys-status-warning)] text-white rounded hover:bg-[var(--sys-status-warning)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--sys-status-warning)]"
              >
                Mark In Progress
              </button>
              <button
                onClick={() => setSelectedItems(new Set())}
                className="px-3 py-1 text-sm border border-[var(--sys-border-hairline)] rounded hover:bg-[var(--sys-bg-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checklist Items */}
      <div className="divide-y divide-[var(--sys-border-hairline)]">
        <div className="p-4 bg-[var(--sys-bg-subtle)]">
          <div className="flex items-center gap-4">
            <input
              type="checkbox"
              checked={selectedItems.size === filteredItems.length && filteredItems.length > 0}
              onChange={handleSelectAll}
              className="h-4 w-4 text-[var(--sys-accent)] border-[var(--sys-border-hairline)] rounded focus:ring-[var(--sys-accent)]"
              aria-label="Select all items"
            />
            <span className="text-sm font-medium text-[var(--sys-text-primary)]">
              Select All ({filteredItems.length} items)
            </span>
          </div>
        </div>

        {filteredItems.map(item => (
          <div key={item.id} className="p-4 hover:bg-[var(--sys-bg-subtle)]">
            <div className="flex items-start gap-4">
              <input
                type="checkbox"
                checked={selectedItems.has(item.id)}
                onChange={() => handleSelectItem(item.id)}
                className="h-4 w-4 text-[var(--sys-accent)] border-[var(--sys-border-hairline)] rounded focus:ring-[var(--sys-accent)] mt-1"
                aria-label={`Select ${item.title}`}
              />

              <button
                onClick={() => handleItemToggle(item.id)}
                className="flex items-center gap-2 mt-1 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)] rounded"
                aria-label={`Toggle completion for ${item.title}`}
              >
                {getStatusIcon(item.status)}
                {getCategoryIcon(item.category)}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h3
                    className={cn(
                      "font-medium",
                      item.status === "completed"
                        ? "text-[var(--sys-text-secondary)] line-through"
                        : "text-[var(--sys-text-primary)]",
                    )}
                  >
                    {item.title}
                    {item.required && (
                      <span className="ml-2 text-xs bg-[var(--sys-status-error)] text-white px-2 py-1 rounded">
                        Required
                      </span>
                    )}
                  </h3>
                  <span
                    className={cn(
                      "px-2 py-1 text-xs font-medium rounded-full",
                      getPriorityColor(item.priority),
                    )}
                  >
                    {item.priority}
                  </span>
                </div>

                <p
                  className={cn(
                    "text-sm mb-3",
                    item.status === "completed"
                      ? "text-[var(--sys-text-tertiary)]"
                      : "text-[var(--sys-text-secondary)]",
                  )}
                >
                  {item.description}
                </p>

                <div className="flex items-center gap-4 text-xs text-[var(--sys-text-tertiary)]">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span>{item.ownerName || item.owner}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span
                      className={cn(
                        isOverdue(item.dueDate, item.id) ? "text-[var(--sys-status-error)]" : "",
                      )}
                    >
                      Due: {new Date(item.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                  <span>Est: {item.estimatedHours}h</span>
                  {item.actualHours && <span>Actual: {item.actualHours}h</span>}
                </div>

                {item.notes && (
                  <div className="mt-2 p-2 bg-[var(--sys-bg-subtle)] rounded text-xs text-[var(--sys-text-secondary)]">
                    <strong>Notes:</strong> {item.notes}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={item.status}
                  onChange={e =>
                    handleItemStatusChange(item.id, e.target.value as ChecklistItem["status"])
                  }
                  className="px-2 py-1 text-sm border border-[var(--sys-border-hairline)] rounded bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
                  aria-label={`Update status for ${item.title}`}
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="skipped">Skipped</option>
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="p-4 border-t border-[var(--sys-border-hairline)] bg-[var(--sys-bg-subtle)]">
        <div className="text-sm text-[var(--sys-text-secondary)]">
          Showing {filteredItems.length} of {items.length} checklist items
        </div>
      </div>
    </div>
  );
};

export default CloseChecklist;
