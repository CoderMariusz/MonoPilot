# SET-013: Warehouse Create/Edit Modal

**Module**: Settings
**Feature**: Warehouse Management (Story 1.13)
**Type**: Modal Dialog
**Status**: Approved (Auto-approve mode)
**Last Updated**: 2025-12-11

---

## ASCII Wireframe

### Success State (Create/Edit)

```
┌───────────────────────────────────────────┐
│  Create Warehouse                  [X]    │
├───────────────────────────────────────────┤
│                                           │
│  Code *                                   │
│  [______]  (4 chars, auto-uppercase)      │
│                                           │
│  Name *                                   │
│  [_____________________________]          │
│                                           │
│  Type *                                   │
│  [Select type ▼]                          │
│    - General                              │
│    - Raw Materials                        │
│    - WIP                                  │
│    - Finished Goods                       │
│    - Quarantine                           │
│                                           │
│  Address                                  │
│  [_____________________________]          │
│  [_____________________________]          │
│  [_____________________________]          │
│                                           │
│  ☑ Active                                 │
│                                           │
├───────────────────────────────────────────┤
│  [Cancel]              [Create Warehouse] │
└───────────────────────────────────────────┘
```

---

## Key Components

- **Code**: Text input, 4 chars, auto-uppercase, unique per org, required
- **Name**: Text input, 2-100 chars, required
- **Type**: Dropdown (5 options), required, default "General"
- **Address**: Multi-line text (3 lines), optional
- **Active**: Checkbox, default ON

---

## Main Actions

- **Create**: Validates code uniqueness, saves warehouse, closes modal, shows toast
- **Edit**: Updates warehouse, preserves code if LPs exist, shows toast
- **Cancel/[X]**: Closes without saving

---

## 4 States

- **Loading**: Spinner + "Creating warehouse..." while POST /api/settings/warehouses runs
- **Empty**: N/A (modal triggered by button click)
- **Error**: Red banner + inline errors (code exists, invalid format, missing required fields)
- **Success**: Form fields populated (edit) or blank (create), ready for input

---

## Warehouse Types (Reference)

| Type | Purpose | Default For |
|------|---------|-------------|
| General | Multi-purpose storage | Small orgs |
| Raw Materials | Ingredients, packaging | PO receiving |
| WIP | Work-in-progress | Production output |
| Finished Goods | Completed products | Sales orders |
| Quarantine | QA hold inventory | Quality failures |

---

## Validation Rules

| Field | Rules |
|-------|-------|
| Code | Required, 4 chars, uppercase, unique per org, immutable if LPs exist |
| Name | Required, 2-100 chars |
| Type | Required, one of 5 types |
| Address | Optional, 0-500 chars |
| Active | Boolean, default true |

**Validation Timing**: On blur (code uniqueness), on submit (all fields)

---

## Accessibility

- **Touch Targets**: All inputs >= 48x48dp
- **Contrast**: WCAG AA (4.5:1)
- **Keyboard**: Tab, Enter submit, Escape closes
- **Focus**: Code field auto-focused on open
- **Screen Reader**: Announces "Create Warehouse Modal", field labels, errors

---

## Technical Notes

### API Endpoints
- **Create**: `POST /api/settings/warehouses`
- **Update**: `PATCH /api/settings/warehouses/:id`
- **Validation**: `GET /api/settings/warehouses/validate-code?code={code}`

### Data Structure
```typescript
{
  code: string;        // 4 chars, uppercase
  name: string;
  type: 'GENERAL' | 'RAW_MATERIALS' | 'WIP' | 'FINISHED_GOODS' | 'QUARANTINE';
  address: string;     // optional
  active: boolean;
  org_id: string;      // auto-populated
}
```

---

## Related Screens

- **Warehouse List**: [SET-012-warehouse-list.md] (parent screen)

---

## Handoff Notes

1. ShadCN Dialog component
2. Zod schema: `lib/validation/warehouse-schema.ts`
3. Service: `lib/services/warehouse-service.ts`
4. Code uniqueness: debounce 500ms on blur
5. Code immutable if warehouse has LPs (show warning in edit mode)
6. Type tooltips: explain business rules per type

---

**Approval Status**: Auto-approved
**Mode**: auto_approve
**User Approved**: true (explicit opt-in)
**Iterations**: 0 of 3
