-- Migration: Base Schema Setup
-- This migration creates the foundational tables for the AI-BOS Accounting SaaS platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable RLS extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create audit log function for tracking changes
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    table_name,
    operation,
    old_data,
    new_data,
    user_id,
    tenant_id,
    created_at
  ) VALUES (
    TG_TABLE_NAME,
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN row_to_json(NEW) ELSE NULL END,
    COALESCE(current_setting('app.current_user_id', true)::uuid, '00000000-0000-0000-0000-000000000000'::uuid),
    COALESCE(current_setting('app.current_tenant_id', true)::uuid, '00000000-0000-0000-0000-000000000000'::uuid),
    NOW()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  user_id UUID,
  tenant_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for audit logs
CREATE INDEX IF NOT EXISTS audit_logs_table_name_idx ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS audit_logs_operation_idx ON audit_logs(operation);
CREATE INDEX IF NOT EXISTS audit_logs_user_id_idx ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS audit_logs_tenant_id_idx ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON audit_logs(created_at);

-- Enable RLS on audit logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Tenants table - Multi-tenant architecture foundation
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  domain TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'active',
  settings JSONB DEFAULT '{}',
  subscription_plan TEXT DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for tenants
CREATE INDEX IF NOT EXISTS tenants_slug_idx ON tenants(slug);
CREATE INDEX IF NOT EXISTS tenants_domain_idx ON tenants(domain);
CREATE INDEX IF NOT EXISTS tenants_status_idx ON tenants(status);

-- Enable RLS on tenants
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Companies table - Business entities within tenants
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  base_currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'active',
  settings JSONB DEFAULT '{}',
  fiscal_year_start DATE DEFAULT '2024-01-01',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, code)
);

-- Create indexes for companies
CREATE INDEX IF NOT EXISTS companies_tenant_id_idx ON companies(tenant_id);
CREATE INDEX IF NOT EXISTS companies_status_idx ON companies(status);
CREATE INDEX IF NOT EXISTS companies_code_idx ON companies(code);

-- Enable RLS on companies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Users table - User management with role-based access
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  last_login TIMESTAMP WITH TIME ZONE,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for users
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS users_status_idx ON users(status);
CREATE INDEX IF NOT EXISTS users_last_login_idx ON users(last_login);

-- Enable RLS on users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Memberships table - User-tenant relationships with roles
CREATE TABLE IF NOT EXISTS memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user',
  permissions JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, tenant_id)
);

-- Create indexes for memberships
CREATE INDEX IF NOT EXISTS memberships_user_id_idx ON memberships(user_id);
CREATE INDEX IF NOT EXISTS memberships_tenant_id_idx ON memberships(tenant_id);
CREATE INDEX IF NOT EXISTS memberships_company_id_idx ON memberships(company_id);
CREATE INDEX IF NOT EXISTS memberships_role_idx ON memberships(role);
CREATE INDEX IF NOT EXISTS memberships_status_idx ON memberships(status);

-- Enable RLS on memberships
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

-- Currencies table - Supported currencies
CREATE TABLE IF NOT EXISTS currencies (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  decimal_places INTEGER DEFAULT 2,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for currencies
CREATE INDEX IF NOT EXISTS currencies_is_active_idx ON currencies(is_active);

-- Enable RLS on currencies
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;

-- Chart of Accounts table - Core accounting structure
CREATE TABLE IF NOT EXISTS chart_of_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  account_type TEXT NOT NULL,
  parent_id UUID REFERENCES chart_of_accounts(id) ON DELETE SET NULL,
  level INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, company_id, code)
);

-- Create indexes for chart_of_accounts
CREATE INDEX IF NOT EXISTS chart_of_accounts_tenant_id_idx ON chart_of_accounts(tenant_id);
CREATE INDEX IF NOT EXISTS chart_of_accounts_company_id_idx ON chart_of_accounts(company_id);
CREATE INDEX IF NOT EXISTS chart_of_accounts_code_idx ON chart_of_accounts(code);
CREATE INDEX IF NOT EXISTS chart_of_accounts_account_type_idx ON chart_of_accounts(account_type);
CREATE INDEX IF NOT EXISTS chart_of_accounts_parent_id_idx ON chart_of_accounts(parent_id);
CREATE INDEX IF NOT EXISTS chart_of_accounts_is_active_idx ON chart_of_accounts(is_active);

-- Enable RLS on chart_of_accounts
ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;

-- Add audit triggers for all tables
CREATE TRIGGER audit_tenants AFTER INSERT OR UPDATE OR DELETE ON tenants
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_companies AFTER INSERT OR UPDATE OR DELETE ON companies
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_users AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_memberships AFTER INSERT OR UPDATE OR DELETE ON memberships
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_currencies AFTER INSERT OR UPDATE OR DELETE ON currencies
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_chart_of_accounts AFTER INSERT OR UPDATE OR DELETE ON chart_of_accounts
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

-- RLS Policies for tenant isolation
CREATE POLICY "Users can only access their tenant data" ON tenants
  FOR ALL USING (id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "Users can only access their company data" ON companies
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "Users can only access their own data" ON users
  FOR ALL USING (id = current_setting('app.current_user_id', true)::uuid);

CREATE POLICY "Users can only access their memberships" ON memberships
  FOR ALL USING (user_id = current_setting('app.current_user_id', true)::uuid);

CREATE POLICY "Currencies are accessible to all authenticated users" ON currencies
  FOR ALL USING (is_active = true);

CREATE POLICY "Users can only access their tenant's chart of accounts" ON chart_of_accounts
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
