# TEC-017: Technical Module Dashboard

**Module**: Technical
**Feature**: Dashboard (FR-2.100, FR-2.101, FR-2.102)
**Status**: Auto-Approved
**Last Updated**: 2025-12-14

---

## ASCII Wireframe

### Success State (Desktop)

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  Technical > Dashboard                                                                   │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                           │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐   │
│  │ 📦 Products      │ │ 📋 BOMs          │ │ 🔧 Routings      │ │ 💰 Avg Cost      │   │
│  │                  │ │                  │ │                  │ │                  │   │
│  │    247           │ │    183           │ │    45            │ │    125.50 PLN    │   │
│  │                  │ │                  │ │                  │ │    ↑ +5.2%      │   │
│  │ ✓ Active: 215    │ │ ✓ Active: 156    │ │ ✓ Reusable: 32   │ │                  │   │
│  │ ○ Inactive: 32   │ │ ○ Phased: 27     │ │ Total: 45        │ │ Click for trend  │   │
│  │                  │ │                  │ │                  │ │                  │   │
│  │ [View All →]     │ │ [View All →]     │ │ [View All →]     │ │ [Cost History →] │   │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘ └──────────────────┘   │
│                                                                                           │
│  ┌──────────────────────────────────────────┐ ┌─────────────────────────────────────┐  │
│  │ Allergen Matrix                          │ │ BOM Version Timeline (Last 6 Months)│  │
│  │                                          │ │                                     │  │
│  │ Filter: [All Products ▼] [Export PDF]   │ │ Filter: [All Products ▼]           │  │
│  │                                          │ │                                     │  │
│  │       Gluten Dairy Nuts Soy Eggs Sesame │ │ Nov    Dec    Jan    Feb    Mar    │  │
│  │ ┌────────────────────────────────────┐  │ │  •      •     ••      •      ••   │  │
│  │ │ SKU-001 │  🔴   🟢   🟢  🟢  🟢   🟢 │  │ │ Wheat Bread v5                    │  │
│  │ │ Wheat   │                           │  │ │                                     │  │
│  │ ├─────────────────────────────────────┤  │ │  •                    •      •     │  │
│  │ │ SKU-002 │  🔴   🔴   🟡  🟢  🔴   🟢 │  │ │ Rye Bread v3                      │  │
│  │ │ Bread   │                           │  │ │                                     │  │
│  │ ├─────────────────────────────────────┤  │ │        •      •       •            │  │
│  │ │ SKU-003 │  🟢   🟢   🔴  🔴  🟢   🟢 │  │ │ Cookies v4                        │  │
│  │ │ Cookies │                           │  │ │                                     │  │
│  │ ├─────────────────────────────────────┤  │ │                 •      •      •    │  │
│  │ │ SKU-004 │  🟡   🟢   🟡  🟢  🟢   🔴 │  │ │ Granola v2                        │  │
│  │ │ Granola │                           │  │ │                                     │  │
│  │ └─────────────────────────────────────┘  │ │ Hover dot: version details          │  │
│  │                                          │ │ Click dot: → TEC-006 (BOM detail)   │  │
│  │ Legend:                                  │ │                                     │  │
│  │ 🔴 Contains  🟡 May Contain  🟢 Free    │ │                                     │  │
│  │                                          │ │                                     │  │
│  │ Click cell → TEC-010 (Allergen Mgmt)    │ │                                     │  │
│  └──────────────────────────────────────────┘ └─────────────────────────────────────┘  │
│                                                                                           │
│  ┌──────────────────────────────────────────┐ ┌─────────────────────────────────────┐  │
│  │ Recent Activity                          │ │ Cost Trends (Last 6 Months)         │  │
│  │                                          │ │                                     │  │
│  │ ┌────────────────────────────────────┐  │ │ Toggle: [Material][Labor][Total ✓]│  │
│  │ │ 📦 Product SKU-015 created         │  │ │                                     │  │
│  │ │    by John Doe • 2 hours ago       │  │ │    PLN                             │  │
│  │ ├────────────────────────────────────┤  │ │ 150 ┤           ╱──╲                │  │
│  │ │ 📋 BOM v3 for SKU-002 activated    │  │ │     │         ╱      ╲              │  │
│  │ │    by Jane Smith • 5 hours ago     │  │ │ 125 ┤       ╱          ╲───╲       │  │
│  │ ├────────────────────────────────────┤  │ │     │     ╱                  ╲     │  │
│  │ │ 🔧 Routing RTG-BREAD-01 updated    │  │ │ 100 ┤───╱                      ╲   │  │
│  │ │    by John Doe • 1 day ago         │  │ │     └──────────────────────────────┤  │
│  │ ├────────────────────────────────────┤  │ │       Nov   Dec   Jan   Feb   Mar  │  │
│  │ │ 📦 Product SKU-012 status changed  │  │ │                                     │  │
│  │ │    by Admin • 1 day ago            │  │ │ Click chart → TEC-015 (Cost History)│  │
│  │ ├────────────────────────────────────┤  │ │                                     │  │
│  │ │ 📋 BOM v2 for SKU-008 created      │  │ │                                     │  │
│  │ │    by Jane Smith • 2 days ago      │  │ │                                     │  │
│  │ ├────────────────────────────────────┤  │ │                                     │  │
│  │ │ [View All Activity →]              │  │ │                                     │  │
│  │ └────────────────────────────────────┘  │ │                                     │  │
│  └──────────────────────────────────────────┘ └─────────────────────────────────────┘  │
│                                                                                           │
│  Quick Actions: [+ New Product] [+ New BOM] [+ New Routing]                             │
│                                                                                           │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### Success State (Tablet: 768-1024px)

```
┌─────────────────────────────────────────────────────────────┐
│  Technical > Dashboard                                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────────┐ ┌────────────────────┐              │
│  │ 📦 Products        │ │ 📋 BOMs            │              │
│  │    247             │ │    183             │              │
│  │ ✓ Active: 215      │ │ ✓ Active: 156      │              │
│  │ [View All →]       │ │ [View All →]       │              │
│  └────────────────────┘ └────────────────────┘              │
│                                                               │
│  ┌────────────────────┐ ┌────────────────────┐              │
│  │ 🔧 Routings        │ │ 💰 Avg Cost        │              │
│  │    45              │ │    125.50 PLN      │              │
│  │ ✓ Reusable: 32     │ │    ↑ +5.2%        │              │
│  │ [View All →]       │ │ [Cost History →]   │              │
│  └────────────────────┘ └────────────────────┘              │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Allergen Matrix          [All Products ▼] [Export PDF]│  │
│  │ (Scroll horizontally for all allergens)               │  │
│  │       Gluten Dairy Nuts Soy Eggs Sesame ...           │  │
│  │ SKU-001  🔴   🟢   🟢  🟢  🟢   🟢                    │  │
│  │ SKU-002  🔴   🔴   🟡  🟢  🔴   🟢                    │  │
│  │ ...                                                    │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ BOM Version Timeline (Last 6 Months)                  │  │
│  │ [All Products ▼]                                      │  │
│  │ Nov    Dec    Jan    Feb    Mar                       │  │
│  │  •      •     ••      •      ••   Wheat Bread v5     │  │
│  │  •                    •      •    Rye Bread v3       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Recent Activity                                        │  │
│  │ 📦 SKU-015 created by John • 2h ago                   │  │
│  │ 📋 BOM v3 for SKU-002 activated • 5h ago              │  │
│  │ [View All →]                                          │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Cost Trends (Last 6 Months)                           │  │
│  │ [Material][Labor][Total ✓]                            │  │
│  │ (Chart rendered smaller)                              │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  [+ New Product] [+ New BOM] [+ New Routing]                 │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Success State (Mobile: < 768px)

```
┌───────────────────────────┐
│  < Technical Dashboard    │
├───────────────────────────┤
│                           │
│  ┌───────────────────┐    │
│  │ 📦 Products       │    │
│  │    247            │    │
│  │ ✓ Active: 215     │    │
│  │ ○ Inactive: 32    │    │
│  │ [View All →]      │    │
│  └───────────────────┘    │
│                           │
│  ┌───────────────────┐    │
│  │ 📋 BOMs           │    │
│  │    183            │    │
│  │ ✓ Active: 156     │    │
│  │ ○ Phased: 27      │    │
│  │ [View All →]      │    │
│  └───────────────────┘    │
│                           │
│  ┌───────────────────┐    │
│  │ 🔧 Routings       │    │
│  │    45             │    │
│  │ ✓ Reusable: 32    │    │
│  │ [View All →]      │    │
│  └───────────────────┘    │
│                           │
│  ┌───────────────────┐    │
│  │ 💰 Avg Cost       │    │
│  │    125.50 PLN     │    │
│  │    ↑ +5.2%       │    │
│  │ [Cost History →]  │    │
│  └───────────────────┘    │
│                           │
│  ┌─────────────────────┐  │
│  │ Allergen Matrix     │  │
│  │ [All Products ▼]    │  │
│  │ [Export PDF]        │  │
│  │                     │  │
│  │ (Scroll both axes)  │  │
│  │   Glu Dairy Nuts    │  │
│  │ S1 🔴   🟢   🟢    │  │
│  │ S2 🔴   🔴   🟡    │  │
│  │ ...                 │  │
│  │                     │  │
│  │ Tap cell for detail │  │
│  └─────────────────────┘  │
│                           │
│  ┌─────────────────────┐  │
│  │ BOM Timeline        │  │
│  │ [All Products ▼]    │  │
│  │                     │  │
│  │ Nov Dec Jan Feb Mar │  │
│  │  •   •  ••   •  ••  │  │
│  │ Wheat Bread v5      │  │
│  │                     │  │
│  │ Tap dot for details │  │
│  └─────────────────────┘  │
│                           │
│  ┌─────────────────────┐  │
│  │ Recent Activity     │  │
│  │                     │  │
│  │ 📦 SKU-015 created  │  │
│  │    by John • 2h ago │  │
│  │                     │  │
│  │ 📋 BOM v3 activated │  │
│  │    5h ago           │  │
│  │                     │  │
│  │ [View All →]        │  │
│  └─────────────────────┘  │
│                           │
│  ┌─────────────────────┐  │
│  │ Cost Trends         │  │
│  │ [Mat][Lab][Total ✓] │  │
│  │                     │  │
│  │ (Simplified chart)  │  │
│  │                     │  │
│  │ [Cost History →]    │  │
│  └─────────────────────┘  │
│                           │
│  Quick Actions:           │
│  [+ Product]              │
│  [+ BOM]                  │
│  [+ Routing]              │
│                           │
└───────────────────────────┘
```

### Loading State

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  Technical > Dashboard                                                                   │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                           │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐   │
│  │ [████████░░░░░]  │ │ [████████░░░░░]  │ │ [████████░░░░░]  │ │ [████████░░░░░]  │   │
│  │ [██████░░░░░░░]  │ │ [██████░░░░░░░]  │ │ [██████░░░░░░░]  │ │ [██████░░░░░░░]  │   │
│  │ [████░░░░░░░░░]  │ │ [████░░░░░░░░░]  │ │ [████░░░░░░░░░]  │ │ [████░░░░░░░░░]  │   │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘ └──────────────────┘   │
│                                                                                           │
│  ┌──────────────────────────────────────────┐ ┌─────────────────────────────────────┐  │
│  │ [████████████████████████████░░░░░░░░]  │ │ [████████████████████████░░░░░░░░]  │  │
│  │ [████████████░░░░░░░░░░░░░░░░░░░░░░░]  │ │ [██████████████░░░░░░░░░░░░░░░░░]  │  │
│  │ [██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  │ │ [████████░░░░░░░░░░░░░░░░░░░░░░░]  │  │
│  └──────────────────────────────────────────┘ └─────────────────────────────────────┘  │
│                                                                                           │
│  ┌──────────────────────────────────────────┐ ┌─────────────────────────────────────┐  │
│  │ [████████████████████████████░░░░░░░░]  │ │ [████████████████████████░░░░░░░░]  │  │
│  │ [████████████░░░░░░░░░░░░░░░░░░░░░░░]  │ │ [██████████████░░░░░░░░░░░░░░░░░]  │  │
│  └──────────────────────────────────────────┘ └─────────────────────────────────────┘  │
│                                                                                           │
│  Loading dashboard data...                                                               │
│                                                                                           │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### Empty State

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  Technical > Dashboard                                                                   │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                           │
│                                    [🏭 Icon]                                             │
│                                                                                           │
│                              Welcome to Technical Module                                 │
│                                                                                           │
│                No data yet. Start by creating products, BOMs, and routings.              │
│                                                                                           │
│                                                                                           │
│                          [+ Create Your First Product]                                   │
│                                                                                           │
│                                 [+ Create First BOM]                                     │
│                                                                                           │
│                               [+ Create First Routing]                                   │
│                                                                                           │
│                                                                                           │
│             Quick Tip: Products are the foundation. Start there, then add BOMs.          │
│                                                                                           │
│                          [📖 View Getting Started Guide]                                 │
│                                                                                           │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### Error State

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  Technical > Dashboard                                                                   │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                           │
│                                    [⚠ Icon]                                              │
│                                                                                           │
│                             Failed to Load Dashboard Data                                │
│                                                                                           │
│                  Unable to retrieve dashboard statistics. Please try again.              │
│                            Error: DASHBOARD_FETCH_FAILED                                 │
│                                                                                           │
│                                                                                           │
│                          [Retry]    [Contact Support]                                    │
│                                                                                           │
│                                                                                           │
│  Quick Actions (still available):                                                        │
│  [+ New Product] [+ New BOM] [+ New Routing]                                            │
│                                                                                           │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Components

1. **Stats Cards (4 cards)** - Material Design elevated cards with click-to-navigate
   - **Products Card**: Total count, Active/Inactive breakdown, click → TEC-001
   - **BOMs Card**: Total count, Active/Phased breakdown, click → TEC-005
   - **Routings Card**: Total count, Reusable count, click → TEC-007
   - **Avg Cost Card**: Average product cost with trend icon (↑↓), click → TEC-015

2. **Allergen Matrix Panel** - Heatmap visualization
   - Products (rows) x Allergens (columns)
   - Color-coded cells: 🔴 Contains, 🟡 May Contain, 🟢 Free From
   - Product Type filter dropdown
   - Export to PDF button
   - Click cell → TEC-010 (Allergen Management)

3. **BOM Version Timeline Panel** - Horizontal timeline
   - Dots represent BOM version changes
   - Last 6 months displayed
   - Product filter dropdown
   - Hover: Tooltip with version details (product, version, date, changed_by)
   - Click dot → TEC-006 (BOM detail page)

4. **Recent Activity Panel** - Activity log (last 10 items)
   - Icon + Description + User + Timestamp
   - Activity types: Product created/updated, BOM activated, Routing updated
   - Click row → Navigate to respective detail page
   - "View All Activity" link

5. **Cost Trends Panel** - Line chart
   - Average product cost over last 6 months
   - Toggle buttons: Material / Labor / Overhead / Total
   - Y-axis: Cost (PLN), X-axis: Months
   - Click chart → TEC-015 (Cost History page)

6. **Quick Actions** - Floating action buttons (bottom of page)
   - [+ New Product] → TEC-002 (Create Product modal)
   - [+ New BOM] → TEC-006 (Create BOM modal)
   - [+ New Routing] → TEC-008 (Create Routing modal)

---

## Main Actions

### Primary
- **Stats Card Click** - Navigate to respective list page (Products/BOMs/Routings)
- **Avg Cost Card Click** - Navigate to TEC-015 (Cost History)

### Secondary
- **Allergen Matrix Cell Click** - Opens TEC-010 (Allergen Management) for that product
- **Export PDF (Allergen Matrix)** - Downloads allergen matrix as PDF report
- **Timeline Dot Click** - Opens TEC-006 (BOM detail) for that version
- **Recent Activity Row Click** - Navigates to detail page (product/BOM/routing)
- **Cost Trends Click** - Navigate to TEC-015 (Cost History)

### Quick Actions
- **[+ New Product]** - Opens TEC-002 (Create Product modal)
- **[+ New BOM]** - Opens TEC-006 (Create BOM modal)
- **[+ New Routing]** - Opens TEC-008 (Create Routing modal)

### Filters
- **Allergen Matrix Product Type Filter** - Dropdown: All, Raw Material, WIP, Finished Goods, Packaging
- **BOM Timeline Product Filter** - Dropdown: All Products, or specific product

---

## States

- **Loading**: Skeleton cards + skeleton charts, "Loading dashboard data..." text
- **Success**: Populated cards, allergen matrix, timeline, activity log, cost chart
- **Empty**: "No data yet" message, Quick actions to create first product/BOM/routing, Getting Started Guide link
- **Error**: "Failed to load dashboard data" warning, Retry + Contact Support buttons, Quick actions still available

---

## Data Fields

### Stats Cards

| Field | Source | Calculation | Display |
|-------|--------|-------------|---------|
| total_products | products table | COUNT(*) WHERE org_id = X | "247" |
| active_products | products table | COUNT(*) WHERE status = 'active' | "✓ Active: 215" |
| inactive_products | products table | COUNT(*) WHERE status = 'inactive' | "○ Inactive: 32" |
| total_boms | boms table | COUNT(*) WHERE org_id = X | "183" |
| active_boms | boms table | COUNT(*) WHERE status = 'active' | "✓ Active: 156" |
| phased_boms | boms table | COUNT(*) WHERE effective_to < NOW() | "○ Phased: 27" |
| total_routings | routings table | COUNT(*) WHERE org_id = X | "45" |
| reusable_routings | routings table | COUNT(*) WHERE is_reusable = true | "✓ Reusable: 32" |
| avg_cost | product_costs table | AVG(total_cost) WHERE cost_type = 'standard' | "125.50 PLN" |
| cost_trend | product_costs table | Compare current month vs previous month | "↑ +5.2%" |

### Allergen Matrix

| Field | Source | Notes |
|-------|--------|-------|
| product_code | products table | Row identifier |
| product_name | products table | Row label (truncated if >20 chars) |
| allergen_relation | product_allergens table | 'contains' → 🔴, 'may_contain' → 🟡, NULL → 🟢 |

### BOM Timeline

| Field | Source | Display |
|-------|--------|---------|
| bom_version | boms table | Dot on timeline |
| effective_from | boms table | X-axis position (month) |
| product_name | products table | Label below dot (on hover) |
| version | boms table | "v5" |
| changed_by | users table | User name in tooltip |
| changed_at | boms.created_at | Timestamp in tooltip |

### Recent Activity

| Field | Source | Display |
|-------|--------|---------|
| activity_type | Derived | Icon (📦/📋/🔧) |
| description | Composite | "Product SKU-015 created" |
| user_name | users table | "by John Doe" |
| timestamp | various created_at/updated_at | "2 hours ago" (relative time) |

### Cost Trends

| Field | Source | Display |
|-------|--------|---------|
| month | product_costs.effective_from | X-axis (Nov, Dec, Jan...) |
| avg_cost | product_costs table | Y-axis (PLN) |
| material_cost | product_costs.material_cost | Line (if toggle selected) |
| labor_cost | product_costs.labor_cost | Line (if toggle selected) |
| overhead_cost | product_costs.overhead_cost | Line (if toggle selected) |
| total_cost | product_costs.total_cost | Line (default selected) |

---

## API Endpoints

### Stats Cards
```
GET /api/technical/dashboard/stats
Response:
{
  "products": {
    "total": 247,
    "active": 215,
    "inactive": 32
  },
  "boms": {
    "total": 183,
    "active": 156,
    "phased": 27
  },
  "routings": {
    "total": 45,
    "reusable": 32
  },
  "avg_cost": {
    "value": 125.50,
    "currency": "PLN",
    "trend_percent": 5.2,
    "trend_direction": "up"
  }
}
```

### Allergen Matrix
```
GET /api/technical/dashboard/allergen-matrix?product_type={type}
Response:
{
  "allergens": [
    { "id": "uuid-1", "code": "gluten", "name": "Gluten" },
    { "id": "uuid-2", "code": "dairy", "name": "Dairy" },
    ...
  ],
  "products": [
    {
      "id": "uuid-p1",
      "code": "SKU-001",
      "name": "Wheat Flour",
      "allergen_relations": {
        "uuid-1": "contains",  // Gluten
        "uuid-2": null,        // Dairy (free from)
        ...
      }
    },
    ...
  ]
}
```

### BOM Version Timeline
```
GET /api/technical/dashboard/bom-timeline?product_id={id}&months=6&limit=50
Response:
{
  "timeline": [
    {
      "bom_id": "uuid-1",
      "product_id": "uuid-p1",
      "product_code": "SKU-002",
      "product_name": "Wheat Bread",
      "version": 5,
      "effective_from": "2025-03-15",
      "changed_by": "uuid-u1",
      "changed_by_name": "John Doe",
      "changed_at": "2025-03-15T10:30:00Z"
    },
    ...
  ],
  "limit_reached": false
}
```

### Recent Activity
```
GET /api/technical/dashboard/recent-activity?limit=10
Response:
{
  "activities": [
    {
      "id": "uuid-1",
      "type": "product_created",
      "entity_type": "product",
      "entity_id": "uuid-p15",
      "description": "Product SKU-015 created",
      "user_id": "uuid-u1",
      "user_name": "John Doe",
      "timestamp": "2025-12-14T08:30:00Z",
      "relative_time": "2 hours ago",
      "link": "/technical/products/uuid-p15"
    },
    ...
  ]
}
```

### Cost Trends
```
GET /api/technical/dashboard/cost-trends?months=6
Response:
{
  "months": ["2025-07", "2025-08", "2025-09", "2025-10", "2025-11", "2025-12"],
  "data": [
    {
      "month": "2025-07",
      "material_cost": 80.50,
      "labor_cost": 30.00,
      "overhead_cost": 15.00,
      "total_cost": 125.50
    },
    ...
  ],
  "currency": "PLN"
}
```

---

## Permissions

| Role | View Dashboard | Export PDF | Quick Actions |
|------|----------------|------------|---------------|
| Admin | Yes | Yes | All (Product/BOM/Routing) |
| Production Manager | Yes | Yes | All |
| Operator | Yes | No | None |
| Viewer | Yes | No | None |

---

## Validation

- **Product Type Filter**: Validate enum value (all, raw_material, wip, finished_goods, packaging)
- **BOM Timeline Product Filter**: Validate product_id exists in org
- **Cost Trends Months**: Validate months parameter (1-12), default = 6
- **Recent Activity Limit**: Validate limit (1-100), default = 10

---

## Business Rules

### Stats Cards
- **Real-time Updates**: Stats auto-refresh every 60 seconds (or on data change via WebSocket)
- **Trend Calculation**: Compare current month avg cost vs previous month avg cost
- **Phased BOMs**: effective_to < current_date

### Allergen Matrix
- **Product Filtering**: Show only products with at least one allergen declaration
- **Max Products**: Display max 50 products at once (pagination or scrolling)
- **Cell Colors**: 🔴 Contains (#EF4444), 🟡 May Contain (#FBBF24), 🟢 Free From (#10B981)

### BOM Timeline
- **Max Changes**: Show last 50 BOM version changes
- **Date Range**: Default last 6 months, adjustable to 12 months
- **Timeline Resolution**: Monthly (group dots by month if >1 per month)

### Recent Activity
- **Activity Types**: product_created, product_updated, product_status_changed, bom_created, bom_activated, routing_created, routing_updated
- **Max Items**: Last 10 activities only
- **Relative Time**: "2 hours ago", "1 day ago", "5 days ago", ">7 days" shows date

### Cost Trends
- **Default View**: Total cost selected by default
- **Toggle Behavior**: Multiple toggles can be active simultaneously (stacked lines)
- **Data Points**: One data point per month (average of all products)

---

## Accessibility

- **Touch targets**: All cards, buttons, chart elements >= 48x48dp
- **Contrast**:
  - Card text: 4.5:1 minimum
  - Chart lines: 3:1 minimum (thick lines)
  - Heatmap colors: Pass WCAG AA for red/yellow/green
- **Screen reader**:
  - Stats cards: "Products card: 247 total, 215 active, 32 inactive, click to view all products"
  - Allergen matrix: "Allergen matrix: SKU-001 Wheat Flour, Gluten: Contains, Dairy: Free From..."
  - Timeline: "BOM version timeline: Wheat Bread version 5, March 15th, click for details"
- **Keyboard**:
  - Tab navigation through all cards and panels
  - Enter to activate card click or chart click
  - Arrow keys for timeline navigation
- **ARIA**:
  - Cards: role="region" aria-label="Products statistics"
  - Chart: role="img" aria-label="Cost trends chart, last 6 months"
  - Matrix: role="grid" with proper row/column headers
  - Timeline: role="list" with list items

---

## Responsive Breakpoints

| Breakpoint | Layout | Notes |
|------------|--------|-------|
| **Desktop (>1024px)** | 2x2 grid cards + 2 columns panels | Full dashboard |
| **Tablet (768-1024px)** | 2x2 grid cards + 1 column panels | Panels stack vertically |
| **Mobile (<768px)** | 1 column, all stacked | Cards stack, matrix/timeline scrollable |

### Responsive Adjustments

#### Desktop (>1024px)
- Stats cards: 4 cards in 1 row (25% width each)
- Allergen matrix: Left panel (60% width)
- BOM timeline: Right panel (40% width)
- Recent activity: Bottom left (60% width)
- Cost trends: Bottom right (40% width)

#### Tablet (768-1024px)
- Stats cards: 2x2 grid (50% width each)
- All panels: Full width (100%), stack vertically
- Allergen matrix: Horizontal scroll for allergens
- Timeline: Horizontal scroll if >6 months

#### Mobile (<768px)
- Stats cards: Stack vertically (100% width each)
- All panels: Full width, stack vertically
- Allergen matrix: Scroll both axes, abbreviated column headers ("Glu", "Dairy")
- Timeline: Vertical layout (list instead of timeline)
- Quick actions: Stack vertically, full width buttons

---

## Performance Notes

### Query Optimization
- **Stats Cards**: Single query with multiple COUNT aggregations (index on org_id, status)
- **Allergen Matrix**: JOIN products + product_allergens (index on product_id, allergen_id)
- **BOM Timeline**: Index on (org_id, effective_from DESC), LIMIT 50
- **Recent Activity**: Materialized view or denormalized table for fast queries
- **Cost Trends**: Pre-aggregated monthly averages (cron job or trigger)

### Caching Strategy
```typescript
// Redis keys
'org:{orgId}:dashboard:stats'            // 1 min TTL
'org:{orgId}:dashboard:allergen-matrix'  // 10 min TTL
'org:{orgId}:dashboard:bom-timeline'     // 5 min TTL
'org:{orgId}:dashboard:recent-activity'  // 30 sec TTL
'org:{orgId}:dashboard:cost-trends'      // 5 min TTL
```

### Load Time Targets
- **Initial Load (stats only)**: <500ms
- **Allergen Matrix**: <1s (for 50 products x 10 allergens)
- **BOM Timeline**: <800ms (50 changes)
- **Recent Activity**: <300ms (10 items)
- **Cost Trends**: <500ms (6 months, pre-aggregated)

### Lazy Loading
- Use IntersectionObserver for panels below fold
- Load stats cards immediately (above fold)
- Lazy load allergen matrix, timeline, activity, cost trends on scroll

### Real-time Updates (Optional)
- **WebSocket Subscription**: Subscribe to `technical:org:{orgId}:dashboard` channel
- **Events**: product.created, product.updated, bom.activated, routing.created
- **Auto-refresh**: Update stats cards and recent activity on event (no full reload)

---

## Chart Library Recommendations

1. **Recharts** (Preferred)
   - Pros: React-native, responsive, composable, TypeScript support
   - Use for: Cost Trends line chart
   - Accessibility: Good ARIA support, keyboard navigation

2. **Chart.js** (Alternative)
   - Pros: Lightweight, well-documented, canvas-based
   - Use for: Cost Trends (if Recharts not available)
   - Accessibility: Requires custom ARIA labels

3. **D3.js** (Advanced)
   - Pros: Maximum flexibility, powerful
   - Use for: BOM Timeline (custom timeline visualization)
   - Cons: Steeper learning curve

**Recommendation**: Use Recharts for Cost Trends, custom React component for BOM Timeline (simple dots + lines)

---

## Visual Design

### Card Styling (Material Design)
- **Elevation**: 2dp (subtle shadow)
- **Border Radius**: 8px
- **Padding**: 16px
- **Background**: White (#FFFFFF)
- **Hover**: Elevation increases to 4dp, cursor pointer

### Color Palette
- **Primary Blue**: #3B82F6 (links, active elements)
- **Success Green**: #10B981 (Active status, Free From)
- **Warning Yellow**: #FBBF24 (May Contain)
- **Danger Red**: #EF4444 (Contains, Discontinued)
- **Gray Neutral**: #6B7280 (Inactive status)

### Icons (Lucide React)
- **Products**: 📦 `<Package />`
- **BOMs**: 📋 `<ClipboardList />`
- **Routings**: 🔧 `<Settings />`
- **Cost**: 💰 `<DollarSign />` or `<TrendingUp />`
- **Activity Icons**: `<Package />`, `<ClipboardList />`, `<Settings />`
- **Empty State**: `<Factory />` or `<Boxes />`
- **Error State**: `<AlertTriangle />`

### Typography
- **Card Titles**: 14px, font-weight: 500, color: #111827
- **Card Values**: 28px, font-weight: 700, color: #111827
- **Card Subtext**: 12px, font-weight: 400, color: #6B7280
- **Panel Titles**: 16px, font-weight: 600, color: #111827

---

## Integration Notes

### Module Dependencies
- **Settings Module**: Allergens master data, organizations (org_id)
- **Products**: All product data (code, name, type, status)
- **BOMs**: BOM versions, effective dates
- **Routings**: Routing counts, reusability
- **Costing**: product_costs table for trends and avg cost

### Event Publishing
- **product.created** → Update stats, recent activity
- **bom.activated** → Update stats, timeline, recent activity
- **routing.created** → Update stats, recent activity
- **cost.calculated** → Update avg cost, cost trends

---

## Related Screens

- **TEC-001 (Products List)**: Navigate from Products card
- **TEC-005 (BOMs List)**: Navigate from BOMs card
- **TEC-007 (Routings List)**: Navigate from Routings card
- **TEC-010 (Allergen Management)**: Navigate from allergen matrix cell click
- **TEC-006 (BOM Detail)**: Navigate from BOM timeline dot click
- **TEC-015 (Cost History)**: Navigate from Avg Cost card or Cost Trends click
- **TEC-002 (Create Product Modal)**: Opens from [+ New Product]
- **TEC-006 (Create BOM Modal)**: Opens from [+ New BOM]
- **TEC-008 (Create Routing Modal)**: Opens from [+ New Routing]

---

## Technical Implementation Notes

### RLS (Row Level Security)
- All queries filter by `org_id` (multi-tenancy)
- Stats cards: `WHERE org_id = auth_org_id()`
- Allergen matrix: `WHERE products.org_id = auth_org_id()`
- BOM timeline: `WHERE boms.org_id = auth_org_id()`

### Database Indexes (Required)
```sql
-- Stats queries
CREATE INDEX idx_products_org_status ON products(org_id, status);
CREATE INDEX idx_boms_org_status ON boms(org_id, status);
CREATE INDEX idx_routings_org_reusable ON routings(org_id, is_reusable);

-- Allergen matrix
CREATE INDEX idx_product_allergens_product ON product_allergens(product_id, allergen_id);

-- BOM timeline
CREATE INDEX idx_boms_org_effective ON boms(org_id, effective_from DESC);

-- Cost trends
CREATE INDEX idx_product_costs_org_effective ON product_costs(org_id, effective_from DESC);
```

### PDF Export (Allergen Matrix)
- Use library: `jsPDF` or `pdfmake`
- Include: Organization logo, timestamp, product rows, allergen columns, color legend
- Orientation: Landscape (better for wide matrix)
- Filename: `allergen-matrix-{org_id}-{YYYY-MM-DD}.pdf`

### Recent Activity Implementation
Option 1: **Materialized View** (Preferred)
- Refresh every 30 seconds (CRON or trigger)
- Pre-join products, boms, routings, users

Option 2: **Event Log Table**
- Insert to `activity_log` table on create/update/delete
- Query: `SELECT * FROM activity_log WHERE org_id = X ORDER BY timestamp DESC LIMIT 10`

---

## Error Handling

### API Errors
- **Stats Fetch Failed**: Show error state, allow retry
- **Allergen Matrix Fetch Failed**: Show error in panel, rest of dashboard still works
- **BOM Timeline Fetch Failed**: Show error in panel, rest of dashboard still works
- **Cost Trends Fetch Failed**: Show error in panel, rest of dashboard still works

### Partial Failures
- If one panel fails, other panels continue to load
- Each panel has independent error boundary
- User can retry failed panels individually

### Network Timeout
- Stats: 5s timeout
- Allergen matrix: 10s timeout (larger dataset)
- BOM timeline: 5s timeout
- Recent activity: 3s timeout
- Cost trends: 5s timeout

---

## Testing Requirements

### Unit Tests
- Stats calculation logic (counts, averages, trends)
- Allergen relation mapping (contains/may_contain → colors)
- BOM timeline date grouping (monthly)
- Cost trend data aggregation
- Relative time formatting ("2 hours ago")

### Integration Tests
- API endpoint coverage (all 5 endpoints)
- RLS policy enforcement (org isolation)
- Cache invalidation on data changes
- PDF export generation

### E2E Tests
- Dashboard load on first visit (empty state)
- Dashboard load with data (success state)
- Click stats card → navigate to list page
- Click allergen matrix cell → open allergen management modal
- Click BOM timeline dot → navigate to BOM detail
- Click cost trends → navigate to cost history
- Quick actions → open create modals
- Export allergen matrix to PDF
- Responsive behavior (desktop/tablet/mobile)

### Performance Tests
- Load time <500ms for stats cards (100 products)
- Load time <1s for allergen matrix (50 products x 10 allergens)
- Load time <800ms for BOM timeline (50 changes)
- Load time <300ms for recent activity (10 items)
- Load time <500ms for cost trends (6 months)

---

## Quality Gates

Before handoff to FRONTEND-DEV:
- [ ] All 4 states defined (Loading, Empty, Error, Success)
- [ ] Responsive breakpoints documented (Desktop/Tablet/Mobile)
- [ ] All API endpoints specified with request/response schemas
- [ ] Accessibility checklist passed (touch targets, contrast, screen reader, keyboard)
- [ ] Performance targets defined (load times, caching strategy)
- [ ] Chart library selected (Recharts)
- [ ] Integration points identified (Settings, Products, BOMs, Routings, Costing)
- [ ] Error handling strategy defined (partial failures)
- [ ] User approval obtained (auto-approve mode)

---

## Handoff to FRONTEND-DEV

```yaml
feature: Technical Module Dashboard
story: TEC-017
approval_status:
  mode: "auto_approve"
  user_approved: true
  screens_approved: ["TEC-017-dashboard"]
  iterations_used: 0
deliverables:
  wireframe: docs/3-ARCHITECTURE/ux/wireframes/TEC-017-dashboard.md
  api_endpoints:
    - GET /api/technical/dashboard/stats
    - GET /api/technical/dashboard/allergen-matrix
    - GET /api/technical/dashboard/bom-timeline
    - GET /api/technical/dashboard/recent-activity
    - GET /api/technical/dashboard/cost-trends
states_per_screen: [loading, empty, error, success]
breakpoints:
  mobile: "<768px (1 column, stack all)"
  tablet: "768-1024px (2x2 cards, panels stack)"
  desktop: ">1024px (2x2 cards, 2-column panels)"
accessibility:
  touch_targets: "48x48dp minimum"
  contrast: "4.5:1 minimum (text), 3:1 (charts)"
  aria_roles: "region, grid, list, img"
  keyboard_nav: "Tab, Enter, Arrow keys"
chart_library: "Recharts (React-native)"
performance_targets:
  stats_load: "<500ms"
  allergen_matrix_load: "<1s"
  bom_timeline_load: "<800ms"
  recent_activity_load: "<300ms"
  cost_trends_load: "<500ms"
cache_ttl:
  stats: "1min"
  allergen_matrix: "10min"
  bom_timeline: "5min"
  recent_activity: "30sec"
  cost_trends: "5min"
```

---

**Status**: Auto-Approved
**Approval Mode**: auto_approve
**User Approved**: true (explicit opt-in)
**Iterations**: 0 of 3
**Estimated Effort**: 8-10 hours (complex dashboard with multiple widgets)
**Quality Target**: 98/100
