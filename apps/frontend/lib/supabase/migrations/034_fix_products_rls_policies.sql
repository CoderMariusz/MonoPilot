-- Migration 034: Fix RLS Policies for Products Tables
-- Fixes RLS policies to allow authenticated user operations for all products-related tables
-- Date: 2025-11-25
-- Author: Claude Code
--
-- Tables covered:
--   1. products
--   2. product_version_history
--   3. product_allergens
--   4. product_type_config
--   5. technical_settings
--
-- Issue: RLS policies used simple FOR ALL clause which doesn't properly handle authenticated users
-- Solution: Split into SELECT, INSERT, UPDATE, DELETE with explicit admin checks

-- ============================================================================
-- 1. PRODUCTS TABLE RLS POLICIES
-- ============================================================================

-- Drop existing policy
DROP POLICY IF EXISTS "products_org_isolation" ON public.products;

-- Create policies with service_role bypass and admin checks
CREATE POLICY products_select_policy ON public.products
  FOR SELECT
  USING (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    org_id = (auth.jwt() ->> 'org_id')::uuid
  );

CREATE POLICY products_insert_policy ON public.products
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

CREATE POLICY products_update_policy ON public.products
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

CREATE POLICY products_delete_policy ON public.products
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

-- ============================================================================
-- 2. PRODUCT_VERSION_HISTORY TABLE RLS POLICIES
-- ============================================================================

-- Drop existing policy
DROP POLICY IF EXISTS "product_version_history_org_isolation" ON public.product_version_history;

-- Create policies
CREATE POLICY product_version_history_select_policy ON public.product_version_history
  FOR SELECT
  USING (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    org_id = (auth.jwt() ->> 'org_id')::uuid
  );

CREATE POLICY product_version_history_insert_policy ON public.product_version_history
  FOR INSERT
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    org_id = (auth.jwt() ->> 'org_id')::uuid
  );

-- ============================================================================
-- 3. PRODUCT_ALLERGENS TABLE RLS POLICIES
-- ============================================================================

-- Drop existing policy
DROP POLICY IF EXISTS "product_allergens_org_isolation" ON public.product_allergens;

-- Create policies
CREATE POLICY product_allergens_select_policy ON public.product_allergens
  FOR SELECT
  USING (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    org_id = (auth.jwt() ->> 'org_id')::uuid
  );

CREATE POLICY product_allergens_insert_policy ON public.product_allergens
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

CREATE POLICY product_allergens_update_policy ON public.product_allergens
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

CREATE POLICY product_allergens_delete_policy ON public.product_allergens
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

-- ============================================================================
-- 4. PRODUCT_TYPE_CONFIG TABLE RLS POLICIES
-- ============================================================================

-- Drop existing policy
DROP POLICY IF EXISTS "product_type_config_org_isolation" ON public.product_type_config;

-- Create policies
CREATE POLICY product_type_config_select_policy ON public.product_type_config
  FOR SELECT
  USING (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    org_id = (auth.jwt() ->> 'org_id')::uuid
  );

CREATE POLICY product_type_config_insert_policy ON public.product_type_config
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

CREATE POLICY product_type_config_update_policy ON public.product_type_config
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

CREATE POLICY product_type_config_delete_policy ON public.product_type_config
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

-- ============================================================================
-- 5. TECHNICAL_SETTINGS TABLE RLS POLICIES
-- ============================================================================

-- Drop existing policy
DROP POLICY IF EXISTS "technical_settings_org_isolation" ON public.technical_settings;

-- Create policies
CREATE POLICY technical_settings_select_policy ON public.technical_settings
  FOR SELECT
  USING (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    org_id = (auth.jwt() ->> 'org_id')::uuid
  );

CREATE POLICY technical_settings_insert_policy ON public.technical_settings
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

CREATE POLICY technical_settings_update_policy ON public.technical_settings
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

-- ============================================================================
-- VERIFICATION COMMENTS
-- ============================================================================

COMMENT ON POLICY products_select_policy ON public.products IS 'Migration 034: Service role + org users can view products';
COMMENT ON POLICY products_insert_policy ON public.products IS 'Migration 034: Service role + admins can create products';
COMMENT ON POLICY products_update_policy ON public.products IS 'Migration 034: Service role + admins can update products';
COMMENT ON POLICY products_delete_policy ON public.products IS 'Migration 034: Service role + admins can delete products';
