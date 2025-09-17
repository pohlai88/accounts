[**AI-BOS Accounts API Documentation**](../../README.md)

***

[AI-BOS Accounts API Documentation](../../README.md) / @aibos/db

# DOC-289: Documentation

**Version**: 1.0  
**Date**: 2025-09-17  
**Status**: Active  
**Owner**: Development Team  
**Last Updated**: 2025-09-17  
**Next Review**: 2025-12-17  

---

# @aibos/db

Database layer with Drizzle ORM integration, PostgreSQL schema management, and multi-tenant support.

## Overview

This package provides the database abstraction layer for the AI-BOS Accounting SaaS platform, featuring Drizzle ORM, PostgreSQL integration, multi-tenant architecture, and comprehensive schema management.

## Installation

```bash
pnpm add @aibos/db
```

## Core Features

### Database Operations
- Drizzle ORM integration
- PostgreSQL connection management
- Query optimization and performance monitoring
- Transaction support
- Connection pooling

### Schema Management
- Multi-tenant database structure
- Row Level Security (RLS) policies
- Migration management with Drizzle Kit
- Schema validation and constraints
- Index optimization

### Multi-Tenant Support
- Tenant isolation at database level
- Company-level data segregation
- User context management
- Cross-tenant query prevention

### Data Access Layer
- Repository pattern implementation
- Type-safe database operations
- Query builders and helpers
- Bulk operations support

## API Reference

### Database Connection

```typescript
import { db, getDb, ensureDb } from "@aibos/db";

// Get database instance
const database = getDb();

// Ensure database connection
const connectedDb = ensureDb();

// Use with Drizzle ORM
import { eq, and, or } from "drizzle-orm";
```

### Schema Access

```typescript
import { 
  tenants, 
  companies, 
  users, 
  invoices, 
  bills, 
  payments,
  journalEntries,
  accounts,
  customers,
  vendors
} from "@aibos/db";

// Query tenants
const tenantList = await db.select().from(tenants);

// Query with conditions
const activeTenants = await db
  .select()
  .from(tenants)
  .where(eq(tenants.status, "active"));
```

### Multi-Tenant Queries

```typescript
import { getDb } from "@aibos/db";

// Query with tenant context
async function getTenantInvoices(tenantId: string) {
  const db = getDb();
  
  return await db
    .select()
    .from(invoices)
    .where(eq(invoices.tenantId, tenantId));
}

// Query with company context
async function getCompanyBills(tenantId: string, companyId: string) {
  const db = getDb();
  
  return await db
    .select()
    .from(bills)
    .where(
      and(
        eq(bills.tenantId, tenantId),
        eq(bills.companyId, companyId)
      )
    );
}
```

### Transactions

```typescript
import { db } from "@aibos/db";

// Use transactions for data consistency
await db.transaction(async (tx) => {
  // Insert invoice
  const [invoice] = await tx
    .insert(invoices)
    .values(invoiceData)
    .returning();

  // Insert invoice lines
  await tx
    .insert(invoiceLines)
    .values(invoiceLinesData);

  // Update customer balance
  await tx
    .update(customers)
    .set({ balance: newBalance })
    .where(eq(customers.id, customerId));
});
```

### Bulk Operations

```typescript
import { db } from "@aibos/db";

// Bulk insert
await db
  .insert(invoices)
  .values([
    invoiceData1,
    invoiceData2,
    invoiceData3
  ]);

// Bulk update
await db
  .update(invoices)
  .set({ status: "paid" })
  .where(
    or(
      eq(invoices.id, "inv_001"),
      eq(invoices.id, "inv_002"),
      eq(invoices.id, "inv_003")
    )
  );
```

## Schema Structure

### Core Tables

```typescript
// Tenants table
const tenants = pgTable("tenants", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

// Companies table
const companies = pgTable("companies", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
  name: text("name").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

// Users table
const users = pgTable("users", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").notNull().default("user"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
```

### Accounting Tables

```typescript
// Invoices table
const invoices = pgTable("invoices", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
  companyId: text("company_id").notNull().references(() => companies.id),
  customerId: text("customer_id").notNull().references(() => customers.id),
  invoiceNumber: text("invoice_number").notNull(),
  invoiceDate: date("invoice_date").notNull(),
  dueDate: date("due_date").notNull(),
  totalAmount: decimal("total_amount", { precision: 15, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("USD"),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

// Bills table
const bills = pgTable("bills", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
  companyId: text("company_id").notNull().references(() => companies.id),
  vendorId: text("vendor_id").notNull().references(() => vendors.id),
  billNumber: text("bill_number").notNull(),
  billDate: date("bill_date").notNull(),
  dueDate: date("due_date").notNull(),
  totalAmount: decimal("total_amount", { precision: 15, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("USD"),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
```

## Configuration

### Environment Variables

```env
# Database Connection
DATABASE_URL=postgresql://user:password@localhost:5432/accounts
DATABASE_POOL_SIZE=10
DATABASE_POOL_TIMEOUT=30000

# Connection Pooling
DB_CONNECTION_LIMIT=20
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=2000

# Performance
DB_QUERY_TIMEOUT=30000
DB_STATEMENT_TIMEOUT=30000
```

### Drizzle Configuration

```typescript
// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

## Database Management

### Migrations

```bash
# Generate migration
pnpm db:generate

# Run migrations
pnpm db:migrate

# Push schema changes
pnpm db:push

# Open Drizzle Studio
pnpm db:studio
```

### Schema Validation

```typescript
import { validateSchema } from "@aibos/db";

// Validate schema integrity
const validation = await validateSchema();

if (!validation.isValid) {
  console.error("Schema validation failed:", validation.errors);
}
```

## Performance Optimization

### Query Optimization

```typescript
import { optimizeQuery } from "@aibos/db";

// Optimize query performance
const optimizedQuery = optimizeQuery(
  db.select().from(invoices).where(eq(invoices.tenantId, tenantId))
);

// Use indexes for better performance
const indexQuery = db
  .select()
  .from(invoices)
  .where(
    and(
      eq(invoices.tenantId, tenantId),
      eq(invoices.status, "paid")
    )
  );
```

### Connection Pooling

```typescript
import { createConnectionPool } from "@aibos/db";

// Create optimized connection pool
const pool = createConnectionPool({
  max: 20,
  min: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

## Security

### Row Level Security (RLS)

```sql
-- Enable RLS on tenants table
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Create policy for tenant isolation
CREATE POLICY tenant_isolation ON tenants
  FOR ALL TO authenticated
  USING (id = current_setting('app.current_tenant_id'));
```

### Data Encryption

```typescript
import { encryptSensitiveData, decryptSensitiveData } from "@aibos/db";

// Encrypt sensitive data before storing
const encryptedData = encryptSensitiveData(sensitiveData);

// Decrypt sensitive data when retrieving
const decryptedData = decryptSensitiveData(encryptedData);
```

## Testing

```bash
# Run database tests
pnpm test

# Run tests with test database
pnpm test:database

# Run migration tests
pnpm test:migrations
```

## Dependencies

- **drizzle-orm**: Type-safe ORM for PostgreSQL
- **pg**: PostgreSQL client for Node.js
- **drizzle-kit**: Database toolkit and migrations

## Error Handling

```typescript
import { DatabaseError, ConnectionError } from "@aibos/db";

try {
  const result = await db.select().from(invoices);
} catch (error) {
  if (error instanceof ConnectionError) {
    // Handle connection errors
    console.error("Database connection failed:", error.message);
  } else if (error instanceof DatabaseError) {
    // Handle database errors
    console.error("Database error:", error.message);
  }
}
```

## Monitoring

### Query Performance

```typescript
import { monitorQueryPerformance } from "@aibos/db";

// Monitor query performance
const queryWithMonitoring = monitorQueryPerformance(
  db.select().from(invoices),
  "get_invoices"
);
```

### Connection Health

```typescript
import { checkConnectionHealth } from "@aibos/db";

// Check database connection health
const health = await checkConnectionHealth();

if (!health.isHealthy) {
  console.error("Database health check failed:", health.errors);
}
```

## Contributing

1. Follow the coding standards
2. Add tests for new features
3. Update schema documentation
4. Run quality checks: `pnpm quality:check`

## License

MIT License - see LICENSE file for details.

## Modules

- [](README.md)
- [adapter](adapter/README.md)
- [schema](schema/README.md)
- [types](types/README.md)
