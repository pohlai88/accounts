# DOC-238: Documentation

**Version**: 1.0  
**Date**: 2025-09-17  
**Status**: Active  
**Owner**: Development Team  
**Last Updated**: 2025-09-17  
**Next Review**: 2025-12-17  

---

# Accounting — Core Business Logic

> **TL;DR**: Core accounting business logic with journal posting, financial reporting, FX handling,
> and COA validation. Implements D2 AR invoice posting and D4 financial reporting.  
> **Owner**: @aibos/accounting-team • **Status**: stable • **Since**: 2024-12  
> **Standards**: CommonMark • SemVer • Conventional Commits • Keep a Changelog

---

## 1) Scope & Boundaries

**Does**:

- Implements core accounting business logic and calculations
- Handles journal posting with SoD compliance and COA validation
- Provides D2 AR invoice posting engine with GL integration
- Generates D4 financial reports (trial balance, balance sheet, P&L, cash flow)
- Manages FX policy validation and currency conversion
- Validates chart of accounts rules and business constraints
- Calculates tax amounts and invoice totals
- Enforces accounting principles and business rules

**Does NOT**:

- Handle database operations (delegates to @aibos/db package)
- Manage authentication/authorization (uses @aibos/auth package)
- Provide API endpoints (used by @aibos/web-api package)
- Handle file operations or UI rendering

**Consumers**: @aibos/web-api, @aibos/worker, @aibos/web

## 2) Quick Links

- **Database Layer**: `packages/db/src/`
- **Authentication**: `packages/auth/src/`
- **API Contracts**: `packages/contracts/src/`
- **Utilities**: `packages/utils/src/`
- **Architecture Guide**: `../docs/ARCHITECTURE.md`
- **Integration Strategy**: `../DRAFT_INTEGRATION STRATEGY.md`

## 3) Getting Started

```bash
# Install dependencies
pnpm install

# Build the package
pnpm build

# Run tests
pnpm test

# Watch mode for development
pnpm dev
```

## 4) Architecture & Dependencies

**Dependencies**:

- `@aibos/auth` - SoD compliance and authorization
- `@aibos/db` - Database operations and account information
- `zod` - Schema validation and type safety

**Dependents**:

- `@aibos/web-api` - API endpoints
- `@aibos/worker` - Background processing
- `@aibos/web` - Frontend calculations

**Build Order**: Depends on @aibos/auth and @aibos/db being built first

## 5) Development Workflow

**Local Dev**:

```bash
# Build with watch mode
pnpm dev

# Run specific tests
pnpm test posting.test.ts
```

**Testing**:

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test --coverage

# Run specific test file
pnpm test coa-validation.test.ts
```

**Linting**:

```bash
# Check for linting errors
pnpm lint

# Auto-fix where possible
pnpm lint --fix
```

**Type Checking**:

```bash
# TypeScript compilation check
pnpm build
```

## 6) API Surface

**Exports**:

- Journal posting functions and validation
- Invoice posting engine and calculations
- Financial report generators
- FX policy validation
- COA validation and business rules
- Tax calculation functions

**Public Types**:

- `JournalPostingInput` - Journal entry input structure
- `InvoicePostingInput` - Invoice posting parameters
- `TrialBalanceInput` - Trial balance generation parameters
- `COAValidationResult` - Chart of accounts validation results
- `FxValidationResult` - Foreign exchange validation results

**Configuration**:

- FX policy settings and currency validation
- COA business rules and constraints
- SoD compliance requirements

## 7) Performance & Monitoring

**Bundle Size**:

- Target: <100KB for core business logic
- Optimized for tree-shaking and minimal dependencies
- Pure functions for better performance

**Performance Budget**:

- Journal validation: <10ms per entry
- Trial balance generation: <500ms for 1000 accounts
- Invoice calculations: <5ms per invoice

**Monitoring**:

- Performance metrics via @aibos/utils
- Error tracking and validation logging
- Business rule compliance monitoring

## 8) Security & Compliance

**Permissions**:

- SoD (Separation of Duties) compliance validation
- Role-based access control integration
- Multi-tenant data isolation

**Data Handling**:

- All input validated through Zod schemas
- Immutable data structures for calculations
- No direct database access (read-only through @aibos/db)

**Compliance**:

- Accounting principles enforcement
- COA business rules validation
- Audit trail integration

## 9) Core Modules

### **Journal Posting (`posting.ts`)**

- `validateJournalPosting()` - Comprehensive journal validation
- `postJournal()` - Journal posting with business rules
- `validateBalanced()` - Debit/credit balance validation
- `validateSoDCompliance()` - Separation of duties checks

### **Invoice Posting (`ar/invoice-posting.ts`)**

- `validateInvoicePosting()` - AR invoice to GL validation
- `calculateInvoiceTotals()` - Invoice amount calculations
- `validateInvoiceLines()` - Line item validation
- `generateInvoiceDescription()` - Description generation

### **Financial Reports (`reports/`)**

- `generateTrialBalance()` - Trial balance report engine
- `generateBalanceSheet()` - Balance sheet generation
- `generateProfitLoss()` - P&L statement generation
- `generateCashFlow()` - Cash flow statement generation

### **FX Management (`fx/`)**

- `validateFxPolicy()` - Currency validation and FX requirements
- `FxPolicy` - FX policy configuration
- Currency code validation and conversion rules

### **COA Validation (`coa-validation.ts`)**

- `validateCOAFlags()` - Chart of accounts validation
- `validateAccountsExist()` - Account existence checks
- `validateNormalBalances()` - Normal balance rule validation
- `validateControlAccounts()` - Control account restrictions

### **Tax Calculations (`tax-calculations.ts`)**

- Tax amount calculations
- Tax code validation
- Multi-currency tax handling

## 10) Business Rules

### **Journal Posting Rules**

- All journals must be balanced (debits = credits)
- Maximum 100 lines per journal entry
- SoD compliance required for posting
- Future-dated journals not allowed
- Control accounts cannot be posted to directly

### **Invoice Posting Rules**

- AR amount must equal revenue + tax
- All accounts must exist and be active
- Revenue accounts must be REVENUE type
- AR account must be ASSET type
- Tax accounts must be LIABILITY type

### **COA Validation Rules**

- Account existence and active status validation
- Currency consistency across journal entries
- Normal balance rule warnings
- Control account posting restrictions
- Parent-child account hierarchy validation

### **FX Policy Rules**

- Valid ISO 4217 currency codes only
- Exchange rate required for non-base currencies
- Currency normalization and validation
- Rounding policy enforcement

## 11) Troubleshooting

**Common Issues**:

- **Validation errors**: Check input data against Zod schemas
- **SoD violations**: Verify user roles and permissions
- **COA errors**: Ensure accounts exist and are active
- **Balance errors**: Verify debit/credit calculations

**Debug Mode**:

```bash
# Enable detailed logging
LOG_LEVEL=debug pnpm test

# Run specific validation tests
pnpm test --grep "COA validation"
```

**Logs**:

- Validation error details with error codes
- Business rule violation warnings
- Performance metrics for calculations
- SoD compliance check results

## 12) Contributing

**Code Style**:

- Follow functional programming principles
- Use pure functions where possible
- Implement comprehensive error handling
- Maintain business rule consistency

**Testing**:

- Write unit tests for all business logic
- Test edge cases and error scenarios
- Validate SoD compliance scenarios
- Test multi-currency calculations

**Review Process**:

- All changes must maintain business rule integrity
- Accounting principles must be preserved
- Performance impact must be considered
- SoD compliance must be maintained

---

## 📚 **Additional Resources**

- [Project README](../README.md)
- [Architecture Guide](../docs/ARCHITECTURE.md)
- [Integration Strategy](../DRAFT_INTEGRATION STRATEGY.md)
- [Database Package](../packages/db/README.md)
- [Auth Package](../packages/auth/README.md)

---

## 🧮 **Accounting Principles**

### **Double-Entry Bookkeeping**

- Every transaction affects at least two accounts
- Total debits must equal total credits
- Assets = Liabilities + Equity

### **Chart of Accounts Rules**

- Hierarchical account structure
- Control accounts cannot be posted to directly
- Normal balance rules for each account type
- Currency consistency within journals

### **Separation of Duties**

- Different roles for different operations
- Approval workflows for sensitive transactions
- Audit trail for all changes
- Multi-level authorization

### **Financial Reporting**

- All reports derive from GL journal entries
- Trial balance as foundation for all reports
- Multi-currency consolidation support
- Period-based reporting with fiscal year support

---

**Last Updated**: 2025-09-13 • **Version**: 0.1.0
