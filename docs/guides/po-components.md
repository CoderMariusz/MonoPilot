# PO Components Reference

Story: 03.4 - PO Totals + Tax Calculations & 03.5a - PO Approval Setup

## Overview

This guide covers the React components used for PO totals display, tax calculations, discount input, shipping costs, and approval settings.

## POTotalsSection

Displays a formatted summary of purchase order totals including subtotal, tax, discount, shipping, and total. Supports mixed tax rates with expandable breakdown.

### Location

`/apps/frontend/components/planning/purchase-orders/POTotalsSection.tsx`

### Props

```typescript
interface POTotalsSectionProps {
  // Required
  subtotal: number;              // Subtotal before tax and discount
  taxAmount: number;             // Total tax amount
  discountTotal: number;         // Total discount amount
  shippingCost: number;          // Shipping cost
  total: number;                 // Final total (subtotal + tax - discount + shipping)
  currency: Currency;            // Currency code (PLN, EUR, USD, GBP)

  // Optional
  taxBreakdown?: TaxBreakdownItem[];  // Per-rate tax breakdown for mixed rates
  receivedValue?: number;             // Received amount (for detail page)
  isLoading?: boolean;                // Show loading skeleton
  error?: string | null;              // Error message to display
  onRetry?: () => void;               // Retry callback for error state
  compact?: boolean;                  // Compact mode for modals
  className?: string;                 // Additional CSS classes
}

interface TaxBreakdownItem {
  rate: number;      // Tax rate percentage
  subtotal: number;  // Subtotal for this rate
  tax: number;       // Tax amount for this rate
}

type Currency = 'PLN' | 'EUR' | 'USD' | 'GBP';
```

### Examples

#### Basic Usage

```typescript
import { POTotalsSection } from '@/components/planning/purchase-orders/POTotalsSection';

export function PODetail() {
  return (
    <POTotalsSection
      subtotal={1000.00}
      taxAmount={230.00}
      discountTotal={50.00}
      shippingCost={25.00}
      total={1205.00}
      currency="PLN"
    />
  );
}
```

#### With Mixed Tax Rates

```typescript
<POTotalsSection
  subtotal={1500.00}
  taxAmount={239.25}
  discountTotal={0}
  shippingCost={0}
  total={1739.25}
  currency="PLN"
  taxBreakdown={[
    { rate: 23, subtotal: 1000.00, tax: 230.00 },
    { rate: 0, subtotal: 500.00, tax: 0.00 }
  ]}
/>
```

#### With Received Value

```typescript
<POTotalsSection
  subtotal={1000.00}
  taxAmount={230.00}
  discountTotal={0}
  shippingCost={25.00}
  total={1255.00}
  currency="PLN"
  receivedValue={627.50}  // Partial receipt
/>
```

#### Loading State

```typescript
<POTotalsSection
  subtotal={0}
  taxAmount={0}
  discountTotal={0}
  shippingCost={0}
  total={0}
  currency="PLN"
  isLoading={true}
/>
```

#### Error State

```typescript
<POTotalsSection
  subtotal={0}
  taxAmount={0}
  discountTotal={0}
  shippingCost={0}
  total={0}
  currency="PLN"
  error="Failed to calculate totals"
  onRetry={() => refetchTotals()}
/>
```

#### Compact Mode (for modals)

```typescript
<POTotalsSection
  subtotal={1000.00}
  taxAmount={230.00}
  discountTotal={0}
  shippingCost={25.00}
  total={1255.00}
  currency="PLN"
  compact={true}
/>
```

### States

| State | Visual | Use Case |
|-------|--------|----------|
| **Loading** | Skeleton placeholders | Async data fetching |
| **Error** | Red alert with retry button | Calculation or API failure |
| **Empty** | Message "Add lines to see totals" | No lines in PO |
| **Success** | Full totals display | Normal operation |

### Features

- Automatic tax breakdown expansion when multiple tax rates exist
- Color coding: Green for discounts/received, Orange for outstanding
- Currency formatting with symbol and code
- Expandable inline tax breakdown
- Responsive design for mobile and desktop
- Accessibility: ARIA labels and roles for screen readers

---

## TaxBreakdownTooltip

Displays a tooltip with per-rate tax breakdown for POs with multiple tax rates.

### Location

`/apps/frontend/components/planning/purchase-orders/TaxBreakdownTooltip.tsx`

### Props

```typescript
interface TaxBreakdownTooltipProps {
  // Required
  taxBreakdown: TaxBreakdownItem[];  // Tax breakdown items
  currency: Currency;                // Currency code

  // Optional
  totalTax?: number;                 // Total tax (calculated if not provided)
  isLoading?: boolean;               // Show loading skeleton
  error?: string | null;             // Error message
  onRetry?: () => void;              // Retry callback
  className?: string;                // Additional CSS classes
}
```

### Examples

#### Basic Usage

```typescript
import { TaxBreakdownTooltip } from '@/components/planning/purchase-orders/TaxBreakdownTooltip';

<TaxBreakdownTooltip
  taxBreakdown={[
    { rate: 23, subtotal: 1000.00, tax: 230.00 },
    { rate: 0, subtotal: 500.00, tax: 0.00 }
  ]}
  currency="PLN"
/>
```

#### With Total Tax

```typescript
<TaxBreakdownTooltip
  taxBreakdown={[
    { rate: 23, subtotal: 1000.00, tax: 230.00 },
    { rate: 8, subtotal: 500.00, tax: 40.00 }
  ]}
  totalTax={270.00}
  currency="PLN"
/>
```

### Tooltip Content

When multiple tax rates exist, the tooltip shows:

```
Tax Breakdown
23% on 1000.00 PLN: 230.00 PLN
8% on 500.00 PLN: 40.00 PLN

Total Tax: 270.00 PLN
```

---

## DiscountInput

Input component for entering discounts in either percentage or fixed amount mode.

### Location

`/apps/frontend/components/planning/purchase-orders/DiscountInput.tsx`

### Props

```typescript
export type DiscountMode = 'percent' | 'amount';

interface DiscountInputProps {
  // Required
  value: number;                    // Current discount value
  onChange: (value: number, mode: DiscountMode) => void;  // Change callback
  mode: DiscountMode;               // Current mode
  max: number;                      // Maximum allowed discount (line total)

  // Optional
  currency?: string;                // Currency for amount mode (default: USD)
  label?: string;                   // Input label (default: "Discount")
  isLoading?: boolean;              // Show loading skeleton
  error?: string | null;            // Error message
  disabled?: boolean;               // Disable input
  className?: string;               // Additional CSS classes
}
```

### Examples

#### Percentage Mode

```typescript
import { DiscountInput } from '@/components/planning/purchase-orders/DiscountInput';
import { useState } from 'react';

export function LineForm() {
  const [discount, setDiscount] = useState(0);
  const [mode, setMode] = useState('percent');
  const lineTotal = 1000; // line total

  return (
    <DiscountInput
      value={discount}
      onChange={(val, newMode) => {
        setDiscount(val);
        setMode(newMode);
      }}
      mode={mode}
      max={lineTotal}
      label="Discount"
      currency="PLN"
    />
  );
}
```

#### Amount Mode

```typescript
<DiscountInput
  value={100}
  onChange={(val, newMode) => {
    setDiscount(val);
    setMode(newMode);
  }}
  mode="amount"
  max={1000}
  currency="PLN"
/>
```

#### With Error

```typescript
<DiscountInput
  value={0}
  onChange={handleChange}
  mode="percent"
  max={1000}
  error="Discount cannot exceed line total"
/>
```

### Features

- **Toggle between modes**: Click % or $ button to switch
- **Automatic conversion**: Converting 10% of 1000 = 100.00 in amount mode
- **Validation**: Real-time validation with error messages
- **Keyboard support**: Arrow keys adjust value by step
- **Helper text**: Shows equivalent value in the other mode

### Validation Rules

**Percentage Mode**:
- Must be 0-100%
- Calculated amount cannot exceed line total

**Amount Mode**:
- Must be >= 0
- Cannot exceed line total

---

## ShippingCostInput

Currency input field for entering PO-level shipping costs.

### Location

`/apps/frontend/components/planning/purchase-orders/ShippingCostInput.tsx`

### Props

```typescript
interface ShippingCostInputProps {
  // Required
  value: number;                   // Current shipping cost
  onChange: (value: number) => void;  // Change callback
  currency: Currency;              // Currency code

  // Optional
  label?: string;                  // Label (default: "Shipping Cost")
  placeholder?: string;            // Placeholder text (default: "0.00")
  isLoading?: boolean;             // Show loading skeleton
  error?: string | null;           // Error message
  disabled?: boolean;              // Disable input
  max?: number;                    // Maximum shipping cost (default: 999999.99)
  step?: number;                   // Keyboard step increment (default: 1)
  showIcon?: boolean;              // Show truck icon (default: true)
  className?: string;              // Additional CSS classes
}
```

### Examples

#### Basic Usage

```typescript
import { ShippingCostInput } from '@/components/planning/purchase-orders/ShippingCostInput';
import { useState } from 'react';

export function POForm() {
  const [shipping, setShipping] = useState(0);

  return (
    <ShippingCostInput
      value={shipping}
      onChange={setShipping}
      currency="PLN"
    />
  );
}
```

#### With Custom Label and Max

```typescript
<ShippingCostInput
  value={50}
  onChange={setShipping}
  currency="EUR"
  label="Delivery Cost"
  max={5000}
  step={10}
/>
```

#### Loading State

```typescript
<ShippingCostInput
  value={0}
  onChange={setShipping}
  currency="PLN"
  isLoading={true}
/>
```

### Features

- Currency symbol prefix and code suffix
- Keyboard navigation with arrow keys
- Validation: Cannot be negative
- Automatic formatting on blur
- Tabular numbers for alignment

---

## POApprovalSettings

Standalone component for configuring PO approval workflow settings.

### Location

`/apps/frontend/components/settings/POApprovalSettings.tsx`

### Props

```typescript
interface POApprovalSettingsProps {
  // Required
  settings: PlanningSettings;  // Current settings object
  onSave: (updates: PlanningSettingsUpdate) => void;  // Save callback

  // Optional
  isLoading?: boolean;         // Disable save button during save
}

interface PlanningSettings {
  id: string;
  org_id: string;
  po_require_approval: boolean;
  po_approval_threshold: number | null;
  po_approval_roles: string[];
  // ... other settings
}

interface PlanningSettingsUpdate {
  po_require_approval?: boolean;
  po_approval_threshold?: number | null;
  po_approval_roles?: string[];
}
```

### Examples

#### Basic Usage

```typescript
import { POApprovalSettings } from '@/components/settings/POApprovalSettings';
import { useState } from 'react';
import { usePlanningSettings } from '@/lib/hooks/use-planning-settings';

export function PlanningSettingsPage() {
  const { data: settings } = usePlanningSettings();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSave(updates) {
    setIsLoading(true);
    try {
      await fetch('/api/settings/planning', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (!settings) return <div>Loading...</div>;

  return (
    <POApprovalSettings
      settings={settings}
      onSave={handleSave}
      isLoading={isLoading}
    />
  );
}
```

### Form Fields

1. **Require Approval** (Toggle)
   - Default: false
   - Enables/disables the entire approval workflow

2. **Approval Threshold** (Currency Input)
   - Default: null (all POs require approval)
   - Disabled when "Require Approval" is off
   - If set, only POs above this amount require approval
   - Max 4 decimal places

3. **Approval Roles** (Multi-Select Dropdown)
   - Default: ["admin", "manager"]
   - Users with these roles can approve POs
   - At least one role must be selected
   - Shows as chips with remove buttons

### Features

- Form validation with error messages
- Tooltips on all fields
- Role loading from system
- Currency formatting
- Keyboard navigation support
- Loading state on save button
- Real-time validation

### Validation

| Field | Rules |
|-------|-------|
| `po_approval_threshold` | Positive number > 0; max 4 decimals; can be null |
| `po_approval_roles` | At least one role; non-empty strings |

---

## Accessibility Features

All components include accessibility features:

### POTotalsSection
- `role="region"` for main container
- `aria-label="Purchase order totals"`
- `role="list"` and `role="listitem"` for breakdown items
- Proper semantic HTML

### DiscountInput
- `aria-invalid` for error states
- `aria-describedby` for error messages
- `aria-pressed` for mode toggle buttons
- Label properly associated with input

### ShippingCostInput
- `aria-invalid` for error states
- `aria-describedby` for error messages
- Label with icon properly associated

### POApprovalSettings
- `role="checkbox"` for toggle switch
- `role="button"` for trigger buttons
- `role="listbox"` for multi-select dropdown
- `role="alert"` for error messages
- `aria-expanded` for dropdown state

---

## Styling & Theming

All components use ShadCN UI components and TailwindCSS. They respect the application's color scheme (light/dark mode):

```typescript
// Dark mode support
<POTotalsSection
  className="dark"  // Forces dark mode
  // ... props
/>
```

---

## Performance Tips

1. **Memoize calculations**:
   ```typescript
   const totals = useMemo(
     () => calculatePOTotals(lines, shipping),
     [lines, shipping]
   );
   ```

2. **Use key props in lists**:
   ```typescript
   {taxBreakdown.map((item, idx) => (
     <div key={`${item.rate}-${idx}`}>...</div>
   ))}
   ```

3. **Lazy load tooltips**:
   Component uses React.lazy() for optional tax breakdown tooltip

---

## Testing

All components have unit tests in `__tests__/` directories:

```typescript
// Run component tests
npm run test -- POTotalsSection.test.tsx
npm run test -- DiscountInput.test.tsx
npm run test -- POApprovalSettings.test.tsx
```

---

## Changelog

### v1.0 (2025-01-02)

- Initial release with all four components
- Full accessibility support
- Mixed tax rate support in POTotalsSection
- Discount mode toggle in DiscountInput
- Currency formatting and validation
- Role-based approval settings in POApprovalSettings
