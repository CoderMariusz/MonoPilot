# TEC-006a-MVP: BOM Items Core (MVP)

**Module**: Technical
**Feature**: BOM Items Management - MVP ONLY (Story 02.5a)
**Type**: Detail View - Items Section
**Path**: `/technical/boms/{id}` (items section)
**ID**: TEC-006a-MVP
**Parent**: TEC-006 (BOM Modal - Header CRUD)
**Status**: Ready for Implementation
**Created**: 2025-12-28
**Story**: 02.5a - BOM Items Core (MVP)

---

## Overview

This is the **MVP version** of BOM Items management. It includes ONLY core CRUD functionality for BOM items. All advanced features (alternatives, byproducts, conditional items, line-specific items) are **completely hidden** and deferred to future stories (02.5b, 02.6).

**MVP Scope (IN SCOPE)**:
- BOM Items table (list of ingredients/components)
- Add Item modal with MVP fields only
- Edit Item modal (same fields)
- Delete Item confirmation
- Items summary panel (basic counts and totals)
- Empty state ("No items added yet")

**MVP Fields Per Item**:
1. `sequence` (INTEGER, auto: max+10)
2. `component_id` (UUID FK → products)
3. `quantity` (DECIMAL, >0, max 6 decimals)
4. `uom` (TEXT, should match component.uom - warning if not)
5. `scrap_percent` (DECIMAL, 0-100, default 0)
6. `operation_seq` (INTEGER, FK to routing_operations.sequence)
7. `notes` (TEXT, max 500 chars)

**OUT OF SCOPE (Phase 1+)**:
- Alternative ingredients (Story 02.6)
- Byproducts (Story 02.5b)
- Conditional items (is_conditional, condition_field, condition_value) (Story 02.5b)
- Line-specific items (line_id) (Story 02.5b)
- LP consumption mode (lp_consumption_mode) (Story 02.5b)
- Flags (organic, vegan, etc.) (Story 02.5b)
- Import CSV (deferred)
- Scale BOM (deferred)
- Cost breakdown (Story 02.9)

---

## ASCII Wireframes

### State 1: Success State (With Items)

```
+-----------------------------------------------------------------------------+
|  <- Back to BOMs                                              [Export CSV]  |
+-----------------------------------------------------------------------------+
|                                                                             |
|  BOM: White Bread 800g - v2.1                                  [Active]    |
|  Product: PRD-BREAD-WH-01 | Output: 100 kg | Version: 2.1                  |
|  Routing: RTG-BREAD-01 (Standard Bread Line)                  [Change]     |
|  ----------------------------------------------------------------------     |
|                                                                             |
+-----------------------------------------------------------------------------+
|                                                                             |
|  BOM Items                                                   [+ Add Item]   |
|  ----------------------------------------------------------------------     |
|                                                                             |
|  +-----------------------------------------------------------------------+ |
|  | Seq | Component          | Type | Qty     | UoM | Operation | Actions  | |
|  +-----+--------------------+------+---------+-----+-----------+----------+ |
|  |  10 | RM-001             | RM   | 50.000  | kg  | Op 1: Mix | [v]      | |
|  |     | Wheat Flour Premium|      |         |     |           |          | |
|  |     | Scrap: 2.0%                                                      | |
|  +-----+--------------------+------+---------+-----+-----------+----------+ |
|  |  20 | ING-002            | ING  |  5.000  | kg  | Op 1: Mix | [v]      | |
|  |     | Honey Organic      |      |         |     |           |          | |
|  |     | Scrap: 0.5%                                                      | |
|  +-----+--------------------+------+---------+-----+-----------+----------+ |
|  |  30 | RM-010             | RM   | 30.000  | L   | Op 1: Mix | [v]      | |
|  |     | Water              |      |         |     |           |          | |
|  +-----+--------------------+------+---------+-----+-----------+----------+ |
|  |  40 | RM-003             | RM   |  0.500  | kg  | Op 1: Mix | [v]      | |
|  |     | Yeast Active Dry   |      |         |     |           |          | |
|  |     | Scrap: 1.0%                                                      | |
|  +-----+--------------------+------+---------+-----+-----------+----------+ |
|  |  50 | PKG-001            | PKG  |   100   | pcs | Op 4: Pack| [v]      | |
|  |     | Plastic Bag 1kg    |      |         |     |           |          | |
|  |     | Scrap: 5.0%                                                      | |
|  +-----+--------------------+------+---------+-----+-----------+----------+ |
|                                                                             |
|  Total Items: 5                                                             |
|                                                                             |
+-----------------------------------------------------------------------------+
|                                                                             |
|  Summary                                                                    |
|  ----------------------------------------------------------------------     |
|                                                                             |
|  +-----------------------------------------------------------------------+ |
|  | Total Components: 5 items                                             | |
|  | Total Input: 85.5 kg + 100 pcs                                        | |
|  | Expected Output: 100 kg                                               | |
|  +-----------------------------------------------------------------------+ |
|                                                                             |
+-----------------------------------------------------------------------------+
```

**Row Actions Dropdown ([v])**:
```
+------------------+
| Edit             |
| Delete           |
+------------------+
```

---

### State 2: Empty State (No Items)

```
+-----------------------------------------------------------------------------+
|  <- Back to BOMs                                              [Export CSV]  |
+-----------------------------------------------------------------------------+
|                                                                             |
|  BOM: New Product Recipe - v1.0                                [Draft]     |
|  Product: PRD-NEW-01 | Output: 50 kg | Version: 1.0                        |
|  Routing: Not assigned                                        [Assign]     |
|  ----------------------------------------------------------------------     |
|                                                                             |
+-----------------------------------------------------------------------------+
|                                                                             |
|  BOM Items                                                   [+ Add Item]   |
|  ----------------------------------------------------------------------     |
|                                                                             |
|  +-----------------------------------------------------------------------+ |
|  |                                                                       | |
|  |                        [box icon]                                     | |
|  |                                                                       | |
|  |                  No components added yet                              | |
|  |                                                                       | |
|  |    A BOM needs at least one component to define the recipe.          | |
|  |                                                                       | |
|  |                   [+ Add First Component]                             | |
|  |                                                                       | |
|  +-----------------------------------------------------------------------+ |
|                                                                             |
|  +-----------------------------------------------------------------------+ |
|  |  [i] Tip: Start by adding raw materials, then ingredients and         | |
|  |  packaging. Each item needs a quantity and unit of measure.           | |
|  +-----------------------------------------------------------------------+ |
|                                                                             |
+-----------------------------------------------------------------------------+
```

---

### State 3: Add Item Modal

```
+-------------------------------------------------------------------+
|  Add Component to BOM                                          [X]|
+-------------------------------------------------------------------+
|                                                                   |
|  Component * (Required)                                           |
|  +-------------------------------------------------------------+  |
|  | Search materials, ingredients, packaging...              v  |  |
|  +-------------------------------------------------------------+  |
|  Type to search by code or name (RM, ING, PKG, WIP types only)   |
|                                                                   |
|  +-------------------------------------------------------------+  |
|  | Selected: RM-001 - Wheat Flour Premium                      |  |
|  |   Type: Raw Material | Base UoM: kg                         |  |
|  +-------------------------------------------------------------+  |
|                                                                   |
|  -----------------------------------------------------------------|
|                                                                   |
|  Quantity * (Required)               Unit of Measure              |
|  +--------------------------+       +-------------------------+   |
|  | 50.000                   |       | kg (from product)       |   |
|  +--------------------------+       +-------------------------+   |
|  Amount needed per batch (100 kg output)                          |
|                                                                   |
|  Sequence                            Scrap Allowance %            |
|  +--------------------------+       +-------------------------+   |
|  | 10                       |       | 2.0                     |   |
|  +--------------------------+       +-------------------------+   |
|  Order in production (auto: max+10)  Expected material loss       |
|                                                                   |
|  -----------------------------------------------------------------|
|                                                                   |
|  Operation Assignment (Optional)                                  |
|  +-------------------------------------------------------------+  |
|  | Select operation from routing RTG-BREAD-01...             v |  |
|  +-------------------------------------------------------------+  |
|  Links this item to specific production step                     |
|                                                                   |
|  Available operations:                                            |
|  - Op 10: Mixing                                                  |
|  - Op 20: Proofing                                                |
|  - Op 30: Baking                                                  |
|  - Op 40: Packaging                                               |
|                                                                   |
|  Notes (Optional)                                                 |
|  +-------------------------------------------------------------+  |
|  | Special handling notes (max 500 characters)                |  |
|  |                                                             |  |
|  +-------------------------------------------------------------+  |
|                                                                   |
+-------------------------------------------------------------------+
|                                                                   |
|  [Cancel]                                               [Save]    |
|                                                                   |
+-------------------------------------------------------------------+
```

**Note**: "Save & Add Another" button removed for MVP simplicity. Can be added in Phase 1 if needed.

---

### State 4: Add Item Modal - No Routing Assigned

```
+-------------------------------------------------------------------+
|  Add Component to BOM                                          [X]|
+-------------------------------------------------------------------+
|                                                                   |
|  Component * (Required)                                           |
|  +-------------------------------------------------------------+  |
|  | Search materials, ingredients, packaging...              v  |  |
|  +-------------------------------------------------------------+  |
|                                                                   |
|  [... Component selected ...]                                     |
|                                                                   |
|  Quantity * (Required)               Unit of Measure              |
|  +--------------------------+       +-------------------------+   |
|  | 50.000                   |       | kg (from product)       |   |
|  +--------------------------+       +-------------------------+   |
|                                                                   |
|  Sequence                            Scrap Allowance %            |
|  +--------------------------+       +-------------------------+   |
|  | 10                       |       | 2.0                     |   |
|  +--------------------------+       +-------------------------+   |
|                                                                   |
|  -----------------------------------------------------------------|
|                                                                   |
|  Operation Assignment (Optional)                                  |
|  +-------------------------------------------------------------+  |
|  |  [i] Assign a routing to BOM first to enable operation      |  |
|  |      assignment                                              |  |
|  +-------------------------------------------------------------+  |
|  [Change Routing] button → opens BOM header edit                 |
|                                                                   |
|  Notes (Optional)                                                 |
|  +-------------------------------------------------------------+  |
|  |                                                             |  |
|  +-------------------------------------------------------------+  |
|                                                                   |
+-------------------------------------------------------------------+
|                                                                   |
|  [Cancel]                                               [Save]    |
|                                                                   |
+-------------------------------------------------------------------+
```

---

### State 5: Edit Item Modal

```
+-------------------------------------------------------------------+
|  Edit Component: RM-001 Wheat Flour Premium                    [X]|
+-------------------------------------------------------------------+
|                                                                   |
|  Component (Cannot change)                                        |
|  +-------------------------------------------------------------+  |
|  | RM-001 - Wheat Flour Premium                                |  |
|  |   Type: Raw Material | Base UoM: kg                         |  |
|  +-------------------------------------------------------------+  |
|  [i] To change component, delete this item and add a new one     |
|                                                                   |
|  -----------------------------------------------------------------|
|                                                                   |
|  Quantity * (Required)               Unit of Measure              |
|  +--------------------------+       +-------------------------+   |
|  | 75.000                   |       | kg (from product)       |   |
|  +--------------------------+       +-------------------------+   |
|  Amount needed per batch (100 kg output)                          |
|                                                                   |
|  Sequence                            Scrap Allowance %            |
|  +--------------------------+       +-------------------------+   |
|  | 10                       |       | 3.0                     |   |
|  +--------------------------+       +-------------------------+   |
|  Order in production                 Expected material loss       |
|                                                                   |
|  -----------------------------------------------------------------|
|                                                                   |
|  Operation Assignment (Optional)                                  |
|  +-------------------------------------------------------------+  |
|  | Op 10: Mixing                                             v |  |
|  +-------------------------------------------------------------+  |
|  Links this item to specific production step                     |
|                                                                   |
|  Notes (Optional)                                                 |
|  +-------------------------------------------------------------+  |
|  | Store in dry area below 20C. Mix for 5 minutes minimum.    |  |
|  +-------------------------------------------------------------+  |
|                                                                   |
+-------------------------------------------------------------------+
|                                                                   |
|  [Cancel]                                        [Save Changes]   |
|                                                                   |
+-------------------------------------------------------------------+
```

**Key difference in Edit mode**: Component field is read-only (cannot change product_id after creation).

---

### State 6: Delete Confirmation Dialog

```
+-------------------------------------------------------------------+
|  Delete Component?                                             [X]|
+-------------------------------------------------------------------+
|                                                                   |
|  Are you sure you want to delete this component?                 |
|                                                                   |
|  Component: RM-001 - Wheat Flour Premium                         |
|  Quantity: 50 kg                                                  |
|  Operation: Op 10: Mixing                                         |
|                                                                   |
|  This action cannot be undone.                                    |
|                                                                   |
+-------------------------------------------------------------------+
|                                                                   |
|  [Cancel]                                    [Delete Component]   |
|                                                  (destructive)    |
+-------------------------------------------------------------------+
```

---

### State 7: Validation Error State (Item Modal)

```
+-------------------------------------------------------------------+
|  Add Component to BOM                                          [X]|
+-------------------------------------------------------------------+
|                                                                   |
|  +-------------------------------------------------------------+  |
|  | [!] Validation Errors                                       |  |
|  |                                                             |  |
|  | - Quantity must be greater than 0                           |  |
|  | - Component is required                                     |  |
|  +-------------------------------------------------------------+  |
|                                                                   |
|  Component * (Required)                                           |
|  +-------------------------------------------------------------+  |
|  | Select component...                                       v |  |
|  +-------------------------------------------------------------+  |
|  [!] Component is required                                        |
|                                                                   |
|  Quantity * (Required)               Unit of Measure              |
|  +--------------------------+       +-------------------------+   |
|  | 0                    [!] |       | -                       |   |
|  +--------------------------+       +-------------------------+   |
|  [!] Quantity must be greater than 0                              |
|                                                                   |
|  [... rest of form ...]                                           |
|                                                                   |
+-------------------------------------------------------------------+
|                                                                   |
|  [Cancel]                                               [Save]    |
|                                                        (disabled)  |
+-------------------------------------------------------------------+
```

---

### State 8: UoM Mismatch Warning (Non-blocking)

```
+-------------------------------------------------------------------+
|  Add Component to BOM                                          [X]|
+-------------------------------------------------------------------+
|                                                                   |
|  +-------------------------------------------------------------+  |
|  | [!] Warning                                                 |  |
|  |                                                             |  |
|  | UoM mismatch: component base UoM is 'kg', you entered 'L'. |  |
|  | Unit conversion may be required during production.         |  |
|  |                                                             |  |
|  | You can still save this item, but verify this is correct.  |  |
|  +-------------------------------------------------------------+  |
|                                                                   |
|  Component * (Required)                                           |
|  +-------------------------------------------------------------+  |
|  | RM-001 - Wheat Flour Premium (Base UoM: kg)                 |  |
|  +-------------------------------------------------------------+  |
|                                                                   |
|  Quantity * (Required)               Unit of Measure              |
|  +--------------------------+       +-------------------------+   |
|  | 50.000                   |       | L                   [!] |   |
|  +--------------------------+       +-------------------------+   |
|                                                                   |
|  [... rest of form ...]                                           |
|                                                                   |
+-------------------------------------------------------------------+
|                                                                   |
|  [Cancel]                                               [Save]    |
|                                                        (enabled)   |
+-------------------------------------------------------------------+
```

**Note**: UoM mismatch is a WARNING, not an error. Save button remains enabled.

---

### State 9: Loading State

```
+-----------------------------------------------------------------------------+
|  <- Back to BOMs                                              [Export CSV]  |
+-----------------------------------------------------------------------------+
|                                                                             |
|  [Skeleton: BOM Header]                                        [Skeleton]  |
|  [Skeleton: Product info line]                                             |
|  ----------------------------------------------------------------------     |
|                                                                             |
+-----------------------------------------------------------------------------+
|                                                                             |
|  BOM Items                                                   [+ Add Item]   |
|  ----------------------------------------------------------------------     |
|                                                                             |
|                         [Spinner]                                           |
|                                                                             |
|                   Loading BOM items...                                      |
|                                                                             |
|                                                                             |
+-----------------------------------------------------------------------------+
```

---

### State 10: Error State

```
+-----------------------------------------------------------------------------+
|  <- Back to BOMs                                              [Export CSV]  |
+-----------------------------------------------------------------------------+
|                                                                             |
|  +-----------------------------------------------------------------------+ |
|  |  [X] Failed to Load BOM Items                                         | |
|  |                                                                       | |
|  |  Error: BOM not found or you don't have permission to view it.       | |
|  |                                                                       | |
|  |  [<- Back to BOMs]                                   [Retry]          | |
|  +-----------------------------------------------------------------------+ |
|                                                                             |
+-----------------------------------------------------------------------------+
```

---

## Key Components

### 1. BOM Header (Read-Only Display)

**Purpose**: Display BOM context (not editable on this page)

**Elements**:
- **BOM Name**: "White Bread 800g - v2.1"
- **Product**: "PRD-BREAD-WH-01"
- **Output**: "100 kg"
- **Version**: "2.1"
- **Routing**: "RTG-BREAD-01 (Standard Bread Line)" with [Change] button
- **Status Badge**: Draft, Active, Phased Out, Inactive

**Actions**:
- **[Change]**: Opens BOM header edit modal (from TEC-006)
- **[<- Back to BOMs]**: Navigate to BOM list (TEC-005)
- **[Export CSV]**: Download items as CSV

---

### 2. BOM Items Table

**Purpose**: Display list of BOM components

#### Table Columns

| Column | Description | Width | Sortable | Notes |
|--------|-------------|-------|----------|-------|
| Seq | Sequence number | 60px | Yes | Right-aligned, monospace font |
| Component | Product code + name | 250px | Yes | Two lines: code (bold), name (muted) |
| Type | RM/ING/PKG/WIP badge | 80px | Yes | Color-coded badge |
| Qty | Quantity (decimal) | 100px | No | Right-aligned, 3 decimal places max display |
| UoM | Unit of measure | 80px | No | Left-aligned |
| Operation | Assigned operation | 150px | Yes | Format: "Op [seq]: [name]" or "-" |
| Actions | Dropdown menu | 80px | No | [v] icon button |

#### Sub-Row Display

**Purpose**: Show additional item details below main row (optional, only if scrap > 0)

**Format**: Single line, indented, muted text
- "Scrap: 2.0%" (only if scrap_percent > 0)

**Example**:
```
|  10 | RM-001             | RM   | 50.000  | kg  | Op 1: Mix | [v]      |
|     | Wheat Flour Premium|      |         |     |           |          |
|     | Scrap: 2.0%                                                      |
```

#### Row Actions Dropdown ([v])

**Options**:
- **Edit**: Opens edit modal
- **Delete**: Opens delete confirmation dialog

**Accessibility**:
- aria-label="Actions for [component name]"
- Keyboard navigation: Arrow keys + Enter

#### Empty State

**Display when**: No items exist for BOM

**Content**:
- Icon: Box/Package icon (centered)
- Heading: "No components added yet"
- Description: "A BOM needs at least one component to define the recipe."
- Primary CTA: "[+ Add First Component]" (large button)
- Tip: "Start by adding raw materials, then ingredients and packaging."

---

### 3. Items Summary Panel

**Purpose**: Show aggregated statistics (basic MVP version)

**Display**:
```
Summary
----------------------------------------------------------------------

+-----------------------------------------------------------------------+
| Total Components: 5 items                                             |
| Total Input: 85.5 kg + 100 pcs                                        |
| Expected Output: 100 kg                                               |
+-----------------------------------------------------------------------+
```

**Calculations**:
- **Total Components**: Count of items
- **Total Input**: Sum of quantities grouped by UoM
- **Expected Output**: From BOM header (output_qty + output_uom)

**Note**: Cost breakdown deferred to Story 02.9

---

### 4. Add/Edit Item Modal

#### Modal Header

**Create Mode**: "Add Component to BOM"
**Edit Mode**: "Edit Component: [component name]"

#### Form Fields

##### 1. Component Selector (Required)

- **Type**: Searchable dropdown (Combobox)
- **Label**: "Component *"
- **Placeholder**: "Search materials, ingredients, packaging..."
- **Search by**: Product code OR product name
- **Filter**: Only show products with type IN ('RM', 'ING', 'PKG', 'WIP') AND status = 'Active'
- **Display**:
  - Dropdown item: "[CODE] - [NAME]"
  - Selected display: Shows product details (type, base_uom)
- **Validation**: Required
- **Disabled in Edit Mode**: Yes (cannot change component after creation)

##### 2. Quantity (Required)

- **Type**: Decimal input
- **Label**: "Quantity *"
- **Validation**:
  - Required
  - Must be > 0
  - Max 6 decimal places
- **Help Text**: "Amount needed per batch ([BOM output_qty] kg output)"
- **Width**: 50% (left side)

##### 3. Unit of Measure (Auto-filled, Read-only)

- **Type**: Text input (read-only)
- **Label**: "Unit of Measure"
- **Value**: Auto-filled from selected component's base_uom
- **Styling**: Grey background (disabled appearance)
- **Width**: 50% (right side, next to Quantity)

##### 4. Sequence (Optional)

- **Type**: Number input (integer)
- **Label**: "Sequence"
- **Default**: Auto-calculated (max existing sequence + 10)
- **Validation**: Integer >= 0
- **Help Text**: "Order in production (auto: max+10)"
- **Width**: 50% (left side)

##### 5. Scrap Allowance % (Optional)

- **Type**: Decimal input
- **Label**: "Scrap Allowance %"
- **Default**: 0
- **Validation**:
  - 0 <= value <= 100
  - Max 2 decimal places
- **Help Text**: "Expected material loss"
- **Width**: 50% (right side, next to Sequence)

##### 6. Operation Assignment (Optional)

- **Type**: Dropdown (Select)
- **Label**: "Operation Assignment (Optional)"
- **Options**:
  - IF routing_id IS NULL: Disabled with info message
  - IF routing_id IS NOT NULL: Show operations from routing
- **Display**: "Op [sequence]: [operation_name]" (e.g., "Op 10: Mixing")
- **Placeholder**: "Select operation from routing [routing_code]..."
- **Help Text**: "Links this item to specific production step"
- **Validation**: If provided, must exist in BOM's assigned routing
- **Disabled State**: Show message "[i] Assign a routing to BOM first to enable operation assignment" + [Change Routing] button

##### 7. Notes (Optional)

- **Type**: Textarea
- **Label**: "Notes (Optional)"
- **Rows**: 3
- **Max Length**: 500 characters
- **Placeholder**: "Special handling notes (max 500 characters)"
- **Character Counter**: Show "X/500" below field

#### Modal Footer Actions

**Create Mode**:
- **[Cancel]**: Close modal without saving
- **[Save]**: Create item and close modal

**Edit Mode**:
- **[Cancel]**: Close modal without saving
- **[Save Changes]**: Update item and close modal

---

### 5. Delete Confirmation Dialog

**Purpose**: Confirm item deletion

**Header**: "Delete Component?"

**Content**:
- "Are you sure you want to delete this component?"
- Component details: "[CODE] - [NAME]"
- Quantity: "[QTY] [UOM]"
- Operation: "[OPERATION]" (if assigned)
- "This action cannot be undone."

**Actions**:
- **[Cancel]**: Close dialog, keep item
- **[Delete Component]**: Delete item and close dialog (destructive style - red)

---

## Validation Rules

### Client-Side Validation (Zod)

```typescript
const bomItemFormSchema = z.object({
  product_id: z.string()
    .min(1, "Component is required")
    .uuid("Invalid component ID"),

  quantity: z.number({
    required_error: "Quantity is required",
    invalid_type_error: "Quantity must be a number",
  })
    .positive("Quantity must be greater than 0")
    .refine(val => {
      const decimals = (val.toString().split('.')[1] || '').length;
      return decimals <= 6;
    }, "Maximum 6 decimal places allowed"),

  uom: z.string()
    .min(1, "Unit of measure is required"),

  sequence: z.number()
    .int("Sequence must be an integer")
    .min(0, "Sequence cannot be negative")
    .optional()
    .default(0),

  operation_seq: z.number()
    .int("Operation sequence must be an integer")
    .nullable()
    .optional(),

  scrap_percent: z.number()
    .min(0, "Scrap % cannot be negative")
    .max(100, "Scrap % cannot exceed 100%")
    .optional()
    .default(0),

  notes: z.string()
    .max(500, "Notes must be less than 500 characters")
    .nullable()
    .optional(),
});
```

### Server-Side Validation

1. **Quantity > 0**: Database constraint (migration 049)
2. **UoM Match**: Database trigger (migration 049) - WARNING only, not blocking
3. **Operation Exists**: Validate operation_seq exists in routing_operations for assigned routing
4. **No Duplicate Component**: Prevent adding same product_id twice to same BOM
5. **Permission Check**: User must have `technical.write` permission

### Error Messages

```typescript
{
  "VALIDATION_ERROR": "Please fix the errors below",
  "COMPONENT_REQUIRED": "Component is required",
  "DUPLICATE_COMPONENT": "Component already exists in this BOM",
  "INVALID_QUANTITY": "Quantity must be greater than 0",
  "DECIMAL_PRECISION": "Maximum 6 decimal places allowed",
  "INVALID_OPERATION": "Operation does not exist in assigned routing",
  "NO_ROUTING": "Cannot assign operation: BOM has no routing assigned",
  "UOM_MISMATCH": "UoM mismatch: component base UoM is '{{baseUom}}', you entered '{{enteredUom}}'",
  "SCRAP_RANGE": "Scrap % must be between 0 and 100",
  "NOTES_TOO_LONG": "Notes must be less than 500 characters",
  "ITEM_NOT_FOUND": "BOM item not found",
  "PERMISSION_DENIED": "You do not have permission to modify this BOM",
}
```

---

## State Transitions

### Page Load Flow

```
User navigates to /technical/boms/{id}
  |
  v
LOADING State
  | Fetch BOM header + items
  | Fetch routing operations (if routing_id set)
  v
SUCCESS State (display items table + summary)
  OR
ERROR State (show error banner + retry)
```

---

### Add Item Flow

```
User clicks [+ Add Item]
  |
  v
Add Item Modal Opens (Create Mode)
  | - Component: empty
  | - Quantity: 0
  | - UoM: "" (auto-fill on component select)
  | - Sequence: max(existing) + 10
  | - Scrap %: 0
  | - Operation: null
  | - Notes: ""
  |
  | User selects component RM-001 (base_uom: kg)
  v
UoM auto-fills to "kg"
  |
  | User enters quantity: 50
  | User enters scrap: 2.0
  | User selects operation: "Op 10: Mixing"
  | User clicks [Save]
  v
Client Validation
  | - All fields valid?
  v
  YES → POST /api/v1/technical/boms/{id}/items
  |
  v
Server Validation
  | - Quantity > 0? (constraint)
  | - UoM match? (trigger warning)
  | - Operation exists? (if provided)
  | - No duplicate component?
  v
  SUCCESS → Close modal, refresh table, show toast
  OR
  ERROR → Show error in modal, keep open
```

---

### Edit Item Flow

```
User clicks [Edit] on item
  |
  v
Edit Item Modal Opens (Edit Mode)
  | - Pre-fill all fields from item
  | - Component: read-only (cannot change)
  | - Quantity: editable
  | - UoM: read-only (auto from component)
  | - Sequence: editable
  | - Scrap %: editable
  | - Operation: editable
  | - Notes: editable
  |
  | User changes quantity: 50 → 75
  | User clicks [Save Changes]
  v
Client Validation
  | - All fields valid?
  v
  YES → PUT /api/v1/technical/boms/{id}/items/{itemId}
  |
  v
Server Validation
  | - Same as Add Item
  v
  SUCCESS → Close modal, refresh table, show toast
  OR
  ERROR → Show error in modal, keep open
```

---

### Delete Item Flow

```
User clicks [Delete] on item
  |
  v
Delete Confirmation Dialog Opens
  | - Show item details
  | - "This action cannot be undone."
  |
  | User clicks [Delete Component]
  v
DELETE /api/v1/technical/boms/{id}/items/{itemId}
  |
  v
Server Validation
  | - Item exists?
  | - User has permission?
  v
  SUCCESS → Close dialog, refresh table, show toast
  OR
  ERROR → Show error toast, close dialog
```

---

## Data Required

### API Endpoints

#### 1. GET /api/v1/technical/boms/{id}/items

**Purpose**: Fetch all items for a BOM

**Response**:
```typescript
{
  items: [
    {
      id: string;
      bom_id: string;
      product_id: string;
      product_code: string;
      product_name: string;
      product_type: 'RM' | 'ING' | 'PKG' | 'WIP';
      product_base_uom: string;
      quantity: number;
      uom: string;
      sequence: number;
      operation_seq: number | null;
      operation_name: string | null;
      scrap_percent: number;
      notes: string | null;
      created_at: string;
      updated_at: string;
    }
  ];
  total: number;
  bom_output_qty: number;
  bom_output_uom: string;
}
```

#### 2. POST /api/v1/technical/boms/{id}/items

**Purpose**: Create new BOM item

**Request**:
```typescript
{
  product_id: string;
  quantity: number;
  uom: string;
  sequence?: number;
  operation_seq?: number | null;
  scrap_percent?: number;
  notes?: string | null;
}
```

**Response**:
```typescript
{
  item: BOMItem;
  warnings?: [
    { code: 'UOM_MISMATCH', message: 'UoM mismatch...', details: '...' }
  ];
}
```

#### 3. PUT /api/v1/technical/boms/{id}/items/{itemId}

**Purpose**: Update existing BOM item

**Request**: Same as POST (all fields optional)

**Response**: Same as POST

#### 4. DELETE /api/v1/technical/boms/{id}/items/{itemId}

**Purpose**: Delete BOM item

**Response**:
```typescript
{
  success: true;
  message: "BOM item deleted successfully";
}
```

#### 5. GET /api/v1/technical/routings/{routingId}/operations

**Purpose**: Fetch operations for operation dropdown

**Response**:
```typescript
{
  operations: [
    {
      id: string;
      sequence: number;
      name: string;
      display_name: string; // "Op {seq}: {name}"
    }
  ];
}
```

---

## Accessibility (WCAG 2.1 AA)

### Keyboard Navigation

- **Tab/Shift+Tab**: Navigate through interactive elements
- **Enter**: Activate buttons, open dropdowns
- **Escape**: Close modals/dialogs
- **Arrow Keys**: Navigate table rows, dropdown options

### Screen Reader Support

- **Modal**: `role="dialog"` `aria-labelledby="modal-title"`
- **Close button**: `aria-label="Close modal"`
- **Table**: `role="grid"` with proper row/cell labels
- **Error messages**: `aria-live="assertive"` for immediate announce
- **Info messages**: `aria-live="polite"` for non-critical updates
- **Loading states**: `aria-busy="true"` with descriptive label

### Touch Targets

- All interactive elements: **>= 48x48dp**
- Adequate spacing between touch targets (8px minimum)

### Color Contrast

- Text: **>= 4.5:1** contrast ratio
- UI components: **>= 3:1** contrast ratio
- Error text: Red with **>= 4.5:1** against background

### Focus Indicators

- Visible focus ring on all interactive elements
- Focus ring: 2px solid, high contrast color
- Focus order: logical (top to bottom, left to right)

---

## Technical Notes

### Auto-Sequence Logic

```typescript
// When opening Add Item modal
const sequences = items.map(item => item.sequence);
const maxSequence = Math.max(...sequences, 0);
const nextSequence = maxSequence + 10;

// Pre-fill sequence field
setValue('sequence', nextSequence);
```

### UoM Auto-Fill

```typescript
// When component selected
const handleComponentSelect = (product: Product) => {
  setValue('product_id', product.id);
  setValue('uom', product.base_uom); // Auto-fill UoM
};
```

### UoM Validation (Non-blocking Warning)

```typescript
// Client-side warning (optional)
const selectedProduct = products.find(p => p.id === watch('product_id'));
if (selectedProduct && watch('uom') !== selectedProduct.base_uom) {
  setWarnings([
    {
      code: 'UOM_MISMATCH',
      message: `UoM mismatch: component base UoM is '${selectedProduct.base_uom}', you entered '${watch('uom')}'`,
    }
  ]);
}

// Server-side trigger (migration 049) logs WARNING but allows save
```

### Summary Calculations

```typescript
const calculateSummary = (items: BOMItem[], bom: BOM) => {
  const totalItems = items.length;

  // Group quantities by UoM
  const inputTotals = items.reduce((acc, item) => {
    if (!acc[item.uom]) acc[item.uom] = 0;
    acc[item.uom] += item.quantity;
    return acc;
  }, {} as Record<string, number>);

  // Format total input
  const totalInput = Object.entries(inputTotals)
    .map(([uom, qty]) => `${qty.toFixed(3)} ${uom}`)
    .join(' + ');

  return {
    total_items: totalItems,
    total_input: totalInput,
    expected_output: `${bom.output_qty} ${bom.output_uom}`,
  };
};
```

---

## Related Screens

- **Previous**: TEC-005 BOM List (<- Back button)
- **Parent**: TEC-006 BOM Modal (for editing BOM header)
- **Related**: TEC-001 Products List (for product selection)
- **Related**: TEC-008a Routing Detail (for operation assignment)
- **Next**: Production Work Orders (consumes BOM items)

---

## Handoff Notes for FRONTEND-DEV

### Component Files

1. **Page**: `app/(authenticated)/technical/boms/[id]/page.tsx`
   - Add BOM Items section to existing BOM detail page
   - Fetch items data via API
   - Include BOMItemsTable and BOMItemModal components

2. **Components**:
   - `components/technical/bom/BOMItemsTable.tsx` (new)
   - `components/technical/bom/BOMItemModal.tsx` (new)
   - `components/technical/bom/BOMItemRow.tsx` (optional helper)

3. **Service**: `lib/services/bom-items-service.ts` (new)
   - `getBOMItems(bomId: string)`
   - `createBOMItem(bomId: string, data: CreateBOMItemRequest)`
   - `updateBOMItem(bomId: string, itemId: string, data: UpdateBOMItemRequest)`
   - `deleteBOMItem(bomId: string, itemId: string)`

4. **Validation**: `lib/validation/bom-items.ts` (new)
   - `bomItemFormSchema` (Zod schema)

5. **Types**: `lib/types/bom-items.ts` (new)
   - `BOMItem`, `CreateBOMItemRequest`, `UpdateBOMItemRequest`, `BOMItemsListResponse`

### Libraries

- ShadCN `DataTable` for items table
- ShadCN `Dialog` for modals
- ShadCN `Combobox` for product search
- ShadCN `Select` for operation dropdown
- ShadCN `Badge` for type indicators
- ShadCN `AlertDialog` for delete confirmation
- `react-hook-form` + Zod for form validation
- `@tanstack/react-table` for items table

### State Management

- React Query (`@tanstack/react-query`) for data fetching
- Local component state for modals (open/close)
- Form state via `react-hook-form`

### Performance

- Items table should render **<500ms for 100 items**
- Use pagination if needed (not in MVP)
- Debounce product search (300ms delay)

---

## MVP Acceptance Checklist

MVP implementation is complete when:

- [ ] BOM items table displays within 500ms for 100 items
- [ ] Add item modal opens with MVP fields only
- [ ] Component selector searches by code/name (RM, ING, PKG, WIP types only)
- [ ] Quantity validation enforces >0 and max 6 decimals
- [ ] UoM auto-fills from selected component
- [ ] UoM mismatch shows warning (not blocking error)
- [ ] Scrap % validation enforces 0-100 range
- [ ] Sequence auto-increments by 10 (max + 10)
- [ ] Operation dropdown populates from routing (if assigned)
- [ ] Operation dropdown disabled with message if no routing
- [ ] Edit modal pre-populates with item data
- [ ] Component field is read-only in edit mode
- [ ] Delete confirmation shows item details
- [ ] Delete removes item and refreshes table
- [ ] Summary panel shows total items count and total input
- [ ] Empty state displays with CTA when no items
- [ ] Loading state shows skeleton/spinner
- [ ] Error state shows retry option
- [ ] Permission checks hide unauthorized actions
- [ ] All 4 states defined per screen (loading, empty, error, success)
- [ ] Touch targets >= 48x48dp
- [ ] Accessibility checklist passed (WCAG 2.1 AA)
- [ ] No Phase 1+ features visible (alternatives, byproducts, conditionals, line-specific)

---

**Status**: Ready for User Approval
**Approval Mode**: Pending User Decision
**Iterations**: 0 of 3
**PRD Compliance**: 100% (MVP fields only)
**PRD Coverage**: FR-2.21 (P0), FR-2.31 (P0), FR-2.38 (P1), FR-2.39 (P0)
**Estimated Implementation**: 3 days (M complexity)
