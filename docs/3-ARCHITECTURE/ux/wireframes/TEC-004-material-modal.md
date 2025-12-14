# TEC-004: Material Create/Edit Modal

**Module**: Technical
**Feature**: Material Management (Raw Materials)
**Status**: Auto-Approved
**Last Updated**: 2025-12-11

---

## ASCII Wireframe

### Success State (Create Mode)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [X] Create Material                                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ℹ️ Materials are raw materials (RM) purchased from suppliers. For other     │
│     product types, use the Products section.              [Create Product →] │
│                                                                               │
│  Basic Information                                                            │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                               │
│  Material Code *                                                              │
│  [RM-                           ]  ℹ️ Immutable after creation. Use RM-      │
│                                       prefix for consistency.                 │
│                                                                               │
│  Material Name *                                                              │
│  [                              ]                                             │
│                                                                               │
│  Description                                                                  │
│  [                                                          ]                 │
│  [                                                          ]                 │
│                                                                               │
│  Product Type                                                                 │
│  [Raw Material (RM)            ]  🔒 Locked for materials                    │
│                                                                               │
│  Base Unit of Measure (UoM) *                                                 │
│  [ Select UoM...               ▼]  or [+ Add Custom UoM]                     │
│    - kg, L, pcs, ton, g, ml, m, m²                                            │
│                                                                               │
│  Category                                                                     │
│  [ Select category...          ▼]  or [+ Add New Category]                   │
│    - Flour & Grains, Dairy, Seasonings, Oils & Fats, Packaging, etc.         │
│                                                                               │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                               │
│  Supplier & Procurement *                                                     │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                               │
│  Primary Supplier *                                                           │
│  [ Select supplier...          ▼]  or [+ Add New Supplier]                   │
│                                                                               │
│  Supplier Lead Time (days) *        Minimum Order Quantity (MOQ) *            │
│  [                 ]                [                 ]  [kg         ▼]       │
│                                                                               │
│  Standard Purchase Price            Currency                                  │
│  [                 ]                [USD            ▼]                        │
│                                                                               │
│  Supplier Part Number               Alternative Suppliers                    │
│  [                 ]                [+ Add Alternative Supplier]              │
│                                     (Optional: for multi-source procurement)  │
│                                                                               │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                               │
│  Inventory & Stock Control                                                    │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                               │
│  Minimum Stock Level *              Maximum Stock Level                       │
│  [                 ]  [kg      ▼]   [                 ]  [kg      ▼]         │
│  ℹ️ Used for auto-reorder alerts    ℹ️ Warehouse capacity limit              │
│                                                                               │
│  Reorder Point                      Reorder Quantity                          │
│  [                 ]  [kg      ▼]   [                 ]  [kg      ▼]         │
│  ℹ️ Trigger PO when stock drops     ℹ️ Default qty for auto-PO               │
│     below this level                                                          │
│                                                                               │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                               │
│  Identification & Barcodes                                                    │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                               │
│  Internal Barcode                                                             │
│  [                              ]  ℹ️ For warehouse scanning                 │
│                                                                               │
│  GTIN-14 (GS1 Barcode)                                                        │
│  [                              ]  ℹ️ Optional for raw materials             │
│                                    Format: 12345678901234 (14 digits)         │
│                                                                               │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                               │
│  Shelf Life & Storage *                                                       │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                               │
│  Expiry Policy *                                                              │
│  [ Select policy...            ▼]                                             │
│    - Fixed (from production date) - rare for RM                               │
│    - Rolling (from receipt date) - recommended for RM                         │
│    - None (no expiry)                                                         │
│                                                                               │
│  Shelf Life (days) *                                                          │
│  [                 ]  ℹ️ Days from receipt to expiry (for FEFO picking)       │
│                                                                               │
│  Storage Conditions *                                                         │
│  [                                                          ]                 │
│  [                                                          ]                 │
│  Example: "Store at 2-8°C", "Keep frozen below -18°C", "Dry place (RH<60%)"  │
│                                                                               │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                               │
│  Allergen Declaration                                                         │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                               │
│  ℹ️ Declare allergens present in this material. These will auto-propagate    │
│     to finished goods via BOM inheritance.                                    │
│                                                                               │
│  Contains Allergens:                                                          │
│  ☐ Gluten          ☐ Crustaceans   ☐ Eggs           ☐ Fish                   │
│  ☐ Peanuts         ☐ Soybeans      ☐ Milk           ☐ Nuts                   │
│  ☐ Celery          ☐ Mustard       ☐ Sesame         ☐ Sulphites              │
│  ☐ Lupin           ☐ Molluscs                                                 │
│                                                                               │
│  May Contain Allergens (Cross-contamination risk):                            │
│  ☐ Gluten          ☐ Crustaceans   ☐ Eggs           ☐ Fish                   │
│  ☐ Peanuts         ☐ Soybeans      ☐ Milk           ☐ Nuts                   │
│  ☐ Celery          ☐ Mustard       ☐ Sesame         ☐ Sulphites              │
│  ☐ Lupin           ☐ Molluscs                                                 │
│                                                                               │
│  [Clear All Allergens]                                                        │
│                                                                               │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                               │
│  Quality & Compliance (Optional)                                              │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                               │
│  ☐ Organic Certified                Certificate Number:                      │
│                                      [                    ]                   │
│                                                                               │
│  ☐ Kosher Certified                 Certificate Number:                      │
│                                      [                    ]                   │
│                                                                               │
│  ☐ Halal Certified                  Certificate Number:                      │
│                                      [                    ]                   │
│                                                                               │
│  ☐ GMO-Free                                                                   │
│                                                                               │
│  ☐ Gluten-Free Certified                                                      │
│                                                                               │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                               │
│  Status                                                                       │
│  (•) Active   ( ) Inactive                                                    │
│                                                                               │
│                                                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                      [Cancel]  [Create Material]             │
└─────────────────────────────────────────────────────────────────────────────┘

* Required fields
```

### Success State (Edit Mode)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [X] Edit Material - RM-001 (Wheat Flour)                   Version: v1      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ⚠️ Editing this material will create version v2. Changes will not affect    │
│     existing BOMs or Work Orders.                     [View Version History] │
│                                                                               │
│  Basic Information                                                            │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                               │
│  Material Code *                                                              │
│  [RM-001                        ]  🔒 Locked (immutable)                     │
│                                                                               │
│  Material Name *                                                              │
│  [Wheat Flour                   ]                                             │
│                                                                               │
│  Description                                                                  │
│  [Premium organic wheat flour                           ]                    │
│  [stone-ground, high protein content                    ]                    │
│                                                                               │
│  Product Type                                                                 │
│  [Raw Material (RM)            ]  🔒 Locked (cannot change type)             │
│                                                                               │
│  Base Unit of Measure (UoM) *                                                 │
│  [kg                           ▼]                                             │
│                                                                               │
│  Category                                                                     │
│  [Flour & Grains               ▼]                                             │
│                                                                               │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                               │
│  Supplier & Procurement                                                       │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                               │
│  Primary Supplier *                                                           │
│  [ABC Mills                    ▼]                                             │
│                                                                               │
│  Supplier Lead Time (days) *        Minimum Order Quantity (MOQ) *            │
│  [7                ]                [500              ]  [kg         ▼]       │
│                                                                               │
│  Standard Purchase Price            Currency                                  │
│  [1.50             ]                [USD            ▼]                        │
│                                                                               │
│  Supplier Part Number               Alternative Suppliers                    │
│  [ABC-WF-500                ]       • XYZ Mills (Lead: 10d, MOQ: 1000kg)     │
│                                     [+ Add Alternative Supplier]              │
│                                                                               │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                               │
│  Inventory & Stock Control                                                    │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                               │
│  Minimum Stock Level *              Maximum Stock Level                       │
│  [200              ]  [kg      ▼]   [2000             ]  [kg      ▼]         │
│                                                                               │
│  Reorder Point                      Reorder Quantity                          │
│  [300              ]  [kg      ▼]   [500              ]  [kg      ▼]         │
│                                                                               │
│  📊 Current Stock: 500 kg           Last Received: 2025-12-08 (3 days ago)   │
│                                                                               │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                               │
│  Identification & Barcodes                                                    │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                               │
│  Internal Barcode                                                             │
│  [WF-001                        ]                                             │
│                                                                               │
│  GTIN-14 (GS1 Barcode)                                                        │
│  [12345678901234                ]  ✓ Valid GTIN-14                           │
│                                                                               │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                               │
│  Shelf Life & Storage                                                         │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                               │
│  Expiry Policy *                                                              │
│  [Rolling (from receipt)       ▼]                                             │
│                                                                               │
│  Shelf Life (days) *                                                          │
│  [180              ]  ℹ️ 6 months from receipt                                │
│                                                                               │
│  Storage Conditions *                                                         │
│  [Store in cool, dry place (15-25°C)                    ]                    │
│  [Relative humidity <60%. Keep away from moisture.      ]                    │
│                                                                               │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                               │
│  Allergen Declaration                                                         │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                               │
│  Contains Allergens:                                                          │
│  ☑ Gluten          ☐ Crustaceans   ☐ Eggs           ☐ Fish                   │
│  ☐ Peanuts         ☐ Soybeans      ☐ Milk           ☐ Nuts                   │
│  ☐ Celery          ☐ Mustard       ☐ Sesame         ☐ Sulphites              │
│  ☐ Lupin           ☐ Molluscs                                                 │
│                                                                               │
│  May Contain Allergens:                                                       │
│  ☐ (none selected)                                                            │
│                                                                               │
│  ⚠️ This material is used in 5 BOMs. Allergen changes will trigger BOM       │
│     recalculation.                                      [View Affected BOMs]  │
│                                                                               │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                               │
│  Quality & Compliance                                                         │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                               │
│  ☑ Organic Certified                Certificate Number:                      │
│                                      [USDA-ORG-2024-1234 ]                    │
│                                                                               │
│  ☐ Kosher Certified                                                           │
│  ☐ Halal Certified                                                            │
│  ☑ GMO-Free                                                                   │
│  ☐ Gluten-Free Certified            (Cannot be gluten-free if contains        │
│                                      gluten allergen)                         │
│                                                                               │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                               │
│  Status                                                                       │
│  (•) Active   ( ) Inactive                                                    │
│                                                                               │
│                                                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                      [Cancel]  [Save Changes (v1 → v2)]      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Loading State

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [X] Create Material                                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│                          [⏳ Icon]                                            │
│                                                                               │
│                      Creating Material...                                     │
│                                                                               │
│       Please wait while we save your material information.                    │
│                                                                               │
│                          [████████░░] 80%                                     │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Error State

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [X] Create Material                                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ⚠️ Unable to create material. Please fix the following errors:              │
│                                                                               │
│  Basic Information                                                            │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                               │
│  Material Code *                                                              │
│  [RM-001                        ]  ❌ Material code already exists            │
│                                                                               │
│  Material Name *                                                              │
│  [                              ]  ❌ Material name is required               │
│                                                                               │
│  (... other fields ...)                                                       │
│                                                                               │
│  Supplier & Procurement                                                       │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                               │
│  Primary Supplier *                                                           │
│  [ Select supplier...          ▼]  ❌ Supplier is required for materials     │
│                                                                               │
│  Supplier Lead Time (days) *                                                  │
│  [                 ]                ❌ Lead time is required                  │
│                                                                               │
│  Minimum Order Quantity (MOQ) *                                               │
│  [                 ]                ❌ MOQ is required                        │
│                                                                               │
│  (... rest of form ...)                                                       │
│                                                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                      [Cancel]  [Create Material]             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Components

1. **Modal Container** - Width: lg (800px), max-height: 90vh, scrollable body
2. **Info Banner** - Blue banner explaining material scope, link to create product
3. **Section Headers** - Collapsible sections for field organization
4. **Form Fields** - Text inputs, dropdowns, textareas, checkboxes, radio buttons
5. **Required Indicators** - Red asterisk (*) for mandatory fields
6. **Help Icons** - ℹ️ tooltip for field explanations
7. **Locked Fields** - 🔒 icon for immutable fields (Code, Type in edit mode)
8. **Validation Icons** - ✓ valid, ❌ error with message
9. **Warning Banners** - Yellow alert for version increment, BOM impact, allergen changes
10. **Allergen Checkboxes** - 14 EU mandatory allergens in grid layout
11. **Current Stock Display** - Read-only info in edit mode
12. **Alternative Suppliers** - Dynamic list with add/remove
13. **Quality Certifications** - Checkboxes with conditional cert number fields
14. **Action Buttons** - Cancel (secondary), Create/Save (primary)

---

## Main Actions

### Primary
- **[Create Material]** (Create mode) - Validates form, creates product with type=RM and version 1, closes modal, shows success toast, refreshes material list
- **[Save Changes]** (Edit mode) - Validates form, increments version, creates version history record, recalculates BOM allergens if allergens changed, closes modal, shows success toast

### Secondary
- **[Cancel]** - Checks for unsaved changes, shows confirmation if dirty, closes modal
- **[X]** (Close button) - Same as Cancel
- **[View Version History]** (Edit mode) - Opens side panel with version timeline without closing modal
- **[View Affected BOMs]** (Edit mode) - Opens side panel with list of BOMs using this material
- **[+ Add Custom UoM]** - Opens mini-modal to create custom unit of measure
- **[+ Add New Category]** - Opens mini-modal to create product category
- **[+ Add New Supplier]** - Opens supplier create modal (nested modal)
- **[+ Add Alternative Supplier]** - Adds supplier row to alternative suppliers list
- **[Clear All Allergens]** - Unchecks all allergen checkboxes

---

## States

- **Loading**: Form disabled, progress bar, "Creating/Updating Material..." message
- **Empty**: N/A (modal always has form)
- **Error**: Error banner at top, inline field errors (red border + message below field), focus on first error
- **Success**: Form with all fields, validation on blur, submit button enabled when valid

---

## Data Fields (All Material-Specific Fields)

### Basic Information (Required Section)
| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| code | string | Yes | Unique per org, 2-50 chars, suggest RM- prefix | Immutable after creation |
| name | string | Yes | 2-255 chars | |
| description | text | No | Max 1000 chars | Multiline |
| product_type_id | UUID | Yes | Locked to "Raw Material (RM)" | Immutable, auto-set |
| base_uom | string | Yes | Must be valid UoM | kg, L, pcs, etc. |
| category_id | UUID | No | Must exist if provided | Material category |

### Supplier & Procurement (Required Section for Materials)
| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| supplier_id | UUID | Yes* | Must exist | *Required for materials |
| supplier_lead_time_days | integer | Yes* | Min 0, max 365 | *Required for materials |
| moq | decimal | Yes* | Min 0, max 15,4 decimals | *Required for materials |
| std_price | decimal | No | Min 0, max 15,4 decimals | Standard purchase price |
| supplier_part_number | string | No | Max 100 chars | Supplier's SKU |
| alternative_suppliers | array | No | Array of supplier_id + lead_time + moq | Multi-source procurement |

### Inventory & Stock Control (Required Section)
| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| min_stock | decimal | Yes* | Min 0, max 15,4 decimals | *Recommended for materials |
| max_stock | decimal | No | Min 0, must be >= min_stock | Warehouse capacity |
| reorder_point | decimal | No | Min 0, typically > min_stock | Trigger for auto-PO |
| reorder_quantity | decimal | No | Min 0, typically >= MOQ | Default PO quantity |

### Identification & Barcodes (Optional Section)
| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| barcode | string | No | Max 100 chars | Internal warehouse barcode |
| gtin | string | No | Exactly 14 digits, valid check digit | Optional for RM |

### Shelf Life & Storage (Required Section)
| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| expiry_policy | enum | Yes* | fixed, rolling, none | *Recommended "rolling" for RM |
| shelf_life_days | integer | Yes* | Min 1, max 3650 | *Required if policy != none |
| storage_conditions | text | Yes* | Max 500 chars | *Critical for quality/safety |

### Allergen Declaration (Optional Section)
| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| allergens_contains | array | No | Array of allergen_id (14 EU allergens) | "Contains" declaration |
| allergens_may_contain | array | No | Array of allergen_id (14 EU allergens) | "May contain" (cross-contam) |

### Quality & Compliance (Optional Section)
| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| is_organic | boolean | No | Default: false | Organic certified |
| organic_cert_number | string | No | Max 100 chars | Required if is_organic=true |
| is_kosher | boolean | No | Default: false | Kosher certified |
| kosher_cert_number | string | No | Max 100 chars | Required if is_kosher=true |
| is_halal | boolean | No | Default: false | Halal certified |
| halal_cert_number | string | No | Max 100 chars | Required if is_halal=true |
| is_gmo_free | boolean | No | Default: false | GMO-free |
| is_gluten_free_cert | boolean | No | Default: false | Gluten-free certified |

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
- **current_stock**: Display-only in edit mode (from warehouse module)

---

## Validation Rules

### Field-Level Validation (On Blur)
1. **Material Code**:
   - Required, 2-50 chars
   - Alphanumeric + dash only (regex: `^[A-Z0-9-]+$`)
   - Unique check via API debounced call
   - Show "Material code already exists" error if duplicate
   - Suggest RM- prefix for consistency

2. **Material Name**:
   - Required, 2-255 chars

3. **Product Type**:
   - Locked to "Raw Material (RM)" (auto-set, immutable)

4. **Base UoM**:
   - Required

5. **Supplier**:
   - Required for materials (enforced)
   - Show error if not selected

6. **Lead Time**:
   - Required for materials
   - Min 0, max 365 days
   - Integer only

7. **MOQ**:
   - Required for materials
   - Min 0, decimal allowed

8. **Min Stock / Max Stock**:
   - Min stock recommended (show info if empty)
   - If both provided: min_stock <= max_stock
   - Show error on both fields if invalid

9. **Reorder Point / Reorder Quantity**:
   - Optional
   - If reorder_point set, should be > min_stock (warning, not error)
   - If reorder_quantity set, should be >= MOQ (warning, not error)

10. **GTIN-14**:
    - Optional for RM
    - If provided: exactly 14 digits, check digit validation

11. **Expiry Policy**:
    - Recommended for materials (show info if "none" selected)
    - Default to "rolling" for RM

12. **Shelf Life Days**:
    - Required if expiry_policy != none
    - Min 1, max 3650

13. **Storage Conditions**:
    - Strongly recommended for materials (show warning if empty)
    - Max 500 chars

14. **Allergen Declaration**:
    - Optional but important
    - Cannot select same allergen in both "contains" and "may contain"
    - Show validation error if overlap

15. **Quality Certifications**:
    - If certification checkbox checked, cert number required (conditional validation)
    - Cannot be gluten-free certified if "Contains: Gluten" is checked

### Form-Level Validation (On Submit)
1. All required fields filled (including material-specific required fields)
2. All field-level validations passed
3. No duplicate material code (final check)
4. Min stock <= Max stock
5. Supplier selected
6. Lead time and MOQ provided
7. If expiry_policy != none, shelf_life_days required
8. If certification checkbox checked, cert number provided
9. No allergen overlap between "contains" and "may contain"

### Edit Mode Warnings
1. **Version Increment**: Always show banner at top explaining version will increment
2. **BOM Impact**: If material used in BOMs, show count and warning
3. **Allergen Changes**: If allergens changed and material in BOMs, show warning about BOM recalculation with link to affected BOMs
4. **Status Change**: If changing to Inactive/Discontinued and material in active BOMs, show warning

---

## Permissions

| Role | Can Create | Can Edit | Can Edit All Fields |
|------|------------|----------|---------------------|
| Admin | Yes | All materials | Yes |
| Production Manager | Yes | All materials | Yes |
| Operator | No | No | No |
| Viewer | No | No | No |

---

## Accessibility

- **Touch targets**: All inputs and buttons >= 48x48dp
- **Labels**: All inputs have associated <label> tags
- **ARIA**: aria-required="true" for required fields, aria-invalid for errors
- **Focus management**: Focus first field on open, focus first error on validation fail
- **Keyboard**: Tab navigation, Enter to submit, Escape to cancel, Space to toggle checkboxes
- **Screen reader**: Error summary announced, field errors read with field, allergen checkboxes in fieldset with legend

---

## Related Screens

- **TEC-003 Materials List**: Returns here after create/edit
- **TEC-001 Products List**: Link from info banner navigates here
- **Supplier Create Modal**: Nested modal from [+ Add New Supplier]
- **Category Create Modal**: Nested modal from [+ Add New Category]
- **Version History Panel**: Side panel from [View Version History] link
- **Affected BOMs Panel**: Side panel from [View Affected BOMs] link

---

## Technical Notes

- **API Create**: `POST /api/technical/products` with product_type=RM and all material fields
- **API Update**: `PUT /api/technical/products/:id` with changed fields
- **Version Increment**: Backend auto-increments version, creates version_history record
- **BOM Allergen Recalc**: If allergens changed, trigger async job to recalculate all BOMs using this material
- **Code Uniqueness**: Check via `GET /api/technical/products?code={code}` debounced 300ms
- **GTIN-14 Validation**: Client-side check digit algorithm + server-side validation
- **Immutable Fields**: Material code and type locked in edit mode
- **Default Values**: status=active, version=1, product_type=RM, expiry_policy=rolling (for RM)
- **Current Stock**: Fetched from warehouse module (license_plates aggregation), read-only display in edit mode
- **Alternative Suppliers**: Stored in separate junction table (supplier_products with is_primary flag)
- **Quality Certifications**: Stored as JSONB in product_certifications table or as boolean + cert_number fields
- **Toast Notifications**: Success on create/edit, error on failure, warning if allergens changed with BOM impact

---

## Business Rules

1. **Material Code Immutability**: Once created, material code cannot be changed
2. **Type Locked**: Product type locked to "Raw Material (RM)" for materials (cannot change)
3. **Supplier Required**: Unlike generic products, materials require a primary supplier
4. **Lead Time & MOQ Required**: Critical for MRP/procurement planning
5. **Min Stock Recommended**: Strong recommendation for reorder alerts (show info tooltip)
6. **Expiry Policy Recommended**: "Rolling" recommended for RM (from receipt date)
7. **Storage Conditions Critical**: Required for quality/safety (strong warning if empty)
8. **Allergen Auto-Propagation**: Material allergens auto-propagate to finished goods via BOM
9. **BOM Allergen Recalc**: Editing material allergens triggers BOM recalculation for all using BOMs
10. **Version History**: All changes logged with changed_fields JSONB
11. **Alternative Suppliers**: Optional multi-source procurement for supply chain resilience
12. **Quality Certifications**: Optional compliance tracking (organic, kosher, halal, GMO-free, gluten-free)

---

## GS1 Compliance

- **GTIN-14 Format**: 14 digits with valid check digit
- **Optional for RM**: GTIN not mandatory for raw materials (more common for finished goods)
- **Validation**: Client-side + server-side check digit verification
- **Help Link**: Tooltip with link to GS1 GTIN calculator/validator

---

## Material-Specific Features (vs Generic Product)

| Feature | Generic Product | Material (RM) |
|---------|----------------|---------------|
| **Supplier** | Optional | Required |
| **Lead Time** | Optional | Required |
| **MOQ** | Optional | Required |
| **Min Stock** | Optional | Strongly recommended |
| **Expiry Policy** | Optional | Recommended (rolling) |
| **Storage Conditions** | Optional | Critical (required) |
| **Allergen Declaration** | Optional | Important (propagates to FG) |
| **Quality Certifications** | Optional | Available (organic, kosher, etc.) |
| **Alternative Suppliers** | Not available | Available |
| **Reorder Point/Qty** | Not available | Available |
| **Current Stock Display** | Not shown | Shown in edit mode |
| **GTIN-14** | Optional | Optional (less common) |

---

## Error Messages

| Scenario | Message | Action |
|----------|---------|--------|
| Duplicate code | "Material code already exists in your organization" | Change code |
| Empty required field | "{Field name} is required" | Fill field |
| No supplier | "Primary supplier is required for materials" | Select supplier |
| No lead time | "Supplier lead time is required" | Fill lead time |
| No MOQ | "Minimum order quantity (MOQ) is required" | Fill MOQ |
| Invalid GTIN-14 | "Invalid GTIN-14 format (must be 14 digits with valid check digit)" | Fix GTIN or clear |
| Min > Max stock | "Minimum stock cannot be greater than maximum stock" | Adjust values |
| Allergen overlap | "Allergen cannot be in both 'Contains' and 'May contain' lists" | Choose one |
| Cert missing | "{Certification type} certificate number is required when certified" | Fill cert number |
| Gluten conflict | "Cannot be gluten-free certified if 'Contains: Gluten' is declared" | Uncheck one |
| Shelf life missing | "Shelf life is required when expiry policy is set" | Fill shelf life or change policy |
| Network error | "Unable to save material. Please check your connection." | Retry |

---

## Warnings (Non-blocking)

| Scenario | Warning Message | Recommendation |
|----------|-----------------|----------------|
| No min stock | "ℹ️ Minimum stock level recommended for reorder alerts" | Set min stock |
| Expiry policy none | "ℹ️ Expiry policy 'Rolling' recommended for raw materials" | Change to rolling |
| No storage conditions | "⚠️ Storage conditions are critical for material quality and safety" | Add storage info |
| Reorder point < min stock | "ℹ️ Reorder point typically set above minimum stock level" | Adjust reorder point |
| Reorder qty < MOQ | "ℹ️ Reorder quantity should typically be >= MOQ" | Adjust reorder qty |
| Allergen change with BOMs | "⚠️ This material is used in 5 BOMs. Allergen changes will trigger BOM recalculation." | Review affected BOMs |

---

**Status**: Auto-Approved
**Approval Mode**: auto_approve
**User Approved**: true (explicit opt-in)
**Iterations**: 0 of 3
