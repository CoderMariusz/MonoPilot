# Scanner Move Workflow Guide

**Story:** 05.20 - Scanner Move Workflow
**Version:** 1.0
**Last Updated:** 2026-01-21

## Overview

This guide explains how to use the Scanner Move workflow to relocate License Plates between warehouse locations using barcode scanning. The workflow is optimized for industrial handheld scanners and mobile devices.

**Who is this for:**
- Warehouse operators moving inventory
- Warehouse managers overseeing inventory movements
- Frontend developers integrating the move workflow
- QA engineers testing scanner functionality

---

## What You Can Do

The Scanner Move workflow allows you to:

1. **Move LPs between locations** - Relocate inventory from one warehouse location to another
2. **Track movements** - Each move creates a stock_move record for audit trail
3. **Validate before moving** - Pre-check LP and destination validity
4. **View recent moves** - Quick access to your recent move history

---

## Prerequisites

Before you can move an LP:

1. **LP must be "available"** - LPs with status reserved, consumed, or blocked cannot be moved
2. **Destination must be active** - Inactive locations are not valid destinations
3. **Different locations** - Source and destination must be different
4. **Proper permissions** - You need warehouse_operator role or higher

---

## Step-by-Step Workflow

### Step 1: Start the Move Workflow

Navigate to the Scanner Move page:
- From the Scanner landing page at `/scanner`, click "Move LP"
- Or navigate directly to `/scanner/move`

You will see the 3-step progress indicator at the top.

### Step 2: Scan License Plate

**What to do:**
1. Scan or manually enter the LP barcode
2. The system validates the LP exists and is available
3. LP details are displayed for verification

**LP Information displayed:**
- LP Number
- Product name and SKU
- Current quantity and UoM
- Current location (code and path)
- Status and QA status
- Batch number (if applicable)
- Expiry date (if applicable)

**Possible errors:**
| Error | Cause | Solution |
|-------|-------|----------|
| LP not found | Barcode doesn't match any LP | Verify barcode is correct |
| LP not available | LP has status: reserved/consumed/blocked | Check LP status, cannot move non-available LPs |

**Audio feedback:**
- Success beep: LP found and available
- Error beep: LP not found or not available

### Step 3: Scan Destination Location

**What to do:**
1. Scan or manually enter the destination location barcode
2. The system validates the location exists and is active
3. Location details are displayed for verification

**Location Information displayed:**
- Location code
- Full path (e.g., "Warehouse A > Zone 1 > Rack B-02")
- Warehouse name
- Active status
- Capacity percentage (if tracked)

**Validation checks:**
- Location must exist
- Location must be active
- Location must be different from current LP location

**Possible errors:**
| Error | Cause | Solution |
|-------|-------|----------|
| Location not found | Barcode doesn't match any location | Verify barcode is correct |
| Location inactive | Location is marked inactive | Choose an active location |
| Same location | Destination equals current location | Choose a different location |

**Warnings:**
- Capacity warning if location is at 90%+ capacity (does not block move)

### Step 4: Confirm Move

**Review screen displays:**
- LP details (number, product, quantity)
- Source location (current)
- Destination location (new)
- Optional notes field

**What to do:**
1. Review all details carefully
2. Add notes if needed (optional, max 500 characters)
3. Click "Confirm Move" to execute
4. Click "Edit LP" or "Edit Destination" to go back

**Processing:**
- Loading overlay shows "Processing..."
- Move executes atomically (LP location updated + stock_move created)
- Typical processing time: 500-1000ms

### Step 5: Success

**Success screen displays:**
- Green checkmark animation
- Move number (e.g., "MV-2026-00456")
- LP now at new location confirmation

**Next actions:**
| Button | Action |
|--------|--------|
| Move Another | Keep same destination, start new LP scan |
| New Move | Reset everything, start fresh |
| Done | Return to warehouse module |

---

## Validation Rules

### LP Validation

| Status | Can Move? | Notes |
|--------|-----------|-------|
| `available` | Yes | Normal inventory, can be moved |
| `reserved` | No | Reserved for a work order, release first |
| `consumed` | No | Already consumed, cannot move |
| `blocked` | No | QA hold, resolve hold first |

### Location Validation

| Condition | Valid? | Notes |
|-----------|--------|-------|
| Active location | Yes | Can receive inventory |
| Inactive location | No | Must reactivate first |
| Same as source | No | Must be different location |
| Near capacity | Yes (warning) | Shows warning but allows move |

---

## Component Architecture

```
ScannerMoveWizard (main container)
  |
  +-- ScannerHeader (title, back button, help)
  +-- StepProgress (1/2/3 indicator)
  |
  +-- Step1ScanLP
  |     +-- BarcodeInput
  |     +-- LPSummaryCard
  |     +-- RecentMovesList
  |
  +-- Step2ScanDestination
  |     +-- BarcodeInput
  |     +-- LPSummaryCard (source)
  |     +-- LocationSummaryCard (destination)
  |
  +-- Step3Confirm
  |     +-- MoveSummary
  |     +-- NotesInput
  |     +-- ConfirmButton
  |
  +-- MoveSuccessScreen
  |     +-- SuccessAnimation
  |     +-- ActionButtons
  |
  +-- ErrorAnimation
  +-- LoadingOverlay
  +-- AudioFeedback
  +-- HapticFeedback
```

---

## Using the Components

### Basic Implementation

```tsx
import { ScannerMoveWizard } from '@/components/scanner/move'

function MovePage() {
  return (
    <ScannerMoveWizard
      onComplete={() => {
        // Optional: handle completion
        router.push('/warehouse')
      }}
    />
  )
}
```

### With Step Change Callback

```tsx
<ScannerMoveWizard
  onStepChange={(step) => {
    // Track progress analytics
    analytics.track('scanner_move_step', { step })
  }}
  onComplete={() => {
    toast.success('Move completed!')
  }}
/>
```

---

## useScannerMove Hook

The `useScannerMove` hook manages the move workflow state.

### Return Values

```typescript
const {
  // State
  currentStep,      // 1-4 (1=LP, 2=Dest, 3=Confirm, 4=Success)
  isLoading,        // boolean
  error,            // string | null
  warning,          // string | null
  scannedLP,        // LPLookupResult | null
  scannedLocation,  // LocationLookupResult | null
  moveResult,       // ScannerMoveResult | null
  recentMoves,      // RecentMoveResult[]

  // Actions
  lookupLP,         // (barcode: string) => Promise<LPLookupResult | null>
  lookupLocation,   // (barcode: string) => Promise<LocationLookupResult | null>
  confirmMove,      // () => Promise<void>
  moveAnother,      // () => void - keep destination
  newMove,          // () => void - reset all
  goBack,           // () => void - previous step
} = useScannerMove()
```

---

## Troubleshooting

### LP Not Found

**Symptom:** Scanning LP shows "LP not found" error

**Solutions:**
1. Verify the barcode is readable and complete
2. Check if LP exists in the system (Warehouse > License Plates)
3. Ensure you're in the correct organization
4. LP may have been merged or consumed

### LP Not Available

**Symptom:** LP found but shows "not available for movement"

**Solutions:**
1. Check LP status in License Plates screen
2. If reserved: Release reservation or complete the work order
3. If blocked: Resolve QA hold in Quality module
4. If consumed: LP no longer exists, scan different LP

### Location Not Found

**Symptom:** Scanning location shows "Location not found" error

**Solutions:**
1. Verify the location barcode is correct
2. Check if location exists in Settings > Locations
3. Location may have been deleted

### Location Inactive

**Symptom:** Location found but shows "inactive" error

**Solutions:**
1. Go to Settings > Locations
2. Find the location and mark as active
3. Or choose a different active location

### Move Failed

**Symptom:** Confirm button shows error after click

**Solutions:**
1. Check network connection
2. LP may have been modified by another user
3. Refresh and try again
4. Contact admin if persists

---

## Best Practices

### For Operators

1. **Verify before confirming** - Always double-check LP number and destination before confirming
2. **Use "Move Another"** - When moving multiple LPs to same location, use "Move Another" to speed up workflow
3. **Add notes** - Document reason for non-standard moves
4. **Report issues** - If LP or location not found, report to supervisor

### For Developers

1. **Handle errors gracefully** - Display user-friendly error messages
2. **Provide feedback** - Use audio/haptic feedback for scan results
3. **Cache recent moves** - Show recent moves for quick repeat operations
4. **Test offline** - Handle network failures gracefully

---

## Device Support

### Industrial Scanners

| Device | Status | Notes |
|--------|--------|-------|
| Zebra TC52/TC57 | Supported | Hardware keyboard input |
| Honeywell CT60/CK65 | Supported | Hardware keyboard input |
| Datalogic Memor 10/20 | Supported | Hardware keyboard input |

### Consumer Devices

| Device | Status | Notes |
|--------|--------|-------|
| iPhone (Safari) | Supported | iOS 14+, camera scan via camera app |
| Android (Chrome) | Supported | Android 8+, camera scan via camera app |
| Ring scanners (Bluetooth) | Supported | HID keyboard mode |

---

## API Reference

See [Scanner Move API Reference](../../api/warehouse/scanner-move.md) for detailed endpoint documentation.

### Quick Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/warehouse/scanner/lookup/lp/:barcode` | GET | Lookup LP by barcode |
| `/api/warehouse/scanner/lookup/location/:barcode` | GET | Lookup location by barcode |
| `/api/warehouse/scanner/validate-move` | POST | Pre-validate move |
| `/api/warehouse/scanner/move` | POST | Execute move |

---

## Related Documentation

- [Scanner Move API Reference](../../api/warehouse/scanner-move.md)
- [LP Reservations API](../../api/warehouse/lp-reservations-api.md)
- [FIFO/FEFO Picking Guide](./fifo-fefo-picking.md)
- [Scanner Receive Workflow](./scanner-receive-workflow.md)

---

## Support

**Story:** 05.20
**Last Updated:** 2026-01-21
