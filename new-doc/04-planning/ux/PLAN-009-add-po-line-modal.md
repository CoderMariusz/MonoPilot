# PLAN-009: Add PO Line Modal

**Module**: Planning
**Feature**: PO Line Item Management (FR-PLAN-006)
**Status**: Ready for Review
**Last Updated**: 2025-12-14

---

## ASCII Wireframe

### Success State - Desktop

```
+------------------------------------------------------------------+
|                        Add PO Line                           [X]  |
+------------------------------------------------------------------+
|                                                                    |
|  +---------- PRODUCT SELECTION ----------------------------------+ |
|  |                                                                | |
|  |  Product *                                                    | |
|  |  +----------------------------------------------------------+ | |
|  |  | [Search by product name or code...]                  [v] | | |
|  |  +----------------------------------------------------------+ | |
|  |                                                                | |
|  |  Search Results:                                              | |
|  |  +----------------------------------------------------------+ | |
|  |  | Flour Type A                                              | | |
|  |  | RM-FLOUR-001 | Raw Material | kg                         | | |
|  |  | Std Price: $1.20/kg | In Stock: 2,450 kg                  | | |
|  |  +----------------------------------------------------------+ | |
|  |  | Flour Type B (Organic)                                    | | |
|  |  | RM-FLOUR-002 | Raw Material | kg                         | | |
|  |  | Std Price: $1.50/kg | In Stock: 890 kg                    | | |
|  |  +----------------------------------------------------------+ | |
|  |  | Flour Whole Wheat                                         | | |
|  |  | RM-FLOUR-003 | Raw Material | kg                         | | |
|  |  | Std Price: $1.35/kg | In Stock: 1,200 kg                  | | |
|  |  +----------------------------------------------------------+ | |
|  |                                                                | |
|  +----------------------------------------------------------------+ |
|                                                                    |
|  +---------- SELECTED PRODUCT -----------------------------------+ |
|  |                                                                | |
|  |  [Check] Flour Type A (RM-FLOUR-001)                         | |
|  |                                                                | |
|  |  Category: Raw Material                                       | |
|  |  Base UoM: kg                                                 | |
|  |  Standard Price: $1.20 / kg                                   | |
|  |  Supplier Price: $1.15 / kg (Mill Co. contract)              | |
|  |                                                                | |
|  +----------------------------------------------------------------+ |
|                                                                    |
|  +---------- LINE DETAILS ---------------------------------------+ |
|  |                                                                | |
|  |  Quantity *                      Unit of Measure              | |
|  |  +---------------------+         +---------------------+      | |
|  |  | 500                 |         | kg (from product)   |      | |
|  |  +---------------------+         +---------------------+      | |
|  |                                                                | |
|  |  Unit Price *                    Tax Code                     | |
|  |  +---------------------+         +---------------------+      | |
|  |  | $1.15               |         | Standard 23%    [v] |      | |
|  |  +---------------------+         +---------------------+      | |
|  |  (Pre-filled: Supplier price)                                 | |
|  |                                                                | |
|  +----------------------------------------------------------------+ |
|                                                                    |
|  +---------- CALCULATED VALUES ----------------------------------+ |
|  |                                                                | |
|  |  Subtotal:          500 kg x $1.15 = $575.00                  | |
|  |  Tax (23%):                          $132.25                  | |
|  |  Line Total:                         $707.25                  | |
|  |                                                                | |
|  +----------------------------------------------------------------+ |
|                                                                    |
|  +---------- NOTES (Optional) -----------------------------------+ |
|  |                                                                | |
|  |  +----------------------------------------------------------+ | |
|  |  | Urgent delivery needed                                   | | |
|  |  +----------------------------------------------------------+ | |
|  |                                                                | |
|  +----------------------------------------------------------------+ |
|                                                                    |
|  +----------------------------------------------------------------+ |
|  |                                                                | |
|  |              [Cancel]      [Add Line]    [Add & Continue]     | |
|  |                                                                | |
|  +----------------------------------------------------------------+ |
|                                                                    |
+------------------------------------------------------------------+
```

### Edit Mode - Desktop

```
+------------------------------------------------------------------+
|                        Edit PO Line                          [X]  |
+------------------------------------------------------------------+
|                                                                    |
|  +---------- PRODUCT (Read-Only) --------------------------------+ |
|  |                                                                | |
|  |  Product: Flour Type A (RM-FLOUR-001)                         | |
|  |  Category: Raw Material | UoM: kg                             | |
|  |                                                                | |
|  +----------------------------------------------------------------+ |
|                                                                    |
|  +---------- LINE DETAILS (Editable) ----------------------------+ |
|  |                                                                | |
|  |  Quantity *                      Unit of Measure              | |
|  |  +---------------------+         +---------------------+      | |
|  |  | 600                 |         | kg (from product)   |      | |
|  |  +---------------------+         +---------------------+      | |
|  |  Original: 500 kg                                             | |
|  |                                                                | |
|  |  Unit Price *                    Tax Code                     | |
|  |  +---------------------+         +---------------------+      | |
|  |  | $1.10               |         | Standard 23%    [v] |      | |
|  |  +---------------------+         +---------------------+      | |
|  |  Original: $1.15 | [Reset to Supplier Price]                  | |
|  |                                                                | |
|  +----------------------------------------------------------------+ |
|                                                                    |
|  +---------- CALCULATED VALUES ----------------------------------+ |
|  |                                                                | |
|  |  Subtotal:          600 kg x $1.10 = $660.00                  | |
|  |  Tax (23%):                          $151.80                  | |
|  |  Line Total:                         $811.80                  | |
|  |                                                                | |
|  |  Change: +$104.55 from original                               | |
|  |                                                                | |
|  +----------------------------------------------------------------+ |
|                                                                    |
|  +---------- NOTES (Optional) -----------------------------------+ |
|  |                                                                | |
|  |  +----------------------------------------------------------+ | |
|  |  | Increased quantity per supplier recommendation           | | |
|  |  +----------------------------------------------------------+ | |
|  |                                                                | |
|  +----------------------------------------------------------------+ |
|                                                                    |
|  +----------------------------------------------------------------+ |
|  |                                                                | |
|  |              [Cancel]            [Save Changes]               | |
|  |                                                                | |
|  +----------------------------------------------------------------+ |
|                                                                    |
+------------------------------------------------------------------+
```

### Mobile View - Add Mode (<768px)

```
+----------------------------------+
|        Add PO Line          [X]  |
+----------------------------------+
|                                  |
|  Product *                       |
|  +----------------------------+  |
|  | [Search product...]   [v]  |  |
|  +----------------------------+  |
|                                  |
|  Results:                        |
|  +----------------------------+  |
|  | Flour Type A               |  |
|  | RM-FLOUR-001 | kg          |  |
|  | $1.20/kg | Stock: 2,450    |  |
|  +----------------------------+  |
|  | Flour Type B (Organic)     |  |
|  | RM-FLOUR-002 | kg          |  |
|  | $1.50/kg | Stock: 890      |  |
|  +----------------------------+  |
|                                  |
|  Selected:                       |
|  +----------------------------+  |
|  | [OK] Flour Type A          |  |
|  | RM-FLOUR-001               |  |
|  | Std: $1.20 | Supplier:$1.15|  |
|  +----------------------------+  |
|                                  |
|  Quantity *                      |
|  +----------------------------+  |
|  | 500                        |  |
|  +----------------------------+  |
|                                  |
|  Unit: kg (from product)         |
|                                  |
|  Unit Price *                    |
|  +----------------------------+  |
|  | $1.15                      |  |
|  +----------------------------+  |
|  (Supplier price)                |
|                                  |
|  Tax Code                        |
|  +----------------------------+  |
|  | Standard 23%          [v]  |  |
|  +----------------------------+  |
|                                  |
|  +----------------------------+  |
|  | Subtotal:      $575.00     |  |
|  | Tax (23%):     $132.25     |  |
|  | Line Total:    $707.25     |  |
|  +----------------------------+  |
|                                  |
|  Notes (optional)                |
|  +----------------------------+  |
|  |                            |  |
|  +----------------------------+  |
|                                  |
|  +----------------------------+  |
|  | [Cancel]      [Add Line]   |  |
|  +----------------------------+  |
|                                  |
+----------------------------------+
```

### Loading State (Product Search)

```
+------------------------------------------------------------------+
|                        Add PO Line                           [X]  |
+------------------------------------------------------------------+
|                                                                    |
|  +---------- PRODUCT SELECTION ----------------------------------+ |
|  |                                                                | |
|  |  Product *                                                    | |
|  |  +----------------------------------------------------------+ | |
|  |  | flour                                               [v]  | | |
|  |  +----------------------------------------------------------+ | |
|  |                                                                | |
|  |  Searching...                                                 | |
|  |  +----------------------------------------------------------+ | |
|  |  | [======================================]                  | | |
|  |  | [======================================]                  | | |
|  |  | [======================================]                  | | |
|  |  +----------------------------------------------------------+ | |
|  |                                                                | |
|  +----------------------------------------------------------------+ |
|                                                                    |
+------------------------------------------------------------------+
```

### Empty Search Results

```
+------------------------------------------------------------------+
|                        Add PO Line                           [X]  |
+------------------------------------------------------------------+
|                                                                    |
|  +---------- PRODUCT SELECTION ----------------------------------+ |
|  |                                                                | |
|  |  Product *                                                    | |
|  |  +----------------------------------------------------------+ | |
|  |  | xyzabc123                                           [v]  | | |
|  |  +----------------------------------------------------------+ | |
|  |                                                                | |
|  |  No products found                                            | |
|  |  +----------------------------------------------------------+ | |
|  |  |                                                          | | |
|  |  |   No products match "xyzabc123"                          | | |
|  |  |                                                          | | |
|  |  |   Try a different search term or                         | | |
|  |  |   [Create New Product]                                   | | |
|  |  |                                                          | | |
|  |  +----------------------------------------------------------+ | |
|  |                                                                | |
|  +----------------------------------------------------------------+ |
|                                                                    |
+------------------------------------------------------------------+
```

### Validation Error State

```
+------------------------------------------------------------------+
|                        Add PO Line                           [X]  |
+------------------------------------------------------------------+
|                                                                    |
|  +--------------------------------------------------------------+ |
|  |  [!] Please fix the following errors:                        | |
|  |      - Quantity must be greater than 0                       | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  +---------- PRODUCT SELECTION ----------------------------------+ |
|  |                                                                | |
|  |  [OK] Flour Type A (RM-FLOUR-001) selected                    | |
|  |                                                                | |
|  +----------------------------------------------------------------+ |
|                                                                    |
|  +---------- LINE DETAILS ---------------------------------------+ |
|  |                                                                | |
|  |  Quantity *                      Unit of Measure              | |
|  |  +---------------------+         +---------------------+      | |
|  |  | 0                   |         | kg (from product)   |      | |
|  |  +---------------------+         +---------------------+      | |
|  |  [!] Must be greater than 0                                   | |
|  |                                                                | |
|  |  Unit Price *                    Tax Code                     | |
|  |  +---------------------+         +---------------------+      | |
|  |  | $1.15               |         | Standard 23%    [v] |      | |
|  |  +---------------------+         +---------------------+      | |
|  |                                                                | |
|  +----------------------------------------------------------------+ |
|                                                                    |
+------------------------------------------------------------------+
```

### Duplicate Product Warning

```
+------------------------------------------------------------------+
|                        Add PO Line                           [X]  |
+------------------------------------------------------------------+
|                                                                    |
|  +---------- PRODUCT SELECTION ----------------------------------+ |
|  |                                                                | |
|  |  [OK] Flour Type A (RM-FLOUR-001) selected                    | |
|  |                                                                | |
|  |  +----------------------------------------------------------+ | |
|  |  | [!] Warning: This product is already on the PO           | | |
|  |  |                                                          | | |
|  |  | Line 1: Flour Type A - 500 kg @ $1.15                    | | |
|  |  |                                                          | | |
|  |  | Adding another line will create a duplicate.            | | |
|  |  | Consider editing the existing line instead.              | | |
|  |  |                                                          | | |
|  |  | [Edit Existing Line]  [Add Anyway]  [Choose Different]  | | |
|  |  +----------------------------------------------------------+ | |
|  |                                                                | |
|  +----------------------------------------------------------------+ |
|                                                                    |
+------------------------------------------------------------------+
```

---

## Key Components

### 1. Product Search Autocomplete

| Feature | Description |
|---------|-------------|
| **Search by** | Product name, product code/SKU |
| **Display per result** | Name, code, category, UoM, std price, in-stock qty |
| **Debounce** | 300ms delay before search |
| **Min chars** | 2 characters to trigger search |
| **Results limit** | 10 results max |
| **Keyboard** | Arrow keys to navigate, Enter to select |

### 2. Selected Product Display

| Field | Source | Display |
|-------|--------|---------|
| product_name | products.name | "Flour Type A" |
| product_code | products.code | "(RM-FLOUR-001)" |
| category | product_categories.name | "Raw Material" |
| base_uom | products.base_uom | "kg" |
| std_price | products.std_price | "$1.20 / kg" |
| supplier_price | supplier_products.unit_price | "$1.15 / kg (Mill Co. contract)" |

### 3. Line Details Fields

| Field | Type | Required | Source | Validation |
|-------|------|----------|--------|------------|
| product_id | Hidden | Yes | From selection | Must be valid UUID |
| quantity | Number input | Yes | User input | > 0 |
| uom | Display (read-only) | - | product.base_uom | - |
| unit_price | Number input | Yes | Auto-filled from supplier/product | >= 0 |
| tax_code_id | Dropdown | Yes | Inherited from PO header | Must exist in tax_codes |
| notes | Textarea | No | User input | Max 500 chars |

**Note**: tax_code_id defaults to PO header's tax_code_id but can be overridden per line.

### 4. Price Auto-Fill Logic

```typescript
// When product is selected
async function getUnitPrice(productId: string, supplierId: string): Promise<{
  price: number;
  source: 'supplier' | 'standard';
}> {
  // 1. Check supplier-specific price
  const supplierProduct = await db
    .from('supplier_products')
    .select('unit_price')
    .eq('supplier_id', supplierId)
    .eq('product_id', productId)
    .single();

  if (supplierProduct?.unit_price) {
    return {
      price: supplierProduct.unit_price,
      source: 'supplier'
    };
  }

  // 2. Fall back to product standard price
  const product = await db
    .from('products')
    .select('std_price')
    .eq('id', productId)
    .single();

  return {
    price: product.std_price,
    source: 'standard'
  };
}
```

### 5. Calculated Values

| Field | Calculation | Display |
|-------|-------------|---------|
| Subtotal | quantity * unit_price | "$575.00" |
| Tax | subtotal * (tax_rate / 100) | "$132.25" |
| Line Total | subtotal + tax | "$707.25" |

---

## Main Actions

### Modal Actions

| Action | Mode | Enabled When | Result |
|--------|------|--------------|--------|
| **Cancel** | Both | Always | Close modal, discard changes |
| **Add Line** | Add | Product selected + quantity > 0 | Add line, close modal |
| **Add & Continue** | Add | Product selected + quantity > 0 | Add line, reset form for another |
| **Save Changes** | Edit | Valid data | Save changes, close modal |
| **Reset to Supplier Price** | Edit | Price was manually changed | Reset unit_price to auto-filled value |

### Duplicate Warning Actions

| Action | Result |
|--------|--------|
| **Edit Existing Line** | Close modal, scroll to existing line in PO form |
| **Add Anyway** | Proceed with adding duplicate |
| **Choose Different** | Clear selection, return to product search |

---

## States

| State | Description | Elements Shown |
|-------|-------------|----------------|
| **Empty** | No product selected | Product search input only |
| **Searching** | Query in progress | Search input + skeleton results |
| **No Results** | Search returned empty | Empty state message + create link |
| **Product Selected** | Product chosen | Selected product card + line details form |
| **Duplicate Warning** | Product already on PO | Warning with options |
| **Validation Error** | Form has errors | Error banner + field errors |
| **Submitting** | Add/Save in progress | Disabled buttons + spinner |

---

## API Endpoints

### Search Products

**CRITICAL**: Use correct Technical module endpoint

```
GET /api/technical/products?search={term}&purchasable=true&limit=10

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid-flour",
      "code": "RM-FLOUR-001",
      "name": "Flour Type A",
      "category": "Raw Material",
      "base_uom": "kg",
      "std_price": 1.20,
      "available_qty": 2450
    },
    {
      "id": "uuid-flour-b",
      "code": "RM-FLOUR-002",
      "name": "Flour Type B (Organic)",
      "category": "Raw Material",
      "base_uom": "kg",
      "std_price": 1.50,
      "available_qty": 890
    },
    // ... more results
  ]
}
```

**Note**: The endpoint is `/api/technical/products` (not `/api/products/search`). Query parameter is `search` (not `q`). Filter `purchasable=true` to only show products that can be purchased.

### Get Supplier-Specific Price

```
GET /api/planning/suppliers/:supplierId/products/:productId

Response:
{
  "success": true,
  "data": {
    "product_id": "uuid-flour",
    "supplier_id": "uuid-supplier-1",
    "supplier_product_code": "SP-FLOUR-A",
    "unit_price": 1.15,
    "lead_time_days": 5,
    "moq": 100,
    "order_multiple": null,
    "last_purchase_date": "2024-11-15",
    "last_purchase_price": 1.12
  }
}
```

**Note**: This endpoint returns supplier-specific pricing from the `supplier_products` table. If no record exists, fall back to `products.std_price`.

### Add Line (from PLAN-005 context)

```
POST /api/planning/purchase-orders/:id/lines
Body: {
  "product_id": "uuid-flour",
  "quantity": 500,
  "unit_price": 1.15,
  "tax_code_id": "uuid-tax-23",
  "notes": "Urgent delivery needed"
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid-line-new",
    "line_number": 4,
    "product": {
      "id": "uuid-flour",
      "code": "RM-FLOUR-001",
      "name": "Flour Type A"
    },
    "quantity": 500,
    "uom": "kg",
    "unit_price": 1.15,
    "line_total": 575.00,
    "tax_code_id": "uuid-tax-23",
    "notes": "Urgent delivery needed"
  }
}
```

### Update Line (Edit Mode)

```
PUT /api/planning/purchase-orders/:id/lines/:lineId
Body: {
  "quantity": 600,
  "unit_price": 1.10,
  "tax_code_id": "uuid-tax-23",
  "notes": "Increased quantity per supplier recommendation"
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid-line-1",
    "line_number": 1,
    "quantity": 600,
    "unit_price": 1.10,
    "line_total": 660.00,
    "tax_code_id": "uuid-tax-23",
    "notes": "Increased quantity per supplier recommendation"
  }
}
```

---

## Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| product_id | Required | "Please select a product" |
| quantity | Required | "Quantity is required" |
| quantity | > 0 | "Quantity must be greater than 0" |
| quantity | Numeric | "Quantity must be a number" |
| quantity | Max 10 decimal places | "Too many decimal places" |
| unit_price | Required | "Unit price is required" |
| unit_price | >= 0 | "Unit price cannot be negative" |
| unit_price | Numeric | "Unit price must be a number" |
| tax_code_id | Required | "Tax code is required" |
| tax_code_id | Must exist in tax_codes | "Invalid tax code" |
| notes | Max 500 chars | "Notes cannot exceed 500 characters" |

---

## Zod Schema

```typescript
// lib/validation/planning/po-line-schema.ts
export const poLineSchema = z.object({
  product_id: z.string().uuid({ message: "Invalid product" }),
  quantity: z.number()
    .positive({ message: "Quantity must be greater than 0" })
    .max(999999999.9999999999, { message: "Quantity too large" }),
  unit_price: z.number()
    .min(0, { message: "Unit price cannot be negative" })
    .max(999999999.99, { message: "Unit price too large" }),
  tax_code_id: z.string().uuid({ message: "Invalid tax code" }),
  notes: z.string()
    .max(500, { message: "Notes cannot exceed 500 characters" })
    .optional()
    .nullable()
});
```

---

## Business Rules

### UoM Display
- UoM is read-only, inherited from product.base_uom
- Cannot be changed per line (PO always uses product's base UoM)

### Price Source Indication
- Show "(Supplier price)" when using supplier_products.unit_price
- Show "(Standard price)" when using products.std_price
- In Edit mode, show "(Manual)" if user changed the price

### Tax Code Inheritance
- Default to PO header's tax_code_id on Add
- User can override per line (dropdown)
- Tax code changes recalculate line_total immediately
- Tax code dropdown shows: name + rate (e.g., "Standard 23%")
- Tax rate is looked up from tax_codes table for calculation

### Duplicate Product Detection
- Check existing lines when product selected
- Show warning if product already exists on PO
- Allow user to proceed or edit existing

### Edit Mode Restrictions
- Product cannot be changed in Edit mode
- Only quantity, unit_price, tax_code_id, notes can be edited
- Show "Original" values for comparison

---

## Accessibility

### Touch Targets
- Product search results: 64dp height per item
- Input fields: 48dp height
- Action buttons: 48x48dp minimum
- Dropdown items: 48dp height

### Contrast
- Search results: 4.5:1
- Selected product: High contrast border
- Error messages: Red with 4.5:1 contrast

### Screen Reader
- Product search: "Product search, combobox, type to search"
- Results: "Search results, 3 items, use arrow keys to navigate"
- Selected product: "Selected: Flour Type A, code RM-FLOUR-001, standard price $1.20 per kilogram"
- Calculated values: "Subtotal: 575 dollars, Tax: 132 dollars 25 cents, Line total: 707 dollars 25 cents"

### Keyboard Navigation
- Tab: Move between fields
- Arrow keys: Navigate search results
- Enter: Select result, submit form
- Escape: Clear search, close dropdown, close modal

### Focus Management
- On modal open: Focus on product search
- On product select: Focus on quantity field
- On validation error: Focus on first errored field

---

## Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| Desktop (>1024px) | Centered modal (max 500px width), 2-column line details |
| Tablet (768-1024px) | Centered modal (90% width), 2-column line details |
| Mobile (<768px) | Full-screen, stacked layout |

### Mobile-Specific
- Product search takes full width
- Search results as full-width cards
- Line details stacked vertically
- "Add & Continue" button shown on separate row

---

## Performance Notes

### Product Search
- Debounce: 300ms
- Min characters: 2
- Results limit: 10
- Index on: (org_id, name, code) with trigram

### Price Lookup
- Called once on product selection
- Cached in component state

### Real-time Calculation
- Subtotal, tax, total calculated client-side
- No API calls for calculations

### Load Time Targets
- Modal open: <200ms
- Product search: <300ms
- Add line: <500ms

---

## Testing Requirements

### Unit Tests
- Price auto-fill logic (supplier vs standard)
- Line total calculation
- Duplicate product detection
- Validation rules (including tax_code_id)
- Tax calculation from tax_codes table

### Integration Tests
- GET /api/technical/products?search={term}
- GET /api/planning/suppliers/:supplierId/products/:productId
- POST /api/planning/purchase-orders/:id/lines
- PUT /api/planning/purchase-orders/:id/lines/:lineId

### E2E Tests
- Search product, select, add line
- Edit existing line, change quantity
- Duplicate product warning flow
- Validation error display
- Add & Continue flow (multiple lines)
- Mobile responsive layout
- Keyboard navigation through search results
- Tax code selection and calculation

---

## Quality Gates

Before handoff to FRONTEND-DEV:
- [x] Both modes defined (Add, Edit)
- [x] Product search with autocomplete specified
- [x] Price auto-fill logic documented
- [x] Validation rules complete
- [x] Duplicate product handling defined
- [x] API endpoints documented (corrected)
- [x] Accessibility requirements met
- [x] Responsive design documented
- [x] tax_code_id and notes fields documented
- [x] Tax code inheritance clarified

---

## Handoff to FRONTEND-DEV

```yaml
feature: Add/Edit PO Line Modal
story: PLAN-009
fr_coverage: FR-PLAN-006
approval_status:
  mode: "review_each"
  user_approved: false  # PENDING USER REVIEW
deliverables:
  wireframe: docs/3-ARCHITECTURE/ux/wireframes/PLAN-009-add-po-line-modal.md
  api_endpoints:
    - GET /api/technical/products?search={term}  # CORRECTED
    - GET /api/planning/suppliers/:supplierId/products/:productId
    - POST /api/planning/purchase-orders/:id/lines
    - PUT /api/planning/purchase-orders/:id/lines/:lineId
modes: [add, edit]
states_per_mode: [empty, searching, no_results, product_selected, duplicate_warning, validation_error, submitting]
breakpoints:
  mobile: "<768px (full-screen, stacked)"
  tablet: "768-1024px (90% width)"
  desktop: ">1024px (max 500px)"
accessibility:
  touch_targets: "48dp minimum (64dp for search results)"
  contrast: "4.5:1 minimum"
  keyboard: "Arrow keys for search, Tab for fields"
search_config:
  debounce: "300ms"
  min_chars: 2
  max_results: 10
related_screens:
  - PLAN-005: PO Create/Edit Modal (parent context)
integration_points:
  - Technical Module: Products catalog (search)
  - Planning Module: Supplier-product pricing
  - Settings Module: Tax codes
schema_file: lib/validation/planning/po-line-schema.ts
notes:
  - API endpoint corrected to /api/technical/products (not /api/products/search)
  - tax_code_id added to schema and validation
  - notes field documented (optional, max 500 chars)
  - Tax code inheritance from PO header clarified
```

---

**Status**: Ready for User Review
**Approval Mode**: review_each (default)
**User Approved**: Pending
**Iterations**: 0 of 3
**Estimated Effort**: 6-8 hours
**Quality Target**: 95/100 (improved from 88%)
