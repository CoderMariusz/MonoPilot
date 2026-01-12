-- Migration: 103_add_wo_complete_fields.sql
-- Description: Add completed_by_user_id and actual_yield_percent to work_orders
-- Story: 04.2c - WO Complete (Execution End)
-- Date: 2026-01-09
-- Author: BACKEND-DEV

BEGIN;

-- =============================================================================
-- ADD COLUMNS to work_orders table
-- =============================================================================

-- Add completed_by_user_id column to track who completed the WO
ALTER TABLE work_orders
ADD COLUMN IF NOT EXISTS completed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

COMMENT ON COLUMN work_orders.completed_by_user_id IS 'User who completed the work order (Story 04.2c)';

-- Add actual_yield_percent column to store calculated yield on completion
ALTER TABLE work_orders
ADD COLUMN IF NOT EXISTS actual_yield_percent DECIMAL(5,2);

-- Add constraint for valid yield range
ALTER TABLE work_orders
ADD CONSTRAINT wo_actual_yield_range
CHECK (actual_yield_percent IS NULL OR (actual_yield_percent >= 0 AND actual_yield_percent <= 999.99));

COMMENT ON COLUMN work_orders.actual_yield_percent IS 'Calculated yield percentage on completion: (produced_qty / planned_qty * 100)';

-- =============================================================================
-- INDEX for completed_by_user_id (useful for user activity queries)
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_wo_completed_by
ON work_orders(completed_by_user_id)
WHERE completed_by_user_id IS NOT NULL;

-- =============================================================================
-- FUNCTION: calculate_wo_yield
-- Calculates yield percentage for a work order
-- =============================================================================

CREATE OR REPLACE FUNCTION calculate_wo_yield(
  p_produced_qty DECIMAL,
  p_planned_qty DECIMAL
)
RETURNS DECIMAL AS $$
BEGIN
  -- Avoid division by zero
  IF p_planned_qty IS NULL OR p_planned_qty = 0 THEN
    RETURN 0;
  END IF;

  -- Calculate yield: (produced / planned) * 100, rounded to 2 decimals
  RETURN ROUND((COALESCE(p_produced_qty, 0) / p_planned_qty) * 100, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_wo_yield IS 'Calculate WO yield percentage (Story 04.2c)';

COMMIT;
