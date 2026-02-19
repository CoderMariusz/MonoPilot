# OEE-006: Historical Trend Analysis

**Module**: OEE (Overall Equipment Effectiveness)
**Feature**: OEE Trend Analysis & Comparison (PRD Section 10.6)
**Status**: Ready for Implementation
**Last Updated**: 2026-01-15

---

## ASCII Wireframe

### Success State (Desktop - Trend Analysis)

```
+--------------------------------------------------------------------------------------------------+
|  OEE > Trend Analysis               Period: [Last 30 Days v]  View: [All Machines v]  [Export]  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Trend Summary (Last 30 Days)                                                               |   |
|  |                                                                                            |   |
|  |  +--------------------+  +--------------------+  +--------------------+  +---------------+ |   |
|  |  | Avg OEE            |  | Avg Availability   |  | Avg Performance    |  | Avg Quality   | |   |
|  |  | 76.8%              |  | 84.5%              |  | 89.2%              |  | 97.8%         | |   |
|  |  | ▆▆▆▆▆▆▆▆░░         |  | ▆▆▆▆▆▆▆▆░░         |  | ▆▆▆▆▆▆▆▆▆░         |  | ▆▆▆▆▆▆▆▆▆▆    | |   |
|  |  | Target: 85%        |  | Target: 90%        |  | Target: 95%        |  | Target: 99%   | |   |
|  |  | ▲ +2.3% vs prev    |  | ▲ +1.8% vs prev    |  | ▲ +3.1% vs prev    |  | ▼ -0.4% vs prev| |   |
|  |  +--------------------+  +--------------------+  +--------------------+  +---------------+ |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | OEE Trend Over Time                                          [Daily v] [Weekly v] [Monthly v] |   |
|  +-------------------------------------------------------------------------------------------+   |
|  |                                                                                            |   |
|  | OEE%                                                                                       |   |
|  | 100  |                                                                                     |   |
|  |  95  |                                            ●────●────●                              |   |
|  |  90  |                        ●────●────●────●───╱                                         |   |
|  |  85  |  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  (Target: 85%)           |   |
|  |  80  |           ●────●────●───╱                                                          |   |
|  |  75  |      ●───╱                                                                          |   |
|  |  70  |  ●──╱                                                                               |   |
|  |  65  +─────+─────+─────+─────+─────+─────+─────+─────+─────+─────+─────+─────+────>       |   |
|  |      12/15 12/20 12/25 12/30  1/5   1/10  1/15  1/20  1/25  1/30   2/5   2/10  2/15        |   |
|  |                                                                                            |   |
|  | Legend: ● OEE  ----- Target (85%)  ╱╲ Trend Line                                          |   |
|  |                                                                                            |   |
|  | Trend: ▲ Improving (+12.5% over 30 days) | Best Day: Jan 30 (94%) | Worst: Dec 16 (68%)   |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Multi-Metric Comparison                                                                    |   |
|  +-------------------------------------------------------------------------------------------+   |
|  |                                                                                            |   |
|  | %                                                                                          |   |
|  | 100  |                                                                                     |   |
|  |  95  |  ●─────●─────●─────●─────●─────●─────●──  Quality                                 |   |
|  |  90  |       ▲─────▲─────▲─────▲─────▲─────▲─  Performance                               |   |
|  |  85  |           ■─────■─────■─────■─────■───  Availability                              |   |
|  |  80  |                                                                                     |   |
|  |  75  |                  ◆─────◆─────◆─────◆──  OEE                                        |   |
|  |  70  +─────+─────+─────+─────+─────+─────+─────+─────+─────+─────+─────+─────+────>       |   |
|  |      12/15 12/20 12/25 12/30  1/5   1/10  1/15  1/20  1/25  1/30   2/5   2/10  2/15        |   |
|  |                                                                                            |   |
|  | Legend: ● Quality  ▲ Performance  ■ Availability  ◆ OEE                                  |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Machine Comparison (Last 30 Days)                                    [Sort: Avg OEE v]    |   |
|  +-------------------------------------------------------------------------------------------+   |
|  |                                                                                            |   |
|  | Machine           | Avg OEE | Trend   | Availability | Performance | Quality | Improvement|   |
|  | ---------------------------------------------------------------------------------          |   |
|  | Oven Line 1       | 85.2%   | ▲ +4.2% | 92.5%        | 93.8%       | 98.4%   | [Chart]    |   |
|  |                   | ████████▆ Above Target ✓                                               |   |
|  | ---------------------------------------------------------------------------------          |   |
|  | Mixer Line 1      | 78.4%   | ▲ +2.8% | 86.2%        | 91.5%       | 98.1%   | [Chart]    |   |
|  |                   | ███████░░ Below Target (gap: 6.6%)                                     |   |
|  | ---------------------------------------------------------------------------------          |   |
|  | Packaging Line 1  | 72.5%   | ▲ +1.2% | 78.8%        | 88.2%       | 97.5%   | [Chart]    |   |
|  |                   | ██████░░░ Below Target (gap: 12.5%) ⚠️ Low Performer                  |   |
|  | ---------------------------------------------------------------------------------          |   |
|  | Proofer Line 1    | 76.1%   | ─ 0.0%  | 84.5%        | 89.8%       | 96.8%   | [Chart]    |   |
|  |                   | ███████░░ Below Target (gap: 8.9%)                                     |   |
|  | ---------------------------------------------------------------------------------          |   |
|  | Cooling Conveyor  | 74.8%   | ▼ -1.5% | 82.4%        | 90.2%       | 97.2%   | [Chart]    |   |
|  |                   | ██████░░░ Below Target (gap: 10.2%) ▼ Declining                       |   |
|  |                                                                                            |   |
|  | Plant Average: 76.8% | Highest: Oven Line 1 (85.2%) | Lowest: Packaging Line 1 (72.5%)    |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Shift Comparison                                                                           |   |
|  +-------------------------------------------------------------------------------------------+   |
|  |                                                                                            |   |
|  | Shift         | Avg OEE | Avg Avail | Avg Perf | Avg Qual | Production | Downtime         |   |
|  | ---------------------------------------------------------------------------------          |   |
|  | Day Shift     | 78.5%   | 86.2%     | 90.5%    | 98.2%    | 52,480 u   | 1h 24m avg       |   |
|  | Evening Shift | 76.2%   | 83.8%     | 88.4%    | 97.8%    | 48,220 u   | 1h 48m avg       |   |
|  | Night Shift   | 74.8%   | 82.5%     | 87.2%    | 97.2%    | 42,160 u   | 2h 12m avg       |   |
|  |                                                                                            |   |
|  | Best Performing: Day Shift (+2.3% vs plant avg) | Training Opportunity: Night Shift      |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Key Insights & Trends                                                                      |   |
|  |                                                                                            |   |
|  | 📈 Positive Trends:                                                                        |   |
|  | • Overall OEE improving +2.3% month-over-month                                            |   |
|  | • Oven Line 1 consistently above target (85.2% avg)                                       |   |
|  | • Availability trend positive across all machines (+1.8% avg)                             |   |
|  |                                                                                            |   |
|  | ⚠️ Areas of Concern:                                                                       |   |
|  | • Packaging Line 1: 12.5% below target (consistent underperformer)                        |   |
|  | • Cooling Conveyor: Declining trend (-1.5% over 30 days)                                  |   |
|  | • Night Shift: 3.7% lower OEE than Day Shift (training gap?)                              |   |
|  |                                                                                            |   |
|  | 💡 Recommendations:                                                                        |   |
|  | 1. Deep dive on Packaging Line 1 performance (root cause analysis)                        |   |
|  | 2. Investigate Cooling Conveyor declining trend (preventive maintenance?)                 |   |
|  | 3. Night Shift training program to improve performance consistency                        |   |
|  | 4. Replicate Oven Line 1 best practices across other machines                             |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  [Export CSV] [Export PDF] [Email Report] [Schedule Review Meeting]            [Refresh Analysis]|
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Machine Trend Detail Modal

```
+--------------------------------------------------------------------------------------------------+
|  Machine Trend Analysis: Packaging Line 1                                              [x Close] |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | 30-Day Performance Summary                                                                 |   |
|  |                                                                                            |   |
|  | Avg OEE: 72.5% (Target: 85%, Gap: -12.5%)  |  Trend: ▲ +1.2% (Slow Improvement)           |   |
|  | Best Day: Jan 28 (82.4%)  |  Worst Day: Dec 18 (58.2%)  |  Std Dev: 6.8% (High Variability)|   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | OEE Trend (Daily)                                                                          |   |
|  |                                                                                            |   |
|  | OEE%                                                                                       |   |
|  |  90  |                                                                                     |   |
|  |  85  |  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  (Target)                      |   |
|  |  80  |                                            ●───●                                    |   |
|  |  75  |                 ●───●───●───●───●───●───●──╱                                        |   |
|  |  70  |       ●───●───●───╱                                                                 |   |
|  |  65  |  ●───╱                                                                              |   |
|  |  60  | ╱                                                                                   |   |
|  |  55  +─────+─────+─────+─────+─────+─────+─────+─────+─────+─────+─────+─────+────>       |   |
|  |      12/15 12/20 12/25 12/30  1/5   1/10  1/15  1/20  1/25  1/30   2/5   2/10  2/15        |   |
|  |                                                                                            |   |
|  | Trend Analysis: Gradual improvement but still 12.5% below target                          |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Component Breakdown                                                                        |   |
|  |                                                                                            |   |
|  | Availability:  78.8% (Target: 90%, Gap: -11.2%) ⚠️ PRIMARY ISSUE                          |   |
|  | Performance:   88.2% (Target: 95%, Gap: -6.8%)                                            |   |
|  | Quality:       97.5% (Target: 99%, Gap: -1.5%) ✓ Near Target                              |   |
|  |                                                                                            |   |
|  | Root Cause: Low availability due to frequent mechanical breakdowns                        |   |
|  | Top Downtime Reason: Mechanical Breakdown (avg 48 min/day)                                |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Weekly Comparison                                                                          |   |
|  |                                                                                            |   |
|  | Week        | OEE   | Availability | Performance | Quality | Downtime  | Notes            |   |
|  | ---------------------------------------------------------------------------------          |   |
|  | Dec 15-21   | 66.2% | 72.5%        | 85.8%       | 96.8%   | 2h 42m    | Major breakdown  |   |
|  | Dec 22-28   | 70.8% | 76.4%        | 87.2%       | 97.2%   | 2h 18m    | Improving        |   |
|  | Dec 29-Jan4 | 72.5% | 78.8%        | 88.0%       | 97.4%   | 2h 06m    | Maintenance done |   |
|  | Jan 5-11    | 74.2% | 80.2%        | 88.5%       | 97.8%   | 1h 54m    | Good week        |   |
|  | Jan 12-18   | 76.8% | 82.4%        | 89.2%       | 98.0%   | 1h 42m    | Best yet         |   |
|  |                                                                                            |   |
|  | Trend: ▲ Consistent improvement, downtime reducing week-over-week                         |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Recommendations for Improvement                                                            |   |
|  |                                                                                            |   |
|  | Priority: High - 12.5% gap to target, impacts plant OEE                                   |   |
|  |                                                                                            |   |
|  | 1. ⚙️ Implement preventive maintenance schedule (reduce mechanical breakdowns)             |   |
|  |    Expected Impact: +8% availability, +6% OEE                                             |   |
|  |                                                                                            |   |
|  | 2. 🔧 Replace aging conveyor motor (frequent failure point)                                |   |
|  |    Expected Impact: +3% availability, +2% OEE                                             |   |
|  |                                                                                            |   |
|  | 3. 📚 Operator training on quick changeovers                                               |   |
|  |    Expected Impact: +2% performance, +1.5% OEE                                            |   |
|  |                                                                                            |   |
|  | Total Potential Improvement: +9.5% OEE → 82% (closing 76% of gap to target)              |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  [Export Machine Report] [Schedule Maintenance] [Create Improvement Task]              [Close]   |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Success State (Mobile: < 768px)

```
+----------------------------------+
|  < Trend Analysis                |
|  [Last 30 Days v]                |
+----------------------------------+
|                                  |
|  Summary (30 Days)               |
|  +----------------------------+  |
|  | Avg OEE: 76.8%             |  |
|  | Availability: 84.5%        |  |
|  | Performance: 89.2%         |  |
|  | Quality: 97.8%             |  |
|  | ▲ +2.3% vs previous        |  |
|  +----------------------------+  |
|                                  |
|  OEE Trend                       |
|  [Mini Chart]                    |
|  ▲ Improving (+12.5% over 30d)   |
|  Best: Jan 30 (94%)              |
|  Worst: Dec 16 (68%)             |
|                                  |
|  Machines (5)                    |
|  +----------------------------+  |
|  | Oven Line 1                |  |
|  | OEE: 85.2% ▲ +4.2%         |  |
|  | ✓ Above Target             |  |
|  | [View]                     |  |
|  +----------------------------+  |
|  | Packaging Line 1 ⚠️        |  |
|  | OEE: 72.5% ▲ +1.2%         |  |
|  | Gap: -12.5% (Low)          |  |
|  | [View]                     |  |
|  +----------------------------+  |
|  | [View All (5)]             |  |
|                                  |
|  Insights                        |
|  +----------------------------+  |
|  | 📈 OEE improving +2.3%     |  |
|  | ⚠️ Packaging 12.5% below   |  |
|  | 💡 Night shift training    |  |
|  +----------------------------+  |
|                                  |
|  [Export] [Refresh]              |
|                                  |
+----------------------------------+
```

### Loading State

```
+--------------------------------------------------------------------------------------------------+
|  OEE > Trend Analysis               Period: [Last 30 Days v]  View: [All Machines v]  [Export]  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]        |
|                                                                                                  |
|  Loading trend analysis...                                                                       |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Empty State

```
+--------------------------------------------------------------------------------------------------+
|  OEE > Trend Analysis               Period: [Last 30 Days v]  View: [All Machines v]  [Export]  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|                                         [Chart Icon]                                             |
|                                                                                                  |
|                              Insufficient Data for Trend Analysis                                |
|                                                                                                  |
|                     Not enough historical data to generate trend analysis.                       |
|                     At least 7 days of OEE data required.                                        |
|                                                                                                  |
|                                    [View Real-Time Dashboard]                                    |
|                                                                                                  |
|                     Current Data: 3 days collected                                               |
|                     Required: 7+ days for trend analysis                                         |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Error State

```
+--------------------------------------------------------------------------------------------------+
|  OEE > Trend Analysis               Period: [Last 30 Days v]  View: [All Machines v]  [Export]  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|                                         [Warning Icon]                                           |
|                                                                                                  |
|                               Failed to Load Trend Analysis                                      |
|                                                                                                  |
|                     Unable to retrieve historical OEE data.                                      |
|                                                                                                  |
|                                Error: TREND_ANALYSIS_FETCH_FAILED                                |
|                                                                                                  |
|                                  [Retry]    [Contact Support]                                    |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

---

## Key Components

### 1. Trend Summary Metrics

30-day average OEE components with trends.

| Metric | Calculation | Display |
|--------|-------------|---------|
| Avg OEE | AVG(daily OEE) over period | "76.8%" |
| Avg Availability | AVG(daily availability) | "84.5%" |
| Avg Performance | AVG(daily performance) | "89.2%" |
| Avg Quality | AVG(daily quality) | "97.8%" |
| Trend | Compare to previous period | ▲ +2.3% vs prev |

### 2. OEE Trend Chart

Line chart showing OEE progression over time.

**Chart Elements:**
- X-axis: Date range
- Y-axis: OEE %
- Line: Daily/Weekly/Monthly OEE
- Target line: OEE target (dashed)
- Trend line: Linear regression
- Annotations: Best/Worst days

**Views:**
- Daily (up to 90 days)
- Weekly (up to 52 weeks)
- Monthly (up to 24 months)

### 3. Multi-Metric Comparison Chart

Overlay chart comparing OEE components.

**Lines:**
- Quality (●) - typically highest
- Performance (▲)
- Availability (■)
- OEE (◆) - product of all three

### 4. Machine Comparison Table

Machine performance comparison over period.

| Column | Source | Display |
|--------|--------|---------|
| Machine Name | machines.name | "Oven Line 1" |
| Avg OEE | AVG(daily OEE) | "85.2%" |
| Trend | Compare to previous | ▲ +4.2% / ▼ -1.5% / ─ 0.0% |
| Availability | AVG(availability) | "92.5%" |
| Performance | AVG(performance) | "93.8%" |
| Quality | AVG(quality) | "98.4%" |
| Improvement Chart | Sparkline | Mini trend chart |

**Alerts:**
- ⚠️ Low Performer: OEE >10% below target
- ▼ Declining: Negative trend >2%
- ✓ Above Target: OEE > target

### 5. Shift Comparison Table

Shift-level performance comparison.

| Shift | Avg OEE | Production | Downtime | Performance Gap |
|-------|---------|------------|----------|-----------------|
| Day Shift | 78.5% | 52,480 units | 1h 24m avg | Best |
| Evening Shift | 76.2% | 48,220 units | 1h 48m avg | -2.3% |
| Night Shift | 74.8% | 42,160 units | 2h 12m avg | -3.7% |

### 6. Key Insights & Trends

AI-driven insights and recommendations.

**Sections:**
- 📈 Positive Trends
- ⚠️ Areas of Concern
- 💡 Recommendations

---

## Main Actions

### Primary Actions

| Action | Location | Behavior |
|--------|----------|----------|
| Refresh Analysis | Footer [Refresh Analysis] | Reload trend data |
| Export CSV | Footer [Export CSV] | Download trend data |
| Export PDF | Footer [Export PDF] | Generate trend report PDF |
| Email Report | Footer [Email Report] | Email trend analysis |
| Schedule Review Meeting | Footer | Create calendar event |
| View Machine Detail | Table [Chart] | Opens MachineTrendDetailModal |

---

## States

### Loading State
- Skeleton summary metrics
- Skeleton charts
- "Loading trend analysis..." text

### Empty State
- Chart illustration
- "Insufficient Data for Trend Analysis" headline
- Data requirement (7+ days)
- [View Real-Time Dashboard] link

### Populated State (Success)
- Summary metrics visible
- Trend charts populated
- Machine comparison table
- Shift comparison
- Insights displayed

### Error State
- Warning icon
- "Failed to Load Trend Analysis" headline
- Error code: TREND_ANALYSIS_FETCH_FAILED
- [Retry] and [Contact Support] buttons

---

## Data Fields

### Trend Analysis Response

```json
{
  "summary": {
    "period_days": 30,
    "avg_oee_pct": 76.8,
    "avg_availability_pct": 84.5,
    "avg_performance_pct": 89.2,
    "avg_quality_pct": 97.8,
    "trend_pct": 2.3,
    "trend_direction": "up"
  },
  "trend_data": [
    {
      "date": "2025-12-15",
      "oee_pct": 68,
      "availability_pct": 75,
      "performance_pct": 85,
      "quality_pct": 96.5
    }
  ],
  "machines": [ ... ],
  "shifts": [ ... ],
  "insights": {
    "positive": [ ... ],
    "concerns": [ ... ],
    "recommendations": [ ... ]
  }
}
```

---

## API Endpoints

### Get Trend Analysis

```
GET /api/oee/analysis/trends
Query: ?period=30d&machines=all&view=daily

Response: { ... }
```

### Get Machine Trend Detail

```
GET /api/oee/analysis/machines/:id/trends
Query: ?period=30d

Response: { ... }
```

---

## Permissions

| Role | View Trends | Export Data | Schedule Meeting |
|------|------------|-------------|------------------|
| Production Manager | Yes | Yes | Yes |
| Operator | Yes | No | No |
| Admin | Yes | Yes | Yes |

---

## Business Rules

### Trend Calculation

```
Trend = (Current Period Avg - Previous Period Avg) / Previous Period Avg × 100

Example:
Current 30d Avg OEE: 76.8%
Previous 30d Avg OEE: 75.1%
Trend = (76.8 - 75.1) / 75.1 × 100 = +2.3%
```

### Variability Analysis

```
Standard Deviation (σ) = measure of variability

Low Variability: σ < 5% (consistent performance)
Medium Variability: σ = 5-10% (some fluctuation)
High Variability: σ > 10% (inconsistent performance)
```

---

## Accessibility

### Touch Targets
- Chart data points: 48dp
- Table rows: 48dp
- Buttons: 48x48dp

### Contrast
- Chart lines: 4.5:1
- Table text: 4.5:1
- Trend indicators: 3:1

### Screen Reader
- **Charts**: Detailed data table alternative
- **Trends**: "OEE improving, up 2.3% versus previous period"

### Keyboard Navigation
| Key | Action |
|-----|--------|
| Tab | Navigate charts, tables |
| Arrow keys | Navigate chart data points |
| Enter | View details, export |

---

## Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| **Desktop (>1024px)** | Full charts, all tables visible |
| **Tablet (768-1024px)** | Scrollable charts, condensed tables |
| **Mobile (<768px)** | Simplified charts, essential data only |

---

## Performance Notes

### Caching

```typescript
'org:{orgId}:oee:trends:{period}:{view}'        // 10 min TTL
'org:{orgId}:oee:machine-trends:{id}:{period}'  // 10 min TTL
```

### Load Time Targets

| Operation | Target |
|-----------|--------|
| Initial analysis load | < 3s |
| Machine detail load | < 1s |
| Export PDF | < 5s |

---

## Testing Requirements

### Unit Tests
```typescript
describe('Trend Analysis', () => {
  it('calculates trend correctly', async () => {});
  it('identifies best/worst days', async () => {});
  it('generates insights', async () => {});
});
```

---

## Quality Gates

- [x] All 4 states defined
- [x] Responsive breakpoints documented
- [x] All API endpoints specified
- [x] Accessibility checklist passed
- [x] Performance targets defined
- [x] Trend calculations documented

---

**Status**: Ready for Implementation
**Approval Mode**: auto_approve
**Estimated Effort**: 12-14 hours
**Quality Target**: 95/100
**PRD Coverage**: 100% (OEE PRD Section 10.6)
