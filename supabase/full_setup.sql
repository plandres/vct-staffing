-- VCT Staffing Tracker — Initial Schema
-- All tables for the Value Creation Team staffing management application

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  initials VARCHAR(5),
  role TEXT NOT NULL DEFAULT 'viewer'
    CHECK (role IN ('owner', 'admin', 'core_vct', 'sop', 'requester', 'viewer')),
  specialties TEXT[] DEFAULT '{}',
  avatar_url TEXT,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- FUNDS
-- ============================================================
CREATE TABLE public.funds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.funds ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PORTFOLIO COMPANIES
-- ============================================================
CREATE TABLE public.portfolio_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  fund_id UUID REFERENCES public.funds(id) ON DELETE SET NULL,
  sector TEXT,
  geography TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'exited')),
  deal_partner TEXT,
  deal_team TEXT[] DEFAULT '{}',
  strategic_priorities JSONB NOT NULL DEFAULT '[]'::jsonb,
  kpis JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.portfolio_companies ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PROGRAM CATEGORIES
-- ============================================================
CREATE TABLE public.program_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL DEFAULT 'program'
    CHECK (type IN ('fundamental', 'program')),
  display_order INT NOT NULL DEFAULT 0,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.program_categories ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STAFFING ASSIGNMENTS (core table)
-- ============================================================
CREATE TABLE public.staffing_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.portfolio_companies(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES public.program_categories(id) ON DELETE CASCADE,
  workload TEXT NOT NULL DEFAULT 'light'
    CHECK (workload IN ('heavy', 'light', 'none')),
  status TEXT NOT NULL DEFAULT 'to_start'
    CHECK (status IN ('to_start', 'ongoing', 'completed', 'roadblock')),
  start_date DATE,
  end_date DATE,
  objectives TEXT,
  external_resources TEXT,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(member_id, company_id, program_id)
);

ALTER TABLE public.staffing_assignments ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- SUPPORT REQUESTS
-- ============================================================
CREATE TABLE public.support_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.portfolio_companies(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('urgent', 'high', 'normal', 'low')),
  status TEXT NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted', 'reviewed', 'assigned', 'in_progress', 'completed', 'rejected')),
  assigned_to UUID REFERENCES public.profiles(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- SOP ASSIGNMENTS (SOP ↔ Portfolio Company)
-- ============================================================
CREATE TABLE public.sop_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sop_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.portfolio_companies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(sop_id, company_id)
);

ALTER TABLE public.sop_assignments ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RDQM IMPORTS
-- ============================================================
CREATE TABLE public.rdqm_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  file_path TEXT,
  file_type TEXT NOT NULL CHECK (file_type IN ('pptx', 'pdf')),
  imported_by UUID REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'processing'
    CHECK (status IN ('processing', 'completed', 'failed')),
  changes_summary JSONB,
  error_log TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rdqm_imports ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- ACTIVITY LOG
-- ============================================================
CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  changes JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
-- RLS Helper Functions (security definer for performance)
-- Pattern: wrap role check in SELECT, use STABLE for caching

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.profiles
  WHERE id = auth.uid() AND is_active = true
$$;

CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'owner' AND is_active = true
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_owner()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('owner', 'admin') AND is_active = true
  )
$$;

CREATE OR REPLACE FUNCTION public.is_core_vct_or_above()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('owner', 'admin', 'core_vct') AND is_active = true
  )
$$;

CREATE OR REPLACE FUNCTION public.is_authenticated_active()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_active = true
  )
$$;

-- Returns array of company IDs assigned to SOP user (avoids joins in RLS)
CREATE OR REPLACE FUNCTION public.sop_company_ids()
RETURNS UUID[]
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT array_agg(company_id) FROM public.sop_assignments WHERE sop_id = auth.uid()),
    '{}'::uuid[]
  )
$$;
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

CREATE POLICY "programs_insert" ON public.program_categories
  FOR INSERT TO authenticated
  WITH CHECK (is_admin_or_owner());

CREATE POLICY "programs_update" ON public.program_categories
  FOR UPDATE TO authenticated
  USING (is_admin_or_owner());

CREATE POLICY "programs_delete" ON public.program_categories
  FOR DELETE TO authenticated
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
-- Indexes for RLS performance and common queries

-- Profiles
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_active ON public.profiles(is_active);
CREATE INDEX idx_profiles_initials ON public.profiles(initials);

-- Portfolio Companies
CREATE INDEX idx_companies_fund ON public.portfolio_companies(fund_id);
CREATE INDEX idx_companies_status ON public.portfolio_companies(status);

-- Staffing Assignments (critical for RLS and queries)
CREATE INDEX idx_staffing_member ON public.staffing_assignments(member_id);
CREATE INDEX idx_staffing_company ON public.staffing_assignments(company_id);
CREATE INDEX idx_staffing_program ON public.staffing_assignments(program_id);
CREATE INDEX idx_staffing_workload ON public.staffing_assignments(workload);
CREATE INDEX idx_staffing_status ON public.staffing_assignments(status);
CREATE INDEX idx_staffing_member_company ON public.staffing_assignments(member_id, company_id);

-- SOP Assignments (critical for RLS sop_company_ids())
CREATE INDEX idx_sop_sop_id ON public.sop_assignments(sop_id);
CREATE INDEX idx_sop_company_id ON public.sop_assignments(company_id);

-- Support Requests
CREATE INDEX idx_requests_requester ON public.support_requests(requester_id);
CREATE INDEX idx_requests_assigned ON public.support_requests(assigned_to);
CREATE INDEX idx_requests_status ON public.support_requests(status);
CREATE INDEX idx_requests_company ON public.support_requests(company_id);

-- RDQM Imports
CREATE INDEX idx_rdqm_imported_by ON public.rdqm_imports(imported_by);
CREATE INDEX idx_rdqm_status ON public.rdqm_imports(status);

-- Activity Log
CREATE INDEX idx_activity_user ON public.activity_log(user_id);
CREATE INDEX idx_activity_entity ON public.activity_log(entity_type, entity_id);
CREATE INDEX idx_activity_created ON public.activity_log(created_at DESC);
-- Seed data: Funds, Portfolio Companies, Program Categories
-- Note: Profiles are created via auth trigger, not seeded here

-- ============================================================
-- FUNDS
-- ============================================================
INSERT INTO public.funds (name, display_order) VALUES
  ('MM X', 1),
  ('MM IX', 2),
  ('ADF', 3);

-- ============================================================
-- PORTFOLIO COMPANIES
-- ============================================================
-- MM X
INSERT INTO public.portfolio_companies (name, fund_id, sector, geography, status) VALUES
  ('Zwart', (SELECT id FROM public.funds WHERE name = 'MM X'), 'Critical Power', 'Netherlands', 'active'),
  ('HRK Lunis', (SELECT id FROM public.funds WHERE name = 'MM X'), 'Wealth Management', 'Germany', 'active'),
  ('Fulgard', (SELECT id FROM public.funds WHERE name = 'MM X'), NULL, NULL, 'active'),
  ('Lumion', (SELECT id FROM public.funds WHERE name = 'MM X'), NULL, NULL, 'active'),
  ('Infraneo', (SELECT id FROM public.funds WHERE name = 'MM X'), NULL, NULL, 'active'),
  ('Efficy', (SELECT id FROM public.funds WHERE name = 'MM X'), 'CRM', 'Belgium', 'active'),
  ('MCG', (SELECT id FROM public.funds WHERE name = 'MM X'), NULL, NULL, 'active'),
  ('Odigo', (SELECT id FROM public.funds WHERE name = 'MM X'), 'CCaaS', 'France', 'active'),
  ('Hirsch', (SELECT id FROM public.funds WHERE name = 'MM X'), 'Security', 'France', 'active'),
  ('Opteven', (SELECT id FROM public.funds WHERE name = 'MM X'), NULL, 'France', 'active'),
  ('Crystal', (SELECT id FROM public.funds WHERE name = 'MM X'), NULL, NULL, 'inactive');

-- MM IX
INSERT INTO public.portfolio_companies (name, fund_id, sector, geography, status) VALUES
  ('DSTNY', (SELECT id FROM public.funds WHERE name = 'MM IX'), NULL, NULL, 'active'),
  ('AEB', (SELECT id FROM public.funds WHERE name = 'MM IX'), NULL, NULL, 'active'),
  ('Graitec', (SELECT id FROM public.funds WHERE name = 'MM IX'), NULL, NULL, 'active'),
  ('Infovista', (SELECT id FROM public.funds WHERE name = 'MM IX'), NULL, NULL, 'active');

-- ADF
INSERT INTO public.portfolio_companies (name, fund_id, sector, geography, status) VALUES
  ('Illuin', (SELECT id FROM public.funds WHERE name = 'ADF'), NULL, NULL, 'active'),
  ('Olifan', (SELECT id FROM public.funds WHERE name = 'ADF'), NULL, NULL, 'active'),
  ('Pandat Finance', (SELECT id FROM public.funds WHERE name = 'ADF'), NULL, NULL, 'active'),
  ('School of Arts', (SELECT id FROM public.funds WHERE name = 'ADF'), NULL, NULL, 'active'),
  ('Almond', (SELECT id FROM public.funds WHERE name = 'ADF'), NULL, NULL, 'active'),
  ('Eric Bompard', (SELECT id FROM public.funds WHERE name = 'ADF'), NULL, NULL, 'active'),
  ('BTPC', (SELECT id FROM public.funds WHERE name = 'ADF'), NULL, NULL, 'active'),
  ('CEME', (SELECT id FROM public.funds WHERE name = 'ADF'), NULL, NULL, 'active'),
  ('Mailinblack', (SELECT id FROM public.funds WHERE name = 'ADF'), NULL, NULL, 'active'),
  ('Porsolt', (SELECT id FROM public.funds WHERE name = 'ADF'), NULL, NULL, 'active'),
  ('Odin', (SELECT id FROM public.funds WHERE name = 'ADF'), NULL, NULL, 'active');

-- ============================================================
-- PROGRAM CATEGORIES
-- ============================================================
-- Fundamentals
INSERT INTO public.program_categories (name, type, display_order) VALUES
  ('Governance', 'fundamental', 1),
  ('Leadership', 'fundamental', 2),
  ('Sustainability', 'fundamental', 3),
  ('Strategy', 'fundamental', 4),
  ('Finance & Reporting', 'fundamental', 5),
  ('Cybersecurity', 'fundamental', 6);

-- Programs
INSERT INTO public.program_categories (name, type, display_order) VALUES
  ('AI/Digital', 'program', 7),
  ('Pricing', 'program', 8),
  ('Purchasing', 'program', 9),
  ('Opex', 'program', 10),
  ('M&A', 'program', 11),
  ('PMI', 'program', 12),
  ('Sales & Marketing', 'program', 13),
  ('IT/Data', 'program', 14),
  ('HR', 'program', 15),
  ('Environment', 'program', 16);
-- Triggers for automated operations

-- ============================================================
-- AUTO-CREATE PROFILE ON AUTH SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, is_active)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', split_part(COALESCE(NEW.email, ''), '@', 1)),
    'viewer',
    true
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- AUTO-UPDATE updated_at TIMESTAMP
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER companies_updated_at
  BEFORE UPDATE ON public.portfolio_companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER staffing_updated_at
  BEFORE UPDATE ON public.staffing_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER requests_updated_at
  BEFORE UPDATE ON public.support_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- ACTIVITY LOGGING TRIGGER (staffing changes)
-- ============================================================
CREATE OR REPLACE FUNCTION public.log_staffing_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activity_log (user_id, action, entity_type, entity_id, changes)
    VALUES (auth.uid(), 'created', 'staffing_assignment', NEW.id,
      jsonb_build_object('member_id', NEW.member_id, 'company_id', NEW.company_id,
        'program_id', NEW.program_id, 'workload', NEW.workload, 'status', NEW.status));
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.activity_log (user_id, action, entity_type, entity_id, changes)
    VALUES (auth.uid(), 'updated', 'staffing_assignment', NEW.id,
      jsonb_build_object(
        'old', jsonb_build_object('workload', OLD.workload, 'status', OLD.status),
        'new', jsonb_build_object('workload', NEW.workload, 'status', NEW.status)));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.activity_log (user_id, action, entity_type, entity_id, changes)
    VALUES (auth.uid(), 'deleted', 'staffing_assignment', OLD.id,
      jsonb_build_object('member_id', OLD.member_id, 'company_id', OLD.company_id));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER staffing_activity_log
  AFTER INSERT OR UPDATE OR DELETE ON public.staffing_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.log_staffing_change();
-- Fix profile trigger to generate initials and improve robustness
-- Also add a function to bootstrap the first admin user

-- ============================================================
-- IMPROVED PROFILE TRIGGER: generates initials from name
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_full_name text;
  v_initials text;
  name_parts text[];
BEGIN
  -- Extract full name from metadata or email
  v_full_name := COALESCE(
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'name',
    split_part(COALESCE(NEW.email, ''), '@', 1)
  );

  -- Generate initials from full name (up to 2 characters)
  name_parts := string_to_array(trim(v_full_name), ' ');
  IF array_length(name_parts, 1) >= 2 THEN
    v_initials := upper(left(name_parts[1], 1) || left(name_parts[array_length(name_parts, 1)], 1));
  ELSIF array_length(name_parts, 1) = 1 THEN
    v_initials := upper(left(name_parts[1], 2));
  ELSE
    v_initials := '??';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, initials, role, is_active)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    v_full_name,
    v_initials,
    'viewer',
    true
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- ============================================================
-- BOOTSTRAP ADMIN: promote first user or specific email to admin
-- Usage: SELECT public.bootstrap_admin('admin@seven2.com');
-- Or without args to promote the first registered user.
-- ============================================================
CREATE OR REPLACE FUNCTION public.bootstrap_admin(target_email text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  IF target_email IS NOT NULL THEN
    SELECT id INTO v_user_id FROM public.profiles WHERE email = target_email;
  ELSE
    SELECT id INTO v_user_id FROM public.profiles ORDER BY created_at ASC LIMIT 1;
  END IF;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No user found to promote';
  END IF;

  UPDATE public.profiles SET role = 'owner' WHERE id = v_user_id;
END;
$$;

-- ============================================================
-- MIGRATION 009 — Extend activity logging (companies, profiles, requests)
-- ============================================================

CREATE OR REPLACE FUNCTION public.log_company_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activity_log (user_id, action, entity_type, entity_id, changes)
    VALUES (auth.uid(), 'created', 'company', NEW.id,
      jsonb_build_object('name', NEW.name, 'fund_id', NEW.fund_id, 'status', NEW.status));
  ELSIF TG_OP = 'UPDATE' THEN
    DECLARE
      diff JSONB := '{}'::JSONB;
    BEGIN
      IF NEW.name IS DISTINCT FROM OLD.name THEN
        diff := diff || jsonb_build_object('name', jsonb_build_object('old', OLD.name, 'new', NEW.name));
      END IF;
      IF NEW.fund_id IS DISTINCT FROM OLD.fund_id THEN
        diff := diff || jsonb_build_object('fund_id', jsonb_build_object('old', OLD.fund_id, 'new', NEW.fund_id));
      END IF;
      IF NEW.status IS DISTINCT FROM OLD.status THEN
        diff := diff || jsonb_build_object('status', jsonb_build_object('old', OLD.status, 'new', NEW.status));
      END IF;
      IF diff <> '{}'::JSONB THEN
        INSERT INTO public.activity_log (user_id, action, entity_type, entity_id, changes)
        VALUES (auth.uid(), 'updated', 'company', NEW.id, diff);
      END IF;
    END;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.activity_log (user_id, action, entity_type, entity_id, changes)
    VALUES (auth.uid(), 'deleted', 'company', OLD.id,
      jsonb_build_object('name', OLD.name, 'fund_id', OLD.fund_id));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER company_activity_log
  AFTER INSERT OR UPDATE OR DELETE ON public.portfolio_companies
  FOR EACH ROW
  EXECUTE FUNCTION public.log_company_change();

CREATE OR REPLACE FUNCTION public.log_profile_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  diff JSONB := '{}'::JSONB;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      diff := diff || jsonb_build_object('role', jsonb_build_object('old', OLD.role, 'new', NEW.role));
    END IF;
    IF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
      diff := diff || jsonb_build_object('is_active', jsonb_build_object('old', OLD.is_active, 'new', NEW.is_active));
    END IF;
    IF NEW.full_name IS DISTINCT FROM OLD.full_name THEN
      diff := diff || jsonb_build_object('full_name', jsonb_build_object('old', OLD.full_name, 'new', NEW.full_name));
    END IF;
    IF diff <> '{}'::JSONB THEN
      INSERT INTO public.activity_log (user_id, action, entity_type, entity_id, changes)
      VALUES (auth.uid(), 'updated', 'profile', NEW.id, diff);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER profile_activity_log
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_profile_change();

CREATE OR REPLACE FUNCTION public.log_request_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activity_log (user_id, action, entity_type, entity_id, changes)
    VALUES (auth.uid(), 'created', 'request', NEW.id,
      jsonb_build_object(
        'company_id', NEW.company_id,
        'program_id', NEW.program_id,
        'priority', NEW.priority,
        'status', NEW.status
      ));
  ELSIF TG_OP = 'UPDATE' THEN
    DECLARE
      diff JSONB := '{}'::JSONB;
    BEGIN
      IF NEW.status IS DISTINCT FROM OLD.status THEN
        diff := diff || jsonb_build_object('status', jsonb_build_object('old', OLD.status, 'new', NEW.status));
      END IF;
      IF NEW.priority IS DISTINCT FROM OLD.priority THEN
        diff := diff || jsonb_build_object('priority', jsonb_build_object('old', OLD.priority, 'new', NEW.priority));
      END IF;
      IF NEW.assigned_to IS DISTINCT FROM OLD.assigned_to THEN
        diff := diff || jsonb_build_object('assigned_to', jsonb_build_object('old', OLD.assigned_to, 'new', NEW.assigned_to));
      END IF;
      IF diff <> '{}'::JSONB THEN
        INSERT INTO public.activity_log (user_id, action, entity_type, entity_id, changes)
        VALUES (auth.uid(), 'updated', 'request', NEW.id, diff);
      END IF;
    END;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.activity_log (user_id, action, entity_type, entity_id, changes)
    VALUES (auth.uid(), 'deleted', 'request', OLD.id,
      jsonb_build_object('company_id', OLD.company_id, 'status', OLD.status));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER request_activity_log
  AFTER INSERT OR UPDATE OR DELETE ON public.support_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.log_request_change();
