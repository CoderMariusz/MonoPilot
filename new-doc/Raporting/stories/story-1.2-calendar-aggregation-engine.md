> **Status:** ✅ IMPLEMENTED
> **Components:** `src/lib/calendar/fiscal-calendar.ts`, `src/lib/aggregation/kpi-engine.ts`
> **Features:** 4-4-5 fiscal calendar, weighted yield/GA calculations, flexible aggregation engine, week/period/year comparison functions

# Story 1.2: 4-4-5 Calendar & Aggregation Engine

## Story Overview
**Epic**: Infrastructure & Data Processing
**Priority**: Critical (Required for all period-based reporting)
**Estimated Effort**: 2 development sessions
**Dependencies**: Story 1.1 (Project Scaffold)

### User Story
> As a **Manager**, I want the application to **use the 4-4-5 fiscal calendar system** for all period calculations so that **reports match our existing financial reporting periods and I can compare data accurately across weeks, periods, and years**.

---

## Acceptance Criteria

### AC 1.2.1: getWeekEnding()
- **Given** any date input
- **When** `getWeekEnding(date)` is called
- **Then** it returns the Saturday of that week (week ending = Saturday)
- **And** handles edge cases: Jan 1, Dec 31, leap years

### AC 1.2.2: getFiscalYear()
- **Given** any date input
- **When** `getFiscalYear(date)` is called
- **Then** it returns the fiscal year starting from the first Monday of January
- **And** dates before the first Monday belong to the previous fiscal year

### AC 1.2.3: getPeriodInfo()
- **Given** any date input
- **When** `getPeriodInfo(date)` is called
- **Then** it returns:
  ```typescript
  { period: 1-13, week: 1-5, fiscalYear: number, weekEnding: Date }
  ```
- **And** periods follow the 4-4-5 pattern:
  - P1: 4 weeks, P2: 4 weeks, P3: 5 weeks
  - P4: 4 weeks, P5: 4 weeks, P6: 5 weeks
  - P7: 4 weeks, P8: 4 weeks, P9: 5 weeks
  - P10: 4 weeks, P11: 4 weeks, P12: 5 weeks
  - P13: 1 week (53rd week, if applicable)

### AC 1.2.4: Aggregation Engine
- **Given** a dataset of line yield records
- **When** `aggregate(data, groupBy, metrics)` is called
- **Then** it supports:
  - **groupBy**: `['line']`, `['line', 'fgCode']`, `['supervisor']`, `['lineManager']`, `['period']`, `['week']`
  - **metrics**: `sum('kgOutput')`, `weightedAvg('yieldPct', 'kgUsage')`, `sum('variancePounds')`, `avg('effPct')`
- **And** weighted averages use KG Usage as the weight
- **And** results include row count per group

### AC 1.2.5: Comparison Functions
- **Given** two time periods of data
- **When** comparison functions are called
- **Then**:
  - `compareWeeks(weekA, weekB)` returns variance data with ↑/↓ indicators
  - `comparePeriods(periodA, periodB)` returns period-level variances
  - `compareYears(yearA, yearB)` returns year-over-year variances
- **And** each comparison includes absolute and percentage change

### AC 1.2.6: topNVariance()
- **Given** aggregated data with variance calculations
- **When** `topNVariance(data, n, direction)` is called
- **Then** it returns the top N items by £ impact
- **And** `direction: 'gains'` returns highest positive variances
- **And** `direction: 'losses'` returns most negative variances
- **And** each result includes line, product, variance £, and variance %

---

## Technical Implementation Plan

### Calendar Module

```typescript
// lib/calendar/fiscal-calendar.ts

const PATTERN_445 = [4, 4, 5, 4, 4, 5, 4, 4, 5, 4, 4, 5]; // 12 periods = 52 weeks

export function getWeekEnding(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 6=Sat
  const diff = 6 - day; // Days until Saturday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getFiscalYearStart(year: number): Date {
  // First Monday of January
  const jan1 = new Date(year, 0, 1);
  const dayOfWeek = jan1.getDay();
  const daysToMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 0 : 8 - dayOfWeek;
  return new Date(year, 0, 1 + daysToMonday);
}

export function getFiscalYear(date: Date): number {
  const year = date.getFullYear();
  const fyStart = getFiscalYearStart(year);
  return date >= fyStart ? year : year - 1;
}

export function getPeriodInfo(date: Date): {
  period: number;
  week: number;
  fiscalYear: number;
  weekEnding: Date;
} {
  const fy = getFiscalYear(date);
  const fyStart = getFiscalYearStart(fy);
  const weekEnding = getWeekEnding(date);
  
  // Calculate week number within fiscal year
  const diffMs = weekEnding.getTime() - fyStart.getTime();
  const weekNum = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1;
  
  // Map week to period using 4-4-5 pattern
  let cumulativeWeeks = 0;
  for (let p = 0; p < PATTERN_445.length; p++) {
    cumulativeWeeks += PATTERN_445[p];
    if (weekNum <= cumulativeWeeks) {
      const weekInPeriod = weekNum - (cumulativeWeeks - PATTERN_445[p]);
      return {
        period: p + 1,
        week: weekInPeriod,
        fiscalYear: fy,
        weekEnding,
      };
    }
  }
  
  // Week 53 (if applicable)
  return { period: 13, week: 1, fiscalYear: fy, weekEnding };
}
```

### Aggregation Engine

```typescript
// lib/aggregation/kpi-engine.ts

type GroupByField = 'line' | 'fgCode' | 'supervisor' | 'lineManager' | 'period' | 'week' | 'date';
type MetricType = 'sum' | 'weightedAvg' | 'avg' | 'count' | 'min' | 'max';

interface AggregationConfig {
  groupBy: GroupByField[];
  metrics: { field: string; type: MetricType; weight?: string; alias?: string }[];
}

interface AggregatedRow {
  groupKey: Record<string, string | number>;
  metrics: Record<string, number>;
  rowCount: number;
}

export function aggregate(
  data: LineYieldRow[],
  config: AggregationConfig
): AggregatedRow[] {
  const groups = new Map<string, LineYieldRow[]>();
  
  // Group data
  for (const row of data) {
    const key = config.groupBy.map(field => String(row[field])).join('|');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }
  
  // Calculate metrics per group
  const results: AggregatedRow[] = [];
  for (const [key, rows] of groups) {
    const groupKey: Record<string, string | number> = {};
    config.groupBy.forEach((field, i) => {
      groupKey[field] = key.split('|')[i];
    });
    
    const metrics: Record<string, number> = {};
    for (const metric of config.metrics) {
      const alias = metric.alias || metric.field;
      switch (metric.type) {
        case 'sum':
          metrics[alias] = rows.reduce((sum, r) => sum + (Number(r[metric.field]) || 0), 0);
          break;
        case 'avg':
          metrics[alias] = rows.reduce((sum, r) => sum + (Number(r[metric.field]) || 0), 0) / rows.length;
          break;
        case 'weightedAvg':
          const totalWeight = rows.reduce((sum, r) => sum + (Number(r[metric.weight!]) || 0), 0);
          metrics[alias] = totalWeight > 0
            ? rows.reduce((sum, r) => sum + (Number(r[metric.field]) || 0) * (Number(r[metric.weight!]) || 0), 0) / totalWeight
            : 0;
          break;
        case 'count':
          metrics[alias] = rows.length;
          break;
        case 'min':
          metrics[alias] = Math.min(...rows.map(r => Number(r[metric.field]) || Infinity));
          break;
        case 'max':
          metrics[alias] = Math.max(...rows.map(r => Number(r[metric.field]) || -Infinity));
          break;
      }
    }
    
    results.push({ groupKey, metrics, rowCount: rows.length });
  }
  
  return results;
}

export function compareWeeks(
  currentWeek: AggregatedRow[],
  previousWeek: AggregatedRow[]
): ComparisonResult[] {
  // Match by groupKey and calculate variances
  return currentWeek.map(current => {
    const previous = previousWeek.find(p => 
      JSON.stringify(p.groupKey) === JSON.stringify(current.groupKey)
    );
    
    const variances: Record<string, { absolute: number; percentage: number; direction: 'up' | 'down' | 'flat' }> = {};
    
    for (const [key, value] of Object.entries(current.metrics)) {
      const prevValue = previous?.metrics[key] || 0;
      const absolute = value - prevValue;
      const percentage = prevValue !== 0 ? (absolute / prevValue) * 100 : 0;
      variances[key] = {
        absolute,
        percentage,
        direction: absolute > 0.001 ? 'up' : absolute < -0.001 ? 'down' : 'flat',
      };
    }
    
    return { groupKey: current.groupKey, current: current.metrics, previous: previous?.metrics || {}, variances };
  });
}

export function topNVariance(
  data: ComparisonResult[],
  n: number,
  direction: 'gains' | 'losses',
  metricKey: string = 'variancePounds'
): ComparisonResult[] {
  return data
    .filter(d => direction === 'gains' 
      ? d.variances[metricKey]?.absolute > 0 
      : d.variances[metricKey]?.absolute < 0
    )
    .sort((a, b) => direction === 'gains'
      ? b.variances[metricKey].absolute - a.variances[metricKey].absolute
      : a.variances[metricKey].absolute - b.variances[metricKey].absolute
    )
    .slice(0, n);
}
```

---

## Testing Strategy

### Unit Tests (Critical)
- `getWeekEnding()`: Test with Mon-Sun inputs, verify always returns Saturday
- `getFiscalYear()`: Test boundary dates (Dec 31, Jan 1, first Monday)
- `getPeriodInfo()`: Test all 52 weeks map to correct periods
- `aggregate()`: Test sum, avg, weightedAvg with known data
- `compareWeeks()`: Test variance calculations
- `topNVariance()`: Test gains and losses sorting

### Validation Tests
- Compare calendar output with existing Excel Cal sheet data
- Verify period boundaries match the Cal sheet in Shift Report
- Cross-reference aggregated values with manual Excel calculations

---

## Definition of Done
- [ ] All 6 acceptance criteria pass
- [ ] Calendar functions handle all edge cases
- [ ] Aggregation engine supports all groupBy/metric combinations
- [ ] Comparison functions return correct variances
- [ ] topNVariance correctly identifies gains and losses
- [ ] Unit tests pass for all calendar and aggregation functions
- [ ] Values verified against existing Excel reports
