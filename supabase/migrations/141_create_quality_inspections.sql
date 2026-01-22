-- =============================================================================
-- Migration 141: Create Quality Inspections Tables (Story 06.5)
-- Purpose: Incoming inspection workflow for goods received via GRN
-- Critical for: Quality control, LP QA status management, food safety compliance
-- =============================================================================

-- =============================================================================
-- Quality Inspections Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS quality_inspections (
    -- Identity
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                  UUID NOT NULL REFERENCES organizations(id),
    inspection_number       TEXT NOT NULL,

    -- Type and Classification
    inspection_type         TEXT NOT NULL
                            CHECK (inspection_type IN ('incoming', 'in_process', 'final')),

    -- Source Reference (polymorphic - one populated based on type)
    reference_type          TEXT NOT NULL
                            CHECK (reference_type IN ('po', 'grn', 'wo', 'lp', 'batch')),
    reference_id            UUID NOT NULL,

    -- Product and Specification
    product_id              UUID NOT NULL REFERENCES products(id),
    spec_id                 UUID REFERENCES quality_specifications(id),

    -- LP Reference (for incoming, the received LP)
    lp_id                   UUID REFERENCES license_plates(id),
    grn_id                  UUID REFERENCES grns(id),
    po_id                   UUID REFERENCES purchase_orders(id),

    -- Batch Tracking
    batch_number            TEXT,
    lot_size                INTEGER,
    sample_size             INTEGER,
    sampling_plan_id        UUID, -- Future: REFERENCES sampling_plans(id)

    -- Assignment
    inspector_id            UUID REFERENCES users(id),
    assigned_by             UUID REFERENCES users(id),
    assigned_at             TIMESTAMPTZ,

    -- Workflow Status
    status                  TEXT NOT NULL DEFAULT 'scheduled'
                            CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),

    -- Scheduling
    scheduled_date          DATE,
    priority                TEXT DEFAULT 'normal'
                            CHECK (priority IN ('low', 'normal', 'high', 'urgent')),

    -- Execution
    started_at              TIMESTAMPTZ,
    completed_at            TIMESTAMPTZ,
    completed_by            UUID REFERENCES users(id),

    -- Results
    result                  TEXT
                            CHECK (result IS NULL OR result IN ('pass', 'fail', 'conditional')),
    result_notes            TEXT,

    -- Defect Counts
    defects_found           INTEGER DEFAULT 0,
    major_defects           INTEGER DEFAULT 0,
    minor_defects           INTEGER DEFAULT 0,
    critical_defects        INTEGER DEFAULT 0,

    -- Conditional Approval
    conditional_reason      TEXT,
    conditional_restrictions TEXT,
    conditional_approved_by UUID REFERENCES users(id),
    conditional_expires_at  TIMESTAMPTZ,

    -- NCR Linkage (populated if inspection triggers NCR)
    ncr_id                  UUID, -- Future: REFERENCES ncr_reports(id)

    -- Audit
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              UUID REFERENCES users(id),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by              UUID REFERENCES users(id),

    -- Constraints
    CONSTRAINT uq_inspection_number UNIQUE (org_id, inspection_number)
);

COMMENT ON TABLE quality_inspections IS 'Quality inspections for incoming goods, in-process, and final inspection';
COMMENT ON COLUMN quality_inspections.inspection_type IS 'incoming (receiving), in_process (WIP), final (finished goods)';
COMMENT ON COLUMN quality_inspections.reference_type IS 'Source of inspection: po, grn, wo, lp, batch';
COMMENT ON COLUMN quality_inspections.result IS 'pass (approved), fail (rejected), conditional (approved with restrictions)';

-- =============================================================================
-- Indexes for Performance
-- =============================================================================

CREATE INDEX idx_inspections_org_status ON quality_inspections(org_id, status);
CREATE INDEX idx_inspections_org_type ON quality_inspections(org_id, inspection_type);
CREATE INDEX idx_inspections_type_status ON quality_inspections(org_id, inspection_type, status);
CREATE INDEX idx_inspections_product ON quality_inspections(product_id);
CREATE INDEX idx_inspections_lp ON quality_inspections(lp_id) WHERE lp_id IS NOT NULL;
CREATE INDEX idx_inspections_grn ON quality_inspections(grn_id) WHERE grn_id IS NOT NULL;
CREATE INDEX idx_inspections_po ON quality_inspections(po_id) WHERE po_id IS NOT NULL;
CREATE INDEX idx_inspections_inspector ON quality_inspections(inspector_id) WHERE inspector_id IS NOT NULL;
CREATE INDEX idx_inspections_scheduled ON quality_inspections(org_id, scheduled_date)
    WHERE status = 'scheduled';
CREATE INDEX idx_inspections_pending ON quality_inspections(org_id, inspection_type, status)
    WHERE status IN ('scheduled', 'in_progress');
CREATE INDEX idx_inspections_created ON quality_inspections(org_id, created_at);

-- =============================================================================
-- Inspection Number Sequence
-- =============================================================================

CREATE TABLE IF NOT EXISTS inspection_number_sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    inspection_type TEXT NOT NULL,
    current_value BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(org_id, year, inspection_type)
);

-- =============================================================================
-- Function to Generate Inspection Number (INS-TYPE-YYYY-NNNNN)
-- =============================================================================

CREATE OR REPLACE FUNCTION generate_inspection_number(p_org_id UUID, p_type TEXT)
RETURNS TEXT AS $$
DECLARE
    v_year INTEGER;
    v_next_val BIGINT;
    v_prefix TEXT;
    v_inspection_number TEXT;
BEGIN
    v_year := EXTRACT(YEAR FROM CURRENT_DATE);

    -- Determine prefix based on type
    CASE p_type
        WHEN 'incoming' THEN v_prefix := 'INC';
        WHEN 'in_process' THEN v_prefix := 'IPR';
        WHEN 'final' THEN v_prefix := 'FIN';
        ELSE v_prefix := 'INS';
    END CASE;

    -- Upsert sequence and get next value
    INSERT INTO inspection_number_sequences (org_id, year, inspection_type, current_value)
    VALUES (p_org_id, v_year, p_type, 1)
    ON CONFLICT (org_id, year, inspection_type)
    DO UPDATE SET
        current_value = inspection_number_sequences.current_value + 1,
        updated_at = NOW()
    RETURNING current_value INTO v_next_val;

    -- Format inspection number
    v_inspection_number := 'INS-' || v_prefix || '-' || v_year::TEXT || '-' || LPAD(v_next_val::TEXT, 5, '0');

    RETURN v_inspection_number;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Trigger for Auto-Numbering Inspection
-- =============================================================================

CREATE OR REPLACE FUNCTION set_inspection_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.inspection_number IS NULL OR NEW.inspection_number = '' THEN
        NEW.inspection_number := generate_inspection_number(NEW.org_id, NEW.inspection_type);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_set_inspection_number
    BEFORE INSERT ON quality_inspections
    FOR EACH ROW
    EXECUTE FUNCTION set_inspection_number();

-- =============================================================================
-- RLS Policies
-- =============================================================================

ALTER TABLE quality_inspections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inspections_select" ON quality_inspections
    FOR SELECT USING (
        org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    );

CREATE POLICY "inspections_insert" ON quality_inspections
    FOR INSERT WITH CHECK (
        org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    );

CREATE POLICY "inspections_update" ON quality_inspections
    FOR UPDATE USING (
        org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    );

-- Only allow delete of scheduled inspections (not started)
CREATE POLICY "inspections_delete" ON quality_inspections
    FOR DELETE USING (
        org_id = (SELECT org_id FROM users WHERE id = auth.uid())
        AND status = 'scheduled'
    );

ALTER TABLE inspection_number_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "insp_seq_org" ON inspection_number_sequences
    FOR ALL TO authenticated
    USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- =============================================================================
-- Trigger for updated_at
-- =============================================================================

CREATE TRIGGER update_quality_inspections_updated_at
    BEFORE UPDATE ON quality_inspections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Function: Update LP QA Status on Inspection Completion
-- =============================================================================

CREATE OR REPLACE FUNCTION update_lp_qa_status_on_inspection()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger on inspection completion
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN

        -- Update LP QA status based on result
        IF NEW.lp_id IS NOT NULL THEN
            UPDATE license_plates
            SET qa_status = CASE NEW.result
                WHEN 'pass' THEN 'passed'
                WHEN 'fail' THEN 'failed'
                WHEN 'conditional' THEN 'conditional'
                ELSE 'pending'
            END,
            updated_at = NOW()
            WHERE id = NEW.lp_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_lp_qa_status
    AFTER UPDATE ON quality_inspections
    FOR EACH ROW
    EXECUTE FUNCTION update_lp_qa_status_on_inspection();

-- =============================================================================
-- Function: Auto-Create Inspection on GRN Completion
-- =============================================================================

CREATE OR REPLACE FUNCTION create_incoming_inspection_on_grn()
RETURNS TRIGGER AS $$
DECLARE
    v_settings RECORD;
    v_grn_item RECORD;
    v_spec_id UUID;
    v_inspection_number TEXT;
BEGIN
    -- Only trigger on GRN status change to 'completed'
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN

        -- Check if auto-create is enabled
        SELECT * INTO v_settings
        FROM quality_settings
        WHERE org_id = NEW.org_id;

        IF v_settings.auto_create_inspection_on_grn = true THEN

            -- Create inspection for each GRN item with an LP
            FOR v_grn_item IN
                SELECT gi.*, lp.id as lp_uuid
                FROM grn_items gi
                LEFT JOIN license_plates lp ON lp.id = gi.lp_id
                WHERE gi.grn_id = NEW.id
                  AND gi.lp_id IS NOT NULL
            LOOP
                -- Get active specification for product (if exists)
                SELECT id INTO v_spec_id
                FROM quality_specifications
                WHERE org_id = NEW.org_id
                  AND product_id = v_grn_item.product_id
                  AND status = 'active'
                ORDER BY effective_date DESC
                LIMIT 1;

                -- Generate inspection number
                v_inspection_number := generate_inspection_number(NEW.org_id, 'incoming');

                -- Create inspection record
                INSERT INTO quality_inspections (
                    org_id,
                    inspection_number,
                    inspection_type,
                    reference_type,
                    reference_id,
                    product_id,
                    spec_id,
                    lp_id,
                    grn_id,
                    po_id,
                    batch_number,
                    status,
                    scheduled_date,
                    priority,
                    created_by
                ) VALUES (
                    NEW.org_id,
                    v_inspection_number,
                    'incoming',
                    'grn',
                    NEW.id,
                    v_grn_item.product_id,
                    v_spec_id,
                    v_grn_item.lp_uuid,
                    NEW.id,
                    NEW.po_id,
                    v_grn_item.batch_number,
                    'scheduled',
                    CURRENT_DATE,
                    'normal',
                    NEW.received_by
                );

            END LOOP;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on grns table for auto-create
CREATE TRIGGER trigger_create_incoming_inspection
    AFTER UPDATE ON grns
    FOR EACH ROW
    EXECUTE FUNCTION create_incoming_inspection_on_grn();

-- =============================================================================
-- Grant Permissions
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON quality_inspections TO authenticated;
GRANT SELECT, INSERT, UPDATE ON inspection_number_sequences TO authenticated;
