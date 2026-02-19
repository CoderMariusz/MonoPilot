> **Status:** PLANNED
> **Epic:** 7 - Prod Pallets Date-Keyed Storage & Time Selection
> **Depends on:** Story 7.1 (date-keyed storage), Story 7.2 (multi-day query methods)
> **Estimated Effort:** 1-2 development sessions
> **Files Modified:** 6 production page components (see list below)

# Story 7.3: Production Pages Time Selection Integration

## Story Overview
**Epic**: Prod Pallets Date-Keyed Storage & Time Selection
**Priority**: High
**Estimated Effort**: 1-2 development sessions
**Dependencies**: Story 7.1 (date-keyed IndexedDB storage), Story 7.2 (multi-day query methods on DataStore)

### User Story
> As a **Supervisor**, I want to **filter production data on every production page by day, week, period, or year** so that I can **view production metrics for any time range instead of always seeing all data at once**.

### Problem Statement
All 6 date-sensitive production pages currently call `DataStore.getProdPallets()` which returns the ENTIRE dataset with no date filtering. With 7+ weeks of data loaded, every page shows an undifferentiated wall of all-time data. Story 7.1 introduced date-keyed IndexedDB storage. Story 7.2 added the `DataStore.getProdPalletsForTimeSelection(ts)` method that returns only data matching the active `TimeSelection`. This story wires those capabilities into the 6 production page components.

### Solution
1. Add the `GranularitySelector` and `TimeValueSelector` UI components to 6 production pages.
2. Replace every `DataStore.getProdPallets()` call with `DataStore.getProdPalletsForTimeSelection(appState.timeSelection)`.
3. Make the `useEffect` dependency array react to `appState.timeSelection` changes.
4. Add a "Data available for X days" info badge and an empty-state message for periods with no data.
5. Leave `ProductMasterPage.tsx` unchanged (static reference data, always loads latest).

---

## Dependencies

| Dependency | What It Provides | Status |
|---|---|---|
| Story 7.1 | Date-keyed IndexedDB storage for Prod Pallets sheets | Required |
| Story 7.2 | `DataStore.getProdPalletsForTimeSelection(ts: TimeSelection): Promise<ProdPalletsData \| undefined>` | Required |
| Cross-cutting multi-granularity time selection story | `GranularitySelector`, `TimeValueSelector`, `useTimeSelection`, `useAppState`, `TimeSelection` type | Done |

---

## Files Modified

| # | File Path | Change Summary |
|---|---|---|
| 1 | `src/components/production/ProductionLogPage.tsx` | Add time selection UI + filtered loading |
| 2 | `src/components/production/EfficiencyByLinePage.tsx` | Add time selection UI + filtered loading |
| 3 | `src/components/production/EfficiencyByLeaderPage.tsx` | Add time selection UI + filtered loading |
| 4 | `src/components/production/PlanSummaryPage.tsx` | Add time selection UI + filtered loading |
| 5 | `src/components/production/ProductionSchedulePage.tsx` | Add time selection UI + filtered loading |
| 6 | `src/components/production/TotalProductionPage.tsx` | Add time selection UI + filtered loading |

**NOT modified:**
- `src/components/production/ProductMasterPage.tsx` (static data, no date dimension)

---

## Acceptance Criteria

### AC 7.3.1: Add Time Selection Imports to All 6 Production Pages

**Given** each of the 6 production page files listed above exists in `src/components/production/`
**When** Story 7.3 implementation begins
**Then** each file receives the following additional imports at the top of the file, directly below the existing import statements:

```typescript
import { useAppState } from '@/stores/app-store';
import { useTimeSelection } from '@/hooks/useTimeSelection';
import { GranularitySelector } from '@/components/common/GranularitySelector';
import { TimeValueSelector } from '@/components/common/TimeValueSelector';
```

**Step-by-step instructions for each file:**

1. Open the file (e.g. `src/components/production/ProductionLogPage.tsx`).
2. Locate the existing import block. It currently starts with:
   ```typescript
   import React, { useState, useEffect, useMemo } from 'react';
   import { DataStore } from '@/stores/data-store';
   ```
3. Add the 4 new import lines AFTER the existing imports but BEFORE the component function declaration.
4. The `DataStore` import MUST remain because it is still used (the call changes from `getProdPallets()` to `getProdPalletsForTimeSelection()`).
5. Repeat for all 6 files.

**Exact files and their current first import line (to locate the right position):**

| File | First existing import |
|---|---|
| `ProductionLogPage.tsx` | `import React, { useState, useEffect, useMemo } from 'react';` |
| `EfficiencyByLinePage.tsx` | `import React, { useState, useEffect, useMemo } from 'react';` |
| `EfficiencyByLeaderPage.tsx` | `import React, { useState, useEffect, useMemo } from 'react';` |
| `PlanSummaryPage.tsx` | `import React, { useState, useEffect, useMemo } from 'react';` |
| `ProductionSchedulePage.tsx` | `import React, { useState, useEffect, useMemo } from 'react';` |
| `TotalProductionPage.tsx` | `import React, { useState, useEffect, useMemo } from 'react';` |

---

### AC 7.3.2: Modify ProductionLogPage.tsx to Use Time-Selection-Aware Loading

**Given** `ProductionLogPage.tsx` currently loads data with this pattern:
```typescript
useEffect(() => {
    async function load() {
        setIsLoading(true);
        const pp = await DataStore.getProdPallets();
        if (pp) setData(pp.production);
        setIsLoading(false);
    }
    load();
}, []);
```
**When** the developer applies Story 7.3 changes
**Then** the component is modified with ALL of the following changes:

#### Step 1: Add hooks inside the component function body

Add these two lines at the very top of the `ProductionLogPage` function body, BEFORE the existing `useState` calls:

```typescript
const appState = useAppState();
const {
    availableDays, availableWeeks, availablePeriods, availableYears,
    isLoading: timeLoading,
    handleGranularityChange, handleDayChange, handleWeekChange,
    handlePeriodChange, handleYearChange,
} = useTimeSelection();
```

The full hook destructure of `useTimeSelection()` is needed because `TimeValueSelector` requires all these props.

#### Step 2: Replace the useEffect data-loading block

Replace the current `useEffect` (lines 14-22 in the current file) with:

```typescript
useEffect(() => {
    async function load() {
        setIsLoading(true);
        const pp = await DataStore.getProdPalletsForTimeSelection(appState.timeSelection);
        if (pp) setData(pp.production);
        else setData([]);
        setIsLoading(false);
    }
    load();
}, [appState.timeSelection]);
```

Key differences from the old code:
- Calls `getProdPalletsForTimeSelection(appState.timeSelection)` instead of `getProdPallets()`.
- Dependency array is `[appState.timeSelection]` instead of `[]`.
- When `pp` is falsy (no data for that time range), explicitly calls `setData([])` to clear stale data.

#### Step 3: Add time selection controls to the JSX

In the `return` statement, add a time selection toolbar ABOVE the summary cards grid. Currently the return starts with:
```tsx
return (
    <div className="space-y-4">
        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
```

Insert this block between `<div className="space-y-4">` and `{/* Summary cards */}`:

```tsx
{/* Time Selection Toolbar */}
<div className="card p-4 flex items-center gap-4 flex-wrap">
    <GranularitySelector
        granularities={['day', 'week', 'period', 'year']}
        active={appState.timeSelection.granularity}
        onChange={handleGranularityChange}
        disabled={timeLoading}
    />
    <TimeValueSelector
        granularity={appState.timeSelection.granularity}
        timeSelection={appState.timeSelection}
        availableDays={availableDays}
        availableWeeks={availableWeeks}
        availablePeriods={availablePeriods}
        availableYears={availableYears}
        onDayChange={handleDayChange}
        onWeekChange={handleWeekChange}
        onPeriodChange={handlePeriodChange}
        onYearChange={handleYearChange}
        disabled={timeLoading}
    />
</div>
```

#### Verification

- **Given** the user selects "Week" granularity and picks a specific week ending date
- **When** the ProductionLogPage renders
- **Then** only PROD sheet rows from that week appear in the table
- **And** the summary cards (Pallets, Total Boxes, Total KG, Products) reflect only that week's data
- **And** switching to a different week immediately reloads with the new week's data

---

### AC 7.3.3: Modify EfficiencyByLinePage.tsx to Use Time-Selection-Aware Loading

**Given** `EfficiencyByLinePage.tsx` currently loads data with this pattern:
```typescript
useEffect(() => {
    async function load() {
        setIsLoading(true);
        const pp = await DataStore.getProdPallets();
        if (pp) {
            setEffData(pp.prodEfficiency);
            setDetailData(pp.detail);
        }
        setIsLoading(false);
    }
    load();
}, []);
```
**When** the developer applies Story 7.3 changes
**Then** the component is modified with ALL of the following changes:

#### Step 1: Add hooks inside the component function body

Add these lines at the very top of the `EfficiencyByLinePage` function body, BEFORE the existing `useState` calls:

```typescript
const appState = useAppState();
const {
    availableDays, availableWeeks, availablePeriods, availableYears,
    isLoading: timeLoading,
    handleGranularityChange, handleDayChange, handleWeekChange,
    handlePeriodChange, handleYearChange,
} = useTimeSelection();
```

#### Step 2: Replace the useEffect data-loading block

Replace the current `useEffect` (lines 14-25 in the current file) with:

```typescript
useEffect(() => {
    async function load() {
        setIsLoading(true);
        const pp = await DataStore.getProdPalletsForTimeSelection(appState.timeSelection);
        if (pp) {
            setEffData(pp.prodEfficiency);
            setDetailData(pp.detail);
        } else {
            setEffData([]);
            setDetailData([]);
        }
        setIsLoading(false);
    }
    load();
}, [appState.timeSelection]);
```

Key differences:
- Calls `getProdPalletsForTimeSelection(appState.timeSelection)` instead of `getProdPallets()`.
- Dependency array is `[appState.timeSelection]` instead of `[]`.
- Explicitly clears both `effData` and `detailData` to empty arrays when `pp` is falsy.

#### Step 3: Add time selection controls to the JSX

In the `return` statement, insert the same time selection toolbar block (identical to AC 7.3.2 Step 3) between `<div className="space-y-4">` and `{/* Summary cards */}`. The toolbar JSX is:

```tsx
{/* Time Selection Toolbar */}
<div className="card p-4 flex items-center gap-4 flex-wrap">
    <GranularitySelector
        granularities={['day', 'week', 'period', 'year']}
        active={appState.timeSelection.granularity}
        onChange={handleGranularityChange}
        disabled={timeLoading}
    />
    <TimeValueSelector
        granularity={appState.timeSelection.granularity}
        timeSelection={appState.timeSelection}
        availableDays={availableDays}
        availableWeeks={availableWeeks}
        availablePeriods={availablePeriods}
        availableYears={availableYears}
        onDayChange={handleDayChange}
        onWeekChange={handleWeekChange}
        onPeriodChange={handlePeriodChange}
        onYearChange={handleYearChange}
        disabled={timeLoading}
    />
</div>
```

#### Verification

- **Given** the user selects "Day" granularity and picks a specific date
- **When** the EfficiencyByLinePage renders
- **Then** only efficiency rows (PrdEff sheet) from that date appear in the Summary view
- **And** only detail rows (Detail sheet) from that date appear in the Detail view
- **And** the summary cards (Lines, Avg Efficiency, Total Hours, Total Cases) reflect only that date's data
- **And** the line filter dropdown only shows lines that have data for the selected date

---

### AC 7.3.4: Modify EfficiencyByLeaderPage.tsx to Use Time-Selection-Aware Loading

**Given** `EfficiencyByLeaderPage.tsx` currently loads data with this pattern:
```typescript
useEffect(() => {
    async function load() {
        setIsLoading(true);
        const [pp, ly] = await Promise.all([
            DataStore.getProdPallets(),
            DataStore.getLineYields(),
        ]);
        if (pp) {
            setPlanSummary(pp.planSummary);
            setProdEfficiency(pp.prodEfficiency);
        }
        if (ly) setLineYields(ly);
        setIsLoading(false);
    }
    load();
}, []);
```
**When** the developer applies Story 7.3 changes
**Then** the component is modified with ALL of the following changes:

#### Step 1: Add hooks inside the component function body

Add these lines at the very top of the `EfficiencyByLeaderPage` function body, BEFORE the existing `useState` calls:

```typescript
const appState = useAppState();
const {
    availableDays, availableWeeks, availablePeriods, availableYears,
    isLoading: timeLoading,
    handleGranularityChange, handleDayChange, handleWeekChange,
    handlePeriodChange, handleYearChange,
} = useTimeSelection();
```

#### Step 2: Replace the useEffect data-loading block

Replace the current `useEffect` (lines 29-44 in the current file) with:

```typescript
useEffect(() => {
    async function load() {
        setIsLoading(true);
        const [pp, ly] = await Promise.all([
            DataStore.getProdPalletsForTimeSelection(appState.timeSelection),
            DataStore.getLineYieldsForTimeSelection(appState.timeSelection),
        ]);
        if (pp) {
            setPlanSummary(pp.planSummary);
            setProdEfficiency(pp.prodEfficiency);
        } else {
            setPlanSummary([]);
            setProdEfficiency([]);
        }
        if (ly) setLineYields(ly);
        else setLineYields([]);
        setIsLoading(false);
    }
    load();
}, [appState.timeSelection]);
```

Key differences:
- `DataStore.getProdPallets()` becomes `DataStore.getProdPalletsForTimeSelection(appState.timeSelection)`.
- `DataStore.getLineYields()` becomes `DataStore.getLineYieldsForTimeSelection(appState.timeSelection)`.
- Both calls still run in parallel via `Promise.all`.
- Dependency array is `[appState.timeSelection]` instead of `[]`.
- Explicit empty-array fallbacks for all three state setters.

**IMPORTANT**: This page loads BOTH Prod Pallets AND Line Yields data, so BOTH must be filtered by the same time selection. `DataStore.getLineYieldsForTimeSelection(ts)` already exists (from the cross-cutting time selection story).

#### Step 3: Add time selection controls to the JSX

In the `return` statement, insert the same time selection toolbar block between `<div className="space-y-4">` and `{/* Summary cards */}`. The toolbar JSX is identical to AC 7.3.2 Step 3.

#### Verification

- **Given** the user selects "Period" granularity and picks P5 2026
- **When** the EfficiencyByLeaderPage renders
- **Then** only plan summary rows from that period appear
- **And** Line Yields data used for Yield % and GA % columns is also filtered to that period
- **And** the leader aggregation (JOIN of PlnSmy + Effic + LineYields) only contains data from that period

---

### AC 7.3.5: Modify PlanSummaryPage.tsx to Use Time-Selection-Aware Loading

**Given** `PlanSummaryPage.tsx` currently loads data with this pattern:
```typescript
useEffect(() => {
    async function load() {
        setIsLoading(true);
        const pp = await DataStore.getProdPallets();
        if (pp) setData(pp.planSummary);
        setIsLoading(false);
    }
    load();
}, []);
```
**When** the developer applies Story 7.3 changes
**Then** the component is modified with ALL of the following changes:

#### Step 1: Add hooks inside the component function body

Add these lines at the very top of the `PlanSummaryPage` function body, BEFORE the existing `useState` calls:

```typescript
const appState = useAppState();
const {
    availableDays, availableWeeks, availablePeriods, availableYears,
    isLoading: timeLoading,
    handleGranularityChange, handleDayChange, handleWeekChange,
    handlePeriodChange, handleYearChange,
} = useTimeSelection();
```

#### Step 2: Replace the useEffect data-loading block

Replace the current `useEffect` (lines 13-21 in the current file) with:

```typescript
useEffect(() => {
    async function load() {
        setIsLoading(true);
        const pp = await DataStore.getProdPalletsForTimeSelection(appState.timeSelection);
        if (pp) setData(pp.planSummary);
        else setData([]);
        setIsLoading(false);
    }
    load();
}, [appState.timeSelection]);
```

Key differences:
- Calls `getProdPalletsForTimeSelection(appState.timeSelection)` instead of `getProdPallets()`.
- Dependency array is `[appState.timeSelection]` instead of `[]`.
- Explicit `setData([])` fallback.

#### Step 3: Add time selection controls to the JSX

In the `return` statement, insert the same time selection toolbar block between `<div className="space-y-4">` and `{/* Summary cards */}`. The toolbar JSX is identical to AC 7.3.2 Step 3.

#### Verification

- **Given** the user selects "Week" granularity and picks week ending 2026-02-07
- **When** the PlanSummaryPage renders
- **Then** only PlnSmy rows from that week appear in the table
- **And** summary cards (Available Hours, Earned @ Plan, Lost Hours, Total Variance) reflect only that week

---

### AC 7.3.6: Modify ProductionSchedulePage.tsx to Use Time-Selection-Aware Loading

**Given** `ProductionSchedulePage.tsx` currently loads data with this pattern:
```typescript
useEffect(() => {
    async function load() {
        setIsLoading(true);
        const pp = await DataStore.getProdPallets();
        if (pp) setData(pp.schedule);
        setIsLoading(false);
    }
    load();
}, []);
```
**When** the developer applies Story 7.3 changes
**Then** the component is modified with ALL of the following changes:

#### Step 1: Add hooks inside the component function body

Add these lines at the very top of the `ProductionSchedulePage` function body, BEFORE the existing `useState` calls:

```typescript
const appState = useAppState();
const {
    availableDays, availableWeeks, availablePeriods, availableYears,
    isLoading: timeLoading,
    handleGranularityChange, handleDayChange, handleWeekChange,
    handlePeriodChange, handleYearChange,
} = useTimeSelection();
```

#### Step 2: Replace the useEffect data-loading block

Replace the current `useEffect` (lines 14-22 in the current file) with:

```typescript
useEffect(() => {
    async function load() {
        setIsLoading(true);
        const pp = await DataStore.getProdPalletsForTimeSelection(appState.timeSelection);
        if (pp) setData(pp.schedule);
        else setData([]);
        setIsLoading(false);
    }
    load();
}, [appState.timeSelection]);
```

Key differences:
- Calls `getProdPalletsForTimeSelection(appState.timeSelection)` instead of `getProdPallets()`.
- Dependency array is `[appState.timeSelection]` instead of `[]`.
- Explicit `setData([])` fallback.

#### Step 3: Add time selection controls to the JSX

In the `return` statement, insert the same time selection toolbar block between `<div className="space-y-4">` and `{/* Summary cards */}`. The toolbar JSX is identical to AC 7.3.2 Step 3.

#### Verification

- **Given** the user selects "Day" granularity and picks 2026-02-05
- **When** the ProductionSchedulePage renders
- **Then** only Sched rows from that day appear in the table
- **And** summary cards (Scheduled Items, Planned Cases, Planned KG, Planned Hours) reflect only that day
- **And** the line filter dropdown only shows lines scheduled on that day

---

### AC 7.3.7: Modify TotalProductionPage.tsx to Use Time-Selection-Aware Loading

**Given** `TotalProductionPage.tsx` currently loads data with this pattern:
```typescript
useEffect(() => {
    async function load() {
        setIsLoading(true);
        const pp = await DataStore.getProdPallets();
        if (pp) setData(pp.totals);
        setIsLoading(false);
    }
    load();
}, []);
```
**When** the developer applies Story 7.3 changes
**Then** the component is modified with ALL of the following changes:

#### Step 1: Add hooks inside the component function body

Add these lines at the very top of the `TotalProductionPage` function body, BEFORE the existing `useState` calls:

```typescript
const appState = useAppState();
const {
    availableDays, availableWeeks, availablePeriods, availableYears,
    isLoading: timeLoading,
    handleGranularityChange, handleDayChange, handleWeekChange,
    handlePeriodChange, handleYearChange,
} = useTimeSelection();
```

#### Step 2: Replace the useEffect data-loading block

Replace the current `useEffect` (lines 14-22 in the current file) with:

```typescript
useEffect(() => {
    async function load() {
        setIsLoading(true);
        const pp = await DataStore.getProdPalletsForTimeSelection(appState.timeSelection);
        if (pp) setData(pp.totals);
        else setData([]);
        setIsLoading(false);
    }
    load();
}, [appState.timeSelection]);
```

Key differences:
- Calls `getProdPalletsForTimeSelection(appState.timeSelection)` instead of `getProdPallets()`.
- Dependency array is `[appState.timeSelection]` instead of `[]`.
- Explicit `setData([])` fallback.

#### Step 3: Add time selection controls to the JSX

In the `return` statement, insert the same time selection toolbar block between `<div className="space-y-4">` and `{/* Search */}`. Currently the return has:

```tsx
return (
    <div className="space-y-4">
        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
```

Insert the toolbar block between `<div className="space-y-4">` and `{/* Summary cards */}`. The toolbar JSX is identical to AC 7.3.2 Step 3.

#### Verification

- **Given** the user selects "Year" granularity and picks FY 2026
- **When** the TotalProductionPage renders
- **Then** only TOT Prod rows from FY 2026 appear in the table
- **And** summary cards (Products, Total Cases, Total KG, Total Packets) reflect only that year
- **And** the totals footer row at the bottom also sums only the filtered data
- **And** the search bar still works within the time-filtered dataset

---

### AC 7.3.8: Add "Data Available for X Days" Indicator to Each Page

**Given** any of the 6 production pages loads data filtered by the active time selection
**When** the data loads successfully and contains at least 1 row
**Then** a small info badge is rendered inside the time selection toolbar showing:

```
"Data from X day(s)"
```

where X is the count of distinct dates present in the loaded data.

#### Implementation details

For pages that load arrays with a `date` field (ProductionLogPage uses `ProdRow` which has a `date: string` field), compute the distinct day count from the loaded data:

```typescript
const dayCount = useMemo(() => {
    const dates = new Set(data.map(r => r.date?.slice(0, 10)).filter(Boolean));
    return dates.size;
}, [data]);
```

For pages where the row type does NOT have a `date` field (e.g. `TotProdRow`, `PlanSummaryRow`), the badge is NOT rendered. Specifically:
- **Has `date` field, SHOW badge:** ProductionLogPage (`ProdRow.date`), ProductionSchedulePage (if SchedRow has date — check type)
- **No `date` field, SKIP badge:** PlanSummaryPage, TotalProductionPage, EfficiencyByLinePage, EfficiencyByLeaderPage

Actually, examining the type definitions:
- `ProdRow` has `date: string` -- YES, show badge on ProductionLogPage
- `ProdEfficiencyRow` does NOT have `date` -- SKIP on EfficiencyByLinePage
- `DetailRow` does NOT have `date` -- SKIP on EfficiencyByLinePage
- `PlanSummaryRow` does NOT have `date` -- SKIP on PlanSummaryPage
- `SchedRow` does NOT have `date` -- SKIP on ProductionSchedulePage
- `TotProdRow` does NOT have `date` -- SKIP on TotalProductionPage
- `PlanSummaryRow` / `ProdEfficiencyRow` / `LineYieldRow` for EfficiencyByLeaderPage -- LineYieldRow has `date`, but the primary display uses PlanSummaryRow which does not. SKIP badge.

**Therefore:** Only `ProductionLogPage.tsx` gets the day count badge.

Add this JSX inside the time selection toolbar `<div>`, after the `TimeValueSelector`:

```tsx
{dayCount > 0 && (
    <span className="text-xs text-text-muted ml-auto">
        Data from {dayCount} day{dayCount !== 1 ? 's' : ''}
    </span>
)}
```

#### Verification

- **Given** the user selects "Week" granularity and a week that spans 5 production days
- **When** ProductionLogPage renders
- **Then** the toolbar shows "Data from 5 days" on the right side
- **And** switching to a day shows "Data from 1 day"

---

### AC 7.3.9: Add Empty State for "No Production Data for This Period"

**Given** any of the 6 production pages loads data filtered by the active time selection
**When** the result is an empty dataset (0 rows for the chosen time range)
**Then** instead of the current generic "No [X] data / Upload Prod Pallets file" message, a time-selection-aware empty state is shown:

```tsx
<div className="card p-8 text-center">
    <p className="text-lg font-medium text-text mb-2">No production data for this period</p>
    <p className="text-sm text-text-secondary">
        Try selecting a different {appState.timeSelection.granularity} or check that Prod Pallets data has been uploaded for this date range.
    </p>
</div>
```

#### Step-by-step for each page

Each page currently has an empty-state block that checks `data.length === 0` (or `effData.length === 0 && detailData.length === 0`, or `planSummary.length === 0`). The message text changes from a generic "Upload Prod Pallets file" message to the time-selection-aware message above.

**Page-specific empty state conditions (unchanged logic, new message):**

| Page | Current condition | Existing message |
|---|---|---|
| ProductionLogPage | `data.length === 0` | "No production data" |
| EfficiencyByLinePage | `effData.length === 0 && detailData.length === 0` | "No efficiency data" |
| EfficiencyByLeaderPage | `planSummary.length === 0` | "No efficiency by leader data" |
| PlanSummaryPage | `data.length === 0` | "No plan summary data" |
| ProductionSchedulePage | `data.length === 0` | "No schedule data" |
| TotalProductionPage | `data.length === 0` | "No total production data" |

**Old pattern** (example from ProductionLogPage, lines 73-79):
```tsx
if (data.length === 0) {
    return (
        <div className="card p-8 text-center">
            <p className="text-lg font-medium text-text mb-2">No production data</p>
            <p className="text-sm text-text-secondary">Upload Prod Pallets file to see production log.</p>
        </div>
    );
}
```

**New pattern** (replace the inner content):
```tsx
if (data.length === 0) {
    return (
        <div className="space-y-4">
            {/* Keep time selection toolbar visible even in empty state */}
            <div className="card p-4 flex items-center gap-4 flex-wrap">
                <GranularitySelector
                    granularities={['day', 'week', 'period', 'year']}
                    active={appState.timeSelection.granularity}
                    onChange={handleGranularityChange}
                    disabled={timeLoading}
                />
                <TimeValueSelector
                    granularity={appState.timeSelection.granularity}
                    timeSelection={appState.timeSelection}
                    availableDays={availableDays}
                    availableWeeks={availableWeeks}
                    availablePeriods={availablePeriods}
                    availableYears={availableYears}
                    onDayChange={handleDayChange}
                    onWeekChange={handleWeekChange}
                    onPeriodChange={handlePeriodChange}
                    onYearChange={handleYearChange}
                    disabled={timeLoading}
                />
            </div>
            <div className="card p-8 text-center">
                <p className="text-lg font-medium text-text mb-2">No production data for this period</p>
                <p className="text-sm text-text-secondary">
                    Try selecting a different {appState.timeSelection.granularity} or check that Prod Pallets data has been uploaded for this date range.
                </p>
            </div>
        </div>
    );
}
```

**IMPORTANT:** The time selection toolbar MUST remain visible in the empty state so the user can switch to a different time range without navigating away. This is why the empty state wraps the toolbar + the empty message in a `<div className="space-y-4">` container.

#### Verification

- **Given** the user selects "Day" granularity and picks a date that has no Prod Pallets data (e.g. a Sunday)
- **When** any of the 6 production pages renders
- **Then** the time selection toolbar still appears at the top
- **And** below it, the empty state message reads "No production data for this period"
- **And** the subtitle says "Try selecting a different day or check that Prod Pallets data has been uploaded for this date range."
- **And** the user can switch to a different day or granularity directly from this view

---

### AC 7.3.10: ProductMasterPage Unchanged (Always Loads Latest)

**Given** `ProductMasterPage.tsx` displays static reference data from the Mstr sheet
**When** Story 7.3 is implemented
**Then** `ProductMasterPage.tsx` receives NO changes whatsoever

**Rationale:** Product master data (code, description, cases/pallet, pkt/case, kg/case, std flow rate) is reference data that does not vary by date. It always shows the latest uploaded version. There is no date dimension to filter on.

#### Verification

- **Given** the current `ProductMasterPage.tsx` file has exactly 131 lines
- **When** Story 7.3 implementation is complete
- **Then** `ProductMasterPage.tsx` has the same 131 lines, unmodified
- **And** it still calls `DataStore.getProdPallets()` (NOT the time-selection variant)
- **And** it does NOT import `useAppState`, `useTimeSelection`, `GranularitySelector`, or `TimeValueSelector`

---

## Technical Implementation Plan

### Phase 1: Shared Toolbar Pattern (Extract if Desired)

Since all 6 pages use the identical toolbar JSX, the developer MAY optionally extract a shared component:

```typescript
// src/components/production/ProductionTimeToolbar.tsx (OPTIONAL)
'use client';

import React from 'react';
import { useAppState } from '@/stores/app-store';
import { useTimeSelection } from '@/hooks/useTimeSelection';
import { GranularitySelector } from '@/components/common/GranularitySelector';
import { TimeValueSelector } from '@/components/common/TimeValueSelector';

export function ProductionTimeToolbar(): React.ReactElement {
    const appState = useAppState();
    const {
        availableDays, availableWeeks, availablePeriods, availableYears,
        isLoading: timeLoading,
        handleGranularityChange, handleDayChange, handleWeekChange,
        handlePeriodChange, handleYearChange,
    } = useTimeSelection();

    return (
        <div className="card p-4 flex items-center gap-4 flex-wrap">
            <GranularitySelector
                granularities={['day', 'week', 'period', 'year']}
                active={appState.timeSelection.granularity}
                onChange={handleGranularityChange}
                disabled={timeLoading}
            />
            <TimeValueSelector
                granularity={appState.timeSelection.granularity}
                timeSelection={appState.timeSelection}
                availableDays={availableDays}
                availableWeeks={availableWeeks}
                availablePeriods={availablePeriods}
                availableYears={availableYears}
                onDayChange={handleDayChange}
                onWeekChange={handleWeekChange}
                onPeriodChange={handlePeriodChange}
                onYearChange={handleYearChange}
                disabled={timeLoading}
            />
        </div>
    );
}
```

If this optional component is created, each page simply renders `<ProductionTimeToolbar />` instead of the full toolbar JSX. However, this is NOT required -- inline JSX is equally acceptable for this story.

### Phase 2: Page-by-Page Modification

Apply changes to each page in this order (simplest first):

1. **PlanSummaryPage.tsx** -- simplest, single array, no filters
2. **TotalProductionPage.tsx** -- single array, has search bar
3. **ProductionLogPage.tsx** -- single array, has line filter
4. **ProductionSchedulePage.tsx** -- single array, has line filter
5. **EfficiencyByLinePage.tsx** -- two arrays (`prodEfficiency` + `detail`)
6. **EfficiencyByLeaderPage.tsx** -- most complex, three data sources with JOIN

### Phase 3: Empty State Updates

Update all 6 empty-state blocks per AC 7.3.9.

### Phase 4: Smoke Test

1. Upload a Prod Pallets file that covers at least 2 weeks.
2. Navigate to each of the 6 pages.
3. Switch granularity between Day / Week / Period / Year.
4. Confirm data changes on each switch.
5. Confirm ProductMasterPage is unaffected.

---

## Data Flow Diagram

```
User selects granularity + value
        │
        ▼
  useTimeSelection() hook
        │
        ├─ dispatches SET_GRANULARITY / SET_SELECTED_WEEK / etc.
        │
        ▼
  appState.timeSelection (global state, persists across page nav)
        │
        ▼
  ProductionLogPage (or any of 6 pages)
        │
        ├─ useEffect([appState.timeSelection])
        │       │
        │       ▼
        │   DataStore.getProdPalletsForTimeSelection(ts)
        │       │
        │       ▼
        │   Returns ProdPalletsData filtered to date range
        │       │
        │       ▼
        │   setData(pp.production)  // or pp.planSummary, pp.schedule, etc.
        │
        ▼
  Component re-renders with filtered data
```

---

## Regression Checklist

| Check | Description |
|---|---|
| R1 | Week view on all 6 pages behaves identically to the current all-data view when the selected week covers the same date range as the uploaded file |
| R2 | ProductMasterPage still loads correctly with `getProdPallets()` |
| R3 | Switching pages preserves the selected granularity and value (global state) |
| R4 | Line filter dropdowns on ProductionLogPage, EfficiencyByLinePage, ProductionSchedulePage only show lines present in the filtered data |
| R5 | Summary cards on all pages reflect only the filtered data |
| R6 | EfficiencyByLeaderPage JOIN logic still works correctly with both Prod Pallets and Line Yields filtered to the same time range |
| R7 | Search bar on TotalProductionPage still works within the time-filtered dataset |
| R8 | Sort state on all pages is preserved when switching time selection |

---

## Testing / Verification

### Manual Test Plan

1. **Upload test data:** Load a Prod Pallets file containing data for at least 3 distinct dates (e.g. Monday 2026-02-02 through Friday 2026-02-06).
2. **For each of the 6 pages:**
   a. Navigate to the page.
   b. Confirm the time selection toolbar (GranularitySelector + TimeValueSelector) is visible at the top.
   c. Select "Day" granularity. Pick a specific date. Confirm data shows only that date's rows.
   d. Select "Week" granularity. Pick the week ending 2026-02-07. Confirm data shows Mon-Sat rows.
   e. Select a date/week with NO data. Confirm the empty state message appears with the toolbar still visible.
   f. Confirm summary cards / totals update correctly for each time selection.
3. **ProductMasterPage:** Navigate to Product Master. Confirm NO time selection toolbar appears. Data loads as before.
4. **Cross-page persistence:** Select "Day" on ProductionLogPage, navigate to PlanSummaryPage, confirm it also shows Day granularity with the same date.

### Automated Test Checklist (if unit tests exist)

- [ ] `getProdPalletsForTimeSelection()` returns correct subset for each granularity
- [ ] Each page component renders without errors when `getProdPalletsForTimeSelection()` returns `undefined`
- [ ] Each page component renders without errors when `getProdPalletsForTimeSelection()` returns empty arrays
- [ ] `ProductMasterPage` does not call `getProdPalletsForTimeSelection`

---

## Definition of Done

- [ ] All 10 acceptance criteria implemented and verified
- [ ] 6 production pages import and use `useAppState` and `useTimeSelection`
- [ ] 6 production pages call `DataStore.getProdPalletsForTimeSelection(appState.timeSelection)` instead of `DataStore.getProdPallets()`
- [ ] 6 production pages have `useEffect` dependency on `appState.timeSelection`
- [ ] Time selection toolbar visible on all 6 pages (including in empty state)
- [ ] Empty state shows time-aware message on all 6 pages
- [ ] ProductMasterPage is completely unchanged
- [ ] Switching granularity/value on one page is reflected when navigating to another page
- [ ] No TypeScript compilation errors
- [ ] Dev server starts and all 7 production pages render without console errors
