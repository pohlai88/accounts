# @aibos/logger

**Single Source of Truth (SSOT) for all logging in the AI-BOS monorepo**

This package provides the ONLY logging solution allowed across the entire codebase. It enforces consistent, structured, and secure logging patterns.

## 🚫 FORBIDDEN Patterns

The following patterns are **STRICTLY PROHIBITED**:

```typescript
// ❌ FORBIDDEN: Raw console statements
console.log("User logged in");
console.info("Processing request");
console.warn("Rate limit exceeded");
console.error("Database error");

// ❌ FORBIDDEN: Template literals in logs
logger.info(`User ${userId} logged in from ${ip}`);
logger.warn(`Rate limit exceeded: ${count}/${limit}`);

// ❌ FORBIDDEN: Unstructured error logging
logger.error(error.message);
logger.error("Error: " + error.message);

// ❌ FORBIDDEN: Sensitive data in logs
logger.info("API call", {
  password: "secret123",
  apiKey: "sk-1234567890",
  token: "Bearer abc123",
});

// ❌ FORBIDDEN: Missing context
logger.info("User action performed");
logger.warn("Rate limit exceeded");
```

## ✅ ALLOWED Patterns

The following patterns are **REQUIRED**:

```typescript
import { logger } from "@aibos/logger";

// ✅ ALLOWED: Structured logging with explicit context
logger.info("User logged in", {
  userId: "123",
  tenantId: "abc",
  ip: "192.168.1.1",
});

// ✅ ALLOWED: Error logging with stack traces
logger.error("Database connection failed", error, {
  database: "postgres",
  host: "db.example.com",
});

// ✅ ALLOWED: Business metrics
logger.metric("user.signup", 1, "count", {
  tenantId: "tenant-123",
  source: "web",
});

// ✅ ALLOWED: Performance tracking
logger.performance("database.query", 45, {
  queryType: "SELECT",
  rowCount: 100,
});

// ✅ ALLOWED: Security events
logger.security("rate_limit_exceeded", {
  ip: "192.168.1.1",
  limit: 100,
  window: "1m",
});
```

## 🔗 Context-Bound Logging

For automatic request context binding:

```typescript
import { logger } from "@aibos/logger/bind";

// Automatically includes reqId, tenantId, userId, etc.
logger.info("Processing request", {
  operation: "create_user",
  duration: 150,
});
```

## 🛡️ Security Features

- **Automatic redaction** of sensitive fields
- **Structured logging** prevents injection attacks
- **Context correlation** for security auditing
- **Performance monitoring** for DoS detection

## 📊 Log Levels

| Level   | Usage               | Examples                             |
| ------- | ------------------- | ------------------------------------ |
| `trace` | Development only    | Function entry/exit, variable values |
| `debug` | Development/staging | API requests, database queries       |
| `info`  | All environments    | User actions, business events        |
| `warn`  | All environments    | Rate limits, deprecated usage        |
| `error` | All environments    | Application errors, failures         |
| `fatal` | All environments    | Critical system failures             |

## 🚀 Quick Start

```typescript
import { logger } from "@aibos/logger";

// Basic logging
logger.info("Application started", {
  version: "1.0.0",
  environment: "production",
});

// Error logging
try {
  await riskyOperation();
} catch (error) {
  logger.error("Operation failed", error, {
    operation: "riskyOperation",
    retryCount: 3,
  });
}

// Business metrics
logger.metric("payment.processed", 1, "count", {
  amount: 99.99,
  currency: "USD",
  tenantId: "tenant-123",
});
```

## 🔧 Configuration

Environment variables:

```bash
LOG_LEVEL=info                    # Log level
NODE_ENV=production               # Environment
ENABLE_LOG_REDACTION=true         # Enable redaction
ENABLE_LOG_SAMPLING=true          # Enable sampling
LOG_SAMPLE_RATE=0.1              # Sample rate (10%)
```

## 📚 Migration Guide

### From console.log

**Before:**

```typescript
console.log(`User ${userId} logged in from ${ip}`);
```

**After:**

```typescript
logger.info("User logged in", { userId, ip });
```

### From template literals

**Before:**

```typescript
logger.warn(`Rate limit exceeded: ${count}/${limit}`);
```

**After:**

```typescript
logger.warn("Rate limit exceeded", { count, limit });
```

### From unstructured errors

**Before:**

```typescript
logger.error("Error: " + error.message);
```

**After:**

```typescript
logger.error("Operation failed", error, { operation: "operationName" });
```

## 🧪 Testing

```typescript
import { logger } from "@aibos/logger";

// Mock logger for tests
jest.mock("@aibos/logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    // ... other methods
  },
}));
```

## 📖 API Reference

### Core Methods

- `logger.trace(message, metadata?)` - Trace-level logging
- `logger.debug(message, metadata?)` - Debug-level logging
- `logger.info(message, metadata?)` - Info-level logging
- `logger.warn(message, metadata?)` - Warning-level logging
- `logger.error(message, error?, metadata?)` - Error-level logging
- `logger.fatal(message, error?, metadata?)` - Fatal-level logging

### Specialized Methods

- `logger.metric(event, value, unit, metadata?)` - Business metrics
- `logger.performance(operation, duration, metadata?)` - Performance tracking
- `logger.security(event, metadata?)` - Security events

### Context-Bound Methods

- `logger.info(message, metadata?)` - Automatically includes request context
- `logger.error(message, error?, metadata?)` - Automatically includes request context

## 🔍 Troubleshooting

### Common Issues

1. **Logs not appearing**: Check `LOG_LEVEL` environment variable
2. **Sensitive data in logs**: Ensure redaction is enabled
3. **Performance issues**: Enable sampling in production
4. **Missing context**: Use context-bound logger

### Debug Mode

```typescript
// Enable debug logging
process.env.LOG_LEVEL = "debug";

// Check logger configuration
console.log("Logger config:", logger.getConfig());
```

## 📋 Compliance

- **GDPR**: Automatic PII redaction
- **SOC 2**: Audit trail logging
- **HIPAA**: Healthcare data protection
- **PCI DSS**: Payment data security

## 🤝 Contributing

1. Follow SSOT patterns
2. Use only allowed logging methods
3. Include proper context in all logs
4. Test with different log levels
5. Document any new patterns

## 📄 License

MIT License - see LICENSE file for details.
