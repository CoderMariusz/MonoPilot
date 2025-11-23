-- Migration 025: Create BOM Items Table
-- Epic 2 - Batch 2B: BOM System
-- Stories: 2.7, 2.12, 2.13
-- Date: 2025-01-23

-- ============================================================================
-- TABLE: bom_items
-- ============================================================================

CREATE TABLE IF NOT EXISTS bom_items (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  bom_id UUID NOT NULL REFERENCES boms(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,

  -- Quantity and UoM
  quantity NUMERIC(10,3) NOT NULL CHECK (quantity > 0),
  uom TEXT NOT NULL,
  scrap_percent NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (scrap_percent >= 0 AND scrap_percent <= 100),

  -- Sequencing and display
  sequence INTEGER NOT NULL CHECK (sequence > 0),

  -- Consumption flags
  consume_whole_lp BOOLEAN NOT NULL DEFAULT false,

  -- By-products (Story 2.13)
  is_by_product BOOLEAN NOT NULL DEFAULT false,
  yield_percent NUMERIC(5,2) CHECK (
    (is_by_product = false) OR
    (is_by_product = true AND yield_percent IS NOT NULL AND yield_percent >= 0 AND yield_percent <= 100)
  ),

  -- Conditional items (Story 2.12)
  condition_flags TEXT[],                    -- Array of condition flags
  condition_logic TEXT CHECK (condition_logic IN ('AND', 'OR')),

  -- Notes
  notes TEXT,

  -- Audit trail
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bom_items_bom ON bom_items(bom_id, sequence);
CREATE INDEX IF NOT EXISTS idx_bom_items_product ON bom_items(product_id);
CREATE INDEX IF NOT EXISTS idx_bom_items_by_product ON bom_items(bom_id) WHERE is_by_product = true;

-- RLS: Inherit org_id from bom
ALTER TABLE bom_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bom_items_org_isolation" ON bom_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM boms
      WHERE boms.id = bom_items.bom_id
      AND boms.org_id = (auth.jwt() ->> 'org_id')::uuid
    )
  );

-- Auto-update timestamp
CREATE TRIGGER update_bom_items_timestamp
  BEFORE UPDATE ON bom_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON bom_items TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON bom_items TO authenticated;
GRANT SELECT ON bom_items TO anon;

-- Comments
COMMENT ON TABLE bom_items IS 'BOM line items - materials/components with quantities, conditions, and by-products (Stories 2.7, 2.12, 2.13)';
COMMENT ON COLUMN bom_items.sequence IS 'Display order (drag-drop reorderable)';
COMMENT ON COLUMN bom_items.scrap_percent IS 'Expected scrap percentage (0-100)';
COMMENT ON COLUMN bom_items.consume_whole_lp IS 'If true, consume entire license plate';
COMMENT ON COLUMN bom_items.is_by_product IS 'If true, this is an output by-product, not an input';
COMMENT ON COLUMN bom_items.yield_percent IS 'By-product yield as percentage of main output (required if is_by_product=true)';
COMMENT ON COLUMN bom_items.condition_flags IS 'Conditional flags (e.g., [organic, vegan]) - only consumed when WO matches';
COMMENT ON COLUMN bom_items.condition_logic IS 'AND = all flags must match, OR = any flag must match';
