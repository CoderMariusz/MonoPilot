-- Migration: Create supplier_products table
-- Story: 03.2 - Supplier-Product Assignment
-- PRD: FR-PLAN-002, FR-PLAN-003
-- Description: Junction table for supplier-product assignments with RLS

-- ============================================================================
-- CREATE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS supplier_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  is_default BOOLEAN DEFAULT false,
  supplier_product_code TEXT,
  unit_price DECIMAL(15,4),
  currency TEXT,
  lead_time_days INTEGER,
  moq DECIMAL(15,4),
  order_multiple DECIMAL(15,4),
  last_purchase_date DATE,
  last_purchase_price DECIMAL(15,4),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT supplier_products_unique UNIQUE(supplier_id, product_id),
  CONSTRAINT supplier_products_price_positive CHECK (unit_price IS NULL OR unit_price > 0),
  CONSTRAINT supplier_products_moq_positive CHECK (moq IS NULL OR moq > 0),
  CONSTRAINT supplier_products_order_multiple_positive CHECK (order_multiple IS NULL OR order_multiple > 0),
  CONSTRAINT supplier_products_lead_time_non_negative CHECK (lead_time_days IS NULL OR lead_time_days >= 0),
  CONSTRAINT supplier_products_currency_valid CHECK (currency IS NULL OR currency IN ('PLN', 'EUR', 'USD', 'GBP')),
  CONSTRAINT supplier_products_supplier_code_length CHECK (supplier_product_code IS NULL OR length(supplier_product_code) <= 50),
  CONSTRAINT supplier_products_notes_length CHECK (notes IS NULL OR length(notes) <= 1000)
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================
CREATE INDEX idx_supplier_products_supplier ON supplier_products(supplier_id);
CREATE INDEX idx_supplier_products_product ON supplier_products(product_id);
CREATE INDEX idx_supplier_products_default ON supplier_products(product_id, is_default) WHERE is_default = true;

-- ============================================================================
-- ENABLE RLS
-- ============================================================================
ALTER TABLE supplier_products ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES (ADR-013: Via supplier FK chain)
-- ============================================================================

-- SELECT: Users can only read supplier-products for their org's suppliers
CREATE POLICY "supplier_products_org_isolation" ON supplier_products
  FOR SELECT USING (
    supplier_id IN (
      SELECT id FROM suppliers
      WHERE org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    )
  );

-- INSERT: Users can only create assignments for their org's suppliers
CREATE POLICY "supplier_products_insert" ON supplier_products
  FOR INSERT WITH CHECK (
    supplier_id IN (
      SELECT id FROM suppliers
      WHERE org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    )
  );

-- UPDATE: Users can only update assignments for their org's suppliers
CREATE POLICY "supplier_products_update" ON supplier_products
  FOR UPDATE USING (
    supplier_id IN (
      SELECT id FROM suppliers
      WHERE org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    )
  );

-- DELETE: Users can only delete assignments for their org's suppliers
CREATE POLICY "supplier_products_delete" ON supplier_products
  FOR DELETE USING (
    supplier_id IN (
      SELECT id FROM suppliers
      WHERE org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    )
  );

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================
GRANT ALL ON supplier_products TO authenticated;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Create updated_at trigger (reuse existing function)
CREATE TRIGGER supplier_products_updated_at
  BEFORE UPDATE ON supplier_products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- RPC FUNCTION: Atomic default supplier toggle
-- Ensures only one supplier can be default per product
-- ============================================================================
CREATE OR REPLACE FUNCTION set_default_supplier_product(
  p_supplier_id UUID,
  p_product_id UUID
) RETURNS void AS $$
BEGIN
  -- Unset all defaults for this product (within same org via RLS)
  UPDATE supplier_products
  SET is_default = false, updated_at = NOW()
  WHERE product_id = p_product_id AND is_default = true;

  -- Set new default
  UPDATE supplier_products
  SET is_default = true, updated_at = NOW()
  WHERE supplier_id = p_supplier_id AND product_id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION set_default_supplier_product(UUID, UUID) TO authenticated;

-- ============================================================================
-- UPDATE SUPPLIER DEPENDENCY COUNTS FUNCTION
-- Now includes supplier_products count (as mentioned in Story 03.1)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_supplier_dependency_counts(p_supplier_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_org_id UUID;
  v_user_org_id UUID;
  v_po_count INTEGER := 0;
  v_open_po_count INTEGER := 0;
  v_product_count INTEGER := 0;
BEGIN
  -- Get caller's org_id first (for explicit RLS verification)
  SELECT org_id INTO v_user_org_id FROM users WHERE id = auth.uid();

  IF v_user_org_id IS NULL THEN
    RAISE EXCEPTION 'User not found or not authenticated';
  END IF;

  -- Get supplier's org_id (RLS will filter based on caller's session)
  SELECT org_id INTO v_org_id
  FROM suppliers
  WHERE id = p_supplier_id AND org_id = v_user_org_id;

  -- If supplier not found (either doesn't exist or belongs to different org)
  IF v_org_id IS NULL THEN
    RETURN json_build_object(
      'error', 'Supplier not found',
      'po_count', 0,
      'open_po_count', 0,
      'product_count', 0
    );
  END IF;

  -- Count products assigned to supplier
  SELECT COUNT(*) INTO v_product_count
  FROM supplier_products
  WHERE supplier_id = p_supplier_id;

  -- Count total purchase orders (will be updated in Story 03.3)
  -- v_po_count := 0;
  -- v_open_po_count := 0;

  RETURN json_build_object(
    'po_count', v_po_count,
    'open_po_count', v_open_po_count,
    'product_count', v_product_count
  );
END;
$$;

-- Comments for documentation
COMMENT ON TABLE supplier_products IS 'Junction table linking suppliers to products with pricing overrides (Story 03.2)';
COMMENT ON COLUMN supplier_products.is_default IS 'Only ONE can be true per product_id - enforced in service layer';
COMMENT ON COLUMN supplier_products.supplier_product_code IS 'Supplier SKU for this product (appears on PO exports)';
COMMENT ON COLUMN supplier_products.unit_price IS 'Negotiated price per unit - pre-fills PO line price';
COMMENT ON COLUMN supplier_products.lead_time_days IS 'Override for product.supplier_lead_time_days';
COMMENT ON COLUMN supplier_products.moq IS 'Minimum order quantity for this supplier';
COMMENT ON COLUMN supplier_products.order_multiple IS 'Must order in multiples of this quantity';
COMMENT ON COLUMN supplier_products.last_purchase_date IS 'Auto-updated when PO is confirmed (Story 03.3)';
COMMENT ON COLUMN supplier_products.last_purchase_price IS 'Price from last confirmed PO (Story 03.3)';
