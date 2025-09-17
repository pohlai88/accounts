[**AI-BOS Accounts API Documentation (Source)**](../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../README.md) / @aibos/accounting

# DOC-282: Documentation

**Version**: 1.0  
**Date**: 2025-09-17  
**Status**: Active  
**Owner**: Development Team  
**Last Updated**: 2025-09-17  
**Next Review**: 2025-12-17  

---

# @aibos/accounting

Core accounting business logic and calculations for the AI-BOS Accounting SaaS platform.

## Overview

This package contains the fundamental accounting operations including Accounts Receivable (AR), Accounts Payable (AP), General Ledger (GL) posting, financial reporting, and multi-currency support.

## Installation

```bash
pnpm add @aibos/accounting
```

## Core Features

### Accounts Receivable (AR)
- Invoice posting and validation
- Customer management
- Payment tracking and allocation
- Aging reports

### Accounts Payable (AP)
- Bill processing and approval workflows
- Vendor management
- Payment processing with allocations
- Bank charge handling
- Withholding tax calculations

### General Ledger (GL)
- Journal entry posting
- Chart of accounts management
- Account validation
- Trial balance generation

### Financial Reporting
- Trial Balance
- Profit & Loss Statement
- Balance Sheet
- Cash Flow Statement

### Multi-Currency Support
- Foreign exchange rate management
- Currency conversion
- Multi-currency reporting

### Period Management
- Fiscal period opening/closing
- Period locks and validation
- Year-end procedures

## API Reference

### Invoice Management

```typescript
import { 
  validateInvoicePosting, 
  calculateInvoiceTotals,
  validateInvoiceLines,
  generateInvoiceDescription,
  type InvoicePostingInput,
  type InvoiceLineInput
} from "@aibos/accounting";

// Validate invoice before posting
const validation = validateInvoicePosting({
  customerId: "cust_123",
  invoiceNumber: "INV-001",
  invoiceDate: new Date(),
  dueDate: new Date(),
  currency: "USD",
  lines: [
    {
      accountId: "acc_001",
      description: "Services rendered",
      quantity: 1,
      unitPrice: 1000,
      taxRate: 0.1
    }
  ]
});

// Calculate totals
const totals = calculateInvoiceTotals(validation.invoice);
```

### Bill Processing

```typescript
import { 
  validateBillPosting, 
  generateBillNumber,
  processBillApproval,
  type BillPostingInput
} from "@aibos/accounting";

// Validate bill before posting
const billValidation = validateBillPosting({
  vendorId: "vend_123",
  billNumber: "BILL-001",
  billDate: new Date(),
  dueDate: new Date(),
  currency: "USD",
  lines: [
    {
      accountId: "acc_002",
      description: "Office supplies",
      quantity: 10,
      unitPrice: 25,
      taxRate: 0.08
    }
  ]
});

// Generate bill number
const billNumber = generateBillNumber("BILL", "2024");
```

### Payment Processing

```typescript
import { 
  validatePaymentProcessing,
  calculatePaymentSummary,
  allocatePaymentToInvoices,
  type PaymentInput
} from "@aibos/accounting";

// Process payment
const payment = validatePaymentProcessing({
  customerId: "cust_123",
  paymentAmount: 1000,
  paymentDate: new Date(),
  currency: "USD",
  paymentMethod: "bank_transfer"
});

// Allocate payment to invoices
const allocation = allocatePaymentToInvoices(payment, [
  { invoiceId: "inv_001", amount: 600 },
  { invoiceId: "inv_002", amount: 400 }
]);
```

### Financial Reports

```typescript
import { 
  generateTrialBalance,
  generateBalanceSheet,
  generateProfitLoss,
  generateCashFlow
} from "@aibos/accounting";

// Generate Trial Balance
const trialBalance = await generateTrialBalance({
  tenantId: "tenant_123",
  periodStart: new Date("2024-01-01"),
  periodEnd: new Date("2024-12-31")
});

// Generate Balance Sheet
const balanceSheet = await generateBalanceSheet({
  tenantId: "tenant_123",
  asOfDate: new Date("2024-12-31")
});
```

### Multi-Currency Operations

```typescript
import { 
  convertCurrency,
  getExchangeRate,
  validateCurrencyCode,
  type CurrencyConversion
} from "@aibos/accounting";

// Convert currency
const conversion = convertCurrency({
  amount: 1000,
  fromCurrency: "USD",
  toCurrency: "EUR",
  exchangeRate: 0.85
});

// Get exchange rate
const rate = await getExchangeRate("USD", "EUR", new Date());
```

## Configuration

### Environment Variables

```env
# Exchange Rate API
EXCHANGE_RATE_API_KEY=your_api_key
EXCHANGE_RATE_BASE_URL=https://api.exchangerate-api.com/v4

# Tax Configuration
DEFAULT_TAX_RATE=0.1
WITHHOLDING_TAX_RATE=0.05

# Reporting
REPORT_CACHE_TTL=3600
REPORT_MAX_ROWS=10000
```

### Feature Flags

```typescript
const accountingFeatures = {
  multiCurrency: true,
  taxCalculations: true,
  periodManagement: true,
  advancedReporting: false,
  automatedPosting: false
};
```

## Testing

```bash
# Run unit tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run specific test file
pnpm test:unit:acc:core
```

## Dependencies

- **@aibos/db**: Database operations and schema
- **@aibos/auth**: Authentication and user context
- **zod**: Runtime type validation

## Performance Considerations

- **Caching**: Report results are cached for 1 hour
- **Batch Processing**: Bulk operations use batch processing
- **Query Optimization**: Database queries are optimized for performance
- **Memory Management**: Large datasets are processed in chunks

## Security

- **Input Validation**: All inputs are validated with Zod schemas
- **Authorization**: User permissions are checked for all operations
- **Audit Logging**: All accounting operations are logged
- **Data Encryption**: Sensitive data is encrypted at rest

## Error Handling

```typescript
import { AccountingError, ValidationError } from "@aibos/accounting";

try {
  const result = await validateInvoicePosting(invoiceData);
} catch (error) {
  if (error instanceof ValidationError) {
    // Handle validation errors
    console.error("Validation failed:", error.details);
  } else if (error instanceof AccountingError) {
    // Handle accounting errors
    console.error("Accounting error:", error.message);
  }
}
```

## Migration Guide

### From v0.0.x to v0.1.0

- **Breaking Change**: `calculateTotals` renamed to `calculateInvoiceTotals`
- **New Feature**: Multi-currency support added
- **Deprecated**: `legacyPosting` function removed

```typescript
// Old way (deprecated)
const totals = calculateTotals(invoice);

// New way
const totals = calculateInvoiceTotals(invoice);
```

## Contributing

1. Follow the coding standards
2. Add tests for new features
3. Update documentation
4. Run quality checks: `pnpm quality:check`

## License

MIT License - see LICENSE file for details.

## Modules

- [](README.md)
- [fx/ingest](fx/ingest/README.md)
- [fx/policy](fx/policy/README.md)
- [periods/period-management](periods/period-management/README.md)
- [posting](posting/README.md)
- [reports/balance-sheet](reports/balance-sheet/README.md)
- [reports/cash-flow](reports/cash-flow/README.md)
- [reports/trial-balance](reports/trial-balance/README.md)
- [types](types/README.md)
- [types-entry](types-entry/README.md)
