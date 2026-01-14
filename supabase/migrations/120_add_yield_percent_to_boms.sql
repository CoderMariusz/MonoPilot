/**
 * Migration: Add yield_percent to boms table
 * Story: FR-2.34 BOM Yield Calculation (Simple MVP)
 * Date: 2026-01-14
 *
 * Adds yield_percent field to boms table for simple yield calculation:
 * actual_output = planned_output × (yield_percent / 100)
 *
 * Default 100% (no waste), range 0.01-100.00
 */

-- Add yield_percent column
ALTER TABLE boms
  ADD COLUMN IF NOT EXISTS yield_percent DECIMAL(5,2) NOT NULL DEFAULT 100.00;

-- Add check constraint (only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_yield_percent'
  ) THEN
    ALTER TABLE boms
      ADD CONSTRAINT check_yield_percent
      CHECK (yield_percent > 0 AND yield_percent <= 100);
  END IF;
END $$;

-- Add comment
COMMENT ON COLUMN boms.yield_percent IS 'Expected yield percentage (0.01-100.00, default 100.00). Used for calculating actual output accounting for waste: actual_qty = planned_qty × (yield_percent / 100)';
