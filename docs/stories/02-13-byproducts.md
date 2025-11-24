# Story 2.13: By-Products in BOM

Status: ready-for-dev

## Story

As a **Technical user**,
I want to define by-products in BOM,
So that production outputs all expected products.

## Acceptance Criteria

### AC-2.13.1: By-Product Toggle in Item Form
**Given** adding/editing BOM item
**When** user toggles "is_by_product" to true
**Then** form adapts:
- Item labeled as "By-Product" (not input material)
- "Yield %" field appears (required, range 0-100)
- Tooltip: "By-products are additional outputs, not inputs consumed"

**And** when is_by_product = false (default):
- Item treated as input material (consumed)
- yield_percent field hidden

### AC-2.13.2: Yield Percent Validation
**Given** is_by_product = true
**When** user submits form
**Then** yield_percent required (must be > 0 and <= 100)

**And** validation error if yield_percent:
- Missing: "Yield % required for by-products"
- Invalid: "Yield % must be between 0 and 100"

### AC-2.13.3: BOM Items Segregation
**Given** BOM has items with is_by_product mixed (true/false)
**When** viewing BOM detail page
**Then** items displayed in 2 separate sections:
1. **Input Materials** (is_by_product = false):
   - Listed first
   - Shows: quantity, scrap%, effective qty
   - Total input materials count
2. **By-Products** (is_by_product = true):
   - Listed second (below inputs)
   - Shows: yield %, expected output qty
   - Total by-products count
   - Total yield % sum

**And** each section collapsible (Accordion)

### AC-2.13.4: By-Product Output Calculation
**Given** BOM has:
- Output product: "Bread" (output_qty = 100 kg)
- By-product: "Bread Crumbs" (yield_percent = 15%)

**Then** expected by-product output = 100 * 0.15 = 15 kg

**And** calculation shown in by-products section:
"Expected output: 15 kg (15% of 100 kg main output)"

### AC-2.13.5: Multiple By-Products Support
**Given** BOM can have unlimited by-products
**When** adding multiple by-products:
- By-product 1: "Bread Crumbs" (yield 15%)
- By-product 2: "Dough Scraps" (yield 5%)

**Then** total yield displayed: 20%
**And** each by-product has separate expected output calculation

### AC-2.13.6: By-Products Visual Distinction
**When** viewing BOM items table
**Then** by-products visually distinguished:
- Row background: light blue/teal (#f0fdfa)
- Icon: output arrow (→) instead of input arrow (←)
- Badge: "By-Product" label
- Quantity column shows yield % instead of consumption qty

### AC-2.13.7: Production Integration Note
**Given** BOM has by-products
**Then** note displayed:
"During production (Epic 4), by-products will create separate License Plates (LPs) automatically."

**And** tooltip explains:
"Each by-product generates its own LP with calculated quantity based on yield %"

## Tasks / Subtasks

### Task 1: Database Schema Verification (AC: 2.13.1-2.13.2)
- [ ] Verify bom_items table has columns:
  ```sql
  is_by_product BOOLEAN NOT NULL DEFAULT false,
  yield_percent DECIMAL(5,2) CHECK (yield_percent IS NULL OR (yield_percent >= 0 AND yield_percent <= 100))
  ```
  - [ ] Already added in Story 2.7, verify migration applied
- [ ] Verify constraint: yield_percent required if is_by_product = true
  - [ ] This validation enforced by Zod schema (client + server)

### Task 2: Zod Schema Updates (AC: 2.13.2)
- [ ] Update CreateBOMItemSchema:
  ```typescript
  export const CreateBOMItemSchema = z.object({
    // ... existing fields
    is_by_product: z.boolean().default(false),
    yield_percent: z.number().min(0).max(100).optional()
      .refine((val, ctx) => {
        if (ctx.parent.is_by_product && !val) {
          return false  // yield_percent required if by-product
        }
        if (ctx.parent.is_by_product && val <= 0) {
          return false  // yield_percent must be > 0 for by-products
        }
        return true
      }, 'Yield % required for by-products and must be > 0')
  })
  ```

### Task 3: BOM Item Form - By-Product Section (AC: 2.13.1)
- [ ] Update components/technical/BOMItemModal.tsx
- [ ] Add "is_by_product" toggle:
  ```typescript
  <div className="space-y-4">
    <FormField name="is_by_product">
      <div className="flex items-center justify-between">
        <div>
          <FormLabel>By-Product</FormLabel>
          <FormDescription>
            Check if this item is an output (by-product) rather than input material
          </FormDescription>
        </div>
        <Switch
          checked={form.watch('is_by_product') || false}
          onCheckedChange={(checked) => form.setValue('is_by_product', checked)}
        />
      </div>
    </FormField>

    {form.watch('is_by_product') && (
      <FormField name="yield_percent">
        <FormLabel>Yield % *</FormLabel>
        <Input
          type="number"
          step="0.01"
          min="0"
          max="100"
          placeholder="e.g., 15.00"
          {...form.register('yield_percent', { valueAsNumber: true })}
        />
        <FormDescription>
          Percentage of main output quantity (e.g., 15% = 15 kg from 100 kg)
        </FormDescription>
        <FormMessage />
      </FormField>
    )}
  </div>
  ```
- [ ] When is_by_product toggled:
  - [ ] Show yield_percent field
  - [ ] Hide scrap_percent field (not applicable dla by-products)
  - [ ] Update form labels (e.g., "Output Quantity" instead of "Input Quantity")

### Task 4: BOM Items Table - Segregation (AC: 2.13.3, 2.13.6)
- [ ] Update components/technical/BOMItemsTable.tsx
- [ ] Split items into 2 arrays:
  ```typescript
  const inputMaterials = items.filter(item => !item.is_by_product)
  const byProducts = items.filter(item => item.is_by_product)
  ```
- [ ] Render 2 collapsible sections:
  ```typescript
  <div className="space-y-4">
    <Collapsible defaultOpen={true}>
      <CollapsibleTrigger className="flex items-center justify-between w-full">
        <h3 className="text-lg font-medium">
          Input Materials ({inputMaterials.length})
        </h3>
        <ChevronDownIcon />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <Table>
          {/* Input materials table */}
        </Table>
      </CollapsibleContent>
    </Collapsible>

    {byProducts.length > 0 && (
      <Collapsible defaultOpen={true}>
        <CollapsibleTrigger className="flex items-center justify-between w-full">
          <h3 className="text-lg font-medium">
            By-Products ({byProducts.length})
          </h3>
          <ChevronDownIcon />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="bg-teal-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <InfoIcon className="w-4 h-4 text-teal-600" />
              <span className="text-sm text-teal-700">
                By-products will create separate License Plates during production
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Total yield: {totalYield.toFixed(2)}%
            </p>
          </div>
          <Table>
            {/* By-products table */}
          </Table>
        </CollapsibleContent>
      </Collapsible>
    )}
  </div>
  ```

### Task 5: By-Products Table Columns (AC: 2.13.4, 2.13.6)
- [ ] By-products table columns:
  - [ ] Icon (output arrow →)
  - [ ] Component Code
  - [ ] Component Name
  - [ ] Yield % (e.g., "15%")
  - [ ] Expected Output (calculated: output_qty * yield_percent / 100)
  - [ ] UoM
  - [ ] Actions (Edit, Delete)
- [ ] Row styling:
  ```typescript
  <TableRow className="bg-teal-50">
    <TableCell>
      <ArrowRightIcon className="w-4 h-4 text-teal-600" />
    </TableCell>
    <TableCell>{item.product.code}</TableCell>
    <TableCell>{item.product.name}</TableCell>
    <TableCell>{item.yield_percent}%</TableCell>
    <TableCell>
      {calculateExpectedOutput(bomOutputQty, item.yield_percent)} {item.uom}
      <Tooltip>
        <TooltipTrigger>
          <InfoIcon className="w-3 h-3 ml-1 inline" />
        </TooltipTrigger>
        <TooltipContent>
          {item.yield_percent}% of {bomOutputQty} {bomOutputUom}
        </TooltipContent>
      </Tooltip>
    </TableCell>
    <TableCell>{item.uom}</TableCell>
    <TableCell>
      <Button size="sm" variant="ghost" onClick={() => handleEdit(item)}>
        <EditIcon />
      </Button>
      <Button size="sm" variant="ghost" onClick={() => handleDelete(item)}>
        <TrashIcon />
      </Button>
    </TableCell>
  </TableRow>
  ```

### Task 6: Expected Output Calculation (AC: 2.13.4)
- [ ] Create helper function:
  ```typescript
  function calculateExpectedOutput(
    mainOutputQty: number,
    yieldPercent: number
  ): number {
    return (mainOutputQty * yieldPercent) / 100
  }
  ```
- [ ] Display in by-products table
- [ ] Update calculation when BOM output_qty changes

### Task 7: Total Yield Calculation (AC: 2.13.5)
- [ ] Calculate total yield:
  ```typescript
  const totalYield = byProducts.reduce((sum, item) => sum + item.yield_percent, 0)
  ```
- [ ] Display above by-products table:
  ```typescript
  <div className="flex justify-between items-center mb-2">
    <span className="text-sm font-medium">Total Yield:</span>
    <span className="text-sm font-medium text-teal-700">
      {totalYield.toFixed(2)}%
    </span>
  </div>
  ```
- [ ] Warning if total yield > 100% (unusual, but possible):
  ```typescript
  {totalYield > 100 && (
    <Alert variant="warning">
      <AlertTriangleIcon />
      <AlertDescription>
        Total by-product yield exceeds 100%. This is unusual but allowed.
      </AlertDescription>
    </Alert>
  )}
  ```

### Task 8: Input Materials Table - Exclude By-Products (AC: 2.13.3)
- [ ] Input materials table columns (unchanged):
  - [ ] Sequence (drag handle)
  - [ ] Component Code
  - [ ] Component Name
  - [ ] Quantity
  - [ ] UoM
  - [ ] Scrap %
  - [ ] Effective Qty
  - [ ] Actions (Edit, Delete)
- [ ] Filter: only items where is_by_product = false

### Task 9: Production Integration Note (AC: 2.13.7)
- [ ] Add info banner in by-products section:
  ```typescript
  <Alert variant="info" className="mb-4">
    <InfoIcon className="w-4 h-4" />
    <AlertTitle>Production Integration</AlertTitle>
    <AlertDescription>
      During production (Epic 4), each by-product will automatically create a separate License Plate (LP) with the calculated output quantity based on yield %.
    </AlertDescription>
  </Alert>
  ```

### Task 10: Integration & Testing (AC: All)
- [ ] Unit tests:
  - [ ] CreateBOMItemSchema validation (yield_percent required if by-product)
  - [ ] calculateExpectedOutput function (various yields)
  - [ ] Total yield calculation (multiple by-products)
- [ ] Integration tests (lib/api/__tests__/bom-byproducts.test.ts):
  - [ ] POST BOM item with is_by_product = true → saved correctly
  - [ ] POST without yield_percent → validation error
  - [ ] GET BOM items → segregated into inputs/by-products
- [ ] E2E tests (__tests__/e2e/bom-byproducts.spec.ts):
  - [ ] Navigate to BOM detail page
  - [ ] Click "Add Item"
  - [ ] Toggle "By-Product" switch → yield % field appears
  - [ ] Enter yield % (15)
  - [ ] Submit → item saved as by-product
  - [ ] Verify item appears in "By-Products" section (not inputs)
  - [ ] Verify expected output calculated correctly (15 kg from 100 kg)
  - [ ] Add another by-product (5%) → total yield = 20%
  - [ ] Verify total yield displayed

### Task 11: Documentation & Cleanup
- [ ] Document by-products feature (admin guide)
- [ ] Add Epic 4 integration note (LP creation dla by-products)
- [ ] Update API documentation

## Dev Notes

### Technical Stack
- **Segregation**: Client-side filtering (is_by_product flag)
- **Calculation**: Client-side (expected output = output_qty * yield% / 100)
- **UI**: shadcn/ui (Collapsible, Alert, Switch, Badge)

### Key Technical Decisions
1. **By-Product Flag**: is_by_product boolean (simple, clear separation)
2. **Yield Percent**: Stored as decimal (5,2) - e.g., 15.50%
3. **Segregation**: Two separate sections (inputs vs by-products) dla clarity
4. **Unlimited By-Products**: No limit on number of by-products per BOM

### Production Integration (Epic 4)
```typescript
// Epic 4: WO Completion - Create LPs dla by-products
function createByProductLPs(wo: WorkOrder, bom: BOM) {
  const byProducts = bom.items.filter(item => item.is_by_product)

  for (const byProduct of byProducts) {
    const expectedQty = (wo.planned_qty * byProduct.yield_percent) / 100

    // Create LP dla by-product
    await createLP({
      product_id: byProduct.product_id,
      quantity: expectedQty,
      uom: byProduct.uom,
      wo_id: wo.id,
      location_id: wo.output_location_id,
      type: 'by_product'
    })
  }
}
```

### Security Considerations
- **Validation**: yield_percent required if is_by_product (enforced client + server)
- **RLS Policy**: By-products inherit org_id isolation via bom_id

### Project Structure
```
components/
  technical/
    BOMItemModal.tsx              # Updated with by-product toggle
    BOMItemsTable.tsx             # Updated with segregation
```

### Testing Strategy
**Unit Tests**: Validation schema, expected output calculation
**Integration Tests**: API endpoints, segregation logic
**E2E Tests**: Complete by-product flow (add, segregate, calculate)

### References
- [Source: docs/epics/epic-2-technical.md#Story-2.13]
- [Source: docs/sprint-artifacts/tech-spec-epic-2-batch-2b.md#By-Products]

### Prerequisites
**Story 2.7**: BOM Items Management (is_by_product, yield_percent columns)

### Dependencies
**Libraries:**
- shadcn/ui (Collapsible, Alert, Switch, Badge, Tooltip)

## Dev Agent Record
<!-- Will be filled during implementation -->

## Change Log
- 2025-01-23: Story drafted by Claude Code
