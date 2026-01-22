# Pick List Generation Guide

> Story 07.8 - Pick List Generation + Wave Picking

This guide explains how to generate pick lists from confirmed sales orders, assign them to pickers, and manage the picking workflow.

## Overview

Pick lists are warehouse documents that instruct pickers which items to collect from inventory to fulfill sales orders. MonoPilot supports:

- **Single-order picking**: One pick list per sales order
- **Wave picking**: Consolidate multiple orders into one pick list for efficiency

## Prerequisites

Before creating pick lists:

1. Sales orders must have status `confirmed`
2. Inventory must be allocated to the sales orders (Story 07.7)
3. User must have manager or warehouse role

## Creating a Single-Order Pick List

### From Sales Order Detail Page

1. Navigate to **Shipping > Sales Orders**
2. Click on a confirmed sales order
3. Verify status shows "Confirmed" with inventory allocated
4. Click **Create Pick List** button
5. Optionally set priority (Low, Normal, High, Urgent)
6. Optionally assign a picker immediately
7. Click **Create**

The system:
- Generates pick list number (PL-YYYY-NNNNN format)
- Creates pick lines from inventory allocations
- Sorts lines by location for optimal route
- Updates sales order status to "Picking"

### Pick List Number Format

Pick list numbers follow the format `PL-YYYY-NNNNN`:
- `PL` - Pick List prefix
- `YYYY` - Current year
- `NNNNN` - Sequential number per organization (resets annually)

Example: `PL-2026-00042`

## Creating a Wave Pick List

Wave picking combines multiple orders into one pick list, improving warehouse efficiency.

### From Pick Lists Page

1. Navigate to **Shipping > Pick Lists**
2. Click **Create Wave Pick List**
3. Select multiple confirmed sales orders with allocations
4. Set priority level
5. Optionally assign a picker
6. Click **Create Wave**

### Benefits of Wave Picking

- **Reduced travel time**: Pick same product from one location for multiple orders
- **Consolidated picking**: Lines with same product + location are combined
- **Batch efficiency**: Process more orders in less time

## Pick Sequence (Route Optimization)

Pick lines are automatically sorted for optimal warehouse travel:

1. **Zone** (alphabetical): Dry -> Chilled -> Frozen
2. **Aisle** (alphanumeric): A1 -> A2 -> B1
3. **Bin** (numeric): 01 -> 02 -> 03

Example pick sequence:
```
Seq 1: Dry / Aisle A / Bin 01 - Widget A (50 units)
Seq 2: Dry / Aisle A / Bin 03 - Widget B (25 units)
Seq 3: Dry / Aisle B / Bin 01 - Widget C (100 units)
Seq 4: Chilled / Aisle C / Bin 02 - Product D (75 units)
```

Pickers follow the sequence to minimize back-and-forth movement.

## Assigning Pickers

### From Pick List Table

1. Navigate to **Shipping > Pick Lists**
2. Find pick lists with status "Pending"
3. Click **Assign** button on the row
4. Select a picker from the dropdown
5. Click **Assign**

### From Pick List Detail

1. Open a pick list detail page
2. Click **Assign Picker** button
3. Select a picker user
4. Click **Assign**

### Eligible Picker Roles

Only users with these roles can be assigned as pickers:
- Owner
- Admin
- Manager
- Warehouse Manager
- Shipping Manager
- Picker
- Warehouse Operator

## Viewing Pick Lists

### Pick List Table

Navigate to **Shipping > Pick Lists** to see all pick lists with:

| Column | Description |
|--------|-------------|
| Pick List # | PL-YYYY-NNNNN identifier |
| Type | Single Order or Wave |
| Status | Current status badge |
| Priority | Priority level badge |
| Assigned To | Picker name (or "Unassigned") |
| Lines | Total / Picked / Short counts |
| Created | Creation timestamp |

### Filtering Options

- **Status**: Pending, Assigned, In Progress, Completed, Cancelled
- **Assigned To**: Specific picker or "Unassigned"
- **Priority**: Low, Normal, High, Urgent
- **Date Range**: Filter by creation date
- **Search**: Search by pick list number

## My Picks (Picker View)

Pickers can view their assigned work:

1. Navigate to **Shipping > Pick Lists > My Picks**
2. View only pick lists assigned to you
3. Sorted by priority (urgent first) then oldest first
4. Shows status: Assigned or In Progress

### Actions Available

- **Start Picking**: Begin the pick process (changes status to In Progress)
- **Continue**: Resume an in-progress pick list
- **View Detail**: See pick lines and locations

## Pick List Status Workflow

```
[pending] --assign--> [assigned] --start--> [in_progress] --complete--> [completed]
                                                        |
                                                        +--short pick--> [completed]
```

| Status | Description |
|--------|-------------|
| Pending | Created, awaiting picker assignment |
| Assigned | Picker assigned, ready to start |
| In Progress | Picking actively being performed |
| Completed | All lines picked (or marked short) |
| Cancelled | Pick list cancelled (only if not in progress) |

## Pick List Detail View

The detail page shows:

### Header Section
- Pick list number and status badge
- Priority indicator
- Assigned picker (with reassign option)
- Linked sales orders with customer names
- Timestamps (created, started, completed)

### Summary Statistics
- Total lines count
- Total quantity to pick
- Lines picked / Lines short
- Unique locations count

### Pick Lines Table

Grouped by location (Zone / Aisle / Bin):

| Field | Description |
|-------|-------------|
| Sequence | Pick order number |
| Product | Code and name |
| Location | Full path (Zone / Aisle / Bin) |
| LP # | Suggested license plate |
| Lot | Batch/lot number |
| Qty to Pick | Required quantity |
| Status | Pending / Picked / Short |

## Priority Levels

| Priority | Color | Use Case |
|----------|-------|----------|
| Urgent | Red | Same-day shipment, critical customer |
| High | Orange | Next-day shipment, priority customer |
| Normal | Default | Standard fulfillment |
| Low | Gray | Can wait, flexible timing |

## FIFO/FEFO Compliance

Pick lists inherit lot tracking from inventory allocations:

- **FIFO** (First In, First Out): Oldest receipt date first
- **FEFO** (First Expiry, First Out): Nearest expiry date first

The suggested LP in each pick line follows the warehouse's FIFO/FEFO settings.

## Cancellation Rules

Pick lists can be cancelled only when:
- Status is `pending` or `assigned`
- Not yet started (no lines picked)

When cancelled:
- Pick list status changes to `cancelled`
- Allocations are released back to available inventory
- Sales order status reverts to `confirmed`

## Troubleshooting

### "No allocations found" Error

**Cause**: Sales order has no inventory allocated.

**Solution**:
1. Navigate to the sales order
2. Run inventory allocation (Story 07.7)
3. Verify sufficient stock exists
4. Retry pick list creation

### "User does not have picker role" Error

**Cause**: Selected user cannot be assigned as picker.

**Solution**:
1. Go to Settings > Users
2. Verify user has Picker, Warehouse Operator, or Manager role
3. Update role if necessary

### Pick lines missing location

**Cause**: License plates moved after allocation.

**Solution**:
1. Check current LP locations
2. Update pick lines manually or regenerate pick list
3. Perform stock move if needed

## Related Stories

- **07.7** - Inventory Allocation (prerequisite)
- **07.9** - Pick Confirmation Desktop (next step)
- **07.10** - Pick Confirmation Scanner (mobile picking)
- **07.11** - Packing Station (after picking complete)

## API Reference

See [Pick List API Reference](/docs/api/shipping/pick-lists.md) for technical details.
