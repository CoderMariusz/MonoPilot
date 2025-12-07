# Story 2.26: Technical Stats Cards

**Epic:** 2 - Technical Core
**Batch:** 2F - Technical UI Redesign
**Status:** ready-for-dev
**Priority:** P1 (Medium)
**Story Points:** 2
**Created:** 2025-11-27
**Updated:** 2025-11-27
**Effort Estimate:** 0.5 days
**UX Reference:** `docs/ux-design/ux-design-shared-system.md` (Section 1.2)

---

## Goal

Create compact stats cards for Technical dashboard showing key metrics, following Shared UI Design System.

---

## User Story

**As a** Technical User
**I want** to see quick statistics on the technical dashboard
**So that** I can understand product catalog status at a glance

---

## Problem Statement

Current technical dashboard shows grouped products but:
- No quick metrics visible
- Cannot see total counts without scrolling
- Missing BOM/Routing status overview
- Inconsistent with Shared UI Design System

---

## Acceptance Criteria

### AC-2.26.1: Compact Stats Cards (Shared System Spec)
**Given** I view the technical dashboard (`/technical` or `/technical/dashboard`)
**When** the page loads
**Then** I see stats cards with:
- **Max height: 120px per card**
- **2×2 grid layout inside each card** (4 metrics)
- Font: labels 12px (text-xs), values 18px (text-lg font-semibold)
- Icon + Title at top

### AC-2.26.2: Card Content
**Given** I view the stats cards
**When** checking metrics
**Then** I see:

**Card 1: Products**
```
┌──────────────────────────────┐
│ 📦 Products                  │
├──────────┬───────────────────┤
│ Total    │ 156               │
│ Active   │ 142               │
├──────────┼───────────────────┤
│ RAW      │ 45                │
│ FG       │ 67                │
└──────────┴───────────────────┘
```

**Card 2: BOMs**
```
┌──────────────────────────────┐
│ 📋 BOMs                      │
├──────────┬───────────────────┤
│ Total    │ 89                │
│ Active   │ 76                │
├──────────┼───────────────────┤
│ Expiring │ 3                 │
│ Allergen │ 12                │
└──────────┴───────────────────┘
```

**Card 3: Routings**
```
┌──────────────────────────────┐
│ ⚙️ Routings                  │
├──────────┬───────────────────┤
│ Total    │ 45                │
│ With Ops │ 42                │
├──────────┼───────────────────┤
│ Avg Ops  │ 4.2               │
│ Unassign │ 3                 │
└──────────┴───────────────────┘
```

**Card 4: Traceability**
```
┌──────────────────────────────┐
│ 🔍 Traceability              │
├──────────┬───────────────────┤
│ Traced   │ 1.2K              │
│ Records  │ 850               │
├──────────┼───────────────────┤
│ Recent   │ 24                │
│ Recalls  │ 2                 │
└──────────┴───────────────────┘
```

### AC-2.26.3: Clickable Cards
**Given** I view the stats cards
**When** I click a card
**Then**:
- Products card → `/technical/products`
- BOMs card → `/technical/boms`
- Routings card → `/technical/routings`
- Traceability card → `/technical/tracing`
- Hover effect: shadow + slight scale

### AC-2.26.4: Responsive Layout (Shared System)
**Given** I view on different screen sizes
**When** resizing browser
**Then**:
- **Desktop (lg+):** 4 cards in 1 row
- **Tablet (md):** 2 cards per row
- **Mobile (sm):** 1 card per row (stacked)

---

## Implementation Tasks

- [ ] Create `TechnicalStatsCards` component in `/components/technical/TechnicalStatsCards.tsx`
  - Follow Shared System: 120px height, 2×2 grid
  - Clickable with hover effect
- [ ] Create API endpoint `/api/technical/stats` to aggregate metrics
- [ ] Add stats cards to technical dashboard (after header, before tables)
- [ ] Use `app-colors.ts` for consistent styling
- [ ] Add loading states (skeleton)
- [ ] Test responsive behavior

---

## Files to Modify

```
apps/frontend/
├── components/technical/
│   └── TechnicalStatsCards.tsx (NEW)
├── app/api/technical/
│   └── stats/route.ts (NEW)
└── app/(authenticated)/technical/
    └── page.tsx (UPDATE - add stats cards)
```

---

**Status:** Ready for Development
**Next:** Story 2.27
