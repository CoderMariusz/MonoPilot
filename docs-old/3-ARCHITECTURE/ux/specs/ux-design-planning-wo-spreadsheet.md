# Planning Module - Work Orders Spreadsheet UX

**Epic:** 3 - Planning Operations
**Stories:** 03-24, 03-27, 03-29 (WO Dashboard, Table, Mobile)
**Key Feature:** Spreadsheet Mode with drag-drop priority + bulk operations

---

## Overview

Work Orders page has TWO modes:
1. **Table View** (Default) - Standard sortable table
2. **Spreadsheet Mode** (Toggle) - Excel-like editing with drag-drop priority

Timeline Mode (Gantt) → Phase 2

---

## 1. Navigation

**Header:** Planning | PO | TO | **WO** | Suppliers | ⚙️
**URL:** `/planning/work-orders`

---

## 2. Dashboard Stats Card (on /planning)

**Card:** Work Orders
```
┌──────────────────────────────┐
│ 🏭 Work Orders               │
├──────────┬───────────────────┤
│ Total    │ 245               │
│ Active   │ 18                │
├──────────┼───────────────────┤
│ Completed│ 156               │
│ Released │ 71                │
└──────────┴───────────────────┘
```

Click → Navigate to `/planning/work-orders`

---

## 3. Top 3 WO Cards (on /planning)

```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ WO-001       │ │ WO-002       │ │ WO-003       │
│ Line 1       │ │ Line 2       │ │ Mixer A      │
│ Released 45% │ │ Active 78%   │ │ Draft 0%     │
│ Chicken      │ │ Bread        │ │ Cake Base    │
└──────────────┘ └──────────────┘ └──────────────┘
```

Max 100px height, 3 per row, click → detail page

---

## 4. Work Orders Page - Default View (TABLE)

**URL:** `/planning/work-orders`

**Header:** `[Standard Table View]  [← Spreadsheet]  [Timeline →]`

**Default Layout:**
```
┌──────────────────────────────────────────────────────────┐
│ [Standard Table View] [← Spreadsheet] [Timeline →]       │
│ [Search] [Status ▼] [Line ▼] [Date ▼]  [Create WO]      │
├──────────────────────────────────────────────────────────┤
│ [✓] WO # ↕ | Line | Product | Qty | Start | Status ↕   │
├──────────────────────────────────────────────────────────┤
│ [ ] WO-001 | L1 | Chicken | 100 | 2025-11-27 | Released │
│ [ ] WO-002 | L2 | Bread   | 50  | 2025-11-28 | Active   │
│ [ ] WO-003 | L1 | Cake    | 75  | 2025-11-29 | Draft    │
│                                                          │
│ Bulk Actions: [Status ▼] [Assign to Line ▼] [Delete]    │
│                                                          │
│ < 1 2 3 ... >  (20 per page)                             │
└──────────────────────────────────────────────────────────┘
```

**Columns:**
```
[Checkbox] WO # ↕ | Line ↕ | Product | Qty | Start Date ↕ | End Date | Status ↕ | Progress % | Actions
```

**Status Colors:**
- Released: yellow-200
- Active: blue-200
- Completed: green-200
- Paused: gray-200

**Filters:**
- Status (Released, Active, Completed, Paused)
- Line (dropdown)
- Date Range
- Product (search)

**Search:** WO # or Product name

**Row Actions:** View 👁️ | Edit ✏️ | Delete 🗑️

**Pagination:** 20 per page

---

## 5. Spreadsheet Mode (TOGGLE)

**When:** User clicks [← Spreadsheet] button

**Transforms to:**
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
│   ↕      WO-004 L2  Cookies    60  2025-11-30 Released   │
│                                                          │
│ [Paste from Excel] [Undo] [Save]                         │
│                                                          │
│ Bulk Ops: [Status ▼] [Assign Line ▼] [Delete Selected]   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Spreadsheet Features:**

### 5.1 All Columns Inline Editable
```
Click cell → Edit inline:
WO-001 | Line: [L1 ▼] | Product: [Chicken ▼] | Qty: [100] | Date: [2025-11-27] | Status: [Released ▼]
```

### 5.2 Drag-Drop Priority (Column 1)
```
Drag ↕ icon → Reorder rows = Set production priority
Priority #1 (top) = Produced first
Priority #8 (bottom) = Produced last
```

### 5.3 Paste from Excel
```
User action: [Paste from Excel] button
├─ Opens native clipboard paste dialog
├─ System parses: WO#, Line, Product, Qty, Start Date
└─ Creates new rows for each pasted line
```

**Keyboard:** Ctrl+V to paste

### 5.4 Inline Validation
```
Invalid cells → Red border + error tooltip
Required fields (WO#, Line, Product, Qty, Start Date)
```

### 5.5 Undo/Redo
```
Ctrl+Z → Undo last change
Ctrl+Shift+Z → Redo
Max 20 undo states
```

### 5.6 Keyboard Shortcuts
```
Tab         → Move to next cell (right)
Shift+Tab   → Move to prev cell (left)
Enter       → Move down to next row
Escape      → Cancel current edit
Ctrl+V      → Paste from Excel
Ctrl+Z      → Undo
Ctrl+Shift+Z→ Redo
Ctrl+S      → Save all changes
Delete      → Delete selected row
```

---

## 6. Bulk Operations

**When:** User selects rows via checkbox

**Available Operations:**

### 6.1 Bulk Status Change
```
Select: WO-001, WO-003, WO-005
Click: [Status ▼]
Options: Released, Active, Completed, Paused
Result: All 3 WOs status → Selected status
```

### 6.2 Bulk Assign to Line
```
Select: WO-001, WO-002, WO-003
Click: [Assign Line ▼]
Options: Line 1, Line 2, Line 3, Mixer A
Result: All 3 WOs assigned to selected line
```

### 6.3 Bulk Delete
```
Select: WO-001, WO-003
Click: [Delete Selected]
Confirmation: "Delete 2 WOs? This cannot be undone."
Result: WOs deleted, undo available
```

### 6.4 Create Multiple from Excel (NEW)
```
[Paste from Excel] → Opens dialog:
┌───────────────────────────────┐
│ Paste WO data:                │
│ ┌─────────────────────────────┤
│ │ WO# Line Product Qty Start  │
│ │ WO-005 L1 Donuts 80 2025-12-01
│ │ WO-006 L2 Muffins 40 2025-12-01
│ │ WO-007 L1 Cookies 100 2025-12-02
│ └─────────────────────────────┤
│ [Preview] [Create All]        │
└───────────────────────────────┘

Preview shows parsed data + validation
Create All → Creates all WOs in one go
```

---

## 7. Validation Strategy (MEDIUM)

**When:** User clicks [Save] or [Create All]

**Checks:**
- Required fields: WO#, Line, Product, Qty, Start Date
- Data types: Qty = number, Dates valid
- Constraints: Qty > 0, Start Date valid, Line exists
- Uniqueness: No duplicate WO#

**Error Display:**
```
Invalid rows highlighted in red
Error summary: "3 rows have errors"
Details: Click row → see specific errors
Fix & retry
```

**No save until ALL errors fixed**

---

## 8. Detail Page

**URL:** `/planning/work-orders/[id]`

**Layout:**
```
┌─────────────────────────────────────┐
│ WO-001 | Active | 78% | [Edit]      │
├─────────────────────────────────────┤
│ Line: Line 1                        │
│ Product: Chicken Breast             │
│ Quantity: 100 kg                    │
│ Start Date: 2025-11-27 10:00        │
│ End Date: 2025-11-27 14:30          │
│ Status: Active                      │
│ Progress: 78 of 100 kg produced     │
│                                     │
│ BOM (Recipe):                       │
│ Material | Qty | Unit | Status      │
│ ─────────────────────────────────   │
│ Raw Chicken | 100 | kg | ✓ Ready    │
│ Salt | 2 | kg | ✓ Ready             │
│ Spices | 1 | kg | ✓ Ready           │
│                                     │
│ Output (Products created):          │
│ LP # | Qty | Created | Status       │
│ ─────────────────────────────────   │
│ LP-101 | 10 | ✓ | Ready             │
│ LP-102 | 15 | ✓ | Ready             │
│                                     │
└─────────────────────────────────────┘
```

**Click [Edit]:** Navigate to `/planning/work-orders/[id]/edit`

**Edit Mode:** Modal with form fields

---

## 9. Colors & Interactions

**Colors:** Use Shared System (app-colors.ts)
- Create/Paste: green-600
- View/Edit: gray-600
- Delete: red-600
- Status badges: standard colors
- Invalid cells: red-200 bg

**Hover:**
- Row highlight (150ms)
- Drag cursor on ↕ icon (grab)

**Toast:**
- "WO-001 created"
- "3 WOs status changed to Active"
- "Excel paste: 5 rows parsed"

---

## 10. Mobile Responsive

**< 768px:** Table → Card view
```
Priority WO # │ Line │ Status │ >
┌──────────────────────────────┐
│ [Expanded]                   │
│ Product: Chicken             │
│ Qty: 100 kg                  │
│ Start: 2025-11-27            │
│ Progress: 78%                │
│ Actions: [View][Edit][Delete]│
└──────────────────────────────┘
```

**No Spreadsheet Mode on mobile** (mobile unfriendly)
- Mobile shows Table View only
- Spreadsheet Mode available on desktop (lg+) only

---

## 11. Implementation Tasks

Stories:
- [ ] 03-24: Create stats card
- [ ] 03-27: Create `WorkOrdersTable` (table view)
- [ ] 03-27: Create `TopWOCards`
- [ ] 03-27: Detail page
- [ ] 03-27: Pagination, filters
- [ ] 04-XX: Create `SpreadsheetMode` component
  - [ ] Inline editing
  - [ ] Drag-drop priority
  - [ ] Paste from Excel
  - [ ] Undo/Redo
  - [ ] Keyboard shortcuts
  - [ ] Bulk operations
- [ ] 03-29: Mobile card view
- [ ] 03-30: Colors from app-colors.ts

---

**End - ~280 wierszy**
