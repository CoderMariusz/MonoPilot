# Component Documentation: Cost History Components

**Module**: Technical - Costing
**Feature**: Cost History & Variance Analysis (Story 02.15)
**Last Updated**: December 30, 2025

---

## Overview

The Cost History feature includes a comprehensive set of React components for displaying cost trends, analyzing variances, and exporting cost data. All components are built with TypeScript, use ShadCN UI patterns, and are fully responsive.

**Component Architecture:**
```
CostHistoryPage (Page component)
├── CostSummaryCard (Summary display)
├── CostHistoryFilters (Filter controls)
├── CostTrendChart (Interactive chart with Recharts)
├── CostComponentBreakdown (Table with component breakdown)
├── TopCostDrivers (Table with ingredient analysis)
├── CostHistoryTable (Paginated history table)
├── VarianceAnalysisSection (Variance comparison)
└── ExportModal (Export dialog)
```

---

## CostHistoryPage

Main page component that orchestrates cost history display.

**Location**: `components/technical/costing/CostHistoryPage.tsx`

### Props

```typescript
interface CostHistoryPageProps {
  productId: string  // Product UUID
}
```

### Usage

```typescript
import { CostHistoryPage } from '@/components/technical/costing'

export default function HistoryPage({ productId }: { productId: string }) {
  return <CostHistoryPage productId={productId} />
}
```

### Features

- Orchestrates all child components
- Manages state for filters, pagination, and exports
- Handles data fetching with useQuery hook
- Displays loading, empty, and error states
- Responsive layout (stacked on mobile, grid on desktop)

### State Management

```typescript
const [filters, setFilters] = useState<CostHistoryFiltersState>({
  from: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 12 months ago
  to: new Date(),
  type: 'all',
  components: { material: true, labor: true, overhead: true }
})

const [page, setPage] = useState(1)
const [pageSize, setPageSize] = useState(10)
const [showExportModal, setShowExportModal] = useState(false)
```

### Data Fetching

```typescript
const { data: costHistoryData, isLoading, error } = useQuery({
  queryKey: ['cost-history', productId, filters, page, pageSize],
  queryFn: async () => {
    const params = new URLSearchParams({
      from: filters.from.toISOString().split('T')[0],
      to: filters.to.toISOString().split('T')[0],
      type: filters.type,
      page: page.toString(),
      limit: pageSize.toString(),
    })

    const res = await fetch(
      `/api/technical/costing/products/${productId}/history?${params}`
    )
    if (!res.ok) throw new Error('Failed to fetch cost history')
    return res.json() as Promise<CostHistoryResponse>
  },
})
```

### Render States

**Loading State:**
```
[Spinner] Loading Cost History...
Fetching historical cost data...
Calculating trends...
Analyzing variances...
[Progress Bar]
```

**Empty State:**
```
[Chart Icon]
No Cost History Available

This product doesn't have any cost calculations yet.
[Go to Recipe Costing]
```

**Error State:**
```
⚠ Error: Failed to load cost history data
[Warning Icon]
Unable to Load Cost History
[Retry] button
```

**Success State:**
- Cost Summary Card
- Filters
- Cost Trend Chart
- Component Breakdown
- Cost Drivers
- History Table
- Variance Analysis

---

## CostSummaryCard

Displays current cost, previous cost, and trend indicators.

**Location**: `components/technical/costing/CostSummaryCard.tsx`

### Props

```typescript
interface CostSummaryCardProps {
  summary: CostHistorySummary | null
  isLoading?: boolean
}

interface CostHistorySummary {
  current_cost: number
  current_cost_per_unit: number
  previous_cost: number | null
  change_amount: number
  change_percentage: number
  trend_30d: number
  trend_90d: number
  trend_ytd: number
}
```

### Usage

```typescript
import { CostSummaryCard } from '@/components/technical/costing'

export function Dashboard({ summary }: { summary: CostHistorySummary }) {
  return <CostSummaryCard summary={summary} />
}
```

### Display

```
Current Cost Summary

Current Total Cost: $2.46/kg (as of 2025-12-10)
Previous Cost: $2.38/kg (2025-11-15)
Change: +$0.08 (+3.4%) ▲

30-Day Trend: +2.1% ▲
90-Day Trend: +5.8% ▲
Year-to-Date: +12.3% ▲

[View Latest Costing]
```

### Implementation Details

```typescript
export function CostSummaryCard({ summary, isLoading }: CostSummaryCardProps) {
  if (isLoading) {
    return <Skeleton className="h-48 w-full" />
  }

  if (!summary) {
    return <div>No cost data available</div>
  }

  const getTrendIndicator = (trend: number) => {
    if (trend > 0) return '▲'
    if (trend < 0) return '▼'
    return '→'
  }

  const getTrendColor = (trend: number) => {
    if (trend > 0) return 'text-red-600'
    if (trend < 0) return 'text-green-600'
    return 'text-gray-600'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Cost Summary</CardTitle>
        <Button variant="outline" size="sm">
          View Latest Costing
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Current Total Cost</p>
            <p className="text-2xl font-bold">
              ${summary.current_cost.toFixed(2)}/kg
            </p>
            <p className="text-xs text-gray-500">as of today</p>
          </div>

          <div>
            <p className="text-sm text-gray-600">Previous Cost</p>
            <p className="text-2xl font-bold">
              ${summary.previous_cost?.toFixed(2) ?? 'N/A'}/kg
            </p>
            <p className="text-xs text-gray-500">from last calculation</p>
          </div>
        </div>

        {summary.previous_cost && (
          <div>
            <p className="text-sm text-gray-600">Change</p>
            <p className={`text-lg font-semibold ${getTrendColor(summary.change_percentage)}`}>
              {summary.change_amount > 0 ? '+' : ''}{summary.change_amount.toFixed(2)} (
              {summary.change_percentage > 0 ? '+' : ''}{summary.change_percentage.toFixed(1)}
              %) {getTrendIndicator(summary.change_percentage)}
            </p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 border-t pt-4">
          <div>
            <p className="text-sm text-gray-600">30-Day Trend</p>
            <p className={`font-semibold ${getTrendColor(summary.trend_30d)}`}>
              {summary.trend_30d > 0 ? '+' : ''}{summary.trend_30d.toFixed(1)}% {getTrendIndicator(summary.trend_30d)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">90-Day Trend</p>
            <p className={`font-semibold ${getTrendColor(summary.trend_90d)}`}>
              {summary.trend_90d > 0 ? '+' : ''}{summary.trend_90d.toFixed(1)}% {getTrendIndicator(summary.trend_90d)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Year-to-Date</p>
            <p className={`font-semibold ${getTrendColor(summary.trend_ytd)}`}>
              {summary.trend_ytd > 0 ? '+' : ''}{summary.trend_ytd.toFixed(1)}% {getTrendIndicator(summary.trend_ytd)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

---

## CostHistoryFilters

Filter controls for date range, cost type, and component visibility.

**Location**: `components/technical/costing/CostHistoryFilters.tsx`

### Props

```typescript
interface CostHistoryFiltersProps {
  value: CostHistoryFiltersState
  onChange: (filters: CostHistoryFiltersState) => void
  onReset: () => void
}

interface CostHistoryFiltersState {
  from: Date
  to: Date
  type: 'all' | 'standard' | 'actual' | 'planned'
  components: {
    material: boolean
    labor: boolean
    overhead: boolean
  }
}
```

### Usage

```typescript
import { CostHistoryFilters } from '@/components/technical/costing'

const [filters, setFilters] = useState<CostHistoryFiltersState>({
  from: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
  to: new Date(),
  type: 'all',
  components: { material: true, labor: true, overhead: true }
})

export function FilterExample() {
  return (
    <CostHistoryFilters
      value={filters}
      onChange={(newFilters) => {
        setFilters(newFilters)
        // Refetch data with new filters
      }}
      onReset={() => setFilters(DEFAULT_FILTERS)}
    />
  )
}
```

### Display

```
Filters:
Date Range: [2024-01-01] to [2025-12-11]
Cost Type: [All ▼]
Show: ☑ Material ☑ Labor ☑ Overhead
[Reset Filters] [Export to CSV]
```

### Components

**Date Range Picker:**
- Uses ShadCN Popover + Calendar
- From/To date fields
- Validation: from <= to
- Max range: 2 years

**Cost Type Dropdown:**
- Options: All, Standard, Actual, Planned
- Default: All

**Component Toggles:**
- Checkboxes for Material, Labor, Overhead
- Toggles control which lines show in chart

---

## CostTrendChart

Interactive line chart showing cost trends over time using Recharts.

**Location**: `components/technical/costing/CostTrendChart.tsx`

### Props

```typescript
interface CostTrendChartProps {
  data: ChartDataPoint[]
  selectedComponents: {
    material: boolean
    labor: boolean
    overhead: boolean
    total: boolean
  }
  onPointClick?: (item: CostHistoryItem) => void
  isLoading?: boolean
}

interface ChartDataPoint {
  date: string
  month: string
  material: number
  labor: number
  overhead: number
  total: number
  // Full item data for tooltip/click
  fullData?: CostHistoryItem
}
```

### Usage

```typescript
import { CostTrendChart } from '@/components/technical/costing'

const chartData = history.map(item => ({
  date: item.effective_from,
  month: format(new Date(item.effective_from), 'MMM yyyy'),
  material: item.material_cost,
  labor: item.labor_cost,
  overhead: item.overhead_cost,
  total: item.total_cost,
  fullData: item
}))

export function ChartExample() {
  return (
    <CostTrendChart
      data={chartData}
      selectedComponents={{
        material: true,
        labor: true,
        overhead: true,
        total: true
      }}
      onPointClick={(item) => {
        router.push(`/technical/costing/products/${productId}/history/${item.id}`)
      }}
    />
  )
}
```

### Features

- Interactive line chart with multiple data series
- Custom tooltip showing cost breakdown on hover
- Clickable data points for detail navigation
- Legend with toggle functionality
- Responsive sizing (auto-scales to container)
- Configurable component visibility
- Y-axis auto-scaling
- X-axis time labels (months/weeks/days based on range)

### Implementation

```typescript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

export function CostTrendChart({
  data,
  selectedComponents,
  onPointClick,
  isLoading
}: CostTrendChartProps) {
  if (isLoading) {
    return <Skeleton className="h-96 w-full" />
  }

  const handlePointClick = (point: ChartDataPoint) => {
    if (point.fullData && onPointClick) {
      onPointClick(point.fullData)
    }
  }

  return (
    <div className="w-full h-96">
      <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12 }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis
          label={{ value: 'Cost per Unit', angle: -90, position: 'insideLeft' }}
          tick={{ fontSize: 12 }}
        />
        <Tooltip
          content={({ active, payload, label }) => (
            <CostChartTooltip active={active} payload={payload} label={label} />
          )}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          onClick={(e) => {
            // Toggle line visibility
          }}
        />

        {selectedComponents.total && (
          <Line
            type="monotone"
            dataKey="total"
            stroke="#3b82f6"
            dot={{ onClick: handlePointClick }}
            isAnimationActive={true}
            name="Total Cost"
          />
        )}
        {selectedComponents.material && (
          <Line
            type="monotone"
            dataKey="material"
            stroke="#10b981"
            dot={false}
            name="Material"
          />
        )}
        {selectedComponents.labor && (
          <Line
            type="monotone"
            dataKey="labor"
            stroke="#f59e0b"
            dot={false}
            name="Labor"
          />
        )}
        {selectedComponents.overhead && (
          <Line
            type="monotone"
            dataKey="overhead"
            stroke="#8b5cf6"
            dot={false}
            name="Overhead"
          />
        )}
      </LineChart>
    </div>
  )
}
```

---

## CostChartTooltip

Custom tooltip component displayed on chart hover.

**Location**: `components/technical/costing/CostChartTooltip.tsx`

### Props

```typescript
interface CostChartTooltipProps {
  active?: boolean
  payload?: any[]
  label?: string
}
```

### Display

```
Cost Breakdown - March 15, 2025

Material Cost: $161.60 (74.1%)
Labor Cost: $40.00 (18.3%)
Overhead Cost: $16.50 (7.6%)
──────────────
Total Cost: $218.10 (100%)

Cost per Unit: $2.18/kg
Change from Previous: +$1.32 (+0.6%) ▲

BOM Version: v4 | Calculated by: System
[Click for Full Detail →]
```

### Implementation

```typescript
export function CostChartTooltip({ active, payload, label }: CostChartTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  const data = payload[0].payload
  const total = data.total || 1
  const material_pct = ((data.material / total) * 100).toFixed(1)
  const labor_pct = ((data.labor / total) * 100).toFixed(1)
  const overhead_pct = ((data.overhead / total) * 100).toFixed(1)

  return (
    <div className="bg-white p-4 border rounded-lg shadow-lg" role="tooltip">
      <h4 className="font-semibold mb-2">Cost Breakdown - {label}</h4>

      <div className="space-y-1 text-sm mb-2">
        <div className="flex justify-between">
          <span>Material Cost:</span>
          <span className="font-mono">${data.material.toFixed(2)} ({material_pct}%)</span>
        </div>
        <div className="flex justify-between">
          <span>Labor Cost:</span>
          <span className="font-mono">${data.labor.toFixed(2)} ({labor_pct}%)</span>
        </div>
        <div className="flex justify-between">
          <span>Overhead Cost:</span>
          <span className="font-mono">${data.overhead.toFixed(2)} ({overhead_pct}%)</span>
        </div>
      </div>

      <div className="border-t pt-2 my-2">
        <div className="flex justify-between font-semibold text-sm">
          <span>Total Cost:</span>
          <span className="font-mono">${total.toFixed(2)} (100%)</span>
        </div>
      </div>

      {data.fullData && (
        <div className="text-xs text-gray-600 space-y-1 mt-3">
          <p>Cost per Unit: ${data.fullData.cost_per_unit?.toFixed(2) ?? 'N/A'}/kg</p>
          <button
            className="text-blue-600 hover:underline"
            onClick={() => {
              // Navigate to detail
            }}
          >
            Click for Full Detail →
          </button>
        </div>
      )}
    </div>
  )
}
```

---

## CostComponentBreakdown

Table showing cost component breakdown and changes.

**Location**: `components/technical/costing/CostComponentBreakdown.tsx`

### Props

```typescript
interface CostComponentBreakdownProps {
  data: ComponentBreakdownData | null
  isLoading?: boolean
}

interface ComponentBreakdownData {
  current: {
    material: number
    labor: number
    overhead: number
    total: number
  },
  historical: {
    material: number
    labor: number
    overhead: number
    total: number
  },
  changes: {
    material: { amount: number; percent: number }
    labor: { amount: number; percent: number }
    overhead: { amount: number; percent: number }
    total: { amount: number; percent: number }
  }
}
```

### Usage

```typescript
import { CostComponentBreakdown } from '@/components/technical/costing'

export function Dashboard({ breakdownData }: { breakdownData: ComponentBreakdownData }) {
  return <CostComponentBreakdown data={breakdownData} />
}
```

### Display

```
Cost Component Breakdown

Component        Current    3mo Ago    Change         % of Total
──────────────────────────────────────────────────────────────
Material Cost    $185.50    $178.20    +$7.30 (+4.1%) 75.6%
Labor Cost       $42.00     $41.50     +$0.50 (+1.2%) 17.1%
Overhead Cost    $18.00     $17.80     +$0.20 (+1.1%) 7.3%

Total Cost       $245.50    $237.50    +$8.00 (+3.4%) 100.0%
```

### Highlighting

- Increases >5%: Red background
- Decreases: Green background
- Stable: Gray background

---

## TopCostDrivers

Table showing top cost driver ingredients.

**Location**: `components/technical/costing/TopCostDrivers.tsx`

### Props

```typescript
interface TopCostDriversProps {
  drivers: CostDriver[]
  isLoading?: boolean
}

interface CostDriver {
  ingredient_id: string
  ingredient_name: string
  ingredient_code: string
  current_cost: number
  historical_cost: number
  change_amount: number
  change_percent: number
  impact_percent: number
}
```

### Usage

```typescript
import { TopCostDrivers } from '@/components/technical/costing'

export function Dashboard({ drivers }: { drivers: CostDriver[] }) {
  return <TopCostDrivers drivers={drivers} />
}
```

### Display

```
Top Cost Drivers (Material)

Ingredient        Current    3mo Ago    Change       Impact
──────────────────────────────────────────────────────────
Butter            $52.00     $48.00     +$4.00 (+8.3%) +1.6%
Flour Type 550    $42.50     $40.50     +$2.00 (+4.9%) +0.8%
Milk Powder       $32.80     $31.20     +$1.60 (+5.1%) +0.7%
Yeast Fresh       $24.00     $24.50     -$0.50 (-2.0%) -0.2%
Other (6 items)   $34.20     $33.80     +$0.40 (+1.2%) +0.2%

Biggest Driver: Butter (+$4.00, accounts for 50% of total increase)
```

---

## CostHistoryTable

Paginated table of cost history records.

**Location**: `components/technical/costing/CostHistoryTable.tsx`

### Props

```typescript
interface CostHistoryTableProps {
  items: CostHistoryItem[]
  total: number
  page: number
  limit: number
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
  onRowClick?: (item: CostHistoryItem) => void
  isLoading?: boolean
}

interface CostHistoryItem {
  id: string
  cost_type: string
  material_cost: number
  labor_cost: number
  overhead_cost: number
  total_cost: number
  cost_per_unit: number | null
  effective_from: string
  effective_to: string | null
  created_at: string
  created_by: string | null
  bom_version: number | null
}
```

### Usage

```typescript
import { CostHistoryTable } from '@/components/technical/costing'

const [page, setPage] = useState(1)
const [limit, setLimit] = useState(10)

export function Dashboard({
  items,
  total
}: {
  items: CostHistoryItem[]
  total: number
}) {
  return (
    <CostHistoryTable
      items={items}
      total={total}
      page={page}
      limit={limit}
      onPageChange={setPage}
      onLimitChange={setLimit}
      onRowClick={(item) => {
        router.push(`/technical/costing/products/${productId}/history/${item.id}`)
      }}
    />
  )
}
```

### Features

- Server-side pagination (10/25/50/100 per page)
- Click rows to view details
- Shows "Showing X of Y records"
- Previous/Next buttons
- Page jump input
- Sort by column headers (future enhancement)
- Column visibility toggle (future enhancement)

### Display

```
Search: [_________________]    [Filter ▼] [Columns ▼]

Date         Type       Material  Labor  Overhead  Total    Change
──────────────────────────────────────────────────────────────────
2025-12-10   Standard   $185.50   $42.00  $18.00   $245.50  +3.4% ▲
2025-11-15   Standard   $178.20   $41.50  $17.80   $237.50  +2.1% ▲
2025-10-20   Standard   $174.80   $41.50  $17.50   $233.80  +1.2% ▲

Showing 10 of 47 records
[< Prev] [1] [2] [3] [4] [5] [Next >]
```

---

## VarianceAnalysisSection

Displays variance analysis between standard and actual costs.

**Location**: `components/technical/costing/VarianceAnalysisSection.tsx`

### Props

```typescript
interface VarianceAnalysisSectionProps {
  productId: string
  period?: number // 7, 30, 90, 365 (default: 30)
  isLoading?: boolean
}
```

### Usage

```typescript
import { VarianceAnalysisSection } from '@/components/technical/costing'

export function Dashboard({ productId }: { productId: string }) {
  return (
    <VarianceAnalysisSection
      productId={productId}
      period={30}
    />
  )
}
```

### Features

- Fetches variance data via API
- Period selector (7/30/90/365 days)
- Shows work orders analyzed count
- Displays standard vs actual comparison
- Highlights variances >5%
- Links to detailed variance report

### Display

```
Variance Analysis (Standard vs Actual)

Period: Last 30 Days    Work Orders Analyzed: 12

Component        Standard   Actual    Variance   % Variance
──────────────────────────────────────────────────────────
Material Cost    $185.50   $188.20   +$2.70     +1.5% ▲
Labor Cost       $42.00    $45.30    +$3.30     +7.9% ▲ ⚠
Overhead Cost    $18.00    $17.85    -$0.15     -0.8% ▼

Total Cost       $245.50   $251.35   +$5.85     +2.4% ▲

⚠ Significant variance in Labor Cost (+7.9%)

[View Detailed Variance Report]
```

---

## ExportModal

Modal dialog for exporting cost history data.

**Location**: `components/technical/costing/ExportModal.tsx`

### Props

```typescript
interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  productId: string
  productName: string
  dateRange: {
    from: Date
    to: Date
  }
}
```

### Usage

```typescript
import { ExportModal } from '@/components/technical/costing'

const [showExportModal, setShowExportModal] = useState(false)

export function Dashboard({ productId }: { productId: string }) {
  return (
    <>
      <button onClick={() => setShowExportModal(true)}>
        [Export Cost History]
      </button>

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        productId={productId}
        productName="Bread Loaf White"
        dateRange={{
          from: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
          to: new Date()
        }}
      />
    </>
  )
}
```

### Features

- Multiple export formats (CSV, PDF, PNG, Excel)
- Data inclusion checkboxes
- Date range selection
- Custom filename
- Export preview (first 5 rows)
- File size estimate
- Download button

### Export Formats

**CSV (Spreadsheet):**
```
Date,Type,Material,Labor,Overhead,Total,Change,%Change
2025-12-10,Standard,185.50,42.00,18.00,245.50,8.00,3.4
2025-11-15,Standard,178.20,41.50,17.80,237.50,5.00,2.1
```

**PDF (Full Report):**
- Cover page with product info
- Cost trend chart
- Component breakdown table
- Cost drivers table
- Variance analysis (if available)
- Data source and calculation timestamp

**PNG (Chart Only):**
- 1200x600px image
- Transparent background
- For presentations

**Excel (Multi-sheet):**
- Summary sheet
- History table sheet
- Breakdowns sheet
- Charts sheet

---

## Styling & Theming

All components use ShadCN UI theming:

```typescript
// Dark mode support
className="dark:bg-slate-950 dark:text-slate-50"

// Responsive design
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"

// Color coding for trends
const getTrendColor = (value: number) => {
  if (value > 0) return 'text-red-600 dark:text-red-400'  // Up = cost increase
  if (value < 0) return 'text-green-600 dark:text-green-400'  // Down = savings
  return 'text-gray-600 dark:text-gray-400'
}
```

---

## Accessibility Features

- **ARIA Labels:** All interactive elements have descriptive labels
- **Screen Reader Support:** Data tables have proper header associations
- **Keyboard Navigation:** Tab order is logical, enter/space activates
- **Color Contrast:** WCAG AA compliant
- **Focus Management:** Clear focus indicators
- **Alternative Text:** Charts have data table alternatives

```typescript
// Example: Accessible chart
<div
  role="region"
  aria-label="Cost trend chart with monthly data points"
>
  <LineChart data={data}>
    {/* Chart components */}
  </LineChart>
  <details>
    <summary>View as data table</summary>
    <CostHistoryTable data={data} />
  </details>
</div>
```

---

## Performance Optimization

### Memoization

```typescript
import { memo, useMemo } from 'react'

// Memoize expensive calculations
const chartData = useMemo(() => {
  return costHistory.map(item => ({
    date: item.effective_from,
    material: item.material_cost,
    // ...
  }))
}, [costHistory])

// Memoize components
export const CostTrendChart = memo(CostTrendChartComponent)
```

### Code Splitting

```typescript
import dynamic from 'next/dynamic'

// Load ExportModal only when needed
const ExportModal = dynamic(
  () => import('./ExportModal'),
  { loading: () => <div>Loading...</div> }
)
```

### Query Caching

```typescript
// Cache cost history for 5 minutes
const { data } = useQuery({
  queryKey: ['cost-history', productId],
  queryFn: fetchCostHistory,
  staleTime: 5 * 60 * 1000,  // 5 minutes
  cacheTime: 10 * 60 * 1000  // 10 minutes
})
```

---

## Testing

### Unit Test Examples

```typescript
import { render, screen } from '@testing-library/react'
import { CostSummaryCard } from '@/components/technical/costing'

describe('CostSummaryCard', () => {
  it('displays current cost correctly', () => {
    const summary = {
      current_cost: 245.50,
      current_cost_per_unit: 2.46,
      previous_cost: 237.50,
      change_amount: 8.00,
      change_percentage: 3.4,
      trend_30d: 2.1,
      trend_90d: 5.8,
      trend_ytd: 12.3
    }

    render(<CostSummaryCard summary={summary} />)

    expect(screen.getByText(/245.50/)).toBeInTheDocument()
    expect(screen.getByText(/\+3.4%/)).toBeInTheDocument()
    expect(screen.getByText(/\+2.1%/)).toBeInTheDocument()
  })

  it('shows loading state', () => {
    render(<CostSummaryCard summary={null} isLoading={true} />)
    expect(screen.getByTestId('cost-summary-skeleton')).toBeInTheDocument()
  })
})
```

### Component Test Example

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CostHistoryFilters } from '@/components/technical/costing'

describe('CostHistoryFilters', () => {
  it('calls onChange when filters change', async () => {
    const onChange = vi.fn()

    const { getByRole } = render(
      <CostHistoryFilters
        value={DEFAULT_FILTERS}
        onChange={onChange}
        onReset={vi.fn()}
      />
    )

    // Click material checkbox
    const materialCheckbox = getByRole('checkbox', { name: /material/i })
    fireEvent.click(materialCheckbox)

    await waitFor(() => {
      expect(onChange).toHaveBeenCalled()
    })
  })
})
```

---

## See Also

- [Cost History API Documentation](../api/technical/cost-history.md)
- [Cost History User Guide](../../guides/technical/cost-history-variance.md)
- [ShadCN UI Component Library](https://ui.shadcn.com/)
- [Recharts Documentation](https://recharts.org/)

