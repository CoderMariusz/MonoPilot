# Story 2.28: Technical Mobile Responsive

**Epic:** 2 - Technical Core
**Batch:** 2F - Technical UI Redesign
**Status:** ready-for-dev
**Priority:** P1 (High)
**Story Points:** 3
**Created:** 2025-11-27
**Updated:** 2025-11-27
**Effort Estimate:** 1 day
**UX Reference:** `docs/ux-design/ux-design-shared-system.md` (Section 2.4, 4)

---

## Goal

Make all Technical pages fully responsive for mobile devices, following Shared UI Design System.

---

## User Story

**As a** Mobile Technical User
**I want** to access technical data on my phone without horizontal scrolling
**So that** I can review products, BOMs, and routings on the go

---

## Problem Statement

Technical pages are not optimized for mobile:
- Products table overflows horizontally
- BOM details page requires scrolling
- Header navigation doesn't collapse
- Touch targets too small for mobile

---

## Acceptance Criteria

### AC-2.28.1: Mobile Header with Hamburger Menu
**Given** I view technical pages on mobile (<768px)
**When** the page loads
**Then**:
- TechnicalHeader collapses to: `[Logo] Technical [☰]`
- Hamburger menu (☰) on right side
- Tap opens full-screen navigation overlay
- Current page highlighted in menu
- Smooth animation (200ms)

### AC-2.28.2: Table to Card View Conversion (< 768px)
**Given** I view a technical table on mobile
**When** screen width is <768px
**Then**:
- Table converts to **expandable card view**
- Card front shows: Primary column + Status badge + ">" expand icon
- Tap to expand shows all fields
- Actions visible on expanded card
- Smooth expand animation (200ms)

**Products Card:**
```
┌──────────────────────────────────┐
│ SKU-001        🟤RAW  🟢Active  > │
│ Flour Wheat                      │
├──────────────────────────────────┤ (expanded)
│ Allergens: 🌾Gluten              │
│ Category: Ingredients            │
│ [View] [Edit] [Delete]           │
└──────────────────────────────────┘
```

**BOMs Card:**
```
┌──────────────────────────────────┐
│ BOM-001        v2.0  🟢Active  > │
│ Cookie Dough                     │
├──────────────────────────────────┤ (expanded)
│ Items: 8                         │
│ Effective: 2025-01-01            │
│ Allergens: 🌾🥛🥜                │
│ [View] [Edit] [Clone] [Delete]   │
└──────────────────────────────────┘
```

### AC-2.28.3: Touch-Friendly Targets (Shared System)
**Given** I interact with technical pages on mobile
**When** tapping buttons/links
**Then**:
- All touch targets **min 48px × 48px**
- **Min 8px spacing** between clickable elements
- Buttons full-width on mobile forms
- No hover-only content

### AC-2.28.4: No Horizontal Scroll
**Given** I view any technical page on mobile
**When** checking layout
**Then**:
- No horizontal scrollbar appears
- All content fits within viewport
- Stats cards stack vertically (1 per row)
- BOM items list scrollable vertically

### AC-2.28.5: Mobile Nav Overlay
**Given** I tap hamburger menu on mobile
**When** menu opens
**Then**:
```
┌─────────────────────────────────────┐
│                              ✕      │
│                                     │
│   Technical Dashboard               │
│   ─────────────────                 │
│   Products                 ●        │
│   BOMs                              │
│   Routings                          │
│   Tracing                           │
│   ─────────────────                 │
│   Settings                          │
│                                     │
└─────────────────────────────────────┘
```
- Current page marked with ●
- Tap item → navigate + close menu
- Tap ✕ or outside → close menu

---

## Implementation Tasks

- [ ] Add hamburger menu to TechnicalHeader (mobile only)
- [ ] Create `TechnicalMobileNav` overlay component
- [ ] Reuse `useResponsiveView` hook from Planning
- [ ] Update Products table with card view for mobile
- [ ] Update BOMs table with card view for mobile
- [ ] Update Routings table with card view for mobile
- [ ] Make BOM detail page responsive (stack layout)
- [ ] Make Routing detail page responsive
- [ ] Ensure 48px touch targets
- [ ] Test on mobile devices (iPhone, Android)

---

## Responsive Breakpoints (Shared System)

```
sm:  640px   (mobile)      → Card view, hamburger menu
md:  768px   (tablet)      → Card view, collapsed tabs
lg:  1024px  (desktop)     → Full table, full tabs
xl:  1280px  (large)       → Full table, full tabs
```

---

## Files to Modify

```
apps/frontend/
├── components/technical/
│   ├── TechnicalHeader.tsx (UPDATE - hamburger menu)
│   ├── TechnicalMobileNav.tsx (NEW)
│   ├── ProductsTable.tsx (UPDATE - card view)
│   ├── BOMsTable.tsx (UPDATE - card view)
│   └── RoutingsTable.tsx (UPDATE - card view)
├── lib/hooks/
│   └── useResponsiveView.ts (REUSE from planning)
└── app/(authenticated)/technical/
    ├── products/page.tsx (UPDATE)
    ├── products/[id]/page.tsx (UPDATE)
    ├── boms/page.tsx (UPDATE)
    ├── boms/[id]/page.tsx (UPDATE)
    ├── routings/page.tsx (UPDATE)
    └── routings/[id]/page.tsx (UPDATE)
```

---

**Status:** Ready for Development
**Next:** Implementation of Batch 1E and 2F
