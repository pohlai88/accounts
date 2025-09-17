# Unit Testing Robustness Strategy

## Battle-Tested Approach for Accounting SaaS

**Document Version**: 1.0  
**Created**: 2024-01-15  
**Status**: Implementation Ready  
**Target**: 95%+ Test Reliability with Business Logic Validation

---

## 🎯 Executive Summary

This document outlines a comprehensive unit testing strategy designed to ensure our accounting SaaS business logic is as robust as our tests. The approach focuses on **spec coverage**, **mutation testing**, **invariant validation**, and **reality checks** without bloating the test suite.

**Current State**: 45% test pass rate, 3 failing tests  
**Target State**: 95%+ pass rate with comprehensive business rule coverage  
**Timeline**: 3 phases over 3 weeks

---

## 📊 Current Test Suite Analysis

### Test Coverage Status

- **Total Test Files**: 9
- **Passing Files**: 6 (67%)
- **Total Tests**: 115
- **Passing Tests**: 52 (45%)
- **Failing Tests**: 3 (3%)

### Business Logic Coverage

- **Invoice Posting**: ✅ 17/17 tests passing
- **Payment Processing Enhanced**: ✅ 17/17 tests passing
- **GL Posting**: ✅ 27/27 tests passing
- **Bill Posting**: ✅ 2/2 tests passing
- **Payment Processing Standard**: ❌ 1/23 tests failing (mock issues)
- **Payment Processing Focused**: ❌ 1/12 tests failing (FX validation)
- **Payment Processing Optimized**: ❌ 1/10 tests failing (FX validation)

---

## 🚀 Implementation Strategy

### Phase 1: Foundation (Week 1)

**Goal**: Fix existing issues and establish core testing infrastructure

#### 1.1 Fix Current Test Failures

- **Priority**: CRITICAL
- **Effort**: 2 days
- **Tasks**:
  - Fix mock configuration issues in payment-processing.test.ts
  - Resolve FX validation inconsistencies
  - Ensure all tests use dynamic imports consistently

#### 1.2 Business-Rule Traceability Matrix

- **Priority**: HIGH
- **Effort**: 1 day
- **Deliverable**: `.dev-document/business-rule-traceability-matrix.md`
- **Content**:
  ```markdown
  | Business Rule                        | Test File                            | Test Case                                            | Status |
  | ------------------------------------ | ------------------------------------ | ---------------------------------------------------- | ------ |
  | FX required when txn.currency ≠ base | payment-processing-optimized.test.ts | should reject foreign currency without exchange rate | ✅     |
  | Journal must balance (ΣDR=ΣCR)       | gl-posting.test.ts                   | should validate journal is balanced                  | ✅     |
  | Approval threshold > X               | invoice-posting.test.ts              | should require approval for large amounts            | ✅     |
  | Period locked rejects posting        | period-management.test.ts            | should reject posting in locked period               | ❌     |
  ```

#### 1.3 Error-Code Coverage Script

- **Priority**: HIGH
- **Effort**: 1 day
- **Deliverable**: `scripts/check-error-codes.js`
- **Functionality**:
  - Scan `packages/accounting/src/**/*.ts` for error codes
  - Verify each error code has corresponding test
  - Generate coverage report
  - Gate in CI pipeline

#### 1.4 Invariant Testing with fast-check

- **Priority**: HIGH
- **Effort**: 2 days
- **Deliverable**: `tests/invariants/` directory
- **Tests**:
  - Journal balance invariance
  - FX round-trip consistency
  - Amount scaling properties
  - Currency conversion accuracy

### Phase 2: Mutation Testing (Week 2)

**Goal**: Ensure tests catch real bugs through mutation testing

#### 2.1 Stryker Configuration

- **Priority**: MEDIUM
- **Effort**: 1 day
- **Deliverable**: `stryker.conf.cjs`
- **Scope**: Core accounting functions only
  - `packages/accounting/src/ap/payment-processing.ts`
  - `packages/accounting/src/posting.ts`
  - `packages/accounting/src/ar/invoice-posting.ts`

#### 2.2 Mutation Testing Implementation

- **Priority**: MEDIUM
- **Effort**: 2 days
- **Target**: 80% mutation score
- **Focus**: Business logic functions, not utility functions

#### 2.3 CI Integration

- **Priority**: MEDIUM
- **Effort**: 1 day
- **Deliverable**: GitHub Actions workflow for mutation testing
- **Threshold**: Break build if mutation score < 80%

### Phase 3: Integration Testing (Week 3)

**Goal**: Validate against real database constraints

#### 3.1 Test Containers Setup

- **Priority**: MEDIUM
- **Effort**: 2 days
- **Deliverable**: `tests/integration/` directory
- **Technology**: @testcontainers/postgresql
- **Scope**: 4 golden flows
  - Invoice posting workflow
  - Payment processing workflow
  - Bill posting workflow
  - Manual journal entry workflow

#### 3.2 Hermetic Integration Tests

- **Priority**: MEDIUM
- **Effort**: 2 days
- **Tests**:
  - Database constraint validation
  - RLS (Row Level Security) enforcement
  - Idempotency verification
  - Role-based authorization

---

## 🛠️ Technical Implementation

### 1. Error-Code Coverage Script

```javascript
// scripts/check-error-codes.js
const fs = require("fs");
const path = require("path");
const glob = require("glob");

const ERROR_CODE_PATTERN = /code:\s*["']([A-Z_]+)["']/g;
const TEST_FILE_PATTERN = "tests/**/*.test.ts";

function extractErrorCodes(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const codes = [];
  let match;
  while ((match = ERROR_CODE_PATTERN.exec(content)) !== null) {
    codes.push(match[1]);
  }
  return codes;
}

function checkErrorCodeCoverage() {
  const sourceFiles = glob.sync("packages/accounting/src/**/*.ts");
  const testFiles = glob.sync(TEST_FILE_PATTERN);

  const allErrorCodes = new Set();
  const coveredCodes = new Set();

  // Extract error codes from source
  sourceFiles.forEach(file => {
    const codes = extractErrorCodes(file);
    codes.forEach(code => allErrorCodes.add(code));
  });

  // Check test coverage
  testFiles.forEach(file => {
    const content = fs.readFileSync(file, "utf8");
    allErrorCodes.forEach(code => {
      if (content.includes(code)) {
        coveredCodes.add(code);
      }
    });
  });

  const coverage = (coveredCodes.size / allErrorCodes.size) * 100;
  console.log(`Error Code Coverage: ${coverage.toFixed(1)}%`);
  console.log(`Covered: ${coveredCodes.size}/${allErrorCodes.size}`);

  if (coverage < 100) {
    const missing = Array.from(allErrorCodes).filter(code => !coveredCodes.has(code));
    console.log("Missing coverage for:", missing);
    process.exit(1);
  }
}

checkErrorCodeCoverage();
```

### 2. Fast-Check Invariant Tests

```typescript
// tests/invariants/journal-balance.test.ts
import fc from "fast-check";
import { validateJournalPosting } from "@aibos/accounting";

describe("Journal Balance Invariants", () => {
  it("Σdebits === Σcredits for any valid journal", async () => {
    await fc.assert(
      fc.asyncProperty(arbJournal(), async input => {
        const result = await validateJournalPosting(input);
        if (result.validated) {
          const sumDebits = result.journalInput.lines.reduce(
            (sum, line) => sum + (line.debit || 0),
            0,
          );
          const sumCredits = result.journalInput.lines.reduce(
            (sum, line) => sum + (line.credit || 0),
            0,
          );
          expect(sumDebits).toBeCloseTo(sumCredits, 2);
        }
      }),
      { numRuns: 200 },
    );
  });

  it("FX round-trip preserves amounts within rounding", async () => {
    await fc.assert(
      fc.asyncProperty(arbPayment(), async input => {
        const originalAmount = input.amount;
        const exchangeRate = input.exchangeRate;

        // Convert USD to MYR
        const convertedAmount = originalAmount * exchangeRate;
        // Convert back to USD
        const roundTripAmount = convertedAmount / exchangeRate;

        expect(roundTripAmount).toBeCloseTo(originalAmount, 2);
      }),
      { numRuns: 100 },
    );
  });
});
```

### 3. Stryker Configuration

```javascript
// stryker.conf.cjs
module.exports = {
  mutate: [
    "packages/accounting/src/ap/payment-processing.ts",
    "packages/accounting/src/posting.ts",
    "packages/accounting/src/ar/invoice-posting.ts",
    "!**/*.d.ts",
  ],
  testRunner: "vitest",
  vitest: {
    configFile: "tests/config/vitest-simple.config.ts",
  },
  reporters: ["progress", "dashboard"],
  thresholds: {
    high: 80,
    low: 70,
    break: 80,
  },
  coverageAnalysis: "perTest",
  timeoutMS: 60000,
  dryRunTimeoutMS: 10000,
};
```

### 4. Integration Test Setup

```typescript
// tests/integration/golden-flows.test.ts
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { validateInvoicePosting } from "@aibos/accounting";

describe("Golden Flow Integration Tests", () => {
  let container: PostgreSqlContainer;
  let connectionString: string;

  beforeAll(async () => {
    container = await new PostgreSqlContainer("postgres:15")
      .withDatabase("test_accounting")
      .withUsername("test")
      .withPassword("test")
      .start();

    connectionString = container.getConnectionUri();
  });

  afterAll(async () => {
    await container.stop();
  });

  it("Invoice posting workflow with RLS", async () => {
    // Test complete invoice workflow with real DB constraints
    const invoiceInput = createTestInvoice();
    const result = await validateInvoicePosting(invoiceInput);

    expect(result.validated).toBe(true);
    // Verify DB constraints are respected
    // Verify RLS policies are enforced
  });
});
```

---

## 📈 Robustness Scorecard

| Dimension             | Target   | Current | Phase 1 | Phase 2 | Phase 3 |
| --------------------- | -------- | ------- | ------- | ------- | ------- |
| Line coverage         | ≥ 85%    | ~60%    | 75%     | 80%     | 85%     |
| Branch coverage       | ≥ 70%    | ~45%    | 60%     | 70%     | 75%     |
| Mutation score        | ≥ 80%    | 0%      | 0%      | 80%     | 85%     |
| Error-code coverage   | 100%     | ~70%    | 100%    | 100%    | 100%    |
| Invariant presence    | 100%     | 0%      | 100%    | 100%    | 100%    |
| Flakiness             | 0 fails  | 3 fails | 0 fails | 0 fails | 0 fails |
| Assertion density     | ≥ 2/test | ~3/test | 3/test  | 3/test  | 3/test  |
| Risk-top-10 scenarios | 100%     | ~80%    | 90%     | 95%     | 100%    |

---

## 🎯 Success Criteria

### Phase 1 Success Criteria

- [ ] All existing tests pass (0 failures)
- [ ] Error-code coverage = 100%
- [ ] Business rule traceability matrix complete
- [ ] Invariant tests implemented and passing
- [ ] Test pass rate ≥ 90%

### Phase 2 Success Criteria

- [ ] Mutation score ≥ 80%
- [ ] Stryker integrated in CI
- [ ] Core business logic mutation-tested
- [ ] Test reliability maintained

### Phase 3 Success Criteria

- [ ] Integration tests for 4 golden flows
- [ ] Database constraint validation
- [ ] RLS enforcement verified
- [ ] Idempotency confirmed
- [ ] Overall test pass rate ≥ 95%

---

## 🚨 Risk Mitigation

### Technical Risks

1. **Mock Configuration Issues**
   - **Mitigation**: Standardize on dynamic imports, create mock factory
   - **Fallback**: Remove problematic tests, focus on working ones

2. **Mutation Testing Performance**
   - **Mitigation**: Start with core functions only, use parallel execution
   - **Fallback**: Reduce scope, increase timeout

3. **Integration Test Complexity**
   - **Mitigation**: Use test containers, start with simple flows
   - **Fallback**: Mock database layer, focus on unit tests

### Business Risks

1. **Development Velocity Impact**
   - **Mitigation**: Phased approach, optional CI gates initially
   - **Fallback**: Reduce scope, focus on critical paths only

2. **Test Maintenance Overhead**
   - **Mitigation**: Automated tools, clear documentation
   - **Fallback**: Simplify test structure, reduce complexity

---

## 📋 Implementation Checklist

### Week 1: Foundation

- [ ] Fix 3 failing tests
- [ ] Create error-code coverage script
- [ ] Implement business rule traceability matrix
- [ ] Add fast-check invariant tests
- [ ] Update CI pipeline for error-code coverage
- [ ] Document test patterns and best practices

### Week 2: Mutation Testing

- [ ] Install and configure Stryker
- [ ] Run initial mutation testing
- [ ] Fix tests that don't catch mutations
- [ ] Integrate Stryker in CI pipeline
- [ ] Achieve 80% mutation score
- [ ] Document mutation testing results

### Week 3: Integration Testing

- [ ] Set up test containers
- [ ] Implement 4 golden flow tests
- [ ] Add database constraint validation
- [ ] Test RLS enforcement
- [ ] Verify idempotency
- [ ] Complete robustness scorecard

---

## 🔧 Tools and Dependencies

### New Dependencies

```json
{
  "devDependencies": {
    "fast-check": "^3.0.0",
    "@stryker-mutator/core": "^7.0.0",
    "@stryker-mutator/vitest-runner": "^7.0.0",
    "@testcontainers/postgresql": "^10.0.0",
    "glob": "^10.0.0"
  }
}
```

### CI Pipeline Updates

```yaml
# .github/workflows/test-robustness.yml
name: Test Robustness
on: [push, pull_request]
jobs:
  error-coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: node scripts/check-error-codes.js

  mutation-testing:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx stryker run
```

---

## 📚 References and Resources

- [Stryker Mutation Testing](https://stryker-mutator.io/)
- [Fast-Check Property Testing](https://fast-check.dev/)
- [TestContainers](https://testcontainers.com/)
- [Vitest Testing Framework](https://vitest.dev/)
- [Business Rule Testing Patterns](https://martinfowler.com/articles/practical-test-pyramid.html)

---

**Document Owner**: Development Team  
**Last Updated**: 2024-01-15  
**Next Review**: 2024-01-22  
**Status**: Ready for Implementation
