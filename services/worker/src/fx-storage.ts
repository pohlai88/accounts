// D2 FX Storage Helper - Database operations for FX rates
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { fxRates, currencies } from '@aibos/db/src/schema';
import { eq, and, desc, gte } from 'drizzle-orm';
import { type FxRateData, STALENESS_THRESHOLDS } from '@aibos/accounting';

// Database connection
let _db: ReturnType<typeof drizzle> | null = null;

function getDb() {
  if (!_db) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    const pool = new Pool({ connectionString });
    _db = drizzle(pool);
  }
  return _db;
}

/**
 * Insert FX rates into database
 */
export async function insertFxRates(rates: FxRateData[]): Promise<number> {
  const db = getDb();
  let insertedCount = 0;

  for (const rate of rates) {
    try {
      // Check if a rate for this currency pair and date already exists
      const existing = await db
        .select()
        .from(fxRates)
        .where(
          and(
            eq(fxRates.fromCurrency, rate.fromCurrency),
            eq(fxRates.toCurrency, rate.toCurrency),
            gte(fxRates.validFrom, rate.validFrom)
          )
        )
        .limit(1);

      // Only insert if no existing rate found
      if (existing.length === 0) {
        await db.insert(fxRates).values({
          fromCurrency: rate.fromCurrency,
          toCurrency: rate.toCurrency,
          rate: rate.rate.toString(),
          source: rate.source,
          validFrom: rate.validFrom,
          validTo: rate.validTo || null
        });

        insertedCount++;
      }
    } catch (error) {
      console.error(`Failed to insert FX rate ${rate.fromCurrency}/${rate.toCurrency}:`, error);
    }
  }

  return insertedCount;
}

/**
 * Get FX rate staleness information
 */
export async function getFxRatesStaleness(): Promise<{
  isStale: boolean;
  ageMinutes: number;
  threshold: number;
  latestRate?: {
    fromCurrency: string;
    toCurrency: string;
    rate: number;
    source: string;
    validFrom: Date;
  };
}> {
  const db = getDb();

  try {
    // Get the most recent FX rate
    const latestRates = await db
      .select({
        fromCurrency: fxRates.fromCurrency,
        toCurrency: fxRates.toCurrency,
        rate: fxRates.rate,
        source: fxRates.source,
        validFrom: fxRates.validFrom,
        createdAt: fxRates.createdAt
      })
      .from(fxRates)
      .orderBy(desc(fxRates.createdAt))
      .limit(1);

    if (latestRates.length === 0) {
      return {
        isStale: true,
        ageMinutes: Infinity,
        threshold: STALENESS_THRESHOLDS.WARNING
      };
    }

    const latestRate = latestRates[0];
    if (!latestRate || !latestRate.createdAt) {
      return {
        isStale: true,
        ageMinutes: Infinity,
        threshold: STALENESS_THRESHOLDS.WARNING
      };
    }

    const ageMinutes = (Date.now() - latestRate.createdAt.getTime()) / (1000 * 60);
    const isStale = ageMinutes > STALENESS_THRESHOLDS.WARNING;

    return {
      isStale,
      ageMinutes,
      threshold: STALENESS_THRESHOLDS.WARNING,
      latestRate: {
        fromCurrency: latestRate.fromCurrency,
        toCurrency: latestRate.toCurrency,
        rate: Number(latestRate.rate),
        source: latestRate.source,
        validFrom: latestRate.validFrom
      }
    };

  } catch (error) {
    console.error('Failed to check FX rate staleness:', error);
    return {
      isStale: true,
      ageMinutes: Infinity,
      threshold: STALENESS_THRESHOLDS.WARNING
    };
  }
}

/**
 * Get current FX rate from database
 */
export async function getCurrentFxRateFromDb(
  fromCurrency: string,
  toCurrency: string
): Promise<{
  rate: number;
  source: string;
  validFrom: Date;
  ageMinutes: number;
} | null> {
  const db = getDb();

  try {
    const rates = await db
      .select({
        rate: fxRates.rate,
        source: fxRates.source,
        validFrom: fxRates.validFrom,
        createdAt: fxRates.createdAt
      })
      .from(fxRates)
      .where(
        and(
          eq(fxRates.fromCurrency, fromCurrency),
          eq(fxRates.toCurrency, toCurrency)
        )
      )
      .orderBy(desc(fxRates.validFrom))
      .limit(1);

    if (rates.length === 0) {
      return null;
    }

    const rate = rates[0];
    if (!rate || !rate.createdAt) {
      return null;
    }

    const ageMinutes = (Date.now() - rate.createdAt.getTime()) / (1000 * 60);

    return {
      rate: Number(rate.rate),
      source: rate.source,
      validFrom: rate.validFrom,
      ageMinutes
    };

  } catch (error) {
    console.error(`Failed to get FX rate ${fromCurrency}/${toCurrency}:`, error);
    return null;
  }
}

/**
 * Get FX rates for multiple currency pairs
 */
export async function getFxRatesForCurrencies(
  baseCurrency: string,
  targetCurrencies: string[]
): Promise<Array<{
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  source: string;
  validFrom: Date;
  ageMinutes: number;
}>> {
  const results: Array<{
    fromCurrency: string;
    toCurrency: string;
    rate: number;
    source: string;
    validFrom: Date;
    ageMinutes: number;
  }> = [];

  for (const targetCurrency of targetCurrencies) {
    try {
      const rate = await getCurrentFxRateFromDb(baseCurrency, targetCurrency);
      if (rate) {
        results.push({
          fromCurrency: baseCurrency,
          toCurrency: targetCurrency,
          ...rate
        });
      }
    } catch (error) {
      console.error(`Failed to get rate for ${baseCurrency}/${targetCurrency}:`, error);
    }
  }

  return results;
}

/**
 * Clean up old FX rates (keep last 30 days)
 */
export async function cleanupOldFxRates(): Promise<number> {
  const db = getDb();

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    await db
      .delete(fxRates)
      .where(
        and(
          gte(fxRates.createdAt, thirtyDaysAgo)
        )
      );

    // Note: Drizzle doesn't return affected rows count directly
    // This is a placeholder - in production you might want to count first
    return 0;

  } catch (error) {
    console.error('Failed to cleanup old FX rates:', error);
    return 0;
  }
}

/**
 * Ensure required currencies exist in the currencies table
 */
export async function ensureCurrenciesExist(currencyCodes: string[]): Promise<void> {
  const db = getDb();

  // Standard currency data
  const currencyData: Record<string, { name: string; symbol: string; decimalPlaces: number }> = {
    'MYR': { name: 'Malaysian Ringgit', symbol: 'RM', decimalPlaces: 2 },
    'USD': { name: 'US Dollar', symbol: '$', decimalPlaces: 2 },
    'EUR': { name: 'Euro', symbol: '€', decimalPlaces: 2 },
    'GBP': { name: 'British Pound', symbol: '£', decimalPlaces: 2 },
    'JPY': { name: 'Japanese Yen', symbol: '¥', decimalPlaces: 0 },
    'SGD': { name: 'Singapore Dollar', symbol: 'S$', decimalPlaces: 2 },
    'THB': { name: 'Thai Baht', symbol: '฿', decimalPlaces: 2 },
    'VND': { name: 'Vietnamese Dong', symbol: '₫', decimalPlaces: 0 },
    'IDR': { name: 'Indonesian Rupiah', symbol: 'Rp', decimalPlaces: 0 },
    'PHP': { name: 'Philippine Peso', symbol: '₱', decimalPlaces: 2 },
    'AUD': { name: 'Australian Dollar', symbol: 'A$', decimalPlaces: 2 },
    'CAD': { name: 'Canadian Dollar', symbol: 'C$', decimalPlaces: 2 },
    'CHF': { name: 'Swiss Franc', symbol: 'CHF', decimalPlaces: 2 },
    'CNY': { name: 'Chinese Yuan', symbol: '¥', decimalPlaces: 2 },
    'HKD': { name: 'Hong Kong Dollar', symbol: 'HK$', decimalPlaces: 2 },
    'TWD': { name: 'Taiwan Dollar', symbol: 'NT$', decimalPlaces: 2 },
    'KRW': { name: 'South Korean Won', symbol: '₩', decimalPlaces: 0 },
    'INR': { name: 'Indian Rupee', symbol: '₹', decimalPlaces: 2 }
  };

  for (const code of currencyCodes) {
    try {
      const existing = await db
        .select()
        .from(currencies)
        .where(eq(currencies.code, code))
        .limit(1);

      if (existing.length === 0) {
        const currencyInfo = currencyData[code] || {
          name: code,
          symbol: code,
          decimalPlaces: 2
        };

        await db.insert(currencies).values({
          code,
          name: currencyInfo.name,
          symbol: currencyInfo.symbol,
          decimalPlaces: currencyInfo.decimalPlaces.toString(),
          isActive: true
        });
      }
    } catch (error) {
      console.error(`Failed to ensure currency ${code} exists:`, error);
    }
  }
}
