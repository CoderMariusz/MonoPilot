# Story 3.25: Purchase Orders Dashboard View

**Epic:** 3 - Planning Operations
**Batch:** 3D - Planning UI Redesign
**Status:** ready-for-dev
**Priority:** P1 (High)
**Story Points:** 3
**Created:** 2025-11-27
**Updated:** 2025-11-27
**Effort Estimate:** 1 day
**UX Reference:** `docs/ux-design/ux-design-planning-po-module.md`

---

## Goal

Create compact top PO cards, refactor PO table view, and add Bulk Entry modal for Excel paste.

---

## User Story

**As a** Planner
**I want** to see recent POs in compact cards, a full table, and bulk create POs from Excel
**So that** I can quickly see recent activity and efficiently create multiple orders

---

## Acceptance Criteria

### AC-3.25.1: Top 3 PO Cards (on /planning dashboard)
**Given** I view `/planning` dashboard
**When** page loads
**Then** I see:
- "Recent Purchase Orders" section (below stats cards)
- 3 most recent POs as compact cards (**max 100px height**)
- Each card shows: PO #, Supplier, Status badge, Total €
- Cards in 1 row (3 columns) on desktop
- Click card → navigate to detail page

```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ PO-001       │ │ PO-002       │ │ PO-003       │
│ Supplier ABC │ │ Supplier XYZ │ │ Supplier DEF │
│ Draft        │ │ Confirmed    │ │ Confirmed    │
│ €5,000       │ │ €3,200       │ │ €7,500       │
└──────────────┘ └──────────────┘ └──────────────┘
```

### AC-3.25.2: Purchase Orders Table (on /planning/purchase-orders)
**Given** I view `/planning/purchase-orders`
**When** page loads
**Then** I see:
- Standard table (from Shared System)
- Columns: `[✓] PO # ↕ | Supplier ↕ | Date ↕ | Status | Total ↕ | Actions`
- Search: PO # or Supplier name
- Filters: Status, Date Range, Supplier
- Sortable columns
- Pagination: 20 per page
- Row actions: View 👁️ | Edit ✏️ | Delete 🗑️

### AC-3.25.3: Action Buttons Row
**Given** I view PO page
**When** checking buttons
**Then** I see:
```
[Create PO]  [Bulk Entry]  [Import Excel]
  green-600    green-600     green-600
```
- **Create PO** → Opens create modal (single PO)
- **Bulk Entry** → Opens Bulk Entry modal (see AC-3.25.4)
- **Import Excel** → File picker for upload

### AC-3.25.4: Bulk Entry Modal (NEW from UX)
**Given** I click [Bulk Entry] button
**When** modal opens
**Then** I see:
```
┌─────────────────────────────────────┐
│ Bulk Create Purchase Orders         │
├─────────────────────────────────────┤
│                                     │
│ Paste PO lines here (from Excel):   │
│ ┌─────────────────────────────────┐ │
│ │ SKU | Qty | Supplier | Due Date │ │
│ │ SKU-001 | 100 | ABC | 2025-12-15│ │
│ │ SKU-002 | 50  | XYZ | 2025-12-20│ │
│ │ SKU-003 | 75  | ABC | 2025-12-15│ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Preview] [Create POs]              │
└─────────────────────────────────────┘
```

**Bulk Entry Workflow:**
1. User pastes data from Excel (Ctrl+V)
2. System parses: SKU, Qty, Supplier, Due Date
3. Click [Preview] → shows parsed data + validation
4. System **auto-groups by Supplier** (1 PO per supplier)
5. Click [Create POs] → creates all POs

**Auto-Group Example:**
```
SUPPLIER ABC:                SUPPLIER XYZ:
├─ SKU-001 | 100 qty        ├─ SKU-002 | 50 qty
└─ SKU-003 | 75 qty         (separate PO)
(1 PO with 2 lines)
```

**Validation:**
- Required: SKU, Qty, Supplier, Due Date
- Qty must be > 0
- Due Date must be valid format
- Invalid rows shown in red

### AC-3.25.5: Status Badge Colors (Shared System)
**Given** I view PO status badges
**When** checking colors
**Then**:
- Draft: `yellow-200 bg + yellow-800 text`
- Pending: `amber-200 bg + amber-800 text`
- Confirmed: `green-200 bg + green-800 text`
- Cancelled: `red-200 bg + red-800 text`

### AC-3.25.6: Mobile Responsive (< 768px)
**Given** I view PO listing on mobile
**When** screen < 768px
**Then**:
- Table → Expandable card view
- Card: `PO-XXX | Status | Supplier | >` [expand]
- Expanded: All columns + actions
- Smooth animation (200ms)

---

## Implementation Tasks

- [ ] Create `TopPOCards` component in `/components/planning/TopPOCards.tsx`
  - Fetch 3 most recent POs
  - 100px max height cards
  - Link to detail page
- [ ] Create `BulkPOEntryModal` component in `/components/planning/BulkPOEntryModal.tsx`
  - Textarea for Excel paste
  - Parse logic (tab/comma separated)
  - Preview mode with validation
  - Auto-group by supplier
  - Create POs API call
- [ ] Refactor `PurchaseOrdersTable` component
  - Standard table structure
  - Search, filters, pagination
  - Mobile card view
- [ ] Update `/planning/purchase-orders/page.tsx`
  - Use PlanningHeader (from 3.23)
  - Action buttons: Create, Bulk Entry, Import
  - PurchaseOrdersTable
- [ ] Add TopPOCards to `/planning/page.tsx` dashboard
- [ ] Test Bulk Entry with real Excel data

---

## Files to Modify

```
apps/frontend/
├── components/planning/
│   ├── TopPOCards.tsx (NEW)
│   ├── BulkPOEntryModal.tsx (NEW)
│   └── PurchaseOrdersTable.tsx (REFACTOR)
└── app/(authenticated)/planning/
    ├── page.tsx (UPDATE - add TopPOCards)
    └── purchase-orders/page.tsx (UPDATE - header + table + bulk)
```

---

**Status:** Ready for Development
**Next:** Story 3.26
