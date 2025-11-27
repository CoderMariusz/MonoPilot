# Story 3.25: Purchase Orders Dashboard View

**Epic:** 3 - Planning Operations
**Batch:** 3D - Planning UI Redesign
**Status:** todo
**Priority:** P1 (High)
**Story Points:** 3
**Created:** 2025-11-27
**Effort Estimate:** 1 day

---

## Goal

Create compact top PO cards and refactor PO table view with filtering and sorting.

---

## User Story

**As a** Planner
**I want** to see recent POs in compact cards, then a full table of all POs
**So that** I can quickly see recent activity and find specific orders

---

## Acceptance Criteria

### AC-3.25.1: Top 3 PO Cards
**Given** I view `/planning` dashboard
**When** page loads
**Then** I see:
- "Recent Purchase Orders" section (below stats)
- 3 most recent POs displayed as compact cards (max 80px height each)
- Each card shows: PO #, Supplier, Date, Status badge
- Cards in a single row (3 columns) on desktop
- Compact styling, no large padding

### AC-3.25.2: Purchase Orders Table
**Given** I view purchase orders listing at `/planning/purchase-orders`
**When** page loads
**Then** I see:
- Full table of all POs (paginated or lazy-loaded)
- Columns: PO # | Supplier | Date | Status | Total | Actions (View, Edit, Delete)
- Sortable columns (click header to sort)
- Filter options: Status, Date Range, Supplier
- Rows have subtle alternating background colors
- Hover effect on rows (highlight)

### AC-3.25.3: Mobile Responsive
**Given** I view PO listing on mobile (screen < md)
**When** page loads
**Then**:
- Table converts to card view
- Each PO shown as expandable card: "PO-XXX | Supplier | Status" [expand arrow]
- Click to see full details
- Smooth expand animation

### AC-3.25.4: Header Applied
**Given** I'm on PO pages
**When** checking layout
**Then**:
- PlanningHeader is visible (from Story 3.23)
- Action buttons (Create PO) visible below header
- Consistent padding on all sides (px-6 py-6)

---

## Implementation Tasks

- [ ] Create `TopPOCards` component in `/components/planning/TopPOCards.tsx`
  - Fetch 3 most recent POs from API
  - Compact card design (max 80px)
  - Link to detail page on click
- [ ] Create/refactor `PurchaseOrdersTable` component in `/components/planning/PurchaseOrdersTable.tsx`
  - Table with columns: PO #, Supplier, Date, Status, Total, Actions
  - Add sorting on click (col header)
  - Add filter UI for Status, Date Range, Supplier
  - Implement mobile card view for PO table at md breakpoint
  - Expandable cards with smooth animation
- [ ] Update `/planning/purchase-orders/page.tsx`
  - Add PlanningHeader component
  - Add action buttons for Create PO
  - Add consistent padding (px-6 py-6)
  - Use PurchaseOrdersTable component
- [ ] Update `/planning/page.tsx` dashboard
  - Add TopPOCards section
  - Maintain stats cards (from 3.24)
  - Consistent layout
- [ ] Test responsive behavior (mobile, tablet, desktop)

---

## Design Notes

```
Top Cards (3 columns):
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ PO-20251127  │ │ PO-20251126  │ │ PO-20251125  │
│ Supplier X   │ │ Supplier Y   │ │ Supplier Z   │
│ Draft        │ │ Confirmed    │ │ Confirmed    │
└──────────────┘ └──────────────┘ └──────────────┘

Table (desktop):
┌────────────────────────────────────────────────┐
│ PO #  │ Supplier │ Date │ Status │ Total │ ... │
├────────────────────────────────────────────────┤
│ ...   │ ...      │ ...  │ ...    │ ...   │ ... │
└────────────────────────────────────────────────┘

Mobile (card view):
┌──────────────────────────────────────┐
│ PO-20251127 │ Supplier X │ Draft │ > │
├──────────────────────────────────────┤
│ [Expanded]                           │
│ Date: 2025-11-27                     │
│ Total: €5,000                        │
│ Actions: View | Edit | Delete        │
└──────────────────────────────────────┘
```

---

## Files to Modify

```
apps/frontend/
├── components/planning/
│   ├── TopPOCards.tsx (NEW)
│   └── PurchaseOrdersTable.tsx (REFACTOR/CREATE)
└── app/(authenticated)/planning/
    ├── page.tsx (UPDATE - add TopPOCards)
    └── purchase-orders/page.tsx (UPDATE - use header + table)
```

---

**Status:** Ready for Development
**Next:** Story 3.26
