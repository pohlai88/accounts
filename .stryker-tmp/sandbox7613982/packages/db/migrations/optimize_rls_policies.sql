-- Migration: Optimize RLS Policies for Performance
-- Description: Performance optimization for Row Level Security policies
-- Date: 2024-01-15
-- Author: AI-BOS Development Team

-- Analyze current RLS performance
-- This migration optimizes RLS policies based on accounting software best practices
-- from QuickBooks, Odoo, and Zoho for better query performance

-- 1. Optimize tenant isolation policies with better indexing
-- Add composite indexes for common RLS patterns

-- Optimize invoices table RLS
CREATE INDEX CONCURRENTLY IF NOT EXISTS invoices_tenant_company_status_idx
ON invoices(tenant_id, company_id, status)
WHERE tenant_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS invoices_tenant_company_created_idx
ON invoices(tenant_id, company_id, created_at)
WHERE tenant_id IS NOT NULL;

-- Optimize bills table RLS
CREATE INDEX CONCURRENTLY IF NOT EXISTS bills_tenant_company_status_idx
ON bills(tenant_id, company_id, status)
WHERE tenant_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS bills_tenant_company_created_idx
ON bills(tenant_id, company_id, created_at)
WHERE tenant_id IS NOT NULL;

-- Optimize payments table RLS
CREATE INDEX CONCURRENTLY IF NOT EXISTS payments_tenant_company_status_idx
ON payments(tenant_id, company_id, status)
WHERE tenant_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS payments_tenant_company_created_idx
ON payments(tenant_id, company_id, created_at)
WHERE tenant_id IS NOT NULL;

-- Optimize bank_accounts table RLS
CREATE INDEX CONCURRENTLY IF NOT EXISTS bank_accounts_tenant_company_active_idx
ON bank_accounts(tenant_id, company_id, is_active)
WHERE tenant_id IS NOT NULL;

-- Optimize customers table RLS
CREATE INDEX CONCURRENTLY IF NOT EXISTS customers_tenant_company_active_idx
ON customers(tenant_id, company_id, is_active)
WHERE tenant_id IS NOT NULL;

-- Optimize vendors table RLS
CREATE INDEX CONCURRENTLY IF NOT EXISTS vendors_tenant_company_active_idx
ON vendors(tenant_id, company_id, is_active)
WHERE tenant_id IS NOT NULL;

-- 2. Optimize chart_of_accounts RLS with better indexing
CREATE INDEX CONCURRENTLY IF NOT EXISTS chart_of_accounts_tenant_company_type_idx
ON chart_of_accounts(tenant_id, company_id, account_type)
WHERE tenant_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS chart_of_accounts_tenant_company_parent_idx
ON chart_of_accounts(tenant_id, company_id, parent_account_id)
WHERE tenant_id IS NOT NULL AND parent_account_id IS NOT NULL;

-- 3. Optimize journal_entries RLS
CREATE INDEX CONCURRENTLY IF NOT EXISTS journal_entries_tenant_company_status_idx
ON journal_entries(tenant_id, company_id, status)
WHERE tenant_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS journal_entries_tenant_company_date_idx
ON journal_entries(tenant_id, company_id, posting_date)
WHERE tenant_id IS NOT NULL;

-- 4. Optimize gl_entries RLS
CREATE INDEX CONCURRENTLY IF NOT EXISTS gl_entries_tenant_company_account_idx
ON gl_entries(tenant_id, company_id, account_id)
WHERE tenant_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS gl_entries_tenant_company_date_idx
ON gl_entries(tenant_id, company_id, posting_date)
WHERE tenant_id IS NOT NULL;

-- 5. Optimize audit_logs RLS
CREATE INDEX CONCURRENTLY IF NOT EXISTS audit_logs_tenant_company_entity_idx
ON audit_logs(tenant_id, company_id, entity_type)
WHERE tenant_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS audit_logs_tenant_company_created_idx
ON audit_logs(tenant_id, company_id, created_at)
WHERE tenant_id IS NOT NULL;

-- 6. Add partial indexes for common query patterns
-- Index for active entities only
CREATE INDEX CONCURRENTLY IF NOT EXISTS invoices_active_tenant_company_idx
ON invoices(tenant_id, company_id, created_at)
WHERE tenant_id IS NOT NULL AND status IN ('draft', 'sent', 'paid');

CREATE INDEX CONCURRENTLY IF NOT EXISTS bills_active_tenant_company_idx
ON bills(tenant_id, company_id, created_at)
WHERE tenant_id IS NOT NULL AND status IN ('draft', 'pending', 'paid');

CREATE INDEX CONCURRENTLY IF NOT EXISTS payments_active_tenant_company_idx
ON payments(tenant_id, company_id, created_at)
WHERE tenant_id IS NOT NULL AND status IN ('pending', 'completed');

-- 7. Optimize RLS policy functions
-- Create optimized tenant check function
CREATE OR REPLACE FUNCTION check_tenant_access(table_tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Use current_setting for better performance than subqueries
    RETURN table_tenant_id = current_setting('app.current_tenant_id', true)::UUID;
EXCEPTION
    WHEN OTHERS THEN
        -- Fallback to false if tenant_id is not set or invalid
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql STABLE;

-- 8. Update RLS policies to use optimized function
-- Note: This requires dropping and recreating policies
-- We'll do this carefully to avoid downtime

-- Drop existing policies (backup first!)
-- CREATE TABLE rls_policy_backup AS
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies WHERE schemaname = 'public';

-- Update invoices RLS policy
DROP POLICY IF EXISTS "invoices_tenant_isolation" ON invoices;
CREATE POLICY "invoices_tenant_isolation" ON invoices
    FOR ALL USING (check_tenant_access(tenant_id));

-- Update bills RLS policy
DROP POLICY IF EXISTS "bills_tenant_isolation" ON bills;
CREATE POLICY "bills_tenant_isolation" ON bills
    FOR ALL USING (check_tenant_access(tenant_id));

-- Update payments RLS policy
DROP POLICY IF EXISTS "payments_tenant_isolation" ON payments;
CREATE POLICY "payments_tenant_isolation" ON payments
    FOR ALL USING (check_tenant_access(tenant_id));

-- Update bank_accounts RLS policy
DROP POLICY IF EXISTS "bank_accounts_tenant_isolation" ON bank_accounts;
CREATE POLICY "bank_accounts_tenant_isolation" ON bank_accounts
    FOR ALL USING (check_tenant_access(tenant_id));

-- Update customers RLS policy
DROP POLICY IF EXISTS "customers_tenant_isolation" ON customers;
CREATE POLICY "customers_tenant_isolation" ON customers
    FOR ALL USING (check_tenant_access(tenant_id));

-- Update vendors RLS policy
DROP POLICY IF EXISTS "vendors_tenant_isolation" ON vendors;
CREATE POLICY "vendors_tenant_isolation" ON vendors
    FOR ALL USING (check_tenant_access(tenant_id));

-- Update chart_of_accounts RLS policy
DROP POLICY IF EXISTS "chart_of_accounts_tenant_isolation" ON chart_of_accounts;
CREATE POLICY "chart_of_accounts_tenant_isolation" ON chart_of_accounts
    FOR ALL USING (check_tenant_access(tenant_id));

-- Update journal_entries RLS policy
DROP POLICY IF EXISTS "journal_entries_tenant_isolation" ON journal_entries;
CREATE POLICY "journal_entries_tenant_isolation" ON journal_entries
    FOR ALL USING (check_tenant_access(tenant_id));

-- Update gl_entries RLS policy
DROP POLICY IF EXISTS "gl_entries_tenant_isolation" ON gl_entries;
CREATE POLICY "gl_entries_tenant_isolation" ON gl_entries
    FOR ALL USING (check_tenant_access(tenant_id));

-- Update audit_logs RLS policy
DROP POLICY IF EXISTS "audit_logs_tenant_isolation" ON audit_logs;
CREATE POLICY "audit_logs_tenant_isolation" ON audit_logs
    FOR ALL USING (check_tenant_access(tenant_id));

-- 9. Add statistics collection for better query planning
-- Enable statistics collection on key columns
ALTER TABLE invoices ALTER COLUMN tenant_id SET STATISTICS 1000;
ALTER TABLE invoices ALTER COLUMN company_id SET STATISTICS 1000;
ALTER TABLE invoices ALTER COLUMN status SET STATISTICS 1000;

ALTER TABLE bills ALTER COLUMN tenant_id SET STATISTICS 1000;
ALTER TABLE bills ALTER COLUMN company_id SET STATISTICS 1000;
ALTER TABLE bills ALTER COLUMN status SET STATISTICS 1000;

ALTER TABLE payments ALTER COLUMN tenant_id SET STATISTICS 1000;
ALTER TABLE payments ALTER COLUMN company_id SET STATISTICS 1000;
ALTER TABLE payments ALTER COLUMN status SET STATISTICS 1000;

-- 10. Create materialized views for common reporting queries
-- This reduces the load on RLS policies for complex reports
CREATE MATERIALIZED VIEW IF NOT EXISTS tenant_invoice_summary AS
SELECT
    tenant_id,
    company_id,
    status,
    COUNT(*) as count,
    SUM(total_amount) as total_amount,
    DATE_TRUNC('month', created_at) as month
FROM invoices
WHERE tenant_id IS NOT NULL
GROUP BY tenant_id, company_id, status, DATE_TRUNC('month', created_at);

CREATE UNIQUE INDEX ON tenant_invoice_summary(tenant_id, company_id, status, month);

-- Refresh materialized view function
CREATE OR REPLACE FUNCTION refresh_tenant_summaries()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY tenant_invoice_summary;
END;
$$ LANGUAGE plpgsql;

-- 11. Add RLS policy for materialized view
ALTER MATERIALIZED VIEW tenant_invoice_summary ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_invoice_summary_tenant_isolation" ON tenant_invoice_summary
    FOR ALL USING (check_tenant_access(tenant_id));

-- 12. Create function to analyze RLS performance
CREATE OR REPLACE FUNCTION analyze_rls_performance()
RETURNS TABLE(
    table_name TEXT,
    policy_name TEXT,
    policy_expression TEXT,
    estimated_cost NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.tablename::TEXT,
        p.policyname::TEXT,
        p.qual::TEXT,
        -- Estimate cost based on policy complexity
        CASE
            WHEN p.qual LIKE '%current_setting%' THEN 1.0
            WHEN p.qual LIKE '%subquery%' THEN 10.0
            ELSE 5.0
        END as estimated_cost
    FROM pg_policies p
    WHERE p.schemaname = 'public'
    ORDER BY estimated_cost DESC;
END;
$$ LANGUAGE plpgsql;

-- 13. Add monitoring for RLS performance
-- Create a view to monitor RLS policy usage
CREATE OR REPLACE VIEW rls_performance_monitor AS
SELECT
    schemaname,
    tablename,
    policyname,
    CASE
        WHEN qual LIKE '%current_setting%' THEN 'Optimized'
        WHEN qual LIKE '%subquery%' THEN 'Needs Optimization'
        ELSE 'Standard'
    END as optimization_status,
    qual as policy_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY optimization_status, tablename;

-- 14. Add comments for documentation
COMMENT ON FUNCTION check_tenant_access(UUID) IS 'Optimized function for RLS tenant access checks';
COMMENT ON FUNCTION refresh_tenant_summaries() IS 'Refresh materialized views for reporting performance';
COMMENT ON FUNCTION analyze_rls_performance() IS 'Analyze RLS policy performance and optimization needs';
COMMENT ON VIEW rls_performance_monitor IS 'Monitor RLS policy optimization status';

-- 15. Update table statistics
ANALYZE invoices;
ANALYZE bills;
ANALYZE payments;
ANALYZE bank_accounts;
ANALYZE customers;
ANALYZE vendors;
ANALYZE chart_of_accounts;
ANALYZE journal_entries;
ANALYZE gl_entries;
ANALYZE audit_logs;

-- 16. Create maintenance procedure for RLS optimization
CREATE OR REPLACE FUNCTION maintain_rls_performance()
RETURNS VOID AS $$
BEGIN
    -- Refresh materialized views
    PERFORM refresh_tenant_summaries();

    -- Update statistics
    ANALYZE;

    -- Log performance metrics
    INSERT INTO audit_logs (
        tenant_id,
        company_id,
        entity_type,
        entity_id,
        action,
        details
    ) VALUES (
        current_setting('app.current_tenant_id', true)::UUID,
        current_setting('app.current_company_id', true)::UUID,
        'SYSTEM',
        gen_random_uuid(),
        'RLS_MAINTENANCE',
        jsonb_build_object(
            'timestamp', NOW(),
            'action', 'RLS performance maintenance completed'
        )
    );
END;
$$ LANGUAGE plpgsql;

-- 17. Schedule maintenance (requires pg_cron extension)
-- SELECT cron.schedule('rls-maintenance', '0 2 * * *', 'SELECT maintain_rls_performance();');

COMMENT ON FUNCTION maintain_rls_performance() IS 'Maintenance procedure for RLS performance optimization';
