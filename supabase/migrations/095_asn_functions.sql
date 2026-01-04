-- Migration 095: ASN Functions (Story 05.8)
-- Purpose: Functions for ASN number generation and status updates
-- Phase: GREEN

-- =============================================================================
-- Function: Generate ASN Number
-- =============================================================================
CREATE OR REPLACE FUNCTION generate_asn_number(p_org_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_year TEXT;
    v_next_seq INTEGER;
    v_prefix TEXT;
BEGIN
    v_year := TO_CHAR(NOW(), 'YYYY');
    v_prefix := 'ASN-' || v_year || '-';

    SELECT COALESCE(MAX(
        CAST(SUBSTRING(asn_number FROM LENGTH(v_prefix) + 1) AS INTEGER)
    ), 0) + 1
    INTO v_next_seq
    FROM asns
    WHERE org_id = p_org_id
      AND asn_number LIKE v_prefix || '%';

    RETURN v_prefix || LPAD(v_next_seq::TEXT, 5, '0');
END;
$$;

COMMENT ON FUNCTION generate_asn_number IS 'Generates next ASN number as ASN-YYYY-NNNNN for org/year (Story 05.8)';

-- =============================================================================
-- Function: Update ASN Status
-- =============================================================================
CREATE OR REPLACE FUNCTION update_asn_status(p_asn_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_items INTEGER;
    v_items_with_receipts INTEGER;
    v_fully_received_items INTEGER;
    v_new_status TEXT;
BEGIN
    SELECT COUNT(*),
           COUNT(*) FILTER (WHERE received_qty > 0),
           COUNT(*) FILTER (WHERE received_qty >= expected_qty)
    INTO v_total_items, v_items_with_receipts, v_fully_received_items
    FROM asn_items
    WHERE asn_id = p_asn_id;

    IF v_items_with_receipts = 0 THEN
        v_new_status := 'pending';
    ELSIF v_fully_received_items = v_total_items THEN
        v_new_status := 'received';
    ELSE
        v_new_status := 'partial';
    END IF;

    UPDATE asns
    SET status = v_new_status,
        actual_date = CASE WHEN v_new_status = 'received' THEN CURRENT_DATE ELSE actual_date END,
        updated_at = NOW()
    WHERE id = p_asn_id
      AND status NOT IN ('cancelled');

    RETURN v_new_status;
END;
$$;

COMMENT ON FUNCTION update_asn_status IS 'Updates ASN status based on received quantities (Story 05.8)';
