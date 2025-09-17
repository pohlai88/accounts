# DOC-071: Documentation

**Version**: 1.0  
**Date**: 2025-09-17  
**Status**: Active  
**Owner**: Development Team  
**Last Updated**: 2025-09-17  
**Next Review**: 2025-12-17  

---

# Bank — Banking Operations Module

> **TL;DR**: D3 Banking operations for transaction import, auto-matching, and reconciliation with
> intelligent transaction processing.  
> **Owner**: @aibos/accounting-team • **Status**: stable • **Since**: 2024-12  
> **Standards**: CommonMark • SemVer • Conventional Commits • Keep a Changelog

---

## 1) Scope & Boundaries

**Does**:

- Bank transaction CSV import and parsing
- Intelligent auto-matching with payment/receipt candidates
- Multi-format bank statement processing
- Transaction validation and duplicate detection
- Bank reconciliation support
- Malaysian bank format support

**Does NOT**:

- Handle AP/AR posting (delegated to @aibos/accounting/src/ap and @aibos/accounting/src/ar)
- Process FX rate ingestion (delegated to @aibos/accounting/src/fx)
- Generate financial reports (delegated to @aibos/accounting/src/reports)
- Manage period operations (delegated to @aibos/accounting/src/periods)

**Consumers**: @aibos/web-api, @aibos/accounting, external banking workflows

## 2) Quick Links

- **Auto-Matching**: `auto-matcher.ts`
- **CSV Import**: `csv-import.ts`
- **Main Accounting**: `../README.md`
- **AP Module**: `../ap/README.md`
- **AR Module**: `../ar/README.md`

## 3) Getting Started

```typescript
import {
  autoMatchTransactions,
  importBankTransactions,
  BANK_FORMATS,
} from "@aibos/accounting/bank";

// Import bank transactions
const importResult = await importBankTransactions(
  csvData,
  BANK_FORMATS.MAYBANK,
  "bank-account-123",
  "import-batch-456",
);

// Auto-match transactions
const matchResult = await autoMatchTransactions(importResult.transactions, candidates, {
  autoMatchThreshold: 90,
});
```

## 4) Architecture & Dependencies

**Dependencies**:

- CSV parsing for bank statement processing
- String similarity algorithms for fuzzy matching
- Database client for transaction storage

**Dependents**:

- @aibos/web-api banking endpoints
- @aibos/accounting main module
- External banking workflow systems

**Build Order**: Independent module, can be built alongside other accounting modules

## 5) Development Workflow

**Local Dev**:

```bash
pnpm --filter @aibos/accounting dev
pnpm --filter @aibos/accounting test
```

**Testing**:

```bash
pnpm --filter @aibos/accounting test src/bank/
```

**Linting**:

```bash
pnpm --filter @aibos/accounting lint src/bank/
```

**Type Checking**:

```bash
pnpm --filter @aibos/accounting typecheck
```

## 6) API Surface

**Exports**:

### Auto-Matching (`auto-matcher.ts`)

- `autoMatchTransactions()` - Main auto-matching function
- `filterCandidatesByDateRange()` - Filter candidates by date
- `groupMatchesByConfidence()` - Group matches by confidence level
- `validateMatch()` - Validate match before applying

### CSV Import (`csv-import.ts`)

- `importBankTransactions()` - Import bank transactions from CSV
- `detectBankFormat()` - Auto-detect bank format from CSV
- `generateImportBatchId()` - Generate unique import batch ID
- `BANK_FORMATS` - Predefined bank formats

**Public Types**:

- `BankTransactionImport` - Imported transaction interface
- `MatchCandidate` - Matching candidate interface
- `MatchResult` - Match result interface
- `AutoMatchResult` - Auto-matching result interface
- `ImportResult` - Import result interface
- `BankFormat` - Bank format configuration

**Configuration**:

- Configurable matching thresholds
- Customizable matching weights
- Support for multiple bank formats

## 7) Performance & Monitoring

**Bundle Size**: ~25KB minified  
**Performance Budget**: <200ms for transaction import, <500ms for auto-matching  
**Monitoring**: Axiom telemetry integration for banking operations

## 8) Security & Compliance

**Permissions**:

- Bank import requires 'accountant' or 'manager' role
- Auto-matching requires 'accountant' or 'manager' role

**Data Handling**:

- All transaction data validated and sanitized
- Duplicate detection and prevention
- Secure CSV parsing with validation

**Compliance**:

- V1 compliance for banking operations
- Audit trail for all import and matching operations
- Data integrity validation

## 9) Usage Examples

### Bank Transaction Import

```typescript
import { importBankTransactions, BANK_FORMATS, detectBankFormat } from "@aibos/accounting/bank";

// Auto-detect bank format
const csvData = `Date,Description,Debit,Credit,Balance
15/01/2024,Office Supplies,500.00,0.00,10000.00
16/01/2024,Payment Received,0.00,1000.00,11000.00`;

const detectedFormat = detectBankFormat(csvData);
console.log("Detected format:", detectedFormat?.name); // Maybank

// Import with specific format
const importResult = await importBankTransactions(
  csvData,
  BANK_FORMATS.MAYBANK,
  "bank-account-123",
  "import-batch-456",
);

if (importResult.success) {
  console.log("Import successful");
  console.log("Valid transactions:", importResult.transactions.length);
  console.log("Errors:", importResult.errors.length);
  console.log("Warnings:", importResult.warnings.length);
} else {
  console.error("Import failed:", importResult.errors);
}
```

### Auto-Matching Transactions

```typescript
import { autoMatchTransactions, groupMatchesByConfidence } from "@aibos/accounting/bank";

// Prepare transaction data
const transactions = [
  {
    transactionDate: new Date("2024-01-15"),
    description: "Office Supplies Payment",
    reference: "BILL-001",
    debitAmount: 500.0,
    creditAmount: 0.0,
    balance: 10000.0,
    rawData: {},
  },
];

// Prepare matching candidates
const candidates = [
  {
    type: "PAYMENT" as const,
    id: "pay-001",
    number: "PAY-001",
    date: new Date("2024-01-15"),
    amount: 500.0,
    description: "Office Supplies Payment",
    reference: "BILL-001",
    supplierId: "supplier-123",
  },
];

// Auto-match with custom configuration
const matchResult = await autoMatchTransactions(transactions, candidates, {
  autoMatchThreshold: 90,
  suggestMatchThreshold: 70,
  amountTolerance: 0.01,
  dateTolerance: 7,
  enableFuzzyMatching: true,
});

console.log("Auto-match results:");
console.log("Total transactions:", matchResult.summary.totalTransactions);
console.log("Automatic matches:", matchResult.summary.automaticMatches);
console.log("Suggested matches:", matchResult.summary.suggestedMatches);
console.log("Unmatched:", matchResult.summary.unmatched);
console.log("Average confidence:", matchResult.summary.averageConfidence);

// Group matches by confidence
const groupedMatches = groupMatchesByConfidence(matchResult.matches);
console.log("Automatic matches:", groupedMatches.automatic.length);
console.log("Suggested matches:", groupedMatches.suggested.length);
console.log("Low confidence matches:", groupedMatches.lowConfidence.length);
```

### Multi-Format Bank Support

```typescript
import { importBankTransactions, BANK_FORMATS } from "@aibos/accounting/bank";

// Maybank format
const maybankData = `Date,Description,Reference,Debit,Credit,Balance
15/01/2024,Office Supplies,REF001,500.00,0.00,10000.00`;

const maybankResult = await importBankTransactions(
  maybankData,
  BANK_FORMATS.MAYBANK,
  "maybank-account",
  "import-001",
);

// CIMB format
const cimbData = `Transaction Date,Description,Reference No,Amount,Dr/Cr,Balance
15-01-2024,Office Supplies,REF001,500.00,DR,10000.00`;

const cimbResult = await importBankTransactions(
  cimbData,
  BANK_FORMATS.CIMB,
  "cimb-account",
  "import-002",
);

// Public Bank format
const publicBankData = `Date,Transaction Details,Withdrawal,Deposit,Balance
15/01/2024,Office Supplies,500.00,0.00,10000.00`;

const publicBankResult = await importBankTransactions(
  publicBankData,
  BANK_FORMATS.PUBLIC_BANK,
  "public-bank-account",
  "import-003",
);
```

### Advanced Matching Configuration

```typescript
import { autoMatchTransactions } from "@aibos/accounting/bank";

// Custom matching configuration
const customConfig = {
  autoMatchThreshold: 95, // Higher threshold for automatic matching
  suggestMatchThreshold: 80, // Higher threshold for suggestions
  amountTolerance: 0.01, // 1 cent tolerance
  dateTolerance: 3, // 3 days tolerance
  exactAmountWeight: 50, // Higher weight for exact amount match
  dateProximityWeight: 25, // Weight for date proximity
  referenceMatchWeight: 30, // Weight for reference match
  descriptionMatchWeight: 20, // Weight for description similarity
  descriptionSimilarityThreshold: 0.8, // Higher similarity threshold
  enableFuzzyMatching: true,
};

const matchResult = await autoMatchTransactions(transactions, candidates, customConfig);

// Validate specific matches
for (const match of matchResult.matches) {
  const validation = validateMatch(
    transactions.find(t => t.transactionDate === match.transactionDate),
    match.candidate,
  );

  if (validation.valid) {
    console.log(`Match ${match.transactionId} is valid`);
  } else {
    console.log(`Match ${match.transactionId} has issues:`, validation.errors);
    console.log("Warnings:", validation.warnings);
  }
}
```

## 10) Troubleshooting

**Common Issues**:

- **CSV Format Issues**: Check bank format configuration and column mapping
- **Date Parsing Errors**: Verify date format matches bank format specification
- **Amount Parsing Errors**: Check for currency symbols and decimal separators
- **Low Match Confidence**: Adjust matching thresholds and weights
- **Duplicate Transactions**: Check for existing transactions before import

**Debug Mode**:

```typescript
// Enable detailed logging
process.env.DEBUG_BANK = "true";
```

**Logs**: Check Axiom telemetry for banking operation logs

## 11) Contributing

**Code Style**:

- Follow TypeScript best practices
- Use descriptive function names
- Implement proper error handling
- Document complex matching algorithms

**Testing**:

- Test all bank format parsers
- Test auto-matching algorithms
- Test duplicate detection
- Test validation functions

**Review Process**:

- All banking operations must be validated
- Matching algorithms must be tested
- Bank format support must be comprehensive
- Performance must be optimized

---

## 📚 **Additional Resources**

- [Accounting Package README](../README.md)
- [AP Module](../ap/README.md)
- [AR Module](../ar/README.md)
- [FX Module](../fx/README.md)
- [Reports Module](../reports/README.md)

---

**Last Updated**: 2025-09-13 • **Version**: 0.1.0
