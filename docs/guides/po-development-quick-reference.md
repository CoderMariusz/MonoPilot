# PO Development Quick Reference

Stories: 03.4 & 03.5a - Quick Dev Guide

## Import Paths

### Calculation Services

```typescript
import {
  calculateLineTotals,
  calculatePOTotals,
  calculateTaxBreakdown,
  validateDiscount,
  validateShippingCost,
  roundCurrency
} from '@/lib/services/po-calculation-service';
```

### Planning Settings Services

```typescript
import {
  getPlanningSettings,
  updatePlanningSettings,
  initializePlanningSettings,
  getDefaultPlanningSettings
} from '@/lib/services/planning-settings-service';
```

### Validation Schemas

```typescript
// PO Calculation
import {
  poLineCalculationSchema,
  poHeaderCalculationSchema,
  poTotalsSchema
} from '@/lib/validation/po-calculation';

// Planning Settings
import {
  poApprovalSettingsSchema,
  planningSettingsUpdateSchema
} from '@/lib/validation/planning-settings-schema';
```

### Types

```typescript
// PO Calculation Types
import type {
  POLine,
  POLineCalculation,
  TaxBreakdownItem,
  POTotals,
  ValidationResult,
  Currency
} from '@/lib/services/po-calculation-service';

// Planning Settings Types
import type {
  PlanningSettings,
  PlanningSettingsUpdate,
  POApprovalSettings
} from '@/lib/types/planning-settings';
```

### Components

```typescript
// Totals Display
import { POTotalsSection } from '@/components/planning/purchase-orders/POTotalsSection';
import { TaxBreakdownTooltip } from '@/components/planning/purchase-orders/TaxBreakdownTooltip';

// Inputs
import { DiscountInput } from '@/components/planning/purchase-orders/DiscountInput';
import { ShippingCostInput } from '@/components/planning/purchase-orders/ShippingCostInput';

// Settings
import { POApprovalSettings } from '@/components/settings/POApprovalSettings';
```

---

## Common Code Snippets

### Calculate PO Totals

```typescript
const lines = poLineItems.map(item => ({
  quantity: item.quantity,
  unit_price: item.unitPrice,
  discount_percent: item.discountPercent,
  discount_amount: item.discountAmount,
  tax_rate: item.taxRate
}));

const totals = calculatePOTotals(lines, poHeader.shippingCost);

console.log(totals);
// {
//   subtotal: 1000.00,
//   tax_amount: 230.00,
//   discount_total: 50.00,
//   shipping_cost: 25.00,
//   total: 1205.00,
//   tax_breakdown: [...]
// }
```

### Validate Discount Before Save

```typescript
const validation = validateDiscount({
  quantity: 10,
  unit_price: 100,
  discount_percent: discountPercent,
  discount_amount: discountAmount,
  tax_rate: 23
});

if (!validation.valid) {
  toast({
    title: 'Validation Error',
    description: validation.error,
    variant: 'destructive'
  });
  return;
}
```

### Fetch Planning Settings

```typescript
async function loadSettings() {
  try {
    const response = await fetch('/api/settings/planning');
    if (!response.ok) throw new Error('Failed to fetch');
    const settings = await response.json();
    return settings;
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
}
```

### Update Approval Settings

```typescript
async function saveApprovalSettings(updates) {
  try {
    const response = await fetch('/api/settings/planning', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        po_require_approval: updates.requireApproval,
        po_approval_threshold: updates.threshold,
        po_approval_roles: updates.roles
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error.message);
    }

    const { data, message } = await response.json();
    toast({ title: 'Success', description: message });
    return data;
  } catch (error) {
    toast({
      title: 'Error',
      description: error.message,
      variant: 'destructive'
    });
  }
}
```

### Display PO Totals in Component

```typescript
import { useMemo } from 'react';
import { POTotalsSection } from '@/components/planning/purchase-orders';
import { calculatePOTotals } from '@/lib/services/po-calculation-service';

export function PODetailCard({ po, lines }) {
  const totals = useMemo(
    () => calculatePOTotals(lines, po.shipping_cost),
    [lines, po.shipping_cost]
  );

  return (
    <POTotalsSection
      subtotal={totals.subtotal}
      taxAmount={totals.tax_amount}
      discountTotal={totals.discount_total}
      shippingCost={totals.shipping_cost}
      total={totals.total}
      taxBreakdown={totals.tax_breakdown}
      currency={po.currency}
      isLoading={isLoading}
      error={error}
      onRetry={refetch}
    />
  );
}
```

### Discount Mode Toggle

```typescript
import { DiscountInput } from '@/components/planning/purchase-orders';
import { useState } from 'react';

export function LineDiscountForm() {
  const [discount, setDiscount] = useState(0);
  const [mode, setMode] = useState('percent');

  return (
    <DiscountInput
      value={discount}
      onChange={(value, newMode) => {
        setDiscount(value);
        setMode(newMode);
      }}
      mode={mode}
      max={1000}  // Line total
      currency="PLN"
    />
  );
}
```

---

## Calculation Examples

### Line Calculation

```
Line: 10 units @ 100 PLN each, 10% discount, 23% tax

Step-by-step:
1. line_total = 10 * 100 = 1000.00
2. discount_amount = 1000.00 * (10 / 100) = 100.00
3. after_discount = 1000.00 - 100.00 = 900.00
4. tax_amount = 900.00 * (23 / 100) = 207.00
5. with_tax = 900.00 + 207.00 = 1107.00

Result:
{
  line_total: 1000.00,
  discount_amount: 100.00,
  line_total_after_discount: 900.00,
  tax_amount: 207.00,
  line_total_with_tax: 1107.00
}
```

### PO Totals with Mixed Tax

```
Line 1: 500 subtotal, 23% tax = 115 tax
Line 2: 500 subtotal, 0% tax = 0 tax
Shipping: 50

Calculation:
- subtotal = 500 + 500 = 1000
- tax = 115 + 0 = 115
- discount = 0
- shipping = 50
- total = 1000 + 115 - 0 + 50 = 1165

Tax breakdown:
[
  { rate: 23, subtotal: 500, tax: 115 },
  { rate: 0, subtotal: 500, tax: 0 }
]
```

---

## Database Queries

### Select PO with Totals

```sql
SELECT
  id,
  po_number,
  status,
  supplier_id,
  subtotal,
  tax_amount,
  discount_total,
  shipping_cost,
  total,
  currency,
  created_at
FROM purchase_orders
WHERE org_id = $1
ORDER BY created_at DESC;
```

### Select PO Lines with Calculations

```sql
SELECT
  id,
  po_id,
  material_id,
  quantity,
  unit_price,
  discount_percent,
  discount_amount,
  tax_rate,
  tax_amount,
  line_total,
  created_at
FROM purchase_order_lines
WHERE po_id = $1
ORDER BY created_id;
```

### Update PO Shipping Cost (triggers recalculation)

```sql
UPDATE purchase_orders
SET shipping_cost = $1
WHERE id = $2;

-- This trigger will recalculate total:
-- NEW.total := NEW.subtotal + NEW.tax_amount + NEW.shipping_cost - NEW.discount_total;
```

### Calculate Tax Breakdown

```sql
SELECT
  tax_rate,
  COUNT(*) as line_count,
  SUM(quantity * unit_price) as subtotal,
  SUM(tax_amount) as total_tax
FROM purchase_order_lines
WHERE po_id = $1
GROUP BY tax_rate
ORDER BY tax_rate DESC;
```

---

## API Endpoints Quick Reference

### Planning Settings

```
GET    /api/settings/planning
PUT    /api/settings/planning
PATCH  /api/settings/planning
```

### Response Format

```typescript
// GET (auto-init)
{
  id: string;
  org_id: string;
  po_require_approval: boolean;
  po_approval_threshold: number | null;
  po_approval_roles: string[];
  // ... other settings
}

// PUT/PATCH
{
  success: boolean;
  data: PlanningSettings;
  message: string;
}

// Error
{
  success: false;
  error: {
    code: string;
    message: string;
    details: any;
  }
}
```

---

## Testing Patterns

### Test Calculation Function

```typescript
import { calculateLineTotals } from '@/lib/services/po-calculation-service';
import { describe, it, expect } from 'vitest';

describe('calculateLineTotals', () => {
  it('should calculate line totals with discount and tax', () => {
    const result = calculateLineTotals({
      quantity: 10,
      unit_price: 100,
      discount_percent: 10,
      tax_rate: 23
    });

    expect(result.line_total).toBe(1000);
    expect(result.discount_amount).toBe(100);
    expect(result.tax_amount).toBeCloseTo(207, 1);
  });
});
```

### Test Component Rendering

```typescript
import { render, screen } from '@testing-library/react';
import { POTotalsSection } from '@/components/planning/purchase-orders';

describe('POTotalsSection', () => {
  it('should display totals correctly', () => {
    render(
      <POTotalsSection
        subtotal={1000}
        taxAmount={230}
        discountTotal={50}
        shippingCost={25}
        total={1205}
        currency="PLN"
      />
    );

    expect(screen.getByText(/Subtotal:/)).toBeInTheDocument();
    expect(screen.getByText(/1205/)).toBeInTheDocument();
  });
});
```

### Test API Endpoint

```typescript
import { POST } from '@/app/api/settings/planning/route';

describe('Planning Settings API', () => {
  it('should validate threshold before update', async () => {
    const request = new Request('http://localhost/api/settings/planning', {
      method: 'PUT',
      body: JSON.stringify({
        po_approval_threshold: -100  // Invalid
      })
    });

    const response = await PUT(request);
    expect(response.status).toBe(400);
  });
});
```

---

## Debugging Tips

### Log Calculations

```typescript
const lines = /* ... */;
const totals = calculatePOTotals(lines, 50);

console.group('PO Calculations');
console.log('Lines:', lines);
console.log('Totals:', totals);
console.table(totals.tax_breakdown);
console.groupEnd();
```

### Check Rounding

```typescript
import { roundCurrency } from '@/lib/services/po-calculation-service';

const value = 123.456;
console.log(roundCurrency(value));  // 123.46

// Check precision
const tax = (900 * 0.23);
console.log('Before rounding:', tax);
console.log('After rounding:', roundCurrency(tax));
```

### Validate Schema

```typescript
import { poLineCalculationSchema } from '@/lib/validation/po-calculation';

const lineData = { /* ... */ };
const result = poLineCalculationSchema.safeParse(lineData);

if (!result.success) {
  console.error('Validation errors:', result.error.flatten());
} else {
  console.log('Valid data:', result.data);
}
```

### Monitor API Calls

```typescript
// Add logging to settings fetch
async function debugFetchSettings() {
  console.time('Fetch Settings');

  const response = await fetch('/api/settings/planning');
  const data = await response.json();

  console.timeEnd('Fetch Settings');
  console.log('Response:', data);

  return data;
}
```

---

## Performance Checklist

- [ ] Memoized `calculatePOTotals` in components
- [ ] Used `useMemo` for calculation results
- [ ] Implemented `useCallback` for change handlers
- [ ] Added index on `purchase_order_lines(po_id)` for triggers
- [ ] Validated input before calculation
- [ ] No N+1 queries in settings API
- [ ] Lazy loaded tax breakdown tooltip
- [ ] Debounced shipping cost input changes

---

## Security Checklist

- [ ] Validated all inputs server-side with Zod
- [ ] Checked authentication on all API endpoints
- [ ] Verified authorization (admin/owner for settings PUT/PATCH)
- [ ] Used parameterized queries (no SQL injection)
- [ ] Applied RLS policies on database tables
- [ ] Sanitized error messages (no sensitive data)
- [ ] Logged all setting changes
- [ ] Tested with invalid/malicious input

---

## Version Info

- **Created**: 2025-01-02
- **Last Updated**: 2025-01-02
- **Stories**: 03.4, 03.5a
- **Status**: Production Ready
