# PROD-006: Scanner - Register Output (Mobile)

**Module**: Production
**Feature**: Output Registration Scanner (FR-PROD-012, FR-PROD-013)
**Status**: Ready for Review
**Last Updated**: 2025-12-14

---

## Overview

**Route**: `/scanner/output`

**Purpose**: Mobile-first scanner workflow for production output registration with License Plate (LP) label printing. Operators scan WO barcode, enter quantity produced, select QA status, and generate LP labels with optional by-product registration.

**PRD Reference**:
- Lines 540-577 (FR-PROD-012: Scanner Output Registration)
- Lines 615-622 (FR-PROD-013: By-Product Registration)
- Lines 1484-1510 (Scanner Workflow: Register Output)

**Device Support**:
- Industrial scanners (Zebra TC52/57, Honeywell CT60/CK65) with integrated printers
- Consumer phones (iPhone, Android) with Bluetooth printer pairing
- Ring scanners (Bluetooth) paired with mobile device

**Screen Width**: 320px-480px (mobile devices)

---

## User Flow

```
Step 1: Scan WO Barcode
   ↓
Step 2: Enter Quantity Produced
   ↓
Step 3: Select QA Status
   ↓
Step 4: Review Output Details
   ↓
Step 5: Confirm → LP Created
   ↓
Step 6: Print LP Label (ZPL)
   ↓
Step 7: By-Product Prompt (if applicable)
   ↓ (loop to Step 2 for by-products or exit)
```

---

## Wireframes

---

### Step 1: Scan WO Barcode

#### Success State

```
┌─────────────────────────────────────┐ ← 375px width (mobile)
│ ← Output                 User  🔄   │ ← Header (56dp)
├─────────────────────────────────────┤
│ Step 1 of 7: Scan Work Order        │ ← Progress (40dp)
├─────────────────────────────────────┤
│                                     │
│  Scan WO Barcode                    │ ← Heading (24px bold, white)
│                                     │
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ │        📷                       │ │ ← Barcode icon (96dp)
│ │                                 │ │   Slate-600 color
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ WO-2025-0156___                 │ │ ← Scan input (48dp)
│ └─────────────────────────────────┘ │   24px font, monospace
│   ↓ Tap to type manually (16px)    │   Slate-400 color
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
├─────────────────────────────────────┤
│ [Scan] or press Enter               │ ← Action bar (64dp)
└─────────────────────────────────────┘   Primary button (48dp)
                                          Cyan-600 background
```

**After Successful Scan** (WO info displays within 500ms - AC #1):

```
┌─────────────────────────────────────┐
│ ← Output                 User  🔄   │
├─────────────────────────────────────┤
│ Step 1 of 7: Scan Work Order        │
├─────────────────────────────────────┤
│                                     │
│  ✅ WO-2025-0156                    │ ← Green check (32dp)
│                                     │   Success tone (500ms beep)
│                                     │   Vibration (200ms)
│ ┌─────────────────────────────────┐ │
│ │ Product: Wheat Bread            │ │ ← WO info card (AC #1)
│ │ SKU: SKU-WB-001                 │ │   Slate-800 background
│ │ Planned Qty: 5000 kg            │ │   18px font
│ │ Registered Qty: 3500 kg (70%)   │ │   Planned vs Registered
│ │ Remaining: 1500 kg (30%)        │ │   Cyan-400 color
│ │                                 │ │
│ │ Progress: ▓▓▓▓▓▓▓░░░ 70%        │ │ ← Progress bar
│ │                                 │ │   Green-600 fill
│ │ Status: In Progress             │ │
│ │ Line: Line 1 | Mixer M-001      │ │
│ │ Batch: B-2025-0156              │ │
│ └─────────────────────────────────┘ │
│                                     │
│  By-Products Defined: 2             │ ← By-product indicator
│  • Wheat Bran (5%)                  │   Slate-400 color
│  • Wheat Germ (2%)                  │   Shows if BOM has by-products
│                                     │
├─────────────────────────────────────┤
│ [Next: Enter Quantity →]            │ ← Primary button (48dp)
└─────────────────────────────────────┘   Cyan-600 background
```

**Interaction Notes**:
- Auto-focus on scan input field on page load
- Hardware scanner input goes directly to input field (inputMode="none")
- Enter key or [Scan] button triggers validation
- Green check animation on success (fade in, 300ms)
- Success tone: 1 long beep (500ms)
- Vibration: 200ms
- WO info displays within 500ms (AC #1)
- Shows product name, planned qty, registered qty with percentage
- Progress bar visualizes completion (70% in example)
- By-product indicator shows if BOM has by-products (for Step 7)

**Acceptance Criteria Coverage**:
- ✅ AC #1: Product name, planned qty, registered qty display within 500ms

---

#### Error State: Invalid WO

```
┌─────────────────────────────────────┐
│ ← Output                 User  🔄   │
├─────────────────────────────────────┤
│ Step 1 of 7: Scan Work Order        │
├─────────────────────────────────────┤
│                                     │
│                                     │
│         ❌                          │ ← Red X icon (96dp)
│                                     │   Red-500 color
│                                     │   Error beep (2 short beeps)
│                                     │   Vibration (100ms)
│     Invalid WO barcode              │ ← Error heading (24px bold)
│                                     │   Red-400 color
│  WO-99999 does not exist or is      │ ← Error explanation (16px)
│  not available for output           │   Slate-300 color
│  registration.                      │
│                                     │
│  Possible reasons:                  │
│  • WO does not exist                │
│  • WO is not started                │
│  • WO is already completed          │
│                                     │
│                                     │
├─────────────────────────────────────┤
│ [Scan Again]     [Manual Entry]     │ ← 48dp buttons, 50/50 split
└─────────────────────────────────────┘   Secondary buttons
```

**Interaction Notes**:
- Red X animation displays (shake effect, 300ms horizontal shake)
- Error beep: 2 short beeps (200ms each, 100ms gap)
- Vibration: 100ms
- Error message: Specific reason why WO is invalid
- [Scan Again]: Clears input, refocuses on scan field
- [Manual Entry]: Shows keyboard, allows typing WO number

---

#### Error State: Network Error

```
┌─────────────────────────────────────┐
│ ← Output                 User  🔄   │
├─────────────────────────────────────┤
│ Step 1 of 7: Scan Work Order        │
├─────────────────────────────────────┤
│                                     │
│                                     │
│         ⚠️                          │ ← Warning icon (96dp)
│                                     │   Yellow-500 color
│                                     │
│     Network error                   │ ← Error heading (24px bold)
│                                     │   Yellow-400 color
│  Unable to connect to server.       │ ← Error explanation (16px)
│  Retry?                             │   Slate-300 color
│                                     │   (AC #9)
│                                     │
│  Scanned: WO-2025-0156              │ ← Context info
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
├─────────────────────────────────────┤
│ [Retry]          [Save Offline]     │ ← 48dp buttons (AC #9)
└─────────────────────────────────────┘   Yellow-600 / Slate-700
```

**Interaction Notes**:
- Network error detected during WO lookup
- Warning beep: 1 short beep (200ms)
- [Retry]: Re-attempts API call
- [Save Offline]: Saves to local queue for later sync (offline mode)
- Shows scanned WO number for context

**Acceptance Criteria Coverage**:
- ✅ AC #9: Network error displays "Network error. Retry?" with Retry button

---

#### Loading State

```
┌─────────────────────────────────────┐
│ ← Output                 User  🔄   │
├─────────────────────────────────────┤
│ Step 1 of 7: Scan Work Order        │
├─────────────────────────────────────┤
│                                     │
│                                     │
│                                     │
│         ⟳                           │ ← Spinner (32dp)
│                                     │   Cyan-500 color
│   Looking up WO-2025-0156...        │   Rotating animation (1s/rotation)
│                                     │
│   Fetching product details...       │ ← Loading sub-text
│                                     │   Slate-400 color, 16px
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
├─────────────────────────────────────┤
│                                     │
└─────────────────────────────────────┘
```

**Interaction Notes**:
- Spinner displays immediately after scan
- Min display time: 300ms (avoid flicker)
- Max timeout: 10s (then error state)
- Loading text indicates current operation

---

#### Empty State (No Active WOs)

```
┌─────────────────────────────────────┐
│ ← Output                 User  🔄   │
├─────────────────────────────────────┤
│ Step 1 of 7: Scan Work Order        │
├─────────────────────────────────────┤
│                                     │
│                                     │
│         📋                          │ ← Clipboard icon (96dp)
│                                     │   Slate-600 color
│                                     │
│    No active work orders            │ ← Empty heading (24px bold)
│                                     │   White color
│  There are no work orders available │ ← Explanation (16px)
│  for output registration.           │   Slate-400 color
│                                     │
│  Please start a work order in the   │
│  Production module first.           │
│                                     │
│                                     │
├─────────────────────────────────────┤
│ [Go to Production]  [Refresh]       │ ← 48dp buttons
└─────────────────────────────────────┘   60/40 split
```

**Interaction Notes**:
- Displayed when no work orders are In Progress
- [Go to Production]: Navigate to /production/work-orders
- [Refresh]: Reload work order list

---

### Step 2: Enter Quantity Produced

#### Success State (Normal Input)

```
┌─────────────────────────────────────┐
│ ← WO-2025-0156           User  🔄   │ ← Header shows WO number
├─────────────────────────────────────┤
│ Step 2 of 7: Enter Quantity         │
├─────────────────────────────────────┤
│                                     │
│  Quantity Produced                  │ ← Heading (24px bold)
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Product: Wheat Bread            │ │ ← Product summary card
│ │ Planned: 5000 kg                │ │   Slate-800 background
│ │ Registered: 3500 kg (70%)       │ │   18px font
│ │ Remaining: 1500 kg (30%)        │ │
│ └─────────────────────────────────┘ │
│                                     │
│  Enter Quantity to Register:        │ ← Instruction (18px)
│                                     │
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ │         250.00                  │ │ ← Qty input display
│ │            kg                   │ │   32px font, center-aligned
│ │                                 │ │   64dp height, Cyan-400 color
│ └─────────────────────────────────┘ │   Input field (tappable)
│                                     │
│  Progress: ▓▓▓▓▓▓▓▓░░ 75%          │ ← New progress after this qty
│             3750 kg / 5000 kg       │   (3500 + 250 = 3750)
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  [7]    [8]    [9]    [⌫]      │ │ ← Number pad (large keys)
│ │                                 │ │   64x64dp each key
│ │  [4]    [5]    [6]    [C]      │ │   8dp spacing between keys
│ │                                 │ │   Slate-700 background
│ │  [1]    [2]    [3]    [.]      │ │   White text, 24px font
│ │                                 │ │   Border-radius: 8dp
│ │  [0]           [00]             │ │
│ └─────────────────────────────────┘ │
│                                     │
├─────────────────────────────────────┤
│ [Next: QA Status →]                 │ ← Primary button (48dp)
└─────────────────────────────────────┘   Enabled when qty > 0
```

**Interaction Notes**:
- Qty input starts empty (user enters from number pad)
- Number pad keys are 64x64dp (exceeds 48x48dp minimum)
- Decimal point supported for fractional quantities
- [⌫] = Backspace, removes last digit
- [C] = Clear, resets to 0
- [.] = Decimal point, max 2 decimal places (e.g., 250.50)
- UoM (kg) displays next to qty input, pulled from product.uom
- Real-time progress calculation shows new total if confirmed
- Validation:
  - Qty must be > 0
  - Warning if qty > remaining (but allowed - overproduction)
- [Next: QA Status] enabled only when qty is valid (> 0)

---

#### Success State (Overproduction Warning)

```
┌─────────────────────────────────────┐
│ ← WO-2025-0156           User  🔄   │
├─────────────────────────────────────┤
│ Step 2 of 7: Enter Quantity         │
├─────────────────────────────────────┤
│                                     │
│  Quantity Produced                  │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Product: Wheat Bread            │ │
│ │ Planned: 5000 kg                │ │
│ │ Registered: 3500 kg (70%)       │ │
│ │ Remaining: 1500 kg (30%)        │ │
│ └─────────────────────────────────┘ │
│                                     │
│  Enter Quantity to Register:        │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ │        2000.00                  │ │ ← Entered 2000 kg
│ │            kg                   │ │   (exceeds remaining 1500 kg)
│ └─────────────────────────────────┘ │
│                                     │
│  ⚠️ Overproduction Warning          │ ← Warning banner
│                                     │   Yellow-900 background
│  Entered quantity (2000 kg) exceeds │   Yellow-300 text
│  remaining planned quantity (1500   │   40dp height
│  kg). This will result in 500 kg   │
│  overproduction. Continue?          │
│                                     │
│  Progress: ▓▓▓▓▓▓▓▓▓▓ 110%         │ ← Over 100% progress
│             5500 kg / 5000 kg       │   Red-400 color (over target)
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  [7]    [8]    [9]    [⌫]      │ │
│ │  [4]    [5]    [6]    [C]      │ │
│ │  [1]    [2]    [3]    [.]      │ │
│ │  [0]           [00]             │ │
│ └─────────────────────────────────┘ │
│                                     │
├─────────────────────────────────────┤
│ [Next: QA Status →]                 │ ← Still enabled (overproduction
└─────────────────────────────────────┘   allowed but warned)
```

**Interaction Notes**:
- Warning displays when entered qty > remaining planned qty
- Warning beep: 1 short beep (200ms)
- Progress bar turns red when over 100%
- User can proceed (overproduction is logged but allowed)
- Calculation: (Registered + Entered) / Planned * 100 = (3500 + 2000) / 5000 = 110%

---

#### Error State: Invalid Quantity

```
┌─────────────────────────────────────┐
│ ← WO-2025-0156           User  🔄   │
├─────────────────────────────────────┤
│ Step 2 of 7: Enter Quantity         │
├─────────────────────────────────────┤
│                                     │
│  Quantity Produced                  │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Product: Wheat Bread            │ │
│ │ Planned: 5000 kg                │ │
│ │ Registered: 3500 kg (70%)       │ │
│ │ Remaining: 1500 kg (30%)        │ │
│ └─────────────────────────────────┘ │
│                                     │
│  Enter Quantity to Register:        │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ │          0.00                   │ │ ← Zero quantity entered
│ │            kg                   │ │   Red-400 color (error)
│ └─────────────────────────────────┘ │   2px red-500 ring
│                                     │
│  ❌ Invalid quantity                │ ← Error message
│                                     │   Red-400 color, 16px
│  Quantity must be greater than 0.   │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  [7]    [8]    [9]    [⌫]      │ │
│ │  [4]    [5]    [6]    [C]      │ │
│ │  [1]    [2]    [3]    [.]      │ │
│ │  [0]           [00]             │ │
│ └─────────────────────────────────┘ │
│                                     │
├─────────────────────────────────────┤
│ [Next: QA Status →]                 │ ← Disabled (Slate-800 bg,
└─────────────────────────────────────┘   Slate-500 text, 50% opacity)
```

**Interaction Notes**:
- Error beep: 2 short beeps (200ms each, 100ms gap)
- Input field shows red ring (2px red-500)
- [Next] button disabled when qty = 0
- Error message displays below input

---

#### Loading State

```
┌─────────────────────────────────────┐
│ ← WO-2025-0156           User  🔄   │
├─────────────────────────────────────┤
│ Step 2 of 7: Enter Quantity         │
├─────────────────────────────────────┤
│                                     │
│                                     │
│                                     │
│         ⟳                           │ ← Spinner (32dp)
│                                     │   Cyan-500 color
│   Loading product details...        │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
├─────────────────────────────────────┤
│                                     │
└─────────────────────────────────────┘
```

**Interaction Notes**:
- Displays when transitioning from Step 1 to Step 2
- Loads product UoM and current progress

---

#### Empty State (WO Completed)

```
┌─────────────────────────────────────┐
│ ← WO-2025-0156           User  🔄   │
├─────────────────────────────────────┤
│ Step 2 of 7: Enter Quantity         │
├─────────────────────────────────────┤
│                                     │
│                                     │
│         ✅                          │ ← Green check (96dp)
│                                     │
│    WO Already Completed             │ ← Empty heading (24px bold)
│                                     │
│  This work order has already        │ ← Explanation (16px)
│  reached 100% completion.           │   Slate-400 color
│                                     │
│  Registered: 5000 kg / 5000 kg      │
│                                     │
│  No additional output can be        │
│  registered without adjusting the   │
│  planned quantity.                  │
│                                     │
│                                     │
├─────────────────────────────────────┤
│ [Go Back]        [View WO]          │ ← 48dp buttons
└─────────────────────────────────────┘   50/50 split
```

**Interaction Notes**:
- Displays if WO is already at 100% (or status = Completed)
- [Go Back]: Return to Step 1
- [View WO]: Navigate to WO detail page

---

### Step 3: Select QA Status

#### Success State

```
┌─────────────────────────────────────┐
│ ← WO-2025-0156           User  🔄   │
├─────────────────────────────────────┤
│ Step 3 of 7: QA Status              │
├─────────────────────────────────────┤
│                                     │
│  Quality Assurance Status           │ ← Heading (24px bold)
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Product: Wheat Bread            │ │ ← Output summary
│ │ Quantity: 250.00 kg             │ │   Slate-800 background
│ │ Batch: B-2025-0156              │ │   18px font
│ └─────────────────────────────────┘ │
│                                     │
│  Select quality status:             │ ← Instruction (18px)
│                                     │
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ │  ✅ Approved                    │ │ ← QA button (64dp height)
│ │                                 │ │   (AC #2: >= 64px height)
│ │  Ready for release              │ │   Green-600 background
│ │                                 │ │   White text, 20px font
│ └─────────────────────────────────┘ │   24dp icon
│                                     │
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ │  🕐 Pending                     │ │ ← QA button (64dp height)
│ │                                 │ │   Yellow-600 background
│ │  Awaiting QA inspection         │ │   White text, 20px font
│ │                                 │ │   24dp icon
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ │  ❌ Rejected                    │ │ ← QA button (64dp height)
│ │                                 │ │   Red-600 background
│ │  Failed quality check           │ │   White text, 20px font
│ │                                 │ │   24dp icon
│ └─────────────────────────────────┘ │
│                                     │
│                                     │
├─────────────────────────────────────┤
│                                     │ ← Action bar empty
└─────────────────────────────────────┘   (tap QA button to proceed)
```

**Interaction Notes**:
- Three large QA status buttons, each 64dp height minimum (AC #2)
- Color-coded for quick visual identification:
  - Green = Approved (AC #2)
  - Yellow = Pending (AC #2)
  - Red = Rejected (AC #2)
- Each button has:
  - Icon (24dp, left-aligned)
  - Status name (20px bold)
  - Description (16px, Slate-200)
- Tapping any button immediately proceeds to Step 4 (Review)
- Success tone: 1 short beep (200ms) on tap
- Vibration: 50ms on tap

**Acceptance Criteria Coverage**:
- ✅ AC #2: QA status buttons each >= 64px height with clear color coding (green=Approved, yellow=Pending, red=Rejected)

---

#### Success State (After Selection)

```
┌─────────────────────────────────────┐
│ ← WO-2025-0156           User  🔄   │
├─────────────────────────────────────┤
│ Step 3 of 7: QA Status              │
├─────────────────────────────────────┤
│                                     │
│  Quality Assurance Status           │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Product: Wheat Bread            │ │
│ │ Quantity: 250.00 kg             │ │
│ │ Batch: B-2025-0156              │ │
│ └─────────────────────────────────┘ │
│                                     │
│  Select quality status:             │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ │  ✅ Approved  ✓                 │ │ ← Selected (checkmark right)
│ │                                 │ │   Green-700 background (darker)
│ │  Ready for release              │ │   2px cyan-400 ring
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ │  🕐 Pending                     │ │ ← Not selected (dimmed)
│ │                                 │ │   50% opacity
│ │  Awaiting QA inspection         │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ │  ❌ Rejected                    │ │ ← Not selected (dimmed)
│ │                                 │ │   50% opacity
│ │  Failed quality check           │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│                                     │
├─────────────────────────────────────┤
│ [Next: Review →]                    │ ← Primary button appears
└─────────────────────────────────────┘   Cyan-600 background
```

**Interaction Notes**:
- Selected button shows checkmark (✓) on right side
- Selected button has darker background and cyan ring
- Non-selected buttons dimmed to 50% opacity
- [Next: Review] button enabled after selection
- User can tap different button to change selection

---

#### Loading State

```
┌─────────────────────────────────────┐
│ ← WO-2025-0156           User  🔄   │
├─────────────────────────────────────┤
│ Step 3 of 7: QA Status              │
├─────────────────────────────────────┤
│                                     │
│                                     │
│                                     │
│         ⟳                           │ ← Spinner (32dp)
│                                     │
│   Loading QA options...             │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
├─────────────────────────────────────┤
│                                     │
└─────────────────────────────────────┘
```

**Interaction Notes**:
- Displays when transitioning from Step 2 to Step 3

---

#### Empty State (No QA Options)

```
┌─────────────────────────────────────┐
│ ← WO-2025-0156           User  🔄   │
├─────────────────────────────────────┤
│ Step 3 of 7: QA Status              │
├─────────────────────────────────────┤
│                                     │
│                                     │
│         ⚠️                          │ ← Warning icon (96dp)
│                                     │
│    QA Status Unavailable            │ ← Empty heading (24px bold)
│                                     │
│  Quality status options are not     │ ← Explanation (16px)
│  configured for this product.       │   Slate-400 color
│                                     │
│  Please contact an administrator    │
│  to configure QA settings.          │
│                                     │
│                                     │
│                                     │
│                                     │
├─────────────────────────────────────┤
│ [Go Back]     [Skip QA Status]      │ ← 48dp buttons
└─────────────────────────────────────┘   50/50 split
```

**Interaction Notes**:
- Displays if QA status options are not configured (unlikely, hardcoded)
- [Go Back]: Return to Step 2
- [Skip QA Status]: Proceed with default status (e.g., "Pending")

---

#### Error State (Configuration Error)

```
┌─────────────────────────────────────┐
│ ← WO-2025-0156           User  🔄   │
├─────────────────────────────────────┤
│ Step 3 of 7: QA Status              │
├─────────────────────────────────────┤
│                                     │
│                                     │
│         ❌                          │ ← Red X icon (96dp)
│                                     │
│    Configuration Error              │ ← Error heading (24px bold)
│                                     │   Red-400 color
│  Unable to load QA status options.  │ ← Error explanation (16px)
│  Please try again or contact        │   Slate-300 color
│  support.                           │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
├─────────────────────────────────────┤
│ [Retry]          [Go Back]          │ ← 48dp buttons
└─────────────────────────────────────┘   50/50 split
```

**Interaction Notes**:
- Error beep: 2 short beeps (200ms each)
- [Retry]: Re-attempts loading QA options
- [Go Back]: Return to Step 2

---

### Step 4: Review Output Details

#### Success State

```
┌─────────────────────────────────────┐
│ ← WO-2025-0156           User  🔄   │
├─────────────────────────────────────┤
│ Step 4 of 7: Review Output          │
├─────────────────────────────────────┤
│                                     │
│  Review Output Details              │ ← Heading (24px bold)
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📦 Output Summary               │ │ ← Summary card
│ │                                 │ │   Slate-800 background
│ │ Product:                        │ │   18px font
│ │ Wheat Bread                     │ │   Bold values
│ │ SKU: SKU-WB-001                 │ │
│ │                                 │ │
│ │ Quantity:                       │ │
│ │ 250.00 kg                       │ │   Cyan-400 color
│ │                                 │ │
│ │ QA Status:                      │ │
│ │ ✅ Approved                     │ │   Green-400 color
│ │                                 │ │
│ │ Batch Number:                   │ │
│ │ B-2025-0156                     │ │   Auto-filled from WO
│ │                                 │ │
│ │ Production Location:            │ │
│ │ Line 1 - Mixer M-001            │ │   Pre-selected from WO
│ │                                 │ │
│ │ Expiry Date:                    │ │
│ │ 2025-06-15                      │ │   Auto-calculated
│ │ (180 days shelf life)           │ │   Slate-400 color (helper)
│ │                                 │ │
│ │ Work Order:                     │ │
│ │ WO-2025-0156                    │ │
│ │                                 │ │
│ │ Operator:                       │ │
│ │ John Doe (Badge: JD-001)        │ │   From session
│ └─────────────────────────────────┘ │
│                                     │
│  LP Number (Generated):             │ ← LP preview
│  LP-2025-05678                      │   24px bold, Cyan-400
│                                     │
│  ℹ️ LP label will be generated      │ ← Info message
│     after confirmation              │   Slate-400 color, 14px
│                                     │
│                                     │
├─────────────────────────────────────┤
│ [Back]           [Confirm →]        │ ← 30/70 split
└─────────────────────────────────────┘   Slate-700 / Cyan-600
```

**Interaction Notes**:
- All details from previous steps displayed for review
- Batch Number auto-filled from WO.batch_number
- Location pre-selected from WO.production_line
- Expiry Date auto-calculated: today + product.shelf_life_days
  - Example: 2025-12-14 + 180 days = 2025-06-15
  - Shelf life shown as helper text
- LP number generated (sequential, org-scoped)
- Operator info pulled from authenticated session
- [Back]: Return to Step 3 (QA Status)
- [Confirm]: Proceed to Step 5 (creates LP and updates WO)

---

#### Success State (Rejected Output)

```
┌─────────────────────────────────────┐
│ ← WO-2025-0156           User  🔄   │
├─────────────────────────────────────┤
│ Step 4 of 7: Review Output          │
├─────────────────────────────────────┤
│                                     │
│  Review Output Details              │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📦 Output Summary               │ │
│ │                                 │ │
│ │ Product:                        │ │
│ │ Wheat Bread                     │ │
│ │ SKU: SKU-WB-001                 │ │
│ │                                 │ │
│ │ Quantity:                       │ │
│ │ 250.00 kg                       │ │
│ │                                 │ │
│ │ QA Status:                      │ │
│ │ ❌ Rejected                     │ │   Red-400 color
│ │                                 │ │
│ │ Batch Number:                   │ │
│ │ B-2025-0156                     │ │
│ │                                 │ │
│ │ Production Location:            │ │
│ │ Line 1 - Mixer M-001            │ │
│ │                                 │ │
│ │ Expiry Date:                    │ │
│ │ N/A (Rejected)                  │ │   Slate-500 color
│ │                                 │ │
│ │ Work Order:                     │ │
│ │ WO-2025-0156                    │ │
│ │                                 │ │
│ │ Operator:                       │ │
│ │ John Doe (Badge: JD-001)        │ │
│ └─────────────────────────────────┘ │
│                                     │
│  ⚠️ Rejected Output Warning         │ ← Warning banner
│                                     │   Red-900 background
│  This output will be created with   │   Red-300 text
│  REJECTED status. It will not be    │   40dp height
│  available for shipping or sale.    │
│  LP will be created for tracking    │
│  purposes only.                     │
│                                     │
│  LP Number (Generated):             │
│  LP-2025-05678                      │   Red-400 color (rejected)
│                                     │
├─────────────────────────────────────┤
│ [Back]           [Confirm →]        │
└─────────────────────────────────────┘
```

**Interaction Notes**:
- Rejected output warning banner displays
- Expiry Date shows "N/A (Rejected)" (not applicable)
- LP number still generated (for tracking rejected output)
- LP status will be "Rejected" in inventory
- User can still proceed to confirm (for waste tracking)

---

#### Loading State

```
┌─────────────────────────────────────┐
│ ← WO-2025-0156           User  🔄   │
├─────────────────────────────────────┤
│ Step 4 of 7: Review Output          │
├─────────────────────────────────────┤
│                                     │
│                                     │
│                                     │
│         ⟳                           │ ← Spinner (32dp)
│                                     │
│   Generating LP number...           │
│                                     │
│   Calculating expiry date...        │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
├─────────────────────────────────────┤
│                                     │
└─────────────────────────────────────┘
```

**Interaction Notes**:
- Displays when transitioning from Step 3 to Step 4
- Generates LP number and calculates expiry

---

#### Empty State (No Details Available)

```
┌─────────────────────────────────────┐
│ ← WO-2025-0156           User  🔄   │
├─────────────────────────────────────┤
│ Step 4 of 7: Review Output          │
├─────────────────────────────────────┤
│                                     │
│                                     │
│         ⚠️                          │ ← Warning icon (96dp)
│                                     │
│    Missing Details                  │ ← Empty heading (24px bold)
│                                     │
│  Unable to generate output details. │ ← Explanation (16px)
│  Please go back and verify all      │   Slate-400 color
│  information.                       │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
├─────────────────────────────────────┤
│ [Go to Step 1]    [Retry]           │ ← 48dp buttons
└─────────────────────────────────────┘   50/50 split
```

**Interaction Notes**:
- Displays if required data is missing (edge case)
- [Go to Step 1]: Restart workflow
- [Retry]: Re-attempt detail generation

---

#### Error State (LP Generation Failed)

```
┌─────────────────────────────────────┐
│ ← WO-2025-0156           User  🔄   │
├─────────────────────────────────────┤
│ Step 4 of 7: Review Output          │
├─────────────────────────────────────┤
│                                     │
│                                     │
│         ❌                          │ ← Red X icon (96dp)
│                                     │
│    LP Generation Failed             │ ← Error heading (24px bold)
│                                     │   Red-400 color
│  Unable to generate LP number.      │ ← Error explanation (16px)
│  This may be due to a database      │   Slate-300 color
│  error or network issue.            │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
├─────────────────────────────────────┤
│ [Retry]          [Go Back]          │ ← 48dp buttons
└─────────────────────────────────────┘   50/50 split
```

**Interaction Notes**:
- Error beep: 2 short beeps (200ms each)
- [Retry]: Re-attempts LP number generation
- [Go Back]: Return to Step 3

---

### Step 5: Confirm (LP Created)

#### Success State

```
┌─────────────────────────────────────┐
│ ← WO-2025-0156           User  🔄   │
├─────────────────────────────────────┤
│ Step 5 of 7: Processing             │
├─────────────────────────────────────┤
│                                     │
│                                     │
│         ⟳                           │ ← Spinner (32dp)
│                                     │   Cyan-500 color
│   Creating LP...                    │   Rotating animation
│                                     │
│   Updating work order progress...   │ ← Processing sub-text
│                                     │   Slate-400 color, 16px
│   Updating genealogy...             │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
├─────────────────────────────────────┤
│                                     │
└─────────────────────────────────────┘
```

**After 1-2 seconds** (LP created successfully):

```
┌─────────────────────────────────────┐
│ ← WO-2025-0156           User  🔄   │
├─────────────────────────────────────┤
│ Step 5 of 7: LP Created             │
├─────────────────────────────────────┤
│                                     │
│                                     │
│         ✅                          │ ← Green check (96dp)
│                                     │   Green-500 color
│                                     │   Success tone (500ms beep)
│                                     │   Vibration (200ms)
│                                     │   Voice: "LP created" (AC #3)
│     LP Created                      │ ← Success heading (24px bold)
│                                     │   Green-400 color
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📦 LP-2025-05678                │ │ ← LP details card
│ │                                 │ │   Green-900 background
│ │ Product: Wheat Bread            │ │   18px font
│ │ Quantity: 250.00 kg             │ │
│ │ Batch: B-2025-0156              │ │
│ │ Expiry: 2025-06-15              │ │
│ │ QA Status: ✅ Approved          │ │
│ │ Location: Line 1 - Mixer M-001  │ │
│ └─────────────────────────────────┘ │
│                                     │
│  WO Progress Updated:               │ ← Progress update
│  3750 kg / 5000 kg (75%)            │   Cyan-400 color
│  ▓▓▓▓▓▓▓▓░░ 75%                    │   Progress bar
│                                     │
│                                     │
├─────────────────────────────────────┤
│ [Next: Print Label →]               │ ← Primary button (48dp)
└─────────────────────────────────────┘   Cyan-600 background
                                          Auto-advance in 2s
```

**Interaction Notes**:
- Green check animation (fade in + scale up, 500ms)
- Success tone: 1 long beep (500ms)
- Vibration: 200ms
- **Voice announcement: "LP created"** (AC #3 - text-to-speech or pre-recorded audio)
- LP details displayed in green-bordered card
- WO progress updated and displayed
- Auto-advance to Step 6 after 2 seconds (countdown shown)
- User can tap [Next: Print Label] to skip countdown

**Acceptance Criteria Coverage**:
- ✅ AC #3: Voice announcement "LP created" plays after successful registration

---

#### Success State (Rejected Output Created)

```
┌─────────────────────────────────────┐
│ ← WO-2025-0156           User  🔄   │
├─────────────────────────────────────┤
│ Step 5 of 7: LP Created             │
├─────────────────────────────────────┤
│                                     │
│                                     │
│         ⚠️                          │ ← Warning icon (96dp)
│                                     │   Yellow-500 color
│                                     │   Warning beep (200ms)
│                                     │   Vibration (50ms)
│                                     │   Voice: "Rejected LP created"
│     Rejected LP Created             │ ← Success heading (24px bold)
│                                     │   Yellow-400 color
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📦 LP-2025-05678                │ │ ← LP details card
│ │                                 │ │   Red-900 background
│ │ Product: Wheat Bread            │ │   18px font
│ │ Quantity: 250.00 kg             │ │
│ │ Batch: B-2025-0156              │ │
│ │ QA Status: ❌ Rejected          │ │   Red-400 color
│ │ Location: Quarantine Zone       │ │
│ └─────────────────────────────────┘ │
│                                     │
│  This LP is not available for       │ ← Warning text
│  shipping. It will be tracked for   │   Slate-400 color
│  waste/disposal purposes.           │
│                                     │
│                                     │
├─────────────────────────────────────┤
│ [Next: Print Label →]               │ ← Primary button (48dp)
└─────────────────────────────────────┘   Yellow-600 background
```

**Interaction Notes**:
- Yellow warning icon for rejected output
- Warning beep: 1 short beep (200ms)
- Voice announcement: "Rejected LP created"
- LP card has red background
- Location auto-set to "Quarantine Zone" or configured rejection location
- Still proceeds to print label (for tracking purposes)

---

#### Error State (Creation Failed)

```
┌─────────────────────────────────────┐
│ ← WO-2025-0156           User  🔄   │
├─────────────────────────────────────┤
│ Step 5 of 7: LP Created             │
├─────────────────────────────────────┤
│                                     │
│                                     │
│         ❌                          │ ← Red X icon (96dp)
│                                     │   Red-500 color
│                                     │   Error beep (2 short beeps)
│                                     │   Vibration (100ms)
│     LP Creation Failed              │ ← Error heading (24px bold)
│                                     │   Red-400 color
│                                     │
│  Unable to create LP. Please check  │ ← Error explanation (16px)
│  your connection and try again.     │   Slate-300 color
│                                     │
│  Error details:                     │
│  Database constraint violation      │   Slate-400 color (details)
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
├─────────────────────────────────────┤
│ [Retry]          [Go Back]          │ ← 48dp buttons
└─────────────────────────────────────┘   50/50 split
```

**Interaction Notes**:
- Error beep: 2 short beeps (200ms each, 100ms gap)
- Error details shown (if available)
- [Retry]: Re-attempts LP creation
- [Go Back]: Return to Step 4 (Review)

---

#### Error State (Network Error)

```
┌─────────────────────────────────────┐
│ ← WO-2025-0156           User  🔄   │
├─────────────────────────────────────┤
│ Step 5 of 7: LP Created             │
├─────────────────────────────────────┤
│                                     │
│                                     │
│         ⚠️                          │ ← Warning icon (96dp)
│                                     │   Yellow-500 color
│                                     │
│     Network error                   │ ← Error heading (24px bold)
│                                     │   Yellow-400 color
│  Unable to connect to server.       │ ← Error explanation (16px)
│  Retry?                             │   Slate-300 color
│                                     │   (AC #9)
│  Output details have been saved     │
│  locally and will sync when         │   Slate-400 color
│  connection is restored.            │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
├─────────────────────────────────────┤
│ [Retry]      [Continue Offline]     │ ← 48dp buttons (AC #9)
└─────────────────────────────────────┘   Yellow-600 / Slate-700
```

**Interaction Notes**:
- Network error during LP creation
- Warning beep: 1 short beep (200ms)
- Output saved to offline queue
- [Retry]: Re-attempts API call
- [Continue Offline]: Skip printer (proceed to Step 7 or finish)

**Acceptance Criteria Coverage**:
- ✅ AC #9: Network error displays "Network error. Retry?" with Retry button

---

#### Loading State

```
┌─────────────────────────────────────┐
│ ← WO-2025-0156           User  🔄   │
├─────────────────────────────────────┤
│ Step 5 of 7: Processing             │
├─────────────────────────────────────┤
│                                     │
│                                     │
│                                     │
│         ⟳                           │ ← Spinner (32dp)
│                                     │   Cyan-500 color
│   Creating LP...                    │   Rotating animation
│                                     │
│   Please wait...                    │ ← Loading text
│                                     │   Slate-400 color, 16px
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
├─────────────────────────────────────┤
│                                     │
└─────────────────────────────────────┘
```

**Interaction Notes**:
- Displays immediately after [Confirm] tapped in Step 4
- Spinner rotates continuously
- Min display time: 300ms (avoid flicker)
- Max timeout: 10s (then error state)

---

#### Empty State (Not Applicable)

```
(Empty state not applicable for Step 5 - always transitions from Step 4)
```

---

### Step 6: Print LP Label

#### Success State (Printer Configured)

```
┌─────────────────────────────────────┐
│ ← WO-2025-0156           User  🔄   │
├─────────────────────────────────────┤
│ Step 6 of 7: Print Label            │
├─────────────────────────────────────┤
│                                     │
│  Print LP Label                     │ ← Heading (24px bold)
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🖨️ Printer: Zebra ZD620         │ │ ← Printer info
│ │    Status: Ready                │ │   Green-900 background
│ │    IP: 192.168.1.100            │ │   18px font
│ └─────────────────────────────────┘ │
│                                     │
│  Label Preview:                     │ ← Label preview section
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │ ╔═══════════════════════╗   │ │ │ ← ZPL label preview
│ │ │ ║ MonoPilot MES         ║   │ │ │   Slate-700 background
│ │ │ ║                       ║   │ │ │   Monospace font
│ │ │ ║ LP-2025-05678         ║   │ │ │   (AC #5)
│ │ │ ║ |||||||||||||||||||   ║   │ │ │   Barcode representation
│ │ │ ║                       ║   │ │ │
│ │ │ ║ Product: Wheat Bread  ║   │ │ │
│ │ │ ║ Qty: 250.00 kg        ║   │ │ │
│ │ │ ║ Batch: B-2025-0156    ║   │ │ │
│ │ │ ║ Expiry: 2025-06-15    ║   │ │ │
│ │ │ ║                       ║   │ │ │
│ │ │ ║ QA: Approved ✅       ║   │ │ │
│ │ │ ║ Operator: JD-001      ║   │ │ │
│ │ │ ╚═══════════════════════╝   │ │ │
│ │ └─────────────────────────────┘ │ │
│ └─────────────────────────────────┘ │
│                                     │
│  ℹ️ Label will be sent to printer   │ ← Info message
│     when you tap Print              │   Slate-400 color, 14px
│                                     │
│                                     │
├─────────────────────────────────────┤
│ [Skip]           [Print →]          │ ← 30/70 split (AC #4)
└─────────────────────────────────────┘   Slate-700 / Cyan-600
                                          Auto-print in 2s (if enabled)
```

**Interaction Notes**:
- Printer status displayed (Ready, Busy, Offline, Error)
- Label preview shows ZPL label content (AC #5):
  - LP number as barcode (Code 128 or GS1-128)
  - Product name
  - Qty with UoM
  - Batch number
  - Expiry date
  - QA status
  - Operator badge
- [Skip]: Skip printing, proceed to Step 7 (By-Product Prompt)
- [Print]: Send ZPL to printer within 2 seconds (AC #4)
- **Auto-print**: If `auto_print_lp_label` setting is enabled, label prints automatically after 2s countdown
- Countdown shown: "Auto-printing in 2s..." (can be cancelled by tapping [Skip])

**Acceptance Criteria Coverage**:
- ✅ AC #4: Printer configured → ZPL label sent to printer within 2 seconds
- ✅ AC #5: ZPL label contains LP number (barcode), product name, qty with UoM, batch number, expiry date

---

#### Success State (After Print Sent - 2s timeout)

```
┌─────────────────────────────────────┐
│ ← WO-2025-0156           User  🔄   │
├─────────────────────────────────────┤
│ Step 6 of 7: Print Label            │
├─────────────────────────────────────┤
│                                     │
│                                     │
│         🖨️                          │ ← Printer icon (96dp)
│                                     │   Cyan-500 color
│                                     │
│     Sending to printer...           │ ← Processing message (24px bold)
│                                     │   Cyan-400 color
│                                     │
│  ZPL label sent to Zebra ZD620      │ ← Status text (16px)
│                                     │   Slate-300 color
│                                     │
│  ⟳ Waiting for confirmation...      │ ← Spinner + text
│                                     │   32dp spinner
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
├─────────────────────────────────────┤
│                                     │
└─────────────────────────────────────┘
```

**After 2 seconds** (print confirmation received - AC #4):

```
┌─────────────────────────────────────┐
│ ← WO-2025-0156           User  🔄   │
├─────────────────────────────────────┤
│ Step 6 of 7: Print Label            │
├─────────────────────────────────────┤
│                                     │
│                                     │
│         ✅                          │ ← Green check (96dp)
│                                     │   Green-500 color
│                                     │   Success tone (500ms beep)
│                                     │   Vibration (200ms)
│     Label Printed                   │ ← Success heading (24px bold)
│                                     │   Green-400 color
│                                     │
│  LP-2025-05678 label sent to        │ ← Confirmation text (16px)
│  Zebra ZD620 successfully.          │   Slate-300 color
│                                     │
│  Please verify label on product.    │ ← Instruction
│                                     │   Slate-400 color
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
├─────────────────────────────────────┤
│ [Next: By-Products →]               │ ← Primary button (48dp)
└─────────────────────────────────────┘   Cyan-600 background
                                          Auto-advance in 2s
```

**Interaction Notes**:
- Green check animation (fade in + scale up, 500ms)
- Success tone: 1 long beep (500ms)
- Vibration: 200ms
- Confirmation message displayed
- Auto-advance to Step 7 after 2 seconds
- User can tap [Next: By-Products] to skip countdown

**Acceptance Criteria Coverage**:
- ✅ AC #4: ZPL label sent to printer within 2 seconds (confirmed)

---

#### Success State (Printer Not Configured)

```
┌─────────────────────────────────────┐
│ ← WO-2025-0156           User  🔄   │
├─────────────────────────────────────┤
│ Step 6 of 7: Print Label            │
├─────────────────────────────────────┤
│                                     │
│  Print LP Label                     │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🖨️ Printer: Not Configured      │ │ ← Printer info
│ │    Status: Unavailable          │ │   Yellow-900 background
│ │                                 │ │   18px font
│ └─────────────────────────────────┘ │
│                                     │
│  Label Preview:                     │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │ ╔═══════════════════════╗   │ │ │
│ │ │ ║ MonoPilot MES         ║   │ │ │
│ │ │ ║                       ║   │ │ │
│ │ │ ║ LP-2025-05678         ║   │ │ │
│ │ │ ║ |||||||||||||||||||   ║   │ │ │
│ │ │ ║                       ║   │ │ │
│ │ │ ║ Product: Wheat Bread  ║   │ │ │
│ │ │ ║ Qty: 250.00 kg        ║   │ │ │
│ │ │ ║ Batch: B-2025-0156    ║   │ │ │
│ │ │ ║ Expiry: 2025-06-15    ║   │ │ │
│ │ │ ║                       ║   │ │ │
│ │ │ ║ QA: Approved ✅       ║   │ │ │
│ │ │ ║ Operator: JD-001      ║   │ │ │
│ │ │ ╚═══════════════════════╝   │ │ │
│ │ └─────────────────────────────┘ │ │
│ └─────────────────────────────────┘ │
│                                     │
│  ⚠️ No printer configured            │ ← Warning message
│     Print manually or configure a   │   Yellow-300 color, 14px
│     printer in Settings.            │
│                                     │
├─────────────────────────────────────┤
│ [Skip]           [Print]            │ ← [Print] disabled (AC #6)
└─────────────────────────────────────┘   Slate-700 / Slate-800
                                          (disabled: 50% opacity)
```

**Interaction Notes**:
- Printer status shows "Not Configured"
- Label preview still displayed (user can screenshot or email)
- [Print] button **disabled** with tooltip "No printer configured" (AC #6)
- [Skip]: Proceed to Step 7 (By-Product Prompt)
- Warning message guides user to configure printer in Settings

**Acceptance Criteria Coverage**:
- ✅ AC #6: Printer not configured → "Print" button disabled with tooltip "No printer configured"

---

#### Error State (Print Failed)

```
┌─────────────────────────────────────┐
│ ← WO-2025-0156           User  🔄   │
├─────────────────────────────────────┤
│ Step 6 of 7: Print Label            │
├─────────────────────────────────────┤
│                                     │
│                                     │
│         ❌                          │ ← Red X icon (96dp)
│                                     │   Red-500 color
│                                     │   Error beep (2 short beeps)
│                                     │   Vibration (100ms)
│     Print Failed                    │ ← Error heading (24px bold)
│                                     │   Red-400 color
│                                     │
│  Unable to send label to printer.   │ ← Error explanation (16px)
│  The printer may be offline or out  │   Slate-300 color
│  of paper.                          │
│                                     │
│  Error details:                     │
│  Printer not responding (timeout)   │   Slate-400 color
│                                     │
│                                     │
│                                     │
│                                     │
├─────────────────────────────────────┤
│ [Skip]           [Retry Print]      │ ← 48dp buttons
└─────────────────────────────────────┘   50/50 split
```

**Interaction Notes**:
- Error beep: 2 short beeps (200ms each, 100ms gap)
- Error details shown (timeout, offline, paper jam, etc.)
- [Skip]: Proceed to Step 7 without printing
- [Retry Print]: Re-attempts sending ZPL to printer

---

#### Loading State

```
┌─────────────────────────────────────┐
│ ← WO-2025-0156           User  🔄   │
├─────────────────────────────────────┤
│ Step 6 of 7: Print Label            │
├─────────────────────────────────────┤
│                                     │
│                                     │
│                                     │
│         ⟳                           │ ← Spinner (32dp)
│                                     │   Cyan-500 color
│   Generating label...               │   Rotating animation
│                                     │
│   Checking printer status...        │ ← Loading sub-text
│                                     │   Slate-400 color, 16px
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
├─────────────────────────────────────┤
│                                     │
└─────────────────────────────────────┘
```

**Interaction Notes**:
- Displays when transitioning from Step 5 to Step 6
- Generates ZPL label and checks printer status

---

#### Empty State (Not Applicable)

```
(Empty state not applicable for Step 6 - always transitions from Step 5)
```

---

### Step 7: By-Product Prompt

#### Success State (By-Products Defined)

```
┌─────────────────────────────────────┐
│ ← WO-2025-0156           User  🔄   │
├─────────────────────────────────────┤
│ Step 7 of 7: By-Products            │
├─────────────────────────────────────┤
│                                     │
│  Register By-Products?              │ ← Heading (24px bold)
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📦 Main Output Registered       │ │ ← Main output summary
│ │                                 │ │   Green-900 background
│ │ LP: LP-2025-05678               │ │   18px font
│ │ Product: Wheat Bread            │ │
│ │ Quantity: 250.00 kg             │ │
│ └─────────────────────────────────┘ │
│                                     │
│  This BOM has 2 by-products         │ ← By-product count
│  defined. Do you want to register   │   Slate-300 color, 16px
│  them now?                          │
│                                     │
│  By-Products to Register:           │ ← Expected by-products list
│                                     │   (AC #7 - FR-PROD-013)
│ ┌─────────────────────────────────┐ │
│ │ 📦 Wheat Bran                   │ │ ← By-product item (64dp)
│ │    Expected: 12.50 kg (5%)      │ │   Slate-800 background
│ │    (Yield: 5% of 250 kg)        │ │   Calculated (AC #1 FR-PROD-013)
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ 📦 Wheat Germ                   │ │
│ │    Expected: 5.00 kg (2%)       │ │
│ │    (Yield: 2% of 250 kg)        │ │
│ └─────────────────────────────────┘ │
│                                     │
│                                     │
│                                     │
├─────────────────────────────────────┤
│ [No]             [Yes →]            │ ← 30/70 split (AC #7, #8)
└─────────────────────────────────────┘   Slate-700 / Cyan-600
```

**Interaction Notes**:
- Displayed if BOM has `wo_materials` with `is_by_product = true` (AC #7)
- Shows list of expected by-products with calculated quantities
- Expected qty calculation (AC #1 FR-PROD-013):
  - Formula: `WO.actual_output_qty * yield_percent / 100`
  - Example 1: 250 kg * 5% / 100 = 12.50 kg (Wheat Bran)
  - Example 2: 250 kg * 2% / 100 = 5.00 kg (Wheat Germ)
- [No]: Skip by-product registration, finish workflow (AC #8)
- [Yes]: Proceed to by-product registration (loop back to Step 2 for each by-product)

**Acceptance Criteria Coverage**:
- ✅ AC #7: BOM has by-products → prompt "Register by-products?" displays with Yes/No buttons
- ✅ AC #8: User taps "No" → scanner returns to main screen (or finish workflow)
- ✅ AC #1 (FR-PROD-013): By-product expected qty calculated and displayed (e.g., 250 kg * 5% = 12.50 kg)

---

#### Success State (After "Yes" Tapped)

```
┌─────────────────────────────────────┐
│ ← WO-2025-0156           User  🔄   │
├─────────────────────────────────────┤
│ Step 7 of 7: By-Products            │
├─────────────────────────────────────┤
│                                     │
│                                     │
│         ⟳                           │ ← Spinner (32dp)
│                                     │   Cyan-500 color
│   Loading by-product details...     │
│                                     │
│   Preparing registration...         │ ← Loading sub-text
│                                     │   Slate-400 color, 16px
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
├─────────────────────────────────────┤
│                                     │
└─────────────────────────────────────┘
```

**After loading** (transitions to by-product registration - Step 2 loop):

```
┌─────────────────────────────────────┐
│ ← WO-2025-0156           User  🔄   │
├─────────────────────────────────────┤
│ By-Product 1 of 2: Enter Quantity   │ ← Progress indicator
├─────────────────────────────────────┤
│                                     │
│  Register By-Product                │ ← Heading (24px bold)
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ By-Product: Wheat Bran          │ │ ← By-product summary
│ │ Expected Qty: 12.50 kg (5%)     │ │   Slate-800 background
│ │                                 │ │   Cyan-400 color (expected)
│ │ Main Output: 250.00 kg          │ │
│ │ LP: LP-2025-05678               │ │
│ └─────────────────────────────────┘ │
│                                     │
│  Enter Actual Quantity:             │ ← Instruction (18px)
│                                     │
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ │         12.50                   │ │ ← Qty input display
│ │            kg                   │ │   Pre-filled with expected qty
│ │                                 │ │   32px font, center-aligned
│ └─────────────────────────────────┘ │   User can adjust (AC #4 FR-PROD-013)
│                                     │
│  ℹ️ Adjust quantity if actual       │ ← Info message
│     differs from expected           │   Slate-400 color, 14px
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  [7]    [8]    [9]    [⌫]      │ │ ← Number pad (64x64dp)
│ │  [4]    [5]    [6]    [C]      │ │
│ │  [1]    [2]    [3]    [.]      │ │
│ │  [0]           [00]             │ │
│ └─────────────────────────────────┘ │
│                                     │
├─────────────────────────────────────┤
│ [Next: QA Status →]                 │ ← Primary button (48dp)
└─────────────────────────────────────┘   Enabled when qty >= 0
```

**Interaction Notes**:
- User tapped [Yes] on by-product prompt
- Loops back to Step 2 workflow for each by-product (AC #6 FR-PROD-013)
- Progress shows "By-Product 1 of 2" (then "2 of 2")
- Expected qty pre-filled (AC #2 FR-PROD-013)
- User can adjust if actual differs (AC #4 FR-PROD-013):
  - Example: Expected 12.50 kg, user enters 11.00 kg (actual)
  - LP created with qty = 11.00 kg
- Follows same workflow as main output:
  - Step 2: Enter Quantity (current screen)
  - Step 3: Select QA Status
  - Step 4: Review Output
  - Step 5: Confirm (LP Created)
  - Step 6: Print Label
  - Step 7: Next By-Product (if any) or Finish
- After last by-product, displays completion message (AC #8 FR-PROD-013)

**Acceptance Criteria Coverage**:
- ✅ AC #2 (FR-PROD-013): auto_create_by_product_lp = false → user manually enters by-product quantities (pre-filled with expected)
- ✅ AC #4 (FR-PROD-013): User can adjust expected qty (e.g., 12.50 kg → 11.00 kg)
- ✅ AC #6 (FR-PROD-013): BOM has 3 by-products → all 3 display in sequence

---

#### Success State (After "No" Tapped)

```
┌─────────────────────────────────────┐
│ ← Output                 User  🔄   │
├─────────────────────────────────────┤
│ Step 7 of 7: Finished               │
├─────────────────────────────────────┤
│                                     │
│                                     │
│         ✅                          │ ← Green check (96dp)
│                                     │   Green-500 color
│                                     │   Success tone (500ms beep)
│                                     │   Vibration (200ms)
│     Output Registered               │ ← Success heading (24px bold)
│                                     │   Green-400 color
│                                     │
│  LP-2025-05678 created successfully │ ← Confirmation text (16px)
│                                     │   Slate-300 color
│                                     │
│  By-products were skipped.          │ ← Skip confirmation
│                                     │   Slate-400 color
│                                     │
│  Returning to scanner menu...       │ ← Auto-advance message
│                                     │   14px, Slate-500
│                                     │
│                                     │
│                                     │
│                                     │
├─────────────────────────────────────┤
│ [Register Another]  [Done]          │ ← 50/50 split
└─────────────────────────────────────┘   Cyan-700 / Cyan-600
                                          Auto-return in 3s
```

**Interaction Notes**:
- User tapped [No] on by-product prompt (AC #8)
- Success confirmation displayed
- Auto-return to scanner main menu after 3 seconds
- [Register Another]: Start new output registration (back to Step 1)
- [Done]: Return to scanner main menu or dashboard

**Acceptance Criteria Coverage**:
- ✅ AC #8: User taps "No" on by-product prompt → scanner returns to main screen

---

#### Success State (All By-Products Registered)

```
┌─────────────────────────────────────┐
│ ← WO-2025-0156           User  🔄   │
├─────────────────────────────────────┤
│ Step 7 of 7: Finished               │
├─────────────────────────────────────┤
│                                     │
│                                     │
│         ✅                          │ ← Green check (96dp)
│                                     │   Green-500 color
│                                     │   Success tone (500ms beep)
│                                     │   Vibration (200ms)
│     By-Product Registration         │ ← Success heading (24px bold)
│     Complete                        │   Green-400 color
│                                     │   (AC #8 FR-PROD-013)
│  All by-products have been          │ ← Confirmation text (16px)
│  registered successfully.           │   Slate-300 color
│                                     │
│  Output Summary:                    │ ← Summary section
│  • Main: LP-2025-05678 (250 kg)     │   Slate-400 color, 16px
│  • Wheat Bran: LP-2025-05679 (11 kg)│
│  • Wheat Germ: LP-2025-05680 (4 kg) │
│                                     │
│  Returning to scanner menu...       │ ← Auto-advance message
│                                     │   14px, Slate-500
│                                     │
│                                     │
├─────────────────────────────────────┤
│ [Register Another]  [Done]          │ ← 50/50 split
└─────────────────────────────────────┘   Cyan-700 / Cyan-600
                                          Auto-return in 3s
```

**Interaction Notes**:
- Displayed after last by-product is registered
- Summary shows all created LPs (main + by-products)
- Genealogy automatically linked (AC #5 FR-PROD-013):
  - By-product LPs have same `parent_lp_ids` as main output LP
  - Separate `child_lp_id` entries in `lp_genealogy` table
- Auto-return to scanner main menu after 3 seconds
- [Register Another]: Start new output registration (back to Step 1)
- [Done]: Return to scanner main menu or dashboard

**Acceptance Criteria Coverage**:
- ✅ AC #5 (FR-PROD-013): By-product LP has same parent_lp_ids as main output LP (genealogy linked)
- ✅ AC #8 (FR-PROD-013): All by-products registered → "By-product registration complete" confirmation displays

---

#### Loading State

```
┌─────────────────────────────────────┐
│ ← WO-2025-0156           User  🔄   │
├─────────────────────────────────────┤
│ Step 7 of 7: By-Products            │
├─────────────────────────────────────┤
│                                     │
│                                     │
│                                     │
│         ⟳                           │ ← Spinner (32dp)
│                                     │   Cyan-500 color
│   Checking for by-products...       │   Rotating animation
│                                     │
│   Loading BOM details...            │ ← Loading sub-text
│                                     │   Slate-400 color, 16px
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
├─────────────────────────────────────┤
│                                     │
└─────────────────────────────────────┘
```

**Interaction Notes**:
- Displays when transitioning from Step 6 to Step 7
- Queries BOM for by-products (`is_by_product = true`)

---

#### Empty State (No By-Products Defined)

```
┌─────────────────────────────────────┐
│ ← WO-2025-0156           User  🔄   │
├─────────────────────────────────────┤
│ Step 7 of 7: By-Products            │
├─────────────────────────────────────┤
│                                     │
│                                     │
│         ✅                          │ ← Green check (96dp)
│                                     │   Green-500 color
│                                     │
│     Output Registered               │ ← Success heading (24px bold)
│     Successfully                    │   Green-400 color
│                                     │
│  LP-2025-05678 created successfully │ ← Confirmation text (16px)
│                                     │   Slate-300 color
│                                     │
│  No by-products defined for this    │ ← Empty explanation
│  BOM.                               │   Slate-400 color
│                                     │
│  Returning to scanner menu...       │ ← Auto-advance message
│                                     │   14px, Slate-500
│                                     │
│                                     │
│                                     │
├─────────────────────────────────────┤
│ [Register Another]  [Done]          │ ← 50/50 split
└─────────────────────────────────────┘   Cyan-700 / Cyan-600
                                          Auto-return in 3s
```

**Interaction Notes**:
- Displayed if BOM has no by-products (`is_by_product = false` for all materials)
- Success confirmation (output registered successfully)
- No by-product prompt shown (skips directly to finish)
- Auto-return to scanner main menu after 3 seconds
- [Register Another]: Start new output registration (back to Step 1)
- [Done]: Return to scanner main menu or dashboard

---

#### Error State (By-Product Load Failed)

```
┌─────────────────────────────────────┐
│ ← WO-2025-0156           User  🔄   │
├─────────────────────────────────────┤
│ Step 7 of 7: By-Products            │
├─────────────────────────────────────┤
│                                     │
│                                     │
│         ❌                          │ ← Red X icon (96dp)
│                                     │   Red-500 color
│                                     │   Error beep (2 short beeps)
│                                     │   Vibration (100ms)
│     By-Product Load Failed          │ ← Error heading (24px bold)
│                                     │   Red-400 color
│                                     │
│  Unable to load by-product details. │ ← Error explanation (16px)
│  Please try again or skip.          │   Slate-300 color
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
├─────────────────────────────────────┤
│ [Skip]           [Retry]            │ ← 48dp buttons
└─────────────────────────────────────┘   50/50 split
```

**Interaction Notes**:
- Error beep: 2 short beeps (200ms each, 100ms gap)
- [Skip]: Skip by-product registration, finish workflow
- [Retry]: Re-attempts loading by-product details from BOM

---

#### Error State (Zero Quantity Warning - FR-PROD-013 AC #7)

```
┌─────────────────────────────────────┐
│ ← WO-2025-0156           User  🔄   │
├─────────────────────────────────────┤
│ By-Product 1 of 2: Confirm Quantity │
├─────────────────────────────────────┤
│                                     │
│         ⚠️                          │ ← Warning icon (96dp)
│                                     │   Yellow-500 color
│                                     │
│     Zero Quantity Warning           │ ← Warning heading (24px bold)
│                                     │   Yellow-400 color
│                                     │   (AC #7 FR-PROD-013)
│                                     │
│  By-product quantity is 0.          │ ← Warning explanation (16px)
│  Continue?                          │   Slate-300 color
│                                     │
│  By-Product: Wheat Bran             │ ← Context info
│  Expected: 12.50 kg                 │   Slate-400 color
│  Entered: 0.00 kg                   │   Red-400 color
│                                     │
│  If no by-product was produced,     │ ← Guidance
│  you can skip this registration.    │   Slate-400 color
│                                     │
│                                     │
│                                     │
├─────────────────────────────────────┤
│ [Go Back]        [Continue →]       │ ← 50/50 split (AC #7)
└─────────────────────────────────────┘   Slate-700 / Yellow-600
```

**Interaction Notes**:
- Warning displays when user enters qty = 0 for by-product (AC #7 FR-PROD-013)
- Warning beep: 1 short beep (200ms)
- [Go Back]: Return to quantity input (Step 2 loop) to adjust qty
- [Continue]: Proceed with 0 qty (creates LP with 0 qty for tracking purposes)

**Acceptance Criteria Coverage**:
- ✅ AC #7 (FR-PROD-013): By-product qty = 0 → warning "By-product quantity is 0. Continue?" displays

---

## Acceptance Criteria Summary

### FR-PROD-012 (Scanner Output Registration)

| AC # | Description | Coverage | Steps |
|------|-------------|----------|-------|
| 1 | WO barcode → product, planned qty, registered qty within 500ms | ✅ | Step 1 (Success) |
| 2 | QA buttons >= 64px height, color-coded (green/yellow/red) | ✅ | Step 3 (Success) |
| 3 | Output registered → voice "LP created" plays | ✅ | Step 5 (Success) |
| 4 | Printer configured → ZPL label sent within 2s | ✅ | Step 6 (Success) |
| 5 | ZPL label → LP barcode, product, qty+UoM, batch, expiry | ✅ | Step 6 (Label Preview) |
| 6 | Printer not configured → Print disabled + tooltip | ✅ | Step 6 (Not Configured) |
| 7 | BOM has by-products → prompt "Register by-products?" | ✅ | Step 7 (Success) |
| 8 | User taps "No" → return to main screen | ✅ | Step 7 (After No) |
| 9 | Network error → "Network error. Retry?" with Retry | ✅ | Step 1 & Step 5 (Network Error) |

### FR-PROD-013 (By-Product Registration)

| AC # | Description | Coverage | Steps |
|------|-------------|----------|-------|
| 1 | Expected qty = WO.planned_qty * yield_percent / 100 | ✅ | Step 7 (By-Product List) |
| 2 | auto_create = false → user manually enters qty | ✅ | Step 7 (After Yes) |
| 3 | auto_create = true → auto-created with expected qty | ⚠️ | Not shown (auto mode not in scanner workflow) |
| 4 | User enters actual qty (e.g., 45 instead of 50) → LP created with actual | ✅ | Step 7 (After Yes) |
| 5 | By-product LP → same parent_lp_ids as main output LP | ✅ | Step 7 (All Registered) |
| 6 | BOM has 3 by-products → all 3 display in sequence | ✅ | Step 7 (By-Product List) |
| 7 | By-product qty = 0 → warning "By-product quantity is 0. Continue?" | ✅ | Step 7 (Zero Qty Warning) |
| 8 | All by-products registered → "By-product registration complete" | ✅ | Step 7 (All Registered) |

**Note**: AC #3 (auto_create) is not applicable to scanner workflow (manual entry only). Auto-creation is handled in desktop mode.

---

## Accessibility Checklist

- [x] Touch targets >= 48x48dp (all buttons, inputs, list items)
- [x] QA status buttons >= 64x64dp (AC #2)
- [x] Number pad keys >= 64x64dp
- [x] Text size >= 18px (24px for headings, 32px for qty input)
- [x] Contrast >= 4.5:1 for all text (white on Slate-900 = 18.96:1)
- [x] All 4 states defined for each step (Loading, Empty, Error, Success)
- [x] Audible feedback: Success (500ms beep), Error (2x 200ms beeps), Warning (200ms beep)
- [x] Vibration feedback: Success (200ms), Error (100ms), Warning (50ms)
- [x] Voice announcement: "LP created" on success (AC #3)
- [x] Auto-focus on scan input (Step 1)
- [x] Linear flow (7 steps, no complex navigation)
- [x] Offline behavior defined (network error states with retry/offline options)
- [x] High contrast colors (Slate-900 background, white/cyan/green/red/yellow text)

---

## Technical Notes

### API Endpoints

```
POST /api/production/output/validate-wo
  → Validates WO barcode, returns WO details

POST /api/production/output/register
  → Creates LP, updates WO progress, links genealogy
  → Request: { wo_id, product_id, qty, qa_status, batch, expiry, location }
  → Response: { lp_id, lp_number, success }

POST /api/production/output/generate-label
  → Generates ZPL barcode label
  → Request: { lp_id }
  → Response: { zpl_content }

POST /api/production/output/print-label
  → Sends ZPL to configured printer
  → Request: { lp_id, printer_id }
  → Response: { print_job_id, status }

GET /api/production/output/by-products/{wo_id}
  → Returns by-products from BOM (is_by_product = true)
  → Response: { by_products: [{ product_id, name, yield_percent, expected_qty }] }

POST /api/production/output/register-by-product
  → Creates by-product LP with linked genealogy
  → Request: { wo_id, product_id, qty, qa_status, parent_lp_id }
  → Response: { lp_id, lp_number, success }
```

### Database Operations

1. **Step 5: Create LP**:
   - Insert into `license_plates` table:
     - `lp_number` (generated, sequential)
     - `product_id`, `qty`, `uom`, `batch_number`, `expiry_date`
     - `qa_status`, `status` (Available/Rejected)
     - `location_id`, `wo_id`, `org_id`, `created_by`
   - Insert into `lp_genealogy` table:
     - `child_lp_id` (new LP)
     - `parent_lp_id` (consumed material LPs from WO)
     - `wo_id`, `org_id`
   - Update `work_orders` table:
     - `registered_qty` += new LP qty
     - `status` = Completed (if registered_qty >= planned_qty)

2. **Step 7: Register By-Product**:
   - Insert into `license_plates` table (same as main output)
   - Insert into `lp_genealogy` table:
     - `child_lp_id` (by-product LP)
     - `parent_lp_id` (same as main output LP - AC #5)
     - `wo_id`, `org_id`

### ZPL Label Template (AC #5)

```zpl
^XA
^FO50,50^A0N,30,30^FDMONOPILOT MES^FS
^FO50,100^BY3^BCN,100,Y,N,N^FD${lp_number}^FS
^FO50,230^A0N,25,25^FDProduct: ${product_name}^FS
^FO50,270^A0N,25,25^FDQty: ${qty} ${uom}^FS
^FO50,310^A0N,25,25^FDBatch: ${batch_number}^FS
^FO50,350^A0N,25,25^FDExpiry: ${expiry_date}^FS
^FO50,390^A0N,25,25^FDQA: ${qa_status}^FS
^FO50,430^A0N,20,20^FDOperator: ${operator_badge}^FS
^XZ
```

**Variables** (replaced at runtime):
- `${lp_number}`: LP-2025-05678
- `${product_name}`: Wheat Bread
- `${qty}`: 250.00
- `${uom}`: kg
- `${batch_number}`: B-2025-0156
- `${expiry_date}`: 2025-06-15
- `${qa_status}`: Approved / Pending / Rejected
- `${operator_badge}`: JD-001

---

## Component References

From `scanner-ui-patterns.md`:

- **ScanInput**: Scan input field (48dp, 24px font, auto-focus)
- **ScannerScreen**: Base layout (header, progress, content, action bar)
- **StateHandler**: Wrapper for Loading/Empty/Error/Success states
- **QuantityInput**: Number pad (64x64dp keys, decimal support)
- **ActionButton**: Primary action button (48dp, full-width)
- **ConfirmationDialog**: Modal for critical confirmations

---

## Related Documents

- `docs/1-BASELINE/product/modules/production.md` (Lines 540-577, 615-622, 1484-1510)
- `docs/3-ARCHITECTURE/ux/patterns/scanner-ui-patterns.md`
- `docs/3-ARCHITECTURE/ux/wireframes/PROD-005-scanner-consume-material.md`

---

_Last Updated: 2025-12-14_
_UX-DESIGNER: Comprehensive mobile scanner workflow for output registration_
