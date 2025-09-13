# Unit Tests — Unit Testing Suite

> **TL;DR**: Comprehensive unit testing suite for individual functions, components, and modules to
> ensure code quality and reliability.  
> **Owner**: @aibos/test-team • **Status**: stable • **Since**: 2024-12  
> **Standards**: CommonMark • SemVer • Conventional Commits • Keep a Changelog

---

## 1) Scope & Boundaries

**Does**:

- Unit testing for individual functions
- Component testing for UI components
- Module testing for business logic
- Contract testing for API and database
- Mock testing for external dependencies
- Test coverage and quality assurance

**Does NOT**:

- Handle integration testing (delegated to integration tests)
- Manage E2E testing (delegated to E2E tests)
- Process performance testing (delegated to performance tests)
- Generate load testing (delegated to performance tests)

**Consumers**: @aibos/web, @aibos/web-api, @aibos/accounting, @aibos/db, external test systems

## 2) Quick Links

- **API Contract Tests**: `contracts/api-contract.test.ts`
- **Database Contract Tests**: `contracts/database-contract.test.ts`
- **Component Tests**: `components/`
- **Function Tests**: `functions/`
- **Module Tests**: `modules/`

## 3) Getting Started

```typescript
import {
  testApiContract,
  testDatabaseContract,
  testComponent,
  testFunction,
  testModule,
} from '@aibos/tests/unit';

// Test API contract
await testApiContract();

// Test database contract
await testDatabaseContract();

// Test component
await testComponent();
```

## 4) Architecture & Dependencies

**Dependencies**:

- Vitest for testing framework
- Testing Library (jest-dom) for DOM testing utilities
- @aibos/web for UI component testing
- @aibos/web-api for API testing
- @aibos/accounting for business logic testing
- @aibos/db for database testing

**Dependents**:

- @aibos/web for UI component testing
- @aibos/web-api for API testing
- @aibos/accounting for business logic testing
- External systems for unit testing

**Build Order**: Depends on @aibos/web, @aibos/web-api, @aibos/accounting, @aibos/db

## 5) Development Workflow

**Local Dev**:

```bash
pnpm test:vitest:watch
pnpm test:vitest unit/
```

**Testing**:

```bash
pnpm test:vitest unit/
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

### API Contract Testing

- `testApiContract` - Test API contract compliance
- `testApiEndpoint` - Test specific API endpoint
- `testApiSchema` - Test API schema validation

### Database Contract Testing

- `testDatabaseContract` - Test database contract compliance
- `testDatabaseSchema` - Test database schema validation
- `testDatabaseConstraints` - Test database constraints

### Component Testing

- `testComponent` - Test UI component
- `testComponentProps` - Test component props
- `testComponentState` - Test component state

### Function Testing

- `testFunction` - Test individual function
- `testFunctionInput` - Test function input validation
- `testFunctionOutput` - Test function output validation

### Module Testing

- `testModule` - Test module functionality
- `testModuleExports` - Test module exports
- `testModuleDependencies` - Test module dependencies

**Public Types**:

- `UnitTestConfig` - Unit test configuration
- `ComponentTestConfig` - Component test configuration
- `FunctionTestConfig` - Function test configuration
- `ModuleTestConfig` - Module test configuration

## 7) Performance & Monitoring

**Bundle Size**: ~10KB minified  
**Performance Budget**: <1s for unit test execution, <100ms for individual test steps  
**Monitoring**: Unit test performance monitoring

## 8) Security & Compliance

**Permissions**:

- Unit testing requires proper authentication
- Component testing requires authorization
- Module testing requires security clearance

**Data Handling**:

- All test data validated and sanitized
- Secure unit testing
- Audit trail for unit test operations

**Compliance**:

- V1 compliance for unit test operations
- SoD enforcement for unit test execution
- Security audit compliance

## 9) Usage Examples

### API Contract Testing

```typescript
import { testApiContract } from '@aibos/tests/unit';

// Test API contract
async function testApiContract() {
  const contract = {
    endpoint: '/api/v1/invoices',
    method: 'POST',
    requestSchema: {
      type: 'object',
      properties: {
        customerId: { type: 'string' },
        amount: { type: 'number' },
        dueDate: { type: 'string', format: 'date' },
      },
      required: ['customerId', 'amount', 'dueDate'],
    },
    responseSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        status: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
      },
      required: ['id', 'status', 'createdAt'],
    },
  };

  const result = await testApiContract(contract);

  if (result.valid) {
    console.log('API contract is valid');
  } else {
    console.error('API contract validation failed:', result.errors);
  }
}
```

### Database Contract Testing

```typescript
import { testDatabaseContract } from '@aibos/tests/unit';

// Test database contract
async function testDatabaseContract() {
  const contract = {
    table: 'gl_journal',
    schema: {
      id: { type: 'string', primaryKey: true },
      tenantId: { type: 'string', notNull: true },
      companyId: { type: 'string', notNull: true },
      journalDate: { type: 'date', notNull: true },
      description: { type: 'string', maxLength: 255 },
      status: { type: 'enum', values: ['draft', 'posted', 'reversed'] },
    },
    constraints: [
      { type: 'foreignKey', column: 'tenantId', references: 'tenants.id' },
      { type: 'foreignKey', column: 'companyId', references: 'companies.id' },
      { type: 'check', condition: "journalDate >= '2020-01-01'" },
    ],
  };

  const result = await testDatabaseContract(contract);

  if (result.valid) {
    console.log('Database contract is valid');
  } else {
    console.error('Database contract validation failed:', result.errors);
  }
}
```

### Component Testing

```typescript
import { testComponent } from "@aibos/tests/unit";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { InvoiceForm } from "@aibos/ui/components/invoices/InvoiceForm";

// Test component
async function testInvoiceForm() {
  const testConfig = {
    component: InvoiceForm,
    props: {
      onSubmit: vi.fn(),
      onCancel: vi.fn(),
      initialData: {
        customerId: "customer-123",
        amount: 1000,
        dueDate: "2024-02-15",
      },
    },
    testCases: [
      {
        name: "renders form fields",
        test: () => {
          render(<InvoiceForm {...testConfig.props} />);
          expect(screen.getByLabelText("Customer ID")).toBeInTheDocument();
          expect(screen.getByLabelText("Amount")).toBeInTheDocument();
          expect(screen.getByLabelText("Due Date")).toBeInTheDocument();
        },
      },
      {
        name: "validates required fields",
        test: () => {
          render(<InvoiceForm {...testConfig.props} />);
          const submitButton = screen.getByRole("button", { name: "Submit" });
          submitButton.click();
          expect(
            screen.getByText("Customer ID is required")
          ).toBeInTheDocument();
        },
      },
    ],
  };

  const result = await testComponent(testConfig);

  if (result.success) {
    console.log("Component test passed");
  } else {
    console.error("Component test failed:", result.errors);
  }
}
```

### Function Testing

```typescript
import { testFunction } from '@aibos/tests/unit';
import { calculateInvoiceTotal } from '@aibos/accounting/invoices';

// Test function
async function testCalculateInvoiceTotal() {
  const testConfig = {
    function: calculateInvoiceTotal,
    testCases: [
      {
        name: 'calculates total with tax',
        input: {
          subtotal: 1000,
          taxRate: 0.1,
          discount: 0,
        },
        expected: 1100,
      },
      {
        name: 'calculates total with discount',
        input: {
          subtotal: 1000,
          taxRate: 0.1,
          discount: 100,
        },
        expected: 990,
      },
      {
        name: 'handles zero subtotal',
        input: {
          subtotal: 0,
          taxRate: 0.1,
          discount: 0,
        },
        expected: 0,
      },
    ],
  };

  const result = await testFunction(testConfig);

  if (result.success) {
    console.log('Function test passed');
  } else {
    console.error('Function test failed:', result.errors);
  }
}
```

### Module Testing

```typescript
import { testModule } from '@aibos/tests/unit';
import * as invoiceModule from '@aibos/accounting/invoices';

// Test module
async function testInvoiceModule() {
  const testConfig = {
    module: invoiceModule,
    exports: ['calculateInvoiceTotal', 'validateInvoice', 'createInvoice', 'updateInvoice'],
    dependencies: ['@aibos/db', '@aibos/utils'],
    testCases: [
      {
        name: 'exports all required functions',
        test: () => {
          expect(invoiceModule.calculateInvoiceTotal).toBeDefined();
          expect(invoiceModule.validateInvoice).toBeDefined();
          expect(invoiceModule.createInvoice).toBeDefined();
          expect(invoiceModule.updateInvoice).toBeDefined();
        },
      },
      {
        name: 'handles module initialization',
        test: () => {
          expect(() => invoiceModule.initialize()).not.toThrow();
        },
      },
    ],
  };

  const result = await testModule(testConfig);

  if (result.success) {
    console.log('Module test passed');
  } else {
    console.error('Module test failed:', result.errors);
  }
}
```

### Mock Testing

```typescript
import { testFunction } from '@aibos/tests/unit';
import { vi } from 'vitest';
import { sendEmail } from '@aibos/utils/email';

// Test function with mocks
async function testSendEmail() {
  // Mock external dependencies
  const mockEmailService = {
    send: vi.fn().mockResolvedValue({ success: true }),
  };

  const testConfig = {
    function: sendEmail,
    mocks: {
      '@aibos/utils/email': mockEmailService,
    },
    testCases: [
      {
        name: 'sends email successfully',
        input: {
          to: 'test@example.com',
          subject: 'Test Email',
          body: 'Test content',
        },
        expected: { success: true },
      },
      {
        name: 'handles email service failure',
        input: {
          to: 'test@example.com',
          subject: 'Test Email',
          body: 'Test content',
        },
        setup: () => {
          mockEmailService.send.mockRejectedValue(new Error('Email service unavailable'));
        },
        expected: { success: false, error: 'Email service unavailable' },
      },
    ],
  };

  const result = await testFunction(testConfig);

  if (result.success) {
    console.log('Mock test passed');
  } else {
    console.error('Mock test failed:', result.errors);
  }
}
```

### Advanced Unit Testing

```typescript
import {
  testApiContract,
  testDatabaseContract,
  testComponent,
  testFunction,
  testModule,
} from '@aibos/tests/unit';

// Comprehensive unit testing suite
async function runUnitTests() {
  const results = {
    api: null,
    database: null,
    components: [],
    functions: [],
    modules: [],
  };

  try {
    // Test API contracts
    results.api = await testApiContract({
      endpoint: '/api/v1/invoices',
      method: 'POST',
      requestSchema: invoiceRequestSchema,
      responseSchema: invoiceResponseSchema,
    });

    // Test database contracts
    results.database = await testDatabaseContract({
      table: 'gl_journal',
      schema: journalSchema,
      constraints: journalConstraints,
    });

    // Test components
    const components = ['InvoiceForm', 'BillForm', 'JournalForm', 'ReportViewer'];

    for (const component of components) {
      const result = await testComponent({
        component: getComponent(component),
        props: getComponentProps(component),
        testCases: getComponentTestCases(component),
      });
      results.components.push({ component, result });
    }

    // Test functions
    const functions = [
      'calculateInvoiceTotal',
      'validateInvoice',
      'createInvoice',
      'updateInvoice',
    ];

    for (const func of functions) {
      const result = await testFunction({
        function: getFunction(func),
        testCases: getFunctionTestCases(func),
      });
      results.functions.push({ function: func, result });
    }

    // Test modules
    const modules = [
      '@aibos/accounting/invoices',
      '@aibos/accounting/bills',
      '@aibos/accounting/journals',
      '@aibos/accounting/reports',
    ];

    for (const module of modules) {
      const result = await testModule({
        module: getModule(module),
        exports: getModuleExports(module),
        testCases: getModuleTestCases(module),
      });
      results.modules.push({ module, result });
    }

    console.log('All unit tests completed:', results);
  } catch (error) {
    console.error('Unit test suite failed:', error);
    throw error;
  }

  return results;
}
```

## 10) Troubleshooting

**Common Issues**:

- **Test Timeout**: Check test configuration and timeout settings
- **Mock Failures**: Verify mock setup and expectations
- **Component Rendering**: Check component props and test environment
- **Function Errors**: Verify function input and output validation

**Debug Mode**:

```typescript
// Enable detailed logging
process.env.DEBUG_UNIT = 'true';
```

**Logs**: Check test logs for unit test execution details

## 11) Contributing

**Code Style**:

- Follow TypeScript best practices
- Use descriptive test names
- Implement comprehensive unit testing
- Document complex test scenarios

**Testing**:

- Test all unit test functions
- Test component rendering
- Test function behavior
- Test module functionality

**Review Process**:

- All unit tests must be validated
- Test scenarios must be comprehensive
- Performance must be optimized
- Security must be verified

---

## 📚 **Additional Resources**

- [Tests README](../README.md)
- [Integration Tests](../integration/README.md)
- [E2E Tests](../e2e/README.md)
- [Contract Tests](../contracts/README.md)
- [Performance Tests](../performance/README.md)

---

**Last Updated**: 2025-09-13 • **Version**: 0.1.0
