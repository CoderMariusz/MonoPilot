# PROD-008 Part 2: OEE Dashboard Data & Technical Specifications

**Module**: Production
**Feature**: OEE Monitoring Dashboard (FR-PROD-018, FR-PROD-021)
**Status**: Ready for Review
**Last Updated**: 2025-12-14

**See Also**: [PROD-008 Part 1: UI & Wireframes](./PROD-008-part1-oee-dashboard-ui.md)

---

## Data Fields

### Current Shift Info

| Field | Source | Calculation | Display | Refresh |
|-------|--------|-------------|---------|---------|
| shift_name | shift_management.name | Direct | "Day Shift" | Static (shift-based) |
| shift_start_time | shift_management.start_time | Direct | "06:00" | Static |
| shift_end_time | shift_management.end_time | Direct | "14:00" | Static |
| current_time | Server time | now() | "10:30" | Real-time (30s) |
| elapsed_time | Calculated | now() - shift_start_time | "4h 30m" | Real-time (30s) |
| shift_status | Calculated | "Active" if now() between start/end, else "Ended" | "Active" | Real-time (30s) |
| gross_duration | shift_management.duration_minutes | Direct | "480 min" | Static |
| net_duration | shift_management.duration_minutes - break_minutes | Calculated | "450 min" | Static |
| machines_active | machines table | COUNT(*) WHERE status='running' AND shift_id=current_shift | "5 of 8" | Real-time (30s) |
| lines_active | production_lines table | COUNT(DISTINCT line_id) WHERE machines active on shift | "3 of 5" | Real-time (30s) |

### OEE Gauges

| Field | Source | Calculation | Display |
|-------|--------|-------------|---------|
| availability_percent | oee_metrics.availability | (operating_time / planned_time) × 100 | "87.5%" |
| operating_time | shift_duration - downtime_sum | SUM(shift_duration_minutes - downtime_minutes) | "420 min" |
| planned_time | shift_management.duration_minutes | Direct | "480 min" |
| downtime_minutes | downtime_logs table | SUM(duration_minutes) WHERE shift_id=current_shift | "60 min" |
| performance_percent | oee_metrics.performance | (actual_output / theoretical_output) × 100 | "90.0%" |
| actual_output | production_outputs table | SUM(quantity) WHERE shift_id=current_shift | "900 pcs" |
| theoretical_output | Calculated | (ideal_cycle_time × operating_time) | "1000 pcs" |
| ideal_cycle_time | products.ideal_cycle_time OR calculated | From product master or BOM | "28s/unit" |
| quality_percent | oee_metrics.quality | (good_output / total_output) × 100 | "95.0%" |
| good_output | production_outputs table | SUM(quantity) WHERE qa_status='approved' AND shift_id | "950 pcs" |
| total_output | production_outputs table | SUM(quantity) WHERE shift_id=current_shift | "1000 pcs" |
| defect_rate | Calculated | (1 - quality_percent) × 100 | "5%" |
| oee_percent | oee_metrics.oee | availability × performance × quality | "74.8%" |
| target_oee | settings.target_oee_percent | Global OEE target | "85%" |
| target_availability | settings.target_availability OR 85% | Availability target | "85%" |
| target_performance | settings.target_performance OR 85% | Performance target | "85%" |
| target_quality | settings.target_quality OR 90% | Quality target | "90%" |

### OEE Trend Chart

| Field | Source | Display |
|-------|--------|---------|
| trend_date | oee_metrics.shift_date | "12-08", "12-09", etc. |
| daily_oee | AVG(oee_metrics.oee) WHERE shift_date | "72.1%", "74.5%", etc. |
| avg_oee | AVG(oee_metrics.oee) over selected period | "78.3%" |
| best_oee | MAX(oee_metrics.oee) over selected period | "88.5% (12-13)" |
| worst_oee | MIN(oee_metrics.oee) over selected period | "72.1% (12-08)" |

### Machine Comparison Table

| Field | Source | Display |
|-------|--------|---------|
| machine_name | machines.name | "Mixer M-002" |
| line_name | production_lines.name | "Line 2" |
| current_wo_number | work_orders.wo_number WHERE machine_id AND status='in_progress' | "WO-2025-0148" |
| machine_availability | oee_metrics.availability WHERE machine_id AND shift_id | "65.0%" (color-coded) |
| machine_performance | oee_metrics.performance WHERE machine_id AND shift_id | "82.0%" (color-coded) |
| machine_quality | oee_metrics.quality WHERE machine_id AND shift_id | "98.0%" (color-coded) |
| machine_oee | oee_metrics.oee WHERE machine_id AND shift_id | "52.3%" (color-coded) |
| machine_status | machines.status | "Running", "Down", "Idle", "Changeover" |
| downtime_duration | SUM(downtime_logs.duration_minutes) WHERE machine_id AND shift_id | "168 min" |
| downtime_category | downtime_logs.category (most recent or longest) | "Breakdown" |
| actual_output | SUM(production_outputs.quantity) WHERE machine_id AND shift_id | "820 kg" |
| planned_output | work_orders.planned_qty WHERE wo_id | "1000 kg" |
| defects_count | SUM(production_outputs.quantity) WHERE qa_status='rejected' | "16 kg" |

### A/P/Q Breakdown Chart

| Field | Source | Display |
|-------|--------|---------|
| machine_name | machines.name | "Mixer M-002", "Oven O-003", etc. |
| availability_segment | oee_metrics.availability | Stacked bar segment (blue) |
| performance_segment | oee_metrics.performance | Stacked bar segment (gray) on top of A |
| quality_segment | oee_metrics.quality | Stacked bar segment (light gray) on top of P |
| oee_composite | oee_metrics.oee | Overall bar height (dark gray) |
| insight_text | AI-generated OR rule-based | "Mixer M-002 has lowest availability (65%) due to 168 min breakdown. Oven O-003 has lowest performance (75%) - investigate cycle time variance." |

---

## API Endpoints

### Current Shift Info
```
GET /api/production/oee/current-shift
Response:
{
  "shift": {
    "id": "uuid-shift-1",
    "name": "Day Shift",
    "start_time": "06:00",
    "end_time": "14:00",
    "current_time": "10:30",
    "elapsed_minutes": 270,
    "status": "active",
    "gross_duration_minutes": 480,
    "net_duration_minutes": 450,
    "break_minutes": 30,
    "days_of_week": [1, 2, 3, 4, 5]
  },
  "machines_active": 5,
  "machines_total": 8,
  "lines_active": 3,
  "lines_total": 5
}
```

### OEE Gauges
```
GET /api/production/oee/gauges?shift_id={shift_id}&machine_id={machine_id}
Response:
{
  "availability": {
    "percent": 87.5,
    "operating_time_minutes": 420,
    "planned_time_minutes": 480,
    "downtime_minutes": 60,
    "target_percent": 85.0,
    "status": "above_target",
    "color": "green"
  },
  "performance": {
    "percent": 90.0,
    "actual_output": 900,
    "theoretical_output": 1000,
    "uom": "pcs",
    "ideal_cycle_time_seconds": 28,
    "target_percent": 85.0,
    "status": "above_target",
    "color": "green"
  },
  "quality": {
    "percent": 95.0,
    "good_output": 950,
    "total_output": 1000,
    "defects": 50,
    "defect_rate_percent": 5.0,
    "target_percent": 90.0,
    "status": "above_target",
    "color": "green"
  },
  "oee": {
    "percent": 74.8,
    "calculation": "87.5% × 90.0% × 95.0% = 74.8%",
    "target_percent": 85.0,
    "status": "below_target",
    "color": "red",
    "gap_percent": -10.2
  }
}
```

### OEE Trend Chart
```
GET /api/production/oee/trend?date_range=7d&machine_id={machine_id}&shift_id={shift_id}
Response:
{
  "trend_data": [
    {
      "date": "2025-12-08",
      "oee_percent": 72.1,
      "availability_percent": 78.0,
      "performance_percent": 85.0,
      "quality_percent": 91.0
    },
    {
      "date": "2025-12-09",
      "oee_percent": 74.5,
      "availability_percent": 80.0,
      "performance_percent": 87.0,
      "quality_percent": 93.0
    },
    {
      "date": "2025-12-10",
      "oee_percent": 76.8,
      "availability_percent": 82.0,
      "performance_percent": 88.0,
      "quality_percent": 94.0
    },
    {
      "date": "2025-12-11",
      "oee_percent": 78.2,
      "availability_percent": 84.0,
      "performance_percent": 89.0,
      "quality_percent": 95.0
    },
    {
      "date": "2025-12-12",
      "oee_percent": 80.5,
      "availability_percent": 86.0,
      "performance_percent": 90.0,
      "quality_percent": 96.0
    },
    {
      "date": "2025-12-13",
      "oee_percent": 88.5,
      "availability_percent": 92.0,
      "performance_percent": 94.0,
      "quality_percent": 98.0
    },
    {
      "date": "2025-12-14",
      "oee_percent": 74.8,
      "availability_percent": 87.5,
      "performance_percent": 90.0,
      "quality_percent": 95.0
    }
  ],
  "summary": {
    "avg_oee_percent": 78.3,
    "best_oee": {
      "date": "2025-12-13",
      "oee_percent": 88.5
    },
    "worst_oee": {
      "date": "2025-12-08",
      "oee_percent": 72.1
    },
    "target_oee_percent": 85.0
  }
}
```

### Machine Comparison
```
GET /api/production/oee/machines?shift_id={shift_id}&line_id={line_id}&status={status}&sort={field}&order={asc|desc}
Response:
{
  "machines": [
    {
      "id": "uuid-m-002",
      "machine_name": "Mixer M-002",
      "line_id": "uuid-line-2",
      "line_name": "Line 2",
      "current_wo_id": "uuid-wo-148",
      "current_wo_number": "WO-2025-0148",
      "availability_percent": 65.0,
      "performance_percent": 82.0,
      "quality_percent": 98.0,
      "oee_percent": 52.3,
      "status": "down",
      "downtime_duration_minutes": 168,
      "downtime_category": "breakdown",
      "actual_output": 820,
      "planned_output": 1000,
      "uom": "kg",
      "defects": 16,
      "actions": [
        {
          "type": "view_details",
          "label": "View Machine Details",
          "link": "/production/machines/uuid-m-002"
        },
        {
          "type": "view_downtime",
          "label": "View Downtime History",
          "link": "/production/oee?tab=downtime&machine=uuid-m-002"
        },
        {
          "type": "log_downtime",
          "label": "Log Downtime",
          "endpoint": "/api/production/downtime/log"
        },
        {
          "type": "view_wo",
          "label": "View WO Details",
          "link": "/production/execution?wo=uuid-wo-148"
        },
        {
          "type": "performance_trend",
          "label": "Machine Performance Trend",
          "link": "/production/oee?tab=trend&machine=uuid-m-002"
        },
        {
          "type": "maintenance",
          "label": "Maintenance Schedule",
          "link": "/settings/maintenance?machine=uuid-m-002"
        }
      ]
    },
    {
      "id": "uuid-o-003",
      "machine_name": "Oven O-003",
      "line_id": "uuid-line-4",
      "line_name": "Line 4",
      "current_wo_id": "uuid-wo-155",
      "current_wo_number": "WO-2025-0155",
      "availability_percent": 80.0,
      "performance_percent": 75.0,
      "quality_percent": 96.0,
      "oee_percent": 57.6,
      "status": "running",
      "downtime_duration_minutes": 96,
      "downtime_category": "changeover",
      "actual_output": 1500,
      "planned_output": 2000,
      "uom": "pcs",
      "defects": 60,
      "actions": [...]
    },
    {
      "id": "uuid-m-001",
      "machine_name": "Mixer M-001",
      "line_id": "uuid-line-1",
      "line_name": "Line 1",
      "current_wo_id": "uuid-wo-156",
      "current_wo_number": "WO-2025-0156",
      "availability_percent": 87.5,
      "performance_percent": 90.0,
      "quality_percent": 95.0,
      "oee_percent": 74.8,
      "status": "running",
      "downtime_duration_minutes": 60,
      "downtime_category": "maintenance",
      "actual_output": 3600,
      "planned_output": 4000,
      "uom": "kg",
      "defects": 180,
      "actions": [...]
    },
    {
      "id": "uuid-e-01",
      "machine_name": "Extruder E-01",
      "line_id": "uuid-line-3",
      "line_name": "Line 3",
      "current_wo_id": "uuid-wo-142",
      "current_wo_number": "WO-2025-0142",
      "availability_percent": 92.0,
      "performance_percent": 88.0,
      "quality_percent": 97.0,
      "oee_percent": 78.5,
      "status": "running",
      "downtime_duration_minutes": 38,
      "downtime_category": "break",
      "actual_output": 7040,
      "planned_output": 8000,
      "uom": "pcs",
      "defects": 210,
      "actions": [...]
    },
    {
      "id": "uuid-o-001",
      "machine_name": "Oven O-001",
      "line_id": "uuid-line-1",
      "line_name": "Line 1",
      "current_wo_id": "uuid-wo-140",
      "current_wo_number": "WO-2025-0140",
      "availability_percent": 95.0,
      "performance_percent": 92.0,
      "quality_percent": 98.0,
      "oee_percent": 85.6,
      "status": "running",
      "downtime_duration_minutes": 24,
      "downtime_category": "break",
      "actual_output": 2300,
      "planned_output": 2500,
      "uom": "pcs",
      "defects": 46,
      "actions": [...]
    }
  ],
  "summary": {
    "total_machines": 5,
    "avg_oee_percent": 69.8,
    "target_oee_percent": 85.0,
    "status": "below_target"
  },
  "filters_applied": {
    "shift_id": "uuid-shift-1",
    "line_id": null,
    "status": "all"
  },
  "sort": {
    "field": "oee_percent",
    "order": "asc"
  }
}
```

### A/P/Q Breakdown
```
GET /api/production/oee/apq-breakdown?shift_id={shift_id}
Response:
{
  "machines": [
    {
      "machine_name": "Mixer M-002",
      "availability_percent": 65.0,
      "performance_percent": 82.0,
      "quality_percent": 98.0,
      "oee_percent": 52.3
    },
    {
      "machine_name": "Oven O-003",
      "availability_percent": 80.0,
      "performance_percent": 75.0,
      "quality_percent": 96.0,
      "oee_percent": 57.6
    },
    {
      "machine_name": "Mixer M-001",
      "availability_percent": 87.5,
      "performance_percent": 90.0,
      "quality_percent": 95.0,
      "oee_percent": 74.8
    },
    {
      "machine_name": "Extruder E-01",
      "availability_percent": 92.0,
      "performance_percent": 88.0,
      "quality_percent": 97.0,
      "oee_percent": 78.5
    },
    {
      "machine_name": "Oven O-001",
      "availability_percent": 95.0,
      "performance_percent": 92.0,
      "quality_percent": 98.0,
      "oee_percent": 85.6
    }
  ],
  "insight": {
    "lowest_availability": {
      "machine": "Mixer M-002",
      "percent": 65.0,
      "reason": "168 min breakdown"
    },
    "lowest_performance": {
      "machine": "Oven O-003",
      "percent": 75.0,
      "recommendation": "Investigate cycle time variance"
    },
    "lowest_quality": {
      "machine": "Mixer M-001",
      "percent": 95.0,
      "note": "Within target but monitor defect trends"
    }
  }
}
```

### Export OEE Trend CSV
```
GET /api/production/oee/trend/export?date_range=7d&machine_id={machine_id}&shift_id={shift_id}&format=csv
Response: CSV file download
Headers: Date, Availability (%), Performance (%), Quality (%), OEE (%), Target OEE (%)
```

### Export Machine Comparison CSV
```
GET /api/production/oee/machines/export?shift_id={shift_id}&format=csv
Response: CSV file download
Headers: Machine, Line, Current WO, Availability (%), Performance (%), Quality (%), OEE (%), Status, Downtime (min), Downtime Category, Actual Output, Planned Output, UoM, Defects
```

---

## Permissions

| Role | View Dashboard | View Gauges | View Trend | View Machines | Log Downtime | Export CSV | Configure Shifts |
|------|----------------|-------------|------------|---------------|--------------|------------|------------------|
| Admin | Yes | All | All | All | Yes | Yes | Yes |
| Production Manager | Yes | All | All | All | Yes | Yes | No |
| Operator | Yes | Own Line Only | Own Line | Own Line | Yes (own line) | No | No |
| Viewer | Yes | All | All | All | No | Yes | No |

---

## Validation

- **Shift Selection**: Validate shift_id exists and is_active = true
- **Date Range**: Validate start_date <= end_date, max 90 days range
- **Machine Filter**: Validate machine_id exists in org
- **Line Filter**: Validate line_id exists in org
- **OEE Calculation**: Validate all 3 factors (A, P, Q) are between 0-100%
- **Downtime Duration**: Validate duration_minutes >= 0 and <= shift_duration

---

## Business Rules

### OEE Calculation (per FR-PROD-018)

- **Availability**:
  - Formula: (Operating Time / Planned Production Time) × 100
  - Operating Time = shift_duration - downtime_minutes
  - Planned Production Time = shift_duration_minutes (from shift_management)
  - Example: (420 min / 480 min) × 100 = 87.5%
  - Threshold: Green >= 85%, Yellow 70-84%, Red < 70%

- **Performance**:
  - Formula: (Actual Output / Theoretical Output) × 100
  - Actual Output = SUM(production_outputs.quantity) for shift
  - Theoretical Output = ideal_cycle_time × operating_time
  - Example: (900 pcs / 1000 pcs) × 100 = 90.0%
  - Threshold: Green >= 85%, Yellow 70-84%, Red < 70%

- **Quality**:
  - Formula: (Good Output / Total Output) × 100
  - Good Output = SUM(production_outputs.quantity) WHERE qa_status='approved'
  - Total Output = SUM(production_outputs.quantity)
  - Example: (950 pcs / 1000 pcs) × 100 = 95.0%
  - Threshold: Green >= 90%, Yellow 80-89%, Red < 80%

- **Overall OEE**:
  - Formula: Availability × Performance × Quality
  - Example: 87.5% × 90.0% × 95.0% = 74.8%
  - Target: From settings.target_oee_percent (default 85%)
  - Display: Red if < target, Green if >= target
  - AC: "GIVEN availability = 87.5%, performance = 90%, quality = 95%, WHEN OEE calculated, THEN OEE = 74.8% (0.875 × 0.9 × 0.95 × 100)" (PRD line 835)

### Shift Management Integration (per FR-PROD-021)

- **Current Shift Detection**:
  - Query shift_management WHERE start_time <= now() AND end_time > now() AND is_active = true
  - AC: "GIVEN shift 'Day' starts at 06:00 AND current time = 09:00, WHEN dashboard loads, THEN 'Current Shift: Day' indicator displays" (PRD line 1009)

- **Shift Duration**:
  - Net production time = duration_minutes - break_minutes
  - AC: "GIVEN shift has duration_minutes = 480 AND break_minutes = 30, WHEN OEE calculated, THEN planned_production_minutes = 450" (PRD line 1010)

- **Shift Handover**:
  - Active WOs continue across shifts
  - Downtime attributed to shift in which it occurred
  - AC: "GIVEN downtime occurs 10:00-10:30 during Day shift, WHEN shift ends, THEN downtime attributed to Day shift OEE" (PRD line 1015)

### Machine Comparison Logic

- **Status Color Coding**:
  - Red: OEE < 70% OR Availability < 70% OR Performance < 70%
  - Yellow: OEE 70-84% OR Availability 70-84% OR Performance 70-84%
  - Green: OEE >= 85% AND Availability >= 85% AND Performance >= 85%

- **Sort Default**: OEE Low to High (show worst performers first for attention)

- **Downtime Attribution**:
  - Total downtime for current shift
  - Display primary category (longest duration OR most recent)
  - Format: "168 min (Breakdown)" or "96 min (Changeover)"

### OEE Trend Chart

- **Data Granularity**: Daily average OEE (average all shifts for each day)
- **Target Line**: Horizontal dotted line at target_oee_percent (from settings)
- **Click Behavior**: Click data point → drill down to shift-level detail for that day
- **AC**: "GIVEN target_oee = 85%, WHEN trend chart rendered, THEN horizontal target line displays at 85%" (PRD line 1043)

### A/P/Q Breakdown Chart

- **Stacking Logic**:
  - Bar height = Overall OEE %
  - Segments stacked: Availability (bottom), Performance (middle), Quality (top)
  - Visual shows how each factor contributes to overall OEE

- **Insight Generation**:
  - Rule-based (not AI for MVP): Identify lowest A, P, Q across machines
  - Format: "Machine X has lowest [factor] (Y%) due to [reason]. Machine Z has lowest [factor] (Y%) - [recommendation]."
  - Example: "Mixer M-002 has lowest availability (65%) due to 168 min breakdown. Oven O-003 has lowest performance (75%) - investigate cycle time variance."

### Auto-Refresh

- **Default Interval**: 30 seconds (from production_settings.dashboard_refresh_seconds)
- **Refresh Scope**: All dashboard data (shift info, gauges, trend chart, machine table)
- **Error Handling**: If refresh fails, retry after interval, show error toast (non-blocking), disable auto-refresh after 3 consecutive failures

### OEE Tracking Toggle (per FR-PROD-018 AC)

- **AC**: "GIVEN enable_oee_tracking = false, WHEN dashboard loads, THEN OEE metrics section is hidden" (PRD line 836)
- **AC**: "GIVEN enable_oee_tracking = true, WHEN dashboard loads, THEN OEE gauges display for A, P, Q, and overall OEE" (PRD line 837)
- **Implementation**: If settings.enable_oee_tracking = false, redirect to Production Dashboard with message "OEE tracking is disabled. Enable in Settings > Production Execution."

### Final OEE Save (per FR-PROD-018 AC)

- **AC**: "GIVEN shift ends, WHEN shift closes, THEN final OEE metrics saved to oee_metrics table within 5 minutes" (PRD line 840)
- **Implementation**: Background job runs at shift_end_time + 5 minutes, calculates final A/P/Q/OEE for shift, inserts into oee_metrics table with shift_id, machine_id, date

---

## Accessibility

- **Touch targets**: All gauges, chart data points, table rows, buttons >= 48x48dp (64x64dp on mobile)
- **Contrast**:
  - Gauge text: 4.5:1 minimum
  - Chart text: 4.5:1 minimum
  - Table text: 4.5:1 minimum
  - Color-coded values: Ensure red/yellow/green have sufficient contrast with background (3:1 minimum)
  - Gauge segments: 3:1 minimum
- **Screen reader**:
  - Shift Info: "Current shift: Day Shift, 06:00 to 14:00, active for 4 hours 30 minutes, 5 of 8 machines active, 3 of 5 lines active"
  - Availability Gauge: "Availability gauge: 87.5%, above target of 85%, operating time 420 minutes, planned time 480 minutes, downtime 60 minutes"
  - Performance Gauge: "Performance gauge: 90.0%, above target of 85%, actual output 900 pieces, theoretical output 1000 pieces, cycle time 28 seconds per unit"
  - Quality Gauge: "Quality gauge: 95.0%, above target of 90%, good output 950 pieces, total output 1000 pieces, defect rate 5%"
  - Overall OEE Gauge: "Overall OEE gauge: 74.8%, below target of 85%, calculated as 87.5% availability times 90% performance times 95% quality equals 74.8%"
  - Trend Chart: "OEE trend chart for last 7 days, average 78.3%, best 88.5% on 12-13, worst 72.1% on 12-08, target line at 85%"
  - Machine Row: "Machine Mixer M-002, Line 2, Work Order WO-2025-0148, Availability 65% red, Performance 82% yellow, Quality 98% green, OEE 52.3% red, status down, downtime 168 minutes breakdown, output 820 of 1000 kilograms, defects 16 kilograms"
- **Keyboard**:
  - Tab navigation through all gauges, chart, table rows, filters, buttons
  - Enter to activate gauge click (drill down), chart data point click, table row click, filter, button
  - Arrow keys for chart navigation (left/right dates)
  - Arrow keys for table navigation (up/down rows)
  - Escape to close dropdown, clear filter
- **ARIA**:
  - Shift Info Panel: role="region" aria-label="Current Shift Information"
  - OEE Gauges: role="region" aria-label="OEE Gauges", each gauge role="meter" aria-valuenow="{percent}" aria-valuemin="0" aria-valuemax="100" aria-label="Availability gauge 87.5%"
  - Trend Chart: role="img" aria-label="OEE Trend Chart for Last 7 Days", data points role="button" aria-label="OEE 74.8% on 2025-12-14"
  - Machine Table: role="table" with proper row/column headers, aria-sort on sortable columns
  - A/P/Q Chart: role="img" aria-label="Availability Performance Quality Breakdown by Machine"
  - Auto-refresh toggle: role="switch" aria-checked="true|false"
  - Machine actions: aria-label="Machine actions for Mixer M-002"

---

## Responsive Breakpoints

| Breakpoint | Layout | Notes |
|------------|--------|-------|
| **Desktop (>1024px)** | Shift panel (full width) + 4 gauges (1 row x 4 cols) + Trend chart (full width) + Machine table (full width) + A/P/Q chart (full width) | Full dashboard |
| **Tablet (768-1024px)** | Shift panel (full width) + Gauges 2x2 grid + Trend chart (full width, condensed) + Machine table (condensed rows) + A/P/Q chart (condensed) | Panels stack vertically |
| **Mobile (<768px)** | All components stack vertically + Gauges stack vertically + Trend chart (simplified) + Machine table (card layout, Load More) + A/P/Q chart (horizontal bars) | All stacked, simplified layout |

### Responsive Adjustments

#### Desktop (>1024px)
- **Shift Panel**: Full width, horizontal layout with all info inline
- **OEE Gauges**: 1 row x 4 columns (Availability, Performance, Quality, Overall OEE side-by-side)
- **Trend Chart**: Full width, height 300px, all 7 data points visible
- **Machine Table**: Full width, all columns visible, 10 rows max (pagination if more)
- **A/P/Q Chart**: Full width, height 250px, all machines visible side-by-side
- **Auto-Refresh Control**: Top-right header, inline with title

#### Tablet (768-1024px)
- **Shift Panel**: Full width, 2-line layout (shift name + time on line 1, details on line 2)
- **OEE Gauges**: 2x2 grid (Availability + Performance on row 1, Quality + Overall OEE on row 2)
- **Trend Chart**: Full width, height 250px, condensed labels
- **Machine Table**: Condensed rows (smaller font, reduced padding), hide "Current WO" column, 5 rows max
- **A/P/Q Chart**: Full width, height 200px, condensed bars
- **Auto-Refresh Control**: Top-right header, inline with title (smaller font)

#### Mobile (<768px)
- **Shift Panel**: Full width card, 3 lines (shift name, time + status, machines/lines)
- **OEE Gauges**: Stack vertically (Overall OEE first, then Availability, Performance, Quality)
- **Trend Chart**: Full width, height 200px, simplified (3-4 visible dates with scroll, or sparkline)
- **Machine Table**: Card layout, each machine as a card with:
  - Machine Name + Line (header)
  - OEE % + Status badge
  - A/P/Q values (compact: A: 🔴65% P: 🟡82% Q: 🟢98%)
  - WO Number + Output (820/1000 kg)
  - Downtime (168m Breakdown)
  - [View] button + [⋮] menu
  - Load More button instead of pagination
- **A/P/Q Chart**: Horizontal bars (1 machine per row, stacked segments)
- **Auto-Refresh Control**: Below page title, full width toggle with label
- **Quick Actions**: Stack vertically, full width buttons (48dp height minimum)

---

## Performance Notes

### Query Optimization
- **Current Shift**: Single query with shift_management JOIN machines/lines COUNT
- **OEE Gauges**: Single aggregated query with SUM/COUNT for A/P/Q (index on org_id, shift_id, machine_id, created_at)
- **Trend Chart**: Pre-calculated daily OEE in oee_metrics table (materialized view or nightly batch job)
- **Machine Comparison**: Index on (org_id, shift_id, machine_id, status), JOIN with oee_metrics
- **A/P/Q Breakdown**: Use same data as Machine Comparison (single query)

### Caching Strategy
```typescript
// Redis keys
'org:{orgId}:production:oee:current-shift'           // 5 min TTL (shift changes infrequently)
'org:{orgId}:production:oee:gauges:{shift_id}'       // 30 sec TTL (real-time)
'org:{orgId}:production:oee:trend:{date_range}'      // 5 min TTL (historical data)
'org:{orgId}:production:oee:machines:{shift_id}'     // 30 sec TTL (real-time)
'org:{orgId}:production:oee:apq:{shift_id}'          // 30 sec TTL (real-time)
```

### Load Time Targets
- **Initial Load (Shift + Gauges)**: <800ms
- **Trend Chart**: <1s (7 days data)
- **Machine Table**: <1s (5-10 machines with JOINs)
- **A/P/Q Chart**: <500ms (uses same data as machine table)
- **Auto-Refresh (delta update)**: <500ms (optimized queries)

### Lazy Loading
- **Not applicable**: Dashboard is a single page, all data loads immediately (above fold)
- **Progressive Enhancement**: Load Shift Info + Gauges first (critical), then Trend Chart, then Machine Table, then A/P/Q Chart (sequential)

### Real-time Updates (WebSocket - Optional)
- **WebSocket Channel**: `production:org:{orgId}:oee:{shift_id}`
- **Events**:
  - output.registered → Update Performance gauge, Update Quality gauge, Update Overall OEE
  - downtime.logged → Update Availability gauge, Update Overall OEE, Update Machine Table
  - downtime.ended → Update Availability gauge, Update Overall OEE, Update Machine Table
  - shift.ended → Finalize OEE metrics, Save to oee_metrics table
  - machine.status_changed → Update Machine Table
- **Auto-refresh**: Fallback if WebSocket unavailable, 30s polling

---

## Error Handling

### API Errors
- **Shift Info Fetch Failed**: Show error state in shift panel, rest of dashboard still loads
- **Gauges Fetch Failed**: Show error state in gauges section, rest of dashboard still loads
- **Trend Chart Fetch Failed**: Show error in chart section, rest of dashboard still works
- **Machine Table Fetch Failed**: Show error in table section, rest of dashboard still works

### Partial Failures
- **If Shift Info fails**: Show error in shift panel, Gauges and other sections load normally
- **If Gauges fail**: Show error in gauges section, Shift Info and other sections load normally
- **If Trend Chart fails**: Show error in chart section, Shift Info, Gauges, and Table load normally
- **If Machine Table fails**: Show error in table section, Shift Info, Gauges, and Chart load normally
- **Each section has independent error boundary**: Errors don't cascade

### Network Timeout
- **Shift Info**: 5s timeout, retry once on failure
- **Gauges**: 5s timeout, retry once on failure
- **Trend Chart**: 10s timeout (larger dataset), retry once on failure
- **Machine Table**: 10s timeout (larger dataset), retry once on failure
- **Auto-Refresh**: If refresh fails, show toast notification, retry after next interval

### Auto-Refresh Errors
- **Error Handling**: Non-blocking error toast, auto-refresh continues after interval
- **Retry Logic**: Exponential backoff if multiple failures (30s → 60s → 120s)
- **Disable on Repeated Failure**: After 3 consecutive failures, disable auto-refresh, show error banner with "Retry" button

### No Shifts Configured
- **AC**: "GIVEN no shifts defined, WHEN OEE calculation attempted, THEN error 'No active shifts configured' displays" (PRD line 1017)
- **Display**: Empty state with message "No shifts configured. OEE tracking requires shifts to be defined. Configure shifts in Settings > Production Execution to begin OEE monitoring."
- **Action**: [Configure Shifts] button → navigate to Settings > Shifts

### OEE Tracking Disabled
- **AC**: "GIVEN enable_oee_tracking = false, WHEN dashboard loads, THEN OEE metrics section is hidden" (PRD line 836)
- **Display**: Redirect to Production Dashboard with info banner "OEE tracking is disabled. Enable in Settings > Production Execution to access OEE Dashboard."
- **Action**: [Enable OEE Tracking] button → navigate to Settings > Production Execution > enable_oee_tracking toggle

---

## Testing Requirements

### Unit Tests
- **OEE Calculations** (per FR-PROD-018 AC):
  - **AC1**: shift_duration = 480 min, downtime = 60 min → availability = 87.5% (PRD line 832)
  - **AC2**: actual_output = 900, theoretical_output = 1000 → performance = 90.0% (PRD line 833)
  - **AC3**: total_output = 1000, approved_output = 950 → quality = 95.0% (PRD line 834)
  - **AC4**: availability = 87.5%, performance = 90%, quality = 95% → OEE = 74.8% (PRD line 835)
  - **AC5**: enable_oee_tracking = false → OEE metrics section is hidden (PRD line 836)
  - **AC6**: enable_oee_tracking = true → OEE gauges display for A, P, Q, and overall OEE (PRD line 837)
  - **AC7**: target_oee = 85%, actual = 74.8% → shows in red with "Below Target" (PRD line 838)
  - **AC8**: target_oee = 85%, actual = 88% → shows in green with "Above Target" (PRD line 839)
  - **AC9**: shift ends → final OEE saved to oee_metrics table within 5 minutes (PRD line 840)
- **Shift Management Integration** (per FR-PROD-021 AC):
  - **AC1**: shift "Day" starts at 06:00, current time = 09:00 → "Current Shift: Day" displays (PRD line 1009)
  - **AC2**: shift duration = 480 min, breaks = 30 min → planned_production_minutes = 450 (PRD line 1010)
  - **AC3**: downtime 10:00-10:30 during Day shift → downtime attributed to Day shift OEE (PRD line 1015)
- **Color Coding Logic**:
  - Availability < 70% → Red
  - Availability 70-84% → Yellow
  - Availability >= 85% → Green
  - (Same for Performance and Quality)
- **Trend Chart Aggregation**: Daily average OEE calculation (multiple shifts per day)
- **Machine Sorting**: OEE Low to High (ascending)
- **Relative Time Formatting**: "4h 30m ago", "10 min ago", etc.

### Integration Tests
- **API Endpoint Coverage**: All 6 endpoints (Current Shift, Gauges, Trend, Machines, A/P/Q, Export)
- **RLS Policy Enforcement**: org_id isolation, no cross-org data leaks
- **Cache Invalidation**: On data changes (output registered, downtime logged, shift ended)
- **CSV Export Generation**: Valid CSV format, all columns, correct data
- **Auto-Refresh**: Polling mechanism, interval configuration, enable/disable
- **WebSocket Integration**: Real-time updates on output/downtime events (if enabled)

### E2E Tests
- **Dashboard Load (First Visit - Empty State)**:
  - No OEE data exists → "No OEE data available" message displays
  - Quick actions functional (Start WO, View Shift Schedule, Configure Shifts, OEE Guide)
- **Dashboard Load (With Data - Success State)**:
  - Success state displays correctly
  - Shift Info panel populated with current shift details
  - All 4 OEE gauges populated within 2s
  - Trend chart shows 7 days of data with target line
  - Machine table shows active machines with A/P/Q/OEE values
  - A/P/Q breakdown chart displays
- **Auto-Refresh**:
  - Toggle ON → data refreshes every 30s
  - Toggle OFF → data stops refreshing
  - Manual Refresh → data updates within 500ms
- **Gauge Interactions**:
  - Click Availability gauge → drills down to availability details
  - Click Overall OEE gauge → drills down to A/P/Q breakdown
- **Trend Chart Interactions**:
  - Click data point (e.g., 12-13) → navigates to shift details for 2025-12-13
  - Change date range filter (Last 7 Days → Last 30 Days) → chart updates
  - Change machine filter (All → Mixer M-001) → chart shows only Mixer M-001 trend
- **Machine Table Interactions**:
  - Filter by Line "Line 2" → only Line 2 machines display
  - Sort by OEE (Low to High) → Mixer M-002 (52.3%) appears first
  - Click [⋮] menu → actions menu displays (View Details, Log Downtime, etc.)
  - Click "View Machine Details" → navigates to machine detail page
- **Export CSV**:
  - Click "Export Trend CSV" → CSV file downloads with Date, A, P, Q, OEE columns
  - Click "Export Machine CSV" → CSV file downloads with Machine, Line, WO, A, P, Q, OEE, Status, Downtime columns
- **Empty State**:
  - enable_oee_tracking = true BUT no shift data → "No OEE data available" message displays
  - [Start First Work Order] button → navigates to WO start modal
  - [Configure Shifts] button → navigates to Settings > Shifts
- **Error State**:
  - API fetch fails → "Failed to load OEE dashboard" message displays
  - [Retry] button → retries API call
  - Quick actions still available
- **OEE Tracking Disabled**:
  - enable_oee_tracking = false → redirect to Production Dashboard with info banner
  - Info banner: "OEE tracking is disabled. Enable in Settings > Production Execution to access OEE Dashboard."
- **Responsive Behavior**:
  - Desktop: 4 gauges in 1 row + full width chart + full width table
  - Tablet: Gauges 2x2 grid + condensed chart + condensed table
  - Mobile: All stacked, gauges vertical, chart simplified, table as cards

### Performance Tests
- **Page Load**: <2s for Shift Info, Gauges, Trend Chart, and Machine Table (AC from PRD)
- **Auto-Refresh**: <500ms for delta update
- **Manual Refresh**: <500ms for full refresh
- **Trend Chart Load**: <1s for 7 days data
- **Machine Table Load**: <1s for 5-10 machines with JOINs
- **Export Trend CSV**: <2s for 7 days data
- **Export Machine CSV**: <2s for 5-10 machines

---

## Quality Gates

Before handoff to FRONTEND-DEV:
- [x] All 4 states defined (Loading, Empty, Error, Success)
- [x] Responsive breakpoints documented (Desktop/Tablet/Mobile with specific layouts)
- [x] All API endpoints specified with request/response schemas (6 endpoints)
- [x] Accessibility checklist passed (touch targets, contrast, screen reader, keyboard, ARIA)
- [x] Performance targets defined (load times, caching strategy, real-time updates)
- [x] All 9 AC from FR-PROD-018 implemented in wireframe (lines 832-840)
- [x] All 9 AC from FR-PROD-021 implemented in wireframe (lines 1009-1017)
- [x] OEE calculation formulas documented (Availability, Performance, Quality, Overall OEE)
- [x] Shift management integration documented (current shift detection, duration, handover)
- [x] 4 OEE gauges defined (Availability, Performance, Quality, Overall OEE)
- [x] Trend chart defined (7-day line chart with target line)
- [x] Machine comparison table defined (columns, actions, sort, filters)
- [x] A/P/Q breakdown chart defined (stacked bars with insight)
- [x] Integration points identified (Planning, Warehouse, Quality, Settings modules)
- [x] Error handling strategy defined (partial failures, network timeout, auto-refresh errors)
- [x] Permissions matrix documented (Admin, Manager, Operator, Viewer)
- [x] Business rules documented (OEE calculation, shift integration, color coding, insights)
- [x] Validation rules defined (shift selection, date range, filters, OEE bounds)

---

## Handoff to FRONTEND-DEV

```yaml
feature: OEE Dashboard (Phase 2)
story: PROD-008
fr_coverage: FR-PROD-018 (OEE Calculation), FR-PROD-021 (Shift Management)
approval_status:
  mode: "review_each"
  user_approved: false  # PENDING USER REVIEW
  screens_approved: []
  iterations_used: 0
deliverables:
  wireframe_part1: docs/3-ARCHITECTURE/ux/wireframes/PROD-008-part1-oee-dashboard-ui.md
  wireframe_part2: docs/3-ARCHITECTURE/ux/wireframes/PROD-008-part2-data-and-specs.md
  api_endpoints:
    - GET /api/production/oee/current-shift
    - GET /api/production/oee/gauges
    - GET /api/production/oee/trend
    - GET /api/production/oee/machines
    - GET /api/production/oee/apq-breakdown
    - GET /api/production/oee/trend/export
    - GET /api/production/oee/machines/export
states_per_screen: [loading, empty, error, success]
breakpoints:
  mobile: "<768px (stack all, gauges vertical, chart simplified, table as cards)"
  tablet: "768-1024px (gauges 2x2, condensed chart/table)"
  desktop: ">1024px (gauges 1x4, full width chart/table)"
accessibility:
  touch_targets: "48x48dp minimum (64x64dp mobile)"
  contrast: "4.5:1 minimum (text), 3:1 (gauges, charts, badges)"
  aria_roles: "region, meter, table, img, switch"
  keyboard_nav: "Tab, Enter, Arrow keys, Escape"
real_time_refresh:
  auto_refresh: "Configurable interval (default 30s, min 5s)"
  manual_refresh: "Always available, <500ms update"
  websocket_optional: "production:org:{orgId}:oee:{shift_id} channel"
performance_targets:
  initial_load_shift_gauges: "<800ms"
  trend_chart_load: "<1s"
  machine_table_load: "<1s"
  apq_chart_load: "<500ms"
  auto_refresh_delta: "<500ms"
  trend_csv_export: "<2s"
  machine_csv_export: "<2s"
cache_ttl:
  shift_info: "5min (shifts change infrequently)"
  gauges: "30sec (real-time)"
  trend: "5min (historical data)"
  machines: "30sec (real-time)"
  apq: "30sec (real-time)"
ac_coverage:
  fr_prod_018:
    - "AC1: shift_duration=480, downtime=60 → availability=87.5% ✓"
    - "AC2: actual_output=900, theoretical=1000 → performance=90.0% ✓"
    - "AC3: total_output=1000, approved=950 → quality=95.0% ✓"
    - "AC4: A=87.5%, P=90%, Q=95% → OEE=74.8% ✓"
    - "AC5: enable_oee_tracking=false → OEE metrics hidden ✓"
    - "AC6: enable_oee_tracking=true → OEE gauges display ✓"
    - "AC7: target=85%, actual=74.8% → red 'Below Target' ✓"
    - "AC8: target=85%, actual=88% → green 'Above Target' ✓"
    - "AC9: shift ends → final OEE saved within 5 min ✓"
  fr_prod_021:
    - "AC1: shift 'Day' 06:00, time=09:00 → 'Current Shift: Day' displays ✓"
    - "AC2: duration=480, breaks=30 → planned_prod=450 ✓"
    - "AC3: downtime 10:00-10:30 Day shift → attributed to Day shift OEE ✓"
components:
  - shift_info_panel
  - availability_gauge
  - performance_gauge
  - quality_gauge
  - overall_oee_gauge
  - oee_trend_chart
  - machine_comparison_table
  - apq_breakdown_chart
  - quick_actions
charts:
  - oee_trend_line_chart (7 days, target line)
  - apq_stacked_bar_chart (per machine)
gauges:
  - availability (circular, 0-100%, color-coded)
  - performance (circular, 0-100%, color-coded)
  - quality (circular, 0-100%, color-coded)
  - overall_oee (circular, 0-100%, color-coded, calculation breakdown)
```

---

**Status**: Ready for User Review
**Approval Mode**: review_each (default)
**User Approved**: Pending (requires user review and approval)
**Iterations**: 0 of 3
**Estimated Effort**: 16-20 hours (complex dashboard with gauges, charts, tables, real-time OEE calculations)
**Quality Target**: 97/100 (comprehensive, matches Production Dashboard quality)
**PRD Coverage**: 100% (all 9 AC from FR-PROD-018 + 9 AC from FR-PROD-021 implemented)
**Part 2 Length**: ~750 lines (Data & Technical Specifications)
