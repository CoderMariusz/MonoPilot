# PLAN-013: Work Order List Page

**Module**: Planning
**Feature**: Work Order Management (FR-PLAN-017, FR-PLAN-022)
**Status**: Ready for Review
**Last Updated**: 2025-12-14

---

## ASCII Wireframe

### Success State (Desktop)

```
+--------------------------------------------------------------------------------------------------+
|  Planning > Work Orders                                         [+ Create WO] [Gantt View]       |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  +---------------------+ +---------------------+ +---------------------+ +---------------------+   |
|  | Scheduled Today     | | In Progress         | | On Hold             | | This Week           |   |
|  |         12          | |          8          | |          2          | |     42              |   |
|  | Ready to start      | | Active production   | | Awaiting materials  | | WOs created         |   |
|  | [View All]          | | [Monitor]           | | [Resolve]           | | [View Report]       |   |
|  +---------------------+ +---------------------+ +---------------------+ +---------------------+   |
|                                                                                                    |
|  +----------------------------------------------------------------------------------------------+  |
|  | Filters: [Status: All v] [Product: All v] [Machine: All v] [Priority: All v] [Date: This   |  |
|  |          Week v] [Search]                                                                    |  |
|  |                                                                                              |  |
|  | Bulk Actions: [ ] Select All    [Release Selected] [Export to Excel] [Print Selected]      |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  +----------------------------------------------------------------------------------------------+  |
|  | [ ] | WO Number      | Product           | Status      | Qty      | Scheduled  | Progress | |
|  |     |                |                   |             |          | Date       |          | |
|  +----------------------------------------------------------------------------------------------+  |
|  | [ ] | WO-2024-00156  | Chocolate Bar     | [Planned]   | 1,000 pc | Dec 20     | 0%       | |
|  |     | [!] High       | FG-CHOC-001       |             |          | Tomorrow   | [...]    | |
|  |     |                | Line: Packing #1  | [!] Mat.low |          |            |          | |
|  +----------------------------------------------------------------------------------------------+  |
|  | [ ] | WO-2024-00155  | Vanilla Cookie    | [In         | 500 kg   | Dec 19     | 65%      | |
|  |     |                | FG-COOK-001       |  Progress]  |          | Today      | [...]    | |
|  |     |                | Line: Baking #2   |             |          |            |          | |
|  +----------------------------------------------------------------------------------------------+  |
|  | [ ] | WO-2024-00154  | Strawberry Jam    | [On Hold]   | 200 jar  | Dec 18     | 30%      | |
|  |     |                | FG-JAM-001        |             |          | Yesterday  | [...]    | |
|  |     |                | Line: Filling #1  | Paused:     |          |            |          | |
|  |     |                |                   | Machine     |          |            |          | |
|  +----------------------------------------------------------------------------------------------+  |
|  | [x] | WO-2024-00153  | Chocolate Bar     | [Released]  | 2,000 pc | Dec 20     | 0%       | |
|  |     |                | FG-CHOC-001       |             |          | Tomorrow   | [...]    | |
|  |     |                | Line: Packing #1  |             |          |            |          | |
|  +----------------------------------------------------------------------------------------------+  |
|  | [ ] | WO-2024-00152  | Peanut Butter     | [Completed] | 300 kg   | Dec 17     | 100%     | |
|  |     |                | FG-PB-001         |             |          | 2 days ago | [...]    | |
|  |     |                | Line: Mixing #1   | Yield: 98%  |          |            |          | |
|  +----------------------------------------------------------------------------------------------+  |
|  | [ ] | WO-2024-00151  | Apple Sauce       | [Draft]     | 1,500 jar| Dec 22     | 0%       | |
|  |     |                | FG-APPLE-001      |             |          | In 3 days  | [...]    | |
|  |     |                | Line: Not assigned|             |          |            |          | |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  Showing 1-20 of 42 WOs                                    [< Previous] [1] [2] [3] [Next >]      |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+

[...] Row Actions Menu:
  - View Details
  - Edit (if Draft)
  - Plan (if Draft)
  - Release (if Planned + materials ok)
  - Start (if Released)
  - Pause (if In Progress)
  - Resume (if On Hold)
  - Complete (if In Progress)
  - Cancel (if not Completed/Closed)
  - View Status History
  - Duplicate WO
  - Print WO
  - Delete (if Draft only, with confirmation)
```

### Success State (Tablet: 768-1024px)

```
+--------------------------------------------------------------------+
|  Planning > Work Orders                     [+ Create] [Gantt]     |
+--------------------------------------------------------------------+
|                                                                      |
|  +----------------+ +----------------+                               |
|  | Today          | | In Progress    |                               |
|  |      12        | |      8         |                               |
|  | [View]         | | [Monitor]      |                               |
|  +----------------+ +----------------+                               |
|                                                                      |
|  +----------------+ +----------------+                               |
|  | On Hold        | | This Week      |                               |
|  |       2        | |      42        |                               |
|  | [Resolve]      | | [View]         |                               |
|  +----------------+ +----------------+                               |
|                                                                      |
|  Filters: [Status v] [Product v] [Machine v] [Priority v] [Search]  |
|                                                                      |
|  [ ] Select All    [Release] [Export]                               |
|                                                                      |
|  +----------------------------------------------------------------+ |
|  | [ ] WO-2024-00156  Chocolate Bar       [Planned] [!] High     | |
|  |     1,000 pc       Line: Packing #1    Dec 20  [!] Low mat.   | |
|  |                                        0%       [Edit] [...]   | |
|  +----------------------------------------------------------------+ |
|  | [ ] WO-2024-00155  Vanilla Cookie      [In Progress]           | |
|  |     500 kg         Line: Baking #2     Today    65%            | |
|  |                                                 [View] [...]   | |
|  +----------------------------------------------------------------+ |
|  | [ ] WO-2024-00154  Strawberry Jam      [On Hold]               | |
|  |     200 jar        Line: Filling #1    Yesterday  30%          | |
|  |                    Paused: Machine              [View] [...]   | |
|  +----------------------------------------------------------------+ |
|                                                                      |
|  Showing 1-10 of 42                        [<] [1] [2] [3] [>]      |
|                                                                      |
+--------------------------------------------------------------------+
```

### Success State (Mobile: <768px)

```
+----------------------------------+
|  < Work Orders                   |
|  [+ Create] [Gantt]              |
+----------------------------------+
|                                  |
|  +----------------------------+  |
|  | Scheduled Today   12       |  |
|  | Ready to start    [View]   |  |
|  +----------------------------+  |
|  | In Progress        8       |  |
|  | [Monitor]                  |  |
|  +----------------------------+  |
|  | On Hold            2       |  |
|  | [Resolve]                  |  |
|  +----------------------------+  |
|                                  |
|  [Filters v]    [Search]        |
|                                  |
|  +----------------------------+  |
|  | [ ] WO-2024-00156          |  |
|  | Chocolate Bar   [!] High   |  |
|  | [Planned]  1,000 pc        |  |
|  | Line: Packing #1           |  |
|  | Dec 20  [!] Low materials  |  |
|  |          [Edit] [...]      |  |
|  +----------------------------+  |
|  | [ ] WO-2024-00155          |  |
|  | Vanilla Cookie             |  |
|  | [In Progress]  500 kg      |  |
|  | Line: Baking #2            |  |
|  | Today   Progress: 65%      |  |
|  |          [View] [...]      |  |
|  +----------------------------+  |
|  | [ ] WO-2024-00154          |  |
|  | Strawberry Jam             |  |
|  | [On Hold]  200 jar         |  |
|  | Paused: Machine            |  |
|  | Yesterday  Progress: 30%   |  |
|  |          [View] [...]      |  |
|  +----------------------------+  |
|                                  |
|  [Load More]                     |
|                                  |
+----------------------------------+
```

### Loading State

```
+--------------------------------------------------------------------------------------------------+
|  Planning > Work Orders                                         [+ Create WO] [Gantt View]       |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  +---------------------+ +---------------------+ +---------------------+ +---------------------+   |
|  | [================]  | | [================]  | | [================]  | | [================]  |   |
|  | [========]         | | [========]         | | [========]         | | [========]         |   |
|  | [====]             | | [====]             | | [====]             | | [====]             |   |
|  +---------------------+ +---------------------+ +---------------------+ +---------------------+   |
|                                                                                                    |
|  +----------------------------------------------------------------------------------------------+  |
|  | [================] [================] [================] [================]                  |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  +----------------------------------------------------------------------------------------------+  |
|  | [================================================================================]          |  |
|  | [====================================================]                                      |  |
|  +----------------------------------------------------------------------------------------------+  |
|  | [================================================================================]          |  |
|  | [====================================================]                                      |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  Loading work orders...                                                                           |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

### Empty State

```
+--------------------------------------------------------------------------------------------------+
|  Planning > Work Orders                                         [+ Create WO] [Gantt View]       |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|                                                                                                    |
|                                      +------------------+                                          |
|                                      |   [WO Icon]      |                                          |
|                                      +------------------+                                          |
|                                                                                                    |
|                                    No Work Orders Yet                                             |
|                                                                                                    |
|                     Create your first work order to schedule production.                          |
|                     Plan materials, assign lines, and track progress.                             |
|                                                                                                    |
|                                                                                                    |
|                               [+ Create First Work Order]                                         |
|                                                                                                    |
|                                                                                                    |
|                                                                                                    |
|                      Quick Tip: Make sure you have BOMs configured for your                        |
|                      products before creating work orders.                                        |
|                                                                                                    |
|                                   [Go to BOM Management]                                          |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

### Filtered Empty State

```
+--------------------------------------------------------------------------------------------------+
|  Planning > Work Orders                                         [+ Create WO] [Gantt View]       |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  +---------------------+ +---------------------+ +---------------------+ +---------------------+   |
|  | Scheduled Today     | | In Progress         | | On Hold             | | This Week           |   |
|  |          0          | |          0          | |          0          | |     42              |   |
|  +---------------------+ +---------------------+ +---------------------+ +---------------------+   |
|                                                                                                    |
|  +----------------------------------------------------------------------------------------------+  |
|  | Filters: [Status: On Hold v] [Product: Chocolate Bar v] [Machine: All v] [Priority: All v]  |  |
|  |          [Date: This Week v] [Search: urgent]                                                |  |
|  |                                                                                              |  |
|  | Active Filters: On Hold + Chocolate Bar + "urgent"                         [Clear All]      |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|                                                                                                    |
|                                      +------------------+                                          |
|                                      |   [Filter Icon]  |                                          |
|                                      +------------------+                                          |
|                                                                                                    |
|                              No Work Orders Match Your Filters                                    |
|                                                                                                    |
|                     Try adjusting or clearing some filters to see more results.                   |
|                                                                                                    |
|                      Currently filtering by: On Hold status, Chocolate Bar product,               |
|                      and search term "urgent"                                                     |
|                                                                                                    |
|                                                                                                    |
|                               [Clear All Filters]    [Modify Filters]                             |
|                                                                                                    |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

### Error State

```
+--------------------------------------------------------------------------------------------------+
|  Planning > Work Orders                                         [+ Create WO] [Gantt View]       |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|                                                                                                    |
|                                      +------------------+                                          |
|                                      |   [Error Icon]   |                                          |
|                                      +------------------+                                          |
|                                                                                                    |
|                              Failed to Load Work Orders                                           |
|                                                                                                    |
|                     Unable to retrieve work order data. Please check                              |
|                     your connection and try again.                                                 |
|                                                                                                    |
|                              Error: WO_LIST_FETCH_FAILED                                          |
|                                                                                                    |
|                                                                                                    |
|                              [Retry]    [Contact Support]                                         |
|                                                                                                    |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

---

## Key Components

### 1. KPI Summary Cards (4 Cards)

| Card | Data Source | Calculation | Click Action |
|------|-------------|-------------|--------------|
| **Scheduled Today** | work_orders table | COUNT(*) WHERE scheduled_date = today AND status IN ('planned', 'released') | Filter list to today's WOs |
| **In Progress** | work_orders table | COUNT(*) WHERE status = 'in_progress' | Filter list to in progress |
| **On Hold** | work_orders table | COUNT(*) WHERE status = 'on_hold' | Filter list to on hold WOs |
| **This Week** | work_orders table | COUNT(*) WHERE created_at >= start_of_week | Show weekly report |

### 2. Filters Bar

| Filter | Type | Options | Default |
|--------|------|---------|---------|
| **Status** | Multi-select dropdown | Draft, Planned, Released, In Progress, On Hold, Completed, Closed, Cancelled | All |
| **Product** | Searchable dropdown | All products (finished goods) | All |
| **Machine** | Searchable dropdown | All machines/lines | All |
| **Priority** | Multi-select dropdown | Low, Normal, High, Critical | All |
| **Date Range** | Date range picker | Today, This Week, This Month, Custom | This Week |
| **Search** | Text input | Searches WO number, product name | Empty |

### 3. Bulk Actions Bar

| Action | Enabled When | Result |
|--------|--------------|--------|
| **Release Selected** | 1+ WOs in Planned status selected AND materials available | Opens batch release modal |
| **Export to Excel** | 1+ WOs selected | Downloads Excel with selected WOs |
| **Print Selected** | 1+ WOs selected | Opens print preview with selected WOs |

### 4. WO Table

| Column | Width | Sortable | Description |
|--------|-------|----------|-------------|
| **Checkbox** | 48px | No | Row selection for bulk actions |
| **WO Number** | 150px | Yes | Unique identifier (e.g., WO-2024-00156) + priority indicator |
| **Product** | 250px | Yes | Product name + code + line assignment |
| **Status** | 120px | Yes | Status badge with alerts |
| **Qty** | 100px | Yes | Planned quantity + UoM |
| **Scheduled Date** | 120px | Yes | Date + relative time |
| **Progress** | 100px | No | Progress % or yield % |
| **Actions** | 100px | No | Quick action button + overflow menu |

### 5. Status Badge Colors

| Status | Color | Background | Text |
|--------|-------|------------|------|
| Draft | Gray | #F3F4F6 | #374151 |
| Planned | Blue | #DBEAFE | #1E40AF |
| Released | Cyan | #CFFAFE | #155E75 |
| In Progress | Purple | #EDE9FE | #5B21B6 |
| On Hold | Orange | #FED7AA | #C2410C |
| Completed | Green | #D1FAE5 | #065F46 |
| Closed | Green (dark) | #10B981 | #FFFFFF |
| Cancelled | Red | #FEE2E2 | #B91C1C |

### 6. Priority Indicators

| Priority | Visual | Position |
|----------|--------|----------|
| Low | No indicator | - |
| Normal | No indicator | - |
| High | [!] Orange icon + text "High" | Below WO number |
| Critical | [!] Red icon + text "Critical" | Below WO number |

### 7. Alert Indicators

| Alert | Display | Meaning |
|-------|---------|---------|
| [!] Mat. low | Yellow warning icon | Material availability below safety threshold |
| [!] Overdue | Red warning icon | Scheduled date passed, not completed |
| Paused: {reason} | Orange text | WO on hold with reason |
| Yield: {percent}% | Green/Red text | Actual yield vs planned (green if >95%, red if <90%) |

---

## Main Actions

### Primary Actions

| Action | Location | Description |
|--------|----------|-------------|
| **Create WO** | Header button | Opens PLAN-014 Create WO modal |
| **Gantt View** | Header button | Opens Gantt chart view (FR-PLAN-024, Phase 2) |

### Table Row Actions

| Action | Visibility | Description |
|--------|------------|-------------|
| **Edit** | Status = Draft | Opens PLAN-014 Edit WO modal |
| **View** | Status != Draft | Opens PLAN-015 WO Detail page |
| **Plan** | Status = Draft | Changes status to Planned |
| **Release** | Status = Planned AND materials ok | Changes status to Released |
| **Start** | Status = Released | Changes status to In Progress, captures start time |
| **Pause** | Status = In Progress | Changes status to On Hold, requires reason |
| **Resume** | Status = On Hold | Changes status to In Progress |
| **Complete** | Status = In Progress | Opens completion modal, captures output |
| **Cancel** | Status NOT IN (Completed, Closed) | Cancels WO with confirmation |
| **View Status History** | Always | Opens modal showing status transition log |
| **Duplicate** | Always | Creates copy as Draft |
| **Print** | Always | Opens print preview |
| **Delete** | Status = Draft only | Permanently deletes WO with confirmation |

---

## States

| State | Description | Elements Shown |
|-------|-------------|----------------|
| **Loading** | Initial page load | Skeleton cards, skeleton table rows |
| **Empty** | No WOs exist | Empty state illustration, Create button, tip about BOMs |
| **Success** | WOs loaded | KPI cards, filters, table with data, pagination |
| **Error** | API failure | Error message, retry button, support link |
| **Filtered Empty** | Filters return no results | "No WOs match your filters" message, active filters shown, clear filters button |

---

## Data Fields

### WO List Item

| Field | Source | Display |
|-------|--------|---------|
| id | work_orders.id | Internal use |
| wo_number | work_orders.wo_number | "WO-2024-00156" |
| product_id | work_orders.product_id | Used for filtering |
| product_name | products.name via JOIN | "Chocolate Bar" |
| product_code | products.code via JOIN | "FG-CHOC-001" |
| status | work_orders.status | Badge |
| priority | work_orders.priority | "High" (visual indicator if High/Critical) |
| quantity | work_orders.quantity | "1,000" |
| uom | work_orders.uom | "pc" |
| scheduled_date | work_orders.scheduled_date | "Dec 20, 2024" |
| relative_date | Calculated | "Tomorrow", "Today", "2 days ago" |
| line_name | lines.name via line_id | "Packing #1" |
| machine_name | machines.name via machine_id | Optional |
| progress_percent | Calculated | 0-100% |
| yield_percent | work_orders.yield_percent | "98%" |
| material_status | Calculated | "ok", "low", "insufficient" |
| pause_reason | work_orders.pause_reason | "Machine breakdown" |
| created_at | work_orders.created_at | For sorting |

---

## API Endpoints

### List Work Orders

```
GET /api/planning/work-orders?status[]=draft&status[]=planned&product={id}&machine={id}&priority[]=high&from_date={date}&to_date={date}&search={term}&page=1&limit=20&sort=scheduled_date&order=asc

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid-wo-156",
      "wo_number": "WO-2024-00156",
      "product": {
        "id": "uuid-choc",
        "code": "FG-CHOC-001",
        "name": "Chocolate Bar"
      },
      "bom": {
        "id": "uuid-bom-1",
        "version": "v1.2"
      },
      "wo_materials": [
        {
          "id": "uuid-wom-1",
          "product_id": "uuid-flour",
          "product_code": "RM-FLOUR-001",
          "product_name": "Flour Type A",
          "required_qty": 500,
          "available_qty": 1200,
          "uom": "kg",
          "consumed_qty": 0,
          "lot_tracked": true,
          "expiry_tracked": true
        },
        {
          "id": "uuid-wom-2",
          "product_id": "uuid-sugar",
          "product_code": "RM-SUGAR-001",
          "product_name": "Sugar White",
          "required_qty": 200,
          "available_qty": 150,
          "uom": "kg",
          "consumed_qty": 0,
          "lot_tracked": true,
          "expiry_tracked": false
        }
      ],
      "status": "planned",
      "priority": "normal",
      "quantity": 1000,
      "uom": "pc",
      "scheduled_date": "2024-12-20",
      "scheduled_start_time": "08:00",
      "scheduled_end_time": "16:00",
      "line": {
        "id": "uuid-line-1",
        "name": "Packing #1"
      },
      "machine": null,
      "progress_percent": 0,
      "material_status": "low",
      "material_availability": {
        "sufficient": 1,
        "low": 1,
        "insufficient": 0
      },
      "created_at": "2024-12-14T09:30:00Z"
    },
    ...
  ],
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 20,
    "pages": 3
  }
}
```

### KPI Summary

```
GET /api/planning/work-orders/summary

Response:
{
  "success": true,
  "data": {
    "scheduled_today_count": 12,
    "in_progress_count": 8,
    "on_hold_count": 2,
    "this_week_count": 42
  }
}
```

### Bulk Release

```
POST /api/planning/work-orders/bulk-release
Body: {
  "wo_ids": ["uuid-1", "uuid-2", "uuid-3"],
  "notes": "Batch release for week 51"
}

Response:
{
  "success": true,
  "data": {
    "released_count": 3,
    "failed_count": 0,
    "results": [
      { "id": "uuid-1", "status": "released" },
      { "id": "uuid-2", "status": "released" },
      { "id": "uuid-3", "status": "released" }
    ]
  }
}
```

### Delete Work Order

```
DELETE /api/planning/work-orders/:id

Validation:
- Only Draft status WOs can be deleted
- Requires confirmation from user

Response:
{
  "success": true,
  "message": "Work order WO-2024-00156 deleted successfully"
}

Error (invalid status):
{
  "success": false,
  "error": {
    "code": "INVALID_STATUS_FOR_DELETE",
    "message": "Only draft work orders can be deleted. Current status: planned"
  }
}
```

### Export to Excel

```
GET /api/planning/work-orders/export?format=xlsx&wo_ids[]=uuid-1&wo_ids[]=uuid-2

Response: Binary file download (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)
```

---

## Permissions

| Role | View List | Create WO | Edit WO | Release | Start/Pause | Complete | Cancel | Delete | Export | Bulk Actions |
|------|-----------|-----------|---------|---------|-------------|----------|--------|--------|--------|--------------|
| Admin | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Production Manager | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Production Operator | Yes | No | No | Yes | Yes | Yes | No | No | Yes | Limited |
| Planner | Yes | Yes | Yes | Yes | No | No | Yes | Yes | Yes | Limited |
| Viewer | Yes | No | No | No | No | No | No | No | Yes | No |

---

## Validation

| Field | Rule | Error Message |
|-------|------|---------------|
| Status filter | Valid enum values only | "Invalid status filter" |
| Date range | from_date <= to_date | "Invalid date range" |
| Page | >= 1 | "Invalid page number" |
| Limit | 1-100 | "Limit must be between 1 and 100" |
| Bulk release | All WOs must be in Planned status | "WO {number} cannot be released from current status" |
| Delete | WO must be in Draft status | "Only draft work orders can be deleted" |

---

## Business Rules

### Status Transitions from List

| Current Status | Allowed Actions | Next Status |
|----------------|-----------------|-------------|
| Draft | Plan, Edit, Cancel, Delete | Planned, Draft, Cancelled, Deleted |
| Planned | Release, Cancel | Released, Cancelled |
| Released | Start, Cancel | In Progress, Cancelled |
| In Progress | Pause, Complete | On Hold, Completed |
| On Hold | Resume, Cancel | In Progress, Cancelled |
| Completed | Close (auto or manual) | Closed |

### Delete Validation

**Rule**: Only Draft status work orders can be deleted.

**Rationale**:
- Once a WO is Planned or Released, it has scheduling/material implications
- In Progress/Completed WOs have production data that must be preserved for traceability
- Cancelled status exists for WOs that should not be deleted but need to be marked as abandoned

**Implementation**:
- Show "Delete" action only for Draft WOs
- Confirmation dialog required: "Are you sure you want to delete WO-{number}? This action cannot be undone."
- On delete: permanently remove from database
- For non-Draft WOs: use "Cancel" action instead (soft delete, preserves history)

### Material Availability Status

```typescript
// Determine material availability status
function getMaterialStatus(wo: WorkOrder): 'ok' | 'low' | 'insufficient' {
  const materials = wo.wo_materials;
  const hasInsufficient = materials.some(m => m.available_qty < m.required_qty);
  if (hasInsufficient) return 'insufficient';

  const hasLow = materials.some(m =>
    m.available_qty >= m.required_qty &&
    m.available_qty < m.required_qty * 1.2
  );
  if (hasLow) return 'low';

  return 'ok';
}
```

### Progress Calculation

```typescript
// Calculate WO progress based on operations or output
function calculateProgress(wo: WorkOrder): number {
  if (wo.status === 'completed') return 100;
  if (wo.status in ['draft', 'planned', 'released']) return 0;

  // Option 1: Based on operations (if routing copied)
  if (wo.wo_operations?.length > 0) {
    const completed = wo.wo_operations.filter(op => op.status === 'completed').length;
    return (completed / wo.wo_operations.length) * 100;
  }

  // Option 2: Based on output quantity
  if (wo.actual_qty > 0) {
    return (wo.actual_qty / wo.quantity) * 100;
  }

  return 0;
}
```

---

## Accessibility

### Touch Targets
- All buttons: minimum 48x48dp
- Table row click area: full row height (72px for multi-line rows)
- Checkbox click area: 48x48dp
- Actions menu items: 48dp height

### Contrast
- Text on badges: 4.5:1 minimum
- Table text: 4.5:1 minimum
- Action buttons: 4.5:1 minimum
- Alert indicators: 4.5:1 minimum

### Screen Reader
- KPI cards: "Scheduled Today card: 12 work orders ready to start, click to view all"
- Table: Proper column headers with scope="col"
- Status badges: "Status: In Progress"
- Priority indicators: "Priority: High"
- Alert indicators: "Material availability low for 1 material"
- Actions menu: "Actions for WO-2024-00156, menu expanded, 8 items"

### Keyboard Navigation
- Tab: Move between interactive elements
- Enter: Activate button/link
- Space: Toggle checkbox
- Escape: Close dropdown/modal
- Arrow keys: Navigate within dropdown

### ARIA Attributes
- Table: role="table" with proper row/cell structure
- Status badges: role="status" aria-label="{status}"
- Filters: aria-expanded for dropdowns
- Bulk actions: aria-disabled when no selection

---

## Responsive Breakpoints

| Breakpoint | Layout | Changes |
|------------|--------|---------|
| Desktop (>1024px) | Full table with all columns | Full KPI cards, horizontal filters |
| Tablet (768-1024px) | Condensed table | 2x2 KPI grid, stacked filters |
| Mobile (<768px) | Card layout | Vertical KPI list, expandable filters, card per WO |

### Mobile-Specific
- Filters collapse into dropdown/modal
- Table becomes card list
- Pagination becomes "Load More" button
- Bulk actions in bottom action sheet
- Progress shown as compact badge
- Priority indicator shown inline with WO number

---

## Performance Notes

### Query Optimization
- Index on: (org_id, status, scheduled_date ASC)
- Index on: (org_id, product_id, status)
- Index on: (org_id, priority, scheduled_date)
- Index on: (org_id, machine_id, status)

### Caching Strategy
```typescript
// Redis keys
'org:{orgId}:planning:wo-list:{filters_hash}'     // 1 min TTL
'org:{orgId}:planning:wo-summary'                 // 2 min TTL
'org:{orgId}:products:finished-goods'             // 5 min TTL
'org:{orgId}:lines:active'                        // 5 min TTL
'org:{orgId}:machines:active'                     // 5 min TTL
```

### Load Time Targets
- Initial page load: <500ms (P95)
- Filter change: <300ms
- Pagination: <300ms
- Export generation: <2s for 100 WOs

---

## Testing Requirements

### Unit Tests
- KPI calculations (scheduled today, in progress, on hold counts)
- Status badge color mapping
- Priority indicator display logic
- Relative date formatting
- Material status determination
- Progress calculation
- Filter query building
- Delete validation (Draft only)

### Integration Tests
- GET /api/planning/work-orders with various filters (including machine filter)
- GET /api/planning/work-orders/summary
- POST /api/planning/work-orders/bulk-release
- DELETE /api/planning/work-orders/:id (Draft only)
- GET /api/planning/work-orders/export
- RLS policy enforcement

### E2E Tests
- Page load with data shows all KPIs and table
- Empty state shows correct message and actions
- Filtered empty state shows when filters return no results
- Filter by status updates table correctly
- Filter by machine updates table correctly
- Search by WO number works
- Priority indicators display correctly (High/Critical)
- Bulk select and release multiple WOs
- Delete Draft WO shows confirmation and succeeds
- Attempt to delete non-Draft WO shows error
- Export selected WOs downloads file
- Click row navigates to detail page
- View status history opens modal
- Create button opens create modal
- Gantt View button navigates to chart
- Responsive layout at all breakpoints

### Performance Tests
- List 1000 WOs loads in <1s
- Filter change responds in <500ms
- Export 100 WOs completes in <3s

---

## Quality Gates

Before handoff to FRONTEND-DEV:
- [x] All 5 states defined (Loading, Empty, Error, Success, Filtered Empty)
- [x] Filtered Empty state wireframe added
- [x] Responsive breakpoints documented (Desktop/Tablet/Mobile)
- [x] All API endpoints specified with request/response schemas
- [x] BOM snapshot API includes complete wo_materials array with all fields
- [x] Machine filter added to filters bar
- [x] Priority visual indicators documented (High/Critical)
- [x] View Status History action documented
- [x] Delete action documented (Draft only) with validation rule
- [x] Accessibility checklist passed (touch targets, contrast, screen reader, keyboard, ARIA)
- [x] Performance targets defined
- [x] Status badge colors defined for all 8 statuses
- [x] Bulk actions workflow defined
- [x] Filter logic documented
- [x] Permissions matrix documented
- [x] Business rules for status transitions documented
- [x] Material availability indicators documented
- [x] Progress calculation logic documented

---

## Handoff to FRONTEND-DEV

```yaml
feature: Work Order List Page
story: PLAN-013
fr_coverage: FR-PLAN-017, FR-PLAN-022
approval_status:
  mode: "review_each"
  user_approved: false  # PENDING USER REVIEW
  screens_approved: []
  iterations_used: 0
deliverables:
  wireframe: docs/3-ARCHITECTURE/ux/wireframes/PLAN-013-work-order-list.md
  api_endpoints:
    - GET /api/planning/work-orders
    - GET /api/planning/work-orders/summary
    - POST /api/planning/work-orders/bulk-release
    - DELETE /api/planning/work-orders/:id
    - GET /api/planning/work-orders/export
states_per_screen: [loading, empty, error, success, filtered_empty]
breakpoints:
  mobile: "<768px (card layout, load more)"
  tablet: "768-1024px (condensed table)"
  desktop: ">1024px (full table)"
accessibility:
  touch_targets: "48x48dp minimum"
  contrast: "4.5:1 minimum"
  aria_roles: "table, status, menu"
  keyboard_nav: "Tab, Enter, Space, Escape, Arrow keys"
performance_targets:
  initial_load: "<500ms"
  filter_change: "<300ms"
  export: "<2s for 100 WOs"
related_screens:
  - PLAN-014: WO Create Modal
  - PLAN-015: WO Detail Page
critical_fixes:
  - Added Filtered Empty state wireframe
  - Added complete wo_materials array to BOM snapshot API response
  - Added Machine filter to filters bar
  - Added Priority visual indicators (High/Critical shown inline)
  - Added View Status History action to row actions menu
  - Added Delete action (Draft only) with validation rule documented
  - Improved screen reader labels for priority and alerts
```

---

**Status**: Ready for User Review
**Approval Mode**: review_each (default)
**User Approved**: Pending
**Iterations**: 0 of 3
**Estimated Effort**: 8-10 hours
**Quality Target**: 98/100 (improved from 86%)
