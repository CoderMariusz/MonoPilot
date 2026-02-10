# UI Component Verification Report

**Date**: 2026-01-24
**Purpose**: Verify if "missing" UI components actually exist in deployed code

---

## Component 1: BOM Cost Summary

**Test**: TC-BOM-032, TC-BOM-033
**Test expects**: `[data-testid="cost-summary"]` or `.cost-summary`
**Page Object method**: `expectCostSummary()` (line 711-714 in BOMsPage.ts)

### Analysis

**Status**: EXISTS - BUT WRONG SELECTOR

**Location**: `apps/frontend/app/(authenticated)/technical/boms/[id]/page.tsx:471-473`

```tsx
{/* Costing Tab (Story 02.9) */}
<TabsContent value="costing">
  <CostSummary bomId={id} />
</TabsContent>
```

**Component Implementation**: `apps/frontend/components/technical/bom/cost/CostSummary.tsx`

```tsx
return (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle>Cost Summary</CardTitle>
      <RecalculateButton onClick={handleRecalculate} disabled={false} />
    </CardHeader>
    <CardContent>
      {/* ... content ... */}
    </CardContent>
  </Card>
)
```

**Actual Selector**: NO data-testid attribute exists
- Component renders a plain `<Card>` without any testid or class selector
- CardTitle text is "Cost Summary" (can be found by text)

**MISMATCH**: YES
- Test expects `[data-testid="cost-summary"]` - DOES NOT EXIST
- Test expects `.cost-summary` - DOES NOT EXIST
- Component only has `<Card>` wrapper without identifiers

**FIX OPTIONS**:
1. Add `data-testid="cost-summary"` to CostSummary.tsx
2. Update test to use text selector: `page.getByText('Cost Summary')`
3. Use role selector: `page.getByRole('heading', { name: 'Cost Summary' })`

---

## Component 2: Product Allergens Tab

**Test**: TC-PROD-024
**Test expects**: `page.getByRole('tab', { name: /allergen/i })`
**Page Object method**: `clickAllergensTab()` (line 575-578 in ProductsPage.ts)

### Analysis

**Status**: MISSING - NO ALLERGENS TAB EXISTS

**Location**: `apps/frontend/app/(authenticated)/technical/products/[id]/page.tsx:366-381`

**Actual Tabs Structure** (lines 367-381):
```tsx
<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsList className="mb-4">
    <TabsTrigger value="details">
      <Package className="mr-2 h-4 w-4" />
      Details
    </TabsTrigger>
    <TabsTrigger value="boms">
      <BookOpen className="mr-2 h-4 w-4" />
      BOMs ({boms.length})
    </TabsTrigger>
    <TabsTrigger value="history">
      <History className="mr-2 h-4 w-4" />
      Version History ({history.length})
    </TabsTrigger>
  </TabsList>
```

**Tabs Available**:
- Details (value="details")
- BOMs (value="boms")
- Version History (value="history")

**NO Allergens Tab** - The allergens section is rendered INSIDE the Details tab as a Card:
```tsx
{/* Lines 521-561 - Allergens Card inside Details TabsContent */}
<TabsContent value="details">
  ...
  {/* Allergens (Story 2.4) */}
  <Card>
    <CardHeader>
      <CardTitle className="text-lg flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-orange-500" />
        Allergens
      </CardTitle>
    </CardHeader>
    ...
  </Card>
```

**MISMATCH**: YES - COMPONENT STRUCTURE DIFFERENT FROM TEST EXPECTATION
- Test expects: `getByRole('tab', { name: /allergen/i })` - DOES NOT EXIST
- Actual: Allergens is a Card section inside the Details tab, NOT a separate tab

**FIX OPTIONS**:
1. Add Allergens as a separate tab (UI change)
2. Update test to NOT look for allergens tab - instead look for text "Allergens" in the Details tab content

---

## Component 3: Product Version History

**Test**: TC-PROD-020, TC-PROD-023
**Test expects**: Version history table on product detail

### Analysis

**Status**: EXISTS

**Location**: `apps/frontend/app/(authenticated)/technical/products/[id]/page.tsx:587-727`

**Tab Trigger** (line 377-380):
```tsx
<TabsTrigger value="history">
  <History className="mr-2 h-4 w-4" />
  Version History ({history.length})
</TabsTrigger>
```

**Tab Content** (lines 587-727):
```tsx
<TabsContent value="history">
  <Card>
    <CardHeader>
      <div className="flex justify-between items-center">
        <CardTitle className="text-lg">Version History</CardTitle>
        ...
      </div>
    </CardHeader>
    <CardContent>
      {/* History Timeline */}
      {history.length === 0 ? (
        <p className="text-gray-500 py-4">No version history yet...</p>
      ) : (
        <div className="space-y-4">
          ...
        </div>
      )}
    </CardContent>
  </Card>
</TabsContent>
```

**Actual Selector**: Tab can be found by:
- `getByRole('tab', { name: /version|history/i })` - WORKS
- `getByRole('tab', { name: /Version History/i })` - WORKS

**STATUS**: OK - Component exists and selector works

**NOTE**: Version history is NOT a table, it's a timeline view with div elements:
```tsx
{history.map((entry) => (
  <div key={entry.id} className="flex items-start gap-4 p-4 border rounded-lg">
    ...
  </div>
))}
```

Test may fail if it expects `<table>` element.

---

## Component 4: Routing Operations Section

**Test**: TC-RTG (various)
**Test expects**: Operations list/table on routing detail

### Analysis

**Status**: EXISTS

**Location**: `apps/frontend/app/(authenticated)/technical/routings/[id]/page.tsx:193-194`

```tsx
{/* Operations Section (AC-32: canEdit prop for permission enforcement) */}
<OperationsTable routingId={routingId} canEdit={canEdit} />
```

**Component Implementation**: `apps/frontend/components/technical/routings/operations-table.tsx`

**Structure**:
- Renders a `<Card>` with `<CardHeader>` containing "Operations" title
- Has "Add Operation" button (line 188-192)
- Renders a `<Table>` with operations (lines 203-298)

**Table Columns** (lines 206-214):
```tsx
<TableHeader>
  <TableRow>
    <TableHead className="w-[60px]">Seq</TableHead>
    <TableHead className="w-[200px]">Name</TableHead>
    <TableHead className="w-[150px]">Machine</TableHead>
    <TableHead className="w-[100px]">Duration</TableHead>
    <TableHead className="w-[80px]">Setup</TableHead>
    <TableHead className="w-[80px]">Yield</TableHead>
    <TableHead className="w-[100px]">Labor Cost/hr</TableHead>
    {canEdit && <TableHead className="w-[140px] text-right">Actions</TableHead>}
  </TableRow>
</TableHeader>
```

**Selectors that work**:
- `page.getByRole('button', { name: /Add Operation/i })` - WORKS
- `page.locator('table')` - WORKS (the operations table)

**STATUS**: OK - Component exists with standard table structure

---

## Component 5: By-Products UI (Add By-Product Button)

**Test**: TC-BOM-025, TC-BOM-026
**Test expects**: "Add By-Product" button
**Page Object method**: `clickAddByProduct()` (line 615-618 in BOMsPage.ts)

### Analysis

**Status**: MISSING AS SEPARATE BUTTON - BY-PRODUCTS USE SAME "Add Item" FLOW

**Location**: `apps/frontend/app/(authenticated)/technical/boms/[id]/page.tsx`

**Current Implementation** (lines 337-339):
```tsx
<CardTitle>BOM Items</CardTitle>
<Button onClick={() => setShowItemModal(true)}>
  <Plus className="mr-2 h-4 w-4" />
  Add Item
</Button>
```

**By-Products Rendering** (lines 406-460):
```tsx
{/* By-Products */}
{byProductItems.length > 0 && (
  <div>
    <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase">By-Products (Outputs)</h4>
    <Table>
      ...
    </Table>
  </div>
)}
```

**How By-Products Are Added**:
Looking at `BOMItemFormModal.tsx` (lines 368-378):
```tsx
{/* Options */}
<div className="space-y-3 pt-2">
  <div className="flex items-center space-x-2">
    <Checkbox
      id="is_output"
      checked={formData.is_output}
      onCheckedChange={(checked) => handleChange('is_output', checked === true)}
    />
    <Label htmlFor="is_output" className="text-sm font-normal cursor-pointer">
      Output Item (by-product or main output)
    </Label>
  </div>
```

**MISMATCH**: YES
- Test expects: `button:has-text("Add By-Product")` or similar - DOES NOT EXIST
- Actual: By-products are added via the same "Add Item" button with `is_output` checkbox checked
- Test expects: `[data-testid="by-products"]` or `.by-products-section` - DOES NOT EXIST
- Actual: By-products section has no testid, just `<h4>` with text "By-Products (Outputs)"

**FIX OPTIONS**:
1. Add `data-testid="by-products-section"` to the by-products div
2. Update test to find by-products via text: `page.getByText('By-Products (Outputs)')`
3. Update test flow to use "Add Item" + check "is_output" checkbox

---

## Summary

| Component | Status | Issue Type | Severity |
|-----------|--------|------------|----------|
| BOM Cost Summary | EXISTS | Missing data-testid | LOW |
| Product Allergens Tab | MISSING | UI structure mismatch | HIGH |
| Product Version History | EXISTS | Minor - timeline not table | LOW |
| Routing Operations | EXISTS | Works correctly | NONE |
| By-Products Button | MISSING | No separate button | MEDIUM |

### Components EXIST but wrong selectors: 2
- BOM Cost Summary (no data-testid)
- By-Products Section (no data-testid, different flow)

### Components MISSING (UI structure different): 1
- Product Allergens Tab (allergens is a card in Details, not a separate tab)

### Components OK: 2
- Version History Tab (exists, works)
- Routing Operations (exists, standard table)

---

## Recommended Fixes

### Priority 1: Fix Test Expectations (No Code Changes)

1. **TC-PROD-024 (Allergens Tab)**: Update test to NOT expect a tab. Instead:
   ```typescript
   // Change from:
   await productsPage.clickAllergensTab();
   const allergenTab = page.getByRole('tab', { name: /allergen/i });

   // To:
   // Navigate to details tab (default) and check for Allergens card
   const allergensCard = page.getByText('Allergens').first();
   await expect(allergensCard).toBeVisible();
   ```

2. **TC-BOM-032/033 (Cost Summary)**: Update selectors:
   ```typescript
   // Change from:
   const costCard = this.page.locator('[data-testid="cost-summary"], .cost-summary');

   // To (navigate to Costing tab first):
   await page.getByRole('tab', { name: /costing/i }).click();
   const costCard = page.getByRole('heading', { name: 'Cost Summary' });
   ```

3. **TC-BOM-025/026 (By-Products)**: Update flow:
   ```typescript
   // Change from:
   await bomsPage.clickAddByProduct();

   // To:
   await bomsPage.clickAddItem();
   // Then check the "is_output" checkbox in the modal
   await page.getByLabel('Output Item').check();
   ```

### Priority 2: Add data-testid Attributes (Code Changes)

1. Add to CostSummary.tsx:
   ```tsx
   <Card data-testid="cost-summary">
   ```

2. Add to BOM detail page by-products section:
   ```tsx
   <div data-testid="by-products-section">
   ```

### Priority 3: Consider UI Redesign (Product Discussion)

- Consider adding Allergens as a separate tab for better UX
- Consider adding "Add By-Product" button for clearer workflow
