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

This section provides complete API endpoint documentation for the Scanner Move workflow.

### Base URL

All endpoints are relative to your app base URL:
```
https://your-domain.com/api
```

### Authentication

All endpoints require authentication. Include your session token in the request headers (automatically handled by Supabase client).

**Required Roles:** `warehouse_operator`, `warehouse_manager`, `admin`, `owner`

---

### POST /api/warehouse/scanner/move

Execute a scanner move operation to relocate a License Plate to a new warehouse location.

**Performance Target:** < 2000ms response time

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `lp_id` | UUID | Yes | License Plate ID to move |
| `to_location_id` | UUID | Yes | Destination location ID |
| `notes` | string | No | Optional move notes (max 500 characters) |

**Example Request:**
```bash
curl -X POST https://your-domain.com/api/warehouse/scanner/move \
  -H "Content-Type: application/json" \
  -d '{
    "lp_id": "550e8400-e29b-41d4-a716-446655440000",
    "to_location_id": "660e8400-e29b-41d4-a716-446655440001",
    "notes": "Moved for inventory count"
  }'
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "stock_move": {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "move_number": "MV-2026-00456",
      "move_type": "transfer",
      "from_location_id": "880e8400-e29b-41d4-a716-446655440003",
      "to_location_id": "660e8400-e29b-41d4-a716-446655440001",
      "quantity": 100,
      "status": "completed",
      "move_date": "2026-01-21T14:30:00Z"
    },
    "lp": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "lp_number": "LP-2026-01234",
      "location_id": "660e8400-e29b-41d4-a716-446655440001",
      "location_path": "Warehouse A > Zone 1 > Rack B-02",
      "product_name": "Wheat Flour",
      "quantity": 100,
      "uom": "kg"
    }
  }
}
```

**Error Responses:**

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request data (missing fields, invalid UUID) |
| `LP_NOT_AVAILABLE` | 400 | LP status is not available for movement |
| `LP_RESERVED` | 400 | LP is reserved for a work order |
| `LP_BLOCKED` | 400 | LP is blocked by QA hold |
| `LP_CONSUMED` | 400 | LP has been consumed |
| `LOCATION_NOT_ACTIVE` | 400 | Destination location is inactive |
| `SAME_LOCATION` | 400 | Source and destination are the same |
| `LP_NOT_FOUND` | 404 | License Plate not found |
| `UNAUTHORIZED` | 401 | Authentication required |

---

### POST /api/warehouse/scanner/validate-move

Pre-validate a move operation without executing it. Use this to check if a move is valid before confirmation.

**Performance Target:** < 500ms response time

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `lp_id` | UUID | Yes | License Plate ID |
| `to_location_id` | UUID | Yes | Destination location ID |

**Example Request:**
```bash
curl -X POST https://your-domain.com/api/warehouse/scanner/validate-move \
  -H "Content-Type: application/json" \
  -d '{
    "lp_id": "550e8400-e29b-41d4-a716-446655440000",
    "to_location_id": "660e8400-e29b-41d4-a716-446655440001"
  }'
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "errors": [],
    "warnings": [],
    "lp": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "lp_number": "LP-2026-01234",
      "product": {
        "id": "prod-001",
        "name": "Wheat Flour",
        "sku": "WF-001"
      },
      "quantity": 100,
      "uom": "kg",
      "location": {
        "id": "loc-001",
        "code": "A-01-01",
        "path": "Warehouse A > Zone 1 > Rack A-01"
      },
      "status": "available",
      "qa_status": "passed",
      "batch_number": "BATCH-2026-0123",
      "expiry_date": "2026-12-31"
    },
    "destination": {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "location_code": "B-02-03",
      "location_path": "Warehouse A > Zone 1 > Rack B-02",
      "warehouse_name": "Main Warehouse",
      "is_active": true,
      "capacity_pct": null
    }
  }
}
```

---

### GET /api/warehouse/scanner/lookup/lp/:barcode

Lookup a License Plate by its barcode (lp_number).

**Performance Target:** < 300ms response time

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `barcode` | string | LP number (e.g., "LP-2026-01234") |

**Example Request:**
```bash
curl -X GET https://your-domain.com/api/warehouse/scanner/lookup/lp/LP-2026-01234 \
  -H "Content-Type: application/json"
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "lp_number": "LP-2026-01234",
    "product": {
      "id": "prod-001",
      "name": "Wheat Flour",
      "sku": "WF-001"
    },
    "quantity": 100,
    "uom": "kg",
    "location": {
      "id": "loc-001",
      "code": "A-01-01",
      "path": "Warehouse A > Zone 1 > Rack A-01"
    },
    "status": "available",
    "qa_status": "passed",
    "batch_number": "BATCH-2026-0123",
    "expiry_date": "2026-12-31"
  }
}
```

---

### GET /api/warehouse/scanner/lookup/location/:barcode

Lookup a warehouse location by its barcode (location_code).

**Performance Target:** < 300ms response time

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `barcode` | string | Location code (e.g., "B-02-03") |

**Example Request:**
```bash
curl -X GET https://your-domain.com/api/warehouse/scanner/lookup/location/B-02-03 \
  -H "Content-Type: application/json"
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "location_code": "B-02-03",
    "location_path": "Warehouse A > Zone 1 > Rack B-02",
    "warehouse_name": "Main Warehouse",
    "is_active": true,
    "capacity_pct": null
  }
}
```

---

### TypeScript Code Examples

```typescript
// Lookup LP by barcode
async function lookupLP(barcode: string) {
  const response = await fetch(
    `/api/warehouse/scanner/lookup/lp/${encodeURIComponent(barcode)}`
  )

  const data = await response.json()

  if (!data.success) {
    throw new Error(data.error?.message || 'LP not found')
  }

  return data.data
}

// Lookup location by barcode
async function lookupLocation(barcode: string) {
  const response = await fetch(
    `/api/warehouse/scanner/lookup/location/${encodeURIComponent(barcode)}`
  )

  const data = await response.json()

  if (!data.success) {
    throw new Error(data.error?.message || 'Location not found')
  }

  return data.data
}

// Validate move before execution
async function validateMove(lpId: string, toLocationId: string) {
  const response = await fetch('/api/warehouse/scanner/validate-move', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lp_id: lpId, to_location_id: toLocationId }),
  })

  const data = await response.json()
  return data.data
}

// Execute move
async function executeMove(lpId: string, toLocationId: string, notes?: string) {
  const response = await fetch('/api/warehouse/scanner/move', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lp_id: lpId,
      to_location_id: toLocationId,
      notes,
    }),
  })

  const data = await response.json()

  if (!data.success) {
    throw new Error(data.error?.message || 'Move failed')
  }

  return data.data
}
```

---

### Performance Guidelines

| Operation | Target | Typical |
|-----------|--------|---------|
| LP Lookup | < 300ms | ~100-200ms |
| Location Lookup | < 300ms | ~100-200ms |
| Validate Move | < 500ms | ~200-400ms |
| Execute Move | < 2000ms | ~500-1000ms |

**Tips for optimal performance:**
- Use indexed barcode columns (lp_number, location_code)
- RLS policies filter by org_id automatically
- The execute_stock_move RPC handles LP update atomically

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
