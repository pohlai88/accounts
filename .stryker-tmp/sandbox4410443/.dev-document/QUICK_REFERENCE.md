# ⚡ **QUICK REFERENCE - HYBRID OPTIMIZATION**

## **🚀 GETTING STARTED**

### **Phase 1: Connect the Dots (Week 1-2)**

**Priority**: 🔴 **CRITICAL**  
**Goal**: Fix existing broken connections

#### **Week 1.1: Fix API Authentication**

```bash
# Files to modify:
apps/web-api/app/api/auth/login/route.ts
packages/auth/src/verification.ts (NEW)

# Key changes:
- Replace MOCK_USERS with real Supabase auth
- Use existing AuthUser and JWTClaims types
- Add proper JWT validation with JWKS
```

#### **Week 1.2: Connect Data Flow**

```bash
# Files to modify:
packages/utils/src/state-management.ts
apps/web/app/page.tsx

# Key changes:
- Replace mock hooks with real API calls
- Connect frontend to backend
- Add error handling
```

#### **Week 2.1: Add Health Monitoring**

```bash
# Files to create:
apps/web-api/app/api/health/route.ts
.github/workflows/smoke.yml

# Key features:
- Database connectivity check
- Redis connectivity check
- Version information
- CI integration
```

---

## **🔧 QUICK COMMANDS**

### **Development Setup**

```bash
# Install dependencies
pnpm install

# Start development
pnpm dev

# Run tests
pnpm test

# Run linting
pnpm lint

# Type check
pnpm type-check

# Build all packages
pnpm build
```

### **Package Management**

```bash
# Add new package
pnpm add <package-name> --filter <package-name>

# Add workspace dependency
pnpm add @aibos/contracts --filter @aibos/auth

# Run command in specific package
pnpm --filter @aibos/auth dev
```

---

## **📁 FILE STRUCTURE**

### **New Packages to Create**

```
packages/
├── security/           # Authentication & rate limiting
│   ├── src/
│   │   ├── auth.ts     # JWT verification
│   │   ├── rate-limit.ts
│   │   └── index.ts
│   └── package.json
├── cache/              # Redis & caching
│   ├── src/
│   │   ├── redis.ts    # Redis client
│   │   ├── cache.ts    # Cache utilities
│   │   ├── idempotency.ts
│   │   └── index.ts
│   └── package.json
├── api-gateway/        # Centralized API handling
│   ├── src/
│   │   ├── gateway.ts
│   │   ├── middleware.ts
│   │   └── index.ts
│   └── package.json
└── monitoring/         # Health & metrics
    ├── src/
    │   ├── health.ts
    │   ├── metrics.ts
    │   └── index.ts
    └── package.json
```

### **Files to Modify**

```
apps/web-api/app/api/
├── auth/login/route.ts          # Replace mock auth
├── _lib/
│   ├── request.ts               # Security context extraction
│   └── response.ts              # Error response helpers
└── health/route.ts              # Health check endpoint

packages/
├── auth/src/verification.ts     # JWT verification (NEW)
├── utils/src/state-management.ts # Connect real data flow
└── db/rls.sql                   # RLS policies
```

---

## **🔐 AUTHENTICATION QUICK START**

### **1. Create Security Package**

```bash
mkdir packages/security
cd packages/security
pnpm init
```

### **2. Install Dependencies**

```bash
pnpm add jose
pnpm add -D @types/node
```

### **3. Create Auth Module**

```typescript
// packages/security/src/auth.ts
import { jwtVerify, createRemoteJWKSet } from "jose";

export type SecurityContext = {
  userId: string;
  email: string;
  tenantId: string;
  scopes: string[];
  requestId: string;
};

const JWKS = createRemoteJWKSet(new URL(process.env.SUPABASE_JWKS_URL!));

export async function verifyAccessToken(authorization?: string) {
  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("Missing token");
  }

  const token = authorization.slice(7);
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: process.env.SUPABASE_ISSUER,
    audience: process.env.SUPABASE_AUDIENCE,
  });

  return payload as Record<string, any>;
}
```

### **4. Update Login Route**

```typescript
// apps/web-api/app/api/auth/login/route.ts
import { verifyAccessToken, buildSecurityContext } from "@aibos/security/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    // Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Build security context
    const context = buildSecurityContext(data.user, randomUUID());

    return NextResponse.json({
      success: true,
      data: { user: context },
      timestamp: new Date().toISOString(),
      requestId: context.requestId,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: { message: error.message },
        timestamp: new Date().toISOString(),
      },
      { status: 401 },
    );
  }
}
```

---

## **💾 CACHING QUICK START**

### **1. Create Cache Package**

```bash
mkdir packages/cache
cd packages/cache
pnpm init
```

### **2. Install Dependencies**

```bash
pnpm add @upstash/redis
```

### **3. Create Redis Client**

```typescript
// packages/cache/src/redis.ts
import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});
```

### **4. Add Caching to API Route**

```typescript
// apps/web-api/app/api/rules/route.ts
import { cacheGet, cacheKey, cacheSet } from "@aibos/cache/cache";

export async function GET(req: NextRequest) {
  const ctx = await getSecurityContext(req);
  const query = Object.fromEntries(req.nextUrl.searchParams);

  // Check cache
  const key = cacheKey(ctx.tenantId, "/api/rules", query);
  const cached = await cacheGet(key);
  if (cached) return NextResponse.json(cached);

  // Fetch data
  const data = await listRules(ctx, query);

  // Cache result
  await cacheSet(key, data, 300); // 5 minutes

  return NextResponse.json(data);
}
```

---

## **🏥 HEALTH CHECK QUICK START**

### **1. Create Health Endpoint**

```typescript
// apps/web-api/app/api/health/route.ts
import { NextResponse } from "next/server";
import { redis } from "@aibos/cache/redis";

export async function GET() {
  const checks = {
    database: "ok", // Add real DB check
    redis: await redis
      .ping()
      .then(() => "ok")
      .catch(() => "fail"),
    application: "ok",
  };

  const allOk = Object.values(checks).every(v => v === "ok");

  return NextResponse.json(
    {
      status: allOk ? "ok" : "degraded",
      checks,
      version: process.env.APP_VERSION ?? "unknown",
      timestamp: new Date().toISOString(),
    },
    { status: allOk ? 200 : 503 },
  );
}
```

### **2. Add CI Smoke Test**

```yaml
# .github/workflows/smoke.yml
name: smoke
on: [push, workflow_dispatch]
jobs:
  health:
    runs-on: ubuntu-latest
    steps:
      - name: Check health
        run: |
          curl -sSf ${{ secrets.BASE_URL }}/api/health | tee health.json
          node -e "const h=require('fs').readFileSync('health.json','utf8'); const j=JSON.parse(h); if(j.status!=='ok'){process.exit(2)}"
```

---

## **🚦 RATE LIMITING QUICK START**

### **1. Create Rate Limiting**

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

### **2. Add to API Routes**

```typescript
// apps/web-api/app/api/rules/route.ts
import { assertRateLimit } from "@aibos/security/rate-limit";

export async function GET(req: NextRequest) {
  const ctx = await getSecurityContext(req);

  // Rate limiting
  await assertRateLimit(ctx.tenantId, "/api/rules");

  // ... rest of handler
}
```

---

## **🔄 IDEMPOTENCY QUICK START**

### **1. Create Idempotency System**

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

  if (hit) return JSON.parse(hit) as T;

  const result = await compute();
  await redis.set(slot, JSON.stringify(result), { ex: ttlSec });
  return result;
}
```

### **2. Add to Mutation Routes**

```typescript
// apps/web-api/app/api/rules/route.ts
import { withIdempotency } from "@aibos/cache/idempotency";

export async function POST(req: NextRequest) {
  const ctx = await getSecurityContext(req);
  const idemKey = req.headers.get("idempotency-key");

  if (!idemKey) {
    return NextResponse.json(
      {
        success: false,
        error: { message: "Idempotency-Key required" },
      },
      { status: 400 },
    );
  }

  const body = await req.json();
  const data = await withIdempotency(idemKey, ctx.tenantId, "/api/rules", async () => {
    return createRule(ctx, body);
  });

  return NextResponse.json(data);
}
```

---

## **📊 MONITORING QUICK START**

### **1. Add Metrics Collection**

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
    // Send to Axiom
    console.log("API Call:", { endpoint, method, statusCode, duration, tenantId });
  }
}
```

### **2. Add Performance Monitoring**

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

## **🔧 ENVIRONMENT SETUP**

### **Required Environment Variables**

```bash
# .env.local
SUPABASE_JWKS_URL=https://YOUR-PROJECT.supabase.co/auth/v1/jwks
SUPABASE_ISSUER=https://YOUR-PROJECT.supabase.co/
SUPABASE_AUDIENCE=authenticated
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
APP_VERSION=0.1.0
```

### **Package.json Updates**

```json
{
  "dependencies": {
    "jose": "^5.6.0",
    "@upstash/redis": "^1.33.0"
  },
  "scripts": {
    "smoke:health": "node -e \"(async()=>{const f=await fetch(process.env.BASE_URL+'/api/health'); if(!f.ok) process.exit(1); const j=await f.json(); if(j.status!=='ok') process.exit(2)})().catch(()=>process.exit(3))\""
  }
}
```

---

## **🚨 TROUBLESHOOTING**

### **Common Issues**

#### **Authentication Errors**

```bash
# Check JWT configuration
echo $SUPABASE_JWKS_URL
echo $SUPABASE_ISSUER
echo $SUPABASE_AUDIENCE

# Test JWT verification
node -e "console.log('JWT config OK')"
```

#### **Redis Connection Issues**

```bash
# Test Redis connection
node -e "const { Redis } = require('@upstash/redis'); const r = new Redis({url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN}); r.ping().then(console.log).catch(console.error)"
```

#### **Cache Issues**

```bash
# Check cache keys
redis-cli --scan --pattern "cache:*"

# Clear cache
redis-cli --scan --pattern "cache:*" | xargs redis-cli del
```

#### **Rate Limiting Issues**

```bash
# Check rate limit keys
redis-cli --scan --pattern "rl:*"

# Clear rate limits
redis-cli --scan --pattern "rl:*" | xargs redis-cli del
```

---

## **📞 SUPPORT**

### **Documentation**

- [Main Plan](./HYBRID_OPTIMIZATION_PLAN.md)
- [Implementation Tracker](./IMPLEMENTATION_TRACKER.md)
- [Technical Specifications](./TECHNICAL_SPECIFICATIONS.md)

### **Key Contacts**

- **Development Team**: TBD
- **Product Owner**: TBD
- **Security Lead**: TBD
- **Operations Lead**: TBD

---

**Last Updated**: 2024-01-XX  
**Status**: ✅ **READY FOR IMPLEMENTATION**
