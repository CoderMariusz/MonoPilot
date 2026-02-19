# PLAN-010: Transfer Order List Page

**Module**: Planning
**Feature**: Transfer Order Management (FR-PLAN-012, FR-PLAN-014)
**Status**: Ready for Review
**Last Updated**: 2025-12-14

---

## ASCII Wireframe

### Success State (Desktop)

```
+--------------------------------------------------------------------------------------------------+
|  Planning > Transfer Orders                                                   [+ Create TO]       |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  +---------------------+ +---------------------+ +---------------------+ +---------------------+   |
|  | Open TOs            | | In Transit          | | Overdue             | | This Week           |   |
|  |         18          | |          7          | |          2          | |     24              |   |
|  | Active transfers    | | Shipped, not recv'd | | Past planned date   | | TOs created         |   |
|  | [View All]          | | [Track]             | | [View Overdue]      | | [View Report]       |   |
|  +---------------------+ +---------------------+ +---------------------+ +---------------------+   |
|                                                                                                    |
|  +----------------------------------------------------------------------------------------------+  |
|  | Filters: [Status: All v] [From WH: All v] [To WH: All v] [Search: ________]                |  |
|  |                                                                                              |  |
|  | Bulk Actions: [ ] Select All    [Ship Selected] [Export to Excel] [Print Selected]         |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  +----------------------------------------------------------------------------------------------+  |
|  | [ ] | TO Number      | From -> To        | Status           | Lines    | Planned Ship   |   |
|  |     |                | Warehouses        |                  |          | Date           |   |
|  +----------------------------------------------------------------------------------------------+  |
|  | [ ] | TO-2024-00042  | Main -> Branch-A  | [Draft]          | 3 lines  | 2024-12-20     |   |
|  |     |                |                   |                  |          | 6 days         |   |
|  |     |                |                   |                  |          | [Edit] [...]   |   |
|  +----------------------------------------------------------------------------------------------+  |
|  | [ ] | TO-2024-00041  | Main -> Branch-B  | [Planned]        | 5 lines  | 2024-12-18     |   |
|  |     |                |                   |                  |          | 4 days         |   |
|  |     |                |                   |                  |          | [View] [...]   |   |
|  +----------------------------------------------------------------------------------------------+  |
|  | [ ] | TO-2024-00040  | Branch-A -> Main  | [Shipped]        | 2 lines  | 2024-12-15     |   |
|  |     |                |                   | 100% shipped     |          | In transit     |   |
|  |     |                |                   |                  |          | [View] [...]   |   |
|  +----------------------------------------------------------------------------------------------+  |
|  | [x] | TO-2024-00039  | Main -> Branch-C  | [Partially       | 4 lines  | 2024-12-14     |   |
|  |     |                |                   |  Shipped]        |          | Yesterday      |   |
|  |     |                |                   | 60% shipped      |          | [View] [...]   |   |
|  +----------------------------------------------------------------------------------------------+  |
|  | [ ] | TO-2024-00038  | Branch-B -> Main  | [Received]       | 6 lines  | 2024-12-10     |   |
|  |     |                |                   | 100% received    |          | Complete       |   |
|  |     |                |                   |                  |          | [View] [...]   |   |
|  +----------------------------------------------------------------------------------------------+  |
|  | [ ] | TO-2024-00037  | Main -> Branch-A  | [Closed]         | 3 lines  | 2024-12-08     |   |
|  |     |                |                   |                  |          | Closed         |   |
|  |     |                |                   |                  |          | [View] [...]   |   |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  Showing 1-20 of 18 TOs                                    [< Previous] [1] [2] [Next >]          |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+

[...] Row Actions Menu:
  - View Details
  - Edit (if Draft)
  - Release (if Draft)
  - Ship (if Planned)
  - Receive (if Shipped/Partially Shipped)
  - Cancel (if not Received/Closed)
  - Duplicate TO
  - Print TO
```

### Success State (Tablet: 768-1024px)

```
+--------------------------------------------------------------------+
|  Planning > Transfer Orders                         [+ Create TO]  |
+--------------------------------------------------------------------+
|                                                                      |
|  +----------------+ +----------------+                               |
|  | Open TOs       | | In Transit     |                               |
|  |      18        | |      7         |                               |
|  | [View All]     | | [Track]        |                               |
|  +----------------+ +----------------+                               |
|                                                                      |
|  +----------------+ +----------------+                               |
|  | Overdue        | | This Week      |                               |
|  |       2        | |      24        |                               |
|  | [View]         | | [View]         |                               |
|  +----------------+ +----------------+                               |
|                                                                      |
|  Filters: [Status v] [From WH v] [To WH v] [Search]                 |
|                                                                      |
|  [ ] Select All    [Ship] [Export]                                  |
|                                                                      |
|  +----------------------------------------------------------------+ |
|  | [ ] TO-2024-00042  Main -> Branch-A    [Draft]                 | |
|  |     3 lines        Planned: Dec 20               [Edit] [...]  | |
|  +----------------------------------------------------------------+ |
|  | [ ] TO-2024-00041  Main -> Branch-B    [Planned]               | |
|  |     5 lines        Planned: Dec 18               [View] [...]  | |
|  +----------------------------------------------------------------+ |
|  | [ ] TO-2024-00040  Branch-A -> Main    [Shipped]               | |
|  |     2 lines        In transit                    [View] [...]  | |
|  +----------------------------------------------------------------+ |
|  | [x] TO-2024-00039  Main -> Branch-C    [Partially Shipped]     | |
|  |     4 lines (60%)  Planned: Dec 14               [View] [...]  | |
|  +----------------------------------------------------------------+ |
|                                                                      |
|  Showing 1-10 of 18                        [<] [1] [2] [>]          |
|                                                                      |
+--------------------------------------------------------------------+
```

### Success State (Mobile: <768px)

```
+----------------------------------+
|  < Transfer Orders               |
|  [+ Create TO]                   |
+----------------------------------+
|                                  |
|  +----------------------------+  |
|  | Open TOs          18       |  |
|  | Active            [View]   |  |
|  +----------------------------+  |
|  | In Transit         7       |  |
|  | [Track]                    |  |
|  +----------------------------+  |
|  | Overdue            2       |  |
|  | [View]                     |  |
|  +----------------------------+  |
|                                  |
|  [Filters v]    [Search]        |
|                                  |
|  +----------------------------+  |
|  | [ ] TO-2024-00042          |  |
|  | Main -> Branch-A           |  |
|  | [Draft]                    |  |
|  | 3 lines  Due: Dec 20       |  |
|  |          [Edit] [...]      |  |
|  +----------------------------+  |
|  | [ ] TO-2024-00041          |  |
|  | Main -> Branch-B           |  |
|  | [Planned]                  |  |
|  | 5 lines  Due: Dec 18       |  |
|  |          [View] [...]      |  |
|  +----------------------------+  |
|  | [ ] TO-2024-00040          |  |
|  | Branch-A -> Main           |  |
|  | [Shipped]  In transit      |  |
|  | 2 lines                    |  |
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
|  Planning > Transfer Orders                                                   [+ Create TO]       |
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
|  | [================================================================================]          |  |
|  | [====================================================]                                      |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  Loading transfer orders...                                                                       |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

### Empty State

```
+--------------------------------------------------------------------------------------------------+
|  Planning > Transfer Orders                                                   [+ Create TO]       |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|                                                                                                    |
|                                      +------------------+                                          |
|                                      |   [TO Icon]      |                                          |
|                                      +------------------+                                          |
|                                                                                                    |
|                                    No Transfer Orders Yet                                          |
|                                                                                                    |
|                     Create your first transfer order to move inventory                            |
|                     between warehouses. Track shipments and receipts easily.                      |
|                                                                                                    |
|                                                                                                    |
|                               [+ Create First Transfer Order]                                      |
|                                                                                                    |
|                                                                                                    |
|                                                                                                    |
|                      Quick Tip: Make sure you have multiple warehouses configured                  |
|                      in Settings to enable inter-warehouse transfers.                              |
|                                                                                                    |
|                                   [Go to Warehouse Settings]                                       |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

### Error State

```
+--------------------------------------------------------------------------------------------------+
|  Planning > Transfer Orders                                                   [+ Create TO]       |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|                                                                                                    |
|                                      +------------------+                                          |
|                                      |   [Error Icon]   |                                          |
|                                      +------------------+                                          |
|                                                                                                    |
|                              Failed to Load Transfer Orders                                        |
|                                                                                                    |
|                     Unable to retrieve transfer order data. Please check                           |
|                     your connection and try again.                                                 |
|                                                                                                    |
|                              Error: TO_LIST_FETCH_FAILED                                           |
|                                                                                                    |
|                                                                                                    |
|                              [Retry]    [Contact Support]                                          |
|                                                                                                    |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

---

## Key Components

### 1. KPI Summary Cards (4 Cards)

| Card | Data Source | Calculation | Click Action |
|------|-------------|-------------|--------------|
| **Open TOs** | transfer_orders table | COUNT(*) WHERE status NOT IN ('closed', 'cancelled') | Filter list to open TOs |
| **In Transit** | transfer_orders table | COUNT(*) WHERE status IN ('shipped', 'partially_shipped') | Filter list to in transit |
| **Overdue** | transfer_orders table | COUNT(*) WHERE planned_ship_date < today AND status IN ('draft', 'planned') | Filter list to overdue |
| **This Week** | transfer_orders table | COUNT(*) WHERE created_at >= start_of_week | Show weekly report |

### 2. Filters Bar

| Filter | Type | Options | Default |
|--------|------|---------|---------|
| **Status** | Multi-select dropdown | Draft, Planned, Partially Shipped, Shipped, Partially Received, Received, Closed, Cancelled | All |
| **From Warehouse** | Searchable dropdown | All warehouses | All |
| **To Warehouse** | Searchable dropdown | All warehouses | All |
| **Search** | Text input | Searches TO number, warehouse names | Empty |

### 3. Bulk Actions Bar

| Action | Enabled When | Result |
|--------|--------------|--------|
| **Ship Selected** | 1+ TOs in Planned status selected | Opens batch ship modal |
| **Export to Excel** | 1+ TOs selected | Downloads Excel with selected TOs |
| **Print Selected** | 1+ TOs selected | Opens print preview with selected TOs |

### 4. TO Table

| Column | Width | Sortable | Description |
|--------|-------|----------|-------------|
| **Checkbox** | 48px | No | Row selection for bulk actions |
| **TO Number** | 150px | Yes | Unique identifier (e.g., TO-2024-00042) |
| **From -> To** | 250px | Yes | Source and destination warehouses |
| **Status** | 150px | Yes | Status badge with progress % |
| **Lines** | 100px | No | Number of line items |
| **Planned Ship Date** | 150px | Yes | Date + relative time (e.g., "6 days", "In transit") |
| **Actions** | 100px | No | Quick action button + overflow menu |

### 5. Status Badge Colors

| Status | Color | Background | Text |
|--------|-------|------------|------|
| Draft | Gray | #F3F4F6 | #374151 |
| Planned | Blue | #DBEAFE | #1E40AF |
| Partially Shipped | Orange | #FED7AA | #C2410C |
| Shipped | Purple | #EDE9FE | #5B21B6 |
| Partially Received | Amber | #FEF3C7 | #92400E |
| Received | Green | #D1FAE5 | #065F46 |
| Closed | Green (dark) | #10B981 | #FFFFFF |
| Cancelled | Red | #FEE2E2 | #B91C1C |

---

## Main Actions

### Primary Actions

| Action | Location | Description |
|--------|----------|-------------|
| **Create TO** | Header button | Opens PLAN-011 Create TO modal |

### Table Row Actions

| Action | Visibility | Description |
|--------|------------|-------------|
| **Edit** | Status = Draft | Opens PLAN-011 Edit TO modal |
| **View** | Status != Draft | Opens PLAN-012 TO Detail page |
| **Release** | Status = Draft | Changes status to Planned |
| **Ship** | Status = Planned | Opens Ship TO modal (warehouse module) |
| **Receive** | Status IN (Shipped, Partially Shipped) | Opens Receive TO modal (warehouse module) |
| **Cancel** | Status NOT IN (Received, Closed) | Cancels TO with confirmation |
| **Duplicate** | Always | Creates copy as Draft |
| **Print** | Always | Opens print preview |

---

## States

| State | Description | Elements Shown |
|-------|-------------|----------------|
| **Loading** | Initial page load | Skeleton cards, skeleton table rows |
| **Empty** | No TOs exist | Empty state illustration, Create button, tip about warehouses |
| **Success** | TOs loaded | KPI cards, filters, table with data, pagination |
| **Error** | API failure | Error message, retry button, support link |
| **Filtered Empty** | Filters return no results | "No TOs match your filters" message, clear filters button |

---

## Data Fields

### TO List Item

| Field | Source | Display |
|-------|--------|---------|
| id | transfer_orders.id | Internal use |
| to_number | transfer_orders.to_number | "TO-2024-00042" |
| from_warehouse_id | transfer_orders.from_warehouse_id | Used for filtering |
| from_warehouse_name | warehouses.name via JOIN | "Main" |
| to_warehouse_id | transfer_orders.to_warehouse_id | Used for filtering |
| to_warehouse_name | warehouses.name via JOIN | "Branch-A" |
| lines_count | COUNT(to_lines) | "3 lines" |
| status | transfer_orders.status | Badge |
| shipped_percent | Calculated | "60% shipped" (for partial statuses) |
| planned_ship_date | transfer_orders.planned_ship_date | "2024-12-20" |
| relative_date | Calculated | "6 days", "Yesterday", "In transit" |
| created_at | transfer_orders.created_at | For sorting/filtering |

---

## API Endpoints

### List Transfer Orders

```
GET /api/planning/transfer-orders?status[]=draft&status[]=planned&from_warehouse={id}&to_warehouse={id}&search={term}&page=1&limit=20&sort=planned_ship_date&order=asc

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid-to-42",
      "to_number": "TO-2024-00042",
      "from_warehouse": {
        "id": "uuid-wh-main",
        "code": "WH-MAIN",
        "name": "Main"
      },
      "to_warehouse": {
        "id": "uuid-wh-branch-a",
        "code": "WH-BRANCH-A",
        "name": "Branch-A"
      },
      "status": "draft",
      "planned_ship_date": "2024-12-20",
      "planned_receive_date": "2024-12-22",
      "lines_count": 3,
      "shipped_qty": 0,
      "total_qty": 150,
      "shipped_percent": 0,
      "created_at": "2024-12-14T09:30:00Z"
    },
    ...
  ],
  "meta": {
    "total": 18,
    "page": 1,
    "limit": 20,
    "pages": 1
  }
}
```

### KPI Summary

```
GET /api/planning/transfer-orders/summary

Response:
{
  "success": true,
  "data": {
    "open_count": 18,
    "in_transit_count": 7,
    "overdue_count": 2,
    "this_week_count": 24
  }
}
```

### Bulk Ship

```
POST /api/planning/transfer-orders/bulk-ship
Body: {
  "to_ids": ["uuid-1", "uuid-2"],
  "actual_ship_date": "2024-12-14",
  "shipped_by": "uuid-user-1",
  "notes": "Shipped via truck #42"
}

Response:
{
  "success": true,
  "data": {
    "shipped_count": 2,
    "failed_count": 0,
    "results": [
      { "id": "uuid-1", "status": "shipped" },
      { "id": "uuid-2", "status": "shipped" }
    ]
  }
}
```

### Export to Excel

```
GET /api/planning/transfer-orders/export?format=xlsx&to_ids[]=uuid-1&to_ids[]=uuid-2

Response: Binary file download (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)
```

---

## Permissions

| Role | View List | Create TO | Edit TO | Ship | Receive | Cancel | Export | Bulk Actions |
|------|-----------|-----------|---------|------|---------|--------|--------|--------------|
| Admin | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Warehouse Manager | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Warehouse Staff | Yes | No | No | Yes | Yes | No | Yes | Limited |
| Viewer | Yes | No | No | No | No | No | Yes | No |

---

## Validation

| Field | Rule | Error Message |
|-------|------|---------------|
| Status filter | Valid enum values only | "Invalid status filter" |
| Date range | from_date <= to_date | "Invalid date range" |
| Page | >= 1 | "Invalid page number" |
| Limit | 1-100 | "Limit must be between 1 and 100" |
| Bulk ship | All TOs must be in Planned status | "TO {number} cannot be shipped from current status" |

---

## Business Rules

### Status Transitions from List

| Current Status | Allowed Actions | Next Status |
|----------------|-----------------|-------------|
| Draft | Release | Planned |
| Draft | Edit | Draft |
| Draft | Cancel | Cancelled |
| Planned | Ship | Shipped OR Partially Shipped (if partial allowed) |
| Shipped | Receive | Received |
| Partially Shipped | Ship More | Shipped |
| Partially Shipped | Receive | Received OR Partially Received |

### Overdue Calculation

```typescript
// TO is overdue if planned ship date is past and not yet shipped/received
function isOverdue(to: TransferOrder): boolean {
  const today = new Date();
  const plannedDate = new Date(to.planned_ship_date);
  return plannedDate < today &&
         ['draft', 'planned'].includes(to.status);
}
```

### Shipped Percent Calculation

```typescript
// Calculate percentage shipped for partial shipment statuses
function calculateShippedPercent(to: TransferOrder): number {
  if (to.total_qty === 0) return 0;
  return (to.shipped_qty / to.total_qty) * 100;
}
```

---

## Accessibility

### Touch Targets
- All buttons: minimum 48x48dp
- Table row click area: full row height (64px)
- Checkbox click area: 48x48dp
- Actions menu items: 48dp height

### Contrast
- Text on badges: 4.5:1 minimum
- Table text: 4.5:1 minimum
- Action buttons: 4.5:1 minimum

### Screen Reader
- KPI cards: "Open Transfer Orders card: 18 active transfers, click to view all open transfer orders"
- Table: Proper column headers with scope="col"
- Status badges: "Status: Draft", "Status: Shipped"
- Actions menu: "Actions for TO-2024-00042, menu expanded, 5 items"

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
| Mobile (<768px) | Card layout | Vertical KPI list, expandable filters, card per TO |

### Mobile-Specific
- Filters collapse into dropdown/modal
- Table becomes card list
- Pagination becomes "Load More" button
- Bulk actions in bottom action sheet

---

## Performance Notes

### Query Optimization
- Index on: (org_id, status, planned_ship_date ASC)
- Index on: (org_id, from_warehouse_id, status)
- Index on: (org_id, to_warehouse_id, status)

### Caching Strategy
```typescript
// Redis keys
'org:{orgId}:planning:to-list:{filters_hash}'     // 1 min TTL
'org:{orgId}:planning:to-summary'                 // 2 min TTL
'org:{orgId}:warehouses:dropdown'                 // 5 min TTL
```

### Load Time Targets
- Initial page load: <500ms (P95)
- Filter change: <300ms
- Pagination: <300ms
- Export generation: <2s for 100 TOs

---

## Testing Requirements

### Unit Tests
- KPI calculations (open count, in transit count, overdue count)
- Status badge color mapping
- Relative date formatting ("6 days", "In transit", "Overdue")
- Shipped percent calculation
- Filter query building

### Integration Tests
- GET /api/planning/transfer-orders with various filters
- GET /api/planning/transfer-orders/summary
- POST /api/planning/transfer-orders/bulk-ship
- GET /api/planning/transfer-orders/export
- RLS policy enforcement (org_id isolation)

### E2E Tests
- Page load with data shows all KPIs and table
- Empty state shows correct message and actions
- Filter by status updates table correctly
- Search by TO number works
- Bulk select and ship multiple TOs
- Export selected TOs downloads file
- Click row navigates to detail page
- Create button opens create modal
- Responsive layout at all breakpoints

### Performance Tests
- List 1000 TOs loads in <1s
- Filter change responds in <500ms
- Export 100 TOs completes in <3s

---

## Quality Gates

Before handoff to FRONTEND-DEV:
- [x] All 4 states defined (Loading, Empty, Error, Success)
- [x] Responsive breakpoints documented (Desktop/Tablet/Mobile)
- [x] All API endpoints specified with request/response schemas
- [x] Accessibility checklist passed (touch targets, contrast, screen reader, keyboard, ARIA)
- [x] Performance targets defined
- [x] Status badge colors defined for all 8 statuses
- [x] Bulk actions workflow defined
- [x] Filter logic documented
- [x] Permissions matrix documented
- [x] Business rules for status transitions documented

---

## Handoff to FRONTEND-DEV

```yaml
feature: Transfer Order List Page
story: PLAN-010
fr_coverage: FR-PLAN-012, FR-PLAN-014
approval_status:
  mode: "review_each"
  user_approved: false  # PENDING USER REVIEW
  screens_approved: []
  iterations_used: 0
deliverables:
  wireframe: docs/3-ARCHITECTURE/ux/wireframes/PLAN-010-transfer-order-list.md
  api_endpoints:
    - GET /api/planning/transfer-orders
    - GET /api/planning/transfer-orders/summary
    - POST /api/planning/transfer-orders/bulk-ship
    - GET /api/planning/transfer-orders/export
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
  export: "<2s for 100 TOs"
related_screens:
  - PLAN-011: TO Create/Edit Modal
  - PLAN-012: TO Detail Page
```

---

**Status**: Ready for User Review
**Approval Mode**: review_each (default)
**User Approved**: Pending
**Iterations**: 0 of 3
**Estimated Effort**: 6-8 hours
**Quality Target**: 97/100
