# Sales Order Status Transitions Guide

**Module:** Shipping
**Story:** 07.3 - SO Status Workflow
**Audience:** Warehouse Managers, Sales Managers, Administrators

## Overview

This guide explains how to manage sales order status transitions in MonoPilot, including placing orders on hold, cancelling orders, and confirming orders. The system enforces strict business rules to ensure data integrity and proper workflow management.

## Status Types

MonoPilot supports 9 sales order statuses organized into logical groups:

### Pre-Fulfillment Statuses

| Status | Color | Description |
|--------|-------|-------------|
| Draft | Gray | Order created, awaiting confirmation |
| Confirmed | Blue | Order confirmed, ready for allocation |
| On Hold | Yellow | Order paused pending review |

### Fulfillment Statuses

| Status | Color | Description |
|--------|-------|-------------|
| Allocated | Purple | Inventory allocated to order |
| Picking | Purple | Items being picked from warehouse |
| Packing | Purple | Items being packed for shipment |

### Completed Statuses

| Status | Color | Description |
|--------|-------|-------------|
| Shipped | Green | Order dispatched to carrier |
| Delivered | Green | Order received by customer |

### Terminal Status

| Status | Color | Description |
|--------|-------|-------------|
| Cancelled | Red | Order cancelled (permanent) |

---

## Placing an Order on Hold

Use the hold action to temporarily pause order processing. Common reasons include customer requests, credit issues, or inventory verification.

### Who Can Hold Orders

- Sales Representatives
- Sales Managers
- Warehouse Managers
- Administrators

### When You Can Hold

Orders can only be placed on hold when in these statuses:

- **Draft** - Order not yet confirmed
- **Confirmed** - Order confirmed but not yet allocated

### How to Hold an Order

1. Navigate to the Sales Order detail page
2. Click the **Actions** dropdown in the header
3. Select **Hold Order**
4. (Optional) Enter a reason for the hold
5. Click **Hold Order** to confirm

### What Happens

- Status changes to "On Hold" (yellow badge)
- Order is excluded from automatic allocation
- Reason is recorded in the notes field with timestamp
- Toast notification confirms the action

### Example Hold Note

```
[HOLD - 2026-01-22T10:30:00.000Z] Customer requested delay pending budget approval
```

### Restrictions

You cannot hold orders that are:
- Already on hold
- Already cancelled
- In picking or later stages (allocated, picking, packing, shipped, delivered)

If you try to hold an ineligible order, you will see an error message explaining why.

---

## Releasing an Order from Hold

To resume processing a held order, use the confirm action.

### How to Release from Hold

1. Navigate to the held order's detail page
2. Click the **Actions** dropdown
3. Select **Confirm Order** or **Release Hold**
4. The order returns to "Confirmed" status

### What Happens

- Status changes from "On Hold" to "Confirmed"
- Order becomes eligible for allocation again
- `updated_at` timestamp is updated
- Original `confirmed_at` timestamp is preserved

---

## Cancelling an Order

Cancel orders that will not be fulfilled. This action is permanent and cannot be undone.

### Who Can Cancel Orders

Only users with elevated permissions can cancel orders:

- Sales Managers
- Warehouse Managers
- Administrators

Regular sales representatives cannot cancel orders.

### When You Can Cancel

Orders can be cancelled from these statuses:

- **Draft** - Order not yet confirmed
- **Confirmed** - Order confirmed but not in process
- **On Hold** - Order currently paused
- **Allocated** - Inventory allocated but picking not started

### When You Cannot Cancel

Once an order enters the picking phase or beyond, it cannot be cancelled through the system:

- **Picking** - Items being collected
- **Packing** - Items being packaged
- **Shipped** - Order dispatched
- **Delivered** - Order completed

For orders in these stages, contact your warehouse manager for manual intervention.

### How to Cancel an Order

1. Navigate to the Sales Order detail page
2. Click the **Actions** dropdown
3. Select **Cancel Order**
4. Enter a cancellation reason (minimum 10 characters)
5. Review the warning message
6. Click **Cancel Order** in the dialog
7. Confirm in the final confirmation dialog

### Reason Requirements

- **Required** - You must provide a reason
- **Minimum 10 characters** - Brief reasons are rejected
- **Maximum 500 characters** - Keep reasons concise
- Whitespace-only reasons are rejected

### Example Valid Reasons

- "Customer cancelled due to budget constraints"
- "Duplicate order - customer already placed SO-2026-00042"
- "Product discontinued - cannot fulfill this order"

### Example Invalid Reasons

- "" (empty)
- "mistake" (too short)
- "   " (whitespace only)

### What Happens

- Status changes to "Cancelled" (red badge)
- Order is locked from further changes
- Reason is recorded with timestamp in notes
- If allocated, allocations are released (Story 07.7)
- Toast notification confirms the action

### Example Cancel Note

```
[CANCELLED - 2026-01-22T10:30:00.000Z] Customer cancelled due to budget constraints
```

---

## Confirming an Order

Move a draft order to confirmed status to make it eligible for inventory allocation.

### Who Can Confirm Orders

- Sales Representatives
- Sales Managers
- Warehouse Managers
- Administrators

### When You Can Confirm

- **Draft** - Initial order creation
- **On Hold** - Releasing a held order

### How to Confirm an Order

1. Navigate to the Draft order detail page
2. Click the **Actions** dropdown or header button
3. Select **Confirm Order**
4. The order status changes to "Confirmed"

### What Happens

- Status changes to "Confirmed" (blue badge)
- `confirmed_at` timestamp is set (if first confirmation)
- Order becomes eligible for inventory allocation
- Toast notification confirms the action

---

## Status Flow Diagram

```
                              +-----------+
                              |   DRAFT   |
                              +-----+-----+
                                    |
                  +-----------------+----------------+
                  |                 |                |
                  v                 v                v
            +-----------+    +-----------+    +-----------+
            | ON_HOLD   |<-->| CONFIRMED |    | CANCELLED |
            +-----------+    +-----+-----+    +-----------+
                  |                |
                  |                v
                  |          +-----------+
                  +--------->| CANCELLED |
                             +-----------+

CONFIRMED --> ALLOCATED --> PICKING --> PACKING --> SHIPPED --> DELIVERED
                  |
                  v
            +-----------+
            | CANCELLED |
            +-----------+
```

---

## UI Components

### Status Badge

The `SOStatusBadge` component displays the current status with:
- Color-coded background matching the status
- Icon indicating the status type
- Accessible labels for screen readers

| Status | Icon | Color |
|--------|------|-------|
| Draft | FileEdit | Gray |
| Confirmed | CheckCircle | Blue |
| On Hold | PauseCircle | Yellow |
| Cancelled | XCircle | Red |
| Allocated | Package | Purple |
| Picking | Truck | Purple |
| Packing | Box | Purple |
| Shipped | Truck | Green |
| Delivered | PackageCheck | Green |

### Hold Order Dialog

Modal dialog with:
- Optional reason textarea (max 500 characters)
- Character counter
- Cancel and Hold buttons
- Loading state during submission

### Cancel Order Dialog

Modal dialog with:
- Required reason textarea (min 10, max 500 characters)
- Real-time validation feedback
- Warning message about irreversibility
- Cancel and Cancel Order buttons
- Secondary confirmation dialog

---

## Best Practices

### When to Hold vs Cancel

| Situation | Action |
|-----------|--------|
| Customer requests delay | Hold |
| Credit check pending | Hold |
| Inventory verification needed | Hold |
| Customer cancels order | Cancel |
| Duplicate order found | Cancel |
| Product discontinued | Cancel |

### Reason Documentation

Write clear, specific reasons that will be useful for:
- Audit trail review
- Customer service inquiries
- Process improvement analysis

Good reasons include:
- Who requested the action
- Why the action was needed
- Any reference numbers (PO, ticket, etc.)

### Permission Management

Restrict cancel permissions to managers to prevent accidental cancellations. Sales representatives can hold orders but should escalate cancellation requests.

---

## Troubleshooting

### "Cannot hold order after allocation has started"

The order has already been allocated or is in a later stage. Contact your warehouse manager to manually release allocations before holding.

### "Cannot cancel order after picking has started"

The order has progressed too far in the fulfillment process. Contact your warehouse manager for manual intervention.

### "Insufficient permissions to cancel orders"

Your role does not have cancel permissions. Ask a manager or administrator to cancel the order.

### "Cancel reason is required"

You must provide a reason for cancellation. Enter at least 10 characters explaining why the order is being cancelled.

### "Sales order not found"

The order does not exist or belongs to a different organization. Verify the order ID is correct.

---

## Related Documentation

- [SO Status Workflow API Reference](/docs/api/shipping/so-status-workflow.md)
- [Sales Orders CRUD (Story 07.2)](/docs/guides/shipping/sales-orders-crud.md)
- [Inventory Allocation (Story 07.7)](/docs/guides/shipping/inventory-allocation.md)
