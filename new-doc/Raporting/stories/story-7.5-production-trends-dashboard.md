> **Status:** PLANNED
> **Component:** `src/components/production-trends/ProductionTrendsDashboard.tsx`
> **Dependencies:** Story 7.1 (date-keyed storage), Story 7.2 (multi-day query methods)
> **Features:** 4 KPI summary cards with current vs previous comparison, efficiency % trend line chart, production volume dual-axis bar chart, plan variance line chart with zero-reference, granularity toggle, responsive layout, loading/empty states

# Story 7.5: Production Trends Dashboard (NEW PAGE)

## Story Overview
**Epic**: Production Analytics
**Priority**: Medium-High
**Estimated Effort**: 3-4 development sessions
**Dependencies**: Story 7.1 (date-keyed storage), Story 7.2 (multi-day query methods + `getProdPalletsForTimeSelection()`)

### User Story
> As a **Manager**, I want to **view historical trends of production efficiency, volume, and plan variance over time** so that I can **identify improving or declining production patterns and make informed decisions about resource allocation**.

### Purpose
This is a brand-new dashboard page called "Production Trends" that visualises Prod Pallets data over multiple time periods. Unlike existing pages that show single-point-in-time data, this page plots historical trends across 14 days, 13 weeks, or 13 periods depending on the selected granularity. It requires Story 7.1 (date-keyed storage) because Prod Pallets data must be retained across multiple days to produce meaningful trend lines.

### Data Sources
All data comes from **Prod Pallets date-keyed snapshots** stored in IndexedDB:
- **Efficiency %**: from `planSummary` array -- weighted average of `efficPct` by `availHrs`
- **Cases**: from `totals` array -- sum of `cases` across all products
- **KG**: from `totals` array -- sum of `kg` across all products
- **Variance GBP**: from `planSummary` array -- sum of `totalVarPounds`
- **Lost Hours**: from `planSummary` array -- sum of `lostHrsVPlan`

---

## Acceptance Criteria

### AC 7.5.1: Add `'production-trends'` to PageId Union in `app-store.ts`

- **Given** the file `src/stores/app-store.ts` exists with a `PageId` type union
- **When** the developer opens the file
- **Then** the developer adds `'production-trends'` to the `PageId` union type

**Exact change in `src/stores/app-store.ts`:**

Find this existing code block (around line 13-29):
```typescript
export type PageId =
    | 'overview'
    | 'yield-by-line'
    | 'yield-by-sku'
    | 'giveaway'
    | 'line-leaders'
    | 'team-comparison'
    | 'quality'
    | 'period-reports'
    | 'shift-report'
    | 'production-log'
    | 'efficiency-by-line'
    | 'efficiency-by-leader'
    | 'plan-summary'
    | 'production-schedule'
    | 'total-production'
    | 'product-master';
```

Add `| 'production-trends'` after `| 'product-master'` so the final line reads:
```typescript
    | 'product-master'
    | 'production-trends';
```

No other changes to this file. The `PageId` union now has 17 members.

---

### AC 7.5.2: Add "Production Trends" Nav Item to `Sidebar.tsx`

- **Given** the file `src/components/layout/Sidebar.tsx` exists with a `NAV_ITEMS` array
- **When** the developer opens the file
- **Then** a new nav item object is added to the `NAV_ITEMS` array under the `'Production'` category

**Exact change in `src/components/layout/Sidebar.tsx`:**

Find the `NAV_ITEMS` array (around line 12-30). After the last item in the `'Production'` category (currently `{ id: 'product-master', ... }`), add the following new object:

```typescript
    { id: 'production-trends', label: 'Production Trends', icon: '📈', path: '/production-trends', category: 'Production' },
```

Insert it immediately after the `product-master` line. The full `NAV_ITEMS` array Production section becomes:
```typescript
    // Production
    { id: 'production-log', label: 'Production Log', icon: '📝', path: '/production-log', category: 'Production' },
    { id: 'efficiency-by-line', label: 'Efficiency by Line', icon: '⚡', path: '/efficiency-by-line', category: 'Production' },
    { id: 'plan-summary', label: 'Plan Summary', icon: '📑', path: '/plan-summary', category: 'Production' },
    { id: 'production-schedule', label: 'Schedule', icon: '🗓️', path: '/production-schedule', category: 'Production' },
    { id: 'total-production', label: 'Total Production', icon: '📦', path: '/total-production', category: 'Production' },
    { id: 'product-master', label: 'Product Master', icon: '📖', path: '/product-master', category: 'Production' },
    { id: 'production-trends', label: 'Production Trends', icon: '📈', path: '/production-trends', category: 'Production' },
```

---

### AC 7.5.3: Add PAGE_TITLES Entry and Switch Case in `page.tsx`

- **Given** the file `src/app/page.tsx` exists with a `PAGE_TITLES` record and a `PageContent` switch statement
- **When** the developer opens the file
- **Then** two changes are made:
  1. A new entry is added to the `PAGE_TITLES` record
  2. A new `case` is added to the `PageContent` switch statement
  3. A new `import` statement is added at the top of the file

**Step 1: Add import statement.**

At the top of `src/app/page.tsx`, after the existing import for `PeriodReportsPage` (around line 26), add:

```typescript
import { ProductionTrendsDashboard } from '@/components/production-trends/ProductionTrendsDashboard';
```

**Step 2: Add PAGE_TITLES entry.**

In the `PAGE_TITLES` record (around line 37-54), after the `'product-master'` entry, add:

```typescript
    'production-trends': { title: '📈 Production Trends', subtitle: 'Efficiency, volume, and variance trends over time' },
```

**Step 3: Add switch case.**

In the `PageContent` function's switch statement (around line 276-319), add a new case before the `default:` case:

```typescript
        case 'production-trends':
            return <ProductionTrendsDashboard />;
```

---

### AC 7.5.4: Create `ProductionTrendsDashboard.tsx` Component Shell

- **Given** the directory `src/components/production-trends/` does not yet exist
- **When** the developer creates the new directory and main component file
- **Then** the file `src/components/production-trends/ProductionTrendsDashboard.tsx` is created with:
  1. A loading skeleton state
  2. An empty state (no Prod Pallets data)
  3. A main render layout with placeholder sections for charts

**File to create: `src/components/production-trends/ProductionTrendsDashboard.tsx`**

The component shell must have these exact imports:
```typescript
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { DataStore } from '@/stores/data-store';
import { useAppState, useAppDispatch } from '@/stores/app-store';
import { GranularitySelector } from '@/components/common/GranularitySelector';
import {
    getTrendTimePoints,
    getTimeSelectionKey,
    getComparisonLabel,
} from '@/lib/time-selection';
import type { ProdPalletsData, PlanSummaryRow, TotProdRow } from '@/types/prod-pallets';
import type { TimeGranularity } from '@/lib/time-selection';
```

The component signature must be:
```typescript
export function ProductionTrendsDashboard(): React.ReactElement {
```

**Local state variables (all declared at top of component):**
```typescript
    const appState = useAppState();
    const dispatch = useAppDispatch();
    const [prodPallets, setProdPallets] = useState<ProdPalletsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const timeKey = getTimeSelectionKey(appState.timeSelection);
```

**Loading state return (when `isLoading === true`):**
```tsx
    if (isLoading) {
        return (
            <div className="space-y-6 p-6">
                {/* Header skeleton */}
                <div className="flex justify-between items-center">
                    <div className="h-6 w-56 bg-gray-200 rounded animate-pulse" />
                    <div className="h-10 w-44 bg-gray-200 rounded animate-pulse" />
                </div>
                {/* KPI cards skeleton: 4 cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white rounded-xl shadow-sm p-5" style={{ height: 140 }}>
                            <div className="h-3 w-20 bg-gray-200 rounded animate-pulse mb-4" />
                            <div className="h-8 w-24 bg-gray-200 rounded animate-pulse mb-3" />
                            <div className="h-5 w-16 bg-gray-200 rounded-full animate-pulse" />
                        </div>
                    ))}
                </div>
                {/* Chart skeletons: 3 charts stacked */}
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white rounded-xl shadow-sm p-5" style={{ height: 350 }}>
                        <div className="h-4 w-40 bg-gray-200 rounded animate-pulse mb-4" />
                        <div className="h-[calc(100%-40px)] w-full bg-gray-100 rounded-lg animate-pulse" />
                    </div>
                ))}
            </div>
        );
    }
```

**Empty state return (when `prodPallets === null` and `isLoading === false`):**
```tsx
    if (!prodPallets) {
        return (
            <div className="flex flex-col items-center justify-center h-96 p-6">
                <div className="text-6xl mb-4">📈</div>
                <h2 className="text-xl font-semibold text-gray-700 mb-2">No Production Data Available</h2>
                <p className="text-gray-500 text-center max-w-md">
                    Please upload Prod Pallets data using the sidebar to view production trends.
                    This page requires multi-day data retention (Story 7.1) to display meaningful trends.
                </p>
            </div>
        );
    }
```

**Also create barrel export at `src/components/production-trends/index.ts`:**
```typescript
export { ProductionTrendsDashboard } from './ProductionTrendsDashboard';
```

---

### AC 7.5.5: Implement Trend Data Loading Using getTrendTimePoints Pattern

- **Given** the `ProductionTrendsDashboard` component shell from AC 7.5.4 exists
- **When** the component mounts or the time selection changes
- **Then** the component loads Prod Pallets data and computes trend data points for each time point

**This AC defines the data loading `useEffect` and the trend data computation `useMemo`.**

**Step 1: Define the `TrendPoint` interface** at the top of the file (outside the component, after imports):

```typescript
/** A single data point in the production trend */
interface ProductionTrendPoint {
    /** Display label for the X-axis (e.g., "12/02", "W/E 07/02", "P3") */
    label: string;
    /** Weighted average efficiency % (decimal, e.g. 0.785 = 78.5%) */
    efficiencyPct: number;
    /** Total cases produced */
    totalCases: number;
    /** Total KG produced */
    totalKg: number;
    /** Total plan variance in GBP */
    totalVariancePounds: number;
    /** Total lost hours versus plan */
    totalLostHrs: number;
}
```

**Step 2: Add the data loading `useEffect`** inside the component, after state declarations:

```typescript
    // Load Prod Pallets on mount and when time selection changes
    useEffect(() => {
        async function loadData() {
            setIsLoading(true);
            try {
                const pp = await DataStore.getProdPallets();
                setProdPallets(pp || null);
            } catch (error) {
                console.error('Error loading production trends data:', error);
                setProdPallets(null);
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, [timeKey]);
```

**Step 3: Define the helper function** `computeWeightedEfficiency` outside the component:

```typescript
/**
 * Compute the weighted average efficiency from PlanSummary rows.
 * Formula: sum(efficPct * availHrs) / sum(availHrs)
 * Returns a decimal (e.g., 0.785 for 78.5%).
 */
function computeWeightedEfficiency(rows: PlanSummaryRow[]): number {
    if (rows.length === 0) return 0;
    const totalAvailHrs = rows.reduce((sum, r) => sum + (r.availHrs || 0), 0);
    if (totalAvailHrs === 0) return 0;
    return rows.reduce((sum, r) => sum + (r.efficPct || 0) * (r.availHrs || 0), 0) / totalAvailHrs;
}
```

**Step 4: Compute trend data** with `useMemo` inside the component, after the `useEffect`:

```typescript
    // Compute trend data points from Prod Pallets
    // NOTE: After Story 7.1/7.2, this will use getProdPalletsForTimeSelection() per point.
    // For now (single-snapshot), we compute a single data point from the loaded snapshot.
    const trendData = useMemo((): ProductionTrendPoint[] => {
        if (!prodPallets) return [];

        const timePoints = getTrendTimePoints(appState.timeSelection);
        if (timePoints.length === 0) {
            // Fallback: single-point from current snapshot
            return [{
                label: 'Current',
                efficiencyPct: computeWeightedEfficiency(prodPallets.planSummary),
                totalCases: prodPallets.totals.reduce((sum, r) => sum + (r.cases || 0), 0),
                totalKg: prodPallets.totals.reduce((sum, r) => sum + (r.kg || 0), 0),
                totalVariancePounds: prodPallets.planSummary.reduce((sum, r) => sum + (r.totalVarPounds || 0), 0),
                totalLostHrs: prodPallets.planSummary.reduce((sum, r) => sum + (r.lostHrsVPlan || 0), 0),
            }];
        }

        // Multi-day trend (requires Story 7.1 + 7.2 date-keyed storage)
        // Each time point calls DataStore.getProdPalletsForTimeSelection(point.timeSelection)
        // For now, return single-point until Story 7.2 is implemented
        return [{
            label: 'Current',
            efficiencyPct: computeWeightedEfficiency(prodPallets.planSummary),
            totalCases: prodPallets.totals.reduce((sum, r) => sum + (r.cases || 0), 0),
            totalKg: prodPallets.totals.reduce((sum, r) => sum + (r.kg || 0), 0),
            totalVariancePounds: prodPallets.planSummary.reduce((sum, r) => sum + (r.totalVarPounds || 0), 0),
            totalLostHrs: prodPallets.planSummary.reduce((sum, r) => sum + (r.lostHrsVPlan || 0), 0),
        }];
    }, [prodPallets, appState.timeSelection]);
```

**After Story 7.2 is implemented**, the `trendData` useMemo will be updated to the full multi-point pattern:
```typescript
    // FUTURE (Story 7.2): Multi-point trend loading
    const trendData = useMemo((): ProductionTrendPoint[] => {
        // This will be populated by an async effect, not useMemo.
        // See the trendData state + useEffect pattern below.
        return trendDataState;
    }, [trendDataState]);

    // Async trend loading effect (after Story 7.2)
    useEffect(() => {
        async function loadTrend() {
            const timePoints = getTrendTimePoints(appState.timeSelection);
            const points: ProductionTrendPoint[] = [];

            for (const tp of timePoints) {
                const pp = await DataStore.getProdPalletsForTimeSelection({
                    ...appState.timeSelection,
                    selectedWeek: tp,   // or selectedDay depending on granularity
                });
                if (!pp) continue;

                const dateObj = new Date(tp);
                const label = `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;

                points.push({
                    label,
                    efficiencyPct: computeWeightedEfficiency(pp.planSummary),
                    totalCases: pp.totals.reduce((sum, r) => sum + (r.cases || 0), 0),
                    totalKg: pp.totals.reduce((sum, r) => sum + (r.kg || 0), 0),
                    totalVariancePounds: pp.planSummary.reduce((sum, r) => sum + (r.totalVarPounds || 0), 0),
                    totalLostHrs: pp.planSummary.reduce((sum, r) => sum + (r.lostHrsVPlan || 0), 0),
                });
            }

            setTrendDataState(points);
        }
        loadTrend();
    }, [appState.timeSelection]);
```

---

### AC 7.5.6: Implement KPI Summary Cards (4 Cards)

- **Given** the `ProductionTrendsDashboard` component has loaded `prodPallets` data
- **When** the main layout renders
- **Then** 4 KPI summary cards are displayed in a row:
  1. **Avg Efficiency** -- weighted average efficiency % from `planSummary`
  2. **Total Cases** -- sum of `cases` from `totals`
  3. **Total Variance GBP** -- sum of `totalVarPounds` from `planSummary`
  4. **Lost Hours** -- sum of `lostHrsVPlan` from `planSummary`

**Exact Tailwind classes and structure for each card:**

The cards section must be wrapped in:
```tsx
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
```

**Each KPI card** has this exact structure:
```tsx
<div className="bg-white rounded-xl shadow-sm p-5 transition-all duration-200 hover:shadow-md">
    {/* Icon + Label */}
    <div className="flex items-center gap-2 mb-3">
        <span className="text-lg" aria-hidden="true">{icon}</span>
        <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
            {label}
        </span>
    </div>
    {/* Value */}
    <div className="text-3xl font-bold text-gray-800 mb-3">
        {formattedValue}
    </div>
    {/* Change badge */}
    <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${badgeBgClass} ${badgeTextClass}`}>
        <span>{formattedChange}</span>
        <span>{arrow}</span>
    </div>
</div>
```

**Card definitions:**

| Card | Icon | Label | Value Computation | Format |
|------|------|-------|-------------------|--------|
| 1 | `⚡` | `Avg Efficiency` | `computeWeightedEfficiency(prodPallets.planSummary)` | `${(value * 100).toFixed(1)}%` |
| 2 | `📦` | `Total Cases` | `prodPallets.totals.reduce((s, r) => s + (r.cases \|\| 0), 0)` | `value.toLocaleString()` |
| 3 | `💷` | `Plan Variance` | `prodPallets.planSummary.reduce((s, r) => s + (r.totalVarPounds \|\| 0), 0)` | `${v >= 0 ? '+' : '-'}£${Math.abs(Math.round(v)).toLocaleString()}` |
| 4 | `🕐` | `Lost Hours` | `prodPallets.planSummary.reduce((s, r) => s + (r.lostHrsVPlan \|\| 0), 0)` | `${value.toFixed(1)} hrs` |

**KPI cards useMemo** (inside the component):
```typescript
    /** Current-snapshot KPI summary values */
    const kpiSummary = useMemo(() => {
        if (!prodPallets) return null;

        const efficiencyPct = computeWeightedEfficiency(prodPallets.planSummary);
        const totalCases = prodPallets.totals.reduce((sum, r) => sum + (r.cases || 0), 0);
        const totalVariancePounds = prodPallets.planSummary.reduce((sum, r) => sum + (r.totalVarPounds || 0), 0);
        const totalLostHrs = prodPallets.planSummary.reduce((sum, r) => sum + (r.lostHrsVPlan || 0), 0);

        return { efficiencyPct, totalCases, totalVariancePounds, totalLostHrs };
    }, [prodPallets]);
```

---

### AC 7.5.7: Implement Efficiency % Trend Line Chart (D3)

- **Given** the `trendData` array has at least 2 data points
- **When** the Efficiency Trend chart section renders
- **Then** a D3.js line chart is drawn with:
  - X-axis: time point labels from `trendData[].label`
  - Y-axis: efficiency % (converted to percentage, e.g. 78.5)
  - Smooth monotone curve via `d3.curveMonotoneX`
  - Gradient area fill below the line (purple `#6C5CE7` to transparent)
  - Data point dots: teal `#00D2D3` for efficiency >= 75%, red `#FF6B6B` for < 75%
  - Tooltip on hover showing exact date and efficiency %

**File to create: `src/components/production-trends/EfficiencyTrendChart.tsx`**

```typescript
'use client';

import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';

interface EfficiencyTrendChartProps {
    data: Array<{ label: string; efficiencyPct: number }>;
    height?: number;
}

interface TooltipState {
    visible: boolean;
    x: number;
    y: number;
    label: string;
    value: number;
}
```

**Component signature:**
```typescript
export function EfficiencyTrendChart({
    data,
    height = 300,
}: EfficiencyTrendChartProps): React.ReactElement {
```

**Refs and state:**
```typescript
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(700);
    const [tooltip, setTooltip] = useState<TooltipState>({
        visible: false, x: 0, y: 0, label: '', value: 0,
    });
```

**Resize observer** (same pattern as `WeeklyTrendChart.tsx`):
```typescript
    useEffect(() => {
        const updateWidth = () => {
            if (containerRef.current) {
                setWidth(containerRef.current.clientWidth);
            }
        };
        updateWidth();
        const resizeObserver = new ResizeObserver(updateWidth);
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }
        return () => resizeObserver.disconnect();
    }, []);
```

**D3 rendering useEffect:**
- Margins: `{ top: 20, right: 30, bottom: 40, left: 50 }`
- X scale: `d3.scalePoint<string>()` with domain `data.map(d => d.label)` and range `[0, innerWidth]`
- Y scale: `d3.scaleLinear()` with domain `[yMin, yMax]` where `yMin = Math.min(dataMin, 70) - 2` and `yMax = Math.max(dataMax, 85) + 2`; values should be displayed as whole numbers (e.g. 78.5, not 0.785)
- The `efficiencyPct` values in the data array are decimals (0.785). **Multiply by 100 before plotting.**
- Gradient fill: ID `'eff-area-gradient'`, top stop `#6C5CE7` at 0.3 opacity, bottom stop `#6C5CE7` at 0.02 opacity
- Area: `d3.area()` with `.y0(innerHeight)` and `.y1(d => y(d.efficiencyPct * 100))` and `.curve(d3.curveMonotoneX)`
- Line: `d3.line()` with `.y(d => y(d.efficiencyPct * 100))` and stroke `#6C5CE7` width 2.5
- Dots: `r=5`, fill `#00D2D3` if `d.efficiencyPct >= 0.75` else `#FF6B6B`, stroke `#fff` width 2
- X-axis: `d3.axisBottom(x).tickSizeOuter(0)`, text font-size `10px`, fill `#636E72`
- Y-axis: `d3.axisLeft(y).ticks(5).tickFormat(d => d + '%').tickSizeOuter(0)`, text font-size `10px`, fill `#636E72`
- Grid lines: `d3.axisLeft(y).ticks(5).tickSize(-innerWidth).tickFormat(() => '')`, stroke `#E9ECEF`, dasharray `2,2`

**Wrapper div:**
```tsx
<div ref={containerRef} className="bg-white rounded-xl shadow-sm p-5 relative">
    <h3 className="text-sm font-semibold text-gray-700 mb-4">
        Efficiency % Trend
    </h3>
    <svg ref={svgRef} width={width} height={height} className="overflow-visible" />
    {/* Tooltip */}
    {tooltip.visible && (
        <div
            className="absolute pointer-events-none bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg z-10"
            style={{ left: tooltip.x, top: tooltip.y, transform: 'translate(-50%, -100%)' }}
        >
            <div className="font-medium">{tooltip.label}</div>
            <div className="text-emerald-300">Efficiency: {tooltip.value.toFixed(1)}%</div>
        </div>
    )}
</div>
```

**Empty state (when `data.length === 0`):**
```tsx
<div className="bg-white rounded-xl shadow-sm p-5">
    <h3 className="text-sm font-semibold text-gray-700 mb-4">Efficiency % Trend</h3>
    <div className="h-[300px] flex items-center justify-center text-gray-500">
        No trend data available
    </div>
</div>
```

---

### AC 7.5.8: Implement Production Volume Bar Chart (Cases + KG Dual Axis)

- **Given** the `trendData` array has at least 1 data point
- **When** the Production Volume chart section renders
- **Then** a D3.js dual-axis bar chart is drawn with:
  - Left Y-axis: Cases (bar chart, purple `#6C5CE7`, opacity 0.8)
  - Right Y-axis: KG (line chart, teal `#00D2D3`, stroke-width 2.5)
  - X-axis: time point labels
  - Bars have rounded top corners (`rx: 4`)
  - Dual axis labels: "Cases" on left, "KG" on right
  - Tooltip showing both Cases and KG on hover

**File to create: `src/components/production-trends/ProductionVolumeChart.tsx`**

```typescript
'use client';

import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';

interface ProductionVolumeChartProps {
    data: Array<{ label: string; totalCases: number; totalKg: number }>;
    height?: number;
}
```

**Component signature:**
```typescript
export function ProductionVolumeChart({
    data,
    height = 300,
}: ProductionVolumeChartProps): React.ReactElement {
```

**D3 rendering details:**
- Margins: `{ top: 20, right: 60, bottom: 40, left: 60 }`
- X scale: `d3.scaleBand<string>()` with domain `data.map(d => d.label)`, range `[0, innerWidth]`, `.padding(0.3)`
- Y-left (Cases): `d3.scaleLinear()` with domain `[0, d3.max(data, d => d.totalCases) * 1.1]`, range `[innerHeight, 0]`
- Y-right (KG): `d3.scaleLinear()` with domain `[0, d3.max(data, d => d.totalKg) * 1.1]`, range `[innerHeight, 0]`
- Bars: positioned at `x(d.label)`, width `x.bandwidth()`, height `innerHeight - yLeft(d.totalCases)`, fill `#6C5CE7`, opacity `0.8`, `rx: 4`
- KG line: `d3.line()` with `.x(d => x(d.label)! + x.bandwidth() / 2)` and `.y(d => yRight(d.totalKg))`, stroke `#00D2D3`, width 2.5, curve `d3.curveMonotoneX`
- KG dots: `r=4`, fill `#00D2D3`, stroke `#fff`, width 2
- Left Y-axis: `d3.axisLeft(yLeft).ticks(5).tickFormat(d => d3.format(',')(d as number))`
- Right Y-axis: `d3.axisRight(yRight).ticks(5).tickFormat(d => d3.format(',')(d as number) + ' kg')`
- Left axis label: text "Cases" rotated -90 degrees at position `(-40, innerHeight/2)`, fill `#6C5CE7`
- Right axis label: text "KG" rotated 90 degrees at position `(50, innerHeight/2)`, fill `#00D2D3`
- X-axis: same styling as AC 7.5.7

**Wrapper div:**
```tsx
<div ref={containerRef} className="bg-white rounded-xl shadow-sm p-5 relative">
    <h3 className="text-sm font-semibold text-gray-700 mb-4">
        Production Volume
    </h3>
    <svg ref={svgRef} width={width} height={height} className="overflow-visible" />
    {/* Tooltip rendered conditionally */}
</div>
```

---

### AC 7.5.9: Implement Plan Variance GBP Line Chart with Zero Reference

- **Given** the `trendData` array has at least 2 data points
- **When** the Plan Variance chart section renders
- **Then** a D3.js line chart is drawn with:
  - X-axis: time point labels
  - Y-axis: Variance GBP (with `£` prefix on tick labels)
  - A horizontal dashed reference line at `£0` (stroke `#636E72`, dasharray `6,4`)
  - Area fill: green (`#00D2D3`, opacity 0.15) above the zero line, red (`#FF6B6B`, opacity 0.15) below the zero line
  - Main line: stroke `#636E72`, width 2.5
  - Data point dots: green `#00D2D3` when variance >= 0, red `#FF6B6B` when variance < 0
  - Tooltip showing exact GBP value

**File to create: `src/components/production-trends/VarianceTrendChart.tsx`**

```typescript
'use client';

import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';

interface VarianceTrendChartProps {
    data: Array<{ label: string; totalVariancePounds: number }>;
    height?: number;
}
```

**Component signature:**
```typescript
export function VarianceTrendChart({
    data,
    height = 300,
}: VarianceTrendChartProps): React.ReactElement {
```

**D3 rendering details:**
- Margins: `{ top: 20, right: 30, bottom: 40, left: 60 }`
- X scale: `d3.scalePoint<string>()` with domain `data.map(d => d.label)` and range `[0, innerWidth]`
- Y scale: `d3.scaleLinear()` with domain from `[Math.min(dataMin, 0) * 1.2, Math.max(dataMax, 0) * 1.2]`
- Zero reference line: `g.append('line')` from `(0, y(0))` to `(innerWidth, y(0))`, stroke `#636E72`, dasharray `6,4`, width 1.5
- Zero label: text `"£0"` at `(innerWidth + 5, y(0) + 4)`, font-size `11px`, fill `#636E72`
- Area above zero (green): Use `d3.area()` with `.y0(d => y(0))` and `.y1(d => y(Math.max(d.totalVariancePounds, 0)))`, fill `#00D2D3`, opacity 0.15
- Area below zero (red): Use `d3.area()` with `.y0(d => y(0))` and `.y1(d => y(Math.min(d.totalVariancePounds, 0)))`, fill `#FF6B6B`, opacity 0.15
- Main line: `d3.line()` with `.y(d => y(d.totalVariancePounds))`, stroke `#636E72`, width 2.5, curve `d3.curveMonotoneX`
- Dots: `r=5`, fill conditional on `d.totalVariancePounds >= 0 ? '#00D2D3' : '#FF6B6B'`, stroke `#fff`, width 2
- Y-axis ticks: `d3.axisLeft(y).ticks(5).tickFormat(d => '£' + d3.format(',')(d as number))`

**Wrapper div:**
```tsx
<div ref={containerRef} className="bg-white rounded-xl shadow-sm p-5 relative">
    <h3 className="text-sm font-semibold text-gray-700 mb-4">
        Plan Variance (£)
    </h3>
    <svg ref={svgRef} width={width} height={height} className="overflow-visible" />
    {/* Tooltip rendered conditionally */}
</div>
```

---

### AC 7.5.10: Add Current vs Previous Comparison to KPI Cards

- **Given** the Prod Pallets data has been loaded
- **When** the KPI summary cards render
- **Then** each card shows a comparison badge indicating change from previous time period
- **And** the badge follows the exact pattern from `src/components/overview/KPICard.tsx`

**Badge color logic (same as existing `KPICard.tsx`):**

```typescript
function getBadgeStyle(changePct: number, lowerIsBetter: boolean): {
    bgClass: string;
    textClass: string;
    arrow: string;
} {
    if (Math.abs(changePct) < 0.001) {
        return { bgClass: 'bg-gray-100', textClass: 'text-gray-600', arrow: '→' };
    }
    const isPositive = changePct > 0;
    const isGood = lowerIsBetter ? !isPositive : isPositive;
    if (isGood) {
        return { bgClass: 'bg-emerald-100', textClass: 'text-emerald-700', arrow: isPositive ? '↗' : '↘' };
    } else {
        return { bgClass: 'bg-rose-100', textClass: 'text-rose-700', arrow: isPositive ? '↗' : '↘' };
    }
}
```

**Card-specific `lowerIsBetter` flags:**
| Card | `lowerIsBetter` | Reason |
|------|-----------------|--------|
| Avg Efficiency | `false` | Higher efficiency is better |
| Total Cases | `false` | More cases is better |
| Plan Variance | `false` | Positive variance (under budget) is better |
| Lost Hours | `true` | Fewer lost hours is better |

**Comparison computation** (after Story 7.2 provides previous data):
```typescript
    // Compare current vs previous time period
    // changePct = ((current - previous) / |previous|) * 100
    const effChange = prevEff !== 0 ? ((currEff - prevEff) / Math.abs(prevEff)) * 100 : 0;
    const casesChange = prevCases !== 0 ? ((currCases - prevCases) / Math.abs(prevCases)) * 100 : 0;
    const varChange = prevVar !== 0 ? ((currVar - prevVar) / Math.abs(prevVar)) * 100 : 0;
    const lostHrsChange = prevLostHrs !== 0 ? ((currLostHrs - prevLostHrs) / Math.abs(prevLostHrs)) * 100 : 0;
```

**Before Story 7.2**, all `changePct` values default to `0` (gray badge with `→` arrow).

---

### AC 7.5.11: Responsive Layout (2 Columns on Desktop, 1 on Tablet)

- **Given** the `ProductionTrendsDashboard` renders all sections
- **When** the viewport width changes
- **Then** the layout adapts:
  - **Desktop (>= 1024px, `lg:` prefix):** KPI cards in 4 columns; charts in full width stacked
  - **Tablet (>= 768px, `md:` prefix):** KPI cards in 2 columns; charts full width stacked
  - **Mobile (< 768px):** KPI cards in 2 columns; charts full width stacked

**Full main layout return** (replaces placeholder in AC 7.5.4):
```tsx
    return (
        <div className="space-y-6 p-6">
            {/* Header row: title + granularity selector */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-lg font-semibold text-gray-800">Production Trends</h2>
                    <p className="text-sm text-gray-500">
                        {getComparisonLabel(appState.timeSelection.granularity)} comparison
                    </p>
                </div>
                <GranularitySelector
                    granularities={['day', 'week', 'period', 'year'] as TimeGranularity[]}
                    active={appState.timeSelection.granularity}
                    onChange={(g) => dispatch({ type: 'SET_GRANULARITY', payload: g })}
                />
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card 1: Avg Efficiency */}
                {/* Card 2: Total Cases */}
                {/* Card 3: Plan Variance */}
                {/* Card 4: Lost Hours */}
                {/* (Each card using exact structure from AC 7.5.6) */}
            </div>

            {/* Efficiency % Trend Chart */}
            <EfficiencyTrendChart data={trendData} height={350} />

            {/* Production Volume Chart */}
            <ProductionVolumeChart data={trendData} height={350} />

            {/* Variance Trend Chart */}
            <VarianceTrendChart data={trendData} height={300} />
        </div>
    );
```

**Tailwind breakpoint summary:**
- `grid-cols-2` = 2 columns by default (mobile + tablet)
- `lg:grid-cols-4` = 4 columns at >= 1024px (desktop)
- `sm:flex-row` = horizontal layout for header at >= 640px
- Charts are always full-width (`w-full` via their container divs)

---

### AC 7.5.12: Empty State When No Prod Pallets Data Exists

- **Given** the user has not uploaded any Prod Pallets file
- **When** `DataStore.getProdPallets()` returns `undefined`
- **Then** the component displays the empty state from AC 7.5.4
- **And** the empty state shows:
  - A large `📈` emoji (text-6xl)
  - Heading: "No Production Data Available" (text-xl font-semibold text-gray-700)
  - Description: "Please upload Prod Pallets data using the sidebar to view production trends." (text-gray-500)
  - The container is vertically centered at `h-96`

**Verification steps:**
1. Clear IndexedDB (`DataStore.clearAll()` in browser console)
2. Navigate to Production Trends page
3. Confirm empty state appears with correct text and styling
4. Upload a Prod Pallets file
5. Confirm the dashboard renders with data

---

### AC 7.5.13: Loading Skeleton States While Data Loads

- **Given** the component is loading data from IndexedDB
- **When** `isLoading === true`
- **Then** the skeleton from AC 7.5.4 loading state is displayed
- **And** the skeleton matches the exact structure:
  - Header row with 2 pulsing rectangles (title + selector placeholder)
  - 4 card skeletons in a `grid grid-cols-2 lg:grid-cols-4 gap-4` grid
  - 3 chart skeletons stacked vertically (each 350px tall)
- **And** all skeleton elements use `bg-gray-200 rounded animate-pulse` classes
- **And** the transition from skeleton to real data is smooth (no layout shift)

**Verification steps:**
1. Add a `console.time('loadData')` before the `loadData()` call
2. Add a `console.timeEnd('loadData')` in the `finally` block
3. Confirm loading takes < 500ms for typical data sizes
4. Visually confirm skeleton appears and transitions smoothly

---

## Technical Implementation Plan

### Data Flow Diagram
```
┌──────────────┐     ┌────────────────────┐     ┌──────────────────────┐
│  IndexedDB   │────→│  DataStore          │────→│ ProductionTrends     │
│ (idb-keyval) │     │  .getProdPallets()  │     │ Dashboard.tsx        │
│              │     │  .getProdPalletsFor │     │                      │
│ prodPallets/ │     │  TimeSelection()    │     │  trendData[]         │
│ planSummary  │     │  (Story 7.2)        │     │  kpiSummary          │
│ totals       │     └────────────────────┘     └──────────┬───────────┘
│ production   │                                           │
└──────────────┘                                           │
                                                           ▼
                                          ┌─────────────────────────────┐
                                          │        Child Charts         │
                                          │                             │
                                          │  EfficiencyTrendChart       │
                                          │  ProductionVolumeChart      │
                                          │  VarianceTrendChart         │
                                          └─────────────────────────────┘
```

### Step-by-Step Build Order

| Step | AC | What to Do | Estimated Time |
|------|-----|-----------|----------------|
| 1 | AC 7.5.1 | Add `'production-trends'` to `PageId` union in `app-store.ts` | 2 min |
| 2 | AC 7.5.2 | Add nav item to `Sidebar.tsx` | 2 min |
| 3 | AC 7.5.3 | Add PAGE_TITLES + import + switch case in `page.tsx` | 5 min |
| 4 | AC 7.5.4 | Create `ProductionTrendsDashboard.tsx` shell + `index.ts` | 15 min |
| 5 | AC 7.5.12, 7.5.13 | Verify loading and empty states work | 5 min |
| 6 | AC 7.5.5 | Add data loading useEffect + trend computation | 20 min |
| 7 | AC 7.5.6 | Build 4 KPI summary cards with inline rendering | 20 min |
| 8 | AC 7.5.7 | Create `EfficiencyTrendChart.tsx` | 30 min |
| 9 | AC 7.5.8 | Create `ProductionVolumeChart.tsx` | 30 min |
| 10 | AC 7.5.9 | Create `VarianceTrendChart.tsx` | 30 min |
| 11 | AC 7.5.10 | Add comparison badges to KPI cards | 15 min |
| 12 | AC 7.5.11 | Verify responsive layout at all breakpoints | 10 min |

### Component Structure
```
src/components/production-trends/
├── ProductionTrendsDashboard.tsx     # Main container (AC 7.5.4, 7.5.5, 7.5.6, 7.5.10, 7.5.11)
├── EfficiencyTrendChart.tsx          # D3 line chart (AC 7.5.7)
├── ProductionVolumeChart.tsx         # D3 dual-axis bar chart (AC 7.5.8)
├── VarianceTrendChart.tsx            # D3 line chart with zero-ref (AC 7.5.9)
└── index.ts                         # Barrel export
```

### Files Modified
| File | Change |
|------|--------|
| `src/stores/app-store.ts` | Add `'production-trends'` to `PageId` union (line ~29) |
| `src/components/layout/Sidebar.tsx` | Add nav item object to `NAV_ITEMS` array (line ~30) |
| `src/app/page.tsx` | Add import, PAGE_TITLES entry, and switch case |

### Files Created
| File | Purpose |
|------|---------|
| `src/components/production-trends/ProductionTrendsDashboard.tsx` | Main dashboard component |
| `src/components/production-trends/EfficiencyTrendChart.tsx` | Efficiency trend line chart |
| `src/components/production-trends/ProductionVolumeChart.tsx` | Production volume dual-axis chart |
| `src/components/production-trends/VarianceTrendChart.tsx` | Variance trend chart with zero-ref |
| `src/components/production-trends/index.ts` | Barrel exports |

---

## Dependencies

### Runtime Dependencies (already installed)
| Package | Version | Usage |
|---------|---------|-------|
| `react` | 19.x | Component framework |
| `d3` | ^7.x | SVG chart rendering |
| `idb-keyval` | ^6.x | IndexedDB storage (via DataStore) |

### Story Dependencies
| Story | Status | What It Provides |
|-------|--------|------------------|
| Story 7.1 | REQUIRED | Date-keyed IndexedDB storage for Prod Pallets (multi-day retention) |
| Story 7.2 | REQUIRED | `DataStore.getProdPalletsForTimeSelection(ts)` method for querying by time range |
| Story 1.1 | Done | Project scaffold, Excel parsing, base types |
| Story 1.2 | Done | 4-4-5 fiscal calendar, aggregation engine |
| Cross-cutting | Done | `getTrendTimePoints()`, `GranularitySelector`, `TimeSelection` types |

---

## Existing Types Reference

### From `src/types/prod-pallets.ts`:
```typescript
interface PlanSummaryRow {
    line: string;
    lineLeader: string;
    availHrs: number;
    earnedAtPlan: number;
    lostHrsVPlan: number;
    totalVarPounds: number;
    meatVarPounds: number;
    lbrVarPounds: number;
    repackPct: number;
    gwayPct: number;
    efficPct: number;
}

interface TotProdRow {
    code: string;
    description: string;
    cases: number;
    kg: number;
    packets: number;
}

interface ProdPalletsData {
    production: ProdRow[];
    shiftReportData: ShiftReportDataRow[];
    planSummary: PlanSummaryRow[];
    productMaster: ProductMasterRow[];
    schedule: SchedRow[];
    totals: TotProdRow[];
    variances: VarianceRow[];
    prodEfficiency: ProdEfficiencyRow[];
    summaryEfficiency: SummaryEfficiencyRow[];
    detail: DetailRow[];
    review: ReviewRow[];
    yields: YieldsRow[];
}
```

### From `src/lib/time-selection/types.ts`:
```typescript
type TimeGranularity = 'day' | 'week' | 'period' | 'year';

interface TimeSelection {
    granularity: TimeGranularity;
    selectedDay?: string;
    selectedWeek: string;
    selectedPeriod?: {
        period: number;
        fiscalYear: number;
        startDate: Date;
        endDate: Date;
        label: string;
    };
    selectedYear?: number;
}
```

### From `src/lib/time-selection/time-utils.ts`:
```typescript
function getTrendTimePoints(ts: TimeSelection): string[];
function getTimeSelectionKey(ts: TimeSelection): string;
function getComparisonLabel(granularity: TimeGranularity): string;
```

### From `src/stores/app-store.ts`:
```typescript
function useAppState(): AppState;
function useAppDispatch(): React.Dispatch<AppAction>;
// AppAction includes: { type: 'SET_GRANULARITY'; payload: TimeGranularity }
```

---

## Design Tokens (Consistent with Existing Dashboard)

| Token | Value | Usage |
|-------|-------|-------|
| Card background | `bg-white` | All card containers |
| Card border radius | `rounded-xl` | All card containers |
| Card shadow | `shadow-sm` | Default, `shadow-md` on hover |
| Card padding | `p-5` | All card containers |
| KPI value text | `text-3xl font-bold text-gray-800` | Large metric values |
| KPI label text | `text-xs font-medium uppercase tracking-wide text-gray-500` | Card labels |
| Chart title text | `text-sm font-semibold text-gray-700` | Section headings |
| Primary purple | `#6C5CE7` | Lines, bars, gradient fills |
| Teal (positive) | `#00D2D3` | Good values, above target |
| Red (negative) | `#FF6B6B` | Bad values, below target |
| Muted text | `#636E72` | Axis labels, secondary text |
| Grid lines | `#E9ECEF` | Chart grid, axis lines |
| Badge good | `bg-emerald-100 text-emerald-700` | Positive change |
| Badge bad | `bg-rose-100 text-rose-700` | Negative change |
| Badge neutral | `bg-gray-100 text-gray-600` | No change |

---

## Testing / Verification

### Manual Test Checklist

- [ ] **Navigation:** Click "Production Trends" in sidebar under Production category -- page loads
- [ ] **Empty state:** Clear all data, navigate to page -- shows "No Production Data Available" message
- [ ] **Loading state:** Upload file -- skeleton appears briefly then transitions to data view
- [ ] **KPI Cards:** 4 cards display with correct values from Prod Pallets data
  - [ ] Avg Efficiency shows weighted average of `efficPct` by `availHrs`
  - [ ] Total Cases shows sum of `cases` from `totals`
  - [ ] Plan Variance shows sum of `totalVarPounds` with `£` prefix and `+/-` sign
  - [ ] Lost Hours shows sum of `lostHrsVPlan` with "hrs" suffix
- [ ] **Efficiency chart:** Line chart renders with correct Y-axis (percentage format)
- [ ] **Volume chart:** Bars (Cases) on left axis, KG line on right axis
- [ ] **Variance chart:** Zero reference line at `£0`, green above / red below
- [ ] **Tooltips:** Hover over data points shows tooltip with exact value
- [ ] **Granularity selector:** Day / Week / Period / Year toggle renders and dispatches action
- [ ] **Responsive:** At 1024px+ -- 4 KPI cards in a row; at 768px -- 2 cards per row
- [ ] **No console errors:** Check browser console for any React or D3 errors
- [ ] **Page title:** Header shows "Production Trends" with correct subtitle

### Cross-Reference Validation

| Value | Source | Formula |
|-------|--------|---------|
| Avg Efficiency | `planSummary[]` | `sum(efficPct * availHrs) / sum(availHrs)` |
| Total Cases | `totals[]` | `sum(cases)` |
| Total KG | `totals[]` | `sum(kg)` |
| Variance GBP | `planSummary[]` | `sum(totalVarPounds)` |
| Lost Hours | `planSummary[]` | `sum(lostHrsVPlan)` |

### Data Integrity Checks
1. Load Prod Pallets Excel file
2. Open browser DevTools Console
3. Run: `await DataStore.getProdPallets().then(pp => console.log('planSummary rows:', pp?.planSummary.length, 'totals rows:', pp?.totals.length))`
4. Verify row counts match the Excel sheet
5. Manually compute efficiency from Excel `PlnSmy` sheet and compare with dashboard value

---

## Definition of Done
- [ ] All 13 acceptance criteria pass
- [ ] `'production-trends'` added to `PageId` union in `app-store.ts`
- [ ] Navigation item appears in sidebar under Production category
- [ ] Page loads via sidebar navigation with correct header title
- [ ] 4 KPI summary cards display correct values from Prod Pallets
- [ ] Efficiency % trend line chart renders with D3.js
- [ ] Production volume dual-axis chart renders (bars + line)
- [ ] Variance trend chart renders with zero reference line
- [ ] Comparison badges show on KPI cards (neutral until Story 7.2)
- [ ] Responsive layout works at desktop, tablet, and mobile widths
- [ ] Empty state displays when no Prod Pallets data exists
- [ ] Loading skeletons display during data load
- [ ] No console errors, no layout shift during loading transition
- [ ] Code follows existing patterns from `OverviewDashboard.tsx` and `WeeklyTrendChart.tsx`
