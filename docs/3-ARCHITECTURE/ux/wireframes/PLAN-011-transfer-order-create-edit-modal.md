# PLAN-011: Transfer Order Create/Edit Modal

**Module**: Planning
**Feature**: TO CRUD with Lines Management (FR-PLAN-012, FR-PLAN-013, FR-PLAN-016)
**Status**: Ready for Review
**Last Updated**: 2025-12-14

---

## ASCII Wireframe

### Success State - Create Mode (Desktop)

```
+--------------------------------------------------------------------------------------------------+
|                                      Create Transfer Order                                   [X]  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  +-------------------------------- HEADER SECTION ----------------------------------------------+  |
|  |                                                                                              |  |
|  |  From Warehouse *                     To Warehouse *                  Priority              |  |
|  |  +----------------------------+       +-------------------+          +------------------+   |  |
|  |  | Main Warehouse        [v]  |       | Branch-A      [v] |          | Normal      [v]  |   |  |
|  |  +----------------------------+       +-------------------+          +------------------+   |  |
|  |  Available: 1,234 LPs                 Destination warehouse           Low/Normal/High      |  |
|  |                                                                                              |  |
|  |  Planned Ship Date *          Planned Receive Date *                                        |  |
|  |  +-------------------+        +-------------------+                                         |  |
|  |  | 2024-12-20   [C]  |        | 2024-12-22   [C]  |                                         |  |
|  |  +-------------------+        +-------------------+                                         |  |
|  |  In 6 days                    Auto-calculated (+2 days)                                     |  |
|  |                                                                                              |  |
|  |  Notes                                                                                      |  |
|  |  +-------------------------------------------------------------------------------------+    |  |
|  |  | Priority transfer - load truck #42 on morning shift                                |    |  |
|  |  +-------------------------------------------------------------------------------------+    |  |
|  |                                                                                              |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  +-------------------------------- LINES SECTION -----------------------------------------------+  |
|  |                                                                                              |  |
|  |  Transfer Items                                                            [+ Add Line]     |  |
|  |                                                                                              |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |  | # | Product           | Quantity | UoM | Available | LP Selection     | Actions       | |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |  | 1 | Flour Type A      | 500      | kg  | 1,200 kg  | [Select LPs]     | [E] [X]       | |  |
|  |  |   | RM-FLOUR-001      |          |     | (Green)   | 2 LPs selected   |               | |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |  | 2 | Sugar White       | 200      | kg  | 150 kg    | [Select LPs]     | [E] [X]       | |  |
|  |  |   | RM-SUGAR-001      |          |     | (Red)     | Not selected     |               | |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |  | 3 | Salt Industrial   | 100      | kg  | 500 kg    | [Select LPs]     | [E] [X]       | |  |
|  |  |   | RM-SALT-001       |          |     | (Green)   | Not selected     |               | |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |                                                                                              |  |
|  |  [+ Add Another Line]                                                                       |  |
|  |                                                                                              |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  +-------------------------------- AVAILABILITY SUMMARY ----------------------------------------+  |
|  |                                                                                              |  |
|  |  Inventory Check:                                                                           |  |
|  |  - Flour Type A: 500 kg available (1,200 kg in stock) [OK]                                  |  |
|  |  - Sugar White: 200 kg requested, but only 150 kg available [WARNING]                       |  |
|  |  - Salt Industrial: 100 kg available (500 kg in stock) [OK]                                 |  |
|  |                                                                                              |  |
|  |  Total Lines: 3  |  Total Quantity: 800 kg                                                  |  |
|  |                                                                                              |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  +----------------------------------------------------------------------------------------------+  |
|  |                                                       [Cancel]    [Save as Draft]   [Release] |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

### Success State - Edit Mode (Desktop)

```
+--------------------------------------------------------------------------------------------------+
|                               Edit Transfer Order: TO-2024-00042                             [X]  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  +-------------------------------- HEADER SECTION ----------------------------------------------+  |
|  |                                                                                              |  |
|  |  TO Number: TO-2024-00042          Status: [Draft]           Created: Dec 14, 2024          |  |
|  |                                                                                              |  |
|  |  From Warehouse *                     To Warehouse *                  Priority              |  |
|  |  +----------------------------+       +-------------------+          +------------------+   |  |
|  |  | Main Warehouse        [v]  |       | Branch-A      [v] |          | Normal      [v]  |   |  |
|  |  +----------------------------+       +-------------------+          +------------------+   |  |
|  |                                                                                              |  |
|  |  Planned Ship Date *          Planned Receive Date *                                        |  |
|  |  +-------------------+        +-------------------+                                         |  |
|  |  | 2024-12-20   [C]  |        | 2024-12-22   [C]  |                                         |  |
|  |  +-------------------+        +-------------------+                                         |  |
|  |                                                                                              |  |
|  |  Notes                                                                                      |  |
|  |  +-------------------------------------------------------------------------------------+    |  |
|  |  | Priority transfer - load truck #42 on morning shift                                |    |  |
|  |  +-------------------------------------------------------------------------------------+    |  |
|  |                                                                                              |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  +-------------------------------- LINES SECTION -----------------------------------------------+  |
|  |  (Same as Create Mode - editable lines table)                                               |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  +----------------------------------------------------------------------------------------------+  |
|  |                                                 [Cancel]    [Save Changes]   [Save & Release] |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

### LP Selection Modal (PLAN-016 Inline)

```
+----------------------------------------------------------+
|           Select License Plates for Transfer        [X]  |
+----------------------------------------------------------+
|                                                            |
|  Product: Flour Type A (RM-FLOUR-001)                     |
|  Required: 500 kg                                         |
|  From Warehouse: Main Warehouse                           |
|                                                            |
|  +------------------------------------------------------+ |
|  | Search LPs: [______________________________]      [S] | |
|  +------------------------------------------------------+ |
|                                                            |
|  Available License Plates:                                |
|                                                            |
|  +------------------------------------------------------+ |
|  | [ ] LP-2024-12345  |  250 kg  |  Lot: L-001  | FIFO  | |
|  |     Received: Dec 12, 2024      Expiry: Mar 12, 2025  | |
|  +------------------------------------------------------+ |
|  | [x] LP-2024-12346  |  300 kg  |  Lot: L-002  | FIFO  | |
|  |     Received: Dec 13, 2024      Expiry: Mar 13, 2025  | |
|  +------------------------------------------------------+ |
|  | [ ] LP-2024-12347  |  200 kg  |  Lot: L-003  |       | |
|  |     Received: Dec 14, 2024      Expiry: Mar 14, 2025  | |
|  +------------------------------------------------------+ |
|  | [x] LP-2024-12348  |  200 kg  |  Lot: L-004  |       | |
|  |     Received: Dec 15, 2024      Expiry: Mar 15, 2025  | |
|  +------------------------------------------------------+ |
|                                                            |
|  Selected: 2 LPs  |  Total Quantity: 500 kg               |
|  Status: [OK] Exactly meets requirement                   |
|                                                            |
|  [ ] Auto-select FIFO (oldest first)                      |
|  [ ] Auto-select FEFO (nearest expiry first)              |
|                                                            |
|  +------------------------------------------------------+ |
|  |                        [Cancel]    [Confirm Selection]| |
|  +------------------------------------------------------+ |
|                                                            |
+----------------------------------------------------------+
```

### Warehouse Change Confirmation Dialog

```
+----------------------------------------------------------+
|                   Change Source Warehouse?           [X] |
+----------------------------------------------------------+
|                                                            |
|  [!] Warning: Changing the source warehouse will:         |
|                                                            |
|      - Remove all current transfer lines                  |
|      - Clear all license plate selections                 |
|      - Reset availability calculations                    |
|                                                            |
|  Current warehouse: Main Warehouse                        |
|  New warehouse: Regional Distribution Center              |
|                                                            |
|  Lines to be removed: 3                                   |
|  - Flour Type A (500 kg)                                  |
|  - Sugar White (200 kg)                                   |
|  - Salt Industrial (100 kg)                               |
|                                                            |
|  This action cannot be undone.                            |
|                                                            |
|  +------------------------------------------------------+ |
|  |               [Keep Current Warehouse]   [Confirm Change] |
|  +------------------------------------------------------+ |
|                                                            |
+----------------------------------------------------------+
```

### Duplicate Product Blocked Dialog

```
+----------------------------------------------------------+
|                 Duplicate Product Detected           [X] |
+----------------------------------------------------------+
|                                                            |
|  [!] This product is already in the transfer order:       |
|                                                            |
|      Product: Flour Type A (RM-FLOUR-001)                 |
|      Existing Line: Line 1                                |
|      Existing Quantity: 500 kg                            |
|                                                            |
|  To add more of this product, please edit the             |
|  existing line quantity instead.                          |
|                                                            |
|  Per FR-PLAN-013: Duplicate products are not allowed      |
|  on transfer orders to ensure traceability.               |
|                                                            |
|  +------------------------------------------------------+ |
|  |             [Edit Existing Line]          [Cancel]   | |
|  +------------------------------------------------------+ |
|                                                            |
+----------------------------------------------------------+
```

### Mobile View - Create Mode (<768px)

```
+----------------------------------+
|         Create Transfer Order[X] |
+----------------------------------+
|                                  |
|  --- HEADER ---                  |
|                                  |
|  From Warehouse *                |
|  +----------------------------+  |
|  | Main Warehouse        [v]  |  |
|  +----------------------------+  |
|  Available: 1,234 LPs            |
|                                  |
|  To Warehouse *                  |
|  +----------------------------+  |
|  | Branch-A              [v]  |  |
|  +----------------------------+  |
|                                  |
|  Planned Ship Date *             |
|  +----------------------------+  |
|  | 2024-12-20            [C]  |  |
|  +----------------------------+  |
|                                  |
|  Planned Receive Date *          |
|  +----------------------------+  |
|  | 2024-12-22            [C]  |  |
|  +----------------------------+  |
|                                  |
|  Priority                        |
|  +----------------------------+  |
|  | Normal                [v]  |  |
|  +----------------------------+  |
|                                  |
|  [More Options v]                |
|  (Notes)                         |
|                                  |
|  --- LINES ---                   |
|                                  |
|  +----------------------------+  |
|  | 1. Flour Type A            |  |
|  |    500 kg                  |  |
|  |    Available: 1,200 kg [OK]|  |
|  |    LPs: 2 selected         |  |
|  |    [Edit] [Remove]         |  |
|  +----------------------------+  |
|  | 2. Sugar White             |  |
|  |    200 kg                  |  |
|  |    Available: 150 kg [!]   |  |
|  |    LPs: Not selected       |  |
|  |    [Edit] [Remove]         |  |
|  +----------------------------+  |
|                                  |
|  [+ Add Line]                    |
|                                  |
|  --- SUMMARY ---                 |
|                                  |
|  Total: 3 lines, 800 kg          |
|                                  |
|  [!] Sugar White shortage        |
|                                  |
|  +----------------------------+  |
|  | [Save Draft]   [Release]   |  |
|  +----------------------------+  |
|                                  |
+----------------------------------+
```

### Loading State

```
+--------------------------------------------------------------------------------------------------+
|                                      Create Transfer Order                                   [X]  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  +-------------------------------- HEADER SECTION ----------------------------------------------+  |
|  |                                                                                              |  |
|  |  From Warehouse                                                                             |  |
|  |  [==================================]  Loading warehouses...                                |  |
|  |                                                                                              |  |
|  |  To Warehouse                      Planned Ship Date                                        |  |
|  |  [==================================] [==================================]                  |  |
|  |                                                                                              |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  +-------------------------------- LINES SECTION -----------------------------------------------+  |
|  |                                                                                              |  |
|  |  Loading products...                                                                        |  |
|  |                                                                                              |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

### Empty Lines State

```
+--------------------------------------------------------------------------------------------------+
|                                      Create Transfer Order                                   [X]  |
+--------------------------------------------------------------------------------------------------+
|  (Header section with warehouses selected)                                                        |
|                                                                                                    |
|  +-------------------------------- LINES SECTION -----------------------------------------------+  |
|  |                                                                                              |  |
|  |                                  +------------------+                                        |  |
|  |                                  |   [List Icon]    |                                        |  |
|  |                                  +------------------+                                        |  |
|  |                                                                                              |  |
|  |                                 No Items Added Yet                                          |  |
|  |                                                                                              |  |
|  |                    Add products to transfer between warehouses.                             |  |
|  |                                                                                              |  |
|  |                                    [+ Add First Line]                                       |  |
|  |                                                                                              |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  +----------------------------------------------------------------------------------------------+  |
|  |                                                       [Cancel]    [Save as Draft]           |  |
|  |                                                       (Release disabled - no lines)         |  |
|  +----------------------------------------------------------------------------------------------+  |
+--------------------------------------------------------------------------------------------------+
```

### Validation Error State

```
+--------------------------------------------------------------------------------------------------+
|                                      Create Transfer Order                                   [X]  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  +----------------------------------------------------------------------------------------------+  |
|  |  [!] Please fix the following errors:                                                       |  |
|  |      - From Warehouse is required                                                           |  |
|  |      - To Warehouse cannot be same as From Warehouse                                        |  |
|  |      - Planned Ship Date must be in the future                                              |  |
|  |      - Line 2: Quantity exceeds available stock (200 kg requested, 150 kg available)        |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  +-------------------------------- HEADER SECTION ----------------------------------------------+  |
|  |                                                                                              |  |
|  |  From Warehouse *                     To Warehouse *                                        |  |
|  |  +----------------------------+       +-------------------+                                 |  |
|  |  | Select warehouse...   [v]  |       | Main Warehouse[v] |                                 |  |
|  |  +----------------------------+       +-------------------+                                 |  |
|  |  [!] Required                         [!] Cannot be same as From                            |  |
|  |                                                                                              |  |
|  |  Planned Ship Date *                                                                        |  |
|  |  +-------------------+                                                                      |  |
|  |  | 2024-12-10   [C]  |                                                                      |  |
|  |  +-------------------+                                                                      |  |
|  |  [!] Must be future date                                                                    |  |
|  |                                                                                              |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  (Lines section with error highlighted on line 2)                                                 |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

### Saving State

```
+--------------------------------------------------------------------------------------------------+
|                                      Create Transfer Order                                   [X]  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  +-------------------------------- HEADER SECTION ----------------------------------------------+  |
|  |  (Header fields visible but disabled)                                                       |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  +-------------------------------- LINES SECTION -----------------------------------------------+  |
|  |  (Lines table visible but disabled)                                                         |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  +----------------------------------------------------------------------------------------------+  |
|  |                          [Spinner] Saving transfer order...                                |  |
|  |                                                                                              |  |
|  |                [Cancel (disabled)]    [Save as Draft (disabled)]   [Release (disabled)]    |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

---

## Key Components

### 1. Header Section Fields

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| from_warehouse_id | Dropdown | Yes | Must exist in org, cannot equal to_warehouse |
| to_warehouse_id | Dropdown | Yes | Must exist in org, cannot equal from_warehouse |
| planned_ship_date | Date picker | Yes | Must be >= today |
| planned_receive_date | Date picker | Yes | Must be >= planned_ship_date |
| priority | Dropdown | No | Low, Normal, High, Urgent |
| notes | Textarea | No | Max 1000 chars |

### 2. Warehouse Selection Behavior

When warehouses are selected:
1. From warehouse selected → populate available inventory
2. To warehouse selected → validate != from warehouse
3. Planned receive date auto-suggested: planned_ship_date + 2 days (configurable)

### 3. Lines Table

| Column | Width | Description |
|--------|-------|-------------|
| # | 40px | Line number (auto-increment) |
| Product | 250px | Product name + code |
| Quantity | 100px | Transfer quantity (editable) |
| UoM | 60px | Unit of measure (from product) |
| Available | 100px | Available stock in source warehouse |
| LP Selection | 150px | Link to LP selection modal (if enabled) |
| Actions | 80px | Edit [E] and Delete [X] buttons |

### 4. Availability Indicators

| Indicator | Condition | Color | Action |
|-----------|-----------|-------|--------|
| [OK] Green | available >= quantity * 1.2 | Green | Comfortable stock |
| [!] Yellow | quantity <= available < quantity * 1.2 | Yellow | Low stock warning |
| [!] Red | available < quantity | Red | Insufficient stock, blocks release |

### 5. LP Selection Logic

**When `to_require_lp_selection = true` in Settings:**
- User must select LPs before release
- LP Selection modal shows available LPs in source warehouse
- Can auto-select by FIFO or FEFO
- Selected LPs validated for availability

**When `to_require_lp_selection = false`:**
- LP selection optional
- LPs picked at warehouse during shipment

---

## Main Actions

### Modal Actions

| Action | Enabled When | Result |
|--------|--------------|--------|
| **Cancel** | Always | Close modal, discard changes (confirm if unsaved) |
| **Save as Draft** | Header valid (warehouses, dates) | Save TO with status = "draft" |
| **Release** | Header valid AND lines.length >= 1 AND no red availability | Save TO and transition to "planned" |
| **Save Changes** (Edit mode) | Changes made | Save changes to existing draft TO |
| **Save & Release** (Edit mode) | Valid header + lines + no shortages | Save and release |

### Line Actions

| Action | Location | Result |
|--------|----------|--------|
| **Add Line** | Table header / Empty state button | Opens Add Line modal |
| **Edit Line** | Row action [E] | Opens Edit Line modal with pre-filled values |
| **Delete Line** | Row action [X] | Removes line with confirmation |
| **Select LPs** | LP Selection column | Opens LP Selection modal |

---

## States

| State | Description | Elements Shown |
|-------|-------------|----------------|
| **Loading** | Dropdowns loading | Skeleton loaders for warehouse dropdowns |
| **Empty Lines** | No lines added | Empty state with "Add First Line" CTA |
| **Success** | Ready for editing | Full form with all fields |
| **Validation Error** | Form has errors | Error banner + field-level error messages |
| **Saving** | Form submitting | Disabled form + loading spinner on buttons |

---

## Data Fields

### Create TO Request

```typescript
interface CreateTORequest {
  from_warehouse_id: string;     // Required
  to_warehouse_id: string;       // Required
  planned_ship_date: string;     // Required, ISO date
  planned_receive_date: string;  // Required, ISO date
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  notes?: string;
  lines: CreateTOLineRequest[];  // At least 1 for release
}

interface CreateTOLineRequest {
  product_id: string;
  quantity: number;
  lp_selections?: {
    lp_id: string;
    quantity: number;
  }[];
}
```

### Update TO Request

```typescript
interface UpdateTORequest {
  from_warehouse_id?: string;     // Triggers warehouse change confirmation if lines exist
  to_warehouse_id?: string;
  planned_ship_date?: string;
  planned_receive_date?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  notes?: string;
  lines?: CreateTOLineRequest[];  // Replaces all lines
}
```

---

## API Endpoints

### Create Transfer Order

```
POST /api/planning/transfer-orders
Body: {
  "from_warehouse_id": "uuid-wh-main",
  "to_warehouse_id": "uuid-wh-branch-a",
  "planned_ship_date": "2024-12-20",
  "planned_receive_date": "2024-12-22",
  "priority": "normal",
  "notes": "Priority transfer - load truck #42",
  "lines": [
    {
      "product_id": "uuid-flour",
      "quantity": 500,
      "lp_selections": [
        { "lp_id": "uuid-lp-12346", "quantity": 300 },
        { "lp_id": "uuid-lp-12348", "quantity": 200 }
      ]
    },
    {
      "product_id": "uuid-sugar",
      "quantity": 200
    }
  ]
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid-to-42",
    "to_number": "TO-2024-00042",
    "status": "draft",
    "from_warehouse": { "id": "uuid-wh-main", "name": "Main Warehouse" },
    "to_warehouse": { "id": "uuid-wh-branch-a", "name": "Branch-A" },
    "lines_count": 2,
    "created_at": "2024-12-14T10:30:00Z"
  }
}
```

### Update Transfer Order

```
PUT /api/planning/transfer-orders/:id
Body: {
  "from_warehouse_id": "uuid-wh-regional",  // Optional - triggers confirmation if lines exist
  "to_warehouse_id": "uuid-wh-branch-b",    // Optional
  "planned_ship_date": "2024-12-21",        // Optional
  "planned_receive_date": "2024-12-23",     // Optional
  "priority": "high",                       // Optional
  "notes": "Updated notes",                 // Optional
  "lines": [                                 // Optional - replaces all lines
    {
      "product_id": "uuid-flour",
      "quantity": 600,
      "lp_selections": [
        { "lp_id": "uuid-lp-12346", "quantity": 600 }
      ]
    }
  ]
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid-to-42",
    "to_number": "TO-2024-00042",
    "status": "draft",
    "from_warehouse": { "id": "uuid-wh-regional", "name": "Regional Distribution Center" },
    "to_warehouse": { "id": "uuid-wh-branch-b", "name": "Branch-B" },
    "lines_count": 1,
    "updated_at": "2024-12-14T11:15:00Z"
  }
}
```

### Add/Update TO Line

```
POST /api/planning/transfer-orders/:id/lines
Body: {
  "product_id": "uuid-flour",
  "quantity": 500,
  "lp_selections": [
    { "lp_id": "uuid-lp-12346", "quantity": 300 },
    { "lp_id": "uuid-lp-12348", "quantity": 200 }
  ]
}

Response:
{
  "success": true,
  "data": {
    "line_id": "uuid-line-1",
    "product": {
      "id": "uuid-flour",
      "code": "RM-FLOUR-001",
      "name": "Flour Type A"
    },
    "quantity": 500,
    "uom": "kg",
    "lp_selections_count": 2
  }
}

Error (duplicate product):
{
  "success": false,
  "error": {
    "code": "DUPLICATE_PRODUCT",
    "message": "This product is already on the transfer order (Line 1)",
    "existing_line_number": 1
  }
}
```

### Get Available Inventory

```
GET /api/planning/transfer-orders/inventory-check?warehouse_id={id}&product_ids[]={id1}&product_ids[]={id2}

Response:
{
  "success": true,
  "data": [
    {
      "product_id": "uuid-flour",
      "product_name": "Flour Type A",
      "available_qty": 1200,
      "uom": "kg",
      "lp_count": 5
    },
    {
      "product_id": "uuid-sugar",
      "product_name": "Sugar White",
      "available_qty": 150,
      "uom": "kg",
      "lp_count": 1
    }
  ]
}
```

### Get Available LPs

```
GET /api/planning/transfer-orders/available-lps?warehouse_id={id}&product_id={id}

Response:
{
  "success": true,
  "data": [
    {
      "lp_id": "uuid-lp-12345",
      "lp_number": "LP-2024-12345",
      "quantity": 250,
      "uom": "kg",
      "lot_number": "L-001",
      "received_date": "2024-12-12",
      "expiry_date": "2025-03-12",
      "status": "available"
    },
    ...
  ]
}
```

---

## Validation Rules

### Header Validation

| Field | Rule | Error Message |
|-------|------|---------------|
| from_warehouse_id | Required | "Source warehouse is required" |
| to_warehouse_id | Required, != from_warehouse_id | "Destination warehouse is required", "Cannot transfer to same warehouse" |
| planned_ship_date | Required, >= today | "Planned ship date is required", "Date must be in the future" |
| planned_receive_date | Required, >= planned_ship_date | "Planned receive date is required", "Receive date must be after ship date" |

### Line Validation

| Field | Rule | Error Message |
|-------|------|---------------|
| product_id | Required, unique in TO | "Product is required", "This product is already on the transfer order (Line {N})" |
| quantity | Required, > 0 | "Quantity is required", "Quantity must be greater than 0" |
| quantity | <= available (if release) | "Quantity exceeds available stock ({available} {uom} available)" |

### Release Validation

| Rule | Error Message |
|------|---------------|
| lines.length >= 1 | "At least one line item is required to release" |
| All lines have sufficient stock | "Cannot release - insufficient stock for {product_name}" |
| LPs selected (if required) | "LP selection required for all lines" |

---

## Business Rules

### Status-Based Editability

| Status | Header Editable | Lines Editable | Can Release |
|--------|-----------------|----------------|------------|
| Draft | Yes | Yes (add/edit/delete) | Yes |
| Planned | Limited (notes only) | No | No |
| Shipped+ | No | No | No |

### Warehouse Change Impact

When from_warehouse changes:
1. Check if lines exist
2. If lines exist: Show confirmation dialog (see Warehouse Change Confirmation Dialog wireframe)
3. If user confirms:
   - Clear all lines
   - Reset availability calculations
   - Clear LP selections
4. If user cancels: Revert to previous warehouse selection

### Duplicate Product Blocking (FR-PLAN-013)

When adding line with product already in TO:
1. Check if product_id already exists in TO lines
2. If exists: Show error dialog (see Duplicate Product Blocked Dialog wireframe)
3. Do NOT allow adding duplicate product
4. Provide "Edit Existing Line" option to increase quantity instead

**Rationale**: Per FR-PLAN-013, duplicate products are not allowed to ensure:
- Cleaner traceability
- Simpler LP selection
- Avoid confusion during warehouse execution

### LP Selection Validation

When LP selection enabled:
1. Total selected LP qty must match line qty
2. Selected LPs must be from source warehouse
3. LPs must have status = 'available'
4. Warn if LP expiry < planned_receive_date + 30 days

---

## Accessibility

### Touch Targets
- All form fields: 48dp minimum height
- Add Line button: 48x48dp
- Modal close button: 48x48dp
- Action buttons: 48dp height

### Contrast
- Field labels: 4.5:1
- Error messages: 4.5:1 (red on white)
- Availability indicators: Bold, 4.5:1

### Screen Reader
- Modal: role="dialog" aria-modal="true" aria-labelledby="modal-title"
- Required fields: aria-required="true"
- Error messages: aria-describedby linking to error text
- Availability: aria-label="Stock availability: 1,200 kg available, sufficient"

### Keyboard Navigation
- Tab: Move through form fields in logical order
- Enter: Submit form (when focus on button)
- Escape: Close modal (with unsaved changes warning)
- Arrow keys: Navigate dropdowns

### Focus Management
- On modal open: Focus on first field (From Warehouse)
- On Add Line: Focus on Product search
- On error: Focus on error summary, then first errored field

---

## Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| Desktop (>1024px) | 3-column header, full lines table |
| Tablet (768-1024px) | 2-column header, condensed table |
| Mobile (<768px) | Stacked fields, card-based lines |

### Mobile Specifics
- Modal becomes full-screen
- Lines shown as stacked cards
- "More Options" accordion for optional fields
- Sticky footer with action buttons
- LP Selection opens as separate full-screen modal

---

## Performance Notes

### Lazy Loading
- Warehouse dropdown: Load on modal open (cached)
- Product autocomplete: Search-on-type with 300ms debounce
- Availability check: Real-time query on line add/edit

### Optimistic Updates
- Line add/edit/delete: Update UI immediately, sync in background
- Show undo option for 5 seconds after line delete

### Caching
```typescript
// Cache keys
'org:{orgId}:warehouses:active'              // 5 min TTL
'org:{orgId}:products:transferrable'         // 2 min TTL
'org:{orgId}:warehouse:{whId}:inventory'     // 30 sec TTL
'org:{orgId}:warehouse:{whId}:lps:{prodId}'  // 30 sec TTL
```

---

## Testing Requirements

### Unit Tests
- Warehouse validation (cannot be same)
- Date validation (ship < receive, both >= today)
- Availability indicator logic
- LP selection validation
- Duplicate product detection and blocking

### Integration Tests
- POST /api/planning/transfer-orders
- PUT /api/planning/transfer-orders/:id
- GET /api/planning/transfer-orders/inventory-check
- GET /api/planning/transfer-orders/available-lps
- POST /api/planning/transfer-orders/:id/lines (including duplicate detection)

### E2E Tests
- Create new TO with 3 lines
- Edit draft TO, add line, change quantity
- Attempt to add duplicate product - see error dialog
- Change warehouse with existing lines - see confirmation dialog
- Availability check shows correct indicators
- LP selection works (if enabled)
- Release TO transitions to Planned
- Validation errors display correctly
- Cancel modal with unsaved changes warning
- Mobile flow: create TO on phone

### Performance Tests
- Modal open time: <500ms
- Product search response: <300ms
- Availability check: <500ms
- Form submission: <1s

---

## Quality Gates

Before handoff to FRONTEND-DEV:
- [x] All states defined (Loading, Empty Lines, Success, Validation Error, Saving)
- [x] Warehouse change confirmation dialog wireframe added
- [x] Duplicate product blocking dialog wireframe added
- [x] Duplicate product logic changed to BLOCK (not allow with confirmation)
- [x] PUT endpoint documented for edit mode
- [x] POST /api/planning/transfer-orders/:id/lines endpoint added
- [x] Responsive breakpoints documented
- [x] All API endpoints specified
- [x] Accessibility checklist passed
- [x] Validation rules documented
- [x] LP selection workflow documented
- [x] Availability check logic documented
- [x] Keyboard navigation defined

---

## Handoff to FRONTEND-DEV

```yaml
feature: TO Create/Edit Modal
story: PLAN-011
fr_coverage: FR-PLAN-012, FR-PLAN-013, FR-PLAN-016
approval_status:
  mode: "review_each"
  user_approved: false  # PENDING USER REVIEW
deliverables:
  wireframe: docs/3-ARCHITECTURE/ux/wireframes/PLAN-011-transfer-order-create-edit-modal.md
  api_endpoints:
    - POST /api/planning/transfer-orders
    - PUT /api/planning/transfer-orders/:id
    - POST /api/planning/transfer-orders/:id/lines
    - GET /api/planning/transfer-orders/inventory-check
    - GET /api/planning/transfer-orders/available-lps
states_per_screen: [loading, empty_lines, success, validation_error, saving]
dialogs:
  - warehouse_change_confirmation
  - duplicate_product_blocked
breakpoints:
  mobile: "<768px (full-screen modal, card lines)"
  tablet: "768-1024px (2-column header)"
  desktop: ">1024px (3-column header, table lines)"
accessibility:
  touch_targets: "48dp minimum"
  contrast: "4.5:1 minimum"
  aria_roles: "dialog, required, describedby"
modal_size: "Large (max-width: 900px, desktop)"
contains_submodal: "LP Selection Modal"
related_screens:
  - PLAN-010: TO List Page
  - PLAN-012: TO Detail Page
critical_fixes:
  - Duplicate product logic changed from "allow with confirmation" to "BLOCK completely" per FR-PLAN-013
  - Added warehouse change confirmation dialog
  - Added PUT endpoint for edit mode
  - Added POST /api/planning/transfer-orders/:id/lines endpoint
  - Added duplicate product error response to API spec
  - Added saving state wireframe
```

---

**Status**: Ready for User Review
**Approval Mode**: review_each (default)
**User Approved**: Pending
**Iterations**: 0 of 3
**Estimated Effort**: 10-12 hours
**Quality Target**: 95/100 (improved from 88%)
