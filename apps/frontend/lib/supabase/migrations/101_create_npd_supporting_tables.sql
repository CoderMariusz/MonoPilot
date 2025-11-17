-- =============================================
-- Migration 101: Create Supporting NPD Tables
-- =============================================
-- Epic: NPD-6 (Database Schema & Infrastructure)
-- Story: NPD-6.2 - Create Supporting NPD Tables
-- Purpose: Costing, Risk, Documents, Events tables for NPD Module
-- Date: 2025-11-16
-- Dependencies: Migration 100 (npd_projects table)
-- Pattern: Follows master_migration.sql conventions + GENERATED ALWAYS AS columns
-- =============================================

-- =============================================
-- TABLE: npd_costing
-- =============================================
CREATE TABLE IF NOT EXISTS npd_costing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  npd_project_id UUID NOT NULL REFERENCES npd_projects(id) ON DELETE CASCADE,
  target_cost NUMERIC(15,4),
  estimated_cost NUMERIC(15,4),
  actual_cost NUMERIC(15,4),
  variance_pct NUMERIC(8,2) GENERATED ALWAYS AS (
    CASE
      WHEN target_cost IS NOT NULL AND target_cost != 0
      THEN ((actual_cost - target_cost) / target_cost * 100)
      ELSE NULL
    END
  ) STORED,
  currency TEXT DEFAULT 'USD',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_npd_costing_project_id ON npd_costing(npd_project_id);

COMMENT ON TABLE npd_costing IS 'NPD project costing with auto-calculated variance (target vs actual). Used for cost tracking and finance approval workflows.';
COMMENT ON COLUMN npd_costing.target_cost IS 'Target cost set during planning (Business Case gate G2)';
COMMENT ON COLUMN npd_costing.estimated_cost IS 'Estimated cost from formulation costing calculation';
COMMENT ON COLUMN npd_costing.actual_cost IS 'Actual cost after pilot run (populated during handoff)';
COMMENT ON COLUMN npd_costing.variance_pct IS 'Auto-calculated variance percentage: ((actual - target) / target * 100). Positive = over budget, Negative = under budget.';

-- =============================================
-- TABLE: npd_risks
-- =============================================
CREATE TABLE IF NOT EXISTS npd_risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  npd_project_id UUID NOT NULL REFERENCES npd_projects(id) ON DELETE CASCADE,
  risk_description TEXT NOT NULL,
  likelihood TEXT CHECK (likelihood IN ('low', 'medium', 'high')),
  impact TEXT CHECK (impact IN ('low', 'medium', 'high')),
  risk_score INTEGER GENERATED ALWAYS AS (
    (CASE likelihood
      WHEN 'high' THEN 3
      WHEN 'medium' THEN 2
      ELSE 1
    END) *
    (CASE impact
      WHEN 'high' THEN 3
      WHEN 'medium' THEN 2
      ELSE 1
    END)
  ) STORED,
  mitigation_plan TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'mitigated', 'accepted', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_npd_risks_project_id ON npd_risks(npd_project_id);
CREATE INDEX idx_npd_risks_score ON npd_risks(risk_score DESC);
CREATE INDEX idx_npd_risks_status ON npd_risks(status);

COMMENT ON TABLE npd_risks IS 'NPD risk register with auto-calculated risk scores (likelihood × impact). Risk matrix visualization uses scores 1-9.';
COMMENT ON COLUMN npd_risks.likelihood IS 'Probability of risk occurring: low (1), medium (2), high (3)';
COMMENT ON COLUMN npd_risks.impact IS 'Business impact if risk occurs: low (1), medium (2), high (3)';
COMMENT ON COLUMN npd_risks.risk_score IS 'Auto-calculated risk priority score (1-9). Formula: likelihood × impact. High risk = 9, Low risk = 1.';
COMMENT ON COLUMN npd_risks.status IS 'Risk lifecycle: open (identified) → mitigated (plan executed) → accepted (low priority) → closed (no longer relevant)';

-- =============================================
-- TABLE: npd_documents
-- =============================================
CREATE TABLE IF NOT EXISTS npd_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id INTEGER NOT NULL,
  npd_project_id UUID NOT NULL REFERENCES npd_projects(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_path TEXT NOT NULL,
  version TEXT DEFAULT '1.0',
  file_size BIGINT,
  mime_type TEXT,
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_npd_documents_org_id ON npd_documents(org_id);
CREATE INDEX idx_npd_documents_project_id ON npd_documents(npd_project_id);
CREATE INDEX idx_npd_documents_file_type ON npd_documents(file_type);

COMMENT ON TABLE npd_documents IS 'NPD document metadata for Supabase Storage. File path format: npd/{org_id}/{project_id}/{file_type}/{file_name}';
COMMENT ON COLUMN npd_documents.file_path IS 'Supabase Storage path. Format: npd/{org_id}/{project_id}/{file_type}/{file_name}. Hierarchical structure for RLS and cleanup.';
COMMENT ON COLUMN npd_documents.file_type IS 'Document category: formulation, costing, compliance, risk_analysis, lab_report, etc.';
COMMENT ON COLUMN npd_documents.version IS 'Document version (e.g., 1.0, 1.1, 2.0) for version control';
COMMENT ON COLUMN npd_documents.org_id IS 'Multi-tenant isolation - matches Supabase Storage RLS policies';

-- =============================================
-- TABLE: npd_events
-- =============================================
CREATE TABLE IF NOT EXISTS npd_events (
  id BIGSERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  retry_count INTEGER DEFAULT 0,
  error_message TEXT,
  sequence_number BIGSERIAL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX idx_npd_events_org_id ON npd_events(org_id);
CREATE INDEX idx_npd_events_type ON npd_events(type);
CREATE INDEX idx_npd_events_status ON npd_events(status);
CREATE INDEX idx_npd_events_sequence ON npd_events(sequence_number);
CREATE INDEX idx_npd_events_created_at ON npd_events(created_at);

COMMENT ON TABLE npd_events IS 'Outbox pattern for event sourcing. Used for NPD Handoff workflow (NPD → Production). Ensures transactional integrity with pg_notify + Edge Function processor.';
COMMENT ON COLUMN npd_events.type IS 'Event type. Examples: NPD.HandoffRequested, NPD.FormulationApproved, NPD.CostingUpdated';
COMMENT ON COLUMN npd_events.payload IS 'JSONB event data. Flexible schema for different event types. Contains project_id, formulation, product_decision, etc.';
COMMENT ON COLUMN npd_events.sequence_number IS 'BIGSERIAL auto-incrementing sequence for strict event ordering. Critical for event replay and consistency.';
COMMENT ON COLUMN npd_events.status IS 'Event processing status: pending (queued) → processing (Edge Function active) → completed (success) / failed (error)';
COMMENT ON COLUMN npd_events.retry_count IS 'Number of retry attempts for failed events. Max retries = 3 (configurable in Edge Function)';

-- =============================================
-- END OF MIGRATION 101
-- =============================================
-- Summary:
--   Tables created: 4 (npd_costing, npd_risks, npd_documents, npd_events)
--   GENERATED ALWAYS AS columns: 2 (variance_pct, risk_score)
--   Foreign keys: 3 (CASCADE to npd_projects)
--   Indexes: 11 (project_id, org_id, status, risk_score, sequence, type)
-- Next Story:
--   6.3 - Implement RLS Policies (secure all 7 npd_* tables)
-- =============================================
