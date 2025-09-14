/**
 * Exchange Rate API Integration Service
 * Integrates with external exchange rate APIs for real-time rates
 * Supports multiple providers with fallback mechanisms
 */

import { CurrencyCode } from "./currency-management";
import { supabase } from "./supabase";

export interface ExchangeRateProvider {
  name: string;
  baseUrl: string;
  apiKey?: string;
  isActive: boolean;
  priority: number;
  rateLimit: {
    requestsPerMinute: number;
    requestsPerDay: number;
  };
}

export interface ExchangeRateResponse {
  from: CurrencyCode;
  to: CurrencyCode;
  rate: number;
  date: string;
  provider: string;
  timestamp: number;
}

export interface BulkExchangeRateResponse {
  base: CurrencyCode;
  rates: Record<CurrencyCode, number>;
  date: string;
  provider: string;
  timestamp: number;
}

export interface ExchangeRateError {
  provider: string;
  error: string;
  timestamp: number;
}

/**
 * Exchange Rate API Integration Service
 */
export class ExchangeRateAPIService {
  private static providers: ExchangeRateProvider[] = [
    {
      name: "exchangerate-api",
      baseUrl: "https://api.exchangerate-api.com/v4",
      isActive: true,
      priority: 1,
      rateLimit: { requestsPerMinute: 100, requestsPerDay: 1000 },
    },
    {
      name: "fixer",
      baseUrl: "https://api.fixer.io/v1",
      isActive: false, // Requires API key
      priority: 2,
      rateLimit: { requestsPerMinute: 100, requestsPerDay: 1000 },
    },
    {
      name: "currencylayer",
      baseUrl: "http://api.currencylayer.com",
      isActive: false, // Requires API key
      priority: 3,
      rateLimit: { requestsPerMinute: 100, requestsPerDay: 1000 },
    },
  ];

  /**
   * Get exchange rate from API
   */
  static async getExchangeRate(
    from: CurrencyCode,
    to: CurrencyCode,
    date?: string,
  ): Promise<{
    success: boolean;
    rate?: ExchangeRateResponse;
    error?: string;
  }> {
    try {
      if (from === to) {
        return {
          success: true,
          rate: {
            from,
            to,
            rate: 1,
            date: date || new Date().toISOString().split("T")[0],
            provider: "internal",
            timestamp: Date.now(),
          },
        };
      }

      // Try providers in priority order
      for (const provider of this.providers
        .filter(p => p.isActive)
        .sort((a, b) => a.priority - b.priority)) {
        try {
          const result = await this.fetchFromProvider(provider, from, to, date);
          if (result.success && result.rate) {
            // Store in database
            await this.storeExchangeRate(result.rate);
            return result;
          }
        } catch (error) {
          console.warn(`Provider ${provider.name} failed:`, error);
          continue;
        }
      }

      return { success: false, error: "All exchange rate providers failed" };
    } catch (error) {
      console.error("Error getting exchange rate:", error);
      return { success: false, error: "Failed to get exchange rate" };
    }
  }

  /**
   * Get bulk exchange rates
   */
  static async getBulkExchangeRates(
    base: CurrencyCode,
    targets: CurrencyCode[],
    date?: string,
  ): Promise<{
    success: boolean;
    rates?: BulkExchangeRateResponse;
    error?: string;
  }> {
    try {
      // Try providers in priority order
      for (const provider of this.providers
        .filter(p => p.isActive)
        .sort((a, b) => a.priority - b.priority)) {
        try {
          const result = await this.fetchBulkFromProvider(provider, base, targets, date);
          if (result.success && result.rates) {
            // Store in database
            await this.storeBulkExchangeRates(result.rates);
            return result;
          }
        } catch (error) {
          console.warn(`Provider ${provider.name} failed:`, error);
          continue;
        }
      }

      return { success: false, error: "All exchange rate providers failed" };
    } catch (error) {
      console.error("Error getting bulk exchange rates:", error);
      return { success: false, error: "Failed to get bulk exchange rates" };
    }
  }

  /**
   * Fetch from specific provider
   */
  private static async fetchFromProvider(
    provider: ExchangeRateProvider,
    from: CurrencyCode,
    to: CurrencyCode,
    date?: string,
  ): Promise<{
    success: boolean;
    rate?: ExchangeRateResponse;
    error?: string;
  }> {
    switch (provider.name) {
      case "exchangerate-api":
        return await this.fetchFromExchangeRateAPI(provider, from, to, date);
      case "fixer":
        return await this.fetchFromFixer(provider, from, to, date);
      case "currencylayer":
        return await this.fetchFromCurrencyLayer(provider, from, to, date);
      default:
        return { success: false, error: "Unknown provider" };
    }
  }

  /**
   * Fetch from ExchangeRate-API
   */
  private static async fetchFromExchangeRateAPI(
    provider: ExchangeRateProvider,
    from: CurrencyCode,
    to: CurrencyCode,
    date?: string,
  ): Promise<{
    success: boolean;
    rate?: ExchangeRateResponse;
    error?: string;
  }> {
    try {
      const url = date
        ? `${provider.baseUrl}/${date}/${from}`
        : `${provider.baseUrl}/latest/${from}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.rates || !data.rates[to]) {
        throw new Error("Rate not found in response");
      }

      return {
        success: true,
        rate: {
          from,
          to,
          rate: data.rates[to],
          date: data.date || new Date().toISOString().split("T")[0],
          provider: provider.name,
          timestamp: Date.now(),
        },
      };
    } catch (error) {
      return { success: false, error: `ExchangeRate-API error: ${error}` };
    }
  }

  /**
   * Fetch from Fixer.io
   */
  private static async fetchFromFixer(
    provider: ExchangeRateProvider,
    from: CurrencyCode,
    to: CurrencyCode,
    date?: string,
  ): Promise<{
    success: boolean;
    rate?: ExchangeRateResponse;
    error?: string;
  }> {
    try {
      if (!provider.apiKey) {
        return { success: false, error: "API key required for Fixer.io" };
      }

      const url = date
        ? `${provider.baseUrl}/${date}?access_key=${provider.apiKey}&base=${from}&symbols=${to}`
        : `${provider.baseUrl}/latest?access_key=${provider.apiKey}&base=${from}&symbols=${to}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.info || "Fixer.io API error");
      }

      if (!data.rates || !data.rates[to]) {
        throw new Error("Rate not found in response");
      }

      return {
        success: true,
        rate: {
          from,
          to,
          rate: data.rates[to],
          date: data.date || new Date().toISOString().split("T")[0],
          provider: provider.name,
          timestamp: Date.now(),
        },
      };
    } catch (error) {
      return { success: false, error: `Fixer.io error: ${error}` };
    }
  }

  /**
   * Fetch from CurrencyLayer
   */
  private static async fetchFromCurrencyLayer(
    provider: ExchangeRateProvider,
    from: CurrencyCode,
    to: CurrencyCode,
    date?: string,
  ): Promise<{
    success: boolean;
    rate?: ExchangeRateResponse;
    error?: string;
  }> {
    try {
      if (!provider.apiKey) {
        return { success: false, error: "API key required for CurrencyLayer" };
      }

      const url = date
        ? `${provider.baseUrl}/historical?access_key=${provider.apiKey}&date=${date}&currencies=${to}&source=${from}`
        : `${provider.baseUrl}/live?access_key=${provider.apiKey}&currencies=${to}&source=${from}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.info || "CurrencyLayer API error");
      }

      const rateKey = date ? `${from}${to}` : `${from}${to}`;
      if (!data.quotes || !data.quotes[rateKey]) {
        throw new Error("Rate not found in response");
      }

      return {
        success: true,
        rate: {
          from,
          to,
          rate: data.quotes[rateKey],
          date: data.date || new Date().toISOString().split("T")[0],
          provider: provider.name,
          timestamp: Date.now(),
        },
      };
    } catch (error) {
      return { success: false, error: `CurrencyLayer error: ${error}` };
    }
  }

  /**
   * Fetch bulk rates from provider
   */
  private static async fetchBulkFromProvider(
    provider: ExchangeRateProvider,
    base: CurrencyCode,
    targets: CurrencyCode[],
    date?: string,
  ): Promise<{
    success: boolean;
    rates?: BulkExchangeRateResponse;
    error?: string;
  }> {
    try {
      const url = date
        ? `${provider.baseUrl}/${date}/${base}`
        : `${provider.baseUrl}/latest/${base}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.rates) {
        throw new Error("Rates not found in response");
      }

      const rates: Record<CurrencyCode, number> = {};
      for (const target of targets) {
        if (data.rates[target]) {
          rates[target] = data.rates[target];
        }
      }

      return {
        success: true,
        rates: {
          base,
          rates,
          date: data.date || new Date().toISOString().split("T")[0],
          provider: provider.name,
          timestamp: Date.now(),
        },
      };
    } catch (error) {
      return { success: false, error: `Bulk fetch error: ${error}` };
    }
  }

  /**
   * Store exchange rate in database
   */
  private static async storeExchangeRate(rate: ExchangeRateResponse): Promise<void> {
    try {
      await supabase.from("exchange_rates").upsert(
        {
          from_currency: rate.from,
          to_currency: rate.to,
          rate: rate.rate,
          rate_date: rate.date,
          provider: rate.provider,
          created_at: new Date(rate.timestamp).toISOString(),
        },
        {
          onConflict: "from_currency,to_currency,rate_date",
        },
      );
    } catch (error) {
      console.error("Error storing exchange rate:", error);
    }
  }

  /**
   * Store bulk exchange rates in database
   */
  private static async storeBulkExchangeRates(rates: BulkExchangeRateResponse): Promise<void> {
    try {
      const rateEntries = Object.entries(rates.rates).map(([to, rate]) => ({
        from_currency: rates.base,
        to_currency: to as CurrencyCode,
        rate: rate,
        rate_date: rates.date,
        provider: rates.provider,
        created_at: new Date(rates.timestamp).toISOString(),
      }));

      await supabase.from("exchange_rates").upsert(rateEntries, {
        onConflict: "from_currency,to_currency,rate_date",
      });
    } catch (error) {
      console.error("Error storing bulk exchange rates:", error);
    }
  }

  /**
   * Update exchange rates for all active currencies
   */
  static async updateAllExchangeRates(): Promise<{
    success: boolean;
    updated: number;
    errors: ExchangeRateError[];
  }> {
    try {
      const currencies: CurrencyCode[] = [
        "USD",
        "EUR",
        "GBP",
        "JPY",
        "CAD",
        "AUD",
        "CHF",
        "CNY",
        "INR",
        "BRL",
        "MYR",
      ];
      const errors: ExchangeRateError[] = [];
      let updated = 0;

      for (const base of currencies) {
        const targets = currencies.filter(c => c !== base);

        const result = await this.getBulkExchangeRates(base, targets);
        if (result.success) {
          updated += targets.length;
        } else {
          errors.push({
            provider: "all",
            error: result.error || "Unknown error",
            timestamp: Date.now(),
          });
        }
      }

      return { success: true, updated, errors };
    } catch (error) {
      console.error("Error updating all exchange rates:", error);
      return {
        success: false,
        updated: 0,
        errors: [{ provider: "all", error: "Failed to update rates", timestamp: Date.now() }],
      };
    }
  }

  /**
   * Get API status and rate limits
   */
  static getAPIStatus(): {
    providers: Array<{
      name: string;
      isActive: boolean;
      priority: number;
      rateLimit: { requestsPerMinute: number; requestsPerDay: number };
    }>;
    totalProviders: number;
    activeProviders: number;
  } {
    const activeProviders = this.providers.filter(p => p.isActive);

    return {
      providers: this.providers.map(p => ({
        name: p.name,
        isActive: p.isActive,
        priority: p.priority,
        rateLimit: p.rateLimit,
      })),
      totalProviders: this.providers.length,
      activeProviders: activeProviders.length,
    };
  }

  /**
   * Configure API provider
   */
  static configureProvider(providerName: string, config: Partial<ExchangeRateProvider>): boolean {
    const provider = this.providers.find(p => p.name === providerName);
    if (!provider) return false;

    Object.assign(provider, config);
    return true;
  }
}
