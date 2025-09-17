// @ts-nocheck
// Comprehensive Test Configuration for Accounting SaaS
// Ensures V1 compliance and comprehensive coverage

export interface TestConfig {
  // Performance thresholds (V1 compliance)
  performance: {
    apiResponseTime: {
      p95: number; // milliseconds
      p99: number; // milliseconds
    };
    errorRate: {
      max: number; // percentage
    };
    throughput: {
      min: number; // requests per second
    };
  };

  // Coverage requirements
  coverage: {
    global: {
      branches: number;
      functions: number;
      lines: number;
      statements: number;
    };
    critical: {
      branches: number;
      functions: number;
      lines: number;
      statements: number;
    };
  };

  // Test data configuration
  testData: {
    tenantId: string;
    companyId: string;
    userId: string;
    baseCurrency: string;
  };

  // API endpoints for testing
  endpoints: {
    baseUrl: string;
    health: string;
    invoices: string;
    bills: string;
    payments: string;
    accounts: string;
    periods: string;
    reports: string;
    journals: string;
    customers: string;
    vendors: string;
    bankAccounts: string;
    companySettings: string;
  };

  // Database configuration
  database: {
    testDatabase: string;
    connectionTimeout: number;
    queryTimeout: number;
  };

  // Security testing
  security: {
    rlsEnabled: boolean;
    auditLogging: boolean;
    encryption: boolean;
  };
}

export const testConfig: TestConfig = {
  performance: {
    apiResponseTime: {
      p95: 500, // V1 requirement: P95 ≤ 500ms
      p99: 1000, // V1 requirement: P99 ≤ 1000ms
    },
    errorRate: {
      max: 1, // V1 requirement: Error rate ≤ 1%
    },
    throughput: {
      min: 100, // V1 requirement: ≥ 100 requests/second
    },
  },

  coverage: {
    global: {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    critical: {
      branches: 98, // Critical business logic
      functions: 98,
      lines: 98,
      statements: 98,
    },
  },

  testData: {
    tenantId: "test-tenant-001",
    companyId: "test-company-001",
    userId: "test-user-001",
    baseCurrency: "MYR",
  },

  endpoints: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
    health: "/api/health",
    invoices: "/api/invoices",
    bills: "/api/bills",
    payments: "/api/payments",
    accounts: "/api/accounts",
    periods: "/api/periods",
    reports: "/api/reports",
    journals: "/api/journals",
    customers: "/api/customers",
    vendors: "/api/vendors",
    bankAccounts: "/api/bank-accounts",
    companySettings: "/api/company-settings",
  },

  database: {
    testDatabase: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:54322/postgres",
    connectionTimeout: 30000,
    queryTimeout: 10000,
  },

  security: {
    rlsEnabled: true,
    auditLogging: true,
    encryption: true,
  },
};

// Test data factories
export const createTestInvoice = (overrides: Partial<any> = {}) => ({
  id: `test-invoice-${Date.now()}`,
  tenantId: testConfig.testData.tenantId,
  companyId: testConfig.testData.companyId,
  invoiceNumber: `INV-${Date.now()}`,
  customerId: "test-customer-001",
  invoiceDate: new Date().toISOString().split("T")[0],
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  currency: testConfig.testData.baseCurrency,
  status: "draft" as const,
  lines: [
    {
      id: `test-line-${Date.now()}`,
      description: "Test Product",
      quantity: 1,
      unitPrice: 100.00,
      lineAmount: 100.00,
      taxAmount: 10.00,
      revenueAccountId: "test-revenue-account",
    },
  ],
  subtotal: 100.00,
  taxTotal: 10.00,
  totalAmount: 110.00,
  createdBy: testConfig.testData.userId,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createTestBill = (overrides: Partial<any> = {}) => ({
  id: `test-bill-${Date.now()}`,
  tenantId: testConfig.testData.tenantId,
  companyId: testConfig.testData.companyId,
  billNumber: `BILL-${Date.now()}`,
  vendorId: "test-vendor-001",
  billDate: new Date().toISOString().split("T")[0],
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  currency: testConfig.testData.baseCurrency,
  status: "draft" as const,
  lines: [
    {
      id: `test-line-${Date.now()}`,
      description: "Test Service",
      quantity: 1,
      unitPrice: 50.00,
      lineAmount: 50.00,
      taxAmount: 5.00,
      expenseAccountId: "test-expense-account",
    },
  ],
  subtotal: 50.00,
  taxTotal: 5.00,
  totalAmount: 55.00,
  createdBy: testConfig.testData.userId,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createTestPayment = (overrides: Partial<any> = {}) => ({
  id: `test-payment-${Date.now()}`,
  tenantId: testConfig.testData.tenantId,
  companyId: testConfig.testData.companyId,
  paymentNumber: `PAY-${Date.now()}`,
  amount: 110.00,
  currency: testConfig.testData.baseCurrency,
  paymentMethod: "CASH" as const,
  paymentDate: new Date().toISOString().split("T")[0],
  status: "pending" as const,
  bankAccountId: "test-bank-account",
  allocations: [
    {
      id: `test-allocation-${Date.now()}`,
      type: "INVOICE" as const,
      entityId: "test-invoice-001",
      amount: 110.00,
    },
  ],
  createdBy: testConfig.testData.userId,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createTestAccount = (overrides: Partial<any> = {}) => ({
  id: `test-account-${Date.now()}`,
  tenantId: testConfig.testData.tenantId,
  companyId: testConfig.testData.companyId,
  code: `ACC-${Date.now()}`,
  name: "Test Account",
  accountType: "ASSET" as const,
  parentId: null,
  level: 1,
  isActive: true,
  description: "Test account for testing",
  createdBy: testConfig.testData.userId,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createTestCustomer = (overrides: Partial<any> = {}) => ({
  id: `test-customer-${Date.now()}`,
  tenantId: testConfig.testData.tenantId,
  companyId: testConfig.testData.companyId,
  customerNumber: `CUST-${Date.now()}`,
  name: "Test Customer",
  email: "test@customer.com",
  phone: "+60123456789",
  currency: testConfig.testData.baseCurrency,
  paymentTerms: "NET_30" as const,
  creditLimit: 10000.00,
  isActive: true,
  createdBy: testConfig.testData.userId,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createTestVendor = (overrides: Partial<any> = {}) => ({
  id: `test-vendor-${Date.now()}`,
  tenantId: testConfig.testData.tenantId,
  companyId: testConfig.testData.companyId,
  vendorNumber: `VEND-${Date.now()}`,
  name: "Test Vendor",
  email: "test@vendor.com",
  phone: "+60123456789",
  currency: testConfig.testData.baseCurrency,
  paymentTerms: "NET_30" as const,
  isActive: true,
  createdBy: testConfig.testData.userId,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

// Test utilities
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateRandomString = (length: number = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const generateRandomEmail = () => `test-${generateRandomString()}@example.com`;

export const generateRandomPhone = () => `+601${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`;

// Performance testing utilities
export const measurePerformance = async <T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> => {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  return { result, duration };
};

// Error testing utilities
export const expectError = (error: any, expectedCode: string, expectedMessage?: string) => {
  expect(error).toBeDefined();
  expect(error.code).toBe(expectedCode);
  if (expectedMessage) {
    expect(error.message).toContain(expectedMessage);
  }
};

// Database testing utilities
export const createTestDatabase = async () => {
  // Implementation for creating test database
  // This would typically involve creating a temporary database
  // and running migrations
};

export const cleanupTestDatabase = async () => {
  // Implementation for cleaning up test database
  // This would typically involve dropping the test database
  // and cleaning up any temporary data
};

// API testing utilities
export const makeApiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${testConfig.endpoints.baseUrl}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer test-token`,
      ...options.headers,
    },
    ...options,
  });

  return {
    status: response.status,
    headers: response.headers,
    data: await response.json(),
  };
};

// Validation utilities
export const validateApiResponse = (response: any, expectedStatus: number) => {
  expect(response.status).toBe(expectedStatus);
  expect(response.data).toBeDefined();
};

export const validateErrorResponse = (response: any, expectedCode: string) => {
  expect(response.status).toBeGreaterThanOrEqual(400);
  expect(response.data.error).toBeDefined();
  expect(response.data.code).toBe(expectedCode);
};
