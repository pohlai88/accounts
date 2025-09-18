import { z } from "zod";

/**
 * Comprehensive API Schemas for AI-BOS Accounting System
 * Single Source of Truth for all API request/response contracts
 */

// Common pagination schema
export const PaginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

// Common tenant context schema
export const TenantContextSchema = z.object({
  tenantId: z.string().uuid(),
  companyId: z.string().uuid(),
  userId: z.string().uuid().optional(),
  userRole: z.enum(["owner", "admin", "user", "viewer"]).default("user"),
});

// Invoice API Schemas
export const InvoiceApiSchemas = {
  // List invoices
  list: {
    request: TenantContextSchema.merge(PaginationSchema).extend({
      customerId: z.string().uuid().optional(),
      status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]).optional(),
      fromDate: z.string().date().optional(),
      toDate: z.string().date().optional(),
      search: z.string().optional(),
    }),
    response: z.object({
      success: z.boolean(),
      data: z.object({
        invoices: z.array(
          z.object({
            id: z.string().uuid(),
            invoiceNumber: z.string(),
            customerId: z.string().uuid(),
            customerName: z.string(),
            invoiceDate: z.string().date(),
            dueDate: z.string().date(),
            currency: z.string().length(3),
            totalAmount: z.number(),
            paidAmount: z.number(),
            balanceAmount: z.number(),
            status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]),
            createdAt: z.string().datetime(),
          }),
        ),
        meta: z.object({
          page: z.number(),
          limit: z.number(),
          total: z.number(),
          totalPages: z.number(),
        }),
      }),
      error: z.string().optional(),
    }),
  },

  // Create invoice
  create: {
    request: TenantContextSchema.extend({
      customerId: z.string().uuid(),
      invoiceNumber: z.string().min(1).max(50),
      invoiceDate: z.string().date(),
      dueDate: z.string().date(),
      currency: z.string().length(3).default("MYR"),
      description: z.string().optional(),
      notes: z.string().optional(),
      lines: z.array(
        z.object({
          description: z.string().min(1).max(500),
          quantity: z.number().positive().default(1),
          unitPrice: z.number().nonnegative(),
          taxCode: z.string().optional(),
          revenueAccountId: z.string().uuid(),
        }),
      ).min(1).max(100),
    }),
    response: z.object({
      success: z.boolean(),
      data: z.object({
        id: z.string().uuid(),
        invoiceNumber: z.string(),
        totalAmount: z.number(),
        status: z.string(),
        createdAt: z.string().datetime(),
      }),
      error: z.string().optional(),
    }),
  },

  // Get invoice by ID
  get: {
    request: TenantContextSchema.extend({
      invoiceId: z.string().uuid(),
    }),
    response: z.object({
      success: z.boolean(),
      data: z.object({
        id: z.string().uuid(),
        invoiceNumber: z.string(),
        customerId: z.string().uuid(),
        customerName: z.string(),
        invoiceDate: z.string().date(),
        dueDate: z.string().date(),
        currency: z.string(),
        subtotal: z.number(),
        taxAmount: z.number(),
        totalAmount: z.number(),
        paidAmount: z.number(),
        balanceAmount: z.number(),
        status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]),
        lines: z.array(
          z.object({
            id: z.string().uuid(),
            description: z.string(),
            quantity: z.number(),
            unitPrice: z.number(),
            lineAmount: z.number(),
            taxAmount: z.number(),
          }),
        ),
        createdAt: z.string().datetime(),
        updatedAt: z.string().datetime(),
      }),
      error: z.string().optional(),
    }),
  },
} as const;

// Customer API Schemas
export const CustomerApiSchemas = {
  // List customers
  list: {
    request: TenantContextSchema.merge(PaginationSchema).extend({
      search: z.string().optional(),
      status: z.enum(["active", "inactive"]).optional(),
    }),
    response: z.object({
      success: z.boolean(),
      data: z.object({
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
        ),
        meta: z.object({
          page: z.number(),
          limit: z.number(),
          total: z.number(),
          totalPages: z.number(),
        }),
      }),
      error: z.string().optional(),
    }),
  },

  // Create customer
  create: {
    request: TenantContextSchema.extend({
      name: z.string().min(1).max(255),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      billingAddress: z
        .object({
          street: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          postalCode: z.string().optional(),
          country: z.string().optional(),
        })
        .optional(),
      currency: z.string().length(3).default("MYR"),
      paymentTerms: z
        .enum(["NET_15", "NET_30", "NET_45", "NET_60", "COD", "PREPAID"])
        .default("NET_30"),
    }),
    response: z.object({
      success: z.boolean(),
      data: z.object({
        id: z.string().uuid(),
        customerNumber: z.string(),
        name: z.string(),
        currency: z.string(),
        createdAt: z.string().datetime(),
      }),
      error: z.string().optional(),
    }),
  },
} as const;

// Reports API Schemas
export const ReportsApiSchemas = {
  // Trial Balance
  trialBalance: {
    request: TenantContextSchema.extend({
      fromDate: z.string().date(),
      toDate: z.string().date(),
      includeInactive: z.boolean().default(false),
    }),
    response: z.object({
      success: z.boolean(),
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
      }),
      error: z.string().optional(),
    }),
  },

  // Profit & Loss
  profitLoss: {
    request: TenantContextSchema.extend({
      fromDate: z.string().date(),
      toDate: z.string().date(),
      groupBy: z.enum(["month", "quarter", "year"]).default("month"),
    }),
    response: z.object({
      success: z.boolean(),
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
      }),
      error: z.string().optional(),
    }),
  },

  // Balance Sheet
  balanceSheet: {
    request: TenantContextSchema.extend({
      asOfDate: z.string().date(),
    }),
    response: z.object({
      success: z.boolean(),
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
      }),
      error: z.string().optional(),
    }),
  },
} as const;

// Security API Schemas
export const SecurityApiSchemas = {
  // Security Audit
  audit: {
    request: TenantContextSchema.extend({
      auditType: z.enum(["full", "quick", "compliance"]).default("quick"),
      includeDetails: z.boolean().default(false),
    }),
    response: z.object({
      success: z.boolean(),
      data: z.object({
        auditId: z.string().uuid(),
        auditType: z.string(),
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
      }),
      error: z.string().optional(),
    }),
  },

  // Compliance Status
  compliance: {
    request: TenantContextSchema.extend({
      framework: z.enum(["SOX", "GDPR", "IFRS", "GAAP"]).optional(),
    }),
    response: z.object({
      success: z.boolean(),
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
      }),
      error: z.string().optional(),
    }),
  },
} as const;

// Monitoring API Schemas
export const MonitoringApiSchemas = {
  // Dashboard metrics
  dashboard: {
    request: TenantContextSchema.extend({
      timeRange: z.enum(["1h", "24h", "7d", "30d"]).default("24h"),
      metrics: z.array(z.enum(["performance", "errors", "usage", "security"])).optional(),
    }),
    response: z.object({
      success: z.boolean(),
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
        business: z.object({
          activeUsers: z.number(),
          totalInvoices: z.number(),
          totalRevenue: z.number(),
          pendingTransactions: z.number(),
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
      }),
      error: z.string().optional(),
    }),
  },
} as const;

// Authentication API Schemas
export const AuthApiSchemas = {
  // Login
  login: {
    request: z.object({
      email: z.string().email(),
      password: z.string().min(8),
      rememberMe: z.boolean().default(false),
    }),
    response: z.object({
      success: z.boolean(),
      data: z.object({
        user: z.object({
          id: z.string().uuid(),
          email: z.string().email(),
          name: z.string(),
          role: z.enum(["owner", "admin", "user", "viewer"]),
          tenantId: z.string().uuid(),
          companyId: z.string().uuid(),
        }),
        session: z.object({
          accessToken: z.string(),
          refreshToken: z.string(),
          expiresAt: z.string().datetime(),
        }),
      }),
      error: z.string().optional(),
    }),
  },

  // Refresh token
  refresh: {
    request: z.object({
      refreshToken: z.string(),
    }),
    response: z.object({
      success: z.boolean(),
      data: z.object({
        accessToken: z.string(),
        expiresAt: z.string().datetime(),
      }),
      error: z.string().optional(),
    }),
  },
} as const;

// Consolidated API Schemas
export const ApiSchemas = {
  invoices: InvoiceApiSchemas,
  customers: CustomerApiSchemas,
  reports: ReportsApiSchemas,
  security: SecurityApiSchemas,
  monitoring: MonitoringApiSchemas,
  auth: AuthApiSchemas,
} as const;

// Type exports for all schemas
export type TInvoiceListRequest = z.infer<typeof InvoiceApiSchemas.list.request>;
export type TInvoiceListResponse = z.infer<typeof InvoiceApiSchemas.list.response>;
export type TInvoiceCreateRequest = z.infer<typeof InvoiceApiSchemas.create.request>;
export type TInvoiceCreateResponse = z.infer<typeof InvoiceApiSchemas.create.response>;
export type TInvoiceGetRequest = z.infer<typeof InvoiceApiSchemas.get.request>;
export type TInvoiceGetResponse = z.infer<typeof InvoiceApiSchemas.get.response>;

export type TCustomerListRequest = z.infer<typeof CustomerApiSchemas.list.request>;
export type TCustomerListResponse = z.infer<typeof CustomerApiSchemas.list.response>;
export type TCustomerCreateRequest = z.infer<typeof CustomerApiSchemas.create.request>;
export type TCustomerCreateResponse = z.infer<typeof CustomerApiSchemas.create.response>;

export type TTrialBalanceRequest = z.infer<typeof ReportsApiSchemas.trialBalance.request>;
export type TTrialBalanceResponse = z.infer<typeof ReportsApiSchemas.trialBalance.response>;
export type TProfitLossRequest = z.infer<typeof ReportsApiSchemas.profitLoss.request>;
export type TProfitLossResponse = z.infer<typeof ReportsApiSchemas.profitLoss.response>;
export type TBalanceSheetRequest = z.infer<typeof ReportsApiSchemas.balanceSheet.request>;
export type TBalanceSheetResponse = z.infer<typeof ReportsApiSchemas.balanceSheet.response>;

export type TSecurityAuditRequest = z.infer<typeof SecurityApiSchemas.audit.request>;
export type TSecurityAuditResponse = z.infer<typeof SecurityApiSchemas.audit.response>;
export type TComplianceStatusRequest = z.infer<typeof SecurityApiSchemas.compliance.request>;
export type TComplianceStatusResponse = z.infer<typeof SecurityApiSchemas.compliance.response>;

export type TMonitoringDashboardRequest = z.infer<typeof MonitoringApiSchemas.dashboard.request>;
export type TMonitoringDashboardResponse = z.infer<typeof MonitoringApiSchemas.dashboard.response>;

export type TAuthLoginRequest = z.infer<typeof AuthApiSchemas.login.request>;
export type TAuthLoginResponse = z.infer<typeof AuthApiSchemas.login.response>;
export type TAuthRefreshRequest = z.infer<typeof AuthApiSchemas.refresh.request>;
export type TAuthRefreshResponse = z.infer<typeof AuthApiSchemas.refresh.response>;
