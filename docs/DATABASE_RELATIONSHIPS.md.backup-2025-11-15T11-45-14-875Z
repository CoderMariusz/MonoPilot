# Database Relationships Documentation

## Overview

This document describes the relationships between tables in the MonoPilot MES system.

**Last Updated**: 2025-11-14 (auto-generated)

## Entity Relationship Diagram (Text)

### users

**Referenced by**:

- `users.created_by` → `users.id`
- `users.updated_by` → `users.id`
- `production_lines.created_by` → `users.id`
- `production_lines.updated_by` → `users.id`
- `products.created_by` → `users.id`
- `products.updated_by` → `users.id`
- `bom_history.changed_by` → `users.id`
- `routings.created_by` → `users.id`
- `routings.updated_by` → `users.id`
- `routing_operation_names.created_by` → `users.id`
- `routing_operation_names.updated_by` → `users.id`
- `po_header.created_by` → `users.id`
- `po_header.approved_by` → `users.id`
- `po_correction.created_by` → `users.id`
- `to_header.created_by` → `users.id`
- `to_header.approved_by` → `users.id`
- `wo_operations.operator_id` → `users.id`
- `asns.created_by` → `users.id`
- `asns.updated_by` → `users.id`
- `audit_log.actor_id` → `users.id`
- `material_costs.created_by` → `users.id`
- `bom_costs.calculated_by` → `users.id`
- `product_prices.created_by` → `users.id`

### warehouses

**Referenced by**:

- `locations.warehouse_id` → `warehouses.id`
- `settings_warehouse.warehouse_id` → `warehouses.id`
- `production_lines.warehouse_id` → `warehouses.id`
- `to_header.from_wh_id` → `warehouses.id`
- `to_header.to_wh_id` → `warehouses.id`
- `warehouse_settings.warehouse_id` → `warehouses.id`

### locations

**Referenced by**:

- `settings_warehouse.default_receiving_location_id` → `locations.id`
- `settings_warehouse.default_shipping_location_id` → `locations.id`
- `machines.location_id` → `locations.id`
- `po_line.default_location_id` → `locations.id`
- `license_plates.location_id` → `locations.id`
- `pallets.location_id` → `locations.id`
- `grn_items.location_id` → `locations.id`
- `stock_moves.from_location_id` → `locations.id`
- `stock_moves.to_location_id` → `locations.id`
- `warehouse_settings.default_to_receive_location_id` → `locations.id`
- `warehouse_settings.default_po_receive_location_id` → `locations.id`
- `warehouse_settings.default_transit_location_id` → `locations.id`

### suppliers

**Referenced by**:

- `products.supplier_id` → `suppliers.id`
- `po_header.supplier_id` → `suppliers.id`
- `grns.supplier_id` → `suppliers.id`
- `asns.supplier_id` → `suppliers.id`

### settings_tax_codes

**Referenced by**:

- `products.tax_code_id` → `settings_tax_codes.id`
- `bom_items.tax_code_id` → `settings_tax_codes.id`

### products

**Referenced by**:

- `boms.product_id` → `products.id`
- `bom_items.material_id` → `products.id`
- `routings.product_id` → `products.id`
- `po_line.item_id` → `products.id`
- `to_line.item_id` → `products.id`
- `work_orders.product_id` → `products.id`
- `wo_materials.material_id` → `products.id`
- `production_outputs.product_id` → `products.id`
- `license_plates.product_id` → `products.id`
- `grn_items.product_id` → `products.id`
- `asn_items.product_id` → `products.id`
- `stock_moves.product_id` → `products.id`
- `product_allergens.product_id` → `products.id`
- `wo_by_products.product_id` → `products.id`
- `wo_reservations.material_id` → `products.id`
- `material_costs.product_id` → `products.id`
- `product_prices.product_id` → `products.id`

### boms

**Referenced by**:

- `bom_items.bom_id` → `boms.id`
- `bom_history.bom_id` → `boms.id`
- `work_orders.bom_id` → `boms.id`
- `bom_costs.bom_id` → `boms.id`

### routings

**Referenced by**:

- `routing_operations.routing_id` → `routings.id`

### machines

**Referenced by**:

- `routing_operations.machine_id` → `machines.id`
- `work_orders.machine_id` → `machines.id`

### po_header

**Referenced by**:

- `po_line.po_id` → `po_header.id`
- `po_correction.po_id` → `po_header.id`
- `grns.po_id` → `po_header.id`
- `asns.po_id` → `po_header.id`

### po_line

**Referenced by**:

- `po_correction.po_line_id` → `po_line.id`

### to_header

**Referenced by**:

- `to_line.to_id` → `to_header.id`

### production_lines

**Referenced by**:

- `work_orders.line_id` → `production_lines.id`

### work_orders

**Referenced by**:

- `wo_materials.wo_id` → `work_orders.id`
- `wo_operations.wo_id` → `work_orders.id`
- `production_outputs.wo_id` → `work_orders.id`
- `license_plates.consumed_by_wo_id` → `work_orders.id`
- `lp_reservations.wo_id` → `work_orders.id`
- `lp_genealogy.wo_id` → `work_orders.id`
- `pallets.wo_id` → `work_orders.id`
- `wo_by_products.wo_id` → `work_orders.id`
- `wo_reservations.wo_id` → `work_orders.id`
- `wo_costs.wo_id` → `work_orders.id`

### routing_operations

**Referenced by**:

- `wo_operations.routing_operation_id` → `routing_operations.id`

### license_plates

**Referenced by**:

- `license_plates.parent_lp_id` → `license_plates.id`
- `lp_reservations.lp_id` → `license_plates.id`
- `lp_compositions.output_lp_id` → `license_plates.id`
- `lp_compositions.input_lp_id` → `license_plates.id`
- `lp_genealogy.child_lp_id` → `license_plates.id`
- `lp_genealogy.parent_lp_id` → `license_plates.id`
- `wo_by_products.lp_id` → `license_plates.id`
- `wo_reservations.lp_id` → `license_plates.id`

### pallets

**Referenced by**:

- `pallet_items.pallet_id` → `pallets.id`

### grns

**Referenced by**:

- `grn_items.grn_id` → `grns.id`

### asns

**Referenced by**:

- `asn_items.asn_id` → `asns.id`

### allergens

**Referenced by**:

- `product_allergens.allergen_id` → `allergens.id`

### organizations

**Referenced by**:

- `material_costs.org_id` → `organizations.id`
- `bom_costs.org_id` → `organizations.id`
- `product_prices.org_id` → `organizations.id`
- `wo_costs.org_id` → `organizations.id`

