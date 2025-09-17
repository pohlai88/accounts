/**
 * Enhanced Account Metadata Mapping System
 *
 * A comprehensive, test-ready metadata system that provides:
 * - Complete account hierarchy mapping
 * - Multi-currency support
 * - Business rule validation
 * - Test data generation
 * - Scenario builders
 * - Validation helpers
 */

// ============================================================================
// CORE TYPES AND CONSTANTS
// ============================================================================

export const ACCOUNT_TYPES = {
  ASSET: 'ASSET',
  LIABILITY: 'LIABILITY',
  EQUITY: 'EQUITY',
  REVENUE: 'REVENUE',
  EXPENSE: 'EXPENSE',
  COST_OF_GOODS_SOLD: 'COST_OF_GOODS_SOLD'
} as const;

export type AccountType = typeof ACCOUNT_TYPES[keyof typeof ACCOUNT_TYPES];

export const CURRENCIES = {
  MYR: 'MYR',
  USD: 'USD',
  EUR: 'EUR',
  GBP: 'GBP',
  SGD: 'SGD',
  JPY: 'JPY'
} as const;

export type Currency = typeof CURRENCIES[keyof typeof CURRENCIES];

export const PAYMENT_TYPES = {
  CUSTOMER_PAYMENT: 'CUSTOMER_PAYMENT',
  SUPPLIER_PAYMENT: 'SUPPLIER_PAYMENT',
  INTERNAL_TRANSFER: 'INTERNAL_TRANSFER',
  REFUND: 'REFUND'
} as const;

export type PaymentType = typeof PAYMENT_TYPES[keyof typeof PAYMENT_TYPES];

export const ALLOCATION_TYPES = {
  INVOICE: 'INVOICE',
  BILL: 'BILL',
  CREDIT_NOTE: 'CREDIT_NOTE',
  DEBIT_NOTE: 'DEBIT_NOTE',
  ADVANCE: 'ADVANCE',
  REFUND: 'REFUND'
} as const;

export type AllocationType = typeof ALLOCATION_TYPES[keyof typeof ALLOCATION_TYPES];

// ============================================================================
// COMPREHENSIVE ACCOUNT HIERARCHY
// ============================================================================

export interface AccountDefinition {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  parentId?: string;
  level: number;
  currency: Currency;
  isActive: boolean;
  description?: string;
  tags?: string[];
}

export const ACCOUNT_HIERARCHY: Record<string, AccountDefinition> = {
  // ASSETS (1000-1999)
  'acct_bank_1000': {
    id: 'acct_bank_1000',
    code: '1000',
    name: 'Bank Account',
    type: ACCOUNT_TYPES.ASSET,
    level: 1,
    currency: CURRENCIES.MYR,
    isActive: true,
    description: 'Primary bank account for cash management',
    tags: ['cash', 'banking']
  },
  'acct_ar_1100': {
    id: 'acct_ar_1100',
    code: '1100',
    name: 'Accounts Receivable',
    type: ACCOUNT_TYPES.ASSET,
    level: 1,
    currency: CURRENCIES.MYR,
    isActive: true,
    description: 'Amounts owed by customers',
    tags: ['receivables', 'customers']
  },
  'acct_ar_1101': {
    id: 'acct_ar_1101',
    code: '1101',
    name: 'AR - Trade',
    type: ACCOUNT_TYPES.ASSET,
    parentId: 'acct_ar_1100',
    level: 2,
    currency: CURRENCIES.MYR,
    isActive: true,
    description: 'Trade receivables from normal business operations'
  },
  'acct_ar_1102': {
    id: 'acct_ar_1102',
    code: '1102',
    name: 'AR - Intercompany',
    type: ACCOUNT_TYPES.ASSET,
    parentId: 'acct_ar_1100',
    level: 2,
    currency: CURRENCIES.MYR,
    isActive: true,
    description: 'Intercompany receivables'
  },
  'acct_prepay_1200': {
    id: 'acct_prepay_1200',
    code: '1200',
    name: 'Prepaid Expenses',
    type: ACCOUNT_TYPES.ASSET,
    level: 1,
    currency: CURRENCIES.MYR,
    isActive: true,
    description: 'Prepaid expenses and advances'
  },
  'acct_vend_prepay_1201': {
    id: 'acct_vend_prepay_1201',
    code: '1201',
    name: 'Vendor Prepayments',
    type: ACCOUNT_TYPES.ASSET,
    parentId: 'acct_prepay_1200',
    level: 2,
    currency: CURRENCIES.MYR,
    isActive: true,
    description: 'Advance payments to vendors'
  },
  'acct_inventory_1300': {
    id: 'acct_inventory_1300',
    code: '1300',
    name: 'Inventory',
    type: ACCOUNT_TYPES.ASSET,
    level: 1,
    currency: CURRENCIES.MYR,
    isActive: true,
    description: 'Raw materials, work in progress, finished goods'
  },
  'acct_fixed_assets_1500': {
    id: 'acct_fixed_assets_1500',
    code: '1500',
    name: 'Fixed Assets',
    type: ACCOUNT_TYPES.ASSET,
    level: 1,
    currency: CURRENCIES.MYR,
    isActive: true,
    description: 'Property, plant, and equipment'
  },

  // LIABILITIES (2000-2999)
  'acct_ap_2100': {
    id: 'acct_ap_2100',
    code: '2100',
    name: 'Accounts Payable',
    type: ACCOUNT_TYPES.LIABILITY,
    level: 1,
    currency: CURRENCIES.MYR,
    isActive: true,
    description: 'Amounts owed to suppliers',
    tags: ['payables', 'suppliers']
  },
  'acct_ap_2101': {
    id: 'acct_ap_2101',
    code: '2101',
    name: 'AP - Trade',
    type: ACCOUNT_TYPES.LIABILITY,
    parentId: 'acct_ap_2100',
    level: 2,
    currency: CURRENCIES.MYR,
    isActive: true,
    description: 'Trade payables to suppliers'
  },
  'acct_tax_2105': {
    id: 'acct_tax_2105',
    code: '2105',
    name: 'Tax Payable',
    type: ACCOUNT_TYPES.LIABILITY,
    level: 1,
    currency: CURRENCIES.MYR,
    isActive: true,
    description: 'Outstanding tax obligations',
    tags: ['tax', 'government']
  },
  'acct_sst_2106': {
    id: 'acct_sst_2106',
    code: '2106',
    name: 'SST Payable',
    type: ACCOUNT_TYPES.LIABILITY,
    parentId: 'acct_tax_2105',
    level: 2,
    currency: CURRENCIES.MYR,
    isActive: true,
    description: 'Sales and Service Tax payable'
  },
  'acct_advances_2300': {
    id: 'acct_advances_2300',
    code: '2300',
    name: 'Customer Advances',
    type: ACCOUNT_TYPES.LIABILITY,
    level: 1,
    currency: CURRENCIES.MYR,
    isActive: true,
    description: 'Advance payments received from customers',
    tags: ['advances', 'customers']
  },
  'acct_accruals_2400': {
    id: 'acct_accruals_2400',
    code: '2400',
    name: 'Accrued Expenses',
    type: ACCOUNT_TYPES.LIABILITY,
    level: 1,
    currency: CURRENCIES.MYR,
    isActive: true,
    description: 'Accrued but not yet paid expenses'
  },

  // EQUITY (3000-3999)
  'acct_equity_3000': {
    id: 'acct_equity_3000',
    code: '3000',
    name: 'Share Capital',
    type: ACCOUNT_TYPES.EQUITY,
    level: 1,
    currency: CURRENCIES.MYR,
    isActive: true,
    description: 'Share capital and retained earnings'
  },
  'acct_retained_earnings_3100': {
    id: 'acct_retained_earnings_3100',
    code: '3100',
    name: 'Retained Earnings',
    type: ACCOUNT_TYPES.EQUITY,
    parentId: 'acct_equity_3000',
    level: 2,
    currency: CURRENCIES.MYR,
    isActive: true,
    description: 'Accumulated profits retained in the business'
  },

  // REVENUE (4000-4999)
  'acct_revenue_4000': {
    id: 'acct_revenue_4000',
    code: '4000',
    name: 'Sales Revenue',
    type: ACCOUNT_TYPES.REVENUE,
    level: 1,
    currency: CURRENCIES.MYR,
    isActive: true,
    description: 'Revenue from sales of goods and services',
    tags: ['revenue', 'sales']
  },
  'acct_sales_4001': {
    id: 'acct_sales_4001',
    code: '4001',
    name: 'Product Sales',
    type: ACCOUNT_TYPES.REVENUE,
    parentId: 'acct_revenue_4000',
    level: 2,
    currency: CURRENCIES.MYR,
    isActive: true,
    description: 'Revenue from product sales'
  },
  'acct_service_4002': {
    id: 'acct_service_4002',
    code: '4002',
    name: 'Service Revenue',
    type: ACCOUNT_TYPES.REVENUE,
    parentId: 'acct_revenue_4000',
    level: 2,
    currency: CURRENCIES.MYR,
    isActive: true,
    description: 'Revenue from service provision'
  },
  'acct_other_income_4900': {
    id: 'acct_other_income_4900',
    code: '4900',
    name: 'Other Income',
    type: ACCOUNT_TYPES.REVENUE,
    level: 1,
    currency: CURRENCIES.MYR,
    isActive: true,
    description: 'Miscellaneous income'
  },
  'acct_fx_gain_7100': {
    id: 'acct_fx_gain_7100',
    code: '7100',
    name: 'FX Gain',
    type: ACCOUNT_TYPES.REVENUE,
    level: 1,
    currency: CURRENCIES.MYR,
    isActive: true,
    description: 'Foreign exchange gains',
    tags: ['fx', 'gain']
  },

  // EXPENSES (6000-6999)
  'acct_cogs_6000': {
    id: 'acct_cogs_6000',
    code: '6000',
    name: 'Cost of Goods Sold',
    type: ACCOUNT_TYPES.COST_OF_GOODS_SOLD,
    level: 1,
    currency: CURRENCIES.MYR,
    isActive: true,
    description: 'Direct costs of producing goods'
  },
  'acct_operating_7000': {
    id: 'acct_operating_7000',
    code: '7000',
    name: 'Operating Expenses',
    type: ACCOUNT_TYPES.EXPENSE,
    level: 1,
    currency: CURRENCIES.MYR,
    isActive: true,
    description: 'General operating expenses'
  },
  'acct_bank_fees_7001': {
    id: 'acct_bank_fees_7001',
    code: '7001',
    name: 'Bank Fees',
    type: ACCOUNT_TYPES.EXPENSE,
    parentId: 'acct_operating_7000',
    level: 2,
    currency: CURRENCIES.MYR,
    isActive: true,
    description: 'Banking and transaction fees',
    tags: ['banking', 'fees']
  },
  'acct_office_7002': {
    id: 'acct_office_7002',
    code: '7002',
    name: 'Office Expenses',
    type: ACCOUNT_TYPES.EXPENSE,
    parentId: 'acct_operating_7000',
    level: 2,
    currency: CURRENCIES.MYR,
    isActive: true,
    description: 'Office supplies and utilities'
  },
  'acct_travel_7003': {
    id: 'acct_travel_7003',
    code: '7003',
    name: 'Travel Expenses',
    type: ACCOUNT_TYPES.EXPENSE,
    parentId: 'acct_operating_7000',
    level: 2,
    currency: CURRENCIES.MYR,
    isActive: true,
    description: 'Business travel and accommodation'
  },
  'acct_fx_loss_8100': {
    id: 'acct_fx_loss_8100',
    code: '8100',
    name: 'FX Loss',
    type: ACCOUNT_TYPES.EXPENSE,
    level: 1,
    currency: CURRENCIES.MYR,
    isActive: true,
    description: 'Foreign exchange losses',
    tags: ['fx', 'loss']
  }
};

// ============================================================================
// ACCOUNT ID MAPPINGS (Backward Compatibility)
// ============================================================================

export const ACCOUNT_IDS = {
  // Core accounts
  BANK: 'acct_bank_1000',
  AR: 'acct_ar_1100',
  AP: 'acct_ap_2100',
  TAX: 'acct_tax_2105',
  REVENUE: 'acct_revenue_4000',
  FEES: 'acct_bank_fees_7001',

  // Advances and prepayments
  ADV_CUSTOMER: 'acct_advances_2300',
  PREPAY_VENDOR: 'acct_vend_prepay_1201',

  // FX accounts
  FX_GAIN: 'acct_fx_gain_7100',
  FX_LOSS: 'acct_fx_loss_8100',

  // Additional accounts
  INVENTORY: 'acct_inventory_1300',
  FIXED_ASSETS: 'acct_fixed_assets_1500',
  EQUITY: 'acct_equity_3000',
  RETAINED_EARNINGS: 'acct_retained_earnings_3100',
  COGS: 'acct_cogs_6000',
  OFFICE_EXPENSES: 'acct_office_7002',
  TRAVEL_EXPENSES: 'acct_travel_7003'
} as const;

// ============================================================================
// BUSINESS RULE MAPPINGS
// ============================================================================

export const JOURNAL_TEMPLATES = {
  [PAYMENT_TYPES.CUSTOMER_PAYMENT]: {
    DEBIT_ACCOUNT: 'BANK' as const,
    CREDIT_ACCOUNT: 'AR' as const,
    DESCRIPTION_PREFIX: 'Receipt',
    ALLOW_OVERPAYMENT: true,
    OVERPAYMENT_ACCOUNT: 'ADV_CUSTOMER' as const
  },
  [PAYMENT_TYPES.SUPPLIER_PAYMENT]: {
    DEBIT_ACCOUNT: 'AP' as const,
    CREDIT_ACCOUNT: 'BANK' as const,
    DESCRIPTION_PREFIX: 'Payment',
    ALLOW_OVERPAYMENT: true,
    OVERPAYMENT_ACCOUNT: 'PREPAY_VENDOR' as const
  },
  [PAYMENT_TYPES.INTERNAL_TRANSFER]: {
    DEBIT_ACCOUNT: 'BANK' as const,
    CREDIT_ACCOUNT: 'BANK' as const,
    DESCRIPTION_PREFIX: 'Transfer',
    ALLOW_OVERPAYMENT: false,
    OVERPAYMENT_ACCOUNT: undefined
  },
  [PAYMENT_TYPES.REFUND]: {
    DEBIT_ACCOUNT: 'AR' as const,
    CREDIT_ACCOUNT: 'BANK' as const,
    DESCRIPTION_PREFIX: 'Refund',
    ALLOW_OVERPAYMENT: false,
    OVERPAYMENT_ACCOUNT: undefined
  }
} as const;

export const VALIDATION_RULES = {
  MIN_AMOUNT: 0.01,
  MAX_AMOUNT: 999999999.99,
  ROUNDING_PRECISION: 2,
  FX_ROUNDING_THRESHOLD: 0.01,
  MAX_ALLOCATIONS: 100,
  MAX_LINES_PER_JOURNAL: 1000
} as const;

export const ERROR_CODES = {
  ACCOUNTS_NOT_FOUND: 'ACCOUNTS_NOT_FOUND',
  INVALID_AMOUNT: 'INVALID_AMOUNT',
  JOURNAL_UNBALANCED: 'JOURNAL_UNBALANCED',
  INVALID_CURRENCY: 'INVALID_CURRENCY',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_ACCOUNT_TYPE: 'INVALID_ACCOUNT_TYPE',
  CURRENCY_MISMATCH: 'CURRENCY_MISMATCH',
  OVERPAYMENT_NOT_ALLOWED: 'OVERPAYMENT_NOT_ALLOWED',
  UNDERPAYMENT_NOT_ALLOWED: 'UNDERPAYMENT_NOT_ALLOWED',
  FX_RATE_REQUIRED: 'FX_RATE_REQUIRED',
  INVALID_PAYMENT_TYPE: 'INVALID_PAYMENT_TYPE',
  INVALID_ALLOCATION_TYPE: 'INVALID_ALLOCATION_TYPE'
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get account definition by ID
 */
export function getAccountDefinition(accountId: string): AccountDefinition | undefined {
  return ACCOUNT_HIERARCHY[accountId];
}

/**
 * Get all accounts by type
 */
export function getAccountsByType(type: AccountType): AccountDefinition[] {
  return Object.values(ACCOUNT_HIERARCHY).filter(account => account.type === type);
}

/**
 * Get all accounts by currency
 */
export function getAccountsByCurrency(currency: Currency): AccountDefinition[] {
  return Object.values(ACCOUNT_HIERARCHY).filter(account => account.currency === currency);
}

/**
 * Get child accounts of a parent
 */
export function getChildAccounts(parentId: string): AccountDefinition[] {
  return Object.values(ACCOUNT_HIERARCHY).filter(account => account.parentId === parentId);
}

/**
 * Get account hierarchy path
 */
export function getAccountPath(accountId: string): string[] {
  const account = getAccountDefinition(accountId);
  if (!account) return [];

  const path = [account.code];
  let current: AccountDefinition | undefined = account;

  while (current?.parentId) {
    current = getAccountDefinition(current.parentId);
    if (!current) break;
    path.unshift(current.code);
  }

  return path;
}

/**
 * Determine payment type from allocation type
 */
export function getPaymentTypeFromAllocation(allocationType: AllocationType): PaymentType {
  switch (allocationType) {
    case ALLOCATION_TYPES.INVOICE:
    case ALLOCATION_TYPES.CREDIT_NOTE:
      return PAYMENT_TYPES.CUSTOMER_PAYMENT;
    case ALLOCATION_TYPES.BILL:
    case ALLOCATION_TYPES.DEBIT_NOTE:
      return PAYMENT_TYPES.SUPPLIER_PAYMENT;
    case ALLOCATION_TYPES.ADVANCE:
      return PAYMENT_TYPES.CUSTOMER_PAYMENT;
    case ALLOCATION_TYPES.REFUND:
      return PAYMENT_TYPES.REFUND;
    default:
      throw new Error(`Invalid allocation type: ${allocationType}`);
  }
}

/**
 * Get journal template for payment type
 */
export function getJournalTemplate(paymentType: PaymentType) {
  return JOURNAL_TEMPLATES[paymentType];
}

/**
 * Get account ID for journal line
 */
export function getJournalAccountId(
  paymentType: PaymentType,
  lineType: 'DEBIT' | 'CREDIT',
  bankAccountId: string,
  arAccountId: string,
  apAccountId: string
): string {
  const template = getJournalTemplate(paymentType);

  if (lineType === 'DEBIT') {
    if (template.DEBIT_ACCOUNT === 'BANK') return bankAccountId;
    if (template.DEBIT_ACCOUNT === 'AR') return arAccountId;
    if (template.DEBIT_ACCOUNT === 'AP') return apAccountId;
    return '';
  } else {
    const creditAccount = (template as { CREDIT_ACCOUNT?: string }).CREDIT_ACCOUNT;
    if (creditAccount === 'BANK') return bankAccountId;
    if (creditAccount === 'AR') return arAccountId;
    if (creditAccount === 'AP') return apAccountId;
    return '';
  }
}

/**
 * Validate account exists and is active
 */
export function validateAccount(accountId: string): { valid: boolean; error?: string } {
  const account = getAccountDefinition(accountId);
  if (!account) {
    return { valid: false, error: `Account ${accountId} not found` };
  }
  if (!account.isActive) {
    return { valid: false, error: `Account ${accountId} is inactive` };
  }
  return { valid: true };
}

/**
 * Validate currency consistency
 */
export function validateCurrencyConsistency(
  accounts: string[],
  expectedCurrency: Currency
): { valid: boolean; error?: string } {
  for (const accountId of accounts) {
    const account = getAccountDefinition(accountId);
    if (account && account.currency !== expectedCurrency) {
      return {
        valid: false,
        error: `Account ${accountId} currency ${account.currency} does not match expected ${expectedCurrency}`
      };
    }
  }
  return { valid: true };
}

/**
 * Get overpayment account for payment type
 */
export function getOverpaymentAccount(paymentType: PaymentType): string | null {
  const template = getJournalTemplate(paymentType);
  if (!template.ALLOW_OVERPAYMENT || !template.OVERPAYMENT_ACCOUNT) {
    return null;
  }
  return ACCOUNT_IDS[template.OVERPAYMENT_ACCOUNT as keyof typeof ACCOUNT_IDS];
}

/**
 * Check if payment type allows overpayment
 */
export function allowsOverpayment(paymentType: PaymentType): boolean {
  const template = getJournalTemplate(paymentType);
  return template.ALLOW_OVERPAYMENT;
}

// ============================================================================
// TEST DATA GENERATORS
// ============================================================================

export interface TestScenario {
  name: string;
  description: string;
  accounts: string[];
  currencies: Currency[];
  paymentTypes: PaymentType[];
  allocationTypes: AllocationType[];
}

export const TEST_SCENARIOS: Record<string, TestScenario> = {
  BASIC_CUSTOMER_PAYMENT: {
    name: 'Basic Customer Payment',
    description: 'Simple customer payment with invoice allocation',
    accounts: [ACCOUNT_IDS.BANK, ACCOUNT_IDS.AR, ACCOUNT_IDS.REVENUE],
    currencies: [CURRENCIES.MYR],
    paymentTypes: [PAYMENT_TYPES.CUSTOMER_PAYMENT],
    allocationTypes: [ALLOCATION_TYPES.INVOICE]
  },
  OVERPAYMENT_SCENARIO: {
    name: 'Customer Overpayment',
    description: 'Customer payment exceeding invoice amount',
    accounts: [ACCOUNT_IDS.BANK, ACCOUNT_IDS.AR, ACCOUNT_IDS.ADV_CUSTOMER],
    currencies: [CURRENCIES.MYR],
    paymentTypes: [PAYMENT_TYPES.CUSTOMER_PAYMENT],
    allocationTypes: [ALLOCATION_TYPES.INVOICE]
  },
  MULTI_CURRENCY: {
    name: 'Multi-Currency Payment',
    description: 'Payment in foreign currency with FX conversion',
    accounts: [ACCOUNT_IDS.BANK, ACCOUNT_IDS.AR, ACCOUNT_IDS.FX_GAIN, ACCOUNT_IDS.FX_LOSS],
    currencies: [CURRENCIES.USD, CURRENCIES.EUR, CURRENCIES.SGD],
    paymentTypes: [PAYMENT_TYPES.CUSTOMER_PAYMENT, PAYMENT_TYPES.SUPPLIER_PAYMENT],
    allocationTypes: [ALLOCATION_TYPES.INVOICE, ALLOCATION_TYPES.BILL]
  },
  SUPPLIER_PAYMENT: {
    name: 'Supplier Payment',
    description: 'Payment to supplier with bill allocation',
    accounts: [ACCOUNT_IDS.BANK, ACCOUNT_IDS.AP, ACCOUNT_IDS.COGS],
    currencies: [CURRENCIES.MYR],
    paymentTypes: [PAYMENT_TYPES.SUPPLIER_PAYMENT],
    allocationTypes: [ALLOCATION_TYPES.BILL]
  },
  COMPLEX_SCENARIO: {
    name: 'Complex Payment',
    description: 'Payment with multiple allocations, charges, and FX',
    accounts: [
      ACCOUNT_IDS.BANK, ACCOUNT_IDS.AR, ACCOUNT_IDS.AP,
      ACCOUNT_IDS.FEES, ACCOUNT_IDS.FX_GAIN, ACCOUNT_IDS.FX_LOSS,
      ACCOUNT_IDS.ADV_CUSTOMER, ACCOUNT_IDS.PREPAY_VENDOR
    ],
    currencies: [CURRENCIES.MYR, CURRENCIES.USD, CURRENCIES.EUR],
    paymentTypes: [PAYMENT_TYPES.CUSTOMER_PAYMENT, PAYMENT_TYPES.SUPPLIER_PAYMENT],
    allocationTypes: [ALLOCATION_TYPES.INVOICE, ALLOCATION_TYPES.BILL, ALLOCATION_TYPES.ADVANCE]
  }
};

/**
 * Generate test data for a specific scenario
 */
export function generateTestData(scenarioName: string): {
  accounts: AccountDefinition[];
  currencies: Currency[];
  paymentTypes: PaymentType[];
  allocationTypes: AllocationType[];
} {
  const scenario = TEST_SCENARIOS[scenarioName];
  if (!scenario) {
    throw new Error(`Unknown test scenario: ${scenarioName}`);
  }

  return {
    accounts: scenario.accounts.map(id => getAccountDefinition(id)).filter(Boolean) as AccountDefinition[],
    currencies: scenario.currencies,
    paymentTypes: scenario.paymentTypes,
    allocationTypes: scenario.allocationTypes
  };
}

/**
 * Get all available test scenarios
 */
export function getTestScenarios(): TestScenario[] {
  return Object.values(TEST_SCENARIOS);
}

