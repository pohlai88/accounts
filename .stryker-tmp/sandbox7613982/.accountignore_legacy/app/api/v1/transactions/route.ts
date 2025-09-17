/**
 * Enhanced Transactions API with ERPNext Business Logic
 * Implements sophisticated accounting patterns
 */
// @ts-nocheck


import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ERPNextAccountingEngine, type ERPNextGLEntry } from "@/lib/erpnext-accounting-engine";

// Validation schemas
const salesInvoiceSchema = z.object({
  customer_name: z.string().min(1, "Customer name is required"),
  invoice_amount: z.number().positive("Invoice amount must be positive"),
  receivable_account_id: z.string().uuid("Valid receivable account ID required"),
  revenue_account_id: z.string().uuid("Valid revenue account ID required"),
  posting_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .optional(),
  company_id: z.string().uuid("Valid company ID required"),
  cost_center_id: z.string().uuid().optional(),
  project_id: z.string().uuid().optional(),
  remarks: z.string().optional(),
});

const paymentEntrySchema = z.object({
  customer_name: z.string().min(1, "Customer name is required"),
  payment_amount: z.number().positive("Payment amount must be positive"),
  bank_account_id: z.string().uuid("Valid bank account ID required"),
  receivable_account_id: z.string().uuid("Valid receivable account ID required"),
  posting_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  company_id: z.string().uuid("Valid company ID required"),
  against_invoice: z.string().optional(),
  cost_center_id: z.string().uuid().optional(),
  project_id: z.string().uuid().optional(),
  remarks: z.string().optional(),
});

const journalEntrySchema = z.object({
  entries: z
    .array(
      z.object({
        account_id: z.string().uuid("Valid account ID required"),
        debit: z.number().min(0, "Debit must be non-negative"),
        credit: z.number().min(0, "Credit must be non-negative"),
        party_type: z.string().optional(),
        party: z.string().optional(),
        remarks: z.string().optional(),
      }),
    )
    .min(2, "At least 2 entries required"),
  posting_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  company_id: z.string().uuid("Valid company ID required"),
  voucher_no: z.string().optional(),
  cost_center_id: z.string().uuid().optional(),
  project_id: z.string().uuid().optional(),
});

const reversalSchema = z.object({
  voucher_type: z.string().min(1, "Voucher type is required"),
  voucher_no: z.string().min(1, "Voucher number is required"),
  company_id: z.string().uuid("Valid company ID required"),
  reversal_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  remarks: z.string().optional(),
});

/**
 * POST /api/v1/transactions
 * Create various types of accounting transactions
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const transactionType = searchParams.get("type");

    if (!transactionType) {
      return NextResponse.json(
        {
          error:
            "Transaction type is required. Use ?type=sales_invoice|payment_entry|journal_entry",
        },
        { status: 400 },
      );
    }

    const body = await request.json();

    switch (transactionType) {
      case "sales_invoice":
        return await handleSalesInvoice(body);
      case "payment_entry":
        return await handlePaymentEntry(body);
      case "journal_entry":
        return await handleJournalEntry(body);
      case "reversal":
        return await handleReversal(body);
      default:
        return NextResponse.json({ error: "Invalid transaction type" }, { status: 400 });
    }
  } catch (error) {
    console.error("POST /api/v1/transactions error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Handle Sales Invoice Creation
 */
async function handleSalesInvoice(data: any) {
  const validatedData = salesInvoiceSchema.parse(data);

  // Generate voucher number
  const voucherNo = ERPNextAccountingEngine.generateVoucherNo("Sales Invoice");

  // Create GL entries using ERPNext pattern
  const glEntries = ERPNextAccountingEngine.createSalesInvoiceEntries(
    validatedData.invoice_amount,
    validatedData.receivable_account_id,
    validatedData.revenue_account_id,
    voucherNo,
    validatedData.posting_date,
    validatedData.company_id,
    {
      customerName: validatedData.customer_name,
      dueDate: validatedData.due_date,
      costCenterId: validatedData.cost_center_id,
      projectId: validatedData.project_id,
    },
  );

  // Add remarks if provided
  if (validatedData.remarks) {
    glEntries.forEach(entry => {
      entry.remarks = validatedData.remarks;
    });
  }

  // Create entries with full ERPNext validation
  const result = await ERPNextAccountingEngine.createGLEntries(glEntries, {
    validateBalance: true,
    createPaymentLedger: true,
    validatePeriod: true,
    validateAccounts: true,
  });

  if (!result.success) {
    return NextResponse.json(
      { error: "Sales invoice creation failed", details: result.errors },
      { status: 400 },
    );
  }

  return NextResponse.json(
    {
      success: true,
      message: "Sales invoice created successfully",
      data: {
        voucher_no: voucherNo,
        voucher_type: "Sales Invoice",
        amount: validatedData.invoice_amount,
        customer: validatedData.customer_name,
        gl_entries: result.data,
      },
    },
    { status: 201 },
  );
}

/**
 * Handle Payment Entry Creation
 */
async function handlePaymentEntry(data: any) {
  const validatedData = paymentEntrySchema.parse(data);

  // Generate voucher number
  const voucherNo = ERPNextAccountingEngine.generateVoucherNo("Payment Entry");

  // Create GL entries using ERPNext pattern
  const glEntries = ERPNextAccountingEngine.createPaymentEntries(
    validatedData.payment_amount,
    validatedData.bank_account_id,
    validatedData.receivable_account_id,
    voucherNo,
    validatedData.posting_date,
    validatedData.company_id,
    {
      customerName: validatedData.customer_name,
      againstInvoice: validatedData.against_invoice,
      costCenterId: validatedData.cost_center_id,
      projectId: validatedData.project_id,
    },
  );

  // Add remarks if provided
  if (validatedData.remarks) {
    glEntries.forEach(entry => {
      entry.remarks = validatedData.remarks;
    });
  }

  // Create entries with full ERPNext validation
  const result = await ERPNextAccountingEngine.createGLEntries(glEntries, {
    validateBalance: true,
    createPaymentLedger: true,
    validatePeriod: true,
    validateAccounts: true,
  });

  if (!result.success) {
    return NextResponse.json(
      { error: "Payment entry creation failed", details: result.errors },
      { status: 400 },
    );
  }

  return NextResponse.json(
    {
      success: true,
      message: "Payment entry created successfully",
      data: {
        voucher_no: voucherNo,
        voucher_type: "Payment Entry",
        amount: validatedData.payment_amount,
        customer: validatedData.customer_name,
        against_invoice: validatedData.against_invoice,
        gl_entries: result.data,
      },
    },
    { status: 201 },
  );
}

/**
 * Handle Journal Entry Creation
 */
async function handleJournalEntry(data: any) {
  const validatedData = journalEntrySchema.parse(data);

  // Generate voucher number if not provided
  const voucherNo =
    validatedData.voucher_no || ERPNextAccountingEngine.generateVoucherNo("Journal Entry");

  // Convert to ERPNext GL entries
  const glEntries: ERPNextGLEntry[] = validatedData.entries.map(entry => ({
    account_id: entry.account_id,
    debit: entry.debit,
    credit: entry.credit,
    posting_date: validatedData.posting_date,
    voucher_type: "Journal Entry",
    voucher_no: voucherNo,
    party_type: entry.party_type,
    party: entry.party,
    remarks: entry.remarks,
    company_id: validatedData.company_id,
    cost_center_id: validatedData.cost_center_id,
    project_id: validatedData.project_id,
    docstatus: 1,
    is_advance: false,
    is_cancelled: false,
    finance_book: "Default",
  }));

  // Create entries with full ERPNext validation
  const result = await ERPNextAccountingEngine.createGLEntries(glEntries, {
    validateBalance: true,
    createPaymentLedger: false, // Journal entries don't create payment ledger
    validatePeriod: true,
    validateAccounts: true,
  });

  if (!result.success) {
    return NextResponse.json(
      { error: "Journal entry creation failed", details: result.errors },
      { status: 400 },
    );
  }

  return NextResponse.json(
    {
      success: true,
      message: "Journal entry created successfully",
      data: {
        voucher_no: voucherNo,
        voucher_type: "Journal Entry",
        entries_count: glEntries.length,
        gl_entries: result.data,
      },
    },
    { status: 201 },
  );
}

/**
 * Handle Transaction Reversal
 */
async function handleReversal(data: any) {
  const validatedData = reversalSchema.parse(data);

  // Create reversal entries using ERPNext pattern
  const result = await ERPNextAccountingEngine.reverseGLEntries(
    validatedData.voucher_type,
    validatedData.voucher_no,
    validatedData.company_id,
    validatedData.reversal_date,
    validatedData.remarks,
  );

  if (!result.success) {
    return NextResponse.json(
      { error: "Transaction reversal failed", details: result.errors },
      { status: 400 },
    );
  }

  return NextResponse.json(
    {
      success: true,
      message: "Transaction reversed successfully",
      data: {
        original_voucher: `${validatedData.voucher_type} ${validatedData.voucher_no}`,
        reversal_date: validatedData.reversal_date,
        reversal_entries: result.data,
      },
    },
    { status: 201 },
  );
}

/**
 * GET /api/v1/transactions
 * Get transaction history and balances
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    switch (action) {
      case "balance":
        return await getAccountBalance(searchParams);
      default:
        return NextResponse.json({ error: "Invalid action. Use ?action=balance" }, { status: 400 });
    }
  } catch (error) {
    console.error("GET /api/v1/transactions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Get Account Balance
 */
async function getAccountBalance(searchParams: URLSearchParams) {
  const accountId = searchParams.get("account_id");
  const asOfDate = searchParams.get("as_of_date");
  const companyId = searchParams.get("company_id");

  if (!accountId) {
    return NextResponse.json({ error: "account_id parameter is required" }, { status: 400 });
  }

  const balance = await ERPNextAccountingEngine.getAccountBalance(
    accountId,
    asOfDate || undefined,
    companyId || undefined,
  );

  return NextResponse.json({
    success: true,
    data: {
      account_id: accountId,
      as_of_date: asOfDate || new Date().toISOString().split("T")[0],
      balance: balance.balance,
      debit_total: balance.debitTotal,
      credit_total: balance.creditTotal,
    },
  });
}
