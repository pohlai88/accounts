import * as React from "react";
import { cn } from "@aibos/ui/utils";
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  BarChart3,
  Eye,
  Filter,
  Clock,
  User,
  CheckCircle,
  Search,
} from "lucide-react";

// SSOT Compliant Accounts Receivable Aging Report Component
// Comprehensive AR aging analysis with collection insights and export capabilities

export interface ARAgingItem {
  id: string;
  customerId: string;
  customerName: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  originalAmount: number;
  currentBalance: number;
  daysOverdue: number;
  agingBucket: "current" | "1-30" | "31-60" | "61-90" | "over-90";
  status: "current" | "overdue" | "disputed" | "bad_debt";
  lastPaymentDate?: string;
  lastContactDate?: string;
  notes?: string;
}

export interface ARAgingSummary {
  totalReceivables: number;
  currentAmount: number;
  overdueAmount: number;
  agingBuckets: {
    current: number;
    "1-30": number;
    "31-60": number;
    "61-90": number;
    "over-90": number;
  };
  averageDaysOutstanding: number;
  collectionRate: number;
  badDebtReserve: number;
  disputedAmount: number;
}

export interface ARAgingReportProps {
  data: ARAgingItem[];
  summary: ARAgingSummary;
  period: {
    current: string;
    previous: string;
  };
  onExport?: (format: "pdf" | "excel" | "csv") => Promise<void>;
  onFilter?: (filters: ARAgingFilters) => void;
  onAddNote?: (itemId: string, note: string) => Promise<void>;
  onContactCustomer?: (customerId: string) => Promise<void>;
  onMarkDisputed?: (itemId: string) => Promise<void>;
  className?: string;
}

export interface ARAgingFilters {
  agingBuckets: string[];
  statuses: string[];
  showOverdue: boolean;
  showNotes: boolean;
  minAmount: number;
  maxAmount: number;
  searchTerm: string;
  customerId?: string;
}

export const ARAgingReport: React.FC<ARAgingReportProps> = ({
  data,
  summary,
  period,
  onExport,
  onFilter,
  onAddNote,
  onContactCustomer,
  onMarkDisputed,
  className,
}) => {
  const [filters, setFilters] = React.useState<ARAgingFilters>({
    agingBuckets: ["current", "1-30", "31-60", "61-90", "over-90"],
    statuses: ["current", "overdue", "disputed", "bad_debt"],
    showOverdue: false,
    showNotes: true,
    minAmount: 0,
    maxAmount: Infinity,
    searchTerm: "",
  });

  const [isExporting, setIsExporting] = React.useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getAgingBucketColor = (bucket: string) => {
    switch (bucket) {
      case "current":
        return "text-[var(--sys-status-success)]";
      case "1-30":
        return "text-[var(--sys-status-warning)]";
      case "31-60":
        return "text-[var(--sys-status-error)]";
      case "61-90":
        return "text-[var(--sys-status-error)]";
      case "over-90":
        return "text-[var(--sys-status-error)]";
      default:
        return "text-[var(--sys-text-secondary)]";
    }
  };

  const getAgingBucketLabel = (bucket: string) => {
    switch (bucket) {
      case "current":
        return "Current";
      case "1-30":
        return "1-30 Days";
      case "31-60":
        return "31-60 Days";
      case "61-90":
        return "61-90 Days";
      case "over-90":
        return "Over 90 Days";
      default:
        return bucket;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "current":
        return "text-[var(--sys-status-success)]";
      case "overdue":
        return "text-[var(--sys-status-warning)]";
      case "disputed":
        return "text-[var(--sys-status-error)]";
      case "bad_debt":
        return "text-[var(--sys-status-error)]";
      default:
        return "text-[var(--sys-text-secondary)]";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "current":
        return <Clock className="h-4 w-4 text-[var(--sys-status-success)]" />;
      case "overdue":
        return <AlertTriangle className="h-4 w-4 text-[var(--sys-status-warning)]" />;
      case "disputed":
        return <AlertTriangle className="h-4 w-4 text-[var(--sys-status-error)]" />;
      case "bad_debt":
        return <AlertTriangle className="h-4 w-4 text-[var(--sys-status-error)]" />;
      default:
        return <Clock className="h-4 w-4 text-[var(--sys-text-secondary)]" />;
    }
  };

  const filteredData = React.useMemo(() => {
    return data.filter(item => {
      const matchesBucket = filters.agingBuckets.includes(item.agingBucket);
      const matchesStatus = filters.statuses.includes(item.status);
      const matchesAmount =
        item.currentBalance >= filters.minAmount && item.currentBalance <= filters.maxAmount;
      const matchesSearch =
        filters.searchTerm === "" ||
        item.customerName.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        item.invoiceNumber.toLowerCase().includes(filters.searchTerm.toLowerCase());
      const matchesOverdue = !filters.showOverdue || item.daysOverdue > 0;
      const matchesCustomer = !filters.customerId || item.customerId === filters.customerId;

      return (
        matchesBucket &&
        matchesStatus &&
        matchesAmount &&
        matchesSearch &&
        matchesOverdue &&
        matchesCustomer
      );
    });
  }, [data, filters]);

  const groupedData = React.useMemo(() => {
    const groups: { [key: string]: ARAgingItem[] } = {};
    filteredData.forEach(item => {
      if (!groups[item.agingBucket]) {
        groups[item.agingBucket] = [];
      }
      groups[item.agingBucket]!.push(item);
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

  const handleFilterChange = (newFilters: Partial<ARAgingFilters>) => {
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
            Accounts Receivable Aging Report
          </h1>
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
              <p className="text-sm text-[var(--sys-text-secondary)]">Total Receivables</p>
              <p className="text-2xl font-bold text-[var(--sys-text-primary)]">
                {formatCurrency(summary.totalReceivables)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-[var(--sys-accent)]" />
          </div>
        </div>

        <div className="bg-[var(--sys-bg-primary)] border border-[var(--sys-border-hairline)] rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--sys-text-secondary)]">Current Amount</p>
              <p className="text-2xl font-bold text-[var(--sys-status-success)]">
                {formatCurrency(summary.currentAmount)}
              </p>
              <p className="text-sm text-[var(--sys-text-secondary)]">
                {summary.totalReceivables > 0
                  ? ((summary.currentAmount / summary.totalReceivables) * 100).toFixed(1)
                  : "0"}
                % of total
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-[var(--sys-status-success)]" />
          </div>
        </div>

        <div className="bg-[var(--sys-bg-primary)] border border-[var(--sys-border-hairline)] rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--sys-text-secondary)]">Overdue Amount</p>
              <p className="text-2xl font-bold text-[var(--sys-status-error)]">
                {formatCurrency(summary.overdueAmount)}
              </p>
              <p className="text-sm text-[var(--sys-text-secondary)]">
                {summary.totalReceivables > 0
                  ? ((summary.overdueAmount / summary.totalReceivables) * 100).toFixed(1)
                  : "0"}
                % of total
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-[var(--sys-status-error)]" />
          </div>
        </div>

        <div className="bg-[var(--sys-bg-primary)] border border-[var(--sys-border-hairline)] rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--sys-text-secondary)]">Avg Days Outstanding</p>
              <p className="text-2xl font-bold text-[var(--sys-text-primary)]">
                {summary.averageDaysOutstanding.toFixed(0)}
              </p>
              <p className="text-sm text-[var(--sys-text-secondary)]">
                Collection Rate: {(summary.collectionRate * 100).toFixed(1)}%
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-[var(--sys-accent)]" />
          </div>
        </div>
      </div>

      {/* Aging Bucket Summary */}
      <div className="bg-[var(--sys-bg-subtle)] border border-[var(--sys-border-hairline)] rounded-lg p-6">
        <h3 className="text-lg font-medium text-[var(--sys-text-primary)] mb-4">
          Aging Bucket Analysis
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {Object.entries(summary.agingBuckets).map(([bucket, amount]) => (
            <div key={bucket} className="text-center">
              <p className="text-sm text-[var(--sys-text-secondary)]">
                {getAgingBucketLabel(bucket)}
              </p>
              <p className={cn("text-2xl font-bold", getAgingBucketColor(bucket))}>
                {formatCurrency(amount)}
              </p>
              <p className="text-xs text-[var(--sys-text-secondary)]">
                {summary.totalReceivables > 0
                  ? ((amount / summary.totalReceivables) * 100).toFixed(1)
                  : "0"}
                %
              </p>
            </div>
          ))}
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
              Aging Buckets
            </label>
            <div className="space-y-2">
              {[
                { key: "current", label: "Current" },
                { key: "1-30", label: "1-30 Days" },
                { key: "31-60", label: "31-60 Days" },
                { key: "61-90", label: "61-90 Days" },
                { key: "over-90", label: "Over 90 Days" },
              ].map(bucket => (
                <label key={bucket.key} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.agingBuckets.includes(bucket.key)}
                    onChange={e => {
                      const newBuckets = e.target.checked
                        ? [...filters.agingBuckets, bucket.key]
                        : filters.agingBuckets.filter(b => b !== bucket.key);
                      handleFilterChange({ agingBuckets: newBuckets });
                    }}
                    className="h-4 w-4 text-[var(--sys-accent)] border-[var(--sys-border-hairline)] rounded focus:ring-[var(--sys-accent)]"
                  />
                  <span className="ml-2 text-sm text-[var(--sys-text-primary)]">
                    {bucket.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--sys-text-primary)] mb-2">
              Status
            </label>
            <div className="space-y-2">
              {[
                { key: "current", label: "Current" },
                { key: "overdue", label: "Overdue" },
                { key: "disputed", label: "Disputed" },
                { key: "bad_debt", label: "Bad Debt" },
              ].map(status => (
                <label key={status.key} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.statuses.includes(status.key)}
                    onChange={e => {
                      const newStatuses = e.target.checked
                        ? [...filters.statuses, status.key]
                        : filters.statuses.filter(s => s !== status.key);
                      handleFilterChange({ statuses: newStatuses });
                    }}
                    className="h-4 w-4 text-[var(--sys-accent)] border-[var(--sys-border-hairline)] rounded focus:ring-[var(--sys-accent)]"
                  />
                  <span className="ml-2 text-sm text-[var(--sys-text-primary)]">
                    {status.label}
                  </span>
                </label>
              ))}
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
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--sys-text-secondary)]" />
                <input
                  type="text"
                  placeholder="Search customers..."
                  value={filters.searchTerm}
                  onChange={e => handleFilterChange({ searchTerm: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-[var(--sys-border-hairline)] rounded-md bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
                />
              </div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.showOverdue}
                  onChange={e => handleFilterChange({ showOverdue: e.target.checked })}
                  className="h-4 w-4 text-[var(--sys-accent)] border-[var(--sys-border-hairline)] rounded focus:ring-[var(--sys-accent)]"
                />
                <span className="ml-2 text-sm text-[var(--sys-text-primary)]">
                  Show Overdue Only
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* AR Aging Table */}
      <div className="space-y-6">
        {Object.entries(groupedData).map(([bucket, items]) => (
          <div
            key={bucket}
            className="bg-[var(--sys-bg-primary)] border border-[var(--sys-border-hairline)] rounded-lg overflow-hidden"
          >
            <div className="bg-[var(--sys-bg-subtle)] px-6 py-3 border-b border-[var(--sys-border-hairline)]">
              <div className="flex items-center justify-between">
                <h3 className={cn("text-lg font-medium", getAgingBucketColor(bucket))}>
                  {getAgingBucketLabel(bucket)}
                </h3>
                <span className="text-sm text-[var(--sys-text-secondary)]">
                  {items.length} invoices •{" "}
                  {formatCurrency(items.reduce((sum, item) => sum + item.currentBalance, 0))}
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[var(--sys-bg-subtle)] border-b border-[var(--sys-border-hairline)]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--sys-text-secondary)] uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--sys-text-secondary)] uppercase tracking-wider">
                      Invoice
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--sys-text-secondary)] uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-[var(--sys-text-secondary)] uppercase tracking-wider">
                      Original Amount
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-[var(--sys-text-secondary)] uppercase tracking-wider">
                      Current Balance
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-[var(--sys-text-secondary)] uppercase tracking-wider">
                      Days Overdue
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-[var(--sys-text-secondary)] uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-[var(--sys-text-secondary)] uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--sys-border-hairline)]">
                  {items.map(item => (
                    <tr key={item.id} className="hover:bg-[var(--sys-bg-subtle)]">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-[var(--sys-text-secondary)] mr-2" />
                          <div>
                            <div className="text-sm font-medium text-[var(--sys-text-primary)]">
                              {item.customerName}
                            </div>
                            <div className="text-sm text-[var(--sys-text-secondary)]">
                              ID: {item.customerId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--sys-text-primary)]">
                        {item.invoiceNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--sys-text-secondary)]">
                        {new Date(item.dueDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-[var(--sys-text-primary)]">
                        {formatCurrency(item.originalAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-[var(--sys-text-primary)]">
                        {formatCurrency(item.currentBalance)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                        <span
                          className={cn(
                            item.daysOverdue > 0
                              ? "text-[var(--sys-status-error)]"
                              : "text-[var(--sys-text-secondary)]",
                          )}
                        >
                          {item.daysOverdue > 0 ? `+${item.daysOverdue}` : item.daysOverdue}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1">
                          {getStatusIcon(item.status)}
                          <span className={cn("text-sm", getStatusColor(item.status))}>
                            {item.status.replace("_", " ").toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => onContactCustomer?.(item.customerId)}
                            className="text-[var(--sys-accent)] hover:text-[var(--sys-accent)]/80"
                            title="Contact Customer"
                          >
                            <User className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => onMarkDisputed?.(item.id)}
                            className="text-[var(--sys-status-warning)] hover:text-[var(--sys-status-warning)]/80"
                            title="Mark as Disputed"
                          >
                            <AlertTriangle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              const note = prompt("Add a note for this invoice:");
                              if (note) onAddNote?.(item.id, note);
                            }}
                            className="text-[var(--sys-text-secondary)] hover:text-[var(--sys-accent)]"
                            title="Add Note"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Collection Insights */}
      <div className="bg-[var(--sys-bg-subtle)] border border-[var(--sys-border-hairline)] rounded-lg p-6">
        <h3 className="text-lg font-medium text-[var(--sys-text-primary)] mb-4">
          Collection Insights
        </h3>
        <div className="space-y-4">
          <div className="p-4 bg-[var(--sys-bg-primary)] border border-[var(--sys-border-hairline)] rounded-lg">
            <h4 className="font-medium text-[var(--sys-text-primary)] mb-2">
              Collection Performance
            </h4>
            <p className="text-sm text-[var(--sys-text-secondary)]">
              The collection rate of {(summary.collectionRate * 100).toFixed(1)}% indicates
              {summary.collectionRate > 0.9
                ? " excellent"
                : summary.collectionRate > 0.8
                  ? " good"
                  : " challenging"}
              collection performance. The average days outstanding of{" "}
              {summary.averageDaysOutstanding.toFixed(0)} days
              {summary.averageDaysOutstanding < 30
                ? " is within acceptable limits"
                : " suggests room for improvement"}
              .
            </p>
          </div>
          <div className="p-4 bg-[var(--sys-bg-primary)] border border-[var(--sys-border-hairline)] rounded-lg">
            <h4 className="font-medium text-[var(--sys-text-primary)] mb-2">Risk Assessment</h4>
            <p className="text-sm text-[var(--sys-text-secondary)]">
              {summary.overdueAmount > 0
                ? `Overdue receivables of ${formatCurrency(summary.overdueAmount)} require immediate attention. `
                : "No overdue receivables detected. "}
              {summary.disputedAmount > 0
                ? `Disputed amounts of ${formatCurrency(summary.disputedAmount)} need resolution. `
                : "No disputed amounts. "}
              Bad debt reserve of {formatCurrency(summary.badDebtReserve)} represents
              {((summary.badDebtReserve / summary.totalReceivables) * 100).toFixed(1)}% of total
              receivables.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
