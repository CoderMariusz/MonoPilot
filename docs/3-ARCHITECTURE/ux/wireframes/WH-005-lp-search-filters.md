# WH-005: LP Search & Filters

**Module**: Warehouse
**Feature**: LP Search & Filters (WH-FR-002, WH-FR-009, WH-FR-010)
**Story**: 05.5 - LP Search & Filters
**Status**: Approved (Auto-Approve Mode)
**Last Updated**: 2026-01-02

---

## User Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                  LP Search & Filter User Flow                    │
└─────────────────────────────────────────────────────────────────┘

1. Search Flow (Primary)
   ┌──────────────┐
   │ LP List Page │
   └──────────────┘
          │
          ├──[Type in Search]──> Debounce 300ms ──> Execute search
          │                                          │
          │                                          ├──> Results update
          │                                          │
          │                                          └──> Highlight matches
          │
          └──[Clear Search]──> Search cleared ──> Full list restored

2. Filter Panel Flow
   ┌──────────────────┐
   │ Click "Filters"  │
   └──────────────────┘
          │
          ├──[Desktop]──> Panel slides in from left (400px)
          │
          ├──[Tablet]──> Panel slides in from left (350px)
          │
          └──[Mobile]──> Full-screen modal opens

   ┌──────────────────┐
   │  Filter Panel    │
   └──────────────────┘
          │
          ├──[Select Product(s)]──> Multi-select dropdown
          │
          ├──[Select Warehouse]──> Single-select dropdown
          │
          ├──[Select Location(s)]──> Multi-select (filtered by warehouse)
          │
          ├──[Select Status(es)]──> Toggle badges (multi-select)
          │
          ├──[Select QA Status(es)]──> Toggle badges (multi-select)
          │
          ├──[Set Expiry Range]──> Date pickers (from/to)
          │
          ├──[Enter Batch Number]──> Text input (exact match)
          │
          └──[Apply Filters]──> Panel closes ──> Results update

3. Filter Chips Flow
   ┌──────────────────┐
   │ Active Filters   │
   │ Display as Chips │
   └──────────────────┘
          │
          ├──[Click X on chip]──> Remove filter ──> Results update
          │
          └──[Click "Clear All"]──> All filters removed ──> Full list

4. Filter Presets Flow
   ┌──────────────────────┐
   │ Click Preset Button  │
   └──────────────────────┘
          │
          ├──[Expiring Soon]──> status=available + expiry<30d
          │
          ├──[Available Stock]──> status=available + qa_status=passed
          │
          └──[Pending QA]──> qa_status=pending

          └──> Filters applied ──> Chips display ──> Results update

5. Combined Search + Filter Flow
   Search: "LP000001" + Filters: [Product: Flour, Status: Available]

   Results = LPs WHERE lp_number LIKE 'LP000001%'
                  AND product_id = 'flour-uuid'
                  AND status = 'available'

Decision Points:
- Search vs Filter: Both can be active simultaneously (AND logic)
- Clear individual chip vs Clear All: Individual removes one filter, Clear All resets
- Apply vs Auto-apply: Desktop uses Apply button, mobile can use auto-apply
- Filter persistence: Filters stored in URL query params for bookmarking
```

---

## ASCII Wireframe

### Success State - Search Bar (Desktop)

```
+--------------------------------------------------------------------------------------------------+
|  Warehouse > License Plates                            [+ Create LP] [Export] [Print Labels]     |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  +----------------------------------------------------------------------------------------------+  |
|  | 🔍 [Search LP number or batch...____________________________]  [Filters (3)] [Clear All]    |  |
|  |                                                                                              |  |
|  | Active Filters: [Product: Flour ✕] [Status: Available ✕] [Expiry: <30 days ✕]             |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  Quick Filters: [Expiring Soon (30d)] [Available Stock] [Pending QA] [Blocked Items]             |
|                                                                                                    |
|  +----------------------------------------------------------------------------------------------+  |
|  | LP Number      | Product          | Qty       | Location         | Status      | QA Status   |   |
|  +----------------------------------------------------------------------------------------------+  |
|  | LP00000156     | Whole Wheat Flour| 500 KG    | WH-01/ZONE-A/A1 | [Available] | [Passed]    |   |
|  |                | SKU: FLR-001     |           | Bin: A1-01-03    |             |             |   |
|  |                | Batch: B-2025-045| Expiry: 2026-01-25 (23 days)  ⚠️            | [View] [...] |   |
|  +----------------------------------------------------------------------------------------------+  |
|  | LP00000155     | Whole Wheat Flour| 250 KG    | WH-01/ZONE-A/A2 | [Available] | [Passed]    |   |
|  |                | SKU: FLR-001     |           | Bin: A2-01-01    |             |             |   |
|  |                | Batch: B-2025-046| Expiry: 2026-01-20 (18 days)  ⚠️            | [View] [...] |   |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  Showing 2 of 856 LPs (filtered from 1,247 total)                    [< Previous] [1] [Next >]    |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

### Success State - Advanced Filter Panel (Desktop, Panel Open)

```
+----------------+---------------------------------------------------------------------------------+
| FILTERS        | Warehouse > License Plates                    [+ Create] [Export] [Print]    |
|                |                                                                                 |
| [✕ Close]      | +-----------------------------------------------------------------------------+ |
|                | | 🔍 [Search LP number...________]  [Filters (3) ✓] [Clear All]            | |
|                | |                                                                             | |
|                | | Active: [Product: Flour ✕] [Status: Available ✕] [Expiry: <30 days ✕]    | |
|                | +-----------------------------------------------------------------------------+ |
| LP Number/Batch|                                                                                 |
| [__________]   | +-----------------------------------------------------------------------------+ |
|                | | LP Number    | Product         | Qty    | Location      | Status  | QA    | |
|                | +-----------------------------------------------------------------------------+ |
| Product        | | LP00000156   | Whole Wheat...  | 500 KG | WH-01/A1     | [Avail] | [Pass]| |
| [Select...  v] | | LP00000155   | Whole Wheat...  | 250 KG | WH-01/A2     | [Avail] | [Pass]| |
| [ ] Flour      | +-----------------------------------------------------------------------------+ |
| [ ] Sugar      |                                                                                 |
| [ ] Butter     | Showing 2 of 856 LPs (filtered)                    [< Prev] [1] [Next >]      |
|                |                                                                                 |
| Warehouse      +---------------------------------------------------------------------------------+
| (•) All
| ( ) WH-01
| ( ) WH-02
|
| Location
| [Select...  v]
| [ ] ZONE-A
| [ ] ZONE-B
|
| Status
| +------------+
| | [Available]| (selected - green bg)
| | [Reserved ]| (outline)
| | [Consumed ]| (outline)
| | [Blocked  ]| (outline)
| +------------+
|
| QA Status
| +------------+
| | [Pending  ]| (outline)
| | [Passed   ]| (selected - green bg)
| | [Failed   ]| (outline)
| | [Quarantn ]| (outline)
| +------------+
|
| Expiry Date
| From:
| [____/____/___]
| 📅
| To:
| [01/31/2026___]
| 📅
|
| Batch Number
| [__________]
|
| ───────────
| Quick Filters
|
| [Expiring Soon]
| [Available    ]
| [Pending QA   ]
|
| ───────────
|
| [Clear All    ]
| [Apply Filters]
+----------------+
```

### Success State - Search Debounce Loading (Desktop)

```
+--------------------------------------------------------------------------------------------------+
|  Warehouse > License Plates                            [+ Create LP] [Export] [Print Labels]     |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  +----------------------------------------------------------------------------------------------+  |
|  | 🔍 [LP000001_________________________________] ⏳ Searching...          [Filters] [Clear]    |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  +----------------------------------------------------------------------------------------------+  |
|  | [========================================]                                                   |  |
|  | [============================]                                                               |  |
|  +----------------------------------------------------------------------------------------------+  |
|  | [========================================]                                                   |  |
|  | [============================]                                                               |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  Searching...                                                                                      |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

### Empty State - No Search Results (Desktop)

```
+--------------------------------------------------------------------------------------------------+
|  Warehouse > License Plates                            [+ Create LP] [Export] [Print Labels]     |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  +----------------------------------------------------------------------------------------------+  |
|  | 🔍 [LP999999________________________________]  [Filters] [Clear Search]                     |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|                                                                                                    |
|                                      +------------------+                                          |
|                                      |  [Search Icon]   |                                          |
|                                      |       🔍         |                                          |
|                                      +------------------+                                          |
|                                                                                                    |
|                              No License Plates Found                                               |
|                                                                                                    |
|                     No license plates match "LP999999". Please check                               |
|                     the LP number and try again.                                                   |
|                                                                                                    |
|                                                                                                    |
|                              [Clear Search]    [View All LPs]                                      |
|                                                                                                    |
|                                                                                                    |
|  Suggestions:                                                                                      |
|  • Check for typos in the LP number                                                                |
|  • Try searching with a shorter prefix (e.g., "LP0000" instead of full number)                    |
|  • Use filters to narrow down by product, location, or status                                      |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

### Empty State - No Filter Results (Desktop)

```
+--------------------------------------------------------------------------------------------------+
|  Warehouse > License Plates                            [+ Create LP] [Export] [Print Labels]     |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  +----------------------------------------------------------------------------------------------+  |
|  | 🔍 [Search...___________________________]  [Filters (5)] [Clear All]                        |  |
|  |                                                                                              |  |
|  | Active: [Product: Flour ✕] [Warehouse: WH-02 ✕] [Status: Blocked ✕]                       |  |
|  |         [QA: Failed ✕] [Batch: BATCH-999 ✕]                                                |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|                                                                                                    |
|                                      +------------------+                                          |
|                                      |  [Filter Icon]   |                                          |
|                                      |       🗂️         |                                          |
|                                      +------------------+                                          |
|                                                                                                    |
|                              No License Plates Match Your Filters                                  |
|                                                                                                    |
|                     No LPs found matching: Product=Flour, Warehouse=WH-02,                         |
|                     Status=Blocked, QA=Failed, Batch=BATCH-999                                     |
|                                                                                                    |
|                                                                                                    |
|                              [Clear All Filters]    [Adjust Filters]                               |
|                                                                                                    |
|                                                                                                    |
|  Suggestions:                                                                                      |
|  • Remove one or more filters to see broader results                                               |
|  • Try different filter combinations                                                               |
|  • Check if the batch number is correct                                                            |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

### Error State - Search Failed (Desktop)

```
+--------------------------------------------------------------------------------------------------+
|  Warehouse > License Plates                            [+ Create LP] [Export] [Print Labels]     |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  +----------------------------------------------------------------------------------------------+  |
|  | 🔍 [LP000001________________________________]  [Filters] [Clear]                            |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|                                                                                                    |
|                                      +------------------+                                          |
|                                      |   [Error Icon]   |                                          |
|                                      |       ⚠️         |                                          |
|                                      +------------------+                                          |
|                                                                                                    |
|                              Search Failed                                                         |
|                                                                                                    |
|                     Unable to complete search. Please try again.                                   |
|                                                                                                    |
|                              Error: SEARCH_QUERY_FAILED                                            |
|                                                                                                    |
|                                                                                                    |
|                              [Retry Search]    [Clear Search]                                      |
|                                                                                                    |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

### Loading State - Initial Filter Load (Desktop)

```
+--------------------------------------------------------------------------------------------------+
|  Warehouse > License Plates                            [+ Create LP] [Export] [Print Labels]     |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  +----------------------------------------------------------------------------------------------+  |
|  | 🔍 [Search...___________________________]  [Filters] [Clear All]                            |  |
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
|  Loading filtered results...                                                                       |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

---

## Advanced Filter Panel (Tablet: 768-1024px)

```
+--------------+-------------------------------------------------------------+
| FILTERS      | Warehouse > License Plates          [+ Create] [Export]      |
|              |                                                              |
| [✕ Close]    | +----------------------------------------------------------+ |
|              | | 🔍 [Search...________] [Filters (3) ✓] [Clear All]     | |
| LP/Batch     | +----------------------------------------------------------+ |
| [________]   |                                                              |
|              | Active: [Product: Flour ✕] [Status: Avail ✕] [Exp<30d ✕]  |
| Product      |                                                              |
| [Select.. v] | +----------------------------------------------------------+ |
| [ ] Flour    | | LP00000156  Flour  500KG  A1  [Avail] [Pass] [View]    | |
| [ ] Sugar    | | LP00000155  Flour  250KG  A2  [Avail] [Pass] [View]    | |
|              | +----------------------------------------------------------+ |
| Warehouse    |                                                              |
| (•) All      | Showing 2 of 856 (filtered)               [<] [1] [>]       |
| ( ) WH-01    |                                                              |
|              +--------------------------------------------------------------+
| Location
| [Select.. v]
|
| Status
| [Available]  (green bg - selected)
| [Reserved ]  (outline)
| [Blocked  ]  (outline)
|
| QA Status
| [Passed   ]  (green bg - selected)
| [Pending  ]  (outline)
|
| Expiry
| From:
| [____/___/___]
| To:
| [01/31/2026__]
|
| ──────────
| Quick
|
| [Expiring
|  Soon]
| [Available
|  Stock]
|
| ──────────
|
| [Clear All  ]
| [Apply      ]
+--------------+
```

---

## Mobile Filter Modal (<768px)

```
+----------------------------------+
|  ◀ Filters               [✕ Close] |
+----------------------------------+
|                                  |
|  Search LP or Batch              |
|  [_____________________________] |
|                                  |
|  ────────────────────────────    |
|                                  |
|  Product                         |
|  [Select products...         v]  |
|  ☐ Whole Wheat Flour             |
|  ☐ Granulated Sugar              |
|  ☐ Butter                        |
|  ☐ Cocoa Powder                  |
|                                  |
|  ────────────────────────────    |
|                                  |
|  Warehouse                       |
|  (•) All Warehouses              |
|  ( ) WH-01 - Main Warehouse      |
|  ( ) WH-02 - Cold Storage        |
|                                  |
|  ────────────────────────────    |
|                                  |
|  Location                        |
|  [Select locations...        v]  |
|  ☐ ZONE-A                        |
|  ☐ ZONE-B                        |
|  ☐ ZONE-C                        |
|                                  |
|  ────────────────────────────    |
|                                  |
|  Status                          |
|  +----------------------------+  |
|  | [Available]  [Reserved]    |  |
|  | [Consumed]   [Blocked]     |  |
|  +----------------------------+  |
|  (Tap to toggle - green=selected)|
|                                  |
|  ────────────────────────────    |
|                                  |
|  QA Status                       |
|  +----------------------------+  |
|  | [Pending]    [Passed]      |  |
|  | [Failed]     [Quarantine]  |  |
|  +----------------------------+  |
|                                  |
|  ────────────────────────────    |
|                                  |
|  Expiry Date Range               |
|  From: [____/____/______] 📅     |
|  To:   [____/____/______] 📅     |
|                                  |
|  ────────────────────────────    |
|                                  |
|  Batch Number (exact match)      |
|  [_____________________________] |
|                                  |
|  ────────────────────────────    |
|                                  |
|  Quick Filters                   |
|  [Expiring Soon (30 days)    ]   |
|  [Available Stock            ]   |
|  [Pending QA                 ]   |
|                                  |
|  ════════════════════════════    |
|                                  |
|  [Clear All Filters          ]   |
|  [Apply Filters (3)          ]   |
|                                  |
+----------------------------------+
```

---

## Filter Preset Buttons (Desktop)

```
+--------------------------------------------------------------------------------------------------+
|  Quick Filters:                                                                                   |
|                                                                                                    |
|  +---------------------+ +---------------------+ +---------------------+ +---------------------+   |
|  | 📅 Expiring Soon    | | ✓ Available Stock   | | ⏱️ Pending QA       | | ⛔ Blocked Items    |   |
|  | Next 30 days        | | Available + Passed  | | Awaiting Approval   | | Quality Holds       |   |
|  | [Apply]             | | [Apply]             | | [Apply]             | | [Apply]             |   |
|  +---------------------+ +---------------------+ +---------------------+ +---------------------+   |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

---

## Key Components

### 1. Search Input

| Element | Behavior | Performance |
|---------|----------|-------------|
| **Search Input** | Text input, placeholder: "Search LP number or batch..." | Debounce 300ms |
| **Search Icon** | 🔍 icon on left side | Visual indicator |
| **Clear Button** | X button appears when text entered | Clears search instantly |
| **Loading State** | ⏳ spinner + "Searching..." text | Shows during query |
| **Keyboard** | Enter key bypasses debounce, executes immediately | Improves UX |

### 2. Filter Chips Display

| Chip Type | Display Format | Remove Action |
|-----------|----------------|---------------|
| **Product** | "Product: Flour" + X icon | Remove filter, update results |
| **Warehouse** | "Warehouse: WH-01" + X icon | Remove filter, update results |
| **Location** | "Location: ZONE-A" + X icon | Remove filter, update results |
| **Status** | "Status: Available" + X icon | Remove filter, update results |
| **QA Status** | "QA: Passed" + X icon | Remove filter, update results |
| **Expiry Range** | "Expiry: <30 days" + X icon | Remove filter, update results |
| **Batch** | "Batch: BATCH-001" + X icon | Remove filter, update results |
| **Clear All** | Button visible when 2+ filters | Removes all chips, clears filters |

### 3. Advanced Filter Panel

| Filter Type | Component | Options | Behavior |
|-------------|-----------|---------|----------|
| **LP Number/Batch** | Text input | Search term (min 2 chars) | Prefix search for LP, exact match for batch |
| **Product** | Multi-select dropdown | All products | Filter by product_id IN (...) |
| **Warehouse** | Single-select radio | All warehouses | Filter by warehouse_id = X |
| **Location** | Multi-select dropdown | Filtered by warehouse | Filter by location_id IN (...) |
| **Status** | Toggle badges | Available, Reserved, Consumed, Blocked | Multi-select, green bg when selected |
| **QA Status** | Toggle badges | Pending, Passed, Failed, Quarantine | Multi-select, green bg when selected |
| **Expiry Range** | Date pickers | From/To dates | Filter by expiry_date BETWEEN from AND to |
| **Batch Number** | Text input | Exact match | Filter by batch_number = 'X' |

### 4. Filter Presets

| Preset | Filters Applied | Use Case |
|--------|----------------|----------|
| **Expiring Soon (30d)** | status='available' + expiry_before=(today+30) | Inventory management, FEFO compliance |
| **Available Stock** | status='available' + qa_status='passed' | Production picking |
| **Pending QA** | qa_status='pending' | QA team workflow |
| **Blocked Items** | status='blocked' | Quality holds, investigations |

### 5. Filter Panel Actions

| Action | Location | Behavior |
|--------|----------|----------|
| **Apply Filters** | Bottom of panel | Closes panel, applies all selected filters, updates results |
| **Clear All** | Bottom of panel | Resets all filters to default, keeps panel open |
| **Close Panel** | Top-right X | Closes panel without applying changes |

---

## Main Actions

### Search Actions

| Action | Trigger | Result |
|--------|---------|--------|
| **Type in search** | Keyboard input | Debounce 300ms, execute search |
| **Press Enter** | Enter key | Bypass debounce, execute immediately |
| **Clear search** | Click X button | Clear input, restore full list |

### Filter Actions

| Action | Trigger | Result |
|--------|---------|--------|
| **Open filter panel** | Click "Filters" button | Panel slides in (desktop/tablet) or modal opens (mobile) |
| **Select filter value** | Click/tap on option | Update filter state (not applied yet) |
| **Apply filters** | Click "Apply Filters" | Close panel, update results, show chips |
| **Clear all filters** | Click "Clear All" in panel | Reset all filters to default |
| **Remove filter chip** | Click X on chip | Remove that filter, update results |
| **Click preset** | Click preset button | Apply preset filters, show chips, update results |

---

## States

| State | Description | Elements Shown |
|-------|-------------|----------------|
| **Loading Search** | Search query executing | Spinner + "Searching..." in search input, table shows skeleton |
| **Loading Filters** | Filter query executing | Skeleton rows in table, filter chips visible |
| **Empty Search** | Search returns no results | "No LPs found" message, clear search button, suggestions |
| **Empty Filters** | Filters return no results | "No LPs match filters" message, active filter chips, clear all button, suggestions |
| **Success** | Results loaded | Search input, filter chips, table with data, pagination |
| **Error** | Search/filter query failed | Error message, retry button, clear button |

---

## Data Fields

### Search Query Parameters

| Parameter | Type | Example | SQL Behavior |
|-----------|------|---------|--------------|
| search | string (min 2 chars) | "LP000001" | WHERE lp_number ILIKE 'LP000001%' |
| batch_number | string (exact) | "BATCH-001" | WHERE batch_number = 'BATCH-001' |

### Filter Query Parameters

| Parameter | Type | Example | SQL Behavior |
|-----------|------|---------|--------------|
| product_id | UUID | "uuid-1" | WHERE product_id = 'uuid-1' |
| product_ids | UUID[] | ["uuid-1", "uuid-2"] | WHERE product_id IN ('uuid-1', 'uuid-2') |
| warehouse_id | UUID | "uuid-wh-1" | WHERE warehouse_id = 'uuid-wh-1' |
| location_id | UUID | "uuid-loc-1" | WHERE location_id = 'uuid-loc-1' |
| location_ids | UUID[] | ["uuid-1", "uuid-2"] | WHERE location_id IN ('uuid-1', 'uuid-2') |
| status | LPStatus | "available" | WHERE status = 'available' |
| statuses | LPStatus[] | ["available", "reserved"] | WHERE status IN ('available', 'reserved') |
| qa_status | QAStatus | "passed" | WHERE qa_status = 'passed' |
| qa_statuses | QAStatus[] | ["pending", "passed"] | WHERE qa_status IN ('pending', 'passed') |
| expiry_before | Date (YYYY-MM-DD) | "2026-01-31" | WHERE expiry_date <= '2026-01-31' |
| expiry_after | Date (YYYY-MM-DD) | "2026-01-01" | WHERE expiry_date >= '2026-01-01' |
| created_before | DateTime (ISO) | "2026-01-01T00:00:00Z" | WHERE created_at <= '2026-01-01' |
| created_after | DateTime (ISO) | "2025-12-01T00:00:00Z" | WHERE created_at >= '2025-12-01' |

---

## API Endpoints

### Search by LP Number (Prefix)

```
GET /api/warehouse/license-plates?search=LP000001

Query Parameters:
- search: string (min 2 chars, prefix match)

Response (< 300ms):
{
  "success": true,
  "data": [
    {
      "id": "uuid-lp-123",
      "lp_number": "LP00000123",
      "product": { "id": "...", "name": "Flour", "code": "FLR-001" },
      "quantity": 500.0,
      "uom": "KG",
      "location": { "id": "...", "full_path": "WH-01/ZONE-A/A1" },
      "warehouse": { "id": "...", "name": "Main Warehouse" },
      "status": "available",
      "qa_status": "passed",
      "batch_number": "B-2025-045",
      "expiry_date": "2026-06-15"
    },
    ...
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 12,
    "total_pages": 1
  }
}
```

### Search by Batch Number (Exact)

```
GET /api/warehouse/license-plates?batch_number=BATCH-2025-001

Query Parameters:
- batch_number: string (exact match, case-insensitive)

Response (< 300ms):
{
  "success": true,
  "data": [
    {
      "id": "uuid-lp-456",
      "lp_number": "LP00000456",
      "batch_number": "BATCH-2025-001",
      ...
    },
    {
      "id": "uuid-lp-457",
      "lp_number": "LP00000457",
      "batch_number": "BATCH-2025-001",
      ...
    }
  ],
  "pagination": { ... }
}
```

### Advanced Filter Query (Complex)

```
GET /api/warehouse/license-plates?product_ids=uuid-1,uuid-2&warehouse_id=uuid-wh-1&status=available&qa_status=passed&expiry_after=2026-01-01&expiry_before=2026-03-31&sort=expiry_date&order=asc&page=1&limit=50

Query Parameters:
- product_ids: comma-separated UUIDs (OR within param)
- warehouse_id: single UUID
- status: LPStatus enum
- qa_status: QAStatus enum
- expiry_after: ISO date (YYYY-MM-DD)
- expiry_before: ISO date (YYYY-MM-DD)
- sort: 'lp_number' | 'created_at' | 'expiry_date' | 'quantity' | 'batch_number'
- order: 'asc' | 'desc'
- page: integer >= 1
- limit: integer (1-200, default 50)

Response (< 500ms):
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 23,
    "total_pages": 1
  },
  "filters_applied": {
    "product_ids": ["uuid-1", "uuid-2"],
    "warehouse_id": "uuid-wh-1",
    "status": "available",
    "qa_status": "passed",
    "expiry_after": "2026-01-01",
    "expiry_before": "2026-03-31"
  }
}
```

### Combined Search + Filter Query

```
GET /api/warehouse/license-plates?search=LP000001&product_id=uuid-flour&status=available&qa_status=passed

Logic: Results must match ALL conditions (AND):
- LP number starts with "LP000001"
- AND product_id = uuid-flour
- AND status = 'available'
- AND qa_status = 'passed'

Response (< 500ms):
{
  "success": true,
  "data": [ ... ],
  "pagination": { ... },
  "filters_applied": {
    "search": "LP000001",
    "product_id": "uuid-flour",
    "status": "available",
    "qa_status": "passed"
  }
}
```

### Filter Dropdown Data (Products)

```
GET /api/warehouse/license-plates/filter-options/products

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid-product-1",
      "name": "Whole Wheat Flour",
      "code": "FLR-001",
      "lp_count": 45  // Number of LPs with this product
    },
    {
      "id": "uuid-product-2",
      "name": "Granulated Sugar",
      "code": "SUG-001",
      "lp_count": 23
    },
    ...
  ]
}
```

### Filter Dropdown Data (Locations, filtered by warehouse)

```
GET /api/warehouse/license-plates/filter-options/locations?warehouse_id=uuid-wh-1

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid-location-1",
      "full_path": "WH-01/ZONE-A/A1",
      "location_code": "A1",
      "lp_count": 12
    },
    {
      "id": "uuid-location-2",
      "full_path": "WH-01/ZONE-A/A2",
      "location_code": "A2",
      "lp_count": 8
    },
    ...
  ]
}
```

---

## Permissions

| Role | View Filters | Apply Filters | Save Presets | Export Filtered |
|------|-------------|---------------|--------------|----------------|
| Admin | Yes | Yes | Yes (future) | Yes |
| Warehouse Manager | Yes | Yes | Yes (future) | Yes |
| Warehouse Operator | Yes | Yes | No | Yes |
| QA Manager | Yes | Yes | No | Yes |
| Production Operator | Yes | Yes | No | No |
| Viewer | Yes | Yes | No | No |

---

## Validation

### Search Validation

| Field | Rule | Error Message |
|-------|------|---------------|
| search | Min 2 characters | "Search term must be at least 2 characters" |
| search | Max 100 characters | "Search term too long (max 100 chars)" |
| batch_number | Max 100 characters | "Batch number too long (max 100 chars)" |

### Filter Validation

| Field | Rule | Error Message |
|-------|------|---------------|
| product_id | Valid UUID | "Invalid product ID" |
| product_ids | Array of valid UUIDs | "Invalid product IDs" |
| warehouse_id | Valid UUID | "Invalid warehouse ID" |
| location_id | Valid UUID | "Invalid location ID" |
| location_ids | Array of valid UUIDs | "Invalid location IDs" |
| status | Valid LPStatus enum | "Invalid status filter" |
| statuses | Array of valid LPStatus enums | "Invalid status filters" |
| qa_status | Valid QAStatus enum | "Invalid QA status filter" |
| qa_statuses | Array of valid QAStatus enums | "Invalid QA status filters" |
| expiry_before | Valid date (YYYY-MM-DD) | "Invalid expiry before date" |
| expiry_after | Valid date (YYYY-MM-DD) | "Invalid expiry after date" |
| expiry_before/after | expiry_before >= expiry_after | "Expiry before date must be after expiry after date" |
| page | Integer >= 1 | "Page must be 1 or greater" |
| limit | Integer 1-200 | "Limit must be between 1 and 200" |

---

## Business Rules

### Search Behavior

1. **LP Number Search**: Prefix match, case-insensitive
   - User types "LP000001" → Matches "LP00000123", "LP00000124", etc.
   - Uses `ILIKE 'LP000001%'` with `text_pattern_ops` index
   - Minimum 2 characters required

2. **Batch Number Search**: Exact match, case-insensitive
   - User types "BATCH-001" → Matches only "BATCH-001" (not "BATCH-0012")
   - Uses `batch_number = 'BATCH-001'` (case-insensitive)

3. **Search + Filter Combination**: AND logic
   - Search: "LP000001" + Filter: Product=Flour
   - Results = LPs WHERE lp_number LIKE 'LP000001%' AND product_id = 'flour-uuid'

### Filter Combinations

1. **AND Logic Across Filter Types**
   - Product: Flour AND Status: Available AND QA: Passed
   - All conditions must be true

2. **OR Logic Within Same Filter Type**
   - Product: [Flour, Sugar] → product_id IN ('flour-uuid', 'sugar-uuid')
   - Status: [Available, Reserved] → status IN ('available', 'reserved')

3. **Empty Filter = No Restriction**
   - If Product filter is empty → All products included
   - If Status filter is empty → All statuses included

### Date Range Filters

1. **Inclusive Ranges**
   - expiry_after = '2026-01-01' → expiry_date >= '2026-01-01'
   - expiry_before = '2026-01-31' → expiry_date <= '2026-01-31'

2. **NULL Handling**
   - LPs with NULL expiry_date excluded from expiry date filters
   - Only LPs with non-null expiry dates considered

### Filter Presets

| Preset | Filters Applied | SQL Equivalent |
|--------|----------------|----------------|
| **Expiring Soon (30d)** | status='available', expiry_before=(today+30) | WHERE status='available' AND expiry_date <= CURRENT_DATE + INTERVAL '30 days' |
| **Available Stock** | status='available', qa_status='passed' | WHERE status='available' AND qa_status='passed' |
| **Pending QA** | qa_status='pending' | WHERE qa_status='pending' |
| **Blocked Items** | status='blocked' | WHERE status='blocked' |

---

## Accessibility

### Touch Targets
- Search input: 48dp height minimum
- Filter panel toggle button: 48x48dp
- Filter chips X buttons: 48x48dp
- Clear All button: 48dp height
- Apply Filters button: 48dp height
- Filter option toggles (status badges): 48dp height
- Date picker inputs: 48dp height
- Dropdown selectors: 48dp height

### Contrast
- Search input text: 4.5:1 minimum
- Filter chip text: 4.5:1 minimum
- Filter chip background: Sufficient contrast with text
- Selected filter badges (green bg): 4.5:1 minimum
- Panel headings: 4.5:1 minimum
- Button text: 4.5:1 minimum

### Screen Reader
- Search input: "Search license plates by LP number or batch number"
- Filter button: "Open filters panel, 3 filters active"
- Filter chips: "Filter: Product Flour, click to remove"
- Clear All: "Clear all 3 active filters"
- Apply Filters: "Apply selected filters and update results"
- Filter panel: "Advanced filters panel, 8 filter options available"
- Status badges: "Status filter: Available, selected, tap to deselect"
- Preset buttons: "Apply preset: Expiring Soon, filters by available status and expiry within 30 days"

### Keyboard Navigation
- Tab: Move between search input, filter button, filter chips, table
- Enter on search input: Execute search (bypass debounce)
- Enter on filter button: Open filter panel
- Tab in panel: Navigate through filter options
- Space: Toggle checkbox/radio/badge selections
- Enter on "Apply Filters": Apply and close panel
- Escape: Close filter panel without applying
- Tab on filter chip: Focus chip, Enter/Space to remove

### ARIA Attributes
```html
<!-- Search Input -->
<input
  type="search"
  aria-label="Search license plates by LP number or batch"
  aria-describedby="search-help"
  role="searchbox"
/>
<span id="search-help" class="sr-only">
  Enter at least 2 characters to search. Press Enter to search immediately.
</span>

<!-- Filter Button with Badge -->
<button
  aria-label="Open filters panel, 3 filters active"
  aria-expanded="false"
  aria-controls="filter-panel"
>
  Filters (3)
</button>

<!-- Filter Panel -->
<aside
  id="filter-panel"
  role="region"
  aria-label="Advanced filters"
  aria-modal="false"
>
  <!-- Filter content -->
</aside>

<!-- Filter Chip -->
<div role="status" class="filter-chip">
  <span>Product: Flour</span>
  <button aria-label="Remove product filter: Flour">
    <X aria-hidden="true" />
  </button>
</div>

<!-- Status Badge Toggle -->
<button
  role="checkbox"
  aria-checked="true"
  aria-label="Filter by available status"
  class="badge-available"
>
  Available
</button>

<!-- Preset Button -->
<button aria-label="Apply preset: Expiring Soon. Filters by available status and expiry within 30 days">
  📅 Expiring Soon
  <span class="sr-only">Next 30 days</span>
</button>
```

---

## Responsive Breakpoints

| Breakpoint | Search Layout | Filter Panel Layout | Chips Layout |
|------------|---------------|---------------------|--------------|
| Desktop (>1024px) | Full-width search bar with inline filter button | Side panel 400px wide, slides from left | Horizontal chip row below search |
| Tablet (768-1024px) | Full-width search bar | Side panel 350px wide, slides from left | Horizontal chip row, wraps to 2 lines |
| Mobile (<768px) | Full-width search bar | Full-screen modal | Vertical chip stack, 2 columns |

### Mobile-Specific Adaptations
- Filter panel becomes full-screen modal with header "Filters" and X close button
- Search input sticky at top of page
- Filter chips in 2-column grid layout
- "Apply Filters" button fixed at bottom of modal
- Multi-select dropdowns expand to full width
- Date pickers use native mobile date inputs
- Preset buttons in vertical stack (full width)

---

## Performance Notes

### Query Optimization

```sql
-- Indexes for search and filtering (from story 05.1 + additions)

-- LP number prefix search (< 300ms target)
CREATE INDEX idx_lp_number_search
ON license_plates(org_id, lp_number text_pattern_ops);

-- Batch number search
CREATE INDEX idx_lp_batch
ON license_plates(batch_number)
WHERE batch_number IS NOT NULL;

-- Product filter
CREATE INDEX idx_lp_org_product
ON license_plates(org_id, product_id);

-- Warehouse + Location filter
CREATE INDEX idx_lp_org_warehouse
ON license_plates(org_id, warehouse_id);

CREATE INDEX idx_lp_org_location
ON license_plates(org_id, location_id);

-- Status filter
CREATE INDEX idx_lp_org_status
ON license_plates(org_id, status);

-- QA status filter
CREATE INDEX idx_lp_org_qa
ON license_plates(org_id, qa_status);

-- Expiry date range filter
CREATE INDEX idx_lp_expiry
ON license_plates(expiry_date)
WHERE expiry_date IS NOT NULL;

-- Composite index for common filter combinations
CREATE INDEX idx_lp_product_status_qa
ON license_plates(org_id, product_id, status, qa_status);

CREATE INDEX idx_lp_warehouse_location_status
ON license_plates(org_id, warehouse_id, location_id, status);

-- Expiry + status (for "Expiring Soon" preset)
CREATE INDEX idx_lp_expiry_status
ON license_plates(org_id, expiry_date, status)
WHERE expiry_date IS NOT NULL;
```

### Caching Strategy

```typescript
// Redis cache keys (short TTL for volatile inventory data)
const cacheKeys = {
  // Search results (very short TTL)
  lpSearch: (orgId: string, searchTerm: string) =>
    `org:${orgId}:warehouse:lp-search:${searchTerm}`,  // 30 sec TTL

  // Filter results (hash of filter params)
  lpFiltered: (orgId: string, filtersHash: string) =>
    `org:${orgId}:warehouse:lp-filtered:${filtersHash}`,  // 1 min TTL

  // Filter dropdown options (longer TTL)
  filterProducts: (orgId: string) =>
    `org:${orgId}:warehouse:filter-products`,  // 5 min TTL

  filterLocations: (orgId: string, warehouseId: string) =>
    `org:${orgId}:warehouse:filter-locations:${warehouseId}`,  // 5 min TTL

  filterWarehouses: (orgId: string) =>
    `org:${orgId}:warehouse:filter-warehouses`,  // 10 min TTL
};

// Cache invalidation triggers:
// - LP created/updated/deleted → Invalidate all lp-search, lp-filtered, filter-*
// - Location created/updated → Invalidate filter-locations
// - Product created/updated → Invalidate filter-products
// - Warehouse created/updated → Invalidate filter-warehouses
```

### Load Time Targets

| Operation | Target | P95 | Notes |
|-----------|--------|-----|-------|
| Search (prefix, 2 chars) | <300ms | <400ms | Per PRD requirement WH-FR-002 |
| Search (prefix, 5+ chars) | <200ms | <300ms | Narrower results, faster |
| Batch number search | <300ms | <400ms | Exact match, indexed |
| Single filter change | <300ms | <500ms | Simple query |
| Complex filter (5+ params) | <500ms | <700ms | Multiple indexes used |
| Search + Filter combo | <500ms | <700ms | Combined query |
| Filter dropdown load | <200ms | <300ms | Cached options |
| Apply filters | <300ms | <500ms | Query + UI update |

### Debounce Strategy

```typescript
// Search input debounce
const SEARCH_DEBOUNCE_MS = 300;

// User typing "LP000001":
// - L → 300ms wait
// - P → reset timer, 300ms wait
// - 0 → reset timer, 300ms wait
// - ... continues typing
// - (stops typing) → 300ms passes → Execute search

// Enter key bypasses debounce:
// - User types "LP0"
// - Presses Enter → Immediate search (no wait)

function handleSearchInput(value: string) {
  if (value.length < 2) {
    clearResults();
    return;
  }

  clearTimeout(searchTimeout);

  searchTimeout = setTimeout(() => {
    executeSearch(value);
  }, SEARCH_DEBOUNCE_MS);
}

function handleSearchKeyDown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    clearTimeout(searchTimeout);
    executeSearch(searchInput.value);
  }
}
```

### Filter Panel Load Optimization

```typescript
// Lazy load filter options
async function openFilterPanel() {
  // 1. Open panel immediately (show skeleton)
  setPanelOpen(true);

  // 2. Load filter options in parallel
  const [products, warehouses, locations] = await Promise.all([
    fetchFilterProducts(),    // Cached 5 min
    fetchFilterWarehouses(),  // Cached 10 min
    fetchFilterLocations(),   // Cached 5 min
  ]);

  // 3. Populate dropdowns (< 200ms total)
  setFilterOptions({ products, warehouses, locations });
}

// Location dropdown cascades from warehouse selection
async function handleWarehouseChange(warehouseId: string) {
  setLocationLoading(true);
  const locations = await fetchFilterLocations(warehouseId); // Cached
  setLocations(locations);
  setLocationLoading(false);
}
```

---

## Testing Requirements

### Unit Tests

```typescript
describe('LP Search & Filter Logic', () => {
  // Search tests
  test('search by LP prefix returns matching LPs');
  test('search with <2 chars shows validation error');
  test('search debounces at 300ms');
  test('Enter key bypasses debounce');
  test('clear search button resets results');
  test('search by batch number exact match');

  // Filter tests
  test('filter by single product returns correct LPs');
  test('filter by multiple products uses OR logic');
  test('filter by warehouse cascades to location options');
  test('filter by status toggle works');
  test('filter by QA status toggle works');
  test('filter by expiry range excludes NULL expiry LPs');
  test('expiry_before >= expiry_after validation');

  // Combination tests
  test('search + filter uses AND logic');
  test('multiple filters use AND logic across types');
  test('multiple values within filter use OR logic');

  // Preset tests
  test('Expiring Soon preset applies correct filters');
  test('Available Stock preset applies correct filters');
  test('Pending QA preset applies correct filters');
  test('Blocked Items preset applies correct filters');

  // Chip tests
  test('filter chip displays correct label');
  test('remove chip removes filter and updates results');
  test('clear all removes all chips');
});
```

### Integration Tests

```typescript
describe('LP Search & Filter API Integration', () => {
  test('GET /api/warehouse/license-plates?search=LP0001 returns results < 300ms');
  test('GET /api/warehouse/license-plates?batch_number=BATCH-001 exact match');
  test('GET /api/warehouse/license-plates?product_ids=uuid1,uuid2 multiple products');
  test('GET /api/warehouse/license-plates?warehouse_id=uuid filters correctly');
  test('GET /api/warehouse/license-plates?location_ids=uuid1,uuid2 multiple locations');
  test('GET /api/warehouse/license-plates?status=available single status');
  test('GET /api/warehouse/license-plates?statuses=available,reserved multiple statuses');
  test('GET /api/warehouse/license-plates?qa_status=passed filters correctly');
  test('GET /api/warehouse/license-plates?expiry_before=2026-12-31 date filter');
  test('GET /api/warehouse/license-plates?expiry_after=2026-01-01&expiry_before=2026-12-31 range');
  test('GET /api/warehouse/license-plates?search=LP001&product_id=uuid&status=available combo');
  test('GET with complex 5+ params returns results < 500ms');
  test('GET with invalid product_id returns 400 validation error');
  test('GET with invalid date format returns 400');
  test('GET with expiry_before < expiry_after returns 400');
  test('GET with page=0 returns 400');
  test('GET with limit=300 enforces max 200');
  test('RLS enforces org isolation on filtered queries');

  // Filter options endpoints
  test('GET /api/warehouse/license-plates/filter-options/products returns list');
  test('GET /api/warehouse/license-plates/filter-options/locations?warehouse_id=uuid cascades');
  test('GET /api/warehouse/license-plates/filter-options/warehouses returns list');

  // Performance tests
  test('Search with 10K LPs returns in < 300ms');
  test('Complex filter with 10K LPs returns in < 500ms');
  test('Combo search+filter with 10K LPs returns in < 500ms');
});
```

### E2E Tests (Playwright)

```typescript
describe('LP Search & Filter E2E', () => {
  // Search tests
  test('type in search input shows debounce loading', async () => {
    await page.type('[aria-label*="Search"]', 'LP0001');
    await expect(page.locator('text=Searching...')).toBeVisible();
    await page.waitForTimeout(300);
    await expect(page.locator('.lp-table-row')).toHaveCount(12);
  });

  test('press Enter bypasses debounce', async () => {
    await page.type('[aria-label*="Search"]', 'LP0001');
    await page.press('[aria-label*="Search"]', 'Enter');
    // Should see results immediately (no 300ms wait)
    await expect(page.locator('.lp-table-row')).toHaveCount(12);
  });

  test('clear search button restores full list', async () => {
    await page.type('[aria-label*="Search"]', 'LP0001');
    await page.click('button[aria-label*="Clear search"]');
    await expect(page.locator('.lp-table-row')).toHaveCount(1247);
  });

  // Filter panel tests
  test('open filter panel slides in from left', async () => {
    await page.click('button:has-text("Filters")');
    await expect(page.locator('[aria-label="Advanced filters"]')).toBeVisible();
  });

  test('select product filter and apply', async () => {
    await page.click('button:has-text("Filters")');
    await page.click('text=Whole Wheat Flour');
    await page.click('button:has-text("Apply Filters")');
    await expect(page.locator('text=Product: Whole Wheat Flour')).toBeVisible();
    await expect(page.locator('.lp-table-row')).toHaveCount(45);
  });

  test('select warehouse cascades to location filter', async () => {
    await page.click('button:has-text("Filters")');
    await page.click('label:has-text("WH-01")');
    // Location dropdown should now show only WH-01 locations
    await expect(page.locator('#location-filter option')).toContainText('ZONE-A');
  });

  test('toggle status badges for multi-select', async () => {
    await page.click('button:has-text("Filters")');
    await page.click('button:has-text("Available")');
    await expect(page.locator('button:has-text("Available")')).toHaveClass(/selected/);
    await page.click('button:has-text("Reserved")');
    await expect(page.locator('button:has-text("Reserved")')).toHaveClass(/selected/);
    await page.click('button:has-text("Apply Filters")');
    await expect(page.locator('text=Status: Available')).toBeVisible();
    await expect(page.locator('text=Status: Reserved')).toBeVisible();
  });

  test('set expiry date range filter', async () => {
    await page.click('button:has-text("Filters")');
    await page.fill('input[aria-label="Expiry from date"]', '2026-01-01');
    await page.fill('input[aria-label="Expiry to date"]', '2026-01-31');
    await page.click('button:has-text("Apply Filters")');
    await expect(page.locator('text=Expiry: 01/01/2026 - 01/31/2026')).toBeVisible();
  });

  // Filter chip tests
  test('click X on filter chip removes filter', async () => {
    // Setup: Apply product filter
    await page.click('button:has-text("Filters")');
    await page.click('text=Flour');
    await page.click('button:has-text("Apply Filters")');

    // Remove chip
    await page.click('button[aria-label*="Remove product filter"]');
    await expect(page.locator('text=Product: Flour')).not.toBeVisible();
    await expect(page.locator('.lp-table-row')).toHaveCount(1247); // Full list
  });

  test('clear all filters removes all chips', async () => {
    // Setup: Apply multiple filters
    await page.click('button:has-text("Filters")');
    await page.click('text=Flour');
    await page.click('button:has-text("Available")');
    await page.click('button:has-text("Apply Filters")');

    // Clear all
    await page.click('button:has-text("Clear All")');
    await expect(page.locator('.filter-chip')).toHaveCount(0);
    await expect(page.locator('.lp-table-row')).toHaveCount(1247);
  });

  // Preset tests
  test('click Expiring Soon preset applies filters', async () => {
    await page.click('button:has-text("Expiring Soon")');
    await expect(page.locator('text=Status: Available')).toBeVisible();
    await expect(page.locator('text=Expiry: <30 days')).toBeVisible();
    await expect(page.locator('.lp-table-row')).toHaveCount(18);
  });

  test('click Available Stock preset applies filters', async () => {
    await page.click('button:has-text("Available Stock")');
    await expect(page.locator('text=Status: Available')).toBeVisible();
    await expect(page.locator('text=QA: Passed')).toBeVisible();
    await expect(page.locator('.lp-table-row')).toHaveCount(823);
  });

  // Combination tests
  test('search + filter combination works', async () => {
    await page.type('[aria-label*="Search"]', 'LP0001');
    await page.click('button:has-text("Filters")');
    await page.click('text=Flour');
    await page.click('button:has-text("Apply Filters")');
    // Results = search match AND product filter
    await expect(page.locator('.lp-table-row')).toHaveCount(5);
  });

  // Empty states
  test('search with no results shows empty state', async () => {
    await page.type('[aria-label*="Search"]', 'LP999999');
    await page.waitForTimeout(300);
    await expect(page.locator('text=No License Plates Found')).toBeVisible();
    await expect(page.locator('button:has-text("Clear Search")')).toBeVisible();
  });

  test('filters with no results shows filtered empty state', async () => {
    await page.click('button:has-text("Filters")');
    await page.click('text=Flour');
    await page.click('button:has-text("Blocked")');
    await page.click('button:has-text("Apply Filters")');
    await expect(page.locator('text=No License Plates Match Your Filters')).toBeVisible();
    await expect(page.locator('button:has-text("Clear All Filters")')).toBeVisible();
  });

  // Responsive tests
  test('mobile: filter panel opens as full-screen modal', async () => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.click('button:has-text("Filters")');
    await expect(page.locator('[aria-label="Advanced filters"]')).toHaveCSS('width', '100vw');
  });

  test('mobile: filter chips display in 2-column grid', async () => {
    await page.setViewportSize({ width: 375, height: 667 });
    // Apply 4 filters
    await page.click('button:has-text("Filters")');
    await page.click('text=Flour');
    await page.click('button:has-text("Available")');
    await page.click('button:has-text("Passed")');
    await page.fill('input[aria-label="Batch number"]', 'BATCH-001');
    await page.click('button:has-text("Apply Filters")');

    // Chips should be in 2-column grid
    const chips = page.locator('.filter-chip');
    await expect(chips).toHaveCount(4);
    // Check CSS grid layout
    await expect(chips.first()).toHaveCSS('grid-template-columns', 'repeat(2, 1fr)');
  });
});
```

### Performance Tests

```typescript
describe('LP Search & Filter Performance', () => {
  test('search prefix with 10K LPs responds in <300ms', async () => {
    const start = Date.now();
    const response = await fetch('/api/warehouse/license-plates?search=LP0001');
    const end = Date.now();
    expect(end - start).toBeLessThan(300);
    expect(response.ok).toBe(true);
  });

  test('batch search with 10K LPs responds in <300ms', async () => {
    const start = Date.now();
    const response = await fetch('/api/warehouse/license-plates?batch_number=BATCH-001');
    const end = Date.now();
    expect(end - start).toBeLessThan(300);
  });

  test('complex filter (5 params) responds in <500ms', async () => {
    const start = Date.now();
    const response = await fetch('/api/warehouse/license-plates?product_id=uuid&warehouse_id=uuid&status=available&qa_status=passed&expiry_before=2026-12-31');
    const end = Date.now();
    expect(end - start).toBeLessThan(500);
  });

  test('search + filter combo responds in <500ms', async () => {
    const start = Date.now();
    const response = await fetch('/api/warehouse/license-plates?search=LP001&product_id=uuid&status=available');
    const end = Date.now();
    expect(end - start).toBeLessThan(500);
  });

  test('filter dropdown options load in <200ms', async () => {
    const start = Date.now();
    const response = await fetch('/api/warehouse/license-plates/filter-options/products');
    const end = Date.now();
    expect(end - start).toBeLessThan(200);
  });
});
```

---

## Component Specifications

### LPSearchInput Component

```typescript
interface LPSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (value: string) => void;
  loading: boolean;
  placeholder?: string;
  debounceMs?: number; // Default 300
}

// Features:
// - Debounced input (300ms)
// - Enter key bypasses debounce
// - Clear button when text entered
// - Loading spinner during search
// - Min 2 characters validation
// - Accessible labels and ARIA
```

### LPAdvancedFilters Component

```typescript
interface LPAdvancedFiltersProps {
  open: boolean;
  onClose: () => void;
  filters: LPFilters;
  onFiltersChange: (filters: LPFilters) => void;
  onApply: () => void;
  onClearAll: () => void;
  products: Product[];
  warehouses: Warehouse[];
  locations: Location[];
}

// Features:
// - Slide-in panel (desktop/tablet) or modal (mobile)
// - 8 filter types (product, warehouse, location, status, QA, expiry, batch)
// - Multi-select for products, locations, statuses, QA statuses
// - Single-select for warehouse
// - Date pickers for expiry range
// - Text input for batch number
// - Filter presets section
// - Apply and Clear All buttons
// - Loading states for dropdown options
```

### LPFilterChips Component

```typescript
interface LPFilterChipsProps {
  filters: AppliedFilter[];
  onRemoveFilter: (filterKey: string) => void;
  onClearAll: () => void;
}

interface AppliedFilter {
  key: string;          // 'product', 'status', 'expiry', etc.
  label: string;        // Display label
  value: string;        // Display value
  displayText: string;  // Full chip text: "Product: Flour"
}

// Features:
// - Displays active filters as removable chips
// - X button on each chip to remove
// - "Clear All" button when 2+ filters
// - Responsive layout (horizontal on desktop, 2-col grid on mobile)
// - Accessible remove buttons
```

### LPFilterPresets Component

```typescript
interface LPFilterPresetsProps {
  onPresetApply: (preset: FilterPreset) => void;
}

type FilterPreset = 'expiring_soon' | 'available_stock' | 'pending_qa' | 'blocked_items';

// Features:
// - 4 preset buttons (Expiring Soon, Available Stock, Pending QA, Blocked)
// - Each button shows icon + label + description
// - Click applies preset filters immediately
// - Shows applied filters as chips
// - Accessible labels explaining what each preset does
```

### LPFilterDateRange Component

```typescript
interface LPFilterDateRangeProps {
  fromDate: string | null;
  toDate: string | null;
  onFromChange: (date: string) => void;
  onToChange: (date: string) => void;
  label?: string;
  minDate?: string;
  maxDate?: string;
}

// Features:
// - Two date pickers (From and To)
// - Validation: from <= to
// - Format: YYYY-MM-DD
// - Mobile: Native date inputs
// - Desktop: Custom date picker (ShadCN Calendar)
// - Clear buttons for each date
// - Accessible labels
```

### LPFilterMultiSelect Component

```typescript
interface LPFilterMultiSelectProps {
  label: string;
  options: FilterOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  loading?: boolean;
  searchable?: boolean;
}

interface FilterOption {
  id: string;
  label: string;
  count?: number;  // Optional: number of LPs with this option
}

// Features:
// - Dropdown with checkboxes
// - Search within options (if searchable=true)
// - Select/deselect all
// - Shows count next to each option
// - Loading state with skeleton
// - Accessible multi-select pattern
// - Max height with scroll
```

---

## Quality Gates

Before handoff to FRONTEND-DEV:
- [x] All 5 states defined (Loading, Empty Search, Empty Filter, Error, Success)
- [x] Responsive breakpoints documented (Desktop/Tablet/Mobile)
- [x] All API endpoints specified with request/response schemas
- [x] Accessibility checklist passed (touch targets, contrast, screen reader, keyboard, ARIA)
- [x] Performance targets defined (search <300ms, filter <500ms)
- [x] Search debounce logic documented (300ms, Enter bypass)
- [x] Filter chip removal documented
- [x] Filter presets defined (4 presets)
- [x] Combined search + filter logic documented (AND)
- [x] Date range validation documented
- [x] Filter panel layout documented (panel vs modal)
- [x] Component specifications documented (5 components)
- [x] User flow diagram created
- [x] Testing requirements specified (Unit/Integration/E2E/Performance)
- [x] Database indexes documented
- [x] Caching strategy documented

---

## Handoff to FRONTEND-DEV

```yaml
feature: LP Search & Filters
story: 05.5
epic: 05-warehouse
fr_coverage: WH-FR-002, WH-FR-009, WH-FR-010
approval_status:
  mode: "auto_approve"
  user_approved: true
  approved_at: "2026-01-02T12:00:00Z"
  screens_approved:
    - Search Bar (Desktop/Tablet/Mobile)
    - Advanced Filter Panel (Desktop/Tablet/Mobile)
    - Filter Chips Display
    - Filter Presets
    - All 5 states per screen
  iterations_used: 0
deliverables:
  wireframe: docs/3-ARCHITECTURE/ux/wireframes/WH-005-lp-search-filters.md
  user_flow: included
  api_endpoints:
    - GET /api/warehouse/license-plates?search={term} (prefix search)
    - GET /api/warehouse/license-plates?batch_number={batch} (exact match)
    - GET /api/warehouse/license-plates?product_ids={ids}&warehouse_id={id}&... (advanced filters)
    - GET /api/warehouse/license-plates/filter-options/products
    - GET /api/warehouse/license-plates/filter-options/locations?warehouse_id={id}
    - GET /api/warehouse/license-plates/filter-options/warehouses
states_per_screen:
  - loading_search
  - loading_filters
  - empty_search
  - empty_filters
  - error
  - success
breakpoints:
  mobile: "<768px (full-screen modal, 2-col chips, vertical presets)"
  tablet: "768-1024px (350px side panel, horizontal chips)"
  desktop: ">1024px (400px side panel, horizontal chips)"
accessibility:
  touch_targets: "48x48dp minimum"
  contrast: "4.5:1 minimum (WCAG AA)"
  aria_roles: "searchbox, region, checkbox, status"
  keyboard_nav: "Tab, Enter (bypass debounce), Space, Escape, Arrow keys"
performance_targets:
  search_prefix: "<300ms (PRD requirement WH-FR-002)"
  batch_search: "<300ms"
  simple_filter: "<300ms"
  complex_filter_5_params: "<500ms"
  search_plus_filter: "<500ms"
  filter_options_load: "<200ms"
  debounce_delay: "300ms (Enter bypasses)"
components:
  - LPSearchInput (debounce 300ms, Enter bypass, clear button)
  - LPAdvancedFilters (8 filter types, presets, apply/clear)
  - LPFilterChips (display, remove individual, clear all)
  - LPFilterPresets (4 presets with descriptions)
  - LPFilterDateRange (from/to validation)
  - LPFilterMultiSelect (checkboxes, search, counts)
key_features:
  - Search: LP number prefix (min 2 chars) or batch exact match
  - Filters: 8 types (product, warehouse, location, status, QA, expiry, batch, created date)
  - Debounce: 300ms (Enter key bypasses)
  - Filter chips: Show active filters, removable
  - Presets: 4 quick filters (Expiring Soon, Available Stock, Pending QA, Blocked)
  - Combination: Search AND filters (all conditions must match)
  - Panel: Slide-in (desktop/tablet), modal (mobile)
  - Persistence: URL query params for bookmarking
related_screens:
  - WH-001: License Plate List (base screen)
  - WH-002: License Plates List (alternate)
  - WH-003: LP Detail Page
critical_for_epic_04: true
critical_reason: "Production material consumption (04.6a-e) requires finding LPs by product, location, batch, and expiry for FIFO/FEFO compliance"
dependencies:
  - 05.1: LP Table + CRUD (Ready - provides base query structure)
  - 01.8: Warehouses CRUD (Ready - FK for warehouse filter)
  - 01.9: Locations CRUD (Ready - FK for location filter)
  - 02.1: Products CRUD (Ready - FK for product filter)
```

---

**Status**: Approved (Auto-Approve Mode)
**Approval Mode**: auto_approve
**User Approved**: Yes
**Approval Date**: 2026-01-02
**Iterations**: 0 of 3
**Estimated Frontend Effort**: 16-20 hours (complex filtering UI + debounce + presets)
**Estimated Backend Effort**: 12-16 hours (enhanced query builder + indexes + filter options endpoints)
**Quality Target**: 98/100
**Ready for Implementation**: Yes ✅

---

## Notes for Implementation

### Critical for Epic 04 Production

This story (05.5) is **CRITICAL** for Epic 04 Production workflows. The following search/filter capabilities are REQUIRED before Epic 04 can proceed:

1. **Product Filter** - Find all LPs of a specific product for material consumption
2. **Warehouse/Location Filter** - Find LPs in specific warehouse/location for WO picking
3. **Batch Number Search** - Find LPs by batch for traceability requirements
4. **Expiry Date Filter** - Find LPs by expiry range for FEFO compliance
5. **Status + QA Filter** - Find available + passed LPs for consumption

### Implementation Priority

1. **Phase 1 (Day 1-2)**: Backend - Query Builder + Indexes
   - Extend LicensePlateService.list() with all filter params
   - Add database indexes for performance
   - Create filter options endpoints
   - **Deliverable**: API supports all filter combinations <500ms

2. **Phase 2 (Day 3-4)**: Frontend - Search + Filter UI
   - Search input with debounce
   - Filter panel (desktop side panel, mobile modal)
   - Filter chips display
   - Filter presets
   - **Deliverable**: Users can search and filter LPs efficiently

3. **Phase 3 (Day 5)**: Integration + Testing
   - Unit tests for query builder
   - Integration tests for API endpoints
   - E2E tests for UI interactions
   - Performance tests (10K LP dataset)
   - **Deliverable**: Production-ready search & filter system

### Database Index Requirements

All indexes MUST be created before deployment to production:

```sql
-- Prefix search index (CRITICAL for <300ms performance)
CREATE INDEX idx_lp_number_search
ON license_plates(org_id, lp_number text_pattern_ops);

-- Batch search index
CREATE INDEX idx_lp_batch
ON license_plates(batch_number)
WHERE batch_number IS NOT NULL;

-- Composite indexes for common filters
CREATE INDEX idx_lp_product_status_qa
ON license_plates(org_id, product_id, status, qa_status);

CREATE INDEX idx_lp_warehouse_location_status
ON license_plates(org_id, warehouse_id, location_id, status);

CREATE INDEX idx_lp_expiry_status
ON license_plates(org_id, expiry_date, status)
WHERE expiry_date IS NOT NULL;
```

### URL Query Params for Bookmarking

Filter state MUST be stored in URL query params to enable:
- Bookmarking filtered views
- Sharing filtered results via URL
- Browser back/forward navigation

Example URL:
```
/warehouse/license-plates?search=LP0001&product_id=uuid&warehouse_id=uuid&status=available&qa_status=passed&expiry_before=2026-12-31&sort=expiry_date&order=asc
```

### Future Enhancements (Deferred)

- **Story 05.36**: Saved filter templates (user can save custom filter combinations)
- **Story 05.38**: Export filtered results to Excel/CSV
- **Story 05.30**: Filter by zone (after zone management implemented)
- **Story 05.26**: Filter by pallet ID (after pallet management implemented)
- **Advanced text search**: Full-text search on product name, location name (ElasticSearch)
