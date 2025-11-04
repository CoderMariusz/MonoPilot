-- Migration 050: Add License Plate and batch tracking to Transfer Order line items
-- This migration adds lp_id and batch fields to to_line table for tracking specific
-- pallets and batches during transfers

-- Add License Plate and batch tracking to TO line items
ALTER TABLE to_line
  ADD COLUMN IF NOT EXISTS lp_id INTEGER REFERENCES license_plates(id),
  ADD COLUMN IF NOT EXISTS batch VARCHAR(100);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_to_line_lp ON to_line(lp_id);
CREATE INDEX IF NOT EXISTS idx_to_line_batch ON to_line(batch);

-- Add comments for documentation
COMMENT ON COLUMN to_line.lp_id IS 'License Plate used for this transfer (if applicable)';
COMMENT ON COLUMN to_line.batch IS 'Batch/lot number of transferred material';

