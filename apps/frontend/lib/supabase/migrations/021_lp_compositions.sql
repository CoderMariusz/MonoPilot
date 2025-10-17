-- Phase 21: LP Compositions Migration
-- This migration creates the lp_compositions table for tracking material compositions

-- Create lp_compositions table
CREATE TABLE lp_compositions (
    id SERIAL PRIMARY KEY,
    output_lp_id INTEGER NOT NULL REFERENCES license_plates(id) ON DELETE CASCADE,
    input_lp_id INTEGER NOT NULL REFERENCES license_plates(id) ON DELETE CASCADE,
    qty NUMERIC(10,4) NOT NULL,
    uom TEXT NOT NULL,
    op_seq INTEGER NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Add indexes for performance
CREATE INDEX idx_lp_compositions_output_lp_id ON lp_compositions(output_lp_id);
CREATE INDEX idx_lp_compositions_input_lp_id ON lp_compositions(input_lp_id);
CREATE INDEX idx_lp_compositions_op_seq ON lp_compositions(op_seq);
CREATE INDEX idx_lp_compositions_created_at ON lp_compositions(created_at);

-- Add comments for documentation
COMMENT ON TABLE lp_compositions IS 'Tracks which input LPs were used to create which output LPs for traceability';
COMMENT ON COLUMN lp_compositions.output_lp_id IS 'Output license plate created';
COMMENT ON COLUMN lp_compositions.input_lp_id IS 'Input license plate consumed';
COMMENT ON COLUMN lp_compositions.qty IS 'Quantity of input LP used';
COMMENT ON COLUMN lp_compositions.uom IS 'Unit of measure';
COMMENT ON COLUMN lp_compositions.op_seq IS 'Operation sequence where composition occurred';

-- Add check constraints
ALTER TABLE lp_compositions 
ADD CONSTRAINT check_qty_positive 
CHECK (qty > 0);

ALTER TABLE lp_compositions 
ADD CONSTRAINT check_op_seq_positive 
CHECK (op_seq IS NULL OR op_seq > 0);

-- Prevent self-referencing compositions
ALTER TABLE lp_compositions 
ADD CONSTRAINT check_no_self_composition 
CHECK (output_lp_id != input_lp_id);

-- Create function to get composition tree for an LP
CREATE OR REPLACE FUNCTION get_lp_composition_tree(lp_id_param INTEGER)
RETURNS TABLE (
    node_id INTEGER,
    node_type TEXT,
    lp_number TEXT,
    product_description TEXT,
    quantity NUMERIC,
    uom TEXT,
    qa_status TEXT,
    stage_suffix TEXT,
    location_name TEXT,
    parent_node INTEGER,
    depth INTEGER,
    path INTEGER[]
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE composition_tree AS (
        -- Base case: Start with the input LP
        SELECT 
            lp.id as node_id,
            'LP'::TEXT as node_type,
            lp.lp_number,
            p.description as product_description,
            lp.quantity,
            p.uom,
            lp.qa_status,
            lp.stage_suffix,
            l.name as location_name,
            NULL::INTEGER as parent_node,
            0 as depth,
            ARRAY[lp.id] as path
        FROM license_plates lp
        JOIN products p ON lp.product_id = p.id
        JOIN locations l ON lp.location_id = l.id
        WHERE lp.id = lp_id_param
        
        UNION ALL
        
        -- Recursive case: Find compositions
        SELECT 
            lp.id as node_id,
            'LP'::TEXT as node_type,
            lp.lp_number,
            p.description as product_description,
            lc.qty as quantity,
            p.uom,
            lp.qa_status,
            lp.stage_suffix,
            l.name as location_name,
            ct.node_id as parent_node,
            ct.depth + 1 as depth,
            ct.path || lp.id as path
        FROM composition_tree ct
        JOIN lp_compositions lc ON lc.input_lp_id = ct.node_id
        JOIN license_plates lp ON lc.output_lp_id = lp.id
        JOIN products p ON lp.product_id = p.id
        JOIN locations l ON lp.location_id = l.id
        WHERE ct.depth < 10  -- Prevent infinite recursion
          AND NOT (lp.id = ANY(ct.path))  -- Prevent cycles
    )
    SELECT * FROM composition_tree
    ORDER BY depth, node_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to get reverse composition tree (what inputs created this LP)
CREATE OR REPLACE FUNCTION get_lp_reverse_composition_tree(lp_id_param INTEGER)
RETURNS TABLE (
    node_id INTEGER,
    node_type TEXT,
    lp_number TEXT,
    product_description TEXT,
    quantity NUMERIC,
    uom TEXT,
    qa_status TEXT,
    stage_suffix TEXT,
    location_name TEXT,
    child_node INTEGER,
    depth INTEGER,
    path INTEGER[]
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE reverse_composition_tree AS (
        -- Base case: Start with the output LP
        SELECT 
            lp.id as node_id,
            'LP'::TEXT as node_type,
            lp.lp_number,
            p.description as product_description,
            lp.quantity,
            p.uom,
            lp.qa_status,
            lp.stage_suffix,
            l.name as location_name,
            NULL::INTEGER as child_node,
            0 as depth,
            ARRAY[lp.id] as path
        FROM license_plates lp
        JOIN products p ON lp.product_id = p.id
        JOIN locations l ON lp.location_id = l.id
        WHERE lp.id = lp_id_param
        
        UNION ALL
        
        -- Recursive case: Find input LPs
        SELECT 
            lp.id as node_id,
            'LP'::TEXT as node_type,
            lp.lp_number,
            p.description as product_description,
            lc.qty as quantity,
            p.uom,
            lp.qa_status,
            lp.stage_suffix,
            l.name as location_name,
            rct.node_id as child_node,
            rct.depth + 1 as depth,
            rct.path || lp.id as path
        FROM reverse_composition_tree rct
        JOIN lp_compositions lc ON lc.output_lp_id = rct.node_id
        JOIN license_plates lp ON lc.input_lp_id = lp.id
        JOIN products p ON lp.product_id = p.id
        JOIN locations l ON lp.location_id = l.id
        WHERE rct.depth < 10  -- Prevent infinite recursion
          AND NOT (lp.id = ANY(rct.path))  -- Prevent cycles
    )
    SELECT * FROM reverse_composition_tree
    ORDER BY depth, node_id;
END;
$$ LANGUAGE plpgsql;

-- Add comments for functions
COMMENT ON FUNCTION get_lp_composition_tree(INTEGER) IS 'Get forward composition tree - what this LP was used to create';
COMMENT ON FUNCTION get_lp_reverse_composition_tree(INTEGER) IS 'Get reverse composition tree - what inputs created this LP';
