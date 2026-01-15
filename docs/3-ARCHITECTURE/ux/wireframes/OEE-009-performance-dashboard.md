# OEE-009: Performance Dashboard

**Module**: OEE (Overall Equipment Effectiveness)
**Feature**: Comprehensive OEE Performance KPIs (PRD Section 10.9)
**Status**: Ready for Implementation
**Last Updated**: 2026-01-15

---

## ASCII Wireframe

### Success State (Desktop - Performance Dashboard)

```
+--------------------------------------------------------------------------------------------------+
|  OEE > Performance Dashboard         Period: [Today v]  Shift: [All Shifts v]  [Auto-Refresh ✓] |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Executive Summary                                               Last Updated: 30 sec ago   |   |
|  |                                                                                            |   |
|  |  +--------------------+  +--------------------+  +--------------------+  +---------------+ |   |
|  |  | Overall OEE        |  | Plant Availability |  | Plant Performance  |  | Plant Quality | |   |
|  |  | 78.5%              |  | 87.2%              |  | 91.5%              |  | 98.4%         | |   |
|  |  | ▆▆▆▆▆▆▆▆░░         |  | ▆▆▆▆▆▆▆▆▆░         |  | ▆▆▆▆▆▆▆▆▆░         |  | ▆▆▆▆▆▆▆▆▆▆    | |   |
|  |  | Target: 85%        |  | Target: 90%        |  | Target: 95%        |  | Target: 99%   | |   |
|  |  | ▼ Below (6.5%)     |  | ▼ Below (2.8%)     |  | ▼ Below (3.5%)     |  | ▼ Below (0.6%)| |   |
|  |  +--------------------+  +--------------------+  +--------------------+  +---------------+ |   |
|  |                                                                                            |   |
|  |  +--------------------+  +--------------------+  +--------------------+  +---------------+ |   |
|  |  | Production Volume  |  | Throughput Rate    |  | Energy Efficiency  |  | Utilization   | |   |
|  |  | 12,450 units       |  | 1,556 u/hr         |  | 0.148 kWh/unit     |  | 82.4%         | |   |
|  |  | Target: 14,000     |  | Target: 1,750      |  | Target: 0.150      |  | Target: 85%   | |   |
|  |  | 89% of target      |  | 89% of target      |  | ✓ 1.3% better      |  | ▼ Below (2.6%)| |   |
|  |  +--------------------+  +--------------------+  +--------------------+  +---------------+ |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | OEE Scorecard                                                         [View Trend Chart]   |   |
|  +-------------------------------------------------------------------------------------------+   |
|  |                                                                                            |   |
|  | Machine           | OEE   | Avail | Perf  | Qual  | Status | Performance vs Target          |   |
|  | ---------------------------------------------------------------------------------          |   |
|  | Oven Line 1       | 89%   | 96%   | 95%   | 98%   | 🟢     | ████████████████▆ +4% Above ✓  |   |
|  |                   | ████████████████████                                                   |   |
|  | ---------------------------------------------------------------------------------          |   |
|  | Mixer Line 1      | 82%   | 92%   | 95%   | 94%   | 🟢     | █████████████████░ -3% Below   |   |
|  |                   | █████████████████                                                      |   |
|  | ---------------------------------------------------------------------------------          |   |
|  | Packaging Line 1  | 64%   | 75%   | 92%   | 98%   | 🟢     | ████████████░░░░░ -21% Below⚠️ |   |
|  |                   | █████████████                                                          |   |
|  | ---------------------------------------------------------------------------------          |   |
|  | Proofer Line 1    | 76%   | 88%   | 92%   | 94%   | 🟢     | ████████████████░ -9% Below    |   |
|  |                   | ████████████████                                                       |   |
|  | ---------------------------------------------------------------------------------          |   |
|  | Cooling Conveyor  | 80%   | 90%   | 92%   | 97%   | 🟢     | █████████████████░ -5% Below   |   |
|  |                   | █████████████████                                                      |   |
|  | ---------------------------------------------------------------------------------          |   |
|  | Slicer Line 1     | 0%    | 0%    | 0%    | 0%    | 🔴     | Down (2h 15m)                   |   |
|  |                   | Reason: Mechanical Breakdown                                           |   |
|  |                                                                                            |   |
|  | Plant Average: 78.5% | Best: Oven Line 1 (89%) | Worst: Packaging Line 1 (64%)           |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +------------------------------------------+  +-------------------------------------------+    |
|  | Production Performance                   |  | Quality Performance                       |    |
|  |                                          |  |                                           |    |
|  | Total Output: 12,450 units               |  | Good Output: 12,250 units                 |    |
|  | Planned: 14,000 units                    |  | Rejected: 200 units                       |    |
|  | Achievement: 89%                         |  | Quality Rate: 98.4%                       |    |
|  |                                          |  | Target: 99%                               |    |
|  | Units/Hour by Machine:                   |  |                                           |    |
|  | Oven 1:      297 u/hr (Target: 300)      |  | Rejection Rate by Machine:                |    |
|  | Mixer 1:     262 u/hr (Target: 275)      |  | Oven 1:      2.0% ✓ On Target             |    |
|  | Packaging 1: 475 u/hr (Target: 600)      |  | Mixer 1:     6.0% ⚠️ High (Avg: 2%)       |    |
|  | Proofer 1:   234 u/hr (Target: 250)      |  | Packaging 1: 2.0% ✓ On Target             |    |
|  | Cooling:     287 u/hr (Target: 325)      |  | Proofer 1:   6.0% ⚠️ High (Avg: 2%)       |    |
|  |                                          |  |                                           |    |
|  | Top Performer: Oven 1 (99% of target)    |  | Top 3 Rejection Reasons:                  |    |
|  | Underperformer: Packaging 1 (79%)        |  | 1. Size variance (48%)                    |    |
|  |                                          |  | 2. Visual defects (32%)                   |    |
|  |                                          |  | 3. Weight variance (20%)                  |    |
|  +------------------------------------------+  +-------------------------------------------+    |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Downtime Analysis                                                      [View Pareto Chart]  |   |
|  |                                                                                            |   |
|  | Total Downtime: 2h 47m (5.8% of shift) | Events: 12 | MTTR: 13.9 min                     |   |
|  |                                                                                            |   |
|  | By Category:                                                                               |   |
|  | Equipment Failure:  68m (41%) ████████████████████████                                    |   |
|  | Planned Downtime:   45m (27%) ███████████████                                             |   |
|  | Material Issue:     32m (19%) ██████████                                                  |   |
|  | Process Issue:      22m (13%) ███████                                                     |   |
|  |                                                                                            |   |
|  | Top 3 Reasons:                                                                             |   |
|  | 1. Mechanical Breakdown: 48m (28%) - Packaging Line 1                                     |   |
|  | 2. Changeover: 25m (15%) - Multiple machines                                              |   |
|  | 3. Waiting for Material: 20m (12%) - Packaging Line 1                                     |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +------------------------------------------+  +-------------------------------------------+    |
|  | Performance Alerts (Active)              |  | Improvement Opportunities                 |    |
|  |                                          |  |                                           |    |
|  | 🔴 HIGH: Packaging Line 1                |  | 💡 Recommendations:                       |    |
|  |   OEE 64% (21% below target)             |  |                                           |    |
|  |   Action: Root cause analysis required   |  | 1. Packaging Line 1: Preventive maint     |    |
|  |                                          |  |    Expected: +8% availability              |    |
|  | 🟡 MEDIUM: Mixer Line 1                  |  |                                           |    |
|  |   Rejection rate 6% (3x normal)          |  | 2. Mixer Line 1: Quality investigation    |    |
|  |   Action: Quality investigation          |  |    Expected: +4% quality, -4% rejection   |    |
|  |                                          |  |                                           |    |
|  | 🟡 MEDIUM: Proofer Line 1                |  | 3. Overall throughput: Operator training  |    |
|  |   OEE 76% (9% below target)              |  |    Expected: +3% performance               |    |
|  |   Action: Performance review             |  |                                           |    |
|  |                                          |  | Total Potential: +12% OEE improvement     |    |
|  | [View All Alerts (5)]                    |  | [Create Improvement Plan]                 |    |
|  +------------------------------------------+  +-------------------------------------------+    |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Shift Comparison                                                                           |   |
|  |                                                                                            |   |
|  | Shift         | OEE   | Avail | Perf  | Qual  | Production | Downtime | Performance       |   |
|  | ---------------------------------------------------------------------------------          |   |
|  | Day Shift     | 78.5% | 86.2% | 90.5% | 98.2% | 12,450 u   | 1h 24m   | Best              |   |
|  | Evening Shift | 76.2% | 83.8% | 88.4% | 97.8% | 11,820 u   | 1h 48m   | -2.3% vs Day      |   |
|  | Night Shift   | 74.8% | 82.5% | 87.2% | 97.2% | 10,580 u   | 2h 12m   | -3.7% vs Day      |   |
|  |                                                                                            |   |
|  | Gap Analysis: Night Shift 3.7% below Day Shift → Training opportunity                    |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  [Export PDF] [Export CSV] [Email Report] [Schedule Review] [Configure Alerts]  [Refresh]       |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Success State (Mobile: < 768px)

```
+----------------------------------+
|  < Performance Dashboard         |
|  [Today v] [Auto ✓]              |
+----------------------------------+
|                                  |
|  Summary                         |
|  +----------------------------+  |
|  | OEE: 78.5% (▼ -6.5%)       |  |
|  | Avail: 87.2% | Perf: 91.5% |  |
|  | Quality: 98.4%             |  |
|  +----------------------------+  |
|  +----------------------------+  |
|  | Production: 12,450 units   |  |
|  | Target: 14,000 (89%)       |  |
|  | Throughput: 1,556 u/hr     |  |
|  | Utilization: 82.4%         |  |
|  +----------------------------+  |
|                                  |
|  Machines (6)                    |
|  +----------------------------+  |
|  | Oven Line 1                |  |
|  | OEE: 89% ✓ +4% Above       |  |
|  | A:96% P:95% Q:98%          |  |
|  +----------------------------+  |
|  | Packaging Line 1 ⚠️        |  |
|  | OEE: 64% ▼ -21% Below      |  |
|  | A:75% P:92% Q:98%          |  |
|  +----------------------------+  |
|  | [View All (6)]             |  |
|                                  |
|  Downtime: 2h 47m (12 events)    |
|  +----------------------------+  |
|  | Equip Failure: 68m (41%)   |  |
|  | Planned: 45m (27%)         |  |
|  | Material: 32m (19%)        |  |
|  +----------------------------+  |
|                                  |
|  Alerts (3)                      |
|  +----------------------------+  |
|  | 🔴 Packaging 1: -21% OEE   |  |
|  | 🟡 Mixer 1: 6% rejection   |  |
|  | [View All]                 |  |
|  +----------------------------+  |
|                                  |
|  [Export] [Refresh]              |
|                                  |
+----------------------------------+
```

### Loading / Empty / Error States

```
Loading:
+--------------------------------------------------------------------------------------------------+
|  OEE > Performance Dashboard         Period: [Today v]  Shift: [All Shifts v]  [Auto-Refresh ✓] |
+--------------------------------------------------------------------------------------------------+
|  [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]        |
|  Loading performance dashboard...                                                                |
+--------------------------------------------------------------------------------------------------+

Empty:
+--------------------------------------------------------------------------------------------------+
|  OEE > Performance Dashboard         Period: [Today v]  Shift: [All Shifts v]  [Auto-Refresh ✓] |
+--------------------------------------------------------------------------------------------------+
|                                         [Dashboard Icon]                                         |
|                              No Performance Data Available                                       |
|                     No production data for selected period and shift.                            |
|                                    [View Real-Time Monitor]                                      |
+--------------------------------------------------------------------------------------------------+

Error:
+--------------------------------------------------------------------------------------------------+
|  OEE > Performance Dashboard         Period: [Today v]  Shift: [All Shifts v]  [Auto-Refresh ✓] |
+--------------------------------------------------------------------------------------------------+
|                                         [Warning Icon]                                           |
|                               Failed to Load Performance Dashboard                               |
|                     Unable to retrieve performance data.                                         |
|                                Error: PERFORMANCE_DASHBOARD_FETCH_FAILED                         |
|                                  [Retry]    [Contact Support]                                    |
+--------------------------------------------------------------------------------------------------+
```

---

## Key Components

### 1. Executive Summary (8 KPI Cards)

Top-level performance metrics.

| KPI | Calculation | Display | Target |
|-----|-------------|---------|--------|
| Overall OEE | AVG(machine OEE) | "78.5%" | 85% |
| Availability | AVG(machine availability) | "87.2%" | 90% |
| Performance | AVG(machine performance) | "91.5%" | 95% |
| Quality | AVG(machine quality) | "98.4%" | 99% |
| Production Volume | SUM(output) | "12,450 units" | 14,000 |
| Throughput Rate | Total output / shift hours | "1,556 u/hr" | 1,750 |
| Energy Efficiency | Total kWh / Total units | "0.148 kWh/unit" | 0.150 |
| Utilization | Running time / Available time | "82.4%" | 85% |

### 2. OEE Scorecard Table

Machine-level OEE components with performance bars.

| Column | Display |
|--------|---------|
| Machine | Machine name |
| OEE | Overall equipment effectiveness % |
| Avail | Availability % |
| Perf | Performance % |
| Qual | Quality % |
| Status | 🟢 Running / 🔴 Down / 🟡 Idle |
| Performance vs Target | Bar chart + variance % |

**Alerts:**
- ⚠️ >10% below target
- ✓ Above target

### 3. Production Performance Panel

Production output analysis.

- Total Output vs Planned
- Units/Hour by Machine
- Top Performer / Underperformer
- Achievement percentage

### 4. Quality Performance Panel

Quality metrics breakdown.

- Good Output count
- Rejection count and rate
- Quality rate by machine
- Top rejection reasons

### 5. Downtime Analysis Panel

Downtime breakdown with Pareto link.

- Total downtime
- MTTR
- By category (bar chart)
- Top 3 reasons

### 6. Performance Alerts Panel

Active alerts requiring attention.

**Alert Levels:**
- 🔴 HIGH: >10% gap to target
- 🟡 MEDIUM: 5-10% gap to target
- 🟢 LOW: <5% gap

### 7. Improvement Opportunities Panel

AI-driven recommendations.

- Specific improvement actions
- Expected impact (% improvement)
- Total potential improvement

### 8. Shift Comparison Table

Shift-level performance comparison.

---

## Main Actions

### Primary Actions

| Action | Location | Behavior |
|--------|----------|----------|
| Refresh Dashboard | Footer [Refresh] | Reload all performance data |
| Export PDF | Footer [Export PDF] | Generate comprehensive report |
| Export CSV | Footer [Export CSV] | Download all KPIs to CSV |
| Email Report | Footer [Email Report] | Email performance report |
| Schedule Review | Footer [Schedule Review] | Create meeting for review |
| Configure Alerts | Footer [Configure Alerts] | Set alert thresholds |
| Auto-Refresh Toggle | Header [Auto-Refresh ✓] | Enable/disable auto-refresh |

---

## States

All 4 states defined (Loading, Empty, Success, Error) as shown above.

---

## Data Fields

### Performance Dashboard Response

```json
{
  "summary": {
    "oee_pct": 78.5,
    "availability_pct": 87.2,
    "performance_pct": 91.5,
    "quality_pct": 98.4,
    "production_volume": 12450,
    "production_target": 14000,
    "throughput_rate": 1556,
    "energy_efficiency": 0.148,
    "utilization_pct": 82.4
  },
  "machines": [ ... ],
  "production": { ... },
  "quality": { ... },
  "downtime": { ... },
  "alerts": [ ... ],
  "recommendations": [ ... ],
  "shifts": [ ... ]
}
```

---

## API Endpoints

### Get Performance Dashboard

```
GET /api/oee/dashboard/performance
Query: ?period=today&shift=all

Response: { ... }
```

---

## Permissions

| Role | View Dashboard | Export Data | Configure Alerts |
|------|---------------|-------------|------------------|
| Production Manager | Yes | Yes | Yes |
| Operator | Yes | No | No |
| Admin | Yes | Yes | Yes |

---

## Business Rules

### Performance Variance Levels

| Variance | Level | Action |
|----------|-------|--------|
| >10% below target | 🔴 HIGH | Immediate action required |
| 5-10% below target | 🟡 MEDIUM | Monitor and investigate |
| <5% variance | 🟢 LOW | Normal operation |
| Above target | ✓ | Maintain performance |

---

## Accessibility

All standard accessibility requirements (4.5:1 contrast, 48dp touch targets, ARIA labels, keyboard navigation) apply.

---

## Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| **Desktop (>1024px)** | Full dashboard, all panels visible |
| **Tablet (768-1024px)** | Condensed panels, scrollable |
| **Mobile (<768px)** | Simplified cards, essential KPIs only |

---

## Performance Notes

### Caching

```typescript
'org:{orgId}:oee:performance:{period}:{shift}'   // 2 min TTL
```

### Load Time Targets

| Operation | Target |
|-----------|--------|
| Initial dashboard load | < 2s |
| Auto-refresh | < 500ms |

---

## Testing Requirements

### Unit Tests
```typescript
describe('Performance Dashboard', () => {
  it('calculates all KPIs correctly', async () => {});
  it('identifies performance alerts', async () => {});
  it('generates recommendations', async () => {});
});
```

---

## Quality Gates

- [x] All 4 states defined
- [x] Responsive breakpoints documented
- [x] All API endpoints specified
- [x] Accessibility checklist passed
- [x] Performance targets defined
- [x] 8 KPIs defined and calculated
- [x] Alert thresholds documented

---

**Status**: Ready for Implementation
**Approval Mode**: auto_approve
**Estimated Effort**: 14-16 hours
**Quality Target**: 95/100
**PRD Coverage**: 100% (OEE PRD Section 10.9)
