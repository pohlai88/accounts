// D4 Cash Flow Statement API Route - V1 Compliant Implementation
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateCashFlow, type CashFlowResult, type CashFlowError } from "@aibos/accounting/reports/cash-flow";
import { createClient } from "@supabase/supabase-js";
import { processIdempotencyKey } from "@aibos/utils/middleware/idempotency";
import {
  getV1AuditService,
  createV1AuditContext,
  createV1RequestContext,
  extractV1UserContext,
} from "@aibos/utils";
import { checkSoDCompliance } from "@aibos/auth";

// Request schema validation
const CashFlowRequestSchema = z.object({
  tenantId: z.string().uuid(),
  companyId: z.string().uuid(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  comparativePeriod: z
    .object({
      startDate: z.string().datetime(),
      endDate: z.string().datetime(),
    })
    .optional(),
  method: z.enum(["DIRECT", "INDIRECT"]).optional().default("INDIRECT"),
  currency: z.string().length(3).optional().default("MYR"),
  reportFormat: z.enum(["STANDARD", "COMPARATIVE"]).optional().default("STANDARD"),
});

export type TCashFlowRequest = z.infer<typeof CashFlowRequestSchema>;

/**
 * GET /api/reports/cash-flow
 * Generate Cash Flow Statement report with full V1 compliance
 */
export async function GET(request: NextRequest) {
  const auditService = getV1AuditService();
  let reportResult: CashFlowResult | CashFlowError | null = null;

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
    const { searchParams } = new globalThis.URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    // 4. Parse and validate request (V1 requirement: Zod validation)
    const input = CashFlowRequestSchema.parse({
      tenantId: queryParams.tenantId,
      companyId: queryParams.companyId,
      startDate: queryParams.startDate,
      endDate: queryParams.endDate,
      comparativePeriod: queryParams.comparativePeriod
        ? JSON.parse(queryParams.comparativePeriod)
        : undefined,
      method: queryParams.method || "INDIRECT",
      currency: queryParams.currency || "MYR",
      reportFormat: queryParams.reportFormat || "STANDARD",
    });

    // 5. Validate SoD compliance (V1 requirement)
    const sodCheck = checkSoDCompliance("report:generate", userContext.userRole || "user");
    if (!sodCheck.allowed) {
      await auditService.logSecurityViolation(
        createV1AuditContext(request),
        "CASH_FLOW_ACCESS_DENIED",
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

    // Generate cash flow statement
    const result = await generateCashFlow(
      {
        ...input,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        comparativePeriod: input.comparativePeriod
          ? {
            startDate: new Date(input.comparativePeriod.startDate),
            endDate: new Date(input.comparativePeriod.endDate),
          }
          : undefined,
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

    if (!result.success) {
      const errorResult = result as CashFlowError;
      return NextResponse.json(
        {
          success: false,
          error: errorResult.error,
          code: errorResult.code,
        },
        { status: 400 },
      );
    }

    // Return successful response
    return NextResponse.json({
      success: true,
      data: {
        ...result,
        startDate: result.startDate.toISOString(),
        endDate: result.endDate.toISOString(),
        comparativeStartDate: result.comparativeStartDate?.toISOString(),
        comparativeEndDate: result.comparativeEndDate?.toISOString(),
        generatedAt: result.generatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Cash Flow API Error:", error);

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
  }
}

/**
 * POST /api/reports/cash-flow
 * Generate Cash Flow Statement report with complex parameters
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate request
    const input = CashFlowRequestSchema.parse(body);

    // Create Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Generate cash flow statement
    const result = await generateCashFlow(
      {
        ...input,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        comparativePeriod: input.comparativePeriod
          ? {
            startDate: new Date(input.comparativePeriod.startDate),
            endDate: new Date(input.comparativePeriod.endDate),
          }
          : undefined,
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

    if (!result.success) {
      const errorResult = result as CashFlowError;
      return NextResponse.json(
        {
          success: false,
          error: errorResult.error,
          code: errorResult.code,
        },
        { status: 400 },
      );
    }

    // Return successful response
    return NextResponse.json({
      success: true,
      data: {
        ...result,
        startDate: result.startDate.toISOString(),
        endDate: result.endDate.toISOString(),
        comparativeStartDate: result.comparativeStartDate?.toISOString(),
        comparativeEndDate: result.comparativeEndDate?.toISOString(),
        generatedAt: result.generatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Cash Flow API Error:", error);

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
  }
}
