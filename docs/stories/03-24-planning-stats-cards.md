# Story 3.24: Kompaktne Stats Cards

**Epic:** 3 - Planning Operations
**Batch:** 3D - Planning UI Redesign
**Status:** todo
**Priority:** P1 (High)
**Story Points:** 2
**Created:** 2025-11-27
**Effort Estimate:** 0.5 days

---

## Goal

Refactor stats cards (PO, TO, WO) to be compact and lightweight, not taking excessive space.

---

## User Story

**As a** Planner
**I want** to see stats cards that don't take much space
**So that** I can see more content on the dashboard

---

## Acceptance Criteria

### AC-3.24.1: Compact Stats Card Design
**Given** I view dashboard stats (PO, TO, WO)
**When** checking card size
**Then**:
- Card height: max 120px (currently too tall)
- Card contains: icon + label + 2-3 key metrics
- No large padding, tight spacing
- Font sizes: title 14px, numbers 16px, labels 12px

### AC-3.24.2: Stats Content Reduction
**Given** I view a stats card
**When** checking displayed info
**Then** card shows only:
- **PO Card**: Total | Draft | Pending Approval | Confirmed
- **TO Card**: Total | In Transit | Pending | Completed
- **WO Card**: Total | Active | Completed Today | Released

### AC-3.24.3: Grid Layout
**Given** I view stats on desktop
**When** checking layout
**Then**:
- 3 columns on desktop (lg breakpoint)
- 1 column on mobile (responsive)
- Gap between cards: 16px

### AC-3.24.4: No shadcn Overhead
**Given** Stats card is rendered
**When** inspecting CSS
**Then**:
- Use Tailwind classes directly
- Remove unnecessary padding/margins from shadcn components
- Minimal use of shadcn Card (or custom lightweight card)

---

## Implementation Tasks

- [ ] Refactor `PlanningStatsCard` component in `/components/planning/PlanningStatsCard.tsx`
  - Reduce height from ~200px to ~120px
  - Simplify content (remove extra stats)
  - Use lightweight Tailwind styling only
  - Reduce padding to minimal (px-4 py-3)
- [ ] Update stats display on `/planning/page.tsx`
- [ ] Test layout on different breakpoints (mobile, tablet, desktop)
- [ ] Verify no visual regression in other uses of stats card

---

## Files to Modify

```
apps/frontend/
├── components/planning/
│   └── PlanningStatsCard.tsx (REFACTOR)
└── app/(authenticated)/planning/
    └── page.tsx (UPDATE - verify layout)
```

---

**Status:** Ready for Development
**Next:** Story 3.25
