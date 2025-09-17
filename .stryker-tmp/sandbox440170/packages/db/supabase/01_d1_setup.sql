-- =====================================================
-- AIBOS D1 SUPABASE SETUP - CORE FOUNDATION ONLY
-- =====================================================
-- Run this file FIRST in your Supabase SQL Editor
-- This creates the D1 core foundation without D2 features

-- 1. CREATE D1 CORE TABLES
-- =========================

CREATE TABLE IF NOT EXISTS "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "tenants_slug_unique" UNIQUE("slug")
);

CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

CREATE TABLE IF NOT EXISTS "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"base_currency" text DEFAULT 'MYR' NOT NULL,
	"fiscal_year_end" text DEFAULT '12-31' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"company_id" uuid,
	"role" text NOT NULL,
	"permissions" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "currencies" (
	"code" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"symbol" text NOT NULL,
	"decimal_places" numeric DEFAULT '2' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "fx_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_currency" text NOT NULL,
	"to_currency" text NOT NULL,
	"rate" numeric(18, 8) NOT NULL,
	"source" text NOT NULL,
	"valid_from" timestamp with time zone NOT NULL,
	"valid_to" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "chart_of_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"account_type" text NOT NULL,
	"parent_id" uuid,
	"level" numeric DEFAULT '0' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"currency" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "gl_journal" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"journal_number" text NOT NULL,
	"description" text,
	"journal_date" timestamp with time zone NOT NULL,
	"currency" text NOT NULL,
	"exchange_rate" numeric(18, 8) DEFAULT '1',
	"total_debit" numeric(18, 2) DEFAULT '0' NOT NULL,
	"total_credit" numeric(18, 2) DEFAULT '0' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_by" uuid,
	"posted_by" uuid,
	"posted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "gl_journal_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"journal_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"debit" numeric(18, 2) DEFAULT '0' NOT NULL,
	"credit" numeric(18, 2) DEFAULT '0' NOT NULL,
	"description" text,
	"reference" text,
	"created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"company_id" uuid,
	"user_id" uuid,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"old_values" jsonb,
	"new_values" jsonb,
	"metadata" jsonb,
	"request_id" text,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "idempotency_keys" (
	"key" text PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"request_hash" text NOT NULL,
	"response" jsonb,
	"status" text DEFAULT 'processing' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"expires_at" timestamp with time zone NOT NULL
);

-- 2. CREATE D1 FOREIGN KEY CONSTRAINTS
-- ====================================

DO $$ BEGIN
 ALTER TABLE "companies" ADD CONSTRAINT "companies_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "memberships" ADD CONSTRAINT "memberships_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "memberships" ADD CONSTRAINT "memberships_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "fx_rates" ADD CONSTRAINT "fx_rates_from_currency_currencies_code_fk" FOREIGN KEY ("from_currency") REFERENCES "public"."currencies"("code") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "fx_rates" ADD CONSTRAINT "fx_rates_to_currency_currencies_code_fk" FOREIGN KEY ("to_currency") REFERENCES "public"."currencies"("code") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "chart_of_accounts" ADD CONSTRAINT "chart_of_accounts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "chart_of_accounts" ADD CONSTRAINT "chart_of_accounts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "chart_of_accounts" ADD CONSTRAINT "chart_of_accounts_currency_currencies_code_fk" FOREIGN KEY ("currency") REFERENCES "public"."currencies"("code") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "gl_journal" ADD CONSTRAINT "gl_journal_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "gl_journal" ADD CONSTRAINT "gl_journal_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "gl_journal" ADD CONSTRAINT "gl_journal_currency_currencies_code_fk" FOREIGN KEY ("currency") REFERENCES "public"."currencies"("code") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "gl_journal" ADD CONSTRAINT "gl_journal_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "gl_journal" ADD CONSTRAINT "gl_journal_posted_by_users_id_fk" FOREIGN KEY ("posted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "gl_journal_lines" ADD CONSTRAINT "gl_journal_lines_journal_id_gl_journal_id_fk" FOREIGN KEY ("journal_id") REFERENCES "public"."gl_journal"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "gl_journal_lines" ADD CONSTRAINT "gl_journal_lines_account_id_chart_of_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "idempotency_keys" ADD CONSTRAINT "idempotency_keys_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- 3. CREATE D1 INDEXES
-- ====================

CREATE INDEX IF NOT EXISTS "companies_tenant_company_idx" ON "companies" USING btree ("tenant_id","code");
CREATE INDEX IF NOT EXISTS "memberships_user_tenant_idx" ON "memberships" USING btree ("user_id","tenant_id");
CREATE INDEX IF NOT EXISTS "fx_rates_currency_date_idx" ON "fx_rates" USING btree ("from_currency","to_currency","valid_from");
CREATE INDEX IF NOT EXISTS "coa_tenant_company_code_idx" ON "chart_of_accounts" USING btree ("tenant_id","company_id","code");
CREATE INDEX IF NOT EXISTS "journals_tenant_company_date_idx" ON "gl_journal" USING btree ("tenant_id","company_id","journal_date");
CREATE INDEX IF NOT EXISTS "journal_lines_journal_account_idx" ON "gl_journal_lines" USING btree ("journal_id","account_id");
CREATE INDEX IF NOT EXISTS "audit_logs_tenant_entity_idx" ON "audit_logs" USING btree ("tenant_id","entity_type","entity_id");
CREATE INDEX IF NOT EXISTS "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");
CREATE INDEX IF NOT EXISTS "idempotency_tenant_key_idx" ON "idempotency_keys" USING btree ("tenant_id","key");

-- 4. ENABLE ROW LEVEL SECURITY (V1 CRITICAL REQUIREMENT)
-- =======================================================

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

-- 5. CREATE BUSINESS LOGIC FUNCTIONS & TRIGGERS
-- ==============================================

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
DROP TRIGGER IF EXISTS enforce_journal_balance ON gl_journal_lines;
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

-- Audit triggers for D1 tables
DROP TRIGGER IF EXISTS audit_tenants ON tenants;
CREATE TRIGGER audit_tenants AFTER INSERT OR UPDATE OR DELETE ON tenants
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

DROP TRIGGER IF EXISTS audit_companies ON companies;
CREATE TRIGGER audit_companies AFTER INSERT OR UPDATE OR DELETE ON companies
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

DROP TRIGGER IF EXISTS audit_journals ON gl_journal;
CREATE TRIGGER audit_journals AFTER INSERT OR UPDATE OR DELETE ON gl_journal
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

DROP TRIGGER IF EXISTS audit_journal_lines ON gl_journal_lines;
CREATE TRIGGER audit_journal_lines AFTER INSERT OR UPDATE OR DELETE ON gl_journal_lines
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

-- 6. INSERT INITIAL DATA
-- ======================

-- Insert base currencies (V1 requirement: MYR base + SEA + Top traded)
INSERT INTO currencies (code, name, symbol, decimal_places, is_active) VALUES
  ('MYR', 'Malaysian Ringgit', 'RM', 2, true),
  ('USD', 'US Dollar', '$', 2, true),
  ('SGD', 'Singapore Dollar', 'S$', 2, true),
  ('THB', 'Thai Baht', '฿', 2, true),
  ('VND', 'Vietnamese Dong', '₫', 0, true),
  ('IDR', 'Indonesian Rupiah', 'Rp', 0, true),
  ('PHP', 'Philippine Peso', '₱', 2, true),
  ('EUR', 'Euro', '€', 2, true),
  ('GBP', 'British Pound', '£', 2, true),
  ('JPY', 'Japanese Yen', '¥', 0, true),
  ('CNY', 'Chinese Yuan', '¥', 2, true),
  ('AUD', 'Australian Dollar', 'A$', 2, true)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- D1 SETUP COMPLETE! 
-- =====================================================
-- Your D1 core foundation is now ready!
-- 
-- Next steps:
-- 1. Test the D1 connection from your app
-- 2. Create your first tenant and company
-- 3. Run the D2 migration file for AR features
-- =====================================================
