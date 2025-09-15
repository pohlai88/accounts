// Chart of Accounts API - GET and POST endpoints
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createRequestContext, extractUserContext } from "@aibos/utils";
import { getAuditService } from "@aibos/utils";
import { createAuditContext } from "@aibos/utils/audit/service";
import { z } from "zod";

// Account creation schema
const CreateAccountSchema = z.object({
  accountCode: z.string().min(1),
  accountName: z.string().min(1),
  accountType: z.enum(["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"]),
  parentAccountId: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional().default(true),
  normalBalance: z.enum(["DEBIT", "CREDIT"]),
  isSystemAccount: z.boolean().optional().default(false),
});

// Account with children interface
interface AccountWithChildren {
  id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  parent_account_id?: string;
  description?: string;
  is_active: boolean;
  normal_balance: string;
  is_system_account: boolean;
  children: AccountWithChildren[];
}

/**
 * GET /api/accounts - Get chart of accounts with filtering
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const userContext = extractUserContext(req);
    const scope = {
      tenantId: userContext.tenantId!,
      companyId: userContext.companyId!,
      userId: userContext.userId!,
      userRole: userContext.userRole!,
    };
    const { searchParams } = new globalThis.URL(req.url);

    // Parse query parameters
    const accountType = searchParams.get("accountType");
    const isActive = searchParams.get("isActive");
    const includeInactive = searchParams.get("includeInactive") === "true";

    // Create Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build query
    let query = supabase
      .from("chart_of_accounts")
      .select(
        `
        *,
        parent_account:parent_account_id (
          id,
          account_code,
          account_name
        )
      `,
      )
      .eq("tenant_id", scope.tenantId)
      .eq("company_id", scope.companyId);

    // Apply filters
    if (accountType) {
      query = query.eq("account_type", accountType);
    }
    if (isActive !== null) {
      query = query.eq("is_active", isActive === "true");
    } else if (!includeInactive) {
      query = query.eq("is_active", true);
    }

    const { data: accounts, error } = await query.order("account_code", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch accounts: ${error.message}`);
    }

    // Organize accounts in hierarchical structure
    const accountMap = new Map<string, AccountWithChildren>();
    const rootAccounts: AccountWithChildren[] = [];

    // First pass: create map of all accounts
    accounts?.forEach(account => {
      accountMap.set(account.id, {
        ...account,
        children: [],
      } as AccountWithChildren);
    });

    // Second pass: build hierarchy
    accounts?.forEach(account => {
      if (account.parent_account_id) {
        const parent = accountMap.get(account.parent_account_id);
        const child = accountMap.get(account.id);
        if (parent && child) {
          parent.children.push(child);
        }
      } else {
        const rootAccount = accountMap.get(account.id);
        if (rootAccount) {
          rootAccounts.push(rootAccount);
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: rootAccounts,
    });
  } catch (error) {
    console.error("Failed to fetch accounts:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch accounts" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/accounts - Create new account
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const auditService = getAuditService();

  try {
    const context = createRequestContext(req);
    const body = CreateAccountSchema.parse(await req.json());
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

    // Check if account code already exists
    const { data: existingAccount } = await supabase
      .from("chart_of_accounts")
      .select("id")
      .eq("account_code", body.accountCode)
      .eq("tenant_id", scope.tenantId)
      .eq("company_id", scope.companyId)
      .single();

    if (existingAccount) {
      return NextResponse.json(
        { success: false, error: "Account code already exists" },
        { status: 409 },
      );
    }

    // Validate parent account if provided
    if (body.parentAccountId) {
      const { data: parentAccount } = await supabase
        .from("chart_of_accounts")
        .select("id, account_type")
        .eq("id", body.parentAccountId)
        .eq("tenant_id", scope.tenantId)
        .eq("company_id", scope.companyId)
        .single();

      if (!parentAccount) {
        return NextResponse.json(
          { success: false, error: "Parent account not found" },
          { status: 404 },
        );
      }

      // Validate that parent account type is compatible
      const validParentTypes = {
        ASSET: ["ASSET"],
        LIABILITY: ["LIABILITY"],
        EQUITY: ["EQUITY"],
        REVENUE: ["REVENUE"],
        EXPENSE: ["EXPENSE"],
      };

      if (!validParentTypes[body.accountType]?.includes(parentAccount.account_type)) {
        return NextResponse.json(
          { success: false, error: "Invalid parent account type for this account type" },
          { status: 400 },
        );
      }
    }

    // Create account
    const { data: account, error } = await supabase
      .from("chart_of_accounts")
      .insert({
        tenant_id: scope.tenantId,
        company_id: scope.companyId,
        account_code: body.accountCode,
        account_name: body.accountName,
        account_type: body.accountType,
        parent_account_id: body.parentAccountId,
        description: body.description,
        is_active: body.isActive,
        normal_balance: body.normalBalance,
        is_system_account: body.isSystemAccount,
        created_by: scope.userId,
      })
      .select(
        `
        *,
        parent_account:parent_account_id (
          id,
          account_code,
          account_name
        )
      `,
      )
      .single();

    if (error) {
      throw new Error(`Failed to create account: ${error.message}`);
    }

    // Log successful account creation
    await auditService.logOperation({
      scope,
      action: "CREATE",
      entityType: "ACCOUNT",
      entityId: account.id,
      metadata: {
        accountCode: account.account_code,
        accountName: account.account_name,
        accountType: account.account_type,
        parentAccountId: account.parent_account_id,
      },
      context: auditContext,
    });

    return NextResponse.json(
      {
        success: true,
        data: account,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Account creation error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid account data", details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create account" },
      { status: 500 },
    );
  }
}
