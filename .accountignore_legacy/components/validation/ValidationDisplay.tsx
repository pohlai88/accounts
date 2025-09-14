/**
 * Validation Display Components
 * Real-time validation feedback UI components with performance optimizations
 */

import React, { useMemo, memo, useCallback } from "react";
import { AlertCircle, AlertTriangle, Info, CheckCircle, Lightbulb } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from "@/lib/validation/gl-entry-validator";

// Centralized class mappings for DRY color logic
const CATEGORY_CLASS: Record<string, string> = {
  business_rule: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  data_integrity: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  compliance: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  performance: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
};

const IMPACT_CLASS: Record<string, string> = {
  high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

interface ValidationDisplayProps {
  validation: ValidationResult | null;
  showSuggestions?: boolean;
  className?: string;
}

interface ValidationSummaryProps {
  validation: ValidationResult | null;
  compact?: boolean;
}

interface FieldValidationProps {
  fieldName: string;
  validation: ValidationResult | null;
  showInline?: boolean;
}

/**
 * Main validation display component with memoization & accessibility
 */
export function ValidationDisplay({
  validation,
  showSuggestions = true,
  className = "",
}: ValidationDisplayProps) {
  if (!validation) return null;

  const { errors, warnings: rawWarnings, suggestions } = validation;

  // Derive buckets once with useMemo for performance
  const { hardErrors, warnings, infos } = useMemo(() => {
    const hardErrors = errors.filter(e => e.severity === "error");
    const warningErrors = errors.filter(e => e.severity === "warning");
    const infos = errors.filter(e => e.severity === "info");
    const warnings = [
      ...warningErrors.map(w => ({ ...w, impact: (w as any).impact ?? "medium" })), // normalize
      ...rawWarnings.map(w => ({ ...w, severity: "warning" as const })),
    ];
    return { hardErrors, warnings, infos };
  }, [errors, rawWarnings]);

  return (
    <div className={`space-y-3 ${className}`} aria-live="polite" aria-relevant="additions text">
      {/* Errors */}
      {hardErrors.length > 0 && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-red-800 dark:text-red-200">
              <AlertCircle className="h-4 w-4" />
              Validation Errors ({hardErrors.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {hardErrors.map(e => (
              <ValidationErrorItem key={`${e.code}:${e.field}:${e.message}`} error={e} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <AlertTriangle className="h-4 w-4" />
              Warnings ({warnings.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {warnings.map(w => (
              <ValidationWarningItem key={`${w.code}:${w.field}:${w.message}`} warning={w} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Info */}
      {infos.length > 0 && (
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
              <Info className="h-4 w-4" />
              Information ({infos.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {infos.map(i => (
              <ValidationInfoItem key={`${i.code}:${i.field}:${i.message}`} info={i} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
              <Lightbulb className="h-4 w-4" />
              Suggestions ({suggestions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {suggestions.map(s => (
              <div key={s} className="text-sm text-green-700 dark:text-green-300">
                • {s}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Success */}
      {validation.isValid && hardErrors.length === 0 && warnings.length === 0 && (
        <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            All validations passed successfully!
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

/**
 * Compact validation summary
 */
export function ValidationSummary({ validation, compact = false }: ValidationSummaryProps) {
  if (!validation) return null;

  const errorCount = validation.errors.filter(e => e.severity === "error").length;
  const warningCount =
    validation.warnings.length + validation.errors.filter(e => e.severity === "warning").length;
  const suggestionCount = validation.suggestions.length;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {errorCount > 0 && (
          <Badge variant="destructive" className="text-xs">
            {errorCount} error{errorCount !== 1 ? "s" : ""}
          </Badge>
        )}
        {warningCount > 0 && (
          <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
            {warningCount} warning{warningCount !== 1 ? "s" : ""}
          </Badge>
        )}
        {errorCount === 0 && warningCount === 0 && (
          <Badge variant="default" className="text-xs bg-green-100 text-green-800">
            Valid
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
      <div className="text-center">
        <div className={`text-2xl font-bold ${errorCount > 0 ? "text-red-600" : "text-gray-400"}`}>
          {errorCount}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Errors</div>
      </div>
      <div className="text-center">
        <div
          className={`text-2xl font-bold ${warningCount > 0 ? "text-yellow-600" : "text-gray-400"}`}
        >
          {warningCount}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Warnings</div>
      </div>
      <div className="text-center">
        <div
          className={`text-2xl font-bold ${suggestionCount > 0 ? "text-green-600" : "text-gray-400"}`}
        >
          {suggestionCount}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Suggestions</div>
      </div>
    </div>
  );
}

/**
 * Field-specific validation display with stable keys
 */
export function FieldValidation({
  fieldName,
  validation,
  showInline = true,
}: FieldValidationProps) {
  if (!validation) return null;

  const errors = validation.errors.filter(e => e.severity === "error");
  const warnings = validation.warnings;

  if (showInline) {
    return (
      <div className="mt-1 space-y-1" aria-live="polite">
        {errors.map(e => (
          <div
            key={`${e.code}:${e.field}:${e.message}`}
            className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400"
          >
            <AlertCircle className="h-3 w-3" />
            {e.message}
          </div>
        ))}
        {warnings.map(w => (
          <div
            key={`${w.code}:${w.field}:${w.message}`}
            className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400"
          >
            <AlertTriangle className="h-3 w-3" />
            {w.message}
          </div>
        ))}
      </div>
    );
  }

  return (
    <Collapsible>
      <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium">
        {fieldName} Validation
        {errors.length > 0 && (
          <Badge variant="destructive" className="text-xs">
            {errors.length}
          </Badge>
        )}
        {warnings.length > 0 && (
          <Badge variant="secondary" className="text-xs">
            {warnings.length}
          </Badge>
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-2">
        {errors.map(error => (
          <ValidationErrorItem
            key={`${error.code}:${error.field}:${error.message}`}
            error={error}
          />
        ))}
        {warnings.map(warning => (
          <ValidationWarningItem
            key={`${warning.code}:${warning.field}:${warning.message}`}
            warning={warning}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

/**
 * Individual validation error item - memoized for performance
 */
export const ValidationErrorItem = memo(function ValidationErrorItem({
  error,
}: {
  error: ValidationError;
}) {
  const cat =
    CATEGORY_CLASS[error.category] ??
    "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  return (
    <div className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded border border-red-200 dark:border-red-800">
      <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-red-800 dark:text-red-200">{error.field}</span>
          <Badge className={`text-xs ${cat}`}>{error.category.replace("_", " ")}</Badge>
        </div>
        <p className="text-sm text-red-700 dark:text-red-300">{error.message}</p>
        <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-mono">Code: {error.code}</p>
      </div>
    </div>
  );
});

/**
 * Individual validation warning item - memoized for performance
 */
export const ValidationWarningItem = memo(function ValidationWarningItem({
  warning,
}: {
  warning: ValidationWarning | (ValidationError & { impact?: string });
}) {
  const impactClass =
    IMPACT_CLASS[(warning as any).impact ?? "medium"] ??
    "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  return (
    <div className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded border border-yellow-200 dark:border-yellow-800">
      <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-yellow-800 dark:text-yellow-200">{warning.field}</span>
          {(warning as any).impact && (
            <Badge className={`text-xs ${impactClass}`}>{(warning as any).impact} impact</Badge>
          )}
        </div>
        <p className="text-sm text-yellow-700 dark:text-yellow-300">{warning.message}</p>
        <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1 font-mono">
          Code: {warning.code}
        </p>
      </div>
    </div>
  );
});

/**
 * Individual validation info item - memoized for performance
 */
export const ValidationInfoItem = memo(function ValidationInfoItem({
  info,
}: {
  info: ValidationError;
}) {
  return (
    <div className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded border border-blue-200 dark:border-blue-800">
      <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-blue-800 dark:text-blue-200">{info.field}</span>
        </div>
        <p className="text-sm text-blue-700 dark:text-blue-300">{info.message}</p>
        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-mono">Code: {info.code}</p>
      </div>
    </div>
  );
});

/**
 * Real-time validation status indicator with accessibility
 */
export function ValidationStatusIndicator({
  isValidating,
  isValid,
  hasErrors,
  hasWarnings,
}: {
  isValidating: boolean;
  isValid: boolean;
  hasErrors: boolean;
  hasWarnings: boolean;
}) {
  if (isValidating) {
    return (
      <div
        className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
        role="status"
        aria-busy="true"
      >
        <div className="animate-spin h-3 w-3 border border-gray-300 border-t-gray-600 rounded-full" />
        Validating...
      </div>
    );
  }

  if (hasErrors) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400" role="status">
        <AlertCircle className="h-3 w-3" />
        Has errors
      </div>
    );
  }

  if (hasWarnings) {
    return (
      <div
        className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400"
        role="status"
      >
        <AlertTriangle className="h-3 w-3" />
        Has warnings
      </div>
    );
  }

  if (isValid) {
    return (
      <div
        className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400"
        role="status"
      >
        <CheckCircle className="h-3 w-3" />
        Valid
      </div>
    );
  }

  return null;
}

/**
 * Validation progress indicator with clamped values & proportional error segment
 */
export function ValidationProgress({
  total,
  validated,
  errors,
}: {
  total: number;
  validated: number;
  errors: number;
}) {
  const safeTotal = Math.max(0, total);
  const safeValidated = Math.min(Math.max(0, validated), safeTotal);
  const safeErrors = Math.min(Math.max(0, errors), safeValidated);

  const validatedPct = safeTotal ? (safeValidated / safeTotal) * 100 : 0;
  const errorPctOfValidated = safeValidated ? (safeErrors / safeValidated) * 100 : 0;

  return (
    <div className="space-y-2" aria-label="Validation progress">
      <div className="flex justify-between text-sm">
        <span>Validation Progress</span>
        <span>
          {safeValidated}/{safeTotal}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700 overflow-hidden">
        <div className="relative h-2">
          {/* Validated segment */}
          <div
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${validatedPct}%` }}
          />
          {/* Error overlay within validated segment */}
          <div
            className="h-full bg-red-500 transition-all duration-300 -mt-2"
            style={{ width: `${(validatedPct * errorPctOfValidated) / 100}%` }}
          />
        </div>
      </div>
      {safeErrors > 0 && (
        <div className="text-xs text-red-600 dark:text-red-400">
          {safeErrors} validation error{safeErrors !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}

/**
 * Copy validation details to clipboard (extra polish)
 */
export function CopyValidationDetails({ validation }: { validation: ValidationResult | null }) {
  const copyDetails = useCallback(() => {
    if (!validation) return;

    const details = {
      timestamp: new Date().toISOString(),
      isValid: validation.isValid,
      errors: validation.errors.map(e => ({
        code: e.code,
        field: e.field,
        message: e.message,
        severity: e.severity,
        category: e.category,
      })),
      warnings: validation.warnings.map(w => ({
        code: w.code,
        field: w.field,
        message: w.message,
      })),
      suggestions: validation.suggestions,
    };

    navigator.clipboard
      .writeText(JSON.stringify(details, null, 2))
      .then(() => {
        // Could show a toast notification here
        console.log("Validation details copied to clipboard");
      })
      .catch(err => {
        console.error("Failed to copy validation details:", err);
      });
  }, [validation]);

  if (!validation || (validation.errors.length === 0 && validation.warnings.length === 0)) {
    return null;
  }

  return (
    <button
      onClick={copyDetails}
      className="inline-flex items-center gap-2 px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded border"
      title="Copy validation details for support"
    >
      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
        />
      </svg>
      Copy Details
    </button>
  );
}

/**
 * Enhanced validation error item with field linking (extra polish)
 */
export const ValidationErrorItemWithLink = memo(function ValidationErrorItemWithLink({
  error,
  linkToField = false,
}: {
  error: ValidationError;
  linkToField?: boolean;
}) {
  const cat =
    CATEGORY_CLASS[error.category] ??
    "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";

  const fieldElement = linkToField ? (
    <a
      href={`#field-${error.field}`}
      className="font-medium text-red-800 dark:text-red-200 hover:underline focus:underline"
      onClick={e => {
        e.preventDefault();
        const fieldEl = document.getElementById(`field-${error.field}`);
        if (fieldEl) {
          fieldEl.scrollIntoView({ behavior: "smooth", block: "center" });
          fieldEl.focus();
        }
      }}
    >
      {error.field}
    </a>
  ) : (
    <span className="font-medium text-red-800 dark:text-red-200">{error.field}</span>
  );

  return (
    <div className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded border border-red-200 dark:border-red-800">
      <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {fieldElement}
          <Badge className={`text-xs ${cat}`}>{error.category.replace("_", " ")}</Badge>
        </div>
        <p className="text-sm text-red-700 dark:text-red-300">{error.message}</p>
        <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-mono">Code: {error.code}</p>
      </div>
    </div>
  );
});

export default ValidationDisplay;
