# Story 3.27: Work Orders Table + Spreadsheet Mode

**Epic:** 3 - Planning Operations
**Batch:** 3D - Planning UI Redesign
**Status:** ready-for-dev
**Priority:** P1 (High)
**Story Points:** 5
**Created:** 2025-11-27
**Updated:** 2025-11-27
**Effort Estimate:** 2 days
**UX Reference:** `docs/ux-design/ux-design-planning-wo-spreadsheet.md`

---

## Goal

Create Work Orders table view with top cards AND Spreadsheet Mode for Excel-like editing with drag-drop priority.

---

## User Story

**As a** Planner
**I want** to see WOs in table format AND switch to spreadsheet mode for bulk editing
**So that** I can manage 80-120 daily WOs efficiently with Excel-like workflow

---

## Acceptance Criteria

### AC-3.27.1: Top 3 WO Cards (on /planning dashboard)
**Given** I view `/planning` dashboard
**When** checking WO section
**Then** I see:
- "Recent Work Orders" section
- 3 most recent WOs as compact cards (**max 100px height**)
- Each card shows: WO #, Line, Status, Progress %
- Click card → navigate to detail page

```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ WO-001       │ │ WO-002       │ │ WO-003       │
│ Line 1       │ │ Line 2       │ │ Mixer A      │
│ Released 45% │ │ Active 78%   │ │ Draft 0%     │
│ Chicken      │ │ Bread        │ │ Cake Base    │
└──────────────┘ └──────────────┘ └──────────────┘
```

### AC-3.27.2: Work Orders Table View (Default)
**Given** I view `/planning/work-orders`
**When** page loads
**Then** I see:
- **View Toggle:** `[Standard Table View]  [← Spreadsheet]  [Timeline →]`
- Standard table (from Shared System)
- Columns: `[✓] WO # ↕ | Line ↕ | Product | Qty | Start ↕ | End | Status ↕ | Progress | Actions`
- Search: WO # or Product name
- Filters: Status, Line, Date Range, Product
- Pagination: 20 per page
- Bulk actions row for selected items

### AC-3.27.3: Spreadsheet Mode Toggle (NEW from UX)
**Given** I click [← Spreadsheet] button
**When** mode switches
**Then** I see:
```
┌──────────────────────────────────────────────────────────┐
│ [Table View →] [Spreadsheet] [Timeline →]                │
│ Search: [__________] Filters: [Status ▼] [Line ▼]        │
├──────────────────────────────────────────────────────────┤
│ Priority WO #  Line Product    Qty Start      Status      │
│ ───────────────────────────────────────────────────────── │
│   ↕      WO-001 L1  Chicken    100 2025-11-27 Released   │
│   ↕      WO-002 L2  Bread      50  2025-11-28 Active     │
│   ↕      WO-003 L1  Cake       75  2025-11-29 Draft      │
│                                                          │
│ [Paste from Excel] [Undo] [Save]                         │
│ Bulk Ops: [Status ▼] [Assign Line ▼] [Delete Selected]   │
└──────────────────────────────────────────────────────────┘
```

### AC-3.27.4: Spreadsheet Features
**Given** I'm in Spreadsheet Mode
**When** editing
**Then**:

1. **All Columns Inline Editable:**
   - Click cell → edit inline
   - Line: dropdown
   - Product: dropdown/autocomplete
   - Qty: number input
   - Date: date picker
   - Status: dropdown

2. **Drag-Drop Priority (Column 1):**
   - Drag ↕ icon to reorder rows
   - Priority #1 (top) = produced first
   - Updates priority order on drop

3. **Paste from Excel:**
   - [Paste from Excel] button opens dialog
   - Ctrl+V to paste
   - Parses: WO#, Line, Product, Qty, Start Date
   - Creates new rows

4. **Undo/Redo:**
   - Ctrl+Z → Undo (max 20 states)
   - Ctrl+Shift+Z → Redo

5. **Keyboard Shortcuts:**
   - Tab → Next cell
   - Shift+Tab → Previous cell
   - Enter → Move down
   - Escape → Cancel edit
   - Ctrl+S → Save all changes
   - Delete → Delete selected row

### AC-3.27.5: Bulk Operations
**Given** I select multiple rows (checkbox)
**When** using bulk actions
**Then**:
- **Bulk Status Change:** Select status → Apply to all selected
- **Bulk Assign to Line:** Select line → Apply to all selected
- **Bulk Delete:** Delete all selected (with confirmation)

### AC-3.27.6: Validation (Medium Level)
**Given** I click [Save]
**When** validating
**Then**:
- Required: WO#, Line, Product, Qty, Start Date
- Qty > 0
- Valid dates
- No duplicate WO#
- Invalid rows highlighted in red
- Error summary shown
- **No save until ALL errors fixed**

### AC-3.27.7: Mobile Responsive (< 768px)
**Given** I view WO list on mobile
**When** screen < 768px
**Then**:
- **Table View only** (no Spreadsheet on mobile)
- Table → Expandable card view
- Card: `WO-XXX | Status | Line | Progress %`

---

## Implementation Tasks

- [ ] Create `TopWOCards` component in `/components/planning/TopWOCards.tsx`
  - 100px max height
  - Show: WO#, Line, Status, Progress %
- [ ] Create/refactor `WorkOrdersTable` component
  - Standard table with bulk selection
  - Pagination, filters, sorting
  - Mobile card view
- [ ] Create `WorkOrdersSpreadsheet` component (NEW)
  - Inline editable cells
  - Drag-drop priority (react-dnd or similar)
  - Paste from Excel parsing
  - Undo/Redo stack
  - Keyboard navigation
  - Validation with error display
- [ ] Create `BulkActionsBar` component
  - Status change, Line assign, Delete
- [ ] Update `/planning/work-orders/page.tsx`
  - View mode toggle (Table/Spreadsheet/Timeline)
  - PlanningHeader
  - Conditional rendering based on mode
- [ ] Add TopWOCards to dashboard
- [ ] **Note:** Spreadsheet Mode desktop only (lg+)

---

## Phase Notes

- **Phase 1 (this story):** Table View + Spreadsheet Mode
- **Phase 2 (future):** Timeline/Gantt View

---

## Files to Modify

```
apps/frontend/
├── components/planning/
│   ├── TopWOCards.tsx (NEW)
│   ├── WorkOrdersTable.tsx (REFACTOR)
│   ├── WorkOrdersSpreadsheet.tsx (NEW)
│   └── BulkActionsBar.tsx (NEW)
└── app/(authenticated)/planning/
    ├── page.tsx (UPDATE - add TopWOCards)
    └── work-orders/page.tsx (UPDATE - mode toggle + components)
```

---

**Status:** Ready for Development
**Next:** Story 3.28
