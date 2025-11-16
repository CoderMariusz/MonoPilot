-- Migration 058: Fix License Plate Status Enum
-- Purpose: Synchronize LP status values between database and TypeScript
-- Date: 2025-11-15
-- Story: 0.3-fix-lp-status-enum (Epic 0 - CRITICAL)
-- Dependencies: 025_license_plates
--
-- Problem: Severe mismatch between DB (6 statuses) and TypeScript (5 different statuses)
-- Solution: Unified enum with 10 statuses (lowercase snake_case convention)
--
-- Old DB statuses: available, reserved, consumed, in_transit, quarantine, damaged
-- Old TS statuses: Available, Reserved, In Production, QA Hold, QA Released, QA Rejected, Shipped
-- New unified: available, reserved, in_production, consumed, in_transit, quarantine, qa_passed, qa_rejected, shipped, damaged

-- =====================================================
-- STEP 1: Precondition Checks and Data Audit
-- =====================================================

DO $$
DECLARE
  lp_count INTEGER;
  status_counts RECORD;
BEGIN
  -- Count existing License Plates
  SELECT COUNT(*) INTO lp_count FROM license_plates;

  RAISE NOTICE '=== License Plate Status Migration - Precondition Check ===';
  RAISE NOTICE 'Total License Plates in database: %', lp_count;

  -- Log current status distribution
  IF lp_count > 0 THEN
    RAISE NOTICE 'Current status distribution:';
    FOR status_counts IN
      SELECT status, COUNT(*) as count
      FROM license_plates
      GROUP BY status
      ORDER BY count DESC
    LOOP
      RAISE NOTICE '  - %: % LPs', status_counts.status, status_counts.count;
    END LOOP;
  ELSE
    RAISE NOTICE 'No existing License Plates found - migration will only update schema';
  END IF;

  RAISE NOTICE '=== End Precondition Check ===';
END $$;

-- =====================================================
-- STEP 2: Drop Old CHECK Constraint
-- =====================================================

-- Drop existing CHECK constraint on status column
ALTER TABLE license_plates
  DROP CONSTRAINT IF EXISTS license_plates_status_check;

RAISE NOTICE 'Dropped old CHECK constraint: license_plates_status_check';

-- =====================================================
-- STEP 3: Data Migration - Map Old Values to New Values
-- =====================================================

-- Note: Current DB uses lowercase (available, reserved, etc.)
-- TypeScript uses Title Case with spaces (In Production, QA Hold, etc.)
-- If any data was inserted via TypeScript (unlikely due to constraint), map it
-- Most likely this will find 0 rows to update, but we handle it defensively

-- Map potential TypeScript-style values to new unified enum
-- These UPDATEs will only affect rows if they somehow bypassed the CHECK constraint

-- Map "In Production" → "in_production" (if any exist)
UPDATE license_plates
SET status = 'in_production'
WHERE status = 'In Production';

-- Map "QA Hold" → "quarantine" (if any exist)
UPDATE license_plates
SET status = 'quarantine'
WHERE status = 'QA Hold';

-- Map "QA Released" → "qa_passed" (if any exist)
UPDATE license_plates
SET status = 'qa_passed'
WHERE status = 'QA Released' OR status = 'QA Released';

-- Map "QA Rejected" → "qa_rejected" (if any exist)
UPDATE license_plates
SET status = 'qa_rejected'
WHERE status = 'QA Rejected';

-- Map "Shipped" → "shipped" (if any exist)
UPDATE license_plates
SET status = 'shipped'
WHERE status = 'Shipped';

-- Map Title Case to lowercase (if any exist)
UPDATE license_plates
SET status = 'available'
WHERE status = 'Available';

UPDATE license_plates
SET status = 'reserved'
WHERE status = 'Reserved';

-- Note: consumed, in_transit, quarantine, damaged already lowercase - no mapping needed

RAISE NOTICE 'Completed data mapping for old status values';

-- =====================================================
-- STEP 4: Add New CHECK Constraint with 10 Unified Statuses
-- =====================================================

-- Add new CHECK constraint with comprehensive 10-status enum
ALTER TABLE license_plates
  ADD CONSTRAINT license_plates_status_check
  CHECK (status IN (
    'available',      -- LP in warehouse, ready for use/shipping
    'reserved',       -- LP reserved for specific Work Order
    'in_production',  -- LP actively being consumed/processed in WO (NEW - maps from TS "In Production")
    'consumed',       -- LP fully consumed, genealogy locked, traceability complete
    'in_transit',     -- LP moving between warehouses (via Transfer Order)
    'quarantine',     -- LP held for QA inspection (maps from TS "QA Hold")
    'qa_passed',      -- LP passed QA inspection (NEW - maps from TS "QA Released")
    'qa_rejected',    -- LP failed QA inspection (NEW - maps from TS "QA Rejected")
    'shipped',        -- LP shipped to customer, final state (NEW - maps from TS "Shipped")
    'damaged'         -- LP physically damaged, unusable
  ));

RAISE NOTICE 'Added new CHECK constraint with 10 unified statuses';

-- =====================================================
-- STEP 5: Verify Default Value (should already be 'available')
-- =====================================================

-- No change needed - default is already 'available' from migration 025
-- But we'll verify it's still set correctly

DO $$
BEGIN
  -- Confirm default is 'available'
  PERFORM 1
  FROM information_schema.columns
  WHERE table_name = 'license_plates'
    AND column_name = 'status'
    AND column_default = '''available''::character varying';

  IF NOT FOUND THEN
    RAISE WARNING 'Default value for status column is not set to available - may need manual fix';
  ELSE
    RAISE NOTICE 'Default value verified: status defaults to ''available''';
  END IF;
END $$;

-- =====================================================
-- STEP 6: Update Column Comment with New Lifecycle
-- =====================================================

COMMENT ON COLUMN license_plates.status IS
  'LP status lifecycle:
   - available: In warehouse, ready for use/shipping
   - reserved: Reserved for specific Work Order (via lp_reservations)
   - in_production: Actively being consumed/processed in WO
   - consumed: Fully consumed by WO, genealogy locked, traceability complete
   - in_transit: Moving between warehouses (via Transfer Order)
   - quarantine: Held for QA inspection
   - qa_passed: Passed QA inspection, available for use
   - qa_rejected: Failed QA inspection, may be damaged or require rework
   - shipped: Shipped to customer (final state)
   - damaged: Physically damaged, unusable

   Primary lifecycle: available → reserved → in_production → consumed
   Shipping path: consumed → (output LP created) → available → shipped
   QA path: available → quarantine → qa_passed/qa_rejected
   Transit path: available → in_transit → available (at destination)';

RAISE NOTICE 'Updated column comment with comprehensive lifecycle documentation';

-- =====================================================
-- STEP 7: Final Validation
-- =====================================================

DO $$
DECLARE
  invalid_count INTEGER;
BEGIN
  -- Check for any LPs with invalid status values (should be 0)
  SELECT COUNT(*) INTO invalid_count
  FROM license_plates
  WHERE status NOT IN (
    'available', 'reserved', 'in_production', 'consumed',
    'in_transit', 'quarantine', 'qa_passed', 'qa_rejected',
    'shipped', 'damaged'
  );

  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'Migration validation FAILED: % LPs have invalid status values', invalid_count;
  ELSE
    RAISE NOTICE '=== Migration Validation: SUCCESS ===';
    RAISE NOTICE 'All LP status values are valid';
  END IF;
END $$;

-- =====================================================
-- Migration Complete
-- =====================================================

RAISE NOTICE '========================================';
RAISE NOTICE 'Migration 058 Complete: LP Status Enum Fixed';
RAISE NOTICE 'Database now has 10 unified status values';
RAISE NOTICE 'TypeScript enum must be updated to match';
RAISE NOTICE '========================================';
