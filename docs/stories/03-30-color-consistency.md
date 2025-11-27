# Story 3.30: Color Consistency - Button & Component Colors

**Epic:** 3 - Planning Operations
**Batch:** 3D - Planning UI Redesign
**Status:** todo
**Priority:** P1 (Medium)
**Story Points:** 2
**Created:** 2025-11-27
**Effort Estimate:** 0.5 days

---

## Goal

Establish and apply consistent color palette across all planning module components.

---

## User Story

**As a** Planner
**I want** consistent button and status colors across planning module
**So that** I can quickly understand actions and states

---

## Acceptance Criteria

### AC-3.30.1: Standard Color Palette for Planning
**Given** I review planning module components
**When** checking color usage
**Then** I see standard palette:
- **Primary (Create CTA)**: Green-600 (bg-green-600) for all "Create" buttons
- **Secondary (Actions)**: Gray-600 (bg-gray-600) for "View", "Edit" actions
- **Danger (Delete)**: Red-600 (bg-red-600) for destructive actions
- **Status Badges**:
  - Draft: Gray-200 (bg-gray-200 text-gray-800)
  - Pending: Yellow-200 (bg-yellow-200 text-yellow-800)
  - Confirmed/Active: Green-200 (bg-green-200 text-green-800)
  - Cancelled/Closed: Red-200 (bg-red-200 text-red-800)

### AC-3.30.2: Apply to All Planning Pages
**Given** I navigate planning pages
**When** checking buttons
**Then** all pages use consistent colors:
- All "Create" buttons: green-600
- All "Edit/View" buttons: gray-600
- All "Delete" buttons: red-600
- Status badges: consistent color mapping
- Settings button: outline style

### AC-3.30.3: Tailwind Color Consistency
**Given** I review component CSS
**When** checking classes
**Then**:
- No hardcoded colors (use Tailwind classes)
- All buttons use consistent Tailwind tokens
- Status badges use badge classes consistently
- No inline style color overrides

### AC-3.30.4: No shadcn Color Override
**Given** shadcn Button component is used
**When** checking styling
**Then**:
- Button variants use standard colors
- No custom inline styles
- shadcn theme aligns with planning color palette

---

## Implementation Tasks

- [ ] Create color reference document `/lib/constants/planning-colors.ts`
  - Export color constants/mapping for Planning module
  - Color palette definition
  - Status badge colors
- [ ] Update all Create buttons across planning
  - `/planning/page.tsx` - Create buttons (PO, TO, WO)
  - `/planning/purchase-orders/page.tsx` - Create PO
  - `/planning/transfer-orders/page.tsx` - Create TO
  - `/planning/work-orders/page.tsx` - Create WO
  - Use green-600 exclusively
- [ ] Update all action buttons
  - "Edit/View" buttons: gray-600
  - "Delete" buttons: red-600
  - Across all pages/tables
- [ ] Update all status badges
  - Create badge color mapping function
  - Apply consistently (Draft → Gray, Pending → Yellow, etc.)
  - All tables/cards
- [ ] Audit existing components for hardcoded colors
  - Find all color overrides (blue-100, green-100, etc.)
  - Replace with standard colors
  - PlanningStatsCard, TopCards, Tables, etc.
- [ ] Test across all planning pages
  - Visual consistency check
  - No color regression

---

## Implementation Reference

```typescript
// lib/constants/planning-colors.ts
export const PLANNING_COLORS = {
  // Button colors
  primary: 'bg-green-600 hover:bg-green-700',
  secondary: 'bg-gray-600 hover:bg-gray-700',
  danger: 'bg-red-600 hover:bg-red-700',
  
  // Status badge colors
  draft: { bg: 'bg-gray-200', text: 'text-gray-800' },
  pending: { bg: 'bg-yellow-200', text: 'text-yellow-800' },
  confirmed: { bg: 'bg-green-200', text: 'text-green-800' },
  active: { bg: 'bg-green-200', text: 'text-green-800' },
  completed: { bg: 'bg-blue-200', text: 'text-blue-800' },
  cancelled: { bg: 'bg-red-200', text: 'text-red-800' },
}

// Usage:
<Button className={PLANNING_COLORS.primary}>Create PO</Button>
<Badge className={`${PLANNING_COLORS.draft.bg} ${PLANNING_COLORS.draft.text}`}>Draft</Badge>
```

---

## Files to Modify

```
apps/frontend/
├── lib/
│   └── constants/
│       └── planning-colors.ts (NEW)
├── components/planning/
│   ├── PlanningStatsCard.tsx (UPDATE - colors)
│   ├── TopPOCards.tsx (UPDATE - colors)
│   ├── TopWOCards.tsx (UPDATE - colors)
│   ├── TopTOCards.tsx (UPDATE - colors)
│   ├── PurchaseOrdersTable.tsx (UPDATE - colors)
│   ├── WorkOrdersTable.tsx (UPDATE - colors)
│   ├── TransferOrdersTable.tsx (UPDATE - colors)
│   ├── PlanningHeader.tsx (UPDATE - colors)
│   └── PlanningActionButtons.tsx (UPDATE - colors)
└── app/(authenticated)/planning/
    └── **/*.tsx (AUDIT - check for hardcoded colors)
```

---

**Status:** Ready for Development
**Next:** Implementation Complete
