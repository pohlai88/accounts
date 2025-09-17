-- Fix tenant triggers that expect tenant_id field
-- The tenants table doesn't have a tenant_id field, so we need to fix the triggers

-- Drop the problematic trigger
DROP TRIGGER IF EXISTS realtime_tenants ON tenants;

-- Recreate the trigger with correct field reference
CREATE TRIGGER realtime_tenants
  AFTER INSERT OR UPDATE OR DELETE ON tenants
  FOR EACH ROW EXECUTE FUNCTION notify_tenant_changes();

-- Also fix the notify_tenant_changes function to handle tenants table correctly
CREATE OR REPLACE FUNCTION notify_tenant_changes()
RETURNS TRIGGER AS $$
DECLARE
  tenant_id TEXT;
  channel_name TEXT;
  event_type TEXT;
  payload JSONB;
BEGIN
  -- Get tenant_id from the record - for tenants table, use the id field
  IF TG_TABLE_NAME = 'tenants' THEN
    tenant_id := COALESCE(NEW.id, OLD.id)::text;
  ELSE
    tenant_id := COALESCE(NEW.tenant_id, OLD.tenant_id)::text;
  END IF;
  
  -- Skip if no tenant_id
  IF tenant_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  -- Construct channel name
  channel_name := 'tenant:' || tenant_id;
  
  -- Determine event type
  IF TG_OP = 'INSERT' THEN
    event_type := 'INSERT';
    payload := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    event_type := 'UPDATE';
    payload := json_build_object(
      'old', to_jsonb(OLD),
      'new', to_jsonb(NEW)
    );
  ELSIF TG_OP = 'DELETE' THEN
    event_type := 'DELETE';
    payload := to_jsonb(OLD);
  END IF;
  
  -- Broadcast the update
  PERFORM broadcast_tenant_update(channel_name, event_type, payload);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
