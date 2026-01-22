-- Migration: 138_create_rma_tables.sql
-- Story: 07.16 - RMA Core CRUD + Approval Workflow
-- Phase: P3-BACKEND (GREEN)
--
-- Creates tables for Return Merchandise Authorization (RMA):
--   - rma_number_sequences: Annual sequence counter per org
--   - rma_requests: RMA header information
--   - rma_lines: RMA line items
--
-- Features:
--   - Auto-generated RMA number (RMA-YYYY-NNNNN)
--   - Reason codes: damaged, expired, wrong_product, quality_issue, customer_change, other
--   - Disposition codes: restock, scrap, quality_hold, rework
--   - Status workflow: pending -> approved -> receiving -> received -> processed -> closed
--   - RLS policies for multi-tenant isolation

-- ============================================================================
-- RMA Number Sequences Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS rma_number_sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    current_value BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT rma_number_sequences_org_year_unique UNIQUE(org_id, year)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rma_sequences_org ON rma_number_sequences(org_id);

-- ============================================================================
-- RMA Requests Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS rma_requests (
    -- Identity
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    rma_number TEXT NOT NULL,

    -- Customer & Order Link
    customer_id UUID NOT NULL REFERENCES customers(id),
    sales_order_id UUID REFERENCES sales_orders(id),

    -- RMA Details
    reason_code TEXT NOT NULL CHECK (reason_code IN ('damaged', 'expired', 'wrong_product', 'quality_issue', 'customer_change', 'other')),
    disposition TEXT CHECK (disposition IN ('restock', 'scrap', 'quality_hold', 'rework')),
    notes TEXT,
    total_value DECIMAL(15,2),

    -- Status & Workflow
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'receiving', 'received', 'processed', 'closed')),
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID NOT NULL REFERENCES users(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Constraints
    CONSTRAINT rma_requests_org_number_unique UNIQUE(org_id, rma_number),
    CONSTRAINT rma_requests_approval_check CHECK (
        (status = 'approved' AND approved_at IS NOT NULL AND approved_by IS NOT NULL) OR
        (status != 'approved')
    )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rma_org_status ON rma_requests(org_id, status);
CREATE INDEX IF NOT EXISTS idx_rma_customer ON rma_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_rma_sales_order ON rma_requests(sales_order_id);
CREATE INDEX IF NOT EXISTS idx_rma_reason ON rma_requests(org_id, reason_code);
CREATE INDEX IF NOT EXISTS idx_rma_created ON rma_requests(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rma_approved ON rma_requests(org_id, approved_at DESC) WHERE approved_at IS NOT NULL;

-- ============================================================================
-- RMA Lines Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS rma_lines (
    -- Identity
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    rma_request_id UUID NOT NULL REFERENCES rma_requests(id) ON DELETE CASCADE,

    -- Product Information
    product_id UUID NOT NULL REFERENCES products(id),
    quantity_expected DECIMAL(15,4) NOT NULL CHECK (quantity_expected > 0),
    quantity_received DECIMAL(15,4) NOT NULL DEFAULT 0 CHECK (quantity_received >= 0),
    lot_number TEXT,

    -- Details
    reason_notes TEXT,
    disposition TEXT CHECK (disposition IN ('restock', 'scrap', 'quality_hold', 'rework')),

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rma_line_request ON rma_lines(rma_request_id);
CREATE INDEX IF NOT EXISTS idx_rma_line_product ON rma_lines(product_id);
CREATE INDEX IF NOT EXISTS idx_rma_line_org ON rma_lines(org_id);

-- ============================================================================
-- RMA Number Generation Function
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_rma_number(p_org_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_year INTEGER;
    v_next_val BIGINT;
    v_rma_number TEXT;
BEGIN
    v_year := EXTRACT(YEAR FROM CURRENT_DATE);

    -- Lock row for this org/year and get next sequence
    INSERT INTO rma_number_sequences (org_id, year, current_value)
    VALUES (p_org_id, v_year, 1)
    ON CONFLICT (org_id, year)
    DO UPDATE SET
        current_value = rma_number_sequences.current_value + 1,
        updated_at = now()
    RETURNING current_value INTO v_next_val;

    -- Format: RMA-YYYY-NNNNN
    v_rma_number := 'RMA-' || v_year || '-' || LPAD(v_next_val::TEXT, 5, '0');

    RETURN v_rma_number;
END;
$$;

-- ============================================================================
-- Auto-Generate RMA Number Trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION set_rma_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.rma_number IS NULL OR NEW.rma_number = '' THEN
        NEW.rma_number := generate_rma_number(NEW.org_id);
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_rma_number
    BEFORE INSERT ON rma_requests
    FOR EACH ROW
    EXECUTE FUNCTION set_rma_number();

-- ============================================================================
-- Update updated_at Trigger
-- ============================================================================

CREATE TRIGGER trigger_rma_requests_updated_at
    BEFORE UPDATE ON rma_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE rma_number_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE rma_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE rma_lines ENABLE ROW LEVEL SECURITY;

-- RMA Number Sequences Policies
CREATE POLICY "rma_sequences_org_isolation" ON rma_number_sequences
    FOR ALL
    USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- RMA Requests Policies
CREATE POLICY "rma_requests_select_org" ON rma_requests
    FOR SELECT
    USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "rma_requests_insert_org" ON rma_requests
    FOR INSERT
    WITH CHECK (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "rma_requests_update_org" ON rma_requests
    FOR UPDATE
    USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()))
    WITH CHECK (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "rma_requests_delete_org" ON rma_requests
    FOR DELETE
    USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- RMA Lines Policies
CREATE POLICY "rma_lines_select_org" ON rma_lines
    FOR SELECT
    USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "rma_lines_insert_org" ON rma_lines
    FOR INSERT
    WITH CHECK (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "rma_lines_update_org" ON rma_lines
    FOR UPDATE
    USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()))
    WITH CHECK (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "rma_lines_delete_org" ON rma_lines
    FOR DELETE
    USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- ============================================================================
-- Grants
-- ============================================================================

GRANT ALL ON rma_number_sequences TO authenticated;
GRANT ALL ON rma_requests TO authenticated;
GRANT ALL ON rma_lines TO authenticated;

-- Service role bypasses RLS
GRANT ALL ON rma_number_sequences TO service_role;
GRANT ALL ON rma_requests TO service_role;
GRANT ALL ON rma_lines TO service_role;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE rma_number_sequences IS 'Sequence counter for RMA number generation per org per year';
COMMENT ON TABLE rma_requests IS 'Return Merchandise Authorization (RMA) requests';
COMMENT ON TABLE rma_lines IS 'RMA line items - products to be returned';
COMMENT ON FUNCTION generate_rma_number(UUID) IS 'Generate next RMA number in format RMA-YYYY-NNNNN (annual sequence per org)';
