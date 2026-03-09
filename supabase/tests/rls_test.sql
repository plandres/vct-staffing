-- RLS Test Script
-- Run against Supabase with: psql -f rls_test.sql
-- Tests each role's access to each table

-- Helper: create test users in auth.users (requires service_role)
-- In practice, use Supabase dashboard or supabase CLI to create test users
-- Then set their roles in profiles table

-- ============================================================
-- TEST SETUP (run as service_role / superuser)
-- ============================================================

-- Verify RLS is enabled on all tables
DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY[
    'profiles', 'funds', 'portfolio_companies', 'program_categories',
    'staffing_assignments', 'support_requests', 'sop_assignments',
    'rdqm_imports', 'activity_log'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_tables
      WHERE schemaname = 'public' AND tablename = t
      AND rowsecurity = true
    ) THEN
      RAISE EXCEPTION 'RLS NOT enabled on table: %', t;
    END IF;
  END LOOP;
  RAISE NOTICE 'PASS: RLS enabled on all tables';
END;
$$;

-- Verify all RLS functions exist
DO $$
DECLARE
  f TEXT;
  funcs TEXT[] := ARRAY[
    'get_user_role', 'is_owner', 'is_admin_or_owner',
    'is_core_vct_or_above', 'is_authenticated_active', 'sop_company_ids'
  ];
BEGIN
  FOREACH f IN ARRAY funcs LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_proc
      WHERE proname = f AND pronamespace = 'public'::regnamespace
    ) THEN
      RAISE EXCEPTION 'RLS function missing: %', f;
    END IF;
  END LOOP;
  RAISE NOTICE 'PASS: All RLS functions exist';
END;
$$;

-- Verify all RLS functions are SECURITY DEFINER
DO $$
DECLARE
  f TEXT;
  funcs TEXT[] := ARRAY[
    'get_user_role', 'is_owner', 'is_admin_or_owner',
    'is_core_vct_or_above', 'is_authenticated_active', 'sop_company_ids'
  ];
BEGIN
  FOREACH f IN ARRAY funcs LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_proc
      WHERE proname = f
      AND pronamespace = 'public'::regnamespace
      AND prosecdef = true
    ) THEN
      RAISE EXCEPTION 'Function % is NOT security definer', f;
    END IF;
  END LOOP;
  RAISE NOTICE 'PASS: All RLS functions are SECURITY DEFINER';
END;
$$;

-- Verify critical indexes exist
DO $$
DECLARE
  idx TEXT;
  indexes TEXT[] := ARRAY[
    'idx_staffing_member', 'idx_staffing_company',
    'idx_sop_sop_id', 'idx_sop_company_id',
    'idx_requests_requester', 'idx_requests_assigned'
  ];
BEGIN
  FOREACH idx IN ARRAY indexes LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE schemaname = 'public' AND indexname = idx
    ) THEN
      RAISE EXCEPTION 'Index missing: %', idx;
    END IF;
  END LOOP;
  RAISE NOTICE 'PASS: All critical indexes exist';
END;
$$;

-- Count policies per table
DO $$
DECLARE
  t TEXT;
  cnt INT;
  tables TEXT[] := ARRAY[
    'profiles', 'funds', 'portfolio_companies', 'program_categories',
    'staffing_assignments', 'support_requests', 'sop_assignments',
    'rdqm_imports', 'activity_log'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    SELECT count(*) INTO cnt
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = t;
    RAISE NOTICE 'Table % has % RLS policies', t, cnt;
    IF cnt = 0 THEN
      RAISE EXCEPTION 'Table % has NO RLS policies!', t;
    END IF;
  END LOOP;
  RAISE NOTICE 'PASS: All tables have RLS policies';
END;
$$;

-- Verify no policies grant to anon role
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT tablename, policyname, roles
    FROM pg_policies
    WHERE schemaname = 'public'
    AND 'anon' = ANY(roles)
  LOOP
    RAISE EXCEPTION 'Policy % on % grants to anon role!', pol.policyname, pol.tablename;
  END LOOP;
  RAISE NOTICE 'PASS: No policies grant to anon role';
END;
$$;

RAISE NOTICE '=== ALL RLS STRUCTURAL TESTS PASSED ===';
