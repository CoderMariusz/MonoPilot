-- Phase 22: Pallets Migration
-- This migration creates the pallets and pallet_items tables for pallet management

-- Create pallets table
CREATE TABLE pallets (
    id SERIAL PRIMARY KEY,
    wo_id INTEGER NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    line TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Create pallet_items table
CREATE TABLE pallet_items (
    id SERIAL PRIMARY KEY,
    pallet_id INTEGER NOT NULL REFERENCES pallets(id) ON DELETE CASCADE,
    box_lp_id INTEGER NOT NULL REFERENCES license_plates(id) ON DELETE CASCADE,
    sequence INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Add indexes for performance
CREATE INDEX idx_pallets_wo_id ON pallets(wo_id);
CREATE INDEX idx_pallets_line ON pallets(line);
CREATE INDEX idx_pallets_code ON pallets(code);
CREATE INDEX idx_pallets_created_at ON pallets(created_at);

CREATE INDEX idx_pallet_items_pallet_id ON pallet_items(pallet_id);
CREATE INDEX idx_pallet_items_box_lp_id ON pallet_items(box_lp_id);
CREATE INDEX idx_pallet_items_sequence ON pallet_items(pallet_id, sequence);

-- Add comments for documentation
COMMENT ON TABLE pallets IS 'Pallets created for finished goods packaging';
COMMENT ON COLUMN pallets.wo_id IS 'Work order that created the pallet';
COMMENT ON COLUMN pallets.line IS 'Production line where pallet was created';
COMMENT ON COLUMN pallets.code IS 'Unique pallet code (PLT-YYYY-####)';

COMMENT ON TABLE pallet_items IS 'Box license plates contained in pallets';
COMMENT ON COLUMN pallet_items.pallet_id IS 'Pallet reference';
COMMENT ON COLUMN pallet_items.box_lp_id IS 'Box license plate reference';
COMMENT ON COLUMN pallet_items.sequence IS 'Sequence order in pallet';

-- Add check constraints
ALTER TABLE pallets 
ADD CONSTRAINT check_line_not_empty 
CHECK (LENGTH(TRIM(line)) > 0);

ALTER TABLE pallets 
ADD CONSTRAINT check_code_format 
CHECK (code ~ '^PLT-\d{4}-\d+$');

ALTER TABLE pallet_items 
ADD CONSTRAINT check_sequence_positive 
CHECK (sequence > 0);

-- Prevent duplicate box LPs in same pallet
CREATE UNIQUE INDEX idx_pallet_items_pallet_box_unique 
ON pallet_items(pallet_id, box_lp_id);

-- Add trigger for updated_at on pallets
CREATE OR REPLACE FUNCTION update_pallets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_pallets_updated_at
    BEFORE UPDATE ON pallets
    FOR EACH ROW
    EXECUTE FUNCTION update_pallets_updated_at();

-- Create function to generate pallet code
CREATE OR REPLACE FUNCTION generate_pallet_code()
RETURNS TEXT AS $$
DECLARE
    year_part TEXT;
    seq_num INTEGER;
    pallet_code TEXT;
BEGIN
    -- Get current year
    year_part := TO_CHAR(NOW(), 'YYYY');
    
    -- Get next sequence number for this year
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(code FROM 'PLT-\d{4}-(\d+)$') AS INTEGER)
    ), 0) + 1 INTO seq_num
    FROM pallets
    WHERE code LIKE 'PLT-' || year_part || '-%';
    
    -- Generate pallet code
    pallet_code := 'PLT-' || year_part || '-' || LPAD(seq_num::TEXT, 4, '0');
    
    RETURN pallet_code;
END;
$$ LANGUAGE plpgsql;

-- Create function to get pallet contents
CREATE OR REPLACE FUNCTION get_pallet_contents(pallet_id_param INTEGER)
RETURNS TABLE (
    item_id INTEGER,
    box_lp_number TEXT,
    product_description TEXT,
    quantity NUMERIC,
    uom TEXT,
    qa_status TEXT,
    location_name TEXT,
    sequence INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pi.id as item_id,
        lp.lp_number as box_lp_number,
        p.description as product_description,
        lp.quantity,
        p.uom,
        lp.qa_status,
        l.name as location_name,
        pi.sequence
    FROM pallet_items pi
    JOIN license_plates lp ON pi.box_lp_id = lp.id
    JOIN products p ON lp.product_id = p.id
    JOIN locations l ON lp.location_id = l.id
    WHERE pi.pallet_id = pallet_id_param
    ORDER BY pi.sequence;
END;
$$ LANGUAGE plpgsql;

-- Create function to get pallet summary
CREATE OR REPLACE FUNCTION get_pallet_summary(pallet_id_param INTEGER)
RETURNS TABLE (
    pallet_id INTEGER,
    pallet_code TEXT,
    wo_number TEXT,
    line TEXT,
    total_boxes INTEGER,
    total_weight_kg NUMERIC,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as pallet_id,
        p.code as pallet_code,
        wo.wo_number,
        p.line,
        COUNT(pi.id)::INTEGER as total_boxes,
        COALESCE(SUM(lp.quantity), 0) as total_weight_kg,
        p.created_at
    FROM pallets p
    JOIN work_orders wo ON p.wo_id = wo.id
    LEFT JOIN pallet_items pi ON p.id = pi.pallet_id
    LEFT JOIN license_plates lp ON pi.box_lp_id = lp.id
    WHERE p.id = pallet_id_param
    GROUP BY p.id, p.code, wo.wo_number, p.line, p.created_at;
END;
$$ LANGUAGE plpgsql;

-- Add comments for functions
COMMENT ON FUNCTION generate_pallet_code() IS 'Generate unique pallet code in format PLT-YYYY-####';
COMMENT ON FUNCTION get_pallet_contents(INTEGER) IS 'Get all box LPs contained in a pallet';
COMMENT ON FUNCTION get_pallet_summary(INTEGER) IS 'Get summary statistics for a pallet';
