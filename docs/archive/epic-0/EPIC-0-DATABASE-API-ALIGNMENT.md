# Epic 0: Database & API Alignment Audit

**Priority**: P0 - BLOCKER
**Status**: IN PROGRESS
**Created**: 2025-11-18

## Problem Statement

Critical mismatches exist between:
- Database schema (source of truth)
- Generated TypeScript types (`generated.types.ts`)
- API class implementations
- Frontend components

This causes runtime errors across all CRUD operations.

## Approach

```
Database Schema (SOURCE OF TRUTH)
       ↓
generated.types.ts (auto-generated via pnpm gen-types)
       ↓
API Classes (MUST ALIGN with generated types)
       ↓
Frontend Components
```

---

## Phase 1: RLS Policy Fixes

All tables need INSERT policies with `WITH CHECK (true)` for service_role.

```sql
-- Run this for all tables
DO $$ DECLARE t text; BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I_insert ON public.%I', t, t);
    EXECUTE format('CREATE POLICY %I_insert ON public.%I FOR INSERT WITH CHECK (true)', t, t);
  END LOOP;
END $$;
```

---

## Phase 2: API Class Audit Checklist

### Legend
- [ ] Not started
- [x] Completed
- [!] Has issues

### Core Settings APIs

| API File | Table(s) | getAll | getById | create | update | delete | Status |
|----------|----------|--------|---------|--------|--------|--------|--------|
| `warehouses.ts` | warehouses | [ ] | [ ] | [ ] | [ ] | [ ] | |
| `locations.ts` | locations | [ ] | [ ] | [ ] | [ ] | [ ] | |
| `suppliers.ts` | suppliers | [ ] | [ ] | [ ] | [ ] | [ ] | |
| `machines.ts` | machines | [ ] | [ ] | [ ] | [ ] | [ ] | |
| `productionLines.ts` | production_lines | [ ] | [ ] | [ ] | [ ] | [ ] | |
| `allergens.ts` | allergens | [ ] | [ ] | [ ] | [ ] | [ ] | |
| `taxCodes.ts` | tax_codes | [ ] | [ ] | [ ] | [ ] | [ ] | |
| `users.ts` | users | [ ] | [ ] | [ ] | [ ] | [ ] | |

### Technical Module APIs

| API File | Table(s) | getAll | getById | create | update | delete | Status |
|----------|----------|--------|---------|--------|--------|--------|--------|
| `products.ts` | products, product_allergens | [ ] | [ ] | [ ] | [ ] | [ ] | |
| `boms.ts` | boms, bom_items | [ ] | [ ] | [ ] | [ ] | [ ] | |
| `bomHistory.ts` | bom_history | [ ] | [ ] | [ ] | [ ] | [ ] | |
| `routings.ts` | routings, routing_operations | [ ] | [ ] | [ ] | [ ] | [ ] | BROKEN |
| `routingOperationNames.ts` | routing_operation_names | [ ] | [ ] | [ ] | [x] | [ ] | FIXED |

### Planning Module APIs

| API File | Table(s) | getAll | getById | create | update | delete | Status |
|----------|----------|--------|---------|--------|--------|--------|--------|
| `purchaseOrders.ts` | po_header, po_line | [ ] | [ ] | [ ] | [ ] | [ ] | |
| `transferOrders.ts` | to_header, to_line | [ ] | [ ] | [ ] | [ ] | [ ] | |
| `workOrders.ts` | work_orders, wo_materials, wo_operations | [ ] | [ ] | [ ] | [ ] | [ ] | |
| `woSnapshot.ts` | wo_materials, wo_operations | [ ] | [ ] | [ ] | [ ] | [ ] | |
| `woTemplates.ts` | (templates) | [ ] | [ ] | [ ] | [ ] | [ ] | |

### Warehouse Module APIs

| API File | Table(s) | getAll | getById | create | update | delete | Status |
|----------|----------|--------|---------|--------|--------|--------|--------|
| `asns.ts` | asns, asn_items | [ ] | [ ] | [ ] | [ ] | [ ] | |
| `grns.ts` | grns, grn_items | [ ] | [ ] | [ ] | [ ] | [ ] | |
| `licensePlates.ts` | license_plates, lp_compositions, lp_genealogy | [ ] | [ ] | [ ] | [ ] | [ ] | |
| `pallets.ts` | pallets, pallet_items | [ ] | [ ] | [ ] | [ ] | [ ] | |

### Production Module APIs

| API File | Table(s) | getAll | getById | create | update | delete | Status |
|----------|----------|--------|---------|--------|--------|--------|--------|
| `consume.ts` | license_plates, lp_genealogy | [ ] | [ ] | [ ] | [ ] | [ ] | |
| `yield.ts` | production_outputs | [ ] | [ ] | [ ] | [ ] | [ ] | |
| `costs.ts` | bom_costs, wo_costs | [ ] | [ ] | [ ] | [ ] | [ ] | |

### Other APIs

| API File | Table(s) | getAll | getById | create | update | delete | Status |
|----------|----------|--------|---------|--------|--------|--------|--------|
| `audit.ts` | audit_log | [ ] | [ ] | [ ] | [ ] | [ ] | |
| `traceability.ts` | lp_genealogy | [ ] | [ ] | [ ] | [ ] | [ ] | |
| `npdProjects.ts` | (NPD tables) | [ ] | [ ] | [ ] | [ ] | [ ] | |

---

## Phase 3: Database Tables (48 total)

### Tables with corresponding API classes
- [x] allergens
- [ ] asn_items
- [ ] asns
- [ ] audit_log
- [ ] bom_costs
- [ ] bom_history
- [ ] bom_items
- [ ] boms
- [ ] grn_items
- [ ] grns
- [ ] license_plates
- [ ] locations
- [ ] lp_compositions
- [ ] lp_genealogy
- [ ] lp_reservations
- [ ] machines
- [ ] organizations
- [ ] pallet_items
- [ ] pallets
- [ ] po_correction
- [ ] po_header
- [ ] po_line
- [ ] product_allergens
- [ ] production_lines
- [ ] production_outputs
- [ ] products
- [ ] routing_operation_names
- [ ] routing_operations
- [ ] routings
- [ ] sessions
- [ ] settings
- [ ] stock_moves
- [ ] suppliers
- [ ] tax_codes
- [ ] to_header
- [ ] to_line
- [ ] users
- [ ] warehouse_settings
- [ ] warehouses
- [ ] wo_by_products
- [ ] wo_costs
- [ ] wo_materials
- [ ] wo_operations
- [ ] wo_reservations
- [ ] work_orders

---

## Phase 4: Common Issues to Check

For each API, verify:

### 1. Column Name Mismatches
```typescript
// WRONG - column doesn't exist
.update({ qty_planned: 100 })

// CORRECT - use actual column name
.update({ planned_qty: 100 })
```

### 2. Missing Required Columns
```typescript
// WRONG - missing required field
.insert({ name: 'Test' })

// CORRECT - include all NOT NULL fields
.insert({ name: 'Test', org_id: 1, warehouse_id: 6 })
```

### 3. Unused timestamp columns
```typescript
// WRONG - column doesn't exist in table
.update({ ...data, updated_at: new Date().toISOString() })

// CORRECT - only use columns that exist
.update(data)
```

### 4. Enum value mismatches
```typescript
// WRONG - lowercase
status: 'active'

// CORRECT - match exact enum value
status: 'Active'
```

---

## Phase 5: Documentation Cleanup

### Files to DELETE (outdated/incorrect):
- [ ] `docs/API_DOCUMENTATION.md` - replaced by API_REFERENCE.md
- [ ] `docs/SCHEMA_GENERATION*.md` - no longer relevant
- [ ] `docs/TEST_ENVIRONMENT_REPORT_2025-11-12.md` - outdated
- [ ] `docs/architecture-schema-extracted.md` - outdated
- [ ] `docs/architecture-validation-report.md` - outdated

### Files to REGENERATE after fixes:
- [ ] `docs/API_REFERENCE.md` - run `pnpm docs:update`
- [ ] `docs/DATABASE_SCHEMA.md` - run `pnpm docs:update`
- [ ] `docs/DATABASE_RELATIONSHIPS.md` - run `pnpm docs:update`

### Files to UPDATE:
- [ ] `CLAUDE.md` - update with current state
- [ ] `docs/TECHNICAL_DEBT_TODO.md` - add Epic 0 items

---

## Execution Order

### Step 1: Fix RLS Policies (30 min)
Run SQL to fix all INSERT policies

### Step 2: Audit Core Settings APIs (2-3 hours)
- warehouses, locations, suppliers, machines
- productionLines, allergens, taxCodes, users

### Step 3: Audit Technical Module APIs (3-4 hours)
- products, boms, bomHistory
- routings, routingOperationNames

### Step 4: Audit Planning Module APIs (3-4 hours)
- purchaseOrders, transferOrders
- workOrders, woSnapshot, woTemplates

### Step 5: Audit Warehouse Module APIs (2-3 hours)
- asns, grns
- licensePlates, pallets

### Step 6: Audit Production Module APIs (2 hours)
- consume, yield, costs

### Step 7: Audit Other APIs (1-2 hours)
- audit, traceability, npdProjects

### Step 8: Cleanup & Regenerate Docs (1 hour)
- Delete outdated docs
- Run `pnpm docs:update`
- Run `pnpm gen-types`
- Run `pnpm type-check`

---

## Success Criteria

- [ ] All CRUD operations work without errors
- [ ] `pnpm type-check` passes
- [ ] `pnpm build` succeeds
- [ ] E2E tests pass (`pnpm test:e2e:critical`)
- [ ] Documentation is accurate and up-to-date

---

## Notes

### Known Issues Fixed:
1. `routing_operation_names.ts` - removed `updated_at` from update()
2. RLS policies - changed to `WITH CHECK (true)`
3. Multiple missing columns added to tables

### Network Issues:
- Supabase Management API returning 500 errors
- Direct database connection timing out
- Use REST API for schema changes where possible
