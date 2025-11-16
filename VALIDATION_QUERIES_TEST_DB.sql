-- =============================================
-- Story 0.9: Test DB Schema Validation Queries
-- =============================================
-- Execute these queries in Supabase SQL Editor for TEST DB
-- URL: https://supabase.com/dashboard/project/gvnkzwokxtztyxsfshct/sql
--
-- Expected Results documented after each query
-- =============================================

-- [1/7] TABLE COUNT (Expected: 45 tables)
-- =============================================
SELECT COUNT(*) as table_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';
-- ✅ Expected: 45


-- [2/7] ENUM TYPES (Expected: 3 ENUMs with correct values)
-- =============================================

-- Check product_group ENUM
SELECT enumlabel
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'product_group'
ORDER BY e.enumsortorder;
-- ✅ Expected: MEAT, DRYGOODS, COMPOSITE

-- Check product_type ENUM
SELECT enumlabel
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'product_type'
ORDER BY e.enumsortorder;
-- ✅ Expected: RM_MEAT, PR, FG, DG_WEB, DG_LABEL, DG_BOX, DG_ING, DG_SAUCE

-- Check bom_status ENUM
SELECT enumlabel
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'bom_status'
ORDER BY e.enumsortorder;
-- ✅ Expected: draft, active, archived


-- [3/7] EPIC 0 FIXES (Expected: 4 patterns verified)
-- =============================================

-- Pattern A: to_line.notes (was in migration 020 but never executed)
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'to_line'
  AND column_name = 'notes';
-- ✅ Expected: notes | text | YES

-- Pattern B: locations.zone (added in Epic 0)
SELECT
  column_name,
  data_type,
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'locations'
  AND column_name = 'zone';
-- ✅ Expected: zone | character varying | 50

-- Pattern C: po_header.warehouse_id (CRITICAL - Story 0.1)
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'po_header'
  AND column_name = 'warehouse_id';
-- ✅ Expected: warehouse_id | integer | NO

-- Pattern C: license_plates.status (10 values CHECK constraint)
SELECT
  conname,
  pg_get_constraintdef(oid) as constraint_def
FROM pg_constraint
WHERE conrelid = 'license_plates'::regclass
  AND contype = 'c'
  AND conname LIKE '%status%';
-- ✅ Expected: CHECK constraint with 10 status values


-- [4/7] RLS POLICIES (Expected: ~42 tables with RLS)
-- =============================================
SELECT COUNT(DISTINCT tablename) as tables_with_rls
FROM pg_policies
WHERE schemaname = 'public';
-- ✅ Expected: ~42 (allow variance 40-45)

-- List all tables with RLS enabled
SELECT
  schemaname,
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;


-- [5/7] TRIGGERS (Expected: 5 triggers)
-- =============================================
SELECT
  trigger_name,
  event_object_table as table_name,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table;
-- ✅ Expected triggers:
--    - update_users_updated_at (on users)
--    - update_suppliers_updated_at (on suppliers)
--    - update_warehouses_updated_at (on warehouses)
--    - update_locations_updated_at (on locations)
--    - check_bom_date_overlap_trigger (on boms)


-- [6/7] FUNCTIONS (Expected: 3 functions)
-- =============================================
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;
-- ✅ Expected functions:
--    - check_bom_date_overlap
--    - select_bom_for_wo
--    - update_updated_at_column


-- [7/7] SCHEMA STRUCTURE - Critical Tables
-- =============================================
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name IN (
    'users', 'products', 'boms', 'bom_items',
    'po_header', 'po_line', 'to_header', 'to_line',
    'work_orders', 'wo_materials', 'license_plates',
    'warehouses', 'locations', 'suppliers'
  )
ORDER BY table_name;
-- ✅ Expected: All 14 critical tables present


-- =============================================
-- ADDITIONAL CHECKS - FK Constraints
-- =============================================

-- Verify the 3 circular FK constraints we fixed
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND (
    (tc.table_name = 'products' AND kcu.column_name = 'default_routing_id')
    OR (tc.table_name = 'boms' AND kcu.column_name = 'default_routing_id')
    OR (tc.table_name = 'to_line' AND kcu.column_name = 'lp_id')
  );
-- ✅ Expected: 3 FK constraints we fixed during migration


-- =============================================
-- VALIDATION SUMMARY CHECKLIST
-- =============================================
-- Copy results here after running queries:
--
-- [ ] 1. Table Count: _____ (expected 45)
-- [ ] 2. ENUMs: product_group (3), product_type (8), bom_status (3)
-- [ ] 3. Epic 0 Fixes: to_line.notes, locations.zone, po_header.warehouse_id, license_plates.status
-- [ ] 4. RLS Policies: _____ tables (expected ~42)
-- [ ] 5. Triggers: _____ (expected 5)
-- [ ] 6. Functions: _____ (expected 3)
-- [ ] 7. Critical Tables: _____ (expected 14/14)
-- [ ] 8. FK Constraints: _____ (expected 3 fixed)
--
-- ✅ ALL CHECKS PASSED - Ready for Production Migration
-- ❌ FAILURES FOUND - Fix on TEST before proceeding to PRODUCTION
