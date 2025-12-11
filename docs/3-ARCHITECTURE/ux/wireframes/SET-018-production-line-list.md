# SET-018: Production Line List

**Module**: Settings
**Feature**: Production Line Management
**Status**: Approved (Auto-Approve Mode)
**Last Updated**: 2025-12-11

---

## ASCII Wireframe

### Success State

```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > Production Lines                 [+ Add Production Line] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  [Search lines...              ] [Filter: All ▼] [Sort: Code ▼]      │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ Code    Name              Warehouse  Machines  Capacity  Status│   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ LINE-A  Bakery Line       Main WH    4         120/hr    Active│   │
│  │         Mixer → Oven → Cooler → Packing                  [⋮] │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ LINE-B  Filling Line      Main WH    3         200/hr    Active│   │
│  │         Filler → Capper → Labeler                        [⋮] │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ LINE-C  Packaging Line    South WH   2         80/hr     Active│   │
│  │         Wrapper → Boxer                                   [⋮] │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ LINE-D  Legacy Line       North WH   1         50/hr     Disabled│
│  │         Decommissioned 2024-10-15                         [⋮] │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  Showing 4 of 4 lines                                  [1] [2] [>]   │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘

[⋮] Menu:
  - Edit Line
  - Manage Machines
  - View Work Orders
  - Disable Line / Enable Line
  - View Activity Log
```

### Loading State
```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > Production Lines                 [+ Add Production Line] │
├─────────────────────────────────────────────────────────────────────┤
│  [████████░░░░░░] [Filter ▼] [Sort ▼]                                │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ [████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]      │   │
│  │ [██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]      │   │
│  └───────────────────────────────────────────────────────────────┘   │
│  Loading production lines...                                          │
└─────────────────────────────────────────────────────────────────────┘
```

### Empty State
```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > Production Lines                 [+ Add Production Line] │
├─────────────────────────────────────────────────────────────────────┤
│                          [⚙ Icon]                                     │
│                   No Production Lines Found                           │
│       You haven't configured any production lines yet.                │
│       Create lines to organize machines for work orders.              │
│                  [+ Add Your First Production Line]                   │
└─────────────────────────────────────────────────────────────────────┘
```

### Error State
```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > Production Lines                 [+ Add Production Line] │
├─────────────────────────────────────────────────────────────────────┤
│                          [⚠ Icon]                                     │
│               Failed to Load Production Lines                         │
│       Unable to retrieve lines. Check your connection.                │
│                   Error: LINE_FETCH_FAILED                            │
│                        [Retry]  [Contact Support]                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Key Components

1. **Data Table** - Code, Name, Warehouse (link), Machine Count, Capacity (units/hour), Status (badge), Actions menu
2. **Search/Filter Bar** - Text search (code/name), warehouse filter, status filter, sort dropdown
3. **Add Production Line Button** - Primary CTA (top-right), opens create modal
4. **Actions Menu ([⋮])** - Edit, Manage Machines, View Work Orders, Disable/Enable, Activity Log
5. **Status Badges** - Active (green), Disabled (gray)
6. **Machine Flow** - Second row shows machine sequence (e.g., "Mixer → Oven → Cooler")
7. **Warehouse Link** - Clickable, navigates to warehouse details
8. **Capacity Display** - Units per hour (e.g., "120/hr")

---

## Main Actions

### Primary
- **[+ Add Production Line]** - Opens create modal (code, name, warehouse, capacity, description) → creates line

### Secondary (Row Actions)
- **Edit Line** - Opens edit modal (code, name, warehouse, capacity, description)
- **Manage Machines** - Opens machine management panel (add/remove machines, reorder sequence)
- **View Work Orders** - Navigates to WO list filtered by this line
- **Disable Line** - Validation check (no active WOs) → confirmation → sets status to 'disabled'
- **Enable Line** - Re-activates disabled line
- **View Activity Log** - Opens activity panel (changes, who/when)

### Filters/Search
- **Search** - Real-time filter by code or name
- **Filter by Warehouse** - All, or specific warehouse
- **Filter by Status** - All, Active, Disabled
- **Sort** - Code, Name, Warehouse, Capacity, Status (asc/desc)

---

## States

- **Loading**: Skeleton rows (3), "Loading production lines..." text
- **Empty**: "No production lines found" icon, "Add Your First Production Line" CTA
- **Error**: "Failed to load production lines" warning, Retry + Contact Support buttons
- **Success**: Table with line rows, search/filter controls, pagination if >20

---

## Data Fields

| Field | Type | Notes |
|-------|------|-------|
| code | string | Unique per org (e.g., LINE-A) |
| name | string | Display name |
| warehouse_id | uuid | FK to warehouses |
| warehouse_name | string | Display name of warehouse |
| machine_count | int | Count of assigned machines |
| machine_sequence | array | Ordered list of machine names |
| capacity_per_hour | int | Units produced per hour (nullable) |
| status | enum | active, disabled |
| disabled_at | timestamp | For status: disabled |
| disabled_by | user_id | Who disabled |
| description | text | Additional info (optional) |

---

## Permissions

| Role | Can View | Can Add | Can Edit | Can Manage Machines | Can Disable |
|------|----------|---------|----------|---------------------|-------------|
| Super Admin | All | Yes | All | Yes | Yes |
| Admin | All | Yes | All | Yes | Yes |
| Manager | All | Yes | All | Yes | No |
| Operator | All | No | No | No | No |
| Viewer | All | No | No | No | No |

---

## Validation

- **Create**: Code must be unique in org, name required (max 100 chars), warehouse required
- **Disable**: Cannot disable if line has active work orders (validation check)
- **Delete**: Cannot delete (only disable for audit trail)
- **Code Format**: Alphanumeric + hyphens, 2-20 chars (e.g., LINE-A, LINE-001)

---

## Accessibility

- **Touch targets**: All buttons/menu items >= 48x48dp
- **Contrast**: Status badges pass WCAG AA (4.5:1)
- **Screen reader**: Row announces "Production Line: {code}, {name}, Warehouse: {warehouse_name}, {machine_count} machines, Capacity: {capacity}/hour, Status: {status}"
- **Keyboard**: Tab navigation, Enter to open actions menu, Arrow keys for menu navigation

---

## Related Screens

- **Add Line Modal**: Opens from [+ Add Production Line] button
- **Edit Line Modal**: Opens from Actions menu → Edit Line
- **Manage Machines Panel**: Opens from Actions menu → Manage Machines
- **Work Orders List**: Navigates from Actions menu → View Work Orders (filtered by line)
- **Activity Log Panel**: Opens from Actions menu → View Activity Log
- **Warehouse Details**: Navigates from warehouse_name link

---

## Technical Notes

- **RLS**: Production lines filtered by `org_id` automatically
- **API**: `GET /api/settings/production-lines?search={query}&warehouse={id}&status={status}&page={N}`
- **Real-time**: Subscribe to line updates via Supabase Realtime (status changes, new lines)
- **Pagination**: 20 lines per page, server-side pagination
- **Validation**: Before disable, check for active work orders using this line
- **Machine Sequence**: Computed from `line_machines` junction table (ordered by `sequence` field)
- **Capacity**: Optional field, used for planning/scheduling estimates

---

## Approval Status

**Mode**: auto_approve
**User Approved**: true (explicit opt-in)
**Screens Approved**: [SET-018-production-line-list]
**Iterations Used**: 0
**Ready for Handoff**: Yes

---

**Status**: Approved for FRONTEND-DEV handoff
