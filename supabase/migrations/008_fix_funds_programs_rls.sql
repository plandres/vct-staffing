-- Fix RLS policies for funds and program_categories tables.
-- The previous FOR ALL policies used only USING without WITH CHECK,
-- which can block INSERT operations in some PostgreSQL/PostgREST versions.
-- Replacing with explicit separate policies.

-- ============================================================
-- FUNDS
-- ============================================================
DROP POLICY IF EXISTS "funds_modify" ON public.funds;

CREATE POLICY "funds_insert" ON public.funds
  FOR INSERT TO authenticated
  WITH CHECK (is_admin_or_owner());

CREATE POLICY "funds_update" ON public.funds
  FOR UPDATE TO authenticated
  USING (is_admin_or_owner());

CREATE POLICY "funds_delete" ON public.funds
  FOR DELETE TO authenticated
  USING (is_admin_or_owner());

-- ============================================================
-- PROGRAM CATEGORIES
-- ============================================================
DROP POLICY IF EXISTS "programs_modify" ON public.program_categories;

CREATE POLICY "programs_insert" ON public.program_categories
  FOR INSERT TO authenticated
  WITH CHECK (is_admin_or_owner());

CREATE POLICY "programs_update" ON public.program_categories
  FOR UPDATE TO authenticated
  USING (is_admin_or_owner());

CREATE POLICY "programs_delete" ON public.program_categories
  FOR DELETE TO authenticated
  USING (is_admin_or_owner());
