# DOC-025: Documentation

**Version**: 1.0  
**Date**: 2025-09-17  
**Status**: Active  
**Owner**: Development Team  
**Last Updated**: 2025-09-17  
**Next Review**: 2025-12-17  

---

# AP — Accounts Payable Module

> **TL;DR**: D3 Accounts Payable business logic for bill posting and payment processing with GL
> integration.  
> **Owner**: @aibos/accounting-team • **Status**: stable • **Since**: 2024-12  
> **Standards**: CommonMark • SemVer • Conventional Commits • Keep a Changelog

---

## 1) Scope & Boundaries

**Does**:

- Bill posting validation and GL integration
- Payment processing and allocation management
- AP-specific business rule validation
- FX policy integration for multi-currency bills
- SoD compliance for AP operations
- Bill number generation and validation

**Does NOT**:

- Handle AR invoice processing (delegated to @aibos/accounting/src/ar)
- Manage bank reconciliation (delegated to @aibos/accounting/src/bank)
- Process FX rate ingestion (delegated to @aibos/accounting/src/fx)
- Generate financial reports (delegated to @aibos/accounting/src/reports)

**Consumers**: @aibos/web-api, @aibos/accounting, external AP workflows

## 2) Quick Links

- **Bill Posting**: `bill-posting.ts`
- **Payment Processing**: `payment-processing.ts`
- **Main Accounting**: `../README.md`
- **GL Posting**: `../posting.ts`
- **FX Policy**: `../fx/policy.ts`

## 3) Getting Started

```typescript
import { validateBillPosting, calculateBillTotals } from "@aibos/accounting/ap";
import { validatePaymentProcessing } from "@aibos/accounting/ap";

// Bill posting validation
const billResult = await validateBillPosting(
  {
    tenantId: "tenant-123",
    companyId: "company-456",
    billId: "bill-789",
    billNumber: "BILL-001",
    supplierId: "supplier-123",
    supplierName: "ABC Supplier",
    billDate: "2024-01-15",
    currency: "MYR",
    exchangeRate: 1.0,
    apAccountId: "ap-account-id",
    lines: [
      {
        lineNumber: 1,
        description: "Office Supplies",
        quantity: 10,
        unitPrice: 50.0,
        lineAmount: 500.0,
        expenseAccountId: "expense-account-id",
      },
    ],
  },
  "user-123",
  "accountant",
);

// Payment processing validation
const paymentResult = await validatePaymentProcessing(
  {
    tenantId: "tenant-123",
    companyId: "company-456",
    paymentId: "pay-001",
    paymentNumber: "PAY-001",
    paymentDate: "2024-01-20",
    paymentMethod: "BANK_TRANSFER",
    bankAccountId: "bank-account-id",
    currency: "MYR",
    exchangeRate: 1.0,
    amount: 500.0,
    allocations: [
      {
        type: "BILL",
        documentId: "bill-789",
        documentNumber: "BILL-001",
        supplierId: "supplier-123",
        allocatedAmount: 500.0,
        apAccountId: "ap-account-id",
      },
    ],
  },
  "user-123",
  "accountant",
);
```

## 4) Architecture & Dependencies

**Dependencies**:

- `../posting.ts` - Journal posting validation
- `../fx/policy.ts` - FX policy validation
- Database client for GL operations

**Dependents**:

- @aibos/web-api AP endpoints
- @aibos/accounting main module
- External AP workflow systems

**Build Order**: After posting and fx modules, before web-api integration

## 5) Development Workflow

**Local Dev**:

```bash
pnpm --filter @aibos/accounting dev
pnpm --filter @aibos/accounting test
```

**Testing**:

```bash
pnpm --filter @aibos/accounting test src/ap/
```

**Linting**:

```bash
pnpm --filter @aibos/accounting lint src/ap/
```

**Type Checking**:

```bash
pnpm --filter @aibos/accounting typecheck
```

## 6) API Surface

**Exports**:

### Bill Posting (`bill-posting.ts`)

- `validateBillPosting()` - Main bill posting validation
- `calculateBillTotals()` - Calculate bill line totals
- `validateBillLines()` - Validate bill line calculations
- `generateBillNumber()` - Generate bill numbers
- `validateBillBusinessRules()` - Business rule validation

### Payment Processing (`payment-processing.ts`)

- `validatePaymentProcessing()` - Main payment validation
- `validatePaymentBusinessRules()` - Payment business rules
- `generatePaymentNumber()` - Generate payment numbers
- `calculatePaymentSummary()` - Calculate payment summaries
- `validatePaymentAllocations()` - Validate payment allocations

**Public Types**:

- `BillPostingInput` - Bill posting input interface
- `BillPostingResult` - Successful bill posting result
- `BillPostingError` - Bill posting error result
- `PaymentProcessingInput` - Payment processing input
- `PaymentProcessingResult` - Successful payment result
- `PaymentProcessingError` - Payment processing error

**Configuration**:

- FX policy integration for multi-currency support
- SoD compliance validation
- Business rule enforcement

## 7) Performance & Monitoring

**Bundle Size**: ~15KB minified  
**Performance Budget**: <50ms for bill validation, <100ms for payment processing  
**Monitoring**: Axiom telemetry integration for AP operations

## 8) Security & Compliance

**Permissions**:

- AP posting requires 'accountant' or 'manager' role
- Payment processing requires 'accountant' or 'manager' role
- SoD compliance enforced for all operations

**Data Handling**:

- All amounts validated and sanitized
- Multi-currency support with FX validation
- Audit trail for all AP operations

**Compliance**:

- V1 compliance for AP operations
- SoD enforcement for bill posting and payments
- FX policy compliance for multi-currency transactions

## 9) Usage Examples

### Bill Posting Workflow

```typescript
import { validateBillPosting, calculateBillTotals } from "@aibos/accounting/ap";

// 1. Calculate bill totals
const billLines = [
  {
    lineNumber: 1,
    description: "Office Supplies",
    quantity: 10,
    unitPrice: 50.0,
    lineAmount: 500.0,
    expenseAccountId: "expense-account-id",
  },
  {
    lineNumber: 2,
    description: "Software License",
    quantity: 1,
    unitPrice: 200.0,
    lineAmount: 200.0,
    expenseAccountId: "software-expense-account-id",
  },
];

const totals = calculateBillTotals(billLines);
// Result: { subtotal: 700.00, taxAmount: 0, totalAmount: 700.00 }

// 2. Validate bill posting
const billInput = {
  tenantId: "tenant-123",
  companyId: "company-456",
  billId: "bill-789",
  billNumber: "BILL-001",
  supplierId: "supplier-123",
  supplierName: "ABC Supplier",
  billDate: "2024-01-15",
  currency: "MYR",
  exchangeRate: 1.0,
  apAccountId: "ap-account-id",
  lines: billLines,
};

const result = await validateBillPosting(billInput, "user-123", "accountant");

if (result.success) {
  console.log("Bill validated successfully:", result.journalNumber);
  console.log("Total amount:", result.totalAmount);
  console.log("Journal lines:", result.lines);
} else {
  console.error("Bill validation failed:", result.error);
}
```

### Payment Processing Workflow

```typescript
import { validatePaymentProcessing, calculatePaymentSummary } from "@aibos/accounting/ap";

// 1. Prepare payment allocations
const allocations = [
  {
    type: "BILL" as const,
    documentId: "bill-789",
    documentNumber: "BILL-001",
    supplierId: "supplier-123",
    allocatedAmount: 500.0,
    apAccountId: "ap-account-id",
  },
  {
    type: "BILL" as const,
    documentId: "bill-790",
    documentNumber: "BILL-002",
    supplierId: "supplier-456",
    allocatedAmount: 300.0,
    apAccountId: "ap-account-id",
  },
];

// 2. Calculate payment summary
const summary = calculatePaymentSummary(allocations);
// Result: { billPayments: 800.00, invoiceReceipts: 0, totalAmount: 800.00 }

// 3. Validate payment processing
const paymentInput = {
  tenantId: "tenant-123",
  companyId: "company-456",
  paymentId: "pay-001",
  paymentNumber: "PAY-001",
  paymentDate: "2024-01-20",
  paymentMethod: "BANK_TRANSFER" as const,
  bankAccountId: "bank-account-id",
  currency: "MYR",
  exchangeRate: 1.0,
  amount: 800.0,
  allocations,
};

const result = await validatePaymentProcessing(paymentInput, "user-123", "accountant");

if (result.success) {
  console.log("Payment validated successfully:", result.journalNumber);
  console.log("Total amount:", result.totalAmount);
  console.log("Allocations processed:", result.allocationsProcessed);
} else {
  console.error("Payment validation failed:", result.error);
}
```

### Multi-Currency Bill Processing

```typescript
import { validateBillPosting } from "@aibos/accounting/ap";

// USD bill with FX conversion
const usdBillInput = {
  tenantId: "tenant-123",
  companyId: "company-456",
  billId: "bill-usd-001",
  billNumber: "BILL-USD-001",
  supplierId: "us-supplier-123",
  supplierName: "US Supplier Inc",
  billDate: "2024-01-15",
  currency: "USD",
  exchangeRate: 4.2, // USD to MYR
  apAccountId: "ap-account-id",
  lines: [
    {
      lineNumber: 1,
      description: "Software License",
      quantity: 1,
      unitPrice: 100.0, // USD
      lineAmount: 100.0, // USD
      expenseAccountId: "software-expense-account-id",
    },
  ],
};

const result = await validateBillPosting(usdBillInput, "user-123", "accountant");

if (result.success) {
  // Total amount will be converted to MYR: 100.00 * 4.20 = 420.00 MYR
  console.log("USD bill converted to MYR:", result.totalAmount); // 420.00
}
```

## 10) Troubleshooting

**Common Issues**:

- **FX Policy Violation**: Ensure valid currency codes and exchange rates
- **SoD Violation**: Check user roles and permissions
- **Amount Validation**: Verify line amounts match quantity × unit price
- **Account Validation**: Ensure all account IDs exist and are active

**Debug Mode**:

```typescript
// Enable detailed logging
process.env.DEBUG_AP = "true";
```

**Logs**: Check Axiom telemetry for AP operation logs

## 11) Contributing

**Code Style**:

- Follow TypeScript best practices
- Use descriptive function names
- Implement proper error handling
- Document complex business logic

**Testing**:

- Test all bill posting scenarios
- Test payment processing workflows
- Test multi-currency support
- Test SoD compliance

**Review Process**:

- All AP operations must be validated
- SoD compliance must be enforced
- FX policy integration must be tested
- Business rules must be documented

---

## 📚 **Additional Resources**

- [Accounting Package README](../README.md)
- [GL Posting Module](../posting.ts)
- [FX Policy Module](../fx/policy.ts)
- [Bank Module](../bank/README.md)
- [Reports Module](../reports/README.md)

---

**Last Updated**: 2025-09-13 • **Version**: 0.1.0
