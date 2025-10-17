<!-- c03f15d2-2971-4e39-a47f-75adf0e989ea 82f33579-2c45-46ed-820a-2ef5527cf404 -->
# Fix UI Navigation & Seed Database

## Problem Analysis

**Issue 1: Non-working Bookmarks/Navigation**

- Action buttons (View Details, Edit, Delete) in tables work, but modals likely not receiving data correctly
- Tab navigation between views (Work Orders, Yield, Consume, Operations, Trace) is functional
- Root cause: App is using mock data from `clientState.ts` instead of real database

**Issue 2: No Database Data**

- Supabase is configured: `https://pgroxddbtaevdegnidaz.supabase.co`
- 18 migration files exist but database is empty
- Need comprehensive seed data for all flows

## Implementation Plan

### Phase 1: Verify & Fix UI Issues

**1.1 Check Modal Data Flow**

- Review `PurchaseOrderDetailsModal.tsx` line 39: `const po = allPurchaseOrders.find(p => p.id === purchaseOrderId)`
- Review `WorkOrderDetailsModal.tsx` line 62: `const workOrder = workOrders.find(wo => wo.id === workOrderId.toString())`
- Issue: ID type mismatch - `purchaseOrderId` is number but comparing with number, `workOrderId` is number but comparing with string
- Fix ID type conversions in modal lookups

**1.2 Fix TransferOrderDetailsModal**

- Same pattern exists in `TransferOrderDetailsModal.tsx`
- Ensure consistent ID handling across all modals

**1.3 Test Tab Navigation**

- Verify all tabs (Yield, Consume, Operations, Trace) render correctly
- Check that state management for active tab works

### Phase 2: Apply Database Migrations

**2.1 Run All Migrations in Order**

Files to execute in Supabase SQL Editor:

```
001_planning_tables.sql
002_rls_policies.sql
003_phase14_schema.sql
004_phase14_rpc_functions.sql
005_product_taxonomy_enums.sql
006_tax_allergens.sql
007_supplier_products.sql
008_bom_routing.sql
009_routing_requirements.sql
010_production_enums.sql
011_work_orders_enhancement.sql
012_license_plates_enhancement.sql
013_stock_moves_enhancement.sql
014_production_outputs.sql
015_wo_operations_enhancement.sql
016_lp_numbering_trigger.sql
017_qa_gate_policies.sql
018_yield_views.sql
```

### Phase 3: Create Comprehensive Seed Script

**3.1 Create `seed_database.sql`**

Structure:

```sql
-- SECTION 1: Master Data
-- Suppliers (5 suppliers)
-- Warehouses (3 warehouses: Main, Cold Storage, Production Floor)
-- Locations (15 locations across warehouses)
-- Tax Codes (3: Standard 20%, Reduced 5%, Zero 0%)
-- Allergens (14 common allergens)

-- SECTION 2: Equipment
-- Machines (5 production lines: Grinder, Mixer, Sausage Line, Packaging, Labeling)

-- SECTION 3: Products
-- Raw Materials (10 items: Beef, Pork, Salt, Pepper, Spices, etc.)
-- Intermediate Products (5 items: Ground Meat, Seasoned Mix, etc.)
-- Finished Goods (8 items: Sausages, Burgers, etc.)
-- Link products to allergens

-- SECTION 4: BOMs & Routings
-- 8 BOMs (one per finished good)
-- Each BOM has 3-6 components
-- 8 Routings with 3-5 operations each
-- Link materials to production lines

-- SECTION 5: Supplier Products
-- Link raw materials to suppliers
-- Set prices, MOQ, lead times

-- SECTION 6: Planning Data
-- Purchase Orders (5 POs in various states)
-- PO Items (3-5 items per PO)
-- Transfer Orders (3 TOs between warehouses)
-- TO Items (2-4 items per TO)

-- SECTION 7: Production Data
-- Work Orders (10 WOs in various states)
-- 2 planned, 3 released, 3 in_progress, 2 completed
-- WO Operations (matching routing operations)
-- Production Outputs (for completed WOs)

-- SECTION 8: Warehouse Data
-- GRNs (3 GRNs linked to POs)
-- License Plates (20 LPs with various stages)
-- Stock on hand across locations
-- Stock Moves (15 moves: receipts, transfers, consumption)

-- SECTION 9: Traceability Chain
-- Link LPs to GRNs (inputs)
-- Link LPs to WOs (production)
-- Link Production Outputs to LPs (outputs)
-- Create genealogy for forward/backward trace
```

**3.2 Create Realistic Test Scenarios**

Scenario 1: Complete Production Flow

- PO-001 → GRN-001 → LP-001 (Raw Beef)
- WO-001 (Beef Sausage) consumes LP-001
- Creates LP-010 (Finished Sausage)
- Traceable forward and backward

Scenario 2: Multi-Stage Production

- LP-002 (Pork) → WO-002 (Ground Pork) → LP-011 (PR stage)
- LP-011 → WO-003 (Pork Burger) → LP-012 (FG stage)
- 2-level traceability

Scenario 3: Warehouse Operations

- TO-001: Transfer from Main → Cold Storage
- Stock moves show material flow
- LPs in various QA states

### Phase 4: Execute Seed Script

**4.1 Run Seed Script**

- Execute `seed_database.sql` in Supabase
- Verify all tables populated
- Check foreign key relationships

**4.2 Verify Data Integrity**

- Run test queries for each module
- Check traceability queries work
- Verify yield calculation views return data

### Phase 5: Test Backend APIs

**5.1 Test Production APIs**

- `/api/production/yield/pr` - Should return PR yield data
- `/api/production/yield/fg` - Should return FG yield data
- `/api/production/consume` - Should return material consumption
- `/api/production/work-orders/:id` - Should return WO details
- `/api/production/trace/forward` - Should return trace tree
- `/api/production/trace/backward` - Should return trace tree

**5.2 Test Planning APIs**

- Fetch work orders, purchase orders, transfer orders
- Test modal data loading
- Verify all CRUD operations

**5.3 Test Warehouse APIs**

- GRN operations
- License plate operations
- Stock move queries

### Phase 6: Update Frontend to Use Real Data

**6.1 Disable Mock Data**

- Verify `API_CONFIG.useMockData` defaults to false
- Ensure Supabase client is properly configured
- Test that `clientState.ts` falls back to Supabase when no mock data

**6.2 Test All UI Features**

- Planning page: PO/TO/WO tables and modals
- Production page: All tabs (Work Orders, Yield, Consume, Operations, Trace)
- Warehouse page: GRN, LP operations
- Scanner page: Barcode operations

### Phase 7: Documentation

**7.1 Create `SEED_DATA_GUIDE.md`**

- Document all seed data entities
- Explain test scenarios
- Provide sample queries for testing

**7.2 Update TODO.md**

- Mark completed items
- Document any remaining issues

## Expected Outcomes

1. ✅ All modal buttons work correctly (View Details, Edit)
2. ✅ Database populated with realistic test data
3. ✅ All production flows testable end-to-end
4. ✅ Traceability working (forward and backward)
5. ✅ Yield reports showing data
6. ✅ Consume reports showing variance
7. ✅ All warehouse operations functional
8. ✅ Planning features fully operational

## Files to Modify

- `apps/frontend/components/PurchaseOrderDetailsModal.tsx` - Fix ID lookup
- `apps/frontend/components/WorkOrderDetailsModal.tsx` - Fix ID lookup  
- `apps/frontend/components/TransferOrderDetailsModal.tsx` - Fix ID lookup
- `apps/frontend/lib/supabase/migrations/seed_database.sql` - NEW FILE
- `SEED_DATA_GUIDE.md` - NEW FILE (root directory)

### To-dos

- [ ] Fix ID type mismatches in PurchaseOrderDetailsModal, WorkOrderDetailsModal, and TransferOrderDetailsModal
- [ ] Apply all 18 database migration files to Supabase in correct order
- [ ] Create comprehensive seed_database.sql with 5 suppliers, 3 warehouses, 23 products, 8 BOMs, 10 WOs, 5 POs, 3 TOs, 3 GRNs, 20 LPs
- [ ] Run seed script in Supabase and verify data integrity
- [ ] Test all backend API endpoints (production, planning, warehouse) with seeded data
- [ ] Test all UI features: Planning (PO/TO/WO modals), Production (Yield/Consume/Operations/Trace), Warehouse (GRN/LP)
- [ ] Create SEED_DATA_GUIDE.md documenting all test scenarios and sample queries