/**
 * Enhanced Error Grouping and Filtering for Validation Components
 * Provides filtering, grouping, and search capabilities for validation results
 */
// @ts-nocheck


import React, { useState, useMemo, useCallback } from "react";
import { Search, Filter, X, ChevronDown, ChevronRight } from "lucide-react";
import {
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from "@/lib/validation/gl-entry-validator";
import { ValidationDisplay, ValidationErrorItem, ValidationWarningItem } from "./ValidationDisplay";
import { useValidationI18n, useValidationTranslations } from "./ValidationI18nProvider";
import { useValidationClasses } from "./ValidationThemeProvider";

interface FilterableValidationDisplayProps {
  validation: ValidationResult | null;
  showSuggestions?: boolean;
  className?: string;
  enableSearch?: boolean;
  enableGrouping?: boolean;
  defaultGroupBy?: "none" | "field" | "category" | "severity";
  defaultFilter?: "all" | "errors" | "warnings" | "suggestions";
}

type FilterType = "all" | "errors" | "warnings" | "suggestions";
type GroupByType = "none" | "field" | "category" | "severity";

/**
 * Hook for grouping validation errors
 */
const useGroupedErrors = (validation: ValidationResult | null) => {
  return useMemo(() => {
    if (!validation) return { byField: {}, byCategory: {}, bySeverity: {} };

    const byField = validation.errors.reduce(
      (acc, error) => {
        if (!acc[error.field]) acc[error.field] = [];
        acc[error.field].push(error);
        return acc;
      },
      {} as Record<string, ValidationError[]>,
    );

    const byCategory = validation.errors.reduce(
      (acc, error) => {
        if (!acc[error.category]) acc[error.category] = [];
        acc[error.category].push(error);
        return acc;
      },
      {} as Record<string, ValidationError[]>,
    );

    const bySeverity = validation.errors.reduce(
      (acc, error) => {
        if (!acc[error.severity]) acc[error.severity] = [];
        acc[error.severity].push(error);
        return acc;
      },
      {} as Record<string, ValidationError[]>,
    );

    return { byField, byCategory, bySeverity };
  }, [validation]);
};

/**
 * Hook for filtering validation results
 */
const useFilteredValidation = (
  validation: ValidationResult | null,
  filter: FilterType,
  searchTerm: string,
) => {
  return useMemo(() => {
    if (!validation) return null;

    let filteredErrors = validation.errors;
    let filteredWarnings = validation.warnings;
    let filteredSuggestions = validation.suggestions;

    // Apply filter
    switch (filter) {
      case "errors":
        filteredWarnings = [];
        filteredSuggestions = [];
        break;
      case "warnings":
        filteredErrors = [];
        filteredSuggestions = [];
        break;
      case "suggestions":
        filteredErrors = [];
        filteredWarnings = [];
        break;
    }

    // Apply search
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();

      filteredErrors = filteredErrors.filter(
        error =>
          error.message.toLowerCase().includes(searchLower) ||
          error.field.toLowerCase().includes(searchLower) ||
          error.code.toLowerCase().includes(searchLower) ||
          error.category.toLowerCase().includes(searchLower),
      );

      filteredWarnings = filteredWarnings.filter(
        warning =>
          warning.message.toLowerCase().includes(searchLower) ||
          warning.field.toLowerCase().includes(searchLower) ||
          warning.code.toLowerCase().includes(searchLower),
      );

      filteredSuggestions = filteredSuggestions.filter(suggestion =>
        suggestion.toLowerCase().includes(searchLower),
      );
    }

    return {
      ...validation,
      errors: filteredErrors,
      warnings: filteredWarnings,
      suggestions: filteredSuggestions,
    };
  }, [validation, filter, searchTerm]);
};

/**
 * Filter button component
 */
const FilterButton: React.FC<{
  filter: FilterType;
  currentFilter: FilterType;
  count: number;
  onClick: (filter: FilterType) => void;
  colorType: "error" | "warning" | "success";
}> = ({ filter, currentFilter, count, onClick, colorType }) => {
  const i18n = useValidationI18n();
  const classes = useValidationClasses(colorType);

  const getLabel = () => {
    switch (filter) {
      case "all":
        return i18n.all;
      case "errors":
        return i18n.errorsOnly;
      case "warnings":
        return i18n.warningsOnly;
      case "suggestions":
        return i18n.suggestionsOnly;
    }
  };

  const isActive = currentFilter === filter;

  return (
    <button
      onClick={() => onClick(filter)}
      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
        isActive
          ? `${classes.badge} ring-2 ring-offset-1 ring-${colorType === "error" ? "red" : colorType === "warning" ? "yellow" : "green"}-300`
          : "bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300"
      }`}
    >
      {getLabel()} ({count})
    </button>
  );
};

/**
 * Group header component
 */
const GroupHeader: React.FC<{
  groupKey: string;
  groupBy: GroupByType;
  count: number;
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ groupKey, groupBy, count, isExpanded, onToggle }) => {
  const { getCategoryLabel } = useValidationTranslations();

  const getDisplayName = () => {
    switch (groupBy) {
      case "field":
        return groupKey || "Unknown Field";
      case "category":
        return getCategoryLabel(groupKey);
      case "severity":
        return groupKey.charAt(0).toUpperCase() + groupKey.slice(1);
      default:
        return groupKey;
    }
  };

  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-2 w-full p-2 text-left bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded border"
    >
      {isExpanded ? (
        <ChevronDown className="h-4 w-4 text-gray-500" />
      ) : (
        <ChevronRight className="h-4 w-4 text-gray-500" />
      )}
      <span className="font-medium text-gray-900 dark:text-gray-100">{getDisplayName()}</span>
      <span className="text-sm text-gray-500 dark:text-gray-400">({count})</span>
    </button>
  );
};

/**
 * Main filterable validation display component
 */
export function FilterableValidationDisplay({
  validation,
  showSuggestions = true,
  className = "",
  enableSearch = true,
  enableGrouping = true,
  defaultGroupBy = "none",
  defaultFilter = "all",
}: FilterableValidationDisplayProps) {
  const i18n = useValidationI18n();
  const [filter, setFilter] = useState<FilterType>(defaultFilter);
  const [groupBy, setGroupBy] = useState<GroupByType>(defaultGroupBy);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const grouped = useGroupedErrors(validation);
  const filteredValidation = useFilteredValidation(validation, filter, searchTerm);

  const toggleGroup = useCallback((groupKey: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  }, []);

  const clearSearch = useCallback(() => {
    setSearchTerm("");
  }, []);

  if (!validation) return null;

  const errorCount = validation.errors.filter(e => e.severity === "error").length;
  const warningCount = validation.warnings.length;
  const suggestionCount = validation.suggestions.length;
  const totalCount = errorCount + warningCount + suggestionCount;

  // Render grouped content
  const renderGroupedContent = () => {
    if (!filteredValidation || groupBy === "none") {
      return (
        <ValidationDisplay validation={filteredValidation} showSuggestions={showSuggestions} />
      );
    }

    let groups: Record<string, ValidationError[]> = {};

    switch (groupBy) {
      case "field":
        groups = grouped.byField;
        break;
      case "category":
        groups = grouped.byCategory;
        break;
      case "severity":
        groups = grouped.bySeverity;
        break;
    }

    // Filter groups based on current filter and search
    const filteredGroups = Object.entries(groups).filter(([_, errors]) => {
      if (filter === "errors") return errors.some(e => e.severity === "error");
      if (filter === "warnings") return errors.some(e => e.severity === "warning");
      return errors.length > 0;
    });

    if (filteredGroups.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No validation results match your current filters.
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {filteredGroups.map(([groupKey, errors]) => {
          const isExpanded = expandedGroups.has(groupKey);

          return (
            <div key={groupKey} className="border border-gray-200 dark:border-gray-700 rounded-lg">
              <GroupHeader
                groupKey={groupKey}
                groupBy={groupBy}
                count={errors.length}
                isExpanded={isExpanded}
                onToggle={() => toggleGroup(groupKey)}
              />

              {isExpanded && (
                <div className="p-3 space-y-2 border-t border-gray-200 dark:border-gray-700">
                  {errors.map(error => (
                    <ValidationErrorItem
                      key={`${error.code}:${error.field}:${error.message}`}
                      error={error}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Controls */}
      <div className="space-y-3">
        {/* Search */}
        {enableSearch && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search validation results..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {/* Filters and Grouping */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Filter buttons */}
          <div className="flex gap-2">
            <FilterButton
              filter="all"
              currentFilter={filter}
              count={totalCount}
              onClick={setFilter}
              colorType="success"
            />
            <FilterButton
              filter="errors"
              currentFilter={filter}
              count={errorCount}
              onClick={setFilter}
              colorType="error"
            />
            <FilterButton
              filter="warnings"
              currentFilter={filter}
              count={warningCount}
              onClick={setFilter}
              colorType="warning"
            />
            <FilterButton
              filter="suggestions"
              currentFilter={filter}
              count={suggestionCount}
              onClick={setFilter}
              colorType="success"
            />
          </div>

          {/* Group by selector */}
          {enableGrouping && (
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={groupBy}
                onChange={e => setGroupBy(e.target.value as GroupByType)}
                className="text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-2 py-1"
              >
                <option value="none">No Grouping</option>
                <option value="field">Group by Field</option>
                <option value="category">Group by Category</option>
                <option value="severity">Group by Severity</option>
              </select>
            </div>
          )}
        </div>

        {/* Results summary */}
        {(searchTerm || filter !== "all") && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {filteredValidation && (
              <>
                Showing{" "}
                {filteredValidation.errors.length +
                  filteredValidation.warnings.length +
                  filteredValidation.suggestions.length}{" "}
                of {totalCount} results
                {searchTerm && ` for "${searchTerm}"`}
              </>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {renderGroupedContent()}
    </div>
  );
}

/**
 * Compact filterable validation display for smaller spaces
 */
export function CompactFilterableValidationDisplay({
  validation,
  className = "",
}: {
  validation: ValidationResult | null;
  className?: string;
}) {
  const [filter, setFilter] = useState<FilterType>("all");

  if (!validation) return null;

  const errorCount = validation.errors.filter(e => e.severity === "error").length;
  const warningCount = validation.warnings.length;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex gap-1">
        <FilterButton
          filter="all"
          currentFilter={filter}
          count={errorCount + warningCount}
          onClick={setFilter}
          colorType="success"
        />
        <FilterButton
          filter="errors"
          currentFilter={filter}
          count={errorCount}
          onClick={setFilter}
          colorType="error"
        />
        <FilterButton
          filter="warnings"
          currentFilter={filter}
          count={warningCount}
          onClick={setFilter}
          colorType="warning"
        />
      </div>

      <ValidationDisplay
        validation={{
          ...validation,
          errors: filter === "all" || filter === "errors" ? validation.errors : [],
          warnings: filter === "all" || filter === "warnings" ? validation.warnings : [],
          suggestions: filter === "all" || filter === "suggestions" ? validation.suggestions : [],
        }}
        showSuggestions={filter === "all" || filter === "suggestions"}
      />
    </div>
  );
}

export default FilterableValidationDisplay;
