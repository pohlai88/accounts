-- Migration: Multi-tenant user settings and invitations
-- This migration adds support for active tenant tracking and user invitations

-- User settings table for active tenant tracking
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  active_tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for user_settings
CREATE INDEX IF NOT EXISTS user_settings_user_idx ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS user_settings_active_tenant_idx ON user_settings(active_tenant_id);

-- Tenant invitations table
CREATE TABLE IF NOT EXISTS tenant_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, expired, cancelled
  invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for tenant_invitations
CREATE INDEX IF NOT EXISTS tenant_invitations_tenant_email_idx ON tenant_invitations(tenant_id, email);
CREATE INDEX IF NOT EXISTS tenant_invitations_status_idx ON tenant_invitations(status);
CREATE INDEX IF NOT EXISTS tenant_invitations_expires_idx ON tenant_invitations(expires_at);

-- Enable RLS on new tables
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_invitations ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_settings
CREATE POLICY user_settings_own_data ON user_settings FOR ALL USING (
  user_id = (auth.jwt() ->> 'sub')::uuid
);

-- RLS policies for tenant_invitations
CREATE POLICY tenant_invitations_tenant_scope ON tenant_invitations FOR ALL USING (
  tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
);

-- Add audit triggers for new tables
CREATE TRIGGER audit_user_settings AFTER INSERT OR UPDATE OR DELETE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_tenant_invitations AFTER INSERT OR UPDATE OR DELETE ON tenant_invitations
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

-- Function to get user's active tenant
CREATE OR REPLACE FUNCTION get_user_active_tenant(user_uuid UUID)
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT active_tenant_id 
    FROM user_settings 
    WHERE user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set user's active tenant
CREATE OR REPLACE FUNCTION set_user_active_tenant(user_uuid UUID, tenant_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user has membership in the tenant
  IF NOT EXISTS (
    SELECT 1 FROM memberships 
    WHERE user_id = user_uuid 
    AND tenant_id = tenant_uuid 
    AND status = 'active'
  ) THEN
    RETURN FALSE;
  END IF;

  -- Insert or update user settings
  INSERT INTO user_settings (user_id, active_tenant_id, updated_at)
  VALUES (user_uuid, tenant_uuid, NOW())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    active_tenant_id = EXCLUDED.active_tenant_id,
    updated_at = NOW();

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has active membership in tenant
CREATE OR REPLACE FUNCTION has_active_membership(user_uuid UUID, tenant_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM memberships 
    WHERE user_id = user_uuid 
    AND tenant_id = tenant_uuid 
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
