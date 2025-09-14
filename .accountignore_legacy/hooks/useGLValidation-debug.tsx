/**
 * Debugging and Testing Utilities for GL Validation Hook
 * Development tools for monitoring, debugging, and testing validation
 */

import { useEffect, useCallback } from "react";
import { ValidationResult } from "@/lib/validation/gl-entry-validator";
import { useGLValidation } from "./useGLValidation-enterprise";

/**
 * Debug utilities for validation hook
 */
export const useValidationDebug = (validation: ReturnType<typeof useGLValidation>) => {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      // Log validation state changes
      console.group("🔍 Validation State Changed");
      console.log("Voucher Valid:", validation.voucherValidation?.isValid);
      console.log("Field Validations:", Object.keys(validation.fieldValidations).length);
      console.log("Is Validating:", validation.isValidating);
      console.log(
        "Last Validated:",
        validation.lastValidated
          ? new Date(validation.lastValidated).toLocaleTimeString()
          : "Never",
      );
      console.groupEnd();
    }
  }, [
    validation.voucherValidation,
    validation.fieldValidations,
    validation.isValidating,
    validation.lastValidated,
  ]);

  const getValidationSummary = useCallback(() => {
    const { voucherValidation, fieldValidations } = validation;
    return {
      voucherValid: voucherValidation?.isValid,
      voucherErrors: voucherValidation?.errors.length || 0,
      voucherWarnings: voucherValidation?.warnings.length || 0,
      fieldErrors: Object.values(fieldValidations).filter(v =>
        v.errors.some(e => e.severity === "error"),
      ).length,
      fieldWarnings: Object.values(fieldValidations).filter(v => v.warnings.length > 0).length,
      totalFields: Object.keys(fieldValidations).length,
      validFields: Object.values(fieldValidations).filter(v => v.isValid).length,
      invalidFields: Object.values(fieldValidations).filter(v => !v.isValid).length,
    };
  }, [validation]);

  const getPerformanceMetrics = useCallback(() => {
    const errors = validation.getValidationErrors();
    return {
      totalErrors: errors.length,
      recoverableErrors: errors.filter(e => e.recoverable).length,
      fieldErrors: errors.filter(e => e.field && e.field !== "voucher").length,
      voucherErrors: errors.filter(e => e.field === "voucher").length,
      systemErrors: errors.filter(e => !e.field).length,
      errorsByCode: errors.reduce(
        (acc, error) => {
          const code = error.code || "UNKNOWN";
          acc[code] = (acc[code] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
    };
  }, [validation]);

  const exportValidationState = useCallback(() => {
    return {
      timestamp: new Date().toISOString(),
      summary: getValidationSummary(),
      performance: getPerformanceMetrics(),
      state: {
        isValidating: validation.isValidating,
        voucherValidation: validation.voucherValidation,
        fieldValidations: validation.fieldValidations,
        lastValidated: validation.lastValidated,
      },
      errors: validation.getValidationErrors(),
    };
  }, [getValidationSummary, getPerformanceMetrics, validation]);

  const logValidationTrace = useCallback(
    (action: string, field?: string, details?: any) => {
      if (process.env.NODE_ENV === "development") {
        console.log(`🔍 [Validation Trace] ${action}`, {
          field,
          details,
          timestamp: new Date().toISOString(),
          summary: getValidationSummary(),
        });
      }
    },
    [getValidationSummary],
  );

  return {
    getValidationSummary,
    getPerformanceMetrics,
    exportValidationState,
    logValidationTrace,
  };
};

/**
 * Test utilities for validation hook
 */
export const createMockValidation = (
  overrides: Partial<ReturnType<typeof useGLValidation>> = {},
) => {
  const defaultValidation: ReturnType<typeof useGLValidation> = {
    // State
    isValidating: false,
    voucherValidation: null,
    fieldValidations: {},
    lastValidated: null,

    // Actions
    validateVoucher: jest
      .fn()
      .mockResolvedValue({ isValid: true, errors: [], warnings: [], suggestions: [] }),
    validateField: jest
      .fn()
      .mockResolvedValue({ isValid: true, errors: [], warnings: [], suggestions: [] }),
    validateFields: jest.fn().mockResolvedValue({}),
    validateVoucherRealTime: jest
      .fn()
      .mockResolvedValue({ isValid: true, errors: [], warnings: [], suggestions: [] }),
    clearFieldValidation: jest.fn(),
    clearAllValidations: jest.fn(),
    clearValidationCache: jest.fn(),
    retryValidation: jest.fn(),

    // Getters
    getFieldValidation: jest.fn().mockReturnValue(null),
    isFieldValidating: jest.fn().mockReturnValue(false),
    hasFieldErrors: jest.fn().mockReturnValue(false),
    hasFieldWarnings: jest.fn().mockReturnValue(false),
    getFieldErrors: jest.fn().mockReturnValue([]),
    getFieldWarnings: jest.fn().mockReturnValue([]),
    isVoucherValid: jest.fn().mockReturnValue(true),
    getVoucherValidationSummary: jest.fn().mockReturnValue(null),
    getValidationErrorsByCategory: jest.fn().mockReturnValue({}),

    // Accessibility
    getAccessibilityProps: jest.fn().mockReturnValue({
      "aria-invalid": "false",
      "aria-busy": "false",
    }),
    getValidationMessageIds: jest.fn().mockReturnValue({
      errorId: "field-error",
      warningId: "field-warning",
      validatingId: "field-validating",
    }),

    // Error handling
    getValidationErrors: jest.fn().mockReturnValue([]),
    clearValidationErrors: jest.fn(),

    // Cache management
    getCachedResult: jest.fn().mockReturnValue(null),
    setCachedResult: jest.fn(),
  };

  return { ...defaultValidation, ...overrides };
};

/**
 * Test wrapper component for validation hook
 */
export const ValidationTestWrapper: React.FC<{
  companyId: string;
  options?: any;
  children: (validation: ReturnType<typeof useGLValidation>) => React.ReactNode;
}> = ({ companyId, options, children }) => {
  const validation = useGLValidation({ companyId, ...options });
  return <>{children(validation)}</>;
};

/**
 * Validation performance monitor
 */
export class ValidationPerformanceMonitor {
  private metrics: {
    validationCount: number;
    averageTime: number;
    errorRate: number;
    cacheHitRate: number;
    fieldValidations: Record<string, number>;
    startTime: number;
  } = {
    validationCount: 0,
    averageTime: 0,
    errorRate: 0,
    cacheHitRate: 0,
    fieldValidations: {},
    startTime: Date.now(),
  };

  private validationTimes: number[] = [];
  private cacheHits = 0;
  private cacheMisses = 0;
  private errors = 0;

  recordValidation(field: string, duration: number, fromCache: boolean, hasError: boolean) {
    this.metrics.validationCount++;
    this.validationTimes.push(duration);
    this.metrics.averageTime =
      this.validationTimes.reduce((a, b) => a + b, 0) / this.validationTimes.length;

    if (fromCache) {
      this.cacheHits++;
    } else {
      this.cacheMisses++;
    }

    if (hasError) {
      this.errors++;
    }

    this.metrics.cacheHitRate = this.cacheHits / (this.cacheHits + this.cacheMisses);
    this.metrics.errorRate = this.errors / this.metrics.validationCount;
    this.metrics.fieldValidations[field] = (this.metrics.fieldValidations[field] || 0) + 1;
  }

  getMetrics() {
    return {
      ...this.metrics,
      uptime: Date.now() - this.metrics.startTime,
      p95Time: this.getPercentile(95),
      p99Time: this.getPercentile(99),
      slowestValidations: this.validationTimes
        .map((time, index) => ({ time, index }))
        .sort((a, b) => b.time - a.time)
        .slice(0, 5)
        .map(({ time }) => time),
    };
  }

  private getPercentile(percentile: number): number {
    const sorted = [...this.validationTimes].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  reset() {
    this.metrics = {
      validationCount: 0,
      averageTime: 0,
      errorRate: 0,
      cacheHitRate: 0,
      fieldValidations: {},
      startTime: Date.now(),
    };
    this.validationTimes = [];
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.errors = 0;
  }

  exportReport() {
    return {
      timestamp: new Date().toISOString(),
      metrics: this.getMetrics(),
      recommendations: this.getRecommendations(),
    };
  }

  private getRecommendations(): string[] {
    const recommendations: string[] = [];
    const metrics = this.getMetrics();

    if (metrics.errorRate > 0.1) {
      recommendations.push(
        "High error rate detected. Check validation logic and network connectivity.",
      );
    }

    if (metrics.averageTime > 500) {
      recommendations.push(
        "Average validation time is high. Consider optimizing validation logic or enabling caching.",
      );
    }

    if (metrics.cacheHitRate < 0.5) {
      recommendations.push(
        "Low cache hit rate. Consider increasing cache TTL or reviewing cache key strategy.",
      );
    }

    if (metrics.p95Time > 1000) {
      recommendations.push(
        "95th percentile validation time is high. Investigate performance bottlenecks.",
      );
    }

    return recommendations;
  }
}

/**
 * Validation test scenarios
 */
export const ValidationTestScenarios = {
  /**
   * Test race condition handling
   */
  async testRaceConditions(validation: ReturnType<typeof useGLValidation>) {
    console.log("🧪 Testing race conditions...");

    // Rapid field changes
    const promises = [
      validation.validateField("accountId", "account-1", {}),
      validation.validateField("accountId", "account-2", {}),
      validation.validateField("accountId", "account-3", {}),
    ];

    const results = await Promise.all(promises);
    console.log("Race condition test results:", results);

    return results;
  },

  /**
   * Test cross-field independence
   */
  async testCrossFieldIndependence(validation: ReturnType<typeof useGLValidation>) {
    console.log("🧪 Testing cross-field independence...");

    // Simultaneous field validation
    const promises = [
      validation.validateField("accountId", "account-1", {}),
      validation.validateField("amount", 1000, {}),
      validation.validateField("description", "test", {}),
    ];

    const results = await Promise.all(promises);
    console.log("Cross-field independence test results:", results);

    return results;
  },

  /**
   * Test batch validation performance
   */
  async testBatchValidation(validation: ReturnType<typeof useGLValidation>) {
    console.log("🧪 Testing batch validation...");

    const fields = [
      { field: "accountId", value: "account-1" },
      { field: "amount", value: 1000 },
      { field: "description", value: "test" },
      { field: "date", value: "2024-01-15" },
    ];

    const startTime = Date.now();
    const results = await validation.validateFields(fields, {});
    const duration = Date.now() - startTime;

    console.log(`Batch validation completed in ${duration}ms:`, results);

    return { results, duration };
  },

  /**
   * Test cache performance
   */
  async testCachePerformance(validation: ReturnType<typeof useGLValidation>) {
    console.log("🧪 Testing cache performance...");

    const field = "accountId";
    const value = "test-account";
    const context = {};

    // First validation (cache miss)
    const start1 = Date.now();
    await validation.validateField(field, value, context);
    const duration1 = Date.now() - start1;

    // Second validation (cache hit)
    const start2 = Date.now();
    await validation.validateField(field, value, context);
    const duration2 = Date.now() - start2;

    console.log(`Cache test - First: ${duration1}ms, Second: ${duration2}ms`);

    return { firstValidation: duration1, secondValidation: duration2 };
  },
};

export default useValidationDebug;
