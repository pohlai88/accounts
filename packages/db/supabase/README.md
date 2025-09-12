# 🚀 AIBOS Database Deployment Guide

## 📋 **Deployment Order (CRITICAL)**

Deploy these SQL files in **exact order** to avoid errors:

### **Step 1: D1 Core Foundation**

```sql
-- File: 01_d1_setup.sql
-- Run this FIRST in Supabase SQL Editor
```

**What it creates:**

- ✅ Core tenant/company structure
- ✅ User management & memberships
- ✅ Chart of accounts
- ✅ GL journal system
- ✅ Currency & FX rates
- ✅ Audit logging
- ✅ RLS security policies
- ✅ Business logic functions

### **Step 2: D2 AR Features**

```sql
-- File: 02_d2_ar_migration.sql
-- Run this AFTER D1 is complete
```

**What it adds:**

- ✅ Customer management
- ✅ AR invoices & invoice lines
- ✅ Tax codes & calculations
- ✅ Invoice posting to GL
- ✅ Balance tracking
- ✅ AR-specific RLS policies

---

## ⚠️ **IMPORTANT NOTES**

### **File Status:**

- ✅ `01_d1_setup.sql` - **READY FOR PRODUCTION**
- ✅ `02_d2_ar_migration.sql` - **READY FOR PRODUCTION**
- ⚠️ `01_setup.sql` - **DEPRECATED** (mixed structure causes errors)

### **Prerequisites:**

- Supabase project with SQL Editor access
- Admin privileges to create tables/policies
- Understanding of your tenant/company structure

### **Validation Steps:**

After each migration, verify:

```sql
-- Check tables were created
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true;

-- Check foreign keys
SELECT conname, conrelid::regclass, confrelid::regclass
FROM pg_constraint
WHERE contype = 'f';
```

---

## 🔧 **Troubleshooting**

### **Common Issues:**

#### **"Table already exists" errors**

- ✅ **Safe to ignore** - Uses `IF NOT EXISTS`
- Scripts are idempotent and can be re-run

#### **"Foreign key constraint" errors**

- ❌ **Check deployment order** - D1 must complete before D2
- Verify all referenced tables exist

#### **"RLS policy already exists" errors**

- ✅ **Safe to ignore** - Policies use `CREATE POLICY` with unique names
- Drop existing policies if you need to update them

#### **"Function already exists" errors**

- ✅ **Safe to ignore** - Uses `CREATE OR REPLACE FUNCTION`

### **Recovery Steps:**

If deployment fails midway:

1. Check which tables were created successfully
2. Note the error line number
3. Fix the issue and re-run from that point
4. Or drop all tables and start fresh

---

## 📊 **Post-Deployment Setup**

### **1. Create Your First Tenant**

```sql
INSERT INTO tenants (name, slug)
VALUES ('Your Company', 'your-company');
```

### **2. Create Your First Company**

```sql
INSERT INTO companies (tenant_id, name, code, base_currency)
SELECT id, 'Main Company', 'MAIN', 'MYR'
FROM tenants WHERE slug = 'your-company';
```

### **3. Set Up Chart of Accounts**

```sql
-- Example: Create basic accounts
INSERT INTO chart_of_accounts (tenant_id, company_id, code, name, account_type, currency)
SELECT t.id, c.id, '1000', 'Cash', 'ASSET', 'MYR'
FROM tenants t, companies c
WHERE t.slug = 'your-company' AND c.code = 'MAIN';
```

### **4. Configure Tax Codes**

```sql
-- GST example (adjust rate as needed)
INSERT INTO tax_codes (tenant_id, company_id, code, name, rate, tax_type, tax_account_id)
SELECT t.id, c.id, 'GST', 'GST 6%', 0.06, 'OUTPUT_TAX', coa.id
FROM tenants t, companies c, chart_of_accounts coa
WHERE t.slug = 'your-company'
  AND c.code = 'MAIN'
  AND coa.code = '2000'; -- Your tax liability account
```

---

## 🧪 **Testing Your Setup**

### **1. Test Database Connection**

```bash
# From your app
pnpm --filter @aibos/db test:connection
```

### **2. Test RLS Policies**

```sql
-- This should return no rows (RLS blocking)
SET ROLE anon;
SELECT * FROM tenants;

-- This should work with proper JWT
SET ROLE authenticated;
-- (with proper JWT claims)
SELECT * FROM tenants;
```

### **3. Test API Endpoints**

```bash
# Test invoice creation
curl -X POST http://localhost:3001/api/invoices \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: your-tenant-id" \
  -d '{"customerId": "...", "invoiceNumber": "TEST-001", ...}'
```

---

## 📈 **Performance Optimization**

### **Indexes Created:**

- ✅ Tenant/company scoped indexes
- ✅ Date-based indexes for reporting
- ✅ Foreign key indexes
- ✅ Unique constraint indexes

### **Monitoring Queries:**

```sql
-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## 🔒 **Security Checklist**

- ✅ RLS enabled on all tables
- ✅ Tenant isolation enforced
- ✅ User-based access control
- ✅ Audit logging active
- ✅ Foreign key constraints
- ✅ Data validation constraints
- ✅ Secure JWT claim validation

---

## 📞 **Support**

If you encounter issues:

1. Check the error message carefully
2. Verify deployment order was followed
3. Ensure all prerequisites are met
4. Review the troubleshooting section above
5. Check Supabase logs for detailed errors

**Happy deploying! 🎉**
