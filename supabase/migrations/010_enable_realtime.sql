-- ============================================================
-- MIGRATION 010 — Enable Realtime for staffing_assignments
-- ============================================================
-- Adds staffing_assignments to the supabase_realtime publication
-- so that Postgres Changes subscriptions work without errors.

ALTER PUBLICATION supabase_realtime ADD TABLE public.staffing_assignments;
