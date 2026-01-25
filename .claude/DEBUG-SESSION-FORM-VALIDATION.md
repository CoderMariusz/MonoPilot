# Form Validation Debug Report

## Executive Summary

After thorough analysis of the actual form implementations (`ProductFormModal.tsx`, `BOMCreateModal.tsx`), their validation schemas (`product-schemas.ts`, `bom-schemas.ts`), and the corresponding Page Objects (`ProductsPage.ts`, `BOMsPage.ts`), I identified **multiple critical mismatches** that explain why form submit buttons stay disabled in 18+ tests.

---

## Part 1: Products Form Analysis

### 1.1 Field Name Comparison

| Field | Page Object Selector | Actual Form Field | Match? |
|-------|---------------------|-------------------|--------|
| Code | `input#code` | `<Input id="code">` | YES |
| Name | `input#name` | `<Input id="name">` | YES |
| Description | `textarea#description` | `<Textarea id="description">` | YES |
| Product Type | Complex ShadCN Select logic | ShadCN Select (no id/name) | PARTIAL |
| Base UoM | Complex ShadCN Select logic | ShadCN Select (no id/name) | PARTIAL |
| Status | Complex ShadCN Select logic | ShadCN Select (no id/name) | PARTIAL |
| Cost Per Unit | `input#cost_per_unit` | `<Input id="cost_per_unit">` | YES |
| Shelf Life Days | `input#shelf_life_days` | `<Input id="shelf_life_days">` | YES |

### 1.2 Critical Issues Found

#### ISSUE 1: ShadCN Select Components Have No `id` or `name` Attributes

**Actual Form (ProductFormModal.tsx lines 522-534):**
```tsx
<Select value={formData.product_type_id} onValueChange={(v) => handleChange('product_type_id', v)}>
  <SelectTrigger className={errors.product_type_id ? 'border-red-500' : ''}>
    <SelectValue placeholder="Select type" />
  </SelectTrigger>
  <SelectContent>
    {productTypes.filter(t => t.is_active).map((type) => (
      <SelectItem key={type.id} value={type.id}>
        {type.name} ({type.code})
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

**Page Object Assumption (ProductsPage.ts lines 336-343):**
```ts
const typeSection = modal.locator('div.space-y-2:has-text("Type"):has(button[role="combobox"])').first();
const typeSelectTrigger = typeSection.locator('button[role="combobox"]').first();
```

**Problem**: The Page Object correctly locates the combobox, BUT the actual Select options use UUIDs (`type.id`) not display codes like "RAW", "WIP", "FIN".

#### ISSUE 2: Type Mapping Mismatch

**Test Data (createProductData in technical.ts):**
```ts
export function createProductData(type: 'RAW' | 'WIP' | 'FIN' | 'PKG' = 'RAW') {
  return {
    code,
    name: `${type} Product ${Date.now()}`,
    type,  // <-- Passes "RAW", "WIP", "FIN", "PKG"
    base_uom: type === 'PKG' ? 'EA' : 'KG',
    ...
  };
}
```

**Page Object Type Mapping (ProductsPage.ts lines 320-328):**
```ts
const typeMap: Record<string, string> = {
  'RAW': 'Raw Material',
  'WIP': 'Work in Progress',
  'FIN': 'Finished Goods',
  'PKG': 'Packaging',
  'RM': 'Raw Material',
  'FG': 'Finished Goods',
};
const typeDisplayName = typeMap[data.type] || data.type;
```

**Problem**: The mapping is correct for display names, but the actual SelectItem values are **UUIDs**, not "Raw Material" or type codes. The `selectShadcnOption()` method searches by text content, which should work for matching display names in the dropdown.

**HOWEVER**: The form expects `product_type_id` to be a **UUID** for validation to pass!

#### ISSUE 3: Product Types Load Asynchronously

**Form Behavior (ProductFormModal.tsx lines 119-152):**
```tsx
useEffect(() => {
  const fetchProductTypes = async () => {
    try {
      setLoadingProductTypes(true)
      const response = await fetch('/api/technical/product-types')
      if (response.ok) {
        const data = await response.json()
        const types = data.types || data.data || []
        setProductTypes(types)
        // Set default product type if not in edit mode
        if (!product && types.length > 0) {
          setFormData(prev => {
            if (!prev.product_type_id) {
              const rmType = types.find((t: ProductType) => t.code === 'RM')
              if (rmType) {
                return { ...prev, product_type_id: rmType.id }
              }
            }
            return prev
          })
        }
      }
    } finally {
      setLoadingProductTypes(false)
    }
  }
  fetchProductTypes()
}, [])
```

**Page Object Wait Logic (ProductsPage.ts lines 293-301):**
```ts
// Wait for loading to finish - ProductFormModal shows "Loading types..." while fetching
await this.page.waitForFunction(() => {
  const loadingText = document.body.textContent;
  return !loadingText?.includes('Loading types...');
}, { timeout: 15000 });
```

**Problem**: This wait logic seems correct BUT:
1. If the API takes longer than expected, the wait might timeout
2. The form auto-selects "RM" type as default, but the test might try to select a different type before options are loaded

### 1.3 Validation Schema Analysis

**Required Fields (product-schemas.ts lines 12-39):**
```ts
const productBaseSchema = z.object({
  code: z.string()
    .min(2, 'Code must be at least 2 characters')
    .max(50, 'Code must be less than 50 characters')
    .regex(/^[A-Za-z0-9_-]+$/, 'Code must be alphanumeric with hyphens or underscores'),
  name: z.string()
    .min(1, 'Name is required')
    .max(255, 'Name must be less than 255 characters'),
  product_type_id: z.string().uuid('Invalid product type'),  // <-- MUST BE UUID!
  base_uom: z.string().min(1, 'Unit of Measure is required').max(20),
  // ... other fields are optional with defaults
})
```

**Critical Validation Requirements:**
1. `code`: min 2 chars, alphanumeric with hyphens/underscores - Test data uses `RAW-123456` format - PASS
2. `name`: min 1 char - Test data uses `RAW Product {timestamp}` - PASS
3. `product_type_id`: **MUST be valid UUID** - Test data passes "RAW" string - **FAIL**
4. `base_uom`: min 1 char - Test data uses "KG" or "EA" - PASS

### 1.4 Root Cause for Products Form

**PRIMARY ISSUE**: The `ProductData` interface in the Page Object uses `type: 'RAW' | 'WIP' | 'FIN' | 'PKG'` but the actual form validation requires `product_type_id` to be a **valid UUID**.

The Page Object's `fillProductForm()` method:
1. Opens the Type dropdown
2. Clicks an option matching "Raw Material" text
3. This correctly selects the option in the UI
4. The SelectItem's `value` is the type's UUID, which gets stored in `formData.product_type_id`

**ACTUAL PROBLEM**: The test is likely working correctly for type selection! Let me check if there's another issue...

**SECONDARY ISSUE**: The submit button check!

**Submit Button Logic (ProductFormModal.tsx line 771):**
```tsx
<Button
  onClick={handleSubmit}
  className="flex-1"
  disabled={submitting || (codeExists && !isEditMode)}
>
```

The submit button is **ONLY disabled if**:
1. `submitting` is true (form is being submitted)
2. `codeExists && !isEditMode` (duplicate code detected)

**There's NO `disabled={!isValid}` check!** The form validates on submit, not on field change.

**WAIT - This means the button should NOT be disabled by validation!**

Let me check the test...

**Test Code (products.spec.ts lines 171-187):**
```ts
test('TC-PROD-010: creates product with all required fields', async ({ page }) => {
  const productData = createProductData('RAW');
  await productsPage.clickAddProduct();
  await productsPage.fillProductForm(productData);
  await productsPage.submitCreateProduct();
  await productsPage.expectCreateSuccess();
  await productsPage.expectProductInList(productData.code);
});
```

**Submit Method (ProductsPage.ts lines 368-375):**
```ts
async submitCreateProduct() {
  const modal = this.page.locator('div.fixed.inset-0.bg-black\\/50').first();
  const submitButton = modal.locator('button:has-text("Create Product")').last();
  await submitButton.click();
  await this.waitForPageLoad();
}
```

**The issue is NOT that the button is disabled!** The test should be able to click the button. The validation happens ON SUBMIT.

**TRUE ROOT CAUSE**: When the form submits with invalid data, the `validateForm()` function (lines 278-313) fails validation and shows a toast error, but the test expects success!

### 1.5 Products Form - Missing Field Issue

Looking more carefully at `createProductData()`:

```ts
export function createProductData(type: 'RAW' | 'WIP' | 'FIN' | 'PKG' = 'RAW') {
  return {
    code,
    name: `${type} Product ${Date.now()}`,
    description: `Test ${type} product`,
    type,                              // <-- This maps to display name selection
    base_uom: type === 'PKG' ? 'EA' : 'KG',  // <-- This is filled
    cost_per_unit: Math.round(Math.random() * 100 * 100) / 100,
    // ... shelf_life_days and expiry_policy for perishables
  };
}
```

The `ProductData` interface in Page Object:
```ts
export interface ProductData {
  code: string;
  name: string;
  description?: string;
  type: 'RAW' | 'WIP' | 'FIN' | 'PKG';
  base_uom: string;
  cost_per_unit?: number;
  shelf_life_days?: number;
  is_perishable?: boolean;
  expiry_policy?: 'fifo' | 'fefo' | 'rolling' | 'none';
}
```

**The `fillProductForm` method** (lines 279-363) fills:
1. code - FILLED
2. name - FILLED
3. description - FILLED (if provided)
4. type (via Select) - FILLED by clicking dropdown option
5. base_uom (via Select) - FILLED by clicking dropdown option
6. cost_per_unit - FILLED (if provided)
7. shelf_life_days - FILLED (if provided)

**All required fields appear to be filled!**

---

## Part 2: BOMs Form Analysis

### 2.1 BOMCreateModal Architecture

The BOMCreateModal (1050 lines!) is a complex tabbed dialog:
- **Header Tab**: Product, Status, Dates, Output Qty/UoM, Notes
- **Components Tab**: Add/Edit component items
- **Advanced Tab**: Routing, Yield %, Packaging

### 2.2 Critical Issues Found

#### ISSUE 1: BOM Form REQUIRES At Least One Component

**Validation Logic (BOMCreateModal.tsx lines 426-431):**
```tsx
const inputItemsForValidation = items.filter(i => !i.is_output)
if (inputItemsForValidation.length === 0) {
  toast({ title: 'Error', description: 'Add at least one component', variant: 'destructive' })
  setActiveTab('items')
  return
}
```

**Submit Button State (lines 1039-1042):**
```tsx
<Button
  type="button"
  onClick={() => handleSave(false)}
  disabled={saving || !productId || inputItems.length === 0}  // <-- DISABLED IF NO ITEMS!
>
```

**Page Object Test Flow (boms.spec.ts TC-BOM-012):**
```ts
test('TC-BOM-012: should create BOM successfully', async ({ page }) => {
  await bomsPage.clickCreateBOM();
  await bomsPage.expectBOMFormOpen();
  await bomsPage.fillBOMForm({
    product_id: productData.code,
    effective_from: dates.effective_from,
    effective_to: dates.effective_to,
    output_qty: 50,
    output_uom: 'EA',
  });
  await bomsPage.submitCreateBOM();  // <-- WILL FAIL! No items added!
  await bomsPage.expectCreateSuccess();
});
```

**ROOT CAUSE**: The `fillBOMForm()` method fills header fields but **DOES NOT add any component items**! The submit button is disabled because `inputItems.length === 0`.

#### ISSUE 2: Page Object's fillBOMForm Does Not Add Components

**Page Object fillBOMForm (BOMsPage.ts lines 248-342):**
```ts
async fillBOMForm(data: BOMData) {
  // Fills product, dates, output qty/uom, routing
  // DOES NOT add any component items!
}
```

The tests that expect BOM creation to succeed are missing the step to add components:
1. Switch to Components tab
2. Click "Add Component"
3. Fill component form (component_id, quantity, uom)
4. Save item
5. THEN submit the BOM

#### ISSUE 3: Product Selection Uses Codes, Not IDs

**BOMCreateModal expects product selection by clicking option:**
```tsx
<Select value={productId} onValueChange={setProductId} disabled={isEditMode}>
  <SelectTrigger>
    <SelectValue placeholder="Select finished product..." />
  </SelectTrigger>
  <SelectContent>
    {products.map(p => (
      <SelectItem key={p.id} value={p.id}>  // <-- VALUE IS UUID!
        <div className="flex items-center gap-2">
          <Badge variant="outline">{p.type}</Badge>
          <span>{p.code}</span>
          <span className="text-gray-500">- {p.name}</span>
        </div>
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

**Page Object (BOMsPage.ts lines 260-275):**
```ts
const productSelect = dialog.locator('button[role="combobox"]').first();
await productSelect.click();
await this.page.waitForTimeout(200);

// Search for the product code/name and select it
const productOption = this.page.getByRole('option').filter({ hasText: new RegExp(data.product_id, 'i') });
if (await productOption.count() > 0) {
  await productOption.first().click();
}
```

**Analysis**: The Page Object searches by text content (`data.product_id` which is a code like "FIN-XXXXX"). This should work because the SelectItem displays `{p.code} - {p.name}` and clicking it sets `productId` to the UUID.

### 2.3 Validation Schema Analysis

**BOM Create Schema (bom-schemas.ts lines 21-36):**
```ts
export const CreateBOMSchema = z.object({
  product_id: z.string().uuid('Invalid product ID'),  // Required UUID
  effective_from: dateStringSchema.or(z.date()),       // Required date
  effective_to: dateStringSchema.or(z.date()).optional().nullable(),
  status: BOMStatusEnum.optional().default('draft'),
  output_qty: z.number().positive().optional().default(1.0),
  output_uom: z.string().min(1, 'Unit of measure is required'),  // Required
  // ... other optional fields
})
```

**BOM Item Schema (lines 139-150):**
```ts
export const CreateBOMItemSchema = z.object({
  component_id: z.string().uuid('Invalid component ID'),  // Required UUID
  operation_seq: z.number().int().positive().default(1),
  is_output: z.boolean().optional().default(false),
  quantity: z.number().positive('Quantity must be positive'),  // Required
  uom: z.string().min(1, 'UoM is required').max(10),  // Required
  // ... other optional fields
})
```

### 2.4 BOM Tests That Will Fail

| Test | Expected Behavior | Actual Problem |
|------|-------------------|----------------|
| TC-BOM-007 | Select product and dates | Works partially, but doesn't verify form state correctly |
| TC-BOM-009 | Set output qty/uom | Form field selectors may be wrong |
| TC-BOM-010 | Assign production lines | Production lines UI not in BOMCreateModal |
| TC-BOM-011 | Assign routing | Routing is in Advanced tab, test may not switch tabs |
| TC-BOM-012 | Create BOM successfully | **WILL FAIL** - No components added |

---

## Part 3: Fix Recommendations

### Priority 1: BOM Tests - Add Components Before Submit

**CRITICAL FIX**: Modify BOM creation tests to add at least one component:

```ts
test('TC-BOM-012: should create BOM successfully', async ({ page }) => {
  await bomsPage.clickCreateBOM();
  await bomsPage.expectBOMFormOpen();

  // Fill header
  await bomsPage.fillBOMForm({...});

  // ADD COMPONENT (missing step!)
  await bomsPage.clickAddItem();  // Switch to Components tab and open form
  await bomsPage.fillItemForm({
    component_id: 'RM-FLOUR-001',  // Must be valid product code
    quantity: 10,
    uom: 'KG',
    operation_seq: 1,
  });
  await bomsPage.submitAddItem();  // Save the item

  // NOW submit BOM
  await bomsPage.submitCreateBOM();
  await bomsPage.expectCreateSuccess();
});
```

### Priority 2: Update BOMsPage.fillBOMForm to Include Items Option

Add parameter to optionally add items:
```ts
async fillBOMForm(data: BOMData & { items?: BOMItemData[] }) {
  // ... fill header fields ...

  // Add items if provided
  if (data.items && data.items.length > 0) {
    for (const item of data.items) {
      await this.clickAddItem();
      await this.fillItemForm(item);
      await this.submitAddItem();
    }
  }
}
```

### Priority 3: Fix Product Type Selection Wait Logic

Ensure product types are loaded before selecting:
```ts
// Wait for product types to load
await this.page.waitForSelector('button[role="combobox"]:not([disabled])', { timeout: 15000 });
await this.page.waitForTimeout(500);  // Extra safety buffer

// Then select type
await this.selectShadcnOption(typeSelectTrigger, typeDisplayName);
```

### Priority 4: Fix Field Selector for BOM Tests

Several BOM tests look for `input[name="xxx"]` but the actual form uses different patterns:
- `input[name="product_id"]` - Doesn't exist (it's a Select)
- `input[name="output_qty"]` - Should be `input[type="number"]` in Output Quantity section
- `input[name="routing_id"]` - Doesn't exist (it's a Select in Advanced tab)

### Priority 5: Verify Test Data Uses Valid Product Codes

The tests use fixture data like `productFixtures.finishedGood()` which generates codes like `FIN-XXXXXX`. These products may not exist in the test database!

**Recommendation**: Either:
1. Seed the database with known products before tests
2. Create products as part of test setup
3. Use API to query existing products and use their codes

---

## Summary of Root Causes

### Products Form (Low Severity)
- Form validation happens on submit, not real-time
- Submit button is NOT disabled by validation state
- **No blocking issues found** - tests should work if selects are properly handled

### BOMs Form (High Severity)
1. **BLOCKING**: Submit button disabled when `inputItems.length === 0`
2. **BLOCKING**: No test adds component items before submitting
3. **MODERATE**: Field selectors don't match actual form structure
4. **MODERATE**: Tests assume products exist that may not be in database

### Affected Test Count
- Products: ~5 tests may have timing issues
- BOMs: ~15 tests will fail due to missing component items

---

## Recommended Fix Order

1. **Immediate**: Add component items to all BOM creation tests
2. **Soon**: Update `BOMsPage.fillBOMForm()` to support items parameter
3. **Soon**: Fix field selectors in BOM tests
4. **Later**: Add database seeding or product creation in test setup
5. **Later**: Improve wait logic for async-loaded dropdowns
