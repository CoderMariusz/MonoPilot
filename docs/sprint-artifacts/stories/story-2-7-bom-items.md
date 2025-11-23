# Story 2.7: BOM Items Management

Status: ready-for-dev

## Story

As a **Technical user**,
I want to add materials to a BOM,
So that I define what goes into the product.

## Acceptance Criteria

### AC-2.7.1: Add BOM Item Form
**Given** a BOM is being created/edited
**When** clicking "Add Item" button
**Then** a modal opens with:
- product_id (component, dropdown with search, required)
- quantity (number input, required, must be > 0)
- uom (from selected component, read-only)
- scrap_percent (number input, default 0, range 0-100, with % label)
- sequence (auto-assigned, not shown in form)
- consume_whole_lp (toggle/checkbox, default false)
  - Label: "Consume entire License Plate"
  - Tooltip: "When enabled, the entire LP will be consumed regardless of quantity"

**And** product selector excludes:
- The output product (BOM's product_id)
- Products already in BOM items (prevent duplicates) - optional, can allow duplicates

### AC-2.7.2: BOM Items Table Display
**When** viewing BOM detail page
**Then** items are displayed in table with columns:
- Sequence (drag handle for reorder)
- Component Code
- Component Name
- Quantity
- UoM
- Scrap % (e.g., "5%")
- Effective Qty (calculated: quantity * (1 + scrap_percent/100))
- Consume Whole LP (icon/badge if true)
- Actions (Edit, Delete)

**And** table sorted by sequence ascending
**And** effective_qty shown in gray/muted color as calculated field

### AC-2.7.3: Reorder Items (Drag-Drop)
**Given** a BOM has multiple items
**When** user drags item to new position
**Then** sequence updated dla all affected items
**And** table re-sorted immediately (optimistic update)
**And** API call PUT /api/technical/boms/:id/items/reorder in background

**And** sequence numbers always consecutive (1, 2, 3, ...) after reorder

### AC-2.7.4: Edit BOM Item
**Given** a BOM item exists
**When** clicking Edit action
**Then** same modal as Add opens, pre-filled with current values
**And** product_id is read-only (cannot change component)
**And** can update: quantity, scrap_percent, consume_whole_lp

**When** saving changes
**Then** item updated, table refreshed
**And** effective_qty recalculated automatically

### AC-2.7.5: Delete BOM Item
**Given** a BOM item exists
**When** clicking Delete action
**Then** confirmation dialog appears:
"Delete component X from BOM? This action cannot be undone."

**When** confirming
**Then** item deleted
**And** sequence of remaining items recalculated (close gaps)
**And** table refreshed
**And** success toast displayed

### AC-2.7.6: Effective Quantity Calculation
**Given** an item has:
- quantity = 10
- scrap_percent = 5

**Then** effective_qty = 10 * (1 + 5/100) = 10.5

**And** effective_qty displayed with 3 decimal places
**And** tooltip on effective_qty: "Includes scrap allowance"

### AC-2.7.7: Empty State
**Given** a BOM has no items yet
**Then** show empty state:
"No items in this BOM yet. Click 'Add Item' to get started."

## Tasks / Subtasks

### Task 1: Database Schema & Migrations (AC: 2.7.1-2.7.6)
- [ ] Create `bom_items` table migration:
  ```sql
  CREATE TABLE bom_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bom_id UUID NOT NULL REFERENCES boms(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity DECIMAL(10,3) NOT NULL,
    uom VARCHAR(10) NOT NULL,
    scrap_percent DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    sequence INTEGER NOT NULL,
    consume_whole_lp BOOLEAN NOT NULL DEFAULT false,
    is_by_product BOOLEAN NOT NULL DEFAULT false,
    yield_percent DECIMAL(5,2),
    condition_flags TEXT[],
    condition_logic VARCHAR(10),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT check_quantity CHECK (quantity > 0),
    CONSTRAINT check_scrap_percent CHECK (scrap_percent >= 0 AND scrap_percent <= 100),
    CONSTRAINT check_sequence CHECK (sequence > 0),
    CONSTRAINT check_yield_percent CHECK (yield_percent IS NULL OR (yield_percent >= 0 AND yield_percent <= 100)),
    CONSTRAINT check_condition_logic CHECK (condition_logic IS NULL OR condition_logic IN ('AND', 'OR'))
  );
  ```
- [ ] Add indexes:
  ```sql
  CREATE INDEX idx_bom_items_bom ON bom_items(bom_id, sequence);
  CREATE INDEX idx_bom_items_product ON bom_items(product_id);
  ```
- [ ] Add RLS policy (inherit org_id via bom_id → boms.org_id):
  ```sql
  ALTER TABLE bom_items ENABLE ROW LEVEL SECURITY;
  CREATE POLICY bom_items_org_isolation ON bom_items
    USING (EXISTS (
      SELECT 1 FROM boms
      WHERE boms.id = bom_items.bom_id
      AND boms.org_id = (auth.jwt() ->> 'org_id')::uuid
    ));
  ```
- [ ] Run migration and verify schema

### Task 2: API Endpoints (AC: 2.7.1-2.7.5)
- [ ] Implement GET /api/technical/boms/:id/items
  - [ ] Return: BOMItem[] sorted by sequence
  - [ ] Include product info (code, name, uom) via JOIN
  - [ ] Cache: 5 min TTL
- [ ] Implement POST /api/technical/boms/:id/items
  - [ ] Body: CreateBOMItemInput (Zod validation)
  - [ ] Auto-assign sequence:
    ```typescript
    const maxSeq = await getMaxSequence(bom_id)
    const newSequence = maxSeq ? maxSeq + 1 : 1
    ```
  - [ ] Validate product exists and is not the output product
  - [ ] Insert bom_item record
  - [ ] Invalidate BOM cache
  - [ ] Return: BOMItem object
- [ ] Implement PUT /api/technical/boms/:bomId/items/:itemId
  - [ ] Body: UpdateBOMItemInput (Zod validation)
  - [ ] Cannot update bom_id or product_id
  - [ ] Update record with updated_at
  - [ ] Invalidate cache
  - [ ] Return: BOMItem object
- [ ] Implement DELETE /api/technical/boms/:bomId/items/:itemId
  - [ ] Delete item
  - [ ] Recalculate sequence dla remaining items (close gaps):
    ```sql
    UPDATE bom_items
    SET sequence = sequence - 1
    WHERE bom_id = :bomId AND sequence > :deleted_sequence
    ```
  - [ ] Invalidate cache
  - [ ] Return: { success: true }
- [ ] Implement PUT /api/technical/boms/:id/items/reorder
  - [ ] Body: { items: Array<{ id: string, sequence: number }> }
  - [ ] Validate all items belong to BOM
  - [ ] Update sequence dla all items in atomic transaction
  - [ ] Invalidate cache
  - [ ] Return: BOMItem[] (updated list)

### Task 3: Zod Validation Schemas (AC: 2.7.1)
- [ ] Add to lib/validation/bom-schemas.ts:
  ```typescript
  export const CreateBOMItemSchema = z.object({
    product_id: z.string().uuid('Invalid product ID'),
    quantity: z.number().positive('Quantity must be positive'),
    uom: z.string().min(1, 'UoM is required'),
    scrap_percent: z.number().min(0).max(100).default(0),
    consume_whole_lp: z.boolean().default(false),
    is_by_product: z.boolean().default(false),
    yield_percent: z.number().min(0).max(100).optional()
      .refine((val, ctx) => {
        if (ctx.parent.is_by_product && !val) {
          return false
        }
        return true
      }, 'yield_percent required for by-products'),
    condition_flags: z.array(z.string()).optional(),
    condition_logic: z.enum(['AND', 'OR']).optional(),
    notes: z.string().optional()
  })

  export const UpdateBOMItemSchema = CreateBOMItemSchema.omit({ product_id: true })

  export const ReorderBOMItemsSchema = z.object({
    items: z.array(z.object({
      id: z.string().uuid(),
      sequence: z.number().int().positive()
    }))
  })
  ```

### Task 4: Frontend BOM Items Table (AC: 2.7.2, 2.7.7)
- [ ] Create components/technical/BOMItemsTable.tsx
- [ ] Implement table with columns:
  - [ ] Sequence (with drag handle icon)
  - [ ] Component Code
  - [ ] Component Name
  - [ ] Quantity
  - [ ] UoM
  - [ ] Scrap % (formatted as "5%")
  - [ ] Effective Qty (calculated, muted color, with tooltip)
  - [ ] Consume Whole LP (icon/badge if true)
  - [ ] Actions (Edit, Delete buttons)
- [ ] Effective Qty calculation (client-side):
  ```typescript
  const effectiveQty = quantity * (1 + scrapPercent / 100)
  ```
- [ ] Empty state component:
  - [ ] Icon (box or package)
  - [ ] Text: "No items in this BOM yet. Click 'Add Item' to get started."
  - [ ] "Add Item" button (primary, large)
- [ ] Use shadcn/ui Table component
- [ ] Loading skeleton podczas fetch

### Task 5: Drag-Drop Reorder (AC: 2.7.3)
- [ ] Install @dnd-kit/core, @dnd-kit/sortable
- [ ] Wrap BOMItemsTable in DndContext
- [ ] Make each row draggable with useSortable hook
- [ ] On drag end:
  ```typescript
  const handleDragEnd = (event) => {
    const { active, over } = event
    if (active.id !== over.id) {
      // Reorder items locally (optimistic update)
      const reorderedItems = arrayMove(items, oldIndex, newIndex)
      setItems(reorderedItems)

      // Update sequence numbers (1, 2, 3, ...)
      const updates = reorderedItems.map((item, index) => ({
        id: item.id,
        sequence: index + 1
      }))

      // API call in background
      reorderBOMItems(bomId, updates)
    }
  }
  ```
- [ ] Show drag cursor on hover
- [ ] Highlight drop zone podczas dragging

### Task 6: Add/Edit BOM Item Modal (AC: 2.7.1, 2.7.4)
- [ ] Create components/technical/BOMItemModal.tsx
- [ ] Mode: 'add' | 'edit' (controlled by prop)
- [ ] Product selector (Combobox):
  - [ ] Search products by code/name
  - [ ] Exclude output product (BOM's product_id)
  - [ ] On select → populate uom from product
  - [ ] Read-only in edit mode
- [ ] Quantity input (number, step=0.001, min=0.001)
- [ ] UoM display (read-only text)
- [ ] Scrap % input (number, step=0.01, min=0, max=100, suffix="%")
- [ ] Consume Whole LP toggle (Switch component)
- [ ] Effective Qty preview (calculated, muted):
  ```typescript
  const effectiveQty = quantity * (1 + scrapPercent / 100)
  ```
- [ ] Notes textarea (optional)
- [ ] Submit button → POST or PUT
- [ ] Cancel button → close modal

### Task 7: Delete BOM Item Confirmation (AC: 2.7.5)
- [ ] Create components/technical/DeleteBOMItemDialog.tsx
- [ ] Confirmation message: "Delete component {code} - {name} from BOM?"
- [ ] Warning: "This action cannot be undone."
- [ ] Two buttons: Cancel, Delete (red, destructive)
- [ ] On delete → API call → success toast → refetch items

### Task 8: Integration & Testing (AC: All)
- [ ] Unit tests:
  - [ ] CreateBOMItemSchema validation
  - [ ] Effective qty calculation (various scrap %)
  - [ ] Sequence recalculation after delete
- [ ] Integration tests (lib/api/__tests__/bom-items.test.ts):
  - [ ] POST /api/technical/boms/:id/items → item created with auto-sequence
  - [ ] POST again → sequence incremented
  - [ ] PUT /api/technical/boms/:bomId/items/:itemId → quantity updated
  - [ ] DELETE → item removed, sequence gaps closed
  - [ ] PUT reorder → sequences updated atomically
- [ ] E2E tests (__tests__/e2e/bom-items.spec.ts):
  - [ ] Navigate to BOM detail page
  - [ ] Click "Add Item"
  - [ ] Select component, enter quantity and scrap %
  - [ ] Submit → item appears in table with effective qty
  - [ ] Drag item to new position → sequence updated
  - [ ] Edit item → change quantity → effective qty recalculated
  - [ ] Delete item → confirm → item removed

### Task 9: Documentation & Cleanup
- [ ] Update TypeScript interfaces (lib/types/bom.ts):
  ```typescript
  interface BOMItem {
    id: string
    bom_id: string
    product_id: string
    product?: Product  // Joined data
    quantity: number
    uom: string
    scrap_percent: number
    sequence: number
    consume_whole_lp: boolean
    is_by_product: boolean
    yield_percent?: number
    condition_flags?: string[]
    condition_logic?: 'AND' | 'OR'
    notes?: string
    created_at: Date
    updated_at: Date
    // Calculated fields (client-side)
    effective_qty?: number
  }
  ```
- [ ] Add API documentation
- [ ] Update seed script (add BOM items dla sample BOMs)

## Dev Notes

### Technical Stack
- **Frontend**: Next.js 15, React 19, TypeScript 5.7
- **UI**: Shadcn/UI (Table, Dialog, Combobox, Switch, Tooltip)
- **Drag-Drop**: @dnd-kit/core, @dnd-kit/sortable
- **Forms**: React Hook Form + Zod

### Key Technical Decisions
1. **Sequence Management**: Auto-assigned on create, recalculated on delete (close gaps)
2. **Effective Qty**: Calculated client-side (not stored in DB) as `qty * (1 + scrap% / 100)`
3. **Drag-Drop**: Optimistic updates (reorder locally, sync to server in background)
4. **Duplicate Components**: Allowed (can add same component multiple times with different conditions)

### Security Considerations
- **RLS Policy**: Inherit org_id via bom_id → boms.org_id
- **FK Constraints**: ON DELETE CASCADE dla bom_id (cascade when BOM deleted)
- **Validation**: Product must exist, quantity > 0, scrap % in range [0, 100]

### Project Structure
```
app/
  technical/
    boms/
      [id]/
        page.tsx                  # BOM detail (includes BOMItemsTable)

components/
  technical/
    BOMItemsTable.tsx             # Items table with drag-drop
    BOMItemModal.tsx              # Add/Edit item modal
    DeleteBOMItemDialog.tsx       # Delete confirmation

lib/
  validation/
    bom-schemas.ts                # CreateBOMItemSchema, ReorderBOMItemsSchema
```

### Testing Strategy
**Unit Tests**: Effective qty calculation, sequence recalculation
**Integration Tests**: API endpoints, sequence management, atomic reorder
**E2E Tests**: Complete add/edit/delete/reorder flow

### References
- [Source: docs/epics/epic-2-technical.md#Story-2.7]
- [Source: docs/sprint-artifacts/tech-spec-epic-2-batch-2b.md#BOM-Items-Table]

### Prerequisites
**Story 2.6**: BOMs table and CRUD operations

### Dependencies
**Libraries:**
- @dnd-kit/core, @dnd-kit/sortable (drag-drop)
- shadcn/ui (Table, Dialog, Combobox, Switch, Tooltip)

## Dev Agent Record
<!-- Will be filled during implementation -->

## Change Log
- 2025-01-23: Story drafted by Claude Code
