// D4 Period Management API Route - V1 Compliant Implementation
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  closeFiscalPeriod,
  openFiscalPeriod,
  createPeriodLock,
  type PeriodCloseResult,
  type PeriodManagementError,
} from "@aibos/accounting/periods/period-management";
import { createClient } from "@supabase/supabase-js";
import { SupabaseAdapter } from "@aibos/db";
import { processIdempotencyKey } from "@aibos/utils/middleware/idempotency";
import {
  getV1AuditService,
  createV1AuditContext,
  createV1RequestContext,
  extractV1UserContext,
  getErrorMessage,
  getErrorCode,
} from "@aibos/utils";
import { checkSoDCompliance } from "@aibos/auth";

// Period Close Request Schema
const PeriodCloseRequestSchema = z.object({
  tenantId: z.string().uuid(),
  companyId: z.string().uuid(),
  fiscalPeriodId: z.string().uuid(),
  closeDate: z.string().datetime(),
  closedBy: z.string().uuid(),
  userRole: z.string(),
  closeReason: z.string().optional(),
  forceClose: z.boolean().optional().default(false),
  generateReversingEntries: z.boolean().optional().default(false),
});

// Period Open Request Schema
const PeriodOpenRequestSchema = z.object({
  tenantId: z.string().uuid(),
  companyId: z.string().uuid(),
  fiscalPeriodId: z.string().uuid(),
  openedBy: z.string().uuid(),
  userRole: z.string(),
  openReason: z.string(),
  approvalRequired: z.boolean().optional().default(false),
});

// Period Lock Request Schema
const PeriodLockRequestSchema = z.object({
  tenantId: z.string().uuid(),
  companyId: z.string().uuid(),
  fiscalPeriodId: z.string().uuid(),
  lockType: z.enum(["POSTING", "REPORTING", "FULL"]),
  lockedBy: z.string().uuid(),
  userRole: z.string(),
  reason: z.string(),
});

export type TPeriodCloseRequest = z.infer<typeof PeriodCloseRequestSchema>;
export type TPeriodOpenRequest = z.infer<typeof PeriodOpenRequestSchema>;
export type TPeriodLockRequest = z.infer<typeof PeriodLockRequestSchema>;

/**
 * GET /api/periods
 * Get fiscal periods for a company
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");
    const companyId = searchParams.get("companyId");
    const status = searchParams.get("status"); // OPEN, CLOSED, LOCKED

    if (!tenantId || !companyId) {
      return NextResponse.json(
        {
          success: false,
          error: "tenantId and companyId are required",
          code: "MISSING_PARAMETERS",
        },
        { status: 400 },
      );
    }

    // Create Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build query
    let query = `
      SELECT
        fp.*,
        fc.calendar_name,
        fc.fiscal_year_start,
        fc.fiscal_year_end,
        pl.lock_type,
        pl.locked_at,
        pl.reason as lock_reason
      FROM fiscal_periods fp
      JOIN fiscal_calendars fc ON fp.fiscal_calendar_id = fc.id
      LEFT JOIN period_locks pl ON fp.id = pl.fiscal_period_id AND pl.is_active = true
      WHERE fp.tenant_id = $1 AND fp.company_id = $2
    `;

    const params = [tenantId, companyId];
    let paramIndex = 3;

    if (status) {
      query += ` AND fp.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY fp.fiscal_year, fp.period_number`;

    const { data, error } = await supabase.rpc("execute_sql", { query, params });

    if (error) {
      throw new Error(`Failed to fetch fiscal periods: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error("Get Periods API Error:", error);

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
 * POST /api/periods
 * Perform period management actions (close, open, lock)
 */
export async function POST(request: NextRequest) {
  const auditService = getV1AuditService();
  let operationResult: unknown = null;

  try {
    // 1. Process idempotency key (V1 requirement)
    const idempotencyResult = await processIdempotencyKey(request);
    if (idempotencyResult.cached) {
      return NextResponse.json(idempotencyResult.response);
    }

    // 2. Extract user context and create request context
    const context = createV1RequestContext(request);
    const userContext = extractV1UserContext(request);

    // 3. Parse request body
    const body = await request.json();
    const action = body.action;

    if (!action) {
      await auditService.logError(createV1AuditContext(request), "PERIOD_API_MISSING_ACTION", {
        body,
      });

      return NextResponse.json(
        {
          success: false,
          error: "Action is required (close, open, lock)",
          code: "MISSING_ACTION",
        },
        { status: 400 },
      );
    }

    // 4. Validate SoD compliance (V1 requirement)
    const requiredPermission =
      action === "close" ? "period:close" : action === "open" ? "period:open" : "period:lock";
    const sodCheck = checkSoDCompliance(requiredPermission, userContext.userRole || "user");

    if (!sodCheck.allowed) {
      await auditService.logSecurityViolation(
        createV1AuditContext(request),
        "PERIOD_ACCESS_DENIED",
        {
          action,
          reason: sodCheck.reason,
          userRole: userContext.userRole || "user",
        },
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

    // Create Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 5. Execute period management operation with audit logging
    const startTime = Date.now();
    let result: PeriodCloseResult | PeriodManagementError | { success: boolean; lockId?: string; error?: string };

    switch (action) {
      case "close":
        const closeInput = PeriodCloseRequestSchema.parse(body);
        operationResult = await closeFiscalPeriod(
          {
            ...closeInput,
            closeDate: new Date(closeInput.closeDate),
          },
          supabase,
        );
        result = operationResult as PeriodCloseResult | PeriodManagementError | { success: boolean; lockId?: string; error?: string };
        break;

      case "open":
        const openInput = PeriodOpenRequestSchema.parse(body);
        operationResult = await openFiscalPeriod(openInput, supabase);
        result = operationResult as PeriodCloseResult | PeriodManagementError | { success: boolean; lockId?: string; error?: string };
        break;

      case "lock":
        const lockInput = PeriodLockRequestSchema.parse(body);
        operationResult = await createPeriodLock(lockInput, supabase);
        result = operationResult as PeriodCloseResult | PeriodManagementError | { success: boolean; lockId?: string; error?: string };
        break;

      default:
        await auditService.logError(createV1AuditContext(request), "PERIOD_INVALID_ACTION", {
          action,
          validActions: ["close", "open", "lock"],
        });

        return NextResponse.json(
          {
            success: false,
            error: "Invalid action. Must be close, open, or lock",
            code: "INVALID_ACTION",
          },
          { status: 400 },
        );
    }

    const endTime = Date.now();

    if (!result.success) {
      const errorResult = result as PeriodManagementError | { success: false; error?: string };
      await auditService.logError(createV1AuditContext(request), "PERIOD_OPERATION_FAILED", {
        action,
        error: errorResult.error,
        code: 'code' in errorResult ? errorResult.code : "PERIOD_MANAGEMENT_ERROR",
        executionTime: endTime - startTime,
      });

      return NextResponse.json(
        {
          success: false,
          error: errorResult.error || "Period management operation failed",
          code: 'code' in errorResult ? errorResult.code : "PERIOD_MANAGEMENT_ERROR",
        },
        { status: 400 },
      );
    }

    // 6. Log successful operation (V1 requirement)
    await auditService.logPeriodOperation(
      createV1AuditContext(request),
      `PERIOD_${action.toUpperCase()}`,
      body.fiscalPeriodId,
      {
        action,
        tenantId: body.tenantId,
        companyId: body.companyId,
        executionTime: endTime - startTime,
        userRole: userContext.userRole || "user",
      },
    );

    const response = {
      success: true,
      data: result,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    const errorCode = getErrorCode(error);

    // Log error for audit trail (V1 requirement)
    await auditService.logError(createV1AuditContext(request), "PERIOD_API_ERROR", {
      error: errorMessage,
      code: errorCode,
    });

    console.error("Period Management API Error:", error);

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
 * PUT /api/periods/[id]
 * Update fiscal period details
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const periodId = searchParams.get("id");

    if (!periodId) {
      return NextResponse.json(
        {
          success: false,
          error: "Period ID is required",
          code: "MISSING_PERIOD_ID",
        },
        { status: 400 },
      );
    }

    // Validate update fields
    const updateSchema = z.object({
      periodName: z.string().optional(),
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
      status: z.enum(["OPEN", "CLOSED", "LOCKED"]).optional(),
    });

    const updateData = updateSchema.parse(body);

    // Create Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build update query
    const setClause = [];
    const params = [];
    let paramIndex = 1;

    if (updateData.periodName) {
      setClause.push(`period_name = $${paramIndex}`);
      params.push(updateData.periodName);
      paramIndex++;
    }

    if (updateData.startDate) {
      setClause.push(`start_date = $${paramIndex}`);
      params.push(new Date(updateData.startDate));
      paramIndex++;
    }

    if (updateData.endDate) {
      setClause.push(`end_date = $${paramIndex}`);
      params.push(new Date(updateData.endDate));
      paramIndex++;
    }

    if (updateData.status) {
      setClause.push(`status = $${paramIndex}`);
      params.push(updateData.status);
      paramIndex++;
    }

    if (setClause.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No fields to update",
          code: "NO_UPDATE_FIELDS",
        },
        { status: 400 },
      );
    }

    setClause.push(`updated_at = now()`);
    params.push(periodId);

    const query = `
      UPDATE fiscal_periods
      SET ${setClause.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const { data, error } = await supabase.rpc("execute_sql", { query, params });

    if (error) {
      throw new Error(`Failed to update fiscal period: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Fiscal period not found",
          code: "PERIOD_NOT_FOUND",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: data[0],
    });
  } catch (error) {
    console.error("Update Period API Error:", error);

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
