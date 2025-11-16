-- Migration 058 ROLLBACK: Restore License Plate Status Enum to Original State
-- Purpose: Rollback LP status migration in case of issues
-- Date: 2025-11-15
-- Story: 0.3-fix-lp-status-enum (Epic 0 - CRITICAL)
--
-- IMPORTANT: This rollback script restores the old 6-status CHECK constraint
-- and maps new status values back to old equivalents
--
-- WARNING: Data loss may occur for statuses that don't map back cleanly:
--   - in_production → reserved (loses "in production" state)
--   - qa_passed → available (loses QA approval state)
--   - qa_rejected → damaged (approximate mapping)
--   - shipped → consumed (loses shipping state)

-- =====================================================
-- STEP 1: Precondition Check
-- =====================================================

DO $$
DECLARE
  lp_count INTEGER;
  status_counts RECORD;
BEGIN
  RAISE NOTICE '=== License Plate Status Rollback - Precondition Check ===';

  -- Count LPs using new statuses that will be mapped
  SELECT COUNT(*) INTO lp_count FROM license_plates
  WHERE status IN ('in_production', 'qa_passed', 'qa_rejected', 'shipped');

  IF lp_count > 0 THEN
    RAISE WARNING 'Found % LPs with new status values that will be mapped to old values', lp_count;
    RAISE NOTICE 'Distribution of new statuses to be mapped:';

    FOR status_counts IN
      SELECT status, COUNT(*) as count
      FROM license_plates
      WHERE status IN ('in_production', 'qa_passed', 'qa_rejected', 'shipped')
      GROUP BY status
      ORDER BY count DESC
    LOOP
      RAISE NOTICE '  - %: % LPs', status_counts.status, status_counts.count;
    END LOOP;
  ELSE
    RAISE NOTICE 'No LPs with new status values found - rollback will only revert schema';
  END IF;

  RAISE NOTICE '=== End Precondition Check ===';
END $$;

-- =====================================================
-- STEP 2: Drop New CHECK Constraint
-- =====================================================

ALTER TABLE license_plates
  DROP CONSTRAINT IF EXISTS license_plates_status_check;

RAISE NOTICE 'Dropped new 10-status CHECK constraint';

-- =====================================================
-- STEP 3: Data Migration - Map New Values Back to Old Values
-- =====================================================

-- Map new statuses back to closest old equivalents
-- WARNING: This is lossy - some business state information will be lost

-- Map "in_production" → "reserved"
-- Rationale: LP is still tied to a WO, but we lose the "actively processing" state
UPDATE license_plates
SET status = 'reserved'
WHERE status = 'in_production';

-- Map "qa_passed" → "available"
-- Rationale: QA passed means LP is approved for use
UPDATE license_plates
SET status = 'available'
WHERE status = 'qa_passed';

-- Map "qa_rejected" → "damaged"
-- Rationale: QA rejection often means physical/quality damage
UPDATE license_plates
SET status = 'damaged'
WHERE status = 'qa_rejected';

-- Map "shipped" → "consumed"
-- Rationale: Shipped LPs are no longer in warehouse, closest old state is consumed
-- Alternative: could map to "in_transit" if shipped means still in delivery
UPDATE license_plates
SET status = 'consumed'
WHERE status = 'shipped';

RAISE NOTICE 'Completed data mapping from new status values to old values';

-- =====================================================
-- STEP 4: Restore Original CHECK Constraint (6 statuses)
-- =====================================================

-- Restore original 6-status CHECK constraint from migration 025
ALTER TABLE license_plates
  ADD CONSTRAINT license_plates_status_check
  CHECK (status IN (
    'available',
    'reserved',
    'consumed',
    'in_transit',
    'quarantine',
    'damaged'
  ));

RAISE NOTICE 'Restored original 6-status CHECK constraint';

-- =====================================================
-- STEP 5: Restore Original Column Comment
-- =====================================================

COMMENT ON COLUMN license_plates.status IS
  'LP status: available (in stock), reserved (allocated to WO), consumed (used in production), in_transit (being transferred between warehouses), quarantine (QA hold), damaged';

RAISE NOTICE 'Restored original column comment';

-- =====================================================
-- STEP 6: Final Validation
-- =====================================================

DO $$
DECLARE
  invalid_count INTEGER;
BEGIN
  -- Check for any LPs with invalid status values (should be 0)
  SELECT COUNT(*) INTO invalid_count
  FROM license_plates
  WHERE status NOT IN (
    'available', 'reserved', 'consumed', 'in_transit', 'quarantine', 'damaged'
  );

  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'Rollback validation FAILED: % LPs have invalid status values', invalid_count;
  ELSE
    RAISE NOTICE '=== Rollback Validation: SUCCESS ===';
    RAISE NOTICE 'All LP status values are valid after rollback';
  END IF;
END $$;

-- =====================================================
-- Rollback Complete
-- =====================================================

RAISE NOTICE '========================================';
RAISE NOTICE 'Migration 058 Rollback Complete';
RAISE NOTICE 'License Plate Status restored to original 6-status enum';
RAISE NOTICE 'WARNING: Some business state may have been lost in mapping:';
RAISE NOTICE '  - in_production → reserved';
RAISE NOTICE '  - qa_passed → available';
RAISE NOTICE '  - qa_rejected → damaged';
RAISE NOTICE '  - shipped → consumed';
RAISE NOTICE 'TypeScript enum must be reverted to old values if code is also rolled back';
RAISE NOTICE '========================================';
