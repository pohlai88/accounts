# Storage — Storage Utilities Module

> **TL;DR**: V1 compliance storage utilities with file management, storage abstraction, and
> comprehensive storage operations.  
> **Owner**: @aibos/utils-team • **Status**: stable • **Since**: 2024-12  
> **Standards**: CommonMark • SemVer • Conventional Commits • Keep a Changelog

---

## 1) Scope & Boundaries

**Does**:

- File storage and management
- Storage abstraction layer
- File upload and download operations
- Storage metadata management
- V1 compliance storage features
- Storage security and access control

**Does NOT**:

- Handle authentication (delegated to @aibos/auth)
- Manage database operations (delegated to @aibos/db)
- Process business logic (delegated to @aibos/accounting)
- Generate financial reports (delegated to @aibos/accounting/src/reports)

**Consumers**: @aibos/web, @aibos/web-api, @aibos/accounting, external storage systems

## 2) Quick Links

- **Storage Service**: `storage.ts`
- **Main Utils**: `../README.md`
- **Context Module**: `../context/README.md`
- **Audit Module**: `../audit/README.md`

## 3) Getting Started

```typescript
import {
  storageService,
  uploadFile,
  downloadFile,
  deleteFile,
  listFiles,
  getFileMetadata,
} from '@aibos/utils/storage';

// Upload file
const uploadResult = await uploadFile({
  file: fileBuffer,
  fileName: 'document.pdf',
  contentType: 'application/pdf',
  metadata: {
    tenantId: 'tenant-123',
    companyId: 'company-456',
    userId: 'user-789',
  },
});

// Download file
const fileData = await downloadFile(uploadResult.fileId);

// List files
const files = await listFiles({
  tenantId: 'tenant-123',
  companyId: 'company-456',
  userId: 'user-789',
});
```

## 4) Architecture & Dependencies

**Dependencies**:

- Supabase Storage for file storage
- Context management for storage context
- Audit service for storage logging

**Dependents**:

- @aibos/web for frontend file operations
- @aibos/web-api for API file operations
- @aibos/accounting for document storage

**Build Order**: After context and audit modules, before web integration

## 5) Development Workflow

**Local Dev**:

```bash
pnpm --filter @aibos/utils dev
pnpm --filter @aibos/utils test
```

**Testing**:

```bash
pnpm --filter @aibos/utils test src/storage/
```

**Linting**:

```bash
pnpm --filter @aibos/utils lint src/storage/
```

**Type Checking**:

```bash
pnpm --filter @aibos/utils typecheck
```

## 6) API Surface

**Exports**:

### Storage Service (`storage.ts`)

- `storageService` - Main storage service instance
- `uploadFile()` - Upload file function
- `downloadFile()` - Download file function
- `deleteFile()` - Delete file function
- `listFiles()` - List files function
- `getFileMetadata()` - Get file metadata function

**Public Types**:

- `StorageFile` - Storage file interface
- `FileMetadata` - File metadata interface
- `UploadOptions` - Upload options interface
- `DownloadOptions` - Download options interface
- `ListOptions` - List options interface

**Configuration**:

- Configurable storage providers
- File size limits and validation
- Storage security policies

## 7) Performance & Monitoring

**Bundle Size**: ~8KB minified  
**Performance Budget**: <2s for file upload, <1s for file download  
**Monitoring**: Axiom telemetry integration for storage operations

## 8) Security & Compliance

**Permissions**:

- File upload requires 'accountant' or 'manager' role
- File download requires 'accountant' or 'manager' role
- File deletion requires 'manager' or 'admin' role

**Data Handling**:

- All file data validated and sanitized
- Secure file access control
- Audit trail for storage operations

**Compliance**:

- V1 compliance for storage operations
- SoD enforcement for storage access
- Security audit compliance

## 9) Usage Examples

### Basic File Operations

```typescript
import { uploadFile, downloadFile, deleteFile, listFiles } from '@aibos/utils/storage';

// Upload file
const uploadResult = await uploadFile({
  file: fileBuffer,
  fileName: 'journal-entry.pdf',
  contentType: 'application/pdf',
  metadata: {
    tenantId: 'tenant-123',
    companyId: 'company-456',
    userId: 'user-789',
    journalId: 'journal-123',
    documentType: 'JOURNAL_ENTRY',
  },
});

console.log('File uploaded:', uploadResult.fileId);
console.log('File URL:', uploadResult.url);

// Download file
const fileData = await downloadFile(uploadResult.fileId);
console.log('File downloaded:', fileData.length, 'bytes');

// List files
const files = await listFiles({
  tenantId: 'tenant-123',
  companyId: 'company-456',
  userId: 'user-789',
  documentType: 'JOURNAL_ENTRY',
});

console.log('Files found:', files.length);
for (const file of files) {
  console.log(`- ${file.fileName} (${file.fileSize} bytes)`);
}

// Delete file
await deleteFile(uploadResult.fileId);
console.log('File deleted');
```

### Advanced File Management

```typescript
import { storageService } from '@aibos/utils/storage';

// Upload with advanced options
const uploadResult = await storageService.uploadFile({
  file: fileBuffer,
  fileName: 'financial-report.xlsx',
  contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  metadata: {
    tenantId: 'tenant-123',
    companyId: 'company-456',
    userId: 'user-789',
    reportType: 'BALANCE_SHEET',
    reportDate: '2024-01-31',
    isPublic: false,
    retentionDays: 2555, // 7 years
  },
  options: {
    compress: true,
    encrypt: true,
    generateThumbnail: false,
  },
});

// Get file metadata
const metadata = await storageService.getFileMetadata(uploadResult.fileId);
console.log('File metadata:', metadata);
console.log('File size:', metadata.fileSize);
console.log('Upload date:', metadata.uploadDate);
console.log('Retention until:', metadata.retentionDate);

// Update file metadata
await storageService.updateFileMetadata(uploadResult.fileId, {
  description: 'Monthly Balance Sheet Report',
  tags: ['financial', 'report', 'balance-sheet'],
  isPublic: false,
});

// Search files
const searchResults = await storageService.searchFiles({
  tenantId: 'tenant-123',
  companyId: 'company-456',
  query: 'balance sheet',
  fileTypes: ['xlsx', 'pdf'],
  dateRange: {
    start: new Date('2024-01-01'),
    end: new Date('2024-01-31'),
  },
});

console.log('Search results:', searchResults.length);
```

### File Access Control

```typescript
import { storageService } from '@aibos/utils/storage';

// Set file permissions
await storageService.setFilePermissions(uploadResult.fileId, {
  owner: 'user-789',
  permissions: {
    read: ['user-789', 'manager-123'],
    write: ['user-789'],
    delete: ['admin-456'],
  },
});

// Check file access
const hasAccess = await storageService.checkFileAccess(uploadResult.fileId, 'user-789', 'read');
console.log('User has read access:', hasAccess);

// Generate signed URL for secure access
const signedUrl = await storageService.generateSignedUrl(uploadResult.fileId, {
  expiresIn: 3600, // 1 hour
  permissions: ['read'],
});

console.log('Signed URL:', signedUrl);
```

### File Processing and Validation

```typescript
import { storageService } from '@aibos/utils/storage';

// Upload with validation
const uploadResult = await storageService.uploadFile({
  file: fileBuffer,
  fileName: 'invoice.pdf',
  contentType: 'application/pdf',
  metadata: {
    tenantId: 'tenant-123',
    companyId: 'company-456',
    userId: 'user-789',
    documentType: 'INVOICE',
  },
  validation: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    scanForViruses: true,
    validateContent: true,
  },
});

// Process file (OCR, text extraction, etc.)
const processingResult = await storageService.processFile(uploadResult.fileId, {
  operations: ['ocr', 'text-extraction', 'metadata-extraction'],
  options: {
    language: 'en',
    confidence: 0.8,
  },
});

console.log('Processing result:', processingResult);
console.log('Extracted text:', processingResult.extractedText);
console.log('OCR confidence:', processingResult.ocrConfidence);
```

### Storage Analytics and Reporting

```typescript
import { storageService } from '@aibos/utils/storage';

// Get storage usage statistics
const usageStats = await storageService.getUsageStats({
  tenantId: 'tenant-123',
  companyId: 'company-456',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-31'),
});

console.log('Storage usage:', usageStats);
console.log('Total files:', usageStats.totalFiles);
console.log('Total size:', usageStats.totalSize);
console.log('Storage by type:', usageStats.byFileType);

// Get file access analytics
const accessAnalytics = await storageService.getAccessAnalytics({
  tenantId: 'tenant-123',
  companyId: 'company-456',
  timeRange: '30d',
});

console.log('Access analytics:', accessAnalytics);
console.log('Most accessed files:', accessAnalytics.mostAccessed);
console.log('Access patterns:', accessAnalytics.patterns);

// Generate storage report
const storageReport = await storageService.generateStorageReport({
  tenantId: 'tenant-123',
  companyId: 'company-456',
  reportType: 'COMPLIANCE',
  includeDeleted: false,
});

console.log('Storage report:', storageReport);
```

### File Backup and Recovery

```typescript
import { storageService } from '@aibos/utils/storage';

// Create file backup
const backupResult = await storageService.createBackup(uploadResult.fileId, {
  backupType: 'FULL',
  retentionDays: 2555, // 7 years
  encryption: true,
});

console.log('Backup created:', backupResult.backupId);

// Restore file from backup
const restoreResult = await storageService.restoreFromBackup(backupResult.backupId, {
  targetFileId: 'new-file-id',
  preserveMetadata: true,
});

console.log('File restored:', restoreResult.fileId);

// List file backups
const backups = await storageService.listFileBackups(uploadResult.fileId);
console.log('File backups:', backups.length);

// Delete old backups
await storageService.cleanupBackups({
  olderThan: new Date('2023-01-01'),
  dryRun: false,
});
```

## 10) Troubleshooting

**Common Issues**:

- **File Upload Failed**: Check file size limits and validation rules
- **File Download Failed**: Verify file permissions and access control
- **Storage Quota Exceeded**: Implement storage cleanup and archiving
- **File Access Denied**: Check user permissions and file ownership

**Debug Mode**:

```typescript
// Enable detailed logging
process.env.DEBUG_STORAGE = 'true';
```

**Logs**: Check Axiom telemetry for storage operation logs

## 11) Contributing

**Code Style**:

- Follow TypeScript best practices
- Use descriptive function names
- Implement proper error handling
- Document complex storage logic

**Testing**:

- Test all storage operations
- Test file validation and security
- Test access control and permissions
- Test backup and recovery

**Review Process**:

- All storage operations must be validated
- Security requirements must be met
- File handling must be comprehensive
- Performance must be optimized

---

## 📚 **Additional Resources**

- [Utils Package README](../README.md)
- [Context Module](../context/README.md)
- [Audit Module](../audit/README.md)
- [Web Package](../../web/README.md)
- [Web API Package](../../web-api/README.md)

---

**Last Updated**: 2025-09-13 • **Version**: 0.1.0
