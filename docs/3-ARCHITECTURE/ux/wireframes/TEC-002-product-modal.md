# TEC-002: Product Create/Edit Modal

**Module**: Technical
**Feature**: Product Management
**Status**: Auto-Approved
**Last Updated**: 2025-12-11

---

## ASCII Wireframe

### Success State (Create Mode)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [X] Create Product                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  Basic Information                                                            │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                               │
│  Product Code (SKU) *                                                         │
│  [SKU-                          ]  ℹ️ Immutable after creation               │
│                                                                               │
│  Product Name *                                                               │
│  [                              ]                                             │
│                                                                               │
│  Description                                                                  │
│  [                                                          ]                 │
│  [                                                          ]                 │
│                                                                               │
│  Product Type *                                                               │
│  [ Select type...              ▼]                                            │
│    - Raw Material (RM)                                                        │
│    - Work in Progress (WIP)                                                   │
│    - Finished Goods (FG)                                                      │
│    - Packaging (PKG)                                                          │
│    - Byproduct (BP)                                                           │
│                                                                               │
│  Base Unit of Measure (UoM) *                                                 │
│  [ Select UoM...               ▼]  or [+ Add Custom UoM]                     │
│    - kg, L, pcs, m, m², m³, ton, g, ml                                        │
│                                                                               │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                               │
│  Identification & Barcodes                                                    │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                               │
│  Barcode (Internal)                                                           │
│  [                              ]  ℹ️ For internal scanning                  │
│                                                                               │
│  GTIN-14 (GS1 Barcode)                                                        │
│  [                              ]  ℹ️ For external shipments (optional)      │
│                                    Format: 12345678901234 (14 digits)         │
│                                                                               │
│  Category                                                                     │
│  [ Select category...          ▼]  or [+ Add New Category]                   │
│                                                                               │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                               │
│  Supplier & Procurement (Optional)                                            │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                               │
│  ☑ This product is purchased from supplier                                   │
│                                                                               │
│  Primary Supplier                                                             │
│  [ Select supplier...          ▼]  or [+ Add Supplier]                       │
│                                                                               │
│  Supplier Lead Time (days)          Minimum Order Quantity (MOQ)              │
│  [                 ]                [                 ]  [kg         ▼]       │
│                                                                               │
│  Standard Price                     Currency                                  │
│  [                 ]                [USD            ▼]                        │
│                                                                               │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                               │
│  Inventory & Stock Control                                                    │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                               │
│  Minimum Stock Level                Maximum Stock Level                       │
│  [                 ]  [kg      ▼]   [                 ]  [kg      ▼]         │
│                                                                               │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                               │
│  Shelf Life & Storage                                                         │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                               │
│  Expiry Policy                                                                │
│  [ Select policy...            ▼]                                             │
│    - Fixed (from production date)                                             │
│    - Rolling (from receipt date)                                              │
│    - None (no expiry)                                                         │
│                                                                               │
│  Shelf Life (days)                                                            │
│  [                 ]  ℹ️ Days from production/receipt to expiry               │
│                                                                               │
│  Storage Conditions                                                           │
│  [                                                          ]                 │
│  [                                                          ]                 │
│  Example: "Store at 2-8°C, Keep frozen, Room temperature"                    │
│                                                                               │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                               │
│  Status                                                                       │
│  ( ) Active   ( ) Inactive                                                    │
│                                                                               │
│                                                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                      [Cancel]  [Create Product]              │
└─────────────────────────────────────────────────────────────────────────────┘

* Required fields
```

### Success State (Edit Mode)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [X] Edit Product - SKU-001 (White Bread)                   Version: v4      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ⚠️ Editing this product will create version v5. Changes will not affect     │
│     existing BOMs or Work Orders.                     [View Version History] │
│                                                                               │
│  Basic Information                                                            │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                               │
│  Product Code (SKU) *                                                         │
│  [SKU-001                       ]  🔒 Locked (immutable)                     │
│                                                                               │
│  Product Name *                                                               │
│  [White Bread                   ]                                             │
│                                                                               │
│  Description                                                                  │
│  [Artisan white bread loaf                              ]                    │
│  [made with organic flour                               ]                    │
│                                                                               │
│  Product Type *                                                               │
│  [Finished Goods (FG)          ▼]  🔒 Locked (cannot change type)            │
│                                                                               │
│  Base Unit of Measure (UoM) *                                                 │
│  [pcs                          ▼]                                             │
│                                                                               │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                               │
│  Identification & Barcodes                                                    │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                               │
│  Barcode (Internal)                                                           │
│  [BR-001                        ]                                             │
│                                                                               │
│  GTIN-14 (GS1 Barcode)                                                        │
│  [98765432109876                ]  ✓ Valid GTIN-14                           │
│                                                                               │
│  Category                                                                     │
│  [Bread Products               ▼]                                             │
│                                                                               │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                               │
│  Supplier & Procurement                                                       │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                               │
│  ☐ This product is purchased from supplier                                   │
│     (Finished goods are typically manufactured, not purchased)                │
│                                                                               │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                               │
│  Inventory & Stock Control                                                    │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                               │
│  Minimum Stock Level                Maximum Stock Level                       │
│  [100              ]  [pcs     ▼]   [500              ]  [pcs     ▼]         │
│                                                                               │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                               │
│  Shelf Life & Storage                                                         │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                               │
│  Expiry Policy                                                                │
│  [Fixed (from production)      ▼]                                             │
│                                                                               │
│  Shelf Life (days)                                                            │
│  [7                ]  ℹ️ 7 days from production date                          │
│                                                                               │
│  Storage Conditions                                                           │
│  [Store at room temperature (15-25°C)                   ]                    │
│  [Keep in dry place, away from direct sunlight          ]                    │
│                                                                               │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                               │
│  Status                                                                       │
│  (•) Active   ( ) Inactive                                                    │
│                                                                               │
│  ⚠️ This product has 3 active BOMs. Setting to Inactive will require BOM     │
│     review.                                                                   │
│                                                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                      [Cancel]  [Save Changes (v4 → v5)]      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Loading State

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [X] Create Product                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│                          [⏳ Icon]                                            │
│                                                                               │
│                      Creating Product...                                      │
│                                                                               │
│       Please wait while we save your product information.                     │
│                                                                               │
│                          [████████░░] 80%                                     │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Error State

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [X] Create Product                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ⚠️ Unable to create product. Please fix the following errors:               │
│                                                                               │
│  Basic Information                                                            │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                               │
│  Product Code (SKU) *                                                         │
│  [SKU-001                       ]  ❌ SKU already exists in your organization │
│                                                                               │
│  Product Name *                                                               │
│  [                              ]  ❌ Product name is required                │
│                                                                               │
│  Product Type *                                                               │
│  [ Select type...              ▼]  ❌ Please select a product type           │
│                                                                               │
│  Base Unit of Measure (UoM) *                                                 │
│  [ Select UoM...               ▼]  ❌ Unit of measure is required             │
│                                                                               │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                               │
│  Identification & Barcodes                                                    │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                               │
│  GTIN-14 (GS1 Barcode)                                                        │
│  [1234567890123                 ]  ❌ Invalid GTIN-14 format (must be 14      │
│                                       digits with valid check digit)          │
│                                                                               │
│  (... rest of form ...)                                                       │
│                                                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                      [Cancel]  [Create Product]              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Empty State (N/A for Modal)

Modals don't have empty states - they're opened with intent to create/edit.

---

## Key Components

1. **Modal Container** - Width: lg (800px), max-height: 90vh, scrollable body
2. **Section Headers** - Dividers between logical field groups
3. **Form Fields** - Text inputs, dropdowns, textareas, radio buttons, checkboxes
4. **Required Indicators** - Red asterisk (*) for mandatory fields
5. **Help Icons** - ℹ️ tooltip for field explanations
6. **Locked Fields** - 🔒 icon for immutable fields (SKU, Type in edit mode)
7. **Validation Icons** - ✓ valid, ❌ error with message
8. **Warning Banners** - Yellow alert for version increment notice, BOM impact
9. **Version Display** - Current version shown in header (edit mode)
10. **Action Buttons** - Cancel (secondary), Create/Save (primary)

---

## Main Actions

### Primary
- **[Create Product]** (Create mode) - Validates form, creates product with version 1, closes modal, shows success toast, refreshes product list
- **[Save Changes]** (Edit mode) - Validates form, increments version, creates version history record, closes modal, shows success toast

### Secondary
- **[Cancel]** - Checks for unsaved changes, shows confirmation if dirty, closes modal
- **[X]** (Close button) - Same as Cancel
- **[View Version History]** (Edit mode) - Opens side panel with version timeline without closing modal
- **[+ Add Custom UoM]** - Opens mini-modal to create custom unit of measure
- **[+ Add New Category]** - Opens mini-modal to create product category
- **[+ Add Supplier]** - Opens supplier create modal (nested modal)

---

## States

- **Loading**: Form disabled, progress bar, "Creating/Updating Product..." message
- **Empty**: N/A (modal always has form)
- **Error**: Error banner at top, inline field errors (red border + message below field), focus on first error
- **Success**: Form with all fields, validation on blur, submit button enabled when valid

---

## Data Fields (All PRD Fields)

### Basic Information (Required Section)
| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| code | string | Yes | Unique per org, 2-50 chars, alphanumeric + dash | Immutable after creation |
| name | string | Yes | 2-255 chars | |
| description | text | No | Max 1000 chars | Multiline |
| product_type_id | UUID | Yes | Must exist in product_types | Immutable after creation |
| base_uom | string | Yes | Must be valid UoM | kg, L, pcs, etc. |

### Identification & Barcodes (Optional Section)
| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| barcode | string | No | Max 100 chars | Internal barcode |
| gtin | string | No | Exactly 14 digits, valid check digit | GTIN-14 GS1 format |
| category_id | UUID | No | Must exist if provided | Product category |

### Supplier & Procurement (Conditional Section)
| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| supplier_id | UUID | No | Must exist if provided | Primary supplier |
| supplier_lead_time_days | integer | No | Min 0, max 365 | Days |
| moq | decimal | No | Min 0, max 15 digits, 4 decimals | Minimum order quantity |
| std_price | decimal | No | Min 0, max 15 digits, 4 decimals | Standard price |

### Inventory & Stock Control (Optional Section)
| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| min_stock | decimal | No | Min 0, max 15 digits, 4 decimals | Must be <= max_stock |
| max_stock | decimal | No | Min 0, max 15 digits, 4 decimals | Must be >= min_stock |

### Shelf Life & Storage (Optional Section)
| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| expiry_policy | enum | No | fixed, rolling, none | Default: none |
| shelf_life_days | integer | No | Min 1, max 3650 (10 years) | Required if expiry_policy != none |
| storage_conditions | text | No | Max 500 chars | Multiline |

### Status (Required Section)
| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| status | enum | Yes | active, inactive | Default: active |

### Hidden/Auto Fields (Not in Form)
- **org_id**: Auto-set from current user's organization
- **version**: Auto-set to 1 on create, auto-incremented on edit
- **created_at**: Auto-timestamp
- **updated_at**: Auto-timestamp
- **created_by**: Auto-set from current user
- **updated_by**: Auto-set from current user

---

## Validation Rules

### Field-Level Validation (On Blur)
1. **SKU (code)**:
   - Required, 2-50 chars
   - Alphanumeric + dash only (regex: `^[A-Z0-9-]+$`)
   - Unique check via API debounced call
   - Show "SKU already exists" error if duplicate

2. **Product Name**:
   - Required, 2-255 chars
   - No special validation

3. **Product Type**:
   - Required
   - Immutable in edit mode (show locked icon)

4. **Base UoM**:
   - Required
   - Must be from predefined list or custom UoM

5. **GTIN-14**:
   - Optional
   - If provided: exactly 14 digits
   - Check digit validation (GS1 algorithm)
   - Show "Invalid GTIN-14" error with link to calculator

6. **Supplier Lead Time**:
   - Min 0, max 365
   - Integer only

7. **MOQ, Std Price, Min/Max Stock**:
   - Min 0
   - Max 15 digits, 4 decimal places
   - Decimal validation

8. **Shelf Life Days**:
   - Min 1, max 3650
   - Required if expiry_policy is "fixed" or "rolling"

9. **Min Stock / Max Stock**:
   - If both provided: min_stock <= max_stock
   - Show error on both fields if invalid

### Form-Level Validation (On Submit)
1. All required fields filled
2. All field-level validations passed
3. No duplicate SKU (final check)
4. Min stock <= Max stock
5. If expiry_policy != none, shelf_life_days required

### Edit Mode Warnings
1. **Version Increment**: Always show banner at top explaining version will increment
2. **Active BOMs**: If product has active BOMs, show count and warning about impact
3. **Status Change**: If changing to Inactive/Discontinued and active BOMs exist, show warning

---

## Permissions

| Role | Can Create | Can Edit | Can Edit All Fields |
|------|------------|----------|---------------------|
| Admin | Yes | All products | Yes |
| Production Manager | Yes | All products | Yes |
| Operator | No | No | No |
| Viewer | No | No | No |

---

## Accessibility

- **Touch targets**: All inputs and buttons >= 48x48dp
- **Labels**: All inputs have associated <label> tags
- **ARIA**: aria-required="true" for required fields, aria-invalid for errors
- **Focus management**: Focus first field on open, focus first error on validation fail
- **Keyboard**: Tab navigation, Enter to submit, Escape to cancel
- **Screen reader**: Error summary announced, field errors read with field

---

## Related Screens

- **TEC-001 Products List**: Returns here after create/edit
- **Supplier Create Modal**: Nested modal from [+ Add Supplier]
- **Category Create Modal**: Nested modal from [+ Add New Category]
- **Version History Panel**: Side panel from [View Version History] link

---

## Technical Notes

- **API Create**: `POST /api/technical/products` with all fields
- **API Update**: `PUT /api/technical/products/:id` with changed fields
- **Version Increment**: Backend auto-increments version, creates version_history record with changed_fields JSONB
- **SKU Uniqueness**: Check via `GET /api/technical/products?code={sku}` debounced 300ms
- **GTIN-14 Validation**: Client-side check digit algorithm + server-side validation
- **Immutable Fields**: SKU and Type locked in edit mode (disabled inputs, locked icon)
- **Default Values**: status=active, version=1 (create only), expiry_policy=none
- **Toast Notifications**: Success on create/edit, error on failure
- **Optimistic Updates**: Product list updated optimistically on success

---

## Business Rules

1. **SKU Immutability**: Once created, product SKU cannot be changed (prevents breaking references)
2. **Type Immutability**: Product type cannot change after creation (prevents BOM/inventory issues)
3. **Version Auto-Increment**: Every edit creates new version (v1 → v2 → v3, etc.)
4. **Version History**: All changes logged to product_version_history with changed_fields JSONB
5. **Allergen Auto-Calc**: If product has active BOM, allergens are auto-calculated (not editable here)
6. **Status Impact**: Setting to Inactive/Discontinued requires manual BOM review (shown in warning)
7. **GTIN Optional**: GTIN-14 not required for internal/WIP products, recommended for finished goods

---

## GS1 Compliance

- **GTIN-14 Format**: 14 digits with valid check digit
- **Check Digit Algorithm**: Modulo 10 (GS1 standard)
- **Validation**: Client-side + server-side check
- **Help Link**: Tooltip with link to GS1 GTIN calculator/validator
- **Optional Field**: GTIN not mandatory (internal products don't need it)

---

## Error Messages

| Scenario | Message | Action |
|----------|---------|--------|
| Duplicate SKU | "SKU already exists in your organization" | Change SKU |
| Empty required field | "{Field name} is required" | Fill field |
| Invalid GTIN-14 | "Invalid GTIN-14 format (must be 14 digits with valid check digit)" | Fix GTIN or clear |
| Min > Max stock | "Minimum stock cannot be greater than maximum stock" | Adjust values |
| Shelf life missing | "Shelf life is required when expiry policy is set" | Fill shelf life or change policy |
| Network error | "Unable to save product. Please check your connection." | Retry |

---

**Status**: Auto-Approved
**Approval Mode**: auto_approve
**User Approved**: true (explicit opt-in)
**Iterations**: 0 of 3
