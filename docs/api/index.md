# API Reference

This section contains the complete API documentation for all packages in the AI-BOS Accounts system.

## 📚 Package APIs

- **[Accounting API](./accounting)** - Business logic and calculations
- **[UI Components API](./ui)** - React component library
- **[Utilities API](./utils)** - Shared helper functions
- **[Contracts API](./contracts)** - API types and validation
- **[Database API](./db)** - Schema and operations
- **[Authentication API](./auth)** - Auth logic and permissions

## 🔧 API Generation

The API documentation is automatically generated from TypeScript source code using TypeDoc.

### Regenerating API Docs

```bash
# Generate API documentation
pnpm docs:api

# The generated docs will be available in /api/
```

### TypeDoc Configuration

The API generation is configured in `typedoc.json`:

```json
{
  "entryPoints": [
    "packages/accounting/src/index.ts",
    "packages/ui/src/index.ts",
    "packages/utils/src/index.ts",
    "packages/contracts/src/index.ts",
    "packages/db/src/index.ts",
    "packages/auth/src/index.ts"
  ],
  "out": "docs/api",
  "plugin": ["typedoc-plugin-markdown"]
}
```

## 📖 Reading the API Docs

### Function Documentation

Each function includes:

- **Description** - What the function does
- **Parameters** - Input parameters with types
- **Returns** - Return value and type
- **Examples** - Usage examples
- **Throws** - Possible exceptions

### Type Documentation

Types and interfaces include:

- **Description** - Purpose and usage
- **Properties** - All properties with types
- **Examples** - Usage examples
- **Related** - Related types and functions

### Class Documentation

Classes include:

- **Description** - Purpose and responsibilities
- **Constructor** - Initialization parameters
- **Methods** - All public methods
- **Properties** - All public properties
- **Examples** - Usage examples

## 🔍 Search and Navigation

- Use the search bar to find specific functions or types
- Navigate using the sidebar menu
- Use browser search (Ctrl+F) for text search
- Follow links between related functions

## 📝 Contributing to API Docs

### Adding Documentation

1. **Use JSDoc comments** for all public functions
2. **Include examples** for complex functions
3. **Document parameters** with types and descriptions
4. **Add usage notes** for important functions

### JSDoc Example

````typescript
/**
 * Creates a new invoice for a customer
 *
 * @param customerId - The unique identifier of the customer
 * @param items - Array of invoice line items
 * @param options - Optional configuration for the invoice
 * @returns Promise that resolves to the created invoice
 *
 * @example
 * ```typescript
 * const invoice = await createInvoice('cust_123', [
 *   { description: 'Consulting', amount: 1000, quantity: 1 }
 * ], { dueDate: new Date('2024-12-31') })
 * ```
 *
 * @throws {ValidationError} When customer ID is invalid
 * @throws {BusinessRuleError} When invoice violates business rules
 */
export async function createInvoice(
  customerId: string,
  items: InvoiceItem[],
  options?: InvoiceOptions
): Promise<Invoice> {
  // Implementation...
}
````

### Best Practices

1. **Be descriptive** - Explain what and why, not just how
2. **Include examples** - Show real usage scenarios
3. **Document errors** - List possible exceptions
4. **Keep updated** - Update docs when changing code
5. **Use markdown** - Format examples and descriptions

## 🚀 Quick Links

- [Accounting API](./accounting) - Core business logic
- [UI Components API](./ui) - React components
- [Utilities API](./utils) - Helper functions
- [Contracts API](./contracts) - Type definitions
- [Database API](./db) - Data operations
- [Authentication API](./auth) - Auth functions
