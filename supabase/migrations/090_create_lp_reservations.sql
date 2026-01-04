-- =============================================================================
-- Migration 090: Create LP Reservations Table + RLS Policies
-- Story: 05.3 - LP Reservations + FIFO/FEFO Picking
-- Purpose: Track LP reservations for Work Orders and Transfer Orders
-- Critical for: Epic 04 Production (material reservations for WO materials)
-- =============================================================================

-- =============================================================================
-- LP Reservations Table - Tracks LP allocation to WO/TO
-- =============================================================================

CREATE TABLE IF NOT EXISTS lp_reservations (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- LP Reference
  lp_id UUID NOT NULL REFERENCES license_plates(id) ON DELETE CASCADE,

  -- Source Reference (one of: wo_id or to_id)
  wo_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,
  to_id UUID,  -- Future: Transfer Orders (Phase 1)
  wo_material_id UUID,  -- Future: Link to wo_materials for Epic 04.8

  -- Quantities
  reserved_qty DECIMAL(15,4) NOT NULL CHECK (reserved_qty > 0),
  consumed_qty DECIMAL(15,4) NOT NULL DEFAULT 0 CHECK (consumed_qty >= 0),

  -- Status
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'released', 'consumed')),

  -- Timestamps
  reserved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  released_at TIMESTAMPTZ,
  reserved_by UUID REFERENCES users(id),

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT consumed_lte_reserved CHECK (consumed_qty <= reserved_qty),
  CONSTRAINT require_wo_or_to CHECK (wo_id IS NOT NULL OR to_id IS NOT NULL)
);

-- =============================================================================
-- Indexes for Performance
-- =============================================================================

-- Primary query patterns
CREATE INDEX IF NOT EXISTS idx_reservation_org_lp ON lp_reservations(org_id, lp_id);
CREATE INDEX IF NOT EXISTS idx_reservation_lp ON lp_reservations(lp_id);
CREATE INDEX IF NOT EXISTS idx_reservation_wo ON lp_reservations(wo_id) WHERE wo_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reservation_to ON lp_reservations(to_id) WHERE to_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reservation_status ON lp_reservations(org_id, status);
CREATE INDEX IF NOT EXISTS idx_reservation_lp_status ON lp_reservations(lp_id, status);

-- For calculating available qty (active reservations per LP)
CREATE INDEX IF NOT EXISTS idx_reservation_active_lp ON lp_reservations(lp_id)
  WHERE status = 'active';

-- =============================================================================
-- Updated_at Trigger
-- =============================================================================

CREATE OR REPLACE FUNCTION update_reservation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_reservation_updated_at
BEFORE UPDATE ON lp_reservations
FOR EACH ROW EXECUTE FUNCTION update_reservation_updated_at();

-- =============================================================================
-- RLS Policies
-- =============================================================================

ALTER TABLE lp_reservations ENABLE ROW LEVEL SECURITY;

-- Select: Org isolation
CREATE POLICY "reservation_select_org" ON lp_reservations
FOR SELECT TO authenticated
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- Insert: Org isolation + valid LP reference
CREATE POLICY "reservation_insert_org" ON lp_reservations
FOR INSERT TO authenticated
WITH CHECK (
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  AND lp_id IN (
    SELECT id FROM license_plates
    WHERE org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  )
);

-- Update: Org isolation
CREATE POLICY "reservation_update_org" ON lp_reservations
FOR UPDATE TO authenticated
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()))
WITH CHECK (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- Delete: Org isolation
CREATE POLICY "reservation_delete_org" ON lp_reservations
FOR DELETE TO authenticated
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- =============================================================================
-- Helper Function: Get Active Reserved Qty for LP
-- =============================================================================

CREATE OR REPLACE FUNCTION get_lp_reserved_qty(p_lp_id UUID)
RETURNS DECIMAL(15,4) AS $$
DECLARE
  v_reserved DECIMAL(15,4);
BEGIN
  SELECT COALESCE(SUM(reserved_qty - consumed_qty), 0)
  INTO v_reserved
  FROM lp_reservations
  WHERE lp_id = p_lp_id
    AND status = 'active';

  RETURN v_reserved;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- Helper Function: Get Available Qty for LP
-- =============================================================================

CREATE OR REPLACE FUNCTION get_lp_available_qty(p_lp_id UUID)
RETURNS DECIMAL(15,4) AS $$
DECLARE
  v_quantity DECIMAL(15,4);
  v_reserved DECIMAL(15,4);
BEGIN
  -- Get LP quantity
  SELECT quantity INTO v_quantity
  FROM license_plates
  WHERE id = p_lp_id;

  IF v_quantity IS NULL THEN
    RETURN 0;
  END IF;

  -- Get reserved qty
  v_reserved := get_lp_reserved_qty(p_lp_id);

  RETURN v_quantity - v_reserved;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- Trigger: Update LP status when fully reserved/released
-- =============================================================================

CREATE OR REPLACE FUNCTION update_lp_reservation_status()
RETURNS TRIGGER AS $$
DECLARE
  v_total_qty DECIMAL(15,4);
  v_reserved_qty DECIMAL(15,4);
  v_lp_id UUID;
BEGIN
  -- Get the LP ID depending on operation
  IF TG_OP = 'DELETE' THEN
    v_lp_id := OLD.lp_id;
  ELSE
    v_lp_id := NEW.lp_id;
  END IF;

  -- Get LP total quantity
  SELECT quantity INTO v_total_qty
  FROM license_plates
  WHERE id = v_lp_id;

  -- Calculate active reserved quantity
  SELECT COALESCE(SUM(reserved_qty - consumed_qty), 0)
  INTO v_reserved_qty
  FROM lp_reservations
  WHERE lp_id = v_lp_id
    AND status = 'active';

  -- Update LP status based on reserved qty
  IF v_reserved_qty >= v_total_qty THEN
    -- Fully reserved
    UPDATE license_plates
    SET status = 'reserved'
    WHERE id = v_lp_id AND status = 'available';
  ELSE
    -- Not fully reserved - check if was reserved and has no other active reservations
    IF v_reserved_qty = 0 THEN
      UPDATE license_plates
      SET status = 'available'
      WHERE id = v_lp_id AND status = 'reserved';
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_lp_reservation_status
AFTER INSERT OR UPDATE OR DELETE ON lp_reservations
FOR EACH ROW EXECUTE FUNCTION update_lp_reservation_status();
