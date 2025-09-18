"use client";

import React from "react";
import { TrialBalance } from "@aibos/ui/components/reports/TrialBalance";
import type {
  TrialBalanceItem,
  TrialBalanceSummary,
  TrialBalanceFilters,
} from "@aibos/ui/components/reports/TrialBalance";
import { useTrialBalance } from "@aibos/utils";
import { useAuth } from "@aibos/ui";
import type { TTrialBalanceRes } from "@aibos/contracts/reports";

// Transform API response to TrialBalance component format
function transformTrialBalanceData(apiData: TTrialBalanceRes): {
  data: TrialBalanceItem[];
  summary: TrialBalanceSummary;
} {
  const data: TrialBalanceItem[] = apiData.accounts.map((account) => ({
    id: account.id,
    account: account.code,
    accountName: account.name,
    accountType: account.type,
    debitBalance: account.debitBalance,
    creditBalance: account.creditBalance,
    netBalance: account.balance,
    isBalanced: Math.abs(account.debitBalance - account.creditBalance) < 0.01,
    notes: undefined,
    subItems: undefined,
  }));

  const summary: TrialBalanceSummary = {
    totalDebits: apiData.totalDebits,
    totalCredits: apiData.totalCredits,
    isBalanced: apiData.isBalanced,
    difference: apiData.totalDebits - apiData.totalCredits,
    accountCount: apiData.metadata?.accountCount || apiData.accounts.length,
    unbalancedAccounts: data.filter((item) => !item.isBalanced).length,
  };

  return { data, summary };
}

export function TrialBalanceWrapper() {
  const { getRequestContext } = useAuth();

  // Get request context for API calls
  const requestContext = getRequestContext();

  // Default parameters for trial balance
  const defaultParams = {
    fromDate: new Date(new Date().getFullYear(), 0, 1).toISOString(), // Start of year
    toDate: new Date().toISOString(), // Current date
    companyId: requestContext?.companyId || "",
    tenantId: requestContext?.tenantId || "",
    asOfDate: new Date().toISOString(),
    includePeriodActivity: false,
    includeZeroBalances: false,
    currency: "MYR",
  };

  const {
    data: apiData,
    isLoading,
    error,
    refetch,
  } = useTrialBalance(requestContext || {
    tenantId: "",
    companyId: "",
    userId: "",
    userRole: "",
    requestId: "",
  }, defaultParams, {
    enabled: Boolean(requestContext?.companyId && requestContext?.tenantId),
  });

  // Transform API data to component format
  const transformedData = React.useMemo(() => {
    if (!apiData) {
      return {
        data: [],
        summary: {
          totalDebits: 0,
          totalCredits: 0,
          isBalanced: true,
          difference: 0,
          accountCount: 0,
          unbalancedAccounts: 0,
        },
      };
    }

    return transformTrialBalanceData(apiData as TTrialBalanceRes);
  }, [apiData]);

  // Handle export functionality
  const handleExport = async (format: "pdf" | "excel" | "csv") => {
    try {
      // Implementation would call the export API
      const response = await fetch("/api/reports/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenantId: requestContext?.tenantId,
          companyId: requestContext?.companyId,
          reportType: "trial-balance",
          format: format === "excel" ? "xlsx" : format,
          reportData: apiData,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `trial-balance-${new Date().toISOString().split("T")[0]}.${format === "excel" ? "xlsx" : format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch {
      // Export failed - would show user notification in real implementation
    }
  };

  // Handle verification
  const handleVerifyBalance = async () => {
    await refetch();
  };

  // Handle note addition
  const handleAddNote = async (_lineItemId: string, _note: string) => {
    // Implementation would save the note via API
    // For now just trigger a refetch to simulate update
    await refetch();
  };

  // Handle filtering
  const handleFilter = (_filters: TrialBalanceFilters) => {
    // Implementation would apply filters to the query
    // For now this is handled client-side in the component
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading trial balance...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center p-8">
        <div className="text-red-600 dark:text-red-400 mb-4">
          <span className="text-2xl">⚠️</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Failed to Load Trial Balance
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {error.message || "An error occurred while loading the trial balance data."}
        </p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Try Again
        </button>
      </div>
    );
  }

  // No data state
  if (!requestContext?.companyId || !requestContext?.tenantId) {
    return (
      <div className="text-center p-8">
        <div className="text-gray-400 mb-4">
          <span className="text-2xl">📊</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Company Information Required
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Please ensure you have selected a company to view the trial balance.
        </p>
      </div>
    );
  }

  return (
    <TrialBalance
      data={transformedData.data}
      summary={transformedData.summary}
      period={{
        current: new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        previous: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      }}
      onExport={handleExport}
      onFilter={handleFilter}
      onAddNote={handleAddNote}
      onVerifyBalance={handleVerifyBalance}
    />
  );
}
