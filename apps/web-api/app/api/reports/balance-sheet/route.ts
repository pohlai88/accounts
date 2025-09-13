// D4 Balance Sheet API Route - V1 Compliant Implementation
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateBalanceSheet } from '@aibos/accounting/src/reports/balance-sheet';
import { createClient } from '@supabase/supabase-js';
import { processIdempotencyKey } from '@aibos/utils/middleware/idempotency';
import { getV1AuditService, createV1AuditContext, createV1RequestContext, extractV1UserContext } from '@aibos/utils';
import { checkSoDCompliance } from '@aibos/auth/src/sod';

// Request schema validation (V1 requirement: Zod for all IO)
const BalanceSheetRequestSchema = z.object({
    tenantId: z.string().uuid(),
    companyId: z.string().uuid(),
    asOfDate: z.string().datetime(),
    comparativePeriod: z.string().datetime().optional(),
    includeZeroBalances: z.boolean().optional().default(false),
    currency: z.string().length(3).optional().default('MYR'),
    reportFormat: z.enum(['STANDARD', 'COMPARATIVE', 'CONSOLIDATED']).optional().default('STANDARD')
});

export type TBalanceSheetRequest = z.infer<typeof BalanceSheetRequestSchema>;

/**
 * GET /api/reports/balance-sheet
 * Generate Balance Sheet report with full V1 compliance
 */
export async function GET(request: NextRequest) {
    const auditService = getV1AuditService();
    let reportResult: any = null;

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
        const input = BalanceSheetRequestSchema.parse({
            tenantId: queryParams.tenantId,
            companyId: queryParams.companyId,
            asOfDate: queryParams.asOfDate,
            comparativePeriod: queryParams.comparativePeriod,
            includeZeroBalances: queryParams.includeZeroBalances === 'true',
            currency: queryParams.currency || 'MYR',
            reportFormat: queryParams.reportFormat || 'STANDARD'
        });

        // 5. Validate SoD compliance (V1 requirement)
        const sodCheck = checkSoDCompliance('report:generate', userContext.userRole || 'user');
        if (!sodCheck.allowed) {
            await auditService.logSecurityViolation(
                createV1AuditContext(request),
                'BALANCE_SHEET_ACCESS_DENIED',
                { reason: sodCheck.reason, userRole: userContext.userRole || 'user' }
            );

            return NextResponse.json({
                success: false,
                error: `Access denied: ${sodCheck.reason}`,
                code: 'SOD_VIOLATION'
            }, { status: 403 });
        }

        // 6. Create Supabase client with proper connection pooling
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // 7. Generate balance sheet
        const startTime = Date.now();
        reportResult = await generateBalanceSheet({
            ...input,
            asOfDate: new Date(input.asOfDate),
            comparativePeriod: input.comparativePeriod ? new Date(input.comparativePeriod) : undefined
        }, supabase as any);

        if (!reportResult.success) {
            // Log failed report generation (V1 audit requirement)
            await auditService.logReportGeneration(
                createV1AuditContext(request),
                'BALANCE_SHEET',
                input,
                {
                    success: false,
                    error: reportResult.error,
                    generationTime: Date.now() - startTime
                }
            );

            return NextResponse.json({
                success: false,
                error: reportResult.error,
                code: reportResult.code
            }, { status: 400 });
        }

        // 8. Log successful report generation (V1 audit requirement)
        await auditService.logReportGeneration(
            createV1AuditContext(request),
            'BALANCE_SHEET',
            input,
            {
                success: true,
                totalAssets: reportResult.totals.totalAssets,
                totalLiabilities: reportResult.totals.totalLiabilities,
                totalEquity: reportResult.totals.totalEquity,
                isBalanced: reportResult.isBalanced,
                generationTime: Date.now() - startTime,
                currency: reportResult.currency,
                reportFormat: input.reportFormat
            }
        );

        // 9. Return successful response
        return NextResponse.json({
            success: true,
            data: {
                ...reportResult,
                asOfDate: reportResult.asOfDate.toISOString(),
                comparativeAsOfDate: reportResult.comparativeAsOfDate?.toISOString(),
                generatedAt: reportResult.generatedAt.toISOString()
            }
        });

    } catch (error) {
        console.error('Balance Sheet API Error:', error);

        // Log error for audit trail
        await auditService.logError(
            createV1AuditContext(request),
            'BALANCE_SHEET_ERROR',
            {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                reportResult: reportResult ? { success: reportResult.success } : null
            }
        );

        if (error instanceof z.ZodError) {
            return NextResponse.json({
                success: false,
                error: 'Invalid request parameters',
                code: 'VALIDATION_ERROR',
                details: error.issues
            }, { status: 400 });
        }

        return NextResponse.json({
            success: false,
            error: 'Internal server error',
            code: 'INTERNAL_ERROR'
        }, { status: 500 });
    }
}

/**
 * POST /api/reports/balance-sheet
 * Generate Balance Sheet report with complex parameters (V1 compliant)
 */
export async function POST(request: NextRequest) {
    const auditService = getV1AuditService();
    let reportResult: any = null;

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
        const input = BalanceSheetRequestSchema.parse(body);

        // 5. Validate SoD compliance (V1 requirement)
        const sodCheck = checkSoDCompliance('report:generate', userContext.userRole || 'user');
        if (!sodCheck.allowed) {
            await auditService.logSecurityViolation(
                createV1AuditContext(request),
                'BALANCE_SHEET_ACCESS_DENIED',
                { reason: sodCheck.reason, userRole: userContext.userRole || 'user' }
            );

            return NextResponse.json({
                success: false,
                error: `Access denied: ${sodCheck.reason}`,
                code: 'SOD_VIOLATION'
            }, { status: 403 });
        }

        // 6. Create Supabase client
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // 7. Generate balance sheet
        const startTime = Date.now();
        reportResult = await generateBalanceSheet({
            ...input,
            asOfDate: new Date(input.asOfDate),
            comparativePeriod: input.comparativePeriod ? new Date(input.comparativePeriod) : undefined
        }, supabase as any);

        if (!reportResult.success) {
            // Log failed report generation
            await auditService.logReportGeneration(
                createV1AuditContext(request),
                'BALANCE_SHEET',
                input,
                {
                    success: false,
                    error: reportResult.error,
                    generationTime: Date.now() - startTime
                }
            );

            return NextResponse.json({
                success: false,
                error: reportResult.error,
                code: reportResult.code
            }, { status: 400 });
        }

        // 8. Log successful report generation
        await auditService.logReportGeneration(
            createV1AuditContext(request),
            'BALANCE_SHEET',
            input,
            {
                success: true,
                totalAssets: reportResult.totals.totalAssets,
                totalLiabilities: reportResult.totals.totalLiabilities,
                totalEquity: reportResult.totals.totalEquity,
                isBalanced: reportResult.isBalanced,
                generationTime: Date.now() - startTime,
                currency: reportResult.currency,
                reportFormat: input.reportFormat
            }
        );

        // 9. Return successful response
        return NextResponse.json({
            success: true,
            data: {
                ...reportResult,
                asOfDate: reportResult.asOfDate.toISOString(),
                comparativeAsOfDate: reportResult.comparativeAsOfDate?.toISOString(),
                generatedAt: reportResult.generatedAt.toISOString()
            }
        });

    } catch (error) {
        console.error('Balance Sheet API Error:', error);

        // Log error for audit trail
        await auditService.logError(
            createV1AuditContext(request),
            'BALANCE_SHEET_ERROR',
            {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                reportResult: reportResult ? { success: reportResult.success } : null
            }
        );

        if (error instanceof z.ZodError) {
            return NextResponse.json({
                success: false,
                error: 'Invalid request parameters',
                code: 'VALIDATION_ERROR',
                details: error.issues
            }, { status: 400 });
        }

        return NextResponse.json({
            success: false,
            error: 'Internal server error',
            code: 'INTERNAL_ERROR'
        }, { status: 500 });
    }
}
