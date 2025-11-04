-- Migration 057: WO Snapshot with Line Filtering & Routing Enhancements
-- Creates/replaces create_wo_bom_snapshot function with line filtering
-- Adds machine_id, expected_yield_pct to routing_operations
-- Creates routing_operation_names dictionary table

-- ==========================================
-- 1. WO Snapshot Function with Line Filtering
-- ==========================================
CREATE OR REPLACE FUNCTION create_wo_bom_snapshot(
  p_wo_id INTEGER,
  p_bom_id INTEGER,
  p_line_id INTEGER
) RETURNS JSONB AS $$
DECLARE
  v_bom RECORD;
  v_item RECORD;
  v_snapshot JSONB := '{"items": []}'::JSONB;
  v_wo_qty NUMERIC;
  v_items_inserted INTEGER := 0;
BEGIN
  -- Get BOM header
  SELECT * INTO v_bom FROM boms WHERE id = p_bom_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'BOM % not found', p_bom_id;
  END IF;
  
  -- Validate BOM is active
  IF v_bom.status != 'active' THEN
    RAISE EXCEPTION 'Cannot create snapshot from non-active BOM (status: %)', v_bom.status
      USING HINT = 'Only active BOMs can be used for work orders';
  END IF;
  
  -- Validate line_id is compatible with BOM
  IF v_bom.line_id IS NOT NULL AND NOT (p_line_id = ANY(v_bom.line_id)) THEN
    RAISE EXCEPTION 'Line % not allowed for BOM %. Allowed lines: %', 
      p_line_id, p_bom_id, array_to_string(v_bom.line_id, ', ')
      USING HINT = 'Select a production line that is compatible with this BOM';
  END IF;
  
  -- Get WO quantity
  SELECT quantity INTO v_wo_qty FROM work_orders WHERE id = p_wo_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Work Order % not found', p_wo_id;
  END IF;
  
  -- Delete existing wo_materials for this WO (for re-snapshot scenarios)
  DELETE FROM wo_materials WHERE wo_id = p_wo_id;
  
  -- Insert filtered BOM items into wo_materials
  FOR v_item IN
    SELECT 
      bi.*,
      p.description as material_name,
      p.part_number as material_code
    FROM bom_items bi
    JOIN products p ON p.id = bi.material_id
    WHERE bi.bom_id = p_bom_id
      AND (
        bi.line_id IS NULL  -- Available on all lines
        OR p_line_id = ANY(bi.line_id)  -- Line-specific match
      )
    ORDER BY bi.sequence
  LOOP
    INSERT INTO wo_materials (
      wo_id, 
      material_id, 
      qty_per_unit, 
      total_qty_needed, 
      uom,
      production_line_restrictions, 
      scrap_std_pct, 
      consume_whole_lp,
      sequence, 
      priority
    )
    VALUES (
      p_wo_id,
      v_item.material_id,
      v_item.quantity,
      v_item.quantity * v_wo_qty,
      v_item.uom,
      v_item.production_line_restrictions,
      COALESCE(v_item.scrap_std_pct, 0),
      COALESCE(v_item.consume_whole_lp, false),
      v_item.sequence,
      v_item.priority
    );
    
    v_items_inserted := v_items_inserted + 1;
  END LOOP;
  
  -- Build snapshot JSON
  v_snapshot := jsonb_build_object(
    'bom_id', p_bom_id,
    'bom_version', v_bom.version,
    'product_id', v_bom.product_id,
    'line_id', p_line_id,
    'items_count', v_items_inserted,
    'created_at', NOW(),
    'snapshot_by', 'create_wo_bom_snapshot'
  );
  
  -- Log snapshot creation
  RAISE NOTICE 'WO snapshot created: WO=%, BOM=%, Line=%, Items=%', 
    p_wo_id, p_bom_id, p_line_id, v_items_inserted;
  
  RETURN v_snapshot;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_wo_bom_snapshot(INTEGER, INTEGER, INTEGER) IS 
  'Creates WO material snapshot from BOM with line filtering. Returns snapshot metadata.';

-- ==========================================
-- 2. Routing Operations Enhancements
-- ==========================================

-- Add machine_id to routing_operations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'routing_operations' AND column_name = 'machine_id'
  ) THEN
    ALTER TABLE routing_operations
      ADD COLUMN machine_id INTEGER REFERENCES machines(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_routing_operations_machine ON routing_operations(machine_id);

COMMENT ON COLUMN routing_operations.machine_id IS 'Optional machine assignment for this operation';

-- Add expected_yield_pct to routing_operations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'routing_operations' AND column_name = 'expected_yield_pct'
  ) THEN
    ALTER TABLE routing_operations
      ADD COLUMN expected_yield_pct NUMERIC(5,2) DEFAULT 100.0;
  END IF;
END $$;

ALTER TABLE routing_operations
  ADD CONSTRAINT routing_operations_yield_check 
    CHECK (expected_yield_pct >= 0 AND expected_yield_pct <= 100);

COMMENT ON COLUMN routing_operations.expected_yield_pct IS 
  'Expected yield percentage for this operation (0-100). Used for reporting and variance analysis.';

-- ==========================================
-- 3. Routing Operations Dictionary Table
-- ==========================================
CREATE TABLE IF NOT EXISTS routing_operation_names (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  alias VARCHAR(100),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

CREATE INDEX idx_routing_operation_names_active ON routing_operation_names(is_active);
CREATE INDEX idx_routing_operation_names_name ON routing_operation_names(name);

COMMENT ON TABLE routing_operation_names IS 'Dictionary of standard operation names for routing definitions';
COMMENT ON COLUMN routing_operation_names.name IS 'Standard operation name';
COMMENT ON COLUMN routing_operation_names.alias IS 'Alternative name or short code';

-- Seed standard operation names
INSERT INTO routing_operation_names (name, alias, description) VALUES
  ('Smoke', 'SMK', 'Smoking operation'),
  ('Roast', 'RST', 'Roasting operation'),
  ('Dice', 'DIC', 'Dicing/cutting operation'),
  ('Mix', 'MIX', 'Mixing/blending operation'),
  ('Cool', 'CL', 'Cooling operation'),
  ('Package', 'PKG', 'Packaging operation'),
  ('Prep', 'PRP', 'Preparation operation'),
  ('QC', 'QC', 'Quality control checkpoint')
ON CONFLICT (name) DO NOTHING;

-- ==========================================
-- 4. Helper function for BOM line compatibility check
-- ==========================================
CREATE OR REPLACE FUNCTION validate_bom_line_compatibility(
  p_bom_id INTEGER,
  p_line_id INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  v_bom_lines INTEGER[];
BEGIN
  SELECT line_id INTO v_bom_lines FROM boms WHERE id = p_bom_id;
  
  -- NULL means all lines are compatible
  IF v_bom_lines IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Check if line_id is in the allowed list
  RETURN p_line_id = ANY(v_bom_lines);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_bom_line_compatibility(INTEGER, INTEGER) IS 
  'Validates if a production line is compatible with a BOM. Returns true if compatible.';

