# Unit Testing Implementation Checklist
## Phase-by-Phase Implementation Guide

**Document Version**: 1.0  
**Created**: 2024-01-15  
**Status**: Ready for Implementation  
**Target**: 95%+ Test Reliability with Business Logic Validation

---

## 🎯 Quick Start

```bash
# Install new dependencies
pnpm install

# Run error code coverage check
pnpm test:error-codes

# Run invariant tests
pnpm test:invariants

# Run mutation testing
pnpm test:mutation

# Run all robustness tests
pnpm test:robustness
```

---

## 📋 Phase 1: Foundation (Week 1)

### ✅ Completed Tasks

- [x] **Business Rule Traceability Matrix**
  - [x] Created comprehensive matrix covering 72 business rules
  - [x] 100% coverage across all categories
  - [x] Documented in `.dev-document/business-rule-traceability-matrix.md`

- [x] **Error Code Coverage Script**
  - [x] Created `scripts/check-error-codes.js`
  - [x] Added to package.json scripts as `test:error-codes`
  - [x] Supports CI integration

- [x] **Invariant Testing with fast-check**
  - [x] Created `tests/invariants/journal-balance.test.ts`
  - [x] Property-based testing for journal balance
  - [x] FX round-trip validation
  - [x] Payment processing invariants

- [x] **Stryker Configuration**
  - [x] Created `stryker.conf.cjs`
  - [x] Configured for core business logic files
  - [x] Set 80% mutation score threshold

- [x] **Integration Test Setup**
  - [x] Created `tests/integration/golden-flows.test.ts`
  - [x] Test containers configuration
  - [x] 4 golden flow scenarios

- [x] **Package.json Updates**
  - [x] Added new dependencies
  - [x] Added new test scripts
  - [x] Added robustness test command

- [x] **GitHub Actions Workflow**
  - [x] Created `.github/workflows/test-robustness.yml`
  - [x] Error coverage, invariant, mutation, and integration tests
  - [x] Artifact collection and reporting

### 🔄 In Progress Tasks

- [ ] **Fix Current Test Failures**
  - [ ] Fix mock configuration issues in payment-processing.test.ts
  - [ ] Resolve FX validation inconsistencies
  - [ ] Ensure all tests use dynamic imports consistently

### ⏳ Pending Tasks

- [ ] **Install Dependencies**
  ```bash
  pnpm install
  ```

- [ ] **Run Error Code Coverage**
  ```bash
  pnpm test:error-codes
  ```

- [ ] **Run Invariant Tests**
  ```bash
  pnpm test:invariants
  ```

- [ ] **Test Mutation Testing Setup**
  ```bash
  pnpm test:mutation
  ```

---

## 📋 Phase 2: Mutation Testing (Week 2)

### ⏳ Pending Tasks

- [ ] **Install Stryker Dependencies**
  ```bash
  pnpm install @stryker-mutator/core @stryker-mutator/vitest-runner
  ```

- [ ] **Run Initial Mutation Testing**
  ```bash
  pnpm test:mutation
  ```

- [ ] **Analyze Mutation Results**
  - [ ] Review mutation report
  - [ ] Identify weak tests
  - [ ] Fix tests that don't catch mutations

- [ ] **Achieve 80% Mutation Score**
  - [ ] Improve test coverage
  - [ ] Add edge case tests
  - [ ] Verify mutation score threshold

- [ ] **CI Integration**
  - [ ] Verify GitHub Actions workflow
  - [ ] Test artifact collection
  - [ ] Validate reporting

---

## 📋 Phase 3: Integration Testing (Week 3)

### ⏳ Pending Tasks

- [ ] **Install Test Containers**
  ```bash
  pnpm install @testcontainers/postgresql
  ```

- [ ] **Set Up Test Database**
  - [ ] Configure PostgreSQL container
  - [ ] Set up test data
  - [ ] Verify database connectivity

- [ ] **Implement Golden Flow Tests**
  - [ ] Invoice posting workflow
  - [ ] Payment processing workflow
  - [ ] Bill posting workflow
  - [ ] Manual journal entry workflow

- [ ] **Add Database Constraint Validation**
  - [ ] Foreign key constraints
  - [ ] Unique constraints
  - [ ] Check constraints

- [ ] **Test RLS Enforcement**
  - [ ] User-based access control
  - [ ] Company-based isolation
  - [ ] Role-based permissions

- [ ] **Verify Idempotency**
  - [ ] Duplicate request handling
  - [ ] Transaction rollback
  - [ ] State consistency

---

## 🛠️ Implementation Commands

### Daily Commands

```bash
# Check error code coverage
pnpm test:error-codes

# Run invariant tests
pnpm test:invariants

# Run all unit tests
pnpm test:unit

# Run integration tests
pnpm test:integration:all
```

### Weekly Commands

```bash
# Run mutation testing
pnpm test:mutation

# Run all robustness tests
pnpm test:robustness

# Generate coverage report
pnpm test:unit:coverage
```

### CI Commands

```bash
# Full test suite
pnpm test:all

# Robustness testing
pnpm test:robustness

# Quality checks
pnpm quality:check
```

---

## 📊 Success Metrics

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

## 🚨 Troubleshooting

### Common Issues

1. **Mock Configuration Issues**
   ```bash
   # Check mock setup
   pnpm test:unit --reporter=verbose
   
   # Fix dynamic imports
   # Ensure all tests use: const { function } = await import('@aibos/accounting');
   ```

2. **Mutation Testing Failures**
   ```bash
   # Check mutation report
   cat reports/mutation/mutation-report.html
   
   # Fix weak tests
   # Add more assertions
   # Test edge cases
   ```

3. **Integration Test Failures**
   ```bash
   # Check test container logs
   docker logs testcontainers-postgresql
   
   # Verify database connectivity
   pnpm test:database
   ```

4. **Error Code Coverage Failures**
   ```bash
   # Check missing error codes
   pnpm test:error-codes
   
   # Add tests for missing codes
   # Update test files
   ```

---

## 📚 Resources

### Documentation

- [Unit Testing Strategy](.dev-document/unit-testing-robustness-strategy.md)
- [Business Rule Matrix](.dev-document/business-rule-traceability-matrix.md)
- [Implementation Checklist](.dev-document/unit-testing-implementation-checklist.md)

### Tools

- [Stryker Mutation Testing](https://stryker-mutator.io/)
- [Fast-Check Property Testing](https://fast-check.dev/)
- [TestContainers](https://testcontainers.com/)
- [Vitest Testing Framework](https://vitest.dev/)

### Scripts

- `scripts/check-error-codes.js` - Error code coverage checker
- `stryker.conf.cjs` - Mutation testing configuration
- `.github/workflows/test-robustness.yml` - CI workflow

---

## 📞 Support

### Team Contacts

- **Development Team**: For implementation questions
- **QA Team**: For test strategy guidance
- **DevOps Team**: For CI/CD integration

### Escalation Path

1. Check troubleshooting section
2. Review documentation
3. Ask team for help
4. Escalate to leads

---

**Document Owner**: Development Team  
**Last Updated**: 2024-01-15  
**Next Review**: 2024-01-22  
**Status**: Ready for Implementation
