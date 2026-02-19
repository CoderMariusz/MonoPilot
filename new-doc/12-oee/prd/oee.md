# OEE & Performance Module PRD

**MonoPilot Food MES - Overall Equipment Effectiveness & Performance Analytics**

Version: 1.0 | Date: 2025-12-10 | Epic: 10 | Owner: Product Team

---

## Phase Mapping

| Phase | Timeline | Focus |
|-------|----------|-------|
| 1A | MVP Core (Weeks 1-8) | Real-time OEE calculation, downtime tracking, basic dashboards |
| 1B | MVP Complete (Weeks 9-14) | Alerts, shift reports, energy tracking, historical trends |
| 2 | Growth (Weeks 15-20) | Advanced analytics, Pareto charts, custom reports, handover notes |
| 3 | Enterprise (Weeks 21-24) | Mobile logging, MTBF/MTTR, BI integration, benchmarking |

---

## 1. Executive Summary

Manufacturing performance monitoring and analytics module focused on OEE (Overall Equipment Effectiveness) tracking, machine utilization, downtime management, and energy efficiency. Provides real-time visibility into production performance and identifies improvement opportunities.

**Core Value:**
- Real-time OEE calculation (Availability × Performance × Quality)
- Machine utilization and downtime tracking
- Performance vs target cycle time analysis
- Quality metrics (yield, scrap, rework)
- Energy consumption monitoring
- Automated shift reports
- Historical trend analysis

**Integration Points:**
- Production module (Work Orders, Operations, Output)
- Settings module (Machines, Lines, Shift Calendars)
- Technical module (Products, BOMs, Routings)
- Quality module (QA Holds, NCRs)

---

## 2. Functional Requirements

| ID | Feature Name | Priority | Phase | Dependencies |
|----|--------------|----------|-------|--------------|
| OEE-001 | OEE Calculation Engine | P0 | 1A | Production, Settings |
| OEE-002 | Real-Time Machine Dashboard | P0 | 1A | OEE-001 |
| OEE-003 | Downtime Event Tracking | P0 | 1A | Production |
| OEE-004 | Downtime Reason Codes | P0 | 1A | OEE-003 |
| OEE-005 | Planned vs Unplanned Downtime | P0 | 1A | OEE-003 |
| OEE-006 | Performance Metrics (Cycle Time) | P0 | 1A | OEE-001 |
| OEE-007 | Quality Metrics (Yield/Scrap) | P0 | 1A | Production, Quality |
| OEE-008 | OEE by Machine/Line/Shift | P0 | 1A | OEE-001 |
| OEE-009 | OEE Target Configuration | P0 | 1A | Settings |
| OEE-010 | Threshold Alerts | P0 | 1B | OEE-001 |
| OEE-011 | Shift Report Generation | P0 | 1B | OEE-001 |
| OEE-012 | Energy Consumption Tracking | P1 | 1B | Production |
| OEE-013 | Energy per Batch/Product | P1 | 1B | OEE-012 |
| OEE-014 | Historical Trend Analysis | P0 | 1B | OEE-001 |
| OEE-015 | Period Comparisons | P0 | 1B | OEE-014 |
| OEE-016 | Machine Utilization Heatmap | P1 | 2 | OEE-001 |
| OEE-017 | Downtime Pareto Analysis | P0 | 2 | OEE-003 |
| OEE-018 | Performance Dashboard | P0 | 2 | All |
| OEE-019 | Custom Report Builder | P1 | 2 | All |
| OEE-020 | Email Alert Notifications | P1 | 2 | OEE-010 |
| OEE-021 | Shift Handover Notes | P1 | 2 | OEE-011 |
| OEE-022 | MTBF/MTTR Calculation | P1 | 3 | OEE-003 |
| OEE-023 | Production Rate Tracking | P1 | 3 | OEE-006 |
| OEE-024 | Bottleneck Analysis | P1 | 3 | OEE-001 |
| OEE-025 | Mobile Downtime Logging | P0 | 3 | OEE-003 |
| OEE-026 | TPM Schedule Integration | P2 | 3 | Settings |
| OEE-027 | OEE Benchmark Reports | P1 | 3 | OEE-014 |
| OEE-028 | Export to BI Tools | P1 | 3 | All |

---

## 3. Database Schema

### 3.1 OEE Tracking Tables

**oee_snapshots**
- `id`, `org_id`, `machine_id`, `line_id`, `shift_id`, `work_order_id`, `snapshot_time`, `availability_pct`, `performance_pct`, `quality_pct`, `oee_pct`, `planned_production_time`, `actual_production_time`, `ideal_cycle_time`, `total_pieces`, `good_pieces`, `rejected_pieces`

**oee_downtime_events**
- `id`, `org_id`, `machine_id`, `line_id`, `work_order_id`, `downtime_type`, `reason_code_id`, `start_time`, `end_time`, `duration_minutes`, `logged_by`, `notes`, `is_planned`, `impact_severity`

**oee_downtime_reasons**
- `id`, `org_id`, `code`, `category`, `description`, `is_planned`, `is_active`, `color_code`, `sort_order`

**oee_performance_logs**
- `id`, `org_id`, `machine_id`, `work_order_id`, `operation_id`, `timestamp`, `actual_cycle_time`, `target_cycle_time`, `units_produced`, `efficiency_pct`, `speed_loss_pct`

**oee_quality_events**
- `id`, `org_id`, `work_order_id`, `operation_id`, `event_type`, `timestamp`, `quantity`, `reason_code_id`, `defect_type`, `logged_by`, `notes`

### 3.2 Energy Tracking Tables

**energy_readings**
- `id`, `org_id`, `machine_id`, `line_id`, `reading_time`, `kwh_consumed`, `meter_reading`, `work_order_id`, `batch_id`, `reading_type`, `source`

**energy_baselines**
- `id`, `org_id`, `machine_id`, `product_id`, `baseline_kwh_per_unit`, `baseline_kwh_per_hour`, `effective_date`, `notes`

**energy_costs**
- `id`, `org_id`, `rate_per_kwh`, `effective_date`, `time_of_day_rate`, `rate_type`

### 3.3 Shift & Performance Tables

**shift_reports**
- `id`, `org_id`, `shift_id`, `line_id`, `report_date`, `start_time`, `end_time`, `supervisor_id`, `oee_avg`, `total_downtime`, `total_output`, `good_output`, `scrap_count`, `status`, `notes`, `generated_at`, `approved_by`, `approved_at`

**shift_handover_notes**
- `id`, `org_id`, `shift_report_id`, `from_shift_id`, `to_shift_id`, `note_type`, `message`, `priority`, `created_by`, `created_at`, `acknowledged_by`, `acknowledged_at`

**performance_targets**
- `id`, `org_id`, `target_type`, `reference_id`, `oee_target`, `availability_target`, `performance_target`, `quality_target`, `effective_date`, `expiry_date`

**performance_alerts**
- `id`, `org_id`, `alert_type`, `severity`, `metric_name`, `threshold_value`, `actual_value`, `reference_type`, `reference_id`, `triggered_at`, `acknowledged_by`, `acknowledged_at`, `resolved_at`, `notification_sent`

### 3.4 Analytics Tables

**oee_daily_summary**
- `id`, `org_id`, `summary_date`, `machine_id`, `line_id`, `shift_id`, `total_planned_time`, `total_downtime`, `total_production_time`, `oee_avg`, `availability_avg`, `performance_avg`, `quality_avg`, `total_output`, `good_output`, `scrap_output`

**oee_hourly_summary**
- `id`, `org_id`, `hour_start`, `machine_id`, `line_id`, `oee_avg`, `units_produced`, `good_units`, `downtime_minutes`

**machine_utilization**
- `id`, `org_id`, `machine_id`, `period_start`, `period_end`, `scheduled_hours`, `running_hours`, `idle_hours`, `down_hours`, `utilization_pct`

---

## 4. API Endpoints

### 4.1 OEE Calculation
- `GET /api/oee/calculate` - Calculate OEE for time period
- `GET /api/oee/snapshots` - List OEE snapshots
- `GET /api/oee/snapshots/:id` - Get snapshot details
- `POST /api/oee/snapshots` - Create manual snapshot
- `GET /api/oee/realtime/:machineId` - Real-time OEE data

### 4.2 Downtime Management
- `GET /api/oee/downtime` - List downtime events
- `GET /api/oee/downtime/:id` - Get downtime event
- `POST /api/oee/downtime` - Log downtime event
- `PATCH /api/oee/downtime/:id` - Update downtime event
- `DELETE /api/oee/downtime/:id` - Delete downtime event
- `GET /api/oee/downtime/reasons` - List reason codes
- `POST /api/oee/downtime/reasons` - Create reason code
- `PATCH /api/oee/downtime/reasons/:id` - Update reason code
- `GET /api/oee/downtime/analysis` - Pareto analysis

### 4.3 Performance Metrics
- `GET /api/oee/performance` - List performance logs
- `GET /api/oee/performance/:machineId` - Machine performance
- `GET /api/oee/performance/cycle-time` - Cycle time analysis
- `POST /api/oee/performance/log` - Log performance data

### 4.4 Quality Metrics
- `GET /api/oee/quality` - List quality events
- `POST /api/oee/quality/event` - Log quality event
- `GET /api/oee/quality/yield` - Yield analysis
- `GET /api/oee/quality/scrap` - Scrap analysis

### 4.5 Energy Tracking
- `GET /api/oee/energy/readings` - List energy readings
- `POST /api/oee/energy/readings` - Log energy reading
- `GET /api/oee/energy/consumption/:machineId` - Machine consumption
- `GET /api/oee/energy/cost` - Energy cost analysis
- `GET /api/oee/energy/baselines` - List baselines
- `POST /api/oee/energy/baselines` - Create baseline

### 4.6 Shift Reports
- `GET /api/oee/shift-reports` - List shift reports
- `GET /api/oee/shift-reports/:id` - Get shift report
- `POST /api/oee/shift-reports/generate` - Generate report
- `PATCH /api/oee/shift-reports/:id/approve` - Approve report
- `GET /api/oee/shift-reports/:id/export` - Export to PDF
- `GET /api/oee/handover-notes` - List handover notes
- `POST /api/oee/handover-notes` - Create handover note

### 4.7 Alerts & Notifications
- `GET /api/oee/alerts` - List alerts
- `GET /api/oee/alerts/active` - Active alerts
- `PATCH /api/oee/alerts/:id/acknowledge` - Acknowledge alert
- `PATCH /api/oee/alerts/:id/resolve` - Resolve alert
- `GET /api/oee/alerts/config` - Alert configuration
- `POST /api/oee/alerts/config` - Create alert rule

### 4.8 Analytics & Reports
- `GET /api/oee/analytics/trends` - Trend analysis
- `GET /api/oee/analytics/comparisons` - Period comparisons
- `GET /api/oee/analytics/utilization` - Utilization heatmap
- `GET /api/oee/analytics/bottlenecks` - Bottleneck analysis
- `GET /api/oee/analytics/mtbf` - MTBF/MTTR metrics
- `POST /api/oee/reports/custom` - Generate custom report
- `GET /api/oee/reports/export` - Export data

### 4.9 Targets
- `GET /api/oee/targets` - List performance targets
- `POST /api/oee/targets` - Create target
- `PATCH /api/oee/targets/:id` - Update target
- `DELETE /api/oee/targets/:id` - Delete target

---

## 5. UI Routes & Pages

| Route | Purpose | Key Components |
|-------|---------|----------------|
| `/oee/dashboard` | Real-time OEE overview | KPIs, Machine status grid, Active alerts |
| `/oee/machines/:id` | Machine detail view | OEE metrics, Timeline, Downtime log |
| `/oee/downtime` | Downtime management | Event log, Reason codes, Pareto chart |
| `/oee/performance` | Performance analysis | Cycle time trends, Speed loss, Efficiency |
| `/oee/quality` | Quality metrics | Yield trends, Scrap analysis, Defect types |
| `/oee/energy` | Energy monitoring | Consumption charts, Cost analysis, Baselines |
| `/oee/shifts` | Shift reports | Report list, Generation, Approval workflow |
| `/oee/analytics` | Historical analysis | Trends, Comparisons, Custom reports |
| `/oee/alerts` | Alert management | Active alerts, Configuration, Notification rules |
| `/oee/settings` | OEE configuration | Targets, Reason codes, Alert thresholds |
| `/scanner/downtime` | Mobile downtime logging | Quick log, Reason selection, Photo upload |

---

## 6. Dashboard Mockups (Text Description)

### 6.1 Main OEE Dashboard (`/oee/dashboard`)

**Layout:** 3-column grid with header KPIs

**Header KPI Cards (4 cards):**
```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ OEE Today   │Availability │Performance  │  Quality    │
│    78.5%    │    85.2%    │    92.1%    │    100%     │
│  ▲ +2.3%    │  ▼ -1.5%    │  ▲ +0.8%    │  ─ 0%       │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

**Machine Status Grid (main section):**
```
┌─────────────────────────────────────────────────────────┐
│ PRODUCTION LINE 1                         [Filters ▼]   │
├──────────────┬──────────────┬──────────────┬────────────┤
│ Mixer-01     │ Filler-02    │ Labeler-03   │ Packer-04  │
│ ● Running    │ ● Running    │ ⏸ Paused     │ ● Running  │
│ OEE: 82.1%   │ OEE: 91.3%   │ OEE: 0%      │ OEE: 76.5% │
│ WO-2451      │ WO-2451      │ WO-2451      │ WO-2451    │
│ 1,450/2,000  │ 1,420/2,000  │ 0/2,000      │ 1,380/2,000│
│ [View] [Log] │ [View] [Log] │ [View] [Log] │ [View] [Log]│
└──────────────┴──────────────┴──────────────┴────────────┘
```

**Active Alerts Panel (right sidebar):**
```
┌──────────────────────────────────────┐
│ ACTIVE ALERTS            [Clear All] │
├──────────────────────────────────────┤
│ 🔴 Labeler-03 Down                   │
│    Reason: Jam Detected              │
│    Started: 14:23 (12m ago)          │
│    [Acknowledge] [View]              │
├──────────────────────────────────────┤
│ 🟡 Packer-04 Low Performance         │
│    OEE: 76.5% (Target: 85%)          │
│    [Acknowledge] [View]              │
└──────────────────────────────────────┘
```

**OEE Trend Chart (bottom):**
```
┌──────────────────────────────────────────────────────────┐
│ OEE TREND - LAST 7 DAYS              [Day▼] [Export CSV] │
│ 100%│                                                     │
│  90%│     ●─────●                                         │
│  80%│  ●─────────●─────●─────●                           │
│  70%│                                ●                    │
│  60%│                                                     │
│   0%├─────┬─────┬─────┬─────┬─────┬─────┬─────          │
│     Mon   Tue   Wed   Thu   Fri   Sat   Sun              │
│                                                           │
│ Legend: ─ OEE  ─ Availability  ─ Performance  ─ Quality  │
└──────────────────────────────────────────────────────────┘
```

---

### 6.2 Machine Detail View (`/oee/machines/:id`)

**Layout:** Tab interface with timeline

**Machine Header:**
```
┌──────────────────────────────────────────────────────────┐
│ MIXER-01                    Production Line 1            │
│ ● Running - WO-2451 (Chocolate Cookie Dough)             │
│ Started: 08:30 | Runtime: 6h 15m | Output: 1,450/2,000   │
└──────────────────────────────────────────────────────────┘
```

**OEE Metrics (3 cards):**
```
┌─────────────┬─────────────┬─────────────────────────────┐
│ OEE: 82.1%  │Availability │Performance  │  Quality      │
│ Target: 85% │   85.2%     │    96.4%    │    100%       │
│ ▼ Below     │  ▲ Above    │  ▲ Above    │  ─ On Target  │
└─────────────┴─────────────┴─────────────────────────────┘
```

**Timeline (24-hour view):**
```
┌──────────────────────────────────────────────────────────┐
│ 08:00 ████████████ Running (WO-2451) ████████████████    │
│ 10:30          ⏸ Break (15m)                             │
│ 12:00                  ⏸ Lunch (30m)                     │
│ 14:23                            ⏹ Down: Jam (12m)       │
│ 16:00 ──────────────────────────────────────────────────►│
│                                                           │
│ Legend: ██ Running  ⏸ Paused  ⏹ Down  ⚠ Low Performance │
└──────────────────────────────────────────────────────────┘
```

**Downtime Log (table):**
```
┌────────────────────────────────────────────────────────────┐
│ DOWNTIME EVENTS                          [+ Log Downtime] │
├────────┬─────────┬────────────┬──────────┬────────────────┤
│ Start  │ End     │ Duration   │ Reason   │ Type           │
├────────┼─────────┼────────────┼──────────┼────────────────┤
│ 14:23  │ (Active)│ 12m        │ Jam      │ Unplanned      │
│ 12:00  │ 12:30   │ 30m        │ Lunch    │ Planned        │
│ 10:30  │ 10:45   │ 15m        │ Break    │ Planned        │
└────────┴─────────┴────────────┴──────────┴────────────────┘
```

---

### 6.3 Downtime Analysis (`/oee/downtime`)

**Layout:** Split view - Pareto chart + Event log

**Pareto Chart:**
```
┌──────────────────────────────────────────────────────────┐
│ DOWNTIME PARETO - THIS WEEK          [Week▼] [Machine▼] │
│ Min│                                               100%   │
│ 180│ ███                                            90%   │
│ 150│ ███                                            80%   │
│ 120│ ███ ███                                        70%   │
│  90│ ███ ███ ███                                    60%   │
│  60│ ███ ███ ███ ███                                50%   │
│  30│ ███ ███ ███ ███ ███ ███                        30%   │
│   0│ ███ ███ ███ ███ ███ ███                         0%   │
│     Jam Setup Clng Brk  Mat  Other                       │
│                                                           │
│ Total Downtime: 485 minutes (8.1 hours)                  │
└──────────────────────────────────────────────────────────┘
```

**Top Issues (cards):**
```
┌─────────────────────┬─────────────────────┬─────────────┐
│ #1 Machine Jams     │ #2 Setup/Changeover │ #3 Cleaning │
│ 180 min (37%)       │ 145 min (30%)       │ 85 min (18%)│
│ 12 occurrences      │ 6 occurrences       │ 4 occ.      │
│ Avg: 15m per event  │ Avg: 24m per event  │ Avg: 21m    │
└─────────────────────┴─────────────────────┴─────────────┘
```

**Detailed Event Log:**
```
┌────────────────────────────────────────────────────────────┐
│ DOWNTIME EVENTS              [Filters ▼] [Export CSV]     │
├──────────┬─────────┬─────┬──────────┬─────────┬───────────┤
│ Machine  │ Start   │ Dur │ Reason   │ Type    │ Actions   │
├──────────┼─────────┼─────┼──────────┼─────────┼───────────┤
│ Labeler-3│ 14:23   │ 12m │ Jam      │Unplanned│ [Edit] [] │
│ Mixer-01 │ 12:00   │ 30m │ Lunch    │ Planned │ [Edit] [] │
│ Filler-02│ 10:15   │ 25m │ Setup    │Unplanned│ [Edit] [] │
└──────────┴─────────┴─────┴──────────┴─────────┴───────────┘
```

---

### 6.4 Shift Report (`/oee/shifts`)

**Layout:** Report card with approval workflow

**Shift Summary Header:**
```
┌──────────────────────────────────────────────────────────┐
│ SHIFT REPORT                                  Status: ●  │
│ Line: Production Line 1    Date: 2025-12-10             │
│ Shift: Morning (06:00-14:00)  Supervisor: John Smith    │
└──────────────────────────────────────────────────────────┘
```

**Performance Summary:**
```
┌─────────────────────────────────────────────────────────┐
│ PERFORMANCE METRICS                                     │
├──────────────┬──────────────┬──────────────┬───────────┤
│ OEE: 84.2%   │ Availability │ Performance  │ Quality   │
│ Target: 85%  │    88.5%     │    95.1%     │   100%    │
│ ▼ -0.8%      │   ▲ +2.1%    │   ─ 0%       │  ─ 0%     │
└──────────────┴──────────────┴──────────────┴───────────┘

┌──────────────┬──────────────┬──────────────┬───────────┤
│ Planned Time │ Running Time │ Downtime     │ Output    │
│ 480 min      │ 425 min      │ 55 min       │ 2,450 units│
└──────────────┴──────────────┴──────────────┴───────────┘
```

**Downtime Breakdown:**
```
┌──────────────────────────────────────────────────────────┐
│ DOWNTIME SUMMARY                                         │
├──────────────────────┬────────────┬──────────────────────┤
│ Planned Downtime     │ 30 min     │ Break, Cleaning      │
│ Unplanned Downtime   │ 25 min     │ Setup, Minor stops   │
│ Total                │ 55 min     │                      │
└──────────────────────┴────────────┴──────────────────────┘
```

**Work Orders Completed:**
```
┌──────────────────────────────────────────────────────────┐
│ WORK ORDERS                                              │
├───────┬──────────────────────┬─────────┬────────┬───────┤
│ WO #  │ Product              │ Planned │ Actual │ Yield │
├───────┼──────────────────────┼─────────┼────────┼───────┤
│ 2451  │ Choc Cookie Dough    │ 2,000   │ 2,000  │ 100%  │
│ 2452  │ Vanilla Dough        │   500   │   450  │  90%  │
└───────┴──────────────────────┴─────────┴────────┴───────┘
```

**Notes & Handover:**
```
┌──────────────────────────────────────────────────────────┐
│ SHIFT NOTES                                              │
│ - Labeler-03 had intermittent jam issues (12m total)    │
│ - Mixer-01 running smoothly, no issues                  │
│ - Low yield on WO-2452 due to ingredient quality        │
│                                                          │
│ HANDOVER TO AFTERNOON SHIFT:                            │
│ - Monitor Labeler-03 closely for jam recurrence         │
│ - WO-2453 ready to start (all materials staged)         │
│                                                          │
│ [Approve Report] [Request Changes] [Export PDF]         │
└──────────────────────────────────────────────────────────┘
```

---

### 6.5 Energy Monitoring (`/oee/energy`)

**Layout:** Multi-chart dashboard

**Energy KPIs:**
```
┌──────────────┬──────────────┬──────────────┬────────────┐
│ Today's Use  │ Cost Today   │ kWh/Unit     │ vs Target  │
│ 1,245 kWh    │ $124.50      │ 0.62 kWh     │ ▲ +5.2%    │
│ ▲ +8.5%      │ ▲ +8.5%      │ ▼ -2.1%      │ Above      │
└──────────────┴──────────────┴──────────────┴────────────┘
```

**Consumption by Machine (bar chart):**
```
┌──────────────────────────────────────────────────────────┐
│ ENERGY CONSUMPTION - TODAY                               │
│ kWh│                                                      │
│ 400│ ████                                                 │
│ 300│ ████  ████                                           │
│ 200│ ████  ████  ████                                     │
│ 100│ ████  ████  ████  ████  ████                         │
│   0│ ████  ████  ████  ████  ████  ████                   │
│     Mix-1 Fill-2 Lab-3 Pack-4 Oven-5 Chill-6             │
└──────────────────────────────────────────────────────────┘
```

**Efficiency Trend:**
```
┌──────────────────────────────────────────────────────────┐
│ kWh PER UNIT - LAST 30 DAYS                              │
│ 0.80│                                                     │
│ 0.70│     ●─────●                                         │
│ 0.60│  ●─────────●─────●─────●─────●───── Target         │
│ 0.50│                                                     │
│ 0.40│                                                     │
│   0│─────────────────────────────────────────            │
│     Week 1  Week 2  Week 3  Week 4                       │
└──────────────────────────────────────────────────────────┘
```

**Cost Analysis Table:**
```
┌──────────────────────────────────────────────────────────┐
│ COST BREAKDOWN - THIS MONTH                              │
├──────────────┬──────────┬───────────┬──────────┬─────────┤
│ Machine      │ kWh Used │ Rate      │ Cost     │ % Total │
├──────────────┼──────────┼───────────┼──────────┼─────────┤
│ Mixer-01     │ 8,450    │ $0.10/kWh │ $845.00  │ 35%     │
│ Filler-02    │ 6,200    │ $0.10/kWh │ $620.00  │ 26%     │
│ Labeler-03   │ 4,100    │ $0.10/kWh │ $410.00  │ 17%     │
│ Packer-04    │ 3,800    │ $0.10/kWh │ $380.00  │ 16%     │
│ Other        │ 1,450    │ $0.10/kWh │ $145.00  │  6%     │
├──────────────┼──────────┼───────────┼──────────┼─────────┤
│ Total        │ 24,000   │           │$2,400.00 │ 100%    │
└──────────────┴──────────┴───────────┴──────────┴─────────┘
```

---

## 7. Feature Details

### 7.1 OEE Calculation Engine (OEE-001)

**Formula:**
```
OEE = Availability × Performance × Quality

Availability = (Production Time / Planned Production Time) × 100
  where Production Time = Planned Production Time - Downtime

Performance = (Actual Output / Target Output) × 100
  where Target Output = (Production Time / Ideal Cycle Time)

Quality = (Good Output / Actual Output) × 100
```

**Calculation Triggers:**
- Real-time: Every 5 minutes for active machines
- On-demand: User requests current OEE
- Scheduled: End of shift, end of day
- Event-driven: WO completion, downtime event, output registration

**Data Sources:**
- Work Orders (planned time, quantities)
- Operations (start/end times, cycle times)
- Downtime Events (duration, type)
- Output Registration (actual quantities, good vs scrap)
- Machine Settings (ideal cycle time, target OEE)

**Storage:**
- `oee_snapshots` - Point-in-time calculations
- `oee_daily_summary` - Aggregated daily metrics
- `oee_hourly_summary` - Hourly rollups for trending

---

### 7.2 Downtime Event Tracking (OEE-003)

**Event Lifecycle:**
1. Downtime Start → Log event (manual or auto-detected)
2. Select Reason Code → Categorize (planned/unplanned)
3. Add Notes/Photos → Document details
4. Downtime End → Calculate duration
5. Impact Calculation → Update OEE metrics

**Reason Code Categories:**
```
PLANNED:
- Break/Lunch
- Scheduled Maintenance
- Planned Cleaning
- Setup/Changeover (planned)
- Training

UNPLANNED:
- Machine Breakdown
- Material Shortage
- Quality Issue/Hold
- Setup/Changeover (unplanned)
- Utility Failure
- Operator Absence
- Minor Stops/Jams
```

**Auto-Detection (Future):**
- Monitor machine signals (if integrated)
- Detect idle time > threshold
- Auto-create event, prompt operator for reason

**Mobile Logging:**
- Scanner app: Quick downtime log
- Required fields: Machine, Reason Code
- Optional: Photos, Voice notes
- Offline capability: Sync when online

---

### 7.3 Threshold Alerts (OEE-010)

**Alert Types:**

| Alert | Condition | Severity | Notification |
|-------|-----------|----------|--------------|
| OEE Below Target | Current OEE < Target OEE | Medium | Email, Dashboard |
| Availability Low | Availability < 80% | High | Email, SMS, Dashboard |
| Performance Drop | Performance < 85% for 30min | Medium | Dashboard |
| Quality Issue | Quality < 95% | High | Email, Dashboard |
| Extended Downtime | Downtime > 15min continuous | High | Email, SMS |
| Energy Spike | kWh > 120% baseline | Medium | Dashboard |
| Shift OEE Miss | Shift OEE < Target at 75% complete | High | Email |

**Alert Configuration:**
- Per machine, line, or organization
- Custom thresholds
- Notification channels (email, SMS, dashboard)
- Escalation rules (if not acknowledged)
- Business hours vs 24/7

**Alert Workflow:**
1. Condition Met → Alert Created
2. Notification Sent → To configured recipients
3. User Acknowledges → Mark as seen
4. Action Taken → Add notes
5. Condition Resolved → Auto-close or manual

---

### 7.4 Shift Report Generation (OEE-011)

**Auto-Generation:**
- Triggered: 15 minutes after shift end
- Data Collection:
  - OEE metrics (availability, performance, quality)
  - Work orders completed
  - Downtime events
  - Output quantities
  - Quality issues/holds
  - Energy consumption

**Report Sections:**
1. Shift Summary (date, shift, supervisor, line)
2. Performance Metrics (OEE, targets, variance)
3. Production Output (WOs, quantities, yield)
4. Downtime Analysis (duration, reasons, impact)
5. Quality Events (scrap, rework, holds)
6. Handover Notes (issues, action items)
7. Signatures (supervisor, approved by)

**Approval Workflow:**
1. Report Generated → Status: Draft
2. Supervisor Reviews → Add notes, verify data
3. Supervisor Approves → Status: Approved, locked
4. Distribution → Email to management, archive

**Export Formats:**
- PDF (for printing, email)
- Excel (for further analysis)
- JSON (for BI tool integration)

---

### 7.5 Energy Consumption Tracking (OEE-012)

**Data Collection Methods:**

**Manual Entry:**
- Operator records meter readings
- Start/end of shift
- Start/end of batch

**Auto-Import:**
- Read from energy meters (if integrated)
- Poll every 15 minutes
- Store raw readings + calculated consumption

**Batch-Level Tracking:**
- Link energy readings to work orders
- Calculate kWh per batch
- Calculate kWh per unit produced

**Baseline Management:**
- Define expected kWh per unit per product
- Define expected kWh per hour per machine
- Flag deviations > 10%

**Cost Tracking:**
- Configure energy rates (per kWh)
- Support time-of-day rates (peak/off-peak)
- Calculate cost per batch, per product

**Analytics:**
- Energy efficiency trends
- Cost trends
- Machine comparison
- Product comparison
- Identify high-consumption machines/products

---

## 8. Integration Points

### 8.1 Production Module
- **Work Orders:** Source for planned times, quantities, products
- **Operations:** Source for actual cycle times, start/end times
- **Output Registration:** Source for actual quantities, good vs scrap
- **Material Consumption:** Linked to quality metrics (scrap reasons)

### 8.2 Settings Module
- **Machines:** Source for ideal cycle times, energy baselines
- **Lines:** Grouping for OEE calculations
- **Shift Calendars:** Source for planned production time
- **Users:** Supervisor assignment, report approvals

### 8.3 Technical Module
- **Products:** Source for target cycle times, energy baselines
- **BOMs:** Linked to quality metrics (ingredient issues)
- **Routings:** Source for operation targets

### 8.4 Quality Module
- **QA Holds:** Source for quality-related downtime
- **NCRs:** Linked to quality events, scrap reasons
- **Inspections:** Impact quality metric calculations

---

## 9. Non-Functional Requirements

### 9.1 Performance
- Real-time OEE calculations: < 2s response time
- Dashboard refresh: Every 30s (configurable)
- Historical queries: < 5s for 90 days of data
- Report generation: < 10s for shift report

### 9.2 Data Retention
- Raw snapshots: 90 days
- Hourly summaries: 1 year
- Daily summaries: 3 years
- Shift reports: 7 years (compliance)

### 9.3 Scalability
- Support 50+ machines per organization
- Support 1M+ OEE snapshots per month
- Support 10K+ downtime events per month

### 9.4 Accuracy
- Time tracking: Accurate to 1 minute
- Quantity tracking: Exact counts (no rounding)
- Energy tracking: 2 decimal places (0.01 kWh)
- OEE calculation: 1 decimal place (0.1%)

---

## 10. Phase Roadmap

### Phase 1A: Core OEE (MVP Core) - 8 weeks
**Goal:** Real-time OEE calculation and basic dashboards

**Stories:**
- OEE-001: OEE Calculation Engine
- OEE-002: Real-Time Machine Dashboard
- OEE-003: Downtime Event Tracking
- OEE-004: Downtime Reason Codes
- OEE-005: Planned vs Unplanned Downtime
- OEE-006: Performance Metrics (Cycle Time)
- OEE-007: Quality Metrics (Yield/Scrap)
- OEE-008: OEE by Machine/Line/Shift
- OEE-009: OEE Target Configuration

**Deliverables:**
- `/oee/dashboard` - Real-time OEE dashboard
- `/oee/machines/:id` - Machine detail view
- `/oee/downtime` - Downtime logging
- API endpoints for OEE calculation
- Database schema v1

**Success Metrics:**
- OEE calculated in real-time for all active machines
- Downtime events logged with < 2 min delay
- Dashboard loads in < 2s

---

### Phase 1B: Alerts & Reports (MVP Complete) - 6 weeks
**Goal:** Automated reporting and proactive alerting

**Stories:**
- OEE-010: Threshold Alerts
- OEE-011: Shift Report Generation
- OEE-012: Energy Consumption Tracking
- OEE-013: Energy per Batch/Product
- OEE-014: Historical Trend Analysis
- OEE-015: Period Comparisons

**Deliverables:**
- `/oee/shifts` - Shift reports
- `/oee/energy` - Energy monitoring
- `/oee/analytics` - Historical trends
- `/oee/alerts` - Alert management
- Email/SMS notifications
- PDF export for shift reports

**Success Metrics:**
- Shift reports auto-generated within 15 min of shift end
- 90% of alerts acknowledged within 30 min
- Energy data captured for 95% of batches

---

### Phase 2: Advanced Analytics (Growth) - 6 weeks
**Goal:** Deep insights and continuous improvement

**Stories:**
- OEE-016: Machine Utilization Heatmap
- OEE-017: Downtime Pareto Analysis
- OEE-018: Performance Dashboard
- OEE-019: Custom Report Builder
- OEE-020: Email Alert Notifications
- OEE-021: Shift Handover Notes

**Deliverables:**
- Pareto charts for downtime analysis
- Heatmaps for utilization patterns
- Custom report builder
- Handover note workflow
- Advanced dashboards

**Success Metrics:**
- Users identify top 3 downtime issues in < 30s
- Custom reports created by non-technical users
- Shift handover notes adopted by 80% of supervisors

---

### Phase 3: Mobile & Integration (Enterprise) - 4 weeks
**Goal:** Mobile access and external system integration

**Stories:**
- OEE-022: MTBF/MTTR Calculation
- OEE-023: Production Rate Tracking
- OEE-024: Bottleneck Analysis
- OEE-025: Mobile Downtime Logging
- OEE-027: OEE Benchmark Reports
- OEE-028: Export to BI Tools

**Deliverables:**
- `/scanner/downtime` - Mobile downtime logging
- MTBF/MTTR metrics
- Bottleneck identification
- BI tool connectors (Power BI, Tableau)
- API documentation for external integrations

**Success Metrics:**
- 50% of downtime events logged via mobile
- MTBF/MTTR tracked for all critical machines
- BI tool integration for 2+ platforms

---

## 11. Success Metrics

### 11.1 Adoption Metrics
- % of machines with OEE tracking enabled: 100%
- % of downtime events logged within 5 min: 80%
- % of shift reports approved on time: 90%
- % of alerts acknowledged within 30 min: 85%

### 11.2 Performance Metrics
- Average OEE across all machines: 85% (target)
- Reduction in unplanned downtime: 20% (vs baseline)
- Increase in overall productivity: 15% (vs baseline)
- Reduction in energy cost per unit: 10% (vs baseline)

### 11.3 User Satisfaction
- Daily active users (supervisors, operators): 90%+
- User satisfaction score: 4.5/5
- Feature request volume: < 5 per month (after stabilization)

---

## 12. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Inaccurate time tracking | High | Medium | Auto-sync with WO system, validation rules |
| Downtime not logged | High | Medium | Mobile app, auto-detection (future) |
| Data volume performance | Medium | High | Aggregation tables, data archival strategy |
| User resistance to logging | Medium | High | Simplify UI, mobile app, training |
| Energy meter integration | Low | Medium | Start with manual entry, add auto later |
| Alert fatigue | Medium | Medium | Configurable thresholds, smart grouping |

---

## 13. Appendix

### 13.1 OEE Industry Benchmarks

| Industry | World Class OEE | Typical OEE |
|----------|-----------------|-------------|
| Food & Beverage | 85%+ | 60-75% |
| Discrete Manufacturing | 90%+ | 65-80% |
| Process Manufacturing | 85%+ | 60-70% |

### 13.2 Downtime Categories (Industry Standard)

**Six Big Losses:**
1. Breakdowns (Unplanned stops)
2. Setup/Changeovers (Adjustments)
3. Small Stops (< 5 minutes, jams, sensor issues)
4. Reduced Speed (Running below target)
5. Startup Rejects (Scrap during ramp-up)
6. Production Rejects (Scrap during normal operation)

### 13.3 Glossary

- **OEE:** Overall Equipment Effectiveness
- **MTBF:** Mean Time Between Failures
- **MTTR:** Mean Time To Repair
- **TPM:** Total Productive Maintenance
- **Ideal Cycle Time:** Theoretical minimum time per unit
- **Planned Production Time:** Scheduled run time minus breaks/lunches
- **Good Output:** Output that passes quality checks
- **Yield:** (Good Output / Actual Output) × 100

---

**Document Version:** 1.0
**Last Updated:** 2025-12-10
**Next Review:** Q1 2026
**Owner:** Product Team
**Status:** Draft - Ready for Review
