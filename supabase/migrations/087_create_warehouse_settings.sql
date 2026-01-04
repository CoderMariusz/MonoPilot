-- Migration: 087 - Create Warehouse Settings Table
-- Story: 05.0 - Warehouse Settings (Module Configuration)
-- Phase: P3 (GREEN - Backend Implementation)
-- Description: Creates warehouse_settings table with RLS policies, triggers, and audit table

-- =====================================================
-- 1. CREATE WAREHOUSE_SETTINGS TABLE
-- =====================================================
CREATE TABLE warehouse_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Phase 0: Core Configuration (CRITICAL for Epic 04)
  auto_generate_lp_number BOOLEAN NOT NULL DEFAULT true,
  lp_number_prefix VARCHAR(10) NOT NULL DEFAULT 'LP',
  lp_number_sequence_length INTEGER NOT NULL DEFAULT 8 CHECK (lp_number_sequence_length BETWEEN 4 AND 12),
  enable_split_merge BOOLEAN NOT NULL DEFAULT true,
  require_qa_on_receipt BOOLEAN NOT NULL DEFAULT true,
  default_qa_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (default_qa_status IN ('pending', 'passed', 'failed', 'quarantine')),
  enable_expiry_tracking BOOLEAN NOT NULL DEFAULT true,
  require_expiry_on_receipt BOOLEAN NOT NULL DEFAULT false,
  expiry_warning_days INTEGER NOT NULL DEFAULT 30 CHECK (expiry_warning_days BETWEEN 1 AND 365),
  enable_batch_tracking BOOLEAN NOT NULL DEFAULT true,
  require_batch_on_receipt BOOLEAN NOT NULL DEFAULT false,
  enable_supplier_batch BOOLEAN NOT NULL DEFAULT true,
  enable_fifo BOOLEAN NOT NULL DEFAULT true,
  enable_fefo BOOLEAN NOT NULL DEFAULT false,

  -- Phase 1: Receipt & Inventory
  enable_asn BOOLEAN NOT NULL DEFAULT false,
  allow_over_receipt BOOLEAN NOT NULL DEFAULT false,
  over_receipt_tolerance_pct DECIMAL(5,2) NOT NULL DEFAULT 0.00 CHECK (over_receipt_tolerance_pct BETWEEN 0 AND 100),
  enable_transit_location BOOLEAN NOT NULL DEFAULT true,

  -- Phase 2: Scanner & Labels
  scanner_idle_timeout_sec INTEGER NOT NULL DEFAULT 300 CHECK (scanner_idle_timeout_sec BETWEEN 60 AND 3600),
  scanner_sound_feedback BOOLEAN NOT NULL DEFAULT true,
  print_label_on_receipt BOOLEAN NOT NULL DEFAULT true,
  label_copies_default INTEGER NOT NULL DEFAULT 1 CHECK (label_copies_default BETWEEN 1 AND 10),

  -- Phase 3: Advanced Features
  enable_pallets BOOLEAN NOT NULL DEFAULT false,
  enable_gs1_barcodes BOOLEAN NOT NULL DEFAULT false,
  enable_catch_weight BOOLEAN NOT NULL DEFAULT false,
  enable_location_zones BOOLEAN NOT NULL DEFAULT false,
  enable_location_capacity BOOLEAN NOT NULL DEFAULT false,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),

  -- Constraints
  CONSTRAINT warehouse_settings_org_unique UNIQUE(org_id),
  CONSTRAINT warehouse_settings_prefix_format CHECK (lp_number_prefix ~ '^[A-Z0-9-]+$'),
  CONSTRAINT warehouse_settings_prefix_length CHECK (char_length(lp_number_prefix) BETWEEN 1 AND 10)
);

-- Index for org_id lookups
CREATE INDEX idx_warehouse_settings_org_id ON warehouse_settings(org_id);

-- =====================================================
-- 2. CREATE AUDIT TABLE
-- =====================================================
CREATE TABLE warehouse_settings_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  settings_id UUID NOT NULL REFERENCES warehouse_settings(id) ON DELETE CASCADE,
  setting_name VARCHAR(100) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID NOT NULL REFERENCES users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for audit queries
CREATE INDEX idx_warehouse_settings_audit_org ON warehouse_settings_audit(org_id);
CREATE INDEX idx_warehouse_settings_audit_changed_at ON warehouse_settings_audit(changed_at DESC);

-- =====================================================
-- 3. CREATE TRIGGERS
-- =====================================================

-- Trigger: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_warehouse_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_warehouse_settings_updated_at
BEFORE UPDATE ON warehouse_settings
FOR EACH ROW
EXECUTE FUNCTION update_warehouse_settings_timestamp();

-- Trigger: Initialize settings on org creation
CREATE OR REPLACE FUNCTION init_warehouse_settings_for_org()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO warehouse_settings (org_id)
  VALUES (NEW.id)
  ON CONFLICT (org_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_init_warehouse_settings
AFTER INSERT ON organizations
FOR EACH ROW
EXECUTE FUNCTION init_warehouse_settings_for_org();

-- =====================================================
-- 4. CREATE RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE warehouse_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_settings_audit ENABLE ROW LEVEL SECURITY;

-- Policy: SELECT - Org isolation
CREATE POLICY "warehouse_settings_select" ON warehouse_settings
FOR SELECT TO authenticated
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- Policy: INSERT - Org isolation + admin only
CREATE POLICY "warehouse_settings_insert" ON warehouse_settings
FOR INSERT TO authenticated
WITH CHECK (
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  AND (
    (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
    IN ('SUPER_ADMIN', 'ADMIN')
  )
);

-- Policy: UPDATE - Org isolation + permission check
CREATE POLICY "warehouse_settings_update" ON warehouse_settings
FOR UPDATE TO authenticated
USING (
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  AND (
    (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
    IN ('SUPER_ADMIN', 'ADMIN', 'WH_MANAGER')
  )
);

-- Policy: DELETE - Disabled (settings should not be deleted)
-- No DELETE policy - prevents accidental deletion

-- Audit table policies
CREATE POLICY "warehouse_settings_audit_select" ON warehouse_settings_audit
FOR SELECT TO authenticated
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "warehouse_settings_audit_insert" ON warehouse_settings_audit
FOR INSERT TO authenticated
WITH CHECK (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- =====================================================
-- 5. GRANT PERMISSIONS
-- =====================================================
GRANT SELECT, INSERT, UPDATE ON warehouse_settings TO authenticated;
GRANT SELECT, INSERT ON warehouse_settings_audit TO authenticated;

-- =====================================================
-- ROLLBACK (for testing)
-- =====================================================
-- DROP TRIGGER IF EXISTS tr_warehouse_settings_updated_at ON warehouse_settings;
-- DROP TRIGGER IF EXISTS tr_init_warehouse_settings ON organizations;
-- DROP FUNCTION IF EXISTS update_warehouse_settings_timestamp();
-- DROP FUNCTION IF EXISTS init_warehouse_settings_for_org();
-- DROP TABLE IF EXISTS warehouse_settings_audit CASCADE;
-- DROP TABLE IF EXISTS warehouse_settings CASCADE;
