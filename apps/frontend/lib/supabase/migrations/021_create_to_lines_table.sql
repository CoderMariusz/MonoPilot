-- Migration: 021_create_to_lines_table.sql
-- Description: Create to_lines table for Transfer Order line items
-- Story: 3.7 - TO Line Management
-- Date: 2025-01-23

-- Create to_lines table
CREATE TABLE IF NOT EXISTS to_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transfer_order_id UUID NOT NULL REFERENCES transfer_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity NUMERIC(10, 2) NOT NULL CHECK (quantity > 0),
  uom VARCHAR(20) NOT NULL,
  shipped_qty NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (shipped_qty >= 0),
  received_qty NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (received_qty >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_to_lines_transfer_order ON to_lines(transfer_order_id);
CREATE INDEX IF NOT EXISTS idx_to_lines_product ON to_lines(product_id);

-- Validation constraints
ALTER TABLE to_lines
  DROP CONSTRAINT IF EXISTS check_shipped_qty_max,
  ADD CONSTRAINT check_shipped_qty_max CHECK (shipped_qty <= quantity);

ALTER TABLE to_lines
  DROP CONSTRAINT IF EXISTS check_received_qty_max,
  ADD CONSTRAINT check_received_qty_max CHECK (received_qty <= shipped_qty);

-- Comments
COMMENT ON TABLE to_lines IS 'Line items for Transfer Orders (products to transfer)';
COMMENT ON COLUMN to_lines.quantity IS 'Planned quantity to transfer';
COMMENT ON COLUMN to_lines.uom IS 'Unit of Measure, inherited from product';
COMMENT ON COLUMN to_lines.shipped_qty IS 'Cumulative quantity shipped (updated in Story 3.8)';
COMMENT ON COLUMN to_lines.received_qty IS 'Cumulative quantity received (updated in Story 3.8)';

-- RLS Policy (inherit org_id from transfer_orders)
ALTER TABLE to_lines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS to_lines_org_isolation ON to_lines;
CREATE POLICY to_lines_org_isolation ON to_lines
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM transfer_orders
      WHERE transfer_orders.id = to_lines.transfer_order_id
      AND transfer_orders.org_id = (auth.jwt() ->> 'org_id')::uuid
    )
  );

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_to_lines_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_to_lines_updated_at ON to_lines;
CREATE TRIGGER trigger_update_to_lines_updated_at
  BEFORE UPDATE ON to_lines
  FOR EACH ROW
  EXECUTE FUNCTION update_to_lines_updated_at();
