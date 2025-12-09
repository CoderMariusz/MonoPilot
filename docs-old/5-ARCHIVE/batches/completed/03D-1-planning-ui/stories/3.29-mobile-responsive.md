# Story 3.29: Mobile Responsive Design

**Epic:** 3 - Planning Operations
**Batch:** 3D - Planning UI Redesign
**Status:** ready-for-dev
**Priority:** P1 (High)
**Story Points:** 3
**Created:** 2025-11-27
**Updated:** 2025-11-27
**Effort Estimate:** 1 day
**UX Reference:** `docs/ux-design/ux-design-shared-system.md` (Section 2.4, 4)

---

## Goal

Ensure all Planning pages are fully responsive with card view for mobile without horizontal scrolling.

---

## User Story

**As a** Mobile User
**I want** to view planning pages on my phone without horizontal scrolling
**So that** I can manage orders on the go

---

## Acceptance Criteria

### AC-3.29.1: Card View for Tables (< 768px)
**Given** I view any planning table on mobile
**When** screen width < 768px
**Then**:
- Table automatically converts to card view
- Each row becomes an expandable card
- Card front: Primary column + Status + Key info + ">" expand icon
- Smooth expand/collapse animation (200ms)

**PO Card Example:**
```
┌──────────────────────────────────┐
│ PO-001 │ Draft │ Supplier X │ >  │
├──────────────────────────────────┤ (expanded)
│ Date: 2025-11-27                │
│ Total: €5,000                   │
│ Actions: [View][Edit][Delete]   │
└──────────────────────────────────┘
```

**TO Card Example:**
```
┌──────────────────────────────────┐
│ TO-001 │ Pending │ WH-A→B │ >    │
├──────────────────────────────────┤ (expanded)
│ Date: 2025-11-27                │
│ Items: 15                       │
│ Actions: [View][Edit][Delete]   │
└──────────────────────────────────┘
```

**WO Card Example:**
```
┌──────────────────────────────────┐
│ WO-001 │ Active │ Line 1 │ >     │
├──────────────────────────────────┤ (expanded)
│ Product: Chicken                │
│ Qty: 100, Progress: 75%         │
│ Actions: [View][Edit][Delete]   │
└──────────────────────────────────┘
```

### AC-3.29.2: Mobile Header with Hamburger Menu
**Given** I view planning pages on mobile (< 768px)
**When** page loads
**Then**:
- PlanningHeader collapses to: `[Logo] Planning [☰]`
- Hamburger menu (☰) on right side
- Tap opens full-screen navigation overlay
- Current page highlighted in menu

### AC-3.29.3: Mobile Nav Overlay
**Given** I tap hamburger menu
**When** menu opens
**Then**:
```
┌─────────────────────────────────────┐
│                              ✕      │
│                                     │
│   Planning Dashboard                │
│   ─────────────────                 │
│   Purchase Orders          ●        │
│   Transfer Orders                   │
│   Work Orders                       │
│   Suppliers                         │
│   ─────────────────                 │
│   Settings                          │
│                                     │
└─────────────────────────────────────┘
```
- Current page marked with ●
- Tap item → navigate + close menu
- Tap ✕ or outside → close menu
- Smooth animation (200ms)

### AC-3.29.4: Touch-Friendly Targets (Shared System)
**Given** I use planning on mobile
**When** interacting
**Then**:
- All touch targets **min 48px × 48px**
- **Min 8px spacing** between clickable elements
- Buttons full-width on mobile
- Forms readable and fillable

### AC-3.29.5: No Horizontal Scrolling
**Given** I view any planning page on mobile
**When** scrolling
**Then**:
- All content fits within viewport width
- No horizontal scroll needed
- Vertical scroll only
- Stats cards stack 1 per row

### AC-3.29.6: Responsive Padding
**Given** I view planning pages
**When** checking padding
**Then**:
- Mobile (sm): `px-4 py-4` (16px)
- Tablet (md): `px-6 py-6` (24px)
- Desktop (lg): `px-8 py-6` (32px horizontal)

### AC-3.29.7: Spreadsheet Mode Desktop Only
**Given** I'm on WO page on mobile
**When** checking available views
**Then**:
- Spreadsheet Mode toggle **hidden** on mobile
- Only Table View available (card format)
- Spreadsheet Mode available on desktop (lg+) only

---

## Implementation Tasks

- [ ] Create `useResponsiveView` hook in `/lib/hooks/useResponsiveView.ts`
  - Detects screen size
  - Returns: `{ isMobile, isTablet, isDesktop }`
- [ ] Update all table components (PO, TO, WO)
  - Card view rendering for mobile
  - Expand/collapse animation (CSS transitions)
- [ ] Update `PlanningHeader` for mobile
  - Hamburger menu icon (lg:hidden)
  - Keep logo visible
- [ ] Create `PlanningMobileNav` overlay component
  - Full-screen navigation
  - Active page indicator
  - Close on tap outside
- [ ] Update action buttons (Create buttons)
  - Stack vertically on mobile
  - Full-width buttons
- [ ] Update page layouts for responsive padding
- [ ] Hide Spreadsheet toggle on mobile (WO page)
- [ ] Test on devices:
  - iPhone 12 (390px)
  - iPhone SE (375px)
  - Pixel 6 (412px)
  - iPad (768px)

---

## Responsive Breakpoints (Shared System)

```
sm:  640px   (mobile)      → Card view, hamburger menu, stacked
md:  768px   (tablet)      → Card view, collapsed tabs
lg:  1024px  (desktop)     → Full table, full tabs
xl:  1280px  (large)       → Full table, full tabs
```

---

## Files to Modify

```
apps/frontend/
├── lib/hooks/
│   └── useResponsiveView.ts (NEW)
├── components/planning/
│   ├── PlanningHeader.tsx (UPDATE - hamburger)
│   ├── PlanningMobileNav.tsx (NEW)
│   ├── PurchaseOrdersTable.tsx (UPDATE - card view)
│   ├── WorkOrdersTable.tsx (UPDATE - card view)
│   ├── TransferOrdersTable.tsx (UPDATE - card view)
│   └── PlanningActionButtons.tsx (UPDATE - responsive)
└── app/(authenticated)/planning/
    └── **/*.tsx (UPDATE - responsive padding)
```

---

**Status:** Ready for Development
**Next:** Story 3.30
