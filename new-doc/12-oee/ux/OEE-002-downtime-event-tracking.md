# OEE-002: Downtime Event Tracking

**Module**: OEE (Overall Equipment Effectiveness)
**Feature**: Downtime Event Logging & Tracking (PRD Section 10.2)
**Status**: Ready for Implementation
**Last Updated**: 2026-01-15

---

## ASCII Wireframe

### Success State (Desktop - Timeline View)

```
+--------------------------------------------------------------------------------------------------+
|  OEE > Downtime Tracking                        Date: [Today v]  Shift: [Day Shift v]  [+ Log]  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Today's Downtime Summary                                                                   |   |
|  |                                                                                            |   |
|  |  +--------------------+  +--------------------+  +--------------------+  +---------------+ |   |
|  |  | Total Downtime     |  | # Events           |  | MTTR               |  | Most Common   | |   |
|  |  | 2h 47m             |  | 12 events          |  | 13.9 minutes       |  | Changeover    | |   |
|  |  | 5.8% of shift      |  | +3 vs yesterday    |  | -2.1 min vs avg    |  | (5 events)    | |   |
|  |  +--------------------+  +--------------------+  +--------------------+  +---------------+ |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Downtime Timeline (6:00 AM - 2:00 PM)                               [Timeline] [List]     |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  Mixer Line 1 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   |
|               ■■■■ 8:15-8:20 (5m) Changeover                                                     |
|               Running ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━    |
|                                                                                                  |
|  Oven Line 1  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   |
|               Running━━━━━━━━━━■■ 10:32-10:36 (4m) Minor Jam━━■■ 11:48-11:51 (3m) QC Hold━━━    |
|                                                                                                  |
|  Packaging 1  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   |
|               ■■■■■■■■■■■■■■■■■■■■■■■■■■■ 9:15-10:03 (48m) MECHANICAL BREAKDOWN■■■■■■━━━━━━    |
|               ■■■ 12:30-12:38 (8m) Waiting for Material ■■■ Running ━━━━━━━━━━━━━━━━━━━━━━━    |
|                                                                                                  |
|  Slicer Line  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   |
|               ░░░░░░░░░░░░░░░░░░░░░░░░░░░░ IDLE (No WO) ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░    |
|                                                                                                  |
|  Proofer      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   |
|               ■■■■ 7:45-7:52 (7m) Temp Adjustment ■■■■ Running ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━    |
|                                                                                                  |
|  Conveyor     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   |
|               Running━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━    |
|                                                                                                  |
|               +----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+  |
|               6AM  7AM  8AM  9AM  10AM 11AM 12PM 1PM  2PM                                       |
|                                                                                                  |
|  Legend: ━━━ Running  ■■■ Downtime  ░░░ Idle  [Click event for details]                        |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Success State (List View)

```
+--------------------------------------------------------------------------------------------------+
|  OEE > Downtime Tracking                        Date: [Today v]  Shift: [Day Shift v]  [+ Log]  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Downtime Events (12 Today)                                      [Timeline] [List]         |   |
|  |                                           ^^^^^^^^^^                                       |   |
|  | Filters: [All Machines v] [All Reasons v] [Active & Resolved v] [Sort: Newest v]          |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Start   | End     | Duration | Machine         | Reason               | Logged By  |Status|   |
|  | ---------------------------------------------------------------------------------         |   |
|  | 9:15 AM | 10:03AM | 48 min   | Packaging 1     | Mechanical Breakdown | J. Smith   | ✓    |   |
|  |         |         |          | ⚠️ CRITICAL - Longest event today                       |   |
|  |         |         |          | Details: Conveyor motor failure, emergency repair      |   |
|  |         |         |          | [View Details] [Edit] [Generate Report]                 |   |
|  | ---------------------------------------------------------------------------------         |   |
|  | 12:30PM | 12:38PM | 8 min    | Packaging 1     | Waiting for Material | S. Miller  | ✓    |   |
|  |         |         |          | Details: Raw material delay from warehouse              |   |
|  |         |         |          | [View Details] [Edit]                                   |   |
|  | ---------------------------------------------------------------------------------         |   |
|  | 7:45 AM | 7:52 AM | 7 min    | Proofer Line 1  | Temperature Adj      | M. Johnson | ✓    |   |
|  |         |         |          | Details: Proofer temp 2°C below spec, adjusted          |   |
|  |         |         |          | [View Details] [Edit]                                   |   |
|  | ---------------------------------------------------------------------------------         |   |
|  | 8:15 AM | 8:20 AM | 5 min    | Mixer Line 1    | Changeover           | J. Smith   | ✓    |   |
|  |         |         |          | Details: Product changeover to Organic Sourdough        |   |
|  |         |         |          | [View Details] [Edit]                                   |   |
|  | ---------------------------------------------------------------------------------         |   |
|  | 10:32AM | 10:36AM | 4 min    | Oven Line 1     | Minor Jam            | S. Miller  | ✓    |   |
|  |         |         |          | Details: Conveyor belt minor jam, cleared               |   |
|  |         |         |          | [View Details] [Edit]                                   |   |
|  | ---------------------------------------------------------------------------------         |   |
|  | 11:48AM | 11:51AM | 3 min    | Oven Line 1     | Quality Check Hold   | M. Johnson | ✓    |   |
|  |         |         |          | Details: Routine quality inspection hold                |   |
|  |         |         |          | [View Details] [Edit]                                   |   |
|  | ---------------------------------------------------------------------------------         |   |
|  | 1:15 PM | ACTIVE  | 12 min   | Packaging 1     | Mechanical           | J. Smith   | 🔴   |   |
|  |         |         |          | ⚠️ ACTIVE EVENT - Still ongoing                         |   |
|  |         |         |          | Details: Investigating sealing mechanism issue          |   |
|  |         |         |          | [Resolve Event]                                         |   |
|  |                                                                                            |   |
|  | [Showing 7 of 12 events] [Load More]                                                      |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Log Downtime Event Modal

```
+--------------------------------------------------------------------------------------------------+
|  Log Downtime Event                                                                    [x Close] |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Event Information                                                                          |   |
|  |                                                                                            |   |
|  | Machine: *                                                                                 |   |
|  | [Packaging Line 1                                                                      v]  |   |
|  |                                                                                            |   |
|  | Downtime Reason: *                                                                         |   |
|  | [Mechanical Breakdown                                                                  v]  |   |
|  |                                                                                            |   |
|  | Category: Equipment Failure (auto-selected based on reason)                               |   |
|  |                                                                                            |   |
|  | Start Time: *                                                                              |   |
|  | [2026-01-15] [09:15] AM                                                                    |   |
|  | [Use Current Time ✓] (Auto-populate with now)                                             |   |
|  |                                                                                            |   |
|  | Status:                                                                                    |   |
|  | ( ) Active - Event still ongoing                                                           |   |
|  | (•) Resolved - Event has ended                                                             |   |
|  |                                                                                            |   |
|  | End Time: (Required if resolved)                                                           |   |
|  | [2026-01-15] [10:03] AM                                                                    |   |
|  |                                                                                            |   |
|  | Duration: 48 minutes (auto-calculated)                                                     |   |
|  |                                                                                            |   |
|  | Description:                                                                               |   |
|  | +--------------------------------------------------------------------------+               |   |
|  | | Conveyor motor failure on Packaging Line 1. Motor overheated and       |               |   |
|  | | stopped working. Maintenance performed emergency motor replacement.     |               |   |
|  | | New motor installed and tested. Production resumed at 10:03 AM.         |               |   |
|  | |                                                                          |               |   |
|  | +--------------------------------------------------------------------------+               |   |
|  |                                                                                            |   |
|  | Work Order Affected:                                                                       |   |
|  | [WO-2026-00145 - Vegan Nuggets                                                         v]  |   |
|  |                                                                                            |   |
|  | Corrective Action Taken:                                                                   |   |
|  | +--------------------------------------------------------------------------+               |   |
|  | | Replaced conveyor motor (Part #: MOT-2024-456). Tested new motor at    |               |   |
|  | | full load for 5 minutes. Scheduled preventive maintenance check for     |               |   |
|  | | remaining motors on this line.                                           |               |   |
|  | +--------------------------------------------------------------------------+               |   |
|  |                                                                                            |   |
|  | Logged By: John Smith (auto-filled from current user)                                     |   |
|  |                                                                                            |   |
|  | Attachments: (Optional)                                                                    |   |
|  | [Upload Photos/Documents] [motor_replacement_log.pdf] [x]                                 |   |
|  |                                                                                            |   |
|  | [ ] Create maintenance task for preventive check                                          |   |
|  | [ ] Notify maintenance manager                                                             |   |
|  |                                                                                            |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  [Cancel]                                                                       [Save Event]     |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Success State (Mobile: < 768px)

```
+----------------------------------+
|  < Downtime Tracking             |
|  [Today v] [Day Shift v]         |
+----------------------------------+
|                                  |
|  Summary                         |
|  +----------------------------+  |
|  | Total: 2h 47m (5.8%)       |  |
|  | Events: 12                 |  |
|  | MTTR: 13.9 min             |  |
|  | Most: Changeover (5)       |  |
|  +----------------------------+  |
|                                  |
|  [Timeline] [List] [+ Log]       |
|            ^^^^^^                |
|                                  |
|  Events (12)                     |
|  +----------------------------+  |
|  | 9:15 AM - 10:03 AM         |  |
|  | 48 min ⚠️ CRITICAL         |  |
|  | Packaging 1                |  |
|  | Mechanical Breakdown       |  |
|  | [View]                     |  |
|  +----------------------------+  |
|  | 12:30 PM - 12:38 PM        |  |
|  | 8 min                      |  |
|  | Packaging 1                |  |
|  | Waiting for Material       |  |
|  | [View]                     |  |
|  +----------------------------+  |
|  | 1:15 PM - ACTIVE 🔴        |  |
|  | 12 min (ongoing)           |  |
|  | Packaging 1                |  |
|  | Mechanical                 |  |
|  | [Resolve]                  |  |
|  +----------------------------+  |
|                                  |
|  [View All (12)]                 |
|                                  |
+----------------------------------+
```

### Loading State

```
+--------------------------------------------------------------------------------------------------+
|  OEE > Downtime Tracking                        Date: [Today v]  Shift: [Day Shift v]  [+ Log]  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | [░░░░░░░░░░░]  [░░░░░░░░░░░]  [░░░░░░░░░░░]  [░░░░░░░░░░░]                              |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]      |
|                                                                                                  |
|  Loading downtime events...                                                                      |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Empty State

```
+--------------------------------------------------------------------------------------------------+
|  OEE > Downtime Tracking                        Date: [Today v]  Shift: [Day Shift v]  [+ Log]  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|                                                                                                  |
|                                         [Clock Icon]                                             |
|                                                                                                  |
|                                  No Downtime Events Today                                        |
|                                                                                                  |
|                     No downtime events have been logged for this shift.                          |
|                     This is excellent! All machines are running smoothly.                        |
|                                                                                                  |
|                                                                                                  |
|                                    [+ Log Downtime Event]                                        |
|                                                                                                  |
|                                                                                                  |
|                     Downtime tracking helps identify:                                            |
|                     - Equipment reliability issues                                               |
|                     - Process bottlenecks                                                        |
|                     - Opportunities for improvement                                              |
|                                                                                                  |
|                              [View Downtime History]                                             |
|                                                                                                  |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Error State

```
+--------------------------------------------------------------------------------------------------+
|  OEE > Downtime Tracking                        Date: [Today v]  Shift: [Day Shift v]  [+ Log]  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|                                                                                                  |
|                                         [Warning Icon]                                           |
|                                                                                                  |
|                               Failed to Load Downtime Events                                     |
|                                                                                                  |
|                     Unable to retrieve downtime tracking data.                                   |
|                     Please check your connection and try again.                                  |
|                                                                                                  |
|                                Error: DOWNTIME_TRACKING_FETCH_FAILED                             |
|                                                                                                  |
|                                                                                                  |
|                                  [Retry]    [Contact Support]                                    |
|                                                                                                  |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

---

## Key Components

### 1. Summary Metrics

Shift-level downtime summary.

| Metric | Calculation | Display |
|--------|-------------|---------|
| Total Downtime | SUM(event durations) | "2h 47m (5.8% of shift)" |
| # Events | COUNT(events) | "12 events (+3 vs yesterday)" |
| MTTR | AVG(event durations) | "13.9 minutes (-2.1 min vs avg)" |
| Most Common | MODE(reason codes) | "Changeover (5 events)" |

**MTTR**: Mean Time To Repair (average downtime duration)

### 2. Timeline View

Visual timeline showing machine uptime/downtime across shift.

**Timeline Elements:**
- Each row = One machine
- X-axis = Time (shift hours: 6 AM - 2 PM)
- Running periods: Solid line (━━━)
- Downtime events: Solid blocks (■■■) with hover details
- Idle periods: Dotted line (░░░)

**Event Blocks:**
- Width = Duration (proportional to timeline)
- Label = Start-End time (duration) Reason
- Color = Severity (Critical: red, Warning: orange, Normal: gray)
- Click = Opens event detail

### 3. List View

Tabular list of all downtime events.

| Column | Source | Display |
|--------|--------|---------|
| Start | downtime_events.start_time | "9:15 AM" |
| End | downtime_events.end_time | "10:03 AM" or "ACTIVE" |
| Duration | end_time - start_time | "48 min" |
| Machine | machines.name | "Packaging 1" |
| Reason | reason_codes.name | "Mechanical Breakdown" |
| Logged By | users.name | "J. Smith" |
| Status | downtime_events.status | ✓ Resolved / 🔴 Active |

**Event Highlighting:**
- Critical events (>30 min): Red background, "⚠️ CRITICAL" badge
- Active events: Orange background, "🔴 ACTIVE EVENT" badge

**Actions per Row:**
- [View Details]: Opens event detail modal
- [Edit]: Opens edit event modal (if user has permission)
- [Resolve Event]: Mark active event as resolved
- [Generate Report]: PDF report for this event

### 4. Log Downtime Event Modal

Form to create new downtime event.

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Machine | Dropdown | Yes | Must be active machine |
| Downtime Reason | Dropdown | Yes | From configured reason codes |
| Category | Auto-filled | - | Based on reason code |
| Start Time | DateTime | Yes | Cannot be future |
| Status | Radio | Yes | Active / Resolved |
| End Time | DateTime | If resolved | Must be after start time |
| Duration | Auto-calc | - | end_time - start_time |
| Description | Textarea | Yes | Min 20 chars |
| Work Order Affected | Dropdown | No | Active WO on machine |
| Corrective Action | Textarea | If resolved | Min 20 chars |
| Logged By | Auto-filled | - | Current user |
| Attachments | File upload | No | PDF, images max 10MB |

**Checkboxes:**
- [ ] Create maintenance task
- [ ] Notify maintenance manager

### 5. Reason Code Dropdown

Categorized downtime reason codes.

**Categories:**
1. **Equipment Failure** (red)
   - Mechanical Breakdown
   - Electrical Failure
   - Hydraulic/Pneumatic Issue

2. **Process Issue** (orange)
   - Quality Check Hold
   - Temperature Adjustment
   - Speed Adjustment

3. **Material Issue** (yellow)
   - Waiting for Material
   - Material Quality Issue

4. **Planned** (blue)
   - Changeover
   - Cleaning/Sanitation
   - Preventive Maintenance

5. **Other** (gray)
   - Operator Break
   - Training
   - No Demand

### 6. Filters Panel

Filter downtime events list.

| Filter | Options |
|--------|---------|
| Machine | All Machines, [machine list] |
| Reason | All Reasons, [reason codes] |
| Status | Active & Resolved, Active Only, Resolved Only |
| Sort | Newest First, Oldest First, Longest Duration, Shortest Duration |

---

## Main Actions

### Primary Actions

| Action | Location | Behavior |
|--------|----------|----------|
| Log Downtime Event | Header [+ Log] | Opens LogDowntimeEventModal |
| View Event Details | List/Timeline event | Opens EventDetailModal |
| Resolve Active Event | Active event [Resolve Event] | Mark event as resolved, set end time |
| Edit Event | Event row [Edit] | Opens EditEventModal |
| Generate Report | Event row | PDF report for single event |

### View Toggle

| View | Display |
|------|---------|
| Timeline | Visual timeline with machine rows |
| List | Tabular list of events |

**Default**: List view (more data visible)

### Date/Shift Selection

| Control | Options |
|---------|---------|
| Date | Today, Yesterday, Last 7 Days, Custom Date |
| Shift | Day Shift, Evening Shift, Night Shift, All Shifts |

---

## States

### Loading State
- Skeleton summary metrics
- Skeleton timeline/list
- "Loading downtime events..." text

### Empty State
- Clock illustration
- "No Downtime Events Today" headline
- Positive message ("excellent, all running smoothly")
- [+ Log Downtime Event] CTA
- Benefits of downtime tracking
- [View Downtime History] link

### Populated State (Success)
- Summary metrics visible
- Timeline or List view with events
- Active events highlighted
- Filter controls active

### Error State
- Warning icon
- "Failed to Load Downtime Events" headline
- Error code: DOWNTIME_TRACKING_FETCH_FAILED
- [Retry] and [Contact Support] buttons

---

## Data Fields

### Downtime Events Response

```json
{
  "summary": {
    "total_downtime_minutes": 167,
    "total_downtime_pct": 5.8,
    "event_count": 12,
    "event_count_change": 3,
    "mttr_minutes": 13.9,
    "mttr_change_minutes": -2.1,
    "most_common_reason": "Changeover",
    "most_common_count": 5
  },
  "events": [
    {
      "id": "uuid-event-1",
      "machine_id": "uuid-machine-1",
      "machine_name": "Packaging Line 1",
      "reason_code": "MECHANICAL_BREAKDOWN",
      "reason_name": "Mechanical Breakdown",
      "category": "Equipment Failure",
      "start_time": "2026-01-15T09:15:00Z",
      "end_time": "2026-01-15T10:03:00Z",
      "duration_minutes": 48,
      "status": "resolved",
      "description": "Conveyor motor failure...",
      "corrective_action": "Replaced conveyor motor...",
      "work_order_id": "uuid-wo-1",
      "work_order_number": "WO-2026-00145",
      "logged_by_id": "uuid-user-1",
      "logged_by_name": "John Smith",
      "attachments": ["motor_replacement_log.pdf"],
      "created_at": "2026-01-15T10:05:00Z"
    }
  ]
}
```

---

## API Endpoints

### Get Downtime Events

```
GET /api/oee/downtime/events
Query: ?date=2026-01-15&shift=day&machine_id=uuid&status=all

Response: { ... } (see Data Fields above)
```

### Log Downtime Event

```
POST /api/oee/downtime/events
Content-Type: application/json

Request:
{
  "machine_id": "uuid",
  "reason_code": "MECHANICAL_BREAKDOWN",
  "start_time": "2026-01-15T09:15:00Z",
  "status": "resolved",
  "end_time": "2026-01-15T10:03:00Z",
  "description": "Conveyor motor failure...",
  "corrective_action": "Replaced conveyor motor...",
  "work_order_id": "uuid",
  "attachments": ["file_id_1"]
}

Response:
{
  "event": { ... },
  "created_at": "2026-01-15T10:05:00Z"
}
```

### Resolve Active Event

```
PUT /api/oee/downtime/events/:id/resolve
Content-Type: application/json

Request:
{
  "end_time": "2026-01-15T13:27:00Z",
  "corrective_action": "Issue resolved, production resumed"
}

Response:
{
  "event": { ... },
  "duration_minutes": 12
}
```

---

## Permissions

| Role | View Events | Log Events | Edit Events | Delete Events | Generate Reports |
|------|-------------|------------|-------------|---------------|------------------|
| Production Manager | Yes | Yes | Yes | Yes | Yes |
| Operator | Yes | Yes | Own only | No | No |
| Maintenance | Yes | Yes (equipment failures) | Yes | No | Yes |
| Quality Manager | Yes | Yes (quality issues) | No | No | Yes |
| Admin | Yes | Yes | Yes | Yes | Yes |

---

## Validation

### Log Event

| Field | Rule | Error Message |
|-------|------|---------------|
| Machine | Required, must exist | "Machine is required" |
| Reason | Required | "Downtime reason is required" |
| Start Time | Required, cannot be future | "Start time cannot be in the future" |
| End Time | If resolved, must be after start | "End time must be after start time" |
| Description | Min 20 chars | "Description must be at least 20 characters" |
| Corrective Action | If resolved, min 20 chars | "Corrective action required for resolved events" |

### Business Rules

| Rule | Behavior |
|------|----------|
| Active event limit | Max 1 active event per machine |
| Overlapping events | Cannot create event if another active on same machine |
| Backdating | Can backdate up to 7 days with approval |
| Duration limit | Warning if event > 2 hours (requires supervisor approval) |

---

## Business Rules

### MTTR Calculation

```
MTTR (Mean Time To Repair) = SUM(event durations) / COUNT(events)

Example:
Events: 48min, 8min, 7min, 5min, 4min, 3min
MTTR = (48+8+7+5+4+3) / 6 = 12.5 minutes
```

### Event Categorization

| Category | Planned? | Counted in OEE Downtime? |
|----------|----------|--------------------------|
| Equipment Failure | No | Yes |
| Process Issue | No | Yes |
| Material Issue | No | Yes |
| Planned (Changeover, Cleaning, PM) | Yes | No (excluded from OEE calc) |
| Other | Depends | Configurable |

### Critical Event Threshold

| Duration | Severity |
|----------|----------|
| < 15 min | Normal |
| 15-30 min | Warning (orange) |
| > 30 min | Critical (red) |

**Critical events trigger:**
- Email to Production Manager
- SMS alert (if configured)
- Escalation to Maintenance Manager

---

## Accessibility

### Touch Targets
- Event blocks in timeline: 48dp minimum height
- Action buttons: 48x48dp
- Filter dropdowns: 48x48dp
- List rows: 48dp height

### Contrast
- Event blocks: High contrast against timeline background (4.5:1)
- Status indicators: ✓ Green #16A34A, 🔴 Red #DC2626 (AA)
- Timeline text: 4.5:1

### Screen Reader
- **Timeline**: `aria-label="Downtime timeline for day shift, 6 machines, 12 events"`
- **Event blocks**: `aria-label="Packaging Line 1, downtime 9:15 AM to 10:03 AM, 48 minutes, mechanical breakdown"`
- **Active events**: `role="alert"` for active event announcements
- **List**: `role="table"` with proper headers

### Keyboard Navigation
| Key | Action |
|-----|--------|
| Tab | Navigate events, filters, buttons |
| Enter | Open event detail, activate button |
| Arrow keys | Navigate timeline events, table rows |
| Escape | Close modal |

---

## Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| **Desktop (>1024px)** | Timeline full width, list with all columns |
| **Tablet (768-1024px)** | Timeline scrollable, list condensed |
| **Mobile (<768px)** | List only (no timeline), simplified cards |

---

## Performance Notes

### Query Optimization

```sql
-- Index for downtime events
CREATE INDEX idx_downtime_events_timeline
ON downtime_events(org_id, start_time, machine_id, status);

-- Index for reason code filtering
CREATE INDEX idx_downtime_events_reason
ON downtime_events(org_id, reason_code, start_time);
```

### Caching

```typescript
'org:{orgId}:oee:downtime:summary:{date}:{shift}'   // 5 min TTL
'org:{orgId}:oee:downtime:events:{date}:{shift}'    // 2 min TTL
'org:{orgId}:oee:downtime:reason-codes'             // 1 hour TTL
```

### Load Time Targets

| Operation | Target |
|-----------|--------|
| Initial page load | < 1s |
| View switch (timeline/list) | < 300ms |
| Log event | < 500ms |
| Resolve event | < 500ms |

---

## Testing Requirements

### Unit Tests
```typescript
describe('Downtime Event Tracking', () => {
  it('calculates MTTR correctly', async () => {});
  it('validates event overlaps', async () => {});
  it('categorizes events by severity', async () => {});
});
```

### E2E Tests
```typescript
describe('Downtime Tracking E2E', () => {
  it('loads timeline view', async () => {});
  it('logs new downtime event', async () => {});
  it('resolves active event', async () => {});
});
```

---

## Quality Gates

- [x] All 4 states defined
- [x] Responsive breakpoints documented
- [x] All API endpoints specified
- [x] Accessibility checklist passed
- [x] Performance targets defined
- [x] MTTR calculation documented
- [x] Event categorization defined
- [x] Timeline and list views specified

---

**Status**: Ready for Implementation
**Approval Mode**: auto_approve
**Estimated Effort**: 8-10 hours
**Quality Target**: 95/100
**PRD Coverage**: 100% (OEE PRD Section 10.2)
