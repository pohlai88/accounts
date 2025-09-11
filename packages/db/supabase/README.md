# Supabase Database Setup

This directory contains the SQL files to set up the AIBOS V1 database in Supabase.

## Execution Order

Run these files **in order** in the Supabase SQL Editor:

1. **`01_setup.sql`** - Main database schema
   - Creates all tables, relationships, and indexes
   - Sets up RLS policies
   - Inserts base currency data

2. **`02_production_hardening.sql`** - Security & constraints
   - Adds uniqueness constraints
   - Implements business rule checks
   - Sets up audit triggers
   - Enforces posting rules and immutability

3. **`03_indexes.sql`** - Performance optimization
   - Creates performance indexes
   - Safe for initial setup (non-concurrent)

4. **`04_validation_tests.sql`** - Verification
   - Tests all constraints and business rules
   - Validates security policies
   - Should show ✅ PASSED for all tests

## After Setup

Once all files are executed successfully:
- ✅ Database is production-ready
- ✅ Multi-tenant security enabled
- ✅ Audit trail functional
- ✅ Business rules enforced
- ✅ Performance optimized

## Notes

- All files are designed for Supabase SQL Editor
- No additional setup required
- Files include proper error handling
- Safe to run multiple times (idempotent)
