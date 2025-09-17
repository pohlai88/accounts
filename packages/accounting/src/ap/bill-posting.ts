// D3 AP Bill Posting Engine - Bill to GL Integration
import { validateJournalPosting, type JournalPostingInput } from "../posting.js";
import { validateFxPolicy } from "../fx/policy.js";

// Database client interface
interface DbClient {
  query: (sql: string, params?: unknown[]) => Promise<unknown>;
  transaction?: (callback: (tx: DbClient) => Promise<void>) => Promise<void>;
}

// Posting context interface
interface PostingContext {
  tenantId: string;
  companyId: string;
  userId: string;
  userRole: string;
}

export interface BillPostingInput {
  tenantId: string;
  companyId: string;
  billId: string;
  billNumber: string;
  supplierId: string;
  supplierName: string;
  billDate: string;
  currency: string;
  exchangeRate: number;
  apAccountId: string; // Accounts Payable account
  lines: BillLineInput[];
  taxLines?: TaxLineInput[];
  description?: string;
}

export interface BillLineInput {
  lineNumber: number;
  description: string;
  quantity: number;
  unitPrice: number;
  lineAmount: number;
  taxCode?: string;
  taxRate?: number;
  taxAmount?: number;
  expenseAccountId: string; // Expense account for this line
}

export interface TaxLineInput {
  taxCode: string;
  taxRate: number;
  taxAmount: number;
  taxAccountId: string; // Tax liability account
}

export interface BillPostingResult {
  validated: true;
  journalInput: JournalPostingInput;
  totalAmount: number;
  requiresApproval?: boolean;
  approverRoles?: string[];
  coaWarnings?: Array<{
    accountId: string;
    warning: string;
    accountType: string;
    amount: number;
    side: "debit" | "credit";
  }>;
}

export interface BillPostingError {
  validated: false;
  error: string;
  code: string;
  details?: Record<string, unknown>;
}

/**
 * Validates and posts an AP bill to the General Ledger
 *
 * Journal Entry Structure:
 * Dr. Expense Accounts (by line)     XXX
 * Dr. Tax Input Accounts (if any)    XXX
 *     Cr. Accounts Payable               XXX
 */
export async function validateBillPosting(
  input: BillPostingInput,
  userId: string,
  userRole: string,
  baseCurrency: string = "MYR",
): Promise<BillPostingResult | BillPostingError> {
  try {
    // 1. Validate FX policy if foreign currency
    if (input.currency !== baseCurrency) {
      const fxResult = validateFxPolicy(baseCurrency, input.currency);

      if (!fxResult.requiresFxRate) {
        throw new Error(`FX rate required for currency conversion from ${baseCurrency} to ${input.currency}`);
      }

      // FX validation passed - we have the required rate info
    }

    // 2. Calculate totals and validate
    const totals = calculateBillTotals(input.lines);
    const taxTotal = input.taxLines?.reduce((sum, tax) => sum + tax.taxAmount, 0) || 0;
    const grandTotal = totals.subtotal + taxTotal;

    // 3. Build journal lines
    const journalLines = [];

    // Debit expense accounts for each line
    for (const line of input.lines) {
      const convertedAmount = line.lineAmount * input.exchangeRate;

      journalLines.push({
        accountId: line.expenseAccountId,
        debit: convertedAmount,
        credit: 0,
        description: `${input.supplierName} - ${line.description}`,
        reference: input.billNumber,
      });
    }

    // Debit tax input accounts (if any)
    if (input.taxLines) {
      for (const taxLine of input.taxLines) {
        const convertedTaxAmount = taxLine.taxAmount * input.exchangeRate;

        journalLines.push({
          accountId: taxLine.taxAccountId,
          debit: convertedTaxAmount,
          credit: 0,
          description: `${input.supplierName} - ${taxLine.taxCode} Input Tax`,
          reference: input.billNumber,
        });
      }
    }

    // Credit accounts payable
    const convertedTotal = grandTotal * input.exchangeRate;
    journalLines.push({
      accountId: input.apAccountId,
      debit: 0,
      credit: convertedTotal,
      description: `${input.supplierName} - Bill ${input.billNumber}`,
      reference: input.billNumber,
    });

    // 4. Create posting context for SoD validation
    const context: PostingContext = {
      tenantId: input.tenantId,
      companyId: input.companyId,
      userId,
      userRole,
    };

    // 5. Prepare journal posting input
    const journalInput: JournalPostingInput = {
      context,
      journalNumber: `BILL-${input.billNumber}`,
      description: input.description || `AP Bill ${input.billNumber} - ${input.supplierName}`,
      journalDate: new Date(input.billDate),
      currency: baseCurrency, // Always post in base currency
      lines: journalLines,
    };

    // 6. Validate journal posting (includes SoD, COA, balance checks)
    const validation = await validateJournalPosting(journalInput);

    if (!validation.validated) {
      return {
        validated: false,
        error: "Journal validation failed",
        code: "JOURNAL_VALIDATION_FAILED",
        details: validation,
      };
    }

    // 7. Return successful validation result
    return {
      validated: true,
      journalInput,
      totalAmount: convertedTotal,
      requiresApproval: validation.requiresApproval,
      approverRoles: validation.approverRoles,
      coaWarnings: validation.coaWarnings,
    };
  } catch (error) {
    return {
      validated: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      code: "BILL_POSTING_ERROR",
      details: error as Record<string, unknown>,
    };
  }
}

/**
 * Calculate bill totals from lines
 */
export function calculateBillTotals(lines: BillLineInput[]): {
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
} {
  const subtotal = lines.reduce((sum, line) => sum + line.lineAmount, 0);
  const taxAmount = lines.reduce((sum, line) => sum + (line.taxAmount || 0), 0);
  const totalAmount = subtotal + taxAmount;

  return {
    subtotal: Math.round(subtotal * 100) / 100, // Round to 2 decimal places
    taxAmount: Math.round(taxAmount * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100,
  };
}

/**
 * Validate bill line calculations
 */
export function validateBillLines(lines: BillLineInput[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  for (const line of lines) {
    // Validate line amount calculation
    const expectedAmount = line.quantity * line.unitPrice;
    if (Math.abs(line.lineAmount - expectedAmount) > 0.01) {
      errors.push(
        `Line ${line.lineNumber}: Line amount ${line.lineAmount} does not match quantity × unit price (${expectedAmount})`,
      );
    }

    // Validate tax calculation if tax code is present
    if (line.taxCode && line.taxRate) {
      const expectedTaxAmount = line.lineAmount * line.taxRate;
      if (Math.abs((line.taxAmount || 0) - expectedTaxAmount) > 0.01) {
        errors.push(
          `Line ${line.lineNumber}: Tax amount ${line.taxAmount} does not match line amount × tax rate (${expectedTaxAmount})`,
        );
      }
    }

    // Validate positive amounts
    if (line.quantity <= 0) {
      errors.push(`Line ${line.lineNumber}: Quantity must be positive`);
    }
    if (line.unitPrice < 0) {
      errors.push(`Line ${line.lineNumber}: Unit price cannot be negative`);
    }
    if (line.lineAmount < 0) {
      errors.push(`Line ${line.lineNumber}: Line amount cannot be negative`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate bill number if not provided
 */
export function generateBillNumber(companyCode: string, sequence: number): string {
  const year = new Date().getFullYear();
  const paddedSequence = sequence.toString().padStart(6, "0");
  return `BILL-${companyCode}-${year}-${paddedSequence}`;
}

/**
 * Validate bill posting business rules
 */
export function validateBillBusinessRules(input: BillPostingInput): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate bill date is not in the future
  const billDate = new Date(input.billDate);
  if (billDate > new Date()) {
    errors.push("Bill date cannot be in the future");
  }

  // Validate currency format
  if (!input.currency || input.currency.length !== 3) {
    errors.push("Currency must be a valid 3-letter ISO code");
  }

  // Validate exchange rate
  if (input.exchangeRate <= 0) {
    errors.push("Exchange rate must be positive");
  }

  // Validate lines exist
  if (!input.lines || input.lines.length === 0) {
    errors.push("Bill must have at least one line");
  }

  // Validate line calculations
  if (input.lines) {
    const lineValidation = validateBillLines(input.lines);
    errors.push(...lineValidation.errors);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
