-- Test Data Setup for Live Supabase Integration Tests
-- Run this in your Supabase SQL Editor to set up test data

-- 1. Create test tenant
INSERT INTO tenants (id, name, slug, created_at, updated_at) 
VALUES (
  'tenant-123'::uuid, 
  'Test Tenant', 
  'test-tenant', 
  now(), 
  now()
) ON CONFLICT (id) DO NOTHING;

-- 2. Create test company
INSERT INTO companies (id, tenant_id, name, code, base_currency, created_at, updated_at)
VALUES (
  'company-456'::uuid,
  'tenant-123'::uuid,
  'Test Company',
  'TEST',
  'MYR',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- 3. Create test user
INSERT INTO users (id, email, first_name, last_name, created_at, updated_at)
VALUES (
  'user-789'::uuid,
  'test@example.com',
  'Test',
  'User',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- 4. Create test membership
INSERT INTO memberships (user_id, tenant_id, company_id, role, created_at)
VALUES (
  'user-789'::uuid,
  'tenant-123'::uuid,
  'company-456'::uuid,
  'manager',
  now()
) ON CONFLICT DO NOTHING;

-- 5. Create test currency
INSERT INTO currencies (code, name, symbol, decimal_places, is_active, created_at)
VALUES (
  'MYR',
  'Malaysian Ringgit',
  'RM',
  2,
  true,
  now()
) ON CONFLICT (code) DO NOTHING;

-- 6. Create test accounts (required by posting.test.ts)
INSERT INTO chart_of_accounts (id, tenant_id, company_id, code, name, account_type, level, is_active, currency, created_at, updated_at)
VALUES 
  (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'tenant-123'::uuid,
    'company-456'::uuid,
    '1000',
    'Test Cash Account',
    'ASSET',
    1,
    true,
    'MYR',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000002'::uuid,
    'tenant-123'::uuid,
    'company-456'::uuid,
    '2000',
    'Test Liability Account',
    'LIABILITY',
    1,
    true,
    'MYR',
    now(),
    now()
  )
ON CONFLICT (id) DO NOTHING;

-- 7. Verify test data
SELECT 'Test data verification:' as status;
SELECT 'Tenants:' as table_name, count(*) as count FROM tenants WHERE id = 'tenant-123'::uuid;
SELECT 'Companies:' as table_name, count(*) as count FROM companies WHERE id = 'company-456'::uuid;
SELECT 'Users:' as table_name, count(*) as count FROM users WHERE id = 'user-789'::uuid;
SELECT 'Accounts:' as table_name, count(*) as count FROM chart_of_accounts WHERE id IN ('00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000002'::uuid);

SELECT 'Test data setup complete!' as result;
