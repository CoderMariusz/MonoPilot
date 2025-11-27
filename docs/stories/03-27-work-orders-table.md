# Story 3.27: Work Orders Table View

**Epic:** 3 - Planning Operations
**Batch:** 3D - Planning UI Redesign
**Status:** todo
**Priority:** P1 (High)
**Story Points:** 3
**Created:** 2025-11-27
**Effort Estimate:** 1 day

---

## Goal

Create Work Orders table view with top cards to handle 80-120 daily WOs efficiently.

---

## User Story

**As a** Planner
**I want** to see all work orders in a table format, with top 3 as cards
**So that** I can manage 80-120 daily WOs efficiently

---

## Acceptance Criteria

### AC-3.27.1: Top 3 WO Cards
**Given** I view `/planning` dashboard
**When** checking WO section
**Then** I see:
- "Recent Work Orders" section
- 3 most recent WOs as compact cards (max 100px height)
- Each card shows: WO #, Status, Machine, Progress %
- Cards in 1 row (3 columns) on desktop
- Link to detail page on click

### AC-3.27.2: Work Orders Table
**Given** I view `/planning/work-orders` page
**When** page loads
**Then** I see:
- **Table** (not cards) with all WOs
- Columns: WO # | Machine | Status | Product | Qty | Progress | Start Date | End Date | Actions
- **Pagination or lazy-loading** (to handle 80-120 records)
- Sortable headers
- Filter options: Status, Machine, Date Range, Product
- Row selection (checkboxes) for bulk actions
- Alternating row backgrounds

### AC-3.27.3: Mobile Responsive
**Given** I view WO list on mobile (screen < md)
**When** page loads
**Then**:
- Table converts to expandable cards
- Minimal info visible: "WO-XXXX | Status | Machine" [expand]
- Click to see full details

### AC-3.27.4: Performance for Large Datasets
**Given** 80-120 WOs load on a single day
**When** checking performance
**Then**:
- Page loads in < 2 seconds
- Pagination working correctly (20 per page default)
- No console errors

---

## Implementation Tasks

- [ ] Create `TopWOCards` component in `/components/planning/TopWOCards.tsx`
  - Fetch 3 most recent WOs
  - Compact card layout (max 100px)
  - Show: WO #, Status, Machine, Progress %
- [ ] Create/refactor `WorkOrdersTable` component in `/components/planning/WorkOrdersTable.tsx`
  - Implement pagination (20 per page)
  - Add sorting, filtering (Status, Machine, Date, Product)
  - Row selection checkboxes
  - Mobile card view (expandable)
  - Alternating row backgrounds
- [ ] Implement bulk actions placeholder (for future)
  - Ready for: bulk status change, etc.
- [ ] Update `/planning/work-orders/page.tsx`
  - Add PlanningHeader (from 3.23)
  - Add consistent layout (px-6 py-6)
  - Use WorkOrdersTable component
- [ ] Add WO cards to `/planning/page.tsx` dashboard
  - TopWOCards section (similar to PO/TO)
- [ ] Performance testing
  - Test with 100+ records
  - Verify pagination/lazy-loading works

---

## Design Notes

```
Top Cards (3 columns):
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ WO-20251127  │ │ WO-20251126  │ │ WO-20251125  │
│ Machine M1   │ │ Machine M2   │ │ Machine M3   │
│ Active 75%   │ │ Completed    │ │ Draft        │
└──────────────┘ └──────────────┘ └──────────────┘

Table (desktop):
┌─────────────────────────────────────────────────┐
│WO # │Machine│Status    │Product│Qty│Progress│...│
├─────────────────────────────────────────────────┤
│...  │...    │...       │...    │...│...     │...│
└─────────────────────────────────────────────────┘

Mobile (card view):
┌──────────────────────────────────────┐
│ WO-20251127 │ Active │ Machine M1 │ >│
├──────────────────────────────────────┤
│ [Expanded]                           │
│ Product: Widget A                    │
│ Qty: 100, Progress: 75%              │
│ Actions: View | Edit | Delete        │
└──────────────────────────────────────┘
```

---

## Files to Modify

```
apps/frontend/
├── components/planning/
│   ├── TopWOCards.tsx (NEW)
│   └── WorkOrdersTable.tsx (REFACTOR/CREATE)
└── app/(authenticated)/planning/
    ├── page.tsx (UPDATE - add TopWOCards)
    └── work-orders/page.tsx (UPDATE - use header + table)
```

---

**Status:** Ready for Development
**Next:** Story 3.28
