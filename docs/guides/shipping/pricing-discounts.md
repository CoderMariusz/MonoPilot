# SO Line Pricing and Discounts Guide

**Story:** 07.4 - SO Line Pricing
**Version:** 1.0
**Last Updated:** 2026-01-22

## Overview

This guide explains how to work with pricing and discounts on sales order lines in MonoPilot. The pricing system supports automatic price population from product master data, manual price overrides, and two types of discounts (percentage and fixed amount).

**Who is this for:**
- Sales clerks entering customer orders
- Sales managers reviewing and approving discounts
- Frontend developers implementing pricing UI
- QA engineers testing pricing calculations

---

## What You Can Do

The SO Line Pricing feature allows you to:

1. **Auto-populate prices** - Unit prices fill automatically from product master
2. **Override prices** - Manually adjust prices for special pricing
3. **Apply discounts** - Percentage or fixed discounts per line
4. **View real-time totals** - Line and order totals update instantly
5. **Validate inputs** - System prevents invalid prices and discounts

---

## Prerequisites

Before working with line pricing:

1. **Products set up** - Products must have `std_price` in Technical > Products
2. **Draft order** - Pricing can only be modified on draft orders
3. **Proper role** - You need `sales`, `manager`, `admin`, or `owner` role

---

## Pricing Flow

```
Product Selected
       |
       v
+-------------------+
| Auto-populate     |
| unit_price from   |
| product.std_price |
+--------+----------+
         |
         v
+-------------------+
| User can override |
| price manually    |
+--------+----------+
         |
         v
+-------------------+
| User can add      |
| discount (opt)    |
+--------+----------+
         |
         v
+-------------------+
| Line total        |
| calculated        |
+--------+----------+
         |
         v
+-------------------+
| Order total       |
| recalculated      |
+-------------------+
```

---

## Step-by-Step: Add Line with Pricing

### Step 1: Select Product

1. On the SO line form, select a product from the dropdown
2. The unit price auto-populates from `products.std_price`
3. If the product has no standard price, unit price defaults to $0.00 and a warning appears

**What to do if no price:**
- Enter the price manually
- Or update the product's standard price in Technical > Products

### Step 2: Enter Quantity

1. Enter the quantity ordered
2. The line total calculates automatically: `quantity * unit_price`
3. Validation requires quantity > 0

### Step 3: Adjust Price (Optional)

1. The unit price field is editable while the order is in draft status
2. Change the price as needed for special pricing
3. Line total updates immediately

**Note:** Price changes only affect this line - product master data is not modified.

### Step 4: Apply Discount (Optional)

1. Click the discount toggle or button
2. Select discount type:
   - **Percentage** - Reduces line total by a percentage (0-100%)
   - **Fixed** - Subtracts a fixed amount from line total
3. Enter the discount value
4. Line total recalculates with discount applied

### Step 5: Review Line Total

1. Verify the line total is correct
2. The order total at the bottom updates automatically
3. Save the line when satisfied

---

## Discount Types Explained

### Percentage Discount

Reduces the line total by a specified percentage.

**Example:**
| Field | Value |
|-------|-------|
| Quantity | 100 |
| Unit Price | $10.00 |
| Discount Type | Percentage |
| Discount Value | 10% |

**Calculation:**
```
Subtotal = 100 * $10.00 = $1,000.00
Discount = $1,000.00 * 10% = $100.00
Line Total = $1,000.00 - $100.00 = $900.00
```

**Use cases:**
- Customer discount agreements (e.g., 10% off all orders)
- Volume discounts (e.g., 15% off for 500+ units)
- Promotional pricing (e.g., 20% summer sale)

### Fixed Discount

Subtracts a fixed dollar amount from the line total.

**Example:**
| Field | Value |
|-------|-------|
| Quantity | 50 |
| Unit Price | $25.00 |
| Discount Type | Fixed |
| Discount Value | $100.00 |

**Calculation:**
```
Subtotal = 50 * $25.00 = $1,250.00
Discount = $100.00
Line Total = $1,250.00 - $100.00 = $1,150.00
```

**Use cases:**
- Flat rebates (e.g., $50 off order)
- Promotional coupons (e.g., $25 off)
- Price adjustments (e.g., $10 credit for damaged goods)

### Edge Case: Discount Exceeds Subtotal

When a fixed discount exceeds the line subtotal, the line total becomes $0.00 (never negative).

**Example:**
| Field | Value |
|-------|-------|
| Quantity | 2 |
| Unit Price | $15.00 |
| Discount Type | Fixed |
| Discount Value | $50.00 |

**Calculation:**
```
Subtotal = 2 * $15.00 = $30.00
Discount = $50.00
Line Total = max(0, $30.00 - $50.00) = $0.00
```

---

## Validation Rules

### Unit Price

| Rule | Error Message |
|------|---------------|
| Must be positive (> 0) | "Unit price must be greater than zero" |
| Must be a number | "Unit price must be a number" |

**Note:** $0.00 is not allowed for unit price. For free items, use a fixed discount equal to the line subtotal.

### Discount

| Rule | Error Message |
|------|---------------|
| Value must be >= 0 | "Discount cannot be negative" |
| Percentage max 100% | "Percentage discount cannot exceed 100%" |
| Type required | "Discount type is required" |

### Quantity

| Rule | Error Message |
|------|---------------|
| Must be positive (> 0) | "Quantity must be greater than zero" |
| Must be a number | "Quantity must be a number" |

---

## Component Architecture

```
SOLineForm
  |
  +-- ProductSelect
  |     +-- auto-populate unit_price on selection
  |
  +-- QuantityInput
  |     +-- numeric input with validation
  |
  +-- PriceInput
  |     +-- editable unit_price field
  |     +-- warning if no std_price
  |
  +-- DiscountInput
  |     +-- DiscountTypeSelect (percent/fixed)
  |     +-- DiscountValueInput
  |     +-- validation feedback
  |
  +-- LineTotalDisplay
        +-- calculated line_total (read-only)
        +-- updates in real-time

SOLinesTable
  |
  +-- LineRow
  |     +-- product name
  |     +-- quantity
  |     +-- unit_price
  |     +-- discount badge
  |     +-- line_total
  |     +-- actions (edit/delete)
  |
  +-- TableFooter
        +-- Order Total (sum of all line_totals)
```

---

## Using the Pricing Service

### Calculate Line Total

```typescript
import { calculateLineTotal } from '@/lib/services/so-pricing-service'

// Basic calculation (no discount)
const basic = calculateLineTotal(100, 10.50, null)
// Result: 1050.00

// With percentage discount
const withPercent = calculateLineTotal(
  100,
  10.50,
  { type: 'percent', value: 10 }
)
// Result: 945.00

// With fixed discount
const withFixed = calculateLineTotal(
  100,
  10.50,
  { type: 'fixed', value: 50 }
)
// Result: 1000.00
```

### Calculate Order Total

```typescript
import { calculateOrderTotal } from '@/lib/services/so-pricing-service'

const lines = [
  { line_total: 1050.00 },
  { line_total: 945.00 },
  { line_total: 500.00 },
]

const orderTotal = calculateOrderTotal(lines)
// Result: 2495.00
```

### Validate Pricing Inputs

```typescript
import {
  validateUnitPrice,
  validateDiscount,
} from '@/lib/services/so-pricing-service'

// Validate unit price
const priceOk = validateUnitPrice(10.50)
// Result: { valid: true }

const priceBad = validateUnitPrice(-5)
// Result: { valid: false, error: "Unit price must be greater than zero" }

// Validate discount
const discountOk = validateDiscount({ type: 'percent', value: 10 })
// Result: { valid: true }

const discountBad = validateDiscount({ type: 'percent', value: 150 })
// Result: { valid: false, error: "Percentage discount cannot exceed 100%" }
```

---

## Real-Time Total Updates

### Line Form State

```typescript
function SOLineForm({ onTotalChange }) {
  const [quantity, setQuantity] = useState(1)
  const [unitPrice, setUnitPrice] = useState(0)
  const [discount, setDiscount] = useState(null)
  const [lineTotal, setLineTotal] = useState(0)

  // Recalculate on any input change
  useEffect(() => {
    const total = calculateLineTotal(quantity, unitPrice, discount)
    setLineTotal(total)
    onTotalChange(total)
  }, [quantity, unitPrice, discount])

  return (
    <form>
      <input
        type="number"
        value={quantity}
        onChange={(e) => setQuantity(Number(e.target.value))}
      />
      <input
        type="number"
        value={unitPrice}
        onChange={(e) => setUnitPrice(Number(e.target.value))}
      />
      <DiscountInput
        value={discount}
        onChange={setDiscount}
      />
      <div>Line Total: ${lineTotal.toFixed(2)}</div>
    </form>
  )
}
```

### Order Total State

```typescript
function SOForm() {
  const [lines, setLines] = useState([])
  const orderTotal = useMemo(() => {
    return calculateOrderTotal(lines)
  }, [lines])

  function handleLineChange(lineId, newLineTotal) {
    setLines(prev =>
      prev.map(line =>
        line.id === lineId
          ? { ...line, line_total: newLineTotal }
          : line
      )
    )
  }

  return (
    <div>
      <SOLinesTable lines={lines} onLineChange={handleLineChange} />
      <div className="text-xl font-bold">
        Order Total: ${orderTotal.toFixed(2)}
      </div>
    </div>
  )
}
```

---

## API Integration

### Add Line with Pricing

```typescript
async function addLine(orderId: string, productId: string, quantity: number) {
  const response = await fetch(`/api/shipping/sales-orders/${orderId}/lines`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      product_id: productId,
      quantity_ordered: quantity,
      // unit_price auto-populates from product.std_price
    }),
  })

  const data = await response.json()
  return {
    line: data.line,
    orderTotal: data.so_total,
  }
}
```

### Update Line Pricing

```typescript
async function updatePricing(
  orderId: string,
  lineId: string,
  unitPrice: number,
  discount?: { type: 'percent' | 'fixed'; value: number }
) {
  const response = await fetch(
    `/api/shipping/sales-orders/${orderId}/lines/${lineId}/pricing`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        unit_price: unitPrice,
        discount: discount || null,
      }),
    }
  )

  const data = await response.json()
  return {
    line: data.line,
    orderTotal: data.so_total,
  }
}
```

---

## Troubleshooting

### Price Shows $0.00

**Symptom:** Unit price is $0.00 when product selected

**Causes:**
1. Product has no `std_price` in master data
2. Product not found

**Solutions:**
1. Enter price manually
2. Update product in Technical > Products to add standard price

### Cannot Edit Price

**Symptom:** Unit price field is disabled or read-only

**Causes:**
1. Order is not in draft status
2. User lacks required role

**Solutions:**
1. Only draft orders allow price edits
2. Ensure you have sales, manager, admin, or owner role

### Discount Not Applying

**Symptom:** Line total doesn't change after adding discount

**Causes:**
1. Discount value is 0
2. Validation error preventing save

**Solutions:**
1. Enter a non-zero discount value
2. Check for validation errors (negative value, >100%)

### Order Total Wrong

**Symptom:** Order total doesn't match sum of line totals

**Causes:**
1. Frontend state out of sync
2. API call failed silently

**Solutions:**
1. Refresh the page to get fresh data
2. Check browser console for errors
3. Try saving the order again

### "Unit price must be greater than zero"

**Symptom:** Validation error when saving line

**Causes:**
1. Unit price is 0 or negative
2. Product has no standard price and no manual price entered

**Solutions:**
1. Enter a positive unit price
2. For free items, use a 100% discount instead of $0 price

---

## Best Practices

### For Sales Clerks

1. **Verify auto-populated prices** - Always confirm the price is current
2. **Document price overrides** - Add notes explaining why price differs
3. **Check discount limits** - Verify you're authorized for the discount level
4. **Review order total** - Confirm total before confirming order
5. **Save frequently** - Don't lose work on complex orders

### For Developers

1. **Debounce calculations** - Avoid recalculating on every keystroke
2. **Show loading states** - Indicate when prices are being fetched
3. **Handle null prices** - Display warning when product lacks std_price
4. **Validate client-side** - Prevent invalid submissions
5. **Test edge cases** - Zero quantities, large numbers, max discounts

### For QA Engineers

1. **Test precision** - Verify 2-decimal rounding is consistent
2. **Test boundaries** - 0%, 100%, and 101% discounts
3. **Test large orders** - Many lines, high quantities
4. **Test concurrency** - Multiple users editing same order
5. **Test calculations** - Verify math matches specification

---

## Calculation Examples

### Example 1: Simple Order

| Line | Product | Qty | Price | Discount | Line Total |
|------|---------|-----|-------|----------|------------|
| 1 | Flour 25kg | 100 | $10.00 | - | $1,000.00 |
| 2 | Sugar 10kg | 50 | $5.00 | - | $250.00 |
| 3 | Salt 1kg | 200 | $1.50 | - | $300.00 |

**Order Total:** $1,550.00

### Example 2: With Discounts

| Line | Product | Qty | Price | Discount | Line Total |
|------|---------|-----|-------|----------|------------|
| 1 | Flour 25kg | 100 | $10.00 | 10% | $900.00 |
| 2 | Sugar 10kg | 50 | $5.00 | $25 fixed | $225.00 |
| 3 | Salt 1kg | 200 | $1.50 | - | $300.00 |

**Order Total:** $1,425.00

### Example 3: Mixed Scenario

| Line | Product | Qty | Price | Discount | Calculation | Line Total |
|------|---------|-----|-------|----------|-------------|------------|
| 1 | Premium Mix | 25 | $45.00 | 15% | 25 * 45 * 0.85 | $956.25 |
| 2 | Standard Mix | 100 | $22.50 | $100 fixed | (100 * 22.50) - 100 | $2,150.00 |
| 3 | Economy Mix | 500 | $12.00 | 5% | 500 * 12 * 0.95 | $5,700.00 |

**Order Total:** $8,806.25

---

## Permissions Reference

| Action | Roles |
|--------|-------|
| View prices | Any authenticated |
| Set unit price | sales, manager, admin, owner |
| Apply discount | sales, manager, admin, owner |
| Override auto-price | sales, manager, admin, owner |

---

## API Quick Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/shipping/sales-orders/:id/lines` | POST | Add line with pricing |
| `/api/shipping/sales-orders/:id/lines/:lineId` | PUT | Update line |
| `/api/shipping/sales-orders/:id/lines/:lineId/pricing` | PATCH | Update pricing only |
| `/api/shipping/sales-orders/:id/lines/:lineId` | DELETE | Delete line |

---

## Related Documentation

- [SO Line Pricing API Reference](../../api/shipping/so-line-pricing.md)
- [Sales Orders API Reference](../../api/shipping/sales-orders.md)
- [Sales Order Workflow Guide](./sales-order-workflow.md)
- [SO Status Transitions Guide](./so-status-transitions.md)

---

## Support

**Story:** 07.4
**Last Updated:** 2026-01-22
