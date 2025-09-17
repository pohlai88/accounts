# DOC-133: Documentation

**Version**: 1.0  
**Date**: 2025-09-17  
**Status**: Active  
**Owner**: Development Team  
**Last Updated**: 2025-09-17  
**Next Review**: 2025-12-17  

---

# Web API — Backend for Frontend (BFF)

> **TL;DR**: Next.js 14 API routes serving as BFF layer with contract-first design, comprehensive
> audit logging, and multi-tenant accounting operations.  
> **Owner**: @aibos/backend-team • **Status**: stable • **Since**: 2024-12  
> **Standards**: CommonMark • SemVer • Conventional Commits • Keep a Changelog

---

## 1) Scope & Boundaries

**Does**:

- Serves as Backend for Frontend (BFF) layer between web app and core business logic
- Implements RESTful API endpoints for accounting operations (invoices, journals, reports)
- Handles file attachment management with OCR and metadata extraction
- Provides financial reporting endpoints (trial balance, balance sheet, cash flow)
- Enforces authentication, authorization, and audit logging
- Implements idempotency and request correlation for reliability

**Does NOT**:

- Contain business logic (delegates to @aibos/accounting package)
- Handle direct database operations (uses @aibos/db package)
- Manage authentication/authorization logic (uses @aibos/auth package)
- Process background jobs (delegates to @aibos/worker service)

**Consumers**: @aibos/web frontend application

## 2) Quick Links

- **API Contracts**: `packages/contracts/src/`
- **Business Logic**: `packages/accounting/src/`
- **Database Layer**: `packages/db/src/`
- **Authentication**: `packages/auth/src/`
- **Utilities**: `packages/utils/src/`
- **Architecture Guide**: `../docs/ARCHITECTURE.md`
- **Integration Strategy**: `../DRAFT_INTEGRATION STRATEGY.md`

## 3) Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## 4) Architecture & Dependencies

**Dependencies**:

- `@aibos/accounting` - Core business logic and calculations
- `@aibos/auth` - Authentication and authorization
- `@aibos/contracts` - API contracts and type definitions
- `@aibos/db` - Database operations and schema
- `@aibos/utils` - Shared utilities and middleware
- `@aibos/tokens` - Design tokens (for consistency)
- `@supabase/supabase-js` - Database client
- `inngest` - Background job processing
- `next` - API framework
- `zod` - Schema validation

**Dependents**: @aibos/web frontend application

**Build Order**: Depends on all packages being built first (enforced by Turborepo)

## 5) Development Workflow

**Local Dev**:

```bash
# Start API server with hot reload
pnpm dev

# Access API at http://localhost:3001/api
# Health check at http://localhost:3001/api/health
```

**Testing**:

```bash
# Run unit tests
pnpm test

# Run integration tests
pnpm test:integration

# Run E2E tests
pnpm test:e2e
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
pnpm typecheck
```

## 6) API Surface

**Exports**:

- RESTful API endpoints under `/api/*`
- Server-side request handlers
- Middleware for authentication and validation

**Public Types**:

- Request/response schemas using Zod validation
- API contract types from @aibos/contracts
- Error response formats

**Configuration**:

- Next.js configuration in `next.config.mjs`
- Environment variables for database and services
- Transpiled packages for workspace dependencies

## 7) Performance & Monitoring

**Bundle Size**:

- Target: <350ms response time per endpoint
- Optimized with Next.js 14 App Router
- Connection pooling for database operations

**Performance Budget**:

- API Response Time: <200ms (95th percentile)
- Database Query Time: <100ms (95th percentile)
- File Upload Time: <5s for 10MB files

**Monitoring**:

- Axiom integration for comprehensive observability
- Performance monitoring via @aibos/utils
- Request correlation with `x-request-id` headers
- Audit logging for all operations

## 8) Security & Compliance

**Permissions**:

- Row Level Security (RLS) enforced at database level
- SoD (Separation of Duties) compliance checks
- Multi-tenant data isolation
- Feature flag-based access control

**Data Handling**:

- All input validated through Zod schemas
- Idempotency keys for mutation operations
- Request correlation for audit trails
- Secure file upload with type validation

**Compliance**:

- Comprehensive audit logging for all operations
- SoD compliance validation
- Multi-tenant security isolation
- GDPR-compliant data handling

## 9) API Endpoints

### **Invoices**

- `POST /api/invoices` - Create new invoice
- `GET /api/invoices` - List invoices
- `POST /api/invoices/[id]/post` - Post invoice to GL
- `POST /api/invoices/approve` - Approve invoice

### **Attachments**

- `POST /api/attachments/upload` - Upload file
- `GET /api/attachments/[id]` - Get attachment details
- `GET /api/attachments/[id]/download` - Download file
- `POST /api/attachments/batch` - Batch operations
- `GET /api/attachments/search` - Search attachments
- `POST /api/attachments/ocr` - OCR processing

### **Reports**

- `GET /api/reports/trial-balance` - Trial balance report
- `GET /api/reports/balance-sheet` - Balance sheet report
- `GET /api/reports/cash-flow` - Cash flow report
- `POST /api/reports/export` - Export reports

### **Journals**

- `GET /api/journals` - List journal entries
- `POST /api/journals` - Create journal entry

### **Periods**

- `GET /api/periods` - List accounting periods

### **Admin**

- `GET /api/admin/settings` - Get system settings
- `POST /api/admin/settings` - Update system settings

## 10) Troubleshooting

**Common Issues**:

- **Build failures**: Ensure all workspace packages are built first
- **Database connection**: Check Supabase environment variables
- **Validation errors**: Verify request schemas match contracts
- **Audit logging**: Check Axiom configuration

**Debug Mode**:

```bash
# Enable Next.js debug mode
DEBUG=next:* pnpm dev

# Enable detailed logging
LOG_LEVEL=debug pnpm dev
```

**Logs**:

- Development logs in terminal
- Production logs via Axiom dashboard
- Audit logs for all operations
- Performance metrics and traces

## 11) Contributing

**Code Style**:

- Follow contract-first development approach
- Use Zod for all input/output validation
- Implement comprehensive error handling
- Maintain audit logging for all operations

**Testing**:

- Write unit tests for all endpoints
- Test error scenarios and edge cases
- Validate SoD compliance
- Test multi-tenant isolation

**Review Process**:

- All changes must maintain contract compatibility
- Security review required for auth/authorization changes
- Performance impact must be considered
- Audit logging must be comprehensive

---

## 📚 **Additional Resources**

- [Project README](../README.md)
- [Architecture Guide](../docs/ARCHITECTURE.md)
- [Integration Strategy](../DRAFT_INTEGRATION STRATEGY.md)
- [Contracts Package](../packages/contracts/README.md)
- [Accounting Package](../packages/accounting/README.md)

---

## 🔧 **API Development Guidelines**

### **Contract-First Development**

- All endpoints must have Zod schemas for validation
- Request/response types must be defined in @aibos/contracts
- API changes require contract updates first

### **Error Handling**

- Use standardized error response format
- Include error codes and detailed messages
- Log all errors for audit trail

### **Security**

- Validate all inputs through Zod schemas
- Check SoD compliance for sensitive operations
- Implement proper authentication middleware
- Use idempotency keys for mutations

### **Performance**

- Implement connection pooling for database operations
- Use request correlation for debugging
- Monitor performance metrics
- Cache frequently accessed data

---

**Last Updated**: 2025-09-13 • **Version**: 0.1.0
