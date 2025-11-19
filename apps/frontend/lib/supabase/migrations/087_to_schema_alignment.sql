-- Migration 087: TO Schema Alignment
-- Story: 0-16-to-database-api-alignment
-- Adds missing columns to to_header and to_line to match architecture.md

-- Phase 1: Add missing columns to to_header
ALTER TABLE to_header
  ADD COLUMN IF NOT EXISTS requested_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS transfer_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS planned_ship_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS actual_ship_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS planned_receive_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS actual_receive_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id);

-- Copy scheduled_date to requested_date for existing records
UPDATE to_header
SET requested_date = scheduled_date
WHERE requested_date IS NULL AND scheduled_date IS NOT NULL;

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_to_header_approved_by ON to_header(approved_by);

-- Phase 2: Add missing columns to to_line
ALTER TABLE to_line
  ADD COLUMN IF NOT EXISTS qty_shipped DECIMAL(15,4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lp_id BIGINT REFERENCES license_plates(id),
  ADD COLUMN IF NOT EXISTS batch VARCHAR(100),
  ADD COLUMN IF NOT EXISTS from_location_id BIGINT REFERENCES locations(id),
  ADD COLUMN IF NOT EXISTS to_location_id BIGINT REFERENCES locations(id),
  ADD COLUMN IF NOT EXISTS scan_required BOOLEAN DEFAULT false;

-- Create indexes for line columns
CREATE INDEX IF NOT EXISTS idx_to_line_lp_id ON to_line(lp_id);
CREATE INDEX IF NOT EXISTS idx_to_line_from_location ON to_line(from_location_id);
CREATE INDEX IF NOT EXISTS idx_to_line_to_location ON to_line(to_location_id);

-- Note: Keeping existing column names (to_number, from_warehouse_id, to_warehouse_id,
-- line_number, product_id, quantity, transferred_qty)
-- API and types will be updated to match actual DB names
