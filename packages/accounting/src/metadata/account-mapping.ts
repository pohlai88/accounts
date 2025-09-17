/**
 * Standardized Account Metadata Mapping System
 *
 * This eliminates field name debugging hell by providing a single source of truth
 * for all account mappings, field names, and business logic constants.
 */

// ============================================================================
// ACCOUNT TYPE MAPPINGS
// ============================================================================

export const ACCOUNT_TYPES = {
  ASSET: 'ASSET',
  LIABILITY: 'LIABILITY',
  EQUITY: 'EQUITY',
  REVENUE: 'REVENUE',
  EXPENSE: 'EXPENSE'
} as const;

export type AccountType = typeof ACCOUNT_TYPES[keyof typeof ACCOUNT_TYPES];

// ============================================================================
// STANDARD ACCOUNT CODES (GAAP/IFRS Compliant)
// ============================================================================

export const STANDARD_ACCOUNT_CODES = {
  // ASSETS (1000-1999)
  BANK_ACCOUNT: '1000',
  ACCOUNTS_RECEIVABLE: '1100',
  VENDOR_PREPAYMENTS: '1200',
  CUSTOMER_ADVANCES: '2300',

  // LIABILITIES (2000-2999)
  ACCOUNTS_PAYABLE: '2100',
  TAX_PAYABLE: '2105',

  // REVENUE (4000-4999)
  SALES_REVENUE: '4000',
  FX_GAIN: '7100',

  // EXPENSES (6000-6999)
  BANK_FEES: '6000',
  FX_LOSS: '8100'
} as const;

// ============================================================================
// TEST ACCOUNT MAPPINGS (Deterministic UUIDs)
// ============================================================================

export const TEST_ACCOUNT_IDS = {
  // Core accounts for testing
  BANK_ACCOUNT: '00000000-0000-0000-0000-000000000001',
  ACCOUNTS_RECEIVABLE: '00000000-0000-0000-0000-000000000002',
  ACCOUNTS_PAYABLE: '00000000-0000-0000-0000-000000000003',
  TAX_PAYABLE: '00000000-0000-0000-0000-000000000004',
  SALES_REVENUE: '00000000-0000-0000-0000-000000000005',
  BANK_FEES: '00000000-0000-0000-0000-000000000006',
  CUSTOMER_ADVANCES: '00000000-0000-0000-0000-000000000007',
  VENDOR_PREPAYMENTS: '00000000-0000-0000-0000-000000000008',
  FX_GAIN: '00000000-0000-0000-0000-000000000009',
  FX_LOSS: '00000000-0000-0000-0000-000000000010'
} as const;

// ============================================================================
// ACCOUNT ID MAPPINGS (String-based for compatibility)
// ============================================================================

export const ACCOUNT_IDS = {
  BANK: "acct_bank_1000",
  AR: "acct_ar_1100",
  AP: "acct_ap_2100",
  TAX: "acct_tax_2105",
  REV: "acct_rev_4000",
  FEE: "acct_exp_6000",
  ADV_CUSTOMER: "acct_cust_adv_2300",   // Customer Advances (LIABILITY)
  PREPAY_VENDOR: "acct_vend_prepay_1200", // Vendor Prepayments (ASSET)
  FX_GAIN: "acct_fx_gain_7100",          // FX Gain (REVENUE)
  FX_LOSS: "acct_fx_loss_8100",          // FX Loss (EXPENSE)
} as const;

// ============================================================================
// BUSINESS LOGIC MAPPINGS
// ============================================================================

export const PAYMENT_TYPES = {
  CUSTOMER_PAYMENT: 'CUSTOMER_PAYMENT',
  SUPPLIER_PAYMENT: 'SUPPLIER_PAYMENT'
} as const;

export type PaymentType = typeof PAYMENT_TYPES[keyof typeof PAYMENT_TYPES];

export const ALLOCATION_TYPES = {
  INVOICE: 'INVOICE',
  BILL: 'BILL'
} as const;

export type AllocationType = typeof ALLOCATION_TYPES[keyof typeof ALLOCATION_TYPES];

// ============================================================================
// JOURNAL POSTING TEMPLATES
// ============================================================================

export const JOURNAL_TEMPLATES = {
  CUSTOMER_PAYMENT: {
    // Invoice receipt: DR Bank, CR AR
    DEBIT_ACCOUNT: 'BANK_ACCOUNT',
    CREDIT_ACCOUNT: 'ACCOUNTS_RECEIVABLE',
    DESCRIPTION_PREFIX: 'Receipt'
  },
  SUPPLIER_PAYMENT: {
    // Bill payment: DR AP, CR Bank
    DEBIT_ACCOUNT: 'ACCOUNTS_PAYABLE',
    CREDIT_ACCOUNT: 'BANK_ACCOUNT',
    DESCRIPTION_PREFIX: 'Payment'
  }
} as const;

// ============================================================================
// FIELD MAPPING FUNCTIONS
// ============================================================================

/**
 * Get account ID by account type for testing
 */
export function getTestAccountId(accountType: keyof typeof TEST_ACCOUNT_IDS): string {
  return TEST_ACCOUNT_IDS[accountType];
}

/**
 * Get account code by account type
 */
export function getAccountCode(accountType: keyof typeof STANDARD_ACCOUNT_CODES): string {
  return STANDARD_ACCOUNT_CODES[accountType];
}

/**
 * Determine payment type from allocation type
 */
export function getPaymentTypeFromAllocation(allocationType: AllocationType): PaymentType {
  return allocationType === ALLOCATION_TYPES.INVOICE
    ? PAYMENT_TYPES.CUSTOMER_PAYMENT
    : PAYMENT_TYPES.SUPPLIER_PAYMENT;
}

/**
 * Get journal template for payment type
 */
export function getJournalTemplate(paymentType: PaymentType): typeof JOURNAL_TEMPLATES[PaymentType] {
  return JOURNAL_TEMPLATES[paymentType];
}

/**
 * Get account ID for journal line based on payment type and line type
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
    const accountType = template.DEBIT_ACCOUNT as string;
    if (accountType === 'BANK_ACCOUNT') return bankAccountId;
    if (accountType === 'ACCOUNTS_RECEIVABLE') return arAccountId;
    if (accountType === 'ACCOUNTS_PAYABLE') return apAccountId;
    return '';
  } else {
    const accountType = template.CREDIT_ACCOUNT as string;
    if (accountType === 'BANK_ACCOUNT') return bankAccountId;
    if (accountType === 'ACCOUNTS_RECEIVABLE') return arAccountId;
    if (accountType === 'ACCOUNTS_PAYABLE') return apAccountId;
    return '';
  }
}

// ============================================================================
// VALIDATION CONSTANTS
// ============================================================================

export const VALIDATION_CONSTANTS = {
  MIN_AMOUNT: 0.01,
  MAX_AMOUNT: 999999999.99,
  ROUNDING_PRECISION: 2,
  FX_ROUNDING_THRESHOLD: 0.01
} as const;

// ============================================================================
// ERROR CODES
// ============================================================================

export const ERROR_CODES = {
  ACCOUNTS_NOT_FOUND: 'ACCOUNTS_NOT_FOUND',
  INVALID_AMOUNT: 'INVALID_AMOUNT',
  JOURNAL_UNBALANCED: 'JOURNAL_UNBALANCED',
  INVALID_CURRENCY: 'INVALID_CURRENCY',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD'
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
