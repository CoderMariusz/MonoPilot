# SET-003: Onboarding Wizard - First Warehouse

**Module**: Settings
**Feature**: Onboarding Wizard (Story 1.12)
**Step**: 2 of 6
**Status**: Ready for Review
**Last Updated**: 2025-12-15

---

## Overview

Second step of onboarding wizard. Creates organization's first warehouse. Offers "Quick Setup" (auto-generate defaults) or "Custom" (manual entry). Most users choose Quick Setup for speed. Warehouse code auto-generated as "WH-001" if quick setup selected. Default warehouse type is "General" for multi-purpose use.

---

## ASCII Wireframe

### Success State

```
┌─────────────────────────────────────────────────────────────┐
│  MonoPilot Onboarding Wizard                    [2/6]  33%  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Step 2: First Warehouse                                     │
│                                                               │
│  Create your primary warehouse location                      │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Setup Type                                             │ │
│  │                                                         │ │
│  │  ○ Quick Setup (Recommended)                            │ │
│  │     Auto-generate warehouse "WH-001" with standard      │ │
│  │     Best for: Getting started quickly                   │ │
│  │                                                         │ │
│  │  ○ Custom Setup                                         │ │
│  │     Manually configure warehouse code and details       │ │
│  │     Best for: Specific naming requirements              │ │
│  │                                                         │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Warehouse Details (Quick Setup)                        │ │
│  │                                                         │ │
│  │  Warehouse Code *                                       │ │
│  │  [WH-001_______] (Auto-generated)                       │ │
│  │                                                         │ │
│  │  Warehouse Name *                                       │ │
│  │  [Main Warehouse_________________________]              │ │
│  │                                                         │ │
│  │  Warehouse Type *                                       │ │
│  │  [General ▼]  (?) Multi-purpose warehouse              │ │
│  │                                                         │ │
│  │  Address (Optional)                                     │ │
│  │  [Same as organization address] ✓                       │ │
│  │                                                         │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  * Required fields                                            │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  [◀ Back]      [Skip - Use Demo Warehouse]  [Next: Locations →]
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Loading State

```
┌─────────────────────────────────────────────────────────────┐
│  MonoPilot Onboarding Wizard                    [2/6]  33%  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│                      [Spinner]                                │
│                                                               │
│                Loading warehouse defaults...                  │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  [Skeleton: Radio buttons]                              │ │
│  │  [Skeleton: Form fields]                                │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Error State

```
┌─────────────────────────────────────────────────────────────┐
│  MonoPilot Onboarding Wizard                    [2/6]  33%  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Step 2: First Warehouse                                     │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  ⚠ Please fix the following errors:                     │ │
│  │                                                         │ │
│  │  • Warehouse code "WH-001" already exists               │ │
│  │  • Warehouse name is required                           │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Warehouse Details (Custom Setup)                       │ │
│  │                                                         │ │
│  │  Warehouse Code * ⚠ Already exists                      │ │
│  │  [WH-001_____]  Suggested: [WH-002▼] [WH-01▼] [MAIN▼]   │ │
│  │                                                         │ │
│  │  Warehouse Name * ⚠ Required                            │ │
│  │  [________________________________]                      │ │
│  │                                                         │ │
│  │  Warehouse Type *                                       │ │
│  │  [General ▼]                                            │ │
│  │                                                         │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  [◀ Back]      [Skip - Use Demo Warehouse]  [Next: Locations →]
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Empty State

```
(Not applicable - form always shows Quick Setup by default)
```

---

## Key Components

### 1. Progress Tracker
- **Display**: "2/6" + 33% progress bar
- **Purpose**: Show wizard progress
- **Color**: Blue (in progress)

### 2. Setup Type Selector
- **Type**: Radio button group
- **Options**:
  - Quick Setup (default, recommended)
  - Custom Setup
- **Behavior**: Toggle between pre-filled vs manual entry

### 3. Warehouse Details Form
- **Fields** (Quick Setup):
  - Code: "WH-001" (auto-filled, editable)
  - Name: "Main Warehouse" (auto-filled, editable)
  - Type: "General" (dropdown, pre-selected) - see tooltip
  - Address: Checkbox "Same as organization" (checked)
- **Fields** (Custom Setup):
  - Code: Empty (user enters)
  - Name: Empty (user enters)
  - Type: "General" default (user selects, required)
  - Address: Individual fields (city, postal, etc.)

### 4. Warehouse Type Dropdown
- **Options** (PRD FR-SET-041):
  - Raw Materials - Store incoming raw ingredients and packaging
  - Work in Progress (WIP) - For items currently in production
  - Finished Goods - Completed products ready to ship
  - Quarantine - Items on hold for quality inspection
  - General - Multi-purpose warehouse (default, recommended for small operations)

### 5. Warehouse Type Tooltips (PRD FR-SET-182)
Each warehouse type displays tooltip on hover:

| Type | Tooltip |
|------|---------|
| Raw Materials | Store incoming ingredients and packaging. Raw material LPs automatically assigned here during receiving. |
| Work in Progress | For items currently in production. WIP is tracked separately from raw materials and finished goods. |
| Finished Goods | Completed products ready for shipping. System warns if raw materials moved here. |
| Quarantine | Items on hold for quality inspection. LPs automatically marked as "QA Hold" status. |
| General | Multi-purpose warehouse for small operations. Handles all inventory types. (Recommended for startups) |

---

## Main Actions

### Primary Action
- **Button**: "Next: Locations →"
- **Behavior**:
  - Validate warehouse code uniqueness
  - Validate required fields (code, name, type)
  - Validate warehouse type is valid enum
  - Save to `wizard_progress.step2`
  - Navigate to Step 3 (Locations)
- **Size**: Large (48dp height)

### Secondary Actions
- **Button**: "◀ Back"
- **Behavior**: Return to Step 1 (Organization Profile), preserve entered data
- **Button**: "Skip - Use Demo Warehouse"
- **Behavior**: Auto-create demo warehouse "DEMO-WH" with type "General" and advance to Step 3

---

## State Transitions

```
Step 1 (Organization)
  ↓ [Next]
LOADING (Load warehouse defaults)
  ↓ Success
SUCCESS (Show Quick Setup form with WH-001, General type)
  ↓ Select "Custom Setup"
SUCCESS (Show empty Custom form, type defaults to General)
  ↓ [Next]
  ↓ Validate code uniqueness
  ↓ Success
Step 3 (Locations)

OR

SUCCESS
  ↓ [Next]
  ↓ Validation fails
ERROR (Show duplicate code error + suggestions)
  ↓ Fix code, [Next]
Step 3 (Locations)

OR

SUCCESS
  ↓ [Skip - Use Demo Warehouse]
  ↓ Auto-create DEMO-WH
Step 3 (Locations)
```

---

## Validation

### Required Fields
- Warehouse Code (2-10 chars, uppercase, alphanumeric)
- Warehouse Name (2-100 chars)
- Warehouse Type (must be valid enum: RAW_MATERIALS, WIP, FINISHED_GOODS, QUARANTINE, GENERAL)

### Validation Rules
```typescript
{
  setup_type: z.enum(['quick', 'custom']),
  code: z.string().min(2).max(10).regex(/^[A-Z0-9-]+$/),
  name: z.string().min(2).max(100),
  type: z.enum(['RAW_MATERIALS', 'WIP', 'FINISHED_GOODS', 'QUARANTINE', 'GENERAL']),
  address_same_as_org: z.boolean(),
  address: z.object({...}).optional() // if not same as org
}
```

### Code Uniqueness Check
```sql
SELECT COUNT(*) FROM warehouses
WHERE org_id = :org_id AND code = :code;
-- Must return 0
```

### Type Enum Validation
```sql
-- Warehouse type must be one of:
-- 'RAW_MATERIALS', 'WIP', 'FINISHED_GOODS', 'QUARANTINE', 'GENERAL'
```

---

## Data Saved

Step 2 saves to `organizations.wizard_progress`:
```json
{
  "step": 2,
  "step2": {
    "setup_type": "quick",
    "warehouse_code": "WH-001",
    "warehouse_name": "Main Warehouse",
    "warehouse_type": "GENERAL",
    "address_same_as_org": true,
    "address": null
  }
}
```

If user selects "Skip - Use Demo Warehouse":
```json
{
  "step": 2,
  "step2": {
    "setup_type": "demo",
    "warehouse_code": "DEMO-WH",
    "warehouse_name": "Demo Warehouse",
    "warehouse_type": "GENERAL",
    "address_same_as_org": true,
    "address": null,
    "is_demo": true
  }
}
```

---

## Technical Notes

### Quick Setup Defaults
- Code: "WH-001" (auto-generated)
- Name: "Main Warehouse"
- Type: "GENERAL" (default per PRD FR-SET-182)
- Address: Copy from `organizations.address`

### Custom Setup
- All fields empty initially except Type which defaults to "GENERAL"
- Code suggestions on duplicate: WH-002, WH-03, MAIN, etc.
- Address fields shown if "Same as organization" unchecked

### Warehouse Type Behavior
- **RAW_MATERIALS**: System suggests as default destination for PO receiving
- **WIP**: Separate inventory tracking during production
- **FINISHED_GOODS**: System warns if raw material LP moved here (product type mismatch)
- **QUARANTINE**: LPs moved here automatically marked as "QA Hold" status
- **GENERAL**: Multi-purpose, no special behavior, ideal for small operations

### Demo Warehouse
- Created if user clicks "Skip - Use Demo Warehouse"
- Code: "DEMO-WH"
- Type: "GENERAL"
- Marked with `is_demo = true` for future identification
- Can be edited/renamed later in Settings

---

## Accessibility

- **Touch targets**: All inputs >= 48x48dp
- **Radio buttons**: Keyboard navigable (arrow keys)
- **Labels**: Associated with inputs using `<label htmlFor="...">`
- **Required fields**: Marked with * and `aria-required="true"`
- **Tooltips**: Accessible via (?) icon, keyboard accessible
- **Error messages**: Announced to screen readers with `role="alert"`
- **Focus**: First radio button auto-focused on load
- **Color contrast**: All text meets 4.5:1 minimum

---

## Related Screens

- **Previous**: [SET-002-onboarding-organization.md] (Step 1)
- **Next**: [SET-004-onboarding-location.md] (Step 3)

---

## Handoff Notes

### For FRONTEND-DEV:
1. Use `WarehouseStep` component
2. Default to Quick Setup with pre-filled "WH-001"
3. Default warehouse type to "General" (not Production or Storage Only)
4. Warehouse type options: Raw Materials, Work in Progress, Finished Goods, Quarantine, General
5. Add tooltip icons (?) next to type dropdown explaining each option
6. Validate code uniqueness via `GET /api/warehouses/check-code?code=WH-001`
7. On duplicate: show suggestions, let user edit
8. Save to `wizard_progress.step2` via `PATCH /api/settings/wizard/progress`
9. Support "Skip - Use Demo Warehouse" to auto-create DEMO-WH and advance

### API Endpoints:
```
GET /api/warehouses/check-code?code=WH-001
Response: { exists: false }

PATCH /api/settings/wizard/progress
Body: { step: 2, step2: {...} }
Response: { success: true }

POST /api/warehouses/demo (if skip selected)
Body: { }
Response: { warehouse: { code: "DEMO-WH", type: "GENERAL", ... } }
```

### Database Enum Values
Update warehouse type enum in schema to:
```
type warehouse_type = 'RAW_MATERIALS' | 'WIP' | 'FINISHED_GOODS' | 'QUARANTINE' | 'GENERAL'
```

---

**Status**: Ready for Implementation
**Approval Mode**: Auto-Approve (Critical Fix Applied)
**Iterations**: 1 of 3 (Critical warehouse type mismatch fixed)
**PRD Compliance**: FR-SET-041 (warehouse types) ✓, FR-SET-182 (first warehouse creation) ✓
