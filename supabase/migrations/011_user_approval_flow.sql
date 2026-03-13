-- Migration 011 — User approval flow
-- Requirements:
--   1. Only emails from the configured domain can sign up
--   2. New users start as pending (is_active=false, status='pending')
--   3. Owner/admin must approve before access is granted

-- ============================================================
-- APP SETTINGS (key/value config table)
-- ============================================================
CREATE TABLE public.app_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read settings (needed for login page UX)
CREATE POLICY "app_settings_select" ON public.app_settings
  FOR SELECT TO authenticated
  USING (true);

-- Only owner/admin can update
CREATE POLICY "app_settings_update" ON public.app_settings
  FOR UPDATE TO authenticated
  USING (is_admin_or_owner());

-- Only owner/admin can insert
CREATE POLICY "app_settings_insert" ON public.app_settings
  FOR INSERT TO authenticated
  WITH CHECK (is_admin_or_owner());

-- Seed default values
INSERT INTO public.app_settings (key, value) VALUES
  ('allowed_email_domain', 'seven2.eu'),
  ('approval_notification_email', '');

-- ============================================================
-- ADD status COLUMN TO profiles
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected'));

-- All existing users (created before this migration) are approved
UPDATE public.profiles SET status = 'approved' WHERE status = 'pending';

-- ============================================================
-- FIX profiles_select POLICY
-- Allow users to always read their OWN profile (even if pending/inactive)
-- so AuthGuard can show the appropriate screen
-- ============================================================
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;

CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    id = auth.uid()           -- always see own profile
    OR is_authenticated_active()  -- active users see all profiles
  );

-- ============================================================
-- UPDATE handle_new_user TRIGGER
-- Add domain check + start as pending/inactive
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  allowed_domain TEXT;
BEGIN
  -- Check email domain against app_settings
  SELECT value INTO allowed_domain
  FROM public.app_settings
  WHERE key = 'allowed_email_domain';

  IF allowed_domain IS NOT NULL AND allowed_domain <> ''
     AND LOWER(COALESCE(NEW.email, '')) NOT LIKE '%@' || LOWER(allowed_domain)
  THEN
    RAISE EXCEPTION 'email_domain_not_allowed: only @% addresses are accepted', allowed_domain;
  END IF;

  -- Create profile in pending state (not active, awaiting owner approval)
  INSERT INTO public.profiles (id, email, full_name, role, is_active, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(
      NEW.raw_user_meta_data ->> 'full_name',
      NEW.raw_user_meta_data ->> 'name',
      split_part(COALESCE(NEW.email, ''), '@', 1)
    ),
    'viewer',
    false,      -- not active until approved
    'pending'   -- awaiting owner/admin approval
  );

  RETURN NEW;
END;
$$;
