# SET-015: Location Create/Edit Modal

**Module**: Settings
**Feature**: Warehouse Management (Story 1.13 - Location Hierarchy)
**Type**: Modal Dialog
**Status**: Auto-Approved
**Last Updated**: 2025-12-11

---

## ASCII Wireframe (Compact)

```
┌────────────────────────────────────────┐
│  Create Location                  [X]  │
├────────────────────────────────────────┤
│                                        │
│  Code *         [__________]           │
│  Name *         [__________]           │
│                                        │
│  Type *         [Select type ▼]        │
│    - Zone                              │
│    - Aisle                             │
│    - Rack                              │
│    - Bin                               │
│    - Shelf                             │
│    - Bulk Storage                      │
│                                        │
│  Parent Location [WH-001/ZONE-A ▼]     │
│                                        │
│  Capacity       [__________] units     │
│                                        │
│  ☑ Active                              │
│                                        │
├────────────────────────────────────────┤
│  [Cancel]            [Create Location] │
└────────────────────────────────────────┘
```

---

## Key Components

1. **Code**: Text input, required, unique per warehouse, uppercase auto-convert
2. **Name**: Text input, required, 2-100 chars
3. **Type**: Dropdown, required, 6 options (Zone, Aisle, Rack, Bin, Shelf, Bulk Storage)
4. **Parent Location**: Dropdown, optional, hierarchical path display, hierarchy validation
5. **Capacity**: Number input, optional, units based on warehouse UoM
6. **Active Toggle**: Checkbox, default ON

---

## Main Actions

- **Create**: POST /api/settings/locations, validates hierarchy (e.g., Bin cannot be parent of Zone), creates location, refreshes tree, toast "Location created"
- **Edit**: PATCH /api/settings/locations/:id, validates inventory before type/parent change, toast "Location updated"
- **Cancel**: Close modal, no save

---

## 4 States

- **Loading**: Spinner + "Creating location..." during API call
- **Empty**: N/A (modal triggered by action)
- **Error**: Red banner + inline errors (duplicate code, invalid hierarchy: "Bin cannot contain Aisle", capacity exceeded)
- **Success**: Form fields populated (edit) or blank (create), parent dropdown shows warehouse tree

---

## Validation Rules

| Field | Rules |
|-------|-------|
| Code | Required, 2-20 chars, alphanumeric+dash, unique per warehouse |
| Name | Required, 2-100 chars |
| Type | Required, one of 6 types |
| Parent Location | Optional, hierarchy validation: Zone > Aisle > Rack/Shelf > Bin |
| Capacity | Optional, positive number, cannot reduce below current inventory |
| Active | Boolean, cannot deactivate if has inventory or active child locations |

**Hierarchy Rules**:
- Zone: Top-level, no parent (or warehouse direct)
- Aisle: Parent must be Zone
- Rack/Shelf: Parent must be Aisle or Zone
- Bin: Parent must be Rack, Shelf, or Aisle
- Bulk Storage: Top-level, no parent

---

## Accessibility

- Touch targets: ≥48x48dp (all inputs, dropdowns, buttons)
- Contrast: Error text #DC2626 (WCAG AA 4.5:1)
- Screen reader: "Create Location Modal", field labels, hierarchy validation errors
- Keyboard: Tab navigation, Escape closes, Enter submits

---

## Technical Notes

### API Endpoints
- Create: `POST /api/settings/locations`
- Update: `PATCH /api/settings/locations/:id`
- Validate: `GET /api/settings/locations/validate-code?code={code}&warehouse_id={id}`

### Data Structure
```typescript
{
  code: string;
  name: string;
  type: 'Zone' | 'Aisle' | 'Rack' | 'Bin' | 'Shelf' | 'Bulk Storage';
  parent_id?: string; // null for top-level
  warehouse_id: string;
  capacity?: number;
  active: boolean;
  org_id: string; // auto-populated
}
```

### Hierarchy Validation Logic
```typescript
// Type hierarchy depth
const typeDepth = {
  'Zone': 1,
  'Aisle': 2,
  'Rack': 3, 'Shelf': 3,
  'Bin': 4,
  'Bulk Storage': 1
};

// Validate: child depth > parent depth
if (parent && typeDepth[childType] <= typeDepth[parentType]) {
  throw "Invalid hierarchy";
}
```

---

## Handoff to FRONTEND-DEV

**Approval Status**: Auto-Approved (user opted for auto-approve mode)

**Components**:
- ShadCN Dialog for modal
- Zod schema: `lib/validation/location-schema.ts`
- Service: `lib/services/location-service.ts`
- Parent dropdown: Hierarchical tree selector (show full path)
- Code uniqueness: debounce 500ms on blur

**Related Screens**:
- Warehouse Detail with Location Tree (parent screen)
- Location List/Tree View

---

**Status**: Ready for Implementation
**Approval Mode**: Auto-Approve
