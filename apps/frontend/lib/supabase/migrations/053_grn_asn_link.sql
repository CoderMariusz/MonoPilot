-- Migration: 053_grn_asn_link.sql
-- Description: Add ASN reference to GRNs for ASN receiving workflow
-- Epic: EPIC-002 Scanner & Warehouse v2 - Phase 1
-- Created: 2025-01-12

-- ============================================================================
-- ALTER TABLE: grns
-- Add ASN foreign key to link GRN to source ASN
-- ============================================================================

ALTER TABLE grns
  ADD COLUMN IF NOT EXISTS asn_id INTEGER REFERENCES asns(id);

-- Add index for ASN lookups
CREATE INDEX IF NOT EXISTS idx_grns_asn ON grns(asn_id) WHERE asn_id IS NOT NULL;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN grns.asn_id IS 
'Optional link to Advanced Shipping Notice if this GRN was created from an ASN.
Used to track which ASN was received and to prefill GRN items with ASN data.';

-- ============================================================================
-- RPC FUNCTION: create_grn_from_asn
-- Purpose: Create GRN with prefilled items from ASN
-- ============================================================================

CREATE OR REPLACE FUNCTION create_grn_from_asn(
  p_asn_id INTEGER,
  p_received_by INTEGER,
  p_notes TEXT DEFAULT NULL
)
RETURNS TABLE (
  grn_id INTEGER,
  grn_number VARCHAR,
  items_created INTEGER
) AS $$
DECLARE
  v_grn_id INTEGER;
  v_grn_number VARCHAR(50);
  v_po_id INTEGER;
  v_supplier_id INTEGER;
  v_items_count INTEGER := 0;
BEGIN
  -- Get ASN details
  SELECT po_id, supplier_id 
  INTO v_po_id, v_supplier_id
  FROM asns
  WHERE id = p_asn_id AND status = 'submitted';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ASN % not found or not in submitted status', p_asn_id;
  END IF;

  -- Generate GRN number (GRN-YYYY-NNN format)
  SELECT 'GRN-' || TO_CHAR(NOW(), 'YYYY') || '-' || 
         LPAD((COUNT(*) + 1)::TEXT, 3, '0')
  INTO v_grn_number
  FROM grns
  WHERE grn_number LIKE 'GRN-' || TO_CHAR(NOW(), 'YYYY') || '-%';

  -- Create GRN header
  INSERT INTO grns (
    grn_number,
    po_id,
    asn_id,
    supplier_id,
    status,
    received_date,
    received_by,
    notes
  ) VALUES (
    v_grn_number,
    v_po_id,
    p_asn_id,
    v_supplier_id,
    'draft',
    NOW(),
    p_received_by,
    COALESCE(p_notes, 'Received from ASN')
  )
  RETURNING id INTO v_grn_id;

  -- Create GRN items from ASN items
  INSERT INTO grn_items (
    grn_id,
    product_id,
    quantity_received,
    uom,
    batch,
    expiry_date,
    notes
  )
  SELECT
    v_grn_id,
    ai.product_id,
    ai.quantity, -- Start with expected quantity
    ai.uom,
    ai.batch,
    ai.expiry_date,
    ai.notes
  FROM asn_items ai
  WHERE ai.asn_id = p_asn_id;

  GET DIAGNOSTICS v_items_count = ROW_COUNT;

  -- Mark ASN as received
  UPDATE asns
  SET 
    status = 'received',
    actual_arrival = NOW()
  WHERE id = p_asn_id;

  RETURN QUERY
  SELECT v_grn_id, v_grn_number, v_items_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_grn_from_asn IS 
'Creates a GRN from an ASN with prefilled items.
Copies ASN items to GRN items with batch/expiry data.
Marks ASN as received.
Returns created GRN ID, number, and items count.';

-- ============================================================================
-- EXAMPLE USAGE
-- ============================================================================

/*
-- Example: Create GRN from ASN
SELECT * FROM create_grn_from_asn(
  p_asn_id := 1,
  p_received_by := 123,
  p_notes := 'Received all items in good condition'
);

-- Result:
-- grn_id | grn_number    | items_created
-- -------|---------------|---------------
--     5  | GRN-2025-001  |             3

-- After this:
-- - GRN created with status 'draft'
-- - 3 GRN items created (prefilled from ASN items)
-- - ASN status changed to 'received'
*/

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

