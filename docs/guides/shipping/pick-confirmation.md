# Pick Confirmation - User Guide

> Story: 07.9 - Pick Confirmation Desktop
> Module: Shipping
> Audience: Warehouse Pickers, Warehouse Managers

## Overview

Pick Confirmation allows warehouse pickers to confirm picked inventory using a desktop computer. This guide covers the complete workflow from starting a pick list to completing it.

---

## Prerequisites

Before you begin:

1. A pick list must be **assigned** to you (or you have Warehouse+ role)
2. Navigate to **Shipping > Pick Lists** in the main menu
3. Find your assigned pick list in "My Picks" tab

---

## Workflow

### Step 1: Start Pick List

1. Open your assigned pick list
2. Click **Start Picking**
3. The system transitions the pick list to "In Progress"
4. You are navigated to the Pick Confirmation page

The pick confirmation page displays:
- Pick list header (PL number, priority, assigned picker)
- Progress bar (0 of X lines picked)
- Current pick line details

---

### Step 2: Navigate to Pick Location

Each pick line shows:

| Field | Description |
|-------|-------------|
| Location | Zone-Aisle-Bin (e.g., A-03-5A) |
| Product | Name and SKU |
| Lot | Lot number and best-before date |
| License Plate | LP number with barcode |
| Quantity | Amount to pick |

Navigate to the displayed location in your warehouse.

---

### Step 3: Confirm Full Pick

If you have the full quantity available:

1. Verify the product, lot, and LP match the display
2. Pick the specified quantity from the license plate
3. Enter the picked quantity (default = quantity to pick)
4. Click **Confirm Pick**

The system:
- Records the pick with timestamp
- Decrements LP inventory
- Updates progress bar
- Advances to the next line

---

### Step 4: Handle Short Pick

If you cannot pick the full quantity:

1. Enter the actual quantity picked (less than required)
2. Click **Short Pick**
3. Select a reason from the dropdown:
   - Insufficient inventory
   - Damaged product
   - Expired product
   - Location empty
   - Quality hold
   - Other

4. Add optional notes if needed
5. Click **Confirm Short Pick**

The system:
- Records the partial pick
- Creates a backorder for the short quantity
- Advances to the next line

---

### Step 5: Handle Allergen Warnings

If a product contains allergens that match the customer's restrictions:

1. A red warning banner appears
2. Review the allergen conflict
3. Check the acknowledgment checkbox
4. Then click **Confirm Pick**

This ensures food safety compliance.

---

### Step 6: Complete Pick List

After all lines are picked or marked short:

1. Click **Complete Pick List**
2. Review the summary:
   - Total lines picked
   - Short picks
   - Total units picked
3. The system updates sales order status

If all lines fully picked: SO status becomes **Packing**
If any lines short: SO status becomes **Partial**

---

## UI Components

### Progress Bar

Displays real-time picking progress:

```
Picked 5 of 12 lines (42%)
[====================                    ]
5 picked, 0 short picks
```

### Pick Line Card

Shows current line details:
- Location (large, prominent)
- Product info with allergen badges
- Lot and expiry date
- LP barcode (scannable)
- Quantity input with +/- buttons
- Confirm Pick / Short Pick buttons

### Short Pick Modal

Appears when clicking Short Pick:
- Reason dropdown (required)
- Notes field (optional)
- Confirm / Cancel buttons

### Allergen Warning Banner

Red banner with:
- Alert icon
- Text: "ALLERGEN ALERT: This product contains GLUTEN. Customer is allergic to GLUTEN."
- Acknowledgment checkbox

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Enter | Confirm pick (when quantity focused) |
| Tab | Move to next field |
| Esc | Cancel current action |

---

## Tips for Efficient Picking

1. **Follow the sequence** - Lines are sorted by pick_sequence for optimal routing
2. **Verify before picking** - Check product, lot, and LP match
3. **Report issues immediately** - Use short pick for any discrepancy
4. **Acknowledge allergen warnings** - Required before confirming picks with allergen conflicts
5. **Complete promptly** - Finish pick lists in one session when possible

---

## Troubleshooting

### Cannot start pick list

**Cause**: Pick list not assigned to you

**Solution**: Contact your supervisor to reassign the pick list, or if you have Warehouse+ role, you can start any pick list.

### Quantity exceeds allocated

**Cause**: Entered quantity > quantity_to_pick

**Solution**: Enter a quantity equal to or less than the allocated amount. Use Short Pick if less available.

### LP not found

**Cause**: License plate was moved or consumed

**Solution**: Contact supervisor. The allocation may need to be updated.

### Access denied

**Cause**: You are not the assigned picker and lack elevated role

**Solution**: The pick list is assigned to another picker. Contact your supervisor.

---

## Related Topics

- [Pick List Generation](./pick-list-generation.md)
- [Scanner Pick Workflow](./scanner-pick.md)
- [Packing Station](./packing-station.md)
