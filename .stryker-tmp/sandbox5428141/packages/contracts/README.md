# DOC-156: Documentation

**Version**: 1.0  
**Date**: 2025-09-17  
**Status**: Active  
**Owner**: Development Team  
**Last Updated**: 2025-09-17  
**Next Review**: 2025-12-17  

---

# Contracts — API Contracts & Type Definitions

> **TL;DR**: Contract-first API definitions using Zod schemas for type safety, validation, and
> documentation. Covers D2 AR invoices, D4 financial reports, journal entries, attachments, and
> events.  
> **Owner**: @aibos/contracts-team • **Status**: stable • **Since**: 2024-12  
> **Standards**: CommonMark • SemVer • Conventional Commits • Keep a Changelog

---

## 1) Scope & Boundaries

**Does**:

- Defines API contracts using Zod schemas for type safety
- Provides request/response type definitions for all API endpoints
- Implements D2 AR invoice contracts with GL integration
- Covers D4 financial reporting contracts (trial balance, balance sheet, P&L, cash flow)
- Defines journal entry contracts with validation rules
- Provides attachment system contracts with OCR and approval workflows
- Includes event contracts for system integration
- Exports TypeScript types for compile-time safety

**Does NOT**:

- Implement business logic (delegated to @aibos/accounting)
- Handle database operations (delegated to @aibos/db)
- Provide API endpoints (implemented by @aibos/web-api)
- Manage authentication (delegated to @aibos/auth)

**Consumers**: @aibos/web-api, @aibos/web, @aibos/accounting, @aibos/worker

## 2) Quick Links

- **Invoice Contracts**: `src/invoice.ts`
- **Journal Contracts**: `src/journal.ts`
- **Report Contracts**: `src/reports.ts`
- **Attachment Contracts**: `src/attachments.ts`
- **Event Contracts**: `src/events.ts`
- **Enums**: `src/enums.ts`
- **Architecture Guide**: `../docs/ARCHITECTURE.md`
- **Integration Strategy**: `../DRAFT_INTEGRATION STRATEGY.md`

## 3) Getting Started

```bash
# Install dependencies
pnpm install

# Build the package
pnpm build

# Watch mode for development
pnpm dev

# Run linting
pnpm lint
```

## 4) Architecture & Dependencies

**Dependencies**:

- `zod` - Schema validation and type inference

**Dependents**:

- `@aibos/web-api` - API endpoint implementations
- `@aibos/web` - Frontend type safety
- `@aibos/accounting` - Business logic type safety
- `@aibos/worker` - Background job type safety

**Build Order**: No dependencies, can be built independently

## 5) Development Workflow

**Local Dev**:

```bash
# Build with watch mode
pnpm dev

# Check types
pnpm build
```

**Testing**:

```bash
# Run contract validation tests
pnpm test

# Test specific contract
pnpm test --grep "invoice"
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

- Zod schemas for all API contracts
- TypeScript types inferred from schemas
- Request/response validation functions
- Enum definitions for constants

**Public Types**:

- Request types (e.g., `TCreateInvoiceReq`)
- Response types (e.g., `TCreateInvoiceRes`)
- Event types (e.g., `TInvoiceApprovedEvt`)
- Enum types (e.g., `Currency`, `AttachmentCategory`)

**Configuration**:

- Schema validation rules
- Type inference configuration
- Export/import structure

## 7) Performance & Monitoring

**Bundle Size**:

- Target: <100KB for all contracts
- Optimized for tree-shaking
- Minimal dependencies for fast loading

**Performance Budget**:

- Schema validation: <1ms per request
- Type inference: <0.1ms per compilation
- Bundle size: <100KB total

**Monitoring**:

- Schema validation performance
- Type safety coverage
- Contract usage analytics

## 8) Security & Compliance

**Permissions**:

- No sensitive data in contracts
- Input validation through schemas
- Type safety for all operations

**Data Handling**:

- Immutable contract definitions
- Schema-based validation
- Type-safe data structures

**Compliance**:

- Contract versioning for API stability
- Backward compatibility maintenance
- Audit trail for contract changes

## 9) Core Modules

### **Invoice Contracts (`invoice.ts`)**

- `CreateInvoiceReq/Res` - Invoice creation
- `PostInvoiceReq/Res` - Invoice to GL posting
- `GetInvoiceRes` - Invoice retrieval
- `ListInvoicesReq/Res` - Invoice listing
- `CreateCustomerReq/Res` - Customer management

### **Journal Contracts (`journal.ts`)**

- `PostJournalReq/Res` - Journal entry posting
- `CreateJournalReq/Res` - Journal creation
- `JournalLine` - Journal line item schema
- `PostingErrorRes` - Error response schema

### **Report Contracts (`reports.ts`)**

- `TrialBalanceReq/Res` - Trial balance reports
- `BalanceSheetReq/Res` - Balance sheet reports
- `ProfitLossReq/Res` - P&L statements
- `CashFlowReq/Res` - Cash flow statements
- `ReportExportReq/Res` - Report export functionality

### **Attachment Contracts (`attachments.ts`)**

- `UploadAttachmentReq/Res` - File upload
- `GetAttachmentReq/Res` - Attachment retrieval
- `ListAttachmentsReq/Res` - Attachment listing
- `ProcessOCRReq/Res` - OCR processing
- `DocumentApprovalReq/Res` - Approval workflows
- `RetentionPolicyReq/Res` - Document retention

### **Event Contracts (`events.ts`)**

- `InvoiceApprovedEvt` - Invoice approval events
- Event schemas for system integration

### **Enums (`enums.ts`)**

- `CurrencyEnum` - Supported currencies
- Currency type definitions

## 10) Contract Design Principles

### **Contract-First Development**

- All APIs defined as contracts first
- Implementation follows contract definitions
- Type safety enforced at compile time
- Runtime validation through Zod schemas

### **Schema Validation**

- All inputs validated through Zod schemas
- Comprehensive error messages
- Type inference for TypeScript
- Runtime type safety

### **Versioning Strategy**

- Backward compatibility maintained
- New fields added as optional
- Breaking changes require major version bump
- Deprecation notices for old contracts

### **Documentation**

- Self-documenting through Zod schemas
- Type definitions serve as documentation
- Examples in schema descriptions
- Clear error messages for validation

## 11) Usage Examples

### **Invoice Creation**

```typescript
import { CreateInvoiceReq, CreateInvoiceRes } from "@aibos/contracts";

// Validate request
const request = CreateInvoiceReq.parse({
  tenantId: "uuid",
  companyId: "uuid",
  customerId: "uuid",
  invoiceNumber: "INV-001",
  invoiceDate: "2024-01-01",
  dueDate: "2024-01-31",
  currency: "MYR",
  lines: [
    {
      lineNumber: 1,
      description: "Product A",
      quantity: 1,
      unitPrice: 100.0,
      revenueAccountId: "uuid",
    },
  ],
});

// Type-safe response
const response: CreateInvoiceRes = {
  id: "uuid",
  invoiceNumber: "INV-001",
  // ... other fields
};
```

### **Journal Posting**

```typescript
import { PostJournalReq, PostJournalRes } from "@aibos/contracts";

const journalRequest = PostJournalReq.parse({
  journalNumber: "JE-001",
  description: "Monthly adjustment",
  journalDate: "2024-01-01T00:00:00Z",
  currency: "MYR",
  lines: [
    { accountId: "uuid", debit: 100.0, credit: 0 },
    { accountId: "uuid", debit: 0, credit: 100.0 },
  ],
  idempotencyKey: "uuid",
});
```

### **Report Generation**

```typescript
import { TrialBalanceReq, TrialBalanceRes } from "@aibos/contracts";

const reportRequest = TrialBalanceReq.parse({
  tenantId: "uuid",
  companyId: "uuid",
  asOfDate: "2024-01-01T00:00:00Z",
  includePeriodActivity: true,
  currency: "MYR",
});
```

## 12) Troubleshooting

**Common Issues**:

- **Validation Errors**: Check schema requirements and data types
- **Type Errors**: Ensure proper TypeScript types are imported
- **Schema Mismatches**: Verify contract versions match implementation
- **Missing Fields**: Check required vs optional fields in schemas

**Debug Mode**:

```bash
# Enable detailed validation logging
DEBUG=zod pnpm test

# Test specific schema validation
pnpm test --grep "CreateInvoiceReq"
```

**Logs**:

- Schema validation error details
- Type inference warnings
- Contract usage metrics
- Validation performance metrics

## 13) Contributing

**Code Style**:

- Follow Zod best practices
- Use descriptive schema names
- Include comprehensive validation rules
- Maintain backward compatibility

**Testing**:

- Write validation tests for all schemas
- Test edge cases and error scenarios
- Validate type inference works correctly
- Test backward compatibility

**Review Process**:

- All changes must maintain type safety
- Breaking changes require major version bump
- Schema changes need implementation updates
- Documentation must be updated

---

## 📚 **Additional Resources**

- [Project README](../README.md)
- [Architecture Guide](../docs/ARCHITECTURE.md)
- [Integration Strategy](../DRAFT_INTEGRATION STRATEGY.md)
- [Web API Package](../apps/web-api/README.md)
- [Accounting Package](../packages/accounting/README.md)

---

## 🔗 **Contract Principles**

### **Type Safety First**

- All contracts use Zod for validation
- TypeScript types inferred from schemas
- Compile-time type checking
- Runtime validation enforcement

### **Contract Stability**

- Backward compatibility maintained
- Versioning strategy for changes
- Deprecation notices for old contracts
- Clear migration paths

### **Documentation as Code**

- Schemas serve as documentation
- Self-documenting through types
- Examples in schema descriptions
- Clear error messages

### **Validation & Error Handling**

- Comprehensive input validation
- Clear error messages
- Type-safe error responses
- Graceful degradation

---

**Last Updated**: 2025-09-13 • **Version**: 0.1.0
