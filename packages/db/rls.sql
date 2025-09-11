-- V1 RLS Policies - ALL TABLES MUST HAVE RLS ON BY DEFAULT
-- This file implements the complete RLS security model for multi-tenancy

-- Core tenant tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_own_data ON tenants FOR ALL USING (
  id = (auth.jwt() ->> 'tenant_id')::uuid
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY company_tenant_scope ON companies FOR ALL USING (
  tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_own_profile ON users FOR ALL USING (
  id = (auth.jwt() ->> 'sub')::uuid
);

ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY membership_tenant_scope ON memberships FOR ALL USING (
  tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
);

-- Currency and FX (global read, admin write)
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY currency_read_all ON currencies FOR SELECT USING (true);
CREATE POLICY currency_admin_write ON currencies FOR INSERT WITH CHECK (
  (auth.jwt() ->> 'role') = 'admin'
);

ALTER TABLE fx_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY fx_rates_read_all ON fx_rates FOR SELECT USING (true);
CREATE POLICY fx_rates_system_write ON fx_rates FOR INSERT WITH CHECK (
  (auth.jwt() ->> 'role') IN ('admin', 'system')
);

-- Chart of Accounts (tenant + company scoped)
ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY coa_tenant_company_scope ON chart_of_accounts FOR ALL USING (
  tenant_id = (auth.jwt() ->> 'tenant_id')::uuid AND
  company_id = (auth.jwt() ->> 'company_id')::uuid
);

-- Journals (tenant + company scoped with SoD checks)
ALTER TABLE gl_journal ENABLE ROW LEVEL SECURITY;
CREATE POLICY journal_tenant_company_scope ON gl_journal FOR ALL USING (
  tenant_id = (auth.jwt() ->> 'tenant_id')::uuid AND
  company_id = (auth.jwt() ->> 'company_id')::uuid
);

ALTER TABLE gl_journal_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY journal_lines_via_journal ON gl_journal_lines FOR ALL USING (
  EXISTS (
    SELECT 1 FROM gl_journal j 
    WHERE j.id = gl_journal_lines.journal_id 
    AND j.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND j.company_id = (auth.jwt() ->> 'company_id')::uuid
  )
);

-- Idempotency Keys (tenant scoped)
ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY idempotency_tenant_scope ON idempotency_keys FOR ALL USING (
  tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
);

-- Audit Logs (tenant scoped, read-only for users)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_logs_tenant_read ON audit_logs FOR SELECT USING (
  tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
);
CREATE POLICY audit_logs_system_write ON audit_logs FOR INSERT WITH CHECK (
  tenant_id = (auth.jwt() ->> 'tenant_id')::uuid AND
  (auth.jwt() ->> 'role') IN ('system', 'admin')
);

-- Function to validate journal balance (V1 requirement)
CREATE OR REPLACE FUNCTION validate_journal_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT ABS(COALESCE(SUM(debit), 0) - COALESCE(SUM(credit), 0)) 
      FROM gl_journal_lines 
      WHERE journal_id = NEW.journal_id) > 0.01 THEN
    RAISE EXCEPTION 'Journal must be balanced: debits must equal credits';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce balanced journals
CREATE TRIGGER enforce_journal_balance
  AFTER INSERT OR UPDATE ON gl_journal_lines
  FOR EACH ROW
  EXECUTE FUNCTION validate_journal_balance();

-- Function to create audit log entries
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    tenant_id,
    company_id,
    user_id,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values,
    request_id
  ) VALUES (
    COALESCE(NEW.tenant_id, OLD.tenant_id),
    COALESCE(NEW.company_id, OLD.company_id),
    (auth.jwt() ->> 'sub')::uuid,
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' THEN to_jsonb(NEW) 
         WHEN TG_OP = 'UPDATE' THEN to_jsonb(NEW) 
         ELSE NULL END,
    current_setting('app.request_id', true)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Audit triggers for all major tables
CREATE TRIGGER audit_tenants AFTER INSERT OR UPDATE OR DELETE ON tenants
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_companies AFTER INSERT OR UPDATE OR DELETE ON companies
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_journals AFTER INSERT OR UPDATE OR DELETE ON gl_journal
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_journal_lines AFTER INSERT OR UPDATE OR DELETE ON gl_journal_lines
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();
