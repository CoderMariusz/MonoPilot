-- Migration 012 Patch: Update RLS policies to allow service role bypass
-- This enables integration tests using service role key
-- Date: 2025-11-22

-- ============================================================================
-- UPDATE RLS POLICIES TO ALLOW SERVICE ROLE
-- ============================================================================

-- Policy: Service role + Users can see tax codes from their organization
DROP POLICY IF EXISTS tax_codes_select_policy ON public.tax_codes;
CREATE POLICY tax_codes_select_policy ON public.tax_codes
  FOR SELECT
  USING (
    auth.role() = 'service_role' OR
    org_id = (auth.jwt() ->> 'org_id')::uuid
  );

-- Policy: Service role + Admin can insert tax codes
DROP POLICY IF EXISTS tax_codes_insert_policy ON public.tax_codes;
CREATE POLICY tax_codes_insert_policy ON public.tax_codes
  FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role' OR
    (
      org_id = (auth.jwt() ->> 'org_id')::uuid
      AND EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = 'admin'
        AND org_id = (auth.jwt() ->> 'org_id')::uuid
      )
    )
  );

-- Policy: Service role + Admin can update tax codes
DROP POLICY IF EXISTS tax_codes_update_policy ON public.tax_codes;
CREATE POLICY tax_codes_update_policy ON public.tax_codes
  FOR UPDATE
  USING (
    auth.role() = 'service_role' OR
    (
      org_id = (auth.jwt() ->> 'org_id')::uuid
      AND EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = 'admin'
        AND org_id = (auth.jwt() ->> 'org_id')::uuid
      )
    )
  )
  WITH CHECK (
    auth.role() = 'service_role' OR
    org_id = (auth.jwt() ->> 'org_id')::uuid
  );

-- Policy: Service role + Admin can delete tax codes
DROP POLICY IF EXISTS tax_codes_delete_policy ON public.tax_codes;
CREATE POLICY tax_codes_delete_policy ON public.tax_codes
  FOR DELETE
  USING (
    auth.role() = 'service_role' OR
    (
      org_id = (auth.jwt() ->> 'org_id')::uuid
      AND EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = 'admin'
        AND org_id = (auth.jwt() ->> 'org_id')::uuid
      )
    )
  );

COMMENT ON POLICY tax_codes_select_policy ON public.tax_codes IS 'Allow service role (for tests) and users to view tax codes from their org';
COMMENT ON POLICY tax_codes_insert_policy ON public.tax_codes IS 'Allow service role (for tests) and admins to create tax codes';
COMMENT ON POLICY tax_codes_update_policy ON public.tax_codes IS 'Allow service role (for tests) and admins to update tax codes';
COMMENT ON POLICY tax_codes_delete_policy ON public.tax_codes IS 'Allow service role (for tests) and admins to delete tax codes';
