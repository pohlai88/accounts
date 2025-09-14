# 🔧 **TECHNICAL SPECIFICATIONS - HYBRID OPTIMIZATION**

## **📋 OVERVIEW**

This document provides detailed technical specifications for implementing the Hybrid Optimization
plan. It includes code examples, API specifications, database schemas, and integration patterns.

**Document Version**: 1.0  
**Last Updated**: 2024-01-XX  
**Status**: ✅ **APPROVED** - Ready for Implementation

---

## **🏗️ ARCHITECTURE SPECIFICATIONS**

### **System Architecture**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │   Backend       │
│   (Next.js)     │◄──►│   (Next.js)     │◄──►│   (Services)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   State Mgmt    │    │   Cache Layer   │    │   Database      │
│   (Zustand)     │    │   (Redis)       │    │   (PostgreSQL)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Package Dependencies**

```json
{
  "dependencies": {
    "jose": "^5.6.0",
    "@upstash/redis": "^1.33.0",
    "zod": "^4.0.0-beta.20250424T163858",
    "drizzle-orm": "^0.33.0",
    "next": "^14.0.0",
    "react": "^18.0.0"
  }
}
```

---

## **🔐 AUTHENTICATION SPECIFICATIONS**

### **SecurityContext Interface**

```typescript
// packages/security/src/auth.ts
export type SecurityContext = {
  userId: string;
  email: string;
  tenantId: string;
  scopes: string[];
  requestId: string;
  traceId?: string;
};
```

### **JWT Verification**

```typescript
// packages/security/src/auth.ts
import { jwtVerify, createRemoteJWKSet } from "jose";

const JWKS_URL = process.env.SUPABASE_JWKS_URL!;
const ISSUER = process.env.SUPABASE_ISSUER!;
const AUDIENCE = process.env.SUPABASE_AUDIENCE!;

const JWKS = createRemoteJWKSet(new URL(JWKS_URL));

export async function verifyAccessToken(authorization?: string) {
  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("Missing token");
  }

  const token = authorization.slice(7);
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: ISSUER,
    audience: AUDIENCE,
  });

  return payload as Record<string, any>;
}

export function buildSecurityContext(
  payload: Record<string, any>,
  requestId: string,
): SecurityContext {
  return {
    userId: String(payload.sub),
    email: String(payload.email ?? ""),
    tenantId: String(payload["tenant_id"] ?? payload["tenantId"] ?? ""),
    scopes: Array.isArray(payload["scp"]) ? (payload["scp"] as string[]) : [],
    requestId,
  };
}
```

### **Request Context Extraction**

```typescript
// apps/web-api/app/api/_lib/request.ts
import { randomUUID } from "crypto";
import { NextRequest } from "next/server";
import { verifyAccessToken, buildSecurityContext } from "@aibos/security/auth";
import type { SecurityContext } from "@aibos/security/auth";

export async function getSecurityContext(req: NextRequest): Promise<SecurityContext> {
  const requestId = req.headers.get("x-request-id") ?? randomUUID();
  const authz = req.headers.get("authorization") ?? "";
  const claims = await verifyAccessToken(authz);
  return buildSecurityContext(claims, requestId);
}
```

---

## **🚦 RATE LIMITING SPECIFICATIONS**

### **Rate Limiting Implementation**

```typescript
// packages/security/src/rate-limit.ts
import { redis } from "@aibos/cache/redis";

export async function assertRateLimit(
  tenantId: string,
  route: string,
  limit = 300,
  windowSec = 60,
) {
  const now = Date.now();
  const key = `rl:${tenantId}:${route}`;
  const tx = redis.multi();

  tx.zremrangebyscore(key, 0, now - windowSec * 1000);
  tx.zadd(key, { score: now, member: String(now) });
  tx.zcard(key);
  tx.expire(key, windowSec);

  const [, , countRes] = await tx.exec();
  const count = Number(countRes);

  if (count > limit) {
    const err: any = new Error("Too Many Requests");
    err.status = 429;
    err.headers = { "Retry-After": "5" };
    throw err;
  }
}
```

### **Rate Limiting Configuration**

```typescript
// Rate limits per tenant + route
const RATE_LIMITS = {
  "/api/auth/login": { limit: 10, window: 60 }, // 10 requests per minute
  "/api/rules": { limit: 300, window: 60 }, // 300 requests per minute
  "/api/journals": { limit: 200, window: 60 }, // 200 requests per minute
  "/api/invoices": { limit: 150, window: 60 }, // 150 requests per minute
};
```

---

## **💾 CACHING SPECIFICATIONS**

### **Redis Client Configuration**

```typescript
// packages/cache/src/redis.ts
import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export function multi() {
  return redis.multi();
}
```

### **Cache Utilities**

```typescript
// packages/cache/src/cache.ts
import { redis } from "./redis";

export const cacheKey = (tenant: string, route: string, query?: Record<string, unknown>) =>
  `cache:${tenant}:${route}:${JSON.stringify(query ?? {})}`;

export async function cacheGet<T>(key: string): Promise<T | null> {
  const raw = await redis.get<string>(key);
  return raw ? (JSON.parse(raw) as T) : null;
}

export async function cacheSet(key: string, value: unknown, ttlSec = 60) {
  await redis.set(key, JSON.stringify(value), { ex: ttlSec });
}

export async function cacheInvalidate(pattern: string) {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
```

### **Cache TTL Configuration**

```typescript
// Cache TTL per endpoint type
const CACHE_TTL = {
  "GET /api/rules": 300, // 5 minutes
  "GET /api/journals": 180, // 3 minutes
  "GET /api/invoices": 600, // 10 minutes
  "GET /api/users": 900, // 15 minutes
};
```

---

## **🔄 IDEMPOTENCY SPECIFICATIONS**

### **Idempotency Implementation**

```typescript
// packages/cache/src/idempotency.ts
import { redis } from "./redis";

export async function withIdempotency<T>(
  key: string,
  tenantId: string,
  route: string,
  compute: () => Promise<T>,
  ttlSec = 3600,
): Promise<T> {
  const slot = `idem:${tenantId}:${route}:${key}`;
  const hit = await redis.get<string>(slot);

  if (hit) {
    return JSON.parse(hit) as T;
  }

  const result = await compute();
  await redis.set(slot, JSON.stringify(result), { ex: ttlSec });
  return result;
}
```

### **Idempotency Key Validation**

```typescript
// Idempotency key requirements
const IDEMPOTENCY_KEY_REGEX = /^[a-zA-Z0-9-_]{1,255}$/;

export function validateIdempotencyKey(key: string): boolean {
  return IDEMPOTENCY_KEY_REGEX.test(key);
}
```

---

## **🏥 HEALTH MONITORING SPECIFICATIONS**

### **Health Check Endpoint**

```typescript
// apps/web-api/app/api/health/route.ts
import { NextResponse } from "next/server";
import { redis } from "@aibos/cache/redis";
import { sql } from "@aibos/db";

export async function GET() {
  const start = Date.now();
  const checks: Record<string, string> = {};

  // Database check
  try {
    await sql`SELECT 1`;
    checks.database = "ok";
  } catch (error) {
    checks.database = "fail";
  }

  // Redis check
  try {
    await redis.ping();
    checks.redis = "ok";
  } catch (error) {
    checks.redis = "fail";
  }

  // Application check
  checks.application = "ok";

  const latency = Date.now() - start;
  const allOk = Object.values(checks).every(v => v === "ok");
  const status = allOk ? 200 : 503;

  return NextResponse.json(
    {
      status: allOk ? "ok" : "degraded",
      checks,
      latency,
      version: process.env.APP_VERSION ?? "unknown",
      timestamp: new Date().toISOString(),
    },
    { status },
  );
}
```

### **Health Check Response Schema**

```typescript
interface HealthResponse {
  status: "ok" | "degraded" | "fail";
  checks: {
    database: "ok" | "fail";
    redis: "ok" | "fail";
    application: "ok" | "fail";
  };
  latency: number;
  version: string;
  timestamp: string;
}
```

---

## **📊 API GATEWAY SPECIFICATIONS**

### **API Gateway Implementation**

```typescript
// packages/api-gateway/src/gateway.ts
import type { ApiResponse } from "@aibos/contracts/types/api";
import { isSuccess } from "@aibos/contracts/types/api";
import type { SecurityContext } from "@aibos/security/auth";
import { assertRateLimit } from "@aibos/security/rate-limit";
import { cacheGet, cacheKey, cacheSet } from "@aibos/cache/cache";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface RequestOptions {
  token?: string;
  requiredPermissions?: string[];
  query?: Record<string, string | number | boolean | undefined>;
  idempotencyKey?: string;
  signal?: AbortSignal;
}

export class ApiGateway {
  constructor(
    private readonly auth: AuthMiddleware,
    private readonly rateLimiter: { checkLimit: (id: string) => Promise<void> },
    private readonly cache: {
      get<T>(k: string): Promise<T | null>;
      set(k: string, v: any, ttl?: number): Promise<void>;
    },
  ) {}

  async handleRequest<T>(
    route: string,
    method: HttpMethod,
    body?: unknown,
    opts: RequestOptions = {},
  ): Promise<ApiResponse<T>> {
    // 1. Rate limiting
    await assertRateLimit(opts.tenantId!, route);

    // 2. GET caching
    if (method === "GET") {
      const key = cacheKey(opts.tenantId!, route, opts.query);
      const cached = await cacheGet<ApiResponse<T>>(key);
      if (cached) return cached;
    }

    // 3. Idempotency for mutations
    if (method !== "GET" && !opts.idempotencyKey) {
      return this.createErrorResponse("IDEMPOTENCY_REQUIRED", 400, opts.requestId!);
    }

    // 4. Execute request
    const result = await this.dispatch<T>(route, method, body, opts);

    // 5. Cache successful GETs
    if (method === "GET" && isSuccess(result)) {
      const key = cacheKey(opts.tenantId!, route, opts.query);
      await cacheSet(key, result, 60);
    }

    return result;
  }
}
```

---

## **📝 ERROR HANDLING SPECIFICATIONS**

### **RFC 7807 Problem Details**

```typescript
// packages/contracts/src/types/api.ts
export interface Problem {
  type: string; // URI reference identifying the problem type
  title: string; // short, human-readable summary
  status: number; // HTTP status code
  detail?: string; // human-readable explanation
  instance?: string; // request path
  code?: string; // app/domain-specific error code
  errors?: Record<string, string[]>; // field-level validation errors
}

export interface EnvelopeBase {
  timestamp: string; // ISO 8601
  requestId: string; // correlation id
  traceId?: string; // optional OpenTelemetry trace id
}

export interface ApiSuccess<T> extends EnvelopeBase {
  success: true;
  data: T;
  meta?: Meta;
}

export interface ApiFailure extends EnvelopeBase {
  success: false;
  error: Problem;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;
```

### **Error Response Helpers**

```typescript
// apps/web-api/app/api/_lib/response.ts
export function ok<T>(data: T, requestId: string, status = 200) {
  return Response.json(
    {
      success: true,
      data,
      timestamp: new Date().toISOString(),
      requestId,
    },
    { status },
  );
}

export function problem({
  status,
  title,
  code,
  detail,
  requestId,
}: {
  status: number;
  title: string;
  code?: string;
  detail?: string;
  requestId: string;
}) {
  return Response.json(
    {
      success: false,
      timestamp: new Date().toISOString(),
      requestId,
      error: {
        type: "about:blank",
        title,
        status,
        code,
        detail,
      },
    },
    { status },
  );
}
```

---

## **🗄️ DATABASE SPECIFICATIONS**

### **RLS Policy Example**

```sql
-- packages/db/rls.sql
-- Enable RLS on all tables
ALTER TABLE journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policies
CREATE POLICY tenant_isolation_journals ON journals
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id'));

CREATE POLICY tenant_isolation_invoices ON invoices
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id'));

CREATE POLICY tenant_isolation_users ON users
  FOR ALL TO authenticated
  USING (company_id = current_setting('app.current_tenant_id'));
```

### **Database Indexes**

```sql
-- Performance indexes
CREATE INDEX idx_journals_tenant_id ON journals(tenant_id);
CREATE INDEX idx_journals_created_at ON journals(created_at);
CREATE INDEX idx_invoices_tenant_id ON invoices(tenant_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_users_company_id ON users(company_id);
```

---

## **🧪 TESTING SPECIFICATIONS**

### **Unit Test Example**

```typescript
// packages/security/src/__tests__/auth.test.ts
import { describe, it, expect, vi } from "vitest";
import { verifyAccessToken, buildSecurityContext } from "../auth";

describe("Authentication", () => {
  it("should verify valid JWT token", async () => {
    const mockPayload = {
      sub: "user123",
      email: "test@example.com",
      tenant_id: "tenant123",
      scp: ["read", "write"],
    };

    vi.mocked(jwtVerify).mockResolvedValue({ payload: mockPayload });

    const result = await verifyAccessToken("Bearer valid-token");
    expect(result).toEqual(mockPayload);
  });

  it("should build security context correctly", () => {
    const payload = {
      sub: "user123",
      email: "test@example.com",
      tenant_id: "tenant123",
      scp: ["read", "write"],
    };

    const context = buildSecurityContext(payload, "req123");
    expect(context).toEqual({
      userId: "user123",
      email: "test@example.com",
      tenantId: "tenant123",
      scopes: ["read", "write"],
      requestId: "req123",
    });
  });
});
```

### **Integration Test Example**

```typescript
// apps/web-api/app/api/__tests__/rules.test.ts
import { describe, it, expect } from "vitest";
import { GET, POST } from "../rules/route";

describe("Rules API", () => {
  it("should return rules for authenticated user", async () => {
    const request = new Request("http://localhost/api/rules", {
      headers: {
        Authorization: "Bearer valid-token",
        "X-Request-ID": "test-123",
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
  });
});
```

---

## **📊 MONITORING SPECIFICATIONS**

### **Metrics Collection**

```typescript
// packages/monitoring/src/metrics.ts
export class MetricsCollector {
  recordAPICall(
    endpoint: string,
    method: string,
    statusCode: number,
    duration: number,
    tenantId: string,
  ) {
    // Record to Axiom
    this.axiomClient.ingest("api-metrics", {
      endpoint,
      method,
      statusCode,
      duration,
      tenantId,
      timestamp: new Date().toISOString(),
    });
  }

  recordCacheHit(key: string, tenantId: string) {
    this.axiomClient.ingest("cache-metrics", {
      key,
      tenantId,
      hit: true,
      timestamp: new Date().toISOString(),
    });
  }
}
```

### **Performance Monitoring**

```typescript
// packages/monitoring/src/performance.ts
export class PerformanceMonitor {
  async measureAPICall<T>(
    operation: () => Promise<T>,
    endpoint: string,
    tenantId: string,
  ): Promise<T> {
    const start = Date.now();

    try {
      const result = await operation();
      const duration = Date.now() - start;

      this.metrics.recordAPICall(endpoint, "GET", 200, duration, tenantId);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.metrics.recordAPICall(endpoint, "GET", 500, duration, tenantId);
      throw error;
    }
  }
}
```

---

## **🔧 CONFIGURATION SPECIFICATIONS**

### **Environment Variables**

```bash
# .env.example
# Supabase JWT verification
SUPABASE_JWKS_URL=https://YOUR-PROJECT.supabase.co/auth/v1/jwks
SUPABASE_ISSUER=https://YOUR-PROJECT.supabase.co/
SUPABASE_AUDIENCE=authenticated

# Upstash Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Application
APP_VERSION=0.1.0
NODE_ENV=production
```

### **Package.json Scripts**

```json
{
  "scripts": {
    "build": "turbo build",
    "test": "turbo test",
    "lint": "turbo lint",
    "type-check": "turbo type-check",
    "smoke:health": "node -e \"(async()=>{const f=await fetch(process.env.BASE_URL+'/api/health'); if(!f.ok) process.exit(1); const j=await f.json(); if(j.status!=='ok') process.exit(2)})().catch(()=>process.exit(3))\""
  }
}
```

---

## **🚀 DEPLOYMENT SPECIFICATIONS**

### **CI/CD Pipeline**

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "18"
      - run: pnpm install
      - run: pnpm test
      - run: pnpm lint
      - run: pnpm type-check

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm build
      - run: pnpm smoke:health
```

### **Docker Configuration**

```dockerfile
# Dockerfile
FROM node:18-alpine AS base
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY . .
RUN pnpm build

FROM base AS runtime
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

---

## **📚 API DOCUMENTATION**

### **API Endpoints**

```
GET    /api/health              # Health check
POST   /api/auth/login          # User authentication
GET    /api/rules               # List rules
POST   /api/rules               # Create rule
PUT    /api/rules/:id           # Update rule
DELETE /api/rules/:id           # Delete rule
GET    /api/journals            # List journals
POST   /api/journals            # Create journal
GET    /api/invoices            # List invoices
POST   /api/invoices            # Create invoice
```

### **Request Headers**

```
Authorization: Bearer <jwt-token>
X-Request-ID: <correlation-id>
X-Tenant-ID: <tenant-id>
Idempotency-Key: <idempotency-key>  # Required for mutations
Content-Type: application/json
```

### **Response Format**

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "requestId": "req-123",
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
```

---

**Document Status**: ✅ **APPROVED** - Ready for Implementation  
**Next Review**: After Phase 1 completion  
**Owner**: Development Team  
**Stakeholders**: Product, Engineering, Security, Operations
