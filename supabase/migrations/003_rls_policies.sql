-- RLS Policies for all tables
-- Uses is_*() functions from 002_rls_functions.sql

-- ============================================================
-- PROFILES
-- ============================================================
-- All authenticated active users can read profiles
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT TO authenticated
  USING (is_authenticated_active());

-- Only owner/admin can insert profiles (trigger handles auto-creation)
CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (is_admin_or_owner() OR id = auth.uid());

-- Owner/admin can update any profile; users can update their own (non-role fields)
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (is_admin_or_owner() OR id = auth.uid());

-- Only owner can delete profiles
CREATE POLICY "profiles_delete" ON public.profiles
  FOR DELETE TO authenticated
  USING (is_owner());

-- ============================================================
-- FUNDS
-- ============================================================
CREATE POLICY "funds_select" ON public.funds
  FOR SELECT TO authenticated
  USING (is_authenticated_active());

CREATE POLICY "funds_modify" ON public.funds
  FOR ALL TO authenticated
  USING (is_admin_or_owner());

-- ============================================================
-- PORTFOLIO COMPANIES
-- ============================================================
-- All active users can read companies (SOP filtering is done at app level for UX)
CREATE POLICY "companies_select" ON public.portfolio_companies
  FOR SELECT TO authenticated
  USING (is_authenticated_active());

-- Admin/owner can modify companies
CREATE POLICY "companies_insert" ON public.portfolio_companies
  FOR INSERT TO authenticated
  WITH CHECK (is_admin_or_owner());

CREATE POLICY "companies_update" ON public.portfolio_companies
  FOR UPDATE TO authenticated
  USING (
    is_admin_or_owner()
    OR (get_user_role() = 'sop' AND id = ANY(sop_company_ids()))
  );

CREATE POLICY "companies_delete" ON public.portfolio_companies
  FOR DELETE TO authenticated
  USING (is_admin_or_owner());

-- ============================================================
-- PROGRAM CATEGORIES
-- ============================================================
CREATE POLICY "programs_select" ON public.program_categories
  FOR SELECT TO authenticated
  USING (is_authenticated_active());

CREATE POLICY "programs_modify" ON public.program_categories
  FOR ALL TO authenticated
  USING (is_admin_or_owner());

-- ============================================================
-- STAFFING ASSIGNMENTS
-- ============================================================
-- Read: all active users
CREATE POLICY "staffing_select" ON public.staffing_assignments
  FOR SELECT TO authenticated
  USING (is_authenticated_active());

-- Insert: admin/owner, core_vct for own assignments, SOP for assigned companies
CREATE POLICY "staffing_insert" ON public.staffing_assignments
  FOR INSERT TO authenticated
  WITH CHECK (
    is_admin_or_owner()
    OR (is_core_vct_or_above() AND member_id = auth.uid())
    OR (get_user_role() = 'sop' AND company_id = ANY(sop_company_ids()))
  );

-- Update: same logic as insert
CREATE POLICY "staffing_update" ON public.staffing_assignments
  FOR UPDATE TO authenticated
  USING (
    is_admin_or_owner()
    OR (is_core_vct_or_above() AND member_id = auth.uid())
    OR (get_user_role() = 'sop' AND company_id = ANY(sop_company_ids()))
  );

-- Delete: admin/owner only
CREATE POLICY "staffing_delete" ON public.staffing_assignments
  FOR DELETE TO authenticated
  USING (is_admin_or_owner());

-- ============================================================
-- SUPPORT REQUESTS
-- ============================================================
-- Read: all active users
CREATE POLICY "requests_select" ON public.support_requests
  FOR SELECT TO authenticated
  USING (is_authenticated_active());

-- Insert: requesters and above
CREATE POLICY "requests_insert" ON public.support_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    is_authenticated_active()
    AND get_user_role() IN ('owner', 'admin', 'core_vct', 'requester')
  );

-- Update: admin/owner, or requester on own, or assigned core_vct
CREATE POLICY "requests_update" ON public.support_requests
  FOR UPDATE TO authenticated
  USING (
    is_admin_or_owner()
    OR requester_id = auth.uid()
    OR (is_core_vct_or_above() AND assigned_to = auth.uid())
  );

-- Delete: admin/owner only
CREATE POLICY "requests_delete" ON public.support_requests
  FOR DELETE TO authenticated
  USING (is_admin_or_owner());

-- ============================================================
-- SOP ASSIGNMENTS
-- ============================================================
CREATE POLICY "sop_assignments_select" ON public.sop_assignments
  FOR SELECT TO authenticated
  USING (is_authenticated_active());

CREATE POLICY "sop_assignments_modify" ON public.sop_assignments
  FOR ALL TO authenticated
  USING (is_admin_or_owner());

-- ============================================================
-- RDQM IMPORTS
-- ============================================================
CREATE POLICY "rdqm_select" ON public.rdqm_imports
  FOR SELECT TO authenticated
  USING (is_admin_or_owner());

CREATE POLICY "rdqm_insert" ON public.rdqm_imports
  FOR INSERT TO authenticated
  WITH CHECK (is_admin_or_owner());

CREATE POLICY "rdqm_update" ON public.rdqm_imports
  FOR UPDATE TO authenticated
  USING (is_admin_or_owner());

-- ============================================================
-- ACTIVITY LOG
-- ============================================================
CREATE POLICY "activity_select" ON public.activity_log
  FOR SELECT TO authenticated
  USING (is_authenticated_active());

CREATE POLICY "activity_insert" ON public.activity_log
  FOR INSERT TO authenticated
  WITH CHECK (is_authenticated_active());
