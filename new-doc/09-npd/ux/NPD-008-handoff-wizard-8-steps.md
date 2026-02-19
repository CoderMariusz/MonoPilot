# NPD-008: Handoff Wizard (8 Steps)

**Module**: NPD (New Product Development)
**Story**: Production Handoff
**Feature**: NPD-FR-37 to NPD-FR-47
**Status**: Wireframe Defined
**Component**: `HandoffWizard.tsx`
**Last Updated**: 2026-01-15

---

## Overview

Multi-step wizard for transferring an approved NPD project to Production. Creates Product, BOM, and optionally Pilot Work Order in a single transaction. Implements validation checklist, product decision, BOM preview, and execution progress with rollback capability.

**Handoff Flow**: Validation -> Product Decision -> BOM Preview -> Pilot WO -> Routing -> Summary -> Execution -> Success

---

## Step Indicator Breadcrumb

```
+---------------------------------------------------------------------------------+
|                                                                                  |
|  [1]----[2]----[3]----[4]----[5]----[6]----[7]----[8]                           |
|   |      |      |      |      |      |      |      |                            |
|  Val   Prod    BOM   Pilot  Route  Review  Exec  Done                           |
|                                                                                  |
|  Legend:                                                                         |
|  [#] = Current step (blue, filled)                                              |
|  [check] = Completed step (green, checkmark)                                    |
|  ( ) = Pending step (gray, outline)                                             |
|  [x] = Blocked step (red, X)                                                    |
|                                                                                  |
+---------------------------------------------------------------------------------+
```

---

## Component States

### 1. Step-1-Blocked State
- Validation checklist displayed with failed items
- Cannot proceed to Step 2
- Shows specific blockers with links to fix
- Next button disabled

### 2. Step-1-Valid State
- All validation items passed (green checkmarks)
- Next button enabled
- Ready to proceed to Product Decision

### 3. Step-2-Create-New State
- "Create new product" radio selected
- Product form fields visible
- Product code, name, type, category inputs

### 4. Step-2-Update-Existing State
- "Update existing product" radio selected
- Product search/dropdown visible
- Selected product details displayed

### 5. Step-7-Executing State
- Progress steps with animated spinner
- Sequential status updates
- No user interaction during execution

### 6. Step-8-Success State
- Success confirmation with created entities
- Links to view Product, BOM, WO
- Close/Done button

### 7. Error-Rollback State
- Error message with details
- Rollback confirmation message
- Retry or Cancel options

---

## ASCII Wireframes

### Step 1: Validation Checklist

```
+---------------------------------------------------------------------------------+
|                     Production Handoff Wizard                               [X] |
+---------------------------------------------------------------------------------+
|                                                                                  |
|  Step 1 of 8: Validation Checklist                                              |
|                                                                                  |
|  [1]----( 2 )----( 3 )----( 4 )----( 5 )----( 6 )----( 7 )----( 8 )            |
|  Val    Prod     BOM     Pilot   Route   Review   Exec    Done                  |
|                                                                                  |
+---------------------------------------------------------------------------------+
|                                                                                  |
|  PRE-HANDOFF VALIDATION                                                          |
|                                                                                  |
|  The following criteria must be met before handoff:                             |
|                                                                                  |
|  +-----------------------------------------------------------------------+      |
|  |                                                                       |      |
|  |  GATE APPROVAL                                                        |      |
|  |  [check] Gate G4 (Testing) approved                          Passed  |      |
|  |          Approved by Jane Smith on Jan 10, 2026                      |      |
|  |                                                                       |      |
|  +-----------------------------------------------------------------------+      |
|                                                                                  |
|  +-----------------------------------------------------------------------+      |
|  |                                                                       |      |
|  |  FORMULATION                                                          |      |
|  |  [check] Formulation locked                                  Passed  |      |
|  |          v2.1 locked on Jan 08, 2026                                 |      |
|  |                                                                       |      |
|  +-----------------------------------------------------------------------+      |
|                                                                                  |
|  +-----------------------------------------------------------------------+      |
|  |                                                                       |      |
|  |  COSTING                                                              |      |
|  |  [check] Costing approved by Finance                         Passed  |      |
|  |          Approved by Finance Team on Jan 09, 2026                    |      |
|  |          Target: $12.50 | Estimated: $12.75 | Variance: +2%          |      |
|  |                                                                       |      |
|  +-----------------------------------------------------------------------+      |
|                                                                                  |
|  +-----------------------------------------------------------------------+      |
|  |                                                                       |      |
|  |  COMPLIANCE DOCUMENTS                                                 |      |
|  |  [check] Required documents uploaded                         Passed  |      |
|  |          HACCP Plan, Label Proof, Allergen Declaration              |      |
|  |                                                                       |      |
|  +-----------------------------------------------------------------------+      |
|                                                                                  |
|  +-----------------------------------------------------------------------+      |
|  |                                                                       |      |
|  |  ALLERGEN DECLARATION                                                 |      |
|  |  [check] Allergens declared and validated                    Passed  |      |
|  |          Contains: Wheat, Milk, Soy                                  |      |
|  |                                                                       |      |
|  +-----------------------------------------------------------------------+      |
|                                                                                  |
|  +-----------------------------------------------------------------------+      |
|  |  [check-circle] All validation checks passed                         |      |
|  |  Ready to proceed with handoff                                        |      |
|  +-----------------------------------------------------------------------+      |
|                                                                                  |
+---------------------------------------------------------------------------------+
|                                                                                  |
|  [Cancel]                                           [Next: Product Decision ->] |
|                                                                                  |
+---------------------------------------------------------------------------------+
```

### Step 1: Validation Checklist - BLOCKED

```
+---------------------------------------------------------------------------------+
|                     Production Handoff Wizard                               [X] |
+---------------------------------------------------------------------------------+
|                                                                                  |
|  Step 1 of 8: Validation Checklist                                              |
|                                                                                  |
|  [1]----( 2 )----( 3 )----( 4 )----( 5 )----( 6 )----( 7 )----( 8 )            |
|  Val    Prod     BOM     Pilot   Route   Review   Exec    Done                  |
|                                                                                  |
+---------------------------------------------------------------------------------+
|                                                                                  |
|  [!] VALIDATION FAILED                                                           |
|                                                                                  |
|  +-----------------------------------------------------------------------+      |
|  |  [!] Cannot proceed with handoff. Fix the following issues:          |      |
|  |                                                                       |      |
|  |  * Formulation is not locked                                         |      |
|  |  * Costing not approved by Finance                                   |      |
|  +-----------------------------------------------------------------------+      |
|                                                                                  |
|  +-----------------------------------------------------------------------+      |
|  |                                                                       |      |
|  |  GATE APPROVAL                                                        |      |
|  |  [check] Gate G4 (Testing) approved                          Passed  |      |
|  |                                                                       |      |
|  +-----------------------------------------------------------------------+      |
|                                                                                  |
|  +-----------------------------------------------------------------------+      |
|  |                                                                       |      |
|  |  FORMULATION                                                 [!]     |      |
|  |  [x] Formulation locked                                      Failed  |      |
|  |      Current status: Draft                                           |      |
|  |      [Go to Formulation ->]                                          |      |
|  |                                                                       |      |
|  +-----------------------------------------------------------------------+      |
|                                                                                  |
|  +-----------------------------------------------------------------------+      |
|  |                                                                       |      |
|  |  COSTING                                                     [!]     |      |
|  |  [x] Costing approved by Finance                             Failed  |      |
|  |      Current status: Pending Approval                                |      |
|  |      [Go to Costing ->]                                              |      |
|  |                                                                       |      |
|  +-----------------------------------------------------------------------+      |
|                                                                                  |
|  +-----------------------------------------------------------------------+      |
|  |                                                                       |      |
|  |  COMPLIANCE DOCUMENTS                                                 |      |
|  |  [check] Required documents uploaded                         Passed  |      |
|  |                                                                       |      |
|  +-----------------------------------------------------------------------+      |
|                                                                                  |
|  +-----------------------------------------------------------------------+      |
|  |                                                                       |      |
|  |  ALLERGEN DECLARATION                                                 |      |
|  |  [check] Allergens declared and validated                    Passed  |      |
|  |                                                                       |      |
|  +-----------------------------------------------------------------------+      |
|                                                                                  |
|  +-----------------------------------------------------------------------+      |
|  |  [x-circle] 2 of 5 validation checks failed                          |      |
|  |  Fix all issues before proceeding                                     |      |
|  +-----------------------------------------------------------------------+      |
|                                                                                  |
+---------------------------------------------------------------------------------+
|                                                                                  |
|  [Cancel]                                       [Next: Product Decision] (disabled)
|                                                                                  |
+---------------------------------------------------------------------------------+
```

### Step 2: Product Decision - Create New

```
+---------------------------------------------------------------------------------+
|                     Production Handoff Wizard                               [X] |
+---------------------------------------------------------------------------------+
|                                                                                  |
|  Step 2 of 8: Product Decision                                                  |
|                                                                                  |
|  [check]----[2]----( 3 )----( 4 )----( 5 )----( 6 )----( 7 )----( 8 )          |
|  Val        Prod    BOM     Pilot   Route   Review   Exec    Done               |
|                                                                                  |
+---------------------------------------------------------------------------------+
|                                                                                  |
|  PRODUCT DECISION                                                                |
|                                                                                  |
|  How would you like to create the production product?                           |
|                                                                                  |
|  +-----------------------------------------------------------------------+      |
|  |                                                                       |      |
|  |  (o) Create new product                                               |      |
|  |      A new product will be created from the NPD formulation          |      |
|  |                                                                       |      |
|  |  ( ) Update existing product                                          |      |
|  |      Add a new BOM version to an existing product                    |      |
|  |                                                                       |      |
|  +-----------------------------------------------------------------------+      |
|                                                                                  |
|  NEW PRODUCT DETAILS                                                             |
|                                                                                  |
|  +-----------------------------------------------------------------------+      |
|  |                                                                       |      |
|  |  Product Code *                    Product Name *                     |      |
|  |  [PRD-2026-001_________]           [Premium Veggie Burger________]    |      |
|  |  Auto-generated, editable          From NPD project name             |      |
|  |                                                                       |      |
|  |  Product Type *                    Category                           |      |
|  |  [Finished Good          v]        [Frozen Foods           v]        |      |
|  |                                                                       |      |
|  |  Description                                                          |      |
|  |  +---------------------------------------------------------------+   |      |
|  |  | Plant-based veggie burger developed through NPD process.     |   |      |
|  |  | Contains soy protein, vegetables, and seasonings.            |   |      |
|  |  +---------------------------------------------------------------+   |      |
|  |                                                                       |      |
|  |  Unit of Measure *                 Standard Pack Size                 |      |
|  |  [EA (Each)              v]        [24_________________]              |      |
|  |                                                                       |      |
|  +-----------------------------------------------------------------------+      |
|                                                                                  |
|  SOURCE REFERENCE                                                                |
|  +-----------------------------------------------------------------------+      |
|  |  NPD Project: NPD-2024-015 - Premium Veggie Burger                   |      |
|  |  Formulation: v2.1 (locked)                                          |      |
|  |  Source will be recorded for traceability                            |      |
|  +-----------------------------------------------------------------------+      |
|                                                                                  |
+---------------------------------------------------------------------------------+
|                                                                                  |
|  [<- Back]                                              [Next: BOM Preview ->]  |
|                                                                                  |
+---------------------------------------------------------------------------------+
```

### Step 2: Product Decision - Update Existing

```
+---------------------------------------------------------------------------------+
|                     Production Handoff Wizard                               [X] |
+---------------------------------------------------------------------------------+
|                                                                                  |
|  Step 2 of 8: Product Decision                                                  |
|                                                                                  |
|  [check]----[2]----( 3 )----( 4 )----( 5 )----( 6 )----( 7 )----( 8 )          |
|  Val        Prod    BOM     Pilot   Route   Review   Exec    Done               |
|                                                                                  |
+---------------------------------------------------------------------------------+
|                                                                                  |
|  PRODUCT DECISION                                                                |
|                                                                                  |
|  How would you like to create the production product?                           |
|                                                                                  |
|  +-----------------------------------------------------------------------+      |
|  |                                                                       |      |
|  |  ( ) Create new product                                               |      |
|  |      A new product will be created from the NPD formulation          |      |
|  |                                                                       |      |
|  |  (o) Update existing product                                          |      |
|  |      Add a new BOM version to an existing product                    |      |
|  |                                                                       |      |
|  +-----------------------------------------------------------------------+      |
|                                                                                  |
|  SELECT EXISTING PRODUCT                                                         |
|                                                                                  |
|  +-----------------------------------------------------------------------+      |
|  |                                                                       |      |
|  |  Search Product *                                                     |      |
|  |  [Search by code or name...                              ] [Search]  |      |
|  |                                                                       |      |
|  |  +---------------------------------------------------------------+   |      |
|  |  |  Code        Name                    Type          Category   |   |      |
|  |  |  PRD-001     Veggie Burger Classic   Finished Good Frozen     |   |      |
|  |  |  PRD-002     Veggie Burger Spicy     Finished Good Frozen     |   |      |
|  |  |  PRD-003  -> Veggie Burger Original  Finished Good Frozen  <- |   |      |
|  |  +---------------------------------------------------------------+   |      |
|  |                                                                       |      |
|  +-----------------------------------------------------------------------+      |
|                                                                                  |
|  SELECTED PRODUCT                                                                |
|  +-----------------------------------------------------------------------+      |
|  |                                                                       |      |
|  |  Product: PRD-003 - Veggie Burger Original                           |      |
|  |  Type: Finished Good                                                  |      |
|  |  Category: Frozen Foods                                               |      |
|  |  Current BOM: v1.2 (effective from 2025-06-01)                       |      |
|  |                                                                       |      |
|  |  [!] A new BOM version will be created for this product              |      |
|  |                                                                       |      |
|  +-----------------------------------------------------------------------+      |
|                                                                                  |
|  SOURCE REFERENCE                                                                |
|  +-----------------------------------------------------------------------+      |
|  |  NPD Project: NPD-2024-015 - Premium Veggie Burger                   |      |
|  |  Formulation: v2.1 (locked)                                          |      |
|  |  Source will be recorded for traceability                            |      |
|  +-----------------------------------------------------------------------+      |
|                                                                                  |
+---------------------------------------------------------------------------------+
|                                                                                  |
|  [<- Back]                                              [Next: BOM Preview ->]  |
|                                                                                  |
+---------------------------------------------------------------------------------+
```

### Step 3: BOM Preview Table

```
+---------------------------------------------------------------------------------+
|                     Production Handoff Wizard                               [X] |
+---------------------------------------------------------------------------------+
|                                                                                  |
|  Step 3 of 8: BOM Preview                                                       |
|                                                                                  |
|  [check]----[check]----[3]----( 4 )----( 5 )----( 6 )----( 7 )----( 8 )        |
|  Val        Prod       BOM    Pilot   Route   Review   Exec    Done             |
|                                                                                  |
+---------------------------------------------------------------------------------+
|                                                                                  |
|  FORMULATION TO BOM MAPPING                                                      |
|                                                                                  |
|  Preview how formulation items will be converted to BOM items:                  |
|                                                                                  |
|  +-----------------------------------------------------------------------+      |
|  |                                                                       |      |
|  |  Formulation: v2.1 | Total Qty: 100 kg | Items: 8                    |      |
|  |                                                                       |      |
|  +-----------------------------------------------------------------------+      |
|                                                                                  |
|  +-----------------------------------------------------------------------+      |
|  |  #  | Ingredient           | Qty      | %     | UoM  | BOM Item      |      |
|  |----|----------------------|----------|-------|------|---------------|      |
|  |  1  | Soy Protein Isolate  | 25.00    | 25.0% | kg   | [check] Map   |      |
|  |  2  | Water                | 30.00    | 30.0% | kg   | [check] Map   |      |
|  |  3  | Vegetable Oil        | 10.00    | 10.0% | kg   | [check] Map   |      |
|  |  4  | Onion Powder         |  5.00    |  5.0% | kg   | [check] Map   |      |
|  |  5  | Garlic Powder        |  3.00    |  3.0% | kg   | [check] Map   |      |
|  |  6  | Salt                 |  2.00    |  2.0% | kg   | [check] Map   |      |
|  |  7  | Spice Blend          |  5.00    |  5.0% | kg   | [check] Map   |      |
|  |  8  | Natural Flavoring    |  2.00    |  2.0% | kg   | [check] Map   |      |
|  |----|----------------------|----------|-------|------|---------------|      |
|  |     | SUBTOTAL             | 82.00    | 82.0% |      |               |      |
|  |     | Process Loss (est.)  | 18.00    | 18.0% |      |               |      |
|  |     | TOTAL                | 100.00   | 100%  |      |               |      |
|  +-----------------------------------------------------------------------+      |
|                                                                                  |
|  ALLERGEN SUMMARY                                                                |
|  +-----------------------------------------------------------------------+      |
|  |                                                                       |      |
|  |  Contains: [Soy] [Wheat*]                                            |      |
|  |  *May contain traces due to shared equipment                         |      |
|  |                                                                       |      |
|  |  Allergens will be inherited by the new BOM                          |      |
|  |                                                                       |      |
|  +-----------------------------------------------------------------------+      |
|                                                                                  |
|  BOM SETTINGS                                                                    |
|  +-----------------------------------------------------------------------+      |
|  |                                                                       |      |
|  |  BOM Version *                     Effective From *                   |      |
|  |  [v1.0__________________]          [2026-01-20        ] [calendar]   |      |
|  |  Auto-generated                    Default: Today + 5 days           |      |
|  |                                                                       |      |
|  |  Effective To                      Notes                              |      |
|  |  [____________________] [calendar] [NPD handoff - v2.1_______]       |      |
|  |  Optional end date                                                    |      |
|  |                                                                       |      |
|  +-----------------------------------------------------------------------+      |
|                                                                                  |
+---------------------------------------------------------------------------------+
|                                                                                  |
|  [<- Back]                                                [Next: Pilot WO ->]   |
|                                                                                  |
+---------------------------------------------------------------------------------+
```

### Step 4: Pilot Work Order (Optional)

```
+---------------------------------------------------------------------------------+
|                     Production Handoff Wizard                               [X] |
+---------------------------------------------------------------------------------+
|                                                                                  |
|  Step 4 of 8: Pilot Work Order                                                  |
|                                                                                  |
|  [check]----[check]----[check]----[4]----( 5 )----( 6 )----( 7 )----( 8 )      |
|  Val        Prod       BOM       Pilot   Route   Review   Exec    Done          |
|                                                                                  |
+---------------------------------------------------------------------------------+
|                                                                                  |
|  PILOT PRODUCTION RUN (OPTIONAL)                                                 |
|                                                                                  |
|  +-----------------------------------------------------------------------+      |
|  |                                                                       |      |
|  |  [check] Create pilot production Work Order                           |      |
|  |                                                                       |      |
|  |  A pilot WO allows you to validate the BOM with a small batch        |      |
|  |  before full-scale production.                                        |      |
|  |                                                                       |      |
|  +-----------------------------------------------------------------------+      |
|                                                                                  |
|  PILOT WO DETAILS                                                                |
|                                                                                  |
|  +-----------------------------------------------------------------------+      |
|  |                                                                       |      |
|  |  Pilot Quantity *                  Unit of Measure                    |      |
|  |  [100___________________]          [kg_______________]                |      |
|  |  Recommended: 100-500 units        From BOM                           |      |
|  |                                                                       |      |
|  |  Scheduled Date *                  Priority                           |      |
|  |  [2026-01-25        ] [calendar]   [Medium            v]             |      |
|  |  Default: Effective Date + 5 days                                     |      |
|  |                                                                       |      |
|  |  Notes                                                                |      |
|  |  +---------------------------------------------------------------+   |      |
|  |  | Initial pilot batch for Premium Veggie Burger from NPD       |   |      |
|  |  | project NPD-2024-015. Validate process parameters.           |   |      |
|  |  +---------------------------------------------------------------+   |      |
|  |                                                                       |      |
|  +-----------------------------------------------------------------------+      |
|                                                                                  |
|  PILOT WO INFORMATION                                                            |
|  +-----------------------------------------------------------------------+      |
|  |                                                                       |      |
|  |  [i] Pilot Work Orders:                                              |      |
|  |                                                                       |      |
|  |  * Type will be set to 'pilot' (not 'production')                    |      |
|  |  * Links back to NPD project for traceability                        |      |
|  |  * Actual costs will update NPD costing records                      |      |
|  |  * Can be skipped and created later from Production module           |      |
|  |                                                                       |      |
|  +-----------------------------------------------------------------------+      |
|                                                                                  |
+---------------------------------------------------------------------------------+
|                                                                                  |
|  [<- Back]                                           [Next: Routing Selection ->]
|                                                                                  |
+---------------------------------------------------------------------------------+
```

### Step 4: Pilot WO Skipped

```
+---------------------------------------------------------------------------------+
|                     Production Handoff Wizard                               [X] |
+---------------------------------------------------------------------------------+
|                                                                                  |
|  Step 4 of 8: Pilot Work Order                                                  |
|                                                                                  |
|  [check]----[check]----[check]----[4]----( 5 )----( 6 )----( 7 )----( 8 )      |
|  Val        Prod       BOM       Pilot   Route   Review   Exec    Done          |
|                                                                                  |
+---------------------------------------------------------------------------------+
|                                                                                  |
|  PILOT PRODUCTION RUN (OPTIONAL)                                                 |
|                                                                                  |
|  +-----------------------------------------------------------------------+      |
|  |                                                                       |      |
|  |  [ ] Create pilot production Work Order                               |      |
|  |                                                                       |      |
|  |  A pilot WO allows you to validate the BOM with a small batch        |      |
|  |  before full-scale production.                                        |      |
|  |                                                                       |      |
|  +-----------------------------------------------------------------------+      |
|                                                                                  |
|  +-----------------------------------------------------------------------+      |
|  |                                                                       |      |
|  |  [i] No pilot WO will be created                                     |      |
|  |                                                                       |      |
|  |  You can create a pilot Work Order later from the Production module  |      |
|  |  after the handoff is complete.                                       |      |
|  |                                                                       |      |
|  +-----------------------------------------------------------------------+      |
|                                                                                  |
+---------------------------------------------------------------------------------+
|                                                                                  |
|  [<- Back]                                           [Next: Routing Selection ->]
|                                                                                  |
+---------------------------------------------------------------------------------+
```

### Step 5: Routing Selection

```
+---------------------------------------------------------------------------------+
|                     Production Handoff Wizard                               [X] |
+---------------------------------------------------------------------------------+
|                                                                                  |
|  Step 5 of 8: Routing Selection                                                 |
|                                                                                  |
|  [check]----[check]----[check]----[check]----[5]----( 6 )----( 7 )----( 8 )    |
|  Val        Prod       BOM       Pilot      Route   Review   Exec    Done       |
|                                                                                  |
+---------------------------------------------------------------------------------+
|                                                                                  |
|  ROUTING SELECTION                                                               |
|                                                                                  |
|  Select or create a routing for the BOM:                                        |
|                                                                                  |
|  +-----------------------------------------------------------------------+      |
|  |                                                                       |      |
|  |  Routing *                                                            |      |
|  |  [Select routing...                                          v]      |      |
|  |                                                                       |      |
|  |  +---------------------------------------------------------------+   |      |
|  |  |  Code        Name                    Operations   Est. Time   |   |      |
|  |  |  RTG-001     Standard Burger Line    5 ops        45 min      |   |      |
|  |  |  RTG-002     Premium Burger Line     7 ops        60 min      |   |      |
|  |  |  RTG-003  -> Veggie Line            6 ops        50 min   <- |   |      |
|  |  |  ------------------------------------------------------------ |   |      |
|  |  |  [+] Create new routing...                                    |   |      |
|  |  +---------------------------------------------------------------+   |      |
|  |                                                                       |      |
|  +-----------------------------------------------------------------------+      |
|                                                                                  |
|  SELECTED ROUTING DETAILS                                                        |
|  +-----------------------------------------------------------------------+      |
|  |                                                                       |      |
|  |  Routing: RTG-003 - Veggie Line                                      |      |
|  |                                                                       |      |
|  |  Operations:                                                          |      |
|  |  1. Mixing (10 min) - Mixer Station A                                |      |
|  |  2. Forming (15 min) - Patty Former                                  |      |
|  |  3. Cooking (12 min) - Grill Line 2                                  |      |
|  |  4. Cooling (8 min) - Cooling Tunnel                                 |      |
|  |  5. Packaging (5 min) - Pack Line 1                                  |      |
|  |  6. QC Check (5 min) - QC Station                                    |      |
|  |                                                                       |      |
|  |  Total Time: 55 min | Work Centers: 6                                |      |
|  |                                                                       |      |
|  +-----------------------------------------------------------------------+      |
|                                                                                  |
|  [i] Routing defines the production steps. If creating pilot WO, this           |
|  routing will be used for the pilot batch.                                       |
|                                                                                  |
+---------------------------------------------------------------------------------+
|                                                                                  |
|  [<- Back]                                              [Next: Summary Review ->]
|                                                                                  |
+---------------------------------------------------------------------------------+
```

### Step 6: Summary Review

```
+---------------------------------------------------------------------------------+
|                     Production Handoff Wizard                               [X] |
+---------------------------------------------------------------------------------+
|                                                                                  |
|  Step 6 of 8: Summary Review                                                    |
|                                                                                  |
|  [check]----[check]----[check]----[check]----[check]----[6]----( 7 )----( 8 )  |
|  Val        Prod       BOM       Pilot      Route      Review   Exec    Done    |
|                                                                                  |
+---------------------------------------------------------------------------------+
|                                                                                  |
|  HANDOFF SUMMARY                                                                 |
|                                                                                  |
|  Review all decisions before executing the handoff:                             |
|                                                                                  |
|  +-----------------------------------------------------------------------+      |
|  |                                                                       |      |
|  |  SOURCE                                                               |      |
|  |  NPD Project: NPD-2024-015 - Premium Veggie Burger                   |      |
|  |  Formulation: v2.1 (locked)                                          |      |
|  |  Gate: G4 (Testing) - Approved                                       |      |
|  |                                                                       |      |
|  +-----------------------------------------------------------------------+      |
|                                                                                  |
|  +-----------------------------------------------------------------------+      |
|  |                                                                       |      |
|  |  PRODUCT                                                     [Edit]  |      |
|  |  Action: Create new product                                          |      |
|  |  Code: PRD-2026-001                                                  |      |
|  |  Name: Premium Veggie Burger                                         |      |
|  |  Type: Finished Good                                                  |      |
|  |  Category: Frozen Foods                                               |      |
|  |                                                                       |      |
|  +-----------------------------------------------------------------------+      |
|                                                                                  |
|  +-----------------------------------------------------------------------+      |
|  |                                                                       |      |
|  |  BOM                                                         [Edit]  |      |
|  |  Version: v1.0                                                        |      |
|  |  Items: 8 ingredients                                                 |      |
|  |  Total Qty: 100 kg                                                    |      |
|  |  Effective From: 2026-01-20                                          |      |
|  |  Allergens: Soy, Wheat*                                              |      |
|  |                                                                       |      |
|  +-----------------------------------------------------------------------+      |
|                                                                                  |
|  +-----------------------------------------------------------------------+      |
|  |                                                                       |      |
|  |  PILOT WORK ORDER                                            [Edit]  |      |
|  |  Status: Will be created                                              |      |
|  |  Quantity: 100 kg                                                     |      |
|  |  Scheduled: 2026-01-25                                               |      |
|  |  Routing: RTG-003 - Veggie Line                                      |      |
|  |                                                                       |      |
|  +-----------------------------------------------------------------------+      |
|                                                                                  |
|  +-----------------------------------------------------------------------+      |
|  |                                                                       |      |
|  |  ROUTING                                                     [Edit]  |      |
|  |  Code: RTG-003                                                        |      |
|  |  Name: Veggie Line                                                    |      |
|  |  Operations: 6                                                        |      |
|  |                                                                       |      |
|  +-----------------------------------------------------------------------+      |
|                                                                                  |
|  +-----------------------------------------------------------------------+      |
|  |  [!] This action cannot be undone automatically.                     |      |
|  |  Created records must be manually deleted if needed.                  |      |
|  +-----------------------------------------------------------------------+      |
|                                                                                  |
+---------------------------------------------------------------------------------+
|                                                                                  |
|  [<- Back]                                              [Execute Handoff ->]    |
|                                                                                  |
+---------------------------------------------------------------------------------+
```

### Step 7: Execution Progress

```
+---------------------------------------------------------------------------------+
|                     Production Handoff Wizard                               [X] |
+---------------------------------------------------------------------------------+
|                                                                                  |
|  Step 7 of 8: Executing Handoff                                                 |
|                                                                                  |
|  [check]----[check]----[check]----[check]----[check]----[check]----[7]----( 8 ) |
|  Val        Prod       BOM       Pilot      Route      Review    Exec    Done   |
|                                                                                  |
+---------------------------------------------------------------------------------+
|                                                                                  |
|  EXECUTING HANDOFF...                                                            |
|                                                                                  |
|  Please wait while the handoff is being processed.                              |
|  Do not close this window.                                                       |
|                                                                                  |
|  +-----------------------------------------------------------------------+      |
|  |                                                                       |      |
|  |  [check] Creating product...                             Complete    |      |
|  |          PRD-2026-001 - Premium Veggie Burger created               |      |
|  |                                                                       |      |
|  |  [check] Creating BOM...                                 Complete    |      |
|  |          BOM v1.0 with 8 items created                              |      |
|  |                                                                       |      |
|  |  [spinner] Creating Pilot Work Order...                 In Progress  |      |
|  |            Linking to routing and scheduling...                      |      |
|  |                                                                       |      |
|  |  [ ] Updating NPD project status...                       Pending    |      |
|  |                                                                       |      |
|  |  [ ] Logging handoff event...                             Pending    |      |
|  |                                                                       |      |
|  +-----------------------------------------------------------------------+      |
|                                                                                  |
|  PROGRESS                                                                        |
|  +-----------------------------------------------------------------------+      |
|  |  [==========================                    ] 60%                 |      |
|  |  3 of 5 steps completed                                               |      |
|  +-----------------------------------------------------------------------+      |
|                                                                                  |
|  Estimated time remaining: 5 seconds                                             |
|                                                                                  |
+---------------------------------------------------------------------------------+
|                                                                                  |
|  (Navigation disabled during execution)                                          |
|                                                                                  |
+---------------------------------------------------------------------------------+
```

### Step 8: Success

```
+---------------------------------------------------------------------------------+
|                     Production Handoff Wizard                               [X] |
+---------------------------------------------------------------------------------+
|                                                                                  |
|  Step 8 of 8: Handoff Complete                                                  |
|                                                                                  |
|  [check]----[check]----[check]----[check]----[check]----[check]----[check]----[8]
|  Val        Prod       BOM       Pilot      Route      Review    Exec    Done   |
|                                                                                  |
+---------------------------------------------------------------------------------+
|                                                                                  |
|                         [check-circle]                                           |
|                                                                                  |
|                    HANDOFF COMPLETED SUCCESSFULLY                                |
|                                                                                  |
|  NPD Project NPD-2024-015 has been successfully transferred to Production.      |
|                                                                                  |
|  +-----------------------------------------------------------------------+      |
|  |                                                                       |      |
|  |  CREATED RECORDS                                                      |      |
|  |                                                                       |      |
|  |  Product:                                                             |      |
|  |  PRD-2026-001 - Premium Veggie Burger                                |      |
|  |  [View Product ->]                                                    |      |
|  |                                                                       |      |
|  |  Bill of Materials:                                                   |      |
|  |  BOM-2026-001 v1.0 - 8 items                                         |      |
|  |  [View BOM ->]                                                        |      |
|  |                                                                       |      |
|  |  Pilot Work Order:                                                    |      |
|  |  WO-2026-0125 - 100 kg scheduled for 2026-01-25                      |      |
|  |  [View Work Order ->]                                                 |      |
|  |                                                                       |      |
|  +-----------------------------------------------------------------------+      |
|                                                                                  |
|  +-----------------------------------------------------------------------+      |
|  |                                                                       |      |
|  |  NPD PROJECT STATUS                                                   |      |
|  |                                                                       |      |
|  |  Status: Launched                                                     |      |
|  |  Actual Launch Date: 2026-01-15                                      |      |
|  |  Event: NPD.HandoffCompleted logged                                  |      |
|  |                                                                       |      |
|  +-----------------------------------------------------------------------+      |
|                                                                                  |
|  +-----------------------------------------------------------------------+      |
|  |  [i] What's Next?                                                    |      |
|  |                                                                       |      |
|  |  * Review the created BOM and make any final adjustments             |      |
|  |  * Schedule the pilot Work Order when ready                          |      |
|  |  * Monitor pilot production and update actual costs                  |      |
|  |  * Create production Work Orders for full-scale manufacturing        |      |
|  |                                                                       |      |
|  +-----------------------------------------------------------------------+      |
|                                                                                  |
+---------------------------------------------------------------------------------+
|                                                                                  |
|  [View Product]    [View BOM]    [View Work Order]             [Close]          |
|                                                                                  |
+---------------------------------------------------------------------------------+
```

### Error - Rollback State

```
+---------------------------------------------------------------------------------+
|                     Production Handoff Wizard                               [X] |
+---------------------------------------------------------------------------------+
|                                                                                  |
|  Step 7 of 8: Execution Error                                                   |
|                                                                                  |
|  [check]----[check]----[check]----[check]----[check]----[check]----[!]----(  )  |
|  Val        Prod       BOM       Pilot      Route      Review    Exec    Done   |
|                                                                                  |
+---------------------------------------------------------------------------------+
|                                                                                  |
|                            [x-circle]                                            |
|                                                                                  |
|                       HANDOFF FAILED                                             |
|                                                                                  |
|  An error occurred during the handoff process.                                  |
|  All changes have been rolled back.                                              |
|                                                                                  |
|  +-----------------------------------------------------------------------+      |
|  |                                                                       |      |
|  |  [!] ERROR DETAILS                                                    |      |
|  |                                                                       |      |
|  |  Step Failed: Creating Pilot Work Order                              |      |
|  |  Error: Routing RTG-003 is inactive or has been archived             |      |
|  |  Code: ROUTING_INACTIVE                                               |      |
|  |                                                                       |      |
|  |  Transaction rolled back - no records were created.                  |      |
|  |                                                                       |      |
|  +-----------------------------------------------------------------------+      |
|                                                                                  |
|  +-----------------------------------------------------------------------+      |
|  |                                                                       |      |
|  |  ROLLBACK STATUS                                                      |      |
|  |                                                                       |      |
|  |  [check] Product creation - Rolled back                              |      |
|  |  [check] BOM creation - Rolled back                                  |      |
|  |  [x]     Pilot WO creation - Failed                                  |      |
|  |  [--]    NPD status update - Skipped                                 |      |
|  |  [--]    Event logging - Skipped                                     |      |
|  |                                                                       |      |
|  +-----------------------------------------------------------------------+      |
|                                                                                  |
|  +-----------------------------------------------------------------------+      |
|  |  [i] Recommended Actions:                                            |      |
|  |                                                                       |      |
|  |  1. Check that the selected routing is still active                  |      |
|  |  2. Select a different routing or create a new one                   |      |
|  |  3. Retry the handoff process                                         |      |
|  |                                                                       |      |
|  +-----------------------------------------------------------------------+      |
|                                                                                  |
+---------------------------------------------------------------------------------+
|                                                                                  |
|  [Cancel Handoff]                       [<- Back to Routing]    [Retry Handoff] |
|                                                                                  |
+---------------------------------------------------------------------------------+
```

### Loading State

```
+---------------------------------------------------------------------------------+
|                     Production Handoff Wizard                               [X] |
+---------------------------------------------------------------------------------+
|                                                                                  |
|  Step 1 of 8: Validation Checklist                                              |
|                                                                                  |
|  [1]----( 2 )----( 3 )----( 4 )----( 5 )----( 6 )----( 7 )----( 8 )            |
|  Val    Prod     BOM     Pilot   Route   Review   Exec    Done                  |
|                                                                                  |
+---------------------------------------------------------------------------------+
|                                                                                  |
|  PRE-HANDOFF VALIDATION                                                          |
|                                                                                  |
|  +-----------------------------------------------------------------------+      |
|  |  [================================]                                   |      |
|  |  [====================]                                               |      |
|  +-----------------------------------------------------------------------+      |
|                                                                                  |
|  +-----------------------------------------------------------------------+      |
|  |  [================================]                                   |      |
|  |  [============================]                                       |      |
|  +-----------------------------------------------------------------------+      |
|                                                                                  |
|  +-----------------------------------------------------------------------+      |
|  |  [================================]                                   |      |
|  |  [====================]                                               |      |
|  +-----------------------------------------------------------------------+      |
|                                                                                  |
|  Loading validation data...                                                      |
|                                                                                  |
+---------------------------------------------------------------------------------+
```

---

## Key Elements

### Step Indicator
| Element | Type | Source | Notes |
|---------|------|--------|-------|
| Step Numbers | Badge | 1-8 | Current=blue, completed=green check, pending=gray |
| Step Labels | Text | Static | Val, Prod, BOM, Pilot, Route, Review, Exec, Done |
| Connector Lines | Visual | - | Solid for complete, dashed for pending |
| Blocked Indicator | Badge | Validation result | Red X if validation failed |

### Step 1: Validation Checklist
| Element | Type | Source | Notes |
|---------|------|--------|-------|
| Gate Approval Check | Card | `project.current_gate` | G4 must be approved |
| Formulation Check | Card | `formulation.status` | Must be 'locked' |
| Costing Check | Card | `costing.status` | Must be 'approved' |
| Documents Check | Card | `npd_documents` | Required types uploaded |
| Allergen Check | Card | `formulation_items.allergens` | Must be declared |
| Blocker List | Alert | Failed checks | Red with fix links |
| Summary | Card | Calculated | Pass/fail count |

### Step 2: Product Decision
| Element | Type | Source | Notes |
|---------|------|--------|-------|
| Radio: Create New | Radio | User choice | Default selected |
| Radio: Update Existing | Radio | User choice | - |
| Product Code | Input | Auto-generated | Editable |
| Product Name | Input | From project name | Editable |
| Product Type | Select | `product_types` | Required |
| Category | Select | `categories` | Optional |
| Description | Textarea | From project | Pre-filled |
| Product Search | Combobox | `products` | For update existing |
| Selected Product | Card | `products` | Show current BOM info |

### Step 3: BOM Preview
| Element | Type | Source | Notes |
|---------|------|--------|-------|
| Formulation Info | Card | `formulations` | Version, qty, items |
| Items Table | Table | `formulation_items` | #, name, qty, %, UoM |
| Mapping Status | Badge | All items | Check icon for mapped |
| Subtotal Row | Table Row | Calculated | Sum of quantities |
| Process Loss | Table Row | Estimated | Typical 15-20% |
| Allergen Summary | Card | Aggregated | Contains, May contain |
| BOM Version | Input | Auto v1.0 | Editable |
| Effective From | DatePicker | Today+5 days | Required |
| Effective To | DatePicker | None | Optional |

### Step 4: Pilot WO
| Element | Type | Source | Notes |
|---------|------|--------|-------|
| Create Pilot Checkbox | Checkbox | User choice | Default checked |
| Pilot Quantity | Input | Number | Required if checked |
| UoM | Display | From BOM | Read-only |
| Scheduled Date | DatePicker | Effective+5 days | Required if checked |
| Priority | Select | low/medium/high | Default medium |
| Notes | Textarea | User input | Optional |
| Info Card | Card | Static | Explains pilot WO purpose |

### Step 5: Routing Selection
| Element | Type | Source | Notes |
|---------|------|--------|-------|
| Routing Dropdown | Select | `routings` | Required |
| Routing Table | Table | `routings` | Code, name, ops, time |
| Create New Option | Button | - | Opens routing form |
| Selected Routing | Card | `routings` | Operations list |
| Operations List | List | `routing_operations` | Seq, name, time, work center |

### Step 6: Summary Review
| Element | Type | Source | Notes |
|---------|------|--------|-------|
| Source Card | Card | Project/formulation | Read-only |
| Product Card | Card | Step 2 data | Edit link |
| BOM Card | Card | Step 3 data | Edit link |
| Pilot WO Card | Card | Step 4 data | Edit link, or "Skipped" |
| Routing Card | Card | Step 5 data | Edit link |
| Warning | Alert | Static | Cannot be undone |

### Step 7: Execution Progress
| Element | Type | Source | Notes |
|---------|------|--------|-------|
| Progress Steps | List | Execution status | Check/spinner/pending icons |
| Creating Product | Step | API progress | Shows product code on complete |
| Creating BOM | Step | API progress | Shows item count on complete |
| Creating Pilot WO | Step | API progress | Shows WO number on complete |
| Updating Status | Step | API progress | - |
| Logging Event | Step | API progress | - |
| Progress Bar | Progress | Calculated | Percentage complete |
| Time Remaining | Text | Estimated | Seconds remaining |

### Step 8: Success
| Element | Type | Source | Notes |
|---------|------|--------|-------|
| Success Icon | Icon | - | Large green checkmark |
| Success Message | Text | Static | "Handoff completed successfully" |
| Product Link | Button | Created product ID | Opens product detail |
| BOM Link | Button | Created BOM ID | Opens BOM detail |
| WO Link | Button | Created WO ID | Opens WO detail, or hidden |
| Status Card | Card | `project` | Status, launch date, event |
| Next Steps | Card | Static | Guidance for next actions |
| Close Button | Button | - | Close wizard |

---

## Business Logic

### Validation Checklist (Step 1)
```typescript
interface ValidationResult {
  gate_approved: boolean;      // current_gate === 'G4' && approved
  formulation_locked: boolean; // formulation.status === 'locked'
  costing_approved: boolean;   // costing.status === 'approved'
  docs_complete: boolean;      // has HACCP, label, allergen docs
  allergens_declared: boolean; // formulation has allergen data
}

const isValid = Object.values(validation).every(v => v === true);
```

### Product Decision Logic (Step 2)
```typescript
type ProductDecision = 'create_new' | 'update_existing';

// Create new: Generate product from formulation
// Update existing: Add new BOM version to selected product
```

### BOM Mapping (Step 3)
```typescript
// Formulation items map 1:1 to BOM items
const bomItems = formulation.items.map(item => ({
  product_id: item.product_id,
  quantity: item.quantity,
  uom: item.uom,
  percentage: item.percentage,
  notes: item.notes
}));
```

### Handoff Execution (Step 7)
```typescript
// Transactional execution
const executeHandoff = async (data: HandoffData) => {
  const tx = await db.transaction();
  try {
    // 1. Create/update product
    const product = await createProduct(tx, data.product);

    // 2. Create BOM
    const bom = await createBOM(tx, data.bom, product.id);

    // 3. Create pilot WO (if enabled)
    let workOrder = null;
    if (data.createPilotWO) {
      workOrder = await createWorkOrder(tx, data.pilotWO, bom.id);
    }

    // 4. Update NPD project status
    await updateProjectStatus(tx, project.id, 'launched');

    // 5. Log event
    await logEvent(tx, 'NPD.HandoffCompleted', {
      project_id: project.id,
      product_id: product.id,
      bom_id: bom.id,
      work_order_id: workOrder?.id
    });

    await tx.commit();
    return { success: true, product, bom, workOrder };
  } catch (error) {
    await tx.rollback();
    throw error;
  }
};
```

---

## API Integration

### Validation Check
```typescript
GET /api/npd/projects/:id/handoff/validate
Response: {
  validation: {
    gate_approved: { passed: true, details: {...} },
    formulation_locked: { passed: true, details: {...} },
    costing_approved: { passed: false, details: {...} },
    docs_complete: { passed: true, details: {...} },
    allergens_declared: { passed: true, details: {...} }
  },
  can_proceed: false,
  blockers: [{ type: 'costing', message: 'Costing not approved' }]
}
```

### Execute Handoff
```typescript
POST /api/npd/projects/:id/handoff
Body: {
  product_decision: 'create_new' | 'update_existing',
  product: {
    code?: string,
    name: string,
    type: string,
    category?: string,
    existing_product_id?: string  // if update_existing
  },
  bom: {
    version: string,
    effective_from: date,
    effective_to?: date,
    notes?: string
  },
  pilot_wo: {
    create: boolean,
    quantity?: number,
    scheduled_date?: date,
    routing_id?: string,
    notes?: string
  },
  routing_id: string
}
Response: {
  success: true,
  product: { id, code, name },
  bom: { id, version },
  work_order?: { id, number },
  event_id: number
}
```

---

## Validation Rules

### Step 1: Validation Checklist
| Rule | Error Message |
|------|---------------|
| Gate G4 approved | "Project must have G4 gate approved" |
| Formulation locked | "Formulation must be locked before handoff" |
| Costing approved | "Finance must approve costing before handoff" |
| Required docs uploaded | "Missing required compliance documents" |
| Allergens declared | "Allergen declaration required" |

### Step 2: Product Decision
| Rule | Error Message |
|------|---------------|
| Decision required | "Select create new or update existing product" |
| Product code unique | "Product code already exists" |
| Product name required | "Product name is required" |
| Product type required | "Product type is required" |
| Existing product selected | "Select an existing product to update" |

### Step 3: BOM Preview
| Rule | Error Message |
|------|---------------|
| BOM version required | "BOM version is required" |
| Effective from required | "Effective from date is required" |
| Effective from future | "Effective date must be in the future" |
| Effective to after from | "Effective to must be after effective from" |

### Step 4: Pilot WO
| Rule | Error Message |
|------|---------------|
| Quantity required | "Pilot quantity is required" |
| Quantity positive | "Quantity must be greater than 0" |
| Scheduled date required | "Scheduled date is required" |
| Scheduled date future | "Scheduled date must be in the future" |

### Step 5: Routing Selection
| Rule | Error Message |
|------|---------------|
| Routing required | "Select a routing for the BOM" |
| Routing active | "Selected routing must be active" |

---

## Accessibility

### ARIA Attributes
- `role="dialog"` on wizard container
- `aria-modal="true"`
- `aria-labelledby="handoff-wizard-title"`
- `role="navigation"` on step indicator
- `aria-current="step"` on current step
- `aria-disabled="true"` on disabled steps
- `role="progressbar"` on execution progress
- `aria-live="polite"` on status updates
- `aria-required="true"` on required fields
- `role="alert"` on error messages

### Touch Targets
- All buttons: 48x48dp minimum
- Step indicators: 48x48dp
- Radio buttons: 48dp height
- Checkboxes: 48dp height
- Input fields: 48dp height
- Table rows: 48dp height

### Keyboard Navigation
- Tab order follows visual flow
- Enter: Select/activate current element
- Space: Toggle checkbox/radio
- Arrow keys: Navigate within step indicator
- Escape: Close wizard (with confirmation)
- Left/Right arrows: Navigate step indicator (informational)

### Screen Reader
- Step indicator: "Step 1 of 8: Validation Checklist"
- Completed step: "Step 1, completed"
- Current step: "Step 2, current"
- Blocked step: "Step 1, blocked, validation failed"
- Progress: "Handoff progress 60%, 3 of 5 steps completed"
- Success: "Handoff completed successfully"
- Error: "Handoff failed, error creating pilot work order"

---

## Responsive Design

### Desktop (>1024px)
- Wizard max-width: 800px (2xl)
- Step indicator: Horizontal, full labels
- Forms: 2-column layout
- Tables: Full width with all columns
- Action buttons: Right-aligned, inline

### Tablet (768-1024px)
- Wizard width: 90%
- Step indicator: Horizontal, short labels
- Forms: 2-column layout
- Tables: Horizontal scroll if needed
- Action buttons: Right-aligned, inline

### Mobile (<768px)
- Wizard: Full-screen
- Step indicator: Horizontal, numbers only (no labels)
- Forms: Single-column, stacked
- Tables: Card view for each row
- Action buttons: Full-width, stacked (Back above Next)

---

## Performance

### Load Time
- Wizard open animation: <200ms
- Validation API call: <500ms
- Product search: <300ms (debounced 300ms)
- Routing list: <300ms (cached)

### Execution Time
- Handoff execution: <5 seconds target (NFR-04)
- Progress updates: Real-time via WebSocket or polling
- Event logging: Async (doesn't block UI)

---

## Testing Requirements

### Unit Tests
- Renders step indicator correctly
- Shows correct state for each step
- Validates Step 1 checklist items
- Handles create new vs update existing product
- Calculates BOM preview correctly
- Toggles pilot WO fields
- Disables navigation during execution
- Displays success with correct links
- Shows error with rollback status

### Integration Tests
- Calls validation API on mount
- Submits handoff with correct data
- Handles transaction rollback on error
- Updates project status on success
- Logs NPD.HandoffCompleted event
- Creates all entities transactionally

### E2E Tests
- Complete handoff flow with new product
- Complete handoff flow updating existing product
- Handoff with pilot WO enabled
- Handoff with pilot WO disabled
- Blocked validation prevents progression
- Error displays rollback status
- Success links navigate to created entities

---

## Implementation Notes

### Target Component Path
```
apps/frontend/components/npd/projects/HandoffWizard.tsx
```

### Sub-Components
```
apps/frontend/components/npd/projects/handoff/
  - StepIndicator.tsx
  - ValidationChecklistStep.tsx
  - ProductDecisionStep.tsx
  - BOMPreviewStep.tsx
  - PilotWOStep.tsx
  - RoutingSelectionStep.tsx
  - SummaryReviewStep.tsx
  - ExecutionProgressStep.tsx
  - SuccessStep.tsx
  - ErrorRollbackStep.tsx
```

### Dependencies
- `@/hooks/use-toast` - Toast notifications
- `@/components/ui/*` - ShadCN components
- `lucide-react` - Icons
- `react-hook-form` + `zod` - Form validation
- `date-fns` - Date formatting

### State Management
```typescript
interface HandoffWizardState {
  currentStep: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  validation: ValidationResult;
  productDecision: ProductDecision;
  productData: ProductFormData;
  bomData: BOMFormData;
  pilotWOEnabled: boolean;
  pilotWOData: PilotWOFormData;
  routingId: string;
  executionStatus: ExecutionStatus;
  error: Error | null;
  result: HandoffResult | null;
}
```

---

## Quality Gates

- [x] All 7 states defined
- [x] 8 steps with navigation
- [x] Step indicator with checkmarks
- [x] Validation checklist with blockers
- [x] Product decision (create/update)
- [x] BOM preview table
- [x] Pilot WO toggle
- [x] Routing selection
- [x] Summary review
- [x] Execution progress
- [x] Success with links
- [x] Error with rollback
- [x] API endpoints documented
- [x] Validation rules specified
- [x] Accessibility requirements met (WCAG AA)
- [x] Responsive breakpoints defined
- [x] Touch targets 48x48dp minimum
- [x] Keyboard navigation support
- [x] Screen reader support

---

**Status**: Wireframe Defined
**Component**: `HandoffWizard.tsx`
**Story**: NPD Production Handoff
**PRD Reference**: Section 8 - Handoff Wizard (NPD-FR-37 to NPD-FR-47)
**Approved**: Pending review
