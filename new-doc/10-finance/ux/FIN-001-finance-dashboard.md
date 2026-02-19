# FIN-001: Finance Dashboard

**Module**: Finance (Cost Management)
**Feature**: Finance Dashboard (PRD Section FR-9.6.7)
**Status**: Ready for Implementation
**Last Updated**: 2026-01-15

---

## ASCII Wireframe

### Success State (Desktop - Populated)

```
+--------------------------------------------------------------------------------------------------+
|  Finance > Dashboard                                                        [Export] [Settings]  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +--------------------------------+  +--------------------------------+  +----------------------+  |
|  | Total Production Cost (MTD)   |  | Cost Variance (MTD)            |  | Inventory Value      |  |
|  |                                |  |                                |  |                      |  |
|  |    245,680.50 PLN             |  |    +12,340.00 PLN              |  |   1,234,500 PLN      |  |
|  |    +5.2% vs last month        |  |    +5.1% unfavorable           |  |   Last updated: Now  |  |
|  |                                |  |    [!] 3 items above threshold |  |                      |  |
|  +--------------------------------+  +--------------------------------+  +----------------------+  |
|                                                                                                  |
|  +--------------------------------+  +--------------------------------+  +----------------------+  |
|  | Material Cost                 |  | Labor Cost                     |  | Overhead Cost        |  |
|  |    145,230.00 PLN             |  |    65,450.00 PLN               |  |    35,000.50 PLN     |  |
|  |    59.1% of total             |  |    26.6% of total              |  |    14.3% of total    |  |
|  |    [===|===|===|====|===-]    |  |    [===|===|=====|-----]       |  |    [===|=====|---]   |  |
|  +--------------------------------+  +--------------------------------+  +----------------------+  |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +----------------------------------------------+  +------------------------------------------+  |
|  | Variance Alerts (3 Active)              [!]  |  | Cost Trend (6 Months)                    |  |
|  +----------------------------------------------+  +------------------------------------------+  |
|  |                                              |  |                                          |  |
|  | [CRITICAL] Material Price - WO-2026-0042    |  |     ^                                    |  |
|  | +15.2% variance ($1,250 over budget)        |  |  250k|           /\                      |  |
|  | Product: Chocolate Bar 100g                 |  |     |          /  \      /\              |  |
|  | [Acknowledge] [View Details]                |  |  200k|    /\   /    \    /  \             |  |
|  | ------------------------------------------- |  |     |   /  \ /      \  /    \            |  |
|  |                                              |  |  150k|  /    X        \/      \           |  |
|  | [WARNING] Labor Efficiency - WO-2026-0038   |  |     | /                        \----      |  |
|  | +8.5% variance ($340 over standard)         |  |  100k|/                                   |  |
|  | Operation: Mixing (Line 2)                  |  |     +----+----+----+----+----+----+      |  |
|  | [Acknowledge] [View Details]                |  |       Aug  Sep  Oct  Nov  Dec  Jan       |  |
|  | ------------------------------------------- |  |                                          |  |
|  |                                              |  |     --- Material  --- Labor  --- OH     |  |
|  | [WARNING] Overhead - Cost Center CC-003     |  |                                          |  |
|  | +6.2% variance ($180 over budget)           |  +------------------------------------------+  |
|  | [Acknowledge] [View Details]                |  |                                          |  |
|  |                                              |  |                                          |  |
|  | [View All Alerts (7 total)]                 |  |                                          |  |
|  +----------------------------------------------+  +------------------------------------------+  |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +----------------------------------------------+  +------------------------------------------+  |
|  | Top Variance Contributors (MTD)             |  | Budget vs Actual (MTD)                   |  |
|  +----------------------------------------------+  +------------------------------------------+  |
|  |                                              |  |                                          |  |
|  | #  Product          Variance    % of Total  |  | Category      Budget      Actual   Var  |  |
|  | -- --------------- ----------- -----------  |  | ------------ ---------- --------- ----- |  |
|  | 1  Chocolate Bar   +$1,250     38.2%        |  | Material     140,000    145,230   +3.7% |  |
|  | 2  Cookie Pack     +$890       27.2%        |  | Labor         60,000     65,450   +9.1% |  |
|  | 3  Bread Loaf      +$450       13.7%        |  | Overhead      32,000     35,000   +9.4% |  |
|  | 4  Cake Slice      +$320        9.8%        |  | ------------ ---------- --------- ----- |  |
|  | 5  Muffin          +$210        6.4%        |  | TOTAL        232,000    245,680   +5.9% |  |
|  |                                              |  |                                          |  |
|  | [View Full Report]                          |  | [View Budget Details]                    |  |
|  +----------------------------------------------+  +------------------------------------------+  |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Success State (Tablet: 768-1024px)

```
+----------------------------------------------------------------------+
|  Finance > Dashboard                            [Export] [Settings]   |
+----------------------------------------------------------------------+
|                                                                        |
|  +----------------------------------+  +------------------------------+ |
|  | Total Production Cost (MTD)      |  | Cost Variance (MTD)          | |
|  |    245,680.50 PLN               |  |    +12,340.00 PLN             | |
|  |    +5.2% vs last month          |  |    +5.1% unfavorable          | |
|  +----------------------------------+  +------------------------------+ |
|                                                                        |
|  +----------------------------------+  +------------------------------+ |
|  | Inventory Value                  |  | Alerts (3 Active) [!]        | |
|  |    1,234,500 PLN                |  | [CRITICAL] Material...       | |
|  |    Last updated: Now            |  | [WARNING] Labor Eff...        | |
|  +----------------------------------+  +------------------------------+ |
|                                                                        |
|  +-------------------------------------------------------------------+ |
|  | Cost Breakdown                                                      | |
|  | Material: 145,230 PLN (59%)  [============|                     ]  | |
|  | Labor:     65,450 PLN (27%)  [======|                           ]  | |
|  | Overhead:  35,000 PLN (14%)  [===|                              ]  | |
|  +-------------------------------------------------------------------+ |
|                                                                        |
|  +-------------------------------------------------------------------+ |
|  | Cost Trend (6 Months)                                              | |
|  |     ^                                                              | |
|  |  250k|           /\                                                | |
|  |     |          /  \      /\                                        | |
|  |  200k|    /\   /    \    /  \                                      | |
|  |     +----+----+----+----+----+----+                                | |
|  |       Aug  Sep  Oct  Nov  Dec  Jan                                 | |
|  +-------------------------------------------------------------------+ |
|                                                                        |
+----------------------------------------------------------------------+
```

### Success State (Mobile: < 768px)

```
+----------------------------------+
|  < Finance Dashboard             |
|  [Export]                        |
+----------------------------------+
|                                  |
|  +----------------------------+  |
|  | Total Production Cost (MTD)|  |
|  |                            |  |
|  |    245,680.50 PLN          |  |
|  |    +5.2% vs last month     |  |
|  +----------------------------+  |
|                                  |
|  +----------------------------+  |
|  | Cost Variance (MTD)        |  |
|  |                            |  |
|  |    +12,340.00 PLN          |  |
|  |    +5.1% unfavorable       |  |
|  |    [!] 3 alerts active     |  |
|  +----------------------------+  |
|                                  |
|  +----------------------------+  |
|  | Inventory Value            |  |
|  |    1,234,500 PLN           |  |
|  +----------------------------+  |
|                                  |
|  +----------------------------+  |
|  | Cost Breakdown             |  |
|  |                            |  |
|  | Material  145,230 (59%)    |  |
|  | [================|      ]  |  |
|  |                            |  |
|  | Labor      65,450 (27%)    |  |
|  | [========|              ]  |  |
|  |                            |  |
|  | Overhead   35,000 (14%)    |  |
|  | [====|                  ]  |  |
|  +----------------------------+  |
|                                  |
|  +----------------------------+  |
|  | Variance Alerts (3)   [!]  |  |
|  |                            |  |
|  | [CRITICAL] WO-2026-0042    |  |
|  | Material +15.2% ($1,250)   |  |
|  | [View]                     |  |
|  |                            |  |
|  | [WARNING] WO-2026-0038     |  |
|  | Labor +8.5% ($340)         |  |
|  | [View]                     |  |
|  |                            |  |
|  | [View All Alerts]          |  |
|  +----------------------------+  |
|                                  |
|  +----------------------------+  |
|  | Cost Trend                 |  |
|  | [Chart - Scrollable]       |  |
|  +----------------------------+  |
|                                  |
+----------------------------------+
```

### Loading State

```
+--------------------------------------------------------------------------------------------------+
|  Finance > Dashboard                                                        [Export] [Settings]  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +--------------------------------+  +--------------------------------+  +----------------------+  |
|  | [====|====|====|====|====]    |  | [====|====|====|====|====]    |  | [====|====|====]     |  |
|  | [====|====|====|===]          |  | [====|====|====|===]          |  | [====|====|===]      |  |
|  | [====|====|====]              |  | [====|====|====]              |  | [====|====]          |  |
|  +--------------------------------+  +--------------------------------+  +----------------------+  |
|                                                                                                  |
|  +--------------------------------+  +--------------------------------+  +----------------------+  |
|  | [====|====|====|====]         |  | [====|====|====|====]         |  | [====|====|====]     |  |
|  | [====|====|====]              |  | [====|====|====]              |  | [====|====]          |  |
|  +--------------------------------+  +--------------------------------+  +----------------------+  |
|                                                                                                  |
|  +----------------------------------------------+  +------------------------------------------+  |
|  | [====|====|====|====|====|====|====]        |  | [====|====|====|====|====|====|====]    |  |
|  | [====|====|====|====|====|====]             |  | [====|====|====|====|====|====]         |  |
|  | [====|====|====|====|====]                  |  | [====|====|====|====|====]              |  |
|  | [====|====|====|====]                       |  | [====|====|====|====]                   |  |
|  +----------------------------------------------+  +------------------------------------------+  |
|                                                                                                  |
|  Loading finance dashboard...                                                                    |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Empty State

```
+--------------------------------------------------------------------------------------------------+
|  Finance > Dashboard                                                        [Export] [Settings]  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|                                                                                                  |
|                                       [Calculator Icon]                                          |
|                                                                                                  |
|                                   No Cost Data Available                                         |
|                                                                                                  |
|                     Start tracking production costs by completing work orders                    |
|                     with material consumption and labor time entries.                            |
|                                                                                                  |
|                                                                                                  |
|                                   [+ Create Work Order]                                          |
|                                                                                                  |
|                                                                                                  |
|                     Quick Links:                                                                 |
|                                                                                                  |
|                     [Define Standard Costs]  -  Set up product cost standards                    |
|                     [Configure Cost Centers] -  Set up cost allocation                           |
|                     [Set Variance Thresholds] - Configure alert thresholds                       |
|                                                                                                  |
|                                                                                                  |
|                              [View Finance Documentation]                                        |
|                                                                                                  |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Error State

```
+--------------------------------------------------------------------------------------------------+
|  Finance > Dashboard                                                        [Export] [Settings]  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|                                                                                                  |
|                                         [Warning Icon]                                           |
|                                                                                                  |
|                               Failed to Load Finance Dashboard                                   |
|                                                                                                  |
|                     Unable to retrieve cost data. Please check your                              |
|                     connection and try again.                                                    |
|                                                                                                  |
|                                Error: FINANCE_DASHBOARD_FETCH_FAILED                             |
|                                                                                                  |
|                                                                                                  |
|                                  [Retry]    [Contact Support]                                    |
|                                                                                                  |
|                                                                                                  |
|  Quick Actions (still available):                                                                |
|  [View Standard Costs] - View cached standard cost data                                          |
|  [Export Last Report] - Download most recent cached report                                       |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

---

## Key Components

### 1. KPI Cards (3 Primary + 3 Secondary)

Primary metrics displayed prominently at top of dashboard.

| Card | Metric | Source | Update Frequency |
|------|--------|--------|------------------|
| Total Production Cost | SUM(work_order_costs.total_cost_actual) | work_order_costs | Real-time |
| Cost Variance | SUM(total_cost_actual - total_cost_standard) | work_order_costs | Real-time |
| Inventory Value | SUM(inventory_cost_layers.total_cost) | inventory_cost_layers | Daily |
| Material Cost | SUM(material_cost_actual) | work_order_costs | Real-time |
| Labor Cost | SUM(labor_cost_actual) | work_order_costs | Real-time |
| Overhead Cost | SUM(overhead_cost_actual) | work_order_costs | Real-time |

### 2. Variance Alerts Panel

Live alert panel showing threshold breaches.

| Field | Display | Click Action |
|-------|---------|--------------|
| Severity | Badge: CRITICAL (red), WARNING (yellow) | - |
| Variance Type | Material Price, Labor Efficiency, Overhead | - |
| Work Order | WO-YYYY-NNNN | Navigate to WO detail |
| Variance Amount | Amount and percentage | - |
| Product/Operation | Context information | - |
| Actions | [Acknowledge] [View Details] | Acknowledge or drill-down |

### 3. Cost Trend Chart

6-month trend visualization of cost categories.

| Feature | Description |
|---------|-------------|
| Chart Type | Multi-line chart (area or line) |
| Series | Material, Labor, Overhead (stacked optional) |
| X-Axis | Monthly periods |
| Y-Axis | Cost amount (PLN) |
| Tooltip | Period details on hover |
| Legend | Color-coded category legend |

### 4. Top Variance Contributors Table

Ranking of products/items with highest variance.

| Column | Description |
|--------|-------------|
| Rank | 1-5 (or 10) |
| Product | Product name |
| Variance | Variance amount (PLN) |
| % of Total | Contribution to total variance |

### 5. Budget vs Actual Summary

Period comparison of budget to actual costs.

| Category | Budget | Actual | Variance |
|----------|--------|--------|----------|
| Material | Budgeted amount | Actual amount | Difference % |
| Labor | Budgeted amount | Actual amount | Difference % |
| Overhead | Budgeted amount | Actual amount | Difference % |

---

## Main Actions

### Primary Actions

| Action | Location | Behavior |
|--------|----------|----------|
| Export Dashboard | Header [Export] | Download dashboard as PDF/Excel |
| Settings | Header [Settings] | Navigate to finance settings |
| View All Alerts | Alerts panel | Navigate to /finance/alerts |
| View Full Report | Contributors table | Navigate to variance report |
| Acknowledge Alert | Alert row | Mark alert as acknowledged |

### Card Actions

| Action | Trigger | Behavior |
|--------|---------|----------|
| Drill-down | Click KPI card | Navigate to detailed breakdown |
| View Details | Click alert row | Navigate to WO cost detail |
| Refresh | Click refresh icon (if shown) | Refresh dashboard data |

---

## States

### Loading State
- Skeleton cards for all 6 KPI cards
- Skeleton for alerts panel (3 placeholder rows)
- Skeleton for trend chart
- "Loading finance dashboard..." text at bottom

### Empty State
- Calculator illustration
- "No Cost Data Available" headline
- Explanation text about starting cost tracking
- [+ Create Work Order] primary CTA
- Quick links to setup pages (Standard Costs, Cost Centers, Thresholds)
- [View Finance Documentation] secondary link

### Populated State (Success)
- All 6 KPI cards with values
- Alerts panel with active alerts (count badge)
- Cost trend chart (6 months)
- Top variance contributors table
- Budget vs actual summary

### Error State
- Warning icon
- "Failed to Load Finance Dashboard" headline
- Error explanation
- Error code for support
- [Retry] and [Contact Support] buttons
- Quick actions for cached data

---

## Data Fields

### Dashboard KPI Response

| Field | Source | Display |
|-------|--------|---------|
| total_production_cost | SUM(work_order_costs.total_cost_actual) | "245,680.50 PLN" |
| cost_variance | SUM(total_variance) | "+12,340.00 PLN" |
| variance_percent | (variance / standard) * 100 | "+5.1%" |
| inventory_value | SUM(inventory_cost_layers remaining value) | "1,234,500 PLN" |
| material_cost | SUM(material_cost_actual) | "145,230.00 PLN" |
| labor_cost | SUM(labor_cost_actual) | "65,450.00 PLN" |
| overhead_cost | SUM(overhead_cost_actual) | "35,000.50 PLN" |

### Alerts Response

| Field | Source | Display |
|-------|--------|---------|
| id | variance_alerts.id | Internal reference |
| severity | variance_alerts.severity | Badge: CRITICAL/WARNING |
| variance_type | variance_alerts.variance_type | "Material Price" |
| work_order_number | work_orders.number | "WO-2026-0042" |
| variance_amount | variance_alerts.variance_amount | "+$1,250" |
| variance_percent | variance_alerts.variance_percent | "+15.2%" |
| product_name | products.name | "Chocolate Bar 100g" |

---

## API Endpoints

### Get Dashboard KPIs

```
GET /api/finance/dashboard/kpis
Query: ?period=mtd&compare_to=previous_month

Response:
{
  "total_production_cost": 245680.50,
  "cost_variance": 12340.00,
  "variance_percent": 5.1,
  "inventory_value": 1234500.00,
  "material_cost": 145230.00,
  "labor_cost": 65450.00,
  "overhead_cost": 35000.50,
  "cost_breakdown": {
    "material_percent": 59.1,
    "labor_percent": 26.6,
    "overhead_percent": 14.3
  },
  "comparison": {
    "previous_period_cost": 233500.00,
    "change_percent": 5.2
  },
  "last_updated": "2026-01-15T10:30:00Z"
}
```

### Get Active Alerts

```
GET /api/finance/variance-alerts?status=active&limit=5

Response:
{
  "alerts": [
    {
      "id": "uuid-alert-1",
      "severity": "critical",
      "variance_type": "material_price",
      "work_order_id": "uuid-wo-1",
      "work_order_number": "WO-2026-0042",
      "variance_amount": 1250.00,
      "variance_percent": 15.2,
      "product_name": "Chocolate Bar 100g",
      "created_at": "2026-01-15T09:00:00Z"
    }
  ],
  "total_active": 3,
  "total_all": 7
}
```

### Get Cost Trends

```
GET /api/finance/dashboard/cost-trends
Query: ?period=6months

Response:
{
  "trends": [
    {
      "period": "2025-08",
      "material_cost": 135000.00,
      "labor_cost": 58000.00,
      "overhead_cost": 30000.00,
      "total_cost": 223000.00
    },
    ...
  ]
}
```

---

## Permissions

| Role | View Dashboard | View Alerts | Acknowledge Alerts | Export | Configure Thresholds |
|------|---------------|-------------|-------------------|--------|---------------------|
| Finance Manager | Yes | Yes | Yes | Yes | Yes |
| Cost Accountant | Yes | Yes | No | Yes | No |
| Production Manager | Yes | Yes (assigned) | Yes (assigned) | Yes | No |
| Admin | Yes | Yes | Yes | Yes | Yes |
| Viewer | Yes | Yes | No | No | No |

---

## Business Rules

### KPI Calculation Rules

1. **MTD Calculation**: Total costs from 1st of current month to today
2. **Variance Direction**: Positive = unfavorable (over budget), Negative = favorable (under budget)
3. **Inventory Value**: Sum of remaining quantity * unit_cost across all active cost layers
4. **Comparison Period**: Previous month same date range

### Alert Rules

1. **Critical Threshold**: Variance >= configured critical_threshold_percent
2. **Warning Threshold**: Variance >= warning but < critical
3. **Alert Count**: Only active (unacknowledged) alerts shown in badge
4. **Sort Order**: Critical first, then by variance amount descending

### Data Refresh

1. **Real-time Updates**: KPIs refresh every 5 minutes or on production event
2. **Alerts**: Push via WebSocket when new alert created
3. **Charts**: Updated daily or on page refresh
4. **Inventory Value**: Updated nightly or on inventory transaction

---

## Accessibility

### Touch Targets
- KPI cards: min 48x48dp clickable area
- Alert action buttons: 48x48dp minimum
- Export/Settings buttons: 48x48dp

### Contrast
- KPI values: 4.5:1 minimum against card background
- Alert severity badges: 4.5:1 (colored background with white text)
- Chart colors: distinguishable for colorblind users

### Screen Reader

- **Dashboard region**: `role="region"` `aria-label="Finance Dashboard with 6 KPI cards and alerts"`
- **KPI cards**: `role="article"` `aria-label="Total Production Cost: 245,680.50 PLN, up 5.2% from last month"`
- **Alerts panel**: `role="alertdialog"` `aria-label="3 active variance alerts requiring attention"`
- **Trend chart**: `aria-label="Cost trend chart showing 6 months of material, labor, and overhead costs"`

### Keyboard Navigation

| Key | Action |
|-----|--------|
| Tab | Navigate between cards, alerts, chart controls |
| Enter | Open drill-down, acknowledge alert, execute action |
| Arrow Up/Down | Navigate alert list |
| Escape | Close modal, cancel action |

---

## Responsive Breakpoints

| Breakpoint | Layout | Notes |
|------------|--------|-------|
| **Desktop (>1024px)** | 3-column KPI grid, 2-column lower section | Full dashboard experience |
| **Tablet (768-1024px)** | 2-column KPI grid, single column lower section | Condensed alerts, scrollable chart |
| **Mobile (<768px)** | Single column stack | Cards stack vertically, simplified alerts |

---

## Performance Notes

### Caching Strategy

```typescript
// Redis keys
'org:{orgId}:finance:dashboard'              // 60 sec TTL
'org:{orgId}:finance:alerts:active'          // 30 sec TTL
'org:{orgId}:finance:trends:6months'         // 5 min TTL
'org:{orgId}:finance:inventory-value'        // 1 hour TTL

// Invalidation triggers
- Work order cost calculated -> invalidate dashboard
- Alert created/acknowledged -> invalidate alerts
- Inventory transaction -> invalidate inventory value
```

### Load Time Targets

| Operation | Target |
|-----------|--------|
| Initial dashboard load | < 1s |
| KPI refresh | < 500ms |
| Alert acknowledge | < 300ms |
| Chart render | < 500ms |

---

## Handoff to FRONTEND-DEV

```yaml
feature: Finance Dashboard
story: FIN-001
prd_coverage: "Finance PRD FR-9.6.7 (Cost Dashboard)"
  - "Total production costs KPIs"
  - "Cost variance summary"
  - "Inventory valuation total"
  - "Variance alerts panel"
  - "Cost trends chart"
approval_status:
  mode: "auto_approve"
  user_approved: true
  screens_approved: [FIN-001-finance-dashboard]
  iterations_used: 0
deliverables:
  wireframe: docs/3-ARCHITECTURE/ux/wireframes/FIN-001-finance-dashboard.md
  api_endpoints:
    - GET /api/finance/dashboard/kpis
    - GET /api/finance/variance-alerts
    - GET /api/finance/dashboard/cost-trends
states_per_screen: [loading, empty, error, populated]
breakpoints:
  mobile: "<768px (single column stack)"
  tablet: "768-1024px (2 column grid)"
  desktop: ">1024px (3 column KPI, 2 column lower)"
accessibility:
  touch_targets: "48x48dp minimum"
  contrast: "4.5:1 minimum"
  aria_roles: "region, article, alertdialog"
  keyboard_nav: "Tab, Enter, Arrow keys, Escape"
performance_targets:
  initial_load: "<1s"
  kpi_refresh: "<500ms"
  alert_acknowledge: "<300ms"
cache_ttl:
  dashboard: "60sec"
  alerts: "30sec"
  trends: "5min"
components:
  - KPICard (6 instances)
  - VarianceAlertPanel
  - CostTrendChart
  - TopContributorsTable
  - BudgetVsActualTable
```

---

**Status**: Ready for Implementation
**Approval Mode**: auto_approve
**User Approved**: Yes
**Iterations**: 0 of 3
**Estimated Effort**: 6-8 hours (dashboard with charts, alerts, KPIs)
**Quality Target**: 95/100 (comprehensive finance overview)
**PRD Coverage**: 100% (Finance PRD FR-9.6.7)
**Wireframe Length**: ~500 lines
