# Story 1.5.4: Advanced Analytics (Trends, Predictions, Insights)

Status: drafted

## Story

As a **Operations Director / Production Manager**,
I want **advanced analytics with trend charts, predictive insights, and anomaly detection**,
so that **I can forecast issues 2-4 weeks ahead (vs reactive firefighting) and optimize production efficiency by 15-20%**.

## Acceptance Criteria

### AC-1: Trend Analytics Dashboard
- 7-day OEE trend (line chart with moving average)
- 30-day Yield trend by product (multi-line chart)
- Downtime Pareto chart (top 10 reasons by frequency)
- Material consumption variance trend (actual vs BOM standard)
- Production output trend (kg/day, 90-day rolling average)

### AC-2: Predictive Insights
- Material shortage forecast (predict shortages 2-4 weeks ahead based on consumption trends)
- Line capacity forecast (predict overbooked lines based on WO schedule)
- Downtime prediction (identify lines with increasing downtime trend)
- Yield degradation alerts (detect 3-day consecutive yield decline >5%)

### AC-3: Anomaly Detection
- Statistical anomaly detection (IQR method) for yield, consumption, output
- Alert when metric exceeds 1.5×IQR from median (outlier)
- Anomaly log table: timestamp, metric_type, actual_value, expected_range, line_id
- "Investigate Anomaly" button → drill-down to WO details

### AC-4: Comparative Analytics
- Line-to-Line comparison (OEE, yield, output side-by-side)
- Shift-to-Shift comparison (Day vs Swing vs Night)
- Product-to-Product comparison (yield %, setup time, cycle time)
- Period-over-Period comparison (this week vs last week, this month vs last month)

### AC-5: Custom Reports
- Report builder UI: select metrics (OEE, yield, output), dimensions (line, shift, product), date range
- Aggregation options: sum, avg, min, max, count
- Chart types: line, bar, pie, table
- Save report as template (reusable)
- Export to PDF, Excel, CSV

### AC-6: AI-Powered Recommendations
- Root cause analysis suggestions (e.g., "OEE drop on Line A correlated with 3x downtime events")
- Optimization suggestions (e.g., "Move WO-0109 to Line B to balance capacity")
- Best practices insights (e.g., "Line C has 15% higher yield for CHICKEN-SAUSAGE - consider routing all to Line C")

## Tasks / Subtasks

### Task 1: Trend Analytics (8h)
- [ ] 7-day OEE trend chart (Recharts line chart)
- [ ] 30-day Yield trend by product (multi-line chart)
- [ ] Downtime Pareto chart (bar + line combo chart)
- [ ] Material consumption variance trend
- [ ] Production output trend (90-day rolling avg)

### Task 2: Predictive Insights (10h)
- [ ] Material shortage forecast algorithm (linear regression on consumption rate)
- [ ] Line capacity forecast (check wo_schedule vs line capacity)
- [ ] Downtime prediction (detect increasing trend, 7-day moving average)
- [ ] Yield degradation alerts (3-day consecutive decline >5%)
- [ ] Predictive alerts table in UI

### Task 3: Anomaly Detection (8h)
- [ ] Implement IQR anomaly detection algorithm
- [ ] Anomaly log table component (timestamp, metric, value, expected_range)
- [ ] Alert badges on KPI cards for anomalies
- [ ] "Investigate Anomaly" drill-down modal

### Task 4: Comparative Analytics (6h)
- [ ] Line-to-Line comparison chart (side-by-side bars)
- [ ] Shift-to-Shift comparison chart
- [ ] Product-to-Product comparison chart
- [ ] Period-over-Period comparison (this vs last week/month)

### Task 5: Custom Report Builder (10h)
- [ ] Report builder UI (metrics selector, dimensions, date range)
- [ ] Aggregation options (sum, avg, min, max, count)
- [ ] Chart type selector (line, bar, pie, table)
- [ ] Save report as template
- [ ] Export to PDF/Excel/CSV

### Task 6: AI Recommendations (8h)
- [ ] Correlation analysis (identify metric correlations)
- [ ] Root cause analysis suggestions (template-based initially)
- [ ] Optimization suggestions (capacity balancing logic)
- [ ] Best practices insights (detect high-performing patterns)

### Task 7: E2E Tests (4h)
- [ ] E2E: View 7-day OEE trend → chart shows correct data
- [ ] E2E: Material shortage forecast → predicted shortage shown 2 weeks ahead
- [ ] E2E: Anomaly detected → alert badge shown → investigate modal opens
- [ ] E2E: Custom report builder → create report → export to PDF

### Task 8: Documentation (2h)
- [ ] Update architecture.md with analytics system
- [ ] Document predictive algorithms
- [ ] Document anomaly detection (IQR method)

**Total Estimated Effort:** 56 hours (~7 days)

## Dev Notes

**Anomaly Detection (IQR Method):**
```typescript
function detectAnomalies(data: number[]): { value: number, isAnomaly: boolean }[] {
  const sorted = [...data].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  return data.map(value => ({
    value,
    isAnomaly: value < lowerBound || value > upperBound
  }));
}
```

**Material Shortage Forecast (Linear Regression):**
```typescript
function forecastMaterialShortage(materialId: number, daysAhead: number): Date | null {
  const consumptionHistory = getLast30DaysConsumption(materialId); // [{date, qty}]
  const avgDailyConsumption = mean(consumptionHistory.map(d => d.qty));
  const currentStock = getMaterialStock(materialId);
  const daysUntilStockout = currentStock / avgDailyConsumption;

  if (daysUntilStockout < daysAhead) {
    return new Date(Date.now() + daysUntilStockout * 24*60*60*1000);
  }
  return null; // No shortage forecasted
}
```

**MVP Scope:**
✅ Trend charts, predictive insights (shortage, capacity, downtime), anomaly detection, comparative analytics, custom reports
❌ Growth: Machine learning models, advanced AI recommendations, real-time streaming analytics, integration with external BI tools (Tableau, Power BI)

**Dependencies:**
- Story 1.5.1 (WO Kanban Board) for KPI data
- Story 1.5.3 (Dashboard Widgets) for chart components

## Dev Agent Record
### Context Reference
<!-- Will be added by story-context workflow -->
