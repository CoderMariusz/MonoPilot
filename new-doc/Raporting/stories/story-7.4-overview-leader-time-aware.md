> **Status:** TODO
> **Depends on:** Story 7.1 (date-keyed storage), Story 7.2 (query methods: `getProdPalletsForTimeSelection()`)
> **Components:** `src/components/overview/OverviewDashboard.tsx`, `src/components/line-leader/LineLeaderPage.tsx`
> **Bug fix:** Prod Pallets data (planSummary, prodEfficiency, totals) ignores time selection on Overview and Line Leader pages

# Story 7.4: Overview & Line Leader — Production Data Time-Aware

## Story Overview
**Epic**: Time-Aware Prod Pallets Integration
**Priority**: High (data correctness bug — KPIs show wrong time range)
**Estimated Effort**: 1 development session
**Dependencies**: Story 7.1 (date-keyed Prod Pallets storage), Story 7.2 (`getProdPalletsForTimeSelection()` query method on DataStore)

### User Story
> As a **Manager or Supervisor**, I want the **Overview KPI cards (Cases Produced, Efficiency %) and Line Leader heatmap efficiency values** to update when I change the time selection (day/week/period/year) so that **all dashboard data consistently reflects the same time range, not a stale snapshot from the latest day**.

### Problem Statement
Two existing dashboard pages consume Prod Pallets data (`planSummary`, `prodEfficiency`, `totals`) but load it **without** time filtering. They call `DataStore.getProdPallets()` which returns the **entire latest snapshot** regardless of the active time selection. This causes a data mismatch:

1. **OverviewDashboard**: When user selects "Week 5", yield data filters to Week 5, but the "Cases Produced" and "Efficiency %" KPI cards still show the latest day's totals/planSummary data.
2. **LineLeaderPage**: The `leaderEffLookup` useMemo builds a `line->leader` mapping from `planSummary` and `prodEfficiency` arrays. These arrays never change when the time selection changes, so heatmap efficiency values are static.

### Solution
Replace `DataStore.getProdPallets()` calls in both files with `DataStore.getProdPalletsForTimeSelection(appState.timeSelection)`, and add `appState.timeSelection` (via `timeKey`) to the relevant `useEffect` dependency arrays so data reloads when the user changes time selection.

---

## Prerequisites

Before implementing this story, the following **must** already exist:

1. **Story 7.1** — Prod Pallets data is stored with date keys in IndexedDB (each `PlanSummaryRow`, `TotProdRow`, `ProdEfficiencyRow`, and `YieldsRow` has a `date` field that can be filtered).
2. **Story 7.2** — `DataStore` has a method called `getProdPalletsForTimeSelection(ts: TimeSelection)` that:
   - Accepts a `TimeSelection` object (from `@/lib/time-selection/types`)
   - Dispatches by `ts.granularity` (day/week/period/year)
   - Returns a `ProdPalletsData` (or `undefined`) containing **only** the rows matching the selected time range
   - Each sub-array (`planSummary`, `totals`, `prodEfficiency`, `yields`, etc.) is filtered to the selected date range

---

## Acceptance Criteria

### AC 7.4.1: OverviewDashboard — Replace `getProdPallets()` with `getProdPalletsForTimeSelection()`

- **Given** the file `src/components/overview/OverviewDashboard.tsx` exists at its current state
- **And** the file contains a `useEffect` block (lines 44-82) that loads data on mount
- **And** inside that `useEffect`, on **line 67**, there is this exact call:
  ```typescript
  const prodPallets = await DataStore.getProdPallets();
  ```
- **And** `DataStore` is already imported from `@/stores/data-store` (line 12)
- **And** `appState` is already available via `const appState = useAppState()` (line 31)
- **And** `appState.timeSelection` is of type `TimeSelection` (from `@/lib/time-selection/types`)

- **When** a developer modifies line 67 of `src/components/overview/OverviewDashboard.tsx`

- **Then** the old call:
  ```typescript
  const prodPallets = await DataStore.getProdPallets();
  ```
  is replaced with:
  ```typescript
  const prodPallets = await DataStore.getProdPalletsForTimeSelection(appState.timeSelection);
  ```
- **And** the rest of the block (lines 68-73) remains unchanged:
  ```typescript
  if (prodPallets?.totals) {
      setTotProdData(prodPallets.totals);
  }
  if (prodPallets?.planSummary) {
      setPlanSummaryData(prodPallets.planSummary);
  }
  ```
- **And** no other lines in the file are modified by this AC
- **And** the file compiles with zero TypeScript errors (`npx tsc --noEmit`)

---

### AC 7.4.2: OverviewDashboard — Add `timeKey` to useEffect dependency array for Prod Pallets loading

- **Given** the file `src/components/overview/OverviewDashboard.tsx` exists
- **And** on **line 41** there is already:
  ```typescript
  const timeKey = getTimeSelectionKey(appState.timeSelection);
  ```
  which produces a stable string key for the current time selection (e.g., `"week:2025-02-07"` or `"day:2025-02-03"`)
- **And** the `useEffect` on lines 44-82 currently has the dependency array `[timeKey]` on **line 82**:
  ```typescript
  }, [timeKey]);
  ```
- **And** this `useEffect` already uses `timeKey` to decide whether to reload LINE YIELDS data (lines 49-54)

- **When** a developer examines the dependency array on line 82

- **Then** the dependency array **already contains `timeKey`**, so **no change is needed** for the dependency array itself — the `useEffect` already re-runs when time selection changes
- **And** the key insight is: after AC 7.4.1, the `getProdPalletsForTimeSelection(appState.timeSelection)` call is now **inside** the same `useEffect` that has `[timeKey]` as its dependency, so it will **automatically re-execute** whenever the user changes the time selection
- **And** this means: when the user switches from "Week 5" to "Week 6", the `useEffect` fires, re-fetches LINE YIELDS **and** Prod Pallets for the new time range, and updates both `setPlanSummaryData` and `setTotProdData` with the correct filtered data

**Verification:** No code change is needed for this AC — it is a verification step. Confirm that line 82 reads `}, [timeKey]);` and that the Prod Pallets loading code (from AC 7.4.1) is inside this same `useEffect`.

---

### AC 7.4.3: OverviewDashboard — Handle empty Prod Pallets for selected time range

- **Given** the user has selected a time range (e.g., "Week 2") for which no Prod Pallets data exists in IndexedDB
- **And** `DataStore.getProdPalletsForTimeSelection(appState.timeSelection)` returns `undefined` (no data for that range)

- **When** the `useEffect` in `OverviewDashboard.tsx` runs and `prodPallets` is `undefined`

- **Then** the existing guards already handle this correctly:
  ```typescript
  if (prodPallets?.totals) {
      setTotProdData(prodPallets.totals);
  }
  if (prodPallets?.planSummary) {
      setPlanSummaryData(prodPallets.planSummary);
  }
  ```
  Because `prodPallets` is `undefined`, the optional chaining `?.totals` and `?.planSummary` will both evaluate to `undefined`, so neither `setTotProdData` nor `setPlanSummaryData` will be called.

- **But** there is a problem: the **previous** time range's data will remain in state. If user goes from Week 5 (has data) to Week 2 (no data), the state still holds Week 5's `planSummaryData` and `totProdData`.

- **Then** the developer must add a reset at the top of the `loadData()` function, **before** the async calls. Add these two lines right after `setIsLoading(true)` (after line 46 and before the `try` block on line 47):
  ```typescript
  // Reset Prod Pallets state to prevent stale data from previous time range
  setPlanSummaryData([]);
  setTotProdData([]);
  ```

- **And** alternatively, add an `else` branch after the existing `if` checks:
  ```typescript
  const prodPallets = await DataStore.getProdPalletsForTimeSelection(appState.timeSelection);
  if (prodPallets?.totals) {
      setTotProdData(prodPallets.totals);
  } else {
      setTotProdData([]);
  }
  if (prodPallets?.planSummary) {
      setPlanSummaryData(prodPallets.planSummary);
  } else {
      setPlanSummaryData([]);
  }
  ```

- **And** when `planSummaryData` is an empty array `[]`, the `KPISummaryRow` component (file: `src/components/overview/KPISummaryRow.tsx`) calls `calculateWeightedEfficiency([])` (line 106) which returns `0`
- **And** the Efficiency % KPI card will display `"0.0%"` (formatted on line 163 as `(currentEfficiency * 100).toFixed(1)`)
- **And** when `totProdData` is an empty array `[]`, `calculateTotalCases([])` returns `0` (line 55), and the Cases Produced card shows `"0"`

---

### AC 7.4.4: OverviewDashboard — Previous period comparison for Prod Pallets

- **Given** the `KPISummaryRow` component (file: `src/components/overview/KPISummaryRow.tsx`) accepts optional props `previousWeekTotals?: TotProdRow[]` (line 21)
- **And** in the current `OverviewDashboard.tsx`, the `<KPISummaryRow>` call on lines 242-248 does **not** pass `previousWeekTotals`:
  ```tsx
  <KPISummaryRow
      currentWeekData={currentData}
      previousWeekData={previousData}
      planSummaryData={planSummaryData}
      lineComparison={lineComparison}
      isLoading={isLoading}
  />
  ```
- **And** the "Cases Produced" card currently shows a `casesChange` of `0` because `previousWeekTotals` defaults to `undefined` and `calculateTotalCases(undefined)` returns `0`, making `previousCases = 0` (line 100 of KPISummaryRow.tsx)

- **When** a developer wants to enable week-over-week comparison for Cases Produced

- **Then** in `OverviewDashboard.tsx`, add a new state variable after line 36:
  ```typescript
  const [prevTotProdData, setPrevTotProdData] = useState<TotProdRow[]>([]);
  const [prevPlanSummaryData, setPrevPlanSummaryData] = useState<PlanSummaryRow[]>([]);
  ```

- **And** inside the `useEffect` `loadData()` function, after loading current Prod Pallets data, also load previous period data using `filterPreviousTimeSelection` (already imported on line 23):
  ```typescript
  // Load previous period Prod Pallets for W/W comparison
  const prevProdPallets = await DataStore.getProdPalletsForPreviousTimeSelection(appState.timeSelection);
  if (prevProdPallets?.totals) {
      setPrevTotProdData(prevProdPallets.totals);
  } else {
      setPrevTotProdData([]);
  }
  if (prevProdPallets?.planSummary) {
      setPrevPlanSummaryData(prevProdPallets.planSummary);
  } else {
      setPrevPlanSummaryData([]);
  }
  ```

- **And** pass the new state to `<KPISummaryRow>`:
  ```tsx
  <KPISummaryRow
      currentWeekData={currentData}
      previousWeekData={previousData}
      planSummaryData={planSummaryData}
      previousPlanSummaryData={prevPlanSummaryData}
      currentWeekTotals={totProdData}
      previousWeekTotals={prevTotProdData}
      lineComparison={lineComparison}
      isLoading={isLoading}
  />
  ```

- **And** the `KPISummaryRow` component on line 100 will now calculate:
  ```typescript
  const previousCases = calculateTotalCases(previousWeekTotals); // Non-zero
  ```
  enabling a meaningful `casesChange` percentage on line 111

**Note:** This AC depends on Story 7.2 providing a `getProdPalletsForPreviousTimeSelection()` method or equivalent. If that method does not exist, this AC should be deferred. The implementer must check `data-store.ts` for the available API. An alternative is to compute previous time selection in the component and call `getProdPalletsForTimeSelection()` with the previous selection.

---

### AC 7.4.5: LineLeaderPage — Replace `getProdPallets()` with `getProdPalletsForTimeSelection()`

- **Given** the file `src/components/line-leader/LineLeaderPage.tsx` exists at its current state
- **And** the file contains a `useEffect` block (lines 51-75) that loads data on mount
- **And** inside that `useEffect`, on **line 57**, there is this exact call:
  ```typescript
  const prodPalletsData = await DataStore.getProdPallets();
  ```
- **And** `DataStore` is already imported from `@/stores/data-store` (line 20)
- **And** `appState` is already available via `const appState = useAppState()` (line 37)
- **And** `appState.timeSelection` is of type `TimeSelection`

- **When** a developer modifies line 57 of `src/components/line-leader/LineLeaderPage.tsx`

- **Then** the old call:
  ```typescript
  const prodPalletsData = await DataStore.getProdPallets();
  ```
  is replaced with:
  ```typescript
  const prodPalletsData = await DataStore.getProdPalletsForTimeSelection(appState.timeSelection);
  ```
- **And** the rest of the block (lines 58-61) remains unchanged:
  ```typescript
  if (prodPalletsData) {
      if (prodPalletsData.yields) setProdYields(prodPalletsData.yields);
      if (prodPalletsData.planSummary) setPlanSummary(prodPalletsData.planSummary);
      if (prodPalletsData.prodEfficiency) setProdEfficiency(prodPalletsData.prodEfficiency);
  }
  ```
- **And** no other lines in the file are modified by this AC
- **And** the file compiles with zero TypeScript errors

---

### AC 7.4.6: LineLeaderPage — Add `timeKey` to useEffect dependency array

- **Given** the file `src/components/line-leader/LineLeaderPage.tsx` exists
- **And** the `useEffect` on lines 51-75 currently has an **empty** dependency array on **line 75**:
  ```typescript
  }, []);
  ```
  This means the data loading function runs only **once** on component mount, and never re-runs when the time selection changes.
- **And** the file already imports `getTimeSelectionKey` — **CHECK THIS**: look at the import block (lines 26-30). If `getTimeSelectionKey` is NOT imported, it must be added.

- **When** a developer modifies `src/components/line-leader/LineLeaderPage.tsx`

- **Then** first, if `getTimeSelectionKey` is not already imported, add it to the existing import from `@/lib/time-selection` (line 26-30):
  ```typescript
  import {
      filterDataByTimeSelection,
      getTrendTimePoints,
      filterDataForTrendPoint,
      getTimeSelectionKey,
  } from '@/lib/time-selection';
  ```

- **And** add a `timeKey` variable after line 37 (after `const appState = useAppState();`):
  ```typescript
  const timeKey = getTimeSelectionKey(appState.timeSelection);
  ```

- **And** change the dependency array on line 75 from:
  ```typescript
  }, []);
  ```
  to:
  ```typescript
  }, [timeKey]);
  ```

- **And** this causes the `useEffect` to re-run whenever the user changes the time selection (day, week, period, or year)
- **And** inside the `useEffect`, the `DataStore.getLineYields()` call on line 55 should also be updated to use `DataStore.getLineYieldsForTimeSelection(appState.timeSelection)` for consistency (though this is partially handled by the existing `filteredData` useMemo on line 78-81, loading ALL data then filtering client-side is wasteful)

**Optional optimization (recommended but not required for this story):**
Replace line 55:
```typescript
const yieldsData = await DataStore.getLineYields();
```
with:
```typescript
const yieldsData = await DataStore.getLineYieldsForTimeSelection(appState.timeSelection);
```
This eliminates client-side filtering of the full dataset and pushes filtering to the IndexedDB query layer.

---

### AC 7.4.7: LineLeaderPage — Handle empty Prod Pallets for selected time range

- **Given** the user has selected a time range for which no Prod Pallets data exists
- **And** `DataStore.getProdPalletsForTimeSelection(appState.timeSelection)` returns `undefined`

- **When** the `useEffect` in `LineLeaderPage.tsx` runs

- **Then** the existing guard `if (prodPalletsData)` on line 58 will prevent any state updates, but **stale data from a previous time range will persist in state**

- **Then** the developer must add reset logic at the top of the `loadData()` function, after `setIsLoading(true)` (line 53):
  ```typescript
  // Reset Prod Pallets state to prevent stale data from previous time range
  setProdYields([]);
  setPlanSummary([]);
  setProdEfficiency([]);
  ```

- **And** additionally, add `else` branches to clear state when no data:
  ```typescript
  const prodPalletsData = await DataStore.getProdPalletsForTimeSelection(appState.timeSelection);
  if (prodPalletsData) {
      if (prodPalletsData.yields) setProdYields(prodPalletsData.yields);
      else setProdYields([]);
      if (prodPalletsData.planSummary) setPlanSummary(prodPalletsData.planSummary);
      else setPlanSummary([]);
      if (prodPalletsData.prodEfficiency) setProdEfficiency(prodPalletsData.prodEfficiency);
      else setProdEfficiency([]);
  } else {
      setProdYields([]);
      setPlanSummary([]);
      setProdEfficiency([]);
  }
  ```

- **And** when `planSummary` is `[]`, the `leaderEffLookup` useMemo (lines 268-299) will:
  - Build an empty `lineToLeader` Map (no entries)
  - Build an empty `byLeader` Map (no entries)
  - Build an empty `plnSmyEffic` Map (no entries)
  - Return `{ byLeader: Map(0), plnSmyEffic: Map(0) }`

- **And** when `leaderEffLookup.plnSmyEffic` is empty, the heatmap efficiency cells (line 386) will show `0` via:
  ```typescript
  value = leaderEffLookup.plnSmyEffic.get(leader.name) || 0;
  ```

---

### AC 7.4.8: Verify KPI cards react to time selection changes

- **Given** the OverviewDashboard renders with data loaded
- **And** the user has selected "Week 5" in the time selector
- **And** KPI cards display Yield %, GA %, Cases Produced, Yield Var £, and Efficiency %

- **When** the user changes the time selection to "Week 3"

- **Then** the `timeKey` variable changes (e.g., from `"week:2025-02-07"` to `"week:2025-01-24"`)
- **And** the `useEffect` re-runs because `timeKey` is in its dependency array
- **And** `DataStore.getLineYieldsForTimeSelection(appState.timeSelection)` returns LINE YIELDS rows for Week 3
- **And** `DataStore.getProdPalletsForTimeSelection(appState.timeSelection)` returns Prod Pallets data for Week 3
- **And** `setPlanSummaryData()` is called with Week 3's `planSummary` rows
- **And** `setTotProdData()` is called with Week 3's `totals` rows
- **And** the "Cases Produced" KPI card now shows `calculateTotalCases(week3Totals)` — the sum of `row.cases` for Week 3 only
- **And** the "Efficiency %" KPI card now shows `calculateWeightedEfficiency(week3PlanSummary)` — weighted by `availHrs` for Week 3 only
- **And** all 5 KPI cards reflect Week 3 data consistently

**Manual test steps:**
1. Open the dashboard at `http://localhost:3000`
2. Navigate to Overview page
3. Note the values of "Cases Produced" and "Efficiency %" cards
4. Change the week selector to a different week
5. Verify that "Cases Produced" changes to reflect the new week
6. Verify that "Efficiency %" changes to reflect the new week
7. Verify that "Yield %" and "GA %" also change (these already work correctly)

---

### AC 7.4.9: Verify heatmap efficiency values react to time selection changes

- **Given** the LineLeaderPage renders with data loaded
- **And** the user is viewing the "Heatmap" view (viewMode === 'heatmap')
- **And** the heatmap metric tab is set to "Efficiency"
- **And** the heatmap shows efficiency values per leader per week

- **When** the user changes the time selection from "Week 5" to "Period 3"

- **Then** the `timeKey` variable changes
- **And** the `useEffect` re-runs and calls `DataStore.getProdPalletsForTimeSelection(appState.timeSelection)` with the new Period 3 selection
- **And** `setPlanSummary()` receives Period 3's `planSummary` rows
- **And** `setProdEfficiency()` receives Period 3's `prodEfficiency` rows
- **And** the `leaderEffLookup` useMemo (lines 268-299) recalculates with Period 3 data:
  - `lineToLeader` Map is rebuilt from Period 3's `planSummary`
  - `plnSmyEffic` Map is recalculated: `sum(efficPct * availHrs) / sum(availHrs)` for Period 3 only
- **And** the heatmap data useMemo (lines 356-395) recalculates:
  - For the efficiency metric (line 386): `leaderEffLookup.plnSmyEffic.get(leader.name)` now returns Period 3 efficiency
- **And** heatmap cell colors update to reflect Period 3 efficiency values

**Manual test steps:**
1. Open the dashboard at `http://localhost:3000`
2. Navigate to Line Leader Performance page
3. Click "Heatmap" view toggle
4. Select "Efficiency" metric tab
5. Note the efficiency values displayed in heatmap cells
6. Change the time selection to a different week or period
7. Verify that heatmap efficiency cell values change
8. Switch to Scorecard view and verify efficiency column values also change

---

## Technical Implementation Plan

### Step-by-step Implementation Order

| Step | File | Change | Lines Affected |
|------|------|--------|----------------|
| 1 | `src/components/overview/OverviewDashboard.tsx` | Replace `getProdPallets()` with `getProdPalletsForTimeSelection(appState.timeSelection)` | Line 67 |
| 2 | `src/components/overview/OverviewDashboard.tsx` | Add `else` branches to reset state when no Prod Pallets data for selected range | Lines 68-73 |
| 3 | `src/components/overview/OverviewDashboard.tsx` | (Optional) Add previous-period Prod Pallets state and loading for W/W comparison | After line 36, inside loadData |
| 4 | `src/components/overview/OverviewDashboard.tsx` | Pass `currentWeekTotals` and `previousWeekTotals` props to `<KPISummaryRow>` | Lines 242-248 |
| 5 | `src/components/line-leader/LineLeaderPage.tsx` | Import `getTimeSelectionKey` from `@/lib/time-selection` | Line 26-30 |
| 6 | `src/components/line-leader/LineLeaderPage.tsx` | Add `const timeKey = getTimeSelectionKey(appState.timeSelection)` | After line 37 |
| 7 | `src/components/line-leader/LineLeaderPage.tsx` | Replace `getProdPallets()` with `getProdPalletsForTimeSelection(appState.timeSelection)` | Line 57 |
| 8 | `src/components/line-leader/LineLeaderPage.tsx` | Change `useEffect` dependency from `[]` to `[timeKey]` | Line 75 |
| 9 | `src/components/line-leader/LineLeaderPage.tsx` | Add reset + else branches for empty Prod Pallets state | Lines 53, 58-61 |
| 10 | Both files | Verify TypeScript compilation: `npx tsc --noEmit` | N/A |

### Data Flow — Before (Bug)

```
User selects "Week 5"
  --> useEffect fires (OverviewDashboard)
      --> DataStore.getLineYieldsForTimeSelection({week: "W5"})  --> Returns W5 LINE YIELDS  ✅
      --> DataStore.getProdPallets()                              --> Returns ALL Prod Pallets ❌
          --> planSummary = ALL rows (latest day snapshot)
          --> totals = ALL rows (latest day snapshot)
  --> KPI cards:
      --> Yield % = W5 weighted avg     ✅ (correct time range)
      --> GA % = W5 weighted avg        ✅ (correct time range)
      --> Cases Produced = ALL totals   ❌ (wrong time range — always latest day)
      --> Efficiency % = ALL planSummary ❌ (wrong time range — always latest day)
```

### Data Flow — After (Fixed)

```
User selects "Week 5"
  --> useEffect fires (OverviewDashboard)
      --> DataStore.getLineYieldsForTimeSelection({week: "W5"})         --> Returns W5 LINE YIELDS  ✅
      --> DataStore.getProdPalletsForTimeSelection({week: "W5"})        --> Returns W5 Prod Pallets ✅
          --> planSummary = W5 rows only
          --> totals = W5 rows only
  --> KPI cards:
      --> Yield % = W5 weighted avg     ✅
      --> GA % = W5 weighted avg        ✅
      --> Cases Produced = W5 totals    ✅ (now correct)
      --> Efficiency % = W5 planSummary ✅ (now correct)
```

### Key Function Signatures (from Story 7.2)

```typescript
// In src/stores/data-store.ts (added by Story 7.2):

/** Get Prod Pallets data filtered by the active time selection */
async getProdPalletsForTimeSelection(ts: TimeSelection): Promise<ProdPalletsData | undefined>

// Dispatches internally by ts.granularity:
//   'day'    → filter all sub-arrays where row.date === ts.selectedDay
//   'week'   → filter all sub-arrays where row.date falls within the week ending ts.selectedWeek
//   'period' → filter all sub-arrays where row.date falls within ts.selectedPeriod.startDate..endDate
//   'year'   → filter all sub-arrays where fiscal year of row.date === ts.selectedYear
```

### Type References

```typescript
// TimeSelection (from src/lib/time-selection/types.ts):
interface TimeSelection {
    granularity: 'day' | 'week' | 'period' | 'year';
    selectedDay?: string;      // YYYY-MM-DD
    selectedWeek: string;      // YYYY-MM-DD (week ending)
    selectedPeriod?: { period: number; fiscalYear: number; startDate: Date; endDate: Date; label: string };
    selectedYear?: number;
}

// ProdPalletsData (from src/types/prod-pallets.ts):
interface ProdPalletsData {
    production: ProdRow[];
    shiftReportData: ShiftReportDataRow[];
    planSummary: PlanSummaryRow[];       // <-- used by both Overview and Line Leader
    productMaster: ProductMasterRow[];
    schedule: SchedRow[];
    totals: TotProdRow[];                // <-- used by Overview "Cases Produced" card
    variances: VarianceRow[];
    prodEfficiency: ProdEfficiencyRow[]; // <-- used by Line Leader leaderEffLookup
    summaryEfficiency: SummaryEfficiencyRow[];
    detail: DetailRow[];
    review: ReviewRow[];
    yields: YieldsRow[];                 // <-- used by Line Leader filteredProdYields
}

// PlanSummaryRow (from src/types/prod-pallets.ts):
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
    efficPct: number;        // <-- used in efficiency calculation: sum(efficPct * availHrs) / sum(availHrs)
}

// TotProdRow (from src/types/prod-pallets.ts):
interface TotProdRow {
    code: string;
    description: string;
    cases: number;           // <-- summed for "Cases Produced" KPI card
    kg: number;
    packets: number;
}
```

---

## Files Modified

| # | File | Type of Change | Lines Changed |
|---|------|----------------|---------------|
| 1 | `src/components/overview/OverviewDashboard.tsx` | Replace `getProdPallets()` call, add state reset, optional previous-period comparison | ~10-20 lines |
| 2 | `src/components/line-leader/LineLeaderPage.tsx` | Add import, add `timeKey`, replace `getProdPallets()` call, change dependency array, add state reset | ~10-15 lines |
| 3 | `src/stores/data-store.ts` | **No change** (method `getProdPalletsForTimeSelection` added by Story 7.2) | 0 lines |
| 4 | `src/components/overview/KPISummaryRow.tsx` | **No change** (already accepts `currentWeekTotals` and `previousWeekTotals` props) | 0 lines |

---

## Dependencies

| Dependency | Story | Status | What it provides |
|------------|-------|--------|------------------|
| Date-keyed Prod Pallets storage | Story 7.1 | Required | Each Prod Pallets row has a `date` field enabling time-based filtering |
| `getProdPalletsForTimeSelection()` | Story 7.2 | Required | DataStore method that filters Prod Pallets by TimeSelection |
| `getTimeSelectionKey()` | Cross-cutting (already exists) | Available | Stable string key from TimeSelection for useEffect deps |
| `filterPreviousTimeSelection()` | Cross-cutting (already exists) | Available | Used for previous-period comparison in AC 7.4.4 |

---

## Testing & Verification

### TypeScript Compilation
```bash
cd manufacturing-kpi-dashboard
npx tsc --noEmit
```
Expected: Zero errors.

### Visual Verification — Overview Dashboard

| Test Case | Steps | Expected Result |
|-----------|-------|-----------------|
| Cases change with week | 1. Open Overview. 2. Select Week 5. 3. Note "Cases Produced" value. 4. Select Week 3. | "Cases Produced" value changes to Week 3 totals |
| Efficiency changes with week | 1. Open Overview. 2. Select Week 5. 3. Note "Efficiency %" value. 4. Select Week 3. | "Efficiency %" value changes to Week 3 weighted avg |
| No data for selected range | 1. Open Overview. 2. Select a week with no Prod Pallets data. | "Cases Produced" shows "0". "Efficiency %" shows "0.0%" |
| All 5 cards consistent | 1. Open Overview. 2. Select any week. | All 5 KPI cards (Yield, GA, Cases, Var, Efficiency) show data for the same time range |

### Visual Verification — Line Leader Page

| Test Case | Steps | Expected Result |
|-----------|-------|-----------------|
| Heatmap efficiency updates | 1. Open Line Leader. 2. Switch to Heatmap. 3. Select "Efficiency" tab. 4. Change week. | Heatmap cell colors change for efficiency |
| Scorecard efficiency updates | 1. Open Line Leader. 2. Stay on Scorecard. 3. Change week. | Efficiency column values change |
| No data for selected range | 1. Open Line Leader. 2. Select a week with no Prod Pallets data. | Efficiency values show 0. Heatmap shows neutral colors. |
| PlanSummary reloads on time change | 1. Open Line Leader. 2. Select Week 5. 3. Open browser DevTools Network tab. 4. Select Week 3. | Observe that loadData() runs again (useEffect re-fires) |

### Regression Checks

| Check | What to verify |
|-------|---------------|
| Yield % still correct | Yield KPI card still uses LINE YIELDS data, not affected by this change |
| GA % still correct | GA KPI card still uses LINE YIELDS data, not affected by this change |
| Variance still correct | Yield Var £ card still uses LINE YIELDS `variancePounds`, not affected |
| Trend chart still works | 13-week trend chart uses `lineYields` state, not Prod Pallets |
| Top Gains/Losses still works | Uses `lineComparison` from LINE YIELDS, not Prod Pallets |
| Grade calculation still works | Uses `filteredData` (LINE YIELDS) + `filteredProdYields`, both already time-filtered |

---

## Edge Cases

1. **Prod Pallets loaded but no date field (pre-Story 7.1):** If Story 7.1 has not been implemented, `getProdPalletsForTimeSelection()` will not exist on DataStore. The implementer MUST verify Story 7.1 and 7.2 are complete before starting.

2. **User rapidly switches time selection:** The `useEffect` will fire multiple times. React's cleanup function or a stale-closure guard should prevent setting state from an outdated response. Consider adding an `isCancelled` flag:
   ```typescript
   useEffect(() => {
       let cancelled = false;
       async function loadData() {
           setIsLoading(true);
           // ... fetch data ...
           if (!cancelled) {
               // ... set state ...
           }
       }
       loadData();
       return () => { cancelled = true; };
   }, [timeKey]);
   ```

3. **`getProdPalletsForTimeSelection` returns data with empty sub-arrays:** Even if `prodPallets` is not `undefined`, individual arrays like `prodPallets.totals` may be `[]`. The existing `if (prodPallets?.totals)` check will pass (truthy for non-empty arrays), but an empty array `[]` is also truthy. Guard with length check if needed, or accept that setting state to `[]` is the correct behavior.

4. **`planSummary` rows have no date field currently:** In the existing `PlanSummaryRow` interface (`src/types/prod-pallets.ts`), there is NO `date` field. Story 7.1 must add a `date` field to `PlanSummaryRow` (and `TotProdRow`, `ProdEfficiencyRow`) for time filtering to work. If Story 7.1 adds date-keyed storage differently (e.g., storing separate snapshots per date), the filtering approach may differ.

---

## Definition of Done
- [ ] AC 7.4.1: `OverviewDashboard.tsx` calls `getProdPalletsForTimeSelection()` instead of `getProdPallets()`
- [ ] AC 7.4.2: Verified that `useEffect` dependency array in OverviewDashboard already includes `timeKey`
- [ ] AC 7.4.3: Empty Prod Pallets state is handled — cards show "0" / "0.0%" instead of stale data
- [ ] AC 7.4.4: (Optional) Previous period Prod Pallets comparison wired up for Cases W/W badge
- [ ] AC 7.4.5: `LineLeaderPage.tsx` calls `getProdPalletsForTimeSelection()` instead of `getProdPallets()`
- [ ] AC 7.4.6: `LineLeaderPage.tsx` `useEffect` dependency changed from `[]` to `[timeKey]`
- [ ] AC 7.4.7: Empty Prod Pallets state handled in LineLeaderPage — efficiency shows 0 instead of stale data
- [ ] AC 7.4.8: Visual verification — Overview KPI cards (Cases, Efficiency) change when time selection changes
- [ ] AC 7.4.9: Visual verification — Heatmap efficiency values change when time selection changes
- [ ] TypeScript compiles with zero errors (`npx tsc --noEmit`)
- [ ] No regressions in Yield %, GA %, Variance, Trend chart, or Top Gains/Losses
