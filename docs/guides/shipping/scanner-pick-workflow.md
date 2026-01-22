# Scanner Pick Workflow Guide

> Story: 07.10 - Pick Scanner
> Module: Shipping
> Status: DEPLOYED

## Overview

The scanner pick workflow enables warehouse pickers to confirm picks using mobile devices and barcode scanners. This guide covers the complete mobile picking process from selecting a pick list to completion.

---

## Getting Started

### Access the Scanner

Navigate to `/scanner/shipping/pick` on your mobile device or handheld scanner.

**Supported Devices:**
- Zebra TC52, TC57
- Honeywell CT40, CT60
- Mobile phones with camera (Android/iOS)
- Any device with hardware barcode scanner

---

## My Picks List

When you open the scanner, you see your assigned pick lists sorted by priority.

**List Display:**
- Pick list number (PL-YYYY-NNNNN)
- Priority badge (urgent/high/normal/low)
- Line count (e.g., "12 lines")
- Status (assigned or in_progress)

**Actions:**
- **Start** - Begin picking an assigned list
- **Continue** - Resume an in-progress list

### Priority Colors

| Priority | Badge Color |
|----------|-------------|
| Urgent | Red |
| High | Orange |
| Normal | Blue |
| Low | Gray |

---

## Start Picking

Tap **Start** on an assigned pick list to begin. The system:

1. Updates status to `in_progress`
2. Records start timestamp
3. Displays the first pick line
4. Auto-focuses the scan input
5. Plays a start audio cue

---

## Pick Line Display

Each pick line shows:

### Location Card (Top)
- Zone badge (e.g., "CHILLED" in blue)
- Location path in large text (e.g., "A-03-12")
- Navigation instruction

### Product Card (Middle)
- Product name (24px bold)
- SKU (gray text)
- Lot number
- Best Before Date (if applicable)

### Quantity Card (Bottom)
- Pick quantity in large green text
- Expected LP barcode

### Progress Bar
- "Line X of Y" text
- Visual progress indicator

---

## Scan LP Barcode

Point your scanner at the LP barcode and scan.

### Valid Scan
When you scan the correct LP:
- Green flash overlay (200ms)
- Success audio tone (880Hz)
- Vibration (100ms)
- "LP Verified" badge appears
- Quantity input is enabled

### Invalid Scan (Wrong LP)
When you scan a different LP:
- Red flash overlay (300ms)
- Error audio tone (220Hz descending)
- Vibration pattern (200-100-200ms)
- Error message: "Wrong LP - Expected LP-XXXX"
- Scan input keeps focus for retry

### LP Not Found
When the barcode is not recognized:
- Red flash overlay
- Error message: "LP Not Found - Check barcode"
- Scan input keeps focus

---

## Confirm Quantity

After scanning a valid LP:

1. Quantity input shows the expected amount
2. Adjust using the number pad if needed:
   - Large 64x64px buttons for easy touch
   - Clear (C), digits 0-9, Backspace
3. Tap **Confirm Pick**

The system:
- Saves the pick confirmation
- Updates inventory
- Auto-advances to next line
- Plays completion audio

---

## Short Pick

If you cannot pick the full quantity:

### Via Skip Line
1. Tap **Skip Line** button
2. Enter available quantity
3. Select reason from dropdown:
   - Insufficient inventory
   - Product not found
   - Product damaged
   - Location empty
   - Other
4. Add notes (optional)
5. Tap **Confirm Short Pick**

### Reasons Explained

| Reason | When to Use |
|--------|-------------|
| Insufficient inventory | Less stock than expected |
| Product not found | Nothing at the location |
| Product damaged | Items unusable |
| Location empty | Bin is completely empty |
| Other | Any other situation |

### What Happens
- Short pick is recorded
- Backorder created automatically for unfulfilled quantity
- "Short pick recorded" toast appears
- System advances to next line

---

## Allergen Warnings

If a product contains allergens that conflict with customer restrictions:

### Allergen Banner
- Red background (#DC2626)
- Warning icon
- Text: "ALLERGEN ALERT: Contains [allergens]"
- Persistent (cannot dismiss)

### Acknowledgment Required
You must check the acknowledgment box before confirming the pick. This ensures awareness of allergen handling requirements.

---

## FIFO/FEFO Warnings

If you scan an LP that is not the oldest (FIFO) or soonest-expiring (FEFO):

### Warning Banner
- Amber background
- Message: "Older lot available - LP-XXXX (Lot: YYYY)"
- Two options:
  - **Use Suggested LP** - Switch to recommended LP
  - **Continue Anyway** - Override and use scanned LP

### Override Logging
When you override FIFO/FEFO:
- Decision is logged in audit trail
- Pick proceeds with your scanned LP

---

## Auto-Advance

After confirming a pick:

1. Line status updates to `picked`
2. Progress bar updates
3. System shows next pending line
4. Scan input auto-focuses
5. "Line complete" audio plays

Lines are processed in pick_sequence order.

---

## Pick List Complete

When all lines are picked or short:

### Completion Screen
- Full-screen green background
- Animated checkmark
- "Pick List Complete!" text
- Summary:
  - Total lines picked
  - Short picks count
  - Total units picked
- **Return to My Picks** button

### Audio/Vibration
- Victory audio sweep (440Hz to 880Hz)
- Vibration pattern (100-50-100ms)

---

## Audio Feedback Reference

| Event | Sound | Duration |
|-------|-------|----------|
| Start Pick List | 440Hz tone | 100ms |
| Valid LP Scan | 880Hz high tone | 150ms |
| Invalid LP Scan | 220Hz descending | 300ms |
| Quantity Confirmed | 660-880Hz sweep | 200ms |
| Line Complete | 880Hz double beep | 100ms x2 |
| Pick List Complete | 440-880Hz victory | 500ms |
| Error (General) | 220Hz double low | 200ms x2 |
| Short Pick | 440+554Hz chord | 200ms |

---

## Scanner Settings

Access settings via the gear icon in the header.

### Audio Settings
- **Volume** - Slider 0-100% (default 70%)
- **Mute** - Toggle all audio off
- **Test Audio** - Play test tone

### Vibration Settings
- **Enable/Disable** - Toggle vibration feedback

### Display Settings
- **High Contrast Mode** - Better visibility in bright environments
- **Large Text Mode** - Increase font sizes

### Scanner Settings
- **Camera Scanner** - Enable for phone camera scanning
- **Hardware Scanner** - Default mode for dedicated devices

Settings persist in localStorage.

---

## Touch Target Requirements

All interactive elements meet accessibility standards:

| Element | Minimum Size |
|---------|--------------|
| Buttons | 48x48px |
| Primary buttons | 56px height |
| Number pad buttons | 64x64px |
| Input fields | 56px height |
| List rows | 64px height |
| Spacing between targets | 8px |

---

## Troubleshooting

### Scan Not Registering
1. Check scanner connection (Bluetooth/USB)
2. Verify barcode is clean and undamaged
3. Adjust scanner distance (typically 6-12 inches)
4. Try camera scanner mode on phone

### No Audio Feedback
1. Check device volume
2. Verify audio is not muted in settings
3. Some browsers require user interaction before audio

### Slow Response
1. Check network connection
2. Move closer to WiFi access point
3. Clear browser cache if needed

### Wrong LP Keeps Showing
1. Verify you are at the correct location
2. Check if inventory was moved
3. Contact supervisor for location audit

---

## Best Practices

1. **Always scan, never type** - Scanning reduces errors
2. **Follow pick sequence** - Optimized for efficient routing
3. **Report discrepancies** - Short pick with accurate reason
4. **Acknowledge allergens** - Never skip allergen warnings
5. **Respect FIFO/FEFO** - Only override when necessary

---

## Related Documentation

- [Scanner Pick API Reference](../../api/shipping/scanner-pick.md)
- [Pick Confirmation Desktop Guide](./pick-confirmation.md)
- [Pick List Generation Guide](./pick-list-workflow.md)
