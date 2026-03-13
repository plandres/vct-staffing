-- ============================================================
-- MIGRATION 009 — Extend activity logging
-- Tables: portfolio_companies, profiles, support_requests
-- ============================================================

-- -------------------------------------------------------
-- portfolio_companies: log name/fund/status changes + add/delete
-- -------------------------------------------------------
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


-- -------------------------------------------------------
-- profiles: log role and active status changes
-- -------------------------------------------------------
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


-- -------------------------------------------------------
-- support_requests: log creation and status changes
-- -------------------------------------------------------
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
