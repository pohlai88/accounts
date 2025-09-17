/**
 * E2E Test Data Factory
 *
 * Provides test data for end-to-end tests
 */

export interface TestUser {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
    tenantId: string;
    companyId: string;
}

export interface TestInvoice {
    number: string;
    customerName: string;
    customerEmail: string;
    invoiceDate: string;
    dueDate: string;
    lineItems: TestLineItem[];
}

export interface TestLineItem {
    description: string;
    quantity: number;
    unitPrice: number;
}

export interface TestBillingInfo {
    addressLine1: string;
    city: string;
    postalCode: string;
    country: string;
}

export class TestDataFactory {
    static createUser(overrides: Partial<TestUser> = {}): TestUser {
        return {
            email: 'admin@demo-accounting.com',
            password: 'password123',
            firstName: 'Admin',
            lastName: 'User',
            role: 'admin',
            tenantId: '00000000-0000-0000-0000-000000000001',
            companyId: '00000000-0000-0000-0000-000000000002',
            ...overrides,
        };
    }

    static createInvoice(overrides: Partial<TestInvoice> = {}): TestInvoice {
        return {
            number: `INV-${Date.now()}`,
            customerName: 'Test Customer',
            customerEmail: 'customer@example.com',
            invoiceDate: '2024-01-15',
            dueDate: '2024-02-15',
            lineItems: [
                {
                    description: 'Professional Services',
                    quantity: 1,
                    unitPrice: 100.00,
                },
            ],
            ...overrides,
        };
    }

    static createLineItem(overrides: Partial<TestLineItem> = {}): TestLineItem {
        return {
            description: 'Test Service',
            quantity: 1,
            unitPrice: 50.00,
            ...overrides,
        };
    }

    static createBillingInfo(overrides: Partial<TestBillingInfo> = {}): TestBillingInfo {
        return {
            addressLine1: '123 Test Street',
            city: 'Kuala Lumpur',
            postalCode: '50000',
            country: 'MY',
            ...overrides,
        };
    }

    static createApiErrorResponse(
        status: number = 500,
        title: string = 'Internal Server Error',
        code: string = 'INTERNAL_ERROR',
        detail: string = 'An unexpected error occurred'
    ) {
        return {
            status,
            body: {
                success: false,
                error: {
                    type: 'internal_error',
                    title,
                    status,
                    code,
                    detail,
                },
                timestamp: new Date().toISOString(),
                requestId: `test-${Date.now()}`,
            },
        };
    }

    static createSuccessResponse(data: any) {
        return {
            status: 200,
            body: {
                success: true,
                data,
                timestamp: new Date().toISOString(),
                requestId: `test-${Date.now()}`,
            },
        };
    }
}

// Predefined test data
export const TEST_USERS = {
    ADMIN: TestDataFactory.createUser({
        email: 'admin@demo-accounting.com',
        password: 'password123',
        role: 'admin',
    }),
    MANAGER: TestDataFactory.createUser({
        email: 'manager@demo-accounting.com',
        password: 'password123',
        role: 'manager',
    }),
    ACCOUNTANT: TestDataFactory.createUser({
        email: 'accountant@demo-accounting.com',
        password: 'password123',
        role: 'accountant',
    }),
};

export const TEST_INVOICES = {
    SIMPLE: TestDataFactory.createInvoice({
        number: 'INV-2024-001',
        customerName: 'Simple Customer',
        customerEmail: 'simple@example.com',
    }),
    COMPLEX: TestDataFactory.createInvoice({
        number: 'INV-2024-002',
        customerName: 'Complex Customer',
        customerEmail: 'complex@example.com',
        lineItems: [
            TestDataFactory.createLineItem({
                description: 'Consulting Services',
                quantity: 10,
                unitPrice: 150.00,
            }),
            TestDataFactory.createLineItem({
                description: 'Software License',
                quantity: 1,
                unitPrice: 500.00,
            }),
        ],
    }),
};

export const TEST_BILLING_INFO = {
    MALAYSIA: TestDataFactory.createBillingInfo({
        addressLine1: '456 Business Street',
        city: 'Kuala Lumpur',
        postalCode: '50000',
        country: 'MY',
    }),
    SINGAPORE: TestDataFactory.createBillingInfo({
        addressLine1: '789 Corporate Avenue',
        city: 'Singapore',
        postalCode: '018956',
        country: 'SG',
    }),
};
