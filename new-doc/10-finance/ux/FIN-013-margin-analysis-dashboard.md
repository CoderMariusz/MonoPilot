# FIN-013: Margin Analysis Dashboard

**Module**: Finance
**Feature**: Margin Analysis Dashboard (PRD Section 9.11)
**Status**: Ready for Implementation
**Last Updated**: 2026-01-15

---

## ASCII Wireframe

### Success State (Desktop - Populated)

```
+--------------------------------------------------------------------------------------------------+
|  Finance > Margin Analysis                              Period: [Last 30 Days v]  [Export PDF]  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Summary Metrics (Current Period)                                                          |   |
|  |                                                                                            |   |
|  |  +--------------------+  +--------------------+  +--------------------+  +---------------+ |   |
|  |  | Average GM%        |  | Average Contrib %  |  | Weighted Avg GM%   |  | Total Revenue | |   |
|  |  | 42.3%              |  | 58.7%              |  | 38.9%              |  | $284,500      | |   |
|  |  | +2.1% vs prev      |  | +1.4% vs prev      |  | +0.8% vs prev      |  | +12.3%        | |   |
|  |  +--------------------+  +--------------------+  +--------------------+  +---------------+ |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +----------------------------------------------+  +-----------------------------------------+   |
|  | Product Margin Analysis                      |  | Customer Margin Analysis                |   |
|  | (Top 10 by Revenue)                          |  | (Top 10 by Revenue)                     |   |
|  +----------------------------------------------+  +-----------------------------------------+   |
|  |                                              |  |                                         |   |
|  | Product Name              GM%    Contrib %   |  | Customer Name         GM%    Revenue    |   |
|  | -------------------------------------------- |  | --------------------------------------- |   |
|  | [Organic Sourdough]       45.2%  62.3%  ▲    |  | [Whole Foods Chain]   38.5%  $45,200 ▲ |   |
|  | [Premium Burger]          38.7%  54.1%  ▼    |  | [Local Bistro Co.]    42.1%  $32,100 ▲ |   |
|  | [Vegan Nuggets]           52.3%  68.9%  ▲    |  | [Natural Grocers]     35.8%  $28,900 ▼ |   |
|  | [Keto Cookies]            41.5%  59.2%  -    |  | [Farm Market Inc.]    44.3%  $24,500 ▲ |   |
|  | [Gluten Free Pizza]       36.2%  51.7%  ▼    |  | [City Cafe Group]     39.7%  $21,800 - |   |
|  | [Classic Baguette]        48.9%  64.5%  ▲    |  | [Green Valley Co.]    46.2%  $19,300 ▲ |   |
|  | [Artisan Rolls]           43.1%  58.8%  -    |  | [Corner Deli LLC]     33.5%  $17,600 ▼ |   |
|  | [Multigrain Bread]        39.8%  55.4%  ▲    |  | [Fresh Foods Inc.]    41.8%  $15,900 ▲ |   |
|  | [Croissants]              34.5%  49.3%  ▼    |  | [Mountain Market]     37.2%  $14,200 - |   |
|  | [Ciabatta]                46.7%  63.1%  ▲    |  | [Valley Grocers]      40.1%  $12,800 ▲ |   |
|  |                                              |  |                                         |   |
|  | [View All Products (127)]                    |  | [View All Customers (43)]               |   |
|  +----------------------------------------------+  +-----------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Margin Trend (Last 12 Months)                                                             |   |
|  |                                                                                            |   |
|  |   60% |                                                                         * *  *     |   |
|  |       |                                                                   *   /   \/      |   |
|  |   50% |                                                            * *  /  *              |   |
|  |       |                                                       *  /   \/                   |   |
|  |   40% |  GM%:    ___________________________________________/____________________________  |   |
|  |       |  Contrib: - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -     |   |
|  |   30% |                                                                                    |   |
|  |       |                                                                                    |   |
|  |   20% +----------------------------------------------------------------------------->     |   |
|  |         Feb  Mar  Apr  May  Jun  Jul  Aug  Sep  Oct  Nov  Dec  Jan                       |   |
|  |         2025                                                    2026                       |   |
|  |                                                                                            |   |
|  |   Legend: ___  Gross Margin %  - - -  Contribution Margin %                              |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-----------------------------+  +----------------------------+  +---------------------------+   |
|  | Margin by Category          |  | Margin by Customer Segment |  | Low Margin Alert          |   |
|  |                             |  |                            |  |                           |   |
|  | Bakery         43.2% ▲      |  | Retail Chains    36.5% ▼   |  | 8 products below 30% GM   |   |
|  | Vegan Line     51.8% ▲      |  | Food Service     42.1% ▲   |  | 3 customers below 25% GM  |   |
|  | Premium        38.9% -      |  | Direct Consumer  48.7% ▲   |  |                           |   |
|  | Snacks         45.3% ▲      |  | Wholesale        33.2% ▼   |  | [View Details]            |   |
|  | Organic        46.7% ▲      |  | Export           39.8% -   |  |                           |   |
|  |                             |  |                            |  | Target GM: 40%+           |   |
|  | [View All Categories]       |  | [View All Segments]        |  | Target Contrib: 55%+      |   |
|  +-----------------------------+  +----------------------------+  +---------------------------+   |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Success State (Tablet: 768-1024px)

```
+----------------------------------------------------------------------+
|  Finance > Margin Analysis   Period: [Last 30 Days v]  [Export]     |
+----------------------------------------------------------------------+
|                                                                      |
|  +------------------------------------------------------------------+ |
|  | Avg GM: 42.3% (+2.1%) | Avg Contrib: 58.7% (+1.4%) | Rev: $284K | |
|  +------------------------------------------------------------------+ |
|                                                                      |
|  +------------------------------------------------------------------+ |
|  | Product Margin (Top 10)                                          | |
|  +------------------------------------------------------------------+ |
|  | Organic Sourdough        45.2%  62.3%  ▲                         | |
|  | Premium Burger           38.7%  54.1%  ▼                         | |
|  | Vegan Nuggets            52.3%  68.9%  ▲                         | |
|  | Keto Cookies             41.5%  59.2%  -                         | |
|  | Gluten Free Pizza        36.2%  51.7%  ▼                         | |
|  | [View All (127)]                                                 | |
|  +------------------------------------------------------------------+ |
|                                                                      |
|  +------------------------------------------------------------------+ |
|  | Customer Margin (Top 10)                                         | |
|  +------------------------------------------------------------------+ |
|  | Whole Foods Chain        38.5%  $45,200  ▲                       | |
|  | Local Bistro Co.         42.1%  $32,100  ▲                       | |
|  | Natural Grocers          35.8%  $28,900  ▼                       | |
|  | [View All (43)]                                                  | |
|  +------------------------------------------------------------------+ |
|                                                                      |
|  +------------------------------------------------------------------+ |
|  | Margin Trend (12 Months)                                         | |
|  | [Trend Chart - Simplified View]                                 | |
|  +------------------------------------------------------------------+ |
|                                                                      |
+----------------------------------------------------------------------+
```

### Success State (Mobile: < 768px)

```
+----------------------------------+
|  < Margin Analysis               |
|  [Last 30 Days v]                |
+----------------------------------+
|                                  |
|  Summary Metrics                 |
|  +----------------------------+  |
|  | Avg GM%        42.3%       |  |
|  |                +2.1%       |  |
|  +----------------------------+  |
|  | Avg Contrib%   58.7%       |  |
|  |                +1.4%       |  |
|  +----------------------------+  |
|  | Revenue        $284,500    |  |
|  |                +12.3%      |  |
|  +----------------------------+  |
|                                  |
|  [Products] [Customers] [Trends] |
|  ^^^^^^^^^^^^^^                  |
|                                  |
|  Product Margin (Top 10)         |
|  +----------------------------+  |
|  | Organic Sourdough          |  |
|  | GM: 45.2% | Cont: 62.3% ▲  |  |
|  +----------------------------+  |
|  | Premium Burger             |  |
|  | GM: 38.7% | Cont: 54.1% ▼  |  |
|  +----------------------------+  |
|  | Vegan Nuggets              |  |
|  | GM: 52.3% | Cont: 68.9% ▲  |  |
|  +----------------------------+  |
|  | Keto Cookies               |  |
|  | GM: 41.5% | Cont: 59.2% -  |  |
|  +----------------------------+  |
|  | Gluten Free Pizza          |  |
|  | GM: 36.2% | Cont: 51.7% ▼  |  |
|  +----------------------------+  |
|                                  |
|  [View All Products (127)]       |
|                                  |
|  Alert: 8 products below 30% GM  |
|  [View Details]                  |
|                                  |
+----------------------------------+
```

### Loading State

```
+--------------------------------------------------------------------------------------------------+
|  Finance > Margin Analysis                              Period: [Last 30 Days v]  [Export PDF]  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Summary Metrics                                                                            |   |
|  |  [░░░░░░░░░░░]  [░░░░░░░░░░░]  [░░░░░░░░░░░]  [░░░░░░░░░░░]                              |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +----------------------------------------------+  +-----------------------------------------+   |
|  | Product Margin Analysis                      |  | Customer Margin Analysis                |   |
|  | [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]      |  | [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]      |   |
|  | [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]      |  | [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]      |   |
|  | [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]      |  | [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]      |   |
|  +----------------------------------------------+  +-----------------------------------------+   |
|                                                                                                  |
|  Loading margin analysis...                                                                      |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Empty State

```
+--------------------------------------------------------------------------------------------------+
|  Finance > Margin Analysis                              Period: [Last 30 Days v]  [Export PDF]  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|                                                                                                  |
|                                         [Chart Icon]                                             |
|                                                                                                  |
|                                  No Margin Data Available                                        |
|                                                                                                  |
|                     No completed production orders or sales in selected period.                  |
|                     Margin analysis requires actual cost data from production                    |
|                     and revenue data from sales orders.                                          |
|                                                                                                  |
|                                                                                                  |
|                                    [Change Period]                                               |
|                                                                                                  |
|                                                                                                  |
|                     Next Steps:                                                                  |
|                     1. Complete production orders to capture actual costs                        |
|                     2. Create sales orders with pricing                                          |
|                     3. Margin analysis will auto-populate                                        |
|                                                                                                  |
|                              [Go to Production] [Go to Sales]                                    |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Error State

```
+--------------------------------------------------------------------------------------------------+
|  Finance > Margin Analysis                              Period: [Last 30 Days v]  [Export PDF]  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|                                                                                                  |
|                                         [Warning Icon]                                           |
|                                                                                                  |
|                               Failed to Load Margin Analysis                                     |
|                                                                                                  |
|                     Unable to calculate margin data. This may be due to missing                  |
|                     cost data or connectivity issues.                                            |
|                                                                                                  |
|                                Error: MARGIN_CALCULATION_FAILED                                  |
|                                                                                                  |
|                                                                                                  |
|                                  [Retry]    [Contact Support]                                    |
|                                                                                                  |
|                                                                                                  |
|  Troubleshooting:                                                                                |
|  - Verify cost data is available for products                                                    |
|  - Check BOM costing is up to date                                                               |
|  - Ensure sales pricing is configured                                                            |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

---

## Key Components

### 1. Summary Metrics Cards

Top-level KPIs showing current period performance.

| Metric | Calculation | Display |
|--------|-------------|---------|
| Average GM% | AVG((revenue - COGS) / revenue) × 100 | "42.3%" with trend arrow |
| Average Contrib % | AVG((revenue - variable_costs) / revenue) × 100 | "58.7%" with trend arrow |
| Weighted Avg GM% | SUM(GM × revenue) / SUM(revenue) | "38.9%" with trend arrow |
| Total Revenue | SUM(sales_revenue) | "$284,500" with % change |

**Trend Indicators:**
- Green ▲: Positive change vs previous period
- Red ▼: Negative change vs previous period
- Gray -: No significant change (<0.5%)

### 2. Product Margin Table

Top 10 products by revenue with margin metrics.

| Column | Source | Display |
|--------|--------|---------|
| Product Name | products.name | Link to product detail |
| GM% | (price - standard_cost) / price × 100 | "45.2%" |
| Contrib % | (price - variable_cost) / price × 100 | "62.3%" |
| Trend | vs previous period | ▲/▼/- icon |

**Sorting:** Default by revenue DESC, allow sort by GM%, Contrib%

### 3. Customer Margin Table

Top 10 customers by revenue with margin metrics.

| Column | Source | Display |
|--------|--------|---------|
| Customer Name | customers.name | Link to customer detail |
| GM% | Weighted avg GM% for customer orders | "38.5%" |
| Revenue | SUM(order_total) | "$45,200" |
| Trend | vs previous period | ▲/▼/- icon |

### 4. Margin Trend Chart

12-month line chart showing margin trends.

**Chart Type:** Dual-line chart
**X-Axis:** Month (last 12 months)
**Y-Axis:** Percentage (20-60%)
**Lines:**
- Solid line: Gross Margin %
- Dashed line: Contribution Margin %

**Interactions:**
- Hover tooltip: Month, GM%, Contrib%
- Click month: Drill down to month detail

### 5. Category/Segment Analysis

Margin breakdown by product category and customer segment.

**Category Card:**
- Category name
- Average GM%
- Trend indicator

**Segment Card:**
- Segment name (Retail, Food Service, etc.)
- Average GM%
- Trend indicator

### 6. Low Margin Alert

Alert box showing products/customers below target margins.

| Alert | Threshold | Action |
|-------|-----------|--------|
| Low GM Products | < 30% | Link to product list |
| Low GM Customers | < 25% | Link to customer list |
| Target GM | 40%+ | Display target |
| Target Contrib | 55%+ | Display target |

---

## Main Actions

### Primary Actions

| Action | Location | Behavior |
|--------|----------|----------|
| Change Period | Period dropdown | Reload data for selected period |
| Export PDF | Header button | Generate PDF report with all charts |
| View All Products | Product table footer | Navigate to full product margin report |
| View All Customers | Customer table footer | Navigate to full customer margin report |

### Drill-Down Actions

| Action | Trigger | Behavior |
|--------|---------|----------|
| Product Detail | Click product name | Navigate to product margin detail |
| Customer Detail | Click customer name | Navigate to customer margin detail |
| Category Detail | Click category | Filter dashboard by category |
| Month Detail | Click chart month | Show month-specific margin analysis |

### Export Actions

| Action | Format | Contents |
|--------|--------|----------|
| Export PDF | PDF | All charts, tables, summary metrics |
| Export Excel | XLSX | Raw data tables (products, customers, trends) |

---

## States

### Loading State
- Skeleton cards for summary metrics
- Skeleton tables for product/customer lists
- Skeleton chart placeholder
- "Loading margin analysis..." text

### Empty State
- Chart illustration
- "No Margin Data Available" headline
- Explanation: Requires production orders + sales
- [Change Period] button
- Next Steps guidance
- [Go to Production] [Go to Sales] CTAs

### Populated State (Success)
- All summary metrics visible
- Top 10 products/customers tables
- 12-month trend chart
- Category/segment breakdowns
- Low margin alerts if applicable

### Error State
- Warning icon
- "Failed to Load Margin Analysis" headline
- Error explanation
- Error code: MARGIN_CALCULATION_FAILED
- [Retry] and [Contact Support] buttons
- Troubleshooting tips

---

## Data Fields

### Dashboard Response

| Field | Source | Calculation |
|-------|--------|-------------|
| summary.avg_gm_pct | Orders + BOMs | AVG((price - standard_cost) / price × 100) |
| summary.avg_contrib_pct | Orders + BOMs | AVG((price - variable_cost) / price × 100) |
| summary.weighted_gm_pct | Orders + BOMs | SUM(gm × revenue) / SUM(revenue) |
| summary.total_revenue | Orders | SUM(order_total) |
| summary.gm_trend | Previous period | % change |
| products[].name | products | Product name |
| products[].gm_pct | Orders + BOMs | GM percentage |
| products[].contrib_pct | Orders + BOMs | Contribution margin % |
| products[].revenue | Orders | Total revenue |
| products[].trend | Previous period | ▲/▼/- |
| customers[].name | customers | Customer name |
| customers[].gm_pct | Orders | Weighted avg GM% |
| customers[].revenue | Orders | Total revenue |
| customers[].trend | Previous period | ▲/▼/- |
| trend[].month | Date range | Month label |
| trend[].gm_pct | Orders | Monthly GM% |
| trend[].contrib_pct | Orders | Monthly contrib% |
| categories[].name | product_categories | Category name |
| categories[].gm_pct | Orders | Avg GM% |
| segments[].name | customer_segments | Segment name |
| segments[].gm_pct | Orders | Avg GM% |
| alerts.low_gm_products | Products | Count < 30% GM |
| alerts.low_gm_customers | Customers | Count < 25% GM |

---

## API Endpoints

### Get Margin Dashboard

```
GET /api/finance/margin-analysis
Query: ?period=last_30_days&from=2025-12-01&to=2026-01-15

Response:
{
  "summary": {
    "avg_gm_pct": 42.3,
    "avg_gm_trend": 2.1,
    "avg_contrib_pct": 58.7,
    "avg_contrib_trend": 1.4,
    "weighted_gm_pct": 38.9,
    "weighted_gm_trend": 0.8,
    "total_revenue": 284500,
    "revenue_trend": 12.3
  },
  "products": [
    {
      "id": "uuid-product-1",
      "name": "Organic Sourdough",
      "gm_pct": 45.2,
      "contrib_pct": 62.3,
      "revenue": 52300,
      "trend": "up",
      "trend_pct": 3.2
    }
  ],
  "customers": [
    {
      "id": "uuid-customer-1",
      "name": "Whole Foods Chain",
      "gm_pct": 38.5,
      "revenue": 45200,
      "trend": "up",
      "trend_pct": 2.1
    }
  ],
  "trend": [
    {
      "month": "2025-02",
      "gm_pct": 38.5,
      "contrib_pct": 54.2
    }
  ],
  "categories": [
    {
      "name": "Bakery",
      "gm_pct": 43.2,
      "trend": "up"
    }
  ],
  "segments": [
    {
      "name": "Retail Chains",
      "gm_pct": 36.5,
      "trend": "down"
    }
  ],
  "alerts": {
    "low_gm_products": 8,
    "low_gm_customers": 3
  }
}
```

### Export PDF Report

```
POST /api/finance/margin-analysis/export
Content-Type: application/json

Request:
{
  "period": "last_30_days",
  "from": "2025-12-01",
  "to": "2026-01-15",
  "format": "pdf"
}

Response:
{
  "download_url": "https://storage/margin-report-2026-01-15.pdf",
  "expires_at": "2026-01-15T23:59:59Z"
}
```

---

## Permissions

| Role | View Dashboard | Export | Drill Down |
|------|---------------|--------|------------|
| Finance Manager | Yes | Yes | Yes |
| Operations Manager | Yes | No | Yes (limited) |
| Sales Manager | Yes (customers only) | No | Yes (customers) |
| Production Manager | Yes (products only) | No | Yes (products) |
| Admin | Yes | Yes | Yes |

---

## Validation

### Period Selection

| Rule | Error Message |
|------|---------------|
| Date range max 12 months | "Period cannot exceed 12 months" |
| From date < To date | "From date must be before To date" |
| Date not in future | "Cannot select future dates" |

### Data Calculations

| Rule | Behavior |
|------|----------|
| Missing cost data | Show "N/A" for GM%, exclude from averages |
| Zero revenue | Exclude from calculations |
| Negative margin | Highlight in red, include in low margin alerts |

---

## Business Rules

### Margin Calculations

**Gross Margin %:**
```
GM% = (Sales Price - Standard Cost) / Sales Price × 100

Where:
- Sales Price = customer order line item price
- Standard Cost = BOM standard cost at order date
```

**Contribution Margin %:**
```
Contrib % = (Sales Price - Variable Cost) / Sales Price × 100

Where:
- Variable Cost = material + direct labor (excludes overhead)
```

**Weighted Average GM%:**
```
Weighted GM% = SUM(GM × Revenue) / SUM(Revenue)

Gives higher weight to high-revenue products/customers
```

### Trend Calculation

```
Trend % = (Current Period - Previous Period) / Previous Period × 100

Trend Indicator:
- Up (▲): Trend % > 0.5%
- Down (▼): Trend % < -0.5%
- Neutral (-): -0.5% <= Trend % <= 0.5%
```

### Low Margin Thresholds

| Metric | Threshold | Alert Level |
|--------|-----------|-------------|
| Product GM% | < 30% | Warning (yellow) |
| Product GM% | < 20% | Critical (red) |
| Customer GM% | < 25% | Warning (yellow) |
| Customer GM% | < 15% | Critical (red) |
| Target GM% | 40%+ | Goal indicator |
| Target Contrib% | 55%+ | Goal indicator |

### Period Options

| Option | Range |
|--------|-------|
| Last 7 Days | Today - 7 days |
| Last 30 Days | Today - 30 days |
| Last 90 Days | Today - 90 days |
| This Month | 1st of month - today |
| Last Month | Full previous month |
| This Quarter | Quarter start - today |
| Last Quarter | Full previous quarter |
| This Year | Jan 1 - today |
| Custom | User-selected from/to |

---

## Accessibility

### Touch Targets
- Period dropdown: 48x48dp
- Export button: 48x48dp
- Table rows: 48dp height
- Chart hover areas: 10px radius

### Contrast
- Summary metrics: 4.5:1 against card background
- Table text: 4.5:1
- Trend indicators: Green #16A34A, Red #DC2626 (AA compliant)
- Chart lines: 4.5:1 against white background

### Screen Reader

- **Dashboard**: `role="main"` `aria-label="Margin Analysis Dashboard"`
- **Summary metrics**: Individual `aria-label` for each metric with trend
- **Tables**: `role="table"` with proper headers
- **Chart**: `aria-label="Margin trend chart showing 12-month gross margin and contribution margin percentages"`
- **Trend indicators**: `aria-label="Trend up 2.1 percent"` (not just icons)

### Keyboard Navigation

| Key | Action |
|-----|--------|
| Tab | Navigate between sections, tables, controls |
| Enter | Activate dropdown, export, drill-down |
| Arrow keys | Navigate table rows, chart data points |
| Escape | Close dropdown, modal |

---

## Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| **Desktop (>1024px)** | 4-column metrics, side-by-side tables, full chart |
| **Tablet (768-1024px)** | 3-column metrics, stacked tables, full chart |
| **Mobile (<768px)** | 1-column metrics, tab navigation, simplified chart |

---

## Performance Notes

### Query Optimization

```sql
-- Index for margin calculations
CREATE INDEX idx_sales_orders_margin
ON sales_orders(org_id, order_date, status)
WHERE status = 'completed';

-- Index for product margin
CREATE INDEX idx_order_items_product
ON order_items(org_id, product_id, order_date);

-- Index for customer margin
CREATE INDEX idx_sales_orders_customer
ON sales_orders(org_id, customer_id, order_date);
```

### Caching Strategy

```typescript
// Redis keys
'org:{orgId}:finance:margin:summary:{period}'     // 15 min TTL
'org:{orgId}:finance:margin:products:{period}'    // 15 min TTL
'org:{orgId}:finance:margin:customers:{period}'   // 15 min TTL
'org:{orgId}:finance:margin:trend:12mo'           // 1 hour TTL

// Invalidation triggers
- Order completed -> invalidate period cache
- BOM cost updated -> invalidate all margin caches
```

### Load Time Targets

| Operation | Target |
|-----------|--------|
| Initial dashboard load | < 2s |
| Period change | < 1s |
| Export PDF | < 5s |
| Drill-down | < 500ms |

---

## Error Handling

| Error | Display | Recovery |
|-------|---------|----------|
| Missing cost data | "N/A" in cells | Link to BOM costing |
| Calculation timeout | Error state | Retry with smaller period |
| Export failure | Toast: "Export failed" | Retry button |
| Invalid period | Red border on dropdown | Clear selection |

---

## Testing Requirements

### Unit Tests

```typescript
describe('Margin Analysis Dashboard', () => {
  it('calculates gross margin correctly', async () => {});
  it('calculates contribution margin correctly', async () => {});
  it('calculates weighted average GM', async () => {});
  it('shows trend indicators correctly', async () => {});
  it('filters low margin products', async () => {});
  it('handles missing cost data gracefully', async () => {});
});
```

### E2E Tests

```typescript
describe('Margin Analysis E2E', () => {
  it('loads dashboard with all sections', async () => {});
  it('changes period and reloads data', async () => {});
  it('exports PDF report', async () => {});
  it('drills down to product detail', async () => {});
  it('shows low margin alerts', async () => {});
});
```

---

## Quality Gates

- [x] All 4 states defined (Loading, Empty, Error, Success)
- [x] Responsive breakpoints documented
- [x] All API endpoints specified
- [x] Accessibility checklist passed
- [x] Performance targets defined
- [x] Margin calculation formulas documented
- [x] Trend indicators specified
- [x] Low margin alerts defined
- [x] Export functionality specified

---

**Status**: Ready for Implementation
**Approval Mode**: auto_approve
**Estimated Effort**: 6-8 hours
**Quality Target**: 95/100
**PRD Coverage**: 100% (Finance PRD Section 9.11)
