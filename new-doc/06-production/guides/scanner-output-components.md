# Scanner Output Components Guide

**Story:** 04.7b - Output Registration Scanner
**Version:** 1.0
**Last Updated:** 2026-01-21

## Overview

This guide explains how to use the Scanner Output components to build mobile-first production output registration workflows. The components are designed for industrial handheld scanners (Zebra TC52, Honeywell CT60) and consumer mobile devices.

**Who is this for:**
- Frontend developers integrating scanner output registration
- UX designers understanding component specifications
- QA engineers testing scanner workflows

---

## Component Architecture

```
ScannerOutputWizard (main container)
  |
  +-- ScannerHeader
  +-- StepProgress
  |
  +-- ScanWOStep (Step 1)
  +-- EnterQuantityStep (Step 2)
  |     +-- OutputNumberPad
  +-- SelectQAStatusStep (Step 3)
  +-- ReviewOutputStep (Step 4)
  +-- LPCreatedStep (Step 5)
  +-- PrintLabelStep (Step 6)
  +-- ByProductPromptStep (Step 7)
  |
  +-- ErrorAnimation
  +-- LoadingOverlay
  +-- AudioFeedback
  +-- HapticFeedback
```

---

## Quick Start

### Basic Usage

```tsx
import { ScannerOutputWizard } from '@/components/scanner/output/ScannerOutputWizard'

function OutputPage() {
  return (
    <ScannerOutputWizard
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
<ScannerOutputWizard
  onComplete={() => {
    // Custom logic after output registration
    toast.success('Output registered successfully!')
    refreshWOList()
  }}
/>
```

---

## Component Reference

### ScannerOutputWizard

Main container component that orchestrates the 7-step output registration flow.

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onComplete` | `() => void` | No | Callback when user clicks "Done" |

**Features:**
- 7-step state machine
- Auto-advance on successful LP creation (2s)
- Audio/haptic feedback
- Voice announcement "LP created"
- Error handling with retry
- Offline queue support

**Example:**

```tsx
function ProductionApp() {
  const handleComplete = () => {
    // Refresh production dashboard
    queryClient.invalidateQueries(['work-orders'])
  }

  return <ScannerOutputWizard onComplete={handleComplete} />
}
```

---

### ScanWOStep

Step 1 - Scan or enter Work Order barcode.

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onScan` | `(barcode: string) => void` | Yes | Callback when barcode entered |
| `error` | `WizardError \| null` | No | Error to display |
| `onClearError` | `() => void` | No | Clear error handler |

**Features:**
- Auto-focus on input
- Hardware scanner support (keyboard input)
- Manual entry fallback
- Barcode icon (68dp)
- 500ms validation target

**Example:**

```tsx
<ScanWOStep
  onScan={async (barcode) => {
    const result = await validateWO(barcode)
    if (result.valid) {
      handleWOScan(result.wo)
    } else {
      handleWOScanError('INVALID_WO', result.error)
    }
  }}
  error={error}
  onClearError={clearError}
/>
```

---

### EnterQuantityStep

Step 2 - Enter production quantity using number pad.

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `woData` | WOData | Yes | Work order data |
| `overproductionWarning` | OverproductionWarning \| null | No | Warning for overproduction |
| `onConfirm` | `(qty: number) => void` | Yes | Quantity confirmation handler |
| `onBack` | `() => void` | Yes | Back button handler |

**Features:**
- Large number pad (64x64dp keys)
- Decimal support (2 places)
- Clear and backspace buttons
- Progress preview
- Overproduction warning (orange)
- Remaining quantity display

**Example:**

```tsx
<EnterQuantityStep
  woData={{
    id: 'wo-001',
    wo_number: 'WO-2026-0156',
    product_name: 'Chocolate Cookies',
    planned_qty: 1000,
    registered_qty: 800,
    remaining_qty: 200,
    uom: 'kg',
    batch_number: 'WO-2026-0156',
    shelf_life_days: 30,
  }}
  overproductionWarning={overproductionWarning}
  onConfirm={handleQuantityConfirm}
  onBack={goBack}
/>
```

---

### OutputNumberPad

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
[1] [2] [3]
[4] [5] [6]
[7] [8] [9]
[.] [0] [<-]
    [Clear]
```

**Specifications:**
- Key size: 64x64dp
- Spacing: 8dp
- Background: Slate-700
- Font: 24px bold white

**Example:**

```tsx
const [value, setValue] = useState('')

<OutputNumberPad
  value={value}
  onChange={setValue}
  maxDecimals={2}
/>
```

---

### SelectQAStatusStep

Step 3 - Select QA status with large color-coded buttons.

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `productName` | string | Yes | Product name to display |
| `quantity` | number | Yes | Quantity to display |
| `batchNumber` | string | Yes | Batch number to display |
| `onSelect` | `(status: QAStatus) => void` | Yes | Status selection handler |
| `onBack` | `() => void` | Yes | Back button handler |

**Features:**
- Three large buttons (64dp height)
- Color coding: green (approved), yellow (pending), red (rejected)
- Selection state with checkmark
- Pre-selected "pending" when require_qa_on_output = false

**Example:**

```tsx
<SelectQAStatusStep
  productName="Chocolate Cookies"
  quantity={250}
  batchNumber="WO-2026-0156"
  onSelect={(status) => {
    setQAStatus(status)
    proceedToReview()
  }}
  onBack={goBack}
/>
```

---

### ReviewOutputStep

Step 4 - Review output details before confirmation.

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `woData` | WOData | Yes | Work order data |
| `reviewData` | ReviewData | Yes | Review summary data |
| `onConfirm` | `() => void` | Yes | Confirm button handler |
| `onBack` | `() => void` | Yes | Back button handler |
| `onEditQuantity` | `() => void` | Yes | Edit quantity handler |
| `onEditQAStatus` | `() => void` | Yes | Edit QA status handler |

**Display:**
- Product name
- Quantity with UoM
- QA Status (color-coded)
- Batch Number
- Expiry Date (auto-calculated)
- Location
- LP Number Preview (LP-YYYYMMDD-NNNN)

**Example:**

```tsx
<ReviewOutputStep
  woData={woData}
  reviewData={{
    product_name: 'Chocolate Cookies',
    quantity: 250,
    qa_status: 'approved',
    batch_number: 'WO-2026-0156',
    expiry_date: '2026-02-20',
    lp_preview: 'LP-20260121-0001',
  }}
  onConfirm={handleSubmit}
  onBack={goBack}
  onEditQuantity={() => goBack()}
  onEditQAStatus={() => goBack()}
/>
```

---

### LPCreatedStep

Step 5 - Success confirmation with LP details.

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `lpData` | LPData | Yes | Created LP data |
| `woProgress` | WOProgress | Yes | Updated WO progress |
| `onNext` | `() => void` | Yes | Next step handler (auto-triggered) |

**Features:**
- Green check animation (96dp)
- Voice announcement "LP created" via Web Speech API
- Device vibration (200ms)
- LP details card (number, qty, batch)
- Progress update display ("750 / 1000 (75%)")
- Auto-advance to Step 6 after 2 seconds
- Manual "Next" button for immediate advance

**Example:**

```tsx
<LPCreatedStep
  lpData={{
    id: 'lp-uuid-001',
    lp_number: 'LP-20260121-0001',
    qty: 250,
    uom: 'kg',
    batch_number: 'WO-2026-0156',
    qa_status: 'approved',
    expiry_date: '2026-02-20',
  }}
  woProgress={{
    output_qty: 750,
    progress_percent: 75,
    remaining_qty: 250,
  }}
  onNext={() => {}}
/>
```

---

### PrintLabelStep

Step 6 - Print LP label with preview.

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `lpData` | LPData | Yes | LP data for label |
| `canPrint` | boolean | Yes | Whether printing is enabled |
| `printDisabledReason` | string \| null | No | Reason for disabled state |
| `onPrint` | `() => void` | Yes | Print button handler |
| `onSkip` | `() => void` | Yes | Skip button handler |

**Features:**
- Label preview showing: LP barcode (Code128), product name, qty with UoM, batch, expiry
- Print button (2s target completion)
- Disabled state with tooltip when no printer
- Retry button on error
- Skip option to proceed without printing

**Example:**

```tsx
<PrintLabelStep
  lpData={lpData}
  canPrint={printerStatus.configured}
  printDisabledReason={printerStatus.configured ? null : 'No printer configured'}
  onPrint={handlePrint}
  onSkip={skipPrint}
/>
```

---

### ByProductPromptStep

Step 7 - By-product registration prompts.

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `byProduct` | ByProductInfo & { expected_qty: number } | Yes | Current by-product |
| `onYes` | `() => void` | Yes | Yes button handler |
| `onSkip` | `() => void` | Yes | Skip this by-product handler |
| `onSkipAll` | `() => void` | Yes | Skip all remaining handler |

**Features:**
- By-product list with expected quantities
- Expected qty calculation (planned_qty * yield_percent / 100)
- Three action buttons: Yes, Skip, Skip All
- Zero-quantity warning with confirmation
- Loop through multiple by-products

**Example:**

```tsx
<ByProductPromptStep
  byProduct={{
    id: 'bp-uuid-123',
    name: 'Cookie Crumbs',
    code: 'BP-CRUMB-001',
    yield_percent: 5,
    expected_qty: 50,
    uom: 'kg',
  }}
  onYes={handleByProductYes}
  onSkip={handleByProductSkip}
  onSkipAll={handleByProductSkipAll}
/>
```

---

## useScannerOutput Hook

State machine hook for managing the 7-step flow.

### Return Values

```typescript
const {
  // State
  state,              // WizardState
  step,               // 1-7
  totalSteps,         // 7
  woData,             // WOData | null
  quantity,           // number | null
  qaStatus,           // QAStatus | null
  lpData,             // LPData | null
  byProducts,         // ByProductInfo[]
  currentByProduct,   // ByProductInfo & { expected_qty } | null
  isSubmitting,       // boolean
  error,              // WizardError | null
  overproductionWarning, // OverproductionWarning | null
  reviewData,         // ReviewData | null
  woProgress,         // WOProgress | null
  canPrint,           // boolean
  printDisabledReason,// string | null
  completionMessage,  // string | null

  // Actions
  handleWOScan,       // (woData: WOData) => void
  handleWOScanError,  // (code: string, message: string) => void
  setQuantity,        // (qty: number) => void
  proceedToQA,        // () => void
  setQAStatus,        // (status: QAStatus) => void
  proceedToReview,    // () => void
  submitOutput,       // () => void
  handleOutputSuccess,// (data) => void
  handleOutputError,  // (error: WizardError) => void
  skipPrint,          // () => void
  handlePrintSuccess, // () => void
  handlePrintError,   // (message: string) => void
  proceedToByProducts,// () => void
  handleByProductRegistered, // (data) => void
  handleByProductSkip,// () => void
  handleByProductSkipAll, // () => void
  goBack,             // () => void
  reset,              // () => void
} = useScannerOutput()
```

### State Machine Transitions

```
scan_wo     --[WO_SCANNED]-->         enter_qty
enter_qty   --[PROCEED_TO_QA]-->      select_qa
select_qa   --[PROCEED_TO_REVIEW]-->  review
review      --[SUBMIT_OUTPUT]-->      (submitting)
(submitting)--[OUTPUT_SUCCESS]-->     lp_created
lp_created  --[AUTO 2s]-->            print_label
print_label --[SKIP_PRINT]-->         by_products | complete
print_label --[PRINT_SUCCESS]-->      by_products | complete
by_products --[BY_PRODUCT_SKIP_ALL]--> complete
by_products --[BY_PRODUCT_REGISTERED]--> next by_product | complete
```

### Usage Example

```tsx
import { useScannerOutput } from '@/lib/hooks/use-scanner-output'

function CustomOutputFlow() {
  const {
    state,
    step,
    woData,
    quantity,
    qaStatus,
    lpData,
    handleWOScan,
    setQuantity,
    proceedToQA,
    setQAStatus,
    proceedToReview,
    submitOutput,
    handleOutputSuccess,
    handleOutputError,
    goBack,
    reset,
  } = useScannerOutput()

  const handleSubmit = async () => {
    if (!woData || !quantity || !qaStatus) return

    submitOutput()

    try {
      const response = await fetch('/api/production/output/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wo_id: woData.id,
          quantity,
          qa_status: qaStatus,
          batch_number: woData.batch_number,
          expiry_date: calculateExpiryDate(woData.shelf_life_days),
          location_id: defaultLocationId,
        }),
      })

      const data = await response.json()
      handleOutputSuccess({ lp: data.lp, wo_progress: data.wo_progress })
    } catch (error) {
      handleOutputError({ code: 'NETWORK_ERROR', message: error.message })
    }
  }

  return (
    <div>
      <p>Step {step} of 7: {state}</p>
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
| QA status buttons | Full width x 64dp |

### Font Sizes

| Element | Size |
|---------|------|
| Body text | 18px minimum |
| Input fields | 24px monospace |
| Headings | 24px bold |
| Quantity display | 32px |

### Contrast

- WCAG AA compliant (4.5:1 minimum)
- Color-coded QA buttons with sufficient contrast
- High contrast for success/error states

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

### ZPL Printers

- Zebra ZT410/ZT230/ZD620
- 203 DPI standard
- Code128 barcode format

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
import { useScannerOutput } from '@/lib/hooks/use-scanner-output'

describe('useScannerOutput', () => {
  it('starts in scan_wo state', () => {
    const { result } = renderHook(() => useScannerOutput())
    expect(result.current.state).toBe('scan_wo')
    expect(result.current.step).toBe(1)
  })

  it('transitions to enter_qty on valid WO', async () => {
    const { result } = renderHook(() => useScannerOutput())

    act(() => {
      result.current.handleWOScan({
        id: 'wo-001',
        wo_number: 'WO-2026-0156',
        product_name: 'Test Product',
        planned_qty: 1000,
        registered_qty: 800,
        remaining_qty: 200,
        uom: 'kg',
        batch_number: 'WO-2026-0156',
        shelf_life_days: 30,
      })
    })

    expect(result.current.state).toBe('enter_qty')
    expect(result.current.step).toBe(2)
  })

  it('shows overproduction warning when qty > remaining', () => {
    const { result } = renderHook(() => useScannerOutput())

    act(() => {
      result.current.handleWOScan({
        id: 'wo-001',
        wo_number: 'WO-2026-0156',
        product_name: 'Test',
        planned_qty: 1000,
        registered_qty: 800,
        remaining_qty: 200,
        uom: 'kg',
        batch_number: 'B-001',
        shelf_life_days: 30,
      })
    })

    act(() => {
      result.current.setQuantity(300)
    })

    expect(result.current.overproductionWarning).not.toBeNull()
    expect(result.current.overproductionWarning?.excess).toBe(100)
  })
})
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test'

test('complete scanner output flow', async ({ page }) => {
  await page.goto('/scanner/output')

  // Step 1: Scan WO
  await page.fill('[data-testid="barcode-input"]', 'WO-2026-0156')
  await page.press('[data-testid="barcode-input"]', 'Enter')

  // Wait for WO validation
  await expect(page.locator('[data-testid="quantity-input"]')).toBeVisible()

  // Step 2: Enter quantity
  await page.click('[data-testid="numpad-2"]')
  await page.click('[data-testid="numpad-5"]')
  await page.click('[data-testid="numpad-0"]')
  await page.click('[data-testid="confirm-qty"]')

  // Step 3: Select QA
  await page.click('[data-testid="qa-approved"]')

  // Step 4: Review
  await expect(page.locator('[data-testid="review-screen"]')).toBeVisible()
  await page.click('[data-testid="confirm-output"]')

  // Step 5: LP Created
  await expect(page.locator('[data-testid="success-animation"]')).toBeVisible()

  // Step 6: Print (skip)
  await page.click('[data-testid="skip-print"]')

  // Complete
  await expect(page.locator('text=Output registration complete')).toBeVisible()
})

test('WO lookup under 500ms', async ({ page }) => {
  await page.goto('/scanner/output')

  const startTime = Date.now()
  await page.fill('[data-testid="barcode-input"]', 'WO-2026-0156')
  await page.press('[data-testid="barcode-input"]', 'Enter')
  await expect(page.locator('[data-testid="quantity-input"]')).toBeVisible()
  const endTime = Date.now()

  expect(endTime - startTime).toBeLessThan(500)
})
```

---

## Related Documentation

- [Scanner Output API Reference](./scanner-output-api.md)
- [ZPL Label Generation Guide](./zpl-label-guide.md)
- [Offline Queue Guide](./offline-queue-guide.md)
- [Material Consumption Scanner](./scanner-consume-components.md)

---

## Support

**Story:** 04.7b
**Last Updated:** 2026-01-21
