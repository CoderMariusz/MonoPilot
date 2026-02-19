# Multi-Granularity Time Selection — Implementation Plan

**Created:** 2026-02-12
**Status:** Approved, not yet implemented
**Type:** Cross-cutting enhancement (affects all existing dashboard pages)

---

## Problem

The dashboard currently operates on **week-level** granularity only. The raw data has day+shift level detail (88k+ rows with `date` field), but the UI only exposes week selection via `WeekSelector` in the header.

Additionally, 5 helper functions are **duplicated across 5+ component files**:
- `toLocalDateKey()`
- `getWeekDateRange()`
- `filterDataByWeek()`
- `getPreviousWeekEnding()`
- `getLast13Weeks()`

## Goal

Add **Day**, **Week**, and **Year** granularity across all dashboard pages, plus **Period** on Line Leader page. Centralize all time-related helpers.

## User Decisions

- **Selector location:** Global in header (Day | Week | Year)
- **Year view:** Aggregated summary on top + P1-P13 period breakdown below
- **Day view:** Calendar date picker + dropdown of available dates, trend shows last 14 days
- **Line Leader:** 4 options (Day | Week | Period | Year) with local override

---

## Implementation Phases

### Phase 1: Foundation — Centralized Time Utilities

**Step 1:** Create `src/lib/time-selection/types.ts`
```typescript
export type TimeGranularity = 'day' | 'week' | 'period' | 'year';

export interface TimeSelection {
  granularity: TimeGranularity;
  selectedDay?: string;           // YYYY-MM-DD
  selectedWeek?: string;          // YYYY-MM-DD (week ending Saturday)
  selectedPeriod?: { period: number; fiscalYear: number };
  selectedYear?: number;
}
```

**Step 2:** Create `src/lib/time-selection/time-utils.ts`
Consolidate all duplicated helpers + add new granularity functions:
- **Moved from components:** `toLocalDateKey`, `toLocalKeyFromIso`, `getWeekDateRange`, `filterDataByWeek`, `getPreviousWeekEnding`, `getLast13Weeks`, `filterDataByPeriod`
- **New:**
  - `filterDataByDay(data, day)` — filter rows where `row.date === day`
  - `filterDataByYear(data, fiscalYear)` — filter using `getFiscalYear()`
  - `filterDataByTimeSelection(data, selection)` — master dispatcher
  - `getPreviousTimeSelection(sel)` — returns previous day/week/period/year
  - `getTrendPoints(sel)` — returns date ranges for trend chart (14 days / 13 weeks / 13 periods)
  - `convertTimeSelection(current, targetGranularity)` — smart defaults when switching granularity
  - `getDistinctDays(data)` — extract unique dates from dataset

**Step 3:** Create `src/lib/time-selection/index.ts` — barrel export

### Phase 2: Global State

**Step 4:** Modify `src/stores/app-store.ts`
- Add to `AppState`: `timeGranularity: TimeGranularity` (default: `'week'`), `timeSelection: TimeSelection` (default: `{ granularity: 'week' }`)
- Add actions: `SET_TIME_GRANULARITY`, `SET_TIME_SELECTION`
- **Backward compat:** `SET_TIME_SELECTION` also syncs `selectedWeek` when granularity is 'week'. `SET_SELECTED_WEEK` also syncs `timeSelection`.

**Step 5:** Create `src/hooks/useTimeSelection.ts`
Hook with: `granularity`, `timeSelection`, `setGranularity`, `setTimeSelection`, computed `resolvedRange`, `previousSelection`, `trendConfig`

### Phase 3: Header UI

**Step 6:** Create `src/components/common/GranularitySelector.tsx`
Pill toggle (Day | Week | Year) matching existing Tailwind pattern from LineLeaderPage:540-559

**Step 7:** Create `src/components/common/DaySelector.tsx`
Native `<input type="date">` + dropdown of available dates. Format: "DD/MM/YYYY (Day)"

**Step 8:** Create `src/components/common/TimeValueSelector.tsx`
Polymorphic: renders DaySelector / WeekSelector / PeriodSelector / YearSelector based on granularity

**Step 9:** Modify `src/components/layout/Header.tsx`
Replace `<WeekSelector>` with `<GranularitySelector>` + `<TimeValueSelector>`

### Phase 4: Data Store

**Step 10:** Modify `src/stores/data-store.ts`
Add: `getDistinctDates()`, `getDistinctFiscalYears()`, `getLineYieldsForDay()`, `getLineYieldsForYear()`

### Phase 5: Page Migrations

Each page: delete local helpers → import from `@/lib/time-selection` → use `useTimeSelection()` hook → update trend/comparison

**Step 11:** `src/components/overview/OverviewDashboard.tsx` — delete 6 helpers, add year view
**Step 12:** `src/components/overview/WeeklyTrendChart.tsx` — generalize `TrendDataPoint` with `label` field
**Step 13:** `src/components/yield-by-line/YieldByLinePage.tsx`
**Step 14:** `src/components/giveaway/GiveawayDashboard.tsx`
**Step 15:** `src/components/team-comparison/TeamComparisonPage.tsx`
**Step 16:** `src/components/line-leader/LineLeaderPage.tsx` — 4-option granularity, replace FilterMode

---

## Year View Layout (Overview page)

```
┌──────────────────────────────────┐
│ KPI Summary (full year agg.)     │
│ Yield% | GA% | KG Out | Var £   │
│ Each card: vs Previous Year      │
├──────────────────────────────────┤
│ Period Trend Chart (P1-P13 x)    │
├──────────────────────────────────┤
│ Period Breakdown Table P1-P13    │
│ Period | KG Out | Yield% | GA%   │
├──────────────────────────────────┤
│ Top Gains/Losses (YoY)           │
└──────────────────────────────────┘
```

Reuse `aggregateKPIs()` from kpi-engine and `getFiscalPeriods(year)` from fiscal-calendar.

---

## Trend Chart Behavior per Granularity

| Granularity | Points | X-axis Labels | Data Source |
|---|---|---|---|
| Day | 14 | "12/02", "11/02" | Last 14 calendar days |
| Week | 13 | "W/E 07/02", "W/E 31/01" | Last 13 week endings |
| Period | 13 | "P1", "P2", ... "P13" | Last 13 fiscal periods |
| Year | 13 | "P1"-"P13" within year | Periods of selected FY |

---

## Files Summary

### New (7 files)
| File | Purpose |
|---|---|
| `src/lib/time-selection/types.ts` | TimeGranularity, TimeSelection types |
| `src/lib/time-selection/time-utils.ts` | Centralized filter/trend/comparison helpers |
| `src/lib/time-selection/index.ts` | Barrel export |
| `src/hooks/useTimeSelection.ts` | React hook for global time state |
| `src/components/common/GranularitySelector.tsx` | Day/Week/Period/Year pill toggle |
| `src/components/common/DaySelector.tsx` | Date picker + dropdown |
| `src/components/common/TimeValueSelector.tsx` | Polymorphic value selector |

### Modified (9 files)
| File | Change |
|---|---|
| `src/stores/app-store.ts` | Add timeGranularity + timeSelection state |
| `src/stores/data-store.ts` | Add day/year query methods |
| `src/components/layout/Header.tsx` | Replace WeekSelector with granularity UI |
| `src/components/overview/OverviewDashboard.tsx` | Remove dupes, add year view |
| `src/components/overview/WeeklyTrendChart.tsx` | Generalize x-axis labels |
| `src/components/yield-by-line/YieldByLinePage.tsx` | Remove dupes, use centralized |
| `src/components/giveaway/GiveawayDashboard.tsx` | Remove dupes, use centralized |
| `src/components/team-comparison/TeamComparisonPage.tsx` | Remove dupes, use centralized |
| `src/components/line-leader/LineLeaderPage.tsx` | 4-option granularity toggle |

### Untouched (reused as-is)
- `src/lib/calendar/fiscal-calendar.ts` — all needed functions already exist
- `src/lib/aggregation/kpi-engine.ts` — already period-agnostic
- `src/components/period-reports/` — stays independent (own year/period selection)

---

## Orchestration Strategy (Sub-Agent Dispatch)

| Wave | Agent | Scope |
|------|-------|-------|
| 1 | A | Foundation: types, utils, app-store, hook, data-store |
| 2 | B | UI: GranularitySelector, DaySelector, TimeValueSelector, Header |
| 3 | C, D, E (parallel) | C: Overview + TrendChart; D: Yield/GA/Team pages; E: LineLeader |
| 4 | Main | Code review & refactoring |
| 5 | F | Update FINAL_MANUFACTURING plan, stories, review.md |

---

## Verification

1. **Regression**: Week view should behave identically to current behavior
2. **Day**: Select a day → KPI cards show day data, trend shows 14 days, comparison vs previous day
3. **Year**: Select year → aggregated summary + P1-P13 table + period trend chart, comparison vs previous year
4. **Period (Line Leader)**: Select period → same as current Period mode behavior
5. **Granularity switching**: switching Day→Week→Year preserves context (smart date conversion)
6. **All pages**: Navigate between pages — granularity persists globally
7. **Dev server**: `cd manufacturing-kpi-dashboard && ".node-portable/node-v22.14.0-win-x64/node.exe" "node_modules/next/dist/bin/next" dev`
