-- RLS Tests for bom_items table
-- Story: 02.5a - BOM Items Core (MVP)
-- Date: 2025-12-28
-- Purpose: Verify multi-tenant isolation, role-based access control, and constraints

-- =============================================================================
-- SETUP: Test environment
-- =============================================================================

-- This test uses pgTAP framework
-- Run with: pg_prove -d your_database tests/bom_items_rls.test.sql

BEGIN;
SELECT plan(20);

-- =============================================================================
-- TEST GROUP 1: RLS POLICIES EXIST
-- =============================================================================

-- Test 1: RLS is enabled on bom_items table
SELECT ok(
  (SELECT rowsecurity FROM pg_tables WHERE tablename = 'bom_items'),
  'RLS is enabled on bom_items table'
);

-- Test 2: SELECT policy exists
SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'bom_items'
    AND policyname = 'bom_items_select'
  ),
  'SELECT policy exists'
);

-- Test 3: INSERT policy exists
SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'bom_items'
    AND policyname = 'bom_items_insert'
  ),
  'INSERT policy exists'
);

-- Test 4: UPDATE policy exists
SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'bom_items'
    AND policyname = 'bom_items_update'
  ),
  'UPDATE policy exists'
);

-- Test 5: DELETE policy exists
SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'bom_items'
    AND policyname = 'bom_items_delete'
  ),
  'DELETE policy exists'
);

-- =============================================================================
-- TEST GROUP 2: CONSTRAINTS
-- =============================================================================

-- Test 6: Quantity positive constraint exists
SELECT ok(
  EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'bom_items'
    AND constraint_name = 'bom_items_quantity_positive'
  ),
  'Positive quantity constraint exists'
);

-- Test 7: Sequence non-negative constraint exists
SELECT ok(
  EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'bom_items'
    AND constraint_name = 'bom_items_sequence_non_negative'
  ),
  'Non-negative sequence constraint exists'
);

-- Test 8: Scrap percent range constraint exists
SELECT ok(
  EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'bom_items'
    AND constraint_name = 'bom_items_scrap_percent_range'
  ),
  'Scrap percent range constraint exists'
);

-- Test 9: Notes max length constraint exists
SELECT ok(
  EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'bom_items'
    AND constraint_name = 'bom_items_notes_max_length'
  ),
  'Notes max length constraint exists'
);

-- =============================================================================
-- TEST GROUP 3: FOREIGN KEYS
-- =============================================================================

-- Test 10: FK to boms exists
SELECT ok(
  EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu
      ON tc.constraint_name = ccu.constraint_name
    WHERE tc.table_name = 'bom_items'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND ccu.table_name = 'boms'
  ),
  'Foreign key to boms table exists'
);

-- Test 11: FK to products exists
SELECT ok(
  EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu
      ON tc.constraint_name = ccu.constraint_name
    WHERE tc.table_name = 'bom_items'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND ccu.table_name = 'products'
  ),
  'Foreign key to products table exists'
);

-- =============================================================================
-- TEST GROUP 4: INDEXES
-- =============================================================================

-- Test 12: BOM ID index exists
SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'bom_items'
    AND indexname = 'idx_bom_items_bom_id'
  ),
  'BOM ID index exists'
);

-- Test 13: Product ID index exists
SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'bom_items'
    AND indexname = 'idx_bom_items_product_id'
  ),
  'Product ID index exists'
);

-- Test 14: BOM + sequence composite index exists
SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'bom_items'
    AND indexname = 'idx_bom_items_bom_seq'
  ),
  'BOM + sequence composite index exists'
);

-- =============================================================================
-- TEST GROUP 5: TRIGGERS
-- =============================================================================

-- Test 15: updated_at trigger exists
SELECT ok(
  EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE event_object_table = 'bom_items'
    AND trigger_name = 'trigger_bom_items_updated_at'
  ),
  'updated_at trigger exists'
);

-- Test 16: UoM validation trigger exists
SELECT ok(
  EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE event_object_table = 'bom_items'
    AND trigger_name = 'trigger_bom_item_uom_validation'
  ),
  'UoM validation trigger exists'
);

-- =============================================================================
-- TEST GROUP 6: TABLE STRUCTURE
-- =============================================================================

-- Test 17: Required columns exist
SELECT ok(
  (
    SELECT COUNT(*) = 12 FROM information_schema.columns
    WHERE table_name = 'bom_items'
    AND column_name IN (
      'id', 'bom_id', 'product_id', 'sequence', 'quantity', 'uom',
      'operation_seq', 'scrap_percent', 'notes',
      'created_at', 'updated_at', 'created_by'
    )
  ),
  'All required columns exist'
);

-- Test 18: quantity column has correct precision
SELECT ok(
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bom_items'
    AND column_name = 'quantity'
    AND numeric_precision = 15
    AND numeric_scale = 6
  ),
  'Quantity column has DECIMAL(15,6) precision'
);

-- Test 19: scrap_percent column has correct precision
SELECT ok(
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bom_items'
    AND column_name = 'scrap_percent'
    AND numeric_precision = 5
    AND numeric_scale = 2
  ),
  'Scrap percent column has DECIMAL(5,2) precision'
);

-- Test 20: operation_seq column allows NULL
SELECT ok(
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bom_items'
    AND column_name = 'operation_seq'
    AND is_nullable = 'YES'
  ),
  'operation_seq column allows NULL'
);

-- =============================================================================
-- CLEANUP
-- =============================================================================

SELECT * FROM finish();
ROLLBACK;

-- =============================================================================
-- MANUAL CROSS-TENANT ISOLATION TESTS
-- =============================================================================
-- Run these tests with actual test data to verify RLS isolation
--
-- SETUP:
-- 1. Create two test organizations
-- 2. Create test users in each org with different roles
-- 3. Create test products in each org
-- 4. Create test BOMs in each org
-- 5. Create test BOM items in each BOM
--
-- TEST CASES:
--
-- TC1: Org A user can read Org A items, cannot read Org B items
--   SET ROLE authenticated;
--   -- Set auth.uid() to user-a-id
--   SELECT COUNT(*) FROM bom_items;
--   -- Expected: Only Org A items returned
--
-- TC2: Org A user cannot insert into Org B BOM
--   INSERT INTO bom_items (bom_id, product_id, quantity, uom)
--   VALUES ('org-b-bom-id', 'org-b-product-id', 10, 'kg');
--   -- Expected: RLS policy violation error
--
-- TC3: Org A user cannot update Org B items
--   UPDATE bom_items SET quantity = 999 WHERE bom_id = 'org-b-bom-id';
--   -- Expected: 0 rows updated
--
-- TC4: Org A user cannot delete Org B items
--   DELETE FROM bom_items WHERE bom_id = 'org-b-bom-id';
--   -- Expected: 0 rows deleted
--
-- TC5: Cascade delete when BOM is deleted
--   DELETE FROM boms WHERE id = 'org-a-bom-id';
--   SELECT COUNT(*) FROM bom_items WHERE bom_id = 'org-a-bom-id';
--   -- Expected: 0 items (cascade delete)
--
-- TC6: Cannot delete product used in BOM item
--   DELETE FROM products WHERE id = 'product-used-in-bom-item';
--   -- Expected: FK violation error (RESTRICT)
--
-- TC7: VIEWER role cannot insert items
--   -- Set auth.uid() to viewer-user-id
--   INSERT INTO bom_items (bom_id, product_id, quantity, uom)
--   VALUES ('org-a-bom-id', 'org-a-product-id', 10, 'kg');
--   -- Expected: RLS policy violation (no technical.C permission)
--
-- TC8: PRODUCTION_MANAGER role can insert/update items
--   -- Set auth.uid() to production-manager-id
--   INSERT INTO bom_items (bom_id, product_id, quantity, uom)
--   VALUES ('org-a-bom-id', 'org-a-product-id', 10, 'kg');
--   -- Expected: Success
--
-- TC9: PRODUCTION_MANAGER cannot delete items (only admin/owner)
--   DELETE FROM bom_items WHERE id = 'some-item-id';
--   -- Expected: 0 rows deleted (RLS blocks)
--
-- TC10: ADMIN role can delete items
--   -- Set auth.uid() to admin-user-id
--   DELETE FROM bom_items WHERE id = 'some-item-id';
--   -- Expected: 1 row deleted

-- =============================================================================
-- CONSTRAINT VALIDATION TESTS
-- =============================================================================
-- Run these to verify constraints work correctly
--
-- TC-C1: Quantity must be > 0
--   INSERT INTO bom_items (bom_id, product_id, quantity, uom)
--   VALUES ('valid-bom-id', 'valid-product-id', 0, 'kg');
--   -- Expected: CHECK constraint violation
--
-- TC-C2: Quantity cannot be negative
--   INSERT INTO bom_items (bom_id, product_id, quantity, uom)
--   VALUES ('valid-bom-id', 'valid-product-id', -5, 'kg');
--   -- Expected: CHECK constraint violation
--
-- TC-C3: Scrap percent cannot exceed 100
--   INSERT INTO bom_items (bom_id, product_id, quantity, uom, scrap_percent)
--   VALUES ('valid-bom-id', 'valid-product-id', 10, 'kg', 150);
--   -- Expected: CHECK constraint violation
--
-- TC-C4: Scrap percent cannot be negative
--   INSERT INTO bom_items (bom_id, product_id, quantity, uom, scrap_percent)
--   VALUES ('valid-bom-id', 'valid-product-id', 10, 'kg', -5);
--   -- Expected: CHECK constraint violation
--
-- TC-C5: Sequence cannot be negative
--   INSERT INTO bom_items (bom_id, product_id, quantity, uom, sequence)
--   VALUES ('valid-bom-id', 'valid-product-id', 10, 'kg', -1);
--   -- Expected: CHECK constraint violation
--
-- TC-C6: Notes cannot exceed 500 characters
--   INSERT INTO bom_items (bom_id, product_id, quantity, uom, notes)
--   VALUES ('valid-bom-id', 'valid-product-id', 10, 'kg', repeat('a', 501));
--   -- Expected: CHECK constraint violation
--
-- TC-C7: Valid item with all fields
--   INSERT INTO bom_items (bom_id, product_id, quantity, uom, sequence, scrap_percent, notes)
--   VALUES ('valid-bom-id', 'valid-product-id', 10.123456, 'kg', 10, 2.5, 'Test notes');
--   -- Expected: Success

-- =============================================================================
-- UOM VALIDATION TRIGGER TESTS
-- =============================================================================
-- Verify UoM mismatch warning (non-blocking)
--
-- TC-U1: UoM matches component base_uom (no warning)
--   -- Product has base_uom = 'kg'
--   INSERT INTO bom_items (bom_id, product_id, quantity, uom)
--   VALUES ('valid-bom-id', 'product-with-kg-uom', 10, 'kg');
--   -- Expected: Success, no warning in NOTICE
--
-- TC-U2: UoM does not match (warning raised but save succeeds)
--   -- Product has base_uom = 'kg'
--   INSERT INTO bom_items (bom_id, product_id, quantity, uom)
--   VALUES ('valid-bom-id', 'product-with-kg-uom', 10, 'L');
--   -- Expected: Success with WARNING in NOTICE:
--   -- "UoM mismatch: BOM item UoM (L) does not match component XXX base UoM (kg)"
