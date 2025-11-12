-- Migration: 052_license_plates_enhance.sql
-- Description: Enhance license_plates table with batch, expiry, uom, genealogy support
-- Epic: EPIC-002 Scanner & Warehouse v2 - Phase 1
-- Created: 2025-01-12

-- ============================================================================
-- ALTER TABLE: license_plates
-- Add fields for batch tracking, expiry, and genealogy
-- ============================================================================

-- Add batch/lot tracking
ALTER TABLE license_plates 
  ADD COLUMN IF NOT EXISTS batch VARCHAR(50);

-- Add expiry date tracking
ALTER TABLE license_plates 
  ADD COLUMN IF NOT EXISTS expiry_date DATE;

-- Add unit of measure
ALTER TABLE license_plates 
  ADD COLUMN IF NOT EXISTS uom VARCHAR(20) NOT NULL DEFAULT 'kg';

-- Add parent LP for split/merge genealogy
ALTER TABLE license_plates 
  ADD COLUMN IF NOT EXISTS parent_lp_id INTEGER REFERENCES license_plates(id);

-- Add consumption tracking
ALTER TABLE license_plates 
  ADD COLUMN IF NOT EXISTS is_consumed BOOLEAN DEFAULT FALSE;

ALTER TABLE license_plates 
  ADD COLUMN IF NOT EXISTS consumed_at TIMESTAMPTZ;

ALTER TABLE license_plates 
  ADD COLUMN IF NOT EXISTS consumed_by UUID REFERENCES users(id);

-- Add ASN reference (optional - if LP created from ASN)
ALTER TABLE license_plates 
  ADD COLUMN IF NOT EXISTS asn_id INTEGER REFERENCES asns(id);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Batch/lot traceability
CREATE INDEX IF NOT EXISTS idx_license_plates_batch 
  ON license_plates(batch) 
  WHERE batch IS NOT NULL;

-- Expiry date tracking (for FIFO/FEFO)
CREATE INDEX IF NOT EXISTS idx_license_plates_expiry 
  ON license_plates(expiry_date) 
  WHERE expiry_date IS NOT NULL;

-- Genealogy tracking
CREATE INDEX IF NOT EXISTS idx_license_plates_parent 
  ON license_plates(parent_lp_id) 
  WHERE parent_lp_id IS NOT NULL;

-- Consumption tracking
CREATE INDEX IF NOT EXISTS idx_license_plates_consumed 
  ON license_plates(is_consumed, consumed_at) 
  WHERE is_consumed = TRUE;

-- ASN traceability
CREATE INDEX IF NOT EXISTS idx_license_plates_asn 
  ON license_plates(asn_id) 
  WHERE asn_id IS NOT NULL;

-- Composite index for FIFO/FEFO picking
CREATE INDEX IF NOT EXISTS idx_license_plates_fifo 
  ON license_plates(product_id, location_id, expiry_date, created_at) 
  WHERE is_consumed = FALSE AND qa_status = 'Passed';

-- ============================================================================
-- CONSTRAINTS
-- ============================================================================

-- Expiry date must be in the future (when set)
ALTER TABLE license_plates 
  ADD CONSTRAINT check_expiry_future 
  CHECK (expiry_date IS NULL OR expiry_date > CURRENT_DATE);

-- Quantity must be positive for non-consumed LPs
ALTER TABLE license_plates 
  ADD CONSTRAINT check_quantity_positive 
  CHECK (is_consumed = TRUE OR quantity > 0);

-- Consumed LP must have consumed_at and consumed_by
ALTER TABLE license_plates 
  ADD CONSTRAINT check_consumption_complete 
  CHECK (
    (is_consumed = FALSE AND consumed_at IS NULL AND consumed_by IS NULL) OR
    (is_consumed = TRUE AND consumed_at IS NOT NULL AND consumed_by IS NOT NULL)
  );

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON COLUMN license_plates.batch IS 
'Batch or lot number for traceability. 
May come from supplier (ASN) or be assigned at production.
Used for full backward/forward traceability.';

COMMENT ON COLUMN license_plates.expiry_date IS 
'Product expiry date. Used for FEFO (First Expired, First Out) picking.
May come from supplier or be calculated at production.';

COMMENT ON COLUMN license_plates.uom IS 
'Unit of measure for the quantity. Must match product base UOM or be convertible.
Common values: kg, pcs, box, pallet';

COMMENT ON COLUMN license_plates.parent_lp_id IS 
'Parent LP ID if this LP was created by splitting another LP.
Used for genealogy tracking (parent → child relationship).';

COMMENT ON COLUMN license_plates.is_consumed IS 
'TRUE if this LP has been fully consumed in production.
Consumed LPs cannot be moved, split, or used again.';

COMMENT ON COLUMN license_plates.consumed_at IS 
'Timestamp when LP was consumed. Set when is_consumed = TRUE.';

COMMENT ON COLUMN license_plates.consumed_by IS 
'User who consumed this LP. Set when is_consumed = TRUE.';

COMMENT ON COLUMN license_plates.asn_id IS 
'ASN ID if this LP was created from an ASN item.
Used for tracing received goods back to shipping notice.';

-- ============================================================================
-- RPC FUNCTION: get_lp_fifo
-- Purpose: Get next LP for FIFO/FEFO picking
-- ============================================================================

CREATE OR REPLACE FUNCTION get_lp_fifo(
  p_product_id INTEGER,
  p_location_id INTEGER DEFAULT NULL,
  p_required_quantity NUMERIC DEFAULT NULL
)
RETURNS TABLE (
  lp_id INTEGER,
  lp_number VARCHAR,
  quantity NUMERIC,
  uom VARCHAR,
  batch VARCHAR,
  expiry_date DATE,
  created_at TIMESTAMPTZ,
  location_name VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lp.id AS lp_id,
    lp.lp_number,
    lp.quantity,
    lp.uom,
    lp.batch,
    lp.expiry_date,
    lp.created_at,
    l.name AS location_name
  FROM license_plates lp
  INNER JOIN locations l ON lp.location_id = l.id
  WHERE lp.product_id = p_product_id
    AND lp.is_consumed = FALSE
    AND lp.qa_status = 'Passed'
    AND (p_location_id IS NULL OR lp.location_id = p_location_id)
    AND (p_required_quantity IS NULL OR lp.quantity >= p_required_quantity)
  ORDER BY 
    -- FEFO: First Expired First Out
    COALESCE(lp.expiry_date, '9999-12-31'::DATE) ASC,
    -- FIFO: First In First Out (as tiebreaker)
    lp.created_at ASC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_lp_fifo IS 
'Returns license plates for FIFO/FEFO picking.
Orders by expiry_date first (FEFO), then created_at (FIFO).
Filters: Available QA status, not consumed, optional location/quantity filters.';

-- ============================================================================
-- RPC FUNCTION: get_lp_genealogy_chain
-- Purpose: Get full genealogy chain (parent → children)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_lp_genealogy_chain(p_lp_id INTEGER)
RETURNS TABLE (
  lp_id INTEGER,
  lp_number VARCHAR,
  parent_lp_id INTEGER,
  parent_lp_number VARCHAR,
  level INTEGER,
  quantity NUMERIC,
  batch VARCHAR
) AS $$
WITH RECURSIVE 
  -- Get parents (upward)
  parents AS (
    SELECT 
      lp.id AS lp_id,
      lp.lp_number,
      lp.parent_lp_id,
      parent.lp_number AS parent_lp_number,
      0 AS level,
      lp.quantity,
      lp.batch
    FROM license_plates lp
    LEFT JOIN license_plates parent ON lp.parent_lp_id = parent.id
    WHERE lp.id = p_lp_id

    UNION ALL

    SELECT 
      parent.id AS lp_id,
      parent.lp_number,
      parent.parent_lp_id,
      grandparent.lp_number AS parent_lp_number,
      p.level - 1 AS level,
      parent.quantity,
      parent.batch
    FROM license_plates parent
    INNER JOIN parents p ON parent.id = p.parent_lp_id
    LEFT JOIN license_plates grandparent ON parent.parent_lp_id = grandparent.id
  ),
  -- Get children (downward)
  children AS (
    SELECT 
      lp.id AS lp_id,
      lp.lp_number,
      lp.parent_lp_id,
      parent.lp_number AS parent_lp_number,
      0 AS level,
      lp.quantity,
      lp.batch
    FROM license_plates lp
    LEFT JOIN license_plates parent ON lp.parent_lp_id = parent.id
    WHERE lp.id = p_lp_id

    UNION ALL

    SELECT 
      child.id AS lp_id,
      child.lp_number,
      child.parent_lp_id,
      parent_lp.lp_number AS parent_lp_number,
      c.level + 1 AS level,
      child.quantity,
      child.batch
    FROM license_plates child
    INNER JOIN children c ON child.parent_lp_id = c.lp_id
    LEFT JOIN license_plates parent_lp ON child.parent_lp_id = parent_lp.id
  )
SELECT * FROM parents WHERE level < 0
UNION ALL
SELECT * FROM (SELECT * FROM children WHERE level = 0 LIMIT 1) AS base
UNION ALL
SELECT * FROM children WHERE level > 0
ORDER BY level ASC, lp_id ASC;
$$ LANGUAGE sql STABLE;

COMMENT ON FUNCTION get_lp_genealogy_chain IS 
'Returns complete genealogy chain for a license plate.
Level 0 = target LP, negative = parents, positive = children.
Used for traceability: "Where did this LP come from?" and "Where did it go?"';

-- ============================================================================
-- DATA MIGRATION
-- Set default UOM for existing LPs based on product
-- ============================================================================

-- Update existing LPs to have UOM from their product
UPDATE license_plates lp
SET uom = p.uom
FROM products p
WHERE lp.product_id = p.id
  AND lp.uom = 'kg'; -- Only update default value

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

