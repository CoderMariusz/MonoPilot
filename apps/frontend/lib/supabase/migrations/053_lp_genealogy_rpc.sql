-- Migration 053: LP Genealogy RPC Functions
-- Purpose: RPC functions for license plate genealogy and composition tracking
-- Epic: EPIC-002 Scanner & Warehouse v2 - Phase 2: LP Genealogy & Traceability
-- Date: 2025-01-12
-- Dependencies: 027_lp_compositions, 028_lp_genealogy, 052_license_plates_enhance

-- ============================================================================
-- 1. GET LP COMPOSITION TREE (Forward)
-- Purpose: Get forward composition tree (what inputs went into this output)
-- Used by: LicensePlatesAPI.getLPComposition()
-- ============================================================================

CREATE OR REPLACE FUNCTION get_lp_composition_tree(lp_id_param INTEGER)
RETURNS TABLE (
  node_id INTEGER,
  node_type TEXT,
  lp_number VARCHAR,
  product_description TEXT,
  quantity NUMERIC,
  uom VARCHAR,
  qa_status VARCHAR,
  stage_suffix VARCHAR,
  location TEXT,
  parent_node TEXT,
  depth INTEGER,
  composition_qty NUMERIC,
  pallet_code TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE composition_tree AS (
    -- Base case: starting LP
    SELECT
      lp.id AS node_id,
      'lp'::TEXT AS node_type,
      lp.lp_number,
      p.description AS product_description,
      lp.quantity,
      lp.uom,
      lp.qa_status,
      lp.stage_suffix,
      l.name AS location,
      NULL::TEXT AS parent_node,
      0 AS depth,
      lp.quantity AS composition_qty,
      NULL::TEXT AS pallet_code
    FROM license_plates lp
    INNER JOIN products p ON lp.product_id = p.id
    INNER JOIN locations l ON lp.location_id = l.id
    WHERE lp.id = lp_id_param

    UNION ALL

    -- Recursive case: find inputs that went into outputs
    SELECT
      input_lp.id AS node_id,
      'lp'::TEXT AS node_type,
      input_lp.lp_number,
      p.description AS product_description,
      input_lp.quantity,
      input_lp.uom,
      input_lp.qa_status,
      input_lp.stage_suffix,
      l.name AS location,
      ct.lp_number AS parent_node,
      ct.depth + 1 AS depth,
      comp.qty AS composition_qty,
      NULL::TEXT AS pallet_code
    FROM composition_tree ct
    INNER JOIN lp_compositions comp ON comp.output_lp_id = ct.node_id
    INNER JOIN license_plates input_lp ON comp.input_lp_id = input_lp.id
    INNER JOIN products p ON input_lp.product_id = p.id
    INNER JOIN locations l ON input_lp.location_id = l.id
    WHERE ct.depth < 10 -- Prevent infinite loops
  )
  SELECT * FROM composition_tree
  ORDER BY depth ASC, node_id ASC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_lp_composition_tree IS
'Returns forward composition tree for a license plate.
Shows what input LPs were consumed to create this output LP.
Depth 0 = target LP, depth 1+ = inputs (recursively).
Used for traceability: "What raw materials went into this finished good?"';

-- ============================================================================
-- 2. GET LP REVERSE COMPOSITION TREE (Backward)
-- Purpose: Get reverse composition tree (what outputs used this input)
-- Used by: LicensePlatesAPI.getLPComposition()
-- ============================================================================

CREATE OR REPLACE FUNCTION get_lp_reverse_composition_tree(lp_id_param INTEGER)
RETURNS TABLE (
  node_id INTEGER,
  node_type TEXT,
  lp_number VARCHAR,
  product_description TEXT,
  quantity NUMERIC,
  uom VARCHAR,
  qa_status VARCHAR,
  stage_suffix VARCHAR,
  location TEXT,
  parent_node TEXT,
  depth INTEGER,
  composition_qty NUMERIC,
  pallet_code TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE reverse_tree AS (
    -- Base case: starting LP
    SELECT
      lp.id AS node_id,
      'lp'::TEXT AS node_type,
      lp.lp_number,
      p.description AS product_description,
      lp.quantity,
      lp.uom,
      lp.qa_status,
      lp.stage_suffix,
      l.name AS location,
      NULL::TEXT AS parent_node,
      0 AS depth,
      lp.quantity AS composition_qty,
      NULL::TEXT AS pallet_code
    FROM license_plates lp
    INNER JOIN products p ON lp.product_id = p.id
    INNER JOIN locations l ON lp.location_id = l.id
    WHERE lp.id = lp_id_param

    UNION ALL

    -- Recursive case: find outputs that used this input
    SELECT
      output_lp.id AS node_id,
      'lp'::TEXT AS node_type,
      output_lp.lp_number,
      p.description AS product_description,
      output_lp.quantity,
      output_lp.uom,
      output_lp.qa_status,
      output_lp.stage_suffix,
      l.name AS location,
      rt.lp_number AS parent_node,
      rt.depth + 1 AS depth,
      comp.qty AS composition_qty,
      NULL::TEXT AS pallet_code
    FROM reverse_tree rt
    INNER JOIN lp_compositions comp ON comp.input_lp_id = rt.node_id
    INNER JOIN license_plates output_lp ON comp.output_lp_id = output_lp.id
    INNER JOIN products p ON output_lp.product_id = p.id
    INNER JOIN locations l ON output_lp.location_id = l.id
    WHERE rt.depth < 10 -- Prevent infinite loops
  )
  SELECT * FROM reverse_tree
  ORDER BY depth ASC, node_id ASC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_lp_reverse_composition_tree IS
'Returns reverse composition tree for a license plate.
Shows what output LPs used this input LP.
Depth 0 = target LP, depth 1+ = outputs that consumed it (recursively).
Used for traceability: "Where was this raw material used?"';

-- ============================================================================
-- 3. GET LP GENEALOGY TREE (Parent → Children)
-- Purpose: Get genealogy tree (parent-child relationships via splits)
-- Used by: LicensePlatesAPI.getGenealogy()
-- ============================================================================

CREATE OR REPLACE FUNCTION get_lp_genealogy_tree(lp_id_param INTEGER)
RETURNS TABLE (
  lp_id INTEGER,
  lp_number VARCHAR,
  parent_lp_id INTEGER,
  parent_lp_number VARCHAR,
  level INTEGER,
  quantity NUMERIC,
  uom VARCHAR,
  batch VARCHAR,
  expiry_date DATE,
  product_description TEXT,
  location TEXT,
  qa_status VARCHAR,
  is_consumed BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE genealogy_tree AS (
    -- Base case: starting LP
    SELECT
      lp.id AS lp_id,
      lp.lp_number,
      lp.parent_lp_id,
      parent.lp_number AS parent_lp_number,
      0 AS level,
      lp.quantity,
      lp.uom,
      lp.batch,
      lp.expiry_date,
      p.description AS product_description,
      l.name AS location,
      lp.qa_status,
      lp.is_consumed,
      lp.created_at
    FROM license_plates lp
    LEFT JOIN license_plates parent ON lp.parent_lp_id = parent.id
    INNER JOIN products p ON lp.product_id = p.id
    INNER JOIN locations l ON lp.location_id = l.id
    WHERE lp.id = lp_id_param

    UNION ALL

    -- Recursive case: find children (LPs that have this LP as parent)
    SELECT
      child.id AS lp_id,
      child.lp_number,
      child.parent_lp_id,
      gt.lp_number AS parent_lp_number,
      gt.level + 1 AS level,
      child.quantity,
      child.uom,
      child.batch,
      child.expiry_date,
      p.description AS product_description,
      l.name AS location,
      child.qa_status,
      child.is_consumed,
      child.created_at
    FROM genealogy_tree gt
    INNER JOIN license_plates child ON child.parent_lp_id = gt.lp_id
    INNER JOIN products p ON child.product_id = p.id
    INNER JOIN locations l ON child.location_id = l.id
    WHERE gt.level < 10 -- Prevent infinite loops
  )
  SELECT * FROM genealogy_tree
  ORDER BY level ASC, lp_id ASC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_lp_genealogy_tree IS
'Returns genealogy tree for a license plate (parent → children via splits).
Level 0 = target LP, level 1+ = children created from splitting.
Shows full split chain: original LP → split 1 → split 2 → etc.
Used for traceability: "What child LPs were created from this parent?"';

-- ============================================================================
-- 4. GET LP REVERSE GENEALOGY (Children → Parent)
-- Purpose: Get reverse genealogy (where did this LP come from)
-- Used by: LicensePlatesAPI.getReverseGenealogy()
-- ============================================================================

CREATE OR REPLACE FUNCTION get_lp_reverse_genealogy(lp_id_param INTEGER)
RETURNS TABLE (
  lp_id INTEGER,
  lp_number VARCHAR,
  parent_lp_id INTEGER,
  parent_lp_number VARCHAR,
  level INTEGER,
  quantity NUMERIC,
  uom VARCHAR,
  batch VARCHAR,
  expiry_date DATE,
  product_description TEXT,
  location TEXT,
  qa_status VARCHAR,
  is_consumed BOOLEAN,
  created_at TIMESTAMPTZ,
  quantity_consumed NUMERIC,
  wo_number VARCHAR,
  operation_sequence INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE reverse_genealogy AS (
    -- Base case: starting LP
    SELECT
      lp.id AS lp_id,
      lp.lp_number,
      lp.parent_lp_id,
      parent.lp_number AS parent_lp_number,
      0 AS level,
      lp.quantity,
      lp.uom,
      lp.batch,
      lp.expiry_date,
      p.description AS product_description,
      l.name AS location,
      lp.qa_status,
      lp.is_consumed,
      lp.created_at,
      NULL::NUMERIC AS quantity_consumed,
      NULL::VARCHAR AS wo_number,
      NULL::INTEGER AS operation_sequence
    FROM license_plates lp
    LEFT JOIN license_plates parent ON lp.parent_lp_id = parent.id
    INNER JOIN products p ON lp.product_id = p.id
    INNER JOIN locations l ON lp.location_id = l.id
    WHERE lp.id = lp_id_param

    UNION ALL

    -- Recursive case: find parents (walk up the genealogy tree)
    SELECT
      parent_lp.id AS lp_id,
      parent_lp.lp_number,
      parent_lp.parent_lp_id,
      grandparent.lp_number AS parent_lp_number,
      rg.level - 1 AS level,
      parent_lp.quantity,
      parent_lp.uom,
      parent_lp.batch,
      parent_lp.expiry_date,
      p.description AS product_description,
      l.name AS location,
      parent_lp.qa_status,
      parent_lp.is_consumed,
      parent_lp.created_at,
      gen.quantity_consumed,
      wo.wo_number,
      gen.operation_sequence
    FROM reverse_genealogy rg
    INNER JOIN license_plates parent_lp ON rg.parent_lp_id = parent_lp.id
    LEFT JOIN license_plates grandparent ON parent_lp.parent_lp_id = grandparent.id
    LEFT JOIN lp_genealogy gen ON gen.child_lp_id = rg.lp_id
    LEFT JOIN work_orders wo ON gen.wo_id = wo.id
    INNER JOIN products p ON parent_lp.product_id = p.id
    INNER JOIN locations l ON parent_lp.location_id = l.id
    WHERE rg.level > -10 -- Prevent infinite loops
  )
  SELECT * FROM reverse_genealogy
  ORDER BY level DESC, lp_id ASC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_lp_reverse_genealogy IS
'Returns reverse genealogy for a license plate (child → parent chain).
Level 0 = target LP, level -1, -2, etc = parents (walked up genealogy tree).
Shows full lineage: where this LP came from originally.
Includes lp_genealogy data: quantity_consumed, wo_number, operation_sequence.
Used for traceability: "Where did this LP originate from?"';

-- ============================================================================
-- 5. GET ASNs FOR RECEIVING (Enhanced)
-- Purpose: Get ASNs ready for receiving (submitted status) with summary info
-- Note: This was referenced in ASNsAPI but missing from migrations
-- ============================================================================

CREATE OR REPLACE FUNCTION get_asns_for_receiving()
RETURNS TABLE (
  id INTEGER,
  asn_number VARCHAR,
  supplier_id INTEGER,
  supplier_name VARCHAR,
  expected_arrival DATE,
  status VARCHAR,
  total_items INTEGER,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.asn_number,
    a.supplier_id,
    s.name AS supplier_name,
    a.expected_arrival,
    a.status,
    COUNT(ai.id)::INTEGER AS total_items,
    a.created_at
  FROM asns a
  INNER JOIN suppliers s ON a.supplier_id = s.id
  LEFT JOIN asn_items ai ON a.id = ai.asn_id
  WHERE a.status = 'submitted'
  GROUP BY a.id, a.asn_number, a.supplier_id, s.name, a.expected_arrival, a.status, a.created_at
  ORDER BY a.expected_arrival ASC, a.created_at ASC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_asns_for_receiving IS
'Returns ASNs ready for receiving (submitted status).
Includes supplier info and total item count.
Used by receiving terminal to show pending ASNs.';

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION get_lp_composition_tree TO authenticated;
GRANT EXECUTE ON FUNCTION get_lp_reverse_composition_tree TO authenticated;
GRANT EXECUTE ON FUNCTION get_lp_genealogy_tree TO authenticated;
GRANT EXECUTE ON FUNCTION get_lp_reverse_genealogy TO authenticated;
GRANT EXECUTE ON FUNCTION get_asns_for_receiving TO authenticated;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
