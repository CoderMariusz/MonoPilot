# Packing Scanner Workflow Guide

Story: **07.12 - Packing Scanner Mobile UI**

Mobile-optimized packing workflow for warehouse operators using handheld scanner devices.

## Overview

The Packing Scanner provides a step-by-step workflow for packing shipments on the warehouse floor. Designed for mobile devices with:

- Touch-optimized interface (48dp minimum touch targets)
- Barcode scanning via device camera
- Audio/visual feedback for warehouse environments
- Allergen warning system for food safety
- Multi-box support for large orders

---

## Accessing the Scanner

Navigate to `/scanner/shipping/pack` on your mobile device or handheld scanner.

Requirements:
- Authenticated user session
- Assigned warehouse access
- Camera permission for barcode scanning

---

## Packing Workflow Steps

### Step 1: Select Shipment

**Options:**

1. **Scan SO Barcode** - Tap "Scan Barcode" and scan the Sales Order barcode
2. **Manual Selection** - Tap a shipment from the pending list

**Shipment List Shows:**
- SO Number
- Customer Name
- Lines to Pack (X of Y)
- Promised Ship Date
- Allergen Alert indicator (yellow badge if customer has restrictions)

**Audio Feedback:**
- Valid scan: Success tone (880Hz, 200ms)
- Invalid scan: Error beep (220Hz, 300ms)

**Allergen Alert:**
When selecting a shipment for a customer with allergen restrictions, a yellow banner displays listing restricted allergens. An alert tone plays (440Hz, 400ms, repeating 2x).

---

### Step 2: Box Management

After selecting a shipment:

- **First box auto-created** (Box 1)
- View shipment header: SO number, customer, pack progress
- Active box indicator: "Box X of Y"
- Box contents summary: items count, estimated weight

**Actions:**
- "Scan Item" - Begin adding items
- "Create New Box" - Start a new box
- "View Contents" - See items in current box
- "Close Box" - Finalize current box

**Switching Boxes:**
Tap the box selector dropdown to switch between open boxes.

---

### Step 3: Scan and Add Item

**Scan LP Barcode:**

1. Tap "Scan Item" button
2. Camera scanner activates
3. Scan the License Plate barcode
4. System validates LP is allocated to this shipment

**LP Details Display:**
- Product name
- Lot number
- Available quantity
- Unit of measure

**Allergen Product Warning:**
If product contains allergens matching customer restrictions:
- Yellow banner flashes
- Alert tone plays
- "ALLERGEN" badge displays
- Confirmation required to proceed

**Validation Errors:**
- "LP not allocated to this order" - LP picked for different order
- "LP already packed in Box X" - Option to split-pack

---

### Step 4: Confirm Quantity

**Number Pad Features:**
- Large touch-friendly keys (48dp+)
- Decimal point for fractional quantities
- Quick adjust: +1, +10, -1, -10 buttons
- Clear and backspace

**Quantity Validation:**
- Cannot exceed LP available quantity
- Warning displays for over-quantity attempts

**Confirming:**
Tap "Add to Box" to pack the item.

**Success:**
- Green checkmark animation
- Success tone
- Box summary updates
- Ready to scan next item

---

### Step 5: Close Box

When box is ready to close:

1. Tap "Close Box"
2. (Optional) Enter weight using number pad
3. (Optional) Enter dimensions (L x W x H)
4. Confirm closure

**Weight Warnings:**
If weight exceeds configured limit (e.g., 30kg), a warning displays with "Confirm Anyway" option.

**After Closing:**
- Box status changes to "closed"
- Prompt: "Create Next Box?" if items remain
- Or "Complete Shipment" if fully packed

---

### Step 6: Complete Shipment

When all SO lines are packed:

1. Tap "Complete Shipment"
2. Confirm "Mark shipment as packed?"
3. Success screen displays:
   - Total boxes
   - Total weight
   - Completion timestamp

**Navigation Options:**
- "New Order" - Pack another shipment
- "Done" - Return to scanner dashboard

---

## Audio Feedback Reference

| Event | Frequency | Duration | Pattern |
|-------|-----------|----------|---------|
| Valid scan | 880Hz | 200ms | Single tone |
| Invalid scan | 220Hz | 300ms | Single tone |
| Box closed | 660Hz + 880Hz | 500ms | Dual chord |
| Allergen alert | 440Hz | 400ms | Repeat 2x |

**Disable Audio:**
Audio can be disabled in warehouse settings (`scanner_sound_feedback = false`).

---

## Visual Indicators

| Indicator | Meaning |
|-----------|---------|
| Green checkmark | Success (valid scan, item added) |
| Red X | Error (invalid scan, validation failure) |
| Yellow banner | Allergen warning active |
| Yellow badge | Customer has allergen restrictions |
| Green badge | Box contents summary (items, weight) |

---

## Error Handling

### Network Errors

If connection lost during packing:
1. Alert tone plays
2. Error modal: "Network error. Please try again."
3. Options: "Retry" or "Cancel"
4. Data preserved for retry

### Session Timeout

- Warning at 4:30 of inactivity
- Session expires at 5:00
- Redirected to login

### Camera Permission

If camera access denied:
1. Message: "Camera permission required for scanning"
2. "Open Settings" to grant permission
3. "Manual Entry" fallback for typing barcodes

---

## Best Practices

1. **Check allergen alerts** before starting to pack
2. **Close boxes** when full before creating new ones
3. **Verify quantity** before confirming pack
4. **Enter weight** for accurate shipping calculations
5. **Use manual entry** if barcode damaged or unreadable

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| LP not found | Verify barcode is correct, LP exists |
| LP not allocated | Check pick list, LP may be for different order |
| Cannot close box | Box must contain at least one item |
| Audio not playing | Check device volume, verify setting enabled |
| Scanner not focusing | Clean camera lens, ensure adequate lighting |

---

## Components

The packing scanner is built from these components:

- `ScannerPackWizard` - Main wizard container with step navigation
- `Step1SelectShipment` - Shipment selection with barcode scan
- `Step2BoxManagement` - Box creation and switching
- `Step3ScanItem` - LP scanning and validation
- `Step4QuantityEntry` - Quantity confirmation with number pad
- `Step5CloseBox` - Box closure with weight entry
- `Step6Complete` - Completion summary
- `AllergenWarningBanner` - Persistent allergen alert
- `BoxSelector` - Multi-box dropdown switcher
- `WeightEntryModal` - Weight/dimensions capture

---

## Related Documentation

- [Packing Scanner API Reference](/docs/api/shipping/packing-scanner.md)
- [Pick Confirmation Scanner](/docs/guides/shipping/pick-confirmation.md)
- [Allergen Validation Guide](/docs/guides/shipping/allergen-validation-guide.md)
- [Inventory Allocation Guide](/docs/guides/shipping/inventory-allocation-guide.md)
