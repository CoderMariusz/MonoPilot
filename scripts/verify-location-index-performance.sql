-- ============================================================================
-- Performance Verification Script: Location Management
-- Story: 1.6 Location Management
-- Task 13: Performance Optimization (AC-005.4)
--
-- CRITICAL: Verify idx_locations_warehouse index prevents 30s query on 500+ locations
-- ============================================================================

-- 1. Verify index exists
-- ============================================================================
\echo '=== 1. Checking if idx_locations_warehouse index exists ==='
\echo ''

SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'locations'
  AND indexname = 'idx_locations_warehouse';

\echo ''
\echo 'Expected: One row showing idx_locations_warehouse on warehouse_id column'
\echo ''

-- 2. Check index usage statistics
-- ============================================================================
\echo '=== 2. Index usage statistics ==='
\echo ''

SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE indexname = 'idx_locations_warehouse';

\echo ''
\echo 'Expected: idx_scan > 0 means index is being used'
\echo ''

-- 3. EXPLAIN query plan for location list by warehouse
-- ============================================================================
\echo '=== 3. EXPLAIN: Get locations by warehouse_id (most common query) ==='
\echo ''

EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT
    l.id,
    l.code,
    l.name,
    l.type,
    l.zone,
    l.zone_enabled,
    l.capacity,
    l.capacity_enabled,
    l.barcode,
    l.is_active,
    w.code as warehouse_code,
    w.name as warehouse_name
FROM public.locations l
INNER JOIN public.warehouses w ON l.warehouse_id = w.id
WHERE l.warehouse_id = (
    SELECT id FROM public.warehouses LIMIT 1
)
  AND l.is_active = true
ORDER BY l.code ASC;

\echo ''
\echo 'Expected: Query plan should show "Index Scan using idx_locations_warehouse"'
\echo 'Expected: Cost should be low (< 50 for 500 rows)'
\echo 'Expected: Execution time should be < 100ms'
\echo ''

-- 4. EXPLAIN query plan for location list with filters
-- ============================================================================
\echo '=== 4. EXPLAIN: Get locations with warehouse + type filters ==='
\echo ''

EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT
    l.id,
    l.code,
    l.name,
    l.type,
    l.barcode
FROM public.locations l
WHERE l.warehouse_id = (
    SELECT id FROM public.warehouses LIMIT 1
)
  AND l.type = 'storage'
  AND l.is_active = true
ORDER BY l.code ASC;

\echo ''
\echo 'Expected: Index Scan on idx_locations_warehouse'
\echo 'Expected: Additional filter on type (no separate index needed for type)'
\echo ''

-- 5. Performance benchmark: Without index (simulation)
-- ============================================================================
\echo '=== 5. Simulated query WITHOUT index (for comparison) ==='
\echo ''
\echo 'If idx_locations_warehouse did not exist, query would use:'
\echo '  - Sequential Scan on locations'
\echo '  - Cost: ~1000-2000 for 500 rows'
\echo '  - Time: 10-30 seconds on production data'
\echo ''
\echo 'With index:'
\echo '  - Index Scan using idx_locations_warehouse'
\echo '  - Cost: ~10-50 for 500 rows'
\echo '  - Time: < 100ms'
\echo ''
\echo 'Performance improvement: 100-300x faster'
\echo ''

-- 6. Check for missing indexes on related columns
-- ============================================================================
\echo '=== 6. Recommendations: Additional indexes (optional) ==='
\echo ''

-- Check if we should add composite index for warehouse_id + is_active
SELECT
    COUNT(*) as active_locations,
    warehouse_id
FROM public.locations
WHERE is_active = true
GROUP BY warehouse_id
ORDER BY active_locations DESC
LIMIT 5;

\echo ''
\echo 'If active_locations > 100 per warehouse, consider composite index:'
\echo 'CREATE INDEX idx_locations_warehouse_active ON locations(warehouse_id, is_active);'
\echo ''

-- 7. Table statistics
-- ============================================================================
\echo '=== 7. Table statistics ==='
\echo ''

SELECT
    schemaname,
    tablename,
    n_live_tup as row_count,
    n_dead_tup as dead_rows,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
WHERE tablename = 'locations';

\echo ''
\echo 'Expected: row_count shows current location count'
\echo 'Expected: Statistics should be up-to-date (last_analyze/last_autovacuum recent)'
\echo ''

-- 8. Cache hit ratio for locations table
-- ============================================================================
\echo '=== 8. Cache hit ratio ==='
\echo ''

SELECT
    schemaname,
    tablename,
    heap_blks_read as disk_reads,
    heap_blks_hit as cache_hits,
    CASE
        WHEN (heap_blks_read + heap_blks_hit) > 0
        THEN ROUND(100.0 * heap_blks_hit / (heap_blks_read + heap_blks_hit), 2)
        ELSE 0
    END as cache_hit_ratio_percent
FROM pg_statio_user_tables
WHERE tablename = 'locations';

\echo ''
\echo 'Expected: cache_hit_ratio_percent > 95% (good)'
\echo 'If < 90%, consider increasing shared_buffers or investigating query patterns'
\echo ''

-- ============================================================================
-- Summary and Verification Checklist
-- ============================================================================
\echo ''
\echo '==================================================================='
\echo 'VERIFICATION CHECKLIST - Story 1.6 Performance (Task 13)'
\echo '==================================================================='
\echo ''
\echo '[ ] 1. idx_locations_warehouse index EXISTS'
\echo '[ ] 2. Index has idx_scan > 0 (being used)'
\echo '[ ] 3. EXPLAIN shows "Index Scan using idx_locations_warehouse"'
\echo '[ ] 4. Query cost < 50 for warehouse filter'
\echo '[ ] 5. Execution time < 100ms for 500 locations'
\echo '[ ] 6. Cache hit ratio > 95%'
\echo '[ ] 7. No sequential scans on locations with warehouse_id filter'
\echo ''
\echo 'If all checks pass: Performance requirement AC-005.4 SATISFIED ✓'
\echo 'If any check fails: Investigate and fix before production deployment'
\echo ''
\echo '==================================================================='
