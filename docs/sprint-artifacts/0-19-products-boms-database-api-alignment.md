# Story 0.19: Products & BOMs Database & API Alignment

**Priority:** P0 (CRITICAL - Data layer mismatch)
**Effort:** 21 SP (42 hours)
**Epic:** Epic 0 - P0 Data Integrity Fixes
**Status:** ready-for-dev

## Dev Agent Record

### Context Reference
- `docs/sprint-artifacts/0-19-products-boms-database-api-alignment.context.xml`

---

## Problem Statement

MASSIVE mismatch between database schema, API routes, and TypeScript types for Products, BOMs, and BOM Items. This is the most severe inconsistency across all modules - the types reference many fields that don't exist in the database, use wrong field names, and have incorrect data types.

### Products Analysis

**products - Current DB:**
```sql
id, org_id, sku, name, description, product_type, uom, supplier_id,
lead_time_days, shelf_life_days, is_active, created_at, updated_at
```

**Product TypeScript Interface Issues:**

| Field | Issue | DB Field |
|-------|-------|----------|
| `part_number` | WRONG NAME | `sku` |
| `type: 'RM'\|'DG'\|...` | NOT IN DB | - |
| `group: ProductGroup` | NOT IN DB | - |
| `product_group` | NOT IN DB | - |
| `subtype` | NOT IN DB | - |
| `category` | NOT IN DB | - |
| `moq` | NOT IN DB | - |
| `tax_code_id` | NOT IN DB | - |
| `std_price` | NOT IN DB | - |
| `expiry_policy` | NOT IN DB | - |
| `rate` | NOT IN DB | - |
| `production_lines` | NOT IN DB | - |
| `default_routing_id` | NOT IN DB | - |
| `boxes_per_pallet` | NOT IN DB | - |
| `packs_per_box` | NOT IN DB | - |
| Missing | - | `name` (separate from description!) |

### BOMs Analysis

**boms - Current DB:**
```sql
id, org_id, product_id, version INTEGER, name, status,
effective_from DATE, effective_to DATE, yield_qty, yield_uom, notes,
created_by, updated_by, created_at, updated_at
```

**Bom TypeScript Interface Issues:**

| Field | Issue | DB Field |
|-------|-------|----------|
| `version: string` | WRONG TYPE | `version INTEGER` |
| `status` enum values | WRONG VALUES | DB has Draft/Active/Phased Out/Inactive |
| `is_active` | NOT IN DB | - |
| `requires_routing` | NOT IN DB | - |
| `default_routing_id` | NOT IN DB | - |
| `line_id` | NOT IN DB | - |
| `archived_at` | NOT IN DB | - |
| `deleted_at` | NOT IN DB | - |
| Missing | - | `org_id`, `name`, `yield_qty`, `yield_uom` |

### BOM Items Analysis

**bom_items - Current DB:**
```sql
id, bom_id, material_id, quantity, uom, scrap_percent,
consume_whole_lp, sequence, notes, created_at, updated_at
```

**BomItem TypeScript Interface Issues:**

| Field | Issue | DB Field |
|-------|-------|----------|
| `scrap_std_pct` | WRONG NAME | `scrap_percent` |
| `priority` | NOT IN DB | - |
| `production_lines` | NOT IN DB | - |
| `production_line_restrictions` | NOT IN DB | - |
| `is_optional` | NOT IN DB | - |
| `is_phantom` | NOT IN DB | - |
| `unit_cost_std` | NOT IN DB | - |
| `tax_code_id` | NOT IN DB | - |
| `lead_time_days` | NOT IN DB | - |
| `moq` | NOT IN DB | - |
| `is_by_product` | NOT IN DB | - |
| Missing | - | `notes` |

---

## User Story

**As a** developer maintaining MonoPilot,
**I want** Products, BOMs, and BOM Items database schema, API routes, and types to be aligned,
**So that** Technical module CRUD operations work correctly for BOM management and product tracking.

---

## Acceptance Criteria

### AC1: Database Migration - Products
**Given** the current products table
**When** migration is applied
**Then** all missing columns are added for full feature support
**And** existing data is preserved

### AC2: Database Migration - BOMs
**Given** the current boms table
**When** migration is applied
**Then** all missing columns are added
**And** version type remains INTEGER (types must adjust)

### AC3: Database Migration - BOM Items
**Given** the current bom_items table
**When** migration is applied
**Then** all missing columns are added for conditional BOM support

### AC4: TypeScript Type Alignment
**Given** Product, Bom, BomItem interfaces
**When** comparing to DB schema
**Then** all field names match exactly
**And** all data types are correct
**And** phantom fields are removed or added to DB

### AC5: API Route Alignment
**Given** Technical module API routes
**When** performing CRUD operations
**Then** all column names match actual DB

### AC6: Backward Compatibility
**Given** existing products/BOMs data
**When** migration runs
**Then** existing records remain valid

---

## Technical Implementation

### Phase 1: Database Migration - Products

Create migration `090_products_boms_schema_alignment.sql`:

```sql
-- =============================================
-- PRODUCTS TABLE EXPANSION
-- =============================================

ALTER TABLE products
  -- Taxonomy fields
  ADD COLUMN IF NOT EXISTS type VARCHAR(10)
    CHECK (type IN ('RM', 'DG', 'PR', 'FG', 'WIP')),
  ADD COLUMN IF NOT EXISTS subtype VARCHAR(100),
  ADD COLUMN IF NOT EXISTS category VARCHAR(100),

  -- Planning & commercial
  ADD COLUMN IF NOT EXISTS moq DECIMAL(12,4),
  ADD COLUMN IF NOT EXISTS tax_code_id BIGINT REFERENCES tax_codes(id),
  ADD COLUMN IF NOT EXISTS std_price DECIMAL(12,4),
  ADD COLUMN IF NOT EXISTS expiry_policy VARCHAR(50)
    CHECK (expiry_policy IN ('DAYS_STATIC', 'FROM_MFG_DATE', 'FROM_DELIVERY_DATE', 'FROM_CREATION_DATE')),
  ADD COLUMN IF NOT EXISTS rate DECIMAL(12,4),

  -- Production
  ADD COLUMN IF NOT EXISTS production_lines TEXT[],
  ADD COLUMN IF NOT EXISTS default_routing_id BIGINT REFERENCES routings(id),
  ADD COLUMN IF NOT EXISTS requires_routing BOOLEAN DEFAULT false,

  -- Packaging
  ADD COLUMN IF NOT EXISTS boxes_per_pallet INTEGER,
  ADD COLUMN IF NOT EXISTS packs_per_box INTEGER,

  -- Versioning
  ADD COLUMN IF NOT EXISTS product_version VARCHAR(20) DEFAULT '1.0',

  -- Audit
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id);

-- Backfill type from product_type enum
UPDATE products
SET type = CASE
  WHEN product_type::text ILIKE '%raw%' THEN 'RM'
  WHEN product_type::text ILIKE '%finish%' THEN 'FG'
  WHEN product_type::text ILIKE '%wip%' THEN 'WIP'
  ELSE 'FG'
END
WHERE type IS NULL;

-- Note: DB uses 'sku' not 'part_number'
-- Types must use 'sku' field name

-- =============================================
-- BOMS TABLE EXPANSION
-- =============================================

ALTER TABLE boms
  -- Additional fields for full feature support
  ADD COLUMN IF NOT EXISTS requires_routing BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS default_routing_id BIGINT REFERENCES routings(id),
  ADD COLUMN IF NOT EXISTS line_id BIGINT[],
  ADD COLUMN IF NOT EXISTS boxes_per_pallet INTEGER,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Note: DB uses 'version INTEGER' not 'version VARCHAR'
-- Types must use number, not string for version

-- =============================================
-- BOM_ITEMS TABLE EXPANSION
-- =============================================

ALTER TABLE bom_items
  -- Flags
  ADD COLUMN IF NOT EXISTS is_optional BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_phantom BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_by_product BOOLEAN DEFAULT false,

  -- Planning
  ADD COLUMN IF NOT EXISTS priority INTEGER,
  ADD COLUMN IF NOT EXISTS production_lines TEXT[],
  ADD COLUMN IF NOT EXISTS production_line_restrictions TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS tax_code_id BIGINT REFERENCES tax_codes(id),
  ADD COLUMN IF NOT EXISTS lead_time_days INTEGER,
  ADD COLUMN IF NOT EXISTS moq DECIMAL(12,4),

  -- Costing
  ADD COLUMN IF NOT EXISTS unit_cost_std DECIMAL(12,4);

-- Note: DB uses 'scrap_percent' not 'scrap_std_pct'
-- Types must use 'scrap_percent'
```

### Phase 2: Type Updates

**File: `apps/frontend/lib/types.ts`**

Update Product interface:
```typescript
export interface Product {
  id: number;
  org_id?: number;
  sku: string;  // ✅ Fix: was part_number
  name: string;  // ✅ Add: was missing
  description?: string;
  product_type: ProductType;
  type?: 'RM' | 'DG' | 'PR' | 'FG' | 'WIP';
  subtype?: string;
  category?: string;
  uom: string;
  is_active: boolean;
  supplier_id?: number;
  lead_time_days?: number;
  shelf_life_days?: number;
  moq?: number;
  tax_code_id?: number;
  std_price?: number;
  expiry_policy?: string;
  rate?: number;
  production_lines?: string[];
  default_routing_id?: number;
  requires_routing?: boolean;
  boxes_per_pallet?: number;
  packs_per_box?: number;
  product_version?: string;
  notes?: string;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  // Relationships
  activeBom?: Bom;
  allergens?: ProductAllergen[];
}
```

Update Bom interface:
```typescript
export interface Bom {
  id: number;
  org_id?: number;
  product_id: number;
  version: number;  // ✅ Fix: was string, DB has INTEGER
  name: string;  // ✅ Add: was missing
  status: BomStatus;
  effective_from?: string;
  effective_to?: string;
  yield_qty: number;  // ✅ Add: was missing
  yield_uom: string;  // ✅ Add: was missing
  notes?: string;
  requires_routing?: boolean;
  default_routing_id?: number;
  line_id?: number[];
  boxes_per_pallet?: number;
  is_active?: boolean;
  archived_at?: string;
  deleted_at?: string;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  // Relationships
  bomItems?: BomItem[];
  defaultRouting?: Routing;
}
```

Update BomItem interface:
```typescript
export interface BomItem {
  id: number;
  bom_id: number;
  material_id: number;
  quantity: number;
  uom: string;
  scrap_percent: number;  // ✅ Fix: was scrap_std_pct
  consume_whole_lp: boolean;
  sequence: number;
  notes?: string;  // ✅ Add: was missing
  is_optional?: boolean;
  is_phantom?: boolean;
  is_by_product?: boolean;
  priority?: number;
  production_lines?: string[];
  production_line_restrictions?: string[];
  unit_cost_std?: number;
  tax_code_id?: number;
  lead_time_days?: number;
  moq?: number;
  created_at: string;
  updated_at: string;
  // Relationships
  material?: Product;
}
```

---

## Files to Modify

1. **`apps/frontend/lib/supabase/migrations/090_products_boms_schema_alignment.sql`** - New migration
2. **`apps/frontend/lib/types.ts`** - Fix Product, Bom, BomItem interfaces
3. **`apps/frontend/lib/api/products.ts`** - Use `sku` not `part_number`
4. **`apps/frontend/lib/api/boms.ts`** - Use `scrap_percent`, version as number
5. **`apps/frontend/app/api/technical/products/**`** - Fix field names
6. **`apps/frontend/app/api/technical/boms/**`** - Fix field names
7. **UI components** - Update all Product/BOM field references

---

## Testing Checklist

- [ ] Migration runs without errors
- [ ] Existing products preserved
- [ ] Existing BOMs preserved
- [ ] BOM items data intact
- [ ] ProductsAPI.getAll() returns correct data
- [ ] ProductsAPI.create() uses `sku` field
- [ ] BomsAPI.getAll() returns correct data
- [ ] BOM version is number, not string
- [ ] BOM items use `scrap_percent`
- [ ] Product form uses `sku` field
- [ ] BOM editor loads items correctly
- [ ] TypeScript type-check passes
- [ ] No console errors

---

## Definition of Done

- [ ] Migration created and applied
- [ ] TypeScript types match DB schema exactly
- [ ] All API routes use correct column names
- [ ] UI components updated
- [ ] Type-check passes (`pnpm type-check`)
- [ ] Manual test: Create Product → Create BOM → Add Items → Edit

---

## Architecture Reference

See: `docs/architecture.md` →
- **products** (lines 7702-7742)
- **boms** (lines 6929-6961)
- **bom_items** (lines 7529-7554)

---

## Dependencies

- None (standalone fix)

## Blocked By

- None

## Blocks

- ALL Technical module functionality
- BOM editing and history
- Product management
- WO material snapshots (depend on BOM)

---

## Risk Assessment

**VERY HIGH Risk Items:**
1. `part_number` → `sku` rename affects ALL product queries
2. BOM `version: string` → `version: number` may break comparisons
3. `scrap_std_pct` → `scrap_percent` affects BOM item calculations
4. Many phantom fields in use by UI may cause runtime errors

**Mitigation:**
1. Run migration first, then types, then API, then UI - in strict order
2. Full regression test on Technical module
3. Search codebase for all `part_number`, `scrap_std_pct`, `version` usages
4. Consider creating type aliases during transition

---

## Decision: Column Naming Strategy

**Critical Field Renames Required:**
- `part_number` → `sku` (in types/API)
- `scrap_std_pct` → `scrap_percent` (in types/API)
- `version: string` → `version: number` (type change)

**Fields to Add to DB (expand):**
- Products: type, subtype, category, moq, tax_code_id, std_price, etc. (~15 columns)
- BOMs: requires_routing, default_routing_id, line_id, etc. (~7 columns)
- BOM Items: is_optional, is_phantom, priority, etc. (~10 columns)

**Note:** This is the largest alignment story (21 SP) due to:
1. Three tables affected
2. Critical field name changes
3. Type changes (string → number)
4. ~32 columns to add total

