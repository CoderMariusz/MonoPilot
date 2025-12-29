# Story 02.5b - Test Quick Reference
## Phase 1B BOM Items Advanced - TEST-WRITER Handoff

---

## Test Files at a Glance

### 1. Service Tests (48 tests)
**File:** `apps/frontend/lib/services/__tests__/bom-items-service.phase1b.test.ts`

**Functions to Implement:**
```typescript
// Calculate byproduct yield percentage
calculateYieldPercent(byproductQty: number, bomOutputQty: number): number
// Returns: (byproductQty / bomOutputQty) * 100, rounded to 2 decimals

// Bulk create items (up to 500)
bulkCreateBOMItems(bomId: string, items: CreateBOMItemRequest[]): Promise<BulkImportResponse>
// Returns: { created: number, total: number, items: BOMItem[], errors: Array }

// Get byproducts only (is_by_product=true)
getByproducts(bomId: string): Promise<BOMItem[]>

// Get production lines for dropdown
getProductionLines(orgId: string): Promise<ProductionLine[]>

// Get conditional flags for multi-select
getConditionalFlags(): Promise<ConditionalFlag[]>

// Get items for specific production line
getItemsForLine(bomId: string, lineId: string): Promise<BOMItem[]>
```

**Key Test Patterns:**
- Yield calculation: 2% = (2 / 100) * 100
- Bulk import: max 500 items, auto-sequence, partial success (207)
- Conditional flags: JSONB with 5 default flags + custom
- Line IDs: null = all lines, [id1, id2] = specific lines
- Byproducts: yield_percent required when is_by_product=true

---

### 2. API Route Tests (32 tests)
**File:** `apps/frontend/app/api/v1/technical/boms/[id]/items/bulk/__tests__/route.test.ts`

**Endpoint to Implement:**
```
POST /api/v1/technical/boms/:id/items/bulk
```

**Request Body:**
```typescript
{
  items: [
    {
      product_id: "uuid",
      quantity: 50,
      uom: "kg",
      sequence?: 10,           // auto-increment if not provided
      scrap_percent?: 0,
      operation_seq?: null,
      // Phase 1B fields
      consume_whole_lp?: false,
      line_ids?: ["uuid"] | null,
      is_by_product?: false,
      yield_percent?: 2.0,     // required if is_by_product=true
      condition_flags?: { organic: true, vegan: true }
    },
    // ... up to 500 items
  ]
}
```

**Response (201 Success):**
```typescript
{
  created: 10,
  total: 10,
  items: [BOMItem, ...],
  errors: []
}
```

**Response (207 Partial Success):**
```typescript
{
  created: 8,
  total: 10,
  items: [BOMItem, ...],
  errors: [
    { row: 2, error: "Product not found" },
    { row: 5, error: "Quantity must be > 0" }
  ]
}
```

**Key Test Patterns:**
- Reject >500 items (400)
- Return 207 for partial success
- Auto-increment sequence (max + 10, 20, 30, ...)
- Auto-calculate yield_percent for byproducts
- Include detailed error messages per row

---

### 3. Validation Tests (42 tests)
**File:** `apps/frontend/lib/validation/__tests__/bom-items-phase1b.test.ts`

**Schemas to Extend:**
```typescript
// Add to bomItemFormSchema / createBOMItemSchema
export const bomItemFormSchemaPhase1B = bomItemFormSchema.extend({
  consume_whole_lp: z.boolean().default(false).optional(),

  line_ids: z.array(z.string().uuid()).nullable().optional()
    .transform(val => val && val.length === 0 ? null : val), // normalize [] to null

  is_by_product: z.boolean().default(false).optional(),

  yield_percent: z.number().min(0).max(100).optional().nullable()
    .refine((val, ctx) => {
      if (ctx.parent?.is_by_product === true && !val) {
        return false; // Required for byproducts
      }
      return true;
    }),

  condition_flags: z.record(z.string(), z.boolean()).optional().nullable(),
});

// Bulk import schema
export const bulkImportSchema = z.object({
  items: z.array(bomItemFormSchemaPhase1B)
    .min(1, "At least 1 item required")
    .max(500, "Maximum 500 items allowed")
});
```

**Key Validation Rules:**
- `condition_flags`: JSONB with default flags (organic, vegan, gluten_free, kosher, halal)
- `line_ids`: UUID array, nullable, empty array → null
- `is_by_product`: boolean, default false
- `yield_percent`: 0-100, required if is_by_product=true
- `consume_whole_lp`: boolean, default false

---

### 4. Component Tests (63 tests)

#### BOMByproductsSection (18 tests)
**Props:**
```typescript
interface BOMByproductsSectionProps {
  byproducts: BOMItem[]
  bomOutputQty: number
  bomOutputUom: string
  canEdit: boolean
  onAddByproduct?: () => void
  onEditByproduct?: (id: string) => void
  onDeleteByproduct?: (id: string) => Promise<void>
  isLoading?: boolean
}
```

**Key Features to Test:**
- Display byproducts in table (separate from input items)
- Show yield_percent column
- Calculate and display total yield in footer
- Edit/delete buttons (respect canEdit)
- Empty state message when no byproducts
- Loading indicator during delete
- Accessibility (proper headers, labels, keyboard nav)

---

#### ConditionalFlagsSelect (20 tests)
**Props:**
```typescript
interface ConditionalFlagsSelectProps {
  value?: ConditionFlags | null
  onChange: (flags: ConditionFlags | null) => void
  disabled?: boolean
  availableFlags?: Array<{ id: string; code: string; name: string }>
  loading?: boolean
}
```

**Key Features to Test:**
- Render all 5 default flags as checkboxes
- Multi-select with independent toggles
- Pass null when all unchecked (not empty object)
- Display selected flags with checkmarks
- Disabled state blocks onChange
- Loading state shows spinner
- Accessibility (labels, aria attributes, keyboard)

---

#### ProductionLinesCheckbox (22 tests)
**Props:**
```typescript
interface ProductionLinesCheckboxProps {
  value?: string[] | null
  onChange: (lineIds: string[] | null) => void
  disabled?: boolean
  productionLines?: ProductionLine[]
  loading?: boolean
}
```

**Key Features to Test:**
- Render all active production lines as checkboxes
- null value = available on all lines
- Array of UUIDs = restricted to those lines
- Empty array normalization to null
- Pass only checked line IDs to onChange
- Help text explaining behavior
- Display selected line names
- Disabled/loading state handling

---

#### BOMBulkImportModal (30 tests)
**Props:**
```typescript
interface BOMBulkImportModalProps {
  isOpen: boolean
  bomId: string
  onClose: () => void
  onSuccess?: (count: number) => void
  onError?: (error: string) => void
}
```

**Key Features to Test:**
- CSV file upload area (drag-drop + click)
- CSV template download link
- Import button (disabled until file selected)
- Progress indicator during import
- Success message with count
- Error list with row numbers for validation failures
- Partial success (8 created, 2 errors)
- Download error report as CSV
- 207 Multi-Status for partial success
- onSuccess/onError callbacks
- Accessibility and responsive design

---

## Feature Implementation Checklist

### Phase 1B Features
- [ ] Conditional Flags (JSONB)
  - [ ] 5 default flags: organic, vegan, gluten_free, kosher, halal
  - [ ] Custom flags support
  - [ ] Null vs empty object handling
  - [ ] Database column: bom_items.condition_flags JSONB

- [ ] By-products (yield_percent)
  - [ ] is_by_product flag
  - [ ] is_output alias for is_by_product
  - [ ] yield_percent auto-calculation: (qty / output_qty) * 100
  - [ ] Byproduct display section
  - [ ] Total yield footer

- [ ] Line-Specific Items (line_ids)
  - [ ] line_ids UUID[] nullable
  - [ ] NULL = available on all lines
  - [ ] Specific IDs = restricted
  - [ ] Empty array normalization
  - [ ] Production lines dropdown

- [ ] LP Consumption Mode (consume_whole_lp)
  - [ ] Boolean flag, default false
  - [ ] Toggle on/off support
  - [ ] Preserve during updates

- [ ] Bulk Import
  - [ ] POST /api/v1/technical/boms/:id/items/bulk
  - [ ] Max 500 items per request
  - [ ] Sequence auto-increment
  - [ ] Yield auto-calculation for byproducts
  - [ ] Partial success (207 Multi-Status)
  - [ ] Error reporting by row
  - [ ] All Phase 1B fields in bulk

---

## Critical Test Cases

### Must Pass for GREEN Phase
1. **calculateYieldPercent(2, 100) === 2.0**
2. **Bulk import with 500 items succeeds with 201**
3. **Bulk import with 501 items fails with 400**
4. **Bulk import with 2 invalid items returns 207 with errors array**
5. **Byproduct without yield_percent fails validation**
6. **Line-IDs null means all lines available**
7. **Empty line_ids array normalized to null**
8. **condition_flags stores JSONB correctly**
9. **ConditionalFlagsSelect onChange returns {organic: true} or null**
10. **ProductionLinesCheckbox onChange returns ['line-1', 'line-2'] or null**

---

## Common Pitfalls to Avoid

1. **Line IDs:**
   - ❌ Store empty array [] → ✓ Normalize to null
   - ❌ Return [] from onChange → ✓ Return null

2. **Yield Percent:**
   - ❌ Allow null for is_by_product=true → ✓ Require value
   - ❌ Don't round to 2 decimals → ✓ Round: Math.round(x * 100) / 100

3. **Bulk Import:**
   - ❌ Allow >500 items → ✓ Return 400 error
   - ❌ Stop on first error → ✓ Continue and collect all errors
   - ❌ Return 400 for partial errors → ✓ Return 207

4. **Conditional Flags:**
   - ❌ Return {} when unchecked → ✓ Return null
   - ❌ Force only default flags → ✓ Allow custom flags
   - ❌ Store as separate columns → ✓ Store as JSONB

5. **Components:**
   - ❌ Close modal on error → ✓ Show error, keep modal open
   - ❌ Allow selection when disabled → ✓ Block all interactions
   - ❌ Forget accessibility → ✓ Labels, ARIA, keyboard support

---

## Test Execution Examples

### Run specific test suite
```bash
npm test -- bom-items-service.phase1b.test.ts
```

### Run tests matching pattern
```bash
npm test -- --testNamePattern="yield_percent"
```

### Run with coverage
```bash
npm test -- --coverage lib/services/__tests__/bom-items-service.phase1b.test.ts
```

### Watch mode for development
```bash
npm test -- --watch bom-items-service.phase1b.test.ts
```

---

## Expected Test States

### Before Implementation
```
Tests: 185 failed
Reason: Functions not yet implemented
```

### After Service Implementation
```
Tests: 32 API + 42 Validation + 63 Component failed
       48 Service tests passing
```

### After All Implementation
```
Tests: 185 passed
Status: Ready for REFACTOR phase
```

---

## Quick Debug Tips

1. **Service tests fail:** Check if functions are exported and have correct signatures
2. **API tests fail:** Verify route handler file path: `/api/v1/technical/boms/[id]/items/bulk/route.ts`
3. **Component tests fail:** Check import paths and prop types match test expectations
4. **Validation tests fail:** Ensure Zod schemas are extended with Phase 1B fields
5. **All tests fail:** Might be test setup issue - check vitest configuration

---

## Database Columns to Ensure Exist

```sql
-- In bom_items table (should already exist from migrations)
ALTER TABLE bom_items ADD COLUMN IF NOT EXISTS condition_flags JSONB DEFAULT NULL;
ALTER TABLE bom_items ADD COLUMN IF NOT EXISTS line_ids UUID[] DEFAULT NULL;
ALTER TABLE bom_items ADD COLUMN IF NOT EXISTS is_by_product BOOLEAN DEFAULT false;
ALTER TABLE bom_items ADD COLUMN IF NOT EXISTS is_output BOOLEAN DEFAULT false;  -- alias
ALTER TABLE bom_items ADD COLUMN IF NOT EXISTS yield_percent DECIMAL(5,2) DEFAULT NULL;
ALTER TABLE bom_items ADD COLUMN IF NOT EXISTS consume_whole_lp BOOLEAN DEFAULT false;

-- Add constraint
ALTER TABLE bom_items
ADD CONSTRAINT bom_item_yield_required_for_byproduct
CHECK ((is_by_product = false) OR (yield_percent IS NOT NULL));
```

---

**TEST-WRITER:** Complete
**RED Phase:** DONE - 185 tests written and failing
**Status:** Ready for DEV agent (GREEN phase)
**Handoff Date:** 2025-12-28
