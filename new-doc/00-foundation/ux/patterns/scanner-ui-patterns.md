# Scanner UI Patterns

**Status**: Reference Document
**Based On**: ADR-006 (Scanner-First Mobile UX)
**Last Updated**: 2025-12-11

---

## Overview

Standardized UI patterns for all MonoPilot scanner workflows. These patterns ensure consistency across warehouse receiving, production consumption, inventory moves, and shipping operations.

**Target Devices**:
- Industrial mobile computers (Zebra TC52/57, Honeywell CT60/CK65)
- Consumer phones (iPhone, Android) with camera scanning
- Ring scanners (Bluetooth) paired with mobile device

---

## Design Principles

### 1. Scan-First Input
- Hardware barcode scanner is **primary** input method
- Manual keyboard entry is **fallback** (tap to enable)
- Camera scanning is **alternative** (for consumer devices)

### 2. Large Touch Targets
- All buttons: **48x48dp minimum**
- List items: **64dp height**
- Input fields: **48dp height**
- Spacing: **8dp minimum** between targets

### 3. Linear Task Flows
- One task per screen (no dashboards)
- Step-by-step progression (Scan → Confirm → Complete)
- Minimal decisions (yes/no, not complex forms)
- Auto-advance on success (after 2s confirmation)

### 4. High Contrast
- Background: Slate-900 (#0f172a)
- Text: White (#ffffff) or Slate-300 (#cbd5e1)
- Error: Red-400 (#f87171)
- Success: Green-400 (#4ade80)
- Warning: Yellow-400 (#facc15)

### 5. Audible Feedback
- Success: 1 long beep (500ms)
- Error: 2 short beeps (200ms each, 100ms gap)
- Warning: 1 short beep (200ms)
- Vibration: 200ms on success, 100ms on error (if supported)

---

## Layout Structure

### Scanner Shell (Base Layout)

```
┌─────────────────────────────────────┐
│ Header (56dp)                       │
│  ← Back    User Badge    🔄 Sync    │
├─────────────────────────────────────┤
│                                     │
│                                     │
│                                     │
│         Content Area                │
│         (Scrollable)                │
│                                     │
│                                     │
│                                     │
├─────────────────────────────────────┤
│ Action Bar (64dp, fixed bottom)    │
│  [Primary Action Button 48dp]      │
└─────────────────────────────────────┘
```

**Dimensions**:
- Header: 56dp fixed height
- Content: calc(100vh - 56dp - 64dp)
- Action Bar: 64dp fixed height (8dp padding + 48dp button)
- Total viewport: 100vh

**Colors**:
- Header: Slate-800 (#1e293b)
- Content: Slate-900 (#0f172a)
- Action Bar: Slate-800 (#1e293b)

---

## Component Patterns

### 1. Scan Input Field

**Purpose**: Capture barcode from hardware scanner or manual entry

**Visual Design**:
```
┌─────────────────────────────────────┐
│  Scan barcode...                    │ ← 48dp height
│  [Large text input, 24px font]      │
└─────────────────────────────────────┘
    ↓ Tap to type manually (18px, gray)
```

**Specifications**:
- Height: 48dp
- Font size: 24px
- Background: Slate-700 (#334155)
- Text color: White (#ffffff)
- Placeholder: Slate-400 (#94a3b8)
- Border radius: 8dp
- Padding: 12dp horizontal

**Behavior**:
- Auto-focus on page load
- inputMode="none" (hides soft keyboard for hardware scanners)
- Enter key triggers scan action
- Manual entry toggle shows keyboard on tap

**States**:
- Default: Slate-700 background
- Focus: 2px cyan-500 ring
- Disabled: Slate-800 background, cursor not-allowed
- Error: 2px red-500 ring

**Code Example** (from ADR-006):
```tsx
<ScanInput
  onScan={(barcode) => handleScan(barcode)}
  placeholder="Scan LP number..."
  autoFocus={true}
/>
```

---

### 2. Scanner Screen Template

**Purpose**: Standard page structure for all scanner workflows

**Visual Design**:
```
┌─────────────────────────────────────┐
│ ← Receive PO          User  🔄      │ ← Header
├─────────────────────────────────────┤
│ Step 2 of 4: Scan Product           │ ← Progress
├─────────────────────────────────────┤
│                                     │
│   [Expected Items List]             │
│                                     │
│   [Scan Input Field]                │
│                                     │
│   [Scanned Item Details]            │
│                                     │
├─────────────────────────────────────┤
│ [Continue →] or [Cancel]            │ ← Action Bar
└─────────────────────────────────────┘
```

**Sections**:
1. **Header** (56dp): Back button, title, user badge, sync status
2. **Progress** (optional, 40dp): Step indicator (e.g., "Step 2 of 4")
3. **Content** (flexible): Scrollable main content
4. **Action Bar** (64dp): Primary action button (+ optional secondary)

**Header Elements**:
- Back button: 48x48dp touch target, left-aligned
- Title: 20px bold, white, truncate if long
- User badge: Avatar + name (optional), right-aligned
- Sync status: Icon (cloud/check/alert), 48x48dp touch target

**Progress Indicator**:
- Text: "Step [N] of [Total]: [Action]"
- Font size: 16px, Slate-300
- Background: Slate-800
- Height: 40dp, centered

**Action Bar**:
- Primary button: Full width or dominant (70%)
- Secondary button: 30% (if needed)
- Spacing: 8dp between buttons
- Padding: 8dp all sides

---

### 3. List Item (Scan Target)

**Purpose**: Display scannable items (POs, LPs, materials)

**Visual Design**:
```
┌─────────────────────────────────────┐
│ 📦 Flour, All-Purpose               │ ← 64dp height
│    LP-12345 • 50 kg • Batch A123    │
│    Exp: 2025-06-15 • Loc: A-01-02   │
│                            ✅ Scanned│ ← Status badge
└─────────────────────────────────────┘
```

**Specifications**:
- Height: 64dp minimum (auto-expand if multi-line)
- Padding: 12dp all sides
- Border bottom: 1px Slate-700
- Touch target: Full item height (64dp+)

**Content Layout**:
- Line 1: Product name (18px bold, white)
- Line 2: LP number, qty, batch (14px, Slate-300)
- Line 3: Expiry, location (14px, Slate-400)
- Badge: Top-right corner (24dp, status color)

**Status Colors**:
- Pending: Slate-500 background
- Scanned: Green-500 background
- Error: Red-500 background
- Warning: Yellow-500 background

**Interactive States**:
- Default: Slate-800 background
- Pressed: Slate-700 background (active state)
- Disabled: Slate-900 background, 50% opacity

---

### 4. State Handler

**Purpose**: Wrap content with loading/empty/error/success states

#### Loading State

**Visual Design**:
```
┌─────────────────────────────────────┐
│                                     │
│         ⟳ Scanning...               │ ← 32dp spinner
│         Looking up LP-12345         │
│                                     │
└─────────────────────────────────────┘
```

**Specifications**:
- Spinner: 32dp, cyan-500 color, rotating animation
- Text: 18px, Slate-300, centered below spinner
- Min display time: 300ms (avoid flicker)
- Max display time: 10s (timeout to error)

**Skeleton Variant** (for lists):
```
┌─────────────────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓       │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                    │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                    │
└─────────────────────────────────────┘
```

#### Empty State

**Visual Design**:
```
┌─────────────────────────────────────┐
│                                     │
│         📦 (96dp icon, Slate-600)   │
│                                     │
│    No pending receipts              │ ← 24px bold
│    All POs have been received       │ ← 16px, Slate-400
│                                     │
│    [Refresh] [View Completed]       │ ← 48dp buttons
│                                     │
└─────────────────────────────────────┘
```

**Specifications**:
- Icon: 96dp, Slate-600, centered
- Heading: 24px bold, white, centered
- Explanation: 16px, Slate-400, centered, max-width 300dp
- Actions: 48dp height, 8dp spacing, centered

**Required Elements**:
1. Icon (visual representation)
2. Heading (what's empty)
3. Explanation (why it's empty)
4. Action(s) (what user can do)

#### Error State

**Visual Design**:
```
┌─────────────────────────────────────┐
│                                     │
│         ❌ (96dp icon, Red-500)     │
│                                     │
│    LP not found                     │ ← 24px bold, Red-400
│    Barcode LP-99999 doesn't exist   │ ← 16px, Slate-300
│                                     │
│    [Scan Again] [Enter Manually]    │ ← 48dp buttons
│                                     │
└─────────────────────────────────────┘
```

**Specifications**:
- Icon: 96dp, Red-500, centered
- Error message: 24px bold, Red-400, centered
- Explanation: 16px, Slate-300, centered, max-width 300dp
- Actions: 48dp height, 8dp spacing, centered

**Error Patterns**:
| Error Type | Message | Actions |
|------------|---------|---------|
| Not Found | "[Resource] not found for [barcode]" | Scan Again, Enter Manually |
| Validation | "[Field] is required/invalid" | Fix and Retry |
| Network | "Unable to connect. Saved offline." | Retry, Continue Offline |
| Permission | "You don't have permission" | Go Back, Contact Admin |

**Audible Feedback**:
- 2 short beeps (200ms each, 100ms gap)
- Vibration: 100ms

#### Success State

**Visual Design**:
```
┌─────────────────────────────────────┐
│                                     │
│         ✅ (96dp icon, Green-500)   │
│                                     │
│    LP Created                       │ ← 24px bold, Green-400
│    LP-12345 • 50 kg • Batch A123    │ ← 16px, Slate-300
│                                     │
│    [Scan Next Material]             │ ← 48dp button
│                                     │
│    Auto-advancing in 2s...          │ ← 14px, Slate-400
└─────────────────────────────────────┘
```

**Specifications**:
- Icon: 96dp, Green-500, centered
- Success message: 24px bold, Green-400, centered
- Details: 16px, Slate-300, centered
- Action: 48dp height, centered
- Auto-advance timer: 14px, Slate-400

**Audible Feedback**:
- 1 long beep (500ms)
- Vibration: 200ms

**Auto-Advance**:
- Delay: 2s (configurable)
- Countdown: "Auto-advancing in [N]s..."
- Cancel: Tap anywhere to cancel auto-advance

---

### 5. Confirmation Dialog

**Purpose**: Confirm critical actions (delete, override)

**Visual Design**:
```
┌─────────────────────────────────────┐
│ Confirm Action                      │ ← Header (Slate-800)
├─────────────────────────────────────┤
│                                     │
│ Are you sure you want to delete     │
│ LP-12345?                           │
│                                     │
│ This action cannot be undone.       │
│                                     │
├─────────────────────────────────────┤
│ [Cancel]        [Delete]            │ ← 48dp buttons
└─────────────────────────────────────┘
```

**Specifications**:
- Modal: 90% width, max 400dp, centered vertically
- Header: 56dp, Slate-800, 20px bold text
- Content: 16px, Slate-300, padding 16dp
- Actions: 48dp height, 50/50 split
- Overlay: Slate-900, 80% opacity

**Button Styles**:
- Cancel: Outline, Slate-400 border
- Confirm (destructive): Solid, Red-600 background
- Confirm (safe): Solid, Cyan-600 background

---

### 6. Quantity Input

**Purpose**: Enter/adjust quantity (consumption, output, adjustment)

**Visual Design**:
```
┌─────────────────────────────────────┐
│ Quantity                            │
├─────────────────────────────────────┤
│  [−]     50.00 kg     [+]           │ ← 48dp buttons
│         ▓▓▓▓▓▓▓▓▓                   │ ← Input field
│                                     │
│  Available: 100 kg                  │ ← 14px, Slate-400
│  Required: 45 kg                    │
└─────────────────────────────────────┘
```

**Specifications**:
- Input: 64dp height, 32px font, center-aligned
- +/− buttons: 48x48dp, left/right of input
- UOM: Auto-append (kg, L, pcs)
- Number keyboard: inputMode="decimal"

**Behavior**:
- Tap input: Open number keyboard
- +/− buttons: Increment/decrement by 1 or 0.1 (decimals)
- Min value: 0 (or specified minimum)
- Max value: Available qty (or specified maximum)
- Validation: Real-time, error on exceed max

---

### 7. Material List (Expected Items)

**Purpose**: Show materials required for WO or receipt

**Visual Design**:
```
┌─────────────────────────────────────┐
│ Expected Materials (3 of 5 scanned) │ ← Progress
├─────────────────────────────────────┤
│ ✅ Flour, All-Purpose               │ ← Scanned (Green-800 bg)
│    50 kg • Batch A123 • LP-12345    │
├─────────────────────────────────────┤
│ 📦 Sugar, White Granulated          │ ← Pending (Slate-800 bg)
│    25 kg • Required                 │
├─────────────────────────────────────┤
│ 📦 Yeast, Active Dry                │ ← Pending
│    2 kg • Required                  │
└─────────────────────────────────────┘
```

**Specifications**:
- Item height: 64dp minimum
- Border: 1px Slate-700 between items
- Progress: Top header, sticky on scroll

**Item States**:
| State | Background | Icon | Text Color |
|-------|------------|------|------------|
| Scanned | Green-900 | ✅ | Green-300 |
| Pending | Slate-800 | 📦 | Slate-300 |
| Error | Red-900 | ❌ | Red-300 |
| Warning | Yellow-900 | ⚠️ | Yellow-300 |

**Behavior**:
- Tap item: Show details modal
- Auto-scroll to next pending item after scan
- Mark scanned items as checked

---

### 8. Barcode Display

**Purpose**: Show parsed barcode with visual confirmation

**Visual Design**:
```
┌─────────────────────────────────────┐
│ Scanned Barcode                     │
├─────────────────────────────────────┤
│  0100012345678905                   │ ← Raw barcode (mono)
│                                     │
│  ✅ GTIN-14: 00012345678905         │ ← Parsed (Green-400)
│  ✅ Batch: A123                     │
│  ✅ Expiry: 2025-06-15              │
└─────────────────────────────────────┘
```

**Specifications**:
- Raw barcode: 18px, monospace font, Slate-300
- Parsed fields: 16px, Green-400 (success) or Red-400 (error)
- Checkmark/X: 16dp icon before each field

**GS1 Parsing** (from ADR-004):
- (01) = GTIN-14
- (10) = Batch/Lot
- (17) = Expiry Date (YYMMDD)
- (00) = SSCC-18
- (37) = Quantity

---

### 9. Offline Indicator

**Purpose**: Show offline status and queued actions

**Visual Design**:
```
┌─────────────────────────────────────┐
│ ⚠️ Offline Mode • 3 actions queued  │ ← Banner (Yellow-900 bg)
├─────────────────────────────────────┤
│ ... (content) ...                   │
└─────────────────────────────────────┘
```

**Specifications**:
- Height: 40dp
- Background: Yellow-900 (#713f12)
- Text: Yellow-300 (#fde047)
- Icon: ⚠️ (16dp)
- Position: Below header, sticky

**States**:
- Offline: Yellow-900 background, "Offline Mode"
- Syncing: Cyan-900 background, "Syncing..." + spinner
- Synced: Green-900 background, "Synced" (auto-hide after 3s)

---

### 10. Action Button

**Purpose**: Primary action in workflows (Continue, Confirm, Complete)

**Visual Design**:
```
┌─────────────────────────────────────┐
│         Continue →                  │ ← 48dp height
└─────────────────────────────────────┘
```

**Specifications**:
- Height: 48dp
- Font size: 18px, bold
- Border radius: 8dp
- Full width (minus 16dp padding)

**Variants**:
| Type | Background | Text Color | Use Case |
|------|------------|------------|----------|
| Primary | Cyan-600 | White | Main action (Continue) |
| Success | Green-600 | White | Confirm, Complete |
| Destructive | Red-600 | White | Delete, Cancel |
| Secondary | Slate-700 | Slate-300 | Alternative action |
| Disabled | Slate-800 | Slate-500 | Not ready/allowed |

**States**:
- Default: Solid background
- Pressed: 10% darker background
- Disabled: 50% opacity, cursor not-allowed
- Loading: Spinner + "Processing..." text

---

## Common Workflows

### Workflow 1: Scan → Confirm → Complete

**Steps**:
1. **Scan**: Show scan input, auto-focus
2. **Lookup**: Loading state (spinner + "Scanning...")
3. **Confirm**: Show scanned item details, quantity input
4. **Complete**: Success state, auto-advance to next

**Example**: Material Consumption
```
Step 1: Scan Material LP
 → [Scan Input Field]
 → [Expected Materials List]

Step 2: Confirm Quantity (after scan)
 → [LP Details]
 → [Quantity Input]
 → [Confirm Button]

Step 3: Success
 → [Success Icon]
 → "Material Consumed"
 → [Scan Next Material]
```

### Workflow 2: List → Select → Scan → Confirm

**Steps**:
1. **List**: Show pending items (POs, TOs, WOs)
2. **Select**: Tap item to open
3. **Scan**: Scan product/LP for selected item
4. **Confirm**: Show details, confirm action

**Example**: GRN from PO
```
Step 1: Select PO
 → [Pending POs List]
 → Tap PO-12345

Step 2: Scan Product
 → [PO Lines Expected]
 → [Scan Input]

Step 3: Confirm Receipt
 → [Product Details]
 → [Quantity Input]
 → [Batch, Expiry Inputs]
 → [Create GRN Button]

Step 4: Success
 → "LP Created: LP-12345"
 → [Scan Next Product] or [Complete]
```

---

## Responsive Behavior

### Portrait (Default)

- Single column layout
- Full-width components
- Stacked buttons (vertical)
- Optimized for one-handed use

### Landscape (Optional)

- Two-column layout (50/50 or 60/40)
- Left: Input/scan area
- Right: Details/list
- Side-by-side buttons

---

## Animation Guidelines

### Transitions

- Page transitions: 200ms ease-out
- Success flash: 300ms green background, fade out
- Error shake: 300ms horizontal shake (10px amplitude)
- Auto-advance countdown: Circular progress (2s)

### Loading

- Spinner: Continuous rotation, 1s per rotation
- Skeleton: Pulse animation, 1.5s cycle
- Progress bar: Smooth fill, no jumps

---

## Accessibility (Scanner-Specific)

### Touch Targets

- All buttons: 48x48dp ✅
- List items: 64dp ✅
- Input fields: 48dp ✅
- Spacing: 8dp minimum ✅

### Contrast

- Text on Slate-900: White (18.96:1) ✅
- Error text: Red-400 on Slate-900 (6.32:1) ✅
- Success text: Green-400 on Slate-900 (8.44:1) ✅

### Audible Feedback

- Success: 1 long beep (500ms)
- Error: 2 short beeps (200ms each)
- Warning: 1 short beep (200ms)

### Vibration

- Success: 200ms
- Error: 100ms
- Warning: 50ms

---

## Code Examples

### ScanInput Component

```tsx
<ScanInput
  onScan={(barcode) => handleScan(barcode)}
  placeholder="Scan LP number..."
  autoFocus={true}
  disabled={loading}
/>
```

### StateHandler Wrapper

```tsx
<StateHandler
  loading={loading}
  error={error}
  empty={items.length === 0}
  emptyMessage="No pending receipts"
  emptyAction={() => navigate('/receiving')}
>
  {/* Content when items exist */}
  <MaterialList items={items} />
</StateHandler>
```

### ScannerScreen Layout

```tsx
<ScannerScreen
  title="Receive PO"
  step={2}
  totalSteps={4}
  onBack={() => navigate(-1)}
  actionButton={{
    label: "Continue",
    onClick: handleContinue,
    disabled: !canContinue,
  }}
>
  {/* Screen content */}
</ScannerScreen>
```

---

## Quality Checklist

Before wireframe approval, verify:

- [ ] Touch targets >= 48x48dp
- [ ] Text size >= 18px (24px for inputs)
- [ ] Contrast >= 4.5:1 for all text
- [ ] All 4 states defined (Loading, Empty, Error, Success)
- [ ] Audible feedback specified
- [ ] Auto-focus on scan input
- [ ] Linear flow (no complex navigation)
- [ ] Offline behavior defined
- [ ] Vibration feedback specified

---

_Last Updated: 2025-12-11_
_UX-DESIGNER: Scanner patterns based on ADR-006_
