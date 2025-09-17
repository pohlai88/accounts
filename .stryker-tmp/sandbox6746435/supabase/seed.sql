-- =====================================================
-- AIBOS LOCAL SUPABASE SEED DATA FOR TESTING
-- =====================================================
-- This file creates test data for local Supabase testing

-- Insert test tenant
INSERT INTO tenants (id, name, slug) VALUES 
('tenant-123', 'Test Tenant', 'test-tenant')
ON CONFLICT (id) DO NOTHING;

-- Insert test company
INSERT INTO companies (id, tenant_id, name, code, base_currency) VALUES 
('company-456', 'tenant-123', 'Test Company', 'TEST', 'MYR')
ON CONFLICT (id) DO NOTHING;

-- Insert test user
INSERT INTO users (id, email, first_name, last_name) VALUES 
('user-789', 'test@example.com', 'Test', 'User')
ON CONFLICT (id) DO NOTHING;

-- Insert test membership
INSERT INTO memberships (user_id, tenant_id, company_id, role) VALUES 
('user-789', 'tenant-123', 'company-456', 'manager')
ON CONFLICT (user_id, tenant_id) DO NOTHING;

-- Insert test currencies
INSERT INTO currencies (code, name, symbol) VALUES 
('MYR', 'Malaysian Ringgit', 'RM'),
('USD', 'US Dollar', '$'),
('SGD', 'Singapore Dollar', 'S$')
ON CONFLICT (code) DO NOTHING;

-- Insert test chart of accounts (required for posting tests)
INSERT INTO chart_of_accounts (id, tenant_id, company_id, code, name, account_type, currency) VALUES 
('00000000-0000-0000-0000-000000000001', 'tenant-123', 'company-456', '1000', 'Cash', 'ASSET', 'MYR'),
('00000000-0000-0000-0000-000000000002', 'tenant-123', 'company-456', '2000', 'Accounts Payable', 'LIABILITY', 'MYR'),
('00000000-0000-0000-0000-000000000003', 'tenant-123', 'company-456', '3000', 'Revenue', 'REVENUE', 'MYR'),
('00000000-0000-0000-0000-000000000004', 'tenant-123', 'company-456', '4000', 'Expenses', 'EXPENSE', 'MYR')
ON CONFLICT (id) DO NOTHING;
