-- Migration 032: Create Recall Simulations Table
-- Epic 2 Batch 2D - Traceability (Story 2.20)
-- Stores recall simulation results for history, comparison, and regulatory reporting

CREATE TABLE IF NOT EXISTS public.recall_simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Input Parameters
  lp_id UUID REFERENCES license_plates(id) ON DELETE SET NULL,
  batch_number VARCHAR(50),
  include_shipped BOOLEAN NOT NULL DEFAULT true,
  include_notifications BOOLEAN NOT NULL DEFAULT true,

  -- Results (stored as JSONB for flexibility)
  summary JSONB NOT NULL,
  -- Structure: { total_affected_lps, total_quantity, total_value, locations, shipped_qty, customers_affected }

  forward_trace JSONB NOT NULL,
  -- Structure: TraceNode[] tree

  backward_trace JSONB NOT NULL,
  -- Structure: TraceNode[] tree

  regulatory_info JSONB,
  -- Structure: { reportable_to_fda, report_due_date, affected_products, ... }

  -- Metadata
  execution_time_ms INTEGER NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT recall_simulations_lp_or_batch CHECK (
    lp_id IS NOT NULL OR batch_number IS NOT NULL
  )
);

-- Indexes
CREATE INDEX idx_recall_simulations_org ON recall_simulations(org_id);
CREATE INDEX idx_recall_simulations_created ON recall_simulations(created_at DESC);
CREATE INDEX idx_recall_simulations_lp ON recall_simulations(lp_id) WHERE lp_id IS NOT NULL;
CREATE INDEX idx_recall_simulations_batch ON recall_simulations(batch_number) WHERE batch_number IS NOT NULL;
CREATE INDEX idx_recall_simulations_created_by ON recall_simulations(created_by) WHERE created_by IS NOT NULL;

-- GIN index for JSONB queries
CREATE INDEX idx_recall_simulations_summary_gin ON recall_simulations USING GIN (summary);

-- RLS Policies
ALTER TABLE recall_simulations ENABLE ROW LEVEL SECURITY;

-- SELECT: QC Manager/Technical/Admin can view simulations in their org
CREATE POLICY "Authorized users can view recall simulations in their org"
  ON recall_simulations FOR SELECT
  USING (
    org_id = (auth.jwt() ->> 'org_id')::uuid
    AND (auth.jwt() ->> 'role') IN ('qc_manager', 'technical', 'admin')
  );

-- INSERT: QC Manager/Technical/Admin can create simulations
CREATE POLICY "Authorized users can create recall simulations"
  ON recall_simulations FOR INSERT
  WITH CHECK (
    org_id = (auth.jwt() ->> 'org_id')::uuid
    AND (auth.jwt() ->> 'role') IN ('qc_manager', 'technical', 'admin')
  );

-- UPDATE/DELETE: Not allowed (immutable audit trail)
-- Simulation results are permanent records for compliance

-- Comments
COMMENT ON TABLE recall_simulations IS 'Recall simulation results for regulatory compliance and historical tracking. Immutable audit trail.';
COMMENT ON COLUMN recall_simulations.summary IS 'JSONB: Summary statistics (affected LPs, quantities, costs, locations)';
COMMENT ON COLUMN recall_simulations.forward_trace IS 'JSONB: Forward trace tree (where materials were used)';
COMMENT ON COLUMN recall_simulations.backward_trace IS 'JSONB: Backward trace tree (source materials)';
COMMENT ON COLUMN recall_simulations.regulatory_info IS 'JSONB: FDA/EU regulatory compliance data';
COMMENT ON COLUMN recall_simulations.execution_time_ms IS 'Performance tracking: simulation execution time in milliseconds';
