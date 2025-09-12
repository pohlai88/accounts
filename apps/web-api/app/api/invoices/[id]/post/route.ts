// D2 AR Invoice Posting API - Post Invoice to GL
import { NextRequest, NextResponse } from 'next/server';
import { PostInvoiceReq, type TPostInvoiceRes } from '@aibos/contracts';
import { validateInvoicePosting, type InvoicePostingInput } from '@aibos/accounting';
import { getInvoice, insertJournal, updateInvoicePosting, type InvoiceWithLines } from '@aibos/db';
import { createRequestContext, extractUserContext } from '@aibos/utils';
import { getAuditService, createAuditContext } from '@aibos/utils';
import { processIdempotencyKey } from '@aibos/utils/middleware/idempotency';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * POST /api/invoices/[id]/post - Post invoice to GL
 */
export async function POST(req: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const auditService = getAuditService();
  let journalResult: Record<string, unknown> | null = null;

  try {
    const context = createRequestContext(req);
    const body = PostInvoiceReq.parse(await req.json());
    const scope = extractUserContext(req);
    const invoiceId = params.id;

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

    // 2. Get invoice details
    const invoice = await getInvoice(scope, invoiceId) as InvoiceWithLines;

    // Note: getInvoice throws an error if invoice is not found, so invoice is guaranteed to exist here

    if (invoice.status === 'posted') {
      return NextResponse.json(
        { error: 'Invoice is already posted' },
        { status: 400 }
      );
    }

    // 3. Build invoice posting input
    const invoicePostingInput: InvoicePostingInput = {
      tenantId: scope.tenantId,
      companyId: scope.companyId,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerId: invoice.customerId,
      customerName: invoice.customerName || 'Unknown Customer',
      invoiceDate: new Date(invoice.invoiceDate ?? Date.now()).toISOString().slice(0, 10),
      currency: invoice.currency,
      exchangeRate: Number(invoice.exchangeRate || 1),
      arAccountId: body.arAccountId,
      lines: invoice.lines.map((line: Record<string, unknown>) => ({
        lineNumber: Number(line.lineNumber),
        description: String(line.description || ''),
        quantity: Number(line.quantity),
        unitPrice: Number(line.unitPrice),
        lineAmount: Number(line.lineAmount),
        revenueAccountId: String(line.revenueAccountId || ''),
        taxCode: line.taxCode ? String(line.taxCode) : undefined,
        taxRate: Number(line.taxRate || 0),
        taxAmount: Number(line.taxAmount || 0)
      })),
      description: body.description
    };

    // 4. Validate invoice posting
    const validation = await validateInvoicePosting(
      invoicePostingInput,
      scope.userId,
      scope.userRole
    );

    if (!validation.validated) {
      await auditService.logOperation({
        scope,
        action: 'POST',
        entityType: 'INVOICE',
        entityId: invoiceId,
        metadata: {
          error: validation.error,
          code: validation.code,
          invoiceNumber: invoice.invoiceNumber
        },
        context: auditContext
      });

      return NextResponse.json(
        { error: validation.error, code: validation.code },
        { status: 400 }
      );
    }

    // 5. Log SoD compliance check
    await auditService.logSoDCompliance(
      scope,
      'invoice:post',
      validation.requiresApproval ? 'REQUIRES_APPROVAL' : 'ALLOWED',
      validation.requiresApproval ? `Requires approval from: ${validation.approverRoles?.join(', ')}` : undefined,
      auditContext
    );

    if (validation.requiresApproval) {
      return NextResponse.json(
        {
          error: 'Invoice posting requires approval',
          requiresApproval: true,
          approverRoles: validation.approverRoles
        },
        { status: 403 }
      );
    }

    // 6. Create journal entry
    const journalInput = {
      ...validation.journalInput,
      status: 'posted' as const,
      idempotencyKey: idempotencyResult.key
    };

    journalResult = await insertJournal(scope, journalInput);

    // 7. Update invoice status
    await updateInvoicePosting(scope, invoiceId, String(journalResult?.id || ''), 'posted');

    // 8. Log successful posting
    await auditService.logJournalPosting(
      scope,
      String(journalResult?.id || ''),
      {
        journalNumber: String(journalResult?.journalNumber || ''),
        description: validation.journalInput.description,
        currency: validation.journalInput.currency,
        totalDebit: validation.totalAmount,
        totalCredit: validation.totalAmount,
        lineCount: validation.journalInput.lines.length
      },
      'POST',
      auditContext
    );

    // 9. Build response
    const response: TPostInvoiceRes = {
      invoiceId: invoiceId,
      journalId: String(journalResult?.id || ''),
      journalNumber: String(journalResult?.journalNumber || ''),
      status: 'posted',
      totalDebit: validation.totalAmount,
      totalCredit: validation.totalAmount,
      lines: validation.journalInput.lines.map(line => ({
        accountId: line.accountId,
        accountName: `Account ${line.accountId.slice(-8)}`, // Account name lookup can be added later
        debit: line.debit,
        credit: line.credit,
        description: line.description || ''
      })),
      postedAt: new Date().toISOString()
    };

    return NextResponse.json(response, { status: 200 });

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
        action: 'POST',
        entityType: 'INVOICE',
        entityId: params.id,
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        },
        context: auditContext
      });
    } catch (auditError) {
      console.error('Audit logging failed during error handling:', auditError);
    }

    console.error('Invoice posting error:', error);

    return NextResponse.json(
      { error: 'Failed to post invoice to GL' },
      { status: 500 }
    );
  }
}
