-- Migration 125: Rename is_by_product to is_output in bom_items
-- Fix naming inconsistency between database and code
-- Date: 2026-01-14

-- Rename column
ALTER TABLE bom_items
  RENAME COLUMN is_by_product TO is_output;

-- Update comment
COMMENT ON COLUMN bom_items.is_output IS 'If true, this is an output by-product, not an input';

-- Update constraint if needed (check constraint should still work)
-- The CHECK constraint on yield_percent references the column by name,
-- but PostgreSQL automatically updates the constraint when renaming column
