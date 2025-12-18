# SET-016: Machine List

**Module**: Settings
**Feature**: Machine Management
**Status**: Approved (Auto-Approve Mode)
**Last Updated**: 2025-12-11

---

## ASCII Wireframe

### Success State

```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > Machines                         [+ Add Machine]         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  [Search machines...            ] [Filter: All Types ▼] [Sort: ▼]   │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ Code    Name              Type       Production Line   Status  │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ MCH-001 Industrial Mixer  Mixer      Line A            Active  │   │
│  │         Capacity: 500L • Installed: 2023-01-15         [⋮]    │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ MCH-002 Tunnel Oven       Oven       Line A            Active  │   │
│  │         Max Temp: 250°C • Installed: 2023-01-20        [⋮]    │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ MCH-003 Filling Machine   Filling    Line B            Active  │   │
│  │         Speed: 120 units/min • Installed: 2023-03-10   [⋮]    │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ MCH-004 Labeling Unit     Labeling   Line B            Active  │   │
│  │         Speed: 200 labels/min • Installed: 2023-03-15  [⋮]    │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ MCH-005 Packaging Line    Packaging  -                 Mainten │   │
│  │         Under maintenance since 2025-12-09             [⋮]    │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ MCH-OLD Old Mixer         Mixer      -                 Disabled│
│  │         Decommissioned 2024-11-20 by John Smith        [⋮]    │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  Showing 6 of 6 machines                               [1] [2] [>]   │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘

[⋮] Menu:
  - Edit Machine
  - Assign to Production Line
  - Set to Maintenance / Mark as Active
  - Disable Machine / Enable Machine
  - View Maintenance History
  - View Activity Log
```

### Loading State
```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > Machines                         [+ Add Machine]         │
├─────────────────────────────────────────────────────────────────────┤
│  [████████░░░░░░] [Filter ▼] [Sort ▼]                                │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ [████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]      │   │
│  │ [██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]      │   │
│  └───────────────────────────────────────────────────────────────┘   │
│  Loading machines...                                                  │
└─────────────────────────────────────────────────────────────────────┘
```

### Empty State
```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > Machines                         [+ Add Machine]         │
├─────────────────────────────────────────────────────────────────────┤
│                          [⚙ Icon]                                     │
│                      No Machines Found                                │
│       You haven't registered any machines yet.                        │
│       Start by adding your first production machine.                  │
│                     [+ Add Your First Machine]                        │
└─────────────────────────────────────────────────────────────────────┘
```

### Error State
```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > Machines                         [+ Add Machine]         │
├─────────────────────────────────────────────────────────────────────┤
│                          [⚠ Icon]                                     │
│                  Failed to Load Machines                              │
│       Unable to retrieve machine list. Check your connection.         │
│                   Error: MACHINE_FETCH_FAILED                         │
│                        [Retry]  [Contact Support]                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Key Components

1. **Data Table** - Code, Name, Type (badge), Production Line (link), Status (badge), Actions menu
2. **Search/Filter Bar** - Text search (code/name), type filter, status filter, sort dropdown
3. **Add Machine Button** - Primary CTA (top-right), opens create modal
4. **Actions Menu ([⋮])** - Edit, Assign to Line, Set Maintenance, Disable/Enable, View History, Activity Log
5. **Type Badges** - Mixer (blue), Oven (red), Packaging (green), Filling (purple), Labeling (yellow), Other (gray)
6. **Status Badges** - Active (green), Maintenance (yellow), Disabled (gray)
7. **Machine Details** - Second row shows capacity/specs, installation date, or maintenance/disabled info
8. **Production Line Link** - Clickable, navigates to line details (if assigned)

---

## Main Actions

### Primary
- **[+ Add Machine]** - Opens create modal (code, name, type, specs, install date) → creates machine

### Secondary (Row Actions)
- **Edit Machine** - Opens edit modal (code, name, type, specs, notes)
- **Assign to Production Line** - Dropdown selector → assigns machine to line (updates `production_line_id`)
- **Set to Maintenance** - Confirmation modal (reason, estimated return date) → sets status to 'maintenance'
- **Mark as Active** - Returns machine from maintenance → sets status to 'active'
- **Disable Machine** - Validation check (not in active WO) → confirmation → sets status to 'disabled'
- **Enable Machine** - Re-activates disabled machine
- **View Maintenance History** - Opens panel (past maintenance records, downtime)
- **View Activity Log** - Opens activity panel (changes, who/when)

### Filters/Search
- **Search** - Real-time filter by code or name
- **Filter by Type** - All Types, Mixer, Oven, Packaging, Filling, Labeling, Other
- **Filter by Status** - All, Active, Maintenance, Disabled
- **Sort** - Code, Name, Type, Production Line, Status (asc/desc)

---

## States

- **Loading**: Skeleton rows (3), "Loading machines..." text
- **Empty**: "No machines found" icon, "Add Your First Machine" CTA
- **Error**: "Failed to load machines" warning, Retry + Contact Support buttons
- **Success**: Table with machine rows, search/filter controls, pagination if >20

---

## Data Fields

| Field | Type | Notes |
|-------|------|-------|
| code | string | Unique per org (e.g., MCH-001) |
| name | string | Display name |
| type | enum | Mixer, Oven, Packaging, Filling, Labeling, Other |
| production_line_id | uuid | FK to production_lines (nullable) |
| production_line_name | string | Display name of assigned line |
| status | enum | active, maintenance, disabled |
| specs | jsonb | Capacity, max temp, speed, etc. (flexible) |
| installed_at | date | Installation date |
| maintenance_since | timestamp | For status: maintenance |
| disabled_at | timestamp | For status: disabled |
| disabled_by | user_id | Who disabled |
| notes | text | Additional info (optional) |

---

## Permissions

| Role | Can View | Can Add | Can Edit | Can Assign | Can Set Maintenance | Can Disable |
|------|----------|---------|----------|------------|---------------------|-------------|
| Super Admin | All | Yes | All | Yes | Yes | Yes |
| Admin | All | Yes | All | Yes | Yes | Yes |
| Manager | All | Yes | All | Yes | Yes | No |
| Operator | All | No | No | No | Yes | No |
| Viewer | All | No | No | No | No | No |

---

## Validation

- **Create**: Code must be unique in org, type required, name required (max 100 chars)
- **Assign to Line**: Machine can only be assigned to one line at a time (updates existing assignment)
- **Set Maintenance**: Cannot set to maintenance if used in active work order (validation check)
- **Disable**: Cannot disable if used in active work order, cannot disable if status is 'maintenance' (must mark as active first)
- **Code Format**: Alphanumeric + hyphens, 2-20 chars (e.g., MCH-001, MIXER-A)

---

## Accessibility

- **Touch targets**: All buttons/menu items >= 48x48dp
- **Contrast**: Type/status badges pass WCAG AA (4.5:1)
- **Screen reader**: Row announces "Machine: {code}, {name}, {type}, Production Line: {line_name or unassigned}, Status: {status}"
- **Keyboard**: Tab navigation, Enter to open actions menu, Arrow keys for menu navigation

---

## Related Screens

- **Add Machine Modal**: Opens from [+ Add Machine] button
- **Edit Machine Modal**: Opens from Actions menu → Edit Machine
- **Assign to Line Modal**: Opens from Actions menu → Assign to Production Line
- **Maintenance Modal**: Opens from Actions menu → Set to Maintenance
- **Maintenance History Panel**: Opens from Actions menu → View Maintenance History
- **Activity Log Panel**: Opens from Actions menu → View Activity Log
- **Production Line Details**: Navigates from production_line_name link

---

## Technical Notes

- **RLS**: Machines filtered by `org_id` automatically
- **API**: `GET /api/settings/machines?search={query}&type={type}&status={status}&page={N}`
- **Real-time**: Subscribe to machine updates via Supabase Realtime (status changes, new machines)
- **Pagination**: 20 machines per page, server-side pagination
- **Validation**: Before maintenance/disable, check for active work orders using this machine
- **Specs Storage**: `specs` field is JSONB, allows flexible key-value pairs (capacity, max_temp, speed, etc.)

---

## Approval Status

**Mode**: auto_approve
**User Approved**: true (explicit opt-in)
**Screens Approved**: [SET-016-machine-list]
**Iterations Used**: 0
**Ready for Handoff**: Yes

---

**Status**: Approved for FRONTEND-DEV handoff
