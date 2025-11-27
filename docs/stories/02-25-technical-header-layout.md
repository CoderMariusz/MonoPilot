# Story 2.25: Technical Header Layout

**Epic:** 2 - Technical Core
**Batch:** 2F - Technical UI Redesign
**Status:** ready-for-dev
**Priority:** P1 (High)
**Story Points:** 3
**Created:** 2025-11-27
**Updated:** 2025-11-27
**Effort Estimate:** 0.5 days
**UX Reference:** `docs/ux-design/ux-design-shared-system.md`

---

## Goal

Create reusable header component with consistent navigation for all Technical module pages, following Shared UI Design System.

---

## User Story

**As a** Technical User
**I want** to see consistent header navigation across all technical pages
**So that** I can navigate easily between Products, BOMs, Routings, and Tracing

---

## Problem Statement

Technical pages have inconsistent headers:
- Dashboard has custom layout with **duplicate navigation** (header nav + separate nav section)
- Products, BOMs, Routings pages lack unified header
- No quick navigation between technical sections
- Inconsistent with Shared UI Design System

**KEY FIX:** Remove duplicate navigation - header contains tabs, NO second navigation below.

---

## Acceptance Criteria

### AC-2.25.1: Reusable TechnicalHeader Component
**Given** I view any technical page (dashboard, products, boms, routings, tracing)
**When** the page loads
**Then** I see:
- Logo/App name "MonoPilot" (left)
- Navigation tabs: "Technical | Products | BOMs | Routings | Tracing | ⚙️" (center)
- Settings button (⚙️) on right side
- Header height: **60px** (compact)
- **NO duplicate navigation below header** - only action buttons row

### AC-2.25.2: Navigation Tab Styling (Shared System)
**Given** I'm on a technical page
**When** I check the navigation tabs
**Then**:
- Active tab has **underline border** (border-green-600)
- Inactive tabs: text-gray-600, hover:text-gray-900
- Font size: **14px** (text-sm)
- Tabs are clickable links
- Settings button (⚙️) links to /settings/product-types

### AC-2.25.3: Action Buttons Row (Below Header)
**Given** I view technical pages
**When** checking button placement
**Then**:
- Buttons appear in **separate row below header** (40px height)
- Create buttons: [Create Product] [Create BOM] [Create Routing]
- All buttons use **green-600** color
- Flex-wrapped for responsive layout
- **NO navigation tabs in this row** - only action buttons

### AC-2.25.4: Header Applied to All Pages
**Given** Technical module pages
**When** checking implementation
**Then** header is used on:
- `/technical` (dashboard)
- `/technical/products`
- `/technical/products/[id]`
- `/technical/products/allergens`
- `/technical/boms`
- `/technical/boms/[id]`
- `/technical/routings`
- `/technical/routings/[id]`
- `/technical/tracing`

### AC-2.25.5: Remove Duplicate Navigation
**Given** current Technical dashboard
**When** refactoring
**Then**:
- Remove secondary navigation section (the one with same tabs as header)
- Keep ONLY header navigation
- Main content starts directly after action buttons row

---

## Implementation Tasks

- [ ] Create `TechnicalHeader` component in `/components/technical/TechnicalHeader.tsx`
  - Props: `currentPage: 'dashboard' | 'products' | 'boms' | 'routings' | 'tracing'`
  - Use Shared System styling (60px height, underline tabs)
  - NO duplicate navigation
- [ ] Create `TechnicalActionButtons` component for Create buttons
  - 40px row height
  - green-600 buttons only
- [ ] **REMOVE** duplicate navigation from `technical/page.tsx` (dashboard)
- [ ] Update all technical pages to use new header
- [ ] Add consistent padding: `px-6 py-6` (from Shared System)
- [ ] Test responsive behavior on mobile/tablet

---

## Design Notes (from Shared System)

```
┌─────────────────────────────────────────────────────────────────┐
│ MonoPilot   Technical│Products│BOMs│Routings│Tracing│    ⚙️    │  (60px)
│                           ─────── (active underline)            │
├─────────────────────────────────────────────────────────────────┤
│ [Create Product]  [Create BOM]  [Create Routing]                │  (40px)
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Main Content - Stats Cards, Tables, etc]                     │
│  NO DUPLICATE NAVIGATION HERE                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Files to Modify

```
apps/frontend/
├── components/technical/
│   ├── TechnicalHeader.tsx (NEW - following Shared System)
│   └── TechnicalActionButtons.tsx (NEW)
└── app/(authenticated)/technical/
    ├── page.tsx (UPDATE - REMOVE duplicate nav)
    ├── products/page.tsx (UPDATE)
    ├── boms/page.tsx (UPDATE)
    ├── routings/page.tsx (UPDATE)
    └── tracing/page.tsx (UPDATE)
```

---

**Status:** Ready for Development
**Implementation:** Cross-module with Story 1.16 (SettingsHeader) - implement together
**Next:** Story 2.26
