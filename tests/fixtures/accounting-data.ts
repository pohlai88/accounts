/**
 * Accounting Test Fixtures
 *
 * Predefined test data for accounting-related tests.
 * Provides consistent, realistic data for testing business logic.
 */

export const accountingFixtures = {
  // Chart of Accounts
  accounts: [
    {
      id: "1000-0000-0000-0000-000000000001",
      code: "1000",
      name: "Cash and Cash Equivalents",
      accountType: "ASSET",
      currency: "MYR",
      isActive: true,
      level: 1,
    },
    {
      id: "1000-0000-0000-0000-000000000002",
      code: "1100",
      name: "Accounts Receivable",
      accountType: "ASSET",
      currency: "MYR",
      isActive: true,
      level: 1,
    },
    {
      id: "1000-0000-0000-0000-000000000003",
      code: "2000",
      name: "Accounts Payable",
      accountType: "LIABILITY",
      currency: "MYR",
      isActive: true,
      level: 1,
    },
    {
      id: "1000-0000-0000-0000-000000000004",
      code: "3000",
      name: "Owner's Equity",
      accountType: "EQUITY",
      currency: "MYR",
      isActive: true,
      level: 1,
    },
    {
      id: "1000-0000-0000-0000-000000000005",
      code: "4000",
      name: "Revenue",
      accountType: "REVENUE",
      currency: "MYR",
      isActive: true,
      level: 1,
    },
    {
      id: "1000-0000-0000-0000-000000000006",
      code: "5000",
      name: "Expenses",
      accountType: "EXPENSE",
      currency: "MYR",
      isActive: true,
      level: 1,
    },
  ],

  // Sample Invoice
  invoice: {
    id: "invoice-0000-0000-0000-000000000001",
    number: "INV-2024-001",
    customerId: "customer-0000-0000-0000-000000000001",
    customerName: "Test Customer Sdn Bhd",
    amount: 1000.00,
    currency: "MYR",
    status: "draft",
    issueDate: "2024-01-15",
    dueDate: "2024-02-14",
    items: [
      {
        id: "item-0000-0000-0000-000000000001",
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

  // Sample Bill
  bill: {
    id: "bill-0000-0000-0000-000000000001",
    number: "BILL-2024-001",
    vendorId: "vendor-0000-0000-0000-000000000001",
    vendorName: "Test Vendor Sdn Bhd",
    amount: 500.00,
    currency: "MYR",
    status: "draft",
    issueDate: "2024-01-10",
    dueDate: "2024-02-09",
    items: [
      {
        id: "item-0000-0000-0000-000000000002",
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

  // Sample Payment
  payment: {
    id: "payment-0000-0000-0000-000000000001",
    number: "PAY-2024-001",
    amount: 530.00,
    currency: "MYR",
    status: "pending",
    paymentDate: "2024-01-20",
    paymentMethod: "bank_transfer",
    allocations: [
      {
        billId: "bill-0000-0000-0000-000000000001",
        amount: 530.00,
      },
    ],
  },

  // Sample Journal Entry
  journalEntry: {
    id: "je-0000-0000-0000-000000000001",
    number: "JE-2024-001",
    description: "Invoice posting",
    date: "2024-01-15",
    status: "posted",
    lines: [
      {
        accountId: "1000-0000-0000-0000-000000000001", // Cash
        debit: 1060.00,
        credit: 0.00,
        description: "Cash received from customer",
      },
      {
        accountId: "1000-0000-0000-0000-000000000005", // Revenue
        debit: 0.00,
        credit: 1000.00,
        description: "Revenue from services",
      },
      {
        accountId: "1000-0000-0000-0000-000000000006", // Tax Payable
        debit: 0.00,
        credit: 60.00,
        description: "Sales tax payable",
      },
    ],
  },

  // Sample Trial Balance
  trialBalance: {
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
        accountId: "1000-0000-0000-0000-000000000002",
        code: "1100",
        name: "Accounts Receivable",
        accountType: "ASSET",
        debitBalance: 0.00,
        creditBalance: 0.00,
      },
      {
        accountId: "1000-0000-0000-0000-000000000003",
        code: "2000",
        name: "Accounts Payable",
        accountType: "LIABILITY",
        debitBalance: 0.00,
        creditBalance: 0.00,
      },
      {
        accountId: "1000-0000-0000-0000-000000000004",
        code: "3000",
        name: "Owner's Equity",
        accountType: "EQUITY",
        debitBalance: 0.00,
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
      {
        accountId: "1000-0000-0000-0000-000000000006",
        code: "5000",
        name: "Expenses",
        accountType: "EXPENSE",
        debitBalance: 0.00,
        creditBalance: 0.00,
      },
    ],
  },
};
