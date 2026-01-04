-- =============================================================================
-- Migration 089: Add LP Search & Filter Composite Indexes
-- Story: 05.5 - LP Search & Filters
-- Purpose: Performance optimization for advanced search and filtering
-- Target: <300ms search, <500ms complex filters
-- =============================================================================

-- =============================================================================
-- Composite Indexes for Common Filter Combinations
-- =============================================================================

-- Product + Status + QA Status (for "Available Stock" preset and complex queries)
-- Used by: getAvailableStock(), complex multi-filter queries
-- Expected benefit: 3-5x faster for product + status + qa_status combinations
CREATE INDEX IF NOT EXISTS idx_lp_product_status_qa
ON license_plates(org_id, product_id, status, qa_status);

-- Warehouse + Location + Status (for warehouse-specific location filtering)
-- Used by: Warehouse/location-based queries with status filters
-- Expected benefit: 3-5x faster for warehouse + location + status combinations
CREATE INDEX IF NOT EXISTS idx_lp_warehouse_location_status
ON license_plates(org_id, warehouse_id, location_id, status);

-- Expiry + Status (for "Expiring Soon" preset)
-- Used by: getExpiringSoon(), FEFO picking with status filter
-- Expected benefit: 5-10x faster for expiry-based queries with status filter
CREATE INDEX IF NOT EXISTS idx_lp_expiry_status
ON license_plates(org_id, expiry_date, status)
WHERE expiry_date IS NOT NULL;

-- =============================================================================
-- Notes on Index Usage
-- =============================================================================

-- These composite indexes work in PostgreSQL's B-tree left-to-right order:
--
-- idx_lp_product_status_qa can be used for queries filtering by:
--   1. org_id only
--   2. org_id + product_id
--   3. org_id + product_id + status
--   4. org_id + product_id + status + qa_status (optimal)
--
-- idx_lp_warehouse_location_status can be used for queries filtering by:
--   1. org_id only
--   2. org_id + warehouse_id
--   3. org_id + warehouse_id + location_id
--   4. org_id + warehouse_id + location_id + status (optimal)
--
-- idx_lp_expiry_status can be used for queries filtering by:
--   1. org_id only
--   2. org_id + expiry_date
--   3. org_id + expiry_date + status (optimal)

-- =============================================================================
-- Existing Indexes from Migration 088
-- =============================================================================

-- Already created in migration 088 (no action needed):
-- - idx_lp_org_status: Single-column status filter
-- - idx_lp_org_product: Single-column product filter
-- - idx_lp_org_location: Single-column location filter
-- - idx_lp_org_warehouse: Single-column warehouse filter
-- - idx_lp_org_qa: Single-column qa_status filter
-- - idx_lp_expiry: Expiry date filter (NULLs excluded)
-- - idx_lp_created: Created date for FIFO sorting
-- - idx_lp_batch: Batch number search (NULLs excluded)
-- - idx_lp_number_search: LP number prefix search (text_pattern_ops)

-- =============================================================================
-- Performance Expectations
-- =============================================================================

-- With these indexes, we expect:
-- - Simple search (LP prefix, 2 chars): <300ms (target from PRD WH-FR-002)
-- - Batch number search (exact): <300ms
-- - Single filter query: <300ms
-- - Complex filter (5+ params): <500ms
-- - Search + filter combo: <500ms

-- Tested with dataset size: 10,000+ LPs per org
-- Index size impact: ~5-10 MB per 10K rows per composite index

-- =============================================================================
-- Verification Queries (for testing after deployment)
-- =============================================================================

-- Check index usage for product + status + qa_status query:
-- EXPLAIN ANALYZE
-- SELECT * FROM license_plates
-- WHERE org_id = 'test-org-id'
--   AND product_id = 'test-product-id'
--   AND status = 'available'
--   AND qa_status = 'passed';
-- Expected: Index Scan using idx_lp_product_status_qa

-- Check index usage for warehouse + location + status query:
-- EXPLAIN ANALYZE
-- SELECT * FROM license_plates
-- WHERE org_id = 'test-org-id'
--   AND warehouse_id = 'test-warehouse-id'
--   AND location_id = 'test-location-id'
--   AND status = 'available';
-- Expected: Index Scan using idx_lp_warehouse_location_status

-- Check index usage for expiring soon query:
-- EXPLAIN ANALYZE
-- SELECT * FROM license_plates
-- WHERE org_id = 'test-org-id'
--   AND status = 'available'
--   AND expiry_date <= CURRENT_DATE + INTERVAL '30 days'
--   AND expiry_date IS NOT NULL;
-- Expected: Index Scan using idx_lp_expiry_status
