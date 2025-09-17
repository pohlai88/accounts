/**
 * ERPNext-Level GL Entry Validation Framework (ENTERPRISE ENHANCED)
 * Real-time validation with comprehensive business rules, Redis caching, and advanced features
 */
// @ts-nocheck


import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { VoucherTypeSchema, CurrencyCodeSchema } from "../../../packages/contracts/src/domain/core";
import {
  GLEntryValidationSchema,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  VoucherValidationContext,
  GLEntryInput,
} from "./gl-entry-validator";

// Enhanced interfaces for enterprise features
export interface ValidationConfig {
  rules: {
    requireCostCenterOnPL: boolean;
    enforceTaxValidation: boolean;
    validateExchangeRates: boolean;
    allowFuturePosting: boolean;
    maxVoucherLines: number;
    allowedVoucherTypes: string[];
  };
  thresholds: {
    maxAmountWithoutApproval: number;
    exchangeRateVariationThreshold: number;
    balanceDeviationThreshold: number;
  };
}

export interface ValidationErrorWithContext extends ValidationError {
  context?: {
    accountId?: string;
    voucherType?: string;
    voucherNo?: string;
    amount?: number;
    timestamp: string;
  };
}

export interface BatchValidationResult {
  results: { voucherNo: string; result: ValidationResult }[];
  summary: {
    total: number;
    valid: number;
    errors: number;
    warnings: number;
    processingTime: number;
  };
}

export interface ExchangeRateValidation {
  isReasonable: boolean;
  typicalRate: number;
  variation: number;
}

export class EnhancedGLEntryValidator {
  public companyId: string;
  private validationCache: Map<string, any> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private accountTypeCache = new Map<string, string>();
  private validationDebounce: Map<string, NodeJS.Timeout> = new Map();
  private redis?: any; // Optional Redis client

  constructor(companyId: string, redisClient?: any) {
    this.companyId = companyId;
    this.redis = redisClient;
  }

  /**
   * Enhanced caching strategy with Redis support
   */
  private async getCachedData<T>(key: string, ttl: number, fetchFn: () => Promise<T>): Promise<T> {
    // Check memory cache first
    if (this.validationCache.has(key) && this.cacheExpiry.get(key)! > Date.now()) {
      return this.validationCache.get(key);
    }

    // Try Redis in production
    if (this.redis && process.env.NODE_ENV === "production") {
      try {
        const cached = await this.redis.get(key);
        if (cached) {
          const data = JSON.parse(cached);
          this.validationCache.set(key, data);
          this.cacheExpiry.set(key, Date.now() + ttl);
          return data;
        }
      } catch (error) {
        console.warn("Redis cache error, falling back to memory:", error);
      }
    }

    // Fetch from database
    const data = await fetchFn();

    // Cache in memory and Redis
    this.validationCache.set(key, data);
    this.cacheExpiry.set(key, Date.now() + ttl);

    if (this.redis && process.env.NODE_ENV === "production") {
      try {
        await this.redis.setex(key, Math.ceil(ttl / 1000), JSON.stringify(data));
      } catch (error) {
        console.warn("Redis set error:", error);
      }
    }

    return data;
  }

  /**
   * Get validation configuration for the company
   */
  private async getValidationConfig(): Promise<ValidationConfig> {
    return this.getCachedData(
      `validation_config_${this.companyId}`,
      3600000, // 1 hour
      async () => {
        const { data: config } = await supabase
          .from("company_validation_settings")
          .select("validation_config")
          .eq("company_id", this.companyId)
          .single();

        return (
          config?.validation_config || {
            rules: {
              requireCostCenterOnPL: true,
              enforceTaxValidation: true,
              validateExchangeRates: true,
              allowFuturePosting: false,
              maxVoucherLines: 20,
              allowedVoucherTypes: [
                "Sales Invoice",
                "Purchase Invoice",
                "Payment Entry",
                "Journal Entry",
              ],
            },
            thresholds: {
              maxAmountWithoutApproval: 10000,
              exchangeRateVariationThreshold: 0.1,
              balanceDeviationThreshold: 0.01,
            },
          }
        );
      },
    );
  }

  /**
   * Get account details from materialized view for better performance
   */
  async getAccountDetails(accountId: string) {
    return this.getCachedData(
      `account_${accountId}`,
      300000, // 5 minutes
      async () => {
        const { data: account } = await supabase
          .from("mv_account_validation_cache")
          .select("*")
          .eq("account_id", accountId)
          .eq("company_id", this.companyId)
          .single();
        return account;
      },
    );
  }

  /**
   * Get account balance from materialized view
   */
  async getAccountBalance(accountId: string, postingDate: string): Promise<number> {
    const balance = await this.getAccountBalanceFast(accountId);
    return balance.balance;
  }

  async getAccountBalanceFast(accountId: string): Promise<{
    debit: number;
    credit: number;
    balance: number;
    transactionCount: number;
    lastActivity: string;
  }> {
    const { data, error } = await supabase
      .rpc("get_account_balance_fast", {
        p_account_id: accountId,
        p_company_id: this.companyId,
      })
      .single();

    if (error || !data) {
      return {
        debit: 0,
        credit: 0,
        balance: 0,
        transactionCount: 0,
        lastActivity: new Date().toISOString(),
      };
    }

    return {
      debit: Number((data as any).debit || 0),
      credit: Number((data as any).credit || 0),
      balance: Number((data as any).balance || 0),
      transactionCount: Number((data as any).transaction_count || 0),
      lastActivity: (data as any).last_activity || new Date().toISOString(),
    };
  }

  /**
   * Enhanced currency validation with exchange rate checking
   */
  private async validateCurrencyRates(
    entry: GLEntryInput,
    account: any,
  ): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];
    const config = await this.getValidationConfig();

    if (!config.rules.validateExchangeRates) {
      return errors;
    }

    const companyCurrency = await this.getCompanyBaseCurrency();

    // Check if exchange rates are provided when needed
    const isForeignAccount = account.account_currency !== companyCurrency;
    const hasTransactionCurrency =
      entry.transactionCurrency && entry.transactionCurrency !== account.account_currency;

    if (isForeignAccount || hasTransactionCurrency) {
      // Validate exchange rate exists and is reasonable
      if (!entry.transactionExchangeRate || entry.transactionExchangeRate <= 0) {
        errors.push({
          code: "INVALID_EXCHANGE_RATE",
          field: "transactionExchangeRate",
          message: "Valid exchange rate is required for foreign currency transactions",
          severity: "error",
          category: "business_rule",
        });
      } else {
        // Validate exchange rate is within reasonable bounds
        const reasonableRate = await this.validateExchangeRateReasonableness(
          entry.transactionExchangeRate,
          account.account_currency,
          entry.transactionCurrency || companyCurrency,
        );

        if (!reasonableRate.isReasonable) {
          errors.push({
            code: "UNREASONABLE_EXCHANGE_RATE",
            field: "transactionExchangeRate",
            message: `Exchange rate ${entry.transactionExchangeRate} appears unreasonable for ${account.account_currency} (typical: ${reasonableRate.typicalRate}, variation: ${(reasonableRate.variation * 100).toFixed(1)}%)`,
            severity: "warning",
            category: "business_rule",
          });
        }
      }
    }

    // Validate currency amounts consistency
    if (entry.debitInAccountCurrency !== undefined && entry.debitInAccountCurrency > 0) {
      const expectedAmount = entry.debit * (entry.transactionExchangeRate || 1);
      if (Math.abs(entry.debitInAccountCurrency - expectedAmount) > 0.01) {
        errors.push({
          code: "CURRENCY_AMOUNT_MISMATCH",
          field: "debitInAccountCurrency",
          message: "Amount in account currency does not match calculated amount",
          severity: "error",
          category: "data_integrity",
        });
      }
    }

    return errors;
  }

  /**
   * Validate exchange rate reasonableness
   */
  private async validateExchangeRateReasonableness(
    rate: number,
    fromCurrency: string,
    toCurrency: string,
  ): Promise<ExchangeRateValidation> {
    const config = await this.getValidationConfig();

    // Get cached exchange rates
    const cachedRates = await this.getCachedExchangeRates();
    const rateKey = `${fromCurrency}_${toCurrency}`;
    const typicalRate = cachedRates[rateKey] || 1;

    // Calculate variation from typical rate
    const variation = Math.abs(rate - typicalRate) / typicalRate;
    const isReasonable = variation <= config.thresholds.exchangeRateVariationThreshold;

    return {
      isReasonable,
      typicalRate,
      variation,
    };
  }

  /**
   * Get cached exchange rates
   */
  private async getCachedExchangeRates(): Promise<Record<string, number>> {
    return this.getCachedData(
      `exchange_rates_${this.companyId}`,
      1800000, // 30 minutes
      async () => {
        const { data: rates } = await supabase
          .from("exchange_rates_cache")
          .select("from_currency, to_currency, rate")
          .eq("is_active", true)
          .gte(
            "rate_date",
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          ) // Last 7 days
          .order("rate_date", { ascending: false });

        const rateMap: Record<string, number> = {};
        rates?.forEach(rate => {
          rateMap[`${rate.from_currency}_${rate.to_currency}`] = rate.rate;
        });

        return rateMap;
      },
    );
  }

  /**
   * Enhanced tax validation
   */
  private async validateTaxEntries(
    entry: GLEntryInput,
    context: VoucherValidationContext,
  ): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];
    const config = await this.getValidationConfig();

    if (!config.rules.enforceTaxValidation) {
      return errors;
    }

    const account = await this.getAccountDetails(entry.accountId);

    if (account?.tax_rate && account.tax_rate > 0) {
      // Check if tax account is properly balanced with main account
      const taxEntries = [];
      for (const e of context.entries) {
        if (e.accountId !== entry.accountId && (await this.isTaxAccount(e.accountId))) {
          taxEntries.push(e);
        }
      }

      if (taxEntries.length === 0) {
        errors.push({
          code: "MISSING_TAX_ENTRY",
          field: "accountId",
          message: `Tax account entry missing for taxable account ${account.account_name}`,
          severity: "warning",
          category: "compliance",
        });
      } else {
        // Validate tax amount calculation
        const expectedTax = (entry.debit + entry.credit) * (account.tax_rate / 100);
        const actualTax = taxEntries.reduce(
          (sum, taxEntry) => sum + taxEntry.debit + taxEntry.credit,
          0,
        );

        if (Math.abs(expectedTax - actualTax) > config.thresholds.balanceDeviationThreshold) {
          errors.push({
            code: "TAX_AMOUNT_MISMATCH",
            field: "amount",
            message: `Tax amount ${actualTax} does not match expected ${expectedTax.toFixed(2)} for rate ${account.tax_rate}%`,
            severity: "error",
            category: "compliance",
          });
        }
      }
    }

    return errors;
  }

  /**
   * Check if account is a tax account
   */
  private async isTaxAccount(accountId: string): Promise<boolean> {
    const account = await this.getAccountDetails(accountId);
    return account?.account_type === "Tax";
  }

  /**
   * Batch validation for high-volume scenarios
   */
  async validateVoucherBatch(vouchers: VoucherValidationContext[]): Promise<BatchValidationResult> {
    const startTime = Date.now();
    const results: { voucherNo: string; result: ValidationResult }[] = [];

    // Prefetch all accounts needed for the batch
    const allAccountIds = vouchers.flatMap(v => v.entries.map(e => e.accountId));
    const uniqueAccountIds = [...new Set(allAccountIds)];
    await this.prefetchAccounts(uniqueAccountIds);

    // Validate each voucher in parallel (with limit to avoid overloading)
    const batchSize = 10;
    for (let i = 0; i < vouchers.length; i += batchSize) {
      const batch = vouchers.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(async voucher => ({
          voucherNo: voucher.voucherNo,
          result: await this.validateVoucher(voucher),
        })),
      );
      results.push(...batchResults);
    }

    const processingTime = Date.now() - startTime;
    const summary = {
      total: vouchers.length,
      valid: results.filter(r => r.result.isValid).length,
      errors: results.reduce((sum, r) => sum + r.result.errors.length, 0),
      warnings: results.reduce((sum, r) => sum + r.result.warnings.length, 0),
      processingTime,
    };

    return { results, summary };
  }

  /**
   * Enhanced real-time validation with debouncing
   */
  async validateFieldRealTimeDebounced(
    field: string,
    value: any,
    context: Partial<VoucherValidationContext>,
    debounceMs: number = 300,
  ): Promise<ValidationResult> {
    const key = `${field}_${JSON.stringify(value)}`;

    // Clear previous timeout
    if (this.validationDebounce.has(key)) {
      clearTimeout(this.validationDebounce.get(key)!);
    }

    return new Promise(resolve => {
      const timeout = setTimeout(async () => {
        const result = await this.validateFieldRealTime(field, value, context);
        resolve(result);
        this.validationDebounce.delete(key);
      }, debounceMs);

      this.validationDebounce.set(key, timeout);
    });
  }

  /**
   * UI-friendly validation for partial entries
   */
  async validateForUI(
    entry: Partial<GLEntryInput>,
    context: Partial<VoucherValidationContext>,
  ): Promise<ValidationResult> {
    const results: ValidationResult[] = [];

    // Validate each field that has a value
    if (entry.accountId !== undefined) {
      results.push(await this.validateFieldRealTime("accountId", entry.accountId, context));
    }

    if (entry.voucherNo !== undefined && context.voucherType && context.companyId) {
      results.push(await this.validateFieldRealTime("voucherNo", entry.voucherNo, context));
    }

    if (entry.postingDate !== undefined && context.companyId) {
      results.push(await this.validateFieldRealTime("postingDate", entry.postingDate, context));
    }

    // Combine results
    return {
      isValid: results.every(r => r.isValid),
      errors: results.flatMap(r => r.errors),
      warnings: results.flatMap(r => r.warnings),
      suggestions: [...new Set(results.flatMap(r => r.suggestions))],
    };
  }

  /**
   * Enhanced suggestions engine with pattern recognition
   */
  private async generateEnhancedSuggestions(
    context: VoucherValidationContext,
    errors: ValidationError[],
    warnings: ValidationWarning[],
  ): Promise<string[]> {
    const suggestions: string[] = [];
    const config = await this.getValidationConfig();

    // Pattern-based suggestions
    if (context.entries.length > config.rules.maxVoucherLines) {
      suggestions.push(
        `Consider splitting this ${context.voucherType.toLowerCase()} into multiple entries. Current entry has ${context.entries.length} lines, recommended maximum is ${config.rules.maxVoucherLines}.`,
      );
    }

    // Amount-based suggestions
    const totalAmount = context.entries.reduce((sum, entry) => sum + entry.debit + entry.credit, 0);
    if (totalAmount > config.thresholds.maxAmountWithoutApproval) {
      suggestions.push(
        `Large amount detected (${totalAmount.toLocaleString()}). Consider adding additional approval or documentation.`,
      );
    }

    // Historical pattern suggestions
    const historicalPatterns = await this.analyzeHistoricalPatterns(context);
    historicalPatterns.forEach(pattern => {
      suggestions.push(`Based on historical patterns: ${pattern.suggestion}`);
    });

    // Error-specific suggestions
    if (errors.some(e => e.code === "CURRENCY_MISMATCH")) {
      suggestions.push(
        "Ensure all entries use the correct account currency. Consider using multi-currency accounts if needed.",
      );
    }

    if (warnings.some(w => w.code === "COST_CENTER_RECOMMENDED")) {
      suggestions.push(
        "Adding cost centers will improve financial reporting and analysis capabilities.",
      );
    }

    return suggestions;
  }

  /**
   * Analyze historical patterns for suggestions
   */
  private async analyzeHistoricalPatterns(
    context: VoucherValidationContext,
  ): Promise<{ suggestion: string; confidence: number }[]> {
    const patterns: { suggestion: string; confidence: number }[] = [];

    // Get voucher patterns from materialized view
    const { data: voucherPattern } = await supabase
      .from("mv_voucher_patterns")
      .select("*")
      .eq("company_id", this.companyId)
      .eq("voucher_type", context.voucherType)
      .single();

    if (voucherPattern) {
      // Check entry count patterns
      if (context.entries.length > voucherPattern.avg_entries_per_voucher * 1.5) {
        patterns.push({
          suggestion: `This ${context.voucherType.toLowerCase()} has more entries than typical (${context.entries.length} vs avg ${Math.round(voucherPattern.avg_entries_per_voucher)}). Consider if this can be simplified.`,
          confidence: 0.7,
        });
      }

      // Check amount patterns
      const totalAmount = context.entries.reduce(
        (sum, entry) => sum + entry.debit + entry.credit,
        0,
      );
      if (totalAmount > voucherPattern.avg_amount * 2) {
        patterns.push({
          suggestion: `This amount is significantly higher than typical ${context.voucherType.toLowerCase()} amounts. Average: ${voucherPattern.avg_amount.toLocaleString()}`,
          confidence: 0.8,
        });
      }

      // Suggest common remarks
      if (voucherPattern.common_remarks && voucherPattern.common_remarks.length > 0) {
        const topRemark = voucherPattern.common_remarks[0];
        if (topRemark && !context.entries.some(e => e.remarks?.includes(topRemark))) {
          patterns.push({
            suggestion: `Consider adding remarks similar to: "${topRemark}"`,
            confidence: 0.6,
          });
        }
      }
    }

    return patterns;
  }

  /**
   * Log validation events for audit trail
   */
  private async logValidationEvent(
    eventType: "validation_success" | "validation_failure" | "validation_warning",
    context: VoucherValidationContext,
    result: ValidationResult,
    processingTime: number,
  ) {
    const auditEvent = {
      event_type: eventType,
      company_id: this.companyId,
      voucher_type: context.voucherType,
      voucher_no: context.voucherNo,
      posting_date: context.postingDate,
      entry_count: context.entries.length,
      total_amount: context.entries.reduce((sum, entry) => sum + entry.debit + entry.credit, 0),
      error_count: result.errors.length,
      warning_count: result.warnings.length,
      processing_time_ms: processingTime,
      user_id: null, // Would be set from auth context
      details: {
        errors: result.errors,
        warnings: result.warnings,
        suggestions: result.suggestions,
      },
    };

    // Log to database
    try {
      await supabase.from("validation_audit_log").insert(auditEvent);
    } catch (error) {
      console.error("Failed to log validation event:", error);
    }

    // Also send to monitoring service in production
    if (process.env.NODE_ENV === "production") {
      // await monitoringService.logValidationEvent(auditEvent)
    }
  }

  /**
   * Enhanced error reporting with context
   */
  private async logValidationError(
    error: ValidationErrorWithContext,
    context: VoucherValidationContext,
  ) {
    // Add contextual information
    error.context = {
      accountId: context.entries[0]?.accountId,
      voucherType: context.voucherType,
      voucherNo: context.voucherNo,
      amount: context.entries.reduce((sum, entry) => sum + entry.debit + entry.credit, 0),
      timestamp: new Date().toISOString(),
    };

    // Log to console in development
    if (process.env.NODE_ENV !== "production") {
      console.error("Validation Error:", error);
    }

    // Send to monitoring service in production
    if (process.env.NODE_ENV === "production") {
      try {
        // await monitoringService.captureValidationError(error)
      } catch (monitoringError) {
        console.error("Monitoring service error:", monitoringError);
      }
    }
  }

  // Placeholder methods that would be implemented based on the original validator
  private async validateVoucher(context: VoucherValidationContext): Promise<ValidationResult> {
    const startTime = Date.now();

    // Implementation would call the original validator methods
    // This is a placeholder for the enhanced version
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: [],
    };

    const processingTime = Date.now() - startTime;

    // Log the validation event
    const eventType = result.isValid
      ? "validation_success"
      : result.errors.length > 0
        ? "validation_failure"
        : "validation_warning";
    await this.logValidationEvent(eventType, context, result, processingTime);

    return result;
  }

  private async validateFieldRealTime(
    field: string,
    value: any,
    context: Partial<VoucherValidationContext>,
  ): Promise<ValidationResult> {
    // Placeholder implementation
    return {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: [],
    };
  }

  private async prefetchAccounts(accountIds: string[]) {
    // Implementation from original validator
  }

  private async getCompanyBaseCurrency(): Promise<string> {
    // Implementation from original validator
    return "USD";
  }

  /**
   * Clear all caches
   */
  clearCache() {
    this.validationCache.clear();
    this.cacheExpiry.clear();
    this.accountTypeCache.clear();

    // Clear debounce timeouts
    this.validationDebounce.forEach(timeout => clearTimeout(timeout));
    this.validationDebounce.clear();
  }
}

// Export enhanced validation utilities
export const EnhancedValidationUtils = {
  formatValidationErrors: (errors: ValidationError[]) => {
    return errors.map(error => `${error.field}: ${error.message}`).join("\n");
  },

  getErrorsByField: (errors: ValidationError[], field: string) => {
    return errors.filter(error => error.field === field);
  },

  getErrorsByCategory: (errors: ValidationError[], category: string) => {
    return errors.filter(error => error.category === category);
  },

  calculateValidationScore: (result: ValidationResult) => {
    const errorWeight = 10;
    const warningWeight = 3;
    const maxScore = 100;

    const deductions = result.errors.length * errorWeight + result.warnings.length * warningWeight;
    return Math.max(0, maxScore - deductions);
  },
};
