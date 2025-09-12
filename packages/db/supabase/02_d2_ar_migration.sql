-- =====================================================
-- AIBOS D2 MIGRATION - ACCOUNTS RECEIVABLE FEATURES
-- =====================================================
-- Run this file AFTER 01_d1_setup.sql
-- This adds D2 AR (Accounts Receivable) functionality

-- PREREQUISITES CHECK
-- ===================
-- Verify D1 tables exist before proceeding
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants') THEN
    RAISE EXCEPTION 'D1 setup required: Please run 01_d1_setup.sql first';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies') THEN
    RAISE EXCEPTION 'D1 setup required: Please run 01_d1_setup.sql first';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chart_of_accounts') THEN
    RAISE EXCEPTION 'D1 setup required: Please run 01_d1_setup.sql first';
  END IF;
END $$;

-- 1. CREATE D2 AR TABLES
-- ======================

CREATE TABLE IF NOT EXISTS "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"customer_number" text NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"billing_address" jsonb,
	"shipping_address" jsonb,
	"currency" text NOT NULL,
	"payment_terms" text DEFAULT 'NET_30' NOT NULL,
	"credit_limit" numeric(18, 2) DEFAULT '0',
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "ar_invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"invoice_number" text NOT NULL,
	"invoice_date" timestamp with time zone NOT NULL,
	"due_date" timestamp with time zone NOT NULL,
	"currency" text NOT NULL,
	"exchange_rate" numeric(18, 8) DEFAULT '1',
	"subtotal" numeric(18, 2) DEFAULT '0' NOT NULL,
	"tax_amount" numeric(18, 2) DEFAULT '0' NOT NULL,
	"total_amount" numeric(18, 2) DEFAULT '0' NOT NULL,
	"paid_amount" numeric(18, 2) DEFAULT '0' NOT NULL,
	"balance_amount" numeric(18, 2) DEFAULT '0' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"description" text,
	"notes" text,
	"journal_id" uuid,
	"created_by" uuid,
	"posted_by" uuid,
	"posted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "ar_invoice_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"line_number" numeric NOT NULL,
	"description" text NOT NULL,
	"quantity" numeric(18, 4) DEFAULT '1' NOT NULL,
	"unit_price" numeric(18, 4) NOT NULL,
	"line_amount" numeric(18, 2) NOT NULL,
	"tax_code" text,
	"tax_rate" numeric(5, 4) DEFAULT '0',
	"tax_amount" numeric(18, 2) DEFAULT '0' NOT NULL,
	"revenue_account_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "tax_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"rate" numeric(5, 4) NOT NULL,
	"tax_type" text NOT NULL,
	"tax_account_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);

-- 2. CREATE D2 FOREIGN KEY CONSTRAINTS
-- ====================================

DO $$ BEGIN
 ALTER TABLE "customers" ADD CONSTRAINT "customers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "customers" ADD CONSTRAINT "customers_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "customers" ADD CONSTRAINT "customers_currency_currencies_code_fk" FOREIGN KEY ("currency") REFERENCES "public"."currencies"("code") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "ar_invoices" ADD CONSTRAINT "ar_invoices_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "ar_invoices" ADD CONSTRAINT "ar_invoices_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "ar_invoices" ADD CONSTRAINT "ar_invoices_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "ar_invoices" ADD CONSTRAINT "ar_invoices_currency_currencies_code_fk" FOREIGN KEY ("currency") REFERENCES "public"."currencies"("code") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "ar_invoices" ADD CONSTRAINT "ar_invoices_journal_id_gl_journal_id_fk" FOREIGN KEY ("journal_id") REFERENCES "public"."gl_journal"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "ar_invoices" ADD CONSTRAINT "ar_invoices_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "ar_invoices" ADD CONSTRAINT "ar_invoices_posted_by_users_id_fk" FOREIGN KEY ("posted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "ar_invoice_lines" ADD CONSTRAINT "ar_invoice_lines_invoice_id_ar_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."ar_invoices"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "ar_invoice_lines" ADD CONSTRAINT "ar_invoice_lines_revenue_account_id_chart_of_accounts_id_fk" FOREIGN KEY ("revenue_account_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "tax_codes" ADD CONSTRAINT "tax_codes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "tax_codes" ADD CONSTRAINT "tax_codes_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "tax_codes" ADD CONSTRAINT "tax_codes_tax_account_id_chart_of_accounts_id_fk" FOREIGN KEY ("tax_account_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- 3. CREATE D2 INDEXES
-- ====================

CREATE INDEX IF NOT EXISTS "customers_tenant_company_number_idx" ON "customers" USING btree ("tenant_id","company_id","customer_number");
CREATE INDEX IF NOT EXISTS "customers_tenant_company_email_idx" ON "customers" USING btree ("tenant_id","company_id","email");
CREATE INDEX IF NOT EXISTS "invoices_tenant_company_number_idx" ON "ar_invoices" USING btree ("tenant_id","company_id","invoice_number");
CREATE INDEX IF NOT EXISTS "invoices_tenant_company_customer_idx" ON "ar_invoices" USING btree ("tenant_id","company_id","customer_id");
CREATE INDEX IF NOT EXISTS "invoices_tenant_company_date_idx" ON "ar_invoices" USING btree ("tenant_id","company_id","invoice_date");
CREATE INDEX IF NOT EXISTS "invoices_status_idx" ON "ar_invoices" USING btree ("status");
CREATE INDEX IF NOT EXISTS "invoices_due_date_idx" ON "ar_invoices" USING btree ("due_date");
CREATE INDEX IF NOT EXISTS "invoice_lines_invoice_line_idx" ON "ar_invoice_lines" USING btree ("invoice_id","line_number");
CREATE INDEX IF NOT EXISTS "tax_codes_tenant_company_code_idx" ON "tax_codes" USING btree ("tenant_id","company_id","code");

-- 4. ENABLE ROW LEVEL SECURITY FOR D2 TABLES
-- ===========================================

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY customers_tenant_scope ON customers FOR ALL USING (
  tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
);

ALTER TABLE ar_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY invoices_tenant_scope ON ar_invoices FOR ALL USING (
  tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
);

ALTER TABLE ar_invoice_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY invoice_lines_tenant_scope ON ar_invoice_lines FOR ALL USING (
  EXISTS (
    SELECT 1 FROM ar_invoices 
    WHERE ar_invoices.id = ar_invoice_lines.invoice_id 
    AND ar_invoices.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  )
);

ALTER TABLE tax_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY tax_codes_tenant_scope ON tax_codes FOR ALL USING (
  tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
);

-- 5. CREATE D2 BUSINESS LOGIC FUNCTIONS
-- =====================================

-- Function to validate invoice totals
CREATE OR REPLACE FUNCTION validate_invoice_totals()
RETURNS TRIGGER AS $$
DECLARE
  calculated_subtotal numeric(18,2);
  calculated_tax numeric(18,2);
  calculated_total numeric(18,2);
  target_invoice_id uuid;
BEGIN
  -- Get the invoice ID (works for INSERT, UPDATE, and DELETE)
  target_invoice_id := COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  -- Calculate totals from invoice lines
  SELECT 
    COALESCE(SUM(line_amount), 0),
    COALESCE(SUM(tax_amount), 0)
  INTO calculated_subtotal, calculated_tax
  FROM ar_invoice_lines 
  WHERE invoice_id = target_invoice_id;
  
  calculated_total := calculated_subtotal + calculated_tax;
  
  -- Update invoice totals
  UPDATE ar_invoices 
  SET 
    subtotal = calculated_subtotal,
    tax_amount = calculated_tax,
    total_amount = calculated_total,
    balance_amount = calculated_total - paid_amount,
    updated_at = now()
  WHERE id = target_invoice_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to update invoice balance when payments are made
CREATE OR REPLACE FUNCTION update_invoice_balance()
RETURNS TRIGGER AS $$
BEGIN
  NEW.balance_amount := NEW.total_amount - NEW.paid_amount;
  
  -- Update status based on balance
  IF NEW.balance_amount <= 0 THEN
    NEW.status := 'paid';
  ELSIF NEW.paid_amount > 0 THEN
    NEW.status := 'partial';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. CREATE D2 TRIGGERS
-- =====================

-- Trigger to recalculate invoice totals when lines change
DROP TRIGGER IF EXISTS recalculate_invoice_totals ON ar_invoice_lines;
CREATE TRIGGER recalculate_invoice_totals
  AFTER INSERT OR UPDATE OR DELETE ON ar_invoice_lines
  FOR EACH ROW
  EXECUTE FUNCTION validate_invoice_totals();

-- Trigger to update invoice balance
DROP TRIGGER IF EXISTS update_balance_on_payment ON ar_invoices;
CREATE TRIGGER update_balance_on_payment
  BEFORE UPDATE ON ar_invoices
  FOR EACH ROW
  WHEN (OLD.paid_amount IS DISTINCT FROM NEW.paid_amount)
  EXECUTE FUNCTION update_invoice_balance();

-- Add audit triggers for D2 tables
DROP TRIGGER IF EXISTS audit_customers ON customers;
CREATE TRIGGER audit_customers AFTER INSERT OR UPDATE OR DELETE ON customers
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

DROP TRIGGER IF EXISTS audit_ar_invoices ON ar_invoices;
CREATE TRIGGER audit_ar_invoices AFTER INSERT OR UPDATE OR DELETE ON ar_invoices
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

DROP TRIGGER IF EXISTS audit_ar_invoice_lines ON ar_invoice_lines;
CREATE TRIGGER audit_ar_invoice_lines AFTER INSERT OR UPDATE OR DELETE ON ar_invoice_lines
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

DROP TRIGGER IF EXISTS audit_tax_codes ON tax_codes;
CREATE TRIGGER audit_tax_codes AFTER INSERT OR UPDATE OR DELETE ON tax_codes
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

-- 7. INSERT D2 INITIAL DATA
-- =========================

-- Insert common tax codes (can be customized per tenant/company)
-- Note: These are examples - actual tax codes should be configured per company
INSERT INTO tax_codes (tenant_id, company_id, code, name, rate, tax_type, tax_account_id) 
SELECT 
  t.id as tenant_id,
  c.id as company_id,
  'GST' as code,
  'Goods and Services Tax (6%)' as name,
  0.06 as rate,
  'OUTPUT_TAX' as tax_type,
  coa.id as tax_account_id
FROM tenants t
CROSS JOIN companies c
LEFT JOIN chart_of_accounts coa ON coa.tenant_id = t.id 
  AND coa.company_id = c.id 
  AND coa.account_type = 'LIABILITY'
  AND coa.name ILIKE '%tax%'
WHERE c.tenant_id = t.id
  AND coa.id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Insert zero-rate tax code
INSERT INTO tax_codes (tenant_id, company_id, code, name, rate, tax_type, tax_account_id) 
SELECT 
  t.id as tenant_id,
  c.id as company_id,
  'ZERO' as code,
  'Zero Rated' as name,
  0.00 as rate,
  'ZERO_RATED' as tax_type,
  coa.id as tax_account_id
FROM tenants t
CROSS JOIN companies c
LEFT JOIN chart_of_accounts coa ON coa.tenant_id = t.id 
  AND coa.company_id = c.id 
  AND coa.account_type = 'LIABILITY'
  AND coa.name ILIKE '%tax%'
WHERE c.tenant_id = t.id
  AND coa.id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 8. CREATE D2 VALIDATION CONSTRAINTS
-- ===================================

-- Ensure invoice numbers are unique per tenant/company
DO $$ BEGIN
  ALTER TABLE ar_invoices 
  ADD CONSTRAINT ar_invoices_unique_number_per_company 
  UNIQUE (tenant_id, company_id, invoice_number);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Ensure customer numbers are unique per tenant/company
DO $$ BEGIN
  ALTER TABLE customers 
  ADD CONSTRAINT customers_unique_number_per_company 
  UNIQUE (tenant_id, company_id, customer_number);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Ensure tax codes are unique per tenant/company
DO $$ BEGIN
  ALTER TABLE tax_codes 
  ADD CONSTRAINT tax_codes_unique_code_per_company 
  UNIQUE (tenant_id, company_id, code);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Ensure line numbers are unique per invoice
DO $$ BEGIN
  ALTER TABLE ar_invoice_lines 
  ADD CONSTRAINT invoice_lines_unique_line_per_invoice 
  UNIQUE (invoice_id, line_number);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Ensure positive amounts
DO $$ BEGIN
  ALTER TABLE ar_invoices 
  ADD CONSTRAINT ar_invoices_positive_amounts 
  CHECK (subtotal >= 0 AND tax_amount >= 0 AND total_amount >= 0 AND paid_amount >= 0);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE ar_invoice_lines 
  ADD CONSTRAINT invoice_lines_positive_amounts 
  CHECK (quantity > 0 AND unit_price >= 0 AND line_amount >= 0 AND tax_amount >= 0);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Ensure valid tax rates
DO $$ BEGIN
  ALTER TABLE tax_codes 
  ADD CONSTRAINT tax_codes_valid_rate 
  CHECK (rate >= 0 AND rate <= 1);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- D2 MIGRATION COMPLETE! 
-- =====================================================
-- Your D2 AR (Accounts Receivable) features are now ready!
-- 
-- Features added:
-- ✅ Customer management
-- ✅ AR invoice creation and posting
-- ✅ Multi-line invoices with tax calculations
-- ✅ Tax code management
-- ✅ Automatic total calculations
-- ✅ Balance tracking
-- ✅ Full audit trail
-- ✅ RLS security
-- 
-- Next steps:
-- 1. Test AR invoice creation via API
-- 2. Verify GL posting functionality
-- 3. Set up tax codes for your companies
-- =====================================================
