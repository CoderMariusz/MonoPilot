-- Migration 094: ASN RLS Policies (Story 05.8)
-- Purpose: Row Level Security policies following ADR-013 pattern
-- Phase: GREEN

-- =============================================================================
-- ASNs Table Policies
-- =============================================================================

-- ASNs SELECT: All users can view their org's ASNs
CREATE POLICY asns_select ON asns
    FOR SELECT
    USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- ASNs INSERT: Planners, warehouse managers, production managers can create ASNs
CREATE POLICY asns_insert ON asns
    FOR INSERT
    WITH CHECK (
        org_id = (SELECT org_id FROM users WHERE id = auth.uid())
        AND (
            (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
            IN ('owner', 'admin', 'planner', 'warehouse_manager', 'production_manager')
        )
    );

-- ASNs UPDATE: Can only update pending ASNs
CREATE POLICY asns_update ON asns
    FOR UPDATE
    USING (
        org_id = (SELECT org_id FROM users WHERE id = auth.uid())
        AND status IN ('pending')
        AND (
            (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
            IN ('owner', 'admin', 'planner', 'warehouse_manager', 'production_manager')
        )
    );

-- ASNs DELETE: Can only delete pending ASNs
CREATE POLICY asns_delete ON asns
    FOR DELETE
    USING (
        org_id = (SELECT org_id FROM users WHERE id = auth.uid())
        AND status = 'pending'
        AND (
            (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
            IN ('owner', 'admin', 'planner', 'warehouse_manager')
        )
    );

-- =============================================================================
-- ASN Items Table Policies (via FK to asns)
-- =============================================================================

-- ASN Items SELECT: Can view items of accessible ASNs
CREATE POLICY asn_items_select ON asn_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM asns
            WHERE asns.id = asn_items.asn_id
              AND asns.org_id = (SELECT org_id FROM users WHERE id = auth.uid())
        )
    );

-- ASN Items INSERT: Can add items to pending ASNs
CREATE POLICY asn_items_insert ON asn_items
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM asns
            WHERE asns.id = asn_items.asn_id
              AND asns.org_id = (SELECT org_id FROM users WHERE id = auth.uid())
              AND asns.status = 'pending'
        )
    );

-- ASN Items UPDATE: Can only update items of pending ASNs
CREATE POLICY asn_items_update ON asn_items
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM asns
            WHERE asns.id = asn_items.asn_id
              AND asns.org_id = (SELECT org_id FROM users WHERE id = auth.uid())
              AND asns.status = 'pending'
        )
    );

-- ASN Items DELETE: Can only delete items of pending ASNs
CREATE POLICY asn_items_delete ON asn_items
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM asns
            WHERE asns.id = asn_items.asn_id
              AND asns.org_id = (SELECT org_id FROM users WHERE id = auth.uid())
              AND asns.status = 'pending'
        )
    );

-- Comments
COMMENT ON POLICY asns_select ON asns IS 'Users can view their org ASNs (ADR-013)';
COMMENT ON POLICY asns_insert ON asns IS 'Planners/managers can create ASNs (ADR-013)';
COMMENT ON POLICY asns_update ON asns IS 'Can only update pending ASNs (ADR-013)';
COMMENT ON POLICY asns_delete ON asns IS 'Can only delete pending ASNs (ADR-013)';
COMMENT ON POLICY asn_items_select ON asn_items IS 'Can view items of accessible ASNs (ADR-013)';
COMMENT ON POLICY asn_items_insert ON asn_items IS 'Can add items to pending ASNs (ADR-013)';
COMMENT ON POLICY asn_items_update ON asn_items IS 'Can update items of pending ASNs (ADR-013)';
COMMENT ON POLICY asn_items_delete ON asn_items IS 'Can delete items of pending ASNs (ADR-013)';
