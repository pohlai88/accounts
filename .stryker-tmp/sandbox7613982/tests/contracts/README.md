# DOC-274: Documentation

**Version**: 1.0  
**Date**: 2025-09-17  
**Status**: Active  
**Owner**: Development Team  
**Last Updated**: 2025-09-17  
**Next Review**: 2025-12-17  

---

# Contracts — API and Database Contract Testing

> **TL;DR**: Contract testing for API endpoints and database schemas to ensure compatibility and
> prevent breaking changes.  
> **Owner**: @aibos/test-team • **Status**: stable • **Since**: 2024-12  
> **Standards**: CommonMark • SemVer • Conventional Commits • Keep a Changelog

---

## 1) Scope & Boundaries

**Does**:

- API contract testing
- Database schema contract testing
- API endpoint validation
- Database constraint validation
- Schema compatibility testing
- Breaking change detection

**Does NOT**:

- Handle business logic testing (delegated to unit tests)
- Manage integration testing (delegated to integration tests)
- Process E2E testing (delegated to E2E tests)
- Generate performance testing (delegated to performance tests)

**Consumers**: @aibos/web-api, @aibos/db, external API consumers

## 2) Quick Links

- **API Contracts**: `api-contract.test.ts`
- **Database Contracts**: `database-contract.test.ts`
- **Contract Schemas**: `schemas/`
- **Contract Validators**: `validators/`

## 3) Getting Started

```typescript
import {
  validateApiContract,
  validateDatabaseContract,
  validateSchemaCompatibility,
} from "@aibos/tests/contracts";

// Validate API contract
await validateApiContract({
  endpoint: "/api/v1/invoices",
  method: "POST",
  requestSchema: invoiceRequestSchema,
  responseSchema: invoiceResponseSchema,
});

// Validate database contract
await validateDatabaseContract({
  table: "gl_journal",
  schema: journalSchema,
  constraints: journalConstraints,
});
```

## 4) Architecture & Dependencies

**Dependencies**:

- Vitest for testing framework
- Zod for schema validation
- @aibos/contracts for contract definitions
- @aibos/db for database access
- @aibos/web-api for API access

**Dependents**:

- @aibos/web-api for API contract validation
- @aibos/db for database contract validation
- External systems for contract compliance

**Build Order**: Depends on @aibos/contracts, @aibos/db, @aibos/web-api

## 5) Development Workflow

**Local Dev**:

```bash
pnpm test:vitest:watch
pnpm test:vitest contracts/
```

**Testing**:

```bash
pnpm test:vitest contracts/
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

- `validateApiContract` - Validate API contract compliance
- `validateApiEndpoint` - Validate specific API endpoint
- `validateApiSchema` - Validate API schema compatibility

### Database Contract Testing

- `validateDatabaseContract` - Validate database contract compliance
- `validateDatabaseSchema` - Validate database schema compatibility
- `validateDatabaseConstraints` - Validate database constraints

### Schema Validation

- `validateSchemaCompatibility` - Validate schema compatibility
- `validateSchemaBreakingChanges` - Detect schema breaking changes
- `validateSchemaVersioning` - Validate schema versioning

**Public Types**:

- `ApiContract` - API contract interface
- `DatabaseContract` - Database contract interface
- `SchemaContract` - Schema contract interface
- `ContractValidationResult` - Contract validation result

## 7) Performance & Monitoring

**Bundle Size**: ~10KB minified  
**Performance Budget**: <1s for contract validation, <500ms for schema validation  
**Monitoring**: Contract validation performance monitoring

## 8) Security & Compliance

**Permissions**:

- Contract validation requires proper authentication
- Schema validation requires authorization
- Breaking change detection requires security clearance

**Data Handling**:

- All contract data validated and sanitized
- Secure schema validation
- Audit trail for contract changes

**Compliance**:

- V1 compliance for contract operations
- SoD enforcement for contract validation
- Security audit compliance

## 9) Usage Examples

### API Contract Testing

```typescript
import { validateApiContract } from "@aibos/tests/contracts";

// Test invoice API contract
async function testInvoiceApiContract() {
  const contract = {
    endpoint: "/api/v1/invoices",
    method: "POST",
    requestSchema: {
      type: "object",
      properties: {
        customerId: { type: "string" },
        amount: { type: "number" },
        dueDate: { type: "string", format: "date" },
      },
      required: ["customerId", "amount", "dueDate"],
    },
    responseSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        status: { type: "string" },
        createdAt: { type: "string", format: "date-time" },
      },
      required: ["id", "status", "createdAt"],
    },
  };

  const result = await validateApiContract(contract);

  if (result.valid) {
    console.log("API contract is valid");
  } else {
    console.error("API contract validation failed:", result.errors);
  }
}
```

### Database Contract Testing

```typescript
import { validateDatabaseContract } from "@aibos/tests/contracts";

// Test journal table contract
async function testJournalTableContract() {
  const contract = {
    table: "gl_journal",
    schema: {
      id: { type: "string", primaryKey: true },
      tenantId: { type: "string", notNull: true },
      companyId: { type: "string", notNull: true },
      journalDate: { type: "date", notNull: true },
      description: { type: "string", maxLength: 255 },
      status: { type: "enum", values: ["draft", "posted", "reversed"] },
    },
    constraints: [
      { type: "foreignKey", column: "tenantId", references: "tenants.id" },
      { type: "foreignKey", column: "companyId", references: "companies.id" },
      { type: "check", condition: "journalDate >= '2020-01-01'" },
    ],
  };

  const result = await validateDatabaseContract(contract);

  if (result.valid) {
    console.log("Database contract is valid");
  } else {
    console.error("Database contract validation failed:", result.errors);
  }
}
```

### Schema Compatibility Testing

```typescript
import { validateSchemaCompatibility } from "@aibos/tests/contracts";

// Test schema compatibility between versions
async function testSchemaCompatibility() {
  const oldSchema = {
    type: "object",
    properties: {
      id: { type: "string" },
      name: { type: "string" },
      email: { type: "string" },
    },
    required: ["id", "name"],
  };

  const newSchema = {
    type: "object",
    properties: {
      id: { type: "string" },
      name: { type: "string" },
      email: { type: "string" },
      phone: { type: "string" }, // New optional field
    },
    required: ["id", "name"],
  };

  const result = await validateSchemaCompatibility(oldSchema, newSchema);

  if (result.compatible) {
    console.log("Schemas are compatible");
  } else {
    console.error("Schema compatibility issues:", result.issues);
  }
}
```

### Breaking Change Detection

```typescript
import { validateSchemaBreakingChanges } from "@aibos/tests/contracts";

// Detect breaking changes in API schema
async function detectBreakingChanges() {
  const oldApiSchema = {
    "/api/v1/invoices": {
      POST: {
        request: {
          type: "object",
          properties: {
            customerId: { type: "string" },
            amount: { type: "number" },
          },
          required: ["customerId", "amount"],
        },
      },
    },
  };

  const newApiSchema = {
    "/api/v1/invoices": {
      POST: {
        request: {
          type: "object",
          properties: {
            customerId: { type: "string" },
            amount: { type: "number" },
            currency: { type: "string" }, // New required field
          },
          required: ["customerId", "amount", "currency"],
        },
      },
    },
  };

  const result = await validateSchemaBreakingChanges(oldApiSchema, newApiSchema);

  if (result.hasBreakingChanges) {
    console.error("Breaking changes detected:", result.breakingChanges);
  } else {
    console.log("No breaking changes detected");
  }
}
```

### Contract Versioning

```typescript
import { validateSchemaVersioning } from "@aibos/tests/contracts";

// Validate schema versioning
async function validateSchemaVersioning() {
  const schemas = {
    "v1.0.0": {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
      },
    },
    "v1.1.0": {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        email: { type: "string" },
      },
    },
    "v2.0.0": {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
      },
    },
  };

  const result = await validateSchemaVersioning(schemas);

  if (result.valid) {
    console.log("Schema versioning is valid");
  } else {
    console.error("Schema versioning issues:", result.issues);
  }
}
```

### Contract Testing Suite

```typescript
import {
  validateApiContract,
  validateDatabaseContract,
  validateSchemaCompatibility,
  validateSchemaBreakingChanges,
} from "@aibos/tests/contracts";

// Comprehensive contract testing suite
async function runContractTests() {
  const results = {
    api: [],
    database: [],
    schema: [],
    breaking: [],
  };

  // Test API contracts
  const apiEndpoints = ["/api/v1/invoices", "/api/v1/bills", "/api/v1/journals", "/api/v1/reports"];

  for (const endpoint of apiEndpoints) {
    try {
      const result = await validateApiContract({
        endpoint,
        method: "POST",
        requestSchema: getRequestSchema(endpoint),
        responseSchema: getResponseSchema(endpoint),
      });
      results.api.push({ endpoint, result });
    } catch (error) {
      results.api.push({ endpoint, error: error.message });
    }
  }

  // Test database contracts
  const tables = ["gl_journal", "ar_invoices", "ap_bills", "gl_accounts"];

  for (const table of tables) {
    try {
      const result = await validateDatabaseContract({
        table,
        schema: getTableSchema(table),
        constraints: getTableConstraints(table),
      });
      results.database.push({ table, result });
    } catch (error) {
      results.database.push({ table, error: error.message });
    }
  }

  // Test schema compatibility
  try {
    const result = await validateSchemaCompatibility(getOldSchema(), getNewSchema());
    results.schema.push({ result });
  } catch (error) {
    results.schema.push({ error: error.message });
  }

  // Test breaking changes
  try {
    const result = await validateSchemaBreakingChanges(getOldApiSchema(), getNewApiSchema());
    results.breaking.push({ result });
  } catch (error) {
    results.breaking.push({ error: error.message });
  }

  return results;
}
```

## 10) Troubleshooting

**Common Issues**:

- **Contract Validation Failed**: Check schema definitions and constraints
- **Schema Compatibility Issues**: Verify field types and requirements
- **Breaking Changes Detected**: Review API changes and versioning
- **Database Constraint Violations**: Check foreign key and check constraints

**Debug Mode**:

```typescript
// Enable detailed logging
process.env.DEBUG_CONTRACTS = "true";
```

**Logs**: Check test logs for contract validation details

## 11) Contributing

**Code Style**:

- Follow TypeScript best practices
- Use descriptive test names
- Implement comprehensive contract validation
- Document complex contract logic

**Testing**:

- Test all contract validation functions
- Test schema compatibility
- Test breaking change detection
- Test contract versioning

**Review Process**:

- All contract tests must be validated
- Schema definitions must be accurate
- Performance must be optimized
- Security must be verified

---

## 📚 **Additional Resources**

- [Tests README](../README.md)
- [Unit Tests](../unit/README.md)
- [Integration Tests](../integration/README.md)
- [E2E Tests](../e2e/README.md)
- [Performance Tests](../performance/README.md)

---

**Last Updated**: 2025-09-13 • **Version**: 0.1.0
