# SET-005: Onboarding Wizard - First Product & Work Order

**Module**: Settings
**Feature**: Onboarding Wizard (Story 1.12)
**Step**: 4-5 of 6 (Combined)
**Status**: Ready for Review
**Last Updated**: 2025-12-11

---

## Overview

Combined fourth and fifth steps of onboarding wizard. Creates organization's first product using industry templates (Bakery, Dairy, Beverage, etc.) and optionally creates a demo work order to show production flow. Two-tab interface: "Product Setup" (Step 4) and "Demo Order" (Step 5).

---

## ASCII Wireframe

### Success State - Tab 1: Product Setup

```
┌─────────────────────────────────────────────────────────────┐
│  MonoPilot Onboarding Wizard                    [4/6]  66%  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Steps 4-5: First Product & Demo Work Order                  │
│                                                               │
│  [Product Setup] [Demo Order]                                │
│  ▔▔▔▔▔▔▔▔▔▔▔▔▔                                                │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Industry Template                                      │ │
│  │                                                         │ │
│  │  Select your primary product category:                 │ │
│  │                                                         │ │
│  │  ◉ Bakery (Bread, Pastries, Cakes)                     │ │
│  │  ○ Dairy (Cheese, Yogurt, Milk)                        │ │
│  │  ○ Beverages (Juice, Soda, Water)                      │ │
│  │  ○ Meat & Poultry (Fresh, Processed)                   │ │
│  │  ○ Sauces & Condiments                                 │ │
│  │  ○ Snacks & Confectionery                              │ │
│  │  ○ Generic (Custom product)                            │ │
│  │                                                         │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Product Details (Bakery Template)                      │ │
│  │                                                         │ │
│  │  Product SKU *                                          │ │
│  │  [BREAD-001____________]  Auto-generated                │ │
│  │                                                         │ │
│  │  Product Name *                                         │ │
│  │  [Whole Wheat Bread - 500g_____________________]        │ │
│  │                                                         │ │
│  │  Product Type *          Unit of Measure *              │ │
│  │  [Finished Good ▼]       [EA (Each) ▼]                  │ │
│  │                                                         │ │
│  │  Net Weight              Shelf Life (days)              │ │
│  │  [500____] g             [7_____]                       │ │
│  │                                                         │ │
│  │  Storage Temperature                                    │ │
│  │  [Room Temperature (15-25°C) ▼]                         │ │
│  │                                                         │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  [◀ Back]      [Skip Product]               [Next: Demo Order →]  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Success State - Tab 2: Demo Order

```
┌─────────────────────────────────────────────────────────────┐
│  MonoPilot Onboarding Wizard                    [5/6]  83%  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Steps 4-5: First Product & Demo Work Order                  │
│                                                               │
│  [Product Setup] [Demo Order]                                │
│                  ▔▔▔▔▔▔▔▔▔▔                                   │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Optional: Create Demo Work Order                       │ │
│  │                                                         │ │
│  │  Want to see how production works? We'll create a       │ │
│  │  sample work order for "Whole Wheat Bread - 500g".      │ │
│  │                                                         │ │
│  │  ☑ Create demo work order                               │ │
│  │                                                         │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Demo Order Details (Enabled)                           │ │
│  │                                                         │ │
│  │  Work Order Number                                      │ │
│  │  [WO-DEMO-001_____]  Auto-generated                     │ │
│  │                                                         │ │
│  │  Product                                                │ │
│  │  [Whole Wheat Bread - 500g] (From Step 4)               │ │
│  │                                                         │ │
│  │  Planned Quantity                                       │ │
│  │  [100____] EA                                           │ │
│  │                                                         │ │
│  │  Production Line                                        │ │
│  │  [PROD-01 (Production Floor) ▼]                         │ │
│  │                                                         │ │
│  │  Start Date                  Due Date                   │ │
│  │  [2025-12-12___]             [2025-12-13___]            │ │
│  │                                                         │ │
│  │  ℹ This work order will be created in DRAFT status.     │ │
│  │    You can start it from the Production module.         │ │
│  │                                                         │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  [◀ Back]      [Skip Demo Order]            [Complete Setup →]  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Loading State

```
┌─────────────────────────────────────────────────────────────┐
│  MonoPilot Onboarding Wizard                    [4/6]  66%  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│                      [Spinner]                                │
│                                                               │
│                Loading product templates...                   │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  [Skeleton: Radio buttons]                              │ │
│  │  [Skeleton: Form fields]                                │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Error State

```
┌─────────────────────────────────────────────────────────────┐
│  MonoPilot Onboarding Wizard                    [4/6]  66%  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Steps 4-5: First Product & Demo Work Order                  │
│                                                               │
│  [Product Setup] [Demo Order]                                │
│  ▔▔▔▔▔▔▔▔▔▔▔▔▔                                                │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  ⚠ Please fix the following errors:                     │ │
│  │                                                         │ │
│  │  • Product SKU "BREAD-001" already exists               │ │
│  │  • Product name is required                             │ │
│  │  • Shelf life must be between 1-365 days                │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Product Details                                        │ │
│  │                                                         │ │
│  │  Product SKU * ⚠ Duplicate                              │ │
│  │  [BREAD-001____]  Suggested: [BREAD-002▼] [WW-500▼]     │ │
│  │                                                         │ │
│  │  Product Name * ⚠ Required                              │ │
│  │  [________________________________]                      │ │
│  │                                                         │ │
│  │  Shelf Life (days) ⚠ Invalid range                      │ │
│  │  [999___]  Must be 1-365                                │ │
│  │                                                         │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  [◀ Back]      [Skip Product]               [Next: Demo Order →]  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Empty State

```
┌─────────────────────────────────────────────────────────────┐
│  MonoPilot Onboarding Wizard                    [5/6]  83%  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Steps 4-5: First Product & Demo Work Order                  │
│                                                               │
│  [Product Setup] [Demo Order]                                │
│                  ▔▔▔▔▔▔▔▔▔▔                                   │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              ⚠ No Product Created                        │ │
│  │                                                         │ │
│  │  You need to create a product before setting up a       │ │
│  │  demo work order.                                       │ │
│  │                                                         │ │
│  │  Please go back to "Product Setup" tab or skip this     │ │
│  │  step to complete the wizard.                           │ │
│  │                                                         │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  [◀ Back to Product]                        [Skip Demo Order]  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Components

### 1. Progress Tracker
- **Display**: "4/6" (66%) on Product tab, "5/6" (83%) on Demo Order tab
- **Purpose**: Show wizard progress
- **Color**: Blue (in progress)

### 2. Tab Navigation
- **Tabs**: "Product Setup" (Step 4) | "Demo Order" (Step 5)
- **Behavior**: Click to switch, OR auto-advance on "Next"
- **Validation**: Product tab must be valid before Demo Order tab enabled

### 3. Industry Template Selector (Tab 1)
- **Type**: Radio button group
- **Options**: Bakery, Dairy, Beverages, Meat, Sauces, Snacks, Generic
- **Behavior**: Pre-fill product fields based on template

### 4. Product Form (Tab 1)
- **Fields**:
  - SKU: Auto-generated from template (e.g., BREAD-001)
  - Name: Template-based default, editable
  - Type: Finished Good, Raw Material, Packaging
  - UoM: EA, KG, L, etc.
  - Net Weight, Shelf Life, Storage Temp
- **Pre-fill**: Based on selected industry template

### 5. Demo Order Toggle (Tab 2)
- **Type**: Checkbox "Create demo work order"
- **Default**: Checked (recommended)
- **Behavior**: Enable/disable demo order form below

### 6. Demo Order Form (Tab 2)
- **Fields**:
  - WO Number: Auto-generated (WO-DEMO-001)
  - Product: From Step 4 (read-only)
  - Quantity: Default 100 EA
  - Production Line: Dropdown (from Step 3 locations)
  - Start/Due Date: Today + 1 day
- **Disabled**: If checkbox unchecked

---

## Main Actions

### Primary Actions
- **Button** (Tab 1): "Next: Demo Order →"
  - Validate product fields
  - Save to `wizard_progress.step4`
  - Switch to Tab 2
- **Button** (Tab 2): "Complete Setup →"
  - Validate demo order (if enabled)
  - Save to `wizard_progress.step5`
  - Navigate to Step 6 (Completion)

### Secondary Actions
- **Button**: "◀ Back"
  - Tab 1: Return to Step 3 (Locations)
  - Tab 2: Switch to Tab 1 (Product Setup)
- **Button**: "Skip Product" (Tab 1)
  - Skip product creation, go directly to Tab 2 (disabled state)
- **Button**: "Skip Demo Order" (Tab 2)
  - Skip work order, proceed to Step 6

---

## State Transitions

```
Step 3 (Locations)
  ↓ [Next]
LOADING (Load product templates)
  ↓ Success
SUCCESS (Tab 1: Product Setup with Bakery template)
  ↓ Select template
SUCCESS (Update product fields)
  ↓ [Next: Demo Order]
  ↓ Validate product
  ↓ Success
SUCCESS (Tab 2: Demo Order with checkbox checked)
  ↓ [Complete Setup]
  ↓ Validate demo order
  ↓ Success
Step 6 (Completion)

OR

SUCCESS (Tab 1)
  ↓ [Next]
  ↓ Validation fails
ERROR (Show SKU duplicate + suggestions)
  ↓ Fix SKU, [Next]
SUCCESS (Tab 2)

OR

SUCCESS (Tab 2)
  ↓ Uncheck "Create demo order"
SUCCESS (Tab 2 form disabled)
  ↓ [Complete Setup]
Step 6 (no demo order created)
```

---

## Validation

### Product Validation (Tab 1)
```typescript
{
  template: z.enum(['bakery', 'dairy', 'beverages', 'meat', 'sauces', 'snacks', 'generic']),
  sku: z.string().min(2).max(50).regex(/^[A-Z0-9-]+$/),
  name: z.string().min(2).max(200),
  type: z.enum(['FINISHED_GOOD', 'RAW_MATERIAL', 'PACKAGING', 'WIP']),
  uom: z.string(), // EA, KG, L, etc.
  net_weight: z.number().positive().optional(),
  shelf_life_days: z.number().int().min(1).max(365).optional(),
  storage_temp: z.string().optional()
}
```

### Demo Order Validation (Tab 2)
```typescript
{
  create_demo: z.boolean(),
  wo_number: z.string().min(2).max(50).optional(), // if create_demo = true
  product_id: z.string().uuid().optional(), // from step4
  quantity: z.number().positive().optional(),
  production_line_id: z.string().uuid().optional(), // from step3
  start_date: z.date().optional(),
  due_date: z.date().optional()
}
```

### SKU Uniqueness Check
```sql
SELECT COUNT(*) FROM products
WHERE org_id = :org_id AND sku = :sku;
-- Must return 0
```

---

## Data Saved

Steps 4-5 save to `organizations.wizard_progress`:
```json
{
  "step": 5,
  "step4": {
    "template": "bakery",
    "product_sku": "BREAD-001",
    "product_name": "Whole Wheat Bread - 500g",
    "product_type": "FINISHED_GOOD",
    "uom": "EA",
    "net_weight": 500,
    "shelf_life_days": 7,
    "storage_temp": "ROOM"
  },
  "step5": {
    "create_demo": true,
    "wo_number": "WO-DEMO-001",
    "quantity": 100,
    "production_line_id": "{location_id_from_step3}",
    "start_date": "2025-12-12",
    "due_date": "2025-12-13"
  }
}
```

---

## Technical Notes

### Industry Template Pre-fills

**Bakery Template**:
- SKU: BREAD-001
- Name: Whole Wheat Bread - 500g
- Type: FINISHED_GOOD
- UoM: EA
- Net Weight: 500g
- Shelf Life: 7 days
- Storage: ROOM

**Dairy Template**:
- SKU: CHEESE-001
- Name: Cheddar Cheese - 1kg
- Shelf Life: 30 days
- Storage: REFRIGERATED (2-8°C)

(Other templates similar)

### Demo Work Order
- Created in **DRAFT** status
- No BOM required (empty BOM for demo)
- Can be deleted or started from Production module

### Skip Behavior
- **Skip Product**: Disables Demo Order tab (can't create WO without product)
- **Skip Demo Order**: Proceeds to completion without WO

---

## Accessibility

- **Touch targets**: All inputs >= 48x48dp
- **Tab navigation**: Keyboard accessible (left/right arrows)
- **Radio buttons**: Keyboard navigable (arrow keys)
- **Labels**: Associated with inputs
- **Required fields**: Marked with * and `aria-required="true"`
- **Focus**: First radio button (Bakery) auto-focused on Tab 1

---

## Related Screens

- **Previous**: [SET-004-onboarding-location.md] (Step 3)
- **Next**: [SET-006-onboarding-completion.md] (Step 6)

---

## Handoff Notes

### For FRONTEND-DEV:
1. Use `ProductWorkOrderStep` component (tabbed interface)
2. Load product templates from config/constants
3. Auto-generate SKU from template + counter (check uniqueness)
4. Tab 1 → Tab 2 requires valid product
5. Tab 2 optional (checkbox controls form enable/disable)
6. Save both steps to `wizard_progress` on completion

### API Endpoints:
```
GET /api/products/check-sku?sku=BREAD-001
Response: { exists: false }

GET /api/settings/wizard/templates/products
Response: { bakery: {...}, dairy: {...}, ... }

PATCH /api/settings/wizard/progress
Body: { step: 5, step4: {...}, step5: {...} }
Response: { success: true }
```

---

**Status**: Ready for Implementation
**Approval Mode**: Auto-Approve (Concise Format)
**Iterations**: 0 of 3
