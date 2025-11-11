-- Migration 026: LP Reservations Table
-- Purpose: Reserve license plates for work orders
-- Date: 2025-01-11
-- Dependencies: 021_work_orders, 025_license_plates

CREATE TABLE lp_reservations (
  id SERIAL PRIMARY KEY,
  lp_id INTEGER NOT NULL REFERENCES license_plates(id),
  wo_id INTEGER NOT NULL REFERENCES work_orders(id),
  qty NUMERIC(12,4) NOT NULL CHECK (qty > 0),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'consumed', 'expired', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_by VARCHAR(50)
);

-- Indexes
CREATE INDEX idx_lp_reservations_lp ON lp_reservations(lp_id);
CREATE INDEX idx_lp_reservations_wo ON lp_reservations(wo_id);
CREATE INDEX idx_lp_reservations_status ON lp_reservations(status);

-- Comments
COMMENT ON TABLE lp_reservations IS 'Reserve license plates for specific work orders';

