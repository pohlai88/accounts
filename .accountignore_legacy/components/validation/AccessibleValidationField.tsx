/**
 * Accessible Validation Field Components
 * WCAG 2.2 AAA compliant validation UI components
 */

import React, { useId } from "react";
import { useValidation } from "@/hooks/useGLValidation-enterprise";
import { cn } from "@/lib/utils";

interface AccessibleValidationFieldProps {
  field: string;
  label: string;
  children: React.ReactElement;
  showValidatingState?: boolean;
  className?: string;
}

/**
 * Wrapper component that adds accessibility features to validation fields
 */
export const AccessibleValidationField: React.FC<AccessibleValidationFieldProps> = ({
  field,
  label,
  children,
  showValidatingState = true,
  className,
}) => {
  const validation = useValidation();
  const fieldId = useId();

  const hasErrors = validation.hasFieldErrors(field);
  const hasWarnings = validation.hasFieldWarnings(field);
  const isValidating = validation.isFieldValidating(field);
  const errors = validation.getFieldErrors(field);
  const warnings = validation.getFieldWarnings(field);

  const { errorId, warningId, validatingId } = validation.getValidationMessageIds(field);
  const accessibilityProps = validation.getAccessibilityProps(field);

  // Clone the child element and add accessibility props
  const enhancedChild = React.cloneElement(children, {
    id: fieldId,
    ...accessibilityProps,
    className: cn(
      children.props.className,
      hasErrors && "border-red-500 focus:ring-red-500",
      hasWarnings && !hasErrors && "border-yellow-500 focus:ring-yellow-500",
      isValidating && "border-blue-500",
    ),
  });

  return (
    <div className={cn("space-y-2", className)}>
      {/* Label */}
      <label
        htmlFor={fieldId}
        className={cn(
          "block text-sm font-medium",
          hasErrors ? "text-red-700 dark:text-red-400" : "text-gray-700 dark:text-gray-300",
        )}
      >
        {label}
        {isValidating && showValidatingState && (
          <span className="ml-2 text-blue-600 dark:text-blue-400" aria-hidden="true">
            ⏳
          </span>
        )}
      </label>

      {/* Input Field */}
      {enhancedChild}

      {/* Validation Messages */}
      <div className="space-y-1">
        {/* Error Messages */}
        {hasErrors && (
          <div
            id={errorId}
            role="alert"
            aria-live="assertive"
            className="flex items-start space-x-2 text-sm text-red-600 dark:text-red-400"
          >
            <span aria-hidden="true" className="flex-shrink-0 mt-0.5">
              ❌
            </span>
            <div>
              {errors.map((error, index) => (
                <div key={index}>{error}</div>
              ))}
            </div>
          </div>
        )}

        {/* Warning Messages */}
        {hasWarnings && !hasErrors && (
          <div
            id={warningId}
            aria-live="polite"
            className="flex items-start space-x-2 text-sm text-yellow-600 dark:text-yellow-400"
          >
            <span aria-hidden="true" className="flex-shrink-0 mt-0.5">
              ⚠️
            </span>
            <div>
              {warnings.map((warning, index) => (
                <div key={index}>{warning}</div>
              ))}
            </div>
          </div>
        )}

        {/* Validating State */}
        {isValidating && showValidatingState && (
          <div
            id={validatingId}
            aria-live="polite"
            className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400"
          >
            <span className="animate-spin" aria-hidden="true">
              ⏳
            </span>
            <span>Validating {label.toLowerCase()}...</span>
          </div>
        )}

        {/* Success State */}
        {!hasErrors && !hasWarnings && !isValidating && validation.getFieldValidation(field) && (
          <div
            aria-live="polite"
            className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400"
          >
            <span aria-hidden="true">✅</span>
            <span>{label} is valid</span>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Accessible validation summary component
 */
interface ValidationSummaryProps {
  title?: string;
  showFieldCount?: boolean;
  showVoucherValidation?: boolean;
  className?: string;
}

export const ValidationSummary: React.FC<ValidationSummaryProps> = ({
  title = "Validation Summary",
  showFieldCount = true,
  showVoucherValidation = true,
  className,
}) => {
  const validation = useValidation();
  const voucherSummary = validation.getVoucherValidationSummary();

  const fieldValidations = Object.keys(validation.fieldValidations);
  const fieldErrors = fieldValidations.filter(field => validation.hasFieldErrors(field));
  const fieldWarnings = fieldValidations.filter(field => validation.hasFieldWarnings(field));
  const validFields = fieldValidations.filter(
    field => !validation.hasFieldErrors(field) && !validation.hasFieldWarnings(field),
  );

  const hasAnyErrors = fieldErrors.length > 0 || (voucherSummary?.errorCount || 0) > 0;
  const hasAnyWarnings = fieldWarnings.length > 0 || (voucherSummary?.warningCount || 0) > 0;

  return (
    <div className={cn("rounded-lg border p-4", className)}>
      <h3 className="text-lg font-semibold mb-3">{title}</h3>

      {/* Overall Status */}
      <div className="mb-4">
        {hasAnyErrors ? (
          <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
            <span aria-hidden="true">❌</span>
            <span className="font-medium">Validation Failed</span>
          </div>
        ) : hasAnyWarnings ? (
          <div className="flex items-center space-x-2 text-yellow-600 dark:text-yellow-400">
            <span aria-hidden="true">⚠️</span>
            <span className="font-medium">Validation Passed with Warnings</span>
          </div>
        ) : fieldValidations.length > 0 ? (
          <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
            <span aria-hidden="true">✅</span>
            <span className="font-medium">All Validations Passed</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
            <span aria-hidden="true">ℹ️</span>
            <span className="font-medium">No Validations Yet</span>
          </div>
        )}
      </div>

      {/* Field Validation Count */}
      {showFieldCount && fieldValidations.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {validFields.length}
            </div>
            <div className="text-gray-600 dark:text-gray-400">Valid</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {fieldWarnings.length}
            </div>
            <div className="text-gray-600 dark:text-gray-400">Warnings</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {fieldErrors.length}
            </div>
            <div className="text-gray-600 dark:text-gray-400">Errors</div>
          </div>
        </div>
      )}

      {/* Voucher Validation */}
      {showVoucherValidation && voucherSummary && (
        <div className="border-t pt-4">
          <h4 className="font-medium mb-2">Voucher Validation</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Status:</span>
              <span
                className={
                  voucherSummary.isValid
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }
              >
                {voucherSummary.isValid ? "Valid" : "Invalid"}
              </span>
            </div>
            {voucherSummary.errorCount > 0 && (
              <div className="flex justify-between">
                <span>Errors:</span>
                <span className="text-red-600 dark:text-red-400">{voucherSummary.errorCount}</span>
              </div>
            )}
            {voucherSummary.warningCount > 0 && (
              <div className="flex justify-between">
                <span>Warnings:</span>
                <span className="text-yellow-600 dark:text-yellow-400">
                  {voucherSummary.warningCount}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {voucherSummary?.suggestions && voucherSummary.suggestions.length > 0 && (
        <div className="border-t pt-4">
          <h4 className="font-medium mb-2">Suggestions</h4>
          <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
            {voucherSummary.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span aria-hidden="true" className="flex-shrink-0 mt-0.5">
                  💡
                </span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

/**
 * Accessible validation progress indicator
 */
interface ValidationProgressProps {
  fields: string[];
  className?: string;
}

export const ValidationProgress: React.FC<ValidationProgressProps> = ({ fields, className }) => {
  const validation = useValidation();

  const validatedFields = fields.filter(field => validation.getFieldValidation(field) !== null);
  const validatingFields = fields.filter(field => validation.isFieldValidating(field));
  const errorFields = fields.filter(field => validation.hasFieldErrors(field));

  const progress = (validatedFields.length / fields.length) * 100;
  const isComplete = validatedFields.length === fields.length;
  const hasErrors = errorFields.length > 0;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-between text-sm">
        <span>Validation Progress</span>
        <span>
          {validatedFields.length} / {fields.length} fields
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className={cn(
            "h-2 rounded-full transition-all duration-300",
            hasErrors ? "bg-red-500" : isComplete ? "bg-green-500" : "bg-blue-500",
          )}
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Validation progress: ${progress.toFixed(0)}%`}
        />
      </div>

      {/* Status Text */}
      <div className="text-xs text-gray-600 dark:text-gray-400">
        {validatingFields.length > 0 && (
          <span>Validating {validatingFields.length} field(s)...</span>
        )}
        {isComplete && !hasErrors && (
          <span className="text-green-600 dark:text-green-400">All validations complete ✅</span>
        )}
        {hasErrors && (
          <span className="text-red-600 dark:text-red-400">
            {errorFields.length} field(s) have errors ❌
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * Screen reader announcements for validation changes
 */
export const ValidationAnnouncer: React.FC = () => {
  const validation = useValidation();
  const [announcements, setAnnouncements] = React.useState<string[]>([]);

  // Monitor validation state changes for announcements
  React.useEffect(() => {
    const fieldValidations = validation.fieldValidations;
    const newAnnouncements: string[] = [];

    Object.entries(fieldValidations).forEach(([field, result]) => {
      if (!result.isValid && result.errors.length > 0) {
        newAnnouncements.push(`${field} has validation errors`);
      }
    });

    if (validation.voucherValidation && !validation.voucherValidation.isValid) {
      newAnnouncements.push("Voucher validation failed");
    }

    setAnnouncements(newAnnouncements);
  }, [validation.fieldValidations, validation.voucherValidation]);

  return (
    <div aria-live="assertive" aria-atomic="true" className="sr-only">
      {announcements.map((announcement, index) => (
        <div key={index}>{announcement}</div>
      ))}
    </div>
  );
};

export default AccessibleValidationField;
