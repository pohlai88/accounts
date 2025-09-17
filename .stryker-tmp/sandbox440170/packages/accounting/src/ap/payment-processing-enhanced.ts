// @ts-nocheck
// Enhanced Payment Processing with Comprehensive Validation
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

export interface PaymentProcessingInput {
    tenantId: string;
    companyId: string;
    paymentId: string;
    paymentNumber: string;
    paymentDate: string;
    paymentMethod: "BANK_TRANSFER" | "CHECK" | "CASH" | "CREDIT_CARD" | "DEBIT_CARD" | "OTHER";
    bankAccountId: string;
    currency: string;
    exchangeRate: number;
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
    supplierId?: string;
    customerId?: string;
    allocatedAmount: number;
    apAccountId?: string;
    arAccountId?: string;
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

/**
 * Enhanced payment processing with comprehensive validation
 */
export async function validatePaymentProcessing(
    input: PaymentProcessingInput,
    userId: string,
    userRole: string,
    baseCurrency: string = "MYR",
): Promise<PaymentProcessingResult | PaymentProcessingError> {
    try {
        // 1. Enhanced FX validation
        const fxValidation = await validateFxRequirements(input, baseCurrency);
        if (!fxValidation.valid) {
            return {
                success: false,
                error: fxValidation.error || "FX validation failed",
                code: fxValidation.code || "FX_VALIDATION_FAILED",
                details: fxValidation.details || {},
            };
        }

        // 2. Currency consistency validation
        const currencyValidation = await validateCurrencyConsistency(input, baseCurrency);
        if (!currencyValidation.valid) {
            return {
                success: false,
                error: currencyValidation.error || "Currency validation failed",
                code: currencyValidation.code || "CURRENCY_VALIDATION_FAILED",
                details: currencyValidation.details || {},
            };
        }

        // 3. Enhanced business rules validation
        const businessValidation = validatePaymentBusinessRules(input);
        if (!businessValidation.valid) {
            return {
                success: false,
                error: `Payment validation failed: ${businessValidation.errors.join(", ")}`,
                code: "PAYMENT_VALIDATION_FAILED",
                details: { errors: businessValidation.errors },
            };
        }

        // 4. Build enhanced journal lines
        const journalLines = await buildJournalLines(input, baseCurrency);

        // 5. Create posting context for SoD validation
        const context: PostingContext = {
            tenantId: input.tenantId,
            companyId: input.companyId,
            userId,
            userRole,
        };

        // 6. Prepare journal posting input
        const journalInput: JournalPostingInput = {
            context,
            journalNumber: `PAY-${input.paymentNumber}`,
            description: input.description || `Payment ${input.paymentNumber} - ${input.paymentMethod}`,
            journalDate: new Date(input.paymentDate),
            currency: baseCurrency,
            lines: journalLines,
        };

        // 7. Validate journal posting
        const validation = await validateJournalPosting(journalInput);
        if (!validation.validated) {
            return {
                success: false,
                error: "Journal validation failed",
                code: "JOURNAL_VALIDATION_FAILED",
                details: validation,
            };
        }

        // 8. Return enhanced result
        const result: PaymentProcessingResult = {
            success: true,
            journalId: "",
            journalNumber: journalInput.journalNumber,
            totalAmount: fxValidation.convertedAmount || input.amount,
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
                exchangeRate: input.exchangeRate,
                convertedAmount: fxValidation.convertedAmount || input.amount,
            };
        }

        // Add bank charges if applicable
        if (input.bankCharges && input.bankCharges.length > 0) {
            result.bankCharges = input.bankCharges.map(charge => ({
                accountId: charge.accountId,
                amount: charge.amount,
                description: charge.description,
            }));
        }

        // Add withholding tax if applicable
        if (input.withholdingTax && input.withholdingTax.length > 0) {
            result.withholdingTax = input.withholdingTax.map(tax => ({
                accountId: tax.accountId,
                amount: tax.amount,
                description: tax.description,
            }));
        }

        return result;
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
            code: "PAYMENT_PROCESSING_ERROR",
            details: error as Record<string, unknown>,
        };
    }
}

/**
 * Enhanced FX validation with proper error handling
 */
async function validateFxRequirements(
    input: PaymentProcessingInput,
    baseCurrency: string,
): Promise<{
    valid: boolean;
    error?: string;
    code?: string;
    details?: Record<string, unknown>;
    convertedAmount?: number;
}> {
    // Check if foreign currency
    if (input.currency !== baseCurrency) {
        // Validate FX policy
        const fxResult = validateFxPolicy(baseCurrency, input.currency);

        if (!fxResult.requiresFxRate) {
            return {
                valid: false,
                error: `FX rate required for currency conversion from ${baseCurrency} to ${input.currency}`,
                code: "FX_RATE_REQUIRED",
                details: { baseCurrency, transactionCurrency: input.currency },
            };
        }

        // Validate exchange rate is provided and valid
        if (input.exchangeRate === undefined || input.exchangeRate === null) {
            return {
                valid: false,
                error: `Exchange rate is required for foreign currency ${input.currency}`,
                code: "EXCHANGE_RATE_REQUIRED",
                details: { currency: input.currency },
            };
        }

        if (input.exchangeRate <= 0) {
            return {
                valid: false,
                error: `Exchange rate must be positive, got ${input.exchangeRate}`,
                code: "INVALID_EXCHANGE_RATE",
                details: { exchangeRate: input.exchangeRate },
            };
        }

        // Calculate converted amount
        const convertedAmount = input.amount * input.exchangeRate;

        return {
            valid: true,
            convertedAmount,
        };
    }

    // Base currency - no conversion needed
    return {
        valid: true,
        convertedAmount: input.amount,
    };
}

/**
 * Currency consistency validation
 */
async function validateCurrencyConsistency(
    input: PaymentProcessingInput,
    baseCurrency: string,
): Promise<{
    valid: boolean;
    error?: string;
    code?: string;
    details?: Record<string, unknown>;
}> {
    // Validate customer currency if customer payment
    if (input.customerId) {
        const customer = await getCustomerById(input.tenantId, input.companyId, input.customerId);
        if (customer && customer.currency !== input.currency) {
            return {
                valid: false,
                error: `Customer currency (${customer.currency}) does not match payment currency (${input.currency})`,
                code: "CURRENCY_MISMATCH",
                details: { customerCurrency: customer.currency, paymentCurrency: input.currency },
            };
        }
    }

    // Validate supplier currency if supplier payment
    if (input.supplierId) {
        const supplier = await getSupplierById(input.tenantId, input.companyId, input.supplierId);
        if (supplier && supplier.currency !== input.currency) {
            return {
                valid: false,
                error: `Supplier currency (${supplier.currency}) does not match payment currency (${input.currency})`,
                code: "CURRENCY_MISMATCH",
                details: { supplierCurrency: supplier.currency, paymentCurrency: input.currency },
            };
        }
    }

    // Validate bank account currency (allow FX conversion scenarios)
    const bankAccount = await getBankAccountById(input.tenantId, input.companyId, input.bankAccountId);
    if (bankAccount && bankAccount.currency !== input.currency && input.currency !== baseCurrency) {
        // Only reject if payment is in foreign currency and bank account is also in foreign currency
        // Allow MYR bank account with foreign currency payments (FX conversion)
        if (bankAccount.currency !== baseCurrency) {
            return {
                valid: false,
                error: `Bank account currency (${bankAccount.currency}) does not match payment currency (${input.currency})`,
                code: "CURRENCY_MISMATCH",
                details: { bankAccountCurrency: bankAccount.currency, paymentCurrency: input.currency },
            };
        }
    }

    return { valid: true };
}

/**
 * Enhanced business rules validation
 */
export function validatePaymentBusinessRules(input: PaymentProcessingInput): {
    valid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    // Validate payment date is not in the future
    const paymentDate = new Date(input.paymentDate);
    if (paymentDate > new Date()) {
        errors.push("Payment date cannot be in the future");
    }

    // Validate currency format
    if (!input.currency || input.currency.length !== 3) {
        errors.push("Currency must be a valid 3-letter ISO code");
    }

    // Validate exchange rate (only if foreign currency)
    if (input.currency !== "MYR" && (input.exchangeRate === undefined || input.exchangeRate <= 0)) {
        errors.push("Exchange rate must be positive for foreign currency");
    }

    // Validate amount
    if (input.amount <= 0) {
        errors.push("Payment amount must be positive");
    }

    // Validate payment method
    const validMethods = ["BANK_TRANSFER", "CHECK", "CASH", "CREDIT_CARD", "DEBIT_CARD", "OTHER"];
    if (!validMethods.includes(input.paymentMethod)) {
        errors.push("Invalid payment method");
    }

    // Validate allocations exist
    if (!input.allocations || input.allocations.length === 0) {
        errors.push("Payment must have at least one allocation");
    }

    // Enhanced allocation validation with overpayment handling
    if (input.allocations) {
        const totalAllocated = input.allocations.reduce((sum, a) => sum + a.allocatedAmount, 0);
        const totalBankCharges = (input.bankCharges || []).reduce((sum, c) => sum + c.amount, 0);
        const totalWithholdingTax = (input.withholdingTax || []).reduce((sum, t) => sum + t.amount, 0);

        const expectedTotal = totalAllocated + totalBankCharges + totalWithholdingTax;

        if (Math.abs(expectedTotal - input.amount) > 0.01) {
            // Allow overpayment for advance/prepayment handling
            if (expectedTotal < input.amount) {
                // This will be handled in buildJournalLines
            } else {
                errors.push(
                    `Total allocated amount (${expectedTotal}) exceeds payment amount (${input.amount})`,
                );
            }
        }

        // Validate each allocation
        for (let i = 0; i < input.allocations.length; i++) {
            const allocation = input.allocations[i];

            if ((allocation?.allocatedAmount || 0) <= 0) {
                errors.push(`Allocation ${i + 1}: Amount must be positive`);
            }

            if (allocation?.type === "BILL" && !allocation.apAccountId) {
                errors.push(`Allocation ${i + 1}: AP account required for bill payments`);
            }

            if (allocation?.type === "INVOICE" && !allocation.arAccountId) {
                errors.push(`Allocation ${i + 1}: AR account required for invoice receipts`);
            }

            if (allocation?.type === "BILL" && !allocation.supplierId) {
                errors.push(`Allocation ${i + 1}: Supplier ID required for bill payments`);
            }

            if (allocation?.type === "INVOICE" && !allocation.customerId) {
                errors.push(`Allocation ${i + 1}: Customer ID required for invoice receipts`);
            }
        }
    }

    // Validate bank charges
    if (input.bankCharges) {
        for (let i = 0; i < input.bankCharges.length; i++) {
            const charge = input.bankCharges[i];
            if ((charge?.amount || 0) <= 0) {
                errors.push(`Bank charge ${i + 1}: Amount must be positive`);
            }
            if (!charge?.accountId) {
                errors.push(`Bank charge ${i + 1}: Account ID is required`);
            }
        }
    }

    // Validate withholding tax
    if (input.withholdingTax) {
        for (let i = 0; i < input.withholdingTax.length; i++) {
            const tax = input.withholdingTax[i];
            if ((tax?.amount || 0) <= 0) {
                errors.push(`Withholding tax ${i + 1}: Amount must be positive`);
            }
            if (!tax?.accountId) {
                errors.push(`Withholding tax ${i + 1}: Account ID is required`);
            }
            if (tax?.rate && (tax.rate <= 0 || tax.rate > 1)) {
                errors.push(`Withholding tax ${i + 1}: Rate must be between 0 and 1`);
            }
        }
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Enhanced journal line building with bank charges and withholding tax
 */
async function buildJournalLines(
    input: PaymentProcessingInput,
    baseCurrency: string,
): Promise<Array<{
    accountId: string;
    debit: number;
    credit: number;
    description: string;
    reference?: string;
}>> {
    const journalLines: Array<{
        accountId: string;
        debit: number;
        credit: number;
        description: string;
        reference?: string;
    }> = [];

    const exchangeRate = input.currency === baseCurrency ? 1 : input.exchangeRate;
    const convertedAmount = input.amount * exchangeRate;

    // Group allocations by type
    const billAllocations = input.allocations.filter(a => a.type === "BILL");
    const invoiceAllocations = input.allocations.filter(a => a.type === "INVOICE");

    // Process bill payments (outgoing payments)
    if (billAllocations.length > 0) {
        // Debit AP accounts for each bill allocation
        for (const allocation of billAllocations) {
            const convertedAllocation = allocation.allocatedAmount * exchangeRate;

            journalLines.push({
                accountId: allocation.apAccountId!,
                debit: convertedAllocation,
                credit: 0,
                description: `Payment ${input.paymentNumber} - Bill ${allocation.documentNumber}`,
                reference: input.paymentNumber,
            });
        }

        // Credit bank account (total outgoing)
        const totalBillPayments = billAllocations.reduce((sum, a) => sum + a.allocatedAmount, 0) * exchangeRate;
        journalLines.push({
            accountId: input.bankAccountId,
            debit: 0,
            credit: totalBillPayments,
            description: `Payment ${input.paymentNumber} - ${input.paymentMethod}`,
            reference: input.paymentNumber,
        });
    }

    // Process invoice receipts (incoming payments)
    if (invoiceAllocations.length > 0) {
        // Debit bank account (full payment amount)
        const totalPaymentAmount = input.amount * exchangeRate;
        journalLines.push({
            accountId: input.bankAccountId,
            debit: totalPaymentAmount,
            credit: 0,
            description: `Receipt ${input.paymentNumber} - ${input.paymentMethod}`,
            reference: input.paymentNumber,
        });

        // Credit AR accounts for each invoice allocation
        for (const allocation of invoiceAllocations) {
            const convertedAllocation = allocation.allocatedAmount * exchangeRate;

            journalLines.push({
                accountId: allocation.arAccountId!,
                debit: 0,
                credit: convertedAllocation,
                description: `Receipt ${input.paymentNumber} - Invoice ${allocation.documentNumber}`,
                reference: input.paymentNumber,
            });
        }
    }

    // Process bank charges
    if (input.bankCharges && input.bankCharges.length > 0) {
        for (const charge of input.bankCharges) {
            const convertedCharge = charge.amount * exchangeRate;

            // Credit bank charges expense (to balance the journal)
            journalLines.push({
                accountId: charge.accountId,
                debit: 0,
                credit: convertedCharge,
                description: `Bank charge - ${charge.description}`,
                reference: input.paymentNumber,
            });
        }
    }

    // Process withholding tax
    if (input.withholdingTax && input.withholdingTax.length > 0) {
        for (const tax of input.withholdingTax) {
            const convertedTax = tax.amount * exchangeRate;

            // Debit withholding tax expense (reduces payment amount)
            journalLines.push({
                accountId: tax.accountId,
                debit: convertedTax,
                credit: 0,
                description: `Withholding tax - ${tax.description}`,
                reference: input.paymentNumber,
            });

            // Credit withholding tax payable
            journalLines.push({
                accountId: "wht-payable-2100", // This should be configurable
                debit: 0,
                credit: convertedTax,
                description: `Withholding tax payable - ${tax.description}`,
                reference: input.paymentNumber,
            });
        }
    }

    // Handle overpayment with advance/prepayment accounts
    const totalAllocated = input.allocations.reduce((sum, a) => sum + a.allocatedAmount, 0);
    const totalBankCharges = (input.bankCharges || []).reduce((sum, c) => sum + c.amount, 0);
    const totalWithholdingTax = (input.withholdingTax || []).reduce((sum, t) => sum + t.amount, 0);
    const expectedTotal = totalAllocated + totalBankCharges + totalWithholdingTax;

    if (expectedTotal < input.amount) {
        const overpaymentAmount = input.amount - expectedTotal;
        const convertedOverpayment = overpaymentAmount * exchangeRate;

        // Determine party type and ID for advance account
        const partyType = input.customerId ? 'CUSTOMER' : 'SUPPLIER';
        const partyId = input.customerId || input.supplierId!;

        // Get or create advance account
        const advanceAccount = await getOrCreateAdvanceAccount(
            input.tenantId,
            input.companyId,
            partyType,
            partyId,
            input.currency,
            "advance-account-1100" // Use the actual account ID from the accounts map
        );

        // Add advance account journal line (credit because it's money owed to customer)
        journalLines.push({
            accountId: advanceAccount.accountId,
            debit: 0,
            credit: convertedOverpayment,
            description: `Advance payment - ${input.paymentNumber}`,
            reference: input.paymentNumber,
        });

        // Update advance account balance
        await updateAdvanceAccountBalance(
            input.tenantId,
            input.companyId,
            partyType,
            partyId,
            input.currency,
            overpaymentAmount
        );
    }

    return journalLines;
}

/**
 * Generate payment number if not provided
 */
export function generatePaymentNumber(
    companyCode: string,
    sequence: number,
    type: "OUT" | "IN" = "OUT",
): string {
    const year = new Date().getFullYear();
    const paddedSequence = sequence.toString().padStart(6, "0");
    const prefix = type === "OUT" ? "PAY" : "REC";
    return `${prefix}-${companyCode}-${year}-${paddedSequence}`;
}

/**
 * Calculate payment summary by type
 */
export function calculatePaymentSummary(allocations: PaymentAllocationInput[]): {
    billPayments: number;
    invoiceReceipts: number;
    totalAmount: number;
} {
    const billPayments = allocations
        .filter(a => a.type === "BILL")
        .reduce((sum, a) => sum + a.allocatedAmount, 0);

    const invoiceReceipts = allocations
        .filter(a => a.type === "INVOICE")
        .reduce((sum, a) => sum + a.allocatedAmount, 0);

    return {
        billPayments,
        invoiceReceipts,
        totalAmount: billPayments + invoiceReceipts,
    };
}
