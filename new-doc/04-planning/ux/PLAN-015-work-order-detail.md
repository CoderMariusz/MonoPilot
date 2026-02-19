# PLAN-015: Work Order Detail Page

**Module**: Planning
**Feature**: WO Detail View with Materials & Operations (FR-PLAN-022, FR-PLAN-025)
**Status**: Ready for Review
**Last Updated**: 2025-12-14

---

## ASCII Wireframe

### Success State (Desktop)

```
+--------------------------------------------------------------------------------------------------+
|  Planning > Work Orders > WO-2024-00156                           [Edit] [Actions v] [Print]     |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  +-------------------------------- HEADER INFO -------------------------------------------------+  |
|  |                                                                                              |  |
|  |  WO-2024-00156                                                    Status: [In Progress]     |  |
|  |  Created by: John Smith on Dec 14, 2024                           65% complete             |  |
|  |                                                                                              |  |
|  |  +--------------------+  +--------------------+  +--------------------+  +----------------+  |  |
|  |  | Product            |  | Quantity           |  | Scheduled          |  | Priority       |  |  |
|  |  | Chocolate Bar      |  | 1,000 pc           |  | Dec 20, 2024       |  | Normal         |  |  |
|  |  | FG-CHOC-001        |  | Actual: 650 pc     |  | Started: Dec 19    |  |                |  |  |
|  |  |                    |  | Yield: 65%         |  | Est. end: 14:00    |  |                |  |  |
|  |  +--------------------+  +--------------------+  +--------------------+  +----------------+  |  |
|  |                                                                                              |  |
|  |  Production Line: Packing #1           Machine: None                                        |  |
|  |  BOM: v1.2 (Standard Recipe) [SNAPSHOT - Locked after release]                             |  |
|  |  Routing: Standard Production (5 ops)                                                       |  |
|  |                                                                                              |  |
|  |  Notes:                                                                                     |  |
|  |  Customer order #4567 - use organic cocoa if available                                      |  |
|  |                                                                                              |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  +-------------------------------- MATERIALS TAB -----------------------------------------------+  |
|  |                                                                                              |  |
|  |  [Materials]  [Operations]  [Output]  [History]                                             |  |
|  |  -----------                                                                                 |  |
|  |                                                                                              |  |
|  |  Materials Required (BOM Snapshot v1.2 - Immutable)                                         |  |
|  |                                                                                              |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |  | # | Material          | Required | Reserved | Consumed | Remaining | Status   | Action| |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |  | 1 | Cocoa Mass        | 250 kg   | 250 kg   | 162 kg   | 88 kg     | [65%]    | [Res] | |  |
|  |  |   | RM-COCOA-001      |          | 3 LPs    |          |           |          | [View]| |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |  | 2 | Sugar Fine        | 150 kg   | 150 kg   | 97 kg    | 53 kg     | [65%]    | [Res] | |  |
|  |  |   | RM-SUGAR-001      |          | 2 LPs    |          |           |          | [View]| |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |  | 3 | Milk Powder       | 100 kg   | 100 kg   | 65 kg    | 35 kg     | [65%]    | [Res] | |  |
|  |  |   | RM-MILK-001       |          | 1 LP     |          |           | (low)    | [View]| |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |  | 4 | Aluminum Foil     | 500 m    | 500 m    | 325 m    | 175 m     | [65%]    | [Res] | |  |
|  |  |   | PKG-FOIL-001      |          | 5 LPs    |          |           |          | [View]| |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |  | 5 | Cocoa Butter      | -        | -        | -        | -         | By-Prod  | -     | |  |
|  |  |   | BY-BUTTER-001     |          |          |          | (13 kg)   | 2%       |       | |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |                                                                                              |  |
|  |  5 Materials | Required: 1,000 kg | Reserved: 1,000 kg | Consumed: 649 kg (65%)            |  |
|  |                                                                                              |  |
|  |  [!] Milk Powder reservation low - 35 kg remaining may not be sufficient                    |  |
|  |                                                                                              |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  Quick Actions:                                                                                   |
|  [Reserve Materials]  [Consume Batch]  [Print Material List]                                     |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+

[Actions v] Menu:
  - Edit (if Draft status)
  - Release (if Planned)
  - Start (if Released)
  - Pause (if In Progress)
  - Resume (if On Hold)
  - Complete (if In Progress)
  - Cancel WO
  - Duplicate WO
  - Export to PDF
```

### Operations Tab View

```
+--------------------------------------------------------------------------------------------------+
|  (Header same as above)                                                                           |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  +-------------------------------- OPERATIONS TAB -----------------------------------------------+  |
|  |                                                                                              |  |
|  |  [Materials]  [Operations]  [Output]  [History]                                             |  |
|  |               -----------                                                                    |  |
|  |                                                                                              |  |
|  |  Operations Progress: 3 of 5 completed (60%) [Routing Snapshot - locked after release]     |  |
|  |                                                                                              |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |  | Seq | Operation         | Status      | Duration   | Yield    | Started By | Action  | |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |  | 1   | Mixing            | [Completed] | 2h (2h)    | 98%      | Jane Doe   | [View]  | |  |
|  |  |     | Machine: Mixer #1 |             | Actual:    | (Exp:98%)| Dec 19     |         | |  |
|  |  |     |                   |             | 2h 5m      |          | 08:00      |         | |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |  | 2   | Tempering         | [Completed] | 1h (1h)    | 99%      | Jane Doe   | [View]  | |  |
|  |  |     | Machine: Temper#1 |             | Actual:    | (Exp:99%)| Dec 19     |         | |  |
|  |  |     |                   |             | 58m        |          | 10:05      |         | |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |  | 3   | Molding           | [Completed] | 3h (3h)    | 97%      | John Doe   | [View]  | |  |
|  |  |     | Machine: Mold #2  |             | Actual:    | (Exp:98%)| Dec 19     |         | |  |
|  |  |     |                   |             | 3h 10m     |          | 11:00      |         | |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |  | 4   | Cooling           | [In         | 1.5h       | -        | -          | [Start] | |  |
|  |  |     | Line: Cooling     |  Progress]  | Started:   | -        | -          | [Comp.] | |  |
|  |  |     | Tunnel            |             | 14:10      |          |            |         | |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |  | 5   | Packing           | [Not        | 0.5h       | -        | -          | [Start] | |  |
|  |  |     | Line: Packing #1  |  Started]   | Est: 30m   | -        | -          |         | |  |
|  |  |     |                   |             |            |          |            |         | |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |                                                                                              |  |
|  |  Total Time: 8h planned | 5h 13m elapsed | 2h 30m remaining                                 |  |
|  |                                                                                              |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

### Output Tab View

```
+--------------------------------------------------------------------------------------------------+
|  (Header same as above)                                                                           |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  +-------------------------------- OUTPUT TAB ---------------------------------------------------+  |
|  |                                                                                              |  |
|  |  [Materials]  [Operations]  [Output]  [History]                                             |  |
|  |                             -------                                                          |  |
|  |                                                                                              |  |
|  |  Production Output:                                                     [+ Record Output]   |  |
|  |                                                                                              |  |
|  |  Planned: 1,000 pc  |  Produced: 650 pc  |  Remaining: 350 pc  |  Yield: 65%                |  |
|  |                                                                                              |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |  | Batch # | Date/Time        | Quantity | Good  | Scrap | Operator    | Location      | |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |  | 1       | Dec 19, 08:30    | 200 pc   | 196 pc| 4 pc  | Jane Doe    | Packing #1    | |  |
|  |  |         |                  |          | 98%   |       | [View]      |               | |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |  | 2       | Dec 19, 10:45    | 250 pc   | 243 pc| 7 pc  | Jane Doe    | Packing #1    | |  |
|  |  |         |                  |          | 97%   |       | [View]      |               | |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |  | 3       | Dec 19, 13:15    | 200 pc   | 195 pc| 5 pc  | John Doe    | Packing #1    | |  |
|  |  |         |                  |          | 97.5% |       | [View]      |               | |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |                                                                                              |  |
|  |  Total Good: 634 pc (97.5%)  |  Total Scrap: 16 pc (2.5%)                                   |  |
|  |                                                                                              |  |
|  |  By-Product Output:                                                                         |  |
|  |  - Cocoa Butter (BY-BUTTER-001): 13 kg (2% yield)                                           |  |
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
|  |  [Materials]  [Operations]  [Output]  [History]                                             |  |
|  |                                       --------                                               |  |
|  |                                                                                              |  |
|  |  Timeline:                                                    Filter: [All Events v]        |  |
|  |                                                                                              |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |  |                                                                                        | |  |
|  |  |  Dec 19, 2024 - 14:10                                                                 | |  |
|  |  |  o  Operation Started: Cooling                               John Doe                | |  |
|  |  |     Expected duration: 1.5h                                                           | |  |
|  |  |  |                                                                                    | |  |
|  |  |  Dec 19, 2024 - 13:15                                                                 | |  |
|  |  |  o  Output Recorded: Batch #3                                John Doe                | |  |
|  |  |     Quantity: 200 pc (195 good, 5 scrap)                                              | |  |
|  |  |  |                                                                                    | |  |
|  |  |  Dec 19, 2024 - 11:00                                                                 | |  |
|  |  |  o  Operation Completed: Molding                             John Doe                | |  |
|  |  |     Duration: 3h 10m | Yield: 97%                                                    | |  |
|  |  |  |                                                                                    | |  |
|  |  |  Dec 19, 2024 - 10:45                                                                 | |  |
|  |  |  o  Output Recorded: Batch #2                                Jane Doe                | |  |
|  |  |     Quantity: 250 pc (243 good, 7 scrap)                                              | |  |
|  |  |  |                                                                                    | |  |
|  |  |  Dec 19, 2024 - 10:05                                                                 | |  |
|  |  |  o  Operation Completed: Tempering                           Jane Doe                | |  |
|  |  |     Duration: 58m | Yield: 99%                                                        | |  |
|  |  |  |                                                                                    | |  |
|  |  |  Dec 19, 2024 - 08:30                                                                 | |  |
|  |  |  o  Output Recorded: Batch #1                                Jane Doe                | |  |
|  |  |     Quantity: 200 pc (196 good, 4 scrap)                                              | |  |
|  |  |  |                                                                                    | |  |
|  |  |  Dec 19, 2024 - 08:05                                                                 | |  |
|  |  |  o  Operation Completed: Mixing                              Jane Doe                | |  |
|  |  |     Duration: 2h 5m | Yield: 98%                                                     | |  |
|  |  |  |                                                                                    | |  |
|  |  |  Dec 19, 2024 - 08:00                                                                 | |  |
|  |  |  o  WO Started                                               Jane Doe                | |  |
|  |  |     Status: Draft -> In Progress                                                      | |  |
|  |  |  |                                                                                    | |  |
|  |  |  Dec 18, 2024 - 14:00                                                                 | |  |
|  |  |  o  Materials Reserved                                       John Smith              | |  |
|  |  |     4 materials, 11 LPs reserved                                                      | |  |
|  |  |  |                                                                                    | |  |
|  |  |  Dec 16, 2024 - 10:00                                                                 | |  |
|  |  |  o  Status Changed: Draft -> Planned                         John Smith              | |  |
|  |  |     WO planned for production                                                         | |  |
|  |  |  |                                                                                    | |  |
|  |  |  Dec 14, 2024 - 10:00                                                                 | |  |
|  |  |  o  WO Created                                               John Smith              | |  |
|  |  |     Product: Chocolate Bar | Quantity: 1,000 pc | BOM: v1.2                            | |  |
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
|  < WO-2024-00156                 |
|  [Actions v]                     |
+----------------------------------+
|                                  |
|  Status: [In Progress]           |
|  Progress: 65%                   |
|                                  |
|  +----------------------------+  |
|  | Product                    |  |
|  | Chocolate Bar              |  |
|  | FG-CHOC-001                |  |
|  +----------------------------+  |
|  | Quantity                   |  |
|  | 1,000 pc                   |  |
|  | Actual: 650 pc (65%)       |  |
|  +----------------------------+  |
|  | Scheduled                  |  |
|  | Dec 20, 2024               |  |
|  | Started: Dec 19            |  |
|  +----------------------------+  |
|  | Line                       |  |
|  | Packing #1                 |  |
|  +----------------------------+  |
|  | BOM: v1.2 [LOCKED]         |  |
|  +----------------------------+  |
|                                  |
|  [Materials] [Ops] [Output]      |
|  -----------                     |
|                                  |
|  +----------------------------+  |
|  | 1. Cocoa Mass              |  |
|  | Required: 250 kg           |  |
|  | Reserved: 250 kg (3 LPs)   |  |
|  | Consumed: 162 kg (65%)     |  |
|  | [Reserve] [View]           |  |
|  +----------------------------+  |
|  | 2. Sugar Fine              |  |
|  | Required: 150 kg           |  |
|  | Reserved: 150 kg (2 LPs)   |  |
|  | Consumed: 97 kg (65%)      |  |
|  | [Reserve] [View]           |  |
|  +----------------------------+  |
|  | 3. Milk Powder             |  |
|  | Required: 100 kg           |  |
|  | Reserved: 100 kg (1 LP)    |  |
|  | Consumed: 65 kg (65%)      |  |
|  | [!] Low remaining          |  |
|  | [Reserve] [View]           |  |
|  +----------------------------+  |
|                                  |
|  [Reserve Materials]             |
|                                  |
+----------------------------------+
```

### Loading State

```
+--------------------------------------------------------------------------------------------------+
|  Planning > Work Orders > ...                                                            [Print] |
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
|  +-------------------------------- MATERIALS -----------------------------------------------+  |
|  |                                                                                              |  |
|  |  [==================================================================================]       |  |
|  |  [==================================================================================]       |  |
|  |  [==================================================================================]       |  |
|  |                                                                                              |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  Loading work order details...                                                                    |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

### Error State

```
+--------------------------------------------------------------------------------------------------+
|  Planning > Work Orders > Error                                                                  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|                                                                                                    |
|                                      +------------------+                                          |
|                                      |   [Error Icon]   |                                          |
|                                      +------------------+                                          |
|                                                                                                    |
|                              Failed to Load Work Order                                            |
|                                                                                                    |
|                     The work order could not be found or you don't                                |
|                     have permission to view it.                                                   |
|                                                                                                    |
|                              Error: WO_NOT_FOUND                                                  |
|                                                                                                    |
|                                                                                                    |
|                       [Go Back to WO List]    [Contact Support]                                   |
|                                                                                                    |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

---

## Key Components

### 1. Header Info Section

| Field | Source | Display |
|-------|--------|---------|
| wo_number | work_orders.wo_number | "WO-2024-00156" |
| status | work_orders.status | Badge with color |
| progress_percent | Calculated | "65% complete" |
| created_by | users.name via created_by | "John Smith" |
| created_at | work_orders.created_at | "Dec 14, 2024" |
| product_name | products.name | "Chocolate Bar" |
| product_code | products.code | "FG-CHOC-001" |
| quantity | work_orders.quantity | "1,000 pc" |
| actual_qty | work_orders.actual_qty | "650 pc" |
| yield_percent | Calculated: (actual_qty / quantity) * 100 | "65%" |
| scheduled_date | work_orders.scheduled_date | "Dec 20, 2024" |
| started_at | work_orders.started_at | "Dec 19" |
| line_name | lines.name via line_id | "Packing #1" |
| machine_name | machines.name via machine_id | "None" |
| bom_version | boms.version | "v1.2 (Standard Recipe)" |
| routing_name | routings.name | "Standard Production (5 ops)" |
| priority | work_orders.priority | "Normal" |
| notes | work_orders.notes | User-entered notes |

### 2. Tab Navigation

| Tab | Content | Visible When |
|-----|---------|--------------|
| **Materials** | wo_materials with reserved/consumed qty | Always (default) |
| **Operations** | wo_operations with status/duration/yield | Routing copied (wo_copy_routing = true) |
| **Output** | Production batches and good/scrap counts | Status in (In Progress, Completed, Closed) |
| **History** | Timeline of all events | Always |

### 3. Materials Table Columns

| Column | Width | Description |
|--------|-------|-------------|
| # | 40px | Material number |
| Material | 200px | Name + code |
| Required | 100px | Required quantity from BOM snapshot |
| Reserved | 100px | Reserved quantity + LP count |
| Consumed | 100px | Actually consumed quantity |
| Remaining | 100px | Reserved - Consumed |
| Status | 80px | Consumption % or By-Product |
| Actions | 100px | Reserve, View reservations |

### 4. Operations Table Columns

| Column | Width | Description |
|--------|-------|-------------|
| Seq | 40px | Operation sequence |
| Operation | 250px | Name + machine/line |
| Status | 120px | Not Started, In Progress, Completed |
| Duration | 120px | Expected vs Actual |
| Yield | 80px | Actual vs Expected % |
| Started By | 120px | Operator + timestamp |
| Actions | 100px | Start, Complete, View |

### 5. Output Table Columns

| Column | Width | Description |
|--------|-------|-------------|
| Batch # | 80px | Output batch number |
| Date/Time | 150px | Production timestamp |
| Quantity | 100px | Total produced in batch |
| Good | 100px | Good quantity + % |
| Scrap | 100px | Scrap quantity |
| Operator | 120px | Who recorded output |
| Location | 120px | Where produced |

---

## Main Actions

### Header Actions (Status-Dependent)

| Action | Visible When | Result |
|--------|--------------|--------|
| **Edit** | status = Draft | Opens PLAN-014 Edit modal |
| **Release** | status = Planned | Transitions to Released |
| **Start** | status = Released | Opens Start WO modal, transitions to In Progress |
| **Pause** | status = In Progress | Opens Pause modal (requires reason), transitions to On Hold |
| **Resume** | status = On Hold | Transitions to In Progress |
| **Complete** | status = In Progress | Opens Complete WO modal, transitions to Completed |
| **Cancel WO** | status NOT IN (Completed, Closed) | Cancel with confirmation |
| **Duplicate WO** | Always | Creates copy as Draft |
| **Export to PDF** | Always | Downloads PDF |
| **Print** | Always | Opens print dialog |

### Quick Actions (Bottom of Page)

| Action | Visible When | Tab | Result |
|--------|--------------|-----|--------|
| **Reserve Materials** | status IN (Planned, Released) | Materials | Opens material reservation modal |
| **Consume Batch** | status = In Progress | Materials | Opens consumption modal |
| **Print Material List** | Always | Materials | Print material pick list |
| **Record Output** | status = In Progress | Output | Opens output recording modal |

---

## States

| State | Description | Elements Shown |
|-------|-------------|----------------|
| **Loading** | Initial page load | Skeleton for header, tabs, table |
| **Success** | WO loaded | Full detail view with all sections |
| **Error** | WO not found or no access | Error message, back button |

---

## API Endpoints

### Get WO Detail

```
GET /api/planning/work-orders/:id

Response:
{
  "success": true,
  "data": {
    "id": "uuid-wo-156",
    "wo_number": "WO-2024-00156",
    "status": "in_progress",
    "product": {
      "id": "uuid-choc",
      "code": "FG-CHOC-001",
      "name": "Chocolate Bar"
    },
    "bom": {
      "id": "uuid-bom-v1.2",
      "version": "v1.2",
      "name": "Standard Recipe"
    },
    "routing": {
      "id": "uuid-routing-std",
      "name": "Standard Production"
    },
    "quantity": 1000,
    "uom": "pc",
    "actual_qty": 650,
    "yield_percent": 65,
    "scheduled_date": "2024-12-20",
    "scheduled_start_time": "08:00",
    "scheduled_end_time": "16:00",
    "started_at": "2024-12-19T08:00:00Z",
    "completed_at": null,
    "line": {
      "id": "uuid-line-pack1",
      "name": "Packing #1"
    },
    "machine": null,
    "priority": "normal",
    "notes": "Customer order #4567 - use organic cocoa if available",
    "source_of_demand": "manual",
    "progress_percent": 65,
    "materials_count": 5,
    "operations_count": 5,
    "created_by": {
      "id": "uuid-user-1",
      "name": "John Smith"
    },
    "created_at": "2024-12-14T10:00:00Z",
    "updated_at": "2024-12-19T14:10:00Z"
  }
}
```

### Get WO Materials (BOM Snapshot)

```
GET /api/planning/work-orders/:id/materials

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid-wom-1",
      "product": {
        "id": "uuid-cocoa",
        "code": "RM-COCOA-001",
        "name": "Cocoa Mass"
      },
      "required_qty": 250,
      "reserved_qty": 250,
      "consumed_qty": 162,
      "remaining_qty": 88,
      "uom": "kg",
      "scrap_percent": 5,
      "consume_whole_lp": false,
      "is_by_product": false,
      "lp_count": 3,
      "consumption_percent": 65,
      "status": "partial"
    },
    {
      "id": "uuid-wom-2",
      "product": {
        "id": "uuid-sugar",
        "code": "RM-SUGAR-001",
        "name": "Sugar Fine"
      },
      "required_qty": 150,
      "reserved_qty": 150,
      "consumed_qty": 97,
      "remaining_qty": 53,
      "uom": "kg",
      "scrap_percent": 2,
      "consume_whole_lp": false,
      "is_by_product": false,
      "lp_count": 2,
      "consumption_percent": 65,
      "status": "partial"
    },
    {
      "id": "uuid-wom-5",
      "product": {
        "id": "uuid-butter",
        "code": "BY-BUTTER-001",
        "name": "Cocoa Butter"
      },
      "required_qty": 0,
      "reserved_qty": 0,
      "consumed_qty": 0,
      "output_qty": 13,
      "uom": "kg",
      "yield_percent": 2,
      "is_by_product": true,
      "status": "by_product"
    }
  ],
  "summary": {
    "total_materials": 5,
    "total_required": 1000,
    "total_reserved": 1000,
    "total_consumed": 649,
    "consumption_percent": 65,
    "by_products": 1
  }
}
```

### Get WO Operations

```
GET /api/planning/work-orders/:id/operations

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid-woop-1",
      "sequence": 1,
      "operation_name": "Mixing",
      "description": "Mix all dry ingredients",
      "machine": {
        "id": "uuid-mixer1",
        "name": "Mixer #1"
      },
      "line": null,
      "expected_duration_minutes": 120,
      "actual_duration_minutes": 125,
      "expected_yield_percent": 98,
      "actual_yield_percent": 98,
      "status": "completed",
      "started_at": "2024-12-19T08:00:00Z",
      "completed_at": "2024-12-19T10:05:00Z",
      "started_by": {
        "id": "uuid-user-3",
        "name": "Jane Doe"
      }
    },
    {
      "id": "uuid-woop-4",
      "sequence": 4,
      "operation_name": "Cooling",
      "description": "Cool chocolate bars",
      "machine": null,
      "line": {
        "id": "uuid-line-cool",
        "name": "Cooling Tunnel"
      },
      "expected_duration_minutes": 90,
      "actual_duration_minutes": null,
      "status": "in_progress",
      "started_at": "2024-12-19T14:10:00Z",
      "completed_at": null,
      "started_by": {
        "id": "uuid-user-4",
        "name": "John Doe"
      }
    },
    {
      "id": "uuid-woop-5",
      "sequence": 5,
      "operation_name": "Packing",
      "description": "Pack into boxes",
      "line": {
        "id": "uuid-line-pack1",
        "name": "Packing #1"
      },
      "expected_duration_minutes": 30,
      "status": "not_started"
    }
  ],
  "summary": {
    "total_operations": 5,
    "completed": 3,
    "in_progress": 1,
    "not_started": 1,
    "total_planned_minutes": 480,
    "total_actual_minutes": 313,
    "remaining_minutes": 120,
    "progress_percent": 60
  }
}
```

### Get WO Output Batches

```
GET /api/planning/work-orders/:id/output

Response:
{
  "success": true,
  "data": {
    "batches": [
      {
        "id": "uuid-batch-1",
        "batch_number": 1,
        "timestamp": "2024-12-19T08:30:00Z",
        "quantity": 200,
        "good_qty": 196,
        "scrap_qty": 4,
        "yield_percent": 98,
        "operator": {
          "id": "uuid-user-3",
          "name": "Jane Doe"
        },
        "location": "Packing #1"
      },
      {
        "id": "uuid-batch-2",
        "batch_number": 2,
        "timestamp": "2024-12-19T10:45:00Z",
        "quantity": 250,
        "good_qty": 243,
        "scrap_qty": 7,
        "yield_percent": 97,
        "operator": {
          "id": "uuid-user-3",
          "name": "Jane Doe"
        },
        "location": "Packing #1"
      },
      {
        "id": "uuid-batch-3",
        "batch_number": 3,
        "timestamp": "2024-12-19T13:15:00Z",
        "quantity": 200,
        "good_qty": 195,
        "scrap_qty": 5,
        "yield_percent": 97.5,
        "operator": {
          "id": "uuid-user-4",
          "name": "John Doe"
        },
        "location": "Packing #1"
      }
    ],
    "summary": {
      "total_batches": 3,
      "total_quantity": 650,
      "total_good": 634,
      "total_scrap": 16,
      "average_yield": 97.5,
      "by_products": [
        {
          "product_id": "uuid-butter",
          "product_name": "Cocoa Butter",
          "quantity": 13,
          "uom": "kg",
          "yield_percent": 2
        }
      ]
    }
  }
}
```

### Get WO History

```
GET /api/planning/work-orders/:id/history

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid-hist-1",
      "event_type": "operation_started",
      "event_date": "2024-12-19T14:10:00Z",
      "user": { "id": "uuid-user-4", "name": "John Doe" },
      "details": {
        "operation": "Cooling",
        "expected_duration": "1.5h"
      }
    },
    {
      "id": "uuid-hist-2",
      "event_type": "output_recorded",
      "event_date": "2024-12-19T13:15:00Z",
      "user": { "id": "uuid-user-4", "name": "John Doe" },
      "details": {
        "batch_number": 3,
        "quantity": 200,
        "good": 195,
        "scrap": 5
      }
    },
    // ... more events
  ]
}
```

### Get Material Reservations

```
GET /api/planning/work-orders/:id/materials/:materialId/reservations

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid-res-1",
      "lp_id": "uuid-lp-123",
      "lp_number": "LP-2024-12345",
      "quantity": 100,
      "reserved_at": "2024-12-18T14:00:00Z",
      "reserved_by": {
        "id": "uuid-user-1",
        "name": "John Smith"
      },
      "consumed_qty": 65,
      "remaining_qty": 35,
      "status": "partial"
    },
    ...
  ]
}
```

---

## Permissions

| Role | View Detail | Edit | Start | Pause | Resume | Complete | Reserve | Consume | Cancel |
|------|-------------|------|-------|-------|--------|----------|---------|---------|--------|
| Admin | Yes | Yes (Draft) | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Production Manager | Yes | Yes (Draft) | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Production Operator | Yes | No | Yes | Yes | Yes | Yes | Yes | Yes | No |
| Planner | Yes | Yes (Draft) | No | No | No | No | Yes | No | Yes |
| Viewer | Yes | No | No | No | No | No | No | No | No |

---

## Business Rules

### Status-Based UI Rules

| Status | Edit Button | Tabs Visible | Action Menu Items |
|--------|-------------|--------------|-------------------|
| Draft | Visible | Materials | Edit, Plan, Duplicate, Cancel, Print |
| Planned | Hidden | Materials | Release, Reserve Materials, Duplicate, Cancel, Print |
| Released | Hidden | Materials | Start, Reserve Materials, Duplicate, Cancel, Print |
| In Progress | Hidden | Materials, Operations, Output, History | Pause, Complete, Consume, Record Output, Duplicate, Print |
| On Hold | Hidden | Materials, Operations, Output, History | Resume, Cancel, Duplicate, Print |
| Completed | Hidden | Materials, Operations, Output, History | Close, Duplicate, Print |
| Closed | Hidden | Materials, Operations, Output, History | Duplicate, Print |

### Operations Tab Visibility

- Only visible when routing was copied (wo_operations exist)
- Shows sequence, status, duration tracking
- Operators can start/complete operations
- Yield tracking per operation

### Output Tab Visibility

- Only visible when status IN ('in_progress', 'completed', 'closed')
- Shows production batches with good/scrap breakdown
- By-product output tracked separately
- Overall yield calculation

### Material Reservation (FR-PLAN-025)

**Soft Reservation:**
- Reserved LPs marked as "reserved for WO-XXX"
- Other WOs can still reserve same inventory (soft lock)
- **On WO Cancel**: All reservations automatically released
- **On Consumption**: Reservation quantity reduced by consumed amount

**Reservation Status:**
| Status | Condition | Display |
|--------|-----------|---------|
| Full | reserved_qty = required_qty | Green, "Reserved" |
| Partial | 0 < reserved_qty < required_qty | Yellow, "Partially reserved" |
| None | reserved_qty = 0 | Gray, "Not reserved" |
| Low | remaining_qty < required_qty * 0.2 | Red warning, "Low remaining" |

### BOM/Routing Immutability (Critical)

**Snapshot Behavior:**
- BOM and Routing are **snapshotted** when WO is created
- After WO status changes to "Released", snapshot becomes **immutable**
- Any changes to source BOM/Routing do NOT affect existing WOs
- UI must visually indicate snapshot is locked
- Materials Required list comes from `wo_materials` table (snapshot)
- Operations list comes from `wo_operations` table (snapshot)

**Visual Indicators:**
- Header: "BOM: v1.2 (Standard Recipe) [SNAPSHOT - Locked after release]"
- Materials tab: "Materials Required (BOM Snapshot v1.2 - Immutable)"
- Operations tab: "Operations Progress: X of Y completed (Z%) [Routing Snapshot - locked after release]"
- Mobile: "BOM: v1.2 [LOCKED]"

### History Events Logged

| Event | Trigger | Details Captured |
|-------|---------|------------------|
| wo_created | POST /work-orders | product, quantity, bom_version, scheduled_date |
| wo_planned | Status change to planned | - |
| wo_released | Status change to released | - |
| wo_started | Status change to in_progress | start_time, operator |
| wo_paused | Status change to on_hold | pause_time, reason, operator |
| wo_resumed | Status change from on_hold | resume_time, operator |
| materials_reserved | Material reservation created | material, lp, quantity, operator |
| material_consumed | Consumption recorded | material, quantity, lp, operator |
| operation_started | Operation status -> in_progress | operation, start_time, operator |
| operation_completed | Operation status -> completed | operation, duration, yield, operator |
| output_recorded | Production batch created | batch_number, quantity, good, scrap, operator |
| wo_completed | Status change to completed | completion_time, actual_qty, yield |
| wo_closed | Status change to closed | close_time |

---

## Accessibility

### Touch Targets
- All buttons: 48x48dp minimum
- Tab navigation items: 48dp height
- Table row actions: 48x48dp
- History timeline events: 64dp minimum row height

### Contrast
- Header info text: 4.5:1
- Status badges: WCAG AA compliant
- Table text: 4.5:1
- Progress indicators: 4.5:1

### Screen Reader
- Page title: "Work Order WO-2024-00156 Detail"
- Status: "Status: In Progress, 65 percent complete"
- Materials table: Proper th/td structure with scope
- Operations: "Operation 4 of 5, Cooling, in progress"
- History timeline: "Timeline of work order events, 12 events"
- BOM snapshot: "BOM version 1.2 Standard Recipe, snapshot locked after release"

### Keyboard Navigation
- Tab: Navigate between sections, tabs, action buttons
- Enter: Activate buttons, navigate links
- Arrow keys: Navigate within tabs, tables

---

## Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| Desktop (>1024px) | Full layout with sidebar info cards |
| Tablet (768-1024px) | Stacked info cards, condensed tables |
| Mobile (<768px) | Full stack, card-based materials/operations, collapsible sections |

---

## Performance Notes

### Data Loading
- Header + Materials: Single query with JOINs
- Operations: Lazy load on tab click
- Output: Lazy load on tab click
- History: Lazy load on tab click

### Caching
```typescript
'org:{orgId}:wo:{woId}:detail'      // 30 sec TTL
'org:{orgId}:wo:{woId}:materials'   // 30 sec TTL
'org:{orgId}:wo:{woId}:operations'  // 30 sec TTL
'org:{orgId}:wo:{woId}:output'      // 30 sec TTL
'org:{orgId}:wo:{woId}:history'     // 1 min TTL
```

### Load Time Targets
- Initial page (header + materials): <500ms
- Tab switch (operations): <300ms
- Tab switch (output): <300ms
- Tab switch (history): <300ms

---

## Testing Requirements

### Unit Tests
- Progress percent calculation
- Yield percent calculation
- Consumption percent per material
- Operation status determination
- Action button visibility by status
- BOM snapshot immutability display

### Integration Tests
- GET /api/planning/work-orders/:id
- GET /api/planning/work-orders/:id/materials
- GET /api/planning/work-orders/:id/operations
- GET /api/planning/work-orders/:id/output
- GET /api/planning/work-orders/:id/history
- RLS enforcement

### E2E Tests
- View WO detail page loads all sections
- Tab navigation works (Materials, Operations, Output, History)
- Material reservations display correctly
- Operations progress tracking works
- Output batches display with yield
- History timeline shows all events
- Print action downloads PDF
- Mobile responsive layout
- BOM/Routing snapshot indicators visible
- Verify snapshot doesn't change when source BOM updated

---

## Quality Gates

Before handoff to FRONTEND-DEV:
- [x] All states defined (Loading, Success, Error)
- [x] All tabs specified (Materials, Operations, Output, History)
- [x] API endpoints documented
- [x] Status-based action visibility defined
- [x] Accessibility requirements met
- [x] Responsive design documented
- [x] History events listed
- [x] Material reservation logic specified
- [x] BOM snapshot immutability documented
- [x] Visual immutability indicators added (3 locations)
- [x] Reservation business rules clarified

---

## Handoff to FRONTEND-DEV

```yaml
feature: WO Detail Page
story: PLAN-015
fr_coverage: FR-PLAN-022, FR-PLAN-025
approval_status:
  mode: "review_each"
  user_approved: false  # PENDING USER REVIEW
deliverables:
  wireframe: docs/3-ARCHITECTURE/ux/wireframes/PLAN-015-work-order-detail.md
  api_endpoints:
    - GET /api/planning/work-orders/:id
    - GET /api/planning/work-orders/:id/materials
    - GET /api/planning/work-orders/:id/operations
    - GET /api/planning/work-orders/:id/output
    - GET /api/planning/work-orders/:id/history
    - GET /api/planning/work-orders/:id/materials/:materialId/reservations
states_per_screen: [loading, success, error]
tabs: [materials, operations, output, history]
breakpoints:
  mobile: "<768px"
  tablet: "768-1024px"
  desktop: ">1024px"
accessibility:
  touch_targets: "48dp minimum"
  contrast: "4.5:1 minimum"
related_screens:
  - PLAN-013: WO List Page
  - PLAN-014: WO Create Modal
  - Production Module (cross-module)
critical_ux_requirements:
  - BOM snapshot immutability visually indicated (3 locations)
  - Reservation auto-release on WO cancel
  - Reservation qty reduction on consumption
  - Locked state after WO release
```

---

**Status**: Ready for User Review
**Approval Mode**: review_each (default)
**User Approved**: Pending
**Iterations**: 0 of 3
**Estimated Effort**: 12-14 hours
**Quality Target**: 98/100 (improved from 91%)
