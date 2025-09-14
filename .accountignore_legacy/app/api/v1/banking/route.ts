/**
 * REST API Endpoint: Banking & Reconciliation
 * Bank account management, transaction feeds, and reconciliation
 * ERPNext/Odoo Integration Compatible
 */

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { z } from "zod";

// Validation schemas
const bankAccountSchema = z.object({
  account_name: z.string().min(1, "Account name is required"),
  bank_name: z.string().min(1, "Bank name is required"),
  account_number: z.string().min(1, "Account number is required"),
  account_type: z
    .enum(["Checking", "Savings", "Credit Card", "Money Market", "Certificate of Deposit"])
    .default("Checking"),
  currency: z.string().default("USD"),
  company_id: z.string().min(1, "Company is required"),
  is_company_account: z.boolean().default(true),
  is_default: z.boolean().default(false),
  branch_code: z.string().optional(),
  swift_code: z.string().optional(),
  iban: z.string().optional(),
  bank_address: z.string().optional(),
  contact_person: z.string().optional(),
  contact_phone: z.string().optional(),
  contact_email: z.string().email().optional(),
  integration_provider: z
    .enum(["Manual", "Plaid", "Yodlee", "Open Banking", "CSV Import"])
    .default("Manual"),
  auto_reconcile: z.boolean().default(false),
  opening_balance: z.number().default(0),
  current_balance: z.number().default(0),
});

const bankTransactionSchema = z.object({
  bank_account_id: z.string().min(1, "Bank account is required"),
  transaction_date: z.string().min(1, "Transaction date is required"),
  description: z.string().min(1, "Description is required"),
  reference_number: z.string().optional(),
  debit_amount: z.number().min(0).default(0),
  credit_amount: z.number().min(0).default(0),
  running_balance: z.number().optional(),
  transaction_type: z
    .enum(["Deposit", "Withdrawal", "Transfer", "Fee", "Interest", "Other"])
    .default("Other"),
  category: z.string().optional(),
  is_reconciled: z.boolean().default(false),
  matched_payment_entry: z.string().optional(),
  reconciliation_date: z.string().optional(),
});

const reconciliationSchema = z.object({
  bank_account_id: z.string().min(1, "Bank account is required"),
  reconciliation_date: z.string().min(1, "Reconciliation date is required"),
  statement_opening_balance: z.number(),
  statement_closing_balance: z.number(),
  book_opening_balance: z.number(),
  book_closing_balance: z.number(),
  transactions: z.array(bankTransactionSchema).optional(),
});

const querySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val) : 50)),
  offset: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val) : 0)),
  type: z.enum(["accounts", "transactions", "reconciliations"]).default("accounts"),
  company_id: z.string().optional(),
  bank_account_id: z.string().optional(),
  from_date: z.string().optional(),
  to_date: z.string().optional(),
  is_reconciled: z
    .string()
    .optional()
    .transform(val => val === "true"),
  transaction_type: z.string().optional(),
  search: z.string().optional(),
  sort_by: z
    .enum(["transaction_date", "debit_amount", "credit_amount", "account_name"])
    .default("transaction_date"),
  sort_order: z.enum(["asc", "desc"]).default("desc"),
});

/**
 * GET /api/v1/banking
 * Retrieve bank accounts, transactions, or reconciliations
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = querySchema.parse(Object.fromEntries(searchParams));

    let data, error, count;

    switch (params.type) {
      case "accounts":
        ({ data, error, count } = await getBankAccounts(params));
        break;
      case "transactions":
        ({ data, error, count } = await getBankTransactions(params));
        break;
      case "reconciliations":
        ({ data, error, count } = await getReconciliations(params));
        break;
      default:
        return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 });
    }

    if (error) {
      return NextResponse.json(
        { error: `Failed to fetch ${params.type}`, details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      data,
      meta: {
        total: count,
        limit: params.limit,
        offset: params.offset,
        has_more: count ? count > params.offset + params.limit : false,
        type: params.type,
      },
    });
  } catch (error) {
    console.error("GET /api/v1/banking error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/v1/banking
 * Create bank account, import transactions, or perform reconciliation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type } = body;

    switch (type) {
      case "account":
        return await createBankAccount(body);
      case "transactions":
        return await importBankTransactions(body);
      case "reconciliation":
        return await performReconciliation(body);
      default:
        return NextResponse.json(
          { error: 'Invalid type. Must be "account", "transactions", or "reconciliation"' },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("POST /api/v1/banking error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Get bank accounts
 */
async function getBankAccounts(params: any) {
  let query = supabase
    .from("bank_accounts")
    .select(
      `
            id,
            account_name,
            bank_name,
            account_number,
            account_type,
            currency,
            company_id,
            is_company_account,
            is_default,
            branch_code,
            swift_code,
            iban,
            integration_provider,
            auto_reconcile,
            opening_balance,
            current_balance,
            last_reconciliation_date,
            unreconciled_transactions_count,
            created_at,
            modified
        `,
    )
    .range(params.offset, params.offset + params.limit - 1);

  if (params.company_id) {
    query = query.eq("company_id", params.company_id);
  }

  if (params.search) {
    query = query.or(
      `account_name.ilike.%${params.search}%,bank_name.ilike.%${params.search}%,account_number.ilike.%${params.search}%`,
    );
  }

  query = query.order("account_name", { ascending: true });

  return await query;
}

/**
 * Get bank transactions
 */
async function getBankTransactions(params: any) {
  let query = supabase
    .from("bank_transactions")
    .select(
      `
            id,
            bank_account_id,
            bank_account:bank_accounts(account_name, bank_name),
            transaction_date,
            description,
            reference_number,
            debit_amount,
            credit_amount,
            running_balance,
            transaction_type,
            category,
            is_reconciled,
            matched_payment_entry,
            reconciliation_date,
            created_at,
            modified
        `,
    )
    .range(params.offset, params.offset + params.limit - 1);

  if (params.bank_account_id) {
    query = query.eq("bank_account_id", params.bank_account_id);
  }

  if (params.from_date) {
    query = query.gte("transaction_date", params.from_date);
  }

  if (params.to_date) {
    query = query.lte("transaction_date", params.to_date);
  }

  if (params.is_reconciled !== undefined) {
    query = query.eq("is_reconciled", params.is_reconciled);
  }

  if (params.transaction_type) {
    query = query.eq("transaction_type", params.transaction_type);
  }

  if (params.search) {
    query = query.or(
      `description.ilike.%${params.search}%,reference_number.ilike.%${params.search}%`,
    );
  }

  query = query.order(params.sort_by, { ascending: params.sort_order === "asc" });

  return await query;
}

/**
 * Get reconciliations
 */
async function getReconciliations(params: any) {
  let query = supabase
    .from("bank_reconciliations")
    .select(
      `
            id,
            bank_account_id,
            bank_account:bank_accounts(account_name, bank_name),
            reconciliation_date,
            statement_opening_balance,
            statement_closing_balance,
            book_opening_balance,
            book_closing_balance,
            difference_amount,
            status,
            reconciled_transactions_count,
            unreconciled_transactions_count,
            created_at,
            modified
        `,
    )
    .range(params.offset, params.offset + params.limit - 1);

  if (params.bank_account_id) {
    query = query.eq("bank_account_id", params.bank_account_id);
  }

  if (params.from_date) {
    query = query.gte("reconciliation_date", params.from_date);
  }

  if (params.to_date) {
    query = query.lte("reconciliation_date", params.to_date);
  }

  query = query.order("reconciliation_date", { ascending: false });

  return await query;
}

/**
 * Create bank account
 */
async function createBankAccount(body: any) {
  const validatedData = bankAccountSchema.parse(body.data);

  // Check if account number already exists
  const { data: existingAccount } = await supabase
    .from("bank_accounts")
    .select("id")
    .eq("account_number", validatedData.account_number)
    .eq("bank_name", validatedData.bank_name)
    .single();

  if (existingAccount) {
    return NextResponse.json(
      { error: "Bank account with this number already exists" },
      { status: 409 },
    );
  }

  const { data: bankAccount, error } = await supabase
    .from("bank_accounts")
    .insert(validatedData)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to create bank account", details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      data: bankAccount,
      message: "Bank account created successfully",
    },
    { status: 201 },
  );
}

/**
 * Import bank transactions
 */
async function importBankTransactions(body: any) {
  const { bank_account_id, transactions } = body;

  if (!bank_account_id || !transactions || !Array.isArray(transactions)) {
    return NextResponse.json(
      { error: "Bank account ID and transactions array are required" },
      { status: 400 },
    );
  }

  // Validate each transaction
  const validatedTransactions = transactions.map(transaction =>
    bankTransactionSchema.parse({ ...transaction, bank_account_id }),
  );

  const { data, error } = await supabase.rpc("import_bank_transactions", {
    p_bank_account_id: bank_account_id,
    p_transactions: validatedTransactions,
  });

  if (error) {
    return NextResponse.json(
      { error: "Failed to import bank transactions", details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      data: { imported_count: data },
      message: `Successfully imported ${data} transactions`,
    },
    { status: 201 },
  );
}

/**
 * Perform bank reconciliation
 */
async function performReconciliation(body: any) {
  const validatedData = reconciliationSchema.parse(body.data);

  const { data, error } = await supabase.rpc("perform_bank_reconciliation", {
    p_reconciliation_data: validatedData,
  });

  if (error) {
    return NextResponse.json(
      { error: "Failed to perform reconciliation", details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      data,
      message: "Bank reconciliation completed successfully",
    },
    { status: 201 },
  );
}
