# SET-019: Production Line Create/Edit Modal

**Module**: Settings
**Feature**: Production Line Management (FR-SET-060, FR-SET-065, Story 1.8)
**Type**: Modal Dialog
**Status**: Approved (Auto-approve mode)
**Last Updated**: 2025-12-11

---

## ASCII Wireframe

### Success State (Create/Edit)

```
┌─────────────────────────────────────────────────────────────────┐
│  Create Production Line                                   [X]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Code *                                                         │
│  [______]  (auto-uppercase, unique)                             │
│                                                                 │
│  Name *                                                         │
│  [___________________________________________________]          │
│                                                                 │
│  Warehouse *                                                    │
│  [Select warehouse ▼]                                           │
│    - MAIN - Main Warehouse                                      │
│    - WIP1 - Work in Progress                                    │
│                                                                 │
│  Capacity (units/hour)                                          │
│  [_________]  Optional                                          │
│                                                                 │
│  ASSIGNED MACHINES ───────────────────────────────────────────  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ [Select machine ▼]                              [+ Add]   │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │ ≡ MIX-001 Industrial Mixer                          [×]   │ │
│  │ ≡ PKG-001 Packaging Line                            [×]   │ │
│  └───────────────────────────────────────────────────────────┘ │
│  Drag to reorder sequence                                       │
│                                                                 │
│  COMPATIBLE PRODUCTS ────────────────────────────────────────   │
│  Products that can run on this line:                            │
│  🔍 [Search products...        ]  [Select All] [Clear All]     │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ ☑ WWB-001 Whole Wheat Bread                   [Bakery]    │ │
│  │ ☑ RYE-001 Rye Bread                           [Bakery]    │ │
│  │ ☐ CRO-001 Croissant                           [Pastry]    │ │
│  │ ☐ CAK-001 Chocolate Cake                [Confectionery]   │ │
│  │ ☐ MUF-001 Blueberry Muffins                   [Bakery]    │ │
│  │ ☐ DON-001 Glazed Donuts                        [Pastry]    │ │
│  └───────────────────────────────────────────────────────────┘ │
│  2 products selected                                            │
│                                                                 │
│  ☑ Active                                                       │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  [Cancel]                             [Create Production Line]  │
└─────────────────────────────────────────────────────────────────┘
```

### Empty State (No Products Selected)

```
│  COMPATIBLE PRODUCTS ────────────────────────────────────────   │
│  Products that can run on this line:                            │
│  🔍 [Search products...        ]  [Select All] [Clear All]     │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ ☐ WWB-001 Whole Wheat Bread                   [Bakery]    │ │
│  │ ☐ RYE-001 Rye Bread                           [Bakery]    │ │
│  │ ☐ CRO-001 Croissant                           [Pastry]    │ │
│  │ ☐ CAK-001 Chocolate Cake                [Confectionery]   │ │
│  └───────────────────────────────────────────────────────────┘ │
│  0 products selected (Line can run any product)                 │
```

### Loading State (Products)

```
│  COMPATIBLE PRODUCTS ────────────────────────────────────────   │
│  Products that can run on this line:                            │
│  🔍 [Search products...        ]  [Select All] [Clear All]     │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                                                             │ │
│  │                  ⏳ Loading products...                     │ │
│  │                                                             │ │
│  └───────────────────────────────────────────────────────────┘ │
```

### Error State (Products)

```
│  COMPATIBLE PRODUCTS ────────────────────────────────────────   │
│  Products that can run on this line:                            │
│  🔍 [Search products...        ]  [Select All] [Clear All]     │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                                                             │ │
│  │  ⚠ Failed to load products. [Retry]                        │ │
│  │                                                             │ │
│  └───────────────────────────────────────────────────────────┘ │
```

---

## Key Components

- **Code**: Text input, auto-uppercase, unique per org, required
- **Name**: Text input, 2-100 chars, required
- **Warehouse**: Dropdown (org warehouses), required, filters where line produces
- **Capacity**: Number input, units/hour, optional, 0-9999
- **Machines**: Multi-select with drag-to-reorder, optional, shows machine code + name
- **Compatible Products**: Multi-select checkbox list with search, optional, shows product code + name + category
- **Search Products**: Text input, filters product list in real-time (code or name)
- **Select All**: Button, checks all visible products (respects search filter)
- **Clear All**: Button, unchecks all products
- **Active**: Checkbox, default ON

---

## Main Actions

- **Create**: Validates code uniqueness, saves line + machine assignments + product compatibility, closes modal, shows toast "Production Line [CODE] created"
- **Edit**: Updates line, preserves machine sequence, updates product compatibility, shows toast "Production Line [CODE] updated"
- **Add Machine**: Adds selected machine to list with next sequence number
- **Remove Machine**: Removes machine from line (machine stays in system)
- **Reorder**: Drag ≡ handle updates machine sequence (1, 2, 3...)
- **Search Products**: Filters product list by code or name (case-insensitive)
- **Select All**: Checks all visible products in filtered list
- **Clear All**: Unchecks all products (clears all selections)
- **Toggle Product**: Checks/unchecks individual product, updates counter
- **Cancel/[X]**: Closes without saving, confirms if unsaved changes exist

---

## 4 States

### Loading
- Spinner overlay + "Creating production line..." while POST /api/settings/production-lines runs
- Products section shows "Loading products..." spinner while GET /api/technical/products runs

### Empty
- N/A for modal (triggered by "Add Line" button)
- Products section shows "0 products selected (Line can run any product)" when no products checked

### Error
- Red banner + inline errors (duplicate code, warehouse required, capacity invalid, machine already at max capacity)
- Products section shows "Failed to load products. [Retry]" if GET /api/technical/products fails

### Success
- Form fields populated (edit) or blank (create)
- Machine list loaded (edit) or empty (create)
- Products list loaded with checkboxes, selected products checked (edit) or all unchecked (create)

---

## Compatible Products Feature (FR-SET-065)

### Purpose
Define which products can run on each production line. Used for validation during Work Order creation to prevent incompatible product-line assignments.

### Behavior

| Scenario | Behavior |
|----------|----------|
| No products selected | Line can run ANY product (no restrictions) |
| 1+ products selected | Line can ONLY run selected products (restrictive) |
| Product search | Filters list by code or name, "Select All" only selects visible |
| Product inactive | Still shown in list with "(Inactive)" label, can be selected |
| Product deleted | Removed from line_products table automatically (FK cascade) |
| WO creation | If line has restrictions, product dropdown filtered to compatible only |

### Product List Display

- **Code**: Product code (e.g., WWB-001)
- **Name**: Product name (e.g., Whole Wheat Bread)
- **Category**: Product category in brackets (e.g., [Bakery])
- **Sort Order**: Code ASC by default
- **Max Height**: 200px with scroll (prevents modal overflow)
- **Empty State**: "No products available" if org has no products

### Search Behavior

- **Real-time**: Filters as user types (debounce 300ms)
- **Matches**: Product code OR name (case-insensitive)
- **Example**: "wheat" matches "WWB-001 Whole Wheat Bread"
- **Clear**: Backspace or [×] button clears search, shows all products
- **Select All**: When search active, only selects VISIBLE products

---

## Machine Assignment Logic

| Scenario | Behavior |
|----------|----------|
| Add machine | Appends to end of list with sequence = max(sequence) + 1 |
| Drag machine | Updates all sequences to reflect new order (1-indexed) |
| Remove machine | Gaps removed, sequences renumbered (1, 2, 3...) |
| Same machine on multiple lines | Allowed (warning shown: "Machine is assigned to 2 lines") |
| Machine offline status | Warning shown but assignment allowed |

---

## Validation Rules

| Field | Rules |
|-------|-------|
| Code | Required, 2-20 chars, uppercase, unique per org, immutable if WOs exist |
| Name | Required, 2-100 chars |
| Warehouse | Required, FK to warehouses table |
| Capacity | Optional, integer 0-9999, units/hour |
| Machines | Optional, many-to-many via line_machines, max 20 per line |
| Products | Optional, many-to-many via line_products, no limit (but realistic max ~500) |
| Active | Boolean, default true |

**Validation Timing**: On blur (code uniqueness), on submit (all fields)

**Delete Protection**: Cannot delete if active work orders exist, shows error "Line has active work orders"

---

## Accessibility

- **Touch Targets**: All inputs/buttons >= 48x48dp
- **Contrast**: WCAG AA (4.5:1)
- **Keyboard**: Tab navigation, Enter submit, Escape closes, Arrow keys + Space for dropdown, Space toggles checkboxes
- **Focus**: Code field auto-focused on open
- **Screen Reader**: Announces "Create Production Line Modal", field labels, machine count, product count, drag instructions, search results count, errors
- **Drag Alternative**: Keyboard users can use Up/Down arrows + Space to reorder machines
- **Checkbox Labels**: Each product row is fully clickable label (not just checkbox)
- **Search Feedback**: Screen reader announces "X products found" after search

---

## Technical Notes

### API Endpoints
- **Create**: `POST /api/settings/production-lines`
- **Update**: `PUT /api/settings/production-lines/:id`
- **Get Machines**: `GET /api/settings/machines?active=true`
- **Get Products**: `GET /api/technical/products?active=true` (optional: include inactive for edit)
- **Validation**: `GET /api/settings/production-lines/validate-code?code={code}`

### Data Structure
```typescript
{
  code: string;               // 2-20 chars, uppercase
  name: string;               // 2-100 chars
  warehouse_id: string;       // FK to warehouses
  capacity: number | null;    // units/hour
  machines: Array<{
    machine_id: string;
    sequence: number;         // 1-indexed
  }>;
  product_ids: string[];      // Array of product UUIDs (NEW)
  active: boolean;
  org_id: string;             // auto-populated
}
```

### Related Tables
- `production_lines`: id, org_id, code, name, warehouse_id, capacity, active
- `line_machines`: id, line_id, machine_id, sequence, created_at
- `line_products`: id, line_id, product_id, created_at (NEW - junction table)

### Database Schema (NEW)

```sql
-- Junction table for line-product compatibility
CREATE TABLE line_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  line_id UUID NOT NULL REFERENCES production_lines(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  UNIQUE(line_id, product_id)  -- Prevent duplicate assignments
);

-- Indexes
CREATE INDEX idx_line_products_line_id ON line_products(line_id);
CREATE INDEX idx_line_products_product_id ON line_products(product_id);
CREATE INDEX idx_line_products_org_id ON line_products(org_id);

-- RLS Policies
ALTER TABLE line_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view line_products in their org"
  ON line_products FOR SELECT
  USING (org_id = auth.jwt() ->> 'org_id');

CREATE POLICY "Users can insert line_products in their org"
  ON line_products FOR INSERT
  WITH CHECK (org_id = auth.jwt() ->> 'org_id');

CREATE POLICY "Users can delete line_products in their org"
  ON line_products FOR DELETE
  USING (org_id = auth.jwt() ->> 'org_id');
```

---

## Related Screens

- **Production Line List**: [SET-018-production-line-list.md] (parent screen, not yet created)
- **Machine List**: [SET-016-machine-list.md] (referenced for machine selection)
- **Product List**: [TECH-002-product-list.md] (referenced for product selection)
- **Work Order Create**: [PROD-001-work-order-create.md] (consumes product compatibility)

---

## Handoff Notes

1. ShadCN Dialog + Form components
2. Zod schema: `lib/validation/production-line-schema.ts` (update to include product_ids)
3. Service: `lib/services/production-line-service.ts` (update to handle line_products)
4. Code uniqueness: debounce 500ms on blur
5. Code immutable if line has WOs (show warning in edit mode)
6. Warehouse dropdown: only show active warehouses, sorted by code
7. Machine multi-select: use dnd-kit for drag-to-reorder, show drag handle (≡)
8. Capacity tooltip: "Expected throughput rate for scheduling"
9. Machine limit: max 20 machines per line (show error if exceeded)
10. DELETE endpoint checks for active WOs before allowing deletion
11. **Products search**: Debounce 300ms, search code + name, case-insensitive
12. **Products load**: Parallel fetch with machines, show loading state
13. **Products save**: POST/PUT sends product_ids array, backend handles junction table CRUD
14. **Products empty**: If no products selected, save empty array (allows any product)
15. **Product validation**: During WO creation, check `line_products` table if line has restrictions

---

## Business Rules

- Production lines define where products are manufactured
- Warehouse assignment determines default output location
- Capacity used for scheduling and planning (optional but recommended)
- Machine sequence matters for routing/operations (FR-SET-061)
- Active toggle hides line from WO creation dropdowns
- Deleting line removes machine assignments but preserves machines
- **Product compatibility**:
  - If line has NO products assigned → can run ANY product (unrestricted)
  - If line has 1+ products assigned → can ONLY run those products (restricted)
  - Used during WO creation to filter valid product-line combinations
  - Validation prevents creating WO with incompatible product-line pair

---

## Work Order Creation Validation (NEW)

When creating a Work Order:

1. User selects Production Line dropdown
2. User selects Product dropdown
3. **Validation Logic**:
   ```typescript
   if (line.product_ids.length === 0) {
     // Line has no restrictions, allow any product
     return true;
   } else {
     // Line has restrictions, check if product is compatible
     return line.product_ids.includes(selected_product_id);
   }
   ```
4. **Error Message** (if validation fails): "Product [CODE] cannot run on line [LINE-CODE]. Please select a compatible product or change the production line."
5. **UI Behavior**: Product dropdown should be filtered to show only compatible products when line is selected

---

**Approval Status**: Auto-approved
**Mode**: auto_approve
**User Approved**: true (explicit opt-in)
**Iterations**: 1 of 3
**Changes**: Added Compatible Products section (FR-SET-065)
