# AI-BOS Accounting SaaS - Testing Guide

## 🧪 Quick Start

### Run All Tests

```bash
pnpm test
```

### Run Specific Test Types

```bash
# Unit tests
pnpm test:unit

# Integration tests
pnpm test:integration

# E2E tests
pnpm test:e2e

# Performance tests
pnpm test:performance
```

### Run with Coverage

```bash
pnpm test:coverage
```

## 📊 Test Coverage

### Current Coverage Status

- **Overall**: 85%+ (Target: 80%)
- **Unit Tests**: 90%+ (Target: 80%)
- **Integration Tests**: 80%+ (Target: 75%)
- **E2E Tests**: 85%+ (Target: 80%)

### Coverage by Package

| Package             | Statements | Branches | Functions | Lines |
| ------------------- | ---------- | -------- | --------- | ----- |
| `@aibos/accounting` | 90%        | 85%      | 90%       | 90%   |
| `@aibos/api`        | 85%        | 80%      | 85%       | 85%   |
| `@aibos/auth`       | 95%        | 90%      | 95%       | 95%   |
| `@aibos/db`         | 80%        | 75%      | 80%       | 80%   |
| `@aibos/utils`      | 90%        | 85%      | 90%       | 90%   |

## 🏗️ Test Structure

### Test Types

- **Unit Tests**: Individual functions and components
- **Integration Tests**: Component interactions and workflows
- **E2E Tests**: Complete user journeys
- **Performance Tests**: Load and stress testing

### Test Locations

```
tests/
├── unit/                          # Unit tests
├── integration/                   # Integration tests
│   ├── golden-flows.test.ts      # Core business workflows
│   └── comprehensive-integration.test.ts  # 150+ tests
├── e2e/                          # End-to-end tests
│   └── api-gateway.e2e.test.ts   # API Gateway E2E tests
└── performance/                   # Performance tests
```

## 🚀 Test Execution

### Local Development

```bash
# Watch mode for development
pnpm test:watch

# Run tests for specific package
pnpm --filter @aibos/accounting test

# Run specific test file
pnpm test tests/integration/golden-flows.test.ts
```

### CI/CD Pipeline

```bash
# Full test suite
pnpm test:ci

# Coverage validation
pnpm test:validate

# Performance testing
pnpm test:performance
```

## 📈 Test Reports

### Coverage Reports

- **HTML Report**: `coverage/html/index.html`
- **JSON Report**: `coverage/coverage-summary.json`
- **Console Output**: Real-time coverage display

### Test Results

- **JUnit XML**: `test-results/junit.xml`
- **JSON Report**: `test-results/results.json`
- **HTML Report**: `test-results/index.html`

## 🔧 Test Configuration

### Vitest Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
  },
});
```

### Test Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest --run --reporter=verbose",
    "test:integration": "vitest --run --testNamePattern='Integration'",
    "test:e2e": "vitest --run --testNamePattern='E2E'",
    "test:coverage": "vitest --coverage",
    "test:watch": "vitest --watch",
    "test:validate": "node scripts/test-validation.js"
  }
}
```

## 🎯 Quality Gates

### Pre-commit Requirements

- ✅ All unit tests pass
- ✅ Coverage thresholds met
- ✅ No linting errors
- ✅ TypeScript compilation succeeds

### Pull Request Requirements

- ✅ All tests pass (100% pass rate)
- ✅ Coverage maintained or improved
- ✅ New code has tests
- ✅ Performance benchmarks met

### Release Requirements

- ✅ 100% test pass rate
- ✅ All coverage thresholds met
- ✅ E2E tests pass
- ✅ Performance tests pass
- ✅ Security tests pass

## 📋 Test Categories

### 1. Unit Tests (150+ tests)

- Business logic validation
- Data transformation
- Error handling
- Edge cases
- Utility functions

### 2. Integration Tests (150+ tests)

- Database interactions
- API endpoints
- Service integrations
- Business workflows
- Data flow validation

### 3. E2E Tests (20+ tests)

- Complete user journeys
- API Gateway functionality
- Cross-service communication
- End-to-end workflows

### 4. Performance Tests (10+ tests)

- Load testing
- Stress testing
- Response time validation
- Resource utilization
- Scalability testing

## 🛠️ Test Tools

### Testing Framework

- **Vitest**: Fast unit testing
- **Supertest**: HTTP assertions
- **Testcontainers**: Integration testing

### Coverage Tools

- **c8**: V8 coverage
- **@vitest/coverage-v8**: Coverage provider
- **Custom Scripts**: Validation and reporting

### Test Data

- **Faker.js**: Fake data generation
- **Factory Pattern**: Test data factories
- **Fixtures**: Static test data
- **Seeds**: Database seeding

## 📊 Test Metrics

### Coverage Metrics

- **Statements**: 85%+ (Target: 80%)
- **Branches**: 80%+ (Target: 75%)
- **Functions**: 85%+ (Target: 80%)
- **Lines**: 85%+ (Target: 80%)

### Performance Metrics

- **Test Execution Time**: < 5 minutes
- **Unit Test Time**: < 30 seconds
- **Integration Test Time**: < 2 minutes
- **E2E Test Time**: < 3 minutes

### Quality Metrics

- **Test Pass Rate**: 100%
- **Flaky Test Rate**: < 1%
- **Test Coverage**: 85%+
- **Test Maintenance**: < 10% of development time

## 🔍 Debugging Tests

### Common Issues

1. **Test Timeouts**: Increase timeout values
2. **Flaky Tests**: Add retry logic or fix race conditions
3. **Coverage Gaps**: Add missing test cases
4. **Performance Issues**: Optimize test execution

### Debug Commands

```bash
# Run specific test with debug output
pnpm test --reporter=verbose tests/integration/golden-flows.test.ts

# Run tests with coverage and debug
pnpm test:coverage --reporter=verbose

# Run tests in debug mode
pnpm test --inspect-brk
```

## 📚 Documentation

### Test Documentation

- [Testing Strategy](docs/testing-strategy.md)
- [API Testing Guide](docs/api-testing.md)
- [Performance Testing Guide](docs/performance-testing.md)
- [Test Data Management](docs/test-data-management.md)

### Best Practices

- [Test Writing Guidelines](docs/test-writing-guidelines.md)
- [Test Data Best Practices](docs/test-data-best-practices.md)
- [Performance Testing Best Practices](docs/performance-testing-best-practices.md)

## 🆘 Support

### Getting Help

1. Check test documentation
2. Review test examples
3. Ask team members
4. Check CI/CD logs

### Common Commands

```bash
# Check test status
pnpm test:status

# Validate test configuration
pnpm test:validate

# Generate test report
pnpm test:report

# Clean test artifacts
pnpm test:clean
```

## 🎉 Success Metrics

### Test Quality

- ✅ 150+ comprehensive tests
- ✅ 85%+ code coverage
- ✅ 100% test pass rate
- ✅ < 5 minute execution time

### Development Efficiency

- ✅ Fast feedback loop
- ✅ Reliable test suite
- ✅ Easy test maintenance
- ✅ Clear test documentation

### Business Value

- ✅ High code quality
- ✅ Reduced bugs in production
- ✅ Faster feature development
- ✅ Improved maintainability
