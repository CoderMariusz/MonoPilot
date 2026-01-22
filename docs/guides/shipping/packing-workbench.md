# Packing Workbench Guide (Story 07.11)

How to use the packing workbench to create shipments, pack boxes, and complete the packing workflow.

## Overview

The packing workbench provides a 3-column interface for efficient packing operations:
- **Left Panel:** Available license plates (picked, ready to pack)
- **Center Panel:** Box builder with tabs for multiple boxes
- **Right Panel:** Packing summary with progress tracking

## Creating a Shipment

### From Sales Order

1. Navigate to **Shipping > Shipments**
2. Click **Create Shipment**
3. Select a picked sales order from the table
4. Click **Create**

The system:
- Generates shipment number (format: `SH-2025-00001`)
- Links to the sales order
- Sets status to 'pending'
- Updates SO status to 'packing'

### Prerequisites

- Sales order must be in 'picked' status
- All pick lists completed
- No existing shipment for the SO

## Packing Workflow

### Step 1: Add Boxes

1. Click **Add Box** in the center panel
2. Box numbers auto-increment (Box 1, Box 2...)
3. Switch between boxes using tabs

### Step 2: Pack License Plates

Two methods to add LPs to boxes:

**Drag and Drop:**
1. Drag LP from left panel
2. Drop onto the active box
3. LP moves from Available to Packed

**Click to Add:**
1. Click LP in left panel to select
2. Click **Add to Box** button
3. LP added to current active box

### Step 3: Enter Weight and Dimensions

For each box:
1. Enter **Weight** (0.1 - 25 kg)
2. Optionally enter **Dimensions**:
   - Length (10 - 200 cm)
   - Width (10 - 200 cm)
   - Height (10 - 200 cm)

Weight is required for packing completion.

### Step 4: Complete Packing

1. Verify all LPs are packed (progress shows 100%)
2. Verify all boxes have weight entered
3. Click **Complete Packing**

The system:
- Validates all items packed
- Validates all boxes have weight
- Sets shipment status to 'packed'
- Updates SO status to 'packed'
- Records packed_at timestamp

## Packing Summary

The right panel shows:

| Metric | Description |
|--------|-------------|
| Pack Progress | Percentage of LPs packed |
| Total LPs | Total license plates to pack |
| Packed | Number already in boxes |
| Remaining | LPs still to pack |
| Total Weight | Sum of all box weights |
| Total Boxes | Number of boxes created |

## Allergen Warnings

When adding an LP to a box, the system checks for allergen conflicts:

1. **Customer restrictions** - allergens customer must avoid
2. **Product allergens** - allergens present in the product
3. **Box allergens** - allergens already in the box

### Warning Dialog

If a conflict is detected:

```
Warning: Allergen Conflict Detected

Product contains: Gluten, Soy
Customer restrictions: Gluten, Peanuts
Conflicting: Gluten

This is a warning only. You may proceed if appropriate
controls are in place.

[Cancel]  [Continue Anyway]
```

Warnings are:
- **Non-blocking** - user can proceed
- **Logged** - recorded for audit trail
- **Visual** - highlighted in the interface

## Box Management

### Remove LP from Box

1. Expand box contents
2. Click remove icon next to LP
3. LP returns to Available list

### Delete Empty Box

1. Ensure box is empty
2. Click delete icon on box tab
3. Box numbers do not re-sequence

### View Box Contents

1. Click expand arrow on box row
2. Contents show:
   - Product name
   - LP number
   - Lot number
   - Quantity

## Validation Rules

### Weight Validation

| Condition | Message |
|-----------|---------|
| weight <= 0 | "Weight must be greater than 0" |
| weight > 25 | "Weight exceeds 25kg maximum" |

### Dimension Validation

| Condition | Message |
|-----------|---------|
| dim < 10 | "Dimension must be at least 10cm" |
| dim > 200 | "Dimension cannot exceed 200cm" |

### Packing Completion

| Condition | Error |
|-----------|-------|
| Boxes without weight | "Enter weight for all boxes" |
| Unpacked LPs | "Not all items packed" |
| Wrong status | "Shipment must be in packing status" |

## LP Information Display

Each LP in the left panel shows:

- **LP Number** - e.g., LP-2025-00001
- **Product Name** - e.g., Organic Flour 5lb
- **Lot Number** - e.g., LOT-2025-001
- **Quantity** - e.g., 100 units
- **Location** - e.g., PICK-A-01

Hover for additional details:
- Expiry date
- Full location path
- Allergen indicators

## Keyboard Navigation

| Key | Action |
|-----|--------|
| Tab | Move between elements |
| Enter | Select/Add LP |
| Arrow keys | Navigate LP list |
| Escape | Close modals |

## Status Indicators

### Shipment Status

| Status | Color | Description |
|--------|-------|-------------|
| Pending | Yellow | Created, no boxes yet |
| Packing | Blue | Boxes being packed |
| Packed | Green | Ready for manifest |

### Box Status

| Indicator | Meaning |
|-----------|---------|
| No weight | Orange warning icon |
| Weight set | Green check icon |
| Empty | Gray outline |
| Has contents | Solid fill |

## Troubleshooting

### Cannot create shipment

**Cause:** SO not in picked status
**Solution:** Complete all pick lists first

### Cannot complete packing

**Cause:** Boxes missing weight
**Solution:** Enter weight for all boxes

### LP not showing in available list

**Cause:** LP already packed or not picked
**Solution:** Check pick list completion

### Allergen warning persists

**Cause:** Product/customer allergen conflict
**Solution:** Proceed if controls in place, or select different box

## Best Practices

1. **Pack by product type** - Group similar items
2. **Check weight limits** - Max 25kg per box
3. **Verify lot numbers** - Ensure traceability captured
4. **Review allergen warnings** - Don't ignore without reason
5. **Complete all at once** - Don't leave partial packing

## Related Documentation

- [Packing Shipment API](/docs/api/shipping/packing-shipment.md)
- [SSCC & BOL Labels](/docs/guides/shipping/sscc-bol-labels.md)
- [Shipment Manifest](/docs/guides/shipping/shipment-manifest.md)
- [Pick Confirmation](/docs/guides/shipping/pick-confirmation.md)
