# Database Relationships Documentation

## Overview

This document describes the relationships between tables in the MonoPilot MES system.

**Last Updated**: 2025-11-08 (auto-generated)

## Entity Relationship Diagram (Text)

### suppliers

**Referenced by**:

- `products.preferred_supplier_id` → `suppliers.id`
- `purchase_orders.supplier_id` → `suppliers.id`
- `grns.supplier_id` → `suppliers.id`
- `asns.supplier_id` → `suppliers.id`
- `supplier_products.supplier_id` → `suppliers.id`
- `po_header.supplier_id` → `suppliers.id`

### settings_tax_codes

**Referenced by**:

- `products.tax_code_id` → `settings_tax_codes.id`
- `bom_items.tax_code_id` → `settings_tax_codes.id`
- `supplier_products.tax_code_id` → `settings_tax_codes.id`

### users

**Referenced by**:

- `products.created_by` → `users.id`
- `products.updated_by` → `users.id`
- `wo_materials.created_by` → `users.id`
- `wo_materials.updated_by` → `users.id`
- `production_outputs.created_by` → `users.id`
- `production_outputs.updated_by` → `users.id`
- `routings.created_by` → `users.id`
- `routings.updated_by` → `users.id`
- `wo_operations.operator_id` → `users.id`
- `lp_reservations.created_by` → `users.id`
- `lp_reservations.consumed_by` → `users.id`
- `lp_reservations.cancelled_by` → `users.id`
- `lp_reservations.reserved_by` → `users.id`
- `wo_bom_snapshots.created_by` → `users.id`
- `lp_compositions.created_by` → `users.id`
- `pallets.created_by` → `users.id`
- `pallets.updated_by` → `users.id`
- `pallet_items.created_by` → `users.id`
- `pallet_items.added_by` → `users.id`
- `work_orders_audit.created_by` → `users.id`
- `qa_override_log.override_by` → `users.id`
- `po_header.created_by` → `users.id`
- `po_header.approved_by` → `users.id`
- `po_correction.created_by` → `users.id`
- `to_header.created_by` → `users.id`
- `to_header.approved_by` → `users.id`
- `audit_log.actor_id` → `users.id`
- `users.created_by` → `users.id`
- `users.updated_by` → `users.id`
- `bom_history.changed_by` → `users.id`
- `production_lines.created_by` → `users.id`
- `production_lines.updated_by` → `users.id`
- `routing_operation_names.created_by` → `users.id`
- `routing_operation_names.updated_by` → `users.id`

### products

**Referenced by**:

- `boms.product_id` → `products.id`
- `bom_items.material_id` → `products.id`
- `work_orders.product_id` → `products.id`
- `wo_materials.material_id` → `products.id`
- `purchase_order_items.product_id` → `products.id`
- `grn_items.product_id` → `products.id`
- `transfer_order_items.product_id` → `products.id`
- `asn_items.product_id` → `products.id`
- `production_outputs.product_id` → `products.id`
- `product_allergens.product_id` → `products.id`
- `supplier_products.product_id` → `products.id`
- `routings.product_id` → `products.id`
- `po_line.item_id` → `products.id`
- `to_line.item_id` → `products.id`
- `license_plates.product_id` → `products.id`
- `stock_moves.product_id` → `products.id`

### boms

**Referenced by**:

- `bom_items.bom_id` → `boms.id`
- `work_orders.bom_id` → `boms.id`
- `wo_bom_snapshots.bom_id` → `boms.id`
- `bom_history.bom_id` → `boms.id`

### machines

**Referenced by**:

- `work_orders.machine_id` → `machines.id`
- `routing_operations.machine_id` → `machines.id`
- `wo_operations.device_id` → `machines.id`
- `pallets.line_id` → `machines.id`

### work_orders

**Referenced by**:

- `wo_materials.wo_id` → `work_orders.id`
- `production_outputs.wo_id` → `work_orders.id`
- `wo_operations.wo_id` → `work_orders.id`
- `lp_reservations.wo_id` → `work_orders.id`
- `wo_bom_snapshots.wo_id` → `work_orders.id`
- `pallets.wo_id` → `work_orders.id`
- `work_orders_audit.wo_id` → `work_orders.id`
- `license_plates.consumed_by_wo_id` → `work_orders.id`
- `lp_genealogy.wo_id` → `work_orders.id`

### purchase_orders

**Referenced by**:

- `purchase_order_items.po_id` → `purchase_orders.id`
- `grns.po_id` → `purchase_orders.id`
- `asns.po_id` → `purchase_orders.id`

### grns

**Referenced by**:

- `grn_items.grn_id` → `grns.id`

### locations

**Referenced by**:

- `grn_items.location_id` → `locations.id`
- `po_line.default_location_id` → `locations.id`
- `to_line.from_location_id` → `locations.id`
- `to_line.to_location_id` → `locations.id`
- `machines.location_id` → `locations.id`
- `license_plates.location_id` → `locations.id`
- `stock_moves.from_location_id` → `locations.id`
- `stock_moves.to_location_id` → `locations.id`

### transfer_orders

**Referenced by**:

- `transfer_order_items.to_id` → `transfer_orders.id`

### asns

**Referenced by**:

- `asn_items.asn_id` → `asns.id`

### license_plates

**Referenced by**:

- `production_outputs.lp_id` → `license_plates.id`
- `lp_reservations.lp_id` → `license_plates.id`
- `lp_compositions.output_lp_id` → `license_plates.id`
- `lp_compositions.input_lp_id` → `license_plates.id`
- `pallet_items.box_lp_id` → `license_plates.id`
- `qa_override_log.lp_id` → `license_plates.id`
- `license_plates.parent_lp_id` → `license_plates.id`
- `lp_genealogy.child_lp_id` → `license_plates.id`
- `lp_genealogy.parent_lp_id` → `license_plates.id`

### allergens

**Referenced by**:

- `product_allergens.allergen_id` → `allergens.id`

### routings

**Referenced by**:

- `routing_operations.routing_id` → `routings.id`

### routing_operations

**Referenced by**:

- `wo_operations.routing_operation_id` → `routing_operations.id`

### wo_operations

**Referenced by**:

- `lp_reservations.operation_id` → `wo_operations.id`
- `lp_compositions.operation_id` → `wo_operations.id`
- `qa_override_log.operation_id` → `wo_operations.id`

### pallets

**Referenced by**:

- `pallet_items.pallet_id` → `pallets.id`

### po_header

**Referenced by**:

- `po_line.po_id` → `po_header.id`
- `po_correction.po_id` → `po_header.id`

### po_line

**Referenced by**:

- `po_correction.po_line_id` → `po_line.id`

### warehouses

**Referenced by**:

- `to_header.from_wh_id` → `warehouses.id`
- `to_header.to_wh_id` → `warehouses.id`
- `locations.warehouse_id` → `warehouses.id`
- `production_lines.warehouse_id` → `warehouses.id`

### to_header

**Referenced by**:

- `to_line.to_id` → `to_header.id`

