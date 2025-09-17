/**
 * Enterprise-Grade React Hook for Real-time GL Entry Validation
 * Advanced version with error recovery, batch validation, caching, accessibility, and debugging
 */
// @ts-nocheck


import React, { useState, useEffect, useCallback, useRef, useContext } from "react";
import {
  GLEntryValidator,
  ValidationResult,
  VoucherValidationContext,
  GLEntryInput,
} from "@/lib/validation/gl-entry-validator";

interface UseGLValidationOptions {
  companyId: string;
  enableRealTimeValidation?: boolean;
  debounceMs?: number;
  validateOnMount?: boolean;
  /** Optional context to run once on mount when validateOnMount = true */
  mountContext?: VoucherValidationContext;
  /** Cache TTL in milliseconds */
  cacheTTL?: number;
  /** Enable batch validation optimization */
  enableBatchValidation?: boolean;
}

interface ValidationState {
  isValidating: boolean;
  voucherValidation: ValidationResult | null;
  fieldValidations: Record<string, ValidationResult>;
  lastValidated: number | null;
}

interface ValidationCache {
  result: ValidationResult;
  timestamp: number;
}

interface ValidationError extends Error {
  field?: string;
  code?: string;
  recoverable?: boolean;
}

export function useGLValidation(options: UseGLValidationOptions) {
  const {
    companyId,
    enableRealTimeValidation = true,
    debounceMs = 300,
    validateOnMount = false,
    mountContext,
    cacheTTL = 5 * 60 * 1000, // 5 minutes
    enableBatchValidation = true,
  } = options;

  const [validationState, setValidationState] = useState<ValidationState>({
    isValidating: false,
    voucherValidation: null,
    fieldValidations: {},
    lastValidated: null,
  });

  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const validatorRef = useRef<GLEntryValidator | null>(null);

  // Per-field timers & in-flight tokens to avoid cross-field interference
  const fieldTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const fieldTokensRef = useRef<Map<string, number>>(new Map());
  const fieldValidatingRef = useRef<Set<string>>(new Set());

  // Enhanced caching
  const validationCacheRef = useRef<Map<string, ValidationCache>>(new Map());

  // Mounted flag to avoid setState after unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Initialize validator (recreate when company changes)
  useEffect(() => {
    validatorRef.current = new GLEntryValidator(companyId);
    // cleanup timers & caches on company switch/unmount
    return () => {
      // clear all field timers
      for (const t of fieldTimersRef.current.values()) clearTimeout(t);
      fieldTimersRef.current.clear();
      validationCacheRef.current.clear();
      validatorRef.current?.clearCache();
    };
  }, [companyId]);

  // Optional: run a voucher validation on mount once
  useEffect(() => {
    if (!validateOnMount || !mountContext) return;
    (async () => {
      try {
        setValidationState(prev => ({ ...prev, isValidating: true }));
        const res = await validatorRef.current!.validateVoucher(mountContext);
        if (!mountedRef.current) return;
        setValidationState(prev => ({
          ...prev,
          isValidating: false,
          voucherValidation: res,
          lastValidated: Date.now(),
        }));
      } catch (error) {
        if (!mountedRef.current) return;
        const validationError: ValidationError = new Error("Mount validation failed");
        validationError.recoverable = true;
        setValidationErrors(prev => [...prev, validationError]);

        const errorResult: ValidationResult = {
          isValid: false,
          errors: [
            {
              code: "VALIDATION_ERROR",
              field: "system",
              message: "Validation failed due to system error",
              severity: "error",
              category: "data_integrity",
            },
          ],
          warnings: [],
          suggestions: [],
        };
        setValidationState(prev => ({
          ...prev,
          isValidating: false,
          voucherValidation: errorResult,
          lastValidated: Date.now(),
        }));
      }
    })();
    // run only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Create cache key for validation result
   */
  const createCacheKey = useCallback(
    (field: string, value: any, context: Partial<VoucherValidationContext>): string => {
      return `${field}:${JSON.stringify(value)}:${JSON.stringify(context)}`;
    },
    [],
  );

  /**
   * Get cached validation result
   */
  const getCachedResult = useCallback(
    (cacheKey: string): ValidationResult | null => {
      const cached = validationCacheRef.current.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cacheTTL) {
        return cached.result;
      }
      return null;
    },
    [cacheTTL],
  );

  /**
   * Cache validation result
   */
  const setCachedResult = useCallback((cacheKey: string, result: ValidationResult): void => {
    validationCacheRef.current.set(cacheKey, {
      result,
      timestamp: Date.now(),
    });
  }, []);

  /**
   * Clear validation cache
   */
  const clearValidationCache = useCallback(() => {
    validationCacheRef.current.clear();
  }, []);

  /**
   * Validate complete voucher with enhanced error handling
   */
  const validateVoucher = useCallback(
    async (context: VoucherValidationContext): Promise<ValidationResult> => {
      if (!validatorRef.current) throw new Error("Validator not initialized");

      setValidationState(prev => ({ ...prev, isValidating: true }));

      try {
        const result = await validatorRef.current.validateVoucher(context);
        if (!mountedRef.current) return result;

        setValidationState(prev => ({
          ...prev,
          isValidating: false,
          voucherValidation: result,
          lastValidated: Date.now(),
        }));

        // Clear any voucher-level errors on success
        setValidationErrors(prev => prev.filter(error => error.field !== "voucher"));

        return result;
      } catch (error) {
        console.error("Voucher validation error:", error);

        // Store the error for debugging
        const validationError: ValidationError = new Error(
          `Voucher validation error: ${error.message}`,
        );
        validationError.field = "voucher";
        validationError.code = "VOUCHER_VALIDATION_ERROR";
        validationError.recoverable = true;
        setValidationErrors(prev => [...prev, validationError]);

        const errorResult: ValidationResult = {
          isValid: false,
          errors: [
            {
              code: "VALIDATION_ERROR",
              field: "system",
              message: "Validation failed due to system error",
              severity: "error",
              category: "data_integrity",
            },
          ],
          warnings: [],
          suggestions: [],
        };

        if (mountedRef.current) {
          setValidationState(prev => ({
            ...prev,
            isValidating: false,
            voucherValidation: errorResult,
            lastValidated: Date.now(),
          }));
        }

        return errorResult;
      }
    },
    [],
  );

  /**
   * Validate individual field with enhanced caching and error handling
   */
  const validateField = useCallback(
    async (
      field: string,
      value: any,
      context: Partial<VoucherValidationContext>,
    ): Promise<ValidationResult> => {
      if (!validatorRef.current || !enableRealTimeValidation) {
        return { isValid: true, errors: [], warnings: [], suggestions: [] };
      }

      // Check cache first
      const cacheKey = createCacheKey(field, value, context);
      const cachedResult = getCachedResult(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }

      // clear previous timer for this field
      const prevTimer = fieldTimersRef.current.get(field);
      if (prevTimer) clearTimeout(prevTimer);

      // bump token for this field
      const nextToken = (fieldTokensRef.current.get(field) ?? 0) + 1;
      fieldTokensRef.current.set(field, nextToken);

      // mark field as validating
      fieldValidatingRef.current.add(field);

      return new Promise(resolve => {
        const timer = setTimeout(async () => {
          try {
            const result = await validatorRef.current!.validateFieldRealTime(field, value, {
              companyId,
              ...context,
            });

            // Cache the result
            setCachedResult(cacheKey, result);

            // only set state if still latest token
            const currentToken = fieldTokensRef.current.get(field);
            if (currentToken === nextToken && mountedRef.current) {
              setValidationState(prev => ({
                ...prev,
                fieldValidations: { ...prev.fieldValidations, [field]: result },
              }));
              // Clear any previous errors for this field
              setValidationErrors(prev => prev.filter(error => error.field !== field));
            }

            resolve(result);
          } catch (error) {
            console.error(`Field validation error for ${field}:`, error);

            // Store the error for debugging
            const validationError: ValidationError = new Error(
              `Field validation error for ${field}: ${error.message}`,
            );
            validationError.field = field;
            validationError.code = "FIELD_VALIDATION_ERROR";
            validationError.recoverable = true;
            setValidationErrors(prev => [...prev, validationError]);

            const errorResult: ValidationResult = {
              isValid: false,
              errors: [
                {
                  code: "FIELD_VALIDATION_ERROR",
                  field,
                  message: "Field validation failed. Please try again.",
                  severity: "error",
                  category: "data_integrity",
                },
              ],
              warnings: [],
              suggestions: [],
            };

            const currentToken = fieldTokensRef.current.get(field);
            if (currentToken === nextToken && mountedRef.current) {
              setValidationState(prev => ({
                ...prev,
                fieldValidations: { ...prev.fieldValidations, [field]: errorResult },
              }));
            }

            resolve(errorResult);
          } finally {
            // only clear validating flag if this is the latest run
            const currentToken = fieldTokensRef.current.get(field);
            if (currentToken === nextToken) {
              fieldValidatingRef.current.delete(field);
            }
          }
        }, debounceMs);

        fieldTimersRef.current.set(field, timer);
      });
    },
    [
      companyId,
      enableRealTimeValidation,
      debounceMs,
      createCacheKey,
      getCachedResult,
      setCachedResult,
    ],
  );

  /**
   * Batch field validation for performance optimization
   */
  const validateFields = useCallback(
    async (
      fields: { field: string; value: any }[],
      context: Partial<VoucherValidationContext>,
    ): Promise<Record<string, ValidationResult>> => {
      if (!validatorRef.current || !enableRealTimeValidation || !enableBatchValidation) {
        return fields.reduce(
          (acc, { field }) => ({
            ...acc,
            [field]: { isValid: true, errors: [], warnings: [], suggestions: [] },
          }),
          {},
        );
      }

      // Check cache for all fields first
      const results: Record<string, ValidationResult> = {};
      const fieldsToValidate: { field: string; value: any }[] = [];

      fields.forEach(({ field, value }) => {
        const cacheKey = createCacheKey(field, value, context);
        const cachedResult = getCachedResult(cacheKey);
        if (cachedResult) {
          results[field] = cachedResult;
        } else {
          fieldsToValidate.push({ field, value });
        }
      });

      if (fieldsToValidate.length === 0) {
        return results;
      }

      // Clear previous timers for these fields
      fieldsToValidate.forEach(({ field }) => {
        const prevTimer = fieldTimersRef.current.get(field);
        if (prevTimer) clearTimeout(prevTimer);
      });

      // Bump tokens for these fields
      const tokens = fieldsToValidate.reduce(
        (acc, { field }) => {
          const nextToken = (fieldTokensRef.current.get(field) ?? 0) + 1;
          fieldTokensRef.current.set(field, nextToken);
          acc[field] = nextToken;
          return acc;
        },
        {} as Record<string, number>,
      );

      // Mark fields as validating
      fieldsToValidate.forEach(({ field }) => {
        fieldValidatingRef.current.add(field);
      });

      return new Promise(resolve => {
        const timer = setTimeout(async () => {
          try {
            const batchResults = await Promise.all(
              fieldsToValidate.map(async ({ field, value }) => {
                try {
                  const result = await validatorRef.current!.validateFieldRealTime(field, value, {
                    companyId,
                    ...context,
                  });

                  // Cache the result
                  const cacheKey = createCacheKey(field, value, context);
                  setCachedResult(cacheKey, result);

                  const currentToken = fieldTokensRef.current.get(field);
                  if (currentToken === tokens[field] && mountedRef.current) {
                    setValidationState(prev => ({
                      ...prev,
                      fieldValidations: { ...prev.fieldValidations, [field]: result },
                    }));
                    // Clear any previous errors for this field
                    setValidationErrors(prev => prev.filter(error => error.field !== field));
                  }

                  return { field, result };
                } catch (error) {
                  console.error(`Field validation error for ${field}:`, error);

                  // Store the error for debugging
                  const validationError: ValidationError = new Error(
                    `Field validation error for ${field}: ${error.message}`,
                  );
                  validationError.field = field;
                  validationError.code = "FIELD_VALIDATION_ERROR";
                  validationError.recoverable = true;
                  setValidationErrors(prev => [...prev, validationError]);

                  const errorResult: ValidationResult = {
                    isValid: false,
                    errors: [
                      {
                        code: "FIELD_VALIDATION_ERROR",
                        field,
                        message: "Field validation failed",
                        severity: "error",
                        category: "data_integrity",
                      },
                    ],
                    warnings: [],
                    suggestions: [],
                  };

                  const currentToken = fieldTokensRef.current.get(field);
                  if (currentToken === tokens[field] && mountedRef.current) {
                    setValidationState(prev => ({
                      ...prev,
                      fieldValidations: { ...prev.fieldValidations, [field]: errorResult },
                    }));
                  }

                  return { field, result: errorResult };
                } finally {
                  const currentToken = fieldTokensRef.current.get(field);
                  if (currentToken === tokens[field]) {
                    fieldValidatingRef.current.delete(field);
                  }
                }
              }),
            );

            const batchResultsMap = batchResults.reduce(
              (acc, { field, result }) => {
                acc[field] = result;
                return acc;
              },
              {} as Record<string, ValidationResult>,
            );

            // Combine cached and batch results
            const finalResults = { ...results, ...batchResultsMap };
            resolve(finalResults);
          } catch (error) {
            console.error("Batch field validation error:", error);
            resolve(results); // Return cached results on batch error
          }
        }, debounceMs);

        // Store timer for potential cleanup
        fieldsToValidate.forEach(({ field }) => {
          fieldTimersRef.current.set(field, timer);
        });
      });
    },
    [
      companyId,
      enableRealTimeValidation,
      enableBatchValidation,
      debounceMs,
      createCacheKey,
      getCachedResult,
      setCachedResult,
    ],
  );

  /**
   * Clear field validation
   */
  const clearFieldValidation = useCallback((field: string) => {
    const t = fieldTimersRef.current.get(field);
    if (t) clearTimeout(t);
    fieldTimersRef.current.delete(field);
    fieldTokensRef.current.delete(field);
    fieldValidatingRef.current.delete(field);

    setValidationState(prev => {
      const next = { ...prev.fieldValidations };
      delete next[field];
      return { ...prev, fieldValidations: next };
    });

    // Clear field-specific errors
    setValidationErrors(prev => prev.filter(error => error.field !== field));
  }, []);

  /**
   * Clear all validations
   */
  const clearAllValidations = useCallback(() => {
    for (const t of fieldTimersRef.current.values()) clearTimeout(t);
    fieldTimersRef.current.clear();
    fieldTokensRef.current.clear();
    fieldValidatingRef.current.clear();
    validationCacheRef.current.clear();

    setValidationState({
      isValidating: false,
      voucherValidation: null,
      fieldValidations: {},
      lastValidated: null,
    });

    setValidationErrors([]);
    validatorRef.current?.clearCache();
  }, []);

  /**
   * Get validation result for a specific field
   */
  const getFieldValidation = useCallback(
    (field: string): ValidationResult | null => {
      return validationState.fieldValidations[field] || null;
    },
    [validationState.fieldValidations],
  );

  /**
   * Is a specific field currently validating?
   */
  const isFieldValidating = useCallback((field: string): boolean => {
    return fieldValidatingRef.current.has(field);
  }, []);

  /**
   * Check if field has errors
   */
  const hasFieldErrors = useCallback(
    (field: string): boolean => {
      const v = validationState.fieldValidations[field];
      return v ? v.errors.some(e => e.severity === "error") : false;
    },
    [validationState.fieldValidations],
  );

  /**
   * Check if field has warnings
   */
  const hasFieldWarnings = useCallback(
    (field: string): boolean => {
      const v = validationState.fieldValidations[field];
      return v ? v.warnings.length > 0 : false;
    },
    [validationState.fieldValidations],
  );

  /**
   * Get field error messages
   */
  const getFieldErrors = useCallback(
    (field: string): string[] => {
      const v = validationState.fieldValidations[field];
      return v ? v.errors.map(e => e.message) : [];
    },
    [validationState.fieldValidations],
  );

  /**
   * Get field warning messages
   */
  const getFieldWarnings = useCallback(
    (field: string): string[] => {
      const v = validationState.fieldValidations[field];
      return v ? v.warnings.map(w => w.message) : [];
    },
    [validationState.fieldValidations],
  );

  /**
   * Check if voucher is valid
   */
  const isVoucherValid = useCallback((): boolean => {
    return validationState.voucherValidation?.isValid ?? false;
  }, [validationState.voucherValidation]);

  /**
   * Get voucher validation summary
   */
  const getVoucherValidationSummary = useCallback(() => {
    const v = validationState.voucherValidation;
    if (!v) return null;
    const errorCount = v.errors.filter(e => e.severity === "error").length;
    const warningCount = v.warnings.length;
    return {
      isValid: v.isValid,
      errorCount,
      warningCount,
      hasBlockingErrors: errorCount > 0,
      suggestions: v.suggestions,
    };
  }, [validationState.voucherValidation]);

  /**
   * Get all validation errors grouped by category
   */
  const getValidationErrorsByCategory = useCallback(() => {
    const v = validationState.voucherValidation;
    if (!v) return {};
    return v.errors.reduce(
      (groups, error) => {
        const cat = error.category;
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(error);
        return groups;
      },
      {} as Record<string, any[]>,
    );
  }, [validationState.voucherValidation]);

  /**
   * Validate voucher entries in real-time
   */
  const validateVoucherRealTime = useCallback(
    async (
      entries: GLEntryInput[],
      voucherType: string,
      voucherNo: string,
      postingDate: string,
    ) => {
      const context: VoucherValidationContext = {
        voucherType,
        voucherNo,
        companyId,
        postingDate,
        entries,
      };
      return validateVoucher(context);
    },
    [companyId, validateVoucher],
  );

  /**
   * Get accessibility props for form fields
   */
  const getAccessibilityProps = useCallback(
    (field: string) => {
      const hasErrors = hasFieldErrors(field);
      const hasWarnings = hasFieldWarnings(field);
      const isValidating = isFieldValidating(field);

      return {
        "aria-invalid": hasErrors ? "true" : "false",
        "aria-describedby":
          hasErrors || hasWarnings || isValidating
            ? `${field}-error ${field}-warning ${field}-validating`.trim()
            : undefined,
        "aria-busy": isValidating ? "true" : "false",
      };
    },
    [hasFieldErrors, hasFieldWarnings, isFieldValidating],
  );

  /**
   * Get validation message IDs for accessibility
   */
  const getValidationMessageIds = useCallback((field: string) => {
    return {
      errorId: `${field}-error`,
      warningId: `${field}-warning`,
      validatingId: `${field}-validating`,
    };
  }, []);

  /**
   * Retry failed validation
   */
  const retryValidation = useCallback(
    async (field?: string) => {
      if (field) {
        // Retry specific field
        const fieldValidation = getFieldValidation(field);
        if (fieldValidation && !fieldValidation.isValid) {
          // Get the last value from validation state or re-validate with current form value
          // This would need to be called with the current value from the form
          console.log(`Retrying validation for field: ${field}`);
        }
      } else {
        // Retry all failed validations
        const failedFields = Object.keys(validationState.fieldValidations).filter(f =>
          hasFieldErrors(f),
        );
        console.log(`Retrying validation for fields: ${failedFields.join(", ")}`);
      }
    },
    [getFieldValidation, validationState.fieldValidations, hasFieldErrors],
  );

  /**
   * Get validation errors for debugging
   */
  const getValidationErrors = useCallback(() => {
    return validationErrors;
  }, [validationErrors]);

  /**
   * Clear validation errors
   */
  const clearValidationErrors = useCallback(() => {
    setValidationErrors([]);
  }, []);

  return {
    // State
    isValidating: validationState.isValidating,
    voucherValidation: validationState.voucherValidation,
    fieldValidations: validationState.fieldValidations,
    lastValidated: validationState.lastValidated,

    // Actions
    validateVoucher,
    validateField,
    validateFields,
    validateVoucherRealTime,
    clearFieldValidation,
    clearAllValidations,
    clearValidationCache,
    retryValidation,

    // Getters
    getFieldValidation,
    isFieldValidating,
    hasFieldErrors,
    hasFieldWarnings,
    getFieldErrors,
    getFieldWarnings,
    isVoucherValid,
    getVoucherValidationSummary,
    getValidationErrorsByCategory,

    // Accessibility
    getAccessibilityProps,
    getValidationMessageIds,

    // Error handling
    getValidationErrors,
    clearValidationErrors,

    // Cache management
    getCachedResult: (field: string, value: any, context: Partial<VoucherValidationContext>) =>
      getCachedResult(createCacheKey(field, value, context)),
    setCachedResult: (
      field: string,
      value: any,
      context: Partial<VoucherValidationContext>,
      result: ValidationResult,
    ) => setCachedResult(createCacheKey(field, value, context), result),
  };
}

/**
 * Validation Context Provider for complex scenarios
 */
const ValidationContext = React.createContext<ReturnType<typeof useGLValidation> | null>(null);

export const ValidationProvider: React.FC<{
  companyId: string;
  children: React.ReactNode;
  options?: Omit<UseGLValidationOptions, "companyId">;
}> = ({ companyId, children, options }) => {
  const validation = useGLValidation({ companyId, ...options });

  return <ValidationContext.Provider value={validation}>{children}</ValidationContext.Provider>;
};

export const useValidation = () => {
  const context = useContext(ValidationContext);
  if (!context) {
    throw new Error("useValidation must be used within a ValidationProvider");
  }
  return context;
};

/**
 * Enhanced form state hook with better TypeScript support
 */
export function useValidationFormState<T extends Record<string, any>>(
  initialValues: T,
  companyId: string,
  options?: {
    debounceMs?: number;
    enableRealTimeValidation?: boolean;
    enableBatchValidation?: boolean;
  },
) {
  const [values, setValues] = useState<T>(initialValues);
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);

  const validation = useGLValidation({
    companyId,
    debounceMs: options?.debounceMs,
    enableRealTimeValidation: options?.enableRealTimeValidation,
    enableBatchValidation: options?.enableBatchValidation,
  });

  const setValue = useCallback(
    <K extends keyof T>(field: K, value: T[K]) => {
      setValues(prev => ({ ...prev, [field]: value }));
      if (touched[field] || submitted) {
        validation.validateField(field as string, value, { companyId });
      }
    },
    [touched, submitted, validation, companyId],
  );

  const setFieldTouched = useCallback(
    <K extends keyof T>(field: K, isTouched = true) => {
      setTouched(prev => ({ ...prev, [field]: isTouched }));
      if (isTouched) {
        validation.validateField(field as string, values[field], { companyId });
      }
    },
    [values, validation, companyId],
  );

  const setAllTouched = useCallback(
    (isTouched = true) => {
      const newTouched = Object.keys(values).reduce(
        (acc, key) => {
          acc[key as keyof T] = isTouched;
          return acc;
        },
        {} as Partial<Record<keyof T, boolean>>,
      );
      setTouched(newTouched);

      // Use batch validation if enabled
      if (options?.enableBatchValidation) {
        const fields = Object.entries(values).map(([field, value]) => ({ field, value }));
        validation.validateFields(fields, { companyId });
      } else {
        // Validate all fields individually
        Object.entries(values).forEach(([field, value]) => {
          validation.validateField(field, value, { companyId });
        });
      }
    },
    [values, validation, companyId, options?.enableBatchValidation],
  );

  const handleSubmit = useCallback(
    async (onSubmit: (values: T) => Promise<void> | void) => {
      setSubmitted(true);
      setAllTouched(true);

      // Wait a bit for validations to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check for validation errors
      const hasErrors = Object.keys(values).some(field => validation.hasFieldErrors(field));

      if (!hasErrors) {
        await onSubmit(values);
      }

      return !hasErrors;
    },
    [values, validation, setAllTouched],
  );

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setTouched({});
    setSubmitted(false);
    validation.clearAllValidations();
  }, [initialValues, validation]);

  const isFieldTouched = useCallback(
    <K extends keyof T>(field: K): boolean => {
      return touched[field] || false;
    },
    [touched],
  );

  const getFieldProps = useCallback(
    <K extends keyof T>(field: K) => {
      const fieldStr = field as string;
      return {
        value: values[field],
        onChange: (value: T[K]) => setValue(field, value),
        onBlur: () => setFieldTouched(field),
        error: validation.hasFieldErrors(fieldStr) && (isFieldTouched(field) || submitted),
        helperText:
          isFieldTouched(field) || submitted
            ? validation.getFieldErrors(fieldStr)[0] || validation.getFieldWarnings(fieldStr)[0]
            : undefined,
        validating: validation.isFieldValidating(fieldStr),
        ...validation.getAccessibilityProps(fieldStr),
      };
    },
    [values, setValue, setFieldTouched, validation, isFieldTouched, submitted],
  );

  return {
    values,
    touched,
    submitted,
    validation,
    setValue,
    setFieldTouched,
    setAllTouched,
    handleSubmit,
    resetForm,
    isFieldTouched,
    getFieldProps,
    isValid: Object.keys(values).every(
      field =>
        !validation.hasFieldErrors(field) || (!isFieldTouched(field as keyof T) && !submitted),
    ),
  };
}

/**
 * Debounce hook (unchanged)
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default useGLValidation;
