-- =============================================================================
-- Migration 135: Create Inventory Allocations Table + RLS Policies
-- Story: 07.7 - Inventory Allocation (FIFO/FEFO + Backorders)
-- Purpose: Track LP reservations for Sales Order lines
-- =============================================================================

-- =============================================================================
-- Inventory Allocations Table - Tracks LP allocation to SO lines
-- =============================================================================

CREATE TABLE IF NOT EXISTS inventory_allocations (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Relationships
  sales_order_line_id UUID NOT NULL REFERENCES sales_order_lines(id) ON DELETE CASCADE,
  license_plate_id UUID NOT NULL REFERENCES license_plates(id),

  -- Quantities
  quantity_allocated DECIMAL(15,4) NOT NULL CHECK (quantity_allocated > 0),
  quantity_picked DECIMAL(15,4) DEFAULT 0 CHECK (quantity_picked >= 0),

  -- Audit
  allocated_at TIMESTAMPTZ DEFAULT now(),
  allocated_by UUID REFERENCES users(id),
  released_at TIMESTAMPTZ,
  released_by UUID REFERENCES users(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Constraints
  CONSTRAINT uq_so_line_lp UNIQUE(sales_order_line_id, license_plate_id),
  CONSTRAINT allocation_qty_check CHECK (quantity_allocated > 0),
  CONSTRAINT picked_lte_allocated CHECK (quantity_picked <= quantity_allocated)
);

-- =============================================================================
-- Indexes for Performance
-- =============================================================================

-- Primary query patterns
CREATE INDEX IF NOT EXISTS idx_allocations_so_line ON inventory_allocations(sales_order_line_id);
CREATE INDEX IF NOT EXISTS idx_allocations_lp ON inventory_allocations(license_plate_id);
CREATE INDEX IF NOT EXISTS idx_allocations_org_active ON inventory_allocations(org_id) WHERE released_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_allocations_org_so ON inventory_allocations(org_id, sales_order_line_id);
CREATE INDEX IF NOT EXISTS idx_allocations_created ON inventory_allocations(org_id, created_at DESC);

-- =============================================================================
-- Updated_at Trigger
-- =============================================================================

CREATE OR REPLACE FUNCTION update_inventory_allocations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_inventory_allocations_updated_at
BEFORE UPDATE ON inventory_allocations
FOR EACH ROW EXECUTE FUNCTION update_inventory_allocations_updated_at();

-- =============================================================================
-- RLS Policies
-- =============================================================================

ALTER TABLE inventory_allocations ENABLE ROW LEVEL SECURITY;

-- Select: Org isolation
CREATE POLICY "allocations_select_org" ON inventory_allocations
FOR SELECT TO authenticated
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- Insert: Org isolation
CREATE POLICY "allocations_insert_org" ON inventory_allocations
FOR INSERT TO authenticated
WITH CHECK (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- Update: Org isolation
CREATE POLICY "allocations_update_org" ON inventory_allocations
FOR UPDATE TO authenticated
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()))
WITH CHECK (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- Delete: Org isolation
CREATE POLICY "allocations_delete_org" ON inventory_allocations
FOR DELETE TO authenticated
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- =============================================================================
-- Helper Function: Get Total Allocated Qty for LP
-- =============================================================================

CREATE OR REPLACE FUNCTION get_lp_allocated_qty_so(p_lp_id UUID)
RETURNS DECIMAL(15,4) AS $$
DECLARE
  v_allocated DECIMAL(15,4);
BEGIN
  SELECT COALESCE(SUM(quantity_allocated - quantity_picked), 0)
  INTO v_allocated
  FROM inventory_allocations
  WHERE license_plate_id = p_lp_id
    AND released_at IS NULL;

  RETURN v_allocated;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- Grant permissions
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON inventory_allocations TO authenticated;
