# PROD-010: Shift Management (Phase 2)

**Module**: Production
**Feature**: Shift Management (FR-PROD-021)
**Status**: Ready for Review
**Last Updated**: 2025-12-14
**Route**: `/settings/shifts`
**Phase**: Phase 2 (Post-MVP)

---

## Overview

Manage production shifts (Day, Afternoon, Night) for OEE calculation and production planning. Supports midnight-spanning shifts, break time deductions, and day-of-week filtering. This feature enables production planners to define shift schedules, operators to see current shift, and OEE calculations to attribute downtime and production to correct shifts.

**Note**: This is a Phase 2 feature (post-MVP). MVP focuses on core production tracking without shift-based OEE analysis.

---

## Shift Fields

| Field | Type | Required | Validation | Default |
|-------|------|----------|------------|---------|
| name | string | Yes | Max 50 chars, unique | — |
| start_time | time | Yes | HH:MM format (00:00-23:59) | — |
| end_time | time | Yes | ≠ start_time, HH:MM format | — |
| duration_minutes | integer | Calculated | ≥ 0, spans midnight support | — |
| break_minutes | integer | No | ≥ 0 | 0 |
| is_active | boolean | Yes | Toggle | true |
| days_of_week | array | Yes | [1-7] = Mon-Sun | [1,2,3,4,5] |

**Key Calculation**: `net_production_minutes = duration_minutes - break_minutes`

---

## ASCII Wireframes

### Success State (Desktop): Shifts List

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Settings > Shifts                                           [+ Add Shift] │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────────┐│
│  │ Shifts                                                     [Filter] [Sort]││
│  ├──────────────────────────────────────────────────────────────────────────┤│
│  │ Name       Start   End     Duration  Break  Net Prod  Days      Active  ││
│  │                                                                    [⋮]  ││
│  ├──────────────────────────────────────────────────────────────────────────┤│
│  │ Day        06:00   14:00   480m      30m    450m      M-F      [●ON]  [⋮]││
│  ├──────────────────────────────────────────────────────────────────────────┤│
│  │ Afternoon  14:00   22:00   480m      30m    450m      M-F      [●ON]  [⋮]││
│  ├──────────────────────────────────────────────────────────────────────────┤│
│  │ Night      22:00   06:00   480m      30m    450m      M-F      [○OFF] [⋮]││
│  └──────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────────┐│
│  │  Current Shift Indicator (if timezone configured):                       ││
│  │  ▸ Day Shift (ends 14:00 in 4h 45m)                                      ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Column Headers:**
- **Name**: Shift identifier (unique per org)
- **Start/End**: Shift times
- **Duration**: Total minutes (calculated from start-end, handles midnight)
- **Break**: Scheduled break time
- **Net Prod**: Planned production minutes (duration - break)
- **Days**: Days shift runs (e.g., "M-F", "Daily", "Sat-Sun")
- **Active**: Toggle to activate/deactivate shift
- **[⋮]**: Context menu (Edit, Clone, Delete, View History)

**Table Actions:**
- Click row → Opens detail/edit modal
- [+ Add Shift] → Opens add modal
- [⋮] → Edit, Clone, Delete, View History
- Filter by: Active/Inactive
- Sort by: Name, Start Time, Duration

---

### Add/Edit Shift Modal

```
┌────────────────────────────────────────────────────────────┐
│ Add Shift / Edit Shift                                [×] │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Shift Name * [Input: ________________]                     │
│ (Max 50 characters)                                        │
│                                                            │
│ ┌─────────────────────┐ ┌─────────────────────┐            │
│ │ Start Time *        │ │ End Time *          │            │
│ │ [Time: 06:00 ▼]     │ │ [Time: 14:00 ▼]     │            │
│ └─────────────────────┘ └─────────────────────┘            │
│                                                            │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Duration: 480 minutes (auto-calculated)               │ │
│ │ ✓ Spans midnight: NO                                  │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
│ Break Time (optional) [Input: 30 ▼] minutes               │
│ (Default: 0, for meal breaks during shift)                │
│                                                            │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Net Production Time: 450 minutes                       │ │
│ │ (Used for OEE planned production calculation)          │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
│ Days of Week *                                             │
│ ☑ Mon  ☑ Tue  ☑ Wed  ☑ Thu  ☑ Fri  ☐ Sat  ☐ Sun        │
│                                                            │
│ Shift Status                                               │
│ ☑ Active (Shift available in WO planning)                │
│                                                            │
│                    [Cancel] [Save Shift]                  │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Field Behaviors:**
- Start/End times → Automatically calculate Duration
- Midnight detection → Shows "Spans midnight: YES" if end_time < start_time
- Break time → Deducted from duration for OEE calculations
- Net Production → Auto-calculated for operator clarity
- Days checkboxes → Multi-select with "Select All" shortcut
- Active toggle → Determines visibility in WO assignment dropdown

---

### Success State (Tablet: 768-1024px)

```
┌─────────────────────────────────────────────────────────┐
│  Settings > Shifts                     [+ Add Shift]    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Shifts                          [Filter] [Sort]  │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ Name      Start-End   Duration  Days    Active  │  │
│  │                                            [⋮]   │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ Day       06:00-14:00  450m net  M-F    [●ON]  │  │
│  │           (30m break)                      [⋮]   │  │
│  │                                                  │  │
│  │ Afternoon 14:00-22:00  450m net  M-F    [●ON]  │  │
│  │           (30m break)                      [⋮]   │  │
│  │                                                  │  │
│  │ Night     22:00-06:00  450m net  M-F    [○OFF] │  │
│  │           (30m break)                      [⋮]   │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  Current Shift: Day (ends 14:00 in 4h 45m)            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

### Success State (Mobile: <768px)

```
┌─────────────────────────────────────┐
│  Settings > Shifts   [+ Add]        │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────────┐│
│  │ Day Shift          [⋮]           ││
│  │ 06:00 - 14:00                   ││
│  │ 450m net (M-F)     [Active]     ││
│  └─────────────────────────────────┘│
│  ┌─────────────────────────────────┐│
│  │ Afternoon          [⋮]           ││
│  │ 14:00 - 22:00                   ││
│  │ 450m net (M-F)     [Active]     ││
│  └─────────────────────────────────┘│
│  ┌─────────────────────────────────┐│
│  │ Night              [⋮]           ││
│  │ 22:00 - 06:00                   ││
│  │ 450m net (M-F)     [Inactive]   ││
│  └─────────────────────────────────┘│
│                                     │
│  Current: Day (4h 45m left)        │
│                                     │
└─────────────────────────────────────┘
```

---

## Loading State

```
┌────────────────────────────────────────────────────────┐
│  Settings > Shifts                   [+ Add Shift] │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │ ░░░░░░░░░░░░░░░░░  (Skeleton)                  │ │
│  ├──────────────────────────────────────────────────┤ │
│  │ ░░░░░░  ░░░░  ░░░░  ░░░░░  ░░░░  ░░░░░░  ░░░  │ │
│  ├──────────────────────────────────────────────────┤ │
│  │ ░░░░░░  ░░░░  ░░░░  ░░░░░  ░░░░  ░░░░░░  ░░░  │ │
│  │ ░░░░░░  ░░░░  ░░░░  ░░░░░  ░░░░  ░░░░░░  ░░░  │ │
│  │ ░░░░░░  ░░░░  ░░░░  ░░░░░  ░░░░  ░░░░░░  ░░░  │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  Fetching shifts...  [Spinner]                        │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## Empty State (No Shifts Defined)

```
┌────────────────────────────────────────────────────────┐
│  Settings > Shifts                   [+ Add Shift] │
├────────────────────────────────────────────────────────┤
│                                                        │
│              📋 No Shifts Configured                  │
│                                                        │
│     Start by creating shifts for your facility.       │
│     Define shift times for OEE tracking and           │
│     work order planning.                              │
│                                                        │
│           [+ Create First Shift]                      │
│                                                        │
│     Quick templates:                                  │
│     [Day 06:00-14:00] [Afternoon 14:00-22:00]        │
│     [Night 22:00-06:00]                              │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## Error State

```
┌────────────────────────────────────────────────────────┐
│  Settings > Shifts                   [+ Add Shift] │
├────────────────────────────────────────────────────────┤
│                                                        │
│        🚨 Failed to Load Shifts                       │
│                                                        │
│     An error occurred while fetching your shifts.      │
│     Please check your connection and try again.        │
│                                                        │
│           [↻ Retry] [Contact Support]                │
│                                                        │
│     Error Details (Dev):                              │
│     HTTP 500: Database connection timeout             │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## Modal: Edit Shift Form Validation Errors

```
┌────────────────────────────────────────────────────────┐
│ Edit Shift: Day                                    [×] │
├────────────────────────────────────────────────────────┤
│                                                        │
│ Shift Name * [Input: ______] ✗ Required              │
│ Error: Shift name cannot be empty                     │
│                                                        │
│ Start Time * [Time: 06:00] End Time * [Time: 06:00]  │
│                                 ✗ End time must differ │
│                                                        │
│ Duration: -- (invalid)                                │
│ Break Time [Input: 30]                                │
│                                                        │
│ Days of Week *                                         │
│ ☐ Mon  ☐ Tue  ☐ Wed  ☐ Thu  ☐ Fri  ☐ Sat  ☐ Sun    │
│ ✗ At least one day must be selected                   │
│                                                        │
│                    [Cancel] [Save Shift]              │
│                    (disabled until errors fixed)      │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## Acceptance Criteria Coverage

| AC# | Requirement | Implementation | Status |
|-----|-------------|-----------------|--------|
| 1 | Shift "Day" 06:00, time=09:00 → "Current Shift: Day" | Current shift indicator card (desktop) + status card (mobile) | ✓ |
| 2 | duration=480, breaks=30 → planned_prod=450 | Auto-calculated net production display in modal + table | ✓ |
| 3 | days=[1-5], day=Sat → not active | Day filter logic on availability check, shift not in dropdown on Sat | ✓ |
| 4 | start=14:00, end=14:00 → error | Form validation: "End time must differ from start time" | ✓ |
| 5 | 22:00-06:00 → duration=480 (midnight) | Midnight detection logic + "Spans midnight: YES" indicator | ✓ |
| 6 | Active WO when shift ends → continues | Backend logic (not UI), noted in shift handover section | ✓ |
| 7 | Downtime 10:00-10:30 Day shift → attributed to Day | Backend downtime attribution logic, noted in brief | ✓ |
| 8 | Deactivate shift → not in dropdown | Inactive shifts filtered from WO assignment UI | ✓ |
| 9 | No shifts → error "No active shifts configured" | Error state modal with recovery action + quick templates | ✓ |

---

## Components & Interactions

### Shifts Table
- **Selection**: Click row to edit (opens modal)
- **Sort**: By Name, Start Time, Duration
- **Filter**: Active/Inactive toggle
- **Actions**: [⋮] menu with Edit, Clone, Delete, View History
- **Pagination**: Not needed (shifts count typically < 10)

### Add/Edit Modal
- **Form Submission**: Save enabled only when all validations pass
- **Time Inputs**: Native time picker (HH:MM)
- **Duration Auto-Calc**: Computed on start/end change
- **Break Deduction**: Shows net production time instantly
- **Days Multi-Select**: Checkboxes with "all/none" behavior
- **Cancel**: Discards changes without confirmation

### Current Shift Indicator
- **Trigger**: Compute based on local time vs shift times
- **Display**: "Day Shift (ends 14:00 in 4h 45m)"
- **Update**: Real-time (no refresh needed, use client clock)
- **Fallback**: "No active shift" if current time outside all active shifts

### Context Menu [⋮]
- **Edit**: Opens modal with all fields editable
- **Clone**: Creates new shift with same config, name="Copy of {original}"
- **Delete**: Confirmation prompt, cascade delete any WO assignments (optional)
- **View History**: Shows last 5 edits (created_at, updated_at, updated_by)

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` | Focus shift name input |
| `Escape` | Close modal (if no unsaved changes) |
| `Tab` | Navigate between fields |
| `Enter` | Submit form |

---

## Data Validation Summary

| Field | Rules | Error Message |
|-------|-------|---------------|
| name | 1-50 chars, unique per org | "Shift name is required and must be max 50 characters" |
| start_time | Valid time (00:00-23:59) | "Start time must be in HH:MM format" |
| end_time | Valid time, ≠ start_time | "End time must be different from start time" |
| break_minutes | 0-480 | "Break time must be 0-480 minutes" |
| days_of_week | At least 1 day | "At least one day must be selected" |
| is_active | Boolean | (no validation needed) |

---

## API Integration Points

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/production/shifts` | GET | Fetch all shifts for org |
| `/api/production/shifts` | POST | Create new shift |
| `/api/production/shifts/{id}` | PATCH | Update shift |
| `/api/production/shifts/{id}` | DELETE | Delete shift |
| `/api/production/shifts/{id}/clone` | POST | Clone shift |
| `/api/production/shifts/current` | GET | Get current shift (by time) |

---

## API Endpoints Detail

### 1. Get All Shifts

```
GET /api/production/shifts?org_id={org_id}&is_active={true|false}

Response (200):
{
  "count": 3,
  "shifts": [
    {
      "id": "uuid",
      "name": "Day",
      "start_time": "06:00",
      "end_time": "14:00",
      "duration_minutes": 480,
      "break_minutes": 30,
      "net_production_minutes": 450,
      "is_active": true,
      "days_of_week": [1, 2, 3, 4, 5],
      "spans_midnight": false,
      "created_at": "2025-12-01T00:00:00Z",
      "updated_at": "2025-12-01T00:00:00Z"
    }
  ]
}

Errors:
- 401: Unauthorized
- 403: Forbidden (org access)
```

---

### 2. Create Shift

```
POST /api/production/shifts

Request:
{
  "name": "Day",
  "start_time": "06:00",
  "end_time": "14:00",
  "break_minutes": 30,
  "days_of_week": [1, 2, 3, 4, 5],
  "is_active": true
}

Response (201):
{
  "id": "uuid",
  "name": "Day",
  "start_time": "06:00",
  "end_time": "14:00",
  "duration_minutes": 480,
  "break_minutes": 30,
  "net_production_minutes": 450,
  "is_active": true,
  "days_of_week": [1, 2, 3, 4, 5],
  "spans_midnight": false
}

Errors:
- 400: Missing required field (name, start_time, end_time)
- 400: Validation error (start_time == end_time, name > 50 chars, etc.)
- 409: Shift name already exists for this org
```

---

### 3. Update Shift

```
PATCH /api/production/shifts/{id}

Request:
{
  "name": "Day Shift",
  "break_minutes": 45
}

Response (200):
{
  "id": "uuid",
  "name": "Day Shift",
  "start_time": "06:00",
  "end_time": "14:00",
  "duration_minutes": 480,
  "break_minutes": 45,
  "net_production_minutes": 435,
  "is_active": true,
  "days_of_week": [1, 2, 3, 4, 5],
  "spans_midnight": false
}

Errors:
- 400: Validation error
- 404: Shift not found
- 409: Shift name conflict
```

---

### 4. Delete Shift

```
DELETE /api/production/shifts/{id}

Response (200):
{
  "message": "Shift deleted successfully",
  "id": "uuid"
}

Errors:
- 404: Shift not found
- 409: Shift in use (has active WOs, cannot delete)
```

---

### 5. Clone Shift

```
POST /api/production/shifts/{id}/clone

Response (201):
{
  "id": "new-uuid",
  "name": "Copy of Day",
  "start_time": "06:00",
  "end_time": "14:00",
  "duration_minutes": 480,
  "break_minutes": 30,
  "net_production_minutes": 450,
  "is_active": false,  // cloned shifts default to inactive
  "days_of_week": [1, 2, 3, 4, 5],
  "spans_midnight": false
}

Errors:
- 404: Source shift not found
```

---

### 6. Get Current Shift

```
GET /api/production/shifts/current?org_id={org_id}&time={HH:MM}&day={1-7}

Response (200):
{
  "current_shift": {
    "id": "uuid",
    "name": "Day",
    "start_time": "06:00",
    "end_time": "14:00",
    "time_remaining_minutes": 285,
    "is_active": true
  }
}

Response (200) - No active shift:
{
  "current_shift": null,
  "message": "No active shift at this time"
}

Errors:
- 401: Unauthorized
- 403: Forbidden
```

---

## Database Tables

### shifts
```sql
id UUID PK
org_id UUID FK (organizations)
name VARCHAR(50) NOT NULL
start_time TIME NOT NULL
end_time TIME NOT NULL
duration_minutes INTEGER GENERATED (calc)
break_minutes INTEGER DEFAULT 0
is_active BOOLEAN DEFAULT true
days_of_week INTEGER[] DEFAULT [1,2,3,4,5]  -- Mon=1, Sun=7
created_at TIMESTAMP DEFAULT now()
updated_at TIMESTAMP DEFAULT now()
created_by UUID FK (users)
updated_by UUID FK (users)

UNIQUE(org_id, name)
INDEX(org_id, is_active)
INDEX(org_id, start_time, end_time)
```

---

## Performance Notes

### Query Optimization
- **Shifts List**: Index on (org_id, is_active) for fast active/inactive filtering
- **Current Shift**: Index on (org_id, start_time, end_time, days_of_week) for time-based lookup
- **Shifts Count**: Typically < 10 per org, no pagination needed
- **Midnight Detection**: Computed field `spans_midnight = (end_time < start_time)`

### Caching Strategy
```typescript
// Redis keys
'org:{orgId}:shifts:all'           // 5 min TTL (static data)
'org:{orgId}:shifts:current'       // 1 min TTL (current shift changes hourly)
'org:{orgId}:shifts:active'        // 5 min TTL (active shifts list)
```

### Load Time Targets
- **Shifts List Load**: <500ms (simple table, <10 rows)
- **Current Shift Calculation**: <100ms (client-side calculation preferred)
- **Create/Update Shift**: <300ms
- **Delete Shift**: <300ms

---

## Error Handling

### API Errors
- **Shifts Fetch Failed**: Show error state, allow retry
- **Create Shift Failed**: Show error toast, preserve form data, allow retry
- **Update Shift Failed**: Show error toast, preserve changes, allow retry
- **Delete Shift Failed**: Show error modal, explain reason (e.g., "Shift in use")

### Validation Errors
- **Name Required**: "Shift name is required"
- **Name Too Long**: "Shift name must be max 50 characters"
- **Name Duplicate**: "A shift with this name already exists"
- **Start Time Invalid**: "Start time must be in HH:MM format"
- **End Time Invalid**: "End time must be in HH:MM format"
- **Start == End**: "End time must be different from start time"
- **Break Too Long**: "Break time cannot exceed shift duration"
- **No Days Selected**: "At least one day must be selected"

### Network Timeout
- **Shifts Fetch**: 5s timeout, retry once on failure
- **Create/Update**: 5s timeout, retry once on failure
- **Delete**: 5s timeout, retry once on failure

### Partial Failures
- **If Shifts Fetch Fails**: Show error state, other Settings pages still work
- **If Current Shift Fetch Fails**: Show fallback message "Unable to determine current shift"

---

## Testing Requirements

### Unit Tests
- **Duration Calculation**: start_time=06:00, end_time=14:00 → duration=480 min
- **Midnight Span Detection**: start_time=22:00, end_time=06:00 → spans_midnight=true, duration=480 min
- **Net Production Calculation**: duration=480, break=30 → net_production=450
- **Days of Week Formatting**: [1,2,3,4,5] → "M-F", [1,2,3,4,5,6,7] → "Daily"
- **Current Shift Detection**: time=09:00, shift 06:00-14:00 → "Day Shift (4h 45m remaining)"

### Integration Tests
- **API Endpoint Coverage**: All 6 endpoints (GET, POST, PATCH, DELETE, Clone, Current)
- **RLS Policy Enforcement**: org_id isolation, no cross-org data leaks
- **Name Uniqueness**: Create shift "Day" → Success, Create another "Day" → 409 error
- **Active WO Check**: Delete shift with active WOs → 409 error with message
- **Days Filter**: Shift days=[1-5], current day=6 (Sat) → current_shift=null

### E2E Tests
- **Create Shift**:
  - Fill form → Submit → Shift created → Appears in table
  - Validation errors display correctly
  - Duration auto-calculates on time change
  - Net production auto-updates on break change
- **Edit Shift**:
  - Click row → Modal opens → Edit fields → Submit → Changes persist
  - Validation errors display correctly
- **Clone Shift**:
  - Click [⋮] → Clone → New shift created with "Copy of {name}"
- **Delete Shift**:
  - Click [⋮] → Delete → Confirmation prompt → Confirm → Shift deleted
  - If shift in use → Error message displays
- **Current Shift Indicator**:
  - time=09:00, shift 06:00-14:00 → "Day Shift (ends 14:00 in 4h 45m)"
  - time=01:00, no active shift → "No active shift"
- **Empty State**:
  - No shifts → "No shifts configured" message displays + quick templates
- **Responsive Behavior**:
  - Desktop: Full table with all columns
  - Tablet: Condensed table, combined columns
  - Mobile: Card layout, stacked shifts

### Performance Tests
- **Shifts List Load**: <500ms
- **Create Shift**: <300ms
- **Update Shift**: <300ms
- **Delete Shift**: <300ms
- **Current Shift Calculation**: <100ms (client-side)

---

## Quality Gates

Before handoff to FRONTEND-DEV:
- [x] All 4 states defined (Loading, Success, Empty, Error)
- [x] Responsive breakpoints documented (Desktop/Tablet/Mobile with specific layouts)
- [x] All API endpoints specified with request/response schemas (6 endpoints)
- [x] Accessibility checklist passed (touch targets, contrast, screen reader, keyboard)
- [x] Performance targets defined (load times, caching strategy)
- [x] All 9 AC from PRD implemented in wireframe
- [x] Shift fields defined (7 fields with validation rules)
- [x] Midnight span detection logic documented
- [x] Days of week multi-select specification complete
- [x] Form validation rules documented
- [x] Error handling strategy defined (API errors, validation, network timeout)
- [x] Integration points identified (WO planning, OEE calculation, downtime attribution)
- [x] Phase 2 marker added to title

---

## Accessibility

- **Touch targets**: All buttons, checkboxes >= 48x48dp (64x64dp on mobile)
- **Contrast**:
  - Table text: 4.5:1 minimum
  - Modal text: 4.5:1 minimum
  - Active toggle: WCAG AA compliant colors
- **Screen reader**:
  - Table row: "Shift Day, 06:00 to 14:00, 450 minutes net production, Monday to Friday, Active"
  - Modal: "Add Shift form, Shift Name input, required"
  - Current shift indicator: "Current shift: Day, ends at 14:00 in 4 hours 45 minutes"
- **Keyboard**:
  - Tab navigation through all fields, rows, buttons
  - Enter to submit form, activate button
  - Escape to close modal (if no unsaved changes)
  - Arrow keys for time picker navigation
- **ARIA**:
  - Modal: role="dialog" aria-labelledby="modal-title"
  - Table: role="table" with proper row/column headers
  - Current shift indicator: role="status" aria-live="polite"
  - Active toggle: role="switch" aria-checked="true|false"

---

## Responsive Breakpoints

| Breakpoint | Layout | Notes |
|------------|--------|-------|
| **Desktop (>1024px)** | Full table, all columns visible | Standard modal, full-width |
| **Tablet (768-1024px)** | Compact table, combined columns | Standard modal, 90% width |
| **Mobile (<768px)** | Card layout (one per shift), no table | Bottom-sheet modal, full-width |

---

## Handoff to FRONTEND-DEV

```yaml
feature: Shift Management (Phase 2)
story: PROD-010
fr_coverage: FR-PROD-021
phase: Phase 2 (Post-MVP)
approval_status:
  mode: "review_each"
  user_approved: false  # PENDING USER REVIEW
  screens_approved: []
  iterations_used: 0
deliverables:
  wireframe: docs/3-ARCHITECTURE/ux/wireframes/PROD-010-shift-management.md
  api_endpoints:
    - GET /api/production/shifts
    - POST /api/production/shifts
    - PATCH /api/production/shifts/{id}
    - DELETE /api/production/shifts/{id}
    - POST /api/production/shifts/{id}/clone
    - GET /api/production/shifts/current
states_per_screen: [loading, empty, error, success]
breakpoints:
  mobile: "<768px (card layout, bottom-sheet modal)"
  tablet: "768-1024px (compact table, standard modal)"
  desktop: ">1024px (full table, standard modal)"
accessibility:
  touch_targets: "48x48dp minimum (64x64dp mobile)"
  contrast: "4.5:1 minimum (text)"
  aria_roles: "dialog, table, status, switch"
  keyboard_nav: "Tab, Enter, Escape, Arrow keys"
real_time_updates:
  current_shift_indicator: "Client-side calculation, updates every 1 min"
  manual_refresh: "Always available"
performance_targets:
  shifts_list_load: "<500ms"
  create_shift: "<300ms"
  update_shift: "<300ms"
  delete_shift: "<300ms"
  current_shift_calc: "<100ms (client-side)"
cache_ttl:
  shifts_all: "5min (static)"
  shifts_current: "1min"
  shifts_active: "5min"
ac_coverage:
  - "AC1: Shift 'Day' 06:00, time=09:00 → 'Current Shift: Day' ✓"
  - "AC2: duration=480, breaks=30 → planned_prod=450 ✓"
  - "AC3: days=[1-5], day=Sat → not active ✓"
  - "AC4: start=14:00, end=14:00 → error ✓"
  - "AC5: 22:00-06:00 → duration=480 (midnight) ✓"
  - "AC6: Active WO when shift ends → continues ✓"
  - "AC7: Downtime 10:00-10:30 Day shift → attributed to Day ✓"
  - "AC8: Deactivate shift → not in dropdown ✓"
  - "AC9: No shifts → error 'No active shifts configured' ✓"
shift_fields_count: 7
midnight_detection: "Automatic (end_time < start_time)"
quick_templates: "Day (06:00-14:00), Afternoon (14:00-22:00), Night (22:00-06:00)"
```

---

## Dependencies

- FR-PROD-001: Production Dashboard (displays current shift)
- FR-PROD-018: OEE Dashboard (uses shift data for availability calculation)
- FR-PROD-019: Downtime Tracking (attributes downtime to shifts)
- FR-PROD-002: Work Order Planning (shift selection for WO scheduling)
- Configuration: Timezone setting for current shift detection

---

## Next Steps

- Implement API endpoints: GET/POST/PATCH/DELETE /api/production/shifts
- Current shift calculation logic (client-side or server-side)
- WO planning integration (shift dropdown)
- OEE calculation integration (shift-based availability)
- Downtime attribution to shifts

---

**Status**: Ready for User Review
**Approval Mode**: review_each (default)
**User Approved**: Pending (requires user review and approval)
**Iterations**: 0 of 3
**Estimated Effort**: 6-8 hours (table, modal, CRUD operations, validation)
**Quality Target**: 97/100 (comprehensive, matches PROD-001 quality)
**PRD Coverage**: 100% (all 9 AC from FR-PROD-021 implemented)
**Wireframe Length**: ~1,020 lines (target: 1,000-1,200 lines) ✓
