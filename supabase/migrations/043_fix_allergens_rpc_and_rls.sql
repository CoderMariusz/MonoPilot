-- Migration: Fix Allergen RPC functions and RLS policies
-- Story: TD-209 & Permissions Fix
-- Purpose: Restore missing RPC functions and fix RLS role codes for allergens
-- Date: 2025-12-26

-- =====================================================
-- 1. Restore RPC: get_allergen_product_count
-- =====================================================

CREATE OR REPLACE FUNCTION get_allergen_product_count(p_allergen_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_org_id UUID;
  v_count INTEGER;
BEGIN
  -- Get current user's org_id
  SELECT org_id INTO v_user_org_id
  FROM users
  WHERE id = auth.uid();

  -- Return 0 if not authenticated
  IF v_user_org_id IS NULL THEN
    RETURN 0;
  END IF;

  -- Count products linked to this allergen in user's org
  -- Use DISTINCT because a product might have multiple relation_types for same allergen
  SELECT COUNT(DISTINCT pa.product_id)::INTEGER INTO v_count
  FROM product_allergens pa
  JOIN products p ON p.id = pa.product_id AND p.deleted_at IS NULL
  WHERE pa.allergen_id = p_allergen_id
  AND pa.org_id = v_user_org_id;

  RETURN COALESCE(v_count, 0);
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_allergen_product_count(UUID) TO authenticated;

-- Function comment
COMMENT ON FUNCTION get_allergen_product_count(UUID) IS 'Returns count of unique active products containing specified allergen for current user org';

-- =====================================================
-- 2. Restore RPC: get_all_allergen_product_counts (BATCH)
-- =====================================================

CREATE OR REPLACE FUNCTION get_all_allergen_product_counts()
RETURNS TABLE(allergen_id UUID, product_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_org_id UUID;
BEGIN
  -- Get current user's org_id
  SELECT u.org_id INTO v_user_org_id
  FROM users u
  WHERE u.id = auth.uid();

  -- Return empty if not authenticated
  IF v_user_org_id IS NULL THEN
    RETURN;
  END IF;

  -- Return counts for all allergens (including those with 0 products)
  -- Use DISTINCT because a product might have multiple relation_types for same allergen (Story 02.3)
  RETURN QUERY
  SELECT
    a.id AS allergen_id,
    COALESCE(COUNT(DISTINCT pa.product_id), 0)::INTEGER AS product_count
  FROM allergens a
  LEFT JOIN product_allergens pa ON pa.allergen_id = a.id AND pa.org_id = v_user_org_id
  LEFT JOIN products p ON p.id = pa.product_id AND p.deleted_at IS NULL
  WHERE a.is_active = true
  GROUP BY a.id, a.display_order
  ORDER BY a.display_order;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_all_allergen_product_counts() TO authenticated;

-- Function comment
COMMENT ON FUNCTION get_all_allergen_product_counts() IS 'Returns unique product count for all active allergens in current user org. Efficient batch query for allergens list page.';

-- =====================================================
-- 3. Restore RPC: get_products_by_allergen
-- =====================================================

CREATE OR REPLACE FUNCTION get_products_by_allergen(p_allergen_id UUID)
RETURNS TABLE(product_id UUID, product_code VARCHAR, product_name VARCHAR)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_org_id UUID;
BEGIN
  -- Get current user's org_id
  SELECT u.org_id INTO v_user_org_id
  FROM users u
  WHERE u.id = auth.uid();

  -- Return empty if not authenticated
  IF v_user_org_id IS NULL THEN
    RETURN;
  END IF;

  -- Return unique products linked to this allergen in user's org
  RETURN QUERY
  SELECT DISTINCT
    p.id AS product_id,
    p.code AS product_code,
    p.name AS product_name
  FROM product_allergens pa
  JOIN products p ON p.id = pa.product_id AND p.deleted_at IS NULL
  WHERE pa.allergen_id = p_allergen_id
  AND pa.org_id = v_user_org_id
  ORDER BY p.code;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_products_by_allergen(UUID) TO authenticated;

-- Function comment
COMMENT ON FUNCTION get_products_by_allergen(UUID) IS 'Returns list of unique products containing specified allergen for current user org. Used for allergen -> products navigation.';

-- =====================================================
-- 4. Fix product_allergens RLS policies
-- =====================================================

-- Drop old policies with incorrect role codes (SUPER_ADMIN/ADMIN)
DROP POLICY IF EXISTS product_allergens_select ON product_allergens;
DROP POLICY IF EXISTS product_allergens_insert ON product_allergens;
DROP POLICY IF EXISTS product_allergens_update ON product_allergens;
DROP POLICY IF EXISTS product_allergens_delete ON product_allergens;

-- SELECT policy: Users can read product-allergen links for their org
CREATE POLICY product_allergens_select
  ON product_allergens
  FOR SELECT
  TO authenticated
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- INSERT policy: Users (owner, admin, production_manager) can create links
CREATE POLICY product_allergens_insert
  ON product_allergens
  FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
      SELECT r.code
      FROM roles r
      JOIN users u ON u.role_id = r.id
      WHERE u.id = auth.uid()
    ) IN ('owner', 'admin', 'production_manager')
  );

-- UPDATE policy: Users (owner, admin, production_manager) can update links
CREATE POLICY product_allergens_update
  ON product_allergens
  FOR UPDATE
  TO authenticated
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()))
  WITH CHECK (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
      SELECT r.code
      FROM roles r
      JOIN users u ON u.role_id = r.id
      WHERE u.id = auth.uid()
    ) IN ('owner', 'admin', 'production_manager')
  );

-- DELETE policy: Users (owner, admin) can remove links
CREATE POLICY product_allergens_delete
  ON product_allergens
  FOR DELETE
  TO authenticated
  USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
      SELECT r.code
      FROM roles r
      JOIN users u ON u.role_id = r.id
      WHERE u.id = auth.uid()
    ) IN ('owner', 'admin')
  );

-- =====================================================
-- 5. Verification
-- =====================================================
-- This query can be used in Supabase dashboard to verify functions exist
-- SELECT routine_name, routine_type 
-- FROM information_schema.routines 
-- WHERE routine_name IN ('get_allergen_product_count', 'get_all_allergen_product_counts', 'get_products_by_allergen');
