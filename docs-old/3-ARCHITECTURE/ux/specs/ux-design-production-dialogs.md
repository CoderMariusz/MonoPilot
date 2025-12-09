# UX Design Specification: Production Dialogs (Stories 4.9-4.14)

**Project**: MonoPilot MES
**Module**: Production Module - Consumption & Output Dialogs
**Version**: 1.0
**Date**: 2025-12-07
**Status**: Ready for Implementation

---

## Overview

This document specifies the UX design for 4 confirmation dialogs used in material consumption and output registration workflows (Batch 04B-1 and 04B-2).

**Dialogs Covered**:
1. ConsumeConfirmDialog (Story 4.9)
2. ReverseConsumptionDialog (Story 4.10)
3. UnreserveConfirmDialog (Story 4.7)
4. ByProductRegistrationDialog (Story 4.14)

---

## 1. ConsumeConfirmDialog

**Purpose**: Confirm material consumption from a reserved LP
**Trigger**: User clicks "Consume" button on MaterialReservationsTable
**Story**: 4.9 - 1:1 Consumption Enforcement
**Location**: `apps/frontend/components/production/ConsumeConfirmDialog.tsx`

### Fields

| Field | Type | Required | Display |
|-------|------|----------|---------|
| Material | Display only | - | Product name |
| LP | Display only | - | License plate number (monospace font) |
| Quantity | Display only | - | Reserved quantity + UOM (monospace font) |
| Sequence | Display only | - | Sequence number (#N) |
| Whole LP Warning | Conditional Alert | - | Orange alert if `consume_whole_lp = true` |

### Actions

| Button | Style | Behavior |
|--------|-------|----------|
| Cancel | Secondary (gray) | Close dialog without action |
| Confirm Consumption | Primary (green, bg-green-600) | Submit consumption, show loading state |

### States

**Loading**:
- Spinner on "Confirm Consumption" button
- Both buttons disabled

**Error**:
- Toast notification (red, top-right corner)
- Display API error message

**Success**:
- Toast notification (green): "Consumed {qty} {uom} from {lp_number}"
- Close dialog
- Refresh parent MaterialReservationsTable

### Validation

- None (quantity is pre-filled from reservation record)

### API Call

```
POST /api/production/work-orders/{woId}/consume
Body: { reservation_id, qty }
```

### UX Notes

**Layout**:
- Pre-filled summary in gray background box (bg-gray-50, rounded-lg)
- Blue info message: "This action will deduct the quantity from the LP and mark it as consumed"
- Orange warning box (conditional): Shows if `consume_whole_lp = true` with AlertCircle icon

**Colors**:
- Summary box: `bg-gray-50`
- Info message: `text-blue-600`
- Warning box: `bg-orange-50 border-orange-200 text-orange-800`
- Confirm button: `bg-green-600 hover:bg-green-700`

**Keyboard Navigation**:
- Enter: Confirm consumption
- Escape: Cancel (close dialog)

**Accessibility**:
- AlertDialog from shadcn/ui (ARIA compliant)
- Focus trap within dialog
- Clear action distinction (destructive vs. safe)

### Wireframe

```
┌─────────────────────────────────────────┐
│ Confirm Consumption              [×]    │
├─────────────────────────────────────────┤
│ Are you sure you want to consume this  │
│ reserved material?                      │
│                                         │
│ ┌───────────────────────────────────┐  │
│ │ Material: Beef Trimmings 80/20    │  │
│ │ LP: LP-2025-001234                │  │
│ │ Quantity: 125.50 kg               │  │
│ │ Sequence: #1                      │  │
│ └───────────────────────────────────┘  │
│                                         │
│ ⚠️ Whole LP consumption required -     │
│    entire quantity will be consumed    │
│                                         │
│ ℹ️ This action will deduct the         │
│    quantity from the LP and mark it    │
│    as consumed.                        │
│                                         │
│           [Cancel] [Confirm Consumption]│
└─────────────────────────────────────────┘
```

---

## 2. ReverseConsumptionDialog

**Purpose**: Reverse a consumption record (Manager/Admin only)
**Trigger**: User clicks "Reverse" on ConsumptionHistoryTable
**Story**: 4.10 - Consumption Correction
**Location**: `apps/frontend/components/production/ReverseConsumptionDialog.tsx`

### Fields

| Field | Type | Required | Display |
|-------|------|----------|---------|
| Material | Display only | - | Product name |
| LP | Display only | - | License plate number (monospace font) |
| Quantity | Display only | - | Consumed quantity + UOM (monospace font) |
| Consumed at | Display only | - | Timestamp (formatted: "Nov 27, 2025, 02:45 PM") |
| Reason | Textarea | Yes | Max 500 chars, placeholder "Enter reason..." |

### Actions

| Button | Style | Behavior |
|--------|-------|----------|
| Cancel | Secondary (gray) | Clear reason field + close dialog |
| Reverse Consumption | Destructive (orange, bg-orange-600) | Submit reversal, show loading state |

### States

**Loading**:
- Spinner on "Reverse Consumption" button
- Both buttons disabled

**Error (inline)**:
- Red alert box above buttons
- 403: "Only Manager or Admin can reverse consumption"
- Other: Display API error message

**Success**:
- Toast notification (green): "Reversed consumption of {qty} {uom} from {lp_number}"
- Clear reason field
- Close dialog
- Refresh parent ConsumptionHistoryTable

### Validation

**Client-side**:
- Reason required: Disable "Reverse Consumption" button if empty
- Clear error on input

**Server-side**:
- 403 if user role is not Manager or Admin

### API Call

```
POST /api/production/work-orders/{woId}/consume/reverse
Body: { consumption_id, reason }
```

### UX Notes

**Layout**:
- Title with warning triangle icon (AlertTriangle, orange)
- Pre-filled summary in gray background box
- Reason textarea (required, red asterisk)
- Orange warning box: "The LP quantity will be restored and status changed back to 'reserved'. This action is logged for audit compliance."

**Colors**:
- Title icon: `text-orange-500`
- Summary box: `bg-gray-50`
- Warning box: `bg-orange-50 border-orange-200 text-orange-800`
- Error box: `bg-red-50 border-red-200 text-red-800`
- Reverse button: `bg-orange-600 hover:bg-orange-700`

**Keyboard Navigation**:
- Enter: Reverse consumption (if reason is filled)
- Escape: Cancel (close dialog)
- Tab: Move between reason field and buttons

**Accessibility**:
- Required field marked with asterisk and aria-required
- Error messages linked to textarea via aria-describedby
- Clear warning about audit log (compliance requirement)

### Wireframe

```
┌─────────────────────────────────────────┐
│ ⚠️ Reverse Consumption?           [×]   │
├─────────────────────────────────────────┤
│ Are you sure you want to reverse this  │
│ consumption record?                     │
│                                         │
│ ┌───────────────────────────────────┐  │
│ │ Material: Beef Trimmings 80/20    │  │
│ │ LP: LP-2025-001234                │  │
│ │ Quantity: 125.50 kg               │  │
│ │ Consumed at: Nov 27, 2025, 02:45  │  │
│ └───────────────────────────────────┘  │
│                                         │
│ Reason for reversal *                  │
│ ┌───────────────────────────────────┐  │
│ │ [Reason text area, 3 rows]        │  │
│ │                                   │  │
│ └───────────────────────────────────┘  │
│                                         │
│ ⚠️ Warning: The LP quantity will be    │
│    restored and status changed back    │
│    to "reserved". This action is       │
│    logged for audit compliance.        │
│                                         │
│           [Cancel] [Reverse Consumption]│
└─────────────────────────────────────────┘
```

---

## 3. UnreserveConfirmDialog

**Purpose**: Cancel a material reservation and release LP back to "available"
**Trigger**: User clicks "Unreserve" button on MaterialReservationsTable
**Story**: 4.7 - Material Reservation (Desktop)
**Location**: `apps/frontend/components/production/UnreserveConfirmDialog.tsx`

### Fields

| Field | Type | Required | Display |
|-------|------|----------|---------|
| Material | Display only | - | Product name |
| LP | Display only | - | License plate number (monospace font) |
| Quantity | Display only | - | Reserved quantity + UOM (monospace font) |
| Sequence | Display only | - | Sequence number (#N) |

### Actions

| Button | Style | Behavior |
|--------|-------|----------|
| Keep Reservation | Secondary (gray) | Close dialog without action |
| Cancel Reservation | Destructive (red, bg-red-600) | Delete reservation, show loading state |

### States

**Loading**:
- Spinner on "Cancel Reservation" button
- Both buttons disabled

**Error**:
- Toast notification (red, top-right corner)
- Display API error message

**Success**:
- Toast notification (green): "Reservation for {lp_number} cancelled"
- Close dialog
- Refresh parent MaterialReservationsTable

### Validation

- None (simple deletion action)

### API Call

```
DELETE /api/production/work-orders/{woId}/materials/reservations/{reservationId}
```

### UX Notes

**Layout**:
- Pre-filled summary in gray background box
- Orange info message: "The LP will be released back to 'available' status."

**Colors**:
- Summary box: `bg-gray-50`
- Info message: `text-orange-600`
- Cancel button: `bg-red-600 hover:bg-red-700`

**Keyboard Navigation**:
- Enter: Cancel reservation
- Escape: Keep reservation (close dialog)

**Accessibility**:
- Clear distinction between "Keep" (safe) and "Cancel" (destructive)
- Destructive action uses red color and clear label

### Wireframe

```
┌─────────────────────────────────────────┐
│ Cancel Reservation?              [×]    │
├─────────────────────────────────────────┤
│ Are you sure you want to cancel this   │
│ reservation?                            │
│                                         │
│ ┌───────────────────────────────────┐  │
│ │ Material: Beef Trimmings 80/20    │  │
│ │ LP: LP-2025-001234                │  │
│ │ Quantity: 125.50 kg               │  │
│ │ Sequence: #1                      │  │
│ └───────────────────────────────────┘  │
│                                         │
│ ⚠️ The LP will be released back to     │
│    "available" status.                 │
│                                         │
│    [Keep Reservation] [Cancel Reservation]│
└─────────────────────────────────────────┘
```

---

## 4. ByProductRegistrationDialog

**Purpose**: Sequential dialog for registering by-products after main output
**Trigger**: Auto-opens after successful main output registration (if by-products exist)
**Story**: 4.14 - By-Product Registration
**Location**: `apps/frontend/components/production/ByProductRegistrationDialog.tsx`

### Fields (per by-product)

| Field | Type | Required | Display |
|-------|------|----------|---------|
| Product Info | Display only | - | Product name + code (amber background box) |
| Expected Quantity | Display only | - | Calculated: `mainOutputQty × yieldPercent` (gray alert box) |
| Actual Quantity | Number input | Yes | Step 0.01, min 0.01, auto-filled with expected qty |
| QA Status | Select dropdown | Conditional | Options: Passed, Hold, Rejected, Pending (only if `requireQaStatus = true`) |
| Notes | Textarea | No | 2 rows, placeholder "Optional notes..." |

### Actions

| Button | Style | Position | Behavior |
|--------|-------|----------|----------|
| Skip All | Ghost (gray text) | Left | Skip all remaining by-products, close dialog |
| Skip This | Outline | Center | Skip current by-product, move to next |
| Register | Primary (amber, bg-amber-600) | Right | Submit current by-product, show loading state |

### States

**Loading (initial)**:
- Spinner on screen while fetching by-products from API

**Submitting**:
- Spinner on "Register" button
- All buttons disabled

**Error**:
- Toast notification (red, top-right corner)
- Display API error message

**Success**:
- Toast notification (green): "{productName}: {lpNumber}"
- Mark current by-product as registered
- Auto-fill next by-product form
- Move to next by-product

**All Done**:
- Green checkmark icon (CheckCircle2)
- Message: "All by-products processed!"
- "Done" button to close dialog

**Empty State**:
- If no by-products found, auto-close dialog immediately

### Validation

**Client-side**:
- Quantity required: Disable "Register" button if empty or ≤ 0

### API Calls

**Fetch by-products**:
```
GET /api/production/work-orders/{woId}/by-products
Response: { data: [{ id, productId, productCode, productName, yieldPercent, registeredQty, uom }] }
```

**Register by-product**:
```
POST /api/production/work-orders/{woId}/by-products
Body: { by_product_id, qty, qa_status, notes, main_output_id }
Response: { data: { output: { lpNumber } } }
```

### UX Notes

**Sequential Workflow (AC-4.14.1)**:
- One by-product at a time
- Progress indicator at bottom
- Auto-advance to next after successful registration

**Progress Indicator**:
- Horizontal bars (height 1.5, rounded-full)
- Colors:
  - Green: Registered by-products
  - Amber: Current by-product
  - Gray: Pending by-products

**Expected Qty Calculation (AC-4.14.7)**:
- Shown in gray Alert component
- Formula displayed: "Based on main output: {mainOutputQty} × {yieldPercent}%"
- Auto-fills actual quantity field

**Skip Behavior (AC-4.14.6)**:
- "Skip This": Move to next by-product, form resets
- "Skip All": Close dialog immediately, call `onComplete()`

**Auto-Close**:
- If `byProducts.length === 0`, close dialog automatically

**Amber Theme**:
- Matches by-product concept (distinct from main output green)
- Consistent with production color scheme

**Keyboard Navigation**:
- Enter: Register (if qty valid)
- Escape: Skip All (close dialog)
- Tab: Move between fields

**Accessibility**:
- Clear progress indication
- Required fields marked
- Auto-focus on quantity input for each by-product

### Dialog Header

**Title**: "By-Product Registration" with Package icon (amber, lucide-react)
**Description**: "{woNumber} - {currentIndex + 1} of {byProducts.length}"

Example: "WO-0105 - 1 of 3"

### Progress Example (3 by-products)

```
[████████ Green] [████████ Amber] [░░░░░░░░ Gray]
     BP1              BP2              BP3
 (registered)      (current)        (pending)
```

### Wireframe

```
┌─────────────────────────────────────────┐
│ 📦 By-Product Registration       [×]    │
│ WO-0105 - 1 of 3                        │
├─────────────────────────────────────────┤
│ ┌───────────────────────────────────┐  │
│ │ Pork Fat Trimmings                │  │
│ │ PRD-BP-001                        │  │
│ └───────────────────────────────────┘  │
│                                         │
│ ℹ️ Expected (yield 5%):                │
│    12.50 kg                            │
│    Based on main output: 250.00 × 5%  │
│                                         │
│ Actual Quantity *                      │
│ [12.50          ] kg                   │
│                                         │
│ QA Status                               │
│ [Passed ▼                          ]   │
│                                         │
│ Notes                                   │
│ ┌───────────────────────────────────┐  │
│ │ [Optional notes, 2 rows]          │  │
│ └───────────────────────────────────┘  │
│                                         │
│ [████ Green][████ Amber][░░░░ Gray]    │
│                                         │
│ [⏭️ Skip All] [Skip This] [Register]   │
└─────────────────────────────────────────┘
```

---

## Design Patterns

### Common Elements

**All dialogs use**:
- shadcn/ui AlertDialog or Dialog components
- Consistent spacing (p-3 for boxes, space-y-3 for sections)
- Monospace font for LP numbers and quantities
- Gray background boxes (bg-gray-50) for summary information
- Toast notifications for success/error feedback
- Loading spinners from lucide-react (Loader2, h-4 w-4, mr-2 animate-spin)
- Keyboard shortcuts (Enter to confirm, Escape to cancel)

### Color Coding

| Action Type | Color | Class |
|-------------|-------|-------|
| Confirm/Save | Green | bg-green-600 hover:bg-green-700 |
| Warning/Reverse | Orange | bg-orange-600 hover:bg-orange-700 |
| Delete/Cancel | Red | bg-red-600 hover:bg-red-700 |
| By-Product | Amber | bg-amber-600 hover:bg-amber-700 |
| Neutral | Gray | bg-gray-600 hover:bg-gray-700 |

### Information Boxes

| Type | Style |
|------|-------|
| Summary | bg-gray-50 rounded-lg p-3 space-y-1 text-sm |
| Info (blue) | text-blue-600 |
| Warning (orange) | bg-orange-50 border border-orange-200 text-orange-800 |
| Error (red) | bg-red-50 border border-red-200 text-red-800 |
| Expected qty (gray) | Alert component (shadcn/ui) |

### Typography

| Element | Style |
|---------|-------|
| Labels | text-gray-500 |
| Values | font-medium or font-mono |
| LP Numbers | font-mono |
| Quantities | font-mono |
| Product Codes | font-mono text-xs |
| Timestamps | Regular font, formatted |

---

## Implementation Checklist

### ConsumeConfirmDialog
- [x] Component created
- [x] API integration
- [x] Loading states
- [x] Error handling
- [x] Success toast
- [x] Whole LP warning (conditional)
- [x] Keyboard navigation
- [ ] Unit tests
- [ ] E2E tests

### ReverseConsumptionDialog
- [x] Component created
- [x] API integration
- [x] Loading states
- [x] Inline error handling
- [x] 403 permission check
- [x] Reason required validation
- [x] Success toast
- [x] Audit log warning
- [x] Keyboard navigation
- [ ] Unit tests
- [ ] E2E tests

### UnreserveConfirmDialog
- [x] Component created
- [x] API integration (DELETE)
- [x] Loading states
- [x] Error handling
- [x] Success toast
- [x] Destructive action warning
- [x] Keyboard navigation
- [ ] Unit tests
- [ ] E2E tests

### ByProductRegistrationDialog
- [x] Component created
- [x] API integration (fetch + register)
- [x] Loading states
- [x] Sequential workflow
- [x] Progress indicator
- [x] Expected qty calculation
- [x] Auto-fill quantity
- [x] Skip This / Skip All
- [x] QA Status (conditional)
- [x] Success toast with LP number
- [x] All Done state
- [x] Empty state (auto-close)
- [x] Keyboard navigation
- [ ] Unit tests
- [ ] E2E tests

---

## Related Documentation

- Main Production Module UX: `docs/3-ARCHITECTURE/ux/specs/ux-design-production-module.md`
- Story 4.7: Material Reservation (Desktop)
- Story 4.9: 1:1 Consumption Enforcement
- Story 4.10: Consumption Correction
- Story 4.14: By-Product Registration
- Shared UI System: `docs/3-ARCHITECTURE/ux/specs/ux-design-shared-system.md`
- API Documentation: `docs/3-ARCHITECTURE/api/`

---

**Version History**:
- 1.0 (2025-12-07): Initial documentation based on implemented components
