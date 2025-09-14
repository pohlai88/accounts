// Export API endpoint for financial reports
// V1 compliance: CSV/XLSX/JSONL export support

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import {
  createExportService,
  ExportFormat,
  ReportExportRequest,
  createV1RequestContext,
  extractV1UserContext,
  getV1AuditService,
  createV1AuditContext,
} from "@aibos/utils";
import { generateTrialBalance } from "@aibos/accounting";
import { generateBalanceSheet } from "@aibos/accounting";
import { generateProfitLoss } from "@aibos/accounting";
import { generateCashFlow } from "@aibos/accounting";

// Request validation schema
const ExportRequestSchema = z.object({
  reportType: z.enum(["trial-balance", "balance-sheet", "profit-loss", "cash-flow"]),
  format: z.nativeEnum(ExportFormat),
  filters: z.object({
    tenantId: z.string().uuid(),
    companyId: z.string().uuid(),
    asOfDate: z.string().optional(),
    fromDate: z.string().optional(),
    toDate: z.string().optional(),
    accountIds: z.array(z.string()).optional(),
    includeInactive: z.boolean().optional(),
  }),
  options: z
    .object({
      filename: z.string().optional(),
      includeHeaders: z.boolean().optional(),
      dateFormat: z.string().optional(),
      timezone: z.string().optional(),
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  const requestContext = createV1RequestContext(request);
  const userContext = extractV1UserContext(request);
  const auditService = getV1AuditService();
  const auditContext = createV1AuditContext(request);

  try {
    // Parse and validate request
    const body = await request.json();
    const exportRequest = ExportRequestSchema.parse(body);

    // Audit log: Export request initiated
    await auditService.logReportGeneration(
      auditContext,
      exportRequest.reportType,
      {
        format: exportRequest.format,
        filters: exportRequest.filters,
      },
      {
        action: "export_initiated",
      },
    );

    // Generate report data based on type
    const reportData = await generateReportData(exportRequest);

    // Create export service and export data
    const exportService = createExportService();
    const result = await exportService.exportData(reportData, {
      format: exportRequest.format as ExportFormat,
      filename: exportRequest.options?.filename,
      includeHeaders: exportRequest.options?.includeHeaders ?? true,
      dateFormat: exportRequest.options?.dateFormat ?? "YYYY-MM-DD",
      timezone: exportRequest.options?.timezone ?? "Asia/Kuala_Lumpur",
      metadata: {
        reportType: exportRequest.reportType,
        generatedAt: new Date().toISOString(),
        tenantId: exportRequest.filters.tenantId,
        companyId: exportRequest.filters.companyId,
        exportedBy: userContext.userId,
      },
    });

    if (!result.success) {
      // Audit log: Export failed
      await auditService.logError(auditContext, "REPORT_EXPORT_ERROR", {
        operation: "report_export",
        error: result.error || "Export failed",
        reportType: exportRequest.reportType,
        format: exportRequest.format,
      });

      return NextResponse.json({ error: result.error || "Export failed" }, { status: 500 });
    }

    // Audit log: Export completed successfully
    await auditService.logReportGeneration(
      auditContext,
      exportRequest.reportType,
      {
        format: exportRequest.format,
        filters: exportRequest.filters,
      },
      {
        action: "export_completed",
        recordCount: result.recordCount,
        fileSize: result.size,
      },
    );

    // Return export result
    return NextResponse.json({
      success: true,
      filename: result.filename,
      size: result.size,
      recordCount: result.recordCount,
      downloadUrl: result.url,
      format: exportRequest.format,
    });
  } catch (error) {
    // Audit log: Export error
    await auditService.logError(auditContext, "REPORT_EXPORT_ERROR", {
      operation: "report_export",
      error: error instanceof Error ? error.message : "Unknown export error",
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request format", details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Generate report data based on report type
 */
async function generateReportData(request: ReportExportRequest) {
  const { reportType, filters } = request;

  // Create Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  switch (reportType) {
    case "trial-balance": {
      const result = await generateTrialBalance(
        {
          tenantId: filters.tenantId,
          companyId: filters.companyId,
          asOfDate: filters.asOfDate ? new Date(filters.asOfDate) : new Date(),
          includeZeroBalances: filters.includeInactive ?? false,
          accountFilter: filters.accountIds ? { accountIds: filters.accountIds } : undefined,
        },
        supabase as unknown,
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      return {
        headers: ["Account Code", "Account Name", "Account Type", "Debit", "Credit", "Balance"],
        rows: result.accounts.map(account => [
          account.accountNumber,
          account.accountName,
          account.accountType,
          account.periodDebits || 0,
          account.periodCredits || 0,
          account.closingBalance || 0,
        ]),
        metadata: {
          reportType: "trial-balance",
          asOfDate: filters.asOfDate,
          totalDebits: result.totals.totalDebits,
          totalCredits: result.totals.totalCredits,
          isBalanced: result.isBalanced,
        },
      };
    }

    case "balance-sheet": {
      const result = await generateBalanceSheet(
        {
          tenantId: filters.tenantId,
          companyId: filters.companyId,
          asOfDate: filters.asOfDate ? new Date(filters.asOfDate) : new Date(),
          reportFormat: "STANDARD",
        },
        supabase as unknown,
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      const rows: (string | number)[][] = [];

      // Assets
      rows.push(["ASSETS", "", "", ""]);
      result.assets.forEach(section => {
        rows.push([section.sectionName, section.subtotal, "", ""]);
        section.accounts.forEach(account => {
          rows.push([`  ${account.accountName}`, account.currentBalance || 0, "", ""]);
        });
      });
      rows.push(["Total Assets", result.totals.totalAssets, "", ""]);
      rows.push(["", "", "", ""]);

      // Liabilities
      rows.push(["LIABILITIES", "", "", ""]);
      result.liabilities.forEach(section => {
        rows.push([section.sectionName, section.subtotal, "", ""]);
        section.accounts.forEach(account => {
          rows.push([`  ${account.accountName}`, account.currentBalance || 0, "", ""]);
        });
      });
      rows.push(["Total Liabilities", result.totals.totalLiabilities, "", ""]);
      rows.push(["", "", "", ""]);

      // Equity
      rows.push(["EQUITY", "", "", ""]);
      result.equity.forEach(section => {
        rows.push([section.sectionName, section.subtotal, "", ""]);
        section.accounts.forEach(account => {
          rows.push([`  ${account.accountName}`, account.currentBalance || 0, "", ""]);
        });
      });
      rows.push(["Total Equity", result.totals.totalEquity, "", ""]);

      return {
        headers: ["Account", "Amount", "Previous Period", "Variance"],
        rows,
        metadata: {
          reportType: "balance-sheet",
          asOfDate: filters.asOfDate,
          totalAssets: result.totals.totalAssets,
          totalLiabilities: result.totals.totalLiabilities,
          totalEquity: result.totals.totalEquity,
        },
      };
    }

    case "profit-loss": {
      const result = await generateProfitLoss(
        {
          tenantId: filters.tenantId,
          companyId: filters.companyId,
          startDate: filters.fromDate ? new Date(filters.fromDate) : new Date(),
          endDate: filters.toDate ? new Date(filters.toDate) : new Date(),
          reportFormat: "STANDARD",
        },
        supabase as unknown,
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      const rows: (string | number)[][] = [];

      // Revenue
      rows.push(["REVENUE", "", "", ""]);
      result.revenue.forEach(section => {
        rows.push([section.sectionName, section.subtotal, "", ""]);
        section.accounts.forEach(account => {
          rows.push([`  ${account.accountName}`, account.currentPeriodAmount || 0, "", ""]);
        });
      });
      rows.push(["Total Revenue", result.metrics.totalRevenue, "", ""]);
      rows.push(["", "", "", ""]);

      // Cost of Sales
      rows.push(["COST OF SALES", "", "", ""]);
      result.costOfSales.forEach(section => {
        rows.push([section.sectionName, section.subtotal, "", ""]);
        section.accounts.forEach(account => {
          rows.push([`  ${account.accountName}`, account.currentPeriodAmount || 0, "", ""]);
        });
      });
      rows.push(["Total Cost of Sales", result.metrics.totalCostOfSales, "", ""]);
      rows.push(["Gross Profit", result.metrics.grossProfit, "", ""]);
      rows.push(["", "", "", ""]);

      // Operating Expenses
      rows.push(["OPERATING EXPENSES", "", "", ""]);
      result.operatingExpenses.forEach(section => {
        rows.push([section.sectionName, section.subtotal, "", ""]);
        section.accounts.forEach(account => {
          rows.push([`  ${account.accountName}`, account.currentPeriodAmount || 0, "", ""]);
        });
      });
      rows.push(["Total Operating Expenses", result.metrics.totalOperatingExpenses, "", ""]);
      rows.push(["Operating Income", result.metrics.operatingIncome, "", ""]);
      rows.push(["", "", "", ""]);

      rows.push(["NET INCOME", result.metrics.netIncomeAfterTax, "", ""]);

      return {
        headers: ["Account", "Amount", "Previous Period", "Variance"],
        rows,
        metadata: {
          reportType: "profit-loss",
          fromDate: filters.fromDate,
          toDate: filters.toDate,
          totalRevenue: result.metrics.totalRevenue,
          totalExpenses: result.metrics.totalOperatingExpenses,
          netIncome: result.metrics.netIncomeAfterTax,
        },
      };
    }

    case "cash-flow": {
      const result = await generateCashFlow(
        {
          tenantId: filters.tenantId,
          companyId: filters.companyId,
          startDate: filters.fromDate ? new Date(filters.fromDate) : new Date(),
          endDate: filters.toDate ? new Date(filters.toDate) : new Date(),
          method: "INDIRECT",
        },
        supabase as unknown,
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      const rows: (string | number)[][] = [];

      // Operating Activities
      rows.push(["OPERATING ACTIVITIES", "", ""]);
      result.operatingActivities.activities.forEach(activity => {
        rows.push([activity.activityName, activity.currentPeriodAmount, ""]);
      });
      rows.push(["Net Cash from Operating Activities", result.metrics.netCashFromOperating, ""]);
      rows.push(["", "", ""]);

      // Investing Activities
      rows.push(["INVESTING ACTIVITIES", "", ""]);
      result.investingActivities.activities.forEach(activity => {
        rows.push([activity.activityName, activity.currentPeriodAmount, ""]);
      });
      rows.push(["Net Cash from Investing Activities", result.metrics.netCashFromInvesting, ""]);
      rows.push(["", "", ""]);

      // Financing Activities
      rows.push(["FINANCING ACTIVITIES", "", ""]);
      result.financingActivities.activities.forEach(activity => {
        rows.push([activity.activityName, activity.currentPeriodAmount, ""]);
      });
      rows.push(["Net Cash from Financing Activities", result.metrics.netCashFromFinancing, ""]);
      rows.push(["", "", ""]);
      rows.push(["Net Change in Cash", result.metrics.netChangeInCash, ""]);

      return {
        headers: ["Description", "Amount", "Notes"],
        rows,
        metadata: {
          reportType: "cash-flow",
          fromDate: filters.fromDate,
          toDate: filters.toDate,
          method: result.method,
          netOperatingCash: result.metrics.netCashFromOperating,
          netInvestingCash: result.metrics.netCashFromInvesting,
          netFinancingCash: result.metrics.netCashFromFinancing,
          netCashChange: result.metrics.netChangeInCash,
        },
      };
    }

    default:
      throw new Error(`Unsupported report type: ${reportType}`);
  }
}
