# DOC-173: Documentation

**Version**: 1.0  
**Date**: 2025-09-17  
**Status**: Active  
**Owner**: Development Team  
**Last Updated**: 2025-09-17  
**Next Review**: 2025-12-17  

---

# Middleware — Middleware Utilities Module

> **TL;DR**: V1 compliance middleware utilities with idempotency support and comprehensive
> middleware management.  
> **Owner**: @aibos/utils-team • **Status**: stable • **Since**: 2024-12  
> **Standards**: CommonMark • SemVer • Conventional Commits • Keep a Changelog

---

## 1) Scope & Boundaries

**Does**:

- Idempotency middleware for API operations
- Request validation and sanitization
- Error handling and logging
- V1 compliance middleware
- Middleware composition and chaining
- Request/response transformation

**Does NOT**:

- Handle authentication (delegated to @aibos/auth)
- Manage database operations (delegated to @aibos/db)
- Process business logic (delegated to @aibos/accounting)
- Generate financial reports (delegated to @aibos/accounting/src/reports)

**Consumers**: @aibos/web-api, @aibos/accounting, external middleware systems

## 2) Quick Links

- **Idempotency**: `idempotency.ts`
- **Main Utils**: `../README.md`
- **Context Module**: `../context/README.md`
- **Audit Module**: `../audit/README.md`

## 3) Getting Started

```typescript
import {
  createIdempotencyMiddleware,
  validateRequest,
  sanitizeRequest,
  errorHandler,
  requestLogger,
} from "@aibos/utils/middleware";

// Create idempotency middleware
const idempotencyMiddleware = createIdempotencyMiddleware({
  keyGenerator: req => req.headers["x-idempotency-key"],
  ttl: 3600, // 1 hour
  storage: "redis", // or 'memory'
});

// Express.js middleware usage
app.use(idempotencyMiddleware);
app.use(requestLogger);
app.use(validateRequest);
app.use(sanitizeRequest);
app.use(errorHandler);
```

## 4) Architecture & Dependencies

**Dependencies**:

- Express.js for middleware integration
- Redis for idempotency storage
- Context management for request context
- Audit service for middleware logging

**Dependents**:

- @aibos/web-api for API middleware
- @aibos/accounting for business logic middleware
- External middleware systems

**Build Order**: After context and audit modules, before web-api integration

## 5) Development Workflow

**Local Dev**:

```bash
pnpm --filter @aibos/utils dev
pnpm --filter @aibos/utils test
```

**Testing**:

```bash
pnpm --filter @aibos/utils test src/middleware/
```

**Linting**:

```bash
pnpm --filter @aibos/utils lint src/middleware/
```

**Type Checking**:

```bash
pnpm --filter @aibos/utils typecheck
```

## 6) API Surface

**Exports**:

### Idempotency (`idempotency.ts`)

- `createIdempotencyMiddleware()` - Create idempotency middleware
- `IdempotencyConfig` - Idempotency configuration interface
- `IdempotencyResult` - Idempotency result interface

### Middleware Utilities

- `validateRequest()` - Request validation middleware
- `sanitizeRequest()` - Request sanitization middleware
- `errorHandler()` - Error handling middleware
- `requestLogger()` - Request logging middleware

**Public Types**:

- `IdempotencyConfig` - Idempotency configuration
- `IdempotencyResult` - Idempotency result
- `MiddlewareConfig` - Middleware configuration
- `RequestValidation` - Request validation result

**Configuration**:

- Configurable idempotency settings
- Request validation rules
- Error handling policies

## 7) Performance & Monitoring

**Bundle Size**: ~10KB minified  
**Performance Budget**: <50ms for idempotency check, <10ms for request validation  
**Monitoring**: Axiom telemetry integration for middleware operations

## 8) Security & Compliance

**Permissions**:

- Middleware execution requires valid request context
- Idempotency checks require proper authentication
- Request validation enforced

**Data Handling**:

- All request data validated and sanitized
- Secure idempotency key generation
- Audit trail for middleware operations

**Compliance**:

- V1 compliance for middleware operations
- SoD enforcement for middleware access
- Security audit compliance

## 9) Usage Examples

### Basic Idempotency Middleware

```typescript
import { createIdempotencyMiddleware } from "@aibos/utils/middleware";

// Create idempotency middleware
const idempotencyMiddleware = createIdempotencyMiddleware({
  keyGenerator: req => req.headers["x-idempotency-key"],
  ttl: 3600, // 1 hour
  storage: "redis",
  redisConfig: {
    host: "localhost",
    port: 6379,
    password: "password",
  },
});

// Express.js usage
app.use("/api/journals", idempotencyMiddleware);

app.post("/api/journals", async (req, res) => {
  try {
    // Process journal creation
    const journal = await createJournal(req.body);
    res.json({ success: true, data: journal });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Request Validation Middleware

```typescript
import { validateRequest } from "@aibos/utils/middleware";

// Create validation middleware
const validationMiddleware = validateRequest({
  rules: {
    body: {
      journalNumber: { type: "string", required: true },
      description: { type: "string", required: true },
      lines: { type: "array", required: true, minLength: 1 },
    },
    headers: {
      "x-tenant-id": { type: "string", required: true },
      "x-company-id": { type: "string", required: true },
    },
  },
  errorHandler: (errors, req, res, next) => {
    res.status(400).json({
      error: "Validation failed",
      details: errors,
    });
  },
});

// Usage
app.use("/api/journals", validationMiddleware);
```

### Request Sanitization Middleware

```typescript
import { sanitizeRequest } from "@aibos/utils/middleware";

// Create sanitization middleware
const sanitizationMiddleware = sanitizeRequest({
  body: {
    description: { type: "string", sanitize: "trim" },
    journalNumber: { type: "string", sanitize: "uppercase" },
    lines: { type: "array", sanitize: "deep" },
  },
  query: {
    page: { type: "number", default: 1, min: 1 },
    limit: { type: "number", default: 10, min: 1, max: 100 },
  },
});

// Usage
app.use("/api/journals", sanitizationMiddleware);
```

### Error Handling Middleware

```typescript
import { errorHandler } from "@aibos/utils/middleware";

// Create error handling middleware
const errorMiddleware = errorHandler({
  logErrors: true,
  logLevel: "error",
  includeStack: process.env.NODE_ENV === "development",
  formatError: (error, req) => ({
    message: error.message,
    code: error.code || "INTERNAL_ERROR",
    timestamp: new Date().toISOString(),
    requestId: req.id,
    path: req.path,
    method: req.method,
  }),
});

// Usage
app.use(errorMiddleware);
```

### Request Logging Middleware

```typescript
import { requestLogger } from "@aibos/utils/middleware";

// Create request logging middleware
const loggingMiddleware = requestLogger({
  level: "info",
  format: "combined",
  includeBody: false, // Don't log request body for security
  includeHeaders: ["x-tenant-id", "x-company-id", "x-user-id"],
  excludePaths: ["/health", "/metrics"],
});

// Usage
app.use(loggingMiddleware);
```

### Advanced Middleware Composition

```typescript
import {
  createIdempotencyMiddleware,
  validateRequest,
  sanitizeRequest,
  errorHandler,
  requestLogger,
} from "@aibos/utils/middleware";

// Create comprehensive middleware stack
const createMiddlewareStack = () => {
  const idempotency = createIdempotencyMiddleware({
    keyGenerator: req => req.headers["x-idempotency-key"],
    ttl: 3600,
    storage: "redis",
  });

  const validation = validateRequest({
    rules: {
      body: {
        journalNumber: { type: "string", required: true },
        description: { type: "string", required: true },
        lines: { type: "array", required: true, minLength: 1 },
      },
    },
  });

  const sanitization = sanitizeRequest({
    body: {
      description: { type: "string", sanitize: "trim" },
      journalNumber: { type: "string", sanitize: "uppercase" },
    },
  });

  const logging = requestLogger({
    level: "info",
    includeHeaders: ["x-tenant-id", "x-company-id", "x-user-id"],
  });

  const error = errorHandler({
    logErrors: true,
    includeStack: process.env.NODE_ENV === "development",
  });

  return [logging, idempotency, validation, sanitization, error];
};

// Apply middleware stack
const middlewareStack = createMiddlewareStack();
app.use("/api/journals", ...middlewareStack);
```

### Custom Middleware Creation

```typescript
import { Request, Response, NextFunction } from "express";

// Custom authentication middleware
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    // Validate token and extract user context
    const user = validateToken(token);
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

// Custom rate limiting middleware
const rateLimitMiddleware = (windowMs: number, maxRequests: number) => {
  const requests = new Map();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old requests
    for (const [ip, timestamps] of requests.entries()) {
      const validTimestamps = timestamps.filter((ts: number) => ts > windowStart);
      if (validTimestamps.length === 0) {
        requests.delete(ip);
      } else {
        requests.set(ip, validTimestamps);
      }
    }

    // Check current IP
    const ipRequests = requests.get(key) || [];
    if (ipRequests.length >= maxRequests) {
      return res.status(429).json({ error: "Rate limit exceeded" });
    }

    // Add current request
    ipRequests.push(now);
    requests.set(key, ipRequests);

    next();
  };
};

// Usage
app.use(authMiddleware);
app.use(rateLimitMiddleware(60000, 100)); // 100 requests per minute
```

## 10) Troubleshooting

**Common Issues**:

- **Idempotency Key Missing**: Ensure idempotency key is provided in headers
- **Validation Failed**: Check request structure and validation rules
- **Sanitization Issues**: Verify sanitization rules and data types
- **Rate Limit Exceeded**: Implement proper rate limiting

**Debug Mode**:

```typescript
// Enable detailed logging
process.env.DEBUG_MIDDLEWARE = "true";
```

**Logs**: Check Axiom telemetry for middleware operation logs

## 11) Contributing

**Code Style**:

- Follow TypeScript best practices
- Use descriptive function names
- Implement proper error handling
- Document complex middleware logic

**Testing**:

- Test all middleware functionality
- Test idempotency behavior
- Test request validation
- Test error handling

**Review Process**:

- All middleware operations must be validated
- Security requirements must be met
- Performance must be optimized
- Error handling must be comprehensive

---

## 📚 **Additional Resources**

- [Utils Package README](../README.md)
- [Context Module](../context/README.md)
- [Audit Module](../audit/README.md)
- [Web API Package](../../web-api/README.md)
- [Accounting Package](../../accounting/README.md)

---

**Last Updated**: 2025-09-13 • **Version**: 0.1.0
