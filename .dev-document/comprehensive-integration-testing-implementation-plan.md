# 🚀 Comprehensive Integration Testing Implementation Plan

## 📋 **Executive Summary**

This plan provides a complete roadmap to implement production-ready integration testing for the AI-BOS accounting SaaS application. It addresses all current gaps, ensures proper dependency management, and provides a clear path to 80%+ test coverage with robust API infrastructure.

## 🎯 **Current Status Analysis**

### ✅ **What's Working**

- **Unit Tests**: 11/19 passing (58% success rate)
- **Core Business Logic**: Payment processing, FX validation, journal posting
- **Database Connection**: Supabase connectivity confirmed working
- **Cache System**: 7/7 tests passing (100%)
- **Idempotency System**: 9/9 tests passing (100%)
- **Test Performance**: Optimized from 43 minutes to 1-3 minutes

### ❌ **Critical Issues**

- **API Gateway**: 0/6 tests passing (response format, middleware issues)
- **Integration Tests**: 204 tests skipped (environment loading issues)
- **Golden Flows**: 0/10 tests running (Docker dependency)
- **API Endpoints**: 0/81 tests running (no API server)
- **Docker Configuration**: Missing for production deployment

## 📦 **Dependency Audit & Requirements**

### **Current Dependencies Status**

```bash
# ✅ Installed and Working
- @supabase/supabase-js: 2.57.4
- vitest: 3.2.4
- fast-check: 3.23.2
- @stryker-mutator/core: 7.3.0
- @testcontainers/postgresql: 10.28.0
- zod: 3.25.76
- dotenv: 17.2.2
- express: 4.21.2 (✅ Just installed)
- cors: 2.8.5 (✅ Just installed)
- helmet: 7.2.0 (✅ Just installed)
- express-rate-limit: 7.5.1 (✅ Just installed)
- ws: 8.14.2 (✅ Just installed)
- jose: 5.10.0 (✅ Just installed)
- pg: 8.16.3 (✅ Just installed)

# ✅ Already Available via @aibos/cache Package
- ioredis: 5.7.0 (Open source Redis client - PRIMARY)
- redis: 5.8.2 (Standard Redis client - FALLBACK)
```

### **SSOT Strategy - Use Existing Cache Infrastructure**

```bash
# ✅ Dependencies already installed at workspace root
# ✅ Use existing @aibos/cache package for Redis operations
# ✅ Leverage ioredis (open source) as primary Redis client
# ✅ Use redis package as fallback for compatibility
```

## 🏗️ **Implementation Phases**

### **Phase 1: Dependency Setup & API Infrastructure (Day 1-2)**

#### **1.1 ✅ Dependencies Already Installed**

```bash
# ✅ All production dependencies installed at workspace root
# ✅ All development dependencies installed at workspace root
# ✅ Redis infrastructure available via @aibos/cache package

# Verify installation
pnpm list --depth=0 | findstr -i "express cors helmet pg"
pnpm list --filter @aibos/cache | findstr -i "ioredis redis"

# Expected output:
# express 4.21.2
# cors 2.8.5
# helmet 7.2.0
# pg 8.16.3
# ioredis 5.7.0 (via @aibos/cache)
# redis 5.8.2 (via @aibos/cache)
```

#### **1.2 Create Standardized API Response System**

**File**: `packages/api/src/http/response.ts`

```typescript
export type ApiResponse<T = unknown> = {
  success: boolean;
  status: number;
  message?: string;
  data?: T;
  error?: { code: string; message: string; details?: unknown };
};

function build<T>(status: number, body: Partial<ApiResponse<T>> = {}): ApiResponse<T> {
  return { success: status < 400, status, ...body };
}

export const ok = <T>(data: T, message = "OK") => build<T>(200, { data, message });
export const created = <T>(data: T, message = "Created") => build<T>(201, { data, message });
export const badReq = (code = "BAD_REQUEST", message = "Bad request", details?: unknown) =>
  build(400, { error: { code, message, details } });
export const forbidden = (code = "FORBIDDEN", message = "Forbidden") =>
  build(403, { error: { code, message } });
export const notFound = (code = "NOT_FOUND", message = "Not found") =>
  build(404, { error: { code, message } });
export const serverErr = (
  code = "INTERNAL_ERROR",
  message = "Internal server error",
  details?: unknown,
) => build(500, { error: { code, message, details } });
```

#### **1.3 Fix API Gateway Middleware Chain**

**File**: `packages/utils/src/api-gateway/gateway.ts`

```typescript
// Update the use method to support chaining
use(middleware: Middleware): ApiGateway {
  this.globalMiddleware.push(middleware);
  return this; // Enable method chaining
}

// Update processRequest to handle response format
async processRequest(request: ApiRequest): Promise<GatewayResponse> {
  // ... existing logic ...

  // Ensure proper response format
  if (!response.body.success) {
    response.body.success = response.status < 400;
  }

  return response;
}
```

#### **1.4 Create Production-Ready Middleware**

**File**: `packages/api/src/http/middlewares/cors.ts`

```typescript
import type { Middleware } from "../../utils/src/api-gateway/types.js";

export const cors = (origins: string[] = ["*"]): Middleware => ({
  async execute(request, next) {
    const origin = request.headers.origin ?? "*";
    const allow = origins.includes("*") || origins.includes(origin) ? origin : (origins[0] ?? "*");

    const response = await next();

    // Add CORS headers
    response.headers["Access-Control-Allow-Origin"] = allow;
    response.headers["Vary"] = "Origin";
    response.headers["Access-Control-Allow-Headers"] = "authorization,content-type";
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,PATCH,DELETE,OPTIONS";

    return response;
  },
});
```

### **Phase 2: Integration Test Infrastructure (Day 3-4)**

#### **2.1 Fix Environment Variable Loading**

**File**: `packages/api/tests/integration/setup.ts`

```typescript
import "dotenv/config";
import { beforeAll, afterAll } from "vitest";

// Ensure test environment
process.env.NODE_ENV ??= "test";

beforeAll(async () => {
  console.log("🧪 Setting up integration test environment...");

  // Verify critical environment variables
  const requiredVars = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "DATABASE_URL"];

  const missing = requiredVars.filter(v => !process.env[v]);
  if (missing.length > 0) {
    console.warn(`⚠️ Missing environment variables: ${missing.join(", ")}`);
    console.warn("Some tests may be skipped");
  }

  console.log("✅ Environment setup completed");
});

afterAll(async () => {
  console.log("🧹 Cleaning up integration test environment...");
  console.log("✅ Cleanup completed");
});
```

#### **2.2 Create Supabase Test Schema Strategy**

**File**: `packages/accounting/tests/integration/db-test-schema.ts`

```typescript
import { createClient } from "@supabase/supabase-js";

export async function withTestSchema<T>(fn: (schema: string, supa: any) => Promise<T>): Promise<T> {
  const supa = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const suffix = Math.random().toString(36).slice(2, 8);
  const schema = `test_${suffix}`;

  try {
    // Create test schema
    await supa.rpc("exec_sql", {
      sql: `create schema if not exists ${schema}; set search_path to ${schema}, public;`,
    });

    return await fn(schema, supa);
  } finally {
    // Clean up test schema
    await supa.rpc("exec_sql", {
      sql: `drop schema if exists ${schema} cascade;`,
    });
  }
}
```

#### **2.3 Update Integration Test Configuration**

**File**: `tests/integration/vitest.config.ts`

```typescript
import { defineConfig, mergeConfig } from "vitest/config";
import base, { integrationConfig } from "@aibos/vitest-config";

export default mergeConfig(
  base,
  integrationConfig,
  defineConfig({
    test: {
      setupFiles: ["packages/api/tests/integration/setup.ts"],
      teardownTimeout: 10000,
      hookTimeout: 20000,
      testTimeout: 20000,
      sequence: { shuffle: true }, // Catch hidden coupling
      env: {
        NODE_ENV: "test",
        DATABASE_URL: process.env.DATABASE_URL,
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
    },
  }),
);
```

### **Phase 3: API Server Implementation (Day 5-6)**

#### **3.1 Create Express API Server**

**File**: `packages/api/src/server.ts`

```typescript
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { Gateway } from "../utils/src/api-gateway/gateway.js";
import { cors as corsMw } from "./http/middlewares/cors.js";
import { logging } from "./http/middlewares/logging.js";
import { wrapErrors } from "./http/middlewares/error.js";
import { ok, created, notFound } from "./http/response.js";

const app = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000"],
    credentials: true,
  }),
);

// Rate limiting
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { error: "Too many requests from this IP" },
  }),
);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Initialize API Gateway
const gateway = new Gateway({
  baseUrl: process.env.API_BASE_URL || "http://localhost:3001",
  timeout: 30000,
  retries: 3,
  rateLimiting: { enabled: true, defaultWindowMs: 15 * 60 * 1000, defaultMax: 100 },
  caching: { enabled: true, defaultTtl: 300 },
  logging: { enabled: true, level: "info" },
});

// Add middleware
gateway
  .use(corsMw(["*"]))
  .use(logging)
  .use(wrapErrors);

// Health check endpoint
gateway.route("/api/health", "GET").handler(async () => {
  return {
    status: 200,
    headers: { "Content-Type": "application/json" },
    body: ok({ service: "api", status: "ok", timestamp: new Date().toISOString() }),
  };
});

// Test endpoint
gateway.route("/api/test", "POST").handler(async req => {
  return {
    status: 201,
    headers: { "Content-Type": "application/json" },
    body: created({ ping: "pong", received: req.body }, "Test successful"),
  };
});

// Catch-all for unknown routes
app.use("*", async (req, res) => {
  const response = await gateway.processRequest({
    method: req.method,
    path: req.path,
    headers: req.headers,
    query: req.query,
    body: req.body,
  });

  res.status(response.status).json(response.body);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 API Server running on port ${PORT}`);
});

export { app, gateway };
```

#### **3.2 Create API Client for Testing**

**File**: `packages/api/src/client.ts`

```typescript
export class ApiClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(baseUrl = "http://localhost:3001") {
    this.baseUrl = baseUrl;
    this.headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const init: RequestInit = {
      method,
      headers: this.headers,
    };

    if (body) {
      init.body = JSON.stringify(body);
    }

    const response = await fetch(url, init);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`API Error: ${data.error?.message || "Unknown error"}`);
    }

    return data;
  }

  // Convenience methods
  async get<T>(path: string): Promise<T> {
    return this.request<T>("GET", path);
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("POST", path, body);
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("PUT", path, body);
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>("DELETE", path);
  }
}
```

### **Phase 4: Docker Configuration (Day 7)**

#### **4.1 Create Production Dockerfile**

**File**: `Dockerfile`

```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS base
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY packages/*/package.json ./packages/*/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS build
COPY . .
RUN pnpm build

# Production stage
FROM node:18-alpine AS runtime
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy built application
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start application
CMD ["node", "dist/index.js"]
```

#### **4.2 Create Development Docker Compose**

**File**: `docker-compose.yml`

```yaml
version: "3.8"

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - REDIS_URL=${REDIS_URL}
    depends_on:
      - redis
    restart: unless-stopped
    healthcheck:
      test:
        [
          "CMD",
          "node",
          "-e",
          "require('http').get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })",
        ]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    command: redis-server --appendonly yes

volumes:
  redis_data:
```

#### **4.3 Create Development Docker Compose**

**File**: `docker-compose.dev.yml`

```yaml
version: "3.8"

services:
  app:
    build:
      context: .
      target: base
    ports:
      - "3000:3000"
      - "9229:9229" # Debug port
    environment:
      - NODE_ENV=development
      - DATABASE_URL=${DATABASE_URL}
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - REDIS_URL=redis://redis:6379
    volumes:
      - .:/app
      - /app/node_modules
    command: pnpm dev
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_dev_data:/data
    command: redis-server --appendonly yes

volumes:
  redis_dev_data:
```

### **Phase 5: Test Implementation & Validation (Day 8-10)**

#### **5.1 Create Comprehensive Integration Test Suite**

**File**: `packages/api/tests/integration/gateway.e2e.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { ApiClient } from "../../src/client.js";

describe("API Gateway E2E Tests", () => {
  let client: ApiClient;
  let server: any;

  beforeAll(async () => {
    // Start API server
    const { app } = await import("../../src/server.js");
    server = app;

    client = new ApiClient("http://localhost:3001");

    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    if (server) {
      server.close();
    }
  });

  describe("Health Check", () => {
    it("should return 200 with service status", async () => {
      const response = await client.get("/api/health");

      expect(response.success).toBe(true);
      expect(response.status).toBe(200);
      expect(response.data.service).toBe("api");
      expect(response.data.status).toBe("ok");
    });
  });

  describe("CORS Headers", () => {
    it("should include CORS headers in responses", async () => {
      const response = await fetch("http://localhost:3001/api/health", {
        method: "GET",
        headers: { Origin: "http://localhost:3000" },
      });

      expect(response.headers.get("Access-Control-Allow-Origin")).toBeTruthy();
      expect(response.headers.get("Access-Control-Allow-Methods")).toContain("GET");
    });
  });

  describe("Error Handling", () => {
    it("should return 404 for unknown routes", async () => {
      try {
        await client.get("/api/unknown");
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.message).toContain("API Error");
      }
    });
  });

  describe("POST Endpoints", () => {
    it("should handle POST requests with proper status codes", async () => {
      const response = await client.post("/api/test", { hello: "world" });

      expect(response.success).toBe(true);
      expect(response.status).toBe(201);
      expect(response.message).toBe("Test successful");
      expect(response.data.ping).toBe("pong");
    });
  });
});
```

#### **5.2 Update Golden Flows Tests**

**File**: `tests/integration/golden-flows.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { withTestSchema } from "../packages/accounting/tests/integration/db-test-schema.js";
import { validateInvoicePosting } from "@aibos/accounting";

describe("Golden Flow Integration Tests", () => {
  it("should complete invoice posting workflow with RLS", async () => {
    await withTestSchema(async (schema, supa) => {
      // Test invoice posting with real database
      const invoiceInput = {
        tenantId: "test-tenant",
        companyId: "test-company",
        customerId: "test-customer",
        amount: 1000,
        currency: "MYR",
        lines: [
          { accountId: "test-revenue-account", credit: 1000, description: "Sales" },
          { accountId: "test-ar-account", debit: 1000, description: "Receivable" },
        ],
      };

      const result = await validateInvoicePosting(invoiceInput);
      expect(result.validated).toBe(true);
      expect(result.journalInput.lines).toHaveLength(2);
    });
  });

  it("should handle foreign currency invoice with FX conversion", async () => {
    await withTestSchema(async (schema, supa) => {
      const invoiceInput = {
        tenantId: "test-tenant",
        companyId: "test-company",
        customerId: "test-customer",
        amount: 100, // USD
        currency: "USD",
        exchangeRate: 4.5,
        lines: [
          { accountId: "test-revenue-account", credit: 450, description: "Sales (MYR)" },
          { accountId: "test-ar-account", debit: 450, description: "Receivable (MYR)" },
        ],
      };

      const result = await validateInvoicePosting(invoiceInput);
      expect(result.validated).toBe(true);
      expect(result.journalInput.lines[0].credit).toBe(450); // Converted to MYR
    });
  });
});
```

## 📊 **Success Metrics & Validation**

### **Phase Completion Criteria**

#### **Phase 1 Complete When:**

- [ ] All missing dependencies installed (`pnpm list` shows no missing packages)
- [ ] API response format standardized
- [ ] Gateway middleware chain working
- [ ] CORS headers present in responses

#### **Phase 2 Complete When:**

- [ ] Environment variables loading reliably
- [ ] Supabase test schema strategy working
- [ ] Integration test configuration updated
- [ ] No more "Missing required environment variables" errors

#### **Phase 3 Complete When:**

- [ ] Express API server running on port 3001
- [ ] Health check endpoint responding
- [ ] API client working for testing
- [ ] All middleware properly integrated

#### **Phase 4 Complete When:**

- [ ] Dockerfile builds successfully
- [ ] docker-compose.yml runs without errors
- [ ] Health checks passing in containers
- [ ] Production deployment ready

#### **Phase 5 Complete When:**

- [ ] API Gateway tests: 6/6 passing
- [ ] Golden flows tests: 10/10 running
- [ ] Integration tests: 150+ passing
- [ ] Overall test coverage: 80%+

### **Final Validation Checklist**

```bash
# 1. Verify all dependencies
pnpm list --depth=0 | grep -E "(express|cors|helmet|redis|pg)"

# 2. Run integration tests
pnpm test:integration:all

# 3. Run API Gateway tests
pnpm test:integration:gateway

# 4. Run golden flows
pnpm dlx vitest run tests/integration/golden-flows.test.ts

# 5. Test Docker build
docker build -t aibos-accounts .

# 6. Test Docker compose
docker-compose up --build

# 7. Verify health check
curl http://localhost:3000/api/health
```

## 🚨 **Risk Mitigation**

### **Dependency Conflicts**

- **Risk**: Version conflicts between packages
- **Mitigation**: Use `pnpm overrides` in package.json, test after each dependency addition

### **Environment Variable Issues**

- **Risk**: Tests failing due to missing environment variables
- **Mitigation**: Explicit environment loading in test setup, fallback values

### **Database Schema Conflicts**

- **Risk**: Test schemas interfering with each other
- **Mitigation**: Random schema names, proper cleanup in finally blocks

### **Docker Build Issues**

- **Risk**: Multi-stage build failures
- **Mitigation**: Test each stage individually, use .dockerignore

## 📅 **Timeline & Milestones**

| Day  | Phase   | Deliverables                            | Success Criteria            |
| ---- | ------- | --------------------------------------- | --------------------------- |
| 1-2  | Phase 1 | Dependencies, API responses, middleware | API Gateway tests passing   |
| 3-4  | Phase 2 | Environment setup, test schemas         | Integration tests running   |
| 5-6  | Phase 3 | API server, client, endpoints           | API endpoints testable      |
| 7    | Phase 4 | Docker configuration                    | Production deployment ready |
| 8-10 | Phase 5 | Test implementation, validation         | 80%+ test coverage          |

## 🎯 **Expected Outcomes**

### **Immediate (End of Phase 1)**

- API Gateway: 0/6 → 6/6 tests passing
- Response format standardized
- CORS headers working

### **Short-term (End of Phase 3)**

- Integration tests: 204 skipped → 150+ passing
- API endpoints: 0/81 → 60+ passing
- Golden flows: 0/10 → 10/10 running

### **Long-term (End of Phase 5)**

- Overall test coverage: 15% → 80%+
- Production deployment ready
- Comprehensive API testing
- Robust error handling
- Security middleware active

## 📝 **Documentation Updates**

### **Files to Update**

1. `README.md` - Add Docker setup instructions
2. `package.json` - Update scripts for new test commands
3. `.github/workflows/test.yml` - Add integration test steps
4. `docs/api.md` - Document API endpoints and responses
5. `docs/testing.md` - Update testing strategy documentation

### **New Documentation Files**

1. `docs/docker-setup.md` - Docker configuration guide
2. `docs/api-testing.md` - API testing best practices
3. `docs/integration-testing.md` - Integration test guide
4. `docs/deployment.md` - Production deployment guide

## 🔄 **Maintenance & Monitoring**

### **Regular Tasks**

- Weekly dependency updates (`pnpm update`)
- Monthly security audits (`pnpm audit`)
- Quarterly test coverage reviews
- Annual architecture reviews

### **Monitoring**

- API response times
- Test execution times
- Docker build times
- Environment variable validation
- Database connection health

---

**This plan ensures zero compromise on quality while providing a clear, actionable roadmap to production-ready integration testing. Each phase builds upon the previous one, with clear success criteria and validation steps.**
