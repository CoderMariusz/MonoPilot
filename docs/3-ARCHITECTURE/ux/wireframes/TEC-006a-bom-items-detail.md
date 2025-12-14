# TEC-006a: BOM Items Detail Page

**Module**: Technical
**Feature**: BOM Items Management (Story 2.6 - BOM Items CRUD)
**Type**: Full Page (Detail/Edit View)
**Path**: `/technical/boms/{id}/items`
**ID**: TEC-006a
**Parent**: TEC-006 (BOM Modal - Header CRUD)
**Status**: Ready for Implementation
**Last Updated**: 2025-12-14

---

## Overview

Detail page for managing BOM line items (ingredients/components) for a specific Bill of Materials. This screen handles the complete item management lifecycle: adding components, quantities, alternatives, operation assignments, and byproducts.

**Business Context:**
- BOM Items = recipe ingredients + packaging materials
- Each item has: component, quantity, UoM, sequence, scrap%, operation assignment
- Alternative ingredients allow substitutions when primary unavailable
- Conditional items support variant recipes (organic, vegan, etc.)
- Byproducts track secondary outputs (waste, trimmings)
- Operation assignment links items to routing steps

**Critical Gap Filled:**
- FR-2.21: BOM items (ingredient, qty, unit, sequence) - P0
- FR-2.31: BOM item operation assignment - P0
- FR-2.39: BOM item quantity validation - P0
- FR-2.38: BOM item UoM validation - P1
- FR-2.26: Conditional BOM items (if/then rules) - P1
- FR-2.27: BOM byproducts (yield %) - P1
- FR-2.30: Alternative ingredients (substitution) - P1

**Page Purpose:**
- Display BOM header info (product, version, status) - read-only
- Manage BOM items (CRUD + reorder)
- Handle alternative ingredients
- Track byproducts
- Show summary panel (totals, allergens, cost)

---

## ASCII Wireframe

### Success State (With Items)

```
+-----------------------------------------------------------------------------+
|  <- Back to BOM List                          [Scale BOM] [Export] [Save]  |
+-----------------------------------------------------------------------------+
|                                                                             |
|  BOM-001: White Bread 800g - v2.1                              [Active]    |
|  Product: PRD-BREAD-WH-01 | Output: 100 kg | Effective: 2024-06-01         |
|  Routing: RTG-BREAD-01 (Standard Bread Line)                  [Change]     |
|  --------------------------------------------------------------------       |
|                                                                             |
+-----------------------------------------------------------------------------+
|                                                                             |
|  BOM Items (Components)                       [+ Add Item] [Import CSV]    |
|  ----------------------------------------------------------------------     |
|                                                                             |
|  +-----------------------------------------------------------------------+ |
|  | Seq | Component          | Type | Qty     | UoM | Operation | Actions  | |
|  +-----+--------------------+------+---------+-----+-----------+----------+ |
|  |  10 | RM-001 Flour       | RM   | 50.000  | kg  | Op 1: Mix | [v] Edit | |
|  |     | Scrap: 2.0% | LP: Partial | Flags: organic                    | |
|  |     | └ ALT: RM-005 Whole Wheat (48 kg) - Priority 2                   | |
|  |     |   [+ Add Alternative]                                            | |
|  +-----+--------------------+------+---------+-----+-----------+----------+ |
|  |  20 | ING-002 Honey      | ING  |  5.000  | kg  | Op 1: Mix | [v] Edit | |
|  |     | Scrap: 0.5% | LP: Partial | Flags: organic, vegan              | |
|  +-----+--------------------+------+---------+-----+-----------+----------+ |
|  |  30 | RM-010 Water       | RM   | 30.000  | L   | Op 1: Mix | [v] Edit | |
|  |     | Scrap: 0% | LP: Whole LP | Flags: none                        | |
|  +-----+--------------------+------+---------+-----+-----------+----------+ |
|  |  40 | RM-003 Yeast       | RM   |  0.500  | kg  | Op 1: Mix | [v] Edit | |
|  |     | Scrap: 1.0% | LP: Partial | Flags: none                        | |
|  +-----+--------------------+------+---------+-----+-----------+----------+ |
|  |  50 | PKG-001 Bag        | PKG  |   100   | pcs | Op 4: Pack| [v] Edit | |
|  |     | Scrap: 5.0% | LP: Whole LP | Flags: none                       | |
|  +-----+--------------------+------+---------+-----+-----------+----------+ |
|                                                                             |
|  Total Input: 85.5 kg + 100 pcs        Expected Output: 100 kg (117%)      |
|  [i] Yield >100% indicates water/air incorporation or measurement variance |
|                                                                             |
+-----------------------------------------------------------------------------+
|                                                                             |
|  Byproducts (Optional Outputs)                          [+ Add Byproduct]  |
|  ----------------------------------------------------------------------     |
|                                                                             |
|  +-----------------------------------------------------------------------+ |
|  | # | Product            | Qty    | UoM | Yield% | Notes          | Acts | |
|  +---+--------------------+--------+-----+--------+----------------+------+ |
|  | 1 | BP-001 Bread Crumbs| 2.000  | kg  | 2.0%   | From trim waste| Edit | |
|  +---+--------------------+--------+-----+--------+----------------+------+ |
|                                                                             |
|  Byproduct yield: 2% of main output (2 kg from 100 kg batch)               |
|                                                                             |
+-----------------------------------------------------------------------------+
|                                                                             |
|  Summary Panel                                          [i View Details v] |
|  ----------------------------------------------------------------------     |
|                                                                             |
|  +-----------------------------------------------------------------------+ |
|  | Total Components: 5 items                                             | |
|  | Total Material Cost: 385.50 PLN  [Last calc: 2 hours ago] [Recalc]   | |
|  |                                                                        | |
|  | Allergens Detected: Gluten (from RM-001 Flour)                        | |
|  |                                                                        | |
|  | Conditional Flags: organic (2 items), vegan (1 item)                  | |
|  |                                                                        | |
|  | [i] Click "View Details" for full cost breakdown                      | |
|  +-----------------------------------------------------------------------+ |
|                                                                             |
+-----------------------------------------------------------------------------+
```

### Summary Panel - Expanded State

```
+-----------------------------------------------------------------------------+
|  Summary Panel                                          [i Hide Details ^] |
|  ----------------------------------------------------------------------     |
|                                                                             |
|  +-----------------------------------------------------------------------+ |
|  | Components Breakdown:                                                 | |
|  |   Total Items: 5                                                      | |
|  |   Raw Materials: 3 items (85.5 kg)                                    | |
|  |   Ingredients: 1 item (5 kg)                                          | |
|  |   Packaging: 1 item (100 pcs)                                         | |
|  |                                                                        | |
|  | Material Costs:                                                       | |
|  |   RM-001 Flour: 250.00 PLN (50 kg × 5.00 PLN/kg)                     | |
|  |   ING-002 Honey: 125.00 PLN (5 kg × 25.00 PLN/kg)                    | |
|  |   RM-010 Water: 0.00 PLN (utility)                                    | |
|  |   RM-003 Yeast: 5.00 PLN (0.5 kg × 10.00 PLN/kg)                     | |
|  |   PKG-001 Bag: 5.50 PLN (100 pcs × 0.055 PLN/pc)                     | |
|  |   ----------------------------------------                            | |
|  |   Total Material Cost: 385.50 PLN                                     | |
|  |                                                                        | |
|  | Allergen Summary:                                                     | |
|  |   Contains: Gluten                                                    | |
|  |   May Contain: None detected                                          | |
|  |   Source: RM-001 Wheat Flour Premium                                  | |
|  |                                                                        | |
|  | Conditional Flags Used:                                               | |
|  |   organic: RM-001 Flour, ING-002 Honey                                | |
|  |   vegan: ING-002 Honey                                                | |
|  |   [i] Conditional items affect final product attributes              | |
|  |                                                                        | |
|  | Operation Coverage:                                                   | |
|  |   Op 1 (Mixing): 4 items                                              | |
|  |   Op 4 (Packaging): 1 item                                            | |
|  |   Unassigned: 0 items                                                 | |
|  +-----------------------------------------------------------------------+ |
|                                                                             |
+-----------------------------------------------------------------------------+
```

### Add/Edit Item Modal (Success State)

```
+-------------------------------------------------------------------+
|  Add Component to BOM                                          [X]|
+-------------------------------------------------------------------+
|                                                                   |
|  Component * (Required)                                           |
|  +-------------------------------------------------------------+  |
|  | Search materials, ingredients, packaging...              v  |  |
|  +-------------------------------------------------------------+  |
|  Type to search by code or name (RM, ING, PKG types only)        |
|                                                                   |
|  +-------------------------------------------------------------+  |
|  | Selected: RM-001 - Wheat Flour Premium                      |  |
|  |   Type: Raw Material | Base UoM: kg | Stock: 500 kg         |  |
|  |   Allergens: Gluten | Cost: 5.00 PLN/kg                     |  |
|  +-------------------------------------------------------------+  |
|                                                                   |
|  -----------------------------------------------------------------|
|                                                                   |
|  Quantity * (Required)               Unit of Measure              |
|  +--------------------------+       +-------------------------+   |
|  | 50.000                   |       | kg (from product)       |   |
|  +--------------------------+       +-------------------------+   |
|  Amount needed per batch output (100 kg)                          |
|                                                                   |
|  Sequence                            Scrap Allowance %            |
|  +--------------------------+       +-------------------------+   |
|  | 10                       |       | 2.0                     |   |
|  +--------------------------+       +-------------------------+   |
|  Order in production (10, 20, 30...) Expected material loss       |
|                                                                   |
|  -----------------------------------------------------------------|
|                                                                   |
|  License Plate Consumption Mode *                                 |
|  +-------------------------------------------------------------+  |
|  |  O Partial - Consume only required quantity from LP         |  |
|  |  • Whole LP - Consume entire License Plate (1:1)            |  |
|  +-------------------------------------------------------------+  |
|  Whole LP: For pre-portioned items (bags, boxes). System picks   |
|  exact-match LPs. Partial: For bulk materials (flour, liquids).   |
|                                                                   |
|  -----------------------------------------------------------------|
|                                                                   |
|  Operation Assignment (Optional)                                  |
|  +-------------------------------------------------------------+  |
|  | Select operation from routing RTG-BREAD-01...             v |  |
|  +-------------------------------------------------------------+  |
|  Links this item to specific production step                     |
|  Options: Op 1 (Mixing), Op 2 (Proofing), Op 3 (Baking)...       |
|                                                                   |
|  Production Lines (Optional)                                      |
|  +-------------------------------------------------------------+  |
|  | [ ] Line 1 - Bread Production                               |  |
|  | [x] Line 2 - Pastry Production                              |  |
|  | [ ] Line 3 - Cake Production                                |  |
|  +-------------------------------------------------------------+  |
|  Leave empty = available on all lines. Select specific lines to  |
|  restrict item usage.                                             |
|                                                                   |
|  Conditional Flags (Optional)                                     |
|  +-------------------------------------------------------------+  |
|  | Select applicable flags...                                v  |  |
|  +-------------------------------------------------------------+  |
|  [x] organic  [x] vegan  [ ] gluten-free  [ ] kosher  [ ] halal  |
|                                                                   |
|  Use for variant recipes (e.g., "organic" flag for organic SKUs) |
|                                                                   |
|  Notes (Optional)                                                 |
|  +-------------------------------------------------------------+  |
|  | Special handling: Store below 20C. Mix for 5 minutes.      |  |
|  |                                                             |  |
|  +-------------------------------------------------------------+  |
|  Max 500 characters                                               |
|                                                                   |
+-------------------------------------------------------------------+
|                                                                   |
|  [Cancel]                    [Save Item] [Save & Add Another]    |
|                                                                   |
+-------------------------------------------------------------------+
```

### Add Alternative Modal

```
+-------------------------------------------------------------------+
|  Add Alternative for: RM-001 Wheat Flour Premium               [X]|
+-------------------------------------------------------------------+
|                                                                   |
|  Primary Item:                                                    |
|  RM-001 - Wheat Flour Premium (50 kg, Seq 10, Op 1: Mixing)      |
|                                                                   |
|  -----------------------------------------------------------------|
|                                                                   |
|  Alternative Component * (Required)                               |
|  +-------------------------------------------------------------+  |
|  | Search alternative materials...                           v |  |
|  +-------------------------------------------------------------+  |
|  Must be same product type (Raw Material). Cannot be same as      |
|  primary or existing alternative.                                 |
|                                                                   |
|  +-------------------------------------------------------------+  |
|  | Selected: RM-005 - Whole Wheat Flour Organic                |  |
|  |   Type: Raw Material | Base UoM: kg | Stock: 200 kg         |  |
|  |   Allergens: Gluten | Cost: 6.50 PLN/kg                     |  |
|  +-------------------------------------------------------------+  |
|                                                                   |
|  Quantity * (Required)               Unit of Measure              |
|  +--------------------------+       +-------------------------+   |
|  | 48.000                   |       | kg                      |   |
|  +--------------------------+       +-------------------------+   |
|  May differ from primary (e.g., different density/absorption)     |
|                                                                   |
|  Preference Order * (Required)                                    |
|  +--------------------------+                                     |
|  | 2                        |                                     |
|  +--------------------------+                                     |
|  1 = primary (default), 2+ = fallback order. System picks lowest  |
|  available preference when multiple alternatives exist.           |
|                                                                   |
|  Notes (Optional)                                                 |
|  +-------------------------------------------------------------+  |
|  | Use when primary unavailable. Adjust water by -5% due to    |  |
|  | higher absorption. May darken final product color.          |  |
|  +-------------------------------------------------------------+  |
|  Instructions for production team on using this alternative       |
|                                                                   |
+-------------------------------------------------------------------+
|                                                                   |
|  [Cancel]                                       [Add Alternative] |
|                                                                   |
+-------------------------------------------------------------------+
```

### Add Byproduct Modal

```
+-------------------------------------------------------------------+
|  Add Byproduct                                                 [X]|
+-------------------------------------------------------------------+
|                                                                   |
|  Byproduct *                                                      |
|  +-------------------------------------------------------------+  |
|  | Search byproduct (BP) items...                            v |  |
|  +-------------------------------------------------------------+  |
|  Select product with type "Byproduct" (BP)                        |
|                                                                   |
|  +-------------------------------------------------------------+  |
|  | Selected: BP-001 - Bread Crumbs                             |  |
|  |   Type: Byproduct | Base UoM: kg | Value: 2.00 PLN/kg      |  |
|  +-------------------------------------------------------------+  |
|                                                                   |
|  Quantity *                          Unit of Measure              |
|  +--------------------------+       +-------------------------+   |
|  | 2.000                    |       | kg (from product)       |   |
|  +--------------------------+       +-------------------------+   |
|  Expected byproduct output per batch (100 kg main output)         |
|                                                                   |
|  Yield Percentage (Auto-calculated)                               |
|  +--------------------------+                                     |
|  | 2.0%                     |  (2 kg / 100 kg × 100)              |
|  +--------------------------+                                     |
|  Read-only: calculated from byproduct qty / main output qty       |
|                                                                   |
|  Notes (Optional)                                                 |
|  +-------------------------------------------------------------+  |
|  | Generated from crust trimming after baking. Collect in      |  |
|  | dedicated container for reprocessing.                       |  |
|  +-------------------------------------------------------------+  |
|                                                                   |
+-------------------------------------------------------------------+
|                                                                   |
|  [Cancel]                                         [Add Byproduct] |
|                                                                   |
+-------------------------------------------------------------------+
```

### Empty State (No Items)

```
+-----------------------------------------------------------------------------+
|  <- Back to BOM List                          [Scale BOM] [Export] [Save]  |
+-----------------------------------------------------------------------------+
|                                                                             |
|  BOM-002: New Product Recipe - v1.0                            [Draft]     |
|  Product: PRD-NEW-01 | Output: 50 kg | Effective: 2025-01-15               |
|  Routing: Not assigned                                        [Assign]     |
|  --------------------------------------------------------------------       |
|                                                                             |
+-----------------------------------------------------------------------------+
|                                                                             |
|  BOM Items (Components)                       [+ Add Item] [Import CSV]    |
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
|  |    Or import from: [Copy from BOM] [Import CSV]                      | |
|  |                                                                       | |
|  +-----------------------------------------------------------------------+ |
|                                                                             |
|  +-----------------------------------------------------------------------+ |
|  |  [i] Example BOM items for a bread recipe:                            | |
|  |  1. Flour (50 kg) -> 2. Water (30 L) -> 3. Yeast (0.5 kg)           | |
|  |  4. Packaging (100 pcs)                                               | |
|  +-----------------------------------------------------------------------+ |
|                                                                             |
+-----------------------------------------------------------------------------+
```

### Loading State

```
+-----------------------------------------------------------------------------+
|  <- Back to BOM List                          [Scale BOM] [Export] [Save]  |
+-----------------------------------------------------------------------------+
|                                                                             |
|  [Skeleton: BOM Header]                                        [Skeleton]  |
|  [Skeleton: Product info line]                                             |
|  ----------------------------------------------------------------------     |
|                                                                             |
+-----------------------------------------------------------------------------+
|                                                                             |
|  BOM Items (Components)                       [+ Add Item] [Import CSV]    |
|  ----------------------------------------------------------------------     |
|                                                                             |
|                         [Spinner]                                           |
|                                                                             |
|                   Loading BOM items...                                      |
|                                                                             |
|                                                                             |
+-----------------------------------------------------------------------------+
```

### Error State

```
+-----------------------------------------------------------------------------+
|  <- Back to BOM List                          [Scale BOM] [Export] [Save]  |
+-----------------------------------------------------------------------------+
|                                                                             |
|  +-----------------------------------------------------------------------+ |
|  |  [X] Failed to Load BOM Items                                         | |
|  |                                                                       | |
|  |  Error: BOM not found or you don't have permission to view it.       | |
|  |                                                                       | |
|  |  [<- Back to BOM List]                               [Retry]          | |
|  +-----------------------------------------------------------------------+ |
|                                                                             |
+-----------------------------------------------------------------------------+
```

### Validation Error State (Item Modal)

```
+-------------------------------------------------------------------+
|  Add Component to BOM                                          [X]|
+-------------------------------------------------------------------+
|                                                                   |
|  +-------------------------------------------------------------+  |
|  | [!] Validation Error                                        |  |
|  |                                                             |  |
|  | - Quantity must be greater than 0                           |  |
|  | - UoM does not match component base UoM (expected: kg)      |  |
|  |                                                             |  |
|  | [Dismiss]                                                   |  |
|  +-------------------------------------------------------------+  |
|                                                                   |
|  Component *                                                      |
|  +-------------------------------------------------------------+  |
|  | RM-001 - Wheat Flour Premium                                |  |
|  +-------------------------------------------------------------+  |
|                                                                   |
|  Quantity * (ERROR HIGHLIGHT)                                     |
|  +--------------------------+       +-------------------------+   |
|  | 0                        | [!]   | L (should be kg)    [!] |   |
|  +--------------------------+       +-------------------------+   |
|  [!] Quantity must be greater than 0                              |
|  [!] UoM mismatch: component base UoM is "kg", you entered "L"    |
|                                                                   |
|  [... rest of form ...]                                           |
|                                                                   |
+-------------------------------------------------------------------+
|                                                                   |
|  [Cancel]                                               [Save Item]|
|                                                         (disabled) |
+-------------------------------------------------------------------+
```

---

## Key Components

### 1. Page Header

#### BOM Info (Read-Only Display)
- **BOM ID**: Large, prominent (e.g., "BOM-001: White Bread 800g - v2.1")
- **Product**: Product code and name (e.g., "PRD-BREAD-WH-01")
- **Output**: Batch size (e.g., "100 kg")
- **Effective Date**: "Effective: 2024-06-01"
- **Routing**: Routing code/name with [Change] button
- **Status Badge**: Draft, Active, Phased Out, Inactive

#### Header Actions
- **<- Back to BOM List**: Navigate back to TEC-005 list
- **[Scale BOM]**: Open scaling modal (batch size adjustment)
- **[Export]**: Export items to CSV
- **[Save]**: Save changes (validates all items)

### 2. BOM Items Table

#### Table Columns
| Column | Description | Width | Sortable |
|--------|-------------|-------|----------|
| Seq | Sequence number (10, 20, 30...) | 60px | Yes |
| Component | Product code + name | 250px | Yes |
| Type | RM/ING/PKG badge | 80px | Yes |
| Qty | Quantity (decimal, 6 places) | 100px | No |
| UoM | Unit of measure | 80px | No |
| Operation | Assigned routing operation | 150px | Yes |
| Actions | [v] dropdown menu | 100px | No |

#### Sub-Row Display (Below Component)
- **Scrap %**: "Scrap: 2.0%"
- **LP Mode**: "LP: Partial" or "LP: Whole LP"
- **Conditional Flags**: "Flags: organic, vegan" (if any)
- **Alternatives**: "└ ALT: RM-005 Whole Wheat (48 kg) - Priority 2"
- **Alternative Action**: "[+ Add Alternative]" link

#### Row Actions Menu ([v])
- **Edit Item**: Opens edit modal
- **Add Alternative**: Opens alternative modal
- **Duplicate**: Copy item with new sequence
- **Move Up/Down**: Change sequence order
- **Delete**: Remove item (with confirmation)

#### Table Footer Summary
- **Total Input**: Sum of all input quantities (grouped by UoM)
- **Expected Output**: From BOM header output_qty
- **Yield %**: (Output / Input) × 100 with info tooltip

### 3. Byproducts Section

#### Byproduct Table Columns
| Column | Description | Width |
|--------|-------------|-------|
| # | Auto-number | 50px |
| Product | Byproduct code + name | 250px |
| Qty | Quantity | 100px |
| UoM | Unit | 80px |
| Yield% | Auto-calculated (qty/output×100) | 100px |
| Notes | Production notes | 200px |
| Actions | Edit, Delete | 80px |

#### Byproduct Footer
- Shows total byproduct yield percentage

### 4. Summary Panel

#### Collapsed State (Default)
- **Total Components**: Count of items
- **Total Material Cost**: Sum with timestamp + [Recalc] button
- **Allergens Detected**: List of allergens (from components)
- **Conditional Flags**: List of flags used
- **[i View Details v]**: Toggle to expanded state

#### Expanded State
Shows detailed breakdowns:
- **Components Breakdown**: Count by type (RM, ING, PKG)
- **Material Costs**: Per-item cost breakdown
- **Allergen Summary**: Source tracking
- **Conditional Flags Used**: Which items have which flags
- **Operation Coverage**: Items assigned to each operation
- **[i Hide Details ^]**: Toggle back to collapsed

### 5. Item Modal Fields

#### Component Selector (Required)
- **Type**: Searchable dropdown (Combobox)
- **Label**: "Component *"
- **Placeholder**: "Search materials, ingredients, packaging..."
- **Options**: RM, ING, PKG type products only
- **Display**: Shows selected product details (type, UoM, stock, allergens, cost)
- **Validation**: Required, cannot be same product as BOM output

#### Quantity (Required)
- **Type**: Decimal input
- **Label**: "Quantity *"
- **Validation**: > 0, max 6 decimal places
- **Help Text**: "Amount needed per batch output (X kg)"

#### Unit of Measure (Auto-filled)
- **Type**: Read-only display
- **Label**: "Unit of Measure"
- **Value**: From selected component's base_uom
- **Validation**: Server-side trigger checks UoM match (migration 049)

#### Sequence (Optional)
- **Type**: Number input
- **Label**: "Sequence"
- **Default**: Auto-suggest next available (max + 10)
- **Validation**: Integer >= 0
- **Help Text**: "Order in production (10, 20, 30...)"

#### Scrap Allowance % (Optional)
- **Type**: Decimal input
- **Label**: "Scrap Allowance %"
- **Default**: 0
- **Validation**: 0-100, max 2 decimal places
- **Help Text**: "Expected material loss"

#### License Plate Consumption Mode (Required)
- **Type**: Radio buttons
- **Label**: "License Plate Consumption Mode *"
- **Options**:
  - Partial: Consume only required quantity from LP
  - Whole LP: Consume entire License Plate (1:1)
- **Default**: Partial
- **Help Text**: Explains use cases for each mode

#### Operation Assignment (Optional)
- **Type**: Dropdown (Select)
- **Label**: "Operation Assignment"
- **Options**: Operations from assigned routing (if routing_id set)
- **Display**: "Op [seq]: [name]" (e.g., "Op 1: Mixing")
- **Help Text**: "Links this item to specific production step"
- **Validation**: Operation must exist in routing

#### Production Lines (Optional)
- **Type**: Checkbox group
- **Label**: "Production Lines"
- **Options**: All production lines from settings
- **Default**: None selected (= all lines)
- **Help Text**: "Leave empty = available on all lines"

#### Conditional Flags (Optional)
- **Type**: Multi-select dropdown
- **Label**: "Conditional Flags"
- **Options**: From conditional_flags table
- **Examples**: organic, vegan, gluten-free, kosher, halal
- **Help Text**: "Use for variant recipes"

#### Notes (Optional)
- **Type**: Textarea
- **Label**: "Notes"
- **Rows**: 3
- **Max Length**: 500 characters
- **Help Text**: "Max 500 characters"

### 6. Alternative Modal Fields

#### Alternative Component (Required)
- **Type**: Searchable dropdown
- **Label**: "Alternative Component *"
- **Options**: Same type as primary component
- **Validation**: Cannot be same as primary or existing alternatives
- **Display**: Shows product details

#### Quantity (Required)
- **Type**: Decimal input
- **Label**: "Quantity *"
- **Validation**: > 0, max 6 decimal places
- **Help Text**: "May differ from primary (e.g., different density)"

#### Unit of Measure (Auto-filled)
- **Type**: Read-only display
- **Label**: "Unit of Measure"
- **Value**: From alternative product's base_uom

#### Preference Order (Required)
- **Type**: Number input
- **Label**: "Preference Order *"
- **Default**: 2 (primary is always 1)
- **Validation**: Integer >= 2
- **Help Text**: "1 = primary, 2+ = fallback order"

#### Notes (Optional)
- **Type**: Textarea
- **Label**: "Notes"
- **Help Text**: "Instructions for production team on using this alternative"

### 7. Byproduct Modal Fields

#### Byproduct (Required)
- **Type**: Searchable dropdown
- **Label**: "Byproduct *"
- **Options**: Products with type "Byproduct" (BP)
- **Display**: Shows product details

#### Quantity (Required)
- **Type**: Decimal input
- **Label**: "Quantity *"
- **Validation**: > 0, max 6 decimal places
- **Help Text**: "Expected byproduct output per batch"

#### Unit of Measure (Auto-filled)
- **Type**: Read-only display
- **Label**: "Unit of Measure"
- **Value**: From byproduct's base_uom

#### Yield Percentage (Auto-calculated)
- **Type**: Read-only display
- **Label**: "Yield Percentage"
- **Calculation**: (byproduct_qty / bom_output_qty) × 100
- **Display**: "X.XX% (Y kg / Z kg × 100)"

#### Notes (Optional)
- **Type**: Textarea
- **Label**: "Notes"
- **Help Text**: "Source and handling notes"

---

## Main Actions

### Add Item
- **Button**: "[+ Add Item]" (top-right of items section)
- **Action**: Opens Item Modal in create mode
- **Pre-fill**: Sequence = max(current_sequences) + 10
- **On Success**: Close modal, refresh items table, show toast, update summary

### Edit Item
- **Button**: "Edit" in row actions menu
- **Action**: Opens Item Modal in edit mode
- **Pre-fill**: All fields from selected item
- **On Success**: Close modal, refresh items table, show toast, update summary

### Delete Item
- **Button**: "Delete" in row actions menu
- **Action**: Show confirmation dialog
- **Confirmation**: "Delete component '[name]'? This will also remove any alternatives."
- **On Confirm**: DELETE /api/technical/boms/{bomId}/items/{itemId}
- **On Success**: Refresh items table, show toast, update summary

### Add Alternative
- **Button**: "[+ Add Alternative]" link in item sub-row
- **Action**: Opens Alternative Modal
- **Pre-fill**: Primary item info displayed
- **On Success**: Close modal, refresh items table (show alternative in sub-row), toast

### Add Byproduct
- **Button**: "[+ Add Byproduct]" (top-right of byproducts section)
- **Action**: Opens Byproduct Modal
- **On Success**: Close modal, refresh byproducts table, show toast, update summary

### Scale BOM
- **Button**: "[Scale BOM]" (top-right of page header)
- **Action**: Opens scaling modal (from TEC-006)
- **Purpose**: Adjust all quantities by multiplier
- **Note**: One-time calculation, not saved to BOM

### Import CSV
- **Button**: "[Import CSV]" (next to Add Item)
- **Action**: File upload dialog
- **Format**: CSV with columns: component_code, quantity, uom, sequence, scrap_percent, lp_mode
- **On Success**: Validate and bulk insert items, refresh table

### Export CSV
- **Button**: "[Export]" (top-right of page header)
- **Action**: Download CSV of all items
- **Filename**: "BOM-{id}-items-{date}.csv"

### Save Changes
- **Button**: "[Save]" (top-right of page header)
- **Action**: Save all changes to BOM items
- **Validation**: All items valid, no duplicate sequences (warning only)
- **On Success**: Toast confirmation, refresh summary

---

## State Transitions

```
Page Loads
  |
  v
LOADING (Show skeleton)
  | Fetch BOM header + items
  v
SUCCESS (Display header + items table + summary)
  OR
ERROR (Show error banner, offer retry)

----------------------------------------------

From SUCCESS:

[+ Add Item] clicked
  |
  v
Item Modal Opens (Create Mode)
  | User fills form
  | [Save Item]
  v
LOADING (Disable modal buttons)
  | POST /api/technical/boms/{id}/items
  v
SUCCESS (Close modal, refresh table, toast, update summary)
  OR
ERROR (Show error in modal, keep open)

----------------------------------------------

[Edit Item] clicked
  |
  v
Item Modal Opens (Edit Mode)
  | User edits form
  | [Save Changes]
  v
LOADING (Disable modal buttons)
  | PUT /api/technical/boms/{bomId}/items/{itemId}
  v
SUCCESS (Close modal, refresh table, toast, update summary)
  OR
ERROR (Show error in modal, keep open)

----------------------------------------------

[Delete Item] clicked
  |
  v
Confirmation Dialog Opens
  | [Confirm]
  v
LOADING (Show spinner in row)
  | DELETE /api/technical/boms/{bomId}/items/{itemId}
  v
SUCCESS (Refresh table, toast, update summary)
  OR
ERROR (Show error toast, keep row)

----------------------------------------------

[+ Add Alternative] clicked
  |
  v
Alternative Modal Opens
  | User fills form
  | [Add Alternative]
  v
LOADING (Disable modal buttons)
  | POST /api/technical/boms/{id}/items/{itemId}/alternatives
  v
SUCCESS (Close modal, refresh table to show alternative, toast)
  OR
ERROR (Show error in modal, keep open)

----------------------------------------------

[+ Add Byproduct] clicked
  |
  v
Byproduct Modal Opens
  | User fills form
  | [Add Byproduct]
  v
LOADING (Disable modal buttons)
  | POST /api/technical/boms/{id}/byproducts
  v
SUCCESS (Close modal, refresh byproducts table, toast, update summary)
  OR
ERROR (Show error in modal, keep open)

----------------------------------------------

[View Details v] clicked
  |
  v
Summary Panel Expands
  | Show detailed breakdown
  | [Hide Details ^] to collapse
```

---

## Validation

### Item Modal Validation

```typescript
{
  product_id: {
    required: "Component is required",
    validate: (value) => {
      if (value === bomProductId) {
        return "Cannot add BOM product as its own component (circular reference)"
      }
      if (existingItems.includes(value)) {
        return "Component already exists in this BOM"
      }
      return true
    }
  },
  quantity: {
    required: "Quantity is required",
    min: { value: 0.000001, message: "Quantity must be greater than 0" },
    validate: (value) => {
      const decimals = (value.toString().split('.')[1] || '').length
      if (decimals > 6) {
        return "Maximum 6 decimal places allowed"
      }
      return true
    }
  },
  uom: {
    required: "Unit of measure is required",
    validate: (value, formValues) => {
      // Server-side trigger validates UoM match (migration 049)
      // Client-side warning only
      if (selectedComponent && value !== selectedComponent.base_uom) {
        return "WARNING: UoM does not match component base UoM. Server will validate."
      }
      return true
    }
  },
  sequence: {
    min: { value: 0, message: "Sequence cannot be negative" }
  },
  scrap_percent: {
    min: { value: 0, message: "Scrap % cannot be negative" },
    max: { value: 100, message: "Scrap % cannot exceed 100%" }
  },
  consume_whole_lp: {
    required: "License Plate mode is required"
  },
  operation_seq: {
    validate: (value) => {
      if (value && !routingOperations.includes(value)) {
        return "Operation does not exist in assigned routing"
      }
      return true
    }
  },
  notes: {
    maxLength: { value: 500, message: "Notes must be less than 500 characters" }
  }
}
```

### Alternative Modal Validation

```typescript
{
  alternative_product_id: {
    required: "Alternative component is required",
    validate: (value) => {
      if (value === primaryProduct.id) {
        return "Alternative cannot be same as primary component"
      }
      if (value === bomProductId) {
        return "Cannot add BOM product as alternative"
      }
      if (existingAlternatives.includes(value)) {
        return "Alternative already exists for this item"
      }
      if (alternativeProduct.type !== primaryProduct.type) {
        return "Alternative must be same product type as primary"
      }
      return true
    }
  },
  quantity: {
    required: "Quantity is required",
    min: { value: 0.000001, message: "Quantity must be greater than 0" }
  },
  preference_order: {
    required: "Preference order is required",
    min: { value: 2, message: "Preference order must be 2 or higher (1 is primary)" }
  }
}
```

### Byproduct Modal Validation

```typescript
{
  product_id: {
    required: "Byproduct is required",
    validate: (value) => {
      if (selectedProduct.type !== 'BP') {
        return "Must select a Byproduct (BP) type product"
      }
      return true
    }
  },
  quantity: {
    required: "Quantity is required",
    min: { value: 0.000001, message: "Quantity must be greater than 0" }
  }
}
```

### Error Messages

```typescript
{
  "DUPLICATE_COMPONENT": "Component already exists in this BOM. Edit the existing item instead.",
  "CIRCULAR_REFERENCE": "Cannot add BOM product as its own component.",
  "INVALID_QUANTITY": "Quantity must be greater than 0 and have max 6 decimal places.",
  "UOM_MISMATCH": "WARNING: UoM does not match component base UoM. This may cause issues in production.",
  "INVALID_OPERATION": "Operation does not exist in assigned routing. Please assign a valid operation.",
  "NO_ROUTING": "Cannot assign operation: BOM has no routing assigned.",
  "ITEM_NOT_FOUND": "BOM item not found.",
  "PERMISSION_DENIED": "You do not have permission to modify this BOM.",
  "BOM_LOCKED": "Cannot modify items: BOM is locked or in use by active work orders.",
  "ALTERNATIVE_DUPLICATE": "Alternative already exists for this item.",
  "ALTERNATIVE_TYPE_MISMATCH": "Alternative must be same product type as primary component."
}
```

---

## Data Required

### API Endpoints

#### Get BOM with Items
```
GET /api/technical/boms/{id}
```

**Response:**
```typescript
{
  bom: {
    id: string
    org_id: string
    product_id: string
    product_code: string
    product_name: string
    version: string
    status: "Draft" | "Active" | "Phased Out" | "Inactive"
    routing_id: string | null
    routing_code: string | null
    routing_name: string | null
    effective_from: string  // ISO date
    effective_to: string | null  // ISO date
    output_qty: number
    output_uom: string
    created_at: string
    updated_at: string
  },
  items: [
    {
      id: string
      bom_id: string
      product_id: string
      product_code: string
      product_name: string
      product_type: "RM" | "ING" | "PKG"
      quantity: number
      uom: string
      sequence: number
      scrap_percent: number
      consume_whole_lp: boolean
      operation_seq: number | null
      operation_name: string | null
      line_ids: string[] | null
      line_names: string[] | null
      condition_flags: object | null
      notes: string | null
      created_at: string
      updated_at: string
    }
  ],
  alternatives: [
    {
      id: string
      bom_item_id: string
      alternative_product_id: string
      alternative_product_code: string
      alternative_product_name: string
      quantity: number
      uom: string
      preference_order: number
      notes: string | null
      created_at: string
    }
  ],
  byproducts: [
    {
      id: string
      bom_id: string
      product_id: string
      product_code: string
      product_name: string
      quantity: number
      uom: string
      yield_percent: number
      notes: string | null
      created_at: string
    }
  ],
  summary: {
    total_items: number
    total_input_qty: number  // sum of all item quantities
    expected_output_qty: number  // bom.output_qty
    yield_percent: number  // (output / input) × 100
    total_material_cost: number
    allergens: string[]  // list of allergen names
    conditional_flags: object  // { organic: 2, vegan: 1 }
    operation_coverage: object  // { "Op 1": 4, "Op 4": 1 }
  }
}
```

#### Get BOM Items
```
GET /api/technical/boms/{id}/items
```

**Response:**
```typescript
{
  items: [/* same as above */],
  alternatives: [/* same as above */]
}
```

#### Create BOM Item
```
POST /api/technical/boms/{id}/items
```

**Request Body:**
```typescript
{
  product_id: string
  quantity: number
  uom: string
  sequence?: number  // default: auto-increment
  scrap_percent?: number  // default: 0
  consume_whole_lp: boolean  // default: false
  operation_seq?: number | null
  line_ids?: string[] | null
  condition_flags?: object | null
  notes?: string | null
}
```

**Response:**
```typescript
{
  item: {
    id: string
    bom_id: string
    product_id: string
    product_code: string
    product_name: string
    product_type: string
    quantity: number
    uom: string
    sequence: number
    scrap_percent: number
    consume_whole_lp: boolean
    operation_seq: number | null
    line_ids: string[] | null
    condition_flags: object | null
    notes: string | null
    created_at: string
    updated_at: string
  }
}
```

#### Update BOM Item
```
PUT /api/technical/boms/{bomId}/items/{itemId}
```

**Request Body:** (same as create)

**Response:** (same as create)

#### Delete BOM Item
```
DELETE /api/technical/boms/{bomId}/items/{itemId}
```

**Response:**
```typescript
{
  success: true
  message: "BOM item deleted successfully"
}
```

#### Create Alternative
```
POST /api/technical/boms/{id}/items/{itemId}/alternatives
```

**Request Body:**
```typescript
{
  alternative_product_id: string
  quantity: number
  uom: string
  preference_order: number  // >= 2
  notes?: string | null
}
```

**Response:**
```typescript
{
  alternative: {
    id: string
    bom_item_id: string
    alternative_product_id: string
    alternative_product_code: string
    alternative_product_name: string
    quantity: number
    uom: string
    preference_order: number
    notes: string | null
    created_at: string
  }
}
```

#### Get Alternatives
```
GET /api/technical/boms/{id}/items/{itemId}/alternatives
```

**Response:**
```typescript
{
  alternatives: [/* same as create response */]
}
```

#### Delete Alternative
```
DELETE /api/technical/boms/{id}/items/{itemId}/alternatives/{altId}
```

**Response:**
```typescript
{
  success: true
  message: "Alternative deleted successfully"
}
```

#### Create Byproduct
```
POST /api/technical/boms/{id}/byproducts
```

**Request Body:**
```typescript
{
  product_id: string
  quantity: number
  uom: string
  notes?: string | null
}
```

**Response:**
```typescript
{
  byproduct: {
    id: string
    bom_id: string
    product_id: string
    product_code: string
    product_name: string
    quantity: number
    uom: string
    yield_percent: number  // auto-calculated
    notes: string | null
    created_at: string
  }
}
```

#### Get Routing Operations (for dropdown)
```
GET /api/technical/routings/{routingId}/operations
```

**Response:**
```typescript
{
  operations: [
    {
      id: string
      sequence: number
      operation_name: string
      display_name: string  // "Op {seq}: {name}"
    }
  ]
}
```

#### Get Products (for component selector)
```
GET /api/technical/products?types=RM,ING,PKG&status=Active
```

**Response:**
```typescript
{
  products: [
    {
      id: string
      code: string
      name: string
      type: "RM" | "ING" | "PKG"
      base_uom: string
      stock_qty: number
      allergens: string[]
      cost_per_unit: number | null
    }
  ]
}
```

#### Get Conditional Flags
```
GET /api/technical/conditional-flags
```

**Response:**
```typescript
{
  flags: [
    {
      id: string
      code: string
      name: string
      is_active: boolean
    }
  ]
}
```

---

## Technical Notes

### Auto-Sequence Logic
```typescript
// When opening Add Item modal
const sequences = items.map(item => item.sequence)
const maxSequence = Math.max(...sequences, 0)
const nextSequence = maxSequence + 10

setDefaultValues({
  product_id: null,
  quantity: 0,
  uom: "",
  sequence: nextSequence,
  scrap_percent: 0,
  consume_whole_lp: false,
  operation_seq: null,
  line_ids: null,
  condition_flags: null,
  notes: null
})
```

### UoM Validation (Migration 049)
```sql
-- Server-side trigger validates UoM match
CREATE OR REPLACE FUNCTION validate_bom_item_uom()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.uom != (SELECT base_uom FROM products WHERE id = NEW.product_id) THEN
    RAISE WARNING 'BOM item UoM (%) does not match component base UoM (%)',
      NEW.uom, (SELECT base_uom FROM products WHERE id = NEW.product_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bom_item_uom_validation
  BEFORE INSERT OR UPDATE ON bom_items
  FOR EACH ROW
  EXECUTE FUNCTION validate_bom_item_uom();
```

### Quantity Validation (Migration 049)
```sql
-- Database constraint enforces quantity > 0
ALTER TABLE bom_items
ADD CONSTRAINT bom_item_quantity_positive
CHECK (quantity > 0);
```

### Yield Calculation
```typescript
const calculateYield = (items: BOMItem[], outputQty: number) => {
  // Sum input quantities (by UoM)
  const inputTotals = items.reduce((acc, item) => {
    if (!acc[item.uom]) acc[item.uom] = 0
    acc[item.uom] += item.quantity
    return acc
  }, {} as Record<string, number>)

  // For simplicity, compare only if single UoM matches output UoM
  const outputUom = bom.output_uom
  const totalInput = inputTotals[outputUom] || 0

  if (totalInput === 0) return 0

  const yieldPercent = (outputQty / totalInput) * 100
  return Math.round(yieldPercent * 100) / 100  // 2 decimals
}
```

### Summary Calculations
```typescript
const calculateSummary = (items: BOMItem[], alternatives: Alternative[], byproducts: Byproduct[]) => {
  const totalItems = items.length

  // Material cost
  const totalMaterialCost = items.reduce((sum, item) => {
    const cost = item.quantity * (item.product_cost_per_unit || 0)
    return sum + cost
  }, 0)

  // Allergens (unique, from all items)
  const allergens = [...new Set(
    items.flatMap(item => item.product_allergens || [])
  )]

  // Conditional flags (count occurrences)
  const conditionalFlags = items.reduce((acc, item) => {
    if (item.condition_flags) {
      Object.keys(item.condition_flags).forEach(flag => {
        acc[flag] = (acc[flag] || 0) + 1
      })
    }
    return acc
  }, {} as Record<string, number>)

  // Operation coverage
  const operationCoverage = items.reduce((acc, item) => {
    if (item.operation_seq && item.operation_name) {
      const key = `Op ${item.operation_seq}: ${item.operation_name}`
      acc[key] = (acc[key] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  return {
    total_items: totalItems,
    total_material_cost: totalMaterialCost,
    allergens,
    conditional_flags: conditionalFlags,
    operation_coverage: operationCoverage
  }
}
```

### Delete Confirmation
```typescript
const handleDeleteItem = async (itemId: string, itemName: string) => {
  const confirmed = await showConfirmDialog({
    title: "Delete Component",
    message: `Delete component '${itemName}'? This will also remove any alternatives.`,
    confirmText: "Delete",
    cancelText: "Cancel",
    variant: "destructive"
  })

  if (!confirmed) return

  setLoading(true)

  try {
    const response = await fetch(
      `/api/technical/boms/${bomId}/items/${itemId}`,
      { method: 'DELETE' }
    )

    if (!response.ok) throw new Error('Failed to delete item')

    toast({
      title: 'Success',
      description: 'Component deleted successfully'
    })

    refreshItems()
    refreshSummary()
  } catch (error) {
    toast({
      title: 'Error',
      description: error.message,
      variant: 'destructive'
    })
  } finally {
    setLoading(false)
  }
}
```

### Accessibility (WCAG 2.1 AA)

- **Close button**: aria-label="Close modal"
- **Info panels**: role="status" aria-live="polite"
- **Error messages**: aria-live="assertive"
- **Loading states**: aria-busy="true" with descriptive label
- **All interactive elements**: keyboard navigable (Tab/Shift+Tab)
- **Touch targets**: >= 48x48dp
- **Color contrast**: >= 4.5:1 for text, >= 3:1 for UI components

- **Focus**: Items table keyboard navigable
- **Screen Reader**: All buttons have aria-labels
  - [+ Add Item]: "Add component to BOM"
  - [Edit]: "Edit component"
  - [Delete]: "Delete component"
  - [+ Add Alternative]: "Add alternative ingredient"
- **Touch Targets**: All action buttons >= 48x48dp
- **Keyboard Shortcuts**:
  - Arrow keys to navigate table rows
  - Enter to edit item
  - Delete key to delete item (with confirmation)
- **Error Announce**: Validation errors announced to screen reader

---

## Related Screens

- **Previous**: TEC-005 BOM List (<- Back button)
- **Parent**: TEC-006 BOM Modal (for editing BOM header)
- **Related**: TEC-001 Products List (for product selection)
- **Related**: TEC-003 Materials List (for component selection)
- **Related**: TEC-008a Routing Detail (for operation assignment)
- **Next**: Production Work Orders (consumes BOM items)

---

## Handoff Notes

### For FRONTEND-DEV

1. **Component**: `app/(authenticated)/technical/boms/[id]/items/page.tsx`
2. **Existing Code**: New screen, no existing implementation
3. **Key Features**:
   - Server-side data fetching (Next.js 15 App Router)
   - Items table with inline actions + sub-rows (alternatives)
   - Item modal (ShadCN Dialog) with component search
   - Alternative modal (ShadCN Dialog)
   - Byproduct modal (ShadCN Dialog)
   - Summary panel (collapsible with auto-calculations)
   - Real-time summary updates

4. **Libraries**:
   - ShadCN `Table` for items/byproducts lists
   - ShadCN `Dialog` for modals
   - ShadCN `Combobox` for product search
   - ShadCN `Select` for operation/line dropdowns
   - ShadCN `Badge` for status/type indicators
   - ShadCN `Collapsible` for summary panel
   - `react-hook-form` + Zod for form validation
   - `@tanstack/react-table` for items table

5. **Validation Schema** (Zod):
```typescript
import { z } from 'zod'

const bomItemFormSchema = z.object({
  product_id: z.string()
    .min(1, "Component is required"),
  quantity: z.number()
    .min(0.000001, "Quantity must be greater than 0")
    .refine(val => {
      const decimals = (val.toString().split('.')[1] || '').length
      return decimals <= 6
    }, "Maximum 6 decimal places allowed"),
  uom: z.string()
    .min(1, "Unit of measure is required"),
  sequence: z.number()
    .int("Sequence must be an integer")
    .min(0, "Sequence cannot be negative")
    .default(0),
  scrap_percent: z.number()
    .min(0, "Scrap % cannot be negative")
    .max(100, "Scrap % cannot exceed 100%")
    .default(0),
  consume_whole_lp: z.boolean()
    .default(false),
  operation_seq: z.number()
    .int()
    .nullable()
    .optional(),
  line_ids: z.array(z.string())
    .nullable()
    .optional(),
  condition_flags: z.object({})
    .nullable()
    .optional(),
  notes: z.string()
    .max(500, "Notes must be less than 500 characters")
    .nullable()
    .optional()
})

const bomAlternativeFormSchema = z.object({
  alternative_product_id: z.string()
    .min(1, "Alternative component is required"),
  quantity: z.number()
    .min(0.000001, "Quantity must be greater than 0"),
  uom: z.string()
    .min(1, "Unit of measure is required"),
  preference_order: z.number()
    .int()
    .min(2, "Preference order must be 2 or higher (1 is primary)")
    .default(2),
  notes: z.string()
    .nullable()
    .optional()
})

const bomByproductFormSchema = z.object({
  product_id: z.string()
    .min(1, "Byproduct is required"),
  quantity: z.number()
    .min(0.000001, "Quantity must be greater than 0"),
  uom: z.string()
    .min(1, "Unit of measure is required"),
  notes: z.string()
    .nullable()
    .optional()
})
```

6. **State Management**:
   - Page-level state for BOM data, items list, alternatives, byproducts
   - Modal state for item/alternative/byproduct create/edit
   - Loading state for async operations
   - Error state for API failures
   - Summary state (collapsed/expanded, auto-calculated)

7. **Real-Time Updates**:
   - Refresh items table after create/edit/delete
   - Update summary panel automatically when items change
   - Show alternatives in sub-row below primary item
   - Auto-calculate yield percentage for byproducts

8. **Error Handling**:
   - Handle 404 for BOM not found
   - Handle 403 for permission denied
   - Handle validation errors in item modal
   - Show UoM mismatch warning (server validates)
   - Show circular reference error

---

## Field Verification (PRD Cross-Check)

**BOM Items Fields (from PRD Section 3.2 - bom_items table):**
- id, bom_id (auto-generated, internal)
- product_id (Combobox, required, RM/ING/PKG only)
- quantity (Decimal input, required, > 0, max 6 decimals)
- uom (Auto-filled from product, validated by trigger)
- sequence (Number input, optional, default auto-increment)
- scrap_percent (Decimal input, optional, default 0, 0-100%)
- consume_whole_lp (Radio buttons, required, default false)
- operation_seq (Dropdown, optional, FK to routing_operations)
- line_ids (Checkbox group, optional, null = all lines)
- is_by_product (Boolean, handled in separate Byproducts section)
- is_output (Boolean, alias for is_by_product)
- yield_percent (Auto-calculated for byproducts)
- condition_flags (Multi-select dropdown, optional, JSONB)
- notes (Textarea, optional, max 500 chars)
- created_at, updated_at (auto-generated, audit fields)

**BOM Alternatives Fields (from PRD Section 3.2 - bom_alternatives table):**
- id, bom_item_id, org_id (auto-generated, internal)
- alternative_product_id (Combobox, required, same type as primary)
- quantity (Decimal input, required, > 0)
- uom (Auto-filled from alternative product)
- preference_order (Number input, required, >= 2)
- notes (Textarea, optional)
- created_at (auto-generated)

**Business Rules:**
- Quantity > 0 (Database constraint - migration 049)
- UoM should match component base UoM (Server trigger warning - migration 049)
- No duplicate components (Client + server validation)
- Sequence unique per BOM (Warning only, not enforced)
- Operation exists in assigned routing (Validated if routing_id set)
- Sum of item quantities should produce output_qty (Warning if mismatch)
- Allergens auto-inherit from components (Server-side calculation)
- Cost auto-updates on item changes (API endpoint)
- Conditional flags cascade to final product (Business logic)

**ALL PRD FIELDS VERIFIED**

---

**Status**: Ready for Implementation
**Approval Mode**: Auto-Approve
**Iterations**: 0 of 3
**PRD Compliance**: 100% (all fields verified)
**PRD Coverage**: FR-2.21 (P0), FR-2.31 (P0), FR-2.39 (P0), FR-2.38 (P1), FR-2.26 (P1), FR-2.27 (P1), FR-2.30 (P1)
**Estimated Effort**: 8-12 hours implementation
**Quality Score**: 98/100 (target)
