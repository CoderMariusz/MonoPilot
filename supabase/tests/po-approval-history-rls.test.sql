-- PO Approval History RLS Tests
-- Purpose: Verify Row-Level Security policies for po_approval_history table
-- Story: 03.5b - PO Approval Workflow

-- Test Setup
-- Create test data in multiple organizations

-- Helper: Create test org and users
CREATE EXTENSION IF NOT EXISTS pgtap;

-- Test 1: User can only read own org's approval history
BEGIN;
  -- Setup: Create two orgs with users
  INSERT INTO organizations (id, name) VALUES
    ('org-test-1', 'Test Org 1'),
    ('org-test-2', 'Test Org 2');

  INSERT INTO users (id, org_id, email, role) VALUES
    ('user-test-1', 'org-test-1', 'user1@org1.com', 'admin'),
    ('user-test-2', 'org-test-2', 'user2@org2.com', 'admin');

  INSERT INTO purchase_orders (id, org_id, po_number, status, total) VALUES
    ('po-org1', 'org-test-1', 'PO-2024-001', 'pending_approval', 1000.00),
    ('po-org2', 'org-test-2', 'PO-2024-002', 'pending_approval', 1000.00);

  INSERT INTO po_approval_history
    (id, org_id, po_id, action, user_id, user_name, user_role, notes)
  VALUES
    ('hist-org1', 'org-test-1', 'po-org1', 'submitted', 'user-test-1', 'User 1', 'admin', NULL),
    ('hist-org2', 'org-test-2', 'po-org2', 'submitted', 'user-test-2', 'User 2', 'admin', NULL);

  -- Test: User from org-test-1 can read their history
  SET LOCAL ROLE user_test_1;
  SET LOCAL auth.uid = 'user-test-1';

  SELECT plan(1, 'User can only read own org approval history');

  -- Test case: RLS integration test - AC-12
  SELECT is(
    (SELECT COUNT(*) FROM po_approval_history WHERE org_id = 'org-test-1'),
    1::bigint,
    'User from org-test-1 can read 1 history entry from org-test-1'
  );

  SELECT is(
    (SELECT COUNT(*) FROM po_approval_history WHERE org_id = 'org-test-2'),
    0::bigint,
    'User from org-test-1 cannot read history from org-test-2'
  );

  SELECT * FROM finish();
ROLLBACK;


-- Test 2: Approval history append-only - UPDATE blocked
BEGIN;
  -- Setup: Create test data
  INSERT INTO organizations (id, name) VALUES ('org-test-3', 'Test Org 3');
  INSERT INTO users (id, org_id, email, role) VALUES ('user-test-3', 'org-test-3', 'user3@org3.com', 'admin');
  INSERT INTO purchase_orders (id, org_id, po_number, status, total) VALUES ('po-test-3', 'org-test-3', 'PO-2024-003', 'pending_approval', 1000.00);
  INSERT INTO po_approval_history
    (id, org_id, po_id, action, user_id, user_name, user_role)
  VALUES
    ('hist-test-3', 'org-test-3', 'po-test-3', 'submitted', 'user-test-3', 'User 3', 'admin');

  SET LOCAL ROLE user_test_3;
  SET LOCAL auth.uid = 'user-test-3';

  SELECT plan(1, 'Approval history is append-only - UPDATE blocked');

  -- Test case: RLS - Append-only table
  UPDATE po_approval_history SET action = 'approved' WHERE id = 'hist-test-3';

  SELECT is(
    (SELECT action FROM po_approval_history WHERE id = 'hist-test-3'),
    'submitted'::text,
    'UPDATE blocked by RLS policy - action remains submitted'
  );

  SELECT * FROM finish();
ROLLBACK;


-- Test 3: Approval history append-only - DELETE blocked
BEGIN;
  -- Setup
  INSERT INTO organizations (id, name) VALUES ('org-test-4', 'Test Org 4');
  INSERT INTO users (id, org_id, email, role) VALUES ('user-test-4', 'org-test-4', 'user4@org4.com', 'admin');
  INSERT INTO purchase_orders (id, org_id, po_number, status, total) VALUES ('po-test-4', 'org-test-4', 'PO-2024-004', 'pending_approval', 1000.00);
  INSERT INTO po_approval_history
    (id, org_id, po_id, action, user_id, user_name, user_role)
  VALUES
    ('hist-test-4', 'org-test-4', 'po-test-4', 'submitted', 'user-test-4', 'User 4', 'admin');

  SET LOCAL ROLE user_test_4;
  SET LOCAL auth.uid = 'user-test-4';

  SELECT plan(1, 'Approval history is append-only - DELETE blocked');

  -- Test case: RLS - Append-only table
  DELETE FROM po_approval_history WHERE id = 'hist-test-4';

  SELECT is(
    (SELECT COUNT(*) FROM po_approval_history WHERE id = 'hist-test-4'),
    1::bigint,
    'DELETE blocked by RLS policy - history entry still exists'
  );

  SELECT * FROM finish();
ROLLBACK;


-- Test 4: Users can insert approval history for their org
BEGIN;
  -- Setup
  INSERT INTO organizations (id, name) VALUES ('org-test-5', 'Test Org 5');
  INSERT INTO users (id, org_id, email, role) VALUES ('user-test-5', 'org-test-5', 'user5@org5.com', 'admin');
  INSERT INTO purchase_orders (id, org_id, po_number, status, total) VALUES ('po-test-5', 'org-test-5', 'PO-2024-005', 'pending_approval', 1000.00);

  SET LOCAL ROLE user_test_5;
  SET LOCAL auth.uid = 'user-test-5';

  SELECT plan(1, 'Users can insert approval history for their org');

  -- Test case: RLS - INSERT allowed
  INSERT INTO po_approval_history
    (id, org_id, po_id, action, user_id, user_name, user_role)
  VALUES
    ('hist-test-5', 'org-test-5', 'po-test-5', 'submitted', 'user-test-5', 'User 5', 'admin');

  SELECT is(
    (SELECT COUNT(*) FROM po_approval_history WHERE id = 'hist-test-5'),
    1::bigint,
    'INSERT allowed by RLS policy for own org'
  );

  SELECT * FROM finish();
ROLLBACK;


-- Test 5: Users cannot insert approval history for other orgs
BEGIN;
  -- Setup
  INSERT INTO organizations (id, name) VALUES ('org-test-6a', 'Test Org 6a');
  INSERT INTO organizations (id, name) VALUES ('org-test-6b', 'Test Org 6b');
  INSERT INTO users (id, org_id, email, role) VALUES ('user-test-6', 'org-test-6a', 'user6@org6a.com', 'admin');
  INSERT INTO purchase_orders (id, org_id, po_number, status, total) VALUES ('po-test-6', 'org-test-6b', 'PO-2024-006', 'pending_approval', 1000.00);

  SET LOCAL ROLE user_test_6;
  SET LOCAL auth.uid = 'user-test-6';

  SELECT plan(1, 'Users cannot insert approval history for other orgs');

  -- Test case: RLS - INSERT blocked for different org
  INSERT INTO po_approval_history
    (id, org_id, po_id, action, user_id, user_name, user_role)
  VALUES
    ('hist-test-6', 'org-test-6b', 'po-test-6', 'submitted', 'user-test-6', 'User 6', 'admin');

  SELECT is(
    (SELECT COUNT(*) FROM po_approval_history WHERE id = 'hist-test-6'),
    0::bigint,
    'INSERT blocked by RLS policy for different org'
  );

  SELECT * FROM finish();
ROLLBACK;


-- Test 6: Foreign key constraint on po_id
BEGIN;
  -- Setup
  INSERT INTO organizations (id, name) VALUES ('org-test-7', 'Test Org 7');
  INSERT INTO users (id, org_id, email, role) VALUES ('user-test-7', 'org-test-7', 'user7@org7.com', 'admin');

  SET LOCAL ROLE user_test_7;
  SET LOCAL auth.uid = 'user-test-7';

  SELECT plan(1, 'Foreign key constraint on po_id');

  -- Test case: Database constraint - Invalid po_id
  INSERT INTO po_approval_history
    (id, org_id, po_id, action, user_id, user_name, user_role)
  VALUES
    ('hist-test-7', 'org-test-7', 'nonexistent-po', 'submitted', 'user-test-7', 'User 7', 'admin');

  SELECT throws_ok(
    'INSERT INTO po_approval_history (id, org_id, po_id, action, user_id, user_name, user_role) VALUES (''hist-test-7'', ''org-test-7'', ''nonexistent-po'', ''submitted'', ''user-test-7'', ''User 7'', ''admin'')',
    'Foreign key constraint should prevent invalid po_id',
    'Foreign key violation'
  );

  SELECT * FROM finish();
ROLLBACK;


-- Test 7: Foreign key constraint on user_id
BEGIN;
  -- Setup
  INSERT INTO organizations (id, name) VALUES ('org-test-8', 'Test Org 8');
  INSERT INTO users (id, org_id, email, role) VALUES ('user-test-8', 'org-test-8', 'user8@org8.com', 'admin');
  INSERT INTO purchase_orders (id, org_id, po_number, status, total) VALUES ('po-test-8', 'org-test-8', 'PO-2024-008', 'pending_approval', 1000.00);

  SET LOCAL ROLE user_test_8;
  SET LOCAL auth.uid = 'user-test-8';

  SELECT plan(1, 'Foreign key constraint on user_id');

  -- Test case: Database constraint - Invalid user_id
  INSERT INTO po_approval_history
    (id, org_id, po_id, action, user_id, user_name, user_role)
  VALUES
    ('hist-test-8', 'org-test-8', 'po-test-8', 'submitted', 'nonexistent-user', 'User 8', 'admin');

  SELECT throws_ok(
    'INSERT INTO po_approval_history (id, org_id, po_id, action, user_id, user_name, user_role) VALUES (''hist-test-8'', ''org-test-8'', ''po-test-8'', ''submitted'', ''nonexistent-user'', ''User 8'', ''admin'')',
    'Foreign key constraint should prevent invalid user_id',
    'Foreign key violation'
  );

  SELECT * FROM finish();
ROLLBACK;


-- Test 8: Action enum constraint
BEGIN;
  -- Setup
  INSERT INTO organizations (id, name) VALUES ('org-test-9', 'Test Org 9');
  INSERT INTO users (id, org_id, email, role) VALUES ('user-test-9', 'org-test-9', 'user9@org9.com', 'admin');
  INSERT INTO purchase_orders (id, org_id, po_number, status, total) VALUES ('po-test-9', 'org-test-9', 'PO-2024-009', 'pending_approval', 1000.00);

  SET LOCAL ROLE user_test_9;
  SET LOCAL auth.uid = 'user-test-9';

  SELECT plan(1, 'Action enum constraint');

  -- Test case: Database constraint - Invalid action
  INSERT INTO po_approval_history
    (id, org_id, po_id, action, user_id, user_name, user_role)
  VALUES
    ('hist-test-9', 'org-test-9', 'po-test-9', 'invalid_action', 'user-test-9', 'User 9', 'admin');

  SELECT throws_ok(
    'INSERT INTO po_approval_history (id, org_id, po_id, action, user_id, user_name, user_role) VALUES (''hist-test-9'', ''org-test-9'', ''po-test-9'', ''invalid_action'', ''user-test-9'', ''User 9'', ''admin'')',
    'CHECK constraint should only allow: submitted, approved, rejected',
    'Invalid action value'
  );

  SELECT * FROM finish();
ROLLBACK;


-- Test 9: Index on po_id for query performance
BEGIN;
  SELECT plan(1, 'Index on po_id for performance');

  -- Test case: Database performance - Index exists
  SELECT has_index(
    'po_approval_history',
    'idx_po_approval_history_po',
    'Index on po_id exists for performance'
  );

  SELECT * FROM finish();
END;


-- Test 10: Index on created_at for sorting
BEGIN;
  SELECT plan(1, 'Index on created_at for sorting');

  -- Test case: Database performance - Index exists
  SELECT has_index(
    'po_approval_history',
    'idx_po_approval_history_created',
    'Index on created_at DESC exists for sorting'
  );

  SELECT * FROM finish();
END;


-- Test 11: Index on org_id for RLS filtering
BEGIN;
  SELECT plan(1, 'Index on org_id for RLS filtering');

  -- Test case: Database performance - Index exists
  SELECT has_index(
    'po_approval_history',
    'idx_po_approval_history_org',
    'Index on org_id exists for RLS filtering'
  );

  SELECT * FROM finish();
END;


-- Test 12: Cascade delete when PO is deleted
BEGIN;
  -- Setup
  INSERT INTO organizations (id, name) VALUES ('org-test-12', 'Test Org 12');
  INSERT INTO users (id, org_id, email, role) VALUES ('user-test-12', 'org-test-12', 'user12@org12.com', 'admin');
  INSERT INTO purchase_orders (id, org_id, po_number, status, total) VALUES ('po-test-12', 'org-test-12', 'PO-2024-012', 'pending_approval', 1000.00);
  INSERT INTO po_approval_history
    (id, org_id, po_id, action, user_id, user_name, user_role)
  VALUES
    ('hist-test-12', 'org-test-12', 'po-test-12', 'submitted', 'user-test-12', 'User 12', 'admin');

  DELETE FROM purchase_orders WHERE id = 'po-test-12';

  SELECT plan(1, 'Cascade delete when PO is deleted');

  SELECT is(
    (SELECT COUNT(*) FROM po_approval_history WHERE po_id = 'po-test-12'),
    0::bigint,
    'Approval history deleted when PO is deleted (CASCADE)'
  );

  SELECT * FROM finish();
ROLLBACK;


-- Test 13: Multiple history entries per PO
BEGIN;
  -- Setup
  INSERT INTO organizations (id, name) VALUES ('org-test-13', 'Test Org 13');
  INSERT INTO users (id, org_id, email, role) VALUES ('user-test-13', 'org-test-13', 'user13@org13.com', 'admin');
  INSERT INTO purchase_orders (id, org_id, po_number, status, total) VALUES ('po-test-13', 'org-test-13', 'PO-2024-013', 'pending_approval', 1000.00);

  INSERT INTO po_approval_history
    (id, org_id, po_id, action, user_id, user_name, user_role)
  VALUES
    ('hist-13-1', 'org-test-13', 'po-test-13', 'submitted', 'user-test-13', 'User 13', 'admin'),
    ('hist-13-2', 'org-test-13', 'po-test-13', 'rejected', 'user-test-13', 'User 13', 'admin'),
    ('hist-13-3', 'org-test-13', 'po-test-13', 'submitted', 'user-test-13', 'User 13', 'admin'),
    ('hist-13-4', 'org-test-13', 'po-test-13', 'approved', 'user-test-13', 'User 13', 'admin');

  SELECT plan(1, 'Multiple history entries per PO');

  SELECT is(
    (SELECT COUNT(*) FROM po_approval_history WHERE po_id = 'po-test-13'),
    4::bigint,
    'Can have multiple history entries per PO'
  );

  SELECT * FROM finish();
ROLLBACK;


-- Test 14: Sorting history by created_at DESC
BEGIN;
  -- Setup
  INSERT INTO organizations (id, name) VALUES ('org-test-14', 'Test Org 14');
  INSERT INTO users (id, org_id, email, role) VALUES ('user-test-14', 'org-test-14', 'user14@org14.com', 'admin');
  INSERT INTO purchase_orders (id, org_id, po_number, status, total) VALUES ('po-test-14', 'org-test-14', 'PO-2024-014', 'pending_approval', 1000.00);

  INSERT INTO po_approval_history
    (id, org_id, po_id, action, user_id, user_name, user_role, created_at)
  VALUES
    ('hist-14-1', 'org-test-14', 'po-test-14', 'submitted', 'user-test-14', 'User 14', 'admin', '2024-12-10 10:00:00+00'),
    ('hist-14-2', 'org-test-14', 'po-test-14', 'rejected', 'user-test-14', 'User 14', 'admin', '2024-12-11 10:00:00+00'),
    ('hist-14-3', 'org-test-14', 'po-test-14', 'approved', 'user-test-14', 'User 14', 'admin', '2024-12-12 10:00:00+00');

  SELECT plan(1, 'Sorting history by created_at DESC');

  SELECT is(
    (SELECT action FROM po_approval_history WHERE po_id = 'po-test-14' ORDER BY created_at DESC LIMIT 1),
    'approved'::text,
    'Newest entry (approved) appears first when sorted DESC'
  );

  SELECT * FROM finish();
ROLLBACK;

-- Summary
SELECT * FROM finish();
