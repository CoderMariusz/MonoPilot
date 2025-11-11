-- Migration 030: Pallet Items Table
-- Purpose: Items/boxes on pallets with traceability
-- Date: 2025-01-11
-- Dependencies: 029_pallets

CREATE TABLE pallet_items (
  id SERIAL PRIMARY KEY,
  pallet_id INTEGER NOT NULL REFERENCES pallets(id),
  box_count NUMERIC(12,4) NOT NULL,
  material_snapshot JSONB,
  sequence INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_pallet_items_pallet ON pallet_items(pallet_id);

-- Comments
COMMENT ON TABLE pallet_items IS 'Items/boxes on pallets with material traceability snapshots';
COMMENT ON COLUMN pallet_items.box_count IS 'Aggregated count of boxes on pallet';
COMMENT ON COLUMN pallet_items.material_snapshot IS 'BOM snapshot data for traceability';

