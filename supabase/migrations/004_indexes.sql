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
