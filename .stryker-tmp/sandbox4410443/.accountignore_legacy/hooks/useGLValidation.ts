/**
 * React Hook for Real-time GL Entry Validation
 * Robust version: per-field debouncing, race-safety, unmount guards, and validateOnMount support
 */
// @ts-nocheck


import { useState, useEffect, useCallback, useRef } from "react";
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
}

interface ValidationState {
  isValidating: boolean;
  voucherValidation: ValidationResult | null;
  fieldValidations: Record<string, ValidationResult>;
  lastValidated: number | null;
}

export function useGLValidation(options: UseGLValidationOptions) {
  const {
    companyId,
    enableRealTimeValidation = true,
    debounceMs = 300,
    validateOnMount = false,
    mountContext,
  } = options;

  const [validationState, setValidationState] = useState<ValidationState>({
    isValidating: false,
    voucherValidation: null,
    fieldValidations: {},
    lastValidated: null,
  });

  const validatorRef = useRef<GLEntryValidator | null>(null);

  // Per-field timers & in-flight tokens to avoid cross-field interference
  const fieldTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const fieldTokensRef = useRef<Map<string, number>>(new Map());
  const fieldValidatingRef = useRef<Set<string>>(new Set());

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
      } catch {
        if (!mountedRef.current) return;
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
   * Validate complete voucher
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

        return result;
      } catch (error) {
        console.error("Voucher validation error:", error);

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
   * Validate individual field with debouncing (per-field)
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

            // only set state if still latest token
            const currentToken = fieldTokensRef.current.get(field);
            if (currentToken === nextToken && mountedRef.current) {
              setValidationState(prev => ({
                ...prev,
                fieldValidations: { ...prev.fieldValidations, [field]: result },
              }));
            }

            resolve(result);
          } catch (error) {
            console.error(`Field validation error for ${field}:`, error);

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
    [companyId, enableRealTimeValidation, debounceMs],
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
  }, []);

  /**
   * Clear all validations
   */
  const clearAllValidations = useCallback(() => {
    for (const t of fieldTimersRef.current.values()) clearTimeout(t);
    fieldTimersRef.current.clear();
    fieldTokensRef.current.clear();
    fieldValidatingRef.current.clear();

    setValidationState({
      isValidating: false,
      voucherValidation: null,
      fieldValidations: {},
      lastValidated: null,
    });

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

  return {
    // State
    isValidating: validationState.isValidating,
    voucherValidation: validationState.voucherValidation,
    fieldValidations: validationState.fieldValidations,
    lastValidated: validationState.lastValidated,

    // Actions
    validateVoucher,
    validateField,
    validateVoucherRealTime,
    clearFieldValidation,
    clearAllValidations,

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

/**
 * Validation form state helper (compatible with the updated hook)
 */
export function useValidationFormState<T extends Record<string, any>>(
  initialValues: T,
  companyId: string,
) {
  const [values, setValues] = useState<T>(initialValues);
  const [touched, setTouched] = useState<Record<keyof T, boolean>>({} as Record<keyof T, boolean>);

  const validation = useGLValidation({ companyId });

  const setValue = useCallback(
    (field: keyof T, value: any) => {
      setValues(prev => ({ ...prev, [field]: value }));
      if (touched[field]) {
        validation.validateField(field as string, value, { companyId });
      }
    },
    [touched, validation, companyId],
  );

  const setFieldTouched = useCallback(
    (field: keyof T, isTouched = true) => {
      setTouched(prev => ({ ...prev, [field]: isTouched }));
      if (isTouched) {
        validation.validateField(field as string, values[field], { companyId });
      }
    },
    [values, validation, companyId],
  );

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setTouched({} as Record<keyof T, boolean>);
    validation.clearAllValidations();
  }, [initialValues, validation]);

  const isFieldTouched = useCallback(
    (field: keyof T): boolean => {
      return touched[field] || false;
    },
    [touched],
  );

  const getFieldProps = useCallback(
    (field: keyof T) => {
      return {
        value: values[field],
        onChange: (value: any) => setValue(field, value),
        onBlur: () => setFieldTouched(field),
        // Show first error or warning when touched
        error: validation.hasFieldErrors(field as string) && isFieldTouched(field),
        helperText: isFieldTouched(field)
          ? validation.getFieldErrors(field as string)[0] ||
            validation.getFieldWarnings(field as string)[0]
          : undefined,
        // Optional: loading state for spinners on inputs
        validating: validation.isFieldValidating(field as string),
      };
    },
    [values, setValue, setFieldTouched, validation, isFieldTouched],
  );

  return {
    values,
    touched,
    validation,
    setValue,
    setFieldTouched,
    resetForm,
    isFieldTouched,
    getFieldProps,
  };
}

export default useGLValidation;
