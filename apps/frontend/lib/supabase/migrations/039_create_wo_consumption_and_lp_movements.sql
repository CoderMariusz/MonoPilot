-- Migration 039: Create wo_consumption and lp_movements tables
-- Epic 4 Batch 4B-1: Consumption (Story 4.10: Consumption Correction)
-- Creates consumption tracking and LP movement audit trail

-- ============================================
-- 1. Create wo_consumption table
-- ============================================
-- Records each material consumption event for WO

CREATE TABLE IF NOT EXISTS public.wo_consumption (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Work Order Reference
  wo_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,

  -- Material & Reservation
  material_id UUID NOT NULL REFERENCES wo_materials(id) ON DELETE CASCADE,
  reservation_id UUID NOT NULL REFERENCES wo_material_reservations(id) ON DELETE CASCADE,

  -- License Plate
  lp_id UUID NOT NULL REFERENCES license_plates(id) ON DELETE CASCADE,

  -- Consumption Details
  consumed_qty DECIMAL(15,6) NOT NULL,
  uom VARCHAR(20) NOT NULL,
  consumed_by_user_id UUID NOT NULL REFERENCES users(id),
  consumed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Operation Link (optional - for operation-level consumption)
  operation_id UUID REFERENCES wo_operations(id) ON DELETE SET NULL,

  -- Status & Reversal (Story 4.10)
  status VARCHAR(20) NOT NULL DEFAULT 'consumed',
  reversed_at TIMESTAMP WITH TIME ZONE,
  reversed_by_user_id UUID REFERENCES users(id),
  reverse_reason TEXT,

  -- Notes
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT wo_consumption_status_check CHECK (
    status IN ('consumed', 'reversed')
  ),
  CONSTRAINT wo_consumption_qty_positive CHECK (
    consumed_qty > 0
  ),
  CONSTRAINT wo_consumption_reversal_check CHECK (
    (status = 'consumed' AND reversed_at IS NULL AND reversed_by_user_id IS NULL)
    OR (status = 'reversed' AND reversed_at IS NOT NULL AND reversed_by_user_id IS NOT NULL)
  )
);

-- Indexes
CREATE INDEX idx_wo_consumption_wo ON wo_consumption(wo_id);
CREATE INDEX idx_wo_consumption_org ON wo_consumption(org_id);
CREATE INDEX idx_wo_consumption_material ON wo_consumption(material_id);
CREATE INDEX idx_wo_consumption_lp ON wo_consumption(lp_id);
CREATE INDEX idx_wo_consumption_status ON wo_consumption(status);
CREATE INDEX idx_wo_consumption_reservation ON wo_consumption(reservation_id);

-- RLS
ALTER TABLE wo_consumption ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view consumption in their org"
  ON wo_consumption FOR SELECT
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

CREATE POLICY "Users can create consumption in their org"
  ON wo_consumption FOR INSERT
  WITH CHECK (org_id = (auth.jwt() ->> 'org_id')::uuid);

CREATE POLICY "Users can update consumption in their org"
  ON wo_consumption FOR UPDATE
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- ============================================
-- 2. Create lp_movements table
-- ============================================
-- Full audit trail for all LP quantity/status changes

CREATE TABLE IF NOT EXISTS public.lp_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- License Plate
  lp_id UUID NOT NULL REFERENCES license_plates(id) ON DELETE CASCADE,

  -- Movement Details
  movement_type VARCHAR(30) NOT NULL,
  -- Values: creation, receipt, consumption, reversal, adjustment, transfer, split, merge

  -- Quantity Change
  qty_change DECIMAL(15,6) NOT NULL,  -- Can be negative
  qty_before DECIMAL(15,6) NOT NULL,
  qty_after DECIMAL(15,6) NOT NULL,
  uom VARCHAR(20) NOT NULL,

  -- References (nullable - depends on movement type)
  wo_id UUID REFERENCES work_orders(id) ON DELETE SET NULL,
  po_id UUID REFERENCES purchase_orders(id) ON DELETE SET NULL,
  consumption_id UUID REFERENCES wo_consumption(id) ON DELETE SET NULL,

  -- User & Timestamps
  created_by_user_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Notes
  notes TEXT,

  -- Constraints
  CONSTRAINT lp_movements_type_check CHECK (
    movement_type IN ('creation', 'receipt', 'consumption', 'reversal', 'adjustment', 'transfer', 'split', 'merge')
  )
);

-- Indexes
CREATE INDEX idx_lp_movements_lp ON lp_movements(lp_id);
CREATE INDEX idx_lp_movements_org ON lp_movements(org_id);
CREATE INDEX idx_lp_movements_wo ON lp_movements(wo_id) WHERE wo_id IS NOT NULL;
CREATE INDEX idx_lp_movements_type ON lp_movements(movement_type);
CREATE INDEX idx_lp_movements_created ON lp_movements(created_at DESC);

-- RLS
ALTER TABLE lp_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view movements in their org"
  ON lp_movements FOR SELECT
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

CREATE POLICY "Users can create movements in their org"
  ON lp_movements FOR INSERT
  WITH CHECK (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- ============================================
-- 3. Add reversed fields to lp_genealogy
-- ============================================
-- Story 4.10/4.19: Support marking genealogy as reversed (compliance requirement)

ALTER TABLE lp_genealogy
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS reversed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS reversed_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS reverse_reason TEXT,
  ADD COLUMN IF NOT EXISTS wo_material_reservation_id UUID REFERENCES wo_material_reservations(id) ON DELETE SET NULL;

-- Allow UPDATE on lp_genealogy for reversal operations only
CREATE POLICY "Managers can update genealogy status for reversal"
  ON lp_genealogy FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM license_plates lp
      WHERE lp.id = lp_genealogy.parent_lp_id
        AND lp.org_id = (auth.jwt() ->> 'org_id')::uuid
    )
    AND (auth.jwt() ->> 'role') IN ('admin', 'manager')
  );

-- Add index for status filtering
CREATE INDEX idx_lp_genealogy_status ON lp_genealogy(status);
CREATE INDEX idx_lp_genealogy_reservation ON lp_genealogy(wo_material_reservation_id) WHERE wo_material_reservation_id IS NOT NULL;

-- ============================================
-- 4. Add consumed_by fields to license_plates
-- ============================================
-- Story 4.18: Track which WO consumed the LP

ALTER TABLE license_plates
  ADD COLUMN IF NOT EXISTS consumed_by_wo_id UUID REFERENCES work_orders(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS consumed_at TIMESTAMP WITH TIME ZONE;

-- Index for tracking consumed LPs per WO
CREATE INDEX idx_license_plates_consumed_wo ON license_plates(consumed_by_wo_id) WHERE consumed_by_wo_id IS NOT NULL;

-- ============================================
-- Comments
-- ============================================
COMMENT ON TABLE wo_consumption IS 'Material consumption records for work orders with reversal support (Story 4.10)';
COMMENT ON TABLE lp_movements IS 'Full audit trail of all license plate quantity/status changes';
COMMENT ON COLUMN wo_consumption.status IS 'consumed = active, reversed = correction made';
COMMENT ON COLUMN lp_movements.movement_type IS 'Type of movement: creation, receipt, consumption, reversal, adjustment, transfer, split, merge';
COMMENT ON COLUMN lp_genealogy.status IS 'active = valid, reversed = consumption was reversed';
