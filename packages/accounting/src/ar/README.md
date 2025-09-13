# AR — Accounts Receivable Module

> **TL;DR**: D2 Accounts Receivable business logic for invoice posting and GL integration with
> revenue recognition.  
> **Owner**: @aibos/accounting-team • **Status**: stable • **Since**: 2024-12  
> **Standards**: CommonMark • SemVer • Conventional Commits • Keep a Changelog

---

## 1) Scope & Boundaries

**Does**:

- Invoice posting validation and GL integration
- Revenue recognition and AR account management
- Invoice line validation and calculation
- Multi-currency invoice support with FX validation
- SoD compliance for AR operations
- Invoice number generation and validation

**Does NOT**:

- Handle AP bill processing (delegated to @aibos/accounting/src/ap)
- Manage bank reconciliation (delegated to @aibos/accounting/src/bank)
- Process FX rate ingestion (delegated to @aibos/accounting/src/fx)
- Generate financial reports (delegated to @aibos/accounting/src/reports)

**Consumers**: @aibos/web-api, @aibos/accounting, external AR workflows

## 2) Quick Links

- **Invoice Posting**: `invoice-posting.ts`
- **Main Accounting**: `../README.md`
- **GL Posting**: `../posting.ts`
- **FX Policy**: `../fx/policy.ts`

## 3) Getting Started

```typescript
import { validateInvoicePosting, calculateInvoiceTotals } from '@aibos/accounting/ar';

// Invoice posting validation
const invoiceResult = await validateInvoicePosting(
  {
    tenantId: 'tenant-123',
    companyId: 'company-456',
    invoiceId: 'inv-789',
    invoiceNumber: 'INV-001',
    customerId: 'customer-123',
    customerName: 'ABC Customer',
    invoiceDate: '2024-01-15',
    currency: 'MYR',
    exchangeRate: 1.0,
    arAccountId: 'ar-account-id',
    lines: [
      {
        lineNumber: 1,
        description: 'Consulting Services',
        quantity: 10,
        unitPrice: 100.0,
        lineAmount: 1000.0,
        revenueAccountId: 'revenue-account-id',
      },
    ],
  },
  'user-123',
  'accountant'
);

// Calculate invoice totals
const totals = calculateInvoiceTotals(invoiceResult.lines);
```

## 4) Architecture & Dependencies

**Dependencies**:

- `../posting.ts` - Journal posting validation
- `../fx/policy.ts` - FX policy validation
- Database client for GL operations

**Dependents**:

- @aibos/web-api AR endpoints
- @aibos/accounting main module
- External AR workflow systems

**Build Order**: After posting and fx modules, before web-api integration

## 5) Development Workflow

**Local Dev**:

```bash
pnpm --filter @aibos/accounting dev
pnpm --filter @aibos/accounting test
```

**Testing**:

```bash
pnpm --filter @aibos/accounting test src/ar/
```

**Linting**:

```bash
pnpm --filter @aibos/accounting lint src/ar/
```

**Type Checking**:

```bash
pnpm --filter @aibos/accounting typecheck
```

## 6) API Surface

**Exports**:

### Invoice Posting (`invoice-posting.ts`)

- `validateInvoicePosting()` - Main invoice posting validation
- `calculateInvoiceTotals()` - Calculate invoice line totals
- `validateInvoiceLines()` - Validate invoice line calculations
- `generateInvoiceDescription()` - Generate invoice descriptions

**Public Types**:

- `InvoicePostingInput` - Invoice posting input interface
- `InvoicePostingResult` - Successful invoice posting result
- `InvoicePostingError` - Invoice posting error result
- `InvoiceLineInput` - Invoice line input interface
- `TaxLineInput` - Tax line input interface

**Configuration**:

- FX policy integration for multi-currency support
- SoD compliance validation
- Revenue recognition rules

## 7) Performance & Monitoring

**Bundle Size**: ~8KB minified  
**Performance Budget**: <50ms for invoice validation  
**Monitoring**: Axiom telemetry integration for AR operations

## 8) Security & Compliance

**Permissions**:

- AR posting requires 'accountant' or 'manager' role
- SoD compliance enforced for all operations

**Data Handling**:

- All amounts validated and sanitized
- Multi-currency support with FX validation
- Audit trail for all AR operations

**Compliance**:

- V1 compliance for AR operations
- SoD enforcement for invoice posting
- FX policy compliance for multi-currency transactions

## 9) Usage Examples

### Basic Invoice Posting

```typescript
import { validateInvoicePosting, calculateInvoiceTotals } from '@aibos/accounting/ar';

// 1. Prepare invoice data
const invoiceInput = {
  tenantId: 'tenant-123',
  companyId: 'company-456',
  invoiceId: 'inv-789',
  invoiceNumber: 'INV-001',
  customerId: 'customer-123',
  customerName: 'ABC Customer',
  invoiceDate: '2024-01-15',
  currency: 'MYR',
  exchangeRate: 1.0,
  arAccountId: 'ar-account-id',
  lines: [
    {
      lineNumber: 1,
      description: 'Consulting Services',
      quantity: 10,
      unitPrice: 100.0,
      lineAmount: 1000.0,
      revenueAccountId: 'revenue-account-id',
    },
    {
      lineNumber: 2,
      description: 'Software License',
      quantity: 1,
      unitPrice: 500.0,
      lineAmount: 500.0,
      revenueAccountId: 'software-revenue-account-id',
    },
  ],
};

// 2. Calculate totals
const totals = calculateInvoiceTotals(invoiceInput.lines);
// Result: { subtotal: 1500.00, taxAmount: 0, totalAmount: 1500.00 }

// 3. Validate invoice posting
const result = await validateInvoicePosting(invoiceInput, 'user-123', 'accountant');

if (result.validated) {
  console.log('Invoice validated successfully');
  console.log('Total revenue:', result.totalRevenue);
  console.log('Total amount:', result.totalAmount);
  console.log('Requires approval:', result.requiresApproval);
} else {
  console.error('Invoice validation failed:', result.error);
}
```

### Invoice with Tax Lines

```typescript
import { validateInvoicePosting } from '@aibos/accounting/ar';

// Invoice with tax
const invoiceWithTax = {
  tenantId: 'tenant-123',
  companyId: 'company-456',
  invoiceId: 'inv-790',
  invoiceNumber: 'INV-002',
  customerId: 'customer-456',
  customerName: 'XYZ Customer',
  invoiceDate: '2024-01-15',
  currency: 'MYR',
  exchangeRate: 1.0,
  arAccountId: 'ar-account-id',
  lines: [
    {
      lineNumber: 1,
      description: 'Professional Services',
      quantity: 20,
      unitPrice: 75.0,
      lineAmount: 1500.0,
      revenueAccountId: 'revenue-account-id',
      taxCode: 'SST',
      taxRate: 0.06,
      taxAmount: 90.0,
    },
  ],
  taxLines: [
    {
      taxCode: 'SST',
      taxAccountId: 'sst-liability-account-id',
      taxAmount: 90.0,
      taxType: 'OUTPUT',
    },
  ],
};

const result = await validateInvoicePosting(invoiceWithTax, 'user-123', 'accountant');

if (result.validated) {
  console.log('Invoice with tax validated');
  console.log('Total revenue:', result.totalRevenue); // 1500.00
  console.log('Total tax:', result.totalTax); // 90.00
  console.log('Total amount:', result.totalAmount); // 1590.00
}
```

### Multi-Currency Invoice

```typescript
import { validateInvoicePosting } from '@aibos/accounting/ar';

// USD invoice with FX conversion
const usdInvoice = {
  tenantId: 'tenant-123',
  companyId: 'company-456',
  invoiceId: 'inv-usd-001',
  invoiceNumber: 'INV-USD-001',
  customerId: 'us-customer-123',
  customerName: 'US Customer Inc',
  invoiceDate: '2024-01-15',
  currency: 'USD',
  exchangeRate: 4.2, // USD to MYR
  arAccountId: 'ar-account-id',
  lines: [
    {
      lineNumber: 1,
      description: 'Software Development',
      quantity: 1,
      unitPrice: 2000.0, // USD
      lineAmount: 2000.0, // USD
      revenueAccountId: 'revenue-account-id',
    },
  ],
};

const result = await validateInvoicePosting(usdInvoice, 'user-123', 'accountant');

if (result.validated) {
  // Amounts will be converted to MYR: 2000.00 * 4.20 = 8400.00 MYR
  console.log('USD invoice converted to MYR');
  console.log('Total revenue (MYR):', result.totalRevenue); // 8400.00
  console.log('Total amount (MYR):', result.totalAmount); // 8400.00
}
```

### Invoice Line Validation

```typescript
import { validateInvoiceLines } from '@aibos/accounting/ar';

// Validate invoice lines
const invoiceLines = [
  {
    lineNumber: 1,
    description: 'Consulting Services',
    quantity: 10,
    unitPrice: 100.0,
    lineAmount: 1000.0,
    revenueAccountId: 'revenue-account-id',
  },
  {
    lineNumber: 2,
    description: 'Software License',
    quantity: 1,
    unitPrice: 500.0,
    lineAmount: 500.0,
    revenueAccountId: 'software-revenue-account-id',
    taxRate: 0.06,
    taxAmount: 30.0,
  },
];

const validation = validateInvoiceLines(invoiceLines);

if (validation.valid) {
  console.log('All invoice lines are valid');
} else {
  console.error('Invoice line validation errors:', validation.errors);
  // Example errors:
  // - "Line 2: Tax amount 30.00 does not match line amount × tax rate 30.00"
  // - "Line 1: Quantity must be positive"
}
```

## 10) Troubleshooting

**Common Issues**:

- **FX Policy Violation**: Ensure valid currency codes and exchange rates
- **SoD Violation**: Check user roles and permissions
- **Amount Validation**: Verify line amounts match quantity × unit price
- **Tax Calculation**: Ensure tax amounts match line amount × tax rate
- **Account Validation**: Ensure all account IDs exist and are active

**Debug Mode**:

```typescript
// Enable detailed logging
process.env.DEBUG_AR = 'true';
```

**Logs**: Check Axiom telemetry for AR operation logs

## 11) Contributing

**Code Style**:

- Follow TypeScript best practices
- Use descriptive function names
- Implement proper error handling
- Document complex business logic

**Testing**:

- Test all invoice posting scenarios
- Test multi-currency support
- Test tax calculation validation
- Test SoD compliance

**Review Process**:

- All AR operations must be validated
- SoD compliance must be enforced
- FX policy integration must be tested
- Revenue recognition rules must be documented

---

## 📚 **Additional Resources**

- [Accounting Package README](../README.md)
- [GL Posting Module](../posting.ts)
- [FX Policy Module](../fx/policy.ts)
- [AP Module](../ap/README.md)
- [Reports Module](../reports/README.md)

---

**Last Updated**: 2025-09-13 • **Version**: 0.1.0
