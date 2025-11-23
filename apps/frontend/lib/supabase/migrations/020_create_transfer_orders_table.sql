-- Migration: 020_create_transfer_orders_table.sql
-- Description: Create transfer_orders table for managing inventory transfers between warehouses
-- Story: 3.6 - Transfer Order CRUD
-- Date: 2025-01-23

-- Create transfer_orders table
CREATE TABLE IF NOT EXISTS transfer_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  to_number VARCHAR(20) NOT NULL,
  from_warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  to_warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  planned_ship_date DATE NOT NULL,
  planned_receive_date DATE NOT NULL,
  actual_ship_date DATE,
  actual_receive_date DATE,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint: TO number unique per organization
CREATE UNIQUE INDEX IF NOT EXISTS idx_transfer_orders_to_number ON transfer_orders(org_id, to_number);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_transfer_orders_org ON transfer_orders(org_id);
CREATE INDEX IF NOT EXISTS idx_transfer_orders_from_warehouse ON transfer_orders(from_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_transfer_orders_to_warehouse ON transfer_orders(to_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_transfer_orders_status ON transfer_orders(org_id, status);
CREATE INDEX IF NOT EXISTS idx_transfer_orders_ship_date ON transfer_orders(org_id, planned_ship_date);
CREATE INDEX IF NOT EXISTS idx_transfer_orders_status_date ON transfer_orders(org_id, status, planned_ship_date);

-- Validation constraint: from_warehouse ≠ to_warehouse
ALTER TABLE transfer_orders
  DROP CONSTRAINT IF EXISTS check_different_warehouses,
  ADD CONSTRAINT check_different_warehouses
  CHECK (from_warehouse_id != to_warehouse_id);

-- Validation constraint: receive date >= ship date
ALTER TABLE transfer_orders
  DROP CONSTRAINT IF EXISTS check_receive_after_ship,
  ADD CONSTRAINT check_receive_after_ship
  CHECK (planned_receive_date >= planned_ship_date);

-- Comments
COMMENT ON TABLE transfer_orders IS 'Transfer Orders for moving inventory between warehouses';
COMMENT ON COLUMN transfer_orders.to_number IS 'Auto-generated unique TO number (format: TO-YYYY-NNN)';
COMMENT ON COLUMN transfer_orders.status IS 'Valid values: draft, planned, partially_shipped, shipped, partially_received, received, cancelled';
COMMENT ON COLUMN transfer_orders.actual_ship_date IS 'Set when first shipment occurs (immutable)';
COMMENT ON COLUMN transfer_orders.actual_receive_date IS 'Set when all lines fully received';

-- RLS Policy
ALTER TABLE transfer_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS transfer_orders_org_isolation ON transfer_orders;
CREATE POLICY transfer_orders_org_isolation ON transfer_orders
  FOR ALL
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_transfer_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_transfer_orders_updated_at ON transfer_orders;
CREATE TRIGGER trigger_update_transfer_orders_updated_at
  BEFORE UPDATE ON transfer_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_transfer_orders_updated_at();
