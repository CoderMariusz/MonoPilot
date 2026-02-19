# Scanner Consumption Components Guide

**Story:** 04.6b - Material Consumption Scanner
**Version:** 1.0
**Last Updated:** 2026-01-21

## Overview

This guide explains how to use the Scanner Consumption components to build mobile-first material consumption workflows. The components are designed for industrial handheld scanners (Zebra TC52, Honeywell CT60) and consumer mobile devices.

**Who is this for:**
- Frontend developers integrating scanner consumption
- UX designers understanding component specifications
- QA engineers testing scanner workflows

---

## Component Architecture

```
ScannerConsumeWizard (main container)
  |
  +-- ScannerHeader
  +-- StepProgress
  |
  +-- Step1ScanWO
  +-- Step2ScanLP
  +-- Step3EnterQty
  |     +-- NumberPad
  +-- Step4Review
  +-- Step5Confirm
  |     +-- LoadingOverlay
  +-- Step6Next
  |
  +-- ErrorAnimation
  +-- AudioFeedback
  +-- HapticFeedback
```

---

## Quick Start

### Basic Usage

```tsx
import { ScannerConsumeWizard } from '@/components/scanner/consume/ScannerConsumeWizard'

function ConsumePage() {
  return (
    <ScannerConsumeWizard
      onComplete={() => {
        // Navigate away or show success
        router.push('/production/work-orders')
      }}
    />
  )
}
```

### With Custom Completion Handler

```tsx
<ScannerConsumeWizard
  onComplete={() => {
    // Custom logic after consumption
    toast.success('Material consumed successfully!')
    refreshMaterialsList()
  }}
/>
```

---

## Component Reference

### ScannerConsumeWizard

Main container component that orchestrates the 6-step consumption flow.

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onComplete` | `() => void` | No | Callback when user clicks "Done" |

**Features:**
- 6-step state machine
- Auto-advance on valid scans
- Audio/haptic feedback
- Error handling with retry

**Example:**

```tsx
function ProductionApp() {
  const handleComplete = () => {
    // Refresh production dashboard
    queryClient.invalidateQueries(['work-orders'])
  }

  return <ScannerConsumeWizard onComplete={handleComplete} />
}
```

---

### ScannerHeader

Mobile-optimized header with back navigation and help button.

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `title` | string | Yes | Header title text |
| `onBack` | `() => void` | No | Back button handler (hidden if not provided) |
| `showHelp` | boolean | No | Show help icon button |

**Specifications:**
- Height: 56dp
- Font: 24px bold
- Touch target: 48x48dp minimum

**Example:**

```tsx
<ScannerHeader
  title="WO-2026-0156"
  onBack={() => goBack()}
  showHelp={true}
/>
```

---

### StepProgress

Visual step indicator showing current progress.

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `currentStep` | number | Yes | Current step (1-6) |
| `totalSteps` | number | Yes | Total steps (6) |
| `stepLabels` | string[] | Yes | Labels for each step |

**Example:**

```tsx
const STEP_LABELS = ['Scan WO', 'Scan LP', 'Enter Qty', 'Review', 'Confirm', 'Complete']

<StepProgress
  currentStep={2}
  totalSteps={6}
  stepLabels={STEP_LABELS}
/>
```

---

### Step1ScanWO

First step - scan or enter Work Order barcode.

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onScan` | `(barcode: string) => void` | Yes | Callback when barcode entered |

**Features:**
- Auto-focus on input
- Hardware scanner support (keyboard input)
- Manual entry fallback
- Barcode icon (68dp)

**Example:**

```tsx
<Step1ScanWO
  onScan={async (barcode) => {
    const result = await fetchWOByBarcode(barcode)
    handleWOScan(result)
  }}
/>
```

---

### Step2ScanLP

Second step - scan License Plate barcode.

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `woData` | WOData | Yes | Current work order data |
| `material` | ConsumptionMaterial | No | Current material to consume |
| `onScan` | `(barcode: string) => void` | Yes | Callback when LP scanned |

**Features:**
- WO summary display
- Materials list with progress bars
- Current material highlight
- Auto-focus scan input

**Example:**

```tsx
<Step2ScanLP
  woData={{
    id: 'wo-001',
    wo_number: 'WO-2026-0156',
    product_name: 'Chocolate Cookies',
    status: 'in_progress',
    materials: [...]
  }}
  material={currentMaterial}
  onScan={handleLPBarcodeScan}
/>
```

---

### Step3EnterQty

Third step - enter consumption quantity.

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `lpData` | LPData | Yes | Scanned LP data |
| `material` | ConsumptionMaterial | Yes | Material being consumed |
| `value` | number \| null | Yes | Current quantity value |
| `onChange` | `(qty: number) => void` | Yes | Quantity change handler |
| `onFullConsumption` | `() => void` | Yes | Full LP button handler |
| `onConfirm` | `() => void` | Yes | Proceed to review |

**Features:**
- Large number pad (64x64dp keys)
- Decimal support
- "Full Consumption" quick action
- LP info display
- Remaining quantity calculation

**Example:**

```tsx
<Step3EnterQty
  lpData={{
    id: 'lp-001',
    lp_number: 'LP-2026-01234',
    product_name: 'Wheat Flour',
    quantity: 500,
    uom: 'kg'
  }}
  material={currentMaterial}
  value={consumeQty}
  onChange={setConsumeQty}
  onFullConsumption={handleFullConsumption}
  onConfirm={proceedToReview}
/>
```

---

### NumberPad

Large touch-target number pad for quantity entry.

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `value` | string | Yes | Current input value |
| `onChange` | `(value: string) => void` | Yes | Value change handler |
| `disabled` | boolean | No | Disable input |
| `maxDecimals` | number | No | Maximum decimal places (default: 2) |

**Layout:**
```
[7] [8] [9] [<]
[4] [5] [6] [C]
[1] [2] [3] [.]
   [0] [00]
```

**Specifications:**
- Key size: 64x64dp
- Spacing: 8dp
- Background: Slate-700
- Font: 24px bold white

**Example:**

```tsx
const [value, setValue] = useState('')

<NumberPad
  value={value}
  onChange={setValue}
  maxDecimals={3}
/>
```

---

### Step4Review

Fourth step - review consumption before confirmation.

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `woData` | WOData | Yes | Work order data |
| `lpData` | LPData | Yes | License plate data |
| `material` | ConsumptionMaterial | Yes | Material data |
| `consumeQty` | number | Yes | Quantity to consume |
| `isFullLP` | boolean | Yes | Full LP consumption flag |
| `onBack` | `() => void` | Yes | Back button handler |
| `onConfirm` | `() => void` | Yes | Confirm button handler |

**Display:**
- Material name
- LP number and details
- Quantity to consume
- LP remaining after consumption
- Batch number and expiry (if available)
- Progress impact summary

**Example:**

```tsx
<Step4Review
  woData={woData}
  lpData={lpData}
  material={currentMaterial}
  consumeQty={50.5}
  isFullLP={false}
  onBack={goBack}
  onConfirm={handleSubmit}
/>
```

---

### Step5Confirm

Fifth step - processing confirmation (loading state).

**Props:** None

**Features:**
- Spinner animation (32dp)
- "Processing..." text
- Auto-advance on success

**Example:**

```tsx
{state === 'confirm' && <Step5Confirm />}
```

---

### Step6Next

Sixth step - success with next action options.

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `woData` | WOData | Yes | Work order data |
| `consumedMaterial` | ConsumptionMaterial | No | Material just consumed |
| `consumeQty` | number | Yes | Quantity consumed |
| `onNextMaterial` | `() => void` | Yes | "Next Material" handler |
| `onDone` | `() => void` | Yes | "Done" handler |

**Features:**
- Success animation (green check, 96dp)
- Updated materials progress
- "X of Y materials complete"
- Two action buttons

**Example:**

```tsx
<Step6Next
  woData={woData}
  consumedMaterial={currentMaterial}
  consumeQty={50.5}
  onNextMaterial={handleNextMaterial}
  onDone={handleDone}
/>
```

---

## Feedback Components

### AudioFeedback

Static class for audio feedback.

**Methods:**

```typescript
// Success - 1 long beep (500ms, 440Hz)
AudioFeedback.playSuccess()

// Error - 2 short beeps (200ms each, 100ms gap)
AudioFeedback.playError()

// Confirm - Success sound
AudioFeedback.playConfirm()
```

**Usage:**

```tsx
try {
  const result = await scanWO(barcode)
  AudioFeedback.playSuccess()
  handleWOScan(result)
} catch (error) {
  AudioFeedback.playError()
  showError(error.message)
}
```

---

### HapticFeedback

Static class for vibration feedback.

**Methods:**

```typescript
// Success - 200ms vibration
HapticFeedback.success()

// Error - 100ms vibration
HapticFeedback.error()

// Confirm - 200ms vibration
HapticFeedback.confirm()
```

**Note:** Gracefully handles devices without vibration support.

**Usage:**

```tsx
HapticFeedback.success()
```

---

### ErrorAnimation

Error display with shake animation.

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `show` | boolean | Yes | Show/hide animation |
| `message` | string | Yes | Error message text |

**Specifications:**
- Icon: Red X (68dp)
- Animation: Shake 300ms
- Color: Red-500
- Font: 18px

**Example:**

```tsx
<ErrorAnimation
  show={!!error}
  message={error?.message || 'An error occurred'}
/>
```

---

### SuccessAnimation

Success display with scale-in animation.

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `show` | boolean | Yes | Show/hide animation |
| `message` | string | No | Optional success message |

**Specifications:**
- Icon: Green check (96dp)
- Animation: Scale-in 300ms
- Color: Green-500
- Duration: 1-2 seconds before auto-advance

---

### LoadingOverlay

Full-screen loading overlay.

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `show` | boolean | Yes | Show/hide overlay |
| `message` | string | No | Loading message (default: "Loading...") |

**Specifications:**
- Spinner: 32dp, Cyan-500
- Background: Semi-transparent white
- Z-index: Above all content

**Example:**

```tsx
<LoadingOverlay
  show={isSubmitting}
  message="Processing consumption..."
/>
```

---

## useScannerFlow Hook

State machine hook for managing the 6-step flow.

### Return Values

```typescript
const {
  // State
  state,        // 'scan_wo' | 'scan_lp' | 'enter_qty' | 'review' | 'confirm' | 'next'
  step,         // 1-6
  totalSteps,   // 6
  woData,       // WOData | null
  lpData,       // LPData | null
  consumeQty,   // number | null
  isFullLP,     // boolean
  isSubmitting, // boolean
  error,        // { code: string, message: string } | null

  // Actions
  handleWOScan,         // (woData: WOData) => void
  handleWOScanError,    // (code: string, message: string) => void
  handleLPScan,         // (lpData: LPData) => void
  handleLPScanError,    // (code: string, message: string) => void
  setConsumeQty,        // (qty: number) => void
  handleFullConsumption, // () => void
  proceedToReview,      // () => void
  submitConsumption,    // () => void
  handleConsumptionSuccess, // () => void
  handleConsumptionError,   // (code: string, message: string) => void
  handleNextMaterial,   // () => void
  handleDone,           // () => void
  goBack,               // () => void
} = useScannerFlow()
```

### State Machine Transitions

```
scan_wo   --[SET_WO]-->      scan_lp
scan_lp   --[SET_LP]-->      enter_qty
enter_qty --[SET_FULL_CONSUMPTION]--> review  (skips qty entry)
enter_qty --[PROCEED_TO_REVIEW]-->    review
review    --[SUBMIT_CONSUMPTION]-->   confirm
confirm   --[CONSUMPTION_SUCCESS]-->  next
confirm   --[CONSUMPTION_ERROR]-->    review
next      --[NEXT_MATERIAL]-->        scan_lp
next      --[RESET]-->                scan_wo
```

### Usage Example

```tsx
import { useScannerFlow } from '@/lib/hooks/use-scanner-flow'
import { useRecordConsumption } from '@/lib/hooks/use-consumption'

function CustomScannerFlow() {
  const {
    state,
    step,
    woData,
    lpData,
    consumeQty,
    handleWOScan,
    handleLPScan,
    setConsumeQty,
    handleFullConsumption,
    proceedToReview,
    submitConsumption,
    handleConsumptionSuccess,
    handleConsumptionError,
    handleNextMaterial,
    handleDone,
  } = useScannerFlow()

  const recordConsumption = useRecordConsumption()

  const handleSubmit = async () => {
    if (!woData || !lpData || !consumeQty) return

    submitConsumption()

    try {
      await recordConsumption.mutateAsync({
        woId: woData.id,
        request: {
          wo_material_id: woData.materials[0].id,
          lp_id: lpData.id,
          consume_qty: consumeQty,
        },
      })
      await handleConsumptionSuccess()
    } catch (error) {
      handleConsumptionError('CONSUME_FAILED', error.message)
    }
  }

  return (
    <div>
      <p>Step {step} of 6: {state}</p>
      {/* Render step components */}
    </div>
  )
}
```

---

## Accessibility

### Touch Targets

| Element | Minimum Size |
|---------|--------------|
| Buttons | 48x48dp |
| Number pad keys | 64x64dp |
| List items | 64dp height |

### Font Sizes

| Element | Size |
|---------|------|
| Body text | 18px minimum |
| Input fields | 24px monospace |
| Headings | 24px bold |

### Contrast

- WCAG AA compliant (4.5:1 minimum)
- High contrast colors for success/error states

### Keyboard Support

- Tab order follows visual flow
- Enter key submits forms
- Hardware scanner input supported (HID keyboard)

---

## Device Support

### Industrial Scanners

- Zebra TC52/TC57
- Honeywell CT60/CK65
- Datalogic Memor 10/20

**Notes:**
- Hardware keyboard input (barcode as keystrokes + Enter)
- Auto-submit on Enter key

### Consumer Devices

- iPhone (Safari) - iOS 14+
- Android (Chrome) - Android 8+
- Ring scanners via Bluetooth HID

### Viewport

| Breakpoint | Description |
|------------|-------------|
| 320px | Minimum width |
| 375px | Target (iPhone SE) |
| 480px | Maximum width |

---

## Testing

### Unit Test Example

```typescript
import { renderHook, act } from '@testing-library/react'
import { useScannerFlow } from '@/lib/hooks/use-scanner-flow'

describe('useScannerFlow', () => {
  it('starts in scan_wo state', () => {
    const { result } = renderHook(() => useScannerFlow())
    expect(result.current.state).toBe('scan_wo')
    expect(result.current.step).toBe(1)
  })

  it('transitions to scan_lp on valid WO', async () => {
    const { result } = renderHook(() => useScannerFlow())

    await act(async () => {
      result.current.handleWOScan({
        id: 'wo-001',
        wo_number: 'WO-2026-0156',
        product_name: 'Test Product',
        status: 'in_progress',
        materials: [],
      })
    })

    expect(result.current.state).toBe('scan_lp')
    expect(result.current.step).toBe(2)
  })

  it('skips to review on full consumption', async () => {
    const { result } = renderHook(() => useScannerFlow())

    // Set up WO and LP
    await act(async () => {
      result.current.handleWOScan({ id: 'wo-001', wo_number: 'WO-001', product_name: 'Test', status: 'in_progress', materials: [] })
      result.current.handleLPScan({ id: 'lp-001', lp_number: 'LP-001', product_name: 'Material', quantity: 100, uom: 'kg' })
    })

    // Full consumption
    act(() => {
      result.current.handleFullConsumption()
    })

    expect(result.current.state).toBe('review')
    expect(result.current.consumeQty).toBe(100)
    expect(result.current.isFullLP).toBe(true)
  })
})
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test'

test('complete scanner consumption flow', async ({ page }) => {
  await page.goto('/scanner/consume')

  // Step 1: Scan WO
  await page.fill('[data-testid="barcode-input"]', 'WO-2026-0156')
  await page.press('[data-testid="barcode-input"]', 'Enter')

  // Wait for WO info to load
  await expect(page.locator('[data-testid="wo-info"]')).toBeVisible()

  // Step 2: Scan LP
  await page.fill('[data-testid="barcode-input"]', 'LP-2026-01234')
  await page.press('[data-testid="barcode-input"]', 'Enter')

  // Step 3: Enter quantity
  await page.click('[data-testid="numpad-5"]')
  await page.click('[data-testid="numpad-0"]')
  await page.click('[data-testid="confirm-qty"]')

  // Step 4: Review
  await expect(page.locator('[data-testid="review-screen"]')).toBeVisible()
  await page.click('[data-testid="confirm-consumption"]')

  // Step 5/6: Success
  await expect(page.locator('[data-testid="success-animation"]')).toBeVisible()
})

test('WO lookup under 500ms', async ({ page }) => {
  await page.goto('/scanner/consume')

  const startTime = Date.now()
  await page.fill('[data-testid="barcode-input"]', 'WO-2026-0156')
  await page.press('[data-testid="barcode-input"]', 'Enter')
  await expect(page.locator('[data-testid="wo-info"]')).toBeVisible()
  const endTime = Date.now()

  expect(endTime - startTime).toBeLessThan(500)
})
```

---

## Related Documentation

- [Scanner Consumption API Reference](../../api/production/scanner-consumption-api.md)
- [Material Consumption Desktop](./material-consumption-guide.md)
- [FIFO/FEFO Picking Guide](../warehouse/fifo-fefo-picking.md)

---

## Support

**Story:** 04.6b
**Last Updated:** 2026-01-21
