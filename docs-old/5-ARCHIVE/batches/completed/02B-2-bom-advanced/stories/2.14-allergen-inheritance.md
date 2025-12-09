# Story 2.14: Allergen Inheritance

Status: ready-for-dev

## Story

As a **Technical user**,
I want BOM to automatically inherit allergens from components,
So that allergen information is always accurate.

## Acceptance Criteria

### AC-2.14.1: Allergens Tab in BOM Detail
**Given** viewing BOM detail page
**When** clicking "Allergens" tab
**Then** tab shows rolled-up allergens calculated from all BOM items

**And** tab displays:
- BOM allergens (inherited from components)
- Product allergens (assigned to output product)
- Comparison/mismatch warning (if different)

### AC-2.14.2: Allergen Inheritance Calculation
**Given** BOM has 3 input items:
- Item 1 (Flour): Contains [Wheat, Gluten], May Contain [Soy]
- Item 2 (Milk): Contains [Milk, Lactose], May Contain []
- Item 3 (Eggs): Contains [Eggs], May Contain []

**Then** BOM inherited allergens:
- **Contains**: Union of all item Contains allergens
  → [Wheat, Gluten, Milk, Lactose, Eggs]
- **May Contain**: Union of all item May Contain allergens
  → [Soy]

**And** allergens displayed as badges:
- Contains: Red badges
- May Contain: Yellow badges

### AC-2.14.3: Allergen Mismatch Warning
**Given** BOM inherited allergens differ from Product allergens
**Example:**
- BOM inherited Contains: [Wheat, Milk, Eggs]
- Product assigned Contains: [Wheat, Milk]  (missing Eggs!)

**Then** warning banner displayed:
"⚠️ BOM allergens differ from product allergens. The BOM contains Eggs which is not listed on the product."

**And** warning actions:
- "Update Product Allergens" button
- "Dismiss" button (temporary, until page refresh)

### AC-2.14.4: Update Product Allergens Action
**When** clicking "Update Product Allergens" button
**Then** confirmation dialog appears:
"Update product allergens to match BOM?
- BOM Contains: [Wheat, Milk, Eggs]
- Product will be updated to: [Wheat, Milk, Eggs]"

**When** confirming
**Then** product_allergens updated to match BOM inherited allergens
**And** success toast: "Product allergens updated"
**And** warning banner dismissed

### AC-2.14.5: By-Products Excluded from Inheritance
**Given** BOM has by-products (is_by_product = true)
**Then** by-products excluded from allergen inheritance calculation
**And** only input materials (is_by_product = false) included

**Example:**
- Input 1: Flour (Contains: Wheat)
- Input 2: Milk (Contains: Milk)
- By-Product: Bread Crumbs (Contains: Wheat, Yeast)  ← Excluded

**BOM inherited allergens:** [Wheat, Milk] (not including Yeast from by-product)

### AC-2.14.6: Empty Allergens State
**Given** BOM items have no allergens assigned
**Then** show empty state:
"No allergens inherited from BOM items. This BOM is allergen-free."

**And** if Product has allergens assigned:
- Show info message: "Product has allergens assigned manually. Consider reviewing if they should be removed."

### AC-2.14.7: Real-Time Calculation
**Given** viewing Allergens tab
**When** adding/removing BOM items OR editing item allergens
**Then** allergen inheritance recalculated immediately
**And** UI updated without page refresh

## Tasks / Subtasks

### Task 1: API Endpoint dla Allergen Inheritance (AC: 2.14.2, 2.14.5)
- [ ] Implement GET /api/technical/boms/:id/allergens
  - [ ] Fetch BOM with items (JOIN bom_items, products)
  - [ ] Filter: only input materials (is_by_product = false)
  - [ ] Fetch product_allergens dla each item:
    ```sql
    SELECT DISTINCT allergen_id, relation_type
    FROM product_allergens
    WHERE product_id IN (SELECT product_id FROM bom_items WHERE bom_id = :bom_id AND is_by_product = false)
    ```
  - [ ] Aggregate allergens:
    ```typescript
    const contains = [...new Set(
      allergens.filter(a => a.relation_type === 'contains').map(a => a.allergen_id)
    )]
    const mayContain = [...new Set(
      allergens.filter(a => a.relation_type === 'may_contain').map(a => a.allergen_id)
    )]
    ```
  - [ ] Fetch product allergens dla BOM's output product
  - [ ] Compare BOM allergens vs Product allergens:
    ```typescript
    const mismatch = !isEqual(
      sortAllergens(bomAllergens),
      sortAllergens(productAllergens)
    )
    ```
  - [ ] Response:
    ```typescript
    interface BOMAllergens {
      bom_allergens: {
        contains: Allergen[]
        may_contain: Allergen[]
      }
      product_allergens: {
        contains: Allergen[]
        may_contain: Allergen[]
      }
      mismatch: boolean
      differences?: {
        added_contains: Allergen[]     // In BOM, not in Product
        removed_contains: Allergen[]   // In Product, not in BOM
        added_may_contain: Allergen[]
        removed_may_contain: Allergen[]
      }
    }
    ```
  - [ ] Cache: 5 min TTL
  - [ ] Invalidate cache on BOM items update

### Task 2: Allergens Tab Component (AC: 2.14.1)
- [ ] Update /app/technical/boms/[id]/page.tsx
- [ ] Add "Allergens" tab to Tabs:
  ```typescript
  <Tabs defaultValue="items">
    <TabsList>
      <TabsTrigger value="items">Items</TabsTrigger>
      <TabsTrigger value="allergens">Allergens</TabsTrigger>
      <TabsTrigger value="history">History</TabsTrigger>
    </TabsList>

    <TabsContent value="allergens">
      <BOMAllergensView bomId={params.id} />
    </TabsContent>
  </Tabs>
  ```
- [ ] Create components/technical/BOMAllergensView.tsx

### Task 3: BOM Allergens Display (AC: 2.14.2)
- [ ] Create components/technical/BOMAllergensView.tsx
- [ ] Fetch allergens data:
  ```typescript
  const { data, isLoading, error, mutate } = useSWR(
    `/api/technical/boms/${bomId}/allergens`,
    fetcher
  )
  ```
- [ ] Display 2 sections:
  ```typescript
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>BOM Inherited Allergens</CardTitle>
        <CardDescription>
          Calculated from all input materials in this BOM
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Contains</h4>
            <div className="flex flex-wrap gap-2">
              {data.bom_allergens.contains.map(allergen => (
                <Badge key={allergen.id} variant="destructive">
                  {allergen.name}
                </Badge>
              ))}
              {data.bom_allergens.contains.length === 0 && (
                <span className="text-sm text-muted-foreground">None</span>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">May Contain</h4>
            <div className="flex flex-wrap gap-2">
              {data.bom_allergens.may_contain.map(allergen => (
                <Badge key={allergen.id} variant="warning">
                  {allergen.name}
                </Badge>
              ))}
              {data.bom_allergens.may_contain.length === 0 && (
                <span className="text-sm text-muted-foreground">None</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Product Allergens</CardTitle>
        <CardDescription>
          Assigned to {product.name}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Similar display dla product allergens */}
      </CardContent>
    </Card>
  </div>
  ```

### Task 4: Mismatch Warning Banner (AC: 2.14.3)
- [ ] If data.mismatch = true, show warning:
  ```typescript
  {data.mismatch && (
    <Alert variant="warning" className="mb-4">
      <AlertTriangleIcon className="w-4 h-4" />
      <AlertTitle>Allergen Mismatch Detected</AlertTitle>
      <AlertDescription>
        BOM allergens differ from product allergens.
        {data.differences.added_contains.length > 0 && (
          <div className="mt-2">
            <strong>BOM contains allergens not on product:</strong>
            <ul className="list-disc pl-4">
              {data.differences.added_contains.map(a => (
                <li key={a.id}>{a.name}</li>
              ))}
            </ul>
          </div>
        )}
        {data.differences.removed_contains.length > 0 && (
          <div className="mt-2">
            <strong>Product has allergens not in BOM:</strong>
            <ul className="list-disc pl-4">
              {data.differences.removed_contains.map(a => (
                <li key={a.id}>{a.name}</li>
              ))}
            </ul>
          </div>
        )}
      </AlertDescription>
      <AlertFooter className="mt-4">
        <Button onClick={handleUpdateProductAllergens}>
          Update Product Allergens
        </Button>
        <Button variant="ghost" onClick={() => setDismissed(true)}>
          Dismiss
        </Button>
      </AlertFooter>
    </Alert>
  )}
  ```

### Task 5: Update Product Allergens Action (AC: 2.14.4)
- [ ] Implement PUT /api/technical/products/:id/allergens/sync-from-bom
  - [ ] Body: { bom_id: string }
  - [ ] Fetch BOM allergens (reuse calculation from GET /allergens)
  - [ ] Delete existing product_allergens dla this product
  - [ ] Insert new product_allergens matching BOM allergens:
    ```sql
    DELETE FROM product_allergens WHERE product_id = :product_id;

    INSERT INTO product_allergens (product_id, allergen_id, relation_type)
    SELECT :product_id, allergen_id, 'contains'
    FROM (SELECT DISTINCT allergen_id FROM bom_allergens_contains) AS contains_allergens
    UNION ALL
    SELECT :product_id, allergen_id, 'may_contain'
    FROM (SELECT DISTINCT allergen_id FROM bom_allergens_may_contain) AS may_contain_allergens;
    ```
  - [ ] Invalidate product allergens cache
  - [ ] Response: Updated product allergens
- [ ] Client-side handler:
  ```typescript
  const handleUpdateProductAllergens = async () => {
    const confirmed = await showConfirmDialog({
      title: 'Update Product Allergens?',
      description: `Product allergens will be updated to match BOM:
        Contains: ${data.bom_allergens.contains.map(a => a.name).join(', ')}
        May Contain: ${data.bom_allergens.may_contain.map(a => a.name).join(', ')}`,
      confirmText: 'Update',
      cancelText: 'Cancel'
    })

    if (confirmed) {
      await updateProductAllergens(product.id, { bom_id: bomId })
      toast.success('Product allergens updated')
      mutate()  // Refetch allergens data
    }
  }
  ```

### Task 6: Empty State (AC: 2.14.6)
- [ ] If no allergens inherited:
  ```typescript
  {data.bom_allergens.contains.length === 0 &&
   data.bom_allergens.may_contain.length === 0 && (
    <div className="flex flex-col items-center justify-center py-12">
      <CheckCircleIcon className="w-16 h-16 text-green-500 mb-4" />
      <p className="text-lg font-medium">Allergen-Free BOM</p>
      <p className="text-sm text-muted-foreground">
        No allergens inherited from BOM items
      </p>

      {data.product_allergens.contains.length > 0 && (
        <Alert variant="info" className="mt-4">
          <InfoIcon />
          <AlertDescription>
            Product has allergens assigned manually. Consider reviewing if they should be removed.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )}
  ```

### Task 7: Real-Time Recalculation (AC: 2.14.7)
- [ ] On BOM item add/edit/delete:
  ```typescript
  // In BOMItemModal, after successful item save:
  const handleItemSaved = async () => {
    await mutate(`/api/technical/boms/${bomId}/items`)  // Refetch items
    await mutate(`/api/technical/boms/${bomId}/allergens`)  // Refetch allergens
    toast.success('Item saved, allergens recalculated')
  }
  ```
- [ ] Use SWR's mutate dla instant UI update

### Task 8: Component-Level Allergen Breakdown (Optional, Nice-to-Have)
- [ ] Show which allergens come from which components:
  ```typescript
  <Collapsible>
    <CollapsibleTrigger>
      View Component Breakdown
    </CollapsibleTrigger>
    <CollapsibleContent>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Component</TableHead>
            <TableHead>Contains</TableHead>
            <TableHead>May Contain</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map(item => (
            <TableRow key={item.id}>
              <TableCell>{item.product.name}</TableCell>
              <TableCell>
                {item.product.allergens_contains.map(a => (
                  <Badge key={a.id} variant="destructive" className="mr-1">
                    {a.name}
                  </Badge>
                ))}
              </TableCell>
              <TableCell>
                {item.product.allergens_may_contain.map(a => (
                  <Badge key={a.id} variant="warning" className="mr-1">
                    {a.name}
                  </Badge>
                ))}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CollapsibleContent>
  </Collapsible>
  ```

### Task 9: Integration & Testing (AC: All)
- [ ] Unit tests:
  - [ ] Allergen union calculation (distinct allergens)
  - [ ] Mismatch detection (BOM vs Product)
  - [ ] By-products exclusion (only inputs counted)
- [ ] Integration tests (lib/api/__tests__/bom-allergen-inheritance.test.ts):
  - [ ] GET /api/technical/boms/:id/allergens → returns inherited allergens
  - [ ] Verify union logic (3 items → correct allergen list)
  - [ ] Verify mismatch detection (BOM ≠ Product → mismatch = true)
  - [ ] PUT /api/technical/products/:id/allergens/sync-from-bom → product updated
- [ ] E2E tests (__tests__/e2e/bom-allergen-inheritance.spec.ts):
  - [ ] Create BOM with 3 items (each with allergens)
  - [ ] Navigate to Allergens tab
  - [ ] Verify inherited allergens displayed (union of all)
  - [ ] Verify "Contains" badges (red) and "May Contain" badges (yellow)
  - [ ] Edit item allergen → verify allergens recalculated immediately
  - [ ] If mismatch → warning banner shown
  - [ ] Click "Update Product Allergens" → confirm dialog → success
  - [ ] Verify warning dismissed after update

### Task 10: Documentation & Cleanup
- [ ] Document allergen inheritance algorithm (admin guide)
- [ ] Update API documentation (allergen endpoints)
- [ ] Add UX screenshot (allergens tab)

## Dev Notes

### Technical Stack
- **Calculation**: API-side aggregation (SQL UNION DISTINCT)
- **Real-Time**: SWR mutate dla instant recalculation
- **UI**: shadcn/ui (Alert, Badge, Collapsible, Dialog)

### Key Technical Decisions
1. **Inheritance Algorithm**: Union of all input materials' allergens (set union, distinct)
2. **By-Products Exclusion**: Only is_by_product = false counted (outputs don't contribute to input allergens)
3. **Mismatch Detection**: Deep equality check between BOM and Product allergens
4. **Real-Time**: SWR revalidation on item changes (no manual refresh needed)

### Allergen Inheritance Algorithm
```typescript
// Pseudocode
function calculateBOMAllergens(bom: BOM): AllergenSet {
  const inputItems = bom.items.filter(item => !item.is_by_product)

  const contains = new Set<string>()
  const mayContain = new Set<string>()

  for (const item of inputItems) {
    for (const allergen of item.product.allergens) {
      if (allergen.relation_type === 'contains') {
        contains.add(allergen.allergen_id)
      } else if (allergen.relation_type === 'may_contain') {
        mayContain.add(allergen.allergen_id)
      }
    }
  }

  return {
    contains: Array.from(contains),
    may_contain: Array.from(mayContain)
  }
}
```

### Security Considerations
- **RLS Policy**: Allergen data inherits org_id isolation
- **Validation**: Update product allergens only if user has Technical role

### Project Structure
```
components/
  technical/
    BOMAllergensView.tsx          # Allergens tab component

app/
  api/
    technical/
      boms/
        [id]/
          allergens/
            route.ts              # GET /api/technical/boms/:id/allergens
      products/
        [id]/
          allergens/
            sync-from-bom/
              route.ts            # PUT /api/technical/products/:id/allergens/sync-from-bom
```

### Testing Strategy
**Unit Tests**: Union calculation, mismatch detection, by-products exclusion
**Integration Tests**: API endpoints, product allergen sync
**E2E Tests**: Complete allergen inheritance flow (calculate, compare, update)

### References
- [Source: docs/epics/epic-2-technical.md#Story-2.14]
- [Source: docs/sprint-artifacts/tech-spec-epic-2-batch-2b.md#Allergen-Inheritance]
- [Source: docs/sprint-artifacts/tech-spec-epic-2-batch-2b.md#Workflow-4]

### Prerequisites
**Story 2.7**: BOM Items Management
**Story 2.4** (Batch 2A): Product Allergen Assignment
**Story 1.9** (Epic 1): Allergen Management

### Dependencies
**None** - Uses existing product_allergens table

## Dev Agent Record
<!-- Will be filled during implementation -->

## Change Log
- 2025-01-23: Story drafted by Claude Code
