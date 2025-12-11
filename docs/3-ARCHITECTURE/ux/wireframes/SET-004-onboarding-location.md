# SET-004: Onboarding Wizard - First Locations

**Module**: Settings
**Feature**: Onboarding Wizard (Story 1.12)
**Step**: 3 of 6
**Status**: Ready for Review
**Last Updated**: 2025-12-11

---

## Overview

Third step of onboarding wizard. Creates storage locations within warehouse from Step 2. Offers template selection (Simple/Basic/Full) with preview of location tree structure. Templates auto-generate required locations (Receiving, Shipping, Transit, Production).

---

## ASCII Wireframe

### Success State

```
┌─────────────────────────────────────────────────────────────┐
│  MonoPilot Onboarding Wizard                    [3/6]  50%  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Step 3: Storage Locations                                   │
│                                                               │
│  Set up location zones in MAIN warehouse                     │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Template Selection                                     │ │
│  │                                                         │ │
│  │  ◉ Simple (4 locations)         Recommended             │ │
│  │     ├─ RECEIVING                                        │ │
│  │     ├─ PRODUCTION                                       │ │
│  │     ├─ SHIPPING                                         │ │
│  │     └─ TRANSIT                                          │ │
│  │     Best for: Single production line, <10 SKUs          │ │
│  │                                                         │ │
│  │  ○ Basic (8 locations)                                  │ │
│  │     ├─ RECEIVING                                        │ │
│  │     ├─ PRODUCTION (Line 1, Line 2)                      │ │
│  │     ├─ QUARANTINE                                       │ │
│  │     ├─ STORAGE (Raw, Finished)                          │ │
│  │     ├─ SHIPPING                                         │ │
│  │     └─ TRANSIT                                          │ │
│  │     Best for: 2+ lines, quality checks                  │ │
│  │                                                         │ │
│  │  ○ Full (15+ locations)                                 │ │
│  │     Complete zone structure with sub-locations          │ │
│  │     Best for: Multi-line facility, >50 SKUs             │ │
│  │                                                         │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Preview: Simple Template                               │ │
│  │                                                         │ │
│  │  MAIN (Warehouse)                                       │ │
│  │   ├─ REC-01 (Receiving Dock)     Type: RECEIVING       │ │
│  │   ├─ PROD-01 (Production Floor)  Type: PRODUCTION      │ │
│  │   ├─ SHIP-01 (Shipping Dock)     Type: SHIPPING        │ │
│  │   └─ TRANSIT (In Transit)        Type: TRANSIT         │ │
│  │                                                         │ │
│  │  [Customize Codes ▼]                                    │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  [◀ Back]      [Skip Step]              [Next: Product →]    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Loading State

```
┌─────────────────────────────────────────────────────────────┐
│  MonoPilot Onboarding Wizard                    [3/6]  50%  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│                      [Spinner]                                │
│                                                               │
│                Loading location templates...                  │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  [Skeleton: Radio buttons]                              │ │
│  │  [Skeleton: Tree preview]                               │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Error State

```
┌─────────────────────────────────────────────────────────────┐
│  MonoPilot Onboarding Wizard                    [3/6]  50%  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Step 3: Storage Locations                                   │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  ⚠ Please fix the following errors:                     │ │
│  │                                                         │ │
│  │  • Location code "REC-01" already exists                │ │
│  │  • At least 1 RECEIVING location required               │ │
│  │  • At least 1 PRODUCTION location required              │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Customize Locations (Expanded)                         │ │
│  │                                                         │ │
│  │  MAIN (Warehouse)                                       │ │
│  │   ├─ [REC-01____] ⚠ Duplicate  Type: [RECEIVING ▼]     │ │
│  │   ├─ [PROD-01___]              Type: [PRODUCTION ▼]    │ │
│  │   ├─ [SHIP-01___]              Type: [SHIPPING ▼]      │ │
│  │   └─ [TRANSIT___]              Type: [TRANSIT ▼]       │ │
│  │                                                         │ │
│  │  Suggested codes: REC-02, RECV-01, DOCK-01              │ │
│  │                                                         │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  [◀ Back]      [Skip Step]              [Next: Product →]    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Empty State

```
┌─────────────────────────────────────────────────────────────┐
│  MonoPilot Onboarding Wizard                    [3/6]  50%  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Step 3: Storage Locations                                   │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              ⚠ No Warehouse Available                    │ │
│  │                                                         │ │
│  │  You need a warehouse before creating locations.        │ │
│  │                                                         │ │
│  │  Please go back and create a warehouse in Step 2.       │ │
│  │                                                         │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  [◀ Back to Warehouse]                         [Skip Step]   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Components

### 1. Progress Tracker
- **Display**: "3/6" + 50% progress bar
- **Purpose**: Show wizard progress (halfway point)
- **Color**: Blue (in progress)

### 2. Template Selector
- **Type**: Radio button group (3 options)
- **Options**:
  - **Simple**: 4 locations (default, recommended)
  - **Basic**: 8 locations (quality + storage zones)
  - **Full**: 15+ locations (complex multi-line)
- **Display**: Show location count + tree preview for each

### 3. Location Tree Preview
- **Type**: Expandable tree view
- **Content**:
  - Location code (editable if customized)
  - Location name
  - Location type (RECEIVING, PRODUCTION, etc.)
- **Interaction**: "Customize Codes" expands to editable fields

### 4. Required Location Types
- **RECEIVING**: At least 1 (for inventory receipt)
- **PRODUCTION**: At least 1 (for work orders)
- **SHIPPING**: At least 1 (for shipments)
- **TRANSIT**: Exactly 1 (system location)

---

## Main Actions

### Primary Action
- **Button**: "Next: Product →"
- **Behavior**:
  - Validate location codes unique within warehouse
  - Validate required location types present
  - Save to `wizard_progress.step3`
  - Navigate to Step 4 (First Product)
- **Size**: Large (48dp height)

### Secondary Actions
- **Button**: "◀ Back"
- **Behavior**: Return to Step 2 (Warehouse)
- **Button**: "Skip Step"
- **Behavior**: Skip location creation (NOT recommended, show warning)

### Tertiary Action
- **Link**: "Customize Codes ▼"
- **Behavior**: Expand preview to show editable code/name fields

---

## State Transitions

```
Step 2 (Warehouse)
  ↓ [Next]
LOADING (Load templates)
  ↓ Success (warehouse exists)
SUCCESS (Show Simple template selected)
  ↓ [Customize Codes]
SUCCESS (Show editable fields)
  ↓ [Next]
  ↓ Validate codes + types
  ↓ Success
Step 4 (Product)

OR

LOADING
  ↓ No warehouse in step2
EMPTY (Show "No warehouse" message)
  ↓ [Back to Warehouse]
Step 2 (Warehouse)

OR

SUCCESS
  ↓ [Next]
  ↓ Validation fails
ERROR (Show duplicate codes + suggestions)
  ↓ Fix codes, [Next]
Step 4 (Product)
```

---

## Validation

### Required Fields
- At least 1 location of type RECEIVING
- At least 1 location of type PRODUCTION
- Exactly 1 location of type TRANSIT
- All location codes unique within warehouse

### Validation Rules
```typescript
{
  template: z.enum(['simple', 'basic', 'full']),
  locations: z.array(z.object({
    code: z.string().min(2).max(20).regex(/^[A-Z0-9-]+$/),
    name: z.string().min(2).max(100),
    type: z.enum(['RECEIVING', 'PRODUCTION', 'STORAGE', 'SHIPPING', 'TRANSIT', 'QUARANTINE']),
    parent_id: z.string().uuid().optional()
  }))
}
```

### Template Validation
```typescript
// Check required types present
const hasReceiving = locations.some(l => l.type === 'RECEIVING');
const hasProduction = locations.some(l => l.type === 'PRODUCTION');
const hasShipping = locations.some(l => l.type === 'SHIPPING');
const hasTransit = locations.filter(l => l.type === 'TRANSIT').length === 1;
```

---

## Data Saved

Step 3 saves to `organizations.wizard_progress`:
```json
{
  "step": 3,
  "step3": {
    "template": "simple",
    "locations": [
      { "code": "REC-01", "name": "Receiving Dock", "type": "RECEIVING" },
      { "code": "PROD-01", "name": "Production Floor", "type": "PRODUCTION" },
      { "code": "SHIP-01", "name": "Shipping Dock", "type": "SHIPPING" },
      { "code": "TRANSIT", "name": "In Transit", "type": "TRANSIT" }
    ]
  }
}
```

---

## Technical Notes

### Template Definitions

**Simple Template** (4 locations):
```json
[
  { "code": "REC-01", "name": "Receiving Dock", "type": "RECEIVING" },
  { "code": "PROD-01", "name": "Production Floor", "type": "PRODUCTION" },
  { "code": "SHIP-01", "name": "Shipping Dock", "type": "SHIPPING" },
  { "code": "TRANSIT", "name": "In Transit", "type": "TRANSIT" }
]
```

**Basic Template** (8 locations):
```json
[
  { "code": "REC-01", "name": "Receiving Dock", "type": "RECEIVING" },
  { "code": "PROD-01", "name": "Production Line 1", "type": "PRODUCTION" },
  { "code": "PROD-02", "name": "Production Line 2", "type": "PRODUCTION" },
  { "code": "QUAR-01", "name": "Quarantine Zone", "type": "QUARANTINE" },
  { "code": "STOR-RAW", "name": "Raw Material Storage", "type": "STORAGE" },
  { "code": "STOR-FG", "name": "Finished Goods Storage", "type": "STORAGE" },
  { "code": "SHIP-01", "name": "Shipping Dock", "type": "SHIPPING" },
  { "code": "TRANSIT", "name": "In Transit", "type": "TRANSIT" }
]
```

**Full Template**: 15 locations with parent/child hierarchy (not shown for brevity)

### Warehouse Association
- All locations created with `warehouse_id` from Step 2
- Warehouse's `default_receiving_location_id` set to first RECEIVING location
- Warehouse's `transit_location_id` set to TRANSIT location

---

## Accessibility

- **Touch targets**: All radio buttons >= 48x48dp
- **Keyboard**: Arrow keys navigate templates, Tab/Shift+Tab for other controls
- **Tree view**: Collapsible/expandable via keyboard (Enter/Space)
- **Screen reader**: Announces location count per template
- **Focus**: First radio button (Simple) auto-focused

---

## Related Screens

- **Previous**: [SET-003-onboarding-warehouse.md] (Step 2)
- **Next**: [SET-005-onboarding-product-workorder.md] (Steps 4-5)

---

## Handoff Notes

### For FRONTEND-DEV:
1. Use `LocationsStep` component
2. Load warehouse from `wizard_progress.step2`
3. Default to Simple template (pre-select radio button)
4. Validate location codes unique via warehouse context
5. Save to `wizard_progress.step3`

### API Endpoints:
```
GET /api/settings/wizard/templates/locations
Response: { simple: [...], basic: [...], full: [...] }

PATCH /api/settings/wizard/progress
Body: { step: 3, step3: {...} }
Response: { success: true }
```

---

**Status**: Ready for Implementation
**Approval Mode**: Auto-Approve (Concise Format)
**Iterations**: 0 of 3
