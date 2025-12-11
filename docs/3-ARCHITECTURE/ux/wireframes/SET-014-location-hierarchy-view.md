# SET-014: Location Hierarchy View

**Module**: Settings
**Feature**: Warehouse Management - Location Hierarchy
**Status**: Approved (Auto-Approve Mode)
**Last Updated**: 2025-12-11

---

## ASCII Wireframe

### Success State

```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > Warehouses > WH-001 > Locations    [+ Add Location]     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  [Search locations...          ] [Type: All ▼] [Expand All][⊟ All]  │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ Location Code          Type          Status    LPs    Actions │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ [▼] ZONE-A             Zone          Active    24      [⋮]    │   │
│  │   [▼] AISLE-A1         Aisle         Active    12      [⋮]    │   │
│  │     [▼] RACK-A1-01     Rack          Active    4       [⋮]    │   │
│  │       [▸] BIN-A1-01-1  Bin           Active    1       [⋮]    │   │
│  │       [▸] BIN-A1-01-2  Bin           Full      1       [⋮]    │   │
│  │       [▸] BIN-A1-01-3  Bin           Empty     0       [⋮]    │   │
│  │       [▸] BIN-A1-01-4  Bin           Reserved  1       [⋮]    │   │
│  │     [▸] RACK-A1-02     Rack          Active    3       [⋮]    │   │
│  │     [▸] RACK-A1-03     Rack          Active    5       [⋮]    │   │
│  │   [▸] AISLE-A2         Aisle         Active    8       [⋮]    │   │
│  │   [▸] AISLE-A3         Aisle         Disabled  0       [⋮]    │   │
│  │ [▸] ZONE-B             Zone          Active    18      [⋮]    │   │
│  │ [▸] BULK-01            Bulk Storage  Active    6       [⋮]    │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  Total: 45 locations | Active: 42 | Empty: 18 | With LPs: 24        │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘

[⋮] Menu:
  - Edit Location
  - Add Child Location (disabled for Bins)
  - Move Location (→ select new parent)
  - View Contents (LPs)
  - Disable Location / Enable Location
  - Delete Location (empty only)
```

### Loading State
```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > Warehouses > WH-001 > Locations    [+ Add Location]     │
├─────────────────────────────────────────────────────────────────────┤
│  [████████░░░░░░] [Type ▼] [Expand][Collapse]                        │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ [████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]           │   │
│  │ [██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]             │   │
│  └───────────────────────────────────────────────────────────────┘   │
│  Loading location hierarchy...                                        │
└─────────────────────────────────────────────────────────────────────┘
```

### Empty State
```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > Warehouses > WH-001 > Locations    [+ Add Location]     │
├─────────────────────────────────────────────────────────────────────┤
│                          [📦 Icon]                                    │
│                      No Locations Found                               │
│       This warehouse doesn't have any locations yet.                  │
│       Start by adding zones, aisles, or bulk storage areas.           │
│                     [+ Add Your First Location]                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Error State
```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > Warehouses > WH-001 > Locations    [+ Add Location]     │
├─────────────────────────────────────────────────────────────────────┤
│                          [⚠ Icon]                                     │
│                  Failed to Load Locations                             │
│       Unable to retrieve location hierarchy. Check your connection.   │
│                   Error: LOCATION_FETCH_FAILED                        │
│                        [Retry]  [Contact Support]                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Key Components

1. **Tree View** - Hierarchical display with expand/collapse controls ([▼] expanded, [▸] collapsed)
2. **Location Row** - Indentation shows hierarchy level, code, type badge, status badge, LP count, actions menu
3. **Search/Filter Bar** - Text search (code), type filter (Zone/Aisle/Rack/Bin/Shelf/Bulk Storage)
4. **Bulk Controls** - [Expand All] / [Collapse All] buttons
5. **Add Location Button** - Primary CTA (top-right), opens create modal with parent selection
6. **Type Badges** - Zone (blue), Aisle (green), Rack (yellow), Bin (purple), Shelf (orange), Bulk Storage (gray)
7. **Status Badges** - Active (green), Empty (gray), Full (red), Reserved (orange), Disabled (gray)
8. **LP Counter** - Clickable count showing number of license plates at that location (recursive count for parents)
9. **Summary Stats** - Footer shows total locations, active count, empty count, locations with LPs
10. **Actions Menu ([⋮])** - Edit, Add Child, Move, View Contents, Disable/Enable, Delete

---

## Main Actions

### Primary
- **[+ Add Location]** - Opens create modal (parent, code, type, barcode) → creates location

### Secondary (Row Actions)
- **Edit Location** - Opens edit modal (code, type, barcode, capacity, notes)
- **Add Child Location** - Opens create modal with current location pre-selected as parent (disabled for Bins - leaf nodes)
- **Move Location** - Opens parent selector dialog → validates hierarchy rules → moves entire subtree
- **View Contents** - Navigates to `/warehouse/inventory?location={id}` showing all LPs at this location
- **Disable Location** - Validation check (must be empty, no active LPs) → confirmation → soft delete
- **Enable Location** - Re-activates disabled location
- **Delete Location** - Validation check (must be empty, no children) → confirmation → hard delete

### Tree Controls
- **[▼] / [▸]** - Toggle expand/collapse for node and immediate children
- **[Expand All]** - Expands entire tree (performance warning if >200 nodes)
- **[⊟ All] / [Collapse All]** - Collapses all nodes to top level

### Filters/Search
- **Search** - Real-time filter by location code (highlights matching nodes, auto-expands parents)
- **Filter by Type** - All, Zone, Aisle, Rack, Bin, Shelf, Bulk Storage
- **Filter by Status** - All, Active, Empty, Full, Reserved, Disabled

---

## States

- **Loading**: Skeleton rows (3), "Loading location hierarchy..." text
- **Empty**: "No locations found" icon, "Add Your First Location" CTA
- **Error**: "Failed to load locations" warning, Retry + Contact Support buttons
- **Success**: Tree view with locations, search/filter controls, expand/collapse controls, summary stats

---

## Data Fields

| Field | Type | Notes |
|-------|------|-------|
| code | string | Unique per warehouse (e.g., ZONE-A, BIN-A1-01-1) |
| type | enum | Zone, Aisle, Rack, Bin, Shelf, Bulk Storage |
| parent_location_id | uuid | NULL for top-level (zones/bulk storage) |
| warehouse_id | uuid | Foreign key to warehouses table |
| status | enum | active, empty, full, reserved, disabled |
| lp_count | integer | Computed: COUNT(license_plates) where location = this or descendants |
| barcode | string | Optional, for scanner integration |
| capacity | integer | Optional, max LPs for this location |
| level | integer | Computed: depth in hierarchy (0 = top-level) |
| path | string | Computed: full path (e.g., "ZONE-A/AISLE-A1/RACK-A1-01") |

---

## Hierarchy Rules

| Parent Type | Allowed Child Types | Max Depth |
|-------------|---------------------|-----------|
| NULL (root) | Zone, Bulk Storage | 0 |
| Zone | Aisle, Shelf, Bulk Storage | 1 |
| Aisle | Rack | 2 |
| Rack | Bin, Shelf | 3 |
| Bin | (none - leaf node) | 4 |
| Shelf | (none - leaf node) | 4 |
| Bulk Storage | (none - leaf node) | 1 |

**Max Hierarchy Depth**: 4 levels (Zone → Aisle → Rack → Bin)

---

## Permissions

| Role | Can View | Can Add | Can Edit | Can Move | Can Delete | Can Disable |
|------|----------|---------|----------|----------|------------|-------------|
| Super Admin | All | Yes | All | All | Yes | Yes |
| Admin | All | Yes | All | All | Yes | Yes |
| Manager | All | Yes | All | No | No | No |
| Operator | All | No | No | No | No | No |
| Viewer | All | No | No | No | No | No |

---

## Validation

- **Create**: Code unique per warehouse, type required, parent must exist (if not top-level), parent-child type combination must be valid per hierarchy rules, max depth not exceeded
- **Move**: New parent must exist, new parent-child type combination valid, move doesn't create circular reference (can't move parent into its own descendant), new path doesn't exceed max depth
- **Disable**: Must be empty (lp_count = 0), all descendants must be empty
- **Delete**: Must be empty (lp_count = 0), must have no children, cannot delete if referenced by WO routing or pick instructions
- **Code Format**: Alphanumeric + hyphens, 2-30 chars

---

## Accessibility

- **Touch targets**: All expand/collapse icons, buttons, menu items >= 48x48dp
- **Contrast**: Type/status badges pass WCAG AA (4.5:1)
- **Screen reader**: Row announces "Location: {code}, {type}, {status}, level {N}, {lp_count} license plates, {expanded_state}"
- **Keyboard**: Tab navigation, Enter to toggle expand/collapse, Arrow keys (↑/↓) navigate nodes, Arrow keys (←/→) expand/collapse, Space to open actions menu

---

## Related Screens

- **Add Location Modal**: Opens from [+ Add Location] button or Actions → Add Child Location
- **Edit Location Modal**: Opens from Actions → Edit Location
- **Move Location Dialog**: Opens from Actions → Move Location (parent selector with tree view)
- **Location Contents View**: Navigates from Actions → View Contents (`/warehouse/inventory?location={id}`)
- **Warehouse List**: Back navigation to `/settings/warehouses`

---

## Technical Notes

- **RLS**: Locations filtered by `org_id` via `warehouses.org_id` join
- **API**: `GET /api/settings/warehouses/{id}/locations?type={type}&status={status}` → returns full tree as nested JSON
- **Tree Structure**: Frontend builds tree from flat array using `parent_location_id` references
- **LP Count**: Computed recursively (includes all descendants), cached, invalidated on LP movement
- **Real-time**: Subscribe to location updates via Supabase Realtime (status changes, new locations, moves)
- **Performance**: Lazy load children if warehouse has >200 locations (load on expand), paginate if single level has >50 nodes
- **Move Operation**: Atomic transaction: (1) validate rules, (2) update parent_location_id, (3) recompute all paths in subtree, (4) update lp_counts up the chain

---

## Approval Status

**Mode**: auto_approve
**User Approved**: true (explicit opt-in)
**Screens Approved**: [SET-014-location-hierarchy-view]
**Iterations Used**: 0
**Ready for Handoff**: Yes

---

**Status**: Approved for FRONTEND-DEV handoff
