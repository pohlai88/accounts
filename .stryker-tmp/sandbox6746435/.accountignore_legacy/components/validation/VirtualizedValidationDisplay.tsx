/**
 * Enhanced Performance with Virtualization for Large Datasets
 * Provides virtualized rendering for handling 10,000+ validation results efficiently
 */
// @ts-nocheck


import React, { useMemo, useCallback, useState, useRef, useEffect } from "react";
import { FixedSizeList as List, VariableSizeList, ListChildComponentProps } from "react-window";
import { FixedSizeGrid as Grid } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import {
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from "@/lib/validation/gl-entry-validator";
import { ValidationErrorItem, ValidationWarningItem } from "./ValidationDisplay";
import { useValidationI18n } from "./ValidationI18nProvider";
import { useValidationClasses } from "./ValidationThemeProvider";
import { Search, Filter, ChevronDown, ChevronRight } from "lucide-react";

interface VirtualizedValidationDisplayProps {
  validation: ValidationResult | null;
  className?: string;
  itemHeight?: number;
  maxHeight?: number;
  enableSearch?: boolean;
  enableGrouping?: boolean;
  enableInfiniteScroll?: boolean;
  overscan?: number;
  threshold?: number; // Threshold for enabling virtualization
}

interface ValidationItem {
  id: string;
  type: "error" | "warning" | "info" | "suggestion";
  data: ValidationError | ValidationWarning | string;
  group?: string;
  searchText: string;
}

/**
 * Hook for processing validation data into virtualized items
 */
const useVirtualizedItems = (
  validation: ValidationResult | null,
  searchTerm: string = "",
  groupBy: "none" | "field" | "category" | "severity" = "none",
) => {
  return useMemo(() => {
    if (!validation) return { items: [], groups: {} };

    const items: ValidationItem[] = [];

    // Process errors
    validation.errors.forEach((error, index) => {
      const searchText =
        `${error.field} ${error.message} ${error.code} ${error.category}`.toLowerCase();

      if (!searchTerm || searchText.includes(searchTerm.toLowerCase())) {
        items.push({
          id: `error-${index}`,
          type:
            error.severity === "error"
              ? "error"
              : error.severity === "warning"
                ? "warning"
                : "info",
          data: error,
          group:
            groupBy === "field"
              ? error.field
              : groupBy === "category"
                ? error.category
                : groupBy === "severity"
                  ? error.severity
                  : undefined,
          searchText,
        });
      }
    });

    // Process warnings
    validation.warnings.forEach((warning, index) => {
      const searchText = `${warning.field} ${warning.message} ${warning.code}`.toLowerCase();

      if (!searchTerm || searchText.includes(searchTerm.toLowerCase())) {
        items.push({
          id: `warning-${index}`,
          type: "warning",
          data: warning,
          group:
            groupBy === "field"
              ? warning.field
              : groupBy === "category"
                ? "warning"
                : groupBy === "severity"
                  ? "warning"
                  : undefined,
          searchText,
        });
      }
    });

    // Process suggestions
    validation.suggestions.forEach((suggestion, index) => {
      const searchText = suggestion.toLowerCase();

      if (!searchTerm || searchText.includes(searchTerm.toLowerCase())) {
        items.push({
          id: `suggestion-${index}`,
          type: "suggestion",
          data: suggestion,
          group:
            groupBy === "category"
              ? "suggestion"
              : groupBy === "severity"
                ? "suggestion"
                : undefined,
          searchText,
        });
      }
    });

    // Group items if needed
    const groups: Record<string, ValidationItem[]> = {};
    if (groupBy !== "none") {
      items.forEach(item => {
        const groupKey = item.group || "ungrouped";
        if (!groups[groupKey]) groups[groupKey] = [];
        groups[groupKey].push(item);
      });
    }

    return { items, groups };
  }, [validation, searchTerm, groupBy]);
};

/**
 * Virtualized item renderer
 */
const VirtualizedItemRenderer = React.memo(function VirtualizedItemRenderer({
  index,
  style,
  data,
}: ListChildComponentProps) {
  const { items, onItemClick } = data;
  const item = items[index];

  if (!item) return null;

  const handleClick = useCallback(() => {
    onItemClick?.(item);
  }, [item, onItemClick]);

  return (
    <div style={style} onClick={handleClick}>
      <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
        {item.type === "error" && <ValidationErrorItem error={item.data as ValidationError} />}
        {item.type === "warning" && (
          <ValidationWarningItem warning={item.data as ValidationWarning} />
        )}
        {item.type === "info" && (
          <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded border border-blue-200 dark:border-blue-800">
            <div className="text-sm text-blue-700 dark:text-blue-300">
              {(item.data as ValidationError).message}
            </div>
          </div>
        )}
        {item.type === "suggestion" && (
          <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950 rounded border border-green-200 dark:border-green-800">
            <div className="text-sm text-green-700 dark:text-green-300">{item.data as string}</div>
          </div>
        )}
      </div>
    </div>
  );
});

/**
 * Variable size item renderer for grouped display
 */
const VariableSizeItemRenderer = React.memo(function VariableSizeItemRenderer({
  index,
  style,
  data,
}: ListChildComponentProps) {
  const { flatItems, expandedGroups, onToggleGroup, onItemClick } = data;
  const item = flatItems[index];

  if (!item) return null;

  if (item.type === "group-header") {
    const isExpanded = expandedGroups.has(item.groupKey);

    return (
      <div style={style}>
        <button
          onClick={() => onToggleGroup(item.groupKey)}
          className="flex items-center gap-2 w-full p-3 text-left bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-500" />
          )}
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {item.groupKey} ({item.count})
          </span>
        </button>
      </div>
    );
  }

  return (
    <div style={style}>
      <VirtualizedItemRenderer
        index={0}
        style={{ height: "100%" }}
        data={{ items: [item], onItemClick }}
      />
    </div>
  );
});

/**
 * Grouped virtualized display
 */
const GroupedVirtualizedDisplay: React.FC<{
  groups: Record<string, ValidationItem[]>;
  height: number;
  onItemClick?: (item: ValidationItem) => void;
}> = ({ groups, height, onItemClick }) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const listRef = useRef<VariableSizeList>(null);

  const toggleGroup = useCallback((groupKey: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }

      // Reset cache when groups change
      listRef.current?.resetAfterIndex(0);

      return next;
    });
  }, []);

  const flatItems = useMemo(() => {
    const items: any[] = [];

    Object.entries(groups).forEach(([groupKey, groupItems]) => {
      // Add group header
      items.push({
        type: "group-header",
        groupKey,
        count: groupItems.length,
      });

      // Add group items if expanded
      if (expandedGroups.has(groupKey)) {
        items.push(...groupItems);
      }
    });

    return items;
  }, [groups, expandedGroups]);

  const getItemSize = useCallback(
    (index: number) => {
      const item = flatItems[index];
      if (item?.type === "group-header") return 48;
      return 120; // Estimated item height
    },
    [flatItems],
  );

  return (
    <VariableSizeList
      ref={listRef}
      height={height}
      itemCount={flatItems.length}
      itemSize={getItemSize}
      itemData={{
        flatItems,
        expandedGroups,
        onToggleGroup: toggleGroup,
        onItemClick,
      }}
      overscanCount={5}
    >
      {VariableSizeItemRenderer}
    </VariableSizeList>
  );
};

/**
 * Grid-based virtualized display for very large datasets
 */
const GridVirtualizedDisplay: React.FC<{
  items: ValidationItem[];
  height: number;
  onItemClick?: (item: ValidationItem) => void;
}> = ({ items, height, onItemClick }) => {
  const columnCount = 2; // Two columns for better space utilization
  const rowCount = Math.ceil(items.length / columnCount);

  const Cell = useCallback(
    ({ columnIndex, rowIndex, style }: any) => {
      const itemIndex = rowIndex * columnCount + columnIndex;
      const item = items[itemIndex];

      if (!item) return <div style={style} />;

      return (
        <div style={{ ...style, padding: "4px" }}>
          <VirtualizedItemRenderer
            index={0}
            style={{ height: "100%" }}
            data={{ items: [item], onItemClick }}
          />
        </div>
      );
    },
    [items, onItemClick],
  );

  return (
    <Grid
      columnCount={columnCount}
      columnWidth={400}
      height={height}
      rowCount={rowCount}
      rowHeight={120}
      overscanRowCount={2}
      overscanColumnCount={1}
    >
      {Cell}
    </Grid>
  );
};

/**
 * Infinite scroll virtualized display
 */
const InfiniteScrollVirtualizedDisplay: React.FC<{
  items: ValidationItem[];
  height: number;
  onItemClick?: (item: ValidationItem) => void;
  onLoadMore?: () => void;
  hasNextPage?: boolean;
  isLoading?: boolean;
}> = ({ items, height, onItemClick, onLoadMore, hasNextPage, isLoading }) => {
  const listRef = useRef<List>(null);

  const itemRenderer = useCallback(
    ({ index, style }: ListChildComponentProps) => {
      const isLast = index === items.length - 1;
      const item = items[index];

      // Trigger load more when near the end
      if (isLast && hasNextPage && !isLoading && onLoadMore) {
        onLoadMore();
      }

      if (!item && isLoading) {
        return (
          <div style={style} className="flex items-center justify-center p-4">
            <div className="animate-spin h-6 w-6 border border-current border-t-transparent rounded-full" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">Loading more...</span>
          </div>
        );
      }

      if (!item) return <div style={style} />;

      return (
        <VirtualizedItemRenderer index={0} style={style} data={{ items: [item], onItemClick }} />
      );
    },
    [items, onItemClick, onLoadMore, hasNextPage, isLoading],
  );

  return (
    <List
      ref={listRef}
      height={height}
      itemCount={items.length + (hasNextPage ? 1 : 0)}
      itemSize={120}
      overscanCount={10}
    >
      {itemRenderer}
    </List>
  );
};

/**
 * Main virtualized validation display component
 */
export function VirtualizedValidationDisplay({
  validation,
  className = "",
  itemHeight = 120,
  maxHeight = 600,
  enableSearch = true,
  enableGrouping = true,
  enableInfiniteScroll = false,
  overscan = 5,
  threshold = 100,
}: VirtualizedValidationDisplayProps) {
  const i18n = useValidationI18n();
  const [searchTerm, setSearchTerm] = useState("");
  const [groupBy, setGroupBy] = useState<"none" | "field" | "category" | "severity">("none");
  const [displayMode, setDisplayMode] = useState<"list" | "grid">("list");

  const { items, groups } = useVirtualizedItems(validation, searchTerm, groupBy);

  const handleItemClick = useCallback((item: ValidationItem) => {
    // Handle item click - could navigate to field, show details, etc.
    console.log("Item clicked:", item);
  }, []);

  if (!validation) return null;

  const totalItems = items.length;
  const shouldVirtualize = totalItems >= threshold;

  // If below threshold, render normally
  if (!shouldVirtualize) {
    return (
      <div className={`space-y-2 ${className}`}>
        {items.map((item, index) => (
          <div key={item.id} onClick={() => handleItemClick(item)}>
            {item.type === "error" && <ValidationErrorItem error={item.data as ValidationError} />}
            {item.type === "warning" && (
              <ValidationWarningItem warning={item.data as ValidationWarning} />
            )}
            {item.type === "info" && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded border border-blue-200 dark:border-blue-800">
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  {(item.data as ValidationError).message}
                </div>
              </div>
            )}
            {item.type === "suggestion" && (
              <div className="p-3 bg-green-50 dark:bg-green-950 rounded border border-green-200 dark:border-green-800">
                <div className="text-sm text-green-700 dark:text-green-300">
                  {item.data as string}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        {enableSearch && (
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${totalItems} validation results...`}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}

        {/* Grouping */}
        {enableGrouping && (
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={groupBy}
              onChange={e => setGroupBy(e.target.value as any)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2"
            >
              <option value="none">No Grouping</option>
              <option value="field">Group by Field</option>
              <option value="category">Group by Category</option>
              <option value="severity">Group by Severity</option>
            </select>
          </div>
        )}

        {/* Display Mode */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDisplayMode("list")}
            className={`px-3 py-1 text-sm rounded ${
              displayMode === "list"
                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
            }`}
          >
            List
          </button>
          <button
            onClick={() => setDisplayMode("grid")}
            className={`px-3 py-1 text-sm rounded ${
              displayMode === "grid"
                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
            }`}
          >
            Grid
          </button>
        </div>

        {/* Stats */}
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing {items.length} of {totalItems} items
        </div>
      </div>

      {/* Virtualized Content */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <AutoSizer disableHeight>
          {({ width }) => {
            const height = Math.min(maxHeight, Math.max(300, items.length * itemHeight));

            if (groupBy !== "none" && Object.keys(groups).length > 0) {
              return (
                <GroupedVirtualizedDisplay
                  groups={groups}
                  height={height}
                  onItemClick={handleItemClick}
                />
              );
            }

            if (displayMode === "grid" && items.length > 50) {
              return (
                <GridVirtualizedDisplay
                  items={items}
                  height={height}
                  onItemClick={handleItemClick}
                />
              );
            }

            if (enableInfiniteScroll) {
              return (
                <InfiniteScrollVirtualizedDisplay
                  items={items}
                  height={height}
                  onItemClick={handleItemClick}
                  // onLoadMore={onLoadMore}
                  // hasNextPage={hasNextPage}
                  // isLoading={isLoading}
                />
              );
            }

            return (
              <List
                height={height}
                itemCount={items.length}
                itemSize={itemHeight}
                itemData={{ items, onItemClick: handleItemClick }}
                overscanCount={overscan}
                width={width}
              >
                {VirtualizedItemRenderer}
              </List>
            );
          }}
        </AutoSizer>
      </div>

      {/* Performance Info */}
      {totalItems >= threshold && (
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Virtualized rendering enabled for {totalItems} items • Only visible items are rendered for
          optimal performance
        </div>
      )}
    </div>
  );
}

/**
 * Compact virtualized display for smaller spaces
 */
export function CompactVirtualizedValidationDisplay({
  validation,
  className = "",
  maxHeight = 300,
}: {
  validation: ValidationResult | null;
  className?: string;
  maxHeight?: number;
}) {
  const { items } = useVirtualizedItems(validation);

  if (!validation || items.length === 0) return null;

  return (
    <div
      className={`border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden ${className}`}
    >
      <AutoSizer disableHeight>
        {({ width }) => (
          <List
            height={Math.min(maxHeight, items.length * 80)}
            itemCount={items.length}
            itemSize={80}
            itemData={{ items, onItemClick: () => {} }}
            overscanCount={3}
            width={width}
          >
            {VirtualizedItemRenderer}
          </List>
        )}
      </AutoSizer>
    </div>
  );
}

/**
 * Performance monitoring hook for virtualized displays
 */
export const useVirtualizedPerformance = (itemCount: number) => {
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    memoryUsage: 0,
    visibleItems: 0,
  });

  useEffect(() => {
    const startTime = performance.now();

    // Measure render time
    const measureRenderTime = () => {
      const endTime = performance.now();
      setMetrics(prev => ({
        ...prev,
        renderTime: endTime - startTime,
      }));
    };

    // Measure memory usage (if available)
    const measureMemoryUsage = () => {
      if ("memory" in performance) {
        const memory = (performance as any).memory;
        setMetrics(prev => ({
          ...prev,
          memoryUsage: memory.usedJSHeapSize / 1024 / 1024, // MB
        }));
      }
    };

    requestAnimationFrame(() => {
      measureRenderTime();
      measureMemoryUsage();
    });
  }, [itemCount]);

  return metrics;
};

export default VirtualizedValidationDisplay;
