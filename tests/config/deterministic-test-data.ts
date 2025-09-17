// Deterministic Test Data Configuration
// Ensures consistent, predictable test data across all test suites

import { faker } from '@faker-js/faker';
import { seed } from '@faker-js/faker';

// Set consistent seed for deterministic data
faker.seed(12345);

// Malaysian-specific test data
export const MALAYSIAN_TEST_DATA = {
    // Malaysian company registration numbers
    companyRegistrationNumbers: [
        '123456-A', '123457-A', '123458-A', '123459-A', '123460-A',
        '987654-A', '987655-A', '987656-A', '987657-A', '987658-A',
    ],

    // Malaysian addresses
    addresses: [
        {
            street: '123 Jalan Ampang',
            city: 'Kuala Lumpur',
            state: 'Wilayah Persekutuan',
            postcode: '50450',
            country: 'Malaysia',
        },
        {
            street: '456 Jalan Sultan Ismail',
            city: 'Kuala Lumpur',
            state: 'Wilayah Persekutuan',
            postcode: '50250',
            country: 'Malaysia',
        },
        {
            street: '789 Jalan Bukit Bintang',
            city: 'Kuala Lumpur',
            state: 'Wilayah Persekutuan',
            postcode: '55100',
            country: 'Malaysia',
        },
    ],

    // Malaysian phone numbers
    phoneNumbers: [
        '+60 3-1234 5678',
        '+60 3-2345 6789',
        '+60 3-3456 7890',
        '+60 3-4567 8901',
        '+60 3-5678 9012',
    ],

    // Malaysian email domains
    emailDomains: [
        'test.com.my',
        'example.com.my',
        'demo.com.my',
        'sample.com.my',
        'test.net.my',
    ],

    // Malaysian tax rates
    taxRates: {
        SST: 0.06, // 6% Sales and Service Tax
        corporateTax: 0.24, // 24% Corporate Tax
        withholdingTax: {
            dividend: 0.25, // 25% on dividends
            interest: 0.15, // 15% on interest
            royalty: 0.10, // 10% on royalties
        },
    },

    // Malaysian currencies
    currencies: {
        primary: 'MYR',
        secondary: ['SGD', 'USD', 'EUR', 'GBP'],
        exchangeRates: {
            'SGD': 3.4,
            'USD': 4.2,
            'EUR': 4.8,
            'GBP': 5.2,
        },
    },
};

// Deterministic test data generators
export class DeterministicTestData {
    private static instance: DeterministicTestData;
    private counter = 0;

    private constructor() { }

    static getInstance(): DeterministicTestData {
        if (!DeterministicTestData.instance) {
            DeterministicTestData.instance = new DeterministicTestData();
        }
        return DeterministicTestData.instance;
    }

    // Reset counter for consistent data generation
    reset(): void {
        this.counter = 0;
        faker.seed(12345);
    }

    // Generate deterministic customer data
    generateCustomer(overrides: Partial<any> = {}): any {
        const index = this.counter++ % MALAYSIAN_TEST_DATA.companyRegistrationNumbers.length;
        const address = MALAYSIAN_TEST_DATA.addresses[index % MALAYSIAN_TEST_DATA.addresses.length];
        const phone = MALAYSIAN_TEST_DATA.phoneNumbers[index % MALAYSIAN_TEST_DATA.phoneNumbers.length];
        const emailDomain = MALAYSIAN_TEST_DATA.emailDomains[index % MALAYSIAN_TEST_DATA.emailDomains.length];

        return {
            id: `customer-${String(this.counter).padStart(3, '0')}`,
            name: `Test Customer ${this.counter}`,
            email: `customer${this.counter}@${emailDomain}`,
            phone: phone,
            address: address,
            registrationNumber: MALAYSIAN_TEST_DATA.companyRegistrationNumbers[index],
            companyType: 'PRIVATE_LIMITED',
            country: 'Malaysia',
            currency: 'MYR',
            taxNumber: `TAX${String(this.counter).padStart(6, '0')}`,
            creditLimit: 100000,
            paymentTerms: 30,
            status: 'ACTIVE',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
            ...overrides,
        };
    }

    // Generate deterministic vendor data
    generateVendor(overrides: Partial<any> = {}): any {
        const index = this.counter++ % MALAYSIAN_TEST_DATA.companyRegistrationNumbers.length;
        const address = MALAYSIAN_TEST_DATA.addresses[index % MALAYSIAN_TEST_DATA.addresses.length];
        const phone = MALAYSIAN_TEST_DATA.phoneNumbers[index % MALAYSIAN_TEST_DATA.phoneNumbers.length];
        const emailDomain = MALAYSIAN_TEST_DATA.emailDomains[index % MALAYSIAN_TEST_DATA.emailDomains.length];

        return {
            id: `vendor-${String(this.counter).padStart(3, '0')}`,
            name: `Test Vendor ${this.counter}`,
            email: `vendor${this.counter}@${emailDomain}`,
            phone: phone,
            address: address,
            registrationNumber: MALAYSIAN_TEST_DATA.companyRegistrationNumbers[index],
            companyType: 'PRIVATE_LIMITED',
            country: 'Malaysia',
            currency: 'MYR',
            taxNumber: `TAX${String(this.counter).padStart(6, '0')}`,
            paymentTerms: 30,
            status: 'ACTIVE',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
            ...overrides,
        };
    }

    // Generate deterministic invoice data
    generateInvoice(customerId: string, overrides: Partial<any> = {}): any {
        const amount = 1000 + (this.counter * 100);
        const invoiceNumber = `INV-${String(this.counter).padStart(6, '0')}`;

        return {
            id: `invoice-${String(this.counter).padStart(3, '0')}`,
            invoiceNumber: invoiceNumber,
            customerId: customerId,
            amount: amount,
            currency: 'MYR',
            dueDate: '2024-02-01',
            issueDate: '2024-01-01',
            description: `Test Invoice ${this.counter}`,
            status: 'DRAFT',
            lineItems: [
                {
                    id: `line-${String(this.counter).padStart(3, '0')}-1`,
                    description: `Test Item ${this.counter}`,
                    quantity: 1,
                    unitPrice: amount,
                    total: amount,
                    taxRate: MALAYSIAN_TEST_DATA.taxRates.SST,
                    taxAmount: amount * MALAYSIAN_TEST_DATA.taxRates.SST,
                },
            ],
            subtotal: amount,
            taxAmount: amount * MALAYSIAN_TEST_DATA.taxRates.SST,
            total: amount * (1 + MALAYSIAN_TEST_DATA.taxRates.SST),
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
            ...overrides,
        };
    }

    // Generate deterministic bill data
    generateBill(vendorId: string, overrides: Partial<any> = {}): any {
        const amount = 500 + (this.counter * 50);
        const billNumber = `BILL-${String(this.counter).padStart(6, '0')}`;

        return {
            id: `bill-${String(this.counter).padStart(3, '0')}`,
            billNumber: billNumber,
            vendorId: vendorId,
            amount: amount,
            currency: 'MYR',
            dueDate: '2024-02-15',
            issueDate: '2024-01-01',
            description: `Test Bill ${this.counter}`,
            status: 'DRAFT',
            lineItems: [
                {
                    id: `line-${String(this.counter).padStart(3, '0')}-1`,
                    description: `Test Service ${this.counter}`,
                    quantity: 1,
                    unitPrice: amount,
                    total: amount,
                    taxRate: MALAYSIAN_TEST_DATA.taxRates.SST,
                    taxAmount: amount * MALAYSIAN_TEST_DATA.taxRates.SST,
                },
            ],
            subtotal: amount,
            taxAmount: amount * MALAYSIAN_TEST_DATA.taxRates.SST,
            total: amount * (1 + MALAYSIAN_TEST_DATA.taxRates.SST),
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
            ...overrides,
        };
    }

    // Generate deterministic payment data
    generatePayment(overrides: Partial<any> = {}): any {
        const amount = 1000 + (this.counter * 100);
        const paymentNumber = `PAY-${String(this.counter).padStart(6, '0')}`;

        return {
            id: `payment-${String(this.counter).padStart(3, '0')}`,
            paymentNumber: paymentNumber,
            amount: amount,
            currency: 'MYR',
            paymentMethod: 'CASH',
            paymentDate: '2024-01-15',
            description: `Test Payment ${this.counter}`,
            status: 'COMPLETED',
            allocations: [],
            createdAt: '2024-01-15T00:00:00Z',
            updatedAt: '2024-01-15T00:00:00Z',
            ...overrides,
        };
    }

    // Generate deterministic bank account data
    generateBankAccount(overrides: Partial<any> = {}): any {
        const accountNumber = `123456789${String(this.counter).padStart(3, '0')}`;

        return {
            id: `bank-${String(this.counter).padStart(3, '0')}`,
            accountName: `Test Bank Account ${this.counter}`,
            accountNumber: accountNumber,
            bankName: 'Test Bank',
            bankCode: 'TEST',
            currency: 'MYR',
            accountType: 'CURRENT',
            status: 'ACTIVE',
            balance: 100000 + (this.counter * 10000),
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
            ...overrides,
        };
    }

    // Generate deterministic chart of accounts data
    generateChartOfAccounts(): any[] {
        return [
            {
                id: '1000',
                code: '1000',
                name: 'Assets',
                type: 'ASSET',
                parentId: null,
                level: 0,
                children: [
                    {
                        id: '1100',
                        code: '1100',
                        name: 'Current Assets',
                        type: 'ASSET',
                        parentId: '1000',
                        level: 1,
                        children: [
                            {
                                id: '1110',
                                code: '1110',
                                name: 'Cash and Cash Equivalents',
                                type: 'ASSET',
                                parentId: '1100',
                                level: 2,
                                children: [],
                            },
                        ],
                    },
                ],
            },
            {
                id: '2000',
                code: '2000',
                name: 'Liabilities',
                type: 'LIABILITY',
                parentId: null,
                level: 0,
                children: [],
            },
            {
                id: '3000',
                code: '3000',
                name: 'Equity',
                type: 'EQUITY',
                parentId: null,
                level: 0,
                children: [],
            },
        ];
    }

    // Generate deterministic consolidation group data
    generateConsolidationGroup(overrides: Partial<any> = {}): any {
        return {
            id: `group-${String(this.counter).padStart(3, '0')}`,
            name: `Test Consolidation Group ${this.counter}`,
            reportingCurrency: 'MYR',
            reportingPeriod: '2024-Q1',
            companies: [],
            status: 'ACTIVE',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
            ...overrides,
        };
    }

    // Generate deterministic intercompany transaction data
    generateIntercompanyTransaction(fromCompanyId: string, toCompanyId: string, overrides: Partial<any> = {}): any {
        const amount = 10000 + (this.counter * 1000);

        return {
            id: `intercompany-${String(this.counter).padStart(3, '0')}`,
            fromCompanyId: fromCompanyId,
            toCompanyId: toCompanyId,
            transactionType: 'SALE',
            amount: amount,
            currency: 'MYR',
            description: `Intercompany Transaction ${this.counter}`,
            transactionDate: '2024-01-15',
            status: 'PENDING',
            lineItems: [
                {
                    id: `line-${String(this.counter).padStart(3, '0')}-1`,
                    description: `Intercompany Item ${this.counter}`,
                    quantity: 1,
                    unitPrice: amount,
                    total: amount,
                },
            ],
            createdAt: '2024-01-15T00:00:00Z',
            updatedAt: '2024-01-15T00:00:00Z',
            ...overrides,
        };
    }
}

// Export singleton instance
export const testData = DeterministicTestData.getInstance();

// Helper functions for test setup
export const createTestCustomer = (overrides: Partial<any> = {}) => testData.generateCustomer(overrides);
export const createTestVendor = (overrides: Partial<any> = {}) => testData.generateVendor(overrides);
export const createTestInvoice = (customerId: string, overrides: Partial<any> = {}) =>
    testData.generateInvoice(customerId, overrides);
export const createTestBill = (vendorId: string, overrides: Partial<any> = {}) =>
    testData.generateBill(vendorId, overrides);
export const createTestPayment = (overrides: Partial<any> = {}) => testData.generatePayment(overrides);
export const createTestBankAccount = (overrides: Partial<any> = {}) => testData.generateBankAccount(overrides);
export const createTestConsolidationGroup = (overrides: Partial<any> = {}) =>
    testData.generateConsolidationGroup(overrides);
export const createTestIntercompanyTransaction = (fromCompanyId: string, toCompanyId: string, overrides: Partial<any> = {}) =>
    testData.generateIntercompanyTransaction(fromCompanyId, toCompanyId, overrides);

// Reset function for test cleanup
export const resetTestData = () => testData.reset();
