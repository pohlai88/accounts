// @ts-nocheck
// Bank Account API - GET and POST endpoints
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createRequestContext, extractUserContext } from "@aibos/utils";
import { getAuditService } from "@aibos/utils";
import { createAuditContext } from "@aibos/utils/audit/service";
import { z } from "zod";

// Bank account creation schema
const CreateBankAccountSchema = z.object({
    accountNumber: z.string().min(1).max(50),
    accountName: z.string().min(1).max(255),
    bankName: z.string().min(1).max(255),
    currency: z.string().length(3).default("MYR"),
    accountType: z.enum(["CHECKING", "SAVINGS", "MONEY_MARKET", "CERTIFICATE_OF_DEPOSIT", "OTHER"]).default("CHECKING"),
    glAccountId: z.string().uuid(),
});

/**
 * GET /api/bank-accounts - Get bank accounts with filtering and pagination
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
        const search = searchParams.get("search");
        const status = searchParams.get("status");
        const currency = searchParams.get("currency");
        const accountType = searchParams.get("accountType");

        // Create Supabase client
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Build query with GL account join
        let query = supabase
            .from("bank_accounts")
            .select(`
        *,
        chart_of_accounts!bank_accounts_gl_account_id_fkey (
          id,
          code,
          name,
          account_type
        )
      `)
            .eq("tenant_id", scope.tenantId)
            .eq("company_id", scope.companyId);

        // Apply filters
        if (search) {
            query = query.or(`account_number.ilike.%${search}%,account_name.ilike.%${search}%,bank_name.ilike.%${search}%`);
        }
        if (status) {
            query = query.eq("is_active", status === "active");
        }
        if (currency) {
            query = query.eq("currency", currency);
        }
        if (accountType) {
            query = query.eq("account_type", accountType);
        }

        // Apply pagination
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const {
            data: bankAccounts,
            error,
            count,
        } = await query.range(from, to).order("created_at", { ascending: false });

        if (error) {
            throw new Error(`Failed to fetch bank accounts: ${error.message}`);
        }

        return NextResponse.json({
            success: true,
            data: bankAccounts || [],
            meta: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit),
            },
        });
    } catch (error) {
        console.error("Failed to fetch bank accounts:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch bank accounts" },
            { status: 500 },
        );
    }
}

/**
 * POST /api/bank-accounts - Create new bank account
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
    const auditService = getAuditService();

    try {
        const context = createRequestContext(req);
        const body = CreateBankAccountSchema.parse(await req.json());
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

        // Verify GL account exists and is an asset account
        const { data: glAccount, error: glAccountError } = await supabase
            .from("chart_of_accounts")
            .select("id, code, name, account_type")
            .eq("id", body.glAccountId)
            .eq("tenant_id", scope.tenantId)
            .eq("company_id", scope.companyId)
            .single();

        if (glAccountError || !glAccount) {
            return NextResponse.json(
                { success: false, error: "GL account not found" },
                { status: 404 },
            );
        }

        if (glAccount.account_type !== "ASSET") {
            return NextResponse.json(
                { success: false, error: "GL account must be an asset account" },
                { status: 400 },
            );
        }

        // Check if bank account with same account number already exists
        const { data: existingBankAccount } = await supabase
            .from("bank_accounts")
            .select("id")
            .eq("account_number", body.accountNumber)
            .eq("tenant_id", scope.tenantId)
            .eq("company_id", scope.companyId)
            .single();

        if (existingBankAccount) {
            return NextResponse.json(
                { success: false, error: "Bank account with this account number already exists" },
                { status: 409 },
            );
        }

        // Create bank account
        const { data: bankAccount, error: bankAccountError } = await supabase
            .from("bank_accounts")
            .insert({
                tenant_id: scope.tenantId,
                company_id: scope.companyId,
                account_number: body.accountNumber,
                account_name: body.accountName,
                bank_name: body.bankName,
                currency: body.currency,
                account_type: body.accountType,
                gl_account_id: body.glAccountId,
                is_active: true,
            })
            .select()
            .single();

        if (bankAccountError) {
            throw new Error(`Failed to create bank account: ${bankAccountError.message}`);
        }

        // Log successful bank account creation
        await auditService.logOperation({
            scope,
            action: "CREATE",
            entityType: "COMPANY",
            entityId: bankAccount.id,
            metadata: {
                accountNumber: bankAccount.account_number,
                accountName: bankAccount.account_name,
                bankName: bankAccount.bank_name,
                currency: bankAccount.currency,
                accountType: bankAccount.account_type,
                glAccountId: body.glAccountId,
                glAccountCode: glAccount.code,
            },
            context: auditContext,
        });

        return NextResponse.json(
            {
                success: true,
                data: {
                    ...bankAccount,
                    glAccount: glAccount,
                },
            },
            { status: 201 },
        );
    } catch (error) {
        console.error("Bank account creation error:", error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { success: false, error: "Invalid bank account data", details: error.issues },
                { status: 400 },
            );
        }

        return NextResponse.json(
            { success: false, error: "Failed to create bank account" },
            { status: 500 },
        );
    }
}
