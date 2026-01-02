# Transfer Order Partial Shipments User Guide

**Story**: 03.9a - TO Partial Shipments (Basic)
**Module**: Planning
**Audience**: Warehouse Managers, Warehouse Operators
**Last Updated**: December 2025

## What This Guide Covers

This guide explains how to ship and receive transfer orders using MonoPilot's partial shipment feature. You'll learn:

- How to ship transfer orders (full or partial quantities)
- How to receive transfer orders
- How to track shipment progress
- How status indicators work
- When you can perform each action
- How to troubleshoot common issues

---

## Before You Start

**Required Access**:
- Organization member (you belong to at least one warehouse)
- Warehouse Operator role (minimum) or Warehouse Manager/Admin

**Related Features**:
- [Transfer Order Management](to-crud.md) - Create and edit transfer orders
- [Warehouse Settings](../settings/planning-settings.md) - Enable/disable partial shipments toggle

---

## Key Concepts

### Transfer Order Status Flow

A transfer order moves through these statuses:

```
DRAFT → PLANNED → PARTIALLY_SHIPPED → SHIPPED → PARTIALLY_RECEIVED → RECEIVED
                        ↓ (optional)                       ↓ (optional)
                   SHIPPED (if shipped all at once)  RECEIVED (if received all at once)
```

**Status Meanings**:

| Status | Meaning | Can Ship? | Can Receive? |
|--------|---------|-----------|--------------|
| DRAFT | Created but not released | No | No |
| PLANNED | Ready for warehouse | Yes | No |
| PARTIALLY_SHIPPED | Some lines shipped, not all | Yes | Yes |
| SHIPPED | All lines fully shipped | No | Yes |
| PARTIALLY_RECEIVED | Some lines received, not all | No | Yes |
| RECEIVED | All lines fully received | No | No |
| CLOSED | Order completed and archived | No | No |
| CANCELLED | Order cancelled | No | No |

### Progress Indicators

Each line shows progress with numbers and a progress bar:

**Shipped Progress**: Shows how much of each line has been shipped
- Format: `5 / 10 shipped` (5 units shipped out of 10 ordered)
- Green checkmark when 100%
- Yellow progress bar when partial
- Gray when 0%

**Received Progress**: Shows how much of each line has been received
- Format: `3 / 5 received` (3 units received out of 5 shipped)
- Note: Shows received vs shipped, NOT vs ordered
- Green checkmark when all shipped items are received
- Yellow progress bar when partial

### Cumulative Quantities

Shipments and receipts accumulate. You don't replace previous values, you add to them:

**Example**:
```
Line ordered: 100 units

Day 1 - Ship 60 units
  shipped_qty = 60 (0 + 60)
  remaining = 40

Day 2 - Ship 40 more units
  shipped_qty = 100 (60 + 40)
  remaining = 0
```

---

## How to Ship a Transfer Order

### Step 1: Navigate to Transfer Order Detail

1. Go to **Planning > Transfer Orders**
2. Find your transfer order in the list
3. Click on it to open the detail page
4. Verify the status is **PLANNED** or **PARTIALLY_SHIPPED** (if continuing a partial shipment)

### Step 2: Open Ship Modal

Look for the action button or menu:
- **Desktop**: Click **"Ship"** button in the header
- **Mobile**: Tap **Actions** menu, select **Ship**

The "Ship Transfer Order" modal opens, showing:
- Transfer order number (e.g., "TO-2024-00042")
- A table with all lines

### Step 3: Review and Edit Line Quantities

The modal table shows:

| Column | Meaning | Can Edit? |
|--------|---------|-----------|
| Product | Product name and code | No |
| Ordered Qty | Total ordered | No |
| Previously Shipped | Already shipped in previous actions | No |
| Remaining | Can ship up to this amount | No |
| Ship Now | Quantity to ship in THIS action | Yes (default is remaining) |

**Example Table**:
```
Product          Ordered  Previously  Remaining  Ship Now
Flour Type A     500 kg   300 kg      200 kg     200 kg [editable]
Sugar White      200 kg   0 kg        200 kg     200 kg [editable]
Salt Industrial  100 kg   0 kg        100 kg     100 kg [editable]
```

**To Edit**:
1. Click on the "Ship Now" field
2. Change the quantity
3. The "Remaining" column updates to show how much is left

**Smart Defaults**:
- On first shipment: defaults to ordered quantity (ship all at once)
- On subsequent shipments: defaults to remaining quantity

### Step 4: Set Shipment Date

1. The **Shipment Date** field defaults to today's date
2. To change: Click the date field and select a different date
3. **Important**: Cannot select future dates (only today or earlier)

**Why This Matters**:
- Recorded for audit and traceability
- Immutable on first shipment (can't be changed later)
- Visible on Transfer Order history

### Step 5: Add Optional Notes

1. The **Notes** field is optional (max 1000 characters)
2. Useful for recording shipment details:
   - "Loaded truck #42"
   - "Delayed due to weather"
   - "Partial due to stock shortage"

### Step 6: Review and Ship

1. **Review**: Check "Ship Now" quantities for each line
2. **Validate**: At least one line must have quantity > 0
3. **Click**: "Ship" button to submit

**What Happens**:
- API sends ship request to server
- Server validates quantities
- `shipped_qty` updated for each line (adds to previous)
- Transfer Order status updates:
  - All lines fully shipped → **SHIPPED**
  - Any line has remaining → **PARTIALLY_SHIPPED**
- Modal closes
- Success toast message appears
- Page refreshes to show new status and quantities

### Step 7: Verify Success

After shipping, verify:
1. Status badge changed (PLANNED → SHIPPED or PARTIALLY_SHIPPED)
2. Progress indicators updated
3. "Shipped" column shows new quantities
4. Success message appeared (toast notification)

**If Partially Shipped**:
- "Ship" button remains enabled
- You can ship remaining quantities later
- No rush to complete in one shipment

---

## How to Receive a Transfer Order

### Step 1: Navigate to Transfer Order Detail

1. Go to **Planning > Transfer Orders**
2. Find your transfer order
3. Click to open detail page
4. Verify status is **SHIPPED** or **PARTIALLY_SHIPPED** or **PARTIALLY_RECEIVED**

**Important**: Cannot receive items that haven't been shipped yet.

### Step 2: Open Receive Modal

Look for the action button or menu:
- **Desktop**: Click **"Receive"** button in the header
- **Mobile**: Tap **Actions** menu, select **Receive**

The "Receive Transfer Order" modal opens, showing:
- Transfer order number
- A table with all lines that have been shipped

### Step 3: Review and Edit Receive Quantities

The modal table shows:

| Column | Meaning | Can Edit? |
|--------|---------|-----------|
| Product | Product name and code | No |
| Shipped Qty | Total amount that was shipped | No |
| Previously Received | Already received in previous actions | No |
| Remaining | Can receive up to this amount | No |
| Receive Now | Quantity to receive in THIS action | Yes (default is remaining) |

**Example Table**:
```
Product          Shipped  Previously  Remaining  Receive Now
Flour Type A     500 kg   200 kg      300 kg     300 kg [editable]
Sugar White      200 kg   0 kg        200 kg     200 kg [editable]
Salt Industrial  0 kg     0 kg        0 kg       0 kg [disabled]
```

**Note**: Lines with 0 shipped qty are disabled (can't receive what wasn't shipped).

### Step 4: Set Receipt Date

1. The **Receipt Date** field defaults to today
2. To change: Click date field and select a different date
3. **Important**: Cannot select future dates (only today or earlier)

### Step 5: Add Optional Notes

1. The **Notes** field is optional (max 1000 characters)
2. Examples:
   - "Received at warehouse branch-a"
   - "Some items damaged in transit"
   - "Verified against packing slip"

### Step 6: Review and Receive

1. **Review**: Check "Receive Now" quantities
2. **Validate**: At least one line must have quantity > 0
3. **Click**: "Receive" button

**What Happens**:
- API sends receive request
- Server validates quantities
- `received_qty` updated for each line
- Transfer Order status updates:
  - All lines fully received → **RECEIVED**
  - Any line has unrecieved shipped qty → **PARTIALLY_RECEIVED**
- Modal closes
- Success message appears
- Page refreshes

### Step 7: Verify Success

After receiving, verify:
1. Status badge changed (SHIPPED → RECEIVED or PARTIALLY_RECEIVED)
2. "Received" column updated
3. Progress indicators show new percentages
4. Success message appeared

---

## Status-Based Action Visibility

### When Can You Ship?

**Ship button is visible when**:
- Status is **PLANNED** (initial shipment)
- Status is **PARTIALLY_SHIPPED** (continuing a partial shipment)

**Ship button is hidden when**:
- Status is DRAFT (release order first)
- Status is SHIPPED (all items already shipped)
- Status is RECEIVED or CLOSED (order complete)

### When Can You Receive?

**Receive button is visible when**:
- Status is **SHIPPED** (ready for receipt)
- Status is **PARTIALLY_SHIPPED** (some items shipped, can receive them)
- Status is **PARTIALLY_RECEIVED** (continuing a partial receipt)

**Receive button is hidden when**:
- Status is DRAFT or PLANNED (not shipped yet)
- Status is RECEIVED (already complete)
- Status is CLOSED or CANCELLED (order finished)

### Action Visibility Matrix

| TO Status | Ship Visible? | Receive Visible? | Why? |
|-----------|---------------|------------------|------|
| DRAFT | No | No | Must release first |
| PLANNED | Yes | No | Ready to ship, not shipped yet |
| PARTIALLY_SHIPPED | Yes | Yes | Can continue shipping and start receiving |
| SHIPPED | No | Yes | All shipped, ready for receipt |
| PARTIALLY_RECEIVED | No | Yes | Can continue receiving |
| RECEIVED | No | No | Complete, no more actions |
| CLOSED | No | No | Archived |
| CANCELLED | No | No | Cancelled |

---

## Progress Indicators

### Understanding the Progress Bar

**Shipped Progress Example**:
```
Product A: 5 / 10 units shipped
[████░░░░░░] 50%

Product B: 10 / 10 units shipped
[██████████] 100% ✓

Product C: 0 / 10 units shipped
[░░░░░░░░░░] 0%
```

### Color Coding

| Color | Meaning | Example |
|-------|---------|---------|
| Green | 100% complete | Fully shipped or received |
| Green + Checkmark | 100% complete | All units accounted for |
| Yellow | Partial (1-99%) | Some units remaining |
| Gray | 0% complete | No units shipped/received yet |

### Shipped vs Received Progress

**Shipped Progress**:
- Shows: Shipped qty / Ordered qty
- Example: "5 / 10 shipped" (5 out of 10 ordered units are shipped)

**Received Progress**:
- Shows: Received qty / Shipped qty (NOT vs ordered)
- Example: "3 / 5 received" (3 out of 5 shipped units are received)
- Why different? You can only receive what was shipped, not ordered

**Example Scenario**:
```
Product A: Ordered 100 units

After first shipment (60 units):
  Shipped: 60 / 100 (60%)
  Received: 0 / 60 (0%)

After receipt (40 units):
  Shipped: 60 / 100 (still 60%)
  Received: 40 / 60 (67%)

After second shipment (40 units):
  Shipped: 100 / 100 (100%)
  Received: 40 / 100 (40% of total)
```

---

## Handling Partial Shipments

### Scenario: Incomplete Stock

**Situation**: Customer ordered 100 units, but you only have 60 in stock right now.

**Solution**:
1. Open TO Detail page (status: PLANNED)
2. Click "Ship" button
3. In Ship modal:
   - Line shows: Ordered 100, Ship Now = 60 (change from default 100)
   - Click "Ship" button
4. TO status changes to PARTIALLY_SHIPPED
5. Progress shows: 60 / 100 shipped (60%)

**Later, when remaining stock arrives**:
1. Open same TO (status: PARTIALLY_SHIPPED)
2. Click "Ship" button again
3. Modal shows: Ordered 100, Previously Shipped 60, Remaining 40
4. Enter Ship Now = 40
5. Click "Ship"
6. TO status changes to SHIPPED (100 / 100)

### Scenario: Split Delivery (Multiple Warehouse Locations)

**Situation**: Ship 100 units across 2 warehouse locations (60 to Location A, 40 to Location B).

**First Shipment (Day 1)**:
1. Ship 60 units (status: PARTIALLY_SHIPPED)
2. Notes: "Shipped 60 units to Location A"

**Second Shipment (Day 3)**:
1. Ship 40 units (status: SHIPPED)
2. Notes: "Shipped 40 units to Location B"

Both shipments tracked in the same TO with cumulative quantities.

---

## Common Workflows

### Workflow 1: Full Shipment → Full Receipt

Best for: Complete stock available, single delivery

```
1. TO created (PLANNED)
        ↓ Ship all 100 units
2. Status: SHIPPED
        ↓ Receive all 100 units
3. Status: RECEIVED ✓
```

**Time**: 2 API calls

### Workflow 2: Multiple Shipments → Multiple Receipts

Best for: Partial stock, staggered deliveries

```
1. TO created (PLANNED)
        ↓ Ship 60 units
2. Status: PARTIALLY_SHIPPED
        ↓ Receive 60 units
3. Status: PARTIALLY_RECEIVED
        ↓ Ship remaining 40 units
4. Status: SHIPPED
        ↓ Receive remaining 40 units
5. Status: RECEIVED ✓
```

**Time**: 4 API calls

### Workflow 3: Ship All → Receive Partial

Best for: Quality hold, inspection required

```
1. TO created (PLANNED)
        ↓ Ship all 100 units
2. Status: SHIPPED
        ↓ Receive 80 units (20 on hold for inspection)
3. Status: PARTIALLY_RECEIVED
        ↓ Receive remaining 20 units (inspection passed)
4. Status: RECEIVED ✓
```

**Time**: 3 API calls

---

## Planning Settings: Partial Shipments Toggle

### What Is This Setting?

The **"Allow Partial Shipments"** toggle controls whether users can ship partial quantities.

### How to Access

1. Go to **Planning > Settings**
2. Find **"Allow Partial Shipments"** option
3. Toggle to enable (on) or disable (off)

### Behavior When Enabled (Default)

- "Ship Now" fields are editable
- Users can enter any quantity up to remaining amount
- Supports multiple shipments
- Status transitions to PARTIALLY_SHIPPED when appropriate

### Behavior When Disabled

- "Ship Now" fields are locked to ordered quantities
- All lines must be shipped in full (no partials)
- Modal shows message: "Partial shipments disabled. All lines must be shipped in full."
- First shipment determines if full order is shipped
- Still supports multiple receipts after all shipped

### When to Disable

- Your business requires full shipments
- Regulatory compliance requires complete orders in one shipment
- Integration with carrier requires full shipments

### When to Enable (Recommended)

- Partial stock scenarios
- Multiple warehouse locations
- Quality inspections
- Flexible shipping arrangements

---

## Troubleshooting

### "Ship button is not visible"

**Possible Causes**:
1. Transfer order is in wrong status (not PLANNED or PARTIALLY_SHIPPED)
2. Transfer order is DRAFT and needs to be released
3. Transfer order is already SHIPPED

**Solution**:
- Check TO status in the detail page
- If DRAFT, ask someone with edit permission to release it
- If SHIPPED, TO is complete, no more shipping needed

### "Cannot edit Ship Now quantities"

**Possible Causes**:
1. Partial Shipments are disabled in Planning Settings
2. This is a line that's already fully shipped

**Solution**:
- If all shipments must be in full, enable that in your workflow
- For already-shipped lines, they'll show remaining = 0 (can't ship more)

### "Receive button not visible"

**Possible Cause**: Transfer order hasn't been shipped yet.

**Solution**:
- Ship the items first
- Then receive button will appear
- Cannot receive items that haven't been shipped

### "Cannot receive this quantity"

**Error Message**: "Receive quantity exceeds shipped quantity for line X"

**Cause**: Trying to receive more than was shipped.

**Solution**:
1. Check "Shipped Qty" column (how much was shipped)
2. Enter "Receive Now" quantity up to that amount
3. Cannot receive more than shipped

### "Cannot receive line: no items have been shipped yet"

**Cause**: Attempting to receive a line that has 0 shipped quantity.

**Solution**: Ship items first, then receive. This prevents receiving items without shipping.

### "Shipment date cannot be in the future"

**Cause**: Date field set to a future date.

**Solution**: Select today's date or earlier (when shipment actually occurred).

### "At least one line must have quantity > 0"

**Cause**: All "Ship Now" or "Receive Now" fields are 0.

**Solution**: Enter at least one quantity > 0 for the action to be meaningful.

### Transfer order disappears after action

**Cause**: Page might be loading new data or there's a connection issue.

**Solution**:
- Wait a few seconds for page to refresh
- If still missing, refresh the page manually
- Contact support if persist

---

## Tips and Best Practices

### Shipment Planning

1. **Batch Similar Products**: If possible, ship products with same destination together
2. **Track By Notes**: Use notes to record truck numbers, carrier info, special instructions
3. **Time-Zone Aware**: Shipment dates are in your organization's timezone
4. **Early Updates**: Enter shipment date as soon as items leave warehouse

### Receipt Processing

1. **Inspect First**: Receive items only after physical inspection
2. **Count Carefully**: Match "Ship Now" quantities to actual items received
3. **Document Issues**: Use notes to record damaged items, discrepancies
4. **Timely Recording**: Record receipt within 24 hours of arrival

### Efficiency

1. **Use Smart Defaults**: Modal defaults to remaining quantity for quick entry
2. **Batch Receipts**: Receive multiple lines in one action if available
3. **Multi-Line Edits**: Can enter different quantities for different lines in same shipment
4. **Copy TO**: Duplicate successful TO for next orders (if using Planning > Duplicate)

### Audit Trail

1. **Reviewed After Shipment**: Status and progress visible immediately
2. **Immutable First Entry**: First ship date can't be changed (good for audits)
3. **Track Multiple Users**: Notes show "Shipped By" and "Received By" for each action
4. **History Tab**: View complete timeline of all actions on TO

---

## FAQ

**Q: Can I change the shipment date after shipping?**
A: No. The first shipment date is immutable for audit purposes. Subsequent shipments can have different dates.

**Q: Can I receive items I haven't shipped yet?**
A: No. MonoPilot prevents receiving items without shipping first (security feature).

**Q: What happens if I partially ship, then ship the rest later?**
A: Status automatically updates from PARTIALLY_SHIPPED to SHIPPED when all lines are fully shipped.

**Q: Can I ship half the order, receive it, then ship the rest?**
A: Yes. You can interleave ship and receive operations. Status updates support this workflow.

**Q: Do I need to enter notes?**
A: No, notes are optional. But recommended for documentation and troubleshooting.

**Q: What if I made a mistake in quantities?**
A: Unfortunately, quantities can't be edited after submission. Contact support if correction needed.

**Q: Can another user continue a partial shipment I started?**
A: Yes. Any user with warehouse operator role can ship or receive from partial orders.

**Q: What's the difference between "Previously Shipped" and "Remaining"?**
A: Previously Shipped = total shipped so far. Remaining = can still ship (Ordered - Previously Shipped).

---

## Getting Help

### In-App Help
- **Hover tooltips**: Many fields have help text (hover over question mark icon)
- **Error messages**: Read carefully, they explain exactly what's wrong
- **Status badges**: Click on status to see what actions are available

### Support
- **In-App Chat**: Use the support chat in the bottom right
- **Email**: support@monopilot.example.com
- **Docs**: Check Planning module guide for more info

### Related Documentation
- [Transfer Order CRUD Guide](to-crud.md) - Creating and editing transfer orders
- [Warehouse Settings](../settings/planning-settings.md) - Configure partial shipments
- [API Documentation](../../../3-ARCHITECTURE/api/planning/to-partial-shipments.md) - Technical details

---

**Version**: 1.0.0
**Last Updated**: December 2025
