# Database Connection Policy

## Port Usage Guidelines

### **Port 5432 (Direct PostgreSQL)**
- **Use for**: Tests requiring session features
- **Features**: `SET LOCAL search_path`, temp tables, cursors, transactions with state
- **Examples**: Schema isolation tests, complex transaction tests
- **Connection String**: `postgresql://postgres.dsjxvwhuvnefduvjbmgk:password@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres`

### **Port 6543 (Pooler)**
- **Use for**: Simple, single-statement interactions
- **Limitations**: No session state persistence across connections
- **Examples**: Basic CRUD operations, simple queries
- **Connection String**: `postgresql://postgres.dsjxvwhuvnefduvjbmgk:password@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres`

## Schema Contract

### **Canonical Table Names**
- ✅ `chart_of_accounts` - **CANONICAL** accounts table
- ✅ `tenants` - Tenant management
- ✅ `companies` - Company management  
- ✅ `customers` - Customer management
- ✅ `suppliers` - Supplier management

### **Compatibility Shim**
- `accounts` view maps to `chart_of_accounts` for backward compatibility
- **Deprecation**: Use `chart_of_accounts` directly in new code
- **Migration**: Update all references from `accounts` to `chart_of_accounts`

## Environment Variables

### **Required for Tests**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://dsjxvwhuvnefduvjbmgk.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres.dsjxvwhuvnefduvjbmgk:password@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres
SUPABASE_DB_URL=postgresql://postgres.dsjxvwhuvnefduvjbmgk:password@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres
```

### **Loading Order**
1. `.env.test` (test environment) - **OVERRIDE**
2. `.env.local` (local development)
3. `.env` (default)

## Test Isolation Strategy

### **Schema Isolation**
- Use `withTestSchema` helper for isolated test schemas
- Always qualify DDL/DML with schema: `${schema}.table_name`
- Clean up schemas after each test

### **Transaction Isolation**
```sql
BEGIN;
SET LOCAL search_path TO test_schema, public;
-- test statements
ROLLBACK;
```

## CI/CD Sequence

### **Test Execution Order**
1. **Unit Tests** (fastest)
2. **Invariant Tests** (property-based)
3. **Integration Tests** (database)
4. **Integration Tests** (API)
5. **E2E Tests** (slowest)

### **Nightly Flake Detection**
- Run test suite 5-10 times with shuffle
- Detect hidden coupling and flaky tests
- Fail CI if any test fails consistently

## Security Guidelines

### **Service Role Usage**
- Only use `SUPABASE_SERVICE_ROLE_KEY` in CI secrets
- Never commit service role keys to repository
- Restrict RPC functions to `service_role` only

### **RPC Functions**
- Avoid `exec_sql` RPC if possible
- Use direct PostgreSQL connections for schema operations
- Document any RPC functions clearly

## Troubleshooting

### **Common Issues**

#### **PGRST202 Error**
- **Cause**: Missing RPC function in schema cache
- **Solution**: Use direct PostgreSQL connection instead

#### **EADDRNOTAVAIL Error**
- **Cause**: Server binding to ambiguous address
- **Solution**: Use `127.0.0.1` + ephemeral port

#### **Session State Lost**
- **Cause**: Using pooler port for session-dependent operations
- **Solution**: Switch to port 5432 for session features

#### **Environment Variables Missing**
- **Cause**: `.env.test` not loaded properly
- **Solution**: Use deterministic environment loading with override
