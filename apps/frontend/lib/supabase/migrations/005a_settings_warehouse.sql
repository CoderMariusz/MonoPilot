-- Migration 005a: Warehouse Settings Table
-- Purpose: Warehouse-specific settings including default locations for PO and TO receiving
-- Date: 2025-01-11
-- Dependencies: 003_warehouses, 004_locations

CREATE TABLE settings_warehouse (
  id SERIAL PRIMARY KEY,
  warehouse_id INTEGER UNIQUE NOT NULL REFERENCES warehouses(id),
  default_receiving_location_id INTEGER REFERENCES locations(id),
  default_shipping_location_id INTEGER REFERENCES locations(id),
  allow_negative_stock BOOLEAN DEFAULT false,
  auto_assign_location BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_settings_warehouse_warehouse ON settings_warehouse(warehouse_id);
CREATE INDEX idx_settings_warehouse_receiving_loc ON settings_warehouse(default_receiving_location_id);

-- Comments
COMMENT ON TABLE settings_warehouse IS 'Warehouse-specific settings including default locations for receiving and shipping';
COMMENT ON COLUMN settings_warehouse.default_receiving_location_id IS 'Default location where goods are received (for PO and TO receiving). When operator scans LP during TO receiving, it goes here first';
COMMENT ON COLUMN settings_warehouse.default_shipping_location_id IS 'Default location for staging goods before shipping';
COMMENT ON COLUMN settings_warehouse.allow_negative_stock IS 'Allow negative stock levels in this warehouse';
COMMENT ON COLUMN settings_warehouse.auto_assign_location IS 'Automatically assign products to default location when received';

