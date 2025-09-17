/**
 * Enhanced Test Factories for Integration Tests
 *
 * Provides comprehensive, scenario-driven test data factories that:
 * - Generate realistic test data
 * - Support multiple currencies and scenarios
 * - Include business rule validation
 * - Provide data builders for complex scenarios
 */

import type { PoolClient } from "pg";
import {
    ACCOUNT_IDS,
    CURRENCIES,
    PAYMENT_TYPES,
    ALLOCATION_TYPES,
    VALIDATION_RULES,
    type Currency,
    type PaymentType,
    type AllocationType
} from "../../packages/accounting/src/metadata/enhanced-account-mapping";
import {
    type EnhancedSeededData,
    buildInvoice,
    buildBill,
    getBankAccountForCurrency,
    getCustomerForCurrency,
    getSupplierForCurrency
} from "./enhanced-seed";

// ============================================================================
// PAYMENT FACTORY INTERFACES
// ============================================================================

export interface PaymentInputBuilder {
    tenantId: string;
    companyId: string;
    paymentId?: string;
    paymentNumber?: string;
    paymentDate?: Date;
    paymentMethod?: 'BANK_TRANSFER' | 'CASH' | 'CHEQUE' | 'CARD';
    currency: Currency;
    amount: number;
    bankAccountId: string;
    exchangeRate?: number;
    customerId?: string;
    supplierId?: string;
    allocations: PaymentAllocationInput[];
    bankCharges?: BankChargeInput[];
    withholdingTax?: WithholdingTaxInput[];
    description?: string;
}

export interface PaymentAllocationInput {
    type: AllocationType;
    documentId: string;
    documentNumber: string;
    customerId?: string;
    supplierId?: string;
    allocatedAmount: number;
    arAccountId?: string;
    apAccountId?: string;
    currency?: Currency;
}

export interface BankChargeInput {
    amount: number;
    description: string;
    accountId: string;
    currency?: Currency;
}

export interface WithholdingTaxInput {
    amount: number;
    description: string;
    accountId: string;
    currency?: Currency;
}

export interface PaymentResult {
    success: boolean;
    journalId?: string;
    journalNumber?: string;
    totalAmount: number;
    allocationsProcessed: number;
    lines: Array<{
        accountId: string;
        debit: number;
        credit: number;
        description: string;
        reference?: string;
    }>;
    error?: string;
    code?: string;
    details?: any;
}

// ============================================================================
// CORE PAYMENT FACTORY
// ============================================================================

export class PaymentFactory {
    private seeded: EnhancedSeededData;
    private schema: string;

    constructor(seeded: EnhancedSeededData, schema: string) {
        this.seeded = seeded;
        this.schema = schema;
    }

    /**
     * Create a basic customer payment
     */
    async createCustomerPayment(
        c: PoolClient,
        options: {
            amount?: number;
            currency?: Currency;
            invoiceAmount?: number;
            taxRate?: number;
            overpayment?: number;
            bankCharges?: number;
            description?: string;
        } = {}
    ): Promise<{ paymentInput: PaymentInputBuilder; invoice: any }> {
        const currency = options.currency || CURRENCIES.MYR;
        const invoiceAmount = options.invoiceAmount || 1000;
        const taxRate = options.taxRate || 0.1;
        const taxAmount = invoiceAmount * taxRate;
        const totalInvoiceAmount = invoiceAmount + taxAmount;
        const overpayment = options.overpayment || 0;
        const amount = totalInvoiceAmount + overpayment;
        const bankCharges = options.bankCharges || 0;

        // Create invoice
        const invoice = await buildInvoice(c, this.schema, {
            customerId: getCustomerForCurrency(currency),
            currency,
            totalAmount: invoiceAmount,
            taxRate,
            status: 'APPROVED',
            lines: [{
                accountId: ACCOUNT_IDS.REVENUE,
                description: options.description || 'Test Product/Service',
                quantity: 1,
                unitPrice: invoiceAmount,
                taxRate
            }]
        });

        // Build payment input
        const paymentInput: PaymentInputBuilder = {
            tenantId: this.seeded.tenantId,
            companyId: this.seeded.companyId,
            paymentId: `pay_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            paymentNumber: `PAY-${Date.now()}`,
            paymentDate: new Date(),
            paymentMethod: 'BANK_TRANSFER',
            currency,
            amount,
            bankAccountId: getBankAccountForCurrency(currency),
            exchangeRate: currency === CURRENCIES.MYR ? 1 : 4.2, // Mock FX rate
            customerId: getCustomerForCurrency(currency),
            allocations: [{
                type: ALLOCATION_TYPES.INVOICE,
                documentId: invoice.id,
                documentNumber: invoice.invoiceNumber,
                customerId: getCustomerForCurrency(currency),
                allocatedAmount: totalInvoiceAmount,
                arAccountId: ACCOUNT_IDS.AR,
                currency
            }],
            bankCharges: bankCharges > 0 ? [{
                amount: bankCharges,
                description: 'Bank processing fee',
                accountId: ACCOUNT_IDS.FEES,
                currency
            }] : [],
            description: options.description || 'Customer payment'
        };

        return { paymentInput, invoice };
    }

    /**
     * Create a supplier payment
     */
    async createSupplierPayment(
        c: PoolClient,
        options: {
            amount?: number;
            currency?: Currency;
            billAmount?: number;
            taxRate?: number;
            overpayment?: number;
            bankCharges?: number;
            description?: string;
        } = {}
    ): Promise<{ paymentInput: PaymentInputBuilder; bill: any }> {
        const currency = options.currency || CURRENCIES.MYR;
        const billAmount = options.billAmount || 1000;
        const taxRate = options.taxRate || 0.1;
        const taxAmount = billAmount * taxRate;
        const totalBillAmount = billAmount + taxAmount;
        const overpayment = options.overpayment || 0;
        const amount = totalBillAmount + overpayment;
        const bankCharges = options.bankCharges || 0;

        // Create bill
        const bill = await buildBill(c, this.schema, {
            supplierId: getSupplierForCurrency(currency),
            currency,
            totalAmount: billAmount,
            taxRate,
            status: 'APPROVED',
            lines: [{
                accountId: ACCOUNT_IDS.COGS,
                description: options.description || 'Test Product/Service',
                quantity: 1,
                unitPrice: billAmount,
                taxRate
            }]
        });

        // Build payment input
        const paymentInput: PaymentInputBuilder = {
            tenantId: this.seeded.tenantId,
            companyId: this.seeded.companyId,
            paymentId: `pay_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            paymentNumber: `PAY-${Date.now()}`,
            paymentDate: new Date(),
            paymentMethod: 'BANK_TRANSFER',
            currency,
            amount,
            bankAccountId: getBankAccountForCurrency(currency),
            exchangeRate: currency === CURRENCIES.MYR ? 1 : 4.2, // Mock FX rate
            supplierId: getSupplierForCurrency(currency),
            allocations: [{
                type: ALLOCATION_TYPES.BILL,
                documentId: bill.id,
                documentNumber: bill.billNumber,
                supplierId: getSupplierForCurrency(currency),
                allocatedAmount: totalBillAmount,
                apAccountId: ACCOUNT_IDS.AP,
                currency
            }],
            bankCharges: bankCharges > 0 ? [{
                amount: bankCharges,
                description: 'Bank processing fee',
                accountId: ACCOUNT_IDS.FEES,
                currency
            }] : [],
            description: options.description || 'Supplier payment'
        };

        return { paymentInput, bill };
    }

    /**
     * Create a multi-currency payment with FX conversion
     */
    async createMultiCurrencyPayment(
        c: PoolClient,
        options: {
            paymentCurrency: Currency;
            invoiceCurrency: Currency;
            amount: number;
            exchangeRate: number;
            description?: string;
        }
    ): Promise<{ paymentInput: PaymentInputBuilder; invoice: any }> {
        const { paymentCurrency, invoiceCurrency, amount, exchangeRate, description } = options;

        // Create invoice in invoice currency
        const invoice = await buildInvoice(c, this.schema, {
            customerId: getCustomerForCurrency(invoiceCurrency),
            currency: invoiceCurrency,
            totalAmount: amount,
            taxRate: 0.1,
            status: 'APPROVED',
            lines: [{
                accountId: ACCOUNT_IDS.REVENUE,
                description: description || 'Multi-currency Product/Service',
                quantity: 1,
                unitPrice: amount,
                taxRate: 0.1
            }]
        });

        // Convert amount to payment currency
        const convertedAmount = amount * exchangeRate;

        const paymentInput: PaymentInputBuilder = {
            tenantId: this.seeded.tenantId,
            companyId: this.seeded.companyId,
            paymentId: `pay_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            paymentNumber: `PAY-${Date.now()}`,
            paymentDate: new Date(),
            paymentMethod: 'BANK_TRANSFER',
            currency: paymentCurrency,
            amount: convertedAmount,
            bankAccountId: getBankAccountForCurrency(paymentCurrency),
            exchangeRate,
            customerId: getCustomerForCurrency(invoiceCurrency),
            allocations: [{
                type: ALLOCATION_TYPES.INVOICE,
                documentId: invoice.id,
                documentNumber: invoice.invoiceNumber,
                customerId: getCustomerForCurrency(invoiceCurrency),
                allocatedAmount: amount, // Original amount in invoice currency
                arAccountId: ACCOUNT_IDS.AR,
                currency: invoiceCurrency
            }],
            description: description || 'Multi-currency payment'
        };

        return { paymentInput, invoice };
    }

    /**
     * Create a complex payment with multiple allocations
     */
    async createComplexPayment(
        c: PoolClient,
        options: {
            currency?: Currency;
            allocations: Array<{
                type: AllocationType;
                amount: number;
                taxRate?: number;
                description?: string;
            }>;
            bankCharges?: number;
            withholdingTax?: number;
            description?: string;
        }
    ): Promise<{ paymentInput: PaymentInputBuilder; documents: any[] }> {
        const currency = options.currency || CURRENCIES.MYR;
        const documents: any[] = [];
        const paymentAllocations: PaymentAllocationInput[] = [];
        let totalAmount = 0;

        // Create documents for each allocation
        for (const allocation of options.allocations) {
            let document: any;

            if (allocation.type === ALLOCATION_TYPES.INVOICE) {
                document = await buildInvoice(c, this.schema, {
                    customerId: getCustomerForCurrency(currency),
                    currency,
                    totalAmount: allocation.amount,
                    taxRate: allocation.taxRate || 0.1,
                    status: 'APPROVED',
                    lines: [{
                        accountId: ACCOUNT_IDS.REVENUE,
                        description: allocation.description || 'Test Product/Service',
                        quantity: 1,
                        unitPrice: allocation.amount,
                        taxRate: allocation.taxRate || 0.1
                    }]
                });

                paymentAllocations.push({
                    type: ALLOCATION_TYPES.INVOICE,
                    documentId: document.id,
                    documentNumber: document.invoiceNumber,
                    customerId: getCustomerForCurrency(currency),
                    allocatedAmount: document.openAmount,
                    arAccountId: ACCOUNT_IDS.AR,
                    currency
                });
            } else if (allocation.type === ALLOCATION_TYPES.BILL) {
                document = await buildBill(c, this.schema, {
                    supplierId: getSupplierForCurrency(currency),
                    currency,
                    totalAmount: allocation.amount,
                    taxRate: allocation.taxRate || 0.1,
                    status: 'APPROVED',
                    lines: [{
                        accountId: ACCOUNT_IDS.COGS,
                        description: allocation.description || 'Test Product/Service',
                        quantity: 1,
                        unitPrice: allocation.amount,
                        taxRate: allocation.taxRate || 0.1
                    }]
                });

                paymentAllocations.push({
                    type: ALLOCATION_TYPES.BILL,
                    documentId: document.id,
                    documentNumber: document.billNumber,
                    supplierId: getSupplierForCurrency(currency),
                    allocatedAmount: document.openAmount,
                    apAccountId: ACCOUNT_IDS.AP,
                    currency
                });
            }

            documents.push(document);
            totalAmount += document.openAmount;
        }

        // Add bank charges and withholding tax
        const bankCharges = options.bankCharges || 0;
        const withholdingTax = options.withholdingTax || 0;
        totalAmount += bankCharges + withholdingTax;

        const paymentInput: PaymentInputBuilder = {
            tenantId: this.seeded.tenantId,
            companyId: this.seeded.companyId,
            paymentId: `pay_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            paymentNumber: `PAY-${Date.now()}`,
            paymentDate: new Date(),
            paymentMethod: 'BANK_TRANSFER',
            currency,
            amount: totalAmount,
            bankAccountId: getBankAccountForCurrency(currency),
            exchangeRate: 1,
            allocations: paymentAllocations,
            bankCharges: bankCharges > 0 ? [{
                amount: bankCharges,
                description: 'Bank processing fee',
                accountId: ACCOUNT_IDS.FEES,
                currency
            }] : [],
            withholdingTax: withholdingTax > 0 ? [{
                amount: withholdingTax,
                description: 'Withholding tax',
                accountId: ACCOUNT_IDS.TAX,
                currency
            }] : [],
            description: options.description || 'Complex payment'
        };

        return { paymentInput, documents };
    }
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export function validatePaymentResult(
    result: PaymentResult,
    expectedAmount: number,
    expectedAllocations: number,
    expectedLines: number
): void {
    expect(result.success).toBe(true);
    if (result.success) {
        expect(result.totalAmount).toBeCloseTo(expectedAmount, VALIDATION_RULES.ROUNDING_PRECISION);
        expect(result.allocationsProcessed).toBe(expectedAllocations);
        expect(result.lines).toHaveLength(expectedLines);

        // Verify journal is balanced
        const totalDebits = result.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
        const totalCredits = result.lines.reduce((sum, line) => sum + (line.credit || 0), 0);
        expect(totalDebits).toBeCloseTo(totalCredits, VALIDATION_RULES.ROUNDING_PRECISION);
    }
}

export function validateOverpaymentResult(
    result: PaymentResult,
    expectedOverpayment: number,
    overpaymentAccountId: string
): void {
    expect(result.success).toBe(true);
    if (result.success) {
        const overpaymentLine = result.lines.find(line => line.accountId === overpaymentAccountId);
        expect(overpaymentLine).toBeDefined();
        expect(overpaymentLine?.credit || overpaymentLine?.debit || 0).toBeCloseTo(
            expectedOverpayment,
            VALIDATION_RULES.ROUNDING_PRECISION
        );
    }
}

export function validateFXResult(
    result: PaymentResult,
    expectedFXGain: number | null,
    expectedFXLoss: number | null
): void {
    expect(result.success).toBe(true);
    if (result.success) {
        if (expectedFXGain !== null) {
            const fxGainLine = result.lines.find(line => line.accountId === ACCOUNT_IDS.FX_GAIN);
            expect(fxGainLine).toBeDefined();
            expect(fxGainLine?.credit || 0).toBeCloseTo(expectedFXGain, VALIDATION_RULES.ROUNDING_PRECISION);
        }

        if (expectedFXLoss !== null) {
            const fxLossLine = result.lines.find(line => line.accountId === ACCOUNT_IDS.FX_LOSS);
            expect(fxLossLine).toBeDefined();
            expect(fxLossLine?.debit || 0).toBeCloseTo(expectedFXLoss, VALIDATION_RULES.ROUNDING_PRECISION);
        }
    }
}

// ============================================================================
// SCENARIO BUILDERS
// ============================================================================

export class ScenarioBuilder {
    private factory: PaymentFactory;

    constructor(seeded: EnhancedSeededData, schema: string) {
        this.factory = new PaymentFactory(seeded, schema);
    }

    /**
     * Build a basic customer payment scenario
     */
    async buildBasicCustomerPayment(c: PoolClient) {
        return this.factory.createCustomerPayment(c, {
            amount: 1100,
            currency: CURRENCIES.MYR,
            invoiceAmount: 1000,
            taxRate: 0.1
        });
    }

    /**
     * Build an overpayment scenario
     */
    async buildOverpaymentScenario(c: PoolClient) {
        return this.factory.createCustomerPayment(c, {
            amount: 1500,
            currency: CURRENCIES.MYR,
            invoiceAmount: 1000,
            taxRate: 0.1,
            overpayment: 400
        });
    }

    /**
     * Build a multi-currency scenario
     */
    async buildMultiCurrencyScenario(c: PoolClient) {
        return this.factory.createMultiCurrencyPayment(c, {
            paymentCurrency: CURRENCIES.USD,
            invoiceCurrency: CURRENCIES.MYR,
            amount: 1000,
            exchangeRate: 4.2
        });
    }

    /**
     * Build a supplier payment scenario
     */
    async buildSupplierPaymentScenario(c: PoolClient) {
        return this.factory.createSupplierPayment(c, {
            amount: 1100,
            currency: CURRENCIES.MYR,
            billAmount: 1000,
            taxRate: 0.1
        });
    }

    /**
     * Build a complex payment scenario
     */
    async buildComplexPaymentScenario(c: PoolClient) {
        return this.factory.createComplexPayment(c, {
            currency: CURRENCIES.MYR,
            allocations: [
                { type: ALLOCATION_TYPES.INVOICE, amount: 1000, taxRate: 0.1, description: 'Product A' },
                { type: ALLOCATION_TYPES.INVOICE, amount: 500, taxRate: 0.1, description: 'Product B' },
                { type: ALLOCATION_TYPES.BILL, amount: 800, taxRate: 0.1, description: 'Service C' }
            ],
            bankCharges: 25,
            withholdingTax: 50
        });
    }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function createPaymentFactory(seeded: EnhancedSeededData, schema: string): PaymentFactory {
    return new PaymentFactory(seeded, schema);
}

export function createScenarioBuilder(seeded: EnhancedSeededData, schema: string): ScenarioBuilder {
    return new ScenarioBuilder(seeded, schema);
}

export function generatePaymentId(): string {
    return `pay_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

export function generatePaymentNumber(): string {
    return `PAY-${Date.now()}`;
}

export function calculateTaxAmount(amount: number, taxRate: number): number {
    return Math.round(amount * taxRate * 100) / 100;
}

export function roundToPrecision(amount: number, precision: number = VALIDATION_RULES.ROUNDING_PRECISION): number {
    return Math.round(amount * Math.pow(10, precision)) / Math.pow(10, precision);
}
