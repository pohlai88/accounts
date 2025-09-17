-- =====================================================
-- IMMEDIATE FIX: NON-CONCURRENT INDEXES FOR SUPABASE SQL EDITOR
-- =====================================================
-- These will work in Supabase SQL Editor without transaction errors
-- Safe to run during initial setup when there's no active traffic

-- 1) Journal Status Index (for filtering by draft/posted)
CREATE INDEX IF NOT EXISTS idx_gl_journal_status 
ON gl_journal (status);

-- 2) Posted Journal Index (for audit queries)
CREATE INDEX IF NOT EXISTS idx_gl_journal_posted_at 
ON gl_journal (posted_at) 
WHERE posted_at IS NOT NULL;

-- 3) Active FX Rates Index (for current rate lookups)
CREATE INDEX IF NOT EXISTS idx_fx_rates_active 
ON fx_rates (from_currency, to_currency, valid_from) 
WHERE valid_to IS NULL;

-- 4) Additional Performance Indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_created 
ON audit_logs (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_memberships_user_tenant_company 
ON memberships (user_id, tenant_id, company_id);

CREATE INDEX IF NOT EXISTS idx_journal_lines_account_date 
ON gl_journal_lines (account_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_journal_company_date_status 
ON gl_journal (company_id, journal_date DESC, status);

-- =====================================================
-- ✅ SAFE FOR INITIAL SETUP
-- ✅ WORKS IN SUPABASE SQL EDITOR  
-- ✅ NO TRANSACTION ERRORS
-- ✅ FAST INDEX CREATION
-- 
-- ⚠️  Brief table locks during creation (acceptable for setup)
-- ⚠️  Don't run on production with heavy traffic
-- =====================================================
