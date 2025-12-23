-- Verification Script for Migration 076: Allergens Table
-- Story: 01.12 - Allergens Management
-- Run this AFTER migration to verify everything works correctly

-- =============================================================================
-- 1. Verify table exists with correct structure
-- =============================================================================
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'allergens'
ORDER BY ordinal_position;

-- Expected: 14 columns (id, code, name_en, name_pl, name_de, name_fr, icon_url,
--                        icon_svg, is_eu_mandatory, is_custom, is_active,
--                        display_order, created_at, updated_at)

-- =============================================================================
-- 2. Verify constraints exist
-- =============================================================================
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'allergens'::regclass
ORDER BY conname;

-- Expected:
-- - allergens_code_format (CHECK constraint for A[0-9]{2} pattern)
-- - allergens_code_unique (UNIQUE constraint on code)
-- - allergens_pkey (PRIMARY KEY on id)

-- =============================================================================
-- 3. Verify indexes exist
-- =============================================================================
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'allergens'
ORDER BY indexname;

-- Expected:
-- - idx_allergens_code (btree on code)
-- - idx_allergens_display_order (btree on display_order)
-- - idx_allergens_search (GIN for full-text search)
-- - allergens_pkey (PRIMARY KEY index)
-- - allergens_code_unique (UNIQUE index)

-- =============================================================================
-- 4. Verify RLS is enabled
-- =============================================================================
SELECT
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'allergens';

-- Expected: rls_enabled = true

-- =============================================================================
-- 5. Verify RLS policies exist
-- =============================================================================
SELECT
    policyname,
    cmd AS operation,
    qual AS using_clause,
    with_check
FROM pg_policies
WHERE tablename = 'allergens'
ORDER BY policyname;

-- Expected:
-- - allergens_select_authenticated (SELECT policy, using: is_active = true)

-- =============================================================================
-- 6. Verify seed data: 14 EU allergens
-- =============================================================================
SELECT
    code,
    name_en,
    name_pl,
    name_de,
    name_fr,
    display_order,
    is_eu_mandatory,
    is_custom,
    is_active
FROM allergens
ORDER BY display_order;

-- Expected: 14 rows (A01-A14)
-- All should have:
-- - is_eu_mandatory = true
-- - is_custom = false
-- - is_active = true
-- - display_order = 1 to 14

-- =============================================================================
-- 7. Verify code constraint works
-- =============================================================================
-- This should FAIL (invalid code format):
-- INSERT INTO allergens (code, name_en, name_pl, display_order)
-- VALUES ('B01', 'Test', 'Test', 99);

-- This should SUCCEED:
-- INSERT INTO allergens (code, name_en, name_pl, display_order)
-- VALUES ('A99', 'Test Custom', 'Test Custom', 99);

-- =============================================================================
-- 8. Count total allergens
-- =============================================================================
SELECT COUNT(*) AS total_allergens FROM allergens;

-- Expected: 14

-- =============================================================================
-- 9. Verify full-text search index works
-- =============================================================================
-- Search for "milk" (should return A07)
SELECT code, name_en, name_pl, name_de, name_fr
FROM allergens
WHERE to_tsvector('simple',
    coalesce(code, '') || ' ' ||
    coalesce(name_en, '') || ' ' ||
    coalesce(name_pl, '') || ' ' ||
    coalesce(name_de, '') || ' ' ||
    coalesce(name_fr, '')
) @@ to_tsquery('simple', 'milk');

-- Expected: 1 row (A07 - Milk)

-- Search for "orzechy" (Polish for nuts, should return A08)
SELECT code, name_en, name_pl, name_de, name_fr
FROM allergens
WHERE to_tsvector('simple',
    coalesce(code, '') || ' ' ||
    coalesce(name_en, '') || ' ' ||
    coalesce(name_pl, '') || ' ' ||
    coalesce(name_de, '') || ' ' ||
    coalesce(name_fr, '')
) @@ to_tsquery('simple', 'orzechy');

-- Expected: 1 row (A08 - Nuts)

-- =============================================================================
-- 10. Verify sorting by display_order
-- =============================================================================
SELECT code, name_en, display_order
FROM allergens
ORDER BY display_order
LIMIT 3;

-- Expected:
-- A01 | Gluten | 1
-- A02 | Crustaceans | 2
-- A03 | Eggs | 3

SELECT code, name_en, display_order
FROM allergens
ORDER BY display_order DESC
LIMIT 3;

-- Expected:
-- A14 | Molluscs | 14
-- A13 | Lupin | 13
-- A12 | Sulphites | 12

-- =============================================================================
-- Verification Complete
-- =============================================================================
-- If all queries above return expected results:
-- ✓ Table structure correct
-- ✓ Constraints working
-- ✓ Indexes created
-- ✓ RLS enabled with correct policy
-- ✓ 14 EU allergens seeded
-- ✓ Full-text search functional
-- ✓ Sorting by display_order works
