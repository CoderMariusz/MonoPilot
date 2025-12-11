# Story 3.23: Planning Header Layout

**Epic:** 3 - Planning Operations
**Batch:** 3D - Planning UI Redesign
**Status:** ready-for-dev
**Priority:** P1 (High)
**Story Points:** 3
**Created:** 2025-11-27
**Updated:** 2025-11-27
**Effort Estimate:** 0.5 days
**UX Reference:** `docs/ux-design/ux-design-shared-system.md`

---

## Goal

Create reusable header component with consistent navigation for all Planning pages, following Shared UI Design System.

---

## User Story

**As a** Planner
**I want** to see consistent header navigation across all planning pages
**So that** I can navigate easily and have more space for content

---

## Problem Statement

Planning pages have inconsistent headers:
- Dashboard has custom header with tabs
- **DUPLICATE NAVIGATION** - header has tabs AND there's another nav section below with same tabs
- No unified navigation structure
- Takes too much vertical space

**KEY FIX:** Remove duplicate navigation - header contains tabs, NO second navigation below.

---

## Acceptance Criteria

### AC-3.23.1: Reusable PlanningHeader Component
**Given** I view any planning page (dashboard, PO, TO, WO, suppliers)
**When** the page loads
**Then** I see:
- Logo/App name "MonoPilot" (left)
- Navigation tabs: "Planning | PO | TO | WO | Suppliers | ⚙️" (center)
- Settings button (⚙️) on right side
- Header height: **60px** (compact)
- **NO duplicate navigation below header** - only action buttons row

### AC-3.23.2: Navigation Tab Styling (Shared System)
**Given** I'm on a planning page
**When** I check the navigation tabs
**Then**:
- Active tab has **underline border** (border-green-600)
- Inactive tabs: text-gray-600, hover:text-gray-900
- Font size: **14px** (text-sm)
- Tabs are clickable links
- Settings button (⚙️) styled as outline, links to /settings

### AC-3.23.3: Action Buttons Row (Below Header)
**Given** I view planning pages
**When** checking button placement
**Then**:
- Buttons appear in **separate row below header** (40px height)
- Create buttons: [Create PO] [Create TO] [Create WO]
- All buttons use **green-600** color
- Flex-wrapped for responsive layout
- **NO navigation tabs in this row** - only action buttons

### AC-3.23.4: Header Applied to All Pages
**Given** Planning module pages
**When** checking implementation
**Then** header is used on:
- `/planning` (dashboard)
- `/planning/purchase-orders`
- `/planning/purchase-orders/[id]`
- `/planning/transfer-orders`
- `/planning/transfer-orders/[id]`
- `/planning/work-orders`
- `/planning/work-orders/[id]`
- `/planning/suppliers`

### AC-3.23.5: Remove Duplicate Navigation
**Given** current Planning dashboard
**When** refactoring
**Then**:
- Remove secondary navigation section (the one with same tabs as header)
- Keep ONLY header navigation
- Main content starts directly after action buttons row

---

## Implementation Tasks

- [ ] Create `PlanningHeader` component in `/components/planning/PlanningHeader.tsx`
  - Props: `currentPage: 'dashboard' | 'po' | 'to' | 'wo' | 'suppliers'`
  - Use Shared System styling (60px height, underline tabs)
  - NO duplicate navigation
- [ ] Create `PlanningActionButtons` component for Create buttons
  - 40px row height
  - green-600 buttons only
- [ ] **REMOVE** duplicate navigation from `planning/page.tsx` (dashboard)
- [ ] Update all planning pages to use new header
- [ ] Add consistent padding: `px-6 py-6` (from Shared System)
- [ ] Test responsive behavior on mobile/tablet

---

## Design Notes (from Shared System)

```
┌─────────────────────────────────────────────────────────────────┐
│ MonoPilot   Planning│PO│TO│WO│Suppliers│              ⚙️        │  (60px)
│                        ─── (active underline)                   │
├─────────────────────────────────────────────────────────────────┤
│ [Create PO]  [Create TO]  [Create WO]                           │  (40px)
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Main Content - Stats Cards, Top Cards, Tables]               │
│  NO DUPLICATE NAVIGATION HERE                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Files to Modify

```
apps/frontend/
├── components/planning/
│   ├── PlanningHeader.tsx (NEW/UPDATE - following Shared System)
│   └── PlanningActionButtons.tsx (NEW/UPDATE)
└── app/(authenticated)/planning/
    ├── page.tsx (UPDATE - REMOVE duplicate nav)
    ├── purchase-orders/page.tsx (UPDATE)
    ├── transfer-orders/page.tsx (UPDATE)
    ├── work-orders/page.tsx (UPDATE)
    └── suppliers/page.tsx (UPDATE)
```

---

**Status:** Ready for Development
**Next:** Story 3.24
