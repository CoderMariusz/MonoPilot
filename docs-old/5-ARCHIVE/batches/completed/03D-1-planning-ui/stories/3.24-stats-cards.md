# Story 3.24: Planning Stats Cards

**Epic:** 3 - Planning Operations
**Batch:** 3D - Planning UI Redesign
**Status:** ready-for-dev
**Priority:** P1 (High)
**Story Points:** 2
**Created:** 2025-11-27
**Updated:** 2025-11-27
**Effort Estimate:** 0.5 days
**UX Reference:** `docs/ux-design/ux-design-shared-system.md` (Section 1.2)

---

## Goal

Create compact stats cards (PO, TO, WO) following Shared UI Design System - 120px height, 2×2 grid layout.

---

## User Story

**As a** Planner
**I want** to see stats cards that don't take much space
**So that** I can see more content on the dashboard

---

## Problem Statement

Current stats cards are too tall and inconsistent:
- Cards take too much vertical space
- No standardized layout
- Missing 2×2 grid for metrics
- Inconsistent with Shared UI Design System

---

## Acceptance Criteria

### AC-3.24.1: Compact Stats Card Design (Shared System)
**Given** I view dashboard stats (PO, TO, WO)
**When** checking card size
**Then**:
- Card height: **max 120px**
- **2×2 grid layout** inside each card (4 metrics)
- Font: labels 12px (text-xs), values 18px (text-lg font-semibold)
- Icon + Title at top

### AC-3.24.2: PO Stats Card Content
**Given** I view Purchase Orders card
**When** checking metrics
**Then**:
```
┌──────────────────────────────┐
│ 📋 Purchase Orders           │
├──────────┬───────────────────┤
│ Total    │ 156               │
│ Draft    │ 23                │
├──────────┼───────────────────┤
│ Pending  │ 45                │
│ Confirmed│ 88                │
└──────────┴───────────────────┘
```
- Click → `/planning/purchase-orders`

### AC-3.24.3: TO Stats Card Content
**Given** I view Transfer Orders card
**When** checking metrics
**Then**:
```
┌──────────────────────────────┐
│ 🔄 Transfer Orders           │
├──────────┬───────────────────┤
│ Total    │ 78                │
│ In Transit│ 12               │
├──────────┼───────────────────┤
│ Pending  │ 34                │
│ Completed│ 32                │
└──────────┴───────────────────┘
```
- Click → `/planning/transfer-orders`

### AC-3.24.4: WO Stats Card Content
**Given** I view Work Orders card
**When** checking metrics
**Then**:
```
┌──────────────────────────────┐
│ 🏭 Work Orders               │
├──────────┬───────────────────┤
│ Total    │ 245               │
│ Active   │ 18                │
├──────────┼───────────────────┤
│ Completed│ 156               │
│ Released │ 71                │
└──────────┴───────────────────┘
```
- Click → `/planning/work-orders`

### AC-3.24.5: Responsive Layout (Shared System)
**Given** I view on different screen sizes
**When** resizing browser
**Then**:
- **Desktop (lg+):** 3 cards in 1 row
- **Tablet (md):** 2 cards per row
- **Mobile (sm):** 1 card per row (stacked)

### AC-3.24.6: Hover Effects
**Given** I hover over a stats card
**When** checking interaction
**Then**:
- Shadow increases (shadow-md → shadow-lg)
- Slight scale (scale-[1.02])
- Cursor: pointer

---

## Implementation Tasks

- [ ] Refactor `PlanningStatsCard` component in `/components/planning/PlanningStatsCard.tsx`
  - Follow Shared System: 120px height, 2×2 grid
  - Use `app-colors.ts` (not planning-colors.ts)
  - Clickable with hover effect
- [ ] Create/update API endpoint `/api/planning/stats` to aggregate metrics
- [ ] Update `/planning/page.tsx` dashboard
  - Stats cards after header/action buttons
  - Before Top Cards section
- [ ] Add loading states (skeleton)
- [ ] Test responsive behavior

---

## Files to Modify

```
apps/frontend/
├── components/planning/
│   └── PlanningStatsCard.tsx (REFACTOR)
├── app/api/planning/
│   └── stats/route.ts (NEW/UPDATE)
└── app/(authenticated)/planning/
    └── page.tsx (UPDATE - verify layout)
```

---

**Status:** Ready for Development
**Next:** Story 3.25
