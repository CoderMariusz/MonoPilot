# Story 3.26: Purchase Order Details + Line Items Overview

**Epic:** 3 - Planning Operations
**Batch:** 3D - Planning UI Redesign
**Status:** todo
**Priority:** P1 (High)
**Story Points:** 3
**Created:** 2025-11-27
**Effort Estimate:** 1 day

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
- PO Number, Status badge, Supplier name (top)
- Key dates: Created, Expected Delivery, Actual Delivery
- Total amount, Notes (if any)
- "Edit" button/link for editing

### AC-3.26.2: Line Items Table in Overview
**Given** I scroll down PO detail page
**When** checking line items section
**Then** I see:
- "Line Items" section header
- Table with columns: Product | SKU | Qty | Unit | Price | Total | Status
- All line items for this PO listed
- Line items are **readonly** in overview
- Rows can be clicked to expand details if needed

### AC-3.26.3: Edit Mode Separate
**Given** I'm in overview mode
**When** I click "Edit" button
**Then**:
- Navigate to edit page `/planning/purchase-orders/[id]/edit`
- Line items become editable
- Can add/remove lines
- Save changes

### AC-3.26.4: Responsive Layout
**Given** I view PO detail on mobile
**When** checking layout
**Then**:
- Overview section responsive (stacked layout)
- Line items table converts to card view (Mobile AC from 3.25)
- All content readable without horizontal scroll

---

## Implementation Tasks

- [ ] Create `PODetailView` component in `/components/planning/PODetailView.tsx`
  - Fetch PO + line items from API
  - Display overview info (readonly)
  - Show Edit button
  - Compact, clean layout
- [ ] Create `POLineItemsTable` component in `/components/planning/POLineItemsTable.tsx`
  - Display line items in table format
  - Readonly rendering in overview
  - Mobile card view support
  - Expandable rows if needed
- [ ] Update `/planning/purchase-orders/[id]/page.tsx`
  - Use PODetailView + POLineItemsTable
  - Add PlanningHeader (from 3.23)
  - Responsive layout with px-6 py-6
- [ ] Create/prepare `/planning/purchase-orders/[id]/edit` page (for future story)
  - Link from detail view
  - Structure ready for editable form

---

## Design Notes

```
┌─────────────────────────────────────────┐
│ PO-20251127        [Edit]               │
│ Status: Draft      Supplier: Supplier X │
│ Created: 2025-11-27                     │
│ Expected: 2025-12-15                    │
│ Total: €5,000      Notes: Sample notes  │
├─────────────────────────────────────────┤
│ Line Items (Readonly)                   │
├─────────────────────────────────────────┤
│ Product │ SKU  │ Qty │ Price │ Total   │
│ ... detailed table ...                  │
└─────────────────────────────────────────┘
```

---

## Files to Modify

```
apps/frontend/
├── components/planning/
│   ├── PODetailView.tsx (NEW)
│   └── POLineItemsTable.tsx (NEW)
└── app/(authenticated)/planning/purchase-orders/
    └── [id]/page.tsx (UPDATE)
```

---

**Status:** Ready for Development
**Next:** Story 3.27
