-- Migration 029: Create po_approvals and planning_settings tables
-- Epic 3 Batch 3A: Purchase Orders & Suppliers
-- Story 3.4: PO Approval Workflow
-- Story 3.5: Configurable PO Statuses
-- Date: 2025-01-23

-- ============================================================================
-- PO Approvals Audit Trail (Story 3.4)
-- ============================================================================

CREATE TABLE po_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  rejection_reason TEXT,
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT approval_status_valid CHECK (status IN ('pending', 'approved', 'rejected'))
);

CREATE INDEX idx_po_approvals_po ON po_approvals(po_id);
CREATE INDEX idx_po_approvals_status ON po_approvals(status);
CREATE INDEX idx_po_approvals_org ON po_approvals(org_id);

ALTER TABLE po_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY po_approvals_isolation ON po_approvals
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

COMMENT ON TABLE po_approvals IS 'Purchase order approval history audit trail - Story 3.4';
COMMENT ON COLUMN po_approvals.status IS 'Approval action: pending, approved, rejected';
COMMENT ON COLUMN po_approvals.rejection_reason IS 'Required if status = rejected';

-- ============================================================================
-- Planning Settings (Story 3.5)
-- ============================================================================

CREATE TABLE planning_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id),

  -- PO Statuses (Story 3.5)
  po_statuses JSONB NOT NULL DEFAULT '[
    {"code": "draft", "label": "Draft", "color": "gray", "is_default": true, "sequence": 1},
    {"code": "submitted", "label": "Submitted", "color": "blue", "is_default": false, "sequence": 2},
    {"code": "confirmed", "label": "Confirmed", "color": "green", "is_default": false, "sequence": 3},
    {"code": "receiving", "label": "Receiving", "color": "yellow", "is_default": false, "sequence": 4},
    {"code": "closed", "label": "Closed", "color": "purple", "is_default": false, "sequence": 5}
  ]'::jsonb,

  po_default_status VARCHAR(50) DEFAULT 'draft',

  -- PO Approval Settings (Story 3.4)
  po_require_approval BOOLEAN DEFAULT false,
  po_approval_threshold NUMERIC(15,2), -- Optional threshold amount

  -- Field visibility toggles
  po_payment_terms_visible BOOLEAN DEFAULT true,
  po_shipping_method_visible BOOLEAN DEFAULT true,
  po_notes_visible BOOLEAN DEFAULT true,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint: one row per org
  CONSTRAINT idx_planning_settings_org UNIQUE (org_id)
);

ALTER TABLE planning_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY planning_settings_isolation ON planning_settings
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

COMMENT ON TABLE planning_settings IS 'Planning module settings: PO statuses, approval workflow - Stories 3.4, 3.5';
COMMENT ON COLUMN planning_settings.po_statuses IS 'JSONB array of custom PO statuses with code, label, color, is_default, sequence';
COMMENT ON COLUMN planning_settings.po_default_status IS 'Default status for new POs (e.g., "draft")';
COMMENT ON COLUMN planning_settings.po_require_approval IS 'Toggle approval workflow';
COMMENT ON COLUMN planning_settings.po_approval_threshold IS 'Approve only if total > threshold (optional)';

-- ============================================================================
-- Initialize planning_settings for existing orgs
-- ============================================================================

-- Insert default planning_settings for all existing organizations
INSERT INTO planning_settings (org_id)
SELECT id FROM organizations
ON CONFLICT (org_id) DO NOTHING;
