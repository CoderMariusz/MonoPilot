# Story 3.28: Transfer Orders Table View

**Epic:** 3 - Planning Operations
**Batch:** 3D - Planning UI Redesign
**Status:** ready-for-dev
**Priority:** P1 (Medium)
**Story Points:** 2
**Created:** 2025-11-27
**Updated:** 2025-11-27
**Effort Estimate:** 0.5 days
**UX Reference:** `docs/ux-design/ux-design-planning-to-module.md`

---

## Goal

Create Transfer Orders table view with top cards - simple CRUD workflow, no bulk entry (TOs are routine transfers).

---

## User Story

**As a** Planner
**I want** to see transfer orders in a table with top cards
**So that** I can quickly manage inter-warehouse transfers

---

## Acceptance Criteria

### AC-3.28.1: Top 3 TO Cards (on /planning dashboard)
**Given** I view `/planning` dashboard
**When** checking TO section
**Then** I see:
- "Recent Transfer Orders" section
- 3 most recent TOs as compact cards (**max 100px height**)
- Each card: TO #, From → To, Status, Items count
- Click card → navigate to detail page

```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ TO-001       │ │ TO-002       │ │ TO-003       │
│ WH-A → WH-B  │ │ WH-B → WH-C  │ │ WH-A → WH-C  │
│ Pending      │ │ In Transit   │ │ Completed    │
│ 15 items     │ │ 8 items      │ │ 22 items     │
└──────────────┘ └──────────────┘ └──────────────┘
```

### AC-3.28.2: Transfer Orders Table (on /planning/transfer-orders)
**Given** I view `/planning/transfer-orders`
**When** page loads
**Then** I see:
- Standard table (from Shared System)
- Columns: `[✓] TO # ↕ | From Warehouse | To Warehouse | Items | Status ↕ | Date ↕ | Actions`
- Search: TO # or Warehouse names
- Filters: Status, From Warehouse, To Warehouse, Date Range
- Pagination: 20 per page
- Row actions: View 👁️ | Edit ✏️ | Delete 🗑️

### AC-3.28.3: Status Badge Colors
**Given** I view TO status badges
**When** checking colors
**Then**:
- Pending: `yellow-200 bg + yellow-800 text`
- In Transit: `blue-200 bg + blue-800 text`
- Completed: `green-200 bg + green-800 text`
- Cancelled: `red-200 bg + red-800 text`

### AC-3.28.4: Action Buttons Row
**Given** I view TO page
**When** checking buttons
**Then**:
```
[Create TO]
  green-600
```
- Simple - single create button (no bulk entry for TOs)
- Opens create modal

### AC-3.28.5: Create TO Modal
**Given** I click [Create TO]
**When** modal opens
**Then**:
```
┌─────────────────────────────────────┐
│ Create Transfer Order               │
├─────────────────────────────────────┤
│ From Warehouse: [WH-A    ▼]         │
│ To Warehouse:   [WH-B    ▼]         │
│ Transfer Date:  [2025-11-27]        │
│ Items Count:    [  15       ]       │
│ Notes:          [optional text]     │
│                                     │
│ [Cancel]  [Create]                  │
└─────────────────────────────────────┘
```

**Validation:**
- Required: From, To, Transfer Date
- From ≠ To (can't transfer to same warehouse)
- Transfer Date ≥ today

### AC-3.28.6: Mobile Responsive (< 768px)
**Given** I view TO listing on mobile
**When** screen < 768px
**Then**:
- Table → Expandable card view
- Card: `TO-XXX | Status | WH-A→B | >`
- Expanded: All columns + actions
- Smooth animation (200ms)

---

## Implementation Tasks

- [ ] Create `TopTOCards` component in `/components/planning/TopTOCards.tsx`
  - 100px max height
  - Show: TO#, From→To, Status, Items count
- [ ] Create/refactor `TransferOrdersTable` component
  - Standard table structure
  - Search, filters, pagination
  - Mobile card view
- [ ] Create `CreateTOModal` component
  - Warehouse dropdowns
  - Date picker
  - Validation
- [ ] Update `/planning/transfer-orders/page.tsx`
  - PlanningHeader with "TO" active
  - Action button: Create TO
  - TransferOrdersTable
- [ ] Add TopTOCards to `/planning/page.tsx` dashboard

---

## Files to Modify

```
apps/frontend/
├── components/planning/
│   ├── TopTOCards.tsx (NEW)
│   ├── TransferOrdersTable.tsx (REFACTOR)
│   └── CreateTOModal.tsx (NEW)
└── app/(authenticated)/planning/
    ├── page.tsx (UPDATE - add TopTOCards)
    └── transfer-orders/page.tsx (UPDATE - header + table)
```

---

**Status:** Ready for Development
**Next:** Story 3.29
