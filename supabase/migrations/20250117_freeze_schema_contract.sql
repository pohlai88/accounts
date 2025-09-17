-- Freeze Schema Contract: chart_of_accounts is canonical
-- This migration establishes chart_of_accounts as the single source of truth
-- and provides a compatibility shim for any lingering 'accounts' references

-- 1. Ensure chart_of_accounts exists with required structure
-- (This should already exist, but we're documenting the contract)

-- 2. Create compatibility view for any lingering 'accounts' references
-- This allows existing code to work while we migrate to chart_of_accounts
CREATE OR REPLACE VIEW public.accounts AS
SELECT
    id,
    tenant_id,
    company_id,
    code,
    name,
    account_type as type,  -- Map account_type to type for compatibility
    parent_id,
    level,
    is_active,
    currency,
    created_at,
    updated_at
FROM public.chart_of_accounts;

-- 3. Add comment documenting this is a compatibility shim
COMMENT ON VIEW public.accounts IS 'COMPATIBILITY SHIM: Use chart_of_accounts directly. This view will be removed in a future migration.';

-- 4. Grant appropriate permissions
GRANT SELECT ON public.accounts TO authenticated;
GRANT SELECT ON public.accounts TO anon;

-- 5. Create index on the view for performance (if needed)
-- Note: Views inherit indexes from underlying tables
