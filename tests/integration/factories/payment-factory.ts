/**
 * Payment Test Data Factory
 *
 * Uses standardized metadata mapping to create consistent test data
 * and eliminate field name debugging issues.
 */

import {
    TEST_ACCOUNT_IDS,
    getTestAccountId,
    getPaymentTypeFromAllocation,
    ALLOCATION_TYPES,
    VALIDATION_CONSTANTS
} from '../../../packages/accounting/src/metadata/account-mapping';

// ============================================================================
// STANDARDIZED TEST DATA FACTORY
// ============================================================================

export interface PaymentTestData {
    // Core identifiers
    tenantId: string;
    companyId: string;
    customerId: string;
    supplierId: string;

    // Account mappings
    accounts: {
        bank: string;
        ar: string;
        ap: string;
        tax: string;
        rev: string;
        fee: string;
        advCustomer: string;
        prepayVendor: string;
        fxGain: string;
        fxLoss: string;
    };

    // Test scenarios
    scenarios: {
        validPayment: PaymentScenario;
        foreignCurrency: PaymentScenario;
        overpayment: PaymentScenario;
        multiCurrency: PaymentScenario;
    };
}

export interface PaymentScenario {
    paymentInput: any;
    expectedResult: {
        success: boolean;
        totalAmount?: number;
        allocationsProcessed?: number;
        linesCount?: number;
    };
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create standardized test data using metadata mapping
 */
export function createPaymentTestData(): PaymentTestData {
    return {
        // Core identifiers (deterministic UUIDs)
        tenantId: '00000000-0000-0000-0000-000000000011',
        companyId: '00000000-0000-0000-0000-000000000012',
        customerId: '00000000-0000-0000-0000-000000000013',
        supplierId: '00000000-0000-0000-0000-000000000014',

        // Account mappings using metadata
        accounts: {
            bank: getTestAccountId('BANK_ACCOUNT'),
            ar: getTestAccountId('ACCOUNTS_RECEIVABLE'),
            ap: getTestAccountId('ACCOUNTS_PAYABLE'),
            tax: getTestAccountId('TAX_PAYABLE'),
            rev: getTestAccountId('SALES_REVENUE'),
            fee: getTestAccountId('BANK_FEES'),
            advCustomer: getTestAccountId('CUSTOMER_ADVANCES'),
            prepayVendor: getTestAccountId('VENDOR_PREPAYMENTS'),
            fxGain: getTestAccountId('FX_GAIN'),
            fxLoss: getTestAccountId('FX_LOSS')
        },

        // Test scenarios
        scenarios: {
            validPayment: createValidPaymentScenario(),
            foreignCurrency: createForeignCurrencyScenario(),
            overpayment: createOverpaymentScenario(),
            multiCurrency: createMultiCurrencyScenario()
        }
    };
}

/**
 * Create valid payment scenario
 */
function createValidPaymentScenario(): PaymentScenario {
    const testData = createPaymentTestData();

    return {
        paymentInput: {
            currency: 'MYR',
            amount: 1100, // 1000 + 100 tax
            bankAccountId: testData.accounts.bank,
            allocations: [{
                type: ALLOCATION_TYPES.INVOICE,
                documentId: 'invoice-001',
                documentNumber: 'INV-001',
                customerId: testData.customerId,
                allocatedAmount: 1100,
                arAccountId: testData.accounts.ar,
            }],
        },
        expectedResult: {
            success: true,
            totalAmount: 1100,
            allocationsProcessed: 1,
            linesCount: 2 // DR Bank, CR AR
        }
    };
}

/**
 * Create foreign currency payment scenario
 */
function createForeignCurrencyScenario(): PaymentScenario {
    const testData = createPaymentTestData();

    return {
        paymentInput: {
            currency: 'USD',
            amount: 250, // $250 USD
            exchangeRate: 4.2, // 1 USD = 4.2 MYR
            bankAccountId: testData.accounts.bank,
            allocations: [{
                type: ALLOCATION_TYPES.INVOICE,
                documentId: 'invoice-002',
                documentNumber: 'INV-002',
                customerId: testData.customerId,
                allocatedAmount: 250,
                arAccountId: testData.accounts.ar,
            }],
        },
        expectedResult: {
            success: true,
            totalAmount: 1050, // 250 * 4.2 = 1050 MYR
            allocationsProcessed: 1,
            linesCount: 2
        }
    };
}

/**
 * Create overpayment scenario
 */
function createOverpaymentScenario(): PaymentScenario {
    const testData = createPaymentTestData();

    return {
        paymentInput: {
            currency: 'MYR',
            amount: 1500, // Overpayment of 400
            bankAccountId: testData.accounts.bank,
            allocations: [{
                type: ALLOCATION_TYPES.INVOICE,
                documentId: 'invoice-003',
                documentNumber: 'INV-003',
                customerId: testData.customerId,
                allocatedAmount: 1100, // Only 1100 allocated
                arAccountId: testData.accounts.ar,
            }],
        },
        expectedResult: {
            success: true,
            totalAmount: 1500,
            allocationsProcessed: 1,
            linesCount: 3 // DR Bank, CR AR, CR Customer Advances
        }
    };
}

/**
 * Create multi-currency scenario
 */
function createMultiCurrencyScenario(): PaymentScenario {
    const testData = createPaymentTestData();

    return {
        paymentInput: {
            currency: 'MYR',
            amount: 2200, // 1100 + 1100
            bankAccountId: testData.accounts.bank,
            allocations: [
                {
                    type: ALLOCATION_TYPES.INVOICE,
                    documentId: 'invoice-004',
                    documentNumber: 'INV-004',
                    customerId: testData.customerId,
                    allocatedAmount: 1100,
                    arAccountId: testData.accounts.ar,
                },
                {
                    type: ALLOCATION_TYPES.INVOICE,
                    documentId: 'invoice-005',
                    documentNumber: 'INV-005',
                    customerId: testData.customerId,
                    allocatedAmount: 1100,
                    arAccountId: testData.accounts.ar,
                }
            ],
        },
        expectedResult: {
            success: true,
            totalAmount: 2200,
            allocationsProcessed: 2,
            linesCount: 4 // DR Bank, CR AR (x2)
        }
    };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get account ID by type (type-safe)
 */
export function getAccountId(accountType: keyof typeof TEST_ACCOUNT_IDS): string {
    return getTestAccountId(accountType);
}

/**
 * Create bank account for testing
 */
export function createBankAccount(currency: string = 'MYR'): any {
    return {
        id: getTestAccountId('BANK_ACCOUNT'),
        accountNumber: '1234567890',
        accountName: 'Test Bank Account',
        currency,
        isActive: true
    };
}

/**
 * Create invoice for testing
 */
export function createInvoice(
    customerId: string,
    amount: number,
    taxRate: number = 0.1
): any {
    const taxAmount = amount * taxRate;
    const totalAmount = amount + taxAmount;

    return {
        id: `invoice-${Date.now()}`,
        customerId,
        amount,
        taxAmount,
        totalAmount,
        openAmount: totalAmount,
        currency: 'MYR',
        status: 'OPEN'
    };
}

/**
 * Validate payment result against expected outcome
 */
export function validatePaymentResult(
    result: any,
    expected: PaymentScenario['expectedResult']
): boolean {
    if (result.success !== expected.success) return false;
    if (expected.totalAmount && Math.abs(result.totalAmount - expected.totalAmount) > 0.01) return false;
    if (expected.allocationsProcessed && result.allocationsProcessed !== expected.allocationsProcessed) return false;
    if (expected.linesCount && result.lines?.length !== expected.linesCount) return false;

    return true;
}
