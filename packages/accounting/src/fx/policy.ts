export interface FxPolicy {
  source: "primary" | "fallback";
  rounding: "bankers" | "half-up";
  valuation: "spot" | "month-end";
}

export interface FxValidationResult {
  requiresFxRate: boolean;
  baseCurrency: string;
  transactionCurrency: string;
  exchangeRate: number;
}

export const defaultFxPolicy: FxPolicy = {
  source: "primary",
  rounding: "half-up",
  valuation: "spot"
};

// Valid currency codes (ISO 4217)
const VALID_CURRENCIES = new Set([
  'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'SEK', 'NOK', 'DKK',
  'MYR', 'SGD', 'THB', 'VND', 'IDR', 'PHP', 'KRW', 'TWD', 'HKD', 'INR', 'BRL',
  'MXN', 'ZAR', 'RUB', 'TRY', 'PLN', 'CZK', 'HUF', 'ILS', 'CLP', 'COP', 'PEN',
  'ARS', 'UYU', 'BOB', 'PYG', 'VES', 'GYD', 'SRD', 'FKP', 'SHP', 'GIP'
]);

/**
 * Validate FX policy requirements for currency conversion
 */
export function validateFxPolicy(
  baseCurrency: string, 
  transactionCurrency: string
): FxValidationResult {
  // Input validation
  if (typeof baseCurrency !== 'string') {
    throw new Error('Base currency is required and must be a string');
  }
  
  if (typeof transactionCurrency !== 'string') {
    throw new Error('Transaction currency is required and must be a string');
  }
  
  if (!baseCurrency.trim()) {
    throw new Error('Invalid currency code: Base currency cannot be empty');
  }
  
  if (!transactionCurrency.trim()) {
    throw new Error('Invalid currency code: Transaction currency cannot be empty');
  }

  // Normalize currencies (trim and uppercase)
  const normalizedBase = baseCurrency.trim().toUpperCase();
  const normalizedTransaction = transactionCurrency.trim().toUpperCase();

  // Validate currency format (3 characters)
  if (normalizedBase.length !== 3 || !/^[A-Z]{3}$/.test(normalizedBase)) {
    throw new Error(`Invalid currency code: ${baseCurrency}. Must be 3 uppercase letters.`);
  }
  
  if (normalizedTransaction.length !== 3 || !/^[A-Z]{3}$/.test(normalizedTransaction)) {
    throw new Error(`Invalid currency code: ${transactionCurrency}. Must be 3 uppercase letters.`);
  }

  // Validate against known currencies
  if (!VALID_CURRENCIES.has(normalizedBase)) {
    throw new Error(`Invalid currency code: ${normalizedBase}. Not a recognized ISO 4217 currency.`);
  }
  
  if (!VALID_CURRENCIES.has(normalizedTransaction)) {
    throw new Error(`Invalid currency code: ${normalizedTransaction}. Not a recognized ISO 4217 currency.`);
  }

  // Determine if FX rate is required
  const requiresFxRate = normalizedBase !== normalizedTransaction;

  return {
    requiresFxRate,
    baseCurrency: normalizedBase,
    transactionCurrency: normalizedTransaction,
    exchangeRate: 1.0 // Default rate, would be fetched from FX service in production
  };
}
