# WH-RES-002: Reserve Modal

**Story**: 05.3 - LP Reservations + FIFO/FEFO Picking
**Component**: `ReserveLPsModal.tsx`
**Pattern**: ShadCN Dialog confirmation modal
**States**: Loading, Success, Error

---

## Purpose
Confirmation modal before creating LP reservations for a Work Order material. Shows summary of selected LPs and allocation details.

---

## Layout

### Success State (Confirmation View)

```
┌─────────────────────────────────────────────────────────────────┐
│ Confirm Reservation                                           × │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Reserve license plates for WO-00123?                            │
│                                                                 │
│ Work Order: WO-00123 - Batch Production                         │
│ Material: Flour - Type 550 (Wheat)                              │
│ Required: 100 kg                                                │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Selected License Plates (3):                                │ │
│ │                                                             │ │
│ │ ┌─────────────────────────────────────────────────────────┐ │ │
│ │ │ LP #       Batch    Location  Qty     Expiry            │ │ │
│ │ ├─────────────────────────────────────────────────────────┤ │ │
│ │ │ LP-00123   B-4501   A1-01     40 kg   2026-06-15        │ │ │
│ │ │ LP-00124   B-4502   A1-02     50 kg   2026-07-20        │ │ │
│ │ │ LP-00125   B-4503   A2-01     10 kg   2026-08-10        │ │ │
│ │ └─────────────────────────────────────────────────────────┘ │ │
│ │                                                             │ │
│ │ Total Reserved: 100 kg ✓                                    │ │
│ │ Shortfall: 0 kg                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ✓ Picking Strategy: FIFO (oldest first)                        │
│                                                                 │
│ ⚠ Warnings (if applicable):                                    │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ • LP-00125 expires in 30 days (2026-08-10)                  │ │
│ │ • Partial allocation from LP-00125 (10 kg of 60 kg)         │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ℹ️ Once reserved, these LPs will not be available for other    │
│   work orders until released or consumed.                      │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                           [Cancel]  [Confirm Reservation]       │
└─────────────────────────────────────────────────────────────────┘
```

**Key Elements**:
- **Header**: "Confirm Reservation"
- **WO Context**: WO number, name, material
- **Required Qty**: Material requirement
- **Selected LPs Table**: LP number, batch, location, qty, expiry
- **Total Summary**: Total reserved, shortfall (if any)
- **Strategy Badge**: FIFO/FEFO indicator
- **Warnings**: Expiry warnings, partial allocation notices
- **Info Note**: Explanation of reservation impact
- **Footer**: Cancel and Confirm buttons

**Interactions**:
- **Cancel**: Close modal without creating reservations
- **Confirm Reservation**: Submit reservation, show loading state

---

### Loading State (After Confirm Clicked)

```
┌─────────────────────────────────────────────────────────────────┐
│ Confirm Reservation                                           × │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │                                                             │ │
│ │                    🔄 Creating Reservations...              │ │
│ │                                                             │ │
│ │                Reserving 3 license plates                   │ │
│ │                                                             │ │
│ │             ████████████████████░░░░░░░░ 80%                │ │
│ │                                                             │ │
│ │     ✓ LP-00123 reserved (40 kg)                             │ │
│ │     ✓ LP-00124 reserved (50 kg)                             │ │
│ │     ⏳ LP-00125 reserving... (10 kg)                        │ │
│ │                                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                         [Cancel disabled]       │
└─────────────────────────────────────────────────────────────────┘
```

**Displays**:
- Spinner icon
- "Creating Reservations..." message
- Progress bar (if multiple LPs)
- Per-LP status (✓ done, ⏳ in progress)
- Cancel button disabled during submission

---

### Success State (Reservation Created)

```
┌─────────────────────────────────────────────────────────────────┐
│ Reservation Successful                                        × │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │                                                             │ │
│ │                           ✅                                 │ │
│ │                                                             │ │
│ │              Reservations Created Successfully              │ │
│ │                                                             │ │
│ │     3 license plates reserved for WO-00123                  │ │
│ │     Total: 100 kg                                           │ │
│ │                                                             │ │
│ │     ✓ LP-00123 (40 kg) - Batch B-4501                       │ │
│ │     ✓ LP-00124 (50 kg) - Batch B-4502                       │ │
│ │     ✓ LP-00125 (10 kg) - Batch B-4503                       │ │
│ │                                                             │ │
│ │     Reservation ID: RES-00456                               │ │
│ │     Reserved at: 2026-01-02 14:35:00                        │ │
│ │     Reserved by: John Smith                                 │ │
│ │                                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                    [View Reservations]  [Close]                 │
└─────────────────────────────────────────────────────────────────┘
```

**Displays**:
- Success checkmark icon
- "Reservations Created Successfully" heading
- Summary: LP count, total qty, WO number
- List of reserved LPs with batches
- Reservation metadata (ID, timestamp, user)
- **Actions**: "View Reservations" (navigate to WO reservations panel), "Close"

**Auto-close**: Modal auto-closes after 3 seconds, or user clicks Close

---

### Error State (Reservation Failed)

```
┌─────────────────────────────────────────────────────────────────┐
│ Reservation Failed                                            × │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │                                                             │ │
│ │                           ❌                                 │ │
│ │                                                             │ │
│ │              Failed to Create Reservations                  │ │
│ │                                                             │ │
│ │     Error: Insufficient available quantity on LP-00125      │ │
│ │                                                             │ │
│ │     Details:                                                │ │
│ │     • LP-00125 requested: 10 kg                             │ │
│ │     • LP-00125 available: 5 kg (already reserved)           │ │
│ │                                                             │ │
│ │     Another work order may have reserved this LP while      │ │
│ │     you were selecting. Please try again.                   │ │
│ │                                                             │ │
│ │     Error Code: WH-RES-002-INSUFFICIENT-QTY                 │ │
│ │                                                             │ │
│ │              [Try Again]  [Select Different LPs]            │ │
│ │                                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                         [Close]                 │
└─────────────────────────────────────────────────────────────────┘
```

**Displays**:
- Error X icon
- "Failed to Create Reservations" heading
- Specific error message (e.g., insufficient qty, LP not available)
- **Details**: Which LP failed, why (concurrent reservation, status change)
- Explanation (race condition, LP consumed/blocked)
- Error code for support
- **Actions**: "Try Again" (retry same LPs), "Select Different LPs" (reopen picker), "Close"

**Common Errors**:
- Insufficient available quantity (race condition)
- LP status changed (became blocked/consumed)
- LP expired (time passed between selection and confirm)
- Network timeout
- Permission denied (RLS policy)

---

## Partial Allocation Scenario

```
┌─────────────────────────────────────────────────────────────────┐
│ Confirm Reservation (Partial Allocation)                      × │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Reserve license plates for WO-00123?                            │
│                                                                 │
│ Work Order: WO-00123 - Batch Production                         │
│ Material: Flour - Type 550 (Wheat)                              │
│ Required: 100 kg                                                │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Selected License Plates (2):                                │ │
│ │                                                             │ │
│ │ ┌─────────────────────────────────────────────────────────┐ │ │
│ │ │ LP #       Batch    Location  Qty     Expiry            │ │ │
│ │ ├─────────────────────────────────────────────────────────┤ │ │
│ │ │ LP-00123   B-4501   A1-01     40 kg   2026-06-15        │ │ │
│ │ │ LP-00124   B-4502   A1-02     30 kg   2026-07-20        │ │ │
│ │ └─────────────────────────────────────────────────────────┘ │ │
│ │                                                             │ │
│ │ Total Reserved: 70 kg                                       │ │
│ │ Shortfall: 30 kg ⚠️                                          │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ⚠️ Warning: Partial Allocation                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Only 70 kg of 100 kg required can be reserved.              │ │
│ │                                                             │ │
│ │ You will need to:                                           │ │
│ │ • Reserve additional 30 kg when inventory arrives           │ │
│ │ • Adjust WO material requirement                            │ │
│ │ • Split WO into multiple batches                            │ │
│ │                                                             │ │
│ │ Continue with partial reservation?                          │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                [Cancel]  [Reserve Partial (70 kg)]              │
└─────────────────────────────────────────────────────────────────┘
```

**Displays**:
- Shortfall highlighted in orange/red
- Warning badge: "Partial Allocation"
- Explanation of shortfall
- **Next steps**: What to do about shortage
- **Confirmation**: Explicit "Continue with partial reservation?"
- Button shows qty: "Reserve Partial (70 kg)"

---

## Component Props

```typescript
interface ReserveLPsModalProps {
  open: boolean;
  woId: string;
  woNumber: string;
  woName: string;
  materialId: string;
  materialName: string;
  requiredQty: number;
  uom: string;
  selections: LPSelection[];
  strategy: 'fifo' | 'fefo' | 'none';
  totalReserved: number;
  shortfall: number;
  warnings?: string[];
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

interface LPSelection {
  lpId: string;
  lpNumber: string;
  reservedQty: number;
  batch: string | null;
  expiryDate: string | null;
  location: string;
}
```

---

## Accessibility (WCAG 2.1 AA)

| Requirement | Implementation |
|-------------|----------------|
| Keyboard Nav | Tab through buttons, Esc to close |
| Screen Reader | ARIA labels: "Reservation summary: 100 kg from 3 LPs" |
| Focus Indicators | 2px blue outline on focus |
| Focus Trap | Focus locked in modal (no background interaction) |
| Touch Targets | 48x48dp buttons |
| ARIA Roles | role="dialog", aria-labelledby="modal-title" |
| Live Region | Loading/success/error states announced |

---

## Business Rules

1. **Summary Validation**: Total reserved = sum of selected LPs
2. **Shortfall Calculation**: shortfall = required_qty - total_reserved
3. **Partial Allowed**: User can confirm with shortfall > 0
4. **Warnings**: Show expiry < 30 days, partial LP usage
5. **Race Condition**: Handle concurrent reservation errors gracefully
6. **Atomic**: All reservations succeed or all fail (rollback on error)
7. **Success Redirect**: Option to view reservations panel after creation
8. **Auto-close**: Success modal auto-closes after 3s

---

## Technical Notes

- **Service Call**: `reserveLPs(woId, materialId, productId, requiredQty, selections)`
- **Transaction**: Use database transaction for multi-LP reservation
- **Optimistic Lock**: Check available_qty immediately before reservation
- **Error Handling**: Specific messages for insufficient qty, status changes
- **Toast Notification**: Show toast on success/error in addition to modal

---

## Next Steps

After WH-RES-002, create:
- **WH-RES-003**: WO Reservations Panel
- **WH-RES-004**: Release Modal
- **WH-RES-005**: All Reservations List
