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

-- =============================================================================
-- PART 2: Sampling Plans (from 142_create_sampling_plans_tables)
-- =============================================================================

-- =============================================================================
-- Migration 142: Create Sampling Plans Tables (Story 06.7)
-- Purpose: AQL-based statistical sampling plans using ISO 2859 / ANSI Z1.4
-- Critical for: Quality inspection workflow, acceptance sampling, QC compliance
-- =============================================================================

-- =============================================================================
-- Sampling Plans Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS sampling_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    name TEXT NOT NULL,
    description TEXT,
    inspection_type TEXT NOT NULL CHECK (inspection_type IN ('incoming', 'in_process', 'final')),
    product_id UUID REFERENCES products(id),  -- Optional product filter

    -- AQL Configuration (ISO 2859 / ANSI Z1.4)
    aql_level TEXT CHECK (aql_level IN ('I', 'II', 'III')),  -- General Inspection Level
    special_level TEXT CHECK (special_level IN ('S-1', 'S-2', 'S-3', 'S-4')),  -- Special Level (Phase 2)

    -- Lot Size Range
    lot_size_min INTEGER NOT NULL,
    lot_size_max INTEGER NOT NULL,

    -- Sample Size and Acceptance Criteria
    sample_size INTEGER NOT NULL,
    acceptance_number INTEGER NOT NULL,  -- Ac (max defects to accept)
    rejection_number INTEGER NOT NULL,   -- Re (min defects to reject)

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES users(id),
    updated_at TIMESTAMPTZ DEFAULT now(),
    updated_by UUID REFERENCES users(id),

    CONSTRAINT valid_lot_range CHECK (lot_size_min <= lot_size_max),
    CONSTRAINT valid_acceptance CHECK (acceptance_number < rejection_number),
    CONSTRAINT valid_sample_size CHECK (sample_size > 0),
    UNIQUE(org_id, name)
);

-- Indexes
CREATE INDEX idx_sampling_plans_org ON sampling_plans(org_id);
CREATE INDEX idx_sampling_plans_type ON sampling_plans(org_id, inspection_type);
CREATE INDEX idx_sampling_plans_product ON sampling_plans(product_id) WHERE product_id IS NOT NULL;
CREATE INDEX idx_sampling_plans_lot_range ON sampling_plans(org_id, lot_size_min, lot_size_max);
CREATE INDEX idx_sampling_plans_active ON sampling_plans(org_id, is_active);

-- RLS Policies
ALTER TABLE sampling_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sampling_plans_select" ON sampling_plans
    FOR SELECT USING (
        org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    );

CREATE POLICY "sampling_plans_insert" ON sampling_plans
    FOR INSERT WITH CHECK (
        org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    );

CREATE POLICY "sampling_plans_update" ON sampling_plans
    FOR UPDATE USING (
        org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    );

CREATE POLICY "sampling_plans_delete" ON sampling_plans
    FOR DELETE USING (
        org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    );

-- Comments
COMMENT ON TABLE sampling_plans IS 'AQL-based sampling plans for quality inspections (ISO 2859 / ANSI Z1.4)';
COMMENT ON COLUMN sampling_plans.aql_level IS 'General Inspection Level (I, II, III) - II is most common';
COMMENT ON COLUMN sampling_plans.special_level IS 'Special Inspection Level (S-1 to S-4) for small sample sizes (Phase 2)';
COMMENT ON COLUMN sampling_plans.acceptance_number IS 'Ac - Maximum defects allowed to accept lot';
COMMENT ON COLUMN sampling_plans.rejection_number IS 'Re - Minimum defects to reject lot';

-- =============================================================================
-- Sampling Records Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS sampling_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    plan_id UUID NOT NULL REFERENCES sampling_plans(id),
    inspection_id UUID NOT NULL REFERENCES quality_inspections(id),

    -- Sample Identification
    sample_identifier TEXT NOT NULL,  -- e.g., "S-001", "S-002"
    location_description TEXT,  -- e.g., "Top layer, pallet 3", "Box 5 of 20"

    -- Sampling Details
    sampled_by UUID NOT NULL REFERENCES users(id),
    sampled_at TIMESTAMPTZ DEFAULT now(),
    notes TEXT,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE(inspection_id, sample_identifier)
);

-- Indexes
CREATE INDEX idx_sampling_records_org ON sampling_records(org_id);
CREATE INDEX idx_sampling_records_plan ON sampling_records(plan_id);
CREATE INDEX idx_sampling_records_inspection ON sampling_records(inspection_id);
CREATE INDEX idx_sampling_records_sampled_at ON sampling_records(sampled_at);

-- RLS Policies
ALTER TABLE sampling_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sampling_records_select" ON sampling_records
    FOR SELECT USING (
        org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    );

CREATE POLICY "sampling_records_insert" ON sampling_records
    FOR INSERT WITH CHECK (
        org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    );

CREATE POLICY "sampling_records_update" ON sampling_records
    FOR UPDATE USING (
        org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    );

CREATE POLICY "sampling_records_delete" ON sampling_records
    FOR DELETE USING (
        org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    );

-- Comments
COMMENT ON TABLE sampling_records IS 'Individual sample records taken during inspections';
COMMENT ON COLUMN sampling_records.sample_identifier IS 'Unique sample ID within inspection (e.g., S-001, S-002)';
COMMENT ON COLUMN sampling_records.location_description IS 'Physical location where sample was taken (e.g., top/middle/bottom of lot)';

-- =============================================================================
-- ISO 2859 Reference Table (Seed Data)
-- =============================================================================

CREATE TABLE IF NOT EXISTS iso_2859_reference (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_size_min INTEGER NOT NULL,
    lot_size_max INTEGER NOT NULL,
    sample_size_code TEXT NOT NULL,  -- A, B, C, D, E, F, G, H, J, K, L, M, N, P, Q, R
    inspection_level TEXT NOT NULL CHECK (inspection_level IN ('I', 'II', 'III')),
    sample_size INTEGER NOT NULL,
    aql_065 JSONB,  -- {Ac: 0, Re: 1}
    aql_10 JSONB,
    aql_15 JSONB,
    aql_25 JSONB,
    aql_40 JSONB,
    aql_65 JSONB,
    aql_100 JSONB,
    aql_150 JSONB,
    aql_250 JSONB,
    aql_400 JSONB,
    aql_650 JSONB,
    aql_1000 JSONB
);

-- Insert ISO 2859 Sample Size Table (General Inspection Level II)
INSERT INTO iso_2859_reference (lot_size_min, lot_size_max, sample_size_code, inspection_level, sample_size, aql_065, aql_10, aql_15, aql_25, aql_40, aql_65, aql_100, aql_150, aql_250, aql_400, aql_650, aql_1000) VALUES
(2, 8, 'A', 'II', 2, '{"Ac": 0, "Re": 1}', '{"Ac": 0, "Re": 1}', '{"Ac": 0, "Re": 1}', '{"Ac": 0, "Re": 1}', '{"Ac": 0, "Re": 1}', '{"Ac": 0, "Re": 1}', '{"Ac": 0, "Re": 1}', '{"Ac": 0, "Re": 1}', '{"Ac": 1, "Re": 2}', '{"Ac": 1, "Re": 2}', '{"Ac": 2, "Re": 3}', '{"Ac": 3, "Re": 4}'),
(9, 15, 'B', 'II', 3, '{"Ac": 0, "Re": 1}', '{"Ac": 0, "Re": 1}', '{"Ac": 0, "Re": 1}', '{"Ac": 0, "Re": 1}', '{"Ac": 0, "Re": 1}', '{"Ac": 0, "Re": 1}', '{"Ac": 0, "Re": 1}', '{"Ac": 0, "Re": 1}', '{"Ac": 1, "Re": 2}', '{"Ac": 1, "Re": 2}', '{"Ac": 2, "Re": 3}', '{"Ac": 3, "Re": 4}'),
(16, 25, 'C', 'II', 5, '{"Ac": 0, "Re": 1}', '{"Ac": 0, "Re": 1}', '{"Ac": 0, "Re": 1}', '{"Ac": 0, "Re": 1}', '{"Ac": 0, "Re": 1}', '{"Ac": 0, "Re": 1}', '{"Ac": 0, "Re": 1}', '{"Ac": 1, "Re": 2}', '{"Ac": 1, "Re": 2}', '{"Ac": 2, "Re": 3}', '{"Ac": 3, "Re": 4}', '{"Ac": 5, "Re": 6}'),
(26, 50, 'D', 'II', 8, '{"Ac": 0, "Re": 1}', '{"Ac": 0, "Re": 1}', '{"Ac": 0, "Re": 1}', '{"Ac": 0, "Re": 1}', '{"Ac": 0, "Re": 1}', '{"Ac": 0, "Re": 1}', '{"Ac": 1, "Re": 2}', '{"Ac": 1, "Re": 2}', '{"Ac": 2, "Re": 3}', '{"Ac": 3, "Re": 4}', '{"Ac": 5, "Re": 6}', '{"Ac": 7, "Re": 8}'),
(51, 90, 'E', 'II', 13, '{"Ac": 0, "Re": 1}', '{"Ac": 0, "Re": 1}', '{"Ac": 0, "Re": 1}', '{"Ac": 0, "Re": 1}', '{"Ac": 0, "Re": 1}', '{"Ac": 1, "Re": 2}', '{"Ac": 1, "Re": 2}', '{"Ac": 2, "Re": 3}', '{"Ac": 3, "Re": 4}', '{"Ac": 5, "Re": 6}', '{"Ac": 7, "Re": 8}', '{"Ac": 10, "Re": 11}'),
(91, 150, 'F', 'II', 20, '{"Ac": 0, "Re": 1}', '{"Ac": 0, "Re": 1}', '{"Ac": 0, "Re": 1}', '{"Ac": 0, "Re": 1}', '{"Ac": 1, "Re": 2}', '{"Ac": 1, "Re": 2}', '{"Ac": 2, "Re": 3}', '{"Ac": 3, "Re": 4}', '{"Ac": 5, "Re": 6}', '{"Ac": 7, "Re": 8}', '{"Ac": 10, "Re": 11}', '{"Ac": 14, "Re": 15}'),
(151, 280, 'G', 'II', 32, '{"Ac": 0, "Re": 1}', '{"Ac": 0, "Re": 1}', '{"Ac": 0, "Re": 1}', '{"Ac": 1, "Re": 2}', '{"Ac": 1, "Re": 2}', '{"Ac": 2, "Re": 3}', '{"Ac": 3, "Re": 4}', '{"Ac": 5, "Re": 6}', '{"Ac": 7, "Re": 8}', '{"Ac": 10, "Re": 11}', '{"Ac": 14, "Re": 15}', '{"Ac": 21, "Re": 22}'),
(281, 500, 'H', 'II', 50, '{"Ac": 0, "Re": 1}', '{"Ac": 0, "Re": 1}', '{"Ac": 1, "Re": 2}', '{"Ac": 1, "Re": 2}', '{"Ac": 2, "Re": 3}', '{"Ac": 3, "Re": 4}', '{"Ac": 5, "Re": 6}', '{"Ac": 7, "Re": 8}', '{"Ac": 10, "Re": 11}', '{"Ac": 14, "Re": 15}', '{"Ac": 21, "Re": 22}', '{"Ac": 21, "Re": 22}'),
(501, 1200, 'J', 'II', 80, '{"Ac": 0, "Re": 1}', '{"Ac": 1, "Re": 2}', '{"Ac": 1, "Re": 2}', '{"Ac": 2, "Re": 3}', '{"Ac": 3, "Re": 4}', '{"Ac": 5, "Re": 6}', '{"Ac": 7, "Re": 8}', '{"Ac": 10, "Re": 11}', '{"Ac": 14, "Re": 15}', '{"Ac": 21, "Re": 22}', '{"Ac": 21, "Re": 22}', '{"Ac": 21, "Re": 22}'),
(1201, 3200, 'K', 'II', 125, '{"Ac": 1, "Re": 2}', '{"Ac": 1, "Re": 2}', '{"Ac": 2, "Re": 3}', '{"Ac": 3, "Re": 4}', '{"Ac": 5, "Re": 6}', '{"Ac": 7, "Re": 8}', '{"Ac": 10, "Re": 11}', '{"Ac": 14, "Re": 15}', '{"Ac": 21, "Re": 22}', '{"Ac": 21, "Re": 22}', '{"Ac": 21, "Re": 22}', '{"Ac": 21, "Re": 22}'),
(3201, 10000, 'L', 'II', 200, '{"Ac": 1, "Re": 2}', '{"Ac": 2, "Re": 3}', '{"Ac": 3, "Re": 4}', '{"Ac": 5, "Re": 6}', '{"Ac": 7, "Re": 8}', '{"Ac": 10, "Re": 11}', '{"Ac": 14, "Re": 15}', '{"Ac": 21, "Re": 22}', '{"Ac": 21, "Re": 22}', '{"Ac": 21, "Re": 22}', '{"Ac": 21, "Re": 22}', '{"Ac": 21, "Re": 22}'),
(10001, 35000, 'M', 'II', 315, '{"Ac": 2, "Re": 3}', '{"Ac": 3, "Re": 4}', '{"Ac": 5, "Re": 6}', '{"Ac": 7, "Re": 8}', '{"Ac": 10, "Re": 11}', '{"Ac": 14, "Re": 15}', '{"Ac": 21, "Re": 22}', '{"Ac": 21, "Re": 22}', '{"Ac": 21, "Re": 22}', '{"Ac": 21, "Re": 22}', '{"Ac": 21, "Re": 22}', '{"Ac": 21, "Re": 22}'),
(35001, 150000, 'N', 'II', 500, '{"Ac": 3, "Re": 4}', '{"Ac": 5, "Re": 6}', '{"Ac": 7, "Re": 8}', '{"Ac": 10, "Re": 11}', '{"Ac": 14, "Re": 15}', '{"Ac": 21, "Re": 22}', '{"Ac": 21, "Re": 22}', '{"Ac": 21, "Re": 22}', '{"Ac": 21, "Re": 22}', '{"Ac": 21, "Re": 22}', '{"Ac": 21, "Re": 22}', '{"Ac": 21, "Re": 22}'),
(150001, 500000, 'P', 'II', 800, '{"Ac": 5, "Re": 6}', '{"Ac": 7, "Re": 8}', '{"Ac": 10, "Re": 11}', '{"Ac": 14, "Re": 15}', '{"Ac": 21, "Re": 22}', '{"Ac": 21, "Re": 22}', '{"Ac": 21, "Re": 22}', '{"Ac": 21, "Re": 22}', '{"Ac": 21, "Re": 22}', '{"Ac": 21, "Re": 22}', '{"Ac": 21, "Re": 22}', '{"Ac": 21, "Re": 22}'),
(500001, 999999999, 'Q', 'II', 1250, '{"Ac": 7, "Re": 8}', '{"Ac": 10, "Re": 11}', '{"Ac": 14, "Re": 15}', '{"Ac": 21, "Re": 22}', '{"Ac": 21, "Re": 22}', '{"Ac": 21, "Re": 22}', '{"Ac": 21, "Re": 22}', '{"Ac": 21, "Re": 22}', '{"Ac": 21, "Re": 22}', '{"Ac": 21, "Re": 22}', '{"Ac": 21, "Re": 22}', '{"Ac": 21, "Re": 22}');

-- Index for ISO 2859 reference
CREATE INDEX idx_iso_2859_lot_range ON iso_2859_reference(lot_size_min, lot_size_max);
CREATE INDEX idx_iso_2859_level ON iso_2859_reference(inspection_level);

-- Comments
COMMENT ON TABLE iso_2859_reference IS 'ISO 2859 / ANSI Z1.4 sample size reference table (read-only)';

-- =============================================================================
-- Update quality_inspections to add sampling_plan_id FK
-- =============================================================================

-- Add FK constraint for sampling_plan_id (already exists as nullable UUID in migration 141)
-- Check if column exists before adding
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'quality_inspections'
        AND column_name = 'sampling_plan_id'
    ) THEN
        ALTER TABLE quality_inspections
        ADD COLUMN sampling_plan_id UUID REFERENCES sampling_plans(id);
    END IF;
END $$;

-- Add index if not exists
CREATE INDEX IF NOT EXISTS idx_inspections_sampling_plan ON quality_inspections(sampling_plan_id)
    WHERE sampling_plan_id IS NOT NULL;

-- =============================================================================
-- Trigger for updated_at on sampling_plans
-- =============================================================================

CREATE TRIGGER update_sampling_plans_updated_at
    BEFORE UPDATE ON sampling_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Grant Permissions
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON sampling_plans TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON sampling_records TO authenticated;
GRANT SELECT ON iso_2859_reference TO authenticated;
