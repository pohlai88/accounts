// Enhanced Invoice API - GET and POST endpoints
import { NextRequest, NextResponse } from "next/server";
import { CreateInvoiceReq } from "@aibos/contracts";
import {
  calculateInvoiceTotals,
  validateInvoiceLines,
  calculateInvoiceTaxes,
  validateInvoicePosting,
} from "@aibos/accounting";
import { insertInvoice, insertJournal, updateInvoicePosting, type InvoiceInput, type JournalInput } from "@aibos/db";
import { createRequestContext, extractUserContext, pick } from "@aibos/utils";
import { getAuditService } from "@aibos/utils";
import { createAuditContext } from "@aibos/utils/audit/service";
import { processIdempotencyKey } from "@aibos/utils/middleware/idempotency";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/invoices - Get invoices with filtering and pagination
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const context = createRequestContext(req);
    const userContext = extractUserContext(req);
    const scope = {
      tenantId: userContext.tenantId!,
      companyId: userContext.companyId!,
      userId: userContext.userId!,
      userRole: userContext.userRole!,
    };
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");
    const customerId = searchParams.get("customerId");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    // Create Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build query
    let query = supabase
      .from("invoices")
      .select(
        `
        *,
        customers!invoices_customer_id_fkey (
          id,
          name,
          email
        )
      `,
      )
      .eq("tenant_id", scope.tenantId)
      .eq("company_id", scope.companyId);

    // Apply filters
    if (status) {
      query = query.eq("status", status);
    }
    if (customerId) {
      query = query.eq("customer_id", customerId);
    }
    if (fromDate) {
      query = query.gte("invoice_date", fromDate);
    }
    if (toDate) {
      query = query.lte("invoice_date", toDate);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const {
      data: invoices,
      error,
      count,
    } = await query.range(from, to).order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch invoices: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      data: invoices || [],
      meta: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: {
        type: "internal_error",
        title: "Failed to fetch invoices",
        status: 500,
        code: "INVOICE_FETCH_FAILED",
        detail: "An unexpected error occurred while fetching invoices",
      },
      timestamp: new Date().toISOString(),
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }, { status: 500 });
  }
}

/**
 * POST /api/invoices - Create new invoice
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const auditService = getAuditService();
  let invoiceResult: Record<string, unknown> | null = null;

  try {
    const context = createRequestContext(req);
    const body = CreateInvoiceReq.parse(await req.json());
    const userContext = extractUserContext(req);
    const scope = {
      tenantId: userContext.tenantId!,
      companyId: userContext.companyId!,
      userId: userContext.userId!,
      userRole: userContext.userRole!,
    };

    const auditContext = createAuditContext(
      context.requestId,
      req.ip || req.headers.get("x-forwarded-for") || "unknown",
      req.headers.get("user-agent") || "unknown",
      "API",
    );

    // 1. Check idempotency
    const idempotencyResult = await processIdempotencyKey(req);
    if (idempotencyResult.cached) {
      return NextResponse.json(idempotencyResult.response);
    }

    // 2. Calculate taxes for all lines
    const lineTaxCalculations = await calculateInvoiceTaxes(
      scope,
      body.lines.map(line => ({
        lineNumber: line.lineNumber,
        lineAmount: line.quantity * line.unitPrice,
        taxCode: line.taxCode,
      })),
    );

    // 3. Validate invoice lines calculations with calculated taxes
    const lineValidation = validateInvoiceLines(
      lineTaxCalculations.map(calc => ({
        lineNumber: calc.lineNumber,
        description: body.lines.find(l => l.lineNumber === calc.lineNumber)?.description || "",
        quantity: body.lines.find(l => l.lineNumber === calc.lineNumber)?.quantity || 0,
        unitPrice: body.lines.find(l => l.lineNumber === calc.lineNumber)?.unitPrice || 0,
        lineAmount: calc.lineAmount,
        taxCode: calc.taxCode,
        taxRate: calc.taxRate,
        taxAmount: calc.taxAmount,
        revenueAccountId:
          body.lines.find(l => l.lineNumber === calc.lineNumber)?.revenueAccountId || "",
      })),
    );

    if (!lineValidation.valid) {
      await auditService.logOperation({
        scope,
        action: "CREATE",
        entityType: "INVOICE",
        entityId: "validation-failed",
        metadata: {
          errors: lineValidation.errors,
          invoiceNumber: body.invoiceNumber,
        },
        context: auditContext,
      });

      return NextResponse.json(
        { error: "Invoice line validation failed", details: lineValidation.errors },
        { status: 400 },
      );
    }

    // 4. Calculate invoice totals with actual tax amounts
    const totals = calculateInvoiceTotals(
      lineTaxCalculations.map(calc => ({
        lineNumber: calc.lineNumber,
        description: body.lines.find(l => l.lineNumber === calc.lineNumber)?.description || "",
        quantity: body.lines.find(l => l.lineNumber === calc.lineNumber)?.quantity || 0,
        unitPrice: body.lines.find(l => l.lineNumber === calc.lineNumber)?.unitPrice || 0,
        lineAmount: calc.lineAmount,
        taxCode: calc.taxCode,
        taxRate: calc.taxRate,
        taxAmount: calc.taxAmount,
        revenueAccountId:
          body.lines.find(l => l.lineNumber === calc.lineNumber)?.revenueAccountId || "",
      })),
    );

    // 5. Create invoice input with calculated taxes
    const invoiceInput: InvoiceInput = {
      customerId: body.customerId,
      invoiceNumber: body.invoiceNumber,
      invoiceDate: new Date(body.invoiceDate),
      dueDate: new Date(body.dueDate),
      currency: body.currency,
      exchangeRate: body.exchangeRate,
      description: body.description,
      notes: body.notes,
      lines: lineTaxCalculations.map(calc => {
        const originalLine = body.lines.find(l => l.lineNumber === calc.lineNumber);
        if (!originalLine) {
          throw new Error(`Original line not found for line number ${calc.lineNumber}`);
        }
        return {
          lineNumber: calc.lineNumber,
          description: originalLine.description,
          quantity: originalLine.quantity,
          unitPrice: originalLine.unitPrice,
          lineAmount: calc.lineAmount,
          taxCode: calc.taxCode,
          taxRate: calc.taxRate,
          taxAmount: calc.taxAmount,
          revenueAccountId: originalLine.revenueAccountId,
        };
      }),
    };

    // 6. Insert invoice
    invoiceResult = await insertInvoice(scope, invoiceInput);

    // 7. GL Posting Integration - Validate and create journal entry
    try {
      // Get customer name for posting
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: customer } = await supabase
        .from("customers")
        .select("name")
        .eq("id", body.customerId)
        .eq("tenant_id", scope.tenantId)
        .eq("company_id", scope.companyId)
        .single();

      // Get AR account ID from company settings or create default
      const { getOrCreateDefaultArAccount } = await import("@aibos/db");
      const arAccountId = await getOrCreateDefaultArAccount(scope);

      // Validate invoice posting
      const postingValidation = await validateInvoicePosting(
        {
          tenantId: scope.tenantId,
          companyId: scope.companyId,
          invoiceId: invoiceResult.id as string,
          invoiceNumber: body.invoiceNumber,
          customerId: body.customerId,
          customerName: customer?.name || "Unknown Customer",
          invoiceDate: body.invoiceDate,
          currency: body.currency,
          exchangeRate: body.exchangeRate,
          arAccountId: arAccountId,
          lines: lineTaxCalculations.map(calc => {
            const originalLine = body.lines.find(l => l.lineNumber === calc.lineNumber);
            return {
              lineNumber: calc.lineNumber,
              description: originalLine?.description || "",
              quantity: originalLine?.quantity || 0,
              unitPrice: originalLine?.unitPrice || 0,
              lineAmount: calc.lineAmount,
              revenueAccountId: originalLine?.revenueAccountId || "",
              taxCode: calc.taxCode,
              taxRate: calc.taxRate,
              taxAmount: calc.taxAmount,
            };
          }),
          description: body.description,
        },
        scope.userId,
        scope.userRole,
        "MYR" // Base currency - should come from company settings
      );

      if (!postingValidation.validated) {
        // Log validation failure but don't fail the invoice creation
        await auditService.logOperation({
          scope,
          action: "CREATE",
          entityType: "INVOICE",
          entityId: invoiceResult.id as string,
          metadata: {
            invoiceNumber: invoiceResult.invoiceNumber,
            error: postingValidation.error,
            code: (postingValidation as any).code,
            status: "validation_failed",
            postingType: "GL_POSTING",
          },
          context: auditContext,
        });

      } else {
        // Create journal entry
        const journalInput: JournalInput = {
          journalNumber: `INV-${body.invoiceNumber}`,
          description: postingValidation.journalInput.description,
          journalDate: postingValidation.journalInput.journalDate,
          currency: postingValidation.journalInput.currency,
          lines: postingValidation.journalInput.lines,
          status: "posted",
        };

        const journalResult = await insertJournal(scope, journalInput);

        // Update invoice with journal reference
        await updateInvoicePosting(scope, invoiceResult.id as string, journalResult.id, "posted");

        // Log successful GL posting
        await auditService.logOperation({
          scope,
          action: "POST",
          entityType: "JOURNAL",
          entityId: journalResult.id,
          metadata: {
            journalNumber: journalResult.journalNumber,
            invoiceId: invoiceResult.id,
            invoiceNumber: invoiceResult.invoiceNumber,
            totalDebit: journalResult.totalDebit,
            totalCredit: journalResult.totalCredit,
            status: "posted",
          },
          context: auditContext,
        });


      }
    } catch (glError) {
      // Log GL posting error but don't fail the invoice creation
      await auditService.logOperation({
        scope,
        action: "CREATE",
        entityType: "INVOICE",
        entityId: invoiceResult.id as string,
        metadata: {
          invoiceNumber: invoiceResult.invoiceNumber,
          error: glError instanceof Error ? glError.message : "Unknown GL posting error",
          status: "gl_posting_failed",
          postingType: "GL_POSTING",
        },
        context: auditContext,
      });

    }

    // 8. Log successful invoice creation
    await auditService.logOperation({
      scope,
      action: "CREATE",
      entityType: "INVOICE",
      entityId: invoiceResult.id as string,
      metadata: {
        invoiceNumber: invoiceResult.invoiceNumber,
        customerId: body.customerId,
        currency: body.currency,
        totalAmount: totals.totalAmount,
        status: "draft",
      },
      context: auditContext,
    });

    // 9. Build response
    const response = {
      id: invoiceResult.id,
      invoiceNumber: invoiceResult.invoiceNumber,
      customerId: body.customerId,
      customerName: invoiceResult.customerName || "Unknown Customer",
      invoiceDate: body.invoiceDate,
      dueDate: body.dueDate,
      currency: body.currency,
      subtotal: totals.subtotal,
      taxAmount: totals.taxAmount,
      totalAmount: totals.totalAmount,
      status: "draft", // Will be updated to "posted" if GL posting succeeds
      lines: (invoiceResult.lines as Array<Record<string, unknown>>).map(line => ({
        id: line.id,
        lineNumber: Number(line.lineNumber),
        description: line.description,
        quantity: Number(line.quantity),
        unitPrice: Number(line.unitPrice),
        lineAmount: Number(line.lineAmount),
        taxCode: line.taxCode,
        taxRate: Number(line.taxRate || 0),
        taxAmount: Number(line.taxAmount),
        revenueAccountId: line.revenueAccountId,
      })),
      createdAt: invoiceResult.createdAt,
      // Add GL posting status
      glPosting: {
        status: "integrated", // Indicates GL posting integration is active
        note: "Invoice will be automatically posted to GL if validation passes",
      },
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    // Log error for audit trail
    try {
      const context = createRequestContext(req);
      const userContext = extractUserContext(req);
      const scope = {
        tenantId: userContext.tenantId!,
        companyId: userContext.companyId!,
        userId: userContext.userId!,
        userRole: userContext.userRole!,
      };
      const auditContext = createAuditContext(
        context.requestId,
        req.ip || req.headers.get("x-forwarded-for") || "unknown",
        req.headers.get("user-agent") || "unknown",
        "API",
      );

      await auditService.logOperation({
        scope,
        action: "CREATE",
        entityType: "INVOICE",
        entityId: "error",
        metadata: {
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
        },
        context: auditContext,
      });
    } catch (auditError) {
    }


    if (error instanceof Error && error.message.includes("already exists")) {
      return NextResponse.json({
        success: false,
        error: {
          type: "conflict_error",
          title: "Invoice number already exists",
          status: 409,
          code: "INVOICE_NUMBER_EXISTS",
          detail: "An invoice with this number already exists",
        },
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      }, { status: 409 });
    }

    return NextResponse.json({
      success: false,
      error: {
        type: "internal_error",
        title: "Failed to create invoice",
        status: 500,
        code: "INVOICE_CREATION_FAILED",
        detail: "An unexpected error occurred while creating the invoice",
      },
      timestamp: new Date().toISOString(),
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }, { status: 500 });
  }
}
