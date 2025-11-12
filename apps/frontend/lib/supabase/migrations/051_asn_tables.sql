-- Migration: 051_asn_tables.sql
-- Description: Create ASN (Advanced Shipping Notice) tables for receiving workflow
-- Epic: EPIC-002 Scanner & Warehouse v2 - Phase 1
-- Created: 2025-01-12

-- ============================================================================
-- TABLE: asns (Advanced Shipping Notices)
-- Purpose: Pre-notification of incoming shipments from suppliers
-- ============================================================================

CREATE TABLE IF NOT EXISTS asns (
  id SERIAL PRIMARY KEY,
  asn_number VARCHAR(50) UNIQUE NOT NULL,
  po_id INTEGER REFERENCES purchase_orders(id),
  supplier_id INTEGER REFERENCES suppliers(id) NOT NULL,
  expected_arrival TIMESTAMPTZ NOT NULL,
  actual_arrival TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'submitted', 'received', 'cancelled')),
  notes TEXT,
  attachments JSONB, -- Array of file URLs/metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- ============================================================================
-- TABLE: asn_items (ASN Line Items)
-- Purpose: Individual products expected in the shipment
-- ============================================================================

CREATE TABLE IF NOT EXISTS asn_items (
  id SERIAL PRIMARY KEY,
  asn_id INTEGER REFERENCES asns(id) ON DELETE CASCADE NOT NULL,
  product_id INTEGER REFERENCES products(id) NOT NULL,
  quantity NUMERIC(10,4) NOT NULL CHECK (quantity > 0),
  uom VARCHAR(20) NOT NULL,
  batch VARCHAR(50), -- Pre-assigned batch from supplier
  expiry_date DATE, -- Pre-assigned expiry from supplier
  lp_number VARCHAR(50), -- Pre-assigned LP number from supplier (optional)
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- B-tree indexes for common queries
CREATE INDEX IF NOT EXISTS idx_asns_asn_number ON asns(asn_number);
CREATE INDEX IF NOT EXISTS idx_asns_po_id ON asns(po_id) WHERE po_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_asns_supplier_id ON asns(supplier_id);
CREATE INDEX IF NOT EXISTS idx_asns_status ON asns(status);
CREATE INDEX IF NOT EXISTS idx_asns_expected_arrival ON asns(expected_arrival);

-- Composite index for warehouse dashboard queries
CREATE INDEX IF NOT EXISTS idx_asns_status_expected ON asns(status, expected_arrival);

-- ASN items indexes
CREATE INDEX IF NOT EXISTS idx_asn_items_asn_id ON asn_items(asn_id);
CREATE INDEX IF NOT EXISTS idx_asn_items_product_id ON asn_items(product_id);
CREATE INDEX IF NOT EXISTS idx_asn_items_batch ON asn_items(batch) WHERE batch IS NOT NULL;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE asns ENABLE ROW LEVEL SECURITY;
ALTER TABLE asn_items ENABLE ROW LEVEL SECURITY;

-- Policy: Allow full access to authenticated users
CREATE POLICY "Allow full access to asns for authenticated users"
ON asns TO authenticated
USING (TRUE)
WITH CHECK (TRUE);

CREATE POLICY "Allow full access to asn_items for authenticated users"
ON asn_items TO authenticated
USING (TRUE)
WITH CHECK (TRUE);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Note: Updated_at trigger can be added if moddatetime extension is enabled
-- CREATE TRIGGER handle_updated_at BEFORE UPDATE ON asns
-- FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE asns IS 
'Advanced Shipping Notices - Pre-notifications of incoming shipments from suppliers.
Used to prefill receiving (GRN) with expected quantities, batches, and expiry dates.';

COMMENT ON COLUMN asns.asn_number IS 'Unique ASN identifier, often from supplier EDI/system';
COMMENT ON COLUMN asns.po_id IS 'Optional link to Purchase Order if ASN is for a PO shipment';
COMMENT ON COLUMN asns.expected_arrival IS 'Expected arrival date/time at warehouse dock';
COMMENT ON COLUMN asns.actual_arrival IS 'Actual arrival date/time (set when truck arrives)';
COMMENT ON COLUMN asns.attachments IS 'Array of attachment metadata: [{"name": "packing_list.pdf", "url": "..."}]';

COMMENT ON TABLE asn_items IS 
'Line items in an ASN - individual products expected in the shipment.
May include pre-assigned batch numbers and expiry dates from supplier.';

COMMENT ON COLUMN asn_items.batch IS 'Supplier batch/lot number (if provided in advance)';
COMMENT ON COLUMN asn_items.expiry_date IS 'Product expiry date (if provided in advance)';
COMMENT ON COLUMN asn_items.lp_number IS 'Pre-assigned license plate number from supplier (rare, but supported)';

-- ============================================================================
-- RPC FUNCTION: get_asns_for_receiving
-- Purpose: Get ASNs ready for receiving (submitted status, not yet received)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_asns_for_receiving()
RETURNS TABLE (
  asn_id INTEGER,
  asn_number VARCHAR,
  supplier_name VARCHAR,
  expected_arrival TIMESTAMPTZ,
  items_count INTEGER,
  total_quantity NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id AS asn_id,
    a.asn_number,
    s.name AS supplier_name,
    a.expected_arrival,
    COUNT(ai.id)::INTEGER AS items_count,
    SUM(ai.quantity) AS total_quantity
  FROM asns a
  INNER JOIN suppliers s ON a.supplier_id = s.id
  LEFT JOIN asn_items ai ON a.id = ai.asn_id
  WHERE a.status = 'submitted'
  GROUP BY a.id, a.asn_number, s.name, a.expected_arrival
  ORDER BY a.expected_arrival ASC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_asns_for_receiving IS 
'Returns list of ASNs ready for receiving (submitted status).
Used by warehouse operators to see incoming shipments.';

-- ============================================================================
-- EXAMPLE DATA
-- ============================================================================

/*
Example 1: Create ASN for incoming PO
INSERT INTO asns (asn_number, po_id, supplier_id, expected_arrival, status)
VALUES ('ASN-2025-001', 1, 1, '2025-01-15 10:00:00+00', 'submitted');

INSERT INTO asn_items (asn_id, product_id, quantity, uom, batch, expiry_date)
VALUES 
  (1, 101, 1000, 'kg', 'BATCH-2025-A', '2025-12-31'),
  (1, 102, 500, 'kg', 'BATCH-2025-B', '2025-11-30');

Example 2: Create ASN without PO (spot purchase)
INSERT INTO asns (asn_number, supplier_id, expected_arrival, status, notes)
VALUES ('ASN-2025-002', 2, '2025-01-16 14:00:00+00', 'submitted', 'Urgent delivery');

Example 3: Query ASNs ready for receiving
SELECT * FROM get_asns_for_receiving();

Example 4: Link ASN to GRN
-- When receiving ASN-2025-001, create GRN:
INSERT INTO grns (grn_number, po_id, status, received_date)
VALUES ('GRN-2025-001', 1, 'completed', NOW());

-- Create LPs from ASN items with pre-filled batch/expiry:
INSERT INTO license_plates (lp_number, product_id, location_id, quantity, qa_status, batch, expiry_date, grn_id)
SELECT 
  generate_lp_number(),
  ai.product_id,
  get_default_receiving_location(),
  ai.quantity,
  'Pending',
  ai.batch,
  ai.expiry_date,
  1
FROM asn_items ai
WHERE ai.asn_id = 1;

-- Update ASN status
UPDATE asns SET status = 'received', actual_arrival = NOW() WHERE id = 1;
*/

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

