# SET-003: Onboarding Wizard - First Warehouse

**Module**: Settings
**Feature**: Onboarding Wizard (Story 1.12)
**Step**: 2 of 6
**Status**: Ready for Review
**Last Updated**: 2025-12-11

---

## Overview

Second step of onboarding wizard. Creates organization's first warehouse. Offers "Quick Setup" (auto-generate defaults) or "Custom" (manual entry). Most users choose Quick Setup for speed. Warehouse code auto-generated as "MAIN" if quick setup selected.

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
│  │     Auto-generate warehouse "MAIN" with standard zones  │ │
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
│  │  [MAIN_____] (Auto-generated)                           │ │
│  │                                                         │ │
│  │  Warehouse Name *                                       │ │
│  │  [Main Warehouse_________________________]              │ │
│  │                                                         │ │
│  │  Warehouse Type *                                       │ │
│  │  [Production ▼]                                         │ │
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
│  [◀ Back]      [Skip Step]              [Next: Locations →]  │
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
│  │  • Warehouse code "MAIN" already exists                 │ │
│  │  • Warehouse name is required                           │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Warehouse Details (Custom Setup)                       │ │
│  │                                                         │ │
│  │  Warehouse Code * ⚠ Already exists                      │ │
│  │  [MAIN_____]  Suggested: [MAIN2▼] [WH01▼] [PROD▼]       │ │
│  │                                                         │ │
│  │  Warehouse Name * ⚠ Required                            │ │
│  │  [________________________________]                      │ │
│  │                                                         │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  [◀ Back]      [Skip Step]              [Next: Locations →]  │
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
  - Code: "MAIN" (auto-filled, editable)
  - Name: "Main Warehouse" (auto-filled, editable)
  - Type: "Production" (dropdown, pre-selected)
  - Address: Checkbox "Same as organization" (checked)
- **Fields** (Custom Setup):
  - Code: Empty (user enters)
  - Name: Empty (user enters)
  - Type: No default (user selects)
  - Address: Individual fields (city, postal, etc.)

### 4. Warehouse Type Dropdown
- **Options**:
  - Production (default)
  - Storage Only
  - Distribution Center
  - Co-Packer

---

## Main Actions

### Primary Action
- **Button**: "Next: Locations →"
- **Behavior**:
  - Validate warehouse code uniqueness
  - Validate required fields
  - Save to `wizard_progress.step2`
  - Navigate to Step 3 (Locations)
- **Size**: Large (48dp height)

### Secondary Actions
- **Button**: "◀ Back"
- **Behavior**: Return to Step 1 (Organization Profile)
- **Button**: "Skip Step"
- **Behavior**: Skip warehouse creation, go to Step 3 (creates issues, should warn)

---

## State Transitions

```
Step 1 (Organization)
  ↓ [Next]
LOADING (Load warehouse defaults)
  ↓ Success
SUCCESS (Show Quick Setup form)
  ↓ Select "Custom Setup"
SUCCESS (Show empty Custom form)
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
```

---

## Validation

### Required Fields
- Warehouse Code (2-10 chars, uppercase, alphanumeric)
- Warehouse Name (2-100 chars)
- Warehouse Type (must be valid enum)

### Validation Rules
```typescript
{
  setup_type: z.enum(['quick', 'custom']),
  code: z.string().min(2).max(10).regex(/^[A-Z0-9]+$/),
  name: z.string().min(2).max(100),
  type: z.enum(['PRODUCTION', 'STORAGE', 'DISTRIBUTION', 'COPACKER']),
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

---

## Data Saved

Step 2 saves to `organizations.wizard_progress`:
```json
{
  "step": 2,
  "step2": {
    "setup_type": "quick",
    "warehouse_code": "MAIN",
    "warehouse_name": "Main Warehouse",
    "warehouse_type": "PRODUCTION",
    "address_same_as_org": true,
    "address": null
  }
}
```

---

## Technical Notes

### Quick Setup Defaults
- Code: "MAIN"
- Name: "Main Warehouse"
- Type: "PRODUCTION"
- Address: Copy from `organizations.address`

### Custom Setup
- All fields empty initially
- Code suggestions on duplicate: MAIN2, WH01, PROD, etc.
- Address fields shown if "Same as organization" unchecked

### Skip Behavior
- **Warning**: Skipping warehouse prevents location setup (Step 3)
- **Recommendation**: Don't allow skip OR auto-create minimal warehouse

---

## Accessibility

- **Touch targets**: All inputs >= 48x48dp
- **Radio buttons**: Keyboard navigable (arrow keys)
- **Labels**: Associated with inputs
- **Required fields**: Marked with * and `aria-required="true"`
- **Error messages**: Announced to screen readers
- **Focus**: First radio button auto-focused on load

---

## Related Screens

- **Previous**: [SET-002-onboarding-organization.md] (Step 1)
- **Next**: [SET-004-onboarding-location.md] (Step 3)

---

## Handoff Notes

### For FRONTEND-DEV:
1. Use `WarehouseStep` component
2. Default to Quick Setup with pre-filled "MAIN"
3. Validate code uniqueness via `GET /api/warehouses/check-code?code=MAIN`
4. On duplicate: show suggestions, let user edit
5. Save to `wizard_progress.step2` via `PATCH /api/settings/wizard/progress`

### API Endpoints:
```
GET /api/warehouses/check-code?code=MAIN
Response: { exists: false }

PATCH /api/settings/wizard/progress
Body: { step: 2, step2: {...} }
Response: { success: true }
```

---

**Status**: Ready for Implementation
**Approval Mode**: Auto-Approve (Concise Format)
**Iterations**: 0 of 3
