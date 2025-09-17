// @ts-nocheck
// Company Settings API - Manage default GL accounts and company configuration
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createRequestContext, extractUserContext } from "@aibos/utils";
import { getAuditService } from "@aibos/utils";
import { createAuditContext } from "@aibos/utils/audit/service";
import { z } from "zod";

// Company settings update schema
const UpdateCompanySettingsSchema = z.object({
    defaultArAccountId: z.string().uuid().optional(),
    defaultApAccountId: z.string().uuid().optional(),
    defaultBankAccountId: z.string().uuid().optional(),
    defaultCashAccountId: z.string().uuid().optional(),
    defaultTaxAccountId: z.string().uuid().optional(),
    autoPostInvoices: z.boolean().optional(),
    requireApprovalForPosting: z.boolean().optional(),
});

/**
 * GET /api/company-settings - Get company settings
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

        // Create Supabase client
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Get company settings
        const { data: settings, error: settingsError } = await supabase
            .from("company_settings")
            .select(`
        *,
        default_ar_account:chart_of_accounts!default_ar_account_id(id, code, name, account_type),
        default_ap_account:chart_of_accounts!default_ap_account_id(id, code, name, account_type),
        default_bank_account:chart_of_accounts!default_bank_account_id(id, code, name, account_type),
        default_cash_account:chart_of_accounts!default_cash_account_id(id, code, name, account_type),
        default_tax_account:chart_of_accounts!default_tax_account_id(id, code, name, account_type)
      `)
            .eq("tenant_id", scope.tenantId)
            .eq("company_id", scope.companyId)
            .single();

        if (settingsError && settingsError.code !== 'PGRST116') {
            throw new Error(`Failed to fetch company settings: ${settingsError.message}`);
        }

        // If no settings exist, return defaults
        if (!settings) {
            return NextResponse.json({
                success: true,
                data: {
                    defaultArAccountId: null,
                    defaultApAccountId: null,
                    defaultBankAccountId: null,
                    defaultCashAccountId: null,
                    defaultTaxAccountId: null,
                    autoPostInvoices: false,
                    requireApprovalForPosting: true,
                },
            });
        }

        return NextResponse.json({
            success: true,
            data: {
                defaultArAccountId: settings.default_ar_account_id,
                defaultApAccountId: settings.default_ap_account_id,
                defaultBankAccountId: settings.default_bank_account_id,
                defaultCashAccountId: settings.default_cash_account_id,
                defaultTaxAccountId: settings.default_tax_account_id,
                autoPostInvoices: settings.auto_post_invoices,
                requireApprovalForPosting: settings.require_approval_for_posting,
                // Include account details for reference
                accounts: {
                    ar: settings.default_ar_account,
                    ap: settings.default_ap_account,
                    bank: settings.default_bank_account,
                    cash: settings.default_cash_account,
                    tax: settings.default_tax_account,
                },
            },
        });
    } catch (error) {
        console.error("[Company Settings GET] Error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch company settings" },
            { status: 500 },
        );
    }
}

/**
 * POST /api/company-settings - Update company settings
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
    const auditService = getAuditService();

    try {
        const context = createRequestContext(req);
        const body = UpdateCompanySettingsSchema.parse(await req.json());
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

        // Create Supabase client
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Validate account IDs if provided
        const accountIds = [
            body.defaultArAccountId,
            body.defaultApAccountId,
            body.defaultBankAccountId,
            body.defaultCashAccountId,
            body.defaultTaxAccountId,
        ].filter(Boolean);

        if (accountIds.length > 0) {
            const { data: accounts, error: accountsError } = await supabase
                .from("chart_of_accounts")
                .select("id, code, name, account_type")
                .in("id", accountIds)
                .eq("tenant_id", scope.tenantId)
                .eq("company_id", scope.companyId)
                .eq("is_active", true);

            if (accountsError) {
                throw new Error(`Failed to validate accounts: ${accountsError.message}`);
            }

            if (accounts.length !== accountIds.length) {
                return NextResponse.json(
                    { success: false, error: "One or more account IDs are invalid" },
                    { status: 400 },
                );
            }
        }

        // Update or create company settings
        const { data: settings, error: upsertError } = await supabase
            .from("company_settings")
            .upsert({
                tenant_id: scope.tenantId,
                company_id: scope.companyId,
                default_ar_account_id: body.defaultArAccountId,
                default_ap_account_id: body.defaultApAccountId,
                default_bank_account_id: body.defaultBankAccountId,
                default_cash_account_id: body.defaultCashAccountId,
                default_tax_account_id: body.defaultTaxAccountId,
                auto_post_invoices: body.autoPostInvoices,
                require_approval_for_posting: body.requireApprovalForPosting,
                updated_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (upsertError) {
            throw new Error(`Failed to update company settings: ${upsertError.message}`);
        }

        // Audit log
        await auditService.logOperation({
            scope,
            action: "UPDATE",
            entityType: "COMPANY",
            entityId: settings.id,
            newValues: body,
            context: auditContext,
        });

        return NextResponse.json({
            success: true,
            data: settings,
            message: "Company settings updated successfully",
        });
    } catch (error) {
        console.error("[Company Settings POST] Error:", error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { success: false, error: "Invalid request data", details: error.errors },
                { status: 400 },
            );
        }

        return NextResponse.json(
            { success: false, error: "Failed to update company settings" },
            { status: 500 },
        );
    }
}
