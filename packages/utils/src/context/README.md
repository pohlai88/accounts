# Context — Request Context Management Module

> **TL;DR**: V1 compliance request context management with user context extraction and validation
> for comprehensive context tracking.  
> **Owner**: @aibos/utils-team • **Status**: stable • **Since**: 2024-12  
> **Standards**: CommonMark • SemVer • Conventional Commits • Keep a Changelog

---

## 1) Scope & Boundaries

**Does**:

- Request context creation and management
- User context extraction and validation
- Audit context creation and sanitization
- Context validation and sanitization
- V1 compliance context tracking
- Session and request ID management

**Does NOT**:

- Handle authentication (delegated to @aibos/auth)
- Manage database operations (delegated to @aibos/db)
- Process business logic (delegated to @aibos/accounting)
- Generate financial reports (delegated to @aibos/accounting/src/reports)

**Consumers**: @aibos/utils, @aibos/web-api, @aibos/accounting, external context systems

## 2) Quick Links

- **Request Context**: `request-context.ts`
- **Main Utils**: `../README.md`
- **Audit Module**: `../audit/README.md`
- **Auth Module**: `../auth/README.md`

## 3) Getting Started

```typescript
import {
  createRequestContext,
  extractUserContext,
  createAuditContext,
  validateContext,
  sanitizeContext,
} from "@aibos/utils/context";

// Create request context
const requestContext = createRequestContext({
  tenantId: "tenant-123",
  companyId: "company-456",
  userId: "user-789",
  userRole: "accountant",
  sessionId: "session-abc",
  requestId: "req-xyz",
});

// Extract user context from request
const userContext = extractUserContext(request);

// Create audit context
const auditContext = createAuditContext(requestContext);

// Validate context
const isValid = validateContext(requestContext);
if (!isValid) {
  throw new Error("Invalid request context");
}

// Sanitize context for logging
const sanitizedContext = sanitizeContext(requestContext);
```

## 4) Architecture & Dependencies

**Dependencies**:

- Request object for context extraction
- Validation utilities for context validation
- Audit service for context logging

**Dependents**:

- @aibos/utils for context management
- @aibos/web-api for API context
- @aibos/accounting for business logic context

**Build Order**: Independent module, can be built alongside other utils modules

## 5) Development Workflow

**Local Dev**:

```bash
pnpm --filter @aibos/utils dev
pnpm --filter @aibos/utils test
```

**Testing**:

```bash
pnpm --filter @aibos/utils test src/context/
```

**Linting**:

```bash
pnpm --filter @aibos/utils lint src/context/
```

**Type Checking**:

```bash
pnpm --filter @aibos/utils typecheck
```

## 6) API Surface

**Exports**:

### Request Context (`request-context.ts`)

- `createRequestContext()` - Create request context
- `extractUserContext()` - Extract user context from request
- `createAuditContext()` - Create audit context
- `validateContext()` - Validate context
- `sanitizeContext()` - Sanitize context for logging

**Public Types**:

- `RequestContext` - Request context interface
- `UserContext` - User context interface
- `AuditContext` - Audit context interface
- `ContextValidation` - Context validation result

**Configuration**:

- Configurable context validation rules
- Context sanitization policies
- V1 compliance requirements

## 7) Performance & Monitoring

**Bundle Size**: ~6KB minified  
**Performance Budget**: <10ms for context creation, <5ms for context validation  
**Monitoring**: Axiom telemetry integration for context operations

## 8) Security & Compliance

**Permissions**:

- Context creation requires valid request
- Context validation requires proper authentication
- Context sanitization for security

**Data Handling**:

- All context data validated and sanitized
- Sensitive information removed from logs
- V1 compliance for context tracking

**Compliance**:

- V1 compliance for context operations
- SoD enforcement for context access
- Security audit compliance

## 9) Usage Examples

### Basic Context Creation

```typescript
import { createRequestContext, validateContext } from "@aibos/utils/context";

// Create request context
const requestContext = createRequestContext({
  tenantId: "tenant-123",
  companyId: "company-456",
  userId: "user-789",
  userRole: "accountant",
  sessionId: "session-abc",
  requestId: "req-xyz",
  ipAddress: "192.168.1.100",
  userAgent: "Mozilla/5.0...",
  timestamp: new Date(),
});

// Validate context
const validation = validateContext(requestContext);
if (!validation.isValid) {
  console.error("Context validation failed:", validation.errors);
  throw new Error("Invalid request context");
}

console.log("Request context created successfully");
console.log("Tenant ID:", requestContext.tenantId);
console.log("Company ID:", requestContext.companyId);
console.log("User ID:", requestContext.userId);
console.log("User Role:", requestContext.userRole);
```

### User Context Extraction

```typescript
import { extractUserContext, createRequestContext } from "@aibos/utils/context";

// Simulate request object
const request = {
  headers: {
    "x-user-id": "user-789",
    "x-user-role": "accountant",
    "x-tenant-id": "tenant-123",
    "x-company-id": "company-456",
    "x-session-id": "session-abc",
  },
  ip: "192.168.1.100",
  userAgent: "Mozilla/5.0...",
};

// Extract user context
const userContext = extractUserContext(request);
console.log("User context extracted:", userContext);

// Create full request context
const requestContext = createRequestContext({
  ...userContext,
  requestId: "req-xyz",
  ipAddress: request.ip,
  userAgent: request.userAgent,
  timestamp: new Date(),
});
```

### Audit Context Creation

```typescript
import { createAuditContext, sanitizeContext } from "@aibos/utils/context";

// Create request context
const requestContext = createRequestContext({
  tenantId: "tenant-123",
  companyId: "company-456",
  userId: "user-789",
  userRole: "accountant",
  sessionId: "session-abc",
  requestId: "req-xyz",
  ipAddress: "192.168.1.100",
  userAgent: "Mozilla/5.0...",
  timestamp: new Date(),
});

// Create audit context
const auditContext = createAuditContext(requestContext);
console.log("Audit context created:", auditContext);

// Sanitize context for logging
const sanitizedContext = sanitizeContext(requestContext);
console.log("Sanitized context:", sanitizedContext);
// Sensitive information removed, safe for logging
```

### Context Validation

```typescript
import { createRequestContext, validateContext } from "@aibos/utils/context";

// Create valid context
const validContext = createRequestContext({
  tenantId: "tenant-123",
  companyId: "company-456",
  userId: "user-789",
  userRole: "accountant",
  sessionId: "session-abc",
  requestId: "req-xyz",
});

const validValidation = validateContext(validContext);
console.log("Valid context:", validValidation.isValid); // true
console.log("Errors:", validValidation.errors); // []

// Create invalid context (missing required fields)
const invalidContext = createRequestContext({
  tenantId: "tenant-123",
  // Missing companyId, userId, userRole, sessionId, requestId
});

const invalidValidation = validateContext(invalidContext);
console.log("Invalid context:", invalidValidation.isValid); // false
console.log("Errors:", invalidValidation.errors);
// ['Company ID is required', 'User ID is required', 'User role is required', ...]
```

### Advanced Context Management

```typescript
import {
  createRequestContext,
  extractUserContext,
  createAuditContext,
  validateContext,
  sanitizeContext,
} from "@aibos/utils/context";

// Advanced context creation with additional metadata
const requestContext = createRequestContext({
  tenantId: "tenant-123",
  companyId: "company-456",
  userId: "user-789",
  userRole: "accountant",
  sessionId: "session-abc",
  requestId: "req-xyz",
  ipAddress: "192.168.1.100",
  userAgent: "Mozilla/5.0...",
  timestamp: new Date(),
  metadata: {
    source: "web-api",
    version: "1.0.0",
    environment: "production",
  },
});

// Validate context with custom rules
const validation = validateContext(requestContext, {
  requireIpAddress: true,
  requireUserAgent: true,
  requireMetadata: true,
});

if (!validation.isValid) {
  console.error("Context validation failed:", validation.errors);
  throw new Error("Invalid request context");
}

// Create audit context with additional audit metadata
const auditContext = createAuditContext(requestContext, {
  auditLevel: "DETAILED",
  includeMetadata: true,
  includeHeaders: true,
});

console.log("Audit context with metadata:", auditContext);

// Sanitize context with custom sanitization rules
const sanitizedContext = sanitizeContext(requestContext, {
  removeIpAddress: true,
  removeUserAgent: true,
  removeMetadata: false,
});

console.log("Sanitized context:", sanitizedContext);
```

### Context Middleware Integration

```typescript
import { createRequestContext, extractUserContext, validateContext } from "@aibos/utils/context";

// Express.js middleware example
function contextMiddleware(req: any, res: any, next: any) {
  try {
    // Extract user context from request
    const userContext = extractUserContext(req);

    // Create full request context
    const requestContext = createRequestContext({
      ...userContext,
      requestId: req.id || `req-${Date.now()}`,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get("User-Agent"),
      timestamp: new Date(),
    });

    // Validate context
    const validation = validateContext(requestContext);
    if (!validation.isValid) {
      return res.status(400).json({
        error: "Invalid request context",
        details: validation.errors,
      });
    }

    // Attach context to request
    req.context = requestContext;

    next();
  } catch (error) {
    console.error("Context middleware error:", error);
    res.status(500).json({ error: "Context creation failed" });
  }
}

// Usage in Express app
app.use(contextMiddleware);

app.post("/api/journals", (req, res) => {
  const context = req.context;
  console.log("Processing journal with context:", context);

  // Use context for business logic
  // ...
});
```

## 10) Troubleshooting

**Common Issues**:

- **Context Validation Failed**: Check required fields and validation rules
- **User Context Missing**: Ensure proper request headers or authentication
- **Context Sanitization Issues**: Verify sanitization rules and sensitive data
- **Performance Issues**: Optimize context creation and validation

**Debug Mode**:

```typescript
// Enable detailed logging
process.env.DEBUG_CONTEXT = "true";
```

**Logs**: Check Axiom telemetry for context operation logs

## 11) Contributing

**Code Style**:

- Follow TypeScript best practices
- Use descriptive function names
- Implement proper error handling
- Document complex context logic

**Testing**:

- Test all context creation scenarios
- Test context validation rules
- Test context sanitization
- Test context extraction

**Review Process**:

- All context operations must be validated
- Security requirements must be met
- Context sanitization must be comprehensive
- Performance must be optimized

---

## 📚 **Additional Resources**

- [Utils Package README](../README.md)
- [Audit Module](../audit/README.md)
- [Auth Module](../auth/README.md)
- [Web API Package](../../web-api/README.md)
- [Accounting Package](../../accounting/README.md)

---

**Last Updated**: 2025-09-13 • **Version**: 0.1.0
