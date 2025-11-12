-- Migration: 044_wo_by_products.sql
-- Description: Add wo_by_products table to track secondary outputs from work orders
-- Epic: EPIC-001 BOM Complexity v2 - Phase 1 (By-Products)
-- Created: 2025-01-11

-- ============================================================================
-- TABLE: wo_by_products
-- Purpose: Track secondary outputs from work orders (e.g., bones, trim from meat processing)
-- ============================================================================

CREATE TABLE IF NOT EXISTS wo_by_products (
  id SERIAL PRIMARY KEY,
  wo_id INTEGER NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  expected_quantity NUMERIC(12,4) NOT NULL,
  actual_quantity NUMERIC(12,4) DEFAULT 0,
  uom VARCHAR(20) NOT NULL,
  lp_id INTEGER REFERENCES license_plates(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT wo_by_products_expected_qty_positive CHECK (expected_quantity > 0),
  CONSTRAINT wo_by_products_actual_qty_non_negative CHECK (actual_quantity >= 0)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_wo_by_products_wo ON wo_by_products(wo_id);
CREATE INDEX idx_wo_by_products_product ON wo_by_products(product_id);
CREATE INDEX idx_wo_by_products_lp ON wo_by_products(lp_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE wo_by_products ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read/write all by-products
CREATE POLICY "authenticated_users_all" ON wo_by_products 
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Auto-update updated_at timestamp
CREATE TRIGGER update_wo_by_products_updated_at 
  BEFORE UPDATE ON wo_by_products
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE wo_by_products IS 'Secondary outputs from work orders (e.g., bones, trim from meat processing). Tracks both expected yield from BOM and actual quantities produced.';

COMMENT ON COLUMN wo_by_products.id IS 'Primary key';
COMMENT ON COLUMN wo_by_products.wo_id IS 'Work order that produced this by-product';
COMMENT ON COLUMN wo_by_products.product_id IS 'Product code of the by-product';
COMMENT ON COLUMN wo_by_products.expected_quantity IS 'Expected yield of by-product based on BOM (calculated from yield_percentage)';
COMMENT ON COLUMN wo_by_products.actual_quantity IS 'Actual quantity produced and recorded by operator';
COMMENT ON COLUMN wo_by_products.uom IS 'Unit of measure (e.g., kg, pcs)';
COMMENT ON COLUMN wo_by_products.lp_id IS 'License plate created for this by-product (NULL until produced)';
COMMENT ON COLUMN wo_by_products.notes IS 'Optional notes from production operator';
COMMENT ON COLUMN wo_by_products.created_at IS 'Timestamp when by-product record was created (WO creation)';
COMMENT ON COLUMN wo_by_products.updated_at IS 'Timestamp when by-product record was last updated';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

