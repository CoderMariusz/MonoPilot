/**
 * Database RLS Policy Tests: Tax Codes
 * Story: 01.13 - Tax Codes CRUD
 * Phase: RED - All tests should FAIL (policies not implemented yet)
 *
 * Tests database-level security policies:
 * - SELECT policy (org isolation)
 * - INSERT policy (admin role check)
 * - UPDATE policy (admin role check)
 * - DELETE policy (admin role check)
 * - Trigger: single default per org
 * - Trigger: auto-uppercase code and country
 * - Check constraint: rate 0-100
 * - Check constraint: valid_to > valid_from
 * - Unique constraint: (org_id, code, country_code) WHERE is_deleted = false
 *
 * Coverage Target: 100% (RLS policies are critical)
 * Test Count: 18+ scenarios
 *
 * Acceptance Criteria Coverage:
 * - AC-05: Default assignment atomicity (trigger)
 * - AC-08: Permission enforcement (RLS policies)
 * - AC-09: Multi-tenancy isolation (RLS policies)
 */

BEGIN;

-- ============================================================================
-- TEST DATA SETUP
-- ============================================================================

-- Create test organizations
INSERT INTO organizations (id, name, slug, timezone, locale, currency, onboarding_step, is_active)
VALUES
  ('org-test-001', 'Test Org A', 'test-org-a', 'UTC', 'en', 'PLN', 5, true),
  ('org-test-002', 'Test Org B', 'test-org-b', 'UTC', 'en', 'EUR', 5, true);

-- Create test roles
INSERT INTO roles (id, code, name, description, is_system)
VALUES
  ('role-super-admin', 'SUPER_ADMIN', 'Super Admin', 'Full system access', true),
  ('role-admin', 'ADMIN', 'Admin', 'Organization admin', true),
  ('role-viewer', 'VIEWER', 'Viewer', 'Read-only access', true);

-- Create test users
INSERT INTO auth.users (id, email)
VALUES
  ('user-admin-org-a', 'admin-a@example.com'),
  ('user-viewer-org-a', 'viewer-a@example.com'),
  ('user-admin-org-b', 'admin-b@example.com');

INSERT INTO users (id, org_id, email, role_id, is_active)
VALUES
  ('user-admin-org-a', 'org-test-001', 'admin-a@example.com', 'role-admin', true),
  ('user-viewer-org-a', 'org-test-001', 'viewer-a@example.com', 'role-viewer', true),
  ('user-admin-org-b', 'org-test-002', 'admin-b@example.com', 'role-admin', true);

-- ============================================================================
-- TEST 1: SELECT Policy - Org Isolation (AC-09)
-- ============================================================================

-- Test: User from Org A can only see Org A tax codes

-- Setup: Create tax codes for both orgs
SET LOCAL role = authenticated;
SET LOCAL request.jwt.claims.sub = 'user-admin-org-a';

INSERT INTO tax_codes (id, org_id, code, name, rate, country_code, valid_from, created_by, updated_by)
VALUES
  ('tc-org-a-001', 'org-test-001', 'VAT23', 'VAT 23%', 23.00, 'PL', '2011-01-01', 'user-admin-org-a', 'user-admin-org-a'),
  ('tc-org-a-002', 'org-test-001', 'VAT8', 'VAT 8%', 8.00, 'PL', '2011-01-01', 'user-admin-org-a', 'user-admin-org-a');

SET LOCAL request.jwt.claims.sub = 'user-admin-org-b';

INSERT INTO tax_codes (id, org_id, code, name, rate, country_code, valid_from, created_by, updated_by)
VALUES
  ('tc-org-b-001', 'org-test-002', 'MWST19', 'MwSt 19%', 19.00, 'DE', '2007-01-01', 'user-admin-org-b', 'user-admin-org-b');

-- Test: User A can only see Org A tax codes
SET LOCAL request.jwt.claims.sub = 'user-admin-org-a';

SELECT
  CASE
    WHEN COUNT(*) = 2 THEN 'PASS: User A sees only Org A tax codes'
    ELSE 'FAIL: User A sees ' || COUNT(*) || ' tax codes (expected 2)'
  END AS test_result
FROM tax_codes;

-- Expected: 2 tax codes (only Org A)

-- ============================================================================
-- TEST 2: SELECT Policy - Cross-Org Access Blocked (AC-09)
-- ============================================================================

-- Test: User A cannot see Org B tax codes by ID
SET LOCAL request.jwt.claims.sub = 'user-admin-org-a';

SELECT
  CASE
    WHEN COUNT(*) = 0 THEN 'PASS: Cross-org access blocked (returns 404)'
    ELSE 'FAIL: Cross-org tax code visible'
  END AS test_result
FROM tax_codes
WHERE id = 'tc-org-b-001';

-- Expected: 0 rows (RLS blocks access)

-- ============================================================================
-- TEST 3: SELECT Policy - Soft-Deleted Tax Codes Hidden
-- ============================================================================

-- Setup: Soft delete a tax code
SET LOCAL request.jwt.claims.sub = 'user-admin-org-a';

UPDATE tax_codes
SET is_deleted = true, deleted_at = NOW(), deleted_by = 'user-admin-org-a'
WHERE id = 'tc-org-a-002';

-- Test: Soft-deleted tax codes are not visible
SELECT
  CASE
    WHEN COUNT(*) = 1 THEN 'PASS: Soft-deleted tax codes hidden from SELECT'
    ELSE 'FAIL: Soft-deleted tax codes visible'
  END AS test_result
FROM tax_codes
WHERE org_id = 'org-test-001';

-- Expected: 1 tax code (tc-org-a-001 only)

-- Restore for other tests
UPDATE tax_codes
SET is_deleted = false, deleted_at = NULL, deleted_by = NULL
WHERE id = 'tc-org-a-002';

-- ============================================================================
-- TEST 4: INSERT Policy - Admin Role Required (AC-08)
-- ============================================================================

-- Test: ADMIN can insert tax code
SET LOCAL request.jwt.claims.sub = 'user-admin-org-a';

INSERT INTO tax_codes (id, org_id, code, name, rate, country_code, valid_from, created_by, updated_by)
VALUES ('tc-org-a-003', 'org-test-001', 'VAT5', 'VAT 5%', 5.00, 'PL', '2011-01-01', 'user-admin-org-a', 'user-admin-org-a');

SELECT
  CASE
    WHEN COUNT(*) = 1 THEN 'PASS: ADMIN can insert tax code'
    ELSE 'FAIL: ADMIN insert blocked'
  END AS test_result
FROM tax_codes
WHERE id = 'tc-org-a-003';

-- Expected: 1 row

-- ============================================================================
-- TEST 5: INSERT Policy - VIEWER Cannot Insert (AC-08)
-- ============================================================================

-- Test: VIEWER role cannot insert tax code
DO $$
BEGIN
  SET LOCAL request.jwt.claims.sub = 'user-viewer-org-a';

  INSERT INTO tax_codes (id, org_id, code, name, rate, country_code, valid_from, created_by, updated_by)
  VALUES ('tc-org-a-004', 'org-test-001', 'VAT0', 'VAT 0%', 0.00, 'PL', '2011-01-01', 'user-viewer-org-a', 'user-viewer-org-a');

  RAISE EXCEPTION 'FAIL: VIEWER was allowed to insert tax code';
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'PASS: VIEWER insert correctly blocked by RLS';
  WHEN OTHERS THEN
    RAISE EXCEPTION 'FAIL: Wrong error type: %', SQLERRM;
END $$;

-- Expected: RLS blocks insert

-- ============================================================================
-- TEST 6: UPDATE Policy - Admin Role Required (AC-08)
-- ============================================================================

-- Test: ADMIN can update tax code
SET LOCAL request.jwt.claims.sub = 'user-admin-org-a';

UPDATE tax_codes
SET name = 'VAT 23% Standard', updated_by = 'user-admin-org-a'
WHERE id = 'tc-org-a-001';

SELECT
  CASE
    WHEN name = 'VAT 23% Standard' THEN 'PASS: ADMIN can update tax code'
    ELSE 'FAIL: ADMIN update failed'
  END AS test_result
FROM tax_codes
WHERE id = 'tc-org-a-001';

-- Expected: Name updated

-- ============================================================================
-- TEST 7: UPDATE Policy - VIEWER Cannot Update (AC-08)
-- ============================================================================

-- Test: VIEWER role cannot update tax code
DO $$
BEGIN
  SET LOCAL request.jwt.claims.sub = 'user-viewer-org-a';

  UPDATE tax_codes
  SET name = 'Unauthorized Update'
  WHERE id = 'tc-org-a-001';

  RAISE EXCEPTION 'FAIL: VIEWER was allowed to update tax code';
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'PASS: VIEWER update correctly blocked by RLS';
  WHEN OTHERS THEN
    RAISE EXCEPTION 'FAIL: Wrong error type: %', SQLERRM;
END $$;

-- Expected: RLS blocks update

-- ============================================================================
-- TEST 8: DELETE Policy - Admin Role Required (AC-08)
-- ============================================================================

-- Test: ADMIN can delete tax code
SET LOCAL request.jwt.claims.sub = 'user-admin-org-a';

DELETE FROM tax_codes WHERE id = 'tc-org-a-003';

SELECT
  CASE
    WHEN COUNT(*) = 0 THEN 'PASS: ADMIN can delete tax code'
    ELSE 'FAIL: ADMIN delete failed'
  END AS test_result
FROM tax_codes
WHERE id = 'tc-org-a-003';

-- Expected: 0 rows (deleted)

-- ============================================================================
-- TEST 9: DELETE Policy - VIEWER Cannot Delete (AC-08)
-- ============================================================================

-- Test: VIEWER role cannot delete tax code
DO $$
BEGIN
  SET LOCAL request.jwt.claims.sub = 'user-viewer-org-a';

  DELETE FROM tax_codes WHERE id = 'tc-org-a-001';

  RAISE EXCEPTION 'FAIL: VIEWER was allowed to delete tax code';
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'PASS: VIEWER delete correctly blocked by RLS';
  WHEN OTHERS THEN
    RAISE EXCEPTION 'FAIL: Wrong error type: %', SQLERRM;
END $$;

-- Expected: RLS blocks delete

-- ============================================================================
-- TEST 10: Trigger - Single Default Per Org (AC-05)
-- ============================================================================

-- Test: Setting new default unsets previous default
SET LOCAL request.jwt.claims.sub = 'user-admin-org-a';

-- Set VAT23 as default
UPDATE tax_codes
SET is_default = true
WHERE id = 'tc-org-a-001';

SELECT
  CASE
    WHEN COUNT(*) = 1 THEN 'PASS: One default tax code for Org A'
    ELSE 'FAIL: ' || COUNT(*) || ' default tax codes (expected 1)'
  END AS test_result
FROM tax_codes
WHERE org_id = 'org-test-001' AND is_default = true;

-- Set VAT8 as default (should unset VAT23)
UPDATE tax_codes
SET is_default = true
WHERE id = 'tc-org-a-002';

SELECT
  CASE
    WHEN COUNT(*) = 1 AND id = 'tc-org-a-002' THEN 'PASS: Default switched atomically (VAT8 now default)'
    ELSE 'FAIL: Trigger did not unset previous default'
  END AS test_result
FROM tax_codes
WHERE org_id = 'org-test-001' AND is_default = true;

-- Verify previous default is now false
SELECT
  CASE
    WHEN is_default = false THEN 'PASS: Previous default (VAT23) unset correctly'
    ELSE 'FAIL: Previous default still true'
  END AS test_result
FROM tax_codes
WHERE id = 'tc-org-a-001';

-- Expected: Exactly one default per org

-- ============================================================================
-- TEST 11: Trigger - Auto-Uppercase Code and Country
-- ============================================================================

-- Test: Code and country_code auto-uppercase on insert
SET LOCAL request.jwt.claims.sub = 'user-admin-org-a';

INSERT INTO tax_codes (id, org_id, code, name, rate, country_code, valid_from, created_by, updated_by)
VALUES ('tc-lowercase', 'org-test-001', 'vat10', 'VAT 10%', 10.00, 'pl', '2025-01-01', 'user-admin-org-a', 'user-admin-org-a');

SELECT
  CASE
    WHEN code = 'VAT10' AND country_code = 'PL' THEN 'PASS: Code and country auto-uppercase on insert'
    ELSE 'FAIL: Code = ' || code || ', country = ' || country_code
  END AS test_result
FROM tax_codes
WHERE id = 'tc-lowercase';

-- Expected: Code = 'VAT10', country_code = 'PL'

-- ============================================================================
-- TEST 12: Check Constraint - Rate 0-100 (AC-03)
-- ============================================================================

-- Test: Rate > 100 rejected
DO $$
BEGIN
  SET LOCAL request.jwt.claims.sub = 'user-admin-org-a';

  INSERT INTO tax_codes (id, org_id, code, name, rate, country_code, valid_from, created_by, updated_by)
  VALUES ('tc-invalid-rate', 'org-test-001', 'INVALID', 'Invalid Rate', 150.00, 'PL', '2025-01-01', 'user-admin-org-a', 'user-admin-org-a');

  RAISE EXCEPTION 'FAIL: Rate > 100 was allowed';
EXCEPTION
  WHEN check_violation THEN
    RAISE NOTICE 'PASS: Rate > 100 correctly rejected';
  WHEN OTHERS THEN
    RAISE EXCEPTION 'FAIL: Wrong error type: %', SQLERRM;
END $$;

-- Expected: Check constraint violation

-- Test: Negative rate rejected
DO $$
BEGIN
  SET LOCAL request.jwt.claims.sub = 'user-admin-org-a';

  INSERT INTO tax_codes (id, org_id, code, name, rate, country_code, valid_from, created_by, updated_by)
  VALUES ('tc-negative-rate', 'org-test-001', 'NEGATIVE', 'Negative Rate', -5.00, 'PL', '2025-01-01', 'user-admin-org-a', 'user-admin-org-a');

  RAISE EXCEPTION 'FAIL: Negative rate was allowed';
EXCEPTION
  WHEN check_violation THEN
    RAISE NOTICE 'PASS: Negative rate correctly rejected';
  WHEN OTHERS THEN
    RAISE EXCEPTION 'FAIL: Wrong error type: %', SQLERRM;
END $$;

-- Expected: Check constraint violation

-- Test: 0% rate allowed (exempt)
SET LOCAL request.jwt.claims.sub = 'user-admin-org-a';

INSERT INTO tax_codes (id, org_id, code, name, rate, country_code, valid_from, created_by, updated_by)
VALUES ('tc-zero-rate', 'org-test-001', 'EXEMPT', 'Exempt', 0.00, 'PL', '2025-01-01', 'user-admin-org-a', 'user-admin-org-a');

SELECT
  CASE
    WHEN rate = 0.00 THEN 'PASS: 0% rate allowed (exempt)'
    ELSE 'FAIL: 0% rate rejected'
  END AS test_result
FROM tax_codes
WHERE id = 'tc-zero-rate';

-- Expected: 0% rate valid

-- ============================================================================
-- TEST 13: Check Constraint - valid_to > valid_from (AC-04)
-- ============================================================================

-- Test: valid_to < valid_from rejected
DO $$
BEGIN
  SET LOCAL request.jwt.claims.sub = 'user-admin-org-a';

  INSERT INTO tax_codes (id, org_id, code, name, rate, country_code, valid_from, valid_to, created_by, updated_by)
  VALUES ('tc-invalid-dates', 'org-test-001', 'INVALID-DATE', 'Invalid Dates', 10.00, 'PL', '2025-12-01', '2025-06-01', 'user-admin-org-a', 'user-admin-org-a');

  RAISE EXCEPTION 'FAIL: valid_to < valid_from was allowed';
EXCEPTION
  WHEN check_violation THEN
    RAISE NOTICE 'PASS: valid_to < valid_from correctly rejected';
  WHEN OTHERS THEN
    RAISE EXCEPTION 'FAIL: Wrong error type: %', SQLERRM;
END $$;

-- Expected: Check constraint violation

-- Test: valid_to = valid_from rejected
DO $$
BEGIN
  SET LOCAL request.jwt.claims.sub = 'user-admin-org-a';

  INSERT INTO tax_codes (id, org_id, code, name, rate, country_code, valid_from, valid_to, created_by, updated_by)
  VALUES ('tc-equal-dates', 'org-test-001', 'EQUAL-DATE', 'Equal Dates', 10.00, 'PL', '2025-01-01', '2025-01-01', 'user-admin-org-a', 'user-admin-org-a');

  RAISE EXCEPTION 'FAIL: valid_to = valid_from was allowed';
EXCEPTION
  WHEN check_violation THEN
    RAISE NOTICE 'PASS: valid_to = valid_from correctly rejected';
  WHEN OTHERS THEN
    RAISE EXCEPTION 'FAIL: Wrong error type: %', SQLERRM;
END $$;

-- Expected: Check constraint violation

-- Test: null valid_to allowed (no expiry)
SET LOCAL request.jwt.claims.sub = 'user-admin-org-a';

INSERT INTO tax_codes (id, org_id, code, name, rate, country_code, valid_from, valid_to, created_by, updated_by)
VALUES ('tc-no-expiry', 'org-test-001', 'NO-EXPIRY', 'No Expiry', 10.00, 'PL', '2025-01-01', NULL, 'user-admin-org-a', 'user-admin-org-a');

SELECT
  CASE
    WHEN valid_to IS NULL THEN 'PASS: null valid_to allowed (no expiry)'
    ELSE 'FAIL: null valid_to rejected'
  END AS test_result
FROM tax_codes
WHERE id = 'tc-no-expiry';

-- Expected: null valid_to valid

-- ============================================================================
-- TEST 14: Unique Constraint - (org_id, code, country_code) (AC-02)
-- ============================================================================

-- Test: Duplicate code+country in same org rejected
DO $$
BEGIN
  SET LOCAL request.jwt.claims.sub = 'user-admin-org-a';

  INSERT INTO tax_codes (id, org_id, code, name, rate, country_code, valid_from, created_by, updated_by)
  VALUES ('tc-duplicate', 'org-test-001', 'VAT23', 'Duplicate VAT 23%', 23.00, 'PL', '2025-01-01', 'user-admin-org-a', 'user-admin-org-a');

  RAISE EXCEPTION 'FAIL: Duplicate code+country was allowed';
EXCEPTION
  WHEN unique_violation THEN
    RAISE NOTICE 'PASS: Duplicate code+country correctly rejected';
  WHEN OTHERS THEN
    RAISE EXCEPTION 'FAIL: Wrong error type: %', SQLERRM;
END $$;

-- Expected: Unique violation

-- Test: Same code in different country allowed
SET LOCAL request.jwt.claims.sub = 'user-admin-org-a';

INSERT INTO tax_codes (id, org_id, code, name, rate, country_code, valid_from, created_by, updated_by)
VALUES ('tc-same-code-diff-country', 'org-test-001', 'VAT23', 'German VAT', 19.00, 'DE', '2025-01-01', 'user-admin-org-a', 'user-admin-org-a');

SELECT
  CASE
    WHEN COUNT(*) = 1 THEN 'PASS: Same code in different country allowed'
    ELSE 'FAIL: Same code in different country rejected'
  END AS test_result
FROM tax_codes
WHERE id = 'tc-same-code-diff-country';

-- Expected: Allowed

-- Test: Same code+country in different org allowed
SET LOCAL request.jwt.claims.sub = 'user-admin-org-b';

INSERT INTO tax_codes (id, org_id, code, name, rate, country_code, valid_from, created_by, updated_by)
VALUES ('tc-same-code-diff-org', 'org-test-002', 'VAT23', 'Polish VAT in Org B', 23.00, 'PL', '2025-01-01', 'user-admin-org-b', 'user-admin-org-b');

SELECT
  CASE
    WHEN COUNT(*) = 1 THEN 'PASS: Same code+country in different org allowed'
    ELSE 'FAIL: Same code+country in different org rejected'
  END AS test_result
FROM tax_codes
WHERE id = 'tc-same-code-diff-org';

-- Expected: Allowed

-- ============================================================================
-- TEST 15: Unique Constraint - Deleted Tax Codes Ignored
-- ============================================================================

-- Test: Deleted tax code does not block duplicate
SET LOCAL request.jwt.claims.sub = 'user-admin-org-a';

-- Soft delete existing tax code
UPDATE tax_codes
SET is_deleted = true, deleted_at = NOW(), deleted_by = 'user-admin-org-a'
WHERE id = 'tc-org-a-001';

-- Insert new tax code with same code+country
INSERT INTO tax_codes (id, org_id, code, name, rate, country_code, valid_from, created_by, updated_by)
VALUES ('tc-reuse-deleted-code', 'org-test-001', 'VAT23', 'New VAT 23%', 23.00, 'PL', '2025-01-01', 'user-admin-org-a', 'user-admin-org-a');

SELECT
  CASE
    WHEN COUNT(*) = 1 THEN 'PASS: Deleted tax code does not block duplicate (unique constraint with WHERE is_deleted = false)'
    ELSE 'FAIL: Cannot reuse deleted tax code'
  END AS test_result
FROM tax_codes
WHERE id = 'tc-reuse-deleted-code';

-- Expected: Allowed

-- ============================================================================
-- TEST 16: Check Constraint - Code Format (uppercase alphanumeric)
-- ============================================================================

-- Test: Invalid code format rejected
DO $$
BEGIN
  SET LOCAL request.jwt.claims.sub = 'user-admin-org-a';

  INSERT INTO tax_codes (id, org_id, code, name, rate, country_code, valid_from, created_by, updated_by)
  VALUES ('tc-invalid-code-format', 'org-test-001', 'invalid code!', 'Invalid Code', 10.00, 'PL', '2025-01-01', 'user-admin-org-a', 'user-admin-org-a');

  RAISE EXCEPTION 'FAIL: Invalid code format was allowed';
EXCEPTION
  WHEN check_violation THEN
    RAISE NOTICE 'PASS: Invalid code format correctly rejected';
  WHEN OTHERS THEN
    RAISE EXCEPTION 'FAIL: Wrong error type: %', SQLERRM;
END $$;

-- Expected: Check constraint violation

-- ============================================================================
-- TEST 17: Check Constraint - Country Code Format (ISO 3166-1 alpha-2)
-- ============================================================================

-- Test: Invalid country code format rejected
DO $$
BEGIN
  SET LOCAL request.jwt.claims.sub = 'user-admin-org-a';

  INSERT INTO tax_codes (id, org_id, code, name, rate, country_code, valid_from, created_by, updated_by)
  VALUES ('tc-invalid-country', 'org-test-001', 'VAT10', 'Invalid Country', 10.00, 'POL', '2025-01-01', 'user-admin-org-a', 'user-admin-org-a');

  RAISE EXCEPTION 'FAIL: Invalid country code format was allowed';
EXCEPTION
  WHEN check_violation THEN
    RAISE NOTICE 'PASS: Invalid country code format correctly rejected';
  WHEN OTHERS THEN
    RAISE EXCEPTION 'FAIL: Wrong error type: %', SQLERRM;
END $$;

-- Expected: Check constraint violation

-- ============================================================================
-- TEST 18: ON DELETE CASCADE for org_id FK
-- ============================================================================

-- Test: Deleting organization cascades to tax codes
DELETE FROM organizations WHERE id = 'org-test-002';

SELECT
  CASE
    WHEN COUNT(*) = 0 THEN 'PASS: Deleting org cascades to tax codes'
    ELSE 'FAIL: Tax codes not deleted with org'
  END AS test_result
FROM tax_codes
WHERE org_id = 'org-test-002';

-- Expected: 0 rows (cascaded delete)

-- ============================================================================
-- TEST CLEANUP
-- ============================================================================

ROLLBACK;

/**
 * Test Summary for Story 01.13 - Database RLS Tests
 * ===================================================
 *
 * Test Coverage:
 * - RLS policies (SELECT, INSERT, UPDATE, DELETE): 9 tests
 * - Triggers (single default, auto-uppercase): 3 tests
 * - Check constraints (rate, dates, code format): 6 tests
 * - Unique constraint: 3 tests
 * - Foreign key constraints: 1 test
 * - Total: 18 test scenarios
 *
 * Expected Status: ALL TESTS FAIL (RED phase)
 * - tax_codes table not created yet
 * - RLS policies not defined
 * - Triggers not implemented
 * - Constraints not created
 *
 * Next Steps for GREEN Phase:
 * 1. Create migration 061_create_tax_codes_table.sql
 * 2. Add RLS policies (SELECT, INSERT, UPDATE, DELETE)
 * 3. Implement ensure_single_default_tax_code() trigger
 * 4. Implement auto_uppercase_tax_code() trigger
 * 5. Add check constraints (rate, dates, code format)
 * 6. Add unique constraint (org_id, code, country_code) WHERE is_deleted = false
 * 7. Run tests - should transition from RED to GREEN
 *
 * Coverage Target: 100% (RLS policies are security-critical)
 * Critical: All permission checks and multi-tenancy isolation enforced at DB level
 */
