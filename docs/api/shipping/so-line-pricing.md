# SO Line Pricing API Reference

**Story:** 07.4 - SO Line Pricing
**Version:** 1.0
**Last Updated:** 2026-01-22

## Overview

The SO Line Pricing API provides endpoints for managing pricing on sales order lines, including auto-population from product master data, discounts (percentage or fixed), and automatic total calculations at both line and order levels.

## Base URL

All endpoints are relative to your app base URL:

```
https://your-domain.com/api
```

## Authentication

All endpoints require authentication. Include your session token in the request headers (automatically handled by Supabase client).

**Required Roles:**

| Operation | Roles |
|-----------|-------|
| View pricing | Any authenticated user |
| Update pricing | `sales`, `manager`, `admin`, `owner` |

---

## Pricing Calculation Rules

### Line Total Formula

```
line_total = quantity_ordered * unit_price - discount

If discount.type = 'percent':
  line_total = quantity * price * (1 - discount.value / 100)

If discount.type = 'fixed':
  line_total = max(0, quantity * price - discount.value)
```

### Order Total Formula

```
total_amount = SUM(all line_totals)
```

### Precision

| Field | Precision | Description |
|-------|-----------|-------------|
| `quantity_ordered` | DECIMAL(15,4) | Up to 4 decimal places |
| `unit_price` | DECIMAL(15,4) | Up to 4 decimal places |
| `line_total` | DECIMAL(15,2) | Rounded to 2 decimal places |
| `total_amount` | DECIMAL(15,2) | Rounded to 2 decimal places |

---

## Endpoints

### POST /api/shipping/sales-orders/:id/lines

Add a new line with automatic pricing.

**Features:**
- Auto-populates `unit_price` from `products.std_price` if not provided
- Calculates `line_total` automatically
- Updates `total_amount` on the parent sales order

#### Request

```bash
curl -X POST https://your-domain.com/api/shipping/sales-orders/550e8400-e29b-41d4-a716-446655440000/lines \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "prod-001",
    "quantity_ordered": 100
  }'
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `product_id` | UUID | Yes | Product ID |
| `quantity_ordered` | decimal | Yes | Quantity (> 0) |
| `unit_price` | decimal | No | Unit price (auto from `product.std_price` if omitted) |
| `discount` | object | No | Discount `{type: 'percent' or 'fixed', value: number}` |
| `requested_lot` | string | No | Requested lot number (max 100 chars) |
| `notes` | string | No | Line notes (max 2000 chars) |

#### Response (201 Created)

```json
{
  "success": true,
  "line": {
    "id": "line-001",
    "sales_order_id": "550e8400-e29b-41d4-a716-446655440000",
    "org_id": "org-001",
    "line_number": 1,
    "product_id": "prod-001",
    "quantity_ordered": 100,
    "quantity_allocated": 0,
    "quantity_picked": 0,
    "quantity_packed": 0,
    "quantity_shipped": 0,
    "unit_price": 10.50,
    "line_total": 1050.00,
    "discount": null,
    "requested_lot": null,
    "notes": null,
    "created_at": "2026-01-22T10:30:00Z"
  },
  "so_total": 1050.00
}
```

#### Example: Line with Percentage Discount

```bash
curl -X POST https://your-domain.com/api/shipping/sales-orders/so-001/lines \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "prod-001",
    "quantity_ordered": 100,
    "unit_price": 20.00,
    "discount": { "type": "percent", "value": 10 }
  }'
```

**Calculation:** 100 * $20.00 * (1 - 0.10) = $1,800.00

#### Example: Line with Fixed Discount

```bash
curl -X POST https://your-domain.com/api/shipping/sales-orders/so-001/lines \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "prod-002",
    "quantity_ordered": 50,
    "unit_price": 25.00,
    "discount": { "type": "fixed", "value": 100 }
  }'
```

**Calculation:** (50 * $25.00) - $100.00 = $1,150.00

---

### PATCH /api/shipping/sales-orders/:id/lines/:lineId/pricing

Update only pricing fields (unit_price and/or discount) without affecting other line data.

**Use Case:** Quick price adjustments without full line update.

#### Request

```bash
curl -X PATCH https://your-domain.com/api/shipping/sales-orders/so-001/lines/line-001/pricing \
  -H "Content-Type: application/json" \
  -d '{
    "unit_price": 12.00,
    "discount": { "type": "percent", "value": 5 }
  }'
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `unit_price` | decimal | No | New unit price (> 0) |
| `discount` | object or null | No | New discount or null to remove |

#### Response (200 OK)

```json
{
  "success": true,
  "line": {
    "id": "line-001",
    "line_number": 1,
    "product_id": "prod-001",
    "quantity_ordered": 100,
    "unit_price": 12.00,
    "discount": { "type": "percent", "value": 5 },
    "line_total": 1140.00
  },
  "so_total": 2290.00
}
```

#### Error Responses

**Status: 403 Forbidden - Non-Draft Order**

```json
{
  "error": "Cannot modify non-draft sales order",
  "code": "FORBIDDEN"
}
```

**Status: 400 Bad Request - Validation Error**

```json
{
  "error": "Validation failed",
  "details": [
    { "path": ["unit_price"], "message": "Unit price must be greater than zero" }
  ]
}
```

---

### PUT /api/shipping/sales-orders/:id/lines/:lineId

Full line update including pricing fields.

#### Request

```bash
curl -X PUT https://your-domain.com/api/shipping/sales-orders/so-001/lines/line-001 \
  -H "Content-Type: application/json" \
  -d '{
    "quantity_ordered": 150,
    "unit_price": 10.00,
    "discount": { "type": "fixed", "value": 75 },
    "notes": "Updated quantity"
  }'
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `quantity_ordered` | decimal | No | New quantity (> 0) |
| `unit_price` | decimal | No | New unit price (> 0) |
| `discount` | object or null | No | New discount |
| `requested_lot` | string | No | Requested lot |
| `notes` | string | No | Line notes |

#### Response (200 OK)

```json
{
  "success": true,
  "line": {
    "id": "line-001",
    "line_number": 1,
    "quantity_ordered": 150,
    "unit_price": 10.00,
    "discount": { "type": "fixed", "value": 75 },
    "line_total": 1425.00,
    "notes": "Updated quantity"
  },
  "so_total": 2575.00
}
```

---

### DELETE /api/shipping/sales-orders/:id/lines/:lineId

Delete a line and recalculate order total.

#### Request

```bash
curl -X DELETE https://your-domain.com/api/shipping/sales-orders/so-001/lines/line-002
```

#### Response (200 OK)

```json
{
  "success": true,
  "so_total": 1425.00
}
```

---

## Validation Rules

### Unit Price Validation

| Rule | Message |
|------|---------|
| Required if product has no `std_price` | "Product not found or has no standard price" |
| Must be positive | "Unit price must be greater than zero" |

### Discount Validation

| Rule | Message |
|------|---------|
| Value must be non-negative | "Discount cannot be negative" |
| Percentage max 100 | "Percentage discount cannot exceed 100%" |
| Type must be 'percent' or 'fixed' | "Invalid discount type" |

### Quantity Validation

| Rule | Message |
|------|---------|
| Must be positive | "Quantity must be greater than zero" |

---

## Service Methods

### SOPricingService

```typescript
import {
  calculateLineTotal,
  calculateOrderTotal,
  getProductPrice,
  validateUnitPrice,
  validateDiscount,
  updateOrderTotal,
} from '@/lib/services/so-pricing-service'

// Calculate line total with discount
const lineTotal = calculateLineTotal(
  100,              // quantity
  10.50,            // unit price
  { type: 'percent', value: 10 }  // discount (optional)
)
// Result: 945.00

// Calculate order total from lines
const orderTotal = calculateOrderTotal([
  { line_total: 945.00 },
  { line_total: 500.00 },
])
// Result: 1445.00

// Get product's standard price
const price = await getProductPrice('prod-001')
// Result: 10.50 (or null if not found)

// Validate unit price
const priceResult = validateUnitPrice(10.50)
// Result: { valid: true }

// Validate discount
const discountResult = validateDiscount({ type: 'percent', value: 10 })
// Result: { valid: true }

// Update order total in database
const newTotal = await updateOrderTotal('so-001', 'org-001')
// Result: 1445.00
```

---

## Zod Validation Schemas

### Discount Schema

```typescript
import { discountSchema } from '@/lib/validation/pricing-schemas'

// Valid examples
discountSchema.parse({ type: 'percent', value: 10 })  // OK
discountSchema.parse({ type: 'fixed', value: 50 })    // OK
discountSchema.parse(null)                             // OK (no discount)

// Invalid examples
discountSchema.parse({ type: 'percent', value: 150 }) // Error: > 100%
discountSchema.parse({ type: 'fixed', value: -10 })   // Error: negative
```

### Create Line Schema

```typescript
import { createSOLineSchema } from '@/lib/validation/pricing-schemas'

const lineInput = createSOLineSchema.parse({
  product_id: '550e8400-e29b-41d4-a716-446655440000',
  quantity_ordered: 100,
  unit_price: 10.50,  // optional
  discount: { type: 'percent', value: 5 },  // optional
  notes: 'Rush order',  // optional
})
```

### Update Pricing Schema

```typescript
import { updateLinePricingSchema } from '@/lib/validation/pricing-schemas'

const pricingUpdate = updateLinePricingSchema.parse({
  unit_price: 12.00,  // optional
  discount: { type: 'fixed', value: 25 },  // optional
})
```

---

## Error Codes Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Cannot modify non-draft order |
| `NOT_FOUND` | 404 | Order or line not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `PRODUCT_NOT_FOUND` | 400 | Product not found or no std_price |

---

## Code Examples

### TypeScript: Add Line with Auto-Price

```typescript
async function addLineWithAutoPrice(
  orderId: string,
  productId: string,
  quantity: number
) {
  const response = await fetch(`/api/shipping/sales-orders/${orderId}/lines`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      product_id: productId,
      quantity_ordered: quantity,
      // unit_price omitted - will auto-populate from product.std_price
    }),
  })

  const data = await response.json()
  if (!data.success) {
    throw new Error(data.error || 'Failed to add line')
  }

  return {
    line: data.line,
    orderTotal: data.so_total,
  }
}
```

### TypeScript: Update Pricing Only

```typescript
async function updateLinePricing(
  orderId: string,
  lineId: string,
  pricing: {
    unit_price?: number
    discount?: { type: 'percent' | 'fixed'; value: number } | null
  }
) {
  const response = await fetch(
    `/api/shipping/sales-orders/${orderId}/lines/${lineId}/pricing`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pricing),
    }
  )

  const data = await response.json()
  if (!data.success) {
    throw new Error(data.error || 'Failed to update pricing')
  }

  return {
    line: data.line,
    orderTotal: data.so_total,
  }
}

// Usage: Apply 15% discount
await updateLinePricing('so-001', 'line-001', {
  discount: { type: 'percent', value: 15 },
})
```

### TypeScript: Calculate Totals Client-Side

```typescript
import {
  calculateLineTotal,
  calculateOrderTotal,
} from '@/lib/services/so-pricing-service'

// Real-time line total preview
function previewLineTotal(
  quantity: number,
  unitPrice: number,
  discountType?: 'percent' | 'fixed',
  discountValue?: number
) {
  const discount = discountType && discountValue !== undefined
    ? { type: discountType, value: discountValue }
    : null

  return calculateLineTotal(quantity, unitPrice, discount)
}

// Real-time order total preview
function previewOrderTotal(lines: Array<{ line_total: number | null }>) {
  return calculateOrderTotal(lines)
}
```

---

## Calculation Examples

### Example 1: Basic Line (No Discount)

| Input | Value |
|-------|-------|
| Quantity | 100 |
| Unit Price | $10.50 |
| Discount | None |

**Calculation:** 100 * $10.50 = **$1,050.00**

### Example 2: Percentage Discount

| Input | Value |
|-------|-------|
| Quantity | 50 |
| Unit Price | $20.00 |
| Discount Type | percent |
| Discount Value | 10% |

**Calculation:** 50 * $20.00 * (1 - 0.10) = 50 * $20.00 * 0.90 = **$900.00**

### Example 3: Fixed Discount

| Input | Value |
|-------|-------|
| Quantity | 25 |
| Unit Price | $40.00 |
| Discount Type | fixed |
| Discount Value | $50.00 |

**Calculation:** (25 * $40.00) - $50.00 = $1,000.00 - $50.00 = **$950.00**

### Example 4: Order Total

| Line | Line Total |
|------|------------|
| 1 | $1,050.00 |
| 2 | $900.00 |
| 3 | $950.00 |

**Order Total:** $1,050.00 + $900.00 + $950.00 = **$2,900.00**

### Example 5: Fixed Discount Exceeds Subtotal

| Input | Value |
|-------|-------|
| Quantity | 2 |
| Unit Price | $10.00 |
| Discount Type | fixed |
| Discount Value | $50.00 |

**Calculation:** max(0, (2 * $10.00) - $50.00) = max(0, -$30.00) = **$0.00**

---

## Related Documentation

- [Sales Orders API Reference](./sales-orders.md)
- [SO Status Workflow API](./so-status-workflow.md)
- [Pricing and Discounts Guide](../../guides/shipping/pricing-discounts.md)
- [Sales Order Workflow Guide](../../guides/shipping/sales-order-workflow.md)

---

## Support

**Story:** 07.4
**Last Updated:** 2026-01-22
