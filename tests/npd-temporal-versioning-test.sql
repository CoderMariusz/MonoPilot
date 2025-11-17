-- =============================================
-- NPD Temporal Versioning Smoke Test
-- =============================================
-- Action Item #3 from Epic NPD-6 Retrospective
-- Owner: Charlie (Senior Dev)
-- Purpose: Validate EXCLUDE constraints and immutability triggers
-- Date: 2025-11-16
-- =============================================

-- =============================================
-- TEST SETUP
-- =============================================
-- Note: org_id is INTEGER (no organizations table FK), value 9003 used for testing

-- Set session to test org
SELECT set_config('app.org_id', '9003', true);

-- Create test NPD project
DO $$
DECLARE
  v_project_id UUID;
BEGIN
  INSERT INTO npd_projects (
    id, org_id, project_number, project_name, current_gate, status,
    owner_id, created_by, updated_by, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), 9003, 'TEMPORAL-TEST-001', 'Temporal Versioning Test', 'G0', 'idea',
    NULL, NULL, NULL, NOW(), NOW()
  )
  RETURNING id INTO v_project_id;

  RAISE NOTICE 'Created test project: %', v_project_id;
END $$;

-- =============================================
-- TEST 1: EXCLUDE CONSTRAINT - NON-OVERLAPPING DATES (SHOULD SUCCEED)
-- =============================================

DO $$
DECLARE
  v_project_id UUID;
  v_formulation_v1 UUID;
  v_formulation_v2 UUID;
BEGIN
  -- Get test project ID
  SELECT id INTO v_project_id FROM npd_projects WHERE project_number = 'TEMPORAL-TEST-001';

  -- Create formulation v1.0 (2025-01-01 to 2025-06-30)
  INSERT INTO npd_formulations (
    id, org_id, npd_project_id, version, status,
    effective_from, effective_to, created_by, updated_by, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), 9003, v_project_id, 'v1.0', 'approved',
    '2025-01-01'::DATE, '2025-06-30'::DATE, NULL, NULL, NOW(), NOW()
  )
  RETURNING id INTO v_formulation_v1;

  -- Create formulation v2.0 (2025-07-01 to NULL) - NO OVERLAP, should succeed
  INSERT INTO npd_formulations (
    id, org_id, npd_project_id, version, status,
    effective_from, effective_to, created_by, updated_by, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), 9003, v_project_id, 'v2.0', 'approved',
    '2025-07-01'::DATE, NULL, NULL, NULL, NOW(), NOW()
  )
  RETURNING id INTO v_formulation_v2;

  RAISE NOTICE 'TEST 1 PASSED ✅: Non-overlapping formulations created successfully';
  RAISE NOTICE '  v1.0: 2025-01-01 to 2025-06-30 (ID: %)', v_formulation_v1;
  RAISE NOTICE '  v2.0: 2025-07-01 to NULL (ID: %)', v_formulation_v2;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'TEST 1 FAILED ❌: Non-overlapping dates should succeed. Error: %', SQLERRM;
END $$;

-- =============================================
-- TEST 2: EXCLUDE CONSTRAINT - OVERLAPPING DATES (SHOULD FAIL)
-- =============================================

DO $$
DECLARE
  v_project_id UUID;
  v_formulation_v3 UUID;
BEGIN
  -- Get test project ID
  SELECT id INTO v_project_id FROM npd_projects WHERE project_number = 'TEMPORAL-TEST-001';

  -- Try to create formulation v3.0 (2025-06-01 to 2025-08-31) - OVERLAPS with v1.0 and v2.0
  INSERT INTO npd_formulations (
    id, org_id, npd_project_id, version, status,
    effective_from, effective_to, created_by, updated_by, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), 9003, v_project_id, 'v3.0', 'draft',
    '2025-06-01'::DATE, '2025-08-31'::DATE, NULL, NULL, NOW(), NOW()
  )
  RETURNING id INTO v_formulation_v3;

  -- If we reach here, the test FAILED (constraint didn't block overlap)
  RAISE EXCEPTION 'TEST 2 FAILED ❌: EXCLUDE constraint should prevent overlapping dates';

EXCEPTION
  WHEN exclusion_violation THEN
    RAISE NOTICE 'TEST 2 PASSED ✅: EXCLUDE constraint blocked overlapping formulation (v3.0: 2025-06-01 to 2025-08-31)';
    RAISE NOTICE '  Error message: %', SQLERRM;
  WHEN OTHERS THEN
    IF SQLERRM LIKE '%conflicting key value violates exclusion constraint%' THEN
      RAISE NOTICE 'TEST 2 PASSED ✅: EXCLUDE constraint blocked overlapping formulation';
    ELSE
      RAISE EXCEPTION 'TEST 2 FAILED ❌: Unexpected error: %', SQLERRM;
    END IF;
END $$;

-- =============================================
-- TEST 3: EXCLUDE CONSTRAINT - EXACT OVERLAP (SHOULD FAIL)
-- =============================================

DO $$
DECLARE
  v_project_id UUID;
  v_formulation_v4 UUID;
BEGIN
  -- Get test project ID
  SELECT id INTO v_project_id FROM npd_projects WHERE project_number = 'TEMPORAL-TEST-001';

  -- Try to create formulation v4.0 with exact same dates as v1.0 (2025-01-01 to 2025-06-30)
  INSERT INTO npd_formulations (
    id, org_id, npd_project_id, version, status,
    effective_from, effective_to, created_by, updated_by, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), 9003, v_project_id, 'v4.0', 'draft',
    '2025-01-01'::DATE, '2025-06-30'::DATE, NULL, NULL, NOW(), NOW()
  )
  RETURNING id INTO v_formulation_v4;

  -- If we reach here, the test FAILED
  RAISE EXCEPTION 'TEST 3 FAILED ❌: EXCLUDE constraint should prevent exact date overlap';

EXCEPTION
  WHEN exclusion_violation THEN
    RAISE NOTICE 'TEST 3 PASSED ✅: EXCLUDE constraint blocked exact date overlap (v4.0: 2025-01-01 to 2025-06-30)';
  WHEN OTHERS THEN
    IF SQLERRM LIKE '%conflicting key value violates exclusion constraint%' THEN
      RAISE NOTICE 'TEST 3 PASSED ✅: EXCLUDE constraint blocked exact date overlap';
    ELSE
      RAISE EXCEPTION 'TEST 3 FAILED ❌: Unexpected error: %', SQLERRM;
    END IF;
END $$;

-- =============================================
-- TEST 4: EXCLUDE CONSTRAINT - SUPERSEDED STATUS EXCLUDED (SHOULD SUCCEED)
-- =============================================

DO $$
DECLARE
  v_project_id UUID;
  v_formulation_superseded UUID;
BEGIN
  -- Get test project ID
  SELECT id INTO v_project_id FROM npd_projects WHERE project_number = 'TEMPORAL-TEST-001';

  -- Create formulation with status='superseded' and overlapping dates (should SUCCEED because WHERE clause excludes superseded)
  INSERT INTO npd_formulations (
    id, org_id, npd_project_id, version, status,
    effective_from, effective_to, created_by, updated_by, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), 9003, v_project_id, 'v1.0-OLD', 'superseded',
    '2025-01-01'::DATE, '2025-06-30'::DATE, NULL, NULL, NOW(), NOW()
  )
  RETURNING id INTO v_formulation_superseded;

  RAISE NOTICE 'TEST 4 PASSED ✅: Superseded formulation with overlapping dates allowed (ID: %)', v_formulation_superseded;
  RAISE NOTICE '  Constraint WHERE clause correctly excludes status=''superseded'' from overlap check';

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'TEST 4 FAILED ❌: Superseded formulations should be allowed to overlap. Error: %', SQLERRM;
END $$;

-- =============================================
-- TEST 5: IMMUTABILITY TRIGGER - LOCK FORMULATION
-- =============================================

DO $$
DECLARE
  v_formulation_id UUID;
  v_test_user_id UUID;
BEGIN
  -- Get formulation v1.0 ID
  SELECT id INTO v_formulation_id
  FROM npd_formulations
  WHERE version = 'v1.0' AND status = 'approved'
  LIMIT 1;

  -- Get any user ID for locked_by (or use NULL if users table is empty)
  SELECT id INTO v_test_user_id FROM users LIMIT 1;

  -- Lock the formulation
  UPDATE npd_formulations
  SET
    locked_at = NOW(),
    locked_by = v_test_user_id
  WHERE id = v_formulation_id;

  RAISE NOTICE 'TEST 5 SETUP: Formulation v1.0 locked at % by user %', NOW(), COALESCE(v_test_user_id::TEXT, 'NULL');

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'TEST 5 SETUP FAILED: Could not lock formulation. Error: %', SQLERRM;
END $$;

-- =============================================
-- TEST 6: IMMUTABILITY TRIGGER - ATTEMPT UPDATE ON LOCKED (SHOULD FAIL)
-- =============================================

DO $$
DECLARE
  v_formulation_id UUID;
BEGIN
  -- Get locked formulation ID
  SELECT id INTO v_formulation_id
  FROM npd_formulations
  WHERE version = 'v1.0' AND locked_at IS NOT NULL
  LIMIT 1;

  -- Try to update locked formulation (should FAIL)
  UPDATE npd_formulations
  SET status = 'draft'
  WHERE id = v_formulation_id;

  -- If we reach here, the test FAILED
  RAISE EXCEPTION 'TEST 6 FAILED ❌: Trigger should prevent editing locked formulation';

EXCEPTION
  WHEN integrity_constraint_violation THEN
    RAISE NOTICE 'TEST 6 PASSED ✅: Immutability trigger blocked update to locked formulation';
    RAISE NOTICE '  Error message: %', SQLERRM;
  WHEN OTHERS THEN
    IF SQLERRM LIKE '%Cannot modify locked formulation%' THEN
      RAISE NOTICE 'TEST 6 PASSED ✅: Immutability trigger blocked update to locked formulation';
      RAISE NOTICE '  Error details: %', SQLERRM;
    ELSE
      RAISE EXCEPTION 'TEST 6 FAILED ❌: Unexpected error: %', SQLERRM;
    END IF;
END $$;

-- =============================================
-- TEST 7: GENERATED COLUMN - is_current_version
-- =============================================

DO $$
DECLARE
  v_count_current INTEGER;
BEGIN
  -- Count formulations with is_current_version = TRUE
  -- Should be exactly 1 (v2.0 with effective_to = NULL and status = 'approved')
  SELECT COUNT(*)
  INTO v_count_current
  FROM npd_formulations
  WHERE is_current_version = TRUE
    AND version IN ('v1.0', 'v2.0', 'v1.0-OLD');

  IF v_count_current = 1 THEN
    RAISE NOTICE 'TEST 7 PASSED ✅: Exactly 1 current version found (is_current_version = TRUE)';
  ELSE
    RAISE EXCEPTION 'TEST 7 FAILED ❌: Expected 1 current version, found %', v_count_current;
  END IF;

  -- Verify it's v2.0
  IF EXISTS (
    SELECT 1 FROM npd_formulations
    WHERE version = 'v2.0' AND is_current_version = TRUE
  ) THEN
    RAISE NOTICE 'TEST 7 VERIFIED: Current version is v2.0 (effective_to = NULL, status = approved)';
  ELSE
    RAISE EXCEPTION 'TEST 7 FAILED ❌: Current version should be v2.0';
  END IF;

END $$;

-- =============================================
-- TEST 8: GENERATED COLUMN - Manual Assignment Should Fail
-- =============================================

DO $$
DECLARE
  v_project_id UUID;
  v_formulation_id UUID;
BEGIN
  -- Get test project ID
  SELECT id INTO v_project_id FROM npd_projects WHERE project_number = 'TEMPORAL-TEST-001';

  -- Try to manually set is_current_version (should FAIL - it's a GENERATED column)
  INSERT INTO npd_formulations (
    id, org_id, npd_project_id, version, status,
    effective_from, effective_to, is_current_version,
    created_by, updated_by, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), 9003, v_project_id, 'v5.0', 'draft',
    '2025-09-01'::DATE, NULL, FALSE,
    NULL, NULL, NOW(), NOW()
  )
  RETURNING id INTO v_formulation_id;

  -- If we reach here, the test FAILED
  RAISE EXCEPTION 'TEST 8 FAILED ❌: Should not be able to manually set GENERATED ALWAYS AS column';

EXCEPTION
  WHEN generated_always THEN
    RAISE NOTICE 'TEST 8 PASSED ✅: Cannot manually assign to GENERATED ALWAYS AS column (is_current_version)';
  WHEN OTHERS THEN
    IF SQLERRM LIKE '%cannot insert into column%' OR SQLERRM LIKE '%generated always%' THEN
      RAISE NOTICE 'TEST 8 PASSED ✅: Cannot manually assign to GENERATED column';
    ELSE
      RAISE EXCEPTION 'TEST 8 FAILED ❌: Unexpected error: %', SQLERRM;
    END IF;
END $$;

-- =============================================
-- CLEANUP
-- =============================================

-- Delete test data
SELECT set_config('app.org_id', '9003', true);

DELETE FROM npd_formulations WHERE npd_project_id IN (
  SELECT id FROM npd_projects WHERE project_number = 'TEMPORAL-TEST-001'
);

DELETE FROM npd_projects WHERE project_number = 'TEMPORAL-TEST-001';

-- Note: org_id 9003 is test value, can be reused for future tests

-- =============================================
-- TEST SUMMARY
-- =============================================

SELECT
  '✅ TEMPORAL VERSIONING SMOKE TEST COMPLETE' AS summary,
  'All 8 tests passed if you see only PASS ✅ above' AS instructions,
  'Re-run this script anytime to verify temporal constraints' AS note;
