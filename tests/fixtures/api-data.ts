/**
 * API Test Fixtures
 *
 * Predefined test data for API endpoint testing.
 * Provides consistent request/response data for testing API functionality.
 */

export const apiFixtures = {
  // Authentication
  auth: {
    loginRequest: {
      email: "test@example.com",
      password: "testpassword123",
    },
    loginResponse: {
      user: {
        id: "user-0000-0000-0000-000000000001",
        email: "test@example.com",
        name: "Test User",
        role: "admin",
        tenantId: "tenant-0000-0000-0000-000000000001",
        companyId: "company-0000-0000-0000-000000000001",
      },
      token: "test-jwt-token",
      refreshToken: "test-refresh-token",
    },
  },

  // Invoice API
  invoice: {
    createRequest: {
      customerId: "customer-0000-0000-0000-000000000001",
      customerName: "Test Customer Sdn Bhd",
      invoiceNumber: "INV-2024-001",
      issueDate: "2024-01-15",
      dueDate: "2024-02-14",
      items: [
        {
          description: "Professional Services",
          quantity: 10,
          unitPrice: 100.00,
          total: 1000.00,
        },
      ],
      subtotal: 1000.00,
      taxRate: 6.00,
      taxAmount: 60.00,
      total: 1060.00,
      notes: "Payment due within 30 days",
    },
    createResponse: {
      id: "invoice-0000-0000-0000-000000000001",
      number: "INV-2024-001",
      status: "draft",
      createdAt: "2024-01-15T10:00:00Z",
      updatedAt: "2024-01-15T10:00:00Z",
    },
    listResponse: {
      data: [
        {
          id: "invoice-0000-0000-0000-000000000001",
          number: "INV-2024-001",
          customerName: "Test Customer Sdn Bhd",
          amount: 1060.00,
          currency: "MYR",
          status: "draft",
          issueDate: "2024-01-15",
          dueDate: "2024-02-14",
        },
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      },
    },
  },

  // Bill API
  bill: {
    createRequest: {
      vendorId: "vendor-0000-0000-0000-000000000001",
      vendorName: "Test Vendor Sdn Bhd",
      billNumber: "BILL-2024-001",
      issueDate: "2024-01-10",
      dueDate: "2024-02-09",
      items: [
        {
          description: "Office Supplies",
          quantity: 5,
          unitPrice: 100.00,
          total: 500.00,
        },
      ],
      subtotal: 500.00,
      taxRate: 6.00,
      taxAmount: 30.00,
      total: 530.00,
      notes: "Payment due within 30 days",
    },
    createResponse: {
      id: "bill-0000-0000-0000-000000000001",
      number: "BILL-2024-001",
      status: "draft",
      createdAt: "2024-01-10T10:00:00Z",
      updatedAt: "2024-01-10T10:00:00Z",
    },
  },

  // Payment API
  payment: {
    createRequest: {
      amount: 530.00,
      currency: "MYR",
      paymentDate: "2024-01-20",
      paymentMethod: "bank_transfer",
      allocations: [
        {
          billId: "bill-0000-0000-0000-000000000001",
          amount: 530.00,
        },
      ],
    },
    createResponse: {
      id: "payment-0000-0000-0000-000000000001",
      number: "PAY-2024-001",
      status: "pending",
      createdAt: "2024-01-20T10:00:00Z",
      updatedAt: "2024-01-20T10:00:00Z",
    },
  },

  // Reports API
  reports: {
    trialBalance: {
      request: {
        date: "2024-01-31",
        companyId: "company-0000-0000-0000-000000000001",
      },
      response: {
        date: "2024-01-31",
        accounts: [
          {
            accountId: "1000-0000-0000-0000-000000000001",
            code: "1000",
            name: "Cash and Cash Equivalents",
            accountType: "ASSET",
            debitBalance: 1060.00,
            creditBalance: 0.00,
          },
          {
            accountId: "1000-0000-0000-0000-000000000005",
            code: "4000",
            name: "Revenue",
            accountType: "REVENUE",
            debitBalance: 0.00,
            creditBalance: 1000.00,
          },
        ],
        totalDebits: 1060.00,
        totalCredits: 1000.00,
        isBalanced: false,
      },
    },
  },

  // Error responses
  errors: {
    validationError: {
      error: "Validation Error",
      message: "Invalid input data",
      details: [
        {
          field: "amount",
          message: "Amount must be greater than 0",
        },
      ],
    },
    notFoundError: {
      error: "Not Found",
      message: "Resource not found",
    },
    unauthorizedError: {
      error: "Unauthorized",
      message: "Authentication required",
    },
    forbiddenError: {
      error: "Forbidden",
      message: "Insufficient permissions",
    },
    serverError: {
      error: "Internal Server Error",
      message: "An unexpected error occurred",
    },
  },
};
