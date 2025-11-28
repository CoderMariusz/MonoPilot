-- Migration 034: Add BOM reference to Work Orders
-- Story 3.10: Work Order CRUD - BOM Auto-Selection (AC-3.10.3)
-- Adds bom_id column and foreign key to work_orders table

-- Add bom_id column to work_orders
ALTER TABLE work_orders
  ADD COLUMN IF NOT EXISTS bom_id UUID REFERENCES boms(id) ON DELETE SET NULL;

-- Create index for bom_id
CREATE INDEX IF NOT EXISTS idx_work_orders_bom ON work_orders(bom_id);

-- Comment
COMMENT ON COLUMN work_orders.bom_id IS 'Auto-selected BOM based on scheduled date (effective_from <= date AND effective_to IS NULL OR >= date)';
