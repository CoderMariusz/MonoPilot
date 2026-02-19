# Story 7.6: Weekly Production Report (NEW PAGE)

## Story Overview
**Epic**: Production Reports
**Priority**: High
**Estimated Effort**: 3-4 development sessions
**Dependencies**: Story 7.1 (date-keyed storage), Story 7.2 (multi-day query methods: `getProdPalletsForWeek()`, `getProdPalletsForDateRange()`), Story 1.1 (Project Scaffold & Excel Parsing)

### User Story
> As a **Manager**, I want a **one-click printable weekly production summary** that loads 5-7 days of Prod Pallets data for a selected week, shows daily breakdowns with KPIs, highlights top and bottom performing lines, and compares against the previous week, so that I can **replace the manual Excel-based weekly report and have it ready for management meetings**.

---

## Dependencies & Prerequisites

### Required Stories (must be complete)
| Story | What It Provides |
|-------|------------------|
| Story 7.1 | Date-keyed IndexedDB storage for Prod Pallets (`prodPallets/{YYYY-MM-DD}/...`) |
| Story 7.2 | `getProdPalletsForDate(date)`, `getProdPalletsForWeek(weekEnding)`, `getProdPalletsForDateRange(start, end)` methods on `DataStore` |
| Story 1.1 | Project scaffold, Excel parsing infrastructure, `DataStore`, `app-store` |

### Required Data Sources
| Data Source | Sheet | Key Fields Used |
|-------------|-------|-----------------|
| Prod Pallets | `PlnSmy` (Plan Summary) | `line`, `lineLeader`, `availHrs`, `earnedAtPlan`, `lostHrsVPlan`, `totalVarPounds`, `efficPct`, `repackPct`, `gwayPct` |
| Prod Pallets | `TOT Prod` (Total Production) | `code`, `description`, `cases`, `kg`, `packets` |
| Prod Pallets | `PROD` (Production Log) | `line`, `code`, `description`, `boxes`, `kg` |

### Required Types (already defined)
- `PlanSummaryRow` from `src/types/prod-pallets.ts`
- `TotProdRow` from `src/types/prod-pallets.ts`
- `ProdRow` from `src/types/prod-pallets.ts`
- `ProdPalletsData` from `src/types/prod-pallets.ts`
- `PageId` from `src/stores/app-store.ts`

---

## Page Layout

```
+--------------------------------------------------------------+
| Weekly Production Report          [Week Selector v] [Print]  |
|                                   [Copy to Clipboard]        |
+--------------------------------------------------------------+
| Week Ending: Saturday 15 Feb 2026                            |
| Report Generated: 12 Feb 2026                                |
+--------------------------------------------------------------+
| WEEKLY SUMMARY                                               |
| +------------+ +------------+ +------------+ +------------+  |
| |Total Cases  | |Total KG    | |Avg Effic % | |Total Var $ |  |
| |  62,250     | |  187,400   | |  76.3%     | |  -L11,700  |  |
| | vs prev: +5%| | vs prev: -2| | vs prev: +1| | vs prev: +L|  |
| +------------+ +------------+ +------------+ +------------+  |
+--------------------------------------------------------------+
| DAILY BREAKDOWN                                              |
| +--------------------------------------------------------+   |
| | Day    | Cases  | KG     | Effic %| Var L  | Lines |   |   |
| | Mon    | 12,400 | 37,200 | 74.2%  |-L2,800 | 12    |   |   |
| | Tue    | 13,100 | 39,300 | 77.1%  |-L2,100 | 12    |   |   |
| | Wed    | 12,800 | 38,400 | 76.5%  |-L2,500 | 11    |   |   |
| | Thu    | 12,950 | 38,850 | 77.8%  |-L2,200 | 12    |   |   |
| | Fri    | 11,000 | 33,650 | 75.9%  |-L2,100 | 10    |   |   |
| | TOTAL  | 62,250 |187,400 | 76.3%  |-L11,700|       |   |   |
| +--------------------------------------------------------+   |
+--------------------------------------------------------------+
| TOP 3 PERFORMING LINES (by Efficiency %)                     |
|  1. L22 -- 89.2% (Leader: J.Smith)   Var: +L450             |
|  2. L17 -- 87.1% (Leader: A.Jones)   Var: +L320             |
|  3. L14 -- 85.8% (Leader: M.Brown)   Var: +L280             |
|                                                              |
| BOTTOM 3 PERFORMING LINES                                    |
|  1. L08 -- 62.1% (Leader: K.Davis)   Var: -L1,200           |
|  2. L03 -- 64.5% (Leader: P.Wilson)  Var: -L980             |
|  3. L11 -- 66.2% (Leader: R.Taylor)  Var: -L870             |
+--------------------------------------------------------------+
| PLAN ACCURACY                                                |
|  Planned Cases: 65,000  |  Actual: 62,250  |  Accuracy: 95.8|
|  Planned Hours: 840     |  Actual Earned: 640  |  Lost: 200  |
+--------------------------------------------------------------+
```

---

## Acceptance Criteria

### AC 7.6.1: Add `'weekly-report'` to PageId Union in app-store.ts

- **Given** the file `src/stores/app-store.ts` exists and contains the `PageId` type union
- **When** the developer opens `src/stores/app-store.ts`
- **Then** the developer adds `| 'weekly-report'` to the end of the `PageId` type union

**Exact change in `src/stores/app-store.ts`:**

Find this block (around line 13-29):
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

Add this line before the closing semicolon:
```typescript
    | 'weekly-report';
```

So `'product-master'` becomes `'product-master'` (no semicolon) and a new line `| 'weekly-report';` is added below it.

**Verification:** TypeScript compiles without errors. The type `PageId` now includes `'weekly-report'`.

---

### AC 7.6.2: Add "Weekly Report" Nav Item to Sidebar.tsx Under Production Category

- **Given** the file `src/components/layout/Sidebar.tsx` exists and contains the `NAV_ITEMS` array
- **When** the developer opens `src/components/layout/Sidebar.tsx`
- **Then** the developer adds a new nav item object to the `NAV_ITEMS` array under the `'Production'` category

**Exact change in `src/components/layout/Sidebar.tsx`:**

Find the `NAV_ITEMS` array (around line 12-30). After the line:
```typescript
    { id: 'product-master', label: 'Product Master', icon: '📖', path: '/product-master', category: 'Production' },
```

Add this new line immediately after it (still inside the `NAV_ITEMS` array):
```typescript
    { id: 'weekly-report', label: 'Weekly Report', icon: '📊', path: '/weekly-report', category: 'Production' },
```

**Verification:** The sidebar now shows "Weekly Report" under the "Production" category heading. Clicking it dispatches `SET_PAGE` with payload `'weekly-report'`.

---

### AC 7.6.3: Add PAGE_TITLES Entry and Switch Case in page.tsx

- **Given** the file `src/app/page.tsx` exists and contains `PAGE_TITLES` and the `PageContent` component
- **When** the developer opens `src/app/page.tsx`
- **Then** the developer makes THREE changes:

**Change 1: Add import statement.**

Find the import block at the top of the file. After this line:
```typescript
import {
    ProductionLogPage,
    EfficiencyByLinePage,
    EfficiencyByLeaderPage,
    PlanSummaryPage,
    ProductionSchedulePage,
    TotalProductionPage,
    ProductMasterPage,
} from '@/components/production';
```

Add this new import line immediately after:
```typescript
import { WeeklyProductionReport } from '@/components/weekly-report/WeeklyProductionReport';
```

**Change 2: Add PAGE_TITLES entry.**

Find the `PAGE_TITLES` object (around line 37-54). After the line:
```typescript
    'product-master': { title: '📖 Product Master', subtitle: 'Reference data: codes, flow rates, pack sizes' },
```

Add this new line:
```typescript
    'weekly-report': { title: '📊 Weekly Report', subtitle: 'Printable weekly production summary' },
```

**Change 3: Add switch case in PageContent.**

Find the `PageContent` function (around line 275). Inside the `switch (activePage)` block, after this case:
```typescript
        case 'product-master':
            return <ProductMasterPage />;
```

Add this new case before the `default:`:
```typescript
        case 'weekly-report':
            return <WeeklyProductionReport />;
```

**Verification:** Navigating to "Weekly Report" in the sidebar renders the `WeeklyProductionReport` component. The header shows the title "Weekly Report" and subtitle "Printable weekly production summary".

---

### AC 7.6.4: Create `WeeklyProductionReport.tsx` Component Shell with Week Selector

- **Given** the directory `src/components/weekly-report/` does not yet exist
- **When** the developer creates the component
- **Then** the developer creates the directory `src/components/weekly-report/` and the file `src/components/weekly-report/WeeklyProductionReport.tsx`

**File: `src/components/weekly-report/WeeklyProductionReport.tsx`**

This is the main component shell. It must:

1. **Import these modules:**
```typescript
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DataStore } from '@/stores/data-store';
import type {
    ProdPalletsData,
    PlanSummaryRow,
    TotProdRow,
    ProdRow,
} from '@/types/prod-pallets';
```

2. **Define a local interface `WeekOption`:**
```typescript
interface WeekOption {
    /** The Saturday date string for this week ending, format: 'YYYY-MM-DD' */
    weekEnding: string;
    /** Display label, format: 'W/E DD/MM/YYYY' */
    label: string;
}
```

3. **Define a local interface `DailySnapshot`:**
```typescript
/** One day's worth of Prod Pallets data */
interface DailySnapshot {
    /** Date string 'YYYY-MM-DD' */
    date: string;
    /** Day name: 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun' */
    dayName: string;
    /** PlanSummary rows for this day */
    planSummary: PlanSummaryRow[];
    /** TotProd rows for this day */
    totals: TotProdRow[];
    /** Production (PROD) rows for this day */
    production: ProdRow[];
}
```

4. **Define a local interface `WeeklyReportData`:**
```typescript
interface WeeklyReportData {
    /** The week ending date string 'YYYY-MM-DD' */
    weekEnding: string;
    /** Array of daily snapshots, one per loaded day (Mon-Fri typically) */
    days: DailySnapshot[];
    /** Merged PlanSummary across all days (for weekly totals) */
    mergedPlanSummary: PlanSummaryRow[];
    /** Merged TotProd across all days (for weekly totals) */
    mergedTotals: TotProdRow[];
    /** Previous week data for comparison (same structure) */
    previousWeek: {
        mergedPlanSummary: PlanSummaryRow[];
        mergedTotals: TotProdRow[];
    } | null;
}
```

5. **Export the component function:**
```typescript
export function WeeklyProductionReport(): React.ReactElement {
```

6. **Declare state variables inside the function:**
```typescript
    const [isLoading, setIsLoading] = useState(true);
    const [availableWeeks, setAvailableWeeks] = useState<WeekOption[]>([]);
    const [selectedWeek, setSelectedWeek] = useState<string>('');
    const [reportData, setReportData] = useState<WeeklyReportData | null>(null);
```

7. **On mount, load available weeks from `DataStore`:**
```typescript
    useEffect(() => {
        async function loadAvailableWeeks() {
            // Story 7.2 provides getProdPalletsWeekEndings()
            // which returns string[] of available week-ending dates
            // sorted descending (most recent first).
            // Fallback: use DataStore.getDistinctWeeks() if that method
            // is not yet available.
            try {
                const weeks = await DataStore.getDistinctWeeks();
                const options: WeekOption[] = weeks.map((w) => {
                    const d = new Date(w);
                    const label = `W/E ${d.toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                    })}`;
                    return { weekEnding: w, label };
                });
                setAvailableWeeks(options);
                if (options.length > 0) {
                    setSelectedWeek(options[0].weekEnding);
                }
            } catch (error) {
                console.error('Failed to load available weeks:', error);
            }
        }
        loadAvailableWeeks();
    }, []);
```

8. **Render a `<select>` dropdown for week selection:**
```typescript
    return (
        <div className="space-y-6">
            {/* Header row with week selector and action buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-lg font-bold text-text">Weekly Production Report</h2>
                    {reportData && (
                        <p className="text-xs text-text-secondary mt-1">
                            Report Generated: {new Date().toLocaleDateString('en-GB', {
                                day: 'numeric', month: 'short', year: 'numeric',
                            })}
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    {/* Week selector dropdown */}
                    <select
                        value={selectedWeek}
                        onChange={(e) => setSelectedWeek(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                        {availableWeeks.map((w) => (
                            <option key={w.weekEnding} value={w.weekEnding}>
                                {w.label}
                            </option>
                        ))}
                    </select>
                    {/* Print and Copy buttons will be added in AC 7.6.11 and AC 7.6.12 */}
                </div>
            </div>

            {/* Report body sections will be added in AC 7.6.6 through AC 7.6.10 */}
        </div>
    );
```

9. **Also create the barrel export file `src/components/weekly-report/index.ts`:**
```typescript
export { WeeklyProductionReport } from './WeeklyProductionReport';
```

**Verification:** The page renders with the header "Weekly Production Report", a `<select>` dropdown of available weeks, and auto-selects the most recent week. No data sections are rendered yet (they are added in subsequent ACs).

---

### AC 7.6.5: Implement Weekly Data Loading (Load Each Day Mon-Fri Individually + Merged Week)

- **Given** the `WeeklyProductionReport` component exists from AC 7.6.4
- **When** the user selects a week from the dropdown (or on first load)
- **Then** the component loads data for each day (Monday through Friday) of the selected week individually, AND loads a merged week dataset, AND loads the previous week for comparison

**Implementation details in `WeeklyProductionReport.tsx`:**

1. **Add a helper function `getWeekDays` above the component (but inside the file, after imports):**
```typescript
/**
 * Given a week-ending date (Saturday), return an array of date strings
 * for Monday through Friday of that week.
 * @param weekEndingSaturday - ISO date string 'YYYY-MM-DD' of the Saturday
 * @returns Array of 5 date strings ['YYYY-MM-DD', ...] for Mon-Fri
 */
function getWeekDays(weekEndingSaturday: string): string[] {
    const sat = new Date(weekEndingSaturday + 'T12:00:00');
    const days: string[] = [];
    // Saturday is day 6, Monday is day 1
    // Monday = Saturday - 5 days
    for (let offset = 5; offset >= 1; offset--) {
        const d = new Date(sat);
        d.setDate(sat.getDate() - offset);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        days.push(`${yyyy}-${mm}-${dd}`);
    }
    return days; // ['Mon date', 'Tue date', 'Wed date', 'Thu date', 'Fri date']
}
```

2. **Add a helper function `getDayName`:**
```typescript
/**
 * Return short day name ('Mon', 'Tue', ...) for a date string.
 * @param dateStr - ISO date string 'YYYY-MM-DD'
 * @returns Short day name like 'Mon'
 */
function getDayName(dateStr: string): string {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-GB', { weekday: 'short' });
}
```

3. **Add a helper function `getPreviousWeekEnding`:**
```typescript
/**
 * Given a week-ending Saturday, return the previous week's Saturday.
 * @param weekEnding - ISO date string 'YYYY-MM-DD' of the current Saturday
 * @returns ISO date string 'YYYY-MM-DD' of the previous Saturday
 */
function getPreviousWeekEnding(weekEnding: string): string {
    const d = new Date(weekEnding + 'T12:00:00');
    d.setDate(d.getDate() - 7);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}
```

4. **Add a `useEffect` that triggers data loading whenever `selectedWeek` changes:**
```typescript
    useEffect(() => {
        if (!selectedWeek) return;

        async function loadWeekData() {
            setIsLoading(true);
            try {
                const weekDays = getWeekDays(selectedWeek);
                const dailySnapshots: DailySnapshot[] = [];

                // Load each day individually
                for (const dateStr of weekDays) {
                    // Story 7.2 method: getProdPalletsForDate(dateStr)
                    // Returns ProdPalletsData | undefined
                    const dayData = await DataStore.getProdPalletsForDate(dateStr);
                    if (dayData) {
                        dailySnapshots.push({
                            date: dateStr,
                            dayName: getDayName(dateStr),
                            planSummary: dayData.planSummary || [],
                            totals: dayData.totals || [],
                            production: dayData.production || [],
                        });
                    }
                }

                // Load merged week data (all days combined)
                // Story 7.2 method: getProdPalletsForWeek(weekEnding)
                const mergedWeek = await DataStore.getProdPalletsForWeek(selectedWeek);

                // Load previous week for comparison
                const prevWeekEnding = getPreviousWeekEnding(selectedWeek);
                const prevWeekData = await DataStore.getProdPalletsForWeek(prevWeekEnding);

                const reportData: WeeklyReportData = {
                    weekEnding: selectedWeek,
                    days: dailySnapshots,
                    mergedPlanSummary: mergedWeek?.planSummary || [],
                    mergedTotals: mergedWeek?.totals || [],
                    previousWeek: prevWeekData
                        ? {
                            mergedPlanSummary: prevWeekData.planSummary || [],
                            mergedTotals: prevWeekData.totals || [],
                        }
                        : null,
                };

                setReportData(reportData);
            } catch (error) {
                console.error('Failed to load weekly report data:', error);
                setReportData(null);
            } finally {
                setIsLoading(false);
            }
        }

        loadWeekData();
    }, [selectedWeek]);
```

**NOTE on `DataStore` methods:** This AC depends on Story 7.2 providing:
- `DataStore.getProdPalletsForDate(dateStr: string): Promise<ProdPalletsData | undefined>` -- loads a single day's Prod Pallets snapshot from IndexedDB key `prodPallets/{YYYY-MM-DD}/...`
- `DataStore.getProdPalletsForWeek(weekEnding: string): Promise<ProdPalletsData | undefined>` -- loads and merges Mon-Fri data for the given week ending Saturday

If Story 7.2 is not yet implemented, use `DataStore.getProdPallets()` as a fallback (loads the single most recently uploaded Prod Pallets file). In that case, populate `days` as a single-day array and `mergedPlanSummary`/`mergedTotals` from the same data, with `previousWeek` set to `null`.

**Verification:** After selecting a week, `reportData` is populated with `days` array containing 0-5 `DailySnapshot` entries, `mergedPlanSummary` and `mergedTotals` arrays, and optionally `previousWeek`. The `isLoading` state correctly transitions from `true` to `false`. Console logging confirms data was loaded.

---

### AC 7.6.6: Implement Weekly Summary KPI Cards (Total Cases, Total KG, Avg Efficiency, Total Variance)

- **Given** `reportData` is loaded and not null (from AC 7.6.5)
- **When** the Weekly Summary section renders
- **Then** 4 KPI summary cards are displayed in a single row

**Implementation details:**

1. **Add a `useMemo` to compute weekly summary KPIs from `reportData`:**
```typescript
    /** Computed weekly summary KPIs */
    const weeklySummary = useMemo(() => {
        if (!reportData) return null;

        const { mergedPlanSummary, mergedTotals } = reportData;

        // Total Cases: sum of all TotProdRow.cases
        const totalCases = mergedTotals.reduce(
            (sum, row) => sum + (row.cases || 0), 0
        );

        // Total KG: sum of all TotProdRow.kg
        const totalKg = mergedTotals.reduce(
            (sum, row) => sum + (row.kg || 0), 0
        );

        // Average Efficiency %: simple average of all PlanSummaryRow.efficPct
        // (Only include rows where efficPct > 0 to avoid blank lines skewing average)
        const efficRows = mergedPlanSummary.filter((r) => r.efficPct > 0);
        const avgEfficPct = efficRows.length > 0
            ? efficRows.reduce((sum, r) => sum + r.efficPct, 0) / efficRows.length
            : 0;

        // Total Variance GBP: sum of all PlanSummaryRow.totalVarPounds
        const totalVarPounds = mergedPlanSummary.reduce(
            (sum, r) => sum + (r.totalVarPounds || 0), 0
        );

        return { totalCases, totalKg, avgEfficPct, totalVarPounds };
    }, [reportData]);
```

2. **Render 4 KPI cards in the JSX, inside the `<div className="space-y-6">` return block, after the header row:**
```typescript
            {/* Weekly Summary KPI Cards */}
            {weeklySummary && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1: Total Cases */}
                    <div className="card p-5">
                        <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                            Total Cases
                        </p>
                        <p className="text-2xl font-bold text-text mt-1">
                            {weeklySummary.totalCases.toLocaleString('en-GB')}
                        </p>
                        {/* Week-over-week badge added in AC 7.6.7 */}
                    </div>

                    {/* Card 2: Total KG */}
                    <div className="card p-5">
                        <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                            Total KG
                        </p>
                        <p className="text-2xl font-bold text-text mt-1">
                            {weeklySummary.totalKg.toLocaleString('en-GB', { maximumFractionDigits: 0 })}
                        </p>
                    </div>

                    {/* Card 3: Avg Efficiency */}
                    <div className="card p-5">
                        <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                            Avg Efficiency %
                        </p>
                        <p className="text-2xl font-bold text-text mt-1">
                            {weeklySummary.avgEfficPct.toFixed(1)}%
                        </p>
                    </div>

                    {/* Card 4: Total Variance */}
                    <div className="card p-5">
                        <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                            Total Variance
                        </p>
                        <p className={`text-2xl font-bold mt-1 ${
                            weeklySummary.totalVarPounds >= 0 ? 'text-success' : 'text-danger'
                        }`}>
                            {weeklySummary.totalVarPounds >= 0 ? '+' : '-'}
                            {'\u00A3'}{Math.abs(weeklySummary.totalVarPounds).toLocaleString('en-GB', { maximumFractionDigits: 0 })}
                        </p>
                    </div>
                </div>
            )}
```

**Tailwind classes used:**
- `card` -- project utility class (white bg, rounded, shadow)
- `p-5` -- 20px padding
- `text-[11px]` -- 11px font size for label
- `text-2xl font-bold` -- large bold value
- `text-text-muted` / `text-text` / `text-success` / `text-danger` -- project color tokens
- `grid grid-cols-2 lg:grid-cols-4 gap-4` -- 2 columns on mobile, 4 on desktop

**Verification:** 4 KPI cards appear below the header. Each shows the correct label and value. Total Cases = sum of `mergedTotals[].cases`. Total KG = sum of `mergedTotals[].kg`. Avg Efficiency = mean of `mergedPlanSummary[].efficPct` (excluding zeros). Total Variance = sum of `mergedPlanSummary[].totalVarPounds`.

---

### AC 7.6.7: Implement Week-over-Week Comparison (% Change vs Previous Week)

- **Given** `reportData` contains both current week and `previousWeek` data
- **When** the Weekly Summary KPI cards render
- **Then** each card shows a colored badge with the percentage change vs the previous week

**Implementation details:**

1. **Add a `useMemo` to compute previous week KPIs:**
```typescript
    /** Computed previous week summary KPIs (for comparison) */
    const previousWeekSummary = useMemo(() => {
        if (!reportData?.previousWeek) return null;

        const { mergedPlanSummary, mergedTotals } = reportData.previousWeek;

        const totalCases = mergedTotals.reduce(
            (sum, row) => sum + (row.cases || 0), 0
        );
        const totalKg = mergedTotals.reduce(
            (sum, row) => sum + (row.kg || 0), 0
        );
        const efficRows = mergedPlanSummary.filter((r) => r.efficPct > 0);
        const avgEfficPct = efficRows.length > 0
            ? efficRows.reduce((sum, r) => sum + r.efficPct, 0) / efficRows.length
            : 0;
        const totalVarPounds = mergedPlanSummary.reduce(
            (sum, r) => sum + (r.totalVarPounds || 0), 0
        );

        return { totalCases, totalKg, avgEfficPct, totalVarPounds };
    }, [reportData]);
```

2. **Add a helper function `calcChange` above the component:**
```typescript
/**
 * Calculate percentage change between current and previous values.
 * @param current - Current period value
 * @param previous - Previous period value
 * @returns Object with: pctChange (number), direction ('up'|'down'|'flat'), label (string like '+5.2%')
 */
function calcChange(
    current: number,
    previous: number
): { pctChange: number; direction: 'up' | 'down' | 'flat'; label: string } {
    if (previous === 0 && current === 0) {
        return { pctChange: 0, direction: 'flat', label: '0.0%' };
    }
    if (previous === 0) {
        return { pctChange: 100, direction: 'up', label: '+100%' };
    }
    const pctChange = ((current - previous) / Math.abs(previous)) * 100;
    const direction: 'up' | 'down' | 'flat' =
        pctChange > 0.05 ? 'up' : pctChange < -0.05 ? 'down' : 'flat';
    const sign = pctChange >= 0 ? '+' : '';
    const label = `${sign}${pctChange.toFixed(1)}%`;
    return { pctChange, direction, label };
}
```

3. **Add a reusable `WoWBadge` inline sub-component inside the file (above the main component):**
```typescript
/**
 * Week-over-week change badge. Shows colored pill with arrow.
 * Green for improvement, red for decline, gray for flat.
 */
function WoWBadge({ current, previous, invertColor = false }: {
    current: number;
    previous: number;
    /** If true, negative change is green (e.g., variance going less negative is good) */
    invertColor?: boolean;
}) {
    const { direction, label } = calcChange(current, previous);

    let colorClass: string;
    if (direction === 'flat') {
        colorClass = 'bg-gray-100 text-gray-600';
    } else if (direction === 'up') {
        colorClass = invertColor
            ? 'bg-red-100 text-red-700'
            : 'bg-emerald-100 text-emerald-700';
    } else {
        colorClass = invertColor
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-red-100 text-red-700';
    }

    const arrow = direction === 'up' ? '\u2197' : direction === 'down' ? '\u2198' : '\u2192';

    return (
        <span className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[11px] font-semibold ${colorClass}`}>
            {arrow} {label} vs prev
        </span>
    );
}
```

4. **Update each KPI card to include a `<WoWBadge>` below the value. Example for Total Cases card:**
```typescript
                    <div className="card p-5">
                        <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                            Total Cases
                        </p>
                        <p className="text-2xl font-bold text-text mt-1">
                            {weeklySummary.totalCases.toLocaleString('en-GB')}
                        </p>
                        {previousWeekSummary && (
                            <WoWBadge
                                current={weeklySummary.totalCases}
                                previous={previousWeekSummary.totalCases}
                            />
                        )}
                    </div>
```

Repeat for:
- **Total KG:** `current={weeklySummary.totalKg}` `previous={previousWeekSummary.totalKg}`
- **Avg Efficiency:** `current={weeklySummary.avgEfficPct}` `previous={previousWeekSummary.avgEfficPct}`
- **Total Variance:** `current={weeklySummary.totalVarPounds}` `previous={previousWeekSummary.totalVarPounds}` with `invertColor={true}` (because less negative variance is good)

**Verification:** Each KPI card shows a colored pill badge below the value. The badge is green with upward arrow when the current value is better than previous. The badge is red with downward arrow when current value is worse. For the variance card, `invertColor={true}` means that a less negative variance shows green.

---

### AC 7.6.8: Implement Daily Breakdown Table (Mon-Fri Rows + TOTAL Footer)

- **Given** `reportData.days` contains 0-5 `DailySnapshot` entries
- **When** the Daily Breakdown section renders
- **Then** a table shows one row per day (Mon-Fri), plus a TOTAL footer row

**Implementation details:**

1. **Add a `useMemo` to compute daily row data:**
```typescript
    /** Computed daily breakdown rows */
    const dailyRows = useMemo(() => {
        if (!reportData) return [];

        return reportData.days.map((day) => {
            const totalCases = day.totals.reduce((sum, r) => sum + (r.cases || 0), 0);
            const totalKg = day.totals.reduce((sum, r) => sum + (r.kg || 0), 0);
            const efficRows = day.planSummary.filter((r) => r.efficPct > 0);
            const avgEffic = efficRows.length > 0
                ? efficRows.reduce((sum, r) => sum + r.efficPct, 0) / efficRows.length
                : 0;
            const totalVar = day.planSummary.reduce(
                (sum, r) => sum + (r.totalVarPounds || 0), 0
            );
            const linesRun = new Set(day.planSummary.map((r) => r.line)).size;

            return {
                date: day.date,
                dayName: day.dayName,
                totalCases,
                totalKg,
                avgEffic,
                totalVar,
                linesRun,
            };
        });
    }, [reportData]);
```

2. **Render the daily breakdown table in the JSX, below the KPI cards:**
```typescript
            {/* Daily Breakdown Table */}
            {dailyRows.length > 0 && (
                <div className="card overflow-hidden">
                    <div className="px-6 py-4 border-b border-border">
                        <h3 className="text-sm font-semibold text-text">Daily Breakdown</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-surface-page border-b border-border">
                                    <th className="px-4 py-3 text-left font-semibold text-text-secondary">Day</th>
                                    <th className="px-4 py-3 text-right font-semibold text-text-secondary">Cases</th>
                                    <th className="px-4 py-3 text-right font-semibold text-text-secondary">KG</th>
                                    <th className="px-4 py-3 text-right font-semibold text-text-secondary">Effic %</th>
                                    <th className="px-4 py-3 text-right font-semibold text-text-secondary">Var GBP</th>
                                    <th className="px-4 py-3 text-right font-semibold text-text-secondary">Lines</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dailyRows.map((row) => (
                                    <tr key={row.date} className="border-b border-border hover:bg-surface-page/50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-text">{row.dayName}</td>
                                        <td className="px-4 py-3 text-right text-text tabular-nums">
                                            {row.totalCases.toLocaleString('en-GB')}
                                        </td>
                                        <td className="px-4 py-3 text-right text-text tabular-nums">
                                            {row.totalKg.toLocaleString('en-GB', { maximumFractionDigits: 0 })}
                                        </td>
                                        <td className="px-4 py-3 text-right text-text tabular-nums">
                                            {row.avgEffic.toFixed(1)}%
                                        </td>
                                        <td className={`px-4 py-3 text-right tabular-nums ${
                                            row.totalVar >= 0 ? 'text-success' : 'text-danger'
                                        }`}>
                                            {row.totalVar >= 0 ? '+' : '-'}
                                            {'\u00A3'}{Math.abs(row.totalVar).toLocaleString('en-GB', { maximumFractionDigits: 0 })}
                                        </td>
                                        <td className="px-4 py-3 text-right text-text tabular-nums">
                                            {row.linesRun}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            {/* TOTAL footer row */}
                            {weeklySummary && (
                                <tfoot>
                                    <tr className="bg-surface-page border-t-2 border-border font-bold">
                                        <td className="px-4 py-3 text-text">TOTAL</td>
                                        <td className="px-4 py-3 text-right text-text tabular-nums">
                                            {weeklySummary.totalCases.toLocaleString('en-GB')}
                                        </td>
                                        <td className="px-4 py-3 text-right text-text tabular-nums">
                                            {weeklySummary.totalKg.toLocaleString('en-GB', { maximumFractionDigits: 0 })}
                                        </td>
                                        <td className="px-4 py-3 text-right text-text tabular-nums">
                                            {weeklySummary.avgEfficPct.toFixed(1)}%
                                        </td>
                                        <td className={`px-4 py-3 text-right tabular-nums ${
                                            weeklySummary.totalVarPounds >= 0 ? 'text-success' : 'text-danger'
                                        }`}>
                                            {weeklySummary.totalVarPounds >= 0 ? '+' : '-'}
                                            {'\u00A3'}{Math.abs(weeklySummary.totalVarPounds).toLocaleString('en-GB', { maximumFractionDigits: 0 })}
                                        </td>
                                        <td className="px-4 py-3 text-right text-text"></td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>
            )}
```

**Tailwind classes used:**
- `tabular-nums` -- monospaced digits for aligned numbers
- `card` -- project utility class (white bg, rounded, shadow)
- `overflow-x-auto` -- horizontal scroll on small screens
- `text-success` / `text-danger` -- green/red for positive/negative variance

**Verification:** The table shows one row for each day that has data (Monday through Friday). Each row has Day, Cases, KG, Effic %, Var GBP, and Lines columns. The TOTAL footer row shows the weekly aggregate. Numbers are formatted with thousands separators. Variance values are colored green for positive, red for negative.

---

### AC 7.6.9: Implement Top 3 / Bottom 3 Performing Lines Sections

- **Given** `reportData.mergedPlanSummary` contains `PlanSummaryRow[]` with `line`, `lineLeader`, `efficPct`, and `totalVarPounds`
- **When** the Top/Bottom performing lines sections render
- **Then** the top 3 lines by efficiency and bottom 3 lines by efficiency are displayed

**Implementation details:**

1. **Add a `useMemo` to compute ranked lines:**
```typescript
    /** Top 3 and bottom 3 performing lines by efficiency */
    const rankedLines = useMemo(() => {
        if (!reportData) return { top3: [], bottom3: [] };

        // Filter to lines with non-zero efficiency (exclude blank/summary rows)
        const validLines = reportData.mergedPlanSummary.filter(
            (r) => r.efficPct > 0 && r.line && r.line.trim().length > 0
        );

        // Sort by efficiency descending
        const sorted = [...validLines].sort((a, b) => b.efficPct - a.efficPct);

        const top3 = sorted.slice(0, 3).map((r) => ({
            line: r.line,
            leader: r.lineLeader || 'N/A',
            efficPct: r.efficPct,
            varPounds: r.totalVarPounds,
        }));

        const bottom3 = sorted.slice(-3).reverse().map((r) => ({
            line: r.line,
            leader: r.lineLeader || 'N/A',
            efficPct: r.efficPct,
            varPounds: r.totalVarPounds,
        }));

        // Ensure bottom3 doesn't overlap with top3 when fewer than 6 lines
        const top3Lines = new Set(top3.map((r) => r.line));
        const filteredBottom3 = bottom3.filter((r) => !top3Lines.has(r.line));

        return { top3, bottom3: filteredBottom3 };
    }, [reportData]);
```

2. **Render the two sections in the JSX, below the daily breakdown table:**
```typescript
            {/* Top 3 / Bottom 3 Performing Lines */}
            {(rankedLines.top3.length > 0 || rankedLines.bottom3.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Top 3 */}
                    <div className="card p-5">
                        <h3 className="text-sm font-semibold text-text mb-3">
                            Top 3 Performing Lines
                            <span className="ml-2 text-xs font-normal text-text-secondary">(by Efficiency %)</span>
                        </h3>
                        <div className="space-y-3">
                            {rankedLines.top3.map((item, idx) => (
                                <div key={item.line} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                                            {idx + 1}
                                        </span>
                                        <div>
                                            <span className="font-semibold text-text">{item.line}</span>
                                            <span className="text-text-secondary text-xs ml-2">
                                                ({item.leader})
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-bold text-emerald-700">
                                            {item.efficPct.toFixed(1)}%
                                        </span>
                                        <span className={`ml-3 text-xs ${
                                            item.varPounds >= 0 ? 'text-emerald-600' : 'text-red-600'
                                        }`}>
                                            Var: {item.varPounds >= 0 ? '+' : '-'}
                                            {'\u00A3'}{Math.abs(item.varPounds).toLocaleString('en-GB', { maximumFractionDigits: 0 })}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {rankedLines.top3.length === 0 && (
                                <p className="text-sm text-text-secondary italic">No data available</p>
                            )}
                        </div>
                    </div>

                    {/* Bottom 3 */}
                    <div className="card p-5">
                        <h3 className="text-sm font-semibold text-text mb-3">
                            Bottom 3 Performing Lines
                            <span className="ml-2 text-xs font-normal text-text-secondary">(by Efficiency %)</span>
                        </h3>
                        <div className="space-y-3">
                            {rankedLines.bottom3.map((item, idx) => (
                                <div key={item.line} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                                            {idx + 1}
                                        </span>
                                        <div>
                                            <span className="font-semibold text-text">{item.line}</span>
                                            <span className="text-text-secondary text-xs ml-2">
                                                ({item.leader})
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-bold text-red-700">
                                            {item.efficPct.toFixed(1)}%
                                        </span>
                                        <span className={`ml-3 text-xs ${
                                            item.varPounds >= 0 ? 'text-emerald-600' : 'text-red-600'
                                        }`}>
                                            Var: {item.varPounds >= 0 ? '+' : '-'}
                                            {'\u00A3'}{Math.abs(item.varPounds).toLocaleString('en-GB', { maximumFractionDigits: 0 })}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {rankedLines.bottom3.length === 0 && (
                                <p className="text-sm text-text-secondary italic">No data available</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
```

**Verification:** Two cards appear side-by-side on desktop (stacked on mobile). Top 3 card shows the 3 lines with highest `efficPct`, with green rank badges and their line leader names. Bottom 3 card shows the 3 lines with lowest `efficPct`, with red rank badges. When fewer than 6 lines exist, there is no overlap between top and bottom. Variance is shown next to each line.

---

### AC 7.6.10: Implement Plan Accuracy Section (Planned vs Actual Cases, Hours)

- **Given** `reportData.mergedPlanSummary` contains `PlanSummaryRow[]` with `availHrs`, `earnedAtPlan`, `lostHrsVPlan`
- **When** the Plan Accuracy section renders
- **Then** a summary card shows Planned vs Actual Cases, Planned vs Actual Hours, and Accuracy %

**Implementation details:**

1. **Add a `useMemo` to compute plan accuracy metrics:**
```typescript
    /** Computed plan accuracy metrics */
    const planAccuracy = useMemo(() => {
        if (!reportData) return null;

        const { mergedPlanSummary, mergedTotals } = reportData;

        // Actual cases from TotProd
        const actualCases = mergedTotals.reduce(
            (sum, r) => sum + (r.cases || 0), 0
        );

        // Planned hours (available hours from PlanSummary)
        const plannedHours = mergedPlanSummary.reduce(
            (sum, r) => sum + (r.availHrs || 0), 0
        );

        // Actual earned hours
        const earnedHours = mergedPlanSummary.reduce(
            (sum, r) => sum + (r.earnedAtPlan || 0), 0
        );

        // Lost hours
        const lostHours = mergedPlanSummary.reduce(
            (sum, r) => sum + (r.lostHrsVPlan || 0), 0
        );

        // Plan accuracy percentage (earned / planned * 100)
        const hoursAccuracyPct = plannedHours > 0
            ? (earnedHours / plannedHours) * 100
            : 0;

        return {
            actualCases,
            plannedHours,
            earnedHours,
            lostHours,
            hoursAccuracyPct,
        };
    }, [reportData]);
```

2. **Render the Plan Accuracy section in the JSX, below the Top/Bottom lines:**
```typescript
            {/* Plan Accuracy */}
            {planAccuracy && (
                <div className="card p-5">
                    <h3 className="text-sm font-semibold text-text mb-4">Plan Accuracy</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {/* Actual Cases */}
                        <div>
                            <p className="text-xs text-text-muted uppercase tracking-wider">Actual Cases</p>
                            <p className="text-xl font-bold text-text mt-1">
                                {planAccuracy.actualCases.toLocaleString('en-GB')}
                            </p>
                        </div>

                        {/* Hours: Planned vs Earned vs Lost */}
                        <div>
                            <p className="text-xs text-text-muted uppercase tracking-wider">Hours</p>
                            <div className="mt-1 space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-text-secondary">Planned:</span>
                                    <span className="font-semibold text-text tabular-nums">
                                        {planAccuracy.plannedHours.toLocaleString('en-GB', { maximumFractionDigits: 1 })}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-text-secondary">Earned:</span>
                                    <span className="font-semibold text-text tabular-nums">
                                        {planAccuracy.earnedHours.toLocaleString('en-GB', { maximumFractionDigits: 1 })}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-text-secondary">Lost:</span>
                                    <span className="font-semibold text-danger tabular-nums">
                                        {planAccuracy.lostHours.toLocaleString('en-GB', { maximumFractionDigits: 1 })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Hours Accuracy % */}
                        <div>
                            <p className="text-xs text-text-muted uppercase tracking-wider">Hours Accuracy</p>
                            <p className={`text-xl font-bold mt-1 ${
                                planAccuracy.hoursAccuracyPct >= 90 ? 'text-success' :
                                planAccuracy.hoursAccuracyPct >= 75 ? 'text-warning' :
                                'text-danger'
                            }`}>
                                {planAccuracy.hoursAccuracyPct.toFixed(1)}%
                            </p>
                            {/* Visual bar */}
                            <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all ${
                                        planAccuracy.hoursAccuracyPct >= 90 ? 'bg-success' :
                                        planAccuracy.hoursAccuracyPct >= 75 ? 'bg-warning' :
                                        'bg-danger'
                                    }`}
                                    style={{ width: `${Math.min(planAccuracy.hoursAccuracyPct, 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
```

**Color thresholds for Hours Accuracy:**
- >= 90%: green (`text-success` / `bg-success`)
- 75%-89%: amber (`text-warning` / `bg-warning`)
- < 75%: red (`text-danger` / `bg-danger`)

**Verification:** The plan accuracy section shows Actual Cases, Hours breakdown (Planned/Earned/Lost), and Hours Accuracy %. The progress bar visually represents the accuracy percentage with color coding.

---

### AC 7.6.11: Implement Print Button with CSS @media Print Styles

- **Given** the Weekly Production Report page is displayed with data
- **When** the user clicks the "Print" button
- **Then** the browser's native print dialog opens showing ONLY the report content, with sidebar, header, and non-report elements hidden

**Implementation details:**

1. **Add a `handlePrint` callback inside the component:**
```typescript
    const handlePrint = useCallback(() => {
        window.print();
    }, []);
```

2. **Add a Print button in the header row (inside the `<div className="flex items-center gap-3">` from AC 7.6.4), after the week selector `<select>`:**
```typescript
                    {/* Print button */}
                    <button
                        onClick={handlePrint}
                        disabled={!reportData}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed print-hidden"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Print
                    </button>
```

3. **Add a `<style>` block at the END of the component return, just before the closing `</div>` of the outermost wrapper:**
```typescript
            {/* Print Styles */}
            <style>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 12mm;
                    }

                    /* Hide everything outside the report */
                    body * {
                        visibility: hidden;
                    }

                    /* Show only the weekly report content */
                    .weekly-report-print-area,
                    .weekly-report-print-area * {
                        visibility: visible;
                    }

                    .weekly-report-print-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }

                    /* Hide print/copy buttons and week selector during print */
                    .print-hidden {
                        display: none !important;
                    }

                    /* Avoid page breaks inside cards and tables */
                    .card {
                        break-inside: avoid;
                    }

                    table {
                        break-inside: avoid;
                    }

                    /* Remove shadows and backgrounds for clean print */
                    .card {
                        box-shadow: none !important;
                        border: 1px solid #e5e7eb !important;
                    }

                    /* Ensure text colors print correctly */
                    .text-success { color: #059669 !important; }
                    .text-danger { color: #dc2626 !important; }
                    .text-warning { color: #d97706 !important; }
                }
            `}</style>
```

4. **Wrap the entire report body (everything after the header row) in a div with the print area class:**
```typescript
        <div className="space-y-6">
            {/* Header row with week selector and action buttons (AC 7.6.4) */}
            <div className="flex ... print-hidden">
                {/* ... week selector, print button, copy button ... */}
            </div>

            {/* Printable area wrapper */}
            <div className="weekly-report-print-area space-y-6">
                {/* Print-only header (only visible when printing) */}
                <div className="hidden print:block border-b-2 border-gray-800 pb-4 mb-6">
                    <h1 className="text-xl font-bold text-gray-900">Weekly Production Report</h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Week Ending: {selectedWeek ? new Date(selectedWeek + 'T12:00:00').toLocaleDateString('en-GB', {
                            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                        }) : ''}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        Generated: {new Date().toLocaleDateString('en-GB', {
                            day: 'numeric', month: 'long', year: 'numeric',
                        })}
                    </p>
                </div>

                {/* KPI cards (AC 7.6.6) */}
                {/* Daily breakdown table (AC 7.6.8) */}
                {/* Top/Bottom lines (AC 7.6.9) */}
                {/* Plan accuracy (AC 7.6.10) */}

                {/* Print-only footer */}
                <div className="hidden print:block mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
                    <p>Confidential - Internal Use Only</p>
                    <p className="mt-1">Manufacturing KPI Dashboard - Weekly Production Report</p>
                </div>
            </div>
        </div>
```

**Key Tailwind classes for print:**
- `print-hidden` -- hides element during print (via the `<style>` block's `.print-hidden { display: none !important; }`)
- `hidden print:block` -- hidden normally, visible during print (Tailwind's built-in print modifier)
- `weekly-report-print-area` -- custom class used by the `@media print` rule to make only this area visible

**Verification:** Clicking "Print" opens the browser print dialog. The printed output shows ONLY the report content (no sidebar, no header bar, no buttons). A "Weekly Production Report" title, week ending date, and generation date appear at the top of the printed page. A footer with "Confidential" appears at the bottom.

---

### AC 7.6.12: Implement Copy-to-Clipboard Button (Formatted Text for Email/Excel)

- **Given** the Weekly Production Report page is displayed with data
- **When** the user clicks the "Copy to Clipboard" button
- **Then** a tab-separated-value (TSV) text representation of the report is copied to the clipboard, compatible with Excel paste

**Implementation details:**

1. **Add state for copy feedback:**
```typescript
    const [copied, setCopied] = useState(false);
```

2. **Add a `handleCopy` callback:**
```typescript
    const handleCopy = useCallback(async () => {
        if (!reportData || !weeklySummary) return;

        const lines: string[] = [];

        // Title
        lines.push('Weekly Production Report');
        lines.push(`Week Ending:\t${selectedWeek}`);
        lines.push(`Generated:\t${new Date().toLocaleDateString('en-GB')}`);
        lines.push('');

        // Weekly Summary
        lines.push('WEEKLY SUMMARY');
        lines.push(`Total Cases\t${weeklySummary.totalCases.toLocaleString('en-GB')}`);
        lines.push(`Total KG\t${weeklySummary.totalKg.toLocaleString('en-GB', { maximumFractionDigits: 0 })}`);
        lines.push(`Avg Efficiency %\t${weeklySummary.avgEfficPct.toFixed(1)}%`);
        lines.push(`Total Variance\t${weeklySummary.totalVarPounds >= 0 ? '' : '-'}\u00A3${Math.abs(weeklySummary.totalVarPounds).toLocaleString('en-GB', { maximumFractionDigits: 0 })}`);
        lines.push('');

        // Daily Breakdown
        lines.push('DAILY BREAKDOWN');
        lines.push(['Day', 'Cases', 'KG', 'Effic %', 'Var GBP', 'Lines'].join('\t'));
        for (const row of dailyRows) {
            lines.push([
                row.dayName,
                row.totalCases.toLocaleString('en-GB'),
                row.totalKg.toLocaleString('en-GB', { maximumFractionDigits: 0 }),
                `${row.avgEffic.toFixed(1)}%`,
                `${row.totalVar >= 0 ? '' : '-'}\u00A3${Math.abs(row.totalVar).toLocaleString('en-GB', { maximumFractionDigits: 0 })}`,
                String(row.linesRun),
            ].join('\t'));
        }
        // Total row
        lines.push([
            'TOTAL',
            weeklySummary.totalCases.toLocaleString('en-GB'),
            weeklySummary.totalKg.toLocaleString('en-GB', { maximumFractionDigits: 0 }),
            `${weeklySummary.avgEfficPct.toFixed(1)}%`,
            `${weeklySummary.totalVarPounds >= 0 ? '' : '-'}\u00A3${Math.abs(weeklySummary.totalVarPounds).toLocaleString('en-GB', { maximumFractionDigits: 0 })}`,
            '',
        ].join('\t'));
        lines.push('');

        // Top 3 / Bottom 3
        lines.push('TOP 3 PERFORMING LINES (by Efficiency %)');
        for (const [idx, item] of rankedLines.top3.entries()) {
            lines.push(`${idx + 1}.\t${item.line}\t${item.efficPct.toFixed(1)}%\t${item.leader}\tVar: ${item.varPounds >= 0 ? '+' : '-'}\u00A3${Math.abs(item.varPounds).toLocaleString('en-GB', { maximumFractionDigits: 0 })}`);
        }
        lines.push('');
        lines.push('BOTTOM 3 PERFORMING LINES');
        for (const [idx, item] of rankedLines.bottom3.entries()) {
            lines.push(`${idx + 1}.\t${item.line}\t${item.efficPct.toFixed(1)}%\t${item.leader}\tVar: ${item.varPounds >= 0 ? '+' : '-'}\u00A3${Math.abs(item.varPounds).toLocaleString('en-GB', { maximumFractionDigits: 0 })}`);
        }
        lines.push('');

        // Plan Accuracy
        if (planAccuracy) {
            lines.push('PLAN ACCURACY');
            lines.push(`Actual Cases\t${planAccuracy.actualCases.toLocaleString('en-GB')}`);
            lines.push(`Planned Hours\t${planAccuracy.plannedHours.toLocaleString('en-GB', { maximumFractionDigits: 1 })}`);
            lines.push(`Earned Hours\t${planAccuracy.earnedHours.toLocaleString('en-GB', { maximumFractionDigits: 1 })}`);
            lines.push(`Lost Hours\t${planAccuracy.lostHours.toLocaleString('en-GB', { maximumFractionDigits: 1 })}`);
            lines.push(`Hours Accuracy\t${planAccuracy.hoursAccuracyPct.toFixed(1)}%`);
        }

        const text = lines.join('\n');

        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
        }
    }, [reportData, weeklySummary, dailyRows, rankedLines, planAccuracy, selectedWeek]);
```

3. **Add a Copy button in the header row, next to the Print button:**
```typescript
                    {/* Copy to Clipboard button */}
                    <button
                        onClick={handleCopy}
                        disabled={!reportData}
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 print-hidden ${
                            copied
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        } ${!reportData ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                        {copied ? (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Copied!
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                </svg>
                                Copy to Clipboard
                            </>
                        ) }
                    </button>
```

**Pattern reference:** This follows the exact same pattern as `src/components/yield-by-line/CopyToClipboard.tsx` -- a button that builds TSV content, calls `navigator.clipboard.writeText()`, shows "Copied!" feedback for 2 seconds, and reverts.

**Verification:** Clicking "Copy to Clipboard" copies the full report in tab-separated text format. Pasting into Excel produces a cleanly formatted table. The button text briefly changes to "Copied!" with a green checkmark, then reverts after 2 seconds.

---

### AC 7.6.13: Empty State When No Data Exists for Selected Week

- **Given** Prod Pallets data has not been uploaded, OR the selected week has no data
- **When** the component finishes loading
- **Then** an empty state message is displayed

**Implementation details:**

1. **Add this check after the header row but before the printable area wrapper, inside the component return:**
```typescript
            {/* Empty state: no Prod Pallets data loaded at all */}
            {!isLoading && availableWeeks.length === 0 && (
                <div className="card p-12 text-center">
                    <p className="text-4xl mb-4">📊</p>
                    <p className="text-lg font-medium text-text mb-2">No Data Available</p>
                    <p className="text-sm text-text-secondary">
                        Please upload Prod Pallets data using the sidebar to generate a weekly report.
                    </p>
                </div>
            )}

            {/* Empty state: week selected but no data for that week */}
            {!isLoading && selectedWeek && reportData && reportData.days.length === 0 && (
                <div className="card p-12 text-center">
                    <p className="text-4xl mb-4">📅</p>
                    <p className="text-lg font-medium text-text mb-2">No Data for Selected Week</p>
                    <p className="text-sm text-text-secondary">
                        No production data was found for the week ending{' '}
                        {new Date(selectedWeek + 'T12:00:00').toLocaleDateString('en-GB', {
                            day: 'numeric', month: 'long', year: 'numeric',
                        })}.
                        Try selecting a different week.
                    </p>
                </div>
            )}
```

2. **Gate the report sections: only render KPI cards, daily table, top/bottom lines, and plan accuracy when `reportData.days.length > 0`.** Wrap all of those sections inside:
```typescript
            {reportData && reportData.days.length > 0 && (
                <div className="weekly-report-print-area space-y-6">
                    {/* ... all report sections ... */}
                </div>
            )}
```

**Verification:** When no Prod Pallets file has been uploaded, the page shows "No Data Available" with upload instructions. When a week is selected but has no data, the page shows "No Data for Selected Week" with the selected date and a suggestion to try another week. When data exists, the full report renders.

---

### AC 7.6.14: Loading Skeleton States

- **Given** data is being loaded from IndexedDB (isLoading = true)
- **When** the component is in its loading state
- **Then** skeleton loading placeholders are displayed

**Implementation details:**

1. **Import `SkeletonCard` from the existing overview component:**
```typescript
import { SkeletonCard } from '@/components/overview/SkeletonCard';
```

2. **Add a loading check at the top of the component return, BEFORE the main content:**
```typescript
    if (isLoading) {
        return (
            <div className="space-y-6">
                {/* Header skeleton */}
                <div className="flex justify-between items-center">
                    <div className="h-6 w-64 bg-gray-200 rounded animate-pulse" />
                    <div className="flex gap-3">
                        <div className="h-10 w-40 bg-gray-200 rounded animate-pulse" />
                        <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
                        <div className="h-10 w-36 bg-gray-200 rounded animate-pulse" />
                    </div>
                </div>

                {/* KPI cards skeleton */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <SkeletonCard height={100} />
                    <SkeletonCard height={100} />
                    <SkeletonCard height={100} />
                    <SkeletonCard height={100} />
                </div>

                {/* Daily breakdown table skeleton */}
                <div className="card p-6">
                    <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-4" />
                    <div className="space-y-3">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-8 bg-gray-200 rounded animate-pulse" />
                        ))}
                    </div>
                </div>

                {/* Top/Bottom skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SkeletonCard height={160} />
                    <SkeletonCard height={160} />
                </div>

                {/* Plan accuracy skeleton */}
                <SkeletonCard height={120} />
            </div>
        );
    }
```

**Tailwind classes used:**
- `animate-pulse` -- pulsing animation for loading placeholders
- `bg-gray-200` -- light gray background for skeleton blocks
- `rounded` -- rounded corners matching card radius

**Verification:** While data is loading (after selecting a week), the page shows pulsing gray placeholder blocks matching the approximate shape and size of the final content sections. Once loading completes, the skeletons are replaced with real content.

---

### AC 7.6.15: Responsive Layout

- **Given** the Weekly Production Report page is viewed on different screen sizes
- **When** the viewport width changes
- **Then** the layout adapts appropriately

**Responsive breakpoints (handled by existing Tailwind classes in the above ACs):**

| Element | Desktop (>= 1024px) | Tablet (768-1023px) | Mobile (< 768px) |
|---------|---------------------|---------------------|-------------------|
| Header row | Horizontal flex (title left, controls right) | Horizontal flex | Stacked (title above controls) |
| KPI cards | 4 in a row (`grid-cols-4`) | 4 in a row | 2 per row (`grid-cols-2`) |
| Daily breakdown table | Full width, no scroll | Full width | Horizontal scroll (`overflow-x-auto`) |
| Top 3 / Bottom 3 | Side by side (`grid-cols-2`) | Side by side | Stacked (`grid-cols-1`) |
| Plan accuracy | 3 columns (`grid-cols-3`) | 3 columns | Stacked (`grid-cols-1`) |

**No additional code changes needed for this AC.** All responsive classes are already specified in the Tailwind class strings defined in AC 7.6.4 through AC 7.6.12:

- Header: `flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4`
- KPI cards: `grid grid-cols-2 lg:grid-cols-4 gap-4`
- Top/Bottom: `grid grid-cols-1 md:grid-cols-2 gap-4`
- Plan accuracy: `grid grid-cols-1 sm:grid-cols-3 gap-6`
- Table: `overflow-x-auto` for horizontal scroll on small screens

**Verification:** Resize the browser window to test:
1. At 1200px+ width: 4 KPI cards in a row, top/bottom side-by-side, plan accuracy 3-column.
2. At 768px width: 2 KPI cards per row, top/bottom side-by-side, plan accuracy stacked.
3. At 375px width: 2 KPI cards per row, top/bottom stacked, daily table scrollable horizontally.

---

## Technical Implementation Plan

### Component Structure
```
src/components/weekly-report/
  WeeklyProductionReport.tsx    # Main page component (all sections)
  index.ts                       # Barrel export
```

All sections (KPI cards, daily table, top/bottom lines, plan accuracy, print, copy) are defined INSIDE `WeeklyProductionReport.tsx` as inline JSX. The helper functions (`getWeekDays`, `getDayName`, `getPreviousWeekEnding`, `calcChange`, `WoWBadge`) are defined in the same file, above the main export.

This is a single-file component because:
- The sections are tightly coupled (they all share the same `reportData` state)
- The print/copy features need access to all computed data
- Splitting would require prop-drilling the same data to 5+ sub-components

If the file exceeds ~500 lines, consider extracting `WoWBadge` and the helper functions into a `src/components/weekly-report/utils.ts` file.

### Data Flow Diagram

```
User selects week -> selectedWeek state updates
                  |
                  v
useEffect fires -> calls DataStore.getProdPalletsForDate(date) for each Mon-Fri
               -> calls DataStore.getProdPalletsForWeek(selectedWeek)
               -> calls DataStore.getProdPalletsForWeek(previousWeekEnding)
                  |
                  v
setReportData({ days, mergedPlanSummary, mergedTotals, previousWeek })
                  |
                  v
useMemo hooks compute:
  weeklySummary      -> { totalCases, totalKg, avgEfficPct, totalVarPounds }
  previousWeekSummary -> same shape, from previousWeek data
  dailyRows          -> [{ dayName, totalCases, totalKg, avgEffic, totalVar, linesRun }]
  rankedLines        -> { top3: [...], bottom3: [...] }
  planAccuracy       -> { actualCases, plannedHours, earnedHours, lostHours, hoursAccuracyPct }
                  |
                  v
JSX renders:
  [Week Selector][Print][Copy] (header)
  [KPI Card 1][KPI Card 2][KPI Card 3][KPI Card 4] (weekly summary + WoW badges)
  [Daily Breakdown Table - Mon-Fri rows + TOTAL footer]
  [Top 3 Lines Card][Bottom 3 Lines Card]
  [Plan Accuracy Card]
```

### Print Flow

```
User clicks Print button
  -> handlePrint() calls window.print()
  -> Browser @media print CSS activates:
     - body * { visibility: hidden }
     - .weekly-report-print-area, .weekly-report-print-area * { visibility: visible }
     - .print-hidden { display: none !important }  (hides buttons, selector)
     - .hidden.print:block elements become visible (print header, print footer)
  -> Browser print dialog opens with clean report layout
```

### Copy-to-Clipboard Flow

```
User clicks Copy to Clipboard button
  -> handleCopy() builds TSV string from all computed data
  -> navigator.clipboard.writeText(text) copies to system clipboard
  -> setCopied(true) shows "Copied!" feedback
  -> setTimeout 2000ms -> setCopied(false) reverts button text
```

---

## Files Created / Modified

### Files Created (2)

| File | Purpose |
|------|---------|
| `src/components/weekly-report/WeeklyProductionReport.tsx` | Main page component with all sections, print, copy |
| `src/components/weekly-report/index.ts` | Barrel export: `export { WeeklyProductionReport } from './WeeklyProductionReport';` |

### Files Modified (3)

| File | Change |
|------|--------|
| `src/stores/app-store.ts` | Add `'weekly-report'` to `PageId` union type (AC 7.6.1) |
| `src/components/layout/Sidebar.tsx` | Add nav item `{ id: 'weekly-report', label: 'Weekly Report', icon: '📊', ... }` to `NAV_ITEMS` array (AC 7.6.2) |
| `src/app/page.tsx` | Add import, PAGE_TITLES entry, and switch case for `'weekly-report'` (AC 7.6.3) |

---

## Dependencies

### NPM Dependencies
No new NPM packages required. This story uses only:
- `react` (already installed)
- `@/stores/data-store` (existing)
- `@/stores/app-store` (existing)
- `@/types/prod-pallets` (existing)
- `@/components/overview/SkeletonCard` (existing)

### DataStore Methods Required (from Story 7.2)

| Method | Signature | Description |
|--------|-----------|-------------|
| `getProdPalletsForDate` | `(date: string) => Promise<ProdPalletsData \| undefined>` | Load one day's Prod Pallets from date-keyed IndexedDB |
| `getProdPalletsForWeek` | `(weekEnding: string) => Promise<ProdPalletsData \| undefined>` | Load and merge Mon-Fri data for a week |
| `getDistinctWeeks` | `() => Promise<string[]>` | Already exists -- returns available week-ending dates |

**Fallback strategy if Story 7.2 is not yet implemented:** Use `DataStore.getProdPallets()` which returns the single most recently uploaded Prod Pallets file. In that case, all days show the same data and `previousWeek` is null. This allows development and testing of the UI without Story 7.2.

---

## Testing / Verification

### Manual Testing Checklist

1. **Page Registration**
   - [ ] "Weekly Report" appears in sidebar under "Production" category
   - [ ] Clicking it navigates to the page
   - [ ] Header shows correct title and subtitle

2. **Week Selector**
   - [ ] Dropdown populates with available week-ending dates
   - [ ] Most recent week is auto-selected on page load
   - [ ] Changing selection reloads data

3. **Weekly Summary Cards**
   - [ ] 4 cards: Total Cases, Total KG, Avg Efficiency %, Total Variance
   - [ ] Values match manual calculation from source data
   - [ ] WoW badges show correct direction and percentage

4. **Daily Breakdown Table**
   - [ ] One row per day (Mon-Fri) with correct day names
   - [ ] TOTAL footer row matches weekly summary values
   - [ ] Numbers formatted with thousands separators
   - [ ] Variance colors: green for positive, red for negative

5. **Top 3 / Bottom 3 Lines**
   - [ ] Top 3 sorted by highest efficiency
   - [ ] Bottom 3 sorted by lowest efficiency
   - [ ] Line leader names displayed correctly
   - [ ] No overlap between top and bottom when < 6 lines

6. **Plan Accuracy**
   - [ ] Actual Cases matches TotProd sum
   - [ ] Hours breakdown matches PlanSummary sums
   - [ ] Accuracy bar is color-coded correctly

7. **Print**
   - [ ] Print button triggers browser print dialog
   - [ ] Printed output shows clean report without sidebar/header/buttons
   - [ ] Print header and footer appear on printed page
   - [ ] Tables and cards don't break across pages

8. **Copy to Clipboard**
   - [ ] Button copies TSV text to clipboard
   - [ ] Pasting into Excel produces clean table
   - [ ] "Copied!" feedback appears for 2 seconds

9. **Empty States**
   - [ ] No data uploaded: "No Data Available" message
   - [ ] Week selected but no data: "No Data for Selected Week" message

10. **Loading Skeletons**
    - [ ] Pulsing skeletons appear during data loading
    - [ ] Smooth transition to real content

11. **Responsive**
    - [ ] Desktop: 4 KPI cards in row, side-by-side panels
    - [ ] Tablet: Adapts gracefully
    - [ ] Mobile: 2 cards per row, stacked panels, scrollable table

---

## Definition of Done
- [ ] All 15 acceptance criteria pass
- [ ] `'weekly-report'` added to PageId union in app-store.ts
- [ ] Nav item added to Sidebar.tsx under Production category
- [ ] PAGE_TITLES entry and switch case added to page.tsx
- [ ] WeeklyProductionReport.tsx component created with all sections
- [ ] Week selector auto-selects most recent week
- [ ] Weekly data loading works (with Story 7.2 methods or fallback)
- [ ] 4 KPI summary cards display with correct aggregated values
- [ ] Week-over-week comparison badges show correct direction and color
- [ ] Daily breakdown table with Mon-Fri rows and TOTAL footer
- [ ] Top 3 and Bottom 3 performing lines sections display correctly
- [ ] Plan accuracy section with visual bar displays correctly
- [ ] Print button produces clean printable output
- [ ] Copy to clipboard produces Excel-compatible TSV text
- [ ] Empty states for no data and no data for selected week
- [ ] Loading skeletons during data fetch
- [ ] Responsive layout works on desktop, tablet, and mobile
- [ ] TypeScript compiles without errors
- [ ] No console errors in browser
