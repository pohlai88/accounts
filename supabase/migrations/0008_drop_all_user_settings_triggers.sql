-- Migration: Drop all triggers on user_settings table
-- This migration drops all triggers on the user_settings table
-- to resolve the tenant_id field issue.

-- Drop all triggers on user_settings table
DROP TRIGGER IF EXISTS audit_user_settings ON user_settings;
DROP TRIGGER IF EXISTS realtime_user_settings ON user_settings;

-- Note: We're dropping all triggers because they seem to expect
-- a 'tenant_id' field that doesn't exist in the user_settings table.
-- The user_settings table uses 'active_tenant_id' instead.
