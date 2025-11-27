# Story 3.28: Transfer Orders Table View

**Epic:** 3 - Planning Operations
**Batch:** 3D - Planning UI Redesign
**Status:** todo
**Priority:** P1 (Medium)
**Story Points:** 2
**Created:** 2025-11-27
**Effort Estimate:** 0.5 days

---

## Goal

Create Transfer Orders table view with top cards for consistent planning module layout.

---

## User Story

**As a** Planner
**I want** to see transfer orders in a table with top cards
**So that** I can quickly manage inter-warehouse transfers

---

## Acceptance Criteria

### AC-3.28.1: Top 3 TO Cards
**Given** I view `/planning` dashboard
**When** checking TO section
**Then** I see:
- "Recent Transfer Orders" section
- 3 most recent TOs as compact cards (max 100px)
- Each card: TO # | From | To | Status
- Cards in 1 row (3 columns) on desktop
- Link to detail page on click

### AC-3.28.2: Transfer Orders Table
**Given** I view `/planning/transfer-orders` page
**When** page loads
**Then** I see:
- **Table** with columns: TO # | From | To | Items Count | Status | Date | Actions
- Sortable headers
- Filterable (Status, Date Range, Warehouse)
- Mobile card view support
- Alternating row backgrounds

### AC-3.28.3: Header + Consistent Layout
**Given** I'm on TO page
**When** checking layout
**Then**:
- PlanningHeader visible (from Story 3.23)
- Create TO button available
- Consistent padding (px-6 py-6)

---

## Implementation Tasks

- [ ] Create `TopTOCards` component in `/components/planning/TopTOCards.tsx`
  - Fetch 3 most recent TOs
  - Compact card layout (max 100px)
  - Show: TO #, From, To, Status
- [ ] Create/refactor `TransferOrdersTable` component in `/components/planning/TransferOrdersTable.tsx`
  - Table layout with sorting/filtering
  - Columns: TO #, From, To, Items Count, Status, Date, Actions
  - Mobile card view support
- [ ] Update `/planning/transfer-orders/page.tsx`
  - Add PlanningHeader (from 3.23)
  - Add consistent layout (px-6 py-6)
  - Use TransferOrdersTable
- [ ] Add TO cards to `/planning/page.tsx` dashboard
  - TopTOCards section (similar to PO/WO)

---

## Files to Modify

```
apps/frontend/
├── components/planning/
│   ├── TopTOCards.tsx (NEW)
│   └── TransferOrdersTable.tsx (REFACTOR/CREATE)
└── app/(authenticated)/planning/
    ├── page.tsx (UPDATE - add TopTOCards)
    └── transfer-orders/page.tsx (UPDATE - use header + table)
```

---

**Status:** Ready for Development
**Next:** Story 3.29
