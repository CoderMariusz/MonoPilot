-- Migration 038: Drop All Tables - Database Reset
-- Purpose: Complete cleanup before rebuilding schema with new fields
-- Date: 2025-01-21
-- WARNING: This migration drops EVERYTHING

-- =============================================
-- 1. DROP FOREIGN KEY CONSTRAINTS (manual cleanup)
-- =============================================
-- Note: Foreign keys are automatically dropped with tables,
-- but we explicitly drop them first for clarity in logs

-- =============================================
-- 2. DROP TRIGGERS AND FUNCTIONS
-- =============================================

-- Drop triggers first (they depend on functions)
DROP TRIGGER IF EXISTS trigger_pallets_updated_at ON pallets CASCADE;
DROP TRIGGER IF EXISTS trigger_bom_snapshot_on_wo_creation ON work_orders CASCADE;

-- Drop custom functions
DROP FUNCTION IF EXISTS update_pallets_updated_at() CASCADE;
DROP FUNCTION IF EXISTS generate_pallet_number() CASCADE;
DROP FUNCTION IF EXISTS get_pallet_summary(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS trace_lp_composition(INTEGER, TEXT) CASCADE;
DROP FUNCTION IF EXISTS generate_po_number() CASCADE;
DROP FUNCTION IF EXISTS generate_to_number() CASCADE;
DROP FUNCTION IF EXISTS update_po_totals(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS cancel_purchase_order(INTEGER, TEXT) CASCADE;
DROP FUNCTION IF EXISTS cancel_transfer_order(INTEGER, TEXT) CASCADE;
DROP FUNCTION IF EXISTS cancel_work_order(INTEGER, TEXT) CASCADE;
DROP FUNCTION IF EXISTS snapshot_bom_on_wo_creation() CASCADE;

-- =============================================
-- 3. DROP TABLES (in dependency order)
-- =============================================

-- Drop junction/child tables first
DROP TABLE IF EXISTS pallet_items CASCADE;
DROP TABLE IF EXISTS lp_compositions CASCADE;
DROP TABLE IF EXISTS lp_genealogy CASCADE;
DROP TABLE IF EXISTS lp_reservations CASCADE;
DROP TABLE IF EXISTS product_allergens CASCADE;
DROP TABLE IF EXISTS supplier_products CASCADE;
DROP TABLE IF EXISTS po_correction CASCADE;
DROP TABLE IF EXISTS po_line CASCADE;
DROP TABLE IF EXISTS to_line CASCADE;
DROP TABLE IF EXISTS asn_items CASCADE;
DROP TABLE IF EXISTS grn_items CASCADE;
DROP TABLE IF EXISTS purchase_order_items CASCADE;
DROP TABLE IF EXISTS transfer_order_items CASCADE;
DROP TABLE IF EXISTS wo_materials CASCADE;
DROP TABLE IF EXISTS wo_operations CASCADE;
DROP TABLE IF EXISTS routing_operations CASCADE;

-- Drop parent tables
DROP TABLE IF EXISTS pallets CASCADE;
DROP TABLE IF EXISTS license_plates CASCADE;
DROP TABLE IF EXISTS production_outputs CASCADE;
DROP TABLE IF EXISTS work_orders CASCADE;
DROP TABLE IF EXISTS bom_items CASCADE;
DROP TABLE IF EXISTS boms CASCADE;
DROP TABLE IF EXISTS routings CASCADE;
DROP TABLE IF EXISTS machines CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS stock_moves CASCADE;
DROP TABLE IF EXISTS asns CASCADE;
DROP TABLE IF EXISTS grns CASCADE;
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS audit_events CASCADE;
DROP TABLE IF EXISTS po_header CASCADE;
DROP TABLE IF EXISTS to_header CASCADE;
DROP TABLE IF EXISTS purchase_orders CASCADE;
DROP TABLE IF EXISTS transfer_orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS warehouses CASCADE;
DROP TABLE IF EXISTS settings_tax_codes CASCADE;
DROP TABLE IF EXISTS tax_codes CASCADE;
DROP TABLE IF EXISTS allergens CASCADE;

-- Keep users table for now (it references auth.users)
-- We'll drop it last if needed
-- DROP TABLE IF EXISTS users CASCADE;

-- =============================================
-- 4. DROP ENUMS AND CUSTOM TYPES
-- =============================================

DROP TYPE IF EXISTS bom_status CASCADE;
DROP TYPE IF EXISTS product_group CASCADE;
DROP TYPE IF EXISTS product_type CASCADE;

-- =============================================
-- 5. DROP SEQUENCES (if any remain)
-- =============================================
-- Sequences are typically dropped with tables, but we clean up explicitly

DROP SEQUENCE IF EXISTS products_id_seq CASCADE;
DROP SEQUENCE IF EXISTS boms_id_seq CASCADE;
DROP SEQUENCE IF EXISTS bom_items_id_seq CASCADE;
DROP SEQUENCE IF EXISTS work_orders_id_seq CASCADE;
DROP SEQUENCE IF EXISTS wo_materials_id_seq CASCADE;
DROP SEQUENCE IF EXISTS wo_operations_id_seq CASCADE;
DROP SEQUENCE IF EXISTS production_outputs_id_seq CASCADE;
DROP SEQUENCE IF EXISTS license_plates_id_seq CASCADE;
DROP SEQUENCE IF EXISTS lp_reservations_id_seq CASCADE;
DROP SEQUENCE IF EXISTS lp_compositions_id_seq CASCADE;
DROP SEQUENCE IF EXISTS lp_genealogy_id_seq CASCADE;
DROP SEQUENCE IF EXISTS pallets_id_seq CASCADE;
DROP SEQUENCE IF EXISTS pallet_items_id_seq CASCADE;
DROP SEQUENCE IF EXISTS suppliers_id_seq CASCADE;
DROP SEQUENCE IF EXISTS warehouses_id_seq CASCADE;
DROP SEQUENCE IF EXISTS locations_id_seq CASCADE;
DROP SEQUENCE IF EXISTS machines_id_seq CASCADE;
DROP SEQUENCE IF EXISTS settings_tax_codes_id_seq CASCADE;
DROP SEQUENCE IF EXISTS tax_codes_id_seq CASCADE;
DROP SEQUENCE IF EXISTS allergens_id_seq CASCADE;
DROP SEQUENCE IF EXISTS product_allergens_id_seq CASCADE;
DROP SEQUENCE IF EXISTS supplier_products_id_seq CASCADE;
DROP SEQUENCE IF EXISTS routings_id_seq CASCADE;
DROP SEQUENCE IF EXISTS routing_operations_id_seq CASCADE;
DROP SEQUENCE IF EXISTS po_header_id_seq CASCADE;
DROP SEQUENCE IF EXISTS po_line_id_seq CASCADE;
DROP SEQUENCE IF EXISTS po_correction_id_seq CASCADE;
DROP SEQUENCE IF EXISTS to_header_id_seq CASCADE;
DROP SEQUENCE IF EXISTS to_line_id_seq CASCADE;
DROP SEQUENCE IF EXISTS purchase_orders_id_seq CASCADE;
DROP SEQUENCE IF EXISTS purchase_order_items_id_seq CASCADE;
DROP SEQUENCE IF EXISTS transfer_orders_id_seq CASCADE;
DROP SEQUENCE IF EXISTS transfer_order_items_id_seq CASCADE;
DROP SEQUENCE IF EXISTS grns_id_seq CASCADE;
DROP SEQUENCE IF EXISTS grn_items_id_seq CASCADE;
DROP SEQUENCE IF EXISTS asns_id_seq CASCADE;
DROP SEQUENCE IF EXISTS asn_items_id_seq CASCADE;
DROP SEQUENCE IF EXISTS stock_moves_id_seq CASCADE;
DROP SEQUENCE IF EXISTS audit_events_id_seq CASCADE;
DROP SEQUENCE IF EXISTS audit_log_id_seq CASCADE;

-- =============================================
-- 6. VERIFICATION
-- =============================================
-- After this migration, only system tables and users table should remain
-- All application tables should be dropped
