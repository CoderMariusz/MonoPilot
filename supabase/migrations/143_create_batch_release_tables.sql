-- =============================================================================
-- Migration 143: Create Batch Release Tables (Story 06.11)
-- Purpose: Final inspection batch release workflow for finished goods
-- Critical for: Quality control, batch release approval, shipping gate
-- =============================================================================

-- =============================================================================
-- Add Release Status Columns to License Plates (if not exists)
-- =============================================================================

-- Add release_status column
ALTER TABLE license_plates
ADD COLUMN IF NOT EXISTS release_status TEXT DEFAULT 'pending'
    CHECK (release_status IN ('pending', 'released', 'hold', 'rejected'));

-- Add release metadata columns
ALTER TABLE license_plates
ADD COLUMN IF NOT EXISTS released_by UUID REFERENCES users(id);

ALTER TABLE license_plates
ADD COLUMN IF NOT EXISTS released_at TIMESTAMPTZ;

ALTER TABLE license_plates
ADD COLUMN IF NOT EXISTS release_notes TEXT;

-- Index for shipping module queries
CREATE INDEX IF NOT EXISTS idx_lp_release_status
    ON license_plates(org_id, release_status)
    WHERE release_status = 'released';

-- =============================================================================
-- Batch Release Records Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS batch_release_records (
    -- Identity
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                  UUID NOT NULL REFERENCES organizations(id),
    release_number          TEXT NOT NULL,

    -- Batch Reference
    batch_number            TEXT NOT NULL,
    wo_id                   UUID REFERENCES work_orders(id),
    product_id              UUID NOT NULL REFERENCES products(id),

    -- Inspection Reference
    final_inspection_id     UUID REFERENCES quality_inspections(id),

    -- Release Checklist Status
    checklist_test_results  BOOLEAN DEFAULT false,  -- All tests passed
    checklist_ccp_records   BOOLEAN DEFAULT false,  -- All CCPs within limits
    checklist_checkpoints   BOOLEAN DEFAULT false,  -- All checkpoints passed
    checklist_label_verify  BOOLEAN DEFAULT false,  -- Labels verified
    checklist_spec_review   BOOLEAN DEFAULT false,  -- Spec compliance confirmed
    checklist_ncr_review    BOOLEAN DEFAULT false,  -- No open NCRs (or resolved)

    -- Release Decision
    release_decision        TEXT NOT NULL DEFAULT 'pending'
                            CHECK (release_decision IN ('pending', 'approved', 'rejected', 'conditional')),
    release_reason          TEXT,

    -- Conditional Release Details
    conditional_reason      TEXT,
    conditional_restrictions TEXT,
    conditional_expires_at  TIMESTAMPTZ,

    -- Quantities
    total_quantity          DECIMAL(15,4),
    released_quantity       DECIMAL(15,4),
    rejected_quantity       DECIMAL(15,4),

    -- Approval Workflow
    submitted_by            UUID REFERENCES users(id),
    submitted_at            TIMESTAMPTZ,
    approved_by             UUID REFERENCES users(id),
    approved_at             TIMESTAMPTZ,
    approval_notes          TEXT,

    -- E-Signature Ready Fields (Phase 3)
    signature_meaning       TEXT,  -- "I approve release of this batch"
    signature_timestamp     TIMESTAMPTZ,

    -- Audit
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              UUID REFERENCES users(id),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by              UUID REFERENCES users(id),

    -- Constraints
    CONSTRAINT uq_batch_release_number UNIQUE (org_id, release_number)
);

COMMENT ON TABLE batch_release_records IS 'Batch release records for final inspection approval workflow';
COMMENT ON COLUMN batch_release_records.release_decision IS 'pending (awaiting approval), approved (released), rejected, conditional (approved with restrictions)';

-- =============================================================================
-- Indexes for Performance
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_batch_release_org_status ON batch_release_records(org_id, release_decision);
CREATE INDEX IF NOT EXISTS idx_batch_release_batch ON batch_release_records(org_id, batch_number);
CREATE INDEX IF NOT EXISTS idx_batch_release_wo ON batch_release_records(wo_id) WHERE wo_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_batch_release_product ON batch_release_records(product_id);
CREATE INDEX IF NOT EXISTS idx_batch_release_pending ON batch_release_records(org_id, release_decision)
    WHERE release_decision = 'pending';
CREATE INDEX IF NOT EXISTS idx_batch_release_approved_by ON batch_release_records(approved_by)
    WHERE approved_by IS NOT NULL;

-- =============================================================================
-- Release Number Sequence
-- =============================================================================

CREATE TABLE IF NOT EXISTS release_number_sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    current_value BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(org_id, year)
);

-- =============================================================================
-- Function to Generate Release Number (REL-YYYY-NNNNN)
-- =============================================================================

CREATE OR REPLACE FUNCTION generate_release_number(p_org_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_year INTEGER;
    v_next_val BIGINT;
    v_release_number TEXT;
BEGIN
    v_year := EXTRACT(YEAR FROM CURRENT_DATE);

    -- Upsert sequence and get next value
    INSERT INTO release_number_sequences (org_id, year, current_value)
    VALUES (p_org_id, v_year, 1)
    ON CONFLICT (org_id, year)
    DO UPDATE SET
        current_value = release_number_sequences.current_value + 1,
        updated_at = NOW()
    RETURNING current_value INTO v_next_val;

    -- Format release number
    v_release_number := 'REL-' || v_year::TEXT || '-' || LPAD(v_next_val::TEXT, 5, '0');

    RETURN v_release_number;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Trigger for Auto-Numbering Release
-- =============================================================================

CREATE OR REPLACE FUNCTION set_release_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.release_number IS NULL OR NEW.release_number = '' THEN
        NEW.release_number := generate_release_number(NEW.org_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_set_release_number
    BEFORE INSERT ON batch_release_records
    FOR EACH ROW
    EXECUTE FUNCTION set_release_number();

-- =============================================================================
-- RLS Policies
-- =============================================================================

ALTER TABLE batch_release_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "batch_release_select" ON batch_release_records
    FOR SELECT USING (
        org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    );

CREATE POLICY "batch_release_insert" ON batch_release_records
    FOR INSERT WITH CHECK (
        org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    );

CREATE POLICY "batch_release_update" ON batch_release_records
    FOR UPDATE USING (
        org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    );

-- Only allow delete of pending releases
CREATE POLICY "batch_release_delete" ON batch_release_records
    FOR DELETE USING (
        org_id = (SELECT org_id FROM users WHERE id = auth.uid())
        AND release_decision = 'pending'
    );

ALTER TABLE release_number_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "release_seq_org" ON release_number_sequences
    FOR ALL TO authenticated
    USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- =============================================================================
-- Junction Table: Released LPs
-- =============================================================================

CREATE TABLE IF NOT EXISTS batch_release_lps (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    release_id              UUID NOT NULL REFERENCES batch_release_records(id) ON DELETE CASCADE,
    lp_id                   UUID NOT NULL REFERENCES license_plates(id),
    quantity                DECIMAL(15,4),
    release_status          TEXT NOT NULL DEFAULT 'released'
                            CHECK (release_status IN ('released', 'hold', 'rejected')),
    notes                   TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE(release_id, lp_id)
);

CREATE INDEX IF NOT EXISTS idx_batch_release_lps_release ON batch_release_lps(release_id);
CREATE INDEX IF NOT EXISTS idx_batch_release_lps_lp ON batch_release_lps(lp_id);

ALTER TABLE batch_release_lps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "batch_release_lps_policy" ON batch_release_lps
    FOR ALL TO authenticated
    USING (
        release_id IN (
            SELECT id FROM batch_release_records
            WHERE org_id = (SELECT org_id FROM users WHERE id = auth.uid())
        )
    );

-- =============================================================================
-- Trigger for updated_at
-- =============================================================================

CREATE TRIGGER update_batch_release_records_updated_at
    BEFORE UPDATE ON batch_release_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Function: Auto-create Final Inspection on WO Completion
-- =============================================================================

CREATE OR REPLACE FUNCTION create_final_inspection_on_wo_complete()
RETURNS TRIGGER AS $$
DECLARE
    v_settings RECORD;
    v_spec_id UUID;
    v_inspection_number TEXT;
BEGIN
    -- Only trigger on WO status change to 'completed'
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN

        -- Check if auto-create is enabled
        SELECT * INTO v_settings
        FROM quality_settings
        WHERE org_id = NEW.org_id;

        IF v_settings.require_final_inspection = true THEN

            -- Get active specification for product (if exists)
            SELECT id INTO v_spec_id
            FROM quality_specifications
            WHERE org_id = NEW.org_id
              AND product_id = NEW.product_id
              AND status = 'active'
            ORDER BY effective_date DESC
            LIMIT 1;

            -- Generate inspection number
            v_inspection_number := generate_inspection_number(NEW.org_id, 'final');

            -- Create single final inspection for the WO batch
            INSERT INTO quality_inspections (
                org_id,
                inspection_number,
                inspection_type,
                reference_type,
                reference_id,
                product_id,
                spec_id,
                batch_number,
                lot_size,
                status,
                scheduled_date,
                priority,
                created_by
            ) VALUES (
                NEW.org_id,
                v_inspection_number,
                'final',
                'wo',
                NEW.id,
                NEW.product_id,
                v_spec_id,
                (SELECT batch_number FROM work_orders WHERE id = NEW.id),
                NEW.produced_quantity::INTEGER,
                'scheduled',
                CURRENT_DATE,
                'high',  -- Final inspections are high priority
                NEW.updated_by
            );

        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on work_orders table
DROP TRIGGER IF EXISTS trigger_create_final_inspection_on_wo_complete ON work_orders;
CREATE TRIGGER trigger_create_final_inspection_on_wo_complete
    AFTER UPDATE ON work_orders
    FOR EACH ROW
    EXECUTE FUNCTION create_final_inspection_on_wo_complete();

-- =============================================================================
-- Function: Update LP Release Status on Batch Release Approval
-- =============================================================================

CREATE OR REPLACE FUNCTION update_lp_release_status_on_batch_release()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger on release approval
    IF NEW.release_decision = 'approved' AND (OLD.release_decision IS NULL OR OLD.release_decision != 'approved') THEN

        -- Update all LPs in this release with released status
        UPDATE license_plates lp
        SET
            release_status = 'released',
            released_by = NEW.approved_by,
            released_at = NOW()
        FROM batch_release_lps brl
        WHERE brl.release_id = NEW.id
          AND brl.lp_id = lp.id
          AND brl.release_status = 'released';

        -- Update rejected LPs
        UPDATE license_plates lp
        SET
            release_status = 'rejected',
            updated_at = NOW()
        FROM batch_release_lps brl
        WHERE brl.release_id = NEW.id
          AND brl.lp_id = lp.id
          AND brl.release_status = 'rejected';

    -- Handle rejection
    ELSIF NEW.release_decision = 'rejected' AND (OLD.release_decision IS NULL OR OLD.release_decision != 'rejected') THEN

        -- Update all LPs to rejected
        UPDATE license_plates lp
        SET
            release_status = 'rejected',
            updated_at = NOW()
        FROM batch_release_lps brl
        WHERE brl.release_id = NEW.id
          AND brl.lp_id = lp.id;

    -- Handle conditional approval (same as approved for LP status)
    ELSIF NEW.release_decision = 'conditional' AND (OLD.release_decision IS NULL OR OLD.release_decision != 'conditional') THEN

        -- Update all LPs in this release with released status
        UPDATE license_plates lp
        SET
            release_status = 'released',
            released_by = NEW.approved_by,
            released_at = NOW(),
            release_notes = NEW.conditional_restrictions
        FROM batch_release_lps brl
        WHERE brl.release_id = NEW.id
          AND brl.lp_id = lp.id
          AND brl.release_status = 'released';

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_lp_release_status ON batch_release_records;
CREATE TRIGGER trigger_update_lp_release_status
    AFTER UPDATE ON batch_release_records
    FOR EACH ROW
    EXECUTE FUNCTION update_lp_release_status_on_batch_release();

-- =============================================================================
-- Add batch_number column to work_orders if not exists
-- =============================================================================

ALTER TABLE work_orders
ADD COLUMN IF NOT EXISTS batch_number TEXT;

-- Index for batch number queries
CREATE INDEX IF NOT EXISTS idx_wo_batch_number ON work_orders(org_id, batch_number)
    WHERE batch_number IS NOT NULL;

-- =============================================================================
-- Grant Permissions
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON batch_release_records TO authenticated;
GRANT SELECT, INSERT, UPDATE ON release_number_sequences TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON batch_release_lps TO authenticated;

-- =============================================================================
-- PART 2: NCR Reports (from 143_create_ncr_reports)
-- =============================================================================

-- =============================================================================
-- Migration 143: Create NCR Reports Table (Story 06.9)
-- Purpose: Non-Conformance Report management for quality issue tracking
-- Phase: 1 - Basic NCR Creation (draft, open, closed)
-- =============================================================================

-- =============================================================================
-- NCR Reports Table (Phase 1 - Basic)
-- =============================================================================
-- NOTE: This is Phase 1 version with simplified status (draft, open, closed)
-- Story 06.13 will expand to full workflow states

CREATE TABLE IF NOT EXISTS ncr_reports (
    -- Identity
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    ncr_number              TEXT NOT NULL,

    -- Basic Information
    title                   TEXT NOT NULL,
    description             TEXT NOT NULL,

    -- Severity and Status
    severity                TEXT NOT NULL
                            CHECK (severity IN ('minor', 'major', 'critical')),
    status                  TEXT NOT NULL DEFAULT 'draft'
                            CHECK (status IN ('draft', 'open', 'closed')),
    -- NOTE: Phase 2 (story 06.13) will expand status to:
    -- 'draft', 'open', 'investigation', 'root_cause', 'corrective_action', 'verification', 'closed', 'reopened'

    -- Category (optional)
    category                TEXT
                            CHECK (category IS NULL OR category IN ('product_defect', 'process_deviation', 'documentation_error',
                                                'equipment_failure', 'supplier_issue', 'customer_complaint', 'other')),

    -- Detection
    detection_point         TEXT NOT NULL
                            CHECK (detection_point IN ('incoming', 'in_process', 'final', 'customer', 'internal_audit', 'supplier_audit', 'other')),
    detected_date           TIMESTAMPTZ NOT NULL DEFAULT now(),
    detected_by             UUID NOT NULL REFERENCES users(id),

    -- Source Reference (polymorphic - optional in Phase 1)
    source_type             TEXT
                            CHECK (source_type IS NULL OR source_type IN ('inspection', 'hold', 'batch', 'work_order', 'supplier', 'customer_complaint', 'audit', 'other')),
    source_id               UUID,
    source_description      TEXT,  -- Human-readable source reference

    -- Assignment (optional in Phase 1)
    assigned_to             UUID REFERENCES users(id),
    assigned_at             TIMESTAMPTZ,

    -- Closure (Phase 1 - simple closure)
    closed_at               TIMESTAMPTZ,
    closed_by               UUID REFERENCES users(id),
    closure_notes           TEXT,

    -- Audit
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              UUID REFERENCES users(id),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by              UUID REFERENCES users(id),

    -- Constraints
    CONSTRAINT uq_ncr_number UNIQUE (org_id, ncr_number),
    CONSTRAINT check_closed_fields CHECK (
        (status = 'closed' AND closed_at IS NOT NULL AND closed_by IS NOT NULL)
        OR (status != 'closed' AND closed_at IS NULL AND closed_by IS NULL)
    )
);

COMMENT ON TABLE ncr_reports IS 'Non-Conformance Reports (Phase 1 - Basic). Expanded workflow in story 06.13';
COMMENT ON COLUMN ncr_reports.status IS 'Phase 1: draft, open, closed. Phase 2 (06.13): full workflow states';
COMMENT ON COLUMN ncr_reports.source_type IS 'Polymorphic reference to inspection, hold, batch, etc.';
COMMENT ON COLUMN ncr_reports.detection_point IS 'Where was the non-conformance detected';
COMMENT ON COLUMN ncr_reports.category IS 'Type of non-conformance (product, process, equipment, etc.)';

-- =============================================================================
-- Indexes for Performance
-- =============================================================================

CREATE INDEX idx_ncr_org_status ON ncr_reports(org_id, status);
CREATE INDEX idx_ncr_org_severity ON ncr_reports(org_id, severity);
CREATE INDEX idx_ncr_detection_point ON ncr_reports(org_id, detection_point);
CREATE INDEX idx_ncr_detected_date ON ncr_reports(org_id, detected_date DESC);
CREATE INDEX idx_ncr_detected_by ON ncr_reports(detected_by);
CREATE INDEX idx_ncr_assigned_to ON ncr_reports(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_ncr_source ON ncr_reports(source_type, source_id) WHERE source_type IS NOT NULL;
CREATE INDEX idx_ncr_created ON ncr_reports(org_id, created_at DESC);

-- Composite index for list queries
CREATE INDEX idx_ncr_list_query ON ncr_reports(org_id, status, severity, detected_date DESC);

-- =============================================================================
-- NCR Number Sequence Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS ncr_number_sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    current_value BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(org_id, year)
);

COMMENT ON TABLE ncr_number_sequences IS 'Yearly sequence for NCR number generation (NCR-YYYY-NNNNN)';

-- =============================================================================
-- Function to Generate NCR Number (NCR-YYYY-NNNNN)
-- =============================================================================

CREATE OR REPLACE FUNCTION generate_ncr_number(p_org_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_year INTEGER;
    v_next_val BIGINT;
    v_ncr_number TEXT;
BEGIN
    v_year := EXTRACT(YEAR FROM CURRENT_DATE);

    -- Upsert sequence and get next value
    INSERT INTO ncr_number_sequences (org_id, year, current_value)
    VALUES (p_org_id, v_year, 1)
    ON CONFLICT (org_id, year)
    DO UPDATE SET
        current_value = ncr_number_sequences.current_value + 1,
        updated_at = NOW()
    RETURNING current_value INTO v_next_val;

    -- Format NCR number: NCR-YYYY-NNNNN
    v_ncr_number := 'NCR-' || v_year::TEXT || '-' || LPAD(v_next_val::TEXT, 5, '0');

    RETURN v_ncr_number;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Trigger for Auto-Numbering NCR
-- =============================================================================

CREATE OR REPLACE FUNCTION set_ncr_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ncr_number IS NULL OR NEW.ncr_number = '' THEN
        NEW.ncr_number := generate_ncr_number(NEW.org_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_set_ncr_number
    BEFORE INSERT ON ncr_reports
    FOR EACH ROW
    EXECUTE FUNCTION set_ncr_number();

-- =============================================================================
-- Trigger for updated_at
-- =============================================================================

CREATE TRIGGER update_ncr_reports_updated_at
    BEFORE UPDATE ON ncr_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- RLS Policies
-- =============================================================================

ALTER TABLE ncr_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ncr_select" ON ncr_reports
    FOR SELECT USING (
        org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    );

CREATE POLICY "ncr_insert" ON ncr_reports
    FOR INSERT WITH CHECK (
        org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    );

CREATE POLICY "ncr_update" ON ncr_reports
    FOR UPDATE USING (
        org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    );

-- Only allow delete of draft NCRs
CREATE POLICY "ncr_delete" ON ncr_reports
    FOR DELETE USING (
        org_id = (SELECT org_id FROM users WHERE id = auth.uid())
        AND status = 'draft'
    );

ALTER TABLE ncr_number_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ncr_seq_org" ON ncr_number_sequences
    FOR ALL TO authenticated
    USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- =============================================================================
-- Grant Permissions
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON ncr_reports TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ncr_number_sequences TO authenticated;

-- =============================================================================
-- PART 3: Scanner Offline Queue (from 143_create_scanner_offline_queue)
-- =============================================================================

-- =============================================================================
-- Migration 143: Create Scanner Offline Queue Table (Story 06.8)
-- Purpose: Scanner offline queue for QA inspections
-- Critical for: Scanner QA Pass/Fail workflow, offline support
-- =============================================================================

-- =============================================================================
-- Scanner Offline Queue Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS scanner_offline_queue (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                  UUID NOT NULL REFERENCES organizations(id),
    user_id                 UUID NOT NULL REFERENCES users(id),

    -- Action tracking
    action_type             TEXT NOT NULL CHECK (action_type IN ('quick_inspection', 'test_result', 'qa_status_update')),
    action_payload          JSONB NOT NULL,

    -- Metadata
    device_id               TEXT,  -- Device identifier (for debugging)
    created_at_local        TIMESTAMPTZ NOT NULL,  -- Local device timestamp
    synced_at               TIMESTAMPTZ DEFAULT now(),  -- Server sync timestamp

    -- Status
    sync_status             TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'failed', 'duplicate')),
    error_message           TEXT,

    -- Audit
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE scanner_offline_queue IS 'Offline scanner actions synced to server';
COMMENT ON COLUMN scanner_offline_queue.action_payload IS 'JSON payload of the action (inspection data, test results, etc.)';
COMMENT ON COLUMN scanner_offline_queue.created_at_local IS 'Timestamp when action was created on device (may differ from synced_at)';

-- =============================================================================
-- Indexes for Performance
-- =============================================================================

CREATE INDEX idx_scanner_queue_org ON scanner_offline_queue(org_id);
CREATE INDEX idx_scanner_queue_user ON scanner_offline_queue(user_id);
CREATE INDEX idx_scanner_queue_sync_status ON scanner_offline_queue(sync_status);
CREATE INDEX idx_scanner_queue_created ON scanner_offline_queue(created_at);

-- =============================================================================
-- Add Scanner Metadata to Quality Inspections
-- =============================================================================

ALTER TABLE quality_inspections
    ADD COLUMN IF NOT EXISTS inspection_method TEXT DEFAULT 'desktop' CHECK (inspection_method IN ('desktop', 'scanner')),
    ADD COLUMN IF NOT EXISTS scanner_device_id TEXT,
    ADD COLUMN IF NOT EXISTS scanner_location TEXT,  -- Optional GPS coordinates
    ADD COLUMN IF NOT EXISTS inspection_duration_seconds INTEGER;  -- Time to complete

-- Index for scanner inspections
CREATE INDEX IF NOT EXISTS idx_inspections_method ON quality_inspections(org_id, inspection_method);

COMMENT ON COLUMN quality_inspections.inspection_method IS 'How inspection was performed (desktop or scanner)';
COMMENT ON COLUMN quality_inspections.scanner_device_id IS 'Device ID for scanner inspections (for analytics)';
COMMENT ON COLUMN quality_inspections.inspection_duration_seconds IS 'Time from start to complete (for performance tracking)';

-- =============================================================================
-- RLS Policies
-- =============================================================================

ALTER TABLE scanner_offline_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scanner_queue_select" ON scanner_offline_queue
    FOR SELECT USING (
        org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    );

CREATE POLICY "scanner_queue_insert" ON scanner_offline_queue
    FOR INSERT WITH CHECK (
        org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    );

CREATE POLICY "scanner_queue_update" ON scanner_offline_queue
    FOR UPDATE USING (
        org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    );

-- =============================================================================
-- Grant Permissions
-- =============================================================================

GRANT SELECT, INSERT, UPDATE ON scanner_offline_queue TO authenticated;

-- =============================================================================
-- Quality Audit Log Table (for scanner and all quality actions)
-- =============================================================================

CREATE TABLE IF NOT EXISTS quality_audit_log (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                  UUID REFERENCES organizations(id),

    -- Entity reference
    entity_type             TEXT NOT NULL,  -- 'inspection', 'hold', 'specification', etc.
    entity_id               UUID NOT NULL,

    -- Action tracking
    action                  TEXT NOT NULL,  -- 'scanner_complete', 'status_change', 'create', etc.
    user_id                 UUID REFERENCES users(id),

    -- Change tracking
    old_value               JSONB,
    new_value               JSONB,
    change_reason           TEXT,

    -- Metadata
    metadata                JSONB,  -- Additional context (device_id, offline_queued, etc.)

    -- Timestamp (use server time for consistency)
    timestamp               TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Audit
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE quality_audit_log IS 'Audit trail for all quality-related actions';
COMMENT ON COLUMN quality_audit_log.entity_type IS 'Type of entity (inspection, hold, specification)';
COMMENT ON COLUMN quality_audit_log.action IS 'Action performed (scanner_complete, status_change, create)';
COMMENT ON COLUMN quality_audit_log.metadata IS 'Additional context like device_id, offline_queued flag';

-- Indexes for query performance
CREATE INDEX idx_quality_audit_org ON quality_audit_log(org_id);
CREATE INDEX idx_quality_audit_entity ON quality_audit_log(entity_type, entity_id);
CREATE INDEX idx_quality_audit_user ON quality_audit_log(user_id);
CREATE INDEX idx_quality_audit_timestamp ON quality_audit_log(timestamp DESC);

-- RLS Policies
ALTER TABLE quality_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quality_audit_select" ON quality_audit_log
    FOR SELECT USING (
        org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    );

CREATE POLICY "quality_audit_insert" ON quality_audit_log
    FOR INSERT WITH CHECK (
        org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    );

-- Grant permissions
GRANT SELECT, INSERT ON quality_audit_log TO authenticated;
