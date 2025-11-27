# Story 3.30: Color Consistency - Shared app-colors.ts

**Epic:** 3 - Planning Operations
**Batch:** 3D - Planning UI Redesign
**Status:** ready-for-dev
**Priority:** P1 (Medium)
**Story Points:** 2
**Created:** 2025-11-27
**Updated:** 2025-11-27
**Effort Estimate:** 0.5 days
**UX Reference:** `docs/ux-design/ux-design-shared-system.md` (Section 2.1)

---

## Goal

Establish and apply **shared** color palette (`app-colors.ts`) across ALL modules (Planning, Technical, Settings, etc.).

---

## User Story

**As a** User
**I want** consistent button and status colors across all modules
**So that** I can quickly understand actions and states everywhere

---

## Acceptance Criteria

### AC-3.30.1: Shared Color Palette (app-colors.ts)
**Given** I review any module components
**When** checking color usage
**Then** I see colors from `app-colors.ts`:

**Button Colors:**
```typescript
PRIMARY (Create/CTA):     green-600   (#16a34a)
SECONDARY (Actions):     gray-600    (#4b5563)
DANGER (Delete):         red-600     (#dc2626)
```

**Status Badge Colors:**
```typescript
Active/Confirmed:     green-200 bg + green-800 text
Pending/Draft:        yellow-200 bg + yellow-800 text
Inactive/Archived:    gray-200 bg + gray-800 text
Error/Cancelled:      red-200 bg + red-800 text
In Transit (TO only): blue-200 bg + blue-800 text
```

**Neutral Colors:**
```typescript
Background:           white / gray-50
Surface:              white
Border:               gray-200
Text Primary:         gray-900
Text Secondary:       gray-600
Text Muted:           gray-500
```

### AC-3.30.2: Rename planning-colors.ts → app-colors.ts
**Given** existing `planning-colors.ts` file
**When** refactoring
**Then**:
- Rename to `app-colors.ts` in `/lib/constants/`
- Update all imports across Planning module
- Export for use in Technical, Settings, and future modules

### AC-3.30.3: Apply to All Planning Pages
**Given** I navigate planning pages
**When** checking buttons
**Then**:
- All "Create" buttons: `green-600`
- All "Edit/View" buttons: `gray-600`
- All "Delete" buttons: `red-600`
- Status badges: consistent color mapping
- Settings button: outline style

### AC-3.30.4: Apply to Technical Module
**Given** I navigate technical pages
**When** checking buttons
**Then**:
- Same colors as Planning
- Uses `app-colors.ts`

### AC-3.30.5: Tailwind Only - No Hardcoded Colors
**Given** I review component CSS
**When** checking classes
**Then**:
- All colors use Tailwind tokens
- No inline style color overrides
- No hex values in components

### AC-3.30.6: Dark Mode Support (Future-Ready)
**Given** `app-colors.ts` structure
**When** checking implementation
**Then**:
- Colors have light + dark variants defined
- Uses `dark:` prefix for dark mode classes
- Ready for dark mode toggle (Settings)

---

## Implementation Tasks

- [ ] Rename `/lib/constants/planning-colors.ts` → `/lib/constants/app-colors.ts`
- [ ] Update exports in `app-colors.ts`:
```typescript
// lib/constants/app-colors.ts
export const APP_COLORS = {
  // Buttons
  button: {
    primary: 'bg-green-600 hover:bg-green-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    outline: 'border border-gray-300 hover:bg-gray-100 text-gray-700',
  },

  // Status badges
  status: {
    active: 'bg-green-200 text-green-800',
    confirmed: 'bg-green-200 text-green-800',
    pending: 'bg-yellow-200 text-yellow-800',
    draft: 'bg-yellow-200 text-yellow-800',
    inactive: 'bg-gray-200 text-gray-800',
    archived: 'bg-gray-200 text-gray-800',
    cancelled: 'bg-red-200 text-red-800',
    error: 'bg-red-200 text-red-800',
    inTransit: 'bg-blue-200 text-blue-800',
    completed: 'bg-green-200 text-green-800',
    released: 'bg-yellow-200 text-yellow-800',
  },

  // Text
  text: {
    primary: 'text-gray-900 dark:text-gray-50',
    secondary: 'text-gray-600 dark:text-gray-400',
    muted: 'text-gray-500 dark:text-gray-500',
  },
}

export function getStatusColor(status: string): string {
  const normalized = status.toLowerCase().replace(/[^a-z]/g, '')
  return APP_COLORS.status[normalized] || APP_COLORS.status.inactive
}
```
- [ ] Update all Planning components to import from `app-colors.ts`
- [ ] Update all Technical components to import from `app-colors.ts`
- [ ] Audit existing components for hardcoded colors
- [ ] Test visual consistency across all pages

---

## Files to Modify

```
apps/frontend/
├── lib/constants/
│   ├── planning-colors.ts (DELETE)
│   └── app-colors.ts (NEW - shared)
├── components/planning/
│   ├── PlanningStatsCard.tsx (UPDATE imports)
│   ├── TopPOCards.tsx (UPDATE imports)
│   ├── TopWOCards.tsx (UPDATE imports)
│   ├── TopTOCards.tsx (UPDATE imports)
│   ├── PurchaseOrdersTable.tsx (UPDATE imports)
│   ├── WorkOrdersTable.tsx (UPDATE imports)
│   ├── TransferOrdersTable.tsx (UPDATE imports)
│   ├── PlanningHeader.tsx (UPDATE imports)
│   └── PlanningActionButtons.tsx (UPDATE imports)
├── components/technical/
│   ├── TechnicalStatsCards.tsx (UPDATE imports)
│   ├── ProductsTable.tsx (UPDATE imports)
│   ├── BOMsTable.tsx (UPDATE imports)
│   └── RoutingsTable.tsx (UPDATE imports)
└── app/(authenticated)/
    └── **/*.tsx (AUDIT for hardcoded colors)
```

---

**Status:** Ready for Development
**Next:** Implementation Complete - Batch 3D Done
