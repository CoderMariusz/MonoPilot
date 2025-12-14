# TEC-015: Cost History & Trends

**Module**: Technical
**Feature**: Cost History Tracking (Story 2.75)
**Type**: Page
**Status**: Ready for Review
**Last Updated**: 2025-12-11

---

## ASCII Wireframe

### Success State (With Historical Data)

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Technical > Products > Bread Loaf White > Cost History                   │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Cost History & Trends: Bread Loaf White (SKU: BREAD-001)                 │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │  Current Cost Summary                          [View Latest Costing] │ │
│  ├──────────────────────────────────────────────────────────────────────┤ │
│  │                                                                      │ │
│  │  Current Total Cost:        $2.46 /kg      (as of 2025-12-10)       │ │
│  │  Previous Cost:             $2.38 /kg      (2025-11-15)             │ │
│  │  Change:                    +$0.08 (+3.4%) ▲                         │ │
│  │                                                                      │ │
│  │  30-Day Trend:              +2.1%  ▲                                 │ │
│  │  90-Day Trend:              +5.8%  ▲                                 │ │
│  │  Year-to-Date:              +12.3% ▲                                 │ │
│  │                                                                      │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│  Filters:                                                                  │
│  Date Range: [2024-01-01] to [2025-12-11]    Cost Type: [All ▼]          │
│  Show: ☑ Material ☑ Labor ☑ Overhead    Chart Type: [Line ▼]            │
│  [Reset Filters]    [Export to CSV]                                       │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │  Cost Trend Chart (Last 12 Months)                                  │ │
│  ├──────────────────────────────────────────────────────────────────────┤ │
│  │                                                                      │ │
│  │  $3.00 │                                                             │ │
│  │        │                                                          ●  │ │
│  │  $2.75 │                                               ●──────●      │ │
│  │        │                                    ●─────●                  │ │
│  │  $2.50 │                         ●─────●                            │ │
│  │        │              ●─────●                                        │ │
│  │  $2.25 │   ●─────●                                                   │ │
│  │        │                                                             │ │
│  │  $2.00 │                                                             │ │
│  │        └──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──  │ │
│  │             Jan   Mar   May   Jul   Sep   Nov  2025                  │ │
│  │                                                                      │ │
│  │  Legend: ──●── Total Cost    ─── Material    ─── Labor    ─── OH   │ │
│  │                                                                      │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │  Cost Component Breakdown                                            │ │
│  ├──────────────────────────────────────────────────────────────────────┤ │
│  │                                                                      │ │
│  │  Component        Current    3mo Ago    Change      % of Total      │ │
│  │  ──────────────────────────────────────────────────────────────────  │ │
│  │  Material Cost    $185.50    $178.20    +$7.30 (+4.1%) ▲   75.6%   │ │
│  │  Labor Cost       $42.00     $41.50     +$0.50 (+1.2%) ▲   17.1%   │ │
│  │  Overhead Cost    $18.00     $17.80     +$0.20 (+1.1%) ▲    7.3%   │ │
│  │                                                                      │ │
│  │  Total Cost       $245.50    $237.50    +$8.00 (+3.4%) ▲   100.0%  │ │
│  │                                                                      │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │  Top Cost Drivers (Material)                                         │ │
│  ├──────────────────────────────────────────────────────────────────────┤ │
│  │                                                                      │ │
│  │  Ingredient       Current    3mo Ago    Change      Impact          │ │
│  │  ──────────────────────────────────────────────────────────────────  │ │
│  │  Butter           $52.00     $48.00     +$4.00 (+8.3%) ▲  +1.6%     │ │
│  │  Flour Type 550   $42.50     $40.50     +$2.00 (+4.9%) ▲  +0.8%     │ │
│  │  Milk Powder      $32.80     $31.20     +$1.60 (+5.1%) ▲  +0.7%     │ │
│  │  Yeast Fresh      $24.00     $24.50     -$0.50 (-2.0%) ▼  -0.2%     │ │
│  │  Other (6 items)  $34.20     $33.80     +$0.40 (+1.2%) ▲  +0.2%     │ │
│  │                                                                      │ │
│  │  Biggest Driver: Butter (+$4.00, accounts for 50% of total increase)│ │
│  │                                                                      │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │  Cost History Table                                                  │ │
│  ├──────────────────────────────────────────────────────────────────────┤ │
│  │                                                                      │ │
│  │  Search: [_________________]                [Filter ▼]  [Columns ▼] │ │
│  │                                                                      │ │
│  │  Date         Type      Material  Labor  Overhead  Total    Change  │ │
│  │  ──────────────────────────────────────────────────────────────────  │ │
│  │  2025-12-10   Standard  $185.50  $42.00  $18.00   $245.50  +3.4% ▲ │ │
│  │  2025-11-15   Standard  $178.20  $41.50  $17.80   $237.50  +2.1% ▲ │ │
│  │  2025-10-20   Standard  $174.80  $41.50  $17.50   $233.80  +1.2% ▲ │ │
│  │  2025-09-25   Standard  $173.00  $41.00  $17.00   $231.00  -0.5% ▼ │ │
│  │  2025-08-30   Standard  $174.20  $41.20  $17.00   $232.40  +0.8% ▲ │ │
│  │  2025-07-15   Standard  $172.40  $40.80  $17.20   $230.40  +1.5% ▲ │ │
│  │  2025-06-20   Standard  $169.80  $40.50  $17.10   $227.40  +0.3% ▲ │ │
│  │  2025-05-18   Standard  $169.10  $40.50  $17.00   $226.60  +2.7% ▲ │ │
│  │  2025-04-22   Standard  $164.70  $40.20  $16.80   $221.70  +1.9% ▲ │ │
│  │  2025-03-15   Standard  $161.60  $40.00  $16.50   $218.10  +0.6% ▲ │ │
│  │                                                                      │ │
│  │  Showing 10 of 47 records    [< Prev]  [1] [2] [3] [4] [5]  [Next >]│ │
│  │                                                                      │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │  Variance Analysis (Standard vs Actual)                              │ │
│  ├──────────────────────────────────────────────────────────────────────┤ │
│  │                                                                      │ │
│  │  Period: Last 30 Days    Work Orders Analyzed: 12                   │ │
│  │                                                                      │ │
│  │  Component        Standard   Actual    Variance   % Variance        │ │
│  │  ──────────────────────────────────────────────────────────────────  │ │
│  │  Material Cost    $185.50   $188.20   +$2.70     +1.5% ▲            │ │
│  │  Labor Cost       $42.00    $45.30    +$3.30     +7.9% ▲            │ │
│  │  Overhead Cost    $18.00    $17.85    -$0.15     -0.8% ▼            │ │
│  │                                                                      │ │
│  │  Total Cost       $245.50   $251.35   +$5.85     +2.4% ▲            │ │
│  │                                                                      │ │
│  │  ⚠ Significant variance in Labor Cost (+7.9%)                       │ │
│  │                                                                      │ │
│  │  [View Detailed Variance Report]                                    │ │
│  │                                                                      │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│  [Back to Costing]  [Export Chart as PNG]  [Download Full Report (PDF)]  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### Success State (Limited History)

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Technical > Products > New Product XYZ > Cost History                     │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Cost History & Trends: New Product XYZ (SKU: PROD-999)                   │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │  Current Cost Summary                          [View Latest Costing] │ │
│  ├──────────────────────────────────────────────────────────────────────┤ │
│  │                                                                      │ │
│  │  Current Total Cost:        $1.85 /kg      (as of 2025-12-11)       │ │
│  │  Previous Cost:             N/A (first calculation)                  │ │
│  │  Change:                    N/A                                      │ │
│  │                                                                      │ │
│  │  ℹ This is the first cost calculation for this product.             │ │
│  │  Trends will appear after multiple calculations.                    │ │
│  │                                                                      │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │  Cost History Table                                                  │ │
│  ├──────────────────────────────────────────────────────────────────────┤ │
│  │                                                                      │ │
│  │  Date         Type      Material  Labor  Overhead  Total    Change  │ │
│  │  ──────────────────────────────────────────────────────────────────  │ │
│  │  2025-12-11   Standard  $138.75  $32.00  $14.25   $185.00  -        │ │
│  │                                                                      │ │
│  │  Showing 1 of 1 records                                              │ │
│  │                                                                      │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│  ℹ No variance data available yet. Run production to compare standard vs │
│  actual costs.                                                             │
│                                                                            │
│  [Back to Costing]                                                         │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### Loading State

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Technical > Products > Bread Loaf White > Cost History                   │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│                          [Spinner Icon]                                    │
│                                                                            │
│                  Loading Cost History...                                   │
│                                                                            │
│  Fetching historical cost data...                                          │
│  Calculating trends...                                                     │
│  Analyzing variances...                                                    │
│                                                                            │
│                      [Progress Bar 45%]                                    │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### Error State

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Technical > Products > Bread Loaf White > Cost History                   │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ⚠ Error: Failed to load cost history data                                │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │                                                                      │ │
│  │                      [Warning Icon]                                  │ │
│  │                                                                      │ │
│  │              Unable to Load Cost History                             │ │
│  │                                                                      │ │
│  │  Error Details:                                                      │ │
│  │  - Database connection timeout                                       │ │
│  │  - Please try again in a few moments                                 │ │
│  │                                                                      │ │
│  │  If the problem persists, contact support.                           │ │
│  │                                                                      │ │
│  │                      [Retry]                                         │ │
│  │                                                                      │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│  [Back to Costing]                                                         │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### Empty State

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Technical > Products > Uncalculated Product > Cost History                │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Cost History & Trends: Uncalculated Product (SKU: PROD-888)              │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │                                                                      │ │
│  │                      [Chart Icon]                                    │ │
│  │                                                                      │ │
│  │                  No Cost History Available                           │ │
│  │                                                                      │ │
│  │  This product doesn't have any cost calculations yet.               │ │
│  │                                                                      │ │
│  │  To view cost history and trends:                                   │ │
│  │  1. Calculate recipe costing at least once                           │ │
│  │  2. Historical data will appear here                                 │ │
│  │                                                                      │ │
│  │              [Go to Recipe Costing]                                  │ │
│  │                                                                      │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Components

### 1. Current Cost Summary Card
- **Current Total Cost**: Latest cost per unit with date
- **Previous Cost**: Prior calculation for comparison
- **Change**: Absolute and percentage change with trend indicator (▲▼)
- **30-Day Trend**: Short-term cost movement
- **90-Day Trend**: Medium-term cost movement
- **Year-to-Date**: Annual cost trend
- **View Latest Costing**: Link to TEC-013 current costing detail

### 2. Filters Section
- **Date Range**: Start/end date pickers
- **Cost Type**: Dropdown (All, Standard, Actual, Planned)
- **Component Toggles**: Checkboxes to show/hide Material, Labor, Overhead
- **Chart Type**: Dropdown (Line, Bar, Stacked Area)
- **Reset Filters**: Clear all filters to default
- **Export to CSV**: Download filtered data

### 3. Cost Trend Chart
- **Line Chart**: Visual representation of cost over time
- **Y-Axis**: Cost per unit (auto-scaled)
- **X-Axis**: Time periods (months for 12mo view, weeks for 3mo, days for 1mo)
- **Multiple Lines**: Total, Material, Labor, Overhead (toggleable)
- **Data Points**: Hover shows exact values and date
- **Legend**: Color-coded component identification
- **Zoom/Pan**: Optional for large datasets

### 4. Cost Component Breakdown Table
- **Component**: Material, Labor, Overhead, Total
- **Current**: Latest cost values
- **3mo Ago**: Comparison baseline (configurable: 1mo, 3mo, 6mo, 1yr)
- **Change**: Absolute and percentage with trend indicator
- **% of Total**: Each component's share of total cost
- **Row Highlighting**: Red for increases >5%, green for decreases

### 5. Top Cost Drivers Section
- **Ingredient Table**: Top 5 material cost contributors
- **Current**: Latest ingredient cost
- **3mo Ago**: Historical comparison
- **Change**: Cost change with percentage
- **Impact**: Contribution to overall cost change
- **Biggest Driver**: Summary of top influencer
- **Other Items**: Aggregated remaining ingredients

### 6. Cost History Table
- **Search**: Filter by date or cost type
- **Columns**: Date, Type, Material, Labor, Overhead, Total, Change
- **Sorting**: Click column headers to sort
- **Pagination**: 10/25/50/100 records per page
- **Row Click**: Opens detail view for that cost calculation
- **Export**: Download visible records to CSV

### 7. Variance Analysis Section
- **Period Selector**: Last 7/30/90 days
- **Work Orders Count**: Number of production runs analyzed
- **Component Table**: Standard vs Actual comparison
- **Variance**: Absolute and percentage difference
- **Warning Indicator**: Highlights variances >5%
- **Detail Link**: Navigate to full variance analysis report

---

## Main Actions

### Primary Actions
- **View Latest Costing**:
  - Navigates to TEC-013 Recipe Costing View
  - Shows current active costing detail

- **Filter/Search**:
  - Updates chart and table based on filters
  - Debounced search (500ms)
  - Client-side filtering for <100 records, API for larger datasets

- **Export to CSV**:
  - Downloads filtered cost history
  - Includes all columns + breakdown details
  - Filename: `cost-history-{sku}-{date}.csv`

- **View Detailed Variance Report**:
  - Navigates to dedicated variance analysis page
  - Shows work order level breakdown
  - Identifies variance root causes

### Secondary Actions
- **Reset Filters**: Clear all filters to default (last 12 months, all types)
- **Export Chart as PNG**: Download chart image for reporting
- **Download Full Report (PDF)**: Comprehensive cost history report with charts and tables
- **Retry** (Error State): Retry loading cost history data
- **Go to Recipe Costing** (Empty State): Navigate to TEC-013 to create first costing
- **Back to Costing**: Navigate back to TEC-013

---

## 4 States (One-Line)

- **Loading**: Spinner + "Loading Cost History..." with progress bar while GET /api/technical/costing/products/:id/history runs
- **Empty**: "No Cost History Available" with explanation and link to calculate first costing
- **Error**: Error message with retry button and support contact info
- **Success**: Full cost history with chart, tables, trends, and variance analysis (or limited view if <3 data points)

---

## Validation Rules

| Field | Rules |
|-------|-------|
| Date Range Start | Must be valid date, cannot be after end date |
| Date Range End | Must be valid date, cannot be before start date, max 2 years range |
| Cost Type Filter | Must be one of: All, Standard, Actual, Planned |
| Chart Type | Must be one of: Line, Bar, Stacked Area |
| Comparison Period | Must be one of: 1mo, 3mo, 6mo, 1yr |

**Validation Timing**:
- On filter change: Immediate validation and data refresh
- On date range: Validate on blur or submit

---

## Accessibility

- **Touch Targets**: All filters, buttons, chart interactions >= 48x48dp
- **Contrast**: Chart colors pass WCAG AA (high contrast mode available)
- **Screen Reader**: Announces "Cost History & Trends", table headers, chart data
- **Keyboard**: Tab navigation, Arrow keys for chart navigation, Enter to select
- **Focus**: Logical flow through filters → chart → tables
- **ARIA**: Chart described as data table alternative, trend indicators announced
- **Responsive**: Chart scales to mobile, tables become scrollable cards

---

## Technical Notes

### API Endpoints
- **Get Cost History**: `GET /api/technical/costing/products/:id/history`
  - Query params: `?from={date}&to={date}&type={standard|actual|planned}`
- **Get Variance Analysis**: `GET /api/technical/costing/variance/report?productId={id}&period={30|90}`
- **Export CSV**: `GET /api/technical/costing/products/:id/history/export`
- **Export PDF**: `GET /api/technical/costing/products/:id/history/pdf`

### Chart Library
- Use **Recharts** or **Chart.js** for line charts
- Responsive, touch-friendly
- Support zoom/pan for large datasets
- Export to PNG via canvas toDataURL

### Calculation Logic
```typescript
// Trend Calculation
const calculateTrend = (costs: ProductCost[], period: number): number => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - period);

  const periodCosts = costs.filter(c => c.created_at >= cutoff);
  if (periodCosts.length < 2) return 0;

  const oldestCost = periodCosts[0].total_cost;
  const newestCost = periodCosts[periodCosts.length - 1].total_cost;

  return ((newestCost - oldestCost) / oldestCost) * 100;
};

// Variance Calculation
const calculateVariance = (standard: number, actual: number): {
  amount: number;
  percentage: number;
  direction: 'up' | 'down' | 'neutral';
} => {
  const amount = actual - standard;
  const percentage = (amount / standard) * 100;

  return {
    amount,
    percentage,
    direction: amount > 0 ? 'up' : amount < 0 ? 'down' : 'neutral'
  };
};

// Top Cost Drivers
const getTopCostDrivers = (
  currentBreakdown: MaterialBreakdown[],
  historicalBreakdown: MaterialBreakdown[]
): CostDriver[] => {
  return currentBreakdown
    .map(current => {
      const historical = historicalBreakdown.find(h => h.ingredient_id === current.ingredient_id);
      const change = current.total_cost - (historical?.total_cost || 0);

      return {
        ingredient_id: current.ingredient_id,
        name: current.name,
        current_cost: current.total_cost,
        historical_cost: historical?.total_cost || 0,
        change,
        impact: change / totalCostChange // contribution to overall change
      };
    })
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
    .slice(0, 5);
};
```

### Data Structure
```typescript
// Cost History Item
{
  id: string;
  product_id: string;
  cost_type: 'standard' | 'actual' | 'planned';
  material_cost: number;
  labor_cost: number;
  overhead_cost: number;
  total_cost: number;
  cost_per_unit: number;
  effective_from: Date;
  effective_to: Date | null;
  created_at: Date;
  created_by: string;
  breakdown: {
    materials: MaterialBreakdown[];
    labor: LaborBreakdown[];
    overhead: OverheadBreakdown;
  };
}

// Cost Trend Summary
{
  current_cost: number;
  previous_cost: number | null;
  change_amount: number;
  change_percentage: number;
  trend_30d: number;
  trend_90d: number;
  trend_ytd: number;
}

// Variance Analysis
{
  period_days: number;
  work_orders_count: number;
  components: {
    material: { standard: number; actual: number; variance: number; variance_pct: number };
    labor: { standard: number; actual: number; variance: number; variance_pct: number };
    overhead: { standard: number; actual: number; variance: number; variance_pct: number };
    total: { standard: number; actual: number; variance: number; variance_pct: number };
  };
  significant_variances: Array<{
    component: string;
    variance_pct: number;
    threshold: number;
  }>;
}
```

### Performance Optimization
- **Pagination**: Server-side for >100 records
- **Chart Data**: Aggregate to max 100 data points for large date ranges
- **Caching**: Cache chart data for 5 minutes (Redis)
- **Lazy Load**: Load chart only when scrolled into view
- **Debounce**: Filter changes debounced 500ms

### Export Formats
- **CSV**: Raw data with headers, UTF-8 encoding
- **PNG**: Chart image, 1200x600px, transparent background
- **PDF**: Full report with cover page, charts, tables, variance analysis

---

## Related Screens

- **Recipe Costing**: [TEC-013-recipe-costing.md] (parent screen)
- **Variance Analysis**: Dedicated page for detailed variance breakdown
- **Production Dashboard**: Links to work orders used in variance calculation
- **Ingredient Cost Management**: Navigate to update ingredient costs

---

## Business Rules

### Cost History Retention
1. **Retention Period**: 5 years minimum (regulatory requirement)
2. **Archival**: After 5 years, move to cold storage (still accessible)
3. **Deletion**: Never delete cost history (audit trail)

### Trend Calculation
1. **Minimum Data Points**: Require 2+ cost calculations for trends
2. **Period Definitions**:
   - 30-Day: Last 30 calendar days
   - 90-Day: Last 90 calendar days
   - YTD: From Jan 1 of current year
3. **Weighting**: Simple average, not weighted by volume

### Variance Analysis
1. **Standard Cost**: From product_costs table (cost_type = 'standard')
2. **Actual Cost**: From work order consumption (FIFO/FEFO lot costs)
3. **Variance Threshold**: Flag if variance > 5% or >$10 (configurable)
4. **Analysis Period**: Default 30 days, adjustable 7-365 days
5. **Work Order Selection**: Only completed work orders included

### Cost Drivers Analysis
1. **Top N**: Show top 5 cost drivers by absolute change
2. **Impact Calculation**: Change contribution to total cost change
3. **Aggregation**: Group remaining ingredients as "Other"
4. **Sorting**: By absolute change (not percentage) to prioritize high-value items

### Chart Display
1. **Default Range**: Last 12 months
2. **Max Range**: 2 years (performance limit)
3. **Data Points**: Aggregate to monthly for >12mo, weekly for 3-12mo, daily for <3mo
4. **Missing Data**: Interpolate or show gap (configurable)

---

## Handoff Notes

### For FRONTEND-DEV:
1. Use standard page layout (not modal)
2. Chart library: Recharts (responsive, accessible)
3. API service: `lib/services/costing-service.ts`
4. Implement client-side filtering for <100 records
5. Debounce filter changes (500ms)
6. Cache chart data for 5 minutes
7. Export CSV: use `papaparse` library
8. Export PNG: use `html2canvas` for chart
9. Export PDF: use `jsPDF` with chart image embed
10. Responsive design: stack sections vertically on mobile
11. Table pagination: 10/25/50/100 options
12. Toast notifications for export actions

### For BACKEND-DEV:
1. Implement cost history API with pagination
2. Add date range filtering and cost type filtering
3. Create variance analysis endpoint with work order aggregation
4. Optimize query for large datasets (index on product_id, created_at)
5. Implement CSV export with streaming for large datasets
6. Add PDF generation service (use `puppeteer` or `wkhtmltopdf`)
7. Cache trend calculations (Redis, 5 min TTL)
8. Add analytics event tracking for cost trend views
9. Implement cost alert notifications (if variance > threshold)

---

**Status**: Auto-approved (autonomous mode)
**Approval Required**: No (auto-approve mode)
**Iterations**: 0 of 3
