-- Migration: Create PO Status Configuration tables
-- Story: 03.7 - PO Status Lifecycle (Configurable Statuses)
-- Date: 2026-01-02
--
-- Creates:
-- - po_statuses: Configurable PO status definitions
-- - po_status_transitions: Allowed status transition rules
-- - RLS policies for admin-only configuration
-- - Function to create default statuses for new orgs
-- - Indexes for performance

-- ============================================================================
-- PO STATUSES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS po_statuses (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code              VARCHAR(50) NOT NULL,
  name              VARCHAR(100) NOT NULL,
  color             VARCHAR(20) NOT NULL DEFAULT 'gray',
  display_order     INTEGER NOT NULL DEFAULT 1,
  is_system         BOOLEAN NOT NULL DEFAULT false,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  description       TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT po_statuses_org_code_unique UNIQUE(org_id, code),
  CONSTRAINT po_statuses_color_check CHECK (
    color IN ('gray', 'blue', 'yellow', 'green', 'purple', 'emerald', 'red', 'orange', 'amber', 'teal', 'indigo')
  ),
  CONSTRAINT po_statuses_code_format CHECK (
    code ~ '^[a-z][a-z0-9_]*$'
  )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_po_statuses_org ON po_statuses(org_id, display_order);
CREATE INDEX IF NOT EXISTS idx_po_statuses_org_code ON po_statuses(org_id, code);
CREATE INDEX IF NOT EXISTS idx_po_statuses_is_system ON po_statuses(org_id, is_system);

-- ============================================================================
-- PO STATUS TRANSITIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS po_status_transitions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  from_status_id      UUID NOT NULL REFERENCES po_statuses(id) ON DELETE CASCADE,
  to_status_id        UUID NOT NULL REFERENCES po_statuses(id) ON DELETE CASCADE,
  is_system           BOOLEAN NOT NULL DEFAULT false,
  requires_approval   BOOLEAN NOT NULL DEFAULT false,
  requires_reason     BOOLEAN NOT NULL DEFAULT false,
  condition_function  TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT po_transitions_unique UNIQUE(org_id, from_status_id, to_status_id),
  CONSTRAINT po_transitions_no_self_loop CHECK (from_status_id != to_status_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_po_transitions_from ON po_status_transitions(from_status_id);
CREATE INDEX IF NOT EXISTS idx_po_transitions_to ON po_status_transitions(to_status_id);
CREATE INDEX IF NOT EXISTS idx_po_transitions_org ON po_status_transitions(org_id);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE po_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE po_status_transitions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES - PO STATUSES
-- ============================================================================

-- SELECT: All authenticated users in org can read statuses (for dropdowns)
CREATE POLICY po_statuses_select ON po_statuses
  FOR SELECT
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- INSERT: Only admin/owner can create statuses
CREATE POLICY po_statuses_insert ON po_statuses
  FOR INSERT
  WITH CHECK (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
      (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
      IN ('owner', 'admin', 'super_admin')
    )
  );

-- UPDATE: Only admin/owner can update statuses
CREATE POLICY po_statuses_update ON po_statuses
  FOR UPDATE
  USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
      (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
      IN ('owner', 'admin', 'super_admin')
    )
  );

-- DELETE: Only admin/owner can delete non-system statuses
CREATE POLICY po_statuses_delete ON po_statuses
  FOR DELETE
  USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND is_system = false
    AND (
      (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
      IN ('owner', 'admin', 'super_admin')
    )
  );

-- ============================================================================
-- RLS POLICIES - PO STATUS TRANSITIONS
-- ============================================================================

-- SELECT: All authenticated users in org can read transitions
CREATE POLICY po_transitions_select ON po_status_transitions
  FOR SELECT
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- INSERT: Only admin/owner can create transitions
CREATE POLICY po_transitions_insert ON po_status_transitions
  FOR INSERT
  WITH CHECK (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
      (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
      IN ('owner', 'admin', 'super_admin')
    )
  );

-- UPDATE: Only admin/owner can update non-system transitions
CREATE POLICY po_transitions_update ON po_status_transitions
  FOR UPDATE
  USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND is_system = false
    AND (
      (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
      IN ('owner', 'admin', 'super_admin')
    )
  );

-- DELETE: Only admin/owner can delete non-system transitions
CREATE POLICY po_transitions_delete ON po_status_transitions
  FOR DELETE
  USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND is_system = false
    AND (
      (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
      IN ('owner', 'admin', 'super_admin')
    )
  );

-- ============================================================================
-- FUNCTION: Create Default PO Statuses
-- ============================================================================

CREATE OR REPLACE FUNCTION create_default_po_statuses(p_org_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_draft_id UUID;
  v_submitted_id UUID;
  v_pending_approval_id UUID;
  v_confirmed_id UUID;
  v_receiving_id UUID;
  v_closed_id UUID;
  v_cancelled_id UUID;
BEGIN
  -- Check if statuses already exist for this org
  IF EXISTS (SELECT 1 FROM po_statuses WHERE org_id = p_org_id LIMIT 1) THEN
    RAISE NOTICE 'PO statuses already exist for org %', p_org_id;
    RETURN;
  END IF;

  -- Create default statuses
  INSERT INTO po_statuses (org_id, code, name, color, display_order, is_system, description)
  VALUES (p_org_id, 'draft', 'Draft', 'gray', 1, true, 'PO is being prepared, not yet submitted')
  RETURNING id INTO v_draft_id;

  INSERT INTO po_statuses (org_id, code, name, color, display_order, is_system, description)
  VALUES (p_org_id, 'submitted', 'Submitted', 'blue', 2, true, 'PO has been submitted for processing')
  RETURNING id INTO v_submitted_id;

  INSERT INTO po_statuses (org_id, code, name, color, display_order, is_system, description)
  VALUES (p_org_id, 'pending_approval', 'Pending Approval', 'yellow', 3, false, 'PO is awaiting approval')
  RETURNING id INTO v_pending_approval_id;

  INSERT INTO po_statuses (org_id, code, name, color, display_order, is_system, description)
  VALUES (p_org_id, 'confirmed', 'Confirmed', 'green', 4, true, 'PO has been confirmed by supplier')
  RETURNING id INTO v_confirmed_id;

  INSERT INTO po_statuses (org_id, code, name, color, display_order, is_system, description)
  VALUES (p_org_id, 'receiving', 'Receiving', 'purple', 5, true, 'Goods are being received')
  RETURNING id INTO v_receiving_id;

  INSERT INTO po_statuses (org_id, code, name, color, display_order, is_system, description)
  VALUES (p_org_id, 'closed', 'Closed', 'emerald', 6, true, 'PO is complete')
  RETURNING id INTO v_closed_id;

  INSERT INTO po_statuses (org_id, code, name, color, display_order, is_system, description)
  VALUES (p_org_id, 'cancelled', 'Cancelled', 'red', 7, true, 'PO has been cancelled')
  RETURNING id INTO v_cancelled_id;

  -- Create default transitions
  -- From draft
  INSERT INTO po_status_transitions (org_id, from_status_id, to_status_id, is_system)
  VALUES (p_org_id, v_draft_id, v_submitted_id, false);
  INSERT INTO po_status_transitions (org_id, from_status_id, to_status_id, is_system)
  VALUES (p_org_id, v_draft_id, v_cancelled_id, false);

  -- From submitted
  INSERT INTO po_status_transitions (org_id, from_status_id, to_status_id, is_system)
  VALUES (p_org_id, v_submitted_id, v_pending_approval_id, false);
  INSERT INTO po_status_transitions (org_id, from_status_id, to_status_id, is_system)
  VALUES (p_org_id, v_submitted_id, v_confirmed_id, false);
  INSERT INTO po_status_transitions (org_id, from_status_id, to_status_id, is_system)
  VALUES (p_org_id, v_submitted_id, v_cancelled_id, false);

  -- From pending_approval
  INSERT INTO po_status_transitions (org_id, from_status_id, to_status_id, is_system)
  VALUES (p_org_id, v_pending_approval_id, v_confirmed_id, false);
  INSERT INTO po_status_transitions (org_id, from_status_id, to_status_id, is_system)
  VALUES (p_org_id, v_pending_approval_id, v_cancelled_id, false);

  -- From confirmed (system transitions)
  INSERT INTO po_status_transitions (org_id, from_status_id, to_status_id, is_system)
  VALUES (p_org_id, v_confirmed_id, v_receiving_id, true);
  INSERT INTO po_status_transitions (org_id, from_status_id, to_status_id, is_system)
  VALUES (p_org_id, v_confirmed_id, v_cancelled_id, false);

  -- From receiving (system transitions)
  INSERT INTO po_status_transitions (org_id, from_status_id, to_status_id, is_system)
  VALUES (p_org_id, v_receiving_id, v_closed_id, true);
  INSERT INTO po_status_transitions (org_id, from_status_id, to_status_id, is_system)
  VALUES (p_org_id, v_receiving_id, v_cancelled_id, false);

  RAISE NOTICE 'Default PO statuses created for org %', p_org_id;
END;
$$;

-- ============================================================================
-- TRIGGER: Auto-update updated_at
-- ============================================================================

CREATE TRIGGER tr_po_statuses_updated_at
  BEFORE UPDATE ON po_statuses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON po_statuses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON po_status_transitions TO authenticated;
GRANT EXECUTE ON FUNCTION create_default_po_statuses(UUID) TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE po_statuses IS 'Configurable PO status definitions per organization (Story 03.7)';
COMMENT ON TABLE po_status_transitions IS 'Allowed status transition rules (Story 03.7)';

COMMENT ON COLUMN po_statuses.code IS 'Unique status code within org (lowercase + underscores)';
COMMENT ON COLUMN po_statuses.name IS 'Display name for the status';
COMMENT ON COLUMN po_statuses.color IS 'Badge color: gray, blue, yellow, green, purple, emerald, red, orange, amber, teal, indigo';
COMMENT ON COLUMN po_statuses.display_order IS 'Order in dropdowns and lists (1-based)';
COMMENT ON COLUMN po_statuses.is_system IS 'True for system statuses that cannot be deleted';
COMMENT ON COLUMN po_statuses.is_active IS 'False to hide from new POs but keep for existing';

COMMENT ON COLUMN po_status_transitions.from_status_id IS 'Status to transition from';
COMMENT ON COLUMN po_status_transitions.to_status_id IS 'Status to transition to';
COMMENT ON COLUMN po_status_transitions.is_system IS 'True for system-required transitions that cannot be removed';
COMMENT ON COLUMN po_status_transitions.requires_approval IS 'True if this transition requires approval';
COMMENT ON COLUMN po_status_transitions.requires_reason IS 'True if user must provide a reason';
COMMENT ON COLUMN po_status_transitions.condition_function IS 'Optional SQL function name for conditional validation';

COMMENT ON FUNCTION create_default_po_statuses(UUID) IS 'Creates default PO statuses and transitions for a new organization';
