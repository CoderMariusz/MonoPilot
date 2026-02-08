-- Migration: Restore missing SELECT policy for production_lines table
-- Problem: production_lines SELECT policy may be missing in production, blocking reads.
-- Solution: Re-create a SELECT policy scoped to the authenticated user's organization.
-- Date: 2026-02-08

ALTER TABLE public.production_lines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS production_lines_select ON public.production_lines;
DROP POLICY IF EXISTS production_lines_select_policy ON public.production_lines;
DROP POLICY IF EXISTS production_lines_org_isolation ON public.production_lines;

CREATE POLICY production_lines_select ON public.production_lines
FOR SELECT TO authenticated
USING (org_id = public.get_my_org_id());

COMMENT ON POLICY production_lines_select ON public.production_lines
IS 'All org users can view production lines in their own organization';

DO $$
DECLARE
  v_policy_count INT;
BEGIN
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'production_lines'
    AND policyname = 'production_lines_select';

  IF v_policy_count > 0 THEN
    RAISE NOTICE 'SELECT policy restored for production_lines table';
  ELSE
    RAISE EXCEPTION 'Failed to create production_lines SELECT policy';
  END IF;
END $$;
