// D2 AR Invoice Posting Engine - Invoice to GL Integration
import { validateJournalPosting, type JournalPostingInput } from "../posting.js";
import { validateFxPolicy } from "../fx/policy.js";

export interface InvoicePostingInput {
  tenantId: string;
  companyId: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  invoiceDate: string;
  currency: string;
  exchangeRate: number;
  arAccountId: string; // Accounts Receivable account
  lines: InvoiceLineInput[];
  taxLines?: TaxLineInput[];
  description?: string;
}

export interface InvoiceLineInput {
  lineNumber: number;
  description: string;
  quantity: number;
  unitPrice: number;
  lineAmount: number;
  revenueAccountId: string;
  taxCode?: string;
  taxRate?: number;
  taxAmount?: number;
}

export interface TaxLineInput {
  taxCode: string;
  taxAccountId: string;
  taxAmount: number;
  taxType: "INPUT" | "OUTPUT" | "EXEMPT";
}

export interface InvoicePostingResult {
  validated: true;
  journalInput: JournalPostingInput;
  totalRevenue: number;
  totalTax: number;
  totalAmount: number;
  requiresApproval: boolean;
  approverRoles?: string[];
  coaWarnings?: Array<{ accountId: string; warning: string }>;
}

export interface InvoicePostingError {
  validated: false;
  error: string;
  code: "INVALID_AMOUNTS" | "INVALID_ACCOUNTS" | "INVALID_CURRENCY" | "BUSINESS_RULE_VIOLATION";
}

/**
 * Validates and prepares an AR invoice for GL posting
 *
 * Business Rules:
 * 1. Invoice must be balanced (AR = Revenue + Tax)
 * 2. All accounts must exist and be active
 * 3. Revenue accounts must be REVENUE type
 * 4. AR account must be ASSET type
 * 5. Tax accounts must be LIABILITY type (for output tax)
 * 6. Currency validation with FX policy
 * 7. Line amounts must equal header amounts
 */
export async function validateInvoicePosting(
  input: InvoicePostingInput,
  userId: string,
  userRole: string,
  baseCurrency: string = "MYR",
): Promise<InvoicePostingResult | InvoicePostingError> {
  try {
    // 1. Validate basic input
    if (!input.invoiceId || !input.arAccountId || !input.lines.length) {
      return {
        validated: false,
        error: "Missing required fields: invoiceId, arAccountId, or lines",
        code: "INVALID_AMOUNTS",
      };
    }

    // 2. Calculate totals from lines
    const totalRevenue = input.lines.reduce((sum, line) => sum + line.lineAmount, 0);
    const totalTax =
      input.lines.reduce((sum, line) => sum + (line.taxAmount || 0), 0) +
      (input.taxLines?.reduce((sum, tax) => sum + tax.taxAmount, 0) || 0);
    const totalAmount = totalRevenue + totalTax;

    // 3. Validate amounts are positive
    if (totalRevenue <= 0) {
      return {
        validated: false,
        error: "Invoice revenue must be positive",
        code: "INVALID_AMOUNTS",
      };
    }

    if (totalAmount <= 0) {
      return {
        validated: false,
        error: "Invoice total amount must be positive",
        code: "INVALID_AMOUNTS",
      };
    }

    // 4. Validate currency and FX policy
    const fxValidation = validateFxPolicy(baseCurrency, input.currency);
    const exchangeRate = fxValidation.requiresFxRate ? input.exchangeRate : 1.0;

    if (fxValidation.requiresFxRate && (!input.exchangeRate || input.exchangeRate <= 0)) {
      return {
        validated: false,
        error: `Exchange rate required for ${input.currency} to ${baseCurrency} conversion`,
        code: "INVALID_CURRENCY",
      };
    }

    // 5. Build journal lines for GL posting
    const journalLines: Array<{
      accountId: string;
      debit: number;
      credit: number;
      description: string;
      reference?: string;
    }> = [];

    // Debit: Accounts Receivable (total amount in base currency)
    const arAmountBase = totalAmount * exchangeRate;
    journalLines.push({
      accountId: input.arAccountId,
      debit: arAmountBase,
      credit: 0,
      description: `AR - ${input.customerName} - ${input.invoiceNumber}`,
      reference: input.invoiceNumber,
    });

    // Credit: Revenue accounts (line amounts in base currency)
    for (const line of input.lines) {
      const revenueAmountBase = line.lineAmount * exchangeRate;
      journalLines.push({
        accountId: line.revenueAccountId,
        debit: 0,
        credit: revenueAmountBase,
        description: `Revenue - ${line.description}`,
        reference: input.invoiceNumber,
      });

      // Credit: Tax amount if applicable
      if (line.taxAmount && line.taxAmount > 0 && line.taxCode) {
        // Note: Tax account ID would need to be resolved from tax code
        // For now, we'll handle this in the service layer
      }
    }

    // Credit: Tax lines (if any)
    if (input.taxLines) {
      for (const taxLine of input.taxLines) {
        const taxAmountBase = taxLine.taxAmount * exchangeRate;
        journalLines.push({
          accountId: taxLine.taxAccountId,
          debit: 0,
          credit: taxAmountBase,
          description: `${taxLine.taxCode} Tax - ${input.invoiceNumber}`,
          reference: input.invoiceNumber,
        });
      }
    }

    // 6. Create journal posting input
    const journalInput: JournalPostingInput = {
      journalNumber: input.invoiceNumber, // Use invoice number as journal number
      description: input.description || `Invoice ${input.invoiceNumber} - ${input.customerName}`,
      journalDate: new Date(input.invoiceDate), // Convert string to Date
      currency: baseCurrency, // Always post in base currency
      lines: journalLines,
      context: {
        tenantId: input.tenantId,
        companyId: input.companyId,
        userId,
        userRole,
      },
    };

    // 7. Validate the journal posting
    const journalValidation = await validateJournalPosting(journalInput);

    if (!journalValidation.validated) {
      return {
        validated: false,
        error: `Journal validation failed: ${(journalValidation as { error?: string }).error || "Unknown validation error"}`,
        code: "BUSINESS_RULE_VIOLATION",
      };
    }

    // 8. Return successful validation
    return {
      validated: true,
      journalInput,
      totalRevenue,
      totalTax,
      totalAmount,
      requiresApproval: journalValidation.requiresApproval,
      approverRoles: journalValidation.approverRoles,
      coaWarnings: journalValidation.coaWarnings,
    };
  } catch (error) {
    return {
      validated: false,
      error: error instanceof Error ? error.message : "Unknown validation error",
      code: "BUSINESS_RULE_VIOLATION",
    };
  }
}

/**
 * Calculate invoice totals from lines
 */
export function calculateInvoiceTotals(lines: InvoiceLineInput[]): {
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
 * Validate invoice line calculations
 */
export function validateInvoiceLines(lines: InvoiceLineInput[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  for (const line of lines) {
    // Validate line amount calculation
    const expectedLineAmount = line.quantity * line.unitPrice;
    const actualLineAmount = line.lineAmount;

    if (Math.abs(expectedLineAmount - actualLineAmount) > 0.01) {
      errors.push(
        `Line ${line.lineNumber}: Line amount ${actualLineAmount} does not match quantity × unit price ${expectedLineAmount}`,
      );
    }

    // Validate tax calculation if tax is applied
    if (line.taxRate && line.taxRate > 0) {
      const expectedTaxAmount = line.lineAmount * line.taxRate;
      const actualTaxAmount = line.taxAmount || 0;

      if (Math.abs(expectedTaxAmount - actualTaxAmount) > 0.01) {
        errors.push(
          `Line ${line.lineNumber}: Tax amount ${actualTaxAmount} does not match line amount × tax rate ${expectedTaxAmount}`,
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
 * Generate invoice posting description
 */
export function generateInvoiceDescription(
  invoiceNumber: string,
  customerName: string,
  totalAmount: number,
  currency: string,
): string {
  return `Invoice ${invoiceNumber} - ${customerName} - ${currency} ${totalAmount.toFixed(2)}`;
}
