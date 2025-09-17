import * as React from "react";
import { cn } from "@aibos/ui/utils";
import {
  FileText,
  BarChart3,
  PieChart,
  TrendingUp,
  Calendar,
  Download,
  Eye,
  Settings,
  Filter,
  Search,
  Plus,
  Save,
  AlertCircle,
} from "lucide-react";
import { useInvoices, useBills, usePayments, useBankAccounts } from "../../store/index.js";
import { apiClient } from "../../lib/api-client.js";
import type { ReportTemplate } from "./CustomReportBuilder.js";

// SSOT Compliant Reports Workflow Component
// Master orchestrator for all reporting features and analytics

export interface ReportCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  reports: ReportType[];
}

export interface ReportType {
  id: string;
  name: string;
  description: string;
  category: string;
  component: React.ComponentType<any>;
  isBuiltIn: boolean;
  isCustom: boolean;
  lastRun?: string;
  frequency?: "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
}

export interface SavedView {
  id: string;
  name: string;
  description: string;
  reportId: string;
  filters: Record<string, unknown>;
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
}

export interface ReportsWorkflowProps {
  onExport?: (reportId: string, format: "pdf" | "excel" | "csv") => Promise<void>;
  onSaveView?: (view: SavedView) => Promise<void>;
  onLoadView?: (viewId: string) => Promise<SavedView>;
  onScheduleReport?: (reportId: string, frequency: string) => Promise<void>;
  className?: string;
}

export const ReportsWorkflow: React.FC<ReportsWorkflowProps> = ({
  onExport,
  onSaveView,
  onLoadView,
  onScheduleReport,
  className,
}) => {
  const [activeCategory, setActiveCategory] = React.useState<string | null>(null);
  const [activeReport, setActiveReport] = React.useState<string | null>(null);
  const [savedViews, setSavedViews] = React.useState<SavedView[]>([]);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [showCustomBuilder, setShowCustomBuilder] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Use Zustand store for real data
  const {
    invoices,
    loading: invoicesLoading,
    error: invoicesError,
    fetchInvoices,
  } = useInvoices();

  const {
    bills,
    loading: billsLoading,
    error: billsError,
    fetchBills,
  } = useBills();

  const {
    payments,
    loading: paymentsLoading,
    error: paymentsError,
    fetchPayments,
  } = usePayments();

  const {
    bankAccounts,
    loading: bankAccountsLoading,
    error: bankAccountsError,
    fetchBankAccounts,
  } = useBankAccounts();

  // Import report components
  const ProfitLossReport = React.lazy(() =>
    import("./ProfitLossReport.js").then(m => ({ default: m.ProfitLossReport })),
  );
  const BalanceSheetReport = React.lazy(() =>
    import("./BalanceSheetReport.js").then(m => ({ default: m.BalanceSheetReport })),
  );
  const CashFlowStatement = React.lazy(() =>
    import("./CashFlowStatement.js").then(m => ({ default: m.CashFlowStatement })),
  );
  const TrialBalance = React.lazy(() =>
    import("./TrialBalance.js").then(m => ({ default: m.TrialBalance })),
  );
  const ARAgingReport = React.lazy(() =>
    import("./ARAgingReport.js").then(m => ({ default: m.ARAgingReport })),
  );
  const APAgingReport = React.lazy(() =>
    import("./APAgingReport.js").then(m => ({ default: m.APAgingReport })),
  );
  const CustomReportBuilder = React.lazy(() =>
    import("./CustomReportBuilder.js").then(m => ({ default: m.CustomReportBuilder })),
  );

  // Load data on component mount
  React.useEffect(() => {
    const loadData = async () => {
      try {
        setError(null);
        await Promise.all([
          fetchInvoices(),
          fetchBills(),
          fetchPayments(),
          fetchBankAccounts(),
        ]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      }
    };

    loadData();
  }, [fetchInvoices, fetchBills, fetchPayments, fetchBankAccounts]);

  const reportCategories: ReportCategory[] = [
    {
      id: "financial",
      name: "Financial Statements",
      description: "Core financial reports including P&L, Balance Sheet, and Cash Flow",
      icon: <BarChart3 className="h-5 w-5" />,
      reports: [
        {
          id: "profit-loss",
          name: "Profit & Loss Statement",
          description: "Income statement showing revenue, expenses, and net income",
          category: "financial",
          component: ProfitLossReport,
          isBuiltIn: true,
          isCustom: false,
        },
        {
          id: "balance-sheet",
          name: "Balance Sheet",
          description: "Statement of financial position showing assets, liabilities, and equity",
          category: "financial",
          component: BalanceSheetReport,
          isBuiltIn: true,
          isCustom: false,
        },
        {
          id: "cash-flow",
          name: "Cash Flow Statement",
          description: "Statement showing cash inflows and outflows from operations",
          category: "financial",
          component: CashFlowStatement,
          isBuiltIn: true,
          isCustom: false,
        },
        {
          id: "trial-balance",
          name: "Trial Balance",
          description: "Listing of all accounts and their balances for verification",
          category: "financial",
          component: TrialBalance,
          isBuiltIn: true,
          isCustom: false,
        },
      ],
    },
    {
      id: "aging",
      name: "Aging Reports",
      description: "Accounts receivable and payable aging analysis",
      icon: <Calendar className="h-5 w-5" />,
      reports: [
        {
          id: "ar-aging",
          name: "AR Aging Report",
          description: "Accounts receivable aging with collection insights",
          category: "aging",
          component: ARAgingReport,
          isBuiltIn: true,
          isCustom: false,
        },
        {
          id: "ap-aging",
          name: "AP Aging Report",
          description: "Accounts payable aging with payment insights",
          category: "aging",
          component: APAgingReport,
          isBuiltIn: true,
          isCustom: false,
        },
      ],
    },
    {
      id: "custom",
      name: "Custom Reports",
      description: "Build and manage custom reports with drag-and-drop interface",
      icon: <Settings className="h-5 w-5" />,
      reports: [
        {
          id: "custom-builder",
          name: "Report Builder",
          description: "Create custom reports with drag-and-drop interface",
          category: "custom",
          component: CustomReportBuilder,
          isBuiltIn: false,
          isCustom: true,
        },
      ],
    },
  ];

  const filteredCategories = React.useMemo(() => {
    if (!searchTerm) return reportCategories;

    return reportCategories
      .map(category => ({
        ...category,
        reports: category.reports.filter(
          report =>
            report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            report.description.toLowerCase().includes(searchTerm.toLowerCase()),
        ),
      }))
      .filter(category => category.reports.length > 0);
  }, [searchTerm]);

  const handleReportSelect = (reportId: string) => {
    setActiveReport(reportId);
    setShowCustomBuilder(reportId === "custom-builder");
  };

  const handleExport = async (format: "pdf" | "excel" | "csv") => {
    if (!activeReport) return;
    await onExport?.(activeReport, format);
  };

  const handleSaveView = async (view: Omit<SavedView, "id" | "createdAt">) => {
    const newView: SavedView = {
      ...view,
      id: `view_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    await onSaveView?.(newView);
    setSavedViews(prev => [...prev, newView]);
  };

  const handleScheduleReport = async (frequency: string) => {
    if (!activeReport) return;
    await onScheduleReport?.(activeReport, frequency);
  };

  const getReportComponent = (reportId: string) => {
    const report = reportCategories.flatMap(cat => cat.reports).find(r => r.id === reportId);

    if (!report) return null;

    const Component = report.component;

    // Prepare data for different report types
    const reportData = {
      invoices,
      bills,
      payments,
      bankAccounts,
      loading: invoicesLoading || billsLoading || paymentsLoading || bankAccountsLoading,
      error: error || invoicesError || billsError || paymentsError || bankAccountsError,
    };

    // Pass appropriate data based on report type
    switch (reportId) {
      case "profit-loss":
        return <Component data={reportData} />;
      case "balance-sheet":
        return <Component data={reportData} />;
      case "cash-flow":
        return <Component data={reportData} />;
      case "trial-balance":
        return <Component data={reportData} />;
      case "ar-aging":
        return <Component data={reportData} />;
      case "ap-aging":
        return <Component data={reportData} />;
      default:
        return <Component data={reportData} />;
    }
  };

  if (showCustomBuilder) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setShowCustomBuilder(false)}
            className="p-2 text-[var(--sys-text-secondary)] hover:text-[var(--sys-text-primary)]"
          >
            ← Back to Reports
          </button>
          <h1 className="text-2xl font-bold text-[var(--sys-text-primary)]">
            Custom Report Builder
          </h1>
        </div>
        <React.Suspense fallback={<div>Loading...</div>}>
          <CustomReportBuilder
            templates={[]}
            availableFields={[]}
            onSave={async (report: ReportTemplate) => {
              // Log report save to monitoring service
              if (process.env.NODE_ENV === 'development') {
                // eslint-disable-next-line no-console
                // Log report save to monitoring service
                if ((process.env.NODE_ENV as string) === 'development') {
                  // eslint-disable-next-line no-console
                  console.log("Save report:", report);
                }
              }
            }}
            onLoad={async (id: string) => null as unknown as ReportTemplate}
            onExport={async (report: ReportTemplate, format: "pdf" | "excel" | "csv") => {
              // Log report export to monitoring service
              if (process.env.NODE_ENV === 'development') {
                // eslint-disable-next-line no-console
                // Log report export to monitoring service
                if ((process.env.NODE_ENV as string) === 'development') {
                  // eslint-disable-next-line no-console
                  console.log("Export report:", report, format);
                }
              }
            }}
            onPreview={(report: ReportTemplate) => {
              // Log report preview to monitoring service
              if (process.env.NODE_ENV === 'development') {
                // eslint-disable-next-line no-console
                // Log report preview to monitoring service
                if ((process.env.NODE_ENV as string) === 'development') {
                  // eslint-disable-next-line no-console
                  console.log("Preview report:", report);
                }
              }
            }}
          />
        </React.Suspense>
      </div>
    );
  }

  if (activeReport) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setActiveReport(null)}
            className="p-2 text-[var(--sys-text-secondary)] hover:text-[var(--sys-text-primary)]"
          >
            ← Back to Reports
          </button>
          <h1 className="text-2xl font-bold text-[var(--sys-text-primary)]">
            {reportCategories.flatMap(cat => cat.reports).find(r => r.id === activeReport)?.name}
          </h1>
        </div>
        <React.Suspense fallback={<div>Loading report...</div>}>
          {getReportComponent(activeReport)}
        </React.Suspense>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--sys-text-primary)]">Reports & Analytics</h1>
          <p className="text-[var(--sys-text-secondary)]">
            Generate comprehensive financial reports and insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCustomBuilder(true)}
            className="px-4 py-2 bg-[var(--sys-accent)] text-white rounded-md hover:bg-[var(--sys-accent)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
          >
            <Plus className="h-4 w-4 mr-2 inline" />
            Create Custom Report
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-[var(--sys-bg-subtle)] border border-[var(--sys-border-hairline)] rounded-lg p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--sys-text-secondary)]" />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-[var(--sys-border-hairline)] rounded-md bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
            />
          </div>
          <button className="px-4 py-2 border border-[var(--sys-border-hairline)] text-[var(--sys-text-primary)] rounded-md hover:bg-[var(--sys-bg-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]">
            <Filter className="h-4 w-4 mr-2 inline" />
            Filters
          </button>
        </div>
      </div>

      {/* Report Categories */}
      <div className="space-y-6">
        {filteredCategories.map(category => (
          <div key={category.id} className="space-y-4">
            <div className="flex items-center gap-3">
              {category.icon}
              <h2 className="text-xl font-semibold text-[var(--sys-text-primary)]">
                {category.name}
              </h2>
              <span className="text-sm text-[var(--sys-text-secondary)]">
                {category.reports.length} reports
              </span>
            </div>
            <p className="text-[var(--sys-text-secondary)]">{category.description}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.reports.map(report => (
                <div
                  key={report.id}
                  className="bg-[var(--sys-bg-primary)] border border-[var(--sys-border-hairline)] rounded-lg p-4 hover:border-[var(--sys-accent)] cursor-pointer transition-colors"
                  onClick={() => handleReportSelect(report.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-[var(--sys-accent)]" />
                      <h3 className="text-lg font-medium text-[var(--sys-text-primary)]">
                        {report.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1">
                      {report.isBuiltIn && (
                        <span className="px-2 py-1 text-xs bg-[var(--sys-status-success)]/10 text-[var(--sys-status-success)] rounded">
                          Built-in
                        </span>
                      )}
                      {report.isCustom && (
                        <span className="px-2 py-1 text-xs bg-[var(--sys-accent)]/10 text-[var(--sys-accent)] rounded">
                          Custom
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-[var(--sys-text-secondary)] mb-4">
                    {report.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-[var(--sys-text-secondary)]">
                      {report.lastRun && (
                        <span>Last run: {new Date(report.lastRun).toLocaleDateString()}</span>
                      )}
                      {report.frequency && <span>Frequency: {report.frequency}</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleExport("pdf");
                        }}
                        className="p-1 text-[var(--sys-text-secondary)] hover:text-[var(--sys-accent)]"
                        title="Export PDF"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleScheduleReport("monthly");
                        }}
                        className="p-1 text-[var(--sys-text-secondary)] hover:text-[var(--sys-accent)]"
                        title="Schedule Report"
                      >
                        <Calendar className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Saved Views */}
      {savedViews.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-[var(--sys-text-primary)]">Saved Views</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedViews.map(view => (
              <div
                key={view.id}
                className="bg-[var(--sys-bg-primary)] border border-[var(--sys-border-hairline)] rounded-lg p-4 hover:border-[var(--sys-accent)] cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="h-4 w-4 text-[var(--sys-accent)]" />
                  <h3 className="text-lg font-medium text-[var(--sys-text-primary)]">
                    {view.name}
                  </h3>
                </div>
                <p className="text-sm text-[var(--sys-text-secondary)] mb-3">{view.description}</p>
                <div className="flex items-center justify-between text-xs text-[var(--sys-text-secondary)]">
                  <span>Created: {new Date(view.createdAt).toLocaleDateString()}</span>
                  <span>{view.isPublic ? "Public" : "Private"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
