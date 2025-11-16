-- Migration 059: UoM Master Table
-- Story 0.5: Fix License Plate UoM Constraint
-- Decision: Create master table for extensible UoM management
-- Replaces restrictive CHECK constraint with FK to master table

-- ============================================================================
-- STEP 1: Create uom_master table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.uom_master (
  code VARCHAR(20) PRIMARY KEY,
  display_name VARCHAR(50) NOT NULL,
  category VARCHAR(20) NOT NULL CHECK (category IN ('weight', 'volume', 'length', 'count', 'container')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.uom_master IS 'Master table for Units of Measure - provides validation and extensibility for product UoM values';
COMMENT ON COLUMN public.uom_master.code IS 'UoM code (e.g., KG, GALLON) - used in license_plates.uom';
COMMENT ON COLUMN public.uom_master.display_name IS 'Human-readable name (e.g., "Kilogram", "US Gallon")';
COMMENT ON COLUMN public.uom_master.category IS 'UoM category: weight, volume, length, count, or container';

-- ============================================================================
-- STEP 2: Insert standard UoM values
-- ============================================================================

-- Weight units
INSERT INTO public.uom_master (code, display_name, category) VALUES
  ('KG', 'Kilogram', 'weight'),
  ('POUND', 'Pound', 'weight'),
  ('GRAM', 'Gram', 'weight'),
  ('TON', 'Metric Ton', 'weight'),
  ('OUNCE', 'Ounce', 'weight');

-- Volume units
INSERT INTO public.uom_master (code, display_name, category) VALUES
  ('LITER', 'Liter', 'volume'),
  ('GALLON', 'US Gallon', 'volume'),
  ('MILLILITER', 'Milliliter', 'volume'),
  ('BARREL', 'Barrel', 'volume'),
  ('QUART', 'Quart', 'volume');

-- Length units
INSERT INTO public.uom_master (code, display_name, category) VALUES
  ('METER', 'Meter', 'length'),
  ('FOOT', 'Foot', 'length'),
  ('INCH', 'Inch', 'length'),
  ('CENTIMETER', 'Centimeter', 'length');

-- Count units
INSERT INTO public.uom_master (code, display_name, category) VALUES
  ('EACH', 'Each (Unit)', 'count'),
  ('DOZEN', 'Dozen', 'count');

-- Container units
INSERT INTO public.uom_master (code, display_name, category) VALUES
  ('BOX', 'Box', 'container'),
  ('CASE', 'Case', 'container'),
  ('PALLET', 'Pallet', 'container'),
  ('DRUM', 'Drum', 'container'),
  ('BAG', 'Bag', 'container'),
  ('CARTON', 'Carton', 'container');

-- ============================================================================
-- STEP 3: Verify existing license_plates data
-- ============================================================================

-- Check for any UoM values not in the new master table
-- This should return 0 rows if all existing data is compatible
DO $$
DECLARE
  orphaned_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT uom) INTO orphaned_count
  FROM public.license_plates
  WHERE uom NOT IN (SELECT code FROM public.uom_master);

  IF orphaned_count > 0 THEN
    RAISE NOTICE 'WARNING: Found % distinct UoM values not in uom_master', orphaned_count;
    RAISE NOTICE 'Run this query to see them: SELECT DISTINCT uom FROM license_plates WHERE uom NOT IN (SELECT code FROM uom_master)';
  ELSE
    RAISE NOTICE 'SUCCESS: All existing license_plates.uom values are in uom_master';
  END IF;
END $$;

-- ============================================================================
-- STEP 4: Drop old CHECK constraint
-- ============================================================================

-- Find the exact constraint name (it might be auto-generated)
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'public.license_plates'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%uom%IN%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.license_plates DROP CONSTRAINT IF EXISTS %I', constraint_name);
    RAISE NOTICE 'Dropped CHECK constraint: %', constraint_name;
  ELSE
    RAISE NOTICE 'No UoM CHECK constraint found (may have been dropped already)';
  END IF;
END $$;

-- ============================================================================
-- STEP 5: Add foreign key constraint to uom_master
-- ============================================================================

ALTER TABLE public.license_plates
  ADD CONSTRAINT fk_license_plates_uom
  FOREIGN KEY (uom) REFERENCES public.uom_master(code)
  ON DELETE RESTRICT
  ON UPDATE CASCADE;

COMMENT ON CONSTRAINT fk_license_plates_uom ON public.license_plates IS 'Ensures UoM values match master table - prevents typos and maintains data integrity';

-- ============================================================================
-- STEP 6: Create index for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_uom_master_category ON public.uom_master(category);

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Summary:
-- - Created uom_master table with 22 standard units
-- - Verified existing LP data compatibility
-- - Removed restrictive CHECK constraint
-- - Added FK constraint for validation
-- - System now supports extensible UoM management via INSERT into uom_master
