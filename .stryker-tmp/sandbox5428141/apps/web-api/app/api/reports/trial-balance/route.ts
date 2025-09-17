// @ts-nocheck
// D4 Trial Balance API Route - V1 Compliant Implementation
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateTrialBalance, type TrialBalanceResult, type TrialBalanceError } from "@aibos/accounting/reports/trial-balance";
import { createClient } from "@supabase/supabase-js";
import { processIdempotencyKey } from "@aibos/utils/middleware/idempotency";
import {
  getV1AuditService,
  createV1AuditContext,
  createV1RequestContext,
  extractV1UserContext,
  utilsPerformanceMonitor,
} from "@aibos/utils";
import { checkSoDCompliance } from "@aibos/auth";

// Request schema validation (V1 requirement: Zod for all IO)
const TrialBalanceRequestSchema = z.object({
  tenantId: z.string().uuid(),
  companyId: z.string().uuid(),
  asOfDate: z.string().datetime(),
  includePeriodActivity: z.boolean().optional().default(false),
  includeZeroBalances: z.boolean().optional().default(false),
  currency: z.string().length(3).optional().default("MYR"),
  accountFilter: z
    .object({
      accountTypes: z.array(z.string()).optional(),
      accountIds: z.array(z.string().uuid()).optional(),
      accountNumberRange: z
        .object({
          from: z.string(),
          to: z.string(),
        })
        .optional(),
    })
    .optional(),
});

// Response schema
const TrialBalanceResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    asOfDate: z.string().datetime(),
    generatedAt: z.string().datetime(),
    currency: z.string(),
    accounts: z.array(
      z.object({
        accountId: z.string().uuid(),
        accountNumber: z.string(),
        accountName: z.string(),
        accountType: z.string(),
        accountCategory: z.string(),
        parentAccountId: z.string().uuid().optional(),
        level: z.number(),
        isHeader: z.boolean(),
        openingBalance: z.number(),
        periodDebits: z.number(),
        periodCredits: z.number(),
        closingBalance: z.number(),
        normalBalance: z.enum(["DEBIT", "CREDIT"]),
        currency: z.string(),
      }),
    ),
    totals: z.object({
      totalDebits: z.number(),
      totalCredits: z.number(),
      totalAssets: z.number(),
      totalLiabilities: z.number(),
      totalEquity: z.number(),
      totalRevenue: z.number(),
      totalExpenses: z.number(),
      netIncome: z.number(),
    }),
    isBalanced: z.boolean(),
    metadata: z.object({
      totalAccounts: z.number(),
      accountsWithActivity: z.number(),
      oldestTransaction: z.string().datetime().optional(),
      newestTransaction: z.string().datetime().optional(),
      generationTime: z.number(),
    }),
  }),
});

export type TTrialBalanceRequest = z.infer<typeof TrialBalanceRequestSchema>;
export type TTrialBalanceResponse = z.infer<typeof TrialBalanceResponseSchema>;

/**
 * GET /api/reports/trial-balance
 * Generate Trial Balance report with full V1 compliance
 */
export async function GET(request: NextRequest) {
  const auditService = getV1AuditService();
  let reportResult: TrialBalanceResult | TrialBalanceError | null = null;

  // Start performance monitoring
  const perfTimer = utilsPerformanceMonitor.createTimer("api.reports.trial-balance.get");

  try {
    // 1. Process idempotency key (V1 requirement)
    const idempotencyResult = await processIdempotencyKey(request);
    if (idempotencyResult.cached) {
      return NextResponse.json(idempotencyResult.response);
    }

    // 2. Extract user context and create request context
    const context = createV1RequestContext(request);
    const userContext = extractV1UserContext(request);

    // 3. Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    // 4. Parse and validate request (V1 requirement: Zod validation)
    const input = TrialBalanceRequestSchema.parse({
      tenantId: queryParams.tenantId,
      companyId: queryParams.companyId,
      asOfDate: queryParams.asOfDate,
      includePeriodActivity: queryParams.includePeriodActivity === "true",
      includeZeroBalances: queryParams.includeZeroBalances === "true",
      currency: queryParams.currency || "MYR",
      accountFilter: queryParams.accountFilter ? JSON.parse(queryParams.accountFilter) : undefined,
    });

    // 5. Validate SoD compliance (V1 requirement)
    const sodCheck = checkSoDCompliance("report:generate", userContext.userRole || "user");
    if (!sodCheck.allowed) {
      await auditService.logSecurityViolation(
        createV1AuditContext(request),
        "TRIAL_BALANCE_ACCESS_DENIED",
        { reason: sodCheck.reason, userRole: userContext.userRole || "user" },
      );

      return NextResponse.json(
        {
          success: false,
          error: `Access denied: ${sodCheck.reason}`,
          code: "SOD_VIOLATION",
        },
        { status: 403 },
      );
    }

    // 6. Create Supabase client with proper connection pooling
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 7. Generate trial balance
    const startTime = Date.now();
    reportResult = await generateTrialBalance(
      {
        ...input,
        asOfDate: new Date(input.asOfDate),
      },
      {
        query: async (sql: string, params?: unknown[]) => {
          const { data, error } = await supabase.rpc('execute_sql', {
            query: sql,
            params: params || []
          });
          if (error) throw error;
          return data;
        }
      },
    );

    if (!reportResult.success) {
      const errorResult = reportResult as TrialBalanceError;
      // Log failed report generation (V1 audit requirement)
      await auditService.logReportGeneration(
        createV1AuditContext(request),
        "TRIAL_BALANCE",
        input,
        {
          success: false,
          error: errorResult.error,
          generationTime: Date.now() - startTime,
        },
      );

      return NextResponse.json(
        {
          success: false,
          error: errorResult.error,
          code: errorResult.code,
        },
        { status: 400 },
      );
    }

    // 8. Log successful report generation (V1 audit requirement)
    await auditService.logReportGeneration(createV1AuditContext(request), "TRIAL_BALANCE", input, {
      success: true,
      accountCount: reportResult.accounts.length,
      totalDebits: reportResult.totals.totalDebits,
      totalCredits: reportResult.totals.totalCredits,
      isBalanced: reportResult.isBalanced,
      generationTime: Date.now() - startTime,
      currency: reportResult.currency,
    });

    // 9. Build and validate response
    const response: TTrialBalanceResponse = {
      success: true,
      data: {
        asOfDate: reportResult.asOfDate.toISOString(),
        generatedAt: reportResult.generatedAt.toISOString(),
        currency: reportResult.currency,
        accounts: reportResult.accounts,
        totals: reportResult.totals,
        isBalanced: reportResult.isBalanced,
        metadata: {
          ...reportResult.metadata,
          oldestTransaction: reportResult.metadata.oldestTransaction?.toISOString(),
          newestTransaction: reportResult.metadata.newestTransaction?.toISOString(),
        },
      },
    };

    // 10. Validate response schema
    const validatedResponse = TrialBalanceResponseSchema.parse(response);

    return NextResponse.json(validatedResponse);
  } catch (error) {
    console.error("Trial Balance API Error:", error);

    // Log error for audit trail
    await auditService.logError(createV1AuditContext(request), "TRIAL_BALANCE_ERROR", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      reportResult: reportResult ? { success: reportResult.success } : null,
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request parameters",
          code: "VALIDATION_ERROR",
          details: error.issues,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        code: "INTERNAL_ERROR",
      },
      { status: 500 },
    );
  } finally {
    // End performance monitoring
    perfTimer.end();
  }
}

/**
 * POST /api/reports/trial-balance
 * Generate Trial Balance report with complex parameters (V1 compliant)
 */
export async function POST(request: NextRequest) {
  const auditService = getV1AuditService();
  let reportResult: TrialBalanceResult | TrialBalanceError | null = null;

  // Start performance monitoring
  const perfTimer = utilsPerformanceMonitor.createTimer("api.reports.trial-balance");

  try {
    // 1. Process idempotency key (V1 requirement)
    const idempotencyResult = await processIdempotencyKey(request);
    if (idempotencyResult.cached) {
      return NextResponse.json(idempotencyResult.response);
    }

    // 2. Extract user context
    const context = createV1RequestContext(request);
    const userContext = extractV1UserContext(request);

    // 3. Parse request body
    const body = await request.json();

    // 4. Validate request (V1 requirement: Zod validation)
    const input = TrialBalanceRequestSchema.parse(body);

    // 5. Validate SoD compliance (V1 requirement)
    const sodCheck = checkSoDCompliance("report:generate", userContext.userRole || "user");
    if (!sodCheck.allowed) {
      await auditService.logSecurityViolation(
        createV1AuditContext(request),
        "TRIAL_BALANCE_ACCESS_DENIED",
        { reason: sodCheck.reason, userRole: userContext.userRole || "user" },
      );

      return NextResponse.json(
        {
          success: false,
          error: `Access denied: ${sodCheck.reason}`,
          code: "SOD_VIOLATION",
        },
        { status: 403 },
      );
    }

    // 6. Create Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 7. Generate trial balance
    const startTime = Date.now();
    reportResult = await generateTrialBalance(
      {
        ...input,
        asOfDate: new Date(input.asOfDate),
      },
      {
        query: async (sql: string, params?: unknown[]) => {
          const { data, error } = await supabase.rpc('execute_sql', {
            query: sql,
            params: params || []
          });
          if (error) throw error;
          return data;
        }
      },
    );

    if (!reportResult.success) {
      // Log failed report generation
      await auditService.logReportGeneration(
        createV1AuditContext(request),
        "TRIAL_BALANCE",
        input,
        {
          success: false,
          error: reportResult.error,
          generationTime: Date.now() - startTime,
        },
      );

      return NextResponse.json(
        {
          success: false,
          error: reportResult.error,
          code: reportResult.code,
        },
        { status: 400 },
      );
    }

    // 8. Log successful report generation
    await auditService.logReportGeneration(createV1AuditContext(request), "TRIAL_BALANCE", input, {
      success: true,
      accountCount: reportResult.accounts.length,
      totalDebits: reportResult.totals.totalDebits,
      totalCredits: reportResult.totals.totalCredits,
      isBalanced: reportResult.isBalanced,
      generationTime: Date.now() - startTime,
      currency: reportResult.currency,
    });

    // 9. Build and validate response
    const response: TTrialBalanceResponse = {
      success: true,
      data: {
        asOfDate: reportResult.asOfDate.toISOString(),
        generatedAt: reportResult.generatedAt.toISOString(),
        currency: reportResult.currency,
        accounts: reportResult.accounts,
        totals: reportResult.totals,
        isBalanced: reportResult.isBalanced,
        metadata: {
          ...reportResult.metadata,
          oldestTransaction: reportResult.metadata.oldestTransaction?.toISOString(),
          newestTransaction: reportResult.metadata.newestTransaction?.toISOString(),
        },
      },
    };

    // 10. Validate response schema
    const validatedResponse = TrialBalanceResponseSchema.parse(response);

    return NextResponse.json(validatedResponse);
  } catch (error) {
    console.error("Trial Balance API Error:", error);

    // Log error for audit trail
    await auditService.logError(createV1AuditContext(request), "TRIAL_BALANCE_ERROR", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      reportResult: reportResult ? { success: reportResult.success } : null,
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request parameters",
          code: "VALIDATION_ERROR",
          details: error.issues,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        code: "INTERNAL_ERROR",
      },
      { status: 500 },
    );
  } finally {
    // End performance monitoring
    perfTimer.end();
  }
}
