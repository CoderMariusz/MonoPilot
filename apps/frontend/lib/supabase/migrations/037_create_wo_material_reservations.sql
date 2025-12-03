-- Migration 037: Work Order Material Reservations
-- Epic 4 Batch 4A-2: Material Reservation (Story 4.7)
-- Creates wo_material_reservations table and extends lp_genealogy for reservation tracking
-- Date: 2025-12-03

-- ============================================================================
-- 1. WO_MATERIAL_RESERVATIONS Table
-- Tracks material reservations for WO before consumption
-- ============================================================================

CREATE TABLE wo_material_reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Work Order reference
  wo_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,

  -- Material reference (from wo_materials snapshot)
  material_id UUID NOT NULL REFERENCES wo_materials(id) ON DELETE CASCADE,

  -- License Plate being reserved
  lp_id UUID NOT NULL REFERENCES license_plates(id) ON DELETE RESTRICT,

  -- Reservation details
  reserved_qty DECIMAL(15,6) NOT NULL,
  uom VARCHAR(20) NOT NULL,
  sequence_number INTEGER NOT NULL DEFAULT 1, -- Per material: LP #1, #2, #3

  -- Status tracking
  status VARCHAR(20) NOT NULL DEFAULT 'reserved',

  -- Audit trail
  reserved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  reserved_by_user_id UUID NOT NULL REFERENCES users(id),
  unreserved_at TIMESTAMP WITH TIME ZONE,
  unreserved_by_user_id UUID REFERENCES users(id),

  -- Optional notes
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT wo_material_reservations_qty_positive CHECK (reserved_qty > 0),
  CONSTRAINT wo_material_reservations_status_check CHECK (
    status IN ('reserved', 'consumed', 'unreserved')
  ),
  CONSTRAINT wo_material_reservations_sequence_positive CHECK (sequence_number > 0)
);

-- Indexes
CREATE INDEX idx_wo_material_reservations_wo ON wo_material_reservations(wo_id);
CREATE INDEX idx_wo_material_reservations_material ON wo_material_reservations(material_id);
CREATE INDEX idx_wo_material_reservations_lp ON wo_material_reservations(lp_id);
CREATE INDEX idx_wo_material_reservations_org ON wo_material_reservations(org_id);
CREATE INDEX idx_wo_material_reservations_status ON wo_material_reservations(status);

-- Unique constraint: LP can only be reserved once per WO
CREATE UNIQUE INDEX idx_wo_material_reservations_unique_lp_wo
  ON wo_material_reservations(wo_id, lp_id)
  WHERE status = 'reserved';

-- RLS
ALTER TABLE wo_material_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY wo_material_reservations_select ON wo_material_reservations
  FOR SELECT TO authenticated
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

CREATE POLICY wo_material_reservations_insert ON wo_material_reservations
  FOR INSERT TO authenticated
  WITH CHECK (
    org_id = (auth.jwt() ->> 'org_id')::uuid
    AND (auth.jwt() ->> 'role') IN ('admin', 'production', 'operator')
  );

CREATE POLICY wo_material_reservations_update ON wo_material_reservations
  FOR UPDATE TO authenticated
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid)
  WITH CHECK (
    org_id = (auth.jwt() ->> 'org_id')::uuid
    AND (auth.jwt() ->> 'role') IN ('admin', 'production', 'operator')
  );

CREATE POLICY wo_material_reservations_delete ON wo_material_reservations
  FOR DELETE TO authenticated
  USING (
    org_id = (auth.jwt() ->> 'org_id')::uuid
    AND (auth.jwt() ->> 'role') IN ('admin', 'production', 'operator')
  );

-- Trigger: Update updated_at
CREATE TRIGGER update_wo_material_reservations_updated_at
  BEFORE UPDATE ON wo_material_reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE wo_material_reservations IS 'Material reservations for Work Orders - Story 4.7';
COMMENT ON COLUMN wo_material_reservations.material_id IS 'FK to wo_materials (BOM snapshot)';
COMMENT ON COLUMN wo_material_reservations.sequence_number IS 'Order of reservation per material: LP #1, #2, #3';
COMMENT ON COLUMN wo_material_reservations.status IS 'reserved, consumed (after output), unreserved (cancelled)';

-- ============================================================================
-- 2. Extend LP_GENEALOGY for reservation tracking
-- Add FK to wo_material_reservations for traceability
-- ============================================================================

-- Make child_lp_id nullable (filled in Story 4.12 output registration)
ALTER TABLE lp_genealogy
  ALTER COLUMN child_lp_id DROP NOT NULL;

-- Add reservation tracking columns
ALTER TABLE lp_genealogy
  ADD COLUMN IF NOT EXISTS wo_material_reservation_id UUID REFERENCES wo_material_reservations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reserved_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS reserved_by_user_id UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS consumed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS consumed_qty DECIMAL(15,6);

-- Index for reservation lookup
CREATE INDEX IF NOT EXISTS idx_lp_genealogy_reservation
  ON lp_genealogy(wo_material_reservation_id)
  WHERE wo_material_reservation_id IS NOT NULL;

COMMENT ON COLUMN lp_genealogy.wo_material_reservation_id IS 'FK to reservation for traceability - Story 4.7';
COMMENT ON COLUMN lp_genealogy.reserved_at IS 'When parent LP was reserved for WO';
COMMENT ON COLUMN lp_genealogy.consumed_at IS 'When material was actually consumed (Story 4.12)';
COMMENT ON COLUMN lp_genealogy.consumed_qty IS 'Quantity consumed (may differ from reserved if partial)';

-- ============================================================================
-- 3. Add consume_whole_lp to bom_items if not exists
-- ============================================================================

ALTER TABLE bom_items
  ADD COLUMN IF NOT EXISTS consume_whole_lp BOOLEAN DEFAULT false;

COMMENT ON COLUMN bom_items.consume_whole_lp IS 'If true, entire LP must be reserved/consumed - Story 4.9';

-- ============================================================================
-- 4. Update license_plates status enum to include 'reserved'
-- ============================================================================

-- No constraint change needed - using VARCHAR, just document valid values
COMMENT ON COLUMN license_plates.status IS 'Status: available, reserved, consumed, expired, quarantine';
