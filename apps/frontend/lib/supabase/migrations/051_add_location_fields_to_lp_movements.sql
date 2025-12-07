-- Migration 051: Add location fields to lp_movements
-- Epic 5 Batch 05B-1: Stock Moves (Stories 5.14-5.18)
-- Adds from_location_id and to_location_id for transfer tracking

ALTER TABLE lp_movements
  ADD COLUMN IF NOT EXISTS from_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS to_location_id UUID REFERENCES locations(id) ON DELETE SET NULL;

-- Indexes for location-based queries
CREATE INDEX IF NOT EXISTS idx_lp_movements_from_location ON lp_movements(from_location_id) WHERE from_location_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lp_movements_to_location ON lp_movements(to_location_id) WHERE to_location_id IS NOT NULL;

COMMENT ON COLUMN lp_movements.from_location_id IS 'Source location for transfer movements';
COMMENT ON COLUMN lp_movements.to_location_id IS 'Destination location for transfer movements';
