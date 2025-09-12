// D3 AP Payment Processing Engine - Payment to GL Integration
import { validateJournalPosting, type JournalPostingInput, type PostingContext } from '../posting';
import { validateFxPolicy } from '../fx/policy';

export interface PaymentProcessingInput {
    tenantId: string;
    companyId: string;
    paymentId: string;
    paymentNumber: string;
    paymentDate: string;
    paymentMethod: 'BANK_TRANSFER' | 'CHECK' | 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'OTHER';
    bankAccountId: string;
    currency: string;
    exchangeRate: number;
    amount: number;
    reference?: string;
    description?: string;
    allocations: PaymentAllocationInput[];
}

export interface PaymentAllocationInput {
    type: 'BILL' | 'INVOICE';
    documentId: string; // billId or invoiceId
    documentNumber: string;
    supplierId?: string; // For bill payments
    customerId?: string; // For invoice receipts
    allocatedAmount: number;
    apAccountId?: string; // For bill payments
    arAccountId?: string; // For invoice receipts
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
}

export interface PaymentProcessingError {
    success: false;
    error: string;
    code: string;
    details?: Record<string, unknown>;
}

/**
 * Validates and posts a payment to the General Ledger
 * 
 * Journal Entry Structure for Bill Payment:
 * Dr. Accounts Payable                XXX
 *     Cr. Bank Account                    XXX
 * 
 * Journal Entry Structure for Invoice Receipt:
 * Dr. Bank Account                    XXX
 *     Cr. Accounts Receivable             XXX
 */
export async function validatePaymentProcessing(
    input: PaymentProcessingInput,
    userId: string,
    userRole: string,
    baseCurrency: string = 'MYR'
): Promise<PaymentProcessingResult | PaymentProcessingError> {

    try {
        // 1. Validate FX policy if foreign currency
        if (input.currency !== baseCurrency) {
            validateFxPolicy(
                baseCurrency,
                input.currency
            );

            // FX validation passed - we have the required rate info
        }

        // 2. Validate payment business rules
        const businessValidation = validatePaymentBusinessRules(input);
        if (!businessValidation.valid) {
            return {
                success: false,
                error: `Payment validation failed: ${businessValidation.errors.join(', ')}`,
                code: 'PAYMENT_VALIDATION_FAILED',
                details: { errors: businessValidation.errors }
            };
        }

        // 3. Build journal lines based on payment type
        const journalLines = [];
        const convertedAmount = input.amount * input.exchangeRate;

        // Group allocations by type
        const billAllocations = input.allocations.filter(a => a.type === 'BILL');
        const invoiceAllocations = input.allocations.filter(a => a.type === 'INVOICE');

        // Process bill payments (outgoing payments)
        if (billAllocations.length > 0) {
            // Debit AP accounts for each bill allocation
            for (const allocation of billAllocations) {
                const convertedAllocation = allocation.allocatedAmount * input.exchangeRate;

                journalLines.push({
                    accountId: allocation.apAccountId!,
                    debit: convertedAllocation,
                    credit: 0,
                    description: `Payment ${input.paymentNumber} - Bill ${allocation.documentNumber}`,
                    reference: input.paymentNumber
                });
            }

            // Credit bank account (total outgoing)
            const totalBillPayments = billAllocations.reduce((sum, a) => sum + a.allocatedAmount, 0) * input.exchangeRate;
            journalLines.push({
                accountId: input.bankAccountId,
                debit: 0,
                credit: totalBillPayments,
                description: `Payment ${input.paymentNumber} - ${input.paymentMethod}`,
                reference: input.paymentNumber
            });
        }

        // Process invoice receipts (incoming payments)
        if (invoiceAllocations.length > 0) {
            // Debit bank account (total incoming)
            const totalInvoiceReceipts = invoiceAllocations.reduce((sum, a) => sum + a.allocatedAmount, 0) * input.exchangeRate;
            journalLines.push({
                accountId: input.bankAccountId,
                debit: totalInvoiceReceipts,
                credit: 0,
                description: `Receipt ${input.paymentNumber} - ${input.paymentMethod}`,
                reference: input.paymentNumber
            });

            // Credit AR accounts for each invoice allocation
            for (const allocation of invoiceAllocations) {
                const convertedAllocation = allocation.allocatedAmount * input.exchangeRate;

                journalLines.push({
                    accountId: allocation.arAccountId!,
                    debit: 0,
                    credit: convertedAllocation,
                    description: `Receipt ${input.paymentNumber} - Invoice ${allocation.documentNumber}`,
                    reference: input.paymentNumber
                });
            }
        }

        // 4. Create posting context for SoD validation
        const context: PostingContext = {
            tenantId: input.tenantId,
            companyId: input.companyId,
            userId,
            userRole
        };

        // 5. Prepare journal posting input
        const journalInput: JournalPostingInput = {
            context,
            journalNumber: `PAY-${input.paymentNumber}`,
            description: input.description || `Payment ${input.paymentNumber} - ${input.paymentMethod}`,
            journalDate: new Date(input.paymentDate),
            currency: baseCurrency, // Always post in base currency
            lines: journalLines
        };

        // 6. Validate journal posting (includes SoD, COA, balance checks)
        const validation = await validateJournalPosting(journalInput);

        if (!validation.validated) {
            return {
                success: false,
                error: 'Journal validation failed',
                code: 'JOURNAL_VALIDATION_FAILED',
                details: validation
            };
        }

        // 7. Return successful validation result
        return {
            success: true,
            journalId: '', // Will be set when actually posted
            journalNumber: journalInput.journalNumber,
            totalAmount: convertedAmount,
            allocationsProcessed: input.allocations.length,
            lines: journalLines.map(line => ({
                accountId: line.accountId,
                debit: line.debit,
                credit: line.credit,
                description: line.description
            }))
        };

    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            code: 'PAYMENT_PROCESSING_ERROR',
            details: error as Record<string, unknown>
        };
    }
}

/**
 * Validate payment business rules
 */
export function validatePaymentBusinessRules(input: PaymentProcessingInput): {
    valid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    // Validate payment date is not in the future
    const paymentDate = new Date(input.paymentDate);
    if (paymentDate > new Date()) {
        errors.push('Payment date cannot be in the future');
    }

    // Validate currency format
    if (!input.currency || input.currency.length !== 3) {
        errors.push('Currency must be a valid 3-letter ISO code');
    }

    // Validate exchange rate
    if (input.exchangeRate <= 0) {
        errors.push('Exchange rate must be positive');
    }

    // Validate amount
    if (input.amount <= 0) {
        errors.push('Payment amount must be positive');
    }

    // Validate payment method
    const validMethods = ['BANK_TRANSFER', 'CHECK', 'CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'OTHER'];
    if (!validMethods.includes(input.paymentMethod)) {
        errors.push('Invalid payment method');
    }

    // Validate allocations exist
    if (!input.allocations || input.allocations.length === 0) {
        errors.push('Payment must have at least one allocation');
    }

    // Validate allocation totals match payment amount
    if (input.allocations) {
        const totalAllocated = input.allocations.reduce((sum, a) => sum + a.allocatedAmount, 0);
        if (Math.abs(totalAllocated - input.amount) > 0.01) {
            errors.push(`Total allocated amount (${totalAllocated}) does not match payment amount (${input.amount})`);
        }

        // Validate each allocation
        for (let i = 0; i < input.allocations.length; i++) {
            const allocation = input.allocations[i];

            if ((allocation?.allocatedAmount || 0) <= 0) {
                errors.push(`Allocation ${i + 1}: Amount must be positive`);
            }

            if (allocation?.type === 'BILL' && !allocation.apAccountId) {
                errors.push(`Allocation ${i + 1}: AP account required for bill payments`);
            }

            if (allocation?.type === 'INVOICE' && !allocation.arAccountId) {
                errors.push(`Allocation ${i + 1}: AR account required for invoice receipts`);
            }

            if (allocation?.type === 'BILL' && !allocation.supplierId) {
                errors.push(`Allocation ${i + 1}: Supplier ID required for bill payments`);
            }

            if (allocation?.type === 'INVOICE' && !allocation.customerId) {
                errors.push(`Allocation ${i + 1}: Customer ID required for invoice receipts`);
            }
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Generate payment number if not provided
 */
export function generatePaymentNumber(companyCode: string, sequence: number, type: 'OUT' | 'IN' = 'OUT'): string {
    const year = new Date().getFullYear();
    const paddedSequence = sequence.toString().padStart(6, '0');
    const prefix = type === 'OUT' ? 'PAY' : 'REC';
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
        .filter(a => a.type === 'BILL')
        .reduce((sum, a) => sum + a.allocatedAmount, 0);

    const invoiceReceipts = allocations
        .filter(a => a.type === 'INVOICE')
        .reduce((sum, a) => sum + a.allocatedAmount, 0);

    return {
        billPayments: Math.round(billPayments * 100) / 100,
        invoiceReceipts: Math.round(invoiceReceipts * 100) / 100,
        totalAmount: Math.round((billPayments + invoiceReceipts) * 100) / 100
    };
}

/**
 * Validate payment allocation against outstanding balances
 */
export function validatePaymentAllocations(
    allocations: PaymentAllocationInput[],
    outstandingBalances: Map<string, number>
): {
    valid: boolean;
    errors: string[];
    warnings: string[];
} {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const allocation of allocations) {
        const outstandingBalance = outstandingBalances.get(allocation.documentId) || 0;

        if (allocation.allocatedAmount > outstandingBalance) {
            if (outstandingBalance === 0) {
                errors.push(`Document ${allocation.documentNumber} has no outstanding balance`);
            } else {
                warnings.push(`Document ${allocation.documentNumber}: Allocated amount (${allocation.allocatedAmount}) exceeds outstanding balance (${outstandingBalance})`);
            }
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}
