# PLAN-012: Transfer Order Detail Page

**Module**: Planning
**Feature**: TO Detail View with Shipment History (FR-PLAN-013, FR-PLAN-015, FR-PLAN-016)
**Status**: Ready for Review
**Last Updated**: 2025-12-14

---

## ASCII Wireframe

### Success State (Desktop)

```
+--------------------------------------------------------------------------------------------------+
|  Planning > Transfer Orders > TO-2024-00042                       [Edit] [Actions v] [Print]     |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  +-------------------------------- HEADER INFO -------------------------------------------------+  |
|  |                                                                                              |  |
|  |  TO-2024-00042                                                    Status: [Partially        |  |
|  |  Created by: John Smith on Dec 14, 2024                                   Shipped]         |  |
|  |                                                                   60% shipped               |  |
|  |                                                                                              |  |
|  |  +--------------------+  +--------------------+  +--------------------+  +----------------+  |  |
|  |  | From Warehouse     |  | To Warehouse       |  | Planned Ship       |  | Priority       |  |  |
|  |  | Main Warehouse     |  | Branch-A           |  | Dec 20, 2024       |  | High           |  |  |
|  |  | WH-MAIN            |  | WH-BRANCH-A        |  | In 6 days          |  |                |  |  |
|  |  +--------------------+  +--------------------+  +--------------------+  +----------------+  |  |
|  |                                                                                              |  |
|  |  Planned Receive: Dec 22, 2024 (8 days)         Actual Ship: Dec 18, 2024 (partial)         |  |
|  |                                                                                              |  |
|  |  Notes:                                                                                     |  |
|  |  Priority transfer - load truck #42 on morning shift                                        |  |
|  |                                                                                              |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  +-------------------------------- LINES TAB ---------------------------------------------------+  |
|  |                                                                                              |  |
|  |  [Lines]  [Shipments]  [History]                                                            |  |
|  |  -------                                                                                     |  |
|  |                                                                                              |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |  | # | Product           | Requested | Shipped | Received | Remaining | Status  | LPs    | |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |  | 1 | Flour Type A      | 500 kg    | 500 kg  | 0 kg     | 0 kg      | [100%]  | 2 LPs  | |  |
|  |  |   | RM-FLOUR-001      |           |         |          |           |         | [View] | |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |  | 2 | Sugar White       | 200 kg    | 100 kg  | 0 kg     | 100 kg    | [50%]   | 1 LP   | |  |
|  |  |   | RM-SUGAR-001      |           |         |          |           |         | [View] | |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |  | 3 | Salt Industrial   | 100 kg    | 0 kg    | 0 kg     | 100 kg    | [0%]    | None   | |  |
|  |  |   | RM-SALT-001       |           |         |          |           |         |        | |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |                                                                                              |  |
|  |  3 Lines | Requested: 800 kg | Shipped: 600 kg | Received: 0 kg | Remaining: 200 kg        |  |
|  |                                                                                              |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  Quick Actions:                                                                                   |
|  [Ship Remaining Items]  [Print Packing Slip]  [Track Shipment]                                  |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+

[Actions v] Menu:
  - Edit (if Draft status)
  - Release (if Draft)
  - Ship (if Planned)
  - Receive (if Shipped/Partially Shipped)
  - Cancel TO
  - Duplicate TO
  - Export to PDF
```

### Shipments Tab View

```
+--------------------------------------------------------------------------------------------------+
|  (Header same as above)                                                                           |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  +-------------------------------- SHIPMENTS TAB -----------------------------------------------+  |
|  |                                                                                              |  |
|  |  [Lines]  [Shipments]  [History]                                                            |  |
|  |           ----------                                                                         |  |
|  |                                                                                              |  |
|  |  Shipment Records:                                         [+ Record New Shipment]          |  |
|  |                                                                                              |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |  | Shipment #       | Date         | Shipped By   | Items | Total Qty  | Status   | Action| |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |  | SHIP-2024-00123  | Dec 18, 2024 | Jane Doe     | 2     | 600 kg     | In       | [View]| |  |
|  |  |                  |              |              |       |            | Transit  |       | |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |                                                                                              |  |
|  |  Summary by Product:                                                                        |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |  | Product           | Requested | Shipped | Pending  | Shipment History              | |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |  | Flour Type A      | 500 kg    | 500 kg  | 0 kg     | SHIP-123: 500 kg (Dec 18)     | |  |
|  |  |                   |           |         |          | LPs: LP-12346, LP-12348       | |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |  | Sugar White       | 200 kg    | 100 kg  | 100 kg   | SHIP-123: 100 kg (Dec 18)     | |  |
|  |  |                   |           |         |          | LP: LP-12401                  | |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |  | Salt Industrial   | 100 kg    | 0 kg    | 100 kg   | No shipments yet              | |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |                                                                                              |  |
|  |  Overall Progress: [========================--------] 75% (600 of 800 kg)                  |  |
|  |                                                                                              |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

### History Tab View

```
+--------------------------------------------------------------------------------------------------+
|  (Header same as above)                                                                           |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  +-------------------------------- HISTORY TAB -------------------------------------------------+  |
|  |                                                                                              |  |
|  |  [Lines]  [Shipments]  [History]                                                            |  |
|  |                        --------                                                              |  |
|  |                                                                                              |  |
|  |  Timeline:                                                    Filter: [All Events v]        |  |
|  |                                                                                              |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |  |                                                                                        | |  |
|  |  |  Dec 18, 2024 - 09:30 AM                                                              | |  |
|  |  |  o  Partial Shipment - SHIP-2024-00123                       Jane Doe                | |  |
|  |  |     Shipped: Flour Type A (500 kg), Sugar White (100 kg)                             | |  |
|  |  |     [View Shipment Details]                                                           | |  |
|  |  |  |                                                                                    | |  |
|  |  |  Dec 16, 2024 - 02:15 PM                                                              | |  |
|  |  |  o  Status Changed: Draft -> Planned                             John Smith          | |  |
|  |  |     TO released for warehouse processing                                              | |  |
|  |  |  |                                                                                    | |  |
|  |  |  Dec 14, 2024 - 11:00 AM                                                              | |  |
|  |  |  o  Line Added: Salt Industrial (100 kg)                         John Smith          | |  |
|  |  |  |                                                                                    | |  |
|  |  |  Dec 14, 2024 - 10:45 AM                                                              | |  |
|  |  |  o  Line Added: Sugar White (200 kg)                             John Smith          | |  |
|  |  |     LP selected: LP-12401                                                             | |  |
|  |  |  |                                                                                    | |  |
|  |  |  Dec 14, 2024 - 10:30 AM                                                              | |  |
|  |  |  o  Line Added: Flour Type A (500 kg)                            John Smith          | |  |
|  |  |     LPs selected: LP-12346 (300 kg), LP-12348 (200 kg)                               | |  |
|  |  |  |                                                                                    | |  |
|  |  |  Dec 14, 2024 - 10:00 AM                                                              | |  |
|  |  |  o  TO Created                                                   John Smith          | |  |
|  |  |     From: Main Warehouse | To: Branch-A | Planned: Dec 20, 2024                        | |  |
|  |  |                                                                                        | |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |                                                                                              |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

### Mobile View (<768px)

```
+----------------------------------+
|  < TO-2024-00042                 |
|  [Actions v]                     |
+----------------------------------+
|                                  |
|  Status: [Partially Shipped]     |
|  60% shipped                     |
|                                  |
|  +----------------------------+  |
|  | From Warehouse             |  |
|  | Main Warehouse             |  |
|  +----------------------------+  |
|  | To Warehouse               |  |
|  | Branch-A                   |  |
|  +----------------------------+  |
|  | Planned Ship               |  |
|  | Dec 20, 2024 (6 days)      |  |
|  +----------------------------+  |
|  | Priority                   |  |
|  | High                       |  |
|  +----------------------------+  |
|                                  |
|  [Lines] [Shipments] [History]   |
|  ------                          |
|                                  |
|  +----------------------------+  |
|  | 1. Flour Type A            |  |
|  | Requested: 500 kg          |  |
|  | Shipped: 500 kg [100%]     |  |
|  | LPs: 2 selected [View]     |  |
|  +----------------------------+  |
|  | 2. Sugar White             |  |
|  | Requested: 200 kg          |  |
|  | Shipped: 100 kg [50%]      |  |
|  | LPs: 1 selected [View]     |  |
|  +----------------------------+  |
|  | 3. Salt Industrial         |  |
|  | Requested: 100 kg          |  |
|  | Shipped: 0 kg [0%]         |  |
|  | LPs: None                  |  |
|  +----------------------------+  |
|                                  |
|  Total: 600/800 kg (75%)         |
|                                  |
|  +----------------------------+  |
|  | [Ship Remaining]           |  |
|  +----------------------------+  |
|                                  |
+----------------------------------+
```

### Loading State

```
+--------------------------------------------------------------------------------------------------+
|  Planning > Transfer Orders > ...                                                        [Print] |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  +-------------------------------- HEADER INFO -------------------------------------------------+  |
|  |                                                                                              |  |
|  |  [=====================================]                    Status: [=========]              |  |
|  |  [===================]                                                                       |  |
|  |                                                                                              |  |
|  |  [===============]  [===============]  [===============]  [===============]                 |  |
|  |  [=======]         [=======]         [=======]         [=======]                           |  |
|  |                                                                                              |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  +-------------------------------- LINES -------------------------------------------------------+  |
|  |                                                                                              |  |
|  |  [==================================================================================]       |  |
|  |  [==================================================================================]       |  |
|  |  [==================================================================================]       |  |
|  |                                                                                              |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  Loading transfer order details...                                                                |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

### Error State

```
+--------------------------------------------------------------------------------------------------+
|  Planning > Transfer Orders > Error                                                              |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|                                                                                                    |
|                                      +------------------+                                          |
|                                      |   [Error Icon]   |                                          |
|                                      +------------------+                                          |
|                                                                                                    |
|                              Failed to Load Transfer Order                                        |
|                                                                                                    |
|                     The transfer order could not be found or you don't                            |
|                     have permission to view it.                                                   |
|                                                                                                    |
|                              Error: TO_NOT_FOUND                                                  |
|                                                                                                    |
|                                                                                                    |
|                       [Go Back to TO List]    [Contact Support]                                   |
|                                                                                                    |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

---

## Key Components

### 1. Header Info Section

| Field | Source | Display |
|-------|--------|---------|
| to_number | transfer_orders.to_number | "TO-2024-00042" |
| status | transfer_orders.status | Badge with color |
| shipped_percent | Calculated | "60% shipped" progress indicator |
| created_by | users.name via created_by | "John Smith" |
| created_at | transfer_orders.created_at | "Dec 14, 2024" |
| from_warehouse_name | warehouses.name | "Main Warehouse" |
| from_warehouse_code | warehouses.code | "WH-MAIN" |
| to_warehouse_name | warehouses.name | "Branch-A" |
| to_warehouse_code | warehouses.code | "WH-BRANCH-A" |
| planned_ship_date | transfer_orders.planned_ship_date | "Dec 20, 2024" + relative time |
| planned_receive_date | transfer_orders.planned_receive_date | "Dec 22, 2024" |
| actual_ship_date | transfer_orders.actual_ship_date | "Dec 18, 2024 (partial)" |
| priority | transfer_orders.priority | "High" |
| notes | transfer_orders.notes | User-entered notes |

### 2. Tab Navigation

| Tab | Content | Visible When |
|-----|---------|--------------|
| **Lines** | Line items with requested/shipped/received qty | Always (default) |
| **Shipments** | Shipment records and LP details | Status in (Shipped, Partially Shipped, Received, Closed) |
| **History** | Timeline of all status changes, shipments | Always |

### 3. Lines Table Columns

| Column | Width | Description |
|--------|-------|-------------|
| # | 40px | Line number |
| Product | 200px | Name + code |
| Requested | 100px | Requested quantity + UoM |
| Shipped | 100px | Shipped quantity + UoM |
| Received | 100px | Received quantity + UoM |
| Remaining | 100px | Outstanding quantity |
| Status | 80px | [100%], [50%], [0%] indicator |
| LPs | 100px | LP count + View link |

### 4. Line Status Indicators

| Indicator | Condition | Color |
|-----------|-----------|-------|
| [100%] | shipped_qty = requested_qty | Green |
| [XX%] | shipped_qty > 0 AND shipped_qty < requested_qty | Yellow |
| [0%] | shipped_qty = 0 | Gray |

### 5. Shipment Progress

| Field | Calculation | Display |
|-------|-------------|---------|
| Shipped Percent | (total_shipped_qty / total_requested_qty) * 100 | "60% shipped" |
| Overall Progress | Visual progress bar | [========================--------] 75% |

---

## Main Actions

### Header Actions (Status-Dependent)

| Action | Visible When | Result |
|--------|--------------|--------|
| **Edit** | status = Draft | Opens PLAN-011 Edit modal |
| **Release** | status = Draft | Transitions to Planned |
| **Ship** | status = Planned | Opens Ship TO modal (warehouse) |
| **Receive** | status IN (Shipped, Partially Shipped) | Opens Receive TO modal (warehouse) |
| **Cancel TO** | status NOT IN (Received, Closed) | Cancel with confirmation |
| **Duplicate TO** | Always | Creates copy as Draft |
| **Export to PDF** | Always | Downloads PDF |
| **Print** | Always | Opens print dialog |

### Quick Actions (Bottom of Page)

| Action | Visible When | Result |
|--------|--------------|--------|
| **Ship Remaining Items** | status IN (Planned, Partially Shipped) | Navigate to warehouse ship page |
| **Print Packing Slip** | status IN (Planned, Shipped, Partially Shipped) | Print packing slip PDF |
| **Track Shipment** | status IN (Shipped, Partially Shipped) | View shipment tracking |

---

## States

| State | Description | Elements Shown |
|-------|-------------|----------------|
| **Loading** | Initial page load | Skeleton for header, lines, tabs |
| **Success** | TO loaded | Full detail view with all sections |
| **Error** | TO not found or no access | Error message, back button |

---

## API Endpoints

### Get TO Detail

```
GET /api/planning/transfer-orders/:id

Response:
{
  "success": true,
  "data": {
    "id": "uuid-to-42",
    "to_number": "TO-2024-00042",
    "status": "partially_shipped",
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
    "planned_ship_date": "2024-12-20",
    "planned_receive_date": "2024-12-22",
    "actual_ship_date": "2024-12-18",
    "actual_receive_date": null,
    "priority": "high",
    "notes": "Priority transfer - load truck #42",
    "total_requested": 800,
    "total_shipped": 600,
    "total_received": 0,
    "shipped_percent": 75,
    "lines": [
      {
        "id": "uuid-line-1",
        "line_number": 1,
        "product": {
          "id": "uuid-flour",
          "code": "RM-FLOUR-001",
          "name": "Flour Type A"
        },
        "requested_qty": 500,
        "shipped_qty": 500,
        "received_qty": 0,
        "remaining_qty": 0,
        "uom": "kg",
        "status": "complete",
        "lp_count": 2
      },
      {
        "id": "uuid-line-2",
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
        "status": "partial",
        "lp_count": 1
      },
      {
        "id": "uuid-line-3",
        "line_number": 3,
        "product": {
          "id": "uuid-salt",
          "code": "RM-SALT-001",
          "name": "Salt Industrial"
        },
        "requested_qty": 100,
        "shipped_qty": 0,
        "received_qty": 0,
        "remaining_qty": 100,
        "uom": "kg",
        "status": "pending",
        "lp_count": 0
      }
    ],
    "created_by": {
      "id": "uuid-user-1",
      "name": "John Smith"
    },
    "created_at": "2024-12-14T10:00:00Z",
    "updated_at": "2024-12-18T09:30:00Z"
  }
}
```

### Get TO Shipments

```
GET /api/planning/transfer-orders/:id/shipments

Response:
{
  "success": true,
  "data": {
    "shipments": [
      {
        "id": "uuid-ship-123",
        "shipment_number": "SHIP-2024-00123",
        "ship_date": "2024-12-18",
        "shipped_by": { "id": "uuid-user-3", "name": "Jane Doe" },
        "items_count": 2,
        "total_qty": 600,
        "status": "in_transit"
      }
    ],
    "summary": [
      {
        "product_id": "uuid-flour",
        "product_name": "Flour Type A",
        "requested_qty": 500,
        "shipped_qty": 500,
        "pending_qty": 0,
        "shipment_history": [
          {
            "shipment_number": "SHIP-2024-00123",
            "qty": 500,
            "date": "2024-12-18",
            "lps": ["LP-2024-12346", "LP-2024-12348"]
          }
        ]
      },
      {
        "product_id": "uuid-sugar",
        "product_name": "Sugar White",
        "requested_qty": 200,
        "shipped_qty": 100,
        "pending_qty": 100,
        "shipment_history": [
          {
            "shipment_number": "SHIP-2024-00123",
            "qty": 100,
            "date": "2024-12-18",
            "lps": ["LP-2024-12401"]
          }
        ]
      },
      {
        "product_id": "uuid-salt",
        "product_name": "Salt Industrial",
        "requested_qty": 100,
        "shipped_qty": 0,
        "pending_qty": 100,
        "shipment_history": []
      }
    ],
    "overall_progress": {
      "percent": 75,
      "total_requested": 800,
      "total_shipped": 600,
      "uom": "kg"
    }
  }
}
```

### Get TO History

```
GET /api/planning/transfer-orders/:id/history

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid-hist-1",
      "event_type": "shipment_created",
      "event_date": "2024-12-18T09:30:00Z",
      "user": { "id": "uuid-user-3", "name": "Jane Doe" },
      "details": {
        "shipment_id": "uuid-ship-123",
        "shipment_number": "SHIP-2024-00123",
        "items_shipped": [
          { "product": "Flour Type A", "quantity": 500 },
          { "product": "Sugar White", "quantity": 100 }
        ]
      }
    },
    {
      "id": "uuid-hist-2",
      "event_type": "status_change",
      "event_date": "2024-12-16T14:15:00Z",
      "user": { "id": "uuid-user-1", "name": "John Smith" },
      "details": {
        "from_status": "draft",
        "to_status": "planned",
        "reason": "TO released for warehouse processing"
      }
    },
    // ... more history events
  ]
}
```

### Get Line LPs

```
GET /api/planning/transfer-orders/:id/lines/:lineId/lps

Response:
{
  "success": true,
  "data": [
    {
      "lp_id": "uuid-lp-12346",
      "lp_number": "LP-2024-12346",
      "quantity": 300,
      "lot_number": "L-002",
      "expiry_date": "2025-03-13",
      "shipped": true,
      "shipment_number": "SHIP-2024-00123"
    },
    {
      "lp_id": "uuid-lp-12348",
      "lp_number": "LP-2024-12348",
      "quantity": 200,
      "lot_number": "L-004",
      "expiry_date": "2025-03-15",
      "shipped": true,
      "shipment_number": "SHIP-2024-00123"
    }
  ]
}
```

---

## Permissions

| Role | View Detail | Edit | Ship | Receive | Cancel | Print/Export |
|------|-------------|------|------|---------|--------|--------------|
| Admin | Yes | Yes (Draft) | Yes | Yes | Yes | Yes |
| Warehouse Manager | Yes | Yes (Draft) | Yes | Yes | Yes | Yes |
| Warehouse Staff | Yes | No | Yes | Yes | No | Yes |
| Viewer | Yes | No | No | No | No | Yes |

---

## Business Rules

### Status-Based UI Rules

| Status | Edit Button | Action Menu Items |
|--------|-------------|-------------------|
| Draft | Visible | Release, Duplicate, Cancel, Print |
| Planned | Hidden | Ship, Duplicate, Cancel, Print |
| Partially Shipped | Hidden | Ship Remaining, Duplicate, Print |
| Shipped | Hidden | Receive, Duplicate, Print |
| Received | Hidden | Duplicate, Print |
| Closed | Hidden | Duplicate, Print |
| Cancelled | Hidden | Duplicate, Print |

### Shipments Tab Visibility

- Only visible when status IN ('shipped', 'partially_shipped', 'received', 'closed')
- Shows link to create new shipment when status IN ('planned', 'partially_shipped')
- "Create Shipment" button disabled when all lines fully shipped

### History Events Logged

| Event | Trigger | Details Captured |
|-------|---------|------------------|
| to_created | POST /transfer-orders | from/to warehouses, planned dates, lines_count |
| line_added | POST /transfer-orders/:id/lines | product, quantity |
| line_updated | PUT /transfer-orders/:id/lines/:lineId | changed fields |
| line_deleted | DELETE /transfer-orders/:id/lines/:lineId | product that was removed |
| to_released | Status change to planned | - |
| status_change | Any status transition | from_status, to_status, reason |
| shipment_created | Warehouse module creates shipment | shipment_number, items_shipped |
| receipt_created | Warehouse module creates receipt | receipt_number, items_received |

---

## Accessibility

### Touch Targets
- All buttons: 48x48dp minimum
- Tab navigation items: 48dp height
- History timeline events: 64dp minimum row height

### Contrast
- Header info text: 4.5:1
- Status badges: WCAG AA compliant
- Table text: 4.5:1

### Screen Reader
- Page title: "Transfer Order TO-2024-00042 Detail"
- Status: "Status: Partially Shipped, 60 percent shipped"
- Lines table: Proper th/td structure with scope
- History timeline: "Timeline of transfer order events, 6 events"

### Keyboard Navigation
- Tab: Navigate between sections, tabs, action buttons
- Enter: Activate buttons, navigate links
- Arrow keys: Navigate within tabs

---

## Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| Desktop (>1024px) | Full layout with sidebar info cards |
| Tablet (768-1024px) | Stacked info cards, condensed table |
| Mobile (<768px) | Full stack, card-based lines, collapsible sections |

---

## Performance Notes

### Data Loading
- Header + Lines: Single query with JOINs
- Shipments: Lazy load on tab click
- History: Lazy load on tab click

### Caching
```typescript
'org:{orgId}:to:{toId}:detail'      // 30 sec TTL (refresh on action)
'org:{orgId}:to:{toId}:shipments'   // 30 sec TTL
'org:{orgId}:to:{toId}:history'     // 1 min TTL
```

### Load Time Targets
- Initial page (header + lines): <500ms
- Tab switch (shipments): <300ms
- Tab switch (history): <300ms

---

## Testing Requirements

### Unit Tests
- Shipped percent calculation
- Line status determination (complete, partial, pending)
- Action button visibility by status

### Integration Tests
- GET /api/planning/transfer-orders/:id
- GET /api/planning/transfer-orders/:id/shipments
- GET /api/planning/transfer-orders/:id/history
- GET /api/planning/transfer-orders/:id/lines/:lineId/lps
- RLS enforcement

### E2E Tests
- View TO detail page loads all sections
- Tab navigation works (Lines, Shipments, History)
- Edit button opens modal (Draft TO)
- Ship button navigates to warehouse (Planned TO)
- Print action downloads PDF
- Mobile responsive layout
- View line LPs displays LP list

---

## Quality Gates

Before handoff to FRONTEND-DEV:
- [x] All states defined (Loading, Success, Error)
- [x] All tabs specified (Lines, Shipments, History)
- [x] API endpoints documented
- [x] Status-based action visibility defined
- [x] Accessibility requirements met
- [x] Responsive design documented
- [x] History events listed
- [x] LP tracking integration specified

---

## Handoff to FRONTEND-DEV

```yaml
feature: TO Detail Page
story: PLAN-012
fr_coverage: FR-PLAN-013, FR-PLAN-015, FR-PLAN-016
approval_status:
  mode: "review_each"
  user_approved: false  # PENDING USER REVIEW
deliverables:
  wireframe: docs/3-ARCHITECTURE/ux/wireframes/PLAN-012-transfer-order-detail.md
  api_endpoints:
    - GET /api/planning/transfer-orders/:id
    - GET /api/planning/transfer-orders/:id/shipments
    - GET /api/planning/transfer-orders/:id/history
    - GET /api/planning/transfer-orders/:id/lines/:lineId/lps
states_per_screen: [loading, success, error]
tabs: [lines, shipments, history]
breakpoints:
  mobile: "<768px"
  tablet: "768-1024px"
  desktop: ">1024px"
accessibility:
  touch_targets: "48dp minimum"
  contrast: "4.5:1 minimum"
related_screens:
  - PLAN-010: TO List Page
  - PLAN-011: TO Create/Edit Modal
  - Warehouse Ship/Receive Pages (cross-module)
```

---

**Status**: Ready for User Review
**Approval Mode**: review_each (default)
**User Approved**: Pending
**Iterations**: 0 of 3
**Estimated Effort**: 8-10 hours
**Quality Target**: 97/100
