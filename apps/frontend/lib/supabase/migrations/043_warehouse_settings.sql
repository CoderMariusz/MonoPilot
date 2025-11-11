-- Migration 043: Warehouse Settings Table
-- Purpose: Default locations for TO and PO receiving per warehouse
-- Date: 2025-01-11
-- Dependencies: 003_warehouses, 004_locations

CREATE TABLE warehouse_settings (
  id SERIAL PRIMARY KEY,
  warehouse_id INTEGER NOT NULL REFERENCES warehouses(id) UNIQUE,
  default_to_receive_location_id INTEGER REFERENCES locations(id),
  default_po_receive_location_id INTEGER REFERENCES locations(id),
  default_transit_location_id INTEGER REFERENCES locations(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_warehouse_settings_warehouse ON warehouse_settings(warehouse_id);

-- Enable RLS
ALTER TABLE warehouse_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "authenticated_users_all" ON warehouse_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_warehouse_settings_updated_at BEFORE UPDATE ON warehouse_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE warehouse_settings IS 'Warehouse-specific settings for default receiving locations';
COMMENT ON COLUMN warehouse_settings.default_to_receive_location_id IS 'Default location for receiving Transfer Orders in this warehouse';
COMMENT ON COLUMN warehouse_settings.default_po_receive_location_id IS 'Default location for receiving Purchase Orders in this warehouse';
COMMENT ON COLUMN warehouse_settings.default_transit_location_id IS 'Transit/staging location for goods in transfer (optional virtual location)';

