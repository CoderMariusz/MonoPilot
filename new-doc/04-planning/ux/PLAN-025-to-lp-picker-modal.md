# PLAN-025: TO License Plate Picker Modal

**Story**: 03.9b - TO License Plate Pre-selection
**Component**: `TOLPPickerModal.tsx`
**Pattern**: ShadCN Dialog with DataTable (adapted from WH-RES-001)
**States**: Loading, Empty, Error, Success
**Integration**: PLAN-012 (TO Detail Page - Lines table "Assign LPs" button)

---

## Purpose

Modal to pre-select License Plates for Transfer Order lines. Allows planners to specify exact inventory units (by lot, expiry, location) to transfer BEFORE shipping execution.

**Key Differences from WH-RES-001**:
- No FIFO/FEFO strategy selector (MVP - manual selection only)
- Simpler filters (lot, expiry range, LP search)
- TO-specific validation (warehouse match, product match)
- "Coming Soon" badge for FIFO/FEFO auto-suggestion (Phase 2)

---

## Layout

### Success State (Default View - Desktop)

```
+---------------------------------------------------------------------------------+
|  Assign License Plates                                                        X |
+---------------------------------------------------------------------------------+
|                                                                                 |
|  Product: Flour Type A (RM-FLOUR-001)                                          |
|  TO Line Quantity: 500 kg                                                       |
|  Source Warehouse: Main Warehouse (WH-MAIN)                                    |
|                                                                                 |
|  +------ PROGRESS INDICATOR ------------------------------------------------+  |
|  |                                                                          |  |
|  |  Assigned: 0 / 500 kg                                   [  0%  ]        |  |
|  |  [                                                                ]      |  |
|  |                                                                          |  |
|  +--------------------------------------------------------------------------+  |
|                                                                                 |
|  +------ FILTERS ------------------------------------------------------------+  |
|  |                                                                          |  |
|  |  Lot Number:  [                   ]    LP Search: [                   ]  |  |
|  |                                                                          |  |
|  |  Expiry From: [YYYY-MM-DD   |v]        Expiry To:  [YYYY-MM-DD   |v]    |  |
|  |                                                                          |  |
|  |  [Clear Filters]                                        [Apply Filters]  |  |
|  |                                                                          |  |
|  +--------------------------------------------------------------------------+  |
|                                                                                 |
|  +------ FUTURE FEATURE (Phase 2) ------------------------------------------+  |
|  |  [Suggest LPs (FIFO)]  [Coming Soon]                                    |  |
|  +--------------------------------------------------------------------------+  |
|                                                                                 |
|  Available License Plates (5)                                                  |
|  +-------------------------------------------------------------------------+   |
|  | +---+------------+----------+------------+----------+----------+-------+|   |
|  | |   | LP Number  | Lot      | Expiry     | Location | Avail Qty| Assign||   |
|  | +---+------------+----------+------------+----------+----------+-------+|   |
|  | |[ ]| LP-00123   | B-4501   | 2026-06-15 | A1-01    | 150 kg   | [   ] ||   |
|  | +---+------------+----------+------------+----------+----------+-------+|   |
|  | |[ ]| LP-00124   | B-4502   | 2026-07-20 | A1-02    | 200 kg   | [   ] ||   |
|  | +---+------------+----------+------------+----------+----------+-------+|   |
|  | |[ ]| LP-00125   | B-4503   | 2026-08-10 | A2-01    | 100 kg   | [   ] ||   |
|  | +---+------------+----------+------------+----------+----------+-------+|   |
|  | |[ ]| LP-00126   | B-4504   | 2026-09-05 | A2-02    | 75 kg    | [   ] ||   |
|  | +---+------------+----------+------------+----------+----------+-------+|   |
|  | |[ ]| LP-00127   | B-4505   | 2026-10-01 | A3-01    | 50 kg    | [   ] ||   |
|  | +---+------------+----------+------------+----------+----------+-------+|   |
|  +-------------------------------------------------------------------------+   |
|                                                                                 |
|  Showing 5 of 5 available LPs                         [< 1 2 3 ... >] 10/page  |
|                                                                                 |
|  +------ SELECTED LPs SUMMARY (0) ------------------------------------------+  |
|  |                                                                          |  |
|  |  No License Plates selected yet.                                        |  |
|  |  Check the boxes above and enter quantities to assign LPs.              |  |
|  |                                                                          |  |
|  +--------------------------------------------------------------------------+  |
|                                                                                 |
+---------------------------------------------------------------------------------+
|                                       [Cancel]    [Assign Selected (0 kg)]      |
+---------------------------------------------------------------------------------+
```

### Success State (With Selections)

```
+---------------------------------------------------------------------------------+
|  Assign License Plates                                                        X |
+---------------------------------------------------------------------------------+
|                                                                                 |
|  Product: Flour Type A (RM-FLOUR-001)                                          |
|  TO Line Quantity: 500 kg                                                       |
|  Source Warehouse: Main Warehouse (WH-MAIN)                                    |
|                                                                                 |
|  +------ PROGRESS INDICATOR ------------------------------------------------+  |
|  |                                                                          |  |
|  |  Assigned: 350 / 500 kg                                 [ 70%  ]        |  |
|  |  [======================================                          ]      |  |
|  |  ! 150 kg remaining to assign                                           |  |
|  |                                                                          |  |
|  +--------------------------------------------------------------------------+  |
|                                                                                 |
|  +------ FILTERS (collapsed when selections exist) --------------------------+  |
|  |  [v] Filters  |  Lot Number: B-450*  |  [Clear Filters]                  |  |
|  +--------------------------------------------------------------------------+  |
|                                                                                 |
|  Available License Plates (5)                                                  |
|  +-------------------------------------------------------------------------+   |
|  | +---+------------+----------+------------+----------+----------+-------+|   |
|  | |   | LP Number  | Lot      | Expiry     | Location | Avail Qty| Assign||   |
|  | +---+------------+----------+------------+----------+----------+-------+|   |
|  | |[x]| LP-00123   | B-4501   | 2026-06-15 | A1-01    | 150 kg   | [150] ||   |
|  | +---+------------+----------+------------+----------+----------+-------+|   |
|  | |[x]| LP-00124   | B-4502   | 2026-07-20 | A1-02    | 200 kg   | [200] ||   |
|  | +---+------------+----------+------------+----------+----------+-------+|   |
|  | |[ ]| LP-00125   | B-4503   | 2026-08-10 | A2-01    | 100 kg   | [   ] ||   |
|  | +---+------------+----------+------------+----------+----------+-------+|   |
|  | |[ ]| LP-00126   | B-4504   | 2026-09-05 | A2-02    | 75 kg    | [   ] ||   |
|  | +---+------------+----------+------------+----------+----------+-------+|   |
|  | |[ ]| LP-00127   | B-4505   | 2026-10-01 | A3-01    | 50 kg    | [   ] ||   |
|  | +---+------------+----------+------------+----------+----------+-------+|   |
|  +-------------------------------------------------------------------------+   |
|                                                                                 |
|  +------ SELECTED LPs SUMMARY (2) ------------------------------------------+  |
|  |                                                                          |  |
|  |  +-------------------------------------------------------------+        |  |
|  |  | LP-00123 | Lot: B-4501 | Expiry: 2026-06-15 | 150 kg  [X]  |        |  |
|  |  +-------------------------------------------------------------+        |  |
|  |  | LP-00124 | Lot: B-4502 | Expiry: 2026-07-20 | 200 kg  [X]  |        |  |
|  |  +-------------------------------------------------------------+        |  |
|  |                                                                          |  |
|  |  Total Selected: 350 kg                                                 |  |
|  |                                                                          |  |
|  +--------------------------------------------------------------------------+  |
|                                                                                 |
+---------------------------------------------------------------------------------+
|                                       [Cancel]    [Assign Selected (350 kg)]    |
+---------------------------------------------------------------------------------+
```

### Validation Warning State (Quantity Mismatch)

```
+---------------------------------------------------------------------------------+
|  Assign License Plates                                                        X |
+---------------------------------------------------------------------------------+
|                                                                                 |
|  Product: Flour Type A (RM-FLOUR-001)                                          |
|  TO Line Quantity: 500 kg                                                       |
|  Source Warehouse: Main Warehouse (WH-MAIN)                                    |
|                                                                                 |
|  +------ PROGRESS INDICATOR (Warning) --------------------------------------+  |
|  |                                                                          |  |
|  |  Assigned: 350 / 500 kg                                 [ 70%  ]        |  |
|  |  [======================================              ] (yellow)         |  |
|  |                                                                          |  |
|  +--------------------------------------------------------------------------+  |
|                                                                                 |
|  +------ VALIDATION WARNING ------------------------------------------------+  |
|  |  !  Quantity Mismatch Warning                                           |  |
|  |                                                                          |  |
|  |  Total assigned (350 kg) does not match TO line quantity (500 kg).      |  |
|  |  Missing: 150 kg                                                         |  |
|  |                                                                          |  |
|  |  Options:                                                                |  |
|  |  - Assign more LPs to reach 500 kg                                      |  |
|  |  - Proceed with partial assignment (warehouse will pick remaining)      |  |
|  |                                                                          |  |
|  |  Note: If "Require Exact Quantity Match" setting is enabled, this       |  |
|  |  assignment will be blocked.                                             |  |
|  |                                                                          |  |
|  +--------------------------------------------------------------------------+  |
|                                                                                 |
|  (rest of modal same as above)                                                 |
|                                                                                 |
+---------------------------------------------------------------------------------+
|                                [Cancel]    [Assign Anyway (350 kg)]  (yellow)   |
+---------------------------------------------------------------------------------+
```

### Validation Error State (Over-Allocation)

```
+---------------------------------------------------------------------------------+
|  Assign License Plates                                                        X |
+---------------------------------------------------------------------------------+
|                                                                                 |
|  Product: Flour Type A (RM-FLOUR-001)                                          |
|  TO Line Quantity: 500 kg                                                       |
|  Source Warehouse: Main Warehouse (WH-MAIN)                                    |
|                                                                                 |
|  +------ PROGRESS INDICATOR (Error) ----------------------------------------+  |
|  |                                                                          |  |
|  |  Assigned: 550 / 500 kg                                 [110%  ]        |  |
|  |  [============================================================] (red)   |  |
|  |  ! Over-assigned by 50 kg                                               |  |
|  |                                                                          |  |
|  +--------------------------------------------------------------------------+  |
|                                                                                 |
|  +------ VALIDATION ERROR --------------------------------------------------+  |
|  |  X  Over-Allocation Error                                                |  |
|  |                                                                          |  |
|  |  Total assigned (550 kg) exceeds TO line quantity (500 kg).             |  |
|  |  Reduce assigned quantities by at least 50 kg to continue.              |  |
|  |                                                                          |  |
|  +--------------------------------------------------------------------------+  |
|                                                                                 |
|  (table shows LP-00123: 150kg assigned with input field highlighted red)       |
|                                                                                 |
+---------------------------------------------------------------------------------+
|                                       [Cancel]    [Assign Selected] (disabled)  |
+---------------------------------------------------------------------------------+
```

### Input Validation - Exceeds LP Available Qty

```
+-------------------------------------------------------------------------+
| +---+------------+----------+------------+----------+----------+-------+|
| |   | LP Number  | Lot      | Expiry     | Location | Avail Qty| Assign||
| +---+------------+----------+------------+----------+----------+-------+|
| |[x]| LP-00123   | B-4501   | 2026-06-15 | A1-01    | 150 kg   | [200] ||
|     |                                                            ^^^^^  |
|     |                                            ! Max available: 150 kg |
| +---+------------+----------+------------+----------+----------+-------+|
```

---

## Loading State

```
+---------------------------------------------------------------------------------+
|  Assign License Plates                                                        X |
+---------------------------------------------------------------------------------+
|                                                                                 |
|  Product: Flour Type A (RM-FLOUR-001)                                          |
|  TO Line Quantity: 500 kg                                                       |
|  Source Warehouse: Main Warehouse (WH-MAIN)                                    |
|                                                                                 |
|  +--------------------------------------------------------------------------+  |
|  |                                                                          |  |
|  |                                                                          |  |
|  |                     [====]  Loading available LPs...                    |  |
|  |                                                                          |  |
|  |                     Checking inventory in Main Warehouse                |  |
|  |                                                                          |  |
|  |                                                                          |  |
|  |  +--------------------------------------------------------------------+  |  |
|  |  |  [====================================]  [=====]  [========]       |  |  |
|  |  |  [====================================]  [=====]  [========]       |  |  |
|  |  |  [====================================]  [=====]  [========]       |  |  |
|  |  +--------------------------------------------------------------------+  |  |
|  |                           (skeleton table rows)                         |  |
|  |                                                                          |  |
|  +--------------------------------------------------------------------------+  |
|                                                                                 |
+---------------------------------------------------------------------------------+
|                                                              [Cancel]           |
+---------------------------------------------------------------------------------+
```

**Loading Behavior**:
- Show immediately: Product name, TO line qty, source warehouse
- Skeleton loader for LP table
- Cancel button active (allows user to close before load completes)
- If load takes >3s, show progress indicator

---

## Empty State

```
+---------------------------------------------------------------------------------+
|  Assign License Plates                                                        X |
+---------------------------------------------------------------------------------+
|                                                                                 |
|  Product: Flour Type A (RM-FLOUR-001)                                          |
|  TO Line Quantity: 500 kg                                                       |
|  Source Warehouse: Main Warehouse (WH-MAIN)                                    |
|                                                                                 |
|  +--------------------------------------------------------------------------+  |
|  |                                                                          |  |
|  |                              [Box Icon]                                  |  |
|  |                                                                          |  |
|  |                   No Available License Plates                            |  |
|  |                                                                          |  |
|  |       No LPs found for Flour Type A in Main Warehouse                   |  |
|  |       with available quantity.                                           |  |
|  |                                                                          |  |
|  |       Possible reasons:                                                  |  |
|  |       - All LPs are already assigned to other Transfer Orders           |  |
|  |       - No inventory received for this product                          |  |
|  |       - All LPs are blocked, quarantined, or expired                    |  |
|  |                                                                          |  |
|  |                                                                          |  |
|  |                   [View All Inventory]  [Clear Filters]                  |  |
|  |                                                                          |  |
|  +--------------------------------------------------------------------------+  |
|                                                                                 |
+---------------------------------------------------------------------------------+
|                                                              [Close]            |
+---------------------------------------------------------------------------------+
```

**Empty State Actions**:
- **View All Inventory**: Links to warehouse inventory page (filtered by product)
- **Clear Filters**: Resets filter fields (if filters were applied)
- **Close**: Closes modal

---

## Error State

```
+---------------------------------------------------------------------------------+
|  Assign License Plates                                                        X |
+---------------------------------------------------------------------------------+
|                                                                                 |
|  Product: Flour Type A (RM-FLOUR-001)                                          |
|  TO Line Quantity: 500 kg                                                       |
|  Source Warehouse: Main Warehouse (WH-MAIN)                                    |
|                                                                                 |
|  +--------------------------------------------------------------------------+  |
|  |                                                                          |  |
|  |                           [Warning Icon]                                 |  |
|  |                                                                          |  |
|  |                  Failed to Load License Plates                           |  |
|  |                                                                          |  |
|  |       Error: Unable to fetch available LPs from warehouse               |  |
|  |                                                                          |  |
|  |       This may be due to:                                                |  |
|  |       - Network connectivity issues                                      |  |
|  |       - Server temporarily unavailable                                   |  |
|  |                                                                          |  |
|  |       Error Code: PLAN-025-LOAD-ERR                                     |  |
|  |                                                                          |  |
|  |                                                                          |  |
|  |                      [Try Again]    [Contact Support]                   |  |
|  |                                                                          |  |
|  +--------------------------------------------------------------------------+  |
|                                                                                 |
+---------------------------------------------------------------------------------+
|                                                              [Close]            |
+---------------------------------------------------------------------------------+
```

**Error State Actions**:
- **Try Again**: Refetch available LPs
- **Contact Support**: Opens support page/email
- **Close**: Closes modal

---

## Mobile View (<768px)

### Mobile - Success State

```
+----------------------------------+
|  Assign LPs                    X |
+----------------------------------+
|                                  |
|  Flour Type A                    |
|  500 kg needed                   |
|  From: Main Warehouse            |
|                                  |
|  Progress: 350 / 500 kg          |
|  [========================    ]  |
|                                  |
|  +----------------------------+  |
|  |  [v] Filters               |  |
|  +----------------------------+  |
|                                  |
|  Available LPs (5)               |
|                                  |
|  +----------------------------+  |
|  | [x] LP-00123               |  |
|  | Lot: B-4501 | 2026-06-15   |  |
|  | Location: A1-01            |  |
|  | Available: 150 kg          |  |
|  | Assign: [150    ] kg       |  |
|  +----------------------------+  |
|  | [x] LP-00124               |  |
|  | Lot: B-4502 | 2026-07-20   |  |
|  | Location: A1-02            |  |
|  | Available: 200 kg          |  |
|  | Assign: [200    ] kg       |  |
|  +----------------------------+  |
|  | [ ] LP-00125               |  |
|  | Lot: B-4503 | 2026-08-10   |  |
|  | Location: A2-01            |  |
|  | Available: 100 kg          |  |
|  | Assign: [       ] kg       |  |
|  +----------------------------+  |
|                                  |
|  Selected (2): 350 kg            |
|                                  |
|  +----------------------------+  |
|  | LP-00123: 150 kg       [X] |  |
|  | LP-00124: 200 kg       [X] |  |
|  +----------------------------+  |
|                                  |
+----------------------------------+
|  [Cancel]  [Assign (350 kg)]     |
+----------------------------------+
```

**Mobile Adaptations**:
- Full-width modal (slides up from bottom)
- Card-based LP list (stacked layout)
- Collapsible filter section (default collapsed)
- Sticky header with product info
- Sticky footer with action buttons
- Selected LPs summary collapsed by default (expandable)

---

## Component Props

```typescript
interface TOLPPickerModalProps {
  // Context
  toId: string;
  toLineId: string;
  toLineNumber: number;

  // Product info (from TO line)
  productId: string;
  productName: string;
  productCode: string;
  requiredQty: number;
  uom: string;

  // Warehouse info (from TO)
  fromWarehouseId: string;
  fromWarehouseName: string;
  fromWarehouseCode: string;

  // Existing assignments (for edit mode)
  existingAssignments?: LPAssignment[];

  // Callbacks
  onAssign: (selections: LPSelection[]) => Promise<void>;
  onCancel: () => void;
}

interface LPSelection {
  lpId: string;
  lpNumber: string;
  quantity: number;
  lotNumber: string | null;
  expiryDate: string | null;
  location: string | null;
}

interface LPAssignment {
  id: string;          // to_line_lps.id
  lpId: string;
  lpNumber: string;
  quantity: number;
  lotNumber: string | null;
  expiryDate: string | null;
  location: string | null;
}

interface AvailableLP {
  id: string;
  lpNumber: string;
  lotNumber: string | null;
  expiryDate: string | null;
  location: string | null;
  availableQty: number;
  uom: string;
  // For display only
  allocatedToOtherTOs?: number;  // qty already assigned to other TOs
}

interface LPPickerFilters {
  lotNumber?: string;
  expiryFrom?: string;   // YYYY-MM-DD
  expiryTo?: string;     // YYYY-MM-DD
  search?: string;       // LP number search
}
```

---

## Accessibility (WCAG 2.1 AA)

| Requirement | Implementation |
|-------------|----------------|
| Keyboard Navigation | Tab through checkboxes, inputs, buttons; Enter to toggle checkbox |
| Screen Reader | ARIA labels: "Select LP-00123, 150 kg available, Lot B-4501" |
| Focus Indicators | 2px blue outline on focus for all interactive elements |
| Color Independence | Progress bar shows numeric value, not color-only |
| Touch Targets | 48x48dp minimum for checkboxes, buttons, remove icons |
| ARIA Roles | role="dialog", role="table", aria-labelledby for modal title |
| Live Region | Progress indicator announced when qty changes |
| Error Announcement | Validation errors announced via aria-live="polite" |
| Modal Focus Trap | Focus trapped within modal when open |
| Escape to Close | Pressing Escape key closes modal |

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Tab | Navigate between interactive elements |
| Shift+Tab | Navigate backwards |
| Enter | Toggle checkbox, activate button |
| Space | Toggle checkbox |
| Escape | Close modal |
| Arrow Up/Down | Navigate table rows (when row focused) |

---

## Business Rules

### LP Selection Rules

1. **Warehouse Filter**: Only LPs from TO.from_warehouse_id are shown
2. **Product Filter**: Only LPs containing TO line.product_id are shown
3. **Available Qty**: LP.available_qty > 0 required
4. **Already Assigned**: LPs assigned to OTHER TOs are hidden (or show reduced available qty if partial allocation allowed)
5. **Expired LPs**: LPs with expiry_date < today are excluded
6. **Blocked/Quarantined**: LPs with blocked status are excluded

### Quantity Validation Rules

| Rule | Validation | Error Level |
|------|------------|-------------|
| Assign qty <= Available qty | Per-LP input validation | Error (blocks input) |
| Total assigned <= Required qty | Form-level validation | Error (blocks submit) |
| Total assigned = Required qty | Settings-dependent | Warning or Error |
| Total assigned > 0 | Form-level validation | Error (no empty submit) |

### Settings-Dependent Behavior

| Setting | Behavior When Enabled |
|---------|----------------------|
| Require LP Selection | TO cannot transition to PLANNED without LP assignments |
| Require Exact Quantity Match | Assignment blocked if total != required qty |

### Status-Based Access

| TO Status | "Assign LPs" Button | LP Modifications |
|-----------|---------------------|------------------|
| DRAFT | Visible | Add/Remove allowed |
| PLANNED | Visible | Add/Remove allowed |
| SHIPPED | Hidden | No modifications |
| PARTIALLY_SHIPPED | Hidden | No modifications |
| RECEIVED | Hidden | No modifications |
| CLOSED | Hidden | No modifications |
| CANCELLED | Hidden | No modifications |

---

## Interactions

### Opening the Modal

1. User clicks "Assign LPs" button on TO line (TO Detail page)
2. Modal opens with loading state
3. API call: `GET /api/planning/transfer-orders/:id/lines/:lineId/available-lps`
4. On success: Display available LPs table
5. On error: Display error state with retry option

### Selecting an LP

1. User checks checkbox next to LP row
2. "Assign" input field becomes active (defaults to available qty)
3. Progress indicator updates with new total
4. LP appears in "Selected LPs Summary" section

### Adjusting Quantity

1. User edits "Assign" input field for selected LP
2. Validation: qty must be > 0 and <= available_qty
3. Progress indicator updates immediately
4. If qty exceeds available: Show inline error, prevent increase

### Removing Selection

1. User unchecks checkbox OR clicks [X] in Selected LPs Summary
2. LP removed from selections
3. Progress indicator updates
4. "Assign" input field clears/disables

### Submitting Assignments

1. User clicks "Assign Selected (X kg)" button
2. Validation runs:
   - Total > 0: Required
   - Total <= required_qty: Required
   - Total = required_qty: Settings-dependent (warning or error)
3. If validation passes:
   - API call: `POST /api/planning/transfer-orders/:id/lines/:lineId/assign-lps`
   - On success: Close modal, refresh TO Detail page, show success toast
   - On error: Show error message in modal (keep modal open)

### Filter Behavior

1. User enters filter criteria (lot number, expiry range, search)
2. User clicks "Apply Filters" OR presses Enter
3. Table updates with filtered results
4. If no results: Show empty state (filters applied variant)
5. "Clear Filters" resets all filter fields and refetches

---

## API Integration

### Get Available LPs

```
GET /api/planning/transfer-orders/:id/lines/:lineId/available-lps
?lot_number=B-450*
&expiry_from=2026-01-01
&expiry_to=2026-12-31
&search=LP-001

Response 200:
{
  "success": true,
  "data": {
    "lps": [
      {
        "id": "uuid-lp-123",
        "lp_number": "LP-00123",
        "lot_number": "B-4501",
        "expiry_date": "2026-06-15",
        "location": "A1-01",
        "available_qty": 150,
        "uom": "kg"
      },
      // ... more LPs
    ],
    "total_count": 5,
    "filters_applied": {
      "warehouse_id": "uuid-wh-main",
      "product_id": "uuid-flour",
      "lot_number": "B-450*",
      "expiry_from": "2026-01-01",
      "expiry_to": "2026-12-31"
    }
  }
}
```

### Assign LPs

```
POST /api/planning/transfer-orders/:id/lines/:lineId/assign-lps

Request Body:
{
  "lps": [
    { "lp_id": "uuid-lp-123", "quantity": 150 },
    { "lp_id": "uuid-lp-124", "quantity": 200 }
  ]
}

Response 200:
{
  "success": true,
  "data": {
    "assignments": [
      {
        "id": "uuid-assignment-1",
        "lp_id": "uuid-lp-123",
        "lp_number": "LP-00123",
        "quantity": 150,
        "lot_number": "B-4501",
        "expiry_date": "2026-06-15"
      },
      {
        "id": "uuid-assignment-2",
        "lp_id": "uuid-lp-124",
        "lp_number": "LP-00124",
        "quantity": 200,
        "lot_number": "B-4502",
        "expiry_date": "2026-07-20"
      }
    ],
    "total_assigned": 350,
    "total_required": 500,
    "is_complete": false
  },
  "message": "2 License Plates assigned successfully"
}

Response 400 (Validation Error):
{
  "success": false,
  "error": {
    "code": "QUANTITY_MISMATCH",
    "message": "Total LP quantity (350) does not match TO line quantity (500)",
    "details": {
      "assigned": 350,
      "required": 500,
      "difference": 150
    }
  }
}
```

---

## Technical Notes

### Performance Requirements

- Modal open to LPs displayed: <500ms
- Filter application: <300ms
- Assignment submission: <1000ms

### Caching Strategy

```typescript
// Cache key pattern
'org:{orgId}:to:{toId}:line:{lineId}:available-lps'  // 30 sec TTL
'org:{orgId}:to:{toId}:line:{lineId}:assignments'    // 30 sec TTL
```

### Error Handling

| Error | User Message | Recovery Action |
|-------|--------------|-----------------|
| Network timeout | "Unable to load LPs. Check connection." | Retry button |
| LP no longer available | "LP-00123 is no longer available. Refresh list." | Refresh button |
| Concurrent modification | "This TO line was modified. Please refresh." | Close and reload |
| Permission denied | "You don't have permission to assign LPs." | Close modal |

---

## Testing Requirements

### Unit Tests

- Progress bar calculation (assigned/required percentage)
- Quantity validation (max, min, exceeds available)
- Filter application (lot number, expiry range, search)
- Selection state management (add, remove, update qty)

### Integration Tests

- GET /api/.../available-lps with various filters
- POST /api/.../assign-lps with valid data
- POST /api/.../assign-lps with validation errors
- Permission checks (role-based access)

### E2E Tests

- Open modal from TO Detail page
- Select multiple LPs and assign quantities
- Submit and verify assignments on TO Detail page
- Mobile responsive layout
- Keyboard navigation through modal
- Error state recovery (retry)

---

## Related Wireframes

| ID | Name | Relationship |
|----|------|--------------|
| PLAN-012 | TO Detail Page | Integration point - "Assign LPs" button |
| WH-RES-001 | Available LPs Picker | Pattern source (FIFO/FEFO version) |
| PLAN-011 | TO Create/Edit Modal | TO creation (lines without LP assignment) |

---

## Quality Gates

Before handoff to FRONTEND-DEV:
- [x] All states defined (Loading, Empty, Error, Success)
- [x] Validation states defined (Warning, Error)
- [x] Mobile responsive view documented
- [x] Component props interface defined
- [x] API endpoints documented
- [x] Accessibility requirements met (WCAG 2.1 AA)
- [x] Business rules documented
- [x] Interactions documented
- [x] Error handling defined
- [x] Performance requirements stated

---

## Handoff to FRONTEND-DEV

```yaml
feature: TO LP Picker Modal
story: 03.9b
wireframe_id: PLAN-025
fr_coverage: FR-PLAN-016
approval_status:
  mode: "review_each"
  user_approved: false  # PENDING USER REVIEW
deliverables:
  wireframe: docs/3-ARCHITECTURE/ux/wireframes/PLAN-025-to-lp-picker-modal.md
  components:
    - TOLPPickerModal.tsx
    - TOLineLPAssignments.tsx (display on TO Detail)
    - LPAssignmentBadge.tsx (status badge)
  api_endpoints:
    - GET /api/planning/transfer-orders/:id/lines/:lineId/available-lps
    - POST /api/planning/transfer-orders/:id/lines/:lineId/assign-lps
    - DELETE /api/planning/transfer-orders/:id/lines/:lineId/lps/:lpId
    - GET /api/planning/transfer-orders/:id/lines/:lineId/lps
states_per_screen: [loading, empty, error, success, validation_warning, validation_error]
breakpoints:
  mobile: "<768px"
  tablet: "768-1024px"
  desktop: ">1024px"
accessibility:
  touch_targets: "48dp minimum"
  contrast: "4.5:1 minimum"
  keyboard: "full navigation support"
  screen_reader: "ARIA labels and live regions"
related_screens:
  - PLAN-012: TO Detail Page (integration point)
  - WH-RES-001: Available LPs Picker (pattern source)
```

---

**Status**: Ready for User Review
**Approval Mode**: review_each (default)
**User Approved**: Pending
**Iterations**: 0 of 3
**Estimated Effort**: 6-8 hours (frontend implementation)
**Quality Target**: 95/100
