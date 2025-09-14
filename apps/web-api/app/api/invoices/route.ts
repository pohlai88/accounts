// Enhanced Invoice API - GET and POST endpoints
import { NextRequest, NextResponse } from 'next/server';
import { CreateInvoiceReq } from '@aibos/contracts';
import { calculateInvoiceTotals, validateInvoiceLines, calculateInvoiceTaxes } from '@aibos/accounting';
import { insertInvoice, type InvoiceInput } from '@aibos/db';
import { createRequestContext, extractUserContext } from '@aibos/utils';
import { getAuditService, createAuditContext } from '@aibos/utils';
import { processIdempotencyKey } from '@aibos/utils/middleware/idempotency';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/invoices - Get invoices with filtering and pagination
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const context = createRequestContext(req);
    const scope = extractUserContext(req);
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    // Create Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build query
    let query = supabase
      .from('invoices')
      .select(`
        *,
        customers!invoices_customer_id_fkey (
          id,
          name,
          email
        )
      `)
      .eq('tenant_id', scope.tenantId)
      .eq('company_id', scope.companyId);

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (customerId) {
      query = query.eq('customer_id', customerId);
    }
    if (fromDate) {
      query = query.gte('invoice_date', fromDate);
    }
    if (toDate) {
      query = query.lte('invoice_date', toDate);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: invoices, error, count } = await query
      .range(from, to)
      .order('created_at', { ascending: false });

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
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Failed to fetch invoices:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invoices' },
      { status: 500 }
    );
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
    const scope = extractUserContext(req);

    const auditContext = createAuditContext(
      context.request_id,
      req.ip || req.headers.get('x-forwarded-for') || 'unknown',
      req.headers.get('user-agent') || 'unknown',
      'API'
    );

    // 1. Check idempotency
    const idempotencyResult = await processIdempotencyKey(req);
    if (idempotencyResult.cached) {
      return NextResponse.json(idempotencyResult.response);
    }

    // 2. Calculate taxes for all lines
    const lineTaxCalculations = await calculateInvoiceTaxes(scope, body.lines.map(line => ({
      lineNumber: line.lineNumber,
      lineAmount: line.quantity * line.unitPrice,
      taxCode: line.taxCode
    })));

    // 3. Validate invoice lines calculations with calculated taxes
    const lineValidation = validateInvoiceLines(lineTaxCalculations.map(calc => ({
      lineNumber: calc.lineNumber,
      description: body.lines.find(l => l.lineNumber === calc.lineNumber)?.description || '',
      quantity: body.lines.find(l => l.lineNumber === calc.lineNumber)?.quantity || 0,
      unitPrice: body.lines.find(l => l.lineNumber === calc.lineNumber)?.unitPrice || 0,
      lineAmount: calc.lineAmount,
      taxCode: calc.taxCode,
      taxRate: calc.taxRate,
      taxAmount: calc.taxAmount,
      revenueAccountId: body.lines.find(l => l.lineNumber === calc.lineNumber)?.revenueAccountId || ''
    })));

    if (!lineValidation.valid) {
      await auditService.logOperation({
        scope,
        action: 'CREATE',
        entityType: 'INVOICE',
        entityId: 'validation-failed',
        metadata: {
          errors: lineValidation.errors,
          invoiceNumber: body.invoiceNumber
        },
        context: auditContext
      });

      return NextResponse.json(
        { error: 'Invoice line validation failed', details: lineValidation.errors },
        { status: 400 }
      );
    }

    // 4. Calculate invoice totals with actual tax amounts
    const totals = calculateInvoiceTotals(lineTaxCalculations.map(calc => ({
      lineNumber: calc.lineNumber,
      description: body.lines.find(l => l.lineNumber === calc.lineNumber)?.description || '',
      quantity: body.lines.find(l => l.lineNumber === calc.lineNumber)?.quantity || 0,
      unitPrice: body.lines.find(l => l.lineNumber === calc.lineNumber)?.unitPrice || 0,
      lineAmount: calc.lineAmount,
      taxCode: calc.taxCode,
      taxRate: calc.taxRate,
      taxAmount: calc.taxAmount,
      revenueAccountId: body.lines.find(l => l.lineNumber === calc.lineNumber)?.revenueAccountId || ''
    })));

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
          revenueAccountId: originalLine.revenueAccountId
        };
      })
    };

    // 6. Insert invoice
    invoiceResult = await insertInvoice(scope, invoiceInput);

    // 7. Log successful invoice creation
    await auditService.logOperation({
      scope,
      action: 'CREATE',
      entityType: 'INVOICE',
      entityId: invoiceResult.id as string,
      metadata: {
        invoiceNumber: invoiceResult.invoiceNumber,
        customerId: body.customerId,
        currency: body.currency,
        totalAmount: totals.totalAmount,
        status: 'draft'
      },
      context: auditContext
    });

    // 8. Build response
    const response = {
      id: invoiceResult.id,
      invoiceNumber: invoiceResult.invoiceNumber,
      customerId: body.customerId,
      customerName: invoiceResult.customerName || 'Unknown Customer',
      invoiceDate: body.invoiceDate,
      dueDate: body.dueDate,
      currency: body.currency,
      subtotal: totals.subtotal,
      taxAmount: totals.taxAmount,
      totalAmount: totals.totalAmount,
      status: 'draft',
      lines: (invoiceResult.lines as Array<Record<string, unknown>>).map((line) => ({
        id: line.id,
        lineNumber: Number(line.lineNumber),
        description: line.description,
        quantity: Number(line.quantity),
        unitPrice: Number(line.unitPrice),
        lineAmount: Number(line.lineAmount),
        taxCode: line.taxCode,
        taxRate: Number(line.taxRate || 0),
        taxAmount: Number(line.taxAmount),
        revenueAccountId: line.revenueAccountId
      })),
      createdAt: invoiceResult.createdAt
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    // Log error for audit trail
    try {
      const context = createRequestContext(req);
      const scope = extractUserContext(req);
      const auditContext = createAuditContext(
        context.request_id,
        req.ip || req.headers.get('x-forwarded-for') || 'unknown',
        req.headers.get('user-agent') || 'unknown',
        'API'
      );

      await auditService.logOperation({
        scope,
        action: 'CREATE',
        entityType: 'INVOICE',
        entityId: 'error',
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        },
        context: auditContext
      });
    } catch (auditError) {
      console.error('Audit logging failed during error handling:', auditError);
    }

    console.error('Invoice creation error:', error);

    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json(
        { error: 'Invoice number already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    );
  }
}
