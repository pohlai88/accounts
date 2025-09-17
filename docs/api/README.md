# DOC-024: Built API Documentation

**Version**: 1.0  
**Date**: 2025-09-17  
**Status**: Active  
**Owner**: Development Team  
**Last Updated**: 2025-09-17  
**Next Review**: 2025-12-17

---

# AI-BOS Accounting SaaS Platform - Built API Documentation

This directory contains automatically generated API documentation from built packages in the AI-BOS Accounting SaaS platform.

## 📚 Package Documentation

### Core Packages

| Package                                            | Description                        | Functions | Interfaces | Classes |
| -------------------------------------------------- | ---------------------------------- | --------- | ---------- | ------- |
| [@aibos/accounting](./@aibos/accounting/README.md) | Core accounting functionality      | 25+       | 35+        | 1       |
| [@aibos/db](./@aibos/db/README.md)                 | Database operations and schema     | 26        | 13         | 2       |
| [@aibos/ui](./@aibos/ui/README.md)                 | React components and design system | 39        | 4          | 2       |
| [@aibos/utils](./@aibos/utils/README.md)           | Utility functions and services     | 106       | 45         | 11      |
| [@aibos/security](./@aibos/security/README.md)     | Security and authentication        | 7         | 18         | 4       |

### Infrastructure Packages

| Package                                              | Description               | Functions | Interfaces | Classes |
| ---------------------------------------------------- | ------------------------- | --------- | ---------- | ------- |
| [@aibos/auth](./@aibos/auth/README.md)               | Authentication services   | -         | -          | -       |
| [@aibos/cache](./@aibos/cache/README.md)             | Caching layer             | -         | -          | -       |
| [@aibos/api-gateway](./@aibos/api-gateway/README.md) | API routing               | -         | -          | -       |
| [@aibos/realtime](./@aibos/realtime/README.md)       | Real-time features        | 1         | 18         | 6       |
| [@aibos/monitoring](./@aibos/monitoring/README.md)   | Observability and metrics | -         | -          | -       |

### Support Packages

| Package                                            | Description              | Functions | Interfaces | Classes |
| -------------------------------------------------- | ------------------------ | --------- | ---------- | ------- |
| [@aibos/contracts](./@aibos/contracts/README.md)   | Type definitions         | 8         | 10         | -       |
| [@aibos/tokens](./@aibos/tokens/README.md)         | Token management         | 5         | 3          | -       |
| [@aibos/api](./@aibos/api/README.md)               | API services             | -         | -          | -       |
| [@aibos/deployment](./@aibos/deployment/README.md) | Deployment automation    | -         | -          | -       |
| [@aibos/config](./@aibos/config/README.md)         | Configuration management | -         | -          | -       |

## 🚀 Quick Start

### Viewing Documentation

```bash
# Generate documentation from built packages
pnpm docs:api

# Serve documentation locally
pnpm docs:api:serve

# Watch for changes and regenerate
pnpm docs:api:watch
```

### Using APIs

```typescript
// Import packages
import { calculateInvoiceTotal } from '@aibos/accounting';
import { createClient } from '@aibos/db';
import { Button } from '@aibos/ui';

// Use functions
const total = calculateInvoiceTotal({
  subtotal: 100,
  currency: 'USD'
}, 0.1);

// Use components
<Button variant="primary">Create Invoice</Button>
```

## 📖 Documentation Structure

Each package documentation includes:

- **Functions**: API functions with parameters and return types
- **Interfaces**: TypeScript interfaces and type definitions
- **Classes**: Class documentation with methods and properties
- **Enums**: Enumeration values and descriptions
- **Type Aliases**: Custom type definitions
- **Variables**: Constants and configuration values

## 🔧 Development

### Adding Documentation

Use JSDoc comments in your TypeScript code:

````typescript
/**
 * Calculates invoice total including taxes
 * @param invoice - Invoice data
 * @param taxRate - Tax rate (0-1)
 * @returns Total amount including taxes
 * @example
 * ```typescript
 * const total = calculateInvoiceTotal({
 *   subtotal: 100,
 *   currency: 'USD'
 * }, 0.1);
 * ```
 */
export function calculateInvoiceTotal(invoice: InvoiceInput, taxRate: number): number {
  return invoice.subtotal * (1 + taxRate);
}
````

### Regenerating Documentation

```bash
# Clean and regenerate all documentation
pnpm docs:api:clean
pnpm docs:api

# Or use the watch mode for development
pnpm docs:api:watch
```

## 📊 Statistics

- **Total Packages**: 15
- **Total Functions**: 200+
- **Total Interfaces**: 150+
- **Total Classes**: 25+
- **Documentation Files**: 500+

## 🔗 Related Documentation

- [Source API Documentation](../api-src/README.md)
- [Master Document Registry](../MASTER_DOCUMENT_REGISTRY.md)
- [Documentation Best Practices](../DOCUMENT_MANAGEMENT_BEST_PRACTICES.md)
- [API Documentation Guide](../API_AUTOMATED_DOCUMENTATION_GUIDE.md)

---

**Last Updated**: September 17, 2025  
**Generated**: Automatically from built TypeScript packages  
**Version**: 1.0
