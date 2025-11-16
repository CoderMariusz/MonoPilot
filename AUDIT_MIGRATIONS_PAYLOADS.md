# Full Database Schema & API Payload Audit
**Date:** 2025-11-16
**Purpose:** Verify all database schemas match API payloads and RLS policies exist

## Audit Methodology

### Tables Audited (52 total)
1. allergens
2. asn_items
3. asns
4. audit_log
5. bom_costs
6. bom_history
7. bom_items
8. boms
9. grn_items
10. grns
11. license_plates
12. locations
13. lp_compositions
14. lp_genealogy
15. lp_reservations
16. machines
17. material_costs
18. npd_costing
19. npd_documents
20. npd_events
21. npd_formulation_items
22. npd_formulations
23. npd_projects
24. npd_risks
25. pallet_items
26. pallets
27. pgaudit_log
28. po_correction
29. po_header
30. po_line
31. product_allergens
32. product_prices
33. production_lines
34. production_outputs
35. products
36. routing_operation_names
37. routing_operations
38. routings
39. settings_tax_codes
40. settings_warehouse
41. stock_moves
42. suppliers
43. to_header
44. to_line
45. users
46. warehouse_settings
47. warehouses
48. wo_by_products
49. wo_costs
50. wo_materials
51. wo_operations
52. work_orders

### API Files (33 total)
1. allergens.ts
2. asns.ts
3. audit.ts
4. bomHistory.ts
5. boms.ts
6. consume.ts
7. costs.ts
8. grns.ts
9. licensePlates.ts
10. locations.ts
11. machines.ts
12. npdProjects.ts
13. pallets.ts
14. productionLines.ts
15. products.ts
16. purchaseOrders.ts
17. routingOperationNames.ts
18. routings.ts
19. suppliers.ts
20. taxCodes.ts
21. transferOrders.ts
22. users.ts
23. warehouses.ts
24. workOrders.ts
25. woTemplates.ts
26. yield.ts

---

## Audit Results

### Phase 1: Settings Tables (Priority - User Reported Issues)

| Table | API File | Schema Check | Payload Check | RLS Policy | Status |
|-------|----------|--------------|---------------|------------|--------|
| routing_operation_names | routingOperationNames.ts | ✅ | ⚠️ FIXED | ❌ MISSING | FIXED CODE |
| settings_tax_codes | taxCodes.ts | ✅ | ⚠️ FIXED | ❌ MISSING | FIXED CODE |
| warehouses | warehouses.ts | ✅ | ⚠️ FIXED | ❌ MISSING | FIXED CODE |
| locations | locations.ts | 🔍 PENDING | 🔍 PENDING | ❌ MISSING | AUDIT NEEDED |
| suppliers | suppliers.ts | 🔍 PENDING | 🔍 PENDING | ❌ MISSING | AUDIT NEEDED |
| allergens | allergens.ts | 🔍 PENDING | 🔍 PENDING | ❌ MISSING | AUDIT NEEDED |
| machines | machines.ts | 🔍 PENDING | 🔍 PENDING | ❌ MISSING | AUDIT NEEDED |
| production_lines | productionLines.ts | 🔍 PENDING | 🔍 PENDING | ❌ MISSING | AUDIT NEEDED |

### Phase 2: Core Transaction Tables

| Table | API File | Schema Check | Payload Check | RLS Policy | Status |
|-------|----------|--------------|---------------|------------|--------|
| products | products.ts | 🔍 PENDING | 🔍 PENDING | 🔍 PENDING | AUDIT NEEDED |
| boms | boms.ts | 🔍 PENDING | 🔍 PENDING | 🔍 PENDING | AUDIT NEEDED |
| po_header | purchaseOrders.ts | 🔍 PENDING | 🔍 PENDING | 🔍 PENDING | AUDIT NEEDED |
| po_line | purchaseOrders.ts | 🔍 PENDING | 🔍 PENDING | 🔍 PENDING | AUDIT NEEDED |
| to_header | transferOrders.ts | 🔍 PENDING | 🔍 PENDING | 🔍 PENDING | AUDIT NEEDED |
| to_line | transferOrders.ts | 🔍 PENDING | 🔍 PENDING | 🔍 PENDING | AUDIT NEEDED |
| work_orders | workOrders.ts | 🔍 PENDING | 🔍 PENDING | 🔍 PENDING | AUDIT NEEDED |
| wo_materials | workOrders.ts | 🔍 PENDING | 🔍 PENDING | 🔍 PENDING | AUDIT NEEDED |
| wo_operations | workOrders.ts | 🔍 PENDING | 🔍 PENDING | 🔍 PENDING | AUDIT NEEDED |

### Phase 3: Warehouse & Inventory Tables

| Table | API File | Schema Check | Payload Check | RLS Policy | Status |
|-------|----------|--------------|---------------|------------|--------|
| license_plates | licensePlates.ts | 🔍 PENDING | 🔍 PENDING | 🔍 PENDING | AUDIT NEEDED |
| asns | asns.ts | 🔍 PENDING | 🔍 PENDING | 🔍 PENDING | AUDIT NEEDED |
| asn_items | asns.ts | 🔍 PENDING | 🔍 PENDING | 🔍 PENDING | AUDIT NEEDED |
| grns | grns.ts | 🔍 PENDING | 🔍 PENDING | 🔍 PENDING | AUDIT NEEDED |
| grn_items | grns.ts | 🔍 PENDING | 🔍 PENDING | 🔍 PENDING | AUDIT NEEDED |
| pallets | pallets.ts | 🔍 PENDING | 🔍 PENDING | 🔍 PENDING | AUDIT NEEDED |
| stock_moves | (none) | 🔍 PENDING | ❌ NO API | 🔍 PENDING | NO API FILE |

### Phase 4: NPD Module Tables (New)

| Table | API File | Schema Check | Payload Check | RLS Policy | Status |
|-------|----------|--------------|---------------|------------|--------|
| npd_projects | npdProjects.ts | 🔍 PENDING | 🔍 PENDING | ✅ EXISTS | AUDIT NEEDED |
| npd_formulations | (none) | 🔍 PENDING | ❌ NO API | ✅ EXISTS | NO API FILE |
| npd_formulation_items | (none) | 🔍 PENDING | ❌ NO API | ✅ EXISTS | NO API FILE |
| npd_documents | (none) | 🔍 PENDING | ❌ NO API | ✅ EXISTS | NO API FILE |
| npd_events | (none) | 🔍 PENDING | ❌ NO API | ✅ EXISTS | NO API FILE |
| npd_risks | (none) | 🔍 PENDING | ❌ NO API | ✅ EXISTS | NO API FILE |
| npd_costing | (none) | 🔍 PENDING | ❌ NO API | ✅ EXISTS | NO API FILE |

### Phase 5: Support Tables

| Table | API File | Schema Check | Payload Check | RLS Policy | Status |
|-------|----------|--------------|---------------|------------|--------|
| routings | routings.ts | 🔍 PENDING | 🔍 PENDING | 🔍 PENDING | AUDIT NEEDED |
| routing_operations | routings.ts | 🔍 PENDING | 🔍 PENDING | 🔍 PENDING | AUDIT NEEDED |
| bom_history | bomHistory.ts | 🔍 PENDING | 🔍 PENDING | 🔍 PENDING | AUDIT NEEDED |
| audit_log | audit.ts | 🔍 PENDING | 🔍 PENDING | 🔍 PENDING | AUDIT NEEDED |
| users | users.ts | 🔍 PENDING | 🔍 PENDING | 🔍 PENDING | AUDIT NEEDED |

---

## Detailed Findings

### ✅ FIXED Issues

#### 1. routing_operation_names (400 Error)
- **Problem:** API trying to insert `alias` column that doesn't exist in DB
- **DB Schema (generated.types):** id, name, description, is_active
- **API Was Sending:** name, alias, description, is_active
- **Fix Applied:** Removed `alias` from API payload and TypeScript types
- **Files Changed:**
  - `apps/frontend/lib/api/routingOperationNames.ts` (lines 66-70, 4-14)
  - `apps/frontend/lib/types.ts` (lines 931-936)

#### 2. settings_tax_codes (400 Error)
- **Problem:** API sending `name` instead of `description`
- **DB Schema (generated.types):** code, description, rate, is_active, created_at
- **API Was Sending:** code, name, rate, is_active
- **Fix Applied:** Changed `name` → `description` in API payload and types
- **Files Changed:**
  - `apps/frontend/lib/api/taxCodes.ts` (lines 34-44)
  - `apps/frontend/lib/types.ts` (lines 865-872)

#### 3. warehouses (Type Mismatch)
- **Problem:** TypeScript types missing `address` and `type` columns
- **DB Schema (generated.types):** code, name, address, type, is_active, created_at, updated_at
- **TypeScript Had:** code, name, is_active, created_at, updated_at
- **Fix Applied:** Added `address` and `type` to TypeScript interface
- **Files Changed:**
  - `apps/frontend/lib/types.ts` (lines 659-668)

### ❌ CRITICAL: Missing RLS Policies

All Settings tables have RLS ENABLED but NO POLICIES applied:
- warehouses
- locations
- settings_tax_codes
- allergens
- machines
- production_lines
- suppliers
- routing_operation_names

**Migration Created:** `107_fix_settings_rls_policies.sql`
**Status:** Ready to apply manually via Supabase Dashboard

---

## Next Steps

### Immediate Actions Required:
1. ✅ Apply migration 107 (RLS policies) - **MANUAL ACTION REQUIRED**
2. 🔍 Continue systematic audit of remaining tables (Phases 2-5)
3. 🔍 Check all API create() methods against DB Insert types
4. 🔍 Verify RLS policies exist for all business tables

### Audit Progress:
- Phase 1 (Settings): **3/8 complete** (37.5%)
- Phase 2 (Core Transactions): **0/9 complete** (0%)
- Phase 3 (Warehouse): **0/7 complete** (0%)
- Phase 4 (NPD): **0/7 complete** (0%)
- Phase 5 (Support): **0/5 complete** (0%)

**Total Progress: 3/36 tables audited (8.3%)**

---

## Audit Checklist Template

For each table, verify:
- [ ] Table exists in generated.types.ts
- [ ] Corresponding API file exists (if CRUD needed)
- [ ] API.create() payload matches DB Insert type exactly
- [ ] All required fields are included
- [ ] No extra fields that don't exist in DB
- [ ] RLS policy exists (check raw_migrations_all.sql)
- [ ] TypeScript interface in types.ts matches DB Row type

---

*This is a living document - will be updated as audit progresses*
