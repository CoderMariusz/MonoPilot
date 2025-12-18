# WH-005: Goods Receipt Note (GRN) from Transfer Order Modal

**Module**: Warehouse
**Feature**: GRN from TO with Variance Handling (WH-FR-004, WH-FR-001, WH-FR-002)
**Status**: Ready for Review
**Last Updated**: 2025-12-14

---

## ASCII Wireframe

### Success State - TO Pre-Selected (Desktop)

```
+--------------------------------------------------------------------------------------------------+
|                           Receive from Transfer Order: TO-2024-00042                         [X]  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  +-------------------------------- TRANSFER ORDER INFO -----------------------------------------+  |
|  |                                                                                              |  |
|  |  Transfer Order: TO-2024-00042                          Status: [Shipped]                   |  |
|  |  From: Main Warehouse (WH-MAIN)                         Shipped Date: Dec 18, 2024          |  |
|  |  To: Branch-A (WH-BRANCH-A)                             Shipment: SHIP-2024-00123           |  |
|  |                                                                                              |  |
|  |  Transit Location: [Enabled] TL-BRANCH-A-TRANSIT       (LPs will move to destination)       |  |
|  |                                                                                              |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  +-------------------------------- RECEIPT DETAILS ---------------------------------------------+  |
|  |                                                                                              |  |
|  |  Receipt Date *                 Receiving Warehouse *       Default Location                |  |
|  |  +----------------+             +--------------------+      +--------------------+           |  |
|  |  | 2024-12-20     |             | Branch-A           |      | Zone A-01     [v]  |           |  |
|  |  | (Today)   [C]  |             | (Auto-selected)    |      +--------------------+           |  |
|  |  +----------------+             +--------------------+      (Can override per line)          |  |
|  |                                                                                              |  |
|  |  Received By                    Notes (optional)                                            |  |
|  |  +--------------------+         +-----------------------------------------------------------+ |  |
|  |  | Jane Doe           |         | All items inspected - good condition                      | |  |
|  |  | (Current user)     |         +-----------------------------------------------------------+ |  |
|  |  +--------------------+                                                                      |  |
|  |                                                                                              |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  +-------------------------------- LINES TO RECEIVE --------------------------------------------+  |
|  |                                                                                              |  |
|  |  Items to Receive:                                                                          |  |
|  |                                                                                              |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |  | #  | Product          | Shipped | Received | Remaining | Receive | Location  | Variance| |  |
|  |  |    |                  | Qty     | Qty      | Qty       | Now     |           | Reason  | |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |  | 1  | Flour Type A     | 500 kg  | 0 kg     | 500 kg    | [500  ] | Zone A-01 |         | |  |
|  |  |    | RM-FLOUR-001     |         |          |           |   kg    | [v]       |         | |  |
|  |  |    | LPs: LP-12346,   |         |          |           |         |           |         | |  |
|  |  |    |      LP-12348    |         |          |           | [✓] Receive             | |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |  | 2  | Sugar White      | 100 kg  | 0 kg     | 100 kg    | [95   ] | Zone A-02 | [!]     | |  |
|  |  |    | RM-SUGAR-001     |         |          |           |   kg    | [v]       | Required| |  |
|  |  |    | LP: LP-12401     |         |          |           |         |           |         | |  |
|  |  |    |                  |         |          |           | [✓] Receive             | |  |
|  |  |    | Variance: -5 kg (Shortage)                                                           | |  |
|  |  |    | Reason: +------------------------------------------------------------------+           | |  |
|  |  |    |         | Damaged during transport - 1 bag broken                  [v]  |           | |  |
|  |  |    |         +------------------------------------------------------------------+           | |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |  | 3  | Salt Industrial  | 0 kg    | 0 kg     | 0 kg      | [0    ] | Zone A-01 |         | |  |
|  |  |    | RM-SALT-001      |         |          |           |   kg    | [v]       |         | |  |
|  |  |    | LP: None         |         |          |           |         |           |         | |  |
|  |  |    |                  |         |          |           | [ ] Receive             | |  |
|  |  |    | [i] Not yet shipped - will appear in next shipment                                   | |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |                                                                                              |  |
|  |  Summary:                                                                                   |  |
|  |  Total to Receive: 595 kg | LPs to Create: 2 | Variances: 1 (shortage: -5 kg)             |  |
|  |                                                                                              |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  +-------------------------------- VARIANCE RULES ----------------------------------------------+  |
|  |                                                                                              |  |
|  |  [!] Variance Detected:                                                                     |  |
|  |      - Sugar White: Received 95 kg vs Shipped 100 kg (-5 kg shortage)                      |  |
|  |      - Variance Reason is REQUIRED to proceed                                              |  |
|  |      - System will log variance for traceability                                           |  |
|  |                                                                                              |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  +----------------------------------------------------------------------------------------------+  |
|  |                                             [Cancel]    [Save Draft]    [Complete Receipt]   |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+

Validation Rules:
- At least 1 line must have Receive checkbox checked
- Received quantity must be > 0 for checked lines
- Location required for each line
- Variance reason REQUIRED when received_qty != shipped_qty
- Transit location handling: If enabled, LP moves from transit to destination location
```

### Success State - TO Selection Mode (Desktop)

```
+--------------------------------------------------------------------------------------------------+
|                                 Receive from Transfer Order                                  [X]  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  +-------------------------------- SELECT TRANSFER ORDER ---------------------------------------+  |
|  |                                                                                              |  |
|  |  Select Transfer Order to Receive:                                                          |  |
|  |                                                                                              |  |
|  |  Transfer Order *                                                                           |  |
|  |  +-----------------------------------------------------------------------------------------+  |  |
|  |  | [Search by TO number or source warehouse...]                                       [v]  |  |  |
|  |  +-----------------------------------------------------------------------------------------+  |  |
|  |                                                                                              |  |
|  |  Recent TOs Available for Receipt:                                                          |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |  | TO Number        | From Warehouse  | Status          | Shipped Date | Total Items  | |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |  | TO-2024-00042    | Main Warehouse  | Shipped         | Dec 18, 2024 | 2 items      | |  |
|  |  | TO-2024-00041    | Main Warehouse  | Partially Ship. | Dec 17, 2024 | 3 items      | |  |
|  |  | TO-2024-00039    | Central Hub     | Shipped         | Dec 15, 2024 | 1 item       | |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |                                                                                              |  |
|  |  [Load Transfer Order]                                                                      |  |
|  |                                                                                              |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  +----------------------------------------------------------------------------------------------+  |
|  |                                                                                    [Cancel]   |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

### After Submit - Success Confirmation

```
+--------------------------------------------------------------------------------------------------+
|                                   Receipt Completed Successfully                             [X]  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|                                                                                                    |
|                                      +------------------+                                          |
|                                      |  [Success Icon]  |                                          |
|                                      +------------------+                                          |
|                                                                                                    |
|                              Goods Receipt Note Created                                           |
|                                                                                                    |
|                              GRN Number: GRN-2024-00876                                           |
|                              Transfer Order: TO-2024-00042                                        |
|                              Receipt Date: Dec 20, 2024                                           |
|                                                                                                    |
|                              +----------------------------------------------------+               |
|                              | Items Received:                                    |               |
|                              |   - Flour Type A: 500 kg → Created LP-20241220-001|               |
|                              |   - Sugar White: 95 kg → Created LP-20241220-002  |               |
|                              |                                                    |               |
|                              | License Plates Created: 2                         |               |
|                              | Status: Completed                                  |               |
|                              |                                                    |               |
|                              | [i] Variance Logged:                               |               |
|                              |     Sugar White: -5 kg shortage (damaged)          |               |
|                              +----------------------------------------------------+               |
|                                                                                                    |
|                              Transfer Order Status: Partially Received                            |
|                              (Salt Industrial still pending)                                      |
|                                                                                                    |
|                                                                                                    |
|                       [View GRN Detail]    [Print Labels]    [Close]                              |
|                                                                                                    |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

### Mobile View - Receipt Form (<768px)

```
+----------------------------------+
|     Receive TO: TO-2024-00042  [X]
+----------------------------------+
|                                  |
|  --- TRANSFER ORDER ---          |
|                                  |
|  TO-2024-00042                   |
|  Status: [Shipped]               |
|  From: Main Warehouse            |
|  To: Branch-A                    |
|  Shipped: Dec 18, 2024           |
|                                  |
|  Transit Location: Enabled       |
|  TL-BRANCH-A-TRANSIT             |
|                                  |
|  --- RECEIPT INFO ---            |
|                                  |
|  Receipt Date *                  |
|  +----------------------------+  |
|  | 2024-12-20 (Today)    [C]  |  |
|  +----------------------------+  |
|                                  |
|  Warehouse                       |
|  +----------------------------+  |
|  | Branch-A (auto)            |  |
|  +----------------------------+  |
|                                  |
|  Default Location                |
|  +----------------------------+  |
|  | Zone A-01             [v]  |  |
|  +----------------------------+  |
|                                  |
|  Notes                           |
|  +----------------------------+  |
|  | All items inspected        |  |
|  +----------------------------+  |
|                                  |
|  --- ITEMS ---                   |
|                                  |
|  +----------------------------+  |
|  | [✓] 1. Flour Type A        |  |
|  |     RM-FLOUR-001           |  |
|  |     Shipped: 500 kg        |  |
|  |     Receive: [500] kg      |  |
|  |     Location: Zone A-01 [v]|  |
|  |     LPs: LP-12346, LP-12348|  |
|  +----------------------------+  |
|  | [✓] 2. Sugar White         |  |
|  |     RM-SUGAR-001           |  |
|  |     Shipped: 100 kg        |  |
|  |     Receive: [95] kg       |  |
|  |     Location: Zone A-02 [v]|  |
|  |     LP: LP-12401           |  |
|  |     [!] Variance: -5 kg    |  |
|  |     Reason:                |  |
|  |     +-----------------------+ |
|  |     | Damaged during     [v]| |
|  |     | transport - 1 bag    | |
|  |     | broken                | |
|  |     +-----------------------+ |
|  +----------------------------+  |
|  | [ ] 3. Salt Industrial     |  |
|  |     RM-SALT-001            |  |
|  |     Shipped: 0 kg          |  |
|  |     Not yet shipped        |  |
|  +----------------------------+  |
|                                  |
|  --- SUMMARY ---                 |
|                                  |
|  To Receive: 595 kg              |
|  LPs to Create: 2                |
|  Variances: 1 (-5 kg)            |
|                                  |
|  [!] Variance reason required    |
|                                  |
|  +----------------------------+  |
|  | [Save Draft]               |  |
|  | [Complete Receipt]         |  |
|  +----------------------------+  |
|                                  |
+----------------------------------+
```

### Loading State

```
+--------------------------------------------------------------------------------------------------+
|                           Receive from Transfer Order: ...                                   [X]  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  +-------------------------------- TRANSFER ORDER INFO -----------------------------------------+  |
|  |                                                                                              |  |
|  |  [================================]                  Loading transfer order...               |  |
|  |  [================================]                                                          |  |
|  |  [================================]                                                          |  |
|  |                                                                                              |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  +-------------------------------- RECEIPT DETAILS ---------------------------------------------+  |
|  |                                                                                              |  |
|  |  [==========]  [==========]  [==========]                                                   |  |
|  |                                                                                              |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  +-------------------------------- LINES TO RECEIVE --------------------------------------------+  |
|  |                                                                                              |  |
|  |  [==========================================================================================]  |  |
|  |  [==========================================================================================]  |  |
|  |  [==========================================================================================]  |  |
|  |                                                                                              |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  Loading receipt form...                                                                          |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

### Error State - Validation Errors

```
+--------------------------------------------------------------------------------------------------+
|                           Receive from Transfer Order: TO-2024-00042                         [X]  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  +-------------------------------- VALIDATION ERRORS -------------------------------------------+  |
|  |                                                                                              |  |
|  |  [!] Please fix the following errors:                                                       |  |
|  |                                                                                              |  |
|  |   ✗ Line 2 (Sugar White): Variance reason is required when received qty differs from       |  |
|  |     shipped qty (Received: 95 kg, Shipped: 100 kg)                                         |  |
|  |                                                                                              |  |
|  |   ✗ At least one line must be selected for receipt                                         |  |
|  |                                                                                              |  |
|  |   ✗ Line 1 (Flour Type A): Location is required                                            |  |
|  |                                                                                              |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  (Receipt form shown below with error indicators on specific fields)                              |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

### Error State - TO Not Found

```
+--------------------------------------------------------------------------------------------------+
|                                 Receive from Transfer Order                                  [X]  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|                                                                                                    |
|                                      +------------------+                                          |
|                                      |   [Error Icon]   |                                          |
|                                      +------------------+                                          |
|                                                                                                    |
|                              Transfer Order Not Found                                             |
|                                                                                                    |
|                     The transfer order could not be found, has already been                       |
|                     fully received, or you don't have permission to receive it.                   |
|                                                                                                    |
|                              Error: TO_NOT_AVAILABLE                                              |
|                              TO Number: TO-2024-00999                                             |
|                                                                                                    |
|                                                                                                    |
|                                      [Go Back]    [Select Different TO]                           |
|                                                                                                    |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

### Empty State - No Items to Receive

```
+--------------------------------------------------------------------------------------------------+
|                           Receive from Transfer Order: TO-2024-00042                         [X]  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  +-------------------------------- TRANSFER ORDER INFO -----------------------------------------+  |
|  |                                                                                              |  |
|  |  Transfer Order: TO-2024-00042                          Status: [Received]                  |  |
|  |  From: Main Warehouse (WH-MAIN)                         All items already received          |  |
|  |  To: Branch-A (WH-BRANCH-A)                                                                 |  |
|  |                                                                                              |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|                                                                                                    |
|                                      +------------------+                                          |
|                                      |   [Info Icon]    |                                          |
|                                      +------------------+                                          |
|                                                                                                    |
|                              No Items Available for Receipt                                       |
|                                                                                                    |
|                     All items from this transfer order have already been received.                |
|                     No further action is needed.                                                  |
|                                                                                                    |
|                              Received Date: Dec 19, 2024                                          |
|                              GRN Number: GRN-2024-00875                                           |
|                                                                                                    |
|                                                                                                    |
|                                      [View GRN Detail]    [Close]                                 |
|                                                                                                    |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

---

## Key Components

### 1. Transfer Order Info Section

| Field | Source | Display | Behavior |
|-------|--------|---------|----------|
| to_number | transfer_orders.to_number | "TO-2024-00042" | Read-only |
| status | transfer_orders.status | Badge | Must be 'shipped' or 'partially_shipped' |
| from_warehouse | warehouses.name + code | "Main Warehouse (WH-MAIN)" | Read-only |
| to_warehouse | warehouses.name + code | "Branch-A (WH-BRANCH-A)" | Read-only |
| shipped_date | transfer_orders.actual_ship_date | "Dec 18, 2024" | Read-only |
| shipment_number | Latest shipment record | "SHIP-2024-00123" | Read-only |
| transit_location | warehouse_settings.enable_transit_location | "Enabled" or "Disabled" | Info display |
| transit_location_name | locations.name | "TL-BRANCH-A-TRANSIT" | If enabled |

### 2. Receipt Details Section

| Field | Type | Required | Default | Validation |
|-------|------|----------|---------|------------|
| receipt_date | Date | Yes | Current date | Cannot be future date, cannot be before shipped_date |
| receiving_warehouse | Dropdown | Yes | TO.to_warehouse_id | Auto-selected, read-only |
| default_location | Dropdown | No | First active location | Used as default for all lines |
| received_by | Text | Yes | Current user | Auto-filled, read-only |
| notes | Textarea | No | Empty | Max 500 chars |

### 3. Lines Table Columns

| Column | Width | Description | Editable |
|--------|-------|-------------|----------|
| # | 40px | Line number | No |
| Product | 180px | Name + code + LP numbers | No |
| Shipped Qty | 80px | Quantity shipped | No |
| Received Qty | 80px | Previously received | No |
| Remaining Qty | 80px | Outstanding to receive | No |
| Receive Now | 100px | Input field + UoM | Yes |
| Location | 140px | Dropdown | Yes |
| Variance Reason | 140px | Dropdown (conditional) | Yes (if variance) |
| Checkbox | 40px | Select for receipt | Yes |

### 4. Variance Detection

| Scenario | Trigger | UI Indicator | Validation |
|----------|---------|--------------|------------|
| Exact match | received_qty = shipped_qty | None | Valid |
| Shortage | received_qty < shipped_qty | [!] Yellow warning + Reason dropdown | Variance reason REQUIRED |
| Overage | received_qty > shipped_qty | [!] Yellow warning + Reason dropdown | Variance reason REQUIRED |
| Zero receipt | received_qty = 0, shipped_qty > 0 | [i] Info message | Variance reason REQUIRED |

### 5. Variance Reason Options

| Reason Code | Display Text | Use Case |
|-------------|--------------|----------|
| damaged | Damaged during transport | Items broken/damaged in transit |
| shortage | Shortage - supplier sent less | Sent less than expected |
| overage | Overage - received extra | Sent more than expected |
| weight_variance | Weight variance (catch weight) | Variable weight products |
| counting_error | Counting error | Manual count discrepancy |
| other | Other (specify in notes) | Requires additional notes |

---

## User Interactions

### 1. Load Transfer Order

**Trigger**: Modal opens with TO ID parameter OR user selects from dropdown

**Flow**:
1. System validates TO status (must be 'shipped' or 'partially_shipped')
2. Loads TO header info
3. Loads TO lines with shipped_qty, received_qty, remaining_qty
4. Pre-fills receipt_date (today), receiving_warehouse (TO destination)
5. Auto-checks lines with remaining_qty > 0
6. Pre-fills receive_now with remaining_qty for checked lines

### 2. Change Receive Quantity

**Trigger**: User modifies receive_now input

**Flow**:
1. System validates: received_qty >= 0
2. If received_qty != shipped_qty → Show variance indicator
3. Reveal variance_reason dropdown (required)
4. Update summary totals
5. Enable/disable Complete Receipt button based on validation

### 3. Select/Deselect Line

**Trigger**: User clicks checkbox

**Flow**:
1. If checked → Enable receive_now input, pre-fill with remaining_qty
2. If unchecked → Disable receive_now input, clear value
3. Update summary: Total to Receive, LPs to Create
4. Validate: At least 1 line must be checked

### 4. Complete Receipt

**Trigger**: User clicks "Complete Receipt" button

**Validation**:
- At least 1 line selected (checkbox checked)
- receive_now > 0 for all selected lines
- Location selected for all selected lines
- Variance reason provided if receive_now != shipped_qty for any line
- receipt_date not in future, not before shipped_date

**API Call**: `POST /api/warehouse/grn/from-to`

**Success Flow**:
1. Create GRN record (grn_number auto-generated)
2. For each selected line:
   - Create LP record (lp_number auto-generated)
   - Update to_lines.received_qty += receive_now
   - If transit_location enabled: Move LP from transit to destination location
   - If variance exists: Log variance record
3. Update TO status:
   - If all lines fully received → status = 'received'
   - If some lines partially received → status = 'partially_received'
4. Display success modal with GRN number and LP numbers
5. Provide actions: View GRN Detail, Print Labels, Close

### 5. Save Draft

**Trigger**: User clicks "Save Draft" button

**Behavior**:
- Save current form state to localStorage (client-side only)
- Allow user to resume later
- No API call, no database changes
- Show toast: "Draft saved - you can resume later"

---

## API Endpoints

### POST /api/warehouse/grn/from-to

**Request Body**:
```json
{
  "to_id": "uuid-to-42",
  "receipt_date": "2024-12-20",
  "receiving_warehouse_id": "uuid-wh-branch-a",
  "received_by_user_id": "uuid-user-jane",
  "notes": "All items inspected - good condition",
  "lines": [
    {
      "to_line_id": "uuid-line-1",
      "product_id": "uuid-flour",
      "received_qty": 500,
      "uom": "kg",
      "location_id": "uuid-loc-zone-a-01",
      "variance_qty": 0,
      "variance_reason": null
    },
    {
      "to_line_id": "uuid-line-2",
      "product_id": "uuid-sugar",
      "received_qty": 95,
      "uom": "kg",
      "location_id": "uuid-loc-zone-a-02",
      "variance_qty": -5,
      "variance_reason": "damaged"
    }
  ]
}
```

**Validation**:
- `to_id`: Must exist, status IN ('shipped', 'partially_shipped'), org_id match
- `receipt_date`: Not null, not future, >= TO.actual_ship_date
- `receiving_warehouse_id`: Must match TO.to_warehouse_id
- `lines`: At least 1 line required
- `lines[].received_qty`: Must be > 0
- `lines[].location_id`: Must exist, belong to receiving_warehouse, status='active'
- `lines[].variance_reason`: Required if variance_qty != 0
- `lines[].to_line_id`: Must belong to TO

**Response - Success (201)**:
```json
{
  "success": true,
  "data": {
    "grn_id": "uuid-grn-876",
    "grn_number": "GRN-2024-00876",
    "status": "completed",
    "receipt_date": "2024-12-20",
    "to_number": "TO-2024-00042",
    "to_status": "partially_received",
    "lps_created": [
      {
        "lp_id": "uuid-lp-new-1",
        "lp_number": "LP-20241220-001",
        "product": "Flour Type A",
        "quantity": 500,
        "location": "Zone A-01"
      },
      {
        "lp_id": "uuid-lp-new-2",
        "lp_number": "LP-20241220-002",
        "product": "Sugar White",
        "quantity": 95,
        "location": "Zone A-02"
      }
    ],
    "variances": [
      {
        "product": "Sugar White",
        "variance_qty": -5,
        "variance_reason": "damaged",
        "notes": "Damaged during transport - 1 bag broken"
      }
    ],
    "total_received": 595,
    "lp_count": 2
  },
  "message": "GRN created successfully with 2 license plates"
}
```

**Response - Validation Error (400)**:
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Variance reason required for lines with quantity differences",
  "details": {
    "lines": [
      {
        "line_number": 2,
        "product": "Sugar White",
        "field": "variance_reason",
        "message": "Variance reason is required when received_qty (95) != shipped_qty (100)"
      }
    ]
  }
}
```

**Response - TO Not Available (404)**:
```json
{
  "success": false,
  "error": "TO_NOT_FOUND",
  "message": "Transfer order not found or not available for receipt",
  "details": {
    "to_id": "uuid-to-999",
    "reason": "TO status is 'received' - already fully received"
  }
}
```

### GET /api/warehouse/grn/from-to/available-tos

**Query Parameters**:
- `warehouse_id` (optional): Filter by destination warehouse
- `limit` (default: 10): Number of results

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "to_id": "uuid-to-42",
      "to_number": "TO-2024-00042",
      "from_warehouse": { "id": "uuid-wh-main", "name": "Main Warehouse" },
      "to_warehouse": { "id": "uuid-wh-branch-a", "name": "Branch-A" },
      "status": "shipped",
      "shipped_date": "2024-12-18",
      "items_count": 2,
      "remaining_items_count": 2
    },
    {
      "to_id": "uuid-to-41",
      "to_number": "TO-2024-00041",
      "from_warehouse": { "id": "uuid-wh-main", "name": "Main Warehouse" },
      "to_warehouse": { "id": "uuid-wh-branch-a", "name": "Branch-A" },
      "status": "partially_shipped",
      "shipped_date": "2024-12-17",
      "items_count": 3,
      "remaining_items_count": 1
    }
  ]
}
```

### GET /api/planning/transfer-orders/:id/receipt-detail

**Response**:
```json
{
  "success": true,
  "data": {
    "to_id": "uuid-to-42",
    "to_number": "TO-2024-00042",
    "status": "shipped",
    "from_warehouse": {
      "id": "uuid-wh-main",
      "code": "WH-MAIN",
      "name": "Main Warehouse"
    },
    "to_warehouse": {
      "id": "uuid-wh-branch-a",
      "code": "WH-BRANCH-A",
      "name": "Branch-A"
    },
    "actual_ship_date": "2024-12-18",
    "latest_shipment_number": "SHIP-2024-00123",
    "transit_location_enabled": true,
    "transit_location": {
      "id": "uuid-transit-loc",
      "code": "TL-BRANCH-A-TRANSIT",
      "name": "Branch-A Transit"
    },
    "lines": [
      {
        "to_line_id": "uuid-line-1",
        "line_number": 1,
        "product": {
          "id": "uuid-flour",
          "code": "RM-FLOUR-001",
          "name": "Flour Type A"
        },
        "requested_qty": 500,
        "shipped_qty": 500,
        "received_qty": 0,
        "remaining_qty": 500,
        "uom": "kg",
        "lp_numbers": ["LP-12346", "LP-12348"]
      },
      {
        "to_line_id": "uuid-line-2",
        "line_number": 2,
        "product": {
          "id": "uuid-sugar",
          "code": "RM-SUGAR-001",
          "name": "Sugar White"
        },
        "requested_qty": 200,
        "shipped_qty": 100,
        "received_qty": 0,
        "remaining_qty": 100,
        "uom": "kg",
        "lp_numbers": ["LP-12401"]
      },
      {
        "to_line_id": "uuid-line-3",
        "line_number": 3,
        "product": {
          "id": "uuid-salt",
          "code": "RM-SALT-001",
          "name": "Salt Industrial"
        },
        "requested_qty": 100,
        "shipped_qty": 0,
        "received_qty": 0,
        "remaining_qty": 0,
        "uom": "kg",
        "lp_numbers": []
      }
    ],
    "default_location": {
      "id": "uuid-loc-zone-a-01",
      "code": "ZONE-A-01",
      "name": "Zone A-01"
    }
  }
}
```

---

## Business Rules

### Transit Location Handling

**If `warehouse_settings.enable_transit_location = true`**:

1. When TO is shipped:
   - LPs are moved to transit_location (e.g., "TL-BRANCH-A-TRANSIT")
   - LP.status remains 'available'
   - LP.location_id = transit_location_id

2. When GRN is created from TO:
   - System moves LP from transit_location to destination location
   - LP.location_id updated to location selected in GRN form
   - stock_move record created: from=transit_location, to=destination_location

**If `enable_transit_location = false`**:

1. When TO is shipped:
   - LPs remain at source warehouse location
   - LP.status = 'reserved' (for TO)

2. When GRN is created from TO:
   - New LP created at destination warehouse
   - Source LP status updated to 'consumed' (transferred out)
   - LP genealogy record created linking source → destination LPs

### Variance Logging

**When received_qty != shipped_qty**:

1. Create `grn_variances` record:
   ```sql
   {
     grn_id: uuid,
     to_line_id: uuid,
     product_id: uuid,
     shipped_qty: 100,
     received_qty: 95,
     variance_qty: -5,
     variance_reason: 'damaged',
     notes: 'Damaged during transport - 1 bag broken',
     created_at: timestamp,
     created_by: user_id
   }
   ```

2. Audit log entry:
   - event_type: 'grn_variance'
   - severity: 'warning' (if |variance| > 5%) OR 'info' (if < 5%)

3. Dashboard notification:
   - If variance > threshold (e.g., 10%), notify warehouse manager

### TO Status Updates

**After GRN completion**:

```typescript
// Calculate if all lines fully received
const allLinesReceived = to_lines.every(line =>
  line.received_qty >= line.requested_qty
);

// Calculate if any line partially received
const anyLinePartiallyReceived = to_lines.some(line =>
  line.received_qty > 0 && line.received_qty < line.requested_qty
);

// Update TO status
if (allLinesReceived) {
  to.status = 'received';
  to.actual_receive_date = receipt_date;
} else if (anyLinePartiallyReceived) {
  to.status = 'partially_received';
}
```

### LP Creation Rules

**Per GRN line**:

1. Create single LP per line (consolidation):
   ```sql
   {
     lp_number: 'LP-20241220-001' (auto-generated),
     product_id: product_id,
     quantity: received_qty,
     uom: uom,
     location_id: selected_location_id,
     warehouse_id: receiving_warehouse_id,
     status: 'available',
     qa_status: default_qa_status (from settings),
     grn_id: grn_id,
     created_at: receipt_date,
     created_by: received_by_user_id
   }
   ```

2. If `enable_batch_tracking` and source LP has batch:
   - Copy batch_number from source LP to new LP

3. If `enable_expiry_tracking` and source LP has expiry:
   - Copy expiry_date from source LP to new LP

---

## Permissions

| Role | Access | Notes |
|------|--------|-------|
| Admin | Full access | Can receive from any TO |
| Warehouse Manager | Full access | Can receive from any TO |
| Warehouse Staff | Restricted | Can only receive from TOs for assigned warehouse |
| Viewer | No access | Cannot create GRNs |

**RLS Policy**:
```sql
-- User must have 'warehouse_receive' permission
-- OR be assigned to destination warehouse
SELECT * FROM transfer_orders
WHERE org_id = current_org_id()
  AND status IN ('shipped', 'partially_shipped')
  AND (
    has_permission('warehouse_receive')
    OR to_warehouse_id IN (SELECT warehouse_id FROM user_warehouse_assignments WHERE user_id = current_user_id())
  )
```

---

## Accessibility

### Touch Targets
- All buttons: 48x48dp minimum
- Checkboxes: 48x48dp touch area
- Dropdown triggers: 48dp height
- Input fields: 48dp height

### Contrast
- Form labels: 4.5:1
- Input text: 4.5:1
- Error messages: 4.5:1 (red text on white)
- Warning indicators: 3:1 (yellow background)

### Screen Reader
- Modal title: "Receive from Transfer Order TO-2024-00042"
- Form fields: Proper label associations
- Lines table: th/td with scope attributes
- Variance warnings: aria-live="polite" announcements
- Success modal: "GRN created successfully. GRN number GRN-2024-00876. 2 license plates created."

### Keyboard Navigation
- Tab: Navigate between fields
- Enter: Submit form (when Complete Receipt focused)
- Escape: Close modal (with confirmation if form dirty)
- Arrow keys: Navigate dropdown options
- Space: Toggle checkboxes

### Error Announcements
- Field validation errors: aria-describedby with error message
- Form-level errors: Announce count "3 validation errors found"
- Success: Announce "Receipt completed successfully"

---

## Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| Desktop (>1024px) | Full modal width 1000px, side-by-side columns in header |
| Tablet (768-1024px) | Modal width 90%, stacked columns, condensed table |
| Mobile (<768px) | Full-screen modal, card-based lines, collapsible sections |

---

## Form Validation

### Client-Side Validation (Real-time)

| Field | Rule | Error Message |
|-------|------|---------------|
| receipt_date | Not null, not future | "Receipt date cannot be in the future" |
| receipt_date | >= TO.actual_ship_date | "Receipt date cannot be before ship date (Dec 18, 2024)" |
| lines (selected) | At least 1 checked | "Please select at least one item to receive" |
| receive_now | > 0 (if line checked) | "Received quantity must be greater than 0" |
| location | Not null (if line checked) | "Location is required" |
| variance_reason | Not null if variance exists | "Variance reason is required when received qty differs from shipped qty" |

### Server-Side Validation

| Rule | HTTP Code | Error Response |
|------|-----------|----------------|
| TO not found | 404 | `{ error: "TO_NOT_FOUND", message: "..." }` |
| TO status invalid | 400 | `{ error: "INVALID_STATUS", message: "TO must be shipped or partially shipped" }` |
| Warehouse mismatch | 400 | `{ error: "WAREHOUSE_MISMATCH", message: "..." }` |
| Line not in TO | 400 | `{ error: "INVALID_LINE", message: "..." }` |
| Location inactive | 400 | `{ error: "LOCATION_INACTIVE", message: "..." }` |
| Variance reason missing | 400 | `{ error: "VARIANCE_REASON_REQUIRED", message: "..." }` |

---

## Performance Notes

### Data Loading
- TO detail query: Single query with JOINs (to_lines, products, warehouses, locations)
- Load time target: <300ms
- Cache: `org:{orgId}:to:{toId}:receipt-detail` (30s TTL)

### Form Submission
- API call target: <500ms
- Transaction: Create GRN + LPs + Update TO in single DB transaction
- Rollback: On any error, rollback entire transaction

### Caching Strategy
```typescript
'org:{orgId}:grn:available-tos'       // 1 min TTL
'org:{orgId}:to:{toId}:receipt-detail' // 30 sec TTL
'org:{orgId}:locations:active'        // 5 min TTL
```

---

## Testing Requirements

### Unit Tests
- Variance detection logic (received_qty vs shipped_qty)
- Summary calculations (total to receive, LP count)
- TO status determination after receipt
- Form validation rules

### Integration Tests
- `POST /api/warehouse/grn/from-to` with valid data
- `POST /api/warehouse/grn/from-to` with variance
- `POST /api/warehouse/grn/from-to` with invalid TO
- `GET /api/warehouse/grn/from-to/available-tos` filtering
- `GET /api/planning/transfer-orders/:id/receipt-detail`
- RLS enforcement (can only receive from accessible TOs)

### E2E Tests
1. **Happy Path**:
   - Open GRN from TO modal with pre-selected TO
   - Verify TO info loads correctly
   - Modify receive quantity for line 1
   - Select location for line 1
   - Check line 1 for receipt
   - Click Complete Receipt
   - Verify success modal with GRN number and LP numbers
   - Verify TO status updated to 'partially_received'

2. **Variance Handling**:
   - Open modal with TO
   - Enter received_qty < shipped_qty for line 1
   - Verify variance warning appears
   - Attempt submit without variance_reason → Error
   - Select variance_reason "damaged"
   - Submit successfully
   - Verify variance logged

3. **Transit Location**:
   - Enable transit_location in settings
   - Ship TO (LPs move to transit location)
   - Open GRN modal
   - Complete receipt
   - Verify LPs moved from transit to destination location
   - Verify stock_move record created

4. **Validation Errors**:
   - Attempt submit with no lines checked → Error
   - Attempt submit with receive_qty = 0 → Error
   - Attempt submit with missing location → Error
   - Verify error messages displayed correctly

5. **Mobile Responsive**:
   - Open modal on mobile viewport (<768px)
   - Verify stacked layout
   - Verify touch targets >= 48dp
   - Complete receipt on mobile

---

## Quality Gates

Before handoff to FRONTEND-DEV:
- [x] All 4 states defined (Loading, Success, Error, Empty)
- [x] API endpoints fully documented (POST /grn/from-to, GET /available-tos, GET /receipt-detail)
- [x] Variance handling logic specified
- [x] Transit location handling documented
- [x] Form validation rules complete
- [x] Accessibility requirements met (WCAG 2.1 AA)
- [x] Responsive design documented
- [x] Business rules clear (TO status updates, LP creation, variance logging)
- [x] Testing requirements comprehensive
- [x] Permissions and RLS documented

---

## Handoff to FRONTEND-DEV

```yaml
feature: GRN from Transfer Order Modal
story: WH-005
fr_coverage: WH-FR-004 (GRN from TO), WH-FR-001 (LP Creation), WH-FR-002 (LP Tracking)
approval_status:
  mode: "review_each"
  user_approved: false  # PENDING USER REVIEW
deliverables:
  wireframe: docs/3-ARCHITECTURE/ux/wireframes/WH-005-grn-from-to-modal.md
  api_endpoints:
    - POST /api/warehouse/grn/from-to
    - GET /api/warehouse/grn/from-to/available-tos
    - GET /api/planning/transfer-orders/:id/receipt-detail
states_per_screen: [loading, success, error, empty]
key_features:
  - TO selection (pre-selected or dropdown)
  - Multi-line receipt with variance handling
  - Transit location support (conditional)
  - Real-time variance detection
  - Location assignment per line
  - Success confirmation with LP details
breakpoints:
  mobile: "<768px"
  tablet: "768-1024px"
  desktop: ">1024px"
accessibility:
  touch_targets: "48dp minimum"
  contrast: "4.5:1 minimum"
  screen_reader: "Full support with aria labels"
related_screens:
  - PLAN-012: TO Detail Page (launch point)
  - WH-003: GRN from PO Modal (similar pattern)
  - Warehouse Dashboard (GRN list)
database_tables:
  - grns (create record)
  - grn_items (create records)
  - license_plates (create records)
  - transfer_orders (update status)
  - to_lines (update received_qty)
  - stock_moves (if transit_location enabled)
  - grn_variances (if variance exists)
complexity: High (variance handling, transit location, multi-line receipt)
estimated_effort: 12-14 hours
quality_target: 95/100
```

---

**Status**: Ready for User Review
**Approval Mode**: review_each (default)
**User Approved**: Pending
**Iterations**: 0 of 3
**Estimated Effort**: 12-14 hours
**Quality Target**: 95/100
