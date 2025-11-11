-- Migration 025: License Plates Table
-- Purpose: Warehouse inventory units with traceability
-- Date: 2025-01-11
-- Dependencies: 004_locations, 009_products, 021_work_orders

CREATE TABLE license_plates (
  id SERIAL PRIMARY KEY,
  lp_number VARCHAR(50) UNIQUE NOT NULL,
  product_id INTEGER REFERENCES products(id),
  quantity NUMERIC(12,4) NOT NULL,
  uom VARCHAR(20) NOT NULL CHECK (uom IN ('KG', 'EACH', 'METER', 'LITER')),
  location_id INTEGER REFERENCES locations(id),
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'consumed', 'in_transit', 'quarantine', 'damaged')),
  qa_status VARCHAR(20) DEFAULT 'pending' CHECK (qa_status IN ('pending', 'passed', 'failed', 'on_hold')),
  stage_suffix VARCHAR(10) CHECK (stage_suffix IS NULL OR stage_suffix ~ '^[A-Z]{2}$'),
  batch_number VARCHAR(100),
  lp_type VARCHAR(20) CHECK (lp_type IN ('PR', 'FG', 'PALLET')),
  
  -- Traceability
  consumed_by_wo_id INTEGER REFERENCES work_orders(id),
  consumed_at TIMESTAMPTZ,
  parent_lp_id INTEGER REFERENCES license_plates(id),
  parent_lp_number VARCHAR(50),
  origin_type VARCHAR(50),
  origin_ref JSONB,
  
  -- Metadata
  created_by VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_license_plates_number ON license_plates(lp_number);
CREATE INDEX idx_license_plates_product ON license_plates(product_id);
CREATE INDEX idx_license_plates_location ON license_plates(location_id);
CREATE INDEX idx_license_plates_status ON license_plates(status);
CREATE INDEX idx_license_plates_qa_status ON license_plates(qa_status);
CREATE INDEX idx_license_plates_parent_lp ON license_plates(parent_lp_id);
CREATE INDEX idx_license_plates_consumed_by_wo ON license_plates(consumed_by_wo_id);
CREATE INDEX idx_license_plates_lp_type ON license_plates(lp_type);

-- Comments
COMMENT ON TABLE license_plates IS 'Warehouse inventory units with full traceability and genealogy';
COMMENT ON COLUMN license_plates.status IS 'LP status: available (in stock), reserved (allocated to WO), consumed (used in production), in_transit (being transferred between warehouses), quarantine (QA hold), damaged';
COMMENT ON COLUMN license_plates.qa_status IS 'QA status: pending (awaiting inspection), passed (approved), failed (rejected), on_hold (inspection paused)';
COMMENT ON COLUMN license_plates.location_id IS 'Physical location in warehouse. NULL when status=in_transit (virtual transit location)';
COMMENT ON COLUMN license_plates.lp_type IS 'LP type: PR (Process), FG (Finished Good/Box), PALLET';
COMMENT ON COLUMN license_plates.stage_suffix IS 'Two-letter stage identifier for process LPs';

