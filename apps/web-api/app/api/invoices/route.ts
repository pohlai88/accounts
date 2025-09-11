// D2 AR Invoice API - Create and Post Invoices to GL
import { NextRequest, NextResponse } from 'next/server';
import { CreateInvoiceReq, CreateInvoiceRes, PostInvoiceReq, PostInvoiceRes } from '@aibos/contracts';
import { validateInvoicePosting, calculateInvoiceTotals, validateInvoiceLines } from '@aibos/accounting';
import { insertInvoice, insertJournal, updateInvoicePosting, type Scope, type InvoiceInput } from '@aibos/db';
import { createRequestContext, extractUserContext } from '@aibos/utils';
import { getAuditService, createAuditContext } from '@aibos/utils';
import { processIdempotencyKey, type IdempotencyResult } from '@aibos/utils/middleware';

/**
 * POST /api/invoices - Create new invoice
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const auditService = getAuditService();
  let invoiceResult: any = null;

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

    // 1. Validate invoice lines calculations
    const lineValidation = validateInvoiceLines(body.lines.map(line => ({
      lineNumber: line.lineNumber,
      description: line.description,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      lineAmount: line.quantity * line.unitPrice, // Calculate line amount
      taxCode: line.taxCode,
      taxRate: 0, // TODO: Resolve tax rate from tax code
      taxAmount: 0, // TODO: Calculate tax amount
      revenueAccountId: line.revenueAccountId
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

    // 2. Calculate invoice totals
    const totals = calculateInvoiceTotals(body.lines.map(line => ({
      lineNumber: line.lineNumber,
      description: line.description,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      lineAmount: line.quantity * line.unitPrice,
      taxCode: line.taxCode,
      taxRate: 0, // TODO: Resolve from tax code
      taxAmount: 0, // TODO: Calculate
      revenueAccountId: line.revenueAccountId
    })));

    // 3. Create invoice input
    const invoiceInput: InvoiceInput = {
      customerId: body.customerId,
      invoiceNumber: body.invoiceNumber,
      invoiceDate: new Date(body.invoiceDate),
      dueDate: new Date(body.dueDate),
      currency: body.currency,
      exchangeRate: body.exchangeRate,
      description: body.description,
      notes: body.notes,
      lines: body.lines.map(line => ({
        lineNumber: line.lineNumber,
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        lineAmount: line.quantity * line.unitPrice,
        taxCode: line.taxCode,
        taxRate: 0, // TODO: Resolve from tax code
        taxAmount: 0, // TODO: Calculate
        revenueAccountId: line.revenueAccountId
      }))
    };

    // 4. Insert invoice
    invoiceResult = await insertInvoice(scope, invoiceInput);

    // 5. Log successful invoice creation
    await auditService.logOperation({
      scope,
      action: 'CREATE',
      entityType: 'INVOICE',
      entityId: invoiceResult.id,
      metadata: {
        invoiceNumber: invoiceResult.invoiceNumber,
        customerId: body.customerId,
        currency: body.currency,
        totalAmount: totals.totalAmount,
        status: 'draft'
      },
      context: auditContext
    });

    // 6. Build response
    const response: CreateInvoiceRes = {
      id: invoiceResult.id,
      invoiceNumber: invoiceResult.invoiceNumber,
      customerId: body.customerId,
      customerName: 'Customer Name', // TODO: Get from customer lookup
      invoiceDate: body.invoiceDate,
      dueDate: body.dueDate,
      currency: body.currency,
      subtotal: totals.subtotal,
      taxAmount: totals.taxAmount,
      totalAmount: totals.totalAmount,
      status: 'draft',
      lines: invoiceResult.lines.map((line: any) => ({
        id: line.id,
        lineNumber: Number(line.lineNumber),
        description: line.description,
        quantity: Number(line.quantity),
        unitPrice: Number(line.unitPrice),
        lineAmount: Number(line.lineAmount),
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
