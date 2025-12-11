# Epic 2 Batch 2B Technical Specification: BOM System

Date: 2025-01-23
Author: Claude Code
Epic ID: 2
Batch: 2B
Status: Draft

---

## Overview

Epic 2 Batch 2B (BOM System) implementuje kompleksowy system Bill of Materials (BOM) dla MonoPilot MES. Batch ten stanowi rdzeń modułu Technical i obejmuje 9 stories (2.6-2.14) realizujących pełną funkcjonalność BOM: CRUD operations, date-based versioning, BOM items z warunkami i by-products, date overlap validation, BOM comparison i cloning, timeline visualization, oraz automatyczne dziedziczenie alergenów z komponentów.

Batch 2B zależy od Batch 2A (Products + Settings) jako foundation - wymaga działających tabel products, product_allergens i technical_settings. System BOM wspiera multiple versions per product z date-based validity (effective_from/effective_to), conditional items z flag-based logic, by-products jako negative items, oraz real-time allergen inheritance calculations.

## Objectives and Scope

### In Scope
- ✅ **BOM CRUD**: Create, read, update BOMs z product_id, version, effective dates, status (Draft/Active/Phased Out/Inactive)
- ✅ **BOM Items Management**: Add/edit/delete/reorder BOM items z product_id, quantity, UoM, scrap_percent, sequence, consume_whole_lp flag
- ✅ **Date Overlap Validation**: Database trigger + API validation preventing overlapping BOM date ranges dla same product
- ✅ **BOM Timeline Visualization**: Gantt-style timeline showing BOM versions z color-coded status
- ✅ **BOM Clone**: Copy existing BOM z all items, auto-increment version, new effective dates
- ✅ **BOM Compare**: Side-by-side diff view showing added/removed/changed items between 2 versions
- ✅ **Conditional BOM Items**: Flag-based conditions (organic, vegan, kosher, halal, etc.) z AND/OR logic
- ✅ **By-Products**: BOM items z is_by_product = true, yield_percent (output as fraction of main product)
- ✅ **Allergen Inheritance**: Auto-calculate BOM allergens as union of all component allergens (Contains + May Contain)

### Out of Scope (Phase 2+)
- ❌ BOM costing (material cost rollup) - Epic 8 Finance
- ❌ BOM explosion simulation (what-if planning) - Epic 3 Planning advanced features
- ❌ Multi-level BOM expansion (recursive subassemblies) - Phase 2 enhancement
- ❌ Scrap tracking analytics (actual vs expected) - Epic 4 Production
- ❌ Alternative materials (substitutions) - Phase 2 enhancement
- ❌ Process instructions per BOM item - Epic 2 Routing covers operations

## System Architecture Alignment

### Technology Stack
- **Frontend**: Next.js 15 App Router, React 19, TypeScript 5.7 strict mode
- **UI**: Tailwind CSS 3.4 + Shadcn/UI components, Recharts dla timeline visualization
- **Database**: PostgreSQL 15 via Supabase (RLS enabled dla org_id isolation)
- **Validation**: React Hook Form + Zod (client + server)
- **State Management**: SWR dla data fetching/caching
- **Caching**: Upstash Redis (BOM cache 5 min TTL, invalidate on update)

### Architecture Constraints
1. **Multi-tenancy**: Wszystkie tabele z `org_id UUID FK` + RLS policies
2. **Audit Trail**: `created_by`, `updated_by`, `created_at`, `updated_at` na boms i bom_items
3. **Soft Delete**: Brak soft delete dla BOMs (hard delete dozwolony, cascade to items)
4. **Unique Constraints**:
   - `(org_id, product_id, version)` na boms (unique version per product)
   - Date overlap check: database trigger prevents overlapping effective dates
5. **Foreign Keys**:
   - boms.product_id → products.id (ON DELETE RESTRICT - cannot delete product with BOMs)
   - bom_items.bom_id → boms.id (ON DELETE CASCADE)
   - bom_items.product_id → products.id (ON DELETE RESTRICT)

### Referenced Components
- **Products Module** (Batch 2A): boms.product_id FK, bom_items.product_id FK
- **Allergens Module** (Epic 1): product_allergens dla inheritance calculation
- **Technical Settings** (Batch 2A): technical_settings.conditional_flags_enabled toggle

### Cache Dependencies & Events
```typescript
const CACHE_KEYS = {
  boms: 'boms:{org_id}:{product_id}',        // TTL 5 min, consumed by Epic 3,4
  bomItems: 'bom-items:{bom_id}',            // TTL 5 min, consumed by Epic 4
  bomAllergens: 'bom-allergens:{bom_id}',    // TTL 5 min, consumed by Epic 2,8
}

// Cache invalidation events (Batch 2B emits → Others listen)
'bom.created' → Epic 3,4 invalidate BOM list cache
'bom.updated' → Epic 3,4 refetch specific BOM
'bom_item.created' → Epic 4 refetch BOM items list
'bom_allergens.updated' → Epic 2,8 refetch allergen inheritance
```

## Detailed Design

### Services and Modules

| Service/Module | Responsibilities | Inputs | Outputs | Owner |
|----------------|------------------|--------|---------|-------|
| **BOMService** | CRUD operations dla BOMs i BOM items | BOM form data, items list | BOM objects, items arrays | API |
| **BOMValidationService** | Date overlap validation, conditional logic checks | BOM dates, product_id, conditions | Validation result, error messages | API |
| **BOMVersionService** | Version management, auto-increment, cloning | Product_id, current version | New version number | API |
| **BOMCompareService** | Diff calculation between 2 BOM versions | BOM v1, BOM v2 | Diff object (added/removed/changed items) | API |
| **BOMAllergenService** | Calculate inherited allergens from components | BOM items list | Allergens object (Contains, May Contain) | API |
| **BOMTimelineService** | Generate timeline visualization data | Product BOMs list | Timeline data (bars z dates, colors) | API |

### Data Models and Contracts

#### BOMs Table
```typescript
interface BOM {
  id: string                      // UUID PK
  org_id: string                  // FK → organizations, RLS key
  product_id: string              // FK → products (OUTPUT product)
  version: string                 // Format: "1.0", "1.1", "2.0" (unique per product)
  effective_from: Date            // Required, date validation
  effective_to?: Date             // Optional, must be > effective_from
  status: BOMStatus               // Enum: Draft, Active, Phased Out, Inactive
  output_qty: number              // Default 1.0, must be > 0
  output_uom: string              // UoM code (from product)
  notes?: string                  // Optional description
  created_by: string              // FK → users
  updated_by: string              // FK → users
  created_at: Date
  updated_at: Date
}

enum BOMStatus {
  Draft = 'draft',                // In development, not used for production
  Active = 'active',              // Currently in use
  PhasedOut = 'phased_out',       // Being replaced, still usable
  Inactive = 'inactive'           // Obsolete, archived
}

// Unique constraint: (org_id, product_id, version)
// Indexes: org_id, product_id, effective_from, status
// RLS: org_id = auth.jwt()->>'org_id'
// Date overlap trigger: prevent overlapping [effective_from, effective_to] dla same product_id
```

#### BOM Items Table
```typescript
interface BOMItem {
  id: string                      // UUID PK
  bom_id: string                  // FK → boms (ON DELETE CASCADE)
  product_id: string              // FK → products (INPUT material/component)
  quantity: number                // Required, must be > 0
  uom: string                     // UoM code (from product)
  scrap_percent: number           // Default 0, range [0, 100]
  sequence: number                // Display order (1, 2, 3...), drag-drop reorder
  consume_whole_lp: boolean       // Default false, if true: consume entire LP
  is_by_product: boolean          // Default false, if true: this is output, not input
  yield_percent?: number          // Required if is_by_product = true, range [0, 100]
  condition_flags?: string[]      // Array of flags ['organic', 'vegan'], nullable
  condition_logic?: string        // Enum: 'AND', 'OR', nullable
  notes?: string                  // Optional per-item notes
  created_at: Date
  updated_at: Date
}

// Calculated fields (not stored):
effective_qty = quantity * (1 + scrap_percent/100)  // For consumption planning

// Unique constraint: None (allow duplicate products in BOM)
// Indexes: bom_id, product_id, sequence
// RLS: org_id via bom_id → boms.org_id
```

#### Date Overlap Validation Trigger
```sql
CREATE OR REPLACE FUNCTION check_bom_date_overlap()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if any existing BOM dla same product has overlapping dates
  IF EXISTS (
    SELECT 1 FROM boms
    WHERE org_id = NEW.org_id
      AND product_id = NEW.product_id
      AND id != NEW.id  -- Exclude self on UPDATE
      AND (
        -- Case 1: NEW overlaps existing start
        (NEW.effective_from BETWEEN effective_from AND COALESCE(effective_to, '9999-12-31'))
        OR
        -- Case 2: NEW overlaps existing end
        (COALESCE(NEW.effective_to, '9999-12-31') BETWEEN effective_from AND COALESCE(effective_to, '9999-12-31'))
        OR
        -- Case 3: NEW encompasses existing
        (NEW.effective_from <= effective_from AND COALESCE(NEW.effective_to, '9999-12-31') >= COALESCE(effective_to, '9999-12-31'))
      )
  ) THEN
    RAISE EXCEPTION 'BOM date range overlaps with existing BOM for this product';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_bom_date_overlap
  BEFORE INSERT OR UPDATE ON boms
  FOR EACH ROW
  EXECUTE FUNCTION check_bom_date_overlap();
```

### APIs and Interfaces

#### REST Endpoints

**BOM CRUD**
```typescript
GET    /api/technical/boms
  Query: { product_id?, status?, include_items? }
  Response: BOM[] (grouped by product if no product_id filter)
  Auth: Authenticated (Technical role or higher)
  Cache: 5 min TTL

POST   /api/technical/boms
  Body: CreateBOMInput {
    product_id: string
    effective_from: Date
    effective_to?: Date
    status: BOMStatus
    output_qty: number
    output_uom: string
    notes?: string
  }
  Response: BOM
  Auth: Technical role or higher
  Validation: Zod schema, date overlap check
  Side effects: Version auto-assigned (1.0 if first, else max+0.1)

PUT    /api/technical/boms/:id
  Body: UpdateBOMInput (same as Create, except product_id immutable)
  Response: BOM
  Auth: Technical role or higher
  Validation: Date overlap check if dates changed

DELETE /api/technical/boms/:id
  Response: { success: boolean }
  Auth: Technical role or higher
  Side effects: Cascade delete all bom_items
  Validation: Cannot delete if WOs reference this BOM (FK check in Epic 3)
```

**BOM Items Management**
```typescript
GET    /api/technical/boms/:id/items
  Response: BOMItem[] (sorted by sequence)
  Auth: Authenticated
  Cache: 5 min TTL

POST   /api/technical/boms/:id/items
  Body: CreateBOMItemInput {
    product_id: string
    quantity: number
    uom: string
    scrap_percent?: number
    sequence: number
    consume_whole_lp?: boolean
    is_by_product?: boolean
    yield_percent?: number (required if is_by_product)
    condition_flags?: string[]
    condition_logic?: 'AND' | 'OR'
    notes?: string
  }
  Response: BOMItem
  Auth: Technical role or higher
  Validation: Zod schema, product exists, UoM matches product

PUT    /api/technical/boms/:bomId/items/:itemId
  Body: UpdateBOMItemInput (same as Create)
  Response: BOMItem
  Auth: Technical role or higher

DELETE /api/technical/boms/:bomId/items/:itemId
  Response: { success: boolean }
  Auth: Technical role or higher

PUT    /api/technical/boms/:id/items/reorder
  Body: { items: Array<{ id: string, sequence: number }> }
  Response: BOMItem[]
  Auth: Technical role or higher
  Side effects: Update sequence dla all items (atomic transaction)
```

**BOM Operations**
```typescript
POST   /api/technical/boms/:id/clone
  Body: { effective_from: Date, effective_to?: Date }
  Response: BOM (new cloned BOM with incremented version)
  Auth: Technical role or higher
  Side effects:
    - Clone BOM record (new id, version++)
    - Clone all bom_items (new ids, same bom_id)
    - Status = Draft

GET    /api/technical/boms/compare
  Query: { v1: string (BOM id), v2: string (BOM id) }
  Response: BOMComparison {
    added: BOMItem[]      // Items in v2 not in v1
    removed: BOMItem[]    // Items in v1 not in v2
    changed: Array<{
      item_v1: BOMItem
      item_v2: BOMItem
      changes: string[]   // ['quantity: 10 → 15', 'scrap_percent: 0 → 5']
    }>
    unchanged: BOMItem[]  // Items identical in both
  }
  Auth: Authenticated
  Comparison logic: Match by product_id

GET    /api/technical/boms/:id/allergens
  Response: {
    contains: Allergen[]      // Union of all items' Contains allergens
    may_contain: Allergen[]   // Union of all items' May Contain allergens
    mismatch_warning?: string // If BOM allergens differ from product allergens
  }
  Auth: Authenticated
  Cache: 5 min TTL
  Algorithm:
    1. Fetch all bom_items.product_id
    2. Fetch product_allergens dla each product
    3. Union Contains allergens
    4. Union May Contain allergens
    5. Compare vs product_id allergens → warning if mismatch

GET    /api/technical/boms/timeline
  Query: { product_id: string }
  Response: BOMTimelineData {
    boms: Array<{
      id: string
      version: string
      effective_from: Date
      effective_to?: Date
      status: BOMStatus
      color: string  // green=Active, gray=Draft, orange=Phased Out
    }>
  }
  Auth: Authenticated
```

#### Zod Validation Schemas

```typescript
// BOM
const CreateBOMSchema = z.object({
  product_id: z.string().uuid(),
  effective_from: z.string().datetime(),  // ISO 8601
  effective_to: z.string().datetime().optional()
    .refine((val, ctx) => {
      if (val && ctx.parent.effective_from) {
        return new Date(val) > new Date(ctx.parent.effective_from)
      }
      return true
    }, 'effective_to must be after effective_from'),
  status: z.enum(['draft', 'active', 'phased_out', 'inactive']),
  output_qty: z.number().positive(),
  output_uom: z.string().min(1),
  notes: z.string().optional()
})

// BOM Item
const CreateBOMItemSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().positive(),
  uom: z.string().min(1),
  scrap_percent: z.number().min(0).max(100).default(0),
  sequence: z.number().int().positive(),
  consume_whole_lp: z.boolean().default(false),
  is_by_product: z.boolean().default(false),
  yield_percent: z.number().min(0).max(100).optional()
    .refine((val, ctx) => {
      if (ctx.parent.is_by_product && !val) {
        return false  // yield_percent required if by-product
      }
      return true
    }, 'yield_percent required for by-products'),
  condition_flags: z.array(z.string()).optional(),
  condition_logic: z.enum(['AND', 'OR']).optional(),
  notes: z.string().optional()
})
```

### Workflows and Sequencing

#### Workflow 1: Create BOM with Items
```
User: Navigate to /technical/products/:id (Product Detail)
  ↓
User: Click "Add BOM" button
  ↓
Modal: Create BOM Form
  - effective_from (required date picker)
  - effective_to (optional date picker)
  - status (dropdown: Draft/Active)
  - output_qty (number input, default 1.0)
  - output_uom (from product, read-only)
  ↓
User: Submit BOM → POST /api/technical/boms
  ↓
Backend:
  1. Validate dates (effective_to > effective_from)
  2. Check date overlap (trigger fires)
  3. Auto-assign version (query max version, increment)
  4. Insert BOM record
  5. Return BOM object
  ↓
UI: Navigate to BOM Detail page /technical/boms/:id
  ↓
User: Click "Add Item" button
  ↓
Modal: Add BOM Item Form
  - product_id (dropdown: search products)
  - quantity (number input)
  - scrap_percent (number input, default 0)
  - consume_whole_lp (checkbox, default false)
  - is_by_product (checkbox, default false)
  - yield_percent (number input, shown only if is_by_product)
  - condition_flags (multi-select, shown if technical_settings.conditional_flags_enabled)
  ↓
User: Submit Item → POST /api/technical/boms/:id/items
  ↓
Backend:
  1. Validate product exists
  2. Validate UoM matches product
  3. Validate yield_percent if by-product
  4. Auto-assign sequence (max + 1)
  5. Insert bom_item record
  6. Invalidate BOM cache
  ↓
UI: Refresh items table, show new item
  ↓
User: Drag-drop items to reorder
  ↓
UI: PUT /api/technical/boms/:id/items/reorder
  ↓
Backend: Update sequence dla all items (atomic transaction)
```

#### Workflow 2: BOM Date Overlap Prevention
```
User: Create BOM dla product_id = P1
  - effective_from = 2025-01-01
  - effective_to = 2025-12-31
  ↓
Backend: Insert BOM v1.0 → Success
  ↓
User: Create new BOM dla same product_id = P1
  - effective_from = 2025-06-01  (OVERLAPS v1.0!)
  - effective_to = NULL
  ↓
Backend:
  1. trigger_check_bom_date_overlap fires
  2. Query finds overlap (2025-06-01 is within v1.0 range)
  3. RAISE EXCEPTION 'BOM date range overlaps with existing BOM v1.0'
  ↓
API: Returns 400 Bad Request
  {
    "error": "BOM_DATE_OVERLAP",
    "message": "Date range overlaps with BOM v1.0 (2025-01-01 to 2025-12-31)",
    "conflicting_bom_id": "abc123",
    "conflicting_version": "1.0"
  }
  ↓
UI: Show error modal:
  "Date range overlaps with BOM v1.0. Options:
   1. Change effective_from to after 2025-12-31
   2. Edit BOM v1.0 to set effective_to before your new date"
  ↓
User: Fix dates → Retry submit → Success
```

#### Workflow 3: BOM Clone
```
User: View BOM Detail page /technical/boms/:id (v1.0)
  ↓
User: Click "Clone" button
  ↓
Modal: Clone BOM Form
  - new_effective_from (date picker, required)
  - new_effective_to (date picker, optional)
  - Note: "All items will be copied, version will be 1.1"
  ↓
User: Submit → POST /api/technical/boms/:id/clone
  ↓
Backend:
  1. Fetch source BOM v1.0
  2. Calculate new version (1.0 → 1.1)
  3. Insert new BOM record:
     - Same product_id
     - New version (1.1)
     - New dates (from user input)
     - Status = Draft
  4. Clone all bom_items:
     - SELECT * FROM bom_items WHERE bom_id = source_id
     - INSERT INTO bom_items (...) VALUES (...) (new bom_id, same product_id, qty, etc.)
  5. Return new BOM object
  ↓
UI: Navigate to new BOM Detail page
  ↓
User: Verify items copied → Edit as needed → Change status to Active
```

#### Workflow 4: Allergen Inheritance Calculation
```
User: View BOM Detail page /technical/boms/:id
  ↓
UI: Tab "Allergens" → GET /api/technical/boms/:id/allergens
  ↓
Backend:
  1. Fetch all bom_items dla this BOM (WHERE bom_id = X)
  2. Extract product_id list: [P1, P2, P3]
  3. Query product_allergens:
     SELECT DISTINCT allergen_id, relation_type
     FROM product_allergens
     WHERE product_id IN (P1, P2, P3)
  4. Aggregate:
     - Contains: allergen_ids WHERE relation_type = 'contains'
     - May Contain: allergen_ids WHERE relation_type = 'may_contain'
  5. Fetch product_allergens dla BOM's output product_id
  6. Compare: If BOM allergens ≠ product allergens → generate warning
  7. Return allergens object
  ↓
UI: Display allergens in 2 sections:
  - Contains (red badges)
  - May Contain (yellow badges)
  - Warning banner if mismatch:
    "BOM allergens differ from product allergens. Update product? [Yes] [No]"
  ↓
User: Click "Yes" → PUT /api/technical/products/:id/allergens
  ↓
Backend: Update product_allergens to match BOM calculation
```

## Non-Functional Requirements

### Performance

| Operation | Target | Measurement |
|-----------|--------|-------------|
| BOM list dla product (10 versions) | <200ms p95 | GET /api/technical/boms?product_id=X |
| BOM detail z 50 items | <300ms p95 | GET /api/technical/boms/:id (include_items=true) |
| BOM clone (50 items) | <1s p95 | POST /api/technical/boms/:id/clone (atomic transaction) |
| BOM compare (2 versions, 50 items each) | <500ms p95 | GET /api/technical/boms/compare?v1=X&v2=Y |
| Allergen inheritance (100 items) | <1s p95 | GET /api/technical/boms/:id/allergens (recursive query) |
| Date overlap validation | <100ms p95 | Database trigger (indexed query) |
| Timeline visualization (20 BOMs) | <200ms p95 | GET /api/technical/boms/timeline?product_id=X |

**Performance Optimizations:**
- **Critical Index**: `idx_boms_product_dates ON (org_id, product_id, effective_from, effective_to)`
- **Caching**: BOM objects cached 5 min, invalidate on update/delete
- **Lazy Loading**: BOM items loaded on-demand (not with BOM list)
- **Pagination**: BOM list paginated (50 per page) jeśli >100 BOMs per product
- **Optimistic Updates**: UI immediately reflects reorder, background sync

### Security

| Requirement | Implementation | Validation |
|-------------|----------------|------------|
| **Multi-Tenancy Isolation** | RLS policy `org_id = auth.jwt()->>'org_id'` | RLS test suite |
| **Role-Based Access** | Technical role or higher dla write operations | Middleware check |
| **Date Overlap Prevention** | Database trigger (cannot bypass) | Integration test |
| **Cascade Delete Protection** | FK ON DELETE CASCADE dla bom_items | Unit test |
| **Audit Trail** | created_by, updated_by, created_at, updated_at | All BOM/item changes logged |

### Reliability/Availability

| Requirement | Implementation | SLA |
|-------------|----------------|-----|
| **Uptime** | 99.9% availability (Vercel + Supabase) | 43.2 min downtime/month max |
| **Transaction Atomicity** | BOM clone: all items copied or none | Atomic transaction |
| **Idempotent Operations** | BOM date overlap trigger: safe to retry | No side effects on failure |
| **Cascade Delete** | Delete BOM → cascade delete all items | ON DELETE CASCADE |

## Dependencies and Integrations

### Batch 2B Requires (Dependencies)

```
Batch 2A: Products + Settings
│
├── Products Table (product_id FK dla boms i bom_items)
├── Product Allergens (dla allergen inheritance calculation)
└── Technical Settings (conditional_flags_enabled toggle)

Epic 1: Foundation
│
├── Organizations (org_id FK, multi-tenancy)
└── Users (created_by, updated_by audit trail)
```

### Batch 2B Provides (APIs Consumed by Others)

| API Endpoint | Consumer Epics | Purpose | Cache TTL |
|--------------|----------------|---------|-----------|
| `GET /api/technical/boms` | Epic 3 (Planning), Epic 4 (Production) | WO creation, material planning | 5 min |
| `GET /api/technical/boms/:id/items` | Epic 4 (Production) | Material consumption | 5 min |
| `GET /api/technical/boms/:id/allergens` | Epic 8 (NPD) | Formulation allergen aggregation | 5 min |

### Shared Tables

| Table | Owner | Readers | Write Access |
|-------|-------|---------|--------------|
| `boms` | Batch 2B | Epic 3,4,8 | Batch 2B only |
| `bom_items` | Batch 2B | Epic 4,8 | Batch 2B only |

### Cache Invalidation Events

```typescript
// Batch 2B emits events → Other modules listen
'bom.created' → Epic 3,4 invalidate BOM list cache dla product
'bom.updated' → Epic 3,4 refetch specific BOM
'bom.deleted' → Epic 3,4 remove from cache
'bom_item.created' → Epic 4 refetch BOM items list
'bom_item.updated' → Epic 4 refetch BOM items list
'bom_item.deleted' → Epic 4 refetch BOM items list
'bom_allergens.changed' → Epic 2,8 refetch allergen inheritance
```

## Acceptance Criteria (Authoritative)

Batch 2B realizuje 9 stories (2.6-2.14) covering BOM CRUD, items management, validation, versioning, comparison, conditional items, by-products, i allergen inheritance.

### Story 2.6: BOM CRUD

**AC-2.6.1**: User może navigate to /technical/boms i zobaczyć table/list BOMs grouped by product

**AC-2.6.2**: "Add BOM" form zawiera:
- product_id (dropdown, required)
- version (auto-generated, read-only)
- effective_from (date picker, required)
- effective_to (date picker, optional)
- status (dropdown: Draft, Active, Phased Out, Inactive)
- output_qty (number input, default 1.0)
- output_uom (from product, read-only)

**AC-2.6.3**: BOM saved successfully → version auto-assigned (1.0 if first)

**AC-2.6.4**: BOM list shows: product name, version, date range, status, items count

### Story 2.7: BOM Items Management

**AC-2.7.1**: "Add Item" modal zawiera:
- product_id (dropdown z search, required)
- quantity (number input, required)
- uom (from component, read-only)
- scrap_percent (number input, default 0, range 0-100)
- sequence (auto-assigned)
- consume_whole_lp (checkbox, default false)

**AC-2.7.2**: Items table shows: component name, quantity, effective qty (qty * (1 + scrap%)), UoM, scrap%, sequence

**AC-2.7.3**: User może reorder items z drag-drop → sequence updated

**AC-2.7.4**: User może edit/delete items (confirmation modal dla delete)

### Story 2.8: BOM Date Overlap Validation

**AC-2.8.1**: Given product has BOM z effective_from=2025-01-01, effective_to=2025-12-31
When creating new BOM z effective_from=2025-06-01
Then system shows error: "Date range overlaps with BOM v1.0"

**AC-2.8.2**: Given existing BOM has no effective_to (infinite)
When creating new BOM
Then must set effective_to on existing BOM first (manual action required)

**AC-2.8.3**: Error message includes conflicting BOM version i date range

**AC-2.8.4**: API returns 400 Bad Request z error code BOM_DATE_OVERLAP

### Story 2.9: BOM Timeline Visualization

**AC-2.9.1**: Product detail page shows Gantt-style timeline dla all BOM versions

**AC-2.9.2**: Timeline bars show:
- X-axis: dates (timeline scale)
- Each bar: one BOM version z start/end dates
- Color: green=Active, gray=Draft, orange=Phased Out, red=Inactive

**AC-2.9.3**: Clicking bar → navigate to BOM Detail page

**AC-2.9.4**: Timeline scrollable/zoomable jeśli >10 versions

### Story 2.10: BOM Clone

**AC-2.10.1**: BOM Detail page has "Clone" button

**AC-2.10.2**: Clone modal asks dla new effective_from i effective_to dates

**AC-2.10.3**: Cloned BOM has:
- Same product_id
- New version (auto-incremented, e.g., 1.0 → 1.1)
- All items copied (same product_id, qty, scrap%, sequence)
- Status = Draft

**AC-2.10.4**: User navigated to new BOM Detail page after clone

### Story 2.11: BOM Compare

**AC-2.11.1**: Product detail page has "Compare" button (requires 2+ BOM versions)

**AC-2.11.2**: Compare modal: select 2 versions (dropdowns)

**AC-2.11.3**: Diff view shows:
- Items added (green rows, exist in v2 not v1)
- Items removed (red rows, exist in v1 not v2)
- Items changed (yellow rows, old → new values dla qty/scrap/UoM)
- Items unchanged (gray rows)

**AC-2.11.4**: Comparison logic: match items by product_id

### Story 2.12: Conditional BOM Items

**AC-2.12.1**: Given technical_settings.conditional_flags_enabled = true
When adding/editing BOM item
Then can select condition_flags (multi-select) i condition_logic (AND/OR)

**AC-2.12.2**: Default flags: organic, gluten_free, vegan, kosher, halal, dairy_free, nut_free, soy_free

**AC-2.12.3**: Conditional items shown z flag badges in items table

**AC-2.12.4**: Example: Item "Organic Flour" has flags ["organic", "vegan"] z AND logic
→ Only consumed when WO has BOTH flags (Epic 4 implementation)

### Story 2.13: By-Products in BOM

**AC-2.13.1**: BOM item form has "is_by_product" toggle

**AC-2.13.2**: When is_by_product = true:
- yield_percent field required (range 0-100)
- item shown in "By-Products" section (separate from inputs)

**AC-2.13.3**: BOM detail shows:
- Input Materials section (is_by_product = false)
- By-Products section (is_by_product = true)
- Total yield displayed (sum of all by-product yields)

**AC-2.13.4**: Unlimited by-products per BOM

### Story 2.14: Allergen Inheritance

**AC-2.14.1**: BOM detail has "Allergens" tab

**AC-2.14.2**: Allergens tab shows rolled-up allergens:
- Contains: union of all item Contains allergens
- May Contain: union of all item May Contain allergens

**AC-2.14.3**: If BOM allergens differ from Product allergens → warning banner:
"BOM allergens differ from product allergens. Update product? [Yes] [No]"

**AC-2.14.4**: Clicking "Yes" → updates product_allergens to match BOM calculation

**AC-2.14.5**: Allergen inheritance calculated on-the-fly (not cached in DB)

## Traceability Mapping

| Story | FR ID | Components/APIs | Test Files |
|-------|-------|-----------------|------------|
| 2.6 | FR-TECH-006 | BOMService, SettingsAPI, boms table | bom-crud.spec.ts, bom-create.e2e.ts |
| 2.7 | FR-TECH-006 | BOMService, bom_items table | bom-items.spec.ts, bom-items-reorder.e2e.ts |
| 2.8 | FR-TECH-007 | BOMValidationService, date_overlap trigger | bom-date-validation.spec.ts, bom-overlap.e2e.ts |
| 2.9 | FR-TECH-007 | BOMTimelineService, Recharts | bom-timeline.spec.ts, bom-timeline.e2e.ts |
| 2.10 | FR-TECH-008 | BOMVersionService | bom-clone.spec.ts, bom-clone.e2e.ts |
| 2.11 | FR-TECH-008 | BOMCompareService | bom-compare.spec.ts, bom-compare.e2e.ts |
| 2.12 | FR-TECH-009 | BOMService, technical_settings | bom-conditional.spec.ts, bom-conditions.e2e.ts |
| 2.13 | FR-TECH-010 | BOMService, bom_items | bom-byproducts.spec.ts, bom-byproducts.e2e.ts |
| 2.14 | FR-TECH-011 | BOMAllergenService, product_allergens | bom-allergens.spec.ts, bom-allergen-inheritance.e2e.ts |

## Risks, Assumptions, Open Questions

### 🔴 Critical Risks

#### Risk 1: Date Overlap Trigger Failure → Duplicate Active BOMs
- **Likelihood**: Low (database trigger)
- **Impact**: 🔴 HIGH - Production uses wrong BOM, quality issues
- **Mitigation**:
  - ✅ Database trigger enforced (cannot bypass)
  - ✅ API validation as backup layer
  - ✅ Integration tests cover all overlap scenarios
  - ✅ Manual QA test: attempt to create overlapping BOMs
- **Detection**: Database constraint error, caught by API
- **Response**: Show clear error message z resolution steps

#### Risk 2: Allergen Inheritance Performance Degradation
- **Likelihood**: Medium (complex BOMs)
- **Impact**: 🟡 MEDIUM - Slow API responses, poor UX
- **Mitigation**:
  - ✅ Index on product_allergens (org_id, product_id)
  - ✅ Cache allergen calculations (5 min TTL)
  - ✅ Performance test: 100 items BOM, measure query time (<1s target)
- **Detection**: API response time monitoring (alert if >2s p95)
- **Response**: Optimize query, add materialized view jeśli needed

### 🟡 Medium Risks

#### Risk 3: BOM Clone Race Condition → Duplicate Versions
- **Likelihood**: Low (rare concurrent clones)
- **Impact**: 🟡 MEDIUM - Version conflict, manual cleanup needed
- **Mitigation**:
  - ✅ Unique constraint on (org_id, product_id, version)
  - ✅ Atomic transaction dla clone operation
  - ✅ Version calculation uses SELECT FOR UPDATE (lock row)
- **Detection**: Database unique constraint error
- **Response**: Retry clone with incremented version

### Assumptions

| ID | Assumption | Impact if False | Validation |
|----|------------|-----------------|------------|
| A-001 | BOMs have max 100 items per product | Pagination needed | Query analytics |
| A-002 | Products have max 20 BOM versions | Timeline performance | Monitor version counts |
| A-003 | Date overlap validation <100ms | API latency | Performance testing |
| A-004 | By-products max 5 per BOM | UI layout constraints | User feedback |
| A-005 | Conditional flags max 10 per org | Multi-select UI scalability | Settings config |

### Open Questions

| ID | Question | Decision Needed By | Owner | Impact |
|----|----------|-------------------|-------|--------|
| Q-001 | Should BOM clone also copy conditional flags? | Sprint 0 | PM | Story 2.10 scope |
| Q-002 | Do we need BOM approval workflow (Draft → Pending → Active)? | Sprint 0 | PM | Out of scope (Phase 2) |
| Q-003 | Should allergen inheritance show component-level breakdown? | Sprint 0 | UX | Story 2.14 UI detail |
| Q-004 | Do we support fractional versions (e.g., 1.2.3)? | Sprint 0 | Architect | Version format simplicity |

## Test Strategy Summary

### Unit Tests (Vitest)
- BOM validation schemas (dates, quantities, versions)
- Date overlap logic (all edge cases)
- Version auto-increment calculation
- BOM compare diff algorithm
- Allergen inheritance aggregation

### Integration Tests (Vitest + Supabase)
- BOM CRUD API endpoints
- Date overlap trigger (attempt overlapping inserts)
- BOM clone (atomic transaction, verify all items copied)
- Allergen inheritance API (verify recursive query)
- Cache invalidation (BOM update → cache cleared)

### E2E Tests (Playwright)
- Complete BOM creation flow (BOM + 5 items)
- Date overlap prevention (UI error message)
- BOM clone flow (verify items copied in UI)
- BOM compare (verify diff view accurate)
- Allergen inheritance (verify warning banner)
- By-products management (toggle, yield_percent required)

---

**Last Updated:** 2025-01-23
**Status:** Ready for implementation
