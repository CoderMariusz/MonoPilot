-- =============================================
-- NPD RLS Policy Verification Test
-- =============================================
-- Action Item #2 from Epic NPD-6 Retrospective
-- Owner: Dana (QA Engineer)
-- Purpose: Verify multi-tenant isolation for NPD tables
-- Date: 2025-11-16
-- =============================================

-- =============================================
-- TEST SETUP
-- =============================================
-- Note: org_id is INTEGER (no organizations table FK), values 9001/9002 used for testing

-- Step 1: Create test NPD project for Org A
DO $$
DECLARE
  v_project_id_a UUID;
BEGIN
  -- Set session to Org A
  PERFORM set_config('app.org_id', '9001', true);

  -- Insert project for Org A
  INSERT INTO npd_projects (
    id, org_id, project_number, project_name, current_gate, status,
    owner_id, created_by, updated_by, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), 9001, 'TEST-ORG-A-001', 'Test Project Org A', 'G0', 'idea',
    NULL, NULL, NULL, NOW(), NOW()
  )
  RETURNING id INTO v_project_id_a;

  RAISE NOTICE 'Created test project for Org A: %', v_project_id_a;
END $$;

-- Step 2: Create test NPD project for Org B
DO $$
DECLARE
  v_project_id_b UUID;
BEGIN
  -- Set session to Org B
  PERFORM set_config('app.org_id', '9002', true);

  -- Insert project for Org B
  INSERT INTO npd_projects (
    id, org_id, project_number, project_name, current_gate, status,
    owner_id, created_by, updated_by, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), 9002, 'TEST-ORG-B-001', 'Test Project Org B', 'G0', 'idea',
    NULL, NULL, NULL, NOW(), NOW()
  )
  RETURNING id INTO v_project_id_b;

  RAISE NOTICE 'Created test project for Org B: %', v_project_id_b;
END $$;

-- =============================================
-- TEST 1: SELECT ISOLATION (Org A should only see Org A data)
-- =============================================

-- Set session to Org A
SELECT set_config('app.org_id', '9001', true);

-- Query should return only Org A project
SELECT
  'TEST 1A: Org A SELECT' AS test_name,
  COUNT(*) AS result,
  CASE
    WHEN COUNT(*) = 1 THEN 'PASS ✅'
    ELSE 'FAIL ❌ (Expected 1 row, got ' || COUNT(*) || ')'
  END AS status
FROM npd_projects
WHERE project_number LIKE 'TEST-ORG-%';

-- Verify project is from Org A
SELECT
  'TEST 1B: Org A Data Integrity' AS test_name,
  project_number,
  org_id,
  CASE
    WHEN org_id = 9001 THEN 'PASS ✅'
    ELSE 'FAIL ❌ (Expected org_id=9001, got ' || org_id || ')'
  END AS status
FROM npd_projects
WHERE project_number LIKE 'TEST-ORG-%';

-- =============================================
-- TEST 2: SELECT ISOLATION (Org B should only see Org B data)
-- =============================================

-- Set session to Org B
SELECT set_config('app.org_id', '9002', true);

-- Query should return only Org B project
SELECT
  'TEST 2A: Org B SELECT' AS test_name,
  COUNT(*) AS result,
  CASE
    WHEN COUNT(*) = 1 THEN 'PASS ✅'
    ELSE 'FAIL ❌ (Expected 1 row, got ' || COUNT(*) || ')'
  END AS status
FROM npd_projects
WHERE project_number LIKE 'TEST-ORG-%';

-- Verify project is from Org B
SELECT
  'TEST 2B: Org B Data Integrity' AS test_name,
  project_number,
  org_id,
  CASE
    WHEN org_id = 9002 THEN 'PASS ✅'
    ELSE 'FAIL ❌ (Expected org_id=9002, got ' || org_id || ')'
  END AS status
FROM npd_projects
WHERE project_number LIKE 'TEST-ORG-%';

-- =============================================
-- TEST 3: INSERT CROSS-ORG PROTECTION
-- =============================================

-- Set session to Org A
SELECT set_config('app.org_id', '9001', true);

-- Try to insert project with Org B's org_id (should FAIL)
DO $$
BEGIN
  INSERT INTO npd_projects (
    id, org_id, project_number, project_name, current_gate, status,
    owner_id, created_by, updated_by, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), 9002, 'MALICIOUS-INSERT', 'Malicious Project', 'G0', 'idea',
    NULL, NULL, NULL, NOW(), NOW()
  );

  RAISE EXCEPTION 'TEST 3 FAILED ❌: Cross-org INSERT should have been blocked by RLS policy';
EXCEPTION
  WHEN OTHERS THEN
    IF SQLERRM LIKE '%new row violates row-level security policy%' THEN
      RAISE NOTICE 'TEST 3: Cross-org INSERT blocked ✅ PASS';
    ELSE
      RAISE NOTICE 'TEST 3 FAILED ❌: Unexpected error: %', SQLERRM;
    END IF;
END $$;

-- =============================================
-- TEST 4: UPDATE CROSS-ORG PROTECTION
-- =============================================

-- Set session to Org A, try to update Org B's project (should see 0 rows, UPDATE no-op)
SELECT set_config('app.org_id', '9001', true);

WITH update_result AS (
  UPDATE npd_projects
  SET project_name = 'Hacked Project'
  WHERE project_number = 'TEST-ORG-B-001'
  RETURNING id
)
SELECT
  'TEST 4: Cross-org UPDATE blocked' AS test_name,
  COUNT(*) AS rows_updated,
  CASE
    WHEN COUNT(*) = 0 THEN 'PASS ✅'
    ELSE 'FAIL ❌ (Cross-org UPDATE should affect 0 rows)'
  END AS status
FROM update_result;

-- =============================================
-- TEST 5: DELETE CROSS-ORG PROTECTION
-- =============================================

-- Set session to Org A, try to delete Org B's project (should see 0 rows, DELETE no-op)
SELECT set_config('app.org_id', '9001', true);

WITH delete_result AS (
  DELETE FROM npd_projects
  WHERE project_number = 'TEST-ORG-B-001'
  RETURNING id
)
SELECT
  'TEST 5: Cross-org DELETE blocked' AS test_name,
  COUNT(*) AS rows_deleted,
  CASE
    WHEN COUNT(*) = 0 THEN 'PASS ✅'
    ELSE 'FAIL ❌ (Cross-org DELETE should affect 0 rows)'
  END AS status
FROM delete_result;

-- =============================================
-- TEST 6: CHILD TABLE RLS (npd_formulations via FK)
-- =============================================

-- Create formulation for Org A project
DO $$
DECLARE
  v_project_id_a UUID;
  v_formulation_id_a UUID;
BEGIN
  -- Get Org A project ID
  SELECT id INTO v_project_id_a FROM npd_projects WHERE project_number = 'TEST-ORG-A-001';

  -- Set session to Org A
  PERFORM set_config('app.org_id', '9001', true);

  -- Insert formulation
  INSERT INTO npd_formulations (
    id, org_id, npd_project_id, version, status,
    effective_from, effective_to, created_by, updated_by, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), 9001, v_project_id_a, 'v1.0', 'draft',
    CURRENT_DATE, NULL, NULL, NULL, NOW(), NOW()
  )
  RETURNING id INTO v_formulation_id_a;

  RAISE NOTICE 'Created formulation for Org A: %', v_formulation_id_a;
END $$;

-- Set session to Org B, try to read Org A's formulations (should see 0 rows)
SELECT set_config('app.org_id', '9002', true);

SELECT
  'TEST 6: Child table RLS (npd_formulations)' AS test_name,
  COUNT(*) AS rows_visible,
  CASE
    WHEN COUNT(*) = 0 THEN 'PASS ✅'
    ELSE 'FAIL ❌ (Org B should not see Org A formulations)'
  END AS status
FROM npd_formulations
WHERE version = 'v1.0';

-- =============================================
-- CLEANUP
-- =============================================

-- Delete test data
-- Note: org_id 9001/9002 are test values, can be reused for future tests

-- Set session to Org A
SELECT set_config('app.org_id', '9001', true);
DELETE FROM npd_formulations WHERE version = 'v1.0';
DELETE FROM npd_projects WHERE project_number LIKE 'TEST-ORG-A-%';

-- Set session to Org B
SELECT set_config('app.org_id', '9002', true);
DELETE FROM npd_projects WHERE project_number LIKE 'TEST-ORG-B-%';

-- =============================================
-- TEST SUMMARY
-- =============================================

SELECT
  '✅ RLS VERIFICATION COMPLETE' AS summary,
  'All tests passed if you see only PASS ✅ above' AS instructions,
  'Re-run this script anytime to verify RLS isolation' AS note;
