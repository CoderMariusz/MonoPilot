> **Status:** PLANNED
> **Type:** Data infrastructure — query and merge layer for date-keyed Prod Pallets snapshots
> **Depends on:** Story 7.1 (date-keyed storage)

# Story 7.2: Multi-Day Query Methods & Aggregation

## Story Overview
**Epic**: Data Infrastructure
**Priority**: High
**Estimated Effort**: 1-2 development sessions
**Dependencies**: Story 7.1 (date-keyed Prod Pallets storage), Story 1.2 (fiscal calendar), Cross-cutting multi-granularity time selection

### User Story
> As a **dashboard consumer**, I want to **query Prod Pallets data across arbitrary date ranges** (week, period, year) so that **all dashboard pages can display multi-day aggregated production data without manually loading and merging individual snapshots**.

### Problem
After Story 7.1, each day's Prod Pallets data is stored as a separate snapshot under `prodPallets/daily/{date}` in IndexedDB. There are no methods to:
1. Load multiple days at once (e.g. all 5 days of a working week)
2. Merge those snapshots into a single `ProdPalletsData` object
3. Query by week-ending, fiscal period, or fiscal year
4. Discover which dates, weeks, or periods are available in storage

### Solution
Create a merge utility (`merge-prod-pallets.ts`) and extend the `DataStore` object with query methods that load multiple daily snapshots and combine them into one `ProdPalletsData`. Also add discovery methods to list available days, weeks, and periods. Finally, integrate these Prod Pallets dates into the existing `useTimeSelection` hook so the time selectors reflect Prod Pallets coverage as well as Line Yields coverage.

---

## Dependencies

### Upstream (must be complete before this story)
| Dependency | What it provides | File |
|---|---|---|
| Story 7.1 | `DataStore.getProdPalletsForDate(date: string)` returns a single day's `ProdPalletsData` | `src/stores/data-store.ts` |
| Story 7.1 | `DataStore.getProdPalletsDates()` returns `string[]` of available date keys sorted descending | `src/stores/data-store.ts` |
| Story 1.2 | `getFiscalYear(date)`, `getPeriodInfo(date)`, `getFiscalPeriods(year)`, `getWeekEnding(date)` | `src/lib/calendar/fiscal-calendar.ts` |
| Cross-cutting | `TimeSelection` interface, `TimeGranularity` type | `src/lib/time-selection/types.ts` |
| Cross-cutting | `toLocalDateKey(date)`, `getWeekDateRange(weekEnding)` | `src/lib/time-selection/time-utils.ts` |
| Cross-cutting | `useTimeSelection()` hook | `src/hooks/useTimeSelection.ts` |

### Downstream (will consume this story)
| Consumer | What it needs |
|---|---|
| Production Dashboard pages | `DataStore.getProdPalletsForTimeSelection(ts)` |
| Time selectors (header UI) | `DataStore.getProdPalletsDistinctDays()`, `getProdPalletsDistinctWeeks()`, `getProdPalletsDistinctPeriods()` |

---

## Data Flow

```
User selects TimeSelection (day/week/period/year)
         |
         v
getProdPalletsForTimeSelection(ts: TimeSelection)
         |
         +--- day ----> getProdPalletsForDate(ts.selectedDay)
         |                 (single snapshot, no merge needed)
         |
         +--- week ---> getProdPalletsForWeek(ts.selectedWeek)
         |                 |
         |                 v
         |              getWeekDateRange(weekEnding) => {start, end}
         |                 |
         |                 v
         |              getProdPalletsForDateRange(start, end)
         |                 |
         |                 v
         |              for each date in [start..end]:
         |                getProdPalletsForDate(date) => snapshot
         |                 |
         |                 v
         |              mergeProdPalletsSnapshots(snapshots[])
         |                 |
         |                 v
         |              single ProdPalletsData
         |
         +--- period --> getProdPalletsForPeriod(period, fiscalYear)
         |                 |
         |                 v
         |              getFiscalPeriods(fiscalYear) => find period => {startDate, endDate}
         |                 |
         |                 v
         |              getProdPalletsForDateRange(start, end)
         |                 |
         |                 v
         |              mergeProdPalletsSnapshots(snapshots[])
         |
         +--- year ----> getProdPalletsForYear(fiscalYear)
                           |
                           v
                        getFiscalPeriods(fiscalYear) => get year start/end
                           |
                           v
                        getProdPalletsForDateRange(start, end)
                           |
                           v
                        mergeProdPalletsSnapshots(snapshots[])
```

---

## Acceptance Criteria

### AC 7.2.1: Create `createEmptyProdPalletsData()` in new merge utility file

**File to create:** `src/lib/aggregation/merge-prod-pallets.ts`

- **Given** no merge utility file exists yet
- **When** the developer creates `src/lib/aggregation/merge-prod-pallets.ts`
- **Then** the file contains a function `createEmptyProdPalletsData` with the following exact signature and implementation:

**Step 1:** Create the file `src/lib/aggregation/merge-prod-pallets.ts`.

**Step 2:** Add the import at the top of the file:
```typescript
import type { ProdPalletsData } from '@/types/prod-pallets';
```

**Step 3:** Add the function:
```typescript
/**
 * Create an empty ProdPalletsData object with all arrays initialized to [].
 * Used as the base for merging, or as a fallback when no data exists.
 *
 * @returns ProdPalletsData with every field set to an empty array
 */
export function createEmptyProdPalletsData(): ProdPalletsData {
    return {
        production: [],
        shiftReportData: [],
        planSummary: [],
        productMaster: [],
        schedule: [],
        totals: [],
        variances: [],
        prodEfficiency: [],
        summaryEfficiency: [],
        detail: [],
        review: [],
        yields: [],
    };
}
```

**Verification:**
- The return type is `ProdPalletsData` (not `Partial<ProdPalletsData>`).
- All 12 fields from the `ProdPalletsData` interface are present: `production`, `shiftReportData`, `planSummary`, `productMaster`, `schedule`, `totals`, `variances`, `prodEfficiency`, `summaryEfficiency`, `detail`, `review`, `yields`.
- Each field is initialized to `[]`.

---

### AC 7.2.2: Add `mergeProdPalletsSnapshots()` to merge-prod-pallets.ts

**File to modify:** `src/lib/aggregation/merge-prod-pallets.ts` (same file from AC 7.2.1)

- **Given** `createEmptyProdPalletsData()` exists in `merge-prod-pallets.ts`
- **When** the developer adds `mergeProdPalletsSnapshots()`
- **Then** the function concatenates all arrays from multiple snapshots into one `ProdPalletsData`

**Step 1:** Add the following function below `createEmptyProdPalletsData` in the same file:

```typescript
/**
 * Merge multiple ProdPalletsData snapshots into a single ProdPalletsData object.
 * Each array field is concatenated across all snapshots.
 *
 * For `productMaster`, duplicates are de-duplicated by `code` field
 * (the master data is the same across days, so we only keep unique entries).
 *
 * @param snapshots - Array of ProdPalletsData objects (one per day)
 * @returns A single ProdPalletsData with all rows combined
 */
export function mergeProdPalletsSnapshots(snapshots: ProdPalletsData[]): ProdPalletsData {
    if (snapshots.length === 0) {
        return createEmptyProdPalletsData();
    }

    if (snapshots.length === 1) {
        return snapshots[0];
    }

    const merged = createEmptyProdPalletsData();

    for (const snapshot of snapshots) {
        merged.production = merged.production.concat(snapshot.production);
        merged.shiftReportData = merged.shiftReportData.concat(snapshot.shiftReportData);
        merged.planSummary = merged.planSummary.concat(snapshot.planSummary);
        merged.schedule = merged.schedule.concat(snapshot.schedule);
        merged.totals = merged.totals.concat(snapshot.totals);
        merged.variances = merged.variances.concat(snapshot.variances);
        merged.prodEfficiency = merged.prodEfficiency.concat(snapshot.prodEfficiency);
        merged.summaryEfficiency = merged.summaryEfficiency.concat(snapshot.summaryEfficiency);
        merged.detail = merged.detail.concat(snapshot.detail);
        merged.review = merged.review.concat(snapshot.review);
        merged.yields = merged.yields.concat(snapshot.yields);
        merged.productMaster = merged.productMaster.concat(snapshot.productMaster);
    }

    // De-duplicate productMaster by code (same product appears in every day's snapshot)
    const seenCodes = new Set<string>();
    merged.productMaster = merged.productMaster.filter((row) => {
        if (seenCodes.has(row.code)) return false;
        seenCodes.add(row.code);
        return true;
    });

    return merged;
}
```

**Key design decisions:**
- If `snapshots` is empty, return `createEmptyProdPalletsData()` (not `undefined`).
- If `snapshots` has exactly 1 element, return it directly (optimization: no copying).
- `productMaster` is de-duplicated because the Mstr sheet is identical across days; keeping duplicates would inflate memory.
- All other arrays are simply concatenated. Production rows from Day 1 + Day 2 = all production rows for the range.

**Verification:**
- Calling `mergeProdPalletsSnapshots([])` returns an object where every array has `.length === 0`.
- Calling `mergeProdPalletsSnapshots([snapshotA, snapshotB])` where `snapshotA.production` has 10 rows and `snapshotB.production` has 15 rows returns an object with `production.length === 25`.
- If both snapshots have the same `productMaster` entry with `code: "ABC"`, the merged result has only one entry with `code: "ABC"`.

---

### AC 7.2.3: Add `getProdPalletsForDateRange()` to DataStore

**File to modify:** `src/stores/data-store.ts`

- **Given** `DataStore.getProdPalletsForDate(date)` exists (from Story 7.1) and `mergeProdPalletsSnapshots` exists (from AC 7.2.2)
- **When** the developer adds `getProdPalletsForDateRange` to the `DataStore` object
- **Then** it loads all daily snapshots within a date range and merges them

**Step 1:** Add the following import at the top of `src/stores/data-store.ts`:
```typescript
import {
    mergeProdPalletsSnapshots,
    createEmptyProdPalletsData,
} from '@/lib/aggregation/merge-prod-pallets';
```

**Step 2:** Add the following import (if not already present):
```typescript
import { toLocalDateKey } from '@/lib/time-selection';
```

**Step 3:** Add the following method inside the `DataStore` object, in the `// Prod Pallets` section:

```typescript
/**
 * Load Prod Pallets data for a range of dates and merge into one object.
 *
 * @param startDate - Range start as YYYY-MM-DD string (inclusive)
 * @param endDate - Range end as YYYY-MM-DD string (inclusive)
 * @returns Merged ProdPalletsData for all available days in the range
 */
async getProdPalletsForDateRange(startDate: string, endDate: string): Promise<ProdPalletsData> {
    return safeDbOp('getProdPalletsForDateRange', async () => {
        // Step 3a: Get all available dates from the index
        const allDates = await this.getProdPalletsDates();

        // Step 3b: Filter to only dates within [startDate, endDate]
        const datesInRange = allDates.filter(
            (d) => d >= startDate && d <= endDate
        );

        // Step 3c: If no dates in range, return empty
        if (datesInRange.length === 0) {
            return createEmptyProdPalletsData();
        }

        // Step 3d: Load each day's snapshot in parallel
        const snapshotPromises = datesInRange.map(
            (date) => this.getProdPalletsForDate(date)
        );
        const snapshotResults = await Promise.all(snapshotPromises);

        // Step 3e: Filter out undefined results (days that have no data)
        const validSnapshots = snapshotResults.filter(
            (s): s is ProdPalletsData => s !== undefined
        );

        // Step 3f: Merge all valid snapshots into one
        return mergeProdPalletsSnapshots(validSnapshots);
    });
},
```

**Parameters:**
- `startDate`: `string` in `YYYY-MM-DD` format. Inclusive lower bound.
- `endDate`: `string` in `YYYY-MM-DD` format. Inclusive upper bound.

**Return type:** `Promise<ProdPalletsData>` (never `undefined`; returns empty if no data).

**Important details:**
- The string comparison `d >= startDate && d <= endDate` works correctly because dates are in `YYYY-MM-DD` format (lexicographic order matches chronological order).
- `Promise.all` loads snapshots in parallel for performance. If 5 dates are in range, all 5 IndexedDB reads happen concurrently.
- The TypeScript type guard `(s): s is ProdPalletsData => s !== undefined` narrows the type from `(ProdPalletsData | undefined)[]` to `ProdPalletsData[]`.

**Verification:**
- Given dates `["2025-01-06", "2025-01-07", "2025-01-08"]` are available, calling `getProdPalletsForDateRange("2025-01-06", "2025-01-08")` loads all 3 days and merges them.
- Given no dates exist in the range `"2099-01-01"` to `"2099-12-31"`, the method returns `createEmptyProdPalletsData()`.

---

### AC 7.2.4: Add `getProdPalletsForWeek()` to DataStore

**File to modify:** `src/stores/data-store.ts`

- **Given** `getProdPalletsForDateRange` exists (from AC 7.2.3)
- **When** the developer adds `getProdPalletsForWeek` to `DataStore`
- **Then** it computes the week's date range and delegates to `getProdPalletsForDateRange`

**Step 1:** Add the following import at the top of `src/stores/data-store.ts` (if not already present):
```typescript
import { getWeekDateRange, toLocalDateKey } from '@/lib/time-selection';
```

**Step 2:** Add the following method inside the `DataStore` object, below `getProdPalletsForDateRange`:

```typescript
/**
 * Load Prod Pallets data for a full week (Sunday through Saturday).
 *
 * @param weekEnding - The Saturday week-ending date as YYYY-MM-DD
 * @returns Merged ProdPalletsData for all available days in that week
 */
async getProdPalletsForWeek(weekEnding: string): Promise<ProdPalletsData> {
    return safeDbOp('getProdPalletsForWeek', async () => {
        // Step 2a: Compute the start and end dates for this week
        const { start, end } = getWeekDateRange(weekEnding);

        // Step 2b: Convert Date objects to YYYY-MM-DD strings
        const startKey = toLocalDateKey(start);
        const endKey = toLocalDateKey(end);

        // Step 2c: Delegate to date range method
        return this.getProdPalletsForDateRange(startKey, endKey);
    });
},
```

**Parameters:**
- `weekEnding`: `string` in `YYYY-MM-DD` format. Must be a Saturday date.

**Return type:** `Promise<ProdPalletsData>` (never `undefined`).

**How it works:**
- `getWeekDateRange("2025-01-11")` returns `{ start: Date(2025-01-05), end: Date(2025-01-11) }` (Sunday to Saturday).
- `toLocalDateKey(start)` converts the `Date` to `"2025-01-05"`.
- Then `getProdPalletsForDateRange("2025-01-05", "2025-01-11")` does the rest.

**Verification:**
- Calling `getProdPalletsForWeek("2025-01-11")` returns merged data for dates `2025-01-05` through `2025-01-11`.
- If no production data exists for any day in that week, returns empty `ProdPalletsData`.

---

### AC 7.2.5: Add `getProdPalletsForPeriod()` to DataStore

**File to modify:** `src/stores/data-store.ts`

- **Given** `getProdPalletsForDateRange` exists (from AC 7.2.3)
- **When** the developer adds `getProdPalletsForPeriod` to `DataStore`
- **Then** it looks up the fiscal period's start/end dates and delegates to `getProdPalletsForDateRange`

**Step 1:** Ensure the following import exists at the top of `src/stores/data-store.ts`:
```typescript
import { getFiscalPeriods } from '@/lib/calendar/fiscal-calendar';
```
This import already exists in the current `data-store.ts` (the file imports `getFiscalYear` and `getPeriodInfo`; add `getFiscalPeriods` to the same import).

**Step 2:** Add the following method inside the `DataStore` object, below `getProdPalletsForWeek`:

```typescript
/**
 * Load Prod Pallets data for an entire fiscal period.
 *
 * @param period - Fiscal period number (1-13)
 * @param fiscalYear - Fiscal year number (e.g. 2025)
 * @returns Merged ProdPalletsData for all available days in that period
 */
async getProdPalletsForPeriod(period: number, fiscalYear: number): Promise<ProdPalletsData> {
    return safeDbOp('getProdPalletsForPeriod', async () => {
        // Step 2a: Get all 13 fiscal periods for the given year
        const allPeriods = getFiscalPeriods(fiscalYear);

        // Step 2b: Find the specific period (period numbers are 1-based)
        const fiscalPeriod = allPeriods.find((p) => p.periodNumber === period);

        // Step 2c: If period not found (invalid input), return empty
        if (!fiscalPeriod) {
            return createEmptyProdPalletsData();
        }

        // Step 2d: Convert period start/end dates to YYYY-MM-DD strings
        const startKey = toLocalDateKey(fiscalPeriod.startDate);
        const endKey = toLocalDateKey(fiscalPeriod.endDate);

        // Step 2e: Delegate to date range method
        return this.getProdPalletsForDateRange(startKey, endKey);
    });
},
```

**Parameters:**
- `period`: `number`, 1 through 13.
- `fiscalYear`: `number`, e.g. `2025`.

**Return type:** `Promise<ProdPalletsData>` (never `undefined`).

**How it works:**
- `getFiscalPeriods(2025)` returns an array of 13 `FiscalPeriod` objects, each with `periodNumber`, `startDate`, `endDate`.
- We find the one where `periodNumber === period`.
- Its `startDate` and `endDate` define the date range (typically 4 or 5 weeks).
- Then `getProdPalletsForDateRange(startKey, endKey)` loads and merges all daily snapshots within that range.

**Verification:**
- Calling `getProdPalletsForPeriod(1, 2025)` returns merged data for the date range of Period 1 of fiscal year 2025 (typically 4 weeks = ~20 working days).
- Calling `getProdPalletsForPeriod(99, 2025)` returns empty `ProdPalletsData` because period 99 does not exist.

---

### AC 7.2.6: Add `getProdPalletsForYear()` to DataStore

**File to modify:** `src/stores/data-store.ts`

- **Given** `getProdPalletsForDateRange` exists (from AC 7.2.3)
- **When** the developer adds `getProdPalletsForYear` to `DataStore`
- **Then** it computes the fiscal year's full date range and delegates to `getProdPalletsForDateRange`

**Step 1:** Ensure the following import exists at the top of `src/stores/data-store.ts`:
```typescript
import { getFiscalPeriods } from '@/lib/calendar/fiscal-calendar';
```
(Already added in AC 7.2.5.)

**Step 2:** Add the following method inside the `DataStore` object, below `getProdPalletsForPeriod`:

```typescript
/**
 * Load Prod Pallets data for an entire fiscal year (all 13 periods).
 *
 * @param fiscalYear - Fiscal year number (e.g. 2025)
 * @returns Merged ProdPalletsData for all available days in that fiscal year
 */
async getProdPalletsForYear(fiscalYear: number): Promise<ProdPalletsData> {
    return safeDbOp('getProdPalletsForYear', async () => {
        // Step 2a: Get all 13 fiscal periods for the given year
        const allPeriods = getFiscalPeriods(fiscalYear);

        // Step 2b: If no periods returned (should not happen), return empty
        if (allPeriods.length === 0) {
            return createEmptyProdPalletsData();
        }

        // Step 2c: The year range is from Period 1 start to Period 13 end
        const yearStart = toLocalDateKey(allPeriods[0].startDate);
        const yearEnd = toLocalDateKey(allPeriods[allPeriods.length - 1].endDate);

        // Step 2d: Delegate to date range method
        return this.getProdPalletsForDateRange(yearStart, yearEnd);
    });
},
```

**Parameters:**
- `fiscalYear`: `number`, e.g. `2025`.

**Return type:** `Promise<ProdPalletsData>` (never `undefined`).

**How it works:**
- `getFiscalPeriods(2025)` returns 13 periods. The first period's `startDate` is the fiscal year start. The last period's `endDate` is the fiscal year end.
- `getProdPalletsForDateRange(yearStart, yearEnd)` loads all daily snapshots within that ~52-week range.

**Performance note:** A full fiscal year may have 250+ working days. Loading 250 snapshots from IndexedDB via `Promise.all` should still be fast (each is a small key-value read), but if performance is an issue, a future optimization could load in batches. For now, `Promise.all` is acceptable.

**Verification:**
- Calling `getProdPalletsForYear(2025)` returns merged data spanning the full fiscal year 2025 (52 weeks).
- If only 30 days of data exist in 2025, only those 30 snapshots are loaded (the other dates simply return `undefined` and are filtered out).

---

### AC 7.2.7: Add `getProdPalletsForTimeSelection()` dispatcher to DataStore

**File to modify:** `src/stores/data-store.ts`

- **Given** all granularity-specific methods exist (ACs 7.2.3-7.2.6) and `DataStore.getProdPalletsForDate(date)` exists (from Story 7.1)
- **When** the developer adds `getProdPalletsForTimeSelection` to `DataStore`
- **Then** it dispatches to the correct method based on `TimeSelection.granularity`

**Step 1:** Ensure the following import exists at the top of `src/stores/data-store.ts`:
```typescript
import type { TimeSelection } from '@/lib/time-selection';
```
(This import already exists in the current file.)

**Step 2:** Add the following method inside the `DataStore` object, below `getProdPalletsForYear`:

```typescript
/**
 * Load Prod Pallets data for the active time selection.
 * Dispatches to the correct granularity-specific method.
 *
 * @param ts - The current TimeSelection from app state
 * @returns Merged ProdPalletsData for the selected time range
 */
async getProdPalletsForTimeSelection(ts: TimeSelection): Promise<ProdPalletsData> {
    switch (ts.granularity) {
        case 'day':
            if (!ts.selectedDay) return createEmptyProdPalletsData();
            // For a single day, use the Story 7.1 method directly (no merge needed)
            return (await this.getProdPalletsForDate(ts.selectedDay)) ?? createEmptyProdPalletsData();

        case 'week':
            if (!ts.selectedWeek) return createEmptyProdPalletsData();
            return this.getProdPalletsForWeek(ts.selectedWeek);

        case 'period':
            if (!ts.selectedPeriod) return createEmptyProdPalletsData();
            return this.getProdPalletsForPeriod(
                ts.selectedPeriod.period,
                ts.selectedPeriod.fiscalYear,
            );

        case 'year':
            if (!ts.selectedYear) return createEmptyProdPalletsData();
            return this.getProdPalletsForYear(ts.selectedYear);

        default:
            return createEmptyProdPalletsData();
    }
},
```

**Logic by granularity:**

| `ts.granularity` | Field checked | Method called | Notes |
|---|---|---|---|
| `'day'` | `ts.selectedDay` | `getProdPalletsForDate(ts.selectedDay)` | Returns single snapshot, wrapped with `?? createEmptyProdPalletsData()` to ensure non-undefined |
| `'week'` | `ts.selectedWeek` | `getProdPalletsForWeek(ts.selectedWeek)` | Loads Sunday-Saturday range |
| `'period'` | `ts.selectedPeriod` | `getProdPalletsForPeriod(period, fiscalYear)` | Uses `.period` and `.fiscalYear` from the `selectedPeriod` object |
| `'year'` | `ts.selectedYear` | `getProdPalletsForYear(ts.selectedYear)` | Loads full fiscal year |

**Null-safety:** If the relevant selected value is `undefined` (e.g. `ts.selectedDay` is undefined when granularity is `'day'`), the method returns `createEmptyProdPalletsData()` immediately.

**Return type:** `Promise<ProdPalletsData>` (always returns a valid object, never `undefined`).

**Verification:**
- Given `ts = { granularity: 'week', selectedWeek: '2025-01-11' }`, calling `getProdPalletsForTimeSelection(ts)` delegates to `getProdPalletsForWeek("2025-01-11")`.
- Given `ts = { granularity: 'day', selectedDay: undefined }`, returns empty `ProdPalletsData`.

---

### AC 7.2.8: Add `getProdPalletsDistinctDays()` to DataStore

**File to modify:** `src/stores/data-store.ts`

- **Given** `DataStore.getProdPalletsDates()` exists (from Story 7.1) and returns `string[]` of `YYYY-MM-DD` date keys sorted descending
- **When** the developer adds `getProdPalletsDistinctDays` to `DataStore`
- **Then** it returns the same list (this is a semantic alias for clarity in the time-selection context)

**Step 1:** Add the following method inside the `DataStore` object:

```typescript
/**
 * Get distinct days that have Prod Pallets data, sorted descending (most recent first).
 * This is a semantic alias for getProdPalletsDates() to match the
 * naming convention of getDistinctDays() (which returns Line Yields days).
 *
 * @returns Array of YYYY-MM-DD strings, sorted descending
 */
async getProdPalletsDistinctDays(): Promise<string[]> {
    return this.getProdPalletsDates();
},
```

**Parameters:** None.

**Return type:** `Promise<string[]>`.

**Why an alias?** The existing `getDistinctDays()` returns Line Yields days. This method returns Prod Pallets days. Both follow the naming pattern `get[Source]Distinct[Granularity]()`. Having both allows the `useTimeSelection` hook to compute the union of available days across data sources.

**Verification:**
- If `getProdPalletsDates()` returns `["2025-01-08", "2025-01-07", "2025-01-06"]`, then `getProdPalletsDistinctDays()` returns the same array.

---

### AC 7.2.9: Add `getProdPalletsDistinctWeeks()` to DataStore

**File to modify:** `src/stores/data-store.ts`

- **Given** `getProdPalletsDistinctDays()` exists (from AC 7.2.8)
- **When** the developer adds `getProdPalletsDistinctWeeks` to `DataStore`
- **Then** it computes distinct week-ending Saturdays from the available day keys

**Step 1:** Ensure the following import exists at the top of `src/stores/data-store.ts`:
```typescript
import { getWeekEnding } from '@/lib/calendar/fiscal-calendar';
```
(This import may already exist; if not, add `getWeekEnding` to the existing import from `fiscal-calendar`.)

**Step 2:** Add the following method inside the `DataStore` object:

```typescript
/**
 * Get distinct week-ending Saturdays that have Prod Pallets data.
 * Computed from available daily date keys by mapping each day to its
 * week-ending Saturday, then de-duplicating.
 *
 * @returns Array of YYYY-MM-DD strings (Saturdays), sorted descending
 */
async getProdPalletsDistinctWeeks(): Promise<string[]> {
    return safeDbOp('getProdPalletsDistinctWeeks', async () => {
        // Step 2a: Get all available daily date keys
        const days = await this.getProdPalletsDistinctDays();

        // Step 2b: If no days, return empty
        if (days.length === 0) return [];

        // Step 2c: Map each day to its week-ending Saturday
        const weekSet = new Set<string>();
        for (const dayKey of days) {
            const date = new Date(dayKey);
            const saturday = getWeekEnding(date);
            const saturdayKey = toLocalDateKey(saturday);
            weekSet.add(saturdayKey);
        }

        // Step 2d: Sort descending (most recent first)
        return [...weekSet].sort().reverse();
    });
},
```

**Parameters:** None.

**Return type:** `Promise<string[]>`.

**How it works:**
1. Gets all available date keys (e.g. `["2025-01-08", "2025-01-07", "2025-01-06"]`).
2. For each date key, computes the week-ending Saturday using `getWeekEnding(new Date(dayKey))`.
3. Converts each Saturday `Date` to a `YYYY-MM-DD` string using `toLocalDateKey()`.
4. De-duplicates using a `Set<string>`.
5. Sorts descending.

**Example:**
- Days: `["2025-01-06", "2025-01-07", "2025-01-08", "2025-01-09", "2025-01-10", "2025-01-13"]`
- `2025-01-06` (Mon) through `2025-01-10` (Fri) all map to week ending `2025-01-11` (Sat).
- `2025-01-13` (Mon) maps to week ending `2025-01-18` (Sat).
- Result: `["2025-01-18", "2025-01-11"]`

**Verification:**
- If only one day exists (`"2025-01-07"`), the result is `["2025-01-11"]` (the Saturday of that week).
- If no days exist, the result is `[]`.

---

### AC 7.2.10: Add `getProdPalletsDistinctPeriods()` to DataStore

**File to modify:** `src/stores/data-store.ts`

- **Given** `getProdPalletsDistinctDays()` exists (from AC 7.2.8) and `getPeriodInfo()` is imported from fiscal-calendar
- **When** the developer adds `getProdPalletsDistinctPeriods` to `DataStore`
- **Then** it computes distinct fiscal periods from the available day keys

**Step 1:** Ensure the following import exists at the top of `src/stores/data-store.ts`:
```typescript
import { getPeriodInfo, getFiscalPeriods } from '@/lib/calendar/fiscal-calendar';
```
(`getPeriodInfo` is already imported in the current file.)

**Step 2:** Add the following method inside the `DataStore` object:

```typescript
/**
 * Get distinct fiscal periods that have Prod Pallets data.
 * Computed from available daily date keys by mapping each day to its
 * fiscal period, then de-duplicating.
 *
 * @returns Array of { period, fiscalYear, label } sorted descending by year then period
 */
async getProdPalletsDistinctPeriods(): Promise<
    Array<{ period: number; fiscalYear: number; label: string }>
> {
    return safeDbOp('getProdPalletsDistinctPeriods', async () => {
        // Step 2a: Get all available daily date keys
        const days = await this.getProdPalletsDistinctDays();

        // Step 2b: If no days, return empty
        if (days.length === 0) return [];

        // Step 2c: Map each day to its fiscal period and de-duplicate
        const seen = new Set<string>();
        const periods: Array<{ period: number; fiscalYear: number; label: string }> = [];

        for (const dayKey of days) {
            const date = new Date(dayKey);
            const info = getPeriodInfo(date);
            const key = `${info.fiscalYear}-${info.period}`;

            if (!seen.has(key)) {
                seen.add(key);
                periods.push({
                    period: info.period,
                    fiscalYear: info.fiscalYear,
                    label: `P${info.period} ${info.fiscalYear}`,
                });
            }
        }

        // Step 2d: Sort descending by fiscal year first, then period
        periods.sort((a, b) =>
            b.fiscalYear !== a.fiscalYear
                ? b.fiscalYear - a.fiscalYear
                : b.period - a.period
        );

        return periods;
    });
},
```

**Parameters:** None.

**Return type:** `Promise<Array<{ period: number; fiscalYear: number; label: string }>>`.

**Return shape matches** the existing `DataStore.getDistinctPeriods()` method (which does the same for Line Yields data). This consistency is intentional so the `useTimeSelection` hook can merge results from both sources using the same shape.

**How it works:**
1. Gets all available date keys.
2. For each date, calls `getPeriodInfo(new Date(dayKey))` to get `{ period, fiscalYear }`.
3. Uses `"${fiscalYear}-${period}"` as a de-duplication key.
4. Collects unique `{ period, fiscalYear, label }` objects.
5. Sorts descending by fiscal year, then by period number.

**Example:**
- Days: `["2025-01-06", "2025-01-20", "2025-04-01"]`
- `2025-01-06` is in P1 2025, `2025-01-20` is in P1 2025, `2025-04-01` is in P4 2025.
- Result: `[{ period: 4, fiscalYear: 2025, label: "P4 2025" }, { period: 1, fiscalYear: 2025, label: "P1 2025" }]`

**Verification:**
- If all days fall in the same period, the result array has exactly 1 element.
- If no days exist, the result is `[]`.
- The `label` format is `"P{N} {YEAR}"` (e.g. `"P3 2025"`).

---

### AC 7.2.11: Integrate Prod Pallets dates into `useTimeSelection` hook

**File to modify:** `src/hooks/useTimeSelection.ts`

- **Given** the hook currently loads time values only from Line Yields data (via `DataStore.getLineYields()`)
- **When** the developer modifies the `loadTimeValues` function inside `useTimeSelection`
- **Then** it also loads Prod Pallets available dates and computes the union of time values from both sources

**Step 1:** The `useTimeSelection` hook's `loadTimeValues()` function (inside `useEffect`) currently starts at line 37. Modify this function as follows.

**Step 1a:** After loading Line Yields dates, also load Prod Pallets dates. Add the following code **after** the existing Line Yields loading block (after the `yieldsData` processing), but **before** the `finally` block:

```typescript
// Load Prod Pallets available dates
const ppDays = await DataStore.getProdPalletsDistinctDays();
const ppWeeks = await DataStore.getProdPalletsDistinctWeeks();
const ppPeriods = await DataStore.getProdPalletsDistinctPeriods();
```

**Step 1b:** When computing `uniqueDays`, merge Line Yields days with Prod Pallets days:

Currently:
```typescript
const uniqueDays = [...new Set(dates.map((d) => toLocalDateKey(new Date(d))))].sort().reverse();
```

Change to:
```typescript
const lineYieldDays = dates.map((d) => toLocalDateKey(new Date(d)));
const allDayKeys = [...new Set([...lineYieldDays, ...ppDays])].sort().reverse();
```
Then use `allDayKeys` instead of `uniqueDays` when calling `setAvailableDays(...)`.

**Step 1c:** When computing `uniqueWeeks`, merge Line Yields weeks with Prod Pallets weeks:

Currently:
```typescript
const uniqueWeeks = [...new Set(dates.map((d) => toLocalDateKey(getWeekEnding(new Date(d)))))].sort().reverse();
```

Change to:
```typescript
const lineYieldWeeks = dates.map((d) => toLocalDateKey(getWeekEnding(new Date(d))));
const allWeekKeys = [...new Set([...lineYieldWeeks, ...ppWeeks])].sort().reverse();
```
Then use `allWeekKeys` instead of `uniqueWeeks` when calling `setAvailableWeeks(...)`.

**Step 1d:** When computing periods, merge Line Yields periods with Prod Pallets periods:

After the existing `periodMap` logic, add:
```typescript
// Merge Prod Pallets periods into the same map
for (const ppPeriod of ppPeriods) {
    const key = `${ppPeriod.fiscalYear}-${ppPeriod.period}`;
    if (!periodMap.has(key)) {
        const periods = getFiscalPeriods(ppPeriod.fiscalYear);
        const fp = periods.find((p) => p.periodNumber === ppPeriod.period);
        if (fp) {
            periodMap.set(key, {
                period: fp.periodNumber,
                fiscalYear: ppPeriod.fiscalYear,
                label: `P${fp.periodNumber} ${ppPeriod.fiscalYear}`,
                startDate: fp.startDate,
                endDate: fp.endDate,
            });
        }
    }
    fiscalYearSet.add(ppPeriod.fiscalYear);
}
```

**Step 1e:** Handle the case where Line Yields data is not loaded but Prod Pallets data IS loaded. Currently, the function returns early if `!yieldsData || yieldsData.length === 0`. This early return must be made conditional:

Change the early return to:
```typescript
if ((!yieldsData || yieldsData.length === 0) && ppDays.length === 0) {
    setIsLoading(false);
    return;
}
const dates = yieldsData ? yieldsData.map((row) => row.date) : [];
```

**IMPORTANT:** Move the Prod Pallets loading (`ppDays`, `ppWeeks`, `ppPeriods`) **before** the early-return check so it can be evaluated.

**Step 2:** Update the default auto-selection logic to use the merged day/week arrays instead of the yields-only arrays. Replace references to `uniqueDays[0]` with `allDayKeys[0]` and `uniqueWeeks[0]` with `allWeekKeys[0]`.

**Verification:**
- If only Prod Pallets data is loaded (no Line Yields), the time selectors still show available days/weeks/periods from Prod Pallets.
- If both data sources are loaded, the time selectors show the union of available dates from both.
- No duplicate entries appear in any selector dropdown.

---

### AC 7.2.12: Handle empty date ranges gracefully

**Files to verify:** `src/lib/aggregation/merge-prod-pallets.ts`, `src/stores/data-store.ts`

- **Given** the user selects a time range that has no Prod Pallets data
- **When** any `getProdPalletsFor*` method is called
- **Then** it returns a valid `ProdPalletsData` object with all arrays empty (not `undefined`, not `null`, not an error)

**Step 1:** Verify that `createEmptyProdPalletsData()` returns a valid `ProdPalletsData` object. It must satisfy: every field is an array, no field is `undefined`, and the TypeScript compiler accepts it as `ProdPalletsData`.

**Step 2:** Verify that every `getProdPalletsFor*` method in DataStore returns `createEmptyProdPalletsData()` (not `undefined`) when there is no data. Specifically check:

| Method | Empty case |
|---|---|
| `getProdPalletsForDateRange(start, end)` | `datesInRange.length === 0` returns `createEmptyProdPalletsData()` |
| `getProdPalletsForWeek(weekEnding)` | Delegates to `getProdPalletsForDateRange`, which handles the empty case |
| `getProdPalletsForPeriod(period, fiscalYear)` | Invalid period returns `createEmptyProdPalletsData()`, otherwise delegates |
| `getProdPalletsForYear(fiscalYear)` | `allPeriods.length === 0` returns `createEmptyProdPalletsData()`, otherwise delegates |
| `getProdPalletsForTimeSelection(ts)` | Missing selected value returns `createEmptyProdPalletsData()` |

**Step 3:** Verify that `mergeProdPalletsSnapshots([])` (empty array input) returns `createEmptyProdPalletsData()`.

**Step 4:** Verify that UI components consuming `ProdPalletsData` can handle all-empty arrays without crashing. Specifically:
- `data.production.length === 0` should display "No data" or an empty table, not throw.
- `data.shiftReportData.length === 0` should be handled gracefully.

**Verification:**
- Calling `getProdPalletsForTimeSelection({ granularity: 'week', selectedWeek: '2099-01-01' })` returns a `ProdPalletsData` where every array field has `.length === 0`.
- No method in the chain throws an error or returns `undefined`.

---

## Technical Implementation Plan

### Phase 1: Merge Utility (AC 7.2.1, AC 7.2.2)
1. Create `src/lib/aggregation/merge-prod-pallets.ts`
2. Implement `createEmptyProdPalletsData()`
3. Implement `mergeProdPalletsSnapshots()`
4. Verify: import works, types compile, empty merge returns empty

### Phase 2: DataStore Date Range Method (AC 7.2.3)
1. Add imports to `data-store.ts`
2. Implement `getProdPalletsForDateRange()`
3. Verify: loads multiple days, merges correctly

### Phase 3: Granularity-Specific Methods (AC 7.2.4, AC 7.2.5, AC 7.2.6)
1. Implement `getProdPalletsForWeek()` — delegates to date range
2. Implement `getProdPalletsForPeriod()` — looks up fiscal period, delegates to date range
3. Implement `getProdPalletsForYear()` — looks up fiscal year range, delegates to date range

### Phase 4: Dispatcher & Discovery (AC 7.2.7, AC 7.2.8, AC 7.2.9, AC 7.2.10)
1. Implement `getProdPalletsForTimeSelection()` — switch dispatcher
2. Implement `getProdPalletsDistinctDays()` — alias
3. Implement `getProdPalletsDistinctWeeks()` — computed from days
4. Implement `getProdPalletsDistinctPeriods()` — computed from days

### Phase 5: Hook Integration (AC 7.2.11)
1. Modify `useTimeSelection` to also load Prod Pallets dates
2. Merge Line Yields and Prod Pallets time values
3. Handle case where only Prod Pallets data exists (no Line Yields)

### Phase 6: Graceful Empty Handling (AC 7.2.12)
1. Audit all code paths for `undefined` returns
2. Ensure all methods return `ProdPalletsData` (not `undefined`)
3. Verify UI handles empty data arrays

---

## Files Created / Modified

### Files Created (1)

| File | Purpose |
|---|---|
| `src/lib/aggregation/merge-prod-pallets.ts` | `createEmptyProdPalletsData()` and `mergeProdPalletsSnapshots()` functions |

### Files Modified (2)

| File | Changes |
|---|---|
| `src/stores/data-store.ts` | Add 8 new methods: `getProdPalletsForDateRange`, `getProdPalletsForWeek`, `getProdPalletsForPeriod`, `getProdPalletsForYear`, `getProdPalletsForTimeSelection`, `getProdPalletsDistinctDays`, `getProdPalletsDistinctWeeks`, `getProdPalletsDistinctPeriods` |
| `src/hooks/useTimeSelection.ts` | Merge Prod Pallets dates into available time values; handle missing Line Yields gracefully |

---

## New Imports Summary

### `src/lib/aggregation/merge-prod-pallets.ts` (new file)
```typescript
import type { ProdPalletsData } from '@/types/prod-pallets';
```

### `src/stores/data-store.ts` (add to existing imports)
```typescript
import {
    mergeProdPalletsSnapshots,
    createEmptyProdPalletsData,
} from '@/lib/aggregation/merge-prod-pallets';
// Ensure these are included in the existing fiscal-calendar import:
import { getFiscalYear, getPeriodInfo, getWeekEnding, getFiscalPeriods } from '@/lib/calendar/fiscal-calendar';
// Ensure these are included in the existing time-selection import:
import { toLocalDateKey, toLocalKeyFromIso, getWeekDateRange } from '@/lib/time-selection';
```

---

## New Method Signatures Summary

| Method | File | Parameters | Return Type |
|---|---|---|---|
| `createEmptyProdPalletsData()` | `merge-prod-pallets.ts` | (none) | `ProdPalletsData` |
| `mergeProdPalletsSnapshots(snapshots)` | `merge-prod-pallets.ts` | `snapshots: ProdPalletsData[]` | `ProdPalletsData` |
| `getProdPalletsForDateRange(startDate, endDate)` | `data-store.ts` | `startDate: string, endDate: string` | `Promise<ProdPalletsData>` |
| `getProdPalletsForWeek(weekEnding)` | `data-store.ts` | `weekEnding: string` | `Promise<ProdPalletsData>` |
| `getProdPalletsForPeriod(period, fiscalYear)` | `data-store.ts` | `period: number, fiscalYear: number` | `Promise<ProdPalletsData>` |
| `getProdPalletsForYear(fiscalYear)` | `data-store.ts` | `fiscalYear: number` | `Promise<ProdPalletsData>` |
| `getProdPalletsForTimeSelection(ts)` | `data-store.ts` | `ts: TimeSelection` | `Promise<ProdPalletsData>` |
| `getProdPalletsDistinctDays()` | `data-store.ts` | (none) | `Promise<string[]>` |
| `getProdPalletsDistinctWeeks()` | `data-store.ts` | (none) | `Promise<string[]>` |
| `getProdPalletsDistinctPeriods()` | `data-store.ts` | (none) | `Promise<Array<{ period: number; fiscalYear: number; label: string }>>` |

---

## Testing / Verification

### Manual Verification Steps

1. **Merge utility (AC 7.2.1-7.2.2):**
   - In browser DevTools console, import and call `createEmptyProdPalletsData()`. Verify all 12 fields are empty arrays.
   - Create two mock `ProdPalletsData` objects with known row counts. Call `mergeProdPalletsSnapshots([mock1, mock2])`. Verify concatenated counts for all fields except `productMaster` (which should be de-duplicated).

2. **Date range query (AC 7.2.3):**
   - Load 3 days of Prod Pallets data via the upload flow.
   - In console: `await DataStore.getProdPalletsForDateRange("2025-01-06", "2025-01-08")`.
   - Verify the result has `production` rows from all 3 days.

3. **Week query (AC 7.2.4):**
   - In console: `await DataStore.getProdPalletsForWeek("2025-01-11")`.
   - Verify it returns data from the week of Jan 5-11, 2025.

4. **Period query (AC 7.2.5):**
   - In console: `await DataStore.getProdPalletsForPeriod(1, 2025)`.
   - Verify it returns data spanning the full Period 1 date range.

5. **Year query (AC 7.2.6):**
   - In console: `await DataStore.getProdPalletsForYear(2025)`.
   - Verify it returns all available data for fiscal year 2025.

6. **Dispatcher (AC 7.2.7):**
   - In console: `await DataStore.getProdPalletsForTimeSelection({ granularity: 'week', selectedWeek: '2025-01-11' })`.
   - Verify it delegates correctly to `getProdPalletsForWeek`.

7. **Discovery methods (AC 7.2.8-7.2.10):**
   - `await DataStore.getProdPalletsDistinctDays()` — returns sorted date strings.
   - `await DataStore.getProdPalletsDistinctWeeks()` — returns Saturday date strings.
   - `await DataStore.getProdPalletsDistinctPeriods()` — returns `{ period, fiscalYear, label }` objects.

8. **Hook integration (AC 7.2.11):**
   - Load only Prod Pallets data (no Line Yields). Verify the GranularitySelector and day/week/period dropdowns populate correctly.
   - Load both data sources. Verify no duplicates in dropdowns.

9. **Empty handling (AC 7.2.12):**
   - Select a week with no data. Verify the dashboard shows "No data" (not a crash).
   - Clear all data from IndexedDB. Verify all discovery methods return `[]` and all query methods return empty `ProdPalletsData`.

### TypeScript Compilation Check
After implementation, run:
```
npx tsc --noEmit
```
Verify zero type errors. Specific things to check:
- `createEmptyProdPalletsData()` return type is `ProdPalletsData` (not `Partial<>`)
- All 12 fields present in the returned object
- `mergeProdPalletsSnapshots` parameter type is `ProdPalletsData[]`, return type is `ProdPalletsData`
- All DataStore methods return `Promise<ProdPalletsData>` (not `Promise<ProdPalletsData | undefined>`)

---

## Definition of Done

- [ ] `src/lib/aggregation/merge-prod-pallets.ts` exists with `createEmptyProdPalletsData()` and `mergeProdPalletsSnapshots()`
- [ ] `DataStore.getProdPalletsForDateRange()` loads and merges multiple daily snapshots
- [ ] `DataStore.getProdPalletsForWeek()` computes week range and delegates
- [ ] `DataStore.getProdPalletsForPeriod()` looks up fiscal period and delegates
- [ ] `DataStore.getProdPalletsForYear()` looks up fiscal year range and delegates
- [ ] `DataStore.getProdPalletsForTimeSelection()` dispatches by granularity
- [ ] `DataStore.getProdPalletsDistinctDays()` returns available date keys
- [ ] `DataStore.getProdPalletsDistinctWeeks()` computes week-ending Saturdays from dates
- [ ] `DataStore.getProdPalletsDistinctPeriods()` computes fiscal periods from dates
- [ ] `useTimeSelection` hook merges Prod Pallets and Line Yields time values
- [ ] All methods return valid `ProdPalletsData` (never `undefined`) for empty ranges
- [ ] TypeScript compiles with zero errors (`tsc --noEmit`)
