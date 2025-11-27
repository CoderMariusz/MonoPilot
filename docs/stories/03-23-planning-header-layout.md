# Story 3.23: Standardowy Header Layout dla Planning

**Epic:** 3 - Planning Operations
**Batch:** 3D - Planning UI Redesign
**Status:** ready-for-dev
**Priority:** P1 (High)
**Story Points:** 3
**Created:** 2025-11-27
**Effort Estimate:** 0.5 days

---

## Goal

Create reusable header component with consistent navigation for all planning pages.

---

## User Story

**As a** Planner
**I want** to see consistent header navigation across all planning pages
**So that** I can navigate easily and have more space for content

---

## Problem Statement

Planning pages have inconsistent headers:
- Dashboard has custom header with tabs
- Other pages lack consistent header
- No unified navigation structure
- Takes too much vertical space

---

## Acceptance Criteria

### AC-3.23.1: Reusable PlanningHeader Component
**Given** I view any planning page (dashboard, PO, TO, WO, suppliers)
**When** the page loads
**Then** I see:
- Logo/App name (left)
- Navigation tabs: "Planning | PO | TO | WO | Suppliers | ⚙️" (center)
- Header height: max 60px (compact)
- Consistent styling across all pages

### AC-3.23.2: Navigation Tab Styling
**Given** I'm on a planning page
**When** I check the navigation tabs
**Then**:
- Active tab highlighted (bottom border or bg color)
- All tabs use consistent font size (14px)
- Tabs are clickable links
- Settings button (⚙️) styled as outline button

### AC-3.23.3: Create Action Buttons
**Given** I view planning pages
**When** checking button placement
**Then**:
- Buttons appear BELOW header in their own row
- Create buttons: PO, TO, WO (green, consistent color)
- Settings link also available (outline style)
- Buttons are flex-wrapped for responsive layout

### AC-3.23.4: Header Applied to All Pages
**Given** Planning module pages
**When** checking implementation
**Then** header is used on:
- `/planning` (dashboard)
- `/planning/purchase-orders`
- `/planning/transfer-orders`
- `/planning/work-orders`
- `/planning/suppliers`
- `/planning/[resource]/[id]` (detail pages)

---

## Implementation Tasks

- [ ] Create `PlanningHeader` component in `/components/planning/PlanningHeader.tsx`
  - Props: `currentPage: 'dashboard' | 'po' | 'to' | 'wo' | 'suppliers'`
  - Render navigation tabs with active state
  - Compact styling (60px max height)
- [ ] Create `PlanningActionButtons` component for Create buttons
- [ ] Update `planning/page.tsx` (dashboard) to use new header
- [ ] Update `planning/purchase-orders/page.tsx` to use new header
- [ ] Update `planning/transfer-orders/page.tsx` to use new header
- [ ] Update `planning/work-orders/page.tsx` to use new header
- [ ] Update `planning/suppliers/page.tsx` to use new header
- [ ] Add padding to all planning pages: `px-6 py-6` (consistent with header)
- [ ] Test responsive behavior on mobile/tablet

---

## Design Notes

```
┌─────────────────────────────────────────────────────┐
│ Logo     Planning│PO│TO│WO│Suppliers│⚙️            │  (60px height)
├─────────────────────────────────────────────────────┤
│ [Create PO]  [Create TO]  [Create WO]              │  (40px height)
├─────────────────────────────────────────────────────┤
│                                                     │
│  [Main Content - Tables, Stats, etc]              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Files to Modify

```
apps/frontend/
├── components/planning/
│   ├── PlanningHeader.tsx (NEW)
│   └── PlanningActionButtons.tsx (NEW)
└── app/(authenticated)/planning/
    ├── page.tsx (UPDATE)
    ├── purchase-orders/page.tsx (UPDATE)
    ├── transfer-orders/page.tsx (UPDATE)
    └── work-orders/page.tsx (UPDATE)
```

---

**Status:** Ready for Development
**Next:** Story 3.24
