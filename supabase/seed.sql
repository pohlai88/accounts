-- =====================================================
-- AIBOS COMPREHENSIVE SEED DATA FOR DEVELOPMENT
-- =====================================================
-- This file creates comprehensive test data for local Supabase development
-- Following best practices for deterministic, realistic data

-- =====================================================
-- CURRENCIES (Global reference data)
-- =====================================================
INSERT INTO currencies (code, name, symbol, decimal_places, is_active) VALUES
('USD', 'US Dollar', '$', 2, true),
('EUR', 'Euro', '€', 2, true),
('GBP', 'British Pound', '£', 2, true),
('MYR', 'Malaysian Ringgit', 'RM', 2, true),
('SGD', 'Singapore Dollar', 'S$', 2, true),
('JPY', 'Japanese Yen', '¥', 0, true),
('AUD', 'Australian Dollar', 'A$', 2, true),
('CAD', 'Canadian Dollar', 'C$', 2, true),
('CHF', 'Swiss Franc', 'CHF', 2, true),
('CNY', 'Chinese Yuan', '¥', 2, true)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  symbol = EXCLUDED.symbol,
  decimal_places = EXCLUDED.decimal_places,
  is_active = EXCLUDED.is_active;

-- =====================================================
-- TENANT 1: DEMO ACCOUNTING FIRM
-- =====================================================
INSERT INTO tenants (id, name, slug, domain, status, subscription_plan, settings) VALUES
('00000000-0000-0000-0000-000000000001', 'Demo Accounting Firm', 'demo-accounting', 'demo.aibos.com', 'active', 'professional', '{"industry": "accounting", "country": "MY", "timezone": "Asia/Kuala_Lumpur"}')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  domain = EXCLUDED.domain,
  status = EXCLUDED.status,
  subscription_plan = EXCLUDED.subscription_plan,
  settings = EXCLUDED.settings;

-- Company for Demo Accounting Firm
INSERT INTO companies (id, tenant_id, name, code, base_currency, status, fiscal_year_start) VALUES
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Demo Accounting Firm Sdn Bhd', 'DAF', 'MYR', 'active', '2024-01-01')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  base_currency = EXCLUDED.base_currency,
  status = EXCLUDED.status,
  fiscal_year_start = EXCLUDED.fiscal_year_start;

-- Users for Demo Accounting Firm
INSERT INTO users (id, email, first_name, last_name, status, preferences) VALUES
('00000000-0000-0000-0000-000000000003', 'admin@demoaccounting.com', 'John', 'Smith', 'active', '{"theme": "dark", "language": "en", "notifications": true}'),
('00000000-0000-0000-0000-000000000004', 'accountant@demoaccounting.com', 'Sarah', 'Johnson', 'active', '{"theme": "light", "language": "en", "notifications": true}'),
('00000000-0000-0000-0000-000000000005', 'manager@demoaccounting.com', 'Michael', 'Brown', 'active', '{"theme": "dark", "language": "en", "notifications": false}')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  status = EXCLUDED.status,
  preferences = EXCLUDED.preferences;

-- Memberships for Demo Accounting Firm
INSERT INTO memberships (user_id, tenant_id, company_id, role, permissions, status) VALUES
('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'admin', '{"all": true}', 'active'),
('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'accountant', '{"accounting": true, "reports": true}', 'active'),
('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'manager', '{"accounting": true, "reports": true, "users": true}', 'active')
ON CONFLICT (user_id, tenant_id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  role = EXCLUDED.role,
  permissions = EXCLUDED.permissions,
  status = EXCLUDED.status;

-- =====================================================
-- TENANT 2: TECH STARTUP
-- =====================================================
INSERT INTO tenants (id, name, slug, domain, status, subscription_plan, settings) VALUES
('00000000-0000-0000-0000-000000000006', 'TechStartup Inc', 'techstartup', 'techstartup.aibos.com', 'active', 'startup', '{"industry": "technology", "country": "SG", "timezone": "Asia/Singapore"}')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  domain = EXCLUDED.domain,
  status = EXCLUDED.status,
  subscription_plan = EXCLUDED.subscription_plan,
  settings = EXCLUDED.settings;

-- Company for TechStartup Inc
INSERT INTO companies (id, tenant_id, name, code, base_currency, status, fiscal_year_start) VALUES
('00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000006', 'TechStartup Inc', 'TSI', 'SGD', 'active', '2024-01-01')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  base_currency = EXCLUDED.base_currency,
  status = EXCLUDED.status,
  fiscal_year_start = EXCLUDED.fiscal_year_start;

-- Users for TechStartup Inc
INSERT INTO users (id, email, first_name, last_name, status, preferences) VALUES
('00000000-0000-0000-0000-000000000008', 'ceo@techstartup.com', 'Alex', 'Chen', 'active', '{"theme": "dark", "language": "en", "notifications": true}'),
('00000000-0000-0000-0000-000000000009', 'cfo@techstartup.com', 'Lisa', 'Wong', 'active', '{"theme": "light", "language": "en", "notifications": true}')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  status = EXCLUDED.status,
  preferences = EXCLUDED.preferences;

-- Memberships for TechStartup Inc
INSERT INTO memberships (user_id, tenant_id, company_id, role, permissions, status) VALUES
('00000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000007', 'admin', '{"all": true}', 'active'),
('00000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000007', 'manager', '{"accounting": true, "reports": true, "users": true}', 'active')
ON CONFLICT (user_id, tenant_id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  role = EXCLUDED.role,
  permissions = EXCLUDED.permissions,
  status = EXCLUDED.status;

-- =====================================================
-- CHART OF ACCOUNTS - DEMO ACCOUNTING FIRM
-- =====================================================
INSERT INTO chart_of_accounts (id, tenant_id, company_id, code, name, account_type, parent_id, level, currency) VALUES
-- Assets
('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '1000', 'Current Assets', 'ASSET', NULL, 0, 'MYR'),
('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '1100', 'Cash and Cash Equivalents', 'ASSET', '00000000-0000-0000-0000-000000000010', 1, 'MYR'),
('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '1110', 'Petty Cash', 'ASSET', '00000000-0000-0000-0000-000000000011', 2, 'MYR'),
('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '1120', 'Bank Account', 'ASSET', '00000000-0000-0000-0000-000000000011', 2, 'MYR'),
('00000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '1200', 'Accounts Receivable', 'ASSET', '00000000-0000-0000-0000-000000000010', 1, 'MYR'),
('00000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '1500', 'Fixed Assets', 'ASSET', NULL, 0, 'MYR'),
('00000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '1510', 'Office Equipment', 'ASSET', '00000000-0000-0000-0000-000000000015', 1, 'MYR'),

-- Liabilities
('00000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '2000', 'Current Liabilities', 'LIABILITY', NULL, 0, 'MYR'),
('00000000-0000-0000-0000-000000000018', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '2100', 'Accounts Payable', 'LIABILITY', '00000000-0000-0000-0000-000000000017', 1, 'MYR'),
('00000000-0000-0000-0000-000000000019', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '2200', 'Accrued Expenses', 'LIABILITY', '00000000-0000-0000-0000-000000000017', 1, 'MYR'),

-- Equity
('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '3000', 'Shareholders Equity', 'EQUITY', NULL, 0, 'MYR'),
('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '3100', 'Share Capital', 'EQUITY', '00000000-0000-0000-0000-000000000020', 1, 'MYR'),
('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '3200', 'Retained Earnings', 'EQUITY', '00000000-0000-0000-0000-000000000020', 1, 'MYR'),

-- Revenue
('00000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '4000', 'Operating Revenue', 'REVENUE', NULL, 0, 'MYR'),
('00000000-0000-0000-0000-000000000024', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '4100', 'Service Revenue', 'REVENUE', '00000000-0000-0000-0000-000000000023', 1, 'MYR'),
('00000000-0000-0000-0000-000000000025', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '4200', 'Consulting Revenue', 'REVENUE', '00000000-0000-0000-0000-000000000023', 1, 'MYR'),

-- Expenses
('00000000-0000-0000-0000-000000000026', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '5000', 'Operating Expenses', 'EXPENSE', NULL, 0, 'MYR'),
('00000000-0000-0000-0000-000000000027', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '5100', 'Salaries and Wages', 'EXPENSE', '00000000-0000-0000-0000-000000000026', 1, 'MYR'),
('00000000-0000-0000-0000-000000000028', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '5200', 'Office Rent', 'EXPENSE', '00000000-0000-0000-0000-000000000026', 1, 'MYR'),
('00000000-0000-0000-0000-000000000029', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '5300', 'Utilities', 'EXPENSE', '00000000-0000-0000-0000-000000000026', 1, 'MYR'),
('00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '5400', 'Professional Services', 'EXPENSE', '00000000-0000-0000-0000-000000000026', 1, 'MYR')
ON CONFLICT (id) DO UPDATE SET
  code = EXCLUDED.code,
  name = EXCLUDED.name,
  account_type = EXCLUDED.account_type,
  parent_id = EXCLUDED.parent_id,
  level = EXCLUDED.level,
  currency = EXCLUDED.currency;

-- =====================================================
-- CHART OF ACCOUNTS - TECHSTARTUP INC
-- =====================================================
INSERT INTO chart_of_accounts (id, tenant_id, company_id, code, name, account_type, parent_id, level, currency) VALUES
-- Assets
('00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000007', '1000', 'Current Assets', 'ASSET', NULL, 0, 'SGD'),
('00000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000007', '1100', 'Cash and Cash Equivalents', 'ASSET', '00000000-0000-0000-0000-000000000031', 1, 'SGD'),
('00000000-0000-0000-0000-000000000033', '00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000007', '1110', 'Bank Account', 'ASSET', '00000000-0000-0000-0000-000000000032', 2, 'SGD'),
('00000000-0000-0000-0000-000000000034', '00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000007', '1200', 'Accounts Receivable', 'ASSET', '00000000-0000-0000-0000-000000000031', 1, 'SGD'),

-- Liabilities
('00000000-0000-0000-0000-000000000035', '00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000007', '2000', 'Current Liabilities', 'LIABILITY', NULL, 0, 'SGD'),
('00000000-0000-0000-0000-000000000036', '00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000007', '2100', 'Accounts Payable', 'LIABILITY', '00000000-0000-0000-0000-000000000035', 1, 'SGD'),

-- Equity
('00000000-0000-0000-0000-000000000037', '00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000007', '3000', 'Shareholders Equity', 'EQUITY', NULL, 0, 'SGD'),
('00000000-0000-0000-0000-000000000038', '00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000007', '3100', 'Share Capital', 'EQUITY', '00000000-0000-0000-0000-000000000037', 1, 'SGD'),

-- Revenue
('00000000-0000-0000-0000-000000000039', '00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000007', '4000', 'Operating Revenue', 'REVENUE', NULL, 0, 'SGD'),
('00000000-0000-0000-0000-000000000040', '00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000007', '4100', 'Software Sales', 'REVENUE', '00000000-0000-0000-0000-000000000039', 1, 'SGD'),
('00000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000007', '4200', 'Subscription Revenue', 'REVENUE', '00000000-0000-0000-0000-000000000039', 1, 'SGD'),

-- Expenses
('00000000-0000-0000-0000-000000000042', '00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000007', '5000', 'Operating Expenses', 'EXPENSE', NULL, 0, 'SGD'),
('00000000-0000-0000-0000-000000000043', '00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000007', '5100', 'Salaries and Wages', 'EXPENSE', '00000000-0000-0000-0000-000000000042', 1, 'SGD'),
('00000000-0000-0000-0000-000000000044', '00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000007', '5200', 'Office Rent', 'EXPENSE', '00000000-0000-0000-0000-000000000042', 1, 'SGD'),
('00000000-0000-0000-0000-000000000045', '00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000007', '5300', 'Technology Expenses', 'EXPENSE', '00000000-0000-0000-0000-000000000042', 1, 'SGD')
ON CONFLICT (id) DO UPDATE SET
  code = EXCLUDED.code,
  name = EXCLUDED.name,
  account_type = EXCLUDED.account_type,
  parent_id = EXCLUDED.parent_id,
  level = EXCLUDED.level,
  currency = EXCLUDED.currency;
