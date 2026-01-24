-- ============================================================================
-- Performance Tests for New Tables (Migrations 131-144)
-- Generated: 2026-01-23
-- Purpose: Test query performance for complex queries on new tables
-- ============================================================================

-- Enable timing for query performance measurement
\timing on

-- ============================================================================
-- TEST 1: Customer Lookup with Addresses
-- ============================================================================
EXPLAIN ANALYZE
SELECT
  c.*,
  json_agg(DISTINCT ca.*) FILTER (WHERE ca.id IS NOT NULL) as addresses,
  json_agg(DISTINCT cc.*) FILTER (WHERE cc.id IS NOT NULL) as contacts
FROM customers c
LEFT JOIN customer_addresses ca ON ca.customer_id = c.id
LEFT JOIN customer_contacts cc ON cc.customer_id = c.id
WHERE c.org_id = (SELECT id FROM organizations LIMIT 1)
  AND c.is_active = true
GROUP BY c.id
LIMIT 20;

-- ============================================================================
-- TEST 2: Sales Order with Lines and Allocations (Complex Join)
-- ============================================================================
EXPLAIN ANALYZE
SELECT
  so.id,
  so.order_number,
  so.status,
  so.total_amount,
  c.name as customer_name,
  json_agg(
    json_build_object(
      'line_number', sol.line_number,
      'product_id', sol.product_id,
      'quantity_ordered', sol.quantity_ordered,
      'quantity_allocated', sol.quantity_allocated,
      'allocations', (
        SELECT json_agg(
          json_build_object(
            'lp_number', lp.lp_number,
            'quantity_allocated', ia.quantity_allocated,
            'quantity_picked', ia.quantity_picked
          )
        )
        FROM inventory_allocations ia
        JOIN license_plates lp ON lp.id = ia.license_plate_id
        WHERE ia.sales_order_line_id = sol.id
          AND ia.released_at IS NULL
      )
    )
  ) as lines
FROM sales_orders so
JOIN customers c ON c.id = so.customer_id
LEFT JOIN sales_order_lines sol ON sol.sales_order_id = so.id
WHERE so.org_id = (SELECT id FROM organizations LIMIT 1)
  AND so.status IN ('draft', 'confirmed', 'allocated')
GROUP BY so.id, so.order_number, so.status, so.total_amount, c.name
LIMIT 10;

-- ============================================================================
-- TEST 3: Available Inventory for Allocation (FIFO)
-- ============================================================================
EXPLAIN ANALYZE
SELECT
  lp.id,
  lp.lp_number,
  lp.product_id,
  p.name as product_name,
  lp.quantity,
  lp.lot_number,
  lp.expiry_date,
  lp.location_id,
  l.code as location_code,
  (lp.quantity - COALESCE(get_lp_allocated_qty_so(lp.id), 0)) as available_quantity
FROM license_plates lp
JOIN products p ON p.id = lp.product_id
JOIN locations l ON l.id = lp.location_id
WHERE lp.org_id = (SELECT id FROM organizations LIMIT 1)
  AND lp.status = 'available'
  AND lp.qa_status = 'passed'
  AND lp.product_id = (SELECT id FROM products WHERE product_type = 'finished' LIMIT 1)
  AND (lp.quantity - COALESCE(get_lp_allocated_qty_so(lp.id), 0)) > 0
ORDER BY lp.production_date ASC  -- FIFO
LIMIT 20;

-- ============================================================================
-- TEST 4: Pick List with Lines and Location Details
-- ============================================================================
EXPLAIN ANALYZE
SELECT
  pl.id,
  pl.pick_list_number,
  pl.status,
  pl.priority,
  u.name as assigned_to_name,
  json_agg(
    json_build_object(
      'line_id', pll.id,
      'sequence', pll.pick_sequence,
      'product_name', p.name,
      'location_code', l.code,
      'lot_number', pll.lot_number,
      'quantity_to_pick', pll.quantity_to_pick,
      'status', pll.status
    ) ORDER BY pll.pick_sequence
  ) as lines
FROM pick_lists pl
LEFT JOIN users u ON u.id = pl.assigned_to
LEFT JOIN pick_list_lines pll ON pll.pick_list_id = pl.id
LEFT JOIN products p ON p.id = pll.product_id
LEFT JOIN locations l ON l.id = pll.location_id
WHERE pl.org_id = (SELECT id FROM organizations LIMIT 1)
  AND pl.status IN ('pending', 'assigned', 'in_progress')
GROUP BY pl.id, pl.pick_list_number, pl.status, pl.priority, u.name
ORDER BY
  CASE pl.priority
    WHEN 'urgent' THEN 1
    WHEN 'high' THEN 2
    WHEN 'normal' THEN 3
    WHEN 'low' THEN 4
  END,
  pl.created_at ASC
LIMIT 10;

-- ============================================================================
-- TEST 5: Quality Inspection with Test Results
-- ============================================================================
EXPLAIN ANALYZE
SELECT
  qi.id,
  qi.inspection_number,
  qi.inspection_type,
  qi.status,
  qi.result,
  p.name as product_name,
  qs.spec_number,
  u.name as inspector_name,
  json_agg(
    json_build_object(
      'parameter_name', qsp.parameter_name,
      'parameter_type', qsp.parameter_type,
      'target_value', qsp.target_value,
      'min_value', qsp.min_value,
      'max_value', qsp.max_value,
      'unit', qsp.unit,
      'is_critical', qsp.is_critical,
      'result', (
        SELECT json_build_object(
          'result_value', qtr.result_value,
          'pass_fail', qtr.pass_fail,
          'tested_at', qtr.tested_at
        )
        FROM quality_test_results qtr
        WHERE qtr.inspection_id = qi.id
          AND qtr.parameter_id = qsp.id
        LIMIT 1
      )
    ) ORDER BY qsp.sequence
  ) as test_parameters
FROM quality_inspections qi
JOIN products p ON p.id = qi.product_id
LEFT JOIN quality_specifications qs ON qs.id = qi.spec_id
LEFT JOIN quality_spec_parameters qsp ON qsp.spec_id = qs.id
LEFT JOIN users u ON u.id = qi.inspector_id
WHERE qi.org_id = (SELECT id FROM organizations LIMIT 1)
  AND qi.status IN ('scheduled', 'in_progress', 'completed')
GROUP BY qi.id, qi.inspection_number, qi.inspection_type, qi.status, qi.result, p.name, qs.spec_number, u.name
ORDER BY qi.scheduled_date DESC
LIMIT 10;

-- ============================================================================
-- TEST 6: Quality Holds Dashboard (Active Holds Summary)
-- ============================================================================
EXPLAIN ANALYZE
SELECT
  qh.id,
  qh.hold_number,
  qh.reason,
  qh.placed_at,
  u.name as placed_by_name,
  COUNT(qhi.id) as items_count,
  json_agg(
    json_build_object(
      'item_type', qhi.item_type,
      'item_id', qhi.item_id,
      'details', CASE qhi.item_type
        WHEN 'lp' THEN (
          SELECT json_build_object(
            'lp_number', lp.lp_number,
            'product_name', p.name,
            'quantity', lp.quantity,
            'lot_number', lp.lot_number
          )
          FROM license_plates lp
          JOIN products p ON p.id = lp.product_id
          WHERE lp.id = qhi.item_id
        )
        ELSE NULL
      END
    )
  ) as items
FROM quality_holds qh
JOIN users u ON u.id = qh.placed_by
LEFT JOIN quality_hold_items qhi ON qhi.hold_id = qh.id
WHERE qh.org_id = (SELECT id FROM organizations LIMIT 1)
  AND qh.status = 'active'
GROUP BY qh.id, qh.hold_number, qh.reason, qh.placed_at, u.name
ORDER BY qh.placed_at DESC
LIMIT 10;

-- ============================================================================
-- TEST 7: NCR Reports with References
-- ============================================================================
EXPLAIN ANALYZE
SELECT
  ncr.id,
  ncr.ncr_number,
  ncr.title,
  ncr.severity,
  ncr.status,
  u1.name as reported_by_name,
  u2.name as assigned_to_name,
  ncr.reference_type,
  CASE ncr.reference_type
    WHEN 'lp' THEN (SELECT lp_number FROM license_plates WHERE id = ncr.reference_id)
    WHEN 'wo' THEN (SELECT wo_number FROM work_orders WHERE id = ncr.reference_id)
    WHEN 'inspection' THEN (SELECT inspection_number FROM quality_inspections WHERE id = ncr.reference_id)
    ELSE NULL
  END as reference_number
FROM ncr_reports ncr
JOIN users u1 ON u1.id = ncr.reported_by
LEFT JOIN users u2 ON u2.id = ncr.assigned_to
WHERE ncr.org_id = (SELECT id FROM organizations LIMIT 1)
  AND ncr.status IN ('open', 'investigating')
ORDER BY
  CASE ncr.severity
    WHEN 'critical' THEN 1
    WHEN 'major' THEN 2
    WHEN 'minor' THEN 3
  END,
  ncr.reported_at DESC
LIMIT 10;

-- ============================================================================
-- TEST 8: Batch Release Status Check
-- ============================================================================
EXPLAIN ANALYZE
SELECT
  brr.id,
  brr.release_number,
  brr.batch_number,
  p.name as product_name,
  brr.status,
  u.name as approved_by_name,
  COUNT(brl.id) as lp_count,
  json_agg(
    json_build_object(
      'lp_number', lp.lp_number,
      'quantity', lp.quantity,
      'lot_number', lp.lot_number,
      'expiry_date', lp.expiry_date,
      'qa_status', lp.qa_status
    )
  ) as license_plates
FROM batch_release_records brr
JOIN products p ON p.id = brr.product_id
LEFT JOIN users u ON u.id = brr.approved_by
LEFT JOIN batch_release_lps brl ON brl.release_id = brr.id
LEFT JOIN license_plates lp ON lp.id = brl.lp_id
WHERE brr.org_id = (SELECT id FROM organizations LIMIT 1)
  AND brr.status = 'pending'
GROUP BY brr.id, brr.release_number, brr.batch_number, p.name, brr.status, u.name
ORDER BY brr.created_at DESC
LIMIT 10;

-- ============================================================================
-- TEST 9: Index Usage Check
-- ============================================================================
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'customers', 'sales_orders', 'sales_order_lines', 'inventory_allocations',
    'pick_lists', 'pick_list_lines', 'quality_inspections', 'quality_test_results',
    'quality_holds', 'ncr_reports', 'batch_release_records'
  )
ORDER BY tablename, idx_scan DESC;

-- ============================================================================
-- TEST 10: Table Statistics
-- ============================================================================
SELECT
  schemaname,
  tablename,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes,
  n_live_tup as live_tuples,
  n_dead_tup as dead_tuples,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'customers', 'sales_orders', 'sales_order_lines', 'inventory_allocations',
    'pick_lists', 'pick_list_lines', 'quality_inspections', 'quality_test_results',
    'quality_holds', 'ncr_reports', 'batch_release_records'
  )
ORDER BY n_live_tup DESC;

-- ============================================================================
-- PERFORMANCE SUMMARY
-- ============================================================================
\echo '============================================'
\echo 'Performance Test Summary'
\echo '============================================'
\echo 'Tests completed. Review EXPLAIN ANALYZE output above.'
\echo ''
\echo 'Key metrics to check:'
\echo '1. Query execution time (should be < 100ms for most queries)'
\echo '2. Index usage (idx_scan > 0 indicates index is being used)'
\echo '3. Sequential scans (minimize for large tables)'
\echo '4. Join efficiency (nested loop vs hash join)'
\echo '============================================'
