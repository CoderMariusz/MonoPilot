# Packaging Hierarchy

## Overview

The system supports a 4-level packaging hierarchy for Finished Goods (FG) products:

**Unit → Pack → Box → Pallet**

## Hierarchy Levels

1. **Unit**: The base unit of the product (defined by BOM item quantity)
2. **Pack**: One unit (same as unit in this system)
3. **Box**: Contains multiple packs (defined by `packs_per_box`)
4. **Pallet**: Contains multiple boxes (defined by `boxes_per_pallet`)

## Product Fields

### `packs_per_box` (Integer)

- Number of packs (units) that fit in one box
- Stored in `products.packs_per_box`
- Example: If `packs_per_box = 12`, then one box contains 12 units

### `boxes_per_pallet` (Integer)

- Number of boxes that fit on one pallet
- Stored in `products.boxes_per_pallet`
- Example: If `boxes_per_pallet = 60`, then one pallet contains 60 boxes

## Calculation Example

Given:
- BOM item quantity: 500 units
- `packs_per_box`: 12
- `boxes_per_pallet`: 60

Calculation:
1. **Units**: 500
2. **Packs**: 500 (1 unit = 1 pack)
3. **Boxes**: 500 ÷ 12 = 41.67 → **42 boxes** (rounded up)
4. **Pallets**: 42 ÷ 60 = 0.7 → **1 pallet** (rounded up)

## Usage in BOM Items

When creating a BOM for a Finished Good:
1. Enter quantity per unit (e.g., 500 units of material X per finished good)
2. System calculates: 500 units → 500 packs → 42 boxes → 1 pallet

## License Plates (LP)

When creating license plates from BOM items:
- Items are consumed at the unit level
- The final LP contains the calculated number of boxes on a pallet
- Example: A finished good LP will have boxes booked to a pallet based on `boxes_per_pallet`

## Where to Set

Packaging fields can be set:
1. **When creating a Finished Good product** (product_type = 'FG'):
   - Open `CompositeProductModal`
   - Select product type as 'FG'
   - Fill in "Packs per Box" and "Boxes per Pallet" fields
   - These fields only appear for FG products

2. **When editing an existing FG product**:
   - Edit the product in `CompositeProductModal`
   - Update packaging fields as needed

## Notes

- Packaging fields are optional
- Only applicable to Finished Goods (FG) products
- Values must be positive integers (>= 1) if provided
- These fields enable automatic calculation of box and pallet quantities from BOM item quantities


