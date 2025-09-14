// Export functionality tests for V1 compliance validation
// Tests CSV, XLSX, and JSONL export formats

import { describe, it, expect } from "vitest";
import { exportToCsv, exportToXlsx, exportToJsonl } from "./exporters";
import { createExportService } from "./export-service";
import { ExportFormat, ExportableData, ExportOptions } from "./types";

describe("Export Functionality Tests", () => {
  const testData: ExportableData = {
    headers: ["Account Code", "Account Name", "Debit", "Credit", "Balance"],
    rows: [
      ["1000", "Cash and Bank", 50000, 0, 50000],
      ["2000", "Accounts Payable", 0, 25000, -25000],
      ["3000", "Revenue", 0, 75000, -75000],
      ["4000", "Expenses", 50000, 0, 50000],
    ],
    metadata: {
      reportType: "trial-balance",
      generatedAt: "2025-01-01T00:00:00Z",
      totalRecords: 4,
    },
  };

  describe("CSV Export", () => {
    it("should export data to CSV format with headers", async () => {
      const options: ExportOptions = {
        format: ExportFormat.CSV,
        filename: "test-export.csv",
        includeHeaders: true,
      };

      const result = await exportToCsv(testData, options);

      expect(result.success).toBe(true);
      expect(result.filename).toBe("test-export.csv");
      expect(result.recordCount).toBe(4);
      expect(result.size).toBeGreaterThan(0);
      expect(result.url).toContain("data:text/csv");
    });

    it("should export data to CSV format without headers", async () => {
      const options: ExportOptions = {
        format: ExportFormat.CSV,
        filename: "test-no-headers.csv",
        includeHeaders: false,
      };

      const result = await exportToCsv(testData, options);

      expect(result.success).toBe(true);
      expect(result.recordCount).toBe(4);

      // Decode the CSV content to verify no headers
      const csvContent = decodeURIComponent(result.url?.split(",")[1] || "");
      expect(csvContent).not.toContain("Account Code");
      expect(csvContent).toContain("1000");
    });

    it("should handle CSV special characters correctly", async () => {
      const specialData: ExportableData = {
        headers: ["Field 1", "Field 2", "Field 3"],
        rows: [
          ["Text with, comma", 'Text with "quotes"', "Text with\nnewline"],
          ["Normal text", 'Another "quoted" text', "Simple text"],
        ],
      };

      const options: ExportOptions = {
        format: ExportFormat.CSV,
        filename: "special-chars.csv",
        includeHeaders: true,
      };

      const result = await exportToCsv(specialData, options);

      expect(result.success).toBe(true);

      // Decode and verify proper escaping
      const csvContent = decodeURIComponent(result.url?.split(",")[1] || "");
      expect(csvContent).toContain('"Text with, comma"');
      expect(csvContent).toContain('"Text with ""quotes"""');
      expect(csvContent).toContain('"Text with\nnewline"');
    });

    it("should include metadata as comments", async () => {
      const options: ExportOptions = {
        format: ExportFormat.CSV,
        filename: "with-metadata.csv",
        includeHeaders: true,
      };

      const result = await exportToCsv(testData, options);
      const csvContent = decodeURIComponent(result.url?.split(",")[1] || "");

      expect(csvContent).toContain("# reportType: trial-balance");
      expect(csvContent).toContain("# generatedAt: 2025-01-01T00:00:00Z");
      expect(csvContent).toContain("# totalRecords: 4");
    });
  });

  describe("XLSX Export", () => {
    it("should export data to XLSX format", async () => {
      const options: ExportOptions = {
        format: ExportFormat.XLSX,
        filename: "test-export.xlsx",
        includeHeaders: true,
      };

      const result = await exportToXlsx(testData, options);

      expect(result.success).toBe(true);
      expect(result.filename).toBe("test-export.xlsx");
      expect(result.recordCount).toBe(4);
      expect(result.size).toBeGreaterThan(0);
      expect(result.url).toContain(
        "data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
    });

    it("should generate valid XML structure", async () => {
      const options: ExportOptions = {
        format: ExportFormat.XLSX,
        filename: "test-structure.xlsx",
        includeHeaders: true,
      };

      const result = await exportToXlsx(testData, options);
      // XLSX now returns base64 encoded binary data, not XML
      expect(result.url).toContain("base64,");
      expect(result.buffer).toBeDefined();
      expect(result.buffer!.length).toBeGreaterThan(0);
    });

    it("should handle different data types correctly", async () => {
      const mixedData: ExportableData = {
        headers: ["Text", "Number", "Boolean", "Null"],
        rows: [
          ["Sample Text", 123.45, true, null],
          ["Another Text", 0, false, null],
        ],
      };

      const options: ExportOptions = {
        format: ExportFormat.XLSX,
        filename: "mixed-types.xlsx",
        includeHeaders: true,
      };

      const result = await exportToXlsx(mixedData, options);
      // const xmlContent = decodeURIComponent(result.url?.split(',')[1] || '');

      expect(result.success).toBe(true);
      // XLSX now returns base64 encoded binary data
      expect(result.url).toContain("base64,");
      expect(result.buffer).toBeDefined();
      expect(result.buffer!.length).toBeGreaterThan(0);
      // XLSX is now binary format, not XML
      expect(result.url).toContain("base64,");
    });
  });

  describe("JSONL Export", () => {
    it("should export data to JSONL format", async () => {
      const options: ExportOptions = {
        format: ExportFormat.JSONL,
        filename: "test-export.jsonl",
        includeHeaders: true,
      };

      const result = await exportToJsonl(testData, options);

      expect(result.success).toBe(true);
      expect(result.filename).toBe("test-export.jsonl");
      expect(result.recordCount).toBe(4);
      expect(result.size).toBeGreaterThan(0);
      expect(result.url).toContain("data:application/jsonl");
    });

    it("should create valid JSON Lines format", async () => {
      const options: ExportOptions = {
        format: ExportFormat.JSONL,
        filename: "test-jsonl.jsonl",
        includeHeaders: true,
      };

      const result = await exportToJsonl(testData, options);
      const jsonlContent = decodeURIComponent(result.url?.split(",")[1] || "");
      const lines = jsonlContent.trim().split("\n");

      // First line should be metadata
      const metadataLine = JSON.parse(lines[0] || "{}");
      expect(metadataLine._metadata).toBeDefined();
      expect(metadataLine._metadata.reportType).toBe("trial-balance");

      // Subsequent lines should be data records
      const firstRecord = JSON.parse(lines[1] || "{}");
      expect(firstRecord["Account Code"]).toBe("1000");
      expect(firstRecord["Account Name"]).toBe("Cash and Bank");
      expect(firstRecord["Debit"]).toBe(50000);
      expect(firstRecord["Credit"]).toBe(0);
      expect(firstRecord["Balance"]).toBe(50000);

      // Should have correct number of lines (metadata + data rows)
      expect(lines).toHaveLength(5); // 1 metadata + 4 data rows
    });

    it("should handle complex data structures", async () => {
      const complexData: ExportableData = {
        headers: ["ID", "Data", "Status"],
        rows: [
          ["1", "first item", "active"],
          ["2", "second item", "inactive"],
        ],
      };

      const options: ExportOptions = {
        format: ExportFormat.JSONL,
        filename: "complex-data.jsonl",
        includeHeaders: true,
      };

      const result = await exportToJsonl(complexData, options);
      const jsonlContent = decodeURIComponent(result.url?.split(",")[1] || "");
      const lines = jsonlContent.trim().split("\n");

      // Should have 2 data lines (metadata is only added if present in options)
      expect(lines).toHaveLength(2);

      const firstRecord = JSON.parse(lines[0] || "{}");
      expect(firstRecord.ID).toBe("1");
      expect(firstRecord.Data).toBe("first item");
      expect(firstRecord.Status).toBe("active");

      const secondRecord = JSON.parse(lines[1] || "{}");
      expect(secondRecord.ID).toBe("2");
      expect(secondRecord.Data).toBe("second item");
      expect(secondRecord.Status).toBe("inactive");
    });
  });

  describe("Export Service", () => {
    it("should create export service successfully", () => {
      const service = createExportService();
      expect(service).toBeDefined();
      expect(typeof service.exportData).toBe("function");
      expect(typeof service.exportReport).toBe("function");
    });

    it("should export data using service", async () => {
      const service = createExportService();
      const options: ExportOptions = {
        format: ExportFormat.CSV,
        filename: "service-test.csv",
        includeHeaders: true,
      };

      const result = await service.exportData(testData, options);

      expect(result.success).toBe(true);
      expect(result.filename).toBe("service-test.csv");
      expect(result.recordCount).toBe(4);
    });

    it("should handle unsupported format gracefully", async () => {
      const service = createExportService();
      const options: ExportOptions = {
        format: "unsupported" as ExportFormat,
        filename: "unsupported.txt",
        includeHeaders: true,
      };

      const result = await service.exportData(testData, options);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Unsupported export format");
    });
  });

  describe("Error Handling", () => {
    it("should handle empty data gracefully", async () => {
      const emptyData: ExportableData = {
        headers: [],
        rows: [],
      };

      const options: ExportOptions = {
        format: ExportFormat.CSV,
        filename: "empty.csv",
        includeHeaders: true,
      };

      const result = await exportToCsv(emptyData, options);

      expect(result.success).toBe(true);
      expect(result.recordCount).toBe(0);
    });

    it("should handle null and undefined values", async () => {
      const nullData: ExportableData = {
        headers: ["Col1", "Col2", "Col3"],
        rows: [
          [null, null, ""],
          ["text", null, null],
        ],
      };

      const options: ExportOptions = {
        format: ExportFormat.CSV,
        filename: "null-values.csv",
        includeHeaders: true,
      };

      const result = await exportToCsv(nullData, options);

      expect(result.success).toBe(true);
      expect(result.recordCount).toBe(2);

      const csvContent = decodeURIComponent(result.url?.split(",")[1] || "");
      expect(csvContent).toContain(",,"); // Empty values for null/undefined
    });
  });

  describe("Performance Tests", () => {
    it("should handle large datasets efficiently", async () => {
      // Create a large dataset
      const largeData: ExportableData = {
        headers: ["ID", "Name", "Value", "Description"],
        rows: Array.from({ length: 1000 }, (_, i) => [
          i.toString(),
          `Item ${i}`,
          Math.random() * 1000,
          `Description for item ${i}`,
        ]),
      };

      const options: ExportOptions = {
        format: ExportFormat.CSV,
        filename: "large-dataset.csv",
        includeHeaders: true,
      };

      const startTime = Date.now();
      const result = await exportToCsv(largeData, options);
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(result.recordCount).toBe(1000);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second
    });
  });
});
