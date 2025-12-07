# Planning Module - Purchase Orders UX

**Epic:** 3 - Planning Operations
**Stories:** 03-25 (PO Dashboard)
**Based on:** Shared UI Design System

---

## Overview

Purchase Orders page follows Shared System with standard Table view + Bulk Entry modal for Excel paste.

---

## 1. Navigation

**Header:** Planning | **PO** | TO | WO | Suppliers | ⚙️
**URL:** `/planning/purchase-orders`

---

## 2. Dashboard Stats Card (on /planning)

**Card:** Purchase Orders
```
┌──────────────────────────────┐
│ 📋 Purchase Orders           │
├──────────┬───────────────────┤
│ Total    │ 156               │
│ Draft    │ 23                │
├──────────┼───────────────────┤
│ Pending  │ 45                │
│ Confirmed│ 88                │
└──────────┴───────────────────┘
```

Click → Navigate to `/planning/purchase-orders`

---

## 3. Top 3 PO Cards (on /planning)

```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ PO-001       │ │ PO-002       │ │ PO-003       │
│ Supplier ABC │ │ Supplier XYZ │ │ Supplier DEF │
│ Draft        │ │ Confirmed    │ │ Confirmed    │
│ €5,000       │ │ €3,200       │ │ €7,500       │
└──────────────┘ └──────────────┘ └──────────────┘
```

Max 100px height, 3 per row, click → detail page

---

## 4. PO List Table

**Default View:** Standard Table

**Columns:**
```
[Checkbox] PO # ↕ | Supplier ↕ | Date ↕ | Status | Total ↕ | Actions
```

**Status Colors:**
- Draft: yellow-200
- Pending: amber-200
- Confirmed: green-200
- Cancelled: red-200

**Filters:**
- Status (Draft, Pending, Confirmed, Cancelled)
- Date Range
- Supplier (dropdown)

**Search:** PO # or Supplier name

**Actions:** View 👁️ | Edit ✏️ | Delete 🗑️

**Pagination:** 20 per page

**Responsive (< 768px):**
- Table → Expandable cards
- Smooth expand animation (200ms)

---

## 5. Action Buttons Row

```
[Create PO]  [Bulk Entry]  [Import Excel]
  green-600    green-600     green-600
```

**Create PO:** Opens modal → create single PO
**Bulk Entry:** Opens modal → paste multiple POs (see section 6)
**Import Excel:** Opens file picker → upload & parse

---

## 6. Bulk Entry Modal

**When:** User clicks [Bulk Entry]

**Form:**
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
│                                     │
└─────────────────────────────────────┘
```

**Workflow:**
1. User pastes data from Excel
2. System parses: SKU, Qty, Supplier, Due Date
3. Click [Preview] → shows parsed data + auto-grouping
4. System groups by Supplier automatically
5. Click [Create POs] → creates 1 PO per supplier with lines

**Auto-Group Example:**
```
SUPPLIER ABC:                SUPPLIER XYZ:
├─ SKU-001 | 100 qty        ├─ SKU-002 | 50 qty
└─ SKU-003 | 75 qty         (separate PO)
(1 PO)
```

**Validation:**
- Required: SKU, Qty, Supplier, Due Date
- Qty must be > 0
- Due Date must be valid
- Show errors inline

**Keyboard Support:**
- Tab: Move between fields
- Ctrl+V: Paste from clipboard

---

## 7. Detail Page

**URL:** `/planning/purchase-orders/[id]`

**Layout:**
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

**Click [Edit]:** Navigate to `/planning/purchase-orders/[id]/edit`

**Edit Mode:**
- Modal opens with form
- Can edit header fields
- Can edit line items
- Save/Cancel buttons

---

## 8. Colors & Interactions

**Colors:** Use Shared System (app-colors.ts)
- Create: green-600
- View/Edit: gray-600
- Delete: red-600
- Status badges: standard colors

**Hover:** Row highlight, smooth transition (150ms)

**Toast:** Center-bottom, 3-5s auto-dismiss
- Success: "PO-001 created"
- Error: "Failed to create PO"
- Warning: "3 items have invalid suppliers"

---

## 9. Mobile Responsive

**< 768px:** Table → Card view
```
┌──────────────────────────────┐
│ PO-001 │ Draft │ ABC │  >    │
├──────────────────────────────┤
│ [Expanded]                   │
│ Date: 2025-11-27            │
│ Total: €5,000               │
│ Actions: [View][Edit][Delete]│
└──────────────────────────────┘
```

---

## 10. Implementation Tasks

Stories:
- [ ] 03-25: Create `PurchaseOrdersTable` component
- [ ] 03-25: Create `TopPOCards` component
- [ ] 03-25: Create `BulkPOEntryModal` component
- [ ] 03-25: Add pagination, filters, search
- [ ] 03-25: Detail page + edit modal
- [ ] 03-29: Mobile card view
- [ ] 03-30: Apply colors from app-colors.ts

---

**End - ~150 wierszy**
