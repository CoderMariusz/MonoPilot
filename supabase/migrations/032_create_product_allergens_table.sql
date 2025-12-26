-- Migration: Create product_allergens junction table
-- Story: TD-209 - Products Column in Allergens Table
-- Purpose: Many-to-many relationship between products and allergens for labeling compliance
-- Date: 2025-12-24

-- =====================================================
-- DESIGN DECISIONS
-- =====================================================
-- 1. Junction table with composite unique constraint (product_id, allergen_id)
-- 2. org_id required for RLS filtering (products are org-scoped)
-- 3. Cascade delete when product deleted (remove associations)
-- 4. Cascade delete when allergen deleted (remove associations)
--    Note: Allergens are global reference data, rarely deleted
-- 5. Soft delete not needed - junction table is simple association
-- 6. No "amount" or "percentage" field - MVP just tracks presence
--    Future: Add concentration_level, declaration_type (contains/may_contain)
-- 7. created_by for audit trail of who linked allergen to product

-- =====================================================
-- 1. Create product_allergens table
-- =====================================================

CREATE TABLE IF NOT EXISTS product_allergens (
  -- Core fields
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  allergen_id UUID NOT NULL REFERENCES allergens(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),

  -- Constraints
  CONSTRAINT uq_product_allergen UNIQUE(product_id, allergen_id)
);

-- =====================================================
-- 2. Create indexes for performance
-- =====================================================

-- Index for looking up allergens by product (common query: product detail page)
CREATE INDEX IF NOT EXISTS idx_product_allergens_product
ON product_allergens(product_id);

-- Index for looking up products by allergen (TD-209: count products per allergen)
CREATE INDEX IF NOT EXISTS idx_product_allergens_allergen
ON product_allergens(allergen_id);

-- Index for RLS filtering (all queries filtered by org_id)
CREATE INDEX IF NOT EXISTS idx_product_allergens_org
ON product_allergens(org_id);

-- Composite index for org + allergen (efficient count query per org)
CREATE INDEX IF NOT EXISTS idx_product_allergens_org_allergen
ON product_allergens(org_id, allergen_id);

-- =====================================================
-- 3. Enable Row-Level Security (RLS)
-- =====================================================

ALTER TABLE product_allergens ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. RLS Policies (ADR-013 pattern: users table lookup)
-- =====================================================

-- SELECT policy: Users can read product-allergen links for their org
CREATE POLICY product_allergens_select
  ON product_allergens
  FOR SELECT
  TO authenticated
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- INSERT policy: Users can create product-allergen links for their org
CREATE POLICY product_allergens_insert
  ON product_allergens
  FOR INSERT
  TO authenticated
  WITH CHECK (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- DELETE policy: Users can remove product-allergen links for their org
-- Note: Only ADMIN and SUPER_ADMIN can delete (same as products policy)
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
    ) IN ('SUPER_ADMIN', 'ADMIN')
  );

-- =====================================================
-- 5. RPC function for getting product count per allergen
-- =====================================================

-- Function to get product count for a specific allergen (org-scoped)
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
  SELECT COUNT(*)::INTEGER INTO v_count
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
COMMENT ON FUNCTION get_allergen_product_count(UUID) IS 'Returns count of active products containing specified allergen for current user org';

-- =====================================================
-- 6. RPC function for getting all allergen counts (batch)
-- =====================================================

-- Function to get product counts for all allergens (efficient batch query)
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
  RETURN QUERY
  SELECT
    a.id AS allergen_id,
    COALESCE(COUNT(pa.id), 0)::INTEGER AS product_count
  FROM allergens a
  LEFT JOIN product_allergens pa ON pa.allergen_id = a.id AND pa.org_id = v_user_org_id
  LEFT JOIN products p ON p.id = pa.product_id AND p.deleted_at IS NULL
  WHERE a.is_active = true
  GROUP BY a.id
  ORDER BY a.display_order;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_all_allergen_product_counts() TO authenticated;

-- Function comment
COMMENT ON FUNCTION get_all_allergen_product_counts() IS 'Returns product count for all active allergens in current user org. Efficient batch query for allergens list page.';

-- =====================================================
-- 7. RPC function for getting products by allergen
-- =====================================================

-- Function to get product IDs for a specific allergen (for navigation)
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

  -- Return products linked to this allergen in user's org
  RETURN QUERY
  SELECT
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
COMMENT ON FUNCTION get_products_by_allergen(UUID) IS 'Returns list of products containing specified allergen for current user org. Used for allergen -> products navigation.';

-- =====================================================
-- 8. Table and column comments
-- =====================================================

COMMENT ON TABLE product_allergens IS 'Junction table linking products to allergens for EU labeling compliance (EU Reg 1169/2011). Org-scoped for multi-tenant isolation.';
COMMENT ON COLUMN product_allergens.id IS 'Primary key UUID';
COMMENT ON COLUMN product_allergens.product_id IS 'FK to products table (org-scoped)';
COMMENT ON COLUMN product_allergens.allergen_id IS 'FK to allergens table (global reference data)';
COMMENT ON COLUMN product_allergens.org_id IS 'FK to organizations for RLS filtering (must match product.org_id)';
COMMENT ON COLUMN product_allergens.created_at IS 'When allergen was linked to product';
COMMENT ON COLUMN product_allergens.created_by IS 'User who created the link (audit trail)';

-- =====================================================
-- 9. Trigger to auto-set org_id from product
-- =====================================================

-- Function to auto-set org_id from product on insert
CREATE OR REPLACE FUNCTION product_allergens_set_org_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Get org_id from product if not provided
  IF NEW.org_id IS NULL THEN
    SELECT p.org_id INTO NEW.org_id
    FROM products p
    WHERE p.id = NEW.product_id;
  END IF;

  -- Validate org_id matches product's org_id
  IF NEW.org_id != (SELECT org_id FROM products WHERE id = NEW.product_id) THEN
    RAISE EXCEPTION 'org_id must match product org_id';
  END IF;

  -- Auto-set created_by if not provided
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trg_product_allergens_set_org_id
  BEFORE INSERT ON product_allergens
  FOR EACH ROW
  EXECUTE FUNCTION product_allergens_set_org_id();

-- =====================================================
-- Migration complete
-- =====================================================
-- Table created: product_allergens (junction table)
-- Indexes created: product_id, allergen_id, org_id, composite org+allergen
-- RLS enabled: org-scoped read/write access
-- RPC functions:
--   get_allergen_product_count(UUID) - single allergen count
--   get_all_allergen_product_counts() - batch counts for all allergens
--   get_products_by_allergen(UUID) - products list for navigation
-- Trigger: Auto-set org_id from product
