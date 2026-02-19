# OEE-001: Real-Time Machine Dashboard

**Module**: OEE (Overall Equipment Effectiveness)
**Feature**: Real-Time Machine Monitoring (PRD Section 10.1)
**Status**: Ready for Implementation
**Last Updated**: 2026-01-15

---

## ASCII Wireframe

### Success State (Desktop - Populated)

```
+--------------------------------------------------------------------------------------------------+
|  OEE > Machine Dashboard                                   Shift: [Day Shift v]  [Auto-Refresh]  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Plant Overview                                                  Last Updated: 2 seconds ago |   |
|  |                                                                                            |   |
|  |  +--------------------+  +--------------------+  +--------------------+  +---------------+ |   |
|  |  | Plant OEE          |  | Availability       |  | Performance        |  | Quality       | |   |
|  |  | 78.5%              |  | 87.2%              |  | 91.5%              |  | 98.4%         | |   |
|  |  | ▆▆▆▆▆▆▆▆░░         |  | ▆▆▆▆▆▆▆▆▆░         |  | ▆▆▆▆▆▆▆▆▆░         |  | ▆▆▆▆▆▆▆▆▆▆    | |   |
|  |  | Target: 85%        |  | Target: 90%        |  | Target: 95%        |  | Target: 99%   | |   |
|  |  +--------------------+  +--------------------+  +--------------------+  +---------------+ |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Machines (6 Active)                                          [Grid View] [List View]       |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +----------------------+  +----------------------+  +----------------------+                     |
|  | Mixer Line 1         |  | Oven Line 1          |  | Packaging Line 1     |                     |
|  | Status: [🟢 Running] |  | Status: [🟢 Running] |  | Status: [🔴 Down]    |                     |
|  +----------------------+  +----------------------+  +----------------------+                     |
|  |                      |  |                      |  |                      |                     |
|  |       OEE            |  |       OEE            |  |       OEE            |                     |
|  |                      |  |                      |  |                      |                     |
|  |        82%           |  |        89%           |  |        0%            |                     |
|  |    ╭────────╮        |  |    ╭────────╮        |  |    ╭────────╮        |                     |
|  |   ╱          ╲       |  |   ╱          ╲       |  |   ╱          ╲       |                     |
|  |  │            │      |  |  │            │      |  |  │            │      |                     |
|  |  │     82     │      |  |  │     89     │      |  |  │     0      │      |                     |
|  |  │            │      |  |  │            │      |  |  │            │      |                     |
|  |   ╲          ╱       |  |   ╲          ╱       |  |   ╲          ╱       |                     |
|  |    ╰────────╯        |  |    ╰────────╯        |  |    ╰────────╯        |                     |
|  |                      |  |                      |  |                      |                     |
|  | A: 92% P: 95% Q: 94% |  | A: 96% P: 95% Q: 98% |  | A: 0%  P: 0%  Q: 0%  |                     |
|  |                      |  |                      |  |                      |                     |
|  | Work Order:          |  | Work Order:          |  | Work Order:          |                     |
|  | WO-2026-00142        |  | WO-2026-00138        |  | WO-2026-00145        |                     |
|  | Organic Sourdough    |  | Premium Burger       |  | Vegan Nuggets        |                     |
|  |                      |  |                      |  |                      |                     |
|  | Running: 2h 15m      |  | Running: 4h 42m      |  | Down: 18 minutes     |                     |
|  | Downtime: 0m (0%)    |  | Downtime: 12m (4%)   |  | Reason: Mechanical   |                     |
|  |                      |  |                      |  |                      |                     |
|  | [View Details]       |  | [View Details]       |  | [Log Event]          |                     |
|  +----------------------+  +----------------------+  +----------------------+                     |
|                                                                                                  |
|  +----------------------+  +----------------------+  +----------------------+                     |
|  | Slicer Line 1        |  | Proofer Line 1       |  | Cooling Conveyor 1   |                     |
|  | Status: [🟡 Idle]    |  | Status: [🟢 Running] |  | Status: [🟠 Reduced] |                     |
|  +----------------------+  +----------------------+  +----------------------+                     |
|  |                      |  |                      |  |                      |                     |
|  |       OEE            |  |       OEE            |  |       OEE            |                     |
|  |                      |  |                      |  |                      |                     |
|  |        0%            |  |        76%           |  |        64%           |                     |
|  |    ╭────────╮        |  |    ╭────────╮        |  |    ╭────────╮        |                     |
|  |   ╱          ╲       |  |   ╱          ╲       |  |   ╱          ╲       |                     |
|  |  │            │      |  |  │            │      |  |  │            │      |                     |
|  |  │     0      │      |  |  │     76     │      |  |  │     64     │      |                     |
|  |  │            │      |  |  │            │      |  |  │            │      |                     |
|  |   ╲          ╱       |  |   ╲          ╱       |  |   ╲          ╱       |                     |
|  |    ╰────────╯        |  |    ╰────────╯        |  |    ╰────────╯        |                     |
|  |                      |  |                      |  |                      |                     |
|  | A: 0%  P: 0%  Q: 0%  |  | A: 88% P: 92% Q: 94% |  | A: 100% P: 64% Q: 100%|                     |
|  |                      |  |                      |  |                      |                     |
|  | No WO assigned       |  | Work Order:          |  | Work Order:          |                     |
|  |                      |  | WO-2026-00140        |  | WO-2026-00142        |                     |
|  | Awaiting changeover  |  | Gluten Free Pizza    |  | Organic Sourdough    |                     |
|  |                      |  |                      |  |                      |                     |
|  | Idle: 45 minutes     |  | Running: 3h 28m      |  | Running: 2h 15m      |                     |
|  | Next WO: 00143       |  | Downtime: 18m (8%)   |  | Reduced speed: 64%   |                     |
|  |                      |  |                      |  |                      |                     |
|  | [Start Production]   |  | [View Details]       |  | [View Details]       |                     |
|  +----------------------+  +----------------------+  +----------------------+                     |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+

Machine Status Legend:
🟢 Running - Producing at normal speed, OEE being tracked
🔴 Down - Machine stopped, downtime event active
🟡 Idle - Machine not assigned to work order, available
🟠 Reduced Speed - Running below target speed, performance loss
```

### Machine Detail Modal (Clicked "View Details")

```
+--------------------------------------------------------------------------------------------------+
|  Machine Details: Oven Line 1                                                          [x Close] |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Current Status                                                  Last Updated: 1 second ago |   |
|  |                                                                                            |   |
|  | Status: [🟢 Running]  |  OEE: 89%  |  Shift: Day Shift                                   |   |
|  | Work Order: WO-2026-00138 (Premium Burger)                                                |   |
|  | Running Time: 4h 42m  |  Total Downtime Today: 12m                                        |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +------------------------------------------+  +-------------------------------------------+    |
|  | OEE Components                           |  | Real-Time Production                      |    |
|  |                                          |  |                                           |    |
|  | Availability:     96%  ▆▆▆▆▆▆▆▆▆▆        |  | Target Rate: 500 units/hour               |    |
|  | Target: 90%            Above Target ✓    |  | Current Rate: 475 units/hour              |    |
|  |                                          |  | Performance: 95%                          |    |
|  | Performance:      95%  ▆▆▆▆▆▆▆▆▆░        |  |                                           |    |
|  | Target: 95%            On Target ✓       |  | Produced Today: 2,375 units               |    |
|  |                                          |  | Rejected: 48 units (2%)                   |    |
|  | Quality:          98%  ▆▆▆▆▆▆▆▆▆▆        |  | Good Output: 2,327 units                  |    |
|  | Target: 99%            Below Target ⚠️   |  |                                           |    |
|  |                                          |  | [View Production Log]                     |    |
|  +------------------------------------------+  +-------------------------------------------+    |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Downtime Events Today (3)                                                                  |   |
|  |                                                                                            |   |
|  | Time      | Duration | Reason                        | Logged By      | Status            |   |
|  | ------------------------------------------------------------------------------            |   |
|  | 8:15 AM   | 5 min    | Changeover to Premium Burger  | John Smith     | ✓ Resolved       |   |
|  | 10:32 AM  | 4 min    | Minor jam - conveyor belt     | Sarah Miller   | ✓ Resolved       |   |
|  | 11:48 AM  | 3 min    | Quality check hold            | Mike Johnson   | ✓ Resolved       |   |
|  |                                                                                            |   |
|  | Total Downtime: 12 minutes (4% of shift)                                                  |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Hourly Performance (Today)                                                                 |   |
|  |                                                                                            |   |
|  | OEE%                                                                                       |   |
|  | 100  |                                                                                     |   |
|  |  95  |        ●────●────●────●────●                                                       |   |
|  |  90  |   ●───╱                                                                             |   |
|  |  85  |  ╱                                                                                  |   |
|  |  80  | ●                                                                                    |   |
|  |  75  +-----+-----+-----+-----+-----+-----+-----+-----+-----+->                            |   |
|  |       6AM  7AM  8AM  9AM  10AM 11AM 12PM  1PM  2PM  3PM                                  |   |
|  |                                                                                            |   |
|  | Legend: ● OEE %  ----- Target (85%)                                                       |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  [Log Downtime Event] [Generate Report] [Export Data]                              [Close]      |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Success State (Mobile: < 768px)

```
+----------------------------------+
|  < Machine Dashboard             |
|  [Day Shift v] [Auto ✓]          |
+----------------------------------+
|                                  |
|  Plant OEE: 78.5% (Target: 85%)  |
|  ▆▆▆▆▆▆▆▆░░                      |
|                                  |
|  Machines (6 Active)             |
|  +----------------------------+  |
|  | Mixer Line 1         [🟢] |  |
|  | OEE: 82%                   |  |
|  | A:92% P:95% Q:94%          |  |
|  | WO-2026-00142              |  |
|  | Running: 2h 15m            |  |
|  | [View]                     |  |
|  +----------------------------+  |
|  | Oven Line 1          [🟢] |  |
|  | OEE: 89%                   |  |
|  | A:96% P:95% Q:98%          |  |
|  | WO-2026-00138              |  |
|  | Running: 4h 42m            |  |
|  | [View]                     |  |
|  +----------------------------+  |
|  | Packaging Line 1     [🔴] |  |
|  | OEE: 0% (DOWN)             |  |
|  | Down: 18 minutes           |  |
|  | Reason: Mechanical         |  |
|  | [Log Event]                |  |
|  +----------------------------+  |
|  | Slicer Line 1        [🟡] |  |
|  | OEE: 0% (IDLE)             |  |
|  | Awaiting changeover        |  |
|  | [Start]                    |  |
|  +----------------------------+  |
|  | [View All (6)]             |  |
|                                  |
+----------------------------------+
```

### Loading State

```
+--------------------------------------------------------------------------------------------------+
|  OEE > Machine Dashboard                                   Shift: [Day Shift v]  [Auto-Refresh]  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Plant Overview                                                                             |   |
|  | [░░░░░░░░░░░]  [░░░░░░░░░░░]  [░░░░░░░░░░░]  [░░░░░░░░░░░]                              |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +----------------------+  +----------------------+  +----------------------+                     |
|  | [░░░░░░░░░░░░░░░░]   |  | [░░░░░░░░░░░░░░░░]   |  | [░░░░░░░░░░░░░░░░]   |                     |
|  | [░░░░░░░]            |  | [░░░░░░░]            |  | [░░░░░░░]            |                     |
|  | [░░░░░░░░░░░░░░░░]   |  | [░░░░░░░░░░░░░░░░]   |  | [░░░░░░░░░░░░░░░░]   |                     |
|  +----------------------+  +----------------------+  +----------------------+                     |
|                                                                                                  |
|  Loading machine data...                                                                         |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Empty State

```
+--------------------------------------------------------------------------------------------------+
|  OEE > Machine Dashboard                                   Shift: [Day Shift v]  [Auto-Refresh]  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|                                                                                                  |
|                                         [Machine Icon]                                           |
|                                                                                                  |
|                                  No Machines Configured                                          |
|                                                                                                  |
|                     No machines have been set up for OEE tracking.                               |
|                     Configure your production lines and equipment to start                       |
|                     monitoring Overall Equipment Effectiveness.                                  |
|                                                                                                  |
|                                                                                                  |
|                                    [+ Add First Machine]                                         |
|                                                                                                  |
|                                                                                                  |
|                     Next Steps:                                                                  |
|                     1. Define machines/lines in OEE Settings                                     |
|                     2. Set target OEE, availability, performance, quality rates                  |
|                     3. Configure downtime reason codes                                           |
|                     4. Train operators on event logging                                          |
|                                                                                                  |
|                              [Go to OEE Settings]                                                |
|                                                                                                  |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Error State

```
+--------------------------------------------------------------------------------------------------+
|  OEE > Machine Dashboard                                   Shift: [Day Shift v]  [Auto-Refresh]  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|                                                                                                  |
|                                         [Warning Icon]                                           |
|                                                                                                  |
|                               Failed to Load Machine Data                                        |
|                                                                                                  |
|                     Unable to retrieve real-time machine status.                                 |
|                     Please check your connection and try again.                                  |
|                                                                                                  |
|                                Error: MACHINE_DASHBOARD_FETCH_FAILED                             |
|                                                                                                  |
|                                                                                                  |
|                                  [Retry]    [Contact Support]                                    |
|                                                                                                  |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

---

## Key Components

### 1. Plant Overview Metrics

Plant-level OEE summary across all machines.

| Metric | Calculation | Display |
|--------|-------------|---------|
| Plant OEE | (Availability × Performance × Quality) avg across machines | "78.5%" with progress bar |
| Availability | Uptime / Scheduled Time | "87.2%" |
| Performance | Actual Rate / Target Rate | "91.5%" |
| Quality | Good Output / Total Output | "98.4%" |
| Target | Configured target per metric | "Target: 85%" |

**Progress Bar Colors:**
- Green: Above target
- Orange: 90-100% of target
- Red: Below 90% of target

### 2. Machine Status Cards

Individual machine monitoring cards in grid layout.

| Field | Source | Display |
|-------|--------|---------|
| Machine Name | machines.name | "Mixer Line 1" |
| Status | real_time_status | 🟢 Running / 🔴 Down / 🟡 Idle / 🟠 Reduced Speed |
| OEE Gauge | Calculated OEE% | Circular gauge with percentage |
| A/P/Q Breakdown | Individual component % | "A: 92% P: 95% Q: 94%" |
| Work Order | work_orders.number | "WO-2026-00142" |
| Product | products.name | "Organic Sourdough" |
| Running Time | Elapsed time in current state | "2h 15m" |
| Downtime | Total downtime for shift | "0m (0%)" or "12m (4%)" |
| Reason | downtime_events.reason | "Mechanical" (if down) |

**Machine Statuses:**
- 🟢 Running: OEE > 0%, producing normally
- 🔴 Down: OEE = 0%, active downtime event
- 🟡 Idle: No WO assigned, available
- 🟠 Reduced Speed: Running below target performance

**Actions per Card:**
- [View Details]: Opens MachineDetailModal
- [Log Event]: Opens DowntimeEventModal (if down)
- [Start Production]: Assign WO (if idle)

### 3. OEE Circular Gauge

Visual OEE percentage gauge.

**Gauge Design:**
- Circular progress indicator
- Center: OEE% number (large, bold)
- Ring color: Green (>target), Orange (90-100%), Red (<90%)
- Target line indicator

### 4. Machine Detail Modal

Detailed view of single machine performance.

**Sections:**
1. Current Status (status, OEE, shift, WO, running time)
2. OEE Components (A/P/Q with targets and status)
3. Real-Time Production (target rate, current rate, produced, rejected)
4. Downtime Events Today (table with time, duration, reason)
5. Hourly Performance Chart (OEE% by hour, line chart)

**Actions:**
- [Log Downtime Event]: Opens DowntimeEventModal
- [Generate Report]: PDF report for this machine/shift
- [Export Data]: CSV export of hourly data

### 5. Shift Selector

Dropdown to filter by production shift.

| Shift | Time Range |
|-------|------------|
| Day Shift | 6:00 AM - 2:00 PM |
| Evening Shift | 2:00 PM - 10:00 PM |
| Night Shift | 10:00 PM - 6:00 AM |
| All Shifts | 24 hours |

### 6. Auto-Refresh Toggle

Enable/disable automatic dashboard refresh.

- Enabled: Refresh every 5 seconds
- Disabled: Manual refresh only
- Visual indicator: "Last Updated: X seconds ago"

---

## Main Actions

### Primary Actions

| Action | Location | Behavior |
|--------|----------|----------|
| View Machine Details | Card [View Details] | Opens MachineDetailModal |
| Log Downtime Event | Card [Log Event] (if down) | Opens DowntimeEventModal |
| Start Production | Card [Start Production] (if idle) | Assign WO to machine |
| Change Shift | Shift dropdown | Filter machines by selected shift |
| Auto-Refresh | Toggle button | Enable/disable 5-second auto-refresh |

### Machine Actions

| Action | Trigger | Behavior |
|--------|---------|----------|
| View Details | Click card | Opens MachineDetailModal |
| Log Event | Down machine | Opens DowntimeEventModal |
| Generate Report | Machine detail modal | PDF shift/machine report |
| Export Data | Machine detail modal | CSV export |

---

## States

### Loading State
- Skeleton plant metrics
- Skeleton machine cards (6)
- "Loading machine data..." text

### Empty State
- Machine illustration
- "No Machines Configured" headline
- Explanation and next steps
- [+ Add First Machine] CTA
- [Go to OEE Settings] link

### Populated State (Success)
- Plant overview metrics visible
- 6 machine cards with live data
- Status indicators color-coded
- Auto-refresh active (default)

### Error State
- Warning icon
- "Failed to Load Machine Data" headline
- Error code: MACHINE_DASHBOARD_FETCH_FAILED
- [Retry] and [Contact Support] buttons

---

## Data Fields

### Machine Dashboard Response

```json
{
  "plant_overview": {
    "oee_pct": 78.5,
    "availability_pct": 87.2,
    "performance_pct": 91.5,
    "quality_pct": 98.4,
    "targets": {
      "oee": 85,
      "availability": 90,
      "performance": 95,
      "quality": 99
    }
  },
  "machines": [
    {
      "id": "uuid-machine-1",
      "name": "Mixer Line 1",
      "status": "running",
      "oee_pct": 82,
      "availability_pct": 92,
      "performance_pct": 95,
      "quality_pct": 94,
      "work_order": {
        "number": "WO-2026-00142",
        "product": "Organic Sourdough"
      },
      "running_time_minutes": 135,
      "downtime_minutes": 0,
      "downtime_pct": 0,
      "shift": "day"
    }
  ],
  "last_updated": "2026-01-15T10:28:45Z"
}
```

### Machine Detail Response

```json
{
  "machine": {
    "id": "uuid",
    "name": "Oven Line 1",
    "status": "running",
    "oee_pct": 89,
    "availability_pct": 96,
    "performance_pct": 95,
    "quality_pct": 98,
    "targets": { ... },
    "work_order": { ... },
    "running_time_minutes": 282,
    "total_downtime_today_minutes": 12
  },
  "production": {
    "target_rate_per_hour": 500,
    "current_rate_per_hour": 475,
    "performance_pct": 95,
    "produced_today": 2375,
    "rejected_today": 48,
    "good_output_today": 2327,
    "quality_pct": 98
  },
  "downtime_events": [
    {
      "start_time": "2026-01-15T08:15:00Z",
      "end_time": "2026-01-15T08:20:00Z",
      "duration_minutes": 5,
      "reason": "Changeover to Premium Burger",
      "logged_by": "John Smith",
      "status": "resolved"
    }
  ],
  "hourly_performance": [
    { "hour": "2026-01-15T06:00:00Z", "oee_pct": 80 },
    { "hour": "2026-01-15T07:00:00Z", "oee_pct": 85 }
  ]
}
```

---

## API Endpoints

### Get Machine Dashboard

```
GET /api/oee/machines/dashboard
Query: ?shift=day

Response: { ... } (see Data Fields above)
```

### Get Machine Detail

```
GET /api/oee/machines/:id/detail
Query: ?shift=day

Response: { ... } (see Machine Detail Response above)
```

### Log Downtime Event

```
POST /api/oee/machines/:id/downtime
Content-Type: application/json

Request:
{
  "reason_code": "MECHANICAL",
  "description": "Conveyor belt jam",
  "started_at": "2026-01-15T10:30:00Z"
}

Response:
{
  "event": {
    "id": "uuid",
    "machine_id": "uuid",
    "started_at": "2026-01-15T10:30:00Z",
    "status": "active"
  }
}
```

---

## Permissions

| Role | View Dashboard | View Details | Log Events | Generate Reports |
|------|---------------|--------------|------------|------------------|
| Production Manager | Yes | Yes | Yes | Yes |
| Operator | Yes | Yes (assigned machines) | Yes | No |
| Maintenance | Yes | Yes | Yes (maintenance events) | No |
| Quality Manager | Yes | Yes | No | Yes |
| Admin | Yes | Yes | Yes | Yes |

---

## Validation

### Shift Selection

| Rule | Error Message |
|------|---------------|
| Valid shift | "Invalid shift selected" |
| Current or past shift only | "Cannot view future shifts" |

### Auto-Refresh

| Rule | Behavior |
|------|----------|
| Refresh interval: 5 seconds | Auto-refresh every 5s if enabled |
| Network error: Pause auto-refresh | Show "Auto-refresh paused due to network error" |
| User interaction: Don't interrupt | Pause refresh during modal/form interaction |

---

## Business Rules

### OEE Calculation

**OEE Formula:**
```
OEE = Availability × Performance × Quality

Where:
- Availability = (Scheduled Time - Downtime) / Scheduled Time × 100
- Performance = (Actual Output × Ideal Cycle Time) / Operating Time × 100
- Quality = Good Output / Total Output × 100
```

**Example:**
```
Shift: 8 hours (480 minutes)
Downtime: 20 minutes
Operating Time: 460 minutes
Target Rate: 500 units/hour
Actual Output: 3,800 units
Rejected: 80 units
Good Output: 3,720 units

Availability = (480 - 20) / 480 × 100 = 95.8%
Performance = (3,800 / (460/60)) / 500 × 100 = 99.1%
Quality = 3,720 / 3,800 × 100 = 97.9%

OEE = 0.958 × 0.991 × 0.979 = 92.9%
```

### Status Logic

| Condition | Status |
|-----------|--------|
| Machine producing at >90% target rate | 🟢 Running |
| Machine producing at 50-90% target rate | 🟠 Reduced Speed |
| Machine stopped, active downtime event | 🔴 Down |
| Machine not assigned to WO | 🟡 Idle |

### Target Comparison

| Metric | Above Target | 90-100% Target | Below 90% |
|--------|-------------|----------------|-----------|
| Color | Green | Orange | Red |
| Icon | ✓ | ⚠️ | ✗ |
| Label | "Above Target" | "On Target" | "Below Target" |

---

## Accessibility

### Touch Targets
- Machine cards: Full card clickable (200x300dp)
- Action buttons: 48x48dp
- Shift dropdown: 48x48dp
- Auto-refresh toggle: 48x48dp

### Contrast
- Status indicators: 🟢 Green #16A34A, 🔴 Red #DC2626, 🟡 Yellow #EAB308, 🟠 Orange #F97316 (AA)
- OEE gauge: 4.5:1 text contrast
- Card text: 4.5:1

### Screen Reader
- **Dashboard**: `aria-label="Machine Dashboard with 6 active machines"`
- **Machine cards**: `aria-label="Mixer Line 1, Running, OEE 82%, Work Order WO-2026-00142"`
- **Status**: `aria-label="Status: Running"` (not just emoji)
- **Gauges**: `aria-label="OEE 82%, above target"`

### Keyboard Navigation
| Key | Action |
|-----|--------|
| Tab | Navigate machine cards, controls |
| Enter | Open details, activate button |
| Arrow keys | Navigate grid of cards |
| Escape | Close modal |

---

## Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| **Desktop (>1024px)** | 3-column grid, full cards with gauges |
| **Tablet (768-1024px)** | 2-column grid, condensed cards |
| **Mobile (<768px)** | 1-column list, simplified cards without gauges |

---

## Performance Notes

### Real-Time Updates

```typescript
// WebSocket or polling
const refreshInterval = 5000; // 5 seconds

// Update only changed machines
const delta = diff(previousState, currentState);
updateOnlyChanged(delta);
```

### Query Optimization

```sql
-- Index for real-time queries
CREATE INDEX idx_machine_status_realtime
ON machine_status(org_id, machine_id, timestamp DESC);

-- Materialized view for plant overview
CREATE MATERIALIZED VIEW plant_oee_summary AS
SELECT org_id, shift, AVG(oee_pct), AVG(availability_pct), ...
FROM machine_status
WHERE timestamp > NOW() - INTERVAL '1 day'
GROUP BY org_id, shift;
```

### Caching

```typescript
'org:{orgId}:oee:dashboard:{shift}'           // 5 sec TTL (real-time)
'org:{orgId}:oee:machine:{id}:detail:{shift}' // 5 sec TTL
'org:{orgId}:oee:plant-overview'              // 10 sec TTL
```

### Load Time Targets

| Operation | Target |
|-----------|--------|
| Initial dashboard load | < 1s |
| Auto-refresh update | < 300ms |
| Machine detail modal | < 500ms |

---

## Testing Requirements

### Unit Tests
```typescript
describe('Machine Dashboard', () => {
  it('calculates OEE correctly', async () => {});
  it('displays machine status icons', async () => {});
  it('auto-refreshes every 5 seconds', async () => {});
});
```

### E2E Tests
```typescript
describe('Machine Dashboard E2E', () => {
  it('loads dashboard with machines', async () => {});
  it('opens machine detail modal', async () => {});
  it('logs downtime event', async () => {});
});
```

---

## Quality Gates

- [x] All 4 states defined
- [x] Responsive breakpoints documented
- [x] All API endpoints specified
- [x] Accessibility checklist passed
- [x] Performance targets defined
- [x] OEE calculations documented
- [x] Real-time updates specified
- [x] Machine statuses defined

---

**Status**: Ready for Implementation
**Approval Mode**: auto_approve
**Estimated Effort**: 10-12 hours
**Quality Target**: 95/100
**PRD Coverage**: 100% (OEE PRD Section 10.1)
