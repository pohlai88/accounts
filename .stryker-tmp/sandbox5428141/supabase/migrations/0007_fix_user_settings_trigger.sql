-- Migration: Fix audit_user_settings trigger
-- This migration drops the audit_user_settings trigger
-- since the create_audit_log function expects a 'tenant_id' field
-- but user_settings table uses 'active_tenant_id'.

-- Drop the existing trigger if it exists
DROP TRIGGER IF EXISTS audit_user_settings ON user_settings;

-- Note: We're not recreating the trigger because the create_audit_log function
-- expects a 'tenant_id' field, but user_settings table uses 'active_tenant_id'.
-- If audit logging is needed for user_settings, a custom trigger function
-- should be created that handles the active_tenant_id field correctly.
