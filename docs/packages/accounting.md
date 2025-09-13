# Accounting Package

The `@aibos/accounting` package contains the core business logic for the AI-BOS accounting system.

## Overview

This package provides comprehensive accounting functionality including:

- **Accounts Receivable (AR)** - Invoice management and customer billing
- **Accounts Payable (AP)** - Bill processing and vendor management
- **General Ledger (GL)** - Chart of accounts and journal entries
- **Financial Reporting** - Trial balance, P&L, and balance sheet
- **Foreign Exchange (FX)** - Multi-currency support and rate management

## Installation

```bash
pnpm add @aibos/accounting
```

## Quick Start

```typescript
import { createInvoice, processPayment, generateTrialBalance } from '@aibos/accounting';

// Create a new invoice
const invoice = await createInvoice({
  customerId: 'cust_123',
  items: [{ description: 'Consulting', amount: 1000, quantity: 1 }],
  dueDate: new Date('2024-12-31'),
});

// Process payment
await processPayment(invoice.id, {
  amount: 1000,
  method: 'bank_transfer',
});

// Generate trial balance
const trialBalance = await generateTrialBalance({
  period: '2024-01-01',
  endDate: '2024-01-31',
});
```

## Core Modules

### Accounts Receivable

- Invoice creation and management
- Payment processing and tracking
- Customer credit management
- Aging reports

### Accounts Payable

- Bill processing and approval
- Vendor management
- Payment scheduling
- Expense categorization

### General Ledger

- Chart of accounts management
- Journal entry posting
- Period closing and locking
- Account reconciliation

### Financial Reporting

- Trial balance generation
- Profit & Loss statements
- Balance sheet reports
- Cash flow analysis

### Foreign Exchange

- Multi-currency support
- Exchange rate management
- Currency conversion
- FX gain/loss calculations

## API Reference

For detailed API documentation, see the [API Reference](/api/accounting).

## Testing

The package includes comprehensive tests:

```bash
# Run tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run specific test file
pnpm test accounting.test.ts
```

## Contributing

When contributing to this package:

1. Follow the established coding standards
2. Add tests for new functionality
3. Update documentation
4. Ensure all tests pass
5. Follow semantic versioning

## License

This package is part of the AI-BOS Accounts system and follows the same licensing terms.
