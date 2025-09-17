# ✅ Integration Testing Implementation Checklist

## 🚀 **Quick Start Checklist**

### **Pre-Implementation Verification**

- [ ] Current working directory: `C:\AI-BOS\accounts`
- [ ] Supabase connection verified: `pnpm test:unit:acc:fast` passes
- [ ] Environment variables loaded: `.env .local` exists and valid
- [ ] Node version: `>=20.12.0` (check with `node --version`)
- [ ] pnpm version: `>=9.0.0` (check with `pnpm --version`)

### **Phase 1: Dependencies & API Infrastructure**

#### **1.1 Install Missing Dependencies**

```bash
# Run these commands in order
pnpm add express@^4.21.2 cors@^2.8.5 helmet@^7.2.0 express-rate-limit@^7.5.1 ws@^8.14.2 jose@^5.10.0 redis@^5.8.2 pg@^8.16.3

pnpm add -D @types/express@^4.17.21 @types/cors@^2.8.17 @types/ws@^8.5.10 @types/pg@^8.10.9

# Verify installation
pnpm list --depth=0 | findstr -i "express cors helmet redis pg"
```

#### **1.2 Create API Response System**

- [ ] Create `packages/api/src/http/response.ts`
- [ ] Implement `ApiResponse<T>` type
- [ ] Add helper functions: `ok()`, `created()`, `notFound()`, `serverErr()`
- [ ] Test response format with simple test

#### **1.3 Fix API Gateway**

- [ ] Update `packages/utils/src/api-gateway/gateway.ts`
- [ ] Fix `use()` method to return `this` for chaining
- [ ] Update `processRequest()` to handle response format
- [ ] Test middleware chain works

#### **1.4 Create Middleware**

- [ ] Create `packages/api/src/http/middlewares/cors.ts`
- [ ] Create `packages/api/src/http/middlewares/logging.ts`
- [ ] Create `packages/api/src/http/middlewares/error.ts`
- [ ] Test CORS headers are present

### **Phase 2: Integration Test Infrastructure**

#### **2.1 Environment Setup**

- [ ] Create `packages/api/tests/integration/setup.ts`
- [ ] Add `dotenv/config` import
- [ ] Set `NODE_ENV=test`
- [ ] Verify environment variables loading

#### **2.2 Database Test Strategy**

- [ ] Create `packages/accounting/tests/integration/db-test-schema.ts`
- [ ] Implement `withTestSchema()` helper
- [ ] Test schema creation and cleanup
- [ ] Verify Supabase connection works

#### **2.3 Test Configuration**

- [ ] Update `tests/integration/vitest.config.ts`
- [ ] Add setup files
- [ ] Configure timeouts
- [ ] Add environment variables
- [ ] Test configuration loads

### **Phase 3: API Server Implementation**

#### **3.1 Express Server**

- [ ] Create `packages/api/src/server.ts`
- [ ] Add Express app setup
- [ ] Configure middleware (helmet, cors, rate-limit)
- [ ] Add body parsing
- [ ] Test server starts

#### **3.2 API Gateway Integration**

- [ ] Initialize Gateway in server
- [ ] Add middleware chain
- [ ] Create health check endpoint
- [ ] Create test endpoint
- [ ] Test endpoints respond

#### **3.3 API Client**

- [ ] Create `packages/api/src/client.ts`
- [ ] Implement `ApiClient` class
- [ ] Add convenience methods (get, post, put, delete)
- [ ] Test client works

### **Phase 4: Docker Configuration**

#### **4.1 Production Dockerfile**

- [ ] Create `Dockerfile`
- [ ] Multi-stage build (base, build, runtime)
- [ ] Install pnpm
- [ ] Copy and build application
- [ ] Add health check
- [ ] Test Docker build: `docker build -t aibos-accounts .`

#### **4.2 Docker Compose**

- [ ] Create `docker-compose.yml` (production)
- [ ] Create `docker-compose.dev.yml` (development)
- [ ] Add Redis service
- [ ] Configure environment variables
- [ ] Test compose: `docker-compose up --build`

### **Phase 5: Test Implementation**

#### **5.1 Gateway E2E Tests**

- [ ] Create `packages/api/tests/integration/gateway.e2e.test.ts`
- [ ] Test health check endpoint
- [ ] Test CORS headers
- [ ] Test error handling
- [ ] Test POST endpoints
- [ ] Run tests: `pnpm test:integration:gateway`

#### **5.2 Golden Flows Tests**

- [ ] Update `tests/integration/golden-flows.test.ts`
- [ ] Use `withTestSchema()` helper
- [ ] Test invoice posting workflow
- [ ] Test FX conversion
- [ ] Test payment processing
- [ ] Run tests: `pnpm dlx vitest run tests/integration/golden-flows.test.ts`

#### **5.3 API Endpoint Tests**

- [ ] Enable API server in tests
- [ ] Test payment endpoints
- [ ] Test invoice endpoints
- [ ] Test bill endpoints
- [ ] Run tests: `pnpm test:integration:all`

## 🧪 **Testing Commands**

### **Development Testing**

```bash
# Unit tests (should still pass)
pnpm test:unit:acc:fast

# Integration tests (should start passing)
pnpm test:integration:gateway
pnpm test:integration:cache
pnpm test:integration:idempotency

# Full integration suite
pnpm test:integration:all
```

### **Docker Testing**

```bash
# Build Docker image
docker build -t aibos-accounts .

# Run with docker-compose
docker-compose up --build

# Test health endpoint
curl http://localhost:3000/api/health
```

### **Environment Testing**

```bash
# Test environment variables
echo $env:NEXT_PUBLIC_SUPABASE_URL
echo $env:SUPABASE_SERVICE_ROLE_KEY
echo $env:DATABASE_URL

# Test with explicit environment
$env:NEXT_PUBLIC_SUPABASE_URL="https://dsjxvwhuvnefduvjbmgk.supabase.co"; $env:SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzanh2d2h1dm5lZmR1dmpibWdrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzUyMDI2NiwiZXhwIjoyMDczMDk2MjY2fQ.c9ZBloPgahgXHVWnxo3fUWvIqjdFa-MFbNkCZL928so"; pnpm test:integration:gateway
```

## 🚨 **Troubleshooting**

### **Common Issues**

#### **Dependencies Not Installing**

```bash
# Clear cache and reinstall
pnpm store prune
pnpm install
```

#### **Environment Variables Not Loading**

```bash
# Check .env file exists
ls -la ".env .local"

# Test environment loading
node -e "require('dotenv/config'); console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)"
```

#### **Docker Build Failing**

```bash
# Check Docker is running
docker --version
docker ps

# Build with verbose output
docker build --no-cache -t aibos-accounts .
```

#### **Tests Hanging**

```bash
# Check for port conflicts
netstat -an | findstr :3001

# Kill any hanging processes
taskkill /f /im node.exe
```

### **Success Indicators**

#### **Phase 1 Complete When:**

- [ ] `pnpm list` shows all required dependencies
- [ ] API Gateway tests: 6/6 passing
- [ ] CORS headers present in responses
- [ ] Response format standardized

#### **Phase 2 Complete When:**

- [ ] No "Missing required environment variables" errors
- [ ] Integration tests loading environment
- [ ] Supabase test schema working
- [ ] Test configuration updated

#### **Phase 3 Complete When:**

- [ ] API server starts on port 3001
- [ ] Health check responds: `curl http://localhost:3001/api/health`
- [ ] API client working
- [ ] Endpoints returning proper responses

#### **Phase 4 Complete When:**

- [ ] Docker build succeeds: `docker build -t aibos-accounts .`
- [ ] Docker compose runs: `docker-compose up --build`
- [ ] Health check in container works
- [ ] Production deployment ready

#### **Phase 5 Complete When:**

- [ ] Integration tests: 150+ passing
- [ ] Golden flows: 10/10 running
- [ ] API endpoints: 60+ passing
- [ ] Overall coverage: 80%+

## 📊 **Progress Tracking**

### **Daily Standup Questions**

1. Which phase are you currently on?
2. What dependencies have you installed?
3. Which tests are passing/failing?
4. Any blocking issues?
5. What's the next step?

### **Weekly Review**

1. How many tests are now passing?
2. What's the test coverage percentage?
3. Are Docker builds working?
4. Is the API server running?
5. What needs to be prioritized next?

---

**Use this checklist to ensure no critical steps are missed and all dependencies are properly installed and working.**
