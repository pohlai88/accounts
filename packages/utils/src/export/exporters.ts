// Export implementations for CSV, XLSX, and JSONL formats
// V1 compliance requirement: Export in CSV/XLSX/JSONL

import * as XLSX from 'xlsx';
import { ExportableData, ExportOptions, ExportResult } from './types';

/**
 * Export data to CSV format
 */
export async function exportToCsv(
  data: ExportableData,
  options: ExportOptions
): Promise<ExportResult> {
  try {
    const { headers, rows, metadata } = data;
    const { filename = 'export.csv', includeHeaders = true } = options;

    let csvContent = '';

    // Add metadata as comments if present
    if (metadata) {
      for (const [key, value] of Object.entries(metadata)) {
        csvContent += `# ${key}: ${value}\n`;
      }
      csvContent += '\n';
    }

    // Add headers
    if (includeHeaders) {
      csvContent += headers.map(header => `"${String(header).replace(/"/g, '""')}"`).join(',') + '\n';
    }

    // Add data rows
    for (const row of rows) {
      const csvRow = row.map(cell => {
        if (cell === null || cell === undefined) return '';
        const cellStr = String(cell);
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(',');
      csvContent += csvRow + '\n';
    }

    const size = Buffer.from(csvContent, 'utf-8').length;

    return {
      success: true,
      filename,
      size,
      recordCount: rows.length,
      url: `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`
    };
  } catch (error) {
    return {
      success: false,
      filename: options.filename || 'export.csv',
      size: 0,
      recordCount: 0,
      error: error instanceof Error ? error.message : 'Unknown export error'
    };
  }
}

/**
 * Export data to XLSX format using the xlsx library
 * V1 compliance: Professional Excel export with proper formatting
 */
export async function exportToXlsx(
  data: ExportableData,
  options: ExportOptions
): Promise<ExportResult> {
  try {
    const { headers, rows, metadata } = data;
    const { filename = 'export.xlsx', includeHeaders = true } = options;

    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Prepare worksheet data
    const worksheetData: (string | number | boolean | null)[][] = [];

    // Add headers if requested
    if (includeHeaders) {
      worksheetData.push(headers);
    }

    // Add data rows
    worksheetData.push(...rows);

    // Create worksheet from data
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Apply formatting and styling
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');

    // Set column widths based on content
    const columnWidths: { wch: number }[] = [];
    for (let col = range.s.c; col <= range.e.c; col++) {
      let maxWidth = 10; // minimum width

      // Check header width
      if (includeHeaders && headers[col]) {
        maxWidth = Math.max(maxWidth, String(headers[col]).length);
      }

      // Check data widths
      for (let row = includeHeaders ? 1 : 0; row < worksheetData.length; row++) {
        const cellValue = worksheetData[row]?.[col];
        if (cellValue !== null && cellValue !== undefined) {
          maxWidth = Math.max(maxWidth, String(cellValue).length);
        }
      }

      columnWidths.push({ wch: Math.min(maxWidth + 2, 50) }); // cap at 50 characters
    }
    worksheet['!cols'] = columnWidths;

    // Style headers if present
    if (includeHeaders) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (worksheet[cellAddress]) {
          worksheet[cellAddress].s = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "366092" } },
            alignment: { horizontal: "center", vertical: "center" },
            border: {
              top: { style: "thin", color: { rgb: "000000" } },
              bottom: { style: "thin", color: { rgb: "000000" } },
              left: { style: "thin", color: { rgb: "000000" } },
              right: { style: "thin", color: { rgb: "000000" } }
            }
          };
        }
      }
    }

    // Add metadata as a separate sheet if present
    if (metadata && Object.keys(metadata).length > 0) {
      const metadataData = Object.entries(metadata).map(([key, value]) => [
        key,
        typeof value === 'object' ? JSON.stringify(value) : String(value)
      ]);
      metadataData.unshift(['Property', 'Value']); // headers

      const metadataWorksheet = XLSX.utils.aoa_to_sheet(metadataData);
      XLSX.utils.book_append_sheet(workbook, metadataWorksheet, 'Metadata');
    }

    // Add main data sheet
    const sheetName = getSheetName(options.metadata?.reportType as string);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate Excel file buffer
    const excelBuffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
      compression: true
    });

    const size = excelBuffer.length;
    const base64Data = excelBuffer.toString('base64');

    return {
      success: true,
      filename,
      size,
      recordCount: rows.length,
      url: `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64Data}`,
      buffer: excelBuffer
    };
  } catch (error) {
    return {
      success: false,
      filename: options.filename || 'export.xlsx',
      size: 0,
      recordCount: 0,
      error: error instanceof Error ? error.message : 'XLSX export failed'
    };
  }
}

/**
 * Export data to JSONL format (JSON Lines)
 */
export async function exportToJsonl(
  data: ExportableData,
  options: ExportOptions
): Promise<ExportResult> {
  try {
    const { headers, rows, metadata } = data;
    const { filename = 'export.jsonl' } = options;

    let jsonlContent = '';

    // Add metadata as first line if present
    if (metadata) {
      jsonlContent += JSON.stringify({ _metadata: metadata }) + '\n';
    }

    // Convert rows to JSON objects
    for (const row of rows) {
      const record: Record<string, unknown> = {};
      headers.forEach((header, index) => {
        record[header] = row[index];
      });
      jsonlContent += JSON.stringify(record) + '\n';
    }

    const size = Buffer.from(jsonlContent, 'utf-8').length;

    return {
      success: true,
      filename,
      size,
      recordCount: rows.length,
      url: `data:application/jsonl;charset=utf-8,${encodeURIComponent(jsonlContent)}`
    };
  } catch (error) {
    return {
      success: false,
      filename: options.filename || 'export.jsonl',
      size: 0,
      recordCount: 0,
      error: error instanceof Error ? error.message : 'Unknown export error'
    };
  }
}

/**
 * Get appropriate sheet name based on report type
 */
function getSheetName(reportType?: string): string {
  switch (reportType) {
    case 'trial-balance': return 'Trial Balance';
    case 'balance-sheet': return 'Balance Sheet';
    case 'profit-loss': return 'Profit & Loss';
    case 'cash-flow': return 'Cash Flow';
    default: return 'Financial Report';
  }
}

/**
 * Enhanced CSV export with better formatting and options
 */
export async function exportToCsvEnhanced(
  data: ExportableData,
  options: ExportOptions
): Promise<ExportResult> {
  try {
    const { headers, rows, metadata } = data;
    const {
      filename = 'export.csv',
      includeHeaders = true,
      dateFormat = 'YYYY-MM-DD',
      timezone = 'Asia/Kuala_Lumpur'
    } = options;

    let csvContent = '';

    // Add metadata as comments if present
    if (metadata) {
      csvContent += `# Generated: ${new Date().toLocaleString('en-MY', { timeZone: timezone })}\n`;
      for (const [key, value] of Object.entries(metadata)) {
        if (key !== 'generatedAt') {
          csvContent += `# ${key}: ${value}\n`;
        }
      }
      csvContent += '\n';
    }

    // Add headers
    if (includeHeaders) {
      csvContent += headers.map(header => formatCsvCell(String(header))).join(',') + '\n';
    }

    // Add data rows with proper formatting
    for (const row of rows) {
      const csvRow = row.map(cell => {
        if (cell === null || cell === undefined) return '';

        // Format dates if dateFormat is specified
        if (typeof cell === 'object' && cell !== null && 'getTime' in cell) {
          return formatCsvCell(formatDate(cell as Date, dateFormat, timezone));
        }

        // Format numbers with proper precision
        if (typeof cell === 'number') {
          return isInteger(cell) ? cell.toString() : cell.toFixed(2);
        }

        return formatCsvCell(String(cell));
      }).join(',');
      csvContent += csvRow + '\n';
    }

    const size = Buffer.from(csvContent, 'utf-8').length;

    return {
      success: true,
      filename,
      size,
      recordCount: rows.length,
      url: `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`
    };
  } catch (error) {
    return {
      success: false,
      filename: options.filename || 'export.csv',
      size: 0,
      recordCount: 0,
      error: error instanceof Error ? error.message : 'CSV export failed'
    };
  }
}

/**
 * Format a cell value for CSV export
 */
function formatCsvCell(value: string): string {
  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
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
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  };

  if (format.includes('HH') || format.includes('mm')) {
    options.hour = '2-digit';
    options.minute = '2-digit';
    options.hour12 = false;
  }

  return date.toLocaleDateString('en-CA', options); // en-CA gives YYYY-MM-DD format
}

/**
 * Check if a number is an integer
 */
function isInteger(value: number): boolean {
  return Number.isInteger(value);
}
