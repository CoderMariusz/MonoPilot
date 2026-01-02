# PO Calculation Service Reference

Story: 03.4 - PO Totals + Tax Calculations

## Overview

The PO Calculation Service provides backend functions for calculating purchase order totals, including line-level discounts, mixed tax rates, and shipping costs. All calculations follow strict rounding rules (2 decimal places for currency) and support various discount modes.

## Key Features

- **Line-level calculations**: Quantity, unit price, discounts, and tax
- **PO-level totals**: Subtotal, tax breakdown, discounts, shipping, and final total
- **Mixed tax rates**: Support for different tax rates on different lines
- **Flexible discounts**: Percentage or fixed amount modes
- **Currency rounding**: Consistent 2-decimal place rounding
- **Validation**: Comprehensive validation for discounts and shipping costs

## Service Functions

### calculateLineTotals(line)

Calculate line-level totals including discount and tax.

#### Parameters

```typescript
interface POLine {
  quantity: number;        // Must be > 0
  unit_price: number;      // Must be >= 0
  discount_percent?: number;  // 0-100%, optional
  discount_amount?: number;   // >= 0, optional
  tax_rate: number;        // 0-100%, applied after discount
}
```

#### Returns

```typescript
interface POLineCalculation {
  line_total: number;                // quantity * unit_price
  discount_amount: number;           // Discount in currency units
  line_total_after_discount: number; // line_total - discount_amount
  tax_amount: number;                // Tax on discounted amount
  line_total_with_tax: number;       // line_total_after_discount + tax_amount
}
```

#### Business Rules

- **AC-1**: line_total = quantity * unit_price
- **AC-4**: Discount percent (0-100%)
- **AC-5**: Discount amount prioritized over discount percent if both provided
- **AC-2**: Tax calculated on line_total_after_discount
- **AC-18**: Zero tax rates supported
- **AC-19**: Rounding to 2 decimal places

#### Example

```typescript
import { calculateLineTotals } from '@/lib/services/po-calculation-service';

const line = {
  quantity: 10,
  unit_price: 100.50,
  discount_percent: 10,  // 10% discount
  tax_rate: 23           // 23% VAT
};

const result = calculateLineTotals(line);
// Returns:
// {
//   line_total: 1005.00,
//   discount_amount: 100.50,
//   line_total_after_discount: 904.50,
//   tax_amount: 208.04,
//   line_total_with_tax: 1112.54
// }
```

#### Calculation Flow

```
Step 1: line_total = 10 * 100.50 = 1005.00
Step 2: discount_amount = 1005.00 * (10 / 100) = 100.50
Step 3: line_total_after_discount = 1005.00 - 100.50 = 904.50
Step 4: tax_amount = 904.50 * (23 / 100) = 208.035 -> 208.04 (rounded)
Step 5: line_total_with_tax = 904.50 + 208.04 = 1112.54
```

---

### calculatePOTotals(lines, shipping_cost)

Calculate PO-level totals from all lines.

#### Parameters

```typescript
lines: POLine[];        // Array of purchase order lines
shipping_cost: number;  // Optional shipping cost (default: 0)
```

#### Returns

```typescript
interface POTotals {
  subtotal: number;           // Sum of all line_totals
  tax_amount: number;         // Sum of all line tax_amounts
  discount_total: number;     // Sum of all line discounts
  shipping_cost: number;      // Shipping cost (from parameter)
  total: number;              // subtotal + tax + shipping - discount
  tax_breakdown: TaxBreakdownItem[];  // Per-rate tax breakdown
}
```

#### Business Rules

- **AC-1**: subtotal = sum of line totals (before discount)
- **AC-3**: Mixed tax rate support with breakdown
- **AC-6**: Shipping cost inclusion
- **AC-7**: total = subtotal + tax_amount + shipping_cost - discount_total
- **AC-8/9/10**: Auto-recalculation on line add/edit/delete

#### Example

```typescript
import { calculatePOTotals } from '@/lib/services/po-calculation-service';

const lines = [
  {
    quantity: 5,
    unit_price: 100,
    discount_amount: 25,
    tax_rate: 23
  },
  {
    quantity: 10,
    unit_price: 50,
    discount_percent: 0,
    tax_rate: 0  // Zero-rated items
  }
];

const totals = calculatePOTotals(lines, 50); // With 50 shipping cost

// Returns:
// {
//   subtotal: 1000.00,
//   tax_amount: 177.75,
//   discount_total: 25.00,
//   shipping_cost: 50.00,
//   total: 1202.75,
//   tax_breakdown: [
//     { rate: 23, subtotal: 475.00, tax: 109.25 },
//     { rate: 0, subtotal: 500.00, tax: 0.00 }
//   ]
// }
```

#### Calculation Flow

```
Line 1:
  line_total = 5 * 100 = 500.00
  discount = 25.00
  after_discount = 475.00
  tax (23%) = 109.25

Line 2:
  line_total = 10 * 50 = 500.00
  discount = 0
  after_discount = 500.00
  tax (0%) = 0.00

PO Totals:
  subtotal = 500 + 500 = 1000.00
  tax_amount = 109.25 + 0 = 109.25
  discount_total = 25 + 0 = 25.00
  shipping = 50.00
  total = 1000.00 + 109.25 + 50.00 - 25.00 = 1134.25
```

---

### calculateTaxBreakdown(lines)

Calculate tax breakdown grouped by tax rate.

#### Parameters

```typescript
lines: POLine[];  // Array of purchase order lines
```

#### Returns

```typescript
interface TaxBreakdownItem {
  rate: number;       // Tax rate percentage (0-100)
  subtotal: number;   // Sum of line_total_after_discount for this rate
  tax: number;        // Sum of tax_amount for this rate
}[]
// Sorted descending by rate
```

#### Business Rules

- **AC-3**: Group taxes by rate for mixed rate display
- **AC-18**: Include 0% tax rate in breakdown
- **Sort**: Descending by rate (highest first)

#### Example

```typescript
import { calculateTaxBreakdown } from '@/lib/services/po-calculation-service';

const lines = [
  { quantity: 5, unit_price: 100, discount_amount: 0, tax_rate: 23 },
  { quantity: 10, unit_price: 50, discount_amount: 0, tax_rate: 23 },
  { quantity: 8, unit_price: 75, discount_amount: 0, tax_rate: 0 },  // Zero-rated
  { quantity: 5, unit_price: 200, discount_amount: 0, tax_rate: 8 }  // Different rate
];

const breakdown = calculateTaxBreakdown(lines);

// Returns (sorted by rate descending):
// [
//   { rate: 23, subtotal: 1000.00, tax: 230.00 },
//   { rate: 8, subtotal: 1000.00, tax: 80.00 },
//   { rate: 0, subtotal: 600.00, tax: 0.00 }
// ]
```

---

### validateDiscount(line)

Validate a discount on a PO line.

#### Parameters

```typescript
interface POLine {
  quantity: number;
  unit_price: number;
  discount_percent?: number;
  discount_amount?: number;
  tax_rate: number;
}
```

#### Returns

```typescript
interface ValidationResult {
  valid: boolean;
  error?: string;  // Error message if valid=false
}
```

#### Validation Rules

- **AC-14**: Discount cannot exceed line_total
- **AC-15**: Discount cannot be negative
- Discount percent: 0-100%
- Discount amount: >= 0 and <= line_total

#### Example

```typescript
import { validateDiscount } from '@/lib/services/po-calculation-service';

// Valid discount
const result1 = validateDiscount({
  quantity: 10,
  unit_price: 100,
  discount_amount: 200,  // 20% of 1000
  tax_rate: 23
});
// Returns: { valid: true }

// Invalid: exceeds line total
const result2 = validateDiscount({
  quantity: 10,
  unit_price: 100,
  discount_amount: 1500,  // Exceeds 1000
  tax_rate: 23
});
// Returns: { valid: false, error: 'Discount amount cannot exceed line total' }

// Invalid: percent too high
const result3 = validateDiscount({
  quantity: 10,
  unit_price: 100,
  discount_percent: 150,  // > 100%
  tax_rate: 23
});
// Returns: { valid: false, error: 'Discount percent cannot exceed 100%' }
```

---

### validateShippingCost(shipping_cost)

Validate shipping cost.

#### Parameters

```typescript
shipping_cost: number;  // Shipping cost to validate
```

#### Returns

```typescript
interface ValidationResult {
  valid: boolean;
  error?: string;
}
```

#### Validation Rules

- **AC-16**: Shipping cost cannot be negative

#### Example

```typescript
import { validateShippingCost } from '@/lib/services/po-calculation-service';

const result1 = validateShippingCost(50.00);
// Returns: { valid: true }

const result2 = validateShippingCost(-10);
// Returns: { valid: false, error: 'Shipping cost cannot be negative' }
```

---

### roundCurrency(value)

Round a number to 2 decimal places for currency.

#### Parameters

```typescript
value: number;  // Value to round
```

#### Returns

```typescript
number;  // Rounded to 2 decimal places
```

#### Example

```typescript
import { roundCurrency } from '@/lib/services/po-calculation-service';

roundCurrency(123.456);   // Returns: 123.46
roundCurrency(123.454);   // Returns: 123.45
roundCurrency(100);       // Returns: 100.00
```

---

## Validation Schemas

All services use Zod schemas for input validation. Import and use these schemas for form validation:

### poLineCalculationSchema

```typescript
import { poLineCalculationSchema, POLineCalculationInput } from '@/lib/validation/po-calculation';

// Validate line input
const result = poLineCalculationSchema.safeParse({
  quantity: 10,
  unit_price: 100.50,
  discount_percent: 10,
  tax_rate: 23
});

if (!result.success) {
  // Handle validation errors
  console.log(result.error.flatten());
}
```

### poTotalsSchema

```typescript
import { poTotalsSchema } from '@/lib/validation/po-calculation';

const result = poTotalsSchema.safeParse({
  subtotal: 1000,
  tax_amount: 230,
  discount_total: 50,
  shipping_cost: 25,
  total: 1205
});
```

---

## Integration Examples

### React Component with Calculations

```typescript
import { useState, useMemo } from 'react';
import { calculatePOTotals } from '@/lib/services/po-calculation-service';
import { POTotalsSection } from '@/components/planning/purchase-orders/POTotalsSection';

export function POForm() {
  const [lines, setLines] = useState([
    { quantity: 10, unit_price: 100, discount_amount: 0, tax_rate: 23 }
  ]);
  const [shippingCost, setShippingCost] = useState(50);

  // Memoize totals calculation
  const totals = useMemo(
    () => calculatePOTotals(lines, shippingCost),
    [lines, shippingCost]
  );

  return (
    <div>
      {/* Line items form */}
      <LineItemsForm lines={lines} onChange={setLines} />

      {/* Shipping cost input */}
      <ShippingCostInput value={shippingCost} onChange={setShippingCost} />

      {/* Display totals */}
      <POTotalsSection
        subtotal={totals.subtotal}
        taxAmount={totals.tax_amount}
        discountTotal={totals.discount_total}
        shippingCost={totals.shipping_cost}
        total={totals.total}
        taxBreakdown={totals.tax_breakdown}
        currency="PLN"
      />
    </div>
  );
}
```

### Database Trigger Integration

The calculation functions are also implemented as database triggers for automatic recalculation:

```sql
-- Line-level calculations (triggered on INSERT/UPDATE of purchase_order_lines)
CREATE TRIGGER tr_calc_po_line_totals BEFORE INSERT OR UPDATE ON purchase_order_lines
FOR EACH ROW EXECUTE FUNCTION calc_po_line_totals();

-- PO-level totals (triggered when any line changes)
CREATE TRIGGER tr_update_po_totals AFTER INSERT OR DELETE OR UPDATE ON purchase_order_lines
FOR EACH ROW EXECUTE FUNCTION update_po_totals();

-- Shipping cost updates (triggered on UPDATE of purchase_orders.shipping_cost)
CREATE TRIGGER tr_po_shipping_update_totals BEFORE UPDATE OF shipping_cost ON purchase_orders
FOR EACH ROW EXECUTE FUNCTION recalculate_po_total_with_shipping();
```

---

## Rounding & Currency Rules

All monetary calculations use the following rules:

1. **Precision**: 2 decimal places (cents)
2. **Rounding Method**: Banker's rounding (round half to even)
3. **Timing**: Apply rounding AFTER each calculation step, not just at the end
4. **Storage**: Store all values as DECIMAL(15,4) in database for extra precision

Example:

```typescript
// Calculation with explicit rounding
const line_total = 100.00;
const discount_percent = 33.33;

// Round at each step
const discount = roundCurrency(line_total * (discount_percent / 100));
// 100 * 0.3333 = 33.33 (already 2 decimals, no change)

const after_discount = roundCurrency(line_total - discount);
// 100.00 - 33.33 = 66.67

const tax = roundCurrency(after_discount * 0.23);
// 66.67 * 0.23 = 15.3341 -> 15.33 (rounded)

const total = roundCurrency(after_discount + tax);
// 66.67 + 15.33 = 82.00
```

---

## Error Handling

All service functions are synchronous and throw JavaScript Error objects on failure:

```typescript
try {
  const totals = calculatePOTotals(lines, shipping_cost);
} catch (error) {
  console.error('Calculation failed:', error.message);
}
```

Validation functions return ValidationResult objects instead of throwing:

```typescript
const validation = validateDiscount(line);
if (!validation.valid) {
  console.error(validation.error);  // User-friendly message
}
```

---

## Performance Considerations

- **calculateLineTotals**: O(1) - Single line calculation
- **calculatePOTotals**: O(n) - Iterates through all lines
- **calculateTaxBreakdown**: O(n log n) - Iterates and sorts by rate
- **Validation functions**: O(1) - Simple checks

For POs with 100+ lines, memoize calculations to avoid unnecessary recomputation:

```typescript
const totals = useMemo(
  () => calculatePOTotals(lines, shippingCost),
  [lines, shippingCost]  // Only recalculate when these change
);
```

---

## Changelog

### v1.0 (2025-01-02)

- Initial release with core calculation functions
- Support for mixed tax rates
- Line-level and PO-level calculations
- Discount percentage and amount modes
- Shipping cost support
- Comprehensive validation functions
