import * as React from "react";
import { cn } from "@aibos/ui/utils";
import {
  Calculator,
  Calendar,
  TrendingUp,
  TrendingDown,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";

// SSOT Compliant Accrual and Depreciation Helpers Component
// Automated calculation helpers for month-end adjustments

export interface AccrualEntry {
  id: string;
  type: "revenue" | "expense" | "prepaid" | "deferred";
  account: string;
  accountName?: string;
  description: string;
  amount: number;
  period: string;
  dueDate: string;
  status: "pending" | "calculated" | "posted" | "reversed";
  calculationMethod: "manual" | "percentage" | "days" | "formula";
  calculationDetails?: {
    baseAmount?: number;
    percentage?: number;
    days?: number;
    formula?: string;
  };
  postedAt?: string;
  postedBy?: string;
  notes?: string;
}

export interface DepreciationEntry {
  id: string;
  assetId: string;
  assetName: string;
  assetCategory: string;
  originalCost: number;
  accumulatedDepreciation: number;
  bookValue: number;
  depreciationMethod:
    | "straight_line"
    | "declining_balance"
    | "sum_of_years"
    | "units_of_production";
  usefulLife: number;
  monthlyDepreciation: number;
  calculatedDepreciation: number;
  period: string;
  status: "pending" | "calculated" | "posted";
  postedAt?: string;
  postedBy?: string;
  notes?: string;
}

export interface AccrualHelpersProps {
  accruals: AccrualEntry[];
  depreciations: DepreciationEntry[];
  onCalculateAccruals?: () => Promise<void>;
  onPostAccrual?: (accrualId: string) => Promise<void>;
  onReverseAccrual?: (accrualId: string, reason: string) => Promise<void>;
  onCalculateDepreciation?: () => Promise<void>;
  onPostDepreciation?: (depreciationId: string) => Promise<void>;
  onAddAccrual?: (accrual: Omit<AccrualEntry, "id">) => Promise<void>;
  onAddDepreciation?: (depreciation: Omit<DepreciationEntry, "id">) => Promise<void>;
  className?: string;
}

export const AccrualHelpers: React.FC<AccrualHelpersProps> = ({
  accruals,
  depreciations,
  onCalculateAccruals,
  onPostAccrual,
  onReverseAccrual,
  onCalculateDepreciation,
  onPostDepreciation,
  onAddAccrual,
  onAddDepreciation,
  className,
}) => {
  const [activeTab, setActiveTab] = React.useState<"accruals" | "depreciation">("accruals");
  const [showAddAccrual, setShowAddAccrual] = React.useState(false);
  const [showAddDepreciation, setShowAddDepreciation] = React.useState(false);

  // Calculate totals
  const accrualTotals = React.useMemo(() => {
    const pending = accruals.filter(a => a.status === "pending").length;
    const calculated = accruals.filter(a => a.status === "calculated").length;
    const posted = accruals.filter(a => a.status === "posted").length;
    const totalAmount = accruals.reduce((sum, a) => sum + a.amount, 0);
    const postedAmount = accruals
      .filter(a => a.status === "posted")
      .reduce((sum, a) => sum + a.amount, 0);

    return { pending, calculated, posted, totalAmount, postedAmount };
  }, [accruals]);

  const depreciationTotals = React.useMemo(() => {
    const pending = depreciations.filter(d => d.status === "pending").length;
    const calculated = depreciations.filter(d => d.status === "calculated").length;
    const posted = depreciations.filter(d => d.status === "posted").length;
    const totalDepreciation = depreciations.reduce((sum, d) => sum + d.calculatedDepreciation, 0);
    const postedDepreciation = depreciations
      .filter(d => d.status === "posted")
      .reduce((sum, d) => sum + d.calculatedDepreciation, 0);

    return { pending, calculated, posted, totalDepreciation, postedDepreciation };
  }, [depreciations]);

  const getAccrualTypeIcon = (type: AccrualEntry["type"]) => {
    switch (type) {
      case "revenue":
        return <TrendingUp className="h-4 w-4 text-[var(--sys-status-success)]" />;
      case "expense":
        return <TrendingDown className="h-4 w-4 text-[var(--sys-status-error)]" />;
      case "prepaid":
        return <Calendar className="h-4 w-4 text-[var(--sys-accent)]" />;
      case "deferred":
        return <Clock className="h-4 w-4 text-[var(--sys-status-warning)]" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getAccrualTypeColor = (type: AccrualEntry["type"]) => {
    switch (type) {
      case "revenue":
        return "bg-[var(--sys-status-success)] text-white";
      case "expense":
        return "bg-[var(--sys-status-error)] text-white";
      case "prepaid":
        return "bg-[var(--sys-accent)] text-white";
      case "deferred":
        return "bg-[var(--sys-status-warning)] text-white";
      default:
        return "bg-[var(--sys-bg-subtle)] text-[var(--sys-text-secondary)]";
    }
  };

  const getStatusIcon = (status: AccrualEntry["status"] | DepreciationEntry["status"]) => {
    switch (status) {
      case "posted":
        return <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)]" />;
      case "calculated":
        return <Calculator className="h-4 w-4 text-[var(--sys-status-warning)]" />;
      case "pending":
        return <Clock className="h-4 w-4 text-[var(--sys-text-tertiary)]" />;
      case "reversed":
        return <AlertTriangle className="h-4 w-4 text-[var(--sys-status-error)]" />;
      default:
        return <Clock className="h-4 w-4 text-[var(--sys-text-tertiary)]" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const handleCalculateAccruals = async () => {
    if (onCalculateAccruals) {
      await onCalculateAccruals();
    }
  };

  const handleCalculateDepreciation = async () => {
    if (onCalculateDepreciation) {
      await onCalculateDepreciation();
    }
  };

  const handlePostAccrual = async (accrualId: string) => {
    if (onPostAccrual) {
      await onPostAccrual(accrualId);
    }
  };

  const handlePostDepreciation = async (depreciationId: string) => {
    if (onPostDepreciation) {
      await onPostDepreciation(depreciationId);
    }
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
              Accrual & Depreciation Helpers
            </h2>
            <p className="text-[var(--sys-text-secondary)] mt-1">
              Automated calculation helpers for month-end adjustments
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCalculateAccruals}
              className="px-4 py-2 bg-[var(--sys-accent)] text-white rounded-md hover:bg-[var(--sys-accent)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
              aria-label="Calculate all accruals"
            >
              <Calculator className="h-4 w-4 mr-2 inline" />
              Calculate Accruals
            </button>

            <button
              onClick={handleCalculateDepreciation}
              className="px-4 py-2 bg-[var(--sys-accent)] text-white rounded-md hover:bg-[var(--sys-accent)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
              aria-label="Calculate all depreciation"
            >
              <Calculator className="h-4 w-4 mr-2 inline" />
              Calculate Depreciation
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--sys-border-hairline)]">
          <button
            onClick={() => setActiveTab("accruals")}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              activeTab === "accruals"
                ? "border-[var(--sys-accent)] text-[var(--sys-accent)]"
                : "border-transparent text-[var(--sys-text-secondary)] hover:text-[var(--sys-text-primary)]",
            )}
          >
            Accruals ({accruals.length})
          </button>
          <button
            onClick={() => setActiveTab("depreciation")}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              activeTab === "depreciation"
                ? "border-[var(--sys-accent)] text-[var(--sys-accent)]"
                : "border-transparent text-[var(--sys-text-secondary)] hover:text-[var(--sys-text-primary)]",
            )}
          >
            Depreciation ({depreciations.length})
          </button>
        </div>
      </div>

      {/* Accruals Tab */}
      {activeTab === "accruals" && (
        <div>
          {/* Accrual Summary */}
          <div className="p-6 border-b border-[var(--sys-border-hairline)] bg-[var(--sys-bg-subtle)]">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-[var(--sys-bg-primary)] p-4 rounded-lg">
                <div className="text-2xl font-bold text-[var(--sys-text-primary)]">
                  {accrualTotals.pending}
                </div>
                <div className="text-sm text-[var(--sys-text-secondary)]">Pending</div>
              </div>

              <div className="bg-[var(--sys-bg-primary)] p-4 rounded-lg">
                <div className="text-2xl font-bold text-[var(--sys-status-warning)]">
                  {accrualTotals.calculated}
                </div>
                <div className="text-sm text-[var(--sys-text-secondary)]">Calculated</div>
              </div>

              <div className="bg-[var(--sys-bg-primary)] p-4 rounded-lg">
                <div className="text-2xl font-bold text-[var(--sys-status-success)]">
                  {accrualTotals.posted}
                </div>
                <div className="text-sm text-[var(--sys-text-secondary)]">Posted</div>
              </div>

              <div className="bg-[var(--sys-bg-primary)] p-4 rounded-lg">
                <div className="text-lg font-bold text-[var(--sys-text-primary)]">
                  {formatCurrency(accrualTotals.totalAmount)}
                </div>
                <div className="text-sm text-[var(--sys-text-secondary)]">Total Amount</div>
              </div>

              <div className="bg-[var(--sys-bg-primary)] p-4 rounded-lg">
                <div className="text-lg font-bold text-[var(--sys-status-success)]">
                  {formatCurrency(accrualTotals.postedAmount)}
                </div>
                <div className="text-sm text-[var(--sys-text-secondary)]">Posted Amount</div>
              </div>
            </div>
          </div>

          {/* Accrual List */}
          <div className="divide-y divide-[var(--sys-border-hairline)]">
            {accruals.map(accrual => (
              <div key={accrual.id} className="p-4 hover:bg-[var(--sys-bg-subtle)]">
                <div className="flex items-start gap-4">
                  <div className="flex items-center gap-2 mt-1">
                    {getAccrualTypeIcon(accrual.type)}
                    {getStatusIcon(accrual.status)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-[var(--sys-text-primary)]">
                        {accrual.description}
                      </h3>
                      <span
                        className={cn(
                          "px-2 py-1 text-xs font-medium rounded-full",
                          getAccrualTypeColor(accrual.type),
                        )}
                      >
                        {accrual.type.toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-[var(--sys-text-tertiary)]">Account:</span>
                        <div className="text-[var(--sys-text-primary)]">
                          {accrual.accountName || accrual.account}
                        </div>
                      </div>
                      <div>
                        <span className="text-[var(--sys-text-tertiary)]">Amount:</span>
                        <div className="text-[var(--sys-text-primary)] font-medium">
                          {formatCurrency(accrual.amount)}
                        </div>
                      </div>
                      <div>
                        <span className="text-[var(--sys-text-tertiary)]">Period:</span>
                        <div className="text-[var(--sys-text-primary)]">{accrual.period}</div>
                      </div>
                      <div>
                        <span className="text-[var(--sys-text-tertiary)]">Method:</span>
                        <div className="text-[var(--sys-text-primary)]">
                          {accrual.calculationMethod.replace("_", " ")}
                        </div>
                      </div>
                    </div>

                    {accrual.notes && (
                      <div className="mt-2 p-2 bg-[var(--sys-bg-subtle)] rounded text-xs text-[var(--sys-text-secondary)]">
                        <strong>Notes:</strong> {accrual.notes}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {accrual.status === "calculated" && (
                      <button
                        onClick={() => handlePostAccrual(accrual.id)}
                        className="px-3 py-1 text-sm bg-[var(--sys-status-success)] text-white rounded hover:bg-[var(--sys-status-success)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--sys-status-success)]"
                        aria-label={`Post ${accrual.description}`}
                      >
                        Post
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Depreciation Tab */}
      {activeTab === "depreciation" && (
        <div>
          {/* Depreciation Summary */}
          <div className="p-6 border-b border-[var(--sys-border-hairline)] bg-[var(--sys-bg-subtle)]">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-[var(--sys-bg-primary)] p-4 rounded-lg">
                <div className="text-2xl font-bold text-[var(--sys-text-primary)]">
                  {depreciationTotals.pending}
                </div>
                <div className="text-sm text-[var(--sys-text-secondary)]">Pending</div>
              </div>

              <div className="bg-[var(--sys-bg-primary)] p-4 rounded-lg">
                <div className="text-2xl font-bold text-[var(--sys-status-warning)]">
                  {depreciationTotals.calculated}
                </div>
                <div className="text-sm text-[var(--sys-text-secondary)]">Calculated</div>
              </div>

              <div className="bg-[var(--sys-bg-primary)] p-4 rounded-lg">
                <div className="text-2xl font-bold text-[var(--sys-status-success)]">
                  {depreciationTotals.posted}
                </div>
                <div className="text-sm text-[var(--sys-text-secondary)]">Posted</div>
              </div>

              <div className="bg-[var(--sys-bg-primary)] p-4 rounded-lg">
                <div className="text-lg font-bold text-[var(--sys-text-primary)]">
                  {formatCurrency(depreciationTotals.totalDepreciation)}
                </div>
                <div className="text-sm text-[var(--sys-text-secondary)]">Total Depreciation</div>
              </div>

              <div className="bg-[var(--sys-bg-primary)] p-4 rounded-lg">
                <div className="text-lg font-bold text-[var(--sys-status-success)]">
                  {formatCurrency(depreciationTotals.postedDepreciation)}
                </div>
                <div className="text-sm text-[var(--sys-text-secondary)]">Posted Depreciation</div>
              </div>
            </div>
          </div>

          {/* Depreciation List */}
          <div className="divide-y divide-[var(--sys-border-hairline)]">
            {depreciations.map(depreciation => (
              <div key={depreciation.id} className="p-4 hover:bg-[var(--sys-bg-subtle)]">
                <div className="flex items-start gap-4">
                  <div className="flex items-center gap-2 mt-1">
                    <FileText className="h-4 w-4 text-[var(--sys-accent)]" />
                    {getStatusIcon(depreciation.status)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-[var(--sys-text-primary)]">
                        {depreciation.assetName}
                      </h3>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-[var(--sys-bg-subtle)] text-[var(--sys-text-secondary)]">
                        {depreciation.assetCategory}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-[var(--sys-text-tertiary)]">Original Cost:</span>
                        <div className="text-[var(--sys-text-primary)]">
                          {formatCurrency(depreciation.originalCost)}
                        </div>
                      </div>
                      <div>
                        <span className="text-[var(--sys-text-tertiary)]">Book Value:</span>
                        <div className="text-[var(--sys-text-primary)]">
                          {formatCurrency(depreciation.bookValue)}
                        </div>
                      </div>
                      <div>
                        <span className="text-[var(--sys-text-tertiary)]">
                          Monthly Depreciation:
                        </span>
                        <div className="text-[var(--sys-text-primary)]">
                          {formatCurrency(depreciation.monthlyDepreciation)}
                        </div>
                      </div>
                      <div>
                        <span className="text-[var(--sys-text-tertiary)]">Method:</span>
                        <div className="text-[var(--sys-text-primary)]">
                          {depreciation.depreciationMethod.replace("_", " ")}
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-[var(--sys-text-tertiary)]">Useful Life:</span>
                        <div className="text-[var(--sys-text-primary)]">
                          {depreciation.usefulLife} months
                        </div>
                      </div>
                      <div>
                        <span className="text-[var(--sys-text-tertiary)]">
                          Calculated Depreciation:
                        </span>
                        <div className="text-[var(--sys-text-primary)] font-medium">
                          {formatCurrency(depreciation.calculatedDepreciation)}
                        </div>
                      </div>
                      <div>
                        <span className="text-[var(--sys-text-tertiary)]">Period:</span>
                        <div className="text-[var(--sys-text-primary)]">{depreciation.period}</div>
                      </div>
                    </div>

                    {depreciation.notes && (
                      <div className="mt-2 p-2 bg-[var(--sys-bg-subtle)] rounded text-xs text-[var(--sys-text-secondary)]">
                        <strong>Notes:</strong> {depreciation.notes}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {depreciation.status === "calculated" && (
                      <button
                        onClick={() => handlePostDepreciation(depreciation.id)}
                        className="px-3 py-1 text-sm bg-[var(--sys-status-success)] text-white rounded hover:bg-[var(--sys-status-success)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--sys-status-success)]"
                        aria-label={`Post depreciation for ${depreciation.assetName}`}
                      >
                        Post
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="p-4 border-t border-[var(--sys-border-hairline)] bg-[var(--sys-bg-subtle)]">
        <div className="flex items-center justify-between">
          <div className="text-sm text-[var(--sys-text-secondary)]">
            {activeTab === "accruals"
              ? `${accruals.length} accrual entries`
              : `${depreciations.length} depreciation entries`}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddAccrual(true)}
              className="px-4 py-2 border border-[var(--sys-border-hairline)] rounded-md hover:bg-[var(--sys-bg-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
              aria-label="Add new accrual"
            >
              Add Accrual
            </button>
            <button
              onClick={() => setShowAddDepreciation(true)}
              className="px-4 py-2 border border-[var(--sys-border-hairline)] rounded-md hover:bg-[var(--sys-bg-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
              aria-label="Add new depreciation"
            >
              Add Depreciation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccrualHelpers;
