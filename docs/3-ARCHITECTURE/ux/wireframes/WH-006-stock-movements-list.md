# WH-006: Stock Movements List Page

**Module**: Warehouse
**Feature**: Stock Moves History (WH-FR-005)
**Status**: Ready for Implementation
**Last Updated**: 2025-12-14

---

## ASCII Wireframe

### Success State (Desktop)

```
+--------------------------------------------------------------------------------------------------+
|  Warehouse > Stock Movements                                       [Export CSV] [Create Movement]  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  +---------------------+ +---------------------+ +---------------------+ +---------------------+   |
|  | Total Moves         | | Completed           | | In Transit          | | Pending             |   |
|  |       2,847         | |       2,756         | |          67         | |          24         |   |
|  | Last 30 days        | | 96.8% success       | | Active moves        | | Awaiting action     |   |
|  | [View All]          | | [View History]      | | [Track]             | | [Review]            |   |
|  +---------------------+ +---------------------+ +---------------------+ +---------------------+   |
|                                                                                                    |
|  +----------------------------------------------------------------------------------------------+  |
|  | Filters: [Date Range: Last 30 days v] [Warehouse: All v] [Move Type: All v]                 |  |
|  |          [Status: All v] [LP Number: _______] [Product: All v]                               |  |
|  |          [From Location: All v] [To Location: All v]                                         |  |
|  |          [Search Move ID: _______________]                                                   |  |
|  |                                                                                              |  |
|  | Quick Filters: [Today] [This Week] [This Month] [Completed Only] [Clear All]                |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  +----------------------------------------------------------------------------------------------+  |
|  | Move ID          | LP Number       | Product         | Qty    | From → To       | Type    |   |
|  |                  |                 |                 |        | Location        |         |   |
|  +----------------------------------------------------------------------------------------------+  |
|  | MV-2024-00847    | LP-1214-000234  | Sugar White     | 100.0  | WH-RECV →       | [Putaw] |   |
|  | Dec 14 10:45 AM  | Batch: BCH-456  |                 | kg     | WH-A01-02       |         |   |
|  | by: J. Smith     | Exp: 2025-06-14 |                 |        | Main Warehouse  | [Compl] |   |
|  |                  |                 |                 |        | ⏱ 12 min        | [...]  |   |
|  +----------------------------------------------------------------------------------------------+  |
|  | MV-2024-00846    | LP-1214-000233  | Flour Type 00   | 250.0  | WH-A02-05 →     | [Transf]|   |
|  | Dec 14 10:30 AM  | Batch: BCH-455  |                 | kg     | WH-STAGING      |         |   |
|  | by: M. Jones     | Exp: 2025-03-20 |                 |        | Main Warehouse  | [Compl] |   |
|  |                  |                 | WO-2024-00567   |        | ⏱ 8 min         | [...]  |   |
|  +----------------------------------------------------------------------------------------------+  |
|  | MV-2024-00845    | LP-1213-000198  | Milk 3.2%       | 120.0  | COLD-B01 →      | [Consum]|   |
|  | Dec 14 09:15 AM  | Batch: MILK-789 |                 | L      | PRODUCTION-L1   |         |   |
|  | by: K. Wilson    | Exp: 2024-12-20 |                 |        | Cold → Prod     | [Compl] |   |
|  |                  |                 | WO-2024-00568   |        | ⏱ 45 min        | [...]  |   |
|  +----------------------------------------------------------------------------------------------+  |
|  | MV-2024-00844    | LP-1213-000197  | Butter Unsalted | 80.5   | WH-A05-01 →     | [Manual]|   |
|  | Dec 14 08:50 AM  | Batch: BUT-234  |                 | kg     | WH-A05-03       |         |   |
|  | by: J. Smith     | Exp: 2025-03-15 |                 |        | Main Warehouse  | [Compl] |   |
|  |                  |                 | CW: 82.3 kg     |        | ⏱ 5 min         | [...]  |   |
|  +----------------------------------------------------------------------------------------------+  |
|  | MV-2024-00843    | LP-1212-000156  | Cheese Cheddar  | 50.0   | WH-RECV →       | [Adjust]|   |
|  | Dec 14 08:20 AM  | Batch: CHZ-567  |                 | kg     | Same            |         |   |
|  | by: Admin        | Exp: 2025-01-10 |                 |        | Qty adjusted    | [Compl] |   |
|  |                  |                 | Reason: Damage  |        | ⏱ Instant       | [...]  |   |
|  +----------------------------------------------------------------------------------------------+  |
|  | MV-2024-00842    | LP-1212-000145  | Salt Industrial | 100.0  | WH-MAIN-A01 →   | [Transf]|   |
|  | Dec 13 04:15 PM  | Batch: SALT-890 |                 | kg     | WH-BRANCH-R01   |         |   |
|  | by: M. Jones     | Exp: 2026-12-31 |                 |        | Main → Branch   | [Trans] |   |
|  |                  |                 | TO-2024-00234   |        | ⏱ 2 hrs         | [...]  |   |
|  +----------------------------------------------------------------------------------------------+  |
|  | MV-2024-00841    | LP-1212-000089  | Eggs Large      | 360.0  | WH-COLD-B02 →   | [Split] |   |
|  | Dec 13 03:45 PM  | Batch: EGG-901  |                 | ea     | WH-COLD-B03     |         |   |
|  | by: K. Wilson    | Exp: 2024-12-18 |                 |        | Cold Storage    | [Compl] |   |
|  |                  |                 | Split to LP-892 |        | ⏱ 3 min         | [...]  |   |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  Showing 1-50 of 2,847 moves                                      [< Previous] [1] [2] ... [57] [Next >] |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+

[...] Row Actions Menu:
  - View Details
  - View License Plate
  - View Genealogy (if split/merge)
  - Cancel Move (if status = pending or in_transit)
  - Repeat Move (create new move with same parameters)
  - Print Movement Report
```

### Success State (Tablet: 768-1024px)

```
+--------------------------------------------------------------------+
|  Warehouse > Stock Movements               [Export] [+ Create]     |
+--------------------------------------------------------------------+
|                                                                      |
|  +----------------+ +----------------+                               |
|  | Total Moves    | | Completed      |                               |
|  |    2,847       | |    2,756       |                               |
|  | Last 30 days   | | 96.8%          |                               |
|  +----------------+ +----------------+                               |
|                                                                      |
|  +----------------+ +----------------+                               |
|  | In Transit     | | Pending        |                               |
|  |       67       | |       24       |                               |
|  | [Track]        | | [Review]       |                               |
|  +----------------+ +----------------+                               |
|                                                                      |
|  Filters: [Date Range v] [Warehouse v] [Type v] [Status v]         |
|           [LP: _______] [Search: _______________]                   |
|                                                                      |
|  Quick: [Today] [Week] [Month] [Completed] [Clear]                 |
|                                                                      |
|  +----------------------------------------------------------------+ |
|  | MV-2024-00847  Dec 14 10:45  by: J. Smith       [Putaw] [Compl]| |
|  | LP-1214-000234  Sugar White  100.0 kg                          | |
|  | WH-RECV → WH-A01-02 (Main)  Batch: BCH-456                     | |
|  | ⏱ 12 min                                    [View] [...]       | |
|  +----------------------------------------------------------------+ |
|  | MV-2024-00846  Dec 14 10:30  by: M. Jones      [Transf] [Compl]| |
|  | LP-1214-000233  Flour Type 00  250.0 kg                        | |
|  | WH-A02-05 → WH-STAGING (Main)  WO-2024-00567                   | |
|  | ⏱ 8 min                                     [View] [...]       | |
|  +----------------------------------------------------------------+ |
|  | MV-2024-00845  Dec 14 09:15  by: K. Wilson    [Consum] [Compl] | |
|  | LP-1213-000198  Milk 3.2%  120.0 L                             | |
|  | COLD-B01 → PRODUCTION-L1  WO-2024-00568                        | |
|  | ⏱ 45 min                                    [View] [...]       | |
|  +----------------------------------------------------------------+ |
|  | MV-2024-00844  Dec 14 08:50  by: J. Smith      [Manual] [Compl]| |
|  | LP-1213-000197  Butter Unsalted  80.5 kg                       | |
|  | WH-A05-01 → WH-A05-03 (Main)  CW: 82.3 kg                      | |
|  | ⏱ 5 min                                     [View] [...]       | |
|  +----------------------------------------------------------------+ |
|                                                                      |
|  Showing 1-20 of 2,847                        [<] [1] [2] ... [143] [>] |
|                                                                      |
+--------------------------------------------------------------------+
```

### Success State (Mobile: <768px)

```
+----------------------------------+
|  < Stock Movements               |
|  [Export] [+ Create]             |
+----------------------------------+
|                                  |
|  +----------------------------+  |
|  | Total Moves       2,847    |  |
|  | Last 30 days      [View]   |  |
|  +----------------------------+  |
|  | Completed          2,756   |  |
|  | 96.8% success              |  |
|  +----------------------------+  |
|  | In Transit            67   |  |
|  | [Track]                    |  |
|  +----------------------------+  |
|  | Pending               24   |  |
|  | [Review]                   |  |
|  +----------------------------+  |
|                                  |
|  [Filters v]    [Search]        |
|  Quick: [Today] [Week] [Clear]  |
|                                  |
|  +----------------------------+  |
|  | MV-2024-00847              |  |
|  | Dec 14 10:45 AM            |  |
|  | [Putaway] [Completed]      |  |
|  |                            |  |
|  | LP-1214-000234             |  |
|  | Sugar White  100.0 kg      |  |
|  | Batch: BCH-456             |  |
|  |                            |  |
|  | WH-RECV → WH-A01-02        |  |
|  | Main Warehouse             |  |
|  | ⏱ Duration: 12 min         |  |
|  | by: J. Smith               |  |
|  |          [View] [...]      |  |
|  +----------------------------+  |
|  | MV-2024-00846              |  |
|  | Dec 14 10:30 AM            |  |
|  | [Transfer] [Completed]     |  |
|  |                            |  |
|  | LP-1214-000233             |  |
|  | Flour Type 00  250.0 kg    |  |
|  | Batch: BCH-455             |  |
|  |                            |  |
|  | WH-A02-05 → WH-STAGING     |  |
|  | Main Warehouse             |  |
|  | WO-2024-00567              |  |
|  | ⏱ Duration: 8 min          |  |
|  | by: M. Jones               |  |
|  |          [View] [...]      |  |
|  +----------------------------+  |
|  | MV-2024-00845              |  |
|  | Dec 14 09:15 AM            |  |
|  | [Consumption] [Completed]  |  |
|  |                            |  |
|  | LP-1213-000198             |  |
|  | Milk 3.2%  120.0 L         |  |
|  | Batch: MILK-789            |  |
|  |                            |  |
|  | COLD-B01 → PRODUCTION-L1   |  |
|  | Cold → Production          |  |
|  | WO-2024-00568              |  |
|  | ⏱ Duration: 45 min         |  |
|  | by: K. Wilson              |  |
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
|  Warehouse > Stock Movements                                       [Export CSV] [Create Movement]  |
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
|  Loading stock movements...                                                                       |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

### Empty State (No Movements)

```
+--------------------------------------------------------------------------------------------------+
|  Warehouse > Stock Movements                                       [Export CSV] [Create Movement]  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|                                                                                                    |
|                                      +------------------+                                          |
|                                      |  [Move Icon]     |                                          |
|                                      +------------------+                                          |
|                                                                                                    |
|                                 No Stock Movements Yet                                            |
|                                                                                                    |
|                     Stock movements track every change in License Plate location                   |
|                     and quantity. Create your first movement to start tracking.                    |
|                                                                                                    |
|                                                                                                    |
|                               [+ Create Stock Movement]                                           |
|                                                                                                    |
|                                   [Go to License Plates]                                          |
|                                                                                                    |
|                                                                                                    |
|                      Quick Tip: Stock movements are created automatically when:                    |
|                      • Receiving goods (Putaway)                                                   |
|                      • Moving License Plates between locations                                     |
|                      • Consuming materials in production                                           |
|                      • Transferring inventory between warehouses                                   |
|                                                                                                    |
|                                   [Learn About Stock Moves]                                       |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

### Filtered Empty State

```
+--------------------------------------------------------------------------------------------------+
|  Warehouse > Stock Movements                                       [Export CSV] [Create Movement]  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  +---------------------+ +---------------------+ +---------------------+ +---------------------+   |
|  | Total Moves         | | Completed           | | In Transit          | | Pending             |   |
|  |       2,847         | |       2,756         | |          67         | |          24         |   |
|  | Last 30 days        | | 96.8% success       | | Active moves        | | Awaiting action     |   |
|  | [View All]          | | [View History]      | | [Track]             | | [Review]            |   |
|  +---------------------+ +---------------------+ +---------------------+ +---------------------+   |
|                                                                                                    |
|  +----------------------------------------------------------------------------------------------+  |
|  | Filters: [Date: Dec 1-5] [Warehouse: Branch] [Type: Adjustment] [Status: Cancelled]        |  |
|  | Active Filters: Date=Dec 1-5, Warehouse=Branch, Type=Adjustment, Status=Cancelled          |  |
|  |                                                                          [Clear All Filters] |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|                                                                                                    |
|                                      +------------------+                                          |
|                                      |  [Filter Icon]   |                                          |
|                                      +------------------+                                          |
|                                                                                                    |
|                              No Stock Movements Match Your Filters                                 |
|                                                                                                    |
|                     No cancelled adjustment moves found in Branch warehouse                        |
|                     from Dec 1-5. Try adjusting your filters to see more results.                  |
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
|  Warehouse > Stock Movements                                       [Export CSV] [Create Movement]  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|                                                                                                    |
|                                      +------------------+                                          |
|                                      |   [Error Icon]   |                                          |
|                                      +------------------+                                          |
|                                                                                                    |
|                              Failed to Load Stock Movements                                        |
|                                                                                                    |
|                     Unable to retrieve movement history data. Please check                         |
|                     your connection and try again.                                                 |
|                                                                                                    |
|                              Error: STOCK_MOVES_FETCH_FAILED                                       |
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
| **Total Moves** | stock_moves table | COUNT(*) WHERE created_at >= CURRENT_DATE - 30 DAYS | Filter to all moves in period |
| **Completed** | stock_moves table | COUNT(*) WHERE status = 'completed', show success rate | Filter to completed moves |
| **In Transit** | stock_moves table | COUNT(*) WHERE status = 'in_transit' | Filter to in-transit moves |
| **Pending** | stock_moves table | COUNT(*) WHERE status = 'pending' | Filter to pending moves |

### 2. Filters Bar

| Filter | Type | Options | Default | Behavior |
|--------|------|---------|---------|----------|
| **Date Range** | Date range picker | Last 7/30/90 days, This month, Custom | Last 30 days | WHERE created_at BETWEEN from AND to |
| **Warehouse** | Searchable dropdown | All warehouses (active) | All | Filter by from_warehouse_id OR to_warehouse_id |
| **Move Type** | Multi-select dropdown | Manual, Putaway, Transfer, Consumption, Adjustment, Split-related | All | Filter by move_type IN (...) |
| **Status** | Multi-select dropdown | Pending, In Transit, Completed, Cancelled | All | Filter by status IN (...) |
| **LP Number** | Text input | Searches lp_number | Empty | JOIN license_plates WHERE lp_number ILIKE '%{term}%' |
| **Product** | Searchable dropdown | All products | All | JOIN license_plates → products WHERE product_id = ? |
| **From Location** | Searchable dropdown | All locations | All | Filter by from_location_id |
| **To Location** | Searchable dropdown | All locations | All | Filter by to_location_id |
| **Search Move ID** | Text input | Prefix search on move_number | Empty | WHERE move_number ILIKE '{term}%' (optimized <300ms) |

### 3. Move Type Badge Colors

| Move Type | Color | Background | Text | Icon |
|-----------|-------|------------|------|------|
| Manual | Blue | #DBEAFE | #1E40AF | ArrowRight |
| Putaway | Green | #D1FAE5 | #065F46 | Archive |
| Transfer | Purple | #E9D5FF | #6B21A8 | Truck |
| Consumption | Orange | #FFEDD5 | #9A3412 | Factory |
| Adjustment | Yellow | #FEF3C7 | #92400E | Edit |
| Split-related | Cyan | #CFFAFE | #164E63 | Split |

### 4. Status Badge Colors

| Status | Color | Background | Text | Icon |
|--------|-------|------------|------|------|
| Pending | Gray | #F3F4F6 | #4B5563 | Clock |
| In Transit | Blue | #DBEAFE | #1E40AF | Truck |
| Completed | Green | #D1FAE5 | #065F46 | CheckCircle |
| Cancelled | Red | #FEE2E2 | #B91C1C | XCircle |

### 5. Movement Table

| Column | Width | Sortable | Description |
|--------|-------|----------|-------------|
| **Move ID** | 150px | Yes | Unique identifier (e.g., MV-2024-00847) + timestamp + user |
| **LP Number** | 150px | Yes | License Plate number + batch + expiry |
| **Product** | 150px | Yes | Product name + reference (WO/TO if applicable) |
| **Qty** | 80px | Yes | Quantity with unit |
| **From → To** | 200px | No | From/to locations + warehouse + duration |
| **Type** | 100px | Yes | Move type badge |
| **Status** | 100px | Yes | Status badge |
| **Actions** | 80px | No | Quick view button + overflow menu |

### 6. Quick Filters

| Quick Filter | Description | SQL Filter |
|--------------|-------------|------------|
| **Today** | Moves created today | WHERE DATE(created_at) = CURRENT_DATE |
| **This Week** | Moves in current week | WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE) |
| **This Month** | Moves in current month | WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE) |
| **Completed Only** | Only completed moves | WHERE status = 'completed' |
| **Clear All** | Remove all active filters | Reset to defaults |

---

## Main Actions

### Primary Actions

| Action | Location | Description |
|--------|----------|-------------|
| **Create Movement** | Header button | Opens stock move creation modal |
| **Export CSV** | Header button | Exports filtered movements to CSV (max 10,000 records) |

### Table Row Actions

| Action | Visibility | Description |
|--------|------------|-------------|
| **View Details** | Always | Opens stock move detail page with full info |
| **View License Plate** | Always | Navigate to LP detail page |
| **View Genealogy** | If split/merge related | Opens genealogy tree visualization |
| **Cancel Move** | Status = pending or in_transit | Cancels movement with reason |
| **Repeat Move** | Always | Opens create modal pre-filled with same parameters |
| **Print Movement Report** | Always | Generates PDF movement report |

---

## States

| State | Description | Elements Shown |
|-------|-------------|----------------|
| **Loading** | Initial page load | Skeleton cards, skeleton table rows |
| **Empty** | No movements exist in org | Empty state illustration, Create button, tip about movement creation |
| **Success** | Movements loaded | KPI cards, filters, table with data, pagination |
| **Filtered Empty** | Filters return no results | "No movements match your filters" message, active filters display, clear filters button |
| **Error** | API failure | Error message, retry button, support link |

---

## Data Fields

### Stock Move List Item

| Field | Source | Display | Notes |
|-------|--------|---------|-------|
| id | stock_moves.id | Internal use | UUID |
| move_number | stock_moves.move_number | "MV-2024-00847" | Unique within org |
| lp_id | stock_moves.lp_id | Used for filtering | UUID |
| lp_number | license_plates.lp_number via JOIN | "LP-1214-000234" | Display |
| product_id | license_plates.product_id | Used for filtering | UUID |
| product_name | products.name via JOIN | "Sugar White" | Display |
| quantity | stock_moves.quantity | "100.0" | NUMERIC(15,4) |
| uom | license_plates.uom | "kg", "L", "ea" | Text |
| move_type | stock_moves.move_type | Badge | manual/putaway/transfer/consumption/adjustment/split-related |
| status | stock_moves.status | Badge | pending/in_transit/completed/cancelled |
| from_location_id | stock_moves.from_location_id | Used for filtering | UUID |
| from_location_code | locations.location_code via JOIN | "WH-RECV" | Display |
| to_location_id | stock_moves.to_location_id | Used for filtering | UUID |
| to_location_code | locations.location_code via JOIN | "WH-A01-02" | Display |
| from_warehouse_name | warehouses.name via JOIN | "Main Warehouse" | Display if different |
| to_warehouse_name | warehouses.name via JOIN | "Branch Warehouse" | Display if different |
| batch_number | license_plates.batch_number | "BCH-456" | Can be null |
| expiry_date | license_plates.expiry_date | "2025-06-14" | Can be null |
| catch_weight_kg | license_plates.catch_weight_kg | "CW: 82.3 kg" | If product.is_catch_weight |
| wo_id | stock_moves.wo_id | Link to WO | If move_type = consumption |
| wo_number | work_orders.wo_number via JOIN | "WO-2024-00567" | Display |
| to_id | stock_moves.to_id | Link to TO | If move_type = transfer |
| to_number | transfer_orders.to_number via JOIN | "TO-2024-00234" | Display |
| reason | stock_moves.reason | "Damage", "Reorganization" | For adjustment/cancel |
| move_date | stock_moves.move_date | "Dec 14 10:45 AM" | TIMESTAMPTZ |
| created_at | stock_moves.created_at | For sorting | TIMESTAMPTZ |
| moved_by | stock_moves.moved_by | User ID | UUID |
| user_name | users.full_name via JOIN | "J. Smith" | Display |
| duration | Calculated | "12 min" | move_date - created_at (if completed) |

---

## API Endpoints

### List Stock Movements

```
GET /api/warehouse/stock-moves?date_from={date}&date_to={date}&warehouse_id={uuid}&move_type[]=manual&status[]=completed&lp_number={term}&product_id={uuid}&from_location_id={uuid}&to_location_id={uuid}&search={move_term}&page=1&limit=50&sort=created_at&order=desc

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid-move-847",
      "move_number": "MV-2024-00847",
      "lp": {
        "id": "uuid-lp-234",
        "lp_number": "LP-1214-000234",
        "product": {
          "id": "uuid-sugar",
          "name": "Sugar White",
          "code": "RM-SUGAR-001",
          "is_catch_weight": false
        },
        "batch_number": "BCH-456",
        "expiry_date": "2025-06-14",
        "catch_weight_kg": null
      },
      "quantity": 100.0,
      "uom": "kg",
      "move_type": "putaway",
      "status": "completed",
      "from_location": {
        "id": "uuid-loc-recv",
        "location_code": "WH-RECV",
        "warehouse": {
          "id": "uuid-wh-main",
          "name": "Main Warehouse"
        }
      },
      "to_location": {
        "id": "uuid-loc-a01-02",
        "location_code": "WH-A01-02",
        "warehouse": {
          "id": "uuid-wh-main",
          "name": "Main Warehouse"
        }
      },
      "move_date": "2024-12-14T10:45:00Z",
      "created_at": "2024-12-14T10:33:00Z",
      "moved_by": {
        "id": "uuid-user-1",
        "full_name": "J. Smith"
      },
      "wo_id": null,
      "wo_number": null,
      "to_id": null,
      "to_number": null,
      "reason": null,
      "duration_minutes": 12
    },
    ...
  ],
  "meta": {
    "total": 2847,
    "page": 1,
    "limit": 50,
    "pages": 57
  }
}
```

### KPI Summary

```
GET /api/warehouse/stock-moves/summary?date_from={date}&date_to={date}

Response:
{
  "success": true,
  "data": {
    "total_count": 2847,
    "completed_count": 2756,
    "in_transit_count": 67,
    "pending_count": 24,
    "cancelled_count": 0,
    "success_rate": 96.8,
    "by_type": {
      "manual": 456,
      "putaway": 892,
      "transfer": 234,
      "consumption": 1023,
      "adjustment": 89,
      "split_related": 153
    },
    "avg_duration_minutes": 18.5
  }
}
```

### Export CSV

```
POST /api/warehouse/stock-moves/export
Body: {
  "filters": {
    "date_from": "2024-11-14",
    "date_to": "2024-12-14",
    "warehouse_id": "uuid-wh-main",
    "move_type": ["manual", "putaway"],
    "status": ["completed"]
  },
  "columns": ["move_number", "lp_number", "product_name", "quantity", "move_type", "status", "from_location", "to_location", "move_date", "user_name"]
}

Response:
{
  "success": true,
  "data": {
    "export_job_id": "uuid-export-1",
    "file_url": "https://storage.example.com/exports/stock-moves-20241214.csv",
    "record_count": 1348,
    "file_size_bytes": 245678,
    "expires_at": "2024-12-15T10:30:00Z"
  }
}
```

### Cancel Stock Move

```
POST /api/warehouse/stock-moves/:id/cancel
Body: {
  "reason": "Incorrect destination location"
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid-move-847",
    "move_number": "MV-2024-00847",
    "status": "cancelled",
    "cancelled_at": "2024-12-14T11:00:00Z",
    "cancelled_by": "uuid-user-2",
    "reason": "Incorrect destination location"
  }
}
```

### Search Move Number (Prefix)

```
GET /api/warehouse/stock-moves/search?prefix=MV-2024-008&limit=20

Response (< 300ms):
{
  "success": true,
  "data": [
    {
      "id": "uuid-move-847",
      "move_number": "MV-2024-00847",
      "lp_number": "LP-1214-000234",
      "product_name": "Sugar White",
      "move_type": "putaway",
      "status": "completed"
    },
    {
      "id": "uuid-move-846",
      "move_number": "MV-2024-00846",
      "lp_number": "LP-1214-000233",
      "product_name": "Flour Type 00",
      "move_type": "transfer",
      "status": "completed"
    }
  ]
}
```

---

## Permissions

| Role | View List | Create Move | Cancel Move | Export CSV | View Details |
|------|-----------|-------------|-------------|------------|--------------|
| Admin | Yes | Yes | Yes | Yes | Yes |
| Warehouse Manager | Yes | Yes | Yes | Yes | Yes |
| Warehouse Operator | Yes | Yes | Limited (own moves) | Yes | Yes |
| Production Manager | Yes | No | No | Yes | Yes |
| Viewer | Yes | No | No | Yes | Yes |

---

## Validation

| Field | Rule | Error Message |
|-------|------|---------------|
| Date range | from_date <= to_date | "Invalid date range" |
| Date range | Range <= 90 days | "Date range cannot exceed 90 days" |
| Warehouse filter | Valid UUID or 'all' | "Invalid warehouse filter" |
| Move type filter | Valid enum values only | "Invalid move type filter" |
| Status filter | Valid enum values only | "Invalid status filter" |
| Page | >= 1 | "Invalid page number" |
| Limit | 1-100 | "Limit must be between 1 and 100" |
| Export | Max 10,000 records | "Export cannot exceed 10,000 records. Please narrow your filters" |
| Cancel move | Status must be pending or in_transit | "Cannot cancel completed or cancelled moves" |
| Search prefix | Min 3 characters | "Search term too short (min 3 chars)" |

---

## Business Rules

### Move Status Logic

| Status | Can Cancel | Can Edit | Can Repeat | Notes |
|--------|------------|----------|------------|-------|
| pending | Yes | Yes | Yes | Awaiting execution |
| in_transit | Yes | No | Yes | Move in progress |
| completed | No | No | Yes | Successfully completed |
| cancelled | No | No | No | Cancelled with reason |

### Move Type Logic

| Move Type | Created By | Auto/Manual | LP Status Change |
|-----------|------------|-------------|------------------|
| manual | User action | Manual | Location updated |
| putaway | GRN completion | Auto | Location updated to storage |
| transfer | TO shipment/receipt | Auto | Location updated between warehouses |
| consumption | WO material consumption | Auto | Status changed to 'consumed' |
| adjustment | Inventory adjustment | Manual | Quantity updated |
| split-related | LP split operation | Auto | New LP created |

### Duration Calculation

```typescript
function calculateDuration(createdAt: Date, moveDate: Date, status: string): string {
  if (status !== 'completed') return '-';

  const durationMs = moveDate.getTime() - createdAt.getTime();
  const minutes = Math.floor(durationMs / (1000 * 60));
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours} hr${hours > 1 ? 's' : ''} ${minutes % 60} min`;
  } else {
    return `${minutes} min`;
  }
}
```

### Cross-Warehouse Detection

```typescript
function isCrossWarehouse(fromWarehouseId: string, toWarehouseId: string): boolean {
  return fromWarehouseId !== toWarehouseId;
}

// Display logic
if (isCrossWarehouse) {
  display = `${fromWarehouseName} → ${toWarehouseName}`;
} else {
  display = warehouseName; // Same warehouse
}
```

---

## Accessibility

### Touch Targets
- All buttons: minimum 48x48dp
- Table row click area: full row height (72px)
- Filter dropdowns: 48dp height
- Quick filter buttons: 48dp minimum

### Contrast
- Text on badges: 4.5:1 minimum
- Table text: 4.5:1 minimum
- Action buttons: 4.5:1 minimum
- Status indicators: 4.5:1 minimum (WCAG AA)

### Screen Reader
- KPI cards: "Total stock moves card: 2,847 moves in last 30 days, click to view all moves"
- Table: Proper column headers with scope="col"
- Move type badges: "Move type: Putaway", "Move type: Transfer"
- Status badges: "Status: Completed", "Status: In Transit"
- Movement path: "From WH-RECV to WH-A01-02 in Main Warehouse, duration 12 minutes"
- Actions menu: "Actions for move MV-2024-00847, menu expanded, 6 items"

### Keyboard Navigation
- Tab: Move between interactive elements
- Enter: Activate button/link
- Escape: Close dropdown/modal
- Arrow keys: Navigate within dropdown/menu
- Shift+Tab: Reverse navigation

### ARIA Attributes
- Table: role="table" with proper row/cell structure
- Type badges: role="status" aria-label="Move type: {type}"
- Status badges: role="status" aria-label="Status: {status}"
- Filters: aria-expanded for dropdowns, aria-label for inputs
- Export button: aria-label="Export stock movements to CSV"

---

## Responsive Breakpoints

| Breakpoint | Layout | Changes |
|------------|--------|---------|
| Desktop (>1024px) | Full table with all columns | Full KPI cards (4 across), all filters visible |
| Tablet (768-1024px) | Condensed table | 2x2 KPI grid, primary filters visible, secondary collapsed |
| Mobile (<768px) | Card layout | Vertical KPI list, filters in modal, card per move |

### Mobile-Specific
- Filters collapse into modal/drawer
- Table becomes card list
- Pagination becomes "Load More" button
- Actions menu as bottom sheet
- Search bar sticky at top
- Quick filters as horizontal scroll

---

## Performance Notes

### Query Optimization
- Index on: `(org_id, created_at DESC)`
- Index on: `(org_id, lp_id, created_at DESC)`
- Index on: `(org_id, status, created_at DESC)`
- Index on: `(org_id, move_type, created_at DESC)`
- Index on: `(org_id, move_number text_pattern_ops)` for prefix search
- Index on: `(org_id, from_location_id, to_location_id)`

### Caching Strategy
```typescript
// Redis keys
'org:{orgId}:warehouse:stock-moves-list:{filters_hash}'  // 30 sec TTL (volatile data)
'org:{orgId}:warehouse:stock-moves-summary:{date_range}' // 1 min TTL
'org:{orgId}:warehouse:warehouses:dropdown'              // 5 min TTL
'org:{orgId}:warehouse:locations:dropdown'               // 5 min TTL
'org:{orgId}:warehouse:move-types:enum'                  // 1 hour TTL (static)
```

### Load Time Targets
- Initial page load: <500ms (P95)
- Filter change: <300ms
- Pagination: <300ms
- Prefix search: <300ms (per PRD requirement)
- Export generation: <3s for 10,000 records
- Summary calculation: <200ms

### Pagination Strategy
- Default: 50 per page (optimized for warehouse workflows)
- Desktop: Server-side pagination with page numbers
- Mobile: Infinite scroll with "Load More" button
- Cache page 1 results for 30 seconds

---

## Testing Requirements

### Unit Tests
- KPI calculations (total, completed, in-transit, pending, success rate)
- Move type badge color mapping
- Status badge color mapping
- Duration calculation logic
- Cross-warehouse detection logic
- Filter query building (all combinations)
- Prefix search query optimization
- Date range validation (max 90 days)

### Integration Tests
- GET /api/warehouse/stock-moves with various filters
- GET /api/warehouse/stock-moves/summary with date ranges
- POST /api/warehouse/stock-moves/export with filters
- POST /api/warehouse/stock-moves/:id/cancel
- GET /api/warehouse/stock-moves/search (prefix < 300ms)
- RLS policy enforcement (org_id isolation)
- Date range filter works correctly
- Move type filter shows correct badges
- Status filter updates table correctly
- LP number filter finds matching moves
- Product filter cascades correctly
- Location filters (from/to) work independently

### E2E Tests
- Page load with data shows all KPIs and table
- Empty state shows correct message and actions
- Filter by date range updates table correctly
- Filter by warehouse updates moves
- Filter by move type shows correct badges
- Filter by status shows correct moves
- Search by move number prefix returns results < 300ms
- LP number filter finds matching moves
- Product filter shows correct moves
- Location filters (from/to) work correctly
- Quick filters apply correct date ranges
- Export CSV downloads file
- Cancel move updates status
- Click row navigates to detail page
- Create button opens create modal
- Responsive layout at all breakpoints
- Cross-warehouse moves display correctly
- Duration calculated and displayed correctly
- WO/TO references display correctly
- Filtered empty state shows "clear filters" action

### Performance Tests
- List 10,000 moves loads in <1s
- Filter change responds in <300ms
- Prefix search responds in <300ms
- Export 10,000 moves completes in <3s
- Summary calculation completes in <200ms

---

## Quality Gates

Before handoff to FRONTEND-DEV:
- [x] All 5 states defined (Loading, Empty, Error, Success, Filtered Empty)
- [x] Responsive breakpoints documented (Desktop/Tablet/Mobile)
- [x] All API endpoints specified with request/response schemas
- [x] Accessibility checklist passed (touch targets, contrast, screen reader, keyboard, ARIA)
- [x] Performance targets defined (search < 300ms per PRD)
- [x] Move type badge colors defined for all 6 types
- [x] Status badge colors defined for all 4 statuses
- [x] Duration calculation logic documented
- [x] Cross-warehouse detection logic documented
- [x] Export workflow defined
- [x] Cancel workflow defined
- [x] Filter logic documented (9 filters including prefix search)
- [x] Permissions matrix documented
- [x] Business rules for status/type documented
- [x] WO/TO reference display logic defined
- [x] Pagination strategy defined (50 per page per PRD)

---

## Handoff to FRONTEND-DEV

```yaml
feature: Stock Movements List Page
story: WH-006
fr_coverage: WH-FR-005 (Stock Moves)
approval_status:
  mode: "auto_approve"
  user_approved: true  # AUTO-APPROVED PER TASK INSTRUCTIONS
  screens_approved: ["WH-006-stock-movements-list"]
  iterations_used: 0
deliverables:
  wireframe: docs/3-ARCHITECTURE/ux/wireframes/WH-006-stock-movements-list.md
  api_endpoints:
    - GET /api/warehouse/stock-moves
    - GET /api/warehouse/stock-moves/summary
    - GET /api/warehouse/stock-moves/search (prefix, <300ms)
    - POST /api/warehouse/stock-moves/export
    - POST /api/warehouse/stock-moves/:id/cancel
states_per_screen: [loading, empty, error, success, filtered_empty]
breakpoints:
  mobile: "<768px (card layout, load more)"
  tablet: "768-1024px (condensed table)"
  desktop: ">1024px (full table)"
accessibility:
  touch_targets: "48x48dp minimum"
  contrast: "4.5:1 minimum (WCAG 2.1 AA)"
  aria_roles: "table, status"
  keyboard_nav: "Tab, Enter, Escape, Arrow keys, Shift+Tab"
performance_targets:
  initial_load: "<500ms (P95)"
  filter_change: "<300ms"
  prefix_search: "<300ms (PRD requirement WH-FR-005)"
  export_generation: "<3s for 10,000 records"
  pagination: "50 per page (PRD requirement WH-FR-005)"
key_features:
  - 9 filters (date range, warehouse, move type, status, LP number, product, from location, to location, move ID search)
  - 4 KPI cards (total, completed, in-transit, pending)
  - Move type badges (manual, putaway, transfer, consumption, adjustment, split-related)
  - Status badges (pending, in_transit, completed, cancelled)
  - Duration calculation (move_date - created_at)
  - Cross-warehouse detection and display
  - WO/TO reference display (if applicable)
  - Export to CSV (max 10,000 records)
  - Cancel move (pending/in-transit only)
  - Prefix search optimization (<300ms with text_pattern_ops index)
  - Quick filters (Today, This Week, This Month, Completed Only)
related_screens:
  - WH-001: Warehouse Dashboard
  - WH-002: License Plates List
  - WH-003: LP Detail Page
  - WH-005: Stock Move Detail Page (to be created)
  - PLAN-012: Transfer Order Detail
  - PROD-015: Work Order Detail
database_tables:
  - stock_moves (primary)
  - license_plates (JOIN for LP details)
  - products (JOIN for product names)
  - locations (JOIN for from/to location details)
  - warehouses (JOIN for warehouse names)
  - users (JOIN for user names)
  - work_orders (optional JOIN for WO reference)
  - transfer_orders (optional JOIN for TO reference)
```

---

**Status**: Ready for Implementation
**Approval Mode**: auto_approve (per task instructions)
**User Approved**: True (auto-approved)
**Iterations**: 0 of 3
**Estimated Effort**: 10-12 hours
**Quality Target**: 95%+
**PRD Coverage**: WH-FR-005 (100%)

---

## Notes

### Design Decisions

1. **Date Range Default**: Last 30 days provides optimal balance between recent activity and performance

2. **Move Type Taxonomy**: 6 distinct types cover all warehouse movement scenarios (manual, putaway, transfer, consumption, adjustment, split-related)

3. **Duration Display**: Calculated as move_date - created_at to show how long movement took (pending/in-transit show "-")

4. **Cross-Warehouse Indication**: Shows both warehouse names when from/to warehouses differ (e.g., "Main → Branch")

5. **WO/TO References**: Display related work order or transfer order numbers for context

6. **Export Limit**: 10,000 records maximum to prevent performance issues and timeout

7. **Cancel Logic**: Only pending/in-transit moves can be cancelled (completed moves are immutable)

8. **Prefix Search Optimization**: Uses text_pattern_ops index for <300ms search per PRD requirement

9. **Quick Filters**: Common date ranges as one-click filters for efficiency

10. **Pagination**: 50 per page default optimized for warehouse scanning workflows per PRD

### Future Enhancements

- **Real-time Updates**: WebSocket updates for in-transit moves
- **Bulk Operations**: Multi-select and bulk cancel
- **Movement Analytics**: Charts for movement trends by type/location
- **Route Optimization**: Suggest optimal movement paths
- **Mobile Scanner View**: Dedicated mobile UI for scanner users
- **Movement Scheduling**: Schedule future movements
- **Location Heatmap**: Visualize movement frequency by location
- **Audit Trail**: Full audit log with before/after states
