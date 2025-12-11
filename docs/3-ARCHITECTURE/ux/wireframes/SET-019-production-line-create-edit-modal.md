# SET-019: Production Line Create/Edit Modal

**Module**: Settings
**Feature**: Production Line Management (FR-SET-060, Story 1.8)
**Type**: Modal Dialog
**Status**: Approved (Auto-approve mode)
**Last Updated**: 2025-12-11

---

## ASCII Wireframe

### Success State (Create/Edit)

```
┌───────────────────────────────────────────┐
│  Create Production Line            [X]    │
├───────────────────────────────────────────┤
│                                           │
│  Code *                                   │
│  [______]  (auto-uppercase, unique)       │
│                                           │
│  Name *                                   │
│  [_____________________________]          │
│                                           │
│  Warehouse *                              │
│  [Select warehouse ▼]                     │
│    - MAIN - Main Warehouse                │
│    - WIP1 - Work in Progress              │
│                                           │
│  Capacity (units/hour)                    │
│  [_________]  Optional                    │
│                                           │
│  Assigned Machines                        │
│  ┌─────────────────────────────────────┐ │
│  │ [Select machine ▼]          [+ Add] │ │
│  ├─────────────────────────────────────┤ │
│  │ ≡ MIX-001 Industrial Mixer    [×]   │ │
│  │ ≡ PKG-001 Packaging Line      [×]   │ │
│  └─────────────────────────────────────┘ │
│  Drag to reorder sequence                │
│                                           │
│  ☑ Active                                 │
│                                           │
├───────────────────────────────────────────┤
│  [Cancel]         [Create Production Line]│
└───────────────────────────────────────────┘
```

---

## Key Components

- **Code**: Text input, auto-uppercase, unique per org, required
- **Name**: Text input, 2-100 chars, required
- **Warehouse**: Dropdown (org warehouses), required, filters where line produces
- **Capacity**: Number input, units/hour, optional, 0-9999
- **Machines**: Multi-select with drag-to-reorder, optional, shows machine code + name
- **Active**: Checkbox, default ON

---

## Main Actions

- **Create**: Validates code uniqueness, saves line + machine assignments, closes modal, shows toast "Production Line [CODE] created"
- **Edit**: Updates line, preserves machine sequence, shows toast "Production Line [CODE] updated"
- **Add Machine**: Adds selected machine to list with next sequence number
- **Remove Machine**: Removes machine from line (machine stays in system)
- **Reorder**: Drag ≡ handle updates machine sequence (1, 2, 3...)
- **Cancel/[X]**: Closes without saving, confirms if unsaved changes exist

---

## 4 States

- **Loading**: Spinner overlay + "Creating production line..." while POST /api/settings/production-lines runs
- **Empty**: N/A (modal triggered by "Add Line" button)
- **Error**: Red banner + inline errors (duplicate code, warehouse required, capacity invalid, machine already at max capacity)
- **Success**: Form fields populated (edit) or blank (create), machine list loaded (edit) or empty (create)

---

## Machine Assignment Logic

| Scenario | Behavior |
|----------|----------|
| Add machine | Appends to end of list with sequence = max(sequence) + 1 |
| Drag machine | Updates all sequences to reflect new order (1-indexed) |
| Remove machine | Gaps removed, sequences renumbered (1, 2, 3...) |
| Same machine on multiple lines | Allowed (warning shown: "Machine is assigned to 2 lines") |
| Machine offline status | Warning shown but assignment allowed |

---

## Validation Rules

| Field | Rules |
|-------|-------|
| Code | Required, 2-20 chars, uppercase, unique per org, immutable if WOs exist |
| Name | Required, 2-100 chars |
| Warehouse | Required, FK to warehouses table |
| Capacity | Optional, integer 0-9999, units/hour |
| Machines | Optional, many-to-many via line_machines, max 20 per line |
| Active | Boolean, default true |

**Validation Timing**: On blur (code uniqueness), on submit (all fields)

**Delete Protection**: Cannot delete if active work orders exist, shows error "Line has active work orders"

---

## Accessibility

- **Touch Targets**: All inputs/buttons >= 48x48dp
- **Contrast**: WCAG AA (4.5:1)
- **Keyboard**: Tab navigation, Enter submit, Escape closes, Arrow keys + Space for dropdown
- **Focus**: Code field auto-focused on open
- **Screen Reader**: Announces "Create Production Line Modal", field labels, machine count, drag instructions, errors
- **Drag Alternative**: Keyboard users can use Up/Down arrows + Space to reorder machines

---

## Technical Notes

### API Endpoints
- **Create**: `POST /api/settings/production-lines`
- **Update**: `PUT /api/settings/production-lines/:id`
- **Get Machines**: `GET /api/settings/machines?active=true`
- **Validation**: `GET /api/settings/production-lines/validate-code?code={code}`

### Data Structure
```typescript
{
  code: string;               // 2-20 chars, uppercase
  name: string;               // 2-100 chars
  warehouse_id: string;       // FK to warehouses
  capacity: number | null;    // units/hour
  machines: Array<{
    machine_id: string;
    sequence: number;         // 1-indexed
  }>;
  active: boolean;
  org_id: string;             // auto-populated
}
```

### Related Tables
- `production_lines`: id, org_id, code, name, warehouse_id, capacity, active
- `line_machines`: id, line_id, machine_id, sequence, created_at

---

## Related Screens

- **Production Line List**: [SET-018-production-line-list.md] (parent screen, not yet created)
- **Machine List**: [SET-016-machine-list.md] (referenced for machine selection)

---

## Handoff Notes

1. ShadCN Dialog + Form components
2. Zod schema: `lib/validation/production-line-schema.ts`
3. Service: `lib/services/production-line-service.ts`
4. Code uniqueness: debounce 500ms on blur
5. Code immutable if line has WOs (show warning in edit mode)
6. Warehouse dropdown: only show active warehouses, sorted by code
7. Machine multi-select: use dnd-kit for drag-to-reorder, show drag handle (≡)
8. Capacity tooltip: "Expected throughput rate for scheduling"
9. Machine limit: max 20 machines per line (show error if exceeded)
10. DELETE endpoint checks for active WOs before allowing deletion

---

## Business Rules

- Production lines define where products are manufactured
- Warehouse assignment determines default output location
- Capacity used for scheduling and planning (optional but recommended)
- Machine sequence matters for routing/operations (FR-SET-061)
- Active toggle hides line from WO creation dropdowns
- Deleting line removes machine assignments but preserves machines

---

**Approval Status**: Auto-approved
**Mode**: auto_approve
**User Approved**: true (explicit opt-in)
**Iterations**: 0 of 3
