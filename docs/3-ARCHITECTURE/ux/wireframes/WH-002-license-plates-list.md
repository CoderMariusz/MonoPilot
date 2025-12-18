# WH-002: License Plates List Page

**Module**: Warehouse
**Feature**: LP Tracking (WH-FR-002)
**Status**: Ready for Review
**Last Updated**: 2025-12-14

---

## ASCII Wireframe

### Success State (Desktop)

```
+--------------------------------------------------------------------------------------------------+
|  Warehouse > License Plates                                            [+ Create LP] [Print Labels] |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  +---------------------+ +---------------------+ +---------------------+ +---------------------+   |
|  | Total LPs           | | Available           | | Expiring Soon       | | QA Pending          |   |
|  |       1,247         | |         823         | |          18         | |          23         |   |
|  | 23,450 units        | | 18,900 units        | | < 30 days           | | Require approval    |   |
|  | [View All]          | | [View Available]    | | [View Expiring]     | | [Review QA]         |   |
|  +---------------------+ +---------------------+ +---------------------+ +---------------------+   |
|                                                                                                    |
|  +----------------------------------------------------------------------------------------------+  |
|  | Filters: [Warehouse: All v] [Location: All v] [Product: All v] [Status: All v]              |  |
|  |          [QA Status: All v] [Batch: _______] [Expiry Range: _______ to _______]             |  |
|  |          [Search LP Number: _______________]                                                 |  |
|  |                                                                                              |  |
|  | Bulk Actions: [ ] Select All    [Move Selected] [Change QA Status] [Print Labels]           |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  +----------------------------------------------------------------------------------------------+  |
|  | [ ] | LP Number          | Product           | Qty     | Location        | Status   | QA      |   |
|  |     |                    |                   | (UoM)   | (Warehouse)     |          | Status  |   |
|  +----------------------------------------------------------------------------------------------+  |
|  | [ ] | LP20251201-000123  | Flour Type 00     | 500.0   | A-01-02         | [Avail]  | [Pass]  |   |
|  |     |                    | Batch: BCH-456    | kg      | Main Warehouse  |          |         |   |
|  |     |                    | Exp: 2025-06-15   |         |                 |          | [...] |   |
|  +----------------------------------------------------------------------------------------------+  |
|  | [ ] | LP20251201-000122  | Sugar White       | 1000.0  | A-02-03         | [Avail]  | [Pass]  |   |
|  |     |                    | Batch: BCH-455    | kg      | Main Warehouse  |          |         |   |
|  |     |                    | Exp: 2026-02-28   |         |                 |          | [...] |   |
|  +----------------------------------------------------------------------------------------------+  |
|  | [ ] | LP20251130-000098  | Milk 3.2%         | 240.0   | B-01-05         | [Avail]  | [Pend]  |   |
|  |     |                    | Batch: MILK-789   | L       | Cold Storage    |          |         |   |
|  |     |                    | Exp: 2024-12-20   |         |                 |          | [...] |   |
|  +----------------------------------------------------------------------------------------------+  |
|  | [ ] | LP20251130-000097  | Butter Unsalted   | 150.0   | B-02-01         | [Rsrvd]  | [Pass]  |   |
|  |     |                    | Batch: BUT-234    | kg      | Cold Storage    |          |         |   |
|  |     |                    | Exp: 2025-03-15   |         | WO-2024-00567   |          | [...] |   |
|  +----------------------------------------------------------------------------------------------+  |
|  | [ ] | LP20251128-000085  | Eggs Large        | 720.0   | A-05-01         | [Block]  | [Fail]  |   |
|  |     |                    | Batch: EGG-901    | ea      | Main Warehouse  |          |         |   |
|  |     |                    | Exp: 2024-12-18   |         |                 |          | [...] |   |
|  +----------------------------------------------------------------------------------------------+  |
|  | [ ] | LP20251128-000084  | Cheese Cheddar    | 80.5    | B-03-02         | [Avail]  | [Pass]  |   |
|  |     |                    | Batch: CHZ-567    | kg      | Cold Storage    |          |         |   |
|  |     |                    | Exp: 2025-01-10   |         | CW: 82.3 kg     |          | [...] |   |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  Showing 1-50 of 1,247 LPs                                    [< Previous] [1] [2] ... [25] [Next >] |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+

[...] Row Actions Menu:
  - View Details
  - Move LP
  - Split LP (if status = available)
  - Merge LP (if status = available)
  - Change QA Status
  - Block LP (if status = available)
  - Unblock LP (if status = blocked)
  - Print Label
  - View Genealogy
  - View Movement History
```

### Success State (Tablet: 768-1024px)

```
+--------------------------------------------------------------------+
|  Warehouse > License Plates                  [+ Create] [Print]    |
+--------------------------------------------------------------------+
|                                                                      |
|  +----------------+ +----------------+                               |
|  | Total LPs      | | Available      |                               |
|  |    1,247       | |      823       |                               |
|  | 23,450 units   | | [View]         |                               |
|  +----------------+ +----------------+                               |
|                                                                      |
|  +----------------+ +----------------+                               |
|  | Expiring Soon  | | QA Pending     |                               |
|  |       18       | |       23       |                               |
|  | [View]         | | [Review]       |                               |
|  +----------------+ +----------------+                               |
|                                                                      |
|  Filters: [Warehouse v] [Location v] [Product v] [Status v]         |
|           [QA Status v] [Search: _______________]                   |
|                                                                      |
|  [ ] Select All    [Move] [QA Status] [Print]                       |
|                                                                      |
|  +----------------------------------------------------------------+ |
|  | [ ] LP20251201-000123  Flour Type 00       [Avail] [Pass]     | |
|  |     500.0 kg  A-01-02 (Main)  Batch: BCH-456                  | |
|  |     Exp: 2025-06-15 (6 months)            [View] [...]        | |
|  +----------------------------------------------------------------+ |
|  | [ ] LP20251201-000122  Sugar White         [Avail] [Pass]     | |
|  |     1000.0 kg  A-02-03 (Main)  Batch: BCH-455                 | |
|  |     Exp: 2026-02-28 (14 months)           [View] [...]        | |
|  +----------------------------------------------------------------+ |
|  | [ ] LP20251130-000098  Milk 3.2%           [Avail] [Pend]     | |
|  |     240.0 L  B-01-05 (Cold)  Batch: MILK-789                  | |
|  |     Exp: 2024-12-20 (6 days)              [View] [...]        | |
|  +----------------------------------------------------------------+ |
|  | [ ] LP20251130-000097  Butter Unsalted     [Rsrvd] [Pass]     | |
|  |     150.0 kg  B-02-01 (Cold)  Batch: BUT-234                  | |
|  |     Exp: 2025-03-15  Rsrvd: WO-2024-00567 [View] [...]        | |
|  +----------------------------------------------------------------+ |
|                                                                      |
|  Showing 1-20 of 1,247                        [<] [1] [2] ... [63] [>] |
|                                                                      |
+--------------------------------------------------------------------+
```

### Success State (Mobile: <768px)

```
+----------------------------------+
|  < License Plates                |
|  [+ Create] [Print]              |
+----------------------------------+
|                                  |
|  +----------------------------+  |
|  | Total LPs         1,247    |  |
|  | 23,450 units      [View]   |  |
|  +----------------------------+  |
|  | Available          823     |  |
|  | [View]                     |  |
|  +----------------------------+  |
|  | Expiring Soon       18     |  |
|  | < 30 days  [View]          |  |
|  +----------------------------+  |
|  | QA Pending          23     |  |
|  | [Review]                   |  |
|  +----------------------------+  |
|                                  |
|  [Filters v]    [Search]        |
|                                  |
|  +----------------------------+  |
|  | [ ] LP20251201-000123      |  |
|  | Flour Type 00              |  |
|  | 500.0 kg  [Avail] [Pass]   |  |
|  | A-01-02 (Main Warehouse)   |  |
|  | Batch: BCH-456             |  |
|  | Exp: 2025-06-15 (6 mo)     |  |
|  |          [View] [...]      |  |
|  +----------------------------+  |
|  | [ ] LP20251201-000122      |  |
|  | Sugar White                |  |
|  | 1000.0 kg  [Avail] [Pass]  |  |
|  | A-02-03 (Main Warehouse)   |  |
|  | Batch: BCH-455             |  |
|  | Exp: 2026-02-28 (14 mo)    |  |
|  |          [View] [...]      |  |
|  +----------------------------+  |
|  | [ ] LP20251130-000098      |  |
|  | Milk 3.2%                  |  |
|  | 240.0 L  [Avail] [Pend]    |  |
|  | B-01-05 (Cold Storage)     |  |
|  | Batch: MILK-789            |  |
|  | Exp: 2024-12-20 (6 days)   |  |
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
|  Warehouse > License Plates                                            [+ Create LP] [Print Labels] |
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
|  Loading license plates...                                                                        |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

### Empty State

```
+--------------------------------------------------------------------------------------------------+
|  Warehouse > License Plates                                            [+ Create LP] [Print Labels] |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|                                                                                                    |
|                                      +------------------+                                          |
|                                      |   [LP Icon]      |                                          |
|                                      +------------------+                                          |
|                                                                                                    |
|                                    No License Plates Yet                                           |
|                                                                                                    |
|                     License Plates are created automatically when you receive                      |
|                     goods via Purchase Orders or Transfer Orders.                                  |
|                                                                                                    |
|                                                                                                    |
|                               [+ Create Manual License Plate]                                      |
|                                                                                                    |
|                                     [Go to Receiving]                                              |
|                                                                                                    |
|                                                                                                    |
|                      Quick Tip: License Plates provide full inventory traceability                 |
|                      with batch, expiry, and location tracking for every item.                     |
|                                                                                                    |
|                                   [Learn About License Plates]                                     |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

### Filtered Empty State

```
+--------------------------------------------------------------------------------------------------+
|  Warehouse > License Plates                                            [+ Create LP] [Print Labels] |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  +---------------------+ +---------------------+ +---------------------+ +---------------------+   |
|  | Total LPs           | | Available           | | Expiring Soon       | | QA Pending          |   |
|  |       1,247         | |         823         | |          18         | |          23         |   |
|  | 23,450 units        | | 18,900 units        | | < 30 days           | | Require approval    |   |
|  | [View All]          | | [View Available]    | | [View Expiring]     | | [Review QA]         |   |
|  +---------------------+ +---------------------+ +---------------------+ +---------------------+   |
|                                                                                                    |
|  +----------------------------------------------------------------------------------------------+  |
|  | Filters: [Warehouse: Main] [Location: A-01] [Product: All] [Status: blocked]                |  |
|  | Active Filters: Warehouse=Main, Location=A-01, Status=blocked           [Clear All Filters] |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|                                                                                                    |
|                                      +------------------+                                          |
|                                      |  [Filter Icon]   |                                          |
|                                      +------------------+                                          |
|                                                                                                    |
|                              No License Plates Match Your Filters                                  |
|                                                                                                    |
|                     No blocked LPs found in Main Warehouse, location A-01.                         |
|                     Try adjusting your filters to see more results.                                |
|                                                                                                    |
|                                                                                                    |
|                               [Clear All Filters]    [Adjust Filters]                              |
|                                                                                                    |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

### Error State

```
+--------------------------------------------------------------------------------------------------+
|  Warehouse > License Plates                                            [+ Create LP] [Print Labels] |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|                                                                                                    |
|                                      +------------------+                                          |
|                                      |   [Error Icon]   |                                          |
|                                      +------------------+                                          |
|                                                                                                    |
|                              Failed to Load License Plates                                         |
|                                                                                                    |
|                     Unable to retrieve license plate data. Please check                            |
|                     your connection and try again.                                                 |
|                                                                                                    |
|                              Error: LP_LIST_FETCH_FAILED                                           |
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
| **Total LPs** | license_plates table | COUNT(*) WHERE status != 'consumed', SUM(quantity) | Filter to all active LPs |
| **Available** | license_plates table | COUNT(*) WHERE status = 'available' AND qa_status = 'passed' | Filter to available LPs |
| **Expiring Soon** | license_plates table | COUNT(*) WHERE expiry_date <= CURRENT_DATE + 30 AND expiry_date > CURRENT_DATE AND status = 'available' | Filter to expiring LPs |
| **QA Pending** | license_plates table | COUNT(*) WHERE qa_status = 'pending' | Filter to QA pending LPs |

### 2. Filters Bar

| Filter | Type | Options | Default | Behavior |
|--------|------|---------|---------|----------|
| **Warehouse** | Searchable dropdown | All warehouses (active) | All | Filter by warehouse_id |
| **Location** | Searchable dropdown | All locations (depends on warehouse) | All | Filter by location_id, cascades from warehouse |
| **Product** | Searchable dropdown | All products | All | Filter by product_id |
| **Status** | Multi-select dropdown | Available, Reserved, Consumed, Blocked | All | Filter by status IN (...) |
| **QA Status** | Multi-select dropdown | Pending, Passed, Failed, Quarantine | All | Filter by qa_status IN (...) |
| **Batch** | Text input | Searches batch_number | Empty | WHERE batch_number ILIKE '%{term}%' |
| **Expiry Range** | Date range picker | From/To dates | Empty | WHERE expiry_date BETWEEN from AND to |
| **Search LP Number** | Text input | Prefix search on lp_number | Empty | WHERE lp_number ILIKE '{term}%' (optimized <300ms) |

### 3. Bulk Actions Bar

| Action | Enabled When | Result |
|--------|--------------|--------|
| **Move Selected** | 1+ LPs with status='available' selected | Opens bulk move modal |
| **Change QA Status** | 1+ LPs selected | Opens QA status change modal (pass/fail/quarantine) |
| **Print Labels** | 1+ LPs selected | Queues ZPL label print jobs |

### 4. LP Table

| Column | Width | Sortable | Description |
|--------|-------|----------|-------------|
| **Checkbox** | 48px | No | Row selection for bulk actions |
| **LP Number** | 180px | Yes | Unique identifier (e.g., LP20251201-000123) |
| **Product** | 200px | Yes | Product name + batch + expiry (3 lines) |
| **Qty (UoM)** | 100px | Yes | Quantity with unit (e.g., 500.0 kg) |
| **Location** | 150px | Yes | Location code + warehouse name |
| **Status** | 100px | Yes | Status badge with color |
| **QA Status** | 100px | Yes | QA status badge with color |
| **Actions** | 80px | No | Quick view button + overflow menu |

### 5. Status Badge Colors

| Status | Color | Background | Text | Icon |
|--------|-------|------------|------|------|
| Available | Green | #D1FAE5 | #065F46 | Check Circle |
| Reserved | Blue | #DBEAFE | #1E40AF | Lock |
| Consumed | Gray | #F3F4F6 | #6B7280 | Archive |
| Blocked | Red | #FEE2E2 | #B91C1C | X Circle |

### 6. QA Status Badge Colors

| QA Status | Color | Background | Text | Icon |
|-----------|-------|------------|------|------|
| Pending | Yellow | #FEF3C7 | #92400E | Clock |
| Passed | Green | #D1FAE5 | #065F46 | Check Circle |
| Failed | Red | #FEE2E2 | #B91C1C | X Circle |
| Quarantine | Orange | #FFEDD5 | #9A3412 | Alert Triangle |

### 7. Expiry Indicators

| Condition | Color | Display | Behavior |
|-----------|-------|---------|----------|
| Expiry > 30 days | Green | Normal date | No special indicator |
| Expiry 7-30 days | Yellow | Date with yellow badge | Yellow highlight + "Expiring Soon" tooltip |
| Expiry < 7 days | Red | Date with red badge | Red highlight + "Expires in X days" tooltip |
| Expired (< today) | Red | Date with red badge + "EXPIRED" | Red highlight + "EXPIRED" label |

---

## Main Actions

### Primary Actions

| Action | Location | Description |
|--------|----------|-------------|
| **Create LP** | Header button | Opens manual LP creation modal (rare, usually from GRN) |
| **Print Labels** | Header button | Opens bulk print modal for selected or filtered LPs |

### Table Row Actions

| Action | Visibility | Description |
|--------|------------|-------------|
| **View Details** | Always | Opens LP detail page with full info, genealogy, movement history |
| **Move LP** | Status = available | Opens move modal with location picker |
| **Split LP** | Status = available AND qty > 1 | Opens split modal (qty input, destination location) |
| **Merge LP** | Status = available | Opens merge modal to select other LPs to merge |
| **Change QA Status** | Always | Opens QA status modal (pending/passed/failed/quarantine) |
| **Block LP** | Status = available | Changes status to 'blocked' with reason |
| **Unblock LP** | Status = blocked | Changes status back to 'available' |
| **Print Label** | Always | Generates ZPL label for single LP |
| **View Genealogy** | Has genealogy history | Opens genealogy tree visualization |
| **View Movement History** | Has movement history | Opens stock moves timeline |

---

## States

| State | Description | Elements Shown |
|-------|-------------|----------------|
| **Loading** | Initial page load | Skeleton cards, skeleton table rows |
| **Empty** | No LPs exist in org | Empty state illustration, Create/Receive buttons, tip about LP creation |
| **Success** | LPs loaded | KPI cards, filters, table with data, pagination |
| **Filtered Empty** | Filters return no results | "No LPs match your filters" message, active filters display, clear filters button |
| **Error** | API failure | Error message, retry button, support link |

---

## Data Fields

### LP List Item

| Field | Source | Display | Notes |
|-------|--------|---------|-------|
| id | license_plates.id | Internal use | UUID |
| lp_number | license_plates.lp_number | "LP20251201-000123" | Unique within org |
| product_id | license_plates.product_id | Used for filtering | UUID |
| product_name | products.name via JOIN | "Flour Type 00" | Display name |
| quantity | license_plates.quantity | "500.0" | NUMERIC(15,4) |
| uom | license_plates.uom | "kg", "L", "ea" | Text |
| location_id | license_plates.location_id | Used for filtering | UUID |
| location_code | locations.location_code via JOIN | "A-01-02" | Display |
| warehouse_id | license_plates.warehouse_id | Used for filtering | UUID |
| warehouse_name | warehouses.name via JOIN | "Main Warehouse" | Display |
| status | license_plates.status | Badge | available/reserved/consumed/blocked |
| qa_status | license_plates.qa_status | Badge | pending/passed/failed/quarantine |
| batch_number | license_plates.batch_number | "BCH-456" | Can be null |
| supplier_batch_number | license_plates.supplier_batch_number | "SUPP-789" | Can be null |
| expiry_date | license_plates.expiry_date | "2025-06-15" | Can be null |
| manufacture_date | license_plates.manufacture_date | Internal use | Can be null |
| catch_weight_kg | license_plates.catch_weight_kg | "CW: 82.3 kg" | If product.is_catch_weight |
| reserved_for | lp_reservations JOIN | "WO-2024-00567" | If status='reserved' |
| gtin | license_plates.gtin | "12345678901234" | GS1 GTIN-14 |
| created_at | license_plates.created_at | For sorting | TIMESTAMPTZ |
| days_until_expiry | Calculated | "6 days", "6 months" | expiry_date - CURRENT_DATE |

---

## API Endpoints

### List License Plates

```
GET /api/warehouse/license-plates?warehouse_id={uuid}&location_id={uuid}&product_id={uuid}&status[]=available&qa_status[]=passed&batch={term}&expiry_from={date}&expiry_to={date}&search={lp_term}&page=1&limit=50&sort=created_at&order=desc

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid-lp-123",
      "lp_number": "LP20251201-000123",
      "product": {
        "id": "uuid-product-1",
        "name": "Flour Type 00",
        "is_catch_weight": false,
        "gtin": "12345678901234"
      },
      "quantity": 500.0,
      "uom": "kg",
      "location": {
        "id": "uuid-location-1",
        "location_code": "A-01-02",
        "warehouse": {
          "id": "uuid-warehouse-1",
          "name": "Main Warehouse"
        }
      },
      "status": "available",
      "qa_status": "passed",
      "batch_number": "BCH-456",
      "supplier_batch_number": null,
      "expiry_date": "2025-06-15",
      "manufacture_date": "2024-12-01",
      "catch_weight_kg": null,
      "gtin": null,
      "reserved_for": null,
      "created_at": "2024-12-01T09:30:00Z",
      "days_until_expiry": 196
    },
    ...
  ],
  "meta": {
    "total": 1247,
    "page": 1,
    "limit": 50,
    "pages": 25
  }
}
```

### KPI Summary

```
GET /api/warehouse/license-plates/summary

Response:
{
  "success": true,
  "data": {
    "total_count": 1247,
    "total_units": 23450.0,
    "available_count": 823,
    "available_units": 18900.0,
    "expiring_soon_count": 18,
    "expiring_soon_days": 30,
    "qa_pending_count": 23,
    "reserved_count": 67,
    "blocked_count": 5,
    "consumed_count": 329
  }
}
```

### Bulk Move

```
POST /api/warehouse/license-plates/bulk-move
Body: {
  "lp_ids": ["uuid-1", "uuid-2", "uuid-3"],
  "to_location_id": "uuid-location-dest",
  "move_date": "2024-12-14T14:30:00Z",
  "reason": "Reorganization"
}

Response:
{
  "success": true,
  "data": {
    "moved_count": 3,
    "failed_count": 0,
    "results": [
      { "lp_id": "uuid-1", "lp_number": "LP20251201-000123", "status": "moved", "stock_move_id": "uuid-move-1" },
      { "lp_id": "uuid-2", "lp_number": "LP20251201-000124", "status": "moved", "stock_move_id": "uuid-move-2" },
      { "lp_id": "uuid-3", "lp_number": "LP20251201-000125", "status": "moved", "stock_move_id": "uuid-move-3" }
    ]
  }
}
```

### Bulk QA Status Change

```
POST /api/warehouse/license-plates/bulk-qa-status
Body: {
  "lp_ids": ["uuid-1", "uuid-2"],
  "qa_status": "passed",
  "notes": "Batch inspection completed"
}

Response:
{
  "success": true,
  "data": {
    "updated_count": 2,
    "failed_count": 0,
    "results": [
      { "lp_id": "uuid-1", "lp_number": "LP20251201-000123", "qa_status": "passed" },
      { "lp_id": "uuid-2", "lp_number": "LP20251201-000124", "qa_status": "passed" }
    ]
  }
}
```

### Bulk Print Labels

```
POST /api/warehouse/license-plates/bulk-print
Body: {
  "lp_ids": ["uuid-1", "uuid-2", "uuid-3"],
  "copies_per_label": 1
}

Response:
{
  "success": true,
  "data": {
    "print_job_id": "uuid-print-job-1",
    "label_count": 3,
    "total_copies": 3,
    "status": "queued"
  }
}
```

### Search LP Number (Prefix)

```
GET /api/warehouse/license-plates/search?prefix=LP202512&limit=20

Response (< 300ms):
{
  "success": true,
  "data": [
    {
      "id": "uuid-lp-123",
      "lp_number": "LP20251201-000123",
      "product_name": "Flour Type 00",
      "location_code": "A-01-02",
      "status": "available"
    },
    {
      "id": "uuid-lp-124",
      "lp_number": "LP20251201-000124",
      "product_name": "Sugar White",
      "location_code": "A-02-03",
      "status": "available"
    }
  ]
}
```

---

## Permissions

| Role | View List | Create LP | Move LP | Split/Merge | QA Status | Block/Unblock | Print Labels | Bulk Actions |
|------|-----------|-----------|---------|-------------|-----------|---------------|--------------|--------------|
| Admin | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Warehouse Manager | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Warehouse Operator | Yes | No | Yes | Yes | Limited | No | Yes | Limited |
| QA Inspector | Yes | No | No | No | Yes | Yes | Yes | No |
| Viewer | Yes | No | No | No | No | No | No | No |

---

## Validation

| Field | Rule | Error Message |
|-------|------|---------------|
| Warehouse filter | Valid UUID or 'all' | "Invalid warehouse filter" |
| Location filter | Valid UUID or 'all' | "Invalid location filter" |
| Status filter | Valid enum values only | "Invalid status filter" |
| QA status filter | Valid enum values only | "Invalid QA status filter" |
| Expiry range | from_date <= to_date | "Invalid expiry date range" |
| Page | >= 1 | "Invalid page number" |
| Limit | 1-100 | "Limit must be between 1 and 100" |
| Bulk move | All LPs must have status='available' | "LP {lp_number} is not available for movement" |
| Bulk move | to_location_id must exist and be active | "Invalid destination location" |
| Bulk QA | qa_status must be valid enum | "Invalid QA status" |
| Search prefix | Min 3 characters | "Search term too short (min 3 chars)" |

---

## Business Rules

### Status Logic

| Status | Can Move | Can Split | Can Merge | Can Reserve | Can Consume |
|--------|----------|-----------|-----------|-------------|-------------|
| available | Yes | Yes | Yes | Yes | Yes |
| reserved | No* | No | No | No | Yes (by WO/TO only) |
| consumed | No | No | No | No | No |
| blocked | No | No | No | No | No |

*Reserved LPs can be moved if reservation is released first

### QA Status Logic

| QA Status | Auto Block | Can Consume | Can Ship | Notes |
|-----------|------------|-------------|----------|-------|
| pending | No | No | No | Awaiting inspection |
| passed | No | Yes | Yes | Approved for use |
| failed | Yes (auto set status='blocked') | No | No | Failed inspection |
| quarantine | Yes (auto set status='blocked') | No | No | Isolated for investigation |

### Expiry Warnings

```typescript
function getExpiryIndicator(expiryDate: Date | null): ExpiryIndicator {
  if (!expiryDate) return { color: 'none', message: null };

  const today = new Date();
  const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilExpiry < 0) {
    return { color: 'red', message: 'EXPIRED', badge: true };
  } else if (daysUntilExpiry < 7) {
    return { color: 'red', message: `Expires in ${daysUntilExpiry} days`, badge: true };
  } else if (daysUntilExpiry <= 30) {
    return { color: 'yellow', message: 'Expiring Soon', badge: true };
  } else {
    return { color: 'green', message: null, badge: false };
  }
}
```

### Prefix Search Optimization

```sql
-- Index for fast prefix search
CREATE INDEX idx_lp_number_prefix ON license_plates (org_id, lp_number text_pattern_ops);

-- Query pattern (< 300ms target)
SELECT id, lp_number, product_name, location_code, status
FROM license_plates lp
JOIN products p ON lp.product_id = p.id
JOIN locations l ON lp.location_id = l.id
WHERE lp.org_id = ?
  AND lp.lp_number LIKE 'LP202512%'
ORDER BY lp.lp_number
LIMIT 20;
```

---

## Accessibility

### Touch Targets
- All buttons: minimum 48x48dp
- Table row click area: full row height (72px)
- Checkbox click area: 48x48dp
- Actions menu items: 48dp height
- Filter dropdowns: 48dp height

### Contrast
- Text on badges: 4.5:1 minimum
- Table text: 4.5:1 minimum
- Action buttons: 4.5:1 minimum
- Expiry indicators: 4.5:1 minimum (WCAG AA)

### Screen Reader
- KPI cards: "Total License Plates card: 1,247 license plates, 23,450 total units, click to view all license plates"
- Table: Proper column headers with scope="col"
- Status badges: "Status: Available", "Status: Reserved"
- QA badges: "QA Status: Passed", "QA Status: Pending"
- Expiry indicators: "Expiry date: June 15, 2025, Expiring Soon warning"
- Actions menu: "Actions for LP20251201-000123, menu expanded, 10 items"

### Keyboard Navigation
- Tab: Move between interactive elements
- Enter: Activate button/link
- Space: Toggle checkbox
- Escape: Close dropdown/modal
- Arrow keys: Navigate within dropdown/menu
- Shift+Tab: Reverse navigation

### ARIA Attributes
- Table: role="table" with proper row/cell structure
- Status badges: role="status" aria-label="{status}"
- QA badges: role="status" aria-label="QA status: {qa_status}"
- Filters: aria-expanded for dropdowns, aria-label for inputs
- Bulk actions: aria-disabled when no selection
- Expiry warnings: role="alert" for critical (expired) items

---

## Responsive Breakpoints

| Breakpoint | Layout | Changes |
|------------|--------|---------|
| Desktop (>1024px) | Full table with all columns | Full KPI cards (4 across), all filters visible |
| Tablet (768-1024px) | Condensed table | 2x2 KPI grid, primary filters visible, secondary collapsed |
| Mobile (<768px) | Card layout | Vertical KPI list, filters in modal, card per LP |

### Mobile-Specific
- Filters collapse into modal/drawer
- Table becomes card list
- Pagination becomes "Load More" button
- Bulk actions in bottom sheet
- Search bar sticky at top
- Actions menu as bottom sheet

---

## Performance Notes

### Query Optimization
- Index on: `(org_id, status, created_at DESC)`
- Index on: `(org_id, warehouse_id, location_id, status)`
- Index on: `(org_id, product_id, status, qa_status)`
- Index on: `(org_id, lp_number text_pattern_ops)` for prefix search
- Index on: `(org_id, batch_number)` for batch filtering
- Index on: `(org_id, expiry_date, status)` for expiry queries

### Caching Strategy
```typescript
// Redis keys
'org:{orgId}:warehouse:lp-list:{filters_hash}'     // 30 sec TTL (volatile data)
'org:{orgId}:warehouse:lp-summary'                 // 1 min TTL
'org:{orgId}:warehouse:warehouses:dropdown'        // 5 min TTL
'org:{orgId}:warehouse:locations:dropdown'         // 5 min TTL
'org:{orgId}:warehouse:products:dropdown'          // 10 min TTL
```

### Load Time Targets
- Initial page load: <500ms (P95)
- Filter change: <300ms
- Pagination: <300ms
- Prefix search: <300ms (per PRD requirement)
- Bulk operations: <500ms for 50 LPs
- Export generation: <2s for 500 LPs

### Pagination Strategy
- Default: 50 per page (optimized for warehouse scanning workflows)
- Desktop: Server-side pagination with page numbers
- Mobile: Infinite scroll with "Load More" button
- Cache page 1 results for 30 seconds

---

## Testing Requirements

### Unit Tests
- KPI calculations (total count, available count, expiring soon, QA pending)
- Status badge color mapping
- QA status badge color mapping
- Expiry indicator logic (green/yellow/red/expired)
- Days until expiry calculation
- Filter query building (all combinations)
- Prefix search query optimization

### Integration Tests
- GET /api/warehouse/license-plates with various filters
- GET /api/warehouse/license-plates/summary
- POST /api/warehouse/license-plates/bulk-move
- POST /api/warehouse/license-plates/bulk-qa-status
- POST /api/warehouse/license-plates/bulk-print
- GET /api/warehouse/license-plates/search (prefix < 300ms)
- RLS policy enforcement (org_id isolation)
- Warehouse filter cascades to location filter

### E2E Tests
- Page load with data shows all KPIs and table
- Empty state shows correct message and actions
- Filter by warehouse updates location dropdown
- Filter by status updates table correctly
- Filter by QA status shows correct badges
- Search by LP number prefix returns results < 300ms
- Expiry filter range works correctly
- Batch filter finds matching LPs
- Bulk select and move multiple LPs
- Bulk change QA status updates badges
- Bulk print queues print jobs
- Click row navigates to detail page
- Create button opens create modal
- Responsive layout at all breakpoints
- Expiry indicators show correct colors (green/yellow/red)
- Reserved LPs show reservation reference (WO/TO number)
- Catch weight LPs display weight correctly
- Filtered empty state shows "clear filters" action

### Performance Tests
- List 10,000 LPs loads in <1s
- Filter change responds in <300ms
- Prefix search responds in <300ms
- Bulk move 50 LPs completes in <500ms
- Export 500 LPs completes in <2s

---

## Quality Gates

Before handoff to FRONTEND-DEV:
- [x] All 4 states defined (Loading, Empty, Error, Success, Filtered Empty)
- [x] Responsive breakpoints documented (Desktop/Tablet/Mobile)
- [x] All API endpoints specified with request/response schemas
- [x] Accessibility checklist passed (touch targets, contrast, screen reader, keyboard, ARIA)
- [x] Performance targets defined (prefix search < 300ms per PRD)
- [x] Status badge colors defined for all 4 statuses
- [x] QA status badge colors defined for all 4 statuses
- [x] Expiry indicators defined (green/yellow/red/expired)
- [x] Bulk actions workflow defined
- [x] Filter logic documented (8 filters including prefix search)
- [x] Permissions matrix documented
- [x] Business rules for status/QA status documented
- [x] Catch weight display logic defined
- [x] Reserved LP display logic defined
- [x] Pagination strategy defined (50 per page per PRD)

---

## Handoff to FRONTEND-DEV

```yaml
feature: License Plates List Page
story: WH-002
fr_coverage: WH-FR-002 (LP Tracking)
approval_status:
  mode: "review_each"
  user_approved: false  # PENDING USER REVIEW
  screens_approved: []
  iterations_used: 0
deliverables:
  wireframe: docs/3-ARCHITECTURE/ux/wireframes/WH-002-license-plates-list.md
  api_endpoints:
    - GET /api/warehouse/license-plates
    - GET /api/warehouse/license-plates/summary
    - GET /api/warehouse/license-plates/search (prefix, <300ms)
    - POST /api/warehouse/license-plates/bulk-move
    - POST /api/warehouse/license-plates/bulk-qa-status
    - POST /api/warehouse/license-plates/bulk-print
states_per_screen: [loading, empty, error, success, filtered_empty]
breakpoints:
  mobile: "<768px (card layout, load more)"
  tablet: "768-1024px (condensed table)"
  desktop: ">1024px (full table)"
accessibility:
  touch_targets: "48x48dp minimum"
  contrast: "4.5:1 minimum (WCAG 2.1 AA)"
  aria_roles: "table, status, alert (for expiry warnings)"
  keyboard_nav: "Tab, Enter, Space, Escape, Arrow keys, Shift+Tab"
performance_targets:
  initial_load: "<500ms (P95)"
  filter_change: "<300ms"
  prefix_search: "<300ms (PRD requirement WH-FR-002)"
  bulk_move: "<500ms for 50 LPs"
  pagination: "50 per page (PRD requirement WH-FR-002)"
key_features:
  - 8 filters (warehouse, location, product, status, QA, batch, expiry range, LP prefix search)
  - 4 KPI cards (total, available, expiring soon, QA pending)
  - Expiry indicators (green >30d, yellow 7-30d, red <7d, expired)
  - Status badges (available, reserved, consumed, blocked)
  - QA badges (pending, passed, failed, quarantine)
  - Bulk actions (move, QA status change, print labels)
  - Catch weight display (if product.is_catch_weight)
  - Reserved LP display (shows WO/TO reference)
  - Prefix search optimization (<300ms with text_pattern_ops index)
related_screens:
  - WH-001: Warehouse Dashboard
  - WH-003: LP Detail Page
  - WH-004: GRN Create Modal
  - WH-005: Stock Move Modal
```

---

**Status**: Ready for User Review
**Approval Mode**: review_each (default)
**User Approved**: Pending
**Iterations**: 0 of 3
**Estimated Effort**: 10-12 hours (complex filtering + bulk actions)
**Quality Target**: 95%+
**PRD Coverage**: WH-FR-002 (100%)
