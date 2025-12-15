# SET-004: Onboarding Wizard - First Locations

**Module**: Settings
**Feature**: Onboarding Wizard (Story 1.12)
**Step**: 3 of 6
**Status**: Ready for Review
**Last Updated**: 2025-12-15

---

## Overview

Third step of onboarding wizard. Creates storage locations within warehouse from Step 2. Offers template selection with preview of location tree structure. Templates auto-generate required locations based on business size (single location, basic zones, or full hierarchy).

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
│  │  ◉ Simple - Single Location         Recommended         │ │
│  │     ├─ DEFAULT                                          │ │
│  │     Best for: Micro operations, <5 SKUs                │ │
│  │                                                         │ │
│  │  ○ Basic - 3 Zones                                      │ │
│  │     ├─ RAW-ZONE (Raw Materials)                         │ │
│  │     ├─ PROD-ZONE (Production)                           │ │
│  │     ├─ FG-ZONE (Finished Goods)                         │ │
│  │     Best for: Small manufacturers, quality checks       │ │
│  │                                                         │ │
│  │  ○ Full Hierarchy (9 locations)                         │ │
│  │     Complete zone structure with sub-locations          │ │
│  │     Best for: Multi-line facility, >50 SKUs             │ │
│  │                                                         │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Preview: Simple - Single Location Template             │ │
│  │                                                         │ │
│  │  MAIN (Warehouse)                                       │ │
│  │   └─ DEFAULT (Default Location)       Type: STORAGE    │ │
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
│  │  • Location code "DEFAULT" already exists               │ │
│  │  • At least 1 storage location required                 │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Customize Locations (Expanded)                         │ │
│  │                                                         │ │
│  │  MAIN (Warehouse)                                       │ │
│  │   └─ [DEFAULT___] ⚠ Duplicate  Type: [STORAGE ▼]       │ │
│  │                                                         │ │
│  │  Suggested codes: DEFAULT-2, LOC-1, STORAGE-1           │ │
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
  - **Simple - Single Location**: 1 location (default, recommended for micro operations)
  - **Basic - 3 Zones**: 3 locations (RAW, PROD, FG for quality + storage)
  - **Full Hierarchy**: 9 locations (complex multi-line with sub-locations)
- **Display**: Show location count + tree preview for each

### 3. Location Tree Preview
- **Type**: Expandable tree view
- **Content**:
  - Location code (editable if customized)
  - Location name
  - Location type (STORAGE, RECEIVING, PRODUCTION, etc.)
- **Interaction**: "Customize Codes" expands to editable fields

### 4. Location Requirements
- **Required Types** (per template):
  - Simple: At least 1 STORAGE location
  - Basic: At least 1 STORAGE location (3 zones all type STORAGE)
  - Full: At least 1 STORAGE location

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
- **Behavior**: Skip location creation, allow continuing (default location will be created during warehouse setup)

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

OR

SUCCESS
  ↓ [Skip Step]
Step 4 (Product)
```

---

## Validation

### Required Fields
- At least 1 location of required type (per template)
- All location codes unique within warehouse
- Location codes match pattern: `^[A-Z0-9-]+$` (2-20 chars)

### Validation Rules
```typescript
{
  template: z.enum(['simple', 'basic', 'full']),
  locations: z.array(z.object({
    code: z.string().min(2).max(20).regex(/^[A-Z0-9-]+$/),
    name: z.string().min(2).max(100),
    type: z.enum(['STORAGE', 'RECEIVING', 'PRODUCTION', 'SHIPPING', 'TRANSIT', 'QUARANTINE']),
    parent_id: z.string().uuid().optional()
  }))
}
```

### Template-Specific Validation
```typescript
// Simple: Requires at least 1 STORAGE
const hasStorage = locations.some(l => l.type === 'STORAGE');

// Basic: Requires 3 zones (all STORAGE type)
const hasBasic = locations.filter(l => l.type === 'STORAGE').length >= 3;

// Full: Requires hierarchical structure with parent/child relationships
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
      { "code": "DEFAULT", "name": "Default Location", "type": "STORAGE" }
    ]
  }
}
```

---

## Technical Notes

### Template Definitions (Aligned with PRD)

**Simple - Single Location** (1 location):
```json
[
  { "code": "DEFAULT", "name": "Default Location", "type": "STORAGE" }
]
```

**Basic - 3 Zones** (3 locations):
```json
[
  { "code": "RAW-ZONE", "name": "Raw Materials Zone", "type": "STORAGE" },
  { "code": "PROD-ZONE", "name": "Production Zone", "type": "STORAGE" },
  { "code": "FG-ZONE", "name": "Finished Goods Zone", "type": "STORAGE" }
]
```

**Full Hierarchy** (9 locations with parent/child):
```json
[
  { "code": "RAW-ZONE", "name": "Raw Materials Zone", "type": "STORAGE" },
  { "code": "RAW-SHELF-1", "name": "Shelf 1", "type": "STORAGE", "parent_id": "raw_zone_id" },
  { "code": "RAW-SHELF-2", "name": "Shelf 2", "type": "STORAGE", "parent_id": "raw_zone_id" },
  { "code": "RAW-SHELF-3", "name": "Shelf 3", "type": "STORAGE", "parent_id": "raw_zone_id" },
  { "code": "PROD-ZONE", "name": "Production Zone", "type": "STORAGE" },
  { "code": "FG-ZONE", "name": "Finished Goods Zone", "type": "STORAGE" },
  { "code": "FG-SHELF-1", "name": "Shelf 1", "type": "STORAGE", "parent_id": "fg_zone_id" },
  { "code": "FG-SHELF-2", "name": "Shelf 2", "type": "STORAGE", "parent_id": "fg_zone_id" },
  { "code": "FG-SHELF-3", "name": "Shelf 3", "type": "STORAGE", "parent_id": "fg_zone_id" }
]
```

### Warehouse Association
- All locations created with `warehouse_id` from Step 2
- Warehouse's `default_receiving_location_id` set to DEFAULT or first RECEIVING location
- Warehouse's `transit_location_id` can be set if TRANSIT location added

---

## Accessibility

- **Touch targets**: All radio buttons >= 48x48dp
- **Keyboard**: Arrow keys navigate templates, Tab/Shift+Tab for other controls
- **Tree view**: Collapsible/expandable via keyboard (Enter/Space)
- **Screen reader**: Announces location count and type per template
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
6. Template names MUST match PRD exactly: "Simple - Single Location", "Basic - 3 Zones", "Full Hierarchy"

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
**Last Fixed**: 2025-12-15 (PRD alignment - template names, location types)
