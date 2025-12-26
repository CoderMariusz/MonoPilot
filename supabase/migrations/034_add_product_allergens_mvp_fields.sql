-- Migration: Add MVP fields to product_allergens table
-- Story: 02.3 - Product Allergens Declaration (MVP)
-- Purpose: Add relation_type, source, reason, source_product_ids for allergen inheritance
-- Date: 2024-12-24

-- =====================================================
-- DESIGN DECISIONS (MVP Scope)
-- =====================================================
-- 1. relation_type: 'contains' | 'may_contain' (EU labeling requirement)
-- 2. source: 'auto' | 'manual' (track inheritance vs manual declaration)
-- 3. reason: TEXT field (required for may_contain per AC-08)
-- 4. source_product_ids: UUID[] (track which BOM ingredients contribute allergen)
-- 5. updated_at: Track when allergen declaration last changed
-- 6. Allow same allergen with different relation_type (unique constraint change)

-- =====================================================
-- 1. Drop existing unique constraint
-- =====================================================

ALTER TABLE product_allergens
DROP CONSTRAINT IF EXISTS uq_product_allergen;

-- =====================================================
-- 2. Add new columns
-- =====================================================

-- Add relation_type column (contains | may_contain)
ALTER TABLE product_allergens
ADD COLUMN IF NOT EXISTS relation_type TEXT NOT NULL DEFAULT 'contains'
CHECK (relation_type IN ('contains', 'may_contain'));

-- Add source column (auto | manual)
ALTER TABLE product_allergens
ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual'
CHECK (source IN ('auto', 'manual'));

-- Add reason column (required for may_contain)
ALTER TABLE product_allergens
ADD COLUMN IF NOT EXISTS reason TEXT;

-- Add source_product_ids array (for auto-inherited allergens)
ALTER TABLE product_allergens
ADD COLUMN IF NOT EXISTS source_product_ids UUID[];

-- Add updated_at column
ALTER TABLE product_allergens
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- =====================================================
-- 3. Add new unique constraint
-- =====================================================

-- Allow same allergen with different relation_type
-- (e.g., Contains Gluten + May Contain Gluten)
ALTER TABLE product_allergens
ADD CONSTRAINT uq_product_allergen_relation
UNIQUE(product_id, allergen_id, relation_type);

-- =====================================================
-- 4. Add indexes for new columns
-- =====================================================

-- Index for filtering by source (auto vs manual)
CREATE INDEX IF NOT EXISTS idx_product_allergens_source
ON product_allergens(source);

-- Index for filtering by relation_type
CREATE INDEX IF NOT EXISTS idx_product_allergens_relation
ON product_allergens(product_id, relation_type);

-- =====================================================
-- 5. Add trigger for updated_at timestamp
-- =====================================================

CREATE OR REPLACE FUNCTION update_product_allergens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER product_allergens_updated_at
  BEFORE UPDATE ON product_allergens
  FOR EACH ROW
  EXECUTE FUNCTION update_product_allergens_updated_at();

-- =====================================================
-- 6. Update RLS policies (no UPDATE policy exists yet)
-- =====================================================

-- UPDATE policy: Users can update product-allergen links for their org
CREATE POLICY product_allergens_update
  ON product_allergens
  FOR UPDATE
  TO authenticated
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()))
  WITH CHECK (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- =====================================================
-- 7. Update table and column comments
-- =====================================================

COMMENT ON COLUMN product_allergens.relation_type IS 'Type of allergen relation: contains (present in ingredients) or may_contain (cross-contamination risk)';
COMMENT ON COLUMN product_allergens.source IS 'Source of allergen declaration: auto (inherited from BOM) or manual (user-declared)';
COMMENT ON COLUMN product_allergens.reason IS 'Reason for may_contain declaration (required for cross-contamination risk explanation)';
COMMENT ON COLUMN product_allergens.source_product_ids IS 'Array of product IDs (BOM ingredients) that contribute this allergen (for auto-inherited allergens)';
COMMENT ON COLUMN product_allergens.updated_at IS 'Last time allergen declaration was updated';

-- =====================================================
-- Migration complete
-- =====================================================
-- Added columns: relation_type, source, reason, source_product_ids, updated_at
-- Updated constraint: UNIQUE(product_id, allergen_id, relation_type)
-- Added indexes: source, relation_type
-- Added trigger: update_product_allergens_updated_at
-- Added RLS policy: UPDATE policy for org isolation
