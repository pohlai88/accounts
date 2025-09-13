# Database — Data Layer & Repository

> **TL;DR**: PostgreSQL database layer with Drizzle ORM, comprehensive accounting schema, and
> repository pattern. Implements D2 AR invoices, D4 financial reporting, and V1 compliance
> requirements.  
> **Owner**: @aibos/data-team • **Status**: stable • **Since**: 2024-12  
> **Standards**: CommonMark • SemVer • Conventional Commits • Keep a Changelog

---

## 1) Scope & Boundaries

**Does**:

- Provides PostgreSQL database schema and repository functions
- Implements comprehensive accounting data model (AR, AP, GL, reporting)
- Handles multi-tenant data isolation with RLS (Row Level Security)
- Manages journal entries, invoices, customers, and financial reporting
- Implements idempotency and audit logging for V1 compliance
- Provides Drizzle ORM integration with type-safe queries
- Handles currency and FX rate management
- Manages fiscal periods and period locks

**Does NOT**:

- Implement business logic (delegated to @aibos/accounting)
- Handle API endpoints (implemented by @aibos/web-api)
- Manage authentication (delegated to @aibos/auth)
- Provide UI components (implemented by @aibos/ui)

**Consumers**: @aibos/web-api, @aibos/accounting, @aibos/worker

## 2) Quick Links

- **Schema Definition**: `src/schema.ts`
- **Repository Functions**: `src/repos.ts`
- **Migrations**: `migrations/`
- **Drizzle Config**: `drizzle.config.ts`
- **Architecture Guide**: `../docs/ARCHITECTURE.md`
- **Integration Strategy**: `../DRAFT_INTEGRATION STRATEGY.md`

## 3) Getting Started

```bash
# Install dependencies
pnpm install

# Generate new migration
pnpm db:generate

# Run migrations
pnpm db:migrate

# Push schema changes (dev only)
pnpm db:push

# Open Drizzle Studio
pnpm db:studio

# Build the package
pnpm build
```

## 4) Architecture & Dependencies

**Dependencies**:

- `drizzle-orm` - Type-safe ORM for PostgreSQL
- `pg` - PostgreSQL client for Node.js

**Dependents**:

- `@aibos/web-api` - API endpoint implementations
- `@aibos/accounting` - Business logic layer
- `@aibos/worker` - Background job processing

**Build Order**: No dependencies, can be built independently

## 5) Development Workflow

**Local Dev**:

```bash
# Watch mode for development
pnpm dev

# Generate migration after schema changes
pnpm db:generate

# Apply migrations
pnpm db:migrate
```

**Testing**:

```bash
# Run database tests
pnpm test

# Test specific repository function
pnpm test --grep "insertJournal"
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

- Database schema definitions (tables, relations, indexes)
- Repository functions for CRUD operations
- Type definitions for database entities
- Database connection and configuration

**Public Types**:

- `Scope` - Multi-tenant context interface
- `JournalInput` - Journal entry creation interface
- `CustomerInput` - Customer creation interface
- `InvoiceInput` - Invoice creation interface
- `AccountInfo` - Chart of accounts information
- `DatabaseError` - Custom error class

**Configuration**:

- Database connection string via `DATABASE_URL`
- Drizzle ORM configuration
- Migration settings and paths

## 7) Performance & Monitoring

**Bundle Size**:

- Target: <200KB for database layer
- Optimized for tree-shaking
- Minimal dependencies for fast loading

**Performance Budget**:

- Query execution: <100ms for simple queries
- Complex joins: <500ms for reporting queries
- Migration time: <30s for schema changes

**Monitoring**:

- Query performance metrics
- Connection pool utilization
- Migration execution time
- Database size and growth

## 8) Security & Compliance

**Permissions**:

- Row Level Security (RLS) enforced at database level
- Multi-tenant data isolation
- JWT-based authentication context

**Data Handling**:

- Encrypted connections to database
- Sensitive data properly typed
- Audit logging for all changes

**Compliance**:

- V1 compliance with audit trails
- Idempotency for critical operations
- Data retention policies
- GDPR-ready data handling

## 9) Core Schema Modules

### **Multi-Tenant Structure**

- `tenants` - Tenant configuration and feature flags
- `companies` - Company settings and policy configuration
- `users` - User accounts and profiles
- `memberships` - User-tenant-company relationships

### **Chart of Accounts**

- `chartOfAccounts` - Hierarchical account structure
- `currencies` - Supported currencies
- `fxRates` - Foreign exchange rates
- `taxCodes` - Tax configuration

### **Journal Management**

- `journals` - General ledger journal entries
- `journalLines` - Journal line items
- `idempotencyKeys` - Idempotency tracking

### **Accounts Receivable (D2)**

- `customers` - Customer master data
- `invoices` - AR invoice records
- `invoiceLines` - Invoice line items

### **Accounts Payable (D3)**

- `suppliers` - Supplier master data
- `bills` - AP bill records
- `billLines` - Bill line items

### **Banking & Payments**

- `bankAccounts` - Bank account configuration
- `bankTransactions` - Bank transaction records
- `payments` - Payment records
- `paymentAllocations` - Payment allocations

### **Financial Reporting (D4)**

- `fiscalCalendars` - Fiscal year configuration
- `fiscalPeriods` - Period management
- `periodLocks` - Period locking mechanism
- `reversingEntries` - Journal reversals
- `reportCache` - Report caching
- `reportDefinitions` - Report configuration

### **Audit & Compliance**

- `auditLogs` - Comprehensive audit trail
- `attachments` - Document management (from schema-attachments)

## 10) Repository Functions

### **Journal Operations**

- `insertJournal()` - Create journal entries with validation
- `getJournal()` - Retrieve journal with lines
- `checkIdempotency()` - Idempotency validation
- `storeIdempotencyResult()` - Store idempotency results

### **Account Management**

- `getAccountsInfo()` - Get account details for validation
- `getAllAccountsInfo()` - Get all accounts for company

### **Customer Management**

- `insertCustomer()` - Create new customers
- `getCustomer()` - Retrieve customer details

### **Invoice Management**

- `insertInvoice()` - Create invoices with lines
- `getInvoice()` - Retrieve invoice with details
- `updateInvoicePosting()` - Update after GL posting
- `listInvoices()` - List with pagination and filtering

### **Tax Management**

- `getTaxCode()` - Get single tax code
- `getTaxCodes()` - Get multiple tax codes

## 11) Database Design Principles

### **Multi-Tenancy**

- Row Level Security (RLS) for data isolation
- Tenant-scoped queries and operations
- Company-level data segregation
- User context validation

### **Data Integrity**

- Foreign key constraints
- Check constraints for business rules
- Unique constraints for business keys
- Proper indexing for performance

### **Audit Trail**

- Comprehensive audit logging
- Change tracking for all entities
- User action attribution
- Request correlation

### **Performance**

- Strategic indexing for common queries
- Optimized for reporting operations
- Connection pooling
- Query optimization

## 12) Usage Examples

### **Journal Entry Creation**

```typescript
import { insertJournal, Scope } from '@aibos/db';

const scope: Scope = {
  tenantId: 'uuid',
  companyId: 'uuid',
  userId: 'uuid',
  userRole: 'accountant',
};

const journal = await insertJournal(scope, {
  journalNumber: 'JE-001',
  description: 'Monthly adjustment',
  journalDate: new Date('2024-01-01'),
  currency: 'MYR',
  lines: [
    { accountId: 'uuid', debit: 100.0, credit: 0, description: 'Debit entry' },
    { accountId: 'uuid', debit: 0, credit: 100.0, description: 'Credit entry' },
  ],
  idempotencyKey: 'unique-key',
});
```

### **Invoice Creation**

```typescript
import { insertInvoice, insertCustomer } from '@aibos/db';

// Create customer first
const customer = await insertCustomer(scope, {
  customerNumber: 'CUST-001',
  name: 'Acme Corp',
  email: 'billing@acme.com',
  currency: 'MYR',
  paymentTerms: 'NET_30',
});

// Create invoice
const invoice = await insertInvoice(scope, {
  customerId: customer.id,
  invoiceNumber: 'INV-001',
  invoiceDate: new Date('2024-01-01'),
  dueDate: new Date('2024-01-31'),
  currency: 'MYR',
  lines: [
    {
      lineNumber: 1,
      description: 'Product A',
      quantity: 1,
      unitPrice: 100.0,
      lineAmount: 100.0,
      revenueAccountId: 'uuid',
    },
  ],
});
```

### **Account Validation**

```typescript
import { getAccountsInfo } from '@aibos/db';

// Validate accounts before journal posting
const accountIds = ['uuid1', 'uuid2', 'uuid3'];
const accounts = await getAccountsInfo(scope, accountIds);

// Check if all accounts are active and valid
for (const [id, account] of accounts) {
  if (!account.isActive) {
    throw new Error(`Account ${account.code} is not active`);
  }
}
```

## 13) Troubleshooting

**Common Issues**:

- **Connection Errors**: Check `DATABASE_URL` environment variable
- **Migration Failures**: Verify database permissions and schema state
- **RLS Errors**: Ensure proper tenant context in queries
- **Constraint Violations**: Check foreign key relationships and unique constraints

**Debug Mode**:

```bash
# Enable Drizzle debug logging
DEBUG=drizzle pnpm dev

# Check database connection
pnpm db:studio
```

**Logs**:

- Database query logs
- Migration execution logs
- Connection pool metrics
- RLS policy violations

## 14) Contributing

**Code Style**:

- Follow Drizzle ORM best practices
- Use descriptive table and column names
- Include proper indexes for performance
- Maintain backward compatibility

**Testing**:

- Write tests for all repository functions
- Test error scenarios and edge cases
- Validate RLS policies work correctly
- Test migration scripts

**Review Process**:

- All schema changes require migration
- Breaking changes need major version bump
- Performance impact must be assessed
- Documentation must be updated

---

## 📚 **Additional Resources**

- [Project README](../README.md)
- [Architecture Guide](../docs/ARCHITECTURE.md)
- [Integration Strategy](../DRAFT_INTEGRATION STRATEGY.md)
- [Web API Package](../apps/web-api/README.md)
- [Accounting Package](../packages/accounting/README.md)

---

## 🔗 **Database Principles**

### **Type Safety First**

- Drizzle ORM provides compile-time type safety
- All queries are type-checked
- Schema changes automatically update types
- Runtime validation through ORM

### **Multi-Tenant Architecture**

- Row Level Security for data isolation
- Tenant-scoped operations
- Company-level data segregation
- User context validation

### **Performance Optimization**

- Strategic indexing for common queries
- Optimized for reporting operations
- Connection pooling
- Query optimization

### **Data Integrity**

- Foreign key constraints
- Business rule enforcement
- Audit trail maintenance
- Idempotency support

---

**Last Updated**: 2025-09-13 • **Version**: 0.1.0
