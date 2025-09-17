// Global test setup - Single source of truth for mocks
import { afterEach, vi } from 'vitest';

// Stable time and UUIDs for deterministic tests
vi.spyOn(Date, "now").mockReturnValue(new Date("2025-01-01T00:00:00Z").valueOf());
vi.spyOn(Date.prototype, "toISOString").mockReturnValue("2025-01-01T00:00:00.000Z");

// Mock crypto.randomUUID for deterministic IDs in tests
if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
  vi.spyOn(crypto, "randomUUID").mockReturnValue("00000000-0000-0000-0000-000000000000");
}

// Mock database functions that the business logic actually uses
vi.mock('@aibos/db', () => {
  console.log('Mocking @aibos/db');

  // Create mock functions that can be used with vi.mocked()
  const mockGetAccountsInfo = vi.fn().mockResolvedValue(new Map([
    ['test-ar-account', {
      id: 'test-ar-account',
      code: '1100',
      name: 'Accounts Receivable',
      type: 'ASSET',
      isActive: true,
      currency: 'MYR'
    }],
    ['test-revenue-account', {
      id: 'test-revenue-account',
      code: '4000',
      name: 'Sales Revenue',
      type: 'REVENUE',
      isActive: true,
      currency: 'MYR'
    }],
    ['test-tax-account', {
      id: 'test-tax-account',
      code: '2100',
      name: 'Tax Payable',
      type: 'LIABILITY',
      isActive: true,
      currency: 'MYR'
    }],
    ['test-ap-account', {
      id: 'test-ap-account',
      code: '2100',
      name: 'Accounts Payable',
      type: 'LIABILITY',
      isActive: true,
      currency: 'MYR'
    }],
    ['test-expense-account', {
      id: 'test-expense-account',
      code: '5000',
      name: 'Office Supplies',
      type: 'EXPENSE',
      isActive: true,
      currency: 'MYR'
    }],
    ['bank-1000', {
      id: 'bank-1000',
      code: '1000',
      name: 'Bank Account',
      type: 'ASSET',
      isActive: true,
      currency: 'MYR'
    }],
    ['exp-bank-fee-6000', {
      id: 'exp-bank-fee-6000',
      code: '6000',
      name: 'Bank Fees',
      type: 'EXPENSE',
      isActive: true,
      currency: 'MYR'
    }],
    ['wht-payable-2100', {
      id: 'wht-payable-2100',
      code: '2100',
      name: 'Withholding Tax Payable',
      type: 'LIABILITY',
      isActive: true,
      currency: 'MYR'
    }],
    ['bank-1', {
      id: 'bank-1',
      code: '1001',
      name: 'USD Bank Account',
      type: 'ASSET',
      isActive: true,
      currency: 'USD'
    }],
    ['advance-account-1100', {
      id: 'advance-account-1100',
      code: '1100',
      name: 'Advance Payments',
      type: 'ASSET',
      isActive: true,
      currency: 'MYR'
    }],
    ['test-cash-account', {
      id: 'test-cash-account',
      code: '1000',
      name: 'Cash',
      type: 'ASSET',
      isActive: true,
      currency: 'MYR'
    }]
  ]));

  const mockGetAllAccountsInfo = vi.fn().mockResolvedValue([]);
  const mockGetCustomerById = vi.fn().mockResolvedValue({ id: 'cust-1', currency: 'MYR', name: 'Test Customer', email: 'test@example.com' });
  const mockGetSupplierById = vi.fn().mockResolvedValue({ id: 'vend-1', currency: 'MYR', name: 'Test Supplier', email: 'supplier@example.com' });
  const mockGetVendorById = vi.fn().mockResolvedValue({ id: 'vend-1', currency: 'MYR' });
  const mockGetOpenInvoicesForCustomer = vi.fn().mockResolvedValue([{ id: 'inv-1', currency: 'MYR', openAmount: 100 }]);
  const mockGetOpenBillsForVendor = vi.fn().mockResolvedValue([{ id: 'bill-1', currency: 'MYR', openAmount: 100 }]);
  const mockGetBankAccountById = vi.fn().mockResolvedValue({ id: 'bank-1000', currency: 'MYR', accountNumber: '123456', accountName: 'Test Bank' });
  const mockCreatePaymentLedger = vi.fn().mockResolvedValue({ id: 'payment-ledger-1' });
  const mockGetOrCreateAdvanceAccount = vi.fn().mockResolvedValue({
    id: 'advance-1',
    accountId: 'advance-account-1100',
    partyType: 'CUSTOMER',
    partyId: 'cust-1',
    currency: 'MYR',
    balanceAmount: 0
  });
  const mockUpdateAdvanceAccountBalance = vi.fn().mockResolvedValue(undefined);
  const mockCalculateBankCharges = vi.fn().mockResolvedValue([]);
  const mockCalculateWithholdingTax = vi.fn().mockResolvedValue([]);
  const mockGetBankChargeConfig = vi.fn().mockResolvedValue(null);
  const mockGetWithholdingTaxConfig = vi.fn().mockResolvedValue([]);

  // Make sure the mocked functions have the mockResolvedValue method
  mockGetCustomerById.mockResolvedValue = mockGetCustomerById.mockResolvedValue || vi.fn().mockResolvedValue;
  mockGetSupplierById.mockResolvedValue = mockGetSupplierById.mockResolvedValue || vi.fn().mockResolvedValue;
  mockGetBankAccountById.mockResolvedValue = mockGetBankAccountById.mockResolvedValue || vi.fn().mockResolvedValue;
  mockGetOrCreateAdvanceAccount.mockResolvedValue = mockGetOrCreateAdvanceAccount.mockResolvedValue || vi.fn().mockResolvedValue;
  mockUpdateAdvanceAccountBalance.mockResolvedValue = mockUpdateAdvanceAccountBalance.mockResolvedValue || vi.fn().mockResolvedValue;
  mockCalculateBankCharges.mockResolvedValue = mockCalculateBankCharges.mockResolvedValue || vi.fn().mockResolvedValue;
  mockCalculateWithholdingTax.mockResolvedValue = mockCalculateWithholdingTax.mockResolvedValue || vi.fn().mockResolvedValue;

  return {
    getAccountsInfo: mockGetAccountsInfo,
    getAllAccountsInfo: mockGetAllAccountsInfo,
    getCustomerById: mockGetCustomerById,
    getSupplierById: mockGetSupplierById,
    getVendorById: mockGetVendorById,
    getOpenInvoicesForCustomer: mockGetOpenInvoicesForCustomer,
    getOpenBillsForVendor: mockGetOpenBillsForVendor,
    getBankAccountById: mockGetBankAccountById,
    createPaymentLedger: mockCreatePaymentLedger,
    getOrCreateAdvanceAccount: mockGetOrCreateAdvanceAccount,
    updateAdvanceAccountBalance: mockUpdateAdvanceAccountBalance,
    calculateBankCharges: mockCalculateBankCharges,
    calculateWithholdingTax: mockCalculateWithholdingTax,
    getBankChargeConfig: mockGetBankChargeConfig,
    getWithholdingTaxConfig: mockGetWithholdingTaxConfig,
  };
});

// Mock other packages that might be imported
vi.mock('@aibos/contracts', () => ({
  // Add contract mocks as needed
}));

// Silence console logs during tests to reduce noise (temporarily disabled for debugging)
// vi.spyOn(console, 'error').mockImplementation(() => { });
// vi.spyOn(console, 'warn').mockImplementation(() => { });
// vi.spyOn(console, 'log').mockImplementation(() => { });

// Stable clocks & IDs for deterministic tests
vi.spyOn(Date, 'now').mockReturnValue(new Date('2025-01-01T00:00:00Z').valueOf());
vi.spyOn(crypto, 'randomUUID').mockReturnValue('00000000-0000-0000-0000-000000000000');

// Reset all mocks between tests to prevent test pollution
afterEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});
