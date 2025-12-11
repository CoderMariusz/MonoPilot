# Story 1.17: Settings Stats Cards

**Epic:** 1 - Foundation & Settings
**Batch:** 1E - Settings UI Redesign
**Status:** ready-for-dev
**Priority:** P1 (Medium)
**Story Points:** 2
**Created:** 2025-11-27
**Effort Estimate:** 0.5 days

---

## Goal

Create compact stats cards for Settings dashboard showing key metrics, matching Planning module design.

---

## User Story

**As an** Administrator
**I want** to see quick statistics on the settings dashboard
**So that** I can understand system configuration at a glance

---

## Problem Statement

Current settings dashboard shows only navigation cards:
- No metrics or statistics visible
- Cannot see how many users, warehouses, etc. exist
- Inconsistent with Planning module's compact cards

---

## Acceptance Criteria

### AC-1.17.1: Compact Stats Cards Component
**Given** I view the settings dashboard (`/settings`)
**When** the page loads
**Then** I see stats cards showing:
- Card 1: Users (Total users, Active users, Pending invitations, Last activity)
- Card 2: Locations (Warehouses count, Locations count, Machines count, Production lines)
- Card 3: Configuration (Allergens count, Tax codes count, Product types, Active modules)
- Card 4: System (Wizard progress %, Last updated, Organization name, Subscription)

### AC-1.17.2: Card Styling
**Given** I view the stats cards
**When** checking the design
**Then**:
- Max height: 120px per card
- 4 metrics per card (2x2 grid inside)
- Compact text (12px labels, 18px values)
- Clickable - links to respective section
- Shadow on hover

### AC-1.17.3: Real-time Data
**Given** the stats cards are displayed
**When** data changes (e.g., user added)
**Then**:
- Stats update on page reload
- No stale data shown
- Loading skeleton while fetching

### AC-1.17.4: Responsive Layout
**Given** I view on different screen sizes
**When** resizing browser
**Then**:
- Desktop: 4 cards in a row
- Tablet: 2 cards per row
- Mobile: 1 card per row (stacked)

---

## Implementation Tasks

- [ ] Create `SettingsStatsCards` component in `/components/settings/SettingsStatsCards.tsx`
- [ ] Create API endpoint `/api/settings/stats` to aggregate all metrics
- [ ] Add stats cards to settings dashboard page
- [ ] Style cards to match PlanningStatsCard component
- [ ] Add loading states and error handling
- [ ] Test responsive behavior

---

## Design Notes

```
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ USERS            │ │ LOCATIONS        │ │ CONFIGURATION    │ │ SYSTEM           │
│ ┌──────┬───────┐ │ │ ┌──────┬───────┐ │ │ ┌──────┬───────┐ │ │ ┌──────┬───────┐ │
│ │Total │Active │ │ │ │WH    │Loc    │ │ │ │Allerg│Tax    │ │ │ │Wizard│Updated│ │
│ │  12  │  10   │ │ │ │  3   │  25   │ │ │ │  14  │  8    │ │ │ │ 80%  │ Today │ │
│ ├──────┼───────┤ │ │ ├──────┼───────┤ │ │ ├──────┼───────┤ │ │ ├──────┼───────┤ │
│ │Pend  │Last   │ │ │ │Mach  │Lines  │ │ │ │Types │Modules│ │ │ │Org   │Plan   │ │
│ │  2   │ 2h ago│ │ │ │  8   │  4    │ │ │ │  4   │  6/8  │ │ │ │Acme  │Pro    │ │
│ └──────┴───────┘ │ │ └──────┴───────┘ │ │ └──────┴───────┘ │ │ └──────┴───────┘ │
└──────────────────┘ └──────────────────┘ └──────────────────┘ └──────────────────┘
     (120px)             (120px)             (120px)             (120px)
```

---

## Files to Modify

```
apps/frontend/
├── components/settings/
│   └── SettingsStatsCards.tsx (NEW)
├── app/api/settings/
│   └── stats/route.ts (NEW)
└── app/(authenticated)/settings/
    └── page.tsx (UPDATE - add stats cards)
```

---

**Status:** Ready for Development
**Next:** Story 1.18
