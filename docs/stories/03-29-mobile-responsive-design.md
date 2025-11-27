# Story 3.29: Mobile Responsive Design

**Epic:** 3 - Planning Operations
**Batch:** 3D - Planning UI Redesign
**Status:** ready-for-dev
**Priority:** P1 (High)
**Story Points:** 3
**Created:** 2025-11-27
**Effort Estimate:** 1 day

---

## Goal

Ensure all planning pages are fully responsive with card view for mobile without horizontal scrolling.

---

## User Story

**As a** Mobile User
**I want** to view planning pages on my phone without horizontal scrolling
**So that** I can manage orders on the go

---

## Acceptance Criteria

### AC-3.29.1: Card View for Tables (SM breakpoint)
**Given** I view any planning table on mobile (screen < 768px)
**When** page loads
**Then**:
- Table automatically converts to card view
- Each row becomes an expandable card
- Minimal info on card front: "PO-XXXX | Status | Supplier" (example)
- ">" or "Expand" button to see details
- Smooth animation on expand/collapse

### AC-3.29.2: Expandable Details
**Given** I'm viewing a card on mobile
**When** I click expand
**Then**:
- Card expands to show all columns
- All info visible without horizontal scroll
- Smooth animation
- Can collapse back to minimal view

### AC-3.29.3: Header Responsive
**Given** I view header on mobile
**When** screen size < md (768px)
**Then**:
- Navigation tabs stack vertically OR collapse to dropdown
- Logo/app name visible
- Height still compact (~60px or less)
- Buttons remain accessible

### AC-3.29.4: No Horizontal Scrolling
**Given** I view any planning page on mobile
**When** scrolling
**Then**:
- All content fits within viewport width
- No horizontal scroll needed
- Vertical scroll only

### AC-3.29.5: Touch-Friendly
**Given** I use planning on mobile
**When** interacting
**Then**:
- Buttons are large enough (min 44px height for tap targets)
- Spacing between clickable elements (min 8px)
- No hover states that don't work on touch
- Forms readable and easily fillable

---

## Implementation Tasks

- [ ] Create utility function `useResponsiveView()` for responsive card/table switching
- [ ] Update all table components (PO, TO, WO)
  - Implement card view rendering for SM breakpoint (< 768px)
  - Smooth expand/collapse animation
  - CSS transitions, no janky layout shifts
- [ ] Update PlanningHeader for mobile
  - Consider hamburger menu for nav tabs OR stack vertically
  - Keep logo visible
  - Ensure touch-friendly
- [ ] Update action buttons (Create buttons)
  - Stack vertically on mobile if needed
  - Maintain 44px+ height for touch
- [ ] Update all page layouts (px-6 py-6)
  - Responsive padding adjustments (px-4 on mobile, px-6 on desktop)
- [ ] Test on multiple devices:
  - iPhone 12 (390px, portrait/landscape)
  - iPhone SE (375px)
  - Pixel 6 (412px)
  - iPad (768px)
  - Generic Android (360px+)
- [ ] Verify no horizontal scrolling on any screen size

---

## Design Notes

```
Desktop (≥768px):
┌────────────────────────────────────────┐
│ Table with all columns                 │
└────────────────────────────────────────┘

Mobile (<768px) - Collapsed:
┌──────────────────────────────────────┐
│ PO-20251127 │ Supplier X │ Draft │ > │
├──────────────────────────────────────┤
│ [Click to expand]                    │
└──────────────────────────────────────┘

Mobile - Expanded:
┌──────────────────────────────────────┐
│ PO-20251127                          │
│ Status: Draft                        │
│ Supplier: Supplier X                 │
│ Date: 2025-11-27                     │
│ Total: €5,000                        │
│ Actions: [View] [Edit] [Delete]      │
│                                      │ ^
│                                (collapse)
└──────────────────────────────────────┘
```

---

## Files to Modify

```
apps/frontend/
├── lib/
│   └── hooks/useResponsiveView.ts (NEW - utility)
├── components/planning/
│   ├── PurchaseOrdersTable.tsx (ENHANCE - mobile view)
│   ├── WorkOrdersTable.tsx (ENHANCE - mobile view)
│   ├── TransferOrdersTable.tsx (ENHANCE - mobile view)
│   ├── PlanningHeader.tsx (ENHANCE - mobile header)
│   └── PlanningActionButtons.tsx (ENHANCE - responsive)
└── app/(authenticated)/planning/
    └── **/*.tsx (VERIFY - responsive padding)
```

---

**Status:** Ready for Development
**Next:** Story 3.30
