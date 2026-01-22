-- =============================================================================
-- Migration 142: Create Quality Test Results Table (Story 06.6)
-- Purpose: Store test results for quality inspections
-- Critical for: Quality inspection recording, pass/fail/marginal status tracking
-- =============================================================================

-- =============================================================================
-- Quality Test Results Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS quality_test_results (
    -- Identity
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id              UUID NOT NULL REFERENCES organizations(id),
    inspection_id       UUID NOT NULL REFERENCES quality_inspections(id) ON DELETE CASCADE,
    parameter_id        UUID NOT NULL REFERENCES quality_spec_parameters(id),

    -- Test Values
    measured_value      TEXT NOT NULL,              -- String to support various types
    numeric_value       DECIMAL(15,6),              -- For numeric parameters

    -- Result Determination
    result_status       TEXT NOT NULL,              -- pass, fail, marginal
    deviation_pct       DECIMAL(5,2),               -- % deviation from limit (for marginal detection)

    -- Test Metadata
    tested_by           UUID NOT NULL REFERENCES users(id),
    tested_at           TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Equipment (Optional - Epic 01.10)
    equipment_id        UUID REFERENCES machines(id),
    calibration_date    DATE,                       -- Equipment calibration date

    -- Additional Info
    notes               TEXT,
    attachment_url      TEXT,                       -- Photo/document evidence

    -- Audit Fields
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by          UUID REFERENCES users(id),
    updated_at          TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT chk_test_result_status CHECK (result_status IN ('pass', 'fail', 'marginal'))
);

COMMENT ON TABLE quality_test_results IS 'Test result records for quality inspections';
COMMENT ON COLUMN quality_test_results.measured_value IS 'String value supporting all parameter types';
COMMENT ON COLUMN quality_test_results.numeric_value IS 'Numeric value for calculations and trending';
COMMENT ON COLUMN quality_test_results.result_status IS 'Pass/fail/marginal based on acceptance criteria';
COMMENT ON COLUMN quality_test_results.deviation_pct IS 'Percentage deviation from limit (marginal detection)';

-- =============================================================================
-- Indexes for Performance
-- =============================================================================

CREATE INDEX idx_test_results_inspection ON quality_test_results(inspection_id);
CREATE INDEX idx_test_results_parameter ON quality_test_results(parameter_id);
CREATE INDEX idx_test_results_org_status ON quality_test_results(org_id, result_status);
CREATE INDEX idx_test_results_tested_at ON quality_test_results(tested_at DESC);
CREATE INDEX idx_test_results_org_inspection ON quality_test_results(org_id, inspection_id);

-- =============================================================================
-- RLS Policies
-- =============================================================================

ALTER TABLE quality_test_results ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "test_results_select" ON quality_test_results;
DROP POLICY IF EXISTS "test_results_insert" ON quality_test_results;
DROP POLICY IF EXISTS "test_results_update" ON quality_test_results;
DROP POLICY IF EXISTS "test_results_delete" ON quality_test_results;

CREATE POLICY "test_results_select" ON quality_test_results
    FOR SELECT USING (
        org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    );

CREATE POLICY "test_results_insert" ON quality_test_results
    FOR INSERT WITH CHECK (
        org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    );

CREATE POLICY "test_results_update" ON quality_test_results
    FOR UPDATE USING (
        org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    );

CREATE POLICY "test_results_delete" ON quality_test_results
    FOR DELETE USING (
        org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    );

-- =============================================================================
-- Trigger for updated_at
-- =============================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_quality_test_results_updated_at') THEN
        CREATE TRIGGER update_quality_test_results_updated_at
            BEFORE UPDATE ON quality_test_results
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- =============================================================================
-- Grant Permissions
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON quality_test_results TO authenticated;
