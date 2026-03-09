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
