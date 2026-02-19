# MonoPilot Design Guidelines
**Date**: 2026-02-16
**Source**: 6 MonoPilot UI screenshots (KEEP), 6 external inspiration screenshots, user feedback

---

## OUR UI - WHAT TO KEEP (User Approved)

### 1. Create New Product Form (130958)
**KEEP**: Clean, minimal form layout. Sections: Basic Information, Inventory Settings, Default Supplier, Allergens. Only essential fields visible. Smart placeholders ("e.g., RM-FLOUR-001"). Two buttons: Cancel / Create Product.
**ENHANCE**: Add new fields from D365 analysis (weights, shelf life, catch weight) but keep the same clean section layout.

### 2. BOM Explosion View (131148)
**KEEP - USER LOVES THIS**:
- Header: Product code + version badge (active/draft) + action buttons (Scale, Clone, Compare, Edit, Delete)
- Effective date range + Output quantity
- Tab navigation: Items (2) | Explosion | Costing | Yield | Allergens | Timeline
- Multi-Level Explosion table: Component, Level (L1 badge), Type (Raw Material tag), Direct Qty, Cumulative, Scrap %
- Raw Materials Summary card below
**ENHANCE**: Add co-products tab, formula versioning, flushing principle column.

### 3. BOM List View (131156)
**KEEP**: Clean table with: Product Code (monospace), Product Name, Version (v1/v2 badges), Status (Active green / Draft amber), Effective From/To, Output, Timeline icon. Search bar + Status filter + Date filter + Create BOM button.
**ENHANCE**: Add "Approved" status, filter by item group.

### 4. Sidebar Navigation (131233)
**KEEP**:
- Left sidebar with icons + labels
- Modules: Dashboard, Settings, Technical, Planning, Production, Warehouse, Scanner, Quality, Shipping
- Settings expanded shows sub-categories: Organization, Users & Roles, Infrastructure, Master Data, Integrations, System
- "Soon" badges for upcoming features
**ENHANCE**: Add new modules: Finance, OEE, Reporting. Add NPD, Multi-Site later.

### 5. Warehouse Dashboard (131247)
**KEEP**:
- 5 color-coded KPI cards across top (Total LPs blue, Available green, Reserved orange, Consumed Today purple, Expiring Soon red)
- 3 alert panels below: Low Stock Alerts (with badge count), Expiring Items, Blocked LPs
- Recent Activity feed at bottom
**FIX**: Spacing between cards is good here. Keep this density.

### 6. Suppliers List (131308)
**KEEP**:
- 4 summary KPI cards at top (Total, Active, Inactive, This Month)
- Search + multi-filter dropdowns (Suppliers, Currencies, Payment Terms)
- Clean table: Code (monospace), Name + Status badge + Payment terms, Contact, Email (clickable), Phone, Products Count, Actions (edit + menu)
- Import + Create Supplier buttons top-right

---

## DESIGN INSPIRATION (External Screenshots)

### A. OEE Dashboard - Corso Systems (132138)
**TAKE**:
- KPI row with mini gauge/sparkline per metric (OEE Goal 65%, Time Range 10.4%, This Week 97%, etc.)
- Color coding: green = above target, red = below
- Rolling 12-month line chart with multiple metrics overlay
- OEE by Product horizontal bar chart
**SKIP**: Old-fashioned dark sidebar, form-heavy left panel

### B. Production Report - Explitia (132212)
**TAKE**:
- Dark theme option (navy blue background)
- Progress bars for production metrics (Obroty 86/404, Zalenia 384/1218, Pakowanie 234/1218)
- Large donut charts for key % metrics (100% Pominięcia, 92% Jakość)
- Compact summary tables below (Produkt + Liczba)
- Clean filter bar at top (Line, Date from/to, Entries count, Filter button)
**SKIP**: Polish-specific labels (we use English)

### C. Production Planning Grid - Explitia (132222)
**TAKE**:
- Dense data grid with shift-based columns (Shift 1/2/3 per day)
- Color-coded cells: red = negative/problem, white = normal, green = positive
- Rows grouped by project/product with KPIs: Shipping, Work Order, Plan, Storage, Line Molds, Formy, Retool, WO+
- Date headers spanning multiple shifts
- Very compact spacing - minimal padding
**GREAT EXAMPLE** of tight, information-dense layout that still reads well

### D. Reports Dashboard - Tidio-style (132446)
**TAKE**:
- KPI cards with: large number + small % change badge (green up / red down)
- Weekly bar chart with two-color stacked bars
- Top performers list with avatar + rating %
- Histogram for response time distribution
- Donut chart for satisfaction (Good/Bad with %)
- Time range selector top-right ("Last 7 days")
- Download button
**THIS IS THE LOOK** for our Reporting module dashboards

### E. Data Browser - Column Navigation (132457)
**TAKE**:
- Multi-column drill-down (Source → Dir → Data → Keys → Values)
- Each column scrollable independently
- "Pick" buttons for selecting data types
- Occurrence % indicators
- Search per column
**USEFUL FOR**: Settings hierarchies, location drill-downs, trace/genealogy views

### F. Admin Dashboard (132549)
**TAKE**:
- 4 KPI cards with: label, large value, "vs last month" comparison, % change badge
- System Logs as timeline (icon + title + description + time ago)
- API Requests mini chart with sparkline overlay
- Request Log table: ID, Endpoint, Method, Status (color-coded), Duration, Time
- List/Grid toggle
- Clean left sidebar with grouped sections (Workspace → sites, System → Performance/Storage/Activity)
**USEFUL FOR**: System/Admin dashboard, audit logs, API monitoring

---

## DESIGN PRINCIPLES (From User Feedback + Analysis)

### 1. TIGHTER SPACING
**Problem**: Current MonoPilot tabs have too much space between elements. D365 and KPI reports use space more efficiently.
**Rule**:
- Card padding: 16px (not 24px)
- Gap between cards: 12px (not 24px)
- Table row height: 40px (not 52px)
- Section gap: 16px (not 32px)
- Form field gap: 12px (not 20px)

### 2. INFORMATION DENSITY
**Principle**: Show more data per screen. Users are production managers - they want to see everything at a glance.
**Rules**:
- Dashboard KPI cards: 4-5 across (not 3)
- Tables: compact mode as default, comfortable as option
- Charts: meaningful size, not oversized
- Use inline badges/tags instead of separate columns where possible (like status + payment terms on same line in Suppliers)

### 3. DATA-FIRST, NOT CHROME-FIRST
**Principle**: Maximize data area, minimize decorative elements.
**Rules**:
- Sidebar: collapsed by default on smaller screens
- No excessive borders or shadows
- Use color coding for status (green/amber/red), not large status panels
- Trend indicators: small % badges with arrows, not large charts for simple changes

### 4. COLOR LANGUAGE (Consistent Across App)
```
Status:
  Active/Good/Available  → green (#22c55e)
  Warning/Draft/Reserved → amber (#f59e0b)
  Error/Blocked/Expired  → red (#ef4444)
  Info/Neutral           → blue (#3b82f6)

KPI Trends:
  Improving (higher-is-better) → green badge with ↑
  Improving (lower-is-better)  → green badge with ↓
  Declining                    → red badge with ↓/↑
  No change                    → gray badge

Production Metrics:
  Above target → green background/text
  Near target (±5%) → amber
  Below target → red

Grade System:
  A → green
  B → blue
  C → amber
  D → red
```

### 5. FORM DESIGN (User-Friendly, Not D365)
**Principle**: Minimum required fields. Auto-fill everything possible.
**Rules**:
- Required fields: red asterisk, max 3-4 per form
- Auto-fill from related records (supplier → address, currency, payment terms)
- Smart defaults (status=Active, yield=100%, today's date)
- Sections collapsible (Advanced settings hidden by default)
- Two actions only: Cancel / Create (or Save)
- Placeholders with examples ("e.g., RM-FLOUR-001")
- Validation inline, not after submit

### 6. TABLE DESIGN
**Pattern** (from our Suppliers + BOM list):
- Summary KPI cards above table (4 cards max)
- Search + filter dropdowns in one row
- Sortable columns with ↑↓ indicators
- Monospace for codes/IDs
- Inline badges for status
- Actions column: edit icon + overflow menu (...)
- Pagination or infinite scroll
- Export / Copy to Clipboard

### 7. DASHBOARD PATTERN
**Standard Layout** (from our Warehouse + inspiration):
```
┌─────────────────────────────────────────────────┐
│ Page Title              [Refresh] [+ Action] [🔍]│
│ Subtitle / last updated                          │
├────┬────┬────┬────┬────┤                         │
│KPI1│KPI2│KPI3│KPI4│KPI5│  ← 4-5 cards, color-coded
├────┴────┴────┴────┴────┤                         │
│                                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │ Alert    │ │ Alert    │ │ Alert    │          │
│  │ Panel 1  │ │ Panel 2  │ │ Panel 3  │          │
│  └──────────┘ └──────────┘ └──────────┘         │
│                                                   │
│  ┌────────────────────────────────────┐          │
│  │ Main Chart / Table                 │          │
│  │ (trend chart, data table, etc.)    │          │
│  └────────────────────────────────────┘          │
│                                                   │
│  Recent Activity / Timeline                       │
└───────────────────────────────────────────────────┘
```

### 8. REPORTING DASHBOARD PATTERN (from Tidio + KPI reports)
```
┌─────────────────────────────────────────────────┐
│ Report Title           [Day|Week|Period|Year] [📥]│
├────┬────┬────┬────┬────┤                         │
│KPI │KPI │KPI │KPI │KPI │  ← with % change badges
│+chg│+chg│+chg│+chg│+chg│                         │
├────┴────┴────┴────┴────┤                         │
│                                                   │
│  ┌──────────────────────────┐ ┌──────────┐       │
│  │ Main Trend Chart         │ │ Top 3    │       │
│  │ (13-week/period line)    │ │ Gains/   │       │
│  │                          │ │ Losses   │       │
│  └──────────────────────────┘ └──────────┘       │
│                                                   │
│  ┌────────────────────────────────────┐          │
│  │ Data Table (sortable, filterable)  │          │
│  │ with inline sparklines per row     │          │
│  └────────────────────────────────────┘          │
└───────────────────────────────────────────────────┘
```

### 9. PRODUCTION GRID PATTERN (from Explitia planning)
For scheduling / shift views:
```
┌─────────────────────────────────────────────────┐
│ Filters: [Line ▼] [Product ▼] [Date From→To]   │
├───────┬─────────┬─────────┬─────────┬───────────┤
│       │ 07.02   │ 08.02   │ 09.02   │ 10.02    │
│ KPI   │ S1│S2│S3│ S1│S2│S3│ S1│S2│S3│ S1│S2│S3 │
├───────┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┤
│Planned│  │  │  │  │  │  │  │  │  │  │  │  │
│Actual │██│██│  │██│██│██│  │  │  │  │  │  │
│Yield% │92│88│  │95│91│87│  │  │  │  │  │  │
│Storage│  │  │  │  │  │  │  │  │  │  │  │  │
└───────┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┘
Color: green=on target, red=below, white=empty
```

---

## SCREENSHOTS INDEX (All 43)

### MonoPilot UI (KEEP & ENHANCE)
| File | Category | Shows |
|------|----------|-------|
| 130958 | Product | Create New Product form |
| 131148 | BOM | BOM Explosion view (LOVED) |
| 131156 | BOM | BOM list with versions/status |
| 131233 | Navigation | Sidebar with all modules |
| 131247 | Warehouse | Warehouse Dashboard (KPI cards + alerts) |
| 131308 | Suppliers | Suppliers list (KPI cards + table) |

### D365 Reference (Data Structures Only)
| File | Category | Shows |
|------|----------|-------|
| 115408-122509 | Various | 31 D365 screenshots (see D365-ANALYSIS.md) |

### Design Inspiration (External)
| File | Source | Take From It |
|------|--------|-------------|
| 132138 | Corso Systems OEE | KPI row with gauges, rolling chart, product bar chart |
| 132212 | Explitia Production | Dark theme, progress bars, donut charts, compact tables |
| 132222 | Explitia Planning | Dense shift grid, color-coded cells, tight spacing |
| 132446 | Tidio-style Reports | KPI cards with % change, bar chart, performers list |
| 132457 | Restdb-style Browser | Column drill-down navigation for hierarchies |
| 132549 | Admin Dashboard | System logs timeline, API request chart, clean layout |
