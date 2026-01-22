# Inventory Allocation User Guide

Story: 07.7 - Inventory Allocation (FIFO/FEFO + Backorders)

## Overview

Inventory allocation reserves License Plates (LPs) for confirmed Sales Orders, ensuring the correct stock is picked and shipped. MonoPilot supports two allocation strategies:

- **FIFO (First In, First Out)**: Allocate oldest inventory first
- **FEFO (First Expiry, First Out)**: Allocate soonest-expiring inventory first

## Prerequisites

Before allocating inventory:

1. Sales Order must be in **Confirmed** status
2. License Plates must be:
   - Status: `available`
   - QA Status: `passed`
   - Not expired (expiry_date >= today)
3. User must have **Manager** or higher role

## Allocation Workflow

### Step 1: Open Allocation Modal

1. Navigate to **Shipping > Sales Orders**
2. Click on a Sales Order in **Confirmed** status
3. Click the **[Allocate]** button in the header

The allocation modal displays:
- SO header with order number and customer
- Lines table with products and quantities
- Available License Plates for each line
- Real-time allocation summary

### Step 2: Select Allocation Strategy

Choose your picking strategy:

| Strategy | Description | Best For |
|----------|-------------|----------|
| **FIFO** | Oldest received first | Non-perishable goods |
| **FEFO** | Soonest expiry first | Perishable goods |

The strategy determines LP sort order and auto-allocation suggestions.

### Step 3: Auto-Allocate or Manual Select

**Auto-Allocate:**
1. Click **[Auto-Allocate]**
2. System selects LPs based on strategy until quantity met
3. Review suggested allocations

**Manual Selection:**
1. Check/uncheck LPs to include/exclude
2. Edit quantities in the Qty field
3. Summary updates in real-time

### Step 4: Review Allocation Summary

The summary panel shows:

| Metric | Description |
|--------|-------------|
| Lines | Total / Fully Allocated / Partial / None |
| Quantity | Required / Allocated / Available |
| Coverage | Percentage of order covered |
| Shortfall | Units short (if any) |

### Step 5: Confirm Allocation

Click **[Allocate Selected]** to confirm.

**If fully allocated (>= threshold):**
- SO status changes to `Allocated`
- LPs reserved for this order
- Undo button appears (5-minute window)

**If partial allocation:**
- Choose action:
  - **Create Backorder**: Proceed with partial, create backorder for remainder
  - **Hold Order**: Set SO to `On Hold` until inventory available
- Backorder signal sent to Planning module

## Handling Shortfalls

### Scenario: Insufficient Inventory

When available inventory is less than required:

1. Auto-allocate shows partial coverage (e.g., 75%)
2. Summary highlights shortfall in units
3. Choose resolution:

| Option | Result |
|--------|--------|
| **Create Backorder** | Allocate available, flag line as backorder |
| **Hold Order** | SO status becomes `On Hold` |
| **Wait** | Close modal, replenish inventory, try again |

### Backorder Flag

Lines with shortfall get `backorder_flag = true`:
- Visible on SO detail page
- Appears in Shipping Dashboard alerts
- Planning module receives signal for PO/WO creation

## Undoing and Releasing Allocations

### 5-Minute Undo Window

Immediately after allocation:

1. **[Undo]** button appears on SO detail page
2. Click to instantly release all allocations
3. Available for 5 minutes after allocation
4. After 5 minutes, use explicit Release

### Explicit Release

After undo window expires:

1. Click **Actions** menu on SO detail page
2. Select **Release Allocation**
3. Choose reason:
   - Undo allocation
   - Manual adjustment
   - SO cancelled
   - Line deleted
   - Other
4. Confirm release

Release effects:
- All allocation records deleted
- LP status reset to `available`
- SO line `quantity_allocated` reset to 0
- SO status reset to `confirmed`

## FIFO vs FEFO Details

### FIFO Allocation

LPs sorted by receipt date (oldest first):

```
LP-001: Created 2025-01-01 (50 units) <-- Allocated first
LP-002: Created 2025-01-15 (50 units) <-- Allocated second
LP-003: Created 2025-01-20 (50 units) <-- Allocated third (if needed)
```

Use FIFO for:
- Non-perishable raw materials
- Packaging materials
- Finished goods with long shelf life

### FEFO Allocation

LPs sorted by expiry date (soonest first):

```
LP-102: Expires 2025-03-01 (50 units) <-- Allocated first
LP-103: Expires 2025-04-15 (50 units) <-- Allocated second
LP-101: Expires 2025-06-01 (50 units) <-- Allocated third (if needed)
```

Use FEFO for:
- Fresh produce
- Dairy products
- Any perishable goods

### FEFO Warning

LPs expiring within threshold (default 7 days) are highlighted:
- Yellow background in allocation table
- "Expires in X days" warning
- Still allocatable, but consider priority

Configure threshold in **Settings > Shipping > FEFO Warning Days**.

## Allocation Threshold

The allocation threshold determines when SO status changes to `Allocated`:

- Default: **80%**
- Configurable in **Settings > Shipping**

Example with 80% threshold:
- 75% allocated: Status remains `Confirmed`
- 85% allocated: Status changes to `Allocated`

## Partial Quantity Allocation

You can allocate partial quantities from an LP:

1. Click on quantity field for an LP
2. Enter desired quantity (must be <= available)
3. Remaining quantity stays available for other orders

Example:
- LP has 480 units available
- SO line needs 200 units
- Enter 200 in quantity field
- LP still has 280 units for other orders

## Concurrent Access Protection

MonoPilot prevents double-allocation:

1. If another user allocates the same LP simultaneously
2. System uses `FOR UPDATE SKIP LOCKED` to prevent conflicts
3. First transaction wins, second gets updated availability
4. Warning shown: "Some items allocated by concurrent user"

## Best Practices

### Before Allocating

1. Verify SO quantities are correct
2. Check customer allergen restrictions cleared
3. Ensure sufficient inventory in passed QA status

### During Allocation

1. Use Auto-Allocate for speed, review suggestions
2. Manual override for specific lot requirements
3. Watch for FEFO warnings on perishable items

### After Allocating

1. Review allocation summary for shortfalls
2. Address backorders promptly
3. Use undo window if mistakes discovered

## Troubleshooting

### No Available LPs

**Cause:** No LPs match criteria (product, available, passed QA, not expired)

**Resolution:**
1. Check warehouse for inventory
2. Verify QA holds released
3. Check expiry dates
4. Create GRN from pending PO

### LP Already Allocated

**Cause:** LP allocated to another SO line

**Resolution:**
1. View LP detail to see existing allocations
2. Release other allocation if appropriate
3. Select different LP

### Permission Denied

**Cause:** User lacks Manager role

**Resolution:**
1. Contact admin for role upgrade
2. Request Manager to perform allocation

### Stale Data Warning

**Cause:** Allocation data older than 5 minutes

**Resolution:**
1. Click **[Refresh]** to reload current inventory
2. Re-run auto-allocate with fresh data

## Related Topics

- [Sales Order Workflow](/docs/guides/shipping/sales-order-workflow.md)
- [Pick List Generation](/docs/guides/shipping/pick-list-guide.md)
- [Inventory Allocation API](/docs/api/shipping/inventory-allocation.md)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-01-22 | Initial release (Story 07.7) |
