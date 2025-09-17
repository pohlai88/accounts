-- =====================================================
-- AIBOS D3 MIGRATION - ACCOUNTS PAYABLE FEATURES
-- =====================================================
-- Run this file AFTER 01_d1_setup.sql AND 02_d2_ar_migration.sql
-- This adds D3 AP (Accounts Payable) functionality

-- PREREQUISITES CHECK
-- ===================
-- Verify D1 and D2 tables exist before proceeding
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants') THEN
    RAISE EXCEPTION 'D1 setup required: Please run 01_d1_setup.sql first';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies') THEN
    RAISE EXCEPTION 'D1 setup required: Please run 01_d1_setup.sql first';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers') THEN
    RAISE EXCEPTION 'D2 setup required: Please run 02_d2_ar_migration.sql first';
  END IF;
END $$;

-- 1. CREATE D3 AP TABLES
-- ======================

CREATE TABLE IF NOT EXISTS "suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"supplier_number" text NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"billing_address" jsonb,
	"shipping_address" jsonb,
	"currency" text NOT NULL,
	"payment_terms" text DEFAULT 'NET_30' NOT NULL,
	"credit_limit" numeric(18, 2) DEFAULT '0',
	"tax_id" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "ap_bills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"bill_number" text NOT NULL,
	"supplier_invoice_number" text,
	"bill_date" timestamp with time zone NOT NULL,
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

CREATE TABLE IF NOT EXISTS "ap_bill_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bill_id" uuid NOT NULL,
	"line_number" numeric NOT NULL,
	"description" text NOT NULL,
	"quantity" numeric(18, 4) DEFAULT '1' NOT NULL,
	"unit_price" numeric(18, 4) NOT NULL,
	"line_amount" numeric(18, 2) NOT NULL,
	"tax_code" text,
	"tax_rate" numeric(5, 4) DEFAULT '0',
	"tax_amount" numeric(18, 2) DEFAULT '0' NOT NULL,
	"expense_account_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "bank_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"account_number" text NOT NULL,
	"account_name" text NOT NULL,
	"bank_name" text NOT NULL,
	"currency" text NOT NULL,
	"account_type" text DEFAULT 'CHECKING' NOT NULL,
	"gl_account_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "bank_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bank_account_id" uuid NOT NULL,
	"transaction_date" timestamp with time zone NOT NULL,
	"description" text NOT NULL,
	"reference" text,
	"debit_amount" numeric(18, 2) DEFAULT '0' NOT NULL,
	"credit_amount" numeric(18, 2) DEFAULT '0' NOT NULL,
	"balance" numeric(18, 2),
	"transaction_type" text,
	"is_matched" boolean DEFAULT false NOT NULL,
	"matched_payment_id" uuid,
	"import_batch_id" text,
	"created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"payment_number" text NOT NULL,
	"payment_date" timestamp with time zone NOT NULL,
	"payment_method" text NOT NULL,
	"bank_account_id" uuid NOT NULL,
	"supplier_id" uuid,
	"customer_id" uuid,
	"currency" text NOT NULL,
	"exchange_rate" numeric(18, 8) DEFAULT '1',
	"amount" numeric(18, 2) NOT NULL,
	"reference" text,
	"description" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"journal_id" uuid,
	"created_by" uuid,
	"posted_by" uuid,
	"posted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "payment_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"bill_id" uuid,
	"invoice_id" uuid,
	"allocated_amount" numeric(18, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);

-- 2. CREATE D3 FOREIGN KEY CONSTRAINTS
-- ====================================

DO $$ BEGIN
 ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_currency_currencies_code_fk" FOREIGN KEY ("currency") REFERENCES "public"."currencies"("code") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "ap_bills" ADD CONSTRAINT "ap_bills_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "ap_bills" ADD CONSTRAINT "ap_bills_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "ap_bills" ADD CONSTRAINT "ap_bills_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "ap_bills" ADD CONSTRAINT "ap_bills_currency_currencies_code_fk" FOREIGN KEY ("currency") REFERENCES "public"."currencies"("code") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "ap_bills" ADD CONSTRAINT "ap_bills_journal_id_gl_journal_id_fk" FOREIGN KEY ("journal_id") REFERENCES "public"."gl_journal"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "ap_bills" ADD CONSTRAINT "ap_bills_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "ap_bills" ADD CONSTRAINT "ap_bills_posted_by_users_id_fk" FOREIGN KEY ("posted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "ap_bill_lines" ADD CONSTRAINT "ap_bill_lines_bill_id_ap_bills_id_fk" FOREIGN KEY ("bill_id") REFERENCES "public"."ap_bills"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "ap_bill_lines" ADD CONSTRAINT "ap_bill_lines_expense_account_id_chart_of_accounts_id_fk" FOREIGN KEY ("expense_account_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_currency_currencies_code_fk" FOREIGN KEY ("currency") REFERENCES "public"."currencies"("code") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_gl_account_id_chart_of_accounts_id_fk" FOREIGN KEY ("gl_account_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_bank_account_id_bank_accounts_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "public"."bank_accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_matched_payment_id_payments_id_fk" FOREIGN KEY ("matched_payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "payments" ADD CONSTRAINT "payments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "payments" ADD CONSTRAINT "payments_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "payments" ADD CONSTRAINT "payments_bank_account_id_bank_accounts_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "public"."bank_accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "payments" ADD CONSTRAINT "payments_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "payments" ADD CONSTRAINT "payments_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "payments" ADD CONSTRAINT "payments_currency_currencies_code_fk" FOREIGN KEY ("currency") REFERENCES "public"."currencies"("code") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "payments" ADD CONSTRAINT "payments_journal_id_gl_journal_id_fk" FOREIGN KEY ("journal_id") REFERENCES "public"."gl_journal"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "payments" ADD CONSTRAINT "payments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "payments" ADD CONSTRAINT "payments_posted_by_users_id_fk" FOREIGN KEY ("posted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_bill_id_ap_bills_id_fk" FOREIGN KEY ("bill_id") REFERENCES "public"."ap_bills"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_invoice_id_ar_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."ar_invoices"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- 3. CREATE D3 INDEXES
-- ====================

CREATE INDEX IF NOT EXISTS "suppliers_tenant_company_number_idx" ON "suppliers" USING btree ("tenant_id","company_id","supplier_number");
CREATE INDEX IF NOT EXISTS "suppliers_tenant_company_email_idx" ON "suppliers" USING btree ("tenant_id","company_id","email");
CREATE INDEX IF NOT EXISTS "bills_tenant_company_number_idx" ON "ap_bills" USING btree ("tenant_id","company_id","bill_number");
CREATE INDEX IF NOT EXISTS "bills_tenant_company_supplier_idx" ON "ap_bills" USING btree ("tenant_id","company_id","supplier_id");
CREATE INDEX IF NOT EXISTS "bills_tenant_company_date_idx" ON "ap_bills" USING btree ("tenant_id","company_id","bill_date");
CREATE INDEX IF NOT EXISTS "bills_status_idx" ON "ap_bills" USING btree ("status");
CREATE INDEX IF NOT EXISTS "bills_due_date_idx" ON "ap_bills" USING btree ("due_date");
CREATE INDEX IF NOT EXISTS "bill_lines_bill_line_idx" ON "ap_bill_lines" USING btree ("bill_id","line_number");
CREATE INDEX IF NOT EXISTS "bank_accounts_tenant_company_idx" ON "bank_accounts" USING btree ("tenant_id","company_id");
CREATE INDEX IF NOT EXISTS "bank_transactions_account_date_idx" ON "bank_transactions" USING btree ("bank_account_id","transaction_date");
CREATE INDEX IF NOT EXISTS "bank_transactions_matched_idx" ON "bank_transactions" USING btree ("is_matched");
CREATE INDEX IF NOT EXISTS "payments_tenant_company_number_idx" ON "payments" USING btree ("tenant_id","company_id","payment_number");
CREATE INDEX IF NOT EXISTS "payments_tenant_company_date_idx" ON "payments" USING btree ("tenant_id","company_id","payment_date");
CREATE INDEX IF NOT EXISTS "payments_status_idx" ON "payments" USING btree ("status");
CREATE INDEX IF NOT EXISTS "payment_allocations_payment_idx" ON "payment_allocations" USING btree ("payment_id");

-- 4. ENABLE ROW LEVEL SECURITY FOR D3 TABLES
-- ===========================================

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY suppliers_tenant_scope ON suppliers FOR ALL USING (
  tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
);

ALTER TABLE ap_bills ENABLE ROW LEVEL SECURITY;
CREATE POLICY bills_tenant_scope ON ap_bills FOR ALL USING (
  tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
);

ALTER TABLE ap_bill_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY bill_lines_tenant_scope ON ap_bill_lines FOR ALL USING (
  EXISTS (
    SELECT 1 FROM ap_bills 
    WHERE ap_bills.id = ap_bill_lines.bill_id 
    AND ap_bills.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  )
);

ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY bank_accounts_tenant_scope ON bank_accounts FOR ALL USING (
  tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
);

ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY bank_transactions_tenant_scope ON bank_transactions FOR ALL USING (
  EXISTS (
    SELECT 1 FROM bank_accounts 
    WHERE bank_accounts.id = bank_transactions.bank_account_id 
    AND bank_accounts.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  )
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY payments_tenant_scope ON payments FOR ALL USING (
  tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
);

ALTER TABLE payment_allocations ENABLE ROW LEVEL SECURITY;
CREATE POLICY payment_allocations_tenant_scope ON payment_allocations FOR ALL USING (
  EXISTS (
    SELECT 1 FROM payments 
    WHERE payments.id = payment_allocations.payment_id 
    AND payments.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  )
);

-- 5. CREATE D3 BUSINESS LOGIC FUNCTIONS
-- =====================================

-- Function to validate bill totals
CREATE OR REPLACE FUNCTION validate_bill_totals()
RETURNS TRIGGER AS $$
DECLARE
  calculated_subtotal numeric(18,2);
  calculated_tax numeric(18,2);
  calculated_total numeric(18,2);
  target_bill_id uuid;
BEGIN
  -- Get the bill ID (works for INSERT, UPDATE, and DELETE)
  target_bill_id := COALESCE(NEW.bill_id, OLD.bill_id);
  
  -- Calculate totals from bill lines
  SELECT 
    COALESCE(SUM(line_amount), 0),
    COALESCE(SUM(tax_amount), 0)
  INTO calculated_subtotal, calculated_tax
  FROM ap_bill_lines 
  WHERE bill_id = target_bill_id;
  
  calculated_total := calculated_subtotal + calculated_tax;
  
  -- Update bill totals
  UPDATE ap_bills 
  SET 
    subtotal = calculated_subtotal,
    tax_amount = calculated_tax,
    total_amount = calculated_total,
    balance_amount = calculated_total - paid_amount,
    updated_at = now()
  WHERE id = target_bill_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to update bill balance when payments are made
CREATE OR REPLACE FUNCTION update_bill_balance()
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

-- Function to update payment allocations
CREATE OR REPLACE FUNCTION update_payment_allocations()
RETURNS TRIGGER AS $$
DECLARE
  total_allocated numeric(18,2);
BEGIN
  -- Calculate total allocated amount for this payment
  SELECT COALESCE(SUM(allocated_amount), 0)
  INTO total_allocated
  FROM payment_allocations
  WHERE payment_id = COALESCE(NEW.payment_id, OLD.payment_id);
  
  -- Update the payment amount if it doesn't match allocations
  UPDATE payments
  SET amount = total_allocated
  WHERE id = COALESCE(NEW.payment_id, OLD.payment_id)
    AND amount != total_allocated;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 6. CREATE D3 TRIGGERS
-- =====================

-- Trigger to recalculate bill totals when lines change
DROP TRIGGER IF EXISTS recalculate_bill_totals ON ap_bill_lines;
CREATE TRIGGER recalculate_bill_totals
  AFTER INSERT OR UPDATE OR DELETE ON ap_bill_lines
  FOR EACH ROW
  EXECUTE FUNCTION validate_bill_totals();

-- Trigger to update bill balance
DROP TRIGGER IF EXISTS update_balance_on_payment ON ap_bills;
CREATE TRIGGER update_balance_on_payment
  BEFORE UPDATE ON ap_bills
  FOR EACH ROW
  WHEN (OLD.paid_amount IS DISTINCT FROM NEW.paid_amount)
  EXECUTE FUNCTION update_bill_balance();

-- Trigger to update payment allocations
DROP TRIGGER IF EXISTS update_allocations ON payment_allocations;
CREATE TRIGGER update_allocations
  AFTER INSERT OR UPDATE OR DELETE ON payment_allocations
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_allocations();

-- Add audit triggers for D3 tables
DROP TRIGGER IF EXISTS audit_suppliers ON suppliers;
CREATE TRIGGER audit_suppliers AFTER INSERT OR UPDATE OR DELETE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

DROP TRIGGER IF EXISTS audit_ap_bills ON ap_bills;
CREATE TRIGGER audit_ap_bills AFTER INSERT OR UPDATE OR DELETE ON ap_bills
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

DROP TRIGGER IF EXISTS audit_ap_bill_lines ON ap_bill_lines;
CREATE TRIGGER audit_ap_bill_lines AFTER INSERT OR UPDATE OR DELETE ON ap_bill_lines
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

DROP TRIGGER IF EXISTS audit_payments ON payments;
CREATE TRIGGER audit_payments AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

DROP TRIGGER IF EXISTS audit_bank_accounts ON bank_accounts;
CREATE TRIGGER audit_bank_accounts AFTER INSERT OR UPDATE OR DELETE ON bank_accounts
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

-- 7. CREATE D3 VALIDATION CONSTRAINTS
-- ===================================

-- Ensure bill numbers are unique per tenant/company
DO $$ BEGIN
  ALTER TABLE ap_bills 
  ADD CONSTRAINT ap_bills_unique_number_per_company 
  UNIQUE (tenant_id, company_id, bill_number);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Ensure supplier numbers are unique per tenant/company
DO $$ BEGIN
  ALTER TABLE suppliers 
  ADD CONSTRAINT suppliers_unique_number_per_company 
  UNIQUE (tenant_id, company_id, supplier_number);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Ensure payment numbers are unique per tenant/company
DO $$ BEGIN
  ALTER TABLE payments 
  ADD CONSTRAINT payments_unique_number_per_company 
  UNIQUE (tenant_id, company_id, payment_number);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Ensure bank account numbers are unique per tenant/company
DO $$ BEGIN
  ALTER TABLE bank_accounts 
  ADD CONSTRAINT bank_accounts_unique_number_per_company 
  UNIQUE (tenant_id, company_id, account_number);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Ensure line numbers are unique per bill
DO $$ BEGIN
  ALTER TABLE ap_bill_lines 
  ADD CONSTRAINT bill_lines_unique_line_per_bill 
  UNIQUE (bill_id, line_number);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Ensure positive amounts
DO $$ BEGIN
  ALTER TABLE ap_bills 
  ADD CONSTRAINT ap_bills_positive_amounts 
  CHECK (subtotal >= 0 AND tax_amount >= 0 AND total_amount >= 0 AND paid_amount >= 0);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE ap_bill_lines 
  ADD CONSTRAINT bill_lines_positive_amounts 
  CHECK (quantity > 0 AND unit_price >= 0 AND line_amount >= 0 AND tax_amount >= 0);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE payments 
  ADD CONSTRAINT payments_positive_amount 
  CHECK (amount > 0);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Ensure valid payment methods
DO $$ BEGIN
  ALTER TABLE payments 
  ADD CONSTRAINT payments_valid_method 
  CHECK (payment_method IN ('BANK_TRANSFER', 'CHECK', 'CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'OTHER'));
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Ensure valid bank account types
DO $$ BEGIN
  ALTER TABLE bank_accounts 
  ADD CONSTRAINT bank_accounts_valid_type 
  CHECK (account_type IN ('CHECKING', 'SAVINGS', 'CREDIT_LINE', 'OTHER'));
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- D3 MIGRATION COMPLETE! 
-- =====================================================
-- Your D3 AP (Accounts Payable) features are now ready!
-- 
-- Features added:
-- ✅ Supplier management
-- ✅ AP bill creation and posting
-- ✅ Multi-line bills with tax calculations
-- ✅ Payment processing with allocations
-- ✅ Bank account management
-- ✅ Bank transaction import framework
-- ✅ Automatic total calculations
-- ✅ Balance tracking
-- ✅ Full audit trail
-- ✅ RLS security
-- 
-- Next steps:
-- 1. Test AP bill creation via API
-- 2. Verify GL posting functionality
-- 3. Set up bank accounts for your companies
-- 4. Implement CSV import functionality
-- =====================================================
