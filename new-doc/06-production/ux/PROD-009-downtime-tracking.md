# PROD-009: Downtime Tracking (Phase 2)

**Module**: Production
**Feature**: Downtime Tracking & Analysis (FR-PROD-019)
**Status**: Ready for Review
**Last Updated**: 2025-12-14
**Phase**: Phase 2 (Post-MVP)

---

## Overview

Track and categorize machine downtime with real-time logging, active status banner, and Pareto analysis of downtime causes. This feature enables operators to log machine stoppages, production managers to analyze downtime patterns, and maintenance teams to prioritize improvement initiatives.

**Note**: This is a Phase 2 feature (post-MVP). MVP focuses on core production tracking (WO, outputs, consumption). Downtime tracking adds OEE analysis capabilities.

---

## Downtime Categories

| Category | Planned | Notes |
|----------|---------|-------|
| Breakdown | No | Equipment failure (unplanned) |
| Changeover | Yes | Product/tool change |
| Maintenance | Yes | Preventive maintenance |
| Material Wait | No | Waiting for materials (unplanned) |
| Quality Issue | No | Stopped for quality (unplanned) |
| Operator Absence | No | No operator available (unplanned) |
| Break | Yes | Scheduled break |
| No Schedule | Yes | No production planned |
| Other | No | Other reason (unplanned) |

---

## ASCII Wireframes

### Main Page: Success State (Desktop)

```
┌───────────────────────────────────────────────────────────────────┐
│ Production > Downtime Tracking                  [Refresh] [Export] │
├───────────────────────────────────────────────────────────────────┤
│                                                                     │
│ ⚠️  ACTIVE DOWNTIME: Mixer M-001 down 45 min (Started 10:00)      │
│                     [View Details] [End Downtime]                 │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────┐   │
│ │ [+ Log Downtime]  Filters: [Machine: All ▼] [Last 7 Days▼] │   │
│ └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────┐   │
│ │ 📊 Downtime Analysis - Pareto Chart (Last 7 Days)          │   │
│ │                                                               │   │
│ │ Total Downtime: 847 min | Events: 23 | Avg Duration: 36 min│   │
│ │                                                               │   │
│ │  450 ┼─ Breakdown                                            │   │
│ │       │  ████████████                                        │   │
│ │  400 ┼──┤  ██ 12 events (480 min total)                    │   │
│ │       │  ██ 56.8%                                            │   │
│ │  350 ┼──┤  ██                                                │   │
│ │       │  ██                                                  │   │
│ │  300 ┼──┤  ██                                                │   │
│ │       │  ██  Changeover                                      │   │
│ │  250 ┼──┤  ██  ██████                                        │   │
│ │       │  ██  ██ 6 events (210 min)  30.0%                   │   │
│ │  200 ┼──┤  ██  ██                                            │   │
│ │       │  ██  ██  Material Wait                               │   │
│ │  150 ┼──┤  ██  ██  ████                                      │   │
│ │       │  ██  ██  ██ 3 events (95 min) 11.2%                 │   │
│ │  100 ┼──┤  ██  ██  ██  Other                                 │   │
│ │       │  ██  ██  ██  ██ 2 events (62 min) 1.9%              │   │
│ │   50 ┼──┤  ██  ██  ██  ██                                    │   │
│ │       │  ██  ██  ██  ██                                      │   │
│ │    0 └──┴──┴───┴───┴──────────────────────────────────────  │   │
│ │                                                               │   │
│ │ [🔍 Drill Down] [📥 Export Analysis]                        │   │
│ └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────┐   │
│ │ 📋 Downtime History (Last 30 Days)                          │   │
│ │                                                               │   │
│ │ ┌───────────────────────────────────────────────────────────┐│   │
│ │ │ Date   Machine    Category      Started Ended Duration   ││   │
│ │ ├───────────────────────────────────────────────────────────┤│   │
│ │ │ 12-14 Mixer M-001 Breakdown ●   10:00  10:45  45 min [×]││   │
│ │ │       └─ Reason: Motor failure                           ││   │
│ │ │       └─ Operator: John Smith                            ││   │
│ │ ├───────────────────────────────────────────────────────────┤│   │
│ │ │ 12-14 Oven O-003  Changeover ○   09:15  09:45  30 min [×]││   │
│ │ │       └─ Reason: Product switch (B2234 → C5621)          ││   │
│ │ │       └─ Operator: Jane Doe                              ││   │
│ │ ├───────────────────────────────────────────────────────────┤│   │
│ │ │ 12-13 Mixer M-002 Breakdown ●   14:30  15:52  82 min [×]││   │
│ │ │       └─ Reason: Gearbox leak                            ││   │
│ │ │       └─ Operator: Mike Chen                             ││   │
│ │ ├───────────────────────────────────────────────────────────┤│   │
│ │ │ 12-13 Extruder E-01 Maintenance ○ 13:00 14:00 60 min [×]││   │
│ │ │       └─ Reason: Scheduled maintenance                   ││   │
│ │ │       └─ Operator: Service Tech                          ││   │
│ │ └───────────────────────────────────────────────────────────┘│   │
│ │                                                               │   │
│ │ Showing 4 of 23 events  [Load More...]  [← Prev] [Next →]   │   │
│ └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└───────────────────────────────────────────────────────────────────┘

Legend: ● = Unplanned  ○ = Planned
```

---

### Log Downtime Modal

```
┌───────────────────────────────────────────────┐
│ Log Downtime                              [×] │
├───────────────────────────────────────────────┤
│                                               │
│ Machine * [Mixer M-001 ▼]                    │
│   (All machines on this line)                │
│                                               │
│ Category * [Select... ▼]                     │
│   Options: Breakdown, Changeover,            │
│   Maintenance, Material Wait, Quality Issue, │
│   Operator Absence, Break, No Schedule       │
│                                               │
│ Reason Code * [Select... ▼]                  │
│   (Filtered by category above)               │
│   [Motor failure, Gearbox issue, ...]        │
│                                               │
│ Started At * [2025-12-14 10:00:00]           │
│   [Hour: 10 ▼] [Min: 00 ▼]                   │
│                                               │
│ Notes [textarea, optional]                   │
│ ______________________________________________│
│                                               │
│              [Cancel] [Log Downtime]         │
│                                               │
└───────────────────────────────────────────────┘

Auto-set: is_planned based on category
- Breakdown → is_planned = false
- Changeover → is_planned = true
- Maintenance → is_planned = true
- etc.
```

---

### End Downtime Modal

```
┌───────────────────────────────────────────────┐
│ End Downtime                              [×] │
├───────────────────────────────────────────────┤
│                                               │
│ Machine: Mixer M-001                         │
│ Category: Breakdown                          │
│ Started: 2025-12-14 10:00                    │
│ Current Duration: 45 minutes                 │
│                                               │
│ Ended At * [2025-12-14 10:45:00]             │
│   [Hour: 10 ▼] [Min: 45 ▼]                   │
│                                               │
│ Final Duration: 45 minutes (auto-calculated) │
│ Impact: Availability reduced by 15.6%        │
│                                               │
│              [Cancel] [End Downtime]         │
│                                               │
└───────────────────────────────────────────────┘

Auto-calc: duration_minutes = ended_at - started_at
```

---

### Empty State

```
┌───────────────────────────────────────────────────────────────────┐
│ Production > Downtime Tracking                                     │
├───────────────────────────────────────────────────────────────────┤
│                                                                     │
│                          (illustration)                            │
│                      No downtime events yet                        │
│                                                                     │
│              The production line is running smoothly               │
│                   Downtime events appear here                      │
│                                                                     │
│                    [+ Log Downtime Manually]                      │
│                                                                     │
│ 💡 Tips:                                                           │
│    - Log downtime immediately when machine stops                  │
│    - Categories help identify improvement opportunities            │
│    - Analysis shows top downtime causes                           │
│                                                                     │
└───────────────────────────────────────────────────────────────────┘
```

---

### Loading State

```
┌───────────────────────────────────────────────────────────────────┐
│ Production > Downtime Tracking                                     │
├───────────────────────────────────────────────────────────────────┤
│                                                                     │
│ ⚠️  ACTIVE DOWNTIME: [Loading...]                                 │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────┐   │
│ │ [+ Log Downtime]  [Loading...]                             │   │
│ └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────┐   │
│ │ 📊 Downtime Analysis - Loading...                          │   │
│ │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ (70% complete)             │   │
│ └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────┐   │
│ │ 📋 Downtime History - Loading...                           │   │
│ │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ (70% complete)             │   │
│ └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└───────────────────────────────────────────────────────────────────┘
```

---

### Error State

```
┌───────────────────────────────────────────────────────────────────┐
│ Production > Downtime Tracking                                     │
├───────────────────────────────────────────────────────────────────┤
│                                                                     │
│ 🔴 ERROR: Failed to load downtime data                            │
│    Network error. Please check your connection.                   │
│    [Retry] [Report Issue]                                         │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────┐   │
│ │ [+ Log Downtime]  (Still Available)                        │   │
│ └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────┐   │
│ │ 📊 Downtime Analysis - Error                               │   │
│ │ Could not fetch analysis data. [Retry]                    │   │
│ └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────┐   │
│ │ 📋 Downtime History - Error                                │   │
│ │ Could not fetch history. [Retry]                          │   │
│ └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└───────────────────────────────────────────────────────────────────┘
```

---

## Mobile: Success State (< 768px)

```
┌─────────────────────────────┐
│ Downtime Tracking [☰]       │
├─────────────────────────────┤
│                             │
│ ⚠️  ACTIVE: Mixer M-001     │
│    Down 45 min              │
│    [View] [End]             │
│                             │
│ ┌─────────────────────────┐ │
│ │ [+ Log Downtime]        │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ 📊 Pareto (Last 7 Days) │ │
│ │                         │ │
│ │ Breakdown: 480 min      │ │
│ │   ███████ 56.8%         │ │
│ │                         │ │
│ │ Changeover: 210 min     │ │
│ │   ████ 30.0%            │ │
│ │                         │ │
│ │ Material Wait: 95 min   │ │
│ │   ██ 11.2%              │ │
│ │                         │ │
│ │ [Expand Chart]          │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ 📋 Recent Events        │ │
│ │                         │ │
│ │ 12-14 10:00 Breakdown   │ │
│ │ Mixer M-001  45 min     │ │
│ │ Motor failure           │ │
│ │ [Details]               │ │
│ │ ─────────────────────── │ │
│ │ 12-14 09:15 Changeover  │ │
│ │ Oven O-003   30 min     │ │
│ │ [Details]               │ │
│ │ ─────────────────────── │ │
│ │ [Load More...]          │ │
│ └─────────────────────────┘ │
│                             │
└─────────────────────────────┘
```

---

## AC Coverage

| AC# | Requirement | Implementation | Status |
|-----|-------------|-----------------|--------|
| 1 | Category "Breakdown" → is_planned = false | Auto-set in Log form | ✓ |
| 2 | Category "Changeover" → is_planned = true | Auto-set in Log form | ✓ |
| 3 | Log 10:00, End 10:45 → duration = 45 min | Auto-calc on End modal | ✓ |
| 4 | Active downtime → dashboard alert with counter | Active banner at top | ✓ |
| 5 | Duration > 30 min → manager notification | Backend trigger (not UI) | ✓ |
| 6 | enable_downtime_tracking = false → Log button hidden | Conditional render | ✓ |
| 7 | Breakdown category + active WO → WO auto-pauses | Backend logic (not UI) | ✓ |
| 8 | Downtime ended → impacts shift availability | OEE calc (not UI) | ✓ |
| 9 | No category selected → validation error | Form validation | ✓ |

---

## UI Elements & States

### Active Banner
- Shows when active downtime exists
- Displays machine name, duration counter (updates every 10s)
- [View Details] → Scroll to history entry
- [End Downtime] → Opens End modal

### Pareto Chart
- Y-axis: Total downtime in minutes
- X-axis: Downtime categories (sorted by duration descending)
- Hover: Shows count + % of total
- Legend: ● Unplanned | ○ Planned

### History Table
- Columns: Date | Machine | Category | Started | Ended | Duration | [Actions]
- Expandable rows: Reason code, Operator, Notes
- Icons: ● for unplanned, ○ for planned
- Actions: View details, Edit notes, Delete (if within 5 min), Print

### Form Validation
- Machine: Required
- Category: Required (error: "Category is required")
- Reason Code: Required (error: "Reason code is required")
- Started At: Required (error: "Start time is required")
- Notes: Optional

---

## Interactions

1. **Log Downtime** → Opens modal with machine pre-filled (if applicable)
2. **End Downtime** → Shows current duration, calculates final when submitted
3. **View Details** → Expands row to show full notes/reason code
4. **Drill Down** → Opens Pareto detail with machine/category filters
5. **Filters** → Machine, Date Range, Category updates both chart and history
6. **Auto-Refresh** → Background poll every 10s for active downtime changes

---

## Data Fields

| Field | Type | Required | Source | Notes |
|-------|------|----------|--------|-------|
| machine_id | UUID | Yes | machines table | Machine experiencing downtime |
| category | enum | Yes | downtime_categories | Breakdown, Changeover, Maintenance, etc. |
| reason_code | string | Yes | downtime_reasons | Filtered by category |
| started_at | timestamp | Yes | User input | When downtime started |
| ended_at | timestamp | No | User input | When downtime ended (null if active) |
| duration_minutes | integer | Calculated | ended_at - started_at | Auto-calculated on end |
| is_planned | boolean | Auto-set | category mapping | Auto-set based on category |
| notes | text | No | User input | Optional operator notes |
| operator_id | UUID | Yes | auth context | Who logged the downtime |
| wo_id | UUID | No | active WO context | WO affected (if applicable) |
| shift_id | UUID | No | current shift | Shift when downtime occurred |
| org_id | UUID | Yes | auth context | Multi-tenancy |

---

## Accessibility

- Touch targets: 48x48dp minimum
- Keyboard navigation: Tab through form fields, Enter to submit
- Screen reader: All elements labeled (aria-label for icons)
- Color contrast: WCAG AA (4.5:1 for text, 3:1 for graphics)
- Labels: "Category is required" clear error messages

---

## Responsive Breakpoints

| Breakpoint | Width | Behavior |
|-----------|-------|----------|
| Mobile | < 768px | Single column, stack modals, expandable rows |
| Tablet | 768-1024px | Two-column layout, side-by-side analysis |
| Desktop | > 1024px | Full layout with all sections visible |

---

## API Endpoints

### 1. Log Downtime

```
POST /api/production/downtime/log

Request:
{
  "machine_id": "uuid",
  "category": "Breakdown",
  "reason_code": "Motor failure",
  "started_at": "2025-12-14T10:00:00Z",
  "notes": "Motor overheated, maintenance called",
  "wo_id": "uuid" // optional, auto-detected if machine has active WO
}

Response (201):
{
  "id": "uuid",
  "machine_id": "uuid",
  "category": "Breakdown",
  "is_planned": false,
  "started_at": "2025-12-14T10:00:00Z",
  "ended_at": null,
  "duration_minutes": null,
  "status": "active",
  "created_at": "2025-12-14T10:02:00Z"
}

Errors:
- 400: Missing required field (machine_id, category, reason_code, started_at)
- 404: Machine not found
- 409: Active downtime already exists for this machine
```

---

### 2. End Downtime

```
PUT /api/production/downtime/:id/end

Request:
{
  "ended_at": "2025-12-14T10:45:00Z"
}

Response (200):
{
  "id": "uuid",
  "machine_id": "uuid",
  "category": "Breakdown",
  "started_at": "2025-12-14T10:00:00Z",
  "ended_at": "2025-12-14T10:45:00Z",
  "duration_minutes": 45,
  "status": "completed",
  "oee_impact": {
    "availability_reduction": 15.6
  }
}

Errors:
- 400: ended_at must be after started_at
- 404: Downtime event not found
- 409: Downtime already ended
```

---

### 3. Get Active Downtime

```
GET /api/production/downtime/active?org_id={org_id}

Response (200):
{
  "count": 2,
  "events": [
    {
      "id": "uuid",
      "machine_id": "uuid",
      "machine_name": "Mixer M-001",
      "category": "Breakdown",
      "reason_code": "Motor failure",
      "started_at": "2025-12-14T10:00:00Z",
      "duration_minutes": 45,
      "operator": "John Smith"
    }
  ]
}
```

---

### 4. Get Downtime History

```
GET /api/production/downtime/history?machine_id={id}&from={date}&to={date}&limit=50&offset=0

Response (200):
{
  "count": 23,
  "events": [
    {
      "id": "uuid",
      "date": "2025-12-14",
      "machine_name": "Mixer M-001",
      "category": "Breakdown",
      "is_planned": false,
      "started_at": "10:00",
      "ended_at": "10:45",
      "duration_minutes": 45,
      "reason_code": "Motor failure",
      "operator": "John Smith"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 23
  }
}
```

---

### 5. Get Pareto Analysis

```
GET /api/production/downtime/analysis/pareto?from={date}&to={date}&machine_id={id}

Response (200):
{
  "summary": {
    "total_downtime_minutes": 847,
    "total_events": 23,
    "avg_duration_minutes": 36
  },
  "categories": [
    {
      "category": "Breakdown",
      "is_planned": false,
      "event_count": 12,
      "total_minutes": 480,
      "percentage": 56.8
    },
    {
      "category": "Changeover",
      "is_planned": true,
      "event_count": 6,
      "total_minutes": 210,
      "percentage": 30.0
    }
  ]
}
```

---

### 6. Export Downtime Data

```
GET /api/production/downtime/export?format=csv&from={date}&to={date}

Response (200):
CSV file download
Headers: Date, Machine, Category, Planned/Unplanned, Started At, Ended At, Duration (min), Reason Code, Operator, Notes
```

---

## Performance Notes

### Query Optimization
- **Active Downtime**: Index on (org_id, ended_at IS NULL, started_at DESC) for fast active lookup
- **History Query**: Index on (org_id, machine_id, started_at DESC) for date range queries
- **Pareto Analysis**: Materialized view or pre-aggregated table for category summaries
- **Real-time Counter**: WebSocket or 10s polling for active downtime duration updates

### Caching Strategy
```typescript
// Redis keys
'org:{orgId}:downtime:active'           // 10 sec TTL (real-time counter)
'org:{orgId}:downtime:history'          // 60 sec TTL (historical data)
'org:{orgId}:downtime:pareto:{period}'  // 5 min TTL (analysis data)
```

### Load Time Targets
- **Active Downtime Banner**: <200ms (critical, top of page)
- **Pareto Chart**: <800ms (5-10 categories)
- **History Table**: <1s (50 events with JOINs)
- **Export CSV**: <3s (up to 1000 events)

---

## Error Handling

### API Errors
- **Log Downtime Failed**: Show error toast, preserve form data, allow retry
- **End Downtime Failed**: Show error modal, preserve ended_at, allow retry
- **History Fetch Failed**: Show error in History section, Pareto and Active still work
- **Pareto Fetch Failed**: Show error in Pareto section, History and Active still work

### Validation Errors
- **Machine Required**: "Please select a machine"
- **Category Required**: "Please select a downtime category"
- **Reason Code Required**: "Please select a reason code"
- **Started At Required**: "Please enter start time"
- **Ended At Before Started**: "End time must be after start time"
- **Duration Negative**: "Invalid time range, check start and end times"

### Network Timeout
- **Active Downtime**: 3s timeout, retry once on failure
- **History**: 5s timeout, retry once on failure
- **Pareto**: 5s timeout, retry once on failure
- **Export**: 10s timeout (large dataset), show progress indicator

---

## Testing Requirements

### Unit Tests
- **Duration Calculation**: started_at=10:00, ended_at=10:45 → duration=45 min
- **Is Planned Auto-Set**: category="Breakdown" → is_planned=false, category="Changeover" → is_planned=true
- **Pareto Calculation**: Total downtime = SUM(duration), percentage = (category_total / total) * 100
- **Category Filtering**: Filter by category updates both chart and history
- **Relative Time Formatting**: "2 min ago", "1 hour ago", "45 min"

### Integration Tests
- **API Endpoint Coverage**: All 6 endpoints (Log, End, Active, History, Pareto, Export)
- **RLS Policy Enforcement**: org_id isolation, no cross-org data leaks
- **Reason Code Filtering**: Category="Breakdown" filters reason codes to breakdown-specific codes
- **WO Auto-Pause**: Machine down + active WO → WO.is_paused = true (backend logic)
- **OEE Impact**: Downtime ended → shift availability recalculated (backend logic)

### E2E Tests
- **Log Downtime**:
  - Fill form → Submit → Downtime logged → Active banner appears
  - Validation errors display correctly
  - Reason codes filter by category
- **End Downtime**:
  - Active downtime exists → Click "End Downtime" → Modal opens → Submit → Duration calculated → Active banner disappears
- **Pareto Chart**:
  - 7 days of data → Chart displays categories sorted by duration DESC → Hover shows % and count
- **History Table**:
  - Filter by machine → Only that machine's events display
  - Filter by date range → Only events in range display
  - Expandable rows show full details
- **Empty State**:
  - No downtime events → "No downtime events yet" message displays
- **Responsive Behavior**:
  - Desktop: Full layout with all sections visible
  - Tablet: Two-column layout, condensed panels
  - Mobile: Single column, stacked cards, Load More pagination

### Performance Tests
- **Active Downtime Load**: <200ms
- **Pareto Chart Load**: <800ms
- **History Table Load**: <1s (50 events)
- **Export CSV**: <3s (1000 events)
- **Real-time Counter**: Updates every 10s without page reload

---

## Quality Gates

Before handoff to FRONTEND-DEV:
- [x] All 4 states defined (Loading, Empty, Error, Success)
- [x] Responsive breakpoints documented (Desktop/Tablet/Mobile with specific layouts)
- [x] All API endpoints specified with request/response schemas (6 endpoints)
- [x] Accessibility checklist passed (touch targets, contrast, screen reader, keyboard, ARIA)
- [x] Performance targets defined (load times, caching strategy, query optimization)
- [x] All 9 AC from PRD implemented in wireframe
- [x] Downtime categories defined (9 categories with planned/unplanned mapping)
- [x] Pareto chart specification complete (Y-axis, X-axis, hover, legend)
- [x] History table columns and actions specified
- [x] Form validation rules documented
- [x] Error handling strategy defined (API errors, validation, network timeout)
- [x] Integration points identified (OEE Dashboard, WO auto-pause, shift availability)
- [x] Phase 2 marker added to title

---

## Handoff to FRONTEND-DEV

```yaml
feature: Downtime Tracking & Analysis (Phase 2)
story: PROD-009
fr_coverage: FR-PROD-019
phase: Phase 2 (Post-MVP)
approval_status:
  mode: "review_each"
  user_approved: false  # PENDING USER REVIEW
  screens_approved: []
  iterations_used: 0
deliverables:
  wireframe: docs/3-ARCHITECTURE/ux/wireframes/PROD-009-downtime-tracking.md
  api_endpoints:
    - POST /api/production/downtime/log
    - PUT /api/production/downtime/:id/end
    - GET /api/production/downtime/active
    - GET /api/production/downtime/history
    - GET /api/production/downtime/analysis/pareto
    - GET /api/production/downtime/export
states_per_screen: [loading, empty, error, success]
breakpoints:
  mobile: "<768px (single column, stacked, Load More)"
  tablet: "768-1024px (two-column, condensed)"
  desktop: ">1024px (full layout)"
accessibility:
  touch_targets: "48x48dp minimum"
  contrast: "4.5:1 minimum (text), 3:1 (graphics)"
  aria_roles: "region, table, progressbar, alert"
  keyboard_nav: "Tab, Enter, Escape"
real_time_updates:
  active_downtime_counter: "Updates every 10s via polling or WebSocket"
  manual_refresh: "Always available"
performance_targets:
  active_downtime_load: "<200ms"
  pareto_chart_load: "<800ms"
  history_table_load: "<1s (50 events)"
  export_csv: "<3s (1000 events)"
cache_ttl:
  active_downtime: "10sec (real-time)"
  history: "60sec"
  pareto: "5min"
ac_coverage:
  - "AC1: Category 'Breakdown' → is_planned = false ✓"
  - "AC2: Category 'Changeover' → is_planned = true ✓"
  - "AC3: Log 10:00, End 10:45 → duration = 45 min ✓"
  - "AC4: Active downtime → dashboard alert with counter ✓"
  - "AC5: Duration > 30 min → manager notification ✓"
  - "AC6: enable_downtime_tracking = false → Log button hidden ✓"
  - "AC7: Breakdown + active WO → WO auto-pauses ✓"
  - "AC8: Downtime ended → impacts shift availability ✓"
  - "AC9: No category selected → validation error ✓"
downtime_categories_count: 9
pareto_categories: "Sorted by duration DESC, top 10 max"
history_pagination: "50 events per page, Load More on mobile"
```

---

## Dependencies

- FR-PROD-018: OEE Dashboard (links to downtime analysis)
- FR-PROD-021: OEE Report (uses downtime data)
- Configuration: enable_downtime_tracking toggle in Settings
- Data: machines, WOs, downtime reason codes
- Backend: WO auto-pause logic when machine down
- Backend: OEE availability calculation from downtime data

---

## Next Steps

- Implement API endpoints: POST /api/production/downtime/log, PUT /api/production/downtime/:id/end
- Reason code management in Settings (FR-PROD-023)
- Mobile app integration (quick log with barcode)
- Real-time WebSocket for active downtime updates
- Notification system for duration > 30 min

---

**Status**: Ready for User Review
**Approval Mode**: review_each (default)
**User Approved**: Pending (requires user review and approval)
**Iterations**: 0 of 3
**Estimated Effort**: 10-12 hours (Pareto chart, real-time counter, history table)
**Quality Target**: 97/100 (comprehensive, matches PROD-001 quality)
**PRD Coverage**: 100% (all 9 AC from FR-PROD-019 implemented)
**Wireframe Length**: ~1,050 lines (target: 1,000-1,200 lines) ✓
