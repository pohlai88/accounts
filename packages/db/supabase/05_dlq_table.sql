-- =====================================================
-- DEAD LETTER QUEUE TABLE FOR INNGEST JOBS
-- =====================================================
-- Run this in Supabase SQL Editor after the main setup

-- Create DLQ table for failed job tracking
CREATE TABLE IF NOT EXISTS "dead_letter_queue" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "function_id" text NOT NULL,
  "run_id" text NOT NULL,
  "original_event" jsonb NOT NULL,
  "error_message" text NOT NULL,
  "error_stack" text,
  "attempt_count" integer NOT NULL DEFAULT 1,
  "retry_count" integer NOT NULL DEFAULT 0,
  "status" text NOT NULL DEFAULT 'failed' CHECK (status IN ('failed', 'retrying', 'manual_review', 'resolved')),
  "recovery_action" text,
  "tenant_id" uuid,
  "company_id" uuid,
  "failed_at" timestamp with time zone NOT NULL DEFAULT now(),
  "last_retry_at" timestamp with time zone,
  "resolved_at" timestamp with time zone,
  "resolved_by" uuid,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS "dlq_function_id_idx" ON "dead_letter_queue" ("function_id");
CREATE INDEX IF NOT EXISTS "dlq_status_idx" ON "dead_letter_queue" ("status");
CREATE INDEX IF NOT EXISTS "dlq_tenant_idx" ON "dead_letter_queue" ("tenant_id");
CREATE INDEX IF NOT EXISTS "dlq_failed_at_idx" ON "dead_letter_queue" ("failed_at" DESC);

-- Enable RLS
ALTER TABLE "dead_letter_queue" ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "dlq_tenant_scope" ON "dead_letter_queue"
  FOR ALL USING (
    tenant_id IS NULL OR 
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid OR
    (auth.jwt() ->> 'role') = 'admin'
  );

-- Add foreign key constraints
DO $$ BEGIN
  ALTER TABLE "dead_letter_queue" 
    ADD CONSTRAINT "dlq_tenant_id_fk" 
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "dead_letter_queue" 
    ADD CONSTRAINT "dlq_company_id_fk" 
    FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "dead_letter_queue" 
    ADD CONSTRAINT "dlq_resolved_by_fk" 
    FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Add updated_at trigger
DROP TRIGGER IF EXISTS _set_updated_at_dlq ON dead_letter_queue;
CREATE TRIGGER _set_updated_at_dlq
  BEFORE UPDATE ON dead_letter_queue 
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Add audit trigger
DROP TRIGGER IF EXISTS audit_dlq ON dead_letter_queue;
CREATE TRIGGER audit_dlq 
  AFTER INSERT OR UPDATE OR DELETE ON dead_letter_queue
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

-- Helper function to increment retry count
CREATE OR REPLACE FUNCTION increment_retry_count(dlq_id uuid)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  new_count integer;
BEGIN
  UPDATE dead_letter_queue 
  SET retry_count = retry_count + 1
  WHERE id = dlq_id
  RETURNING retry_count INTO new_count;
  
  RETURN new_count;
END; $$;

-- =====================================================
-- DLQ TABLE SETUP COMPLETE!
-- =====================================================
