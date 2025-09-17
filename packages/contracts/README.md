# DOC-288: Documentation

**Version**: 1.0  
**Date**: 2025-09-17  
**Status**: Active  
**Owner**: Development Team  
**Last Updated**: 2025-09-17  
**Next Review**: 2025-12-17  

---

# @aibos/contracts

TypeScript type definitions and contracts for the AI-BOS Accounting SaaS platform.

## Installation

```bash
pnpm add @aibos/contracts
```

## Core Features

- **Type Definitions**: Comprehensive TypeScript types
- **API Contracts**: Request/response type definitions
- **Database Schema**: Database table and column types
- **Validation Schemas**: Zod validation schemas
- **Shared Interfaces**: Common interfaces across packages
- **Type Safety**: End-to-end type safety
- **Documentation**: Self-documenting code with types

## Quick Start

```typescript
import { 
  Invoice, 
  Bill, 
  Payment, 
  User, 
  Tenant,
  CreateInvoiceRequest,
  CreateInvoiceResponse
} from "@aibos/contracts";

// Use types
const invoice: Invoice = {
  id: "inv_001",
  tenantId: "tenant_123",
  companyId: "company_123",
  customerId: "customer_123",
  invoiceNumber: "INV-001",
  invoiceDate: new Date("2024-01-01"),
  dueDate: new Date("2024-01-31"),
  totalAmount: 1000,
  currency: "USD",
  status: "draft",
  createdAt: new Date(),
  updatedAt: new Date()
};

// Use request/response types
const createInvoiceRequest: CreateInvoiceRequest = {
  tenantId: "tenant_123",
  companyId: "company_123",
  customerId: "customer_123",
  invoiceNumber: "INV-001",
  invoiceDate: "2024-01-01",
  dueDate: "2024-01-31",
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
};
```

## Core Types

### User Types

```typescript
import { User, UserRole, UserStatus } from "@aibos/contracts";

// User interface
interface User {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

// User enums
enum UserRole {
  ADMIN = "admin",
  USER = "user",
  VIEWER = "viewer"
}

enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended"
}
```

### Tenant Types

```typescript
import { Tenant, TenantStatus, TenantSettings } from "@aibos/contracts";

// Tenant interface
interface Tenant {
  id: string;
  name: string;
  domain: string;
  status: TenantStatus;
  settings: TenantSettings;
  createdAt: Date;
  updatedAt: Date;
}

// Tenant settings
interface TenantSettings {
  maxUsers: number;
  features: string[];
  billing: {
    plan: string;
    status: string;
  };
}
```

### Accounting Types

```typescript
import { 
  Invoice, 
  InvoiceLine, 
  InvoiceStatus,
  Bill,
  BillLine,
  BillStatus,
  Payment,
  PaymentStatus
} from "@aibos/contracts";

// Invoice types
interface Invoice {
  id: string;
  tenantId: string;
  companyId: string;
  customerId: string;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  totalAmount: number;
  currency: string;
  status: InvoiceStatus;
  lines: InvoiceLine[];
  createdAt: Date;
  updatedAt: Date;
}

interface InvoiceLine {
  id: string;
  accountId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  lineTotal: number;
}

enum InvoiceStatus {
  DRAFT = "draft",
  SENT = "sent",
  PAID = "paid",
  OVERDUE = "overdue",
  CANCELLED = "cancelled"
}
```

## API Contracts

### Request Types

```typescript
import { 
  CreateInvoiceRequest,
  UpdateInvoiceRequest,
  CreateBillRequest,
  UpdateBillRequest,
  CreatePaymentRequest,
  UpdatePaymentRequest
} from "@aibos/contracts";

// Create invoice request
interface CreateInvoiceRequest {
  tenantId: string;
  companyId: string;
  customerId: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  lines: CreateInvoiceLineRequest[];
}

interface CreateInvoiceLineRequest {
  accountId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

// Update invoice request
interface UpdateInvoiceRequest {
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  currency?: string;
  status?: InvoiceStatus;
  lines?: UpdateInvoiceLineRequest[];
}
```

### Response Types

```typescript
import { 
  CreateInvoiceResponse,
  GetInvoicesResponse,
  GetInvoiceResponse,
  UpdateInvoiceResponse,
  DeleteInvoiceResponse
} from "@aibos/contracts";

// Create invoice response
interface CreateInvoiceResponse {
  success: boolean;
  data: Invoice;
  message: string;
}

// Get invoices response
interface GetInvoicesResponse {
  success: boolean;
  data: Invoice[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Get invoice response
interface GetInvoiceResponse {
  success: boolean;
  data: Invoice;
}
```

## Database Schema Types

### Table Types

```typescript
import { 
  TenantsTable,
  CompaniesTable,
  UsersTable,
  InvoicesTable,
  BillsTable,
  PaymentsTable
} from "@aibos/contracts";

// Database table types
interface TenantsTable {
  id: string;
  name: string;
  domain: string;
  status: string;
  settings: any;
  created_at: Date;
  updated_at: Date;
}

interface InvoicesTable {
  id: string;
  tenant_id: string;
  company_id: string;
  customer_id: string;
  invoice_number: string;
  invoice_date: Date;
  due_date: Date;
  total_amount: number;
  currency: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}
```

### Query Types

```typescript
import { 
  QueryOptions,
  PaginationOptions,
  SortOptions,
  FilterOptions
} from "@aibos/contracts";

// Query options
interface QueryOptions {
  pagination?: PaginationOptions;
  sort?: SortOptions;
  filters?: FilterOptions;
}

interface PaginationOptions {
  page: number;
  limit: number;
}

interface SortOptions {
  field: string;
  direction: "asc" | "desc";
}

interface FilterOptions {
  [key: string]: any;
}
```

## Validation Schemas

### Zod Schemas

```typescript
import { 
  invoiceSchema,
  billSchema,
  paymentSchema,
  userSchema,
  tenantSchema
} from "@aibos/contracts";

// Invoice validation schema
const invoiceSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  companyId: z.string().uuid(),
  customerId: z.string().uuid(),
  invoiceNumber: z.string().min(1).max(50),
  invoiceDate: z.date(),
  dueDate: z.date(),
  totalAmount: z.number().positive(),
  currency: z.string().length(3),
  status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]),
  lines: z.array(invoiceLineSchema),
  createdAt: z.date(),
  updatedAt: z.date()
});

// Create invoice request schema
const createInvoiceRequestSchema = z.object({
  tenantId: z.string().uuid(),
  companyId: z.string().uuid(),
  customerId: z.string().uuid(),
  invoiceNumber: z.string().min(1).max(50),
  invoiceDate: z.string().datetime(),
  dueDate: z.string().datetime(),
  currency: z.string().length(3),
  lines: z.array(createInvoiceLineRequestSchema)
});
```

### Validation Functions

```typescript
import { 
  validateInvoice,
  validateBill,
  validatePayment,
  validateUser,
  validateTenant
} from "@aibos/contracts";

// Validate invoice
const validation = validateInvoice(invoiceData);

if (!validation.success) {
  console.error("Validation failed:", validation.errors);
}

// Validate create request
const requestValidation = validateCreateInvoiceRequest(requestData);

if (!requestValidation.success) {
  console.error("Request validation failed:", requestValidation.errors);
}
```

## Shared Interfaces

### Common Interfaces

```typescript
import { 
  BaseEntity,
  TimestampedEntity,
  TenantEntity,
  AuditableEntity
} from "@aibos/contracts";

// Base entity interface
interface BaseEntity {
  id: string;
}

// Timestamped entity interface
interface TimestampedEntity extends BaseEntity {
  createdAt: Date;
  updatedAt: Date;
}

// Tenant entity interface
interface TenantEntity extends TimestampedEntity {
  tenantId: string;
}

// Auditable entity interface
interface AuditableEntity extends TenantEntity {
  createdBy: string;
  updatedBy: string;
}
```

### Error Interfaces

```typescript
import { 
  ApiError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError
} from "@aibos/contracts";

// API error interface
interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

// Validation error interface
interface ValidationError extends ApiError {
  field: string;
  value: any;
  constraint: string;
}

// Authentication error interface
interface AuthenticationError extends ApiError {
  reason: "invalid_token" | "expired_token" | "missing_token";
}
```

## Configuration

### Type Configuration

```typescript
const typeConfig = {
  strict: true,
  noImplicitAny: true,
  strictNullChecks: true,
  strictFunctionTypes: true,
  noImplicitReturns: true,
  noFallthroughCasesInSwitch: true,
  noUncheckedIndexedAccess: true
};
```

### Validation Configuration

```typescript
const validationConfig = {
  strict: true,
  abortEarly: false,
  allowUnknown: false,
  stripUnknown: true
};
```

## Testing

```bash
# Run contract tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run type checking
pnpm typecheck
```

## Dependencies

- **typescript**: TypeScript compiler
- **zod**: Runtime validation
- **@types/node**: Node.js types

## Performance Considerations

- **Type Compilation**: Types are compiled for performance
- **Tree Shaking**: Unused types are eliminated
- **Bundle Size**: Minimal runtime impact
- **Validation**: Efficient validation schemas

## Security

- **Type Safety**: Prevents runtime type errors
- **Input Validation**: Validates all inputs
- **Schema Validation**: Ensures data integrity
- **Type Guards**: Runtime type checking

## Error Handling

```typescript
import { 
  ContractError, 
  ValidationError, 
  TypeError 
} from "@aibos/contracts";

try {
  const result = validateInvoice(invoiceData);
} catch (error) {
  if (error instanceof ValidationError) {
    // Handle validation errors
    console.error("Validation failed:", error.details);
  } else if (error instanceof TypeError) {
    // Handle type errors
    console.error("Type error:", error.message);
  } else if (error instanceof ContractError) {
    // Handle contract errors
    console.error("Contract error:", error.message);
  }
}
```

## Contributing

1. Follow the coding standards
2. Add tests for new types
3. Update documentation
4. Run quality checks: `pnpm quality:check`

## License

MIT License - see LICENSE file for details.