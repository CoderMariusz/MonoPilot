# Seed Data Implementation Guide

## Overview

This guide provides step-by-step instructions to populate your Supabase database with comprehensive test data for all MonoPilot features.

## Prerequisites

1. Access to your Supabase project: `https://pgroxddbtaevdegnidaz.supabase.co`
2. SQL Editor access in Supabase Dashboard
3. Admin privileges to execute DDL and DML statements

## Step 1: Apply Database Migrations

Execute the following migration files in Supabase SQL Editor **in this exact order**:

### Migration Order
1. `001_planning_tables.sql` - Core planning tables (products, BOMs, work orders, etc.)
2. `002_rls_policies.sql` - Row Level Security policies
3. `003_phase14_schema.sql` - Warehouses, suppliers, production outputs
4. `004_phase14_rpc_functions.sql` - Stored procedures and functions
5. `005_product_taxonomy_enums.sql` - Product type enums
6. `006_tax_allergens.sql` - Tax codes and allergens
7. `007_supplier_products.sql` - Supplier product relationships
8. `008_bom_routing.sql` - BOM and routing tables
9. `009_routing_requirements.sql` - Routing requirements and operations
10. `010_production_enums.sql` - Production-specific enums
11. `011_work_orders_enhancement.sql` - Enhanced work order features
12. `012_license_plates_enhancement.sql` - License plate enhancements
13. `013_stock_moves_enhancement.sql` - Stock move enhancements
14. `014_production_outputs.sql` - Production output tracking
15. `015_wo_operations_enhancement.sql` - Work order operations
16. `016_lp_numbering_trigger.sql` - License plate numbering trigger
17. `017_qa_gate_policies.sql` - QA gate policies
18. `018_yield_views.sql` - Yield reporting views

### Instructions
1. Open Supabase Dashboard → SQL Editor
2. Copy and paste each migration file content
3. Execute each migration individually
4. Verify no errors in the output
5. Proceed to the next migration

## Step 2: Apply Seed Data

Execute the seed data script:

1. Open `seed_database.sql` from `apps/frontend/lib/supabase/migrations/`
2. Copy the entire content
3. Paste into Supabase SQL Editor
4. Execute the script
5. Verify all INSERT statements complete successfully

## Step 3: Verify Data Integrity

Run these verification queries to ensure data was loaded correctly:

### Master Data Verification
```sql
-- Check suppliers
SELECT COUNT(*) as supplier_count FROM suppliers;
-- Expected: 5

-- Check warehouses and locations
SELECT w.name as warehouse, COUNT(l.id) as location_count 
FROM warehouses w 
LEFT JOIN locations l ON w.id = l.warehouse_id 
GROUP BY w.id, w.name;
-- Expected: 3 warehouses, 15 locations total

-- Check products
SELECT type, COUNT(*) as count FROM products GROUP BY type;
-- Expected: RM=10, PR=5, FG=8

-- Check allergens
SELECT COUNT(*) as allergen_count FROM allergens;
-- Expected: 14
```

### Planning Data Verification
```sql
-- Check purchase orders
SELECT status, COUNT(*) as count FROM purchase_orders GROUP BY status;
-- Expected: Various statuses with 5 total POs

-- Check transfer orders
SELECT status, COUNT(*) as count FROM transfer_orders GROUP BY status;
-- Expected: Various statuses with 3 total TOs

-- Check work orders
SELECT status, COUNT(*) as count FROM work_orders GROUP BY status;
-- Expected: 2 planned, 3 released, 3 in_progress, 2 completed
```

### Production Data Verification
```sql
-- Check BOMs and routing
SELECT COUNT(*) as bom_count FROM boms;
-- Expected: 8

SELECT COUNT(*) as routing_count FROM routings;
-- Expected: 8

SELECT COUNT(*) as operation_count FROM routing_operations;
-- Expected: 26

-- Check work order operations (completed WOs)
SELECT wo.wo_number, COUNT(wo_ops.id) as operation_count
FROM work_orders wo
LEFT JOIN wo_operations wo_ops ON wo.id = wo_ops.wo_id
WHERE wo.status = 'completed'
GROUP BY wo.id, wo.wo_number;
-- Expected: WO-2024-009 (4 ops), WO-2024-010 (4 ops)
```

### Warehouse Data Verification
```sql
-- Check GRNs
SELECT COUNT(*) as grn_count FROM grns;
-- Expected: 3

-- Check license plates
SELECT status, COUNT(*) as count FROM license_plates GROUP BY status;
-- Expected: Various statuses with 20 total LPs

-- Check stock moves
SELECT move_type, COUNT(*) as count FROM stock_moves GROUP BY move_type;
-- Expected: Various move types with 15 total moves
```

### Traceability Verification
```sql
-- Check LP genealogy
SELECT COUNT(*) as genealogy_count FROM lp_genealogy;
-- Expected: 6 relationships

-- Test forward traceability (from raw material to finished good)
WITH RECURSIVE trace_forward AS (
  SELECT child_lp_id, parent_lp_id, quantity_consumed, uom, wo_id, 1 as level
  FROM lp_genealogy 
  WHERE parent_lp_id = 1  -- LP-2024-001 (Beef)
  
  UNION ALL
  
  SELECT lg.child_lp_id, lg.parent_lp_id, lg.quantity_consumed, lg.uom, lg.wo_id, tf.level + 1
  FROM lp_genealogy lg
  JOIN trace_forward tf ON lg.parent_lp_id = tf.child_lp_id
  WHERE tf.level < 3
)
SELECT * FROM trace_forward ORDER BY level, child_lp_id;
-- Expected: Trace from LP-2024-001 to LP-2024-013 and LP-2024-014
```

## Step 4: Test Backend APIs

Once data is loaded, test these API endpoints:

### Production APIs
```bash
# Test yield reports
curl "http://localhost:3000/api/production/yield/pr?bucket=day&from=2024-01-25T00:00:00Z&to=2024-01-26T23:59:59Z"

curl "http://localhost:3000/api/production/yield/fg?bucket=day&from=2024-01-25T00:00:00Z&to=2024-01-26T23:59:59Z"

# Test consume report
curl "http://localhost:3000/api/production/consume?from=2024-01-25T00:00:00Z&to=2024-01-26T23:59:59Z"

# Test work order details
curl "http://localhost:3000/api/production/work-orders/9"

# Test traceability
curl "http://localhost:3000/api/production/trace/forward?lp=LP-2024-001"
curl "http://localhost:3000/api/production/trace/backward?lp=LP-2024-013"
```

### Planning APIs
```bash
# Test work orders
curl "http://localhost:3000/api/work-orders"

# Test purchase orders
curl "http://localhost:3000/api/purchase-orders"

# Test transfer orders
curl "http://localhost:3000/api/transfer-orders"
```

## Step 5: Test UI Features

### Planning Page Tests
1. **Work Orders Tab**
   - View work orders table
   - Click "View Details" on WO-2024-009 (should show BOM components)
   - Test search and filters

2. **Purchase Orders Tab**
   - View purchase orders table
   - Click "View Details" on PO-2024-001 (should show line items and GRNs)
   - Test PO status badges

3. **Transfer Orders Tab**
   - View transfer orders table
   - Click "View Details" on TO-2024-001 (should show transfer items)

### Production Page Tests
1. **Work Orders Tab**
   - View production work orders
   - Test actions menu (View, Close, Edit, Cancel)

2. **Yield Report Tab**
   - Select "PR" type, "day" bucket, "last-7-days" range
   - Verify KPI cards show data
   - Check drill-down table shows WO operations

3. **Consume Report Tab**
   - Select "last-7-days" range
   - Verify material variance table shows BOM vs actual consumption

4. **Operations Tab**
   - Select WO-2024-009 from dropdown
   - Verify operations table shows 4 operations with weights and yields

5. **Trace Tab**
   - Search for "LP-2024-001" (forward trace)
   - Search for "LP-2024-013" (backward trace)
   - Verify trace tree shows genealogy

### Warehouse Page Tests
1. **GRN Table**
   - View GRNs with received items
   - Test GRN details modal

2. **License Plates Table**
   - View LPs in various statuses
   - Test LP operations (split, transfer, etc.)

## Test Scenarios

### Scenario 1: Complete Production Flow
**Flow**: PO-2024-001 → GRN-2024-001 → LP-2024-001 → WO-2024-009 → LP-2024-013

**Test Steps**:
1. View PO-2024-001 details (confirmed status)
2. View GRN-2024-001 (received status, linked to PO)
3. View LP-2024-001 (available, passed QA)
4. View WO-2024-009 (completed, consumed LP-2024-001)
5. View LP-2024-013 (finished good from WO-2024-009)
6. Test forward trace from LP-2024-001
7. Test backward trace from LP-2024-013

### Scenario 2: Multi-Stage Production
**Flow**: LP-2024-005 → WO-2024-010 → LP-2024-015

**Test Steps**:
1. Verify LP-2024-005 (raw material)
2. Verify WO-2024-010 consumed LP-2024-005
3. Verify LP-2024-015 created from WO-2024-010
4. Test traceability chain

### Scenario 3: Warehouse Operations
**Flow**: TO-2024-001 transfers materials between warehouses

**Test Steps**:
1. View TO-2024-001 details
2. Check stock moves for transfer operations
3. Verify LP locations updated

### Scenario 4: QA Processes
**Flow**: LP-2024-017 in quarantine

**Test Steps**:
1. View LP-2024-017 (quarantine status)
2. Test QA status change operations

## Troubleshooting

### Common Issues

1. **Migration Errors**
   - Check if tables already exist
   - Verify foreign key constraints
   - Run migrations in exact order

2. **Seed Data Errors**
   - Check for duplicate IDs
   - Verify foreign key references exist
   - Check data type compatibility

3. **API Errors**
   - Verify environment variables
   - Check Supabase connection
   - Review API endpoint logs

4. **UI Issues**
   - Check browser console for errors
   - Verify modal data loading
   - Test with different browsers

### Verification Queries

```sql
-- Check for data integrity issues
SELECT 'Products without BOMs' as issue, COUNT(*) as count
FROM products p
LEFT JOIN boms b ON p.id = b.product_id
WHERE p.type = 'FG' AND b.id IS NULL

UNION ALL

SELECT 'WOs without routings', COUNT(*)
FROM work_orders wo
LEFT JOIN routings r ON wo.product_id = r.product_id
WHERE wo.status IN ('released', 'in_progress', 'completed') AND r.id IS NULL

UNION ALL

SELECT 'LPs without genealogy', COUNT(*)
FROM license_plates lp
LEFT JOIN lp_genealogy lg ON lp.id = lg.child_lp_id
WHERE lp.status = 'available' AND lp.type IN ('PR', 'FG') AND lg.id IS NULL;
```

## Expected Results

After successful implementation:

✅ **Planning Module**: All PO/TO/WO tables populated with realistic data
✅ **Production Module**: Yield reports, consume reports, operations, and traceability functional
✅ **Warehouse Module**: GRN processing, license plate management, stock moves operational
✅ **Traceability**: Forward and backward trace working across production chain
✅ **UI Navigation**: All modal buttons functional, tab navigation working
✅ **Backend APIs**: All endpoints returning data from seeded database

## Next Steps

1. Test all features thoroughly
2. Create additional test scenarios as needed
3. Document any issues found
4. Update TODO.md with completion status
5. Consider adding more test data for edge cases

## Support

If you encounter issues:
1. Check Supabase logs for SQL errors
2. Verify all migrations applied successfully
3. Run verification queries to identify problems
4. Check API endpoint responses
5. Review browser console for frontend errors
