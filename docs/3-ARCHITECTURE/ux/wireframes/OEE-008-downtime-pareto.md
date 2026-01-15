# OEE-008: Downtime Pareto Chart

**Module**: OEE (Overall Equipment Effectiveness)
**Feature**: Downtime Pareto Analysis (PRD Section 10.8)
**Status**: Ready for Implementation
**Last Updated**: 2026-01-15

---

## ASCII Wireframe

### Success State (Desktop - Pareto Chart)

```
+--------------------------------------------------------------------------------------------------+
|  OEE > Downtime Pareto              Period: [Last 30 Days v]  Machine: [All Machines v] [Export] |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Downtime Summary (Last 30 Days)                                                            |   |
|  |                                                                                            |   |
|  |  +--------------------+  +--------------------+  +--------------------+  +---------------+ |   |
|  |  | Total Downtime     |  | # Reasons          |  | MTTR               |  | Top Reason    | |   |
|  |  | 84h 32m            |  | 15 unique          |  | 18.4 minutes       |  | Mech Break    | |   |
|  |  | 358 events         |  | 8 categories       |  | ▼ -3.2 min vs avg  |  | (28% total)   | |   |
|  |  +--------------------+  +--------------------+  +--------------------+  +---------------+ |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Pareto Chart: Downtime by Reason                               [By Duration v] [By Count v] |   |
|  +-------------------------------------------------------------------------------------------+   |
|  |                                                                                            |   |
|  | Hours                                                                              %       |   |
|  |  25 |                                                                             100%     |   |
|  |     |  ████████                                                                           |   |
|  |  20 |  ████████                                                                   90%      |   |
|  |     |  ████████                                                                           |   |
|  |  15 |  ████████  ████████                                                         80%      |   |
|  |     |  ████████  ████████                                            ●──────●             |   |
|  |  10 |  ████████  ████████  ████████  ████████                       ╱        70%          |   |
|  |     |  ████████  ████████  ████████  ████████             ●────●───╱         60%          |   |
|  |   5 |  ████████  ████████  ████████  ████████  ████  ████ ╱                  50%          |   |
|  |     |  ████████  ████████  ████████  ████████  ████  ████╱                   40%          |   |
|  |   0 +──────────────────────────────────────────────────────────────────>     0%           |   |
|  |     Mech      Change    Minor     Material  Clean  Temp  Other (9 more)                   |   |
|  |     Break     over      Jam       Wait      ing    Adj                                    |   |
|  |                                                                                            |   |
|  |     23.5h     16.8h     12.4h     9.2h      7.8h   5.6h   9.3h                            |   |
|  |     (28%)     (20%)     (15%)     (11%)     (9%)   (7%)   (10%)                           |   |
|  |                                                                                            |   |
|  | Legend: ████ Downtime Hours  ●─── Cumulative % (Pareto Line)                             |   |
|  |                                                                                            |   |
|  | 80/20 Rule: Top 3 reasons (Mech Break, Changeover, Minor Jam) = 63% of total downtime    |   |
|  | Focus Area: Addressing top 3 reasons eliminates 53.7 hours (63% of downtime)             |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Top Downtime Reasons Breakdown                                      [Sort: Duration v]    |   |
|  +-------------------------------------------------------------------------------------------+   |
|  |                                                                                            |   |
|  | #  | Reason           | Category    | Duration | Events | Avg Dur | Cumul % | Actions     |   |
|  | ---------------------------------------------------------------------------------          |   |
|  | 1  | Mechanical       | Equipment   | 23h 32m  | 42     | 33.6m   | 28%     | [Analyze]   |   |
|  |    | Breakdown        | Failure     | ████████████████████████████                       |   |
|  |    |                  |             | Trend: ▲ +12% vs prev period ⚠️ Increasing         |   |
|  | ---------------------------------------------------------------------------------          |   |
|  | 2  | Product          | Planned     | 16h 48m  | 78     | 12.9m   | 48%     | [Analyze]   |   |
|  |    | Changeover       |             | ████████████████████                               |   |
|  |    |                  |             | Trend: ─ 0% vs prev (consistent)                   |   |
|  | ---------------------------------------------------------------------------------          |   |
|  | 3  | Minor Jam/       | Equipment   | 12h 24m  | 96     | 7.8m    | 63%     | [Analyze]   |   |
|  |    | Blockage         | Failure     | ██████████████                                     |   |
|  |    |                  |             | Trend: ▼ -8% vs prev ✓ Improving                   |   |
|  | ---------------------------------------------------------------------------------          |   |
|  | 4  | Waiting for      | Material    | 9h 12m   | 24     | 23.0m   | 74%     | [Analyze]   |   |
|  |    | Material         | Issue       | ██████████                                         |   |
|  |    |                  |             | Trend: ▲ +18% vs prev ⚠️ Increasing                |   |
|  | ---------------------------------------------------------------------------------          |   |
|  | 5  | Cleaning/        | Planned     | 7h 48m   | 32     | 14.6m   | 83%     | [Analyze]   |   |
|  |    | Sanitation       |             | ████████                                           |   |
|  |    |                  |             | Trend: ─ +2% vs prev (stable)                      |   |
|  | ---------------------------------------------------------------------------------          |   |
|  | 6  | Temperature      | Process     | 5h 36m   | 18     | 18.7m   | 90%     | [Analyze]   |   |
|  |    | Adjustment       | Issue       | ██████                                             |   |
|  |    |                  |             | Trend: ▼ -5% vs prev                               |   |
|  |                                                                                            |   |
|  | (9 more reasons - 10% of total downtime) [Expand All]                                    |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Machine Contribution to Top Reasons                                                        |   |
|  +-------------------------------------------------------------------------------------------+   |
|  |                                                                                            |   |
|  |                      Mech Break    Changeover    Minor Jam    Material Wait               |   |
|  | Oven Line 1             5.2h          3.8h         2.1h           1.2h                    |   |
|  |                       ██████        ████         ██             █                         |   |
|  |                                                                                            |   |
|  | Mixer Line 1            3.8h          4.2h         3.2h           2.4h                    |   |
|  |                       ████          █████        ███            ██                        |   |
|  |                                                                                            |   |
|  | Packaging Line 1        8.4h          5.2h         4.8h           3.6h                    |   |
|  |                       █████████     ██████       █████          ████                      |   |
|  |                       ⚠️ Highest contributor                                              |   |
|  |                                                                                            |   |
|  | Proofer Line 1          3.6h          2.4h         1.6h           1.2h                    |   |
|  |                       ████          ███          ██             █                         |   |
|  |                                                                                            |   |
|  | Cooling Conveyor        2.5h          1.2h         0.7h           0.8h                    |   |
|  |                       ███           █            █              █                         |   |
|  |                                                                                            |   |
|  | Click bar for machine-specific downtime breakdown                                         |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Root Cause Analysis & Recommendations                                                      |   |
|  |                                                                                            |   |
|  | 🎯 Focus Areas (80/20 Rule):                                                               |   |
|  |                                                                                            |   |
|  | 1. Mechanical Breakdown (23h 32m, 28% of downtime)                                        |   |
|  |    Root Cause: Aging equipment, insufficient preventive maintenance                       |   |
|  |    Primary Contributor: Packaging Line 1 (8.4h of 23.5h)                                  |   |
|  |    💡 Recommendation: Implement preventive maintenance schedule, replace critical parts    |   |
|  |    Expected Impact: Reduce mechanical breakdowns by 40% (~9.4 hours/month saved)          |   |
|  |                                                                                            |   |
|  | 2. Product Changeover (16h 48m, 20% of downtime)                                          |   |
|  |    Root Cause: Manual changeover process, lack of standardization                         |   |
|  |    💡 Recommendation: SMED (Single-Minute Exchange of Die) training for operators          |   |
|  |    Expected Impact: Reduce changeover time by 25% (~4.2 hours/month saved)                |   |
|  |                                                                                            |   |
|  | 3. Minor Jam/Blockage (12h 24m, 15% of downtime)                                          |   |
|  |    Root Cause: Material quality variability, operator training gaps                       |   |
|  |    💡 Recommendation: Material specification review, operator jam-clearing training        |   |
|  |    Expected Impact: Reduce jams by 30% (~3.7 hours/month saved)                           |   |
|  |                                                                                            |   |
|  | 4. Waiting for Material (9h 12m, 11% of downtime) ⚠️ Increasing Trend                     |   |
|  |    Root Cause: Warehouse coordination issues, inventory shortages                         |   |
|  |    💡 Recommendation: Implement kanban system, improve production-warehouse coordination   |   |
|  |    Expected Impact: Reduce material wait by 50% (~4.6 hours/month saved)                  |   |
|  |                                                                                            |   |
|  | Total Potential Savings: 21.9 hours/month (26% reduction in total downtime)              |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  [Export CSV] [Export PDF] [Email Report] [Create Improvement Tasks]          [Refresh Analysis] |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Reason Detail Modal (Clicked "Analyze")

```
+--------------------------------------------------------------------------------------------------+
|  Downtime Reason Analysis: Mechanical Breakdown                                        [x Close] |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | 30-Day Summary                                                                             |   |
|  |                                                                                            |   |
|  | Total Duration: 23h 32m (28% of plant downtime)                                           |   |
|  | # Events: 42                                                                              |   |
|  | Avg Duration: 33.6 minutes per event                                                      |   |
|  | Trend: ▲ +12% vs previous 30 days ⚠️ Increasing (Needs Attention)                        |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Trend Over Time                                                                            |   |
|  |                                                                                            |   |
|  | Hours                                                                                      |   |
|  |  30 |                                                                                      |   |
|  |  25 |                                                       ●                              |   |
|  |  20 |                                              ●───────╱                               |   |
|  |  15 |                                     ●───────╱                                        |   |
|  |  10 |                             ●──────╱                                                 |   |
|  |   5 |                    ●───────╱                                                         |   |
|  |   0 +─────+─────+─────+─────+─────+─────+─────+─────+─────+─────+─────+─────+────>       |   |
|  |     Week1  Week2  Week3  Week4  Week5  Week6  Week7  Week8  Week9 Week10 Week11 Week12     |   |
|  |                                                                                            |   |
|  | Trend: Consistent increase over 12 weeks (5.2h → 23.5h)                                   |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Breakdown by Machine                                                                       |   |
|  |                                                                                            |   |
|  | Machine           | Duration | Events | Avg Dur | % of Reason | Common Failure Point      |   |
|  | ---------------------------------------------------------------------------------          |   |
|  | Packaging Line 1  | 8h 24m   | 12     | 42.0m   | 36%         | Conveyor Motor            |   |
|  |                   | ████████████████████                                                   |   |
|  | Oven Line 1       | 5h 12m   | 8      | 39.0m   | 22%         | Heating Element           |   |
|  |                   | ████████████                                                           |   |
|  | Mixer Line 1      | 3h 48m   | 10     | 22.8m   | 16%         | Gearbox                   |   |
|  |                   | █████████                                                              |   |
|  | Proofer Line 1    | 3h 36m   | 7      | 30.9m   | 15%         | Temperature Sensor        |   |
|  |                   | ████████                                                               |   |
|  | Cooling Conveyor  | 2h 30m   | 5      | 30.0m   | 11%         | Belt Tracking             |   |
|  |                   | ██████                                                                 |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Breakdown by Sub-Reason                                                                    |   |
|  |                                                                                            |   |
|  | Sub-Reason               | Duration | Events | % of Mechanical |                          |   |
|  | ---------------------------------------------------------------------------------          |   |
|  | Motor Failure             | 10h 12m  | 15     | 43%             | ⚠️ Most Common           |   |
|  | Bearing/Gearbox Issue     | 6h 24m   | 12     | 27%             |                          |   |
|  | Electrical Component      | 4h 48m   | 8      | 20%             |                          |   |
|  | Sensor Malfunction        | 2h 08m   | 7      | 10%             |                          |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Recent Events (Last 7 Days)                                                                |   |
|  |                                                                                            |   |
|  | Date/Time         | Machine       | Duration | Sub-Reason      | Resolution               |   |
|  | ---------------------------------------------------------------------------------          |   |
|  | Jan 15, 9:15 AM   | Packaging 1   | 48m      | Motor Failure   | Motor replaced           |   |
|  | Jan 14, 2:30 PM   | Oven 1        | 36m      | Heating Element | Element replaced         |   |
|  | Jan 13, 10:20 AM  | Mixer 1       | 28m      | Gearbox Issue   | Gearbox lubricated       |   |
|  | Jan 12, 3:45 PM   | Proofer 1     | 32m      | Sensor Fail     | Sensor replaced          |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Root Cause Analysis                                                                        |   |
|  |                                                                                            |   |
|  | Primary Root Causes:                                                                       |   |
|  | 1. Equipment Age: 60% of failures on machines >5 years old                                |   |
|  | 2. Insufficient Preventive Maintenance: 75% of failures could have been prevented         |   |
|  | 3. Parts Availability: 40% of downtime due to waiting for replacement parts               |   |
|  |                                                                                            |   |
|  | 💡 Recommendations:                                                                        |   |
|  | 1. Implement weekly preventive maintenance schedule for Packaging Line 1                  |   |
|  | 2. Stock critical spare parts (motors, bearings) on-site                                  |   |
|  | 3. Upgrade aging equipment (Packaging Line 1 motor → modern VFD motor)                    |   |
|  | 4. Install predictive maintenance sensors (vibration, temperature)                        |   |
|  |                                                                                            |   |
|  | Expected Impact:                                                                           |   |
|  | - Reduce mechanical breakdowns by 40% (~9.4 hours/month)                                  |   |
|  | - Reduce MTTR by 30% (42min → 29min avg)                                                  |   |
|  | - Cost savings: ~$1,400/month (reduced downtime + production recovery)                    |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  [Export Detailed Report] [Create Maintenance Tasks] [Schedule Equipment Review]       [Close]  |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Success State (Mobile: < 768px)

```
+----------------------------------+
|  < Downtime Pareto               |
|  [Last 30 Days v]                |
+----------------------------------+
|                                  |
|  Summary (30 Days)               |
|  +----------------------------+  |
|  | Total: 84h 32m (358 ev)    |  |
|  | Reasons: 15 unique         |  |
|  | MTTR: 18.4 min             |  |
|  | Top: Mech Break (28%)      |  |
|  +----------------------------+  |
|                                  |
|  Pareto Chart                    |
|  [Mini Chart Preview]            |
|  Top 3 = 63% of downtime         |
|                                  |
|  Top Reasons (6)                 |
|  +----------------------------+  |
|  | 1. Mech Breakdown          |  |
|  | 23h 32m (28%) ▲ +12%       |  |
|  | 42 events | Avg: 33.6m     |  |
|  | [Analyze]                  |  |
|  +----------------------------+  |
|  | 2. Changeover              |  |
|  | 16h 48m (20%) ─ 0%         |  |
|  | 78 events | Avg: 12.9m     |  |
|  | [Analyze]                  |  |
|  +----------------------------+  |
|  | 3. Minor Jam               |  |
|  | 12h 24m (15%) ▼ -8%        |  |
|  | 96 events | Avg: 7.8m      |  |
|  | [Analyze]                  |  |
|  +----------------------------+  |
|  | [View All (15)]            |  |
|                                  |
|  Recommendations               |   |
|  +----------------------------+  |
|  | 💡 Focus top 3 reasons     |  |
|  | Save 21.9h/month (26%)     |  |
|  | [View Details]             |  |
|  +----------------------------+  |
|                                  |
|  [Export] [Refresh]              |
|                                  |
+----------------------------------+
```

### Loading State

```
+--------------------------------------------------------------------------------------------------+
|  OEE > Downtime Pareto              Period: [Last 30 Days v]  Machine: [All Machines v] [Export] |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]        |
|                                                                                                  |
|  Loading Pareto analysis...                                                                      |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Empty State

```
+--------------------------------------------------------------------------------------------------+
|  OEE > Downtime Pareto              Period: [Last 30 Days v]  Machine: [All Machines v] [Export] |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|                                         [Chart Icon]                                             |
|                                                                                                  |
|                              No Downtime Events in Selected Period                               |
|                                                                                                  |
|                     No downtime events available for Pareto analysis.                            |
|                                                                                                  |
|                                    [View Real-Time Dashboard]                                    |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Error State

```
+--------------------------------------------------------------------------------------------------+
|  OEE > Downtime Pareto              Period: [Last 30 Days v]  Machine: [All Machines v] [Export] |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|                                         [Warning Icon]                                           |
|                                                                                                  |
|                               Failed to Load Pareto Analysis                                     |
|                                                                                                  |
|                     Unable to retrieve downtime data.                                            |
|                                                                                                  |
|                                Error: PARETO_ANALYSIS_FETCH_FAILED                               |
|                                                                                                  |
|                                  [Retry]    [Contact Support]                                    |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

---

## Key Components

### 1. Downtime Summary Metrics

30-day downtime overview.

| Metric | Calculation | Display |
|--------|-------------|---------|
| Total Downtime | SUM(event durations) | "84h 32m" |
| # Reasons | COUNT(DISTINCT reasons) | "15 unique" |
| MTTR | AVG(event durations) | "18.4 minutes" |
| Top Reason | MODE(reason) | "Mech Break (28%)" |

### 2. Pareto Chart

Combined bar and line chart following Pareto principle.

**Chart Elements:**
- Bars: Downtime duration by reason (sorted desc)
- Line: Cumulative percentage (0-100%)
- 80% threshold line: Focus zone indicator
- X-axis: Downtime reasons
- Y-axis (left): Hours
- Y-axis (right): Cumulative %

**80/20 Rule Highlight:**
- Top 20% of reasons = 80% of downtime
- Visually highlighted focus area

### 3. Top Downtime Reasons Table

Detailed breakdown of each reason.

| Column | Source | Display |
|--------|--------|---------|
| Rank | ORDER BY duration DESC | "#1" |
| Reason | reason_codes.name | "Mechanical Breakdown" |
| Category | reason_codes.category | "Equipment Failure" |
| Duration | SUM(durations) | "23h 32m" |
| Events | COUNT(events) | "42" |
| Avg Duration | AVG(durations) | "33.6m" |
| Cumulative % | Running total % | "28%" |
| Trend | vs previous period | ▲ +12% / ▼ -8% / ─ 0% |

**Trend Alerts:**
- ⚠️ Increasing: >10% increase vs prev
- ✓ Improving: >5% decrease

### 4. Machine Contribution Matrix

Machine-level contribution to top reasons.

| Machine | Reason 1 | Reason 2 | Reason 3 | Reason 4 |
|---------|----------|----------|----------|----------|
| Packaging 1 | 8.4h | 5.2h | 4.8h | 3.6h |
| Oven 1 | 5.2h | 3.8h | 2.1h | 1.2h |

**Bar Length** = Duration (proportional)
**Alerts**: ⚠️ Highest contributor

### 5. Root Cause Analysis & Recommendations

AI-driven insights using 80/20 rule.

**Format:**
- Focus Areas (top 3-4 reasons = 80% of downtime)
- Root Cause for each
- Recommendation with expected impact
- Total potential savings

---

## Main Actions

### Primary Actions

| Action | Location | Behavior |
|--------|----------|----------|
| Refresh Analysis | Footer [Refresh Analysis] | Reload Pareto data |
| Export CSV | Footer [Export CSV] | Download Pareto data |
| Export PDF | Footer [Export PDF] | Generate Pareto report PDF |
| Email Report | Footer [Email Report] | Email Pareto analysis |
| Create Improvement Tasks | Footer | Generate tasks from recommendations |
| Analyze Reason | Table [Analyze] | Opens ReasonDetailModal |

---

## States

### Loading State
- Skeleton chart and table
- "Loading Pareto analysis..." text

### Empty State
- Chart illustration
- "No Downtime Events in Selected Period"

### Populated State (Success)
- Pareto chart visible
- Top reasons table populated
- Machine contribution matrix
- Recommendations displayed

### Error State
- Warning icon
- "Failed to Load Pareto Analysis"
- Error code: PARETO_ANALYSIS_FETCH_FAILED

---

## Data Fields

### Pareto Response

```json
{
  "summary": {
    "total_downtime_minutes": 5072,
    "event_count": 358,
    "unique_reasons": 15,
    "mttr_minutes": 18.4
  },
  "pareto_data": [
    {
      "reason_code": "MECH_BREAK",
      "reason_name": "Mechanical Breakdown",
      "category": "Equipment Failure",
      "duration_minutes": 1412,
      "duration_formatted": "23h 32m",
      "event_count": 42,
      "avg_duration_minutes": 33.6,
      "pct_of_total": 28,
      "cumulative_pct": 28,
      "trend_pct": 12,
      "trend_direction": "up"
    }
  ],
  "machine_contribution": [ ... ],
  "recommendations": [ ... ]
}
```

---

## API Endpoints

### Get Pareto Analysis

```
GET /api/oee/analysis/pareto
Query: ?period=30d&machines=all&sort=duration

Response: { ... }
```

### Get Reason Detail

```
GET /api/oee/analysis/reasons/:code
Query: ?period=30d

Response: { ... }
```

---

## Permissions

| Role | View Pareto | Export Data | Create Tasks |
|------|------------|-------------|--------------|
| Production Manager | Yes | Yes | Yes |
| Operator | Yes | No | No |
| Admin | Yes | Yes | Yes |

---

## Business Rules

### Pareto Principle (80/20 Rule)

```
80% of downtime comes from 20% of reasons

Implementation:
- Sort reasons by duration DESC
- Calculate cumulative percentage
- Highlight reasons where cumulative < 80%
```

### Trend Significance

| Change | Label | Alert |
|--------|-------|-------|
| >10% increase | ⚠️ Increasing | Requires attention |
| >5% decrease | ✓ Improving | Positive trend |
| -5% to +5% | ─ Stable | Monitor |

---

## Accessibility

### Touch Targets
- Chart bars: 48dp width minimum
- Table rows: 48dp height
- Buttons: 48x48dp

### Contrast
- Chart bars: 3:1
- Pareto line: 4.5:1
- Table text: 4.5:1

### Screen Reader
- **Chart**: "Pareto chart showing downtime by reason with cumulative percentage"
- **Bars**: "Mechanical Breakdown, 23 hours 32 minutes, 28% of total"

### Keyboard Navigation
| Key | Action |
|-----|--------|
| Tab | Navigate table, buttons |
| Enter | Analyze reason, export |
| Arrow keys | Navigate chart bars |

---

## Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| **Desktop (>1024px)** | Full Pareto chart, all tables visible |
| **Tablet (768-1024px)** | Condensed chart, scrollable tables |
| **Mobile (<768px)** | Simplified chart, essential data only |

---

## Performance Notes

### Caching

```typescript
'org:{orgId}:oee:pareto:{period}:{machines}'     // 10 min TTL
'org:{orgId}:oee:reason-detail:{code}:{period}'  // 10 min TTL
```

### Load Time Targets

| Operation | Target |
|-----------|--------|
| Initial Pareto load | < 2s |
| Reason detail load | < 1s |
| Export PDF | < 3s |

---

## Testing Requirements

### Unit Tests
```typescript
describe('Downtime Pareto', () => {
  it('sorts reasons by duration correctly', async () => {});
  it('calculates cumulative percentage', async () => {});
  it('identifies 80/20 focus areas', async () => {});
});
```

---

## Quality Gates

- [x] All 4 states defined
- [x] Responsive breakpoints documented
- [x] All API endpoints specified
- [x] Accessibility checklist passed
- [x] Performance targets defined
- [x] Pareto principle implemented
- [x] 80/20 rule highlighted

---

**Status**: Ready for Implementation
**Approval Mode**: auto_approve
**Estimated Effort**: 10-12 hours
**Quality Target**: 95/100
**PRD Coverage**: 100% (OEE PRD Section 10.8)
