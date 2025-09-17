# Test Configuration Documentation

## Overview

This directory contains comprehensive test configurations for the Accounting SaaS application, ensuring deterministic, reproducible, and compliant testing across all environments.

## Configuration Files

### 1. Deterministic Test Data (`deterministic-test-data.ts`)

**Purpose**: Ensures consistent, predictable test data across all test suites.

**Key Features**:

- Malaysian-specific test data (company registration numbers, addresses, tax rates)
- Deterministic data generation using fixed seeds
- Consistent test data across all test runs
- Malaysian compliance data (SST rates, corporate tax rates, etc.)

**Usage**:

```typescript
import { createTestCustomer, createTestInvoice, resetTestData } from "./deterministic-test-data";

// Reset data before each test
beforeEach(() => {
  resetTestData();
});

// Use deterministic data
const customer = createTestCustomer();
const invoice = createTestInvoice(customer.id);
```

### 2. Vitest Deterministic Configuration (`vitest-deterministic.config.ts`)

**Purpose**: Ensures consistent unit and integration test execution.

**Key Features**:

- Sequential test execution (no parallelization)
- Fixed test seed (12345) for deterministic data
- Consistent coverage reporting
- Malaysian locale and timezone settings
- Deterministic timeouts and retry policies

**Usage**:

```bash
# Run deterministic unit tests
npx vitest --config tests/config/vitest-deterministic.config.ts

# Run with coverage
npx vitest --config tests/config/vitest-deterministic.config.ts --coverage
```

### 3. Playwright Deterministic Configuration (`playwright-deterministic.config.ts`)

**Purpose**: Ensures consistent end-to-end test execution.

**Key Features**:

- Sequential test execution
- Fixed browser settings and viewport
- Malaysian locale and timezone
- Deterministic test data injection
- Consistent screenshot and video capture

**Usage**:

```bash
# Run deterministic E2E tests
npx playwright test --config tests/config/playwright-deterministic.config.ts

# Run with UI mode
npx playwright test --config tests/config/playwright-deterministic.config.ts --ui
```

### 4. K6 Deterministic Configuration (`k6-deterministic.config.js`)

**Purpose**: Ensures consistent performance test execution.

**Key Features**:

- Fixed test stages and iterations
- Deterministic test data selection
- Consistent load patterns
- Malaysian-specific test scenarios
- Fixed thresholds and timeouts

**Usage**:

```bash
# Run deterministic performance tests
k6 run tests/config/k6-deterministic.config.js

# Run with custom environment
k6 run tests/config/k6-deterministic.config.js --env BASE_URL=http://localhost:3000
```

## Test Data Management

### Malaysian Compliance Data

The test configurations include comprehensive Malaysian compliance data:

- **Company Registration Numbers**: Valid Malaysian company registration format (e.g., "123456-A")
- **Addresses**: Realistic Malaysian addresses with proper postcodes
- **Tax Rates**: Current Malaysian tax rates (SST 6%, Corporate Tax 24%)
- **Currencies**: Malaysian Ringgit (MYR) as primary currency
- **Phone Numbers**: Malaysian phone number format (+60 3-1234 5678)
- **Email Domains**: Malaysian email domains (.com.my, .net.my)

### Deterministic Data Generation

All test data is generated using a fixed seed (12345) to ensure:

- Consistent data across test runs
- Reproducible test results
- Predictable test behavior
- Easy debugging and troubleshooting

## Best Practices

### 1. Test Isolation

- Each test uses fresh, deterministic data
- Tests are run sequentially to avoid conflicts
- Proper cleanup after each test
- No shared state between tests

### 2. Malaysian Compliance

- All test data follows Malaysian business practices
- Tax calculations use current Malaysian rates
- Company structures follow Malaysian regulations
- Financial reporting follows MFRS standards

### 3. Performance Consistency

- Fixed test durations and iterations
- Consistent load patterns
- Deterministic thresholds
- Reproducible performance metrics

### 4. Error Handling

- Comprehensive error scenarios
- Malaysian-specific error messages
- Proper validation of Malaysian business rules
- Consistent error reporting

## Environment Variables

### Required Environment Variables

```bash
# Base URL for testing
BASE_URL=http://localhost:3000

# API Key for authentication
API_KEY=test-api-key

# Test configuration
TEST_DETERMINISTIC=true
TEST_SEED=12345

# Malaysian locale settings
TZ=Asia/Kuala_Lumpur
LANG=en_MY
```

### Optional Environment Variables

```bash
# Playwright specific
PLAYWRIGHT_BASE_URL=http://localhost:3000

# K6 specific
K6_BASE_URL=http://localhost:3000
K6_API_KEY=test-api-key

# Coverage thresholds
COVERAGE_THRESHOLD=95
```

## Running Tests

### Unit and Integration Tests

```bash
# Run all deterministic tests
npm run test:deterministic

# Run specific test suite
npm run test:unit:deterministic
npm run test:integration:deterministic
npm run test:validation:deterministic
```

### End-to-End Tests

```bash
# Run deterministic E2E tests
npm run test:e2e:deterministic

# Run with specific browser
npm run test:e2e:deterministic -- --project=chromium-deterministic
```

### Performance Tests

```bash
# Run deterministic performance tests
npm run test:performance:deterministic

# Run with custom load
k6 run tests/config/k6-deterministic.config.js --env VUS=20
```

## Troubleshooting

### Common Issues

1. **Test Data Inconsistency**: Ensure `resetTestData()` is called before each test
2. **Flaky Tests**: Check that tests are running sequentially and not in parallel
3. **Performance Variations**: Verify that test data is deterministic and load patterns are consistent
4. **Malaysian Compliance Issues**: Ensure test data follows Malaysian business practices

### Debug Mode

```bash
# Run tests in debug mode
DEBUG=true npm run test:deterministic

# Run with verbose output
npm run test:deterministic -- --reporter=verbose
```

## Maintenance

### Updating Test Data

1. Update `deterministic-test-data.ts` with new test data
2. Ensure Malaysian compliance data is current
3. Update test configurations if needed
4. Run tests to verify changes

### Updating Configurations

1. Modify configuration files as needed
2. Update documentation
3. Test configurations with sample tests
4. Deploy changes to CI/CD pipeline

## Compliance Validation

The test configurations include comprehensive compliance validation:

- **MFRS Compliance**: Malaysian Financial Reporting Standards
- **Tax Compliance**: SST, Corporate Tax, Withholding Tax
- **Regulatory Compliance**: Companies Act 2016, Bursa Malaysia
- **Multi-Currency Support**: MYR, SGD, USD, EUR, GBP
- **Consolidation Features**: Multi-company consolidation and reporting

This ensures that the Accounting SaaS application meets all Malaysian regulatory requirements and business practices.
