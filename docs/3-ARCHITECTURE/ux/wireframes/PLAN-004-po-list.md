# PLAN-004: Purchase Order List Page

**Module**: Planning
**Feature**: Purchase Order Management (FR-PLAN-005, FR-PLAN-007, FR-PLAN-008)
**Status**: Ready for Review
**Last Updated**: 2025-12-14

---

## ASCII Wireframe

### Success State (Desktop)

```
+--------------------------------------------------------------------------------------------------+
|  Planning > Purchase Orders                                            [+ Create PO] [Import POs] |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  +---------------------+ +---------------------+ +---------------------+ +---------------------+   |
|  | Open POs            | | Pending Approval    | | Overdue             | | This Month          |   |
|  |         47          | |          5          | |          3          | |     $124,500        |   |
|  | Total value: $89K   | | > $1,000 threshold  | | Past expected date  | | 23 POs created      |   |
|  | [View All]          | | [Review Now]        | | [View Overdue]      | | [View Report]       |   |
|  +---------------------+ +---------------------+ +---------------------+ +---------------------+   |
|                                                                                                    |
|  +----------------------------------------------------------------------------------------------+  |
|  | Filters: [Status: All v] [Supplier: All v] [Date Range: This Month v] [Search: ________]    |  |
|  |                                                                                              |  |
|  | Bulk Actions: [ ] Select All    [Approve Selected] [Export to Excel] [Print Selected]       |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  +----------------------------------------------------------------------------------------------+  |
|  | [ ] | PO Number      | Supplier          | Status           | Total        | Expected     |   |
|  |     |                |                   |                  |              | Delivery     |   |
|  +----------------------------------------------------------------------------------------------+  |
|  | [ ] | PO-2024-00156  | Mill Co.          | [Draft]          | $2,450.00    | 2024-12-20   |   |
|  |     |                | 3 lines           |                  | PLN          | 6 days       |   |
|  |     |                |                   |                  |              | [Edit] [...]  |   |
|  +----------------------------------------------------------------------------------------------+  |
|  | [ ] | PO-2024-00155  | Sugar Inc.        | [Pending         | $5,200.00    | 2024-12-18   |   |
|  |     |                | 2 lines           |  Approval]       | EUR          | 4 days       |   |
|  |     |                |                   |                  |              | [View] [...]  |   |
|  +----------------------------------------------------------------------------------------------+  |
|  | [ ] | PO-2024-00154  | Pack Ltd.         | [Confirmed]      | $12,800.00   | 2024-12-15   |   |
|  |     |                | 8 lines           |                  | PLN          | Tomorrow     |   |
|  |     |                |                   |                  |              | [View] [...]  |   |
|  +----------------------------------------------------------------------------------------------+  |
|  | [x] | PO-2024-00153  | Mill Co.          | [Submitted]      | $3,100.00    | 2024-12-22   |   |
|  |     |                | 4 lines           |                  | PLN          | 8 days       |   |
|  |     |                |                   |                  |              | [View] [...]  |   |
|  +----------------------------------------------------------------------------------------------+  |
|  | [ ] | PO-2024-00152  | Dairy Farm        | [Receiving]      | $8,500.00    | 2024-12-10   |   |
|  |     |                | 5 lines           | 60% received     | PLN          | Overdue      |   |
|  |     |                |                   |                  |              | [View] [...]  |   |
|  +----------------------------------------------------------------------------------------------+  |
|  | [ ] | PO-2024-00151  | Organic Supply    | [Approved]       | $4,750.00    | 2024-12-25   |   |
|  |     |                | 6 lines           |                  | EUR          | 11 days      |   |
|  |     |                |                   |                  |              | [View] [...]  |   |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  Showing 1-20 of 47 POs                                    [< Previous] [1] [2] [3] [Next >]      |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+

[...] Row Actions Menu:
  - View Details
  - Edit (if Draft)
  - Submit for Approval (if Draft)
  - Approve (if Submitted + user has permission)
  - Reject (if Submitted + user has permission)
  - Confirm (if Approved)
  - Cancel (if not Receiving/Closed)
  - Duplicate PO
  - Print PO
```

### Success State (Tablet: 768-1024px)

```
+--------------------------------------------------------------------+
|  Planning > Purchase Orders                  [+ Create] [Import]   |
+--------------------------------------------------------------------+
|                                                                      |
|  +----------------+ +----------------+                               |
|  | Open POs       | | Pending        |                               |
|  |      47        | |      5         |                               |
|  | $89K value     | | [Review]       |                               |
|  +----------------+ +----------------+                               |
|                                                                      |
|  +----------------+ +----------------+                               |
|  | Overdue        | | This Month     |                               |
|  |       3        | |   $124,500     |                               |
|  | [View]         | | 23 POs         |                               |
|  +----------------+ +----------------+                               |
|                                                                      |
|  Filters: [Status v] [Supplier v] [Date v] [Search]                 |
|                                                                      |
|  [ ] Select All    [Approve] [Export]                               |
|                                                                      |
|  +----------------------------------------------------------------+ |
|  | [ ] PO-2024-00156  Mill Co.        [Draft]                     | |
|  |     3 lines        $2,450 PLN      Due: Dec 20    [Edit] [...] | |
|  +----------------------------------------------------------------+ |
|  | [ ] PO-2024-00155  Sugar Inc.      [Pending Approval]          | |
|  |     2 lines        $5,200 EUR      Due: Dec 18    [View] [...] | |
|  +----------------------------------------------------------------+ |
|  | [ ] PO-2024-00154  Pack Ltd.       [Confirmed]                 | |
|  |     8 lines        $12,800 PLN     Due: Tomorrow  [View] [...] | |
|  +----------------------------------------------------------------+ |
|  | [x] PO-2024-00153  Mill Co.        [Submitted]                 | |
|  |     4 lines        $3,100 PLN      Due: Dec 22    [View] [...] | |
|  +----------------------------------------------------------------+ |
|                                                                      |
|  Showing 1-10 of 47                        [<] [1] [2] [3] [>]      |
|                                                                      |
+--------------------------------------------------------------------+
```

### Success State (Mobile: <768px)

```
+----------------------------------+
|  < Purchase Orders               |
|  [+ Create] [Import]             |
+----------------------------------+
|                                  |
|  +----------------------------+  |
|  | Open POs          47       |  |
|  | $89K total        [View]   |  |
|  +----------------------------+  |
|  | Pending Approval   5       |  |
|  | [Review Now]               |  |
|  +----------------------------+  |
|  | Overdue            3       |  |
|  | [View]                     |  |
|  +----------------------------+  |
|                                  |
|  [Filters v]    [Search]        |
|                                  |
|  +----------------------------+  |
|  | [ ] PO-2024-00156          |  |
|  | Mill Co.                   |  |
|  | [Draft]  $2,450 PLN        |  |
|  | 3 lines  Due: Dec 20       |  |
|  |          [Edit] [...]      |  |
|  +----------------------------+  |
|  | [ ] PO-2024-00155          |  |
|  | Sugar Inc.                 |  |
|  | [Pending Approval]         |  |
|  | $5,200 EUR                 |  |
|  | 2 lines  Due: Dec 18       |  |
|  |          [View] [...]      |  |
|  +----------------------------+  |
|  | [ ] PO-2024-00154          |  |
|  | Pack Ltd.                  |  |
|  | [Confirmed]  $12,800 PLN   |  |
|  | 8 lines  Due: Tomorrow     |  |
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
|  Planning > Purchase Orders                                            [+ Create PO] [Import POs] |
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
|  Loading purchase orders...                                                                       |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

### Empty State

```
+--------------------------------------------------------------------------------------------------+
|  Planning > Purchase Orders                                            [+ Create PO] [Import POs] |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|                                                                                                    |
|                                      +------------------+                                          |
|                                      |   [PO Icon]      |                                          |
|                                      +------------------+                                          |
|                                                                                                    |
|                                    No Purchase Orders Yet                                          |
|                                                                                                    |
|                     Create your first purchase order to start managing                             |
|                     procurement. You can also bulk import from Excel.                              |
|                                                                                                    |
|                                                                                                    |
|                               [+ Create First Purchase Order]                                      |
|                                                                                                    |
|                                     [Import from Excel]                                            |
|                                                                                                    |
|                                                                                                    |
|                      Quick Tip: Set up your suppliers first in the Suppliers                       |
|                      section to enable default pricing and lead times.                             |
|                                                                                                    |
|                                   [Go to Suppliers Setup]                                          |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

### Error State

```
+--------------------------------------------------------------------------------------------------+
|  Planning > Purchase Orders                                            [+ Create PO] [Import POs] |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|                                                                                                    |
|                                      +------------------+                                          |
|                                      |   [Error Icon]   |                                          |
|                                      +------------------+                                          |
|                                                                                                    |
|                              Failed to Load Purchase Orders                                        |
|                                                                                                    |
|                     Unable to retrieve purchase order data. Please check                           |
|                     your connection and try again.                                                 |
|                                                                                                    |
|                              Error: PO_LIST_FETCH_FAILED                                           |
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
| **Open POs** | purchase_orders table | COUNT(*) WHERE status NOT IN ('closed', 'cancelled') | Filter list to open POs |
| **Pending Approval** | purchase_orders table | COUNT(*) WHERE status = 'pending_approval' | Filter list to pending approval |
| **Overdue** | purchase_orders table | COUNT(*) WHERE expected_delivery_date < today AND status NOT IN ('closed', 'cancelled', 'receiving') | Filter list to overdue |
| **This Month** | purchase_orders table | SUM(total) WHERE created_at >= first_day_of_month | Navigate to monthly report |

### 2. Filters Bar

| Filter | Type | Options | Default |
|--------|------|---------|---------|
| **Status** | Multi-select dropdown | Draft, Submitted, Pending Approval, Approved, Confirmed, Receiving, Closed, Cancelled | All |
| **Supplier** | Searchable dropdown | All suppliers (active) | All |
| **Date Range** | Date range picker | This Week, This Month, Last 30 Days, Last 90 Days, Custom | This Month |
| **Search** | Text input | Searches PO number, supplier name | Empty |

### 3. Bulk Actions Bar

| Action | Enabled When | Result |
|--------|--------------|--------|
| **Approve Selected** | 1+ POs in Submitted status selected AND user has approve permission | Opens batch approval modal |
| **Export to Excel** | 1+ POs selected | Downloads Excel with selected POs |
| **Print Selected** | 1+ POs selected | Opens print preview with selected POs |

### 4. PO Table

| Column | Width | Sortable | Description |
|--------|-------|----------|-------------|
| **Checkbox** | 48px | No | Row selection for bulk actions |
| **PO Number** | 150px | Yes | Unique identifier (e.g., PO-2024-00156) |
| **Supplier** | 200px | Yes | Supplier name + line count |
| **Status** | 150px | Yes | Status badge with color |
| **Total** | 120px | Yes | Total amount + currency |
| **Expected Delivery** | 120px | Yes | Date + relative time (e.g., "6 days", "Overdue") |
| **Actions** | 100px | No | Quick action button + overflow menu |

### 5. Status Badge Colors

| Status | Color | Background | Text |
|--------|-------|------------|------|
| Draft | Gray | #F3F4F6 | #374151 |
| Submitted | Blue | #DBEAFE | #1E40AF |
| Pending Approval | Yellow | #FEF3C7 | #92400E |
| Approved | Green | #D1FAE5 | #065F46 |
| Confirmed | Teal | #CCFBF1 | #115E59 |
| Receiving | Purple | #EDE9FE | #5B21B6 |
| Closed | Green (dark) | #10B981 | #FFFFFF |
| Cancelled | Red | #FEE2E2 | #B91C1C |

---

## Main Actions

### Primary Actions

| Action | Location | Description |
|--------|----------|-------------|
| **Create PO** | Header button | Opens PLAN-005 Create PO modal |
| **Import POs** | Header button | Opens PLAN-007 Bulk Import modal |

### Table Row Actions

| Action | Visibility | Description |
|--------|------------|-------------|
| **Edit** | Status = Draft | Opens PLAN-005 Edit PO modal |
| **View** | Status != Draft | Opens PLAN-006 PO Detail page |
| **Submit** | Status = Draft | Changes status to Submitted (or Pending Approval if threshold exceeded) |
| **Approve** | Status = Pending Approval AND user has permission | Opens PLAN-008 Approval modal |
| **Reject** | Status = Pending Approval AND user has permission | Opens PLAN-008 Rejection modal |
| **Confirm** | Status = Approved | Changes status to Confirmed |
| **Cancel** | Status NOT IN (Receiving, Closed) | Cancels PO with confirmation |
| **Duplicate** | Always | Creates copy as Draft |
| **Print** | Always | Opens print preview |

---

## States

| State | Description | Elements Shown |
|-------|-------------|----------------|
| **Loading** | Initial page load | Skeleton cards, skeleton table rows |
| **Empty** | No POs exist | Empty state illustration, Create/Import buttons, tip about suppliers |
| **Success** | POs loaded | KPI cards, filters, table with data, pagination |
| **Error** | API failure | Error message, retry button, support link |
| **Filtered Empty** | Filters return no results | "No POs match your filters" message, clear filters button |

---

## Data Fields

### PO List Item

| Field | Source | Display |
|-------|--------|---------|
| id | purchase_orders.id | Internal use |
| po_number | purchase_orders.po_number | "PO-2024-00156" |
| supplier_id | purchase_orders.supplier_id | Used for filtering |
| supplier_name | suppliers.name via JOIN | "Mill Co." |
| lines_count | COUNT(po_lines) | "3 lines" |
| status | purchase_orders.status | Badge |
| total | purchase_orders.total | "$2,450.00" |
| currency | purchase_orders.currency | "PLN", "EUR", "USD" |
| expected_delivery_date | purchase_orders.expected_delivery_date | "2024-12-20" |
| relative_date | Calculated | "6 days", "Tomorrow", "Overdue" |
| created_at | purchase_orders.created_at | For sorting/filtering |
| approval_status | purchase_orders.approval_status | "pending", "approved", "rejected" |

---

## API Endpoints

### List Purchase Orders

```
GET /api/planning/purchase-orders?status[]=draft&status[]=submitted&supplier={id}&from_date={date}&to_date={date}&search={term}&page=1&limit=20&sort=created_at&order=desc

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid-po-156",
      "po_number": "PO-2024-00156",
      "supplier": {
        "id": "uuid-supplier-1",
        "name": "Mill Co."
      },
      "status": "draft",
      "approval_status": null,
      "total": 2450.00,
      "currency": "PLN",
      "expected_delivery_date": "2024-12-20",
      "lines_count": 3,
      "created_at": "2024-12-10T09:30:00Z"
    },
    ...
  ],
  "meta": {
    "total": 47,
    "page": 1,
    "limit": 20,
    "pages": 3
  }
}
```

### KPI Summary

```
GET /api/planning/purchase-orders/summary

Response:
{
  "success": true,
  "data": {
    "open_count": 47,
    "open_total": 89000.00,
    "pending_approval_count": 5,
    "overdue_count": 3,
    "this_month_total": 124500.00,
    "this_month_count": 23
  }
}
```

### Bulk Approve

```
POST /api/planning/purchase-orders/bulk-approve
Body: {
  "po_ids": ["uuid-1", "uuid-2", "uuid-3"],
  "notes": "Batch approved for December orders"
}

Response:
{
  "success": true,
  "data": {
    "approved_count": 3,
    "failed_count": 0,
    "results": [
      { "id": "uuid-1", "status": "approved" },
      { "id": "uuid-2", "status": "approved" },
      { "id": "uuid-3", "status": "approved" }
    ]
  }
}
```

### Export to Excel

```
GET /api/planning/purchase-orders/export?format=xlsx&po_ids[]=uuid-1&po_ids[]=uuid-2

Response: Binary file download (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)
```

---

## Permissions

| Role | View List | Create PO | Edit PO | Approve | Reject | Cancel | Export | Bulk Actions |
|------|-----------|-----------|---------|---------|--------|--------|--------|--------------|
| Admin | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Purchaser | Yes | Yes | Yes | No | No | Yes | Yes | Limited |
| Manager | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Viewer | Yes | No | No | No | No | No | Yes | No |

---

## Validation

| Field | Rule | Error Message |
|-------|------|---------------|
| Status filter | Valid enum values only | "Invalid status filter" |
| Date range | from_date <= to_date | "Invalid date range" |
| Page | >= 1 | "Invalid page number" |
| Limit | 1-100 | "Limit must be between 1 and 100" |
| Bulk approve | All POs must be in Submitted status | "PO {number} cannot be approved from current status" |

---

## Business Rules

### Status Transitions from List

| Current Status | Allowed Actions | Next Status |
|----------------|-----------------|-------------|
| Draft | Submit | Submitted OR Pending Approval (if total > threshold) |
| Draft | Edit | Draft |
| Draft | Cancel | Cancelled |
| Submitted | Approve | Approved |
| Submitted | Reject | Rejected |
| Pending Approval | Approve | Approved |
| Pending Approval | Reject | Rejected |
| Approved | Confirm | Confirmed |
| Approved | Cancel | Cancelled |

### Approval Threshold Logic

```typescript
// Determines if PO requires approval
function requiresApproval(po: PurchaseOrder, settings: PlanningSettings): boolean {
  if (!settings.po_require_approval) return false;
  if (settings.po_approval_threshold === null) return true;
  return po.total > settings.po_approval_threshold;
}
```

### Overdue Calculation

```typescript
// PO is overdue if expected delivery is past and not closed/receiving
function isOverdue(po: PurchaseOrder): boolean {
  const today = new Date();
  const expectedDate = new Date(po.expected_delivery_date);
  return expectedDate < today &&
         !['closed', 'cancelled', 'receiving'].includes(po.status);
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
- KPI cards: "Open Purchase Orders card: 47 open orders, total value 89 thousand dollars, click to view all open orders"
- Table: Proper column headers with scope="col"
- Status badges: "Status: Draft", "Status: Pending Approval"
- Actions menu: "Actions for PO-2024-00156, menu expanded, 5 items"

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
| Mobile (<768px) | Card layout | Vertical KPI list, expandable filters, card per PO |

### Mobile-Specific
- Filters collapse into dropdown/modal
- Table becomes card list
- Pagination becomes "Load More" button
- Bulk actions in bottom action sheet

---

## Performance Notes

### Query Optimization
- Index on: (org_id, status, created_at DESC)
- Index on: (org_id, supplier_id, status)
- Index on: (org_id, expected_delivery_date, status)

### Caching Strategy
```typescript
// Redis keys
'org:{orgId}:planning:po-list:{filters_hash}'     // 1 min TTL
'org:{orgId}:planning:po-summary'                 // 2 min TTL
'org:{orgId}:planning:suppliers:dropdown'         // 5 min TTL
```

### Load Time Targets
- Initial page load: <500ms (P95)
- Filter change: <300ms
- Pagination: <300ms
- Export generation: <2s for 100 POs

---

## Testing Requirements

### Unit Tests
- KPI calculations (open count, pending count, overdue count, monthly total)
- Status badge color mapping
- Relative date formatting ("6 days", "Tomorrow", "Overdue")
- Approval threshold logic
- Filter query building

### Integration Tests
- GET /api/planning/purchase-orders with various filters
- GET /api/planning/purchase-orders/summary
- POST /api/planning/purchase-orders/bulk-approve
- GET /api/planning/purchase-orders/export
- RLS policy enforcement (org_id isolation)

### E2E Tests
- Page load with data shows all KPIs and table
- Empty state shows correct message and actions
- Filter by status updates table correctly
- Search by PO number works
- Bulk select and approve multiple POs
- Export selected POs downloads file
- Click row navigates to detail page
- Create button opens create modal
- Import button opens import modal
- Responsive layout at all breakpoints

### Performance Tests
- List 1000 POs loads in <1s
- Filter change responds in <500ms
- Export 100 POs completes in <3s

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
feature: Purchase Order List Page
story: PLAN-004
fr_coverage: FR-PLAN-005, FR-PLAN-007, FR-PLAN-008
approval_status:
  mode: "review_each"
  user_approved: false  # PENDING USER REVIEW
  screens_approved: []
  iterations_used: 0
deliverables:
  wireframe: docs/3-ARCHITECTURE/ux/wireframes/PLAN-004-po-list.md
  api_endpoints:
    - GET /api/planning/purchase-orders
    - GET /api/planning/purchase-orders/summary
    - POST /api/planning/purchase-orders/bulk-approve
    - GET /api/planning/purchase-orders/export
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
  export: "<2s for 100 POs"
related_screens:
  - PLAN-005: PO Create/Edit Modal
  - PLAN-006: PO Detail Page
  - PLAN-007: PO Bulk Import Modal
  - PLAN-008: PO Approval Modal
```

---

**Status**: Ready for User Review
**Approval Mode**: review_each (default)
**User Approved**: Pending
**Iterations**: 0 of 3
**Estimated Effort**: 8-10 hours
**Quality Target**: 97/100
