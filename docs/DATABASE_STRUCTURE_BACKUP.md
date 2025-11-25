# Database Structure Backup

**Generated**: 2025-01-21
**Purpose**: Backup of complete database schema before reset
**Project**: MonoPilot MES System

## Overview

This document contains a complete snapshot of the database schema before the reset operation. It serves as a reference for:
- Column structures
- Data types
- Constraints
- Indexes
- Foreign keys
- Default values
- RLS policies (referenced)

## Tables Inventory

Total Tables: 38

1. allergens
2. asn_items
3. asns
4. audit_events
5. audit_log
6. bom_items
7. boms
8. grn_items
9. grns
10. license_plates
11. locations
12. lp_compositions
13. lp_genealogy
14. lp_reservations
15. machines
16. pallet_items
17. pallets
18. po_correction
19. po_header
20. po_line
21. product_allergens
22. production_outputs
23. products
24. purchase_order_items
25. purchase_orders
26. routing_operations
27. routings
28. settings_tax_codes
29. stock_moves
30. supplier_products
31. suppliers
32. tax_codes
33. to_header
34. to_line
35. transfer_order_items
36. transfer_orders
37. users
38. warehouses
39. wo_materials
40. wo_operations
41. work_orders

## Key Observations

### Missing Fields (to be added in reset)
- `boms.boxes_per_pallet` - INTEGER (capacity per pallet)
- `bom_items.packages_per_box` - NUMERIC (default 1, NOT NULL)
- `license_plates.lp_type` - VARCHAR (PR, FG, PALLET) for filtering
- `pallets.target_boxes` - INTEGER (from BOM)
- `pallets.actual_boxes` - INTEGER (actual count)

### Current Pallet Structure
- `pallets` table exists with: id, wo_id, line, code, created_at, created_by
- `pallet_items` links: pallet_id, box_lp_id, sequence
- **Current issue**: Uses individual box_lp_id references instead of aggregated box_count

### Planning Tables
- Both old (`purchase_orders`, `transfer_orders`) and new (`po_header`, `to_header`) exist
- Migration 034 created new Phase 1 tables
- GRNs reference `po_header.id`

### BOM Structure
- `boms` has lifecycle status (draft, active, archived)
- `bom_items` has many PO prefill fields (tax_code_id, lead_time_days, moq)
- Missing: `packages_per_box` and `boxes_per_pallet`

## Table Definitions

### Core Tables

#### users
- Primary Key: id (UUID)
- Key Fields: name, email, role, status, avatar_url, phone, department
- RLS: Enabled
- Foreign Keys: references auth.users(id)

#### products
- Primary Key: id (SERIAL)
- Key Fields: part_number (UNIQUE), description, type, uom, product_group (ENUM), product_type (ENUM)
- Indexes: part_number, product_group, product_type, is_active
- RLS: Enabled

#### suppliers
- Primary Key: id (SERIAL)
- Key Fields: name, legal_name, vat_number, country, currency, payment_terms, incoterms
- RLS: Enabled

#### warehouses
- Primary Key: id (SERIAL)
- Key Fields: code (UNIQUE), name, is_active
- RLS: Disabled

#### locations
- Primary Key: id (SERIAL)
- Key Fields: warehouse_id (FK), code (UNIQUE), name, type, is_active
- RLS: Disabled

### BOM Tables

#### boms
- Primary Key: id (SERIAL)
- Status: bom_status ENUM (draft, active, archived)
- Unique Constraint: single active BOM per product
- Missing: `boxes_per_pallet` INTEGER

#### bom_items
- Primary Key: id (SERIAL)
- Key Fields: bom_id, material_id, quantity, uom, unit_cost_std, tax_code_id, lead_time_days, moq
- Missing: `packages_per_box` NUMERIC (DEFAULT 1 NOT NULL)

### Planning Tables (Phase 1)

#### po_header
- Primary Key: id (SERIAL)
- Key Fields: number (UNIQUE), supplier_id, status (draft/approved/closed), order_date
- Totals: net_total, vat_total, gross_total
- Snapshots: snapshot_supplier_name, snapshot_supplier_vat, snapshot_supplier_address

#### po_line
- Primary Key: id (SERIAL)
- Key Fields: po_id, line_no, item_id, qty_ordered, qty_received, unit_price, vat_rate
- Unique: (po_id, line_no)

#### to_header
- Primary Key: id (SERIAL)
- Key Fields: number (UNIQUE), status (draft/approved/closed), from_wh_id, to_wh_id

#### to_line
- Primary Key: id (SERIAL)
- Key Fields: to_id, line_no, item_id, qty_planned, qty_moved, from_location_id, to_location_id
- Unique: (to_id, line_no)

### Production Tables

#### work_orders
- Primary Key: id (SERIAL)
- Key Fields: wo_number (UNIQUE), product_id, bom_id, quantity, uom, status, priority
- Scheduling: scheduled_start, scheduled_end, actual_start, actual_end

#### wo_materials
- Primary Key: id (SERIAL)
- Purpose: BOM snapshot for work order
- Key Fields: wo_id, material_id, qty_per_unit, total_qty_needed, uom
- Includes: consume_whole_lp (1:1 rule flag)

#### production_outputs
- Primary Key: id (SERIAL)
- Key Fields: wo_id, product_id, quantity, uom, lp_id
- Purpose: Track production output per WO

#### license_plates
- Primary Key: id (SERIAL)
- Key Fields: lp_number (UNIQUE), product_id, quantity, uom, location_id, status, qa_status
- Traceability: parent_lp_id, parent_lp_number, origin_type, origin_ref (JSONB)
- Missing: `lp_type` VARCHAR (PR/FG/PALLET)

#### pallets
- Primary Key: id (SERIAL)
- Key Fields: wo_id, line, code (UNIQUE)
- Missing: `target_boxes` INTEGER, `actual_boxes` INTEGER

#### pallet_items
- Primary Key: id (SERIAL)
- Current: pallet_id, box_lp_id, sequence
- **Change needed**: Switch from box_lp_id to aggregated box_count + material_snapshot

### Warehouse Tables

#### grns
- Primary Key: id (SERIAL)
- Key Fields: grn_number (UNIQUE), po_id (references po_header.id), supplier_id, status
- Received: received_date, received_by

#### grn_items
- Primary Key: id (SERIAL)
- Key Fields: grn_id, product_id, quantity_ordered, quantity_received, quantity_accepted
- Batch tracking: batch, batch_number, mfg_date, expiry_date

#### stock_moves
- Primary Key: id (SERIAL)
- Key Fields: move_number (UNIQUE), product_id, from_location_id, to_location_id, quantity, uom

### Settings Tables

#### settings_tax_codes
- Primary Key: id (SERIAL)
- Key Fields: code (UNIQUE), name, rate, is_active

#### allergens
- Primary Key: id (SERIAL)
- Key Fields: code (UNIQUE), name, description, icon, is_active

## Foreign Key Relationships

### Products
- `products.preferred_supplier_id` → `suppliers.id`
- `products.tax_code_id` → `settings_tax_codes.id`
- `products.created_by` → `users.id`
- `products.updated_by` → `users.id`

### BOMs
- `boms.product_id` → `products.id`
- `boms.default_routing_id` → `routings.id`
- `bom_items.bom_id` → `boms.id`
- `bom_items.material_id` → `products.id`
- `bom_items.tax_code_id` → `settings_tax_codes.id`

### Planning
- `po_header.supplier_id` → `suppliers.id`
- `po_header.created_by` → `users.id`
- `po_header.approved_by` → `users.id`
- `po_line.po_id` → `po_header.id`
- `po_line.item_id` → `products.id`
- `po_line.default_location_id` → `locations.id`
- `to_header.from_wh_id` → `warehouses.id`
- `to_header.to_wh_id` → `warehouses.id`
- `to_line.to_id` → `to_header.id`
- `to_line.item_id` → `products.id`
- `to_line.from_location_id` → `locations.id`
- `to_line.to_location_id` → `locations.id`

### Production
- `work_orders.product_id` → `products.id`
- `work_orders.bom_id` → `boms.id`
- `wo_materials.wo_id` → `work_orders.id`
- `wo_materials.material_id` → `products.id`
- `production_outputs.wo_id` → `work_orders.id`
- `production_outputs.product_id` → `products.id`
- `license_plates.product_id` → `products.id`
- `license_plates.location_id` → `locations.id`
- `license_plates.parent_lp_id` → `license_plates.id`
- `pallets.wo_id` → `work_orders.id`
- `pallet_items.pallet_id` → `pallets.id`
- `pallet_items.box_lp_id` → `license_plates.id`

### Warehouse
- `grns.po_id` → `po_header.id` (Phase 1 migration)
- `grns.supplier_id` → `suppliers.id`
- `grn_items.grn_id` → `grns.id`
- `grn_items.product_id` → `products.id`
- `stock_moves.product_id` → `products.id`
- `stock_moves.from_location_id` → `locations.id`
- `stock_moves.to_location_id` → `locations.id`

## Indexes

Key indexes exist on:
- All primary keys (automatic)
- Unique constraints (automatic)
- Foreign keys (where performance-critical)
- Status fields (work_orders.status, po_header.status, etc.)
- Composite indexes (boms.product_id + status, etc.)

## Enums

### product_group
- Values: MEAT, DRYGOODS, COMPOSITE

### product_type
- Values: RM_MEAT, PR, FG, DG_WEB, DG_LABEL, DG_BOX, DG_ING, DG_SAUCE

### bom_status
- Values: draft, active, archived

## RLS Status

- Enabled: users, products, boms, bom_items, work_orders, wo_materials, suppliers, po_header, po_line, po_correction, to_header, to_line, audit_log, license_plates, lp_reservations, lp_compositions, pallets, pallet_items
- Disabled: warehouses, locations, settings_tax_codes, allergens, supplier_products, routings, routing_operations, wo_operations, machines, production_outputs, stock_moves

## Migration Notes

### Changes Required in Reset

1. **BOM Tables**
   - Add `boms.boxes_per_pallet INTEGER`
   - Add `bom_items.packages_per_box NUMERIC DEFAULT 1 NOT NULL`

2. **License Plates**
   - Add `license_plates.lp_type VARCHAR(20)` with CHECK constraint (PR, FG, PALLET)

3. **Pallets**
   - Add `pallets.target_boxes INTEGER` (from BOM)
   - Add `pallets.actual_boxes INTEGER` (actual count)
   - Modify `pallet_items`:
     - Remove `box_lp_id` (individual LP reference)
     - Add `box_count NUMERIC` (aggregated count)
     - Add `material_snapshot JSONB` (BOM snapshot data)

4. **Remove Old Planning Tables**
   - Drop `purchase_orders` (replaced by `po_header`)
   - Drop `purchase_order_items` (replaced by `po_line`)
   - Drop `transfer_orders` (replaced by `to_header`)
   - Drop `transfer_order_items` (replaced by `to_line`)
   - Keep `audit_events`? (or merge into `audit_log`)

## Next Steps

After reset:
1. Recreate all tables with new fields
2. Restore RLS policies
3. Restore functions/triggers
4. Update frontend types/interfaces
5. Test new BOM/pallet structure
