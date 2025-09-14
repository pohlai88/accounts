# E2E Tests — End-to-End Testing Suite

> **TL;DR**: Comprehensive end-to-end testing suite for D2 AR, D4 financial reporting, journal
> posting, RLS verification, and attachment system integration.  
> **Owner**: @aibos/test-team • **Status**: stable • **Since**: 2024-12  
> **Standards**: CommonMark • SemVer • Conventional Commits • Keep a Changelog

---

## 1) Scope & Boundaries

**Does**:

- End-to-end user journey testing
- D2 AR integration testing
- D4 financial reporting testing
- Journal posting workflow testing
- RLS verification testing
- Attachment system testing
- Supabase integration testing

**Does NOT**:

- Handle unit testing (delegated to unit tests)
- Manage integration testing (delegated to integration tests)
- Process contract testing (delegated to contract tests)
- Generate performance testing (delegated to performance tests)

**Consumers**: @aibos/web, @aibos/web-api, @aibos/accounting, external test systems

## 2) Quick Links

- **D2 Integration**: `d2-integration.spec.ts`
- **D4 Financial Reporting**: `d4-financial-reporting.spec.ts`
- **Journal Posting**: `journal-posting.spec.ts`
- **RLS Verification**: `rls-verification.spec.ts`
- **Attachment System**: `attachment-system.spec.ts`
- **Global Setup**: `global-setup.ts`
- **Global Teardown**: `global-teardown.ts`
- **Supabase RLS Setup**: `supabase-rls-setup.ts`

## 3) Getting Started

```typescript
import {
  testD2Integration,
  testD4FinancialReporting,
  testJournalPosting,
  testRLSVerification,
  testAttachmentSystem,
} from "@aibos/tests/e2e";

// Run D2 integration tests
await testD2Integration();

// Run D4 financial reporting tests
await testD4FinancialReporting();

// Run journal posting tests
await testJournalPosting();
```

## 4) Architecture & Dependencies

**Dependencies**:

- Playwright for E2E testing framework
- @aibos/web for frontend testing
- @aibos/web-api for API testing
- @aibos/accounting for business logic testing
- Supabase for database testing

**Dependents**:

- @aibos/web for frontend E2E testing
- @aibos/web-api for API E2E testing
- External systems for E2E integration testing

**Build Order**: Depends on @aibos/web, @aibos/web-api, @aibos/accounting

## 5) Development Workflow

**Local Dev**:

```bash
pnpm test:e2e:ui
pnpm test:e2e:debug
```

**Testing**:

```bash
pnpm test:e2e
```

**Linting**:

```bash
pnpm lint
```

**Type Checking**:

```bash
pnpm typecheck
```

## 6) API Surface

**Exports**:

### D2 Integration Testing

- `testD2Integration` - Test D2 AR integration
- `testInvoiceWorkflow` - Test invoice workflow
- `testPaymentProcessing` - Test payment processing

### D4 Financial Reporting Testing

- `testD4FinancialReporting` - Test D4 financial reporting
- `testTrialBalance` - Test trial balance generation
- `testBalanceSheet` - Test balance sheet generation
- `testProfitLoss` - Test profit & loss generation

### Journal Posting Testing

- `testJournalPosting` - Test journal posting workflow
- `testJournalValidation` - Test journal validation
- `testJournalApproval` - Test journal approval

### RLS Verification Testing

- `testRLSVerification` - Test RLS verification
- `testTenantIsolation` - Test tenant isolation
- `testCompanyIsolation` - Test company isolation

### Attachment System Testing

- `testAttachmentSystem` - Test attachment system
- `testFileUpload` - Test file upload
- `testFileProcessing` - Test file processing

**Public Types**:

- `E2ETestConfig` - E2E test configuration
- `TestUser` - Test user interface
- `TestData` - Test data interface
- `TestResult` - Test result interface

## 7) Performance & Monitoring

**Bundle Size**: ~15KB minified  
**Performance Budget**: <30s for E2E test execution, <5s for individual test steps  
**Monitoring**: E2E test performance monitoring

## 8) Security & Compliance

**Permissions**:

- E2E testing requires proper authentication
- Test data requires authorization
- RLS testing requires security clearance

**Data Handling**:

- All test data validated and sanitized
- Secure test environment setup
- Audit trail for E2E test operations

**Compliance**:

- V1 compliance for E2E test operations
- SoD enforcement for E2E test execution
- Security audit compliance

## 9) Usage Examples

### D2 Integration Testing

```typescript
import { testD2Integration } from "@aibos/tests/e2e";

// Test D2 AR integration
async function testD2ARIntegration() {
  const testConfig = {
    tenantId: "test-tenant-123",
    companyId: "test-company-456",
    testUser: {
      id: "test-user-789",
      role: "accountant",
      permissions: ["ar:read", "ar:write"],
    },
  };

  const result = await testD2Integration(testConfig);

  if (result.success) {
    console.log("D2 integration test passed");
  } else {
    console.error("D2 integration test failed:", result.errors);
  }
}
```

### D4 Financial Reporting Testing

```typescript
import { testD4FinancialReporting } from "@aibos/tests/e2e";

// Test D4 financial reporting
async function testD4FinancialReporting() {
  const testConfig = {
    period: {
      startDate: "2024-01-01",
      endDate: "2024-01-31",
    },
    reports: ["trial-balance", "balance-sheet", "profit-loss"],
    testData: {
      journals: 100,
      invoices: 50,
      bills: 30,
    },
  };

  const result = await testD4FinancialReporting(testConfig);

  if (result.success) {
    console.log("D4 financial reporting test passed");
  } else {
    console.error("D4 financial reporting test failed:", result.errors);
  }
}
```

### Journal Posting Testing

```typescript
import { testJournalPosting } from "@aibos/tests/e2e";

// Test journal posting workflow
async function testJournalPostingWorkflow() {
  const testConfig = {
    journal: {
      description: "Test Journal Entry",
      date: "2024-01-15",
      lines: [
        { account: "Cash", debit: 1000, credit: 0 },
        { account: "Revenue", debit: 0, credit: 1000 },
      ],
    },
    workflow: {
      steps: ["create", "validate", "approve", "post"],
      approver: "test-approver-123",
    },
  };

  const result = await testJournalPosting(testConfig);

  if (result.success) {
    console.log("Journal posting test passed");
  } else {
    console.error("Journal posting test failed:", result.errors);
  }
}
```

### RLS Verification Testing

```typescript
import { testRLSVerification } from "@aibos/tests/e2e";

// Test RLS verification
async function testRLSVerification() {
  const testConfig = {
    tenants: [
      { id: "tenant-1", name: "Tenant 1" },
      { id: "tenant-2", name: "Tenant 2" },
    ],
    companies: [
      { id: "company-1", tenantId: "tenant-1" },
      { id: "company-2", tenantId: "tenant-2" },
    ],
    testUsers: [
      { id: "user-1", tenantId: "tenant-1", companyId: "company-1" },
      { id: "user-2", tenantId: "tenant-2", companyId: "company-2" },
    ],
  };

  const result = await testRLSVerification(testConfig);

  if (result.success) {
    console.log("RLS verification test passed");
  } else {
    console.error("RLS verification test failed:", result.errors);
  }
}
```

### Attachment System Testing

```typescript
import { testAttachmentSystem } from "@aibos/tests/e2e";

// Test attachment system
async function testAttachmentSystem() {
  const testConfig = {
    attachments: [
      {
        type: "invoice",
        file: "test-invoice.pdf",
        size: 1024000,
        mimeType: "application/pdf",
      },
      {
        type: "receipt",
        file: "test-receipt.jpg",
        size: 512000,
        mimeType: "image/jpeg",
      },
    ],
    processing: {
      ocr: true,
      validation: true,
      storage: "s3",
    },
  };

  const result = await testAttachmentSystem(testConfig);

  if (result.success) {
    console.log("Attachment system test passed");
  } else {
    console.error("Attachment system test failed:", result.errors);
  }
}
```

### Global Setup and Teardown

```typescript
import { setupGlobalTestEnvironment, teardownGlobalTestEnvironment } from "@aibos/tests/e2e";

// Global test setup
async function setupTests() {
  await setupGlobalTestEnvironment({
    database: {
      reset: true,
      seed: true,
      testData: "minimal",
    },
    supabase: {
      reset: true,
      rls: true,
      policies: true,
    },
    auth: {
      testUsers: true,
      permissions: true,
    },
  });
}

// Global test teardown
async function teardownTests() {
  await teardownGlobalTestEnvironment({
    cleanup: true,
    reset: true,
    logs: true,
  });
}
```

### Supabase RLS Setup

```typescript
import { setupSupabaseRLS } from "@aibos/tests/e2e";

// Setup Supabase RLS for testing
async function setupSupabaseRLS() {
  await setupSupabaseRLS({
    policies: [
      {
        table: "gl_journal",
        policy: "tenant_isolation",
        definition: "tenant_id = auth.jwt() ->> 'tenant_id'",
      },
      {
        table: "ar_invoices",
        policy: "company_isolation",
        definition: "company_id = auth.jwt() ->> 'company_id'",
      },
    ],
    testData: {
      tenants: 2,
      companies: 4,
      users: 8,
    },
  });
}
```

### Advanced E2E Testing

```typescript
import {
  testD2Integration,
  testD4FinancialReporting,
  testJournalPosting,
  testRLSVerification,
  testAttachmentSystem,
} from "@aibos/tests/e2e";

// Comprehensive E2E testing suite
async function runE2ETests() {
  const results = {
    d2: null,
    d4: null,
    journal: null,
    rls: null,
    attachment: null,
  };

  try {
    // Test D2 integration
    results.d2 = await testD2Integration({
      tenantId: "test-tenant-123",
      companyId: "test-company-456",
    });

    // Test D4 financial reporting
    results.d4 = await testD4FinancialReporting({
      period: {
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      },
    });

    // Test journal posting
    results.journal = await testJournalPosting({
      journal: {
        description: "Test Journal Entry",
        date: "2024-01-15",
      },
    });

    // Test RLS verification
    results.rls = await testRLSVerification({
      tenants: ["tenant-1", "tenant-2"],
      companies: ["company-1", "company-2"],
    });

    // Test attachment system
    results.attachment = await testAttachmentSystem({
      attachments: ["test-invoice.pdf", "test-receipt.jpg"],
    });

    console.log("All E2E tests completed:", results);
  } catch (error) {
    console.error("E2E test suite failed:", error);
    throw error;
  }

  return results;
}
```

## 10) Troubleshooting

**Common Issues**:

- **Test Timeout**: Check test configuration and timeout settings
- **Database Connection**: Verify Supabase connection and RLS setup
- **Authentication Issues**: Check test user setup and permissions
- **Test Data Issues**: Verify test data seeding and cleanup

**Debug Mode**:

```typescript
// Enable detailed logging
process.env.DEBUG_E2E = "true";
```

**Logs**: Check test logs for E2E test execution details

## 11) Contributing

**Code Style**:

- Follow TypeScript best practices
- Use descriptive test names
- Implement comprehensive E2E testing
- Document complex test scenarios

**Testing**:

- Test all E2E test functions
- Test test data setup and cleanup
- Test test environment configuration
- Test test performance and reliability

**Review Process**:

- All E2E tests must be validated
- Test scenarios must be comprehensive
- Performance must be optimized
- Security must be verified

---

## 📚 **Additional Resources**

- [Tests README](../README.md)
- [Unit Tests](../unit/README.md)
- [Integration Tests](../integration/README.md)
- [Contract Tests](../contracts/README.md)
- [Performance Tests](../performance/README.md)

---

**Last Updated**: 2025-09-13 • **Version**: 0.1.0
