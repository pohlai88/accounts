/**
 * Enhanced Export and Reporting for Validation Components
 * Provides multiple export formats and reporting capabilities
 */
// @ts-nocheck


import React, { useCallback, useState } from "react";
import { Download, FileText, Table, Copy, Check, AlertCircle } from "lucide-react";
import {
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from "@/lib/validation/gl-entry-validator";
import { useValidationI18n } from "./ValidationI18nProvider";

interface ValidationExportProps {
  validation: ValidationResult | null;
  filename?: string;
  includeMetadata?: boolean;
  className?: string;
}

interface ExportStatus {
  type: "success" | "error" | "copying" | null;
  message: string;
}

/**
 * Enhanced copy functionality with multiple formats
 */
export function ValidationExport({
  validation,
  filename,
  includeMetadata = true,
  className = "",
}: ValidationExportProps) {
  const i18n = useValidationI18n();
  const [status, setStatus] = useState<ExportStatus>({ type: null, message: "" });

  const showStatus = useCallback((type: ExportStatus["type"], message: string) => {
    setStatus({ type, message });
    setTimeout(() => setStatus({ type: null, message: "" }), 3000);
  }, []);

  const generateFilename = useCallback(
    (extension: string) => {
      const base = filename || "validation-report";
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
      return `${base}-${timestamp}.${extension}`;
    },
    [filename],
  );

  const generateMetadata = useCallback(() => {
    if (!includeMetadata) return {};

    return {
      timestamp: new Date().toISOString(),
      generatedBy: "eprNEXT Validation System",
      version: "1.0.0",
      locale: navigator.language || "en-US",
      userAgent: navigator.userAgent,
    };
  }, [includeMetadata]);

  const exportAsJson = useCallback(() => {
    if (!validation) return;

    try {
      const data = {
        ...generateMetadata(),
        summary: {
          isValid: validation.isValid,
          errorCount: validation.errors.filter(e => e.severity === "error").length,
          warningCount: validation.warnings.length,
          suggestionCount: validation.suggestions.length,
        },
        errors: validation.errors.map(error => ({
          code: error.code,
          field: error.field,
          message: error.message,
          severity: error.severity,
          category: error.category,
        })),
        warnings: validation.warnings.map(warning => ({
          code: warning.code,
          field: warning.field,
          message: warning.message,
          impact: (warning as any).impact || "medium",
        })),
        suggestions: validation.suggestions,
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = generateFilename("json");
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showStatus("success", i18n.exportSuccess);
    } catch (error) {
      console.error("JSON export error:", error);
      showStatus("error", i18n.exportError);
    }
  }, [validation, generateMetadata, generateFilename, showStatus, i18n]);

  const exportAsCsv = useCallback(() => {
    if (!validation) return;

    try {
      const headers = ["Type", "Field", "Code", "Message", "Severity", "Category", "Impact"];
      const rows = [headers];

      // Add errors
      validation.errors.forEach(error => {
        rows.push([
          "Error",
          error.field,
          error.code,
          error.message,
          error.severity,
          error.category,
          "",
        ]);
      });

      // Add warnings
      validation.warnings.forEach(warning => {
        rows.push([
          "Warning",
          warning.field,
          warning.code,
          warning.message,
          "",
          "",
          (warning as any).impact || "medium",
        ]);
      });

      // Add suggestions
      validation.suggestions.forEach(suggestion => {
        rows.push(["Suggestion", "", "", suggestion, "", "", ""]);
      });

      const csvContent = rows
        .map(row => row.map(field => `"${field.replace(/"/g, '""')}"`).join(","))
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = generateFilename("csv");
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showStatus("success", i18n.exportSuccess);
    } catch (error) {
      console.error("CSV export error:", error);
      showStatus("error", i18n.exportError);
    }
  }, [validation, generateFilename, showStatus, i18n]);

  const exportAsMarkdown = useCallback(() => {
    if (!validation) return;

    try {
      const metadata = generateMetadata();
      let content = `# ${i18n.validationReport}\n\n`;

      if (includeMetadata) {
        content += `**Generated:** ${metadata.timestamp}\n`;
        content += `**Status:** ${validation.isValid ? "Valid" : "Invalid"}\n\n`;
      }

      // Summary
      const errorCount = validation.errors.filter(e => e.severity === "error").length;
      const warningCount = validation.warnings.length;
      const suggestionCount = validation.suggestions.length;

      content += `## Summary\n\n`;
      content += `- **Errors:** ${errorCount}\n`;
      content += `- **Warnings:** ${warningCount}\n`;
      content += `- **Suggestions:** ${suggestionCount}\n\n`;

      // Errors
      if (validation.errors.length > 0) {
        content += `## Errors\n\n`;
        validation.errors.forEach(error => {
          content += `### ${error.field}\n\n`;
          content += `- **Code:** ${error.code}\n`;
          content += `- **Message:** ${error.message}\n`;
          content += `- **Severity:** ${error.severity}\n`;
          content += `- **Category:** ${error.category}\n\n`;
        });
      }

      // Warnings
      if (validation.warnings.length > 0) {
        content += `## Warnings\n\n`;
        validation.warnings.forEach(warning => {
          content += `### ${warning.field}\n\n`;
          content += `- **Code:** ${warning.code}\n`;
          content += `- **Message:** ${warning.message}\n`;
          content += `- **Impact:** ${(warning as any).impact || "medium"}\n\n`;
        });
      }

      // Suggestions
      if (validation.suggestions.length > 0) {
        content += `## Suggestions\n\n`;
        validation.suggestions.forEach((suggestion, index) => {
          content += `${index + 1}. ${suggestion}\n`;
        });
      }

      const blob = new Blob([content], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = generateFilename("md");
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showStatus("success", i18n.exportSuccess);
    } catch (error) {
      console.error("Markdown export error:", error);
      showStatus("error", i18n.exportError);
    }
  }, [validation, generateMetadata, includeMetadata, generateFilename, showStatus, i18n]);

  const copyToClipboard = useCallback(
    async (format: "json" | "text" | "markdown") => {
      if (!validation) return;

      setStatus({ type: "copying", message: "Copying to clipboard..." });

      try {
        let content = "";

        switch (format) {
          case "json":
            const jsonData = {
              ...generateMetadata(),
              isValid: validation.isValid,
              errors: validation.errors,
              warnings: validation.warnings,
              suggestions: validation.suggestions,
            };
            content = JSON.stringify(jsonData, null, 2);
            break;

          case "text":
            content = `${i18n.validationReport}\n`;
            content += `Generated: ${new Date().toISOString()}\n`;
            content += `Status: ${validation.isValid ? "Valid" : "Invalid"}\n\n`;

            if (validation.errors.length > 0) {
              content += `ERRORS (${validation.errors.length}):\n`;
              validation.errors.forEach(error => {
                content += `- ${error.field}: ${error.message} (${error.code})\n`;
              });
              content += "\n";
            }

            if (validation.warnings.length > 0) {
              content += `WARNINGS (${validation.warnings.length}):\n`;
              validation.warnings.forEach(warning => {
                content += `- ${warning.field}: ${warning.message} (${warning.code})\n`;
              });
              content += "\n";
            }

            if (validation.suggestions.length > 0) {
              content += `SUGGESTIONS (${validation.suggestions.length}):\n`;
              validation.suggestions.forEach(suggestion => {
                content += `- ${suggestion}\n`;
              });
            }
            break;

          case "markdown":
            // Use the same logic as exportAsMarkdown but return content instead of downloading
            const metadata = generateMetadata();
            content = `# ${i18n.validationReport}\n\n`;

            if (includeMetadata) {
              content += `**Generated:** ${metadata.timestamp}\n`;
              content += `**Status:** ${validation.isValid ? "Valid" : "Invalid"}\n\n`;
            }

            const errorCount = validation.errors.filter(e => e.severity === "error").length;
            const warningCount = validation.warnings.length;
            const suggestionCount = validation.suggestions.length;

            content += `## Summary\n\n`;
            content += `- **Errors:** ${errorCount}\n`;
            content += `- **Warnings:** ${warningCount}\n`;
            content += `- **Suggestions:** ${suggestionCount}\n\n`;

            if (validation.errors.length > 0) {
              content += `## Errors\n\n`;
              validation.errors.forEach(error => {
                content += `### ${error.field}\n\n`;
                content += `- **Code:** ${error.code}\n`;
                content += `- **Message:** ${error.message}\n`;
                content += `- **Severity:** ${error.severity}\n`;
                content += `- **Category:** ${error.category}\n\n`;
              });
            }
            break;
        }

        await navigator.clipboard.writeText(content);
        showStatus("success", "Copied to clipboard!");
      } catch (error) {
        console.error("Clipboard copy error:", error);
        showStatus("error", "Failed to copy to clipboard");
      }
    },
    [validation, generateMetadata, includeMetadata, showStatus, i18n],
  );

  if (
    !validation ||
    (validation.errors.length === 0 &&
      validation.warnings.length === 0 &&
      validation.suggestions.length === 0)
  ) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Export buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={exportAsJson}
          className="inline-flex items-center gap-2 px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-800 dark:text-blue-200 rounded border border-blue-200 dark:border-blue-700 transition-colors"
          title={i18n.exportJsonTitle}
        >
          <FileText className="h-3 w-3" />
          {i18n.exportJson}
        </button>

        <button
          onClick={exportAsCsv}
          className="inline-flex items-center gap-2 px-3 py-1 text-xs bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 text-green-800 dark:text-green-200 rounded border border-green-200 dark:border-green-700 transition-colors"
          title={i18n.exportCsvTitle}
        >
          <Table className="h-3 w-3" />
          {i18n.exportCsv}
        </button>

        <button
          onClick={exportAsMarkdown}
          className="inline-flex items-center gap-2 px-3 py-1 text-xs bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 dark:hover:bg-purple-800 text-purple-800 dark:text-purple-200 rounded border border-purple-200 dark:border-purple-700 transition-colors"
          title="Export as Markdown"
        >
          <Download className="h-3 w-3" />
          Markdown
        </button>
      </div>

      {/* Copy buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => copyToClipboard("text")}
          disabled={status.type === "copying"}
          className="inline-flex items-center gap-2 px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded border border-gray-200 dark:border-gray-600 transition-colors disabled:opacity-50"
          title="Copy as plain text"
        >
          <Copy className="h-3 w-3" />
          Copy Text
        </button>

        <button
          onClick={() => copyToClipboard("json")}
          disabled={status.type === "copying"}
          className="inline-flex items-center gap-2 px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded border border-gray-200 dark:border-gray-600 transition-colors disabled:opacity-50"
          title="Copy as JSON"
        >
          <Copy className="h-3 w-3" />
          Copy JSON
        </button>

        <button
          onClick={() => copyToClipboard("markdown")}
          disabled={status.type === "copying"}
          className="inline-flex items-center gap-2 px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded border border-gray-200 dark:border-gray-600 transition-colors disabled:opacity-50"
          title="Copy as Markdown"
        >
          <Copy className="h-3 w-3" />
          Copy MD
        </button>
      </div>

      {/* Status message */}
      {status.type && (
        <div
          className={`flex items-center gap-2 text-xs px-3 py-2 rounded ${
            status.type === "success"
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              : status.type === "error"
                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
          }`}
        >
          {status.type === "success" && <Check className="h-3 w-3" />}
          {status.type === "error" && <AlertCircle className="h-3 w-3" />}
          {status.type === "copying" && (
            <div className="animate-spin h-3 w-3 border border-current border-t-transparent rounded-full" />
          )}
          {status.message}
        </div>
      )}
    </div>
  );
}

/**
 * Compact export component for smaller spaces
 */
export function CompactValidationExport({
  validation,
  className = "",
}: {
  validation: ValidationResult | null;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  if (!validation || (validation.errors.length === 0 && validation.warnings.length === 0)) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded border"
        title="Export validation results"
      >
        <Download className="h-3 w-3" />
        Export
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full right-0 mt-1 z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 min-w-48">
            <ValidationExport validation={validation} />
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Validation report generator for detailed analysis
 */
export function ValidationReportGenerator({
  validation,
  title = "Validation Report",
  includeCharts = false,
}: {
  validation: ValidationResult | null;
  title?: string;
  includeCharts?: boolean;
}) {
  if (!validation) return null;

  const errorCount = validation.errors.filter(e => e.severity === "error").length;
  const warningCount = validation.warnings.length;
  const suggestionCount = validation.suggestions.length;

  // Group errors by category for analysis
  const errorsByCategory = validation.errors.reduce(
    (acc, error) => {
      acc[error.category] = (acc[error.category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Group errors by field for analysis
  const errorsByField = validation.errors.reduce(
    (acc, error) => {
      acc[error.field] = (acc[error.field] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="space-y-6 p-6 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Generated on {new Date().toLocaleString()}
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{errorCount}</div>
          <div className="text-sm text-red-800 dark:text-red-200">Errors</div>
        </div>
        <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {warningCount}
          </div>
          <div className="text-sm text-yellow-800 dark:text-yellow-200">Warnings</div>
        </div>
        <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {suggestionCount}
          </div>
          <div className="text-sm text-green-800 dark:text-green-200">Suggestions</div>
        </div>
      </div>

      {/* Analysis */}
      {Object.keys(errorsByCategory).length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">
            Errors by Category
          </h3>
          <div className="space-y-2">
            {Object.entries(errorsByCategory).map(([category, count]) => (
              <div
                key={category}
                className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded"
              >
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {category.replace("_", " ")}
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {Object.keys(errorsByField).length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">
            Most Problematic Fields
          </h3>
          <div className="space-y-2">
            {Object.entries(errorsByField)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([field, count]) => (
                <div
                  key={field}
                  className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded"
                >
                  <span className="text-sm text-gray-700 dark:text-gray-300">{field}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {count}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Export */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <ValidationExport
          validation={validation}
          filename={title.toLowerCase().replace(/\s+/g, "-")}
        />
      </div>
    </div>
  );
}

export default ValidationExport;
