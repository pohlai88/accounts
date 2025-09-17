// @ts-nocheck
// Export implementations for CSV, XLSX, and JSONL formats
// V1 compliance requirement: Export in CSV/XLSX/JSONL

import * as ExcelJS from "exceljs";
import { ExportableData, ExportOptions, ExportResult } from "./types.js";

/**
 * Export data to CSV format
 */
export async function exportToCsv(
  data: ExportableData,
  options: ExportOptions,
): Promise<ExportResult> {
  try {
    const { headers, rows, metadata } = data;
    const { filename = "export.csv", includeHeaders = true } = options;

    let csvContent = "";

    // Add metadata as comments if present
    if (metadata) {
      for (const [key, value] of Object.entries(metadata)) {
        csvContent += `# ${key}: ${value}\n`;
      }
      csvContent += "\n";
    }

    // Add headers
    if (includeHeaders) {
      csvContent +=
        headers.map(header => `"${String(header).replace(/"/g, '""')}"`).join(",") + "\n";
    }

    // Add data rows
    for (const row of rows) {
      const csvRow = row
        .map(cell => {
          if (cell === null || cell === undefined) {return "";}
          const cellStr = String(cell);
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          if (cellStr.includes(",") || cellStr.includes('"') || cellStr.includes("\n")) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        })
        .join(",");
      csvContent += csvRow + "\n";
    }

    const size = Buffer.from(csvContent, "utf-8").length;

    return {
      success: true,
      filename,
      size,
      recordCount: rows.length,
      url: `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`,
    };
  } catch (error) {
    return {
      success: false,
      filename: options.filename || "export.csv",
      size: 0,
      recordCount: 0,
      error: error instanceof Error ? error.message : "Unknown export error",
    };
  }
}

/**
 * Export data to XLSX format using the xlsx library
 * V1 compliance: Professional Excel export with proper formatting
 */
export async function exportToXlsx(
  data: ExportableData,
  options: ExportOptions,
): Promise<ExportResult> {
  try {
    const { headers, rows, metadata } = data;
    const { filename = "export.xlsx", includeHeaders = true } = options;

    // Create a new workbook
    const workbook = new ExcelJS.Workbook();

    // Add main data worksheet
    const sheetName = getSheetName(options.metadata?.reportType as string);
    const worksheet = workbook.addWorksheet(sheetName);

    // Add headers if requested
    if (includeHeaders) {
      worksheet.addRow(headers);

      // Style header row
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF366092" },
      };
      headerRow.alignment = { horizontal: "center", vertical: "middle" };
    }

    // Add data rows
    rows.forEach(row => {
      worksheet.addRow(row);
    });

    // Set column widths based on content
    worksheet.columns.forEach((column, index) => {
      let maxWidth = 10; // minimum width

      // Check header width
      if (includeHeaders && headers[index]) {
        maxWidth = Math.max(maxWidth, String(headers[index]).length);
      }

      // Check data widths
      const dataStartRow = includeHeaders ? 2 : 1;
      for (let rowIndex = dataStartRow; rowIndex <= worksheet.rowCount; rowIndex++) {
        const cellValue = worksheet.getRow(rowIndex).getCell(index + 1).value;
        if (cellValue !== null && cellValue !== undefined) {
          maxWidth = Math.max(maxWidth, String(cellValue).length);
        }
      }

      column.width = Math.min(maxWidth + 2, 50); // cap at 50 characters
    });

    // Add metadata sheet if available
    if (metadata && Object.keys(metadata).length > 0) {
      const metadataSheet = workbook.addWorksheet("Metadata");
      metadataSheet.addRow(["Property", "Value"]);
      Object.entries(metadata).forEach(([key, value]) => {
        metadataSheet.addRow([
          key,
          typeof value === "object" ? JSON.stringify(value) : String(value),
        ]);
      });
    }

    // Generate Excel file buffer
    const excelBuffer = (await workbook.xlsx.writeBuffer()) as unknown as Buffer;

    const size = excelBuffer.length;
    const base64Data = excelBuffer.toString("base64");

    return {
      success: true,
      filename,
      size,
      recordCount: rows.length,
      url: `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64Data}`,
      buffer: excelBuffer,
    };
  } catch (error) {
    return {
      success: false,
      filename: options.filename || "export.xlsx",
      size: 0,
      recordCount: 0,
      error: error instanceof Error ? error.message : "XLSX export failed",
    };
  }
}

/**
 * Export data to JSONL format (JSON Lines)
 */
export async function exportToJsonl(
  data: ExportableData,
  options: ExportOptions,
): Promise<ExportResult> {
  try {
    const { headers, rows, metadata } = data;
    const { filename = "export.jsonl" } = options;

    let jsonlContent = "";

    // Add metadata as first line if present
    if (metadata) {
      jsonlContent += JSON.stringify({ _metadata: metadata }) + "\n";
    }

    // Convert rows to JSON objects
    for (const row of rows) {
      const record: Record<string, unknown> = {};
      headers.forEach((header, index) => {
        record[header] = row[index];
      });
      jsonlContent += JSON.stringify(record) + "\n";
    }

    const size = Buffer.from(jsonlContent, "utf-8").length;

    return {
      success: true,
      filename,
      size,
      recordCount: rows.length,
      url: `data:application/jsonl;charset=utf-8,${encodeURIComponent(jsonlContent)}`,
    };
  } catch (error) {
    return {
      success: false,
      filename: options.filename || "export.jsonl",
      size: 0,
      recordCount: 0,
      error: error instanceof Error ? error.message : "Unknown export error",
    };
  }
}

/**
 * Get appropriate sheet name based on report type
 */
function getSheetName(reportType?: string): string {
  switch (reportType) {
    case "trial-balance":
      return "Trial Balance";
    case "balance-sheet":
      return "Balance Sheet";
    case "profit-loss":
      return "Profit & Loss";
    case "cash-flow":
      return "Cash Flow";
    default:
      return "Financial Report";
  }
}

/**
 * Enhanced CSV export with better formatting and options
 */
export async function exportToCsvEnhanced(
  data: ExportableData,
  options: ExportOptions,
): Promise<ExportResult> {
  try {
    const { headers, rows, metadata } = data;
    const {
      filename = "export.csv",
      includeHeaders = true,
      dateFormat = "YYYY-MM-DD",
      timezone = "Asia/Kuala_Lumpur",
    } = options;

    let csvContent = "";

    // Add metadata as comments if present
    if (metadata) {
      csvContent += `# Generated: ${new Date().toLocaleString("en-MY", { timeZone: timezone })}\n`;
      for (const [key, value] of Object.entries(metadata)) {
        if (key !== "generatedAt") {
          csvContent += `# ${key}: ${value}\n`;
        }
      }
      csvContent += "\n";
    }

    // Add headers
    if (includeHeaders) {
      csvContent += headers.map(header => formatCsvCell(String(header))).join(",") + "\n";
    }

    // Add data rows with proper formatting
    for (const row of rows) {
      const csvRow = row
        .map(cell => {
          if (cell === null || cell === undefined) {return "";}

          // Format dates if dateFormat is specified
          if (typeof cell === "object" && cell !== null && "getTime" in cell) {
            return formatCsvCell(formatDate(cell as Date, dateFormat, timezone));
          }

          // Format numbers with proper precision
          if (typeof cell === "number") {
            return isInteger(cell) ? cell.toString() : cell.toFixed(2);
          }

          return formatCsvCell(String(cell));
        })
        .join(",");
      csvContent += csvRow + "\n";
    }

    const size = Buffer.from(csvContent, "utf-8").length;

    return {
      success: true,
      filename,
      size,
      recordCount: rows.length,
      url: `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`,
    };
  } catch (error) {
    return {
      success: false,
      filename: options.filename || "export.csv",
      size: 0,
      recordCount: 0,
      error: error instanceof Error ? error.message : "CSV export failed",
    };
  }
}

/**
 * Format a cell value for CSV export
 */
function formatCsvCell(value: string): string {
  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  if (value.includes(",") || value.includes('"') || value.includes("\n") || value.includes("\r")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Format date according to specified format and timezone
 */
function formatDate(date: Date, format: string, timezone: string): string {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  };

  if (format.includes("HH") || format.includes("mm")) {
    options.hour = "2-digit";
    options.minute = "2-digit";
    options.hour12 = false;
  }

  return date.toLocaleDateString("en-CA", options); // en-CA gives YYYY-MM-DD format
}

/**
 * Check if a number is an integer
 */
function isInteger(value: number): boolean {
  return Number.isInteger(value);
}
