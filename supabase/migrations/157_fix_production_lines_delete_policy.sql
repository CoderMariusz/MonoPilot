-- Migration: Fix production_lines DELETE policy for BUG-014
-- Problem: DELETE on production_lines may fail due to missing or incorrectly configured RLS policy
-- Solution: Ensure DELETE policy exists and uses correct role lookup
-- Date: 2026-02-08

-- Drop existing DELETE policy to ensure clean state
DROP POLICY IF EXISTS production_lines_delete ON public.production_lines;
DROP POLICY IF EXISTS production_lines_admin_write ON public.production_lines;

-- Create DELETE policy: only owner and admin roles can delete production lines
-- Uses the same org lookup pattern as other policies for consistency
CREATE POLICY production_lines_delete ON public.production_lines
FOR DELETE TO authenticated
USING (
    org_id = public.get_my_org_id()
    AND (
        SELECT r.code FROM public.roles r 
        JOIN public.users u ON u.role_id = r.id 
        WHERE u.id = auth.uid()
    ) IN ('owner', 'admin')
);

COMMENT ON POLICY production_lines_delete ON public.production_lines
IS 'Only owner and admin roles can delete production lines in their organization';

-- Also ensure INSERT and UPDATE policies exist with correct configuration
DROP POLICY IF EXISTS production_lines_insert ON public.production_lines;
DROP POLICY IF EXISTS production_lines_update ON public.production_lines;

CREATE POLICY production_lines_insert ON public.production_lines
FOR INSERT TO authenticated
WITH CHECK (
    org_id = public.get_my_org_id()
    AND (
        SELECT r.code FROM public.roles r 
        JOIN public.users u ON u.role_id = r.id 
        WHERE u.id = auth.uid()
    ) IN ('owner', 'admin', 'production_manager')
);

CREATE POLICY production_lines_update ON public.production_lines
FOR UPDATE TO authenticated
USING (
    org_id = public.get_my_org_id()
    AND (
        SELECT r.code FROM public.roles r 
        JOIN public.users u ON u.role_id = r.id 
        WHERE u.id = auth.uid()
    ) IN ('owner', 'admin', 'production_manager')
);

COMMENT ON POLICY production_lines_insert ON public.production_lines
IS 'Owner, admin, and production_manager can create production lines';

COMMENT ON POLICY production_lines_update ON public.production_lines
IS 'Owner, admin, and production_manager can update production lines';

-- Also fix junction table policies for cascade deletes
-- production_line_machines
DROP POLICY IF EXISTS plm_delete ON public.production_line_machines;
DROP POLICY IF EXISTS plm_admin_write ON public.production_line_machines;

CREATE POLICY plm_delete ON public.production_line_machines
FOR DELETE TO authenticated
USING (
    org_id = public.get_my_org_id()
    AND (
        SELECT r.code FROM public.roles r 
        JOIN public.users u ON u.role_id = r.id 
        WHERE u.id = auth.uid()
    ) IN ('owner', 'admin', 'production_manager')
);

-- production_line_products
DROP POLICY IF EXISTS plp_delete ON public.production_line_products;
DROP POLICY IF EXISTS plp_admin_write ON public.production_line_products;

CREATE POLICY plp_delete ON public.production_line_products
FOR DELETE TO authenticated
USING (
    org_id = public.get_my_org_id()
    AND (
        SELECT r.code FROM public.roles r 
        JOIN public.users u ON u.role_id = r.id 
        WHERE u.id = auth.uid()
    ) IN ('owner', 'admin', 'production_manager')
);

-- Verify policies were created
DO $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'production_lines'
    AND policyname IN ('production_lines_delete', 'production_lines_insert', 'production_lines_update');

  IF v_count = 3 THEN
    RAISE NOTICE '✅ BUG-014 fix: All production_lines write policies created successfully';
  ELSE
    RAISE EXCEPTION 'BUG-014 fix failed: Expected 3 policies, found %', v_count;
  END IF;
END $$;
