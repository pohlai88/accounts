// @ts-nocheck
// Global test setup - Single source of truth for mocks
import { afterEach, vi } from 'vitest';

// Mock database functions that the business logic actually uses
vi.mock('@aibos/db', () => {
  console.log('Mocking @aibos/db');
  return {
    getAccountsInfo: vi.fn().mockResolvedValue(new Map([
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
    ])),
    getAllAccountsInfo: vi.fn().mockResolvedValue([]),
    // Payment processing functions
    getCustomerById: vi.fn().mockResolvedValue({ id: 'cust-1', currency: 'MYR', name: 'Test Customer', email: 'test@example.com' }),
    getSupplierById: vi.fn().mockResolvedValue({ id: 'vend-1', currency: 'MYR', name: 'Test Supplier', email: 'supplier@example.com' }),
    getVendorById: vi.fn().mockResolvedValue({ id: 'vend-1', currency: 'MYR' }), // Legacy alias
    getOpenInvoicesForCustomer: vi.fn().mockResolvedValue([{ id: 'inv-1', currency: 'MYR', openAmount: 100 }]),
    getOpenBillsForVendor: vi.fn().mockResolvedValue([{ id: 'bill-1', currency: 'MYR', openAmount: 100 }]),
    getBankAccountById: vi.fn().mockResolvedValue({ id: 'bank-1000', currency: 'MYR', accountNumber: '123456', accountName: 'Test Bank' }),
    createPaymentLedger: vi.fn().mockResolvedValue({ id: 'payment-ledger-1' }),
    // Enhanced payment processing functions
    getOrCreateAdvanceAccount: vi.fn().mockResolvedValue({
      id: 'advance-1',
      accountId: 'advance-account-1100',
      partyType: 'CUSTOMER',
      partyId: 'cust-1',
      currency: 'MYR',
      balanceAmount: 0
    }),
    updateAdvanceAccountBalance: vi.fn().mockResolvedValue(undefined),
    calculateBankCharges: vi.fn().mockResolvedValue([]),
    calculateWithholdingTax: vi.fn().mockResolvedValue([]),
    getBankChargeConfig: vi.fn().mockResolvedValue(null),
    getWithholdingTaxConfig: vi.fn().mockResolvedValue([]),
    // Add other DB functions as they appear in business logic
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
