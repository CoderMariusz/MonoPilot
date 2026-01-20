-- Migration 127: Create wo_material_consumptions table
-- Story 04.6a: Material Consumption Desktop
-- Records material consumption from LPs during production

-- ============================================
-- 1. Create wo_material_consumptions table
-- ============================================
CREATE TABLE IF NOT EXISTS public.wo_material_consumptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Work Order Reference
  wo_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,

  -- Material Reference
  wo_material_id UUID NOT NULL REFERENCES wo_materials(id) ON DELETE CASCADE,

  -- License Plate
  lp_id UUID NOT NULL REFERENCES license_plates(id) ON DELETE CASCADE,

  -- Product (denormalized for history)
  product_id UUID NOT NULL REFERENCES products(id),

  -- Consumption Details
  consumed_qty DECIMAL(15,6) NOT NULL,
  uom TEXT NOT NULL,
  is_full_lp BOOLEAN DEFAULT false,

  -- LP Details (denormalized for history display)
  lp_batch_number TEXT,
  lp_expiry_date DATE,

  -- User tracking
  consumed_by UUID REFERENCES users(id),
  consumed_at TIMESTAMPTZ DEFAULT NOW(),

  -- Reversal fields
  reversed_at TIMESTAMPTZ,
  reversed_by UUID REFERENCES users(id),
  reversal_reason TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'active',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT wo_material_consumptions_qty_positive CHECK (consumed_qty > 0),
  CONSTRAINT wo_material_consumptions_status_check CHECK (status IN ('active', 'reversed'))
);

-- ============================================
-- 2. Create Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_wo_material_consumptions_org ON wo_material_consumptions(org_id);
CREATE INDEX IF NOT EXISTS idx_wo_material_consumptions_wo ON wo_material_consumptions(wo_id);
CREATE INDEX IF NOT EXISTS idx_wo_material_consumptions_lp ON wo_material_consumptions(lp_id);
CREATE INDEX IF NOT EXISTS idx_wo_material_consumptions_material ON wo_material_consumptions(wo_material_id);
CREATE INDEX IF NOT EXISTS idx_wo_material_consumptions_status ON wo_material_consumptions(status);
CREATE INDEX IF NOT EXISTS idx_wo_material_consumptions_consumed_at ON wo_material_consumptions(consumed_at DESC);

-- ============================================
-- 3. Enable RLS
-- ============================================
ALTER TABLE wo_material_consumptions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. RLS Policies
-- ============================================
-- SELECT policy - all allowed roles
CREATE POLICY "wo_material_consumptions_select"
  ON wo_material_consumptions FOR SELECT
  USING (
    org_id = (auth.jwt() ->> 'org_id')::uuid
  );

-- INSERT policy - operators and above
CREATE POLICY "wo_material_consumptions_insert"
  ON wo_material_consumptions FOR INSERT
  WITH CHECK (
    org_id = (auth.jwt() ->> 'org_id')::uuid
  );

-- UPDATE policy - managers only (for reversal)
CREATE POLICY "wo_material_consumptions_update"
  ON wo_material_consumptions FOR UPDATE
  USING (
    org_id = (auth.jwt() ->> 'org_id')::uuid
  );

-- ============================================
-- 5. Updated_at trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_wo_material_consumptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_wo_material_consumptions_updated_at ON wo_material_consumptions;
CREATE TRIGGER trigger_wo_material_consumptions_updated_at
  BEFORE UPDATE ON wo_material_consumptions
  FOR EACH ROW
  EXECUTE FUNCTION update_wo_material_consumptions_updated_at();

-- ============================================
-- 6. Comments
-- ============================================
COMMENT ON TABLE wo_material_consumptions IS 'Material consumption records for work orders (Story 04.6a)';
COMMENT ON COLUMN wo_material_consumptions.status IS 'active = valid consumption, reversed = correction made';
COMMENT ON COLUMN wo_material_consumptions.is_full_lp IS 'True if entire LP was consumed in this transaction';
COMMENT ON COLUMN wo_material_consumptions.lp_batch_number IS 'Denormalized batch number for history display';
COMMENT ON COLUMN wo_material_consumptions.lp_expiry_date IS 'Denormalized expiry date for history display';
