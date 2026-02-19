# OEE-007: Machine Utilization Heatmap

**Module**: OEE (Overall Equipment Effectiveness)
**Feature**: Machine Utilization Calendar Heatmap (PRD Section 10.7)
**Status**: Ready for Implementation
**Last Updated**: 2026-01-15

---

## ASCII Wireframe

### Success State (Desktop - Heatmap View)

```
+--------------------------------------------------------------------------------------------------+
|  OEE > Utilization Heatmap          Period: [Last 90 Days v]  Machine: [All Machines v] [Export] |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Utilization Overview (Last 90 Days)                                                        |   |
|  |                                                                                            |   |
|  |  +--------------------+  +--------------------+  +--------------------+  +---------------+ |   |
|  |  | Avg Utilization    |  | Peak Utilization   |  | Low Utilization    |  | Downtime Days | |   |
|  |  | 78.4%              |  | 96.2%              |  | 42.5%              |  | 8 days        | |   |
|  |  | Across 6 machines  |  | Jan 15, 2026       |  | Dec 25, 2025       |  | < 50% util    | |   |
|  |  +--------------------+  +--------------------+  +--------------------+  +---------------+ |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Calendar Heatmap: All Machines                                              [Month v]     |   |
|  +-------------------------------------------------------------------------------------------+   |
|  |                                                                                            |   |
|  |        Dec 2025                  Jan 2026                  Feb 2026                       |   |
|  |  Su Mo Tu We Th Fr Sa    Su Mo Tu We Th Fr Sa    Su Mo Tu We Th Fr Sa                   |   |
|  |      1  2  3  4  5  6              1  2  3  4                       1                     |   |
|  |      ██ ██ ██ ██ ██ ██              ██ ██ ██ ██                       ██                  |   |
|  |      95 94 96 92 91 88              94 96 95 93                       92                  |   |
|  |                                                                                            |   |
|  |   7  8  9 10 11 12 13     5  6  7  8  9 10 11     2  3  4  5  6  7  8                    |   |
|  |  ██ ██ ██ ██ ██ ██ ██    ██ ██ ██ ██ ██ ██ ██    ██ ██ ██ ██ ██ ██ ██                   |   |
|  |  90 92 94 88 86 84 82    96 94 92 88 90 92 94    90 88 92 94 96 93 91                   |   |
|  |                                                                                            |   |
|  |  14 15 16 17 18 19 20    12 13 14 15 16 17 18     9 10 11 12 13 14 15                    |   |
|  |  ██ ██ ░░ ██ ██ ██ ██    ██ ██ ██ ██ ██ ██ ██    ██ ██ ██ ██ ██ ██ ██                   |   |
|  |  80 78 56 82 84 86 88    90 92 94 96 94 92 90    88 86 84 82 80 78 76                   |   |
|  |                                                                                            |   |
|  |  21 22 23 24 25 26 27    19 20 21 22 23 24 25                                             |   |
|  |  ██ ██ ██ ██ ░░ ░░ ██    ██ ██ ██ ██ ██ ██ ██                                            |   |
|  |  84 86 88 90 42 38 92    88 90 92 94 96 95 93                                            |   |
|  |                                                                                            |   |
|  |  28 29 30 31             26 27 28 29 30 31                                                |   |
|  |  ██ ██ ██ ██             ██ ██ ██ ██ ██ ██                                               |   |
|  |  94 96 95 92             91 92 94 96 95 94                                               |   |
|  |                                                                                            |   |
|  | Legend: ██ >80% (Good) ██ 60-80% (Fair) ░░ <60% (Poor) [Hover for details]              |   |
|  |                                                                                            |   |
|  | Selected: Dec 16, 2025 | Utilization: 56% | 6 machines | [View Day Details]             |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Machine Utilization Matrix                                                                 |   |
|  +-------------------------------------------------------------------------------------------+   |
|  |                                                                                            |   |
|  |                 Dec 15-21  Dec 22-28  Dec 29-Jan4  Jan 5-11  Jan 12-18  Jan 19-25        |   |
|  | Oven Line 1        92%       94%        96%         94%       95%        93%              |   |
|  |                   ████     █████      ██████      █████     █████      ████              |   |
|  |                                                                                            |   |
|  | Mixer Line 1       88%       90%        92%         91%       90%        89%              |   |
|  |                   ████     ████       █████       ████      ████       ████              |   |
|  |                                                                                            |   |
|  | Packaging 1        72%       75%        78%         80%       82%        84%              |   |
|  |                   ███      ███        ████        ████      ████       ████              |   |
|  |                                                                                            |   |
|  | Proofer 1          84%       86%        88%         87%       86%        85%              |   |
|  |                   ████     ████       ████        ████      ████       ████              |   |
|  |                                                                                            |   |
|  | Cooling Conv       76%       78%        80%         79%       77%        75%              |   |
|  |                   ███      ████       ████        ███       ███        ███               |   |
|  |                                                                                            |   |
|  | Slicer 1           68%       70%        72%         74%       76%        78%              |   |
|  |                   ███      ███        ███         ███       ███        ████              |   |
|  |                                                                                            |   |
|  | Click cell for week details | Color: Dark = High Util, Light = Low Util                  |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Utilization Distribution                                                                   |   |
|  +-------------------------------------------------------------------------------------------+   |
|  |                                                                                            |   |
|  | Days                                                                                       |   |
|  |  45 |                                                                                      |   |
|  |  40 |                      ████████                                                        |   |
|  |  35 |                      ████████                                                        |   |
|  |  30 |                      ████████                                                        |   |
|  |  25 |           ████████   ████████                                                        |   |
|  |  20 |           ████████   ████████   ████████                                             |   |
|  |  15 |  ████     ████████   ████████   ████████   ████                                      |   |
|  |  10 |  ████     ████████   ████████   ████████   ████     ████                            |   |
|  |   5 |  ████     ████████   ████████   ████████   ████     ████                            |   |
|  |   0 +─────────────────────────────────────────────────────────────>                       |   |
|  |     <50%   50-60%    60-70%    70-80%    80-90%   90-100%                                |   |
|  |                                                                                            |   |
|  | Most Common: 70-80% utilization (38 days) | Target: >80% (62% of days met target)        |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Low Utilization Days (< 60%)                                                               |   |
|  |                                                                                            |   |
|  | Date          | Utilization | Machines Down | Primary Reason        | Impact              |   |
|  | ---------------------------------------------------------------------------------          |   |
|  | Dec 25, 2025  | 42%         | 4 of 6       | Holiday (Planned)     | Low (expected)      |   |
|  | Dec 16, 2025  | 56%         | 2 of 6       | Power Outage          | High (unplanned)    |   |
|  | Jan 1, 2026   | 38%         | 5 of 6       | Holiday (Planned)     | Low (expected)      |   |
|  | Dec 24, 2025  | 58%         | 3 of 6       | Early Shutdown        | Medium              |   |
|  |                                                                                            |   |
|  | Total Low Utilization Days: 8 (8.9% of period) | Unplanned: 2 days (⚠️ Investigate)      |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Patterns & Insights                                                                        |   |
|  |                                                                                            |   |
|  | 📊 Utilization Patterns:                                                                   |   |
|  | • Weekdays: 82.5% avg utilization (Above target ✓)                                       |   |
|  | • Weekends: 68.2% avg utilization (Below target by 11.8%)                                |   |
|  | • Monthly Trend: +4.2% improvement (Dec → Jan)                                            |   |
|  |                                                                                            |   |
|  | 🕒 Time-Based Patterns:                                                                    |   |
|  | • Best Week: Jan 12-18 (90.8% avg)                                                        |   |
|  | • Worst Week: Dec 22-28 (72.4% avg, holiday impact)                                       |   |
|  | • Consistent Performers: Oven Line 1, Proofer Line 1 (always >84%)                        |   |
|  |                                                                                            |   |
|  | ⚠️ Areas for Improvement:                                                                  |   |
|  | • Weekend Utilization: Significant drop-off (investigate staffing)                        |   |
|  | • Packaging Line 1: Lowest utilization (72-84%), improving but still below target         |   |
|  | • Unplanned Low Days: 2 days due to power outage (risk mitigation needed)                 |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  [Export PNG] [Export CSV] [Email Report] [Set Utilization Alerts]            [Refresh Heatmap] |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Day Detail Modal (Clicked on Calendar Cell)

```
+--------------------------------------------------------------------------------------------------+
|  Day Details: December 16, 2025                                                        [x Close] |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Day Summary                                                                                |   |
|  |                                                                                            |   |
|  | Date: Tuesday, December 16, 2025                                                          |   |
|  | Plant Utilization: 56% ⚠️ Low (Target: 80%)                                               |   |
|  | Machines Active: 4 of 6 (2 down for full day)                                            |   |
|  | Primary Issue: Power Outage (4:30 AM - 10:15 AM)                                         |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Machine Status                                                                             |   |
|  |                                                                                            |   |
|  | Machine           | Status  | Uptime  | Utilization | OEE   | Production | Downtime       |   |
|  | ---------------------------------------------------------------------------------          |   |
|  | Oven Line 1       | 🟢 Run  | 5h 45m  | 72%         | 68%   | 1,280 u    | 2h 15m         |   |
|  | Mixer Line 1      | 🟢 Run  | 6h 10m  | 77%         | 72%   | 1,450 u    | 1h 50m         |   |
|  | Packaging Line 1  | 🔴 Down | 0h 0m   | 0%          | 0%    | 0 u        | 8h (Power Out) |   |
|  | Proofer Line 1    | 🟢 Run  | 5h 30m  | 69%         | 64%   | 985 u      | 2h 30m         |   |
|  | Cooling Conveyor  | 🟢 Run  | 6h 20m  | 79%         | 74%   | 1,680 u    | 1h 40m         |   |
|  | Slicer Line 1     | 🔴 Down | 0h 0m   | 0%          | 0%    | 0 u        | 8h (Power Out) |   |
|  |                                                                                            |   |
|  | Total Production: 5,395 units (68% of daily target 7,950 units)                          |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Timeline: Hourly Utilization                                                               |   |
|  |                                                                                            |   |
|  | Util%                                                                                      |   |
|  | 100  |                                                                                     |   |
|  |  80  |                           ●─────●─────●─────●─────●                                 |   |
|  |  60  |                     ●────╱                                                          |   |
|  |  40  |              ●─────╱                                                                |   |
|  |  20  |  ░░░░░░░░░░░░╱                                                                      |   |
|  |   0  | ░░░░░░░░░░░░                                                                        |   |
|  |      +─────+─────+─────+─────+─────+─────+─────+─────+─────+─────+─────+─────+────>       |   |
|  |      6AM   7AM   8AM   9AM   10AM  11AM  12PM  1PM   2PM   3PM   4PM   5PM   6PM          |   |
|  |                                                                                            |   |
|  | ░░░ Power Outage (4:30-10:15 AM)  ● Normal Operations                                    |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Root Cause & Impact Analysis                                                               |   |
|  |                                                                                            |   |
|  | Primary Issue: Facility Power Outage                                                      |   |
|  | Start Time: 4:30 AM | End Time: 10:15 AM | Duration: 5h 45m                              |   |
|  |                                                                                            |   |
|  | Impact:                                                                                    |   |
|  | • 2 machines completely offline (Packaging, Slicer)                                       |   |
|  | • 4 machines partial downtime (5h 45m production loss)                                    |   |
|  | • 2,555 units production shortfall (32% below daily target)                               |   |
|  | • Estimated revenue impact: $3,832 (@ $1.50/unit avg)                                     |   |
|  |                                                                                            |   |
|  | Recovery Actions:                                                                          |   |
|  | • Extended evening shift by 2 hours to recover production                                 |   |
|  | • Prioritized critical orders (recovered 60% of shortfall)                                |   |
|  |                                                                                            |   |
|  | Recommendations:                                                                           |   |
|  | • Install backup generator for critical machines (Packaging, Slicer)                      |   |
|  | • UPS system for control systems (prevent startup delays)                                 |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  [Export Day Report] [Create Incident Task] [Schedule Infrastructure Review]          [Close]   |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Success State (Mobile: < 768px)

```
+----------------------------------+
|  < Utilization Heatmap           |
|  [Last 90 Days v]                |
+----------------------------------+
|                                  |
|  Overview (90 Days)              |
|  +----------------------------+  |
|  | Avg: 78.4%                 |  |
|  | Peak: 96.2% (Jan 15)       |  |
|  | Low: 42.5% (Dec 25)        |  |
|  | <50%: 8 days               |  |
|  +----------------------------+  |
|                                  |
|  Jan 2026                        |
|  Su Mo Tu We Th Fr Sa            |
|        1  2  3  4                |
|        ██ ██ ██ ██               |
|        94 96 95 93               |
|   5  6  7  8  9 10 11            |
|  ██ ██ ██ ██ ██ ██ ██            |
|  96 94 92 88 90 92 94            |
|                                  |
|  [Prev] [Next]                   |
|  Legend: ██>80% ██60-80% ░░<60%  |
|                                  |
|  Machines (6)                    |
|  +----------------------------+  |
|  | Oven Line 1: 94% avg       |  |
|  | ██████████████████         |  |
|  +----------------------------+  |
|  | Packaging 1: 78% avg       |  |
|  | ███████████████░           |  |
|  +----------------------------+  |
|  | [View All (6)]             |  |
|                                  |
|  Low Days (8)                    |
|  +----------------------------+  |
|  | Dec 25: 42% (Holiday)      |  |
|  | Dec 16: 56% (Power Out)    |  |
|  | [View All]                 |  |
|  +----------------------------+  |
|                                  |
|  [Export] [Refresh]              |
|                                  |
+----------------------------------+
```

### Loading State

```
+--------------------------------------------------------------------------------------------------+
|  OEE > Utilization Heatmap          Period: [Last 90 Days v]  Machine: [All Machines v] [Export] |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]        |
|                                                                                                  |
|  Loading utilization heatmap...                                                                  |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Empty State

```
+--------------------------------------------------------------------------------------------------+
|  OEE > Utilization Heatmap          Period: [Last 90 Days v]  Machine: [All Machines v] [Export] |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|                                         [Calendar Icon]                                          |
|                                                                                                  |
|                              Insufficient Data for Heatmap                                       |
|                                                                                                  |
|                     Not enough historical data to generate utilization heatmap.                  |
|                     At least 30 days of data required.                                           |
|                                                                                                  |
|                                    [View Real-Time Dashboard]                                    |
|                                                                                                  |
|                     Current Data: 12 days collected                                              |
|                     Required: 30+ days for heatmap analysis                                      |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Error State

```
+--------------------------------------------------------------------------------------------------+
|  OEE > Utilization Heatmap          Period: [Last 90 Days v]  Machine: [All Machines v] [Export] |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|                                         [Warning Icon]                                           |
|                                                                                                  |
|                               Failed to Load Utilization Heatmap                                 |
|                                                                                                  |
|                     Unable to retrieve utilization data.                                         |
|                                                                                                  |
|                                Error: HEATMAP_FETCH_FAILED                                       |
|                                                                                                  |
|                                  [Retry]    [Contact Support]                                    |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

---

## Key Components

### 1. Utilization Overview Metrics

90-day utilization summary.

| Metric | Calculation | Display |
|--------|-------------|---------|
| Avg Utilization | AVG(daily utilization) | "78.4%" |
| Peak Utilization | MAX(daily utilization) | "96.2% on Jan 15" |
| Low Utilization | MIN(daily utilization) | "42.5% on Dec 25" |
| Downtime Days | COUNT(days < 50%) | "8 days" |

### 2. Calendar Heatmap

Visual calendar showing daily utilization.

**Heatmap Colors:**
- Dark Green (██): >80% utilization (Good)
- Medium Green (██): 60-80% utilization (Fair)
- Light Gray (░░): <60% utilization (Poor)

**Interactions:**
- Hover: Show day details tooltip
- Click: Open DayDetailModal

### 3. Machine Utilization Matrix

Weekly machine performance matrix.

| Machine | Week 1 | Week 2 | Week 3 | Trend |
|---------|--------|--------|--------|-------|
| Oven Line 1 | 92% | 94% | 96% | ▲ Improving |
| Packaging 1 | 72% | 75% | 78% | ▲ Improving |

**Cell Format:**
- Percentage value
- Bar chart (length = utilization)
- Click to view week details

### 4. Utilization Distribution

Histogram showing frequency of utilization levels.

**Bins:**
- <50% (Critical)
- 50-60% (Poor)
- 60-70% (Fair)
- 70-80% (Good)
- 80-90% (Excellent)
- 90-100% (Outstanding)

### 5. Low Utilization Days Table

List of days with <60% utilization.

| Date | Utilization | Machines Down | Reason | Impact |
|------|-------------|---------------|--------|--------|
| Dec 25 | 42% | 4 of 6 | Holiday (Planned) | Low |
| Dec 16 | 56% | 2 of 6 | Power Outage | High |

### 6. Patterns & Insights

AI-driven patterns and recommendations.

---

## Main Actions

### Primary Actions

| Action | Location | Behavior |
|--------|----------|----------|
| Refresh Heatmap | Footer [Refresh Heatmap] | Reload utilization data |
| Export PNG | Footer [Export PNG] | Download heatmap image |
| Export CSV | Footer [Export CSV] | Download utilization data |
| Email Report | Footer [Email Report] | Email heatmap report |
| Set Alerts | Footer [Set Utilization Alerts] | Configure low utilization alerts |
| View Day Detail | Calendar cell click | Opens DayDetailModal |

---

## States

### Loading State
- Skeleton heatmap
- "Loading utilization heatmap..." text

### Empty State
- Calendar illustration
- "Insufficient Data for Heatmap" headline
- Minimum 30 days required

### Populated State (Success)
- Heatmap visible
- Machine matrix populated
- Distribution chart
- Low days table
- Insights displayed

### Error State
- Warning icon
- "Failed to Load Utilization Heatmap" headline
- Error code: HEATMAP_FETCH_FAILED

---

## Data Fields

### Heatmap Response

```json
{
  "overview": {
    "avg_utilization_pct": 78.4,
    "peak_utilization_pct": 96.2,
    "peak_date": "2026-01-15",
    "low_utilization_pct": 42.5,
    "low_date": "2025-12-25",
    "downtime_days": 8
  },
  "calendar_data": [
    {
      "date": "2025-12-15",
      "utilization_pct": 92,
      "machines_active": 6,
      "machines_total": 6,
      "level": "good"
    }
  ],
  "machine_matrix": [ ... ],
  "distribution": [ ... ],
  "low_days": [ ... ],
  "insights": { ... }
}
```

---

## API Endpoints

### Get Utilization Heatmap

```
GET /api/oee/utilization/heatmap
Query: ?period=90d&machines=all

Response: { ... }
```

### Get Day Detail

```
GET /api/oee/utilization/day/:date

Response: { ... }
```

---

## Permissions

| Role | View Heatmap | Export Data | Set Alerts |
|------|-------------|-------------|------------|
| Production Manager | Yes | Yes | Yes |
| Operator | Yes | No | No |
| Admin | Yes | Yes | Yes |

---

## Business Rules

### Utilization Calculation

```
Daily Utilization = (Total Running Time / Total Available Time) × 100

Example:
Available Time: 8 hours (480 minutes)
Running Time: 6.5 hours (390 minutes)
Utilization = (390 / 480) × 100 = 81.25%
```

### Utilization Levels

| Range | Level | Color | Action |
|-------|-------|-------|--------|
| >80% | Good | Dark Green | Maintain |
| 60-80% | Fair | Medium Green | Monitor |
| <60% | Poor | Light Gray | Investigate |

---

## Accessibility

### Touch Targets
- Calendar cells: 48x48dp
- Matrix cells: 48x48dp
- Buttons: 48x48dp

### Contrast
- Heatmap colors: 3:1
- Text: 4.5:1

### Screen Reader
- **Heatmap**: "Calendar heatmap showing 90 days of utilization data"
- **Cells**: "January 15, 2026, 96.2% utilization, Good level"

### Keyboard Navigation
| Key | Action |
|-----|--------|
| Arrow keys | Navigate calendar cells |
| Enter | View day details |
| Tab | Navigate controls |

---

## Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| **Desktop (>1024px)** | Full calendar, matrix visible |
| **Tablet (768-1024px)** | Scrollable calendar, condensed matrix |
| **Mobile (<768px)** | Single month view, simplified data |

---

## Performance Notes

### Caching

```typescript
'org:{orgId}:oee:heatmap:{period}'           // 15 min TTL
'org:{orgId}:oee:utilization:day:{date}'     // 1 hour TTL
```

### Load Time Targets

| Operation | Target |
|-----------|--------|
| Initial heatmap load | < 2s |
| Day detail load | < 500ms |

---

## Testing Requirements

### Unit Tests
```typescript
describe('Utilization Heatmap', () => {
  it('calculates daily utilization correctly', async () => {});
  it('categorizes utilization levels', async () => {});
  it('identifies patterns', async () => {});
});
```

---

## Quality Gates

- [x] All 4 states defined
- [x] Responsive breakpoints documented
- [x] All API endpoints specified
- [x] Accessibility checklist passed
- [x] Performance targets defined
- [x] Utilization calculations documented

---

**Status**: Ready for Implementation
**Approval Mode**: auto_approve
**Estimated Effort**: 10-12 hours
**Quality Target**: 95/100
**PRD Coverage**: 100% (OEE PRD Section 10.7)
