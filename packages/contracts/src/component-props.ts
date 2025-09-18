import { z } from "zod";

/**
 * Component Props Schemas for AI-BOS Accounting System
 * Single Source of Truth for all UI component prop contracts
 */

// Common prop patterns
export const CommonProps = {
  loading: z.boolean().default(false),
  disabled: z.boolean().default(false),
  error: z.string().optional(),
  className: z.string().optional(),
  testId: z.string().optional(),
} as const;

// Button component props
export const ButtonProps = z.object({
  ...CommonProps,
  variant: z.enum(["primary", "secondary", "ghost", "danger"]).default("primary"),
  size: z.enum(["sm", "md", "lg"]).default("md"),
  children: z.string(),
  onClick: z.function().returns(z.void()).optional(),
  type: z.enum(["button", "submit", "reset"]).default("button"),
});

// Input component props
export const InputProps = z.object({
  ...CommonProps,
  type: z.enum(["text", "email", "password", "number", "tel", "url"]).default("text"),
  value: z.string().or(z.number()).optional(),
  defaultValue: z.string().or(z.number()).optional(),
  placeholder: z.string().optional(),
  required: z.boolean().default(false),
  onChange: z.function().returns(z.void()).optional(),
  onBlur: z.function().returns(z.void()).optional(),
});

// Card component props
export const CardProps = z.object({
  ...CommonProps,
  title: z.string().optional(),
  children: z.string(),
  padding: z.enum(["none", "sm", "md", "lg"]).default("md"),
  border: z.boolean().default(true),
  shadow: z.boolean().default(true),
});

// Badge component props
export const BadgeProps = z.object({
  ...CommonProps,
  variant: z.enum(["default", "success", "warning", "danger", "info"]).default("default"),
  size: z.enum(["sm", "md", "lg"]).default("md"),
  children: z.string(),
});

// Alert component props
export const AlertProps = z.object({
  ...CommonProps,
  variant: z.enum(["info", "success", "warning", "error"]).default("info"),
  title: z.string().optional(),
  message: z.string(),
  dismissible: z.boolean().default(false),
  onDismiss: z.function().returns(z.void()).optional(),
});

// Invoice Form component props
export const InvoiceFormProps = z.object({
  ...CommonProps,
  initialData: z.object({
    customerId: z.string().uuid().optional(),
    invoiceNumber: z.string().optional(),
    invoiceDate: z.string().date().optional(),
    dueDate: z.string().date().optional(),
    currency: z.string().length(3).default("MYR"),
    description: z.string().optional(),
    notes: z.string().optional(),
    lines: z.array(
      z.object({
        description: z.string(),
        quantity: z.number(),
        unitPrice: z.number(),
        taxCode: z.string().optional(),
        revenueAccountId: z.string().uuid().optional(),
      }),
    ).default([]),
  }).optional(),
  customers: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
      currency: z.string(),
    }),
  ).default([]),
  accounts: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
      code: z.string(),
    }),
  ).default([]),
  onSubmit: z.function()
    .args(
      z.object({
        customerId: z.string().uuid(),
        invoiceNumber: z.string(),
        invoiceDate: z.string().date(),
        dueDate: z.string().date(),
        currency: z.string(),
        description: z.string().optional(),
        notes: z.string().optional(),
        lines: z.array(
          z.object({
            description: z.string(),
            quantity: z.number(),
            unitPrice: z.number(),
            taxCode: z.string().optional(),
            revenueAccountId: z.string().uuid(),
          }),
        ),
      }),
    )
    .returns(z.promise(z.void())),
  onCancel: z.function().returns(z.void()).optional(),
  onCustomerChange: z.function().args(z.string().uuid()).returns(z.void()).optional(),
});

// Invoice List component props
export const InvoiceListProps = z.object({
  ...CommonProps,
  invoices: z.array(
    z.object({
      id: z.string().uuid(),
      invoiceNumber: z.string(),
      customerName: z.string(),
      invoiceDate: z.string().date(),
      dueDate: z.string().date(),
      totalAmount: z.number(),
      balanceAmount: z.number(),
      status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]),
    }),
  ).default([]),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }).optional(),
  onView: z.function().args(z.string().uuid()).returns(z.void()).optional(),
  onEdit: z.function().args(z.string().uuid()).returns(z.void()).optional(),
  onDelete: z.function().args(z.string().uuid()).returns(z.void()).optional(),
  onPageChange: z.function().args(z.number()).returns(z.void()).optional(),
});

// Customer Form component props
export const CustomerFormProps = z.object({
  ...CommonProps,
  initialData: z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    billingAddress: z.object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postalCode: z.string().optional(),
      country: z.string().optional(),
    }).optional(),
    currency: z.string().length(3).default("MYR"),
    paymentTerms: z.enum(["NET_15", "NET_30", "NET_45", "NET_60", "COD", "PREPAID"]).default("NET_30"),
  }).optional(),
  onSubmit: z.function()
    .args(
      z.object({
        name: z.string(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        billingAddress: z.object({
          street: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          postalCode: z.string().optional(),
          country: z.string().optional(),
        }).optional(),
        currency: z.string(),
        paymentTerms: z.string(),
      }),
    )
    .returns(z.promise(z.void())),
  onCancel: z.function().returns(z.void()).optional(),
});

// Customer List component props
export const CustomerListProps = z.object({
  ...CommonProps,
  customers: z.array(
    z.object({
      id: z.string().uuid(),
      customerNumber: z.string(),
      name: z.string(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      status: z.enum(["active", "inactive"]),
      createdAt: z.string().datetime(),
    }),
  ).default([]),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }).optional(),
  onView: z.function().args(z.string().uuid()).returns(z.void()).optional(),
  onEdit: z.function().args(z.string().uuid()).returns(z.void()).optional(),
  onDelete: z.function().args(z.string().uuid()).returns(z.void()).optional(),
  onPageChange: z.function().args(z.number()).returns(z.void()).optional(),
});

// Trial Balance component props
export const TrialBalanceProps = z.object({
  ...CommonProps,
  data: z.object({
    accounts: z.array(
      z.object({
        accountId: z.string().uuid(),
        accountCode: z.string(),
        accountName: z.string(),
        accountType: z.enum(["asset", "liability", "equity", "revenue", "expense"]),
        debitBalance: z.number(),
        creditBalance: z.number(),
        closingBalance: z.number(),
      }),
    ),
    totals: z.object({
      totalDebits: z.number(),
      totalCredits: z.number(),
      isBalanced: z.boolean(),
    }),
    reportDate: z.string().datetime(),
  }).optional(),
  filters: z.object({
    fromDate: z.string().date(),
    toDate: z.string().date(),
    includeInactive: z.boolean().default(false),
  }).optional(),
  onFilterChange: z.function()
    .args(
      z.object({
        fromDate: z.string().date(),
        toDate: z.string().date(),
        includeInactive: z.boolean(),
      }),
    )
    .returns(z.void()).optional(),
  onExport: z.function().args(z.enum(["pdf", "excel", "csv"])).returns(z.void()).optional(),
  onDrillDown: z.function().args(z.string().uuid()).returns(z.void()).optional(),
});

// Profit Loss component props
export const ProfitLossProps = z.object({
  ...CommonProps,
  data: z.object({
    revenue: z.array(
      z.object({
        accountId: z.string().uuid(),
        accountName: z.string(),
        amount: z.number(),
      }),
    ),
    expenses: z.array(
      z.object({
        accountId: z.string().uuid(),
        accountName: z.string(),
        amount: z.number(),
      }),
    ),
    totals: z.object({
      totalRevenue: z.number(),
      totalExpenses: z.number(),
      netIncome: z.number(),
    }),
    reportDate: z.string().datetime(),
  }).optional(),
  filters: z.object({
    fromDate: z.string().date(),
    toDate: z.string().date(),
    groupBy: z.enum(["month", "quarter", "year"]).default("month"),
  }).optional(),
  onFilterChange: z.function()
    .args(
      z.object({
        fromDate: z.string().date(),
        toDate: z.string().date(),
        groupBy: z.enum(["month", "quarter", "year"]),
      }),
    )
    .returns(z.void()).optional(),
  onExport: z.function().args(z.enum(["pdf", "excel", "csv"])).returns(z.void()).optional(),
});

// Balance Sheet component props
export const BalanceSheetProps = z.object({
  ...CommonProps,
  data: z.object({
    assets: z.object({
      current: z.array(
        z.object({
          accountId: z.string().uuid(),
          accountName: z.string(),
          amount: z.number(),
        }),
      ),
      nonCurrent: z.array(
        z.object({
          accountId: z.string().uuid(),
          accountName: z.string(),
          amount: z.number(),
        }),
      ),
      totalAssets: z.number(),
    }),
    liabilities: z.object({
      current: z.array(
        z.object({
          accountId: z.string().uuid(),
          accountName: z.string(),
          amount: z.number(),
        }),
      ),
      nonCurrent: z.array(
        z.object({
          accountId: z.string().uuid(),
          accountName: z.string(),
          amount: z.number(),
        }),
      ),
      totalLiabilities: z.number(),
    }),
    equity: z.object({
      accounts: z.array(
        z.object({
          accountId: z.string().uuid(),
          accountName: z.string(),
          amount: z.number(),
        }),
      ),
      totalEquity: z.number(),
    }),
    reportDate: z.string().datetime(),
  }).optional(),
  asOfDate: z.string().date().optional(),
  onDateChange: z.function().args(z.string().date()).returns(z.void()).optional(),
  onExport: z.function().args(z.enum(["pdf", "excel", "csv"])).returns(z.void()).optional(),
});

// Security Audit component props
export const SecurityAuditProps = z.object({
  ...CommonProps,
  data: z.object({
    auditId: z.string().uuid(),
    status: z.enum(["passed", "warning", "failed"]),
    score: z.number().min(0).max(100),
    findings: z.array(
      z.object({
        category: z.enum(["access", "data", "configuration", "compliance"]),
        severity: z.enum(["low", "medium", "high", "critical"]),
        title: z.string(),
        description: z.string(),
        recommendation: z.string(),
      }),
    ),
    summary: z.object({
      totalChecks: z.number(),
      passedChecks: z.number(),
      failedChecks: z.number(),
      warningChecks: z.number(),
    }),
    completedAt: z.string().datetime(),
  }).optional(),
  auditType: z.enum(["full", "quick", "compliance"]).default("quick"),
  onRunAudit: z.function()
    .args(z.enum(["full", "quick", "compliance"]))
    .returns(z.promise(z.void()))
    .optional(),
  onViewDetails: z.function().args(z.string()).returns(z.void()).optional(),
  onFixIssue: z.function().args(z.string()).returns(z.void()).optional(),
});

// Compliance Manager component props
export const ComplianceManagerProps = z.object({
  ...CommonProps,
  data: z.object({
    overallStatus: z.enum(["compliant", "partial", "non-compliant"]),
    frameworks: z.array(
      z.object({
        name: z.enum(["SOX", "GDPR", "IFRS", "GAAP"]),
        status: z.enum(["compliant", "partial", "non-compliant"]),
        score: z.number().min(0).max(100),
        requirements: z.array(
          z.object({
            id: z.string(),
            title: z.string(),
            status: z.enum(["met", "partial", "not-met"]),
            lastChecked: z.string().datetime(),
          }),
        ),
      }),
    ),
    lastUpdated: z.string().datetime(),
  }).optional(),
  selectedFramework: z.enum(["SOX", "GDPR", "IFRS", "GAAP"]).optional(),
  onFrameworkSelect: z.function().args(z.enum(["SOX", "GDPR", "IFRS", "GAAP"])).returns(z.void()).optional(),
  onUpdateCompliance: z.function().returns(z.promise(z.void())).optional(),
  onViewRequirement: z.function().args(z.string()).returns(z.void()).optional(),
});

// Performance Monitor component props
export const PerformanceMonitorProps = z.object({
  ...CommonProps,
  data: z.object({
    performance: z.object({
      avgResponseTime: z.number(),
      p95ResponseTime: z.number(),
      errorRate: z.number(),
      throughput: z.number(),
    }),
    system: z.object({
      cpuUsage: z.number(),
      memoryUsage: z.number(),
      diskUsage: z.number(),
      activeConnections: z.number(),
    }),
    alerts: z.array(
      z.object({
        id: z.string().uuid(),
        severity: z.enum(["info", "warning", "error", "critical"]),
        title: z.string(),
        message: z.string(),
        timestamp: z.string().datetime(),
      }),
    ),
    timestamp: z.string().datetime(),
  }).optional(),
  timeRange: z.enum(["1h", "24h", "7d", "30d"]).default("24h"),
  onTimeRangeChange: z.function().args(z.enum(["1h", "24h", "7d", "30d"])).returns(z.void()).optional(),
  onRefresh: z.function().returns(z.void()).optional(),
  onViewAlert: z.function().args(z.string().uuid()).returns(z.void()).optional(),
});

// Dashboard component props
export const DashboardProps = z.object({
  ...CommonProps,
  metrics: z.object({
    totalInvoices: z.number(),
    totalRevenue: z.number(),
    pendingPayments: z.number(),
    overdueInvoices: z.number(),
  }).optional(),
  recentActivity: z.array(
    z.object({
      id: z.string().uuid(),
      type: z.enum(["invoice_created", "payment_received", "customer_added", "report_generated"]),
      title: z.string(),
      description: z.string(),
      timestamp: z.string().datetime(),
    }),
  ).default([]),
  quickActions: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      icon: z.string(),
      href: z.string(),
    }),
  ).default([]),
  onActionClick: z.function().args(z.string()).returns(z.void()).optional(),
  onViewAll: z.function().args(z.string()).returns(z.void()).optional(),
});

// Consolidated Component Props
export const ComponentProps = {
  Button: ButtonProps,
  Input: InputProps,
  Card: CardProps,
  Badge: BadgeProps,
  Alert: AlertProps,
  InvoiceForm: InvoiceFormProps,
  InvoiceList: InvoiceListProps,
  CustomerForm: CustomerFormProps,
  CustomerList: CustomerListProps,
  TrialBalance: TrialBalanceProps,
  ProfitLoss: ProfitLossProps,
  BalanceSheet: BalanceSheetProps,
  SecurityAudit: SecurityAuditProps,
  ComplianceManager: ComplianceManagerProps,
  PerformanceMonitor: PerformanceMonitorProps,
  Dashboard: DashboardProps,
} as const;

// Type exports for all component props
export type TButtonProps = z.infer<typeof ButtonProps>;
export type TInputProps = z.infer<typeof InputProps>;
export type TCardProps = z.infer<typeof CardProps>;
export type TBadgeProps = z.infer<typeof BadgeProps>;
export type TAlertProps = z.infer<typeof AlertProps>;
export type TInvoiceFormProps = z.infer<typeof InvoiceFormProps>;
export type TInvoiceListProps = z.infer<typeof InvoiceListProps>;
export type TCustomerFormProps = z.infer<typeof CustomerFormProps>;
export type TCustomerListProps = z.infer<typeof CustomerListProps>;
export type TTrialBalanceProps = z.infer<typeof TrialBalanceProps>;
export type TProfitLossProps = z.infer<typeof ProfitLossProps>;
export type TBalanceSheetProps = z.infer<typeof BalanceSheetProps>;
export type TSecurityAuditProps = z.infer<typeof SecurityAuditProps>;
export type TComplianceManagerProps = z.infer<typeof ComplianceManagerProps>;
export type TPerformanceMonitorProps = z.infer<typeof PerformanceMonitorProps>;
export type TDashboardProps = z.infer<typeof DashboardProps>;
