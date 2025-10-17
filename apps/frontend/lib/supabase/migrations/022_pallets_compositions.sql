-- Phase 22: Pallets & Compositions Migration
-- This migration creates pallet management and LP composition tracking

-- Create pallets table
CREATE TABLE pallets (
    id SERIAL PRIMARY KEY,
    pallet_number TEXT NOT NULL UNIQUE,
    wo_id INTEGER NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    line_id INTEGER REFERENCES machines(id),
    status TEXT NOT NULL DEFAULT 'building' CHECK (status IN ('building', 'complete', 'shipped', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Create pallet_items table (junction table for pallets and box LPs)
CREATE TABLE pallet_items (
    id SERIAL PRIMARY KEY,
    pallet_id INTEGER NOT NULL REFERENCES pallets(id) ON DELETE CASCADE,
    box_lp_id INTEGER NOT NULL REFERENCES license_plates(id) ON DELETE CASCADE,
    sequence INTEGER NOT NULL,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    added_by UUID REFERENCES users(id)
);

-- Create lp_compositions table (tracks what went into each output LP)
CREATE TABLE lp_compositions (
    id SERIAL PRIMARY KEY,
    output_lp_id INTEGER NOT NULL REFERENCES license_plates(id) ON DELETE CASCADE,
    input_lp_id INTEGER NOT NULL REFERENCES license_plates(id) ON DELETE CASCADE,
    quantity_consumed NUMERIC(10,4) NOT NULL,
    uom TEXT NOT NULL,
    operation_id INTEGER REFERENCES wo_operations(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Add indexes for performance
CREATE INDEX idx_pallets_wo_id ON pallets(wo_id);
CREATE INDEX idx_pallets_line_id ON pallets(line_id);
CREATE INDEX idx_pallets_status ON pallets(status);
CREATE INDEX idx_pallets_pallet_number ON pallets(pallet_number);

CREATE INDEX idx_pallet_items_pallet_id ON pallet_items(pallet_id);
CREATE INDEX idx_pallet_items_box_lp_id ON pallet_items(box_lp_id);
CREATE INDEX idx_pallet_items_sequence ON pallet_items(pallet_id, sequence);

CREATE INDEX idx_lp_compositions_output_lp_id ON lp_compositions(output_lp_id);
CREATE INDEX idx_lp_compositions_input_lp_id ON lp_compositions(input_lp_id);
CREATE INDEX idx_lp_compositions_operation_id ON lp_compositions(operation_id);

-- Add unique constraints
CREATE UNIQUE INDEX idx_pallet_items_unique_sequence ON pallet_items(pallet_id, sequence);
CREATE UNIQUE INDEX idx_pallet_items_unique_box ON pallet_items(box_lp_id);

-- Add comments for documentation
COMMENT ON TABLE pallets IS 'Pallets for finished goods packaging and shipping';
COMMENT ON TABLE pallet_items IS 'Items (box LPs) contained in each pallet';
COMMENT ON TABLE lp_compositions IS 'Tracks what input LPs went into each output LP for traceability';

COMMENT ON COLUMN pallets.pallet_number IS 'Unique pallet identifier';
COMMENT ON COLUMN pallets.status IS 'Pallet status: building, complete, shipped, or cancelled';
COMMENT ON COLUMN pallet_items.sequence IS 'Sequence order of items on the pallet';
COMMENT ON COLUMN lp_compositions.quantity_consumed IS 'Quantity of input LP consumed to create output LP';

-- Create triggers for updated_at timestamps
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

-- Create function to generate pallet number
CREATE OR REPLACE FUNCTION generate_pallet_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    counter INTEGER := 1;
BEGIN
    LOOP
        new_number := 'PAL-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(counter::text, 4, '0');
        
        -- Check if pallet number already exists
        IF NOT EXISTS (SELECT 1 FROM pallets WHERE pallet_number = new_number) THEN
            RETURN new_number;
        END IF;
        
        counter := counter + 1;
        
        -- Safety check to prevent infinite loop
        IF counter > 9999 THEN
            RAISE EXCEPTION 'Unable to generate unique pallet number';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create function to get pallet summary
CREATE OR REPLACE FUNCTION get_pallet_summary(pallet_id_param INTEGER)
RETURNS TABLE (
    pallet_id INTEGER,
    pallet_number TEXT,
    item_count BIGINT,
    total_weight NUMERIC,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.pallet_number,
        COUNT(pi.id) as item_count,
        COALESCE(SUM(lp.quantity), 0) as total_weight,
        p.status
    FROM pallets p
    LEFT JOIN pallet_items pi ON pi.pallet_id = p.id
    LEFT JOIN license_plates lp ON lp.id = pi.box_lp_id
    WHERE p.id = pallet_id_param
    GROUP BY p.id, p.pallet_number, p.status;
END;
$$ LANGUAGE plpgsql;

-- Create function to trace LP composition
CREATE OR REPLACE FUNCTION trace_lp_composition(lp_id_param INTEGER, direction TEXT DEFAULT 'backward')
RETURNS TABLE (
    level INTEGER,
    lp_id INTEGER,
    lp_number TEXT,
    quantity NUMERIC,
    uom TEXT,
    operation_id INTEGER,
    created_at TIMESTAMPTZ
) AS $$
DECLARE
    current_level INTEGER := 0;
    current_lp_id INTEGER := lp_id_param;
BEGIN
    -- For backward trace (what went into this LP)
    IF direction = 'backward' THEN
        RETURN QUERY
        WITH RECURSIVE composition_tree AS (
            -- Base case: the target LP
            SELECT 
                0 as level,
                lp_id_param as lp_id,
                lp.lp_number,
                lp.quantity,
                lp.product_id,
                lp.created_at
            FROM license_plates lp
            WHERE lp.id = lp_id_param
            
            UNION ALL
            
            -- Recursive case: input LPs
            SELECT 
                ct.level + 1,
                lc.input_lp_id,
                input_lp.lp_number,
                lc.quantity_consumed,
                input_lp.product_id,
                lc.created_at
            FROM composition_tree ct
            JOIN lp_compositions lc ON lc.output_lp_id = ct.lp_id
            JOIN license_plates input_lp ON input_lp.id = lc.input_lp_id
            WHERE ct.level < 10  -- Prevent infinite recursion
        )
        SELECT 
            ct.level,
            ct.lp_id,
            ct.lp_number,
            ct.quantity,
            p.uom,
            lc.operation_id,
            ct.created_at
        FROM composition_tree ct
        JOIN products p ON p.id = ct.product_id
        LEFT JOIN lp_compositions lc ON lc.output_lp_id = ct.lp_id
        ORDER BY ct.level, ct.created_at;
        
    -- For forward trace (where this LP was consumed)
    ELSE
        RETURN QUERY
        WITH RECURSIVE consumption_tree AS (
            -- Base case: the target LP
            SELECT 
                0 as level,
                lp_id_param as lp_id,
                lp.lp_number,
                lp.quantity,
                lp.product_id,
                lp.created_at
            FROM license_plates lp
            WHERE lp.id = lp_id_param
            
            UNION ALL
            
            -- Recursive case: output LPs
            SELECT 
                ct.level + 1,
                lc.output_lp_id,
                output_lp.lp_number,
                lc.quantity_consumed,
                output_lp.product_id,
                lc.created_at
            FROM consumption_tree ct
            JOIN lp_compositions lc ON lc.input_lp_id = ct.lp_id
            JOIN license_plates output_lp ON output_lp.id = lc.output_lp_id
            WHERE ct.level < 10  -- Prevent infinite recursion
        )
        SELECT 
            ct.level,
            ct.lp_id,
            ct.lp_number,
            ct.quantity,
            p.uom,
            lc.operation_id,
            ct.created_at
        FROM consumption_tree ct
        JOIN products p ON p.id = ct.product_id
        LEFT JOIN lp_compositions lc ON lc.input_lp_id = ct.lp_id
        ORDER BY ct.level, ct.created_at;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies
ALTER TABLE pallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE pallet_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE lp_compositions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read pallets" ON pallets
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert pallets" ON pallets
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update pallets" ON pallets
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can read pallet_items" ON pallet_items
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert pallet_items" ON pallet_items
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can delete pallet_items" ON pallet_items
    FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can read lp_compositions" ON lp_compositions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert lp_compositions" ON lp_compositions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Add check constraints
ALTER TABLE pallet_items 
ADD CONSTRAINT check_sequence_positive 
CHECK (sequence > 0);

ALTER TABLE lp_compositions 
ADD CONSTRAINT check_quantity_consumed_positive 
CHECK (quantity_consumed > 0);

ALTER TABLE lp_compositions 
ADD CONSTRAINT check_different_lps 
CHECK (output_lp_id != input_lp_id);
