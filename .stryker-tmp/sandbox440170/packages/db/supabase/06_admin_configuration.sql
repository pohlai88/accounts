-- =====================================================
-- ADMIN CONFIGURATION - MINIMAL JSONB EXTENSIONS
-- =====================================================
-- Extends existing tables with admin configuration capabilities
-- Uses JSONB for flexible configuration without schema changes

-- Add feature flags to tenants table
ALTER TABLE public.tenants 
  ADD COLUMN IF NOT EXISTS feature_flags JSONB NOT NULL DEFAULT '{
    "attachments": true,
    "reports": true,
    "ar": true,
    "ap": false,
    "je": false,
    "regulated_mode": false
  }'::jsonb;

-- Add policy settings to companies table  
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS policy_settings JSONB NOT NULL DEFAULT '{
    "approval_threshold_rm": 50000,
    "export_requires_reason": false,
    "mfa_required_for_admin": true,
    "session_timeout_minutes": 480
  }'::jsonb;

-- Note: memberships.permissions already exists, no changes needed

-- Add helpful GIN indexes for fast JSONB queries
CREATE INDEX IF NOT EXISTS tenants_feature_flags_gin 
  ON public.tenants USING gin (feature_flags);

CREATE INDEX IF NOT EXISTS companies_policy_settings_gin 
  ON public.companies USING gin (policy_settings);

CREATE INDEX IF NOT EXISTS memberships_permissions_gin 
  ON public.memberships USING gin (permissions);

-- Add RLS policies for admin configuration access
-- Only admins can modify feature flags and policy settings

-- Tenant feature flags RLS
CREATE POLICY IF NOT EXISTS "Admin can update tenant feature flags"
  ON public.tenants FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.tenant_id = tenants.id
        AND m.user_id = auth.uid()
        AND (m.role = 'admin' OR m.role = 'owner')
    )
  );

-- Company policy settings RLS  
CREATE POLICY IF NOT EXISTS "Admin can update company policy settings"
  ON public.companies FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.company_id = companies.id
        AND m.user_id = auth.uid()
        AND (m.role = 'admin' OR m.role = 'owner')
    )
  );

-- Member permissions RLS
CREATE POLICY IF NOT EXISTS "Admin can update member permissions"
  ON public.memberships FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships admin_m
      WHERE admin_m.tenant_id = memberships.tenant_id
        AND admin_m.user_id = auth.uid()
        AND (admin_m.role = 'admin' OR admin_m.role = 'owner')
    )
  );

-- Insert default governance pack presets
INSERT INTO public.tenants (id, name, slug, feature_flags) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Starter Pack Demo', 'starter-demo', '{
    "attachments": true,
    "reports": true,
    "ar": true,
    "ap": false,
    "je": false,
    "regulated_mode": false
  }'::jsonb),
  ('00000000-0000-0000-0000-000000000002', 'Business Pack Demo', 'business-demo', '{
    "attachments": true,
    "reports": true,
    "ar": true,
    "ap": true,
    "je": true,
    "regulated_mode": false
  }'::jsonb),
  ('00000000-0000-0000-0000-000000000003', 'Enterprise Pack Demo', 'enterprise-demo', '{
    "attachments": true,
    "reports": true,
    "ar": true,
    "ap": true,
    "je": true,
    "regulated_mode": true
  }'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Insert corresponding company policy settings
INSERT INTO public.companies (id, tenant_id, name, code, policy_settings) VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Starter Company', 'START', '{
    "approval_threshold_rm": 50000,
    "export_requires_reason": false,
    "mfa_required_for_admin": true,
    "session_timeout_minutes": 480
  }'::jsonb),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'Business Company', 'BIZ', '{
    "approval_threshold_rm": 30000,
    "export_requires_reason": true,
    "mfa_required_for_admin": true,
    "session_timeout_minutes": 240
  }'::jsonb),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 'Enterprise Company', 'ENT', '{
    "approval_threshold_rm": 10000,
    "export_requires_reason": true,
    "mfa_required_for_admin": true,
    "session_timeout_minutes": 120
  }'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Add helpful comments
COMMENT ON COLUMN public.tenants.feature_flags IS 'JSONB configuration for tenant-level feature toggles';
COMMENT ON COLUMN public.companies.policy_settings IS 'JSONB configuration for company-level policy settings';
COMMENT ON COLUMN public.memberships.permissions IS 'JSONB configuration for user-level permission overrides';
