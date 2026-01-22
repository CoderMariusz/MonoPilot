-- Migration 131: Quality Settings Table
-- Story: 06.0 - Quality Settings (Module Configuration)
-- Phase: P3 - Backend Implementation (GREEN)
--
-- Creates the quality_settings table for organization-level configuration of:
-- - Inspection settings (incoming/final requirements, auto-create on GRN)
-- - Hold settings (require reason, disposition on release)
-- - NCR settings (auto-numbering, response SLA, root cause requirement)
-- - CAPA settings (auto-numbering, effectiveness check requirements)
-- - CoA settings (auto-numbering, approval requirement)
-- - HACCP settings (CCP deviation escalation time, auto-NCR creation)
-- - Audit settings (change reason requirement, retention years)

CREATE TABLE IF NOT EXISTS quality_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,

    -- Inspection Settings
    require_incoming_inspection BOOLEAN DEFAULT true,
    require_final_inspection BOOLEAN DEFAULT true,
    auto_create_inspection_on_grn BOOLEAN DEFAULT true,
    default_sampling_level TEXT DEFAULT 'II' CHECK (default_sampling_level IN ('I', 'II', 'III', 'S-1', 'S-2', 'S-3', 'S-4')),

    -- Hold Settings
    require_hold_reason BOOLEAN DEFAULT true,
    require_disposition_on_release BOOLEAN DEFAULT true,

    -- NCR Settings
    ncr_auto_number_prefix TEXT DEFAULT 'NCR-',
    ncr_require_root_cause BOOLEAN DEFAULT true,
    ncr_critical_response_hours INTEGER DEFAULT 24 CHECK (ncr_critical_response_hours > 0),
    ncr_major_response_hours INTEGER DEFAULT 48 CHECK (ncr_major_response_hours > 0),

    -- CAPA Settings
    capa_auto_number_prefix TEXT DEFAULT 'CAPA-',
    capa_require_effectiveness BOOLEAN DEFAULT true,
    capa_effectiveness_wait_days INTEGER DEFAULT 30 CHECK (capa_effectiveness_wait_days >= 0),

    -- CoA Settings
    coa_auto_number_prefix TEXT DEFAULT 'COA-',
    coa_require_approval BOOLEAN DEFAULT false,

    -- HACCP Settings
    ccp_deviation_escalation_minutes INTEGER DEFAULT 15 CHECK (ccp_deviation_escalation_minutes > 0),
    ccp_auto_create_ncr BOOLEAN DEFAULT true,

    -- Audit Settings
    require_change_reason BOOLEAN DEFAULT true,
    retention_years INTEGER DEFAULT 7 CHECK (retention_years > 0 AND retention_years <= 50),

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT unique_org_quality_settings UNIQUE (org_id)
);

-- Enable RLS
ALTER TABLE quality_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their org's settings
CREATE POLICY "Quality settings org isolation"
    ON quality_settings
    FOR ALL
    USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- Index for performance
CREATE INDEX idx_quality_settings_org ON quality_settings(org_id);

-- Trigger to update updated_at
CREATE TRIGGER update_quality_settings_updated_at
    BEFORE UPDATE ON quality_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to initialize default settings for new orgs
CREATE OR REPLACE FUNCTION initialize_quality_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO quality_settings (org_id)
    VALUES (NEW.id)
    ON CONFLICT (org_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create settings on org creation
CREATE TRIGGER auto_create_quality_settings
    AFTER INSERT ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION initialize_quality_settings();

COMMENT ON TABLE quality_settings IS 'Organization-level configuration for Quality module operational parameters';
COMMENT ON COLUMN quality_settings.default_sampling_level IS 'AQL general inspection level: I, II, III or special level: S-1, S-2, S-3, S-4';
COMMENT ON COLUMN quality_settings.ncr_critical_response_hours IS 'SLA for critical NCR response (default 24 hours)';
COMMENT ON COLUMN quality_settings.ccp_deviation_escalation_minutes IS 'Time before CCP deviation escalates to QA Manager (default 15 minutes)';
COMMENT ON COLUMN quality_settings.retention_years IS 'Quality record retention period in years (1-50)';
