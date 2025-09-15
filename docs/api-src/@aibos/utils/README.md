[**AI-BOS Accounts API Documentation (Source)**](../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../README.md) / @aibos/utils

# Utils — Shared Utilities & Services

> **TL;DR**: Comprehensive utility library providing shared services, V1 compliance tools, export
> functionality, audit logging, and monitoring capabilities across the AI-BOS platform.  
> **Owner**: @aibos/platform-team • **Status**: stable • **Since**: 2024-12  
> **Standards**: CommonMark • SemVer • Conventional Commits • Keep a Changelog

---

## 1) Scope & Boundaries

**Does**:

- Provides shared utility functions and services
- Implements V1 compliance features (audit logging, export management)
- Handles email, storage, and PDF generation services
- Provides monitoring and performance tracking
- Manages Supabase client configurations
- Implements idempotency and middleware utilities
- Provides type-safe branded ID helpers

**Does NOT**:

- Implement business logic (delegated to @aibos/accounting)
- Handle UI components (delegated to @aibos/ui)
- Manage database operations (delegated to @aibos/db)
- Provide API endpoints (implemented by @aibos/web-api)

**Consumers**: @aibos/web-api, @aibos/web, @aibos/accounting, @aibos/worker

## 2) Quick Links

- **Main Export**: `src/index.ts`
- **Server Utils**: `src/server.ts`
- **Type Definitions**: `src/types.ts`
- **Logger**: `src/logger.ts`
- **Export System**: `src/export/`
- **Audit Service**: `src/audit/`
- **Architecture Guide**: `../docs/ARCHITECTURE.md`
- **Integration Strategy**: `../DRAFT_INTEGRATION STRATEGY.md`

## 3) Getting Started

```bash
# Install dependencies
pnpm install

# Build the package
pnpm build

# Run tests
pnpm test

# Lint
pnpm lint
```

## 4) Architecture & Dependencies

**Dependencies**:

- `@aibos/db` - Database utilities
- `@aibos/auth` - Authentication utilities
- `@axiomhq/winston` - Axiom logging transport
- `@supabase/ssr` - Supabase SSR utilities
- `@supabase/supabase-js` - Supabase client
- `crypto-js` - Cryptographic utilities
- `drizzle-orm` - Database ORM
- `puppeteer` - PDF generation
- `resend` - Email service
- `uuid` - UUID generation
- `winston` - Logging framework
- `xlsx` - Excel export

**Dependents**:

- `@aibos/web-api` - API endpoint implementations
- `@aibos/web` - Frontend application
- `@aibos/accounting` - Business logic layer
- `@aibos/worker` - Background job processing

**Build Order**: Depends on @aibos/db, @aibos/auth

## 5) Development Workflow

**Local Dev**:

```bash
# Build with watch mode
pnpm build --watch

# Run tests
pnpm test

# Type check
pnpm typecheck
```

**Testing**:

```bash
# Run all tests
pnpm test

# Run specific test
pnpm test export

# Run with coverage
pnpm test --coverage
```

**Linting**:

```bash
# Check for linting errors
pnpm lint

# Auto-fix where possible
pnpm lint --fix
```

**Type Checking**:

```bash
# TypeScript compilation check
pnpm typecheck
```

## 6) API Surface

**Exports**:

- Type definitions and branded ID helpers
- Logger and monitoring utilities
- Email and storage services
- Supabase client configurations
- Export management and scheduling
- Audit logging and compliance
- Performance monitoring and error tracking

**Public Types**:

- `JsonValue`, `JsonObject`, `JsonArray` - JSON type definitions
- `JournalId`, `InvoiceId`, `TenantId` - Branded ID types
- `ExportFormat`, `ExportOptions` - Export configuration
- `AuditContext`, `AuditEvent` - Audit logging types
- `PerformanceMetrics`, `ErrorEvent` - Monitoring types

**Configuration**:

- Environment-based configuration
- Service-specific settings
- Export format options
- Monitoring thresholds

## 7) Performance & Monitoring

**Bundle Size**:

- Target: <300KB for utils package
- Optimized for tree-shaking
- Server-only utilities separated
- Minimal dependencies for fast loading

**Performance Budget**:

- Export generation: <5s for large datasets
- Email sending: <2s per message
- PDF generation: <10s per document
- Audit logging: <100ms per event

**Monitoring**:

- Performance metrics tracking
- Error rate monitoring
- Export success rates
- Service health checks

## 8) Security & Compliance

**Permissions**:

- Service role access for Supabase
- Encrypted data handling
- Secure file storage
- Audit trail maintenance

**Data Handling**:

- Type-safe data processing
- Encrypted sensitive data
- Secure file operations
- Audit logging for all operations

**Compliance**:

- V1 compliance with audit trails
- Export management and tracking
- Data retention policies
- GDPR-ready data handling

## 9) Core Utility Categories

### **Type Safety & Branded IDs**

- **Branded Types**: Type-safe ID helpers (JournalId, InvoiceId, etc.)
- **JSON Types**: Type-safe JSON value definitions
- **Type Guards**: Runtime type checking utilities
- **Helper Functions**: ID creation and validation

### **Logging & Monitoring**

- **Winston Logger**: Structured logging with Axiom integration
- **Performance Monitor**: Real-time performance tracking
- **Error Tracker**: Comprehensive error monitoring
- **Service Health**: Health check utilities

### **Export Management**

- **Export Service**: CSV, XLSX, JSONL export functionality
- **Export Manager**: Export history and file management
- **Export Scheduler**: Scheduled export processing
- **Format Support**: Multiple export formats with styling

### **Audit & Compliance**

- **Audit Service**: V1 compliance audit logging
- **Request Context**: User and session context tracking
- **Audit Events**: Structured audit event definitions
- **Compliance Tools**: V1 compliance utilities

## 10) Service Modules

### **Email Service**

- **Resend Integration**: Email sending via Resend
- **Template Support**: HTML and text email templates
- **Attachment Support**: File attachment handling
- **Delivery Tracking**: Email delivery status

### **Storage Service**

- **File Upload**: Secure file upload handling
- **Attachment Management**: Document attachment processing
- **File Validation**: File type and size validation
- **Storage Cleanup**: Automated file cleanup

### **PDF Generation**

- **Puppeteer Integration**: Server-side PDF generation
- **Template Support**: HTML to PDF conversion
- **Custom Styling**: PDF styling and formatting
- **Batch Processing**: Multiple PDF generation

### **Supabase Integration**

- **Client Management**: Browser, server, and middleware clients
- **SSR Support**: Server-side rendering compatibility
- **Service Role**: Administrative access for backend operations
- **Middleware**: Request processing utilities

## 11) Export System

### **Export Formats**

- **CSV**: Comma-separated values with enhanced formatting
- **XLSX**: Excel workbooks with styling and charts
- **JSONL**: JSON Lines for data processing
- **Custom Formats**: Extensible format system

### **Export Management**

- **Export History**: Complete export tracking
- **File Management**: Download URLs and expiration
- **User Tracking**: Export usage analytics
- **Cleanup Jobs**: Automated file cleanup

### **Export Scheduling**

- **Scheduled Exports**: Automated export generation
- **Recurring Jobs**: Regular export processing
- **Format Selection**: Multiple format support
- **Notification**: Export completion notifications

## 12) Audit & Compliance

### **Audit Logging**

- **Event Tracking**: Comprehensive event logging
- **Context Capture**: User, session, and request context
- **Entity Tracking**: Entity-level change tracking
- **Compliance**: V1 compliance requirements

### **Request Context**

- **User Context**: User identification and roles
- **Session Context**: Session tracking and management
- **Request Context**: Request-level context capture
- **Validation**: Context validation and sanitization

### **Performance Monitoring**

- **API Metrics**: API performance tracking
- **UI Metrics**: Frontend performance monitoring
- **Error Tracking**: Error rate and pattern analysis
- **Health Checks**: Service health monitoring

## 13) Usage Examples

### **Basic Utilities**

```typescript
import { createJournalId, createInvoiceId, logger } from "@aibos/utils";

// Create branded IDs
const journalId = createJournalId("uuid-string");
const invoiceId = createInvoiceId("uuid-string");

// Use logger
logger.info("Operation completed", { journalId, invoiceId });
```

### **Export Management**

```typescript
import { createExportService, ExportFormat } from "@aibos/utils";

const exportService = createExportService();

// Export data to CSV
const result = await exportService.exportToCsv({
  data: reportData,
  filename: "trial-balance.csv",
  format: ExportFormat.CSV,
});
```

### **Audit Logging**

```typescript
import { V1AuditService, createV1AuditContext } from "@aibos/utils";

const auditService = new V1AuditService();

// Log audit event
await auditService.logEvent({
  eventType: "INVOICE_CREATED",
  entityType: "INVOICE",
  entityId: invoiceId,
  action: "CREATE",
  details: { invoiceNumber: "INV-001" },
  context: createV1AuditContext({
    userId: "user-123",
    tenantId: "tenant-456",
    companyId: "company-789",
  }),
});
```

### **Email Service**

```typescript
import { sendEmail } from "@aibos/utils";

// Send email
await sendEmail({
  to: "customer@example.com",
  subject: "Invoice Created",
  html: "<h1>Your invoice has been created</h1>",
  text: "Your invoice has been created",
});
```

### **Performance Monitoring**

```typescript
import { performanceMonitor, errorTracker } from "@aibos/utils";

// Track performance
const metrics = performanceMonitor.startTimer("api-request");
// ... perform operation
metrics.endTimer();

// Track errors
errorTracker.captureError(new Error("Something went wrong"), {
  context: "invoice-creation",
  userId: "user-123",
});
```

## 14) Troubleshooting

**Common Issues**:

- **Export Failures**: Check file permissions and storage configuration
- **Email Not Sending**: Verify Resend API key and configuration
- **Audit Logging Issues**: Check Supabase connection and permissions
- **PDF Generation Errors**: Ensure Puppeteer is properly installed

**Debug Mode**:

```bash
# Check logger configuration
DEBUG=winston pnpm test

# Verify export functionality
pnpm test export
```

**Logs**:

- Winston logger output
- Export processing logs
- Audit event logs
- Performance metrics

## 15) Contributing

**Code Style**:

- Follow TypeScript best practices
- Use branded types for IDs
- Maintain V1 compliance
- Document all public APIs

**Testing**:

- Write tests for all utilities
- Test error scenarios
- Validate export functionality
- Test audit logging

**Review Process**:

- All changes must maintain V1 compliance
- Breaking changes require major version bump
- Performance impact must be assessed
- Documentation must be updated

---

## 📚 **Additional Resources**

- [Project README](../README.md)
- [Architecture Guide](../docs/ARCHITECTURE.md)
- [Integration Strategy](../DRAFT_INTEGRATION STRATEGY.md)
- [Web API Package](../apps/web-api/README.md)
- [Database Package](../packages/db/README.md)

---

## 🔗 **Utility Principles**

### **Type Safety First**

- Branded types for all IDs
- Type-safe JSON handling
- Runtime type validation
- Compile-time type checking

### **V1 Compliance**

- Comprehensive audit logging
- Export management and tracking
- Performance monitoring
- Error tracking and reporting

### **Service Integration**

- Supabase client management
- Email service integration
- Storage service handling
- PDF generation capabilities

### **Monitoring & Observability**

- Structured logging
- Performance metrics
- Error tracking
- Health monitoring

---

**Last Updated**: 2025-09-13 • **Version**: 0.1.0
