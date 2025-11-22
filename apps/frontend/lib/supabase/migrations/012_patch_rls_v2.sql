-- Migration 012 Patch V2: Update RLS policies to allow service role bypass
-- Uses proper Supabase JWT role checking
-- Date: 2025-11-22

-- ============================================================================
-- UPDATE RLS POLICIES TO ALLOW SERVICE ROLE
-- ============================================================================

-- Policy: Service role + Users can see tax codes from their organization
DROP POLICY IF EXISTS tax_codes_select_policy ON public.tax_codes;
CREATE POLICY tax_codes_select_policy ON public.tax_codes
  FOR SELECT
  USING (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    org_id = (auth.jwt() ->> 'org_id')::uuid
  );

-- Policy: Service role + Admin can insert tax codes
DROP POLICY IF EXISTS tax_codes_insert_policy ON public.tax_codes;
CREATE POLICY tax_codes_insert_policy ON public.tax_codes
  FOR INSERT
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
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
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
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
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    org_id = (auth.jwt() ->> 'org_id')::uuid
  );

-- Policy: Service role + Admin can delete tax codes
DROP POLICY IF EXISTS tax_codes_delete_policy ON public.tax_codes;
CREATE POLICY tax_codes_delete_policy ON public.tax_codes
  FOR DELETE
  USING (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
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

COMMENT ON POLICY tax_codes_select_policy ON public.tax_codes IS 'Allow service role (via JWT) and users to view tax codes from their org';
COMMENT ON POLICY tax_codes_insert_policy ON public.tax_codes IS 'Allow service role (via JWT) and admins to create tax codes';
COMMENT ON POLICY tax_codes_update_policy ON public.tax_codes IS 'Allow service role (via JWT) and admins to update tax codes';
COMMENT ON POLICY tax_codes_delete_policy ON public.tax_codes IS 'Allow service role (via JWT) and admins to delete tax codes';
