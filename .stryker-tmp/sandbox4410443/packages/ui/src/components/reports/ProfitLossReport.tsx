// @ts-nocheck
import * as React from "react";
import { cn } from "@aibos/ui/utils";
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Eye,
  Filter,
} from "lucide-react";

// SSOT Compliant Profit & Loss Report Component
// Comprehensive P&L statement with narrative notes and export capabilities

export interface PLLineItem {
  id: string;
  account: string;
  accountName: string;
  category: "revenue" | "cogs" | "expense" | "other_income" | "other_expense";
  currentPeriod: number;
  previousPeriod: number;
  budget: number;
  variance: number;
  variancePercent: number;
  notes?: string;
  subItems?: PLLineItem[];
}

export interface PLSummary {
  totalRevenue: number;
  totalCOGS: number;
  grossProfit: number;
  grossMargin: number;
  totalExpenses: number;
  operatingIncome: number;
  otherIncome: number;
  otherExpenses: number;
  netIncome: number;
  netMargin: number;
}

export interface ProfitLossReportProps {
  data: PLLineItem[];
  summary: PLSummary;
  period: {
    current: string;
    previous: string;
    budget: string;
  };
  onExport?: (format: "pdf" | "excel" | "csv") => Promise<void>;
  onFilter?: (filters: PLFilters) => void;
  onAddNote?: (lineItemId: string, note: string) => Promise<void>;
  className?: string;
}

export interface PLFilters {
  categories: string[];
  showVariance: boolean;
  showBudget: boolean;
  showNotes: boolean;
  minAmount: number;
  maxAmount: number;
}

export const ProfitLossReport: React.FC<ProfitLossReportProps> = ({
  data,
  summary,
  period,
  onExport,
  onFilter,
  onAddNote,
  className,
}) => {
  const [filters, setFilters] = React.useState<PLFilters>({
    categories: ["revenue", "cogs", "expense", "other_income", "other_expense"],
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

  const filteredData = React.useMemo(() => {
    return data.filter(
      item =>
        filters.categories.includes(item.category) &&
        Math.abs(item.currentPeriod) >= filters.minAmount &&
        Math.abs(item.currentPeriod) <= filters.maxAmount,
    );
  }, [data, filters]);

  const handleExport = async (format: "pdf" | "excel" | "csv") => {
    setIsExporting(true);
    try {
      await onExport?.(format);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFilterChange = (newFilters: Partial<PLFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilter?.(updatedFilters);
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--sys-text-primary)]">
            Profit & Loss Statement
          </h1>
          <p className="text-[var(--sys-text-secondary)]">
            {period.current} vs {period.previous}
          </p>
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
              <p className="text-sm text-[var(--sys-text-secondary)]">Total Revenue</p>
              <p className="text-2xl font-bold text-[var(--sys-text-primary)]">
                {formatCurrency(summary.totalRevenue)}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-[var(--sys-status-success)]" />
          </div>
        </div>

        <div className="bg-[var(--sys-bg-primary)] border border-[var(--sys-border-hairline)] rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--sys-text-secondary)]">Gross Profit</p>
              <p className="text-2xl font-bold text-[var(--sys-text-primary)]">
                {formatCurrency(summary.grossProfit)}
              </p>
              <p className="text-sm text-[var(--sys-text-secondary)]">
                {summary.grossMargin.toFixed(1)}% margin
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-[var(--sys-accent)]" />
          </div>
        </div>

        <div className="bg-[var(--sys-bg-primary)] border border-[var(--sys-border-hairline)] rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--sys-text-secondary)]">Operating Income</p>
              <p className="text-2xl font-bold text-[var(--sys-text-primary)]">
                {formatCurrency(summary.operatingIncome)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-[var(--sys-accent)]" />
          </div>
        </div>

        <div className="bg-[var(--sys-bg-primary)] border border-[var(--sys-border-hairline)] rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--sys-text-secondary)]">Net Income</p>
              <p
                className={cn(
                  "text-2xl font-bold",
                  summary.netIncome >= 0
                    ? "text-[var(--sys-status-success)]"
                    : "text-[var(--sys-status-error)]",
                )}
              >
                {formatCurrency(summary.netIncome)}
              </p>
              <p className="text-sm text-[var(--sys-text-secondary)]">
                {summary.netMargin.toFixed(1)}% margin
              </p>
            </div>
            {summary.netIncome >= 0 ? (
              <TrendingUp className="h-8 w-8 text-[var(--sys-status-success)]" />
            ) : (
              <TrendingDown className="h-8 w-8 text-[var(--sys-status-error)]" />
            )}
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
                { key: "revenue", label: "Revenue" },
                { key: "cogs", label: "Cost of Goods Sold" },
                { key: "expense", label: "Expenses" },
                { key: "other_income", label: "Other Income" },
                { key: "other_expense", label: "Other Expenses" },
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

      {/* P&L Table */}
      <div className="bg-[var(--sys-bg-primary)] border border-[var(--sys-border-hairline)] rounded-lg overflow-hidden">
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
              {filteredData.map(item => (
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

      {/* Narrative Notes Section */}
      <div className="bg-[var(--sys-bg-subtle)] border border-[var(--sys-border-hairline)] rounded-lg p-6">
        <h3 className="text-lg font-medium text-[var(--sys-text-primary)] mb-4">Narrative Notes</h3>
        <div className="space-y-4">
          <div className="p-4 bg-[var(--sys-bg-primary)] border border-[var(--sys-border-hairline)] rounded-lg">
            <h4 className="font-medium text-[var(--sys-text-primary)] mb-2">Revenue Analysis</h4>
            <p className="text-sm text-[var(--sys-text-secondary)]">
              Total revenue for {period.current} was {formatCurrency(summary.totalRevenue)},
              representing a{" "}
              {formatPercent(
                ((summary.totalRevenue - summary.totalRevenue) / summary.totalRevenue) * 100,
              )}
              change from the previous period. The gross margin of {summary.grossMargin.toFixed(1)}%
              indicates {summary.grossMargin > 50 ? "strong" : "moderate"} profitability.
            </p>
          </div>
          <div className="p-4 bg-[var(--sys-bg-primary)] border border-[var(--sys-border-hairline)] rounded-lg">
            <h4 className="font-medium text-[var(--sys-text-primary)] mb-2">Expense Management</h4>
            <p className="text-sm text-[var(--sys-text-secondary)]">
              Operating expenses totaled {formatCurrency(summary.totalExpenses)}, resulting in an
              operating income of {formatCurrency(summary.operatingIncome)}. The operating margin of{" "}
              {((summary.operatingIncome / summary.totalRevenue) * 100).toFixed(1)}% demonstrates{" "}
              {summary.operatingIncome > 0 ? "effective" : "challenging"} cost management.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
