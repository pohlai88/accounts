// @ts-nocheck
// Test factories - Reusable, consistent test data generation
import { testConfig } from './config/test-config';

export const MYR = 'MYR' as const;
export const USD = 'USD' as const;

// Account factory with proper defaults
export function makeAccount(partial: Partial<Account> = {}): Account {
    return {
        id: crypto.randomUUID(),
        code: '1100',
        name: 'Accounts Receivable',
        currency: MYR, // Default to base currency
        type: 'ASSET',
        isActive: true,
        ...partial,
    };
}

// Invoice input factory with all required fields
export function makeInvoiceInput(partial: Partial<InvoicePostingInput> = {}): InvoicePostingInput {
    return {
        tenantId: testConfig.testData.tenantId,
        companyId: testConfig.testData.companyId,
        invoiceId: 'test-invoice-001',
        invoiceNumber: 'INV-001',
        customerId: 'test-customer-001',
        customerName: 'Test Customer',
        invoiceDate: '2024-01-01',
        currency: MYR,
        exchangeRate: 1.0,
        arAccountId: 'test-ar-account',
        lines: [
            {
                lineNumber: 1,
                description: 'Test Product',
                quantity: 1,
                unitPrice: 100.00,
                lineAmount: 100.00,
                revenueAccountId: 'test-revenue-account',
            },
        ],
        ...partial,
    };
}

// Invoice with tax factory
export function makeInvoiceWithTax(partial: Partial<InvoicePostingInput> = {}): InvoicePostingInput {
    const base = makeInvoiceInput(partial);
    return {
        ...base,
        taxLines: [
            {
                id: 'tax-1',
                taxCode: 'SST',
                taxRate: 0.10,
                taxAmount: 10.00,
                taxAccountId: 'test-tax-account',
            },
        ],
    };
}

// Foreign currency invoice factory
export function makeForeignCurrencyInvoice(partial: Partial<InvoicePostingInput> = {}): InvoicePostingInput {
    return makeInvoiceInput({
        currency: USD,
        exchangeRate: 4.20, // USD to MYR rate
        ...partial,
    });
}

// Account map factory for mocks
export function makeAccountMap(accounts: Account[]): Map<string, Account> {
    return new Map(accounts.map(acc => [acc.id, acc]));
}

// Types for the factories
export interface Account {
    id: string;
    code: string;
    name: string;
    currency: string;
    type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
    isActive: boolean;
}

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
    arAccountId: string;
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
    id: string;
    taxCode: string;
    taxRate: number;
    taxAmount: number;
    taxAccountId: string;
}

// Bill posting factories
export function makeBillLine(partial: Partial<any> = {}): any {
    return {
        lineNumber: 1,
        description: 'Test Product',
        quantity: 1,
        unitPrice: 100.00,
        lineAmount: 100.00,
        expenseAccountId: 'test-expense-account',
        ...partial,
    };
}

export function makeBillInput(partial: Partial<any> = {}): any {
    return {
        tenantId: testConfig.testData.tenantId,
        companyId: testConfig.testData.companyId,
        billId: crypto.randomUUID(),
        billNumber: "BILL-001",
        supplierId: "test-supplier-001",
        supplierName: "Test Supplier",
        billDate: "2024-01-01",
        currency: MYR,
        exchangeRate: 1.0,
        apAccountId: "test-ap-account",
        lines: [makeBillLine()],
        ...partial,
    };
}

// Payment Processing Factories
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

export function makePaymentInput(partial: Partial<PaymentProcessingInput> = {}): PaymentProcessingInput {
    return {
        tenantId: "t1",
        companyId: "c1",
        paymentId: "PAY-001",
        paymentNumber: "PAY-001",
        paymentDate: "2025-01-01",
        paymentMethod: "BANK_TRANSFER",
        bankAccountId: "bank-1000",
        currency: MYR,
        exchangeRate: 1.0,
        amount: 100,
        reference: "REF-001",
        description: "Test Payment",
        allocations: [],
        ...partial,
    };
}

export function makePaymentAllocation(partial: Partial<PaymentAllocationInput> = {}): PaymentAllocationInput {
    return {
        type: "INVOICE",
        documentId: "inv-1",
        documentNumber: "INV-001",
        customerId: "cust-1",
        allocatedAmount: 100,
        arAccountId: "test-ar-account",
        ...partial,
    };
}
