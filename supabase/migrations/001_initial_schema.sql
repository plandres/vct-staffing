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
