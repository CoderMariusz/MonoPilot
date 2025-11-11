-- Migration 019: Transfer Order Header Table
-- Purpose: Transfer orders between warehouses (warehouse-to-warehouse, NOT location-to-location)
-- Date: 2025-01-11
-- Dependencies: 001_users, 003_warehouses

CREATE TABLE to_header (
  id SERIAL PRIMARY KEY,
  number VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'submitted', 'in_transit', 'received', 'closed', 'cancelled')),
  from_wh_id INTEGER REFERENCES warehouses(id),
  to_wh_id INTEGER REFERENCES warehouses(id),
  requested_date TIMESTAMPTZ,
  planned_ship_date TIMESTAMPTZ,
  actual_ship_date TIMESTAMPTZ,
  planned_receive_date TIMESTAMPTZ,
  actual_receive_date TIMESTAMPTZ,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_to_header_number ON to_header(number);
CREATE INDEX idx_to_header_status ON to_header(status);
CREATE INDEX idx_to_header_from_wh ON to_header(from_wh_id);
CREATE INDEX idx_to_header_to_wh ON to_header(to_wh_id);

-- Comments
COMMENT ON TABLE to_header IS 'Transfer orders for moving inventory between warehouses (warehouse-to-warehouse transport, NOT location-to-location)';
COMMENT ON COLUMN to_header.from_wh_id IS 'Source warehouse - products shipped FROM here';
COMMENT ON COLUMN to_header.to_wh_id IS 'Destination warehouse - products shipped TO here';
COMMENT ON COLUMN to_header.status IS 'draft: created, submitted: approved for shipping, in_transit: shipped (products in transit/virtual location), received: arrived at destination, closed: completed, cancelled: cancelled';
COMMENT ON COLUMN to_header.planned_ship_date IS 'Planned date for shipping goods from source warehouse';
COMMENT ON COLUMN to_header.actual_ship_date IS 'Actual date when goods were shipped - products move to TRANSIT status';
COMMENT ON COLUMN to_header.planned_receive_date IS 'Planned date for receiving goods at destination warehouse';
COMMENT ON COLUMN to_header.actual_receive_date IS 'Actual date when goods were received - products move to default receiving location in destination warehouse';

