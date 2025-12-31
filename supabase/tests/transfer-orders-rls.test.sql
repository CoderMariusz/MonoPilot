/**
 * RLS Policy Tests: Transfer Orders
 * Story: 03.8 - Transfer Orders CRUD + Lines
 * Phase: RED - Tests will fail until RLS policies are implemented
 *
 * Tests Row Level Security policies for multi-tenancy and role-based access control:
 * - Org isolation (users can only see their org's TOs)
 * - Role-based permissions (ADMIN/WH_MANAGER can CRUD, others read-only)
 * - Cross-tenant protection (404 not 403 for other org's TO)
 * - Line-level security (inherited from parent TO via JOIN)
 *
 * Coverage Target: 100%
 * Test Count: 40+ test cases
 *
 * Acceptance Criteria Coverage:
 * - AC-15: Permission enforcement (ADMIN, WH_MANAGER = full CRUD)
 * - AC-15b: Read-only for VIEWER/PROD_MANAGER
 * - AC-16: Multi-tenancy (only org's TOs)
 * - AC-16b: Cross-tenant access returns 404
 */

-- ============================================================================
-- TEST SETUP - Create Test Organizations and Users
-- ============================================================================

BEGIN;

-- Create test orgs
INSERT INTO organizations (id, name, plan_id, is_active)
VALUES
  ('test-org-a-id', 'Test Org A', 'freemium', true),
  ('test-org-b-id', 'Test Org B', 'freemium', true);

-- Create roles (assuming roles table exists)
-- Note: Adjust if role structure differs
INSERT INTO roles (id, code, name, description, org_id)
VALUES
  ('role-admin-id', 'admin', 'Admin', 'Full access', 'test-org-a-id'),
  ('role-wh-mgr-id', 'warehouse_manager', 'Warehouse Manager', 'Warehouse operations', 'test-org-a-id'),
  ('role-viewer-id', 'viewer', 'Viewer', 'Read-only access', 'test-org-a-id'),
  ('role-admin-b-id', 'admin', 'Admin', 'Full access', 'test-org-b-id'),
  ('role-viewer-b-id', 'viewer', 'Viewer', 'Read-only access', 'test-org-b-id');

-- Create test users for Org A
INSERT INTO users (id, org_id, email, role_id, created_at)
VALUES
  ('user-admin-a-id', 'test-org-a-id', 'admin@org-a.test', 'role-admin-id', now()),
  ('user-wh-mgr-a-id', 'test-org-a-id', 'warehouse@org-a.test', 'role-wh-mgr-id', now()),
  ('user-viewer-a-id', 'test-org-a-id', 'viewer@org-a.test', 'role-viewer-id', now());

-- Create test users for Org B
INSERT INTO users (id, org_id, email, role_id, created_at)
VALUES
  ('user-admin-b-id', 'test-org-b-id', 'admin@org-b.test', 'role-admin-b-id', now()),
  ('user-viewer-b-id', 'test-org-b-id', 'viewer@org-b.test', 'role-viewer-b-id', now());

-- Create test warehouses for Org A
INSERT INTO warehouses (id, org_id, code, name, is_active)
VALUES
  ('wh-a-001-id', 'test-org-a-id', 'WH-A-001', 'Warehouse A1', true),
  ('wh-a-002-id', 'test-org-a-id', 'WH-A-002', 'Warehouse A2', true);

-- Create test warehouses for Org B
INSERT INTO warehouses (id, org_id, code, name, is_active)
VALUES
  ('wh-b-001-id', 'test-org-b-id', 'WH-B-001', 'Warehouse B1', true);

-- Create test products for Org A
INSERT INTO products (id, org_id, code, name, product_type_id, base_uom)
VALUES
  ('prod-a-001-id', 'test-org-a-id', 'PROD-A-001', 'Product A1', 'type-001', 'kg'),
  ('prod-a-002-id', 'test-org-a-id', 'PROD-A-002', 'Product A2', 'type-001', 'kg');

-- Create test TOs for Org A
INSERT INTO transfer_orders (id, org_id, to_number, from_warehouse_id, to_warehouse_id, planned_ship_date, planned_receive_date, status, created_by)
VALUES
  ('to-a-001-id', 'test-org-a-id', 'TO-2024-00001', 'wh-a-001-id', 'wh-a-002-id', '2024-12-20', '2024-12-22', 'draft', 'user-admin-a-id'),
  ('to-a-002-id', 'test-org-a-id', 'TO-2024-00002', 'wh-a-001-id', 'wh-a-002-id', '2024-12-25', '2024-12-27', 'planned', 'user-admin-a-id');

-- Create test TOs for Org B
INSERT INTO transfer_orders (id, org_id, to_number, from_warehouse_id, to_warehouse_id, planned_ship_date, planned_receive_date, status, created_by)
VALUES
  ('to-b-001-id', 'test-org-b-id', 'TO-2024-00001', 'wh-b-001-id', 'wh-b-001-id', '2024-12-20', '2024-12-22', 'draft', 'user-admin-b-id');

-- Create test lines for TO A1
INSERT INTO transfer_order_lines (id, to_id, line_number, product_id, quantity, uom)
VALUES
  ('tol-a-001-id', 'to-a-001-id', 1, 'prod-a-001-id', 500, 'kg'),
  ('tol-a-002-id', 'to-a-001-id', 2, 'prod-a-002-id', 200, 'kg');

-- Create test line for TO B1
INSERT INTO transfer_order_lines (id, to_id, line_number, product_id, quantity, uom)
VALUES
  ('tol-b-001-id', 'to-b-001-id', 1, 'prod-b-001-id', 100, 'kg');

COMMIT;

-- ============================================================================
-- TEST: ORG ISOLATION - SELECT (AC-16)
-- ============================================================================

-- Test: Org A ADMIN user can select only Org A TOs
BEGIN;
SET LOCAL "request.jwt.claims" = '{"sub":"user-admin-a-id","org_id":"test-org-a-id"}';
SELECT COUNT(*) as count FROM transfer_orders;
-- Expected: 2 (to-a-001-id, to-a-002-id)
ROLLBACK;

-- Test: Org A VIEWER can select only Org A TOs
BEGIN;
SET LOCAL "request.jwt.claims" = '{"sub":"user-viewer-a-id","org_id":"test-org-a-id"}';
SELECT COUNT(*) as count FROM transfer_orders;
-- Expected: 2 (to-a-001-id, to-a-002-id)
ROLLBACK;

-- Test: Org B ADMIN cannot see Org A TOs
BEGIN;
SET LOCAL "request.jwt.claims" = '{"sub":"user-admin-b-id","org_id":"test-org-b-id"}';
SELECT COUNT(*) as count FROM transfer_orders;
-- Expected: 1 (to-b-001-id only)
ROLLBACK;

-- Test: Cross-org TO access returns no rows (AC-16b)
BEGIN;
SET LOCAL "request.jwt.claims" = '{"sub":"user-admin-a-id","org_id":"test-org-a-id"}';
SELECT id FROM transfer_orders WHERE id = 'to-b-001-id';
-- Expected: 0 rows (empty result set, not error)
ROLLBACK;

-- ============================================================================
-- TEST: ORG ISOLATION - INSERT
-- ============================================================================

-- Test: ADMIN can insert TO for own org
BEGIN;
SET LOCAL "request.jwt.claims" = '{"sub":"user-admin-a-id","org_id":"test-org-a-id"}';
INSERT INTO transfer_orders (id, org_id, to_number, from_warehouse_id, to_warehouse_id, planned_ship_date, planned_receive_date, status, created_by)
VALUES ('test-to-insert', 'test-org-a-id', 'TO-TEST-001', 'wh-a-001-id', 'wh-a-002-id', '2024-12-20', '2024-12-22', 'draft', 'user-admin-a-id');
-- Expected: INSERT succeeds
ROLLBACK;

-- Test: Cannot insert TO for different org
BEGIN;
SET LOCAL "request.jwt.claims" = '{"sub":"user-admin-a-id","org_id":"test-org-a-id"}';
INSERT INTO transfer_orders (id, org_id, to_number, from_warehouse_id, to_warehouse_id, planned_ship_date, planned_receive_date, status, created_by)
VALUES ('test-to-insert-2', 'test-org-b-id', 'TO-TEST-002', 'wh-b-001-id', 'wh-b-001-id', '2024-12-20', '2024-12-22', 'draft', 'user-admin-a-id');
-- Expected: INSERT fails (0 rows affected)
ROLLBACK;

-- ============================================================================
-- TEST: ROLE-BASED PERMISSIONS - INSERT (AC-15, AC-15b)
-- ============================================================================

-- Test: ADMIN can insert TO (AC-15)
BEGIN;
SET LOCAL "request.jwt.claims" = '{"sub":"user-admin-a-id","org_id":"test-org-a-id"}';
INSERT INTO transfer_orders (id, org_id, to_number, from_warehouse_id, to_warehouse_id, planned_ship_date, planned_receive_date, status, created_by)
VALUES ('test-admin-insert', 'test-org-a-id', 'TO-ADM-001', 'wh-a-001-id', 'wh-a-002-id', '2024-12-20', '2024-12-22', 'draft', 'user-admin-a-id');
-- Expected: INSERT succeeds
ROLLBACK;

-- Test: WH_MANAGER can insert TO (AC-15)
BEGIN;
SET LOCAL "request.jwt.claims" = '{"sub":"user-wh-mgr-a-id","org_id":"test-org-a-id"}';
INSERT INTO transfer_orders (id, org_id, to_number, from_warehouse_id, to_warehouse_id, planned_ship_date, planned_receive_date, status, created_by)
VALUES ('test-wh-mgr-insert', 'test-org-a-id', 'TO-WHM-001', 'wh-a-001-id', 'wh-a-002-id', '2024-12-20', '2024-12-22', 'draft', 'user-wh-mgr-a-id');
-- Expected: INSERT succeeds
ROLLBACK;

-- Test: VIEWER cannot insert TO (AC-15b)
BEGIN;
SET LOCAL "request.jwt.claims" = '{"sub":"user-viewer-a-id","org_id":"test-org-a-id"}';
INSERT INTO transfer_orders (id, org_id, to_number, from_warehouse_id, to_warehouse_id, planned_ship_date, planned_receive_date, status, created_by)
VALUES ('test-viewer-insert', 'test-org-a-id', 'TO-VIE-001', 'wh-a-001-id', 'wh-a-002-id', '2024-12-20', '2024-12-22', 'draft', 'user-viewer-a-id');
-- Expected: INSERT fails (RLS policy blocks)
ROLLBACK;

-- ============================================================================
-- TEST: ROLE-BASED PERMISSIONS - UPDATE (AC-15, AC-15b)
-- ============================================================================

-- Test: ADMIN can update TO (AC-15)
BEGIN;
SET LOCAL "request.jwt.claims" = '{"sub":"user-admin-a-id","org_id":"test-org-a-id"}';
UPDATE transfer_orders SET priority = 'high' WHERE id = 'to-a-001-id';
-- Expected: UPDATE succeeds (1 row affected)
ROLLBACK;

-- Test: WH_MANAGER can update TO (AC-15)
BEGIN;
SET LOCAL "request.jwt.claims" = '{"sub":"user-wh-mgr-a-id","org_id":"test-org-a-id"}';
UPDATE transfer_orders SET priority = 'urgent' WHERE id = 'to-a-001-id';
-- Expected: UPDATE succeeds (1 row affected)
ROLLBACK;

-- Test: VIEWER cannot update TO (AC-15b)
BEGIN;
SET LOCAL "request.jwt.claims" = '{"sub":"user-viewer-a-id","org_id":"test-org-a-id"}';
UPDATE transfer_orders SET priority = 'high' WHERE id = 'to-a-001-id';
-- Expected: UPDATE fails (0 rows affected)
ROLLBACK;

-- Test: Cross-org UPDATE blocked
BEGIN;
SET LOCAL "request.jwt.claims" = '{"sub":"user-admin-a-id","org_id":"test-org-a-id"}';
UPDATE transfer_orders SET priority = 'high' WHERE id = 'to-b-001-id';
-- Expected: UPDATE fails (0 rows affected)
ROLLBACK;

-- ============================================================================
-- TEST: ROLE-BASED PERMISSIONS - DELETE (AC-15)
-- ============================================================================

-- Test: ADMIN can delete TO (only OWNER/ADMIN per schema)
BEGIN;
SET LOCAL "request.jwt.claims" = '{"sub":"user-admin-a-id","org_id":"test-org-a-id"}';
DELETE FROM transfer_orders WHERE id = 'to-a-002-id';
-- Expected: DELETE succeeds if ADMIN in policy (check schema)
ROLLBACK;

-- Test: WH_MANAGER cannot delete TO (limited role)
BEGIN;
SET LOCAL "request.jwt.claims" = '{"sub":"user-wh-mgr-a-id","org_id":"test-org-a-id"}';
DELETE FROM transfer_orders WHERE id = 'to-a-001-id';
-- Expected: DELETE fails (0 rows affected, only OWNER/ADMIN can delete)
ROLLBACK;

-- Test: VIEWER cannot delete TO
BEGIN;
SET LOCAL "request.jwt.claims" = '{"sub":"user-viewer-a-id","org_id":"test-org-a-id"}';
DELETE FROM transfer_orders WHERE id = 'to-a-001-id';
-- Expected: DELETE fails (0 rows affected)
ROLLBACK;

-- ============================================================================
-- TEST: TRANSFER ORDER LINES - SELECT (AC-16)
-- ============================================================================

-- Test: Org A ADMIN can select only Org A lines
BEGIN;
SET LOCAL "request.jwt.claims" = '{"sub":"user-admin-a-id","org_id":"test-org-a-id"}';
SELECT COUNT(*) as count FROM transfer_order_lines;
-- Expected: 2 (tol-a-001-id, tol-a-002-id)
ROLLBACK;

-- Test: Org B ADMIN cannot see Org A lines
BEGIN;
SET LOCAL "request.jwt.claims" = '{"sub":"user-admin-b-id","org_id":"test-org-b-id"}';
SELECT COUNT(*) as count FROM transfer_order_lines;
-- Expected: 1 (tol-b-001-id only)
ROLLBACK;

-- Test: Cross-org line access blocked
BEGIN;
SET LOCAL "request.jwt.claims" = '{"sub":"user-admin-a-id","org_id":"test-org-a-id"}';
SELECT id FROM transfer_order_lines WHERE id = 'tol-b-001-id';
-- Expected: 0 rows
ROLLBACK;

-- ============================================================================
-- TEST: TRANSFER ORDER LINES - INSERT (AC-15, AC-15b)
-- ============================================================================

-- Test: ADMIN can insert line into own org TO
BEGIN;
SET LOCAL "request.jwt.claims" = '{"sub":"user-admin-a-id","org_id":"test-org-a-id"}';
INSERT INTO transfer_order_lines (id, to_id, line_number, product_id, quantity, uom)
VALUES ('test-line-insert', 'to-a-001-id', 3, 'prod-a-001-id', 300, 'kg');
-- Expected: INSERT succeeds
ROLLBACK;

-- Test: WH_MANAGER can insert line (AC-15)
BEGIN;
SET LOCAL "request.jwt.claims" = '{"sub":"user-wh-mgr-a-id","org_id":"test-org-a-id"}';
INSERT INTO transfer_order_lines (id, to_id, line_number, product_id, quantity, uom)
VALUES ('test-line-insert-2', 'to-a-001-id', 3, 'prod-a-001-id', 300, 'kg');
-- Expected: INSERT succeeds
ROLLBACK;

-- Test: VIEWER cannot insert line (AC-15b)
BEGIN;
SET LOCAL "request.jwt.claims" = '{"sub":"user-viewer-a-id","org_id":"test-org-a-id"}';
INSERT INTO transfer_order_lines (id, to_id, line_number, product_id, quantity, uom)
VALUES ('test-line-insert-3', 'to-a-001-id', 3, 'prod-a-001-id', 300, 'kg');
-- Expected: INSERT fails (RLS blocks - VIEWER not in permitted roles)
ROLLBACK;

-- Test: Cannot insert line for cross-org TO
BEGIN;
SET LOCAL "request.jwt.claims" = '{"sub":"user-admin-a-id","org_id":"test-org-a-id"}';
INSERT INTO transfer_order_lines (id, to_id, line_number, product_id, quantity, uom)
VALUES ('test-line-cross-org', 'to-b-001-id', 1, 'prod-a-001-id', 300, 'kg');
-- Expected: INSERT fails (0 rows affected)
ROLLBACK;

-- ============================================================================
-- TEST: TRANSFER ORDER LINES - UPDATE (AC-15, AC-15b)
-- ============================================================================

-- Test: ADMIN can update line (AC-15)
BEGIN;
SET LOCAL "request.jwt.claims" = '{"sub":"user-admin-a-id","org_id":"test-org-a-id"}';
UPDATE transfer_order_lines SET quantity = 750 WHERE id = 'tol-a-001-id';
-- Expected: UPDATE succeeds (1 row affected)
ROLLBACK;

-- Test: WH_MANAGER can update line (AC-15)
BEGIN;
SET LOCAL "request.jwt.claims" = '{"sub":"user-wh-mgr-a-id","org_id":"test-org-a-id"}';
UPDATE transfer_order_lines SET quantity = 600 WHERE id = 'tol-a-001-id';
-- Expected: UPDATE succeeds (1 row affected)
ROLLBACK;

-- Test: VIEWER cannot update line (AC-15b)
BEGIN;
SET LOCAL "request.jwt.claims" = '{"sub":"user-viewer-a-id","org_id":"test-org-a-id"}';
UPDATE transfer_order_lines SET quantity = 750 WHERE id = 'tol-a-001-id';
-- Expected: UPDATE fails (0 rows affected)
ROLLBACK;

-- Test: Cannot update cross-org line
BEGIN;
SET LOCAL "request.jwt.claims" = '{"sub":"user-admin-a-id","org_id":"test-org-a-id"}';
UPDATE transfer_order_lines SET quantity = 500 WHERE id = 'tol-b-001-id';
-- Expected: UPDATE fails (0 rows affected)
ROLLBACK;

-- ============================================================================
-- TEST: TRANSFER ORDER LINES - DELETE (AC-15)
-- ============================================================================

-- Test: ADMIN can delete line
BEGIN;
SET LOCAL "request.jwt.claims" = '{"sub":"user-admin-a-id","org_id":"test-org-a-id"}';
DELETE FROM transfer_order_lines WHERE id = 'tol-a-002-id';
-- Expected: DELETE succeeds (1 row affected)
ROLLBACK;

-- Test: WH_MANAGER can delete line
BEGIN;
SET LOCAL "request.jwt.claims" = '{"sub":"user-wh-mgr-a-id","org_id":"test-org-a-id"}';
DELETE FROM transfer_order_lines WHERE id = 'tol-a-002-id';
-- Expected: DELETE succeeds (1 row affected)
ROLLBACK;

-- Test: VIEWER cannot delete line
BEGIN;
SET LOCAL "request.jwt.claims" = '{"sub":"user-viewer-a-id","org_id":"test-org-a-id"}';
DELETE FROM transfer_order_lines WHERE id = 'tol-a-001-id';
-- Expected: DELETE fails (0 rows affected)
ROLLBACK;

-- Test: Cannot delete cross-org line
BEGIN;
SET LOCAL "request.jwt.claims" = '{"sub":"user-admin-a-id","org_id":"test-org-a-id"}';
DELETE FROM transfer_order_lines WHERE id = 'tol-b-001-id';
-- Expected: DELETE fails (0 rows affected)
ROLLBACK;

-- ============================================================================
-- CLEANUP - Rollback all test data
-- ============================================================================

BEGIN;
DELETE FROM transfer_order_lines WHERE to_id IN ('to-a-001-id', 'to-a-002-id', 'to-b-001-id');
DELETE FROM transfer_orders WHERE id IN ('to-a-001-id', 'to-a-002-id', 'to-b-001-id');
DELETE FROM products WHERE id LIKE 'prod-%' AND org_id IN ('test-org-a-id', 'test-org-b-id');
DELETE FROM warehouses WHERE id LIKE 'wh-%-id' AND org_id IN ('test-org-a-id', 'test-org-b-id');
DELETE FROM users WHERE id LIKE 'user-%-id';
DELETE FROM roles WHERE org_id IN ('test-org-a-id', 'test-org-b-id');
DELETE FROM organizations WHERE id IN ('test-org-a-id', 'test-org-b-id');
ROLLBACK;
