-- Migration: 141_create_quality_spec_parameters.sql
-- Story: 06.4 - Test Parameters
-- Phase: P3 - Backend Implementation (GREEN)
--
-- Creates quality_spec_parameters table with:
-- - 4 parameter types: numeric, text, boolean, range
-- - Drag-to-reorder sequence
-- - Critical parameter flagging
-- - Test method configuration
-- - Parameter validation per type

-- Create quality_spec_parameters table
CREATE TABLE IF NOT EXISTS quality_spec_parameters (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    spec_id                 UUID NOT NULL REFERENCES quality_specifications(id) ON DELETE CASCADE,
    sequence                INTEGER NOT NULL,
    parameter_name          TEXT NOT NULL,
    parameter_type          TEXT NOT NULL
                            CHECK (parameter_type IN ('numeric', 'text', 'boolean', 'range')),
    target_value            TEXT,                    -- Target value (all types)
    min_value               DECIMAL(15,6),           -- For numeric/range types
    max_value               DECIMAL(15,6),           -- For numeric/range types
    unit                    TEXT,                    -- e.g., "C", "kg", "pH", "%"
    test_method             TEXT,                    -- e.g., "AOAC 942.15", "ISO 5509", "Visual"
    instrument_required     BOOLEAN DEFAULT false,   -- Requires specific equipment
    instrument_id           UUID REFERENCES machines(id),  -- Optional: specific machine
    is_critical             BOOLEAN DEFAULT false,   -- Critical parameter (must pass)
    acceptance_criteria     TEXT,                    -- Additional criteria text
    sampling_instructions   TEXT,                    -- How to sample for this test
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              UUID REFERENCES users(id),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by              UUID REFERENCES users(id),

    CONSTRAINT uq_spec_sequence UNIQUE (spec_id, sequence),
    CONSTRAINT chk_numeric_values CHECK (
        parameter_type NOT IN ('numeric', 'range') OR
        (min_value IS NOT NULL OR max_value IS NOT NULL)
    )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_spec_parameters_spec ON quality_spec_parameters(spec_id);
CREATE INDEX IF NOT EXISTS idx_spec_parameters_sequence ON quality_spec_parameters(spec_id, sequence);
CREATE INDEX IF NOT EXISTS idx_spec_parameters_critical ON quality_spec_parameters(spec_id, is_critical)
    WHERE is_critical = true;

-- RLS Policies
ALTER TABLE quality_spec_parameters ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "quality_spec_parameters_select" ON quality_spec_parameters;
DROP POLICY IF EXISTS "quality_spec_parameters_insert" ON quality_spec_parameters;
DROP POLICY IF EXISTS "quality_spec_parameters_update" ON quality_spec_parameters;
DROP POLICY IF EXISTS "quality_spec_parameters_delete" ON quality_spec_parameters;

CREATE POLICY "quality_spec_parameters_select" ON quality_spec_parameters
    FOR SELECT USING (
        spec_id IN (
            SELECT id FROM quality_specifications
            WHERE org_id = (SELECT org_id FROM users WHERE id = auth.uid())
        )
    );

CREATE POLICY "quality_spec_parameters_insert" ON quality_spec_parameters
    FOR INSERT WITH CHECK (
        spec_id IN (
            SELECT id FROM quality_specifications
            WHERE org_id = (SELECT org_id FROM users WHERE id = auth.uid())
        )
    );

CREATE POLICY "quality_spec_parameters_update" ON quality_spec_parameters
    FOR UPDATE USING (
        spec_id IN (
            SELECT id FROM quality_specifications
            WHERE org_id = (SELECT org_id FROM users WHERE id = auth.uid())
        )
    );

CREATE POLICY "quality_spec_parameters_delete" ON quality_spec_parameters
    FOR DELETE USING (
        spec_id IN (
            SELECT id FROM quality_specifications
            WHERE org_id = (SELECT org_id FROM users WHERE id = auth.uid())
            AND status = 'draft'  -- Only delete parameters from draft specs
        )
    );

-- Trigger for updated_at (reuse existing function if it exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_quality_spec_parameters_updated_at') THEN
        CREATE TRIGGER update_quality_spec_parameters_updated_at
            BEFORE UPDATE ON quality_spec_parameters
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Function to reorder parameters
CREATE OR REPLACE FUNCTION reorder_spec_parameters(
    p_spec_id UUID,
    p_parameter_ids UUID[]
)
RETURNS void AS $$
DECLARE
    v_id UUID;
    v_seq INTEGER := 1;
BEGIN
    -- Update sequence for each parameter in order
    FOREACH v_id IN ARRAY p_parameter_ids LOOP
        UPDATE quality_spec_parameters
        SET sequence = v_seq,
            updated_at = now()
        WHERE id = v_id
          AND spec_id = p_spec_id;

        v_seq := v_seq + 1;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get next sequence for a spec
CREATE OR REPLACE FUNCTION get_next_parameter_sequence(p_spec_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_max_seq INTEGER;
BEGIN
    SELECT COALESCE(MAX(sequence), 0) INTO v_max_seq
    FROM quality_spec_parameters
    WHERE spec_id = p_spec_id;

    RETURN v_max_seq + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Constraint function: prevent parameter modification on non-draft specs
CREATE OR REPLACE FUNCTION check_spec_draft_status()
RETURNS TRIGGER AS $$
DECLARE
    v_status TEXT;
BEGIN
    SELECT status INTO v_status
    FROM quality_specifications
    WHERE id = NEW.spec_id;

    IF v_status != 'draft' THEN
        RAISE EXCEPTION 'Cannot modify parameters on non-draft specifications';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists (for idempotency)
DROP TRIGGER IF EXISTS enforce_draft_spec_for_parameters ON quality_spec_parameters;

CREATE TRIGGER enforce_draft_spec_for_parameters
    BEFORE INSERT OR UPDATE ON quality_spec_parameters
    FOR EACH ROW
    EXECUTE FUNCTION check_spec_draft_status();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON quality_spec_parameters TO authenticated;
