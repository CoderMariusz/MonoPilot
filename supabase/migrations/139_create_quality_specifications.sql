-- Migration: 139_create_quality_specifications.sql
-- Story: 06.3 - Product Specifications
-- Phase: P3 - Backend Implementation (GREEN)
--
-- Creates quality_specifications table with:
-- - Versioned specifications per product
-- - Approval workflow (draft -> active -> expired/superseded)
-- - Review frequency tracking
-- - Active specification resolution logic

-- Create quality_specifications table
CREATE TABLE IF NOT EXISTS quality_specifications (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                  UUID NOT NULL REFERENCES organizations(id),
    product_id              UUID NOT NULL REFERENCES products(id),
    spec_number             TEXT NOT NULL,
    version                 INTEGER NOT NULL DEFAULT 1,
    name                    TEXT NOT NULL,
    description             TEXT,
    effective_date          DATE NOT NULL,
    expiry_date             DATE,
    status                  TEXT NOT NULL DEFAULT 'draft'
                            CHECK (status IN ('draft', 'active', 'expired', 'superseded')),
    approved_by             UUID REFERENCES users(id),
    approved_at             TIMESTAMPTZ,
    superseded_by           UUID REFERENCES quality_specifications(id),
    superseded_at           TIMESTAMPTZ,
    review_frequency_days   INTEGER DEFAULT 365,
    next_review_date        DATE,
    last_review_date        DATE,
    notes                   TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              UUID REFERENCES users(id),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by              UUID REFERENCES users(id),

    CONSTRAINT uq_spec_number_version UNIQUE (org_id, spec_number, version)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_quality_specs_org_id ON quality_specifications(org_id);
CREATE INDEX IF NOT EXISTS idx_quality_specs_product ON quality_specifications(product_id);
CREATE INDEX IF NOT EXISTS idx_quality_specs_status ON quality_specifications(org_id, status);
CREATE INDEX IF NOT EXISTS idx_quality_specs_effective ON quality_specifications(org_id, effective_date, expiry_date);
CREATE INDEX IF NOT EXISTS idx_quality_specs_review ON quality_specifications(org_id, next_review_date)
    WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_quality_specs_number ON quality_specifications(org_id, spec_number);

-- RLS Policies
ALTER TABLE quality_specifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "quality_specifications_select" ON quality_specifications;
DROP POLICY IF EXISTS "quality_specifications_insert" ON quality_specifications;
DROP POLICY IF EXISTS "quality_specifications_update" ON quality_specifications;
DROP POLICY IF EXISTS "quality_specifications_delete" ON quality_specifications;

CREATE POLICY "quality_specifications_select" ON quality_specifications
    FOR SELECT USING (
        org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    );

CREATE POLICY "quality_specifications_insert" ON quality_specifications
    FOR INSERT WITH CHECK (
        org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    );

CREATE POLICY "quality_specifications_update" ON quality_specifications
    FOR UPDATE USING (
        org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    );

CREATE POLICY "quality_specifications_delete" ON quality_specifications
    FOR DELETE USING (
        org_id = (SELECT org_id FROM users WHERE id = auth.uid())
        AND status = 'draft'  -- Only draft specs can be deleted
    );

-- Trigger for updated_at (reuse existing function if it exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_quality_specifications_updated_at') THEN
        CREATE TRIGGER update_quality_specifications_updated_at
            BEFORE UPDATE ON quality_specifications
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Function to resolve active specification for a product
CREATE OR REPLACE FUNCTION get_active_specification(p_org_id UUID, p_product_id UUID, p_as_of_date DATE DEFAULT CURRENT_DATE)
RETURNS UUID AS $$
DECLARE
    v_spec_id UUID;
BEGIN
    SELECT id INTO v_spec_id
    FROM quality_specifications
    WHERE org_id = p_org_id
      AND product_id = p_product_id
      AND status = 'active'
      AND effective_date <= p_as_of_date
      AND (expiry_date IS NULL OR expiry_date >= p_as_of_date)
    ORDER BY effective_date DESC, version DESC
    LIMIT 1;

    RETURN v_spec_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to supersede specification when new version activated
CREATE OR REPLACE FUNCTION supersede_previous_spec()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'active' AND (OLD.status IS NULL OR OLD.status != 'active') THEN
        -- Supersede any other active specs for this product
        UPDATE quality_specifications
        SET status = 'superseded',
            superseded_by = NEW.id,
            superseded_at = now(),
            updated_at = now()
        WHERE org_id = NEW.org_id
          AND product_id = NEW.product_id
          AND status = 'active'
          AND id != NEW.id;

        -- Calculate next review date
        IF NEW.review_frequency_days IS NOT NULL THEN
            NEW.next_review_date := NEW.effective_date + (NEW.review_frequency_days || ' days')::INTERVAL;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists (for idempotency)
DROP TRIGGER IF EXISTS trigger_supersede_spec ON quality_specifications;

CREATE TRIGGER trigger_supersede_spec
    BEFORE UPDATE ON quality_specifications
    FOR EACH ROW
    EXECUTE FUNCTION supersede_previous_spec();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON quality_specifications TO authenticated;
