# SET-012: Warehouse List

**Module**: Settings
**Feature**: Warehouse Management
**Status**: Approved (Auto-Approve Mode)
**Last Updated**: 2025-12-15

---

## ASCII Wireframe

### Success State

```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > Warehouses                       [+ Add Warehouse]       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  [Search warehouses...          ] [Filter: All Types ▼] [Sort: ▼]   │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ Code    Name              Type       Locations  Default  Status│   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ WH-001  Main Warehouse    General    24         [★]      Active│   │
│  │         123 Factory Rd, Springfield                      [⋮]  │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ WH-RAW  Raw Materials     Raw Mat    12         -        Active│   │
│  │         Building A, Springfield                          [⋮]  │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ WH-FG   Finished Goods    Finished   18         -        Active│   │
│  │         Building B, Springfield                          [⋮]  │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ WH-QA   Quarantine        Quarantine 6          -        Active│   │
│  │         Lab Wing, Springfield                            [⋮]  │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ WH-OLD  Old Storage       General    8          -        Disabled│
│  │         Closed 2025-11-15 by John Smith                  [⋮]  │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  Showing 5 of 5 warehouses                         [1] [2] [3] [>]   │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘

[⋮] Menu:
  - Edit Warehouse
  - Manage Locations (→ locations page)
  - Set as Default (if not default)
  - Disable Warehouse / Enable Warehouse
  - View Activity Log
```

### Loading State
```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > Warehouses                       [+ Add Warehouse]       │
├─────────────────────────────────────────────────────────────────────┤
│  [████████░░░░░░] [Filter ▼] [Sort ▼]                                │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ [████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]      │   │
│  │ [██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]      │   │
│  └───────────────────────────────────────────────────────────────┘   │
│  Loading warehouses...                                                │
└─────────────────────────────────────────────────────────────────────┘
```

### Empty State
```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > Warehouses                       [+ Add Warehouse]       │
├─────────────────────────────────────────────────────────────────────┤
│                          [🏭 Icon]                                    │
│                      No Warehouses Found                              │
│       You haven't created any warehouses yet.                         │
│       Start by adding your first warehouse location.                  │
│                     [+ Add Your First Warehouse]                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Error State
```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > Warehouses                       [+ Add Warehouse]       │
├─────────────────────────────────────────────────────────────────────┤
│                          [⚠ Icon]                                     │
│                  Failed to Load Warehouses                            │
│       Unable to retrieve warehouse list. Check your connection.       │
│                   Error: WAREHOUSE_FETCH_FAILED                       │
│                        [Retry]  [Contact Support]                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Key Components

1. **Data Table** - Code, Name, Type (badge), Location Count, Default (star icon), Status (badge), Actions menu
2. **Search/Filter Bar** - Text search (code/name), type filter, status filter, sort dropdown
3. **Add Warehouse Button** - Primary CTA (top-right), opens create modal
4. **Actions Menu ([⋮])** - Edit, Manage Locations, Set as Default, Disable/Enable, Activity Log
5. **Type Badges** - General (blue), Raw Materials (green), WIP (yellow), Finished Goods (purple), Quarantine (red)
6. **Status Badges** - Active (green), Disabled (gray)
7. **Default Indicator** - Gold star icon (★) for default warehouse
8. **Location Count** - Number of child locations, clickable to navigate to location list

---

## Main Actions

### Primary
- **[+ Add Warehouse]** - Opens create modal (code, name, type, address) → creates warehouse

### Secondary (Row Actions)
- **Edit Warehouse** - Opens edit modal (code, name, type, address, contact)
- **Manage Locations** - Navigates to `/settings/warehouses/{id}/locations`
- **Set as Default** - Confirmation → sets as default warehouse (only one default per org)
- **Disable Warehouse** - Validation check (no active inventory) → confirmation → soft delete
- **Enable Warehouse** - Re-activates disabled warehouse
- **View Activity Log** - Opens activity panel (changes, who/when)

### Filters/Search
- **Search** - Real-time filter by code or name
- **Filter by Type** - All Types, General, Raw Materials, WIP, Finished Goods, Quarantine
- **Filter by Status** - All, Active, Disabled
- **Sort** - Code, Name, Type, Location Count (asc/desc)

---

## States

- **Loading**: Skeleton rows (3), "Loading warehouses..." text
- **Empty**: "No warehouses found" icon, "Add Your First Warehouse" CTA
- **Error**: "Failed to load warehouses" warning, Retry + Contact Support buttons
- **Success**: Table with warehouse rows, search/filter controls, pagination if >20

---

## Data Fields

| Field | Type | Notes |
|-------|------|-------|
| code | string | Unique per org (e.g., WH-001) |
| name | string | Display name |
| type | enum | General, Raw Materials, WIP, Finished Goods, Quarantine |
| location_count | integer | Number of child locations |
| is_default | boolean | Only one default per org |
| status | enum | active, disabled |
| address | string | Physical address (line 1 + city) |
| disabled_at | timestamp | For status: disabled |
| disabled_by | user_id | Who disabled |

---

## Permissions Matrix (10 PRD Roles)

| Role | Can View | Can Add | Can Edit | Can Set Default | Can Disable |
|------|----------|---------|----------|-----------------|-------------|
| Super Admin | All | Yes | All | Yes | Yes |
| Admin | All | Yes | All | Yes | Yes |
| Production Manager | All | No | No | No | No |
| Quality Manager | All | No | No | No | No |
| Warehouse Manager | All | Yes | Yes | Yes | Yes |
| Production Operator | Own Only | No | No | No | No |
| Quality Inspector | Own Only | No | No | No | No |
| Warehouse Operator | Own Only | No | No | No | No |
| Planner | All | No | No | No | No |
| Viewer | All | No | No | No | No |

**Rationale**:
- **Super Admin, Admin**: Full access to all operations
- **Warehouse Manager**: Manages warehouse operations (add, edit, set default, disable) - FR-SET-026
- **Production Manager, Quality Manager, Planner**: View-only (all warehouses) for operational context
- **Production Operator, Quality Inspector, Warehouse Operator**: View only own warehouse(s)
- **Viewer**: View-only (read-only role)

---

## Validation

- **Create**: Code must be unique in org, type required, name required (max 100 chars)
- **Set Default**: Only one default warehouse per org (automatically unsets previous default)
- **Disable**: Cannot disable if active inventory exists (LPs with qty > 0), cannot disable last active warehouse, cannot disable default warehouse (must set another as default first)
- **Code Format**: Alphanumeric + hyphens, 2-20 chars

---

## Accessibility

- **Touch targets**: All buttons/menu items >= 48x48dp
- **Contrast**: Type/status badges pass WCAG AA (4.5:1)
- **Screen reader**: Row announces "Warehouse: {code}, {name}, {type}, {location_count} locations, {default_status}, {status}"
- **Keyboard**: Tab navigation, Enter to open actions menu, Arrow keys for menu navigation

---

## Related Screens

- **Add Warehouse Modal**: Opens from [+ Add Warehouse] button
- **Edit Warehouse Modal**: Opens from Actions menu → Edit Warehouse
- **Location List**: Navigates from Actions menu → Manage Locations (`/settings/warehouses/{id}/locations`)
- **Activity Log Panel**: Opens from Actions menu → View Activity Log

---

## Technical Notes

- **RLS**: Warehouses filtered by `org_id` automatically
- **API**: `GET /api/settings/warehouses?search={query}&type={type}&status={status}&page={N}`
- **Real-time**: Subscribe to warehouse updates via Supabase Realtime (status changes, new warehouses)
- **Pagination**: 20 warehouses per page, server-side pagination
- **Default Logic**: When setting new default, atomically unset previous default in same transaction

---

## Approval Status

**Mode**: auto_approve
**User Approved**: true (explicit opt-in)
**Screens Approved**: [SET-012-warehouse-list]
**Iterations Used**: 0
**Ready for Handoff**: Yes
**Alignment**: Aligned with 10 PRD roles (FR-SET-020 to FR-SET-029)

---

**Status**: Approved for FRONTEND-DEV handoff
