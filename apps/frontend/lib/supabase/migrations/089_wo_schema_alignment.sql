-- Migration 089: WO Schema Alignment
-- Story: 0-18-wo-database-api-alignment
-- Adds missing columns to work_orders for future features

-- Phase 1: Add future-proofing columns to work_orders
ALTER TABLE work_orders
  ADD COLUMN IF NOT EXISTS source_demand_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS source_demand_id BIGINT,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS machine_id BIGINT REFERENCES machines(id);

-- Note: Keep existing column names:
-- - planned_qty (not quantity)
-- - scheduled_date (not due_date)
-- - start_date (not scheduled_start)
-- - end_date (not scheduled_end)
-- - production_line_id (not line_id)

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_work_orders_source_demand
  ON work_orders(source_demand_type, source_demand_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_machine_id
  ON work_orders(machine_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_approved_by
  ON work_orders(approved_by);
