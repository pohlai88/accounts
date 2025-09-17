# DOC-215: Documentation

**Version**: 1.0  
**Date**: 2025-09-17  
**Status**: Active  
**Owner**: Development Team  
**Last Updated**: 2025-09-17  
**Next Review**: 2025-12-17  

---

# Audit — Audit & Compliance Module

> **TL;DR**: V1 compliance audit service with Supabase integration for comprehensive audit logging
> and compliance tracking.  
> **Owner**: @aibos/utils-team • **Status**: stable • **Since**: 2024-12  
> **Standards**: CommonMark • SemVer • Conventional Commits • Keep a Changelog

---

## 1) Scope & Boundaries

**Does**:

- V1 compliance audit logging
- Audit event tracking and storage
- Audit context management
- Compliance reporting and analytics
- Audit trail validation
- Supabase integration for audit storage

**Does NOT**:

- Handle authentication (delegated to @aibos/auth)
- Manage database operations (delegated to @aibos/db)
- Process business logic (delegated to @aibos/accounting)
- Generate financial reports (delegated to @aibos/accounting/src/reports)

**Consumers**: @aibos/accounting, @aibos/web-api, @aibos/auth, external compliance systems

## 2) Quick Links

- **Audit Service**: `audit-service.ts`
- **Service Interface**: `service.ts`
- **Main Utils**: `../README.md`
- **Context Module**: `../context/README.md`
- **Auth Module**: `../auth/README.md`

## 3) Getting Started

```typescript
import { AuditService, getAuditService } from "@aibos/utils/audit";
import { createAuditContext, extractUserContext } from "@aibos/utils/context";

// Initialize audit service
const auditService = getAuditService();

// Create audit context
const auditContext = createAuditContext({
  tenantId: "tenant-123",
  companyId: "company-456",
  userId: "user-789",
  userRole: "accountant",
  sessionId: "session-abc",
  requestId: "req-xyz",
});

// Log audit event
await auditService.logEvent({
  eventType: "JOURNAL_POSTED",
  entityType: "GL_JOURNAL",
  entityId: "journal-123",
  action: "CREATE",
  details: {
    journalNumber: "JE-001",
    totalAmount: 1000.0,
    currency: "MYR",
  },
  context: auditContext,
});
```

## 4) Architecture & Dependencies

**Dependencies**:

- Supabase client for audit storage
- Context management for audit context
- Winston logger for audit logging

**Dependents**:

- @aibos/accounting for business logic auditing
- @aibos/web-api for API operation auditing
- @aibos/auth for authentication auditing

**Build Order**: After context and auth modules, before accounting integration

## 5) Development Workflow

**Local Dev**:

```bash
pnpm --filter @aibos/utils dev
pnpm --filter @aibos/utils test
```

**Testing**:

```bash
pnpm --filter @aibos/utils test src/audit/
```

**Linting**:

```bash
pnpm --filter @aibos/utils lint src/audit/
```

**Type Checking**:

```bash
pnpm --filter @aibos/utils typecheck
```

## 6) API Surface

**Exports**:

### Audit Service (`audit-service.ts`)

- `AuditService` - Main audit service class
- `getAuditService()` - Get audit service instance
- `AuditContext` - Audit context interface
- `AuditEvent` - Audit event interface

### Service Interface (`service.ts`)

- Service interface definitions
- Audit service configuration

**Public Types**:

- `AuditContext` - Audit context interface
- `AuditEvent` - Audit event interface
- `AuditService` - Audit service class
- `AuditEventType` - Audit event type enum
- `EntityType` - Entity type enum

**Configuration**:

- Supabase integration for audit storage
- Configurable audit retention policies
- Audit event filtering and aggregation

## 7) Performance & Monitoring

**Bundle Size**: ~8KB minified  
**Performance Budget**: <100ms for audit event logging  
**Monitoring**: Axiom telemetry integration for audit operations

## 8) Security & Compliance

**Permissions**:

- Audit logging requires 'system' or 'admin' role
- Audit reading requires 'manager' or 'admin' role

**Data Handling**:

- All audit data encrypted and secured
- Audit trail integrity validation
- Compliance with V1 requirements

**Compliance**:

- V1 compliance for audit operations
- SoD enforcement for audit access
- Audit trail validation

## 9) Usage Examples

### Basic Audit Logging

```typescript
import { getAuditService } from "@aibos/utils/audit";
import { createAuditContext } from "@aibos/utils/context";

// Initialize audit service
const auditService = getAuditService();

// Create audit context
const auditContext = createAuditContext({
  tenantId: "tenant-123",
  companyId: "company-456",
  userId: "user-789",
  userRole: "accountant",
  sessionId: "session-abc",
  requestId: "req-xyz",
});

// Log journal posting event
await auditService.logEvent({
  eventType: "JOURNAL_POSTED",
  entityType: "GL_JOURNAL",
  entityId: "journal-123",
  action: "CREATE",
  details: {
    journalNumber: "JE-001",
    totalAmount: 1000.0,
    currency: "MYR",
    lineCount: 2,
  },
  context: auditContext,
});

// Log invoice creation event
await auditService.logEvent({
  eventType: "INVOICE_CREATED",
  entityType: "AR_INVOICE",
  entityId: "invoice-456",
  action: "CREATE",
  details: {
    invoiceNumber: "INV-001",
    customerId: "customer-789",
    totalAmount: 500.0,
    currency: "MYR",
  },
  context: auditContext,
});
```

### Advanced Audit Logging

```typescript
import { getAuditService } from "@aibos/utils/audit";
import { createAuditContext } from "@aibos/utils/context";

const auditService = getAuditService();

// Log complex business event
await auditService.logEvent({
  eventType: "PERIOD_CLOSED",
  entityType: "FISCAL_PERIOD",
  entityId: "period-789",
  action: "UPDATE",
  details: {
    periodId: "period-789",
    periodName: "January 2024",
    closeDate: "2024-01-31",
    closedBy: "user-789",
    reversingEntriesCreated: 5,
    validationResults: {
      allJournalsPosted: true,
      trialBalanceBalanced: true,
      noUnreconciledTransactions: true,
    },
  },
  context: auditContext,
});

// Log security event
await auditService.logEvent({
  eventType: "LOGIN_ATTEMPT",
  entityType: "USER",
  entityId: "user-789",
  action: "AUTHENTICATE",
  details: {
    loginMethod: "PASSWORD",
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0...",
    success: true,
  },
  context: auditContext,
});

// Log data access event
await auditService.logEvent({
  eventType: "DATA_ACCESSED",
  entityType: "FINANCIAL_REPORT",
  entityId: "report-123",
  action: "READ",
  details: {
    reportType: "BALANCE_SHEET",
    reportDate: "2024-01-31",
    accessMethod: "API",
    dataExported: false,
  },
  context: auditContext,
});
```

### Audit Context Management

```typescript
import { createAuditContext, extractUserContext } from "@aibos/utils/context";

// Create audit context from request
const auditContext = createAuditContext({
  tenantId: "tenant-123",
  companyId: "company-456",
  userId: "user-789",
  userRole: "accountant",
  sessionId: "session-abc",
  requestId: "req-xyz",
  ipAddress: "192.168.1.100",
  userAgent: "Mozilla/5.0...",
  timestamp: new Date(),
});

// Extract user context from request
const userContext = extractUserContext(request);
// Returns: { userId, userRole, tenantId, companyId, sessionId }

// Validate audit context
const isValid = validateContext(auditContext);
if (!isValid) {
  throw new Error("Invalid audit context");
}

// Sanitize audit context
const sanitizedContext = sanitizeContext(auditContext);
// Removes sensitive information before logging
```

### Audit Event Filtering

```typescript
import { getAuditService } from "@aibos/utils/audit";

const auditService = getAuditService();

// Get audit events by type
const journalEvents = await auditService.getEvents({
  eventType: "JOURNAL_POSTED",
  entityType: "GL_JOURNAL",
  startDate: new Date("2024-01-01"),
  endDate: new Date("2024-01-31"),
});

// Get audit events by user
const userEvents = await auditService.getEvents({
  userId: "user-789",
  startDate: new Date("2024-01-01"),
  endDate: new Date("2024-01-31"),
});

// Get audit events by entity
const entityEvents = await auditService.getEvents({
  entityType: "AR_INVOICE",
  entityId: "invoice-456",
});

// Get audit events with pagination
const paginatedEvents = await auditService.getEvents({
  eventType: "DATA_ACCESSED",
  page: 1,
  limit: 50,
  sortBy: "timestamp",
  sortOrder: "DESC",
});
```

### Compliance Reporting

```typescript
import { getAuditService } from "@aibos/utils/audit";

const auditService = getAuditService();

// Generate compliance report
const complianceReport = await auditService.generateComplianceReport({
  tenantId: "tenant-123",
  companyId: "company-456",
  startDate: new Date("2024-01-01"),
  endDate: new Date("2024-01-31"),
  reportType: "SOX_COMPLIANCE",
});

console.log("Compliance Report:");
console.log("Total events:", complianceReport.totalEvents);
console.log("Critical events:", complianceReport.criticalEvents);
console.log("Compliance score:", complianceReport.complianceScore);
console.log("Violations:", complianceReport.violations);

// Generate audit trail
const auditTrail = await auditService.generateAuditTrail({
  entityType: "GL_JOURNAL",
  entityId: "journal-123",
  includeDetails: true,
});

console.log("Audit Trail:");
for (const event of auditTrail.events) {
  console.log(`${event.timestamp}: ${event.eventType} - ${event.action}`);
  console.log(`  User: ${event.context.userId} (${event.context.userRole})`);
  console.log(`  Details: ${JSON.stringify(event.details)}`);
}
```

## 10) Troubleshooting

**Common Issues**:

- **Audit Context Missing**: Ensure audit context is created before logging
- **Supabase Connection**: Check Supabase client configuration
- **Audit Storage Full**: Implement audit retention policies
- **Performance Issues**: Optimize audit queries and indexing

**Debug Mode**:

```typescript
// Enable detailed logging
process.env.DEBUG_AUDIT = "true";
```

**Logs**: Check Axiom telemetry for audit operation logs

## 11) Contributing

**Code Style**:

- Follow TypeScript best practices
- Use descriptive function names
- Implement proper error handling
- Document complex audit logic

**Testing**:

- Test all audit logging scenarios
- Test audit context management
- Test compliance reporting
- Test audit event filtering

**Review Process**:

- All audit operations must be validated
- Compliance requirements must be met
- Audit trail integrity must be maintained
- Performance must be optimized

---

## 📚 **Additional Resources**

- [Utils Package README](../README.md)
- [Context Module](../context/README.md)
- [Auth Module](../auth/README.md)
- [Accounting Package](../../accounting/README.md)
- [Web API Package](../../web-api/README.md)

---

**Last Updated**: 2025-09-13 • **Version**: 0.1.0
