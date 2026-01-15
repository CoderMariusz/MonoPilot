-- ============================================================================
-- Migration: 0332_add_missing_bom_items_columns.sql
-- Purpose: Add is_output, consume_whole_lp, and operation_seq columns to bom_items
-- Date: 2026-01-14
-- ============================================================================

-- Add is_output column (for by-products)
ALTER TABLE bom_items
  ADD COLUMN IF NOT EXISTS is_output BOOLEAN NOT NULL DEFAULT false;

-- Add consume_whole_lp column (for license plate consumption)
ALTER TABLE bom_items
  ADD COLUMN IF NOT EXISTS consume_whole_lp BOOLEAN NOT NULL DEFAULT false;

-- Ensure operation_seq column exists (may already exist from original migration)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bom_items' AND column_name = 'operation_seq'
  ) THEN
    ALTER TABLE bom_items ADD COLUMN operation_seq INTEGER;
  END IF;
END $$;

-- Add index for is_output queries
CREATE INDEX IF NOT EXISTS idx_bom_items_is_output
  ON bom_items(bom_id) WHERE is_output = true;

-- Comments
COMMENT ON COLUMN bom_items.is_output IS 'If true, this is an output by-product, not an input';
COMMENT ON COLUMN bom_items.consume_whole_lp IS 'If true, consume entire license plate';
COMMENT ON COLUMN bom_items.operation_seq IS 'Optional routing operation sequence number';
