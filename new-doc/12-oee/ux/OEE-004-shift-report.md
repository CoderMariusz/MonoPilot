# OEE-004: Shift Report

**Module**: OEE (Overall Equipment Effectiveness)
**Feature**: Shift Performance Report & Approval (PRD Section 10.4)
**Status**: Ready for Implementation
**Last Updated**: 2026-01-15

---

## ASCII Wireframe

### Success State (Desktop - Report View)

```
+--------------------------------------------------------------------------------------------------+
|  OEE > Shift Report                      Date: [2026-01-15 v]  Shift: [Day Shift v]  [Download] |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Shift Summary: Day Shift (6:00 AM - 2:00 PM)                            Status: ⏳ Draft  |   |
|  |                                                                                            |   |
|  | Supervisor: John Smith                           |  Report Generated: 2:15 PM            |   |
|  | Production Lines Active: 5 of 6                  |  Report Period: 8 hours               |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Key Performance Indicators                                                                 |   |
|  |                                                                                            |   |
|  |  +--------------------+  +--------------------+  +--------------------+  +---------------+ |   |
|  |  | Overall OEE        |  | Availability       |  | Performance        |  | Quality       | |   |
|  |  | 78.5%              |  | 87.2%              |  | 91.5%              |  | 98.4%         | |   |
|  |  | ▆▆▆▆▆▆▆▆░░         |  | ▆▆▆▆▆▆▆▆▆░         |  | ▆▆▆▆▆▆▆▆▆░         |  | ▆▆▆▆▆▆▆▆▆▆    | |   |
|  |  | Target: 85%        |  | Target: 90%        |  | Target: 95%        |  | Target: 99%   | |   |
|  |  | ▼ Below (6.5%)     |  | ▼ Below (2.8%)     |  | ▼ Below (3.5%)     |  | ▼ Below (0.6%)| |   |
|  |  +--------------------+  +--------------------+  +--------------------+  +---------------+ |   |
|  |                                                                                            |   |
|  |  +--------------------+  +--------------------+  +--------------------+  +---------------+ |   |
|  |  | Total Production   |  | Good Output        |  | Rejected Output    |  | Downtime      | |   |
|  |  | 12,450 units       |  | 12,250 units       |  | 200 units (1.6%)   |  | 2h 47m        | |   |
|  |  | Across 5 lines     |  | Quality: 98.4%     |  | ⚠️ Above avg (1%)  |  | 12 events     | |   |
|  |  +--------------------+  +--------------------+  +--------------------+  +---------------+ |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Machine Performance                                                   [Expand All] [Export] |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  ┌──────────────────────────────────────────────────────────────────────────────────────────┐  |
|  │ Mixer Line 1                                                     OEE: 82%  [▼] [Details] │  |
|  ├──────────────────────────────────────────────────────────────────────────────────────────┤  |
|  │ Work Order: WO-2026-00142 (Organic Sourdough) | Running: 7h 45m | Downtime: 15m (3%)     │  |
|  │                                                                                            │  |
|  │ Availability: 92% ▆▆▆▆▆▆▆▆▆░ | Performance: 95% ▆▆▆▆▆▆▆▆▆░ | Quality: 94% ▆▆▆▆▆▆▆▆▆░  │  |
|  │                                                                                            │  |
|  │ Production: 2,100 units (Target: 2,200) | Good: 1,974 units | Rejected: 126 units (6%)   │  |
|  │ Downtime Events: 2 events                                                                 │  |
|  │   - 8:15-8:20 (5m): Changeover (Planned)                                                  │  |
|  │   - 12:30-12:40 (10m): Minor Jam (Unplanned)                                              │  |
|  └──────────────────────────────────────────────────────────────────────────────────────────┘  |
|                                                                                                  |
|  ┌──────────────────────────────────────────────────────────────────────────────────────────┐  |
|  │ Oven Line 1                                                      OEE: 89%  [▼] [Details] │  |
|  ├──────────────────────────────────────────────────────────────────────────────────────────┤  |
|  │ Work Order: WO-2026-00138 (Premium Burger) | Running: 7h 48m | Downtime: 12m (2.5%)      │  |
|  │                                                                                            │  |
|  │ Availability: 96% ▆▆▆▆▆▆▆▆▆▆ | Performance: 95% ▆▆▆▆▆▆▆▆▆░ | Quality: 98% ▆▆▆▆▆▆▆▆▆▆  │  |
|  │                                                                                            │  |
|  │ Production: 2,375 units (Target: 2,400) | Good: 2,327 units | Rejected: 48 units (2%)    │  |
|  │ Downtime Events: 3 events                                                                 │  |
|  │   - 8:15-8:20 (5m): Changeover (Planned)                                                  │  |
|  │   - 10:32-10:36 (4m): Minor Jam (Unplanned)                                               │  |
|  │   - 11:48-11:51 (3m): Quality Check Hold (Unplanned)                                      │  |
|  └──────────────────────────────────────────────────────────────────────────────────────────┘  |
|                                                                                                  |
|  ┌──────────────────────────────────────────────────────────────────────────────────────────┐  |
|  │ Packaging Line 1                                                 OEE: 64%  [▼] [Details] │  |
|  ├──────────────────────────────────────────────────────────────────────────────────────────┤  |
|  │ Work Order: WO-2026-00145 (Vegan Nuggets) | Running: 6h 52m | Downtime: 1h 8m (14%)      │  |
|  │ ⚠️ OEE Below Target (21% gap)                                                             │  |
|  │                                                                                            │  |
|  │ Availability: 75% ▆▆▆▆▆▆▆░░░ | Performance: 92% ▆▆▆▆▆▆▆▆▆░ | Quality: 98% ▆▆▆▆▆▆▆▆▆▆  │  |
|  │                                                                                            │  |
|  │ Production: 3,800 units (Target: 4,200) | Good: 3,724 units | Rejected: 76 units (2%)    │  |
|  │ Downtime Events: 2 events (⚠️ 1 critical)                                                 │  |
|  │   - 9:15-10:03 (48m): Mechanical Breakdown (Unplanned) ⚠️ CRITICAL                        │  |
|  │   - 12:30-12:50 (20m): Waiting for Material (Unplanned)                                   │  |
|  └──────────────────────────────────────────────────────────────────────────────────────────┘  |
|                                                                                                  |
|  (2 more machines collapsed)                                                   [Expand All]      |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Downtime Analysis                                                                          |   |
|  |                                                                                            |   |
|  | Total Downtime: 2h 47m (5.8% of shift)  |  MTTR: 13.9 minutes  |  12 events total         |   |
|  |                                                                                            |   |
|  | By Category:                                                                               |   |
|  | ■■■■■■■■■■■■ Equipment Failure:  68m (41%)  - 3 events                                    |   |
|  | ■■■■■■■     Planned:             45m (27%)  - 5 events (Changeover, Cleaning)              |   |
|  | ■■■■■       Material Issue:      32m (19%)  - 2 events                                    |   |
|  | ■■■         Process Issue:       22m (13%)  - 2 events                                    |   |
|  |                                                                                            |   |
|  | Top 3 Reasons:                                                                             |   |
|  | 1. Mechanical Breakdown: 48m (28%)                                                         |   |
|  | 2. Changeover: 25m (15%)                                                                   |   |
|  | 3. Waiting for Material: 20m (12%)                                                         |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Shift Notes & Issues                                                                       |   |
|  |                                                                                            |   |
|  | ⚠️ Critical Issues (1):                                                                    |   |
|  | - Packaging Line 1: 48-minute mechanical breakdown (conveyor motor failure)                |   |
|  |   Resolution: Motor replaced, production resumed at 10:03 AM                               |   |
|  |   Follow-up: Schedule preventive maintenance for remaining motors                          |   |
|  |                                                                                            |   |
|  | ℹ️ Notes:                                                                                  |   |
|  | - Higher than normal rejection rate on Mixer Line 1 (6% vs avg 2%)                         |   |
|  | - Packaging Line 1 material delay due to warehouse backlog                                 |   |
|  | - Overall shift performance below target due to extended mechanical breakdown               |   |
|  |                                                                                            |   |
|  | Recommendations:                                                                           |   |
|  | - Investigate Mixer Line 1 quality issue (high rejection rate)                             |   |
|  | - Implement spare motor inventory to reduce mechanical breakdown impact                    |   |
|  | - Coordinate with warehouse to prevent material delays                                     |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Supervisor Approval                                                                        |   |
|  |                                                                                            |   |
|  | Report Status: ⏳ Draft (not approved)                                                     |   |
|  |                                                                                            |   |
|  | Supervisor Comments:                                                                       |   |
|  | +--------------------------------------------------------------------------+               |   |
|  | | Shift overall performance impacted by Packaging Line 1 mechanical      |               |   |
|  | | breakdown. Team responded well to the emergency repair. Recommend       |               |   |
|  | | implementing preventive maintenance schedule for all critical motors.   |               |   |
|  | +--------------------------------------------------------------------------+               |   |
|  |                                                                                            |   |
|  | [✓] Report data is accurate and complete                                                  |   |
|  | [✓] All downtime events have been logged and reviewed                                     |   |
|  | [✓] Issues and recommendations documented                                                 |   |
|  |                                                                                            |   |
|  | Signature: _________________________  Date: _____________                                  |   |
|  |                                                                                            |   |
|  | [ ] Approve and Lock Report     [ ] Send for Review     [ ] Save Draft                    |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  [Export PDF] [Export CSV] [Email Report] [Print]                              [Approve Report] |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### PDF Export Preview

```
+--------------------------------------------------------------------------------------------------+
|  Shift Performance Report                                                                        |
|  MonoPilot Manufacturing Execution System                                                        |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  Date: January 15, 2026                                Report ID: SR-2026-01-15-DAY              |
|  Shift: Day Shift (6:00 AM - 2:00 PM)                  Generated: 2:15 PM                        |
|  Supervisor: John Smith                                 Status: ✓ Approved                       |
|                                                                                                  |
|  =============================================================================================   |
|                                                                                                  |
|  SHIFT SUMMARY                                                                                   |
|                                                                                                  |
|  Overall OEE:        78.5%  (Target: 85%, Gap: -6.5%)                                            |
|  Availability:       87.2%  (Target: 90%, Gap: -2.8%)                                            |
|  Performance:        91.5%  (Target: 95%, Gap: -3.5%)                                            |
|  Quality:            98.4%  (Target: 99%, Gap: -0.6%)                                            |
|                                                                                                  |
|  Total Production:   12,450 units across 5 active lines                                          |
|  Good Output:        12,250 units (98.4% quality rate)                                           |
|  Rejected Output:    200 units (1.6%)                                                            |
|  Total Downtime:     2h 47m (5.8% of shift, 12 events, MTTR: 13.9 min)                           |
|                                                                                                  |
|  =============================================================================================   |
|                                                                                                  |
|  MACHINE PERFORMANCE                                                                             |
|                                                                                                  |
|  Machine       | WO Number   | OEE  | Avail | Perf | Qual | Production | Downtime | Events      |
|  ------------- | ----------- | ---- | ----- | ---- | ---- | ---------- | -------- | -------     |
|  Mixer Line 1  | WO-00142    | 82%  | 92%   | 95%  | 94%  | 2,100/2,200| 15m (3%) | 2           |
|  Oven Line 1   | WO-00138    | 89%  | 96%   | 95%  | 98%  | 2,375/2,400| 12m (2%) | 3           |
|  Packaging 1   | WO-00145    | 64%  | 75%   | 92%  | 98%  | 3,800/4,200| 68m (14%)| 2 (1 crit)  |
|  Proofer 1     | WO-00140    | 76%  | 88%   | 92%  | 94%  | 1,875/2,000| 18m (4%) | 2           |
|  Conveyor 1    | WO-00142    | 80%  | 90%   | 92%  | 97%  | 2,300/2,500| 12m (2%) | 3           |
|                                                                                                  |
|  =============================================================================================   |
|                                                                                                  |
|  DOWNTIME ANALYSIS                                                                               |
|                                                                                                  |
|  By Category:                                                                                    |
|    Equipment Failure:  68m (41%) - 3 events                                                      |
|    Planned Downtime:   45m (27%) - 5 events                                                      |
|    Material Issue:     32m (19%) - 2 events                                                      |
|    Process Issue:      22m (13%) - 2 events                                                      |
|                                                                                                  |
|  Top Downtime Reasons:                                                                           |
|    1. Mechanical Breakdown: 48m (28%)                                                            |
|    2. Changeover: 25m (15%)                                                                      |
|    3. Waiting for Material: 20m (12%)                                                            |
|                                                                                                  |
|  Critical Events:                                                                                |
|    - Packaging Line 1: 48-minute mechanical breakdown (9:15-10:03 AM)                            |
|      Reason: Conveyor motor failure                                                              |
|      Resolution: Motor replaced, production resumed                                              |
|                                                                                                  |
|  =============================================================================================   |
|                                                                                                  |
|  ISSUES & RECOMMENDATIONS                                                                        |
|                                                                                                  |
|  Critical Issues:                                                                                |
|    - Packaging Line 1 mechanical breakdown caused 11% availability loss                          |
|                                                                                                  |
|  Quality Concerns:                                                                               |
|    - Mixer Line 1 rejection rate 6% (3x normal average)                                          |
|                                                                                                  |
|  Recommendations:                                                                                |
|    - Investigate Mixer Line 1 quality issue root cause                                           |
|    - Implement spare motor inventory for critical equipment                                      |
|    - Schedule preventive maintenance for all conveyor motors                                     |
|    - Coordinate with warehouse to prevent material delays                                        |
|                                                                                                  |
|  =============================================================================================   |
|                                                                                                  |
|  APPROVAL                                                                                        |
|                                                                                                  |
|  Supervisor Comments:                                                                            |
|  "Shift overall performance impacted by Packaging Line 1 mechanical breakdown.                   |
|   Team responded well to the emergency repair. Recommend implementing preventive                 |
|   maintenance schedule for all critical motors."                                                 |
|                                                                                                  |
|  Approved By: John Smith                                                                         |
|  Signature: _John Smith_                           Date: January 15, 2026 2:30 PM                |
|                                                                                                  |
|  =============================================================================================   |
|                                                                                                  |
|  Report generated by MonoPilot MES | Page 1 of 1                                                 |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Success State (Mobile: < 768px)

```
+----------------------------------+
|  < Shift Report                  |
|  [2026-01-15 v] [Day v]          |
+----------------------------------+
|                                  |
|  Summary                         |
|  Status: ⏳ Draft                |
|  Supervisor: John Smith          |
|                                  |
|  KPIs                            |
|  +----------------------------+  |
|  | OEE: 78.5% (Target: 85%)   |  |
|  | ▆▆▆▆▆▆▆▆░░ ▼ Below 6.5%    |  |
|  +----------------------------+  |
|  +----------------------------+  |
|  | Availability: 87.2%        |  |
|  | Performance: 91.5%         |  |
|  | Quality: 98.4%             |  |
|  +----------------------------+  |
|  +----------------------------+  |
|  | Production: 12,450 units   |  |
|  | Good: 12,250 (98.4%)       |  |
|  | Rejected: 200 (1.6%)       |  |
|  | Downtime: 2h 47m (12 ev)   |  |
|  +----------------------------+  |
|                                  |
|  Machines (5)                    |
|  +----------------------------+  |
|  | Mixer Line 1               |  |
|  | OEE: 82% | WO-00142        |  |
|  | A:92% P:95% Q:94%          |  |
|  | Prod: 2,100/2,200 units    |  |
|  | Downtime: 15m (2 events)   |  |
|  | [Details]                  |  |
|  +----------------------------+  |
|  | Packaging Line 1 ⚠️        |  |
|  | OEE: 64% | WO-00145        |  |
|  | A:75% P:92% Q:98%          |  |
|  | Prod: 3,800/4,200 units    |  |
|  | Downtime: 68m (2 events)   |  |
|  | [Details]                  |  |
|  +----------------------------+  |
|  | [View All (5)]             |  |
|                                  |
|  Downtime (2h 47m)               |
|  +----------------------------+  |
|  | Equipment Failure: 68m     |  |
|  | Planned: 45m               |  |
|  | Material Issue: 32m        |  |
|  | Process Issue: 22m         |  |
|  +----------------------------+  |
|                                  |
|  Issues                          |
|  +----------------------------+  |
|  | ⚠️ Packaging 1: 48m break  |  |
|  | Motor failure (9:15-10:03) |  |
|  +----------------------------+  |
|                                  |
|  [Approve] [Download] [Email]    |
|                                  |
+----------------------------------+
```

### Loading State

```
+--------------------------------------------------------------------------------------------------+
|  OEE > Shift Report                      Date: [2026-01-15 v]  Shift: [Day Shift v]  [Download] |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]           |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]        |
|                                                                                                  |
|  Loading shift report...                                                                         |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Empty State

```
+--------------------------------------------------------------------------------------------------+
|  OEE > Shift Report                      Date: [2026-01-15 v]  Shift: [Day Shift v]  [Download] |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|                                                                                                  |
|                                         [Report Icon]                                            |
|                                                                                                  |
|                                  No Data for Selected Shift                                      |
|                                                                                                  |
|                     No production data available for this date and shift.                        |
|                     Select a different shift with active production.                             |
|                                                                                                  |
|                                                                                                  |
|                                                                                                  |
|                     Available Shifts:                                                            |
|                     - Day Shift: Data available for Jan 14, 2026                                 |
|                     - Evening Shift: Data available for Jan 15, 2026                             |
|                                                                                                  |
|                              [View Available Shifts]                                             |
|                                                                                                  |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Error State

```
+--------------------------------------------------------------------------------------------------+
|  OEE > Shift Report                      Date: [2026-01-15 v]  Shift: [Day Shift v]  [Download] |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|                                                                                                  |
|                                         [Warning Icon]                                           |
|                                                                                                  |
|                               Failed to Load Shift Report                                        |
|                                                                                                  |
|                     Unable to retrieve shift performance data.                                   |
|                     Please check your connection and try again.                                  |
|                                                                                                  |
|                                Error: SHIFT_REPORT_FETCH_FAILED                                  |
|                                                                                                  |
|                                                                                                  |
|                                  [Retry]    [Contact Support]                                    |
|                                                                                                  |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

---

## Key Components

### 1. Shift Summary Header

Shift identification and status.

| Field | Source | Display |
|-------|--------|---------|
| Date | Date selector | "January 15, 2026" |
| Shift | Shift selector | "Day Shift (6:00 AM - 2:00 PM)" |
| Supervisor | Current user or assigned | "John Smith" |
| Report Status | report_status | ⏳ Draft / ✓ Approved / 📧 Sent for Review |
| Report Generated | Auto-timestamp | "2:15 PM" |
| Report Period | Shift duration | "8 hours" |
| Production Lines Active | Count active | "5 of 6" |

### 2. Key Performance Indicators

Shift-level OEE metrics.

| KPI | Calculation | Display | Target Comparison |
|-----|-------------|---------|-------------------|
| Overall OEE | AVG(machine OEE) | "78.5%" | ▼ Below target by 6.5% |
| Availability | AVG(machine availability) | "87.2%" | ▼ Below target by 2.8% |
| Performance | AVG(machine performance) | "91.5%" | ▼ Below target by 3.5% |
| Quality | AVG(machine quality) | "98.4%" | ▼ Below target by 0.6% |
| Total Production | SUM(machine output) | "12,450 units" | Across X lines |
| Good Output | SUM(good units) | "12,250 units" | Quality % |
| Rejected Output | SUM(rejected units) | "200 units (1.6%)" | Above/below avg |
| Total Downtime | SUM(downtime minutes) | "2h 47m" | X events |

### 3. Machine Performance Cards

Individual machine performance breakdown.

| Field | Source | Display |
|-------|--------|---------|
| Machine Name | machines.name | "Mixer Line 1" |
| OEE | Calculated | "82%" |
| Work Order | work_orders.number | "WO-2026-00142" |
| Product | products.name | "Organic Sourdough" |
| Running Time | Elapsed time | "7h 45m" |
| Downtime | Total downtime | "15m (3%)" |
| Availability | Calculated | "92%" with progress bar |
| Performance | Calculated | "95%" with progress bar |
| Quality | Calculated | "94%" with progress bar |
| Production | Actual vs target | "2,100 units (Target: 2,200)" |
| Good Output | Good units | "1,974 units" |
| Rejected Output | Rejected units | "126 units (6%)" |
| Downtime Events | List of events | "2 events" with details |

**Alerts:**
- OEE Below Target: ⚠️ badge + percentage gap
- Critical Events: ⚠️ CRITICAL label

### 4. Downtime Analysis

Shift downtime breakdown and analysis.

| Metric | Calculation | Display |
|--------|-------------|---------|
| Total Downtime | SUM(event durations) | "2h 47m (5.8% of shift)" |
| MTTR | AVG(event durations) | "13.9 minutes" |
| Event Count | COUNT(events) | "12 events total" |
| By Category | GROUP BY category | Horizontal bar chart |
| Top 3 Reasons | ORDER BY duration DESC LIMIT 3 | List with percentages |

**Category Breakdown:**
- Equipment Failure (red)
- Planned Downtime (blue)
- Material Issue (yellow)
- Process Issue (orange)

### 5. Shift Notes & Issues

Supervisor observations and recommendations.

| Section | Content |
|---------|---------|
| Critical Issues | List of critical events (>30 min) with resolutions |
| Notes | General observations, quality issues, material delays |
| Recommendations | Action items for improvement |

### 6. Supervisor Approval

Report approval workflow.

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Supervisor Comments | Textarea | Yes | Min 50 chars |
| Data Accuracy Checkbox | Checkbox | Yes | Must check |
| Events Reviewed Checkbox | Checkbox | Yes | Must check |
| Issues Documented Checkbox | Checkbox | Yes | Must check |
| Signature | Text or e-signature | Yes | User name |
| Approval Date | Auto-timestamp | Yes | Current date/time |

**Actions:**
- [Approve and Lock Report]: Finalize report, prevent edits
- [Send for Review]: Notify manager for approval
- [Save Draft]: Save without approval

---

## Main Actions

### Primary Actions

| Action | Location | Behavior |
|--------|----------|----------|
| Download PDF | Header [Download] | Generate and download PDF report |
| Approve Report | Footer [Approve Report] | Lock report, change status to Approved |
| Export PDF | Footer [Export PDF] | Generate PDF with all sections |
| Export CSV | Footer [Export CSV] | Export machine data to CSV |
| Email Report | Footer [Email Report] | Email PDF to recipients |
| Print | Footer [Print] | Print-friendly version |

### Machine Actions

| Action | Behavior |
|--------|----------|
| Expand Machine | Show detailed machine breakdown |
| View Details | Navigate to machine detail page |
| Expand All | Expand all machine cards |

---

## States

### Loading State
- Skeleton report sections
- "Loading shift report..." text

### Empty State
- Report illustration
- "No Data for Selected Shift" headline
- List of available shifts with data
- [View Available Shifts] link

### Populated State (Success)
- All report sections visible
- KPIs populated
- Machine cards listed
- Downtime analysis chart
- Approval section at bottom

### Error State
- Warning icon
- "Failed to Load Shift Report" headline
- Error code: SHIFT_REPORT_FETCH_FAILED
- [Retry] and [Contact Support] buttons

---

## Data Fields

### Shift Report Response

```json
{
  "shift": {
    "date": "2026-01-15",
    "shift_id": "uuid-shift-1",
    "shift_name": "Day Shift",
    "start_time": "06:00",
    "end_time": "14:00",
    "duration_hours": 8,
    "supervisor_id": "uuid-user-1",
    "supervisor_name": "John Smith",
    "status": "draft",
    "generated_at": "2026-01-15T14:15:00Z"
  },
  "kpis": {
    "oee_pct": 78.5,
    "availability_pct": 87.2,
    "performance_pct": 91.5,
    "quality_pct": 98.4,
    "total_production": 12450,
    "good_output": 12250,
    "rejected_output": 200,
    "rejection_pct": 1.6,
    "total_downtime_minutes": 167,
    "downtime_pct": 5.8,
    "event_count": 12,
    "mttr_minutes": 13.9,
    "active_lines": 5,
    "total_lines": 6
  },
  "machines": [ ... ],
  "downtime_analysis": {
    "by_category": [
      { "category": "Equipment Failure", "duration_minutes": 68, "pct": 41, "events": 3 }
    ],
    "top_reasons": [
      { "reason": "Mechanical Breakdown", "duration_minutes": 48, "pct": 28 }
    ]
  },
  "issues": {
    "critical": [ ... ],
    "notes": [ ... ],
    "recommendations": [ ... ]
  },
  "approval": {
    "comments": "...",
    "approved_by": null,
    "approved_at": null,
    "checkboxes": {
      "data_accurate": false,
      "events_reviewed": false,
      "issues_documented": false
    }
  }
}
```

---

## API Endpoints

### Get Shift Report

```
GET /api/oee/reports/shift
Query: ?date=2026-01-15&shift_id=uuid

Response: { ... } (see Data Fields above)
```

### Approve Shift Report

```
POST /api/oee/reports/shift/:id/approve
Content-Type: application/json

Request:
{
  "comments": "Shift overall performance impacted by...",
  "signature": "John Smith",
  "checkboxes": {
    "data_accurate": true,
    "events_reviewed": true,
    "issues_documented": true
  }
}

Response:
{
  "report": { ... },
  "status": "approved",
  "approved_at": "2026-01-15T14:30:00Z"
}
```

### Export Shift Report PDF

```
GET /api/oee/reports/shift/:id/export/pdf

Response: PDF file download
```

---

## Permissions

| Role | View Report | Approve Report | Export PDF | Edit Notes |
|------|-------------|----------------|------------|------------|
| Production Manager | Yes | Yes | Yes | Yes |
| Supervisor | Yes (own shifts) | Yes (own shifts) | Yes | Yes |
| Operator | Yes (view only) | No | No | No |
| Admin | Yes | Yes | Yes | Yes |

---

## Validation

### Approval

| Field | Rule | Error Message |
|-------|------|---------------|
| Comments | Min 50 chars | "Comments must be at least 50 characters" |
| Checkboxes | All checked | "All checkboxes must be checked to approve" |
| Signature | Required | "Signature is required" |

---

## Business Rules

### Report Status Workflow

| Status | Can Edit | Can Approve | PDF Available |
|--------|----------|-------------|---------------|
| Draft | Yes | No | Yes (draft watermark) |
| Sent for Review | No | Yes (by manager) | Yes (draft watermark) |
| Approved | No | No | Yes (final) |

### Auto-Lock

- Report auto-locks 24 hours after shift end
- Locked reports cannot be edited
- Only Admin can unlock reports

---

## Accessibility

### Touch Targets
- Machine cards: Full card clickable
- Buttons: 48x48dp
- Checkboxes: 48x48dp

### Contrast
- KPI cards: 4.5:1
- Progress bars: 3:1
- Machine cards: 4.5:1

### Screen Reader
- **Report**: `aria-label="Shift Report for Day Shift, January 15, 2026"`
- **KPIs**: Individual labels for each metric
- **Machine cards**: Detailed status for each machine

### Keyboard Navigation
| Key | Action |
|-----|--------|
| Tab | Navigate sections, buttons |
| Enter | Expand machine, approve report |
| Escape | Close modal |

---

## Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| **Desktop (>1024px)** | Full report, all sections visible |
| **Tablet (768-1024px)** | Condensed machine cards, scrollable |
| **Mobile (<768px)** | Simplified cards, essential data only |

---

## Performance Notes

### Caching

```typescript
'org:{orgId}:oee:shift-report:{date}:{shift}'   // 5 min TTL (draft), 1 hour (approved)
'org:{orgId}:oee:shift-report:{id}:pdf'         // 1 hour TTL
```

### Load Time Targets

| Operation | Target |
|-----------|--------|
| Initial report load | < 2s |
| Export PDF | < 3s |
| Approve report | < 1s |

---

## Testing Requirements

### Unit Tests
```typescript
describe('Shift Report', () => {
  it('calculates shift KPIs correctly', async () => {});
  it('validates approval checkboxes', async () => {});
  it('generates PDF report', async () => {});
});
```

### E2E Tests
```typescript
describe('Shift Report E2E', () => {
  it('loads shift report', async () => {});
  it('approves shift report', async () => {});
  it('exports PDF', async () => {});
});
```

---

## Quality Gates

- [x] All 4 states defined
- [x] Responsive breakpoints documented
- [x] All API endpoints specified
- [x] Accessibility checklist passed
- [x] Performance targets defined
- [x] PDF export specified
- [x] Approval workflow defined

---

**Status**: Ready for Implementation
**Approval Mode**: auto_approve
**Estimated Effort**: 10-12 hours
**Quality Target**: 95/100
**PRD Coverage**: 100% (OEE PRD Section 10.4)
