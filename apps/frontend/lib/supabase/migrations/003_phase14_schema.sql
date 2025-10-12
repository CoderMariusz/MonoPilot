-- Phase 14: Schema Updates for Business Rules Implementation
-- This migration adds warehouses, suppliers, production_outputs tables
-- and updates existing tables with new columns

-- Warehouses table
CREATE TABLE IF NOT EXISTS warehouses (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update locations to reference warehouses
ALTER TABLE IF EXISTS locations
  ADD COLUMN IF NOT EXISTS warehouse_id INTEGER REFERENCES warehouses(id);

-- Suppliers table (expand if not exists)
CREATE TABLE IF NOT EXISTS suppliers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  legal_name VARCHAR(200),
  vat_number VARCHAR(50),
  country VARCHAR(3),
  currency VARCHAR(3) DEFAULT 'USD',
  payment_terms VARCHAR(100),
  incoterms VARCHAR(50),
  email VARCHAR(200),
  phone VARCHAR(50),
  address JSONB,
  default_tax_code_id INTEGER,
  lead_time_days INTEGER,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add unit_cost_std to bom_items
ALTER TABLE IF EXISTS bom_items
  ADD COLUMN IF NOT EXISTS unit_cost_std NUMERIC(12, 4);

-- Production outputs table (for WO progress tracking)
CREATE TABLE IF NOT EXISTS production_outputs (
  id SERIAL PRIMARY KEY,
  wo_id INTEGER NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity NUMERIC(12, 4) NOT NULL,
  uom VARCHAR(20) NOT NULL,
  lp_id INTEGER,
  created_by INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_production_outputs_wo ON production_outputs(wo_id);

-- Update purchase_orders: add buyer fields and supplier FK
ALTER TABLE IF EXISTS purchase_orders
  ADD COLUMN IF NOT EXISTS buyer_id INTEGER,
  ADD COLUMN IF NOT EXISTS buyer_name VARCHAR(200),
  ADD COLUMN IF NOT EXISTS supplier_id INTEGER REFERENCES suppliers(id);

-- Update transfer_orders: replace locations with warehouses
ALTER TABLE IF EXISTS transfer_orders
  ADD COLUMN IF NOT EXISTS from_warehouse_id INTEGER REFERENCES warehouses(id),
  ADD COLUMN IF NOT EXISTS to_warehouse_id INTEGER REFERENCES warehouses(id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_transfer_orders_warehouses 
  ON transfer_orders(from_warehouse_id, to_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status_date 
  ON work_orders(status, scheduled_start);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_buyer 
  ON purchase_orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_active 
  ON suppliers(is_active);
CREATE INDEX IF NOT EXISTS idx_warehouses_active 
  ON warehouses(is_active);

-- Insert sample data for warehouses
INSERT INTO warehouses (code, name, is_active) VALUES
  ('WH-MAIN', 'Main Warehouse', true),
  ('WH-COLD', 'Cold Storage Warehouse', true),
  ('WH-PROD', 'Production Warehouse', true)
ON CONFLICT (code) DO NOTHING;

-- Insert sample data for suppliers
INSERT INTO suppliers (name, legal_name, vat_number, country, currency, payment_terms, is_active) VALUES
  ('ABC Meats Ltd', 'ABC Meats Limited', 'GB123456789', 'UK', 'GBP', 'Net 30', true),
  ('Fresh Produce Co', 'Fresh Produce Company Inc', 'US987654321', 'USA', 'USD', 'Net 15', true),
  ('Spice Masters', 'Spice Masters Ltd', 'GB987654321', 'UK', 'GBP', 'Net 30', true)
ON CONFLICT DO NOTHING;

-- Update existing locations to reference warehouses
UPDATE locations SET warehouse_id = 1 WHERE warehouse_id IS NULL AND code LIKE 'WH-01%';
UPDATE locations SET warehouse_id = 2 WHERE warehouse_id IS NULL AND code LIKE 'WH-02%';
UPDATE locations SET warehouse_id = 3 WHERE warehouse_id IS NULL AND code LIKE 'WH-03%';
