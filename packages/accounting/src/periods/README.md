# Periods — Period Management Module

> **TL;DR**: D4 Period management system for fiscal period close/open with approval workflow and SoD
> compliance.  
> **Owner**: @aibos/accounting-team • **Status**: stable • **Since**: 2024-12  
> **Standards**: CommonMark • SemVer • Conventional Commits • Keep a Changelog

---

## 1) Scope & Boundaries

**Does**:

- Fiscal period close/open operations
- Period validation and approval workflows
- SoD compliance for period operations
- Reversing entries creation
- Period lock management
- Trial balance validation

**Does NOT**:

- Handle AP/AR posting (delegated to @aibos/accounting/src/ap and @aibos/accounting/src/ar)
- Process bank transactions (delegated to @aibos/accounting/src/bank)
- Generate financial reports (delegated to @aibos/accounting/src/reports)
- Manage FX operations (delegated to @aibos/accounting/src/fx)

**Consumers**: @aibos/web-api, @aibos/accounting, external period management workflows

## 2) Quick Links

- **Period Management**: `period-management.ts`
- **Main Accounting**: `../README.md`
- **GL Posting**: `../posting.ts`
- **Reports Module**: `../reports/README.md`

## 3) Getting Started

```typescript
import { closeFiscalPeriod, openFiscalPeriod, createPeriodLock } from "@aibos/accounting/periods";

// Close fiscal period
const closeResult = await closeFiscalPeriod(
  {
    tenantId: "tenant-123",
    companyId: "company-456",
    fiscalPeriodId: "period-789",
    closeDate: new Date("2024-01-31"),
    closedBy: "user-123",
    userRole: "manager",
    closeReason: "Month-end close",
    generateReversingEntries: true,
  },
  dbClient,
);

// Open fiscal period
const openResult = await openFiscalPeriod(
  {
    tenantId: "tenant-123",
    companyId: "company-456",
    fiscalPeriodId: "period-790",
    openedBy: "user-123",
    userRole: "manager",
    openReason: "Reopening for adjustments",
  },
  dbClient,
);
```

## 4) Architecture & Dependencies

**Dependencies**:

- `../posting.ts` - SoD compliance validation
- Database client for period operations
- GL journal validation

**Dependents**:

- @aibos/web-api period endpoints
- @aibos/accounting main module
- External period management systems

**Build Order**: After posting module, before web-api integration

## 5) Development Workflow

**Local Dev**:

```bash
pnpm --filter @aibos/accounting dev
pnpm --filter @aibos/accounting test
```

**Testing**:

```bash
pnpm --filter @aibos/accounting test src/periods/
```

**Linting**:

```bash
pnpm --filter @aibos/accounting lint src/periods/
```

**Type Checking**:

```bash
pnpm --filter @aibos/accounting typecheck
```

## 6) API Surface

**Exports**:

### Period Management (`period-management.ts`)

- `closeFiscalPeriod()` - Close fiscal period with validation
- `openFiscalPeriod()` - Open previously closed period
- `createPeriodLock()` - Create period lock
- `validatePeriodCloseInput()` - Validate close input

**Public Types**:

- `PeriodCloseInput` - Period close input interface
- `PeriodOpenInput` - Period open input interface
- `PeriodLockInput` - Period lock input interface
- `PeriodCloseResult` - Successful period close result
- `PeriodManagementError` - Period management error
- `PeriodCloseValidation` - Period close validation result

**Configuration**:

- SoD compliance validation
- Approval workflow requirements
- Period lock types and management

## 7) Performance & Monitoring

**Bundle Size**: ~20KB minified  
**Performance Budget**: <2s for period close, <1s for period open  
**Monitoring**: Axiom telemetry integration for period operations

## 8) Security & Compliance

**Permissions**:

- Period close requires 'manager' or 'admin' role
- Period open requires 'manager' or 'admin' role
- SoD compliance enforced for all operations

**Data Handling**:

- All period operations validated and sanitized
- Audit trail for all period changes
- Reversing entries creation

**Compliance**:

- V1 compliance for period operations
- SoD enforcement for period management
- Approval workflow compliance

## 9) Usage Examples

### Close Fiscal Period

```typescript
import { closeFiscalPeriod } from "@aibos/accounting/periods";

// Close fiscal period with full validation
const closeResult = await closeFiscalPeriod(
  {
    tenantId: "tenant-123",
    companyId: "company-456",
    fiscalPeriodId: "period-789",
    closeDate: new Date("2024-01-31"),
    closedBy: "user-123",
    userRole: "manager",
    closeReason: "Month-end close",
    forceClose: false, // Don't force close if validation fails
    generateReversingEntries: true, // Create reversing entries for accruals
  },
  dbClient,
);

if (closeResult.success) {
  console.log("Period closed successfully");
  console.log("Period ID:", closeResult.fiscalPeriodId);
  console.log("Closed at:", closeResult.closedAt);
  console.log("Closed by:", closeResult.closedBy);
  console.log("Status:", closeResult.status);
  console.log("Reversing entries created:", closeResult.reversingEntriesCreated);
  console.log("Next period ID:", closeResult.nextPeriodId);

  // Check validation results
  const validation = closeResult.validationResults;
  console.log("Can close:", validation.canClose);
  console.log("Warnings:", validation.warnings);
  console.log("Errors:", validation.errors);
  console.log("Checks:", validation.checks);
} else {
  console.error("Period close failed:", closeResult.error);
  console.log("Error code:", closeResult.code);
  console.log("Details:", closeResult.details);
}
```

### Open Fiscal Period

```typescript
import { openFiscalPeriod } from "@aibos/accounting/periods";

// Open previously closed period
const openResult = await openFiscalPeriod(
  {
    tenantId: "tenant-123",
    companyId: "company-456",
    fiscalPeriodId: "period-789",
    openedBy: "user-123",
    userRole: "manager",
    openReason: "Reopening for year-end adjustments",
    approvalRequired: true, // Require approval for reopening
  },
  dbClient,
);

if (openResult.success) {
  console.log("Period opened successfully");
  console.log("Period ID:", openResult.fiscalPeriodId);
  console.log("Opened at:", openResult.closedAt); // Note: this will be the open time
  console.log("Opened by:", openResult.closedBy); // Note: this will be the opener
  console.log("Status:", openResult.status);
} else {
  console.error("Period open failed:", openResult.error);
  console.log("Error code:", openResult.code);
}
```

### Create Period Lock

```typescript
import { createPeriodLock } from "@aibos/accounting/periods";

// Create period lock
const lockResult = await createPeriodLock(
  {
    tenantId: "tenant-123",
    companyId: "company-456",
    fiscalPeriodId: "period-789",
    lockType: "POSTING", // POSTING, REPORTING, or FULL
    lockedBy: "user-123",
    userRole: "manager",
    reason: "Preventing further postings during close process",
  },
  dbClient,
);

if (lockResult.success) {
  console.log("Period lock created successfully");
  console.log("Lock ID:", lockResult.lockId);
} else {
  console.error("Period lock creation failed:", lockResult.error);
}
```

### Force Close Period

```typescript
import { closeFiscalPeriod } from "@aibos/accounting/periods";

// Force close period (override validation warnings)
const forceCloseResult = await closeFiscalPeriod(
  {
    tenantId: "tenant-123",
    companyId: "company-456",
    fiscalPeriodId: "period-789",
    closeDate: new Date("2024-01-31"),
    closedBy: "user-123",
    userRole: "admin", // Admin role required for force close
    closeReason: "Force close due to system maintenance",
    forceClose: true, // Override validation warnings
    generateReversingEntries: false,
  },
  dbClient,
);

if (forceCloseResult.success) {
  console.log("Period force closed successfully");
  console.log("Warnings overridden:", forceCloseResult.validationResults.warnings);
} else {
  console.error("Force close failed:", forceCloseResult.error);
}
```

### Period Validation

```typescript
import { closeFiscalPeriod } from "@aibos/accounting/periods";

// Close period and check validation results
const closeResult = await closeFiscalPeriod(
  {
    tenantId: "tenant-123",
    companyId: "company-456",
    fiscalPeriodId: "period-789",
    closeDate: new Date("2024-01-31"),
    closedBy: "user-123",
    userRole: "manager",
    closeReason: "Month-end close",
  },
  dbClient,
);

if (closeResult.success) {
  const validation = closeResult.validationResults;

  // Check individual validation checks
  console.log("Validation checks:");
  console.log("All journals posted:", validation.checks.allJournalsPosted);
  console.log("Trial balance balanced:", validation.checks.trialBalanceBalanced);
  console.log("No unreconciled transactions:", validation.checks.noUnreconciledTransactions);
  console.log("All required adjustments:", validation.checks.allRequiredAdjustments);
  console.log("Approval required:", validation.checks.approvalRequired);
  console.log("SoD compliance:", validation.checks.sodCompliance);

  // Check warnings and errors
  if (validation.warnings.length > 0) {
    console.log("Warnings:");
    validation.warnings.forEach(warning => console.log("-", warning));
  }

  if (validation.errors.length > 0) {
    console.log("Errors:");
    validation.errors.forEach(error => console.log("-", error));
  }
}
```

## 10) Troubleshooting

**Common Issues**:

- **SoD Violation**: Check user roles and permissions
- **Unposted Journals**: Ensure all journals are posted before closing
- **Trial Balance Out of Balance**: Check for posting errors
- **Unreconciled Transactions**: Complete bank reconciliation
- **Period Already Closed**: Check period status before operations

**Debug Mode**:

```typescript
// Enable detailed logging
process.env.DEBUG_PERIODS = "true";
```

**Logs**: Check Axiom telemetry for period operation logs

## 11) Contributing

**Code Style**:

- Follow TypeScript best practices
- Use descriptive function names
- Implement proper error handling
- Document complex period logic

**Testing**:

- Test all period close scenarios
- Test period open scenarios
- Test SoD compliance
- Test validation checks

**Review Process**:

- All period operations must be validated
- SoD compliance must be enforced
- Approval workflows must be tested
- Validation checks must be comprehensive

---

## 📚 **Additional Resources**

- [Accounting Package README](../README.md)
- [GL Posting Module](../posting.ts)
- [Reports Module](../reports/README.md)
- [AP Module](../ap/README.md)
- [AR Module](../ar/README.md)

---

**Last Updated**: 2025-09-13 • **Version**: 0.1.0
