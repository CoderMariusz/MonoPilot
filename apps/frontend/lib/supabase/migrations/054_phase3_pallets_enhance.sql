-- Migration 054: Phase 3 Pallet Management Enhancements
-- Purpose: Enhance pallets and pallet_items tables for Phase 3 requirements
-- Epic: EPIC-002 Scanner & Warehouse v2 - Phase 3: Pallet Management & WO Reservations
-- Date: 2025-01-12
-- Dependencies: 029_pallets, 030_pallet_items

-- ============================================================================
-- 1. ENHANCE PALLETS TABLE
-- ============================================================================

-- Add new columns to pallets table
ALTER TABLE pallets
  ADD COLUMN IF NOT EXISTS pallet_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS pallet_type VARCHAR(20) DEFAULT 'EURO' CHECK (pallet_type IN ('EURO', 'CHEP', 'CUSTOM', 'OTHER')),
  ADD COLUMN IF NOT EXISTS location_id INTEGER REFERENCES locations(id),
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed', 'shipped')),
  ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS closed_by UUID REFERENCES auth.users(id);

-- Migrate existing 'code' to 'pallet_number' if pallet_number is null
UPDATE pallets SET pallet_number = code WHERE pallet_number IS NULL;

-- Make pallet_number NOT NULL and UNIQUE after migration
ALTER TABLE pallets
  ALTER COLUMN pallet_number SET NOT NULL,
  ADD CONSTRAINT pallets_pallet_number_unique UNIQUE (pallet_number);

-- Make wo_id optional (some pallets might not be tied to WO)
ALTER TABLE pallets
  ALTER COLUMN wo_id DROP NOT NULL;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_pallets_pallet_number ON pallets(pallet_number);
CREATE INDEX IF NOT EXISTS idx_pallets_status ON pallets(status);
CREATE INDEX IF NOT EXISTS idx_pallets_location ON pallets(location_id);

-- Update comments
COMMENT ON TABLE pallets IS 'Pallet management for warehouse operations and finished goods packaging';
COMMENT ON COLUMN pallets.pallet_number IS 'Unique pallet identifier (barcode)';
COMMENT ON COLUMN pallets.pallet_type IS 'Type of pallet: EURO (800x1200mm), CHEP (1000x1200mm), CUSTOM, OTHER';
COMMENT ON COLUMN pallets.location_id IS 'Current location of pallet';
COMMENT ON COLUMN pallets.status IS 'Pallet status: open (can add items), closed (sealed), shipped (dispatched)';
COMMENT ON COLUMN pallets.code IS 'DEPRECATED: Use pallet_number instead';

-- ============================================================================
-- 2. ENHANCE PALLET_ITEMS TABLE
-- ============================================================================

-- Add new columns to pallet_items table
ALTER TABLE pallet_items
  ADD COLUMN IF NOT EXISTS lp_id INTEGER REFERENCES license_plates(id),
  ADD COLUMN IF NOT EXISTS quantity NUMERIC(12,4),
  ADD COLUMN IF NOT EXISTS uom VARCHAR(20),
  ADD COLUMN IF NOT EXISTS added_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS added_by UUID REFERENCES auth.users(id);

-- Set default quantity from box_count if not set
UPDATE pallet_items SET quantity = box_count WHERE quantity IS NULL;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_pallet_items_lp ON pallet_items(lp_id);

-- Update comments
COMMENT ON TABLE pallet_items IS 'License plates or boxes on pallets with full traceability';
COMMENT ON COLUMN pallet_items.lp_id IS 'License plate reference (primary way to track items on pallet)';
COMMENT ON COLUMN pallet_items.quantity IS 'Quantity of LP added to pallet';
COMMENT ON COLUMN pallet_items.uom IS 'Unit of measure for quantity';
COMMENT ON COLUMN pallet_items.box_count IS 'LEGACY: Aggregated count of boxes (use quantity instead)';
COMMENT ON COLUMN pallet_items.material_snapshot IS 'BOM snapshot for traceability (optional, for complex assemblies)';

-- ============================================================================
-- 3. CREATE WO_RESERVATIONS TABLE (Replacement for lp_reservations)
-- ============================================================================

-- Note: We keep lp_reservations for backward compatibility
-- But create wo_reservations with proper structure for Phase 3

CREATE TABLE IF NOT EXISTS wo_reservations (
  id SERIAL PRIMARY KEY,
  wo_id INTEGER NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  material_id INTEGER NOT NULL REFERENCES products(id), -- Material from BOM
  lp_id INTEGER NOT NULL REFERENCES license_plates(id), -- Actual LP reserved
  quantity_reserved NUMERIC(12,4) NOT NULL CHECK (quantity_reserved > 0),
  quantity_consumed NUMERIC(12,4) DEFAULT 0 CHECK (quantity_consumed >= 0 AND quantity_consumed <= quantity_reserved),
  uom VARCHAR(20) NOT NULL,
  operation_sequence INTEGER, -- Which BOM operation
  reserved_at TIMESTAMPTZ DEFAULT NOW(),
  reserved_by UUID REFERENCES auth.users(id),
  consumed_at TIMESTAMPTZ,
  consumed_by UUID REFERENCES auth.users(id),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'consumed', 'released', 'expired')),
  notes TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_wo_reservations_wo ON wo_reservations(wo_id);
CREATE INDEX IF NOT EXISTS idx_wo_reservations_lp ON wo_reservations(lp_id);
CREATE INDEX IF NOT EXISTS idx_wo_reservations_material ON wo_reservations(material_id);
CREATE INDEX IF NOT EXISTS idx_wo_reservations_status ON wo_reservations(status);

-- Comments
COMMENT ON TABLE wo_reservations IS 'Material reservations for work orders with consumption tracking';
COMMENT ON COLUMN wo_reservations.material_id IS 'Product/material from BOM (what should be used)';
COMMENT ON COLUMN wo_reservations.lp_id IS 'Actual license plate reserved (inventory source)';
COMMENT ON COLUMN wo_reservations.quantity_reserved IS 'Total quantity reserved from LP';
COMMENT ON COLUMN wo_reservations.quantity_consumed IS 'Quantity actually consumed (partial consumption allowed)';
COMMENT ON COLUMN wo_reservations.operation_sequence IS 'BOM operation sequence number (for multi-step processes)';
COMMENT ON COLUMN wo_reservations.status IS 'active: reserved, consumed: fully consumed, released: reservation cancelled, expired: expired by time';

-- ============================================================================
-- 4. CREATE RPC FUNCTIONS FOR WO RESERVATIONS
-- ============================================================================

-- Function: Get WO Required Materials with Reservation Status
CREATE OR REPLACE FUNCTION get_wo_required_materials(wo_id_param INTEGER)
RETURNS TABLE (
  material_id INTEGER,
  material_part_number VARCHAR,
  material_description TEXT,
  required_qty NUMERIC,
  reserved_qty NUMERIC,
  consumed_qty NUMERIC,
  remaining_qty NUMERIC,
  uom VARCHAR,
  operation_sequence INTEGER,
  progress_pct NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.material_id,
    p.part_number AS material_part_number,
    p.description AS material_description,
    b.quantity AS required_qty,
    COALESCE(SUM(r.quantity_reserved), 0) AS reserved_qty,
    COALESCE(SUM(r.quantity_consumed), 0) AS consumed_qty,
    b.quantity - COALESCE(SUM(r.quantity_consumed), 0) AS remaining_qty,
    b.uom,
    b.operation_sequence,
    CASE
      WHEN b.quantity > 0 THEN ROUND((COALESCE(SUM(r.quantity_consumed), 0) / b.quantity) * 100, 2)
      ELSE 0
    END AS progress_pct
  FROM work_orders wo
  INNER JOIN bom_items b ON wo.bom_id = b.bom_id
  INNER JOIN products p ON b.material_id = p.id
  LEFT JOIN wo_reservations r ON r.wo_id = wo.id AND r.material_id = b.material_id AND r.status IN ('active', 'consumed')
  WHERE wo.id = wo_id_param
  GROUP BY b.material_id, p.part_number, p.description, b.quantity, b.uom, b.operation_sequence
  ORDER BY b.operation_sequence ASC, p.part_number ASC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_wo_required_materials IS
'Returns required materials for a work order with reservation and consumption status.
Used to display progress checklist on scanner and desktop UI.';

-- Function: Get Available LPs for Material (FIFO)
CREATE OR REPLACE FUNCTION get_available_lps_for_material(
  material_id_param INTEGER,
  location_id_param INTEGER DEFAULT NULL
)
RETURNS TABLE (
  lp_id INTEGER,
  lp_number VARCHAR,
  quantity NUMERIC,
  uom VARCHAR,
  batch VARCHAR,
  expiry_date DATE,
  location_name TEXT,
  qa_status VARCHAR,
  reserved_qty NUMERIC,
  available_qty NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    lp.id AS lp_id,
    lp.lp_number,
    lp.quantity,
    lp.uom,
    lp.batch,
    lp.expiry_date,
    l.name AS location_name,
    lp.qa_status,
    COALESCE(SUM(r.quantity_reserved - r.quantity_consumed), 0) AS reserved_qty,
    lp.quantity - COALESCE(SUM(r.quantity_reserved - r.quantity_consumed), 0) AS available_qty
  FROM license_plates lp
  INNER JOIN locations l ON lp.location_id = l.id
  LEFT JOIN wo_reservations r ON r.lp_id = lp.id AND r.status = 'active'
  WHERE lp.product_id = material_id_param
    AND lp.is_consumed = FALSE
    AND lp.qa_status = 'Passed'
    AND (location_id_param IS NULL OR lp.location_id = location_id_param)
  GROUP BY lp.id, lp.lp_number, lp.quantity, lp.uom, lp.batch, lp.expiry_date, l.name, lp.qa_status
  HAVING lp.quantity > COALESCE(SUM(r.quantity_reserved - r.quantity_consumed), 0) -- Has available quantity
  ORDER BY lp.expiry_date ASC NULLS LAST, lp.created_at ASC; -- FIFO: oldest first
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_available_lps_for_material IS
'Returns available license plates for a material, ordered by FIFO (expiry date, then created date).
Filters out consumed LPs, QA-blocked LPs, and fully reserved LPs.
Used for scanner LP selection and automatic reservation suggestions.';

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE pallets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE pallet_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE wo_reservations TO authenticated;
GRANT USAGE ON SEQUENCE pallets_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE pallet_items_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE wo_reservations_id_seq TO authenticated;
GRANT EXECUTE ON FUNCTION get_wo_required_materials TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_lps_for_material TO authenticated;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
