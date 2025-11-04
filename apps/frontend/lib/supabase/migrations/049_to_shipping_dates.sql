-- Migration 049: Add shipping and receiving date fields to Transfer Orders
-- This migration adds planned/actual ship and receive dates to to_header table
-- and fixes the status enum to match business logic

-- Add shipping and receiving date fields
ALTER TABLE to_header
  ADD COLUMN IF NOT EXISTS planned_ship_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS actual_ship_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS planned_receive_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS actual_receive_date TIMESTAMPTZ;

-- Constraint: receive after ship (planned dates only)
ALTER TABLE to_header
  DROP CONSTRAINT IF EXISTS check_ship_before_receive;

ALTER TABLE to_header
  ADD CONSTRAINT check_ship_before_receive 
  CHECK (planned_receive_date IS NULL OR planned_ship_date IS NULL 
         OR planned_receive_date >= planned_ship_date);

-- Fix status enum to match business workflow
ALTER TABLE to_header DROP CONSTRAINT IF EXISTS to_header_status_check;

ALTER TABLE to_header ADD CONSTRAINT to_header_status_check
  CHECK (status IN ('draft', 'submitted', 'in_transit', 'received', 'closed', 'cancelled'));

-- Migrate existing data: 'approved' -> 'submitted'
UPDATE to_header SET status = 'submitted' WHERE status = 'approved';

-- Create indexes for date queries
CREATE INDEX IF NOT EXISTS idx_to_header_ship_dates 
  ON to_header(planned_ship_date, actual_ship_date);

CREATE INDEX IF NOT EXISTS idx_to_header_receive_dates 
  ON to_header(planned_receive_date, actual_receive_date);

-- Add comments for documentation
COMMENT ON COLUMN to_header.planned_ship_date IS 'Planned date for shipping goods from source warehouse';
COMMENT ON COLUMN to_header.actual_ship_date IS 'Actual date when goods were shipped';
COMMENT ON COLUMN to_header.planned_receive_date IS 'Planned date for receiving goods at destination warehouse';
COMMENT ON COLUMN to_header.actual_receive_date IS 'Actual date when goods were received';

