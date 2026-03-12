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
