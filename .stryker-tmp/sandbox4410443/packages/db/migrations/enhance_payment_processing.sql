-- Enhanced Payment Processing Schema
-- This migration adds support for advanced payment processing features

-- Add currency field to customers table if not exists
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'MYR'
REFERENCES currencies(code);

-- Add currency field to suppliers table if not exists
ALTER TABLE suppliers
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'MYR'
REFERENCES currencies(code);

-- Add currency field to bank_accounts table if not exists
ALTER TABLE bank_accounts
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'MYR'
REFERENCES currencies(code);

-- Create advance/prepayment accounts table for overpayment handling
CREATE TABLE IF NOT EXISTS advance_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    company_id UUID NOT NULL REFERENCES companies(id),
    account_id UUID NOT NULL REFERENCES chart_of_accounts(id),
    party_type TEXT NOT NULL CHECK (party_type IN ('CUSTOMER', 'SUPPLIER')),
    party_id UUID NOT NULL, -- References customers.id or suppliers.id
    currency TEXT NOT NULL REFERENCES currencies(code),
    balance_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, company_id, party_type, party_id, currency)
);

-- Create index for advance accounts
CREATE INDEX IF NOT EXISTS advance_accounts_tenant_company_party_idx
ON advance_accounts(tenant_id, company_id, party_type, party_id);

-- Create bank charges configuration table
CREATE TABLE IF NOT EXISTS bank_charge_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    company_id UUID NOT NULL REFERENCES companies(id),
    bank_account_id UUID NOT NULL REFERENCES bank_accounts(id),
    charge_type TEXT NOT NULL, -- 'FIXED', 'PERCENTAGE', 'TIERED'
    fixed_amount NUMERIC(18,2), -- For FIXED type
    percentage_rate NUMERIC(5,4), -- For PERCENTAGE type (e.g., 0.0250 for 2.5%)
    min_amount NUMERIC(18,2) DEFAULT 0,
    max_amount NUMERIC(18,2),
    expense_account_id UUID NOT NULL REFERENCES chart_of_accounts(id),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for bank charge configs
CREATE INDEX IF NOT EXISTS bank_charge_configs_tenant_company_bank_idx
ON bank_charge_configs(tenant_id, company_id, bank_account_id);

-- Create withholding tax configuration table
CREATE TABLE IF NOT EXISTS withholding_tax_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    company_id UUID NOT NULL REFERENCES tenants(id),
    tax_code TEXT NOT NULL, -- 'WHT-001', 'WHT-002', etc.
    tax_name TEXT NOT NULL,
    tax_rate NUMERIC(5,4) NOT NULL, -- e.g., 0.10 for 10%
    payable_account_id UUID NOT NULL REFERENCES chart_of_accounts(id),
    expense_account_id UUID NOT NULL REFERENCES chart_of_accounts(id),
    applicable_to TEXT NOT NULL CHECK (applicable_to IN ('SUPPLIERS', 'CUSTOMERS', 'BOTH')),
    min_threshold NUMERIC(18,2) DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for withholding tax configs
CREATE INDEX IF NOT EXISTS withholding_tax_configs_tenant_company_idx
ON withholding_tax_configs(tenant_id, company_id);

-- Add RLS policies for new tables
ALTER TABLE advance_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_charge_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE withholding_tax_configs ENABLE ROW LEVEL SECURITY;

-- RLS policy for advance_accounts
CREATE POLICY "advance_accounts_tenant_isolation" ON advance_accounts
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- RLS policy for bank_charge_configs
CREATE POLICY "bank_charge_configs_tenant_isolation" ON bank_charge_configs
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- RLS policy for withholding_tax_configs
CREATE POLICY "withholding_tax_configs_tenant_isolation" ON withholding_tax_configs
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Insert default withholding tax configurations
INSERT INTO withholding_tax_configs (tenant_id, company_id, tax_code, tax_name, tax_rate, payable_account_id, expense_account_id, applicable_to, min_threshold)
SELECT
    t.id as tenant_id,
    c.id as company_id,
    'WHT-001' as tax_code,
    'Withholding Tax 10%' as tax_name,
    0.10 as tax_rate,
    coa.id as payable_account_id,
    coa.id as expense_account_id, -- Same account for simplicity
    'SUPPLIERS' as applicable_to,
    0 as min_threshold
FROM tenants t
CROSS JOIN companies c
CROSS JOIN chart_of_accounts coa
WHERE coa.code = '2100' -- Tax Payable account
AND NOT EXISTS (
    SELECT 1 FROM withholding_tax_configs wtc
    WHERE wtc.tenant_id = t.id
    AND wtc.company_id = c.id
    AND wtc.tax_code = 'WHT-001'
);

-- Insert default bank charge configurations
INSERT INTO bank_charge_configs (tenant_id, company_id, bank_account_id, charge_type, fixed_amount, expense_account_id, min_amount)
SELECT
    t.id as tenant_id,
    c.id as company_id,
    ba.id as bank_account_id,
    'FIXED' as charge_type,
    2.00 as fixed_amount,
    coa.id as expense_account_id,
    0 as min_amount
FROM tenants t
CROSS JOIN companies c
CROSS JOIN bank_accounts ba
CROSS JOIN chart_of_accounts coa
WHERE coa.code = '6000' -- Bank Fees account
AND NOT EXISTS (
    SELECT 1 FROM bank_charge_configs bcc
    WHERE bcc.tenant_id = t.id
    AND bcc.company_id = c.id
    AND bcc.bank_account_id = ba.id
);

-- Add comments for documentation
COMMENT ON TABLE advance_accounts IS 'Tracks advance payments and prepayments for customers and suppliers';
COMMENT ON TABLE bank_charge_configs IS 'Configuration for automatic bank charges on payments';
COMMENT ON TABLE withholding_tax_configs IS 'Configuration for automatic withholding tax calculations';

COMMENT ON COLUMN advance_accounts.party_type IS 'Type of party: CUSTOMER or SUPPLIER';
COMMENT ON COLUMN advance_accounts.party_id IS 'ID of the customer or supplier';
COMMENT ON COLUMN advance_accounts.balance_amount IS 'Current balance of advance/prepayment';

COMMENT ON COLUMN bank_charge_configs.charge_type IS 'Type of charge: FIXED, PERCENTAGE, or TIERED';
COMMENT ON COLUMN bank_charge_configs.fixed_amount IS 'Fixed charge amount for FIXED type';
COMMENT ON COLUMN bank_charge_configs.percentage_rate IS 'Percentage rate for PERCENTAGE type (0.0250 = 2.5%)';

COMMENT ON COLUMN withholding_tax_configs.tax_rate IS 'Tax rate as decimal (0.10 = 10%)';
COMMENT ON COLUMN withholding_tax_configs.applicable_to IS 'Who this tax applies to: SUPPLIERS, CUSTOMERS, or BOTH';
COMMENT ON COLUMN withholding_tax_configs.min_threshold IS 'Minimum amount before tax applies';
