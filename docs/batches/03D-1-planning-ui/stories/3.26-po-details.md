# Story 3.26: Purchase Order Details

**Epic:** 3 - Planning Operations
**Batch:** 3D - Planning UI Redesign
**Status:** ready-for-dev
**Priority:** P1 (High)
**Story Points:** 3
**Created:** 2025-11-27
**Updated:** 2025-11-27
**Effort Estimate:** 1 day
**UX Reference:** `docs/ux-design/ux-design-planning-po-module.md` (Section 7)

---

## Goal

Create PO detail page showing overview and line items in one view (readonly in overview, editable separately).

---

## User Story

**As a** Planner
**I want** to see PO details and line items in one overview screen
**So that** I can quickly review orders without multiple clicks

---

## Acceptance Criteria

### AC-3.26.1: PO Overview Section
**Given** I open a PO detail page at `/planning/purchase-orders/[id]`
**When** page loads
**Then** I see overview section with:
```
┌─────────────────────────────────────┐
│ PO-001        Confirmed     [Edit]  │
├─────────────────────────────────────┤
│ Supplier: ABC Meats                 │
│ Expected Delivery: 2025-12-15       │
│ Total: €5,000                       │
│ Status: Confirmed                   │
│ Notes: Special handling required    │
└─────────────────────────────────────┘
```
- PO Number, Status badge at top
- Key info: Supplier, Dates, Total, Notes
- [Edit] button for editing

### AC-3.26.2: Line Items Table (Readonly)
**Given** I scroll down PO detail page
**When** checking line items section
**Then** I see:
```
Line Items (Readonly)
─────────────────────────────────────
Product │ SKU  │ Qty │ Price │ Total
─────────────────────────────────────
Chicken │ CH-001│ 100 │ €25   │ €2,500
Salt    │ SA-001│ 50  │ €10   │ €500
─────────────────────────────────────
```
- "Line Items" section header
- Table with: Product | SKU | Qty | Unit | Price | Total | Status
- **Readonly** in overview (no inline editing)
- Rows expandable for more details

### AC-3.26.3: Edit Mode Navigation
**Given** I'm in overview mode
**When** I click [Edit] button
**Then**:
- Navigate to `/planning/purchase-orders/[id]/edit`
- OR open edit modal (same page)
- Can edit header fields
- Can edit line items (add/remove/modify)
- Save/Cancel buttons

### AC-3.26.4: Responsive Layout (Mobile)
**Given** I view PO detail on mobile
**When** checking layout
**Then**:
- Overview section stacks vertically
- Line items table → card view
- All content readable without horizontal scroll

### AC-3.26.5: Header Integration
**Given** I'm on PO detail page
**When** checking header
**Then**:
- PlanningHeader visible with "PO" tab active
- Breadcrumb optional: Planning > Purchase Orders > PO-001
- Back button available

---

## Implementation Tasks

- [ ] Create `PODetailView` component in `/components/planning/PODetailView.tsx`
  - Fetch PO + line items from API
  - Display overview info (readonly)
  - Edit button navigation
- [ ] Create `POLineItemsTable` component in `/components/planning/POLineItemsTable.tsx`
  - Readonly rendering in overview
  - Mobile card view support
- [ ] Update `/planning/purchase-orders/[id]/page.tsx`
  - Use PODetailView + POLineItemsTable
  - PlanningHeader with "PO" active
  - Responsive layout (px-6 py-6)
- [ ] Prepare edit page structure `/planning/purchase-orders/[id]/edit`

---

## Design Notes (from UX)

```
┌─────────────────────────────────────┐
│ PO-001 | Confirmed | [Edit]         │
├─────────────────────────────────────┤
│ Supplier: ABC Meats                 │
│ Expected Delivery: 2025-12-15       │
│ Total: €5,000                       │
│ Status: Confirmed                   │
│ Notes: Special handling required    │
│                                     │
│ Line Items (readonly):              │
│ Product | Qty | Price | Total       │
│ ─────────────────────────────────   │
│ Chicken | 100 | €25   | €2,500      │
│ Salt    | 50  | €10   | €500        │
│                                     │
└─────────────────────────────────────┘
```

---

## Files to Modify

```
apps/frontend/
├── components/planning/
│   ├── PODetailView.tsx (NEW)
│   └── POLineItemsTable.tsx (NEW)
└── app/(authenticated)/planning/purchase-orders/
    ├── [id]/page.tsx (UPDATE)
    └── [id]/edit/page.tsx (PREPARE)
```

---

**Status:** Ready for Development
**Next:** Story 3.27
