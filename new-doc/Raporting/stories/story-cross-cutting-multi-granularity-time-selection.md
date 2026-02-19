> **Status:** ⬜ PLANNED (2026-02-12)
> **Plan:** See `plans/multi-granularity-time-selection.md`
> **Type:** Cross-cutting enhancement — affects all existing dashboard pages

# Story: Multi-Granularity Time Selection (Day / Week / Period / Year)

## Overview

Add Day, Week, and Year granularity selection across all dashboard pages, plus Period on Line Leader page. Currently the dashboard operates only on week-level granularity. Raw data already has day+shift level detail.

**Side benefit:** Centralizes 5 duplicated helper functions from 5+ component files into a single `time-selection` module.

## Dependencies

- Story 1.1: Project Scaffold (✅ Done)
- Story 1.2: 4-4-5 Calendar & Aggregation Engine (✅ Done)
- Story 2.1: Factory Overview Dashboard (✅ Done)
- All Epic 2-3 stories (✅ Done)

## Effort Estimate

2-3 sessions

## Acceptance Criteria

### Foundation (Phase 1-2)

- **AC F.1**: `TimeGranularity` type (`'day' | 'week' | 'period' | 'year'`) and `TimeSelection` interface exported from `src/lib/time-selection/types.ts`
- **AC F.2**: Centralized time utilities in `src/lib/time-selection/time-utils.ts` — all duplicated helpers (`toLocalDateKey`, `getWeekDateRange`, `filterDataByWeek`, `getPreviousWeekEnding`, `getLast13Weeks`) moved from component files to this module
- **AC F.3**: `filterDataByTimeSelection(data, selection)` master filter function handles all 4 granularities
- **AC F.4**: `getPreviousTimeSelection(sel)` returns: day-1 for day, week-1 for week, period-1 for period, year-1 for year
- **AC F.5**: `getTrendPoints(sel)` returns: 14 points for day, 13 for week, 13 for period, 13 (P1-P13) for year
- **AC F.6**: `convertTimeSelection(current, targetGranularity)` picks smart defaults when switching (e.g., Day→Week: select containing week)
- **AC F.7**: `AppState` extended with `timeGranularity` and `timeSelection` — backward compatible with `selectedWeek`
- **AC F.8**: `useTimeSelection()` hook provides `granularity`, `timeSelection`, `setGranularity`, `setTimeSelection`, `resolvedRange`, `previousSelection`, `trendConfig`

### Header UI (Phase 3)

- **AC H.1**: `GranularitySelector` pill toggle (Day | Week | Year) displayed in global header
- **AC H.2**: `TimeValueSelector` renders appropriate selector based on granularity: calendar date picker for Day, WeekSelector dropdown for Week, year dropdown for Year
- **AC H.3**: Day selector uses native `<input type="date">` plus dropdown of available dates from dataset
- **AC H.4**: Switching granularity preserves context (smart date conversion)
- **AC H.5**: Auto-selects most recent available value for the new granularity

### Page Migrations (Phase 5)

- **AC P.1**: All local duplicate helpers removed from: OverviewDashboard, YieldByLinePage, GiveawayDashboard, TeamComparisonPage, LineLeaderPage
- **AC P.2**: All pages use `filterDataByTimeSelection()` from centralized module
- **AC P.3**: Trend charts adapt to granularity: 14-day trend / 13-week trend / 13-period trend
- **AC P.4**: Comparison labels dynamic: "vs Previous Day" / "vs Previous Week" / "vs Previous Year"
- **AC P.5**: Granularity persists across page navigation (global state)

### Day View

- **AC D.1**: Selecting a day filters all KPI data to that single date
- **AC D.2**: Trend chart shows last 14 calendar days
- **AC D.3**: Comparison shows day-over-day variance

### Year View

- **AC Y.1**: Selecting a year shows aggregated KPI summary for the full fiscal year
- **AC Y.2**: Period breakdown table (P1-P13) displayed below summary
- **AC Y.3**: Trend chart shows P1-P13 as x-axis within the selected year
- **AC Y.4**: Comparison shows year-over-year variance
- **AC Y.5**: Reuses `aggregateKPIs()` from kpi-engine and `getFiscalPeriods(year)` from fiscal-calendar

### Line Leader Page

- **AC L.1**: Line Leader page has 4-option granularity toggle: Day | Week | Period | Year
- **AC L.2**: Period option uses existing `PeriodSelector` component
- **AC L.3**: Line Leader's granularity is independent from global header (local override)

## Data Store Extensions

- **AC DS.1**: `DataStore.getDistinctDates()` returns sorted unique dates from dataset
- **AC DS.2**: `DataStore.getDistinctFiscalYears()` returns available fiscal years
- **AC DS.3**: `DataStore.getLineYieldsForDay(date)` filters by exact date
- **AC DS.4**: `DataStore.getLineYieldsForYear(fiscalYear)` filters by fiscal year

## Regression

- **AC R.1**: Week view behaves identically to current implementation (no visible changes when granularity = week)

## Files

### New (7)
- `src/lib/time-selection/types.ts`
- `src/lib/time-selection/time-utils.ts`
- `src/lib/time-selection/index.ts`
- `src/hooks/useTimeSelection.ts`
- `src/components/common/GranularitySelector.tsx`
- `src/components/common/DaySelector.tsx`
- `src/components/common/TimeValueSelector.tsx`

### Modified (9)
- `src/stores/app-store.ts`
- `src/stores/data-store.ts`
- `src/components/layout/Header.tsx`
- `src/components/overview/OverviewDashboard.tsx`
- `src/components/overview/WeeklyTrendChart.tsx`
- `src/components/yield-by-line/YieldByLinePage.tsx`
- `src/components/giveaway/GiveawayDashboard.tsx`
- `src/components/team-comparison/TeamComparisonPage.tsx`
- `src/components/line-leader/LineLeaderPage.tsx`
