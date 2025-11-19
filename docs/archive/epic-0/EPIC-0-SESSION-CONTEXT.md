# Epic 0 Session Context

**Last Updated**: 2025-11-18
**Purpose**: Load this file when context overflows to continue Epic 0 work

---

## Current State

### Completed:
- [x] RLS policies fixed for INSERT operations
- [x] `routing_operation_names.ts` - removed `updated_at` from update()
- [x] Multiple missing columns added to tables
- [x] TypeScript types regenerated (`pnpm gen-types`)
- [x] Outdated documentation deleted

### In Progress:
- [ ] API class audit and alignment with database schema

### Blocked:
- Supabase Management API returning 500 errors
- Direct database connection timing out (network issues)

---

## API Files Location

All API files are in: `apps/frontend/lib/api/`

### Core Settings APIs (8 files)
```
warehouses.ts          → warehouses
locations.ts           → locations
suppliers.ts           → suppliers
machines.ts            → machines
productionLines.ts     → production_lines
allergens.ts           → allergens
taxCodes.ts            → tax_codes
users.ts               → users
```

### Technical Module APIs (5 files)
```
products.ts            → products, product_allergens
products.createSingle.ts
products.createComposite.ts
products.server.ts
boms.ts                → boms, bom_items
bomHistory.ts          → bom_history
routings.ts            → routings, routing_operations
routingOperationNames.ts → routing_operation_names
```

### Planning Module APIs (5 files)
```
purchaseOrders.ts      → po_header, po_line, po_correction
transferOrders.ts      → to_header, to_line
workOrders.ts          → work_orders, wo_materials, wo_operations
woSnapshot.ts          → wo_materials, wo_operations
woTemplates.ts         → wo_templates
```

### Warehouse Module APIs (4 files)
```
asns.ts                → asns, asn_items
grns.ts                → grns, grn_items
licensePlates.ts       → license_plates, lp_compositions, lp_genealogy, lp_reservations
pallets.ts             → pallets, pallet_items
```

### Production Module APIs (3 files)
```
consume.ts             → license_plates, lp_genealogy
yield.ts               → production_outputs
costs.ts               → bom_costs, wo_costs
```

### Other APIs (4 files)
```
audit.ts               → audit_log
traceability.ts        → lp_genealogy
npdProjects.ts         → (NPD tables)
config.ts              → (configuration)
index.ts               → (exports)
```

---

## Database Tables (48 in generated.types.ts)

### Verified Working (INSERT tested):
- [x] warehouses
- [x] suppliers
- [x] allergens
- [x] machines
- [x] locations
- [x] routings
- [x] tax_codes
- [x] production_lines
- [x] boms
- [x] work_orders
- [x] po_header
- [x] to_header
- [x] license_plates
- [x] asns
- [x] products

### Not Yet Tested:
- [ ] asn_items
- [ ] audit_log
- [ ] bom_costs
- [ ] bom_history
- [ ] bom_items
- [ ] grn_items
- [ ] grns
- [ ] lp_compositions
- [ ] lp_genealogy
- [ ] lp_reservations
- [ ] organizations
- [ ] pallet_items
- [ ] pallets
- [ ] po_correction
- [ ] po_line
- [ ] product_allergens
- [ ] production_outputs
- [ ] routing_operation_names
- [ ] routing_operations
- [ ] sessions
- [ ] settings
- [ ] stock_moves
- [ ] to_line
- [ ] users
- [ ] warehouse_settings
- [ ] wo_by_products
- [ ] wo_costs
- [ ] wo_materials
- [ ] wo_operations
- [ ] wo_reservations

---

## Known Issues

### API Issues to Fix:

1. **routings.ts** (line ~124, ~242)
   - CREATE fails with RLS policy violation
   - routing_operations missing 'code' column

2. **General pattern issues**:
   - APIs using `updated_at` when table doesn't have it
   - APIs using wrong column names (e.g., `qty` vs `quantity`)
   - APIs not including required fields (e.g., `org_id`, `warehouse_id`)

### Column Name Mismatches Found:
- `qty_planned` → should be `planned_qty` (work_orders)
- `qty` → should be `quantity` (license_plates)
- `from_wh_id` → should be `from_warehouse_id` (to_header)
- `to_wh_id` → should be `to_warehouse_id` (to_header)

### Enum Values:
- `bom_status`: "Draft" | "Active" | "Phased Out" | "Inactive"
- `wo_status`: check generated.types.ts
- `lp_status`: check generated.types.ts

---

## Audit Approach

### For each API file:

1. **Read the API file**
2. **Compare with generated.types.ts** for that table
3. **Check each CRUD operation**:
   - getAll - column names in select
   - getById - column names in select
   - create - all required fields, correct column names
   - update - no non-existent columns (like updated_at)
   - delete - correct approach (soft vs hard)

### Common fixes needed:
```typescript
// WRONG
.update({ ...data, updated_at: new Date().toISOString() })

// CORRECT
.update(data)
```

```typescript
// WRONG - missing required field
.insert({ name: 'Test' })

// CORRECT
.insert({ name: 'Test', org_id: 1 })
```

---

## Commands Reference

```bash
# Generate types from database
pnpm gen-types

# Type check
pnpm type-check

# Update documentation
pnpm docs:update

# Run tests
pnpm test:e2e:critical

# Build
pnpm build
```

---

## Architecture.md vs Database

The authoritative schema section in `architecture.md` starts at line 6476.

To verify a table, compare:
1. `architecture.md` CREATE TABLE statement
2. `generated.types.ts` table definition
3. Actual API usage

If they don't match, **generated.types.ts is the source of truth** (reflects actual database).

---

## Next Steps

1. **Read each API file systematically**
2. **Compare with generated.types.ts**
3. **Fix column name mismatches**
4. **Remove non-existent columns from operations**
5. **Add missing required fields**
6. **Test CRUD operations**
7. **Mark as complete in EPIC-0-DATABASE-API-ALIGNMENT.md**

Start with: `warehouses.ts` → `locations.ts` → `suppliers.ts` → ...

---

## Files to Reference

- `apps/frontend/lib/supabase/generated.types.ts` - Database schema (SOURCE OF TRUTH)
- `apps/frontend/lib/api/*.ts` - API implementations
- `apps/frontend/lib/types.ts` - Frontend TypeScript types
- `docs/EPIC-0-DATABASE-API-ALIGNMENT.md` - Full audit checklist
- `docs/architecture.md` - Architecture documentation (line 6476+ for schema)
