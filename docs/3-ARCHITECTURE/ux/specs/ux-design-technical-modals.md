# Technical Module - BOM Clone & Compare Modals

**Epic:** 2 - Technical Module (Products, BOMs, Routing)
**Stories:** 2.10 (BOM Clone), 2.11 (BOM Compare)
**Version**: 1.0
**Date**: 2025-12-07
**Status**: Documentation

---

## Overview

This document provides detailed UX specifications for BOM Clone and BOM Compare modals, which were missing from the main Technical Module UX documentation (75% → 90% coverage).

**Modals Covered**:
1. BOMCloneModal (Story 2.10)
2. BOMCompareModal (Story 2.11)

---

## 1. BOMCloneModal

**Purpose**: Create a new version of an existing BOM with all items copied
**Trigger**: User clicks "Clone BOM" button on BOM detail page
**Story**: 2.10 - BOM Clone
**Location**: `apps/frontend/components/technical/BOMCloneModal.tsx`

### 1.1 Fields

| Field | Type | Required | Default | Validation |
|-------|------|----------|---------|------------|
| Effective From | Date input | Yes | Today | Must be a valid date |
| Effective To | Date input | No | Empty | Must be after Effective From |

### 1.2 Actions

| Button | Style | Behavior |
|--------|-------|----------|
| Cancel | Outline (gray) | Close modal without action |
| Clone BOM | Primary (blue) | Submit clone request, show loading state |

### 1.3 States

**Loading** (Initial):
- Modal opens with form ready
- Effective From pre-filled with today's date

**Submitting**:
- "Clone BOM" button shows spinner
- Button text: "Cloning..."
- Both buttons disabled

**Error**:
- Toast notification (red, top-right)
- Error types:
  - **Date Overlap**: "Date range overlaps with existing BOM version"
  - **Other**: Display API error message

**Success**:
- Toast notification (green): "New version created with {count} items"
- Modal closes
- Auto-navigate to new BOM detail page

### 1.4 Validation

**Client-side**:
- Effective From required (red border if empty)
- Effective To must be after Effective From (inline error message)
- Errors clear on input

**Server-side**:
- Date range overlap check (returns BOM_DATE_OVERLAP error)
- Product must have valid BOM to clone

### 1.5 API Call

```
POST /api/technical/boms/{bomId}/clone
Body: {
  effective_from: "2025-12-07T00:00:00.000Z",
  effective_to: "2026-12-07T00:00:00.000Z" (optional)
}
Response: {
  bom: { id, version, status },
  cloned_items_count: 15,
  message: "BOM cloned successfully"
}
```

### 1.6 UX Notes

**Title**:
- Icon: Copy (lucide-react)
- Text: "Clone BOM v{version}"

**Description**:
- "Create a new version of this BOM with all items copied. The new version will be set to Draft status."

**Info Box** (blue background):
- **What will be cloned:**
  - All BOM items with quantities
  - Condition flags and by-products
  - Output quantity and settings
- **Version auto-increment:**
  - Shows calculation: "v{current} → v{next}"
  - Example: "v1.0 → v1.1"

**Date Inputs**:
- Calendar icon next to labels
- Type: HTML5 date input
- Effective From: Required (red asterisk)
- Effective To: Optional, with helper text "Leave blank for no end date (indefinite)"

**Colors**:
- Info box: `bg-blue-50 text-blue-700`
- Icon: `text-blue-700`
- Success button: Default primary (blue)

**Keyboard Navigation**:
- Enter: Submit (if form valid)
- Escape: Cancel (close modal)
- Tab: Move between date inputs

**Accessibility**:
- Required fields marked with asterisk
- Error messages linked to inputs via aria-describedby
- Clear info about what will be cloned (reduces uncertainty)

### 1.7 Wireframe

```
┌─────────────────────────────────────────────────┐
│ 📄 Clone BOM v1.0                          [×]  │
├─────────────────────────────────────────────────┤
│ Create a new version of this BOM with all      │
│ items copied. The new version will be set to   │
│ Draft status.                                   │
│                                                 │
│ 📅 Effective From *                             │
│ [2025-12-07                              ]     │
│                                                 │
│ 📅 Effective To                                 │
│ [                                        ]     │
│ Leave blank for no end date (indefinite)       │
│                                                 │
│ ┌─────────────────────────────────────────┐    │
│ │ ℹ️ What will be cloned:                  │    │
│ │ • All BOM items with quantities         │    │
│ │ • Condition flags and by-products       │    │
│ │ • Output quantity and settings          │    │
│ │                                         │    │
│ │ Version will be auto-incremented        │    │
│ │ (v1.0 → v1.1)                           │    │
│ └─────────────────────────────────────────┘    │
│                                                 │
│                      [Cancel] [Clone BOM]       │
└─────────────────────────────────────────────────┘
```

### 1.8 User Flow Example

**Scenario**: Product Manager needs to create new BOM version for recipe change

1. Navigate to `/technical/boms/BOM-001` (current version v1.0)
2. Click "Clone BOM" button
3. Modal opens with:
   - Effective From: 2025-12-07 (today)
   - Effective To: empty
4. Change Effective From to: 2026-01-01 (planned change date)
5. Leave Effective To empty (indefinite)
6. Click "Clone BOM"
7. Success toast: "New version created with 15 items"
8. Auto-navigate to `/technical/boms/BOM-002` (v1.1, status: Draft)
9. User can now edit items for the new recipe

**Time**: ~20 seconds

---

## 2. BOMCompareModal

**Purpose**: Compare two BOM versions to see what changed
**Trigger**: User clicks "Compare Versions" button on BOM detail page
**Story**: 2.11 - BOM Compare
**Location**: `apps/frontend/components/technical/BOMCompareModal.tsx`

### 2.1 Fields

| Field | Type | Required | Default | Options |
|-------|------|----------|---------|---------|
| Version 1 (Base) | Select dropdown | Yes | Previous version | All versions for product |
| Version 2 (Compare) | Select dropdown | Yes | Current BOM | All versions for product |

### 2.2 Actions

| Button | Style | Behavior |
|--------|-------|----------|
| Compare Versions | Primary (blue) | Fetch comparison data, show results |
| Close | Outline (gray) | Close modal |

### 2.3 States

**Loading (Initial)**:
- Fetching BOM versions from API
- Dropdowns show loading state

**Idle** (Versions Loaded):
- Dropdowns populated with versions
- Version 1 pre-selected (previous version if available)
- Version 2 pre-selected (current BOM)
- "Compare Versions" button enabled

**Comparing**:
- Button shows spinner
- Button text: "Comparing..."
- Button disabled

**Results Displayed**:
- Summary section (v1 → v2 with item counts)
- Stats cards (Added, Removed, Changed, Unchanged)
- Three tables:
  - Added Items (green background)
  - Removed Items (red background)
  - Changed Items (yellow background)
- No Changes message (if identical)

**Empty State**:
- "At least two versions are needed to compare. This product only has {count} version(s)."

**Error**:
- Toast notification (red): "Failed to compare BOM versions"

### 2.4 Validation

**Client-side**:
- Both versions must be selected
- Versions must be different (error toast if same)
- Dropdown disables matching version (e.g., if v1 = BOM-001, v2 dropdown disables BOM-001)

**Server-side**:
- Both BOM IDs must exist and belong to same product

### 2.5 API Calls

**Fetch Versions**:
```
GET /api/technical/boms/timeline?product_id={productId}
Response: {
  timeline: {
    boms: [
      { id, version, status, effective_from, effective_to },
      ...
    ]
  }
}
```

**Compare**:
```
GET /api/technical/boms/compare?v1={bomId1}&v2={bomId2}
Response: {
  v1: { version: 1.0, items_count: 15 },
  v2: { version: 1.1, items_count: 17 },
  comparison: {
    added: [{ id, product, quantity, uom, ... }],
    removed: [{ id, product, quantity, uom, ... }],
    changed: [{ item_v1, item_v2, changes: ["Quantity: 10 → 12 kg"] }],
    unchanged: [{ id, product, quantity, uom, ... }]
  }
}
```

### 2.6 UX Notes

**Title**:
- Icon: GitCompare (lucide-react)
- Text: "Compare BOM Versions"

**Description**:
- "Select two versions to see what changed between them"

**Version Selection**:
- Two dropdowns side-by-side (grid-cols-2)
- Labels:
  - Left: "Version 1 (Base)"
  - Right: "Version 2 (Compare)"
- Dropdown format: "v{version} ({status})"
  - Example: "v1.0 (Active)", "v1.1 (Draft)"
- Cross-disable: If v1 selected, v2 dropdown disables that option

**Summary Section** (after comparison):
- Two boxes with arrow between:
  ```
  [Version 1.0]  →  [Version 1.1]
  [15 items]         [17 items]
  ```
- Gray background (bg-gray-50)
- Arrow icon: ArrowRight (gray-400)

**Stats Cards** (4 cards, grid-cols-4):
- **Added**: Green background (bg-green-50), green text (text-green-600)
  - Large number: count of added items
  - Small label: "Added"
- **Removed**: Red background (bg-red-50), red text (text-red-600)
- **Changed**: Yellow background (bg-yellow-50), yellow text (text-yellow-600)
- **Unchanged**: Gray background (bg-gray-100), gray text (text-gray-600)

**Tables**:
- **Added Items**:
  - Header icon: Plus (green)
  - Table rows: green background (bg-green-50)
  - Columns: Component (code + name), Quantity, Type (Input/By-Product badge)
- **Removed Items**:
  - Header icon: Minus (red)
  - Table rows: red background (bg-red-50)
- **Changed Items**:
  - Header icon: RefreshCw (yellow)
  - Table rows: yellow background (bg-yellow-50)
  - Columns: Component, Changes (list of changes)
  - Changes format:
    - "Quantity: 10 → 12 kg"
    - "Scrap %: 5 → 3"
    - "Sequence: 1 → 2"

**No Changes**:
- Center-aligned gray text: "No differences found between these versions."

**Keyboard Navigation**:
- Tab: Move between dropdowns
- Enter: Trigger compare (if both selected)
- Escape: Close modal

**Accessibility**:
- Clear labels for dropdowns
- Color-coded sections with icons (not color-only)
- Tables use semantic HTML

**Max Width**: 4xl (max-w-4xl)
**Max Height**: 90vh (scrollable)

### 2.7 Wireframe

```
┌───────────────────────────────────────────────────────────┐
│ ⚖️ Compare BOM Versions                              [×]  │
├───────────────────────────────────────────────────────────┤
│ Select two versions to see what changed between them     │
│                                                           │
│ Version 1 (Base)          Version 2 (Compare)            │
│ [v1.0 (Active) ▼    ]    [v1.1 (Draft) ▼        ]       │
│                                                           │
│              [⚖️ Compare Versions]                        │
│                                                           │
│ ┌───────────────────────────────────────────────────┐    │
│ │  Version 1.0   →   Version 1.1                    │    │
│ │  15 items          17 items                       │    │
│ └───────────────────────────────────────────────────┘    │
│                                                           │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                     │
│ │  2   │ │  1   │ │  3   │ │  11  │                     │
│ │Added │ │Removed│Changed│Unchanged                     │
│ └──────┘ └──────┘ └──────┘ └──────┘                     │
│                                                           │
│ ➕ Added Items                                            │
│ ┌───────────────────────────────────────────────────┐    │
│ │ Component       │ Quantity  │ Type                │    │
│ ├───────────────────────────────────────────────────┤    │
│ │ SP-101 Spices   │ 2.5 kg    │ Input               │    │
│ │ PK-202 Casings  │ 50 pcs    │ Input               │    │
│ └───────────────────────────────────────────────────┘    │
│                                                           │
│ ➖ Removed Items                                          │
│ ┌───────────────────────────────────────────────────┐    │
│ │ Component       │ Quantity  │ Type                │    │
│ ├───────────────────────────────────────────────────┤    │
│ │ SP-099 Old Mix  │ 3.0 kg    │ Input               │    │
│ └───────────────────────────────────────────────────┘    │
│                                                           │
│ 🔄 Changed Items                                          │
│ ┌───────────────────────────────────────────────────┐    │
│ │ Component       │ Changes                         │    │
│ ├───────────────────────────────────────────────────┤    │
│ │ BF-001 Beef     │ • Quantity: 100 → 110 kg        │    │
│ │ Trimmings       │ • Scrap %: 5 → 3                │    │
│ │ PK-101 Salt     │ • Sequence: 2 → 3               │    │
│ └───────────────────────────────────────────────────┘    │
│                                                           │
│                                          [Close]          │
└───────────────────────────────────────────────────────────┘
```

### 2.8 User Flow Example

**Scenario**: Quality Manager reviews recipe changes before approval

1. Navigate to `/technical/boms/BOM-002` (v1.1, Draft)
2. Click "Compare Versions" button
3. Modal opens:
   - Version 1 pre-selected: v1.0 (Active)
   - Version 2 pre-selected: v1.1 (Draft)
4. Click "Compare Versions"
5. See results:
   - Added: 2 items (Spices, Casings)
   - Removed: 1 item (Old Mix)
   - Changed: 3 items (Beef qty, Salt sequence, etc.)
   - Unchanged: 11 items
6. Review changes in detail
7. Click "Close"
8. Approve BOM v1.1 (separate action on main page)

**Time**: ~60 seconds

---

## 3. Design Patterns

### 3.1 Common Elements

**Both modals use**:
- shadcn/ui Dialog component
- Consistent spacing (space-y-4 for form sections)
- Gray background boxes (bg-gray-50) for summary info
- Blue info boxes (bg-blue-50) for help text
- Loading spinners from lucide-react (Loader2, RefreshCw)
- Toast notifications for success/error feedback
- Keyboard shortcuts (Enter to submit, Escape to cancel)

### 3.2 Color Coding (Compare Modal)

| Change Type | Background | Text | Icon |
|-------------|------------|------|------|
| Added | bg-green-50 | text-green-600 | Plus |
| Removed | bg-red-50 | text-red-600 | Minus |
| Changed | bg-yellow-50 | text-yellow-600 | RefreshCw |
| Unchanged | bg-gray-100 | text-gray-600 | - |

### 3.3 Icons Used

| Modal | Icon | Purpose |
|-------|------|---------|
| Clone | Copy | Modal title |
| Clone | Calendar | Date input labels |
| Compare | GitCompare | Modal title, Compare button |
| Compare | ArrowRight | Version transition (v1 → v2) |
| Compare | Plus | Added items section |
| Compare | Minus | Removed items section |
| Compare | RefreshCw | Changed items section, Comparing state |

### 3.4 Typography

| Element | Style |
|---------|-------|
| Modal Title | text-lg font-semibold |
| Description | text-sm text-gray-500 |
| Labels | text-sm font-medium |
| Helper Text | text-xs text-gray-500 |
| Product Codes | font-mono text-sm |
| Change Details | text-sm (yellow-800 for changed) |

---

## 4. Implementation Checklist

### BOMCloneModal
- [x] Component created
- [x] Date validation
- [x] API integration (clone)
- [x] Date overlap error handling
- [x] Success navigation to new BOM
- [x] Loading states
- [x] Info box with clone details
- [x] Version auto-increment display
- [ ] Unit tests
- [ ] E2E tests

### BOMCompareModal
- [x] Component created
- [x] Fetch versions API
- [x] Compare API integration
- [x] Version selection with cross-disable
- [x] Summary section (v1 → v2)
- [x] Stats cards (4 types)
- [x] Added items table
- [x] Removed items table
- [x] Changed items table
- [x] Empty state (< 2 versions)
- [x] No changes message
- [x] Loading states
- [ ] Unit tests
- [ ] E2E tests

---

## 5. Related Documentation

- Main Technical Module UX: `docs/3-ARCHITECTURE/ux/specs/ux-design-technical-module.md`
- Story 2.10: BOM Clone
- Story 2.11: BOM Compare
- Shared UI System: `docs/3-ARCHITECTURE/ux/specs/ux-design-shared-system.md`
- API Documentation: `docs/3-ARCHITECTURE/api/technical-api.md`

---

**Version History**:
- 1.0 (2025-12-07): Initial documentation based on implemented components
