# SET-017: Machine Create/Edit Modal

**Module**: Settings
**Feature**: Machine Management (Story 1.16)
**Type**: Modal Dialog
**Status**: Approved (Auto-approve mode)
**Last Updated**: 2025-12-11

---

## ASCII Wireframe

### Success State (Create/Edit)

```
┌───────────────────────────────────────────┐
│  Create Machine                    [X]    │
├───────────────────────────────────────────┤
│                                           │
│  Code *                                   │
│  [______]  (4-8 chars, auto-uppercase)    │
│                                           │
│  Name *                                   │
│  [_____________________________]          │
│                                           │
│  Type *                                   │
│  [Select type ▼]                          │
│    - Mixer                                │
│    - Oven                                 │
│    - Packaging                            │
│    - Filling                              │
│    - Labeling                             │
│    - Other                                │
│                                           │
│  Production Line                          │
│  [Select line ▼]                          │
│    - (None)                               │
│    - Line A - Main Production             │
│    - Line B - Packaging                   │
│                                           │
│  Capacity *                               │
│  [______] units/hour                      │
│                                           │
│  Specifications                           │
│  [_____________________________]          │
│  [_____________________________]          │
│  [_____________________________]          │
│                                           │
│  ☑ Active                                 │
│                                           │
├───────────────────────────────────────────┤
│  [Cancel]               [Create Machine]  │
└───────────────────────────────────────────┘
```

---

## Key Components

- **Code**: Text input, 4-8 chars, auto-uppercase, unique per org, required
- **Name**: Text input, 2-100 chars, required
- **Type**: Dropdown (6 options), required, default "Other"
- **Production Line**: Dropdown (from lines table), optional, default "(None)"
- **Capacity**: Number input, units/hour, required, min 0.01, max 999999
- **Specifications**: Multi-line text (3 lines), optional, 0-500 chars
- **Active**: Checkbox, default ON

---

## Main Actions

- **Create**: Validates code uniqueness, saves machine, closes modal, shows toast
- **Edit**: Updates machine, preserves code if production records exist, shows toast
- **Cancel/[X]**: Closes without saving

---

## 4 States

- **Loading**: Spinner + "Creating machine..." while POST /api/settings/machines runs
- **Empty**: N/A (modal triggered by button click)
- **Error**: Red banner + inline errors (code exists, invalid format, missing required fields, capacity <= 0)
- **Success**: Form fields populated (edit) or blank (create), ready for input

---

## Machine Types (Reference)

| Type | Common Use Cases | Example Models |
|------|------------------|----------------|
| Mixer | Dough mixing, blending | Planetary, spiral, ribbon |
| Oven | Baking, roasting | Deck, rotary, tunnel |
| Packaging | Wrapping, boxing | Flow wrap, case packer |
| Filling | Liquid/solid filling | Piston, volumetric, auger |
| Labeling | Label application | Wrap-around, top/bottom |
| Other | Custom equipment | Depositors, slicers, etc. |

---

## Validation Rules

| Field | Rules |
|-------|-------|
| Code | Required, 4-8 chars, uppercase, unique per org, immutable if WO operations exist |
| Name | Required, 2-100 chars |
| Type | Required, one of 6 types |
| Production Line | Optional, foreign key to production_lines table |
| Capacity | Required, number > 0, max 999999, decimals allowed (0.01-999999) |
| Specifications | Optional, 0-500 chars, free-form text |
| Active | Boolean, default true |

**Validation Timing**: On blur (code uniqueness), on submit (all fields)

---

## Accessibility

- **Touch Targets**: All inputs >= 48x48dp
- **Contrast**: WCAG AA (4.5:1)
- **Keyboard**: Tab, Enter submit, Escape closes
- **Focus**: Code field auto-focused on open
- **Screen Reader**: Announces "Create Machine Modal", field labels, errors

---

## Technical Notes

### API Endpoints
- **Create**: `POST /api/settings/machines`
- **Update**: `PATCH /api/settings/machines/:id`
- **Validation**: `GET /api/settings/machines/validate-code?code={code}`
- **Load Lines**: `GET /api/settings/production-lines?active=true`

### Data Structure
```typescript
{
  code: string;        // 4-8 chars, uppercase
  name: string;
  type: 'MIXER' | 'OVEN' | 'PACKAGING' | 'FILLING' | 'LABELING' | 'OTHER';
  production_line_id: string | null;  // optional FK
  capacity_per_hour: number;           // required, > 0, max 999999
  specifications: string;              // optional
  active: boolean;
  org_id: string;                     // auto-populated
}
```

---

## Related Screens

- **Machine List**: [SET-016-machine-list.md] (parent screen)
- **Production Line**: For line assignment context

---

## Handoff Notes

1. ShadCN Dialog component
2. Zod schema: `lib/validation/machine-schema.ts`
3. Service: `lib/services/machine-service.ts`
4. Code uniqueness: debounce 500ms on blur
5. Code immutable if machine has WO operation records (show warning in edit mode)
6. Production Line dropdown: load on modal open, show "(None)" option
7. **Capacity field**: NumberInput component, suffix "units/hour", step 0.01, required
8. Specifications field: placeholder "e.g., Power: 15kW, Dimensions: 2m x 1.5m x 2m"
9. Type tooltips: optional, show common use cases on hover

---

**Approval Status**: Auto-approved
**Mode**: auto_approve
**User Approved**: true (explicit opt-in)
**Iterations**: 0 of 3
