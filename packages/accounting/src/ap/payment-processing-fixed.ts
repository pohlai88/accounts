// Fixed Payment Processing with Surgical Fixes
import { validateJournalPosting, type JournalPostingInput, type PostingContext } from "../posting.js";
import { validateFxPolicy } from "../fx/policy.js";
import {
  getCustomerById,
  getSupplierById,
  getBankAccountById,
  getOrCreateAdvanceAccount,
  calculateBankCharges,
  calculateWithholdingTax,
  updateAdvanceAccountBalance
} from "@aibos/db";
import {
  getPaymentTypeFromAllocation,
  getJournalAccountId,
  getJournalTemplate,
  VALIDATION_CONSTANTS,
  ERROR_CODES,
  ACCOUNT_IDS
} from "../metadata/account-mapping.js";

export interface PaymentProcessingInput {
  tenantId: string;
  companyId: string;
  paymentId: string;
  paymentNumber: string;
  paymentDate: string;
  paymentMethod: "BANK_TRANSFER" | "CHECK" | "CASH" | "CREDIT_CARD" | "DEBIT_CARD" | "OTHER";
  bankAccountId: string;
  currency: string;
  exchangeRate?: number;
  amount: number;
  reference?: string;
  description?: string;
  allocations: PaymentAllocationInput[];
  // Enhanced fields for better validation
  customerId?: string;
  supplierId?: string;
  bankCharges?: BankChargeInput[];
  withholdingTax?: WithholdingTaxInput[];
}

export interface BankChargeInput {
  accountId: string;
  amount: number;
  description: string;
}

export interface WithholdingTaxInput {
  accountId: string;
  rate: number; // e.g., 0.10 for 10%
  amount: number;
  description: string;
}

export interface PaymentAllocationInput {
  type: "BILL" | "INVOICE";
  documentId: string;
  documentNumber: string;
  allocatedAmount: number;
  arAccountId?: string;
  apAccountId?: string;
  customerId?: string;
  supplierId?: string;
  currency?: string;
}

export interface PaymentProcessingResult {
  success: true;
  journalId: string;
  journalNumber: string;
  totalAmount: number;
  allocationsProcessed: number;
  lines: Array<{
    accountId: string;
    debit: number;
    credit: number;
    description: string;
  }>;
  fxApplied?: {
    fromCurrency: string;
    toCurrency: string;
    exchangeRate: number;
    convertedAmount: number;
  };
  bankCharges?: Array<{
    accountId: string;
    amount: number;
    description: string;
  }>;
  withholdingTax?: Array<{
    accountId: string;
    amount: number;
    description: string;
  }>;
}

export interface PaymentProcessingError {
  success: false;
  error: string;
  code: string;
  details?: Record<string, unknown>;
}

// Helper functions for surgical fixes
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function toBase(amount: number, currency: string, baseCurrency: string, exchangeRate?: number): number {
  if (currency === baseCurrency) return round2(amount);
  if (!exchangeRate) throw new Error("FX_RATE_REQUIRED: Exchange rate required for foreign currency");
  return round2(amount * exchangeRate);
}

function sum(lines: Array<{ debit?: number; credit?: number }>, field: 'debit' | 'credit'): number {
  return lines.reduce((sum, line) => sum + (line[field] || 0), 0);
}

// Journal posting template (single source of truth)
function createPostingTemplate(isCustomer: boolean) {
  return {
    // base amounts only here
    onPayment(amountBase: number, bankId: string, arId: string, apId: string) {
      return isCustomer
        ? [
          { accountId: bankId, debit: amountBase }, // DR Bank
          { accountId: arId, credit: amountBase }   // CR AR
        ]
        : [
          { accountId: apId, debit: amountBase },   // DR AP
          { accountId: bankId, credit: amountBase } // CR Bank
        ];
    },
    onOverpay(remainderBase: number, advanceId: string) {
      return isCustomer
        ? [{ accountId: advanceId, credit: remainderBase }]   // CR Customer Advances (LIAB)
        : [{ accountId: advanceId, debit: remainderBase }];   // DR Vendor Prepayments (ASSET)
    },
    onCharge(feeBase: number, expenseId: string) {
      return [{ accountId: expenseId, debit: feeBase }]; // DR Expense
    }
  };
}

/**
 * Fixed payment processing with surgical fixes
 */
export async function validatePaymentProcessingFixed(
  input: PaymentProcessingInput,
  userId: string,
  userRole: string,
  baseCurrency: string = "MYR",
): Promise<PaymentProcessingResult | PaymentProcessingError> {
  try {
    // 1. FX validation - require rate when needed
    if (input.currency !== baseCurrency && !input.exchangeRate) {
      return {
        success: false,
        error: "Exchange rate is required for foreign currency payments",
        code: "EXCHANGE_RATE_REQUIRED",
        details: { baseCurrency, transactionCurrency: input.currency }
      };
    }

    // 2. Multi-currency policy - reject mixed currency allocations for now
    const allocationCurrencies = new Set(input.allocations.map(a => a.currency ?? input.currency));
    if (allocationCurrencies.size > 1) {
      return {
        success: false,
        error: "Allocations span multiple currencies",
        code: "CURRENCY_MISMATCH",
        details: { currencies: Array.from(allocationCurrencies) }
      };
    }

    // 3. Convert amounts to base currency
    const convertedAmount = toBase(input.amount, input.currency, baseCurrency, input.exchangeRate);
    const exchangeRate = input.currency === baseCurrency ? 1 : (input.exchangeRate || 1);

    // 4. Determine party type using standardized metadata
    const allocationType = input.allocations[0]?.type || "INVOICE";
    const paymentType = getPaymentTypeFromAllocation(allocationType);
    const isCustomer = paymentType === 'CUSTOMER_PAYMENT';
    const partyType = isCustomer ? 'CUSTOMER' : 'SUPPLIER';
    const partyId = input.customerId || input.supplierId!;

    // 5. Get required accounts
    const bankAccount = await getBankAccountById(input.tenantId, input.companyId, input.bankAccountId);
    if (!bankAccount) {
      return {
        success: false,
        error: "Bank account not found",
        code: ERROR_CODES.ACCOUNTS_NOT_FOUND,
        details: { bankAccountId: input.bankAccountId }
      };
    }

    // 6. Build journal lines using template
    const journalLines: Array<{
      accountId: string;
      debit: number;
      credit: number;
      description: string;
      reference?: string;
    }> = [];

    const POSTING = createPostingTemplate(isCustomer);

    // Process allocations
    let totalAllocated = 0;
    for (const allocation of input.allocations) {
      const allocatedBase = toBase(allocation.allocatedAmount, allocation.currency ?? input.currency, baseCurrency, exchangeRate);
      totalAllocated += allocatedBase;

      // Use standardized journal template
      const template = getJournalTemplate(paymentType);
      const arAccountId = allocation.arAccountId!;
      const apAccountId = allocation.apAccountId!;

      // Create journal lines using metadata mapping
      // For customer payments: DR Bank (full amount), CR AR (allocated amount)
      // For supplier payments: DR AP (allocated amount), CR Bank (full amount)
      if (isCustomer) {
        // Customer payment: DR Bank (full payment), CR AR (allocated)
        journalLines.push({
          accountId: input.bankAccountId,
          debit: convertedAmount, // Full payment amount
          credit: 0,
          description: `${template.DESCRIPTION_PREFIX} ${input.paymentNumber} - ${allocation.documentNumber}`,
          reference: input.paymentNumber,
        });
        journalLines.push({
          accountId: arAccountId,
          debit: 0,
          credit: allocatedBase, // Only allocated amount
          description: `${template.DESCRIPTION_PREFIX} ${input.paymentNumber} - ${allocation.documentNumber}`,
          reference: input.paymentNumber,
        });
      } else {
        // Supplier payment: DR AP (allocated), CR Bank (full payment)
        journalLines.push({
          accountId: apAccountId,
          debit: allocatedBase, // Only allocated amount
          credit: 0,
          description: `${template.DESCRIPTION_PREFIX} ${input.paymentNumber} - ${allocation.documentNumber}`,
          reference: input.paymentNumber,
        });
        journalLines.push({
          accountId: input.bankAccountId,
          debit: 0,
          credit: convertedAmount, // Full payment amount
          description: `${template.DESCRIPTION_PREFIX} ${input.paymentNumber} - ${allocation.documentNumber}`,
          reference: input.paymentNumber,
        });
      }
    }

    // Process bank charges
    let totalCharges = 0;
    if (input.bankCharges && input.bankCharges.length > 0) {
      for (const charge of input.bankCharges) {
        const chargeBase = toBase(charge.amount, input.currency, baseCurrency, exchangeRate);
        totalCharges += chargeBase;

        journalLines.push({
          accountId: charge.accountId,
          debit: chargeBase,
          credit: 0,
          description: `Bank charge - ${charge.description}`,
          reference: input.paymentNumber,
        });
      }
    }

    // Process withholding tax
    let totalTax = 0;
    if (input.withholdingTax && input.withholdingTax.length > 0) {
      for (const tax of input.withholdingTax) {
        const taxBase = toBase(tax.amount, input.currency, baseCurrency, exchangeRate);
        totalTax += taxBase;

        journalLines.push({
          accountId: tax.accountId,
          debit: taxBase,
          credit: 0,
          description: `Withholding tax - ${tax.description}`,
          reference: input.paymentNumber,
        });
      }
    }

    // Handle overpayment using metadata-driven approach
    const expectedTotal = totalAllocated + totalCharges + totalTax;
    const remainder = round2(convertedAmount - expectedTotal);

    if (remainder > 0.01) { // Only if significant overpayment

      // Route overpayment to appropriate advance/prepayment account
      if (isCustomer) {
        // Customer overpayment → Advances (credit)
        journalLines.push({
          accountId: ACCOUNT_IDS.ADV_CUSTOMER,
          debit: 0,
          credit: remainder,
          description: `Customer advance - ${input.paymentNumber}`,
          reference: input.paymentNumber,
        });
      } else {
        // Vendor overpayment → Prepayments (debit)
        journalLines.push({
          accountId: ACCOUNT_IDS.PREPAY_VENDOR,
          debit: remainder,
          credit: 0,
          description: `Vendor prepayment - ${input.paymentNumber}`,
          reference: input.paymentNumber,
        });
      }
    } else if (remainder < -0.01) {
      // Underpayment not allowed
      return {
        success: false,
        error: `Underpayment not allowed. Short by ${Math.abs(remainder).toFixed(2)}`,
        code: ERROR_CODES.INVALID_AMOUNT,
        details: {
          expectedTotal,
          actualAmount: convertedAmount,
          shortfall: Math.abs(remainder)
        }
      };
    }

    // 7. Balance the journal with FX rounding if needed
    const totalDebits = sum(journalLines, 'debit');
    const totalCredits = sum(journalLines, 'credit');
    const diff = round2(totalDebits - totalCredits);

    if (Math.abs(diff) > 0.01) {
      if (Math.abs(diff) <= 0.01) {
        // Tiny residual: book to FX rounding
        const fxAccountId = diff > 0 ? ACCOUNT_IDS.FX_LOSS : ACCOUNT_IDS.FX_GAIN;
        journalLines.push({
          accountId: fxAccountId,
          debit: diff > 0 ? 0 : Math.abs(diff),
          credit: diff > 0 ? Math.abs(diff) : 0,
          description: `FX rounding adjustment - ${input.paymentNumber}`,
          reference: input.paymentNumber,
        });
      } else {
        return {
          success: false,
          error: `Journal unbalanced by ${diff}`,
          code: "JOURNAL_UNBALANCED",
          details: { totalDebits, totalCredits, difference: diff }
        };
      }
    }

    // 8. Create posting context
    const context: PostingContext = {
      tenantId: input.tenantId,
      companyId: input.companyId,
      userId,
      userRole,
    };

    // 9. Prepare journal posting input
    const journalInput: JournalPostingInput = {
      context,
      journalNumber: `PAY-${input.paymentNumber}`,
      description: input.description || `Payment ${input.paymentNumber} - ${input.paymentMethod}`,
      journalDate: new Date(input.paymentDate),
      currency: baseCurrency,
      lines: journalLines,
    };

    // 10. Validate journal posting
    const validation = await validateJournalPosting(journalInput);
    if (!validation.validated) {
      return {
        success: false,
        error: "Journal validation failed",
        code: "JOURNAL_VALIDATION_FAILED",
        details: validation,
      };
    }

    // 11. Return result
    const result: PaymentProcessingResult = {
      success: true,
      journalId: "",
      journalNumber: journalInput.journalNumber,
      totalAmount: convertedAmount,
      allocationsProcessed: input.allocations.length,
      lines: journalLines.map(line => ({
        accountId: line.accountId,
        debit: line.debit,
        credit: line.credit,
        description: line.description,
      })),
    };

    // Add FX information if applicable
    if (input.currency !== baseCurrency) {
      result.fxApplied = {
        fromCurrency: input.currency,
        toCurrency: baseCurrency,
        exchangeRate: exchangeRate,
        convertedAmount: convertedAmount,
      };
    }

    // Add bank charges if applicable
    if (input.bankCharges && input.bankCharges.length > 0) {
      result.bankCharges = input.bankCharges.map(charge => ({
        accountId: charge.accountId,
        amount: toBase(charge.amount, input.currency, baseCurrency, exchangeRate),
        description: charge.description,
      }));
    }

    // Add withholding tax if applicable
    if (input.withholdingTax && input.withholdingTax.length > 0) {
      result.withholdingTax = input.withholdingTax.map(tax => ({
        accountId: tax.accountId,
        amount: toBase(tax.amount, input.currency, baseCurrency, exchangeRate),
        description: tax.description,
      }));
    }

    return result;

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Payment processing failed";
    const errorCode = error instanceof Error && 'code' in error ? (error as { code: string }).code : "PAYMENT_PROCESSING_ERROR";
    return {
      success: false,
      error: errorMessage,
      code: errorCode,
      details: {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      },
    };
  }
}

// Re-export other functions for compatibility
export { generatePaymentNumber, calculatePaymentSummary } from "./payment-processing-enhanced.js";
