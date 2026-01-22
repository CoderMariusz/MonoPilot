# Sales Order Workflow Guide

**Story:** 07.2 - Sales Orders Core
**Version:** 1.0
**Last Updated:** 2026-01-22

## Overview

This guide explains how to create and manage sales orders in MonoPilot. Sales orders track customer orders from creation through fulfillment, with support for line-level pricing, discounts, and automatic total calculations.

**Who is this for:**
- Shipping clerks creating and managing orders
- Sales managers reviewing order status
- Frontend developers integrating the SO workflow
- QA engineers testing order functionality

---

## What You Can Do

The Sales Orders module allows you to:

1. **Create sales orders** - Capture customer orders with multiple product lines
2. **Manage order lines** - Add, edit, delete lines with automatic pricing
3. **Apply discounts** - Percentage or fixed discounts per line
4. **Track order status** - Monitor orders through the fulfillment lifecycle
5. **Search and filter** - Find orders by status, customer, date range

---

## Prerequisites

Before creating a sales order:

1. **Customer must exist** - Create customers in Shipping > Customers first
2. **Customer address required** - Customer must have at least one shipping address
3. **Products available** - Products must be set up in Technical > Products
4. **Proper permissions** - You need `sales`, `manager`, or `admin` role

---

## Order Status Lifecycle

```
                  +----------+
                  |  DRAFT   |
                  +----+-----+
                       |
           confirm     |     hold
                       v
                  +-----------+
      +---------->| CONFIRMED |<----------+
      |           +-----+-----+           |
      |                 |                 |
  release               | allocate        | hold
      |                 v                 |
      |           +-----------+           |
      +-----------|  ON_HOLD  |-----------+
                  +-----------+
                       |
                       | cancel
                       v
                  +-----------+
                  | CANCELLED |
                  +-----------+
```

**Status Descriptions:**

| Status | Description | Editable? |
|--------|-------------|-----------|
| `draft` | Order created, not yet submitted | Yes |
| `confirmed` | Order confirmed, ready for allocation | No |
| `on_hold` | Order temporarily paused | No |
| `cancelled` | Order cancelled | No |
| `allocated` | Inventory allocated (Story 07.7) | No |
| `picking` | Being picked in warehouse (Story 07.8) | No |
| `packing` | Being packed (Story 07.11) | No |
| `shipped` | Shipped to customer (Story 07.14) | No |
| `delivered` | Delivered (future) | No |

---

## Step-by-Step: Create a Sales Order

### Step 1: Navigate to Sales Orders

1. Go to **Shipping > Sales Orders**
2. Click the **Create Sales Order** button
3. The creation wizard opens

### Step 2: Select Customer

1. Search or select a customer from the dropdown
2. Customer details display (name, code, contact)
3. Click **Next** to continue

**Validation:**
- Customer selection is required
- Error shows if no customer selected

### Step 3: Select Shipping Address

1. Shipping address dropdown shows customer's addresses
2. Select the delivery destination
3. Address details display (street, city, state, zip)
4. Click **Next** to continue

**Tip:** If the customer needs a new address, add it in Customers first.

### Step 4: Add Order Lines

1. Click **Add Line** to add a product
2. For each line:
   - Select a product from the dropdown
   - Enter quantity ordered
   - Unit price auto-populates from product master
   - Optionally apply a discount
   - Add line notes if needed
3. Line total calculates automatically
4. Order total updates as you add lines

**Pricing Auto-Population:**
- Unit price defaults to the product's `std_price`
- You can override the price manually
- Discounts can be percentage (e.g., 10%) or fixed amount (e.g., $50)

**Validation:**
- Quantity must be greater than zero
- At least one line is required
- Unit price must be non-negative

### Step 5: Review and Save

1. Review all order details:
   - Customer and shipping address
   - All lines with quantities and prices
   - Order total
2. Optionally add order notes
3. Click **Save as Draft** to create the order

**Result:**
- Order is created with status `draft`
- Order number is auto-generated (SO-2026-00001)
- You're redirected to the order detail page

---

## Step-by-Step: Edit a Sales Order

**Note:** Only draft orders can be edited.

### Edit Order Header

1. Open the draft order
2. Click **Edit Order**
3. Modify fields:
   - Customer PO number
   - Required delivery date
   - Shipping address
   - Notes
4. Click **Save Changes**

### Add a Line

1. On the order detail page, click **Add Line**
2. Select product, enter quantity
3. Unit price auto-populates
4. Optionally add discount
5. Click **Add**

**Result:** Line is added, order total recalculates.

### Edit a Line

1. Click the edit icon on the line row
2. Modify quantity, price, or discount
3. Click **Save**

**Result:** Line total and order total recalculate immediately.

### Delete a Line

1. Click the delete icon on the line row
2. Confirm deletion
3. Line is removed

**Result:** Order total recalculates.

---

## Step-by-Step: Confirm a Sales Order

1. Open the draft order
2. Review all details
3. Click **Confirm Order**
4. Confirmation dialog appears: "This will lock the order. Continue?"
5. Click **Confirm**

**Result:**
- Status changes to `confirmed`
- `confirmed_at` timestamp is set
- Order can no longer be edited
- Order is ready for inventory allocation (Story 07.7)

---

## Step-by-Step: Delete a Sales Order

**Note:** Only draft orders can be deleted.

1. Open the draft order
2. Click **Delete Order**
3. Confirmation dialog appears
4. Click **Delete**

**Result:**
- Order and all lines are deleted
- Action cannot be undone

**Error:** Confirmed orders cannot be deleted. Contact an administrator if you need to cancel an order.

---

## Searching and Filtering Orders

### Quick Search

1. Use the search box at the top of the list
2. Search by:
   - Order number (e.g., "SO-2026-00")
   - Customer name (e.g., "Acme")

### Filter by Status

1. Click the **Status** filter dropdown
2. Select one or more statuses:
   - Draft
   - Confirmed
   - On Hold
   - Cancelled
3. List updates immediately

### Filter by Customer

1. Click the **Customer** filter dropdown
2. Select a customer
3. Only that customer's orders display

### Filter by Date Range

1. Click **Order Date** filter
2. Select start and end dates
3. Orders within that range display

### Sorting

- Click column headers to sort
- Default: newest orders first
- Click again to reverse sort order

---

## Order Number Format

Order numbers follow the format: `SO-YYYY-NNNNN`

- **SO** - Sales Order prefix
- **YYYY** - 4-digit year
- **NNNNN** - 5-digit sequence number

**Examples:**
- `SO-2026-00001` - First order of 2026
- `SO-2026-00123` - 123rd order of 2026

**Rules:**
- Sequence resets to 00001 each year
- Each organization has independent sequences
- Numbers are never reused or recycled

---

## Discount Types

### Percentage Discount

Reduces the line total by a percentage.

**Example:**
- Quantity: 100
- Unit Price: $10.00
- Discount: 10%
- Calculation: 100 x $10.00 x (1 - 0.10) = $900.00

### Fixed Discount

Subtracts a fixed amount from the line total.

**Example:**
- Quantity: 100
- Unit Price: $10.00
- Discount: $50.00
- Calculation: (100 x $10.00) - $50.00 = $950.00

**Validation:**
- Percentage discount cannot exceed 100%
- Fixed discount cannot make line total negative (minimum is $0)
- Discount value must be non-negative

---

## Component Architecture

```
SalesOrderListPage
  |
  +-- SOFilters
  |     +-- StatusFilter
  |     +-- CustomerFilter
  |     +-- DateRangeFilter
  |
  +-- SOTable
        +-- DataTable
        +-- SOStatusBadge
        +-- Pagination

SalesOrderDetailPage
  |
  +-- SOHeader
  |     +-- OrderNumber
  |     +-- SOStatusBadge
  |     +-- ActionButtons (Edit, Confirm, Delete)
  |
  +-- CustomerCard
  +-- ShippingAddressCard
  +-- SOLinesTable
  |     +-- LineRow
  |     +-- LineActions (Edit, Delete)
  +-- SOTotals
  +-- SOStatusTimeline

SalesOrderWizard
  |
  +-- StepIndicator
  +-- CustomerStep
  +-- AddressStep
  +-- LinesStep
  |     +-- SOLineForm
  |     +-- DiscountSelector
  +-- ReviewStep
```

---

## Using the SalesOrderService

### Calculate Line Total

```typescript
import { SalesOrderService } from '@/lib/services/sales-order-service'

// Basic calculation
const lineTotal = SalesOrderService.calculateLineTotal(100, 10.50)
// Result: 1050.00

// With percentage discount
const lineWithPercent = SalesOrderService.calculateLineTotal(
  100,
  10.50,
  { type: 'percent', value: 10 }
)
// Result: 945.00

// With fixed discount
const lineWithFixed = SalesOrderService.calculateLineTotal(
  100,
  10.50,
  { type: 'fixed', value: 50 }
)
// Result: 1000.00
```

### Calculate Order Total

```typescript
const lines = [
  { quantity_ordered: 100, unit_price: 10.00, discount_type: null, discount_value: null },
  { quantity_ordered: 50, unit_price: 5.00, discount_type: 'percent', discount_value: 10 },
]

const orderTotal = SalesOrderService.calculateOrderTotal(lines)
// Result: 1225.00 (1000.00 + 225.00)
```

### Validate Status Transitions

```typescript
// Check if transition is valid
const canConfirm = SalesOrderService.validateStatusTransition('draft', 'confirmed')
// Result: true

const canReopen = SalesOrderService.validateStatusTransition('confirmed', 'draft')
// Result: false (cannot go back to draft)
```

### Check Edit Permissions

```typescript
const canEdit = SalesOrderService.canEditOrder('draft')
// Result: true

const canEditConfirmed = SalesOrderService.canEditOrder('confirmed')
// Result: false
```

### Generate Order Number

```typescript
const orderNumber = await SalesOrderService.generateNextNumber(orgId)
// Result: "SO-2026-00001"
```

---

## Troubleshooting

### Cannot Create Order

**Symptom:** Create button is disabled or shows error

**Solutions:**
1. Ensure you have `sales`, `manager`, or `admin` role
2. Check that customers exist in the system
3. Verify products are available

### Cannot Edit Order

**Symptom:** Edit button is hidden or disabled

**Solutions:**
1. Only draft orders can be edited
2. Once confirmed, orders are locked
3. Contact administrator to cancel if needed

### Price Not Populating

**Symptom:** Unit price shows $0 or is blank

**Solutions:**
1. Check product has `std_price` set
2. Manually enter the price
3. Update product master data in Technical > Products

### Total Not Calculating

**Symptom:** Order total shows $0 or old value

**Solutions:**
1. Ensure all lines have quantity and price
2. Refresh the page
3. Check browser console for errors

### Cannot Delete Order

**Symptom:** Delete button hidden or error message

**Solutions:**
1. Only draft orders can be deleted
2. Confirmed orders must be cancelled instead
3. Contact administrator for assistance

---

## Best Practices

### For Sales Clerks

1. **Verify customer** - Double-check customer selection before adding lines
2. **Check addresses** - Ensure shipping address is correct
3. **Review before confirm** - Confirming locks the order
4. **Add notes** - Document special instructions
5. **Use customer PO** - Always enter customer's PO number for reference

### For Developers

1. **Handle errors** - Display validation errors clearly
2. **Optimistic updates** - Show line totals immediately
3. **Debounce inputs** - Avoid excessive API calls on quantity changes
4. **Cache customers** - Preload customer list for fast selection
5. **Test edge cases** - Zero quantities, large numbers, special characters

---

## Permissions Reference

| Action | Roles |
|--------|-------|
| View orders | Any authenticated |
| Create order | sales, manager, admin, owner |
| Edit order (draft) | sales, manager, admin, owner |
| Confirm order | sales, manager, admin, owner |
| Delete order (draft) | manager, admin, owner |
| Hold order | sales, manager, admin, owner |
| Cancel order | manager, admin, owner |

---

## API Quick Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/shipping/sales-orders` | GET | List orders |
| `/api/shipping/sales-orders` | POST | Create order |
| `/api/shipping/sales-orders/:id` | GET | Get order detail |
| `/api/shipping/sales-orders/:id` | PUT | Update order |
| `/api/shipping/sales-orders/:id` | DELETE | Delete order |
| `/api/shipping/sales-orders/:id/status` | PATCH | Change status |
| `/api/shipping/sales-orders/:id/lines` | GET | List lines |
| `/api/shipping/sales-orders/:id/lines` | POST | Add line |
| `/api/shipping/sales-orders/:id/lines/:lineId` | PUT | Update line |
| `/api/shipping/sales-orders/:id/lines/:lineId` | DELETE | Delete line |

---

## Related Documentation

- [Sales Orders API Reference](../../api/shipping/sales-orders.md)
- [SO Status Workflow](./so-status-workflow.md) (Story 07.3)
- [SO Line Pricing](./so-line-pricing.md) (Story 07.4)
- [Customers Guide](./customers-guide.md) (Story 07.1)

---

## Support

**Story:** 07.2
**Last Updated:** 2026-01-22
