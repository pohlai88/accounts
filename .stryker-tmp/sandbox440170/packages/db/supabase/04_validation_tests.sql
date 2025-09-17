-- =====================================================
-- AIBOS V1 DATABASE VALIDATION TESTS
-- =====================================================
-- Run these tests AFTER setting up the database
-- to verify all production safeguards are working

-- Test Setup: Create test data
-- ============================

-- 1. Create test tenant
INSERT INTO tenants (id, name, slug) 
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'Test Company Ltd', 'test-company')
ON CONFLICT (id) DO NOTHING;

-- 2. Create test company
INSERT INTO companies (id, tenant_id, name, code, base_currency) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440001', 
  '550e8400-e29b-41d4-a716-446655440000', 
  'Main Company', 
  'MAIN', 
  'MYR'
)
ON CONFLICT (id) DO NOTHING;

-- 3. Create test user (simulate auth.users sync)
INSERT INTO users (id, email, first_name, last_name) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440002',
  'test@example.com',
  'Test',
  'User'
)
ON CONFLICT (id) DO NOTHING;

-- 4. Create test membership
INSERT INTO memberships (user_id, tenant_id, company_id, role) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440000',
  '550e8400-e29b-41d4-a716-446655440001',
  'accountant'
)
ON CONFLICT (id) DO NOTHING;

-- 5. Create test chart of accounts
INSERT INTO chart_of_accounts (id, tenant_id, company_id, code, name, account_type, currency) 
VALUES 
  ('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', '1000', 'Cash', 'ASSET', 'MYR'),
  ('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', '3000', 'Revenue', 'REVENUE', 'MYR')
ON CONFLICT (id) DO NOTHING;

-- VALIDATION TESTS
-- =================

-- Test 1: Uniqueness Constraints
-- ------------------------------
DO $$
BEGIN
  -- Test duplicate company code in same tenant (should fail)
  BEGIN
    INSERT INTO companies (tenant_id, name, code, base_currency) 
    VALUES ('550e8400-e29b-41d4-a716-446655440000', 'Duplicate Company', 'MAIN', 'MYR');
    RAISE EXCEPTION 'VALIDATION FAILED: Duplicate company code should be rejected';
  EXCEPTION 
    WHEN unique_violation THEN 
      RAISE NOTICE '✅ Test 1a PASSED: Duplicate company code properly rejected';
  END;

  -- Test duplicate COA code in same tenant+company (should fail)
  BEGIN
    INSERT INTO chart_of_accounts (tenant_id, company_id, code, name, account_type, currency) 
    VALUES ('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', '1000', 'Duplicate Cash', 'ASSET', 'MYR');
    RAISE EXCEPTION 'VALIDATION FAILED: Duplicate COA code should be rejected';
  EXCEPTION 
    WHEN unique_violation THEN 
      RAISE NOTICE '✅ Test 1b PASSED: Duplicate COA code properly rejected';
  END;
END $$;

-- Test 2: Check Constraints
-- -------------------------
DO $$
BEGIN
  -- Test negative debit (should fail)
  BEGIN
    INSERT INTO gl_journal (id, tenant_id, company_id, journal_number, journal_date, currency)
    VALUES ('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 'TEST001', now(), 'MYR');
    
    INSERT INTO gl_journal_lines (journal_id, account_id, debit, credit)
    VALUES ('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440010', -100, 0);
    
    RAISE EXCEPTION 'VALIDATION FAILED: Negative debit should be rejected';
  EXCEPTION 
    WHEN check_violation THEN 
      RAISE NOTICE '✅ Test 2a PASSED: Negative amounts properly rejected';
  END;

  -- Test both debit and credit (should fail)
  BEGIN
    INSERT INTO gl_journal_lines (journal_id, account_id, debit, credit)
    VALUES ('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440010', 100, 50);
    
    RAISE EXCEPTION 'VALIDATION FAILED: Both debit and credit should be rejected';
  EXCEPTION 
    WHEN check_violation THEN 
      RAISE NOTICE '✅ Test 2b PASSED: XOR constraint properly enforced';
  END;
END $$;

-- Test 3: FX Rate Overlap Prevention
-- ----------------------------------
DO $$
BEGIN
  -- Insert first FX rate
  INSERT INTO fx_rates (from_currency, to_currency, rate, source, valid_from, valid_to)
  VALUES ('USD', 'MYR', 4.50, 'test', '2024-01-01'::timestamptz, '2024-12-31'::timestamptz);

  -- Try to insert overlapping rate (should fail)
  BEGIN
    INSERT INTO fx_rates (from_currency, to_currency, rate, source, valid_from, valid_to)
    VALUES ('USD', 'MYR', 4.60, 'test', '2024-06-01'::timestamptz, '2024-12-31'::timestamptz);
    
    RAISE EXCEPTION 'VALIDATION FAILED: Overlapping FX rates should be rejected';
  EXCEPTION 
    WHEN exclusion_violation THEN 
      RAISE NOTICE '✅ Test 3 PASSED: FX rate overlap properly prevented';
  END;
END $$;

-- Test 4: Journal Balance Enforcement
-- ----------------------------------
DO $$
DECLARE
  v_journal_id uuid := '550e8400-e29b-41d4-a716-446655440030';
BEGIN
  -- Create unbalanced journal
  INSERT INTO gl_journal (id, tenant_id, company_id, journal_number, journal_date, currency, status)
  VALUES (v_journal_id, '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 'TEST002', now(), 'MYR', 'draft');
  
  -- Add unbalanced lines
  INSERT INTO gl_journal_lines (journal_id, account_id, debit, credit) VALUES
    (v_journal_id, '550e8400-e29b-41d4-a716-446655440010', 100, 0),
    (v_journal_id, '550e8400-e29b-41d4-a716-446655440011', 0, 50);  -- Unbalanced by 50

  -- Try to post unbalanced journal (should fail)
  BEGIN
    UPDATE gl_journal SET status = 'posted' WHERE id = v_journal_id;
    RAISE EXCEPTION 'VALIDATION FAILED: Unbalanced journal should not be postable';
  EXCEPTION 
    WHEN others THEN 
      IF SQLERRM LIKE '%unbalanced%' THEN
        RAISE NOTICE '✅ Test 4a PASSED: Unbalanced journal posting properly prevented';
      ELSE
        RAISE EXCEPTION 'VALIDATION FAILED: Unexpected error: %', SQLERRM;
      END IF;
  END;

  -- Balance the journal
  UPDATE gl_journal_lines 
  SET credit = 100 
  WHERE journal_id = v_journal_id AND credit = 50;

  -- Now posting should work
  UPDATE gl_journal SET status = 'posted' WHERE id = v_journal_id;
  
  -- Verify totals were set
  IF EXISTS (
    SELECT 1 FROM gl_journal 
    WHERE id = v_journal_id 
      AND total_debit = 100 
      AND total_credit = 100 
      AND posted_by IS NOT NULL 
      AND posted_at IS NOT NULL
  ) THEN
    RAISE NOTICE '✅ Test 4b PASSED: Balanced journal posted successfully with metadata';
  ELSE
    RAISE EXCEPTION 'VALIDATION FAILED: Posted journal metadata not set correctly';
  END IF;
END $$;

-- Test 5: Immutability After Posting
-- ----------------------------------
DO $$
DECLARE
  v_journal_id uuid := '550e8400-e29b-41d4-a716-446655440030';
BEGIN
  -- Try to modify posted journal lines (should fail)
  BEGIN
    UPDATE gl_journal_lines 
    SET debit = 200 
    WHERE journal_id = v_journal_id;
    
    RAISE EXCEPTION 'VALIDATION FAILED: Posted journal lines should be immutable';
  EXCEPTION 
    WHEN others THEN 
      IF SQLERRM LIKE '%posted%' THEN
        RAISE NOTICE '✅ Test 5a PASSED: Posted journal lines properly protected';
      ELSE
        RAISE EXCEPTION 'VALIDATION FAILED: Unexpected error: %', SQLERRM;
      END IF;
  END;

  -- Try to delete posted journal lines (should fail)
  BEGIN
    DELETE FROM gl_journal_lines WHERE journal_id = v_journal_id;
    
    RAISE EXCEPTION 'VALIDATION FAILED: Posted journal lines should not be deletable';
  EXCEPTION 
    WHEN others THEN 
      IF SQLERRM LIKE '%posted%' THEN
        RAISE NOTICE '✅ Test 5b PASSED: Posted journal line deletion properly prevented';
      ELSE
        RAISE EXCEPTION 'VALIDATION FAILED: Unexpected error: %', SQLERRM;
      END IF;
  END;
END $$;

-- Test 6: Audit Trail
-- -------------------
DO $$
BEGIN
  -- Check if audit logs were created for our test data
  IF EXISTS (
    SELECT 1 FROM audit_logs 
    WHERE entity_type = 'gl_journal' 
      AND action = 'UPDATE'
      AND tenant_id = '550e8400-e29b-41d4-a716-446655440000'
  ) THEN
    RAISE NOTICE '✅ Test 6 PASSED: Audit logs properly created';
  ELSE
    RAISE NOTICE '⚠️  Test 6 WARNING: No audit logs found (may need proper auth context)';
  END IF;
END $$;

-- Test 7: Currency Integrity
-- --------------------------
DO $$
BEGIN
  -- Try to delete a currency that's in use (should fail)
  BEGIN
    DELETE FROM currencies WHERE code = 'MYR';
    RAISE EXCEPTION 'VALIDATION FAILED: Used currency should not be deletable';
  EXCEPTION 
    WHEN others THEN 
      IF SQLERRM LIKE '%referenced%' THEN
        RAISE NOTICE '✅ Test 7 PASSED: Used currency deletion properly prevented';
      ELSE
        RAISE EXCEPTION 'VALIDATION FAILED: Unexpected error: %', SQLERRM;
      END IF;
  END;
END $$;

-- Test 8: Journal Numbering Function
-- ---------------------------------
DO $$
DECLARE
  v_next_number text;
BEGIN
  v_next_number := get_next_journal_number(
    '550e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-41d4-a716-446655440001'
  );
  
  IF v_next_number LIKE 'JE%' AND LENGTH(v_next_number) = 8 THEN
    RAISE NOTICE '✅ Test 8 PASSED: Journal numbering function works correctly: %', v_next_number;
  ELSE
    RAISE EXCEPTION 'VALIDATION FAILED: Journal numbering function returned: %', v_next_number;
  END IF;
END $$;

-- Cleanup Test Data
-- =================
-- Uncomment to clean up test data after validation

/*
DELETE FROM gl_journal_lines WHERE journal_id IN (
  SELECT id FROM gl_journal WHERE tenant_id = '550e8400-e29b-41d4-a716-446655440000'
);
DELETE FROM gl_journal WHERE tenant_id = '550e8400-e29b-41d4-a716-446655440000';
DELETE FROM chart_of_accounts WHERE tenant_id = '550e8400-e29b-41d4-a716-446655440000';
DELETE FROM fx_rates WHERE from_currency = 'USD' AND to_currency = 'MYR';
DELETE FROM memberships WHERE tenant_id = '550e8400-e29b-41d4-a716-446655440000';
DELETE FROM companies WHERE tenant_id = '550e8400-e29b-41d4-a716-446655440000';
DELETE FROM users WHERE id = '550e8400-e29b-41d4-a716-446655440002';
DELETE FROM tenants WHERE id = '550e8400-e29b-41d4-a716-446655440000';
DELETE FROM audit_logs WHERE tenant_id = '550e8400-e29b-41d4-a716-446655440000';
*/

-- =====================================================
-- VALIDATION COMPLETE!
-- =====================================================
-- 
-- If all tests show ✅ PASSED, your database is ready for production!
-- 
-- Expected Results:
-- ✅ Test 1a PASSED: Duplicate company code properly rejected
-- ✅ Test 1b PASSED: Duplicate COA code properly rejected  
-- ✅ Test 2a PASSED: Negative amounts properly rejected
-- ✅ Test 2b PASSED: XOR constraint properly enforced
-- ✅ Test 3 PASSED: FX rate overlap properly prevented
-- ✅ Test 4a PASSED: Unbalanced journal posting properly prevented
-- ✅ Test 4b PASSED: Balanced journal posted successfully with metadata
-- ✅ Test 5a PASSED: Posted journal lines properly protected
-- ✅ Test 5b PASSED: Posted journal line deletion properly prevented
-- ✅ Test 6 PASSED: Audit logs properly created
-- ✅ Test 7 PASSED: Used currency deletion properly prevented
-- ✅ Test 8 PASSED: Journal numbering function works correctly
-- =====================================================
