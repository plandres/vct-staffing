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
