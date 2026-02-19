# WH-001: License Plate List Page

**Module**: Warehouse
**Feature**: License Plate CRUD (WH-FR-001, WH-FR-002, WH-FR-006, WH-FR-008)
**Story**: 05.1 - License Plates Table + CRUD
**Status**: Approved (Auto-Approve Mode)
**Last Updated**: 2026-01-02

---

## User Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    LP Management User Flow                       │
└─────────────────────────────────────────────────────────────────┘

1. List & Filter Flow (Primary)
   ┌──────────────┐
   │ LP List Page │ ──[Filter]──> Apply filters ──> Update table
   └──────────────┘
          │
          ├──[Search]──> Search by LP number ──> Filter results
          │
          ├──[Click Row]──> LP Detail Panel opens (slide-in)
          │
          └──[Create LP]──> Create LP Modal ──> Save ──> Refresh list

2. LP Detail Flow
   ┌──────────────────┐
   │ LP Detail Panel  │
   └──────────────────┘
          │
          ├──[Block]──> Confirm ──> Status = blocked
          │
          ├──[Update QA]──> Select QA status ──> Update LP
          │
          └──[Close]──> Panel closes

3. Create LP Flow
   ┌────────────────┐
   │ Create LP Modal│
   └────────────────┘
          │
          ├──[Auto-generate LP number]──> System generates
          │                               (or Manual entry)
          │
          ├──[Fill required fields]──> Product, Qty, UoM, Location
          │
          ├──[Optional fields]──> Batch, Expiry, Catch weight
          │
          └──[Save]──> Validate ──> Create LP ──> Close modal ──> Refresh

4. Status Management Flow
   LP (available) ──[Block]──> LP (blocked) ──[Unblock]──> LP (available)
   LP (qa:pending) ──[QA Pass]──> LP (qa:passed)
   LP (qa:pending) ──[QA Fail]──> LP (qa:failed, status:blocked)

Decision Points:
- Filter by warehouse/location/status: Updates table with filtered results
- Search by LP number: Real-time prefix search with debounce
- Click row vs click action: Row opens detail panel, action buttons perform operations
- Auto-generate vs manual LP number: Based on warehouse_settings.auto_generate_lp_number
```

---

## ASCII Wireframe

### Success State (Desktop)

```
+--------------------------------------------------------------------------------------------------+
|  Warehouse > License Plates                            [+ Create LP] [Export] [Print Labels]     |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  +---------------------+ +---------------------+ +---------------------+ +---------------------+   |
|  | Total LPs           | | Available           | | Reserved            | | Expiring Soon       |   |
|  |       1,247         | |       856           | |       245           | |         18          |   |
|  | 142,500 KG total    | | 68.6% of total      | | 19.6% of total      | | Next 7 days         |   |
|  | [View All]          | | [View Available]    | | [View Reserved]     | | [View Expiring]     |   |
|  +---------------------+ +---------------------+ +---------------------+ +---------------------+   |
|                                                                                                    |
|  +----------------------------------------------------------------------------------------------+  |
|  | Filters: [Warehouse: All v] [Location: All v] [Product: All v] [Status: All v]             |  |
|  |          [QA Status: All v] [Expiry: All dates v] [Search LP: ____________]                |  |
|  |                                                                                              |  |
|  | Quick Filters: [Available + Passed] [Expiring <30 days] [Blocked] [Clear All]              |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  +----------------------------------------------------------------------------------------------+  |
|  | LP Number      | Product          | Qty       | Location         | Status      | QA Status   |   |
|  |                |                  | / UoM     |                  |             |             |   |
|  +----------------------------------------------------------------------------------------------+  |
|  | LP00000156     | Whole Wheat Flour| 500 KG    | WH-01/ZONE-A/A1 | [Available] | [Passed]    |   |
|  |                | SKU: FLR-001     |           | Bin: A1-01-03    |             |             |   |
|  |                | Batch: B-2025-045| Expiry: 2026-06-15 (164 days)                | [View] [...] |   |
|  +----------------------------------------------------------------------------------------------+  |
|  | LP00000155     | Granulated Sugar | 1000 KG   | WH-01/ZONE-A/A2 | [Available] | [Passed]    |   |
|  |                | SKU: SUG-001     |           | Bin: A2-02-01    |             |             |   |
|  |                | Batch: BATCH-001 | Expiry: 2027-12-31 (729 days)                | [View] [...] |   |
|  +----------------------------------------------------------------------------------------------+  |
|  | LP00000154     | Butter           | 250 KG    | WH-01/ZONE-B/B1 | [Reserved]  | [Passed]    |   |
|  |                | SKU: BTR-001     |           | Bin: B1-01-02    |             |             |   |
|  |                | Batch: BT-2025-12| Expiry: 2026-02-28 (57 days) WO: WO-2025-034  | [View] [...] |   |
|  +----------------------------------------------------------------------------------------------+  |
|  | LP00000153     | Cocoa Powder     | 100 KG    | WH-01/ZONE-C/C1 | [Blocked]   | [Failed]    |   |
|  |                | SKU: COC-001     |           | Bin: C1-03-01    |             |             |   |
|  |                | Batch: CP-2025-08| Expiry: 2026-08-20 (230 days)                | [View] [...] |   |
|  +----------------------------------------------------------------------------------------------+  |
|  | LP00000152     | Whole Wheat Flour| 75 KG     | WH-01/ZONE-A/A1 | [Available] | [Pending]   |   |
|  |                | SKU: FLR-001     |           | Bin: A1-01-04    |             |             |   |
|  |                | Batch: B-2025-046| Expiry: 2026-01-10 (8 days) ⚠️               | [View] [...] |   |
|  +----------------------------------------------------------------------------------------------+  |
|  | LP00000151     | Yeast            | 20 KG     | WH-01/ZONE-D/D1 | [Consumed]  | [Passed]    |   |
|  |                | SKU: YST-001     |           | Bin: D1-01-01    |             |             |   |
|  |                | Batch: YT-2025-05| Consumed by: WO-2025-032 (Dec 28, 2025)      | [View] [...] |   |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  Showing 1-20 of 1,247 LPs                              [< Previous] [1] [2] [3] ... [Next >]     |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+

[...] Row Actions Menu:
  - View Details (opens detail panel)
  - Block LP (if status=available)
  - Unblock LP (if status=blocked)
  - Update QA Status
  - Print Label
  - View History
  - Move Location (future)
  - Split LP (future - story 05.6)
```

### Success State (Tablet: 768-1024px)

```
+--------------------------------------------------------------------+
|  Warehouse > License Plates              [+ Create] [Export]       |
+--------------------------------------------------------------------+
|                                                                      |
|  +----------------+ +----------------+                               |
|  | Total LPs      | | Available      |                               |
|  |    1,247       | |     856        |                               |
|  | 142.5T total   | | 68.6%          |                               |
|  +----------------+ +----------------+                               |
|                                                                      |
|  +----------------+ +----------------+                               |
|  | Reserved       | | Expiring Soon  |                               |
|  |     245        | |      18        |                               |
|  | 19.6%          | | Next 7 days    |                               |
|  +----------------+ +----------------+                               |
|                                                                      |
|  Filters: [Warehouse v] [Location v] [Status v] [QA v] [Search]     |
|                                                                      |
|  +----------------------------------------------------------------+ |
|  | LP00000156  Whole Wheat Flour     [Available] [Passed]        | |
|  | 500 KG      WH-01/ZONE-A/A1       Exp: Jun 15, 2026          | |
|  | Batch: B-2025-045                              [View] [...]   | |
|  +----------------------------------------------------------------+ |
|  | LP00000155  Granulated Sugar      [Available] [Passed]        | |
|  | 1000 KG     WH-01/ZONE-A/A2       Exp: Dec 31, 2027          | |
|  | Batch: BATCH-001                               [View] [...]   | |
|  +----------------------------------------------------------------+ |
|  | LP00000154  Butter                [Reserved] [Passed]         | |
|  | 250 KG      WH-01/ZONE-B/B1       Exp: Feb 28, 2026          | |
|  | Batch: BT-2025-12  WO: WO-2025-034         [View] [...]      | |
|  +----------------------------------------------------------------+ |
|  | LP00000153  Cocoa Powder          [Blocked] [Failed]          | |
|  | 100 KG      WH-01/ZONE-C/C1       Exp: Aug 20, 2026          | |
|  | Batch: CP-2025-08                              [View] [...]   | |
|  +----------------------------------------------------------------+ |
|                                                                      |
|  Showing 1-10 of 1,247                        [<] [1] [2] [3] [>]   |
|                                                                      |
+--------------------------------------------------------------------+
```

### Success State (Mobile: <768px)

```
+----------------------------------+
|  < License Plates                |
|  [+ Create] [Filters v]          |
+----------------------------------+
|                                  |
|  +----------------------------+  |
|  | Total LPs         1,247    |  |
|  | 142.5T inventory  [View]   |  |
|  +----------------------------+  |
|  | Available         856      |  |
|  | 68.6% ready       [View]   |  |
|  +----------------------------+  |
|  | Expiring Soon     18       |  |
|  | Next 7 days       [View]   |  |
|  +----------------------------+  |
|                                  |
|  [Search LP Number...]          |
|                                  |
|  +----------------------------+  |
|  | LP00000156                 |  |
|  | Whole Wheat Flour          |  |
|  | [Available] [Passed]       |  |
|  | 500 KG  WH-01/ZONE-A/A1   |  |
|  | Batch: B-2025-045          |  |
|  | Exp: Jun 15, 2026          |  |
|  |          [View] [...]      |  |
|  +----------------------------+  |
|  | LP00000155                 |  |
|  | Granulated Sugar           |  |
|  | [Available] [Passed]       |  |
|  | 1000 KG  WH-01/ZONE-A/A2  |  |
|  | Batch: BATCH-001           |  |
|  | Exp: Dec 31, 2027          |  |
|  |          [View] [...]      |  |
|  +----------------------------+  |
|  | LP00000154                 |  |
|  | Butter                     |  |
|  | [Reserved] [Passed]        |  |
|  | 250 KG  WH-01/ZONE-B/B1   |  |
|  | Batch: BT-2025-12          |  |
|  | Exp: Feb 28, 2026 ⚠️       |  |
|  | WO: WO-2025-034            |  |
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
|  Warehouse > License Plates                            [+ Create LP] [Export] [Print Labels]     |
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
|  Warehouse > License Plates                            [+ Create LP] [Export] [Print Labels]     |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|                                                                                                    |
|                                      +------------------+                                          |
|                                      |   [LP Icon]      |                                          |
|                                      |   📦 📋          |                                          |
|                                      +------------------+                                          |
|                                                                                                    |
|                                    No License Plates Yet                                           |
|                                                                                                    |
|                     Create your first License Plate to start tracking inventory                    |
|                     at the atomic level. LPs enable full traceability from receipt                 |
|                     through production to shipping.                                                |
|                                                                                                    |
|                                                                                                    |
|                               [+ Create First License Plate]                                       |
|                                                                                                    |
|                                                                                                    |
|                      Quick Tips:                                                                   |
|                      • LPs are created automatically during Goods Receipt (GRN)                    |
|                      • Manual LP creation is for adjustments and opening inventory                 |
|                      • Configure auto-numbering in Warehouse Settings                              |
|                                                                                                    |
|                                   [Go to Warehouse Settings]                                       |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

### Error State

```
+--------------------------------------------------------------------------------------------------+
|  Warehouse > License Plates                            [+ Create LP] [Export] [Print Labels]     |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|                                                                                                    |
|                                      +------------------+                                          |
|                                      |   [Error Icon]   |                                          |
|                                      |       ⚠️         |                                          |
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

### Filtered Empty State

```
+--------------------------------------------------------------------------------------------------+
|  Warehouse > License Plates                            [+ Create LP] [Export] [Print Labels]     |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  +---------------------+ +---------------------+ +---------------------+ +---------------------+   |
|  | Total LPs           | | Available           | | Reserved            | | Expiring Soon       |   |
|  |       1,247         | |       856           | |       245           | |         18          |   |
|  +---------------------+ +---------------------+ +---------------------+ +---------------------+   |
|                                                                                                    |
|  +----------------------------------------------------------------------------------------------+  |
|  | Filters: [Warehouse: WH-02 ✓] [Location: ZONE-X ✓] [Status: Available ✓]                  |  |
|  |          [QA Status: Failed ✓] [Search LP: LP99999]                                         |  |
|  |                                                                                              |  |
|  | Active Filters: WH-02, ZONE-X, Available, Failed, "LP99999"            [Clear All Filters] |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|                                                                                                    |
|                                      +------------------+                                          |
|                                      |   [Search Icon]  |                                          |
|                                      |       🔍         |                                          |
|                                      +------------------+                                          |
|                                                                                                    |
|                              No License Plates Match Your Filters                                  |
|                                                                                                    |
|                     Try adjusting your filters or search criteria to find                          |
|                     license plates. You can clear all filters to start over.                       |
|                                                                                                    |
|                                                                                                    |
|                                   [Clear All Filters]                                              |
|                                                                                                    |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

---

## LP Detail Panel (Slide-in from Right)

```
+-------------------------------+------------------------------------------------------------------+
| [Main LP List]                | ◀ Close    License Plate Detail                    [Edit] [Print] |
|                               +------------------------------------------------------------------+
| LP00000156                    |                                                                    |
| Whole Wheat Flour             | +----------------------------------------------------------------+ |
| [Available] [Passed]          | | IDENTITY                                                       | |
|                               | +----------------------------------------------------------------+ |
| [continued list...]           | | LP Number:          LP00000156                                 | |
|                               | | Status:             [Available] ✓                              | |
|                               | | QA Status:          [Passed] ✓                                 | |
|                               | | Source:             Receipt (GRN-2025-0234)                    | |
|                               | +----------------------------------------------------------------+ |
|                               |                                                                    |
|                               | +----------------------------------------------------------------+ |
|                               | | PRODUCT & QUANTITY                                             | |
|                               | +----------------------------------------------------------------+ |
|                               | | Product:            Whole Wheat Flour (FLR-001)                | |
|                               | | Quantity:           500.0000 KG                                | |
|                               | | Catch Weight:       —                                          | |
|                               | +----------------------------------------------------------------+ |
|                               |                                                                    |
|                               | +----------------------------------------------------------------+ |
|                               | | LOCATION                                                       | |
|                               | +----------------------------------------------------------------+ |
|                               | | Warehouse:          WH-01 (Main Warehouse)                     | |
|                               | | Location:           ZONE-A > A1 > Bin A1-01-03                 | |
|                               | | Pallet:             —                                          | |
|                               | +----------------------------------------------------------------+ |
|                               |                                                                    |
|                               | +----------------------------------------------------------------+ |
|                               | | TRACKING & TRACEABILITY                                        | |
|                               | +----------------------------------------------------------------+ |
|                               | | Batch Number:       B-2025-045                                 | |
|                               | | Supplier Batch:     SUP-BATCH-2025-100                         | |
|                               | | Manufacture Date:   2025-12-15                                 | |
|                               | | Expiry Date:        2026-06-15 (164 days remaining) ✓          | |
|                               | | GTIN:               —                                          | |
|                               | | SSCC:               —                                          | |
|                               | +----------------------------------------------------------------+ |
|                               |                                                                    |
|                               | +----------------------------------------------------------------+ |
|                               | | SOURCE REFERENCE                                               | |
|                               | +----------------------------------------------------------------+ |
|                               | | PO Number:          PO-2025-0345                               | |
|                               | | GRN:                GRN-2025-0234 (Dec 20, 2025)               | |
|                               | | ASN:                —                                          | |
|                               | | Work Order:         —                                          | |
|                               | | Consumed By WO:     —                                          | |
|                               | | Parent LP:          —                                          | |
|                               | +----------------------------------------------------------------+ |
|                               |                                                                    |
|                               | +----------------------------------------------------------------+ |
|                               | | AUDIT TRAIL                                                    | |
|                               | +----------------------------------------------------------------+ |
|                               | | Created At:         2025-12-20 14:23:15                        | |
|                               | | Created By:         John Smith (Warehouse Operator)            | |
|                               | | Updated At:         2025-12-20 14:23:15                        | |
|                               | +----------------------------------------------------------------+ |
|                               |                                                                    |
|                               | +----------------------------------------------------------------+ |
|                               | | QUICK ACTIONS                                                  | |
|                               | +----------------------------------------------------------------+ |
|                               | | [Block LP]  [Update QA Status]  [Print Label]  [View History] | |
|                               | +----------------------------------------------------------------+ |
|                               |                                                                    |
+-------------------------------+------------------------------------------------------------------+
```

---

## Create LP Modal

```
+--------------------------------------------------------------------------------------------------+
|  Create License Plate                                                                      [X Close] |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  +----------------------------------------------------------------------------------------------+  |
|  | BASIC INFORMATION                                                                            |  |
|  +----------------------------------------------------------------------------------------------+  |
|  |                                                                                              |  |
|  | LP Number: (Optional - auto-generated if blank)                                             |  |
|  | [_______________________________]   [Generate Number]                                        |  |
|  |                                                                                              |  |
|  | Product: *                                                                                   |  |
|  | [Select product...                                                            v]            |  |
|  |                                                                                              |  |
|  | Quantity: *             UoM: *                                                               |  |
|  | [___________]           [KG                                                   v]            |  |
|  |                                                                                              |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  +----------------------------------------------------------------------------------------------+  |
|  | LOCATION                                                                                     |  |
|  +----------------------------------------------------------------------------------------------+  |
|  |                                                                                              |  |
|  | Warehouse: *                                                                                 |  |
|  | [WH-01 - Main Warehouse                                                       v]            |  |
|  |                                                                                              |  |
|  | Location: *                                                                                  |  |
|  | [ZONE-A > A1 > Bin A1-01-03                                                   v]            |  |
|  |                                                                                              |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  +----------------------------------------------------------------------------------------------+  |
|  | TRACKING (Optional)                                                                          |  |
|  +----------------------------------------------------------------------------------------------+  |
|  |                                                                                              |  |
|  | Batch Number:                           Supplier Batch:                                      |  |
|  | [_____________________]                 [_____________________]                             |  |
|  |                                                                                              |  |
|  | Manufacture Date:                       Expiry Date:                                         |  |
|  | [____/____/______] 📅                   [____/____/______] 📅                               |  |
|  |                                                                                              |  |
|  | Catch Weight (if applicable):                                                                |  |
|  | [___________] KG                                                                             |  |
|  |                                                                                              |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  +----------------------------------------------------------------------------------------------+  |
|  | SOURCE (Optional)                                                                            |  |
|  +----------------------------------------------------------------------------------------------+  |
|  |                                                                                              |  |
|  | Source Type:                                                                                 |  |
|  | ( ) Manual  (•) Receipt  ( ) Production  ( ) Return  ( ) Adjustment                         |  |
|  |                                                                                              |  |
|  | PO Number:                              GRN:                                                 |  |
|  | [_____________________]                 [Select GRN...                        v]            |  |
|  |                                                                                              |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  * Required fields                                                                                 |
|                                                                                                    |
|                                                          [Cancel]  [Create License Plate]          |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

---

## Key Components

### 1. KPI Summary Cards (4 Cards)

| Card | Data Source | Calculation | Click Action |
|------|-------------|-------------|--------------|
| **Total LPs** | license_plates table | COUNT(*) + SUM(quantity) | View all LPs |
| **Available** | license_plates table | COUNT(*) WHERE status='available' AND qa_status='passed' | Filter to available |
| **Reserved** | license_plates table | COUNT(*) WHERE status='reserved' | Filter to reserved |
| **Expiring Soon** | license_plates table | COUNT(*) WHERE expiry_date BETWEEN today AND today+7 | Filter to expiring |

### 2. Filters Bar

| Filter | Type | Options | Default |
|--------|------|---------|---------|
| **Warehouse** | Dropdown | All warehouses (user has access) | All |
| **Location** | Hierarchical dropdown | All locations in selected warehouse | All |
| **Product** | Searchable dropdown | All products | All |
| **Status** | Multi-select | available, reserved, consumed, blocked | All |
| **QA Status** | Multi-select | pending, passed, failed, quarantine | All |
| **Expiry** | Date range | Next 7 days, Next 30 days, Expired, Custom | All dates |
| **Search** | Text input | Searches LP number (prefix match) | Empty |

### 3. Quick Filters

| Quick Filter | SQL Equivalent | Use Case |
|--------------|----------------|----------|
| **Available + Passed** | status='available' AND qa_status='passed' | Production picking |
| **Expiring <30 days** | expiry_date BETWEEN today AND today+30 | Inventory management |
| **Blocked** | status='blocked' | Quality holds |
| **Clear All** | Reset all filters | Start fresh |

### 4. LP Table

| Column | Width | Sortable | Description |
|--------|-------|----------|-------------|
| **LP Number** | 140px | Yes | Unique identifier (e.g., LP00000156) |
| **Product** | 220px | Yes | Product name + SKU + batch |
| **Qty / UoM** | 100px | Yes | Quantity with unit |
| **Location** | 180px | Yes | Full location path + bin |
| **Status** | 110px | Yes | Status badge with color |
| **QA Status** | 110px | Yes | QA badge with color |
| **Actions** | 100px | No | View button + overflow menu |

Additional row info (second line):
- Batch number
- Expiry date with days remaining and warning indicator
- WO reference (if reserved/consumed)

### 5. Status Badge Colors

| Status | Color | Background | Text | Icon |
|--------|-------|------------|------|------|
| available | Green | #D1FAE5 | #065F46 | ✓ |
| reserved | Yellow | #FEF3C7 | #92400E | 🔒 |
| consumed | Gray | #F3F4F6 | #6B7280 | ✓ |
| blocked | Red | #FEE2E2 | #B91C1C | ⛔ |

### 6. QA Status Badge Colors

| QA Status | Color | Background | Text | Icon |
|-----------|-------|------------|------|------|
| pending | Yellow | #FEF3C7 | #92400E | ⏱️ |
| passed | Green | #D1FAE5 | #065F46 | ✓ |
| failed | Red | #FEE2E2 | #B91C1C | ✗ |
| quarantine | Orange | #FED7AA | #C2410C | ⚠️ |

### 7. Expiry Indicator Colors

| Condition | Color | Days | Display |
|-----------|-------|------|---------|
| Expired | Red | < 0 | "Expired" + 🔴 |
| Critical | Red | 0-7 | "{X} days" + ⚠️ |
| Warning | Yellow | 8-30 | "{X} days" + ⚠️ |
| Normal | Green | > 30 | "{X} days" + ✓ |

---

## Main Actions

### Primary Actions

| Action | Location | Description |
|--------|----------|-------------|
| **Create LP** | Header button | Opens Create LP Modal |
| **Export** | Header button | Export filtered LPs to Excel |
| **Print Labels** | Header button | Batch print labels for selected LPs |

### Table Row Actions

| Action | Visibility | Description |
|--------|------------|-------------|
| **View Details** | Always | Opens LP Detail Panel (slide-in) |
| **Block LP** | status=available | Sets status to 'blocked' with reason |
| **Unblock LP** | status=blocked | Restores status to 'available' |
| **Update QA Status** | Always | Opens QA status update modal |
| **Print Label** | Always | Print ZPL label for this LP |
| **View History** | Always | Shows audit trail (future) |
| **Move Location** | status=available | Create stock move (future - story 05.5) |
| **Split LP** | status=available | Split into multiple LPs (future - story 05.6) |

---

## States

| State | Description | Elements Shown |
|-------|-------------|----------------|
| **Loading** | Initial page load | Skeleton cards, skeleton table rows |
| **Empty** | No LPs exist in org | Empty state illustration, Create button, tips |
| **Success** | LPs loaded | KPI cards, filters, table with data, pagination |
| **Error** | API failure | Error message, retry button, support link |
| **Filtered Empty** | Filters return no results | "No LPs match filters" message, clear filters button |

---

## Data Fields

### LP List Item

| Field | Source | Display |
|-------|--------|---------|
| id | license_plates.id | Internal use |
| lp_number | license_plates.lp_number | "LP00000156" |
| product_id | license_plates.product_id | Used for filtering |
| product_name | products.name via JOIN | "Whole Wheat Flour" |
| product_code | products.code via JOIN | "FLR-001" |
| quantity | license_plates.quantity | "500.0000" |
| uom | license_plates.uom | "KG" |
| location_id | license_plates.location_id | Used for filtering |
| location_path | locations.full_path via JOIN | "WH-01/ZONE-A/A1" |
| warehouse_id | license_plates.warehouse_id | Used for filtering |
| warehouse_name | warehouses.name via JOIN | "Main Warehouse" |
| status | license_plates.status | Badge |
| qa_status | license_plates.qa_status | Badge |
| batch_number | license_plates.batch_number | "B-2025-045" |
| expiry_date | license_plates.expiry_date | "2026-06-15" |
| days_to_expiry | Calculated | "164 days" |
| wo_id | license_plates.wo_id | "WO-2025-034" (if reserved/consumed) |
| consumed_by_wo_id | license_plates.consumed_by_wo_id | "WO-2025-032" (if consumed) |
| created_at | license_plates.created_at | For sorting |

---

## API Endpoints

### List License Plates

```
GET /api/warehouse/license-plates?warehouse_id={id}&location_id={id}&product_id={id}&status[]={status}&qa_status[]={status}&search={term}&expiry_before={date}&expiry_after={date}&page=1&limit=50&sort=created_at&order=desc

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid-lp-156",
      "lp_number": "LP00000156",
      "product": {
        "id": "uuid-product-1",
        "name": "Whole Wheat Flour",
        "code": "FLR-001"
      },
      "quantity": 500.0000,
      "uom": "KG",
      "location": {
        "id": "uuid-location-1",
        "full_path": "WH-01/ZONE-A/A1",
        "bin_code": "A1-01-03"
      },
      "warehouse": {
        "id": "uuid-warehouse-1",
        "name": "Main Warehouse",
        "code": "WH-01"
      },
      "status": "available",
      "qa_status": "passed",
      "batch_number": "B-2025-045",
      "supplier_batch_number": "SUP-BATCH-2025-100",
      "expiry_date": "2026-06-15",
      "manufacture_date": "2025-12-15",
      "days_to_expiry": 164,
      "source": "receipt",
      "po_number": "PO-2025-0345",
      "grn_id": "uuid-grn-234",
      "wo_id": null,
      "consumed_by_wo_id": null,
      "catch_weight_kg": null,
      "created_at": "2025-12-20T14:23:15Z",
      "created_by": {
        "id": "uuid-user-1",
        "name": "John Smith"
      }
    },
    ...
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1247,
    "total_pages": 25
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
    "total_quantity": 142500.00,
    "available_count": 856,
    "available_percentage": 68.6,
    "reserved_count": 245,
    "reserved_percentage": 19.6,
    "consumed_count": 120,
    "blocked_count": 26,
    "expiring_soon_count": 18,
    "expiring_critical_count": 3,
    "expired_count": 0
  }
}
```

### Create LP

```
POST /api/warehouse/license-plates
Body: {
  "lp_number": "LP00000999",  // Optional if auto_generate enabled
  "product_id": "uuid-product-1",
  "quantity": 500.0000,
  "uom": "KG",
  "location_id": "uuid-location-1",
  "warehouse_id": "uuid-warehouse-1",
  "batch_number": "B-2025-045",
  "supplier_batch_number": "SUP-BATCH-2025-100",
  "expiry_date": "2026-06-15",
  "manufacture_date": "2025-12-15",
  "source": "manual",
  "po_number": "PO-2025-0345",
  "grn_id": "uuid-grn-234",
  "catch_weight_kg": null
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid-lp-999",
    "lp_number": "LP00000999",
    "status": "available",
    "qa_status": "pending",  // From warehouse_settings.default_qa_status
    "created_at": "2026-01-02T10:15:30Z",
    ...
  }
}
```

### Get LP Detail

```
GET /api/warehouse/license-plates/{id}

Response:
{
  "success": true,
  "data": {
    "id": "uuid-lp-156",
    "lp_number": "LP00000156",
    "product": { /* full product object */ },
    "quantity": 500.0000,
    "uom": "KG",
    "location": { /* full location with hierarchy */ },
    "warehouse": { /* full warehouse object */ },
    "status": "available",
    "qa_status": "passed",
    "batch_number": "B-2025-045",
    "supplier_batch_number": "SUP-BATCH-2025-100",
    "expiry_date": "2026-06-15",
    "manufacture_date": "2025-12-15",
    "source": "receipt",
    "po_number": "PO-2025-0345",
    "grn_id": "uuid-grn-234",
    "asn_id": null,
    "wo_id": null,
    "consumed_by_wo_id": null,
    "parent_lp_id": null,
    "pallet_id": null,
    "gtin": null,
    "sscc": null,
    "catch_weight_kg": null,
    "created_at": "2025-12-20T14:23:15Z",
    "created_by": { /* user object */ },
    "updated_at": "2025-12-20T14:23:15Z"
  }
}
```

### Block LP

```
PUT /api/warehouse/license-plates/{id}/block
Body: {
  "reason": "Quality hold - foreign material suspected"
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid-lp-156",
    "lp_number": "LP00000156",
    "status": "blocked",
    "qa_status": "failed",  // Optional QA status change
    "updated_at": "2026-01-02T10:20:00Z"
  }
}
```

### Unblock LP

```
PUT /api/warehouse/license-plates/{id}/unblock

Response:
{
  "success": true,
  "data": {
    "id": "uuid-lp-156",
    "lp_number": "LP00000156",
    "status": "available",
    "updated_at": "2026-01-02T10:25:00Z"
  }
}
```

### Update QA Status

```
PUT /api/warehouse/license-plates/{id}/qa-status
Body: {
  "qa_status": "passed"
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid-lp-156",
    "lp_number": "LP00000156",
    "qa_status": "passed",
    "updated_at": "2026-01-02T10:30:00Z"
  }
}
```

### Generate LP Number

```
POST /api/warehouse/license-plates/generate-number

Response:
{
  "success": true,
  "data": {
    "lp_number": "LP00000999"
  }
}
```

### Export to Excel

```
GET /api/warehouse/license-plates/export?format=xlsx&warehouse_id={id}&status[]={status}

Response: Binary file download (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)
```

---

## Permissions

| Role | View List | Create LP | Update LP | Block/Unblock | Update QA | Export | Print Labels |
|------|-----------|-----------|-----------|---------------|-----------|--------|--------------|
| Admin | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Warehouse Manager | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Warehouse Operator | Yes | Yes | Yes | Yes | No | Yes | Yes |
| QA Manager | Yes | No | Limited | Yes | Yes | Yes | No |
| Production Operator | Yes | No | No | No | No | No | No |
| Viewer | Yes | No | No | No | No | Yes | No |

---

## Validation

### Create LP Form Validation

| Field | Rule | Error Message |
|-------|------|---------------|
| Product | Required, must exist | "Product is required" |
| Quantity | Required, positive, max 999999999 | "Quantity must be positive" |
| UoM | Required, max 20 chars | "Unit of measure is required" |
| Location | Required, must exist, must be active | "Location is required" |
| Warehouse | Required, must exist, must be active | "Warehouse is required" |
| LP Number | Unique within org (if provided) | "LP number already exists" |
| Batch | Max 100 chars | "Batch number too long" |
| Expiry Date | Valid date, future date | "Expiry date must be in the future" |
| Catch Weight | Positive if provided | "Catch weight must be positive" |

### List Query Validation

| Field | Rule | Error Message |
|-------|------|---------------|
| Status filter | Valid enum values only | "Invalid status filter" |
| QA status filter | Valid enum values only | "Invalid QA status filter" |
| Date range | from <= to | "Invalid date range" |
| Page | >= 1 | "Invalid page number" |
| Limit | 1-100 | "Limit must be between 1 and 100" |

---

## Business Rules

### LP Number Generation

```typescript
// Auto-generate LP number if enabled and not provided
function generateLPNumber(orgId: string): string {
  const settings = getWarehouseSettings(orgId);
  const prefix = settings.lp_number_prefix || 'LP';
  const length = settings.lp_number_sequence_length || 8;
  const nextSeq = getNextSequence(orgId);
  return prefix + nextSeq.toString().padStart(length, '0');
}
```

### Expiry Warning Logic

```typescript
// Calculate days to expiry and warning level
function getExpiryWarning(expiryDate: Date | null): {
  daysRemaining: number | null;
  warningLevel: 'expired' | 'critical' | 'warning' | 'normal' | null;
} {
  if (!expiryDate) return { daysRemaining: null, warningLevel: null };

  const today = new Date();
  const days = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (days < 0) return { daysRemaining: days, warningLevel: 'expired' };
  if (days <= 7) return { daysRemaining: days, warningLevel: 'critical' };
  if (days <= 30) return { daysRemaining: days, warningLevel: 'warning' };
  return { daysRemaining: days, warningLevel: 'normal' };
}
```

### Status Transition Rules

| Current Status | Allowed Actions | Next Status |
|----------------|-----------------|-------------|
| available | Block, Consume, Reserve, Move | blocked, consumed, reserved, available |
| reserved | Consume, Release | consumed, available |
| consumed | None (immutable) | — |
| blocked | Unblock | available |

### QA Status Rules

```typescript
// QA status can only transition in specific ways
const qaStatusTransitions = {
  pending: ['passed', 'failed', 'quarantine'],
  passed: ['failed', 'quarantine'],  // Re-test scenarios
  failed: ['quarantine', 'passed'],   // Re-inspection after corrective action
  quarantine: ['passed', 'failed']    // After quarantine evaluation
};
```

---

## Accessibility

### Touch Targets
- All buttons: minimum 48x48dp
- Table row click area: full row height (72px with 2-line content)
- Checkbox click area: 48x48dp
- Actions menu items: 48dp height
- Filter dropdowns: 48dp height

### Contrast
- Text on badges: 4.5:1 minimum
- Table text: 4.5:1 minimum
- Action buttons: 4.5:1 minimum
- Expiry warnings: 4.5:1 minimum

### Screen Reader
- KPI cards: "Total License Plates card: 1,247 license plates, 142.5 tons total inventory, click to view all"
- Table: Proper column headers with scope="col"
- Status badges: "Status: Available", "QA Status: Passed"
- Expiry indicators: "Expiry: June 15, 2026, 164 days remaining, normal"
- Actions menu: "Actions for LP00000156, menu expanded, 6 items"

### Keyboard Navigation
- Tab: Move between interactive elements
- Enter: Activate button/link, open detail panel
- Space: Toggle checkbox, open dropdown
- Escape: Close dropdown/modal/panel
- Arrow keys: Navigate within dropdown/menu
- Ctrl+F: Focus search input
- Ctrl+N: Open Create LP modal (if permitted)

### ARIA Attributes
```html
<!-- Table -->
<table role="table" aria-label="License Plates">
  <thead><tr role="row">...</tr></thead>
  <tbody role="rowgroup">...</tbody>
</table>

<!-- Status badges -->
<span role="status" aria-label="Status: Available" class="badge-available">Available</span>

<!-- Filters -->
<select aria-label="Filter by warehouse" aria-expanded="false">...</select>

<!-- Detail Panel -->
<aside role="complementary" aria-label="License Plate Detail" aria-modal="false">...</aside>

<!-- Create Modal -->
<dialog role="dialog" aria-label="Create License Plate" aria-modal="true">...</dialog>

<!-- KPI Cards -->
<article role="article" aria-label="Total License Plates KPI">
  <h3>Total LPs</h3>
  <p aria-label="1,247 total license plates">1,247</p>
</article>
```

---

## Responsive Breakpoints

| Breakpoint | Layout | Changes |
|------------|--------|---------|
| Desktop (>1024px) | Full table with all columns | Full KPI cards (4 across), horizontal filters, full table |
| Tablet (768-1024px) | Condensed table | 2x2 KPI grid, stacked filters, condensed table (2 lines) |
| Mobile (<768px) | Card layout | Vertical KPI list, expandable filters, card per LP, "Load More" pagination |

### Mobile-Specific Adaptations
- Filters collapse into expandable drawer/modal
- Table becomes card list with key info visible
- Pagination becomes "Load More" infinite scroll
- Detail panel becomes full-screen modal
- Create modal becomes full-screen form
- Bulk actions (if added) in bottom action sheet

---

## Performance Notes

### Query Optimization

```sql
-- Primary indexes for list queries
CREATE INDEX idx_lp_org_status ON license_plates(org_id, status);
CREATE INDEX idx_lp_org_product ON license_plates(org_id, product_id);
CREATE INDEX idx_lp_org_location ON license_plates(org_id, location_id);
CREATE INDEX idx_lp_org_warehouse ON license_plates(org_id, warehouse_id);
CREATE INDEX idx_lp_org_qa ON license_plates(org_id, qa_status);
CREATE INDEX idx_lp_expiry ON license_plates(expiry_date) WHERE expiry_date IS NOT NULL;
CREATE INDEX idx_lp_created ON license_plates(created_at);
CREATE INDEX idx_lp_number_search ON license_plates(org_id, lp_number text_pattern_ops);
```

### Caching Strategy

```typescript
// Redis cache keys
const cacheKeys = {
  lpList: (orgId: string, filtersHash: string) =>
    `org:${orgId}:warehouse:lp-list:${filtersHash}`,  // 1 min TTL
  lpSummary: (orgId: string) =>
    `org:${orgId}:warehouse:lp-summary`,              // 2 min TTL
  lpDetail: (orgId: string, lpId: string) =>
    `org:${orgId}:warehouse:lp:${lpId}`,              // 5 min TTL
  warehouseDropdown: (orgId: string) =>
    `org:${orgId}:warehouse:dropdown`,                // 10 min TTL
  productDropdown: (orgId: string) =>
    `org:${orgId}:products:dropdown`,                 // 10 min TTL
};

// Cache invalidation on:
// - LP create/update/delete
// - Status change
// - QA status change
// - Location move
```

### Load Time Targets

| Operation | Target | P95 |
|-----------|--------|-----|
| Initial page load | <500ms | <800ms |
| Filter change | <300ms | <500ms |
| Search (debounced) | <300ms | <500ms |
| Pagination | <300ms | <500ms |
| Detail panel open | <200ms | <300ms |
| Create LP | <500ms | <800ms |
| Export 100 LPs | <2s | <3s |
| Export 1000 LPs | <5s | <8s |

### Data Volume Handling

| Scenario | Strategy |
|----------|----------|
| <1,000 LPs | No special handling, standard queries |
| 1,000-10,000 LPs | Enable pagination, cursor-based if needed |
| 10,000-100,000 LPs | Mandatory pagination, indexed queries, Redis cache |
| >100,000 LPs | Partitioning by date/warehouse, ElasticSearch for search |

---

## Testing Requirements

### Unit Tests

```typescript
// KPI calculations
describe('LP KPI Calculations', () => {
  test('calculates total LPs count correctly');
  test('calculates available LPs percentage');
  test('calculates expiring soon count (7 days)');
  test('calculates expiring critical count (0-7 days)');
});

// Status badge mapping
describe('Status Badge Colors', () => {
  test('returns green for available');
  test('returns yellow for reserved');
  test('returns red for blocked');
  test('returns gray for consumed');
});

// Expiry warning logic
describe('Expiry Warning Calculator', () => {
  test('returns expired for dates in past');
  test('returns critical for 0-7 days');
  test('returns warning for 8-30 days');
  test('returns normal for >30 days');
  test('handles null expiry date');
});

// Filter query building
describe('LP Filter Query Builder', () => {
  test('builds query with single warehouse filter');
  test('builds query with multiple status filters');
  test('builds query with search term (prefix match)');
  test('builds query with date range');
  test('combines multiple filters correctly');
});
```

### Integration Tests

```typescript
describe('LP List API Integration', () => {
  test('GET /api/warehouse/license-plates returns paginated list');
  test('GET /api/warehouse/license-plates?status=available filters correctly');
  test('GET /api/warehouse/license-plates?search=LP0001 searches correctly');
  test('GET /api/warehouse/license-plates/:id returns LP detail');
  test('GET /api/warehouse/license-plates/:id with invalid ID returns 404');
  test('GET /api/warehouse/license-plates/summary returns KPIs');
  test('POST /api/warehouse/license-plates creates LP');
  test('POST /api/warehouse/license-plates with duplicate number returns 409');
  test('PUT /api/warehouse/license-plates/:id/block blocks LP');
  test('PUT /api/warehouse/license-plates/:id/unblock unblocks LP');
  test('PUT /api/warehouse/license-plates/:id/qa-status updates QA');
  test('RLS enforces org isolation on list');
  test('RLS enforces org isolation on detail');
  test('Cross-org access returns 404');
  test('Response times meet targets (<500ms for list)');
});
```

### E2E Tests (Playwright)

```typescript
describe('LP List Page E2E', () => {
  test('page loads with data and shows all KPIs and table', async () => {
    // Navigate to /warehouse/license-plates
    // Assert KPI cards visible
    // Assert table has rows
    // Assert pagination visible
  });

  test('empty state shows correct message and actions', async () => {
    // Setup: Empty LP table
    // Navigate to page
    // Assert empty state illustration
    // Assert "Create First License Plate" button
  });

  test('filter by status updates table correctly', async () => {
    // Open status filter
    // Select "available"
    // Assert table updates
    // Assert only available LPs shown
  });

  test('search by LP number works', async () => {
    // Type "LP0001" in search
    // Assert debounce delay (300ms)
    // Assert filtered results
  });

  test('click row opens detail panel', async () => {
    // Click LP row
    // Assert panel slides in
    // Assert LP detail displayed
  });

  test('create button opens create modal', async () => {
    // Click "Create LP"
    // Assert modal opens
    // Assert form fields visible
  });

  test('block LP action works', async () => {
    // Open LP detail panel
    // Click "Block LP"
    // Enter reason
    // Confirm
    // Assert status changes to "blocked"
  });

  test('responsive layout at all breakpoints', async () => {
    // Test desktop (1440px): full table
    // Test tablet (768px): condensed table
    // Test mobile (375px): card layout
  });

  test('error state shows on API failure', async () => {
    // Mock API failure
    // Navigate to page
    // Assert error message
    // Assert retry button
  });
});
```

### Performance Tests

```typescript
describe('LP List Performance', () => {
  test('list 1000 LPs loads in <1s', async () => {
    // Setup: 1000 LPs in DB
    // Measure GET /api/warehouse/license-plates
    // Assert response time < 1000ms
  });

  test('filter change responds in <500ms', async () => {
    // Apply filter
    // Measure response time
    // Assert < 500ms
  });

  test('search responds in <300ms', async () => {
    // Type search term
    // Measure response time (after debounce)
    // Assert < 300ms
  });

  test('export 100 LPs completes in <3s', async () => {
    // Request export
    // Measure time to file download
    // Assert < 3000ms
  });

  test('detail panel opens in <200ms', async () => {
    // Click LP row
    // Measure panel open time
    // Assert < 200ms
  });
});
```

---

## Component Specifications

### LPDataTable Component

```typescript
interface LPDataTableProps {
  data: LicensePlate[];
  loading: boolean;
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  onSort: (field: string, order: 'asc' | 'desc') => void;
  onRowClick: (lp: LicensePlate) => void;
  onActionClick: (lp: LicensePlate, action: string) => void;
}

// Features:
// - ShadCN DataTable pattern
// - Sortable columns (LP number, product, qty, location, status, QA, expiry)
// - Click row to open detail panel
// - Row actions dropdown (View, Block, Update QA, Print, etc.)
// - Mobile responsive (switches to card layout <768px)
// - Skeleton loading state
```

### LPFilters Component

```typescript
interface LPFiltersProps {
  filters: LPFilters;
  warehouses: Warehouse[];
  locations: Location[];
  products: Product[];
  onFilterChange: (filters: LPFilters) => void;
  onClearAll: () => void;
}

// Features:
// - Warehouse dropdown (single select)
// - Location hierarchical dropdown (filtered by warehouse)
// - Product searchable dropdown
// - Status multi-select
// - QA status multi-select
// - Expiry date range picker
// - Search input with debounce (300ms)
// - Quick filter buttons
// - Mobile: collapsible filter drawer
```

### LPDetailPanel Component

```typescript
interface LPDetailPanelProps {
  lp: LicensePlate | null;
  open: boolean;
  onClose: () => void;
  onBlock: (lpId: string, reason: string) => void;
  onUnblock: (lpId: string) => void;
  onUpdateQA: (lpId: string, qaStatus: QAStatus) => void;
  onPrintLabel: (lpId: string) => void;
}

// Features:
// - Slide-in from right (desktop/tablet)
// - Full-screen modal (mobile)
// - Sections: Identity, Product, Location, Tracking, Source, Audit
// - Quick actions: Block, Update QA, Print Label, View History
// - Close on Escape key
// - Click outside to close (desktop)
```

### LPStatusBadge Component

```typescript
interface LPStatusBadgeProps {
  status: LPStatus;
  size?: 'sm' | 'md' | 'lg';
}

// Status color mapping:
// - available: green (bg-green-100 text-green-800)
// - reserved: yellow (bg-yellow-100 text-yellow-800)
// - consumed: gray (bg-gray-100 text-gray-500)
// - blocked: red (bg-red-100 text-red-800)

// Accessibility: role="status" with aria-label
```

### LPQAStatusBadge Component

```typescript
interface LPQAStatusBadgeProps {
  qaStatus: QAStatus;
  size?: 'sm' | 'md' | 'lg';
}

// QA status color mapping:
// - pending: yellow (bg-yellow-100 text-yellow-800)
// - passed: green (bg-green-100 text-green-800)
// - failed: red (bg-red-100 text-red-800)
// - quarantine: orange (bg-orange-100 text-orange-800)

// Accessibility: role="status" with aria-label
```

### LPExpiryIndicator Component

```typescript
interface LPExpiryIndicatorProps {
  expiryDate: Date | null;
  format?: 'short' | 'long';
}

// Display format:
// - Expired: "Expired" + 🔴
// - 0-7 days: "X days" + ⚠️ (red)
// - 8-30 days: "X days" + ⚠️ (yellow)
// - >30 days: "X days" + ✓ (green)
// - null: "—"

// Tooltip: Full date on hover
```

### CreateLPModal Component

```typescript
interface CreateLPModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateLPInput) => Promise<void>;
  warehouses: Warehouse[];
  products: Product[];
}

// Features:
// - ShadCN Dialog/Modal pattern
// - Form validation with Zod
// - Auto-generate LP number button
// - Product dropdown with search
// - Warehouse/Location cascading dropdowns
// - Date pickers for manufacture/expiry
// - Optional fields collapsible
// - Loading state on submit
// - Error handling
```

---

## Quality Gates

Before handoff to FRONTEND-DEV:
- [x] All 5 states defined (Loading, Empty, Error, Success, Filtered Empty)
- [x] Responsive breakpoints documented (Desktop/Tablet/Mobile)
- [x] All API endpoints specified with request/response schemas
- [x] Accessibility checklist passed (touch targets, contrast, screen reader, keyboard, ARIA)
- [x] Performance targets defined
- [x] Status badge colors defined for all 4 statuses
- [x] QA badge colors defined for all 4 statuses
- [x] Expiry indicator colors defined for all 4 warning levels
- [x] Filter logic documented
- [x] Permissions matrix documented
- [x] Business rules for status transitions documented
- [x] Component specifications documented
- [x] User flow diagram created
- [x] Create LP modal designed
- [x] Detail panel designed
- [x] Testing requirements specified (Unit/Integration/E2E/Performance)

---

## Handoff to FRONTEND-DEV

```yaml
feature: License Plate List Page
story: 05.1
epic: 05-warehouse
fr_coverage: WH-FR-001, WH-FR-002, WH-FR-006, WH-FR-008
approval_status:
  mode: "auto_approve"
  user_approved: true
  approved_at: "2026-01-02T10:00:00Z"
  screens_approved:
    - LP List Page (Desktop/Tablet/Mobile)
    - LP Detail Panel
    - Create LP Modal
    - All 5 states per screen
  iterations_used: 0
deliverables:
  wireframe: docs/3-ARCHITECTURE/ux/wireframes/WH-001-license-plate-list.md
  user_flow: included
  api_endpoints:
    - GET /api/warehouse/license-plates (list with filters)
    - GET /api/warehouse/license-plates/:id (detail)
    - GET /api/warehouse/license-plates/summary (KPIs)
    - POST /api/warehouse/license-plates (create)
    - POST /api/warehouse/license-plates/generate-number
    - PUT /api/warehouse/license-plates/:id/block
    - PUT /api/warehouse/license-plates/:id/unblock
    - PUT /api/warehouse/license-plates/:id/qa-status
    - GET /api/warehouse/license-plates/export
states_per_screen:
  - loading
  - empty
  - error
  - success
  - filtered_empty
breakpoints:
  mobile: "<768px (card layout, load more, full-screen modals)"
  tablet: "768-1024px (condensed table, 2x2 KPIs)"
  desktop: ">1024px (full table, 4-across KPIs)"
accessibility:
  touch_targets: "48x48dp minimum"
  contrast: "4.5:1 minimum (WCAG AA)"
  aria_roles: "table, status, dialog, complementary"
  keyboard_nav: "Tab, Enter, Space, Escape, Arrows, Ctrl+F, Ctrl+N"
performance_targets:
  initial_load: "<500ms (P95 <800ms)"
  filter_change: "<300ms (P95 <500ms)"
  search: "<300ms (P95 <500ms)"
  detail_panel: "<200ms (P95 <300ms)"
  create_lp: "<500ms (P95 <800ms)"
  export_100: "<2s (P95 <3s)"
components:
  - LPDataTable (ShadCN DataTable)
  - LPFilters (Multi-filter panel)
  - LPDetailPanel (Slide-in)
  - LPStatusBadge (4 variants)
  - LPQAStatusBadge (4 variants)
  - LPExpiryIndicator (4 warning levels)
  - CreateLPModal (ShadCN Dialog)
related_screens:
  - WH-002: LP Split/Merge (future - story 05.6)
  - WH-003: LP Movements (future - story 05.5)
  - WH-004: GRN Receipt (story 05.8)
  - PROD-003: Material Consumption (Epic 04)
  - PROD-004: Output Registration (Epic 04)
critical_for_epic_04: true
dependencies:
  - 01.1: Org Context + RLS (Ready)
  - 01.8: Warehouses CRUD (Ready)
  - 01.9: Locations CRUD (Ready)
  - 02.1: Products CRUD (Ready)
```

---

**Status**: Approved (Auto-Approve Mode)
**Approval Mode**: auto_approve
**User Approved**: Yes
**Approval Date**: 2026-01-02
**Iterations**: 0 of 3
**Estimated Frontend Effort**: 12-16 hours
**Estimated Backend Effort**: 16-20 hours (see story 05.1 for full implementation)
**Quality Target**: 98/100
**Ready for Implementation**: Yes ✅

---

## Notes for Implementation

### Critical Path for Epic 04

This story (05.1) is a **CRITICAL BLOCKER** for Epic 04 Production. The following service methods MUST be implemented and tested before Epic 04 can proceed:

1. **LicensePlateService.consumeLP()** - Material consumption (Epic 04.6a-e)
2. **LicensePlateService.createOutputLP()** - Production output (Epic 04.7a-d)
3. **LicensePlateService.getAvailableLPs()** - Pick suggestions (Epic 04.6a-e)
4. **LicensePlateService.validateForConsumption()** - Pre-consumption checks

### Implementation Priority

1. **Phase 1 (Day 1-2)**: Database + Service Layer + API
   - Create `license_plates` table with all columns
   - Implement `LicensePlateService` with all methods
   - Create all API endpoints
   - **Deliverable**: Unblocks Epic 04 backend development

2. **Phase 2 (Day 3-4)**: Frontend UI
   - LP List page with filters
   - LP Detail panel
   - Create LP modal
   - Status/QA badges
   - **Deliverable**: Warehouse operators can manually manage LPs

3. **Phase 3 (Testing)**: Integration & E2E
   - Unit tests for service methods
   - Integration tests for API
   - E2E tests for UI flows
   - **Deliverable**: Production-ready LP management

### Future Enhancements (Deferred)

- **Story 05.6**: LP Split/Merge workflows
- **Story 05.5**: LP CRUD Desktop (full edit capabilities)
- **Story 05.4**: FIFO/FEFO Pick Suggestions
- **Story 05.7**: QA Status transition workflows
- **Story 05.14**: Label printing
- **Story 05.17+**: Scanner workflows
- **Story 05.24**: GS1 barcode parsing
- **Story 05.26**: Pallet management
