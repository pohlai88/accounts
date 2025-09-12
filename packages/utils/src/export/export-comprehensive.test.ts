// Comprehensive tests for export system - V1 compliance: 95% test coverage
import { describe, it, expect, beforeEach } from 'vitest';
import { exportToCsv, exportToXlsx, exportToJsonl } from './exporters';
import { createExportService } from './export-service';
import { ExportFormat, ExportableData, ExportOptions, ReportExportRequest } from './types';

// Mock data for testing
const mockData: ExportableData = {
    headers: ['Account Code', 'Account Name', 'Debit', 'Credit', 'Balance'],
    rows: [
        ['1000', 'Cash and Bank', 50000, 0, 50000],
        ['1200', 'Accounts Receivable', 25000, 0, 25000],
        ['2000', 'Accounts Payable', 0, 25000, -25000],
        ['3000', 'Revenue', 0, 75000, -75000],
        ['4000', 'Expenses', 25000, 0, 25000]
    ],
    metadata: {
        reportType: 'trial-balance',
        generatedAt: '2024-01-15T10:00:00.000Z',
        recordCount: 5
    }
};

const mockExportOptions: ExportOptions = {
    format: ExportFormat.CSV,
    filename: 'test-export.csv',
    includeHeaders: true,
    dateFormat: 'YYYY-MM-DD',
    timezone: 'Asia/Kuala_Lumpur'
};

const mockReportRequest: ReportExportRequest = {
    reportType: 'trial-balance',
    format: ExportFormat.CSV,
    filters: {
        tenantId: 'tenant-123',
        companyId: 'company-456',
        asOfDate: '2024-01-15'
    },
    options: {
        filename: 'trial-balance-export.csv',
        includeHeaders: true
    }
};

describe('CSV Export Tests', () => {
    it('should export data to CSV format with headers', async () => {
        const result = await exportToCsv(mockData, mockExportOptions);

        expect(result.success).toBe(true);
        expect(result.filename).toBe('test-export.csv');
        expect(result.recordCount).toBe(5);
        expect(result.size).toBeGreaterThan(0);
        expect(result.url).toContain('data:text/csv');
    });

    it('should export data to CSV format without headers', async () => {
        const options = { ...mockExportOptions, includeHeaders: false };
        const result = await exportToCsv(mockData, options);

        expect(result.success).toBe(true);
        expect(result.recordCount).toBe(5);

        const csvContent = decodeURIComponent(result.url?.split(',')[1] || '');
        expect(csvContent).not.toContain('Account Code');
        expect(csvContent).toContain('1000');
    });

    it('should handle special characters in CSV export', async () => {
        const dataWithSpecialChars: ExportableData = {
            headers: ['Name', 'Description', 'Amount'],
            rows: [
                ['Company, Inc.', 'Test "quote" handling', 1000],
                ['Line\nBreak Test', 'Comma, test', 2000]
            ]
        };

        const result = await exportToCsv(dataWithSpecialChars, mockExportOptions);

        expect(result.success).toBe(true);
        const csvContent = decodeURIComponent(result.url?.split(',')[1] || '');
        expect(csvContent).toContain('"Company, Inc."');
        expect(csvContent).toContain('"Test ""quote"" handling"');
    });

    it('should include metadata as comments in CSV', async () => {
        const result = await exportToCsv(mockData, mockExportOptions);

        expect(result.success).toBe(true);
        const csvContent = decodeURIComponent(result.url?.split(',')[1] || '');
        expect(csvContent).toContain('# reportType: trial-balance');
        expect(csvContent).toContain('# recordCount: 5');
    });

    it('should handle empty data gracefully', async () => {
        const emptyData: ExportableData = {
            headers: ['Column1', 'Column2'],
            rows: []
        };

        const result = await exportToCsv(emptyData, mockExportOptions);

        expect(result.success).toBe(true);
        expect(result.recordCount).toBe(0);
    });

    it('should handle null and undefined values', async () => {
        const dataWithNulls: ExportableData = {
            headers: ['Name', 'Value', 'Status'],
            rows: [
                ['Test', null, null],
                [null, 100, 'active']
            ]
        };

        const result = await exportToCsv(dataWithNulls, mockExportOptions);

        expect(result.success).toBe(true);
        const csvContent = decodeURIComponent(result.url?.split(',')[1] || '');
        expect(csvContent).toContain('Test,,');
        expect(csvContent).toContain(',100,active');
    });
});

describe('XLSX Export Tests', () => {
    it('should export data to XLSX format', async () => {
        const options = { ...mockExportOptions, format: ExportFormat.XLSX, filename: 'test.xlsx' };
        const result = await exportToXlsx(mockData, options);

        expect(result.success).toBe(true);
        expect(result.filename).toBe('test.xlsx');
        expect(result.recordCount).toBe(5);
        expect(result.size).toBeGreaterThan(0);
        expect(result.url).toContain('data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        expect(result.buffer).toBeDefined();
    });

    it('should handle large datasets efficiently', async () => {
        const largeData: ExportableData = {
            headers: ['ID', 'Name', 'Value'],
            rows: Array.from({ length: 1000 }, (_, i) => [
                i + 1,
                `Item ${i + 1}`,
                Math.random() * 1000
            ])
        };

        const options = { ...mockExportOptions, format: ExportFormat.XLSX };
        const result = await exportToXlsx(largeData, options);

        expect(result.success).toBe(true);
        expect(result.recordCount).toBe(1000);
        expect(result.size).toBeGreaterThan(10000);
    });
});

describe('JSONL Export Tests', () => {
    it('should export data to JSONL format', async () => {
        const options = { ...mockExportOptions, format: ExportFormat.JSONL, filename: 'test.jsonl' };
        const result = await exportToJsonl(mockData, options);

        expect(result.success).toBe(true);
        expect(result.filename).toBe('test.jsonl');
        expect(result.recordCount).toBe(5);
        expect(result.url).toContain('data:application/jsonl');
    });

    it('should include metadata as first line', async () => {
        const options = { ...mockExportOptions, format: ExportFormat.JSONL };
        const result = await exportToJsonl(mockData, options);

        expect(result.success).toBe(true);
        const jsonlContent = decodeURIComponent(result.url?.split(',')[1] || '');
        const lines = jsonlContent.trim().split('\n');

        const metadataLine = JSON.parse(lines[0] || '{}');
        expect(metadataLine._metadata).toBeDefined();
        expect(metadataLine._metadata.reportType).toBe('trial-balance');
    });

    it('should convert rows to proper JSON objects', async () => {
        const options = { ...mockExportOptions, format: ExportFormat.JSONL };
        const result = await exportToJsonl(mockData, options);

        expect(result.success).toBe(true);
        const jsonlContent = decodeURIComponent(result.url?.split(',')[1] || '');
        const lines = jsonlContent.trim().split('\n');

        const firstRecord = JSON.parse(lines[1] || '{}');
        expect(firstRecord['Account Code']).toBe('1000');
        expect(firstRecord['Account Name']).toBe('Cash and Bank');
        expect(firstRecord['Debit']).toBe(50000);
    });
});

describe('Export Service Tests', () => {
    let exportService: ReturnType<typeof createExportService>;

    beforeEach(() => {
        exportService = createExportService();
    });

    it('should export trial balance report', async () => {
        const result = await exportService.exportReport(mockReportRequest);

        expect(result.success).toBe(true);
        expect(result.filename).toContain('trial-balance');
        expect(result.recordCount).toBeGreaterThan(0);
    });

    it('should handle different report types', async () => {
        const requests = [
            { ...mockReportRequest, reportType: 'balance-sheet' as const, options: undefined },
            { ...mockReportRequest, reportType: 'profit-loss' as const, options: undefined },
            { ...mockReportRequest, reportType: 'cash-flow' as const, options: undefined }
        ];

        for (const request of requests) {
            const result = await exportService.exportReport(request);
            expect(result.success).toBe(true);
            expect(result.filename).toContain(request.reportType.replace('-', '_'));
        }
    });

    it('should handle different export formats', async () => {
        const formats = [ExportFormat.CSV, ExportFormat.XLSX, ExportFormat.JSONL];

        for (const format of formats) {
            const request = { ...mockReportRequest, format, options: undefined };
            const result = await exportService.exportReport(request);
            expect(result.success).toBe(true);
            expect(result.filename).toMatch(new RegExp(`\\.${format}$`));
        }
    });

    it('should handle export errors gracefully', async () => {
        const invalidRequest = {
            ...mockReportRequest,
            reportType: 'invalid-report' as 'trial-balance'
        };

        const result = await exportService.exportReport(invalidRequest);

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.recordCount).toBe(0);
    });
});

describe('Error Handling Tests', () => {
    it('should handle malformed data gracefully', async () => {
        const malformedData = {
            headers: null as unknown as string[],
            rows: undefined as unknown as (string | number | boolean | null)[][]
        };

        const result = await exportToCsv(malformedData, mockExportOptions);

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
    });

    it('should handle memory constraints for large exports', async () => {
        const veryLargeData: ExportableData = {
            headers: Array.from({ length: 50 }, (_, i) => `Column${i}`),
            rows: Array.from({ length: 1000 }, () =>
                Array.from({ length: 50 }, () => Math.random().toString())
            )
        };

        const result = await exportToCsv(veryLargeData, mockExportOptions);

        expect(result.success).toBe(true);
        expect(result.recordCount).toBe(1000);
    });
});

describe('Performance Tests', () => {
    it('should export 5,000 records in reasonable time', async () => {
        const largeData: ExportableData = {
            headers: ['ID', 'Name', 'Amount', 'Date', 'Status'],
            rows: Array.from({ length: 5000 }, (_, i) => [
                i + 1,
                `Record ${i + 1}`,
                Math.random() * 10000,
                new Date().toISOString(),
                i % 2 === 0 ? 'active' : 'inactive'
            ])
        };

        const startTime = Date.now();
        const result = await exportToCsv(largeData, mockExportOptions);
        const endTime = Date.now();

        expect(result.success).toBe(true);
        expect(result.recordCount).toBe(5000);
        expect(endTime - startTime).toBeLessThan(3000); // Should complete in under 3 seconds
    });

    it('should handle concurrent exports efficiently', async () => {
        const exportPromises = Array.from({ length: 3 }, (_, i) =>
            exportToCsv(mockData, { ...mockExportOptions, filename: `export-${i}.csv` })
        );

        const results = await Promise.all(exportPromises);

        expect(results).toHaveLength(3);
        results.forEach((result, i) => {
            expect(result.success).toBe(true);
            expect(result.filename).toBe(`export-${i}.csv`);
        });
    });
});
