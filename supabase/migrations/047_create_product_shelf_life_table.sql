BEGIN;

CREATE TABLE product_shelf_life (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

  -- Calculation results
  calculated_days INTEGER, -- From min(ingredient shelf lives)
  override_days INTEGER, -- User override
  final_days INTEGER NOT NULL, -- Used value (override ?? calculated)

  -- Metadata
  calculation_method TEXT CHECK (calculation_method IN ('manual', 'auto_min_ingredients')),
  shortest_ingredient_id UUID REFERENCES products(id), -- Material with shortest shelf life
  storage_conditions TEXT, -- e.g., "Refrigerated 2-8°C"

  -- Timestamps
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- Constraints
  UNIQUE(org_id, product_id),
  CHECK (calculated_days IS NULL OR calculated_days > 0),
  CHECK (override_days IS NULL OR override_days > 0),
  CHECK (final_days > 0)
);

-- Indexes
CREATE INDEX idx_product_shelf_life_org_id ON product_shelf_life(org_id);
CREATE INDEX idx_product_shelf_life_product_id ON product_shelf_life(product_id);

-- RLS
ALTER TABLE product_shelf_life ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_product_shelf_life ON product_shelf_life
  FOR SELECT USING (org_id = auth_org_id());

CREATE POLICY insert_product_shelf_life ON product_shelf_life
  FOR INSERT WITH CHECK (org_id = auth_org_id());

CREATE POLICY update_product_shelf_life ON product_shelf_life
  FOR UPDATE USING (org_id = auth_org_id());

CREATE POLICY delete_product_shelf_life ON product_shelf_life
  FOR DELETE USING (org_id = auth_org_id());

-- Comments
COMMENT ON TABLE product_shelf_life IS 'Tracks calculated and override shelf life for products';
COMMENT ON COLUMN product_shelf_life.calculated_days IS 'Auto-calculated from min(ingredient shelf lives)';
COMMENT ON COLUMN product_shelf_life.override_days IS 'Manual override by user';
COMMENT ON COLUMN product_shelf_life.final_days IS 'Effective shelf life (override takes precedence)';

COMMIT;

-- Rollback
-- DROP TABLE product_shelf_life CASCADE;
