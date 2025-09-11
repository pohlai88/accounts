import { NextRequest, NextResponse } from "next/server";
import { PostJournalReq, PostJournalRes, PostingErrorRes } from "@aibos/contracts";
import { postJournal, PostingError, JournalPostingInput } from "@aibos/accounting";
import { insertJournal, DatabaseError, Scope } from "@aibos/db";
import { 
  createRequestContext, 
  withIdempotency, 
  type IdempotencyResult,
  getAuditService,
  createAuditContext
} from "@aibos/utils";

export const runtime = "nodejs";

function extractUserContext(req: NextRequest): Scope {
  // TODO: Replace with actual JWT parsing from Supabase Auth
  // For D0 spike, we'll mock the user context
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header');
  }

  // Mock user context for D0 - in production this would come from JWT
  return {
    tenantId: req.headers.get('x-tenant-id') || 'tenant-123',
    companyId: req.headers.get('x-company-id') || 'company-456', 
    userId: req.headers.get('x-user-id') || 'user-789',
    userRole: req.headers.get('x-user-role') || 'manager'
  };
}

async function handleJournalPost(req: NextRequest, idempotencyResult: IdempotencyResult): Promise<NextResponse> {
  const auditService = getAuditService();
  let journalResult: any = null;
  
  try {
    // 1. Create request context for tracing and logging
    const context = createRequestContext(req);
    
    // 2. Parse and validate request
    const body = PostJournalReq.parse(await req.json());
    
    // 3. Extract user context (with RLS scope)
    const scope = extractUserContext(req);
    
    // 4. Create audit context
    const auditContext = createAuditContext(
      context.request_id,
      req.ip || req.headers.get('x-forwarded-for') || 'unknown',
      req.headers.get('user-agent') || 'unknown',
      'API'
    );

    // 5. Log idempotency usage if key provided
    if (idempotencyResult.key) {
      await auditService.logIdempotencyUsage(
        scope,
        idempotencyResult.key,
        idempotencyResult.isDuplicate ? 'HIT' : 'CREATE',
        'JOURNAL',
        undefined, // entityId not known yet
        auditContext
      );
    }
    
    // 5. Build posting input
    const postingInput: JournalPostingInput = {
      journalNumber: body.journalNumber,
      description: body.description,
      journalDate: new Date(body.journalDate),
      currency: body.currency,
      lines: body.lines,
      context: {
        tenantId: scope.tenantId,
        companyId: scope.companyId,
        userId: scope.userId,
        userRole: scope.userRole
      }
    };

    // 6. Validate posting rules (SoD, balance, etc.)
    const validation = await postJournal(postingInput);
    
    // 7. Log SoD compliance check
    await auditService.logSoDCompliance(
      scope,
      'journal:post',
      validation.requiresApproval ? 'REQUIRES_APPROVAL' : 'ALLOWED',
      validation.requiresApproval ? `Requires approval from: ${validation.approverRoles?.join(', ')}` : undefined,
      auditContext
    );

    // 8. Log COA validation results
    if (validation.coaWarnings && validation.coaWarnings.length > 0) {
      await auditService.logCOAValidation(
        scope,
        body.lines.map(line => line.accountId),
        'SUCCESS',
        validation.coaWarnings.map(w => ({ accountId: w.accountId, warning: w.warning })),
        [],
        auditContext
      );
    }
    
    // 9. Determine journal status based on approval requirements
    // Database constraint allows: 'draft', 'posted', 'reversed'
    const status = validation.requiresApproval ? 'draft' : 'posted';
    
    // 10. Insert journal into database with RLS enforcement
    journalResult = await insertJournal(scope, {
      journalNumber: body.journalNumber,
      description: body.description,
      journalDate: new Date(body.journalDate),
      currency: body.currency,
      status,
      lines: body.lines,
      idempotencyKey: body.idempotencyKey
    });

    // 11. Log successful journal creation
    await auditService.logJournalPosting(
      scope,
      journalResult.id,
      {
        journalNumber: body.journalNumber,
        description: body.description,
        journalDate: body.journalDate,
        currency: body.currency,
        status,
        lines: body.lines,
        totalDebit: validation.totalDebit,
        totalCredit: validation.totalCredit,
        requiresApproval: validation.requiresApproval,
        approverRoles: validation.approverRoles,
        idempotencyKey: body.idempotencyKey
      },
      status === 'posted' ? 'POST' : 'CREATE',
      auditContext
    );
    
    // 12. Build and return success response
    const response = PostJournalRes.parse({
      id: journalResult.id,
      journalNumber: body.journalNumber,
      status,
      postedAt: status === 'posted' ? new Date().toISOString() : null,
      requiresApproval: validation.requiresApproval,
      approverRoles: validation.approverRoles,
      totalDebit: validation.totalDebit,
      totalCredit: validation.totalCredit
    });

    return NextResponse.json(response, { 
      status: status === 'posted' ? 201 : 202,
      headers: {
        'X-Request-ID': context.request_id,
        'X-Journal-Status': status,
        'X-Journal-ID': journalResult.id
      }
    });

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

      // Log the error based on type
      if (error instanceof PostingError) {
        await auditService.logOperation({
          scope,
          action: 'CREATE',
          entityType: 'JOURNAL',
          entityId: 'failed',
          metadata: {
            operation: 'journal_posting_error',
            errorType: 'PostingError',
            errorCode: error.code,
            errorMessage: error.message,
            errorDetails: error.details,
            journalNumber: req.body ? JSON.parse(await req.text()).journalNumber : 'unknown'
          },
          context: auditContext
        });
      }
    } catch (auditError) {
      // Don't fail the main error handling due to audit logging issues
      console.error('Audit logging failed during error handling:', auditError);
    }

    // Handle different error types with appropriate responses
    if (error instanceof PostingError) {
      const errorResponse = PostingErrorRes.parse({
        error: {
          code: error.code,
          message: error.message,
          details: error.details
        }
      });
      
      return NextResponse.json(errorResponse, { 
        status: 400,
        headers: { 'X-Error-Type': 'POSTING_ERROR' }
      });
    }
    
    // Handle database errors
    if (error instanceof DatabaseError) {
      const errorResponse = PostingErrorRes.parse({
        error: {
          code: error.code,
          message: error.message,
          details: { operation: 'journal_insertion' }
        }
      });
      
      return NextResponse.json(errorResponse, { 
        status: error.code === 'DUPLICATE_KEY' ? 409 : 500,
        headers: { 'X-Error-Type': 'DATABASE_ERROR' }
      });
    }

    // Handle validation errors from Zod
    if (error instanceof Error && error.name === 'ZodError') {
      const errorResponse = PostingErrorRes.parse({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: { zodError: error.message }
        }
      });
      
      return NextResponse.json(errorResponse, { 
        status: 400,
        headers: { 'X-Error-Type': 'VALIDATION_ERROR' }
      });
    }

    // Generic error handler
    console.error('Unexpected error in journal posting:', error);
    
    const errorResponse = PostingErrorRes.parse({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        details: { message: String(error) }
      }
    });
    
    return NextResponse.json(errorResponse, { 
      status: 500,
      headers: { 'X-Error-Type': 'INTERNAL_ERROR' }
    });
  }
}

// Export POST handler with idempotency middleware
export const POST = withIdempotency(handleJournalPost, {
  required: false, // Idempotency key is optional
  ttlSeconds: 24 * 60 * 60 // 24 hours
});
