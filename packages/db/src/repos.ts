import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import {
  journals,
  journalLines,
  idempotencyKeys,
  chartOfAccounts,
  customers,
  invoices,
  invoiceLines,
  taxCodes,
} from "./schema.js";
import { eq, and, inArray, desc, asc, gte, lte, count } from "drizzle-orm";

let _db: ReturnType<typeof drizzle> | null = null;

function getDb() {
  if (!_db) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is required");
    }
    const pool = new Pool({ connectionString });
    _db = drizzle(pool);
  }
  return _db;
}

export interface Scope {
  tenantId: string;
  companyId: string;
  userId: string;
  userRole: string;
}

export interface JournalInput {
  journalNumber: string;
  description?: string;
  journalDate: Date;
  currency: string;
  lines: Array<{
    accountId: string;
    debit: number;
    credit: number;
    description?: string;
    reference?: string;
  }>;
  status?: "draft" | "posted" | "pending_approval";
  idempotencyKey?: string;
}

export class DatabaseError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "DatabaseError";
  }
}

export async function checkIdempotency(scope: Scope, idempotencyKey: string) {
  const db = getDb();
  const existing = await db
    .select()
    .from(idempotencyKeys)
    .where(
      and(eq(idempotencyKeys.tenantId, scope.tenantId), eq(idempotencyKeys.key, idempotencyKey)),
    )
    .limit(1);

  return existing[0] || null;
}

export async function insertJournal(scope: Scope, input: JournalInput) {
  // NOTE: RLS is enforced at DB level using tenant_id/company_id + JWT claims.

  // 1. Check idempotency if key provided
  if (input.idempotencyKey) {
    const existing = await checkIdempotency(scope, input.idempotencyKey);
    if (existing) {
      throw new DatabaseError("Duplicate request detected", "DUPLICATE_REQUEST", {
        idempotencyKey: input.idempotencyKey,
        existingResult: existing.response,
      });
    }
  }

  const totalDebit = input.lines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredit = input.lines.reduce((sum, line) => sum + line.credit, 0);

  // Validate balanced journal (V1 requirement)
  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new DatabaseError(
      "Journal must be balanced: debits must equal credits",
      "UNBALANCED_JOURNAL",
      { totalDebit, totalCredit, difference: Math.abs(totalDebit - totalCredit) },
    );
  }

  // 2. Check if journal number already exists for this company
  const db = getDb();
  const existingJournal = await db
    .select()
    .from(journals)
    .where(
      and(
        eq(journals.tenantId, scope.tenantId),
        eq(journals.companyId, scope.companyId),
        eq(journals.journalNumber, input.journalNumber),
      ),
    )
    .limit(1);

  if (existingJournal.length > 0) {
    throw new DatabaseError(
      `Journal number '${input.journalNumber}' already exists`,
      "DUPLICATE_JOURNAL_NUMBER",
      { journalNumber: input.journalNumber },
    );
  }

  // 3. Insert journal entry
  const j = await db
    .insert(journals)
    .values({
      tenantId: scope.tenantId,
      companyId: scope.companyId,
      journalNumber: input.journalNumber,
      description: input.description,
      journalDate: input.journalDate,
      currency: input.currency,
      totalDebit: totalDebit.toString(),
      totalCredit: totalCredit.toString(),
      status: input.status || "draft",
      createdBy: scope.userId,
      postedAt: input.status === "posted" ? new Date() : null,
    })
    .returning({ id: journals.id });

  const jid = j[0]?.id;
  if (!jid) {
    throw new DatabaseError("Failed to create journal entry", "INSERT_FAILED");
  }

  // 4. Insert journal lines
  for (const [index, line] of input.lines.entries()) {
    try {
      await db.insert(journalLines).values({
        journalId: jid,
        accountId: line.accountId,
        debit: line.debit.toString(),
        credit: line.credit.toString(),
        description: line.description,
        reference: line.reference,
      });
    } catch (error) {
      throw new DatabaseError(`Failed to insert journal line ${index + 1}`, "LINE_INSERT_FAILED", {
        lineIndex: index,
        accountId: line.accountId,
        error: String(error),
      });
    }
  }

  // 5. Store idempotency key if provided
  if (input.idempotencyKey) {
    await db.insert(idempotencyKeys).values({
      tenantId: scope.tenantId,
      key: input.idempotencyKey,
      requestHash: input.idempotencyKey, // Use the key as hash for simplicity in D0
      response: { id: jid, journalNumber: input.journalNumber },
      status: "completed",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });
  }

  return {
    id: jid,
    journalNumber: input.journalNumber,
    status: input.status || "draft",
    totalDebit,
    totalCredit,
  };
}

export async function getJournal(scope: Scope, journalId: string) {
  const db = getDb();
  const journal = await db
    .select()
    .from(journals)
    .where(
      and(
        eq(journals.id, journalId),
        eq(journals.tenantId, scope.tenantId),
        eq(journals.companyId, scope.companyId),
      ),
    )
    .limit(1);

  if (journal.length === 0) {
    throw new DatabaseError("Journal not found or access denied", "JOURNAL_NOT_FOUND", {
      journalId,
    });
  }

  const lines = await db.select().from(journalLines).where(eq(journalLines.journalId, journalId));

  return {
    ...journal[0],
    lines,
  };
}

// Account Information Interface
export interface AccountInfo {
  id: string;
  code: string;
  name: string;
  accountType: string;
  currency: string;
  isActive: boolean;
  level: number;
  parentId?: string;
}

/**
 * Fetch account information for validation
 */
export async function getAccountsInfo(
  scope: Scope,
  accountIds: string[],
): Promise<Map<string, AccountInfo>> {
  const db = getDb();

  const accounts = await db
    .select({
      id: chartOfAccounts.id,
      code: chartOfAccounts.code,
      name: chartOfAccounts.name,
      accountType: chartOfAccounts.accountType,
      currency: chartOfAccounts.currency,
      isActive: chartOfAccounts.isActive,
      level: chartOfAccounts.level,
      parentId: chartOfAccounts.parentId,
    })
    .from(chartOfAccounts)
    .where(
      and(
        eq(chartOfAccounts.tenantId, scope.tenantId),
        eq(chartOfAccounts.companyId, scope.companyId),
        inArray(chartOfAccounts.id, accountIds),
      ),
    );

  const accountMap = new Map<string, AccountInfo>();

  for (const account of accounts) {
    accountMap.set(account.id, {
      id: account.id,
      code: account.code,
      name: account.name,
      accountType: account.accountType,
      currency: account.currency,
      isActive: account.isActive,
      level: Number(account.level),
      parentId: account.parentId || undefined,
    });
  }

  return accountMap;
}

/**
 * Fetch all accounts for a company (needed for control account validation)
 */
export async function getAllAccountsInfo(scope: Scope): Promise<AccountInfo[]> {
  const db = getDb();

  const accounts = await db
    .select({
      id: chartOfAccounts.id,
      code: chartOfAccounts.code,
      name: chartOfAccounts.name,
      accountType: chartOfAccounts.accountType,
      currency: chartOfAccounts.currency,
      isActive: chartOfAccounts.isActive,
      level: chartOfAccounts.level,
      parentId: chartOfAccounts.parentId,
    })
    .from(chartOfAccounts)
    .where(
      and(
        eq(chartOfAccounts.tenantId, scope.tenantId),
        eq(chartOfAccounts.companyId, scope.companyId),
      ),
    );

  return accounts.map(account => ({
    id: account.id,
    code: account.code,
    name: account.name,
    accountType: account.accountType,
    currency: account.currency,
    isActive: account.isActive,
    level: Number(account.level),
    parentId: account.parentId || undefined,
  }));
}

/**
 * Store idempotency result for future checks
 */
export async function storeIdempotencyResult(
  scope: Scope,
  idempotencyKey: string,
  response: Record<string, unknown>,
  status: "processing" | "draft" | "posted" | "failed",
): Promise<void> {
  const db = getDb();

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour TTL

  await db
    .insert(idempotencyKeys)
    .values({
      key: idempotencyKey,
      tenantId: scope.tenantId,
      requestHash: JSON.stringify(response), // Store response as hash for now
      response: response,
      status,
      expiresAt,
    })
    .onConflictDoUpdate({
      target: idempotencyKeys.key,
      set: {
        response: response,
        status,
        expiresAt,
      },
    });
}

// ============================================================================
// AR (Accounts Receivable) Repository Functions - D2 Implementation
// ============================================================================

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface CustomerInput {
  customerNumber: string;
  name: string;
  email?: string;
  phone?: string;
  billingAddress?: Address;
  shippingAddress?: Address;
  currency: string;
  paymentTerms: string;
  creditLimit?: number;
}

export interface InvoiceInput {
  customerId: string;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  currency: string;
  exchangeRate?: number;
  description?: string;
  notes?: string;
  lines: Array<{
    lineNumber: number;
    description: string;
    quantity: number;
    unitPrice: number;
    lineAmount: number;
    taxCode?: string;
    taxRate?: number;
    taxAmount?: number;
    revenueAccountId: string;
  }>;
}

/**
 * Create a new customer
 */
export async function insertCustomer(scope: Scope, input: CustomerInput) {
  const db = getDb();

  // Check if customer number already exists
  const existing = await db
    .select()
    .from(customers)
    .where(
      and(
        eq(customers.tenantId, scope.tenantId),
        eq(customers.companyId, scope.companyId),
        eq(customers.customerNumber, input.customerNumber),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    throw new DatabaseError(
      `Customer number '${input.customerNumber}' already exists`,
      "DUPLICATE_CUSTOMER_NUMBER",
      { customerNumber: input.customerNumber },
    );
  }

  const result = await db
    .insert(customers)
    .values({
      tenantId: scope.tenantId,
      companyId: scope.companyId,
      customerNumber: input.customerNumber,
      name: input.name,
      email: input.email,
      phone: input.phone,
      billingAddress: input.billingAddress,
      shippingAddress: input.shippingAddress,
      currency: input.currency,
      paymentTerms: input.paymentTerms,
      creditLimit: input.creditLimit?.toString() || "0",
    })
    .returning({
      id: customers.id,
      customerNumber: customers.customerNumber,
      name: customers.name,
      currency: customers.currency,
      paymentTerms: customers.paymentTerms,
      creditLimit: customers.creditLimit,
      createdAt: customers.createdAt,
    });

  return result[0];
}

/**
 * Get customer by ID
 */
export async function getCustomer(scope: Scope, customerId: string) {
  const db = getDb();

  const result = await db
    .select()
    .from(customers)
    .where(
      and(
        eq(customers.id, customerId),
        eq(customers.tenantId, scope.tenantId),
        eq(customers.companyId, scope.companyId),
      ),
    )
    .limit(1);

  if (result.length === 0) {
    throw new DatabaseError("Customer not found or access denied", "CUSTOMER_NOT_FOUND", {
      customerId,
    });
  }

  return result[0];
}

/**
 * Get tax code information by code
 */
export async function getTaxCode(scope: Scope, taxCodeString: string) {
  const db = getDb();

  const result = await db
    .select({
      id: taxCodes.id,
      code: taxCodes.code,
      name: taxCodes.name,
      rate: taxCodes.rate,
      taxType: taxCodes.taxType,
      taxAccountId: taxCodes.taxAccountId,
      isActive: taxCodes.isActive,
    })
    .from(taxCodes)
    .where(
      and(
        eq(taxCodes.tenantId, scope.tenantId),
        eq(taxCodes.companyId, scope.companyId),
        eq(taxCodes.code, taxCodeString),
        eq(taxCodes.isActive, true),
      ),
    )
    .limit(1);

  if (result.length === 0) {
    throw new DatabaseError(`Tax code not found: ${taxCodeString}`, "TAX_CODE_NOT_FOUND", {
      taxCode: taxCodeString,
    });
  }

  return result[0];
}

/**
 * Get multiple tax codes by their codes
 */
export async function getTaxCodes(scope: Scope, taxCodeStrings: string[]) {
  if (taxCodeStrings.length === 0) {
    return [];
  }

  const db = getDb();

  const result = await db
    .select({
      id: taxCodes.id,
      code: taxCodes.code,
      name: taxCodes.name,
      rate: taxCodes.rate,
      taxType: taxCodes.taxType,
      taxAccountId: taxCodes.taxAccountId,
      isActive: taxCodes.isActive,
    })
    .from(taxCodes)
    .where(
      and(
        eq(taxCodes.tenantId, scope.tenantId),
        eq(taxCodes.companyId, scope.companyId),
        inArray(taxCodes.code, taxCodeStrings),
        eq(taxCodes.isActive, true),
      ),
    );

  return result;
}

/**
 * Create a new invoice
 */
export async function insertInvoice(scope: Scope, input: InvoiceInput) {
  const db = getDb();

  // Check if invoice number already exists
  const existing = await db
    .select()
    .from(invoices)
    .where(
      and(
        eq(invoices.tenantId, scope.tenantId),
        eq(invoices.companyId, scope.companyId),
        eq(invoices.invoiceNumber, input.invoiceNumber),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    throw new DatabaseError(
      `Invoice number '${input.invoiceNumber}' already exists`,
      "DUPLICATE_INVOICE_NUMBER",
      { invoiceNumber: input.invoiceNumber },
    );
  }

  // Calculate totals
  const subtotal = input.lines.reduce((sum, line) => sum + line.lineAmount, 0);
  const taxAmount = input.lines.reduce((sum, line) => sum + (line.taxAmount || 0), 0);
  const totalAmount = subtotal + taxAmount;

  // Insert invoice
  const invoiceResult = await db
    .insert(invoices)
    .values({
      tenantId: scope.tenantId,
      companyId: scope.companyId,
      customerId: input.customerId,
      invoiceNumber: input.invoiceNumber,
      invoiceDate: input.invoiceDate,
      dueDate: input.dueDate,
      currency: input.currency,
      exchangeRate: input.exchangeRate?.toString() || "1",
      subtotal: subtotal.toString(),
      taxAmount: taxAmount.toString(),
      totalAmount: totalAmount.toString(),
      balanceAmount: totalAmount.toString(), // Initially equals total amount
      description: input.description,
      notes: input.notes,
      createdBy: scope.userId,
    })
    .returning({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      invoiceDate: invoices.invoiceDate,
      dueDate: invoices.dueDate,
      currency: invoices.currency,
      subtotal: invoices.subtotal,
      taxAmount: invoices.taxAmount,
      totalAmount: invoices.totalAmount,
      status: invoices.status,
      createdAt: invoices.createdAt,
    });

  const invoice = invoiceResult[0];
  if (!invoice) {
    throw new DatabaseError("Failed to create invoice", "INSERT_FAILED");
  }

  // Insert invoice lines
  const lineResults = [];
  for (const line of input.lines) {
    const lineResult = await db
      .insert(invoiceLines)
      .values({
        invoiceId: invoice.id,
        lineNumber: line.lineNumber.toString(),
        description: line.description,
        quantity: line.quantity.toString(),
        unitPrice: line.unitPrice.toString(),
        lineAmount: line.lineAmount.toString(),
        taxCode: line.taxCode,
        taxRate: line.taxRate?.toString() || "0",
        taxAmount: (line.taxAmount || 0).toString(),
        revenueAccountId: line.revenueAccountId,
      })
      .returning({
        id: invoiceLines.id,
        lineNumber: invoiceLines.lineNumber,
        description: invoiceLines.description,
        quantity: invoiceLines.quantity,
        unitPrice: invoiceLines.unitPrice,
        lineAmount: invoiceLines.lineAmount,
        taxAmount: invoiceLines.taxAmount,
        revenueAccountId: invoiceLines.revenueAccountId,
      });

    lineResults.push(lineResult[0]);
  }

  return {
    ...invoice,
    lines: lineResults,
  };
}

// Proper type based on actual schema - core fields are never null due to notNull() constraints
export interface InvoiceWithLines {
  // Core invoice fields (never null due to schema constraints)
  id: string;
  tenantId: string;
  companyId: string;
  customerId: string;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  currency: string;
  exchangeRate: string;
  subtotal: string;
  taxAmount: string;
  totalAmount: string;
  paidAmount: string;
  balanceAmount: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;

  // Optional fields (can be null in schema)
  description: string | null;
  notes: string | null;
  journalId: string | null;
  createdBy: string | null;
  postedBy: string | null;
  postedAt: Date | null;

  // Customer fields (from leftJoin - can be null)
  customerName: string | null;
  customerEmail: string | null;

  // Invoice lines
  lines: Array<{
    id: string;
    lineNumber: string;
    description: string;
    quantity: string;
    unitPrice: string;
    lineAmount: string;
    taxCode: string | null;
    taxRate: string | null;
    taxAmount: string;
    revenueAccountId: string;
    revenueAccountName: string | null;
  }>;
}

/**
 * Get invoice with lines
 */
export async function getInvoice(scope: Scope, invoiceId: string): Promise<InvoiceWithLines> {
  const db = getDb();

  // Get invoice
  const invoiceResult = await db
    .select({
      id: invoices.id,
      tenantId: invoices.tenantId,
      companyId: invoices.companyId,
      customerId: invoices.customerId,
      invoiceNumber: invoices.invoiceNumber,
      invoiceDate: invoices.invoiceDate,
      dueDate: invoices.dueDate,
      currency: invoices.currency,
      exchangeRate: invoices.exchangeRate,
      subtotal: invoices.subtotal,
      taxAmount: invoices.taxAmount,
      totalAmount: invoices.totalAmount,
      paidAmount: invoices.paidAmount,
      balanceAmount: invoices.balanceAmount,
      status: invoices.status,
      description: invoices.description,
      notes: invoices.notes,
      journalId: invoices.journalId,
      createdBy: invoices.createdBy,
      postedBy: invoices.postedBy,
      postedAt: invoices.postedAt,
      createdAt: invoices.createdAt,
      updatedAt: invoices.updatedAt,
      customerName: customers.name,
      customerEmail: customers.email,
    })
    .from(invoices)
    .leftJoin(customers, eq(invoices.customerId, customers.id))
    .where(
      and(
        eq(invoices.id, invoiceId),
        eq(invoices.tenantId, scope.tenantId),
        eq(invoices.companyId, scope.companyId),
      ),
    )
    .limit(1);

  if (invoiceResult.length === 0) {
    throw new DatabaseError("Invoice not found or access denied", "INVOICE_NOT_FOUND", {
      invoiceId,
    });
  }

  // Get invoice lines
  const linesResult = await db
    .select({
      id: invoiceLines.id,
      lineNumber: invoiceLines.lineNumber,
      description: invoiceLines.description,
      quantity: invoiceLines.quantity,
      unitPrice: invoiceLines.unitPrice,
      lineAmount: invoiceLines.lineAmount,
      taxCode: invoiceLines.taxCode,
      taxRate: invoiceLines.taxRate,
      taxAmount: invoiceLines.taxAmount,
      revenueAccountId: invoiceLines.revenueAccountId,
      revenueAccountName: chartOfAccounts.name,
    })
    .from(invoiceLines)
    .leftJoin(chartOfAccounts, eq(invoiceLines.revenueAccountId, chartOfAccounts.id))
    .where(eq(invoiceLines.invoiceId, invoiceId))
    .orderBy(asc(invoiceLines.lineNumber));

  const invoice = invoiceResult[0]!; // We know it exists because we checked above

  // Cast to proper types based on schema knowledge
  return {
    // Core fields are guaranteed to exist due to schema constraints
    id: invoice.id!,
    tenantId: invoice.tenantId!,
    companyId: invoice.companyId!,
    customerId: invoice.customerId!,
    invoiceNumber: invoice.invoiceNumber!,
    invoiceDate: invoice.invoiceDate!,
    dueDate: invoice.dueDate!,
    currency: invoice.currency!,
    exchangeRate: invoice.exchangeRate!,
    subtotal: invoice.subtotal!,
    taxAmount: invoice.taxAmount!,
    totalAmount: invoice.totalAmount!,
    paidAmount: invoice.paidAmount!,
    balanceAmount: invoice.balanceAmount!,
    status: invoice.status!,
    createdAt: invoice.createdAt!,
    updatedAt: invoice.updatedAt!,

    // Optional fields (preserve null possibility)
    description: invoice.description,
    notes: invoice.notes,
    journalId: invoice.journalId,
    createdBy: invoice.createdBy,
    postedBy: invoice.postedBy,
    postedAt: invoice.postedAt,

    // Customer fields from leftJoin
    customerName: invoice.customerName,
    customerEmail: invoice.customerEmail,

    // Lines
    lines: linesResult,
  };
}

/**
 * Update invoice status and journal reference after posting
 */
export async function updateInvoicePosting(
  scope: Scope,
  invoiceId: string,
  journalId: string,
  status: "posted" = "posted",
) {
  const db = getDb();

  const result = await db
    .update(invoices)
    .set({
      journalId,
      status,
      postedBy: scope.userId,
      postedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(invoices.id, invoiceId),
        eq(invoices.tenantId, scope.tenantId),
        eq(invoices.companyId, scope.companyId),
      ),
    )
    .returning({
      id: invoices.id,
      status: invoices.status,
      journalId: invoices.journalId,
      postedAt: invoices.postedAt,
    });

  if (result.length === 0) {
    throw new DatabaseError("Invoice not found or access denied", "INVOICE_NOT_FOUND", {
      invoiceId,
    });
  }

  return result[0];
}

/**
 * List invoices with pagination and filtering
 */
export async function listInvoices(
  scope: Scope,
  filters: {
    customerId?: string;
    status?: string;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
    offset?: number;
  } = {},
) {
  const db = getDb();
  const { customerId, status, fromDate, toDate, limit = 20, offset = 0 } = filters;

  // Build where conditions
  const conditions = [
    eq(invoices.tenantId, scope.tenantId),
    eq(invoices.companyId, scope.companyId),
  ];

  if (customerId) {
    conditions.push(eq(invoices.customerId, customerId));
  }

  if (status) {
    conditions.push(eq(invoices.status, status));
  }

  if (fromDate) {
    conditions.push(gte(invoices.invoiceDate, fromDate));
  }

  if (toDate) {
    conditions.push(lte(invoices.invoiceDate, toDate));
  }

  // Get total count
  const totalResult = await db
    .select({ count: count() })
    .from(invoices)
    .where(and(...conditions));

  const total = totalResult[0]?.count || 0;

  // Get invoices
  const invoicesResult = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      customerId: invoices.customerId,
      customerName: customers.name,
      invoiceDate: invoices.invoiceDate,
      dueDate: invoices.dueDate,
      currency: invoices.currency,
      totalAmount: invoices.totalAmount,
      paidAmount: invoices.paidAmount,
      balanceAmount: invoices.balanceAmount,
      status: invoices.status,
      createdAt: invoices.createdAt,
    })
    .from(invoices)
    .leftJoin(customers, eq(invoices.customerId, customers.id))
    .where(and(...conditions))
    .orderBy(desc(invoices.invoiceDate))
    .limit(limit)
    .offset(offset);

  return {
    invoices: invoicesResult,
    total: Number(total),
    hasMore: offset + limit < Number(total),
  };
}
