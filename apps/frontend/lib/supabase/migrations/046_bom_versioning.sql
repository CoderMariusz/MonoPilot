-- Migration: 046_bom_versioning.sql
-- Description: Add date-based versioning to BOMs
-- Epic: EPIC-001 BOM Complexity v2 - Phase 2 (Multi-Version BOM)
-- Created: 2025-01-11

-- ============================================================================
-- ALTER TABLE: boms
-- Add date range columns for versioning
-- ============================================================================

-- Add effective_from date (when this BOM version becomes active)
ALTER TABLE boms 
  ADD COLUMN IF NOT EXISTS effective_from TIMESTAMPTZ DEFAULT NOW();

-- Add effective_to date (when this BOM version expires, NULL = no expiry)
ALTER TABLE boms 
  ADD COLUMN IF NOT EXISTS effective_to TIMESTAMPTZ;

-- Add constraint: effective_from must be before effective_to
ALTER TABLE boms 
  ADD CONSTRAINT boms_effective_dates_check 
  CHECK (effective_to IS NULL OR effective_from < effective_to);

-- ============================================================================
-- FUNCTION: check_bom_date_overlap
-- Purpose: Prevent overlapping date ranges for same product's BOMs
-- ============================================================================

CREATE OR REPLACE FUNCTION check_bom_date_overlap()
RETURNS TRIGGER AS $$
DECLARE
  v_overlap_count INTEGER;
BEGIN
  -- Count BOMs for same product with overlapping date ranges
  SELECT COUNT(*) INTO v_overlap_count
  FROM boms
  WHERE product_id = NEW.product_id
    AND id != COALESCE(NEW.id, -1)  -- Exclude current BOM (for updates)
    AND status = 'active'
    AND (
      -- Check if date ranges overlap using PostgreSQL range operators
      tstzrange(effective_from, COALESCE(effective_to, 'infinity'::timestamptz), '[)') 
      && 
      tstzrange(NEW.effective_from, COALESCE(NEW.effective_to, 'infinity'::timestamptz), '[)')
    );

  IF v_overlap_count > 0 THEN
    RAISE EXCEPTION 'BOM date range overlaps with existing active BOM for product %', NEW.product_id
      USING HINT = 'Each product can only have one active BOM per date range. Please adjust effective_from/effective_to dates.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS check_bom_date_overlap_trigger ON boms;
CREATE TRIGGER check_bom_date_overlap_trigger
  BEFORE INSERT OR UPDATE ON boms
  FOR EACH ROW
  WHEN (NEW.status = 'active')
  EXECUTE FUNCTION check_bom_date_overlap();

-- ============================================================================
-- INDEXES
-- Add indexes for efficient BOM version queries
-- ============================================================================

-- Index for finding BOM by product and date range
CREATE INDEX IF NOT EXISTS idx_boms_product_date_range 
  ON boms(product_id, effective_from, effective_to) 
  WHERE status = 'active';

-- Index for finding current BOMs (effective_to is NULL or in future)
-- Note: Cannot use NOW() in index predicate as it's not IMMUTABLE
CREATE INDEX IF NOT EXISTS idx_boms_current 
  ON boms(product_id, effective_from) 
  WHERE status = 'active';

-- GiST index for efficient range overlap queries
-- First, enable btree_gist extension (required for INTEGER in GIST index)
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE INDEX IF NOT EXISTS idx_boms_daterange 
  ON boms USING GIST (
    product_id, 
    tstzrange(effective_from, COALESCE(effective_to, 'infinity'::timestamptz), '[)')
  )
  WHERE status = 'active';

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON COLUMN boms.effective_from IS 'Date when this BOM version becomes active. Multiple versions can exist for same product with different date ranges.';

COMMENT ON COLUMN boms.effective_to IS 'Date when this BOM version expires (NULL = no expiry, indefinitely active). Used for planned recipe changes.';

COMMENT ON FUNCTION check_bom_date_overlap() IS 'Validates that BOM date ranges do not overlap for the same product. Prevents conflicting BOM versions.';

-- ============================================================================
-- DATA MIGRATION
-- Set effective_from for existing BOMs to their creation date
-- ============================================================================

-- Update existing BOMs to have effective_from = created_at
UPDATE boms 
SET effective_from = created_at 
WHERE effective_from IS NULL;

-- Existing BOMs have no expiry date (effective_to = NULL)
-- This is the correct default - they are active indefinitely

-- ============================================================================
-- EXAMPLE USAGE
-- ============================================================================

/*
Example 1: Create BOM v1 (current recipe)
INSERT INTO boms (product_id, status, effective_from, effective_to)
VALUES (100, 'active', '2025-01-01', NULL);

Example 2: Create BOM v2 (future recipe change)
INSERT INTO boms (product_id, status, effective_from, effective_to)
VALUES (100, 'active', '2025-03-01', NULL);  -- Replaces v1 starting March 1

-- This will fail (overlapping dates):
INSERT INTO boms (product_id, status, effective_from, effective_to)
VALUES (100, 'active', '2025-02-15', '2025-03-15');  -- ❌ Overlaps with v1 and v2

Example 3: Seasonal variant
INSERT INTO boms (product_id, status, effective_from, effective_to)
VALUES (100, 'active', '2025-12-01', '2026-01-15');  -- Christmas special recipe

Example 4: Find current BOM for product
SELECT * FROM boms
WHERE product_id = 100
  AND status = 'active'
  AND effective_from <= NOW()
  AND (effective_to IS NULL OR effective_to > NOW())
ORDER BY effective_from DESC
LIMIT 1;
*/

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

