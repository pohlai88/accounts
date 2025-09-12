// D2 FX Rate Ingest System - Primary + Fallback Sources with Staleness Detection
import { validateFxPolicy } from './policy';

// Use Node.js built-in fetch (Node 18+) and AbortController
const fetch = globalThis.fetch;
const AbortController = globalThis.AbortController;

export interface FxRateSource {
  name: string;
  priority: 'primary' | 'fallback';
  baseUrl: string;
  apiKey?: string;
  timeout: number; // milliseconds
  retries: number;
}

export interface FxRateData {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  source: string;
  timestamp: Date;
  validFrom: Date;
  validTo?: Date;
}

export interface FxIngestResult {
  success: boolean;
  rates: FxRateData[];
  errors: string[];
  source: 'primary' | 'fallback';
  staleness: {
    isStale: boolean;
    ageMinutes: number;
    threshold: number;
  };
}

export interface FxIngestError {
  success: false;
  error: string;
  source: string;
  retryable: boolean;
}

// Configuration for FX sources
export const FX_SOURCES: Record<string, FxRateSource> = {
  // Primary source: Bank Negara Malaysia (BNM)
  BNM: {
    name: 'Bank Negara Malaysia',
    priority: 'primary',
    baseUrl: 'https://api.bnm.gov.my/public/exchange-rate',
    timeout: 10000, // 10 seconds
    retries: 3
  },

  // Fallback source: ExchangeRate-API
  EXCHANGE_RATE_API: {
    name: 'ExchangeRate-API',
    priority: 'fallback',
    baseUrl: 'https://api.exchangerate-api.com/v4/latest',
    timeout: 15000, // 15 seconds
    retries: 2
  },

  // Additional fallback: Fixer.io
  FIXER: {
    name: 'Fixer.io',
    priority: 'fallback',
    baseUrl: 'https://api.fixer.io/latest',
    apiKey: process.env.FIXER_API_KEY,
    timeout: 12000, // 12 seconds
    retries: 2
  }
};

// Staleness thresholds (in minutes)
export const STALENESS_THRESHOLDS = {
  CRITICAL: 60,    // 1 hour - critical for real-time trading
  WARNING: 240,    // 4 hours - warning level
  ACCEPTABLE: 1440 // 24 hours - acceptable for accounting
};

/**
 * Ingest FX rates from primary source with fallback
 */
export async function ingestFxRates(
  baseCurrency: string = 'MYR',
  targetCurrencies: string[] = ['USD', 'EUR', 'GBP', 'SGD', 'JPY'],
  stalenessThreshold: number = STALENESS_THRESHOLDS.WARNING
): Promise<FxIngestResult | FxIngestError> {

  // 1. Validate inputs
  for (const currency of [baseCurrency, ...targetCurrencies]) {
    try {
      validateFxPolicy(baseCurrency, currency);
    } catch (error) {
      return {
        success: false,
        error: `Invalid currency: ${error instanceof Error ? error.message : 'Unknown error'}`,
        source: 'validation',
        retryable: false
      };
    }
  }

  // 2. Try primary source first
  try {
    const primarySource = FX_SOURCES.BNM;
    if (!primarySource) {
      throw new Error('Primary FX source (BNM) not configured');
    }

    const primaryResult = await fetchFromSource(
      primarySource,
      baseCurrency,
      targetCurrencies
    );

    if (primaryResult.success) {
      const staleness = calculateStaleness(primaryResult.rates, stalenessThreshold);

      return {
        success: true,
        rates: primaryResult.rates,
        errors: [],
        source: 'primary',
        staleness
      };
    }
  } catch (error) {
    console.warn('Primary FX source failed:', error);
  }

  // 3. Try fallback sources
  const fallbackSources = [FX_SOURCES.EXCHANGE_RATE_API, FX_SOURCES.FIXER].filter(Boolean);
  const errors: string[] = [];

  for (const source of fallbackSources) {
    if (!source) continue;

    try {
      const fallbackResult = await fetchFromSource(source, baseCurrency, targetCurrencies);

      if (fallbackResult.success) {
        const staleness = calculateStaleness(fallbackResult.rates, stalenessThreshold);

        return {
          success: true,
          rates: fallbackResult.rates,
          errors,
          source: 'fallback',
          staleness
        };
      }
    } catch (error) {
      const errorMsg = `${source.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMsg);
      console.warn('Fallback FX source failed:', errorMsg);
    }
  }

  // 4. All sources failed
  return {
    success: false,
    error: `All FX sources failed: ${errors.join('; ')}`,
    source: 'all',
    retryable: true
  };
}

/**
 * Fetch rates from a specific source
 */
async function fetchFromSource(
  source: FxRateSource,
  baseCurrency: string,
  targetCurrencies: string[]
): Promise<{ success: boolean; rates: FxRateData[] }> {

  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt < source.retries) {
    attempt++;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), source.timeout);

      let url: string;
      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'User-Agent': 'AIBOS-Accounting/1.0'
      };

      // Build URL based on source
      switch (source.name) {
        case 'Bank Negara Malaysia':
          url = `${source.baseUrl}?quote=${baseCurrency}&base=${targetCurrencies.join(',')}`;
          break;

        case 'ExchangeRate-API':
          url = `${source.baseUrl}/${baseCurrency}`;
          break;

        case 'Fixer.io':
          url = `${source.baseUrl}?base=${baseCurrency}&symbols=${targetCurrencies.join(',')}`;
          if (source.apiKey) {
            headers['Authorization'] = `Bearer ${source.apiKey}`;
          }
          break;

        default:
          throw new Error(`Unknown FX source: ${source.name}`);
      }

      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const rates = parseSourceResponse(source, data, baseCurrency, targetCurrencies);

      return { success: true, rates };

    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      if (attempt < source.retries) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('All retry attempts failed');
}

/**
 * Parse response from different FX sources
 */
function parseSourceResponse(
  source: FxRateSource,
  data: Record<string, unknown>,
  baseCurrency: string,
  targetCurrencies: string[]
): FxRateData[] {
  const rates: FxRateData[] = [];
  const timestamp = new Date();

  switch (source.name) {
    case 'Bank Negara Malaysia':
      // BNM API format: { data: [{ currency_code: 'USD', rate: { middle_rate: '4.2500' } }] }
      if (data.data && Array.isArray(data.data)) {
        for (const item of data.data) {
          if (targetCurrencies.includes(item.currency_code)) {
            rates.push({
              fromCurrency: baseCurrency,
              toCurrency: item.currency_code,
              rate: parseFloat(item.rate?.middle_rate || item.rate?.selling_rate || '0'),
              source: source.name,
              timestamp,
              validFrom: timestamp,
              validTo: new Date(timestamp.getTime() + 24 * 60 * 60 * 1000) // 24 hours
            });
          }
        }
      }
      break;

    case 'ExchangeRate-API':
      // ExchangeRate-API format: { rates: { USD: 0.24, EUR: 0.21 } }
      if (data.rates) {
        for (const [currency, rate] of Object.entries(data.rates)) {
          if (targetCurrencies.includes(currency)) {
            rates.push({
              fromCurrency: baseCurrency,
              toCurrency: currency,
              rate: typeof rate === 'number' ? rate : parseFloat(String(rate)),
              source: source.name,
              timestamp,
              validFrom: timestamp,
              validTo: new Date(timestamp.getTime() + 24 * 60 * 60 * 1000)
            });
          }
        }
      }
      break;

    case 'Fixer.io':
      // Fixer.io format: { rates: { USD: 0.24, EUR: 0.21 } }
      if (data.rates) {
        for (const [currency, rate] of Object.entries(data.rates)) {
          if (targetCurrencies.includes(currency)) {
            rates.push({
              fromCurrency: baseCurrency,
              toCurrency: currency,
              rate: typeof rate === 'number' ? rate : parseFloat(String(rate)),
              source: source.name,
              timestamp,
              validFrom: timestamp,
              validTo: new Date(timestamp.getTime() + 24 * 60 * 60 * 1000)
            });
          }
        }
      }
      break;
  }

  return rates;
}

/**
 * Calculate staleness of FX rates
 */
function calculateStaleness(
  rates: FxRateData[],
  threshold: number
): { isStale: boolean; ageMinutes: number; threshold: number } {

  if (rates.length === 0) {
    return { isStale: true, ageMinutes: Infinity, threshold };
  }

  // Find the oldest rate
  const oldestRate = rates.reduce((oldest, rate) =>
    rate.timestamp < oldest.timestamp ? rate : oldest
  );

  const ageMinutes = (Date.now() - oldestRate.timestamp.getTime()) / (1000 * 60);
  const isStale = ageMinutes > threshold;

  return { isStale, ageMinutes, threshold };
}

/**
 * Get current FX rate for a currency pair
 */
export async function getCurrentFxRate(
  fromCurrency: string,
  toCurrency: string,
  stalenessThreshold: number = STALENESS_THRESHOLDS.WARNING
): Promise<{ rate: number; source: string; age: number } | null> {

  const result = await ingestFxRates(fromCurrency, [toCurrency], stalenessThreshold);

  if (!result.success) {
    return null;
  }

  const rate = result.rates.find(r =>
    r.fromCurrency === fromCurrency && r.toCurrency === toCurrency
  );

  if (!rate) {
    return null;
  }

  const ageMinutes = (Date.now() - rate.timestamp.getTime()) / (1000 * 60);

  return {
    rate: rate.rate,
    source: rate.source,
    age: ageMinutes
  };
}

/**
 * Validate FX rate freshness
 */
export function validateFxRateFreshness(
  timestamp: Date,
  threshold: number = STALENESS_THRESHOLDS.WARNING
): { isValid: boolean; ageMinutes: number; threshold: number } {

  const ageMinutes = (Date.now() - timestamp.getTime()) / (1000 * 60);
  const isValid = ageMinutes <= threshold;

  return { isValid, ageMinutes, threshold };
}
