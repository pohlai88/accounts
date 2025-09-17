# DOC-052: Documentation

**Version**: 1.0  
**Date**: 2025-09-17  
**Status**: Active  
**Owner**: Development Team  
**Last Updated**: 2025-09-17  
**Next Review**: 2025-12-17  

---

# Supabase — Supabase Client Management Module

> **TL;DR**: V1 compliance Supabase client management with server, browser, and middleware clients
> for comprehensive database integration.  
> **Owner**: @aibos/utils-team • **Status**: stable • **Since**: 2024-12  
> **Standards**: CommonMark • SemVer • Conventional Commits • Keep a Changelog

---

## 1) Scope & Boundaries

**Does**:

- Supabase client creation and management
- Server-side Supabase client
- Browser-side Supabase client
- Middleware Supabase client
- Client configuration and initialization
- V1 compliance Supabase integration

**Does NOT**:

- Handle authentication (delegated to @aibos/auth)
- Manage database operations (delegated to @aibos/db)
- Process business logic (delegated to @aibos/accounting)
- Generate financial reports (delegated to @aibos/accounting/src/reports)

**Consumers**: @aibos/web, @aibos/web-api, @aibos/accounting, external Supabase systems

## 2) Quick Links

- **Server Client**: `server.ts`
- **Browser Client**: `client.ts`
- **Middleware Client**: `middleware.ts`
- **Main Utils**: `../README.md`
- **Context Module**: `../context/README.md`

## 3) Getting Started

```typescript
import {
  createServerClient,
  createBrowserClient,
  createMiddlewareClient,
} from "@aibos/utils/supabase";

// Server-side client
const serverClient = createServerClient();

// Browser-side client
const browserClient = createBrowserClient();

// Middleware client
const middlewareClient = createMiddlewareClient(request);
```

## 4) Architecture & Dependencies

**Dependencies**:

- Supabase client library
- Context management for client context
- Environment variables for configuration

**Dependents**:

- @aibos/web for frontend Supabase integration
- @aibos/web-api for API Supabase integration
- @aibos/accounting for business logic Supabase integration

**Build Order**: Independent module, can be built alongside other utils modules

## 5) Development Workflow

**Local Dev**:

```bash
pnpm --filter @aibos/utils dev
pnpm --filter @aibos/utils test
```

**Testing**:

```bash
pnpm --filter @aibos/utils test src/supabase/
```

**Linting**:

```bash
pnpm --filter @aibos/utils lint src/supabase/
```

**Type Checking**:

```bash
pnpm --filter @aibos/utils typecheck
```

## 6) API Surface

**Exports**:

### Server Client (`server.ts`)

- `createServerClient()` - Create server-side Supabase client
- `createServiceClient()` - Create service role Supabase client

### Browser Client (`client.ts`)

- `createBrowserClient()` - Create browser-side Supabase client

### Middleware Client (`middleware.ts`)

- `createMiddlewareClient()` - Create middleware Supabase client

**Public Types**:

- `SupabaseClient` - Supabase client interface
- `ClientConfig` - Client configuration interface
- `ServerClient` - Server client interface
- `BrowserClient` - Browser client interface

**Configuration**:

- Configurable Supabase URLs and keys
- Client-specific configuration options
- Environment-based configuration

## 7) Performance & Monitoring

**Bundle Size**: ~5KB minified  
**Performance Budget**: <100ms for client creation, <50ms for client operations  
**Monitoring**: Axiom telemetry integration for Supabase operations

## 8) Security & Compliance

**Permissions**:

- Client creation requires valid configuration
- Service client requires service role key
- Client operations require proper authentication

**Data Handling**:

- All client operations validated and sanitized
- Secure key management
- Audit trail for client operations

**Compliance**:

- V1 compliance for Supabase operations
- SoD enforcement for client access
- Security audit compliance

## 9) Usage Examples

### Server-Side Client

```typescript
import { createServerClient, createServiceClient } from "@aibos/utils/supabase";

// Create server client for API routes
const serverClient = createServerClient();

// Use server client for database operations
const { data: journals, error } = await serverClient
  .from("gl_journal")
  .select("*")
  .eq("tenant_id", "tenant-123")
  .eq("company_id", "company-456");

if (error) {
  console.error("Database error:", error);
  throw new Error("Failed to fetch journals");
}

console.log("Journals:", journals);

// Create service client for admin operations
const serviceClient = createServiceClient();

// Use service client for admin operations
const { data: users, error: userError } = await serviceClient
  .from("users")
  .select("*")
  .eq("tenant_id", "tenant-123");

if (userError) {
  console.error("User fetch error:", userError);
  throw new Error("Failed to fetch users");
}

console.log("Users:", users);
```

### Browser-Side Client

```typescript
import { createBrowserClient } from "@aibos/utils/supabase";

// Create browser client for frontend
const browserClient = createBrowserClient();

// Use browser client for user operations
const {
  data: { user },
  error,
} = await browserClient.auth.getUser();

if (error) {
  console.error("Auth error:", error);
  return;
}

console.log("Current user:", user);

// Use browser client for database operations
const { data: invoices, error: invoiceError } = await browserClient
  .from("ar_invoices")
  .select("*")
  .eq("tenant_id", user.tenant_id)
  .eq("company_id", user.company_id);

if (invoiceError) {
  console.error("Invoice fetch error:", invoiceError);
  return;
}

console.log("Invoices:", invoices);
```

### Middleware Client

```typescript
import { createMiddlewareClient } from "@aibos/utils/supabase";

// Express.js middleware
function supabaseMiddleware(req: any, res: any, next: any) {
  try {
    // Create middleware client
    const middlewareClient = createMiddlewareClient(req);

    // Attach client to request
    req.supabase = middlewareClient;

    next();
  } catch (error) {
    console.error("Supabase middleware error:", error);
    res.status(500).json({ error: "Supabase client creation failed" });
  }
}

// Usage in Express app
app.use(supabaseMiddleware);

app.get("/api/journals", async (req, res) => {
  try {
    // Use middleware client
    const { data: journals, error } = await req.supabase
      .from("gl_journal")
      .select("*")
      .eq("tenant_id", req.headers["x-tenant-id"])
      .eq("company_id", req.headers["x-company-id"]);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true, data: journals });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Advanced Client Configuration

```typescript
import { createServerClient, createBrowserClient } from "@aibos/utils/supabase";

// Create server client with custom configuration
const customServerClient = createServerClient({
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  options: {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: "public",
    },
    global: {
      headers: {
        "X-Client-Info": "aibos-accounting/1.0",
      },
    },
  },
});

// Create browser client with custom configuration
const customBrowserClient = createBrowserClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  options: {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    db: {
      schema: "public",
    },
  },
});
```

### Client Error Handling

```typescript
import { createServerClient } from "@aibos/utils/supabase";

const serverClient = createServerClient();

// Wrapper function for error handling
async function safeSupabaseOperation<T>(
  operation: () => Promise<{ data: T; error: any }>,
): Promise<{ data: T | null; error: string | null }> {
  try {
    const result = await operation();

    if (result.error) {
      console.error("Supabase error:", result.error);
      return { data: null, error: result.error.message };
    }

    return { data: result.data, error: null };
  } catch (error) {
    console.error("Operation error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Usage with error handling
const { data: journals, error } = await safeSupabaseOperation(() =>
  serverClient.from("gl_journal").select("*").eq("tenant_id", "tenant-123"),
);

if (error) {
  console.error("Failed to fetch journals:", error);
  return;
}

console.log("Journals:", journals);
```

### Client Monitoring and Logging

```typescript
import { createServerClient } from "@aibos/utils/supabase";

// Create client with monitoring
const monitoredClient = createServerClient({
  options: {
    global: {
      headers: {
        "X-Client-Info": "aibos-accounting/1.0",
        "X-Request-ID": generateRequestId(),
      },
    },
  },
});

// Wrapper for monitored operations
async function monitoredOperation<T>(operation: string, fn: () => Promise<T>): Promise<T> {
  const startTime = Date.now();

  try {
    const result = await fn();
    const duration = Date.now() - startTime;

    console.log(`Supabase operation ${operation} completed in ${duration}ms`);

    // Log to monitoring system
    await logOperation({
      operation,
      duration,
      success: true,
      timestamp: new Date(),
    });

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;

    console.error(`Supabase operation ${operation} failed after ${duration}ms:`, error);

    // Log to monitoring system
    await logOperation({
      operation,
      duration,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date(),
    });

    throw error;
  }
}

// Usage with monitoring
const journals = await monitoredOperation("fetch-journals", async () => {
  const { data, error } = await monitoredClient
    .from("gl_journal")
    .select("*")
    .eq("tenant_id", "tenant-123");

  if (error) throw error;
  return data;
});
```

## 10) Troubleshooting

**Common Issues**:

- **Client Creation Failed**: Check Supabase URL and key configuration
- **Authentication Errors**: Verify user authentication and session
- **Database Connection**: Check Supabase service status and configuration
- **Permission Denied**: Verify RLS policies and user permissions

**Debug Mode**:

```typescript
// Enable detailed logging
process.env.DEBUG_SUPABASE = "true";
```

**Logs**: Check Axiom telemetry for Supabase operation logs

## 11) Contributing

**Code Style**:

- Follow TypeScript best practices
- Use descriptive function names
- Implement proper error handling
- Document complex client logic

**Testing**:

- Test all client creation scenarios
- Test client operations and error handling
- Test client configuration
- Test client monitoring

**Review Process**:

- All client operations must be validated
- Security requirements must be met
- Client configuration must be comprehensive
- Performance must be optimized

---

## 📚 **Additional Resources**

- [Utils Package README](../README.md)
- [Context Module](../context/README.md)
- [Audit Module](../audit/README.md)
- [Web Package](../../web/README.md)
- [Web API Package](../../web-api/README.md)

---

**Last Updated**: 2025-09-13 • **Version**: 0.1.0
