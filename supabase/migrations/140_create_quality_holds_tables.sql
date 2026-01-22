-- =============================================================================
-- Migration 140: Create Quality Holds Tables (Story 06.2)
-- Purpose: Quality hold management for blocking inventory pending investigation
-- =============================================================================

-- =============================================================================
-- Quality Holds Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS quality_holds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    hold_number TEXT NOT NULL,
    reason TEXT NOT NULL,
    hold_type TEXT NOT NULL CHECK (hold_type IN ('qa_pending', 'investigation', 'recall', 'quarantine')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'released', 'disposed')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    held_by UUID NOT NULL REFERENCES users(id),
    held_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    released_by UUID REFERENCES users(id),
    released_at TIMESTAMPTZ,
    release_notes TEXT,
    disposition TEXT CHECK (disposition IN ('release', 'rework', 'scrap', 'return')),
    ncr_id UUID,  -- NCR table doesn't exist yet (Phase 2), no FK constraint
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),

    CONSTRAINT unique_hold_number_per_org UNIQUE(org_id, hold_number),
    CONSTRAINT released_fields_consistency CHECK (
        (status = 'released' AND released_by IS NOT NULL AND released_at IS NOT NULL) OR
        (status != 'released')
    ),
    CONSTRAINT disposition_on_release CHECK (
        (status = 'released' AND disposition IS NOT NULL) OR
        (status != 'released')
    )
);

COMMENT ON TABLE quality_holds IS 'Quality holds to block inventory from consumption pending investigation';
COMMENT ON COLUMN quality_holds.hold_type IS 'qa_pending (awaiting inspection), investigation (under review), recall (safety recall), quarantine (isolated)';
COMMENT ON COLUMN quality_holds.priority IS 'low, medium, high, critical (impacts aging alerts)';
COMMENT ON COLUMN quality_holds.disposition IS 'release (approve), rework (reprocess), scrap (destroy), return (send back to supplier)';

-- =============================================================================
-- Quality Hold Items Table (Generic Reference)
-- =============================================================================

CREATE TABLE IF NOT EXISTS quality_hold_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hold_id UUID NOT NULL REFERENCES quality_holds(id) ON DELETE CASCADE,
    reference_type TEXT NOT NULL CHECK (reference_type IN ('lp', 'wo', 'batch')),
    reference_id UUID NOT NULL,
    quantity_held DECIMAL(15,4),
    uom TEXT,
    location_id UUID REFERENCES locations(id),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT unique_hold_item_per_hold UNIQUE(hold_id, reference_type, reference_id)
);

COMMENT ON TABLE quality_hold_items IS 'Items (LPs, WOs, batches) placed on quality hold';

-- =============================================================================
-- Indexes for Performance
-- =============================================================================

CREATE INDEX idx_quality_holds_org_status ON quality_holds(org_id, status);
CREATE INDEX idx_quality_holds_org_held_at ON quality_holds(org_id, held_at DESC);
CREATE INDEX idx_quality_holds_org_priority ON quality_holds(org_id, priority) WHERE status = 'active';
CREATE INDEX idx_quality_holds_ncr ON quality_holds(ncr_id) WHERE ncr_id IS NOT NULL;
CREATE INDEX idx_quality_hold_items_hold ON quality_hold_items(hold_id);
CREATE INDEX idx_quality_hold_items_reference ON quality_hold_items(reference_type, reference_id);

-- =============================================================================
-- Hold Number Daily Sequence Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS quality_hold_sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    sequence_date DATE NOT NULL,
    current_value INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT unique_hold_sequence_per_org_date UNIQUE(org_id, sequence_date)
);

-- =============================================================================
-- Function to Generate Hold Number (QH-YYYYMMDD-NNNN)
-- =============================================================================

CREATE OR REPLACE FUNCTION generate_hold_number(p_org_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_date TEXT;
    v_next_val INTEGER;
    v_hold_number TEXT;
BEGIN
    v_date := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');

    -- Upsert sequence and get next value
    INSERT INTO quality_hold_sequences (org_id, sequence_date, current_value)
    VALUES (p_org_id, CURRENT_DATE, 1)
    ON CONFLICT (org_id, sequence_date)
    DO UPDATE SET
        current_value = quality_hold_sequences.current_value + 1,
        updated_at = NOW()
    RETURNING current_value INTO v_next_val;

    -- Format hold number: QH-YYYYMMDD-NNNN
    v_hold_number := 'QH-' || v_date || '-' || LPAD(v_next_val::TEXT, 4, '0');

    RETURN v_hold_number;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Trigger for Auto-Numbering Hold
-- =============================================================================

CREATE OR REPLACE FUNCTION set_hold_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.hold_number IS NULL OR NEW.hold_number = '' THEN
        NEW.hold_number := generate_hold_number(NEW.org_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_set_hold_number
    BEFORE INSERT ON quality_holds
    FOR EACH ROW
    EXECUTE FUNCTION set_hold_number();

-- =============================================================================
-- Trigger for Updated_at
-- =============================================================================

CREATE TRIGGER tr_quality_holds_updated_at
    BEFORE UPDATE ON quality_holds
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- RLS Policies
-- =============================================================================

ALTER TABLE quality_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_hold_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_hold_sequences ENABLE ROW LEVEL SECURITY;

-- Quality Holds Policies
CREATE POLICY "quality_holds_org_isolation"
    ON quality_holds
    FOR ALL
    USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- Quality Hold Items Policies
CREATE POLICY "quality_hold_items_org_isolation"
    ON quality_hold_items
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM quality_holds
            WHERE quality_holds.id = quality_hold_items.hold_id
            AND quality_holds.org_id = (SELECT org_id FROM users WHERE id = auth.uid())
        )
    );

-- Hold Sequences Policies
CREATE POLICY "quality_hold_sequences_org_isolation"
    ON quality_hold_sequences
    FOR ALL
    USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- =============================================================================
-- Grant Permissions
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON quality_holds TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON quality_hold_items TO authenticated;
GRANT SELECT, INSERT, UPDATE ON quality_hold_sequences TO authenticated;
