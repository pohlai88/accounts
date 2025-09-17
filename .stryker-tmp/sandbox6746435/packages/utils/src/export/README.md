# DOC-218: Documentation

**Version**: 1.0  
**Date**: 2025-09-17  
**Status**: Active  
**Owner**: Development Team  
**Last Updated**: 2025-09-17  
**Next Review**: 2025-12-17  

---

# Export — Export Management Module

> **TL;DR**: V1 compliance export functionality with CSV, XLSX, JSONL support and comprehensive
> export management system.  
> **Owner**: @aibos/utils-team • **Status**: stable • **Since**: 2024-12  
> **Standards**: CommonMark • SemVer • Conventional Commits • Keep a Changelog

---

## 1) Scope & Boundaries

**Does**:

- CSV, XLSX, and JSONL export functionality
- Export service creation and management
- Export history and statistics tracking
- Scheduled export management
- Export format validation and processing
- V1 compliance export features

**Does NOT**:

- Handle authentication (delegated to @aibos/auth)
- Manage database operations (delegated to @aibos/db)
- Process business logic (delegated to @aibos/accounting)
- Generate financial reports (delegated to @aibos/accounting/src/reports)

**Consumers**: @aibos/accounting, @aibos/web-api, external export systems

## 2) Quick Links

- **Export Functions**: `index.ts`
- **Export Manager**: `export-manager.ts`
- **Export Scheduler**: `export-scheduler.ts`
- **Export Types**: `types.ts`
- **Main Utils**: `../README.md`

## 3) Getting Started

```typescript
import {
  exportToCsv,
  exportToXlsx,
  exportToJsonl,
  createExportService,
  createExportManagerService,
  createExportScheduleService,
} from "@aibos/utils/export";

// Basic CSV export
const csvData = exportToCsv(
  [
    { name: "John", age: 30, city: "New York" },
    { name: "Jane", age: 25, city: "Los Angeles" },
  ],
  { includeHeaders: true },
);

// Create export service
const exportService = createExportService();

// Export to XLSX
const xlsxBuffer = await exportService.exportToXlsx({
  data: [
    { name: "John", age: 30, city: "New York" },
    { name: "Jane", age: 25, city: "Los Angeles" },
  ],
  format: "XLSX",
  options: {
    sheetName: "Users",
    includeHeaders: true,
  },
});
```

## 4) Architecture & Dependencies

**Dependencies**:

- XLSX library for Excel export
- CSV parsing for CSV export
- JSONL processing for JSONL export
- Database client for export management

**Dependents**:

- @aibos/accounting for financial data export
- @aibos/web-api for API export endpoints
- External export systems

**Build Order**: Independent module, can be built alongside other utils modules

## 5) Development Workflow

**Local Dev**:

```bash
pnpm --filter @aibos/utils dev
pnpm --filter @aibos/utils test
```

**Testing**:

```bash
pnpm --filter @aibos/utils test src/export/
```

**Linting**:

```bash
pnpm --filter @aibos/utils lint src/export/
```

**Type Checking**:

```bash
pnpm --filter @aibos/utils typecheck
```

## 6) API Surface

**Exports**:

### Export Functions (`index.ts`)

- `exportToCsv()` - Export data to CSV format
- `exportToXlsx()` - Export data to XLSX format
- `exportToJsonl()` - Export data to JSONL format
- `createExportService()` - Create export service

### Export Manager (`export-manager.ts`)

- `createExportManagerService()` - Create export manager service
- `ExportManagerService` - Export manager service class
- `ExportHistory` - Export history interface
- `ExportStats` - Export statistics interface

### Export Scheduler (`export-scheduler.ts`)

- `createExportScheduleService()` - Create export scheduler service
- `ExportScheduleService` - Export scheduler service class
- `ScheduledExport` - Scheduled export interface
- `ScheduleConfig` - Schedule configuration interface

**Public Types**:

- `ExportFormat` - Export format enum
- `ExportOptions` - Export options interface
- `ExportResult` - Export result interface
- `ReportExportRequest` - Report export request interface
- `ExportableData` - Exportable data interface

**Configuration**:

- Configurable export formats
- Export scheduling options
- Export retention policies

## 7) Performance & Monitoring

**Bundle Size**: ~25KB minified  
**Performance Budget**: <2s for CSV export, <5s for XLSX export, <1s for JSONL export  
**Monitoring**: Axiom telemetry integration for export operations

## 8) Security & Compliance

**Permissions**:

- Export creation requires 'accountant' or 'manager' role
- Export management requires 'manager' or 'admin' role
- Export scheduling requires 'admin' role

**Data Handling**:

- All export data validated and sanitized
- Secure export file generation
- Export access control

**Compliance**:

- V1 compliance for export operations
- SoD enforcement for export access
- Export audit compliance

## 9) Usage Examples

### Basic Export Functions

```typescript
import { exportToCsv, exportToXlsx, exportToJsonl } from "@aibos/utils/export";

// Sample data
const data = [
  { id: 1, name: "John Doe", email: "john@example.com", age: 30 },
  { id: 2, name: "Jane Smith", email: "jane@example.com", age: 25 },
  { id: 3, name: "Bob Johnson", email: "bob@example.com", age: 35 },
];

// Export to CSV
const csvData = exportToCsv(data, {
  includeHeaders: true,
  delimiter: ",",
  quote: '"',
  escape: '"',
});
console.log("CSV export:", csvData);

// Export to XLSX
const xlsxBuffer = await exportToXlsx(data, {
  sheetName: "Users",
  includeHeaders: true,
  columnWidths: { A: 10, B: 20, C: 30, D: 10 },
});
console.log("XLSX export buffer size:", xlsxBuffer.length);

// Export to JSONL
const jsonlData = exportToJsonl(data, {
  includeMetadata: true,
  metadata: {
    exportDate: new Date().toISOString(),
    recordCount: data.length,
  },
});
console.log("JSONL export:", jsonlData);
```

### Export Service Usage

```typescript
import { createExportService } from "@aibos/utils/export";

// Create export service
const exportService = createExportService();

// Export financial data
const financialData = [
  { account: "1000", name: "Cash", balance: 10000.0, type: "ASSET" },
  {
    account: "2000",
    name: "Accounts Payable",
    balance: 5000.0,
    type: "LIABILITY",
  },
  { account: "3000", name: "Revenue", balance: 15000.0, type: "REVENUE" },
];

// Export to different formats
const csvResult = await exportService.exportToCsv({
  data: financialData,
  format: "CSV",
  options: {
    includeHeaders: true,
    delimiter: ",",
  },
});

const xlsxResult = await exportService.exportToXlsx({
  data: financialData,
  format: "XLSX",
  options: {
    sheetName: "Chart of Accounts",
    includeHeaders: true,
    columnWidths: { A: 10, B: 30, C: 15, D: 15 },
  },
});

const jsonlResult = await exportService.exportToJsonl({
  data: financialData,
  format: "JSONL",
  options: {
    includeMetadata: true,
    metadata: {
      exportDate: new Date().toISOString(),
      reportType: "Chart of Accounts",
    },
  },
});

console.log("Export results:", { csvResult, xlsxResult, jsonlResult });
```

### Export Manager Service

```typescript
import { createExportManagerService } from "@aibos/utils/export";

// Create export manager service
const exportManager = createExportManagerService();

// Track export history
const exportHistory = await exportManager.trackExport({
  exportId: "exp-123",
  userId: "user-789",
  format: "XLSX",
  recordCount: 1000,
  fileSize: 50000,
  status: "COMPLETED",
  metadata: {
    reportType: "Trial Balance",
    asOfDate: "2024-01-31",
  },
});

// Get export statistics
const stats = await exportManager.getExportStats({
  userId: "user-789",
  startDate: new Date("2024-01-01"),
  endDate: new Date("2024-01-31"),
});

console.log("Export statistics:", stats);
console.log("Total exports:", stats.totalExports);
console.log("Total records:", stats.totalRecords);
console.log("Total file size:", stats.totalFileSize);

// Get export history
const history = await exportManager.getExportHistory({
  userId: "user-789",
  limit: 10,
  offset: 0,
});

console.log("Export history:", history);
```

### Export Scheduler Service

```typescript
import { createExportScheduleService } from "@aibos/utils/export";

// Create export scheduler service
const exportScheduler = createExportScheduleService();

// Schedule recurring export
const scheduledExport = await exportScheduler.scheduleExport({
  name: "Monthly Trial Balance",
  description: "Monthly trial balance export",
  format: "XLSX",
  schedule: {
    type: "RECURRING",
    cron: "0 0 1 * *", // First day of every month at midnight
    timezone: "UTC",
  },
  dataSource: {
    type: "TRIAL_BALANCE",
    parameters: {
      tenantId: "tenant-123",
      companyId: "company-456",
      asOfDate: "LAST_DAY_OF_MONTH",
    },
  },
  options: {
    includeHeaders: true,
    includeZeroBalances: false,
  },
  createdBy: "user-789",
});

console.log("Scheduled export created:", scheduledExport.id);

// Process scheduled exports
const processedExports = await exportScheduler.processScheduledExports();
console.log("Processed exports:", processedExports.length);

// Get scheduled exports
const scheduledExports = await exportScheduler.getScheduledExports({
  userId: "user-789",
  status: "ACTIVE",
});

console.log("Active scheduled exports:", scheduledExports);
```

### Advanced Export Configuration

```typescript
import { createExportService } from "@aibos/utils/export";

const exportService = createExportService();

// Advanced XLSX export with multiple sheets
const multiSheetData = {
  "Trial Balance": [
    { account: "1000", name: "Cash", balance: 10000.0 },
    { account: "2000", name: "AP", balance: 5000.0 },
  ],
  "Balance Sheet": [
    { section: "Assets", total: 10000.0 },
    { section: "Liabilities", total: 5000.0 },
  ],
};

const multiSheetResult = await exportService.exportToXlsx({
  data: multiSheetData,
  format: "XLSX",
  options: {
    includeHeaders: true,
    columnWidths: { A: 15, B: 30, C: 15 },
    styles: {
      header: { bold: true, backgroundColor: "#f0f0f0" },
      currency: { numFmt: "#,##0.00" },
    },
  },
});

// CSV export with custom formatting
const csvResult = await exportService.exportToCsv({
  data: financialData,
  format: "CSV",
  options: {
    includeHeaders: true,
    delimiter: ";", // Semicolon delimiter
    quote: "'", // Single quote
    escape: "'",
    encoding: "utf-8",
    lineEnding: "\r\n",
  },
});

// JSONL export with custom metadata
const jsonlResult = await exportService.exportToJsonl({
  data: financialData,
  format: "JSONL",
  options: {
    includeMetadata: true,
    metadata: {
      exportDate: new Date().toISOString(),
      reportType: "Trial Balance",
      version: "1.0.0",
      generatedBy: "AIBOS Accounting System",
    },
    prettyPrint: false,
  },
});
```

## 10) Troubleshooting

**Common Issues**:

- **Export Format Not Supported**: Check supported formats and options
- **Data Validation Failed**: Verify data structure and types
- **Export Size Too Large**: Implement pagination or data filtering
- **Scheduling Issues**: Check cron expressions and timezone settings

**Debug Mode**:

```typescript
// Enable detailed logging
process.env.DEBUG_EXPORT = "true";
```

**Logs**: Check Axiom telemetry for export operation logs

## 11) Contributing

**Code Style**:

- Follow TypeScript best practices
- Use descriptive function names
- Implement proper error handling
- Document complex export logic

**Testing**:

- Test all export formats and options
- Test export service functionality
- Test export scheduling
- Test export management

**Review Process**:

- All export operations must be validated
- Export formats must be comprehensive
- Performance must be optimized
- Security must be maintained

---

## 📚 **Additional Resources**

- [Utils Package README](../README.md)
- [Accounting Package](../../accounting/README.md)
- [Web API Package](../../web-api/README.md)
- [Reports Module](../../accounting/src/reports/README.md)

---

**Last Updated**: 2025-09-13 • **Version**: 0.1.0
