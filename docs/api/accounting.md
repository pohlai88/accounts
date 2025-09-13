# Accounting API

This page contains the complete API documentation for the `@aibos/accounting` package.

## Overview

The Accounting API provides comprehensive business logic for financial operations including:

- **Accounts Receivable (AR)** - Invoice management and customer billing
- **Accounts Payable (AP)** - Bill processing and vendor management
- **General Ledger (GL)** - Chart of accounts and journal entries
- **Financial Reporting** - Trial balance, P&L, and balance sheet
- **Foreign Exchange (FX)** - Multi-currency support and rate management

## Installation

```bash
pnpm add @aibos/accounting
```

## Core Functions

### Invoice Management

#### `createInvoice(options)`

Creates a new invoice for a customer.

**Parameters:**

- `customerId` (string): The unique identifier of the customer
- `items` (InvoiceItem[]): Array of invoice line items
- `options` (InvoiceOptions, optional): Optional configuration

**Returns:** `Promise<Invoice>`

**Example:**

```typescript
import { createInvoice } from '@aibos/accounting';

const invoice = await createInvoice({
  customerId: 'cust_123',
  items: [{ description: 'Consulting', amount: 1000, quantity: 1 }],
  dueDate: new Date('2024-12-31'),
});
```

#### `processPayment(invoiceId, payment)`

Processes a payment for an invoice.

**Parameters:**

- `invoiceId` (string): The invoice ID
- `payment` (PaymentData): Payment information

**Returns:** `Promise<Payment>`

### Financial Reporting

#### `generateTrialBalance(options)`

Generates a trial balance for the specified period.

**Parameters:**

- `startDate` (string): Start date in ISO format
- `endDate` (string): End date in ISO format

**Returns:** `Promise<TrialBalance>`

## Types

### InvoiceItem

```typescript
interface InvoiceItem {
  description: string;
  amount: number;
  quantity: number;
  taxRate?: number;
}
```

### InvoiceOptions

```typescript
interface InvoiceOptions {
  dueDate?: Date;
  currency?: string;
  notes?: string;
}
```

## Error Handling

The API throws specific error types:

- `ValidationError`: When input validation fails
- `BusinessRuleError`: When business rules are violated
- `NotFoundError`: When referenced entities don't exist

## Examples

See the [Accounting Package documentation](../packages/accounting) for comprehensive examples and
usage patterns.

## Related

- [Accounting Package](../packages/accounting) - Package overview and setup
- [Database API](./db) - Database operations
- [Contracts API](./contracts) - Type definitions
