# Planning Module - Transfer Orders UX

**Epic:** 3 - Planning Operations
**Stories:** 03-28 (TO Dashboard & Table)
**Based on:** Shared UI Design System

---

## Overview

Transfer Orders page - simple CRUD workflow, standard Table view. No bulk entry (TOs are routine transfers with fixed routes).

---

## 1. Navigation

**Header:** Planning | PO | **TO** | WO | Suppliers | ⚙️
**URL:** `/planning/transfer-orders`

---

## 2. Dashboard Stats Card (on /planning)

**Card:** Transfer Orders
```
┌──────────────────────────────┐
│ 🔄 Transfer Orders           │
├──────────┬───────────────────┤
│ Total    │ 78                │
│ In Transit│ 12               │
├──────────┼───────────────────┤
│ Pending  │ 34                │
│ Completed│ 32                │
└──────────┴───────────────────┘
```

Click → Navigate to `/planning/transfer-orders`

---

## 3. Top 3 TO Cards (on /planning)

```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ TO-001       │ │ TO-002       │ │ TO-003       │
│ WH-A → WH-B  │ │ WH-B → WH-C  │ │ WH-A → WH-C  │
│ Pending      │ │ In Transit   │ │ Completed    │
│ 15 items     │ │ 8 items      │ │ 22 items     │
└──────────────┘ └──────────────┘ └──────────────┘
```

Max 100px height, 3 per row, click → detail page

---

## 4. TO List Table

**Default View:** Standard Table

**Columns:**
```
[Checkbox] TO # ↕ | From Warehouse | To Warehouse | Items | Status ↕ | Date ↕ | Actions
```

**Status Colors:**
- Pending: yellow-200
- In Transit: blue-200
- Completed: green-200
- Cancelled: red-200

**Filters:**
- Status (Pending, In Transit, Completed, Cancelled)
- From Warehouse (dropdown)
- To Warehouse (dropdown)
- Date Range

**Search:** TO # or Warehouse names

**Actions:** View 👁️ | Edit ✏️ | Delete 🗑️

**Pagination:** 20 per page

**Responsive (< 768px):**
- Table → Expandable cards
- Smooth expand animation (200ms)

---

## 5. Action Buttons Row

```
[Create TO]
  green-600
```

Simple - single create button (no bulk entry, TOs are routine)

---

## 6. Create TO Modal

**When:** User clicks [Create TO]

**Form:**
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

**Keyboard:** Enter to submit, Esc to cancel

---

## 7. Detail Page

**URL:** `/planning/transfer-orders/[id]`

**Layout:**
```
┌─────────────────────────────────────┐
│ TO-001 | In Transit | [Edit]        │
├─────────────────────────────────────┤
│ From: WH-A (Main Warehouse)         │
│ To: WH-B (Secondary Warehouse)      │
│ Transfer Date: 2025-11-27           │
│ Items Count: 15                     │
│ Status: In Transit (Expected arrival │
│         2025-11-28)                 │
│ Notes: Priority restock             │
│                                     │
│ License Plates in Transfer:         │
│ LP # | Product | Qty | Batch       │
│ ─────────────────────────────────   │
│ LP-001 | Chicken | 100kg | BATCH-1  │
│ LP-002 | Beef   | 50kg  | BATCH-2   │
│ ...                                 │
│                                     │
└─────────────────────────────────────┘
```

**Click [Edit]:** Navigate to `/planning/transfer-orders/[id]/edit`

**Edit Mode:**
- Modal opens with form
- Can edit warehouse, date, notes
- Can add/remove LPs
- Save/Cancel buttons

---

## 8. Colors & Interactions

**Colors:** Use Shared System (app-colors.ts)
- Create: green-600
- View/Edit: gray-600
- Delete: red-600
- Status badges: standard colors

**Hover:** Row highlight (150ms transition)

**Toast:** Center-bottom, 3-5s auto-dismiss
- Success: "TO-001 created"
- Error: "Cannot transfer to same warehouse"

---

## 9. Mobile Responsive

**< 768px:** Table → Card view
```
┌──────────────────────────────┐
│ TO-001 │ Pending │ WH-A→B │ > │
├──────────────────────────────┤
│ [Expanded]                   │
│ Date: 2025-11-27            │
│ Items: 15                   │
│ Actions: [View][Edit][Delete]│
└──────────────────────────────┘
```

---

## 10. Implementation Tasks

Stories:
- [ ] 03-28: Create `TransferOrdersTable` component
- [ ] 03-28: Create `TopTOCards` component
- [ ] 03-28: Create create/edit modal
- [ ] 03-28: Add pagination, filters, search
- [ ] 03-28: Detail page
- [ ] 03-29: Mobile card view
- [ ] 03-30: Apply colors from app-colors.ts

---

**End - ~120 wierszy**
