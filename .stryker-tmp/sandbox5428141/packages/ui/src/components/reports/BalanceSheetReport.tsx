// @ts-nocheck
import * as React from "react";
import { cn } from "@aibos/ui/utils";
import {
  FileText,
  Download,
  Calendar,
  Building2,
  CreditCard,
  PiggyBank,
  BarChart3,
  Eye,
  Filter,
} from "lucide-react";

// SSOT Compliant Balance Sheet Report Component
// Comprehensive balance sheet with asset/liability analysis and export capabilities

export interface BalanceSheetItem {
  id: string;
  account: string;
  accountName: string;
  category:
    | "current_assets"
    | "fixed_assets"
    | "current_liabilities"
    | "long_term_liabilities"
    | "equity";
  subcategory?: string;
  currentPeriod: number;
  previousPeriod: number;
  budget: number;
  variance: number;
  variancePercent: number;
  notes?: string;
  subItems?: BalanceSheetItem[];
}

export interface BalanceSheetSummary {
  totalCurrentAssets: number;
  totalFixedAssets: number;
  totalAssets: number;
  totalCurrentLiabilities: number;
  totalLongTermLiabilities: number;
  totalLiabilities: number;
  totalEquity: number;
  workingCapital: number;
  debtToEquityRatio: number;
  currentRatio: number;
}

export interface BalanceSheetReportProps {
  data: BalanceSheetItem[];
  summary: BalanceSheetSummary;
  period: {
    current: string;
    previous: string;
    budget: string;
  };
  onExport?: (format: "pdf" | "excel" | "csv") => Promise<void>;
  onFilter?: (filters: BalanceSheetFilters) => void;
  onAddNote?: (lineItemId: string, note: string) => Promise<void>;
  className?: string;
}

export interface BalanceSheetFilters {
  categories: string[];
  showVariance: boolean;
  showBudget: boolean;
  showNotes: boolean;
  minAmount: number;
  maxAmount: number;
}

export const BalanceSheetReport: React.FC<BalanceSheetReportProps> = ({
  data,
  summary,
  period,
  onExport,
  onFilter,
  onAddNote,
  className,
}) => {
  const [filters, setFilters] = React.useState<BalanceSheetFilters>({
    categories: [
      "current_assets",
      "fixed_assets",
      "current_liabilities",
      "long_term_liabilities",
      "equity",
    ],
    showVariance: true,
    showBudget: true,
    showNotes: true,
    minAmount: 0,
    maxAmount: Infinity,
  });

  const [selectedPeriod, setSelectedPeriod] = React.useState<"current" | "previous" | "budget">(
    "current",
  );
  const [isExporting, setIsExporting] = React.useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercent = (percent: number) => {
    return `${percent >= 0 ? "+" : ""}${percent.toFixed(1)}%`;
  };

  const getVarianceColor = (variance: number) => {
    if (variance > 0) return "text-[var(--sys-status-success)]";
    if (variance < 0) return "text-[var(--sys-status-error)]";
    return "text-[var(--sys-text-secondary)]";
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "current_assets":
        return <CreditCard className="h-5 w-5 text-[var(--sys-accent)]" />;
      case "fixed_assets":
        return <Building2 className="h-5 w-5 text-[var(--sys-accent)]" />;
      case "current_liabilities":
        return <CreditCard className="h-5 w-5 text-[var(--sys-status-warning)]" />;
      case "long_term_liabilities":
        return <Building2 className="h-5 w-5 text-[var(--sys-status-warning)]" />;
      case "equity":
        return <PiggyBank className="h-5 w-5 text-[var(--sys-status-success)]" />;
      default:
        return <BarChart3 className="h-5 w-5 text-[var(--sys-text-secondary)]" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "current_assets":
        return "Current Assets";
      case "fixed_assets":
        return "Fixed Assets";
      case "current_liabilities":
        return "Current Liabilities";
      case "long_term_liabilities":
        return "Long-term Liabilities";
      case "equity":
        return "Equity";
      default:
        return category;
    }
  };

  const filteredData = React.useMemo(() => {
    return data.filter(
      item =>
        filters.categories.includes(item.category) &&
        Math.abs(item.currentPeriod) >= filters.minAmount &&
        Math.abs(item.currentPeriod) <= filters.maxAmount,
    );
  }, [data, filters]);

  const groupedData = React.useMemo(() => {
    const groups: { [key: string]: BalanceSheetItem[] } = {};
    filteredData.forEach(item => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category]!.push(item);
    });
    return groups;
  }, [filteredData]);

  const handleExport = async (format: "pdf" | "excel" | "csv") => {
    setIsExporting(true);
    try {
      await onExport?.(format);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFilterChange = (newFilters: Partial<BalanceSheetFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilter?.(updatedFilters);
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--sys-text-primary)]">Balance Sheet</h1>
          <p className="text-[var(--sys-text-secondary)]">As of {period.current}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport("pdf")}
            disabled={isExporting}
            className="px-4 py-2 bg-[var(--sys-accent)] text-white rounded-md hover:bg-[var(--sys-accent)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)] disabled:opacity-50"
          >
            <Download className="h-4 w-4 mr-2 inline" />
            Export PDF
          </button>
          <button
            onClick={() => handleExport("excel")}
            disabled={isExporting}
            className="px-4 py-2 border border-[var(--sys-border-hairline)] text-[var(--sys-text-primary)] rounded-md hover:bg-[var(--sys-bg-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)] disabled:opacity-50"
          >
            <FileText className="h-4 w-4 mr-2 inline" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[var(--sys-bg-primary)] border border-[var(--sys-border-hairline)] rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--sys-text-secondary)]">Total Assets</p>
              <p className="text-2xl font-bold text-[var(--sys-text-primary)]">
                {formatCurrency(summary.totalAssets)}
              </p>
            </div>
            <Building2 className="h-8 w-8 text-[var(--sys-accent)]" />
          </div>
        </div>

        <div className="bg-[var(--sys-bg-primary)] border border-[var(--sys-border-hairline)] rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--sys-text-secondary)]">Total Liabilities</p>
              <p className="text-2xl font-bold text-[var(--sys-text-primary)]">
                {formatCurrency(summary.totalLiabilities)}
              </p>
            </div>
            <CreditCard className="h-8 w-8 text-[var(--sys-status-warning)]" />
          </div>
        </div>

        <div className="bg-[var(--sys-bg-primary)] border border-[var(--sys-border-hairline)] rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--sys-text-secondary)]">Total Equity</p>
              <p className="text-2xl font-bold text-[var(--sys-text-primary)]">
                {formatCurrency(summary.totalEquity)}
              </p>
            </div>
            <PiggyBank className="h-8 w-8 text-[var(--sys-status-success)]" />
          </div>
        </div>

        <div className="bg-[var(--sys-bg-primary)] border border-[var(--sys-border-hairline)] rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--sys-text-secondary)]">Working Capital</p>
              <p
                className={cn(
                  "text-2xl font-bold",
                  summary.workingCapital >= 0
                    ? "text-[var(--sys-status-success)]"
                    : "text-[var(--sys-status-error)]",
                )}
              >
                {formatCurrency(summary.workingCapital)}
              </p>
              <p className="text-sm text-[var(--sys-text-secondary)]">
                Current Ratio: {summary.currentRatio.toFixed(2)}
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-[var(--sys-accent)]" />
          </div>
        </div>
      </div>

      {/* Financial Ratios */}
      <div className="bg-[var(--sys-bg-subtle)] border border-[var(--sys-border-hairline)] rounded-lg p-6">
        <h3 className="text-lg font-medium text-[var(--sys-text-primary)] mb-4">
          Key Financial Ratios
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm text-[var(--sys-text-secondary)]">Current Ratio</p>
            <p className="text-2xl font-bold text-[var(--sys-text-primary)]">
              {summary.currentRatio.toFixed(2)}
            </p>
            <p className="text-xs text-[var(--sys-text-secondary)]">
              {summary.currentRatio >= 2
                ? "Strong"
                : summary.currentRatio >= 1
                  ? "Adequate"
                  : "Weak"}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-[var(--sys-text-secondary)]">Debt-to-Equity</p>
            <p className="text-2xl font-bold text-[var(--sys-text-primary)]">
              {summary.debtToEquityRatio.toFixed(2)}
            </p>
            <p className="text-xs text-[var(--sys-text-secondary)]">
              {summary.debtToEquityRatio <= 0.5
                ? "Conservative"
                : summary.debtToEquityRatio <= 1
                  ? "Moderate"
                  : "Aggressive"}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-[var(--sys-text-secondary)]">Working Capital</p>
            <p
              className={cn(
                "text-2xl font-bold",
                summary.workingCapital >= 0
                  ? "text-[var(--sys-status-success)]"
                  : "text-[var(--sys-status-error)]",
              )}
            >
              {formatCurrency(summary.workingCapital)}
            </p>
            <p className="text-xs text-[var(--sys-text-secondary)]">
              {summary.workingCapital >= 0 ? "Positive" : "Negative"}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[var(--sys-bg-subtle)] border border-[var(--sys-border-hairline)] rounded-lg p-4">
        <div className="flex items-center gap-4 mb-4">
          <Filter className="h-5 w-5 text-[var(--sys-text-secondary)]" />
          <h3 className="text-lg font-medium text-[var(--sys-text-primary)]">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--sys-text-primary)] mb-2">
              Categories
            </label>
            <div className="space-y-2">
              {[
                { key: "current_assets", label: "Current Assets" },
                { key: "fixed_assets", label: "Fixed Assets" },
                { key: "current_liabilities", label: "Current Liabilities" },
                { key: "long_term_liabilities", label: "Long-term Liabilities" },
                { key: "equity", label: "Equity" },
              ].map(category => (
                <label key={category.key} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.categories.includes(category.key)}
                    onChange={e => {
                      const newCategories = e.target.checked
                        ? [...filters.categories, category.key]
                        : filters.categories.filter(c => c !== category.key);
                      handleFilterChange({ categories: newCategories });
                    }}
                    className="h-4 w-4 text-[var(--sys-accent)] border-[var(--sys-border-hairline)] rounded focus:ring-[var(--sys-accent)]"
                  />
                  <span className="ml-2 text-sm text-[var(--sys-text-primary)]">
                    {category.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--sys-text-primary)] mb-2">
              Display Options
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.showVariance}
                  onChange={e => handleFilterChange({ showVariance: e.target.checked })}
                  className="h-4 w-4 text-[var(--sys-accent)] border-[var(--sys-border-hairline)] rounded focus:ring-[var(--sys-accent)]"
                />
                <span className="ml-2 text-sm text-[var(--sys-text-primary)]">Show Variance</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.showBudget}
                  onChange={e => handleFilterChange({ showBudget: e.target.checked })}
                  className="h-4 w-4 text-[var(--sys-accent)] border-[var(--sys-border-hairline)] rounded focus:ring-[var(--sys-accent)]"
                />
                <span className="ml-2 text-sm text-[var(--sys-text-primary)]">Show Budget</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.showNotes}
                  onChange={e => handleFilterChange({ showNotes: e.target.checked })}
                  className="h-4 w-4 text-[var(--sys-accent)] border-[var(--sys-border-hairline)] rounded focus:ring-[var(--sys-accent)]"
                />
                <span className="ml-2 text-sm text-[var(--sys-text-primary)]">Show Notes</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--sys-text-primary)] mb-2">
              Amount Range
            </label>
            <div className="space-y-2">
              <input
                type="number"
                placeholder="Min Amount"
                value={filters.minAmount || ""}
                onChange={e => handleFilterChange({ minAmount: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-[var(--sys-border-hairline)] rounded-md bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
              />
              <input
                type="number"
                placeholder="Max Amount"
                value={filters.maxAmount === Infinity ? "" : filters.maxAmount}
                onChange={e =>
                  handleFilterChange({ maxAmount: Number(e.target.value) || Infinity })
                }
                className="w-full px-3 py-2 border border-[var(--sys-border-hairline)] rounded-md bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--sys-text-primary)] mb-2">
              Period View
            </label>
            <select
              value={selectedPeriod}
              onChange={e => setSelectedPeriod(e.target.value as "current" | "previous" | "budget")}
              className="w-full px-3 py-2 border border-[var(--sys-border-hairline)] rounded-md bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
            >
              <option value="current">Current Period</option>
              <option value="previous">Previous Period</option>
              <option value="budget">Budget</option>
            </select>
          </div>
        </div>
      </div>

      {/* Balance Sheet Table */}
      <div className="space-y-6">
        {Object.entries(groupedData).map(([category, items]) => (
          <div
            key={category}
            className="bg-[var(--sys-bg-primary)] border border-[var(--sys-border-hairline)] rounded-lg overflow-hidden"
          >
            <div className="bg-[var(--sys-bg-subtle)] px-6 py-3 border-b border-[var(--sys-border-hairline)]">
              <div className="flex items-center gap-2">
                {getCategoryIcon(category)}
                <h3 className="text-lg font-medium text-[var(--sys-text-primary)]">
                  {getCategoryLabel(category)}
                </h3>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[var(--sys-bg-subtle)] border-b border-[var(--sys-border-hairline)]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--sys-text-secondary)] uppercase tracking-wider">
                      Account
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-[var(--sys-text-secondary)] uppercase tracking-wider">
                      {selectedPeriod === "current"
                        ? period.current
                        : selectedPeriod === "previous"
                          ? period.previous
                          : period.budget}
                    </th>
                    {selectedPeriod !== "previous" && (
                      <th className="px-6 py-3 text-right text-xs font-medium text-[var(--sys-text-secondary)] uppercase tracking-wider">
                        Previous
                      </th>
                    )}
                    {selectedPeriod !== "budget" && filters.showBudget && (
                      <th className="px-6 py-3 text-right text-xs font-medium text-[var(--sys-text-secondary)] uppercase tracking-wider">
                        Budget
                      </th>
                    )}
                    {filters.showVariance && (
                      <th className="px-6 py-3 text-right text-xs font-medium text-[var(--sys-text-secondary)] uppercase tracking-wider">
                        Variance
                      </th>
                    )}
                    {filters.showNotes && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-[var(--sys-text-secondary)] uppercase tracking-wider">
                        Notes
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--sys-border-hairline)]">
                  {items.map(item => (
                    <tr key={item.id} className="hover:bg-[var(--sys-bg-subtle)]">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="ml-4">
                            <div className="text-sm font-medium text-[var(--sys-text-primary)]">
                              {item.accountName}
                            </div>
                            <div className="text-sm text-[var(--sys-text-secondary)]">
                              {item.account}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-[var(--sys-text-primary)]">
                        {formatCurrency(
                          selectedPeriod === "current"
                            ? item.currentPeriod
                            : selectedPeriod === "previous"
                              ? item.previousPeriod
                              : item.budget,
                        )}
                      </td>
                      {selectedPeriod !== "previous" && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-[var(--sys-text-secondary)]">
                          {formatCurrency(item.previousPeriod)}
                        </td>
                      )}
                      {selectedPeriod !== "budget" && filters.showBudget && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-[var(--sys-text-secondary)]">
                          {formatCurrency(item.budget)}
                        </td>
                      )}
                      {filters.showVariance && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <span className={cn(getVarianceColor(item.variance))}>
                            {formatCurrency(item.variance)}
                          </span>
                          <div className={cn("text-xs", getVarianceColor(item.variancePercent))}>
                            {formatPercent(item.variancePercent)}
                          </div>
                        </td>
                      )}
                      {filters.showNotes && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--sys-text-secondary)]">
                          {item.notes || (
                            <button
                              onClick={() => {
                                const note = prompt("Add a note for this line item:");
                                if (note) onAddNote?.(item.id, note);
                              }}
                              className="text-[var(--sys-accent)] hover:text-[var(--sys-accent)]/80"
                            >
                              Add Note
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Narrative Notes Section */}
      <div className="bg-[var(--sys-bg-subtle)] border border-[var(--sys-border-hairline)] rounded-lg p-6">
        <h3 className="text-lg font-medium text-[var(--sys-text-primary)] mb-4">
          Financial Position Analysis
        </h3>
        <div className="space-y-4">
          <div className="p-4 bg-[var(--sys-bg-primary)] border border-[var(--sys-border-hairline)] rounded-lg">
            <h4 className="font-medium text-[var(--sys-text-primary)] mb-2">Asset Analysis</h4>
            <p className="text-sm text-[var(--sys-text-secondary)]">
              Total assets of {formatCurrency(summary.totalAssets)} consist of
              {formatCurrency(summary.totalCurrentAssets)} in current assets and
              {formatCurrency(summary.totalFixedAssets)} in fixed assets. The current ratio of{" "}
              {summary.currentRatio.toFixed(2)} indicates
              {summary.currentRatio >= 2
                ? "strong"
                : summary.currentRatio >= 1
                  ? "adequate"
                  : "weak"}
              short-term liquidity.
            </p>
          </div>
          <div className="p-4 bg-[var(--sys-bg-primary)] border border-[var(--sys-border-hairline)] rounded-lg">
            <h4 className="font-medium text-[var(--sys-text-primary)] mb-2">
              Liability & Equity Analysis
            </h4>
            <p className="text-sm text-[var(--sys-text-secondary)]">
              Total liabilities of {formatCurrency(summary.totalLiabilities)} and equity of{" "}
              {formatCurrency(summary.totalEquity)} result in a debt-to-equity ratio of{" "}
              {summary.debtToEquityRatio.toFixed(2)}. Working capital of{" "}
              {formatCurrency(summary.workingCapital)}
              {summary.workingCapital >= 0 ? "provides" : "limits"} operational flexibility.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
