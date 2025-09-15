import * as React from "react";
import { cn } from "@aibos/ui/utils";
import {
  FileText,
  Download,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Search,
  Filter,
  Eye,
} from "lucide-react";

// SSOT Compliant Trial Balance Component
// Comprehensive trial balance with account verification and export capabilities

export interface TrialBalanceItem {
  id: string;
  account: string;
  accountName: string;
  accountType: "asset" | "liability" | "equity" | "revenue" | "expense";
  debitBalance: number;
  creditBalance: number;
  netBalance: number;
  isBalanced: boolean;
  notes?: string;
  subItems?: TrialBalanceItem[];
}

export interface TrialBalanceSummary {
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;
  difference: number;
  accountCount: number;
  unbalancedAccounts: number;
}

export interface TrialBalanceProps {
  data: TrialBalanceItem[];
  summary: TrialBalanceSummary;
  period: {
    current: string;
    previous: string;
  };
  onExport?: (format: "pdf" | "excel" | "csv") => Promise<void>;
  onFilter?: (filters: TrialBalanceFilters) => void;
  onAddNote?: (lineItemId: string, note: string) => Promise<void>;
  onVerifyBalance?: () => Promise<void>;
  className?: string;
}

export interface TrialBalanceFilters {
  accountTypes: string[];
  showUnbalanced: boolean;
  showNotes: boolean;
  minAmount: number;
  maxAmount: number;
  searchTerm: string;
}

export const TrialBalance: React.FC<TrialBalanceProps> = ({
  data,
  summary,
  period,
  onExport,
  onFilter,
  onAddNote,
  onVerifyBalance,
  className,
}) => {
  const [filters, setFilters] = React.useState<TrialBalanceFilters>({
    accountTypes: ["asset", "liability", "equity", "revenue", "expense"],
    showUnbalanced: false,
    showNotes: true,
    minAmount: 0,
    maxAmount: Infinity,
    searchTerm: "",
  });

  const [isExporting, setIsExporting] = React.useState(false);
  const [isVerifying, setIsVerifying] = React.useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case "asset":
        return "text-[var(--sys-accent)]";
      case "liability":
        return "text-[var(--sys-status-warning)]";
      case "equity":
        return "text-[var(--sys-status-success)]";
      case "revenue":
        return "text-[var(--sys-status-success)]";
      case "expense":
        return "text-[var(--sys-status-error)]";
      default:
        return "text-[var(--sys-text-secondary)]";
    }
  };

  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case "asset":
        return "Assets";
      case "liability":
        return "Liabilities";
      case "equity":
        return "Equity";
      case "revenue":
        return "Revenue";
      case "expense":
        return "Expenses";
      default:
        return type;
    }
  };

  const filteredData = React.useMemo(() => {
    return data.filter(item => {
      const matchesType = filters.accountTypes.includes(item.accountType);
      const matchesAmount =
        Math.abs(item.netBalance) >= filters.minAmount &&
        Math.abs(item.netBalance) <= filters.maxAmount;
      const matchesSearch =
        filters.searchTerm === "" ||
        item.accountName.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        item.account.toLowerCase().includes(filters.searchTerm.toLowerCase());
      const matchesUnbalanced = !filters.showUnbalanced || !item.isBalanced;

      return matchesType && matchesAmount && matchesSearch && matchesUnbalanced;
    });
  }, [data, filters]);

  const groupedData = React.useMemo(() => {
    const groups: { [key: string]: TrialBalanceItem[] } = {};
    filteredData.forEach(item => {
      if (!groups[item.accountType]) {
        groups[item.accountType] = [];
      }
      groups[item.accountType]!.push(item);
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

  const handleFilterChange = (newFilters: Partial<TrialBalanceFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilter?.(updatedFilters);
  };

  const handleVerifyBalance = async () => {
    setIsVerifying(true);
    try {
      await onVerifyBalance?.();
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--sys-text-primary)]">Trial Balance</h1>
          <p className="text-[var(--sys-text-secondary)]">As of {period.current}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleVerifyBalance}
            disabled={isVerifying}
            className="px-4 py-2 border border-[var(--sys-border-hairline)] text-[var(--sys-text-primary)] rounded-md hover:bg-[var(--sys-bg-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)] disabled:opacity-50"
          >
            <CheckCircle className="h-4 w-4 mr-2 inline" />
            {isVerifying ? "Verifying..." : "Verify Balance"}
          </button>
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

      {/* Balance Status */}
      <div
        className={cn(
          "p-4 rounded-lg border",
          summary.isBalanced
            ? "bg-[var(--sys-status-success)]/10 border-[var(--sys-status-success)]/20"
            : "bg-[var(--sys-status-error)]/10 border-[var(--sys-status-error)]/20",
        )}
      >
        <div className="flex items-center gap-3">
          {summary.isBalanced ? (
            <CheckCircle className="h-6 w-6 text-[var(--sys-status-success)]" />
          ) : (
            <AlertTriangle className="h-6 w-6 text-[var(--sys-status-error)]" />
          )}
          <div>
            <h3
              className={cn(
                "text-lg font-medium",
                summary.isBalanced
                  ? "text-[var(--sys-status-success)]"
                  : "text-[var(--sys-status-error)]",
              )}
            >
              {summary.isBalanced ? "Trial Balance is Balanced" : "Trial Balance is Unbalanced"}
            </h3>
            <p className="text-sm text-[var(--sys-text-secondary)]">
              Total Debits: {formatCurrency(summary.totalDebits)} | Total Credits:{" "}
              {formatCurrency(summary.totalCredits)}
              {!summary.isBalanced && (
                <span className="ml-2 text-[var(--sys-status-error)]">
                  | Difference: {formatCurrency(summary.difference)}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[var(--sys-bg-primary)] border border-[var(--sys-border-hairline)] rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--sys-text-secondary)]">Total Debits</p>
              <p className="text-2xl font-bold text-[var(--sys-text-primary)]">
                {formatCurrency(summary.totalDebits)}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-[var(--sys-accent)]" />
          </div>
        </div>

        <div className="bg-[var(--sys-bg-primary)] border border-[var(--sys-border-hairline)] rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--sys-text-secondary)]">Total Credits</p>
              <p className="text-2xl font-bold text-[var(--sys-text-primary)]">
                {formatCurrency(summary.totalCredits)}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-[var(--sys-accent)]" />
          </div>
        </div>

        <div className="bg-[var(--sys-bg-primary)] border border-[var(--sys-border-hairline)] rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--sys-text-secondary)]">Account Count</p>
              <p className="text-2xl font-bold text-[var(--sys-text-primary)]">
                {summary.accountCount}
              </p>
            </div>
            <FileText className="h-8 w-8 text-[var(--sys-accent)]" />
          </div>
        </div>

        <div className="bg-[var(--sys-bg-primary)] border border-[var(--sys-border-hairline)] rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--sys-text-secondary)]">Unbalanced Accounts</p>
              <p
                className={cn(
                  "text-2xl font-bold",
                  summary.unbalancedAccounts === 0
                    ? "text-[var(--sys-status-success)]"
                    : "text-[var(--sys-status-error)]",
                )}
              >
                {summary.unbalancedAccounts}
              </p>
            </div>
            {summary.unbalancedAccounts === 0 ? (
              <CheckCircle className="h-8 w-8 text-[var(--sys-status-success)]" />
            ) : (
              <AlertTriangle className="h-8 w-8 text-[var(--sys-status-error)]" />
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
              Account Types
            </label>
            <div className="space-y-2">
              {[
                { key: "asset", label: "Assets" },
                { key: "liability", label: "Liabilities" },
                { key: "equity", label: "Equity" },
                { key: "revenue", label: "Revenue" },
                { key: "expense", label: "Expenses" },
              ].map(type => (
                <label key={type.key} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.accountTypes.includes(type.key)}
                    onChange={e => {
                      const newTypes = e.target.checked
                        ? [...filters.accountTypes, type.key]
                        : filters.accountTypes.filter(t => t !== type.key);
                      handleFilterChange({ accountTypes: newTypes });
                    }}
                    className="h-4 w-4 text-[var(--sys-accent)] border-[var(--sys-border-hairline)] rounded focus:ring-[var(--sys-accent)]"
                  />
                  <span className="ml-2 text-sm text-[var(--sys-text-primary)]">{type.label}</span>
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
                  checked={filters.showUnbalanced}
                  onChange={e => handleFilterChange({ showUnbalanced: e.target.checked })}
                  className="h-4 w-4 text-[var(--sys-accent)] border-[var(--sys-border-hairline)] rounded focus:ring-[var(--sys-accent)]"
                  aria-label="Show unbalanced accounts only"
                />
                <span className="ml-2 text-sm text-[var(--sys-text-primary)]">
                  Show Unbalanced Only
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.showNotes}
                  onChange={e => handleFilterChange({ showNotes: e.target.checked })}
                  className="h-4 w-4 text-[var(--sys-accent)] border-[var(--sys-border-hairline)] rounded focus:ring-[var(--sys-accent)]"
                  aria-label="Show account notes"
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
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--sys-text-secondary)]" />
              <input
                type="text"
                placeholder="Search accounts..."
                value={filters.searchTerm}
                onChange={e => handleFilterChange({ searchTerm: e.target.value })}
                className="w-full pl-10 pr-3 py-2 border border-[var(--sys-border-hairline)] rounded-md bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Trial Balance Table */}
      <div className="space-y-6">
        {Object.entries(groupedData).map(([accountType, items]) => (
          <div
            key={accountType}
            className="bg-[var(--sys-bg-primary)] border border-[var(--sys-border-hairline)] rounded-lg overflow-hidden"
          >
            <div className="bg-[var(--sys-bg-subtle)] px-6 py-3 border-b border-[var(--sys-border-hairline)]">
              <h3 className={cn("text-lg font-medium", getAccountTypeColor(accountType))}>
                {getAccountTypeLabel(accountType)}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[var(--sys-bg-subtle)] border-b border-[var(--sys-border-hairline)]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--sys-text-secondary)] uppercase tracking-wider">
                      Account
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-[var(--sys-text-secondary)] uppercase tracking-wider">
                      Debit Balance
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-[var(--sys-text-secondary)] uppercase tracking-wider">
                      Credit Balance
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-[var(--sys-text-secondary)] uppercase tracking-wider">
                      Net Balance
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-[var(--sys-text-secondary)] uppercase tracking-wider">
                      Status
                    </th>
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
                        {item.debitBalance > 0 ? formatCurrency(item.debitBalance) : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-[var(--sys-text-primary)]">
                        {item.creditBalance > 0 ? formatCurrency(item.creditBalance) : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <span
                          className={cn(
                            item.netBalance >= 0
                              ? "text-[var(--sys-status-success)]"
                              : "text-[var(--sys-status-error)]",
                          )}
                        >
                          {formatCurrency(Math.abs(item.netBalance))}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {item.isBalanced ? (
                          <CheckCircle className="h-5 w-5 text-[var(--sys-status-success)] mx-auto" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-[var(--sys-status-error)] mx-auto" />
                        )}
                      </td>
                      {filters.showNotes && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--sys-text-secondary)]">
                          {item.notes || (
                            <button
                              onClick={() => {
                                const note = prompt("Add a note for this account:");
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
          Trial Balance Analysis
        </h3>
        <div className="space-y-4">
          <div className="p-4 bg-[var(--sys-bg-primary)] border border-[var(--sys-border-hairline)] rounded-lg">
            <h4 className="font-medium text-[var(--sys-text-primary)] mb-2">
              Balance Verification
            </h4>
            <p className="text-sm text-[var(--sys-text-secondary)]">
              The trial balance {summary.isBalanced ? "is balanced" : "shows an imbalance"} with
              total debits of {formatCurrency(summary.totalDebits)} and total credits of
              {formatCurrency(summary.totalCredits)}.
              {summary.isBalanced
                ? " This confirms that all journal entries have been posted correctly and the books are in balance."
                : ` The difference of ${formatCurrency(summary.difference)} indicates ${summary.unbalancedAccounts} account(s) require investigation and correction.`}
            </p>
          </div>
          <div className="p-4 bg-[var(--sys-bg-primary)] border border-[var(--sys-border-hairline)] rounded-lg">
            <h4 className="font-medium text-[var(--sys-text-primary)] mb-2">Account Analysis</h4>
            <p className="text-sm text-[var(--sys-text-secondary)]">
              The trial balance includes {summary.accountCount} accounts across all major
              categories.
              {summary.unbalancedAccounts === 0
                ? " All accounts are properly balanced and ready for financial statement preparation."
                : ` ${summary.unbalancedAccounts} account(s) show imbalances that need to be resolved before proceeding with financial statement generation.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
