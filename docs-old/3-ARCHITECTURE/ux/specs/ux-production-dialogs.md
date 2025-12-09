# UX Specification: Production Module - Dialog Components

**Module**: Production
**Type**: Dialog Components Specification
**Created**: 2025-12-07
**Status**: Generated from code analysis

---

## Overview

This document provides detailed UX specifications for Production Module dialog components, generated from the implemented codebase.

---

## 1. ConsumeConfirmDialog

### Purpose
Confirmation dialog for consuming a reserved License Plate (LP) in a Work Order. Enforces 1:1 consumption workflow (Story 4.9).

### Trigger
- User clicks "Consume" button on a reserved material in MaterialReservationsTable
- Requires material to be in "reserved" status

### Component Type
AlertDialog (shadcn/ui)

### Layout

```
┌─────────────────────────────────────────────┐
│ Confirm Consumption                      ✕  │
├─────────────────────────────────────────────┤
│ Are you sure you want to consume this      │
│ reserved material?                          │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ Material: [Material Name]               │ │
│ │ LP: [LP Number]                         │ │
│ │ Quantity: [Reserved Qty] [UOM]          │ │
│ │ Sequence: #[Sequence Number]            │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ⚠️ Whole LP consumption required - entire  │
│    quantity will be consumed                │
│    (conditional - only if consume_whole_lp) │
│                                             │
│ ℹ️ This action will deduct the quantity    │
│    from the LP and mark it as consumed.     │
│                                             │
│              [Cancel]  [Confirm Consumption]│
└─────────────────────────────────────────────┘
```

### Fields

| Field | Type | Source | Display |
|-------|------|--------|---------|
| Material Name | String | Props | Read-only label |
| LP Number | String | reservation.lp_number | Read-only, monospace |
| Quantity | Number | reservation.reserved_qty | Read-only, with UOM |
| Sequence | Number | reservation.sequence_number | Read-only |
| Consume Whole LP | Boolean | reservation.consume_whole_lp | Conditional warning |

### Actions

| Action | Effect | Color |
|--------|--------|-------|
| Cancel | Close dialog without action | Default gray |
| Confirm Consumption | POST to `/api/production/work-orders/{woId}/consume` | Green-600 |

### API Call
```typescript
POST /api/production/work-orders/{woId}/consume
Body: {
  reservation_id: string,
  qty: number
}
```

### Success State
- Toast: "Consumed {qty} {uom} from {lp_number}"
- Calls `onSuccess()` callback
- Closes dialog

### Error States

| Error | Display |
|-------|---------|
| API error | Toast with error message (destructive) |
| Network error | "An unexpected error occurred" |

### Validation
- No user input validation (all values pre-filled from reservation)
- Submission disabled during API call

---

## 2. ReverseConsumptionDialog

### Purpose
Dialog for reversing (undoing) a material consumption record. Requires Manager/Admin permission and mandatory reason (Story 4.10).

### Trigger
- User clicks "Reverse" button on a consumption record in ConsumptionHistoryTable
- Restricted to Manager/Admin roles

### Component Type
AlertDialog with form input (shadcn/ui)

### Layout

```
┌─────────────────────────────────────────────┐
│ ⚠️ Reverse Consumption?                  ✕  │
├─────────────────────────────────────────────┤
│ Are you sure you want to reverse this      │
│ consumption record?                         │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ Material: [Material Name]               │ │
│ │ LP: [LP Number]                         │ │
│ │ Quantity: [Consumed Qty] [UOM]          │ │
│ │ Consumed at: [Date Time]                │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Reason for reversal *                      │
│ ┌─────────────────────────────────────────┐ │
│ │ [Textarea - 500 char max]               │ │
│ │                                         │ │
│ │                                         │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ⚠️ Warning: The LP quantity will be        │
│    restored and status changed back to     │
│    "reserved". This action is logged for   │
│    audit compliance.                        │
│                                             │
│       [Cancel]  [Reverse Consumption]       │
└─────────────────────────────────────────────┘
```

### Fields

| Field | Type | Required | Validation | Max Length |
|-------|------|----------|------------|------------|
| Material Name | String | - | Read-only | - |
| LP Number | String | - | Read-only | - |
| Consumed Qty | Number | - | Read-only | - |
| Consumed At | DateTime | - | Read-only, formatted | - |
| Reason | Text | Yes | Not empty | 500 chars |

### Actions

| Action | Effect | Color |
|--------|--------|-------|
| Cancel | Close dialog, clear reason | Default gray |
| Reverse Consumption | POST to `/api/production/work-orders/{woId}/consume/reverse` | Orange-600 |

### API Call
```typescript
POST /api/production/work-orders/{woId}/consume/reverse
Body: {
  consumption_id: string,
  reason: string
}
```

### Success State
- Toast: "Reversed consumption of {qty} {uom} from {lp_number}"
- Clears reason field
- Calls `onSuccess()` callback
- Closes dialog

### Error States

| Error | Display | HTTP Status |
|-------|---------|-------------|
| Missing reason | "Reason is required for reversal" | - |
| Permission denied | "Only Manager or Admin can reverse consumption" | 403 |
| API error | Error message from server | 4xx/5xx |

### Validation
- Reason field: Trimmed, non-empty
- Submit button disabled if reason empty or submitting

### Authorization
- Backend validates user role (Manager or Admin)
- Returns 403 if unauthorized

---

## 3. UnreserveConfirmDialog

### Purpose
Confirmation dialog for cancelling (unreserving) a material reservation. Returns LP to "available" status (Story 4.7).

### Trigger
- User clicks "Cancel" or "Unreserve" button on MaterialReservationsTable row
- Material must be in "reserved" status (not consumed)

### Component Type
AlertDialog (shadcn/ui)

### Layout

```
┌─────────────────────────────────────────────┐
│ Cancel Reservation?                      ✕  │
├─────────────────────────────────────────────┤
│ Are you sure you want to cancel this       │
│ reservation?                                │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ Material: [Material Name]               │ │
│ │ LP: [LP Number]                         │ │
│ │ Quantity: [Reserved Qty] [UOM]          │ │
│ │ Sequence: #[Sequence Number]            │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ⚠️ The LP will be released back to         │
│    "available" status.                      │
│                                             │
│       [Keep Reservation]  [Cancel Reservation]│
└─────────────────────────────────────────────┘
```

### Fields

| Field | Type | Display |
|-------|------|---------|
| Material Name | String | Read-only label |
| LP Number | String | Read-only, monospace |
| Reserved Qty | Number | Read-only, with UOM |
| Sequence Number | Number | Read-only |

### Actions

| Action | Effect | Color |
|--------|--------|-------|
| Keep Reservation | Close dialog without action | Default gray |
| Cancel Reservation | DELETE to `/api/production/work-orders/{woId}/materials/reservations/{reservationId}` | Red-600 |

### API Call
```typescript
DELETE /api/production/work-orders/{woId}/materials/reservations/{reservationId}
```

### Success State
- Toast: "Reservation for {lp_number} cancelled"
- Calls `onSuccess()` callback
- Dialog closes automatically on success

### Error States

| Error | Display |
|-------|---------|
| API error | Toast with error message (destructive) |
| Network error | "An unexpected error occurred" |

### Validation
- No user input (confirmation only)
- Submit disabled during API call

---

## 4. ByProductRegistrationDialog

### Purpose
Sequential wizard dialog for registering by-products after main output registration. Allows registering multiple by-products one at a time or skipping (Story 4.14).

### Trigger
- Automatically opens after successful main output registration
- Only if BOM has by-products defined (is_by_product = true)

### Component Type
Dialog with multi-step wizard (shadcn/ui)

### Layout

```
┌─────────────────────────────────────────────┐
│ 📦 By-Product Registration               ✕  │
│ [WO Number] - [1 of 3]                      │
├─────────────────────────────────────────────┤
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ [Product Name]                          │ │
│ │ [Product Code]                          │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ℹ️ Expected (yield [X]%): [Expected Qty]   │
│    Based on main output: [Main Qty] × [%]  │
│                                             │
│ Actual Quantity *                          │
│ ┌──────────────────────────┐               │
│ │ [Input]                  │ [UOM]         │
│ └──────────────────────────┘               │
│                                             │
│ QA Status (if enabled)                     │
│ ┌─────────────────────────────────────────┐ │
│ │ [Select: Passed/Hold/Rejected/Pending]  │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Notes                                       │
│ ┌─────────────────────────────────────────┐ │
│ │ [Textarea]                              │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ▓▓▓░░ (Progress: 2/5 completed)            │
│                                             │
│ [Skip All] [Skip This] [Register]          │
└─────────────────────────────────────────────┘
```

### Fields

| Field | Type | Required | Pre-filled | Validation |
|-------|------|----------|------------|------------|
| Product Name | String | - | Yes (from BOM) | Read-only |
| Product Code | String | - | Yes (from BOM) | Read-only |
| Expected Qty | Number | - | Calculated | Read-only (yield % × main output) |
| Actual Qty | Number | Yes | Auto-filled with expected | > 0 |
| UOM | String | - | From product | Read-only |
| QA Status | Enum | Conditional | "passed" | passed/hold/rejected/pending |
| Notes | Text | No | - | Optional |

### Actions

| Action | Effect | Color |
|--------|--------|-------|
| Skip All | Skip all remaining by-products, close dialog | Ghost gray |
| Skip This | Move to next by-product without registering | Outline |
| Register | POST to `/api/production/work-orders/{woId}/by-products`, move to next | Amber-600 |

### API Call
```typescript
POST /api/production/work-orders/{woId}/by-products
Body: {
  by_product_id: string,
  qty: number,
  qa_status: string,
  notes?: string,
  main_output_id: string
}
```

### Success State
- Toast: "{ProductName}: {LP Number}"
- Marks by-product as registered (green progress bar)
- Auto-advances to next by-product
- Closes dialog after last by-product

### Error States

| Error | Display |
|-------|---------|
| Invalid qty | "Please enter a valid quantity" |
| API error | Toast with error message (destructive) |

### Validation
- Quantity: Required, > 0
- Submit disabled if qty invalid or submitting

### Progress Tracking
- Visual progress bar showing completed/total
- Color coding:
  - Green: Registered
  - Amber: Current
  - Gray: Skipped
  - Light gray: Pending

### Special Behaviors
- Auto-loads by-products on dialog open
- Auto-fills expected quantity based on yield %
- If no by-products exist, dialog auto-closes
- Sequential workflow: Can't skip ahead

---

## 5. BOM Dialog Specifications (Technical Module)

### 5.1 BOMFormModal

### Purpose
Create new BOM or edit existing BOM. Includes auto-versioning, date range validation, routing assignment, production lines, and packaging fields.

### Trigger
- Create: Click "Create BOM" button
- Edit: Click "Edit" on BOM row in table

### Component Type
Custom Modal (fixed overlay)

### Layout

```
┌─────────────────────────────────────────────────────┐
│ [Create BOM / Edit BOM vX]                       ✕  │
│ Product: [Product Code] - [Product Name]            │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Product * (Create only)                             │
│ ┌─────────────────────────────────────────────────┐ │
│ │ [Select Product Dropdown]                       │ │
│ └─────────────────────────────────────────────────┘ │
│ ℹ️ Version will be auto-assigned                    │
│                                                     │
│ Effective From *          Effective To              │
│ ┌────────────────────┐   ┌────────────────────┐    │
│ │ [Date]             │   │ [Date]             │    │
│ └────────────────────┘   └────────────────────┘    │
│                          (Optional - leave blank)   │
│                                                     │
│ Status *                                            │
│ ┌─────────────────────────────────────────────────┐ │
│ │ [Draft/Active/Phased Out/Inactive]              │ │
│ └─────────────────────────────────────────────────┘ │
│ Draft: In development | Active: In use |            │
│ Phased Out: Being replaced | Inactive: Obsolete     │
│                                                     │
│ Output Quantity *         Output Unit *             │
│ ┌────────────────────┐   ┌────────────────────┐    │
│ │ [Number]           │   │ [Text]             │    │
│ └────────────────────┘   └────────────────────┘    │
│ Quantity and unit this BOM produces (e.g., 1 kg)    │
│                                                     │
│ Routing                                             │
│ ┌─────────────────────────────────────────────────┐ │
│ │ [Select Routing / No routing]                   │ │
│ └─────────────────────────────────────────────────┘ │
│ Assign a routing to define production operations    │
│                                                     │
│ Production Lines                                    │
│ ┌─────────────────────────────────────────────────┐ │
│ │ ☑️ Line A (Warehouse 1)     [Labor $/hr: __]    │ │
│ │ ☐ Line B (Warehouse 2)                          │ │
│ │ ☑️ Line C (Warehouse 1)     [Labor $/hr: __]    │ │
│ └─────────────────────────────────────────────────┘ │
│ Select which production lines can produce this BOM  │
│                                                     │
│ Units per Box            Boxes per Pallet           │
│ ┌────────────────────┐   ┌────────────────────┐    │
│ │ [Number]           │   │ [Number]           │    │
│ └────────────────────┘   └────────────────────┘    │
│ = [Calculated] units/pallet                         │
│                                                     │
│ Notes                                               │
│ ┌─────────────────────────────────────────────────┐ │
│ │ [Textarea]                                      │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ [Cancel]  [Create BOM / Update BOM]                 │
└─────────────────────────────────────────────────────┘
```

### Fields

| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| Product | Select | Yes (create) | Must exist | Disabled in edit mode |
| Effective From | Date | Yes | Valid date | Defaults to today |
| Effective To | Date | No | > Effective From | Optional |
| Status | Enum | Yes | Draft/Active/Phased Out/Inactive | Default: Draft |
| Output Qty | Number | Yes | > 0 | Step: 0.001 |
| Output UoM | String | Yes | Not empty | Auto-filled from product |
| Routing | Select | No | Valid routing ID or null | Optional |
| Production Lines | Checkbox array | No | - | Multi-select with labor cost |
| Labor Cost/hr | Number | No | ≥ 0 | Per line, optional |
| Units per Box | Number | No | 1-10000 | Optional packaging |
| Boxes per Pallet | Number | No | 1-200 | Optional packaging |
| Notes | Text | No | - | Optional |

### Actions

| Action | Method | Endpoint |
|--------|--------|----------|
| Create BOM | POST | `/api/technical/boms` |
| Update BOM | PUT | `/api/technical/boms/{id}` |
| Save Lines | PUT | `/api/technical/boms/{id}/lines` |

### Success State
- Toast: "BOM created/updated successfully"
- Calls `onSuccess()` callback
- Closes modal

### Error States

| Error | Display | Code |
|-------|---------|------|
| Date overlap | "Date range overlaps with existing BOM" | BOM_DATE_OVERLAP |
| Validation error | Field-specific error messages | - |
| API error | Generic error message | - |

### Validation
- Zod schema: CreateBOMSchema / UpdateBOMSchema
- Real-time field validation with error display
- Submit disabled during API call

### Special Features
- Auto-fill output_uom from selected product
- Calculate units/pallet = units_per_box × boxes_per_pallet
- Conditional production line labor cost input

---

### 5.2 BOMItemFormModal

### Purpose
Add new item to BOM or edit existing item. Supports inputs (materials), outputs (main product), by-products, and conditional items (Story 2.12, 2.13, 2.26).

### Trigger
- Create: Click "Add Item" button in BOM details
- Edit: Click "Edit" on BOM item row

### Component Type
Custom Modal (scrollable)

### Layout

```
┌─────────────────────────────────────────────────────┐
│ [Add BOM Item / Edit BOM Item]                   ✕  │
│ Component: [Component Code] - [Component Name]      │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Component Product * (Create only)                   │
│ ┌─────────────────────────────────────────────────┐ │
│ │ [Select: Badge Product Code - Name]             │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ Operation Sequence *                                │
│ ┌─────────────────────────────────────────────────┐ │
│ │ [Number: 1-999]                                 │ │
│ └─────────────────────────────────────────────────┘ │
│ Routing operation this item is consumed/produced at│
│                                                     │
│ Quantity *                Unit of Measure *         │
│ ┌────────────────────┐   ┌────────────────────┐    │
│ │ [Number]           │   │ [Text]             │    │
│ └────────────────────┘   └────────────────────┘    │
│                                                     │
│ Scrap %                  Display Sequence           │
│ ┌────────────────────┐   ┌────────────────────┐    │
│ │ [0-100]            │   │ [Auto-assigned]    │    │
│ └────────────────────┘   └────────────────────┘    │
│ Expected waste %         (Create only)              │
│                                                     │
│ ☐ Output Item (by-product or main output)          │
│ ☐ Consume Whole License Plate (LP)                 │
│                                                     │
│ ─────────────────────────────────────────────────   │
│ ☑️ By-Product (output produced alongside main)      │
│                                                     │
│   Yield Percent *                                   │
│   ┌─────────────────────────────────────────────┐  │
│   │ [0-100]                                     │  │
│   └─────────────────────────────────────────────┘  │
│   Expected yield as % of main output                │
│   (e.g., 5% = 5kg per 100kg main output)            │
│                                                     │
│ ─────────────────────────────────────────────────   │
│ Conditional Flags (Story 2.12)                      │
│ ┌─────────────────────────────────────────────────┐ │
│ │ [organic, vegan, kosher]                        │ │
│ └─────────────────────────────────────────────────┘ │
│ Comma-separated flags. Item only consumed when WO   │
│ matches these conditions.                           │
│                                                     │
│   Match Logic:                                      │
│   ⦿ AND (all flags must match)                      │
│   ○ OR (any flag matches)                           │
│                                                     │
│ Notes                                               │
│ ┌─────────────────────────────────────────────────┐ │
│ │ [Textarea]                                      │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ [Cancel]  [Add Item / Update Item]                  │
└─────────────────────────────────────────────────────┘
```

### Fields

| Field | Type | Required | Validation | Default |
|-------|------|----------|------------|---------|
| Component | Select | Yes (create) | Valid product ID | - |
| Operation Seq | Number | Yes | ≥ 1 | 1 |
| Quantity | Number | Yes | > 0 | - |
| UoM | String | Yes | Not empty | Auto from product |
| Scrap % | Number | No | 0-100 | 0 |
| Sequence | Number | No (create) | ≥ 1 | Auto-assigned |
| Is Output | Boolean | No | - | false |
| Consume Whole LP | Boolean | No | - | false |
| Is By-Product | Boolean | No | - | false |
| Yield % | Number | Conditional | 0-100 (if by-product) | - |
| Condition Flags | String | No | Comma-separated | - |
| Condition Logic | Enum | No | AND/OR | AND |
| Notes | Text | No | - | - |

### Actions

| Action | Method | Endpoint |
|--------|--------|----------|
| Create Item | POST | `/api/technical/boms/{bomId}/items` |
| Update Item | PUT | `/api/technical/boms/{bomId}/items/{itemId}` |

### Success State
- Toast: "Item added/updated successfully"
- Calls `onSuccess()` callback
- Closes modal

### Error States
- Field-level validation errors displayed inline
- API errors shown in toast (destructive)

### Validation
- Custom validation logic (not Zod in current implementation)
- Real-time error clearing on field change
- Submit disabled if validation fails

### Special Features
- Auto-fill UoM from selected component product
- Conditional yield % field (only visible if is_by_product = true)
- Conditional logic radio buttons (only visible if condition_flags non-empty)
- Product selector shows type badge (RM/FG/PR)

---

## Common Design Patterns

### Color System
- **Confirm/Success**: Green-600 (#10B981)
- **Warning/Caution**: Orange/Amber-600 (#F59E0B)
- **Danger/Delete**: Red-600 (#DC2626)
- **Cancel/Neutral**: Gray-600 (#4B5563)

### Button Labels
- Positive actions: Right side, colored
- Cancel: Left side, outline or ghost
- Destructive actions: Red background

### Loading States
- Spinner icon (Loader2) with "Saving..." or "Processing..."
- Disable all buttons during submission
- Prevent dialog close during submission

### Toast Notifications
- Success: Default toast with green checkmark
- Error: Destructive variant with red styling
- Include specific details (LP number, qty, etc.)

### Accessibility
- All dialogs closable with Escape key
- Focus management (auto-focus first input)
- ARIA labels on interactive elements
- Keyboard navigation support

---

## Implementation Notes

### Dependencies
- shadcn/ui: AlertDialog, Dialog, Button, Input, Label, Textarea, Select, Checkbox
- lucide-react: Icons (Loader2, AlertCircle, AlertTriangle, Package, etc.)
- React hooks: useState, useEffect
- useToast hook for notifications

### State Management
- Local component state (useState)
- Form validation in component
- API calls with fetch
- Parent callbacks for success (onSuccess)

### Error Handling
- Try-catch on all API calls
- Display errors in toast
- Log errors to console
- Preserve dialog state on error

---

## Future Enhancements

1. **Form Libraries**: Consider react-hook-form + Zod for standardized validation
2. **Optimistic Updates**: Update UI before API response
3. **Undo Actions**: Allow undo within 5 seconds for reversals
4. **Audit Trail Links**: Click to view full audit history
5. **Bulk Actions**: Multi-select dialogs for batch operations
6. **Mobile Optimization**: Touch-friendly larger buttons
