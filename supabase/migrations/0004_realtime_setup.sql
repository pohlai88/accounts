-- Realtime setup for multi-tenant real-time updates
-- This migration configures realtime for tenant-scoped data

-- Enable realtime for tenant-scoped tables
ALTER PUBLICATION supabase_realtime ADD TABLE tenants;
ALTER PUBLICATION supabase_realtime ADD TABLE companies;
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE memberships;
ALTER PUBLICATION supabase_realtime ADD TABLE user_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE tenant_invitations;

-- Enable realtime for business data tables
ALTER PUBLICATION supabase_realtime ADD TABLE chart_of_accounts;
ALTER PUBLICATION supabase_realtime ADD TABLE audit_logs;

-- Create realtime channels for tenant-specific updates
CREATE OR REPLACE FUNCTION get_tenant_channel_name()
RETURNS TEXT AS $$
BEGIN
  RETURN 'tenant:' || (auth.jwt() ->> 'tenant_id');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to broadcast tenant updates
CREATE OR REPLACE FUNCTION broadcast_tenant_update(
  channel_name TEXT,
  event_type TEXT,
  payload JSONB
)
RETURNS VOID AS $$
BEGIN
  PERFORM pg_notify(
    'realtime:tenant_update',
    json_build_object(
      'channel', channel_name,
      'event', event_type,
      'payload', payload
    )::text
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for real-time tenant updates
CREATE OR REPLACE FUNCTION notify_tenant_changes()
RETURNS TRIGGER AS $$
DECLARE
  tenant_id TEXT;
  channel_name TEXT;
  event_type TEXT;
  payload JSONB;
BEGIN
  -- Get tenant_id from the record
  tenant_id := COALESCE(NEW.tenant_id, OLD.tenant_id);

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

-- Create triggers for real-time updates
CREATE TRIGGER realtime_tenants
  AFTER INSERT OR UPDATE OR DELETE ON tenants
  FOR EACH ROW EXECUTE FUNCTION notify_tenant_changes();

CREATE TRIGGER realtime_companies
  AFTER INSERT OR UPDATE OR DELETE ON companies
  FOR EACH ROW EXECUTE FUNCTION notify_tenant_changes();

CREATE TRIGGER realtime_memberships
  AFTER INSERT OR UPDATE OR DELETE ON memberships
  FOR EACH ROW EXECUTE FUNCTION notify_tenant_changes();

CREATE TRIGGER realtime_user_settings
  AFTER INSERT OR UPDATE OR DELETE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION notify_tenant_changes();

CREATE TRIGGER realtime_chart_of_accounts
  AFTER INSERT OR UPDATE OR DELETE ON chart_of_accounts
  FOR EACH ROW EXECUTE FUNCTION notify_tenant_changes();


-- Function to subscribe to tenant-specific channels
CREATE OR REPLACE FUNCTION subscribe_to_tenant_channel(tenant_id TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Verify user has access to this tenant
  IF NOT EXISTS (
    SELECT 1 FROM memberships m
    WHERE m.user_id = (auth.jwt() ->> 'sub')::uuid
      AND m.tenant_id = subscribe_to_tenant_channel.tenant_id::uuid
  ) THEN
    RAISE EXCEPTION 'Access denied to tenant channel';
  END IF;

  RETURN 'tenant:' || tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
