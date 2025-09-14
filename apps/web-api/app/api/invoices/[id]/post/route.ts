// Enhanced Invoice Posting API - Demonstrates permission system integration
// Shows how to integrate enhanced permissions with existing business logic

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { assertPermission, checkPermission, checkFeature } from '@aibos/utils';
import { getV1AuditService, createV1AuditContext } from '@aibos/utils';
import { createServiceClient } from '@aibos/utils';

// Request validation schema
const PostInvoiceSchema = z.object({
  totalAmount: z.number().min(0),
  postingDate: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * POST /api/invoices/[id]/post - Post invoice to GL
 * Demonstrates enhanced permission checking with existing patterns
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const auditService = getV1AuditService();
  const auditContext = createV1AuditContext(request);

  try {
    // 1. Parse and validate request
    const body = await request.json();
    const { totalAmount, postingDate, notes } = PostInvoiceSchema.parse(body);
    const invoiceId = params.id;

    // 2. Check if AR feature is enabled
    const hasARFeature = await checkFeature(request, 'ar');
    if (!hasARFeature) {
      return NextResponse.json(
        { success: false, error: 'Accounts Receivable module is disabled' },
        { status: 403 }
      );
    }

    // 3. Check permission with amount context (ABAC)
    const permissionDecision = await checkPermission(request, 'invoice:post', {
      amount: totalAmount,
      module: 'AR'
    });

    if (!permissionDecision.allowed) {
      // Log the denial for audit
      await auditService.logOperation(auditContext, {
        operation: 'invoice_post_denied',
        data: {
          invoiceId,
          totalAmount,
          reason: permissionDecision.reason
        }
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Permission denied',
          reason: permissionDecision.reason,
          requiresApproval: permissionDecision.requiresApproval
        },
        { status: 403 }
      );
    }

    // 4. If requires approval, create approval workflow
    if (permissionDecision.requiresApproval) {
      // In a real implementation, you'd create an approval workflow here
      // For now, we'll just log it and return a pending status

      await auditService.logOperation(auditContext, {
        operation: 'invoice_post_pending_approval',
        data: {
          invoiceId,
          totalAmount,
          reason: 'Amount exceeds approval threshold'
        }
      });

      return NextResponse.json({
        success: true,
        status: 'pending_approval',
        message: 'Invoice posting requires approval',
        data: {
          invoiceId,
          totalAmount,
          approvalRequired: true
        }
      });
    }

    // 5. Proceed with actual invoice posting (your existing business logic)
    const supabase = createServiceClient();

    // Fetch invoice details
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (fetchError || !invoice) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Check if already posted
    if (invoice.status === 'posted') {
      return NextResponse.json(
        { success: false, error: 'Invoice already posted' },
        { status: 400 }
      );
    }

    // Update invoice status to posted
    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        status: 'posted',
        posted_at: new Date().toISOString(),
        posted_by: auditContext.userId,
        posting_notes: notes
      })
      .eq('id', invoiceId);

    if (updateError) {
      throw new Error(`Failed to post invoice: ${updateError.message}`);
    }

    // 6. Create GL entries (simplified for demo)
    // In a real implementation, you'd use your existing GL posting logic
    const glEntries = [
      {
        account_id: 'accounts-receivable',
        debit: totalAmount,
        credit: 0,
        description: `Invoice ${invoice.invoice_number} - AR`
      },
      {
        account_id: 'revenue',
        debit: 0,
        credit: totalAmount,
        description: `Invoice ${invoice.invoice_number} - Revenue`
      }
    ];

    // Insert GL entries
    const { error: glError } = await supabase
      .from('gl_journal_lines')
      .insert(glEntries.map(entry => ({
        ...entry,
        journal_id: `invoice-${invoiceId}`,
        tenant_id: auditContext.tenantId,
        company_id: auditContext.companyId
      })));

    if (glError) {
      // Rollback invoice status on GL error
      await supabase
        .from('invoices')
        .update({ status: 'draft' })
        .eq('id', invoiceId);

      throw new Error(`Failed to create GL entries: ${glError.message}`);
    }

    // 7. Log successful posting
    await auditService.logOperation(auditContext, {
      operation: 'invoice_posted',
      data: {
        invoiceId,
        invoiceNumber: invoice.invoice_number,
        totalAmount,
        postingDate: postingDate || new Date().toISOString(),
        glEntriesCount: glEntries.length
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Invoice posted successfully',
      data: {
        invoiceId,
        invoiceNumber: invoice.invoice_number,
        status: 'posted',
        totalAmount,
        postedAt: new Date().toISOString(),
        glEntriesCreated: glEntries.length
      }
    });

  } catch (error) {
    console.error('Invoice posting failed:', error);

    // Log the error
    await auditService.logError(auditContext, 'INVOICE_POST_ERROR', {
      operation: 'invoice_post',
      error: error instanceof Error ? error.message : String(error),
      data: { invoiceId: params.id }
    });

    if ((error as unknown).status === 403) {
      return NextResponse.json(
        { success: false, error: 'Forbidden', message: (error as Error).message },
        { status: 403 }
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}